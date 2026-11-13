import "./disclose-version-DFvUDwEH.js";
import { B as e, Et as t, F as n, H as r, Nt as i, Q as a, Tt as o, V as s, _t as c, at as l, ct as u, h as d, ht as f, it as p, k as m, lt as h, pt as g, r as _, s as v, ut as y } from "./index-client-oI5R0J23.js";
import { t as b } from "./Chart-BGTbUTBH.js";
import { t as x } from "./Title-DCqcKCqa.js";
// upstream/src/features/work/components/objects/near.ts
function S(e, t) {
	let n = new IntersectionObserver((e) => {
		let n = e.at(-1);
		n && t(n.isIntersecting);
	}, { rootMargin: "100% 100%" });
	return n.observe(e), () => n.disconnect();
}
// upstream/src/features/work/components/objects/Plot.svelte
var C = r("<section class=\"plot svelte-11k24o6\"><!> <div class=\"figure svelte-11k24o6\"><!></div></section>");
function w(r, w) {
	t(w, !0);
	let T = _(w, "centre", 3, !1), E = f(null), D = f(void 0), O = f(!1);
	l(() => a(D) ? S(a(D), (e) => g(O, e, !0)) : void 0), l(() => {
		if (!a(O) || a(E)) return;
		let e = !0;
		return b().then((t) => {
			e && g(E, t.default);
		}), () => e = !1;
	});
	let k = c(() => T() ? w.object.spec : {
		...w.object.spec,
		values: !1
	}), A = c(() => a(E));
	var j = C(), M = u(j), N = (e) => {
		x(e, { get text() {
			return w.object.title;
		} });
	};
	n(M, (e) => {
		w.object.title && e(N);
	});
	var P = y(M, 2), F = u(P), I = (t) => {
		var n = s(), r = h(n);
		{
			let e = c(() => w.object.title ?? "");
			m(r, () => a(A), (t, n) => {
				n(t, {
					get title() {
						return a(e);
					},
					get spec() {
						return a(k);
					}
				});
			});
		}
		e(t, n);
	};
	n(F, (e) => {
		a(O) && a(A) && e(I);
	}), i(P), i(j), v(j, (e) => g(D, e), () => a(D)), p(() => d(j, "aria-label", w.object.title)), e(r, j), o();
}
export { w as default };
