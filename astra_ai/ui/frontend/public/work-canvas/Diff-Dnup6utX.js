import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, C as n, Dt as r, F as i, Ft as a, G as o, H as s, K as c, M as l, N as u, Ot as d, R as f, S as p, V as m, dt as h, ft as g, h as _, ot as v, q as y, r as b, ut as x, x as S, yt as C } from "./index-client-C_2wYFnt.js";
import { i as w } from "./tokenize-CMy7L9WO.js";
import { n as T, t as E } from "./path-BnQTIaez.js";
import { t as D } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_diff_added.js
var O = () => "Added", ee = ((e = {}, t = {}) => (t.locale ?? D(), O(e))), k = (e) => `Line ${e?.line}`, te = ((e, t = {}) => (t.locale ?? D(), k(e))), A = () => "Removed", ne = ((e = {}, t = {}) => (t.locale ?? D(), A(e))), j = s("<span></span>"), M = s("<p class=\"summary svelte-f664u\"> </p>"), re = s("<div class=\"fold svelte-f664u\"> </div>"), ie = s("<span> </span>"), ae = s("<div><span class=\"n svelte-f664u\"> </span><span class=\"n svelte-f664u\"> </span><span class=\"sign svelte-f664u\"> </span><code class=\"svelte-f664u\"></code></div>"), oe = s("<button type=\"button\" class=\"all nodrag nopan svelte-f664u\"> </button>"), N = s("<section class=\"diff svelte-f664u\"><header class=\"svelte-f664u\"><p class=\"path svelte-f664u\"><span class=\"folder svelte-f664u\"> </span><span class=\"name svelte-f664u\"> </span></p> <p class=\"stat svelte-f664u\"><span class=\"added svelte-f664u\"> </span><span class=\"removed svelte-f664u\"> </span> <span class=\"blocks svelte-f664u\" aria-hidden=\"true\"></span></p></header> <!> <div class=\"hunks svelte-f664u\"></div> <!></section>");
function P(s, c) {
	d(c, !0);
	let D = b(c, "actions", 19, () => ({})), O = b(c, "centre", 3, !1), k = C(() => E(c.object.path)), A = C(() => c.object.hunks.reduce((e, t) => e + t.lines.filter((e) => e.op === "add").length, 0)), P = C(() => c.object.hunks.reduce((e, t) => e + t.lines.filter((e) => e.op === "del").length, 0)), F = C(() => {
		let t = e(A) + e(P);
		if (!t) return [];
		let n = Math.round(e(A) / t * 5);
		return Array.from({ length: 5 }, (e, t) => t < n ? "plus" : "minus");
	}), I = C(() => {
		let e = [];
		return c.object.hunks.forEach((t, n) => {
			(n > 0 || t.oldStart > 1) && e.push({
				kind: "hunk",
				at: t.newStart
			});
			let r = w(c.object.language, t.lines.map((e) => e.text).join("\n") + "\n"), i = t.oldStart, a = t.newStart;
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
	}), L = C(() => O() ? e(I) : e(I).slice(0, 24)), se = C(() => String(Math.max(...c.object.hunks.map((e) => e.newStart + e.lines.length), 1)).length), R = C(() => e(I).filter((e) => e.kind === "line").length - e(L).filter((e) => e.kind === "line").length);
	var z = N(), B = x(z), V = x(B), H = x(V), U = x(H, !0);
	a(H);
	var W = g(H), G = x(W, !0);
	a(W), a(V);
	var K = g(V, 2), q = x(K), ce = x(q);
	a(q);
	var J = g(q), le = x(J);
	a(J);
	var Y = g(J, 2);
	l(Y, 21, () => e(F), u, (r, i) => {
		var a = j();
		v(() => p(a, 1, n(e(i)), "svelte-f664u")), t(r, a);
	}), a(Y), a(K), a(B);
	var X = g(B, 2), Z = (e) => {
		var n = M(), r = x(n, !0);
		a(n), v(() => f(r, c.object.summary)), t(e, n);
	};
	i(X, (e) => {
		c.object.summary && e(Z);
	});
	var Q = g(X, 2);
	let $;
	l(Q, 21, () => e(L), u, (r, s) => {
		var c = m(), d = h(c), y = (n) => {
			var r = re(), i = x(r, !0);
			a(r), v((e) => f(i, e), [() => te({ line: e(s).at })]), t(n, r);
		}, b = (r) => {
			var c = ae(), d = x(c), y = x(d, !0);
			a(d);
			var b = g(d), S = x(b, !0);
			a(b);
			var C = g(b), w = x(C, !0);
			a(C);
			var T = g(C);
			l(T, 21, () => e(s).tokens, u, (r, s) => {
				var c = m(), l = h(c), u = (n) => {
					var r = o();
					v(() => f(r, e(s).text)), t(n, r);
				}, d = (r) => {
					var i = ie(), o = x(i, !0);
					a(i), v(() => {
						p(i, 1, n(e(s).kind), "svelte-f664u"), f(o, e(s).text);
					}), t(r, i);
				};
				i(l, (t) => {
					e(s).kind === "plain" ? t(u) : t(d, -1);
				}), t(r, c);
			}), a(T), a(c), v((t) => {
				p(c, 1, `row ${e(s).op ?? ""}`, "svelte-f664u"), f(y, e(s).old ?? ""), f(S, e(s).new ?? ""), _(C, "aria-label", t), f(w, e(s).op === "add" ? "+" : e(s).op === "del" ? "−" : "");
			}, [() => e(s).op === "add" ? ee() : e(s).op === "del" ? ne() : void 0]), t(r, c);
		};
		i(d, (t) => {
			e(s).kind === "hunk" ? t(y) : t(b, -1);
		}), t(r, c);
	}), a(Q);
	var ue = g(Q, 2), de = (n) => {
		var r = oe(), i = x(r, !0);
		a(r), v((e) => f(i, e), [() => T({ count: e(R) + 24 })]), y("click", r, () => D().open?.(c.object.id)), t(n, r);
	};
	i(ue, (t) => {
		e(R) > 0 && t(de);
	}), a(z), v(() => {
		_(z, "aria-label", c.object.path), f(U, e(k).folder), f(G, e(k).name), f(ce, `+${e(A) ?? ""}`), f(le, `−${e(P) ?? ""}`), $ = S(Q, "", $, { "--digits": e(se) });
	}), t(s, z), r();
}
c(["click"]);
export { P as default };
