import { expect, test } from '@playwright/test';

const story = {
  id: 'lead', headline: 'Markets react to verified central bank signals',
  summary: 'A provider-supplied briefing paragraph.', body: 'A provider-supplied briefing paragraph.\n\nAdditional provider context.',
  // Providers commonly return relative timestamps; these must never crash
  // the adaptive briefing when the widget opens a restored result.
  publishedAt: '1 hour ago', category: 'Markets', isTopStory: true,
  briefingSections: [
    { id: 'market-context', title: 'Market Context', body: 'A full editorial context paragraph.' },
    { id: 'analysis', title: 'Analysis', body: 'A full editorial analysis paragraph.' },
  ],
  media: [
    { id: 'hero', url: 'https://example.test/hero.jpg', width: 1800, height: 1000, aspectRatio: 1.8, qualityScore: 90 },
    { id: 'hero-two', url: 'https://example.test/hero-two.jpg', width: 1600, height: 1000, aspectRatio: 1.6, qualityScore: 85 },
    { id: 'support', url: 'https://example.test/support.jpg', width: 1200, height: 900, aspectRatio: 1.33, qualityScore: 80 },
  ],
  mediaPlan: { heroMedia: [{ id: 'hero', url: 'https://example.test/hero.jpg' }, { id: 'hero-two', url: 'https://example.test/hero-two.jpg' }], supportingMedia: [{ id: 'support', url: 'https://example.test/support.jpg' }], quoteMedia: [], relatedCoverageMedia: [] },
  sources: [{ id: 'reuters', name: 'Reuters', url: 'https://example.test/reuters', headline: 'Markets react', publishedAt: '2026-08-10T09:30:00Z' }],
};

test('News uses Search shell mechanics and renders a structured live briefing', async ({ page }) => {
  await page.addInitScript(() => {
    class MockWebSocket { static OPEN = 1; readyState = 1; constructor() { queueMicrotask(() => this.onopen?.()); } send() {} close() { this.readyState = 3; this.onclose?.(); } addEventListener() {} removeEventListener() {} }
    window.WebSocket = MockWebSocket;
  });
  await page.route('**/api/news/state**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ current: {}, history: [] }) }));
  await page.route('**/api/news/history**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ history: [{ request_id: 'news-test', query: 'global markets', display_topic: 'global markets', saved_at: '2026-08-10T10:00:00Z', story_count: 1 }] }) }));
  await page.route('**/api/news/clear-current', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true }) }));
  await page.route('https://example.test/**/*.jpg', (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1000"><rect width="100%" height="100%" fill="#123"/></svg>' }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /News/ }).click();
  const news = page.locator('[data-aegis-widget="news"]');
  await expect(news).toBeVisible();
  const stackOrder = await Promise.all([
    news.evaluate((node) => Number(getComputedStyle(node).zIndex)),
    page.locator('#widget-launcher-rail').evaluate((node) => Number(getComputedStyle(node).zIndex)),
  ]);
  expect(stackOrder[0]).toBeGreaterThan(stackOrder[1]);
  await page.getByRole('button', { name: /Search/ }).click();
  const search = page.locator('[data-aegis-widget="search"]');
  await expect(search).toBeVisible();
  const [newsBox, searchBox] = await Promise.all([news.boundingBox(), search.boundingBox()]);
  expect(newsBox?.width).toBe(searchBox?.width); expect(newsBox?.height).toBe(searchBox?.height);
  await search.getByRole('button', { name: 'Close Search widget' }).click({ force: true });
  const related = { ...story, id: 'related-story', headline: 'Additional markets reporting from a second publisher', sources: [{ id: 'ap', name: 'AP', url: 'https://example.test/ap', headline: 'Additional markets reporting', publishedAt: '2026-08-10T09:00:00Z' }] };
  await page.evaluate((payload) => window.aegisWidgetControl('show_news', 'news', payload), { request_id: 'news-test', query: 'global markets', display_topic: 'global markets', generated_at: '2026-08-10T10:00:00Z', primary_story: story, related_stories: [story, related], full_search_results: [story, related], history_preview: [{ request_id: 'news-test', query: 'global markets', display_topic: 'global markets', saved_at: '2026-08-10T10:00:00Z', story_count: 2 }] });
  await expect(news.getByRole('heading', { name: story.headline })).toBeVisible();
  await expect(news.getByText('Market Context')).toBeVisible();
  await expect(news.locator('.news-editorial-hero')).toBeVisible();
  await expect(news.getByRole('button', { name: 'Next story image' })).toBeVisible();
  await expect(news.getByRole('button', { name: 'Next related story' })).toBeVisible();
  await expect(news.locator('.news-related-strip')).toHaveCSS('overflow-x', 'hidden');
  await expect(news.getByText('LIVE NEWS BRIEFING')).toBeVisible();
  await news.getByRole('tab', { name: /Full Search/ }).click(); await expect(news.getByRole('link', { name: /Markets react/ })).toBeVisible();
  await news.getByRole('tab', { name: /History/ }).click(); await expect(news.getByText('global markets').first()).toBeVisible();
  await news.getByRole('tab', { name: 'Answer' }).click(); await news.getByRole('button', { name: /View sources/ }).click(); await expect(news.getByRole('link', { name: /Open/ })).toBeVisible();
  const more = news.getByRole('button', { name: 'More News actions' });
  await more.click(); await expect(news.getByText('Copy briefing')).toBeVisible(); await more.click();
  await news.getByRole('button', { name: 'Save News briefing' }).click();
  await news.getByRole('button', { name: 'Minimize News widget' }).click(); await expect(news).toBeHidden();
  await page.getByRole('button', { name: /News/ }).click(); await expect(news).toBeVisible();
  await news.getByRole('button', { name: 'Close News widget' }).click(); await expect(news).toBeHidden();
});

