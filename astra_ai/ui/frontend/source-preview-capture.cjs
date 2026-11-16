const http = require("node:http");
const net = require("node:net");
const dns = require("node:dns/promises");
const readline = require("node:readline");

const blocked = new net.BlockList();
for (const [ip, bits] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 3],
]) blocked.addSubnet(ip, bits);
const globalV6 = new net.BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
for (const [ip, bits] of [["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20]]) {
  blocked.addSubnet(ip, bits, "ipv6");
}

function publicAddress(address) {
  const family = net.isIP(address);
  if (family === 4) return !blocked.check(address);
  return family === 6 && globalV6.check(address, "ipv6") && !blocked.check(address, "ipv6");
}

async function publicTarget(address, lookup = dns.lookup) {
  const url = new URL(address);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.port) {
    throw new Error("unsupported address");
  }
  const host = url.hostname.replace(/^\[|\]$|\.$/g, "");
  if (!net.isIP(host) && (!host.includes(".") || /\.(?:localhost|local|internal|lan|home\.arpa)$/i.test(host))) {
    throw new Error("non-public hostname");
  }
  const answers = await lookup(host, { all: true });
  if (!answers.length || answers.some(({ address }) => !publicAddress(address))) {
    throw new Error("non-public address");
  }
  return { url, ip: answers.find(({ family }) => family === 4)?.address ?? answers[0].address };
}

const MAX_TRANSFER = 24 * 1024 * 1024;

function createProxy(resolve = publicTarget) {
  const sockets = new Set();
  const server = http.createServer(async (request, response) => {
    try {
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) throw new Error("method");
      const { url, ip } = await resolve(request.url);
      if (url.protocol !== "http:") throw new Error("protocol");
      const headers = { ...request.headers, host: url.host };
      for (const name of ["proxy-authorization", "proxy-connection", "authorization", "connection", "cookie"]) delete headers[name];
      const upstream = http.request({ host: ip, port: 80, method: request.method, path: url.pathname + url.search, headers, timeout: 8000 }, (answer) => {
        let size = 0;
        answer.on("data", (chunk) => {
          size += chunk.length;
          if (size > MAX_TRANSFER) { upstream.destroy(); response.destroy(); }
        });
        answer.on("error", () => response.destroy());
        response.writeHead(answer.statusCode, answer.headers);
        answer.pipe(response);
      });
      upstream.on("timeout", () => upstream.destroy());
      upstream.on("error", () => {
        if (response.headersSent) response.destroy();
        else response.writeHead(502).end();
      });
      response.on("close", () => upstream.destroy());
      upstream.end();
    } catch {
      response.writeHead(403).end();
    }
  });
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("error", () => socket.destroy());
    socket.on("close", () => sockets.delete(socket));
  });
  server.on("connect", async (request, client, head) => {
    try {
      if (!/^(?:\[[^\]]+\]|[^:/?#@]+):443$/i.test(request.url)) throw new Error("port");
      const { ip } = await resolve("https://" + request.url);
      if (client.destroyed) return;
      const upstream = net.connect({ host: ip, port: 443, timeout: 8000 });
      upstream.once("connect", () => {
        client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
        if (head.length) upstream.write(head);
        upstream.pipe(client).pipe(upstream);
      });
      let received = 0;
      upstream.on("data", (chunk) => {
        received += chunk.length;
        if (received > MAX_TRANSFER) upstream.destroy();
      });
      upstream.on("error", () => upstream.destroy());
      upstream.on("timeout", () => upstream.destroy());
      upstream.on("close", () => client.destroy());
      client.on("close", () => upstream.destroy());
    } catch {
      client.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    }
  });
  return { server, close: () => { for (const socket of sockets) socket.destroy(); server.close(); } };
}

async function main() {
  const { chromium } = require("playwright");
  const proxy = createProxy();
  await new Promise((resolve, reject) => {
    proxy.server.once("error", reject);
    proxy.server.listen(0, "127.0.0.1", resolve);
  });
  const options = {
    chromiumSandbox: true,
    proxy: { server: "http://127.0.0.1:" + proxy.server.address().port, bypass: "<-loopback>" },
    args: ["--disable-quic", "--force-webrtc-ip-handling-policy=disable_non_proxied_udp"],
    timeout: 10000,
  };
  let browser;
  try {
    try { browser = await chromium.launch(options); }
    catch (error) {
      if (process.platform !== "win32" || !String(error).includes("Executable doesn't exist")) throw error;
      browser = await chromium.launch({ ...options, channel: "msedge" });
    }
    const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
    for await (const line of lines) {
      let context;
      try {
        const { url } = JSON.parse(line);
        await publicTarget(url);
        context = await browser.newContext({ viewport: { width: 1000, height: 650 }, deviceScaleFactor: 1, serviceWorkers: "block", acceptDownloads: false });
        let requests = 0;
        await context.route("**/*", (route) => {
          const req = route.request();
          return ++requests <= 120 && /^https?:\/\//i.test(req.url()) && ["GET", "HEAD", "OPTIONS"].includes(req.method())
            ? route.continue() : route.abort();
        });
        await context.routeWebSocket("**/*", (socket) => socket.close());
        const page = await context.newPage();
        context.on("page", (other) => { if (other !== page) void other.close().catch(() => {}); });
        const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 9000 });
        if (!response?.ok() || !/^(?:text\/html|application\/xhtml\+xml)/i.test(response.headers()["content-type"] ?? "")) {
          throw new Error("page unavailable");
        }
        await Promise.race([page.waitForLoadState("load", { timeout: 1200 }).catch(() => {}), page.waitForTimeout(1200)]);
        const png = await page.screenshot({ timeout: 3000, animations: "disabled" });
        console.log(JSON.stringify({ png: png.toString("base64") }));
      } catch {
        console.log(JSON.stringify({ status: "unavailable" }));
      } finally {
        await context?.close().catch(() => {});
      }
    }
  } finally {
    await browser?.close();
    proxy.close();
  }
}

module.exports = { publicAddress, publicTarget, createProxy };
if (require.main === module) main().catch(() => { process.exitCode = 1; });
