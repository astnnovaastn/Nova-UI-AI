import "./disclose-version-7ONGmeVC.js";
import { B as e, C as t, Ct as n, F as r, H as i, J as a, L as o, Mt as s, P as c, S as l, U as u, W as d, X as f, Y as p, bt as m, h, ht as g, jt as _, lt as v, mt as y, pt as b, q as x, r as S, s as C, tt as w, vt as T, x as E, zt as D } from "./index-client-DH73-vTM.js";
import { n as O } from "./code-BgcBJO2A.js";
import { i as k } from "./tokenize-CMy7L9WO.js";
import { t as A } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_code_line.js
var j = (e) => `Line ${e?.line}`, M = ((e, t = {}) => (t.locale ?? A(), j(e))), N = (e) => `Lines ${e?.from}–${e?.to}`, P = ((e, t = {}) => (t.locale ?? A(), N(e))), F = () => "Notes", I = ((e = {}, t = {}) => (t.locale ?? A(), F(e))), L = d("<span> </span>"), R = d("<span class=\"note svelte-vldtnp\" role=\"note\"> </span>"), z = d("<span role=\"presentation\"><span class=\"n svelte-vldtnp\" aria-hidden=\"true\"> </span><!><!></span>"), B = d("<li><button type=\"button\" class=\"svelte-vldtnp\"><span class=\"range svelte-vldtnp\"> </span><span> </span></button></li>"), V = d("<ol class=\"rail svelte-vldtnp\"></ol>"), H = d("<div><pre class=\"svelte-vldtnp\"><code class=\"svelte-vldtnp\"></code></pre> <!></div>");
function U(a, d) {
	s(d, !0);
	let A = S(d, "notes", 19, () => []), j = S(d, "variant", 3, "card"), N = S(d, "start", 3, 1), F = n(() => k(d.language, d.text, d.limit)), U = n(() => O(A(), w(F).length)), W = m(void 0), G = m(void 0), K = m(void 0), q = (e) => e.from === e.to ? M({ line: e.from }) : P({
		from: e.from,
		to: e.to
	});
	function J(e) {
		T(G, e, !0), w(K)?.querySelector(`[data-line="${Math.max(1, A()[e]?.from ?? 1)}"]`)?.scrollIntoView({ block: "nearest" });
	}
	var Y = H();
	let X;
	var Z = b(Y), Q = b(Z);
	c(Q, 21, () => w(F), r, (a, s, d) => {
		let p = n(() => w(U)[d]);
		var m = z();
		let _;
		h(m, "data-line", d + 1);
		var S = b(m), C = b(S, !0);
		D(S);
		var E = g(S);
		c(E, 17, () => w(s), r, (n, r) => {
			var a = u(), s = y(a), c = (t) => {
				var n = x();
				v(() => e(n, w(r).text)), i(t, n);
			}, d = (n) => {
				var a = L(), o = b(a, !0);
				D(a), v(() => {
					l(a, 1, t(w(r).kind), "svelte-vldtnp"), e(o, w(r).text);
				}), i(n, a);
			};
			o(s, (e) => {
				w(r).kind === "plain" ? e(c) : e(d, -1);
			}), i(n, a);
		});
		var O = g(E), k = (t) => {
			var n = R(), r = b(n, !0);
			D(n), v(() => e(r, A()[w(p)].text)), i(t, n);
		}, M = n(() => j() === "card" && w(p) !== void 0 && w(p) === w(W) && d + 1 === Math.max(1, A()[w(p)].from));
		o(O, (e) => {
			w(M) && e(k);
		}), D(m), v(() => {
			_ = l(m, 1, "row svelte-vldtnp", null, _, {
				noted: w(p) !== void 0,
				lit: w(p) !== void 0 && w(p) === w(G)
			}), e(C, d + N());
		}), f("pointerenter", m, () => T(W, w(p), !0)), i(a, m);
	}), D(Q), D(Z), C(Z, (e) => T(K, e), () => w(K));
	var $ = g(Z, 2), ee = (t) => {
		var n = V();
		c(n, 21, A, r, (t, n, r) => {
			var a = B(), o = b(a), s = b(o), c = b(s, !0);
			D(s);
			var l = g(s), u = b(l, !0);
			D(l), D(o), D(a), v((t) => {
				h(o, "aria-pressed", w(G) === r), e(c, t), e(u, w(n).text);
			}, [() => q(w(n))]), p("click", o, () => J(r)), i(t, a);
		}), D(n), v((e) => h(n, "aria-label", e), [() => I()]), i(t, n);
	};
	o($, (e) => {
		j() === "lift" && A().length && e(ee);
	}), D(Y), v((e) => {
		l(Y, 1, `code ${j() ?? ""}`, "svelte-vldtnp"), X = E(Y, "", X, e), h(Z, "aria-label", d.label), h(Z, "tabindex", j() === "lift" ? 0 : void 0);
	}, [() => ({ "--digits": String(w(F).length + N() - 1).length })]), f("pointerleave", Z, () => T(W, void 0)), i(a, Y), _();
}
a(["click"]);
export { U as default };
