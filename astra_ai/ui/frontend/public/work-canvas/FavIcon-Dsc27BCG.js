import "./disclose-version-7ONGmeVC.js";
import { Ct as e, H as t, L as n, Mt as r, S as i, W as a, bt as o, h as s, jt as c, lt as l, pt as u, r as d, s as f, tt as p, ut as m, vt as h, x as g, zt as _ } from "./index-client-DH73-vTM.js";
import { t as v } from "./Icon-D2j1Ej6Z.js";
// upstream/src/shared/ui/FavIcon/FavIcon.svelte
var y = a("<span><canvas></canvas></span>"), b = a("<span class=\"favicon-fallback\"><!></span>"), x = a("<span class=\"favicon-blank\"></span>"), S = a("<span class=\"favicon\" data-favicon=\"\" aria-hidden=\"true\"><!></span>");
function C(a, C) {
	r(C, !0);
	let w = d(C, "tone", 3, "mid"), T = d(C, "loading", 3, !1), E = d(C, "size", 3, 17), D = d(C, "lit", 3, !1), O = d(C, "notched", 3, !1), k = o(void 0), A = e(() => Math.max(4, Math.round(E() * .28))), j = e(() => Math.max(1, Math.round(E() * .12)));
	m(() => {
		let e = C.image;
		e && p(k) && p(k).getContext("2d")?.putImageData(e, 0, 0);
	});
	var M = S();
	let N;
	var P = u(M), F = (e) => {
		var n = y();
		let r, a;
		var o = u(n);
		f(o, (e) => h(k, e), () => p(k)), _(n), l(() => {
			s(n, "data-tone", w()), r = i(n, 1, "favicon-plate", null, r, { "favicon-plate-lit": D() }), a = g(n, "", a, {
				"border-radius": `${p(A)}px`,
				"--favicon-inset": `${p(j)}px`
			}), s(o, "width", C.image.width), s(o, "height", C.image.height);
		}), t(e, n);
	}, I = (n) => {
		var r = b(), i = u(r);
		{
			let t = e(() => Math.round(E() * .85));
			v(i, {
				get icon() {
					return C.fallback;
				},
				get size() {
					return p(t);
				}
			});
		}
		_(r), t(n, r);
	}, L = (e) => {
		var n = x();
		t(e, n);
	};
	n(P, (e) => {
		C.image ? e(F) : C.fallback ? e(I, 1) : e(L, -1);
	}), _(M), l(() => {
		s(M, "data-loading", T()), s(M, "data-notched", O() || void 0), N = g(M, "", N, {
			width: `${E()}px`,
			height: `${E()}px`
		});
	}), t(a, M), c();
}
export { C as t };
