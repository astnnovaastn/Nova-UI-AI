import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, F as r, Ft as i, H as a, K as o, M as s, N as c, Ot as l, P as u, R as d, _t as f, dt as p, ft as m, h, ht as g, n as _, ot as v, pt as y, q as b, ut as x, v as S, x as C, yt as w, zt as T } from "./index-client-C_2wYFnt.js";
import { Nt as E, Pt as D, S as O, U as k, b as A, n as j, r as M, s as N, t as P, v as F, y as I } from "./SourceStackOverlay-CwB8Cy69.js";
import { n as L, r as R } from "./PageFace-D2__z-9e.js";
// src/fixtures/workspaces.ts
var z = {
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
}, B = "The workspace follows the evidence available to this task. Each result keeps its original context and can be inspected without leaving the canvas.\n\nThis is a local simulation. No provider, account or external action was used.", V = {
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
function H(e, t = 8, n = "complete") {
	let r = A.find((t) => t[0] === e)[1], i = z[e], a = Array.from({ length: Math.max(2, Math.min(100, t)) }, (e, t) => {
		let a = i[t % i.length];
		return {
			id: "fixture-" + t,
			kind: a,
			title: V[a] || r,
			revision: 1,
			status: n === "failure" && t === 1 ? "failed" : "simulation",
			task_id: "task-" + t,
			body: a === "code" ? "export async function loadContext(runId: string) {\n  const cached = cache.get(runId);\n  if (cached) return cached;\n  return await repository.read(runId);\n}" : a === "diff" ? "@@ context loader @@\n- await fetchEveryPage();\n+ renderFirstPage();\n+ await loadRemainingPages();" : a === "test" ? "LOCAL FIXTURE — not an executed test\n✓ Cached context\n✓ Stable source identities\n○ External provider check unavailable" : B,
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
	}), o = F(a), s = o.slice(1).map((t, n) => ({
		id: "fixture-edge-" + n,
		source: o[e === "parallel-investigation" ? 0 : n].id,
		target: t.id
	})), c = {
		strategy: e,
		workflow: A.find((t) => t[0] === e)[3].split(",")[0],
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
	}, l = I(c);
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
// src/fixtures/google.ts
var U = !0;
async function W(e, t = {}) {
	let n;
	if (e === "/api/work/google/connect") n = { authorization_url: "https://accounts.google.com/o/oauth2/v2/auth?fixture=not-a-real-authorization" };
	else if (e === "/api/work/google") t.method === "DELETE" && (U = !1), n = {
		configured: !0,
		connected: U,
		services: U ? ["calendar", "gmail"] : []
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
var G = a("<div class=\"source-fixture svelte-14zuxom\"><p class=\"svelte-14zuxom\"> </p> <div><!></div> <output class=\"svelte-14zuxom\"> </output></div> <!>", 1);
function K(a, o) {
	l(o, !0);
	let s = new URLSearchParams(location.search), c = Math.max(1, Math.min(10, Number(s.get("pages")) || 3)), u = Number(s.get("sourceWidth")) === 336 ? 336 : 404, h = Array.from({ length: c }, (e, t) => ({
		id: "fixture-page-" + (t + 1),
		title: "Fixture page " + (t + 1) + " · Source inspection",
		url: "https://example.org/fixture/" + (t + 1),
		frame: t === c - 1 ? null : "/fixtures/v20/reference.png"
	})), y = {
		id: "fixture-stack",
		type: "part",
		aegisSourceWidth: u,
		part: {
			title: "Supplied reference pages",
			shape: "pages",
			state: "complete",
			pages: [...h].reverse(),
			...c > 1 ? { stack: {
				id: "fixture-stack",
				count: c,
				open: !1
			} } : {}
		}
	}, b = f(null), S = f(null), w = f(!1), T = f(!1), E = f("No source selected"), D;
	function O() {
		clearTimeout(D), g(T, !1);
	}
	function A() {
		clearTimeout(D), D = setTimeout(j, 180);
	}
	function j() {
		g(T, !0), D = setTimeout(() => {
			g(b, null), g(T, !1);
		}, 280);
	}
	_(() => {
		L(R(new Map(h.map((e) => [e.url, {
			title: e.title,
			excerpt: "Synthetic source metadata for readability and interaction checks. The image is a supplied design reference, not a website capture.",
			retrieval: "fixture"
		}]))));
		let e = (e) => {
			let t = e.detail;
			t.id === y.id && (t.kind === "leave" ? A() : (O(), g(b, t.anchor, !0), g(S, new DOMRect(0, 0, innerWidth, innerHeight), !0), g(w, t.kind === "toggle")));
		};
		return window.addEventListener("aegis-source-stack", e), () => {
			window.removeEventListener("aegis-source-stack", e), clearTimeout(D), L(R(/* @__PURE__ */ new Map()));
		};
	});
	var M = G(), N = p(M), F = x(N), I = x(F);
	i(F);
	var z = m(F, 2);
	let B;
	var V = x(z);
	k(V, {
		get item() {
			return y;
		},
		selected: !1,
		onopen: (e) => g(E, h.find((t) => t.id === e)?.url || "", !0),
		onlist: () => {}
	}), i(z);
	var H = m(z, 2), U = x(H, !0);
	i(H), i(N);
	var W = m(N, 2), K = (t) => {
		P(t, {
			get anchor() {
				return e(b);
			},
			get bounds() {
				return e(S);
			},
			get pages() {
				return h;
			},
			title: "Fixture source stack",
			get focusFirst() {
				return e(w);
			},
			get closing() {
				return e(T);
			},
			onhold: O,
			onleave: A,
			onclose: j,
			onopen: (e) => g(E, e.url, !0)
		});
	};
	r(W, (t) => {
		e(b) && e(S) && t(K);
	}), v(() => {
		d(I, `Production source components · ${u}px · synthetic records`), B = C(z, "", B, {
			width: u + 170 + "px",
			height: u * 10 / 16 + 80 + "px"
		}), d(U, e(E));
	}), t(a, M), n();
}
// src/fixtures/FixtureWorkspace.svelte
var q = a("<option> </option>"), ee = a("<aside class=\"fixture-account svelte-1b8kcgo\"><strong class=\"svelte-1b8kcgo\">Simulated account · no Google connection</strong><!></aside>"), te = a("<div class=\"fixture-workspace svelte-1b8kcgo\"><header class=\"svelte-1b8kcgo\"><div class=\"svelte-1b8kcgo\"><strong class=\"svelte-1b8kcgo\">AEGIS Work</strong><span class=\"svelte-1b8kcgo\"> </span></div><button class=\"svelte-1b8kcgo\">Select / move cards</button><label class=\"svelte-1b8kcgo\">Design<select class=\"svelte-1b8kcgo\"></select></label><label class=\"svelte-1b8kcgo\">Objects<select class=\"svelte-1b8kcgo\"></select></label><button class=\"svelte-1b8kcgo\">Reset fixture</button></header> <div class=\"canvas svelte-1b8kcgo\"><!></div> <!> <!> <!></div>");
function J(a, o) {
	l(o, !0);
	let p = new URLSearchParams(location.search), _ = f(y(O(p.get("aegisFixture") || "") ? p.get("aegisFixture") : "mixed-result")), C = f(y(Math.max(2, Math.min(100, Number(p.get("count")) || 8)))), k, P = f("Local simulation · no AI, search or account calls"), F = w(() => H(e(_), e(C))), I = w(() => {
		let t = Object.entries(e(F).plan.geometry.positions), n = Math.min(...t.map(([, e]) => e.x));
		return {
			x: n,
			y: Math.min(...t.map(([, e]) => e.y)),
			width: Math.max(...t.map(([t, n]) => n.x + e(F).plan.geometry.sizes[t].width)) - n
		};
	});
	function L(t) {
		let n = e(F).items.find((e) => e.id === t);
		n && window.dispatchEvent(new CustomEvent("aegis-object-open", { detail: { object: n.aegisObject } }));
	}
	var R = te(), z = x(R), B = x(z), V = m(x(B)), U = x(V, !0);
	i(V), i(B);
	var G = m(B), J = m(G), Y = m(x(J));
	s(Y, 21, () => A, c, (n, r) => {
		var a = w(() => T(e(r), 2));
		let o = () => e(a)[0], s = () => e(a)[1];
		var c = q(), l = x(c, !0);
		i(c);
		var u = {};
		v(() => {
			d(l, s()), u !== (u = o()) && (c.value = (c.__value = o()) ?? "");
		}), t(n, c);
	}), i(Y), i(J);
	var X = m(J), Z = m(x(X));
	s(Z, 20, () => [
		5,
		8,
		20,
		50,
		100
	], c, (e, n) => {
		var r = q(), a = x(r, !0);
		i(r);
		var o = {};
		v(() => {
			d(a, n), o !== (o = n) && (r.value = (r.__value = n) ?? "");
		}), t(e, r);
	}), i(Z), i(X);
	var ne = m(X);
	i(z);
	var Q = m(z, 2), re = x(Q);
	u(re, () => e(_) + ":" + e(C), (t) => {
		{
			let n = w(() => ({
				positions: e(F).plan.geometry.positions,
				sizes: e(F).plan.geometry.sizes
			}));
			N(t, {
				get items() {
					return e(F).items;
				},
				get links() {
					return e(F).links;
				},
				authoritative: /* @__PURE__ */ new Set(),
				get initialView() {
					return e(n);
				},
				get home() {
					return e(I);
				},
				oninspect: () => {},
				onopen: L,
				onaction: L,
				onselectionaction: (e, t) => {
					e === "ask" ? g(P, "Simulation: a contextual question would include " + t.length + " selected objects.") : e === "remove" ? g(P, "Simulation: selection retained for repeatable tests.") : g(P, "Selected " + t.length + " objects for the next instruction.");
				},
				expose: (e) => {
					k = e.designer;
				}
			});
		}
	}), i(Q);
	var $ = m(Q, 2);
	M($, { onask: (e) => g(P, "Simulation: ask about " + e.title) });
	var ie = m($, 2), ae = (e) => {
		K(e, {});
	}, oe = w(() => p.get("panel") === "stack");
	r(ie, (t) => {
		e(oe) && t(ae);
	});
	var se = m(ie, 2), ce = (e) => {
		var n = ee(), r = m(x(n));
		j(r, {
			get api() {
				return W;
			},
			onAttach: (e) => g(P, "Fixture selected: " + e.title)
		}), i(n), t(e, n);
	}, le = w(() => p.get("panel") === "google");
	r(se, (t) => {
		e(le) && t(ce);
	}), i(R), v((t) => {
		h(R, "data-v20-fixture", e(_)), d(U, e(P)), h(G, "aria-pressed", t);
	}, [() => E() === "select"]), b("click", G, () => D(E() === "select" ? "hand" : "select")), S(Y, () => e(_), (e) => g(_, e)), S(Z, () => e(C), (e) => g(C, e)), b("click", ne, () => {
		k && k.setGeometry(e(F).plan.geometry);
	}), t(a, R), n();
}
o(["click"]);
export { J as default };
