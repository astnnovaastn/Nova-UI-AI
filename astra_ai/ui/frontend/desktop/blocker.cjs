/**
 * V31: advert and tracker blocking for the person's browser tabs (never source panes or the agent browser).
 *
 * Zephium blocks with Brave's adblock-rust over EasyList, EasyPrivacy and uBlock lists
 * (crates/zephium-*-blocker; frame/src/features/blocker). Nothing compiled can run on this PC (Smart App
 * Control), so AEGIS applies the part of EasyList and EasyPrivacy that a plain host match can apply
 * exactly: `||host^` network rules with no `domain=` option, and `@@||host^` exceptions. A request is
 * cancelled only when it is a sub-resource (never the page itself) for a listed host or its subdomain,
 * and, for `third-party` rules, only when it comes from another site. Cosmetic rules are not applied.
 *
 * Every count is a request Electron actually cancelled. Counts are kept per day and per tab; settings
 * (on/off, sites allowed) are saved in the app's user data.
 */
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const LISTS = ["easylist.txt.gz", "easyprivacy.txt.gz"];
const SUB_RESOURCE = new Set(["script", "image", "stylesheet", "xhr", "subFrame", "media", "font", "ping", "cspReport", "object", "webSocket", "other"]);
const TYPE_OPTION = { script: "script", image: "image", stylesheet: "stylesheet", xmlhttprequest: "xhr", subdocument: "subFrame", media: "media", font: "font", ping: "ping", object: "object", websocket: "webSocket", other: "other" };

function site(host) {
  const parts = String(host || "").toLowerCase().replace(/\.$/, "").split(".");
  if (parts.length >= 3 && parts.at(-1).length === 2 && ["co", "com", "ac", "org", "gov", "net", "edu"].includes(parts.at(-2))) return parts.slice(-3).join(".");
  return parts.slice(-2).join(".");
}

/** Host rules from list text: { block: Map<host, {thirdParty, types|null}>, allow: Set<host> }. */
function parseLists(texts) {
  const block = new Map();
  const allow = new Set();
  for (const text of texts) {
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      const exception = line.startsWith("@@");
      const match = /^(?:@@)?\|\|([a-z0-9.-]+)\^(?:\$(.*))?$/i.exec(line);
      if (!match) continue;
      const host = match[1].toLowerCase();
      const options = (match[2] || "").split(",").filter(Boolean);
      // An exception allows its host everywhere, even one the list scoped to some sites: a page
      // that keeps working matters more than one more blocked request.
      if (exception) {
        allow.add(host);
        continue;
      }
      if (options.some((o) => /^~?domain=|^denyallow=|^redirect|^removeparam|^csp=|^header=|^rewrite|^replace|^badfilter|^important$|^~third-party$|^1p$|^first-party$|^popup$/.test(o))) continue;
      let thirdParty = false;
      const types = [];
      let unknown = false;
      for (const option of options) {
        if (option === "third-party" || option === "3p") thirdParty = true;
        else if (TYPE_OPTION[option]) types.push(TYPE_OPTION[option]);
        else if (/^~/.test(option) || option === "all") continue;
        else unknown = true;
      }
      if (unknown) continue;
      const rule = block.get(host);
      // The broadest rule for a host wins: any rule without third-party or types blocks it everywhere.
      if (!rule) block.set(host, { thirdParty, types: types.length ? new Set(types) : null });
      else {
        rule.thirdParty = rule.thirdParty && thirdParty;
        rule.types = rule.types && types.length ? new Set([...rule.types, ...types]) : null;
      }
    }
  }
  return { block, allow };
}

/** The rule for a host or the nearest listed parent domain, unless an exception covers it. */
function ruleFor(rules, host) {
  const labels = String(host || "").toLowerCase().split(".");
  for (let i = 0; i < labels.length - 1; i++) {
    const candidate = labels.slice(i).join(".");
    if (rules.allow.has(candidate)) return null;
    const rule = rules.block.get(candidate);
    if (rule) return rule;
  }
  return null;
}

/** Whether a request should be cancelled: { block, host } . Pure, for tests. */
function decide(rules, { url, resourceType, initiator, pageHost }, allowedSites = new Set()) {
  if (!SUB_RESOURCE.has(resourceType)) return { block: false };
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return { block: false };
  }
  const from = pageHost || (initiator ? (() => { try { return new URL(initiator).hostname; } catch { return ""; } })() : "");
  if (from && allowedSites.has(site(from))) return { block: false };
  const rule = ruleFor(rules, host);
  if (!rule) return { block: false };
  if (rule.thirdParty && from && site(from) === site(host)) return { block: false };
  if (rule.types && !rule.types.has(resourceType)) return { block: false };
  return { block: true, host };
}

function loadRules(folder = path.join(__dirname, "blocker-lists")) {
  return parseLists(LISTS.map((name) => zlib.gunzipSync(fs.readFileSync(path.join(folder, name))).toString("utf8")));
}

/**
 * Installs blocking on a session. `tabOf(webContentsId)` gives the tab id and its page host, `notify(tab, n)`
 * reports a tab's running count. Settings live in `<userData>/blocker.json`.
 */
function blocker({ store, settingsFile, tabOf, notify, rules = null, today = () => new Date().toISOString().slice(0, 10) }) {
  let loaded = rules;
  const read = () => {
    try {
      const saved = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
      return { enabled: saved.enabled !== false, allowed: Array.isArray(saved.allowed) ? saved.allowed.filter((s) => typeof s === "string").slice(0, 500) : [] };
    } catch {
      return { enabled: true, allowed: [] };
    }
  };
  let settings = read();
  let allowed = new Set(settings.allowed);
  const save = () => {
    fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
    fs.writeFileSync(settingsFile, JSON.stringify({ enabled: settings.enabled, allowed: [...allowed] }, null, 2));
  };
  const counts = { day: today(), today: 0, total: 0, tabs: new Map(), hosts: new Map() };

  store.webRequest.onBeforeRequest((details, callback) => {
    if (!settings.enabled) return callback({});
    const tab = tabOf(details.webContentsId);
    if (!tab) return callback({});
    if (!loaded) loaded = loadRules();
    const verdict = decide(loaded, { url: details.url, resourceType: details.resourceType, initiator: details.referrer, pageHost: tab.host }, allowed);
    if (!verdict.block) return callback({});
    if (counts.day !== today()) Object.assign(counts, { day: today(), today: 0 });
    counts.today += 1;
    counts.total += 1;
    const perTab = (counts.tabs.get(tab.id) || 0) + 1;
    counts.tabs.set(tab.id, perTab);
    counts.hosts.set(verdict.host, (counts.hosts.get(verdict.host) || 0) + 1);
    notify(tab.id, perTab);
    callback({ cancel: true });
  });

  return {
    status: (tabId) => ({
      enabled: settings.enabled,
      today: counts.day === today() ? counts.today : 0,
      sinceStart: counts.total,
      tab: tabId == null ? 0 : counts.tabs.get(Number(tabId)) || 0,
      allowed: [...allowed],
      topHosts: [...counts.hosts].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([host, count]) => ({ host, count })),
      rules: loaded ? loaded.block.size : null,
    }),
    setEnabled(on) {
      settings.enabled = Boolean(on);
      save();
    },
    allow(host, on) {
      const name = site(String(host || ""));
      if (!name || !name.includes(".")) throw new Error("Bad site.");
      if (on) allowed.add(name);
      else allowed.delete(name);
      save();
    },
    resetTab(tabId) {
      counts.tabs.delete(Number(tabId));
    },
  };
}

module.exports = { blocker, parseLists, decide, loadRules, site };
