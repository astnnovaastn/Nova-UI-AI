import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, D as n, Dt as r, F as i, Ft as a, H as o, K as s, M as c, N as l, Ot as u, R as d, Rt as f, S as p, V as m, dt as h, ft as g, h as _, ot as v, q as y, r as b, ut as x, yt as S } from "./index-client-C_2wYFnt.js";
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
var V = o("<br/>"), H = o("<button type=\"button\"> </button>"), U = o("<code class=\"svelte-1nt9ayg\"> </code>"), W = o("<span> </span>"), G = o("<p class=\"lead svelte-1nt9ayg\"> </p>"), K = o("<li class=\"svelte-1nt9ayg\"> </li>"), q = o("<ul class=\"sections svelte-1nt9ayg\"></ul>"), J = o("<div class=\"digest svelte-1nt9ayg\"><!> <!></div>"), Y = o("<p class=\"svelte-1nt9ayg\"><!></p>"), X = o("<h3 class=\"svelte-1nt9ayg\"><!></h3>"), Z = o("<h4 class=\"svelte-1nt9ayg\"><!></h4>"), Q = o("<h5 class=\"svelte-1nt9ayg\"><!></h5>"), te = o("<blockquote class=\"svelte-1nt9ayg\"><!></blockquote>"), ne = o("<li class=\"svelte-1nt9ayg\"><!></li>"), re = o("<pre class=\"svelte-1nt9ayg\"><code class=\"svelte-1nt9ayg\"> </code></pre>");
function $(o, s) {
	u(s, !0);
	let C = (n, r = f) => {
		var o = m(), u = h(o);
		c(u, 17, r, l, (n, r) => {
			var o = m(), c = h(o), l = (e) => {
				var n = V();
				t(e, n);
			}, u = (n) => {
				let o = S(() => k(e(r)));
				var c = m(), l = h(c), u = (n) => {
					var i = H();
					let c;
					var l = x(i, !0);
					a(i), v((t) => {
						c = p(i, 1, "link svelte-1nt9ayg", null, c, t), _(i, "title", e(o)), d(l, e(r).text);
					}, [() => ({
						bold: A(e(r), "bold"),
						italic: A(e(r), "italic")
					})]), y("click", i, () => s.onlink?.(e(o))), t(n, i);
				}, f = (n) => {
					var i = U(), o = x(i, !0);
					a(i), v(() => d(o, e(r).text)), t(n, i);
				}, g = S(() => A(e(r), "code")), b = (n) => {
					var i = W();
					let o;
					var s = x(i, !0);
					a(i), v((t) => {
						o = p(i, 1, "svelte-1nt9ayg", null, o, t), d(s, e(r).text);
					}, [() => ({
						bold: A(e(r), "bold"),
						italic: A(e(r), "italic")
					})]), t(n, i);
				};
				i(l, (t) => {
					e(o) ? t(u) : e(g) ? t(f, 1) : t(b, -1);
				}), t(n, c);
			};
			i(c, (t) => {
				e(r).type === "hardBreak" ? t(l) : e(r).type === "text" && t(u, 1);
			}), t(n, o);
		}), t(n, o);
	}, w = b(s, "card", 3, !1), T = b(s, "paragraphs", 19, () => []), E = S(() => w() ? z({
		paragraphs: T(),
		formatted: s.document
	}) : null), D = S(() => s.node ?? s.document?.document), O = S(() => e(D)?.content ?? []);
	function k(e) {
		return (e.marks?.find((e) => e.type === "link"))?.attrs?.href ?? null;
	}
	function A(e, t) {
		return e.marks?.some((e) => e.type === t) ?? !1;
	}
	var j = m(), M = h(j), N = (n) => {
		var r = J(), o = x(r), s = (n) => {
			var r = G(), i = x(r, !0);
			a(r), v(() => d(i, e(E).lead)), t(n, r);
		};
		i(o, (t) => {
			e(E).lead && t(s);
		});
		var u = g(o, 2), f = (n) => {
			var r = q();
			c(r, 21, () => e(E).headings, l, (n, r) => {
				var i = K(), o = x(i, !0);
				a(i), v(() => d(o, e(r))), t(n, i);
			}), a(r), t(n, r);
		};
		i(u, (t) => {
			e(E).headings.length && t(f);
		}), a(r), t(n, r);
	}, P = (r) => {
		var o = m(), u = h(o);
		c(u, 17, () => e(O), l, (r, o) => {
			var u = m(), f = h(u), g = (n) => {
				var r = Y(), i = x(r);
				C(i, () => e(o).content ?? []), a(r), t(n, r);
			}, _ = (n) => {
				var r = m(), s = h(r), c = (n) => {
					var r = X(), i = x(r);
					C(i, () => e(o).content ?? []), a(r), t(n, r);
				}, l = (n) => {
					var r = Z(), i = x(r);
					C(i, () => e(o).content ?? []), a(r), t(n, r);
				}, u = (n) => {
					var r = Q(), i = x(r);
					C(i, () => e(o).content ?? []), a(r), t(n, r);
				};
				i(s, (t) => {
					e(o).attrs?.level === 1 ? t(c) : e(o).attrs?.level === 2 ? t(l, 1) : t(u, -1);
				}), t(n, r);
			}, y = (n) => {
				var r = te();
				$(x(r), {
					get node() {
						return e(o);
					},
					get onlink() {
						return s.onlink;
					}
				}), a(r), t(n, r);
			}, b = (r) => {
				var i = m(), u = h(i);
				n(u, () => e(o).type === "orderedList" ? "ol" : "ul", !1, (n, r) => {
					p(n, 0, "svelte-1nt9ayg");
					var i = m(), u = h(i);
					c(u, 17, () => e(o).content ?? [], l, (n, r) => {
						var i = ne();
						$(x(i), {
							get node() {
								return e(r);
							},
							get onlink() {
								return s.onlink;
							}
						}), a(i), t(n, i);
					}), t(r, i);
				}), t(r, i);
			}, S = (n) => {
				var r = re(), i = x(r), s = x(i, !0);
				a(i), a(r), v((e) => d(s, e), [() => (e(o).content ?? []).map((e) => e.text ?? "").join("")]), t(n, r);
			};
			i(f, (t) => {
				e(o).type === "paragraph" ? t(g) : e(o).type === "heading" ? t(_, 1) : e(o).type === "blockquote" ? t(y, 2) : e(o).type === "bulletList" || e(o).type === "orderedList" ? t(b, 3) : e(o).type === "codeBlock" && t(S, 4);
			}), t(r, u);
		}), t(r, o);
	};
	i(M, (t) => {
		e(E) ? t(N) : e(D) && t(P, 1);
	}), t(o, j), r();
}
s(["click"]);
export { k as a, A as i, B as n, z as o, O as r, $ as t };
