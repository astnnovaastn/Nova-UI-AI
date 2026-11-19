import "./disclose-version-7ONGmeVC.js";
import { Ct as e, H as t, L as n, Mt as r, U as i, W as a, bt as o, h as s, ht as c, j as l, jt as u, lt as d, mt as f, pt as p, r as m, s as h, tt as g, ut as _, vt as v, zt as y } from "./index-client-DH73-vTM.js";
import { t as b } from "./Chart-CQm0QC-e.js";
import { t as x } from "./Title-B4cGdolK.js";
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
	r(w, !0);
	let T = m(w, "centre", 3, !1), E = o(null), D = o(void 0), O = o(!1);
	_(() => g(D) ? S(g(D), (e) => v(O, e, !0)) : void 0), _(() => {
		if (!g(O) || g(E)) return;
		let e = !0;
		return b().then((t) => {
			e && v(E, t.default);
		}), () => e = !1;
	});
	let k = e(() => T() ? w.object.spec : {
		...w.object.spec,
		values: !1
	}), A = e(() => g(E));
	var j = C(), M = p(j), N = (e) => {
		x(e, { get text() {
			return w.object.title;
		} });
	};
	n(M, (e) => {
		w.object.title && e(N);
	});
	var P = c(M, 2), F = p(P), I = (n) => {
		var r = i(), a = f(r);
		{
			let t = e(() => w.object.title ?? "");
			l(a, () => g(A), (e, n) => {
				n(e, {
					get title() {
						return g(t);
					},
					get spec() {
						return g(k);
					}
				});
			});
		}
		t(n, r);
	};
	n(F, (e) => {
		g(O) && g(A) && e(I);
	}), y(P), y(j), h(j, (e) => v(D, e), () => g(D)), d(() => s(j, "aria-label", w.object.title)), t(a, j), u();
}
export { w as default };
