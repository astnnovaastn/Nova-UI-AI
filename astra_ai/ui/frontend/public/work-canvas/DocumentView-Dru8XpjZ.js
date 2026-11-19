import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, D as n, F as r, H as i, J as a, L as o, Mt as s, P as c, S as l, U as u, W as d, Wt as f, Y as p, h as m, ht as h, jt as g, lt as _, mt as v, pt as y, r as b, tt as x, zt as S } from "./index-client-DH73-vTM.js";
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
var V = d("<br/>"), H = d("<button type=\"button\"> </button>"), U = d("<code class=\"svelte-1nt9ayg\"> </code>"), W = d("<span> </span>"), G = d("<p class=\"lead svelte-1nt9ayg\"> </p>"), K = d("<li class=\"svelte-1nt9ayg\"> </li>"), q = d("<ul class=\"sections svelte-1nt9ayg\"></ul>"), J = d("<div class=\"digest svelte-1nt9ayg\"><!> <!></div>"), Y = d("<p class=\"svelte-1nt9ayg\"><!></p>"), X = d("<h3 class=\"svelte-1nt9ayg\"><!></h3>"), Z = d("<h4 class=\"svelte-1nt9ayg\"><!></h4>"), Q = d("<h5 class=\"svelte-1nt9ayg\"><!></h5>"), te = d("<blockquote class=\"svelte-1nt9ayg\"><!></blockquote>"), ne = d("<li class=\"svelte-1nt9ayg\"><!></li>"), re = d("<pre class=\"svelte-1nt9ayg\"><code class=\"svelte-1nt9ayg\"> </code></pre>");
function $(a, d) {
	s(d, !0);
	let C = (n, a = f) => {
		var s = u(), h = v(s);
		c(h, 17, a, r, (n, r) => {
			var a = u(), s = v(a), c = (e) => {
				var t = V();
				i(e, t);
			}, f = (n) => {
				let a = t(() => k(x(r)));
				var s = u(), c = v(s), f = (t) => {
					var n = H();
					let o;
					var s = y(n, !0);
					S(n), _((t) => {
						o = l(n, 1, "link svelte-1nt9ayg", null, o, t), m(n, "title", x(a)), e(s, x(r).text);
					}, [() => ({
						bold: A(x(r), "bold"),
						italic: A(x(r), "italic")
					})]), p("click", n, () => d.onlink?.(x(a))), i(t, n);
				}, h = (t) => {
					var n = U(), a = y(n, !0);
					S(n), _(() => e(a, x(r).text)), i(t, n);
				}, g = t(() => A(x(r), "code")), b = (t) => {
					var n = W();
					let a;
					var o = y(n, !0);
					S(n), _((t) => {
						a = l(n, 1, "svelte-1nt9ayg", null, a, t), e(o, x(r).text);
					}, [() => ({
						bold: A(x(r), "bold"),
						italic: A(x(r), "italic")
					})]), i(t, n);
				};
				o(c, (e) => {
					x(a) ? e(f) : x(g) ? e(h, 1) : e(b, -1);
				}), i(n, s);
			};
			o(s, (e) => {
				x(r).type === "hardBreak" ? e(c) : x(r).type === "text" && e(f, 1);
			}), i(n, a);
		}), i(n, s);
	}, w = b(d, "card", 3, !1), T = b(d, "paragraphs", 19, () => []), E = t(() => w() ? z({
		paragraphs: T(),
		formatted: d.document
	}) : null), D = t(() => d.node ?? d.document?.document), O = t(() => x(D)?.content ?? []);
	function k(e) {
		return (e.marks?.find((e) => e.type === "link"))?.attrs?.href ?? null;
	}
	function A(e, t) {
		return e.marks?.some((e) => e.type === t) ?? !1;
	}
	var j = u(), M = v(j), N = (t) => {
		var n = J(), a = y(n), s = (t) => {
			var n = G(), r = y(n, !0);
			S(n), _(() => e(r, x(E).lead)), i(t, n);
		};
		o(a, (e) => {
			x(E).lead && e(s);
		});
		var l = h(a, 2), u = (t) => {
			var n = q();
			c(n, 21, () => x(E).headings, r, (t, n) => {
				var r = K(), a = y(r, !0);
				S(r), _(() => e(a, x(n))), i(t, r);
			}), S(n), i(t, n);
		};
		o(l, (e) => {
			x(E).headings.length && e(u);
		}), S(n), i(t, n);
	}, P = (t) => {
		var a = u(), s = v(a);
		c(s, 17, () => x(O), r, (t, a) => {
			var s = u(), f = v(s), p = (e) => {
				var t = Y(), n = y(t);
				C(n, () => x(a).content ?? []), S(t), i(e, t);
			}, m = (e) => {
				var t = u(), n = v(t), r = (e) => {
					var t = X(), n = y(t);
					C(n, () => x(a).content ?? []), S(t), i(e, t);
				}, s = (e) => {
					var t = Z(), n = y(t);
					C(n, () => x(a).content ?? []), S(t), i(e, t);
				}, c = (e) => {
					var t = Q(), n = y(t);
					C(n, () => x(a).content ?? []), S(t), i(e, t);
				};
				o(n, (e) => {
					x(a).attrs?.level === 1 ? e(r) : x(a).attrs?.level === 2 ? e(s, 1) : e(c, -1);
				}), i(e, t);
			}, h = (e) => {
				var t = te();
				$(y(t), {
					get node() {
						return x(a);
					},
					get onlink() {
						return d.onlink;
					}
				}), S(t), i(e, t);
			}, g = (e) => {
				var t = u(), o = v(t);
				n(o, () => x(a).type === "orderedList" ? "ol" : "ul", !1, (e, t) => {
					l(e, 0, "svelte-1nt9ayg");
					var n = u(), o = v(n);
					c(o, 17, () => x(a).content ?? [], r, (e, t) => {
						var n = ne();
						$(y(n), {
							get node() {
								return x(t);
							},
							get onlink() {
								return d.onlink;
							}
						}), S(n), i(e, n);
					}), i(t, n);
				}), i(e, t);
			}, b = (t) => {
				var n = re(), r = y(n), o = y(r, !0);
				S(r), S(n), _((t) => e(o, t), [() => (x(a).content ?? []).map((e) => e.text ?? "").join("")]), i(t, n);
			};
			o(f, (e) => {
				x(a).type === "paragraph" ? e(p) : x(a).type === "heading" ? e(m, 1) : x(a).type === "blockquote" ? e(h, 2) : x(a).type === "bulletList" || x(a).type === "orderedList" ? e(g, 3) : x(a).type === "codeBlock" && e(b, 4);
			}), i(t, s);
		}), i(t, a);
	};
	o(M, (e) => {
		x(E) ? e(N) : x(D) && e(P, 1);
	}), i(a, j), g();
}
a(["click"]);
export { k as a, A as i, B as n, z as o, O as r, $ as t };
