export type AegisWidgetConnectionState = 'disconnected' | 'connected' | 'working' | 'failed';

type Connection = {
  connectionId: string;
  revision: number;
  observer?: MutationObserver;
  debounce?: number;
  root?: HTMLElement;
};

const connections = new Map<string, Connection>();
const controlIds = new WeakMap<Element, string>();
const semanticStates = new Map<string, Record<string, unknown>>();
const eventTimers = new Map<string, number>();

const INTERACTIVE = 'button,input,textarea,select,a,[role="button"],[tabindex]';
const SECRET_HINT = /password|secret|token|credential|api[-_ ]?key|webhook/i;
const MAX_CONTROLS = 80;
const MAX_TEXT = 1600;
const MAX_FIELD = 600;

const clean = (value: unknown, limit = 160) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, limit);
const isVisible = (element: Element) => {
  const node = element as HTMLElement;
  const style = window.getComputedStyle(node);
  return style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length > 0;
};

const labelFor = (element: Element) => {
  const node = element as HTMLElement;
  const labelledBy = node.getAttribute('aria-labelledby');
  const labelled = labelledBy
    ? labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ')
    : '';
  const input = element as HTMLInputElement;
  return clean(
    node.getAttribute('aria-label') || labelled || node.getAttribute('title') ||
    input.labels?.[0]?.textContent || input.placeholder || node.textContent || input.name || input.id || element.tagName,
    120,
  );
};

const isSecret = (element: Element) => {
  const input = element as HTMLInputElement;
  return input.type === 'password' || SECRET_HINT.test([
    input.name, input.id, input.placeholder, element.getAttribute('aria-label'), element.getAttribute('autocomplete'),
  ].filter(Boolean).join(' '));
};

const controlIdFor = (element: Element) => {
  const existing = controlIds.get(element);
  if (existing) return existing;
  const input = element as HTMLInputElement;
  const root = element.closest<HTMLElement>('[data-aegis-widget]');
  const widget = root?.dataset.aegisWidget || 'widget';
  const semantic = clean(input.name || input.id || labelFor(element) || element.tagName, 70)
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'control';
  const peers = root ? Array.from(root.querySelectorAll(INTERACTIVE)).filter((candidate) => {
    const candidateInput = candidate as HTMLInputElement;
    const key = clean(candidateInput.name || candidateInput.id || labelFor(candidate) || candidate.tagName, 70)
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'control';
    return key === semantic;
  }) : [element];
  const duplicate = Math.max(0, peers.indexOf(element));
  const id = `${widget}:${semantic}${duplicate ? `:${duplicate + 1}` : ''}`;
  controlIds.set(element, id);
  (element as HTMLElement).dataset.aegisControlId = id;
  return id;
};

const controlDescription = (element: Element) => {
  const input = element as HTMLInputElement;
  const secret = isSecret(element);
  const description: Record<string, unknown> = {
    control_id: controlIdFor(element),
    kind: element.tagName.toLowerCase(),
    label: labelFor(element),
    disabled: Boolean(input.disabled || element.getAttribute('aria-disabled') === 'true'),
  };
  if ('type' in input) description.input_type = secret ? 'redacted' : input.type;
  if (!secret && ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
    description.value = clean(input.value, MAX_FIELD);
  }
  if (element.hasAttribute('aria-pressed')) description.pressed = element.getAttribute('aria-pressed') === 'true';
  if (element.hasAttribute('aria-selected')) description.selected = element.getAttribute('aria-selected') === 'true';
  return description;
};

const rootFor = (widget: string) => document.querySelector<HTMLElement>(`[data-aegis-widget="${CSS.escape(widget)}"]`);

const inventory = (root: HTMLElement) => Array.from(root.querySelectorAll(INTERACTIVE))
  .filter((element) => isVisible(element) && !isSecret(element))
  .slice(0, MAX_CONTROLS)
  .map(controlDescription);

