// V35: refuses a commit/push that would put keys or personal data into the repository.
// Scans every file git would track (tracked + untracked, not ignored): key patterns, the values of secret-named
// settings in a local .env (only on a machine that has one), the owner's email (AEGIS_RELEASE_PRIVATE_STRINGS,
// ';'-separated), database / environment / private-key files, and files over 50 MB.
// Usage: node release/check-repo.mjs        (exit 1 with the offending paths, never the secret values)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = execFileSync("git", ["-C", repo, "ls-files", "-co", "--exclude-standard", "-z"], { encoding: "utf8", maxBuffer: 1 << 28 }).split("\0").filter(Boolean);
const secrets = [];
const env = path.join(repo, ".env");
if (fs.existsSync(env)) for (const line of fs.readFileSync(env, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*['"]?(.+?)['"]?\s*$/);
  if (m && /KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|PRIVATE|_PAT$/.test(m[1]) && m[2].length >= 12) secrets.push([m[1], m[2]]);
}
for (const s of (process.env.AEGIS_RELEASE_PRIVATE_STRINGS || "").split(";").filter(Boolean)) secrets.push(["private string", s]);
const patterns = [/AIza[0-9A-Za-z_-]{35}/, /\bgsk_[A-Za-z0-9]{40,}/, /\bsk-(proj-)?[A-Za-z0-9_-]{32,}/, /\bnvapi-[A-Za-z0-9_-]{40,}/, /\btvly-[A-Za-z0-9]{24,}/,
  /\bghp_[A-Za-z0-9]{36}\b/, /\bgithub_pat_[A-Za-z0-9_]{60,}/, /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, /\bxox[baprs]-[A-Za-z0-9-]{20,}/];
const forbidden = /(^|\/)\.env(\.|$)|\.(sqlite3?|db|pem|key|pfx|p12)$|(^|\/)state\//i;
const environmentExamples = new Set([".env.example", "astra_ai/ui/.env.example"]);
const problems = [];
for (const rel of files) {
  if (forbidden.test(rel) && !environmentExamples.has(rel) && rel !== "astra_ai/ui/frontend/desktop/release-public-key.pem") { problems.push(rel + ": this kind of file must not be committed"); continue; }
  const full = path.join(repo, rel);
  let stat;
  try { stat = fs.lstatSync(full); } catch { continue; }
  if (!stat.isFile()) continue;
  if (stat.size > 50e6) { problems.push(rel + ": larger than 50 MB"); continue; }
  if (/\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|mp3|wav|mp4|onnx|wasm|zip|pdf)$/i.test(rel)) continue;
  const text = fs.readFileSync(full, "utf8");
  for (const p of patterns) if (p.test(text)) problems.push(rel + ": looks like a key (" + p.source.slice(0, 18) + "…)");
  for (const [name, value] of secrets) if (text.includes(value)) problems.push(rel + ": contains the value of " + name);
}
if (problems.length) {
  console.error("Repository check failed (" + problems.length + "):\n  " + [...new Set(problems)].slice(0, 60).join("\n  "));
  process.exit(1);
}
console.log("Repository check passed: " + files.length + " files, " + patterns.length + " key patterns, " + secrets.length + " local secret values.");
