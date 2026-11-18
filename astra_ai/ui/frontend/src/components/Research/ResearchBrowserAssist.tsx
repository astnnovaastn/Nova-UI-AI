import React, { useEffect, useRef, useState } from "react";

type Tab = { id: number; title: string; host: string };
export type LiveTabContext = Tab & { token: string; text: string; links: string[] };
type BrowserAction = { action: "scroll_down" | "scroll_up" | "reload" | "open_link"; link?: number };
type Invoke = (command: string, args?: Record<string, unknown>) => Promise<unknown>;

export function ResearchBrowserAssist({ tool, onClose, onAttach, onHandoff, proposal }: {
  tool: "" | "browser" | "styles" | "work";
  onClose: () => void;
  onAttach: (snapshot: LiveTabContext) => Promise<string>;
  onHandoff: (request: string) => Promise<void>;
  proposal: { id: string; attachmentId: string; action: BrowserAction } | null;
}) {
  const invoke = (window as Window & { aegisDesktop?: { invoke: Invoke } }).aegisDesktop?.invoke;
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [snapshot, setSnapshot] = useState<(LiveTabContext & { attachmentId: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [request, setRequest] = useState("");
  const [reviewed, setReviewed] = useState("");
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  const selectedTab = tabs.find(tab => tab.id === selected);

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      await action();
    } catch (error) {
      if (active.current) setNotice(error instanceof Error ? error.message : "The action could not finish.");
    } finally {
      if (active.current) setBusy(false);
    }
  }

  async function refresh() {
    const next = await invoke!("browser_assist_list") as Tab[];
    setTabs(next);
    if (next.length === 0) setNotice("Open a source in the Work browser, then try again.");
    if (!next.some(tab => tab.id === selected)) {
      setSelected(next[0]?.id ?? null);
      setSnapshot(null);
    }
  }

  async function attach() {
    const result = await invoke!("browser_assist_read", { id: selected }) as LiveTabContext | null;
    if (!active.current) return;
    if (!result) { setNotice("Tab reading cancelled."); return; }
    const attachmentId = await onAttach(result);
    if (!active.current) return;
    setSnapshot({ ...result, attachmentId });
    setNotice("Live tab attached. Review the attachment before sending.");
  }

  async function apply(action: BrowserAction, proposalId?: string) {
    if (!snapshot) return;
    const applied = await invoke!("browser_assist_action", { id: snapshot.id, token: snapshot.token, ...action });
    if (proposalId) setReviewed(proposalId);
    if (applied && (action.action === "open_link" || action.action === "reload")) setSnapshot(null);
    setNotice(applied ? "Browser action applied." : "Browser action declined.");
  }

  useEffect(() => {
    if (invoke && (tool === "browser" || tool === "styles")) void run(refresh);
  }, [tool]);

  if (!tool) return null;
  const title = tool === "styles" ? "Page styles of this site" : tool === "work" ? "Continue in Work" : "Browser context";

  return <div className="research-browser-assist" aria-label={title}>
    <header><strong>{title}</strong><button type="button" aria-label="Close chat tool" onClick={onClose}>×</button></header>
    {invoke && tool !== "work" &&
      <div className="research-browser-assist-controls">
        <label>Source tab <select value={selected ?? ""} disabled={busy || tabs.length === 0} onChange={event => {
          setSelected(Number(event.currentTarget.value));
          setSnapshot(null);
        }}>
          {tabs.length === 0 && <option value="">No source tabs</option>}
          {tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.title} · {tab.host}</option>)}
        </select></label>
        {tool === "browser" && <div>
          <button type="button" disabled={busy} onClick={() => void run(refresh)}>Refresh tabs</button>
          <button type="button" disabled={busy || !selectedTab} onClick={() => void run(attach)}>Attach live tab</button>
          <button type="button" disabled={busy || !selectedTab} onClick={() => void run(async () => {
            await invoke("browser_assist_takeover", { id: selected });
            setSnapshot(null);
            setNotice("The source tab has keyboard focus.");
          })}>Take over tab</button>
        </div>}
        {tool === "styles" && selectedTab && <div aria-label="Site styles">
          {([["readable", "Readable spacing"], ["contrast", "High contrast"], ["reset", "Reset style"]] as const).map(([style, label]) =>
            <button type="button" key={style} disabled={busy} onClick={() => void run(async () => {
              await invoke("browser_assist_style", { id: selected, style });
              setNotice(style === "reset" ? "Site style reset." : "Site style applied to this tab.");
            })}>{label}</button>
          )}
        </div>}
        {tool === "browser" && snapshot && <div aria-label="Browser action approval">
          <button type="button" disabled={busy} onClick={() => void run(() => apply({ action: "scroll_down" }))}>Scroll down</button>
          <button type="button" disabled={busy} onClick={() => void run(() => apply({ action: "reload" }))}>Reload tab</button>
          {proposal && proposal.attachmentId === snapshot.attachmentId && reviewed !== proposal.id && <button type="button" disabled={busy} onClick={() => void run(() => apply(proposal.action, proposal.id))}>Review AI browser action</button>}
          {snapshot.links.length > 0 && <label>Open a page link <select value="" disabled={busy} onChange={event => {
            const link = Number(event.currentTarget.value);
            if (link > 0) void run(() => apply({ action: "open_link", link }));
          }}><option value="">Choose link</option>{snapshot.links.map((label, index) =>
            <option key={index} value={index + 1}>{label}</option>
          )}</select></label>}
        </div>}
      </div>}
    {tool === "work" && <form onSubmit={event => {
        event.preventDefault();
        const task = request.trim();
        if (task) void run(() => onHandoff(task));
      }}>
        <label>Work request <textarea required maxLength={12000} rows={3} value={request} onChange={event => setRequest(event.target.value)} /></label>
        <button type="submit" disabled={busy || !request.trim()}>Start Work run</button>
      </form>}
    {notice && <p role="status">{notice}</p>}
  </div>;
}

export function browserActionProposal(text: string): BrowserAction | null {
  const match = text.match(/(?:^|\n)```aegis-browser-action\s*\n([^\n]{1,200})\n```\s*$/);
  if (!match) return null;
  try {
    const result = JSON.parse(match[1]);
    if (["scroll_down", "scroll_up", "reload"].includes(result?.action)) return { action: result.action };
    if (result?.action === "open_link" && Number.isInteger(result.link) && result.link >= 1 && result.link <= 20) {
      return { action: "open_link", link: result.link };
    }
  } catch { /* Treat malformed proposals as ordinary reply text. */ }
  return null;
}
