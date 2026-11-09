/**
 * Which addresses the workspace browser may open. A framed page is untrusted, so this stops it
 * ever being the app itself, its backend or anything on the local network, and allows only web
 * addresses. The backend repeats the private-address check using the real DNS answer.
 */
const PRIVATE_HOST =
  /^(localhost|.*\.localhost|.*\.local|.*\.internal|127\.\d+\.\d+\.\d+|0\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|\[.*\])$/i;

export function normalizeAddress(input: string, ownHost = ""): string | null {
  let value = input.trim();
  if (!value || /\s/.test(value)) return null;
  // A bare name such as example.com, but not another scheme such as javascript: or file:.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value) || /^[^/:]+\.[a-z]{2,}:\d+/i.test(value)) value = `https://${value}`;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  if (parsed.username || parsed.password) return null;
  if (!parsed.hostname.includes(".") || PRIVATE_HOST.test(parsed.hostname)) return null;
  if (ownHost && (parsed.host === ownHost || parsed.hostname === ownHost.split(":")[0])) return null;
  return parsed.href;
}

/** Why a page is not shown, in plain words. */
export function blockedWords(reason: string): string {
  switch (reason) {
    case "x_frame_options":
    case "frame_ancestors":
      return "This site doesn't allow being shown inside other apps.";
    case "invalid_address":
    case "non_public_address":
    case "address":
      return "This address can't be opened here. The workspace browser only opens public websites.";
    default:
      return "This page couldn't be opened here.";
  }
}
