"""Live workspace adapter; navigation remains per window, data events are scoped."""

import asyncio, contextlib, hashlib, json, time, uuid, os
from pathlib import Path
from fastapi import HTTPException, Request
from .workspace_sync import WorkspaceHub, scope_key

CHAT_EVENTS = {
    "live_input_transcript",
    "live_output_transcript",
    "live_generation_complete",
}


class WorkspaceService:
    def __init__(
        self,
        app,
        manager,
        state,
        contexts,
        sessions,
        artifacts,
        request_context,
        theme_store,
    ):
        self.manager = manager
        self.state = state
        self.contexts = contexts
        self.sessions = sessions
        self.artifacts = artifacts
        self.request_context = request_context
        self.theme_store = theme_store
        self.hub = None
        self.task = None
        self.fingerprints = {}
        self.turn_cards = {}
        self.channel_locks = {}
        self.turn_waiters = {}
        self.tasks = set()
        self.initialized = False
        self.audio_locks = {}
        self.turn_tasks = {}
        self.boot_id = uuid.uuid4().hex
        self.install(app)

    def store(self):
        if self.hub is None:
            self.hub = WorkspaceHub(
                self.state.live_memory.memory_path.parent / "workspace-sync.sqlite3"
            )
        return self.hub

    def pairing_enabled(self):
        return os.environ.get("NOVA_PAIRED_DEVICES_ENABLED", "0") == "1"

    def context(self, client):
        socket = self.manager.websocket_for(client)
        live = self.state.live_sessions.get(socket)
        return {
            "profile_id": getattr(live, "profile_id", ""),
            "project_id": getattr(live, "project_id", ""),
            "guest": bool(getattr(live, "guest", False)),
            "session_id": self.sessions.get(client, ""),
        }

    async def start(self):
        self.store()
        self.task = asyncio.create_task(self.watch())

    async def stop(self):
        for task in list(self.tasks):
            task.cancel()
        if self.task:
            self.task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self.task

    async def send(self, client, payload):
        socket = self.manager.websocket_for(client)
        if socket:
            await self.manager.send_to_client(socket, payload)

    async def emit(self, context, resource, entity="", data=None):
        event = await asyncio.to_thread(
            self.store().append, context, resource, entity, data
        )
        for client, row in list(self.store().windows.items()):
            if row["scope"] == scope_key(context):
                await self.send(client, event)
        return event

    async def presence(self):
        for client in list(self.store().windows):
            await self.send(
                client,
                {
                    "type": "workspace_presence",
                    **self.store().presence(self.context(client)),
                },
            )

    async def handle(self, client, message, device="local"):
        kind = message.get("type", "")
        hub = self.store()
        if kind == "workspace_hello":
            if device != "local" and not self.pairing_enabled():
                await self.send(
                    client,
                    {
                        "type": "workspace_error",
                        "message": "Paired computers are disabled on this host.",
                    },
                )
                return True
            try:
                hub.register(client, message, self.context(client), device)
            except ValueError:
                await self.send(client, {"type": "workspace_identity_conflict"})
                return True
            hub.touch(
                client, self.contexts.get(client, {}), message.get("conversation_id")
            )
            bootstrap = hub.bootstrap(
                self.context(client), int(message.get("since") or 0)
            )
            bootstrap.update(
                boot_id=self.boot_id,
                reconcile=bootstrap["reconcile"]
                or message.get("boot_id") != self.boot_id,
            )
            await self.send(client, {"type": "workspace_bootstrap", **bootstrap})
            await self.presence()
            return True
        if kind == "workspace_heartbeat":
            hub.touch(
                client, self.contexts.get(client, {}), message.get("conversation_id")
            )
            if client in hub.windows:
                hub.windows[client]["scope"] = scope_key(self.context(client))
            missed = (
                hub.bootstrap(self.context(client), int(message["since"]))
                if "since" in message
                else {}
            )
            await self.send(
                client,
                {
                    "type": "workspace_heartbeat_ack",
                    "voice": hub.voice,
                    "events": missed.get("events", []),
                    "reconcile": len(missed.get("events", [])) >= 500,
                },
            )
            return True
        if kind == "workspace_voice_acquire":
            try:
                result = hub.acquire_voice(client)
            except ValueError:
                result = {"granted": False}
            await self.send(client, {"type": "workspace_voice_result", **result})
            await self.presence()
            return True
        if kind == "workspace_voice_release":
            hub.release_voice(client)
            self.end_audio_lock(client)
            await self.presence()
            return True
        if kind == "workspace_sound_claim":
            marker = (
                "sound:"
                + scope_key(self.context(client))
                + ":"
                + hashlib.sha256(str(message.get("key", ""))[:300].encode()).hexdigest()
            )
            with hub.lock, hub.db() as db:
                cursor = db.execute(
                    "INSERT OR IGNORE INTO settings VALUES(?,?)",
                    (marker, str(time.time())),
                )
                allowed = cursor.rowcount == 1
            await self.send(
                client,
                {
                    "type": "workspace_sound_result",
                    "request_id": message.get("request_id"),
                    "allowed": allowed,
                },
            )
            return True
        if kind == "workspace_theme":
            theme = message.get("theme", {})
            try:
                identifier = str(theme.get("id", ""))
                from .theme_state import BUILTIN_THEMES

                validated = self.theme_store._validate_document(
                    theme,
                    expected_id=(
                        uuid.uuid4().hex if identifier in BUILTIN_THEMES else identifier
                    ),
                )
                if identifier in BUILTIN_THEMES:
                    validated.update(id=identifier, builtin=True)
                theme = validated
                event = hub.set_theme(self.context(client), theme)
                for other, row in list(hub.windows.items()):
                    if row["scope"] == scope_key(self.context(client)):
                        await self.send(other, event)
            except (ValueError, TypeError, KeyError):
                await self.send(
                    client,
                    {
                        "type": "workspace_error",
                        "message": "The shared theme could not be saved.",
                    },
                )
            return True
        return False

    def cancel_turns(self, client):
        for rid, (owner, task) in list(self.turn_tasks.items()):
            if owner == client:
                task.cancel()

    async def begin_audio(self, client, live):
        if client in self.audio_locks:
            return True
        focus = await live.research_focus_provider()
        channel = focus.get("thread_id") or live.session_id
        lock = self.channel_locks.setdefault(
            (scope_key(self.context(client)), channel), asyncio.Lock()
        )
        if lock.locked():
            await self.send(
                client,
                {
                    "type": "live_error",
                    "message": "This conversation is finishing another turn. Please speak again when it finishes.",
                },
            )
            return False
        await lock.acquire()
        self.audio_locks[client] = {"lock": lock, "turn": None}
        return True

    def end_audio_lock(self, client):
        pending = self.audio_locks.pop(client, None)
        if pending and pending["lock"].locked():
            pending["lock"].release()

    def cards(self, client, message):
        rid = str(message.get("request_id") or message.get("turn_id") or "")
        turn = self.store().turn(rid, self.context(client)) if rid else None
        if not turn and message.get("type") == "live_input_transcript" and rid:
            live = self.state.live_sessions.get(self.manager.websocket_for(client))
            focus = getattr(live, "_turn_focus", {})
            if focus.get("context_cards"):
                turn = self.store().turn(
                    rid,
                    self.context(client),
                    focus.get("thread_id") or getattr(live, "session_id", ""),
                    focus["context_cards"],
                )
        if turn and turn["cards"]:
            message = {**message, "context_cards": turn["cards"]}
        return message

    def submit(self, client, session, text, rid, focus):
        context = self.context(client)
        channel = focus.get("thread_id") or self.sessions.get(client, "")
        existing = self.store().turn(rid, context)
        if (
            existing
            and existing["state"] in {"queued", "running"}
            and rid in self.turn_tasks
        ):
            return

        async def run():
            lock = self.channel_locks.setdefault(
                (scope_key(context), channel), asyncio.Lock()
            )
            async with lock:
                future = asyncio.get_running_loop().create_future()
                self.turn_waiters[rid] = future
                original = session.research_focus_provider

                async def frozen():
                    return focus

                try:
                    session.research_focus_provider = frozen
                    self.store().turn(rid, context, state="running")
                    result = await session.send_text(text, request_id=rid)
                    session.research_focus_provider = original
                    if result.get("status") not in {"accepted", "duplicate"}:
                        return
                    await asyncio.wait_for(future, 180)
                except asyncio.TimeoutError:
                    await self.send(
                        client,
                        {
                            "type": "live_error",
                            "message": "The conversation turn timed out. Your request is saved; retry to reconcile it.",
                        },
                    )
                finally:
                    session.research_focus_provider = original
                    self.turn_waiters.pop(rid, None)
                    self.store().turn(rid, context, state="finished")

        self.store().turn(
            rid, context, channel, focus.get("context_cards", []), "queued"
        )
        task = asyncio.create_task(run())
        self.tasks.add(task)
        task.add_done_callback(self.tasks.discard)
        self.turn_tasks[rid] = (client, task)
        task.add_done_callback(lambda _: self.turn_tasks.pop(rid, None))

    def research_subscription(self, client):
        row = self.store().windows.get(client, {})
        identifier = row.get("context", {}).get("research_id")
        if not identifier:
            return {}
        artifacts, _ = self.artifacts()
        item = artifacts.get(identifier, self.context(client)).get("artifact", {})
        return (
            {
                "page_id": identifier,
                "research_session_id": item.get("research_session_id", identifier),
                "thread_id": item.get("thread_id", "research-" + identifier),
            }
            if item
            else {}
        )

    async def mirror(self, client, message):
        kind = message.get("type")
        hub = self.hub
        rid = str(message.get("request_id") or message.get("turn_id") or "")
        if (
            kind == "live_generation_complete"
            and client in self.audio_locks
            and self.audio_locks[client]["turn"] == rid
        ):
            self.end_audio_lock(client)
        if (
            kind == "live_generation_complete"
            and rid in self.turn_waiters
            and not self.turn_waiters[rid].done()
        ):
            self.turn_waiters[rid].set_result(True)
        if not hub or kind not in CHAT_EVENTS:
            return
        origin = hub.windows.get(client)
        if not origin:
            return
        channel = message.get("thread_id") or (
            origin["context"].get("thread_id")
            if message.get("research_id")
            else origin["conversation_id"]
        )
        turn = hub.turn(rid, self.context(client)) if rid else None
        if turn:
            channel = turn["channel"]
        if not channel:
            return
        cards = message.get("context_cards", [])
        payload = {
            "type": "workspace_chat",
            "channel": channel,
            "message": message,
            **({"context_cards": cards} if cards else {}),
        }
        for other, row in list(hub.windows.items()):
            subscription = (
                self.research_subscription(other) if message.get("research_id") else {}
            )
            target = (
                subscription.get("thread_id")
                if message.get("research_id")
                else row["conversation_id"]
            )
            if (
                other != client
                and row["scope"] == origin["scope"]
                and target == channel
            ):
                await self.send(other, {**payload, **subscription})

    async def watch(self):
        while True:
            try:
                hub = self.store()
                hub.prune()
                artifacts, _ = self.artifacts()
                state = await asyncio.to_thread(artifacts.snapshot)
                for identifier, row in {
                    **state.get("artifacts", {}),
                    **state.get("requests", {}),
                }.items():
                    item = state.get("artifacts", {}).get(identifier, {})
                    value = json.dumps(
                        [
                            row.get("update_sequence"),
                            item.get("revision"),
                            state.get("drafts", {}).get(identifier, {}).get("revision"),
                            state.get("extension_activity", {}).get(identifier),
                            state.get("attachments", {}).get(identifier),
                            state.get("removed", {}).get(identifier),
                            row.get("display_title"),
                        ],
                        sort_keys=True,
                    )
                    key = "research:" + identifier
                    previous = self.fingerprints.get(key)
                    removed = state.get("removed", {}).get(identifier) or state.get(
                        "removed", {}
                    ).get(row.get("research_session_id", ""))
                    if removed and hasattr(self, "collaboration"):
                        await self.collaboration.removal(identifier, removed["token"])
                    if previous != value and (self.initialized or previous is not None):
                        await self.emit(
                            row,
                            "research",
                            identifier,
                            {
                                "revision": item.get("revision"),
                                "update_sequence": row.get("update_sequence", 0),
                                **(
                                    {"removed_research_ids": [identifier]}
                                    if removed
                                    else {}
                                ),
                            },
                        )
                    self.fingerprints[key] = value
                widget_files = []
                for name in (
                    "notes_state_dir",
                    "search_state_dir",
                    "news_state_dir",
                    "weather_state_dir",
                ):
                    directory = getattr(self.state, name, None)
                    if directory:
                        for file in Path(directory).glob("*.json"):
                            stat = file.stat()
                            widget_files.append(
                                (str(file), stat.st_mtime_ns, stat.st_size)
                            )
                for resource, value in [
                    (
                        "widgets",
                        json.dumps(
                            [
                                widget_files,
                                getattr(self.state, "search_widget_context", {}),
                                getattr(self.state, "news_widget_context", {}),
                            ],
                            sort_keys=True,
                            default=str,
                        ),
                    )
                ]:
                    previous = self.fingerprints.get(resource)
                    self.fingerprints[resource] = value
                    if previous is not None and previous != value:
                        scopes = {
                            r["scope"]: self.context(c) for c, r in hub.windows.items()
                        }
                        for context in scopes.values():
                            await self.emit(context, resource)
                memory_path = self.state.live_memory.memory_path
                stamp = memory_path.stat().st_mtime_ns if memory_path.exists() else 0
                old = self.fingerprints.get("memory")
                self.fingerprints["memory"] = stamp
                if old is not None and old != stamp:
                    scopes = {
                        r["scope"]: self.context(c) for c, r in hub.windows.items()
                    }
                    for context in scopes.values():
                        await self.emit(context, "memory")
                self.initialized = True
                if int(time.monotonic()) % 5 == 0:
                    await self.presence()
            except asyncio.CancelledError:
                raise
            except Exception:
                pass  # Reconnect always reconciles authoritative revisions.
            await asyncio.sleep(1)

    def install(self, app):
        @app.get("/api/sync/bootstrap")
        async def bootstrap(request: Request, since: int = 0):
            return self.store().bootstrap(self.request_context(request), since)

        @app.get("/api/sync/presence")
        async def presence(request: Request):
            return self.store().presence(self.request_context(request))

        @app.post("/api/research/{identifier}/selections")
        async def selection(identifier: str, request: Request):
            context = self.request_context(request)
            body = await request.json()
            artifacts, _ = self.artifacts()
            found = await asyncio.to_thread(
                artifacts.get, identifier, context, str(body.get("revision", ""))
            )
            if found.get("status") != "ok":
                raise HTTPException(409, "The selected report revision is unavailable.")
            text = body.get("text", "")
            origin = body.get("origin", {})
            if not isinstance(origin, dict) or len(json.dumps(origin)) > 2000:
                raise HTTPException(422, "Invalid selection origin")
            # Validate against authorized rendered text, not arbitrary client HTML.
            from bs4 import BeautifulSoup
            from markdown_it import MarkdownIt

            evidence = (
                found["artifact"].get("report", "")
                + "\n"
                + "\n".join(
                    e.get("report", "")
                    for e in artifacts.snapshot()
                    .get("extensions", {})
                    .get(identifier, [])
                )
            )
            if origin.get("source_id"):
                source = next(
                    (
                        r
                        for i, r in enumerate(
                            artifacts.source_catalog(found["artifact"])
                        )
                        if "S" + str(i + 1) == origin["source_id"]
                    ),
                    None,
                )
                evidence = (source or {}).get("content", "")
                try:
                    raw, mime = await asyncio.to_thread(
                        artifacts.source_bytes,
                        identifier,
                        context,
                        origin["source_id"],
                        True,
                        found["artifact"]["revision"],
                    )
                    if "json" in mime:
                        evidence = BeautifulSoup(
                            json.loads(raw).get("html", ""), "html.parser"
                        ).get_text(" ", strip=True)
                except (ValueError, OSError, KeyError):
                    if not source:
                        raise HTTPException(404, "Source unavailable")
            visible = BeautifulSoup(
                MarkdownIt().enable("table").render(evidence), "html.parser"
            ).get_text(" ", strip=True)
            compact = lambda value: " ".join(str(value).split())
            # Citations are deliberately absent from a selection; match its words in order.
            import re

            visible = re.sub(r"\[S\d+(?:\s*[,;]\s*S\d+)*\]", "", visible)
            if not isinstance(text, str) or not text.strip() or len(text) > 64000:
                raise HTTPException(422, "Select between 1 and 64,000 characters.")
            visible = compact(visible)
            words = compact(text).split()
            cursor = 0
            for word in words:
                position = visible.find(word, cursor)
                if position < 0:
                    raise HTTPException(
                        422, "The selection does not match this saved passage."
                    )
                cursor = position + len(word)
            return self.store().select(
                context, identifier, found["artifact"]["revision"], text, origin
            )

        @app.get("/api/research/{identifier}/selections/{selection_id}")
        async def get_selection(identifier: str, selection_id: str, request: Request):
            context = self.request_context(request)
            artifacts, _ = self.artifacts()
            if artifacts.get(identifier, context).get("status") != "ok":
                raise HTTPException(404, "Research unavailable")
            try:
                return self.store().selection(context, selection_id, identifier)
            except ValueError:
                raise HTTPException(404, "Selection unavailable")

        def local(request):
            if request.client.host not in {
                "127.0.0.1",
                "::1",
                "testclient",
            } or request.headers.get("x-nova-paired-device"):
                raise HTTPException(
                    403, "Manage connected devices on the host computer."
                )

        @app.get("/api/devices")
        async def devices(request: Request):
            local(request)
            return {
                "devices": self.store().devices(),
                "pairing_enabled": self.pairing_enabled(),
            }

        @app.post("/api/devices/pairing")
        async def pairing(request: Request):
            local(request)
            if not self.pairing_enabled():
                raise HTTPException(
                    409,
                    "Paired computers are disabled. Local windows remain connected.",
                )
            return self.store().pair_code()

        @app.post("/api/devices/claim")
        async def claim(request: Request):
            if not self.pairing_enabled():
                raise HTTPException(403, "Paired computers are disabled.")
            body = await request.json()
            try:
                return self.store().claim(
                    str(body.get("code", "")), str(body.get("label", "Computer"))
                )
            except ValueError:
                raise HTTPException(403, "Pairing code expired or already used")

        @app.post("/api/devices/{identifier}/approve")
        async def approve(identifier: str, request: Request):
            local(request)
            self.store().approve(identifier, True)
            return {"status": "approved"}

        @app.post("/api/devices/{identifier}/revoke")
        async def revoke(identifier: str, request: Request):
            local(request)
            clients = [
                c
                for c, r in self.store().windows.items()
                if r["device_id"] == identifier
            ]
            self.store().approve(identifier, False)
            for client in clients:
                socket = self.manager.websocket_for(client)
                if socket:
                    await socket.close(code=1008)
            return {"status": "revoked"}
