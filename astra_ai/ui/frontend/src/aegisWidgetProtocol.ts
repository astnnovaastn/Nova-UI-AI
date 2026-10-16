import {confirmOwner} from './notifications';
export type AegisWidgetConnectionState =
  "disconnected" | "connected" | "working" | "failed";

type Connection = {
  connectionId: string;
  revision: number;
  observer?: MutationObserver;
  debounce?: number;
  root?: HTMLElement;
};

const connections = new Map<string, Connection>();
const richEditors = new WeakMap<
  HTMLElement,
  (value: string, append: boolean) => void
>();
export function registerRichEditor(
  element: HTMLElement,
  apply: (value: string, append: boolean) => void,
) {
  richEditors.set(element, apply);
  return () => {
    richEditors.delete(element);
  };
}
const controlIds = new WeakMap<Element, string>();
const semanticStates = new Map<string, Record<string, unknown>>();
const eventTimers = new Map<string, number>();

const INTERACTIVE =
  'button,input,textarea,select,a,[role="button"],[tabindex],[data-aegis-scroll],[contenteditable="true"]';
const SECRET_HINT = /password|secret|token|credential|api[-_ ]?key|webhook/i;
const MAX_CONTROLS = 80;
const MAX_TEXT = 1600;
const MAX_FIELD = 600;

const clean = (value: unknown, limit = 160) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
const isVisible = (element: Element) => {
  const node = element as HTMLElement;
  const style = window.getComputedStyle(node);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    node.getClientRects().length > 0
  );
};

const labelFor = (element: Element) => {
  const node = element as HTMLElement;
  const labelledBy = node.getAttribute("aria-labelledby");
  const labelled = labelledBy
    ? labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent || "")
        .join(" ")
    : "";
  const input = element as HTMLInputElement;
  return clean(
    node.getAttribute("aria-label") ||
      labelled ||
      node.getAttribute("title") ||
      input.labels?.[0]?.textContent ||
      input.placeholder ||
      node.textContent ||
      input.name ||
      input.id ||
      element.tagName,
    120,
  );
};

const isSecret = (element: Element) => {
  const input = element as HTMLInputElement;
  return (
    input.type === "password" ||
    SECRET_HINT.test(
      [
        input.name,
        input.id,
        input.placeholder,
        element.getAttribute("aria-label"),
        element.getAttribute("autocomplete"),
      ]
        .filter(Boolean)
        .join(" "),
    )
  );
};

let peerInventory: Map<Element, Map<string, Element[]>> | null = null;
const semanticKey = (element: Element) => {
  const input = element as HTMLInputElement;
  return (
    clean(input.name || input.id || labelFor(element) || element.tagName, 70)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "control"
  );
};
const controlIdFor = (element: Element) => {
  const existing = controlIds.get(element);
  if (existing) return existing;
  const input = element as HTMLInputElement;
  const root =
    element.closest<HTMLElement>("[data-aegis-widget]") || document.body;
  const widget = root?.dataset.aegisWidget || "widget";
  const semantic =
    clean(input.name || input.id || labelFor(element) || element.tagName, 70)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "control";
  let groups = peerInventory?.get(root);
  if (!groups) {
    groups = new Map();
    for (const candidate of root.querySelectorAll(INTERACTIVE)) {
      const key = semanticKey(candidate);
      const group = groups.get(key) || [];
      group.push(candidate);
      groups.set(key, group);
    }
    peerInventory?.set(root, groups);
  }
  const peers = groups.get(semantic) || [element];
  const duplicate = Math.max(0, peers.indexOf(element));
  const id = `${widget}:${semantic}${duplicate ? `:${duplicate + 1}` : ""}`;
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
    disabled: Boolean(
      input.disabled || element.getAttribute("aria-disabled") === "true",
    ),
  };
  if ("type" in input)
    description.input_type = secret ? "redacted" : input.type;
  if (!secret && ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName)) {
    description.value = clean(input.value, MAX_FIELD);
  }
  if ((element as HTMLElement).isContentEditable)
    description.value = clean(element.textContent, MAX_FIELD);
  if (element.hasAttribute("aria-pressed"))
    description.pressed = element.getAttribute("aria-pressed") === "true";
  if (element.hasAttribute("aria-selected"))
    description.selected = element.getAttribute("aria-selected") === "true";
  return description;
};

