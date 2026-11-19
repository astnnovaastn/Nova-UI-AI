// V35 zero-network unit tests: release signatures, component checks, channel rules, update checks (mock GitHub).
const test = require("node:test");
const assert = require("node:assert");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const release = require("../../astra_ai/ui/frontend/desktop/release-install.cjs");
const { startFeed } = require("./mock-github.cjs");

const keys = crypto.generateKeyPairSync("ed25519");
const pub = keys.publicKey.export({ type: "spki", format: "pem" });
const sign = (raw) => crypto.sign(null, raw, keys.privateKey).toString("base64");
const comp = (name, id) => ({ id, asset: `aegis-${name}-${id}.zip`, size: 3, sha512: crypto.createHash("sha512").update("abc").digest("hex") });
const meta = (version, channel = version.includes("-") ? version.split("-")[1].split(".")[0] : "stable") => ({
  schema: 1, product: "AEGIS", version, channel, notes: "Notes for " + version,
  components: { electron: comp("electron", "e45-1"), python: comp("python", "p3-12-1"), packages: comp("packages", "k-1"), app: comp("app", "a-" + version) },
});

test("a signed release verifies; an edited one does not", () => {
  const raw = Buffer.from(JSON.stringify(meta("1.0.0")));
  assert.equal(release.verifyMetadata(raw, sign(raw), pub).version, "1.0.0");
  assert.throws(() => release.verifyMetadata(Buffer.from(raw.toString().replace("1.0.0", "9.9.9")), sign(raw), pub), /signature/);
});

test("a release signed with another key is refused", () => {
  const other = crypto.generateKeyPairSync("ed25519");
  const raw = Buffer.from(JSON.stringify(meta("1.0.0")));
  assert.throws(() => release.verifyMetadata(raw, crypto.sign(null, raw, other.privateKey).toString("base64"), pub), /signature/);
});

test("the shipped public key is an Ed25519 key", () => {
  const key = crypto.createPublicKey(fs.readFileSync(path.resolve(__dirname, "../../astra_ai/ui/frontend/desktop/release-public-key.pem")));
  assert.equal(key.asymmetricKeyType, "ed25519");
});

test("incomplete or foreign metadata is refused even when signed", () => {
  const bad = { ...meta("1.0.0"), product: "Other" };
  const raw = Buffer.from(JSON.stringify(bad));
  assert.throws(() => release.verifyMetadata(raw, sign(raw), pub), /not an AEGIS release/);
  const noApp = meta("1.0.0"); delete noApp.components.app;
  const raw2 = Buffer.from(JSON.stringify(noApp));
  assert.throws(() => release.verifyMetadata(raw2, sign(raw2), pub), /incomplete/);
});

test("a component must match its signed size and SHA-512", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-unit-"));
  const file = path.join(dir, "x.zip");
  fs.writeFileSync(file, "abc");
  release.verifyAsset(file, comp("app", "a"));
  fs.writeFileSync(file, "abd");
  assert.throws(() => release.verifyAsset(file, comp("app", "a")), /checksum/);
});

test("semantic version order", () => {
  assert.ok(release.semverCompare("1.2.0", "1.1.9") > 0);
  assert.ok(release.semverCompare("1.2.0", "1.2.0-beta.3") > 0);
  assert.ok(release.semverCompare("1.2.0-beta.10", "1.2.0-beta.9") > 0);
  assert.equal(release.semverCompare("1.2.0", "1.2.0"), 0);
});

