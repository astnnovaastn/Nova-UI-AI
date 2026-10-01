const API_ROOT = '/api/calendar/v1';
const OFFLINE_KEY = 'astra-calendar-offline-v1';

const readOffline = () => {
  try { return JSON.parse(localStorage.getItem(OFFLINE_KEY) || '{}'); }
  catch { return {}; }
};
const writeOffline = (patch) => {
  const next = { ...readOffline(), ...patch };
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('astra:calendar-offline-change', { detail: next }));
  return next;
};
const cacheValue = (key, value) => { writeOffline({ [key]: value }); return value; };
const queueMutation = (entry) => {
  const state = readOffline();
  writeOffline({ outbox: [...(state.outbox || []), { id: crypto.randomUUID?.() || `${Date.now()}`, created_at: new Date().toISOString(), ...entry }] });
};

class CalendarApiError extends Error {
  constructor(message, { status = 0, code = 'calendar_request_failed', details = null } = {}) {
    super(message);
    this.name = 'CalendarApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeout || 12000);
  try {
    const response = await fetch(`${API_ROOT}${path}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });
    const payload = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const fault = payload?.error || payload?.detail?.error;
      const details = fault?.details || (Array.isArray(payload?.detail) ? payload.detail : payload?.detail);
      const message = fault?.message || (Array.isArray(payload?.detail) ? 'Calendar validation failed' : `Calendar request failed (${response.status})`);
      console.error('[Calendar API]', { path, status: response.status, payload });
      throw new CalendarApiError(message, {
        status: response.status,
        code: fault?.code || (response.status === 422 ? 'CALENDAR_VALIDATION_ERROR' : 'calendar_request_failed'),
        details,
      });
    }
    return payload?.data ?? payload;
  } catch (error) {
    if (error.name === 'AbortError') {
      const intentionallyAborted = Boolean(options.signal?.aborted);
      throw new CalendarApiError(
        intentionallyAborted ? 'Calendar request cancelled' : 'Calendar request timed out',
        { code: intentionallyAborted ? 'aborted' : 'timeout' },
      );
    }
    if (error instanceof CalendarApiError) throw error;
    throw new CalendarApiError(navigator.onLine ? 'Calendar service is not available yet' : 'You are offline', {
      code: navigator.onLine ? 'service_unavailable' : 'offline',
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

const json = (method, body, options = {}) => ({ method, body: JSON.stringify(body), ...options });

const normalizeCalendar = (item) => ({ ...item, visible: item.visible ?? item.is_visible !== false });
const normalizeEvent = (item) => ({
  ...item,
  start: item.start ?? item.start_at ?? item.start_date,
  end: item.end ?? item.end_at ?? item.end_date,
  reminder_channels: item.reminder_channels || item.reminders?.[0]?.channels || ['in_app'],
});
const normalizePreferences = (item) => ({
  ...item,
  week_starts_on: item.week_starts_on ?? (item.week_start === 'sunday' ? 0 : 1),
  hour12: item.hour12 ?? item.hour_cycle === '12',
});
const normalizeEventPayload = (draft) => {
  const payload = { ...draft };
  delete payload.id; delete payload.version; delete payload.created_at; delete payload.updated_at;
  delete payload.series_id; delete payload.occurrence_start; delete payload.original_occurrence_id; delete payload._pending;
  delete payload.start_at; delete payload.end_at; delete payload.reminders; delete payload.ical_uid;
  payload.recurrence = !payload.recurrence || payload.recurrence === 'none' ? null : payload.recurrence;
  payload.importance = payload.importance === 'low' ? 'normal' : payload.importance;
  payload.reminder_minutes = draft.reminder_minutes || (draft.reminders ? [Number(draft.reminders)] : []);
  payload.reminder_channels = draft.reminder_channels || draft.reminders?.[0]?.channels || ['in_app'];
  if (!payload.color) delete payload.color;
  if (payload.all_day) {
    payload.start_date = String(draft.start_date || draft.start).slice(0, 10);
    payload.end_date = String(draft.end_date || draft.end).slice(0, 10);
    if (payload.end_date <= payload.start_date) {
      const next = new Date(`${payload.start_date}T12:00:00`);
      next.setDate(next.getDate() + 1);
      payload.end_date = next.toISOString().slice(0, 10);
    }
    delete payload.start; delete payload.end;
  }
  return payload;
};

async function flushOfflineOutbox() {
  if (!navigator.onLine) return { queued: (readOffline().outbox || []).length };
  const state = readOffline(); const queue = [...(state.outbox || [])]; const remaining = []; const idMap = { ...(state.idMap || {}) };
  for (const entry of queue) {
    try {
      const path = entry.path.replace(/local-[^/?]+/, (id) => idMap[id] || id);
      const result = await request(path, entry.body === undefined ? { method: entry.method } : json(entry.method, entry.body));
      if (entry.localId && result?.id) idMap[entry.localId] = result.id;
    } catch { remaining.push(entry); }
  }
  writeOffline({ outbox: remaining, idMap });
  return { queued: remaining.length };
}

function offlineEvent(draft, id = `local-${crypto.randomUUID?.() || Date.now()}`) {
  const payload = normalizeEventPayload(draft);
  return normalizeEvent({ ...payload, id, version: 1, start: payload.start || payload.start_date, end: payload.end || payload.end_date, reminders: (payload.reminder_minutes || []).map((minutes_before) => ({ minutes_before, channels: payload.reminder_channels })), _pending: true });
}

export const calendarApi = {
  preferences: () => request('/preferences').then(normalizePreferences).then((value) => cacheValue('preferences', value)).catch((error) => { const cached = readOffline().preferences; if (cached) return cached; throw error; }),
  updatePreferences: (patch) => {
    const backendPatch = { ...patch };
    if ('week_starts_on' in backendPatch) { backendPatch.week_start = backendPatch.week_starts_on === 0 ? 'sunday' : 'monday'; delete backendPatch.week_starts_on; }
    if ('hour12' in backendPatch) { backendPatch.hour_cycle = backendPatch.hour12 ? '12' : '24'; delete backendPatch.hour12; }
    return request('/preferences', json('PATCH', backendPatch)).then(normalizePreferences);
  },
  calendars: () => request('/calendars').then((items) => items.map(normalizeCalendar)).then((value) => cacheValue('calendars', value)).catch((error) => { const cached = readOffline().calendars; if (cached) return cached; throw error; }),
  createCalendar: (draft) => {
    if (!navigator.onLine) { const saved = normalizeCalendar({ id: `local-${crypto.randomUUID?.() || Date.now()}`, version: 1, is_visible: true, ...draft, _pending: true }); const calendars = [...(readOffline().calendars || []), saved]; cacheValue('calendars', calendars); queueMutation({ method: 'POST', path: '/calendars', body: draft, localId: saved.id }); return Promise.resolve(saved); }
    return request('/calendars', json('POST', draft)).then(normalizeCalendar);
  },
  updateCalendar: (id, patch, version) => {
    const backendPatch = { ...patch };
    if ('visible' in backendPatch) { backendPatch.is_visible = backendPatch.visible; delete backendPatch.visible; }
    if (!navigator.onLine) { const calendars = (readOffline().calendars || []).map((item) => item.id === id ? { ...item, ...patch, _pending: true } : item); cacheValue('calendars', calendars); queueMutation({ method: 'PATCH', path: `/calendars/${id}`, body: backendPatch }); return Promise.resolve(calendars.find((item) => item.id === id)); }
    return request(`/calendars/${id}`, json('PATCH', backendPatch, version ? { headers: { 'If-Match': String(version) } } : {})).then(normalizeCalendar);
  },
  deleteCalendar: (id) => { if (!navigator.onLine) { cacheValue('calendars', (readOffline().calendars || []).filter((item) => item.id !== id)); queueMutation({ method: 'DELETE', path: `/calendars/${id}?delete_events=true` }); return Promise.resolve({ deleted_id: id, _pending: true }); } return request(`/calendars/${id}?delete_events=true`, { method: 'DELETE' }); },
  events: ({ start, end, query = '', calendars = [], signal } = {}) => {
    const params = new URLSearchParams();
    if (start) params.set('from', start);
    if (end) params.set('to', end);
    if (query) params.set('q', query);
    calendars.forEach((id) => params.append('calendar_id', id));
    return request(`/events?${params}`, { signal }).then((items) => items.map(normalizeEvent)).then((value) => {
      if (!query) cacheValue('events', value);
      return value;
    }).catch((error) => {
      if (signal?.aborted) throw error;
      const cached = readOffline().events;
      if (cached && !query) return cached;
      throw error;
    });
  },
  createEvent: (draft, idempotencyKey) => {
    if (!navigator.onLine) {
      const saved = offlineEvent(draft);
      cacheValue('events', [...(readOffline().events || []), saved]);
      queueMutation({ method: 'POST', path: '/events', body: normalizeEventPayload(draft), localId: saved.id });
      return Promise.resolve(saved);
    }
    return request('/events', json('POST', normalizeEventPayload(draft), { headers: { 'Idempotency-Key': idempotencyKey || crypto.randomUUID?.() || `${Date.now()}` } }))
      .then(normalizeEvent)
      .then((saved) => {
        cacheValue('events', [...(readOffline().events || []).filter((item) => item.id !== saved.id), saved]);
        return saved;
      });
  },
  updateEvent: (id, patch, version) => {
    if (!navigator.onLine) {
      const saved = offlineEvent(patch, id);
      cacheValue('events', (readOffline().events || []).map((item) => item.id === id ? { ...item, ...saved, version: (item.version || 0) + 1 } : item));
      queueMutation({ method: 'PATCH', path: `/events/${id}`, body: normalizeEventPayload(patch) });
      return Promise.resolve(saved);
    }
    return request(`/events/${id}`, json('PATCH', normalizeEventPayload(patch), version ? { headers: { 'If-Match': String(version) } } : {}))
      .then(normalizeEvent)
      .then((saved) => {
        cacheValue('events', (readOffline().events || []).map((item) => item.id === id ? saved : item));
        return saved;
      });
  },
  deleteEvent: (id, scope = 'series', version) => { if (!navigator.onLine) { cacheValue('events', (readOffline().events || []).filter((item) => item.id !== id)); queueMutation({ method: 'DELETE', path: `/events/${id}?scope=${scope}` }); return Promise.resolve({ deleted_id: id, _pending: true }); } return request(`/events/${id}?scope=${scope}`, { method: 'DELETE', ...(version ? { headers: { 'If-Match': String(version) } } : {}) }); },
  dueReminders: () => request('/reminders/due'),
  acknowledgeReminder: (id) => request(`/reminders/${id}/ack`, { method: 'POST' }),
  snoozeReminder: (id, minutes = 10) => request(`/reminders/${id}/snooze`, json('POST', { minutes })),
  suggestedTimes: (draft) => request('/suggested-times', json('POST', { duration_minutes: Math.max(15, Math.round((new Date(draft.end) - new Date(draft.start)) / 60000) || 60), calendar_ids: [draft.calendar_id] })),
  templates: () => request('/templates'),
  saveTemplate: (name, payload) => request('/templates', json('POST', { name, payload })),
  smartViews: () => request('/smart-views'),
  saveSmartView: (name, filters) => request('/smart-views', json('POST', { name, filters })),
  parseQuickAdd: (text) => request('/quick-add/parse', json('POST', { text })),
  commitQuickAdd: (draftId, patch) => request('/quick-add/commit', json('POST', { draft_id: draftId, patch }, { headers: { 'Idempotency-Key': crypto.randomUUID?.() || `${Date.now()}` } })),
  sync: () => request('/sync', { method: 'POST', timeout: 30000 }),
  syncStatus: () => request('/sync/status'),
  testCalDav: (settings) => request('/caldav/accounts/test', json('POST', settings, { timeout: 30000 })),
  connectCalDav: (settings) => request('/caldav/accounts', json('POST', settings, { timeout: 30000 })),
  importPreview: (file, calendarId) => {
    const body = new FormData();
    body.append('file', file);
    if (calendarId) body.append('calendar_id', calendarId);
    return request('/ics/import/preview', { method: 'POST', body, timeout: 30000 });
  },
  importCommit: (previewId, calendarId) => request('/ics/import/commit', json('POST', { import_id: previewId, calendar_id: calendarId }, { headers: { 'Idempotency-Key': crypto.randomUUID?.() || `${Date.now()}` } })),
  exportUrl: (calendarId) => calendarId ? `${API_ROOT}/ics/export/${encodeURIComponent(calendarId)}` : `${API_ROOT}/ics/export`,
  flushOfflineOutbox,
  offlineQueueSize: () => (readOffline().outbox || []).length,
  changesUrl: `${API_ROOT}/changes`,
};

export { CalendarApiError };
