import React, { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import { marked } from "marked";
import DOMPurify from "dompurify";
import {
  conversationSnapshot,
  updateUiContext,
  uiSnapshot,
} from "../../conversation";
import "./DocumentAttachments.css";

export type Attachment = {
  id: string;
  name: string;
  mime: string;
  size: number;
  status: string;
  page_count: number;
  revision: string;
  pdf_revision?: string;
  error?: string;
  needs_ocr?: boolean;
  images: { id: string; caption: string; page?: number }[];
  pdf_revisions?: {
    revision: string;
    parent_revision: string;
    operation_id: string;
    images?: { id: string; caption: string; page?: number }[];
  }[];
};
export type AttachmentDestination = {
  file: Attachment;
  page?: number;
  excerpt?: string;
  originId?: string;
  readonly?: boolean;
  revision?: string;
};
export const attachmentHeaders = () => ({
  "X-Nova-Client": conversationSnapshot().clientId,
});
export async function documentApi(path: string, body?: unknown) {
  const r = await fetch("/api/research" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { ...attachmentHeaders(), "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json();
  if (
    !r.ok ||
    ["conflict", "failed", "rejected", "not_found"].includes(data.status)
  )
    throw Error(data.detail || data.reason || "Document unavailable");
  return data;
}
export function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M6 18 18 6" />
    </svg>
  );
}
export async function downloadAttachment(
  reportId: string,
  file: Attachment,
  revision = "",
) {
  const r = await fetch(
    `/api/research/${reportId}/attachments/${file.id}/original?download=true&revision=${encodeURIComponent(revision)}`,
    { headers: attachmentHeaders() },
  );
  if (!r.ok) throw Error("Attachment download unavailable");
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download =
    (revision && revision !== file.revision ? "edited-" : "original-") +
    file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function AttachmentAssets({
  reportId,
  files,
  onOpen,
  onUpload,
}: {
  reportId: string;
  files: Attachment[];
  onOpen: (destination: AttachmentDestination) => void;
  onUpload: () => void;
}) {
  return (
    <section className="document-assets" aria-label="Attached files">
      <header>
        <div>
          <h2>Assets</h2>
          <p>
            Original files, extracted illustrations and supporting material.
          </p>
        </div>
        <button onClick={onUpload}>Attach files</button>
      </header>
      {!files.length && (
        <p>
          No files attached yet. Add a PDF, Word document, text file or image.
        </p>
      )}
      {files.map((file) => (
        <article key={file.id}>
          <div className="document-file-symbol" aria-hidden="true">
            {file.mime === "application/pdf"
              ? "PDF"
              : file.mime.startsWith("image/")
                ? "IMG"
                : "DOC"}
          </div>
          <div>
            <h3>{file.name}</h3>
            <small>
              {(file.size / 1024 / 1024).toFixed(1)} MB ·{" "}
              {file.status === "ready"
                ? `${file.page_count} ${file.mime === "application/pdf" ? "pages" : "document"}`
                : file.status.replace(/_/g, " ")}
            </small>
            {file.needs_ocr && (
              <p>
                Image-based document. The original is viewable; native text is
                unavailable.
              </p>
            )}
            {file.error && <p role="alert">{file.error}</p>}
          </div>
          <button
            disabled={file.status !== "ready"}
            onClick={() => onOpen({ file })}
          >
            Open document
          </button>
        </article>
      ))}
      <small>Up to five files per entry · 25 MB per file · 100 PDF pages</small>
    </section>
  );
}

export function AttachmentReader({
  reportId,
  destination,
  onClose,
  onChanged,
  onCopy,
  assets = [],
  allowCopy = true,
}: {
  reportId: string;
  destination: AttachmentDestination;
  onClose: () => void;
  onChanged: () => void;
  onCopy: (markdown: string) => void;
  assets?: Attachment[];
  allowCopy?: boolean;
}) {
  const [file, setFile] = useState(destination.file),
    id = destination.originId || reportId;
  const [editing, setEditing] = useState(
      destination.file.mime === "application/pdf" && !destination.readonly,
    ),
    [action, setAction] = useState("move_object"),
    [selected, setSelected] = useState<any>(null),
    [rect, setRect] = useState([50, 200, 300, 100]),
    [editText, setEditText] = useState(""),
    [fontSize, setFontSize] = useState(12),
    [asset, setAsset] = useState(""),
    [preview, setPreview] = useState<any>(null),
    [comparison, setComparison] = useState(false),
    [job, setJob] = useState(""),
    [copyStart, setCopyStart] = useState(1),
    [copyEnd, setCopyEnd] = useState(file.page_count || 1);
  const objectDrag = useRef<{
    x: number;
    y: number;
    rect: number[];
    resize: boolean;
  } | null>(null);
  const objectGhost = useRef<HTMLCanvasElement>(null);
  const closeHandler = useRef(onClose);
  closeHandler.current = onClose;
  const regionStart = useRef<number[] | null>(null),
    copyRangeEdited = useRef(false);
  useEffect(() => setFile(destination.file), [destination.file]);
  useEffect(() => {
    if (!["queued", "processing"].includes(file.status)) return;
    const timer = setInterval(onChanged, 1500);
    return () => clearInterval(timer);
  }, [file.status, file.id, onChanged]);
  const [page, setPage] = useState(destination.page || 1),
    [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [pdf, setPdf] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [offset, setOffset] = useState(0),
    [image, setImage] = useState(""),
    [pageReady, setPageReady] = useState(false),
    [zoom, setZoom] = useState(1),
    [copying, setCopying] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null),
    host = useRef<HTMLDivElement>(null),
    close = useRef<HTMLButtonElement>(null),
    rendering = useRef<any>(null);
  const [width, setWidth] = useState(700);
  useEffect(() => {
    if (!copyRangeEdited.current && data?.page_count)
      setCopyEnd(data.page_count);
  }, [data?.page_count]);
  const currentRevision = destination.readonly
      ? destination.revision || file.revision
      : file.pdf_revision || file.revision,
    revision = preview && !comparison ? preview.revision : currentRevision;
  useEffect(() => {
    updateUiContext({
      attachment_id: file.id,
      attachment_page: page,
      attachment_origin_id: id,
      attachment_revision: revision,
    });
    return () => {
      if (uiSnapshot().attachment_id === file.id)
        updateUiContext({
          attachment_id: "",
          attachment_page: null,
          attachment_origin_id: "",
          attachment_revision: "",
        });
    };
  }, [id, file.id, page, revision]);
  useEffect(() => {
    const origin = document.activeElement as HTMLElement;
    close.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeHandler.current();
      }
    };
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("keydown", key, true);
      if (origin?.isConnected) origin.focus();
    };
  }, []);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.max(200, entries[0].contentRect.width - 32)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let active = true;
    setError("");
    setData(null);
    documentApi(
      `/${id}/attachments/${file.id}/page?page=${page}&revision=${revision}&offset=${offset}`,
    )
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, file.id, page, revision, offset, file.status]);
  useEffect(() => {
    if (file.mime !== "application/pdf") return;
    const task = pdfjs.getDocument({
      url: `/api/research/${id}/attachments/${file.id}/original?revision=${revision}`,
      httpHeaders: attachmentHeaders(),
    });
    let active = true;
    task.promise
      .then((doc) => {
        if (active) setPdf(doc);
        else void task.destroy();
      })
      .catch(() => {
        if (active)
          setError(
            "This PDF could not be displayed. Its original file is preserved.",
          );
      });
    return () => {
      active = false;
      rendering.current?.cancel();
      void task.destroy().catch(() => {});
      setPdf(null);
    };
  }, [id, file.id, revision]);
  useEffect(() => {
    setPageReady(false);
    setSelected(null);
    if (!pdf || !canvas.current) return;
    let active = true;
    let task: any;
    void pdf
      .getPage(page)
      .then(async (p: any) => {
        if (!active || !canvas.current) return;
        const scale =
          Math.min(width / p.getViewport({ scale: 1 }).width, 1.6) * zoom;
        const viewport = p.getViewport({ scale });
        const dpr = Math.min(
          devicePixelRatio || 1,
          2,
          Math.sqrt(12000000 / Math.max(1, viewport.width * viewport.height)),
        );
        const target = canvas.current;
        target.width = viewport.width * dpr;
        target.height = viewport.height * dpr;
        target.style.width = viewport.width + "px";
        target.style.height = viewport.height + "px";
        task = p.render({
          canvasContext: target.getContext("2d"),
          viewport,
          transform: [dpr, 0, 0, dpr, 0, 0],
        });
        rendering.current = task;
        await task.promise;
        if (active) setPageReady(true);
      })
      .catch((e: any) => {
        if (active && e?.name !== "RenderingCancelledException")
          setError("This page could not be rendered.");
      });
    return () => {
      active = false;
      task?.cancel();
    };
  }, [pdf, page, width, zoom]);
  useEffect(() => {
    if (!file.mime.startsWith("image/") || !file.images?.[0]) return;
    let active = true,
      url = "";
    fetch(
      `/api/research/${id}/attachments/${file.id}/images/${file.images[0].id}`,
      { headers: attachmentHeaders() },
    )
      .then((r) => {
        if (!r.ok) throw Error();
        return r.blob();
      })
      .then((b) => {
        url = URL.createObjectURL(b);
        if (active) setImage(url);
        else URL.revokeObjectURL(url);
      })
      .catch(() => {
        if (active) setError("Image unavailable");
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, file.id]);
  async function copy() {
    setCopying(true);
    setBusy(true);
    setError("");
    try {
      let text = "# " + file.name + "\n\n";
      const selection = window.getSelection();
      const selected =
        selection?.anchorNode && host.current?.contains(selection.anchorNode)
          ? selection.toString()
          : "";
      if (selected) {
        if (selected.length > 28000)
          throw Error("Choose a shorter text selection for the editable copy.");
        onCopy(text + selected);
        return;
      }
      for (
        let number = copyStart;
        number <= copyEnd && text.length < 30000;
        number++
      ) {
        let next: number | null = 0;
        do {
          const d = await documentApi(
            `/${id}/attachments/${file.id}/page?page=${number}&offset=${next}&revision=${revision}`,
          );
          text += d.text + "\n\n";
          next = d.next_offset ?? null;
        } while (next !== null && text.length < 30000);
      }
      if (text.length > 30000)
        throw Error(
          "Choose a shorter selection for the editable copy; the original stays available.",
        );
      for (const image of (revision === file.revision
        ? file.images
        : file.pdf_revisions?.find((r) => r.revision === revision)?.images || []
      )
        .filter(
          (image) =>
            !image.page || (image.page >= copyStart && image.page <= copyEnd),
        )
        .slice(0, 4))
        text +=
          "\n![" +
          image.caption.replace(/[\[\]]/g, "") +
          "](/api/research/" +
          id +
          "/attachments/" +
          file.id +
          "/images/" +
          image.id +
          ")\n";
      onCopy(text);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCopying(false);
      setBusy(false);
    }
  }
  async function reloadFile() {
    const d = await documentApi("/" + id + "/attachments");
    const next = d.attachments.find((f: Attachment) => f.id === file.id);
    if (next) setFile(next);
    onChanged();
  }
  useEffect(() => {
    if (!job) return;
    let active = true;
    let fetching = false;
    const check = async () => {
      if (fetching) return;
      fetching = true;
      try {
        const r = await fetch("/api/jobs?job_id=" + encodeURIComponent(job), {
          headers: attachmentHeaders(),
        });
        const d = await r.json();
        if (!active) return;
        const step = d.job?.actions?.[0];
        if (
          ["completed", "failed", "canceled", "uncertain"].includes(
            d.job?.state,
          )
        ) {
          setJob("");
          setBusy(false);
          if (d.job.state === "completed" && step?.result?.revision) {
            setPreview({
              ...step.result,
              edit_id:
                step.resolved_arguments?.edit_id || step.arguments?.edit_id,
            });
            setComparison(false);
            setSelected(null);
            requestAnimationFrame(() =>
              host.current
                ?.closest(".document-attachment-reader")
                ?.querySelector(".pdf-preview-banner")
                ?.scrollIntoView({ block: "start" }),
            );
            void reloadFile().catch((e) => setError(e.message));
          } else
            setError(
              step?.result?.reason ||
                "The PDF preview could not be completed. The original is preserved.",
            );
        }
      } catch (e: any) {
        if (active) setError(e.message);
      } finally {
        fetching = false;
      }
    };
    void check();
    const timer = setInterval(() => void check(), 1000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [job, id, file.id]);
  async function prepare() {
    setBusy(true);
    setError("");
    try {
      let commands: any[] = [];
      if (action === "add_page") commands = [{ action, page }];
      else if (action === "replace_image") {
        if (!selected || selected.type !== "image")
          throw Error("Select a native image object first.");
        if (!asset) throw Error("Choose an attached image.");
        const [image_attachment_id, image_id] = asset.split(":");
        commands = [
          { action: "remove_object", page, object_id: selected.id },
          { action: "insert_image", page, rect, image_id, image_attachment_id },
        ];
      } else {
        if (
          [
            "move_object",
            "resize_object",
            "replace_text",
            "remove_object",
          ].includes(action) &&
          !selected
        )
          throw Error("Select a native text or image object on this page.");
        const [image_attachment_id, image_id] = asset.split(":");
        commands = [
          {
            action,
            page,
            object_id: selected?.id,
            rect,
            text: editText,
            font_size: fontSize,
            image_id,
            image_attachment_id,
          },
        ];
      }
      const d = await documentApi(
        "/" + id + "/attachments/" + file.id + "/preview",
        { revision: currentRevision, commands },
      );
      setJob(d.job_id);
      if (!d.job_id) throw Error("The PDF preview was not admitted.");
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }
  async function applyPdf() {
    setBusy(true);
    setError("");
    try {
      if (preview.history)
        await documentApi("/" + id + "/attachments/" + file.id + "/restore", {
          expected_revision: currentRevision,
          revision: preview.revision,
        });
      else
        await documentApi("/" + id + "/attachments/" + file.id + "/apply", {
          revision: currentRevision,
          edit_id: preview.edit_id,
        });
      setFile((f) => ({ ...f, pdf_revision: preview.revision }));
      setPreview(null);
      setEditing(false);
      setSelected(null);
      requestAnimationFrame(() =>
        host.current
          ?.closest(".document-attachment-reader")
          ?.querySelector(".pdf-preview-banner")
          ?.scrollIntoView({ block: "start" }),
      );
      void reloadFile().catch((e) => setError(e.message));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (
      !selected ||
      selected.type !== "image" ||
      !objectGhost.current ||
      !canvas.current ||
      !data
    )
      return;
    const source = canvas.current,
      target = objectGhost.current,
      r = selected.rect;
    target.width = Math.max(1, (r[2] / data.width) * source.width);
    target.height = Math.max(1, (r[3] / data.height) * source.height);
    target
      .getContext("2d")
      ?.drawImage(
        source,
        (r[0] / data.width) * source.width,
        ((data.height - r[1] - r[3]) / data.height) * source.height,
        target.width,
        target.height,
        0,
        0,
        target.width,
        target.height,
      );
  }, [selected, data, pageReady, preview]);
  function nativeObject(o: any) {
    setSelected(o);
    if (o.type === "text") setAction("replace_text");
    setRect(o.rect.map((v: number) => Math.round(v * 10) / 10));
    setEditText(o.text || "");
    setFontSize(o.font_size || 12);
  }
  function point(e: React.PointerEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    return [
      ((e.clientX - box.left) / box.width) * data.width,
      ((box.bottom - e.clientY) / box.height) * data.height,
    ];
  }
  const imageChoices = assets.flatMap((f) =>
    (f.images || []).map((image) => ({
      value: f.id + ":" + image.id,
      label: f.name + " · " + image.caption,
    })),
  );
  const highlight = (data?.objects || []).filter(
    (o: any) =>
      o.rect &&
      destination.excerpt &&
      o.text &&
      destination.excerpt
        .replace(/\s+/g, " ")
        .includes(o.text.trim().slice(0, 35)),
  );
  return (
    <section
      className="document-attachment-reader"
      aria-label={"Document: " + file.name}
    >
      <header>
        <div>
          <small>
            {file.mime === "application/pdf"
              ? "PDF document"
              : "Attached document"}{" "}
            ·{" "}
            {preview && !comparison
              ? "Preview PDF revision"
              : currentRevision !== file.revision
                ? "Edited PDF"
                : "Original file"}
          </small>
          <h2>{file.name}</h2>
        </div>
        <button
          ref={close}
          className="document-close"
          onClick={onClose}
          aria-label="Close document"
        >
          <CloseIcon />
        </button>
      </header>
      <details className="document-file-options">
        <summary>File · Download & copy</summary>
        <div className="document-file-actions">
          <button
            onClick={() =>
              void downloadAttachment(id, file, revision).catch((e) =>
                setError(e.message),
              )
            }
          >
            Download{" "}
            {revision === file.revision
              ? "original"
              : preview
                ? "preview PDF"
                : "edited PDF"}
          </button>
          {revision !== file.revision && (
            <button
              onClick={() =>
                void downloadAttachment(id, file).catch((e) =>
                  setError(e.message),
                )
              }
            >
              Download original PDF
            </button>
          )}
          <button
            hidden={!allowCopy}
            disabled={busy || file.needs_ocr}
            onClick={() => void copy()}
          >
            {copying ? "Preparing copy…" : "Editable paper copy"}
          </button>
        </div>
        <details className="document-copy-options" hidden={!allowCopy}>
          <summary>Editable copy options</summary>
          {file.mime === "application/pdf" ? (
            <div>
              <label>
                From page
                <input
                  aria-label="Copy from page"
                  type="number"
                  min="1"
                  max={data?.page_count || file.page_count}
                  value={copyStart}
                  onChange={(e) => {
                    copyRangeEdited.current = true;
                    setCopyStart(
                      Math.max(
                        1,
                        Math.min(copyEnd, Number(e.target.value) || 1),
                      ),
                    );
                  }}
                />
              </label>
              <label>
                Through page
                <input
                  aria-label="Copy through page"
                  type="number"
                  min={copyStart}
                  max={data?.page_count || file.page_count}
                  value={copyEnd}
                  onChange={(e) => {
                    copyRangeEdited.current = true;
                    setCopyEnd(
                      Math.max(
                        copyStart,
                        Math.min(
                          data?.page_count || file.page_count,
                          Number(e.target.value) || 1,
                        ),
                      ),
                    );
                  }}
                />
              </label>
            </div>
          ) : null}
          <p>
            Choose a chapter or select text in the document below. Each
            editable-copy preview supports up to 30,000 characters; originals
            remain fully available.
          </p>
        </details>
      </details>
      {file.mime === "application/pdf" && !destination.readonly && (
        <div className="pdf-layout-toolbar">
          <button
            aria-pressed={editing}
            disabled={busy || !!preview}
            onClick={() => {
              setEditing((v) => !v);
              setSelected(null);
            }}
          >
            {editing ? "Read only" : "Original layout editing"}
          </button>
          <label>
            Revision{" "}
            <select
              aria-label="PDF revision history"
              value={preview?.revision || currentRevision}
              disabled={busy}
              onChange={(e) => {
                if (e.target.value === currentRevision) setPreview(null);
                else {
                  setPreview({ revision: e.target.value, history: true });
                  setComparison(false);
                  setSelected(null);
                }
              }}
            >
              <option value={file.revision}>Original PDF</option>
              {file.pdf_revisions?.map((r, i) => (
                <option key={r.revision} value={r.revision}>
                  PDF revision {i + 1}
                  {r.revision === currentRevision ? " · current" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {preview && (
        <div className="pdf-preview-banner" role="status">
          <strong>
            {preview.history ? "Review saved PDF revision" : "PDF edit preview"}
          </strong>
          <button
            aria-pressed={comparison}
            onClick={() => setComparison((v) => !v)}
          >
            {comparison ? "Show proposed version" : "Compare with current PDF"}
          </button>
          <button disabled={busy} onClick={() => void applyPdf()}>
            {preview.history ? "Restore this revision" : "Apply PDF changes"}
          </button>
          <button
            disabled={busy}
            onClick={() => {
              setPreview(null);
              setComparison(false);
            }}
          >
            Discard preview
          </button>
        </div>
      )}
      {editing && !preview && (
        <details className="pdf-edit-inspector">
          <summary>Insert & object options</summary>
          <section className="pdf-layout-tools" aria-label="PDF layout tools">
            <p>
              Click text to edit it on the page, select an image to reposition
              it, or drag an area to insert content. Use an editable paper copy
              for flowing rewrites.
            </p>
            {file.needs_ocr && (
              <p>
                Scanned pages have no native text objects. You can position
                images, add a text box, or add a page.
              </p>
            )}
            <label>
              Change{" "}
              <select
                aria-label="PDF change type"
                value={action}
                disabled={busy}
                onChange={(e) => setAction(e.target.value)}
              >
                <option value="move_object">Move object</option>
                <option value="resize_object">Resize object</option>
                <option value="replace_text">Replace native text</option>
                <option value="replace_image">Replace image</option>
                <option value="remove_object">Remove object</option>
                <option value="insert_text">Insert text box</option>
                <option value="insert_image">Insert image</option>
                <option value="add_page">Add page after this page</option>
              </select>
            </label>
            <small>
              {selected
                ? `Selected ${selected.type}: ${selected.id}`
                : "No native object selected"}
            </small>
            {action !== "add_page" && (
              <div className="pdf-rectangle">
                {["X", "Y", "Width", "Height"].map((name, index) => (
                  <label key={name}>
                    {name}
                    <input
                      type="number"
                      aria-label={"PDF " + name}
                      value={rect[index]}
                      disabled={busy}
                      onChange={(e) =>
                        setRect((old) =>
                          old.map((v, i) =>
                            i === index ? Number(e.target.value) : v,
                          ),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
            )}
            {["replace_text", "insert_text"].includes(action) && (
              <>
                <label>
                  Text
                  <textarea
                    aria-label="PDF replacement text"
                    value={editText}
                    disabled={busy}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                </label>
                {action === "insert_text" && (
                  <label>
                    Font size
                    <input
                      type="number"
                      min="6"
                      max="72"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                    />
                  </label>
                )}
              </>
            )}
            {["insert_image", "replace_image"].includes(action) && (
              <label>
                Attached image
                <select
                  aria-label="Image to insert"
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                >
                  <option value="">Choose an illustration</option>
                  {imageChoices.map((image) => (
                    <option key={image.value} value={image.value}>
                      {image.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button disabled={busy} onClick={() => void prepare()}>
              {busy ? "Preparing PDF preview…" : "Preview PDF changes"}
            </button>
          </section>
        </details>
      )}
      {error && (
        <p role="alert" className="document-error">
          {error}
        </p>
      )}
      <div className="document-page-toolbar">
        <label>
          Zoom{" "}
          <select
            aria-label="Document zoom"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          >
            {[0.75, 1, 1.25, 1.5].map((v) => (
              <option key={v} value={v}>
                {Math.round(v * 100)}%
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={page <= 1}
          onClick={() => {
            setPage((p) => p - 1);
            setOffset(0);
          }}
        >
          Previous page
        </button>
        <label>
          Page{" "}
          <input
            type="number"
            min="1"
            max={data?.page_count || file.page_count}
            value={page}
            onChange={(e) => {
              setPage(
                Math.max(
                  1,
                  Math.min(
                    data?.page_count || file.page_count,
                    Number(e.target.value) || 1,
                  ),
                ),
              );
              setOffset(0);
            }}
          />{" "}
          of {data?.page_count || file.page_count}
        </label>
        <button
          disabled={page >= (data?.page_count || file.page_count)}
          onClick={() => {
            setPage((p) => p + 1);
            setOffset(0);
          }}
        >
          Next page
        </button>
      </div>
      <div className="document-original" ref={host}>
        {file.mime === "application/pdf" ? (
          <div
            className="document-page-canvas"
            onPointerDown={(e) => {
              if (
                !editing ||
                preview ||
                !data ||
                !["insert_text", "insert_image"].includes(action)
              )
                return;
              regionStart.current = point(e);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!regionStart.current) return;
              const [x, y] = point(e),
                [sx, sy] = regionStart.current;
              setRect(
                [
                  Math.min(x, sx),
                  Math.min(y, sy),
                  Math.max(1, Math.abs(x - sx)),
                  Math.max(1, Math.abs(y - sy)),
                ].map((v) => Math.round(v * 10) / 10),
              );
            }}
            onPointerUp={() => {
              regionStart.current = null;
            }}
          >
            <canvas
              ref={canvas}
              style={{ opacity: pageReady ? 1 : 0 }}
              aria-busy={!pageReady}
              aria-label={`${revision === file.revision ? "Original PDF" : "PDF revision"} page ${page}`}
            />
            {editing &&
              !preview &&
              pageReady &&
              (data?.objects || [])
                .filter(
                  (o: any) => o.rect && ["text", "image"].includes(o.type),
                )
                .map((o: any) => (
                  <button
                    key={o.id}
                    className={
                      "pdf-native-object" +
                      (selected?.id === o.id ? " selected" : "")
                    }
                    aria-label={`Select ${o.type} object ${o.id}: ${(o.text || "Image").slice(0, 60)}`}
                    aria-pressed={selected?.id === o.id}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      if (o.type !== "image") return;
                      nativeObject(o);
                      setAction("move_object");
                      objectDrag.current = {
                        x: e.clientX,
                        y: e.clientY,
                        rect: o.rect,
                        resize: false,
                      };
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                      const drag = objectDrag.current;
                      if (!drag || !data) return;
                      const box = host.current?.getBoundingClientRect();
                      if (!box) return;
                      const scale =
                        (canvas.current?.getBoundingClientRect().width ||
                          box.width) / data.width;
                      setRect([
                        Math.max(
                          0,
                          Math.min(
                            data.width - drag.rect[2],
                            drag.rect[0] + (e.clientX - drag.x) / scale,
                          ),
                        ),
                        Math.max(
                          0,
                          Math.min(
                            data.height - drag.rect[3],
                            drag.rect[1] - (e.clientY - drag.y) / scale,
                          ),
                        ),
                        drag.rect[2],
                        drag.rect[3],
                      ]);
                    }}
                    onPointerUp={() => {
                      objectDrag.current = null;
                    }}
                    onClick={() => {
                      if (o.type !== "image" || selected?.id !== o.id)
                        nativeObject(o);
                    }}
                    style={{
                      left: (o.rect[0] / data.width) * 100 + "%",
                      top:
                        ((data.height - o.rect[1] - o.rect[3]) / data.height) *
                          100 +
                        "%",
                      width: (o.rect[2] / data.width) * 100 + "%",
                      height: (o.rect[3] / data.height) * 100 + "%",
                    }}
                  />
                ))}
            {editing &&
              !preview &&
              selected?.type === "image" &&
              data?.width && (
                <div
                  className="pdf-image-transform"
                  style={{
                    left: (rect[0] / data.width) * 100 + "%",
                    top:
                      ((data.height - rect[1] - rect[3]) / data.height) * 100 +
                      "%",
                    width: (rect[2] / data.width) * 100 + "%",
                    height: (rect[3] / data.height) * 100 + "%",
                  }}
                >
                  <canvas ref={objectGhost} />
                  <button
                    aria-label="Resize selected PDF image"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      objectDrag.current = {
                        x: e.clientX,
                        y: e.clientY,
                        rect: [...rect],
                        resize: true,
                      };
                      setAction("resize_object");
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                      const drag = objectDrag.current;
                      if (!drag?.resize) return;
                      const scale =
                        (canvas.current?.getBoundingClientRect().width || 600) /
                        data.width;
                      const height = Math.max(
                        10,
                        Math.min(
                          drag.rect[1] + drag.rect[3],
                          drag.rect[3] + (e.clientY - drag.y) / scale,
                        ),
                      );
                      setRect([
                        drag.rect[0],
                        drag.rect[1] + drag.rect[3] - height,
                        Math.max(
                          10,
                          Math.min(
                            data.width - drag.rect[0],
                            drag.rect[2] + (e.clientX - drag.x) / scale,
                          ),
                        ),
                        height,
                      ]);
                    }}
                    onPointerUp={() => {
                      objectDrag.current = null;
                    }}
                  >
                    ↘
                  </button>
                  <button
                    className="pdf-preview-transform"
                    disabled={busy}
                    onClick={() => void prepare()}
                  >
                    Preview image change
                  </button>
                </div>
              )}
            {editing &&
              !preview &&
              selected?.type === "text" &&
              action === "replace_text" &&
              data?.width && (
                <div
                  className="pdf-inline-text"
                  style={{
                    left: (rect[0] / data.width) * 100 + "%",
                    top:
                      ((data.height - rect[1] - rect[3]) / data.height) * 100 +
                      "%",
                    width: Math.max((rect[2] / data.width) * 100, 12) + "%",
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <textarea
                    aria-label="Edit selected PDF text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    style={{ fontSize: fontSize * zoom }}
                  />
                  <button disabled={busy} onClick={() => void prepare()}>
                    Preview change
                  </button>
                  <button
                    aria-label="Cancel text edit"
                    onClick={() => setSelected(null)}
                  >
                    <CloseIcon />
                  </button>
                </div>
              )}
            {editing &&
              ["insert_text", "insert_image"].includes(action) &&
              data?.width && (
                <mark
                  className="pdf-insert-region"
                  style={{
                    left: (rect[0] / data.width) * 100 + "%",
                    top:
                      ((data.height - rect[1] - rect[3]) / data.height) * 100 +
                      "%",
                    width: (rect[2] / data.width) * 100 + "%",
                    height: (rect[3] / data.height) * 100 + "%",
                  }}
                />
              )}
            {highlight.map((o: any) => (
              <mark
                key={o.id}
                className="document-highlight"
                style={{
                  left: (o.rect[0] / data.width) * 100 + "%",
                  top:
                    ((data.height - o.rect[1] - o.rect[3]) / data.height) *
                      100 +
                    "%",
                  width: (o.rect[2] / data.width) * 100 + "%",
                  height: (o.rect[3] / data.height) * 100 + "%",
                }}
              />
            ))}
          </div>
        ) : image ? (
          <img src={image} alt={file.name} />
        ) : (
          <div
            className="document-text-blocks"
            onClick={(e) => {
              const link = (e.target as Element).closest("a");
              if (link) {
                e.preventDefault();
                setError(
                  "This address is in the attached document: " +
                    link.getAttribute("href"),
                );
              }
            }}
          >
            {file.mime === "text/markdown" ||
            file.mime.includes("wordprocessingml") ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    marked.parse(data?.text || "", { async: false }) as string,
                    { FORBID_TAGS: ["img", "iframe", "script", "style"] },
                  ),
                }}
              />
            ) : (
              data?.text
                ?.split(/\n\n/)
                .map((text: string, i: number) => <p key={i}>{text}</p>)
            )}
          </div>
        )}
        {!data && !error && <p role="status">Opening document…</p>}
        {data?.next_offset != null && (
          <button onClick={() => setOffset(data.next_offset)}>
            Next text section
          </button>
        )}
        {file.mime === "application/pdf" && (
          <details className="document-page-text">
            <summary>Page text and evidence</summary>
            <p>
              {data?.text ||
                "No native text is available on this page. The original page remains viewable."}
            </p>
          </details>
        )}
      </div>
    </section>
  );
}
