import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Mark, Node as TiptapNode, mergeAttributes } from "@tiptap/core";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import DOMPurify from "dompurify";
import { marked } from "marked";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  conversationSnapshot,
  conversationResearch,
  requestConversation,
  requestMicrophone,
  updateUiContext,
} from "../../conversation";
import { notify, cue } from "../../notifications";
import {
  registerRichEditor,
  registerMediaControls,
} from "../../aegisWidgetProtocol";
import "./ResearchWorkspace.css";
import {
  AttachmentAssets,
  AttachmentReader,
  Attachment,
  AttachmentDestination,
  attachmentHeaders,
  documentApi,
} from "./DocumentAttachments";
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
const ScopedImage = Image.extend({
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("img");
      dom.alt = node.attrs.alt || "";
      const src = String(node.attrs.src || "");
      let blob = "";
      const controller = new AbortController();
      if (
        /^\/api\/research\/[a-f0-9]{32}\/(?:attachments\/[a-f0-9]{32}\/images\/A[a-f0-9]{24}|images\/I[a-f0-9]{24})$/.test(
          src,
        )
      ) {
        void fetch(src, { headers: headers(), signal: controller.signal })
          .then((r) => {
            if (!r.ok) throw Error();
            return r.blob();
          })
          .then((b) => {
            if (controller.signal.aborted) return;
            blob = URL.createObjectURL(b);
            dom.src = blob;
          })
          .catch(() => {
            dom.hidden = true;
          });
      } else dom.src = src;
      return {
        dom,
        destroy() {
          controller.abort();
          if (blob) URL.revokeObjectURL(blob);
        },
      };
    };
  },
});
function IllustratedPreview({ html }: { html: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController(),
      urls: string[] = [];
    root.current
      ?.querySelectorAll<HTMLImageElement>("img[data-asset]")
      .forEach((img) => {
        const src = img.dataset.asset || "";
        if (
          !/^\/api\/research\/[a-f0-9]{32}\/(?:attachments\/[a-f0-9]{32}\/images\/A[a-f0-9]{24}|images\/I[a-f0-9]{24})$/.test(
            src,
          )
        ) {
          img.remove();
          return;
        }
        void fetch(src, { headers: headers(), signal: controller.signal })
          .then((r) => {
            if (!r.ok) throw Error();
            return r.blob();
          })
          .then((b) => {
            if (controller.signal.aborted) return;
            const url = URL.createObjectURL(b);
            urls.push(url);
            img.src = url;
          })
          .catch(() => img.remove());
      });
    return () => {
      controller.abort();
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [html]);
  const safe = useMemo(() => {
    const doc = new DOMParser().parseFromString(clean(html), "text/html");
    doc.querySelectorAll("img").forEach((img) => {
      img.dataset.asset = img.getAttribute("src") || "";
      img.removeAttribute("src");
    });
    return doc.body.innerHTML;
  }, [html]);
  return (
    <div
      ref={root}
      className="document-illustrated-copy"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
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
  attachment_id?: string;
  attachment_revision?: string;
  reference_kind?: string;
  origin_research_id?: string;
  attachment_origin_id?: string;
  page?: number;
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
  kind?: "research" | "documentary" | "chat";
  attachments?: Attachment[];
  attachment_images?: ResearchImage[];
  document_revisions?: { id: string; status: string }[];
  linked_sources?: Source[];
  media?: Source[];
  media_revision?: string;
  media_status?: string;
  media_failures?: { reason: string }[];
  legacy_evidence?: boolean;
  evidence_collection?: boolean;
  display_title?: string;
  reader_end?: number;
  extension_revision?: string;
  extension_activity?: {
    phase?: string;
    view?: string;
    reason?: string;
    job_id?: string;
  };
  next_cursor?: number | null;
  thread_id?: string;
  phase?: string;
  next_attempt?: number;
  processing_seconds?: number;
  active_since?: number | null;
  waiting_reason?: string;
  image_items?: ResearchImage[];
  images_prepared?: boolean;
  image_sources?: Source[];
  research_cards?: { id: string; title: string; revision: string }[];
  extensions?: {
    report: string;
    next_cursor: number | null;
    reader_end: number;
    blocks: { id: string; text: string }[];
  };
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
function researchDestination(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, "")),
    id = params.get("research"),
    source = params.get("source") || "";
  return id &&
    /^[a-f0-9]{32}$/.test(id) &&
    (!source || /^S[1-9][0-9]*$/.test(source))
    ? { id, source }
    : null;
}
function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    mic: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3",
    more: "M5 12h.01M12 12h.01M19 12h.01",
    trash: "M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7",
    arrow: "M12 19V5m-6 6 6-6 6 6",
    close: "m6 6 12 12M6 18 18 6",
    depth: "M4 6h16M7 12h10M10 18h4",
    plus: "M12 5v14M5 12h14",
    download: "M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4",
    play: "m9 5 11 7-11 7Z",
    bold: "M6 12h7a4 4 0 0 0 0-8H6v16h8a4 4 0 0 0 0-8",
    italic: "M10 4h10M4 20h10M15 4 9 20",
    strike: "M4 12h16M17 6c-2-4-10-3-10 1m0 9c2 4 10 3 10-1",
    heading: "M5 4v16M19 4v16M5 12h14",
    list: "M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1",
    ordered: "M10 5h11M10 12h11M10 19h11M3 3v5M2 8h3M2 14c3-4 5 0 0 4h4",
    quote: "M4 6h6v7H4c0 4 2 5 4 5M14 6h6v7h-6c0 4 2 5 4 5",
    code: "m8 6-6 6 6 6m8-12 6 6-6 6",
    link: "m9 15 6-6M8 17l-1 1a4 4 0 0 1-6-6l4-4m8-1 1-1a4 4 0 0 1 6 6l-4 4",
    image: "M3 3h18v18H3ZM3 17l6-7 5 5 3-3 4 5",
    table: "M3 3h18v18H3ZM3 9h18M3 15h18M9 3v18M15 3v18",
    citation: "M4 4h16v16H4Zm4 5v6m8-6v6",
    undo: "M9 4 3 10l6 6M3 10h11a6 6 0 0 1 6 6",
    redo: "m15 4 6 6-6 6m6-6H10a6 6 0 0 0-6 6",
    save: "M4 3h13l4 4v14H3V3Zm3 0v6h10V3M7 21v-8h10v8",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.link} />
    </svg>
  );
}
function previewPlacement(
  trigger: DOMRect,
  width: number,
  height: number,
  viewWidth: number,
  viewHeight: number,
) {
  const edge = 12,
    gap = 10,
    below = viewHeight - trigger.bottom - edge,
    above = trigger.top - edge;
  let top =
    below >= height
      ? trigger.bottom + gap
      : above >= height
        ? trigger.top - height - gap
        : edge;
  let left = Math.max(edge, Math.min(trigger.left, viewWidth - width - edge));
  if (below < height && above < height) {
    if (viewWidth - trigger.right > width + gap) left = trigger.right + gap;
    else if (trigger.left > width + gap) left = trigger.left - width - gap;
    else
      top = below >= above ? trigger.bottom + gap : trigger.top - height - gap;
  }
  return {
    left,
    top: Math.max(edge, Math.min(top, viewHeight - height - edge)),
  };
}
const PageBreak = TiptapNode.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  parseHTML: () => [{ tag: "div[data-page-break]" }],
  renderHTML: () => [
    "div",
    { "data-page-break": "true", class: "document-page-break" },
  ],
});
const DocumentVideo = TiptapNode.create({
  name: "documentVideo",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      url: { default: "", parseHTML: (e) => e.getAttribute("data-video-url") },
      title: {
        default: "Video",
        parseHTML: (e) => e.getAttribute("data-video-title"),
      },
    };
  },
  parseHTML: () => [{ tag: "div[data-video-url]" }],
  renderHTML: ({ node }) => [
    "div",
    { "data-video-url": node.attrs.url, "data-video-title": node.attrs.title },
  ],
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div"),
        root = createRoot(dom);
      if (videoId(node.attrs.url))
        root.render(
          <Video
            source={{
              id: node.attrs.url,
              url: node.attrs.url,
              title: node.attrs.title,
            }}
          />,
        );
      return {
        dom,
        destroy() {
          queueMicrotask(() => root.unmount());
        },
      };
    };
  },
});
function PDFExportPreview({
  preview,
  onClose,
}: {
  preview: { url: string; name: string };
  onClose: () => void;
}) {
  const [doc, setDoc] = useState<any>(null),
    [page, setPage] = useState(1),
    [width, setWidth] = useState(700),
    [error, setError] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null),
    host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const task = pdfjs.getDocument({ url: preview.url });
    let active = true;
    task.promise
      .then((pdf) => {
        if (active) setDoc(pdf);
      })
      .catch(() => {
        if (active)
          setError(
            "The PDF preview could not be rendered. You can still download the file.",
          );
      });
    return () => {
      active = false;
      void task.destroy();
    };
  }, [preview.url]);
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.max(200, entries[0].contentRect.width - 32)),
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!doc || !canvas.current) return;
    let active = true,
      render: any;
    doc
      .getPage(page)
      .then((pdfPage: any) => {
        if (!active || !canvas.current) return;
        const viewport = pdfPage.getViewport({
            scale: Math.min(
              width / pdfPage.getViewport({ scale: 1 }).width,
              1.5,
            ),
          }),
          ratio = Math.min(devicePixelRatio || 1, 2),
          target = canvas.current;
        target.width = viewport.width * ratio;
        target.height = viewport.height * ratio;
        target.style.width = viewport.width + "px";
        target.style.height = viewport.height + "px";
        render = pdfPage.render({
          canvasContext: target.getContext("2d"),
          viewport,
          transform: [ratio, 0, 0, ratio, 0, 0],
        });
        return render.promise;
      })
      .catch(() => {
        if (active) setError("This preview page could not be rendered.");
      });
    return () => {
      active = false;
      render?.cancel();
    };
  }, [doc, page, width]);
  return (
    <div
      className="document-export-preview"
      role="dialog"
      aria-modal="true"
      aria-label="PDF export preview"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <header>
        <strong>PDF preview</strong>
        <button
          disabled={!doc || page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous page
        </button>
        <span>
          Page {page} of {doc?.numPages || "…"}
        </span>
        <button
          disabled={!doc || page >= doc.numPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next page
        </button>
        <a href={preview.url} download={preview.name}>
          Download PDF
        </a>
        <button autoFocus aria-label="Close PDF preview" onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>
      <div className="document-export-pages" ref={host}>
        {error && <p role="alert">{error}</p>}
        {!doc && !error && <p role="status">Preparing PDF preview…</p>}
        <canvas ref={canvas} aria-label={"PDF preview page " + page} />
      </div>
    </div>
  );
}
function DocumentPaperPreview({
  report,
  onLink,
}: {
  report: Report;
  onLink: (url: string) => void;
}) {
  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      TableKit,
      ScopedImage,
      Citation,
      PageBreak,
      DocumentVideo,
    ],
    content: report.draft?.html || "<p></p>",
    editorProps: { attributes: { "aria-label": "Document preview" } },
  });
  useEffect(() => {
    if (editor) editor.commands.setContent(report.draft?.html || "<p></p>");
  }, [editor, report.draft?.revision]);
  return (
    <div
      className="document-paper-editor document-paper-preview"
      onClick={(e) => {
        const link = (e.target as Element).closest("a");
        if (link) {
          e.preventDefault();
          onLink(link.getAttribute("href") || "");
        }
      }}
    >
      <EditorContent editor={editor} />
    </div>
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
    extensions: [
      StarterKit,
      TableKit,
      ScopedImage,
      Citation,
      PageBreak,
      DocumentVideo,
    ],
    onSelectionUpdate: ({ editor }) =>
      updateUiContext({
        editor_selection: editor.state.doc
          .textBetween(
            editor.state.selection.from,
            editor.state.selection.to,
            " ",
          )
          .slice(0, 600),
        editor_draft_revision: revision.current,
      }),
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
      updateUiContext({ editor_draft_revision: revision.current });
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
  useEffect(() => {
    document
      .querySelectorAll<HTMLButtonElement>(".research-editor-toolbar button")
      .forEach((b) => {
        if (!b.title) b.title = b.textContent?.trim() || "";
      });
  });
  if (!editor) return null;
  return (
    <div
      className={
        "research-editor" +
        (report.kind === "documentary" ? " document-paper-editor" : "")
      }
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
            title={mark}
            aria-label={mark}
            aria-pressed={editor.isActive(mark)}
            onClick={() => editor.chain().focus().toggleMark(mark).run()}
          >
            <Icon name={mark} />
            <span className="research-sr-only">{mark}</span>
          </button>
        ))}
        <button
          aria-pressed={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Icon name="heading" />
          <span className="research-sr-only">Heading</span>
        </button>
        <button
          aria-pressed={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <Icon name="list" />
          <span className="research-sr-only">List</span>
        </button>
        <button
          aria-pressed={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <Icon name="ordered" />
          <span className="research-sr-only">Numbered</span>
        </button>
        <button
          aria-pressed={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Icon name="quote" />
          <span className="research-sr-only">Quote</span>
        </button>
        <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Icon name="code" />
          <span className="research-sr-only">Code</span>
        </button>
        <button
          onClick={() => {
            const href = prompt("Link URL");
            if (href && /^https?:\/\//.test(href))
              editor.chain().focus().setLink({ href }).run();
          }}
        >
          <Icon name="link" />
          <span className="research-sr-only">Link</span>
        </button>
        <button
          onClick={() => {
            const images = [
              ...(report.image_items || []),
              ...(report.attachment_images || []),
            ];
            if (!images.length) {
              alert("Attach an image or collect source images first.");
              return;
            }
            const choice = prompt(
              images.map((image, i) => i + 1 + ". " + image.caption).join("\n"),
              "1",
            );
            const image = images[Number(choice) - 1];
            if (image)
              editor
                .chain()
                .focus()
                .setImage({
                  src:
                    image.url ||
                    "/api/research/" +
                      report.research_id +
                      "/images/" +
                      image.id,
                  alt: image.caption,
                })
                .run();
          }}
        >
          <Icon name="image" />
          <span className="research-sr-only">Image</span>
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
          <Icon name="table" />
          <span className="research-sr-only">Table</span>
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
          <Icon name="citation" />
          <span className="research-sr-only">Citation</span>
        </button>
        {report.kind === "documentary" && (
          <button
            title="Insert video"
            aria-label="Insert video"
            onClick={() => {
              const url = prompt("YouTube video URL");
              if (url && videoId(url))
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: "documentVideo",
                    attrs: { url, title: "Supporting video" },
                  })
                  .run();
            }}
          >
            <Icon name="play" />
          </button>
        )}
        {report.kind === "documentary" && (
          <button
            title="Page break"
            aria-label="Insert page break"
            onClick={() =>
              editor.chain().focus().insertContent({ type: "pageBreak" }).run()
            }
          >
            Page break
          </button>
        )}
        <button
          title="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Icon name="undo" />
          <span className="research-sr-only">Undo</span>
        </button>
        <button
          title="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Icon name="redo" />
          <span className="research-sr-only">Redo</span>
        </button>
        <button
          disabled={pending.current || conflict}
          onClick={() => void save()}
        >
          <Icon name="save" />
          <span className="research-sr-only">Save</span>
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
  if (source.attachment_id) return source.title.split(" · Page")[0];
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
    timer = useRef<number>(0),
    card = useRef<HTMLDivElement>(null);
  const show = () => {
    clearTimeout(timer.current);
    if (!position) setPosition({ left: 12, top: 12 });
  };
  useLayoutEffect(() => {
    if (!position || !card.current || !button.current) return;
    const r = card.current.getBoundingClientRect();
    const next = previewPlacement(
      button.current.getBoundingClientRect(),
      r.width,
      r.height,
      innerWidth,
      innerHeight,
    );
    if (position.left !== next.left || position.top !== next.top)
      setPosition(next);
  }, [position]);
  const hide = () => {
    timer.current = window.setTimeout(() => setPosition(null), 300);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!position) return;
    const close = (e: Event) => {
      if (e.target instanceof Node && card.current?.contains(e.target)) return;
      setPosition(null);
    };
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
          if (e.key === "Escape") {
            setPosition(null);
            e.stopPropagation();
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            show();
            requestAnimationFrame(() =>
              card.current?.querySelector<HTMLButtonElement>("button")?.focus(),
            );
          }
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
            ref={card}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                setPosition(null);
                button.current?.focus();
              }
              if (["ArrowDown", "ArrowUp"].includes(e.key)) {
                e.preventDefault();
                const all = Array.from(
                  card.current?.querySelectorAll<HTMLButtonElement>("button") ||
                    [],
                );
                all[
                  (all.indexOf(document.activeElement as HTMLButtonElement) +
                    (e.key === "ArrowDown" ? 1 : all.length - 1)) %
                    all.length
                ]?.focus();
              }
            }}
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
                  button.current?.focus({ preventScroll: true });
                  setPosition(null);
                  onClick(s);
                }}
              >
                <span className="research-publication">
                  <SourceIcon source={s} />
                  {publication(s)}
                </span>
                {s.thumbnail && (
                  <img
                    className="research-preview-image"
                    src={s.thumbnail}
                    alt=""
                    loading="lazy"
                    onError={(e) => (e.currentTarget.hidden = true)}
                  />
                )}
                <strong>{s.title}</strong>
                {s.attachment_id && (
                  <small>
                    {s.reference_kind === "block"
                      ? "Document blocks"
                      : "Page " + (s.page || 1)}{" "}
                    · View in document
                  </small>
                )}
                {videoId(s.url) && <small>Video description · YouTube</small>}
                <span>{sourceExcerpt(s).slice(0, 240)}</span>
                {videoId(s.url) && videoTimestamp(s.url) !== null && (
                  <small>
                    Play at {Math.floor(videoTimestamp(s.url)! / 60)}:
                    {String(videoTimestamp(s.url)! % 60).padStart(2, "0")}
                  </small>
                )}
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
function researchProgress(
  phase: string,
  seconds: number,
  activeSince: number | null | undefined,
  now: number,
  sourceCount: number,
) {
  const active = [
    "collecting_sources",
    "comparing_evidence",
    "preparing_report",
  ].includes(phase);
  const elapsed =
    Math.max(0, seconds) +
    (active && typeof activeSince === "number"
      ? Math.max(0, now / 1000 - activeSince)
      : 0);
  const whole = Math.floor(elapsed);
  return {
    active,
    elapsed,
    label: active
      ? "Working"
      : phase === "queued"
        ? "Queued"
        : phase === "failed"
          ? "Research interrupted"
          : "Summary pending",
    time:
      String(Math.floor(whole / 60)).padStart(2, "0") +
      ":" +
      String(whole % 60).padStart(2, "0"),
    skeleton: active && sourceCount === 0 && elapsed >= 1.5,
  };
}
function PendingResearch({
  report,
  onOpen,
  onImage,
}: {
  report: Report;
  onOpen: (source: Source) => void;
  onImage: (image: ResearchImage) => void;
}) {
  const [now, setNow] = useState(Date.now());
  const status = researchProgress(
    report.phase || "queued",
    report.processing_seconds || 0,
    report.active_since,
    now,
    report.sources.length,
  );
  useEffect(() => {
    if (!status.active) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [report.phase]);
  return (
    <section className="research-progress" aria-label="Research progress">
      <h1>{report.display_title || report.query}</h1>
      <div className="research-working-status">
        <span
          className={
            status.active
              ? "research-working-dot active"
              : "research-working-dot"
          }
          aria-hidden="true"
        />
        <span role="status">{status.label}</span>
        {(status.active || typeof report.processing_seconds === "number") && (
          <span
            className="research-working-time"
            aria-label={"Processing time " + status.time}
          >
            {status.time}
            {!status.active ? " worked" : ""}
          </span>
        )}
        {report.phase === "waiting_for_quota" && (
          <details className="research-wait-explanation">
            <summary>Why the wait?</summary>
            <p>
              The report-writing service has reached its usage limit. Your
              collected findings are available below, and the summary will
              resume automatically when the service is available.
            </p>
          </details>
        )}
      </div>
      {!!report.image_items?.length && (
        <EvidenceGallery images={report.image_items} reportId={report.research_id} onOpen={onImage} />
      )}
      {status.skeleton && (
        <div className="research-loading-lines" aria-hidden="true">
          {[0, 1].map((n) => (
            <div className="research-skeleton" key={n}>
              <i />
              <i />
              <i />
              <i />
            </div>
          ))}
        </div>
      )}
      {!!report.sources.length && (
        <section
          className="research-collected-findings"
          aria-label="Collected findings"
        >
          <h2>Collected findings</h2>
          <p className="research-evidence-label">
            Supporting passages from the sources found so far.
          </p>
          {report.sources.map((source) => (
            <article
              className="research-evidence-card"
              id={"source-" + source.id}
              key={source.id}
            >
              <h2>{source.title}</h2>
              <p>
                {sourceExcerpt(source)}{" "}
                <SourceChip source={source} onClick={() => onOpen(source)} />
              </p>
              <button
                className="research-inline-action"
                onClick={() => onOpen(source)}
              >
                Read source
              </button>
            </article>
          ))}
        </section>
      )}
      {!status.active && !report.sources.length && (
        <p>
          {report.phase === "failed"
            ? "No findings are available. Please try this research again."
            : "Waiting to continue. Findings will appear here as soon as sources arrive."}
        </p>
      )}
    </section>
  );
}
function citationParts(
  value: string,
  sources: Source[],
  literal = false,
): (string | Source[])[] {
  if (literal) return [value];
  return value
    .split(/((?:\[S\d+(?:\s*[,;]\s*S\d+)*\](?:[ \t]*)){1,})/g)
    .map((part) => {
      const ids = [
        ...new Set(
          [...part.matchAll(/\[(S\d+(?:\s*[,;]\s*S\d+)*)\]/g)].flatMap(
            (m) => m[1].match(/S\d+/g) || [],
          ),
        ),
      ];
      const refs = ids.map((id) => sources.find((s) => s.id === id));
      if (ids.length && refs.every(Boolean)) return refs as Source[];
      return part.replace(/^(?:\p{Extended_Pictographic}\uFE0F?\s+)+/u, "");
    });
}
// Transform parsed text nodes only: citations cannot modify code, HTML attributes or URLs.
type ResearchImage = {
  width?: number;
  height?: number;
  placement_text?: string;
  layout?: string;
  url?: string;
  id: string;
  caption: string;
  source_id: string;
  publication: string;
};
function EvidenceImage({
  image,
  reportId,
  onOpen,
}: {
  image: ResearchImage;
  reportId: string;
  onOpen: () => void;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true,
      blob = "";
    const controller = new AbortController();
    fetch(
      image.url &&
        /^\/api\/research\/[a-f0-9]{32}\/(?:attachments\/[a-f0-9]{32}\/images\/A[a-f0-9]{24}|images\/I[a-f0-9]{24})$/.test(
          image.url,
        )
        ? image.url
        : "/api/research/" + reportId + "/images/" + image.id,
      {
        headers: headers(),
        signal: controller.signal,
      },
    )
      .then((r) => {
        if (!r.ok) throw Error();
        return r.blob();
      })
      .then((b) => {
        blob = URL.createObjectURL(b);
        if (active) setUrl(blob);
        else URL.revokeObjectURL(blob);
      })
      .catch(() => {});
    return () => {
      active = false;
      controller.abort();
      if (blob) URL.revokeObjectURL(blob);
    };
  }, [reportId, image.id]);
  if (!url) return null;
  return (
    <figure className="research-evidence-image">
      <button onClick={onOpen} aria-label={"Enlarge image: " + image.caption}>
        <img src={url} alt={image.caption} style={{objectFit: "scale-down"}} onError={() => setUrl("")} />
      </button>
      <figcaption>
        {image.caption}
        <small>{image.publication}</small>
      </figcaption>
    </figure>
  );
}
function imageComposition(images: {width?: number; height?: number; caption?: string; layout?: string}[], passage: string) {
  if (!images.length) return "none";
  if (images.length > 1) {
    return images.length === 2 && passage.length >= 700 && images.every(image => (image.width || 1) / (image.height || 1) >= 1.1) ? "pair" : "gallery";
  }
  const image = images[0];
  const ratio = image.width && image.height ? image.width / image.height : image.layout === "wide" ? 2.3 : 1.4;
  const diagram = /\b(chart|diagram|infographic|map|schematic|timeline)\b/i.test(image.caption || "");
  if (ratio >= 2.25 || (diagram && ratio >= 1.25)) return "wide";
  if (ratio < 0.85 && passage.length >= 280) return "portrait";
  return passage.length >= 280 ? "aside" : "compact";
}

