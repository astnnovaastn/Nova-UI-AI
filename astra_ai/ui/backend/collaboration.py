"""Local Yjs rooms. SQLite is authoritative; HTML is a derived export snapshot."""

import asyncio, base64, contextlib, hashlib, html, json, sqlite3, uuid
from pathlib import Path
from fastapi import HTTPException, Request, WebSocket, WebSocketDisconnect
from pycrdt import Doc, XmlFragment, XmlElement, XmlText
from pycrdt.websocket import YRoom
from pycrdt._sync import handle_sync_message
from .workspace_sync import scope_key

SCHEMA = "aegis-paper-v1"
TAGS = {
    "paragraph": "p",
    "heading": "h2",
    "blockquote": "blockquote",
    "bulletList": "ul",
    "orderedList": "ol",
    "listItem": "li",
    "codeBlock": "pre",
    "table": "table",
    "tableRow": "tr",
    "tableCell": "td",
    "tableHeader": "th",
    "hardBreak": "br",
    "horizontalRule": "hr",
    "image": "img",
    "illustrationGroup": "div",
    "illustratedBlock": "div",
    "illustratedCopy": "div",
    "pageBreak": "div",
    "documentVideo": "div",
}
MARKS = {
    "bold": "strong",
    "italic": "em",
    "strike": "s",
    "code": "code",
    "underline": "u",
    "link": "a",
    "citation": "a",
}


def state_vector(raw):
    data = base64.b64decode(raw, validate=True) if isinstance(raw, str) else raw
    cursor = 0

    def integer():
        nonlocal cursor
        value = shift = 0
        while cursor < len(data) and shift <= 63:
            byte = data[cursor]
            cursor += 1
            value |= (byte & 127) << shift
            if not byte & 128:
                return value
            shift += 7
        raise ValueError("Invalid state vector")

    count = integer()
    if count > 10000:
        raise ValueError("Invalid state vector")
    result = {}
    for _ in range(count):
        client = integer()
        clock = integer()
        result[client] = clock
    if cursor != len(data):
        raise ValueError("Invalid state vector")
    return result


def project(document):
    def attributes(values):
        return "".join(
            " "
            + html.escape(str(k), quote=True)
            + '="'
            + html.escape(str(v), quote=True)
            + '"'
            for k, v in values.items()
            if v is not None
        )

    def render(node):
        if isinstance(node, XmlText):
            pieces = []
            for text, marks in node.diff():
                content = html.escape(str(text))
                for name, attrs in (marks or {}).items():
                    tag = MARKS.get(name)
                    if not tag:
                        continue
                    attrs = attrs if isinstance(attrs, dict) else {}
                    safe = {}
                    if name == "link" and str(attrs.get("href", "")).startswith(
                        ("https://", "http://")
                    ):
                        safe = {"href": attrs["href"], "rel": "noopener noreferrer"}
                    if name == "citation":
                        safe = {"data-citation": attrs.get("source", "")}
                    content = (
                        "<" + tag + attributes(safe) + ">" + content + "</" + tag + ">"
                    )
                pieces.append(content)
            return "".join(pieces)
        if not isinstance(node, XmlElement) or node.tag not in TAGS:
            raise ValueError("Incompatible document schema")
        tag = TAGS[node.tag]
        attrs = dict(node.attributes)
        safe = {}
        if node.tag == "heading":
            tag = "h" + str(max(1, min(6, int(attrs.get("level", 2)))))
        if node.tag == "image":
            src = str(attrs.get("src", ""))
            if not src.startswith("/api/research/"):
                return ""
            safe = {k: attrs.get(k) for k in ("src", "alt", "title", "width", "height")}
        if node.tag in {"tableCell", "tableHeader"}:
            safe = {k: attrs.get(k) for k in ("colspan", "rowspan")}
        if node.tag == "illustrationGroup":
            safe = {
                "data-image-group": attrs.get("layout", "gallery"),
                "class": "research-image-composition "
                + str(attrs.get("layout", "gallery")),
            }
        if node.tag == "illustratedBlock":
            safe = {
                "data-illustrated": "",
                "data-composition": attrs.get("composition", "gallery"),
                "class": "research-illustrated-block",
            }
        if node.tag == "illustratedCopy":
            safe = {"data-illustrated-copy": "", "class": "research-illustrated-copy"}
        if node.tag == "pageBreak":
            safe = {"data-page-break": "", "class": "document-page-break"}
        content = "".join(render(child) for child in node.children)
        if node.tag == "documentVideo":
            url = str(attrs.get("url", ""))
            safe = {
                "data-video-url": url if url.startswith("https://") else "",
                "data-video-title": str(attrs.get("title", "Video")),
            }
            content = ""
        opening = "<" + tag + attributes(safe) + ">"
        return (
            opening
            if tag in {"img", "br", "hr"}
            else opening + content + "</" + tag + ">"
        )

    fragment = document.get("default", type=XmlFragment)
    if len(fragment.children) > 30000:
        raise ValueError("Document is too large")
    result = "".join(render(node) for node in fragment.children)
    if len(result) > 2000000:
        raise ValueError("Document is too large")
    return result or "<p></p>"


