# AEGIS Zephium embedded browser audit

## Versions inspected

The clean local clone at `astra_ai/ui/zephium-source` is on main at `7ccc28ff1cb102aba69ef4415fee266b8239fa0d`. The public main HEAD and the peeled v1.0.5 tag both resolve to `1c4846cec9a9a0ab40ed45113d69a3f3c244d279`. The annotated tag object is `317fd1abac1da9d923c54cad76e45dc575c39032`. GitHub's compare API reports 452 commits ahead and zero behind. The upstream comparison and pinned source files were read independently of the local clone.

[Release v1.0.5](https://github.com/zephium-browser/Zephium/releases/tag/v1.0.5) · [Public comparison](https://api.github.com/repos/zephium-browser/Zephium/compare/7ccc28ff1cb102aba69ef4415fee266b8239fa0d...1c4846cec9a9a0ab40ed45113d69a3f3c244d279)

Relevant v1.0.5 changes include scoping source replies to their view lifetime, protecting native frame requests before dispatch on Windows, download confirmation, browser stacking and WebKit navigation-response handling. The first directly informs request ownership in AEGIS. Native renderer, profile and download changes belong to the host platform and cannot be applied to a web iframe. The latest release still uses the measured native pane and tab commands.

## Source path

| Layer | Zephium source and behavior |
| --- | --- |
| Work entry | `frame/src/features/work/components/WorkEnvironmentWorkspace.svelte`: `openPane` takes a URL or existing tab, `openCitation` uses the URL path, `requestPane` admits the pane, and the layout projection confirms presentation. |
| Controls | `frame/src/features/work/components/pane/BrowserPane.svelte` renders toolbar/address and reports the pane rectangle. `WorkEnvironmentWorkspace.svelte` sends `tabsNavigate`, `tabsBack`, `tabsForward` and `tabsReload` to the current tab ID. Add to Work calls `attach([paneTab.id])`. |
| Bridge and lifecycle | `frame/src/domain/work-pane/work-pane.ts` sends show/hide/setRect. `frame/src/domain/layout/layout.svelte.ts` consumes the native layout projection. `paneMeasured` passes the current generation, and `closePane` clears its deadline, hides the pane and restores focus. |
| Native shell | `crates/zephium-app/src/shell/work_pane.rs` implements `operation_work_pane_show`, `operation_work_pane_hide`, `work_pane_set_rect` and `retire_work_pane`. Shell operations route typed commands and native presentation supplies the content behind the measured hole. |
| Engine | `desktop/tauri.conf.json`, `Cargo.toml`, `vendor/wry`, `vendor/tauri-runtime-wry`, `crates/zephium-engine/src/platform/windows/mod.rs`, `crates/zephium-core/src/webview2.rs` and `webview2_runtime.rs` cover Tauri/Wry and WebView2. The macOS backend is WebKit. `crates/zephium-engine/src/platform/work_document_navigation.rs` tracks committed documents and in-page navigation evidence. |
| Native metadata | `frame/src/domain/favicons/favicons.svelte.ts` consumes size-checked RGBA rasters from the host keyed by profile and revision. Native history and document metadata come from the projected tab. |

[Release source tree](https://github.com/zephium-browser/Zephium/tree/1c4846cec9a9a0ab40ed45113d69a3f3c244d279)

## AEGIS integration and boundaries

React `astra_ai/ui/frontend/src/components/Research/ResearchWorkspace.tsx` passes actions to the Svelte canvas. `work-canvas/src/AegisWorkHost.svelte` opens a keyed browser window by research ID and URL. `browser-windows.svelte.ts` maintains history and order. `BrowserWindow.svelte` reuses the MPL toolbar, drag and resize. A frame loads directly from its publisher. The owner-only frame check in `astra_ai/ui/backend/api/research.py` calls `astra_ai/core/research/frame_policy.py`, which checks public DNS and pins the checked IP for each redirect. The existing `/api/work/reader` path in `astra_ai/ui/backend/api/work.py` calls `astra_ai/core/work/network.py` for sanitized, bounded public text. The reader is visually labeled and never used to relay a site as a live page.

AEGIS has no native desktop WebView host outside the upstream reference trees. Importing the Rust shell would introduce a new app, profile and IPC privilege boundary. The web implementation will use an opaque-origin sandbox, browser-enforced frame policies and an explicit reader or external-browser escape hatch for incompatible pages. Cross-origin navigation and document metadata are unavailable to the parent. The toolbar tracks addresses opened through AEGIS, displays known source metadata, and describes that limitation when opening or adding the page. Public-address validation applies to app-initiated requests. Browser policy governs resources requested by the framed site itself.

Add to Work uses the current registered address and existing `/api/research/{id}/work-sources` persistence. Source citations and original evidence keep their identities. Browsing, reloading and saving a source do not submit a model request. Requests and UI updates will be scoped to the active address and pane lifetime. No third-party script, native bridge, credential capture or response-header rewriting is needed.

The upstream project is MPL-2.0. `work-canvas/NOTICE.md` and `upstream/MANIFEST.json` record the existing covered files and their source origin. Native vendored dependencies carry their own notices. Retain the current provenance and apply only compatible behavior to AEGIS's existing pane.

[Mozilla Public License 2.0](https://www.mozilla.org/MPL/2.0/)

## Release diff and native lifecycle details

| Release change | Verified changed files |
| --- | --- |
| Source reply and copy confirmation lifetime | frame/src/features/source/components/SourcePage.svelte and its component test. [Source reply lifetime](https://github.com/zephium-browser/Zephium/pull/267) · [Copy confirmation lifetime](https://github.com/zephium-browser/Zephium/pull/315) |
| Work composer sizing | frame/src/features/work/components/bar/WorkBar.svelte and WorkBarSizing.component.test.ts. [WorkBar change](https://github.com/zephium-browser/Zephium/pull/396) |
| Native chrome stacking | crates/zephium-app/src/shell/window_layout.rs, desktop/src/lib.rs and frame/src/domain/surface/chrome-modal.ts among the changed files. [Chrome stacking](https://github.com/zephium-browser/Zephium/pull/399) |
| Windows refused-frame request handling | crates/zephium-engine/src/platform/windows/mod.rs and refused_frames.rs. [Windows frame protection](https://github.com/zephium-browser/Zephium/pull/404) |
| Missing navigation response on WebKit | vendor/wry/src/wkwebview/navigation.rs and vendor/wry/FORK.toml. [WebKit navigation fix](https://github.com/zephium-browser/Zephium/pull/274) |

The local clone is non-shallow and the working tree was clean when inspected. No checkout update was needed. The Work pane show, hide, setRect and tab command call sites are present in both revisions. This is a compatibility check of the inspected pane path, not a claim that all native APIs are unchanged.

WorkEnvironmentWorkspace.svelte::openBranchPage resolves a page ID through pageEntries and opens its stored URL and optional account. If the run still owns a browser page that needs human interaction, it enters openTakeover. An existing browser card uses a tab target. On the native side, shell/tabs.rs handles tab opening, focus and close. crates/zephium-engine/src/host/construction.rs::build_view and build_view_inner create the browser view and install the popup policy. host/work_windows.rs::build_windows_work_view and return_work_site_session handle isolated Work resources. host/profiles.rs, work_site_session.rs and work_website_data.rs own profile/site data and cookie lifecycle. shell/page_permissions.rs and host/page_permissions.rs handle permission routing. shell/history.rs, shell/favicons.rs and host/favicon.rs supply history and favicon data. AEGIS reuses the pane chrome and follows the view-lifetime pattern in its web requests.

## AEGIS validation

In the running AEGIS app, a source card in an existing research run opened Wikipedia. Clicking an article link and resizing the pane kept the page usable. The frame could not read the parent application's DOM. The pane navigated to a second live article and supported Back, Forward and Reload. GitHub's frame-ancestors policy opened the labeled Source Reader. Two source windows opened with the same canvas viewport. A test-intercepted Add to Work request posted the correct source URL once. The backend's isolated source persistence test verified duplicate writes resolve to one saved reference. The browser test intercepted its write.
The browser also verified dragging the pane, minimizing and restoring it, submitting the site's own search form, and closing the pane.
