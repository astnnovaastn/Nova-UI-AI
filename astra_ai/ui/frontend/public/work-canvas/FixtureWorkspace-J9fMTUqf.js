import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, F as n, Gt as r, H as i, I as a, J as o, L as s, Mt as c, Nt as l, P as u, Rt as d, U as f, W as p, X as m, Y as h, b as g, bt as _, ft as v, gt as y, h as b, ht as x, jt as ee, lt as S, m as C, mt as w, n as T, pt as E, r as D, tt as O, u as k, v as A, vt as j, x as M, y as N, zt as P } from "./index-client-DH73-vTM.js";
import { $ as F, A as I, E as L, Gt as te, J as R, M as z, O as ne, T as re, Wt as ie, _ as ae, a as oe, g as se, i as ce, k as B, n as le, r as ue, s as de, t as V } from "./SourceStackOverlay-CGBN_OM5.js";
import { n as H, r as U } from "./PageFace-BuCl6qpz.js";
// src/fixtures/AdaptiveGallery.svelte
var W = p("<option> </option>"), fe = p("<li class=\"svelte-lpqqem\"> </li>"), pe = p("<aside class=\"adaptive-gallery svelte-lpqqem\" aria-label=\"Adaptive card library\"><h2 class=\"svelte-lpqqem\">Adaptive cards</h2><p class=\"svelte-lpqqem\">20 families · 800 specifications</p> <label class=\"svelte-lpqqem\">Family<select aria-label=\"Family\" class=\"svelte-lpqqem\"></select></label> <label class=\"svelte-lpqqem\">Presentation<select aria-label=\"Presentation\" class=\"svelte-lpqqem\"></select></label> <label class=\"svelte-lpqqem\">Data size<select aria-label=\"Data size\" class=\"svelte-lpqqem\"></select></label> <p class=\"svelte-lpqqem\"> </p><details><summary class=\"svelte-lpqqem\">15 uses across workflows</summary><ol></ol></details> <p class=\"notice svelte-lpqqem\">Fixture data only. No research is started and no external action is performed.</p></aside>");
function me(r, a) {
	c(a, !0);
	let o = t(() => z.find((e) => e.id === a.family) || z[0]);
	var s = pe(), l = x(E(s), 3), f = x(E(l));
	u(f, 21, () => z, n, (t, n) => {
		var r = W(), a = E(r, !0);
		P(r);
		var o = {};
		S(() => {
			e(a, O(n).label), o !== (o = O(n).id) && (r.value = (r.__value = O(n).id) ?? "");
		}), i(t, r);
	}), P(f);
	var p;
	N(f), P(l);
	var m = x(l, 2), _ = x(E(m));
	u(_, 21, () => O(o).presets, n, (t, n) => {
		var r = W(), a = E(r);
		P(r);
		var o = {};
		S(() => {
			r.disabled = !O(n).available, e(a, `${O(n).label ?? ""}${O(n).available ? "" : " · awaiting design review"}`), o !== (o = O(n).id) && (r.value = (r.__value = O(n).id) ?? "");
		}), i(t, r);
	}), P(_);
	var v;
	N(_), P(m);
	var y = x(m, 2), b = x(E(y));
	u(b, 20, () => [
		1,
		3,
		8,
		24,
		50,
		100
	], n, (t, n) => {
		var r = W(), a = E(r);
		P(r);
		var o = {};
		S(() => {
			e(a, `${n ?? ""} items`), o !== (o = n) && (r.value = (r.__value = n) ?? "");
		}), i(t, r);
	}), P(b);
	var C;
	N(b), P(y);
	var w = x(y, 2), T = E(w, !0);
	P(w);
	var D = x(w), k = x(E(D));
	u(k, 21, () => O(o).uses, n, (t, n) => {
		var r = fe(), a = E(r, !0);
		P(r), S(() => e(a, O(n))), i(t, r);
	}), P(k), P(D), d(2), P(s), S(() => {
		p !== (p = a.family) && (f.value = (f.__value = a.family) ?? "", g(f, a.family)), v !== (v = a.preset || O(o).presets[0].id) && (_.value = (_.__value = a.preset || O(o).presets[0].id) ?? "", g(_, a.preset || O(o).presets[0].id)), C !== (C = a.count) && (b.value = (b.__value = a.count) ?? "", g(b, a.count)), e(T, O(o).purpose);
	}), h("change", f, (e) => a.onchange(e.currentTarget.value, "", a.count)), h("change", _, (e) => a.onchange(a.family, e.currentTarget.value, a.count)), h("change", b, (e) => a.onchange(a.family, a.preset, Number(e.currentTarget.value))), i(r, s), ee();
}
o(["change"]);
// src/fixtures/presentations.ts
var G = {
	revision: 1,
	status: "simulation",
	sources: [{
		id: "reference",
		title: "Supplied screenshot · illustrative data, not current research"
	}]
}, K = [
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
], q = [
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
function J() {
	let e = typeof location > "u" ? "http://127.0.0.1:5194" : location.origin;
	return {
		anchor: {
			...G,
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
			...G,
			id: "market-map",
			kind: "diagram",
			title: "Google Cloud market map",
			diagramDirection: "right",
			nodes: K.map(([e, t, n], r) => ({
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
			...G,
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
			rows: K.map(([e, t, n]) => [
				e,
				t,
				"https://" + n
			]),
			caption: "Reference classification from the supplied screenshot. Funding and founding data are intentionally unknown; no live market research was performed."
		},
		campaign: {
			...G,
			id: "campaign",
			kind: "timeline",
			title: "gork launch campaign",
			planMode: "schedule",
			planTotal: {
				label: "Budget envelope",
				value: "$2,000–10,000"
			},
			entries: q.map(([e, t, n, r, i, a], o) => ({
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
			...G,
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
			...G,
			id: "editorial-answer",
			kind: "answer",
			title: "Indigo futures, oversized type, editorial AI",
			body: "The accessible anchor is a cinematic publication layout: use its dense indigo field, giant type and controlled neon energy as the visual starting point.\n\n• Palette: deep indigo with a restrained neon accent\n• Type: oversized, assertive editorial sans\n• Texture: cinematic imagery over a clear paper-like structure\n• Composition: magazine spreads, strong hierarchy, wide negative space\n• Avoid: generic dashboards and rainbow gradients"
		},
		marketAnswer: {
			...G,
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
function Y(e, t) {
	let n = B(e), r = 40;
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
function he(e = "market") {
	let t = J();
	return e === "editorial" ? Y([t.editorial, t.anchor], [{
		x: 40,
		y: 40
	}, {
		x: 40,
		y: 450
	}]) : e === "campaign" ? Y([t.campaign, t.activity], [{
		x: 40,
		y: 40
	}, {
		x: 1250,
		y: 40
	}]) : e === "activity" ? Y([t.activity, t.campaign], [{
		x: 40,
		y: 40
	}, {
		x: 800,
		y: 40
	}]) : Y([
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
function ge(e = "answer", t = "", n = 8) {
	let r = z.find((t) => t.id === e) || z[0], i = r.presets.find((e) => e.id === t && e.available) || r.presets[0], a = Array.from({ length: n }, (e, t) => ({
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
	].includes(r.id) && (s.media = o, s.url = o[0]?.url, s.blocks = []), r.id === "code" && (s.language = "python", s.body = "def summarize(records):\n    valid = [r for r in records if r.get(\"source_id\")]\n    return {\"count\": len(valid), \"records\": valid}\n"), r.id === "diff" && (s.language = "python", s.body = "--- a/summary.py\n+++ b/summary.py\n@@ -1,2 +1,2 @@\n def summarize(records):\n-    return len(records)\n+    return sum(bool(r.get(\"source_id\")) for r in records)"), r.id === "test" && (s.body = "NOT EXECUTED — proposed validation\n\n1. Supply a record without a source.\n2. Verify it is marked unknown.\n3. Verify known records retain their evidence.", s.language = "text"), r.id === "draft" && (s.body = "Proposed message\n\nHere is the evidence collected so far. Two questions remain open. Please review the attached comparison before we decide."), I(s);
}
function _e(e, t, n) {
	return Y([ge(e, t, n)]);
}
// src/fixtures/workspaces.ts
var ve = {
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
}, X = "The workspace follows the evidence available to this task. Each result keeps its original context and can be inspected without leaving the canvas.\n\nThis is a local simulation. No provider, account or external action was used.", ye = {
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
function be(e, t = 8, n = "complete") {
	let r = L.find((t) => t[0] === e)[1], i = ve[e], a = Array.from({ length: Math.max(2, Math.min(100, t)) }, (e, t) => {
		let a = i[t % i.length];
		return {
			id: "fixture-" + t,
			kind: a,
			title: ye[a] || r,
			revision: 1,
			status: n === "failure" && t === 1 ? "failed" : "simulation",
			task_id: "task-" + t,
			body: a === "code" ? "export async function loadContext(runId: string) {\n  const cached = cache.get(runId);\n  if (cached) return cached;\n  return await repository.read(runId);\n}" : a === "diff" ? "@@ context loader @@\n- await fetchEveryPage();\n+ renderFirstPage();\n+ await loadRemainingPages();" : a === "test" ? "LOCAL FIXTURE — not an executed test\n✓ Cached context\n✓ Stable source identities\n○ External provider check unavailable" : X,
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
	}), o = B(a), s = o.slice(1).map((t, n) => ({
		id: "fixture-edge-" + n,
		source: o[e === "parallel-investigation" ? 0 : n].id,
		target: t.id
	})), c = {
		strategy: e,
		workflow: L.find((t) => t[0] === e)[3].split(",")[0],
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
	}, l = re(c);
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
function xe(e = 3) {
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
	], r = B(n), i = Array.from({ length: Math.max(1, Math.min(10, e)) }, (e, t) => ({
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
var Se = [
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
function Ce() {
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
			entries: Se.map(([e, t], n) => ({
				id: "week-" + (n + 1),
				label: "Week " + (n + 1) + " · " + e,
				detail: t,
				when: "6 hours"
			}))
		}
	], n = B(t);
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
var we = [{
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
}], Z = [
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
], Te = [
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
], Ee = [
	...L.map(([e, t, n]) => ({
		id: "layout:" + e,
		label: t,
		description: n,
		group: "Workspace layouts"
	})),
	...Z.map((e, t) => ({
		id: "card:" + e,
		label: Te[t],
		description: "Individual " + Te[t].toLowerCase() + " presentation",
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
function De(e) {
	if (e.startsWith("layout:")) {
		let t = L.find((t) => "layout:" + t[0] === e);
		if (t) return be(t[0], 5);
	}
	if (e.startsWith("card:") || e === "vertical-chart" || e === "line-chart") {
		let t = e.startsWith("card:") ? e.slice(5) : "chart";
		for (let [n] of L) {
			let r = be(n, 8).objects.find((e) => e.kind === t);
			if (r) return Y([{
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
		return Y([Ce().objects[t]]);
	}
	if ([
		"metrics",
		"fits",
		"architecture"
	].includes(e)) return Y([xe().objects[[
		"metrics",
		"fits",
		"architecture"
	].indexOf(e)]]);
	if (e === "video-stack") {
		let e = xe(3), t = e.items.at(-1);
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
	if (e.endsWith("-set")) return he(e.slice(0, -4));
	let t = J();
	if (e === "multi-picks") {
		let e = t.anchor.recommendations[0];
		return Y([{
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
	return Y([t[e] || t.anchor]);
}
// src/fixtures/DesignCatalog.svelte
var Q = p("<a class=\"svelte-y9btyj\"><strong class=\"svelte-y9btyj\"> </strong><small class=\"svelte-y9btyj\"> </small></a>"), Oe = p("<h3 class=\"svelte-y9btyj\"> <span> </span></h3><!>", 1), ke = p("<p class=\"svelte-y9btyj\">No matching designs. Try “table”, “calendar” or “diagram”.</p>"), Ae = p("<aside class=\"catalog svelte-y9btyj\" aria-label=\"Design library\"><header class=\"svelte-y9btyj\"><div><h2 class=\"svelte-y9btyj\">Design library</h2><p class=\"svelte-y9btyj\"> </p></div><button aria-label=\"Close design library\" class=\"svelte-y9btyj\">×</button></header> <input type=\"search\" aria-label=\"Search designs\" placeholder=\"Search cards, layouts, interactions…\" class=\"svelte-y9btyj\"/> <nav class=\"svelte-y9btyj\"><!><!></nav></aside>");
function je(r, a) {
	c(a, !0);
	let o = D(a, "selected", 3, ""), l = _(""), d = t(() => Ee.filter((e) => (e.label + " " + e.description + " " + e.group).toLowerCase().includes(O(l).toLowerCase()))), p = (e) => e === "source-stack" ? "?aegisFixture=mixed-result&panel=stack" : e === "questions" ? "?aegisFixture=mixed-result&panel=questions" : "?aegisFixture=mixed-result&panel=catalog&example=" + encodeURIComponent(e);
	var g = Ae();
	m("keydown", v, (e) => {
		e.key === "Escape" && a.onclose();
	});
	var y = E(g), T = E(y), A = x(E(T)), M = E(A);
	P(A), P(T);
	var N = x(T);
	P(y);
	var F = x(y, 2);
	C(F);
	var I = x(F, 2), L = E(I);
	u(L, 16, () => [
		"Reference presentations",
		"Core cards",
		"Workspace layouts"
	], n, (r, a) => {
		let c = t(() => O(d).filter((e) => e.group === a));
		var l = f(), m = w(l), h = (t) => {
			var r = Oe(), s = w(r), l = E(s), d = x(l), f = E(d, !0);
			P(d), P(s);
			var m = x(s);
			u(m, 17, () => O(c), n, (t, n) => {
				var r = Q(), a = E(r), s = E(a, !0);
				P(a);
				var c = x(a), l = E(c, !0);
				P(c), P(r), S((t) => {
					b(r, "href", t), b(r, "aria-current", O(n).id === o() ? "page" : void 0), e(s, O(n).label), e(l, O(n).description);
				}, [() => p(O(n).id)]), i(t, r);
			}), S(() => {
				e(l, `${a ?? ""} `), e(f, O(c).length);
			}), i(t, r);
		};
		s(m, (e) => {
			O(c).length && e(h);
		}), i(r, l);
	});
	var te = x(L), R = (e) => {
		var t = ke();
		i(e, t);
	};
	s(te, (e) => {
		O(d).length || e(R);
	}), P(I), P(g), S(() => e(M, `${Ee.length ?? ""} layouts and card presentations`)), h("click", N, function(...e) {
		a.onclose?.apply(this, e);
	}), k(F, () => O(l), (e) => j(l, e)), i(r, g), ee();
}
o(["click"]);
// src/fixtures/google.ts
var Me = !0;
async function Ne(e, t = {}) {
	let n;
	if (e === "/api/work/google/connect") n = { authorization_url: "https://accounts.google.com/o/oauth2/v2/auth?fixture=not-a-real-authorization" };
	else if (e === "/api/work/google") t.method === "DELETE" && (Me = !1), n = {
		configured: !0,
		connected: Me,
		services: Me ? ["calendar", "gmail"] : []
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
var Pe = p("<div class=\"source-fixture svelte-14zuxom\"><p class=\"svelte-14zuxom\"> </p> <div><!></div> <output class=\"svelte-14zuxom\"> </output></div> <!>", 1);
function Fe(t, n) {
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
	}, d = _(null), f = _(null), p = _(!1), m = _(!1), h = _("No source selected"), g;
	function v() {
		clearTimeout(g), j(m, !1);
	}
	function y() {
		clearTimeout(g), g = setTimeout(b, 180);
	}
	function b() {
		j(m, !0), g = setTimeout(() => {
			j(d, null), j(m, !1);
		}, 280);
	}
	T(() => {
		H(U(new Map(l.map((e) => [e.url, {
			title: e.title,
			excerpt: "Synthetic source metadata for readability and interaction checks. The image is a supplied design reference, not a website capture.",
			retrieval: "fixture"
		}]))));
		let e = (e) => {
			let t = e.detail;
			t.id === u.id && (t.kind === "leave" ? y() : (v(), j(d, t.anchor, !0), j(f, new DOMRect(0, 0, innerWidth, innerHeight), !0), j(p, t.kind === "toggle")));
		};
		return window.addEventListener("aegis-source-stack", e), () => {
			window.removeEventListener("aegis-source-stack", e), clearTimeout(g), H(U(/* @__PURE__ */ new Map()));
		};
	});
	var C = Pe(), D = w(C), k = E(D), A = E(k);
	P(k);
	var N = x(k, 2);
	let I;
	var L = E(N);
	F(L, {
		get item() {
			return u;
		},
		selected: !1,
		onopen: (e) => j(h, l.find((t) => t.id === e)?.url || "", !0),
		onlist: () => {}
	}), P(N);
	var te = x(N, 2), R = E(te, !0);
	P(te), P(D);
	var z = x(D, 2), ne = (e) => {
		V(e, {
			get anchor() {
				return O(d);
			},
			get bounds() {
				return O(f);
			},
			get pages() {
				return l;
			},
			title: "Fixture source stack",
			get focusFirst() {
				return O(p);
			},
			get closing() {
				return O(m);
			},
			onhold: v,
			onleave: y,
			onclose: b,
			onopen: (e) => j(h, e.url, !0)
		});
	};
	s(z, (e) => {
		O(d) && O(f) && e(ne);
	}), S(() => {
		e(A, `Production source components · ${o}px · synthetic records`), I = M(N, "", I, {
			width: o + 170 + "px",
			height: o * 10 / 16 + 80 + "px"
		}), e(R, O(h));
	}), i(t, C), ee();
}
// src/fixtures/FixtureWorkspace.svelte
var Ie = p("<option> </option>"), Le = p("<label class=\"svelte-1b8kcgo\">Videos<select class=\"svelte-1b8kcgo\"></select></label><button class=\"svelte-1b8kcgo\">All workspace designs</button>", 1), Re = p("<label class=\"svelte-1b8kcgo\">Design<select class=\"svelte-1b8kcgo\"></select></label><label class=\"svelte-1b8kcgo\">Objects<select class=\"svelte-1b8kcgo\"></select></label>", 1), ze = p("<div class=\"fixture-question svelte-1b8kcgo\"><!></div>"), Be = p("<div class=\"fixture-complete svelte-1b8kcgo\" role=\"status\">Both answers recorded in this local fixture. No research was started.</div>"), Ve = p("<p class=\"svelte-1b8kcgo\"> <br/> </p>"), He = p("<aside class=\"fixture-saved svelte-1b8kcgo\"><button class=\"svelte-1b8kcgo\">Close</button><h2> </h2><p class=\"svelte-1b8kcgo\">In-memory preview only</p><h3> </h3><!></aside>"), Ue = p("<aside class=\"fixture-account svelte-1b8kcgo\"><strong class=\"svelte-1b8kcgo\">Simulated account · no Google connection</strong><!></aside>"), We = p("<div class=\"fixture-workspace svelte-1b8kcgo\"><header class=\"svelte-1b8kcgo\"><button class=\"svelte-1b8kcgo\"> </button><div class=\"svelte-1b8kcgo\"><strong class=\"svelte-1b8kcgo\">AEGIS Work</strong><span class=\"svelte-1b8kcgo\"> </span></div><label class=\"svelte-1b8kcgo\">Examples<select class=\"svelte-1b8kcgo\"><option>All cards and layouts</option><option>Visual direction and image picks</option><option>Market map and company table</option><option>Campaign calendar and plan</option><option>Request activity</option><option>25 workspace designs</option><option>AI-adaptive card library</option><option>Diagrams and video stacks</option><option>Reading, video and learning plan</option><option>Clarification conversation</option></select></label><button class=\"svelte-1b8kcgo\">Select / move cards</button><!><button class=\"svelte-1b8kcgo\">Reset fixture</button></header> <!> <!> <div class=\"canvas svelte-1b8kcgo\"><!></div> <!> <!> <!> <div class=\"fixture-browsers svelte-1b8kcgo\"></div> <!> <!> <!></div>");
function $(o, d) {
	c(d, !0);
	let f = _(y(new DOMRect(16, 88, innerWidth - 32, innerHeight - 112))), p = _(null), C = _("");
	l(ae, {
		save: async (e, t) => (j(p, e, !0), j(Y, "Simulation: " + (t === "task" ? "draft tasks" : "note") + " stored in memory only"), t === "task" ? {
			kind: "tasks_created",
			items: e.entries || []
		} : {
			kind: "created",
			summary: { id: "fixture-note" }
		}),
		open: (e) => j(C, e, !0)
	});
	let D = new URLSearchParams(location.search).get("panel"), k = new URLSearchParams(location.search).get("example") || "anchor", M = _(!1), F = _(y(new URLSearchParams(location.search).get("card") || "answer")), I = _(y(new URLSearchParams(location.search).get("preset") || "")), z = _(y(Number(new URLSearchParams(location.search).get("items")) || 8)), re = [
		"editorial",
		"market",
		"campaign",
		"activity"
	].includes(D || ""), B = D === "learning", V = D === "questions", H = _(y([])), U = t(() => we[O(H).length]), W = t(() => O(U) ? {
		kind: "question",
		step: O(U).id,
		part: null,
		state: "open",
		prompt: O(U).question,
		options: O(U).options,
		answer: null
	} : null);
	T(() => (R.selectResearch("local-fixture"), () => R.selectResearch("")));
	function fe(e, t, n, r) {
		R.open(e, t, "fixture-source", r, n);
	}
	function pe(e) {
		let t = e.detail;
		t?.activation?.isTrusted && fe(t.url, t.title, t.activation, t.sourceId);
	}
	let G = new URLSearchParams(location.search), K = _(y(ne(G.get("aegisFixture") || "") ? G.get("aegisFixture") : "mixed-result")), q = _(y(Math.max(2, Math.min(100, Number(G.get("count")) || 8)))), J, Y = _("Local simulation · no AI, search or account calls"), ge = G.get("panel") === "references", ve = _(y(Number(G.get("videos")) || 3)), X = t(() => {
		if (D === "adaptive") return _e(O(F), O(I), O(z));
		if (D === "catalog") return De(k);
		if (re) return he(D);
		if (B) return Ce();
		if (V) {
			let e = we.slice(0, Math.min(we.length, O(H).length + 1)).map((e, t) => ({
				kind: "ask",
				question: e.question,
				answer: O(H)[t] || null
			})), t = {
				id: "investor-prompt",
				type: "request",
				kind: "request",
				title: "Find investors for OpenAI and NVIDIA",
				status: O(U) ? "waiting" : "complete",
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
		return ge ? xe(O(ve)) : be(O(K), O(q));
	}), ye = t(() => {
		let e = Object.entries(O(X).plan.geometry.positions), t = Math.min(...e.map(([, e]) => e.x)), n = Math.min(...e.map(([, e]) => e.y));
		return {
			x: V ? t - 260 : t,
			y: n,
			width: Math.max(...e.map(([e, t]) => t.x + O(X).plan.geometry.sizes[e].width)) - t
		};
	});
	function Se(e) {
		let t = O(X).items.find((t) => t.id === e);
		t?.aegisObject && se(t.aegisObject);
	}
	var Z = We();
	m("aegis-request-result", v, (e) => {
		let t = e.detail?.id, n = O(X).objects.find((e) => e.id === t);
		n ? window.dispatchEvent(new CustomEvent("aegis-object-open", { detail: { object: n } })) : j(Y, "This recorded result is not present in this fixture.");
	}), m("click", v, (e) => R.capture(e), !0), m("keydown", v, (e) => R.capture(e), !0), m("dblclick", v, (e) => R.capture(e), !0), m("resize", v, () => j(f, new DOMRect(16, 88, innerWidth - 32, innerHeight - 112), !0)), m("aegis-open-source-window", v, pe), m("aegis-object-ask", v, (e) => {
		let { object: t, subject: n } = e.detail;
		j(Y, "Simulation: ask about " + (n || t.title));
	});
	var Te = E(Z), Q = E(Te), Oe = E(Q);
	P(Q);
	var ke = x(Q), Ae = x(E(ke)), Me = E(Ae, !0);
	P(Ae), P(ke);
	var Pe = x(ke), $ = x(E(Pe)), Ge = E($);
	Ge.value = Ge.__value = "catalog";
	var Ke = x(Ge);
	Ke.value = Ke.__value = "editorial";
	var qe = x(Ke);
	qe.value = qe.__value = "market";
	var Je = x(qe);
	Je.value = Je.__value = "campaign";
	var Ye = x(Je);
	Ye.value = Ye.__value = "activity";
	var Xe = x(Ye);
	Xe.value = Xe.__value = "designs";
	var Ze = x(Xe);
	Ze.value = Ze.__value = "adaptive";
	var Qe = x(Ze);
	Qe.value = Qe.__value = "references";
	var $e = x(Qe);
	$e.value = $e.__value = "learning";
	var et = x($e);
	et.value = et.__value = "questions", P($);
	var tt;
	N($), P(Pe);
	var nt = x(Pe), rt = x(nt), it = (t) => {
		var r = Le(), a = w(r), o = x(E(a));
		u(o, 20, () => [
			1,
			3,
			10
		], n, (t, n) => {
			var r = Ie(), a = E(r, !0);
			P(r);
			var o = {};
			S(() => {
				e(a, n), o !== (o = n) && (r.value = (r.__value = n) ?? "");
			}), i(t, r);
		}), P(o), P(a);
		var s = x(a);
		A(o, () => O(ve), (e) => j(ve, e)), h("click", s, () => location.href = location.pathname + "?aegisFixture=mixed-result"), i(t, r);
	}, at = (a) => {
		var o = Re(), s = w(o), c = x(E(s));
		u(c, 21, () => L, n, (n, a) => {
			var o = t(() => r(O(a), 2));
			let s = () => O(o)[0], c = () => O(o)[1];
			var l = Ie(), u = E(l, !0);
			P(l);
			var d = {};
			S(() => {
				e(u, c()), d !== (d = s()) && (l.value = (l.__value = s()) ?? "");
			}), i(n, l);
		}), P(c), P(s);
		var l = x(s), d = x(E(l));
		u(d, 20, () => [
			5,
			8,
			20,
			50,
			100
		], n, (t, n) => {
			var r = Ie(), a = E(r, !0);
			P(r);
			var o = {};
			S(() => {
				e(a, n), o !== (o = n) && (r.value = (r.__value = n) ?? "");
			}), i(t, r);
		}), P(d), P(l), A(c, () => O(K), (e) => j(K, e)), A(d, () => O(q), (e) => j(q, e)), i(a, o);
	};
	s(rt, (e) => {
		ge ? e(it) : B || V || re || D === "catalog" || D === "adaptive" || e(at, 1);
	});
	var ot = x(rt);
	P(Te);
	var st = x(Te, 2), ct = (e) => {
		me(e, {
			get family() {
				return O(F);
			},
			get preset() {
				return O(I);
			},
			get count() {
				return O(z);
			},
			onchange: (e, t, n) => {
				j(F, e, !0), j(I, t, !0), j(z, n, !0);
			}
		});
	};
	s(st, (e) => {
		D === "adaptive" && e(ct);
	});
	var lt = x(st, 2), ut = (e) => {
		{
			let n = t(() => D === "catalog" ? k : "");
			je(e, {
				get selected() {
					return O(n);
				},
				onclose: () => j(M, !1)
			});
		}
	};
	s(lt, (e) => {
		O(M) && e(ut);
	});
	var dt = x(lt, 2), ft = E(dt);
	a(ft, () => O(K) + ":" + O(q) + ":" + O(F) + ":" + O(I) + ":" + O(z), (e) => {
		{
			let n = t(() => ({
				positions: O(X).plan.geometry.positions,
				sizes: O(X).plan.geometry.sizes
			}));
			de(e, {
				get items() {
					return O(X).items;
				},
				get links() {
					return O(X).links;
				},
				authoritative: /* @__PURE__ */ new Set(),
				get initialView() {
					return O(n);
				},
				get home() {
					return O(ye);
				},
				oninspect: () => {},
				onopen: Se,
				onaction: (e, t) => (j(Y, t === "ask" ? "Simulation: ask about " + e : t === "remove" ? "Simulation: removal requested for " + e : t === "choose" || t === "unchoose" ? "Simulation: " + t + " " + e : "Simulation: " + t, !0), !0),
				onselectionaction: (e, t) => {
					e === "ask" ? j(Y, "Simulation: a contextual question would include " + t.length + " selected objects.") : e === "remove" ? j(Y, "Simulation: selection retained for repeatable tests.") : j(Y, "Selected " + t.length + " objects for the next instruction.");
				},
				expose: (e) => {
					J = e.designer;
				}
			});
		}
	}), P(dt);
	var pt = x(dt, 2);
	oe(pt, {
		onsource: (e, t, n) => fe(e, t, n),
		onask: (e) => j(Y, "Simulation: ask about " + e.title)
	});
	var mt = x(pt, 2), ht = (e) => {
		var t = ze(), n = E(t);
		ue(n, {
			get question() {
				return O(W);
			},
			onanswer: (e) => {
				j(H, [...O(H), e], !0), j(Y, "Simulation: answer recorded locally; no research started");
			}
		}), P(t), i(e, t);
	};
	s(mt, (e) => {
		V && O(W) && e(ht);
	});
	var gt = x(mt, 2), _t = (e) => {
		var t = Be();
		i(e, t);
	};
	s(gt, (e) => {
		V && !O(W) && e(_t);
	});
	var vt = x(gt, 2);
	u(vt, 21, () => R.shown, (e) => e.id, (e, t) => {
		le(e, {
			get entry() {
				return O(t);
			},
			get bounds() {
				return O(f);
			},
			info: void 0,
			added: !1
		});
	}), P(vt);
	var yt = x(vt, 2), bt = (t) => {
		var r = He(), a = E(r), o = x(a), s = E(o);
		P(o);
		var c = x(o, 2), l = E(c, !0);
		P(c);
		var d = x(c);
		u(d, 17, () => O(p).entries || [], n, (t, n) => {
			var r = Ve(), a = E(r, !0), o = x(a, 2, !0);
			P(r), S(() => {
				e(a, O(n).label), e(o, O(n).detail);
			}), i(t, r);
		}), P(r), S(() => {
			e(s, `Simulation ${O(C) ?? ""}`), e(l, O(p).title);
		}), h("click", a, () => j(C, "")), i(t, r);
	};
	s(yt, (e) => {
		O(C) && O(p) && e(bt);
	});
	var xt = x(yt, 2), St = (e) => {
		Fe(e, {});
	}, Ct = t(() => G.get("panel") === "stack");
	s(xt, (e) => {
		O(Ct) && e(St);
	});
	var wt = x(xt, 2), Tt = (e) => {
		var t = Ue(), n = x(E(t));
		ce(n, {
			get api() {
				return Ne;
			},
			onAttach: (e) => j(Y, "Fixture selected: " + e.title)
		}), P(t), i(e, t);
	}, Et = t(() => G.get("panel") === "google");
	s(wt, (e) => {
		O(Et) && e(Tt);
	}), P(Z), S((t) => {
		b(Z, "data-v20-fixture", O(K)), b(Q, "aria-expanded", O(M)), e(Oe, `Design library · ${Ee.length ?? ""}`), e(Me, O(Y)), tt !== (tt = D || "designs") && ($.value = ($.__value = D || "designs") ?? "", g($, D || "designs")), b(nt, "aria-pressed", t);
	}, [() => ie() === "select"]), h("click", Q, () => j(M, !O(M))), h("change", $, (e) => location.href = location.pathname + "?aegisFixture=mixed-result&panel=" + e.currentTarget.value), h("click", nt, () => te(ie() === "select" ? "hand" : "select")), h("click", ot, () => {
		j(H, [], !0), J && J.setGeometry(O(X).plan.geometry);
	}), i(o, Z), ee();
}
o(["click", "change"]);
export { $ as default };
