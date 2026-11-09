import "./disclose-version-DFvUDwEH.js";
import { At as e, Ct as t, E as n, L as r, M as i, R as a, St as o, Y as s, at as c, ft as l, m as u, mt as d, nt as f, ot as p, r as m, s as h, st as g, tt as _, ut as v, z as y } from "./index-client-BSGo5gVb.js";
import { t as b } from "./Chart-BkEtEoB0.js";
import { t as x } from "./Title-3U-zV-ZX.js";
// upstream/src/features/work/components/objects/near.ts
function S(e, t) {
	let n = new IntersectionObserver((e) => {
		let n = e.at(-1);
		n && t(n.isIntersecting);
	}, { rootMargin: "100% 100%" });
	return n.observe(e), () => n.disconnect();
}
// upstream/src/features/work/components/objects/Plot.svelte
var C = y("<section class=\"plot svelte-11k24o6\"><!> <div class=\"figure svelte-11k24o6\"><!></div></section>");
function w(y, w) {
	t(w, !0);
	let T = m(w, "centre", 3, !1), E = l(null), D = l(void 0), O = l(!1);
	f(() => s(D) ? S(s(D), (e) => v(O, e, !0)) : void 0), f(() => {
		if (!s(O) || s(E)) return;
		let e = !0;
		return b().then((t) => {
			e && v(E, t.default);
		}), () => e = !1;
	});
	let k = d(() => T() ? w.object.spec : {
		...w.object.spec,
		values: !1
	}), A = d(() => s(E));
	var j = C(), M = c(j), N = (e) => {
		x(e, { get text() {
			return w.object.title;
		} });
	};
	i(M, (e) => {
		w.object.title && e(N);
	});
	var P = g(M, 2), F = c(P), I = (e) => {
		var t = a(), i = p(t);
		{
			let e = d(() => w.object.title ?? "");
			n(i, () => s(A), (t, n) => {
				n(t, {
					get title() {
						return s(e);
					},
					get spec() {
						return s(k);
					}
				});
			});
		}
		r(e, t);
	};
	i(F, (e) => {
		s(O) && s(A) && e(I);
	}), e(P), e(j), h(j, (e) => v(D, e), () => s(D)), _(() => u(j, "aria-label", w.object.title)), r(y, j), o();
}
export { w as default };
