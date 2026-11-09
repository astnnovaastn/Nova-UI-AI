import "./disclose-version-DFvUDwEH.js";
import { A as e, At as t, Ct as n, F as r, L as i, M as a, Nt as o, R as s, St as c, U as l, W as u, Y as d, at as f, k as p, m, mt as h, ot as g, r as _, st as v, tt as y, w as b, y as x, z as S } from "./index-client-BSGo5gVb.js";
import { t as C } from "./code-BgcBJO2A.js";
// upstream/src/shared/ui/data/Artifact/artifact.ts
var w = (e) => typeof e == "string" && e.length <= 16384, T = (e, t) => e.length <= t && e.every(w), E = (e) => e.length <= 128 && new Set(e.map((e) => e.key)).size === e.length && e.every((e) => e.key.length <= 128 && e.label.length <= 512), D = (e, t = 32) => e.length <= t && e.every((e) => w(e.name) && e.name.length <= 256 && (e.descriptor === void 0 || e.descriptor.length <= 256) && (e.homepage === void 0 || e.homepage.length <= 2048));
function O(e) {
	if (e.key.length > 128 || e.title.length > 512 || !w(e.title) || !w(e.reviewLabel) || !E(e.evidence)) return !1;
	let t = e.content;
	switch (t.kind) {
		case "document": return T(t.paragraphs, 512) && t.paragraphs.reduce((e, t) => e + t.length, 0) <= 262144;
		case "table": return T(t.columns, 32) && t.rows.length <= 1e4 && t.rows.every((e) => e.length === t.columns.length && T(e, 32)) && t.rows.reduce((e, t) => e + t.reduce((e, t) => e + t.length, 0), 0) <= 1048576;
		case "comparison": return T(t.criteria, 32) && t.alternatives.length <= 100 && t.alternatives.reduce((e, t) => e + t.name.length + t.values.reduce((e, t) => e + t.length, 0), 0) <= 262144 && t.alternatives.every((e) => w(e.name) && e.values.length === t.criteria.length && T(e.values, 32));
		case "matrix": return D(t.subjects) && t.subjects.length > 0 && t.criteria.length > 0 && t.criteria.length <= 16 && t.criteria.every((e) => w(e.name) && e.name.length <= 256) && t.cells.length === t.subjects.length && t.cells.every((e) => e.length === t.criteria.length && e.every((e) => E(e.evidence) && (e.note === void 0 || e.note.length <= 512) && (e.value.kind !== "text" || w(e.value.text)))) && T(t.notes, 8);
		case "findings": return D(t.subjects) && t.items.length > 0 && t.items.length <= 64 && t.items.every((e) => w(e.claim) && e.claim.length <= 1024 && E(e.evidence) && (e.subject === void 0 || e.subject < t.subjects.length) && (e.detail === void 0 || e.detail.length <= 4096));
		case "chart": return w(t.xLabel) && w(t.yLabel) && t.series.length <= 16 && t.series.reduce((e, t) => e + t.points.reduce((e, t) => e + t.label.length + t.value.length, 0), 0) <= 65536 && t.series.every((e) => w(e.name) && e.points.length <= 256 && e.points.every((e) => w(e.label) && w(e.value)));
		case "checklist": return t.items.length <= 512 && t.items.reduce((e, t) => e + t.text.length, 0) <= 262144 && t.items.every((e) => w(e.text) && typeof e.completed == "boolean");
		case "sources": return w(t.summary) && D(t.subjects) && t.entries.length <= 64 && t.entries.every((e) => w(e.title) && e.title.length <= 512 && e.role.length <= 128 && (e.subject === void 0 || e.subject < t.subjects.length));
		case "browser": return w(t.title) && w(t.location) && w(t.summary);
		case "diagram": {
			let e = new Set(t.nodes.map((e) => e.id));
			return t.nodes.length > 0 && t.nodes.length <= 64 && e.size === t.nodes.length && t.nodes.every((e) => e.id.length <= 64 && e.name.length <= 256 && (e.note === void 0 || e.note.length <= 512) && (e.vendor === void 0 || e.vendor.length <= 253)) && t.edges.length <= 256 && t.edges.every((t) => e.has(t.from) && e.has(t.to) && (t.label === void 0 || t.label.length <= 128)) && t.layers.length <= 16 && t.layers.every((e) => e.name.length <= 128);
		}
		case "code": {
			let e = C(t.text).length;
			return t.text.length > 0 && w(t.text) && e <= 400 && t.language.length <= 32 && t.notes.length <= 24 && t.notes.every((t) => Number.isInteger(t.from) && Number.isInteger(t.to) && t.from >= 1 && t.from <= t.to && t.to <= e && t.text.length <= 160);
		}
		case "answer": return t.markdown.length > 0 && w(t.markdown) && t.blocks.length <= 400;
		case "unavailable": return w(t.reason);
		default: return !1;
	}
}
function k(e) {
	try {
		let t = new URL(e);
		return ["https:", "http:"].includes(t.protocol) && !t.username && !t.password ? t.origin : "";
	} catch {
		return "";
	}
}
function A(e) {
	if (!e) return "";
	try {
		let t = new URL(e);
		return ["https:", "http:"].includes(t.protocol) ? t.hostname.replace(/^www\./, "") : "";
	} catch {
		return "";
	}
}
var j = /^(summary|in short|tl;?dr|overview|answer|bottom line|the short answer)$/iu, M = /^((recommended |suggested )?next steps?|what to do next|action items|to do|todo|steps)$/iu, N = /^\s*(?:[-*•]|\d+[.)]|\[[ xX]\])\s+/u, P = /^\d{1,2}[.)]\s+/u, ee = /\s*\[[\d\s,–-]+\]\s*$/u, F = (e) => e.replace(/^#+\s*/u, "").replace(/[:：]\s*$/u, "").replace(/\*+/gu, "").trim(), I = (e) => e.replace(/\s+/gu, " ").replace(ee, "").trim(), L = (e) => I(e).split(/(?<=[.!?])\s+/u)[0] ?? "";
function R(e) {
	return e.type === "text" ? e.text ?? "" : e.type === "hardBreak" ? "\n" : (e.content ?? []).map(R).join(e.type === "listItem" ? " " : "");
}
function z(e) {
	let t = [], n = (e) => {
		let n = e.split("\n").filter((e) => e.trim());
		for (let e of n) {
			let n = e.trim(), r = /^(#+)\s/u.exec(n)?.[1]?.length;
			r ? t.push({
				kind: "heading",
				text: F(n),
				level: r
			}) : N.test(n) ? t.push({
				kind: "item",
				text: n.replace(N, "")
			}) : j.test(F(n)) || M.test(F(n)) ? t.push({
				kind: "heading",
				text: F(n),
				level: 2
			}) : t.push({
				kind: "text",
				text: n
			});
		}
	}, r = e.formatted?.document;
	if (r) for (let e of r.content ?? []) if (e.type === "heading") t.push({
		kind: "heading",
		text: F(R(e)),
		level: e.attrs?.level ?? 2
	});
	else if (e.type === "bulletList" || e.type === "orderedList") for (let n of e.content ?? []) t.push({
		kind: "item",
		text: R(n).replace(/\s+/gu, " ").trim()
	});
	else (e.type === "paragraph" || e.type === "blockquote") && n(R(e));
	else for (let t of e.paragraphs) n(t);
	let i = (e) => e.kind === "heading", a = (e) => {
		let n = t.findIndex((t, n) => n > e && i(t));
		return t.slice(e + 1, n < 0 ? void 0 : n);
	}, o = (e) => t.findIndex((t) => i(t) && e.test(t.text)), s = o(j), c = o(M), l = (s >= 0 ? a(s).find((e) => e.kind === "text") : void 0) ?? t.find((e) => e.kind === "text") ?? t.find((e) => e.kind === "item"), u = l ? I(l.text) : "", d = t.flatMap((e, t) => i(e) && (e.level ?? 2) > 1 && P.test(e.text) ? [t] : []), f = [];
	return c >= 0 ? f = a(c).map((e) => ({ text: I(e.text) })).filter((e) => e.text && e.text !== u) : d.length >= 2 && (f = d.map((e) => {
		let n = a(e).find((e) => e.kind !== "heading"), r = n ? L(n.text) : "";
		return {
			text: t[e].text.replace(P, ""),
			...r ? { detail: r } : {}
		};
	})), {
		lead: u,
		headings: t.flatMap((e, t) => i(e) && (e.level ?? 2) > 1 && t !== s && t !== c && !(c < 0 && d.length >= 2 && d.includes(t)) ? [e.text] : []),
		stepsLabel: c >= 0 ? t[c].text : "",
		steps: f
	};
}
function B(e) {
	let t = 0, n = e.findIndex((e) => e.type === "heading" && ++t === 2);
	return n < 0 ? e : e.slice(0, n);
}
// upstream/src/shared/ui/data/Artifact/DocumentView.svelte
var V = S("<br/>"), H = S("<button type=\"button\"> </button>"), U = S("<code class=\"svelte-1nt9ayg\"> </code>"), W = S("<span> </span>"), G = S("<p class=\"lead svelte-1nt9ayg\"> </p>"), K = S("<li class=\"svelte-1nt9ayg\"> </li>"), q = S("<ul class=\"sections svelte-1nt9ayg\"></ul>"), J = S("<div class=\"digest svelte-1nt9ayg\"><!> <!></div>"), Y = S("<p class=\"svelte-1nt9ayg\"><!></p>"), X = S("<h3 class=\"svelte-1nt9ayg\"><!></h3>"), Z = S("<h4 class=\"svelte-1nt9ayg\"><!></h4>"), Q = S("<h5 class=\"svelte-1nt9ayg\"><!></h5>"), te = S("<blockquote class=\"svelte-1nt9ayg\"><!></blockquote>"), ne = S("<li class=\"svelte-1nt9ayg\"><!></li>"), re = S("<pre class=\"svelte-1nt9ayg\"><code class=\"svelte-1nt9ayg\"> </code></pre>");
function $(l, S) {
	n(S, !0);
	let C = (n, c = o) => {
		var l = s(), _ = g(l);
		p(_, 17, c, e, (e, n) => {
			var o = s(), c = g(o), l = (e) => {
				var t = V();
				i(e, t);
			}, p = (e) => {
				let o = h(() => k(d(n)));
				var c = s(), l = g(c), p = (e) => {
					var a = H();
					let s;
					var c = f(a, !0);
					t(a), y((e) => {
						s = x(a, 1, "link svelte-1nt9ayg", null, s, e), m(a, "title", d(o)), r(c, d(n).text);
					}, [() => ({
						bold: A(d(n), "bold"),
						italic: A(d(n), "italic")
					})]), u("click", a, () => S.onlink?.(d(o))), i(e, a);
				}, _ = (e) => {
					var a = U(), o = f(a, !0);
					t(a), y(() => r(o, d(n).text)), i(e, a);
				}, v = h(() => A(d(n), "code")), b = (e) => {
					var a = W();
					let o;
					var s = f(a, !0);
					t(a), y((e) => {
						o = x(a, 1, "svelte-1nt9ayg", null, o, e), r(s, d(n).text);
					}, [() => ({
						bold: A(d(n), "bold"),
						italic: A(d(n), "italic")
					})]), i(e, a);
				};
				a(l, (e) => {
					d(o) ? e(p) : d(v) ? e(_, 1) : e(b, -1);
				}), i(e, c);
			};
			a(c, (e) => {
				d(n).type === "hardBreak" ? e(l) : d(n).type === "text" && e(p, 1);
			}), i(e, o);
		}), i(n, l);
	}, w = _(S, "card", 3, !1), T = _(S, "paragraphs", 19, () => []), E = h(() => w() ? z({
		paragraphs: T(),
		formatted: S.document
	}) : null), D = h(() => S.node ?? S.document?.document), O = h(() => d(D)?.content ?? []);
	function k(e) {
		return (e.marks?.find((e) => e.type === "link"))?.attrs?.href ?? null;
	}
	function A(e, t) {
		return e.marks?.some((e) => e.type === t) ?? !1;
	}
	var j = s(), M = g(j), N = (n) => {
		var o = J(), s = f(o), c = (e) => {
			var n = G(), a = f(n, !0);
			t(n), y(() => r(a, d(E).lead)), i(e, n);
		};
		a(s, (e) => {
			d(E).lead && e(c);
		});
		var l = v(s, 2), u = (n) => {
			var a = q();
			p(a, 21, () => d(E).headings, e, (e, n) => {
				var a = K(), o = f(a, !0);
				t(a), y(() => r(o, d(n))), i(e, a);
			}), t(a), i(n, a);
		};
		a(l, (e) => {
			d(E).headings.length && e(u);
		}), t(o), i(n, o);
	}, P = (n) => {
		var o = s(), c = g(o);
		p(c, 17, () => d(O), e, (n, o) => {
			var c = s(), l = g(c), u = (e) => {
				var n = Y(), r = f(n);
				C(r, () => d(o).content ?? []), t(n), i(e, n);
			}, m = (e) => {
				var n = s(), r = g(n), c = (e) => {
					var n = X(), r = f(n);
					C(r, () => d(o).content ?? []), t(n), i(e, n);
				}, l = (e) => {
					var n = Z(), r = f(n);
					C(r, () => d(o).content ?? []), t(n), i(e, n);
				}, u = (e) => {
					var n = Q(), r = f(n);
					C(r, () => d(o).content ?? []), t(n), i(e, n);
				};
				a(r, (e) => {
					d(o).attrs?.level === 1 ? e(c) : d(o).attrs?.level === 2 ? e(l, 1) : e(u, -1);
				}), i(e, n);
			}, h = (e) => {
				var n = te();
				$(f(n), {
					get node() {
						return d(o);
					},
					get onlink() {
						return S.onlink;
					}
				}), t(n), i(e, n);
			}, _ = (n) => {
				var r = s(), a = g(r);
				b(a, () => d(o).type === "orderedList" ? "ol" : "ul", !1, (n, r) => {
					x(n, 0, "svelte-1nt9ayg");
					var a = s(), c = g(a);
					p(c, 17, () => d(o).content ?? [], e, (e, n) => {
						var r = ne();
						$(f(r), {
							get node() {
								return d(n);
							},
							get onlink() {
								return S.onlink;
							}
						}), t(r), i(e, r);
					}), i(r, a);
				}), i(n, r);
			}, v = (e) => {
				var n = re(), a = f(n), s = f(a, !0);
				t(a), t(n), y((e) => r(s, e), [() => (d(o).content ?? []).map((e) => e.text ?? "").join("")]), i(e, n);
			};
			a(l, (e) => {
				d(o).type === "paragraph" ? e(u) : d(o).type === "heading" ? e(m, 1) : d(o).type === "blockquote" ? e(h, 2) : d(o).type === "bulletList" || d(o).type === "orderedList" ? e(_, 3) : d(o).type === "codeBlock" && e(v, 4);
			}), i(n, c);
		}), i(n, o);
	};
	a(M, (e) => {
		d(E) ? e(N) : d(D) && e(P, 1);
	}), i(l, j), c();
}
l(["click"]);
export { k as a, A as i, B as n, z as o, O as r, $ as t };
