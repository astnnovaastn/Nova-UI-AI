// AEGIS installer core (V35), run by the bundle's stock electron.exe with ELECTRON_RUN_AS_NODE=1.
// node install.cjs --bundle <Setup folder> --root <install folder> [--desktop] [--import <dev copy>]
const fs = require("node:fs");
const path = require("node:path");
const release = require("./release-install.cjs");

const argv = process.argv.slice(2);
const opt = (name) => (argv.includes("--" + name) ? argv[argv.indexOf("--" + name) + 1] : "");
const bundle = path.resolve(opt("bundle"));
const root = path.resolve(opt("root"));
const say = (text) => console.log("  " + text);

try {
  const raw = fs.readFileSync(path.join(bundle, "aegis-release.json"));
  const sig = fs.readFileSync(path.join(bundle, "aegis-release.json.sig"), "utf8");
  const meta = release.verifyMetadata(raw, sig, fs.readFileSync(path.join(__dirname, "release-public-key.pem"), "utf8"));
  say("Release signature verified: AEGIS " + meta.version + " (" + meta.channel + ")");
  if (meta.local_test) say("Note: this is a local test build, not a published release.");
  const current = release.readJson(path.join(root, "current.json"), {});
  if (current.version && release.semverCompare(current.version, meta.version) > 0) throw new Error("AEGIS " + current.version + " is already installed, which is newer than " + meta.version + ".");
  const result = release.installRelease({ meta, assets: bundle, root, log: say });
  say("Installed " + result.extracted.join(", ") + (result.previous ? "; kept " + result.previous + " for rollback" : ""));
  // The person's data folder. Created if missing; never overwritten.
  // --data is for tests (a throwaway profile); a real install always uses %APPDATA%AEGISdata.
  const data = opt("data") ? path.join(path.resolve(opt("data")), "data") : path.join(process.env.APPDATA, "AEGIS", "data");
  fs.mkdirSync(path.join(data, "state"), { recursive: true });
  const from = opt("import");
  if (from) {
    const fresh = fs.readdirSync(path.join(data, "state")).length === 0;
    if (!fresh) say("Not importing: this computer already has AEGIS data (" + data + ").");
    else {
      if (fs.existsSync(path.join(from, "state"))) { fs.cpSync(path.join(from, "state"), path.join(data, "state"), { recursive: true, errorOnExist: false, force: false }); say("Imported state from " + from); }
      if (fs.existsSync(path.join(from, ".env")) && !fs.existsSync(path.join(data, ".env"))) { fs.copyFileSync(path.join(from, ".env"), path.join(data, ".env")); say("Imported settings (.env) from " + from); }
    }
  }
  if (argv.includes("--no-shell")) say("Skipped shortcuts and Apps & features (--no-shell)");
  else {
    release.shortcuts(root, { desktop: argv.includes("--desktop") }).forEach((p) => say("Shortcut " + p));
    release.register(root, meta);
    say("Registered AEGIS in Apps & features");
  }
} catch (error) {
  console.error("\nAEGIS was not installed: " + (error.message || error));
  process.exit(2);
}
