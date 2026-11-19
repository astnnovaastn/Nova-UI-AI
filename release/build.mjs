// V35: builds an AEGIS release: four verified components, signed metadata and a Setup bundle.
//
//   node release/build.mjs --channel beta [--version 0.35.0-beta.1] --python <CPython dir> --packages <site-packages dir>
//        [--electron <electron dist>] [--key <private key pem>] [--notes <file.md>] [--out release/out] [--skip-build]
//        [--local-test]   (marks the build as a local test package that must never be published)
//
// Components (each a zip with a content id, kept between versions when unchanged):
//   electron   stock Electron dist, unmodified (Smart App Control trusts its known hashes)
//   python     signed CPython runtime without site-packages/tests (python.org build in CI)
//   packages   the backend's site-packages (pip install -r release/requirements-desktop.txt in CI)
//   app        AEGIS code only: an allowlist of code files and named assets. Never user data.
// The app is checked by a privacy scan (key patterns, the values in a local .env, the owner's email) before signing.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const frontend = path.join(repo, "astra_ai", "ui", "frontend");
const argv = process.argv.slice(2);
const opt = (name, fallback = "") => (argv.includes("--" + name) ? argv[argv.indexOf("--" + name) + 1] : fallback);
const flag = (name) => argv.includes("--" + name);
const pkg = JSON.parse(fs.readFileSync(path.join(frontend, "package.json"), "utf8"));
const channel = opt("channel", "dev");
if (!["stable", "beta", "dev"].includes(channel)) throw new Error("--channel must be stable, beta or dev");
const version = opt("version", pkg.version);
if (!/^\d+\.\d+\.\d+(-(beta|dev)\.\d+)?$/.test(version)) throw new Error("Version " + version + " is not x.y.z, x.y.z-beta.n or x.y.z-dev.n");
if ((channel === "stable") !== !version.includes("-")) throw new Error("Stable versions have no suffix; beta/dev versions need -beta.n / -dev.n");
if (channel !== "stable" && !version.includes("-" + channel + ".")) throw new Error("A " + channel + " version must end in -" + channel + ".n");
const out = path.resolve(opt("out", path.join(repo, "release", "out")));
const tar = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe");
const log = (s) => console.log("[release] " + s);

const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
function sha512(file) { const h = crypto.createHash("sha512"); const fd = fs.openSync(file, "r"); const b = Buffer.alloc(4 << 20); for (let n; (n = fs.readSync(fd, b, 0, b.length, null)) > 0;) h.update(b.subarray(0, n)); fs.closeSync(fd); return h.digest("hex"); }
function walk(dir, keep, base = dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).split(path.sep).join("/");
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) { if (keep(rel + "/", true)) walk(full, keep, base, acc); }
    else if (keep(rel, false)) acc.push(rel);
  }
  return acc;
}
function stageCopy(src, dest, files) {
  for (const rel of files) { const to = path.join(dest, ...rel.split("/")); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(path.join(src, ...rel.split("/")), to); }
}
function treeId(dir, files, prefix) {
  const h = crypto.createHash("sha256");
  for (const rel of [...files].sort()) h.update(rel + "\0" + sha256(path.join(dir, ...rel.split("/"))) + "\n");
  return prefix + h.digest("hex").slice(0, 16);
}
function zip(dir, file) {
  fs.rmSync(file, { force: true });
  const r = spawnSync(tar, ["-a", "-cf", file, "-C", dir, "."], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error("zip failed: " + r.stderr);
  return { file, size: fs.statSync(file).size, sha512: sha512(file) };
}

// ------------------------------------------------------------------ build the web app and canvas
if (!flag("skip-build")) {
  log("building the canvas and the web app");
  execFileSync("npm", ["run", "desktop:build"], { cwd: frontend, stdio: "inherit", shell: true });
}
if (!fs.existsSync(path.join(frontend, "dist", "index.html"))) throw new Error("dist/ is missing: build the frontend first");

const stage = path.join(out, "stage-" + version);
fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });
const components = {};