const rootFor = (widget: string) =>
  document.querySelector<HTMLElement>(
    `[data-aegis-widget="${CSS.escape(widget)}"]`,
  );

const inventory = (root: HTMLElement) =>
  Array.from(root.querySelectorAll(INTERACTIVE))
    .filter((element) => isVisible(element) && !isSecret(element))
    .slice(0, MAX_CONTROLS)
    .map(controlDescription);

const emit = (
  widget: string,
  event: string,
  target: Record<string, unknown> = {},
  data: Record<string, unknown> = {},
) => {
  const connection = connections.get(widget);
  if (!connection) return;
  connection.revision += 1;
  window.dispatchEvent(
    new CustomEvent("aegisWidgetTelemetry", {
      detail: {
        type: "widget_telemetry",
        protocol_version: 2,
        event_id:
          crypto.randomUUID?.() || `evt-${Date.now()}-${connection.revision}`,
        widget,
        connection_id: connection.connectionId,
        state_revision: connection.revision,
        occurred_at: new Date().toISOString(),
        event,
        target,
        data,
        privacy: {
          scope: "connected_widget",
          secrets: "redacted",
          text_limit: MAX_FIELD,
        },
      },
    }),
  );
};

const coalescedEmit = (
  widget: string,
  event: string,
  target: Record<string, unknown>,
  data: Record<string, unknown>,
  delay = 140,
) => {
  const key = `${widget}:${event}:${String(target.control_id || "")}`;
  window.clearTimeout(eventTimers.get(key));
  eventTimers.set(
    key,
    window.setTimeout(() => {
      eventTimers.delete(key);
      emit(widget, event, target, data);
    }, delay),
  );
};

const snapshot = (widget: string, reason = "connected") => {
  const root = rootFor(widget);
  const connection = connections.get(widget);
  if (!connection) return;
  if (!root) {
    emit(
      widget,
      "snapshot",
      {},
      { visibility: "closed", reason, controls: [], visible_text: "" },
    );
    return;
  }
  connection.root = root;
  root.dataset.aegisConnection = "connected";
  root.classList.add("aegis-connected");
  emit(
    widget,
    "snapshot",
    {},
    {
      visibility: "open",
      reason,
      visible_text: clean(root.innerText, MAX_TEXT),
      controls: inventory(root),
      semantic_state: semanticStates.get(widget) || {},
    },
  );
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
  root.dataset.aegisConnection = "connected";
  root.classList.add("aegis-connected");
  connection.observer = new MutationObserver(() =>
    queueSnapshot(widget, "state_changed"),
  );
  connection.observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [
      "aria-selected",
      "aria-pressed",
      "aria-busy",
      "class",
      "value",
    ],
  });
  snapshot(widget, "mounted");
};

const documentObserver = new MutationObserver(() =>
  connections.forEach((_connection, widget) => bindRoot(widget)),
);
documentObserver.observe(document.documentElement, {
  subtree: true,
  childList: true,
});

const scopedEvent = (event: Event, kind: string) => {
  const element = (event.target as Element | null)?.closest?.(INTERACTIVE);
  const root = element?.closest<HTMLElement>("[data-aegis-widget]");
  const widget = root?.dataset.aegisWidget;
  if (
    !element ||
    !root ||
    !widget ||
    !connections.has(widget) ||
    isSecret(element)
  )
    return;
  const data: Record<string, unknown> = {};
  if (
    (kind === "input_changed" || kind === "draft_changed") &&
    ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName)
  ) {
    data.value = clean((element as HTMLInputElement).value, MAX_FIELD);
  }
  coalescedEmit(
    widget,
    kind,
    { control_id: controlIdFor(element), label: labelFor(element) },
    data,
    kind === "semantic_hover" ? 240 : 120,
  );
};