const emit = (widget: string, event: string, target: Record<string, unknown> = {}, data: Record<string, unknown> = {}) => {
  const connection = connections.get(widget);
  if (!connection) return;
  connection.revision += 1;
  window.dispatchEvent(new CustomEvent('aegisWidgetTelemetry', { detail: {
    type: 'widget_telemetry',
    protocol_version: 2,
    event_id: crypto.randomUUID?.() || `evt-${Date.now()}-${connection.revision}`,
    widget,
    connection_id: connection.connectionId,
    state_revision: connection.revision,
    occurred_at: new Date().toISOString(),
    event,
    target,
    data,
    privacy: { scope: 'connected_widget', secrets: 'redacted', text_limit: MAX_FIELD },
  }}));
};

const coalescedEmit = (widget: string, event: string, target: Record<string, unknown>, data: Record<string, unknown>, delay = 140) => {
  const key = `${widget}:${event}:${String(target.control_id || '')}`;
  window.clearTimeout(eventTimers.get(key));
  eventTimers.set(key, window.setTimeout(() => {
    eventTimers.delete(key);
    emit(widget, event, target, data);
  }, delay));
};

const snapshot = (widget: string, reason = 'connected') => {
  const root = rootFor(widget);
  const connection = connections.get(widget);
  if (!connection) return;
  if (!root) {
    emit(widget, 'snapshot', {}, { visibility: 'closed', reason, controls: [], visible_text: '' });
    return;
  }
  connection.root = root;
  root.dataset.aegisConnection = 'connected';
  root.classList.add('aegis-connected');
  emit(widget, 'snapshot', {}, {
    visibility: 'open', reason,
    visible_text: clean(root.innerText, MAX_TEXT),
    controls: inventory(root),
    semantic_state: semanticStates.get(widget) || {},
  });
};

const queueSnapshot = (widget: string, reason: string) => {
  const connection = connections.get(widget);
  if (!connection) return;
  window.clearTimeout(connection.debounce);
  connection.debounce = window.setTimeout(() => snapshot(widget, reason), 180);
};

const bindRoot = (widget: string) => {
  const connection = connections.get(widget);
  if (!connection) return;
  const root = rootFor(widget);
  if (!root || root === connection.root) return;
  connection.observer?.disconnect();
  connection.root = root;
  root.dataset.aegisConnection = 'connected';
  root.classList.add('aegis-connected');
  connection.observer = new MutationObserver(() => queueSnapshot(widget, 'state_changed'));
  connection.observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-selected', 'aria-pressed', 'aria-busy', 'class', 'value'] });
  snapshot(widget, 'mounted');
};

const documentObserver = new MutationObserver(() => connections.forEach((_connection, widget) => bindRoot(widget)));
documentObserver.observe(document.documentElement, { subtree: true, childList: true });

const scopedEvent = (event: Event, kind: string) => {
  const element = (event.target as Element | null)?.closest?.(INTERACTIVE);
  const root = element?.closest<HTMLElement>('[data-aegis-widget]');
  const widget = root?.dataset.aegisWidget;
  if (!element || !root || !widget || !connections.has(widget) || isSecret(element)) return;
  const data: Record<string, unknown> = {};
  if ((kind === 'input_changed' || kind === 'draft_changed') && ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
    data.value = clean((element as HTMLInputElement).value, MAX_FIELD);
  }
  coalescedEmit(widget, kind, { control_id: controlIdFor(element), label: labelFor(element) }, data, kind === 'semantic_hover' ? 240 : 120);
};

document.addEventListener('focusin', (event) => scopedEvent(event, 'semantic_focus'), true);
document.addEventListener('pointerover', (event) => scopedEvent(event, 'semantic_hover'), true);
document.addEventListener('click', (event) => scopedEvent(event, 'control_activated'), true);
document.addEventListener('input', (event) => scopedEvent(event, 'draft_changed'), true);
document.addEventListener('change', (event) => scopedEvent(event, 'input_changed'), true);

