import { t as e } from "./rolldown-runtime-CGnMp29N.js";
import { B as t, Ct as n, F as r, G as i, H as a, K as o, L as s, M as c, Mt as l, P as u, U as d, W as f, Wt as p, X as m, a as h, bt as g, h as _, ht as v, i as y, j as b, jt as x, lt as S, mt as C, p as w, pt as T, r as E, s as D, tt as O, ut as k, vt as A, zt as j } from "./index-client-DH73-vTM.js";
import "./disclose-version-7ONGmeVC.js";
import { t as M } from "./Icon-D2j1Ej6Z.js";
import { t as N } from "./ArrowDown01Icon-BD9DK2_Q.js";
import { t as P } from "./ArrowRight01Icon-BvvFE0hE.js";
import { F, L as I, R as L, S as R, T as z, a as B, c as V, d as H, f as ee, g as U, h as W, i as G, l as K, m as q, n as te, o as J, p as Y, r as X, s as ne, t as re, u as ie, v as ae, x as Z, y as oe } from "./popover-BrVWNVPz.js";
import { t as se } from "./FavIcon-Dsc27BCG.js";
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/@hugeicons/core-free-icons/dist/esm/ArrowUp01Icon.js
var ce = [["path", {
	d: "M17.9998 15C17.9998 15 13.5809 9.00001 11.9998 9C10.4187 8.99999 5.99985 15 5.99985 15",
	stroke: "currentColor",
	strokeLinecap: "round",
	strokeLinejoin: "round",
	strokeWidth: "1.5",
	key: "0"
}]];
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/menu/components/menu-sub.svelte
function le(e, t) {
	l(t, !0);
	let n = E(t, "open", 15, !1), r = E(t, "onOpenChange", 3, R), i = E(t, "onOpenChangeComplete", 3, R);
	U.create({
		open: L(() => n(), (e) => {
			n(e), r()?.(e);
		}),
		onOpenChangeComplete: L(() => i())
	}), G(e, {
		children: (e, n) => {
			var r = d(), i = C(r);
			c(i, () => t.children ?? p), a(e, r);
		},
		$$slots: { default: !0 }
	}), x();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/menu/components/menu-item.svelte
var ue = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"child",
	"children",
	"ref",
	"id",
	"disabled",
	"onSelect",
	"closeOnSelect"
]), de = f("<div><!></div>");
function fe(e, t) {
	let r = o();
	l(t, !0);
	let i = E(t, "ref", 15, null), u = E(t, "id", 19, () => Z(r)), f = E(t, "disabled", 3, !1), m = E(t, "onSelect", 3, R), h = E(t, "closeOnSelect", 3, !0), g = y(t, ue), _ = ie.create({
		id: L(() => u()),
		disabled: L(() => f()),
		onSelect: L(() => m()),
		ref: L(() => i(), (e) => i(e)),
		closeOnSelect: L(() => h())
	}), v = n(() => I(g, _.props));
	var b = d(), S = C(b), D = (e) => {
		var n = d(), r = C(n);
		c(r, () => t.child, () => ({ props: O(v) })), a(e, n);
	}, k = (e) => {
		var n = de();
		w(n, () => ({ ...O(v) }));
		var r = T(n);
		c(r, () => t.children ?? p), j(n), a(e, n);
	};
	s(S, (e) => {
		t.child ? e(D) : e(k, -1);
	}), a(e, b), x();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/menu/components/menu-separator.svelte
var pe = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"ref",
	"id",
	"child",
	"children"
]), me = f("<div><!></div>");
function he(e, t) {
	let r = o();
	l(t, !0);
	let i = E(t, "ref", 15, null), u = E(t, "id", 19, () => Z(r)), f = y(t, pe), m = q.create({
		id: L(() => u()),
		ref: L(() => i(), (e) => i(e))
	}), h = n(() => I(f, m.props));
	var g = d(), _ = C(g), v = (e) => {
		var n = d(), r = C(n);
		c(r, () => t.child, () => ({ props: O(h) })), a(e, n);
	}, b = (e) => {
		var n = me();
		w(n, () => ({ ...O(h) }));
		var r = T(n);
		c(r, () => t.children ?? p), j(n), a(e, n);
	};
	s(_, (e) => {
		t.child ? e(v) : e(b, -1);
	}), a(e, g), x();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/menu/components/menu-sub-content.svelte
var ge = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"id",
	"ref",
	"children",
	"child",
	"loop",
	"onInteractOutside",
	"forceMount",
	"onEscapeKeydown",
	"interactOutsideBehavior",
	"escapeKeydownBehavior",
	"onOpenAutoFocus",
	"onCloseAutoFocus",
	"onFocusOutside",
	"side",
	"trapFocus",
	"style"
]), _e = f("<div><div><!></div></div>");
function ve(e, t) {
	let r = o();
	l(t, !0);
	let i = E(t, "id", 19, () => Z(r)), u = E(t, "ref", 15, null), f = E(t, "loop", 3, !0), m = E(t, "onInteractOutside", 3, R), g = E(t, "forceMount", 3, !1), _ = E(t, "onEscapeKeydown", 3, R), v = E(t, "interactOutsideBehavior", 3, "defer-otherwise-close"), b = E(t, "escapeKeydownBehavior", 3, "defer-otherwise-close"), S = E(t, "onOpenAutoFocus", 3, R), D = E(t, "onCloseAutoFocus", 3, R), k = E(t, "onFocusOutside", 3, R), A = E(t, "side", 3, "right"), M = E(t, "trapFocus", 3, !1), N = y(t, ge), P = K.create({
		id: L(() => i()),
		loop: L(() => f()),
		ref: L(() => u(), (e) => u(e)),
		isSub: !0,
		onCloseAutoFocus: L(() => W)
	});
	function F(e) {
		let t = e.currentTarget.contains(e.target), n = ae[P.parentMenu.root.opts.dir.current].includes(e.key);
		t && n && (P.parentMenu.onClose(), P.parentMenu.triggerNode?.focus(), e.preventDefault());
	}
	let V = n(() => P.parentMenu.root.getBitsAttr("sub-content")), H = n(() => I(N, P.props, {
		side: A(),
		onkeydown: F,
		[O(V)]: ""
	}));
	function U(e) {
		S()(e), e.defaultPrevented || (e.preventDefault(), P.parentMenu.root.isUsingKeyboard && P.parentMenu.contentNode && ee.dispatch(P.parentMenu.contentNode));
	}
	function W(e) {
		D()(e), e.defaultPrevented || e.preventDefault();
	}
	function G(e) {
		m()(e), e.defaultPrevented || P.parentMenu.onClose();
	}
	function q(e) {
		_()(e), e.defaultPrevented || P.parentMenu.onClose();
	}
	function J(e) {
		if (k()(e), e.defaultPrevented || !z(e.target) || e.target.id === P.parentMenu.triggerNode?.id) return;
		if ((P.parentMenu.parentMenu?.contentNode)?.contains(e.target)) {
			P.parentMenu.onClose(), e.preventDefault();
			return;
		}
		let t = `[${P.parentMenu.root.getBitsAttr("sub-content")}]`;
		e.target.closest(t) ? e.preventDefault() : P.parentMenu.onClose();
	}
	var Y = d(), X = C(Y), ne = (e) => {
		re(e, h(() => O(H), {
			get ref() {
				return P.opts.ref;
			},
			get interactOutsideBehavior() {
				return v();
			},
			get escapeKeydownBehavior() {
				return b();
			},
			onOpenAutoFocus: U,
			get enabled() {
				return P.parentMenu.opts.open.current;
			},
			onInteractOutside: G,
			onEscapeKeydown: q,
			onFocusOutside: J,
			preventScroll: !1,
			get loop() {
				return f();
			},
			get trapFocus() {
				return M();
			},
			get shouldRender() {
				return P.shouldRender;
			},
			popper: (e, r) => {
				let i = () => (r?.()).props, o = () => (r?.()).wrapperProps, l = n(() => I(i(), O(H), { style: B("menu") }, { style: t.style }));
				var u = d(), f = C(u), m = (e) => {
					var r = d(), i = C(r);
					{
						let e = n(() => ({
							props: O(l),
							wrapperProps: o(),
							...P.snippetProps
						}));
						c(i, () => t.child, () => O(e));
					}
					a(e, r);
				}, h = (e) => {
					var n = _e();
					w(n, () => ({ ...o() }));
					var r = T(n);
					w(r, () => ({ ...O(l) }));
					var i = T(r);
					c(i, () => t.children ?? p), j(r), j(n), a(e, n);
				};
				s(f, (e) => {
					t.child ? e(m) : e(h, -1);
				}), a(e, u);
			},
			$$slots: { popper: !0 }
		}));
	}, ie = (e) => {
		te(e, h(() => O(H), {
			get ref() {
				return P.opts.ref;
			},
			get interactOutsideBehavior() {
				return v();
			},
			get escapeKeydownBehavior() {
				return b();
			},
			onCloseAutoFocus: W,
			onOpenAutoFocus: U,
			get open() {
				return P.parentMenu.opts.open.current;
			},
			onInteractOutside: G,
			onEscapeKeydown: q,
			onFocusOutside: J,
			preventScroll: !1,
			get loop() {
				return f();
			},
			get trapFocus() {
				return M();
			},
			get shouldRender() {
				return P.shouldRender;
			},
			popper: (e, r) => {
				let i = () => (r?.()).props, o = () => (r?.()).wrapperProps, l = n(() => I(i(), O(H), { style: B("menu") }, { style: t.style }));
				var u = d(), f = C(u), m = (e) => {
					var r = d(), i = C(r);
					{
						let e = n(() => ({
							props: O(l),
							wrapperProps: o(),
							...P.snippetProps
						}));
						c(i, () => t.child, () => O(e));
					}
					a(e, r);
				}, h = (e) => {
					var n = _e();
					w(n, () => ({ ...o() }));
					var r = T(n);
					w(r, () => ({ ...O(l) }));
					var i = T(r);
					c(i, () => t.children ?? p), j(r), j(n), a(e, n);
				};
				s(f, (e) => {
					t.child ? e(m) : e(h, -1);
				}), a(e, u);
			},
			$$slots: { popper: !0 }
		}));
	};
	s(X, (e) => {
		g() ? e(ne) : g() || e(ie, 1);
	}), a(e, Y), x();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/menu/components/menu-sub-trigger.svelte
var ye = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"id",
	"disabled",
	"ref",
	"children",
	"child",
	"onSelect",
	"openDelay"
]), be = f("<div><!></div>");
function xe(e, t) {
	let r = o();
	l(t, !0);
	let i = E(t, "id", 19, () => Z(r)), u = E(t, "disabled", 3, !1), f = E(t, "ref", 15, null), m = E(t, "onSelect", 3, R), h = E(t, "openDelay", 3, 0), g = y(t, ye), _ = W.create({
		disabled: L(() => u()),
		onSelect: L(() => m()),
		id: L(() => i()),
		ref: L(() => f(), (e) => f(e)),
		openDelay: L(() => h())
	}), v = n(() => I(g, _.props));
	X(e, {
		get id() {
			return i();
		},
		get ref() {
			return _.opts.ref;
		},
		children: (e, n) => {
			var r = d(), i = C(r), o = (e) => {
				var n = d(), r = C(n);
				c(r, () => t.child, () => ({ props: O(v) })), a(e, n);
			}, l = (e) => {
				var n = be();
				w(n, () => ({ ...O(v) }));
				var r = T(n);
				c(r, () => t.children ?? p), j(n), a(e, n);
			};
			s(i, (e) => {
				t.child ? e(o) : e(l, -1);
			}), a(e, r);
		},
		$$slots: { default: !0 }
	}), x();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/menu/components/menu-checkbox-item.svelte
var Se = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"child",
	"children",
	"ref",
	"checked",
	"id",
	"onCheckedChange",
	"disabled",
	"onSelect",
	"closeOnSelect",
	"indeterminate",
	"onIndeterminateChange",
	"value"
]), Ce = f("<div><!></div>");
function we(e, t) {
	let r = o();
	l(t, !0);
	let i = E(t, "ref", 15, null), u = E(t, "checked", 15, !1), f = E(t, "id", 19, () => Z(r)), m = E(t, "onCheckedChange", 3, R), h = E(t, "disabled", 3, !1), g = E(t, "onSelect", 3, R), _ = E(t, "closeOnSelect", 3, !0), v = E(t, "indeterminate", 15, !1), b = E(t, "onIndeterminateChange", 3, R), S = E(t, "value", 3, ""), D = y(t, Se), k = ne.getOr(null);
	k && S() && (k.opts.value.current.includes(S()) ? u(!0) : u(!1)), F.pre(() => S(), () => {
		k && S() && (k.opts.value.current.includes(S()) ? u(!0) : u(!1));
	});
	let A = V.create({
		checked: L(() => u(), (e) => {
			e !== u() && (u(e), m()(e));
		}),
		id: L(() => f()),
		disabled: L(() => h()),
		onSelect: L(() => M),
		ref: L(() => i(), (e) => i(e)),
		closeOnSelect: L(() => _()),
		indeterminate: L(() => v(), (e) => {
			e !== v() && (v(e), b()(e));
		}),
		value: L(() => S())
	}, k);
	function M(e) {
		g()(e), e.defaultPrevented || A.toggleChecked();
	}
	let N = n(() => I(D, A.props));
	var P = d(), z = C(P), B = (e) => {
		var n = d(), r = C(n);
		c(r, () => t.child, () => ({
			checked: u(),
			indeterminate: v(),
			props: O(N)
		})), a(e, n);
	}, H = (e) => {
		var n = Ce();
		w(n, () => ({ ...O(N) }));
		var r = T(n);
		c(r, () => t.children ?? p, () => ({
			checked: u(),
			indeterminate: v()
		})), j(n), a(e, n);
	};
	s(z, (e) => {
		t.child ? e(B) : e(H, -1);
	}), a(e, P), x();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/menu/components/menu.svelte
function Te(e, t) {
	l(t, !0);
	let n = E(t, "open", 15, !1), r = E(t, "dir", 3, "ltr"), i = E(t, "onOpenChange", 3, R), o = E(t, "onOpenChangeComplete", 3, R), s = E(t, "_internal_variant", 3, "dropdown-menu"), u = E(t, "_internal_should_skip_exit_animation", 3, void 0), f = Y.create({
		variant: L(() => s()),
		dir: L(() => r()),
		onClose: () => {
			n(!1), i()(!1);
		},
		shouldSkipExitAnimation: () => u()?.() ?? !1
	});
	H.create({
		open: L(() => n(), (e) => {
			n(e), i()(e);
		}),
		onOpenChangeComplete: L(() => o())
	}, f), G(e, {
		children: (e, n) => {
			var r = d(), i = C(r);
			c(i, () => t.children ?? p), a(e, r);
		},
		$$slots: { default: !0 }
	}), x();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/dropdown-menu/components/dropdown-menu-content.svelte
var Ee = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"id",
	"child",
	"children",
	"ref",
	"loop",
	"onInteractOutside",
	"onEscapeKeydown",
	"onCloseAutoFocus",
	"forceMount",
	"trapFocus",
	"style"
]), De = f("<div><div><!></div></div>");
function Oe(e, t) {
	let r = o();
	l(t, !0);
	let i = E(t, "id", 19, () => Z(r)), u = E(t, "ref", 15, null), f = E(t, "loop", 3, !0), m = E(t, "onInteractOutside", 3, R), g = E(t, "onEscapeKeydown", 3, R), _ = E(t, "onCloseAutoFocus", 3, R), v = E(t, "forceMount", 3, !1), b = E(t, "trapFocus", 3, !1), S = y(t, Ee), D = K.create({
		id: L(() => i()),
		loop: L(() => f()),
		ref: L(() => u(), (e) => u(e)),
		onCloseAutoFocus: L(() => _())
	}), k = n(() => I(S, D.props));
	function A(e) {
		if (D.handleInteractOutside(e), !e.defaultPrevented && (m()(e), !e.defaultPrevented)) {
			if (e.target && e.target instanceof Element) {
				let t = `[${D.parentMenu.root.getBitsAttr("sub-content")}]`;
				if (e.target.closest(t)) return;
			}
			D.parentMenu.onClose();
		}
	}
	function M(e) {
		g()(e), e.defaultPrevented || D.parentMenu.onClose();
	}
	var N = d(), P = C(N), F = (e) => {
		re(e, h(() => O(k), () => D.popperProps, {
			get ref() {
				return D.opts.ref;
			},
			get enabled() {
				return D.parentMenu.opts.open.current;
			},
			onInteractOutside: A,
			onEscapeKeydown: M,
			get trapFocus() {
				return b();
			},
			get loop() {
				return f();
			},
			forceMount: !0,
			get id() {
				return i();
			},
			get shouldRender() {
				return D.shouldRender;
			},
			popper: (e, r) => {
				let i = () => (r?.()).props, o = () => (r?.()).wrapperProps, l = n(() => I(i(), { style: B("dropdown-menu") }, { style: t.style }));
				var u = d(), f = C(u), m = (e) => {
					var r = d(), i = C(r);
					{
						let e = n(() => ({
							props: O(l),
							wrapperProps: o(),
							...D.snippetProps
						}));
						c(i, () => t.child, () => O(e));
					}
					a(e, r);
				}, h = (e) => {
					var n = De();
					w(n, () => ({ ...o() }));
					var r = T(n);
					w(r, () => ({ ...O(l) }));
					var i = T(r);
					c(i, () => t.children ?? p), j(r), j(n), a(e, n);
				};
				s(f, (e) => {
					t.child ? e(m) : e(h, -1);
				}), a(e, u);
			},
			$$slots: { popper: !0 }
		}));
	}, z = (e) => {
		te(e, h(() => O(k), () => D.popperProps, {
			get ref() {
				return D.opts.ref;
			},
			get open() {
				return D.parentMenu.opts.open.current;
			},
			onInteractOutside: A,
			onEscapeKeydown: M,
			get trapFocus() {
				return b();
			},
			get loop() {
				return f();
			},
			forceMount: !1,
			get id() {
				return i();
			},
			get shouldRender() {
				return D.shouldRender;
			},
			popper: (e, r) => {
				let i = () => (r?.()).props, o = () => (r?.()).wrapperProps, l = n(() => I(i(), { style: B("dropdown-menu") }, { style: t.style }));
				var u = d(), f = C(u), m = (e) => {
					var r = d(), i = C(r);
					{
						let e = n(() => ({
							props: O(l),
							wrapperProps: o(),
							...D.snippetProps
						}));
						c(i, () => t.child, () => O(e));
					}
					a(e, r);
				}, h = (e) => {
					var n = De();
					w(n, () => ({ ...o() }));
					var r = T(n);
					w(r, () => ({ ...O(l) }));
					var i = T(r);
					c(i, () => t.children ?? p), j(r), j(n), a(e, n);
				};
				s(f, (e) => {
					t.child ? e(m) : e(h, -1);
				}), a(e, u);
			},
			$$slots: { popper: !0 }
		}));
	};
	s(P, (e) => {
		v() ? e(F) : v() || e(z, 1);
	}), a(e, N), x();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/menu/components/menu-trigger.svelte
var ke = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"id",
	"ref",
	"child",
	"children",
	"disabled",
	"type"
]), Ae = f("<button><!></button>");
function je(e, t) {
	let r = o();
	l(t, !0);
	let i = E(t, "id", 19, () => Z(r)), u = E(t, "ref", 15, null), f = E(t, "disabled", 3, !1), m = E(t, "type", 3, "button"), h = y(t, ke), g = J.create({
		id: L(() => i()),
		disabled: L(() => f() ?? !1),
		ref: L(() => u(), (e) => u(e))
	}), _ = n(() => I(h, g.props, { type: m() }));
	X(e, {
		get id() {
			return i();
		},
		get ref() {
			return g.opts.ref;
		},
		children: (e, n) => {
			var r = d(), i = C(r), o = (e) => {
				var n = d(), r = C(n);
				c(r, () => t.child, () => ({ props: O(_) })), a(e, n);
			}, l = (e) => {
				var n = Ae();
				w(n, () => ({ ...O(_) }));
				var r = T(n);
				c(r, () => t.children ?? p), j(n), a(e, n);
			};
			s(i, (e) => {
				t.child ? e(o) : e(l, -1);
			}), a(e, r);
		},
		$$slots: { default: !0 }
	}), x();
}
// upstream/src/shared/ui/Menu/Mark.svelte
var Me = i("<svg viewBox=\"0 0 12 12\" width=\"12\" height=\"12\" fill=\"none\" stroke=\"currentColor\"><path d=\"M2 6.3l2.7 2.7L10 3.4\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path></svg>"), Ne = f("<span class=\"ui-menu-mark\" aria-hidden=\"true\"><!></span>");
function Pe(e, t) {
	var n = Ne(), r = T(n), i = (e) => {
		var t = Me();
		a(e, t);
	};
	s(r, (e) => {
		t.on && e(i);
	}), j(n), a(e, n);
}
// upstream/src/shared/ui/Menu/MenuStep.svelte
var Fe = f("<div class=\"ui-menu-step\" aria-hidden=\"true\"><!></div>");
function Q(e, t) {
	l(t, !0);
	let r = g(void 0), i = g(!1), o = 0;
	function s() {
		cancelAnimationFrame(o), o = 0;
	}
	function c() {
		let e = O(r)?.parentElement;
		if (!e || o !== 0) return;
		let n = performance.now(), a = (r) => {
			e.scrollTop += (t.dir === "up" ? -.45 : .45) * (r - n), n = r, o = O(i) ? requestAnimationFrame(a) : 0;
		};
		o = requestAnimationFrame(a);
	}
	k(() => {
		let e = O(r)?.parentElement;
		if (!e) return;
		let n = () => {
			let n = e.scrollHeight - e.clientHeight - e.scrollTop, r = e.clientHeight > 88;
			A(i, r && (t.dir === "up" ? e.scrollTop > 1 : n > 1), !0), O(i) || s();
		}, a = requestAnimationFrame(n), o = new ResizeObserver(n);
		return o.observe(e), e.addEventListener("scroll", n, { passive: !0 }), () => {
			cancelAnimationFrame(a), o.disconnect(), e.removeEventListener("scroll", n), s();
		};
	});
	var u = Fe(), d = T(u);
	{
		let e = n(() => t.dir === "up" ? ce : N);
		M(d, {
			get icon() {
				return O(e);
			},
			size: 12,
			strokeWidth: 2
		});
	}
	j(u), D(u, (e) => A(r, e), () => O(r)), S(() => {
		_(u, "data-dir", t.dir), _(u, "data-shown", O(i) || void 0);
	}), m("pointerenter", u, c), m("pointerleave", u, s), a(e, u), x();
}
// upstream/src/shared/ui/Menu/material.ts
function Ie(e) {
	return e?.closest("[data-menu-material]")?.getAttribute("data-menu-material") === "opaque" ? "opaque" : void 0;
}
// upstream/src/shared/ui/Menu/anchor.ts
function Le(e) {
	return e ? {
		contextElement: e,
		getBoundingClientRect() {
			let t = e.getBoundingClientRect(), n = parseFloat(getComputedStyle(e).scale);
			if (!n || n === 1) return t;
			let r = t.width / n, i = t.height / n;
			return new DOMRect(t.x + (t.width - r) / 2, t.y + (t.height - i) / 2, r, i);
		}
	} : null;
}
// upstream/src/shared/ui/Menu/Menu.svelte
var Re = (e, t = p) => {
	var n = d(), r = C(n), i = (e) => {
		var n = ze(), r = T(n);
		j(n), S(() => _(r, "src", t().image)), a(e, n);
	}, o = (e) => {
		var n = Be(), r = T(n);
		se(r, {
			get image() {
				return t().site.image;
			},
			get tone() {
				return t().site.tone;
			},
			size: 16,
			lit: !0,
			get fallback() {
				return t().icon;
			}
		}), j(n), a(e, n);
	}, c = (e) => {
		var n = Be(), r = T(n);
		M(r, {
			get icon() {
				return t().icon;
			},
			size: 15
		}), j(n), a(e, n);
	};
	s(r, (e) => {
		"image" in t() && t().image ? e(i) : "site" in t() && t().site ? e(o, 1) : t().icon && e(c, 2);
	}), a(e, n);
}, ze = f("<span class=\"ui-menu-icon\" aria-hidden=\"true\"><img width=\"16\" height=\"16\" alt=\"\" draggable=\"false\"/></span>"), Be = f("<span class=\"ui-menu-icon\" aria-hidden=\"true\"><!></span>"), Ve = f("<div class=\"ui-menu-heading\" role=\"presentation\"> </div>"), He = f("<!> <span class=\"ui-menu-chevron\" aria-hidden=\"true\"><!></span>", 1), $ = f("<!> <!> <!>", 1), Ue = f("<!> <!>", 1), We = f("<span class=\"ui-menu-hint\" aria-hidden=\"true\"> </span>");
function Ge(e, i) {
	l(i, !0);
	let o = (e, c = p) => {
		let l = n(() => N(c()));
		var f = d(), m = C(f);
		u(m, 17, c, r, (e, r) => {
			var c = d(), u = C(c), f = (e) => {
				var t = d(), n = C(t);
				b(n, () => he, (e, t) => {
					t(e, { class: "ui-menu-separator" });
				}), a(e, t);
			}, p = (e) => {
				var n = Ve(), i = T(n, !0);
				j(n), S(() => t(i, O(r).label)), a(e, n);
			}, m = (e) => {
				var i = d(), s = C(i);
				b(s, () => le, (e, i) => {
					i(e, {
						children: (e, i) => {
							var s = Ue(), c = C(s);
							b(c, () => xe, (e, n) => {
								n(e, {
									class: "ui-menu-item",
									children: (e, n) => {
										var i = He(), o = C(i);
										Re(o, () => O(r));
										var s = v(o), c = v(s), l = T(c);
										M(l, {
											get icon() {
												return P;
											},
											size: 12,
											strokeWidth: 2
										}), j(c), S(() => t(s, ` ${O(r).label ?? ""} `)), a(e, i);
									},
									$$slots: { default: !0 }
								});
							});
							var l = v(c, 2);
							b(l, () => oe, (e, t) => {
								t(e, {
									children: (e, t) => {
										var i = d(), s = C(i);
										{
											let e = n(() => `${O(F)} ui-menu-sub`);
											b(s, () => ve, (t, n) => {
												n(t, {
													get "data-menu-material"() {
														return O(k);
													},
													get class() {
														return O(e);
													},
													sideOffset: 4,
													collisionPadding: 10,
													children: (e, t) => {
														var n = $(), i = C(n);
														Q(i, { dir: "up" });
														var s = v(i, 2);
														o(s, () => O(r).entries), Q(v(s, 2), { dir: "down" }), a(e, n);
													},
													$$slots: { default: !0 }
												});
											});
										}
										a(e, i);
									},
									$$slots: { default: !0 }
								});
							}), a(e, s);
						},
						$$slots: { default: !0 }
					});
				}), a(e, i);
			}, g = (e) => {
				let o = n(() => "checked" in O(r) ? we : fe);
				var c = d(), u = C(c);
				{
					let e = n(() => O(r).danger || void 0);
					b(u, () => O(o), (o, c) => {
						c(o, h(() => "checked" in O(r) ? { checked: O(r).checked === !0 } : {}, {
							class: "ui-menu-item",
							get textValue() {
								return O(r).label;
							},
							get disabled() {
								return O(r).disabled;
							},
							get "data-danger"() {
								return O(e);
							},
							onSelect: () => i.onselect(O(r).id),
							children: (e, i) => {
								var o = $(), c = C(o);
								Re(c, () => O(r));
								var u = v(c), d = v(u), f = (e) => {
									var n = We(), i = T(n, !0);
									j(n), S(() => t(i, O(r).hint)), a(e, n);
								};
								s(d, (e) => {
									O(r).hint && e(f);
								});
								var p = v(d, 2), m = (e) => {
									{
										let t = n(() => O(r).checked === !0);
										Pe(e, { get on() {
											return O(t);
										} });
									}
								};
								s(p, (e) => {
									O(l) && e(m);
								}), S(() => t(u, ` ${O(r).label ?? ""} `)), a(e, o);
							},
							$$slots: { default: !0 }
						}));
					});
				}
				a(e, c);
			};
			s(u, (e) => {
				O(r).kind === "separator" ? e(f) : O(r).kind === "heading" ? e(p, 1) : O(r).kind === "submenu" ? e(m, 2) : e(g, -1);
			}), a(e, c);
		}), a(e, f);
	}, f = E(i, "triggerClass", 3, ""), m = E(i, "contentClass", 3, ""), _ = E(i, "side", 3, "bottom"), y = E(i, "align", 3, "start"), w = E(i, "open", 15, !1), D = g(null), k = g(void 0), N = (e) => e.some((e) => e.kind === "item" && "checked" in e), F = n(() => ["ui-menu ui-menu-scroll", m()].filter(Boolean).join(" "));
	var I = d(), L = C(I);
	b(L, () => Te, (e, t) => {
		t(e, {
			onOpenChange: (e) => {
				e && A(k, Ie(O(D)), !0), i.onopenchange?.(e);
			},
			get open() {
				return w();
			},
			set open(e) {
				w(e);
			},
			children: (e, t) => {
				var r = Ue(), s = C(r);
				b(s, () => je, (e, t) => {
					t(e, {
						get class() {
							return f();
						},
						get "aria-label"() {
							return i.label;
						},
						get ref() {
							return O(D);
						},
						set ref(e) {
							A(D, e, !0);
						},
						children: (e, t) => {
							var n = d(), r = C(n);
							c(r, () => i.trigger), a(e, n);
						},
						$$slots: { default: !0 }
					});
				});
				var l = v(s, 2);
				b(l, () => oe, (e, t) => {
					t(e, {
						children: (e, t) => {
							var r = d(), s = C(r);
							{
								let e = n(() => Le(O(D)));
								b(s, () => Oe, (t, n) => {
									n(t, {
										get "data-menu-material"() {
											return O(k);
										},
										get class() {
											return O(F);
										},
										get side() {
											return _();
										},
										get align() {
											return y();
										},
										get customAnchor() {
											return O(e);
										},
										sideOffset: 6,
										collisionPadding: 10,
										onCloseAutoFocus: (e) => {
											i.returnFocus && !i.returnFocus() && e.preventDefault();
										},
										children: (e, t) => {
											var n = $(), r = C(n);
											Q(r, { dir: "up" });
											var s = v(r, 2);
											o(s, () => i.entries), Q(v(s, 2), { dir: "down" }), a(e, n);
										},
										$$slots: { default: !0 }
									});
								});
							}
							a(e, r);
						},
						$$slots: { default: !0 }
					});
				}), a(e, r);
			},
			$$slots: { default: !0 }
		});
	}), a(e, I), x();
}
// upstream/src/shared/ui/Menu/index.ts
var Ke = /* @__PURE__ */ e({ default: () => Ge });
export { ce as a, Ie as i, Ge as n, Le as r, Ke as t };
