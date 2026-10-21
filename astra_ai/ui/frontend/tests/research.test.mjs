import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Exercise the same pure decisions used by the React reader and real player.
const source = fs.readFileSync(
  new URL("../src/components/Research/ResearchWorkspace.tsx", import.meta.url),
  "utf8",
);
const tree = ts.createSourceFile(
  "research.tsx",
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const names = [
  "citationParts",
  "videoId",
  "videoVolumeStep",
  "previewPlacement",
  "videoTimestamp",
  "researchProgress",
  "researchWaitMessage",
  "mergeMedia",
  "pausePlayers",
  "researchDestination",
  "imageComposition",
  "sourceLinkKey",
  "freshSourceLinks",
  "citedSourceKeys",
  "companionParagraphs",
  "sectionLabel",
  "followupGroups",
];
const selected = tree.statements
  .filter((n) => ts.isFunctionDeclaration(n) && names.includes(n.name?.text))
  .map((n) => n.getText(tree))
  .join("\n");
const context = { URL, URLSearchParams, activePlayers: new Set() };
vm.createContext(context);
vm.runInContext(
  ts.transpileModule(selected, {
    compilerOptions: { target: ts.ScriptTarget.ES2020 },
  }).outputText,
  context,
);
const plain = (value) => JSON.parse(JSON.stringify(value));
const sources = [
  { id: "S1", title: "First" },
  { id: "S2", title: "Second" },
];

test("each source and YouTube link appears once; later citations produce no replacement", () => {
  const seen = new Set();
  const first = {id:"S1",url:"https://www.example.com/article?utm_source=search",title:"Evidence"};
  const same = {id:"S2",url:"https://example.com/article#details",title:"Same evidence"};
  assert.deepEqual(plain(context.freshSourceLinks([first,same],seen)), [first]);
  assert.deepEqual(plain(context.freshSourceLinks([same,first],seen)), []);
  const youtube={id:"S3",url:"https://youtube.com/watch?v=dQw4w9WgXcQ",title:"Video"};
  assert.equal(context.freshSourceLinks([youtube],seen).length,1);
  assert.equal(context.freshSourceLinks([{...youtube,url:"https://youtu.be/dQw4w9WgXcQ?t=12"}],seen).length,0);
  const prior=context.citedSourceKeys("A supported sentence [S1].",[first,same]);
  assert.equal(context.freshSourceLinks([same],new Set(prior)).length,0);
});

test("reader composition adapts to image proportions, paragraph length and collection size", () => {
  const long = "A connected explanation with inline evidence. ".repeat(20);
  assert.equal(context.imageComposition([], long), "none");
  assert.equal(context.imageComposition([{width:800,height:500}], long), "aside");
  assert.equal(context.imageComposition([{width:800,height:500}], "A compact supporting explanation. ".repeat(12)), "aside-end");
  assert.equal(context.imageComposition([{width:400,height:700}], long), "portrait");
  assert.equal(context.imageComposition([{width:1200,height:400}], long), "wide");
  assert.equal(context.imageComposition([{width:800,height:500,caption:"Architecture diagram"}], long), "wide");
  assert.equal(context.imageComposition([{width:800,height:500}], "A short observation."), "compact");
  const pair = [{width:800,height:500},{width:900,height:600}];
  assert.equal(context.imageComposition(pair,long), "pair");
  assert.equal(context.imageComposition(pair,"A short comparison."), "gallery");
  assert.equal(context.imageComposition([...pair,pair[0]],long), "gallery");
});

test("illustrations absorb adjacent prose without crossing headings or another picture", () => {
  const last={tagName:"H2",textContent:"Next topic",nextElementSibling:null};
  const second={tagName:"P",textContent:"A substantial connected explanation. ".repeat(25),nextElementSibling:last};
  const first={tagName:"P",textContent:"A short introduction.",nextElementSibling:second};
  assert.equal(context.companionParagraphs(first,[])[0],second);
  assert.equal(context.companionParagraphs(second,[]).length,0);
  assert.equal(context.companionParagraphs(first,[{placement_text:second.textContent.slice(0,90)}]).length,0);
});
test("section labels remain distinct from sentence emphasis and entity names", () => {
  for (const label of ["Display and Design", "Camera Capabilities", "Workload Dictates Hardware:", "Apple iPhone vs Google Pixel"])
    assert.equal(context.sectionLabel(label), true, label);
  for (const label of ["OpenAI", "Both devices", "This is the conclusion.", "This is not a heading", "A".repeat(90)])
    assert.equal(context.sectionLabel(label), false, label);
});
test("saved follow-up blocks keep stable topic boundaries across page retrieval", () => {
  const blocks=[{id:"1",text:"First ",section_id:"a",section_title:"Camera follow-up"},{id:"2",text:"paragraph",section_id:"a"},{id:"3",text:"Second topic",section_id:"b",section_title:"Battery follow-up"}];
  const grouped=plain(context.followupGroups(blocks));
  assert.deepEqual(grouped.map(g=>[g.id,g.title,g.text]),[["a","Camera follow-up","First paragraph"],["b","Battery follow-up","Second topic"]]);
  assert.equal(context.followupGroups([...blocks,{id:"4",text:" continued",section_id:"b"}])[1].text,"Second topic continued");
});

test("Expand only reads saved pages, ignores repeat clicks and preserves a switched report", async () => {
  const declarations=[];
  function visit(node) { if(ts.isFunctionDeclaration(node) && ["expand","more","moreExtensions"].includes(node.name?.text)) declarations.push(node.getText(tree)); ts.forEachChild(node,visit); }
  visit(tree);
  const calls=[];
  const saved={research_id:"a",research_revision:"revision",report:"First\n\n",next_cursor:4};
  const run={report:saved,revealPending:{current:false},setRevealingSaved:()=>{},setReaderChars:()=>{},setError:message=>{throw Error(message);},setReport:update=>{run.report=update(run.report);},api:async(path,options)=>{calls.push({path,options});return {research_revision:"revision",report:"Saved continuation",next_cursor:null,reader_end:8};}};
  vm.createContext(run);vm.runInContext(ts.transpileModule(declarations.join("\n"),{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,run);
  await Promise.all([run.expand(),run.expand()]);
  assert.equal(calls.length,1);assert.equal(calls[0].options,undefined);
  assert.match(calls[0].path,/reader\?revision=revision&cursor=4&stream=base/);
  assert.equal(run.report.report,"First\n\nSaved continuation");
  await run.expand();assert.equal(calls.length,1);
  run.report={...saved};
  run.api=async()=>{run.report={research_id:"b",research_revision:"other",report:"Other report"};return {research_revision:"revision",report:"Late answer",next_cursor:null};};
  await run.expand();assert.equal(run.report.report,"Other report");
});

test("a removed saved selection clears cleanly while an unknown entry remains retryable", async () => {
  let declaration;
  function visit(node) { if(ts.isFunctionDeclaration(node) && node.name?.text==="select") declaration=node.getText(tree); ts.forEachChild(node,visit); }
  visit(tree);
  const noop=()=>{};
  const run={setEditorGeneration:noop,setMessage:noop,reportCache:{current:new Map()},report:null,loadEpoch:{current:0},lastSelection:{current:"removed"},reader:{current:null},location:{hash:""},researchDestination:()=>null,conversationSnapshot:()=>({clientId:"owner",guest:false}),setTab:noop,setError:message=>{run.error=message;},setSelectionLoading:noop,setFailedSelection:value=>{run.failed=value;},setPreview:noop,setImageView:noop,setAttachment:noop,setDocumentEdit:noop,setReport:value=>{run.report=value;},updateUiContext:noop,api:async()=>null,loadReport:async()=>{throw {status:410,message:"Removed"};},sessionStorage:{removeItem:()=>{run.cleared=true;}},refresh:async()=>{}};
  vm.createContext(run);vm.runInContext(ts.transpileModule(declaration,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,run);
  await run.select("removed");
  assert.equal(run.error,"");assert.equal(run.failed,"");assert.equal(run.lastSelection.current,"");assert.equal(run.cleared,true);
  run.loadReport=async()=>{throw {status:404,message:"Unavailable"};};
  await run.select("unknown");assert.equal(run.failed,"unknown");assert.equal(run.error,"Unavailable");
});

test("Gemini grouped citations become pills while literal source-like text stays intact", () => {
  assert.deepEqual(
    plain(
      context.citationParts("S1 is a label. Supported [S1, S2; S1].", sources),
    ),
    ["S1 is a label. Supported ", [sources[0], sources[1]], "."],
  );
  assert.deepEqual(
    plain(context.citationParts("Unknown [S1, S999].", sources)),
    ["Unknown ", "", "."],
  );
});

test("adjacent citations group in evidence order and repeated references deduplicate", () => {
  const parts = plain(
    context.citationParts("A supported claim [S2] [S1][S2].", sources),
  );
  assert.deepEqual(parts, [
    "A supported claim ",
    [sources[1], sources[0]],
    ".",
  ]);
});
test("unavailable source references leave plain text without fabricated links or numbers", () => {
  const parts = plain(
    context.citationParts(
      "Unknown [S999]; mixed [S1][S999]; malformed [Sx].",
      sources,
    ),
  );
  assert.equal(
    parts.filter((p) => typeof p === "string").join(""),
    "Unknown ; mixed ; malformed [Sx].",
  );
});
test("literal code, mathematical notation and quotation content remain exact", () => {
  const text = "✨ example [S1] x² + y² = z² https://example.org/[S2]";
  assert.deepEqual(plain(context.citationParts(text, sources, true)), [text]);
  assert.equal(context.citationParts("✨ Findings", sources)[0], "Findings");
});
test("video routing accepts real YouTube forms and rejects lookalike hosts and malformed IDs", () => {
  for (const url of [
    "https://youtu.be/abcdefghijk",
    "https://www.youtube.com/watch?v=abcdefghijk",
    "https://youtube.com/shorts/abcdefghijk",
    "https://youtube.com/embed/abcdefghijk",
  ])
    assert.equal(context.videoId(url), "abcdefghijk");
  for (const url of [
    "https://youtube.com.attacker.invalid/watch?v=abcdefghijk",
    "https://youtu.be/short",
    "https://example.org/abcdefghijk",
  ])
    assert.equal(context.videoId(url), null);
});
const idle = { normal: null, manualOverride: false };
const speaking = { talking: true, playing: true, muted: false, volume: 80 };
test("spoken turns duck to twenty percent once and restore the previous volume", () => {
  const down = context.videoVolumeStep(idle, speaking);
  assert.equal(down.setVolume, 16);
  const steady = context.videoVolumeStep(
    { normal: down.normal, manualOverride: false },
    { ...speaking, volume: 16 },
  );
  assert.equal(steady.setVolume, undefined);
  assert.equal(
    context.videoVolumeStep(steady, { ...speaking, talking: false, volume: 16 })
      .setVolume,
    80,
  );
});
test("native manual volume changes survive further speech events and restoration", () => {
  const state = context.videoVolumeStep(
    { normal: 80, manualOverride: false },
    { ...speaking, volume: 42 },
  );
  assert.equal(state.manualOverride, true);
  assert.equal(
    context.videoVolumeStep(state, { ...speaking, volume: 42 }).setVolume,
    undefined,
  );
  assert.equal(
    context.videoVolumeStep(state, { ...speaking, talking: false, volume: 42 })
      .setVolume,
    undefined,
  );
});
test("muted or paused video is not started or newly ducked by conversation", () => {
  assert.deepEqual(
    plain(context.videoVolumeStep(idle, { ...speaking, muted: true })),
    idle,
  );
  assert.deepEqual(
    plain(context.videoVolumeStep(idle, { ...speaking, playing: false })),
    idle,
  );
});

test("citation preview chooses measured space without obscuring its trigger", () => {
  for (const t of [
    { left: 200, right: 280, top: 50, bottom: 72 },
    { left: 1100, right: 1190, top: 650, bottom: 672 },
    { left: 400, right: 480, top: 330, bottom: 352 },
  ]) {
    const p = context.previewPlacement(t, 332, 240, 1280, 720);
    assert.ok(
      p.left >= 12 && p.left + 332 <= 1268 && p.top >= 12 && p.top + 240 <= 708,
    );
    const overlap =
      p.left < t.right &&
      p.left + 332 > t.left &&
      p.top < t.bottom &&
      p.top + 240 > t.top;
    assert.equal(overlap, false);
  }
});

test("only supplied real timestamp parameters produce a seek destination", () => {
  assert.equal(
    context.videoTimestamp("https://youtube.com/watch?v=abcdefghijk"),
    null,
  );
  assert.equal(
    context.videoTimestamp("https://youtube.com/watch?v=abcdefghijk&t=3m45s"),
    225,
  );
  assert.equal(
    context.videoTimestamp("https://youtu.be/abcdefghijk?t=252"),
    252,
  );
  for (const t of ["-5", "invented", "100000000"])
    assert.equal(
      context.videoTimestamp("https://youtu.be/abcdefghijk?t=" + t),
      null,
    );
});

test("working timer and skeleton reflect real processing, never a quota pause", () => {
  const active = context.researchProgress(
    "collecting_sources",
    2,
    100,
    105000,
    0,
  );
  assert.equal(active.time, "00:07");
  assert.equal(active.skeleton, true);
  assert.equal(active.label, "Working");
  assert.equal(
    context.researchProgress("collecting_sources", 0, 100, 100500, 0).skeleton,
    false,
  );
  assert.equal(
    context.researchProgress("preparing_report", 2, 100, 105000, 8).skeleton,
    true,
  );
  const waiting = context.researchProgress(
    "waiting_for_quota",
    7,
    null,
    9999999,
    8,
  );
  assert.equal(waiting.time, "00:07");
  assert.equal(waiting.active, false);
  assert.equal(waiting.skeleton, false);
  assert.equal(waiting.label, "Report writing paused");
  assert.equal(
    context.researchProgress("queued", 0, null, 9999999, 0).label,
    "Queued",
  );
});

test("quota messages distinguish Google limits from the app allowance", () => {
  assert.match(context.researchWaitMessage("gemini_service_unavailable"), /temporarily unavailable.*saved writing/);
  assert.match(context.researchWaitMessage("gemini_daily_quota"), /Gemini.*daily quota/);
  assert.match(context.researchWaitMessage("background_daily_budget"), /app’s daily research allowance/);
  assert.match(context.researchWaitMessage("gemini_quota_unavailable"), /no quota/);
  assert.match(context.researchWaitMessage("gemini_rate_limit"), /retry from the saved evidence/);
  assert.match(context.researchWaitMessage("background_daily_budget", "openai"), /allowance for OpenAI/);
  assert.match(context.researchWaitMessage("openai_quota_unavailable"), /OpenAI project.*no quota/);
});

test("unpublished research never looks like a finished images-only report", () => {
  const pending = tree.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === "PendingResearch");
  const render = vm.createContext({
    exports: {}, React: { createElement: (type, props, ...children) => ({ type, props, children }) },
    Icon: "icon", useState: value => [value, () => {}], useEffect: () => {},
    researchProgress: context.researchProgress, researchWaitMessage: context.researchWaitMessage,
  });
  vm.runInContext(ts.transpileModule(pending.getText(tree), {compilerOptions: {target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React}}).outputText, render);
  const result = render.PendingResearch({
    report: {display_title: "New UI research", phase: "waiting_for_quota", sources: [{id: "S1"}],
      writing_provider: "openai", waiting_reason: "background_daily_budget", image_items: [{caption: "Pending image", id: "I1"}]},
    onBrowse() {}, onImage() {},
  });
  const text = JSON.stringify(result);
  assert.match(text, /full answer is still queued/);
  assert.match(text, /composed answer hasn’t been published/);
  assert.doesNotMatch(text, /Pending image|EvidenceGallery/);
});

test("media inventory excludes malformed results and deduplicates native player IDs", () => {
  const rows = [
    null,
    { title: "Invalid", url: "https://example.org" },
    { title: "Video", url: "https://youtu.be/abcdefghijk" },
    { title: "Duplicate", url: "https://youtube.com/watch?v=abcdefghijk" },
  ];
  const found = plain(context.mergeMedia(rows));
  assert.equal(found.length, 1);
  assert.equal(found[0].title, "Video");
});

test("stale native players cannot interrupt pausing the other research videos", () => {
  let paused = 0;
  const broken = {
      pauseVideo() {
        throw Error("iframe was removed");
      },
    },
    working = {
      pauseVideo() {
        paused++;
      },
    },
    playing = {
      pauseVideo() {
        throw Error("active player must be excluded");
      },
    };
  context.activePlayers.clear();
  for (const player of [broken, working, playing])
    context.activePlayers.add(player);
  assert.doesNotThrow(() => context.pausePlayers(playing));
  assert.equal(paused, 1);
  assert.equal(context.activePlayers.has(broken), false);
  assert.equal(context.activePlayers.has(playing), true);
  context.activePlayers.clear();
});

test("exported attachment links accept only opaque report and real source identifiers", () => {
  const id = "a".repeat(32);
  assert.deepEqual(
    plain(context.researchDestination("#research=" + id + "&source=S2")),
    { id, source: "S2" },
  );
  for (const hash of [
    "#research=../secret&source=S1",
    "#research=" + id + "&source=javascript:bad",
    "#source=S1",
  ])
    assert.equal(context.researchDestination(hash), null);
});
