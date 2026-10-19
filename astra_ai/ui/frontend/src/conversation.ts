/** One session state shared by dashboard and memory UI. */
export type ChatMessage = {
  id: string;
  role: string;
  text: string;
  status: string;
  research_id?: string;
};
const messages: ChatMessage[] = [];
const researchMessages: Record<string, ChatMessage[]> = {};
const requestResearch = new Map<string, string>();
export function conversationResearch(id: string, items?: any[]) {
  if (items) {
    const old = researchMessages[id] || [];
    const loaded = items.map((m) => ({
      id: m.turn_id
        ? (m.role === "assistant" ? "reply:" : "") + m.turn_id
        : m.id,
      role: m.role,
      text: m.content || m.text,
      status: m.status || "completed",
      research_id: id,
    }));
    const ids = new Set(loaded.map((m) => m.id));
    researchMessages[id] = [
      ...loaded,
      ...old.filter((m) => !ids.has(m.id)),
    ].slice(-200);
    changed();
  }
  return researchMessages[id] || [];
}
let loadRevision = 0,
  messageRevision = 0;
let connection = {
  connected: false,
  muted: true,
  state: "idle",
  model: "",
  clientId: "",
  sessionId: (() => {
    try {
      let id = sessionStorage.getItem("nova-conversation-session");
      if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem("nova-conversation-session", id);
      }
      return id;
    } catch {
      return crypto.randomUUID();
    }
  })(),
  status: "",
  textBusy: false,
  focusId: "",
  focusRevision: -1,
  sessionSwitching: false,
  guest: false,
  jobs: [] as Array<{
    id: string;
    state: string;
    completed: number;
    total: number;
    sequence?: number;
    title?: string;
    step?: string;
  }>,
  sources: [] as Array<{ title: string; url: string }>,
};
export function conversationSnapshot() {
  return {
    messages: [...messages],
    researchMessages: { ...researchMessages },
    ...connection,
  };
}
function changed() {
  window.dispatchEvent(
    new CustomEvent("nova-conversation", { detail: conversationSnapshot() }),
  );
}
export function conversationState(update: Partial<typeof connection>) {
  const scopeChanged =
    (update.guest !== undefined && update.guest !== connection.guest) ||
    (update.clientId !== undefined && update.clientId !== connection.clientId);
  if (scopeChanged) {
    for (const key of Object.keys(researchMessages))
      delete researchMessages[key];
    requestResearch.clear();
    updateUiContext({research_id:"",research_revision:"",thread_id:"",recent_research_id:""});
  }
  connection = {
    ...connection,
    ...update,
    ...(scopeChanged ? { jobs: [], focusId:"",focusRevision:-1 } : {}),
  };
  changed();
}
export function conversationMessage(
  role: string,
  text: string,
  status = "completed",
  id: string = crypto.randomUUID(),
  researchId?: string,
) {
  const target =
    researchId === undefined
      ? requestResearch.get(id) ||
        requestResearch.get(id.replace(/^reply:/, "")) ||
        ""
      : researchId;
  const rows = target ? (researchMessages[target] ??= []) : messages;
  messageRevision++;
  const old = rows.find((m) => m.id === id);
  if (old) Object.assign(old, { text, status });
  else rows.push({ id, role, text, status, research_id: target });
  if (rows.length > 200) rows.splice(0, rows.length - 200);
  changed();
  return id;
}
export function requestConversation(
  text: string,
  id: string = crypto.randomUUID(),
) {
  const research_id =
    snapshot.view === "research" ? String(snapshot.research_id || "") : "";
  requestResearch.set(id, research_id);
  window.dispatchEvent(
    new CustomEvent("nova-chat-send", {
      detail: { text, request_id: id, research_id, selection_revision:snapshot.selection_revision||0 },
    }),
  );
}
export function requestMicrophone() {
  window.dispatchEvent(new Event("nova-chat-microphone"));
}
let uiRevision = 0;
let snapshot: Record<string, unknown> = {
  version: 1,
  view: "dashboard",
  widgets: [],
};
export function uiSnapshot() {
  return snapshot;
}
export function updateUiContext(update: Record<string, unknown>) {
  if ((update.view !== undefined && update.view !== snapshot.view) || (update.research_id !== undefined && update.research_id !== snapshot.research_id)) {
    update = {...update, selection_revision:Number(snapshot.selection_revision||0)+1};
  }
  if (update.view === "research" && update.research_id) update={...update,recent_research_id:update.research_id};
  snapshot = { ...snapshot, ...update, version: 1, revision: ++uiRevision };
  window.dispatchEvent(
    new CustomEvent("nova-ui-context", { detail: snapshot }),
  );
}

export function conversationReplace(items: ChatMessage[], sessionId: string) {
  messages.splice(0, messages.length, ...items);
  connection.sessionId = sessionId;
  try {
    sessionStorage.setItem("nova-conversation-session", sessionId);
  } catch {}
  changed();
}
export async function conversationLoad(sessionId: string) {
  const request = ++loadRevision,
    revision = messageRevision;
  const r = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "get", session_id: sessionId }),
  });
  const d = await r.json();
  if (!r.ok || d.status !== "ok")
    throw new Error(d.reason || "Conversation unavailable");
  if (request !== loadRevision) return d;
  const loaded = (d.messages || []).map((m: any) => ({
    id: m.id,
    role: m.role,
    text: m.content,
    status: m.status || "completed",
  }));
  if (connection.sessionId === sessionId && revision !== messageRevision) {
    const ids = new Set(loaded.map((m: ChatMessage) => m.id));
    loaded.push(...messages.filter((m) => !ids.has(m.id)));
  }
  conversationReplace(loaded, sessionId);
  return d;
}
export function conversationDraft(sessionId: string, value?: string) {
  try {
    const key = "nova-draft-" + sessionId;
    if (value !== undefined) sessionStorage.setItem(key, value);
    return sessionStorage.getItem(key) || "";
  } catch {
    return value || "";
  }
}

export function conversationInterrupt() {
  for (const m of messages)
    if (m.status === "streaming" || m.status === "pending")
      m.status = "interrupted";
  changed();
}

/** Notification preferences do not affect microphone or assistant playback. */
export function notificationSoundEnabled() {
  try {
    return localStorage.getItem("nova-notification-sound") !== "off";
  } catch {
    return true;
  }
}
export function setNotificationSound(enabled: boolean) {
  try {
    localStorage.setItem("nova-notification-sound", enabled ? "on" : "off");
  } catch {}
  window.dispatchEvent(
    new CustomEvent("nova-notification-sound", { detail: { enabled } }),
  );
}
export function notificationTarget(item: { kind?: string; target?: string }) {
  return {
    view: item.kind === "approval" ? "approvals" : "tasks",
    id: String(item.target || ""),
  };
}
export function newNoticeIds<T extends { id: string }>(
  items: T[],
  seen: Set<string>,
): T[] {
  const fresh: T[] = [];
  for (const item of items.slice(-128)) {
    if (!seen.has(item.id)) {
      fresh.push(item);
      seen.add(item.id);
    }
  }
  while (seen.size > 128) seen.delete(seen.values().next().value!);
  return fresh;
}
