import "./disclose-version-DFvUDwEH.js";
import { B as e, D as t, Et as n, F as r, H as i, It as a, K as o, M as s, N as c, Nt as l, Q as u, R as d, S as f, Tt as p, V as m, _t as h, ct as g, h as _, it as v, lt as y, q as b, r as x, ut as S } from "./index-client-oI5R0J23.js";
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
var V = i("<br/>"), H = i("<button type=\"button\"> </button>"), U = i("<code class=\"svelte-1nt9ayg\"> </code>"), W = i("<span> </span>"), G = i("<p class=\"lead svelte-1nt9ayg\"> </p>"), K = i("<li class=\"svelte-1nt9ayg\"> </li>"), q = i("<ul class=\"sections svelte-1nt9ayg\"></ul>"), J = i("<div class=\"digest svelte-1nt9ayg\"><!> <!></div>"), Y = i("<p class=\"svelte-1nt9ayg\"><!></p>"), X = i("<h3 class=\"svelte-1nt9ayg\"><!></h3>"), Z = i("<h4 class=\"svelte-1nt9ayg\"><!></h4>"), Q = i("<h5 class=\"svelte-1nt9ayg\"><!></h5>"), te = i("<blockquote class=\"svelte-1nt9ayg\"><!></blockquote>"), ne = i("<li class=\"svelte-1nt9ayg\"><!></li>"), re = i("<pre class=\"svelte-1nt9ayg\"><code class=\"svelte-1nt9ayg\"> </code></pre>");
function $(i, o) {
	n(o, !0);
	let C = (t, n = a) => {
		var i = m(), p = y(i);
		s(p, 17, n, c, (t, n) => {
			var i = m(), a = y(i), s = (t) => {
				var n = V();
				e(t, n);
			}, c = (t) => {
				let i = h(() => k(u(n)));
				var a = m(), s = y(a), c = (t) => {
					var r = H();
					let a;
					var s = g(r, !0);
					l(r), v((e) => {
						a = f(r, 1, "link svelte-1nt9ayg", null, a, e), _(r, "title", u(i)), d(s, u(n).text);
					}, [() => ({
						bold: A(u(n), "bold"),
						italic: A(u(n), "italic")
					})]), b("click", r, () => o.onlink?.(u(i))), e(t, r);
				}, p = (t) => {
					var r = U(), i = g(r, !0);
					l(r), v(() => d(i, u(n).text)), e(t, r);
				}, x = h(() => A(u(n), "code")), S = (t) => {
					var r = W();
					let i;
					var a = g(r, !0);
					l(r), v((e) => {
						i = f(r, 1, "svelte-1nt9ayg", null, i, e), d(a, u(n).text);
					}, [() => ({
						bold: A(u(n), "bold"),
						italic: A(u(n), "italic")
					})]), e(t, r);
				};
				r(s, (e) => {
					u(i) ? e(c) : u(x) ? e(p, 1) : e(S, -1);
				}), e(t, a);
			};
			r(a, (e) => {
				u(n).type === "hardBreak" ? e(s) : u(n).type === "text" && e(c, 1);
			}), e(t, i);
		}), e(t, i);
	}, w = x(o, "card", 3, !1), T = x(o, "paragraphs", 19, () => []), E = h(() => w() ? z({
		paragraphs: T(),
		formatted: o.document
	}) : null), D = h(() => o.node ?? o.document?.document), O = h(() => u(D)?.content ?? []);
	function k(e) {
		return (e.marks?.find((e) => e.type === "link"))?.attrs?.href ?? null;
	}
	function A(e, t) {
		return e.marks?.some((e) => e.type === t) ?? !1;
	}
	var j = m(), M = y(j), N = (t) => {
		var n = J(), i = g(n), a = (t) => {
			var n = G(), r = g(n, !0);
			l(n), v(() => d(r, u(E).lead)), e(t, n);
		};
		r(i, (e) => {
			u(E).lead && e(a);
		});
		var o = S(i, 2), f = (t) => {
			var n = q();
			s(n, 21, () => u(E).headings, c, (t, n) => {
				var r = K(), i = g(r, !0);
				l(r), v(() => d(i, u(n))), e(t, r);
			}), l(n), e(t, n);
		};
		r(o, (e) => {
			u(E).headings.length && e(f);
		}), l(n), e(t, n);
	}, P = (n) => {
		var i = m(), a = y(i);
		s(a, 17, () => u(O), c, (n, i) => {
			var a = m(), p = y(a), h = (t) => {
				var n = Y(), r = g(n);
				C(r, () => u(i).content ?? []), l(n), e(t, n);
			}, _ = (t) => {
				var n = m(), a = y(n), o = (t) => {
					var n = X(), r = g(n);
					C(r, () => u(i).content ?? []), l(n), e(t, n);
				}, s = (t) => {
					var n = Z(), r = g(n);
					C(r, () => u(i).content ?? []), l(n), e(t, n);
				}, c = (t) => {
					var n = Q(), r = g(n);
					C(r, () => u(i).content ?? []), l(n), e(t, n);
				};
				r(a, (e) => {
					u(i).attrs?.level === 1 ? e(o) : u(i).attrs?.level === 2 ? e(s, 1) : e(c, -1);
				}), e(t, n);
			}, b = (t) => {
				var n = te();
				$(g(n), {
					get node() {
						return u(i);
					},
					get onlink() {
						return o.onlink;
					}
				}), l(n), e(t, n);
			}, x = (n) => {
				var r = m(), a = y(r);
				t(a, () => u(i).type === "orderedList" ? "ol" : "ul", !1, (t, n) => {
					f(t, 0, "svelte-1nt9ayg");
					var r = m(), a = y(r);
					s(a, 17, () => u(i).content ?? [], c, (t, n) => {
						var r = ne();
						$(g(r), {
							get node() {
								return u(n);
							},
							get onlink() {
								return o.onlink;
							}
						}), l(r), e(t, r);
					}), e(n, r);
				}), e(n, r);
			}, S = (t) => {
				var n = re(), r = g(n), a = g(r, !0);
				l(r), l(n), v((e) => d(a, e), [() => (u(i).content ?? []).map((e) => e.text ?? "").join("")]), e(t, n);
			};
			r(p, (e) => {
				u(i).type === "paragraph" ? e(h) : u(i).type === "heading" ? e(_, 1) : u(i).type === "blockquote" ? e(b, 2) : u(i).type === "bulletList" || u(i).type === "orderedList" ? e(x, 3) : u(i).type === "codeBlock" && e(S, 4);
			}), e(n, a);
		}), e(n, i);
	};
	r(M, (e) => {
		u(E) ? e(N) : u(D) && e(P, 1);
	}), e(i, j), p();
}
o(["click"]);
export { k as a, A as i, B as n, z as o, O as r, $ as t };
