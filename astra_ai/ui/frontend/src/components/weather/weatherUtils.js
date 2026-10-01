export function convertWeatherValue(value, kind, units = 'metric') {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) return '--';
  let n = Number(value);
  if (units === 'imperial') {
    if (kind === 'temperature') n = n * 9 / 5 + 32;
    if (kind === 'wind' || kind === 'visibility') n /= 1.609344;
    if (kind === 'precipitation') n /= 25.4;
  }
  return Math.round(n * (kind === 'temperature' ? 1 : 10)) / (kind === 'temperature' ? 1 : 10);
}

export function clampWeatherWindow(rect, viewportWidth, viewportHeight) {
  const finite = (n, fallback) => Number.isFinite(n) ? n : fallback;
  const maxWidth = Math.max(1, viewportWidth - 20);
  const maxHeight = Math.max(1, viewportHeight - 20);
  const width = Math.min(maxWidth, Math.max(420, finite(rect.width, 640)));
  const height = Math.min(maxHeight, Math.max(360, finite(rect.height, 500)));
  return { width, height, x: Math.max(10, Math.min(viewportWidth - width - 10, finite(rect.x, 28))), y: Math.max(10, Math.min(viewportHeight - height - 10, finite(rect.y, 24))) };
}
