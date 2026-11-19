import { B as e, H as t, J as n, L as r, M as i, Mt as a, U as o, W as s, Wt as c, Y as l, bt as u, ht as d, jt as f, lt as p, mt as m, pt as h, tt as g, ut as _, vt as v, wt as y, xt as b, zt as x } from "./index-client-DH73-vTM.js";
import "./disclose-version-7ONGmeVC.js";
import { t as S } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/surface_retry.js
var C = () => "Try again", w = ((e = {}, t = {}) => (t.locale ?? S(), C(e))), T = s("<div class=\"failure svelte-f6ledx\" role=\"alert\"><p class=\"svelte-f6ledx\"> </p> <button type=\"button\" class=\"svelte-f6ledx\"> </button></div>");
function E(n, r) {
	a(r, !0);
	var s = o(), u = m(s);
	y(u, {
		onerror: () => r.onFailure?.(),
		failed: (n, i = c, a = c) => {
			var o = T(), s = h(o), u = h(s, !0);
			x(s);
			var f = d(s, 2), m = h(f, !0);
			x(f), x(o), p(() => {
				e(u, r.title), e(m, r.retryLabel);
			}), l("click", f, function(...e) {
				a()?.apply(this, e);
			}), t(n, o);
		}
	}, (e) => {
		var n = o(), a = m(n);
		i(a, () => r.children), t(e, n);
	}), t(n, s), f();
}
n(["click"]);
// upstream/src/shared/ui/LazyView/LazyView.svelte
var D = s("<div class=\"load-state svelte-i8ku5b\" role=\"alert\"><p class=\"svelte-i8ku5b\"> </p> <button type=\"button\" class=\"svelte-i8ku5b\"> </button></div>"), O = s("<div class=\"load-state svelte-i8ku5b\" role=\"status\"> </div>");
function k(n, s) {
	a(s, !0);
	let c = u(null), y = u(!1), S = u(0);
	_(() => {
		let e = s.loader;
		g(S);
		let t = !0;
		return v(c, null), v(y, !1), Promise.resolve().then(() => t ? e() : null).then((e) => {
			t && e && v(c, e.default);
		}, () => {
			t && v(y, !0);
		}), () => {
			t = !1;
		};
	});
	var C = o(), w = m(C), T = (n) => {
		var r = D(), i = h(r), a = h(i, !0);
		x(i);
		var o = d(i, 2), c = h(o, !0);
		x(o), x(r), p(() => {
			e(a, s.failureLabel), e(c, s.retryLabel);
		}), l("click", o, () => b(S)), t(n, r);
	}, k = (e) => {
		E(e, {
			get title() {
				return s.failureLabel;
			},
			get retryLabel() {
				return s.retryLabel;
			},
			children: (e, n) => {
				var r = o(), a = m(r);
				i(a, () => s.children, () => g(c)), t(e, r);
			},
			$$slots: { default: !0 }
		});
	}, A = (n) => {
		var r = O(), i = h(r, !0);
		x(r), p(() => e(i, s.loadingLabel)), t(n, r);
	};
	r(w, (e) => {
		g(y) ? e(T) : g(c) ? e(k, 1) : e(A, -1);
	}), t(n, C), f();
}
n(["click"]);
export { w as n, k as t };
