import "./disclose-version-DFvUDwEH.js";
import { B as e, C as t, Et as n, F as r, G as i, H as a, K as o, M as s, N as c, Nt as l, Q as u, R as d, S as f, Tt as p, V as m, _t as h, ct as g, h as _, it as v, lt as y, q as b, r as x, ut as S, x as C } from "./index-client-oI5R0J23.js";
import { t as w } from "./tokenize-BXqKILGH.js";
import { n as T, t as E } from "./path-BnQTIaez.js";
import { t as D } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_diff_added.js
var O = () => "Added", ee = ((e = {}, t = {}) => (t.locale ?? D(), O(e))), k = (e) => `Line ${e?.line}`, te = ((e, t = {}) => (t.locale ?? D(), k(e))), A = () => "Removed", ne = ((e = {}, t = {}) => (t.locale ?? D(), A(e))), re = a("<span></span>"), j = a("<p class=\"summary svelte-f664u\"> </p>"), M = a("<div class=\"fold svelte-f664u\"> </div>"), N = a("<span> </span>"), P = a("<div><span class=\"n svelte-f664u\"> </span><span class=\"n svelte-f664u\"> </span><span class=\"sign svelte-f664u\"> </span><code class=\"svelte-f664u\"></code></div>"), F = a("<button type=\"button\" class=\"all nodrag nopan svelte-f664u\"> </button>"), I = a("<section class=\"diff svelte-f664u\"><header class=\"svelte-f664u\"><p class=\"path svelte-f664u\"><span class=\"folder svelte-f664u\"> </span><span class=\"name svelte-f664u\"> </span></p> <p class=\"stat svelte-f664u\"><span class=\"added svelte-f664u\"> </span><span class=\"removed svelte-f664u\"> </span> <span class=\"blocks svelte-f664u\" aria-hidden=\"true\"></span></p></header> <!> <div class=\"hunks svelte-f664u\"></div> <!></section>");
function L(a, o) {
	n(o, !0);
	let D = x(o, "actions", 19, () => ({})), O = x(o, "centre", 3, !1), k = h(() => E(o.object.path)), A = h(() => o.object.hunks.reduce((e, t) => e + t.lines.filter((e) => e.op === "add").length, 0)), L = h(() => o.object.hunks.reduce((e, t) => e + t.lines.filter((e) => e.op === "del").length, 0)), R = h(() => {
		let e = u(A) + u(L);
		if (!e) return [];
		let t = Math.round(u(A) / e * 5);
		return Array.from({ length: 5 }, (e, n) => n < t ? "plus" : "minus");
	}), z = h(() => {
		let e = [];
		return o.object.hunks.forEach((t, n) => {
			(n > 0 || t.oldStart > 1) && e.push({
				kind: "hunk",
				at: t.newStart
			});
			let r = w(o.object.language, t.lines.map((e) => e.text).join("\n") + "\n"), i = t.oldStart, a = t.newStart;
			t.lines.forEach((t, n) => {
				e.push({
					kind: "line",
					op: t.op,
					old: t.op === "add" ? null : i++,
					new: t.op === "del" ? null : a++,
					tokens: r[n] ?? [{
						kind: "plain",
						text: t.text
					}]
				});
			});
		}), e;
	}), B = h(() => O() ? u(z) : u(z).slice(0, 24)), ie = h(() => String(Math.max(...o.object.hunks.map((e) => e.newStart + e.lines.length), 1)).length), V = h(() => u(z).filter((e) => e.kind === "line").length - u(B).filter((e) => e.kind === "line").length);
	var H = I(), U = g(H), W = g(U), G = g(W), ae = g(G, !0);
	l(G);
	var K = S(G), oe = g(K, !0);
	l(K), l(W);
	var q = S(W, 2), J = g(q), se = g(J);
	l(J);
	var Y = S(J), ce = g(Y);
	l(Y);
	var X = S(Y, 2);
	s(X, 21, () => u(R), c, (n, r) => {
		var i = re();
		v(() => f(i, 1, t(u(r)), "svelte-f664u")), e(n, i);
	}), l(X), l(q), l(U);
	var Z = S(U, 2), le = (t) => {
		var n = j(), r = g(n, !0);
		l(n), v(() => d(r, o.object.summary)), e(t, n);
	};
	r(Z, (e) => {
		o.object.summary && e(le);
	});
	var Q = S(Z, 2);
	let $;
	s(Q, 21, () => u(B), c, (n, a) => {
		var o = m(), p = y(o), h = (t) => {
			var n = M(), r = g(n, !0);
			l(n), v((e) => d(r, e), [() => te({ line: u(a).at })]), e(t, n);
		}, b = (n) => {
			var o = P(), p = g(o), h = g(p, !0);
			l(p);
			var b = S(p), x = g(b, !0);
			l(b);
			var C = S(b), w = g(C, !0);
			l(C);
			var T = S(C);
			s(T, 21, () => u(a).tokens, c, (n, a) => {
				var o = m(), s = y(o), c = (t) => {
					var n = i();
					v(() => d(n, u(a).text)), e(t, n);
				}, p = (n) => {
					var r = N(), i = g(r, !0);
					l(r), v(() => {
						f(r, 1, t(u(a).kind), "svelte-f664u"), d(i, u(a).text);
					}), e(n, r);
				};
				r(s, (e) => {
					u(a).kind === "plain" ? e(c) : e(p, -1);
				}), e(n, o);
			}), l(T), l(o), v((e) => {
				f(o, 1, `row ${u(a).op ?? ""}`, "svelte-f664u"), d(h, u(a).old ?? ""), d(x, u(a).new ?? ""), _(C, "aria-label", e), d(w, u(a).op === "add" ? "+" : u(a).op === "del" ? "−" : "");
			}, [() => u(a).op === "add" ? ee() : u(a).op === "del" ? ne() : void 0]), e(n, o);
		};
		r(p, (e) => {
			u(a).kind === "hunk" ? e(h) : e(b, -1);
		}), e(n, o);
	}), l(Q);
	var ue = S(Q, 2), de = (t) => {
		var n = F(), r = g(n, !0);
		l(n), v((e) => d(r, e), [() => T({ count: u(V) + 24 })]), b("click", n, () => D().open?.(o.object.id)), e(t, n);
	};
	r(ue, (e) => {
		u(V) > 0 && e(de);
	}), l(H), v(() => {
		_(H, "aria-label", o.object.path), d(ae, u(k).folder), d(oe, u(k).name), d(se, `+${u(A) ?? ""}`), d(ce, `−${u(L) ?? ""}`), $ = C(Q, "", $, { "--digits": u(ie) });
	}), e(a, H), p();
}
o(["click"]);
export { L as default };
