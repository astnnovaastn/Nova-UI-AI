// V35 test double for the GitHub Releases API of a *private* repository (no network, no GitHub account).
// GET /repos/<owner>/<repo>/releases           -> releases (newest first), 401 without the token, 404 for other repos
// GET /api-assets/<tag>/<name> (octet-stream) -> 302 to /download/<tag>/<name> (like GitHub's redirect to storage)
// GET /download/<tag>/<name>                  -> the file; refuses requests that still carry the Authorization header
// Usage: const feed = await startFeed({ repo: "owner/name", token, releases: [{ dir, version, prerelease }] })
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

function startFeed({ repo, token, releases, port = 0 }) {
  const seen = { listCalls: 0, downloads: [], unauthorized: 0 };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    const base = `http://127.0.0.1:${server.address().port}`;
    const send = (code, body, type = "application/json") => { res.writeHead(code, { "Content-Type": type }); res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };
    if (url.pathname.startsWith("/download/")) {
      if (req.headers.authorization) return send(400, { message: "storage does not take the API token" });
      const [, , tag, name] = url.pathname.split("/");
      const rel = releases.find((r) => "v" + r.version === tag);
      const file = rel && path.join(rel.dir, decodeURIComponent(name));
      if (!file || !fs.existsSync(file)) return send(404, { message: "Not Found" });
      seen.downloads.push(decodeURIComponent(name));
      res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Length": fs.statSync(file).size });
      return fs.createReadStream(file).pipe(res);
    }
    if (req.headers.authorization !== "Bearer " + token) { seen.unauthorized++; return send(url.pathname.includes(repo) ? 404 : 401, { message: "Not Found" }); }
    if (url.pathname === `/repos/${repo}/releases`) {
      seen.listCalls++;
      return send(200, releases.filter((r) => !r.hidden).map((r, i) => ({
        id: i + 1, tag_name: "v" + r.version, name: "AEGIS " + r.version, draft: Boolean(r.draft), prerelease: r.version.includes("-"),
        published_at: new Date(Date.now() - i * 60000).toISOString(), html_url: `https://github.com/${repo}/releases/tag/v${r.version}`,
        assets: fs.readdirSync(r.dir).filter((n) => fs.statSync(path.join(r.dir, n)).isFile()).map((n) => ({ name: n, size: fs.statSync(path.join(r.dir, n)).size, url: `${base}/api-assets/v${r.version}/${encodeURIComponent(n)}` })),
      })));
    }
    if (url.pathname.startsWith("/api-assets/")) {
      if (req.headers.accept !== "application/octet-stream") return send(415, { message: "asset API needs Accept: application/octet-stream" });
      const [, , tag, name] = url.pathname.split("/");
      res.writeHead(302, { Location: `${base}/download/${tag}/${name}` });
      return res.end();
    }
    send(404, { message: "Not Found" });
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve({ url: `http://127.0.0.1:${server.address().port}`, seen, close: () => server.close() })));
}

module.exports = { startFeed };
