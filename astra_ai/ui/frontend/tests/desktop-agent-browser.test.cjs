// The agent browser's plain rules: address checks, wall detection, the request format and the
// backend connection, with a fake WebSocket. No Electron, no network.
// Run: node --test tests/desktop-agent-browser.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
const ab = require("../desktop/agent-browser.cjs");

test("resolved addresses on this computer or private networks are refused", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.0.10", "172.20.1.1", "169.254.169.254", "0.0.0.0", "100.64.0.1", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "64:ff9b::7f00:1", "not-an-ip"]) {
    assert.equal(ab.privateAddress(ip), true, ip);
  }
  for (const ip of ["93.184.216.34", "208.80.154.224", "2620:0:861:ed1a::1"]) assert.equal(ab.privateAddress(ip), false, ip);
});

test("a name that resolves to any private address is refused, and answers are cached", async () => {
  const answers = { "public.example": ["93.184.216.34"], "rebind.example": ["93.184.216.34", "127.0.0.1"], "inner.example": ["10.0.0.5"] };
  let lookups = 0;
  const resolver = ab.makeResolver({
    lookup: async (host) => {
      lookups += 1;
      if (!answers[host]) throw new Error("ENOTFOUND");
      return answers[host].map((address) => ({ address }));
    },
  });
  assert.equal(await resolver("public.example"), true);
  assert.equal(await resolver("public.example."), true);
  assert.equal(lookups, 1);
  assert.equal(await resolver("rebind.example"), false);
  assert.equal(await resolver("inner.example"), false);
  assert.equal(await resolver("missing.example"), false);
  assert.equal(await resolver("localhost"), false);
  assert.equal(await resolver("127.0.0.1"), false);
  assert.equal(await resolver("intranet"), false);
});

test("only web requests are resolved; other schemes are refused", () => {
  assert.equal(ab.requestScheme("https://en.wikipedia.org/wiki/X"), "resolve");
  assert.equal(ab.requestScheme("wss://example.com/socket"), "resolve");
  assert.equal(ab.requestScheme("data:image/png;base64,AAAA"), "allow");
  assert.equal(ab.requestScheme("blob:https://example.com/abc"), "allow");
  for (const url of ["file:///C:/Windows/win.ini", "chrome://settings", "ftp://example.com/", "http://127.0.0.1:8340/api/health", "http://user:pw@example.com/", "http://localhost/", "http://192.168.1.1/", "nonsense"]) {
    assert.equal(ab.requestScheme(url), "deny", url);
  }
});

test("walls are recognised and stop the read", () => {
  assert.equal(ab.wallReason({ status: 429, text: "x".repeat(9000) }), "http_429");
  assert.equal(ab.wallReason({ status: 403 }), "http_403");
  assert.equal(ab.wallReason({ title: "Just a moment...", text: "Checking your browser" }), "bot_check");
  assert.equal(ab.wallReason({ text: "Our systems have detected unusual traffic from your computer network." }), "bot_check");
  assert.equal(ab.wallReason({ text: "Please verify", frames: ["https://www.google.com/recaptcha/api2/anchor?k=1"] }), "captcha");
  assert.equal(ab.wallReason({ text: "Please verify", frames: ["https://newassets.hcaptcha.com/captcha/v1/x"] }), "captcha");
  assert.equal(ab.wallReason({ text: "", challenge: true }), "captcha");
  assert.equal(ab.wallReason({ finalUrl: "https://consent.google.com/ml?continue=x", text: "Before you continue to Google" }), "consent_wall");
  assert.equal(ab.wallReason({ text: "Before you continue. We value your privacy. Accept all cookies" }), "consent_wall");
});

test("an ordinary article is not a wall, even with an invisible reCAPTCHA or a cookie banner", () => {
  const article = "Brutalist architecture is an architectural style. ".repeat(200) + " We value your privacy. Accept all cookies.";
  assert.equal(ab.wallReason({ status: 200, finalUrl: "https://en.wikipedia.org/wiki/Brutalist_architecture", title: "Brutalist architecture - Wikipedia", text: article, frames: ["https://www.google.com/recaptcha/api2/anchor?size=invisible"] }), "");
  assert.equal(ab.wallReason({ status: 404, text: "Not found" }), "");
});

test("page data is cut to the agreed shape and sizes", () => {
  const raw = {
    title: "T".repeat(5000),
    text: "x".repeat(70000),
    links: [{ href: "javascript:alert(1)", text: "bad" }, ...Array.from({ length: 300 }, (_, i) => ({ href: `https://example.com/${i}`, text: "y".repeat(900) }))],
    images: [{ src: "data:image/png;base64,AA", alt: "" }, ...Array.from({ length: 60 }, (_, i) => ({ src: `https://example.com/${i}.png`, alt: 5 }))],
    extra: "dropped",
  };
  const page = ab.pageResult(raw, "https://example.com/");
  assert.deepEqual(Object.keys(page).sort(), ["final_url", "images", "links", "text", "title"]);
  assert.equal(page.title.length, 1000);
  assert.equal(page.text.length, 60000);
  assert.equal(page.links.length, 200);
  assert.equal(page.links[0].href, "https://example.com/0");
  assert.equal(page.links[0].text.length, 300);
  assert.equal(page.images.length, 40);
  assert.equal(page.images[0].alt, "");
  assert.deepEqual(ab.pageResult(null, "https://example.com/"), { final_url: "https://example.com/", title: "", text: "", links: [], images: [] });
});

