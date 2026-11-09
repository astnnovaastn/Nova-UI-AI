import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { scopedStyles } from "./scripts/scope-css.mjs";

const at = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

const alias = [
  ...["app", "features", "session", "domain", "shared", "styles"].map((layer) => ({
    find: `$${layer}`,
    replacement: at(`./upstream/src/${layer}`),
  })),
  // Only this seam changes: Zephium's generated bindings stay byte-for-byte upstream.
  { find: "@tauri-apps/api/core", replacement: at("./src/native/core.ts") },
  { find: "@tauri-apps/api/event", replacement: at("./src/native/event.ts") },
  { find: "@tauri-apps/api/window", replacement: at("./src/native/window.ts") },
  { find: "@tauri-apps/api/webview", replacement: at("./src/native/window.ts") },
];

/** Page pictures and media come from AEGIS's own scoped routes. */
const media: Plugin = {
  name: "aegis-media",
  enforce: "pre",
  transform(code, id) {
    if (!id.replace(/\\/g, "/").endsWith("/domain/resources/media.ts")) return null;
    return (
      code
        .replace("export function mediaUrl(", "function nativeMediaUrl(")
        .replace("export function pageFrameUrl(", "function nativePageFrameUrl(") +
      `\nimport { mediaUrl, pageFrameUrl } from ${JSON.stringify(at("./src/media.ts"))};\nexport { mediaUrl, pageFrameUrl };\n`
    );
  },
};

/** AEGIS produces no diagrams yet, so elkjs (EPL-2.0 or GPL) is not shipped. */
const noElk: Plugin = {
  name: "aegis-no-elk",
  enforce: "pre",
  resolveId(source) {
    return source.startsWith("elkjs/") ? "\0aegis-no-elk" + (source.endsWith("?url") ? "?url" : "") : null;
  },
  load(id) {
    if (!id.startsWith("\0aegis-no-elk")) return null;
    return id.endsWith("?url") ? 'export default "";' : "export {};";
  },
};

/** The compliance notice ships beside the code it covers. */
const notice: Plugin = {
  name: "aegis-notice",
  apply: "build",
  generateBundle() {
    this.emitFile({ type: "asset", fileName: "NOTICE.txt", source: readFileSync(at("./NOTICE.md"), "utf8") });
    this.emitFile({ type: "asset", fileName: "LICENSE-MPL-2.0.txt", source: readFileSync(at("./upstream/LICENSE"), "utf8") });
  },
};

export default defineConfig({
  base: './',
  resolve: { alias },
  plugins: [
    media,
    noElk,
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./upstream/src/shared/i18n",
      emitTsDeclarations: true,
      strategy: ["baseLocale"],
    }),
    svelte(),
    tailwindcss(),
    scopedStyles(),
    notice,
  ],
  publicDir: false,
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  worker: { format: "es", plugins: () => [noElk], rollupOptions: { output: { entryFileNames: "assets/[name].js" } } },
  logLevel: "warn",
  test: { include: ["tests/**/*.test.ts"] },
  build: {
    target: "es2022",
    outDir: at("../public/work-canvas"),
    emptyOutDir: true,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 1500,
    lib: {
      entry: at("./src/entry.ts"),
      formats: ["es"],
      fileName: () => "aegis-work.js",
      cssFileName: "aegis-work",
    },
  },
} as never);
