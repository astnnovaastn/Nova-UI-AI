import { B as e, Ct as t, E as n, F as r, G as i, H as a, J as o, K as s, L as c, M as l, Mt as u, P as d, S as f, U as p, W as m, X as h, Y as g, bt as _, h as v, ht as y, jt as b, lt as x, m as S, mt as C, pt as w, r as T, tt as E, u as D, vt as O, zt as k } from "./index-client-DH73-vTM.js";
import "./disclose-version-7ONGmeVC.js";
import { t as A } from "./Icon-D2j1Ej6Z.js";
import "./Icon-CmjKIKuh.js";
import { t as j } from "./Alert02Icon-B5KhDP6a.js";
import { n as M } from "./Button-DutqeT5K.js";
import { l as N, t as P } from "./still-MFM7ZO4l.js";
import { t as F } from "./Tick02Icon-D7tHNRMx.js";
import { t as I } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_ask_answer_label.js
var ee = () => "Your answer", te = ((e = {}, t = {}) => (t.locale ?? I(), ee(e))), L = () => "Or say it in your words", R = ((e = {}, t = {}) => (t.locale ?? I(), L(e))), z = () => "Question", B = ((e = {}, t = {}) => (t.locale ?? I(), z(e))), V = () => "Your answer", H = ((e = {}, t = {}) => (t.locale ?? I(), V(e))), U = () => "Send answer", W = ((e = {}, t = {}) => (t.locale ?? I(), U(e))), G = m("<span class=\"dot svelte-15t6k18\"></span>"), K = m("<span class=\"detail svelte-15t6k18\"> </span>"), q = m("<p role=\"status\"><span class=\"glyph svelte-15t6k18\" aria-hidden=\"true\"><!></span> <span class=\"words svelte-15t6k18\"><strong class=\"svelte-15t6k18\"> </strong><span class=\"text svelte-15t6k18\"> </span></span> <!></p>");
function J(r, i) {
	let o = T(i, "detail", 3, null);
	var s = q(), l = w(s), u = w(l), d = (e) => {
		var t = G();
		n(t, (e) => P?.(e)), a(e, t);
	}, p = (e) => {
		{
			let n = t(() => i.tone === "done" ? F : i.tone === "failed" ? j : N);
			A(e, {
				get icon() {
					return E(n);
				},
				size: 13,
				strokeWidth: 2
			});
		}
	};
	c(u, (e) => {
		i.tone === "working" ? e(d) : e(p, -1);
	}), k(l);
	var m = y(l, 2), h = w(m), g = w(h, !0);
	k(h);
	var _ = y(h), v = w(_, !0);
	k(_), k(m);
	var b = y(m, 2), S = (t) => {
		var n = K(), r = w(n, !0);
		k(n), x(() => e(r, o())), a(t, n);
	};
	c(b, (e) => {
		o() && e(S);
	}), k(s), x(() => {
		f(s, 1, `receipt ${i.tone ?? ""}`, "svelte-15t6k18"), e(g, i.status), e(v, i.text);
	}), a(r, s);
}
// upstream/src/features/work/components/asks/AskShell.svelte
var Y = m("<div class=\"body svelte-1h6qobm\"><!></div>"), X = m("<p class=\"note svelte-1h6qobm\"> </p>"), Z = m("<section><header class=\"svelte-1h6qobm\"><span class=\"mark svelte-1h6qobm\" aria-hidden=\"true\"><!></span> <span class=\"where svelte-1h6qobm\"> </span></header> <h3 class=\"svelte-1h6qobm\"> </h3> <!> <!> <footer><!></footer></section>");
function Q(t, n) {
	let r = T(n, "placement", 3, "canvas"), i = T(n, "note", 3, null), o = T(n, "busy", 3, !1), s = T(n, "fill", 3, !1);
	var u = Z(), d = w(u), p = w(d), m = w(p);
	l(m, () => n.mark), k(p);
	var h = y(p, 2), g = w(h, !0);
	k(h), k(d);
	var _ = y(d, 2), b = w(_, !0);
	k(_);
	var S = y(_, 2), C = (e) => {
		var t = Y(), r = w(t);
		l(r, () => n.children), k(t), a(e, t);
	};
	c(S, (e) => {
		n.children && e(C);
	});
	var E = y(S, 2), D = (t) => {
		var n = X(), r = w(n, !0);
		k(n), x(() => e(r, i())), a(t, n);
	};
	c(E, (e) => {
		i() && e(D);
	});
	var O = y(E, 2);
	let A;
	var j = w(O);
	l(j, () => n.actions), k(O), k(u), x(() => {
		f(u, 1, `ask ${r() ?? ""}`, "svelte-1h6qobm"), v(u, "aria-label", n.label), v(u, "aria-busy", o() || void 0), e(g, n.where), e(b, n.title), A = f(O, 1, "svelte-1h6qobm", null, A, { fill: s() });
	}), a(t, u);
}
// upstream/src/features/work/components/run/RunMark.svelte
var ne = i("<circle class=\"centre svelte-qcqpku\" cx=\"8\" cy=\"8\" r=\"2.75\"></circle>"), re = i("<path class=\"tick svelte-qcqpku\" d=\"M 5.25 8.25 L 7.2 10.1 L 10.9 6\"></path>"), ie = i("<path class=\"rest svelte-qcqpku\" d=\"M 5.5 8 L 10.5 8\"></path>"), ae = i("<svg viewBox=\"0 0 16 16\" aria-hidden=\"true\"><circle class=\"track svelte-qcqpku\" cx=\"8\" cy=\"8\" r=\"6.25\"></circle><!></svg>");
function oe(e, t) {
	let n = T(t, "state", 3, "idle"), r = T(t, "size", 3, 16);
	var i = ae(), o = y(w(i)), s = (e) => {
		var t = ne();
		a(e, t);
	}, l = (e) => {
		var t = re();
		a(e, t);
	}, u = (e) => {
		var t = ie();
		a(e, t);
	};
	c(o, (e) => {
		n() === "waiting" ? e(s) : n() === "done" ? e(l, 1) : n() === "stopped" && e(u, 2);
	}), k(i), x(() => {
		f(i, 0, `run-mark ${n() ?? ""}`, "svelte-qcqpku"), v(i, "width", r()), v(i, "height", r());
	}), a(e, i);
}
// upstream/src/features/work/components/asks/QuestionCard.svelte
var $ = m("<form class=\"words svelte-rl6qz3\"><label class=\"sr-only\"> </label> <input maxlength=\"8192\" class=\"svelte-rl6qz3\"/> <button type=\"submit\" class=\"send svelte-rl6qz3\"><!></button></form>"), se = m("<button type=\"button\" class=\"option svelte-rl6qz3\"> </button>"), ce = m("<div class=\"options svelte-rl6qz3\"></div>");
function le(n, i) {
	let o = s();
	u(i, !0);
	let l = T(i, "placement", 3, "canvas"), f = T(i, "busy", 3, !1), m = _("");
	var j = p(), N = C(j), P = (n) => {
		{
			let s = (e) => {
				oe(e, {
					state: "waiting",
					size: 18
				});
			}, u = (t) => {
				var n = $(), r = w(n), s = w(r, !0);
				k(r);
				var c = y(r, 2);
				S(c);
				var l = y(c, 2), u = w(l);
				A(u, {
					get icon() {
						return M;
					},
					size: 14,
					strokeWidth: 2
				}), k(l), k(n), x((t, n, i, a) => {
					v(r, "for", `${o}-answer`), e(s, t), v(c, "id", `${o}-answer`), v(c, "placeholder", n), c.disabled = f(), v(l, "aria-label", i), l.disabled = a;
				}, [
					() => te(),
					() => i.ask.options.length ? R() : H(),
					() => W(),
					() => f() || !E(m).trim()
				]), h("submit", n, (e) => {
					e.preventDefault();
					let t = E(m).trim();
					t && i.onanswer(t);
				}), D(c, () => E(m), (e) => O(m, e)), a(t, n);
			}, _ = t(() => B());
			Q(n, {
				get placement() {
					return l();
				},
				get busy() {
					return f();
				},
				fill: !0,
				get label() {
					return i.ask.prompt;
				},
				get where() {
					return E(_);
				},
				get title() {
					return i.ask.prompt;
				},
				mark: s,
				actions: u,
				children: (t, n) => {
					var o = p(), s = C(o), l = (t) => {
						var n = ce();
						d(n, 21, () => i.ask.options, r, (t, n) => {
							var r = se(), o = w(r, !0);
							k(r), x(() => {
								r.disabled = f(), e(o, E(n));
							}), g("click", r, () => i.onanswer(E(n))), a(t, r);
						}), k(n), a(t, n);
					};
					c(s, (e) => {
						i.ask.options.length && e(l);
					}), a(t, o);
				},
				$$slots: {
					mark: !0,
					actions: !0,
					default: !0
				}
			});
		}
	}, F = (e) => {
		J(e, {
			tone: "done",
			get status() {
				return i.ask.answer;
			},
			get text() {
				return i.ask.prompt;
			}
		});
	};
	c(N, (e) => {
		i.ask.state === "open" ? e(P) : i.ask.answer && e(F, 1);
	}), a(n, j), b();
}
o(["click"]);
export { Q as n, J as r, le as t };
