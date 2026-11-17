/**
 * Local stand-ins for Zephium's privileged media routes.
 *
 * Zephium serves admitted pictures and captured page frames from a native store
 * (`zephium-media://`). The lab has none, so each address becomes a small generated SVG:
 * deterministic, offline, and visibly a placeholder. Nothing here is a real capture.
 */
const svg = (body: string, width: number, height: number) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`,
  )}`;

/** Zephium's own fixtures encode a hue in the digest's first three hex digits. */
const hueOf = (digest: string) => parseInt(digest.slice(0, 3), 16) % 360;

/** Frames the lab's own scenes registered, by `attempt/step`. */
const frames = new Map<string, { title: string; host: string; hue: number }>();
export function registerFrame(attempt: string, step: string, frame: { title: string; host: string; hue: number }) {
  frames.set(`${attempt}/${step}`, frame);
}

const escape = (text: string) =>
  text.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]!);

export function pageFrameUrl(attempt: string, step: string, generation: number): string | null {
  if (!Number.isInteger(generation)) return null;
  const known = frames.get(`${attempt}/${step}`);
  let seed = 0;
  for (const char of step) seed = (seed * 31 + char.charCodeAt(0)) % 360;
  const hue = known?.hue ?? seed;
  const title = escape(known?.title ?? "Simulated page");
  const host = escape(known?.host ?? "local fixture");
  return svg(
    `<rect width="1280" height="800" fill="hsl(${hue} 18% 96%)"/>
     <rect width="1280" height="64" fill="hsl(${hue} 30% 22%)"/>
     <circle cx="44" cy="32" r="14" fill="hsl(${hue} 70% 62%)"/>
     <text x="72" y="40" font-family="Inter,system-ui,sans-serif" font-size="22" font-weight="600" fill="#fff">${host}</text>
     <rect x="980" y="18" width="110" height="28" rx="14" fill="hsl(${hue} 40% 34%)"/>
     <rect x="1110" y="18" width="130" height="28" rx="14" fill="hsl(${hue} 70% 62%)"/>
     <text x="80" y="170" font-family="Inter,system-ui,sans-serif" font-size="46" font-weight="700" fill="hsl(${hue} 30% 16%)">${title.slice(0, 44)}</text>
     <rect x="80" y="206" width="720" height="16" rx="8" fill="hsl(${hue} 14% 78%)"/>
     <rect x="80" y="236" width="560" height="16" rx="8" fill="hsl(${hue} 14% 84%)"/>
     <rect x="80" y="296" width="170" height="48" rx="24" fill="hsl(${hue} 60% 46%)"/>
     <rect x="80" y="400" width="350" height="250" rx="16" fill="hsl(${hue} 30% 88%)"/>
     <rect x="465" y="400" width="350" height="250" rx="16" fill="hsl(${(hue + 40) % 360} 30% 88%)"/>
     <rect x="850" y="400" width="350" height="250" rx="16" fill="hsl(${(hue + 80) % 360} 30% 88%)"/>
     <text x="1200" y="770" text-anchor="end" font-family="Inter,system-ui,sans-serif" font-size="18" fill="hsl(${hue} 10% 50%)">simulated frame · Work Layout Lab</text>`,
    1280,
    800,
  );
}

export function mediaUrl(_profile: string, digest: string, _width = 720): string | null {
  if (!/^[0-9a-f]{64}$/.test(digest)) return null;
  const hue = hueOf(digest);
  return svg(
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
       <stop offset="0" stop-color="hsl(${hue} 55% 62%)"/><stop offset="1" stop-color="hsl(${(hue + 50) % 360} 55% 38%)"/>
     </linearGradient></defs>
     <rect width="720" height="480" fill="url(#g)"/>
     <circle cx="560" cy="130" r="64" fill="hsl(${(hue + 30) % 360} 80% 80%)" opacity=".55"/>
     <path d="M0 480 L200 250 L340 380 L470 220 L720 480Z" fill="hsl(${hue} 45% 26%)" opacity=".55"/>
     <text x="704" y="464" text-anchor="end" font-family="Inter,system-ui,sans-serif" font-size="15" fill="#fff" opacity=".8">placeholder picture</text>`,
    720,
    480,
  );
}
