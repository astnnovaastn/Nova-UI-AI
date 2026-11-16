import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, E as r, F as i, Ft as a, H as o, K as s, Ot as c, P as l, R as u, V as d, _t as f, ct as p, dt as m, ft as h, h as g, ht as _, nt as v, ot as y, q as b, s as x, ut as S, yt as C } from "./index-client-C_2wYFnt.js";
import { t as w } from "./Icon-E4BzZ4dm.js";
import { o as T } from "./virtual-window.svelte-Bs1fcVaT.js";
import { t as E } from "./Note01Icon-QzbyZ_eL.js";
import { t as D } from "./Search01Icon-BdltxnVJ.js";
import { t as O } from "./PencilEdit02Icon-CYZk_3O1.js";
import { C as k, S as A, d as ee, f as te, h as j, i as M, m as N, n as P, p as F, r as I, t as L, w as R, x as z, y as B } from "./enter-Du7ujkcZ.js";
// upstream/src/features/notes/components/Notes.svelte
var V = o("<div class=\"note-scroll svelte-g1q2nz\"><!></div>"), H = o("<button type=\"button\" class=\"new-note svelte-g1q2nz\"><!><span> </span></button>"), U = o("<div class=\"notes-empty svelte-g1q2nz\"><span class=\"empty-icon svelte-g1q2nz\"><!></span> <h3 class=\"svelte-g1q2nz\"> </h3> <p class=\"svelte-g1q2nz\"> </p> <button type=\"button\" class=\"empty-action svelte-g1q2nz\"> </button></div>"), W = o("<span class=\"empty-icon svelte-g1q2nz\"><!></span> <h3 class=\"svelte-g1q2nz\"> </h3> <p class=\"svelte-g1q2nz\"> </p>", 1), G = o("<div class=\"notes-empty svelte-g1q2nz\"><!></div>"), K = o("<div class=\"notes-list svelte-g1q2nz\"><!> <!></div>"), q = o("<div class=\"notes svelte-g1q2nz\" data-note-bounds=\"\"><!> <!></div>");
function J(o, s) {
	c(s, !0);
	let J = C(() => s.session.note !== null), Y = f(null), X = v(() => e(J));
	p(() => {
		e(J) !== X && _(Y, e(J) ? "forward" : "back", !0), X = e(J);
	});
	let Z = f(void 0);
	function ne() {
		e(Z)?.querySelector(".note-document")?.focus();
	}
	var Q = q(), $ = S(Q), re = (n) => {
		var i = d(), o = m(i);
		l(o, () => s.session.note.version, (n) => {
			var i = V(), o = S(i);
			I(o, {
				get session() {
					return s.session;
				},
				density: "panel",
				autofocus: !0
			}), a(i), x(i, (e) => _(Z, e), () => e(Z)), r(i, (e, t) => L?.(e, t), () => e(Y)), t(n, i);
		}), t(n, i);
	}, ie = (n) => {
		var o = K(), c = S(o), l = (e) => {
			var n = H(), r = S(n);
			w(r, {
				get icon() {
					return O;
				},
				size: 16
			});
			var i = h(r), o = S(i, !0);
			a(i), a(n), y((e) => u(o, e), [() => B()]), b("click", n, () => void s.session.create()), t(e, n);
		};
		i(c, (e) => {
			s.session.trash || e(l);
		});
		var d = h(c, 2), f = (e) => {
			var n = U(), r = S(n), i = S(r);
			w(i, {
				get icon() {
					return E;
				},
				size: 22
			}), a(r);
			var o = h(r, 2), c = S(o, !0);
			a(o);
			var l = h(o, 2), d = S(l, !0);
			a(l);
			var f = h(l, 2), p = S(f, !0);
			a(f), a(n), y((e, t, n) => {
				u(c, e), u(d, t), u(p, n);
			}, [
				() => te(),
				() => ee(),
				() => F()
			]), b("click", f, () => void s.session.reload()), t(e, n);
		}, p = (n) => {
			var r = G(), o = S(r), c = (e) => {
				var n = W(), r = m(n), i = S(r);
				w(i, {
					get icon() {
						return D;
					},
					size: 22
				}), a(r);
				var o = h(r, 2), s = S(o, !0);
				a(o);
				var c = h(o, 2), l = S(c, !0);
				a(c), y((e, t) => {
					u(s, e), u(l, t);
				}, [() => k(), () => A()]), t(e, n);
			}, l = C(() => s.session.query.trim()), d = (e) => {
				var n = W(), r = m(n), i = S(r);
				w(i, {
					get icon() {
						return T;
					},
					size: 22
				}), a(r);
				var o = h(r, 2), s = S(o, !0);
				a(o);
				var c = h(o, 2), l = S(c, !0);
				a(c), y((e, t) => {
					u(s, e), u(l, t);
				}, [() => j(), () => N()]), t(e, n);
			}, f = (e) => {
				var n = W(), r = m(n), i = S(r);
				w(i, {
					get icon() {
						return E;
					},
					size: 22
				}), a(r);
				var o = h(r, 2), s = S(o, !0);
				a(o);
				var c = h(o, 2), l = S(c, !0);
				a(c), y((e, t) => {
					u(s, e), u(l, t);
				}, [() => z(), () => R()]), t(e, n);
			};
			i(o, (t) => {
				e(l) ? t(c) : s.session.trash ? t(d, 1) : t(f, -1);
			}), a(r), t(n, r);
		}, g = (e) => {
			M(e, {
				get session() {
					return s.session;
				},
				density: "panel",
				onopen: (e) => void s.session.open(e),
				onedit: ne
			});
		};
		i(d, (e) => {
			s.session.error && !s.session.items.length ? e(f) : s.session.loaded && !s.session.items.length ? e(p, 1) : e(g, -1);
		}), a(o), r(o, (e, t) => L?.(e, t), () => e(Y)), t(n, o);
	};
	i($, (e) => {
		s.session.note ? e(re) : e(ie, -1);
	});
	var ae = h($, 2);
	P(ae, { get session() {
		return s.session;
	} }), a(Q), y(() => g(Q, "data-view", e(J) ? "note" : "list")), t(o, Q), n();
}
s(["click"]);
export { J as default };
