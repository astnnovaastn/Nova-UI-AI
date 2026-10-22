"""Account-free, scoped workspace events. UI presence never creates model work."""

import hashlib, json, secrets, sqlite3, threading, time, uuid
from contextlib import contextmanager
from pathlib import Path


def scope_key(context):
    return json.dumps(
        [
            str(context.get("profile_id", "")),
            str(context.get("project_id", "")),
            bool(context.get("guest", False)),
        ],
        separators=(",", ":"),
    )


class WorkspaceHub:
    def __init__(self, path, clock=time.time):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.clock = clock
        self.lock = threading.RLock()
        self.windows = {}
        self.voice = None
        self.generation = 0
        with self.db() as db:
            db.executescript("""
            CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS events(sequence INTEGER PRIMARY KEY AUTOINCREMENT,scope TEXT,resource TEXT,entity TEXT,data TEXT,created REAL);
            CREATE TABLE IF NOT EXISTS turn_context(id TEXT PRIMARY KEY,scope TEXT,channel TEXT,cards TEXT,state TEXT);
            CREATE TABLE IF NOT EXISTS selections(id TEXT PRIMARY KEY,scope TEXT,page TEXT,revision TEXT,text TEXT,origin TEXT,created REAL);
            CREATE TABLE IF NOT EXISTS devices(id TEXT PRIMARY KEY,label TEXT,secret_hash TEXT,revoked INTEGER DEFAULT 0,created REAL);
            CREATE TABLE IF NOT EXISTS pairing(code_hash TEXT PRIMARY KEY,expires REAL,claimed TEXT,approved INTEGER DEFAULT 0);
            """)
            row = db.execute(
                "SELECT value FROM settings WHERE key='installation'"
            ).fetchone()
            self.installation = row[0] if row else uuid.uuid4().hex
            db.execute(
                "INSERT OR IGNORE INTO settings VALUES('installation',?)",
                (self.installation,),
            )

    @contextmanager
    def db(self):
        db = sqlite3.connect(self.path, timeout=15)
        try:
            db.execute("PRAGMA journal_mode=WAL")
            with db:
                yield db
        finally:
            db.close()

    def turn(self, identifier, context, channel=None, cards=None, state=None):
        with self.lock, self.db() as db:
            if channel is not None:
                db.execute(
                    "INSERT OR IGNORE INTO turn_context VALUES(?,?,?,?,?)",
                    (
                        identifier,
                        scope_key(context),
                        channel,
                        json.dumps(cards or []),
                        state or "accepted",
                    ),
                )
            if state:
                db.execute(
                    "UPDATE turn_context SET state=? WHERE id=? AND scope=?",
                    (state, identifier, scope_key(context)),
                )
            row = db.execute(
                "SELECT channel,cards,state FROM turn_context WHERE id=? AND scope=?",
                (identifier, scope_key(context)),
            ).fetchone()
            return (
                {"channel": row[0], "cards": json.loads(row[1]), "state": row[2]}
                if row
                else None
            )

    def prune(self):
        now = self.clock()
        for client, row in list(self.windows.items()):
            if now - row["seen"] > 15:
                self.remove(client)
        if self.voice and self.voice["client_id"] not in self.windows:
            self.voice = None

    def register(self, client, payload, context, device="local"):
        with self.lock:
            window = str(payload.get("window_id", ""))
            if not 8 <= len(window) <= 100:
                raise ValueError("invalid_window_identity")
            if any(
                r["window_id"] == window and k != client
                for k, r in self.windows.items()
            ):
                raise ValueError("duplicate_window_identity")
            self.windows[client] = {
                "client_id": client,
                "window_id": window,
                "device_id": device,
                "label": str(payload.get("label") or "Window")[:60],
                "scope": scope_key(context),
                "seen": self.clock(),
                "context": {},
                "conversation_id": str(payload.get("conversation_id", ""))[:128],
            }
            return self.presence(context)

    def touch(self, client, context=None, conversation_id=None):
        with self.lock:
            row = self.windows.get(client)
            if not row:
                return False
            row["seen"] = self.clock()
            if context is not None:
                row["context"] = {
                    k: context.get(k, "")
                    for k in (
                        "view",
                        "research_id",
                        "thread_id",
                        "research_tab",
                        "title",
                        "active_selection_id",
                    )
                }
            if conversation_id is not None:
                row["conversation_id"] = str(conversation_id)[:128]
            return True

    def remove(self, client):
        with self.lock:
            self.windows.pop(client, None)
            if self.voice and self.voice["client_id"] == client:
                self.voice = None

    def presence(self, context):
        self.prune()
        scope = scope_key(context)
        rows = [
            {
                k: r[k]
                for k in ("client_id", "window_id", "device_id", "label", "context")
            }
            for r in self.windows.values()
            if r["scope"] == scope
        ]
        return {
            "installation_id": self.installation,
            "windows": rows,
            "count": len(rows),
            "voice": (
                self.voice.copy()
                if self.voice
                and any(r["client_id"] == self.voice["client_id"] for r in rows)
                else None
            ),
        }

    def acquire_voice(self, client):
        with self.lock:
            self.prune()
            if client not in self.windows:
                raise ValueError("window_not_registered")
            if self.voice and self.voice["client_id"] != client:
                return {"granted": False, "owner": self.voice.copy()}
            if not self.voice:
                self.generation += 1
                row = self.windows[client]
                self.voice = {
                    "client_id": client,
                    "window_id": row["window_id"],
                    "label": row["label"],
                    "generation": self.generation,
                }
            return {"granted": True, "owner": self.voice.copy()}

    def release_voice(self, client):
        with self.lock:
            if self.voice and self.voice["client_id"] == client:
                self.voice = None

    def owns_voice(self, client, generation=None):
        self.prune()
        return bool(
            self.voice
            and self.voice["client_id"] == client
            and (generation is None or generation == self.voice["generation"])
        )

    def append(self, context, resource, entity="", data=None):
        data = data or {}
        with self.lock, self.db() as db:
            cursor = db.execute(
                "INSERT INTO events(scope,resource,entity,data,created) VALUES(?,?,?,?,?)",
                (scope_key(context), resource, entity, json.dumps(data), self.clock()),
            )
            return {
                "type": "workspace_event",
                "sequence": cursor.lastrowid,
                "resource": resource,
                "entity_id": entity,
                "data": data,
            }

    def bootstrap(self, context, since=0):
        with self.lock, self.db() as db:
            rows = db.execute(
                "SELECT sequence,resource,entity,data FROM events WHERE scope=? AND sequence>? ORDER BY sequence LIMIT 501",
                (scope_key(context), max(0, since)),
            ).fetchall()
            latest = db.execute(
                "SELECT COALESCE(MAX(sequence),0) FROM events WHERE scope=?",
                (scope_key(context),),
            ).fetchone()[0]
            theme = db.execute(
                "SELECT value FROM settings WHERE key=?",
                ("theme:" + scope_key(context),),
            ).fetchone()
        return {
            **self.presence(context),
            "sequence": latest,
            "reconcile": since == 0 or len(rows) > 500,
            "events": [
                {
                    "sequence": r[0],
                    "resource": r[1],
                    "entity_id": r[2],
                    "data": json.loads(r[3]),
                }
                for r in rows[:500]
            ],
            "theme": json.loads(theme[0]) if theme else None,
        }

    def set_theme(self, context, theme):
        if not isinstance(theme, dict) or len(json.dumps(theme)) > 25000:
            raise ValueError("invalid_theme")
        with self.lock, self.db() as db:
            db.execute(
                "INSERT OR REPLACE INTO settings VALUES(?,?)",
                ("theme:" + scope_key(context), json.dumps(theme)),
            )
        return self.append(context, "theme", data={"theme": theme})

    def select(self, context, page, revision, text, origin):
        if not isinstance(text, str) or not text.strip() or len(text) > 64000:
            raise ValueError("Select between 1 and 64,000 characters.")
        identifier = uuid.uuid4().hex
        with self.lock, self.db() as db:
            db.execute(
                "INSERT INTO selections VALUES(?,?,?,?,?,?,?)",
                (
                    identifier,
                    scope_key(context),
                    page,
                    revision,
                    text.strip(),
                    json.dumps(origin),
                    self.clock(),
                ),
            )
        return self.selection(context, identifier, page)

    def selection(self, context, identifier, page=None):
        with self.lock, self.db() as db:
            row = db.execute(
                "SELECT page,revision,text,origin FROM selections WHERE id=? AND scope=?",
                (identifier, scope_key(context)),
            ).fetchone()
        if not row or page is not None and row[0] != page:
            raise ValueError("selection_unavailable")
        return {
            "id": identifier,
            "page_id": row[0],
            "revision": row[1],
            "text": row[2],
            "origin": json.loads(row[3]),
            "kind": "selection",
        }

    def pair_code(self):
        code = secrets.token_urlsafe(9)
        with self.lock, self.db() as db:
            db.execute(
                "INSERT INTO pairing VALUES(?,?,?,0)",
                (hashlib.sha256(code.encode()).hexdigest(), self.clock() + 300, ""),
            )
        return {"code": code, "expires_in": 300}

    def claim(self, code, label):
        marker = hashlib.sha256(code.encode()).hexdigest()
        identifier = uuid.uuid4().hex
        secret = secrets.token_urlsafe(32)
        with self.lock, self.db() as db:
            row = db.execute(
                "SELECT expires,claimed FROM pairing WHERE code_hash=?", (marker,)
            ).fetchone()
            if not row or row[0] < self.clock() or row[1]:
                raise ValueError("pairing_expired_or_used")
            db.execute(
                "INSERT INTO devices VALUES(?,?,?,1,?)",
                (
                    identifier,
                    str(label)[:80],
                    hashlib.sha256(secret.encode()).hexdigest(),
                    self.clock(),
                ),
            )
            db.execute(
                "UPDATE pairing SET claimed=? WHERE code_hash=?", (identifier, marker)
            )
        return {
            "device_id": identifier,
            "credential": identifier + "." + secret,
            "state": "awaiting_host_approval",
        }

    def device(self, credential, pending=False):
        identifier, _, secret = credential.partition(".")
        with self.lock, self.db() as db:
            row = db.execute(
                "SELECT label,secret_hash,revoked FROM devices WHERE id=?",
                (identifier,),
            ).fetchone()
        if (
            not row
            or (row[2] and not pending)
            or not secrets.compare_digest(
                row[1], hashlib.sha256(secret.encode()).hexdigest()
            )
        ):
            return None
        return {"id": identifier, "label": row[0], "revoked": bool(row[2])}

    def devices(self):
        with self.lock, self.db() as db:
            return [
                {"id": r[0], "label": r[1], "revoked": bool(r[2])}
                for r in db.execute("SELECT id,label,revoked FROM devices")
            ]

    def approve(self, identifier, allowed):
        with self.lock, self.db() as db:
            db.execute(
                "UPDATE devices SET revoked=? WHERE id=?",
                (0 if allowed else 1, identifier),
            )
        if not allowed:
            for client, row in list(self.windows.items()):
                if row["device_id"] == identifier:
                    self.remove(client)
