/** Address rules shared by the main process: what the workspace may be, and what a pane may open. */
const net = require("node:net");

function isLoopback(host) {
  const name = host.replace(/^\[|\]$/g, "").toLowerCase();
  return name === "localhost" || name === "::1" || /^127\.\d+\.\d+\.\d+$/.test(name);
}

/** The workspace address: https anywhere, plain http only on this computer. Throws with the reason. */
function workspaceUrl(input) {
  let url;
  try {
    url = new URL(String(input).trim());
  } catch {
    throw new Error("That is not a web address.");
  }
  if (url.username || url.password) throw new Error("The address must not contain a user name or password.");
  if (url.protocol === "https:") return url;
  if (url.protocol === "http:" && isLoopback(url.hostname)) return url;
  if (url.protocol === "http:") throw new Error("A workspace on another computer must use https.");
  throw new Error("The address must start with https:// (or http:// on this computer).");
}

/** Hosts a source page must never be sent to: this computer and private networks. */
function privateHost(hostname) {
  const host = hostname.replace(/\.$/, "").replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return true;
  const family = net.isIP(host);
  if (family === 4) {
    const [a, b] = host.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  if (family === 6) return host === "::1" || host === "::" || /^f[cd]/.test(host) || /^fe[89ab]/.test(host) || host.startsWith("::ffff:");
  return !host.includes(".");
}

/** A public http(s) page as a URL, or null. */
function publicPage(input) {
  let url;
  try {
    url = new URL(String(input));
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password || !url.hostname || privateHost(url.hostname)) return null;
  return url;
}

module.exports = { isLoopback, workspaceUrl, privateHost, publicPage };
