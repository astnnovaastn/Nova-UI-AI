import { Ct as e, H as t, K as n, L as r, M as i, Mt as a, U as o, W as s, Wt as c, Z as l, a as u, bt as d, i as f, jt as p, mt as m, p as h, pt as g, r as _, tt as v, vt as y, zt as b } from "./index-client-DH73-vTM.js";
import "./disclose-version-7ONGmeVC.js";
import "./index-client-AzfegT-i.js";
import { A as x, C as S, E as C, F as w, I as T, L as E, M as D, N as O, O as k, P as A, R as j, S as M, _ as N, a as P, i as F, j as I, k as L, n as R, r as z, t as B, w as V, x as H } from "./popover-BrVWNVPz.js";
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/safe-polygon.svelte.js
function U(e, t) {
	let [n, r] = e, i = !1, a = t.length;
	for (let e = 0, o = a - 1; e < a; o = e++) {
		let [a, s] = t[e] ?? [0, 0], [c, l] = t[o] ?? [0, 0];
		s >= r != l >= r && n <= (c - a) * (r - s) / (l - s) + a && (i = !i);
	}
	return i;
}
function W(e, t) {
	return e[0] >= t.left && e[0] <= t.right && e[1] >= t.top && e[1] <= t.bottom;
}
function G(e, t) {
	let n = e.left + e.width / 2, r = e.top + e.height / 2, i = t.left + t.width / 2, a = t.top + t.height / 2, o = i - n, s = a - r;
	return Math.abs(o) > Math.abs(s) ? o > 0 ? "right" : "left" : s > 0 ? "bottom" : "top";
}
var K = class {
	#e;
	#t;
	#n;
	#r = null;
	#i = null;
	#a = [];
	#o = null;
	#s = null;
	#c = null;
	#l() {
		this.#s !== null && (cancelAnimationFrame(this.#s), this.#s = null);
	}
	#u() {
		this.#l(), this.#s = requestAnimationFrame(() => {
			this.#s = null, this.#r && this.#i && (this.#m(), this.#e.onPointerExit());
		});
	}
	#d() {
		this.#c !== null && (clearTimeout(this.#c), this.#c = null);
	}
	#f() {
		this.#n !== null && (this.#d(), this.#c = window.setTimeout(() => {
			this.#c = null, this.#r && this.#i && (this.#m(), this.#e.onPointerExit());
		}, this.#n));
	}
	constructor(e) {
		this.#e = e, this.#t = e.buffer ?? 1;
		let t = e.transitIntentTimeout;
		this.#n = typeof t == "number" && t > 0 ? t : null, w([
			e.triggerNode,
			e.contentNode,
			e.enabled
		], ([e, t, n]) => {
			if (!e || !t || !n) {
				this.#o = null, this.#m();
				return;
			}
			this.#o && this.#o !== e && this.#m(), this.#o = e;
			let r = A(e);
			return [
				l(r, "pointermove", (n) => {
					this.#p([n.clientX, n.clientY], e, t);
				}),
				l(e, "pointerleave", (e) => {
					let n = e.relatedTarget;
					if (V(n) && t.contains(n)) return;
					let r = this.#e.ignoredTargets?.() ?? [];
					V(n) && r.some((e) => e === n || e.contains(n)) || (this.#a = V(n) && r.length > 0 ? r.filter((e) => n.contains(e)) : [], this.#r = [e.clientX, e.clientY], this.#i = "content", this.#u());
				}),
				l(e, "pointerenter", () => {
					this.#m();
				}),
				l(t, "pointerenter", () => {
					this.#m();
				}),
				l(t, "pointerleave", (t) => {
					let n = t.relatedTarget;
					V(n) && e.contains(n) || (this.#r = [t.clientX, t.clientY], this.#i = "trigger", this.#u());
				})
			].reduce((e, t) => () => {
				e(), t();
			}, () => {});
		});
	}
	#p(e, t, n) {
		if (!this.#r || !this.#i) return;
		this.#l(), this.#f();
		let r = t.getBoundingClientRect(), i = n.getBoundingClientRect();
		if (this.#i === "content" && W(e, i) || this.#i === "trigger" && W(e, r)) {
			this.#m();
			return;
		}
		if (this.#i === "content" && this.#a.length > 0) for (let t of this.#a) {
			let n = t.getBoundingClientRect();
			if (W(e, n)) return;
			let i = G(r, n), a = this.#h(r, n, i);
			if (a && U(e, a)) return;
		}
		let a = G(r, i), o = this.#h(r, i, a);
		if (o && U(e, o)) return;
		let s = this.#i === "content" ? i : r;
		U(e, this.#g(this.#r, s, a, this.#i)) || (this.#m(), this.#e.onPointerExit());
	}
	#m() {
		this.#r = null, this.#i = null, this.#a = [], this.#l(), this.#d();
	}
	#h(e, t, n) {
		let r = this.#t;
		switch (n) {
			case "top": return [
				[Math.min(e.left, t.left) - r, e.top],
				[Math.min(e.left, t.left) - r, t.bottom],
				[Math.max(e.right, t.right) + r, t.bottom],
				[Math.max(e.right, t.right) + r, e.top]
			];
			case "bottom": return [
				[Math.min(e.left, t.left) - r, e.bottom],
				[Math.min(e.left, t.left) - r, t.top],
				[Math.max(e.right, t.right) + r, t.top],
				[Math.max(e.right, t.right) + r, e.bottom]
			];
			case "left": return [
				[e.left, Math.min(e.top, t.top) - r],
				[t.right, Math.min(e.top, t.top) - r],
				[t.right, Math.max(e.bottom, t.bottom) + r],
				[e.left, Math.max(e.bottom, t.bottom) + r]
			];
			case "right": return [
				[e.right, Math.min(e.top, t.top) - r],
				[t.left, Math.min(e.top, t.top) - r],
				[t.left, Math.max(e.bottom, t.bottom) + r],
				[e.right, Math.max(e.bottom, t.bottom) + r]
			];
		}
	}
	#g(e, t, n, r) {
		let i = this.#t * 4, [a, o] = e;
		switch (r === "trigger" ? this.#_(n) : n) {
			case "top": return [
				[a - i, o + i],
				[a + i, o + i],
				[t.right + i, t.bottom],
				[t.right + i, t.top],
				[t.left - i, t.top],
				[t.left - i, t.bottom]
			];
			case "bottom": return [
				[a - i, o - i],
				[a + i, o - i],
				[t.right + i, t.top],
				[t.right + i, t.bottom],
				[t.left - i, t.bottom],
				[t.left - i, t.top]
			];
			case "left": return [
				[a + i, o - i],
				[a + i, o + i],
				[t.right, t.bottom + i],
				[t.left, t.bottom + i],
				[t.left, t.top - i],
				[t.right, t.top - i]
			];
			case "right": return [
				[a - i, o - i],
				[a - i, o + i],
				[t.left, t.bottom + i],
				[t.right, t.bottom + i],
				[t.right, t.top - i],
				[t.left, t.top - i]
			];
		}
	}
	#_(e) {
		switch (e) {
			case "top": return "bottom";
			case "bottom": return "top";
			case "left": return "right";
			case "right": return "left";
		}
	}
}, q = L({
	component: "popover",
	parts: [
		"root",
		"trigger",
		"content",
		"close",
		"overlay"
	]
}), J = new T("Popover.Root"), Y = class e {
	static create(t) {
		return J.set(new e(t));
	}
	opts;
	#e = d(null);
	get contentNode() {
		return v(this.#e);
	}
	set contentNode(e) {
		y(this.#e, e, !0);
	}
	contentPresence;
	#t = d(null);
	get triggerNode() {
		return v(this.#t);
	}
	set triggerNode(e) {
		y(this.#t, e, !0);
	}
	#n = d(null);
	get overlayNode() {
		return v(this.#n);
	}
	set overlayNode(e) {
		y(this.#n, e, !0);
	}
	overlayPresence;
	#r = d(!1);
	get openedViaHover() {
		return v(this.#r);
	}
	set openedViaHover(e) {
		y(this.#r, e, !0);
	}
	#i = d(!1);
	get hasInteractedWithContent() {
		return v(this.#i);
	}
	set hasInteractedWithContent(e) {
		y(this.#i, e, !0);
	}
	#a = d(!1);
	get hoverCooldown() {
		return v(this.#a);
	}
	set hoverCooldown(e) {
		y(this.#a, e, !0);
	}
	#o = d(0);
	get closeDelay() {
		return v(this.#o);
	}
	set closeDelay(e) {
		y(this.#o, e, !0);
	}
	#s = null;
	#c = null;
	constructor(e) {
		this.opts = e, this.contentPresence = new S({
			ref: j(() => this.contentNode),
			open: this.opts.open,
			onComplete: () => {
				this.opts.onOpenChangeComplete.current(this.opts.open.current);
			}
		}), this.overlayPresence = new S({
			ref: j(() => this.overlayNode),
			open: this.opts.open
		}), w(() => this.opts.open.current, (e) => {
			e || (this.openedViaHover = !1, this.hasInteractedWithContent = !1, this.#l());
		});
	}
	setDomContext(e) {
		this.#c = e;
	}
	#l() {
		this.#s !== null && this.#c && (this.#c.clearTimeout(this.#s), this.#s = null);
	}
	toggleOpen() {
		this.#l(), this.opts.open.current = !this.opts.open.current;
	}
	handleClose() {
		this.#l(), this.opts.open.current && (this.opts.open.current = !1);
	}
	handleHoverOpen() {
		this.#l(), this.opts.open.current || (this.openedViaHover = !0, this.opts.open.current = !0);
	}
	handleHoverClose() {
		this.opts.open.current && this.openedViaHover && !this.hasInteractedWithContent && (this.opts.open.current = !1);
	}
	handleDelayedHoverClose() {
		this.opts.open.current && this.openedViaHover && !this.hasInteractedWithContent && (this.#l(), this.closeDelay <= 0 ? this.opts.open.current = !1 : this.#c && (this.#s = this.#c.setTimeout(() => {
			this.openedViaHover && !this.hasInteractedWithContent && (this.opts.open.current = !1), this.#s = null;
		}, this.closeDelay)));
	}
	cancelDelayedClose() {
		this.#l();
	}
	markInteraction() {
		this.hasInteractedWithContent = !0, this.#l();
	}
}, X = class t {
	static create(e) {
		return new t(e, J.get());
	}
	opts;
	root;
	attachment;
	domContext;
	#e = null;
	#t = null;
	#n = d(!1);
	constructor(e, t) {
		this.opts = e, this.root = t, this.attachment = D(this.opts.ref, (e) => this.root.triggerNode = e), this.domContext = new O(e.ref), this.root.setDomContext(this.domContext), this.onclick = this.onclick.bind(this), this.onkeydown = this.onkeydown.bind(this), this.onpointerenter = this.onpointerenter.bind(this), this.onpointerleave = this.onpointerleave.bind(this), w(() => this.opts.closeDelay.current, (e) => {
			this.root.closeDelay = e;
		});
	}
	#r() {
		this.#e !== null && (this.domContext.clearTimeout(this.#e), this.#e = null);
	}
	#i() {
		this.#t !== null && (this.domContext.clearTimeout(this.#t), this.#t = null);
	}
	#a() {
		this.#r(), this.#i();
	}
	onpointerenter(e) {
		if (this.opts.disabled.current || !this.opts.openOnHover.current || C(e) || (y(this.#n, !0), this.#i(), this.root.cancelDelayedClose(), this.root.opts.open.current || this.root.hoverCooldown)) return;
		let t = this.opts.openDelay.current;
		t <= 0 ? this.root.handleHoverOpen() : this.#e = this.domContext.setTimeout(() => {
			this.root.handleHoverOpen(), this.#e = null;
		}, t);
	}
	onpointerleave(e) {
		this.opts.disabled.current || this.opts.openOnHover.current && (C(e) || (y(this.#n, !1), this.#r(), this.root.hoverCooldown = !1));
	}
	onclick(e) {
		this.opts.disabled.current || e.button === 0 && (this.#a(), v(this.#n) && this.root.opts.open.current && this.root.openedViaHover ? (this.root.openedViaHover = !1, this.root.hasInteractedWithContent = !0) : (v(this.#n) && this.opts.openOnHover.current && this.root.opts.open.current && (this.root.hoverCooldown = !0), this.root.hoverCooldown && !this.root.opts.open.current && (this.root.hoverCooldown = !1), this.root.toggleOpen()));
	}
	onkeydown(e) {
		this.opts.disabled.current || (e.key === "Enter" || e.key === " ") && (e.preventDefault(), this.#a(), this.root.toggleOpen());
	}
	#o() {
		if (this.root.opts.open.current && this.root.contentNode?.id) return this.root.contentNode?.id;
	}
	#s = e(() => ({
		id: this.opts.id.current,
		"aria-haspopup": "dialog",
		"aria-expanded": k(this.root.opts.open.current),
		"data-state": x(this.root.opts.open.current),
		"aria-controls": this.#o(),
		[q.trigger]: "",
		disabled: this.opts.disabled.current,
		onkeydown: this.onkeydown,
		onclick: this.onclick,
		onpointerenter: this.onpointerenter,
		onpointerleave: this.onpointerleave,
		...this.attachment
	}));
	get props() {
		return v(this.#s);
	}
	set props(e) {
		y(this.#s, e);
	}
}, Z = class t {
	static create(e) {
		return new t(e, J.get());
	}
	opts;
	root;
	attachment;
	constructor(e, t) {
		this.opts = e, this.root = t, this.attachment = D(this.opts.ref, (e) => this.root.contentNode = e), this.onpointerdown = this.onpointerdown.bind(this), this.onfocusin = this.onfocusin.bind(this), this.onpointerenter = this.onpointerenter.bind(this), this.onpointerleave = this.onpointerleave.bind(this), new K({
			triggerNode: () => this.root.triggerNode,
			contentNode: () => this.root.contentNode,
			enabled: () => this.root.opts.open.current && this.root.openedViaHover && !this.root.hasInteractedWithContent,
			onPointerExit: () => {
				this.root.handleDelayedHoverClose();
			}
		});
	}
	onpointerdown(e) {
		this.root.markInteraction();
	}
	onfocusin(e) {
		let t = e.target;
		V(t) && N(t) && this.root.markInteraction();
	}
	onpointerenter(e) {
		C(e) || this.root.cancelDelayedClose();
	}
	onpointerleave(e) {
		C(e);
	}
	onInteractOutside = (e) => {
		if (this.opts.onInteractOutside.current(e), e.defaultPrevented || !V(e.target)) return;
		let t = e.target.closest(q.selector("trigger"));
		if (!(t && t === this.root.triggerNode)) {
			if (this.opts.customAnchor.current) {
				if (V(this.opts.customAnchor.current)) {
					if (this.opts.customAnchor.current.contains(e.target)) return;
				} else if (typeof this.opts.customAnchor.current == "string") {
					let t = document.querySelector(this.opts.customAnchor.current);
					if (t && t.contains(e.target)) return;
				}
			}
			this.root.handleClose();
		}
	};
	onEscapeKeydown = (e) => {
		this.opts.onEscapeKeydown.current(e), e.defaultPrevented || this.root.handleClose();
	};
	get shouldRender() {
		return this.root.contentPresence.shouldRender;
	}
	get shouldTrapFocus() {
		return !(this.root.openedViaHover && !this.root.hasInteractedWithContent);
	}
	#e = e(() => ({ open: this.root.opts.open.current }));
	get snippetProps() {
		return v(this.#e);
	}
	set snippetProps(e) {
		y(this.#e, e);
	}
	#t = e(() => ({
		id: this.opts.id.current,
		tabindex: -1,
		"data-state": x(this.root.opts.open.current),
		...I(this.root.contentPresence.transitionStatus),
		[q.content]: "",
		style: {
			pointerEvents: "auto",
			contain: "layout style"
		},
		onpointerdown: this.onpointerdown,
		onfocusin: this.onfocusin,
		onpointerenter: this.onpointerenter,
		onpointerleave: this.onpointerleave,
		...this.attachment
	}));
	get props() {
		return v(this.#t);
	}
	set props(e) {
		y(this.#t, e);
	}
	popperProps = {
		onInteractOutside: this.onInteractOutside,
		onEscapeKeydown: this.onEscapeKeydown
	};
}, Q = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"child",
	"children",
	"ref",
	"id",
	"forceMount",
	"onOpenAutoFocus",
	"onCloseAutoFocus",
	"onEscapeKeydown",
	"onInteractOutside",
	"trapFocus",
	"preventScroll",
	"customAnchor",
	"style"
]), $ = s("<div><div><!></div></div>");
function ee(s, l) {
	let d = n();
	a(l, !0);
	let y = _(l, "ref", 15, null), x = _(l, "id", 19, () => H(d)), S = _(l, "forceMount", 3, !1), C = _(l, "onOpenAutoFocus", 3, M), w = _(l, "onCloseAutoFocus", 3, M), T = _(l, "onEscapeKeydown", 3, M), D = _(l, "onInteractOutside", 3, M), O = _(l, "trapFocus", 3, !0), k = _(l, "preventScroll", 3, !1), A = _(l, "customAnchor", 3, null), N = f(l, Q), F = Z.create({
		id: j(() => x()),
		ref: j(() => y(), (e) => y(e)),
		onInteractOutside: j(() => D()),
		onEscapeKeydown: j(() => T()),
		customAnchor: j(() => A())
	}), I = e(() => E(N, F.props)), L = e(() => O() && F.shouldTrapFocus);
	function z(e) {
		F.shouldTrapFocus || e.preventDefault(), C()(e);
	}
	var V = o(), U = m(V), W = (n) => {
		B(n, u(() => v(I), () => F.popperProps, {
			get ref() {
				return F.opts.ref;
			},
			get enabled() {
				return F.root.opts.open.current;
			},
			get id() {
				return x();
			},
			get trapFocus() {
				return v(L);
			},
			get preventScroll() {
				return k();
			},
			loop: !0,
			forceMount: !0,
			get customAnchor() {
				return A();
			},
			onOpenAutoFocus: z,
			get onCloseAutoFocus() {
				return w();
			},
			get shouldRender() {
				return F.shouldRender;
			},
			popper: (n, a) => {
				let s = () => (a?.()).props, u = () => (a?.()).wrapperProps, d = e(() => E(s(), { style: P("popover") }, { style: l.style }));
				var f = o(), p = m(f), _ = (n) => {
					var r = o(), a = m(r);
					{
						let t = e(() => ({
							props: v(d),
							wrapperProps: u(),
							...F.snippetProps
						}));
						i(a, () => l.child, () => v(t));
					}
					t(n, r);
				}, y = (e) => {
					var n = $();
					h(n, () => ({ ...u() }));
					var r = g(n);
					h(r, () => ({ ...v(d) }));
					var a = g(r);
					i(a, () => l.children ?? c), b(r), b(n), t(e, n);
				};
				r(p, (e) => {
					l.child ? e(_) : e(y, -1);
				}), t(n, f);
			},
			$$slots: { popper: !0 }
		}));
	}, G = (n) => {
		R(n, u(() => v(I), () => F.popperProps, {
			get ref() {
				return F.opts.ref;
			},
			get open() {
				return F.root.opts.open.current;
			},
			get id() {
				return x();
			},
			get trapFocus() {
				return v(L);
			},
			get preventScroll() {
				return k();
			},
			loop: !0,
			forceMount: !1,
			get customAnchor() {
				return A();
			},
			onOpenAutoFocus: z,
			get onCloseAutoFocus() {
				return w();
			},
			get shouldRender() {
				return F.shouldRender;
			},
			popper: (n, a) => {
				let s = () => (a?.()).props, u = () => (a?.()).wrapperProps, d = e(() => E(s(), { style: P("popover") }, { style: l.style }));
				var f = o(), p = m(f), _ = (n) => {
					var r = o(), a = m(r);
					{
						let t = e(() => ({
							props: v(d),
							wrapperProps: u(),
							...F.snippetProps
						}));
						i(a, () => l.child, () => v(t));
					}
					t(n, r);
				}, y = (e) => {
					var n = $();
					h(n, () => ({ ...u() }));
					var r = g(n);
					h(r, () => ({ ...v(d) }));
					var a = g(r);
					i(a, () => l.children ?? c), b(r), b(n), t(e, n);
				};
				r(p, (e) => {
					l.child ? e(_) : e(y, -1);
				}), t(n, f);
			},
			$$slots: { popper: !0 }
		}));
	};
	r(U, (e) => {
		S() ? e(W) : S() || e(G, 1);
	}), t(s, V), p();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/popover/components/popover-trigger.svelte
var te = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"children",
	"child",
	"id",
	"ref",
	"type",
	"disabled",
	"openOnHover",
	"openDelay",
	"closeDelay"
]), ne = s("<button><!></button>");
function re(s, l) {
	let u = n();
	a(l, !0);
	let d = _(l, "id", 19, () => H(u)), y = _(l, "ref", 15, null), x = _(l, "type", 3, "button"), S = _(l, "disabled", 3, !1), C = _(l, "openOnHover", 3, !1), w = _(l, "openDelay", 3, 700), T = _(l, "closeDelay", 3, 300), D = f(l, te), O = X.create({
		id: j(() => d()),
		ref: j(() => y(), (e) => y(e)),
		disabled: j(() => !!S()),
		openOnHover: j(() => C()),
		openDelay: j(() => w()),
		closeDelay: j(() => T())
	}), k = e(() => E(D, O.props, { type: x() }));
	z(s, {
		get id() {
			return d();
		},
		get ref() {
			return O.opts.ref;
		},
		children: (e, n) => {
			var a = o(), s = m(a), u = (e) => {
				var n = o(), r = m(n);
				i(r, () => l.child, () => ({ props: v(k) })), t(e, n);
			}, d = (e) => {
				var n = ne();
				h(n, () => ({ ...v(k) }));
				var r = g(n);
				i(r, () => l.children ?? c), b(n), t(e, n);
			};
			r(s, (e) => {
				l.child ? e(u) : e(d, -1);
			}), t(e, a);
		},
		$$slots: { default: !0 }
	}), p();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/popover/components/popover.svelte
function ie(e, n) {
	a(n, !0);
	let r = _(n, "open", 15, !1), s = _(n, "onOpenChange", 3, M), l = _(n, "onOpenChangeComplete", 3, M);
	Y.create({
		open: j(() => r(), (e) => {
			r(e), s()(e);
		}),
		onOpenChangeComplete: j(() => l())
	}), F(e, {
		children: (e, r) => {
			var a = o(), s = m(a);
			i(s, () => n.children ?? c), t(e, a);
		},
		$$slots: { default: !0 }
	}), p();
}
export { re as n, ee as r, ie as t };
