import { test, expect } from '@playwright/test';

const data = (location = 'Paris') => ({ success: true, weather_data: {
  current: { location, temperature: 20, feelsLike: 18, high: 22, low: 12, condition: 'Partly cloudy', updatedAt: '2026-10-01T12:00:00Z' },
  metrics: { windSpeed: 16, visibility: 10, humidity: 60, dewPoint: 10 },
  meta: { latitude: 48.85, longitude: 2.35, timezoneId: 'Europe/Paris' },
  hourlyForecast: [{ time: 'Now', temperature: 20, condition: 'Sunny', precipChance: 10 }],
} });

test.beforeEach(async ({ page }) => {
  await page.route('**/api/weather/current**', route => route.fulfill({ json: data(new URL(route.request().url()).searchParams.get('location') || 'Paris') }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Weather', exact: true }).click();
  await expect(page.locator('.weather-current-temp')).toContainText('20');
});

test('location and settings are separate, units work, tabs replace content', async ({ page }) => {
  const widget = page.locator('#weatherDisplay');
  await widget.locator('.weather-toolbar-location').click();
  await expect(widget.getByRole('dialog', { name: 'Choose location' })).toBeVisible();
  await widget.getByRole('textbox', { name: 'Search for a location' }).fill('London');
  await widget.getByRole('button', { name: 'Search location', exact: true }).click();
  await expect(widget.locator('.weather-current-location')).toHaveText('London');
  await widget.getByRole('button', { name: 'Open weather settings' }).click();
  await widget.getByLabel('Units', { exact: true }).selectOption('imperial');
  await expect(widget.locator('.weather-current-temp')).toContainText('68');
  await page.keyboard.press('Escape');
  await expect(widget).toBeVisible();
  await widget.getByRole('tab', { name: 'Hourly', exact: true }).click();
  await expect(widget.locator('.weather-current-card')).toHaveCount(0);
  await expect(widget.locator('.weather-hour-card')).toHaveCount(1);
});

test('close remains usable while refresh is pending', async ({ page }) => {
  await page.route('**/api/weather/current**', () => {});
  await page.getByRole('button', { name: 'Refresh weather data' }).click();
  await page.getByRole('button', { name: 'Close Weather', exact: true }).click({ timeout: 3000 });
  await expect(page.locator('#weatherDisplay')).toHaveCount(0);
});

test('weather fits the viewport and has an accessible pointer resize handle', async ({ page }) => {
  const widget = page.locator('#weatherDisplay');
  const bounds = await widget.boundingBox();
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
  await expect(widget.getByRole('button', { name: 'Resize Weather', exact: true })).toBeVisible();
});

test('pointer resize follows the handle vertically and retains its size on reopen', async ({ page }) => {
  const widget = page.locator('#weatherDisplay');
  const before = await widget.boundingBox();
  const handle = await widget.getByRole('button', { name: 'Resize Weather', exact: true }).boundingBox();
  await page.mouse.move(handle.x + 10, handle.y + 10);
  await page.mouse.down();
  await page.mouse.move(handle.x + 10, handle.y - 90, { steps: 10 });
  await page.mouse.up();
  await expect.poll(async () => Math.round((await widget.boundingBox()).height)).toBe(Math.round(before.height - 100));
  await widget.getByRole('button', { name: 'Close Weather', exact: true }).click();
  await page.getByRole('button', { name: 'Weather', exact: true }).click();
  await expect.poll(async () => Math.round((await widget.boundingBox()).height)).toBe(Math.round(before.height - 100));
});

test('radar is a dedicated map with functioning frame navigation', async ({ page }) => {
  await page.route('**/api/weather/radar', route => route.fulfill({ json: { success: true, host: 'https://tilecache.rainviewer.com', frames: [{ time: 1790856000, path: '/v2/radar/one' }, { time: 1790856600, path: '/v2/radar/two' }] } }));
  await page.route(/https:\/\/(tile\.openstreetmap\.org|tilecache\.rainviewer\.com)\//, route => route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=', 'base64') }));
  await page.getByRole('tab', { name: 'Radar', exact: true }).click();
  await expect(page.locator('.weather-radar-map.leaflet-container')).toBeVisible();
  await expect(page.locator('.weather-hourly')).toHaveCount(0);
  await expect(page.getByRole('slider', { name: 'Radar timeline' })).toHaveValue('1');
  await page.getByRole('button', { name: 'Previous radar frame' }).click();
  await expect(page.getByRole('slider', { name: 'Radar timeline' })).toHaveValue('0');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
});

test('AI request supersedes delayed weather and refresh failure keeps prior data', async ({ page }) => {
  let delayed;
  await page.route('**/api/weather/current**', async route => {
    if (new URL(route.request().url()).searchParams.get('location') === 'Rome') { delayed = route; return; }
    await route.fulfill({ json: data('Tokyo') });
  });
  await page.evaluate(() => window.aegisWidgetControl('open', 'weather', { location: 'Rome', request_id: 'rome' }));
  await expect.poll(() => Boolean(delayed)).toBe(true);
  await page.evaluate(() => window.aegisWidgetControl('open', 'weather', { location: 'Tokyo', request_id: 'tokyo' }));
  await expect(page.locator('.weather-current-location')).toHaveText('Tokyo');
  await delayed.fulfill({ json: data('Rome') }).catch(() => {});
  await page.route('**/api/weather/current**', route => route.fulfill({ status: 502, json: { success: false, error: 'Provider unavailable' } }));
  await page.getByRole('button', { name: 'Refresh weather data' }).click();
  await expect(page.getByRole('alert')).toContainText('Provider unavailable');
  await expect(page.locator('.weather-current-location')).toHaveText('Tokyo');
});

test('denied location stays in the picker with a manual-search recovery', async ({ page }) => {
  await page.evaluate(() => { navigator.geolocation.getCurrentPosition = (_ok, fail) => fail({ code: 1 }); });
  await page.locator('.weather-toolbar-location').click();
  await page.getByRole('button', { name: 'Use my live location' }).click();
  await expect(page.getByRole('dialog', { name: 'Choose location' })).toContainText('Location permission denied');
  await expect(page.locator('.weather-current-location')).toHaveText('Paris');
});