test('News Layout Studio provides a bounded direct canvas without resizing the widget', async ({ page }, testInfo) => {
  test.setTimeout(45_000);
  await page.addInitScript(() => {
    class MockWebSocket { static OPEN = 1; readyState = 1; constructor() { queueMicrotask(() => this.onopen?.()); } send() {} close() { this.readyState = 3; this.onclose?.(); } addEventListener() {} removeEventListener() {} }
    window.WebSocket = MockWebSocket;
  });
  await page.route('**/api/news/state**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ current: {}, history: [] }) }));
  const layoutPayload = { activeLayoutId: 'default-aegis', layouts: [{ id: 'default-aegis', name: 'Default AEGIS', schemaVersion: 3, grid: { columns: 12, gap: 14 }, blocks: [{ id: 'headline', kind: 'headline', binding: 'headline', layout: { desktop: { x: 0, y: 0, w: 12, minRows: 2 } } }] }] };
  await page.route('**/api/news/layouts', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(layoutPayload) }));
  await page.route('**/api/news/layouts/**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, ...layoutPayload }) }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /News/ }).click();
  const news = page.locator('[data-aegis-widget="news"]');
  const beforeEdit = await news.boundingBox();
  await news.getByRole('button', { name: 'Customize News layout' }).click();
  await expect(news.getByText('LAYOUT CANVAS')).toBeVisible();
  const duringEdit = await news.boundingBox();
  expect(duringEdit?.width).toBe(beforeEdit?.width);
  expect(duringEdit?.height).toBe(beforeEdit?.height);
  await news.getByRole('button', { name: 'Add block' }).click();
  await news.getByRole('button', { name: 'Dynamic News Section' }).click();
  const dynamic = news.locator('.news-editor-block').filter({ hasText: 'Dynamic News Section' }).last();
  await expect(dynamic).toBeVisible();
  await dynamic.getByRole('button', { name: /More options/ }).click();
  await news.getByRole('button', { name: 'Settings' }).click();
  await expect(news.getByRole('dialog', { name: /Settings for Dynamic News Section/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await news.getByRole('button', { name: 'Add workspace' }).click();
  await news.getByRole('button', { name: 'Add workspace' }).click();
  const geometry = async () => dynamic.evaluate((node) => ({ column: node.style.gridColumn, row: node.style.gridRow }));
  const initialGeometry = await geometry();
  for (let index = 0; index < (testInfo.project.name === 'calendar-mobile' ? 2 : 10); index += 1) await dynamic.click();
  await expect.poll(geometry).toEqual(initialGeometry);
  const header = dynamic.locator('header');
  const beforeMove = await geometry();
  const headerBox = await header.boundingBox();
  if (!headerBox) throw new Error('Expected dynamic block header bounds');
  await page.mouse.move(headerBox.x + headerBox.width / 2, headerBox.y + headerBox.height / 2);
  await page.mouse.down(); await page.mouse.move(headerBox.x + headerBox.width / 2, headerBox.y + headerBox.height / 2 + 96, { steps: 8 }); await page.mouse.up();
  const afterMove = await geometry();
  expect(afterMove.column).toBe(beforeMove.column); expect(afterMove.row).not.toBe(beforeMove.row);
  const movedHeader = await header.boundingBox();
  const headlineBox = await news.locator('.news-editor-block').filter({ hasText: 'Headline' }).locator('header').boundingBox();
  if (!movedHeader || !headlineBox) throw new Error('Expected draggable header bounds');
  await page.mouse.move(movedHeader.x + movedHeader.width / 2, movedHeader.y + movedHeader.height / 2);
  await page.mouse.down(); await page.mouse.move(headlineBox.x + headlineBox.width / 2, headlineBox.y + headlineBox.height / 2, { steps: 8 }); await page.mouse.up();
  await expect.poll(geometry).toEqual(afterMove);
  await dynamic.click();
  const southHandle = dynamic.getByRole('button', { name: /Resize Dynamic News Section from s$/ });
  const resizeBox = await southHandle.boundingBox();
  if (!resizeBox) throw new Error('Expected resize handle bounds');
  await page.mouse.move(resizeBox.x + resizeBox.width / 2, resizeBox.y + resizeBox.height / 2);
  await page.mouse.down(); await page.mouse.move(resizeBox.x + resizeBox.width / 2, resizeBox.y + resizeBox.height / 2 + 32, { steps: 5 }); await page.mouse.up();
  const afterResize = await geometry();
  expect(afterResize.column).toBe(afterMove.column); expect(afterResize.row).not.toBe(afterMove.row);
  if (testInfo.project.name === 'calendar-desktop') {
    const widgetBeforeResize = await news.boundingBox();
    const outerHandle = news.getByRole('button', { name: 'Resize News widget' }); const outerBox = await outerHandle.boundingBox();
    if (!widgetBeforeResize || !outerBox) throw new Error('Expected News widget resize handle bounds');
    await page.mouse.move(outerBox.x + outerBox.width / 2, outerBox.y + outerBox.height / 2);
    await page.mouse.down(); await page.mouse.move(outerBox.x + outerBox.width / 2 + 48, outerBox.y + outerBox.height / 2 + 36, { steps: 5 }); await page.mouse.up();
    const widgetAfterResize = await news.boundingBox();
    expect(widgetAfterResize?.width).toBeGreaterThan(widgetBeforeResize.width);
    expect(widgetAfterResize?.height).toBeGreaterThan(widgetBeforeResize.height);
    await expect.poll(geometry).toEqual(afterResize);
  }
  await news.getByRole('button', { name: 'Fit workspace to content' }).click();
  await news.getByRole('button', { name: 'Toggle grid' }).click();
  await news.getByRole('button', { name: 'Preview draft' }).click();
  await expect(news.getByText('DRAFT PREVIEW')).toBeVisible();
  await news.getByRole('button', { name: 'Back to editor' }).click();
});