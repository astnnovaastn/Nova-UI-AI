const API_ROOT = '/api/tasks/v1';
const CACHE_KEY = 'astra-task-cache-v1';

export class TaskApiError extends Error {
  constructor(message, { status = 0, code = 'TASK_REQUEST_FAILED', details = null } = {}) {
    super(message);
    this.name = 'TaskApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeout || 15000);
  try {
    const response = await fetch(`${API_ROOT}${path}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const fault = payload?.detail?.error || payload?.error;
      throw new TaskApiError(fault?.message || `Task request failed (${response.status})`, {
        status: response.status,
        code: fault?.code,
        details: fault?.details,
      });
    }
    return payload?.data ?? payload;
  } catch (error) {
    if (error.name === 'AbortError') throw new TaskApiError('Task request timed out', { code: 'TIMEOUT' });
    if (error instanceof TaskApiError) throw error;
    throw new TaskApiError(navigator.onLine ? 'Tasks service is not available' : 'You are offline', {
      code: navigator.onLine ? 'SERVICE_UNAVAILABLE' : 'OFFLINE',
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

const json = (method, body, headers = {}) => ({ method, body: JSON.stringify(body), headers });
const idempotencyKey = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

export const taskApi = {
  dashboard: async () => {
    try {
      const dashboard = await request('/dashboard');
      localStorage.setItem(CACHE_KEY, JSON.stringify(dashboard));
      return dashboard;
    } catch (error) {
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached) return { ...cached, offline: true };
      } catch { /* ignore corrupt cache */ }
      throw error;
    }
  },
  create: (draft) => request('/tasks', json('POST', draft, { 'Idempotency-Key': idempotencyKey() })),
  update: (id, patch, version) => request(`/tasks/${encodeURIComponent(id)}`, json('PATCH', patch, version ? { 'If-Match': String(version) } : {})),
  remove: (id) => request(`/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  run: (id) => request(`/tasks/${encodeURIComponent(id)}/run`, { method: 'POST' }),
  runControl: (runId, action) => request(`/runs/${encodeURIComponent(runId)}/${action}`, { method: 'POST' }),
  decideApproval: (approvalId, decision, note = '') => request(`/approvals/${encodeURIComponent(approvalId)}/decision`, json('POST', { decision, note })),
  activity: (cursor = 0) => request(`/activity?cursor=${Math.max(0, Number(cursor) || 0)}`),
  subscribe: (onChange, onStatus) => {
    const source = new EventSource(`${API_ROOT}/changes`);
    source.addEventListener('ready', () => onStatus?.('online'));
    source.addEventListener('task-change', (event) => {
      try { onChange?.(JSON.parse(event.data)); } catch { /* reconnect will rehydrate */ }
    });
    source.onerror = () => onStatus?.('reconnecting');
    return () => source.close();
  },
};

const RUN_STATUS = {
  running: 'running',
  pausing: 'paused',
  paused: 'paused',
  waiting_approval: 'waiting',
  waiting_input: 'waiting',
  queued: 'queued',
  succeeded: 'completed',
  failed: 'failed',
  cancelled: 'queued',
  interrupted: 'failed',
};

export function toWidgetTask(item) {
  const run = item.latest_run;
  const status = run ? (RUN_STATUS[run.status] || item.lifecycle) : (
    item.lifecycle === 'active' ? 'queued' : item.lifecycle
  );
  const trigger = item.trigger || {};
  const triggerLabel = trigger.kind === 'schedule'
    ? trigger.schedule || 'Scheduled'
    : trigger.kind === 'event'
      ? `${trigger.event_name || 'Event'} · every ${trigger.every_count || 1}`
      : trigger.kind === 'webhook'
        ? 'Secure webhook'
        : item.source === 'aegis' ? 'Manual · Aegis chat' : 'Manual';
  return {
    id: item.id,
    title: item.title,
    instruction: item.instruction,
    type: item.kind,
    status,
    progress: run?.progress || (status === 'completed' ? 100 : 0),
    priority: item.priority,
    trigger: triggerLabel,
    tags: item.tags || [],
    due: item.due_at ? new Date(item.due_at).toLocaleString() : status === 'completed' ? 'Completed' : 'No due date',
    currentStep: run?.current_step || '',
    checklist: (item.checklist || []).map((entry) => typeof entry === 'string' ? { text: entry, done: false } : entry),
    runs: run ? [{ time: new Date(run.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: run.status, detail: run.current_step || run.error || 'Run updated' }] : [],
    version: item.version,
    latestRunId: run?.id,
    remote: true,
    raw: item,
  };
}

export function toWidgetActivity(event) {
  const kind = event.type.includes('failed') ? 'error'
    : event.type.includes('approval') ? 'approval'
      : event.type.includes('succeeded') || event.type.includes('completed') ? 'success'
        : 'progress';
  return {
    id: event.id || event.cursor,
    time: new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    kind,
    title: event.message || event.type.replaceAll('.', ' '),
    detail: event.payload?.current_step || event.type,
    taskId: event.task_id,
  };
}

export function composerPayload(form, triggerId, draft = false) {
  const [kindPart] = triggerId.split('_');
  const kind = triggerId === 'webhook' ? 'action' : kindPart;
  const triggerKind = triggerId === 'webhook'
    ? 'webhook'
    : triggerId.endsWith('_schedule') ? 'schedule' : 'event';
  const trigger = {
    kind: triggerKind,
    timezone: form.timezone,
    enabled: !draft,
    ...(triggerKind === 'schedule' ? { schedule: form.schedule } : {}),
    ...(triggerKind === 'event' ? { event_name: form.eventType, every_count: Number(form.eventCount) || 1 } : {}),
  };
  return {
    title: form.title.trim(),
    instruction: form.instruction.trim(),
    kind,
    priority: form.priority.toLowerCase(),
    tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    due_at: form.due ? new Date(form.due).toISOString() : null,
    timezone: form.timezone,
    trigger,
    lifecycle: draft ? 'draft' : 'active',
  };
}
