// Loopback-only static server for the AEGIS labs. No API routes, no backend, no AI.
//   node tests/work-layout-lab-server.cjs
//   →  http://127.0.0.1:5199/dev/work-layout-lab/     (Work Layout Lab)
//   →  http://127.0.0.1:5199/dev/agent-execution-lab/ (Agent Execution Lab)
// Both pages come from one build (work-canvas/lab/dist); only the page differs.
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../work-canvas/lab/dist');
const pages = { '/dev/work-layout-lab': 'index.html', '/dev/agent-execution-lab': 'agent.html' };
const port = Number(process.env.LAB_PORT || 5199);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json', '.map': 'application/json' };
function placeholder(name) {
  let hue = 0; for (const char of name) hue = (hue * 31 + char.charCodeAt(0)) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 50% 66%)"/><stop offset="1" stop-color="hsl(${(hue + 55) % 360} 50% 38%)"/></linearGradient></defs><rect width="1200" height="900" fill="url(#g)"/><circle cx="930" cy="230" r="110" fill="hsl(${(hue + 30) % 360} 80% 82%)" opacity=".5"/><path d="M0 900 L330 470 L560 700 L790 420 L1200 900Z" fill="hsl(${hue} 45% 24%)" opacity=".5"/><text x="1170" y="868" text-anchor="end" font-family="system-ui,sans-serif" font-size="30" fill="#fff" opacity=".85">placeholder picture</text></svg>`;
}
http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); } catch { response.writeHead(400).end(); return; }
  if (pathname === '/') { response.writeHead(302, { Location: '/dev/work-layout-lab/' }).end(); return; }
  // Zephium's object fixtures name QA pictures that are not in its repository; each gets a labelled placeholder.
  if (pathname.startsWith('/node_modules/.work-look/')) { response.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' }).end(placeholder(pathname)); return; }
  const base = Object.keys(pages).find((each) => pathname === each || pathname.startsWith(each + '/'));
  if (!base) { response.writeHead(404).end(); return; }
  if (pathname === base) { response.writeHead(302, { Location: base + '/' }).end(); return; }
  const relative = pathname.slice(base.length + 1) || pages[base];
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  fs.readFile(target, (error, body) => {
    if (error) { response.writeHead(404).end('Not built yet. Run: npm run lab:build (in astra_ai/ui/frontend)'); return; }
    response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
  });
}).listen(port, '127.0.0.1', () => console.log(`AEGIS labs: http://127.0.0.1:${port}/dev/work-layout-lab/ and http://127.0.0.1:${port}/dev/agent-execution-lab/`));
