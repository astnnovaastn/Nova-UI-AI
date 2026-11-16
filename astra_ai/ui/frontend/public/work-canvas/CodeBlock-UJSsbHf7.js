import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, C as n, Dt as r, F as i, Ft as a, G as o, H as s, J as c, K as l, M as u, N as d, Ot as f, R as p, S as m, V as h, _t as g, dt as _, ft as v, h as y, ht as b, ot as x, q as S, r as C, s as w, ut as T, x as E, yt as D } from "./index-client-C_2wYFnt.js";
import { n as O } from "./code-BgcBJO2A.js";
import { i as k } from "./tokenize-CMy7L9WO.js";
import { t as A } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_code_line.js
var j = (e) => `Line ${e?.line}`, M = ((e, t = {}) => (t.locale ?? A(), j(e))), N = (e) => `Lines ${e?.from}–${e?.to}`, P = ((e, t = {}) => (t.locale ?? A(), N(e))), F = () => "Notes", I = ((e = {}, t = {}) => (t.locale ?? A(), F(e))), L = s("<span> </span>"), R = s("<span class=\"note svelte-vldtnp\" role=\"note\"> </span>"), z = s("<span role=\"presentation\"><span class=\"n svelte-vldtnp\" aria-hidden=\"true\"> </span><!><!></span>"), B = s("<li><button type=\"button\" class=\"svelte-vldtnp\"><span class=\"range svelte-vldtnp\"> </span><span> </span></button></li>"), V = s("<ol class=\"rail svelte-vldtnp\"></ol>"), H = s("<div><pre class=\"svelte-vldtnp\"><code class=\"svelte-vldtnp\"></code></pre> <!></div>");
function U(s, l) {
	f(l, !0);
	let A = C(l, "notes", 19, () => []), j = C(l, "variant", 3, "card"), N = C(l, "start", 3, 1), F = D(() => k(l.language, l.text, l.limit)), U = D(() => O(A(), e(F).length)), W = g(void 0), G = g(void 0), K = g(void 0), q = (e) => e.from === e.to ? M({ line: e.from }) : P({
		from: e.from,
		to: e.to
	});
	function J(t) {
		b(G, t, !0), e(K)?.querySelector(`[data-line="${Math.max(1, A()[t]?.from ?? 1)}"]`)?.scrollIntoView({ block: "nearest" });
	}
	var Y = H();
	let X;
	var Z = T(Y), Q = T(Z);
	u(Q, 21, () => e(F), d, (r, s, l) => {
		let f = D(() => e(U)[l]);
		var g = z();
		let S;
		y(g, "data-line", l + 1);
		var C = T(g), w = T(C, !0);
		a(C);
		var E = v(C);
		u(E, 17, () => e(s), d, (r, s) => {
			var c = h(), l = _(c), u = (n) => {
				var r = o();
				x(() => p(r, e(s).text)), t(n, r);
			}, d = (r) => {
				var i = L(), o = T(i, !0);
				a(i), x(() => {
					m(i, 1, n(e(s).kind), "svelte-vldtnp"), p(o, e(s).text);
				}), t(r, i);
			};
			i(l, (t) => {
				e(s).kind === "plain" ? t(u) : t(d, -1);
			}), t(r, c);
		});
		var O = v(E), k = (n) => {
			var r = R(), i = T(r, !0);
			a(r), x(() => p(i, A()[e(f)].text)), t(n, r);
		}, M = D(() => j() === "card" && e(f) !== void 0 && e(f) === e(W) && l + 1 === Math.max(1, A()[e(f)].from));
		i(O, (t) => {
			e(M) && t(k);
		}), a(g), x(() => {
			S = m(g, 1, "row svelte-vldtnp", null, S, {
				noted: e(f) !== void 0,
				lit: e(f) !== void 0 && e(f) === e(G)
			}), p(w, l + N());
		}), c("pointerenter", g, () => b(W, e(f), !0)), t(r, g);
	}), a(Q), a(Z), w(Z, (e) => b(K, e), () => e(K));
	var $ = v(Z, 2), ee = (n) => {
		var r = V();
		u(r, 21, A, d, (n, r, i) => {
			var o = B(), s = T(o), c = T(s), l = T(c, !0);
			a(c);
			var u = v(c), d = T(u, !0);
			a(u), a(s), a(o), x((t) => {
				y(s, "aria-pressed", e(G) === i), p(l, t), p(d, e(r).text);
			}, [() => q(e(r))]), S("click", s, () => J(i)), t(n, o);
		}), a(r), x((e) => y(r, "aria-label", e), [() => I()]), t(n, r);
	};
	i($, (e) => {
		j() === "lift" && A().length && e(ee);
	}), a(Y), x((e) => {
		m(Y, 1, `code ${j() ?? ""}`, "svelte-vldtnp"), X = E(Y, "", X, e), y(Z, "aria-label", l.label), y(Z, "tabindex", j() === "lift" ? 0 : void 0);
	}, [() => ({ "--digits": String(e(F).length + N() - 1).length })]), c("pointerleave", Z, () => b(W, void 0)), t(s, Y), r();
}
l(["click"]);
export { U as default };
