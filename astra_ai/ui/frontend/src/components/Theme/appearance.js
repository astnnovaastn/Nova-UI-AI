// Derived display colors leave the saved theme palette untouched.
export function rgb(hex) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? [...value].map(c => c + c).join('') : value;
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
}
export function mix(a, b, weight) {
  const left = rgb(a), right = rgb(b);
  return '#' + left.map((value, i) => Math.round(value * (1 - weight) + right[i] * weight).toString(16).padStart(2, '0')).join('');
}
export function contrast(a, b) {
  const luminance = color => rgb(color).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
export function readable(color, surface, minimum = 4.5) {
  if (contrast(color, surface) >= minimum) return color;
  const target = contrast('#ffffff', surface) > contrast('#000000', surface) ? '#ffffff' : '#000000';
  for (let step = 1; step <= 100; step++) {
    const candidate = mix(color, target, step / 100);
    if (contrast(candidate, surface) >= minimum) return candidate;
  }
  return target;
}
export function readableSurfaces(color, surfaces, minimum = 4.5) {
  if (surfaces.every(surface => contrast(color, surface) >= minimum)) return color;
  for (const target of ['#ffffff', '#000000']) {
    for (let step = 1; step <= 100; step++) {
      const candidate = mix(color, target, step / 100);
      if (surfaces.every(surface => contrast(candidate, surface) >= minimum)) return candidate;
    }
  }
  return readable(color, surfaces[0], minimum);
}
export function widgetSurfaces(t, panel = t.panel, accent = t.accent) {
  return [panel, mix(panel, accent, .04), mix(panel, t.bg, .04), ...(t.frosted ? [mix(panel, t.bg, 1 - Number(t.panelOpacity ?? .94))] : [])];
}
export function appearanceTokens(t) {
  const surfaces = widgetSurfaces(t);
  const text = readableSurfaces(t.fg, surfaces);
  const accent = readableSurfaces(t.accent, surfaces);
  return {
    '--text-primary': readable(t.fg, t.bg),
    '--text-muted': readable(mix(readable(t.fg, t.bg), t.bg, .32), t.bg),
    '--text-faint': readable(mix(readable(t.fg, t.bg), t.bg, .46), t.bg),
    '--success-color': accent,
    '--warning-color': readable(mix(t.accent, t.fg, .25), t.panel),
    '--panel-text': text,
    '--panel-text-muted': readableSurfaces(mix(text, t.panel, .32), surfaces),
    '--panel-text-faint': readableSurfaces(mix(text, t.panel, .46), surfaces),
    '--accent-readable': accent,
    '--canvas-accent-readable': readable(t.accent, t.bg),
    '--on-accent': readable(t.fg, t.accent),
    '--theme-highlight': contrast('#ffffff', t.panel) > contrast('#000000', t.panel) ? '#ffffff' : '#000000',
    '--theme-shade': '#000000',
  };
}