// ------------------------------------------------------------------ electron (stock)
{
  const src = path.resolve(opt("electron", path.join(frontend, "node_modules", "electron", "dist")));
  const ev = JSON.parse(fs.readFileSync(path.join(src, "..", "package.json"), "utf8")).version;
  const files = walk(src, () => true);
  const id = treeId(src, files, "e" + ev.replace(/\./g, "-") + "-");
  const dir = path.join(stage, "electron"); stageCopy(src, dir, files);
  const z = zip(dir, path.join(out, "aegis-electron-" + id + ".zip"));
  components.electron = { id, version: ev, asset: path.basename(z.file), size: z.size, sha512: z.sha512 };
  log("electron " + ev + " " + id);
}

// ------------------------------------------------------------------ python runtime (signed, no site-packages)
{
  const src = path.resolve(opt("python"));
  if (!src || !fs.existsSync(path.join(src, "python.exe"))) throw new Error("--python <CPython folder with python.exe> is required");
  const skip = /^(Lib\/site-packages\/|Lib\/test\/|Lib\/idlelib\/|Lib\/tkinter\/|Lib\/turtledemo\/|tcl\/|Scripts\/|Doc\/|include\/|libs\/|share\/)|__pycache__\/|\.pyc$/i;
  const files = walk(src, (rel) => !skip.test(rel));
  const ver = execFileSync(path.join(src, "python.exe"), ["-c", "import sys;print('%d.%d.%d'%sys.version_info[:3])"], { encoding: "utf8" }).trim();
  const signer = spawnSync("powershell.exe", ["-NoProfile", "-Command", `(Get-AuthenticodeSignature -LiteralPath '${path.join(src, "python.exe")}').SignerCertificate.Subject`], { encoding: "utf8" }).stdout.trim();
  const id = treeId(src, files, "p" + ver.replace(/\./g, "-") + "-");
  const dir = path.join(stage, "python"); stageCopy(src, dir, files);
  fs.mkdirSync(path.join(dir, "Lib", "site-packages"), { recursive: true });
  const z = zip(dir, path.join(out, "aegis-python-" + id + ".zip"));
  components.python = { id, version: ver, signer: signer.replace(/,.*$/, ""), asset: path.basename(z.file), size: z.size, sha512: z.sha512 };
  log("python " + ver + " " + id + " (" + signer.replace(/,.*$/, "") + ")");
}

// ------------------------------------------------------------------ python packages
{
  const src = path.resolve(opt("packages"));
  if (!src || !fs.existsSync(src)) throw new Error("--packages <site-packages folder> is required");
  const heavy = new RegExp("^(" + (opt("exclude-packages", "torch|torchgen|functorch|scipy|scipy\\.libs|sympy|nvidia|triton|tensorflow|jax|jaxlib|cv2|opencv[^/]*") ) + ")(-[^/]*\\.dist-info)?/", "i");
  const files = walk(src, (rel) => !heavy.test(rel) && !/__pycache__\/|\.pyc$|^pip\/|^pip-[^/]*\.dist-info\/|^_distutils_hack\/|^distutils-precedence\.pth$/i.test(rel));
  const id = treeId(src, files, "k-");
  const dir = path.join(stage, "packages"); stageCopy(src, dir, files);
  const z = zip(dir, path.join(out, "aegis-packages-" + id + ".zip"));
  components.packages = { id, asset: path.basename(z.file), size: z.size, sha512: z.sha512, files: files.length };
  log("packages " + id + " (" + files.length + " files)");
}

