AEGIS Research canvas: third-party notices

Most of this component is source code from Zephium
(https://github.com/zephium-browser/Zephium), commit
9026a1fffad74d6e201ef97fe8c02c1b01403cd2, used under the Mozilla Public License 2.0.

  This Source Code Form is subject to the terms of the Mozilla Public License,
  v. 2.0. If a copy of the MPL was not distributed with this file, You can
  obtain one at https://mozilla.org/MPL/2.0/.

The notice above applies to every file in work-canvas/upstream/ and to
work-canvas/src/AegisWorkHost.svelte, work-canvas/src/BrowserWindow.svelte and work-canvas/src/NodePanel.svelte. SourceStackOverlay.svelte and SkillMarks.svelte integrate the original PartRow, PageFace, InputMark and run/lines modules; all Zephium-derived portions retain MPL-2.0 coverage. work-canvas/upstream/MANIFEST.json lists each
copied file and says whether it is unchanged or adapted, and why. The source of the
covered files is in work-canvas/ in this repository and at the upstream address above.

AEGIS is not affiliated with Zephium. The Zephium name and logo are not licensed
under the MPL and are not used here.

Bundled packages: Svelte, Svelte Flow (@xyflow/svelte), Bits UI, marked, Tiptap and
Hugeicons free icons (MIT); Inter font through Fontsource (SIL Open Font License 1.1).
elkjs is deliberately not included.

V21 additionally integrates the original Notes editor/list, TaskComposer, TaskList,
TaskBoard, CommandReview, CommandRecord and Work object renderers through AEGIS
adapters in src/tools and src/objects. Those integration portions remain MPL-2.0.
The Python storage and isolated-execution adapters are AEGIS implementations;
no Zephium Rust runtime or AGPL backend module is bundled.


The Ask composer and welcome view in src/assist/ are adapted from Zephium's
frame/src/features/assist/components/Composer.svelte and Empty.svelte at the
commit above. Their Zephium-derived code and styles remain under MPL-2.0.

V30 adapts the Ask welcome view from frame/src/features/assist/components/Empty.svelte
and ports the conversation layout and scrolling behavior from Thread.svelte and
PersonMessage.svelte into the Research drawer. The Work composer is the shared
input surface. Zephium-derived portions retain MPL-2.0 coverage.
