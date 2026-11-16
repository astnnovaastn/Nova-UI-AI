import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, F as r, Ft as i, H as a, Ot as o, V as s, _t as c, dt as l, ft as u, h as d, ht as f, k as p, ot as m, r as h, s as g, st as _, ut as v, yt as y } from "./index-client-C_2wYFnt.js";
import { t as b } from "./Chart-CDaCpqw7.js";
import { t as x } from "./Title-BF8NXEcN.js";
// upstream/src/features/work/components/objects/near.ts
function S(e, t) {
	let n = new IntersectionObserver((e) => {
		let n = e.at(-1);
		n && t(n.isIntersecting);
	}, { rootMargin: "100% 100%" });
	return n.observe(e), () => n.disconnect();
}
// upstream/src/features/work/components/objects/Plot.svelte
var C = a("<section class=\"plot svelte-11k24o6\"><!> <div class=\"figure svelte-11k24o6\"><!></div></section>");
function w(a, w) {
	o(w, !0);
	let T = h(w, "centre", 3, !1), E = c(null), D = c(void 0), O = c(!1);
	_(() => e(D) ? S(e(D), (e) => f(O, e, !0)) : void 0), _(() => {
		if (!e(O) || e(E)) return;
		let t = !0;
		return b().then((e) => {
			t && f(E, e.default);
		}), () => t = !1;
	});
	let k = y(() => T() ? w.object.spec : {
		...w.object.spec,
		values: !1
	}), A = y(() => e(E));
	var j = C(), M = v(j), N = (e) => {
		x(e, { get text() {
			return w.object.title;
		} });
	};
	r(M, (e) => {
		w.object.title && e(N);
	});
	var P = u(M, 2), F = v(P), I = (n) => {
		var r = s(), i = l(r);
		{
			let t = y(() => w.object.title ?? "");
			p(i, () => e(A), (n, r) => {
				r(n, {
					get title() {
						return e(t);
					},
					get spec() {
						return e(k);
					}
				});
			});
		}
		t(n, r);
	};
	r(F, (t) => {
		e(O) && e(A) && t(I);
	}), i(P), i(j), g(j, (e) => f(D, e), () => e(D)), m(() => d(j, "aria-label", w.object.title)), t(a, j), n();
}
export { w as default };
