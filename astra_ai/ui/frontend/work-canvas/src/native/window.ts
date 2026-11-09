/** Stands in for Tauri's window API: AEGIS runs in an ordinary browser tab. */
export class Window {}
export class Webview {}
export const getCurrentWindow = () => ({
  label: "main",
  isFullscreen: async () => false,
  onResized: async () => () => {},
});
export const getCurrentWebview = () => ({ label: "main" });
