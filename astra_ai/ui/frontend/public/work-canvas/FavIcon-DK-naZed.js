import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, F as r, Ft as i, H as a, Ot as o, S as s, _t as c, h as l, ht as u, ot as d, r as f, s as p, st as m, ut as h, x as g, yt as _ } from "./index-client-C_2wYFnt.js";
import { t as v } from "./Icon-E4BzZ4dm.js";
// upstream/src/shared/ui/FavIcon/FavIcon.svelte
var y = a("<span><canvas></canvas></span>"), b = a("<span class=\"favicon-fallback\"><!></span>"), x = a("<span class=\"favicon-blank\"></span>"), S = a("<span class=\"favicon\" data-favicon=\"\" aria-hidden=\"true\"><!></span>");
function C(a, C) {
	o(C, !0);
	let w = f(C, "tone", 3, "mid"), T = f(C, "loading", 3, !1), E = f(C, "size", 3, 17), D = f(C, "lit", 3, !1), O = f(C, "notched", 3, !1), k = c(void 0), A = _(() => Math.max(4, Math.round(E() * .28))), j = _(() => Math.max(1, Math.round(E() * .12)));
	m(() => {
		let t = C.image;
		t && e(k) && e(k).getContext("2d")?.putImageData(t, 0, 0);
	});
	var M = S();
	let N;
	var P = h(M), F = (n) => {
		var r = y();
		let a, o;
		var c = h(r);
		p(c, (e) => u(k, e), () => e(k)), i(r), d(() => {
			l(r, "data-tone", w()), a = s(r, 1, "favicon-plate", null, a, { "favicon-plate-lit": D() }), o = g(r, "", o, {
				"border-radius": `${e(A)}px`,
				"--favicon-inset": `${e(j)}px`
			}), l(c, "width", C.image.width), l(c, "height", C.image.height);
		}), t(n, r);
	}, I = (n) => {
		var r = b(), a = h(r);
		{
			let t = _(() => Math.round(E() * .85));
			v(a, {
				get icon() {
					return C.fallback;
				},
				get size() {
					return e(t);
				}
			});
		}
		i(r), t(n, r);
	}, L = (e) => {
		var n = x();
		t(e, n);
	};
	r(P, (e) => {
		C.image ? e(F) : C.fallback ? e(I, 1) : e(L, -1);
	}), i(M), d(() => {
		l(M, "data-loading", T()), l(M, "data-notched", O() || void 0), N = g(M, "", N, {
			width: `${E()}px`,
			height: `${E()}px`
		});
	}), t(a, M), n();
}
export { C as t };
