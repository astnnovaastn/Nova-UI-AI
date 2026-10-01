import { expect, test } from '@playwright/test';

const saved = {
  request_id: 'saved-1', query: 'previous research', display_topic: 'Previous research',
  display_subtopic: 'Saved web result', saved_at: '2026-08-07T09:30:00+02:00',
};

const showSearchState = (page, command, payload) => page.evaluate(({ command, payload }) => {
  window.aegisWidgetControl(command, 'search', payload);
}, { command, payload });

test('Search uses one correlated Aegis transcript turn and remains stable across its views', async ({ page }) => {
  let current = { query: '', answer: '', results: [], loading: false, error: '', view_mode: 'current', history_preview: [saved] };
  let history = [saved];
  let directRunRequests = 0;

  await page.addInitScript(() => {
    window.__aegisSocketMessages = [];
    window.__aegisSocketInstances = [];
    window.__aegisSocketOpened = false;
    class MockWebSocket {
      static OPEN = 1;
      static CLOSED = 3;
      readyState = MockWebSocket.OPEN;
      constructor() {
        window.__aegisSocketInstances.push(this);
        queueMicrotask(() => {
          window.__aegisSocketOpened = true;
          this.onopen?.({ type: 'open' });
        });
      }
      send(data) { window.__aegisSocketMessages.push(JSON.parse(data)); }
      close() { this.readyState = MockWebSocket.CLOSED; this.onclose?.({ type: 'close' }); }
      addEventListener() {}
      removeEventListener() {}
    }
    window.WebSocket = MockWebSocket;
  });

  await page.route('**/api/search/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/api/search/run') {
      directRunRequests += 1;
      return json({ error: 'Search must use the Aegis transcript flow.' }, 500);
    }
    if (path === '/api/search/state') return json({ current, history });
    if (path === '/api/search/history') return json({ history });
    if (path === '/api/search/history/match') return json({ success: true, matches: history });
    if (path === '/api/search/history/restore') return json({ success: true, ...current, query: saved.query, display_topic: saved.display_topic, history_preview: history });
    if (path === '/api/search/history/restore-latest') return json({ success: true, ...current, query: saved.query, display_topic: saved.display_topic, history_preview: history });
    if (path === '/api/search/history/delete') { history = []; return json({ success: true, current, history }); }
    if (path === '/api/search/clear-current') { current = { query: '', answer: '', results: [], loading: false, error: '', view_mode: 'current' }; return json({ success: true, current, history }); }
    return json({ error: `Unmocked ${path}` }, 404);
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__aegisSocketOpened === true);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  const widget = page.locator('[data-aegis-widget="search"]');
  await expect(widget).toBeVisible();
  const input = widget.getByRole('combobox', { name: 'Search the live web' });

  await widget.locator('.search-form').click({ position: { x: 8, y: 24 } });
  await expect(input).toBeFocused();

  await input.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__aegisSocketMessages.filter((message) => message.type === 'transcript').length)).toBe(0);

  await input.fill('future energy storage');
  await input.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__aegisSocketMessages.filter((message) => message.type === 'transcript').length)).toBe(1);
  let transcripts = await page.evaluate(() => window.__aegisSocketMessages.filter((message) => message.type === 'transcript'));
  expect(transcripts[0]).toMatchObject({
    text: 'search the web for future energy storage',
    display_query: 'future energy storage',
    source: 'search_widget',
    isFinal: true,
  });
  expect(transcripts[0].request_id).toBeTruthy();

  await showSearchState(page, 'set_loading', {
    query: 'future energy storage', display_topic: 'future energy storage', loading: true,
    request_id: transcripts[0].request_id, source: 'aegis_ai',
  });
  await expect(widget.getByText('Scanning live sources')).toBeVisible();
  current = {
    query: 'future energy storage', display_topic: 'future energy storage', loading: false, error: '', view_mode: 'current', search_type: 'web',
    request_id: transcripts[0].request_id,
    answer: 'Direct Answer\nA concise synthesized answer.\n\nAdditional Information\nUseful supporting context.\n\nSources\nGoogle Search, Web Analysis, Real-time Data Aggregation',
    results: [
      { title: 'Primary source', link: 'https://example.test/research', snippet: 'Evidence from the source.', source_name: 'Example Research', domain: 'example.test' },
      { title: 'Second source', link: 'https://news.test/report', snippet: 'More evidence.', publisher: 'News Test' },
      { title: 'Unsafe source', link: 'javascript:alert(1)', snippet: 'Must not become a link.', source: 'Unsafe' },
    ],
    history_preview: history,
  };
  await showSearchState(page, 'show_results', current);
  await expect(widget.getByText('A concise synthesized answer.')).toBeVisible();
  await expect(widget.getByText('Google Search, Web Analysis, Real-time Data Aggregation')).toHaveCount(0);
  await expect(widget.locator('.search-source-links a')).toHaveCount(2);
  const firstRequestId = transcripts[0].request_id;
  const beforeReloadBox = await widget.boundingBox();
  await page.evaluate(() => {
    const socket = window.__aegisSocketInstances.find((candidate) => typeof candidate.onmessage === 'function');
    socket.onmessage?.({ data: JSON.stringify({ type: 'status', state: 'idle', message: 'ready' }) });
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__aegisSocketOpened === true);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(widget).toBeVisible();
  const afterReloadBox = await widget.boundingBox();
  expect(Math.round(afterReloadBox.width)).toBe(Math.round(beforeReloadBox.width));
  expect(Math.round(afterReloadBox.height)).toBe(Math.round(beforeReloadBox.height));

  await input.fill('orbital solar power');
  await expect(widget.getByRole('button', { name: 'Run Search' })).toHaveCount(0);
  await input.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__aegisSocketMessages.filter((message) => message.type === 'transcript').length)).toBe(1);
  transcripts = await page.evaluate(() => window.__aegisSocketMessages.filter((message) => message.type === 'transcript'));
  expect(transcripts[0]).toMatchObject({
    text: 'search the web for orbital solar power',
    display_query: 'orbital solar power',
    source: 'search_widget',
  });
  expect(transcripts[0].request_id).toBeTruthy();
  expect(transcripts[0].request_id).not.toBe(firstRequestId);
  expect(directRunRequests).toBe(0);

  current = { ...current, query: 'orbital solar power', display_topic: 'orbital solar power', request_id: transcripts[0].request_id };
  await showSearchState(page, 'show_results', current);
  await widget.getByRole('tab', { name: /Full Search/ }).click();
  await expect(widget.getByRole('link', { name: /Primary source/ })).toBeVisible();
  await expect(widget.getByRole('link', { name: 'Example Research' })).toBeVisible();
  await widget.getByRole('tab', { name: /History/ }).click();
  await expect(widget.getByText('Previous research')).toBeVisible();
  const historyCard = widget.locator('.search-history-card').first();
  await expect(historyCard).toHaveCSS('padding', '0px');
  await expect(historyCard).toHaveCSS('border-radius', '6px');
  await widget.getByRole('button', { name: 'Delete Previous research' }).click();
  await widget.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(widget.getByRole('tab', { name: /History/ })).toHaveAttribute('aria-selected', 'true');
  await expect(widget.getByText('Your completed live searches will appear here.')).toBeVisible();

  const box = await widget.boundingBox();
  const viewport = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  if (viewport.width <= 520) {
    expect(box.height).toBeLessThanOrEqual(680);
    await expect(page.locator('#widget-launcher-rail')).toBeHidden();
  }

  await widget.getByRole('button', { name: 'Close Search widget' }).click();
  await expect(widget).toBeHidden();
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(widget).toBeVisible();
  const reopenedBox = await widget.boundingBox();
  expect(Math.round(reopenedBox.width)).toBe(Math.round(box.width));
  expect(Math.round(reopenedBox.height)).toBe(Math.round(box.height));
  expect(directRunRequests).toBe(0);
});
