import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, F as n, Gt as r, H as i, I as a, J as o, L as s, Mt as c, Nt as l, P as u, Rt as d, S as f, U as p, W as m, X as h, Y as g, b as _, bt as v, ft as y, gt as b, h as x, ht as S, jt as C, lt as w, m as T, mt as E, n as D, pt as O, r as k, tt as A, u as j, ut as M, v as N, vt as P, x as F, y as I, zt as L } from "./index-client-DH73-vTM.js";
import { Bt as R, D as ee, O as z, Q as te, Rt as ne, T as B, g as re, h as ie, i as ae, j as V, k as H, n as oe, o as se, q as U, r as ce, t as W, w as le, zt as ue } from "./SourceStackOverlay-x2Q3dG8D.js";
import { t as de } from "./QuestionCard-BXY1lu0f.js";
import { n as fe, r as G } from "./PageFace-D49tiqHZ.js";
// src/fixtures/AdaptiveGallery.svelte
var K = m("<option> </option>"), q = m("<li class=\"svelte-lpqqem\"> </li>"), pe = m("<aside class=\"adaptive-gallery svelte-lpqqem\" aria-label=\"Adaptive card library\"><h2 class=\"svelte-lpqqem\">Adaptive cards</h2><p class=\"svelte-lpqqem\">20 families · 800 specifications</p> <label class=\"svelte-lpqqem\">Family<select aria-label=\"Family\" class=\"svelte-lpqqem\"></select></label> <label class=\"svelte-lpqqem\">Presentation<select aria-label=\"Presentation\" class=\"svelte-lpqqem\"></select></label> <label class=\"svelte-lpqqem\">Data size<select aria-label=\"Data size\" class=\"svelte-lpqqem\"></select></label> <p class=\"svelte-lpqqem\"> </p><details><summary class=\"svelte-lpqqem\">15 uses across workflows</summary><ol></ol></details> <p class=\"notice svelte-lpqqem\">Fixture data only. No research is started and no external action is performed.</p></aside>");
function me(r, a) {
	c(a, !0);
	let o = t(() => V.find((e) => e.id === a.family) || V[0]);
	var s = pe(), l = S(O(s), 3), f = S(O(l));
	u(f, 21, () => V, n, (t, n) => {
		var r = K(), a = O(r, !0);
		L(r);
		var o = {};
		w(() => {
			e(a, A(n).label), o !== (o = A(n).id) && (r.value = (r.__value = A(n).id) ?? "");
		}), i(t, r);
	}), L(f);
	var p;
	I(f), L(l);
	var m = S(l, 2), h = S(O(m));
	u(h, 21, () => A(o).presets, n, (t, n) => {
		var r = K(), a = O(r);
		L(r);
		var o = {};
		w(() => {
			r.disabled = !A(n).available, e(a, `${A(n).label ?? ""}${A(n).available ? "" : " · awaiting design review"}`), o !== (o = A(n).id) && (r.value = (r.__value = A(n).id) ?? "");
		}), i(t, r);
	}), L(h);
	var v;
	I(h), L(m);
	var y = S(m, 2), b = S(O(y));
	u(b, 20, () => [
		1,
		3,
		8,
		24,
		50,
		100
	], n, (t, n) => {
		var r = K(), a = O(r);
		L(r);
		var o = {};
		w(() => {
			e(a, `${n ?? ""} items`), o !== (o = n) && (r.value = (r.__value = n) ?? "");
		}), i(t, r);
	}), L(b);
	var x;
	I(b), L(y);
	var T = S(y, 2), E = O(T, !0);
	L(T);
	var D = S(T), k = S(O(D));
	u(k, 21, () => A(o).uses, n, (t, n) => {
		var r = q(), a = O(r, !0);
		L(r), w(() => e(a, A(n))), i(t, r);
	}), L(k), L(D), d(2), L(s), w(() => {
		p !== (p = a.family) && (f.value = (f.__value = a.family) ?? "", _(f, a.family)), v !== (v = a.preset || A(o).presets[0].id) && (h.value = (h.__value = a.preset || A(o).presets[0].id) ?? "", _(h, a.preset || A(o).presets[0].id)), x !== (x = a.count) && (b.value = (b.__value = a.count) ?? "", _(b, a.count)), e(E, A(o).purpose);
	}), g("change", f, (e) => a.onchange(e.currentTarget.value, "", a.count)), g("change", h, (e) => a.onchange(a.family, e.currentTarget.value, a.count)), g("change", b, (e) => a.onchange(a.family, a.preset, Number(e.currentTarget.value))), i(r, s), C();
}
o(["change"]);
// src/fixtures/presentations.ts
var J = {
	revision: 1,
	status: "simulation",
	sources: [{
		id: "reference",
		title: "Supplied screenshot · illustrative data, not current research"
	}]
}, he = [
	[
		"AWS",
		"Core IaaS",
		"aws.amazon.com"
	],
	[
		"Microsoft Azure",
		"Core IaaS",
		"azure.microsoft.com"
	],
	[
		"Google Cloud",
		"Core IaaS",
		"cloud.google.com"
	],
	[
		"Alibaba Cloud",
		"Core IaaS",
		"alibabacloud.com"
	],
	[
		"Oracle Cloud",
		"Core IaaS",
		"oracle.com"
	],
	[
		"Huawei Cloud",
		"Core IaaS",
		"huaweicloud.com"
	],
	[
		"IBM",
		"Managed PaaS",
		"ibm.com"
	],
	[
		"Red Hat OpenShift",
		"Hybrid multicloud",
		"redhat.com"
	],
	[
		"Cloudflare",
		"Hybrid multicloud",
		"cloudflare.com"
	],
	[
		"Snowflake",
		"Data & AI",
		"snowflake.com"
	],
	[
		"Databricks",
		"Data & AI",
		"databricks.com"
	],
	[
		"Google Workspace",
		"Business SaaS",
		"workspace.google.com"
	],
	[
		"Microsoft 365",
		"Business SaaS",
		"microsoft.com"
	],
	[
		"Salesforce",
		"Business SaaS",
		"salesforce.com"
	],
	[
		"SAP",
		"Business SaaS",
		"sap.com"
	],
	[
		"ServiceNow",
		"Business SaaS",
		"servicenow.com"
	]
], ge = [
	[
		"2025-05-27",
		"Set the launch promise and landing page",
		"Landing page",
		"Define one proof-backed reason Gen Z should try gork, add a waitlist or download CTA, and instrument sign-ups, installs, activation, and referrals. This gates all creative.",
		"milestone",
		""
	],
	[
		"2025-05-29",
		"Recruit TikTok creators",
		"TikTok",
		"Shortlist 10–20 micro-creators whose audience matches the first user community; agree on disclosure, usage rights, and a launch-day post concept.",
		"task",
		"$2k–$6k"
	],
	[
		"2025-06-03",
		"Produce TikTok launch creative",
		"TikTok",
		"Make 6–10 vertical videos: hook in the first two seconds, show the social moment, and include a clear join/download CTA.",
		"task",
		""
	],
	[
		"2025-06-05",
		"Open the early-access waitlist",
		"Landing page",
		"Publish the landing page, seed it through founder and creator accounts, and give each sign-up a shareable invite or referral link.",
		"task",
		""
	],
	[
		"2025-06-10",
		"Recruit a campus ambassador cohort",
		"Campus",
		"Select 5–10 student organizers from the first target campuses; give them a launch kit, unique links, and a small starter event or referral incentive.",
		"task",
		"$1k–$3k"
	],
	[
		"2025-06-12",
		"Build the Instagram launch sequence",
		"Instagram",
		"Prepare the launch story, community prompts, and a clear path to the waitlist.",
		"task",
		""
	],
	[
		"2025-06-17",
		"Start the seven-day countdown",
		"TikTok",
		"Post daily creator clips and behind-the-scenes social proof; retarget site visitors only after the creative and landing-page conversion are working.",
		"task",
		"$1k–$2k"
	],
	[
		"2025-06-20",
		"Run the launch readiness check",
		"Operations",
		"Test download links, analytics, referral attribution, sign-up flows, support coverage, and the first-run experience. Freeze the launch assets.",
		"milestone",
		""
	],
	[
		"2025-06-24",
		"Launch gork across TikTok, Instagram, and campus",
		"TikTok + Instagram",
		"Publish the coordinated launch message, have creators and ambassadors post in their local peak windows, and respond to comments and support issues in real time.",
		"milestone",
		""
	],
	[
		"2025-06-25",
		"Amplify the highest-retention creative",
		"TikTok Ads",
		"Compare installs, activation, and referral rate by creator and video; put remaining paid spend behind the best-performing audience and creative only.",
		"task",
		"Remainder of budget"
	],
	[
		"2025-07-01",
		"Publish the first-week social proof",
		"TikTok + Instagram",
		"Share a real early-user moment or community milestone, thank the launch cohort, and invite friends while reviewing retention by acquisition source.",
		"task",
		""
	]
];
function Y() {
	let e = typeof location > "u" ? "http://127.0.0.1:5194" : location.origin;
	return {
		anchor: {
			...J,
			id: "visual-anchor",
			kind: "comparison",
			title: "Visual anchor",
			recommendationKind: "article",
			recommendations: [{
				id: "editorial",
				title: "Book interior layout",
				subtitle: "NIVORA™",
				image: e + "/fixtures/v25/visual-reference.png",
				imageRegion: {
					x: 91 / 408,
					y: 155 / 555,
					width: 197 / 408,
					height: 148 / 555
				},
				recommended: !0,
				facts: [
					{
						label: "Contribution",
						value: "Indigo editorial system"
					},
					{
						label: "Style",
						value: "Oversized typography"
					},
					{
						label: "Maker",
						value: "NIVORA™"
					}
				],
				why: "Anchor the direction here: a cinematic editorial composition with high-contrast hierarchy and an AI-forward atmosphere."
			}]
		},
		market: {
			...J,
			id: "market-map",
			kind: "diagram",
			title: "Google Cloud market map",
			diagramDirection: "right",
			nodes: he.map(([e, t, n], r) => ({
				id: "company-" + r,
				label: e,
				group: t,
				vendor: n,
				nodeKind: "service",
				detail: t === "Core IaaS" ? "Cloud infrastructure" : t === "Business SaaS" ? "Business application suite" : t === "Data & AI" ? "Data and AI platform" : t === "Managed PaaS" ? "Enterprise platform" : "Hybrid cloud platform"
			})),
			edges: []
		},
		table: {
			...J,
			id: "market-table",
			kind: "table",
			title: "Google Cloud players",
			columns: [
				"Company",
				"Segment",
				"Link"
			],
			columnKinds: [
				"entity",
				"tag",
				"link"
			],
			rows: he.map(([e, t, n]) => [
				e,
				t,
				"https://" + n
			]),
			caption: "Reference classification from the supplied screenshot. Funding and founding data are intentionally unknown; no live market research was performed."
		},
		campaign: {
			...J,
			id: "campaign",
			kind: "timeline",
			title: "gork launch campaign",
			planMode: "schedule",
			planTotal: {
				label: "Budget envelope",
				value: "$2,000–10,000"
			},
			entries: ge.map(([e, t, n, r, i, a], o) => ({
				id: "campaign-" + o,
				date: e,
				label: t,
				place: n,
				detail: r,
				stepKind: i,
				cost: a
			}))
		},
		activity: {
			...J,
			id: "request-activity",
			kind: "note",
			title: "Plan a launch campaign for gork",
			requestActivity: {
				state: "Recorded example",
				steps: [
					{
						id: "search",
						kind: "search",
						title: "Searched the web 4 times",
						detail: "Recorded reference: Product Hunt launch guidelines, self-promotion rules and audience"
					},
					...[
						["What is gork, who is it for, and what launch date and budget should the campaign use?", "$2,000–10,000"],
						["Please give a one-line description, target audience and launch date.", "I’ll describe gork"],
						["What does gork do, who specifically is it for, and what date should it launch?", "Consumer app — Gen Z — choose date"],
						["What is gork’s core job for Gen Z users?", "Social app"],
						["Choose the Tuesday launch date for gork’s social-app campaign.", "2025-06-24"]
					].map(([e, t], n) => ({
						id: "question-" + n,
						kind: "ask",
						title: e,
						detail: "You answered: " + t
					})),
					{
						id: "record",
						kind: "page",
						title: "Campaign plan recorded",
						detail: "Illustrative history only; this simulation has not performed a search or executed a task."
					}
				],
				made: [{
					id: "campaign",
					title: "gork launch campaign",
					kind: "plan"
				}]
			}
		},
		editorial: {
			...J,
			id: "editorial-answer",
			kind: "answer",
			title: "Indigo futures, oversized type, editorial AI",
			body: "The accessible anchor is a cinematic publication layout: use its dense indigo field, giant type and controlled neon energy as the visual starting point.\n\n• Palette: deep indigo with a restrained neon accent\n• Type: oversized, assertive editorial sans\n• Texture: cinematic imagery over a clear paper-like structure\n• Composition: magazine spreads, strong hierarchy, wide negative space\n• Avoid: generic dashboards and rainbow gradients"
		},
		marketAnswer: {
			...J,
			id: "market-answer",
			kind: "answer",
			title: "Five layers: hyperscalers dominate core cloud",
			body: "A market landscape can group companies by the role they play, without implying a dependency between them.\n\nThese values are reproduced from the supplied design reference, not verified current market shares. Unknown funding and founding fields stay empty.",
			entries: [
				{
					id: "aws",
					label: "AWS IaaS share",
					value: 37.7,
					unit: "%"
				},
				{
					id: "azure",
					label: "Azure IaaS share",
					value: 23.9,
					unit: "%"
				},
				{
					id: "google",
					label: "Google IaaS share",
					value: 9,
					unit: "%"
				}
			]
		}
	};
}
function X(e, t) {
	let n = z(e), r = 40;
	return {
		objects: e,
		items: n,
		links: [],
		plan: { geometry: {
			positions: Object.fromEntries(n.map((e, n) => {
				let i = t?.[n] || {
					x: 40,
					y: r
				};
				return r += e.size.height + 100, [e.id, i];
			})),
			sizes: Object.fromEntries(n.map((e) => [e.id, e.size])),
			constraints: {}
		} }
	};
}
function _e(e = "market") {
	let t = Y();
	return e === "editorial" ? X([t.editorial, t.anchor], [{
		x: 40,
		y: 40
	}, {
		x: 40,
		y: 450
	}]) : e === "campaign" ? X([t.campaign, t.activity], [{
		x: 40,
		y: 40
	}, {
		x: 1250,
		y: 40
	}]) : e === "activity" ? X([t.activity, t.campaign], [{
		x: 40,
		y: 40
	}, {
		x: 800,
		y: 40
	}]) : X([
		t.marketAnswer,
		t.table,
		t.market
	], [
		{
			x: 40,
			y: 40
		},
		{
			x: 40,
			y: 430
		},
		{
			x: 850,
			y: 40
		}
	]);
}
// src/fixtures/adaptive.ts
function ve(e = "answer", t = "", n = 8) {
	let r = V.find((t) => t.id === e) || V[0], i = r.presets.find((e) => e.id === t && e.available) || r.presets[0], a = Array.from({ length: n }, (e, t) => ({
		id: "item-" + t,
		label: [
			"Collect evidence",
			"Compare alternatives",
			"Review findings",
			"Record the decision"
		][t % 4] + " " + (t + 1),
		detail: "Supplied fixture observation. This is a proposed step, not an executed action.",
		value: t % 5 == 0 ? void 0 : (t + 1) * 7,
		unit: "ms",
		date: "2026-11-" + String(1 + t % 28).padStart(2, "0"),
		stepKind: t % 3 ? "task" : "milestone",
		done: !1
	})), o = Array.from({ length: Math.min(n, 3) }, (e, t) => ({
		id: "media-" + t,
		kind: r.kind === "video" ? "video" : r.kind === "image" ? "image" : "source",
		url: r.kind === "video" ? "https://www.youtube.com/watch?v=QbSarcWspvw" : "https://example.com/reference/" + t,
		title: "Supplied reference " + (t + 1),
		caption: "Fixture reference; no research or account action.",
		thumbnail: r.kind === "image" ? location.origin + "/fixtures/v25/visual-reference.png" : void 0
	})), s = {
		contract_version: 26,
		id: "adaptive-example",
		family: r.id,
		preset: i.id,
		kind: r.kind,
		title: r.label + " · fixture",
		revision: 1,
		status: r.id === "test" ? "needs-review" : "partial",
		body: "## What the supplied evidence shows\n\nThe same card can explain a project, summarize research or support a decision. Its contents come from the supplied data.\n\n## What remains uncertain\n\nMissing evidence stays explicit. The current values are deterministic fixture measurements, not live research.",
		caption: "Isolated fixture · no AI or search calls",
		sources: [{
			id: "S1",
			title: "Supplied fixture record",
			url: "https://example.com/evidence"
		}],
		blocks: [{
			id: "metric-a",
			kind: "figure",
			label: "Recorded items",
			value: String(n)
		}, {
			id: "metric-b",
			kind: "figure",
			label: "Data origin",
			value: "Fixture"
		}],
		provenance: [{
			path: "/body",
			basis: "supplied",
			source_ids: ["S1"]
		}],
		media: r.id === "answer" ? o.slice(0, 1) : []
	};
	return [
		"timeline",
		"calendar",
		"checklist",
		"decision",
		"chart"
	].includes(r.id) && (s.entries = a), r.id === "calendar" && (s.planMode = "schedule"), r.id === "chart" && (s.chartKind = "bars", s.orientation = "horizontal", s.media = []), ["table", "comparison"].includes(r.id) && (s.columns = [
		"Item",
		"Category",
		"Observed value"
	], s.columnKinds = [
		"text",
		"tag",
		"number"
	], s.rows = a.map((e, t) => [
		e.label,
		"Group " + (t % 3 + 1),
		e.value ?? null
	]), s.row_ids = a.map((e) => e.id)), ["diagram", "category-map"].includes(r.id) && (s.nodes = a.map((e, t) => ({
		id: e.id,
		label: "Module " + (t + 1),
		detail: e.detail,
		group: "Layer " + (t % 3 + 1),
		nodeKind: "component"
	})), s.edges = r.id === "category-map" ? [] : a.slice(1).map((e, t) => ({
		id: "edge-" + t,
		source: a[t].id,
		target: e.id,
		label: "supplied dependency"
	})), s.media = [], s.blocks = []), r.id === "recommendation" && (s.recommendations = a.map((e, t) => ({
		id: e.id,
		title: "Reference " + (t + 1),
		subtitle: "A supplied resource",
		url: "https://example.com/resource/" + t,
		recommended: t === 0,
		why: "Review this reference in the context of your task.",
		facts: [{
			label: "Basis",
			value: "Supplied fixture"
		}, {
			label: "Purpose",
			value: "Cross-workflow example"
		}]
	}))), [
		"source",
		"image",
		"video"
	].includes(r.id) && (s.media = o, s.url = o[0]?.url, s.blocks = []), r.id === "code" && (s.language = "python", s.body = "def summarize(records):\n    valid = [r for r in records if r.get(\"source_id\")]\n    return {\"count\": len(valid), \"records\": valid}\n"), r.id === "diff" && (s.language = "python", s.body = "--- a/summary.py\n+++ b/summary.py\n@@ -1,2 +1,2 @@\n def summarize(records):\n-    return len(records)\n+    return sum(bool(r.get(\"source_id\")) for r in records)"), r.id === "test" && (s.body = "NOT EXECUTED — proposed validation\n\n1. Supply a record without a source.\n2. Verify it is marked unknown.\n3. Verify known records retain their evidence.", s.language = "text"), r.id === "draft" && (s.body = "Proposed message\n\nHere is the evidence collected so far. Two questions remain open. Please review the attached comparison before we decide."), H(s);
}
function ye(e, t, n) {
	return X([ve(e, t, n)]);
}
// src/fixtures/workspaces.ts
var be = {
	"focused-answer": ["source", "answer"],
	"parallel-investigation": [
		"task",
		"task",
		"task",
		"report"
	],
	"branching-research": [
		"task",
		"source",
		"source",
		"note"
	],
	"evidence-convergence": [
		"source",
		"source",
		"note",
		"report"
	],
	"architecture-atlas": [
		"code",
		"diagram",
		"document"
	],
	"dependency-explorer": [
		"code",
		"diagram",
		"note"
	],
	"source-collections": [
		"source",
		"source",
		"source"
	],
	"comparison-desk": [
		"comparison",
		"chart",
		"answer"
	],
	"timeline-milestones": [
		"timeline",
		"checklist",
		"note"
	],
	"execution-board": [
		"task",
		"task",
		"checklist"
	],
	"daily-schedule": [
		"calendar",
		"checklist",
		"note"
	],
	"research-publication": [
		"source",
		"note",
		"report",
		"table"
	],
	"visual-moodboard": [
		"image",
		"image",
		"note"
	],
	"ui-teardown": [
		"image",
		"note",
		"checklist"
	],
	"debugging-workbench": [
		"code",
		"diff",
		"test",
		"answer"
	],
	"decision-workspace": [
		"decision",
		"comparison",
		"answer"
	],
	"knowledge-constellation": [
		"note",
		"diagram",
		"source"
	],
	"document-production": [
		"document",
		"note",
		"report"
	],
	"market-landscape": [
		"comparison",
		"chart",
		"source"
	],
	"mixed-result": [
		"answer",
		"diagram",
		"table",
		"image"
	],
	"claim-review": [
		"note",
		"source",
		"comparison"
	],
	"code-walkthrough": [
		"code",
		"answer",
		"diagram"
	],
	"change-review": [
		"diff",
		"note",
		"test"
	],
	"priority-inbox": [
		"note",
		"draft",
		"checklist"
	],
	"trip-budget": [
		"image",
		"comparison",
		"timeline",
		"chart"
	]
}, xe = "The workspace follows the evidence available to this task. Each result keeps its original context and can be inspected without leaving the canvas.\n\nThis is a local simulation. No provider, account or external action was used.", Z = {
	answer: "A clearer path from evidence to a useful result",
	report: "Research findings and next steps",
	code: "Request routing · source reference",
	diff: "Proposed change · review before applying",
	test: "Validation output · simulated",
	comparison: "Compare the options that matter",
	diagram: "System architecture",
	calendar: "A focused working day",
	timeline: "From preparation to delivery",
	image: "Visual reference",
	draft: "Reply for your review",
	checklist: "Before the next step",
	chart: "Recorded comparison",
	source: "Source preview · fixture",
	note: "Evidence and observations"
};
function Se(e, t = 8, n = "complete") {
	let r = B.find((t) => t[0] === e)[1], i = be[e], a = Array.from({ length: Math.max(2, Math.min(100, t)) }, (e, t) => {
		let a = i[t % i.length];
		return {
			id: "fixture-" + t,
			kind: a,
			title: Z[a] || r,
			revision: 1,
			status: n === "failure" && t === 1 ? "failed" : "simulation",
			task_id: "task-" + t,
			body: a === "code" ? "export async function loadContext(runId: string) {\n  const cached = cache.get(runId);\n  if (cached) return cached;\n  return await repository.read(runId);\n}" : a === "diff" ? "@@ context loader @@\n- await fetchEveryPage();\n+ renderFirstPage();\n+ await loadRemainingPages();" : a === "test" ? "LOCAL FIXTURE — not an executed test\n✓ Cached context\n✓ Stable source identities\n○ External provider check unavailable" : xe,
			...a === "image" ? {
				url: (typeof location < "u" ? location.origin : "http://127.0.0.1:5187") + "/fixtures/v20/reference.png",
				caption: "Supplied design reference · local fixture, not a generated webpage capture"
			} : {},
			...a === "source" ? { caption: "Cached source metadata. No live browser is opened." } : {},
			columns: [
				"Option",
				"Configured in",
				"Runs as",
				"Checks from",
				"Alerts"
			],
			columnKinds: [
				"entity",
				"text",
				"text",
				"text",
				"yes_no"
			],
			rows: [
				[
					"Uptime Kuma",
					"Its web UI",
					"One container",
					"Your server",
					"yes"
				],
				[
					"Gatus",
					"One YAML file",
					"One container",
					"Your server",
					"yes"
				],
				[
					"OpenStatus",
					"Its dashboard",
					"Several services",
					"Hosted regions",
					"yes"
				]
			],
			orientation: t % 2 ? "vertical" : "horizontal",
			chartKind: "bars",
			entries: [
				{
					id: "a",
					label: "Prepare the context",
					detail: "Review the source material",
					start: 29913600 + t * 120,
					done: !0,
					value: 32,
					unit: "units"
				},
				{
					id: "b",
					label: "Compare and verify",
					detail: "Keep assumptions explicit",
					start: 29913720 + t * 120,
					value: 58,
					unit: "units"
				},
				{
					id: "c",
					label: "Review the result",
					detail: "No external action is taken",
					start: 29913840 + t * 120,
					value: 44,
					unit: "units"
				}
			],
			nodes: [
				{
					id: "input",
					label: "Task instruction",
					detail: "The supplied request",
					group: "Task and environment",
					nodeKind: "input"
				},
				{
					id: "plan",
					label: "Plan and context",
					detail: "Registered capabilities",
					group: "Intelligence",
					nodeKind: "model"
				},
				{
					id: "result",
					label: "Recorded result",
					detail: "Validated data",
					group: "Execution",
					nodeKind: "output"
				}
			],
			edges: [{
				id: "p",
				source: "input",
				target: "plan",
				label: "Context"
			}, {
				id: "r",
				source: "plan",
				target: "result",
				label: "Result"
			}],
			sources: [{
				id: "fixture-source",
				title: "Local fixture · synthetic content"
			}]
		};
	}), o = z(a), s = o.slice(1).map((t, n) => ({
		id: "fixture-edge-" + n,
		source: o[e === "parallel-investigation" ? 0 : n].id,
		target: t.id
	})), c = {
		strategy: e,
		workflow: B.find((t) => t[0] === e)[3].split(",")[0],
		width: 1440,
		height: 900,
		viewport: {
			x: 0,
			y: 0,
			zoom: 1
		},
		edges: s,
		nodes: o.map((t, n) => ({
			id: t.id,
			title: t.title,
			type: "adaptive",
			objectKind: t.aegisObject.kind,
			group: e === "claim-review" ? [
				"Supporting",
				"Conflicting",
				"Unresolved"
			][n % 3] : "Group " + n % 3,
			role: "Lane " + n % 3,
			status: n % 3 == 0 ? "running" : n % 3 == 1 ? "done" : "queued",
			start: ["calendar", "timeline"].includes(t.aegisObject.kind) ? t.aegisObject.entries?.[0]?.start : void 0,
			x: 0,
			y: 0,
			...t.size
		}))
	}, l = le(c);
	return {
		label: r,
		objects: a,
		items: o,
		links: s.map((e) => ({
			...e,
			kind: "flow",
			strand: {
				label: "Recorded fixture relationship",
				status: "complete",
				relations: [{
					id: e.id,
					type: "delivers",
					source: e.source,
					target: e.target,
					status: "complete",
					detail: { fixture: !0 }
				}]
			}
		})),
		input: c,
		plan: l
	};
}
// src/fixtures/references.ts
function Ce(e = 3) {
	let t = {
		revision: 1,
		status: "simulation",
		sources: [{
			id: "reference",
			title: "Supplied reference · illustrative values, no live measurement"
		}]
	}, n = [
		{
			...t,
			id: "metrics",
			kind: "chart",
			title: "What each takes to run",
			caption: "Reference values supplied in the screenshot · not a live infrastructure measurement.",
			metricPanels: [
				{
					id: "size",
					title: "Image to pull",
					subtitle: "Compressed, amd64",
					values: [
						{
							id: "kuma",
							label: "Uptime Kuma",
							value: 617,
							display: "617 MB"
						},
						{
							id: "gatus",
							label: "Gatus",
							value: 26,
							display: "26 MB",
							highlight: !0
						},
						{
							id: "status",
							label: "OpenStatus",
							display: "Built from source"
						}
					]
				},
				{
					id: "containers",
					title: "Containers",
					subtitle: "To self-host",
					values: [
						{
							id: "kuma",
							label: "Uptime Kuma",
							value: 1,
							display: "1"
						},
						{
							id: "gatus",
							label: "Gatus",
							value: 1,
							display: "1",
							highlight: !0
						},
						{
							id: "status",
							label: "OpenStatus",
							value: 8,
							display: "8"
						}
					]
				},
				{
					id: "years",
					title: "In the open",
					subtitle: "Since the repo began",
					values: [
						{
							id: "kuma",
							label: "Uptime Kuma",
							value: 5.3,
							display: "5.3 yrs"
						},
						{
							id: "gatus",
							label: "Gatus",
							value: 7.1,
							display: "7.1 yrs",
							highlight: !0
						},
						{
							id: "status",
							label: "OpenStatus",
							value: 3.3,
							display: "3.3 yrs"
						}
					]
				}
			]
		},
		{
			...t,
			id: "fits",
			kind: "diagram",
			title: "How it fits",
			diagramDirection: "down",
			nodes: [
				{
					id: "website",
					label: "zephium.app",
					detail: "Website and docs",
					group: "Watched",
					nodeKind: "service"
				},
				{
					id: "api",
					label: "api.zephium.app",
					detail: "Account API",
					group: "Watched",
					nodeKind: "service"
				},
				{
					id: "releases",
					label: "GitHub Releases",
					detail: "Update manifest",
					group: "Watched",
					nodeKind: "service",
					vendor: "github.com"
				},
				{
					id: "monitor",
					label: "Gatus",
					detail: "Every 30 seconds",
					group: "Monitor",
					nodeKind: "service"
				},
				{
					id: "status",
					label: "status.zephium.app",
					detail: "Public status page",
					group: "Reports",
					nodeKind: "service"
				},
				{
					id: "slack",
					label: "Slack",
					detail: "#all-zephium-dev",
					group: "Reports",
					nodeKind: "service",
					vendor: "slack.com"
				}
			],
			edges: [
				{
					id: "w",
					source: "website",
					target: "monitor",
					label: "GET /"
				},
				{
					id: "a",
					source: "api",
					target: "monitor",
					label: "/v1"
				},
				{
					id: "r",
					source: "releases",
					target: "monitor",
					label: "latest.json"
				},
				{
					id: "s",
					source: "monitor",
					target: "status",
					label: "Serves"
				},
				{
					id: "n",
					source: "monitor",
					target: "slack",
					label: "Alerts"
				}
			]
		},
		{
			...t,
			id: "architecture",
			kind: "diagram",
			title: "Gemini Robotics: public architecture",
			nodes: [
				{
					id: "task",
					label: "Task instruction",
					detail: "Language goal; conceptual input",
					group: "Task and environment",
					nodeKind: "input"
				},
				{
					id: "vision",
					label: "Visual observations",
					group: "Task and environment",
					nodeKind: "input"
				},
				{
					id: "local",
					label: "Robotics On-Device 2",
					detail: "Local VLA variant; not an extra serial stage",
					group: "Gemini Robotics intelligence",
					nodeKind: "model"
				},
				{
					id: "er",
					label: "Gemini Robotics ER 2",
					detail: "World understanding and multi-step planning",
					group: "Gemini Robotics intelligence",
					nodeKind: "model"
				},
				{
					id: "vla",
					label: "Gemini Robotics 2.5",
					detail: "Vision-language-action robot control",
					group: "Gemini Robotics intelligence",
					nodeKind: "model"
				},
				{
					id: "hardware",
					label: "Robot hardware",
					group: "Physical execution",
					nodeKind: "component"
				},
				{
					id: "environment",
					label: "Physical environment",
					group: "Physical execution",
					nodeKind: "component"
				}
			],
			edges: [
				{
					id: "t",
					source: "task",
					target: "er",
					label: "Goal"
				},
				{
					id: "v",
					source: "vision",
					target: "er",
					label: "Scene context"
				},
				{
					id: "p",
					source: "er",
					target: "vla",
					label: "Plan → action"
				},
				{
					id: "e",
					source: "vision",
					target: "vla",
					label: "Visual feedback"
				},
				{
					id: "l",
					source: "local",
					target: "hardware",
					label: "Local VLA alternative"
				},
				{
					id: "h",
					source: "vla",
					target: "hardware",
					label: "Robot actions"
				},
				{
					id: "o",
					source: "hardware",
					target: "environment"
				}
			]
		}
	], r = z(n), i = Array.from({ length: Math.max(1, Math.min(10, e)) }, (e, t) => ({
		id: "video-" + t,
		videoId: "QbSarcWspvw".padEnd(11, "0"),
		url: "https://www.youtube.com/watch?v=" + [
			"QbSarcWspvw",
			"dQw4w9WgXcQ",
			"aqz-KE-bpKQ"
		][t % 3],
		title: "Local video fixture " + (t + 1),
		channel: "Playback test · source identity " + (t + 1),
		provider: "fixture",
		thumbnail: location.origin + "/fixtures/v20/reference.png"
	}));
	return r.push({
		id: "collection:videos",
		type: "collection",
		kind: "video",
		status: "complete",
		detail: "Local fixture videos",
		title: "Videos",
		orders: !0,
		designer: !0,
		size: {
			width: 404,
			height: 312
		},
		collection: {
			kind: "videos",
			researchId: "fixture",
			title: "Videos",
			state: "ready",
			note: "",
			images: [],
			videos: i
		}
	}), {
		label: "Reference presentations",
		objects: n,
		items: r,
		links: [],
		plan: { geometry: {
			positions: {
				"object:metrics": {
					x: 40,
					y: 40
				},
				"object:fits": {
					x: 900,
					y: 40
				},
				"object:architecture": {
					x: 40,
					y: 650
				},
				"collection:videos": {
					x: 1300,
					y: 660
				}
			},
			sizes: Object.fromEntries(r.map((e) => [e.id, e.size])),
			constraints: {},
			viewport: {
				x: 0,
				y: 0,
				zoom: 1
			}
		} }
	};
}
// src/fixtures/learning.ts
var we = [
	["Map the problem", "Watch the RAG overview; write a one-page definition of working memory, episodic memory, semantic memory, and external retrieval."],
	["Embeddings", "Read the NLP foundations: tokenization, language modeling, embeddings, and similarity. Implement cosine similarity over a small document set."],
	["Transformers and limits", "Study transformer attention and context windows. Explain why in-context history alone is not durable memory."],
	["First retrieval system", "Build a minimal chunk → embed → retrieve pipeline over 20–50 notes. Inspect the top-k results manually."],
	["Chunking and indexing", "Add chunking experiments: fixed size, overlap, and semantic boundaries. Create a small query set and compare retrieval failures."],
	["RAG baseline", "Add the generation step: retrieve evidence, construct a grounded prompt, and require citations to retrieved chunks."],
	["Memory architecture", "Separate short-term conversation state from long-term memory. Define schemas for user profile, facts, events, and preferences."],
	["Memory writes", "Implement write policies: what to store, summarize, merge, expire, and never store. Add explicit user-controlled deletion."],
	["Memory reads", "Implement read policies: query rewriting, metadata filters, recency, reranking, and token-budget allocation."],
	["Evaluation", "Create an evaluation set with answer quality, retrieval recall, groundedness, latency, and cost. Run an error taxonomy."],
	["Safety and operations", "Harden the system: prompt-injection-resistant document handling, tenant isolation, PII minimization, and audit logs."],
	["Capstone", "Ship a capstone: a memory-enabled assistant with ingestion, retrieval, memory writes, evaluations, and a design document describing trade-offs."]
];
function Te() {
	let e = {
		revision: 1,
		status: "simulation",
		sources: [{
			id: "supplied",
			title: "User-supplied design reference · local fixture"
		}]
	}, t = [
		{
			...e,
			id: "reading",
			kind: "comparison",
			title: "Core readings",
			recommendationKind: "article",
			recommendations: [{
				id: "book",
				title: "Speech and Language Processing (3rd-ed. draft)",
				subtitle: "Open online NLP textbook",
				recommended: !0,
				facts: [
					{
						label: "Level",
						value: "Beginner to intermediate"
					},
					{
						label: "Format",
						value: "Free online textbook"
					},
					{
						label: "Focus",
						value: "NLP, neural networks, transformers"
					}
				],
				why: "Use it to build the NLP and transformer vocabulary needed before designing retrieval and memory layers."
			}]
		},
		{
			...e,
			id: "watch",
			kind: "comparison",
			title: "Watch first",
			recommendationKind: "video",
			recommendations: [{
				id: "zephium-video",
				title: "Zephium Work — workspace demonstration",
				subtitle: "Supplied YouTube video · local fixture",
				url: "https://www.youtube.com/watch?v=QbSarcWspvw",
				image: location.origin + "/fixtures/v20/reference.png",
				recommended: !0,
				facts: [
					{
						label: "Length",
						value: "See original video"
					},
					{
						label: "Level",
						value: "Introduction"
					},
					{
						label: "Format",
						value: "Product demonstration"
					}
				],
				why: "Open this video in the AEGIS miniature browser. The poster is a local design reference, not a captured video frame."
			}]
		},
		{
			...e,
			id: "learning-plan",
			kind: "timeline",
			title: "12-week memory LLM path",
			planTotal: {
				label: "Pace",
				value: "12 weeks · ~72 hours"
			},
			entries: we.map(([e, t], n) => ({
				id: "week-" + (n + 1),
				label: "Week " + (n + 1) + " · " + e,
				detail: t,
				when: "6 hours"
			}))
		}
	], n = z(t);
	return n.push({
		id: "learning-prompt",
		type: "request",
		kind: "request",
		title: "Build a learning path for memory in LLM applications",
		detail: "",
		status: "complete",
		when: "Local fixture",
		orders: !0,
		designer: !0,
		size: {
			width: 480,
			height: 160
		}
	}), {
		label: "Learning resources",
		objects: t,
		items: n,
		links: [],
		plan: { geometry: {
			positions: {
				"learning-prompt": {
					x: 20,
					y: 20
				},
				"object:reading": {
					x: 20,
					y: 240
				},
				"object:watch": {
					x: 400,
					y: 240
				},
				"object:learning-plan": {
					x: 820,
					y: 240
				}
			},
			sizes: Object.fromEntries(n.map((e) => [e.id, e.size])),
			constraints: {},
			viewport: {
				x: 0,
				y: 0,
				zoom: 1
			}
		} }
	};
}
var Ee = [{
	id: "scope",
	question: "To find investors, what is your company’s AI focus, stage, target round size, and base city/country?",
	options: [
		"Pre-seed — $500k — US",
		"Seed — $2m — US",
		"Series A — $8m — US",
		"I’ll provide details"
	]
}, {
	id: "focus",
	question: "Which focus should I target for this US pre-seed $500k raise?",
	options: [
		"OpenAI applications",
		"NVIDIA / AI infrastructure",
		"Both / developer tools",
		"Other AI focus"
	]
}], De = [
	"answer",
	"report",
	"document",
	"note",
	"draft",
	"code",
	"diff",
	"test",
	"image",
	"table",
	"comparison",
	"chart",
	"timeline",
	"calendar",
	"checklist",
	"decision",
	"diagram",
	"task",
	"source"
], Oe = [
	"Supported answer",
	"Research report",
	"Document",
	"Evidence note",
	"Message draft",
	"Code panel",
	"Change diff",
	"Test and log output",
	"Image",
	"Data table",
	"Option comparison",
	"Bar chart",
	"Milestone timeline",
	"Monthly calendar",
	"Checklist",
	"Decision list",
	"Architecture diagram",
	"Task summary",
	"Source preview"
], ke = [
	...B.map(([e, t, n]) => ({
		id: "layout:" + e,
		label: t,
		description: n,
		group: "Workspace layouts"
	})),
	...De.map((e, t) => ({
		id: "card:" + e,
		label: Oe[t],
		description: "Individual " + Oe[t].toLowerCase() + " presentation",
		group: "Core cards"
	})),
	...[
		[
			"anchor",
			"Visual anchor",
			"Image recommendation with Top pick and aligned facts"
		],
		[
			"market",
			"Market map",
			"Categorized companies with no connecting lines"
		],
		[
			"table",
			"Company directory",
			"Eight-row preview with the full table on Open"
		],
		[
			"campaign",
			"Calendar and detailed plan",
			"Dated milestones, costs and budget envelope"
		],
		[
			"activity",
			"Request activity",
			"Recorded actions, answers and expandable steps"
		],
		[
			"reading",
			"Core readings",
			"Text recommendation with level, format and focus"
		],
		[
			"watch",
			"Watch first",
			"Video recommendation opening the miniature browser"
		],
		[
			"learning",
			"Learning path",
			"Twelve full milestones with pace and Tasks action"
		],
		[
			"metrics",
			"Resource comparison",
			"Three panels with values and unknown states"
		],
		[
			"fits",
			"How it fits",
			"Top-to-bottom monitoring diagram"
		],
		[
			"architecture",
			"Interactive architecture",
			"Node details and highlighted relationships"
		],
		[
			"video-stack",
			"Sliding video stack",
			"Individually selectable videos and native browsing"
		],
		[
			"source-stack",
			"Sliding source stack",
			"Cached page previews and individual selection"
		],
		[
			"questions",
			"Clarification conversation",
			"Options, free text and recorded answers"
		],
		[
			"editorial-set",
			"Editorial direction",
			"Transparent answer paired with a visual anchor"
		],
		[
			"market-set",
			"Market overview",
			"Figures, directory and category map"
		],
		[
			"campaign-set",
			"Campaign workspace",
			"Calendar plan with request history"
		],
		[
			"multi-picks",
			"Recommendation collection",
			"Multiple image recommendations in one result"
		],
		[
			"vertical-chart",
			"Vertical bars",
			"Same recorded data with vertical orientation"
		],
		[
			"line-chart",
			"Line chart",
			"Recorded observations shown over an ordered sequence"
		]
	].map(([e, t, n]) => ({
		id: e,
		label: t,
		description: n,
		group: "Reference presentations"
	}))
];
function Ae(e) {
	if (e.startsWith("layout:")) {
		let t = B.find((t) => "layout:" + t[0] === e);
		if (t) return Se(t[0], 5);
	}
	if (e.startsWith("card:") || e === "vertical-chart" || e === "line-chart") {
		let t = e.startsWith("card:") ? e.slice(5) : "chart";
		for (let [n] of B) {
			let r = Se(n, 8).objects.find((e) => e.kind === t);
			if (r) return X([{
				...r,
				...e === "vertical-chart" ? { orientation: "vertical" } : e === "line-chart" ? { chartKind: "line" } : {}
			}]);
		}
	}
	if ([
		"reading",
		"watch",
		"learning"
	].includes(e)) {
		let t = [
			"reading",
			"watch",
			"learning"
		].indexOf(e);
		return X([Te().objects[t]]);
	}
	if ([
		"metrics",
		"fits",
		"architecture"
	].includes(e)) return X([Ce().objects[[
		"metrics",
		"fits",
		"architecture"
	].indexOf(e)]]);
	if (e === "video-stack") {
		let e = Ce(3), t = e.items.at(-1);
		return {
			...e,
			items: [t],
			objects: [],
			plan: { geometry: {
				positions: { [t.id]: {
					x: 40,
					y: 40
				} },
				sizes: { [t.id]: t.size },
				constraints: {}
			} }
		};
	}
	if (e.endsWith("-set")) return _e(e.slice(0, -4));
	let t = Y();
	if (e === "multi-picks") {
		let e = t.anchor.recommendations[0];
		return X([{
			...t.anchor,
			title: "Visual references",
			recommendations: [
				e,
				{
					...e,
					id: "reference-2",
					title: "Type and hierarchy",
					recommended: !1,
					why: "A second detail view of the supplied reference; not a separately researched source."
				},
				{
					...e,
					id: "reference-3",
					title: "Image and atmosphere",
					recommended: !1,
					why: "A third detail view of the same source, grouped for design review."
				}
			]
		}]);
	}
	return X([t[e] || t.anchor]);
}
// src/fixtures/DesignCatalog.svelte
var je = m("<a class=\"svelte-y9btyj\"><strong class=\"svelte-y9btyj\"> </strong><small class=\"svelte-y9btyj\"> </small></a>"), Me = m("<h3 class=\"svelte-y9btyj\"> <span> </span></h3><!>", 1), Q = m("<p class=\"svelte-y9btyj\">No matching designs. Try “table”, “calendar” or “diagram”.</p>"), Ne = m("<aside class=\"catalog svelte-y9btyj\" aria-label=\"Design library\"><header class=\"svelte-y9btyj\"><div><h2 class=\"svelte-y9btyj\">Design library</h2><p class=\"svelte-y9btyj\"> </p></div><button aria-label=\"Close design library\" class=\"svelte-y9btyj\">×</button></header> <input type=\"search\" aria-label=\"Search designs\" placeholder=\"Search cards, layouts, interactions…\" class=\"svelte-y9btyj\"/> <nav class=\"svelte-y9btyj\"><!><!></nav></aside>");
function Pe(r, a) {
	c(a, !0);
	let o = k(a, "selected", 3, ""), l = v(""), d = t(() => ke.filter((e) => (e.label + " " + e.description + " " + e.group).toLowerCase().includes(A(l).toLowerCase()))), f = (e) => e === "source-stack" ? "?aegisFixture=mixed-result&panel=stack" : e === "questions" ? "?aegisFixture=mixed-result&panel=questions" : "?aegisFixture=mixed-result&panel=catalog&example=" + encodeURIComponent(e);
	var m = Ne();
	h("keydown", y, (e) => {
		e.key === "Escape" && a.onclose();
	});
	var _ = O(m), b = O(_), D = S(O(b)), M = O(D);
	L(D), L(b);
	var N = S(b);
	L(_);
	var F = S(_, 2);
	T(F);
	var I = S(F, 2), R = O(I);
	u(R, 16, () => [
		"Reference presentations",
		"Core cards",
		"Workspace layouts"
	], n, (r, a) => {
		let c = t(() => A(d).filter((e) => e.group === a));
		var l = p(), m = E(l), h = (t) => {
			var r = Me(), s = E(r), l = O(s), d = S(l), p = O(d, !0);
			L(d), L(s);
			var m = S(s);
			u(m, 17, () => A(c), n, (t, n) => {
				var r = je(), a = O(r), s = O(a, !0);
				L(a);
				var c = S(a), l = O(c, !0);
				L(c), L(r), w((t) => {
					x(r, "href", t), x(r, "aria-current", A(n).id === o() ? "page" : void 0), e(s, A(n).label), e(l, A(n).description);
				}, [() => f(A(n).id)]), i(t, r);
			}), w(() => {
				e(l, `${a ?? ""} `), e(p, A(c).length);
			}), i(t, r);
		};
		s(m, (e) => {
			A(c).length && e(h);
		}), i(r, l);
	});
	var ee = S(R), z = (e) => {
		var t = Q();
		i(e, t);
	};
	s(ee, (e) => {
		A(d).length || e(z);
	}), L(I), L(m), w(() => e(M, `${ke.length ?? ""} layouts and card presentations`)), g("click", N, function(...e) {
		a.onclose?.apply(this, e);
	}), j(F, () => A(l), (e) => P(l, e)), i(r, m), C();
}
o(["click"]);
// src/ClarificationPanel.svelte
var Fe = m("<button type=\"button\"> </button>"), Ie = m("<header class=\"svelte-dyy9dh\"><!><span> </span> <!></header>"), Le = m("<div class=\"voice-row svelte-dyy9dh\"><span> </span><button type=\"button\"> </button></div>"), Re = m("<p class=\"heard svelte-dyy9dh\"><span class=\"svelte-dyy9dh\">Heard</span> </p>"), ze = m("<p role=\"alert\" class=\"svelte-dyy9dh\"> </p>"), Be = m("<section aria-label=\"AEGIS question\" aria-live=\"polite\"><!> <!> <!> <!></section>");
function Ve(n, r) {
	c(r, !0);
	let o = k(r, "disabled", 3, !1), l = k(r, "listening", 3, !1), u = k(r, "heard", 3, ""), d = k(r, "embedded", 3, !1), p = v(!1), m = v(""), h = t(() => r.question.step);
	M(() => {
		A(h), P(p, !1), P(m, "");
	});
	async function _(e) {
		if (!(o() || A(p))) {
			P(p, !0), P(m, "");
			try {
				await r.onanswer(e);
			} catch (e) {
				P(p, !1), P(m, e instanceof Error ? e.message : "Could not send answer. Try again.", !0);
			}
		}
	}
	var y = Be();
	let b;
	var T = O(y), E = (n) => {
		var a = Ie(), c = O(a);
		{
			let e = t(() => l() ? "reading" : "waiting");
			R(c, {
				kind: "lead",
				get mood() {
					return A(e);
				},
				size: 24
			});
		}
		var u = S(c), d = O(u, !0);
		L(u);
		var m = S(u, 2), h = (t) => {
			var n = Fe();
			let a;
			var s = O(n, !0);
			L(n), w(() => {
				a = f(n, 1, "voice svelte-dyy9dh", null, a, { on: l() }), x(n, "aria-pressed", l()), n.disabled = o() || A(p), e(s, l() ? "Stop listening" : "Answer by voice");
			}), g("click", n, function(...e) {
				r.onvoice?.apply(this, e);
			}), i(t, n);
		};
		s(m, (e) => {
			r.onvoice && e(h);
		}), L(a), w(() => e(d, A(p) ? "Sending your answer…" : l() ? "Listening for your answer" : "Waiting for you")), i(n, a);
	}, D = (t) => {
		var n = Le(), a = O(n), s = O(a, !0);
		L(a);
		var c = S(a);
		let u;
		var d = O(c, !0);
		L(c), L(n), w(() => {
			e(s, A(p) ? "Sending your answer…" : l() ? "Listening for your answer" : ""), u = f(c, 1, "voice svelte-dyy9dh", null, u, { on: l() }), x(c, "aria-pressed", l()), c.disabled = o() || A(p), e(d, l() ? "Stop listening" : "Answer by voice");
		}), g("click", c, function(...e) {
			r.onvoice?.apply(this, e);
		}), i(t, n);
	};
	s(T, (e) => {
		d() ? r.onvoice && e(D, 1) : e(E);
	});
	var j = S(T, 2);
	a(j, () => r.question.step, (e) => {
		{
			let n = t(() => o() || A(p));
			de(e, {
				get ask() {
					return r.question;
				},
				placement: "island",
				get busy() {
					return A(n);
				},
				onanswer: _
			});
		}
	});
	var N = S(j, 2), F = (t) => {
		var n = Re(), r = S(O(n));
		L(n), w(() => e(r, ` “${u() ?? ""}”`)), i(t, n);
	};
	s(N, (e) => {
		l() && u() && e(F);
	});
	var I = S(N, 2), ee = (t) => {
		var n = ze(), r = O(n, !0);
		L(n), w(() => e(r, A(m))), i(t, n);
	};
	s(I, (e) => {
		A(m) && e(ee);
	}), L(y), w(() => {
		b = f(y, 1, "clarification nodrag nopan nowheel svelte-dyy9dh", null, b, { embedded: d() }), x(y, "aria-busy", A(p));
	}), i(n, y), C();
}
o(["click"]);
// src/fixtures/google.ts
var $ = !0;
async function He(e, t = {}) {
	let n;
	if (e === "/api/work/google/connect") n = { authorization_url: "https://accounts.google.com/o/oauth2/v2/auth?fixture=not-a-real-authorization" };
	else if (e === "/api/work/google") t.method === "DELETE" && ($ = !1), n = {
		configured: !0,
		connected: $,
		services: $ ? ["calendar", "gmail"] : []
	};
	else if (e.startsWith("/api/work/google/messages?")) n = {
		items: [{
			id: "fixture1",
			subject: "Fixture: review the design",
			from: "Synthetic sender",
			date: "16 November 2026",
			snippet: "A synthetic message for offline interaction verification.",
			url: "https://example.org/fixture"
		}],
		has_more: !1
	};
	else if (e.startsWith("/api/work/google/events?")) n = {
		items: [{
			id: "fixture1",
			summary: "Fixture: design review",
			start: { dateTime: "2026-11-16T10:00:00+01:00" },
			end: { dateTime: "2026-11-16T11:00:00+01:00" }
		}],
		has_more: !1
	};
	else throw Error("Simulation refuses unsupported account request");
	return n;
}
// src/fixtures/SourceStackFixture.svelte
var Ue = m("<div class=\"source-fixture svelte-14zuxom\"><p class=\"svelte-14zuxom\"> </p> <div><!></div> <output class=\"svelte-14zuxom\"> </output></div> <!>", 1);
function We(t, n) {
	c(n, !0);
	let r = new URLSearchParams(location.search), a = Math.max(1, Math.min(10, Number(r.get("pages")) || 3)), o = Number(r.get("sourceWidth")) === 336 ? 336 : 404, l = Array.from({ length: a }, (e, t) => ({
		id: "fixture-page-" + (t + 1),
		title: "Fixture page " + (t + 1) + " · Source inspection",
		url: "https://example.org/fixture/" + (t + 1),
		frame: t === a - 1 ? null : "/fixtures/v20/reference.png"
	})), u = {
		id: "fixture-stack",
		type: "part",
		aegisSourceWidth: o,
		part: {
			title: "Supplied reference pages",
			shape: "pages",
			state: "complete",
			pages: [...l].reverse(),
			...a > 1 ? { stack: {
				id: "fixture-stack",
				count: a,
				open: !1
			} } : {}
		}
	}, d = v(null), f = v(null), p = v(!1), m = v(!1), h = v("No source selected"), g;
	function _() {
		clearTimeout(g), P(m, !1);
	}
	function y() {
		clearTimeout(g), g = setTimeout(b, 180);
	}
	function b() {
		P(m, !0), g = setTimeout(() => {
			P(d, null), P(m, !1);
		}, 280);
	}
	D(() => {
		fe(G(new Map(l.map((e) => [e.url, {
			title: e.title,
			excerpt: "Synthetic source metadata for readability and interaction checks. The image is a supplied design reference, not a website capture.",
			retrieval: "fixture"
		}]))));
		let e = (e) => {
			let t = e.detail;
			t.id === u.id && (t.kind === "leave" ? y() : (_(), P(d, t.anchor, !0), P(f, new DOMRect(0, 0, innerWidth, innerHeight), !0), P(p, t.kind === "toggle")));
		};
		return window.addEventListener("aegis-source-stack", e), () => {
			window.removeEventListener("aegis-source-stack", e), clearTimeout(g), fe(G(/* @__PURE__ */ new Map()));
		};
	});
	var x = Ue(), T = E(x), k = O(T), j = O(k);
	L(k);
	var M = S(k, 2);
	let N;
	var I = O(M);
	te(I, {
		get item() {
			return u;
		},
		selected: !1,
		onopen: (e) => P(h, l.find((t) => t.id === e)?.url || "", !0),
		onlist: () => {}
	}), L(M);
	var R = S(M, 2), ee = O(R, !0);
	L(R), L(T);
	var z = S(T, 2), ne = (e) => {
		W(e, {
			get anchor() {
				return A(d);
			},
			get bounds() {
				return A(f);
			},
			get pages() {
				return l;
			},
			title: "Fixture source stack",
			get focusFirst() {
				return A(p);
			},
			get closing() {
				return A(m);
			},
			onhold: _,
			onleave: y,
			onclose: b,
			onopen: (e) => P(h, e.url, !0)
		});
	};
	s(z, (e) => {
		A(d) && A(f) && e(ne);
	}), w(() => {
		e(j, `Production source components · ${o}px · synthetic records`), N = F(M, "", N, {
			width: o + 170 + "px",
			height: o * 10 / 16 + 80 + "px"
		}), e(ee, A(h));
	}), i(t, x), C();
}
// src/fixtures/FixtureWorkspace.svelte
var Ge = m("<option> </option>"), Ke = m("<label class=\"svelte-1b8kcgo\">Videos<select class=\"svelte-1b8kcgo\"></select></label><button class=\"svelte-1b8kcgo\">All workspace designs</button>", 1), qe = m("<label class=\"svelte-1b8kcgo\">Design<select class=\"svelte-1b8kcgo\"></select></label><label class=\"svelte-1b8kcgo\">Objects<select class=\"svelte-1b8kcgo\"></select></label>", 1), Je = m("<div class=\"fixture-question svelte-1b8kcgo\"><!></div>"), Ye = m("<div class=\"fixture-complete svelte-1b8kcgo\" role=\"status\">Both answers recorded in this local fixture. No research was started.</div>"), Xe = m("<p class=\"svelte-1b8kcgo\"> <br/> </p>"), Ze = m("<aside class=\"fixture-saved svelte-1b8kcgo\"><button class=\"svelte-1b8kcgo\">Close</button><h2> </h2><p class=\"svelte-1b8kcgo\">In-memory preview only</p><h3> </h3><!></aside>"), Qe = m("<aside class=\"fixture-account svelte-1b8kcgo\"><strong class=\"svelte-1b8kcgo\">Simulated account · no Google connection</strong><!></aside>"), $e = m("<div class=\"fixture-workspace svelte-1b8kcgo\"><header class=\"svelte-1b8kcgo\"><button class=\"svelte-1b8kcgo\"> </button><div class=\"svelte-1b8kcgo\"><strong class=\"svelte-1b8kcgo\">AEGIS Work</strong><span class=\"svelte-1b8kcgo\"> </span></div><label class=\"svelte-1b8kcgo\">Examples<select class=\"svelte-1b8kcgo\"><option>All cards and layouts</option><option>Visual direction and image picks</option><option>Market map and company table</option><option>Campaign calendar and plan</option><option>Request activity</option><option>25 workspace designs</option><option>AI-adaptive card library</option><option>Diagrams and video stacks</option><option>Reading, video and learning plan</option><option>Clarification conversation</option></select></label><button class=\"svelte-1b8kcgo\">Select / move cards</button><!><button class=\"svelte-1b8kcgo\">Reset fixture</button></header> <!> <!> <div class=\"canvas svelte-1b8kcgo\"><!></div> <!> <!> <!> <div class=\"fixture-browsers svelte-1b8kcgo\"></div> <!> <!> <!></div>");
function et(o, d) {
	c(d, !0);
	let f = v(b(new DOMRect(16, 88, innerWidth - 32, innerHeight - 112))), p = v(null), m = v("");
	l(re, {
		save: async (e, t) => (P(p, e, !0), P(J, "Simulation: " + (t === "task" ? "draft tasks" : "note") + " stored in memory only"), t === "task" ? {
			kind: "tasks_created",
			items: e.entries || []
		} : {
			kind: "created",
			summary: { id: "fixture-note" }
		}),
		open: (e) => P(m, e, !0)
	});
	let T = new URLSearchParams(location.search).get("panel"), k = new URLSearchParams(location.search).get("example") || "anchor", j = v(!1), M = v(b(new URLSearchParams(location.search).get("card") || "answer")), F = v(b(new URLSearchParams(location.search).get("preset") || "")), R = v(b(Number(new URLSearchParams(location.search).get("items")) || 8)), z = [
		"editorial",
		"market",
		"campaign",
		"activity"
	].includes(T || ""), te = T === "learning", V = T === "questions", H = v(b([])), W = t(() => Ee[A(H).length]), le = t(() => A(W) ? {
		kind: "question",
		step: A(W).id,
		part: null,
		state: "open",
		prompt: A(W).question,
		options: A(W).options,
		answer: null
	} : null);
	D(() => (U.selectResearch("local-fixture"), () => U.selectResearch("")));
	function de(e, t, n, r) {
		U.open(e, t, "fixture-source", r, n);
	}
	function fe(e) {
		let t = e.detail;
		t?.activation?.isTrusted && de(t.url, t.title, t.activation, t.sourceId);
	}
	let G = new URLSearchParams(location.search), K = v(b(ee(G.get("aegisFixture") || "") ? G.get("aegisFixture") : "mixed-result")), q = v(b(Math.max(2, Math.min(100, Number(G.get("count")) || 8)))), pe, J = v("Local simulation · no AI, search or account calls"), he = G.get("panel") === "references", ge = v(b(Number(G.get("videos")) || 3)), Y = t(() => {
		if (T === "adaptive") return ye(A(M), A(F), A(R));
		if (T === "catalog") return Ae(k);
		if (z) return _e(T);
		if (te) return Te();
		if (V) {
			let e = Ee.slice(0, Math.min(Ee.length, A(H).length + 1)).map((e, t) => ({
				kind: "ask",
				question: e.question,
				answer: A(H)[t] || null
			})), t = {
				id: "investor-prompt",
				type: "request",
				kind: "request",
				title: "Find investors for OpenAI and NVIDIA",
				status: A(W) ? "waiting" : "complete",
				detail: "",
				expanded: !0,
				orders: !0,
				designer: !0,
				turns: {
					local: [],
					exchange: e
				},
				aegisSkills: [{
					name: "investor-list",
					title: "Investor list",
					status: "loaded",
					description: "Simulation skill metadata; no agent has run."
				}],
				size: {
					width: 560,
					height: 460
				}
			};
			return {
				items: [t],
				objects: [],
				links: [],
				plan: { geometry: {
					positions: { "investor-prompt": {
						x: 350,
						y: 450
					} },
					sizes: { "investor-prompt": t.size },
					constraints: {}
				} }
			};
		}
		return he ? Ce(A(ge)) : Se(A(K), A(q));
	}), X = t(() => {
		let e = Object.entries(A(Y).plan.geometry.positions), t = Math.min(...e.map(([, e]) => e.x)), n = Math.min(...e.map(([, e]) => e.y));
		return {
			x: V ? t - 260 : t,
			y: n,
			width: Math.max(...e.map(([e, t]) => t.x + A(Y).plan.geometry.sizes[e].width)) - t
		};
	});
	function ve(e) {
		let t = A(Y).items.find((t) => t.id === e);
		t?.aegisObject && ie(t.aegisObject);
	}
	var be = $e();
	h("aegis-request-result", y, (e) => {
		let t = e.detail?.id, n = A(Y).objects.find((e) => e.id === t);
		n ? window.dispatchEvent(new CustomEvent("aegis-object-open", { detail: { object: n } })) : P(J, "This recorded result is not present in this fixture.");
	}), h("click", y, (e) => U.capture(e), !0), h("keydown", y, (e) => U.capture(e), !0), h("dblclick", y, (e) => U.capture(e), !0), h("resize", y, () => P(f, new DOMRect(16, 88, innerWidth - 32, innerHeight - 112), !0)), h("aegis-open-source-window", y, fe), h("aegis-object-ask", y, (e) => {
		let { object: t, subject: n } = e.detail;
		P(J, "Simulation: ask about " + (n || t.title));
	});
	var xe = O(be), Z = O(xe), we = O(Z);
	L(Z);
	var De = S(Z), Oe = S(O(De)), je = O(Oe, !0);
	L(Oe), L(De);
	var Me = S(De), Q = S(O(Me)), Ne = O(Q);
	Ne.value = Ne.__value = "catalog";
	var Fe = S(Ne);
	Fe.value = Fe.__value = "editorial";
	var Ie = S(Fe);
	Ie.value = Ie.__value = "market";
	var Le = S(Ie);
	Le.value = Le.__value = "campaign";
	var Re = S(Le);
	Re.value = Re.__value = "activity";
	var ze = S(Re);
	ze.value = ze.__value = "designs";
	var Be = S(ze);
	Be.value = Be.__value = "adaptive";
	var $ = S(Be);
	$.value = $.__value = "references";
	var Ue = S($);
	Ue.value = Ue.__value = "learning";
	var et = S(Ue);
	et.value = et.__value = "questions", L(Q);
	var tt;
	I(Q), L(Me);
	var nt = S(Me), rt = S(nt), it = (t) => {
		var r = Ke(), a = E(r), o = S(O(a));
		u(o, 20, () => [
			1,
			3,
			10
		], n, (t, n) => {
			var r = Ge(), a = O(r, !0);
			L(r);
			var o = {};
			w(() => {
				e(a, n), o !== (o = n) && (r.value = (r.__value = n) ?? "");
			}), i(t, r);
		}), L(o), L(a);
		var s = S(a);
		N(o, () => A(ge), (e) => P(ge, e)), g("click", s, () => location.href = location.pathname + "?aegisFixture=mixed-result"), i(t, r);
	}, at = (a) => {
		var o = qe(), s = E(o), c = S(O(s));
		u(c, 21, () => B, n, (n, a) => {
			var o = t(() => r(A(a), 2));
			let s = () => A(o)[0], c = () => A(o)[1];
			var l = Ge(), u = O(l, !0);
			L(l);
			var d = {};
			w(() => {
				e(u, c()), d !== (d = s()) && (l.value = (l.__value = s()) ?? "");
			}), i(n, l);
		}), L(c), L(s);
		var l = S(s), d = S(O(l));
		u(d, 20, () => [
			5,
			8,
			20,
			50,
			100
		], n, (t, n) => {
			var r = Ge(), a = O(r, !0);
			L(r);
			var o = {};
			w(() => {
				e(a, n), o !== (o = n) && (r.value = (r.__value = n) ?? "");
			}), i(t, r);
		}), L(d), L(l), N(c, () => A(K), (e) => P(K, e)), N(d, () => A(q), (e) => P(q, e)), i(a, o);
	};
	s(rt, (e) => {
		he ? e(it) : te || V || z || T === "catalog" || T === "adaptive" || e(at, 1);
	});
	var ot = S(rt);
	L(xe);
	var st = S(xe, 2), ct = (e) => {
		me(e, {
			get family() {
				return A(M);
			},
			get preset() {
				return A(F);
			},
			get count() {
				return A(R);
			},
			onchange: (e, t, n) => {
				P(M, e, !0), P(F, t, !0), P(R, n, !0);
			}
		});
	};
	s(st, (e) => {
		T === "adaptive" && e(ct);
	});
	var lt = S(st, 2), ut = (e) => {
		{
			let n = t(() => T === "catalog" ? k : "");
			Pe(e, {
				get selected() {
					return A(n);
				},
				onclose: () => P(j, !1)
			});
		}
	};
	s(lt, (e) => {
		A(j) && e(ut);
	});
	var dt = S(lt, 2), ft = O(dt);
	a(ft, () => A(K) + ":" + A(q) + ":" + A(M) + ":" + A(F) + ":" + A(R), (e) => {
		{
			let n = t(() => ({
				positions: A(Y).plan.geometry.positions,
				sizes: A(Y).plan.geometry.sizes
			}));
			se(e, {
				get items() {
					return A(Y).items;
				},
				get links() {
					return A(Y).links;
				},
				authoritative: /* @__PURE__ */ new Set(),
				get initialView() {
					return A(n);
				},
				get home() {
					return A(X);
				},
				oninspect: () => {},
				onopen: ve,
				onaction: (e, t) => (P(J, t === "ask" ? "Simulation: ask about " + e : t === "remove" ? "Simulation: removal requested for " + e : t === "choose" || t === "unchoose" ? "Simulation: " + t + " " + e : "Simulation: " + t, !0), !0),
				onselectionaction: (e, t) => {
					e === "ask" ? P(J, "Simulation: a contextual question would include " + t.length + " selected objects.") : e === "remove" ? P(J, "Simulation: selection retained for repeatable tests.") : P(J, "Selected " + t.length + " objects for the next instruction.");
				},
				expose: (e) => {
					pe = e.designer;
				}
			});
		}
	}), L(dt);
	var pt = S(dt, 2);
	ae(pt, {
		onsource: (e, t, n) => de(e, t, n),
		onask: (e) => P(J, "Simulation: ask about " + e.title)
	});
	var mt = S(pt, 2), ht = (e) => {
		var t = Je();
		Ve(O(t), {
			get question() {
				return A(le);
			},
			onanswer: (e) => {
				P(H, [...A(H), e], !0), P(J, "Simulation: answer recorded locally; no research started");
			}
		}), L(t), i(e, t);
	};
	s(mt, (e) => {
		V && A(le) && e(ht);
	});
	var gt = S(mt, 2), _t = (e) => {
		var t = Ye();
		i(e, t);
	};
	s(gt, (e) => {
		V && !A(le) && e(_t);
	});
	var vt = S(gt, 2);
	u(vt, 21, () => U.shown, (e) => e.id, (e, t) => {
		oe(e, {
			get entry() {
				return A(t);
			},
			get bounds() {
				return A(f);
			},
			info: void 0,
			added: !1
		});
	}), L(vt);
	var yt = S(vt, 2), bt = (t) => {
		var r = Ze(), a = O(r), o = S(a), s = O(o);
		L(o);
		var c = S(o, 2), l = O(c, !0);
		L(c);
		var d = S(c);
		u(d, 17, () => A(p).entries || [], n, (t, n) => {
			var r = Xe(), a = O(r, !0), o = S(a, 2, !0);
			L(r), w(() => {
				e(a, A(n).label), e(o, A(n).detail);
			}), i(t, r);
		}), L(r), w(() => {
			e(s, `Simulation ${A(m) ?? ""}`), e(l, A(p).title);
		}), g("click", a, () => P(m, "")), i(t, r);
	};
	s(yt, (e) => {
		A(m) && A(p) && e(bt);
	});
	var xt = S(yt, 2), St = (e) => {
		We(e, {});
	}, Ct = t(() => G.get("panel") === "stack");
	s(xt, (e) => {
		A(Ct) && e(St);
	});
	var wt = S(xt, 2), Tt = (e) => {
		var t = Qe(), n = S(O(t));
		ce(n, {
			get api() {
				return He;
			},
			onAttach: (e) => P(J, "Fixture selected: " + e.title)
		}), L(t), i(e, t);
	}, Et = t(() => G.get("panel") === "google");
	s(wt, (e) => {
		A(Et) && e(Tt);
	}), L(be), w((t) => {
		x(be, "data-v20-fixture", A(K)), x(Z, "aria-expanded", A(j)), e(we, `Design library · ${ke.length ?? ""}`), e(je, A(J)), tt !== (tt = T || "designs") && (Q.value = (Q.__value = T || "designs") ?? "", _(Q, T || "designs")), x(nt, "aria-pressed", t);
	}, [() => ne() === "select"]), g("click", Z, () => P(j, !A(j))), g("change", Q, (e) => location.href = location.pathname + "?aegisFixture=mixed-result&panel=" + e.currentTarget.value), g("click", nt, () => ue(ne() === "select" ? "hand" : "select")), g("click", ot, () => {
		P(H, [], !0), pe && pe.setGeometry(A(Y).plan.geometry);
	}), i(o, be), C();
}
o(["click", "change"]);
export { et as default };
