import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Mark, mergeAttributes } from "@tiptap/core";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import DOMPurify from "dompurify";
import { marked } from "marked";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  conversationSnapshot,
  requestConversation,
  requestMicrophone,
  updateUiContext,
} from "../../conversation";
import { notify } from "../../notifications";
import { registerRichEditor } from "../../aegisWidgetProtocol";
import "./ResearchWorkspace.css";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
const clean = (html: string) =>
  DOMPurify.sanitize(html, {
    ADD_ATTR: ["data-citation"],
    FORBID_TAGS: ["iframe", "style", "script"],
  });
const markdown = (text: string) => {
  const doc = new DOMParser().parseFromString(
    clean(marked.parse(text, { async: false }) as string),
    "text/html",
  );
  for (const link of doc.querySelectorAll("a")) {
    const href = link.getAttribute("href") || "";
    if (!/^https?:\/\//i.test(href) && !href.startsWith("#"))
      link.removeAttribute("href");
    else if (!href.startsWith("#")) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
  }
  for (const image of doc.querySelectorAll("img"))
    if (!/^https?:\/\//i.test(image.getAttribute("src") || "")) image.remove();
  return doc.body.innerHTML;
};
const Citation = Mark.create({
  name: "citation",
  addAttributes() {
    return {
      source: {
        default: null,
        parseHTML: (e) => e.getAttribute("data-citation"),
        renderHTML: (a) => ({ "data-citation": a.source }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "a[data-citation]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, { class: "research-citation" }),
      0,
    ];
  },
});
const headers = () => ({
  "X-Nova-Client": conversationSnapshot().clientId,
  "Content-Type": "application/json",
});
async function api(path: string, options: RequestInit = {}) {
  const r = await fetch("/api/research" + path, {
    ...options,
    headers: { ...headers(), ...options.headers },
  });
  const d = await r.json();
  if (!r.ok || ["conflict", "not_found", "rejected"].includes(d.status))
    throw Object.assign(
      new Error(d.reason || d.detail || "Research unavailable"),
      { data: d },
    );
  return d;
}
type Source = {
  id: string;
  title: string;
  url: string;
  content?: string;
  retrieved_at?: string;
  favicon?: string;
};
type Report = {
  legacy_evidence?: boolean;
  evidence_collection?: boolean;
  research_id: string;
  research_revision: string;
  query: string;
  report: string;
  sources: Source[];
  completeness: string;
  failures: any[];
  draft?: { html: string; revision: string; source_revision: string };
  sections: { id: string; title: string }[];
};
let touched = performance.now();
let dragging = false;
document.addEventListener(
  "pointerdown",
  () => {
    touched = performance.now();
    dragging = true;
  },
  { passive: true },
);
document.addEventListener(
  "pointerup",
  () => {
    dragging = false;
  },
  { passive: true },
);
document.addEventListener(
  "keydown",
  () => {
    touched = performance.now();
  },
  { passive: true },
);
export function researchMayNavigate() {
  return (
    performance.now() - touched >= 5000 &&
    !dragging &&
    !document.getSelection()?.toString() &&
    !document.querySelector(
      '[data-draft-dirty="true"],.research-video[data-playing="true"]',
    ) &&
    !document.activeElement?.matches('input,textarea,[contenteditable="true"]')
  );
}
function openResearch(id?: string) {
  window.dispatchEvent(
    new CustomEvent("nova-open-research", { detail: { research_id: id } }),
  );
}
function DraftEditor({
  report,
  onSaved,
}: {
  report: Report;
  onSaved: (draft: any) => void;
}) {
  const key =
    "nova-research-draft:" +
    conversationSnapshot().clientId +
    ":" +
    report.research_id;
  const revision = useRef(report.draft?.revision || ""),
    pending = useRef(false),
    dirty = useRef(false),
    mounted = useRef(true),
    saveTimer = useRef(0),
    [state, setState] = useState("Saved"),
    [conflict, setConflict] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit, TableKit, Image, Citation],
    editorProps: {
      attributes: { "aria-label": "Research draft", role: "textbox" },
    },
    content: report.draft?.html || initialDraft(report),
    onUpdate: ({ editor }) => {
      dirty.current = true;
      try {
        sessionStorage.setItem(
          key,
          JSON.stringify({
            html: editor.getHTML(),
            revision: revision.current,
          }),
        );
      } catch {}
      setState("Unsaved changes");
      clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => void save(), 900);
    },
  });
  useEffect(() => {
    if (!editor) return;
    return registerRichEditor(editor.view.dom, (value, append) => {
      const node = {
        type: "paragraph",
        content: value ? [{ type: "text", text: value }] : [],
      };
      if (append) editor.commands.insertContent(node);
      else editor.commands.setContent({ type: "doc", content: [node] });
    });
  }, [editor]);
  async function save() {
    if (!editor || pending.current || !dirty.current || conflict) return;
    pending.current = true;
    dirty.current = false;
    const html = clean(editor.getHTML());
    setState("Saving…");
    let saved = false;
    try {
      const d = await api("/" + report.research_id + "/draft", {
        method: "PUT",
        body: JSON.stringify({
          html,
          source_revision: report.research_revision,
          expected_revision: revision.current,
        }),
      });
      saved = true;
      revision.current = d.draft.revision;
      onSaved(d.draft);
      if (!dirty.current) sessionStorage.removeItem(key);
      else
        sessionStorage.setItem(
          key,
          JSON.stringify({
            html: editor.getHTML(),
            revision: revision.current,
          }),
        );
      if (mounted.current)
        setState(dirty.current ? "Unsaved changes" : "Saved");
    } catch (e: any) {
      dirty.current = true;
      if (mounted.current) {
        setConflict(e.data?.status === "conflict");
        setState(
          e.data?.status === "conflict"
            ? "Another version was saved. Your local draft is preserved."
            : "Save failed. Your local draft is preserved.",
        );
      }
    } finally {
      pending.current = false;
      if (saved && dirty.current && mounted.current)
        saveTimer.current = window.setTimeout(() => void save(), 900);
    }
  }
  useEffect(() => {
    mounted.current = true;
    try {
      const local = JSON.parse(sessionStorage.getItem(key) || "null");
      if (local && local.revision === revision.current) {
        editor?.commands.setContent(local.html);
        dirty.current = true;
        setState("Recovered local changes");
        saveTimer.current = window.setTimeout(() => void save(), 900);
      } else if (local) {
        setConflict(true);
        setState(
          "A different saved version exists. Your local draft is preserved.",
        );
      }
    } catch {}
    return () => {
      mounted.current = false;
      clearTimeout(saveTimer.current);
    };
  }, [editor]);
  if (!editor) return null;
  return (
    <div
      className="research-editor"
      data-draft-dirty={dirty.current || pending.current ? "true" : "false"}
    >
      <div
        className="research-editor-toolbar"
        role="toolbar"
        aria-label="Document formatting"
      >
        {(["bold", "italic", "strike"] as const).map((mark) => (
          <button
            key={mark}
            aria-pressed={editor.isActive(mark)}
            onClick={() => editor.chain().focus().toggleMark(mark).run()}
          >
            {mark}
          </button>
        ))}
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          Heading
        </button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()}>
          List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          Numbered
        </button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          Quote
        </button>
        <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          Code
        </button>
        <button
          onClick={() => {
            const href = prompt("Link URL");
            if (href && /^https?:\/\//.test(href))
              editor.chain().focus().setLink({ href }).run();
          }}
        >
          Link
        </button>
        <button
          onClick={() => {
            const src = prompt("Image URL");
            if (src && /^https?:\/\//.test(src))
              editor.chain().focus().setImage({ src }).run();
          }}
        >
          Image
        </button>
        <button
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          Table
        </button>
        <button
          onClick={() => {
            const source = prompt("Citation source ID, e.g. S1");
            if (source && report.sources.some((s) => s.id === source))
              editor
                .chain()
                .focus()
                .insertContent(
                  '<a data-citation="' +
                    source +
                    '" href="#source-' +
                    source +
                    '">[' +
                    source +
                    "]</a>",
                )
                .run();
          }}
        >
          Citation
        </button>
        <button onClick={() => editor.chain().focus().undo().run()}>
          Undo
        </button>
        <button onClick={() => editor.chain().focus().redo().run()}>
          Redo
        </button>
        <button
          disabled={pending.current || conflict}
          onClick={() => void save()}
        >
          Save
        </button>
      </div>
      <div className="research-draft-state" role="status">
        {state}
        {conflict && (
          <>
            <button
              onClick={() => {
                if (
                  confirm(
                    "Reload the saved version? The local recovery copy will remain available.",
                  )
                )
                  location.reload();
              }}
            >
              Reload saved
            </button>
            <button
              onClick={() => {
                const local = JSON.parse(sessionStorage.getItem(key) || "null");
                if (local) {
                  navigator.clipboard?.writeText(local.html);
                  setState(
                    "Local draft HTML copied. Keep it before reloading.",
                  );
                }
              }}
            >
              Copy recovery draft
            </button>
          </>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
function DocumentPreview({
  report,
  source,
  onClose,
}: {
  report: Report;
  source: Source;
  onClose: () => void;
}) {
  const [data, setData] = useState<Uint8Array | null>(null),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [page, setPage] = useState(1),
    [pages, setPages] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null),
    pdf = useRef<any>(null);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setText("Loading source…");
    void fetch(
      "/api/research/" + report.research_id + "/sources/" + source.id,
      { headers: headers(), signal: controller.signal },
    )
      .then(async (r) => {
        if (!r.ok)
          throw Error("Preview unavailable. Open the original source.");
        if (r.headers.get("Content-Type")?.includes("application/pdf")) {
          setText("");
          setData(new Uint8Array(await r.arrayBuffer()));
        } else setText(await r.text());
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [source.id, report.research_id]);
  useEffect(() => {
    if (!data) return;
    let gone = false;
    const task = pdfjs.getDocument({ data });
    task.promise
      .then((doc) => {
        if (gone) {
          void doc.cleanup();
          return;
        }
        pdf.current = doc;
        setPages(doc.numPages);
        setPage(1);
      })
      .catch(() =>
        setError("PDF could not be displayed. Open the original source."),
      );
    return () => {
      gone = true;
      pdf.current = null;
      void task.destroy();
    };
  }, [data]);
  useEffect(() => {
    if (!pdf.current || !canvas.current) return;
    let render: any;
    pdf.current
      .getPage(page)
      .then((p: any) => {
        if (!canvas.current) return;
        const view = p.getViewport({ scale: 1.25 });
        canvas.current.width = view.width;
        canvas.current.height = view.height;
        render = p.render({ canvas: canvas.current, viewport: view });
        return render.promise;
      })
      .catch(() => {});
    return () => render?.cancel();
  }, [page, pages]);
  return (
    <div
      className="research-source-preview"
      role="dialog"
      aria-modal="true"
      aria-label={source.title}
    >
      <header>
        <strong>{source.title}</strong>
        <button onClick={onClose} aria-label="Close source preview">
          ×
        </button>
      </header>
      <p>
        {source.retrieved_at && new Date(source.retrieved_at).toLocaleString()}{" "}
        ·{" "}
        <a href={source.url} target="_blank" rel="noopener noreferrer">
          Open original ↗
        </a>
      </p>
      {error ? (
        <p role="alert">{error}</p>
      ) : data ? (
        <>
          <nav>
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>
              Page {page} of {pages || "…"}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </nav>
          <canvas ref={canvas} />
        </>
      ) : (
        <pre>{text}</pre>
      )}
    </div>
  );
}
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
let youtube: Promise<void> | null = null;
function loadYouTube() {
  return (youtube ??= new Promise<void>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => reject(Error("Video player unavailable"));
    window.onYouTubeIframeAPIReady = resolve;
    document.head.append(script);
  }));
}
function videoId(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be")
      return /^[\w-]{11}$/.test(u.pathname.slice(1))
        ? u.pathname.slice(1)
        : null;
    if (/(^|\.)youtube\.com$/.test(u.hostname)) {
      const id = u.searchParams.get("v") || u.pathname.split("/").pop() || "";
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
  } catch {}
  return null;
}
function Video({ source }: { source: Source }) {
  const target = useRef<HTMLDivElement>(null),
    player = useRef<any>(null),
    normal = useRef<number | null>(null),
    [error, setError] = useState(""),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    let canceled = false;
    const id = videoId(source.url);
    if (!id) return;
    void loadYouTube()
      .then(() => {
        if (canceled || !target.current) return;
        player.current = new window.YT.Player(target.current, {
          videoId: id,
          playerVars: { origin: location.origin, playsinline: 1 },
          events: {
            onStateChange: (e: any) => {
              if (!canceled) setPlaying(e.data === 1);
            },
            onError: () => {
              if (!canceled)
                setError(
                  "This video cannot play here. Open the original video.",
                );
            },
          },
        });
      })
      .catch((e) => setError(e.message));
    let userSpeaking = false;
    const speech = (e: Event) => {
      userSpeaking = !!(e as CustomEvent).detail;
      duck();
    };
    const duck = () => {
      const p = player.current;
      if (!p?.getVolume) return;
      const s = conversationSnapshot(),
        talking =
          s.state === "speaking" || s.state === "thinking" || userSpeaking;
      if (talking && normal.current === null) {
        normal.current = p.getVolume();
        p.setVolume(normal.current! * 0.2);
      } else if (!talking && normal.current !== null) {
        if (Math.abs(p.getVolume() - normal.current * 0.2) < 2)
          p.setVolume(normal.current);
        normal.current = null;
      }
    };
    window.addEventListener("nova-user-speaking", speech);
    window.addEventListener("nova-conversation", duck);
    return () => {
      canceled = true;
      window.removeEventListener("nova-user-speaking", speech);
      window.removeEventListener("nova-conversation", duck);
      player.current?.destroy();
    };
  }, [source.url]);
  return (
    <article className="research-video" data-playing={playing}>
      <h3>{source.title}</h3>
      {error ? <p role="alert">{error}</p> : <div ref={target} />}
      <div className="research-video-controls">
        <button onClick={() => player.current?.playVideo()}>Play</button>
        <button onClick={() => player.current?.pauseVideo()}>Pause</button>
        <button
          onClick={() =>
            player.current?.seekTo(
              Math.max(0, (player.current?.getCurrentTime() || 0) - 10),
              true,
            )
          }
        >
          Back 10s
        </button>
        <button
          onClick={() =>
            player.current?.seekTo(
              (player.current?.getCurrentTime() || 0) + 10,
              true,
            )
          }
        >
          Forward 10s
        </button>
        <input
          aria-label="Video volume"
          type="range"
          min="0"
          max="100"
          defaultValue="100"
          onChange={(e) => {
            normal.current = null;
            player.current?.setVolume(Number(e.target.value));
          }}
        />
      </div>
      <a href={source.url} target="_blank" rel="noopener noreferrer">
        Open original video ↗
      </a>
    </article>
  );
}
function sourceExcerpt(source: Source) {
  const doc = new DOMParser().parseFromString(
    markdown(source.content || ""),
    "text/html",
  );
  const paragraphs = Array.from(doc.querySelectorAll("p")).filter(
    (p) =>
      p.textContent!.length > 100 &&
      Array.from(p.querySelectorAll("a")).reduce(
        (n, a) => n + (a.textContent?.length || 0),
        0,
      ) <
        p.textContent!.length * 0.6,
  );
  return (
    paragraphs
      .slice(0, 2)
      .map((p) => p.textContent)
      .join("\n\n")
      .slice(0, 1400) ||
    doc.body.textContent?.slice(0, 700) ||
    "Read the source to inspect the evidence."
  );
}
function initialDraft(report: Report) {
  if (!report.evidence_collection) return markdown(report.report);
  const doc = document.implementation.createHTMLDocument(""),
    heading = doc.createElement("h1");
  heading.textContent = report.query;
  doc.body.append(heading);
  const note = doc.createElement("p");
  note.textContent =
    "Collected source evidence; synthesis is unavailable. The original report remains preserved.";
  doc.body.append(note);
  for (const source of report.sources) {
    const h = doc.createElement("h2");
    h.textContent = source.title;
    const p = doc.createElement("p");
    p.textContent = sourceExcerpt(source);
    const citation = doc.createElement("a");
    citation.setAttribute("data-citation", source.id);
    citation.href = source.url;
    citation.textContent = "[" + source.id + "]";
    p.append(citation);
    doc.body.append(h, p);
  }
  return clean(doc.body.innerHTML);
}
function SourceChip({
  source,
  onClick,
}: {
  source: Source;
  onClick: () => void;
}) {
  let host = "Source";
  try {
    host = new URL(source.url).hostname.replace(/^www\./, "");
  } catch {}
  return (
    <button
      className="research-source-chip"
      onClick={onClick}
      title={source.title}
    >
      {source.favicon ? (
        <img
          src={source.favicon}
          alt=""
          onError={(e) => (e.currentTarget.hidden = true)}
        />
      ) : (
        <span aria-hidden="true">◈</span>
      )}
      <span>{host}</span>
      <small>{source.id}</small>
    </button>
  );
}
function Workspace() {
  const [open, setOpen] = useState(
      () => localStorage.getItem("nova-current-workspace") === "research",
    ),
    [items, setItems] = useState<any[]>([]),
    [offset, setOffset] = useState(0),
    [total, setTotal] = useState(0),
    [report, setReport] = useState<Report | null>(null),
    [tab, setTab] = useState("reader"),
    [query, setQuery] = useState(""),
    [mode, setMode] = useState("detailed"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState<Source | null>(null),
    [chat, setChat] = useState(conversationSnapshot()),
    [message, setMessage] = useState(""),
    [readerChars, setReaderChars] = useState(20000),
    [original, setOriginal] = useState(false),
    [outline, setOutline] = useState(true),
    [rail, setRail] = useState(true);
  const scopeRef = useRef("");
  const loadEpoch = useRef(0),
    reader = useRef<HTMLDivElement>(null),
    lastSelection = useRef("");
  async function refresh() {
    const client = conversationSnapshot().clientId;
    if (!client || conversationSnapshot().guest) return;
    try {
      const d = await api("?offset=" + offset);
      if (
        conversationSnapshot().clientId !== client ||
        conversationSnapshot().guest
      )
        return;
      setItems(d.items);
      setTotal(d.total);
    } catch (e: any) {
      setError(e.message);
    }
  }
  async function select(id: string) {
    const client = conversationSnapshot().clientId,
      epoch = ++loadEpoch.current;
    setError("");
    try {
      const d = await api("/" + encodeURIComponent(id) + "/document");
      if (
        epoch !== loadEpoch.current ||
        client !== conversationSnapshot().clientId ||
        conversationSnapshot().guest
      )
        return;
      setReport(d);
      setReaderChars(20000);
      setOriginal(false);
      setPreview(null);
      lastSelection.current = id;
      sessionStorage.setItem("nova-selected-research", id);
      updateUiContext({
        view: "research",
        research_id: id,
        research_revision: d.research_revision,
        title: d.query,
        selected_id: id,
        selected_kind: "research",
        category: "",
      });
    } catch (e: any) {
      if (epoch === loadEpoch.current) setError(e.message);
    }
  }
  useEffect(() => {
    const key = chat.clientId + ":" + chat.guest;
    if (scopeRef.current !== key) {
      scopeRef.current = key;
      ++loadEpoch.current;
      setReport(null);
      setItems([]);
      setPreview(null);
      if (open && !chat.guest && chat.clientId) {
        setError("");
        void refresh();
        const id =
          lastSelection.current ||
          sessionStorage.getItem("nova-selected-research");
        if (id) void select(id);
      }
    }
  }, [chat.clientId, chat.guest]);
  useEffect(() => {
    if (open) {
      void refresh();
      if (!report) {
        const id = sessionStorage.getItem("nova-selected-research");
        if (id) void select(id);
      }
    }
  }, [open, offset]);
  useEffect(() => {
    const show = (e: Event) => {
      setOpen(true);
      document.body.classList.add("research-workspace-open");
      document.body.classList.remove("memory-workspace-open");
      localStorage.setItem("nova-current-workspace", "research");
      updateUiContext({
        view: "research",
        category: "",
        selected_id: lastSelection.current,
        selected_kind: "research",
      });
      const id = (e as CustomEvent).detail?.research_id;
      if (id) void select(id);
    };
    const hide = () => {
      setOpen(false);
      document.body.classList.remove("research-workspace-open");
    };
    const sync = () => setChat(conversationSnapshot());
    const ready = (e: Event) => {
      const d = (e as CustomEvent).detail;
      void refresh();
      notify({
        id: "research:" + d.research_id,
        title: "Research ready",
        message: d.query || "Open your sourced report",
        kind: "research",
        event: "nova-open-research",
        target: d,
      });
      if (
        ((document.body.classList.contains("research-workspace-open") &&
          !lastSelection.current &&
          !document.querySelector('[data-draft-dirty="true"]')) ||
          researchMayNavigate()) &&
        !["speaking", "thinking"].includes(conversationSnapshot().state)
      )
        openResearch(d.research_id);
    };
    window.addEventListener("nova-open-research", show);
    window.addEventListener("nova-open-memory", hide);
    window.addEventListener("nova-open-dashboard", hide);
    window.addEventListener("nova-conversation", sync);
    window.addEventListener("nova-research-ready", ready);
    if (open) show(new Event("restore"));
    return () => {
      window.removeEventListener("nova-open-research", show);
      window.removeEventListener("nova-open-memory", hide);
      window.removeEventListener("nova-open-dashboard", hide);
      window.removeEventListener("nova-conversation", sync);
      window.removeEventListener("nova-research-ready", ready);
    };
  }, []);
  useEffect(() => {
    const done = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", done);
    return () => window.removeEventListener("keydown", done);
  }, []);
  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const d = await api("", {
        method: "POST",
        body: JSON.stringify({
          query,
          mode,
          session_id: chat.sessionId,
          operation_id: crypto.randomUUID(),
        }),
      });
      if (!["accepted", "queued", "duplicate", "completed"].includes(d.status))
        throw Error(d.reason || "Research could not start");
      lastSelection.current = "";
      notify({
        id: "research-job:" + d.job_id,
        title: mode === "detailed" ? "Research started" : "Search started",
        target: { view: "tasks", id: "job:" + d.job_id },
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function download(format: string) {
    if (!report) return;
    if (tab === "edit" && document.querySelector('[data-draft-dirty="true"]')) {
      setError("Save your draft before downloading the current version.");
      return;
    }
    try {
      const r = await fetch(
        "/api/research/" +
          report.research_id +
          "/export?revision=" +
          report.research_revision +
          "&format=" +
          format +
          "&draft=" +
          (tab === "edit"),
        { headers: headers() },
      );
      if (!r.ok) throw Error("Export unavailable");
      const url = URL.createObjectURL(await r.blob()),
        a = document.createElement("a");
      a.href = url;
      a.download =
        report.query.replace(/[^\w -]/g, "").slice(0, 80) + "." + format;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      setError(e.message);
    }
  }
  const html = report
    ? markdown(report.report.slice(0, readerChars)).replace(
        /\[S(\d+)\]/g,
        (_, id) =>
          '<a href="#source-S' +
          id +
          '" data-citation="S' +
          id +
          '" class="research-citation">' +
          id +
          "</a>",
      )
    : "";
  return (
    <section
      className="research-workspace"
      hidden={!open}
      data-aegis-widget="research"
      aria-label="Research workspace"
    >
      <header className="research-heading">
        <div>
          <span className="research-eyebrow">AEGIS / RESEARCH</span>
          <h1>{report?.query || "Room for a deeper answer."}</h1>
        </div>
        <div>
          <button aria-pressed={outline} onClick={() => setOutline((v) => !v)}>
            Outline
          </button>
          <button aria-pressed={rail} onClick={() => setRail((v) => !v)}>
            Assistant
          </button>
        </div>
      </header>
      <form className="research-query" onSubmit={start}>
        <input
          aria-label="Research topic"
          placeholder="What would you like to understand?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={600}
        />
        <select
          aria-label="Research depth"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="quick">Quick search</option>
          <option value="detailed">Detailed research</option>
        </select>
        <button disabled={busy || !chat.connected || chat.guest}>
          {busy ? "Starting…" : "Research ↗"}
        </button>
      </form>
      {error && (
        <p className="research-error" role="alert">
          {error}
          <button
            onClick={() => {
              setError("");
              void refresh();
            }}
          >
            Retry
          </button>
        </p>
      )}
      <div
        className={
          "research-layout " +
          (!outline ? "no-outline " : "") +
          (!rail ? "no-rail" : "")
        }
      >
        {outline && (
          <aside className="research-outline">
            <h2>Your research</h2>
            {items.map((item) => (
              <button
                className={
                  report?.research_id === item.research_id ? "selected" : ""
                }
                key={item.research_id}
                onClick={() => void select(item.research_id)}
              >
                <strong>{item.query}</strong>
                <small>
                  {new Date(item.retrieved_at).toLocaleDateString()} ·{" "}
                  {item.completeness}
                </small>
              </button>
            ))}
            <nav>
              <button
                disabled={!offset}
                onClick={() => setOffset((v) => v - 30)}
              >
                Previous
              </button>
              <button
                disabled={offset + 30 >= total}
                onClick={() => setOffset((v) => v + 30)}
              >
                Next
              </button>
            </nav>
            {report && (
              <>
                <h2>On this page</h2>
                {(report.evidence_collection && !original
                  ? report.sources.map((s) => ({ id: s.id, title: s.title }))
                  : report.sections.slice(0, 50)
                ).map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      const target =
                        report.evidence_collection && !original
                          ? reader.current?.querySelector("#source-" + s.id)
                          : reader.current?.querySelectorAll("h1,h2,h3")[i];
                      target?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                  >
                    {s.title}
                  </button>
                ))}
              </>
            )}
          </aside>
        )}
        <main className="research-document">
          <header className="research-document-tools">
            <nav aria-label="Report views">
              {["reader", "edit", "sources", "media"].map((v) => (
                <button
                  key={v}
                  aria-pressed={tab === v}
                  onClick={() => setTab(v)}
                >
                  {v[0].toUpperCase() + v.slice(1)}
                </button>
              ))}
            </nav>
            {report && (
              <details>
                <summary>Download</summary>
                {["md", "html", "pdf", "docx"].map((f) => (
                  <button key={f} onClick={() => void download(f)}>
                    {f.toUpperCase()}
                  </button>
                ))}
              </details>
            )}
          </header>
          {!report ? (
            <div className="research-empty">
              <span>✧</span>
              <h2>Follow your curiosity.</h2>
              <p>
                Research a topic, read the evidence, and shape an editable
                draft—all in one place.
              </p>
              {chat.jobs
                .filter((j) =>
                  ["running", "queued", "retrying"].includes(j.state),
                )
                .map((j) => (
                  <p key={j.id}>
                    {j.title || "Research in progress"} · {j.state}
                  </p>
                ))}
            </div>
          ) : (
            <>
              {report.completeness === "partial" && (
                <div className="research-partial">
                  Partial result ·{" "}
                  {report.failures
                    .map((f) => String(f.reason).replace(/_/g, " "))
                    .join(" · ")}
                </div>
              )}
              <div
                hidden={tab !== "reader"}
                ref={reader}
                className="research-reader"
                onClick={(e) => {
                  const anchor = (e.target as Element).closest(
                    "a[data-citation]",
                  );
                  if (anchor) {
                    e.preventDefault();
                    const source = report.sources.find(
                      (s) => s.id === anchor.getAttribute("data-citation"),
                    );
                    if (source) setPreview(source);
                  }
                }}
              >
                {report.evidence_collection && !original ? (
                  <>
                    <h1>{report.query}</h1>
                    <p className="research-evidence-label">
                      Source collection · Read the supporting passages below, or
                      inspect the full original report. Synthesis is not
                      available for this collection.
                    </p>
                    {report.sources.map((source) => (
                      <article
                        className="research-evidence-card"
                        id={"source-" + source.id}
                        key={source.id}
                      >
                        <SourceChip
                          source={source}
                          onClick={() => setPreview(source)}
                        />
                        <h2>{source.title}</h2>
                        <p>{sourceExcerpt(source)}</p>
                        <button onClick={() => setPreview(source)}>
                          Read source
                        </button>
                      </article>
                    ))}
                    <button onClick={() => setOriginal(true)}>
                      Read original saved report
                    </button>
                  </>
                ) : (
                  <>
                    <div dangerouslySetInnerHTML={{ __html: html }} />
                    {report.report.length > readerChars && (
                      <button onClick={() => setReaderChars((v) => v + 20000)}>
                        Continue reading · {report.report.length - readerChars}{" "}
                        characters remaining
                      </button>
                    )}
                  </>
                )}
                <div className="research-source-chips">
                  {report.sources.map((source) => (
                    <SourceChip
                      key={source.id}
                      source={source}
                      onClick={() => setPreview(source)}
                    />
                  ))}
                </div>
              </div>
              {tab === "edit" && (
                <DraftEditor
                  key={report.research_id}
                  report={report}
                  onSaved={(draft) =>
                    setReport((old) =>
                      old?.research_id === report.research_id
                        ? { ...old, draft }
                        : old,
                    )
                  }
                />
              )}
              {tab === "sources" && (
                <div className="research-sources">
                  {report.sources.map((source) => (
                    <article key={source.id}>
                      <SourceChip
                        source={source}
                        onClick={() => setPreview(source)}
                      />
                      <h2>{source.title}</h2>
                      <p>{sourceExcerpt(source)}</p>
                      <small>
                        Retrieved {source.retrieved_at || "date unavailable"}
                      </small>
                      <div>
                        <button onClick={() => setPreview(source)}>
                          Read source
                        </button>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open original ↗
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              {tab === "media" && (
                <div className="research-media">
                  {report.sources
                    .filter((s) => videoId(s.url))
                    .map((s) => (
                      <Video key={s.id} source={s} />
                    ))}
                  {!report.sources.some((s) => videoId(s.url)) && (
                    <p>
                      No playable videos were returned for this report. Ask
                      Aegis to research relevant videos.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </main>
        {rail && (
          <aside className="research-assistant">
            <span className="research-eyebrow">YOUR RESEARCH COMPANION</span>
            <h2>Go a little deeper.</h2>
            <p>
              Ask a follow-up, compare sources, or request a change to your
              draft.
            </p>
            <div className="research-chat" role="log">
              {chat.messages.slice(-20).map((m) => (
                <article key={m.id}>
                  <small>{m.role === "user" ? "You" : "Aegis"}</small>
                  <p>{m.text}</p>
                </article>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (message.trim()) {
                  requestConversation(message);
                  setMessage("");
                }
              }}
            >
              <textarea
                aria-label="Message Aegis about research"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask a follow-up…"
              />
              <div>
                <button
                  type="button"
                  aria-label={
                    chat.muted ? "Unmute microphone" : "Mute microphone"
                  }
                  onClick={requestMicrophone}
                >
                  {chat.muted ? "Mic off" : "Mic on"}
                </button>
                <button disabled={!chat.connected || !message.trim()}>
                  Send ↗
                </button>
              </div>
            </form>
            <small>{chat.status || chat.state}</small>
          </aside>
        )}
      </div>
      {preview && report && (
        <DocumentPreview
          key={preview.id}
          report={report}
          source={preview}
          onClose={() => setPreview(null)}
        />
      )}
    </section>
  );
}
export default function initResearchWorkspace() {
  const host = document.createElement("div");
  host.id = "research-workspace-root";
  document.body.append(host);
  createRoot(host).render(<Workspace />);
  const nav = document.createElement("nav");
  nav.className = "nova-workspaces";
  nav.setAttribute("aria-label", "Workspaces");
  for (const view of ["dashboard", "memory", "research"]) {
    const button = document.createElement("button");
    button.textContent = view[0].toUpperCase() + view.slice(1);
    button.onclick = () => window.dispatchEvent(new Event("nova-open-" + view));
    nav.append(button);
  }
  document.body.append(nav);
  for (const view of ["dashboard", "memory", "research"])
    window.addEventListener("nova-open-" + view, () => {
      localStorage.setItem("nova-current-workspace", view);
      updateUiContext({ view });
      Array.from(nav.children).forEach((b, i) =>
        b.setAttribute(
          "aria-current",
          String(["dashboard", "memory", "research"][i] === view),
        ),
      );
    });
}
