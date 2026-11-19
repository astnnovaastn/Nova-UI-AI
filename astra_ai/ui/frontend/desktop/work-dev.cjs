/**
 * V33: what AEGIS Work may ask the desktop for beyond showing pages.
 *
 * Developer access. Open Folder / Select Repository / Open File show Windows' own dialog; only what the
 * person picks there is granted, written to the grants file the backend reads
 * (astra_ai/core/work/authorized_folders.py). A grant is read-only unless the person also answers
 * "Allow saving" in a second native question. Nothing here reads or writes project files itself.
 *
 * Browser hand-offs. `media_handoff` pauses what a source window is playing (and says at which second)
 * before the same page opens in a browser tab, so there is never a second player in the background.
 * `tab_page_meta` reads a tab page's own short metadata (description, preview image, canonical address)
 * for Add to Work, in an isolated world, never the page body.
 */
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const MEDIA_SCRIPT = `(() => {
  const media = Array.from(document.querySelectorAll('video, audio'));
  let time = null, playing = false;
  for (const item of media) {
    if (!item.paused) { playing = true; if (time === null) time = item.currentTime; }
    else if (time === null && item.currentTime > 0) time = item.currentTime;
    try { item.pause(); } catch {}
  }
  return { time, playing, count: media.length };
})()`;

const META_SCRIPT = `(() => {
  const pick = (selector, attribute = 'content') => (document.querySelector(selector)?.getAttribute(attribute) || '').trim();
  return {
    description: pick('meta[name="description"]') || pick('meta[property="og:description"]'),
    image: pick('meta[property="og:image"]') || pick('meta[name="twitter:image"]'),
    site: pick('meta[property="og:site_name"]'),
    canonical: pick('link[rel="canonical"]', 'href'),
    kind: pick('meta[property="og:type"]'),
    channel: pick('link[itemprop="name"]', 'content') || pick('span[itemprop="author"] link[itemprop="name"]', 'content'),
  };
})()`;

/** Folders too broad to hand over as a project (mirrors authorized_folders.refused). */
function refused(folder) {
  const resolved = path.resolve(folder);
  if (path.parse(resolved).root === resolved) return "a whole drive";
  const home = path.resolve(os.homedir());
  const inside = (child, parent) => {
    const relative = path.relative(parent, child);
    return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
  };
  if (inside(home, resolved)) return "your whole user folder";
  for (const system of [process.env.WINDIR || "C:\\Windows", process.env.ProgramFiles || "C:\\Program Files", process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)"]) {
    if (inside(resolved, path.resolve(system))) return "a system folder";
  }
  return "";
}

