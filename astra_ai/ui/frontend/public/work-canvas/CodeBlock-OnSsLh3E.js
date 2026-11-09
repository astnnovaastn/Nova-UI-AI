import "./disclose-version-DFvUDwEH.js";
import { A as e, At as t, Ct as n, F as r, G as i, H as a, L as o, M as s, R as c, St as l, U as u, W as d, Y as f, at as p, b as m, ft as h, k as g, m as _, mt as v, ot as y, r as b, s as x, st as S, tt as C, ut as w, v as T, y as E, z as D } from "./index-client-BSGo5gVb.js";
import { n as O } from "./code-BgcBJO2A.js";
import { t as k } from "./tokenize-BXqKILGH.js";
import { t as A } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_code_line.js
var j = (e) => `Line ${e?.line}`, M = ((e, t = {}) => (t.locale ?? A(), j(e))), N = (e) => `Lines ${e?.from}–${e?.to}`, P = ((e, t = {}) => (t.locale ?? A(), N(e))), F = () => "Notes", I = ((e = {}, t = {}) => (t.locale ?? A(), F(e))), L = D("<span> </span>"), R = D("<span class=\"note svelte-vldtnp\" role=\"note\"> </span>"), z = D("<span role=\"presentation\"><span class=\"n svelte-vldtnp\" aria-hidden=\"true\"> </span><!><!></span>"), B = D("<li><button type=\"button\" class=\"svelte-vldtnp\"><span class=\"range svelte-vldtnp\"> </span><span> </span></button></li>"), V = D("<ol class=\"rail svelte-vldtnp\"></ol>"), H = D("<div><pre class=\"svelte-vldtnp\"><code class=\"svelte-vldtnp\"></code></pre> <!></div>");
function U(u, D) {
	n(D, !0);
	let A = b(D, "notes", 19, () => []), j = b(D, "variant", 3, "card"), N = b(D, "start", 3, 1), F = v(() => k(D.language, D.text, D.limit)), U = v(() => O(A(), f(F).length)), W = h(void 0), G = h(void 0), K = h(void 0), q = (e) => e.from === e.to ? M({ line: e.from }) : P({
		from: e.from,
		to: e.to
	});
	function J(e) {
		w(G, e, !0), f(K)?.querySelector(`[data-line="${Math.max(1, A()[e]?.from ?? 1)}"]`)?.scrollIntoView({ block: "nearest" });
	}
	var Y = H();
	let X;
	var Z = p(Y), Q = p(Z);
	g(Q, 21, () => f(F), e, (n, l, u) => {
		let d = v(() => f(U)[u]);
		var h = z();
		let b;
		_(h, "data-line", u + 1);
		var x = p(h), T = p(x, !0);
		t(x);
		var D = S(x);
		g(D, 17, () => f(l), e, (e, n) => {
			var i = c(), l = y(i), u = (e) => {
				var t = a();
				C(() => r(t, f(n).text)), o(e, t);
			}, d = (e) => {
				var i = L(), a = p(i, !0);
				t(i), C(() => {
					E(i, 1, m(f(n).kind), "svelte-vldtnp"), r(a, f(n).text);
				}), o(e, i);
			};
			s(l, (e) => {
				f(n).kind === "plain" ? e(u) : e(d, -1);
			}), o(e, i);
		});
		var O = S(D), k = (e) => {
			var n = R(), i = p(n, !0);
			t(n), C(() => r(i, A()[f(d)].text)), o(e, n);
		}, M = v(() => j() === "card" && f(d) !== void 0 && f(d) === f(W) && u + 1 === Math.max(1, A()[f(d)].from));
		s(O, (e) => {
			f(M) && e(k);
		}), t(h), C(() => {
			b = E(h, 1, "row svelte-vldtnp", null, b, {
				noted: f(d) !== void 0,
				lit: f(d) !== void 0 && f(d) === f(G)
			}), r(T, u + N());
		}), i("pointerenter", h, () => w(W, f(d), !0)), o(n, h);
	}), t(Q), t(Z), x(Z, (e) => w(K, e), () => f(K));
	var $ = S(Z, 2), ee = (n) => {
		var i = V();
		g(i, 21, A, e, (e, n, i) => {
			var a = B(), s = p(a), c = p(s), l = p(c, !0);
			t(c);
			var u = S(c), m = p(u, !0);
			t(u), t(s), t(a), C((e) => {
				_(s, "aria-pressed", f(G) === i), r(l, e), r(m, f(n).text);
			}, [() => q(f(n))]), d("click", s, () => J(i)), o(e, a);
		}), t(i), C((e) => _(i, "aria-label", e), [() => I()]), o(n, i);
	};
	s($, (e) => {
		j() === "lift" && A().length && e(ee);
	}), t(Y), C((e) => {
		E(Y, 1, `code ${j() ?? ""}`, "svelte-vldtnp"), X = T(Y, "", X, e), _(Z, "aria-label", D.label), _(Z, "tabindex", j() === "lift" ? 0 : void 0);
	}, [() => ({ "--digits": String(f(F).length + N() - 1).length })]), i("pointerleave", Z, () => w(W, void 0)), o(u, Y), l();
}
u(["click"]);
export { U as default };