class CollaborationService:
    def __init__(self, app, workspace):
        self.workspace = workspace
        self.rooms = {}
        self.tasks = {}
        self.locks = {}
        self.path = None
        self.vectors = {}
        self.workspace.collaboration = self
        self.install(app)

    def db(self):
        if self.path is None:
            self.path = self.workspace.store().path.with_name("collaboration.sqlite3")
            with sqlite3.connect(self.path) as db:
                db.executescript(
                    "PRAGMA journal_mode=WAL;CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY,scope TEXT,epoch TEXT,schema TEXT,snapshot BLOB,sequence INTEGER,html TEXT);CREATE TABLE IF NOT EXISTS updates(id TEXT,sequence INTEGER,update_bytes BLOB,PRIMARY KEY(id,sequence));"
                )
        return sqlite3.connect(self.path, timeout=15)

    def row(self, identifier):
        with self.db() as db:
            return db.execute(
                "SELECT scope,epoch,schema,snapshot,sequence,html FROM documents WHERE id=?",
                (identifier,),
            ).fetchone()

    async def removal(self, identifier, token):
        if ":" not in identifier:
            with self.db() as db:
                children = [
                    row[0]
                    for row in db.execute(
                        "SELECT id FROM documents WHERE id LIKE ?", (identifier + ":%",)
                    )
                ]
            for child in children:
                await self.removal(child, token)
        key = "document-removal:" + identifier
        with self.workspace.store().db() as db:
            previous = db.execute(
                "SELECT value FROM settings WHERE key=?", (key,)
            ).fetchone()
            if previous and previous[0] == token:
                return
            db.execute("INSERT OR REPLACE INTO settings VALUES(?,?)", (key, token))
        if not self.exists(identifier):
            return
        room = self.rooms.get(identifier)
        if room:
            self.persist(identifier)
            for channel in list(room.clients):
                with contextlib.suppress(Exception):
                    await channel.close()
            await room.stop()
            self.rooms.pop(identifier, None)
            self.tasks.pop(identifier, None)
        with self.db() as db:
            db.execute(
                "UPDATE documents SET epoch=? WHERE id=?",
                (uuid.uuid4().hex, identifier),
            )

    def exists(self, identifier):
        return self.row(identifier) is not None

    def authorize(self, identifier, context):
        artifacts, _ = self.workspace.artifacts()
        artifacts.collaboration = self
        parts = identifier.split(":")
        found = artifacts.get(parts[0], context)
        if len(parts) > 1:
            from astra_ai.core.research_documents import DocumentFiles

            file = (
                DocumentFiles(artifacts).get(parts[0], context, parts[1])
                if len(parts) == 3
                else None
            )
            if not file or parts[2] != (
                file.get("pdf_revision") or file.get("revision")
            ):
                raise HTTPException(
                    409, "PDF revision changed; reopen its shared overlays."
                )
        if found.get("status") != "ok":
            raise HTTPException(404, "Document unavailable")
        return found["artifact"]

    async def room(self, identifier):
        if identifier not in self.rooms:
            row = self.row(identifier)
            doc = Doc()
            doc.apply_update(row[3])
            room = YRoom(ydoc=doc)
            self.rooms[identifier] = room
            self.vectors[identifier] = doc.get_state()
            task = asyncio.create_task(room.start())
            self.tasks[identifier] = task
            await room.started.wait()
            doc.observe(
                lambda event: asyncio.get_running_loop().call_soon(
                    self.persist, identifier
                )
            )
        return self.rooms[identifier]

    def persist(self, identifier):
        room = self.rooms.get(identifier)
        if not room:
            return self.row(identifier)
        snapshot = room.ydoc.get_update()
        with self.db() as db:
            row = db.execute(
                "SELECT snapshot,sequence FROM documents WHERE id=?", (identifier,)
            ).fetchone()
            if row and row[0] != snapshot:
                content = project(room.ydoc)
                sequence = row[1] + 1
                delta = room.ydoc.get_update(self.vectors.get(identifier, b"\x00"))
                db.execute(
                    "INSERT INTO updates VALUES(?,?,?)", (identifier, sequence, delta)
                )
                db.execute(
                    "DELETE FROM updates WHERE id=? AND sequence<?",
                    (identifier, max(0, sequence - 256)),
                )
                db.execute(
                    "UPDATE documents SET snapshot=?,sequence=?,html=? WHERE id=?",
                    (snapshot, sequence, content, identifier),
                )
        self.vectors[identifier] = room.ydoc.get_state()
        return self.row(identifier)

    async def stop(self):
        for identifier, room in list(self.rooms.items()):
            self.persist(identifier)
            await room.stop()
        for task in self.tasks.values():
            with contextlib.suppress(asyncio.CancelledError):
                await task

    def install(self, app):
        @app.post("/api/research/{identifier}/collaboration")
        async def bootstrap(identifier: str, request: Request):
            context = self.workspace.request_context(request)
            item = self.authorize(identifier, context)
            body = await request.json()
            if body.get("schema") != SCHEMA:
                raise HTTPException(
                    409, "Update the editor before joining this document."
                )
            async with self.locks.setdefault(identifier, asyncio.Lock()):
                row = self.row(identifier)
                if not row:
                    try:
                        update = base64.b64decode(body.get("seed", ""), validate=True)
                        if len(update) > 2000000:
                            raise ValueError()
                        doc = Doc()
                        doc.apply_update(update)
                        content = project(doc)
                    except Exception:
                        raise HTTPException(422, "Invalid document seed")
                    with self.db() as db:
                        db.execute(
                            "INSERT INTO documents VALUES(?,?,?,?,?,?,?)",
                            (
                                identifier,
                                scope_key(context),
                                uuid.uuid4().hex,
                                SCHEMA,
                                doc.get_update(),
                                0,
                                content,
                            ),
                        )
                    row = self.row(identifier)
                if row[0] != scope_key(context):
                    raise HTTPException(403, "Document scope mismatch")
                room = await self.room(identifier)
                row = self.persist(identifier)
                return {
                    "epoch": row[1],
                    "schema": SCHEMA,
                    "update": base64.b64encode(row[3]).decode(),
                    "sequence": row[4],
                }

        @app.post("/api/research/{identifier}/collaboration/snapshot")
        async def snapshot(identifier: str, request: Request):
            context = self.workspace.request_context(request)
            item = self.authorize(identifier, context)
            body = await request.json()
            row = self.row(identifier)
            if not row or body.get("epoch") != row[1]:
                raise HTTPException(
                    409,
                    "Document lifetime changed; preserve the recovery copy and reopen.",
                )
            room = await self.room(identifier)
            try:
                acknowledged = state_vector(body.get("vector", "")) == state_vector(
                    room.ydoc.get_state()
                )
            except ValueError:
                acknowledged = False
            if not acknowledged:
                raise HTTPException(
                    409, "Waiting for shared changes to be acknowledged."
                )
            row = self.persist(identifier)
            artifacts, _ = self.workspace.artifacts()
            draft = artifacts.snapshot().get("drafts", {}).get(identifier, {})
            result = (
                {"status": "completed", "draft": draft}
                if draft.get("html") == row[5]
                else await asyncio.to_thread(
                    artifacts.save_draft,
                    identifier,
                    context,
                    item["revision"],
                    draft.get("revision", ""),
                    row[5],
                )
            )
            if result.get("status") not in {"ok", "completed"}:
                raise HTTPException(
                    409, "Export snapshot changed; retry after synchronization."
                )
            return {**result, "sequence": row[4], "epoch": row[1]}

        @app.websocket("/ws/collaboration/{identifier}")
        async def websocket(
            socket: WebSocket,
            identifier: str,
            client: str = "",
            epoch: str = "",
            schema: str = "",
        ):
            origin = socket.headers.get("origin")
            if origin and origin not in {
                "http://127.0.0.1:5173",
                "http://localhost:5173",
            }:
                await socket.close(code=1008)
                return
            registered = self.workspace.store().windows.get(client)
            if (
                not registered
                or socket.headers.get("x-nova-paired-device", "local")
                != registered["device_id"]
            ):
                await socket.close(code=1008)
                return
            context = self.workspace.context(client)
            try:
                self.authorize(identifier, context)
            except HTTPException:
                await socket.close(code=1008)
                return
            row = self.row(identifier)
            if (
                not row
                or row[0] != scope_key(context)
                or row[1] != epoch
                or schema != SCHEMA
            ):
                await socket.close(code=1008)
                return
            await socket.accept()
            room = await self.room(identifier)
            service = self

            class Channel:
                path = identifier

                def __aiter__(self):
                    return self

                async def __anext__(self):
                    try:
                        service.authorize(identifier, context)
                        data = await socket.receive_bytes()
                        if len(data) > 2000000:
                            await socket.close(code=1009)
                            raise StopAsyncIteration
                        if data and data[0] == 0:
                            trial = Doc()
                            trial.apply_update(room.ydoc.get_update())
                            handle_sync_message(data[1:], trial)
                            project(trial)
                        return data
                    except (WebSocketDisconnect, HTTPException):
                        raise StopAsyncIteration

                async def close(self):
                    await socket.close(code=1008)

                async def send(self, message):
                    service.authorize(identifier, context)
                    service.persist(identifier)
                    await socket.send_bytes(message)

            try:
                await room.serve(Channel())
            except (WebSocketDisconnect, RuntimeError):
                pass
