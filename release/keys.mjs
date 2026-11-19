// V35: creates the AEGIS release signing key pair (Ed25519), once.
// The private key never goes into the repository: it is written to %APPDATA%\AEGIS-release\release-signing-key.pem
// (or --out) and must be added to the GitHub repository secret AEGIS_RELEASE_SIGNING_KEY for the release workflow.
// The public key is written to astra_ai/ui/frontend/desktop/release-public-key.pem and ships in every release.
// Usage: node release/keys.mjs [--out <private key file>] [--force]
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const out = args.includes("--out") ? args[args.indexOf("--out") + 1] : path.join(process.env.APPDATA, "AEGIS-release", "release-signing-key.pem");
const pub = path.resolve(here, "..", "astra_ai", "ui", "frontend", "desktop", "release-public-key.pem");
if (fs.existsSync(out) && !args.includes("--force")) {
  console.log("A signing key already exists at " + out + " (use --force to replace it; old releases would no longer verify).");
  process.exit(0);
}
const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 });
fs.writeFileSync(pub, publicKey.export({ type: "spki", format: "pem" }));
console.log("Private key: " + out + "\nPublic key:  " + pub + "\nAdd the private key's contents to the GitHub secret AEGIS_RELEASE_SIGNING_KEY.");
