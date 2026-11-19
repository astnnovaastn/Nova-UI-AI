/**
 * Serves the built AEGIS web app (`dist/`) and forwards `/api` and `/ws` to the backend, on the
 * same address the dev server uses. It does what `vite` does for AEGIS, inside the desktop
 * process: no separate Node process, no file watchers, no on-the-fly compilation.
 *
 * Loopback only. The page keeps its usual origin (http://127.0.0.1:5173), which is the origin the
 * backend already allows, so the backend needs no change and gains no new caller.
 */
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");

// V35: an installed AEGIS runs on its own ports (installed.cjs sets them) beside a development copy.
const BACKEND = { host: "127.0.0.1", port: Number(process.env.AEGIS_BACKEND_PORT || 8340) };
const RUNTIME = { host: "127.0.0.1", port: Number(process.env.AEGIS_RUNTIME_PORT || 8341) };
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".map": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
};

/** Newest modification time under a folder, skipping what is not source. */
function newest(folder, skip = /^(node_modules|dist|\.tools|test-results|artifacts)$/) {
  let latest = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.test(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else latest = Math.max(latest, fs.statSync(full).mtimeMs);
    }
  };
  try {
    walk(folder);
  } catch {
    /* unreadable: treated as empty */
  }
  return latest;
}

/**
 * Whether `dist/` exists and is at least as new as the sources it was built from. A stale build
 * would silently show old code, so the caller falls back to the dev server instead.
 */
function buildState(frontend) {
  const index = path.join(frontend, "dist", "index.html");
  if (!fs.existsSync(index)) return { usable: false, reason: "The web app has not been built (npm run desktop:build)." };
  const built = fs.statSync(index).mtimeMs;
  const sources = Math.max(newest(path.join(frontend, "src")), newest(path.join(frontend, "public")), fs.statSync(path.join(frontend, "index.html")).mtimeMs);
  if (sources > built) return { usable: false, reason: "The web app changed since it was built (npm run desktop:build)." };
  return { usable: true, reason: "" };
}

function forward(target, request, response) {
  const upstream = http.request(
    { host: target.host, port: target.port, method: request.method, path: request.url, headers: { ...request.headers, host: `${target.host}:${target.port}` } },
    (answer) => {
      response.writeHead(answer.statusCode || 502, answer.headers);
      answer.pipe(response);
    },
  );
  upstream.on("error", () => {
    if (!response.headersSent) response.writeHead(502, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "The AEGIS backend is not answering." }));
  });
  // A page that goes away must not leave the backend streaming to nobody.
  response.on("close", () => upstream.destroy());
  request.pipe(upstream);
}

function serveFile(root, request, response) {
  let name;
  try {
    name = decodeURIComponent(new URL(request.url, "http://local").pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }
  let file = path.join(root, name);
  // Never outside dist, whatever the path says.
  if (file !== root && !file.startsWith(root + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  let stat = fs.statSync(file, { throwIfNoEntry: false });
  if (stat?.isDirectory()) {
    file = path.join(file, "index.html");
    stat = fs.statSync(file, { throwIfNoEntry: false });
  }
  if (!stat?.isFile()) {
    // A page address the app routes itself; a missing asset stays a 404.
    if (path.extname(name)) {
      response.writeHead(404).end();
      return;
    }
    file = path.join(root, "index.html");
    stat = fs.statSync(file);
  }
  const headers = {
    "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Content-Length": stat.size,
    // Built assets carry a content hash in their name; everything else is checked each time.
    "Cache-Control": name.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache",
    "Last-Modified": stat.mtime.toUTCString(),
    "X-Content-Type-Options": "nosniff",
  };
  if (request.headers["if-modified-since"] && Date.parse(request.headers["if-modified-since"]) >= Math.floor(stat.mtimeMs / 1000) * 1000) {
    response.writeHead(304, headers).end();
    return;
  }
  response.writeHead(200, headers);
  if (request.method === "HEAD") response.end();
  else fs.createReadStream(file).pipe(response);
}

/** Starts the server. Resolves with a handle, or rejects if the port is taken. */
function start(frontend, port = 5173) {
  const root = path.join(frontend, "dist");
  const server = http.createServer((request, response) => {
    const url = request.url || "/";
    if (url.startsWith("/api/runtime")) return forward(RUNTIME, request, response);
    if (url.startsWith("/api/") || url === "/api") return forward(BACKEND, request, response);
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405).end();
      return;
    }
    serveFile(root, request, response);
  });
  // WebSockets (voice, live updates): the bytes are passed through untouched, Origin included.
  server.on("upgrade", (request, socket, head) => {
    if (!(request.url || "").startsWith("/ws")) {
      socket.destroy();
      return;
    }
    const upstream = net.connect(BACKEND.port, BACKEND.host, () => {
      const lines = [`${request.method} ${request.url} HTTP/${request.httpVersion}`];
      for (let i = 0; i < request.rawHeaders.length; i += 2) {
        const header = request.rawHeaders[i];
        lines.push(`${header}: ${header.toLowerCase() === "host" ? `${BACKEND.host}:${BACKEND.port}` : request.rawHeaders[i + 1]}`);
      }
      upstream.write(lines.join("\r\n") + "\r\n\r\n");
      if (head?.length) upstream.write(head);
      upstream.pipe(socket);
      socket.pipe(upstream);
    });
    const end = () => {
      upstream.destroy();
      socket.destroy();
    };
    upstream.on("error", end);
    socket.on("error", end);
    upstream.on("close", end);
    socket.on("close", end);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve({ port, close: () => new Promise((done) => server.close(() => done())) }));
  });
}

module.exports = { start, buildState };
