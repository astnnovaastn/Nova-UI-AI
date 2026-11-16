# AEGIS Desktop and the native source browser

AEGIS now runs two ways from the same code and the same backend:

- **AEGIS Web**: the existing site at `http://127.0.0.1:5173/`, unchanged.
- **AEGIS Desktop**: its own window, icon and shortcuts. Sources open as real, live websites in
  floating panes inside the Research Workspace.

## Run it

| What | Command (from `astra_ai/ui/frontend`) |
| --- | --- |
| Start AEGIS Desktop | `npm run desktop`, or the **AEGIS** shortcut on the Desktop / Start Menu |
| Recreate the shortcuts | `npm run desktop:shortcuts` |
| Desktop checks (47) | `npm run test:desktop` |
| Web source-browser checks (8) | `node tests/browser-web.e2e.cjs` (AEGIS must be running) |
| Rebuild the canvas after editing `work-canvas/src` | `npm run build:canvas` |

Starting the app is all that is needed: if AEGIS is not answering, the app runs the project's own
`start_nova_ai.ps1 -NoBrowser`, waits for it, and opens the workspace. On exit it runs
`stop_nova_ai.ps1`, but only if it was the one that started the services.

Set `AEGIS_DESKTOP_DEVTOOLS=1` to open DevTools for the main window.

## Why the old browser said "This site doesn't allow being shown inside other apps"

The source browser was an `<iframe>` (`work-canvas/src/BrowserWindow.svelte`). Before loading it,
the frontend asks the backend (`/api/research/frame-check`, `core/research/frame_policy.py`) to read
the site's response headers. Sites such as deepmind.google send
`Content-Security-Policy: frame-ancestors` or `X-Frame-Options`, which tell every browser not to
draw them inside another page. The backend reports `frame_ancestors` / `x_frame_options`, and the
pane shows that sentence (`browser-address.ts`). It is not a network error or a sandbox problem;
the site forbids framing, and an iframe has no honest way around that.

The fix is not to frame the site. On the desktop each pane is a separate browser view showing the
site as a top-level document, exactly as a browser tab does, so framing rules do not apply. No
header is stripped, no page is proxied, no origin is changed.

## Architecture

```
work-canvas/src/browser-host.ts      ResearchBrowserHost: the one place that knows the runtime
        ├─ webHost      (kind "frame")   AEGIS Web: iframe pane, as before
        └─ desktopHost  (kind "native")  AEGIS Desktop: calls the desktop process
work-canvas/src/BrowserWindow.svelte  one source window; asks the host, never the runtime
work-canvas/src/browser-windows.svelte.ts  window state (+ `live`: what a native pane is showing)

desktop/main.cjs      window, start-up, commands, native panes (Electron WebContentsView)
desktop/preload.cjs   the bridge: a single `aegisDesktop.invoke`, main window only
desktop/addresses.cjs workspace-address and public-page rules
desktop/services.cjs  start / stop through the project's launcher scripts
desktop/shell/        the bundled start page (status, and settings if AEGIS can't be reached)
```

**Positioning.** A native view is not a DOM element: CSS transforms, z-index and clipping do not
apply to it. The source windows already live in a screen-space layer over the canvas (not inside
the zoomed and panned canvas), so canvas zoom never touches them. The pane measures the rectangle
it wants the page in and sends it to the desktop process on every move and resize. The rectangle is
inset 6px from the pane's edges so the resize grips and rounded corners stay outside the view.

**Layering.** A native view always paints above the page. Every 150 ms the pane checks whether
anything of AEGIS's is in front of it (another source window, a dialog, a menu, a side panel); if
so the view is hidden and a short note stands in its place. It comes back when uncovered. A
minimized pane hides its view. Closing a pane, switching research, or reloading the workspace
destroys the page and its process.

**Unsupported pages.** If a page cannot load (no connection, bad certificate, unknown name) the pane
says why and offers *Try again* and the *Source Reader* (text AEGIS retrieved, labelled as such).
*Open in browser* hands the address to the default browser.

## Backend connection

The desktop app does not contain the backend, any API key, or any credential. It opens the AEGIS
web app at a configured address, and that web app reaches the backend same-origin (`/api`, `/ws`),
as it does in a browser. Settings are in `%APPDATA%\AEGIS\desktop.json`:

| Setting | Default | Meaning |
| --- | --- | --- |
| `uiUrl` | `http://127.0.0.1:5173/` | Where the AEGIS web app is served. Another computer must use `https`. |
| `projectRoot` | this project | Folder with `start_nova_ai.ps1`, used to start AEGIS locally. Empty for a remote workspace. |
| `autoStart` | `true` | Start the local services when the workspace is not answering. |
| `stopOnExit` | `true` | Stop them on exit if this app started them. |

If the workspace cannot be reached, the start page shows the reason and these settings.

## Security decisions

- A source page gets **no bridge**: no preload, no Node, sandboxed renderer. The bridge exists only
  in the main window, and the desktop process also checks every call: it must come from the main
  window's top frame, and from the workspace origin (pane commands) or the bundled start page
  (settings). A frame inside the workspace cannot call it.
- Panes use their own cookie store (`persist:aegis-browser`), separate from the workspace's.
- A pane may navigate only to public `http(s)` addresses. Loopback, private-network, `file:` and
  other schemes are refused, and the person is told. This keeps pages away from the local backend.
- Every permission request in a pane (camera, microphone, location, notifications, devices) is
  refused without a prompt. Downloads are cancelled. `window.open` never creates a window: the
  workspace opens the address as another pane if it is a public page.
- The workspace window itself may only show the start page or the workspace; any other link opens
  in the default browser. Its permissions are limited to what AEGIS uses (microphone and camera,
  clipboard, fullscreen, notifications).
- Text from a source page reaches the AI only through the existing backend paths (Add to Work,
  Source Reader), which already sanitize it. The desktop app adds no new path from page to model.

## Test results (2026-11-15)

- `tests/desktop.e2e.cjs`: **47/47**. Real app, saved research, real sites. Covers launch, workspace
  load, deepmind.google loading natively, scroll, link click, Back/Forward/Reload, address field,
  move, resize, canvas zoom untouched, several panes, minimize/restore, cleanup on close, and the
  isolation checks above.
- `tests/browser-web.e2e.cjs`: **8/8**. Web still uses the sandboxed iframe, still reports a
  refusing site honestly and offers the Source Reader.
- `work-canvas` unit tests: **258/258**. `tsc --noEmit`: clean.
- `tests/research.test.mjs`: 19/21. The two failures are in `ResearchWorkspace.tsx` (last changed
  2026-11-12), which this work did not touch.

## Not supported, and why

- **No installer `.exe`, and not WebView2.** This PC has Windows Smart App Control on. It blocks
  every unsigned program built locally: Rust's build steps (so Tauri cannot compile here) and any
  unsigned installer or app `.exe`. Electron's published runtime is allowed, so AEGIS Desktop runs
  on it directly from this folder, with shortcuts instead of an installer. The engine is Electron's
  Chromium rather than WebView2.
- `src-tauri/` holds a Tauri/WebView2 version of the same design (same commands, same security
  rules). **It has never compiled or run.** Building it needs a machine without Smart App Control
  (or CI) and a trusted code-signing certificate for the result to run here.
- Downloads and site permissions are off in panes by design.
- Sites that refuse embedded or automated browsers at sign-in (some Google and bank logins) may
  refuse here too.
- A page hidden behind another AEGIS window is not shown as a dimmed picture; it is hidden.
- Minimized-pane chips can sit under a low pane, as on the web.
