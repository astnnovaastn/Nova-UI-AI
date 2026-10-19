# Research context and written Documentary delivery

## Milestone 1 — loading and context

Delivered 19 October 2026: immediate history selection, cached rendering, delayed opening skeleton, retry, selection-revision acknowledgement, server-resolved voice focus and frozen reply attribution. Selected context includes bounded composed content, visible sections and evidence. A scoped recent-report reference is retained when returning to Dashboard or Memory.

Validation: 49 targeted backend regressions, 19 frontend reader/notification tests, TypeScript and production build. Stores and replaced source were backed up in the running installation before deployment. Source commit: `be9bc7a` on the existing selected branch.

## Milestone 2 — Documentary and attachments

The composer menu offers separate saved chats, research and written Documentary entries. Documentary uses Document, Edit, Sources and Assets. Report conversion creates a linked artifact, reuses scoped evidence and leaves the source report unchanged. Composition uses the existing background provider, budget and durable queue. Quota waits preserve evidence; scanned-only files remain viewable and require OCR before evidence-based writing.

PDF, DOCX, TXT, Markdown and PNG/JPEG/WebP originals are immutable and scoped. Extraction runs through the existing queue and CPU semaphore; jobs carry attachment IDs rather than files. Limits are 25 MB per file, five files per entry and 100 PDF pages. Extracted bodies and images live outside the report-history JSON. Page/block responses are bounded. Original PDF viewing uses PDF.js; uploaded-page citations carry real page references. Editable copies and AI edits use explicit, revision-checked previews.

Validation: nine new real-file/API regressions cover PDF text/images, unaffected render regions, replacement/overflow, preview/apply/undo, malformed/encrypted files, DOCX tables/images, scopes, bounded retrieval and quota resume. Combined research/workflow/context checks passed; 181 frontend tests, TypeScript and production build passed. Browser inspection verified the menu, Documentary tabs, local PDF upload, original viewing and editable-copy preview/apply into the existing Editor. Synthetic validation files stay under `.validation/` and are excluded from Git.

## Milestone 3 — remaining integrated validation

PDF layout controls, illustrated editable copies/exports, populated desktop widths, final regressions and post-deployment checks are still being completed. Physical microphone capture and audible playback require a human/device check; automated context and player regressions do not substitute for that check.