function workDev({ panes, dialog, window, projectRoot, publicPage }) {
  const grantsFile = () => process.env.AEGIS_WORK_AUTHORIZED_FOLDERS_FILE || (projectRoot() ? path.join(projectRoot(), "state", "work", "authorized_folders.json") : "");

  function read() {
    try {
      const data = JSON.parse(fs.readFileSync(grantsFile(), "utf8"));
      return Array.isArray(data.folders) ? data.folders : [];
    } catch {
      return [];
    }
  }
  function write(rows) {
    const file = grantsFile();
    if (!file) throw new Error("AEGIS doesn't know where its project folder is, so it can't remember the folder you chose.");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temp = file + "." + crypto.randomUUID() + ".tmp";
    fs.writeFileSync(temp, JSON.stringify({ version: 1, folders: rows }, null, 1));
    fs.renameSync(temp, file);
  }
  const shown = (row) => ({ id: row.id, title: row.title, path: row.path, write: row.write === true, ...(row.only ? { files: row.only } : {}) });
  function idFor(folder) {
    const slug = path.basename(folder).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 28) || "folder";
    return slug + "-" + crypto.createHash("sha256").update(folder.toLowerCase()).digest("hex").slice(0, 6);
  }

  async function grant(folder, { write: allowWrite = false, only = null } = {}) {
    const real = fs.realpathSync.native(folder);
    if (!fs.statSync(real).isDirectory()) throw new Error("Choose a folder.");
    const broad = refused(real);
    if (broad) throw new Error(`AEGIS won't open ${broad} as a project. Choose the project's own folder.`);
    let canWrite = false;
    if (allowWrite) {
      const answer = await dialog.showMessageBox(window(), {
        type: "question", title: "Saving changes", message: `Allow AEGIS to save changes you approve in “${path.basename(real)}”?`,
        detail: "AEGIS only saves an edit after you review its diff and press Save. You can remove this folder from AEGIS at any time.",
        buttons: ["Read only", "Allow saving"], defaultId: 0, cancelId: 0, noLink: true,
      });
      canWrite = answer.response === 1;
    }
    const rows = read();
    const id = idFor(real);
    const existing = rows.find((row) => row.id === id);
    // A whole-folder grant already covers a single file in it.
    const files = only ? (existing && !existing.only ? null : [...new Set([...(existing?.only || []), ...only])].sort()) : null;
    const row = { id, path: real, title: path.basename(real), write: canWrite || existing?.write === true, ...(files ? { only: files } : {}), granted_at: Date.now() / 1000, via: "desktop_dialog" };
    write([...rows.filter((r) => r.id !== id), row].slice(-24));
    return shown(row);
  }

  const commands = {
    /** Open Folder / Select Repository: Windows' folder dialog; null when the person cancels. */
    async dev_folder_select({ write: allowWrite = false, title = "" } = {}) {
      const picked = await dialog.showOpenDialog(window(), { title: String(title || "Choose a project folder for AEGIS Work").slice(0, 80), properties: ["openDirectory"] });
      if (picked.canceled || !picked.filePaths?.[0]) return null;
      return grant(picked.filePaths[0], { write: Boolean(allowWrite) });
    },
    /** Open File: one file, granted alone (its folder is not opened to AEGIS). */
    async dev_file_select() {
      const picked = await dialog.showOpenDialog(window(), {
        title: "Choose a file for AEGIS Work", properties: ["openFile"],
        filters: [{ name: "Code and text", extensions: ["py", "ts", "tsx", "js", "jsx", "mjs", "cjs", "svelte", "vue", "rs", "go", "java", "c", "h", "cpp", "cs", "css", "scss", "html", "md", "txt", "json", "toml", "yaml", "yml", "sql", "patch", "diff"] }],
      });
      if (picked.canceled || !picked.filePaths?.[0]) return null;
      const file = fs.realpathSync.native(picked.filePaths[0]);
      const folder = path.dirname(file);
      const row = await grant(folder, { only: [path.basename(file)] });
      return { ...row, file: path.basename(file) };
    },
    dev_folders() {
      return read().map(shown);
    },
    dev_folder_revoke({ id } = {}) {
      const rows = read();
      write(rows.filter((row) => row.id !== String(id)));
      return read().map(shown);
    },
    /** Before "Open in browser": pause the source window's player and report where it was. */
    async media_handoff({ id } = {}) {
      const pane = panes.get(Number(id));
      if (!pane || pane.kind !== "source" || !pane.view || pane.view.webContents.isDestroyed()) return { time: null, playing: false, count: 0 };
      try {
        const result = await pane.view.webContents.executeJavaScriptInIsolatedWorld(1002, [{ code: MEDIA_SCRIPT }]);
        return { time: typeof result?.time === "number" && Number.isFinite(result.time) ? result.time : null, playing: Boolean(result?.playing), count: Number(result?.count) || 0 };
      } catch {
        return { time: null, playing: false, count: 0 };
      }
    },
    /** Add to Work from a browser tab: the page's own short metadata, never its text. */
    async tab_page_meta({ id } = {}) {
      const pane = panes.get(Number(id));
      if (!pane || pane.kind !== "tab" || !pane.view || pane.view.webContents.isDestroyed()) return null;
      const contents = pane.view.webContents;
      const base = publicPage(contents.getURL());
      if (!base) return null;
      let found = {};
      try {
        found = (await contents.executeJavaScriptInIsolatedWorld(1003, [{ code: META_SCRIPT }])) || {};
      } catch {
        found = {};
      }
      const absolute = (value) => {
        try {
          const url = new URL(String(value || ""), base.href);
          return url.protocol === "https:" ? url.href : "";
        } catch {
          return "";
        }
      };
      const text = (value, limit) => String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
      return {
        url: base.href, title: text(contents.getTitle(), 300), description: text(found.description, 400), site: text(found.site, 80),
        image: absolute(found.image), canonical: absolute(found.canonical), kind: text(found.kind, 20), channel: text(found.channel, 120),
      };
    },
  };
  return { commands, grantsFile };
}

module.exports = { workDev, refused };