test("the extraction script reads only and has the fixed shape", () => {
  for (const word of ["fetch(", "XMLHttpRequest", ".click(", "submit(", "localStorage", "document.cookie", "eval(", "location ="]) assert.ok(!ab.EXTRACT_SCRIPT.includes(word), word);
  assert.doesNotThrow(() => new Function(`return ${ab.EXTRACT_SCRIPT}`));
});

test("requests are parsed strictly and errors are reduced to codes", () => {
  assert.deepEqual(ab.parseRequest('{"id":3,"action":"render","url":"https://a.example/"}'), { id: 3, action: "render", url: "https://a.example/" });
  for (const raw of ["nope", "{}", '{"id":"3","action":"render","url":"x"}', '{"id":1,"action":"click","url":"https://a.example/"}', `{"id":1,"action":"render","url":"${"a".repeat(5000)}"}`]) assert.equal(ab.parseRequest(raw), null, raw);
  const coded = new Error("x");
  coded.code = "load_timeout";
  assert.equal(ab.errorCode(coded), "load_timeout");
  assert.equal(ab.errorCode(new Error("page said <script>")), "renderer_failed");
  const odd = new Error("x");
  odd.code = "Has Spaces and https://leak";
  assert.equal(ab.errorCode(odd), "renderer_failed");
});

/** A WebSocket stand-in the test drives by hand. */
class FakeSocket {
  static made = [];
  constructor(url) {
    this.url = url;
    this.sent = [];
    this.closed = false;
    FakeSocket.made.push(this);
  }
  send(data) {
    this.sent.push(JSON.parse(data));
  }
  close() {
    this.closed = true;
  }
  open() {
    this.onopen?.();
  }
  receive(message) {
    this.onmessage?.({ data: typeof message === "string" ? message : JSON.stringify(message) });
  }
  drop() {
    this.onclose?.();
  }
}

function fakeTimers() {
  const pending = [];
  return {
    pending,
    timers: {
      set: (fn, ms) => {
        const timer = { fn, ms };
        pending.push(timer);
        return timer;
      },
      clear: (timer) => {
        const at = pending.indexOf(timer);
        if (at >= 0) pending.splice(at, 1);
      },
    },
    fire() {
      const timer = pending.shift();
      timer.fn();
      return timer.ms;
    },
  };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test("the link says hello with the token, answers only after ready, and reports errors as codes", async () => {
  FakeSocket.made = [];
  const calls = [];
  const clock = fakeTimers();
  const link = new ab.HostLink({
    url: "ws://127.0.0.1:1/x",
    token: "t".repeat(43),
    WebSocketImpl: FakeSocket,
    timers: clock.timers,
    handle: async (action, url) => {
      calls.push([action, url]);
      if (url.includes("fail")) throw Object.assign(new Error("boom https://secret"), { code: "load_failed" });
      return { final_url: url, title: "ok", text: "", links: [], images: [] };
    },
  }).start();
  const socket = FakeSocket.made[0];
  socket.open();
  assert.deepEqual(socket.sent[0], { type: "hello", token: "t".repeat(43) });
  // Before the backend accepts the token, nothing is served.
  socket.receive({ id: 1, action: "render", url: "https://a.example/" });
  await settle();
  assert.equal(calls.length, 0);
  socket.receive({ type: "ready" });
  socket.receive({ id: 2, action: "render", url: "https://a.example/" });
  socket.receive({ id: 3, action: "screenshot", url: "https://fail.example/" });
  socket.receive({ id: 4, action: "evaluate", url: "https://a.example/" });
  await settle();
  await settle();
  assert.deepEqual(calls, [["render", "https://a.example/"], ["screenshot", "https://fail.example/"]]);
  assert.deepEqual(socket.sent[1], { id: 2, ok: true, result: { final_url: "https://a.example/", title: "ok", text: "", links: [], images: [] } });
  assert.deepEqual(socket.sent[2], { id: 3, ok: false, error: "load_failed" });
  assert.equal(socket.sent.length, 3);
  link.stop();
  assert.equal(socket.closed, true);
});

test("the link reconnects with growing backoff, resets after ready, and stops for good", () => {
  FakeSocket.made = [];
  const clock = fakeTimers();
  const link = new ab.HostLink({ token: "t".repeat(43), WebSocketImpl: FakeSocket, timers: clock.timers, handle: async () => ({}), minDelay: 1000, maxDelay: 4000 }).start();
  assert.equal(FakeSocket.made[0].url, ab.HOST_URL);
  FakeSocket.made[0].drop();
  assert.equal(clock.fire(), 1000);
  FakeSocket.made[1].drop();
  assert.equal(clock.fire(), 2000);
  FakeSocket.made[2].drop();
  assert.equal(clock.fire(), 4000);
  FakeSocket.made[3].drop();
  assert.equal(clock.fire(), 4000);
  const live = FakeSocket.made[4];
  live.open();
  live.receive({ type: "ready" });
  live.drop();
  assert.equal(clock.pending[0].ms, 1000);
  // kick() skips the wait once the backend is known to be up.
  link.kick();
  assert.equal(clock.pending.length, 0);
  assert.equal(FakeSocket.made.length, 6);
  link.stop();
  FakeSocket.made[5].drop();
  assert.equal(clock.pending.length, 0);
});

test("the token file is written fresh with a long random token", () => {
  const dir = require("node:fs").mkdtempSync(require("node:path").join(require("node:os").tmpdir(), "aegis-ab-"));
  const first = ab.writeToken(dir);
  const second = ab.writeToken(dir);
  assert.ok(first.token.length >= 43);
  assert.notEqual(first.token, second.token);
  assert.equal(require("node:fs").readFileSync(second.file, "utf8"), second.token);
});