function EvidenceGallery({ images, reportId, onOpen, layout = "gallery" }: {
  images: ResearchImage[]; reportId: string; onOpen: (image: ResearchImage) => void; layout?: string;
}) {
  const [limit, setLimit] = useState(5);
  return <>
    <div className={"research-image-composition " + layout}>
      {images.slice(0, limit).map(image => <EvidenceImage key={image.id} image={image} reportId={reportId} onOpen={() => onOpen(image)} />)}
    </div>
    {images.length > limit && <button className="research-inline-action" onClick={() => setLimit(value => value + 5)}>Show more images ({images.length - limit})</button>}
  </>;
}

function SourceArticle({ html, images, reportId, onImage }: {
  html: string; images: ResearchImage[]; reportId: string; onImage: (image: ResearchImage) => void;
}) {
  const doc = new DOMParser().parseFromString(clean(html), "text/html");
  function render(node: Node, key: string): React.ReactNode {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (!(node instanceof Element)) return null;
    const tag = node.tagName.toLowerCase();
    if (tag === "img") {
      const image = images.find(item => item.id === node.getAttribute("data-research-image"));
      return image ? <EvidenceImage key={key} image={image} reportId={reportId} onOpen={() => onImage(image)} /> : null;
    }
    const props: Record<string, any> = { key };
    for (const attribute of Array.from(node.attributes)) {
      if (["id", "href", "data-source-link", "colspan", "rowspan"].includes(attribute.name))
        props[attribute.name === "colspan" ? "colSpan" : attribute.name === "rowspan" ? "rowSpan" : attribute.name] = attribute.value;
    }
    if (["br", "hr"].includes(tag)) return React.createElement(tag, props);
    const children = Array.from(node.childNodes).map((child, index) => render(child, key + ":" + index));
    if (["p", "a"].includes(tag) && node.querySelector("img")) return <div key={key}>{children}</div>;
    return React.createElement(tag, props, ...children);
  }
  return <>{Array.from(doc.body.childNodes).map((node, index) => render(node, String(index)))}</>;
}

