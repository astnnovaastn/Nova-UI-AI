import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

export default defineConfig({
  plugins: [react(), {
    name: "local-speech-runtime",
    configureServer(server) {
      // ONNX dynamically imports its runtime. Serve the vendored module as-is,
      // including Vite's ?import query, rather than transforming public files.
      server.middlewares.use((req, res, next) => {
        const path=(req.url||"").split("?")[0];
        if (!/^\/speech\/ort\/ort-wasm-simd-threaded(?:\.asyncify|\.jsep)?\.mjs$/.test(path)) return next();
        try {res.setHeader("Content-Type","application/javascript");res.end(readFileSync(fileURLToPath(new URL("./public"+path,import.meta.url))));}
        catch {next();}
      });
    }
  }],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/ws": {
        target: "ws://127.0.0.1:8340",
        ws: true,
      },
      "/api/runtime": { target: "http://127.0.0.1:8341", changeOrigin: true },
      "/api": {
        target: "http://127.0.0.1:8340",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