window.addEventListener('aegisWidgetSemanticState', (event: Event) => {
  const detail = (event as CustomEvent).detail || {};
  const widget = clean(detail.widget, 40);
  const state = detail.state && typeof detail.state === 'object' ? detail.state as Record<string, unknown> : {};
  if (!widget) return;
  const previous = semanticStates.get(widget) || {};
  semanticStates.set(widget, state);
  if (!connections.has(widget)) return;
  if (previous.active_tab !== state.active_tab) coalescedEmit(widget, 'view_changed', {}, { active_tab: state.active_tab }, 80);
  if (previous.selected_note_id !== state.selected_note_id) coalescedEmit(widget, 'selection_changed', {}, { selected_note_id: state.selected_note_id }, 80);
  if (JSON.stringify(previous.ai_workspace) !== JSON.stringify(state.ai_workspace)) coalescedEmit(widget, 'ai_workspace_changed', {}, { ai_workspace: state.ai_workspace }, 140);
  coalescedEmit(widget, 'semantic_state', {}, state, 160);
});

export const connectAegisWidget = (widget: string, connectionId?: string) => {
  disconnectAegisWidget(widget, false);
  const id = connectionId || crypto.randomUUID?.() || `${widget}-${Date.now()}`;
  connections.set(widget, { connectionId: id, revision: 0 });
  bindRoot(widget);
  if (!rootFor(widget)) snapshot(widget);
  return id;
};

export const disconnectAegisWidget = (widget: string, emitEvent = true) => {
  const connection = connections.get(widget);
  connection?.observer?.disconnect();
  window.clearTimeout(connection?.debounce);
  const root = rootFor(widget) || connection?.root;
  root?.classList.remove('aegis-connected', 'aegis-working', 'aegis-failed');
  root?.removeAttribute('data-aegis-connection');
  if (emitEvent && connection) emit(widget, 'disconnected', {}, { visibility: rootFor(widget) ? 'open' : 'closed' });
  connections.delete(widget);
  Array.from(eventTimers.entries()).forEach(([key, timer]) => {
    if (!key.startsWith(`${widget}:`)) return;
    window.clearTimeout(timer);
    eventTimers.delete(key);
  });
};

export const notifyAegisWidgetVisibility = (widget: string, visibility: 'open' | 'closed' | 'minimized') => {
  if (!connections.has(widget)) return;
  emit(widget, 'window_visibility', {}, { visibility });
  if (visibility === 'open') window.setTimeout(() => bindRoot(widget), 0);
};

export const interactWithAegisWidget = (widget: string, payload: Record<string, unknown>) => {
  const root = rootFor(widget);
  if (!root) throw new Error(`${widget} widget is not mounted.`);
  const id = clean(payload.control_id, 120);
  const element = Array.from(root.querySelectorAll<HTMLElement>(INTERACTIVE))
    .find((candidate) => controlIdFor(candidate) === id);
  if (!element || !root.contains(element)) throw new Error('Control is unavailable in the requested widget.');
  if (isSecret(element)) throw new Error('Secret controls cannot be observed or operated.');
  const action = clean(payload.action, 40);
  const input = element as HTMLInputElement;
  if (action === 'activate') element.click();
  else if (action === 'focus') element.focus();
  else if (action === 'scroll_into_view') element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  else if (action === 'toggle') {
    if (input.type === 'checkbox' || input.type === 'radio') element.click();
    else element.setAttribute('aria-pressed', element.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
  } else if (['set_value', 'append_value', 'select'].includes(action)) {
    if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) throw new Error('This control does not accept a value.');
    const value = clean(payload.value, MAX_FIELD);
    const next = action === 'append_value' ? `${input.value}${value}` : value;
    const prototype = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype
      : element.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(input, next);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else throw new Error(`Unsupported interaction: ${action}`);
  return { control_id: id, action, label: labelFor(element) };
};

export const refreshAegisWidgetSnapshot = (widget: string) => snapshot(widget, 'requested');