// ------------------------------------------------------------------ app (allowlist only)
const appDir = path.join(stage, "app");
{
  const pyRoots = ["astra_ai/core", "astra_ai/memory", "astra_ai/ui/backend", "astra_ai/services", "astra_ai/actions", "astra_ai/utils", "astra_ai/config", "astra_ai/tools"];
  const denyDir = /(^|\/)(tests?|__pycache__|backups?|test_backups|memory_unused_old|research_artifacts|learned|impact_vector|memory-runtime|ai_generated_images|guest_memory|[a-z]+_widget_data|speaker-model|context_preprocessor_data|node_modules|\.pytest_cache|logs|cache|state)\//i;
  const denyFile = /(_backup|\.backup|\.bak|backup)\b|^test_|_test\.py$|\.(sqlite3?|db|log|lock|tmp)$/i;
  const assets = ["astra_ai/core/widget_capabilities.json", "astra_ai/core/work/card_catalog.json", "astra_ai/ui/backend/config.yaml", "astra_ai/core/work/sandbox/Dockerfile"];
  const files = new Set(["astra_ai/__init__.py", "astra_ai/ui/__init__.py", "scripts/nova_runtime.py", ...assets].filter((f) => fs.existsSync(path.join(repo, f))));
  for (const r of pyRoots) {
    if (!fs.existsSync(path.join(repo, r))) continue;
    for (const rel of walk(path.join(repo, r), (p, isDir) => (isDir ? !denyDir.test("/" + p) : p.endsWith(".py") && !denyFile.test(path.posix.basename(p))))) files.add(r + "/" + rel);
  }
  for (const rel of walk(path.join(repo, "astra_ai/core/work/skills"), (p, isDir) => isDir || p.endsWith("SKILL.md"))) files.add("astra_ai/core/work/skills/" + rel);
  for (const rel of walk(path.join(frontend, "desktop"), (p) => !/^shell\/.*\.map$|\.test\.cjs$/.test(p))) files.add("astra_ai/ui/frontend/desktop/" + rel);
  for (const rel of walk(path.join(frontend, "dist"), () => true)) files.add("astra_ai/ui/frontend/dist/" + rel);
  files.add("astra_ai/ui/frontend/package.json");
  for (const rel of walk(path.join(repo, "release", "launcher"), () => true)) files.add("release/launcher/" + rel);
  const list = [...files].sort();
  stageCopy(repo, appDir, list);
  // Build facts the About page shows. No secrets, no paths.
  let commit = "";
  try { commit = execFileSync("git", ["-C", repo, "rev-parse", "--short=12", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch {}
  const build = { version, channel, commit: commit || process.env.GITHUB_SHA?.slice(0, 12) || "", built_at: new Date().toISOString(),
    local_test: flag("local-test"), electron: components.electron.version, python: components.python.version };
  fs.writeFileSync(path.join(appDir, "astra_ai/ui/frontend/desktop/build.json"), JSON.stringify(build, null, 1));
  fs.writeFileSync(path.join(appDir, "astra_ai/ui/frontend/package.json"), JSON.stringify({ ...pkg, version }, null, 2));
  privacyScan(appDir);
  const manifest = { version, files: {} };
  for (const rel of walk(appDir, () => true)) manifest.files[rel] = sha256(path.join(appDir, ...rel.split("/")));
  fs.writeFileSync(path.join(appDir, "manifest.json"), JSON.stringify(manifest));
  const z = zip(appDir, path.join(out, "aegis-app-" + version + ".zip"));
  components.app = { id: "a-" + version, asset: path.basename(z.file), size: z.size, sha512: z.sha512, files: Object.keys(manifest.files).length };
  log("app " + version + " (" + components.app.files + " files)");
}

function privacyScan(dir) {
  const secrets = [];
  const envFile = path.join(repo, ".env");
  if (fs.existsSync(envFile)) for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*['"]?(.+?)['"]?\s*$/);
    // Only secret-named settings: model names and switches are not private.
    if (m && /KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|PRIVATE|_PAT$/.test(m[1]) && m[2].length >= 12) secrets.push(m[2]);
  }
  const owner = process.env.AEGIS_RELEASE_PRIVATE_STRINGS ? process.env.AEGIS_RELEASE_PRIVATE_STRINGS.split(";").filter(Boolean) : [];
  const patterns = [/AIza[0-9A-Za-z_-]{35}/, /\bgsk_[A-Za-z0-9]{40,}/, /\bsk-(proj-)?[A-Za-z0-9_-]{32,}/, /\bnvapi-[A-Za-z0-9_-]{40,}/, /\btvly-[A-Za-z0-9]{24,}/, /\bghp_[A-Za-z0-9]{36}/, /\bgithub_pat_[A-Za-z0-9_]{60,}/, /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/];
  const hits = [];
  for (const rel of walk(dir, () => true)) {
    if (/\.(png|ico|jpe?g|webp|woff2?|ttf|gif|mp3|wav|onnx|wasm)$/i.test(rel)) continue;
    const text = fs.readFileSync(path.join(dir, ...rel.split("/")), "utf8");
    for (const p of patterns) if (p.test(text)) hits.push(rel + " matches " + p.source.slice(0, 24));
    for (const s of [...secrets, ...owner]) if (text.includes(s)) hits.push(rel + " contains a private value");
  }
  if (hits.length) throw new Error("Privacy scan failed; nothing was signed:\n  " + [...new Set(hits)].slice(0, 20).join("\n  "));
  log("privacy scan passed (" + secrets.length + " local secret values and " + patterns.length + " key patterns checked)");
}

// ------------------------------------------------------------------ signed metadata
const notesFile = opt("notes", path.join(repo, "release", "notes", version + ".md"));
const notes = fs.existsSync(notesFile) ? fs.readFileSync(notesFile, "utf8").trim() : "AEGIS " + version;
const meta = { schema: 1, product: "AEGIS", version, channel, tag: "v" + version, built_at: new Date().toISOString(), local_test: flag("local-test"),
  notes, components };
const raw = Buffer.from(JSON.stringify(meta, null, 1));
const keyPem = process.env.AEGIS_RELEASE_SIGNING_KEY || fs.readFileSync(opt("key", path.join(process.env.APPDATA || "", "AEGIS-release", "release-signing-key.pem")), "utf8");
const signature = crypto.sign(null, raw, crypto.createPrivateKey(keyPem)).toString("base64");
const publicPem = fs.readFileSync(path.join(frontend, "desktop", "release-public-key.pem"), "utf8");
if (!crypto.verify(null, raw, crypto.createPublicKey(publicPem), Buffer.from(signature, "base64"))) throw new Error("The signing key does not match desktop/release-public-key.pem");
fs.writeFileSync(path.join(out, "aegis-release.json"), raw);
fs.writeFileSync(path.join(out, "aegis-release.json.sig"), signature);
log("signed aegis-release.json");

// ------------------------------------------------------------------ Setup bundle (first install, works offline)
const setupName = "AEGIS-Setup-" + version;
const setup = path.join(stage, setupName);
fs.mkdirSync(path.join(setup, "installer"), { recursive: true });
for (const f of ["aegis-release.json", "aegis-release.json.sig", ...Object.values(components).map((c) => c.asset)]) fs.copyFileSync(path.join(out, f), path.join(setup, f));
for (const f of fs.readdirSync(path.join(here, "installer"))) fs.copyFileSync(path.join(here, "installer", f), path.join(setup, f.endsWith(".cmd") ? f : path.join("installer", f)));
for (const f of ["release-install.cjs", "release-public-key.pem"]) fs.copyFileSync(path.join(frontend, "desktop", f), path.join(setup, "installer", f));
const bundle = zip(setup, path.join(out, setupName + ".zip"));
fs.rmSync(stage, { recursive: true, force: true });
fs.writeFileSync(path.join(out, "release-notes.md"), notes + "\n");
log("Setup bundle " + path.basename(bundle.file) + " " + Math.round(bundle.size / 1048576) + " MB");
console.log(JSON.stringify({ version, channel, out, assets: [...Object.values(components).map((c) => c.asset), "aegis-release.json", "aegis-release.json.sig", path.basename(bundle.file)] }, null, 1));
