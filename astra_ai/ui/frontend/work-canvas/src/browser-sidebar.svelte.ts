const KEY = "aegis-browse-sidebar-v1";
function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && Number.isFinite(saved.width)) return { width: Math.min(420, Math.max(200, saved.width)), collapsed: Boolean(saved.collapsed) };
  } catch { /* use the default */ }
  return { width: 248, collapsed: false };
}
export const sidebar = $state(read());
export function saveSidebar() {
  try { localStorage.setItem(KEY, JSON.stringify(sidebar)); } catch { /* storage unavailable */ }
}
