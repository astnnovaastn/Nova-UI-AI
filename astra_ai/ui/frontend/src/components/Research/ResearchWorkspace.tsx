import React, { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
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
import {
  registerRichEditor,
  registerMediaControls,
} from "../../aegisWidgetProtocol";
import "./ResearchWorkspace.css";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
const clean = (html: string) =>
  DOMPurify.sanitize(html, {
    ADD_ATTR: ["data-citation", "data-source-link"],
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
  video_id?: string;
  channel?: string;
  thumbnail?: string;
  published_at?: string;
};
type Report = {
  linked_sources?: Source[];
  media?: Source[];
  media_revision?: string;
  media_status?: string;
  media_failures?: { reason: string }[];
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
function publication(source: Source) {
  try {
    return new URL(source.url).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
}
function SourceIcon({ source }: { source: Source }) {
  const [failed, setFailed] = useState(false);
  return source.favicon && !failed ? (
    <img
      src={source.favicon}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="research-source-fallback" aria-hidden="true">
      {publication(source).charAt(0).toUpperCase()}
    </span>
  );
}
function SourceChip({
  source,
  onClick,
  sources = [source],
}: {
  source: Source;
  onClick: (source?: Source) => void;
  sources?: Source[];
}) {
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const button = useRef<HTMLButtonElement>(null),
    timer = useRef<number>(0);
  const show = () => {
    clearTimeout(timer.current);
    const r = button.current?.getBoundingClientRect();
    if (r)
      setPosition({
        left: Math.max(12, Math.min(r.left, innerWidth - 344)),
        top: Math.max(
          12,
          Math.min(
            r.bottom + 8,
            innerHeight - Math.min(380, innerHeight * 0.45) - 12,
          ),
        ),
      });
  };
  const hide = () => {
    timer.current = window.setTimeout(() => setPosition(null), 140);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [position]);
  return (
    <span
      className="research-citation-wrap"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <button
        ref={button}
        className="research-source-chip"
        data-source-id={source.id}
        aria-label={"Read source: " + source.title}
        aria-expanded={!!position}
        onKeyDown={(e) => {
          if (e.key === "Escape") setPosition(null);
        }}
        onClick={() => {
          setPosition(null);
          onClick(source);
        }}
      >
        <SourceIcon source={source} />
        <span>{publication(source)}</span>
        {sources.length > 1 && <small>+{sources.length - 1}</small>}
      </button>
      {position &&
        createPortal(
          <div
            className="research-citation-preview"
            style={{ left: position.left, top: position.top }}
            role="group"
            aria-label="Supporting sources"
            onMouseEnter={() => clearTimeout(timer.current)}
            onMouseLeave={hide}
            onFocus={() => clearTimeout(timer.current)}
            onBlur={hide}
          >
            {sources.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setPosition(null);
                  onClick(s);
                }}
              >
                <span className="research-publication">
                  <SourceIcon source={s} />
                  {publication(s)}
                </span>
                <strong>{s.title}</strong>
                <span>{sourceExcerpt(s).slice(0, 240)}</span>
                {s.retrieved_at && (
                  <small>
                    Retrieved {new Date(s.retrieved_at).toLocaleDateString()}
                  </small>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </span>
  );
}
function citationParts(
  value: string,
  sources: Source[],
  literal = false,
): (string | Source[])[] {
  if (literal) return [value];
  return value.split(/((?:\[S\d+\](?:[ \t]*)){1,})/g).map((part) => {
    const ids = [
      ...new Set([...part.matchAll(/\[S(\d+)\]/g)].map((m) => "S" + m[1])),
    ];
    const refs = ids.map((id) => sources.find((s) => s.id === id));
    if (ids.length && refs.every(Boolean)) return refs as Source[];
    return part.replace(/^(?:\p{Extended_Pictographic}\uFE0F?\s+)+/u, "");
  });
}
// Transform parsed text nodes only: citations cannot modify code, HTML attributes or URLs.
function ReportContent({
  text,
  sources,
  onOpen,
  onUnknown,
}: {
  text: string;
  sources: Source[];
  onOpen: (s: Source) => void;
  onUnknown: (url: string) => void;
}) {
  const doc = useMemo(
    () => new DOMParser().parseFromString(markdown(text), "text/html"),
    [text],
  );
  function render(node: Node, key: string, literal = false): React.ReactNode {
    if (node.nodeType === Node.TEXT_NODE) {
      const value = node.textContent || "";
      return citationParts(value, sources, literal).map((part, i) =>
        typeof part === "string" ? (
          part
        ) : (
          <SourceChip
            key={key + ":" + i}
            source={part[0]}
            sources={part}
            onClick={(s) => onOpen(s || part[0])}
          />
        ),
      );
    }
    if (!(node instanceof Element)) return null;
    const tag = node.tagName.toLowerCase();
    if (tag === "a") {
      const href = node.getAttribute("href") || "",
        id = node.getAttribute("data-citation");
      const source = sources.find((s) => (id && s.id === id) || s.url === href);
      if (source)
        return (
          <SourceChip
            key={key}
            source={source}
            onClick={() => onOpen(source)}
          />
        );
      return (
        <a
          key={key}
          href={href}
          onClick={(e) => {
            if (!href.startsWith("#")) {
              e.preventDefault();
              onUnknown(href);
            }
          }}
        >
          {node.textContent}
        </a>
      );
    }
    const props: Record<string, any> = { key };
    for (const a of Array.from(node.attributes)) {
      if (
        ["class", "id", "title", "alt", "src", "colspan", "rowspan"].includes(
          a.name,
        )
      )
        props[
          (
            {
              class: "className",
              colspan: "colSpan",
              rowspan: "rowSpan",
            } as any
          )[a.name] || a.name
        ] = a.value;
    }
    if (tag === "img") {
      props.loading = "lazy";
      return React.createElement(tag, props);
    }
    if (["br", "hr"].includes(tag)) return React.createElement(tag, props);
    return React.createElement(
      tag,
      props,
      ...Array.from(node.childNodes).map((n, i) =>
        render(
          n,
          key + ":" + i,
          literal || ["pre", "code", "blockquote"].includes(tag),
        ),
      ),
    );
  }
  return (
    <div className="research-prose">
      {Array.from(doc.body.childNodes).map((n, i) => render(n, String(i)))}
    </div>
  );
}
function DocumentPreview({
  report,
  source,
  onClose,
  onVideo,
}: {
  report: Report;
  source: Source;
  onClose: () => void;
  onVideo: (source: Source) => void;
}) {
  const [data, setData] = useState<Uint8Array | null>(null),
    [html, setHtml] = useState(""),
    [error, setError] = useState(""),
    [page, setPage] = useState(1),
    [pages, setPages] = useState(0),
    [current, setCurrent] = useState(source),
    [links, setLinks] = useState<Record<string, string>>({}),
    [trail, setTrail] = useState<Source[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null),
    pdf = useRef<any>(null),
    heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const section = heading.current?.closest("section");
    if (section) section.scrollTop = 0;
    heading.current?.focus();
  }, [current.id]);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setHtml("");
    setData(null);
    setPages(0);
    setPage(1);
    void fetch(
      `/api/research/${report.research_id}/sources/${current.id}?view=reader&revision=${report.research_revision}`,
      { headers: headers(), signal: controller.signal },
    )
      .then(async (r) => {
        if (!r.ok)
          throw Error(
            "This source is unavailable for internal reading. Collected evidence is shown below.",
          );
        if (r.headers.get("Content-Type")?.includes("application/pdf"))
          setData(new Uint8Array(await r.arrayBuffer()));
        else {
          const d = await r.json();
          setHtml(d.html);
          setLinks(d.links || {});
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [current.id, report.research_id, report.research_revision]);
  useEffect(() => {
    if (!data) return;
    let gone = false;
    const task = pdfjs.getDocument({ data: data.slice() });
    task.promise
      .then((doc) => {
        if (gone) return;
        pdf.current = doc;
        setPages(doc.numPages);
      })
      .catch(() =>
        setError(
          "This PDF could not be displayed. Collected evidence remains available.",
        ),
      );
    return () => {
      gone = true;
      pdf.current = null;
      void task.destroy();
    };
  }, [data]);
  useEffect(() => {
    if (!pdf.current || !canvas.current) return;
    let render: any,
      gone = false;
    pdf.current
      .getPage(page)
      .then((p: any) => {
        if (gone || !canvas.current) return;
        const view = p.getViewport({ scale: 1.25 });
        canvas.current.width = view.width;
        canvas.current.height = view.height;
        render = p.render({ canvas: canvas.current, viewport: view });
        return render.promise;
      })
      .catch(() => {});
    return () => {
      gone = true;
      render?.cancel();
    };
  }, [page, pages]);
  return (
    <section className="research-source-preview" aria-label={current.title}>
      <header>
        <div>
          <span className="research-publication">
            <SourceIcon source={current} />
            {publication(current)}
          </span>
          <h2 ref={heading} tabIndex={-1}>
            {current.title}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close source preview"
          title="Return to report"
        >
          ×
        </button>
      </header>
      <div className="research-source-meta">
        {current.retrieved_at
          ? "Retrieved " + new Date(current.retrieved_at).toLocaleString()
          : "Source document"}
        <details>
          <summary>Source details</summary>
          <p>{current.url}</p>
          <button
            onClick={() => void navigator.clipboard.writeText(current.url)}
          >
            Copy address
          </button>
        </details>
      </div>
      {trail.length > 0 && (
        <button
          onClick={() => {
            setCurrent(trail[trail.length - 1]);
            setTrail((t) => t.slice(0, -1));
          }}
        >
          ← Previous source
        </button>
      )}
      {error ? (
        <>
          <p role="status">{error}</p>
          <p>{sourceExcerpt(current)}</p>
        </>
      ) : data ? (
        <>
          <nav aria-label="PDF pages">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>
              Page {page} of {pages || "…"}
            </span>
            <button
              disabled={!pages || page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </nav>
          <canvas ref={canvas} aria-label={"PDF page " + page} />
        </>
      ) : html ? (
        <div
          className="research-prose"
          onClick={(e) => {
            const a = (e.target as Element).closest("a");
            if (!a) return;
            e.preventDefault();
            const id = a.dataset.sourceLink;
            const fragment = a.getAttribute("href");
            if (!id && fragment?.startsWith("#")) {
              e.currentTarget
                .querySelector("#" + CSS.escape(fragment.slice(1)))
                ?.scrollIntoView({ block: "start" });
              return;
            }
            if (id && links[id]) {
              if (videoId(links[id])) {
                onVideo({
                  id,
                  title: a.textContent || "Video",
                  url: links[id],
                });
                return;
              }
              setTrail((t) => [...t, current]);
              setCurrent({
                id,
                title: a.textContent || links[id],
                url: links[id],
              });
            }
          }}
          dangerouslySetInnerHTML={{ __html: clean(html) }}
        />
      ) : (
        <p role="status">Loading source…</p>
      )}
    </section>
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
    script.onerror = () => {
      youtube = null;
      reject(Error("Video player unavailable"));
    };
    window.onYouTubeIframeAPIReady = resolve;
    document.head.append(script);
  }));
}
function videoId(url: string) {
  try {
    const u = new URL(url),
      id =
        u.hostname === "youtu.be"
          ? u.pathname.slice(1)
          : /(^|\.)youtube\.com$/.test(u.hostname)
            ? u.searchParams.get("v") || u.pathname.split("/").pop() || ""
            : "";
    return /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
type VideoDuckState = { normal: number | null; manualOverride: boolean };
function videoVolumeStep(
  state: VideoDuckState,
  value: { talking: boolean; playing: boolean; muted: boolean; volume: number },
): VideoDuckState & { setVolume?: number } {
  if (!value.talking) {
    const restore =
      state.normal !== null &&
      Math.abs(value.volume - Math.round(state.normal * 0.2)) <= 1;
    return {
      normal: null,
      manualOverride: false,
      ...(restore ? { setVolume: state.normal! } : {}),
    };
  }
  if (state.manualOverride) return state;
  if (
    state.normal !== null &&
    Math.abs(value.volume - Math.round(state.normal * 0.2)) > 1
  )
    return { normal: null, manualOverride: true };
  if (state.normal === null && value.playing && !value.muted)
    return {
      normal: value.volume,
      manualOverride: false,
      setVolume: Math.round(value.volume * 0.2),
    };
  return state;
}
const videoPositions = new Map<string, number>(),
  activePlayers = new Set<any>();
function Video({ source }: { source: Source }) {
  const target = useRef<HTMLDivElement>(null),
    player = useRef<any>(null),
    normal = useRef<number | null>(null),
    [error, setError] = useState(""),
    [playing, setPlaying] = useState(false),
    [blocked, setBlocked] = useState(false);
  useEffect(() => {
    let canceled = false,
      userSpeaking = false;
    let unregister: (() => void) | undefined;
    const id = videoId(source.url);
    if (!id) return;
    let duckState: VideoDuckState = { normal: null, manualOverride: false };
    const duck = () => {
      const p = player.current;
      if (!p?.getVolume) return;
      try {
        duckState = videoVolumeStep(duckState, {
          talking: conversationSnapshot().state === "speaking" || userSpeaking,
          playing: Number(p.getPlayerState()) === 1,
          muted: p.isMuted(),
          volume: p.getVolume(),
        });
        normal.current = duckState.normal;
        const volume = (duckState as VideoDuckState & { setVolume?: number })
          .setVolume;
        if (volume !== undefined) {
          const muted = p.isMuted();
          p.setVolume(volume);
          if (muted) p.mute();
        }
        delete (duckState as VideoDuckState & { setVolume?: number }).setVolume;
      } catch {}
    };
    const tick = () => {
      const p = player.current;
      if (!p?.getCurrentTime) return;
      try {
        videoPositions.set(id, p.getCurrentTime());
        setPlaying(Number(p.getPlayerState()) === 1);
        duck();
      } catch {}
    };
    const speech = (e: Event) => {
      userSpeaking = !!(e as CustomEvent).detail;
      duck();
    };
    void loadYouTube()
      .then(() => {
        if (canceled || !target.current) return;
        player.current = new window.YT.Player(target.current, {
          videoId: id,
          playerVars: {
            origin: location.origin,
            playsinline: 1,
            controls: 1,
            start: Math.floor(videoPositions.get(id) || 0),
          },
          events: {
            onReady: () => {
              if (!canceled) {
                player.current
                  ?.getIframe()
                  ?.setAttribute("title", source.title);
                activePlayers.add(player.current);
                const element = player.current
                  .getIframe()
                  .closest(".research-video") as HTMLElement;
                if (element)
                  unregister = registerMediaControls(
                    element,
                    async (action, value) => {
                      const p = player.current;
                      if (!p?.getPlayerState)
                        return { status: "failed", reason: "player_not_ready" };
                      if (action === "play") p.playVideo();
                      else if (action === "pause") p.pauseVideo();
                      else {
                        const n = Number(value);
                        if (
                          !Number.isFinite(n) ||
                          n < 0 ||
                          (action === "volume" && n > 100) ||
                          (action === "seek" && n > p.getDuration())
                        )
                          return {
                            status: "failed",
                            reason: "invalid_media_value",
                          };
                        if (action === "volume") {
                          normal.current = null;
                          duckState = { normal: null, manualOverride: true };
                          p.setVolume(n);
                        } else p.seekTo(n, true);
                      }
                      await new Promise((r) => setTimeout(r, 500));
                      const state = {
                        playing: Number(p.getPlayerState()) === 1,
                        volume: p.getVolume(),
                        time: p.getCurrentTime(),
                      };
                      const confirmed =
                        action === "play"
                          ? state.playing
                          : action === "pause"
                            ? !state.playing
                            : action === "volume"
                              ? Math.abs(state.volume - Number(value)) <= 1
                              : Math.abs(state.time - Number(value)) <= 2;
                      return {
                        status: confirmed ? "completed" : "unconfirmed",
                        observed: state,
                      };
                    },
                  );
              }
            },
            onStateChange: (e: any) => {
              if (canceled) return;
              setPlaying(Number(e.data) === 1);
              if (Number(e.data) === 1) {
                setBlocked(false);
                for (const other of activePlayers)
                  if (other !== player.current) other.pauseVideo();
                duck();
              }
            },
            onError: () => {
              if (!canceled)
                setError(
                  "This video is unavailable or its publisher does not allow playback here.",
                );
            },
            onAutoplayBlocked: () => {
              if (!canceled) setBlocked(true);
            },
          },
        });
      })
      .catch((e) => {
        if (!canceled) setError(e.message);
      });
    const interval = window.setInterval(tick, 300);
    window.addEventListener("nova-user-speaking", speech);
    window.addEventListener("nova-conversation", duck);
    return () => {
      tick();
      canceled = true;
      clearInterval(interval);
      window.removeEventListener("nova-user-speaking", speech);
      window.removeEventListener("nova-conversation", duck);
      unregister?.();
      activePlayers.delete(player.current);
      player.current?.destroy();
    };
  }, [source.url]);
  return (
    <article
      className="research-video"
      tabIndex={0}
      aria-label={"Video: " + source.title}
      data-video-id={videoId(source.url)}
      data-playing={playing}
    >
      {error ? <p role="status">{error}</p> : <div ref={target} />}{" "}
      {blocked && (
        <p role="status">Use the video's play button to begin playback.</p>
      )}
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
  const doc = document.implementation.createHTMLDocument("");
  const h = doc.createElement("h1");
  h.textContent = report.query;
  doc.body.append(h);
  for (const source of report.sources) {
    const heading = doc.createElement("h2"),
      p = doc.createElement("p"),
      a = doc.createElement("a");
    heading.textContent = source.title;
    p.textContent = sourceExcerpt(source);
    a.dataset.citation = source.id;
    a.href = source.url;
    a.textContent = "[" + source.id + "]";
    p.append(a);
    doc.body.append(heading, p);
  }
  return clean(doc.body.innerHTML);
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
    [query, setQuery] = useState(
      () =>
        sessionStorage.getItem(
          "nova-research-query:" + conversationSnapshot().clientId,
        ) || "",
    ),
    [mode, setMode] = useState("detailed"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState<Source | null>(null),
    [chat, setChat] = useState(conversationSnapshot()),
    [message, setMessage] = useState(""),
    [readerChars, setReaderChars] = useState(20000),
    [original, setOriginal] = useState(false),
    [editOpened, setEditOpened] = useState(false),
    [expandedVideo, setExpandedVideo] = useState(""),
    [extraMedia, setExtraMedia] = useState<Source[]>([]);
  const scopeRef = useRef("");
  const originFocus = useRef<HTMLElement | null>(null),
    chatReader = useRef<HTMLDivElement>(null),
    chatNearEnd = useRef(true),
    mediaRequested = useRef(new Set<string>());
  const loadEpoch = useRef(0),
    reader = useRef<HTMLDivElement>(null),
    lastSelection = useRef("");
  useEffect(() => {
    if (
      chat.clientId &&
      !chat.guest &&
      scopeRef.current === chat.clientId + ":" + chat.guest
    )
      sessionStorage.setItem("nova-research-query:" + chat.clientId, query);
  }, [query, chat.clientId, chat.guest]);
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
      setEditOpened(false);
      setExpandedVideo("");
      setExtraMedia([]);
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
      setQuery(
        chat.guest
          ? ""
          : sessionStorage.getItem("nova-research-query:" + chat.clientId) ||
              "",
      );
      setMessage("");
      mediaRequested.current.clear();
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
  function closePreview() {
    setPreview(null);
    requestAnimationFrame(() =>
      originFocus.current?.focus({ preventScroll: true }),
    );
  }
  useEffect(() => {
    const done = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        !document.querySelector(
          '[role="group"][aria-label="Supporting sources"]',
        )
      )
        closePreview();
    };
    window.addEventListener("keydown", done);
    return () => window.removeEventListener("keydown", done);
  }, []);
  useEffect(() => {
    if (tab === "edit") setEditOpened(true);
  }, [tab]);
  useEffect(() => {
    const el = chatReader.current;
    if (el && chatNearEnd.current) el.scrollTop = el.scrollHeight;
  }, [chat.messages]);
  useEffect(() => {
    for (const player of activePlayers) player.pauseVideo();
  }, [tab, open, preview]);
  useEffect(() => {
    if (
      !open ||
      tab !== "media" ||
      !report ||
      (report.media_status && report.media_status !== "idle")
    )
      return;
    const id = report.research_id,
      key = chat.clientId + ":" + id;
    if (mediaRequested.current.has(key)) return;
    mediaRequested.current.add(key);
    setReport((r) =>
      r?.research_id === id ? { ...r, media_status: "pending" } : r,
    );
    void api("/" + id + "/media", {
      method: "POST",
      body: JSON.stringify({ research_revision: report.research_revision }),
    })
      .then((d) => {
        if (d.media_status)
          setReport((r) => (r?.research_id === id ? { ...r, ...d } : r));
        else if (
          !["accepted", "queued", "duplicate", "completed"].includes(d.status)
        )
          throw Error(d.reason || "Video discovery unavailable");
      })
      .catch(() =>
        setReport((r) =>
          r?.research_id === id ? { ...r, media_status: "unavailable" } : r,
        ),
      );
  }, [open, tab, report?.research_id, report?.media_status, chat.clientId]);
  useEffect(() => {
    if (!open || !["pending", "running"].includes(report?.media_status || ""))
      return;
    const id = report!.research_id,
      client = chat.clientId;
    const timer = window.setInterval(() => {
      void api("/" + id + "/media")
        .then((d) => {
          if (conversationSnapshot().clientId === client)
            setReport((r) => (r?.research_id === id ? { ...r, ...d } : r));
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(timer);
  }, [open, report?.research_id, report?.media_status, chat.clientId]);
  const media = [
    ...new Map(
      [
        ...(report?.sources || []).filter((s) => videoId(s.url)),
        ...(report?.media || []),
        ...(report?.linked_sources || []).filter((s) => videoId(s.url)),
        ...extraMedia,
      ].map((s) => [videoId(s.url), s]),
    ).values(),
  ];
  function openSource(source: Source) {
    if (videoId(source.url)) {
      if (!media.some((s) => videoId(s.url) === videoId(source.url)))
        setExtraMedia((old) => [...old, source]);
      setPreview(null);
      setTab("media");
      requestAnimationFrame(() => {
        const target = document.querySelector<HTMLElement>(
          `[data-video-id="${videoId(source.url)}"]`,
        );
        target?.focus({ preventScroll: true });
        target?.scrollIntoView({
          block: "center",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
      });
      return;
    }
    originFocus.current = document.activeElement as HTMLElement;
    setPreview(source);
  }
  function openUnknown(url: string) {
    setError(
      "This link is not in the collected source evidence. Its address is " +
        url,
    );
  }
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
  return (
    <section
      className="research-workspace"
      hidden={!open}
      data-aegis-widget="research"
      aria-label="Research workspace"
    >
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
      <div className="research-layout">
        <aside className="research-outline">
          <h2>Your research</h2>
          {items.map((item) => (
            <button
              className={
                report?.research_id === item.research_id
                  ? "research-history-row selected"
                  : "research-history-row"
              }
              aria-current={
                report?.research_id === item.research_id ? "true" : undefined
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
            <button disabled={!offset} onClick={() => setOffset((v) => v - 30)}>
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
          <div className="research-stage">
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
                  hidden={tab !== "reader" || !!preview}
                  ref={reader}
                  className="research-reader"
                >
                  {report.evidence_collection && !original ? (
                    <>
                      <h1>{report.query}</h1>
                      <p className="research-evidence-label">
                        Source collection · Read the supporting passages below,
                        or inspect the full original report. Synthesis is not
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
                            onClick={() => openSource(source)}
                          />
                          <h2>{source.title}</h2>
                          <p>{sourceExcerpt(source)}</p>
                          <button onClick={() => openSource(source)}>
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
                      <ReportContent
                        text={report.report.slice(0, readerChars)}
                        sources={[
                          ...report.sources,
                          ...(report.linked_sources || []),
                        ]}
                        onOpen={openSource}
                        onUnknown={openUnknown}
                      />
                      {report.report.length > readerChars && (
                        <button
                          onClick={() => setReaderChars((v) => v + 20000)}
                        >
                          Continue reading ·{" "}
                          {report.report.length - readerChars} characters
                          remaining
                        </button>
                      )}
                    </>
                  )}
                  {!!media.length && (
                    <section
                      className="research-related-media"
                      aria-label="Related videos"
                    >
                      <h2>Related videos</h2>
                      {media.slice(0, 5).map((video) => (
                        <button
                          key={videoId(video.url)}
                          onClick={() => openSource(video)}
                        >
                          {video.thumbnail && (
                            <img src={video.thumbnail} alt="" loading="lazy" />
                          )}
                          <span>
                            {video.title}
                            <small>{video.channel || "YouTube"}</small>
                          </span>
                          <span aria-hidden="true">▷</span>
                        </button>
                      ))}
                    </section>
                  )}
                  <div className="research-source-chips">
                    {report.sources.map((source) => (
                      <SourceChip
                        key={source.id}
                        source={source}
                        onClick={() => openSource(source)}
                      />
                    ))}
                  </div>
                </div>
                {editOpened && (
                  <div
                    className="research-edit-pane"
                    hidden={tab !== "edit" || !!preview}
                  >
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
                  </div>
                )}
                <div
                  className="research-sources"
                  hidden={tab !== "sources" || !!preview}
                >
                  {report.sources.map((source) => (
                    <article className="research-source-row" key={source.id}>
                      <span className="research-publication">
                        <SourceIcon source={source} />
                        {publication(source)}
                      </span>
                      <h2>
                        <button onClick={() => openSource(source)}>
                          {source.title}
                        </button>
                      </h2>
                      <p>{sourceExcerpt(source)}</p>
                      <footer>
                        <small>
                          {source.retrieved_at
                            ? "Retrieved " +
                              new Date(source.retrieved_at).toLocaleDateString()
                            : "Date unavailable"}
                        </small>
                        {videoId(source.url) ? (
                          <button
                            aria-expanded={expandedVideo === source.id}
                            onClick={() =>
                              setExpandedVideo((v) =>
                                v === source.id ? "" : source.id,
                              )
                            }
                          >
                            {expandedVideo === source.id
                              ? "Close video ↑"
                              : "Watch video ↓"}
                          </button>
                        ) : (
                          <button onClick={() => openSource(source)}>
                            Read source →
                          </button>
                        )}
                      </footer>
                      {tab === "sources" &&
                        !preview &&
                        expandedVideo === source.id && (
                          <Video source={source} />
                        )}
                    </article>
                  ))}
                </div>
                <div
                  className="research-media"
                  hidden={tab !== "media" || !!preview}
                >
                  {["pending", "running"].includes(
                    report.media_status || "",
                  ) && (
                    <p role="status">
                      Finding relevant videos… Your report is ready to read.
                    </p>
                  )}
                  {tab === "media" &&
                    !preview &&
                    media.map((s) => (
                      <Video key={s.video_id || s.id} source={s} />
                    ))}
                  {!media.length &&
                    !["pending", "running"].includes(
                      report.media_status || "",
                    ) && (
                      <p>
                        No relevant playable videos were found for this report.
                      </p>
                    )}
                  {!!report.media_failures?.length && (
                    <p role="status">
                      Video discovery is partial:{" "}
                      {report.media_failures
                        .map((f) => f.reason.replace(/_/g, " "))
                        .join(" · ")}
                    </p>
                  )}
                </div>
              </>
            )}
            {preview && report && (
              <DocumentPreview
                key={preview.id}
                report={report}
                source={preview}
                onClose={closePreview}
                onVideo={openSource}
              />
            )}
          </div>
          <form className="research-query" onSubmit={start}>
            <textarea
              aria-label="Research topic"
              placeholder="What would you like to research?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={600}
              rows={1}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <div className="research-query-actions">
              <details>
                <summary aria-label="Research depth">
                  {mode === "detailed" ? "Detailed" : "Quick"}
                  <span aria-hidden="true">⌄</span>
                </summary>
                <div role="group" aria-label="Research depth options">
                  {["quick", "detailed"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={mode === v}
                      onClick={(e) => {
                        setMode(v);
                        e.currentTarget
                          .closest("details")
                          ?.removeAttribute("open");
                      }}
                    >
                      {v === "quick" ? "Quick search" : "Detailed research"}
                    </button>
                  ))}
                </div>
              </details>
              <button
                className="research-submit"
                aria-label={busy ? "Starting research" : "Start research"}
                disabled={
                  busy || !chat.connected || chat.guest || !query.trim()
                }
              >
                {busy ? "…" : "↑"}
              </button>
            </div>
          </form>
        </main>
        <aside className="research-assistant">
          <header>
            <span className="research-eyebrow">AEGIS</span>
            <span className="research-chat-label">Research conversation</span>
          </header>
          <div
            className="research-chat"
            role="log"
            aria-label="Conversation with Aegis"
            ref={chatReader}
            onScroll={(e) => {
              const el = e.currentTarget;
              chatNearEnd.current =
                el.scrollHeight - el.scrollTop - el.clientHeight < 70;
            }}
          >
            {chat.messages.map((m) => (
              <article key={m.id} data-speaker={m.role}>
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
                className="research-mic"
                type="button"
                aria-label={
                  chat.muted ? "Unmute microphone" : "Mute microphone"
                }
                onClick={requestMicrophone}
              >
                {chat.muted ? "Mic off" : "Mic on"}
              </button>
              <button
                aria-label="Send message to Aegis"
                disabled={!chat.connected || !message.trim()}
              >
                ↑
              </button>
            </div>
          </form>
          <small>{chat.status || chat.state}</small>
        </aside>
      </div>
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
