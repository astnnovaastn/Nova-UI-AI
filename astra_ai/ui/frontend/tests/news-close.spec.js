import { expect, test } from '@playwright/test';

test('closing News disconnects it and ignores late results until explicitly reopened', async ({ page }) => {
  await page.route('**/api/news/state**', route => route.fulfill({ json: { current: {}, history: [] } }));
  await page.route('**/api/news/layouts**', route => route.fulfill({ json: { layouts: [] } }));
  await page.route('**/api/news/clear-current', route => route.fulfill({ json: { ok: true } }));
  await page.goto('/');
  const launcher = page.getByRole('button', { name: 'News', exact: true });
  await launcher.click();
  const news = page.locator('[data-aegis-widget="news"]');
  await page.evaluate(() => window.aegisWidgetControl('connect', 'news', {}));
  await news.getByRole('button', { name: 'Close News widget' }).click();
  await expect(news).toHaveCount(0);
  await expect(launcher).toHaveAttribute('data-aegis-connection', 'disconnected');
  await page.evaluate(() => window.aegisWidgetControl('show_news', 'news', { request_id: 'late-result', primary_story: { headline: 'Late result' } }));
  await expect(news).toHaveCount(0);
  await launcher.click();
  await expect(news).toBeVisible();
  await expect(news.getByText('Late result', { exact: true })).toHaveCount(0);
});
