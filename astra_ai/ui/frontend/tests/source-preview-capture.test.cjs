const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const net = require("node:net");
const { publicTarget, publicAddress, createProxy } = require("../source-preview-capture.cjs");

test("public web addresses are pinned, and DNS answers cannot mix public and private IPs", async () => {
  const publicIp = "1.1.1.1";
  const result = await publicTarget("https://example.org/path", async () => [{ address: publicIp, family: 4 }]);
  assert.equal(result.ip, publicIp);
  await assert.rejects(publicTarget("https://example.org", async () => [
    { address: publicIp, family: 4 }, { address: "192.168.1.2", family: 4 },
  ]), /non-public/);
  for (const address of ["127.0.0.1", "169.254.169.254", "100.64.0.2", "::1", "::ffff:127.0.0.1", "fd00::1"]) {
    assert.equal(publicAddress(address), false, address);
  }
  assert.equal(publicAddress("2606:4700:4700::1111"), true);
});

test("the capture proxy rejects both a redirect target and a private HTTPS tunnel", async () => {
  const proxy = createProxy();
  await new Promise((done) => proxy.server.listen(0, "127.0.0.1", done));
  const port = proxy.server.address().port;
  try {
    const status = await new Promise((done, fail) => {
      http.get({ hostname: "127.0.0.1", port, path: "http://169.254.169.254/secret" }, (reply) => {
        reply.resume();
        done(reply.statusCode);
      }).on("error", fail);
    });
    assert.equal(status, 403);
    const result = await new Promise((done, fail) => {
      const socket = net.connect(port, "127.0.0.1");
      socket.on("connect", () => socket.write("CONNECT 127.0.0.1:443 HTTP/1.1\r\nHost: 127.0.0.1:443\r\n\r\n"));
      socket.on("data", (data) => { done(String(data)); socket.destroy(); });
      socket.on("error", fail);
    });
    assert.match(result, /^HTTP\/1.1 403 /);
  } finally { proxy.close(); }
});
