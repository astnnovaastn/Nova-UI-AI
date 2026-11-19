# AEGIS Desktop releases (V35)

AEGIS installs as a normal per-user Windows app and updates itself from GitHub Releases of the private AEGIS
repository. It is built to run under **Smart App Control**: no new executable is ever created. The stock Electron
and the signed CPython runtime ship unchanged, and AEGIS itself ships as an Ed25519-signed package of source files.

## One-time setup (development PC)
1. `node release/keys.mjs`. This creates the release signing key in `%APPDATA%\AEGIS-release\release-signing-key.pem`
   and writes the public key to `astra_ai/ui/frontend/desktop/release-public-key.pem` (that file is committed).
   Back up the private key somewhere safe. Losing it means installed copies can no longer verify new releases.
2. GitHub → repository → Settings → Secrets and variables → Actions:
   - add `AEGIS_RELEASE_SIGNING_KEY` with the whole private key file.
3. GitHub → Settings → Environments:
   - create `release` (beta/dev);
   - create `release-stable` with yourself as a required reviewer, so stable versions wait for your approval.
4. Before every push: `node release/check-repo.mjs` (CI runs it too). It refuses to continue if keys or personal data
   would be committed.

## Publishing a version
1. Set `"version"` in `astra_ai/ui/frontend/package.json` (`0.36.0`, `0.36.0-beta.1` or `0.36.0-dev.1`).
2. Write `release/notes/<version>.md`.
3. Commit, then tag and push the tag: `git tag v0.36.0-beta.1 && git push origin v0.36.0-beta.1`.
4. The **Release** workflow then:
   - builds the canvas and web app;
   - runs the tests (no network, no model calls);
   - installs the pinned Python packages;
   - builds the four components;
   - runs the privacy scan, signs the metadata and publishes the GitHub Release (beta/dev as pre-releases).
5. Ordinary pushes run **CI** only and never publish anything.

## Installing on a computer (laptop)
1. Download `AEGIS-Setup-<version>.zip` from the release (you need access to the private repository).
2. Right-click → Extract all.
3. Double-click **Install AEGIS.cmd**. It installs into `%LOCALAPPDATA%\Programs\AEGIS`, adds a Start Menu
   shortcut (`-DesktopShortcut` adds one on the desktop too) and an Apps & features entry.
4. In AEGIS → Settings → About and updates, set the repository (`owner/name`) and a fine-grained GitHub token with
   **read-only Contents** access to that repository. The token is stored encrypted for your Windows account and
   never leaves this computer.
5. Updates: AEGIS checks 90 s after start-up, every 6 hours and when you press Check for updates. Each update is
   downloaded, verified and installed only when you press Install and restart. The previous version is kept for
   rollback.

## Building locally (test packages, never published)
`node release/build.mjs --channel beta --version 0.35.0-beta.1 --local-test --python <signed CPython folder> --packages .venv/Lib/site-packages --out <folder>`
Tests:
- `node release/test/release.e2e.cjs <folder with beta.1 and beta.2>`: install, run, update, rollback and uninstall,
  in a throwaway folder on its own ports.
- `node --test release/test/release-unit.test.cjs`
- `node release/test/perf.cjs <Setup zip>`

## Layout
| Where | What |
|---|---|
| `%LOCALAPPDATA%\Programs\AEGIS\` | the program: `current.json`, `launcher\`, `runtime\electron-*`, `runtime\python-*`, `python-env\*`, `versions\<v>\app` |
| `%APPDATA%\AEGIS\` | your browser profile, settings, update token |
| `%APPDATA%\AEGIS\data\` | your AEGIS data: `state\` (research, Work, notes, tasks, grants, drafts), `.env` (keys), `backups\` (before each update) |

The installed app uses ports 5183 (UI), 8350 (backend) and 8351 (runtime), so it can run beside a development copy
(5173/8340/8341). Both use the `%APPDATA%\AEGIS` browser profile, so open only one of them at a time.
