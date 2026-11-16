import { $ as e, A as t, B as n, Dt as r, F as i, Ft as a, H as o, K as s, Ot as c, R as l, Rt as u, V as d, _t as f, bt as p, dt as m, ft as h, ht as g, ot as _, q as v, st as y, ut as b, vt as x } from "./index-client-C_2wYFnt.js";
import "./disclose-version-DFvUDwEH.js";
import { t as S } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/surface_retry.js
var C = () => "Try again", w = ((e = {}, t = {}) => (t.locale ?? S(), C(e))), T = o("<div class=\"failure svelte-f6ledx\" role=\"alert\"><p class=\"svelte-f6ledx\"> </p> <button type=\"button\" class=\"svelte-f6ledx\"> </button></div>");
function E(e, i) {
	c(i, !0);
	var o = d(), s = m(o);
	p(s, {
		onerror: () => i.onFailure?.(),
		failed: (e, t = u, r = u) => {
			var o = T(), s = b(o), c = b(s, !0);
			a(s);
			var d = h(s, 2), f = b(d, !0);
			a(d), a(o), _(() => {
				l(c, i.title), l(f, i.retryLabel);
			}), v("click", d, function(...e) {
				r()?.apply(this, e);
			}), n(e, o);
		}
	}, (e) => {
		var r = d(), a = m(r);
		t(a, () => i.children), n(e, r);
	}), n(e, o), r();
}
s(["click"]);
// upstream/src/shared/ui/LazyView/LazyView.svelte
var D = o("<div class=\"load-state svelte-i8ku5b\" role=\"alert\"><p class=\"svelte-i8ku5b\"> </p> <button type=\"button\" class=\"svelte-i8ku5b\"> </button></div>"), O = o("<div class=\"load-state svelte-i8ku5b\" role=\"status\"> </div>");
function k(o, s) {
	c(s, !0);
	let u = f(null), p = f(!1), S = f(0);
	y(() => {
		let t = s.loader;
		e(S);
		let n = !0;
		return g(u, null), g(p, !1), Promise.resolve().then(() => n ? t() : null).then((e) => {
			n && e && g(u, e.default);
		}, () => {
			n && g(p, !0);
		}), () => {
			n = !1;
		};
	});
	var C = d(), w = m(C), T = (e) => {
		var t = D(), r = b(t), i = b(r, !0);
		a(r);
		var o = h(r, 2), c = b(o, !0);
		a(o), a(t), _(() => {
			l(i, s.failureLabel), l(c, s.retryLabel);
		}), v("click", o, () => x(S)), n(e, t);
	}, k = (r) => {
		E(r, {
			get title() {
				return s.failureLabel;
			},
			get retryLabel() {
				return s.retryLabel;
			},
			children: (r, i) => {
				var a = d(), o = m(a);
				t(o, () => s.children, () => e(u)), n(r, a);
			},
			$$slots: { default: !0 }
		});
	}, A = (e) => {
		var t = O(), r = b(t, !0);
		a(t), _(() => l(r, s.loadingLabel)), n(e, t);
	};
	i(w, (t) => {
		e(p) ? t(T) : e(u) ? t(k, 1) : t(A, -1);
	}), n(o, C), r();
}
s(["click"]);
export { w as n, k as t };
