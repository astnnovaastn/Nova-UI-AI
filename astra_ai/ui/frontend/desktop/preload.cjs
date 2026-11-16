/**
 * The only bridge between the AEGIS window and the desktop process: one `invoke` function.
 * It is loaded into the main window alone. Browser panes get no preload, so a website has no
 * bridge at all, and the main process checks who is calling before it does anything.
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("aegisDesktop", {
  invoke: (command, args) => ipcRenderer.invoke("aegis", String(command), args ?? {}),
});
