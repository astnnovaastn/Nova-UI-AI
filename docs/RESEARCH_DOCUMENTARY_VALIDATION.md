# Research context and written Documentary delivery

## Milestone 1 — loading and context

Delivered 19 October 2026: immediate history selection, cached rendering, delayed opening skeleton, retry, selection-revision acknowledgement, server-resolved voice focus and frozen reply attribution. Selected context includes bounded composed content, visible sections and evidence. A scoped recent-report reference is retained when returning to Dashboard or Memory.

Validation: 49 targeted backend regressions, 19 frontend reader/notification tests, TypeScript and production build. Stores and replaced source were backed up in the running installation before deployment. Source commit: `be9bc7a` on the existing selected branch.

## Milestone 2 — Documentary and attachments

The composer menu offers separate saved chats, research and written Documentary entries. Documentary uses Document, Edit, Sources and Assets. Report conversion creates a linked artifact, reuses scoped evidence and leaves the source report unchanged. Composition uses the existing background provider, budget and durable queue. Quota waits preserve evidence; scanned-only files remain viewable and require OCR before evidence-based writing.

PDF, DOCX, TXT, Markdown and PNG/JPEG/WebP originals are immutable and scoped. Extraction runs through the existing queue and CPU semaphore; jobs carry attachment IDs rather than files. Limits are 25 MB per file, five files per entry and 100 PDF pages. Extracted bodies and images live outside the report-history JSON. Page/block responses are bounded. Original PDF viewing uses PDF.js; uploaded-page citations carry real page references. Editable copies and AI edits use explicit, revision-checked previews.

Validation: nine new real-file/API regressions cover PDF text/images, unaffected render regions, replacement/overflow, preview/apply/undo, malformed/encrypted files, DOCX tables/images, scopes, bounded retrieval and quota resume. Combined research/workflow/context checks passed; 181 frontend tests, TypeScript and production build passed. Browser inspection verified the menu, Documentary tabs, local PDF upload, original viewing and editable-copy preview/apply into the existing Editor. Synthetic validation files stay under `.validation/` and are excluded from Git.

## Milestone 3 — PDF editing and integrated validation

Delivered native text/image selection, move/resize/replace/remove, region selection, text/image insertion and added pages. PDF operations use a single PDFium lock alongside the existing job/CPU limits. Each edit prepares a separate revision; comparison, apply, restore-original and saved revision selection are explicit. Revision conflicts, shifted native object IDs, missing font characters, page bounds and text overflow receive errors instead of silently damaging a page. Scans remain viewable with their original images; native text editing is offered only for actual text objects.

Illustrations appear in editable copies and PDF/DOCX/HTML exports through scoped image IDs. Source-page references reopen the original revision, even after editing the PDF. Private attachment links in exports reopen the scoped application reader; public source URLs remain public URLs. AI context includes the selected attachment page and bounded native objects when a document is open. Large uploads use bounded evidence selection with unchanged source IDs; quota recovery does not repeat a completed search.

Final automated checks: **646 backend tests passed, one skipped; 185 frontend tests passed; TypeScript and production build passed.** Existing FastAPI/AnyIO deprecation notices and existing Vite bundle-size/Calculator `eval` warnings remain. No credentials, uploaded documents, private stores, dependency directories or validation artifacts are committed.

Personally tested in the local browser: Documentary tabs and file upload; original PDF rendering; native image selection and movement preview; compare/apply; restoring the original; illustrated-copy preview/apply into the existing Editor; a real PDF export, rendered and inspected; standalone central chat without report tabs; exported attachment links reopening the original page; page highlighting; Escape close and citation-focus restoration. Desktop viewport overrides of 1280×720, 1536×864 and 1920×1080 were reviewed with the browser's existing zoom retained, and the override was reset. The floating composer remains outside final-content padding. Keyboard controls expose labels and native focus; reduced-motion rules were inspected without changing the user's OS preference.

Evidence screenshots and synthetic files are saved locally under `.validation/` and excluded from Git. A clearly named **PDF layout validation sample** entry is retained in local history for inspection. User working documents were not edited by the validation flow.

Physical microphone capture, audible playback and an extended live voice session during rapid workspace switching still require a human/device check. Automated pinned-turn, scope, player and quota regressions do not substitute for those checks. Live provider availability still follows the configured account's quota; synthesis waiting on quota remains pending with evidence accessible. OCR is optional and is not supplied as a new provider or capability by this change.
