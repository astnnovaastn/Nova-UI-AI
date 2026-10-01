import { startPatternEngine } from './patternEngine.js';
import { orbThemes } from '../../orb-themes';

export const THEME_SCHEMA_VERSION = 2;
export const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:8340').replace(/\/$/, '');
export const THEME_CACHE_KEY = 'astra-theme-studio-cache-v2';
export const ACTIVE_THEME_KEY = 'astra-active-theme-v2';
export const LEGACY_KEYS = ['odysseus-theme', 'odysseus-custom-themes', 'odysseus-ui-scale'];

const BASE = {
  font: 'mono', density: 'comfortable', uiScale: 100, spacing: 1, radius: 12,
  borderWidth: 1, borderStyle: 'solid', panelOpacity: 0.94, blur: 18,
  shadow: 0.45, glow: 0.35, motion: 'full', pattern: 'none',
  patternColor: '', patternIntensity: 0.4, patternSize: 1, frosted: true,
};

export const PATTERN_OPTIONS = ['none', 'dots', 'synapse', 'rain', 'constellations', 'perlin-flow', 'petals', 'sparkles', 'embers'];
const BUILTIN_PATTERN_DEFAULTS = {
  dark: ['none', '', .4, 1, false], light: ['dots', '', .4, 1, false], midnight: ['rain', '#ffffff', .5, 1, false],
  paper: ['dots', '', .4, 1, false], cyberpunk: ['synapse', '', .4, 1, false], retrowave: ['embers', '', .4, 1, false],
  forest: ['petals', '', .4, 1, false], ocean: ['constellations', '', .4, 1, false], terminal: ['perlin-flow', '', .8, 1, false],
  organs: ['rain', '#451616', .65, 1, false], ume: ['petals', '#f5a0c0', .4, 1, false], cute: ['sparkles', '#ff8cb8', .4, 1, false],
  copper: ['none', '', .4, 1, false], lavender: ['none', '', .4, 1, true], gpt: ['none', '', .4, 1, false], claude: ['none', '', .4, 1, false],
};

const palettes = {
  dark: ['#282c34', '#9cdef2', '#111111', '#355a66', '#e06c75'], light: ['#f0ebe3', '#5a5248', '#faf6f0', '#d4cdc2', '#c47d5a'],
  midnight: ['#0d1117', '#c9d1d9', '#161b22', '#30363d', '#f85149'], paper: ['#faf8f5', '#3b3836', '#ffffff', '#d5d0c8', '#c5ac4a'],
  cyberpunk: ['#0a0a0f', '#0ff0fc', '#12101a', '#9b30ff', '#e040fb'], retrowave: ['#1a1a2e', '#e94560', '#16213e', '#533483', '#e94560'],
  forest: ['#1b2a1b', '#a8d5a2', '#142414', '#3d6b3d', '#7cb871'], ocean: ['#0b1a2c', '#64d2ff', '#091422', '#1e5074', '#4facfe'],
  ume: ['#2b1b2e', '#f5c2e7', '#1e1420', '#6c4675', '#f5a0c0'], copper: ['#1c1410', '#e8c39e', '#140f0a', '#7a5533', '#d4764e'],
  terminal: ['#000000', '#00ff41', '#0a0a0a', '#003b00', '#00ff41'], organs: ['#0a0406', '#efe1c8', '#15080a', '#3a1519', '#c83240'],
  lavender: ['#f3eef8', '#3d3551', '#faf7ff', '#cec3de', '#9b6dcc'], gpt: ['#212121', '#ececec', '#171717', '#424242', '#949494'],
  claude: ['#262624', '#f5f4f0', '#30302e', '#4a4a47', '#c6613f'], cute: ['#fff0f5', '#d4608a', '#fff8fa', '#f0c0d0', '#ff6b9d'],
};

