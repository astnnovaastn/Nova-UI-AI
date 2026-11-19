import { B as e, Ct as t, E as n, F as r, G as i, H as a, J as o, K as s, L as c, M as l, Mt as u, P as d, S as f, U as p, W as m, X as h, Y as g, bt as _, h as v, ht as y, jt as b, lt as x, m as S, mt as C, pt as w, r as T, tt as E, u as D, vt as O, zt as k } from "./index-client-DH73-vTM.js";
import "./disclose-version-7ONGmeVC.js";
import { t as A } from "./Icon-D2j1Ej6Z.js";
import "./Icon-CmjKIKuh.js";
import { t as j } from "./Alert02Icon-B5KhDP6a.js";
import { n as ee } from "./Button-DutqeT5K.js";
import { t as M } from "./Tick02Icon-D7tHNRMx.js";
import { t as N } from "./runtime-Ci9kzAvr.js";
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/@hugeicons/core-free-icons/dist/esm/ComputerTerminal01Icon.js
var P = [
	["path", {
		d: "M7.5 7.5L8.72654 8.55719C9.24218 9.00163 9.5 9.22386 9.5 9.5C9.5 9.77614 9.24218 9.99836 8.72654 10.4428L7.5 11.5",
		stroke: "currentColor",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		strokeWidth: "1.5",
		key: "0"
	}],
	["path", {
		d: "M11.5 12.5H15.5",
		stroke: "currentColor",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		strokeWidth: "1.5",
		key: "1"
	}],
	["path", {
		d: "M12 21C15.7497 21 17.6246 21 18.9389 20.0451C19.3634 19.7367 19.7367 19.3634 20.0451 18.9389C21 17.6246 21 15.7497 21 12C21 8.25027 21 6.3754 20.0451 5.06107C19.7367 4.6366 19.3634 4.26331 18.9389 3.95491C17.6246 3 15.7497 3 12 3C8.25027 3 6.3754 3 5.06107 3.95491C4.6366 4.26331 4.26331 4.6366 3.95491 5.06107C3 6.3754 3 8.25027 3 12C3 15.7497 3 17.6246 3.95491 18.9389C4.26331 19.3634 4.6366 19.7367 5.06107 20.0451C6.3754 21 8.25027 21 12 21Z",
		stroke: "currentColor",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		strokeWidth: "1.5",
		key: "2"
	}]
], F = [["path", {
	d: "M20 12L4 12",
	stroke: "currentColor",
	strokeLinecap: "round",
	strokeLinejoin: "round",
	strokeWidth: "1.5",
	key: "0"
}]], te = () => "Allow", ne = ((e = {}, t = {}) => (t.locale ?? N(), te(e))), re = () => "Your answer", ie = ((e = {}, t = {}) => (t.locale ?? N(), re(e))), ae = () => "Choose folder…", oe = ((e = {}, t = {}) => (t.locale ?? N(), ae(e))), se = () => "Or say it in your words", ce = ((e = {}, t = {}) => (t.locale ?? N(), se(e))), le = () => "Question", ue = ((e = {}, t = {}) => (t.locale ?? N(), le(e))), de = () => "Your answer", fe = ((e = {}, t = {}) => (t.locale ?? N(), de(e))), pe = () => "Sign in", me = ((e = {}, t = {}) => (t.locale ?? N(), pe(e))), he = () => "Open page", I = ((e = {}, t = {}) => (t.locale ?? N(), he(e))), L = (e) => `Solve the check on ${e?.host}`, R = ((e, t = {}) => (t.locale ?? N(), L(e))), ge = () => "Send answer", z = ((e = {}, t = {}) => (t.locale ?? N(), ge(e))), _e = () => "Choose a folder", ve = ((e = {}, t = {}) => (t.locale ?? N(), _e(e))), B = /* @__PURE__ */ new Map(), V, H = !1, U = !1, ye = () => document.visibilityState === "hidden";
function W() {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.reduceMotion === "true";
}
function G(e) {
	e.notify(!e.visible || ye() || H);
}
function K() {
	H = W();
	for (let e of B.values()) G(e);
}
var q, J;
function be() {
	U || (U = !0, H = W(), document.addEventListener("visibilitychange", K), J = window.matchMedia("(prefers-reduced-motion: reduce)"), J.addEventListener("change", K), q = new MutationObserver(K), q.observe(document.documentElement, { attributeFilter: ["data-reduce-motion"] }), V = new IntersectionObserver((e) => {
		for (let t of e) {
			let e = B.get(t.target);
			e && e.visible !== t.isIntersecting && (e.visible = t.isIntersecting, G(e));
		}
	}));
}
function xe() {
	U && !B.size && (U = !1, document.removeEventListener("visibilitychange", K), J?.removeEventListener("change", K), q?.disconnect(), V?.disconnect(), V = void 0);
}
function Y(e, t) {
	be();
	let n = {
		visible: !0,
		notify: t
	};
	return B.set(e, n), V.observe(e), G(n), () => {
		V?.unobserve(e), B.delete(e), xe();
	};
}
function X(e) {
	return { destroy: Y(e, (t) => e.toggleAttribute("data-still", t)) };
}
// upstream/src/features/work/components/asks/AskReceipt.svelte
var Se = m("<span class=\"dot svelte-15t6k18\"></span>"), Ce = m("<span class=\"detail svelte-15t6k18\"> </span>"), we = m("<p role=\"status\"><span class=\"glyph svelte-15t6k18\" aria-hidden=\"true\"><!></span> <span class=\"words svelte-15t6k18\"><strong class=\"svelte-15t6k18\"> </strong><span class=\"text svelte-15t6k18\"> </span></span> <!></p>");
function Z(r, i) {
	let o = T(i, "detail", 3, null);
	var s = we(), l = w(s), u = w(l), d = (e) => {
		var t = Se();
		n(t, (e) => X?.(e)), a(e, t);
	}, p = (e) => {
		{
			let n = t(() => i.tone === "done" ? M : i.tone === "failed" ? j : F);
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
		var n = Ce(), r = w(n, !0);
		k(n), x(() => e(r, o())), a(t, n);
	};
	c(b, (e) => {
		o() && e(S);
	}), k(s), x(() => {
		f(s, 1, `receipt ${i.tone ?? ""}`, "svelte-15t6k18"), e(g, i.status), e(v, i.text);
	}), a(r, s);
}
// upstream/src/features/work/components/asks/AskShell.svelte
var Te = m("<div class=\"body svelte-1h6qobm\"><!></div>"), Ee = m("<p class=\"note svelte-1h6qobm\"> </p>"), De = m("<section><header class=\"svelte-1h6qobm\"><span class=\"mark svelte-1h6qobm\" aria-hidden=\"true\"><!></span> <span class=\"where svelte-1h6qobm\"> </span></header> <h3 class=\"svelte-1h6qobm\"> </h3> <!> <!> <footer><!></footer></section>");
function Q(t, n) {
	let r = T(n, "placement", 3, "canvas"), i = T(n, "note", 3, null), o = T(n, "busy", 3, !1), s = T(n, "fill", 3, !1);
	var u = De(), d = w(u), p = w(d), m = w(p);
	l(m, () => n.mark), k(p);
	var h = y(p, 2), g = w(h, !0);
	k(h), k(d);
	var _ = y(d, 2), b = w(_, !0);
	k(_);
	var S = y(_, 2), C = (e) => {
		var t = Te(), r = w(t);
		l(r, () => n.children), k(t), a(e, t);
	};
	c(S, (e) => {
		n.children && e(C);
	});
	var E = y(S, 2), D = (t) => {
		var n = Ee(), r = w(n, !0);
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
var $ = i("<circle class=\"centre svelte-qcqpku\" cx=\"8\" cy=\"8\" r=\"2.75\"></circle>"), Oe = i("<path class=\"tick svelte-qcqpku\" d=\"M 5.25 8.25 L 7.2 10.1 L 10.9 6\"></path>"), ke = i("<path class=\"rest svelte-qcqpku\" d=\"M 5.5 8 L 10.5 8\"></path>"), Ae = i("<svg viewBox=\"0 0 16 16\" aria-hidden=\"true\"><circle class=\"track svelte-qcqpku\" cx=\"8\" cy=\"8\" r=\"6.25\"></circle><!></svg>");
function je(e, t) {
	let n = T(t, "state", 3, "idle"), r = T(t, "size", 3, 16);
	var i = Ae(), o = y(w(i)), s = (e) => {
		var t = $();
		a(e, t);
	}, l = (e) => {
		var t = Oe();
		a(e, t);
	}, u = (e) => {
		var t = ke();
		a(e, t);
	};
	c(o, (e) => {
		n() === "waiting" ? e(s) : n() === "done" ? e(l, 1) : n() === "stopped" && e(u, 2);
	}), k(i), x(() => {
		f(i, 0, `run-mark ${n() ?? ""}`, "svelte-qcqpku"), v(i, "width", r()), v(i, "height", r());
	}), a(e, i);
}
// upstream/src/features/work/components/asks/QuestionCard.svelte
var Me = m("<form class=\"words svelte-rl6qz3\"><label class=\"sr-only\"> </label> <input maxlength=\"8192\" class=\"svelte-rl6qz3\"/> <button type=\"submit\" class=\"send svelte-rl6qz3\"><!></button></form>"), Ne = m("<button type=\"button\" class=\"option svelte-rl6qz3\"> </button>"), Pe = m("<div class=\"options svelte-rl6qz3\"></div>");
function Fe(n, i) {
	let o = s();
	u(i, !0);
	let l = T(i, "placement", 3, "canvas"), f = T(i, "busy", 3, !1), m = _("");
	var j = p(), M = C(j), N = (n) => {
		{
			let s = (e) => {
				je(e, {
					state: "waiting",
					size: 18
				});
			}, u = (t) => {
				var n = Me(), r = w(n), s = w(r, !0);
				k(r);
				var c = y(r, 2);
				S(c);
				var l = y(c, 2), u = w(l);
				A(u, {
					get icon() {
						return ee;
					},
					size: 14,
					strokeWidth: 2
				}), k(l), k(n), x((t, n, i, a) => {
					v(r, "for", `${o}-answer`), e(s, t), v(c, "id", `${o}-answer`), v(c, "placeholder", n), c.disabled = f(), v(l, "aria-label", i), l.disabled = a;
				}, [
					() => ie(),
					() => i.ask.options.length ? ce() : fe(),
					() => z(),
					() => f() || !E(m).trim()
				]), h("submit", n, (e) => {
					e.preventDefault();
					let t = E(m).trim();
					t && i.onanswer(t);
				}), D(c, () => E(m), (e) => O(m, e)), a(t, n);
			}, _ = t(() => ue());
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
						var n = Pe();
						d(n, 21, () => i.ask.options, r, (t, n) => {
							var r = Ne(), o = w(r, !0);
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
	}, P = (e) => {
		Z(e, {
			tone: "done",
			get status() {
				return i.ask.answer;
			},
			get text() {
				return i.ask.prompt;
			}
		});
	};
	c(M, (e) => {
		i.ask.state === "open" ? e(N) : i.ask.answer && e(P, 1);
	}), a(n, j), b();
}
o(["click"]);
export { Y as a, R as c, oe as d, ne as f, X as i, I as l, P as m, Q as n, ve as o, F as p, Z as r, z as s, Fe as t, me as u };