document.addEventListener(
  "focusin",
  (event) => scopedEvent(event, "semantic_focus"),
  true,
);
document.addEventListener(
  "pointerover",
  (event) => scopedEvent(event, "semantic_hover"),
  true,
);
document.addEventListener(
  "click",
  (event) => scopedEvent(event, "control_activated"),
  true,
);
document.addEventListener(
  "input",
  (event) => scopedEvent(event, "draft_changed"),
  true,
);
document.addEventListener(
  "change",
  (event) => scopedEvent(event, "input_changed"),
  true,
);

window.addEventListener("aegisWidgetSemanticState", (event: Event) => {
  const detail = (event as CustomEvent).detail || {};
  const widget = clean(detail.widget, 40);
  const state =
    detail.state && typeof detail.state === "object"
      ? (detail.state as Record<string, unknown>)
      : {};
  if (!widget) return;
  const previous = semanticStates.get(widget) || {};
  semanticStates.set(widget, state);
  if (!connections.has(widget)) return;
  if (previous.active_tab !== state.active_tab)
    coalescedEmit(
      widget,
      "view_changed",
      {},
      { active_tab: state.active_tab },
      80,
    );
  if (previous.selected_note_id !== state.selected_note_id)
    coalescedEmit(
      widget,
      "selection_changed",
      {},
      { selected_note_id: state.selected_note_id },
      80,
    );
  if (
    JSON.stringify(previous.ai_workspace) !== JSON.stringify(state.ai_workspace)
  )
    coalescedEmit(
      widget,
      "ai_workspace_changed",
      {},
      { ai_workspace: state.ai_workspace },
      140,
    );
  coalescedEmit(widget, "semantic_state", {}, state, 160);
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
  root?.classList.remove("aegis-connected", "aegis-working", "aegis-failed");
  root?.removeAttribute("data-aegis-connection");
  if (emitEvent && connection)
    emit(
      widget,
      "disconnected",
      {},
      { visibility: rootFor(widget) ? "open" : "closed" },
    );
  connections.delete(widget);
  Array.from(eventTimers.entries()).forEach(([key, timer]) => {
    if (!key.startsWith(`${widget}:`)) return;
    window.clearTimeout(timer);
    eventTimers.delete(key);
  });
};

export const notifyAegisWidgetVisibility = (
  widget: string,
  visibility: "open" | "closed" | "minimized",
) => {
  if (!connections.has(widget)) return;
  emit(widget, "window_visibility", {}, { visibility });
  if (visibility === "open") window.setTimeout(() => bindRoot(widget), 0);
};

export const interactWithAegisWidget = (
  widget: string,
  payload: Record<string, unknown>,
) => {
  const root = rootFor(widget);
  if (!root) throw new Error(`${widget} widget is not mounted.`);
  const id = clean(payload.control_id, 120);
  const element = Array.from(
    root.querySelectorAll<HTMLElement>(INTERACTIVE),
  ).find((candidate) => controlIdFor(candidate) === id);
  if (!element || !root.contains(element))
    throw new Error("Control is unavailable in the requested widget.");
  if (
    !isVisible(element) ||
    (element as HTMLInputElement).disabled ||
    element.getAttribute("aria-disabled") === "true"
  )
    throw new Error("Control is hidden or disabled.");
  if (isSecret(element))
    throw new Error("Secret controls cannot be observed or operated.");
  if(/\b(approve|reject|delete|forget|erase|reset|discard|clear all|remove)\b/i.test(labelFor(element)))throw new Error("Use the validated decision or revision-bound application control for this action.");
  const action = clean(payload.action, 40);
  const input = element as HTMLInputElement;
  if (action === "activate") element.click();
  else if (action === "focus") element.focus();
  else if (action === "scroll_into_view")
    element.scrollIntoView({ behavior: "smooth", block: "nearest" });
  else if (action === "toggle") {
    if (input.type === "checkbox" || input.type === "radio") element.click();
    else if (element.matches('button,[role="button"]')) element.click();
    else throw new Error("This control does not support toggling.");
  } else if (["set_value", "append_value", "select"].includes(action)) {
    if (!["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName))
      throw new Error("This control does not accept a value.");
    const value = clean(payload.value, MAX_FIELD);
    const next = action === "append_value" ? `${input.value}${value}` : value;
    const prototype =
      element.tagName === "TEXTAREA"
        ? HTMLTextAreaElement.prototype
        : element.tagName === "SELECT"
          ? HTMLSelectElement.prototype
          : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(input, next);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  } else throw new Error(`Unsupported interaction: ${action}`);
  return { control_id: id, action, label: labelFor(element),status:["set_value","append_value","select","focus"].includes(action)?"completed":"unconfirmed" };
};

/** Paginated application discovery uses the same control IDs as widget telemetry. */
export function applicationControls(offset = 0, limit = 60, query = "") {
  if(document.querySelector('.nova-owner-confirmation[open]'))return {status:'waiting_for_ui',revision:'owner-confirmation',total:0,controls:[],next_offset:null};
  for (const e of document.querySelectorAll<HTMLElement>(
    ".memory-chat-messages,.memory-library-content,.memory-history,.research-reader,.research-outline,.research-sources,.research-chat,.research-editor,.settings-content",
  )) {
    e.setAttribute("data-aegis-scroll", "true");
    if (!e.getAttribute("aria-label"))
      e.setAttribute(
        "aria-label",
        e.classList[0].replace(/-/g, " ") + " scroll area",
      );
  }
  const elements = Array.from(
    document.body.querySelectorAll<HTMLElement>(INTERACTIVE),
  ).filter(
    (e) =>
      isVisible(e) && !isSecret(e) && !e.closest(".nova-owner-confirmation"),
  );
  peerInventory = new Map();
  const rows = elements.map(controlDescription);
  peerInventory = null;
  let hash = 2166136261;
  for (const char of JSON.stringify(rows)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const filtered = rows.filter(
    (r) =>
      !query || String(r.label).toLowerCase().includes(query.toLowerCase()),
  );
  return {
    status: "completed",
    revision: String(hash >>> 0),
    total: filtered.length,
    controls: filtered.slice(
      Math.max(0, offset),
      Math.max(0, offset) + Math.max(1, Math.min(80, limit)),
    ),
    next_offset: offset + limit < filtered.length ? offset + limit : null,
  };
}
function observed(element: HTMLElement) {
  const input = element as HTMLInputElement;
  return {
    connected: element.isConnected,
    visible: element.isConnected && isVisible(element),
    value: element.isContentEditable
      ? element.textContent?.slice(0, 8000)
      : ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName)
        ? input.value
        : undefined,
    pressed: element.getAttribute("aria-pressed"),
    expanded: element.getAttribute("aria-expanded"),
    selected: element.getAttribute("aria-selected"),
    checked: input.checked,
    mediaPlaying:
      element.closest<HTMLElement>(".research-video")?.dataset.playing,
    scrollTop: element.scrollTop,
    scrollLeft: element.scrollLeft,
  };
}
export async function applicationControl(payload: Record<string, unknown>) {
  const action = String(payload.action || "");
  if (action === "discover" || action === "snapshot")
    return applicationControls(
      Number(payload.offset) || 0,
      Number(payload.limit) || 60,
      String(payload.query || ""),
    );
  if (action === "workspace") {
    const view = String(payload.workspace);
    if (!["dashboard", "memory", "research"].includes(view))
      throw Error("Unknown workspace");
    window.dispatchEvent(
      new CustomEvent("nova-open-" + view, {
        detail: { research_id: payload.research_id },
      }),
    );
    await new Promise((r) => setTimeout(r, 120));
    const visible =
      view === "dashboard"
        ? !document.body.matches(
            ".memory-workspace-open,.research-workspace-open",
          )
        : document.body.classList.contains(view + "-workspace-open");
    return {
      status: visible ? "completed" : "unconfirmed",
      observed: { workspace: view, visible },
      revision: applicationControls().revision,
    };
  }
  if (action !== "invoke") throw Error("Unsupported application action");
  const inventory = applicationControls();
  if (
    !payload.expected_revision ||
    String(payload.expected_revision) !== inventory.revision
  )
    return {
      status: "failed",
      reason: "stale_ui_revision",
      revision: inventory.revision,
    };
  const element = Array.from(
    document.body.querySelectorAll<HTMLElement>(INTERACTIVE),
  ).find(
    (e) =>
      controlIdFor(e) === payload.control_id &&
      isVisible(e) &&
      !isSecret(e) &&
      !e.closest(".nova-owner-confirmation"),
  );
  if (!element || element.matches(':disabled,[aria-disabled="true"]'))
    throw Error("Control unavailable or disabled");
  const before = observed(element),
    label = labelFor(element),
    interaction = String(payload.interaction || "activate");
  if (
    /\b(approve|reject|permission|grant access)\b/i.test(label) &&
    ["activate", "toggle"].includes(interaction)
  )
    return {
      status: "failed",
      reason:
        "Use the existing validated approval operation; model UI clicks cannot authorize decisions.",
    };
  if (
    /\b(delete|forget|erase|reset|discard|clear all|remove)\b/i.test(label) &&
    interaction === "activate"
  ) {
    // Only a trusted owner click can approve; capture and playback continue.
    if (!(await confirmOwner('Aegis requests: '+label,String(payload.control_id),inventory.revision)))
      return { status: "failed", reason: "user_rejected" };
    if (applicationControls().revision !== inventory.revision)
      return { status: "failed", reason: "stale_ui_revision" };
  }
  if (interaction === "scroll") {
    const amount = Number(payload.value);
    if (!Number.isFinite(amount) || Math.abs(amount) > 2000)
      throw Error("Invalid scroll amount");
    element.scrollBy({ top: amount, behavior: "smooth" });
  } else if (interaction === "scroll_into_view")
    element.scrollIntoView({ block: "center", behavior: "smooth" });
  else if (interaction === "focus") element.focus();
  else if (interaction === "activate" || interaction === "toggle") {
    if (element instanceof HTMLAnchorElement && !/^https?:/.test(element.href))
      throw Error("Unsupported link");
    element.click();
  } else if (["set_value", "append_value", "select"].includes(interaction)) {
    if (element.isContentEditable) {
      const apply = richEditors.get(element);
      if (!apply) throw Error("This editor has no registered handler");
      const value = String(payload.value ?? "");
      if (value.length > 8000) throw Error("Value too long");
      apply(value, interaction === "append_value");
    } else {
      if (!element.matches("input,textarea,select"))
        throw Error("Target does not accept text");
      const input = element as HTMLInputElement;
      const value = String(payload.value ?? "");
      if (value.length > 8000) throw Error("Value too long");
      const proto =
        element.tagName === "TEXTAREA"
          ? HTMLTextAreaElement.prototype
          : element.tagName === "SELECT"
            ? HTMLSelectElement.prototype
            : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(
        input,
        interaction === "append_value" ? input.value + value : value,
      );
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }
  } else throw Error("Unsupported control interaction");
  await new Promise((r) =>
    setTimeout(
      r,
      interaction === "scroll" || interaction === "scroll_into_view"
        ? 400
        : 160,
    ),
  );
  const after = observed(element),
    next = applicationControls();
  const changed =
    JSON.stringify(before) !== JSON.stringify(after) ||
    (document.activeElement === element && interaction === "focus");
  return {
    status: changed ? "completed" : "unconfirmed",
    target: payload.control_id,
    revision: next.revision,
    observed: after,
    reason: changed
      ? undefined
      : "No observable completion; inspect state before retrying",
  };
}

export const refreshAegisWidgetSnapshot = (widget: string) =>
  snapshot(widget, "requested");