export const BUILTIN_THEMES = Object.fromEntries(Object.entries(palettes).map(([id, values]) => { const effect = BUILTIN_PATTERN_DEFAULTS[id] || BUILTIN_PATTERN_DEFAULTS.dark; return [id, {
  schemaVersion: THEME_SCHEMA_VERSION, id, name: id[0].toUpperCase() + id.slice(1), builtin: true, baseThemeId: id,
  tokens: { ...BASE, bg: values[0], fg: values[1], panel: values[2], border: values[3], accent: values[4], pattern: effect[0], patternColor: effect[1], patternIntensity: effect[2], patternSize: effect[3], frosted: effect[4] },
  orb: { mode: 'sync', preset: 'default', color: values[4] }, widgetOverrides: {},
}]; }));

export const DEFAULT_THEME_ID = 'dark';
export const FONT_OPTIONS = { mono: "'Fira Code', monospace", sans: "system-ui, -apple-system, 'Segoe UI', sans-serif", serif: "Georgia, serif", opendyslexic: "'OpenDyslexic', sans-serif" };
export const TOKEN_RANGES = {
  uiScale: [80, 140, 5], spacing: [0.75, 1.5, 0.05], radius: [0, 32, 1], borderWidth: [0, 4, 0.5],
  panelOpacity: [0.5, 1, 0.01], blur: [0, 40, 1], shadow: [0, 1, 0.05], glow: [0, 1, 0.05], patternIntensity: [0, 1, 0.05], patternSize: [.2, 3, .1],
};

export function normalizeTheme(theme) {
  const source = theme || BUILTIN_THEMES.dark;
  const legacy = source.colors || source.tokens || source;
  const pattern = legacy.pattern || legacy.bgPattern || BASE.pattern;
  return {
    schemaVersion: THEME_SCHEMA_VERSION, id: source.id || source.name || crypto.randomUUID().replaceAll('-', ''),
    name: source.name || 'Custom Theme', builtin: Boolean(source.builtin), baseThemeId: source.baseThemeId || (source.builtin ? source.id : DEFAULT_THEME_ID),
    tokens: { ...BASE, ...legacy, pattern: pattern === 'flow' ? 'perlin-flow' : pattern, patternColor: legacy.patternColor ?? legacy.bgEffectColor ?? BASE.patternColor, patternIntensity: Number(legacy.patternIntensity ?? legacy.bgEffectIntensity ?? BASE.patternIntensity), patternSize: Number(legacy.patternSize ?? legacy.bgEffectSize ?? BASE.patternSize), accent: legacy.accent || legacy.red || '#e06c75', uiScale: Number(legacy.uiScale || source.uiScale || 100) },
    orb: { mode: 'sync', preset: 'default', color: legacy.accent || legacy.red || '#e06c75', ...(source.orb || {}) },
    widgetOverrides: source.widgetOverrides || {},
  };
}

