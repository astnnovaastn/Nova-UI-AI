import { expect, test } from '@playwright/test';

test('Calendar control contract works without console or responsive failures', async ({ page }, testInfo) => {
  const errors = []; page.on('pageerror', (error) => errors.push(error.message)); page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  let calendars = [{ id: 'personal', name: 'Personal', color: '#58B4FF', visible: true, is_visible: true, version: 1 }];
  let events = []; let counter = 0; const rangeEnds = []; const eventPosts = [];
  let failNextEventCreate = true;
  const globalSearchEvent = {
    id: 'outside-range',
    version: 1,
    calendar_id: 'personal',
    title: 'Remote strategy summit',
    description: 'Searchable notes',
    location: 'Milan studio',
    tags: ['strategy'],
    importance: 'high',
    all_day: false,
    start: '2027-03-10T09:00:00+01:00',
    end: '2027-03-10T10:00:00+01:00',
    reminders: [],
  };
  const envelope = (data) => ({ data, meta: { request_id: 'e2e', server_time: new Date().toISOString() } });
  await page.addInitScript(() => { window.EventSource = class { addEventListener() {} removeEventListener() {} close() {} }; });
  await page.route('**/api/calendar/v1/**', async (route) => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname.replace('/api/calendar/v1', ''); const method = request.method(); const body = request.postDataJSON?.() || {};
    const json = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(envelope(data)) });
    if (path === '/preferences') return json(method === 'PATCH' ? body : { timezone: 'Europe/Rome', week_start: 'monday', week_starts_on: 1, hour_cycle: '24', hour12: false, system_notifications: false, pinned_timezones: ['America/New_York'] });
    if (path === '/calendars' && method === 'GET') return json(calendars);
    if (path === '/calendars' && method === 'POST') { const item = { id: `cal-${calendars.length}`, visible: true, is_visible: true, version: 1, ...body }; calendars.push(item); return json(item, 201); }
    if (path.startsWith('/calendars/') && method === 'PATCH') { const id = path.split('/').pop(); calendars = calendars.map((item) => item.id === id ? { ...item, ...body, visible: body.is_visible ?? item.visible } : item); return json(calendars.find((item) => item.id === id)); }
    if (path === '/events' && method === 'GET') {
      rangeEnds.push(url.searchParams.get('to'));
      if (url.searchParams.get('q')) return json([globalSearchEvent]);
      return json(events);
    }
    if (path === '/events' && method === 'POST') {
      eventPosts.push(body);
      if (failNextEventCreate) {
        failNextEventCreate = false;
        return route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({ detail: { error: { code: 'INVALID_EVENT', message: 'The event could not be saved yet.' } } }),
        });
      }
      const item = { id: `event-${++counter}`, version: 1, tags: [], reminders: [], ...body, start: body.start || body.start_date, end: body.end || body.end_date };
      events.push(item);
      return json(item, 201);
    }
    if (path.startsWith('/events/') && method === 'PATCH') { const id = path.split('/').pop(); events = events.map((item) => item.id === id ? { ...item, ...body, version: item.version + 1 } : item); return json(events.find((item) => item.id === id)); }
    if (path.startsWith('/events/') && method === 'DELETE') { const id = path.split('/').pop(); events = events.filter((item) => item.id !== id); return json({ deleted_id: id }); }
    if (path === '/quick-add/parse') return json({ draft_id: 'draft-1', title: 'Design review', start: '2026-07-22T14:00:00+02:00', end: '2026-07-22T15:00:00+02:00', confidence: .94, assumptions: [], requires_confirmation: true });
    if (path === '/quick-add/commit') { const item = { id: `event-${++counter}`, version: 1, tags: [], reminders: [], calendar_id: body.patch.calendar_id || 'personal', ...body.patch }; events.push(item); return json(item, 201); }
    if (path === '/sync/status') return json({ state: 'idle', queued: 0, accounts: [] });
    if (path === '/sync') return json({ state: 'synced', status: 'local_only', queued: 0 });
    if (path === '/templates' || path === '/smart-views' || path === '/reminders/due') return json([]);
    if (path === '/suggested-times') return json([{ start: '2026-07-23T10:00:00+02:00', end: '2026-07-23T11:00:00+02:00' }]);
    if (path === '/caldav/accounts/test') return json({ connected: true, calendar_count: 1, calendars: ['Personal'] });
    if (path === '/caldav/accounts') return json({ account: { id: 'dav-1', status: 'ready' }, calendars: ['Personal'], credential_storage: 'session_only' }, 201);
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: { error: { code: 'NOT_MOCKED', message: path } } }) });
  });

  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  const widget = page.locator('.calendar-widget'); await expect(widget).toBeVisible(); await expect(widget).toHaveAttribute('data-widget-id', 'calendar');
  for (const view of ['Week', 'Month', 'Year', 'Agenda']) { await widget.getByRole('tab', { name: new RegExp(view, 'i') }).click(); await expect(widget.getByRole('tab', { name: new RegExp(view, 'i') })).toHaveAttribute('aria-selected', 'true'); }
  await widget.getByRole('tab', { name: /Month/i }).click(); await widget.getByRole('button', { name: /^New$/ }).click();
  const editor = page.getByRole('dialog', { name: 'New event' });
  await expect(editor.getByText('Email', { exact: true })).toHaveCount(0);
  const titleInput = editor.getByLabel('Event title');
  await titleInput.pressSequentially('E2E planning'); await expect(titleInput).toHaveValue('E2E planning'); await expect(titleInput).toBeFocused();
  const startsInput = editor.getByLabel('Starts'); await startsInput.fill('2026-07-22T14:00'); await expect(startsInput).toHaveValue('2026-07-22T14:00'); await expect(startsInput).toBeFocused();
  const endsInput = editor.getByLabel('Ends'); await endsInput.fill('2026-07-22T15:00'); await expect(endsInput).toHaveValue('2026-07-22T15:00'); await expect(endsInput).toBeFocused();
  const timezoneInput = editor.getByLabel('Timezone'); await timezoneInput.press('Control+A'); await timezoneInput.pressSequentially('Europe/Rome'); await expect(timezoneInput).toHaveValue('Europe/Rome'); await expect(timezoneInput).toBeFocused();
  const locationInput = editor.getByLabel('Location or meeting link'); await locationInput.pressSequentially('https://meet.example.test/e2e'); await expect(locationInput).toHaveValue('https://meet.example.test/e2e'); await expect(locationInput).toBeFocused();
  const notesInput = editor.getByLabel('Notes'); await notesInput.pressSequentially('Frontend and backend persistence notes.'); await expect(notesInput).toHaveValue('Frontend and backend persistence notes.'); await expect(notesInput).toBeFocused();
  const tagInput = editor.getByLabel('Add tags'); await tagInput.pressSequentially('frontend'); await expect(tagInput).toHaveValue('frontend'); await expect(tagInput).toBeFocused(); await tagInput.press('Enter');
  await tagInput.pressSequentially('release'); await expect(tagInput).toHaveValue('release'); await expect(tagInput).toBeFocused(); await tagInput.press('Enter');
  await expect(editor.getByRole('button', { name: 'Remove frontend tag' })).toBeVisible(); await expect(editor.getByRole('button', { name: 'Remove release tag' })).toBeVisible();
  await editor.getByLabel('Importance').selectOption('critical');
  await editor.getByLabel('When').selectOption('30');
  await editor.getByRole('button', { name: 'Save event' }).click();
  await expect(editor).toBeVisible();
  await expect(editor.getByRole('alert')).toContainText('could not be saved');
  await expect(editor.getByLabel('Event title')).toHaveValue('E2E planning');
  errors.length = 0; // The intentionally mocked 422 is expected and asserted above.
  await editor.getByRole('button', { name: 'Save event' }).click();
  await expect(editor).toBeHidden();
  expect(eventPosts.at(-1)).toMatchObject({
    title: 'E2E planning',
    location: 'https://meet.example.test/e2e',
    description: 'Frontend and backend persistence notes.',
    tags: ['frontend', 'release'],
    importance: 'critical',
    reminder_minutes: [30],
  });
  expect(eventPosts.at(-1).color).toBeUndefined();
  await widget.getByLabel('Search calendar events').fill('strategy');
  await expect(widget.getByText('Remote strategy summit')).toBeVisible();
  await widget.getByLabel('Search calendar events').fill('');
  await widget.getByLabel('Quick Add event').fill('Design review tomorrow'); await widget.getByRole('button', { name: 'Review' }).click(); await page.getByRole('dialog', { name: 'Review Quick Add' }).getByRole('button', { name: 'Add to calendar' }).click();
  await widget.getByRole('button', { name: 'Filters and smart views' }).click(); const filters = widget.getByRole('complementary', { name: 'Calendar filters' }); await expect(filters).toBeVisible(); await expect(filters.getByRole('heading', { name: 'Visible calendars' })).toBeVisible(); await expect(filters.getByRole('heading', { name: 'Smart views' })).toBeVisible(); const personalFilter = filters.getByRole('button', { name: /Personal/ }); await expect(personalFilter).toHaveAttribute('aria-pressed', 'true'); await personalFilter.click(); await expect(personalFilter).toHaveAttribute('aria-pressed', 'false'); const highPriority = filters.getByRole('button', { name: /High priority/ }); await highPriority.click(); await expect(highPriority).toHaveAttribute('aria-pressed', 'true'); await filters.getByRole('button', { name: 'Clear filters' }).click(); await expect(filters).toBeHidden(); await expect(widget.getByRole('button', { name: 'Calendar settings' })).toBeEnabled();
  await widget.getByRole('tab', { name: /Agenda/i }).click(); const before = rangeEnds.at(-1); await widget.getByRole('button', { name: 'Load 90 more days' }).click(); await expect.poll(() => rangeEnds.at(-1)).not.toBe(before);
  await widget.getByRole('button', { name: 'Calendar settings' }).click(); const settings = page.getByRole('dialog', { name: 'Calendar settings' }); await settings.getByLabel('New calendar name').fill('Studio'); await settings.getByRole('button', { name: /Save calendar/i }).click(); await settings.getByRole('button', { name: 'Close dialog' }).click();
  if (testInfo.project.name === 'calendar-mobile') { await expect(widget.getByRole('button', { name: 'Sync calendars' })).toBeVisible(); await expect(widget.getByRole('button', { name: 'Filters and smart views' })).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth)).toBe(true); }
  expect(errors).toEqual([]);
});
