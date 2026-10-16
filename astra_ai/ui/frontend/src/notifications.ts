/** One presentation layer for notices; dismissal never changes authoritative work. */
export type Notice = {
  id: string;
  title: string;
  message?: string;
  kind?: string;
  target?: Record<string, unknown>;
  event?: string;
  silent?: boolean;
  inboxOnly?: boolean;
};

/** Nonblocking owner confirmation: audio/capture continue, model clicks cannot approve. */
export function confirmOwner(
  title: string,
  target: string,
  revision: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    const initialScope = scope,
      previous = document.activeElement as HTMLElement | null;
    const dialog = document.createElement("dialog");
    dialog.className = "nova-owner-confirmation";
    const heading = document.createElement("h2");
    heading.textContent = "Review this change";
    const description = document.createElement("p");
    description.textContent = title;
    const item = document.createElement("p");
    item.textContent = "Target: " + target;
    const version = document.createElement("details"),
      label = document.createElement("summary"),
      hash = document.createElement("code");
    label.textContent = "Current revision";
    hash.textContent = revision;
    version.append(label, hash);
    const controls = document.createElement("div"),
      cancel = document.createElement("button"),
      approve = document.createElement("button");
    cancel.textContent = "Keep unchanged";
    approve.textContent = "Approve this change";
    controls.append(cancel, approve);
    dialog.append(heading, description, item, version, controls);
    let settled = false;
    const finish = (yes: boolean) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("nova-confirmation-scope-changed", changed);
      dialog.close();
      dialog.remove();
      if (previous?.isConnected) previous.focus();
      resolve(yes && scope === initialScope);
    };
    const changed = () => finish(false);
    window.addEventListener("nova-confirmation-scope-changed", changed);
    cancel.onclick = (e) => {
      if (e.isTrusted) finish(false);
    };
    approve.onclick = (e) => {
      if (e.isTrusted) finish(true);
    };
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      finish(false);
    });
    dialog.addEventListener("close", () => finish(false));
    document.body.append(dialog);
    dialog.showModal();
    cancel.focus();
  });
}
const inbox: Notice[] = [];
const queue: Notice[] = [];
let active: Notice | null = null,
  timer = 0,
  started = 0,
  remaining = 3000,
  paused = false,
  scope = "";