export function applyTheme(raw) {
  const theme = normalizeTheme(raw);
  const t = theme.tokens;
  const root = document.documentElement;
  const vars = {
    '--bg': t.bg, '--fg': t.fg, '--panel': t.panel, '--border': t.border, '--red': t.accent,
    '--theme-spacing': String(t.spacing), '--theme-radius': `${t.radius}px`, '--theme-border-width': `${t.borderWidth}px`,
    '--theme-border-style': t.borderStyle, '--theme-panel-opacity': String(t.panelOpacity), '--theme-blur': `${t.blur}px`,
    '--theme-shadow-strength': String(t.shadow), '--theme-glow-strength': String(t.glow), '--bg-effect-intensity': String(t.patternIntensity), '--bg-effect-size': String(t.patternSize), '--bg-effect-color': t.patternColor || t.fg,
    '--font-family': FONT_OPTIONS[t.font] || `"${String(t.font).replace(/["\\]/g, '')}"`, '--theme-motion-duration': t.motion === 'none' ? '0ms' : t.motion === 'reduced' ? '80ms' : '220ms',
  };
  Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));
  root.style.fontSize = `${t.uiScale}%`;
  root.dataset.themeId = theme.id;
  root.dataset.motion = t.motion;
  root.dataset.density = t.density;
  document.body.classList.toggle('theme-frosted', Boolean(t.frosted));
  [...document.body.classList].filter((name) => name.startsWith('bg-pattern-')).forEach((name) => document.body.classList.remove(name));
  if (t.pattern !== 'none') document.body.classList.add(`bg-pattern-${t.pattern}`);
  startPatternEngine(t.pattern, t);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.bg);
  const widgetSelectors = { search: '.search-widget', news: '.news-widget', weather: '.weather-display', task: '.task-widget', notes: '.notepad-widget', image: '.image-widget', calculator: '.calculator-widget', tictactoe: '.tictactoe-widget', chat: '.chat-widget' };
  Object.entries(widgetSelectors).forEach(([id, selector]) => document.querySelectorAll(selector).forEach((element) => { if (!element.dataset.widgetId) element.dataset.widgetId = id; }));
  const applyWidgetOverrides = () => document.querySelectorAll('[data-widget-id]').forEach((element) => {
    const override = theme.widgetOverrides[element.dataset.widgetId];
    ['accent', 'surface', 'border', 'text'].forEach((key) => element.style.removeProperty(`--widget-${key}`));
    if (override) Object.entries(override).forEach(([key, value]) => element.style.setProperty(`--widget-${key}`, value));
  });
  applyWidgetOverrides();
  window.__astraWidgetThemeObserver?.disconnect();
  window.__astraWidgetThemeObserver = new MutationObserver(() => { Object.entries(widgetSelectors).forEach(([id, selector]) => document.querySelectorAll(selector).forEach((element) => { element.dataset.widgetId ||= id; })); applyWidgetOverrides(); });
  window.__astraWidgetThemeObserver.observe(document.getElementById('widget-overlay') || document.body, { childList: true, subtree: true });
  localStorage.setItem(ACTIVE_THEME_KEY, JSON.stringify(theme));
  const preset = orbThemes.find((item) => item.name === theme.orb.preset);
  const orbColor = theme.orb.mode === 'custom' ? theme.orb.color : theme.orb.preset !== 'default' && preset?.orbColor ? preset.orbColor : t.accent;
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme, orbColor, orbPreset: theme.orb.preset } }));
  return theme;
}

function parseCached() {
  try { return JSON.parse(localStorage.getItem(THEME_CACHE_KEY) || 'null'); } catch { return null; }
}

export function applyCachedTheme() {
  const cache = parseCached();
  const active = (() => { try { return JSON.parse(localStorage.getItem(ACTIVE_THEME_KEY) || 'null'); } catch { return null; } })();
  const defaultTheme = cache && [...(cache.builtins || []), ...(cache.custom || [])].find((item) => item.id === cache.defaultThemeId);
  return applyTheme(defaultTheme || active || BUILTIN_THEMES.dark);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new Error(payload.error || payload.detail?.error || payload.detail || `Request failed (${response.status})`);
  return payload.data;
}

export const themeApi = {
  list: async () => { const data = await request('/api/themes'); localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(data)); return data; },
  create: (body) => request('/api/themes', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/api/themes/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  duplicate: (id, name) => request(`/api/themes/${encodeURIComponent(id)}/duplicate`, { method: 'POST', body: JSON.stringify(name ? { name } : {}) }),
  remove: (id, replacement) => request(`/api/themes/${encodeURIComponent(id)}${replacement ? `?replacement=${encodeURIComponent(replacement)}` : ''}`, { method: 'DELETE' }),
  setDefault: (themeId) => request('/api/themes/default', { method: 'PUT', body: JSON.stringify({ themeId }) }),
  import: (body) => request('/api/themes/import', { method: 'POST', body: JSON.stringify(body) }),
  export: (id) => request(id ? `/api/themes/${encodeURIComponent(id)}/export` : '/api/themes/export'),
  fonts: () => request('/api/fonts/custom'),
};

