import "./disclose-version-DFvUDwEH.js";
import { B as e, C as t, Et as n, F as r, G as i, H as a, J as o, K as s, M as c, N as l, Nt as u, Q as d, R as f, S as p, Tt as m, V as h, _t as g, ct as _, h as v, ht as y, it as b, lt as x, pt as S, q as C, r as w, s as T, ut as E, x as D } from "./index-client-oI5R0J23.js";
import { n as O } from "./code-BgcBJO2A.js";
import { t as k } from "./tokenize-BXqKILGH.js";
import { t as A } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_code_line.js
var j = (e) => `Line ${e?.line}`, M = ((e, t = {}) => (t.locale ?? A(), j(e))), N = (e) => `Lines ${e?.from}–${e?.to}`, P = ((e, t = {}) => (t.locale ?? A(), N(e))), F = () => "Notes", I = ((e = {}, t = {}) => (t.locale ?? A(), F(e))), L = a("<span> </span>"), R = a("<span class=\"note svelte-vldtnp\" role=\"note\"> </span>"), z = a("<span role=\"presentation\"><span class=\"n svelte-vldtnp\" aria-hidden=\"true\"> </span><!><!></span>"), B = a("<li><button type=\"button\" class=\"svelte-vldtnp\"><span class=\"range svelte-vldtnp\"> </span><span> </span></button></li>"), V = a("<ol class=\"rail svelte-vldtnp\"></ol>"), H = a("<div><pre class=\"svelte-vldtnp\"><code class=\"svelte-vldtnp\"></code></pre> <!></div>");
function U(a, s) {
	n(s, !0);
	let A = w(s, "notes", 19, () => []), j = w(s, "variant", 3, "card"), N = w(s, "start", 3, 1), F = g(() => k(s.language, s.text, s.limit)), U = g(() => O(A(), d(F).length)), W = y(void 0), G = y(void 0), K = y(void 0), q = (e) => e.from === e.to ? M({ line: e.from }) : P({
		from: e.from,
		to: e.to
	});
	function J(e) {
		S(G, e, !0), d(K)?.querySelector(`[data-line="${Math.max(1, A()[e]?.from ?? 1)}"]`)?.scrollIntoView({ block: "nearest" });
	}
	var Y = H();
	let X;
	var Z = _(Y), Q = _(Z);
	c(Q, 21, () => d(F), l, (n, a, s) => {
		let m = g(() => d(U)[s]);
		var y = z();
		let C;
		v(y, "data-line", s + 1);
		var w = _(y), T = _(w, !0);
		u(w);
		var D = E(w);
		c(D, 17, () => d(a), l, (n, a) => {
			var o = h(), s = x(o), c = (t) => {
				var n = i();
				b(() => f(n, d(a).text)), e(t, n);
			}, l = (n) => {
				var r = L(), i = _(r, !0);
				u(r), b(() => {
					p(r, 1, t(d(a).kind), "svelte-vldtnp"), f(i, d(a).text);
				}), e(n, r);
			};
			r(s, (e) => {
				d(a).kind === "plain" ? e(c) : e(l, -1);
			}), e(n, o);
		});
		var O = E(D), k = (t) => {
			var n = R(), r = _(n, !0);
			u(n), b(() => f(r, A()[d(m)].text)), e(t, n);
		}, M = g(() => j() === "card" && d(m) !== void 0 && d(m) === d(W) && s + 1 === Math.max(1, A()[d(m)].from));
		r(O, (e) => {
			d(M) && e(k);
		}), u(y), b(() => {
			C = p(y, 1, "row svelte-vldtnp", null, C, {
				noted: d(m) !== void 0,
				lit: d(m) !== void 0 && d(m) === d(G)
			}), f(T, s + N());
		}), o("pointerenter", y, () => S(W, d(m), !0)), e(n, y);
	}), u(Q), u(Z), T(Z, (e) => S(K, e), () => d(K));
	var $ = E(Z, 2), ee = (t) => {
		var n = V();
		c(n, 21, A, l, (t, n, r) => {
			var i = B(), a = _(i), o = _(a), s = _(o, !0);
			u(o);
			var c = E(o), l = _(c, !0);
			u(c), u(a), u(i), b((e) => {
				v(a, "aria-pressed", d(G) === r), f(s, e), f(l, d(n).text);
			}, [() => q(d(n))]), C("click", a, () => J(r)), e(t, i);
		}), u(n), b((e) => v(n, "aria-label", e), [() => I()]), e(t, n);
	};
	r($, (e) => {
		j() === "lift" && A().length && e(ee);
	}), u(Y), b((e) => {
		p(Y, 1, `code ${j() ?? ""}`, "svelte-vldtnp"), X = D(Y, "", X, e), v(Z, "aria-label", s.label), v(Z, "tabindex", j() === "lift" ? 0 : void 0);
	}, [() => ({ "--digits": String(d(F).length + N() - 1).length })]), o("pointerleave", Z, () => S(W, void 0)), e(a, Y), m();
}
s(["click"]);
export { U as default };
