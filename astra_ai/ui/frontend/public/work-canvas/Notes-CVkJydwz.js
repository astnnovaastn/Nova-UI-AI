import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, E as n, H as r, I as i, J as a, L as o, Mt as s, U as c, W as l, Y as u, bt as d, dt as f, h as p, ht as m, it as h, jt as g, lt as _, mt as v, pt as y, s as b, tt as x, vt as S, zt as C } from "./index-client-DH73-vTM.js";
import { t as w } from "./Icon-D2j1Ej6Z.js";
import "./Icon-CmjKIKuh.js";
import { t as T } from "./Delete02Icon-Z8r1VIoL.js";
import { t as E } from "./Note01Icon-CJbrtVD1.js";
import { t as D } from "./Search01Icon-BQoE0w_i.js";
import { t as O } from "./PencilEdit02Icon-C35CFL3M.js";
import { C as k, S as A, f as ee, h as te, i as j, m as M, n as N, p as P, r as F, t as I, w as L, x as R, y as z } from "./enter-DVQzselG.js";
import { t as B } from "./note_unavailable-RzqiZctH.js";
// upstream/src/features/notes/components/Notes.svelte
var V = l("<div class=\"note-scroll svelte-g1q2nz\"><!></div>"), H = l("<button type=\"button\" class=\"new-note svelte-g1q2nz\"><!><span> </span></button>"), U = l("<div class=\"notes-empty svelte-g1q2nz\"><span class=\"empty-icon svelte-g1q2nz\"><!></span> <h3 class=\"svelte-g1q2nz\"> </h3> <p class=\"svelte-g1q2nz\"> </p> <button type=\"button\" class=\"empty-action svelte-g1q2nz\"> </button></div>"), W = l("<span class=\"empty-icon svelte-g1q2nz\"><!></span> <h3 class=\"svelte-g1q2nz\"> </h3> <p class=\"svelte-g1q2nz\"> </p>", 1), G = l("<div class=\"notes-empty svelte-g1q2nz\"><!></div>"), K = l("<div class=\"notes-list svelte-g1q2nz\"><!> <!></div>"), q = l("<div class=\"notes svelte-g1q2nz\" data-note-bounds=\"\"><!> <!></div>");
function J(a, l) {
	s(l, !0);
	let J = t(() => l.session.note !== null), Y = d(null), X = h(() => x(J));
	f(() => {
		x(J) !== X && S(Y, x(J) ? "forward" : "back", !0), X = x(J);
	});
	let Z = d(void 0);
	function ne() {
		x(Z)?.querySelector(".note-document")?.focus();
	}
	var Q = q(), $ = y(Q), re = (e) => {
		var t = c(), a = v(t);
		i(a, () => l.session.note.version, (e) => {
			var t = V(), i = y(t);
			F(i, {
				get session() {
					return l.session;
				},
				density: "panel",
				autofocus: !0
			}), C(t), b(t, (e) => S(Z, e), () => x(Z)), n(t, (e, t) => I?.(e, t), () => x(Y)), r(e, t);
		}), r(e, t);
	}, ie = (i) => {
		var a = K(), s = y(a), c = (t) => {
			var n = H(), i = y(n);
			w(i, {
				get icon() {
					return O;
				},
				size: 16
			});
			var a = m(i), o = y(a, !0);
			C(a), C(n), _((t) => e(o, t), [() => z()]), u("click", n, () => void l.session.create()), r(t, n);
		};
		o(s, (e) => {
			l.session.trash || e(c);
		});
		var d = m(s, 2), f = (t) => {
			var n = U(), i = y(n), a = y(i);
			w(a, {
				get icon() {
					return E;
				},
				size: 22
			}), C(i);
			var o = m(i, 2), s = y(o, !0);
			C(o);
			var c = m(o, 2), d = y(c, !0);
			C(c);
			var f = m(c, 2), p = y(f, !0);
			C(f), C(n), _((t, n, r) => {
				e(s, t), e(d, n), e(p, r);
			}, [
				() => B(),
				() => ee(),
				() => P()
			]), u("click", f, () => void l.session.reload()), r(t, n);
		}, p = (n) => {
			var i = G(), a = y(i), s = (t) => {
				var n = W(), i = v(n), a = y(i);
				w(a, {
					get icon() {
						return D;
					},
					size: 22
				}), C(i);
				var o = m(i, 2), s = y(o, !0);
				C(o);
				var c = m(o, 2), l = y(c, !0);
				C(c), _((t, n) => {
					e(s, t), e(l, n);
				}, [() => k(), () => A()]), r(t, n);
			}, c = t(() => l.session.query.trim()), u = (t) => {
				var n = W(), i = v(n), a = y(i);
				w(a, {
					get icon() {
						return T;
					},
					size: 22
				}), C(i);
				var o = m(i, 2), s = y(o, !0);
				C(o);
				var c = m(o, 2), l = y(c, !0);
				C(c), _((t, n) => {
					e(s, t), e(l, n);
				}, [() => te(), () => M()]), r(t, n);
			}, d = (t) => {
				var n = W(), i = v(n), a = y(i);
				w(a, {
					get icon() {
						return E;
					},
					size: 22
				}), C(i);
				var o = m(i, 2), s = y(o, !0);
				C(o);
				var c = m(o, 2), l = y(c, !0);
				C(c), _((t, n) => {
					e(s, t), e(l, n);
				}, [() => R(), () => L()]), r(t, n);
			};
			o(a, (e) => {
				x(c) ? e(s) : l.session.trash ? e(u, 1) : e(d, -1);
			}), C(i), r(n, i);
		}, h = (e) => {
			j(e, {
				get session() {
					return l.session;
				},
				density: "panel",
				onopen: (e) => void l.session.open(e),
				onedit: ne
			});
		};
		o(d, (e) => {
			l.session.error && !l.session.items.length ? e(f) : l.session.loaded && !l.session.items.length ? e(p, 1) : e(h, -1);
		}), C(a), n(a, (e, t) => I?.(e, t), () => x(Y)), r(i, a);
	};
	o($, (e) => {
		l.session.note ? e(re) : e(ie, -1);
	});
	var ae = m($, 2);
	N(ae, { get session() {
		return l.session;
	} }), C(Q), _(() => p(Q, "data-view", x(J) ? "note" : "list")), r(a, Q), g();
}
a(["click"]);
export { J as default };
