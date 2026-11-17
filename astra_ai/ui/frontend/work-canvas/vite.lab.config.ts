/**
 * AEGIS Work Layout Lab and Agent Execution Lab — development only.
 *
 * Builds the lab against the UNMODIFIED Zephium reference clone (not the patched
 * `upstream/` copy the production canvas uses), so what the lab shows is the original
 * component. Output goes to `lab/dist`, which the production build never reads.
 *
 *   npm run lab:build      (from work-canvas)
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

const at = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));
const clone = at("../../zephium-source/frame/src");
const norm = (id: string) => id.replace(/\\/g, "/");
const cloneRoot = norm(at("../../zephium-source"));

const alias = [
  // Generated messages live in the lab, so nothing is ever written into the clone.
  { find: "$shared/i18n", replacement: at("./lab/.i18n") },
  ...["app", "features", "session", "domain", "shared", "styles"].map((layer) => ({
    find: `$${layer}`,
    replacement: path.join(clone, layer),
  })),
  { find: "$zephium", replacement: clone },
  // Agent Execution Lab: SKILL.md files are read as text, from where they live, at build time.
  { find: "$zskills", replacement: at("../../zephium-source/crates/zephium-app/skills") },
  { find: "$aegisskills", replacement: at("../../../core/work/skills") },
  { find: /^@tauri-apps\/api\/.*$/, replacement: at("./lab/src/native.ts") },
  { find: /^elkjs\//, replacement: norm(at("./lab/node_modules/elkjs/")) },
];

/** The clone has no node_modules: its bare imports resolve from the canvas's own. */
const cloneDeps: Plugin = {
  name: "lab-clone-deps",
  enforce: "pre",
  async resolveId(source, importer, options) {
    if (!importer || !norm(importer).startsWith(cloneRoot)) return null;
    if (/^[.$/\0]/.test(source) || /^[a-zA-Z]:[\\/]/.test(source)) return null;
    if (source.startsWith("@tauri-apps/") || source.startsWith("elkjs/")) return null;
    return this.resolve(source, at("./lab/src/main.ts"), { ...options, skipSelf: true });
  },
};

/** Media and page frames are served from local fixtures, never from a native store. */
const media: Plugin = {
  name: "lab-media",
  enforce: "pre",
  transform(code, id) {
    if (!norm(id).endsWith("/domain/resources/media.ts")) return null;
    return (
      code
        .replace("export function mediaUrl(", "function nativeMediaUrl(")
        .replace("export function pageFrameUrl(", "function nativePageFrameUrl(") +
      `\nimport { mediaUrl, pageFrameUrl } from ${JSON.stringify(at("./lab/src/media.ts"))};\nexport { mediaUrl, pageFrameUrl };\n`
    );
  },
};

export default defineConfig({
  root: at("./lab"),
  base: "./",
  resolve: { alias },
  plugins: [
    cloneDeps,
    media,
    paraglideVitePlugin({
      project: at("./lab/project.inlang"),
      outdir: at("./lab/.i18n"),
      emitTsDeclarations: true,
      strategy: ["baseLocale"],
    }),
    svelte(),
    tailwindcss(),
  ],
  publicDir: at("./lab/public"),
  server: { port: 5198, strictPort: true, host: "127.0.0.1", fs: { allow: [at("."), at("../../zephium-source"), at("../../../core/work/skills")] } },
  worker: { format: "es" },
  logLevel: "warn",
  build: {
    target: "es2022",
    outDir: at("./lab/dist"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 4000,
    // Two pages share one build: the Work Layout Lab (index.html) and the Agent Execution Lab (agent.html).
    rollupOptions: { input: { layout: at("./lab/index.html"), agent: at("./lab/agent.html") } },
  },
} as never);
