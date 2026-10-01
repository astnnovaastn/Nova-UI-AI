import assert from 'node:assert/strict';
import test from 'node:test';

const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
};
globalThis.window = {
  setTimeout,
  clearTimeout,
  dispatchEvent: () => {},
};
globalThis.CustomEvent = class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: false } });

const { calendarApi } = await import('./calendarApi.js');

test('offline event creation is optimistic and queued without network access', async () => {
  let fetched = false;
  globalThis.fetch = async () => { fetched = true; throw new Error('network should not be used'); };
  const saved = await calendarApi.createEvent({
    calendar_id: 'personal', title: 'Offline planning', start: '2026-07-22T09:00:00.000Z',
    end: '2026-07-22T10:00:00.000Z', all_day: false, reminder_minutes: [15],
    reminder_channels: ['in_app', 'system'],
  });
  assert.match(saved.id, /^local-/);
  assert.equal(saved._pending, true);
  assert.deepEqual(saved.reminder_channels, ['in_app', 'system']);
  assert.equal(calendarApi.offlineQueueSize(), 1);
  assert.equal(fetched, false);
});

test('offline cached range remains readable', async () => {
  const events = await calendarApi.events({ start: '2026-07-01T00:00:00Z', end: '2026-08-01T00:00:00Z' });
  assert.equal(events[0].title, 'Offline planning');
});

test('online event creation sends the complete normalized contract and updates cache', async () => {
  navigator.onLine = true;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    const submitted = JSON.parse(options.body);
    return {
      ok: true,
      status: 201,
      json: async () => ({
        data: {
          ...submitted,
          id: 'server-event-1',
          version: 1,
          start_at: submitted.start,
          end_at: submitted.end,
          reminders: submitted.reminder_minutes.map((minutes_before) => ({
            minutes_before,
            channels: submitted.reminder_channels,
          })),
        },
      }),
    };
  };

  const saved = await calendarApi.createEvent({
    calendar_id: 'personal',
    title: 'Frontend and backend review',
    description: 'Verify all requested fields.',
    location: 'https://meet.example.test/astra',
    start: '2026-07-23T09:00:00.000Z',
    end: '2026-07-23T10:00:00.000Z',
    all_day: false,
    timezone: 'Europe/Rome',
    recurrence: 'none',
    importance: 'critical',
    tags: ['frontend', 'review'],
    reminder_minutes: [30],
    reminder_channels: ['in_app', 'system'],
    color: '',
  });

  const body = JSON.parse(request.options.body);
  assert.equal(request.url, '/api/calendar/v1/events');
  assert.equal(body.title, 'Frontend and backend review');
  assert.equal(body.location, 'https://meet.example.test/astra');
  assert.equal(body.description, 'Verify all requested fields.');
  assert.deepEqual(body.tags, ['frontend', 'review']);
  assert.deepEqual(body.reminder_minutes, [30]);
  assert.deepEqual(body.reminder_channels, ['in_app', 'system']);
  assert.equal(body.importance, 'critical');
  assert.equal(body.recurrence, null);
  assert.equal('color' in body, false);
  assert.equal(saved.id, 'server-event-1');
  const cache = JSON.parse(localStorage.getItem('astra-calendar-offline-v1'));
  assert.equal(cache.events.some((event) => event.id === 'server-event-1'), true);
});

test('global search sends q without a visible date range', async () => {
  let requestedUrl = '';
  globalThis.fetch = async (url) => {
    requestedUrl = url;
    return { ok: true, status: 200, json: async () => ({ data: [] }) };
  };

  await calendarApi.events({ query: 'meeting link', calendars: ['personal'] });
  const url = new URL(requestedUrl, 'http://astra.local');
  assert.equal(url.searchParams.get('q'), 'meeting link');
  assert.deepEqual(url.searchParams.getAll('calendar_id'), ['personal']);
  assert.equal(url.searchParams.has('from'), false);
  assert.equal(url.searchParams.has('to'), false);
});