export async function installCustomFonts(fonts) {
  if (!('FontFace' in window)) return;
  await Promise.all((fonts || []).map(async (font) => {
    if (!font?.name || !/^\/(?:fonts)\/[A-Za-z0-9_./% -]+$/.test(font.url || '')) return;
    try {
      const face = new FontFace(font.name, `url("${font.url.replaceAll('"', '%22')}")`);
      document.fonts.add(await face.load());
    } catch (error) { console.warn(`Could not load custom font ${font.name}`, error); }
  }));
}

export function contrastRatio(a, b) {
  const lum = (hex) => {
    const rgb = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255).map((v) => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
  };
  const values = [lum(a), lum(b)].sort((x, y) => y - x);
  return (values[0] + .05) / (values[1] + .05);
}

export function accessibleText(background) {
  return contrastRatio(background, '#ffffff') >= contrastRatio(background, '#000000') ? '#ffffff' : '#000000';
}

export function hexToHsl(hex) {
  let [r, g, b] = hex.slice(1).match(/../g).map((v) => parseInt(v, 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return `0 0% ${Math.round(l * 100)}%`;
  const d = max - min, s = l > .5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return `${Math.round(h * 60)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return `#${[channel(0), channel(8), channel(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')}`;
}

export function parseColorInput(value, mode) {
  const text = String(value || '').trim();
  if (mode === 'HEX') return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : null;
  const parts = text.replace(/rgb\(|hsl\(|\)/gi, '').split(/[\s,\/]+/).filter(Boolean).map((part) => Number(part.replace('%', '')));
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null;
  if (mode === 'RGB') {
    if (parts.some((part) => part < 0 || part > 255)) return null;
    return `#${parts.map((part) => Math.round(part).toString(16).padStart(2, '0')).join('')}`;
  }
  if (parts[0] < -3600 || parts[0] > 3600 || parts[1] < 0 || parts[1] > 100 || parts[2] < 0 || parts[2] > 100) return null;
  return hslToHex(parts[0], parts[1], parts[2]);
}

export function generateHarmonyColors(accent, type, appearance) {
  const [h, s] = hexToHsl(accent).replaceAll('%', '').split(' ').map(Number);
  const dark = appearance === 'dark';
  const shifts = { complementary: [0, 180], analogous: [-30, 30], triadic: [120, 240], monochromatic: [0, 0] }[type] || [0, 180];
  const bgHue = h + shifts[0], borderHue = h + shifts[1];
  return {
    bg: hslToHex(bgHue, Math.max(3, s * .15), dark ? 12 : 96),
    panel: hslToHex(bgHue, Math.max(2, s * .1), dark ? 7 : 99),
    fg: hslToHex(h, Math.max(5, s * .18), dark ? 87 : 14),
    border: hslToHex(borderHue, Math.max(8, s * .3), dark ? 30 : 74),
    accent,
  };
}

export function downloadJson(data, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const anchor = Object.assign(document.createElement('a'), { href: url, download: filename }); anchor.click(); URL.revokeObjectURL(url);
}

export async function migrateLegacy() {
  if (localStorage.getItem('astra-theme-migrated-v2')) return;
  let themes = {};
  try { themes = JSON.parse(localStorage.getItem('odysseus-custom-themes') || '{}'); } catch { themes = {}; }
  for (const [name, legacy] of Object.entries(themes).slice(0, 100)) {
    try { await themeApi.create({ name, tokens: normalizeTheme({ name, ...legacy }).tokens }); } catch (error) { console.warn('Theme migration skipped:', name, error); }
  }
  localStorage.setItem('astra-theme-migrated-v2', 'true');
}

applyCachedTheme();
themeApi.list().then((data) => {
  const item = [...data.builtins, ...data.custom].find((theme) => theme.id === data.defaultThemeId);
  if (item) applyTheme(item);
  return migrateLegacy();
}).catch(() => {});