function ImageViewer({
  image,
  reportId,
  onClose,
  onSource,
}: {
  image: ResearchImage;
  reportId: string;
  onClose: () => void;
  onSource: () => void;
}) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const origin = document.activeElement as HTMLElement;
    close.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab") {
        const buttons = Array.from(
          document.querySelectorAll<HTMLButtonElement>(
            ".research-image-viewer button",
          ),
        );
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", key, true);
    return () => {
      window.removeEventListener("keydown", key, true);
      origin?.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <div
      className="research-image-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={image.caption}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section>
        <button
          ref={close}
          className="research-image-close"
          aria-label="Close image"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
        <EvidenceImage image={image} reportId={reportId} onOpen={() => {}} />
        <button className="research-inline-action" onClick={onSource}>
          Read image source
        </button>
      </section>
    </div>,
    document.body,
  );
}
function ReportContent({
  text,
  sources,
  onOpen,
  onUnknown,
  images = [],
  reportId = "",
  onImage,
}: {
  text: string;
  sources: Source[];
  onOpen: (s: Source) => void;
  onUnknown: (url: string) => void;
  images?: ResearchImage[];
  reportId?: string;
  onImage?: (image: ResearchImage) => void;
}) {
  const doc = useMemo(
    () => new DOMParser().parseFromString(markdown(text), "text/html"),
    [text],
  );
  const placed = new Set<string>();
  function render(node: Node, key: string, literal = false): React.ReactNode {
    if (node.nodeType === Node.TEXT_NODE) {
      const value = node.textContent || "";
      if (
        !value.trim() &&
        ["TABLE", "THEAD", "TBODY", "TFOOT", "TR", "COLGROUP"].includes(
          node.parentElement?.tagName || "",
        )
      )
        return null;
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
    if (tag === "img") return null; // Report images use scoped, validated artifact IDs.
    if (["br", "hr"].includes(tag)) return React.createElement(tag, props);
    const passage = (node.textContent || "")
      .replace(/\[S\d+(?:\s*[,;]\s*S\d+)*\]/g, "")
      .trim();
    const relatedImages =
      !literal && ["p", "li"].includes(tag)
        ? images
            .filter(
              (image) =>
                !placed.has(image.id) &&
                (image.placement_text
                  ? passage.includes(image.placement_text.slice(0, 60))
                  : node.textContent?.includes("[" + image.source_id + "]")),
            )
        : [];
    relatedImages.forEach((image) => placed.add(image.id));
    const related = relatedImages[0];
    const composition = imageComposition(relatedImages, passage);
    const illustration = (
      <EvidenceGallery images={relatedImages} reportId={reportId} onOpen={image => onImage?.(image)} layout={composition} />
    );
    const content = React.createElement(
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
    if (related && tag === "li")
      return React.createElement(
        "li",
        { ...props, className: "research-illustrated-block" },
        illustration,
        ...Array.from(node.childNodes).map((n, i) =>
          render(n, key + ":" + i, literal),
        ),
      );
    return related ? (
      <div className="research-illustrated-block" key={key}>
        {composition !== "wide" && illustration}
        {content}
        {composition === "wide" && illustration}
      </div>
    ) : (
      content
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
    [articleImages, setArticleImages] = useState<ResearchImage[]>([]),
    [trail, setTrail] = useState<Source[]>([]),
    [sourceImage, setSourceImage] = useState<ResearchImage | null>(null);
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
    setArticleImages([]);
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
          setArticleImages(d.images || []);
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
          <Icon name="close" />
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
      {!html && !!report.image_items?.some((i) => i.source_id === current.id) && (
        <div className="research-image-composition gallery">
          {report.image_items
            .filter((i) => i.source_id === current.id)
            .map((image) => (
              <EvidenceImage
                key={image.id}
                image={image}
                reportId={report.research_id}
                onOpen={() => setSourceImage(image)}
              />
            ))}
        </div>
      )}
      {sourceImage && (
        <ImageViewer
          image={sourceImage}
          reportId={report.research_id}
          onClose={() => setSourceImage(null)}
          onSource={() => setSourceImage(null)}
        />
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
        >
          <SourceArticle html={html} images={articleImages} reportId={report.research_id} onImage={setSourceImage} />
        </div>
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
    const timeout = window.setTimeout(() => {
      youtube = null;
      reject(Error("Video player timed out. Please reopen Media to retry."));
    }, 12000);
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      resolve();
    };
    script.addEventListener("error", () => clearTimeout(timeout));
    document.head.append(script);
  }));
}
function videoTimestamp(url: string): number | null {
  try {
    const value =
      new URL(url).searchParams.get("t") ||
      new URL(url).searchParams.get("start");
    if (!value) return null;
    if (/^\d+$/.test(value)) {
      const n = Number(value);
      return n <= 86400 ? n : null;
    }
    const m = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    if (!m || !m.slice(1).some(Boolean)) return null;
    const n =
      Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
    return n <= 86400 ? n : null;
  } catch {
    return null;
  }
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
function pausePlayers(except?: any) {
  for (const p of activePlayers) {
    if (p === except) continue;
    try {
      p.pauseVideo();
    } catch {
      activePlayers.delete(p);
    }
  }
}
class MediaBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p role="status">
        This player could not load. Other research content is still available.
      </p>
    ) : (
      this.props.children
    );
  }
}
function mergeMedia(rows: Source[]): Source[] {
  const found = new Map<string, Source>();
  for (const source of rows) {
    const id = source && videoId(source.url);
    if (id && !found.has(id)) found.set(id, source);
  }
  return [...found.values()];
}
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
    const readyTimeout = window.setTimeout(() => {
      if (!canceled)
        setError("This video could not connect. Try reopening Media.");
    }, 18000);
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
        const mount = document.createElement("div");
        target.current.replaceChildren(mount);
        player.current = new window.YT.Player(mount, {
          videoId: id,
          playerVars: {
            origin: location.origin,
            playsinline: 1,
            controls: 1,
            start: Math.floor(videoPositions.get(id) || 0),
          },
          events: {
            onReady: () => {
              clearTimeout(readyTimeout);
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
                pausePlayers(player.current);
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
      clearTimeout(readyTimeout);
      window.removeEventListener("nova-user-speaking", speech);
      window.removeEventListener("nova-conversation", duck);
      unregister?.();
      activePlayers.delete(player.current);
      try {
        player.current?.destroy();
      } catch {}
      player.current = null;
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
      <div ref={target} hidden={!!error} />
      {error && <p role="status">{error}</p>}
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
  if (report.kind === "documentary" && report.phase === "draft")
    return "<p></p>";
  if (!report.evidence_collection) {
    const doc = new DOMParser().parseFromString(
      markdown(report.report + (report.extensions?.report || "")),
      "text/html",
    );
    for (const image of [
      ...(report.image_items || []),
      ...(report.attachment_images || []),
    ]) {
      const p = Array.from(doc.querySelectorAll("p,li")).find((p) =>
        image.placement_text
          ? p.textContent?.includes(image.placement_text.slice(0, 50))
          : p.textContent?.includes("[" + image.source_id + "]"),
      );
      if (p) {
        const img = doc.createElement("img");
        img.src =
          image.url ||
          "/api/research/" + report.research_id + "/images/" + image.id;
        img.alt = image.caption;
        p.before(img);
      }
    }
    return doc.body.innerHTML;
  }
  const doc = document.implementation.createHTMLDocument("");
  const h = doc.createElement("h1");
  h.textContent = report.display_title || report.query;
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
function ContinuationStatus({
  activity,
  view,
}: {
  activity: Report["extension_activity"];
  view: string;
}) {
  if (!activity || activity.view !== view) return null;
  const active = ["queued", "collecting_sources", "preparing_report"].includes(
    activity.phase || "",
  );
  return (
    <section
      className="research-continuation"
      aria-label="Research continuation"
    >
      <p role="status">
        {active
          ? "Adding more " + (view === "reader" ? "details" : view) + "…"
          : activity.phase === "waiting_for_quota"
            ? "More details are pending. Your current findings remain available."
            : activity.reason === "no_more_videos"
              ? "No more relevant videos were returned for this topic."
              : activity.reason === "no_more_sources"
                ? "No additional sources were returned."
                : activity.phase === "failed"
                  ? "Additional results could not be retrieved. Your current findings are preserved."
                  : ""}
      </p>
      {active && (
        <div className="research-skeleton" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
      )}
    </section>
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
    [imageView, setImageView] = useState<ResearchImage | null>(null),
    [original, setOriginal] = useState(false),
    [editOpened, setEditOpened] = useState(false),
    [expandedVideo, setExpandedVideo] = useState(""),
    [extraMedia, setExtraMedia] = useState<Source[]>([]);
  const scopeRef = useRef("");
  const [exportDestination, setExportDestination] = useState<{
    id: string;
    source: string;
  } | null>(null);
  useEffect(() => {
    const follow = () => {
      const destination = researchDestination(location.hash);
      if (
        destination &&
        conversationSnapshot().clientId &&
        !conversationSnapshot().guest
      ) {
        setExportDestination(destination);
        openResearch(destination.id);
      }
    };
    follow();
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, [chat.clientId, chat.guest]);
  useEffect(() => {
    if (report && exportDestination?.id === report.research_id) {
      const source = report.sources.find(
        (s) => s.id === exportDestination.source,
      );
      if (source) openSource(source);
      setExportDestination(null);
    }
  }, [report?.research_id, exportDestination]);
  const [entryKind, setEntryKind] = useState<
      "research" | "documentary" | "chat"
    >("research"),
    [attachment, setAttachment] = useState<AttachmentDestination | null>(null),
    [uploading, setUploading] = useState(false),
    [documentEdit, setDocumentEdit] = useState<any>(null),
    [editorGeneration, setEditorGeneration] = useState(0);
  const uploadInput = useRef<HTMLInputElement>(null),
    queryDrafts = useRef<Record<string, string>>({});
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
  const pendingMessage = useRef<{
    id: string;
    reportId: string;
    text: string;
  } | null>(null);
  useEffect(() => {
    const accepted = (event: Event) => {
      const item = pendingMessage.current;
      if (!item || (event as CustomEvent).detail?.request_id !== item.id)
        return;
      const key =
        "nova-research-view:" +
        conversationSnapshot().clientId +
        ":" +
        item.reportId;
      try {
        const saved = JSON.parse(sessionStorage.getItem(key) || "{}");
        if (saved.message === item.text)
          sessionStorage.setItem(
            key,
            JSON.stringify({ ...saved, message: "" }),
          );
      } catch {}
      if (lastSelection.current === item.reportId)
        setMessage((old) => (old === item.text ? "" : old));
      pendingMessage.current = null;
    };
    window.addEventListener("nova-chat-accepted", accepted);
    return () => window.removeEventListener("nova-chat-accepted", accepted);
  }, []);
  const reportCache = useRef(new Map<string, { report: Report; at: number }>()),
    reportLoads = useRef(new Map<string, Promise<Report>>());
  const [selectionLoading, setSelectionLoading] = useState("");
  const [selectionSkeleton, setSelectionSkeleton] = useState(false),
    [failedSelection, setFailedSelection] = useState("");
  useEffect(() => {
    setSelectionSkeleton(false);
    if (!selectionLoading) return;
    const timer = setTimeout(() => setSelectionSkeleton(true), 150);
    return () => clearTimeout(timer);
  }, [selectionLoading]);
  function loadReport(id: string) {
    const key = conversationSnapshot().clientId + ":" + id;
    const cached = reportCache.current.get(key);
    if (cached && Date.now() - cached.at < 30000)
      return Promise.resolve(cached.report);
    let pending = reportLoads.current.get(key);
    if (!pending) {
      const client = conversationSnapshot().clientId;
      pending = api("/" + encodeURIComponent(id) + "/document")
        .then((d) => {
          if (
            conversationSnapshot().clientId === client &&
            !conversationSnapshot().guest
          ) {
            reportCache.current.set(key, { report: d, at: Date.now() });
            while (reportCache.current.size > 12)
              reportCache.current.delete(
                reportCache.current.keys().next().value!,
              );
          }
          return d;
        })
        .finally(() => reportLoads.current.delete(key));
      reportLoads.current.set(key, pending);
    }
    return pending;
  }
  useEffect(() => {
    reportCache.current.clear();
    reportLoads.current.clear();
  }, [chat.clientId, chat.guest]);
  useEffect(() => {
    if (report)
      reportCache.current.set(chat.clientId + ":" + report.research_id, {
        report,
        at: Date.now(),
      });
  }, [report, chat.clientId]);
  useEffect(() => {
    if (!open || !chat.clientId || chat.guest) return;
    let canceled = false;
    const timer = setTimeout(() => {
      void (async () => {
        for (const item of items.slice(0, 5)) {
          if (canceled) return;
          try {
            await loadReport(item.research_id);
          } catch {}
        }
      })();
    }, 350);
    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [open, items, chat.clientId]);
  const [exportPreview, setExportPreview] = useState<{
    url: string;
    name: string;
  } | null>(null);
  useEffect(
    () => () => {
      if (exportPreview) URL.revokeObjectURL(exportPreview.url);
    },
    [exportPreview],
  );
  const illustrationRequests = useRef(new Set<string>());
  useEffect(() => {
    if (
      !report ||
      report.kind !== "research" ||
      report.images_prepared
    )
      return;
    const key = chat.clientId + ":" + report.research_id;
    if (illustrationRequests.current.has(key)) return;
    illustrationRequests.current.add(key);
    void api("/" + report.research_id + "/images/enrich", {
      method: "POST",
      body: "{}",
    }).catch(() => {});
  }, [
    report?.research_id,
    report?.images_prepared,
    report?.completeness,
    chat.clientId,
  ]);
  const reportRef = useRef(report);
  reportRef.current = report;
  const [sourceLimit, setSourceLimit] = useState(10),
    [mediaLimit, setMediaLimit] = useState(3),
    [removed, setRemoved] = useState<any[]>([]),
    [deleting, setDeleting] = useState("");
  const continueSeen = useRef(new Map<string, any>());
  const continuePending = useRef(new Set<string>());
  async function reloadReport(id: string) {
    const old = reportRef.current;
    const follow =
      !!reader.current &&
      reader.current.scrollHeight -
        reader.current.scrollTop -
        reader.current.clientHeight <
        90 &&
      !window.getSelection()?.toString();
    const d = await api("/" + id + "/document");
    if (
      old?.research_id === id &&
      old.report &&
      old.research_revision === d.research_revision
    ) {
      d.report = old.report;
      d.next_cursor = old.next_cursor;
      d.reader_end = old.reader_end;
      if (old.extension_revision === d.extension_revision && old.extensions)
        d.extensions = old.extensions;
      else if (old.extensions?.reader_end) {
        const added = await api(
          "/" +
            id +
            "/reader?stream=extensions&revision=" +
            old.research_revision +
            "&cursor=" +
            old.extensions.reader_end,
        );
        d.extensions = {
          ...added,
          report: old.extensions.report + added.report,
          blocks: [...old.extensions.blocks, ...added.blocks],
        };
      }
      if (document.querySelector('[data-draft-dirty="true"]'))
        d.draft = old.draft;
    }
    setReport((current) => (current?.research_id === id ? d : current));
    if (follow && old?.extension_revision !== d.extension_revision)
      requestAnimationFrame(() => {
        if (reportRef.current?.research_id === id && reader.current)
          reader.current.scrollTop = reader.current.scrollHeight;
      });
    reportCache.current.set(chat.clientId + ":" + id, {
      report: d,
      at: Date.now(),
    });
  }
  async function requestMore(view: string) {
    if (!report) return;
    try {
      const outcome = await api("/" + report.research_id + "/expand", {
        method: "POST",
        body: JSON.stringify({
          research_revision: report.research_revision,
          view,
          operation_id: crypto.randomUUID(),
        }),
      });
      if (
        ![
          "accepted",
          "queued",
          "duplicate",
          "completed",
          "waiting_for_quota",
        ].includes(outcome.status)
      )
        throw Error(outcome.reason || "Expansion could not be started.");
      await reloadReport(report.research_id);
    } catch (e: any) {
      setError(e.message);
    }
  }
  async function removeReport(item: any) {
    if (deleting) return;
    setDeleting(item.research_id);
    try {
      const preview = await api("/" + item.research_id + "/delete-preview");
      const operation_id = crypto.randomUUID();
      let result;
      do {
        result = await api("/" + item.research_id + "/delete", {
          method: "POST",
          body: JSON.stringify({ revision: preview.revision, operation_id }),
        });
        if (result.status === "waiting_for_ui")
          await new Promise((resolve) => setTimeout(resolve, 750));
      } while (result.status === "waiting_for_ui");
      if (result.status !== "completed")
        throw Error(result.reason || "Removal was not confirmed");
      reportCache.current.delete(chat.clientId + ":" + item.research_id);
      if (lastSelection.current === item.research_id) {
        ++loadEpoch.current;
        lastSelection.current = "";
        setReport(null);
        setPreview(null);
        sessionStorage.removeItem("nova-selected-research");
      }
      notify({
        id: "research-removed:" + operation_id,
        title: "Research removed",
        message: "Undo removal",
        event: "nova-research-restore",
        target: {
          research_id: item.research_id,
          undo_token: result.undo_token,
        },
      });
      void refresh();
    } catch (e: any) {
      if (e.data?.reason !== "user_rejected") setError(e.message);
    } finally {
      setDeleting("");
    }
  }
  useEffect(() => {
    const restore = (e: Event) => {
      const d = (e as CustomEvent).detail;
      void api("/" + d.research_id + "/restore", {
        method: "POST",
        body: JSON.stringify({ undo_token: d.undo_token }),
      })
        .then(() => refresh())
        .catch((err) => setError(err.message));
    };
    window.addEventListener("nova-research-restore", restore);
    return () => window.removeEventListener("nova-research-restore", restore);
  }, [chat.clientId]);
  useEffect(() => {
    const refreshEvent = (e: Event) => {
      void reloadReport((e as CustomEvent).detail.research_id).catch(() => {});
    };
    window.addEventListener("nova-research-refresh", refreshEvent);
    return () =>
      window.removeEventListener("nova-research-refresh", refreshEvent);
  }, [chat.clientId]);
  useEffect(() => {
    const handler = async (e: Event) => {
      const d = (e as CustomEvent).detail;
      const send = (result: any) =>
        window.dispatchEvent(
          new CustomEvent("nova-research-result", {
            detail: { request_id: d.request_id, ...result },
          }),
        );
      if (continueSeen.current.has(d.request_id)) {
        send(continueSeen.current.get(d.request_id));
        return;
      }
      const current = reportRef.current;
      if (
        !open ||
        !current ||
        current.research_id !== d.research_id ||
        current.research_revision !== d.research_revision
      ) {
        send({ status: "unconfirmed", reason: "research_focus_changed" });
        return;
      }
      if (continuePending.current.has(d.request_id)) {
        send({ status: "unconfirmed", reason: "continuation_in_progress" });
        return;
      }
      continuePending.current.add(d.request_id);
      try {
        let revealed = false;
        if (d.view === "reader" && current.next_cursor != null) {
          await more();
          if (reportRef.current?.research_id !== d.research_id) {
            send({ status: "unconfirmed", reason: "research_focus_changed" });
            return;
          }
          setTab("reader");
          revealed = true;
        } else if (
          d.view === "reader" &&
          current.extensions?.next_cursor != null
        ) {
          await moreExtensions();
          revealed = true;
        } else if (
          d.view === "reader" &&
          current.completeness === "pending" &&
          sourceLimit < current.sources.length
        ) {
          setSourceLimit((v) => Math.min(v + 10, current.sources.length));
          revealed = true;
        } else if (
          d.view === "sources" &&
          sourceLimit < current.sources.length
        ) {
          setSourceLimit((v) => Math.min(v + 10, current.sources.length));
          setTab("sources");
          revealed = true;
        } else if (
          d.view === "media" &&
          mediaLimit <
            mergeMedia([
              ...(current.sources || []),
              ...(current.media || []),
              ...(current.linked_sources || []),
            ]).length
        ) {
          setMediaLimit((v) => v + 3);
          setTab(
            reportRef.current?.kind === "documentary" ? "assets" : "media",
          );
          revealed = true;
        }
        if (["reader", "sources", "media"].includes(d.view)) {
          setPreview(null);
          setTab(
            d.view === "media" && current.kind === "documentary"
              ? "assets"
              : d.view,
          );
        }
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        const result = {
          status: "completed",
          revealed,
          research_id: d.research_id,
          observed: {
            view: d.view,
            reader_characters: reportRef.current?.report.length || 0,
            source_count: document.querySelectorAll(
              ".research-sources:not([hidden]) .research-source-row",
            ).length,
            media_count: document.querySelectorAll(
              ".research-media:not([hidden]) .research-video",
            ).length,
          },
        };
        continueSeen.current.set(d.request_id, result);
        if (continueSeen.current.size > 100)
          continueSeen.current.delete(
            continueSeen.current.keys().next().value!,
          );
        send(result);
      } catch (err: any) {
        send({ status: "failed", reason: err.message });
      } finally {
        continuePending.current.delete(d.request_id);
      }
    };
    window.addEventListener("nova-research-continue", handler);
    return () => window.removeEventListener("nova-research-continue", handler);
  }, [
    open,
    report?.research_id,
    report?.next_cursor,
    sourceLimit,
    mediaLimit,
    chat.clientId,
  ]);
  useEffect(() => {
    if (open && report)
      updateUiContext({
        reader_cursor: report.next_cursor ?? null,
        reader_end: report.reader_end ?? 0,
        research_tab: tab,
        source_visible_count: Math.min(sourceLimit, report.sources.length),
        media_visible_count: mediaLimit,
      });
  }, [
    open,
    report?.research_id,
    report?.next_cursor,
    report?.reader_end,
    tab,
    sourceLimit,
    mediaLimit,
  ]);
  useEffect(() => {
    if (
      !open ||
      !report ||
      ![
        "queued",
        "collecting_sources",
        "preparing_report",
        "waiting_for_quota",
      ].includes(report.extension_activity?.phase || "")
    )
      return;
    const id = report.research_id;
    const timer = setInterval(
      () => void reloadReport(id).catch(() => {}),
      2000,
    );
    return () => clearInterval(timer);
  }, [open, report?.research_id, report?.extension_activity?.phase]);
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
      setRemoved(d.removed || []);
      setTotal(d.total);
    } catch (e: any) {
      setError(e.message);
    }
  }
  async function select(id: string) {
    setTab("reader");
    const destination = researchDestination(location.hash);
    if (destination && destination.id !== id)
      history.replaceState(null, "", location.pathname + location.search);
    const client = conversationSnapshot().clientId,
      epoch = ++loadEpoch.current;
    setError("");
    setSelectionLoading(id);
    setFailedSelection("");
    if (report)
      sessionStorage.setItem(
        "nova-research-view:" + client + ":" + report.research_id,
        JSON.stringify({ scroll: reader.current?.scrollTop || 0, message }),
      );
    lastSelection.current = id;
    setPreview(null);
    setImageView(null);
    setAttachment(null);
    setDocumentEdit(null);
    setEditorGeneration(0);
    setMessage("");
    const cached = reportCache.current.get(client + ":" + id);
    setReport(cached && Date.now() - cached.at < 30000 ? cached.report : null);
    updateUiContext({
      view: "research",
      research_id: id,
      research_revision: cached?.report.research_revision || "",
      selected_id: id,
      selected_kind: "research",
      title: cached?.report.display_title || "Opening research",
      reader_cursor: null,
      reader_end: 0,
    });
    try {
      const threadLoad = api(
        "/" + encodeURIComponent(id) + "/conversation",
      ).catch(() => null);
      const d = await loadReport(id);
      if (
        epoch !== loadEpoch.current ||
        client !== conversationSnapshot().clientId ||
        conversationSnapshot().guest
      )
        return;
      setImageView(null);
      setReport(d);
      setEntryKind(d.kind || "research");
      void threadLoad
        .then((thread) => {
          if (
            thread &&
            client === conversationSnapshot().clientId &&
            !conversationSnapshot().guest
          )
            conversationResearch(id, thread.messages || []);
        })
        .catch(() => {
          if (epoch === loadEpoch.current)
            setError(
              "Report opened. Conversation history is temporarily unavailable.",
            );
        });
      const saved = JSON.parse(
        sessionStorage.getItem("nova-research-view:" + client + ":" + id) ||
          "{}",
      );
      setMessage(saved.message || "");
      requestAnimationFrame(() => {
        if (reader.current) reader.current.scrollTop = saved.scroll || 0;
      });
      setReaderChars(20000);
      setSourceLimit(10);
      setMediaLimit(3);
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
        title: d.display_title || d.query,
        selected_id: id,
        selected_kind: "research",
        category: "",
      });
    } catch (e: any) {
      if (epoch === loadEpoch.current) {
        setError(e.message);
        setFailedSelection(id);
      }
    } finally {
      if (epoch === loadEpoch.current) setSelectionLoading("");
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
      if (lastSelection.current === d.research_id)
        void reloadReport(d.research_id).catch(() => {});
      notify({
        id: d.notice_id || "research:" + d.research_id,
        title: "Research ready",
        message: d.query || "Open your sourced report",
        kind: "research",
        event: "nova-open-research",
        target: d,
      });
      if (
        researchMayNavigate() &&
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
    if (open)
      updateUiContext({
        view: "research",
        research_id: selectionLoading || report?.research_id || "",
        research_revision: report?.research_revision || "",
      });
  }, [open, report?.research_id, report?.research_revision, selectionLoading]);
  useEffect(() => {
    if (report)
      sessionStorage.setItem(
        "nova-research-view:" + chat.clientId + ":" + report.research_id,
        JSON.stringify({ message, scroll: reader.current?.scrollTop || 0 }),
      );
  }, [message, report?.research_id]);
  useEffect(() => {
    if (
      !open ||
      !report ||
      ![
        "queued",
        "collecting_sources",
        "comparing_evidence",
        "preparing_report",
        "waiting_for_quota",
      ].includes(report.phase || "")
    )
      return;
    const id = report.research_id;
    const interval = setInterval(() => {
      void api("/" + id + "/document")
        .then((d) => {
          setReport((old) => (old?.research_id === id ? d : old));
          void refresh();
        })
        .catch(() => {});
    }, 2500);
    return () => clearInterval(interval);
  }, [open, report?.research_id, report?.phase]);
  async function more() {
    if (!report) return;
    const id = report.research_id,
      requestedCursor = report.next_cursor;
    try {
      const d = await api(
        "/" +
          id +
          "/reader?revision=" +
          report.research_revision +
          "&cursor=" +
          report.next_cursor +
          "&stream=base",
      );
      setReport((old) =>
        old?.research_id === id && old.next_cursor === requestedCursor
          ? {
              ...old,
              report: old.report + d.report,
              next_cursor: d.next_cursor,
              reader_end: d.reader_end,
              extension_revision: d.extension_revision,
            }
          : old,
      );
      setReaderChars((v) => v + 20000);
      return true;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }
  async function moreExtensions() {
    if (!report?.extensions || report.extensions.next_cursor == null) return;
    const id = report.research_id,
      requestedCursor = report.extensions.next_cursor,
      next = await api(
        "/" +
          id +
          "/reader?stream=extensions&revision=" +
          report.research_revision +
          "&cursor=" +
          report.extensions.next_cursor,
      );
    setReport((old) =>
      old?.research_id === id && old.extensions?.next_cursor === requestedCursor
        ? {
            ...old,
            extensions: {
              ...next,
              report: old.extensions!.report + next.report,
              blocks: [...old.extensions!.blocks, ...next.blocks],
            },
          }
        : old,
    );
  }
  async function expand() {
    await requestMore("reader");
  }
  function closePreview() {
    const destination = researchDestination(location.hash);
    if (destination?.source)
      history.replaceState(
        null,
        "",
        location.pathname + location.search + "#research=" + destination.id,
      );
    setPreview(null);
    setAttachment(null);
    setDocumentEdit(null);
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
  }, [chat.researchMessages, report?.research_id]);
  useEffect(() => {
    pausePlayers();
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
  const media = mergeMedia([
    ...(report?.sources || []),
    ...(report?.media || []),
    ...(report?.linked_sources || []),
    ...extraMedia,
  ]);
  function openSource(source: Source) {
    if (source.attachment_id && report) {
      const reportId = report.research_id,
        originId =
          source.attachment_origin_id || source.origin_research_id || reportId;
      originFocus.current = document.activeElement as HTMLElement;
      const show = (files: Attachment[]) => {
        const file = files.find((f) => f.id === source.attachment_id);
        if (lastSelection.current !== reportId) return;
        if (file)
          setAttachment({
            file,
            page: source.page || 1,
            excerpt: source.content,
            originId,
            readonly: true,
            revision: source.attachment_revision || file.revision,
          });
        else setError("The original attachment is unavailable.");
      };
      if (originId === reportId) show(report.attachments || []);
      else
        void documentApi("/" + originId + "/attachments")
          .then((d) => show(d.attachments || []))
          .catch((e) => setError(e.message));
      return;
    }
    if (videoId(source.url)) {
      const timestamp = videoTimestamp(source.url);
      if (timestamp !== null)
        videoPositions.set(videoId(source.url)!, timestamp);
      if (!media.some((s) => videoId(s.url) === videoId(source.url)))
        setExtraMedia((old) => [...old, source]);
      setPreview(null);
      setTab(reportRef.current?.kind === "documentary" ? "assets" : "media");
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
    if (query.trim().length > 12000) {
      setError(
        "Research brief must contain at most 12,000 characters. Please shorten it before submitting.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (entryKind === "documentary") {
        let identifier =
          report?.kind === "documentary" &&
          ["draft", "failed"].includes(report.phase || "")
            ? report.research_id
            : "";
        if (!identifier) {
          const entry = await api("", {
            method: "POST",
            body: JSON.stringify({
              kind: "documentary",
              query,
              operation_id: crypto.randomUUID(),
            }),
          });
          identifier = entry.research_id;
        }
        const result = await api("/" + identifier + "/compose", {
          method: "POST",
          body: JSON.stringify({ query }),
        });
        cue("notification", "document-submitted:" + result.job_id);
        setQuery("");
        reportCache.current.delete(chat.clientId + ":" + identifier);
        await select(identifier);
        void refresh();
        return;
      }
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
      cue("notification", "research-submitted:" + d.job_id);
      setQuery("");
      if (d.research_id) {
        await select(d.research_id);
        void refresh();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function newEntry(
    kind: "research" | "documentary" | "chat",
    sourceId = "",
  ) {
    if (report)
      sessionStorage.setItem(
        "nova-research-view:" + chat.clientId + ":" + report.research_id,
        JSON.stringify({ message, scroll: reader.current?.scrollTop || 0 }),
      );
    queryDrafts.current[entryKind] = query;
    setQuery(queryDrafts.current[kind] || "");
    setError("");
    if (kind !== "research") {
      try {
        const d = await api("", {
          method: "POST",
          body: JSON.stringify({
            kind,
            source_research_id: sourceId,
            query: sourceId
              ? "An illustrated written documentary based on " +
                (report?.display_title || "this research")
              : kind === "chat"
                ? "New chat"
                : "New document",
            operation_id: crypto.randomUUID(),
          }),
        });
        await select(d.research_id);
        void refresh();
      } catch (e: any) {
        setError(e.message);
      }
      return;
    }
    ++loadEpoch.current;
    setReport(null);
    setPreview(null);
    setAttachment(null);
    setDocumentEdit(null);
    setEditorGeneration(0);
    setMessage("");
    setEntryKind(kind);
    setSelectionLoading("");
    setFailedSelection("");
    lastSelection.current = "";
    sessionStorage.removeItem("nova-selected-research");
    updateUiContext({
      view: "research",
      research_id: "",
      research_revision: "",
      thread_id: "",
    });
  }
  async function uploadFiles(list: FileList | null) {
    if (!list?.length) return;
    const selected = Array.from(list);
    setUploading(true);
    setError("");
    try {
      if (
        selected.length > 5 ||
        selected.some((f) => f.size > 25 * 1024 * 1024)
      )
        throw Error("Choose up to five files, each at most 25 MB.");
      let identifier = report?.research_id;
      if (!identifier) {
        const created = await api("", {
          method: "POST",
          body: JSON.stringify({
            kind: "documentary",
            query: "New document",
            operation_id: crypto.randomUUID(),
          }),
        });
        identifier = created.research_id;
      }
      let uploaded: Attachment | null = null;
      for (const file of selected) {
        const response = await fetch(
          "/api/research/" + identifier + "/attachments",
          {
            method: "POST",
            headers: {
              ...attachmentHeaders(),
              "Content-Type": "application/octet-stream",
              "X-File-Name": encodeURIComponent(file.name),
            },
            body: file,
          },
        );
        const d = await response.json();
        if (
          !response.ok ||
          !["queued", "duplicate", "completed"].includes(d.status)
        )
          throw Error(d.detail || d.reason || "File could not be attached.");
        uploaded = d.attachment;
      }
      reportCache.current.delete(chat.clientId + ":" + identifier);
      await select(identifier!);
      setTab("assets");
      if (uploaded) setAttachment({ file: uploaded });
      void refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (uploadInput.current) uploadInput.current.value = "";
    }
  }
  function entryMenu() {
    return (
      <details className="research-new-menu">
        <summary
          aria-label="New entry or attach files"
          title="New entry or attach files"
        >
          <Icon name="plus" />
        </summary>
        <div>
          {(["chat", "research", "documentary"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={(e) => {
                e.currentTarget.closest("details")?.removeAttribute("open");
                void newEntry(kind);
              }}
            >
              New {kind === "documentary" ? "document" : kind}
            </button>
          ))}
          {report && report.kind === "research" && (
            <button
              type="button"
              onClick={() => void newEntry("documentary", report.research_id)}
            >
              Turn into document
            </button>
          )}
          <button
            type="button"
            disabled={uploading}
            onClick={(e) => {
              e.currentTarget.closest("details")?.removeAttribute("open");
              uploadInput.current?.click();
            }}
          >
            {uploading ? "Attaching…" : "Attach files"}
          </button>
        </div>
      </details>
    );
  }
  function sendFollowup() {
    if (!report || !message.trim() || chat.textBusy) return;
    const id = crypto.randomUUID();
    pendingMessage.current = {
      id,
      reportId: report.research_id,
      text: message,
    };
    requestConversation(message, id);
  }
  async function applyDocumentEdit() {
    if (!report || !documentEdit) return;
    if (document.querySelector('[data-draft-dirty="true"]')) {
      setError("Save the current draft before applying this preview.");
      return;
    }
    try {
      const d = await api(
        "/" +
          report.research_id +
          "/document-edits/" +
          (documentEdit.edit_id || documentEdit.id) +
          "/apply",
        { method: "POST", body: "{}" },
      );
      setReport((old) => (old ? { ...old, draft: d.draft } : old));
      setDocumentEdit(null);
      setEditorGeneration((n) => n + 1);
      setTab("edit");
      setEditOpened(true);
    } catch (e: any) {
      setError(e.message);
    }
  }
  async function previewCopy(text: string) {
    if (!report) return;
    try {
      const d = await api("/" + report.research_id + "/document-edits", {
        method: "POST",
        body: JSON.stringify({
          markdown: text,
          draft_revision: report.draft?.revision || "",
        }),
      });
      setDocumentEdit(d);
      setAttachment(null);
    } catch (e: any) {
      setError(e.message);
    }
  }
  function closeExportPreview() {
    setExportPreview(null);
    requestAnimationFrame(() =>
      originFocus.current?.focus({ preventScroll: true }),
    );
  }
  async function download(format: string) {
    originFocus.current = document.activeElement as HTMLElement;
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
          (tab === "edit" ||
            (report.completeness === "pending" && !!report.draft)),
        { headers: headers() },
      );
      if (!r.ok) throw Error("Export unavailable");
      const url = URL.createObjectURL(await r.blob()),
        a = document.createElement("a");
      a.href = url;
      a.download =
        report.query.replace(/[^\w -]/g, "").slice(0, 80) + "." + format;
      if (format === "pdf") {
        setExportPreview({ url, name: a.download });
        return;
      }
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
      {exportPreview && (
        <PDFExportPreview
          preview={exportPreview}
          onClose={closeExportPreview}
        />
      )}
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
      {imageView && report && (
        <ImageViewer
          image={imageView}
          reportId={report.research_id}
          onClose={() => setImageView(null)}
          onSource={() => {
            setImageView(null);
            const source = [
              ...report.sources,
              ...(report.image_sources || []),
            ].find((s) => s.id === imageView.source_id);
            if (source) openSource(source);
          }}
        />
      )}
      <div className="research-layout">
        <aside className="research-outline">
          <h2>Your research</h2>
          {items.map((item) => (
            <div className="research-history-item" key={item.research_id}>
              <button
                className={
                  (selectionLoading || report?.research_id) === item.research_id
                    ? "research-history-row selected"
                    : "research-history-row"
                }
                aria-current={
                  (selectionLoading || report?.research_id) === item.research_id
                    ? "true"
                    : undefined
                }
                key={item.research_id}
                onPointerEnter={() => {
                  void loadReport(item.research_id).catch(() => {});
                }}
                onFocus={() => {
                  void loadReport(item.research_id).catch(() => {});
                }}
                onClick={() => void select(item.research_id)}
              >
                <strong>{item.query}</strong>
                <small>
                  {new Date(item.retrieved_at).toLocaleDateString()} ·{" "}
                  {item.phase === "draft"
                    ? "draft"
                    : item.kind === "chat"
                      ? "chat"
                      : item.kind === "documentary"
                        ? "documentary · " + item.completeness
                        : item.completeness}
                </small>
              </button>
              <details className="research-history-menu">
                <summary
                  aria-label={
                    "Options for " + (item.display_title || item.query)
                  }
                >
                  <Icon name="more" />
                </summary>
                <button
                  disabled={!!deleting}
                  onClick={(e) => {
                    e.currentTarget.closest("details")?.removeAttribute("open");
                    void removeReport(item);
                  }}
                >
                  <Icon name="trash" />
                  Remove research
                </button>
              </details>
            </div>
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
          {!!removed.length && (
            <details className="research-removed">
              <summary>Recently removed ({removed.length})</summary>
              {removed.map((item) => (
                <button
                  key={item.research_id}
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("nova-research-restore", {
                        detail: item,
                      }),
                    )
                  }
                >
                  Restore {item.display_title || item.query}
                </button>
              ))}
            </details>
          )}
          {report && (
            <>
              <h2>On this page</h2>
              {((report.evidence_collection ||
                report.completeness === "pending") &&
              !original
                ? report.sources.map((s) => ({ id: s.id, title: s.title }))
                : report.sections.slice(0, 50)
              ).map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => {
                    const target =
                      (report.evidence_collection ||
                        report.completeness === "pending") &&
                      !original
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
              {(report?.kind === "chat"
                ? []
                : report?.kind === "documentary"
                  ? ["reader", "edit", "sources", "assets"]
                  : [
                      "reader",
                      "edit",
                      "sources",
                      "media",
                      ...((report?.attachments?.length || 0) > 0
                        ? ["assets"]
                        : []),
                    ]
              ).map((v) => (
                <button
                  key={v}
                  aria-pressed={tab === v}
                  disabled={
                    v === "edit" &&
                    (!report ||
                      (report.completeness === "pending" &&
                        report.phase !== "draft") ||
                      report.phase === "failed")
                  }
                  onClick={() => setTab(v)}
                >
                  {v === "reader" && report?.kind === "documentary"
                    ? "Document"
                    : v[0].toUpperCase() + v.slice(1)}
                </button>
              ))}
            </nav>
            {report &&
              (report.completeness !== "pending" || !!report.draft) &&
              (report.phase !== "failed" || !!report.draft) && (
                <details>
                  <summary>
                    <Icon name="download" /> Download
                  </summary>
                  <small className="research-export-label">
                    {tab === "edit" || report.completeness === "pending"
                      ? "Saved draft"
                      : report.kind === "documentary"
                        ? "Authored document"
                        : "Research report"}
                  </small>
                  {["md", "html", "pdf", "docx"].map((f) => (
                    <button key={f} onClick={() => void download(f)}>
                      <Icon name="download" />
                      <span>
                        {
                          (
                            {
                              md: "Markdown",
                              html: "Web document",
                              pdf: "PDF document",
                              docx: "Word document",
                            } as any
                          )[f]
                        }
                      </span>
                      <small>{f.toUpperCase()}</small>
                    </button>
                  ))}
                </details>
              )}
          </header>
          <div className="research-stage" aria-busy={!!selectionLoading}>
            {selectionLoading && (
              <span className="research-selection-loading" role="status">
                Opening research…
              </span>
            )}
            {!report && selectionLoading ? (
              <section
                className="research-opening"
                role="status"
                aria-label="Opening research"
              >
                <p>Opening research</p>
                {selectionSkeleton && (
                  <div className="research-skeleton" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                )}
              </section>
            ) : !report && failedSelection ? (
              <section className="research-empty">
                <p>This entry could not be opened.</p>
                <button onClick={() => void select(failedSelection)}>
                  Retry opening
                </button>
              </section>
            ) : !report ? (
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
            ) : report.kind === "chat" ? (
              <section
                className="research-central-chat"
                hidden={!!attachment || !!documentEdit}
              >
                <div
                  className="research-chat"
                  role="log"
                  aria-label="Standalone conversation"
                >
                  {(chat.researchMessages[report.research_id] || []).map(
                    (m) => (
                      <article key={m.id} data-speaker={m.role}>
                        <small>{m.role === "user" ? "You" : "Aegis"}</small>
                        <p>{m.text}</p>
                      </article>
                    ),
                  )}
                </div>
                {!!report.attachments?.length && (
                  <div
                    className="research-chat-files"
                    aria-label="Chat attachments"
                  >
                    {report.attachments.map((file) => (
                      <button
                        key={file.id}
                        disabled={file.status !== "ready"}
                        onClick={() => setAttachment({ file })}
                        title={file.name}
                      >
                        {file.name}
                        {file.status !== "ready" ? " · " + file.status : ""}
                      </button>
                    ))}
                  </div>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendFollowup();
                  }}
                >
                  {entryMenu()}
                  <textarea
                    aria-label="Message Aegis"
                    placeholder="Start a conversation…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={
                      chat.muted ? "Unmute microphone" : "Mute microphone"
                    }
                    onClick={requestMicrophone}
                  >
                    <Icon name="mic" />
                  </button>
                  <button
                    aria-label="Send message"
                    disabled={
                      !chat.connected || chat.textBusy || !message.trim()
                    }
                  >
                    <Icon name="arrow" />
                  </button>
                </form>
              </section>
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
                  hidden={
                    tab !== "reader" ||
                    !!preview ||
                    !!attachment ||
                    !!documentEdit
                  }
                  ref={reader}
                  className="research-reader"
                  onScroll={(e) => {
                    if (report)
                      sessionStorage.setItem(
                        "nova-research-view:" +
                          chat.clientId +
                          ":" +
                          report.research_id,
                        JSON.stringify({
                          message,
                          scroll: e.currentTarget.scrollTop,
                        }),
                      );
                  }}
                >
                  {report.kind === "documentary" && report.draft?.html ? (
                    <DocumentPaperPreview
                      report={report}
                      onLink={(url) => {
                        const source = report.sources.find(
                          (s) => s.url === url,
                        );
                        if (source) openSource(source);
                        else openUnknown(url);
                      }}
                    />
                  ) : report.kind === "documentary" &&
                    report.phase === "draft" ? (
                    <section className="document-draft-intro">
                      <h1>
                        {["New documentary", "New document"].includes(
                          report.display_title || "",
                        )
                          ? "Create a document"
                          : report.display_title}
                      </h1>
                      <p>
                        Add source documents or describe a subject below. Aegis
                        will organise the evidence into an illustrated
                        introduction, chapters, conclusion and references.
                      </p>
                      <button
                        className="research-inline-action"
                        onClick={() => {
                          setEditOpened(true);
                          setTab("edit");
                        }}
                      >
                        Create blank document
                      </button>
                      <button
                        className="research-inline-action"
                        onClick={() => uploadInput.current?.click()}
                      >
                        Attach source documents
                      </button>
                    </section>
                  ) : report.phase === "failed" ||
                    report.completeness === "pending" ? (
                    <PendingResearch
                      report={{
                        ...report,
                        sources: report.sources.slice(0, sourceLimit),
                      }}
                      onOpen={openSource}
                      onImage={setImageView}
                    />
                  ) : (report.evidence_collection ||
                      report.completeness === "pending") &&
                    !original ? (
                    <>
                      <h1>{report.display_title || report.query}</h1>
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
                          <h2>{source.title}</h2>
                          <p>
                            {sourceExcerpt(source)}{" "}
                            <SourceChip
                              source={source}
                              onClick={() => openSource(source)}
                            />
                          </p>
                          <button
                            className="research-inline-action"
                            onClick={() => openSource(source)}
                          >
                            Read source
                          </button>
                        </article>
                      ))}
                      <button
                        className="research-inline-action"
                        onClick={() => setOriginal(true)}
                      >
                        View saved report
                      </button>
                    </>
                  ) : (
                    <>
                      <ReportContent
                        text={report.report}
                        sources={[
                          ...report.sources,
                          ...(report.linked_sources || []),
                          ...(report.image_sources || []),
                        ]}
                        onOpen={openSource}
                        onUnknown={openUnknown}
                        images={[
                          ...(report.image_items || []),
                          ...(report.attachment_images || []),
                        ]}
                        reportId={report.research_id}
                        onImage={setImageView}
                      />
                      {report.next_cursor != null && (
                        <button onClick={() => void more().catch(() => {})}>
                          Show more
                        </button>
                      )}
                    </>
                  )}
                  {report.next_cursor == null &&
                    report.completeness !== "pending" && (
                      <button
                        className="research-inline-action"
                        onClick={() => void expand()}
                      >
                        Expand this report
                      </button>
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
                          <Icon name="play" />
                        </button>
                      ))}
                    </section>
                  )}
                  <ContinuationStatus
                    activity={report.extension_activity}
                    view="reader"
                  />
                  {!!report.extensions?.report && (
                    <section
                      className="research-extension"
                      aria-label="Additional research"
                    >
                      {(
                        report.extensions.blocks || [
                          {
                            id: report.extension_revision || "extension",
                            text: report.extensions.report,
                          },
                        ]
                      ).map((block) => (
                        <div
                          className="research-extension-block"
                          key={block.id}
                        >
                          <ReportContent
                            text={block.text}
                            sources={[
                              ...report.sources,
                              ...(report.linked_sources || []),
                            ]}
                            onOpen={openSource}
                            onUnknown={openUnknown}
                            reportId={report.research_id}
                          />
                        </div>
                      ))}
                      {report.extensions.next_cursor != null && (
                        <button
                          className="research-inline-action"
                          onClick={() => void moreExtensions()}
                        >
                          Show more findings
                        </button>
                      )}
                    </section>
                  )}
                  <h2 className="research-sources-heading">Sources</h2>
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
                    hidden={
                      tab !== "edit" ||
                      !!preview ||
                      !!attachment ||
                      !!documentEdit
                    }
                  >
                    {!!report.document_revisions?.some(
                      (r) => r.status === "preview",
                    ) && (
                      <div className="document-edit-proposals">
                        {report.document_revisions
                          .filter((r) => r.status === "preview")
                          .map((r, i) => (
                            <button
                              key={r.id}
                              onClick={() =>
                                void documentApi(
                                  "/" +
                                    report.research_id +
                                    "/document-edits/" +
                                    r.id,
                                )
                                  .then((d) => setDocumentEdit(d))
                                  .catch((e) => setError(e.message))
                              }
                            >
                              Review AI edit {i + 1}
                            </button>
                          ))}
                      </div>
                    )}
                    <DraftEditor
                      key={report.research_id + ":" + editorGeneration}
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
                  hidden={
                    tab !== "sources" ||
                    !!preview ||
                    !!attachment ||
                    !!documentEdit
                  }
                >
                  {report.sources.slice(0, sourceLimit).map((source) => (
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
                          <MediaBoundary key={source.url}>
                            <Video source={source} />
                          </MediaBoundary>
                        )}
                    </article>
                  ))}
                  <button
                    className="research-inline-action"
                    onClick={() => void requestMore("sources")}
                  >
                    {sourceLimit < report.sources.length
                      ? "Show more sources"
                      : "Find more sources"}
                  </button>
                  <ContinuationStatus
                    activity={report.extension_activity}
                    view="sources"
                  />
                </div>
                <div
                  className={
                    "research-media" +
                    (report.kind === "documentary"
                      ? " document-assets-media"
                      : "")
                  }
                  hidden={
                    tab !==
                      (report.kind === "documentary" ? "assets" : "media") ||
                    !!preview ||
                    !!attachment ||
                    !!documentEdit
                  }
                >
                  {report.kind === "documentary" && (
                    <AttachmentAssets
                      reportId={report.research_id}
                      files={report.attachments || []}
                      onOpen={setAttachment}
                      onUpload={() => uploadInput.current?.click()}
                    />
                  )}
                  {report.kind === "documentary" && <h2>Supporting videos</h2>}
                  {["pending", "running"].includes(
                    report.media_status || "",
                  ) && (
                    <p role="status">
                      Finding relevant videos… Your report is ready to read.
                    </p>
                  )}
                  {(tab === "media" ||
                    (report.kind === "documentary" && tab === "assets")) &&
                    !preview &&
                    media.slice(0, mediaLimit).map((s) => (
                      <MediaBoundary key={s.video_id || s.id}>
                        <Video source={s} />
                      </MediaBoundary>
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
                  <button
                    className="research-inline-action"
                    onClick={() => void requestMore("media")}
                  >
                    {mediaLimit < media.length
                      ? "Show more videos"
                      : "Find more videos"}
                  </button>
                  <ContinuationStatus
                    activity={report.extension_activity}
                    view="media"
                  />
                </div>
              </>
            )}
            {report &&
              tab === "assets" &&
              report.kind !== "documentary" &&
              !attachment &&
              !documentEdit &&
              !preview && (
                <AttachmentAssets
                  reportId={report.research_id}
                  files={report.attachments || []}
                  onOpen={setAttachment}
                  onUpload={() => uploadInput.current?.click()}
                />
              )}
            {attachment && report && (
              <AttachmentReader
                key={report.research_id + ":" + attachment.file.id}
                reportId={report.research_id}
                destination={{
                  ...attachment,
                  file:
                    report.attachments?.find(
                      (f) => f.id === attachment.file.id,
                    ) || attachment.file,
                }}
                assets={report.attachments || []}
                allowCopy={report.kind !== "chat"}
                onClose={closePreview}
                onChanged={() =>
                  void reloadReport(report.research_id).catch((e) =>
                    setError(e.message),
                  )
                }
                onCopy={(text) => void previewCopy(text)}
              />
            )}
            {documentEdit && report && (
              <section className="document-copy-preview">
                <header>
                  <h2>Review editable copy</h2>
                  <button onClick={() => void applyDocumentEdit()}>
                    Apply to draft
                  </button>
                  <button aria-label="Close preview" onClick={closePreview}>
                    <Icon name="close" />
                  </button>
                </header>
                <IllustratedPreview html={documentEdit.html} />
              </section>
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
          <input
            ref={uploadInput}
            type="file"
            hidden
            multiple
            accept=".pdf,.docx,.txt,.md,.markdown,.png,.jpg,.jpeg,.webp"
            onChange={(e) => void uploadFiles(e.target.files)}
          />
          <form
            className="research-query"
            hidden={report?.kind === "chat"}
            onSubmit={start}
          >
            <span id="research-brief-limit" className="research-sr-only">
              Research brief: up to 12,000 characters.
            </span>
            <textarea
              aria-label="Research topic"
              placeholder={
                entryKind === "documentary"
                  ? "What should this document explain?"
                  : "What would you like to research?"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-describedby="research-brief-limit"
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
              {entryMenu()}
              {entryKind === "documentary" && (
                <span className="document-mode-label">Documentary</span>
              )}
              <details hidden={entryKind === "documentary"}>
                <summary aria-label="Research depth">
                  {mode === "detailed" ? "Detailed" : "Quick"}
                  <Icon name="depth" />
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
                aria-label={
                  entryKind === "documentary"
                    ? busy
                      ? "Preparing document"
                      : "Write document"
                    : busy
                      ? "Starting research"
                      : "Start research"
                }
                disabled={
                  busy || !chat.connected || chat.guest || !query.trim()
                }
              >
                {busy ? "…" : <Icon name="arrow" />}
              </button>
            </div>
          </form>
        </main>
        <aside className="research-assistant" hidden={report?.kind === "chat"}>
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
            {(report
              ? chat.researchMessages[report.research_id] || []
              : []
            ).map((m) => (
              <article key={m.id} data-speaker={m.role}>
                <small>{m.role === "user" ? "You" : "Aegis"}</small>
                <p>{m.text}</p>
              </article>
            ))}
            {report?.research_cards?.map((card) => (
              <article key={card.id} className="document-research-card">
                <Icon name="citation" />
                <strong>{card.title}</strong>
                <small>Saved research · available for insertion</small>
                <button
                  className="research-inline-action"
                  onClick={() => {
                    setMessage(
                      "Insert the saved research “" +
                        card.title +
                        "” into this document at the current selection, or append it if nothing is selected.",
                    );
                  }}
                >
                  Use in document
                </button>
                <button
                  className="research-inline-action"
                  onClick={() => void select(card.id)}
                >
                  Read research
                </button>
              </article>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendFollowup();
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
                disabled={
                  !chat.connected || !report || chat.textBusy || !message.trim()
                }
              >
                <Icon name="arrow" />
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
