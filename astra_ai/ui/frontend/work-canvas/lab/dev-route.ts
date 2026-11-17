/**
 * AEGIS Work Layout Lab and Agent Execution Lab — the development-only routes.
 *
 * Adds  http://127.0.0.1:5173/dev/work-layout-lab/  and  /dev/agent-execution-lab/  to the
 * existing Vite dev server. `apply: "serve"` means this plugin does not exist in a production
 * build, and the labs' files live in work-canvas/lab/dist, which `vite build` never reads. It
 * serves prebuilt static files only: no API, no proxy, no backend, no AI. Both pages share one
 * build; only their page differs.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const root = fileURLToPath(new URL("./dist", import.meta.url));
const PAGES: Record<string, string> = {
  "/dev/work-layout-lab": "index.html",
  "/dev/agent-execution-lab": "agent.html",
};
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

/** Zephium's object fixtures name QA pictures its repository does not carry: each gets a labelled placeholder. */
function placeholder(name: string): string {
  let hue = 0;
  for (const char of name) hue = (hue * 31 + char.charCodeAt(0)) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 50% 66%)"/><stop offset="1" stop-color="hsl(${(hue + 55) % 360} 50% 38%)"/></linearGradient></defs><rect width="1200" height="900" fill="url(#g)"/><circle cx="930" cy="230" r="110" fill="hsl(${(hue + 30) % 360} 80% 82%)" opacity=".5"/><path d="M0 900 L330 470 L560 700 L790 420 L1200 900Z" fill="hsl(${hue} 45% 24%)" opacity=".5"/><text x="1170" y="868" text-anchor="end" font-family="system-ui,sans-serif" font-size="30" fill="#fff" opacity=".85">placeholder picture</text></svg>`;
}

export function workLayoutLab(): Plugin {
  return {
    name: "aegis-work-layout-lab",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = decodeURIComponent((request.url ?? "").split("?")[0] ?? "");
        const local = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(request.socket.remoteAddress ?? "");
        if (pathname.startsWith("/node_modules/.work-look/") && local) {
          response.setHeader("Content-Type", "image/svg+xml");
          response.end(placeholder(pathname));
          return;
        }
        const BASE = Object.keys(PAGES).find((base) => pathname === base || pathname.startsWith(`${base}/`));
        if (!BASE) return next();
        if (!local) {
          response.statusCode = 403;
          response.end("The AEGIS labs are available on this machine only.");
          return;
        }
        if (pathname === BASE) {
          response.statusCode = 302;
          response.setHeader("Location", `${BASE}/`);
          response.end();
          return;
        }
        const target = path.resolve(root, pathname.slice(BASE.length + 1) || PAGES[BASE]!);
        if (target !== root && !target.startsWith(root + path.sep)) {
          response.statusCode = 403;
          response.end();
          return;
        }
        if (!existsSync(target) || !statSync(target).isFile()) {
          response.statusCode = existsSync(path.join(root, "index.html")) ? 404 : 503;
          response.setHeader("Content-Type", "text/plain; charset=utf-8");
          response.end(
            response.statusCode === 503
              ? "The Work Layout Lab has not been built yet.\nRun:  npm run lab:build   (in astra_ai/ui/frontend)"
              : "Not found",
          );
          return;
        }
        response.setHeader("Content-Type", TYPES[path.extname(target)] ?? "application/octet-stream");
        response.setHeader("Cache-Control", "no-store");
        response.end(readFileSync(target));
      });
    },
  };
}
