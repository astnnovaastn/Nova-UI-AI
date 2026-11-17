import { $ as e, A as t, B as n, Dt as r, E as i, F as a, Ft as o, H as s, J as c, K as l, M as u, N as d, Ot as f, R as p, S as m, U as h, V as g, W as _, _t as v, dt as y, ft as b, h as x, ht as S, m as C, ot as w, q as T, r as E, u as D, ut as O, yt as k } from "./index-client-C_2wYFnt.js";
import "./disclose-version-DFvUDwEH.js";
import { t as A } from "./Icon-E4BzZ4dm.js";
import { t as j } from "./Alert02Icon-Bvd3pGhx.js";
import { n as ee } from "./Button-Cvu69rz4.js";
import { t as M } from "./Tick02Icon-COqFGcdx.js";
import { t as N } from "./runtime-Ci9kzAvr.js";
// node_modules/@hugeicons/core-free-icons/dist/esm/ComputerTerminal01Icon.js
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
var Se = s("<span class=\"dot svelte-15t6k18\"></span>"), Ce = s("<span class=\"detail svelte-15t6k18\"> </span>"), we = s("<p role=\"status\"><span class=\"glyph svelte-15t6k18\" aria-hidden=\"true\"><!></span> <span class=\"words svelte-15t6k18\"><strong class=\"svelte-15t6k18\"> </strong><span class=\"text svelte-15t6k18\"> </span></span> <!></p>");
function Z(t, r) {
	let s = E(r, "detail", 3, null);
	var c = we(), l = O(c), u = O(l), d = (e) => {
		var t = Se();
		i(t, (e) => X?.(e)), n(e, t);
	}, f = (t) => {
		{
			let n = k(() => r.tone === "done" ? M : r.tone === "failed" ? j : F);
			A(t, {
				get icon() {
					return e(n);
				},
				size: 13,
				strokeWidth: 2
			});
		}
	};
	a(u, (e) => {
		r.tone === "working" ? e(d) : e(f, -1);
	}), o(l);
	var h = b(l, 2), g = O(h), _ = O(g, !0);
	o(g);
	var v = b(g), y = O(v, !0);
	o(v), o(h);
	var x = b(h, 2), S = (e) => {
		var t = Ce(), r = O(t, !0);
		o(t), w(() => p(r, s())), n(e, t);
	};
	a(x, (e) => {
		s() && e(S);
	}), o(c), w(() => {
		m(c, 1, `receipt ${r.tone ?? ""}`, "svelte-15t6k18"), p(_, r.status), p(y, r.text);
	}), n(t, c);
}
// upstream/src/features/work/components/asks/AskShell.svelte
var Te = s("<div class=\"body svelte-1h6qobm\"><!></div>"), Ee = s("<p class=\"note svelte-1h6qobm\"> </p>"), De = s("<section><header class=\"svelte-1h6qobm\"><span class=\"mark svelte-1h6qobm\" aria-hidden=\"true\"><!></span> <span class=\"where svelte-1h6qobm\"> </span></header> <h3 class=\"svelte-1h6qobm\"> </h3> <!> <!> <footer><!></footer></section>");
function Q(e, r) {
	let i = E(r, "placement", 3, "canvas"), s = E(r, "note", 3, null), c = E(r, "busy", 3, !1), l = E(r, "fill", 3, !1);
	var u = De(), d = O(u), f = O(d), h = O(f);
	t(h, () => r.mark), o(f);
	var g = b(f, 2), _ = O(g, !0);
	o(g), o(d);
	var v = b(d, 2), y = O(v, !0);
	o(v);
	var S = b(v, 2), C = (e) => {
		var i = Te(), a = O(i);
		t(a, () => r.children), o(i), n(e, i);
	};
	a(S, (e) => {
		r.children && e(C);
	});
	var T = b(S, 2), D = (e) => {
		var t = Ee(), r = O(t, !0);
		o(t), w(() => p(r, s())), n(e, t);
	};
	a(T, (e) => {
		s() && e(D);
	});
	var k = b(T, 2);
	let A;
	var j = O(k);
	t(j, () => r.actions), o(k), o(u), w(() => {
		m(u, 1, `ask ${i() ?? ""}`, "svelte-1h6qobm"), x(u, "aria-label", r.label), x(u, "aria-busy", c() || void 0), p(_, r.where), p(y, r.title), A = m(k, 1, "svelte-1h6qobm", null, A, { fill: l() });
	}), n(e, u);
}
// upstream/src/features/work/components/run/RunMark.svelte
var $ = h("<circle class=\"centre svelte-qcqpku\" cx=\"8\" cy=\"8\" r=\"2.75\"></circle>"), Oe = h("<path class=\"tick svelte-qcqpku\" d=\"M 5.25 8.25 L 7.2 10.1 L 10.9 6\"></path>"), ke = h("<path class=\"rest svelte-qcqpku\" d=\"M 5.5 8 L 10.5 8\"></path>"), Ae = h("<svg viewBox=\"0 0 16 16\" aria-hidden=\"true\"><circle class=\"track svelte-qcqpku\" cx=\"8\" cy=\"8\" r=\"6.25\"></circle><!></svg>");
function je(e, t) {
	let r = E(t, "state", 3, "idle"), i = E(t, "size", 3, 16);
	var s = Ae(), c = b(O(s)), l = (e) => {
		var t = $();
		n(e, t);
	}, u = (e) => {
		var t = Oe();
		n(e, t);
	}, d = (e) => {
		var t = ke();
		n(e, t);
	};
	a(c, (e) => {
		r() === "waiting" ? e(l) : r() === "done" ? e(u, 1) : r() === "stopped" && e(d, 2);
	}), o(s), w(() => {
		m(s, 0, `run-mark ${r() ?? ""}`, "svelte-qcqpku"), x(s, "width", i()), x(s, "height", i());
	}), n(e, s);
}
// upstream/src/features/work/components/asks/QuestionCard.svelte
var Me = s("<form class=\"words svelte-rl6qz3\"><label class=\"sr-only\"> </label> <input maxlength=\"8192\" class=\"svelte-rl6qz3\"/> <button type=\"submit\" class=\"send svelte-rl6qz3\"><!></button></form>"), Ne = s("<button type=\"button\" class=\"option svelte-rl6qz3\"> </button>"), Pe = s("<div class=\"options svelte-rl6qz3\"></div>");
function Fe(t, i) {
	let s = _();
	f(i, !0);
	let l = E(i, "placement", 3, "canvas"), m = E(i, "busy", 3, !1), h = v("");
	var j = g(), M = y(j), N = (t) => {
		{
			let r = (e) => {
				je(e, {
					state: "waiting",
					size: 18
				});
			}, f = (t) => {
				var r = Me(), a = O(r), l = O(a, !0);
				o(a);
				var u = b(a, 2);
				C(u);
				var d = b(u, 2), f = O(d);
				A(f, {
					get icon() {
						return ee;
					},
					size: 14,
					strokeWidth: 2
				}), o(d), o(r), w((e, t, n, r) => {
					x(a, "for", `${s}-answer`), p(l, e), x(u, "id", `${s}-answer`), x(u, "placeholder", t), u.disabled = m(), x(d, "aria-label", n), d.disabled = r;
				}, [
					() => ie(),
					() => i.ask.options.length ? ce() : fe(),
					() => z(),
					() => m() || !e(h).trim()
				]), c("submit", r, (t) => {
					t.preventDefault();
					let n = e(h).trim();
					n && i.onanswer(n);
				}), D(u, () => e(h), (e) => S(h, e)), n(t, r);
			}, _ = k(() => ue());
			Q(t, {
				get placement() {
					return l();
				},
				get busy() {
					return m();
				},
				fill: !0,
				get label() {
					return i.ask.prompt;
				},
				get where() {
					return e(_);
				},
				get title() {
					return i.ask.prompt;
				},
				mark: r,
				actions: f,
				children: (t, r) => {
					var s = g(), c = y(s), l = (t) => {
						var r = Pe();
						u(r, 21, () => i.ask.options, d, (t, r) => {
							var a = Ne(), s = O(a, !0);
							o(a), w(() => {
								a.disabled = m(), p(s, e(r));
							}), T("click", a, () => i.onanswer(e(r))), n(t, a);
						}), o(r), n(t, r);
					};
					a(c, (e) => {
						i.ask.options.length && e(l);
					}), n(t, s);
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
	a(M, (e) => {
		i.ask.state === "open" ? e(N) : i.ask.answer && e(P, 1);
	}), n(t, j), r();
}
l(["click"]);
export { Y as a, R as c, oe as d, ne as f, X as i, I as l, P as m, Q as n, ve as o, F as p, Z as r, z as s, Fe as t, me as u };
