const { randomUUID } = require("node:crypto");

const STYLES = Object.freeze({
  readable: "main, article { line-height: 1.7 !important; } p, li { line-height: 1.7 !important; }",
  contrast: "html, body, main, article { background-color: #fff !important; color: #111 !important; } a { color: #153c82 !important; text-decoration: underline !important; }",
});

const READ_SCRIPT = `(() => {
  if (document.querySelector('input[type=password]')) return null;
  const root = document.querySelector('main, article, [role=main]') || document.body;
  if (!root) return null;
  const clean = root.cloneNode(true);
  clean.querySelectorAll('form, input, textarea, select, [contenteditable], [hidden], [aria-hidden=true], script, style, nav, iframe, aside, footer, header, template').forEach(node => node.remove());
  const links = Array.from(clean.querySelectorAll('a[href]')).slice(0, 50).map(link => ({
    label: (link.textContent || '').trim().slice(0, 120),
    url: link.href,
  }));
  return { text: (clean.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 10000), links };
})()`;

function browserAssist({ panes, publicPage, dialog, window, live }) {
  const snapshots = new Map();
  function invalidate(id) { snapshots.delete(id); }
  function eligible(contents) {
    const address = publicPage(contents.getURL());
    if (!address || contents.isLoading() || /(^|[.-])(bank|payments?|health|gov)([.-]|$)/i.test(address.hostname)) {
      throw new Error("This tab is unavailable for Ask Aegis.");
    }
    return address;
  }
  function pane(id) {
    const found = panes.get(Number(id));
    if (!found || !found.view || !found.visible || found.frozen) throw new Error("Bring the source tab into view and try again.");
    return found;
  }
  async function confirm(title, detail) {
    const result = await dialog.showMessageBox(window(), {
      type: "question", title, message: title, detail,
      buttons: ["Cancel", "Allow"], defaultId: 0, cancelId: 0, noLink: true,
    });
    return result.response === 1;
  }
  const commands = {
    browser_assist_list() {
      return [...panes.values()].filter(p => p.visible && p.view && !p.frozen).flatMap(p => {
        try {
          const address = eligible(p.view.webContents);
          return [{ id: p.id, title: p.title.slice(0, 180) || address.hostname, host: address.hostname }];
        } catch { return []; }
      });
    },
    async browser_assist_read({ id }) {
      const selected = pane(id);
      const contents = selected.view.webContents;
      const address = eligible(contents);
      if (!await confirm("Attach live tab text?", `Aegis will store a text excerpt from ${address.hostname} in this workspace. Sending the attachment shares the excerpt with the configured AI provider.`)) return null;
      if (pane(id).view.webContents !== contents || eligible(contents).href !== address.href) throw new Error("The tab changed. Read it again.");
      const result = await contents.executeJavaScriptInIsolatedWorld(1001, [{ code: READ_SCRIPT }]);
      if (pane(id).view.webContents !== contents || eligible(contents).href !== address.href) throw new Error("The tab changed. Read it again.");
      if (typeof result?.text !== "string" || !result.text.trim()) throw new Error("No readable page text is available.");
      const links = (Array.isArray(result.links) ? result.links : []).flatMap(link => {
        const url = publicPage(link?.url);
        return url && typeof link.label === "string" && link.label ? [{ label: link.label.slice(0, 120), url: url.href }] : [];
      }).slice(0, 20);
      const token = randomUUID();
      snapshots.set(selected.id, { token, contents, url: address.href, links });
      return { id: selected.id, token, host: address.hostname, title: contents.getTitle().slice(0, 180), text: result.text.slice(0, 10000), links: links.map(link => link.label) };
    },
    async browser_assist_action({ id, token, action, link }) {
      const selected = pane(id);
      const snapshot = snapshots.get(selected.id);
      const contents = selected.view.webContents;
      if (!snapshot || snapshot.token !== token || snapshot.contents !== contents || eligible(contents).href !== snapshot.url) {
        throw new Error("Read the current tab again before applying an action.");
      }
      const target = Number.isInteger(link) ? snapshot.links[link - 1] : null;
      const detail = action === "open_link" && target ? `Open ${target.label} (\n${target.url}) in this source tab.`
        : action === "scroll_down" ? "Scroll down one screen in this source tab."
        : action === "scroll_up" ? "Scroll up one screen in this source tab."
        : action === "reload" ? "Reload this source tab." : "";
      if (!detail) throw new Error("This browser action is unavailable.");
      if (!await confirm("Apply browser action?", detail)) return false;
      if (pane(id).view.webContents !== contents || snapshots.get(selected.id) !== snapshot || eligible(contents).href !== snapshot.url) {
        throw new Error("The tab changed while approval was open.");
      }
      if (action === "open_link") await contents.loadURL(target.url);
      else if (action === "reload") contents.reload();
      else await contents.executeJavaScriptInIsolatedWorld(1001, [{ code: action === "scroll_up" ? "window.scrollBy(0,-innerHeight)" : "window.scrollBy(0,innerHeight)" }]);
      return true;
    },
    async browser_assist_takeover({ id }) {
      const selected = pane(id);
      invalidate(selected.id);
      (await live(selected)).focus();
      return true;
    },
    async browser_assist_style({ id, style }) {
      const selected = pane(id);
      const contents = selected.view.webContents;
      const address = eligible(contents);
      if (style !== "reset" && !Object.hasOwn(STYLES, style)) throw new Error("Unknown site style.");
      const old = selected.assistStyle;
      if (old?.contents === contents) await contents.removeInsertedCSS(old.key).catch(() => {});
      selected.assistStyle = null;
      if (style === "reset") return true;
      const key = await contents.insertCSS(STYLES[style], { cssOrigin: "user" });
      if (pane(id).view.webContents !== contents || contents.getURL() !== address.href) {
        await contents.removeInsertedCSS(key).catch(() => {});
        throw new Error("The page changed while applying the style.");
      }
      selected.assistStyle = { contents, key };
      return true;
    },
  };
  return { commands, invalidate };
}

module.exports = { browserAssist };
