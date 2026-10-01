const CANVAS_ID = 'astra-theme-pattern-canvas';
let cleanupCurrent = null;

const hexRgb = (hex) => {
  const match = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!match) return [156, 222, 242];
  return match[1].match(/../g).map((value) => parseInt(value, 16));
};

export function stopPatternEngine() {
  cleanupCurrent?.();
  cleanupCurrent = null;
  document.getElementById(CANVAS_ID)?.remove();
}

export function startPatternEngine(pattern, tokens) {
  stopPatternEngine();
  if (pattern === 'none' || pattern === 'dots') return;
  const canvas = document.createElement('canvas');
  canvas.id = CANVAS_ID;
  canvas.dataset.pattern = pattern;
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '0' });
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let width = 0, height = 0, frame = 0, raf = 0, stopped = false;
  const color = tokens.patternColor || tokens.fg;
  const [r, g, b] = hexRgb(color);
  const intensity = Math.max(0, Math.min(1, Number(tokens.patternIntensity ?? 1)));
  const size = Math.max(.2, Math.min(3, Number(tokens.patternSize ?? 1)));
  const reduced = tokens.motion === 'reduced' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frozen = tokens.motion === 'none';
  const count = Math.max(8, Math.round((pattern === 'rain' ? 130 : pattern === 'perlin-flow' ? 180 : 48) * intensity * (reduced ? .5 : 1)));
  const items = Array.from({ length: count }, (_, index) => ({
    x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * .0015, vy: .001 + Math.random() * .0025,
    phase: Math.random() * Math.PI * 2, radius: (1 + Math.random() * 4) * size, life: Math.random(), index,
  }));
  const resize = () => { width = innerWidth; height = innerHeight; canvas.width = width * dpr; canvas.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  resize(); window.addEventListener('resize', resize);

  const rgba = (alpha) => `rgba(${r},${g},${b},${alpha * intensity})`;
  const star = (x, y, radius, alpha) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = rgba(alpha); ctx.beginPath(); ctx.moveTo(0, -radius); ctx.quadraticCurveTo(radius * .15, -radius * .15, radius, 0); ctx.quadraticCurveTo(radius * .15, radius * .15, 0, radius); ctx.quadraticCurveTo(-radius * .15, radius * .15, -radius, 0); ctx.quadraticCurveTo(-radius * .15, -radius * .15, 0, -radius); ctx.fill(); ctx.restore(); };
  const draw = () => {
    if (stopped) return;
    frame += reduced ? .35 : 1;
    ctx.clearRect(0, 0, width, height);
    if (pattern === 'synapse') {
      const grid = 24 * size; ctx.strokeStyle = rgba(.08); ctx.lineWidth = 1;
      for (let x = 0; x < width; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
      for (let y = 0; y < height; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
      items.forEach((item) => { const horizontal = item.index % 2; const progress = (item.life + frame * .003 * (1 + item.index % 5)) % 1; const x = horizontal ? progress * width : Math.round(item.x * width / grid) * grid; const y = horizontal ? Math.round(item.y * height / grid) * grid : progress * height; ctx.fillStyle = rgba(.65); ctx.beginPath(); ctx.arc(x, y, 1.4 * size, 0, Math.PI * 2); ctx.fill(); });
    } else if (pattern === 'rain') {
      ctx.lineWidth = Math.max(1, size); items.forEach((item) => { if (!frozen) item.y = (item.y + item.vy * (reduced ? .4 : 1)) % 1; const x = item.x * width, y = item.y * height, len = item.radius * 10; const gradient = ctx.createLinearGradient(x, y - len, x, y); gradient.addColorStop(0, 'transparent'); gradient.addColorStop(1, rgba(.55)); ctx.strokeStyle = gradient; ctx.beginPath(); ctx.moveTo(x, y - len); ctx.lineTo(x, y); ctx.stroke(); });
    } else if (pattern === 'constellations') {
      items.forEach((item) => { if (!frozen) { item.x = (item.x + item.vx + 1) % 1; item.y = (item.y + item.vx + 1) % 1; } });
      ctx.strokeStyle = rgba(.16); items.forEach((a, i) => items.slice(i + 1).forEach((bItem) => { const dx = (a.x - bItem.x) * width, dy = (a.y - bItem.y) * height, distance = Math.hypot(dx, dy); if (distance < 120 * size) { ctx.globalAlpha = 1 - distance / (120 * size); ctx.beginPath(); ctx.moveTo(a.x * width, a.y * height); ctx.lineTo(bItem.x * width, bItem.y * height); ctx.stroke(); } })); ctx.globalAlpha = 1;
      items.forEach((item) => { ctx.fillStyle = rgba(.25 + Math.sin(frame * .02 + item.phase) * .12); ctx.beginPath(); ctx.arc(item.x * width, item.y * height, Math.max(1, item.radius * .3), 0, Math.PI * 2); ctx.fill(); });
    } else if (pattern === 'perlin-flow') {
      items.forEach((item) => { const angle = Math.sin(item.x * 17 + item.y * 11 + frame * .004) * Math.PI * 2; if (!frozen) { item.x = (item.x + Math.cos(angle) * .0015 + 1) % 1; item.y = (item.y + Math.sin(angle) * .0015 + 1) % 1; } ctx.fillStyle = rgba(.18 * item.life); ctx.beginPath(); ctx.arc(item.x * width, item.y * height, Math.max(.8, size), 0, Math.PI * 2); ctx.fill(); });
    } else if (pattern === 'petals') {
      items.forEach((item) => { if (!frozen) { item.y = (item.y + item.vy * .4) % 1; item.x = (item.x + Math.sin(frame * .01 + item.phase) * .0005 + 1) % 1; } ctx.save(); ctx.translate(item.x * width, item.y * height); ctx.rotate(item.phase + frame * .005); ctx.fillStyle = rgba(.22); ctx.beginPath(); ctx.ellipse(0, 0, item.radius, item.radius * .42, .3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
    } else if (pattern === 'sparkles') {
      items.forEach((item) => { const twinkle = Math.max(0, Math.sin(frame * .025 + item.phase)); star(item.x * width, item.y * height, item.radius * twinkle, .32 * twinkle); });
    } else if (pattern === 'embers') {
      ctx.globalCompositeOperation = 'lighter'; items.forEach((item) => { if (!frozen) { item.y -= item.vy * .35; if (item.y < 0) item.y = 1; item.x = (item.x + Math.sin(frame * .02 + item.phase) * .0007 + 1) % 1; } const x = item.x * width, y = item.y * height, gradient = ctx.createRadialGradient(x, y, 0, x, y, item.radius * 3); gradient.addColorStop(0, rgba(.65)); gradient.addColorStop(1, 'transparent'); ctx.fillStyle = gradient; ctx.fillRect(x - item.radius * 3, y - item.radius * 3, item.radius * 6, item.radius * 6); }); ctx.globalCompositeOperation = 'source-over';
    }
    if (!frozen) raf = requestAnimationFrame(draw);
  };
  draw();
  cleanupCurrent = () => { stopped = true; cancelAnimationFrame(raf); window.removeEventListener('resize', resize); canvas.remove(); };
}