// The updater with a fake Electron app, an installed layout and the mock private repository.
function fakeInstall(version, channel) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-upd-"));
  const root = path.join(dir, "install"), data = path.join(dir, "data");
  fs.mkdirSync(path.join(root, "versions", version, "app"), { recursive: true });
  fs.writeFileSync(path.join(root, "current.json"), JSON.stringify({ version }));
  fs.mkdirSync(data, { recursive: true });
  return { root, data, channel };
}
async function updaterFor(install, releases, { token = "ghp_" + "a".repeat(36) } = {}) {
  const feed = await startFeed({ repo: "o/r", token, releases });
  process.env.AEGIS_INSTALL_ROOT = install.root;
  process.env.AEGIS_APP_VERSION = "1.0.0";
  process.env.AEGIS_DATA_ROOT = install.data;
  process.env.AEGIS_UPDATE_FEED = feed.url;
  for (const m of ["installed.cjs", "updater.cjs"]) delete require.cache[require.resolve("../../astra_ai/ui/frontend/desktop/" + m)];
  const { updater } = require("../../astra_ai/ui/frontend/desktop/updater.cjs");
  const store = new Map();
  const safeStorage = { isEncryptionAvailable: () => true, encryptString: (s) => Buffer.from("enc:" + Buffer.from(s).toString("base64")), decryptString: (b) => Buffer.from(b.toString().slice(4), "base64").toString() };
  const app = { getPath: () => install.data, relaunch() {}, quit() {} };
  const u = updater({ app, safeStorage, publicKeyPem: pub });
  await u.commands.update_configure({ repo: "o/r", channel: install.channel, token });
  return { u, feed, store };
}
function releaseDir(version, { signed = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-rel-"));
  const raw = Buffer.from(JSON.stringify(meta(version)));
  fs.writeFileSync(path.join(dir, "aegis-release.json"), raw);
  if (signed) fs.writeFileSync(path.join(dir, "aegis-release.json.sig"), sign(raw));
  return dir;
}
// These tests sign with their own key and pass it to the updater; the shipped public key file is never touched.

test("stable channel ignores betas; beta channel takes the newest of both", async () => {
  const releases = [{ dir: releaseDir("1.1.0-beta.2"), version: "1.1.0-beta.2" }, { dir: releaseDir("1.0.1"), version: "1.0.1" }];
  const stable = await updaterFor(fakeInstall("1.0.0", "stable"), releases);
  assert.equal((await stable.u.check({ manual: true })).available?.version, "1.0.1");
  stable.feed.close();
  const beta = await updaterFor(fakeInstall("1.0.0", "beta"), releases);
  assert.equal((await beta.u.check({ manual: true })).available?.version, "1.1.0-beta.2");
  beta.feed.close();
});

test("drafts and unsigned releases are never offered", async () => {
  const { u, feed } = await updaterFor(fakeInstall("1.0.0", "beta"), [
    { dir: releaseDir("1.2.0"), version: "1.2.0", draft: true },
    { dir: releaseDir("1.1.0", { signed: false }), version: "1.1.0" }]);
  const s = await u.check({ manual: true });
  assert.notEqual(s.available?.version, "1.2.0");
  assert.equal(s.state, "error");
  assert.match(s.error, /no signed AEGIS metadata/);
  feed.close();
});

test("offline is quiet and keeps the installed version", async () => {
  const { u, feed } = await updaterFor(fakeInstall("1.0.0", "stable"), []);
  feed.close();
  await new Promise((r) => setTimeout(r, 100));
  const s = await u.check({ manual: true });
  assert.equal(s.state, "offline");
  assert.equal(s.version, "1.0.0");
});

test("the token is stored encrypted and must look like a GitHub token", async () => {
  const install = fakeInstall("1.0.0", "stable");
  const { u, feed } = await updaterFor(install, []);
  assert.ok(!fs.readFileSync(path.join(install.data, "update-token.bin")).toString().includes("ghp_"));
  await assert.rejects(async () => u.commands.update_configure({ token: "not a token" }), /GitHub token/);
  feed.close();
});

test("automatic checks are limited to one per hour", async () => {
  const { u, feed } = await updaterFor(fakeInstall("1.0.0", "stable"), []);
  await u.check({ manual: true });
  const calls = feed.seen.listCalls;
  await u.check();
  assert.equal(feed.seen.listCalls, calls);
  feed.close();
});