let audio: AudioContext | null = null;
const cued = new Set<string>();
const pref = (name: string, fallback: number) => {
  try {
    const v = Number(localStorage.getItem("nova-sound-" + name) ?? fallback);
    return Number.isFinite(v) ? v : fallback;
  } catch {
    return fallback;
  }
};
export function cue(kind: "notification" | "voice", key: string) {
  if (cued.has(key) || !pref(kind, 1) || !audio || audio.state !== "running")
    return;
  cued.add(key);
  if (cued.size > 500) cued.delete(cued.values().next().value!);
  const t = audio.currentTime,
    volume = Math.max(0, Math.min(1, pref(kind + "-volume", 0.35)));
  const tones =
    kind === "voice"
      ? [
          [620, 0],
          [780, 0.06],
        ]
      : [
          [440, 0],
          [660, 0.09],
        ];
  const rate = audio.sampleRate,
    samples = new Float32Array(Math.ceil(rate * 0.3));
  for (const [hz, offset] of tones)
    for (
      let i = Math.ceil(offset * rate);
      i < Math.min(samples.length, Math.ceil((offset + 0.18) * rate));
      i++
    ) {
      const elapsed = i / rate - offset,
        peak = Math.max(0.0001, 0.06 * volume),
        gain =
          elapsed < 0.015
            ? 0.0001 * Math.pow(peak / 0.0001, elapsed / 0.015)
            : peak * Math.pow(0.0001 / peak, (elapsed - 0.015) / 0.145);
      samples[i] += Math.sin(2 * Math.PI * hz * elapsed) * gain;
    }
  window.dispatchEvent(
    new CustomEvent("nova-local-audio-reference", {
      detail: { samples, sampleRate: rate, capturedAt: performance.now() },
    }),
  );
  for (const [hz, offset] of tones) {
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.frequency.value = hz;
    o.type = "sine";
    g.gain.setValueAtTime(0.0001, t + offset);
    g.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, 0.06 * volume),
      t + offset + 0.015,
    );
    g.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.16);
    o.connect(g);
    g.connect(audio.destination);
    o.start(t + offset);
    o.stop(t + offset + 0.18);
  }
}
function unlock() {
  try {
    audio ??= new AudioContext();
    void audio.resume().catch(() => {});
  } catch {}
}
document.addEventListener("pointerdown", unlock, { passive: true });
document.addEventListener("keydown", unlock, { passive: true });
export function noticeScope(value: string) {
  if (scope === value) return;
  window.dispatchEvent(new CustomEvent("nova-confirmation-scope-changed"));
  try {
    if (scope)
      sessionStorage.setItem(
        "nova-notice-inbox:" + scope,
        JSON.stringify(inbox),
      );
  } catch {}
  scope = value;
  inbox.length = queue.length = 0;
  try {
    inbox.push(
      ...JSON.parse(
        sessionStorage.getItem("nova-notice-inbox:" + scope) || "[]",
      ),
    );
  } catch {}
  active = null;
  clearTimeout(timer);
  document.getElementById("aegis-work-notice")?.remove();
  document.getElementById("nova-notification-inbox")?.remove();
}
function route(n: Notice) {
  if (n.target?.widget)
    (window as any).aegisWidgetControl?.(String(n.target.widget), "open", {});
  window.dispatchEvent(
    new CustomEvent(n.event || "nova-open-work", { detail: n.target || {} }),
  );
}
function dismiss() {
  clearTimeout(timer);
  const box = document.getElementById("aegis-work-notice");
  active = null;
  box?.classList.add("leaving");
  setTimeout(() => {
    box?.remove();
    showNext();
  }, 200);
}
function arm() {
  started = performance.now();
  timer = window.setTimeout(dismiss, remaining);
}
function showNext() {
  if (active || !queue.length) return;
  active = queue.shift()!;
  const n = active;
  remaining = 3000;
  paused = false;
  const box = document.createElement("aside");
  box.id = "aegis-work-notice";
  box.className = "aegis-work-notice";
  box.setAttribute("role", "status");
  const open = document.createElement("button");
  open.className = "aegis-work-notice-open";
  const kicker = document.createElement("small");
  kicker.textContent = n.kind === "approval" ? "REVIEW NEEDED" : "AEGIS";
  const title = document.createElement("strong");
  title.textContent = n.title;
  const text = document.createElement("span");
  text.textContent = n.message || "View details →";
  open.append(kicker, title, text);
  open.onclick = () => {
    route(n);
    dismiss();
  };
  const close = document.createElement("button");
  close.className = "aegis-work-notice-close";
  close.textContent = "×";
  close.setAttribute("aria-label", "Dismiss notification");
  close.onclick = dismiss;
  box.append(open, close);
  const pause = () => {
    if (paused) return;
    paused = true;
    clearTimeout(timer);
    remaining = Math.max(0, remaining - (performance.now() - started));
  };
  const resume = () => {
    if (box.matches(":hover") || box.contains(document.activeElement)) return;
    paused = false;
    arm();
  };
  box.addEventListener("mouseenter", pause);
  box.addEventListener("mouseleave", resume);
  box.addEventListener("focusin", pause);
  box.addEventListener("focusout", () => setTimeout(resume, 0));
  document.body.append(box);
  if (!n.silent) cue("notification", n.id);
  arm();
}
export function notify(n: Notice) {
  const existing = inbox.find((x) => x.id === n.id);
  if (existing) {
    Object.assign(existing, n);
    try {
      sessionStorage.setItem(
        "nova-notice-inbox:" + scope,
        JSON.stringify(inbox),
      );
    } catch {}
    return;
  }
  inbox.unshift(n);
  if (inbox.length > 100) inbox.pop();
  try {
    sessionStorage.setItem("nova-notice-inbox:" + scope, JSON.stringify(inbox));
  } catch {}
  if (n.inboxOnly) return;
  queue.push(n);
  if (queue.length > 20) queue.splice(0, queue.length - 20);
  showNext();
}
export function showNotificationHistory() {
  document.getElementById("nova-notification-inbox")?.remove();
  const panel = document.createElement("aside");
  panel.id = "nova-notification-inbox";
  panel.className = "nova-notification-inbox";
  panel.setAttribute("aria-label", "Notifications and sound settings");
  const heading = document.createElement("h2");
  heading.textContent = "Notifications";
  const close = document.createElement("button");
  close.textContent = "Close";
  close.onclick = () => panel.remove();
  panel.append(heading, close);
  mountSoundSettings(panel);
  if (!inbox.length) {
    const empty = document.createElement("p");
    empty.textContent = "You’re all caught up.";
    panel.append(empty);
  }
  for (const n of inbox) {
    const b = document.createElement("button");
    b.textContent = n.title;
    b.onclick = () => {
      route(n);
      panel.remove();
    };
    panel.append(b);
  }
  document.body.append(panel);
  close.focus();
}
export function mountSoundSettings(host: HTMLElement) {
  for (const name of ["notification", "voice"]) {
    const label = document.createElement("label");
    label.textContent = name === "voice" ? "Voice cues" : "Notification sounds";
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = !!pref(name, 1);
    toggle.onchange = () => {
      localStorage.setItem("nova-sound-" + name, toggle.checked ? "1" : "0");
      if (name === "notification")
        localStorage.setItem(
          "nova-notification-sound",
          toggle.checked ? "on" : "off",
        );
      if (name === "notification")
        window.dispatchEvent(
          new CustomEvent("nova-notification-sound", {
            detail: { enabled: toggle.checked },
          }),
        );
    };
    const volume = document.createElement("input");
    volume.type = "range";
    volume.min = "0";
    volume.max = "1";
    volume.step = ".05";
    volume.value = String(pref(name + "-volume", 0.35));
    volume.setAttribute("aria-label", label.textContent + " volume");
    volume.oninput = () =>
      localStorage.setItem("nova-sound-" + name + "-volume", volume.value);
    label.append(toggle, volume);
    host.append(label);
  }
}
window.addEventListener("nova-notify", (e) =>
  notify((e as CustomEvent<Notice>).detail),
);

window.addEventListener("nova-notification-sound", (e) => {
  localStorage.setItem(
    "nova-sound-notification",
    (e as CustomEvent).detail.enabled ? "1" : "0",
  );
});
