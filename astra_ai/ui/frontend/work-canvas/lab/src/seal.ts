/**
 * Shared by both labs: local only, and sealed. No API client, no backend, no AI provider.
 * Every request that is not to this page's own origin is refused here, and again by the
 * page's Content-Security-Policy.
 */
export function seal(name: string) {
  if (!["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)) throw new Error(`The ${name} runs on this machine only.`);
  const allowed = (url: string) => {
    if (/^(data|blob):/u.test(url)) return true;
    const target = new URL(url, location.href);
    return target.origin === location.origin && !target.pathname.startsWith("/api/") && !target.pathname.startsWith("/ws");
  };
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    return allowed(url) ? nativeFetch(input, init) : Promise.reject(new Error(`${name}: network is blocked`));
  };
  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, method: string, url: string | URL, ...rest: unknown[]) {
    if (!allowed(String(url))) throw new Error(`${name}: network is blocked`);
    return (open as (...args: unknown[]) => void).call(this, method, url, ...rest);
  } as typeof open;
  window.WebSocket = class {
    constructor() {
      throw new Error(`${name}: network is blocked`);
    }
  } as unknown as typeof WebSocket;
  navigator.sendBeacon = () => false;
}
