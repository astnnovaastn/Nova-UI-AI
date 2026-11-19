import "./disclose-version-7ONGmeVC.js";
import { B as e, C as t, Ct as n, F as r, H as i, J as a, L as o, Mt as s, P as c, S as l, U as u, W as d, Y as f, h as p, ht as m, jt as h, lt as g, mt as _, pt as v, q as ee, r as y, tt as b, x, zt as S } from "./index-client-DH73-vTM.js";
import { i as C } from "./tokenize-CMy7L9WO.js";
import { n as w, t as te } from "./path-BnQTIaez.js";
import { t as T } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_diff_added.js
var E = () => "Added", ne = ((e = {}, t = {}) => (t.locale ?? T(), E(e))), D = (e) => `Line ${e?.line}`, re = ((e, t = {}) => (t.locale ?? T(), D(e))), O = () => "Removed", ie = ((e = {}, t = {}) => (t.locale ?? T(), O(e))), k = d("<span></span>"), A = d("<p class=\"summary svelte-f664u\"> </p>"), j = d("<div class=\"fold svelte-f664u\"> </div>"), M = d("<span> </span>"), N = d("<div><span class=\"n svelte-f664u\"> </span><span class=\"n svelte-f664u\"> </span><span class=\"sign svelte-f664u\"> </span><code class=\"svelte-f664u\"></code></div>"), P = d("<button type=\"button\" class=\"all nodrag nopan svelte-f664u\"> </button>"), F = d("<section class=\"diff svelte-f664u\"><header class=\"svelte-f664u\"><p class=\"path svelte-f664u\"><span class=\"folder svelte-f664u\"> </span><span class=\"name svelte-f664u\"> </span></p> <p class=\"stat svelte-f664u\"><span class=\"added svelte-f664u\"> </span><span class=\"removed svelte-f664u\"> </span> <span class=\"blocks svelte-f664u\" aria-hidden=\"true\"></span></p></header> <!> <div class=\"hunks svelte-f664u\"></div> <!></section>");
function I(a, d) {
	s(d, !0);
	let T = y(d, "actions", 19, () => ({})), E = y(d, "centre", 3, !1), D = n(() => te(d.object.path)), O = n(() => d.object.hunks.reduce((e, t) => e + t.lines.filter((e) => e.op === "add").length, 0)), I = n(() => d.object.hunks.reduce((e, t) => e + t.lines.filter((e) => e.op === "del").length, 0)), L = n(() => {
		let e = b(O) + b(I);
		if (!e) return [];
		let t = Math.round(b(O) / e * 5);
		return Array.from({ length: 5 }, (e, n) => n < t ? "plus" : "minus");
	}), R = n(() => {
		let e = [];
		return d.object.hunks.forEach((t, n) => {
			(n > 0 || t.oldStart > 1) && e.push({
				kind: "hunk",
				at: t.newStart
			});
			let r = C(d.object.language, t.lines.map((e) => e.text).join("\n") + "\n"), i = t.oldStart, a = t.newStart;
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
	}), z = n(() => E() ? b(R) : b(R).slice(0, 24)), B = n(() => String(Math.max(...d.object.hunks.map((e) => e.newStart + e.lines.length), 1)).length), V = n(() => b(R).filter((e) => e.kind === "line").length - b(z).filter((e) => e.kind === "line").length);
	var H = F(), U = v(H), W = v(U), G = v(W), ae = v(G, !0);
	S(G);
	var K = m(G), oe = v(K, !0);
	S(K), S(W);
	var q = m(W, 2), J = v(q), se = v(J);
	S(J);
	var Y = m(J), ce = v(Y);
	S(Y);
	var X = m(Y, 2);
	c(X, 21, () => b(L), r, (e, n) => {
		var r = k();
		g(() => l(r, 1, t(b(n)), "svelte-f664u")), i(e, r);
	}), S(X), S(q), S(U);
	var Z = m(U, 2), le = (t) => {
		var n = A(), r = v(n, !0);
		S(n), g(() => e(r, d.object.summary)), i(t, n);
	};
	o(Z, (e) => {
		d.object.summary && e(le);
	});
	var Q = m(Z, 2);
	let $;
	c(Q, 21, () => b(z), r, (n, a) => {
		var s = u(), d = _(s), f = (t) => {
			var n = j(), r = v(n, !0);
			S(n), g((t) => e(r, t), [() => re({ line: b(a).at })]), i(t, n);
		}, h = (n) => {
			var s = N(), d = v(s), f = v(d, !0);
			S(d);
			var h = m(d), y = v(h, !0);
			S(h);
			var x = m(h), C = v(x, !0);
			S(x);
			var w = m(x);
			c(w, 21, () => b(a).tokens, r, (n, r) => {
				var a = u(), s = _(a), c = (t) => {
					var n = ee();
					g(() => e(n, b(r).text)), i(t, n);
				}, d = (n) => {
					var a = M(), o = v(a, !0);
					S(a), g(() => {
						l(a, 1, t(b(r).kind), "svelte-f664u"), e(o, b(r).text);
					}), i(n, a);
				};
				o(s, (e) => {
					b(r).kind === "plain" ? e(c) : e(d, -1);
				}), i(n, a);
			}), S(w), S(s), g((t) => {
				l(s, 1, `row ${b(a).op ?? ""}`, "svelte-f664u"), e(f, b(a).old ?? ""), e(y, b(a).new ?? ""), p(x, "aria-label", t), e(C, b(a).op === "add" ? "+" : b(a).op === "del" ? "−" : "");
			}, [() => b(a).op === "add" ? ne() : b(a).op === "del" ? ie() : void 0]), i(n, s);
		};
		o(d, (e) => {
			b(a).kind === "hunk" ? e(f) : e(h, -1);
		}), i(n, s);
	}), S(Q);
	var ue = m(Q, 2), de = (t) => {
		var n = P(), r = v(n, !0);
		S(n), g((t) => e(r, t), [() => w({ count: b(V) + 24 })]), f("click", n, () => T().open?.(d.object.id)), i(t, n);
	};
	o(ue, (e) => {
		b(V) > 0 && e(de);
	}), S(H), g(() => {
		p(H, "aria-label", d.object.path), e(ae, b(D).folder), e(oe, b(D).name), e(se, `+${b(O) ?? ""}`), e(ce, `−${b(I) ?? ""}`), $ = x(Q, "", $, { "--digits": b(B) });
	}), i(a, H), h();
}
a(["click"]);
export { I as default };
