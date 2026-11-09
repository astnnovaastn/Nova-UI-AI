import { At as e, Ct as t, D as n, I as r, J as i, K as a, L as o, M as s, Nt as c, P as l, R as u, St as d, V as f, X as p, Y as m, Z as h, a as g, at as _, bt as v, ct as y, et as b, f as x, ft as S, gt as C, i as w, j as T, mt as E, n as D, nt as O, ot as k, r as A, rt as j, st as M, ut as N, wt as ee, x as te, xt as ne, yt as re, z as ie } from "./index-client-BSGo5gVb.js";
import "./disclose-version-DFvUDwEH.js";
import { n as ae } from "./index-client-CT6TpZ12.js";
// node_modules/svelte-toolbelt/dist/utils/is.js
function oe(e) {
	return typeof e == "function";
}
function se(e) {
	return typeof e == "object" && !!e;
}
var ce = [
	"string",
	"number",
	"bigint",
	"boolean"
];
function le(e) {
	return e == null || ce.includes(typeof e) ? !0 : Array.isArray(e) ? e.every((e) => le(e)) : typeof e == "object" && Object.getPrototypeOf(e) === Object.prototype;
}
// node_modules/svelte-toolbelt/dist/box/box-extras.svelte.js
var ue = Symbol("box"), de = Symbol("is-writable");
function P(e, t) {
	let n = E(e);
	return t ? {
		[ue]: !0,
		[de]: !0,
		get current() {
			return m(n);
		},
		set current(e) {
			t(e);
		}
	} : {
		[ue]: !0,
		get current() {
			return e();
		}
	};
}
function fe(e) {
	return se(e) && ue in e;
}
function pe(e) {
	return fe(e) ? e : oe(e) ? P(e) : F(e);
}
function F(e) {
	let t = S(y(e));
	return {
		[ue]: !0,
		[de]: !0,
		get current() {
			return m(t);
		},
		set current(e) {
			N(t, e, !0);
		}
	};
}
// node_modules/svelte-toolbelt/dist/utils/compose-handlers.js
function me(...e) {
	return function(t) {
		for (let n of e) if (n) {
			if (t.defaultPrevented) return;
			typeof n == "function" ? n.call(this, t) : n.current?.call(this, t);
		}
	};
}
// node_modules/inline-style-parser/esm/index.mjs
var he = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g, ge = /\n/g, _e = /^\s*/, ve = /^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/, ye = /^:\s*/, be = /^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/, xe = /^[;\s]*/, Se = /^\s+|\s+$/g, Ce = "\n", we = "/", Te = "*", I = "", Ee = "comment", De = "declaration";
function Oe(e, t) {
	if (typeof e != "string") throw TypeError("First argument must be a string");
	if (!e) return [];
	t ||= {};
	var n = 1, r = 1;
	function i(e) {
		var t = e.match(ge);
		t && (n += t.length);
		var i = e.lastIndexOf(Ce);
		r = ~i ? e.length - i : r + e.length;
	}
	function a() {
		var e = {
			line: n,
			column: r
		};
		return function(t) {
			return t.position = new o(e), l(), t;
		};
	}
	function o(e) {
		this.start = e, this.end = {
			line: n,
			column: r
		}, this.source = t.source;
	}
	o.prototype.content = e;
	function s(i) {
		var a = /* @__PURE__ */ Error(t.source + ":" + n + ":" + r + ": " + i);
		if (a.reason = i, a.filename = t.source, a.line = n, a.column = r, a.source = e, !t.silent) throw a;
	}
	function c(t) {
		var n = t.exec(e);
		if (n) {
			var r = n[0];
			return i(r), e = e.slice(r.length), n;
		}
	}
	function l() {
		c(_e);
	}
	function u(e) {
		var t;
		for (e ||= []; t = d();) t !== !1 && e.push(t);
		return e;
	}
	function d() {
		var t = a();
		if (we == e.charAt(0) && Te == e.charAt(1)) {
			for (var n = 2; I != e.charAt(n) && (Te != e.charAt(n) || we != e.charAt(n + 1));) ++n;
			if (n += 2, I === e.charAt(n - 1)) return s("End of comment missing");
			var o = e.slice(2, n - 2);
			return r += 2, i(o), e = e.slice(n), r += 2, t({
				type: Ee,
				comment: o
			});
		}
	}
	function f() {
		var e = a(), t = c(ve);
		if (t) {
			if (d(), !c(ye)) return s("property missing ':'");
			var n = c(be), r = e({
				type: De,
				property: ke(t[0].replace(he, I)),
				value: n ? ke(n[0].replace(he, I)) : I
			});
			return c(xe), r;
		}
	}
	function p() {
		var e = [];
		u(e);
		for (var t; t = f();) t !== !1 && (e.push(t), u(e));
		return e;
	}
	return l(), p();
}
function ke(e) {
	return e ? e.replace(Se, I) : I;
}
// node_modules/style-to-object/esm/index.mjs
function Ae(e, t) {
	let n = null;
	if (!e || typeof e != "string") return n;
	let r = Oe(e), i = typeof t == "function";
	return r.forEach((e) => {
		if (e.type !== "declaration") return;
		let { property: r, value: a } = e;
		i ? t(r, a, e) : a && (n ||= {}, n[r] = a);
	}), n;
}
// node_modules/svelte-toolbelt/dist/utils/strings.js
var je = /\d/, Me = [
	"-",
	"_",
	"/",
	"."
];
function Ne(e = "") {
	if (!je.test(e)) return e !== e.toLowerCase();
}
function Pe(e) {
	let t = [], n = "", r, i;
	for (let a of e) {
		let e = Me.includes(a);
		if (e === !0) {
			t.push(n), n = "", r = void 0;
			continue;
		}
		let o = Ne(a);
		if (i === !1) {
			if (r === !1 && o === !0) {
				t.push(n), n = a, r = o;
				continue;
			}
			if (r === !0 && o === !1 && n.length > 1) {
				let e = n.at(-1);
				t.push(n.slice(0, Math.max(0, n.length - 1))), n = e + a, r = o;
				continue;
			}
		}
		n += a, r = o, i = e;
	}
	return t.push(n), t;
}
function Fe(e) {
	return e ? Pe(e).map((e) => Le(e)).join("") : "";
}
function Ie(e) {
	return Re(Fe(e || ""));
}
function Le(e) {
	return e ? e[0].toUpperCase() + e.slice(1) : "";
}
function Re(e) {
	return e ? e[0].toLowerCase() + e.slice(1) : "";
}
// node_modules/svelte-toolbelt/dist/utils/css-to-style-obj.js
var ze = 1e3, Be = /* @__PURE__ */ new Map();
function Ve(e) {
	let t = Be.get(e);
	return t === void 0 && (t = e.startsWith("-moz-") || e.startsWith("-webkit-") || e.startsWith("-ms-") || e.startsWith("-o-") ? Fe(e) : e.startsWith("--") ? e : Ie(e), Be.size >= ze && Be.clear(), Be.set(e, t)), t;
}
var He = /["'\\{}]|\/\*/, Ue = /^[-\w]+$/;
function We(e) {
	if (He.test(e)) return null;
	let t = [], n = 0, r = 0, i = -1;
	for (let a = 0; a <= e.length; a++) {
		let o = a < e.length ? e.charCodeAt(a) : 59;
		if (o === 40) n++;
		else if (o === 41) {
			if (--n < 0) return null;
		} else if (o === 58) i < 0 && (i = a);
		else if (o === 59) {
			if (n !== 0) return null;
			let o = e.slice(r, a);
			if (i < 0) {
				if (o.trim() || t.length === 0) return null;
			} else {
				let n = e.slice(r, i).trim(), o = e.slice(i + 1, a).trim();
				if (!Ue.test(n) || !o) return null;
				t.push(n, o);
			}
			r = a + 1, i = -1;
		}
	}
	return t;
}
function Ge(e, t) {
	let n = We(t);
	if (n) for (let t = 0; t < n.length; t += 2) e[Ve(n[t])] = n[t + 1];
	else Ae(t, (t, n) => {
		e[Ve(t)] = n;
	});
}
function Ke(e) {
	if (!e) return {};
	let t = {};
	return Ge(t, e), t;
}
// node_modules/svelte-toolbelt/dist/utils/execute-callbacks.js
function qe(...e) {
	return (...t) => {
		for (let n of e) typeof n == "function" && n(...t);
	};
}
// node_modules/svelte-toolbelt/dist/utils/style-to-css.js
function Je(e, t) {
	let n = RegExp(e, "g");
	return (e) => {
		if (typeof e != "string") throw TypeError(`expected an argument of type string, but got ${typeof e}`);
		return e.match(n) ? e.replace(n, t) : e;
	};
}
var Ye = Je(/[A-Z]/, (e) => `-${e.toLowerCase()}`), Xe = /* @__PURE__ */ new Map();
function Ze(e) {
	let t = Xe.get(e);
	return t === void 0 && (t = Ye(e), Xe.size >= 1e3 && Xe.clear(), Xe.set(e, t)), t;
}
function Qe(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError(`expected an argument of type object, but got ${typeof e}`);
	let t = "";
	for (let n of Object.keys(e)) {
		let r = e[n];
		r != null && r !== "" && (t += `${t ? "\n" : ""}${Ze(n)}: ${r};`);
	}
	return t;
}
// node_modules/svelte-toolbelt/dist/utils/style.js
function $e(e = {}) {
	return Qe(e).replace("\n", " ");
}
var et = new Set(/* @__PURE__ */ "onabort.onanimationcancel.onanimationend.onanimationiteration.onanimationstart.onauxclick.onbeforeinput.onbeforetoggle.onblur.oncancel.oncanplay.oncanplaythrough.onchange.onclick.onclose.oncompositionend.oncompositionstart.oncompositionupdate.oncontextlost.oncontextmenu.oncontextrestored.oncopy.oncuechange.oncut.ondblclick.ondrag.ondragend.ondragenter.ondragleave.ondragover.ondragstart.ondrop.ondurationchange.onemptied.onended.onerror.onfocus.onfocusin.onfocusout.onformdata.ongotpointercapture.oninput.oninvalid.onkeydown.onkeypress.onkeyup.onload.onloadeddata.onloadedmetadata.onloadstart.onlostpointercapture.onmousedown.onmouseenter.onmouseleave.onmousemove.onmouseout.onmouseover.onmouseup.onpaste.onpause.onplay.onplaying.onpointercancel.onpointerdown.onpointerenter.onpointerleave.onpointermove.onpointerout.onpointerover.onpointerup.onprogress.onratechange.onreset.onresize.onscroll.onscrollend.onsecuritypolicyviolation.onseeked.onseeking.onselect.onselectionchange.onselectstart.onslotchange.onstalled.onsubmit.onsuspend.ontimeupdate.ontoggle.ontouchcancel.ontouchend.ontouchmove.ontouchstart.ontransitioncancel.ontransitionend.ontransitionrun.ontransitionstart.onvolumechange.onwaiting.onwebkitanimationend.onwebkitanimationiteration.onwebkitanimationstart.onwebkittransitionend.onwheel".split("."));
// node_modules/svelte-toolbelt/dist/utils/merge-props.js
function tt(e) {
	return et.has(e);
}
function nt(...e) {
	let t = { ...e[0] };
	for (let n = 1; n < e.length; n++) {
		let r = e[n];
		if (r) {
			for (let e of Object.keys(r)) {
				let n = t[e], i = r[e], a = typeof n == "function", o = typeof i == "function";
				if (a && o && tt(e)) t[e] = me(n, i);
				else if (a && o) t[e] = qe(n, i);
				else if (e === "class") {
					let r = le(n), a = le(i);
					r && a ? t[e] = te(n, i) : r ? t[e] = te(n) : a && (t[e] = te(i));
				} else if (e === "style") {
					let r = typeof n == "object", a = typeof i == "object", o = typeof n == "string", s = typeof i == "string";
					if (r && a) t[e] = {
						...n,
						...i
					};
					else if (r && s) {
						let r = Ke(i);
						t[e] = {
							...n,
							...r
						};
					} else if (o && a) t[e] = {
						...Ke(n),
						...i
					};
					else if (o && s) {
						let r = Ke(n), a = Ke(i);
						t[e] = {
							...r,
							...a
						};
					} else r ? t[e] = n : a ? t[e] = i : o ? t[e] = n : s && (t[e] = i);
				} else t[e] = i === void 0 ? n : i;
			}
			for (let e of Object.getOwnPropertySymbols(r)) {
				let n = t[e], i = r[e];
				t[e] = i === void 0 ? n : i;
			}
		}
	}
	return typeof t.style == "object" && (t.style = $e(t.style).replaceAll("\n", " ")), t.hidden === !1 && (t.hidden = void 0, delete t.hidden), t.disabled === !1 && (t.disabled = void 0, delete t.disabled), t;
}
// node_modules/runed/dist/internal/configurable-globals.js
var rt = typeof window < "u" ? window : void 0;
typeof window < "u" && window.document, typeof window < "u" && window.navigator, typeof window < "u" && window.location;
// node_modules/runed/dist/internal/utils/dom.js
function it(e) {
	let t = e.activeElement;
	for (; t?.shadowRoot;) {
		let e = t.shadowRoot.activeElement;
		if (e === t) break;
		t = e;
	}
	return t;
}
new class {
	#e;
	#t;
	constructor(e = {}) {
		let { window: t = rt, document: n = t?.document } = e;
		t !== void 0 && (this.#e = n, this.#t = C((e) => {
			let n = a(t, "focusin", e), r = a(t, "focusout", e);
			return () => {
				n(), r();
			};
		}));
	}
	get current() {
		return this.#t?.(), this.#e ? it(this.#e) : null;
	}
}();
// node_modules/runed/dist/internal/utils/is.js
function at(e) {
	return typeof e == "function";
}
// node_modules/runed/dist/utilities/context/context.js
var L = class {
	#e;
	#t;
	constructor(e) {
		this.#e = e, this.#t = Symbol(e);
	}
	get key() {
		return this.#t;
	}
	exists() {
		return ne(this.#t);
	}
	get() {
		let e = v(this.#t);
		if (e === void 0) throw Error(`Context "${this.#e}" not found`);
		return e;
	}
	getOr(e) {
		let t = v(this.#t);
		return t === void 0 ? e : t;
	}
	set(e) {
		return ee(this.#t, e);
	}
};
// node_modules/runed/dist/utilities/watch/watch.svelte.js
function ot(e, t) {
	switch (e) {
		case "post":
			O(t);
			break;
		case "pre": j(t);
	}
}
function st(e, t, n, r = {}) {
	let { lazy: i = !1 } = r, a = !i, o = Array.isArray(e) ? [] : void 0;
	ot(t, () => {
		let t = Array.isArray(e) ? e.map((e) => e()) : e();
		if (!a) {
			a = !0, o = t;
			return;
		}
		let r = h(() => n(t, o));
		return o = t, r;
	});
}
function R(e, t, n) {
	st(e, "post", t, n);
}
function ct(e, t, n) {
	st(e, "pre", t, n);
}
R.pre = ct;
// node_modules/runed/dist/internal/utils/get.js
function lt(e) {
	return at(e) ? e() : e;
}
// node_modules/runed/dist/utilities/element-size/element-size.svelte.js
var ut = class {
	#e = {
		width: 0,
		height: 0
	};
	#t = !1;
	#n;
	#r;
	#i;
	#a = E(() => (m(this.#s)?.(), this.getSize().width));
	#o = E(() => (m(this.#s)?.(), this.getSize().height));
	#s = E(() => {
		let e = lt(this.#r);
		if (e) return C((t) => {
			if (!this.#i) return;
			let n = new this.#i.ResizeObserver((e) => {
				this.#t = !0;
				for (let t of e) {
					let e = this.#n.box === "content-box" ? t.contentBoxSize : t.borderBoxSize, n = Array.isArray(e) ? e : [e];
					this.#e.width = n.reduce((e, t) => Math.max(e, t.inlineSize), 0), this.#e.height = n.reduce((e, t) => Math.max(e, t.blockSize), 0);
				}
				t();
			});
			return n.observe(e), () => {
				this.#t = !1, n.disconnect();
			};
		});
	});
	constructor(e, t = { box: "border-box" }) {
		this.#i = t.window ?? rt, this.#n = t, this.#r = e, this.#e = {
			width: 0,
			height: 0
		};
	}
	calculateSize() {
		let e = lt(this.#r);
		if (!e || !this.#i) return;
		let t = e.offsetWidth, n = e.offsetHeight;
		if (this.#n.box === "border-box") return {
			width: t,
			height: n
		};
		let r = this.#i.getComputedStyle(e), i = parseFloat(r.paddingLeft) + parseFloat(r.paddingRight), a = parseFloat(r.paddingTop) + parseFloat(r.paddingBottom), o = parseFloat(r.borderLeftWidth) + parseFloat(r.borderRightWidth), s = parseFloat(r.borderTopWidth) + parseFloat(r.borderBottomWidth);
		return {
			width: t - i - o,
			height: n - a - s
		};
	}
	getSize() {
		return this.#t ? this.#e : this.calculateSize() ?? this.#e;
	}
	get current() {
		return m(this.#s)?.(), this.getSize();
	}
	get width() {
		return m(this.#a);
	}
	get height() {
		return m(this.#o);
	}
};
// node_modules/svelte-toolbelt/dist/utils/on-destroy-effect.svelte.js
function dt(e) {
	O(() => () => {
		e();
	});
}
// node_modules/svelte-toolbelt/dist/utils/after-sleep.js
function ft(e, t) {
	return setTimeout(t, e);
}
// node_modules/svelte-toolbelt/dist/utils/after-tick.js
function pt(e) {
	p().then(e);
}
// node_modules/svelte-toolbelt/dist/utils/dom.js
var mt = 1, ht = 9, gt = 11;
function _t(e) {
	return se(e) && e.nodeType === mt && typeof e.nodeName == "string";
}
function vt(e) {
	return se(e) && e.nodeType === ht;
}
function yt(e) {
	return se(e) && e.constructor?.name === "VisualViewport";
}
function bt(e) {
	return se(e) && e.nodeType !== void 0;
}
function xt(e) {
	return bt(e) && e.nodeType === gt && "host" in e;
}
function St(e, t) {
	if (!e || !t || !_t(e) || !_t(t)) return !1;
	let n = t.getRootNode?.();
	if (e === t || e.contains(t)) return !0;
	if (n && xt(n)) {
		let n = t;
		for (; n;) {
			if (e === n) return !0;
			n = n.parentNode || n.host;
		}
	}
	return !1;
}
function Ct(e) {
	return vt(e) ? e : yt(e) ? e.document : e?.ownerDocument ?? document;
}
function wt(e) {
	return xt(e) ? wt(e.host) : vt(e) ? e.defaultView ?? window : _t(e) ? e.ownerDocument?.defaultView ?? window : window;
}
function Tt(e) {
	let t = e.activeElement;
	for (; t?.shadowRoot;) {
		let e = t.shadowRoot.activeElement;
		if (e === t) break;
		t = e;
	}
	return t;
}
// node_modules/svelte-toolbelt/dist/utils/dom-context.svelte.js
var Et = class {
	element;
	#e = E(() => this.element.current ? this.element.current.getRootNode() ?? document : document);
	get root() {
		return m(this.#e);
	}
	set root(e) {
		N(this.#e, e);
	}
	constructor(e) {
		this.element = typeof e == "function" ? P(e) : e;
	}
	getDocument = () => Ct(this.root);
	getWindow = () => this.getDocument().defaultView ?? window;
	getActiveElement = () => Tt(this.root);
	isActiveElement = (e) => e === this.getActiveElement();
	getElementById(e) {
		return this.root.getElementById(e);
	}
	querySelector = (e) => this.root ? this.root.querySelector(e) : null;
	querySelectorAll = (e) => this.root ? this.root.querySelectorAll(e) : [];
	setTimeout = (e, t) => this.getWindow().setTimeout(e, t);
	clearTimeout = (e) => this.getWindow().clearTimeout(e);
};
// node_modules/svelte-toolbelt/dist/utils/attach-ref.js
function Dt(e, t) {
	return { [i()]: (n) => fe(e) ? (e.current = n, h(() => t?.(n)), () => {
		"isConnected" in n && n.isConnected || (e.current = null, t?.(null));
	}) : (e(n), h(() => t?.(n)), () => {
		"isConnected" in n && n.isConnected || (e(null), t?.(null));
	}) };
}
// node_modules/bits-ui/dist/internal/attrs.js
function Ot(e) {
	return e ? "true" : "false";
}
function kt(e) {
	return e ? "open" : "closed";
}
function At(e) {
	return e === "starting" ? { "data-starting-style": "" } : e === "ending" ? { "data-ending-style": "" } : {};
}
var jt = class {
	#e;
	#t;
	attrs;
	constructor(e) {
		this.#e = e.getVariant ? e.getVariant() : null, this.#t = this.#e ? `data-${this.#e}-` : `data-${e.component}-`, this.getAttr = this.getAttr.bind(this), this.selector = this.selector.bind(this), this.attrs = Object.fromEntries(e.parts.map((e) => [e, this.getAttr(e)]));
	}
	getAttr(e, t) {
		return t ? `data-${t}-${e}` : `${this.#t}${e}`;
	}
	selector(e, t) {
		return `[${this.getAttr(e, t)}]`;
	}
};
function Mt(e) {
	let t = new jt(e);
	return {
		...t.attrs,
		selector: t.selector,
		getAttr: t.getAttr
	};
}
// node_modules/bits-ui/dist/internal/is.js
var Nt = typeof document < "u", Pt = Ft();
function Ft() {
	return Nt && window?.navigator?.userAgent && (/iP(ad|hone|od)/.test(window.navigator.userAgent) || window?.navigator?.maxTouchPoints > 2 && /iPad|Macintosh/.test(window?.navigator.userAgent));
}
function It(e) {
	return e instanceof HTMLElement;
}
function z(e) {
	return e instanceof Element;
}
function Lt(e) {
	return e instanceof Element || e instanceof SVGElement;
}
function Rt(e) {
	return e.pointerType === "touch";
}
function zt(e) {
	return e !== null;
}
// node_modules/bits-ui/dist/internal/animations-complete.js
var Bt = class {
	#e;
	#t = null;
	#n = null;
	#r = 0;
	constructor(e) {
		this.#e = e, dt(() => this.#i());
	}
	#i() {
		this.#t !== null && (window.cancelAnimationFrame(this.#t), this.#t = null), this.#n?.disconnect(), this.#n = null, this.#r++;
	}
	run(e) {
		this.#i();
		let t = this.#e.ref.current;
		if (!t) return;
		if (typeof t.getAnimations != "function") {
			this.#a(e);
			return;
		}
		let n = this.#r, r = () => {
			n === this.#r && this.#a(e);
		}, i = () => {
			if (n !== this.#r) return;
			let e = t.getAnimations();
			e.length === 0 ? r() : Promise.all(e.map((e) => e.finished)).then(() => {
				r();
			}).catch(() => {
				n === this.#r && (t.getAnimations().some((e) => e.pending || e.playState !== "finished") ? i() : r());
			});
		}, a = () => {
			this.#t = window.requestAnimationFrame(() => {
				this.#t = null, i();
			});
		};
		this.#e.afterTick.current ? this.#t = window.requestAnimationFrame(() => {
			this.#t = null;
			let e = "data-starting-style";
			t.hasAttribute(e) ? (this.#n = new MutationObserver(() => {
				n === this.#r && (t.hasAttribute(e) || (this.#n?.disconnect(), this.#n = null, a()));
			}), this.#n.observe(t, {
				attributes: !0,
				attributeFilter: [e]
			})) : a();
		}) : a();
	}
	#a(e) {
		let t = () => {
			e();
		};
		this.#e.afterTick ? pt(t) : t();
	}
}, Vt = class {
	#e;
	#t;
	#n;
	#r = S(!1);
	#i = S(void 0);
	#a = !1;
	#o = null;
	constructor(e) {
		this.#e = e, N(this.#r, e.open.current, !0), this.#t = e.enabled ?? !0, this.#n = new Bt({
			ref: this.#e.ref,
			afterTick: this.#e.open
		}), dt(() => this.#s()), R(() => this.#e.open.current, (e) => {
			this.#a ? (this.#s(), !e && this.#e.shouldSkipExitAnimation?.() ? (N(this.#r, !1), N(this.#i, void 0), this.#e.onComplete?.()) : (e && N(this.#r, !0), N(this.#i, e ? "starting" : "ending", !0), e && (this.#o = window.requestAnimationFrame(() => {
				this.#o = null, this.#e.open.current && N(this.#i, void 0);
			})), this.#t ? this.#n.run(() => {
				e === this.#e.open.current && (this.#e.open.current || N(this.#r, !1), N(this.#i, void 0), this.#e.onComplete?.());
			}) : (e || N(this.#r, !1), N(this.#i, void 0), this.#e.onComplete?.()))) : this.#a = !0;
		});
	}
	get shouldRender() {
		return m(this.#r);
	}
	get transitionStatus() {
		return m(this.#i);
	}
	#s() {
		this.#o !== null && (window.cancelAnimationFrame(this.#o), this.#o = null);
	}
};
// node_modules/bits-ui/dist/internal/noop.js
function B() {}
// node_modules/bits-ui/dist/internal/create-id.js
function Ht(e, t) {
	return t === void 0 ? `bits-${e}` : `bits-${e}-${t}`;
}
// node_modules/bits-ui/dist/bits/utilities/portal/portal-consumer.svelte
function Ut(e, t) {
	var r = u(), i = k(r);
	T(i, () => t.children, (e) => {
		var r = u(), i = k(r);
		n(i, () => t.children ?? c), o(e, r);
	}), o(e, r);
}
// node_modules/bits-ui/dist/bits/utilities/config/bits-config.js
var Wt = new L("BitsConfig");
function Gt() {
	let e = new qt(null, {});
	return Wt.getOr(e).opts;
}
function Kt(e) {
	return Wt.set(new qt(Wt.getOr(null), e));
}
var qt = class {
	opts;
	constructor(e, t) {
		let n = Jt(e, t);
		this.opts = {
			defaultPortalTo: n((e) => e.defaultPortalTo),
			defaultLocale: n((e) => e.defaultLocale)
		};
	}
};
function Jt(e, t) {
	return (n) => P(() => {
		let r = n(t)?.current;
		if (r !== void 0) return r;
		if (e !== null) return n(e.opts)?.current;
	});
}
// node_modules/bits-ui/dist/bits/utilities/config/prop-resolvers.js
function Yt(e, t) {
	return (n) => {
		let r = Gt();
		return P(() => {
			let i = n();
			if (i !== void 0) return i;
			let a = e(r).current;
			return a === void 0 ? t : a;
		});
	};
}
var Xt = Yt((e) => e.defaultPortalTo, "body");
// node_modules/bits-ui/dist/bits/utilities/portal/portal.svelte
function Zt(e, i) {
	t(i, !0);
	let a = Xt(() => i.to), f = re(), p = E(h);
	function h() {
		if (!Nt || i.disabled) return null;
		let e = null;
		return e = typeof a.current == "string" ? document.querySelector(a.current) : a.current, e;
	}
	let g;
	function _() {
		g &&= (r(g), null);
	}
	R([() => m(p), () => i.disabled], ([e, t]) => {
		if (!e || t) _();
		else return g = l(Ut, {
			target: e,
			props: { children: i.children },
			context: f
		}), () => {
			_();
		};
	});
	var v = u(), y = k(v), b = (e) => {
		var t = u(), r = k(t);
		n(r, () => i.children ?? c), o(e, t);
	};
	s(y, (e) => {
		i.disabled && e(b);
	}), o(e, v), d();
}
// node_modules/bits-ui/dist/internal/events.js
var Qt = class {
	eventName;
	options;
	constructor(e, t = {
		bubbles: !0,
		cancelable: !0
	}) {
		this.eventName = e, this.options = t;
	}
	createEvent(e) {
		return new CustomEvent(this.eventName, {
			...this.options,
			detail: e
		});
	}
	dispatch(e, t) {
		let n = this.createEvent(t);
		return e.dispatchEvent(n), n;
	}
	listen(e, t, n) {
		return a(e, this.eventName, (e) => {
			t(e);
		}, n);
	}
};
// node_modules/bits-ui/dist/internal/debounce.js
function $t(e, t = 500) {
	let n = null, r = (...r) => {
		n !== null && clearTimeout(n), n = setTimeout(() => {
			e(...r);
		}, t);
	};
	return r.destroy = () => {
		n !== null && (clearTimeout(n), n = null);
	}, r;
}
// node_modules/bits-ui/dist/internal/elements.js
function en(e, t) {
	return e === t || e.contains(t);
}
function tn(e) {
	return e?.ownerDocument ?? document;
}
// node_modules/bits-ui/dist/internal/dom.js
function nn(e, t) {
	let { clientX: n, clientY: r } = e, i = t.getBoundingClientRect();
	return n < i.left || n > i.right || r < i.top || r > i.bottom;
}
// node_modules/tabbable/dist/index.esm.js
var rn = [
	"input:not([inert]):not([inert] *)",
	"select:not([inert]):not([inert] *)",
	"textarea:not([inert]):not([inert] *)",
	"a[href]:not([inert]):not([inert] *)",
	"area[href]:not([inert]):not([inert] *)",
	"button:not([inert]):not([inert] *)",
	"[tabindex]:not(slot):not([inert]):not([inert] *)",
	"audio[controls]:not([inert]):not([inert] *)",
	"video[controls]:not([inert]):not([inert] *)",
	"[contenteditable]:not([contenteditable=\"false\"]):not([inert]):not([inert] *)",
	"details>summary:first-of-type:not([inert]):not([inert] *)",
	"details:not([inert]):not([inert] *)"
], an = /* #__PURE__ */ rn.join(","), on = typeof Element > "u", sn = on ? function() {} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector, cn = !on && Element.prototype.getRootNode ? function(e) {
	return e == null || e.getRootNode == null ? void 0 : e.getRootNode();
} : function(e) {
	return e?.ownerDocument;
}, ln = function(e, t) {
	t === void 0 && (t = !0);
	var n = e == null || e.getAttribute == null ? void 0 : e.getAttribute("inert");
	return n === "" || n === "true" || t && e && (typeof e.closest == "function" ? e.closest("[inert]") : ln(e.parentNode));
}, un = function(e) {
	var t, n = e == null || e.getAttribute == null || (t = e.getAttribute("contenteditable")) == null ? void 0 : t.toLowerCase();
	return n === "" || n === "true" || n === "plaintext-only";
}, dn = function(e, t, n) {
	if (ln(e)) return [];
	var r = Array.prototype.slice.apply(e.querySelectorAll(an));
	return t && sn.call(e, an) && r.unshift(e), r = r.filter(n), r;
}, fn = function(e, t, n) {
	for (var r = [], i = Array.from(e); i.length;) {
		var a = i.shift();
		if (!ln(a, !1)) {
			if (a.tagName === "SLOT") {
				var o = a.assignedElements(), s = fn(o.length ? o : a.children, !0, n);
				n.flatten ? r.push.apply(r, s) : r.push({
					scopeParent: a,
					candidates: s
				});
			} else {
				sn.call(a, an) && n.filter(a) && (t || !e.includes(a)) && r.push(a);
				var c = a.shadowRoot || typeof n.getShadowRoot == "function" && n.getShadowRoot(a), l = !ln(c, !1) && (!n.shadowRootFilter || n.shadowRootFilter(a));
				if (c && l) {
					var u = fn(c === !0 ? a.children : c.children, !0, n);
					n.flatten ? r.push.apply(r, u) : r.push({
						scopeParent: a,
						candidates: u
					});
				} else i.unshift.apply(i, a.children);
			}
		}
	}
	return r;
}, pn = function(e) {
	return !isNaN(parseInt(e.getAttribute("tabindex"), 10));
}, mn = function(e) {
	if (!e) throw Error("No node provided");
	return e.tabIndex < 0 && (/^(AUDIO|VIDEO|DETAILS)$/.test(e.tagName) || un(e)) && !pn(e) ? 0 : e.tabIndex;
}, hn = function(e, t) {
	var n = mn(e);
	return n < 0 && t && !pn(e) ? 0 : n;
}, gn = function(e, t) {
	return e.tabIndex === t.tabIndex ? e.documentOrder - t.documentOrder : e.tabIndex - t.tabIndex;
}, _n = function(e) {
	return e.tagName === "INPUT";
}, vn = function(e) {
	return _n(e) && e.type === "hidden";
}, yn = function(e) {
	return e.tagName === "DETAILS" && Array.prototype.slice.apply(e.children).some(function(e) {
		return e.tagName === "SUMMARY";
	});
}, bn = function(e, t) {
	for (var n = 0; n < e.length; n++) if (e[n].checked && e[n].form === t) return e[n];
}, xn = function(e) {
	if (!e.name) return !0;
	var t = e.form || cn(e), n = function(e) {
		return t.querySelectorAll("input[type=\"radio\"][name=\"" + e + "\"]");
	}, r;
	if (typeof window < "u" && window.CSS !== void 0 && typeof window.CSS.escape == "function") r = n(window.CSS.escape(e.name));
	else try {
		r = n(e.name);
	} catch (e) {
		return console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s", e.message), !1;
	}
	var i = bn(r, e.form);
	return !i || i === e;
}, Sn = function(e) {
	return _n(e) && e.type === "radio";
}, Cn = function(e) {
	return Sn(e) && !xn(e);
}, wn = function(e) {
	var t = e && cn(e), n = t?.host, r = !1;
	if (t && t !== e) {
		var i, a;
		for (r = !!((i = n) != null && (i = i.ownerDocument) != null && i.contains(n) || e != null && (a = e.ownerDocument) != null && a.contains(e)); !r && n;) {
			var o;
			t = cn(n), n = t?.host, r = !!((o = n) != null && (o = o.ownerDocument) != null && o.contains(n));
		}
	}
	return r;
}, Tn = function(e) {
	var t = e.getBoundingClientRect(), n = t.width, r = t.height;
	return n === 0 && r === 0;
}, En = function(e, t) {
	var n = t.displayCheck, r = t.getShadowRoot;
	if (n === "full-native" && "checkVisibility" in e) return !e.checkVisibility({
		checkOpacity: !1,
		opacityProperty: !1,
		contentVisibilityAuto: !0,
		visibilityProperty: !0,
		checkVisibilityCSS: !0
	});
	var i = getComputedStyle(e).visibility;
	if (i === "hidden" || i === "collapse") return !0;
	var a = sn.call(e, "details>summary:first-of-type") ? e.parentElement : e;
	if (sn.call(a, "details:not([open]) *")) return !0;
	if (!n || n === "full" || n === "full-native" || n === "legacy-full") {
		if (typeof r == "function") {
			for (var o = e; e;) {
				var s = e.parentElement, c = cn(e);
				if (s && !s.shadowRoot && r(s) === !0) return Tn(e);
				e = e.assignedSlot ? e.assignedSlot : !s && c !== e.ownerDocument ? c.host : s;
			}
			e = o;
		}
		if (wn(e)) return !e.getClientRects().length;
		if (n !== "legacy-full") return !0;
	} else if (n === "non-zero-area") return Tn(e);
	return !1;
}, Dn = function(e) {
	if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(e.tagName)) for (var t = e.parentElement; t;) {
		if (t.tagName === "FIELDSET" && t.disabled) {
			for (var n = 0; n < t.children.length; n++) {
				var r = t.children.item(n);
				if (r.tagName === "LEGEND") return sn.call(t, "fieldset[disabled] *") ? !0 : !r.contains(e);
			}
			return !0;
		}
		t = t.parentElement;
	}
	return !1;
}, On = function(e, t) {
	return !(t.disabled || vn(t) || En(t, e) || yn(t) || Dn(t));
}, kn = function(e, t) {
	return !(Cn(t) || mn(t) < 0 || !On(e, t));
}, An = function(e) {
	var t = parseInt(e.getAttribute("tabindex"), 10);
	return !!(isNaN(t) || t >= 0);
}, jn = function(e) {
	var t = [], n = [];
	return e.forEach(function(e, r) {
		var i = !!e.scopeParent, a = i ? e.scopeParent : e, o = hn(a, i), s = i ? jn(e.candidates) : a;
		o === 0 ? i ? t.push.apply(t, s) : t.push(a) : n.push({
			documentOrder: r,
			tabIndex: o,
			item: e,
			isScope: i,
			content: s
		});
	}), n.sort(gn).reduce(function(e, t) {
		return t.isScope ? e.push.apply(e, t.content) : e.push(t.content), e;
	}, []).concat(t);
}, Mn = function(e, t) {
	return t ||= {}, jn(t.getShadowRoot ? fn([e], t.includeContainer, {
		filter: kn.bind(null, t),
		flatten: !1,
		getShadowRoot: t.getShadowRoot,
		shadowRootFilter: An
	}) : dn(e, t.includeContainer, kn.bind(null, t)));
}, Nn = function(e, t) {
	return t ||= {}, t.getShadowRoot ? fn([e], t.includeContainer, {
		filter: On.bind(null, t),
		flatten: !0,
		getShadowRoot: t.getShadowRoot
	}) : dn(e, t.includeContainer, On.bind(null, t));
}, Pn = function(e, t) {
	if (t ||= {}, !e) throw Error("No node provided");
	return sn.call(e, an) !== !1 && kn(t, e);
}, Fn = /* #__PURE__ */ rn.concat("iframe:not([inert]):not([inert] *)").join(","), In = function(e, t) {
	if (t ||= {}, !e) throw Error("No node provided");
	return sn.call(e, Fn) !== !1 && On(t, e);
}, Ln = "data-context-menu-trigger", Rn = "data-context-menu-content";
// node_modules/bits-ui/dist/bits/utilities/dismissible-layer/use-dismissable-layer.svelte.js
new L("Menu.Root"), new L("Menu.Root | Menu.Sub"), new L("Menu.Content"), new L("Menu.Group | Menu.RadioGroup"), new L("Menu.RadioGroup"), new L("Menu.CheckboxGroup"), new Qt("bitsmenuopen", {
	bubbles: !1,
	cancelable: !0
}), Mt({
	component: "menu",
	parts: [
		"trigger",
		"content",
		"sub-trigger",
		"item",
		"group",
		"group-heading",
		"checkbox-group",
		"checkbox-item",
		"radio-group",
		"radio-item",
		"separator",
		"sub-content",
		"arrow"
	]
}), globalThis.bitsDismissableLayers ??= /* @__PURE__ */ new Map();
var zn = class e {
	static create(t) {
		return new e(t);
	}
	opts;
	#e;
	#t;
	#n = { pointerdown: !1 };
	#r = !1;
	#i = !1;
	#a = void 0;
	#o;
	#s = B;
	constructor(e) {
		this.opts = e, this.#t = e.interactOutsideBehavior, this.#e = e.onInteractOutside, this.#o = e.onFocusOutside, O(() => {
			this.#a = tn(this.opts.ref.current);
		});
		let t = B, n = () => {
			this.#g(), globalThis.bitsDismissableLayers.delete(this), this.#d.destroy(), t();
		};
		R([() => this.opts.enabled.current, () => this.opts.ref.current], () => {
			if (this.opts.enabled.current && this.opts.ref.current) return ft(1, () => {
				this.opts.ref.current && (globalThis.bitsDismissableLayers.set(this, this.#t), t(), t = this.#l());
			}), n;
		}), dt(() => {
			this.#g.destroy(), globalThis.bitsDismissableLayers.delete(this), this.#d.destroy(), this.#s(), t();
		});
	}
	#c = (e) => {
		e.defaultPrevented || this.opts.ref.current && pt(() => {
			this.opts.ref.current && !this.#h(e.target) && e.target && !this.#i && this.#o.current?.(e);
		});
	};
	#l() {
		return qe(a(this.#a, "pointerdown", qe(this.#f, this.#m), { capture: !0 }), a(this.#a, "pointerdown", qe(this.#p, this.#d)), a(this.#a, "focusin", this.#c));
	}
	#u = (e) => {
		let t = e;
		t.defaultPrevented && (t = Un(e)), this.#e.current(e);
	};
	#d = $t((e) => {
		if (!this.opts.ref.current) {
			this.#s();
			return;
		}
		let t = this.opts.isValidEvent.current(e, this.opts.ref.current) || Hn(e, this.opts.ref.current);
		if (!this.#r || this.#_() || !t) {
			this.#s();
			return;
		}
		let n = e;
		n.defaultPrevented && (n = Un(n)), this.#t.current !== "close" && this.#t.current !== "defer-otherwise-close" ? this.#s() : e.pointerType === "touch" ? (this.#s(), this.#s = a(this.#a, "click", this.#u, { once: !0 })) : this.#e.current(n);
	}, 10);
	#f = (e) => {
		this.#n[e.type] = !0;
	};
	#p = (e) => {
		this.#n[e.type] = !1;
	};
	#m = () => {
		this.opts.ref.current && (this.#r = Vn(this.opts.ref.current));
	};
	#h = (e) => this.opts.ref.current ? en(this.opts.ref.current, e) : !1;
	#g = $t(() => {
		for (let e in this.#n) this.#n[e] = !1;
		this.#r = !1;
	}, 20);
	#_() {
		return Object.values(this.#n).some(Boolean);
	}
	#v = () => {
		this.#i = !0;
	};
	#y = () => {
		this.#i = !1;
	};
	props = {
		onfocuscapture: this.#v,
		onblurcapture: this.#y
	};
};
function Bn(e = [...globalThis.bitsDismissableLayers]) {
	return e.findLast(([e, { current: t }]) => t === "close" || t === "ignore");
}
function Vn(e) {
	let t = [...globalThis.bitsDismissableLayers], n = Bn(t);
	if (n) return n[0].opts.ref.current === e;
	let [r] = t[0];
	return r.opts.ref.current === e;
}
function Hn(e, t) {
	let n = e.target;
	if (!Lt(n)) return !1;
	let r = !!n.closest(`[${Ln}]`), i = !!t.closest(`[${Rn}]`);
	return "button" in e && e.button > 0 && !r ? !1 : "button" in e && e.button === 0 && r && i ? !0 : r && i ? !1 : tn(n).documentElement.contains(n) && !en(t, n) && nn(e, t);
}
function Un(e) {
	let t = e.currentTarget, n = e.target, r;
	r = e instanceof PointerEvent ? new PointerEvent(e.type, e) : new PointerEvent("pointerdown", e);
	let i = !1;
	return new Proxy(r, { get: (r, a) => a === "currentTarget" ? t : a === "target" ? n : a === "preventDefault" ? () => {
		i = !0, typeof r.preventDefault == "function" && r.preventDefault();
	} : a === "defaultPrevented" ? i : a in r ? r[a] : e[a] });
}
// node_modules/bits-ui/dist/bits/utilities/dismissible-layer/dismissible-layer.svelte
function Wn(e, r) {
	t(r, !0);
	let i = A(r, "interactOutsideBehavior", 3, "close"), a = A(r, "onInteractOutside", 3, B), s = A(r, "onFocusOutside", 3, B), l = A(r, "isValidEvent", 3, () => !1), f = zn.create({
		id: P(() => r.id),
		interactOutsideBehavior: P(() => i()),
		onInteractOutside: P(() => a()),
		enabled: P(() => r.enabled),
		onFocusOutside: P(() => s()),
		isValidEvent: P(() => l()),
		ref: r.ref
	});
	var p = u(), m = k(p);
	n(m, () => r.children ?? c, () => ({ props: f.props })), o(e, p), d();
}
// node_modules/bits-ui/dist/bits/utilities/escape-layer/use-escape-layer.svelte.js
globalThis.bitsEscapeLayers ??= /* @__PURE__ */ new Map();
var Gn = class e {
	static create(t) {
		return new e(t);
	}
	opts;
	domContext;
	constructor(e) {
		this.opts = e, this.domContext = new Et(this.opts.ref);
		let t = B;
		R(() => e.enabled.current, (n) => (n && (globalThis.bitsEscapeLayers.set(this, e.escapeKeydownBehavior), t = this.#e()), () => {
			t(), globalThis.bitsEscapeLayers.delete(this);
		}));
	}
	#e = () => a(this.domContext.getDocument(), "keydown", this.#t, { passive: !1 });
	#t = (e) => {
		if (e.key !== "Escape" || !Kn(this)) return;
		let t = new KeyboardEvent(e.type, e);
		e.preventDefault();
		let n = this.opts.escapeKeydownBehavior.current;
		(n === "close" || n === "defer-otherwise-close") && this.opts.onEscapeKeydown.current(t);
	};
};
function Kn(e) {
	let t = [...globalThis.bitsEscapeLayers], n = t.findLast(([e, { current: t }]) => t === "close" || t === "ignore");
	if (n) return n[0] === e;
	let [r] = t[0];
	return r === e;
}
// node_modules/bits-ui/dist/bits/utilities/escape-layer/escape-layer.svelte
function qn(e, r) {
	t(r, !0);
	let i = A(r, "escapeKeydownBehavior", 3, "close"), a = A(r, "onEscapeKeydown", 3, B);
	Gn.create({
		escapeKeydownBehavior: P(() => i()),
		onEscapeKeydown: P(() => a()),
		enabled: P(() => r.enabled),
		ref: r.ref
	});
	var s = u(), l = k(s);
	n(l, () => r.children ?? c), o(e, s), d();
}
// node_modules/bits-ui/dist/bits/utilities/focus-scope/focus-scope-manager.js
var Jn = class e {
	static instance;
	#e = F([]);
	#t = /* @__PURE__ */ new WeakMap();
	#n = /* @__PURE__ */ new WeakMap();
	static getInstance() {
		return this.instance ||= new e(), this.instance;
	}
	register(e) {
		let t = this.getActive();
		t && t !== e && t.pause();
		let n = document.activeElement;
		n && n !== document.body && this.#n.set(e, n), this.#e.current = this.#e.current.filter((t) => t !== e), this.#e.current.unshift(e);
	}
	unregister(e) {
		this.#e.current = this.#e.current.filter((t) => t !== e);
		let t = this.getActive();
		t && t.resume();
	}
	getActive() {
		return this.#e.current[0];
	}
	setFocusMemory(e, t) {
		this.#t.set(e, t);
	}
	getFocusMemory(e) {
		return this.#t.get(e);
	}
	isActiveScope(e) {
		return this.getActive() === e;
	}
	setPreFocusMemory(e, t) {
		this.#n.set(e, t);
	}
	getPreFocusMemory(e) {
		return this.#n.get(e);
	}
	clearPreFocusMemory(e) {
		this.#n.delete(e);
	}
}, Yn = class e {
	#e = !1;
	#t = null;
	#n = Jn.getInstance();
	#r = [];
	#i;
	constructor(e) {
		this.#i = e;
	}
	get paused() {
		return this.#e;
	}
	pause() {
		this.#e = !0;
	}
	resume() {
		this.#e = !1;
	}
	#a() {
		for (let e of this.#r) e();
		this.#r = [];
	}
	mount(e) {
		this.#t && this.unmount(), this.#t = e, this.#n.register(this), this.#c(), this.#o();
	}
	unmount() {
		this.#t &&= (this.#a(), this.#s(), this.#n.unregister(this), this.#n.clearPreFocusMemory(this), null);
	}
	#o() {
		if (!this.#t) return;
		let e = new CustomEvent("focusScope.onOpenAutoFocus", {
			bubbles: !1,
			cancelable: !0
		});
		this.#i.onOpenAutoFocus.current(e), e.defaultPrevented || requestAnimationFrame(() => {
			if (!this.#t) return;
			let e = this.#u();
			e ? (e.focus(), this.#n.setFocusMemory(this, e)) : this.#t.focus();
		});
	}
	#s() {
		let e = new CustomEvent("focusScope.onCloseAutoFocus", {
			bubbles: !1,
			cancelable: !0
		});
		if (this.#i.onCloseAutoFocus.current?.(e), !e.defaultPrevented) {
			let e = this.#n.getPreFocusMemory(this);
			if (e && document.contains(e)) try {
				e.focus();
			} catch {
				document.body.focus();
			}
		}
	}
	#c() {
		if (!this.#t || !this.#i.trap.current) return;
		let e = this.#t, t = e.ownerDocument;
		this.#r.push(a(t, "focusin", (t) => {
			if (this.#e || !this.#n.isActiveScope(this)) return;
			let n = t.target;
			if (n) {
				if (e.contains(n)) this.#n.setFocusMemory(this, n);
				else {
					let n = this.#n.getFocusMemory(this);
					if (n && e.contains(n) && In(n)) t.preventDefault(), n.focus();
					else {
						let t = this.#u(), n = this.#d()[0];
						(t || n || e).focus();
					}
				}
			}
		}, { capture: !0 }), a(e, "keydown", (e) => {
			if (!this.#i.loop || this.#e || e.key !== "Tab" || !this.#n.isActiveScope(this)) return;
			let n = this.#l();
			if (n.length === 0) return;
			let r = n[0], i = n[n.length - 1];
			!e.shiftKey && t.activeElement === i ? (e.preventDefault(), r.focus()) : e.shiftKey && t.activeElement === r && (e.preventDefault(), i.focus());
		}));
		let n = new MutationObserver(() => {
			let t = this.#n.getFocusMemory(this);
			if (t && !e.contains(t)) {
				let t = this.#u(), n = this.#d()[0], r = t || n;
				r ? (r.focus(), this.#n.setFocusMemory(this, r)) : e.focus();
			}
		});
		n.observe(e, {
			childList: !0,
			subtree: !0
		}), this.#r.push(() => n.disconnect());
	}
	#l() {
		return this.#t ? Mn(this.#t, {
			includeContainer: !1,
			getShadowRoot: !0
		}) : [];
	}
	#u() {
		return this.#l()[0] || null;
	}
	#d() {
		return this.#t ? Nn(this.#t, {
			includeContainer: !1,
			getShadowRoot: !0
		}) : [];
	}
	static use(t) {
		let n = null;
		return R([() => t.ref.current, () => t.enabled.current], ([r, i]) => {
			r && i ? (n ||= new e(t), n.mount(r)) : n &&= (n.unmount(), null);
		}), dt(() => {
			n?.unmount();
		}), { get props() {
			return { tabindex: -1 };
		} };
	}
};
// node_modules/bits-ui/dist/bits/utilities/focus-scope/focus-scope.svelte
function Xn(e, r) {
	t(r, !0);
	let i = A(r, "enabled", 3, !1), a = A(r, "trapFocus", 3, !1), s = A(r, "loop", 3, !1), l = A(r, "onCloseAutoFocus", 3, B), f = A(r, "onOpenAutoFocus", 3, B), p = Yn.use({
		enabled: P(() => i()),
		trap: P(() => a()),
		loop: s(),
		onCloseAutoFocus: P(() => l()),
		onOpenAutoFocus: P(() => f()),
		ref: r.ref
	});
	var m = u(), h = k(m);
	n(h, () => r.focusScope ?? c, () => ({ props: p.props })), o(e, m), d();
}
// node_modules/bits-ui/dist/bits/utilities/text-selection-layer/use-text-selection-layer.svelte.js
var Zn = () => {};
globalThis.bitsTextSelectionLayers ??= /* @__PURE__ */ new Map();
var Qn = class e {
	static create(t) {
		return new e(t);
	}
	opts;
	domContext;
	#e = B;
	#t = !1;
	#n = Zn;
	#r = Zn;
	constructor(e) {
		this.opts = e, this.domContext = new Et(e.ref);
		let t = B;
		R(() => [
			this.opts.enabled.current,
			this.opts.onPointerDown.current,
			this.opts.onPointerUp.current
		], ([e, n, r]) => (this.#t = e, this.#n = n, this.#r = r, e && (globalThis.bitsTextSelectionLayers.set(this, this.opts.enabled), t(), t = this.#i()), () => {
			this.#t = !1, t(), this.#s(), globalThis.bitsTextSelectionLayers.delete(this);
		}));
	}
	#i() {
		return qe(a(this.domContext.getDocument(), "pointerdown", this.#o), a(this.domContext.getDocument(), "pointerup", me(this.#s, this.#a)));
	}
	#a = (e) => {
		this.#r(e);
	};
	#o = (e) => {
		let t = this.opts.ref.current, n = e.target;
		It(t) && It(n) && this.#t && nr(this) && St(t, n) && (this.#n(e), e.defaultPrevented || (this.#e = er(t, this.domContext.getDocument().body)));
	};
	#s = () => {
		this.#e(), this.#e = B;
	};
}, $n = (e) => e.style.userSelect || e.style.webkitUserSelect;
function er(e, t) {
	let n = $n(t), r = $n(e);
	return tr(t, "none"), tr(e, "text"), () => {
		tr(t, n), tr(e, r);
	};
}
function tr(e, t) {
	e.style.userSelect = t, e.style.webkitUserSelect = t;
}
function nr(e) {
	let t = [...globalThis.bitsTextSelectionLayers];
	if (!t.length) return !1;
	let n = t.at(-1);
	return n ? n[0] === e : !1;
}
// node_modules/bits-ui/dist/bits/utilities/text-selection-layer/text-selection-layer.svelte
function rr(e, r) {
	t(r, !0);
	let i = A(r, "preventOverflowTextSelection", 3, !0), a = A(r, "onPointerDown", 3, B), s = A(r, "onPointerUp", 3, B);
	Qn.create({
		id: P(() => r.id),
		onPointerDown: P(() => a()),
		onPointerUp: P(() => s()),
		enabled: P(() => r.enabled && i()),
		ref: r.ref
	});
	var l = u(), f = k(l);
	n(f, () => r.children ?? c), o(e, l), d();
}
// node_modules/bits-ui/dist/internal/use-id.js
globalThis.bitsIdCounter ??= { current: 0 };
function ir(e = "bits") {
	return globalThis.bitsIdCounter.current++, `${e}-${globalThis.bitsIdCounter.current}`;
}
// node_modules/bits-ui/dist/internal/shared-state.svelte.js
var ar = class {
	#e;
	#t = 0;
	#n = S();
	#r;
	constructor(e) {
		this.#e = e;
	}
	#i() {
		--this.#t, this.#r && this.#t <= 0 && (this.#r(), N(this.#n, void 0), this.#r = void 0);
	}
	get(...e) {
		return this.#t += 1, m(this.#n) === void 0 && (this.#r = b(() => {
			N(this.#n, this.#e(...e), !0);
		})), O(() => () => {
			this.#i();
		}), m(this.#n);
	}
}, or = new ae(), sr = S(null), cr = null, lr = null, ur = !1, dr = P(() => {
	for (let e of or.values()) if (e) return !0;
	return !1;
}), fr = null, pr = new ar(() => {
	function e() {
		document.body.setAttribute("style", m(sr) ?? ""), document.body.style.removeProperty("--scrollbar-width"), Pt && cr?.(), N(sr, null);
	}
	function t() {
		lr !== null && (window.clearTimeout(lr), lr = null);
	}
	function n(e, n) {
		t(), ur = !0, fr = Date.now();
		let r = fr, i = () => {
			lr = null, fr === r && (hr(or) ? ur = !1 : (ur = !1, n()));
		}, a = e === null ? 24 : e;
		lr = window.setTimeout(i, a);
	}
	function r() {
		m(sr) === null && or.size === 0 && !ur && N(sr, document.body.getAttribute("style"), !0);
	}
	return R(() => dr.current, () => {
		if (!dr.current) return;
		r(), ur = !1;
		let e = getComputedStyle(document.documentElement), t = getComputedStyle(document.body), n = e.scrollbarGutter?.includes("stable") || t.scrollbarGutter?.includes("stable"), i = window.innerWidth - document.documentElement.clientWidth, o = {
			padding: Number.parseInt(t.paddingRight ?? "0", 10) + i,
			margin: Number.parseInt(t.marginRight ?? "0", 10)
		};
		i > 0 && !n && (document.body.style.paddingRight = `${o.padding}px`, document.body.style.marginRight = `${o.margin}px`, document.body.style.setProperty("--scrollbar-width", `${i}px`)), document.body.style.overflow = "hidden", Pt && (cr = a(document, "touchmove", (e) => {
			e.target === document.documentElement && (e.touches.length > 1 || e.preventDefault());
		}, { passive: !1 })), pt(() => {
			document.body.style.pointerEvents = "none", document.body.style.overflow = "hidden";
		});
	}), dt(() => () => {
		cr?.();
	}), {
		get lockMap() {
			return or;
		},
		resetBodyStyle: e,
		scheduleCleanupIfNoNewLocks: n,
		cancelPendingCleanup: t,
		ensureInitialStyleCaptured: r
	};
}), mr = class {
	#e = ir();
	#t;
	#n = () => null;
	#r;
	locked;
	constructor(e, t = () => null) {
		this.#t = e, this.#n = t, this.#r = pr.get(), this.#r && (this.#r.cancelPendingCleanup(), this.#r.ensureInitialStyleCaptured(), this.#r.lockMap.set(this.#e, this.#t ?? !1), this.locked = P(() => this.#r.lockMap.get(this.#e) ?? !1, (e) => this.#r.lockMap.set(this.#e, e)), dt(() => {
			if (this.#r.lockMap.delete(this.#e), hr(this.#r.lockMap)) return;
			let e = this.#n();
			this.#r.scheduleCleanupIfNoNewLocks(e, () => {
				this.#r.resetBodyStyle();
			});
		}));
	}
};
function hr(e) {
	for (let [t, n] of e) if (n) return !0;
	return !1;
}
// node_modules/bits-ui/dist/bits/utilities/scroll-lock/scroll-lock.svelte
function gr(e, n) {
	t(n, !0);
	let r = A(n, "preventScroll", 3, !0), i = A(n, "restoreScrollDelay", 3, null);
	r() && new mr(r(), () => i()), d();
}
// node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
var _r = [
	"top",
	"right",
	"bottom",
	"left"
], V = Math.min, H = Math.max, vr = Math.round, yr = Math.floor, U = (e) => ({
	x: e,
	y: e
}), br = {
	left: "right",
	right: "left",
	bottom: "top",
	top: "bottom"
};
function xr(e, t, n) {
	return H(e, V(t, n));
}
function W(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function G(e) {
	return e.split("-")[0];
}
function Sr(e) {
	return e.split("-")[1];
}
function Cr(e) {
	return e === "x" ? "y" : "x";
}
function wr(e) {
	return e === "y" ? "height" : "width";
}
function K(e) {
	let t = e[0];
	return t === "t" || t === "b" ? "y" : "x";
}
function Tr(e) {
	return Cr(K(e));
}
function Er(e, t, n) {
	n === void 0 && (n = !1);
	let r = Sr(e), i = Tr(e), a = wr(i), o = i === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
	return t.reference[a] > t.floating[a] && (o = Fr(o)), [o, Fr(o)];
}
function Dr(e) {
	let t = Fr(e);
	return [
		Or(e),
		t,
		Or(t)
	];
}
function Or(e) {
	return e.includes("start") ? e.replace("start", "end") : e.replace("end", "start");
}
var kr = ["left", "right"], Ar = ["right", "left"], jr = ["top", "bottom"], Mr = ["bottom", "top"];
function Nr(e, t, n) {
	switch (e) {
		case "top":
		case "bottom": return n ? t ? Ar : kr : t ? kr : Ar;
		case "left":
		case "right": return t ? jr : Mr;
		default: return [];
	}
}
function Pr(e, t, n, r) {
	let i = Sr(e), a = Nr(G(e), n === "start", r);
	return i && (a = a.map((e) => e + "-" + i), t && (a = a.concat(a.map(Or)))), a;
}
function Fr(e) {
	let t = G(e);
	return br[t] + e.slice(t.length);
}
function Ir(e) {
	return {
		top: e.top ?? 0,
		right: e.right ?? 0,
		bottom: e.bottom ?? 0,
		left: e.left ?? 0
	};
}
function Lr(e) {
	return typeof e == "number" ? {
		top: e,
		right: e,
		bottom: e,
		left: e
	} : Ir(e);
}
function Rr(e) {
	let { x: t, y: n, width: r, height: i } = e;
	return {
		width: r,
		height: i,
		top: n,
		left: t,
		right: t + r,
		bottom: n + i,
		x: t,
		y: n
	};
}
// node_modules/@floating-ui/core/dist/floating-ui.core.mjs
function zr(e, t, n) {
	let { reference: r, floating: i } = e, a = K(t), o = Tr(t), s = wr(o), c = G(t), l = a === "y", u = r.x + r.width / 2 - i.width / 2, d = r.y + r.height / 2 - i.height / 2, f = r[s] / 2 - i[s] / 2, p;
	switch (c) {
		case "top":
			p = {
				x: u,
				y: r.y - i.height
			};
			break;
		case "bottom":
			p = {
				x: u,
				y: r.y + r.height
			};
			break;
		case "right":
			p = {
				x: r.x + r.width,
				y: d
			};
			break;
		case "left":
			p = {
				x: r.x - i.width,
				y: d
			};
			break;
		default: p = {
			x: r.x,
			y: r.y
		};
	}
	let m = Sr(t);
	return m && (p[o] += f * (m === "end" ? 1 : -1) * (n && l ? -1 : 1)), p;
}
async function Br(e, t) {
	t === void 0 && (t = {});
	let { x: n, y: r, platform: i, rects: a, elements: o, strategy: s } = e, { boundary: c = "clippingAncestors", rootBoundary: l = "viewport", elementContext: u = "floating", altBoundary: d = !1, padding: f = 0 } = W(t, e), p = Lr(f), m = o[d ? u === "floating" ? "reference" : "floating" : u], h = Rr(await i.getClippingRect({
		element: await (i.isElement == null ? void 0 : i.isElement(m)) ?? !0 ? m : m.contextElement || await (i.getDocumentElement == null ? void 0 : i.getDocumentElement(o.floating)),
		boundary: c,
		rootBoundary: l,
		strategy: s
	})), g = u === "floating" ? {
		x: n,
		y: r,
		width: a.floating.width,
		height: a.floating.height
	} : a.reference, _ = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(o.floating)), v = await (i.isElement == null ? void 0 : i.isElement(_)) && await (i.getScale == null ? void 0 : i.getScale(_)) || {
		x: 1,
		y: 1
	}, y = Rr(i.convertOffsetParentRelativeRectToViewportRelativeRect ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
		elements: o,
		rect: g,
		offsetParent: _,
		strategy: s
	}) : g);
	return {
		top: (h.top - y.top + p.top) / v.y,
		bottom: (y.bottom - h.bottom + p.bottom) / v.y,
		left: (h.left - y.left + p.left) / v.x,
		right: (y.right - h.right + p.right) / v.x
	};
}
var Vr = 50, Hr = async (e, t, n) => {
	let { placement: r = "bottom", strategy: i = "absolute", middleware: a = [], platform: o } = n, s = o.detectOverflow ? o : {
		...o,
		detectOverflow: Br
	}, c = await (o.isRTL == null ? void 0 : o.isRTL(t)), l = await o.getElementRects({
		reference: e,
		floating: t,
		strategy: i
	}), { x: u, y: d } = zr(l, r, c), f = r, p = 0, m = {};
	for (let n = 0; n < a.length; n++) {
		let h = a[n];
		if (!h) continue;
		let { name: g, fn: _ } = h, { x: v, y, data: b, reset: x } = await _({
			x: u,
			y: d,
			initialPlacement: r,
			placement: f,
			strategy: i,
			middlewareData: m,
			rects: l,
			platform: s,
			elements: {
				reference: e,
				floating: t
			}
		});
		u = v ?? u, d = y ?? d, m[g] = {
			...m[g],
			...b
		}, x && p < Vr && (p++, typeof x == "object" && (x.placement && (f = x.placement), x.rects && (l = x.rects === !0 ? await o.getElementRects({
			reference: e,
			floating: t,
			strategy: i
		}) : x.rects), {x: u, y: d} = zr(l, f, c)), n = -1);
	}
	return {
		x: u,
		y: d,
		placement: f,
		strategy: i,
		middlewareData: m
	};
}, Ur = (e) => ({
	name: "arrow",
	options: e,
	async fn(t) {
		let { x: n, y: r, placement: i, rects: a, platform: o, elements: s, middlewareData: c } = t, { element: l, padding: u = 0 } = W(e, t) || {};
		if (l == null) return {};
		let d = Lr(u), f = {
			x: n,
			y: r
		}, p = Tr(i), m = wr(p), h = await o.getDimensions(l), g = p === "y", _ = g ? "top" : "left", v = g ? "bottom" : "right", y = g ? "clientHeight" : "clientWidth", b = a.reference[m] + a.reference[p] - f[p] - a.floating[m], x = f[p] - a.reference[p], S = await (o.getOffsetParent == null ? void 0 : o.getOffsetParent(l)), C = S ? S[y] : 0;
		C && await (o.isElement == null ? void 0 : o.isElement(S)) || (C = s.floating[y] || a.floating[m]);
		let w = b / 2 - x / 2, T = C / 2 - h[m] / 2 - 1, E = V(d[_], T), D = V(d[v], T), O = C - h[m] - D, k = C / 2 - h[m] / 2 + w, A = xr(E, k, O), j = !c.arrow && Sr(i) != null && k !== A && a.reference[m] / 2 - (k < E ? E : D) - h[m] / 2 < 0, M = j ? k < E ? k - E : k - O : 0;
		return {
			[p]: f[p] + M,
			data: {
				[p]: A,
				centerOffset: k - A - M,
				...j && { alignmentOffset: M }
			},
			reset: j
		};
	}
}), Wr = function(e) {
	return e === void 0 && (e = {}), {
		name: "flip",
		options: e,
		async fn(t) {
			var n;
			let { placement: r, middlewareData: i, rects: a, initialPlacement: o, platform: s, elements: c } = t, { mainAxis: l = !0, crossAxis: u = !0, fallbackPlacements: d, fallbackStrategy: f = "bestFit", fallbackAxisSideDirection: p = "none", flipAlignment: m = !0, ...h } = W(e, t);
			if ((n = i.arrow) != null && n.alignmentOffset) return {};
			let g = G(r), _ = K(o), v = G(o) === o, y = await (s.isRTL == null ? void 0 : s.isRTL(c.floating)), b = d || (v || !m ? [Fr(o)] : Dr(o)), x = p !== "none";
			!d && x && b.push(...Pr(o, m, p, y));
			let S = [o, ...b], C = await s.detectOverflow(t, h), w = [], T = i.flip?.overflows || [];
			if (l && w.push(C[g]), u) {
				let e = Er(r, a, y);
				w.push(C[e[0]], C[e[1]]);
			}
			if (T = [...T, {
				placement: r,
				overflows: w
			}], !w.every((e) => e <= 0)) {
				let e = (i.flip?.index || 0) + 1, t = S[e];
				if (t && (u !== "alignment" || _ === K(t) || T.every((e) => K(e.placement) !== _ || e.overflows[0] > 0))) return {
					data: {
						index: e,
						overflows: T
					},
					reset: { placement: t }
				};
				let n = T.filter((e) => e.overflows[0] <= 0).sort((e, t) => e.overflows[1] - t.overflows[1])[0]?.placement;
				if (!n) switch (f) {
					case "bestFit": {
						let e = T.filter((e) => {
							if (x) {
								let t = K(e.placement);
								return t === _ || t === "y";
							}
							return !0;
						}).map((e) => [e.placement, e.overflows.filter((e) => e > 0).reduce((e, t) => e + t, 0)]).sort((e, t) => e[1] - t[1])[0]?.[0];
						e && (n = e);
						break;
					}
					case "initialPlacement": n = o;
				}
				if (r !== n) return { reset: { placement: n } };
			}
			return {};
		}
	};
};
function Gr(e, t) {
	return {
		top: e.top - t.height,
		right: e.right - t.width,
		bottom: e.bottom - t.height,
		left: e.left - t.width
	};
}
function Kr(e) {
	return _r.some((t) => e[t] >= 0);
}
var qr = function(e) {
	return e === void 0 && (e = {}), {
		name: "hide",
		options: e,
		async fn(t) {
			let { rects: n, platform: r } = t, { strategy: i = "referenceHidden", ...a } = W(e, t);
			switch (i) {
				case "referenceHidden": {
					let e = Gr(await r.detectOverflow(t, {
						...a,
						elementContext: "reference"
					}), n.reference);
					return { data: {
						referenceHiddenOffsets: e,
						referenceHidden: Kr(e)
					} };
				}
				case "escaped": {
					let e = Gr(await r.detectOverflow(t, {
						...a,
						altBoundary: !0
					}), n.floating);
					return { data: {
						escapedOffsets: e,
						escaped: Kr(e)
					} };
				}
				default: return {};
			}
		}
	};
}, Jr = /*#__PURE__*/ new Set(["left", "top"]);
async function Yr(e, t) {
	let { placement: n, platform: r, elements: i } = e, a = await (r.isRTL == null ? void 0 : r.isRTL(i.floating)), o = G(n), s = Sr(n), c = K(n) === "y", l = Jr.has(o) ? -1 : 1, u = a && c ? -1 : 1, d = W(t, e), { mainAxis: f, crossAxis: p, alignmentAxis: m } = typeof d == "number" ? {
		mainAxis: d,
		crossAxis: 0,
		alignmentAxis: null
	} : {
		mainAxis: d.mainAxis || 0,
		crossAxis: d.crossAxis || 0,
		alignmentAxis: d.alignmentAxis
	};
	return s && typeof m == "number" && (p = s === "end" ? m * -1 : m), c ? {
		x: p * u,
		y: f * l
	} : {
		x: f * l,
		y: p * u
	};
}
var Xr = function(e) {
	return e === void 0 && (e = 0), {
		name: "offset",
		options: e,
		async fn(t) {
			var n;
			let { x: r, y: i, placement: a, middlewareData: o } = t, s = await Yr(t, e);
			return a === o.offset?.placement && (n = o.arrow) != null && n.alignmentOffset ? {} : {
				x: r + s.x,
				y: i + s.y,
				data: {
					...s,
					placement: a
				}
			};
		}
	};
}, Zr = function(e) {
	return e === void 0 && (e = {}), {
		name: "shift",
		options: e,
		async fn(t) {
			let { x: n, y: r, placement: i, platform: a } = t, { mainAxis: o = !0, crossAxis: s = !1, limiter: c = { fn: (e) => {
				let { x: t, y: n } = e;
				return {
					x: t,
					y: n
				};
			} }, ...l } = W(e, t), u = {
				x: n,
				y: r
			}, d = await a.detectOverflow(t, l), f = K(i), p = Cr(f), m = u[p], h = u[f], g = (e, t) => xr(t + d[e === "y" ? "top" : "left"], t, t - d[e === "y" ? "bottom" : "right"]);
			o && (m = g(p, m)), s && (h = g(f, h));
			let _ = c.fn({
				...t,
				[p]: m,
				[f]: h
			});
			return {
				..._,
				data: {
					x: _.x - n,
					y: _.y - r,
					enabled: {
						[p]: o,
						[f]: s
					}
				}
			};
		}
	};
}, Qr = function(e) {
	return e === void 0 && (e = {}), {
		options: e,
		fn(t) {
			let { x: n, y: r, placement: i, rects: a, middlewareData: o } = t, { offset: s = 0, mainAxis: c = !0, crossAxis: l = !0 } = W(e, t), u = {
				x: n,
				y: r
			}, d = K(i), f = Cr(d), p = u[f], m = u[d], h = W(s, t), g = typeof h == "number" ? {
				mainAxis: h,
				crossAxis: 0
			} : {
				mainAxis: h.mainAxis ?? 0,
				crossAxis: h.crossAxis ?? 0
			};
			if (c) {
				let e = f === "y" ? "height" : "width", t = a.reference[f] - a.floating[e] + g.mainAxis, n = a.reference[f] + a.reference[e] - g.mainAxis;
				p < t ? p = t : p > n && (p = n);
			}
			if (l) {
				let e = f === "y" ? "width" : "height", t = Jr.has(G(i)), n = a.reference[d] - a.floating[e] + (t && o.offset?.[d] || 0) + (t ? 0 : g.crossAxis), r = a.reference[d] + a.reference[e] + (t ? 0 : o.offset?.[d] || 0) - (t ? g.crossAxis : 0);
				m < n ? m = n : m > r && (m = r);
			}
			return {
				[f]: p,
				[d]: m
			};
		}
	};
}, $r = function(e) {
	return e === void 0 && (e = {}), {
		name: "size",
		options: e,
		async fn(t) {
			let { placement: n, rects: r, platform: i, elements: a } = t, { apply: o = () => {}, ...s } = W(e, t), c = await i.detectOverflow(t, s), l = G(n), u = Sr(n), d = K(n) === "y", { width: f, height: p } = r.floating, m, h;
			l === "top" || l === "bottom" ? (m = l, h = u === (await (i.isRTL == null ? void 0 : i.isRTL(a.floating)) ? "start" : "end") ? "left" : "right") : (h = l, m = u === "end" ? "top" : "bottom");
			let g = p - c.top - c.bottom, _ = f - c.left - c.right, v = V(p - c[m], g), y = V(f - c[h], _), b = t.middlewareData.shift, x = !b, S = v, C = y;
			b != null && b.enabled.x && (C = _), b != null && b.enabled.y && (S = g), x && !u && (d ? C = f - 2 * H(c.left, c.right) : S = p - 2 * H(c.top, c.bottom)), await o({
				...t,
				availableWidth: C,
				availableHeight: S
			});
			let w = await i.getDimensions(a.floating);
			return f !== w.width || p !== w.height ? { reset: { rects: !0 } } : {};
		}
	};
};
// node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function ei() {
	return typeof window < "u";
}
function ti(e) {
	return ni(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function q(e) {
	var t;
	return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function J(e) {
	return ((ni(e) ? e.ownerDocument : e.document) || window.document)?.documentElement;
}
function ni(e) {
	return ei() ? e instanceof Node || e instanceof q(e).Node : !1;
}
function Y(e) {
	return ei() ? e instanceof Element || e instanceof q(e).Element : !1;
}
function X(e) {
	return ei() ? e instanceof HTMLElement || e instanceof q(e).HTMLElement : !1;
}
function ri(e) {
	return !ei() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof q(e).ShadowRoot;
}
function ii(e) {
	let { overflow: t, overflowX: n, overflowY: r, display: i } = Q(e);
	return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && i !== "inline" && i !== "contents";
}
function ai(e) {
	return /^(table|td|th)$/.test(ti(e));
}
function oi(e) {
	try {
		if (e.matches(":popover-open")) return !0;
	} catch {}
	try {
		return e.matches(":modal");
	} catch {
		return !1;
	}
}
var si = /transform|translate|scale|rotate|perspective|filter/, ci = /paint|layout|strict|content/, Z = (e) => !!e && e !== "none", li;
function ui(e) {
	let t = Y(e) ? Q(e) : e;
	return Z(t.transform) || Z(t.translate) || Z(t.scale) || Z(t.rotate) || Z(t.perspective) || !fi() && (Z(t.backdropFilter) || Z(t.filter)) || si.test(t.willChange || "") || ci.test(t.contain || "");
}
function di(e) {
	let t = hi(e);
	for (; X(t) && !pi(t);) {
		if (ui(t)) return t;
		if (oi(t)) return null;
		t = hi(t);
	}
	return null;
}
function fi() {
	return li ??= typeof CSS < "u" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none"), li;
}
function pi(e) {
	return /^(html|body|#document)$/.test(ti(e));
}
function Q(e) {
	return q(e).getComputedStyle(e);
}
function mi(e) {
	return Y(e) ? {
		scrollLeft: e.scrollLeft,
		scrollTop: e.scrollTop
	} : {
		scrollLeft: e.scrollX,
		scrollTop: e.scrollY
	};
}
function hi(e) {
	if (ti(e) === "html") return e;
	let t = e.assignedSlot || e.parentNode || ri(e) && e.host || J(e);
	return ri(t) ? t.host : t;
}
function gi(e) {
	let t = hi(e);
	return pi(t) ? (e.ownerDocument || e).body : X(t) && ii(t) ? t : gi(t);
}
function _i(e, t, n) {
	t === void 0 && (t = []), n === void 0 && (n = !0);
	let r = gi(e), i = r === e.ownerDocument?.body, a = q(r);
	if (i) {
		let e = vi(a);
		return t.concat(a, a.visualViewport || [], ii(r) ? r : [], e && n ? _i(e) : []);
	}
	return t.concat(r, _i(r, [], n));
}
function vi(e) {
	return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
// node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function yi(e) {
	let t = Q(e), n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0, i = X(e), a = i ? e.offsetWidth : n, o = i ? e.offsetHeight : r, s = vr(n) !== a || vr(r) !== o;
	return s && (n = a, r = o), {
		width: n,
		height: r,
		$: s
	};
}
function bi(e) {
	return Y(e) ? e : e.contextElement;
}
function xi(e) {
	let t = bi(e);
	if (!X(t)) return U(1);
	let n = t.getBoundingClientRect(), { width: r, height: i, $: a } = yi(t), o = (a ? vr(n.width) : n.width) / r, s = (a ? vr(n.height) : n.height) / i;
	return o && Number.isFinite(o) || (o = 1), s && Number.isFinite(s) || (s = 1), {
		x: o,
		y: s
	};
}
var Si = /*#__PURE__*/ U(0);
function Ci(e) {
	let t = q(e);
	return !fi() || !t.visualViewport ? Si : {
		x: t.visualViewport.offsetLeft,
		y: t.visualViewport.offsetTop
	};
}
function wi(e, t, n) {
	return t === void 0 && (t = !1), !!n && t && n === q(e);
}
function Ti(e, t, n, r) {
	t === void 0 && (t = !1), n === void 0 && (n = !1);
	let i = e.getBoundingClientRect(), a = bi(e), o = U(1);
	t && (r ? Y(r) && (o = xi(r)) : o = xi(e));
	let s = wi(a, n, r) ? Ci(a) : U(0), c = (i.left + s.x) / o.x, l = (i.top + s.y) / o.y, u = i.width / o.x, d = i.height / o.y;
	if (a && r) {
		let e = q(a), t = Y(r) ? q(r) : r, n = e, i = vi(n);
		for (; i && t !== n;) {
			let e = xi(i), t = i.getBoundingClientRect(), r = Q(i), a = t.left + (i.clientLeft + parseFloat(r.paddingLeft)) * e.x, o = t.top + (i.clientTop + parseFloat(r.paddingTop)) * e.y;
			c *= e.x, l *= e.y, u *= e.x, d *= e.y, c += a, l += o, n = q(i), i = vi(n);
		}
	}
	return Rr({
		width: u,
		height: d,
		x: c,
		y: l
	});
}
function Ei(e, t) {
	let n = mi(e).scrollLeft;
	return t ? t.left + n : Ti(J(e)).left + n;
}
function Di(e, t) {
	let n = e.getBoundingClientRect();
	return {
		x: n.left + t.scrollLeft - Ei(e, n),
		y: n.top + t.scrollTop
	};
}
function Oi(e) {
	let { elements: t, rect: n, offsetParent: r, strategy: i } = e, a = i === "fixed", o = J(r), s = t ? oi(t.floating) : !1;
	if (r === o || s && a) return n;
	let c = {
		scrollLeft: 0,
		scrollTop: 0
	}, l = U(1), u = U(0), d = X(r);
	if ((d || !a) && ((ti(r) !== "body" || ii(o)) && (c = mi(r)), d)) {
		let e = Ti(r);
		l = xi(r), u.x = e.x + r.clientLeft, u.y = e.y + r.clientTop;
	}
	let f = o && !d && !a ? Di(o, c) : U(0);
	return {
		width: n.width * l.x,
		height: n.height * l.y,
		x: n.x * l.x - c.scrollLeft * l.x + u.x + f.x,
		y: n.y * l.y - c.scrollTop * l.y + u.y + f.y
	};
}
function ki(e) {
	return e.getClientRects ? Array.from(e.getClientRects()) : [];
}
function Ai(e) {
	let t = mi(e), n = e.ownerDocument.body, r = H(e.scrollWidth, e.clientWidth, n.scrollWidth, n.clientWidth), i = H(e.scrollHeight, e.clientHeight, n.scrollHeight, n.clientHeight), a = -t.scrollLeft + Ei(e), o = -t.scrollTop;
	return Q(n).direction === "rtl" && (a += H(e.clientWidth, n.clientWidth) - r), {
		width: r,
		height: i,
		x: a,
		y: o
	};
}
var ji = 25;
function Mi(e, t, n) {
	n === void 0 && (n = "viewport");
	let r = n === "layoutViewport", i = q(e), a = J(e), o = i.visualViewport, s = a.clientWidth, c = a.clientHeight, l = 0, u = 0;
	if (o) {
		let e = !fi() || t === "fixed";
		r ? e || (l = -o.offsetLeft, u = -o.offsetTop) : (s = o.width, c = o.height, e && (l = o.offsetLeft, u = o.offsetTop));
	}
	if (Ei(a) <= 0) {
		let e = a.ownerDocument, t = e.body, n = getComputedStyle(t), r = e.compatMode === "CSS1Compat" && parseFloat(n.marginLeft) + parseFloat(n.marginRight) || 0, i = Math.abs(a.clientWidth - t.clientWidth - r), o = getComputedStyle(a).scrollbarGutter === "stable both-edges" ? i / 2 : i;
		o <= ji && (s -= o);
	}
	return {
		width: s,
		height: c,
		x: l,
		y: u
	};
}
function Ni(e, t) {
	let n = Ti(e, !0, t === "fixed"), r = n.top + e.clientTop, i = n.left + e.clientLeft, a = xi(e);
	return {
		width: e.clientWidth * a.x,
		height: e.clientHeight * a.y,
		x: i * a.x,
		y: r * a.y
	};
}
function Pi(e, t, n) {
	let r;
	if (t === "viewport" || t === "layoutViewport") r = Mi(e, n, t);
	else if (t === "document") r = Ai(J(e));
	else if (Y(t)) r = Ni(t, n);
	else {
		let n = Ci(e);
		r = {
			x: t.x - n.x,
			y: t.y - n.y,
			width: t.width,
			height: t.height
		};
	}
	return Rr(r);
}
function Fi(e, t) {
	let n = t.get(e);
	if (n) return n;
	let r = _i(e, [], !1).filter((e) => Y(e) && ti(e) !== "body"), i = null, a = Q(e).position === "fixed", o = a ? hi(e) : e;
	for (; Y(o) && !pi(o);) {
		let e = Q(o), t = ui(o), n = i ? i.position : a ? "fixed" : "";
		!t && (n === "fixed" || n === "absolute" && e.position === "static") ? r = r.filter((e) => e !== o) : i = e, o = hi(o);
	}
	return t.set(e, r), r;
}
function Ii(e) {
	let { element: t, boundary: n, rootBoundary: r, strategy: i } = e, a = [...n === "clippingAncestors" ? oi(t) ? [] : Fi(t, this._c) : [].concat(n), r], o = Pi(t, a[0], i), s = o.top, c = o.right, l = o.bottom, u = o.left;
	for (let e = 1; e < a.length; e++) {
		let n = Pi(t, a[e], i);
		s = H(n.top, s), c = V(n.right, c), l = V(n.bottom, l), u = H(n.left, u);
	}
	return {
		width: c - u,
		height: l - s,
		x: u,
		y: s
	};
}
function Li(e) {
	let { width: t, height: n } = yi(e);
	return {
		width: t,
		height: n
	};
}
function Ri(e, t, n) {
	let r = X(t), i = J(t), a = n === "fixed", o = Ti(e, !0, a, t), s = {
		scrollLeft: 0,
		scrollTop: 0
	}, c = U(0);
	if ((r || !a) && ((ti(t) !== "body" || ii(i)) && (s = mi(t)), r)) {
		let e = Ti(t, !0, a, t);
		c.x = e.x + t.clientLeft, c.y = e.y + t.clientTop;
	}
	!r && i && (c.x = Ei(i));
	let l = i && !r && !a ? Di(i, s) : U(0);
	return {
		x: o.left + s.scrollLeft - c.x - l.x,
		y: o.top + s.scrollTop - c.y - l.y,
		width: o.width,
		height: o.height
	};
}
function zi(e) {
	return Q(e).position === "static";
}
function Bi(e, t) {
	if (!X(e) || Q(e).position === "fixed") return null;
	if (t) return t(e);
	let n = e.offsetParent;
	return J(e) === n && (n = n.ownerDocument.body), n;
}
function Vi(e, t) {
	let n = q(e);
	if (oi(e)) return n;
	if (!X(e)) {
		let t = hi(e);
		for (; t && !pi(t);) {
			if (Y(t) && !zi(t)) return t;
			t = hi(t);
		}
		return n;
	}
	let r = Bi(e, t);
	for (; r && ai(r) && zi(r);) r = Bi(r, t);
	return r && pi(r) && zi(r) && !ui(r) ? n : r || di(e) || n;
}
var Hi = async function(e) {
	let t = this.getOffsetParent || Vi, n = this.getDimensions, r = await n(e.floating);
	return {
		reference: Ri(e.reference, await t(e.floating), e.strategy),
		floating: {
			x: 0,
			y: 0,
			width: r.width,
			height: r.height
		}
	};
};
function Ui(e) {
	return Q(e).direction === "rtl";
}
var Wi = {
	convertOffsetParentRelativeRectToViewportRelativeRect: Oi,
	getDocumentElement: J,
	getClippingRect: Ii,
	getOffsetParent: Vi,
	getElementRects: Hi,
	getClientRects: ki,
	getDimensions: Li,
	getScale: xi,
	isElement: Y,
	isRTL: Ui
};
function Gi(e, t) {
	return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function Ki(e, t, n) {
	let r = null, i, a = J(e);
	function o() {
		var e;
		clearTimeout(i), (e = r) == null || e.disconnect(), r = null;
	}
	function s(n, c) {
		n === void 0 && (n = !1), c === void 0 && (c = 1), o();
		let l = e.getBoundingClientRect(), { left: u, top: d, width: f, height: p } = l;
		if (n || t(), !f || !p) return;
		let m = yr(d), h = yr(a.clientWidth - (u + f)), g = yr(a.clientHeight - (d + p)), _ = yr(u), v = {
			rootMargin: -m + "px " + -h + "px " + -g + "px " + -_ + "px",
			threshold: H(0, V(1, c)) || 1
		}, y = !0;
		function b(t) {
			let n = t[0].intersectionRatio;
			if (!Gi(l, e.getBoundingClientRect())) return s();
			if (n !== c) {
				if (!y) return s();
				n ? s(!1, n) : i = setTimeout(() => {
					s(!1, 1e-7);
				}, 1e3);
			}
			y = !1;
		}
		try {
			r = new IntersectionObserver(b, {
				...v,
				root: a.ownerDocument
			});
		} catch {
			r = new IntersectionObserver(b, v);
		}
		r.observe(e);
	}
	let c = q(e), l = () => s(n);
	return c.addEventListener("resize", l), s(!0), () => {
		c.removeEventListener("resize", l), o();
	};
}
function qi(e, t, n, r) {
	r === void 0 && (r = {});
	let { ancestorScroll: i = !0, ancestorResize: a = !0, elementResize: o = typeof ResizeObserver == "function", layoutShift: s = typeof IntersectionObserver == "function", animationFrame: c = !1 } = r, l = bi(e), u = i || a ? [...l ? _i(l) : [], ...t ? _i(t) : []] : [];
	u.forEach((e) => {
		i && e.addEventListener("scroll", n), a && e.addEventListener("resize", n);
	});
	let d = l && s ? Ki(l, n, a) : null, f = -1, p = null;
	o && (p = new ResizeObserver((e) => {
		let [r] = e;
		r && r.target === l && p && t && (p.unobserve(t), cancelAnimationFrame(f), f = requestAnimationFrame(() => {
			var e;
			(e = p) == null || e.observe(t);
		})), n();
	}), l && !c && p.observe(l), t && p.observe(t));
	let m, h = c ? Ti(e) : null;
	c && g();
	function g() {
		let t = Ti(e);
		h && !Gi(h, t) && n(), h = t, m = requestAnimationFrame(g);
	}
	return n(), () => {
		var e;
		u.forEach((e) => {
			i && e.removeEventListener("scroll", n), a && e.removeEventListener("resize", n);
		}), d?.(), (e = p) == null || e.disconnect(), p = null, c && cancelAnimationFrame(m);
	};
}
var Ji = Xr, Yi = Zr, Xi = Wr, Zi = $r, Qi = qr, $i = Ur, ea = Qr, ta = (e, t, n) => {
	let r = /* @__PURE__ */ new Map(), i = n ?? {}, a = {
		...Wi,
		...i.platform,
		_c: r
	};
	return Hr(e, t, {
		...i,
		platform: a
	});
};
// node_modules/bits-ui/dist/internal/floating-svelte/floating-utils.svelte.js
function na(e) {
	return typeof e == "function" ? e() : e;
}
function ra(e) {
	return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function ia(e, t) {
	let n = ra(e);
	return Math.round(t * n) / n;
}
function aa(e) {
	return {
		[`--bits-${e}-content-transform-origin`]: "var(--bits-floating-transform-origin)",
		[`--bits-${e}-content-available-width`]: "var(--bits-floating-available-width)",
		[`--bits-${e}-content-available-height`]: "var(--bits-floating-available-height)",
		[`--bits-${e}-anchor-width`]: "var(--bits-floating-anchor-width)",
		[`--bits-${e}-anchor-height`]: "var(--bits-floating-anchor-height)"
	};
}
// node_modules/bits-ui/dist/internal/floating-svelte/use-floating.svelte.js
function oa(e) {
	let t = e.whileElementsMounted, n = E(() => na(e.open) ?? !0), r = E(() => na(e.middleware)), i = E(() => na(e.transform) ?? !0), a = E(() => na(e.placement) ?? "bottom"), o = E(() => na(e.strategy) ?? "absolute"), s = E(() => na(e.sideOffset) ?? 0), c = E(() => na(e.alignOffset) ?? 0), l = e.reference, u = S(0), d = S(0), f = F(null), p = S(y(m(o))), h = S(y(m(a))), g = S(y({})), _ = S(!1), v = !1, b = 0, x = E(() => {
		let e = f.current ? ia(f.current, m(u)) : m(u), t = f.current ? ia(f.current, m(d)) : m(d);
		return m(i) ? {
			position: m(p),
			left: "0",
			top: "0",
			transform: `translate(${e}px, ${t}px)`,
			...f.current && ra(f.current) >= 1.5 && { willChange: "transform" }
		} : {
			position: m(p),
			left: `${e}px`,
			top: `${t}px`
		};
	}), C;
	function w() {
		if (l.current === null || f.current === null) return;
		let e = l.current, t = f.current, i = ++b;
		ta(e, t, {
			middleware: m(r),
			placement: m(a),
			strategy: m(o)
		}).then((r) => {
			if (i === b && l.current === e && f.current === t) {
				if (sa(e)) N(g, {
					...m(g),
					hide: {
						...m(g).hide,
						referenceHidden: !0
					}
				}, !0);
				else {
					if (!m(n) && m(u) !== 0 && m(d) !== 0) {
						let e = Math.max(Math.abs(m(s)), Math.abs(m(c)), 15);
						if (r.x <= e && r.y <= e) return;
					}
					N(u, r.x, !0), N(d, r.y, !0), N(p, r.strategy, !0), N(h, r.placement, !0), N(g, r.middlewareData, !0), N(_, !0);
				}
			}
		});
	}
	function T() {
		typeof C == "function" && (C(), C = void 0), b++;
	}
	function D() {
		T(), t === void 0 ? w() : m(n) && l.current !== null && f.current !== null && (C = t(l.current, f.current, w));
	}
	function k() {
		!m(n) && f.current === null && N(_, !1);
	}
	function A() {
		return [
			m(r),
			m(a),
			m(o),
			m(s),
			m(c),
			m(n)
		];
	}
	return O(() => {
		t === void 0 && m(n) && w();
	}), O(D), O(() => {
		t !== void 0 && (A(), m(n) && m(_) ? v ? w() : v = !0 : v = !1);
	}), O(k), O(() => T), {
		floating: f,
		reference: l,
		get strategy() {
			return m(p);
		},
		get placement() {
			return m(h);
		},
		get middlewareData() {
			return m(g);
		},
		get isPositioned() {
			return m(_);
		},
		get floatingStyles() {
			return m(x);
		},
		get update() {
			return w;
		}
	};
}
function sa(e) {
	return e instanceof Element ? !e.isConnected || e instanceof HTMLElement && e.hidden ? !0 : e.getClientRects().length === 0 : !1;
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/use-floating-layer.svelte.js
var ca = {
	top: "bottom",
	right: "left",
	bottom: "top",
	left: "right"
}, la = new L("Floating.Root"), ua = new L("Floating.Content"), da = new L("Floating.Root"), fa = class e {
	static create(t = !1) {
		return t ? da.set(new e()) : la.set(new e());
	}
	anchorNode = F(null);
	customAnchorNode = F(null);
	triggerNode = F(null);
	constructor() {
		O(() => {
			this.customAnchorNode.current ? typeof this.customAnchorNode.current == "string" ? this.anchorNode.current = document.querySelector(this.customAnchorNode.current) : this.anchorNode.current = this.customAnchorNode.current : this.anchorNode.current = this.triggerNode.current;
		});
	}
}, pa = class e {
	static create(t, n = !1) {
		return n ? ua.set(new e(t, da.get())) : ua.set(new e(t, la.get()));
	}
	opts;
	root;
	contentRef = F(null);
	wrapperRef = F(null);
	arrowRef = F(null);
	contentAttachment = Dt(this.contentRef);
	wrapperAttachment = Dt(this.wrapperRef);
	arrowAttachment = Dt(this.arrowRef);
	arrowId = F(ir());
	#e = E(() => {
		if (typeof this.opts.style == "string") return Ke(this.opts.style);
		if (!this.opts.style) return {};
	});
	#t = void 0;
	#n = new ut(() => this.arrowRef.current ?? void 0);
	#r = E(() => this.#n?.width ?? 0);
	#i = E(() => this.#n?.height ?? 0);
	#a = E(() => this.opts.side?.current + (this.opts.align.current === "center" ? "" : `-${this.opts.align.current}`));
	#o = E(() => Array.isArray(this.opts.collisionBoundary.current) ? this.opts.collisionBoundary.current : [this.opts.collisionBoundary.current]);
	#s = E(() => m(this.#o).length > 0);
	get hasExplicitBoundaries() {
		return m(this.#s);
	}
	set hasExplicitBoundaries(e) {
		N(this.#s, e);
	}
	#c = E(() => ({
		padding: this.opts.collisionPadding.current,
		boundary: m(this.#o).filter(zt),
		altBoundary: this.hasExplicitBoundaries
	}));
	get detectOverflowOptions() {
		return m(this.#c);
	}
	set detectOverflowOptions(e) {
		N(this.#c, e);
	}
	#l = S(void 0);
	#u = S(void 0);
	#d = S(void 0);
	#f = S(void 0);
	#p = E(() => [
		Ji({
			mainAxis: this.opts.sideOffset.current + m(this.#i),
			alignmentAxis: this.opts.alignOffset.current
		}),
		this.opts.avoidCollisions.current && Yi({
			mainAxis: !0,
			crossAxis: !1,
			limiter: this.opts.sticky.current === "partial" ? ea() : void 0,
			...this.detectOverflowOptions
		}),
		this.opts.avoidCollisions.current && Xi({ ...this.detectOverflowOptions }),
		Zi({
			...this.detectOverflowOptions,
			apply: ({ rects: e, availableWidth: t, availableHeight: n }) => {
				let { width: r, height: i } = e.reference;
				N(this.#l, t, !0), N(this.#u, n, !0), N(this.#d, r, !0), N(this.#f, i, !0);
			}
		}),
		this.arrowRef.current && $i({
			element: this.arrowRef.current,
			padding: this.opts.arrowPadding.current
		}),
		ha({
			arrowWidth: m(this.#r),
			arrowHeight: m(this.#i)
		}),
		this.opts.hideWhenDetached.current && Qi({
			strategy: "referenceHidden",
			...this.detectOverflowOptions
		})
	].filter(Boolean));
	get middleware() {
		return m(this.#p);
	}
	set middleware(e) {
		N(this.#p, e);
	}
	floating;
	#m = E(() => _a(this.floating.placement));
	get placedSide() {
		return m(this.#m);
	}
	set placedSide(e) {
		N(this.#m, e);
	}
	#h = E(() => va(this.floating.placement));
	get placedAlign() {
		return m(this.#h);
	}
	set placedAlign(e) {
		N(this.#h, e);
	}
	#g = E(() => this.floating.middlewareData.arrow?.x ?? 0);
	get arrowX() {
		return m(this.#g);
	}
	set arrowX(e) {
		N(this.#g, e);
	}
	#_ = E(() => this.floating.middlewareData.arrow?.y ?? 0);
	get arrowY() {
		return m(this.#_);
	}
	set arrowY(e) {
		N(this.#_, e);
	}
	#v = E(() => this.floating.middlewareData.arrow?.centerOffset !== 0);
	get cannotCenterArrow() {
		return m(this.#v);
	}
	set cannotCenterArrow(e) {
		N(this.#v, e);
	}
	#y = S();
	get contentZIndex() {
		return m(this.#y);
	}
	set contentZIndex(e) {
		N(this.#y, e, !0);
	}
	#b = E(() => ca[this.placedSide]);
	get arrowBaseSide() {
		return m(this.#b);
	}
	set arrowBaseSide(e) {
		N(this.#b, e);
	}
	#x = E(() => ({
		id: this.opts.wrapperId.current,
		"data-bits-floating-content-wrapper": "",
		style: {
			...this.floating.floatingStyles,
			transform: this.floating.isPositioned ? this.floating.floatingStyles.transform : "translate(0, -200%)",
			minWidth: "max-content",
			zIndex: this.contentZIndex,
			"--bits-floating-transform-origin": `${this.floating.middlewareData.transformOrigin?.x} ${this.floating.middlewareData.transformOrigin?.y}`,
			"--bits-floating-available-width": `${m(this.#l)}px`,
			"--bits-floating-available-height": `${m(this.#u)}px`,
			"--bits-floating-anchor-width": `${m(this.#d)}px`,
			"--bits-floating-anchor-height": `${m(this.#f)}px`,
			...this.floating.middlewareData.hide?.referenceHidden && {
				visibility: "hidden",
				"pointer-events": "none"
			},
			...m(this.#e)
		},
		dir: this.opts.dir.current,
		...this.wrapperAttachment
	}));
	get wrapperProps() {
		return m(this.#x);
	}
	set wrapperProps(e) {
		N(this.#x, e);
	}
	#S = E(() => ({
		"data-side": this.placedSide,
		"data-align": this.placedAlign,
		style: $e({ ...m(this.#e) }),
		...this.contentAttachment
	}));
	get props() {
		return m(this.#S);
	}
	set props(e) {
		N(this.#S, e);
	}
	#C = E(() => ({
		position: "absolute",
		left: this.arrowX ? `${this.arrowX}px` : void 0,
		top: this.arrowY ? `${this.arrowY}px` : void 0,
		[this.arrowBaseSide]: 0,
		"transform-origin": {
			top: "",
			right: "0 0",
			bottom: "center 0",
			left: "100% 0"
		}[this.placedSide],
		transform: {
			top: "translateY(100%)",
			right: "translateY(50%) rotate(90deg) translateX(-50%)",
			bottom: "rotate(180deg)",
			left: "translateY(50%) rotate(-90deg) translateX(50%)"
		}[this.placedSide],
		visibility: this.cannotCenterArrow ? "hidden" : void 0
	}));
	get arrowStyle() {
		return m(this.#C);
	}
	set arrowStyle(e) {
		N(this.#C, e);
	}
	constructor(e, t) {
		this.opts = e, this.root = t, this.#t = e.updatePositionStrategy, e.customAnchor && (this.root.customAnchorNode.current = e.customAnchor.current), R(() => e.customAnchor.current, (e) => {
			this.root.customAnchorNode.current = e;
		}), this.floating = oa({
			strategy: () => this.opts.strategy.current,
			placement: () => m(this.#a),
			middleware: () => this.middleware,
			reference: this.root.anchorNode,
			whileElementsMounted: (...e) => qi(...e, { animationFrame: this.#t?.current === "always" }),
			open: () => this.opts.enabled.current,
			sideOffset: () => this.opts.sideOffset.current,
			alignOffset: () => this.opts.alignOffset.current
		}), O(() => {
			this.floating.isPositioned && this.opts.onPlaced?.current();
		}), R(() => this.contentRef.current, (e) => {
			if (!e || !this.opts.enabled.current) return;
			let t = wt(e), n = t.requestAnimationFrame(() => {
				if (this.contentRef.current !== e || !this.opts.enabled.current) return;
				let n = t.getComputedStyle(e).zIndex;
				n !== this.contentZIndex && (this.contentZIndex = n);
			});
			return () => {
				t.cancelAnimationFrame(n);
			};
		}), O(() => {
			this.floating.floating.current = this.wrapperRef.current;
		});
	}
}, ma = class e {
	static create(t, n = !1) {
		return n ? new e(t, da.get()) : new e(t, la.get());
	}
	opts;
	root;
	constructor(e, t) {
		this.opts = e, this.root = t, t.triggerNode = e.virtualEl && e.virtualEl.current ? pe(e.virtualEl.current) : e.ref;
	}
};
function ha(e) {
	return {
		name: "transformOrigin",
		options: e,
		fn(t) {
			let { placement: n, rects: r, middlewareData: i } = t, a = i.arrow?.centerOffset !== 0, o = a ? 0 : e.arrowWidth, s = a ? 0 : e.arrowHeight, [c, l] = ga(n), u = {
				start: "0%",
				center: "50%",
				end: "100%"
			}[l], d = (i.arrow?.x ?? 0) + o / 2, f = (i.arrow?.y ?? 0) + s / 2, p = "", m = "";
			return c === "bottom" ? (p = a ? u : `${d}px`, m = `${-s}px`) : c === "top" ? (p = a ? u : `${d}px`, m = `${r.floating.height + s}px`) : c === "right" ? (p = `${-s}px`, m = a ? u : `${f}px`) : c === "left" && (p = `${r.floating.width + s}px`, m = a ? u : `${f}px`), { data: {
				x: p,
				y: m
			} };
		}
	};
}
function ga(e) {
	let [t, n = "center"] = e.split("-");
	return [t, n];
}
function _a(e) {
	return ga(e)[0];
}
function va(e) {
	return ga(e)[1];
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer.svelte
function ya(e, r) {
	t(r, !0);
	let i = A(r, "tooltip", 3, !1);
	fa.create(i());
	var a = u(), s = k(a);
	n(s, () => r.children ?? c), o(e, a), d();
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-anchor.svelte
function ba(e, r) {
	t(r, !0);
	let i = A(r, "tooltip", 3, !1);
	ma.create({
		id: P(() => r.id),
		virtualEl: P(() => r.virtualEl),
		ref: r.ref
	}, i());
	var a = u(), s = k(a);
	n(s, () => r.children ?? c), o(e, a), d();
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-content.svelte
function xa(e, r) {
	t(r, !0);
	let i = A(r, "side", 3, "bottom"), a = A(r, "sideOffset", 3, 0), s = A(r, "align", 3, "center"), l = A(r, "alignOffset", 3, 0), f = A(r, "arrowPadding", 3, 0), p = A(r, "avoidCollisions", 3, !0), h = A(r, "collisionBoundary", 19, () => []), g = A(r, "collisionPadding", 3, 0), _ = A(r, "hideWhenDetached", 3, !1), v = A(r, "onPlaced", 3, () => {}), y = A(r, "sticky", 3, "partial"), b = A(r, "updatePositionStrategy", 3, "optimized"), x = A(r, "strategy", 3, "fixed"), S = A(r, "dir", 3, "ltr"), C = A(r, "style", 19, () => ({})), w = A(r, "wrapperId", 19, ir), T = A(r, "customAnchor", 3, null), D = A(r, "tooltip", 3, !1), O = pa.create({
		side: P(() => i()),
		sideOffset: P(() => a()),
		align: P(() => s()),
		alignOffset: P(() => l()),
		id: P(() => r.id),
		arrowPadding: P(() => f()),
		avoidCollisions: P(() => p()),
		collisionBoundary: P(() => h()),
		collisionPadding: P(() => g()),
		hideWhenDetached: P(() => _()),
		onPlaced: P(() => v()),
		sticky: P(() => y()),
		updatePositionStrategy: P(() => b()),
		strategy: P(() => x()),
		dir: P(() => S()),
		style: P(() => C()),
		enabled: P(() => r.enabled),
		wrapperId: P(() => w()),
		customAnchor: P(() => T())
	}, D()), j = E(() => nt(O.wrapperProps, { style: { pointerEvents: "auto" } }));
	var M = u(), N = k(M);
	n(N, () => r.content ?? c, () => ({
		props: O.props,
		wrapperProps: m(j)
	})), o(e, M), d();
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-content-static.svelte
function Sa(e, r) {
	t(r, !0), D(() => {
		r.onPlaced?.();
	});
	var i = u(), a = k(i);
	n(a, () => r.content ?? c, () => ({
		props: {},
		wrapperProps: {}
	})), o(e, i), d();
}
// node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-content.svelte
var Ca = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"content",
	"isStatic",
	"onPlaced"
]);
function wa(e, t) {
	let n = A(t, "isStatic", 3, !1), r = w(t, Ca);
	var i = u(), a = k(i), c = (e) => {
		Sa(e, {
			get content() {
				return t.content;
			},
			get onPlaced() {
				return t.onPlaced;
			}
		});
	}, l = (e) => {
		xa(e, g({
			get content() {
				return t.content;
			},
			get onPlaced() {
				return t.onPlaced;
			}
		}, () => r));
	};
	s(a, (e) => {
		n() ? e(c) : e(l, -1);
	}), o(e, i);
}
// node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer-inner.svelte
var Ta = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.popper.onEscapeKeydown.escapeKeydownBehavior.preventOverflowTextSelection.id.onPointerDown.onPointerUp.side.sideOffset.align.alignOffset.arrowPadding.avoidCollisions.collisionBoundary.collisionPadding.sticky.hideWhenDetached.updatePositionStrategy.strategy.dir.preventScroll.wrapperId.style.onPlaced.onInteractOutside.onCloseAutoFocus.onOpenAutoFocus.onFocusOutside.interactOutsideBehavior.loop.trapFocus.isValidEvent.customAnchor.isStatic.enabled.ref.tooltip.contentPointerEvents".split(".")), Ea = ie("<!> <!>", 1);
function Da(e, r) {
	t(r, !0);
	let i = A(r, "interactOutsideBehavior", 3, "close"), a = A(r, "trapFocus", 3, !0), l = A(r, "isValidEvent", 3, () => !1), f = A(r, "customAnchor", 3, null), p = A(r, "isStatic", 3, !1), h = A(r, "tooltip", 3, !1), g = A(r, "contentPointerEvents", 3, "auto"), _ = w(r, Ta), v = E(() => r.preventScroll ?? !0), y = E(() => r.strategy ?? (m(v) ? "fixed" : "absolute"));
	wa(e, {
		get isStatic() {
			return p();
		},
		get id() {
			return r.id;
		},
		get side() {
			return r.side;
		},
		get sideOffset() {
			return r.sideOffset;
		},
		get align() {
			return r.align;
		},
		get alignOffset() {
			return r.alignOffset;
		},
		get arrowPadding() {
			return r.arrowPadding;
		},
		get avoidCollisions() {
			return r.avoidCollisions;
		},
		get collisionBoundary() {
			return r.collisionBoundary;
		},
		get collisionPadding() {
			return r.collisionPadding;
		},
		get sticky() {
			return r.sticky;
		},
		get hideWhenDetached() {
			return r.hideWhenDetached;
		},
		get updatePositionStrategy() {
			return r.updatePositionStrategy;
		},
		get strategy() {
			return m(y);
		},
		get dir() {
			return r.dir;
		},
		get wrapperId() {
			return r.wrapperId;
		},
		get style() {
			return r.style;
		},
		get onPlaced() {
			return r.onPlaced;
		},
		get customAnchor() {
			return f();
		},
		get enabled() {
			return r.enabled;
		},
		get tooltip() {
			return h();
		},
		content: (e, t) => {
			let d = () => (t?.()).props, f = () => (t?.()).wrapperProps;
			var p = Ea(), h = k(p), y = (e) => {
				gr(e, { get preventScroll() {
					return m(v);
				} });
			}, b = (e) => {
				gr(e, { get preventScroll() {
					return m(v);
				} });
			};
			s(h, (e) => {
				r.forceMount && r.enabled ? e(y) : r.forceMount || e(b, 1);
			}), Xn(M(h, 2), {
				get onOpenAutoFocus() {
					return r.onOpenAutoFocus;
				},
				get onCloseAutoFocus() {
					return r.onCloseAutoFocus;
				},
				get loop() {
					return r.loop;
				},
				get enabled() {
					return r.enabled;
				},
				get trapFocus() {
					return a();
				},
				get forceMount() {
					return r.forceMount;
				},
				get ref() {
					return r.ref;
				},
				focusScope: (e, t) => {
					let a = () => (t?.()).props;
					qn(e, {
						get onEscapeKeydown() {
							return r.onEscapeKeydown;
						},
						get escapeKeydownBehavior() {
							return r.escapeKeydownBehavior;
						},
						get enabled() {
							return r.enabled;
						},
						get ref() {
							return r.ref;
						},
						children: (e, t) => {
							Wn(e, {
								get id() {
									return r.id;
								},
								get onInteractOutside() {
									return r.onInteractOutside;
								},
								get onFocusOutside() {
									return r.onFocusOutside;
								},
								get interactOutsideBehavior() {
									return i();
								},
								get isValidEvent() {
									return l();
								},
								get enabled() {
									return r.enabled;
								},
								get ref() {
									return r.ref;
								},
								children: (e, t) => {
									let i = () => (t?.()).props;
									rr(e, {
										get id() {
											return r.id;
										},
										get preventOverflowTextSelection() {
											return r.preventOverflowTextSelection;
										},
										get onPointerDown() {
											return r.onPointerDown;
										},
										get onPointerUp() {
											return r.onPointerUp;
										},
										get enabled() {
											return r.enabled;
										},
										get ref() {
											return r.ref;
										},
										children: (e, t) => {
											var s = u(), l = k(s);
											{
												let e = E(() => ({
													props: nt(_, d(), i(), a(), { style: { pointerEvents: g() } }),
													wrapperProps: f()
												}));
												n(l, () => r.popper ?? c, () => m(e));
											}
											o(e, s);
										},
										$$slots: { default: !0 }
									});
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { focusScope: !0 }
			}), o(e, p);
		},
		$$slots: { content: !0 }
	}), d();
}
// node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer.svelte
var Oa = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.popper.open.onEscapeKeydown.escapeKeydownBehavior.preventOverflowTextSelection.id.onPointerDown.onPointerUp.side.sideOffset.align.alignOffset.arrowPadding.avoidCollisions.collisionBoundary.collisionPadding.sticky.hideWhenDetached.updatePositionStrategy.strategy.dir.preventScroll.wrapperId.style.onPlaced.onInteractOutside.onCloseAutoFocus.onOpenAutoFocus.onFocusOutside.interactOutsideBehavior.loop.trapFocus.isValidEvent.customAnchor.isStatic.ref.shouldRender".split("."));
function ka(e, t) {
	let n = A(t, "interactOutsideBehavior", 3, "close"), r = A(t, "trapFocus", 3, !0), i = A(t, "isValidEvent", 3, () => !1), a = A(t, "customAnchor", 3, null), c = A(t, "isStatic", 3, !1), l = w(t, Oa);
	var d = u(), f = k(d), p = (e) => {
		Da(e, g({
			get popper() {
				return t.popper;
			},
			get onEscapeKeydown() {
				return t.onEscapeKeydown;
			},
			get escapeKeydownBehavior() {
				return t.escapeKeydownBehavior;
			},
			get preventOverflowTextSelection() {
				return t.preventOverflowTextSelection;
			},
			get id() {
				return t.id;
			},
			get onPointerDown() {
				return t.onPointerDown;
			},
			get onPointerUp() {
				return t.onPointerUp;
			},
			get side() {
				return t.side;
			},
			get sideOffset() {
				return t.sideOffset;
			},
			get align() {
				return t.align;
			},
			get alignOffset() {
				return t.alignOffset;
			},
			get arrowPadding() {
				return t.arrowPadding;
			},
			get avoidCollisions() {
				return t.avoidCollisions;
			},
			get collisionBoundary() {
				return t.collisionBoundary;
			},
			get collisionPadding() {
				return t.collisionPadding;
			},
			get sticky() {
				return t.sticky;
			},
			get hideWhenDetached() {
				return t.hideWhenDetached;
			},
			get updatePositionStrategy() {
				return t.updatePositionStrategy;
			},
			get strategy() {
				return t.strategy;
			},
			get dir() {
				return t.dir;
			},
			get preventScroll() {
				return t.preventScroll;
			},
			get wrapperId() {
				return t.wrapperId;
			},
			get style() {
				return t.style;
			},
			get onPlaced() {
				return t.onPlaced;
			},
			get customAnchor() {
				return a();
			},
			get isStatic() {
				return c();
			},
			get enabled() {
				return t.open;
			},
			get onInteractOutside() {
				return t.onInteractOutside;
			},
			get onCloseAutoFocus() {
				return t.onCloseAutoFocus;
			},
			get onOpenAutoFocus() {
				return t.onOpenAutoFocus;
			},
			get interactOutsideBehavior() {
				return n();
			},
			get loop() {
				return t.loop;
			},
			get trapFocus() {
				return r();
			},
			get isValidEvent() {
				return i();
			},
			get onFocusOutside() {
				return t.onFocusOutside;
			},
			forceMount: !1,
			get ref() {
				return t.ref;
			}
		}, () => l));
	};
	s(f, (e) => {
		t.shouldRender && e(p);
	}), o(e, d);
}
// node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer-force-mount.svelte
var Aa = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.popper.onEscapeKeydown.escapeKeydownBehavior.preventOverflowTextSelection.id.onPointerDown.onPointerUp.side.sideOffset.align.alignOffset.arrowPadding.avoidCollisions.collisionBoundary.collisionPadding.sticky.hideWhenDetached.updatePositionStrategy.strategy.dir.preventScroll.wrapperId.style.onPlaced.onInteractOutside.onCloseAutoFocus.onOpenAutoFocus.onFocusOutside.interactOutsideBehavior.loop.trapFocus.isValidEvent.customAnchor.isStatic.enabled".split("."));
function ja(e, t) {
	let n = A(t, "interactOutsideBehavior", 3, "close"), r = A(t, "trapFocus", 3, !0), i = A(t, "isValidEvent", 3, () => !1), a = A(t, "customAnchor", 3, null), o = A(t, "isStatic", 3, !1), s = w(t, Aa);
	Da(e, g({
		get popper() {
			return t.popper;
		},
		get onEscapeKeydown() {
			return t.onEscapeKeydown;
		},
		get escapeKeydownBehavior() {
			return t.escapeKeydownBehavior;
		},
		get preventOverflowTextSelection() {
			return t.preventOverflowTextSelection;
		},
		get id() {
			return t.id;
		},
		get onPointerDown() {
			return t.onPointerDown;
		},
		get onPointerUp() {
			return t.onPointerUp;
		},
		get side() {
			return t.side;
		},
		get sideOffset() {
			return t.sideOffset;
		},
		get align() {
			return t.align;
		},
		get alignOffset() {
			return t.alignOffset;
		},
		get arrowPadding() {
			return t.arrowPadding;
		},
		get avoidCollisions() {
			return t.avoidCollisions;
		},
		get collisionBoundary() {
			return t.collisionBoundary;
		},
		get collisionPadding() {
			return t.collisionPadding;
		},
		get sticky() {
			return t.sticky;
		},
		get hideWhenDetached() {
			return t.hideWhenDetached;
		},
		get updatePositionStrategy() {
			return t.updatePositionStrategy;
		},
		get strategy() {
			return t.strategy;
		},
		get dir() {
			return t.dir;
		},
		get preventScroll() {
			return t.preventScroll;
		},
		get wrapperId() {
			return t.wrapperId;
		},
		get style() {
			return t.style;
		},
		get onPlaced() {
			return t.onPlaced;
		},
		get customAnchor() {
			return a();
		},
		get isStatic() {
			return o();
		},
		get enabled() {
			return t.enabled;
		},
		get onInteractOutside() {
			return t.onInteractOutside;
		},
		get onCloseAutoFocus() {
			return t.onCloseAutoFocus;
		},
		get onOpenAutoFocus() {
			return t.onOpenAutoFocus;
		},
		get interactOutsideBehavior() {
			return n();
		},
		get loop() {
			return t.loop;
		},
		get trapFocus() {
			return r();
		},
		get isValidEvent() {
			return i();
		},
		get onFocusOutside() {
			return t.onFocusOutside;
		}
	}, () => s, { forceMount: !0 }));
}
// node_modules/bits-ui/dist/internal/safe-polygon.svelte.js
function Ma(e, t) {
	let [n, r] = e, i = !1, a = t.length;
	for (let e = 0, o = a - 1; e < a; o = e++) {
		let [a, s] = t[e] ?? [0, 0], [c, l] = t[o] ?? [0, 0];
		s >= r != l >= r && n <= (c - a) * (r - s) / (l - s) + a && (i = !i);
	}
	return i;
}
function Na(e, t) {
	return e[0] >= t.left && e[0] <= t.right && e[1] >= t.top && e[1] <= t.bottom;
}
function Pa(e, t) {
	let n = e.left + e.width / 2, r = e.top + e.height / 2, i = t.left + t.width / 2, a = t.top + t.height / 2, o = i - n, s = a - r;
	return Math.abs(o) > Math.abs(s) ? o > 0 ? "right" : "left" : s > 0 ? "bottom" : "top";
}
var Fa = class {
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
		this.#n = typeof t == "number" && t > 0 ? t : null, R([
			e.triggerNode,
			e.contentNode,
			e.enabled
		], ([e, t, n]) => {
			if (!e || !t || !n) {
				this.#o = null, this.#m();
				return;
			}
			this.#o && this.#o !== e && this.#m(), this.#o = e;
			let r = Ct(e);
			return [
				a(r, "pointermove", (n) => {
					this.#p([n.clientX, n.clientY], e, t);
				}),
				a(e, "pointerleave", (e) => {
					let n = e.relatedTarget;
					if (z(n) && t.contains(n)) return;
					let r = this.#e.ignoredTargets?.() ?? [];
					z(n) && r.some((e) => e === n || e.contains(n)) || (this.#a = z(n) && r.length > 0 ? r.filter((e) => n.contains(e)) : [], this.#r = [e.clientX, e.clientY], this.#i = "content", this.#u());
				}),
				a(e, "pointerenter", () => {
					this.#m();
				}),
				a(t, "pointerenter", () => {
					this.#m();
				}),
				a(t, "pointerleave", (t) => {
					let n = t.relatedTarget;
					z(n) && e.contains(n) || (this.#r = [t.clientX, t.clientY], this.#i = "trigger", this.#u());
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
		if (this.#i === "content" && Na(e, i) || this.#i === "trigger" && Na(e, r)) {
			this.#m();
			return;
		}
		if (this.#i === "content" && this.#a.length > 0) for (let t of this.#a) {
			let n = t.getBoundingClientRect();
			if (Na(e, n)) return;
			let i = Pa(r, n), a = this.#h(r, n, i);
			if (a && Ma(e, a)) return;
		}
		let a = Pa(r, i), o = this.#h(r, i, a);
		if (o && Ma(e, o)) return;
		let s = this.#i === "content" ? i : r;
		Ma(e, this.#g(this.#r, s, a, this.#i)) || (this.#m(), this.#e.onPointerExit());
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
}, Ia = Mt({
	component: "popover",
	parts: [
		"root",
		"trigger",
		"content",
		"close",
		"overlay"
	]
}), La = new L("Popover.Root"), Ra = class e {
	static create(t) {
		return La.set(new e(t));
	}
	opts;
	#e = S(null);
	get contentNode() {
		return m(this.#e);
	}
	set contentNode(e) {
		N(this.#e, e, !0);
	}
	contentPresence;
	#t = S(null);
	get triggerNode() {
		return m(this.#t);
	}
	set triggerNode(e) {
		N(this.#t, e, !0);
	}
	#n = S(null);
	get overlayNode() {
		return m(this.#n);
	}
	set overlayNode(e) {
		N(this.#n, e, !0);
	}
	overlayPresence;
	#r = S(!1);
	get openedViaHover() {
		return m(this.#r);
	}
	set openedViaHover(e) {
		N(this.#r, e, !0);
	}
	#i = S(!1);
	get hasInteractedWithContent() {
		return m(this.#i);
	}
	set hasInteractedWithContent(e) {
		N(this.#i, e, !0);
	}
	#a = S(!1);
	get hoverCooldown() {
		return m(this.#a);
	}
	set hoverCooldown(e) {
		N(this.#a, e, !0);
	}
	#o = S(0);
	get closeDelay() {
		return m(this.#o);
	}
	set closeDelay(e) {
		N(this.#o, e, !0);
	}
	#s = null;
	#c = null;
	constructor(e) {
		this.opts = e, this.contentPresence = new Vt({
			ref: P(() => this.contentNode),
			open: this.opts.open,
			onComplete: () => {
				this.opts.onOpenChangeComplete.current(this.opts.open.current);
			}
		}), this.overlayPresence = new Vt({
			ref: P(() => this.overlayNode),
			open: this.opts.open
		}), R(() => this.opts.open.current, (e) => {
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
}, za = class e {
	static create(t) {
		return new e(t, La.get());
	}
	opts;
	root;
	attachment;
	domContext;
	#e = null;
	#t = null;
	#n = S(!1);
	constructor(e, t) {
		this.opts = e, this.root = t, this.attachment = Dt(this.opts.ref, (e) => this.root.triggerNode = e), this.domContext = new Et(e.ref), this.root.setDomContext(this.domContext), this.onclick = this.onclick.bind(this), this.onkeydown = this.onkeydown.bind(this), this.onpointerenter = this.onpointerenter.bind(this), this.onpointerleave = this.onpointerleave.bind(this), R(() => this.opts.closeDelay.current, (e) => {
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
		if (this.opts.disabled.current || !this.opts.openOnHover.current || Rt(e) || (N(this.#n, !0), this.#i(), this.root.cancelDelayedClose(), this.root.opts.open.current || this.root.hoverCooldown)) return;
		let t = this.opts.openDelay.current;
		t <= 0 ? this.root.handleHoverOpen() : this.#e = this.domContext.setTimeout(() => {
			this.root.handleHoverOpen(), this.#e = null;
		}, t);
	}
	onpointerleave(e) {
		this.opts.disabled.current || this.opts.openOnHover.current && (Rt(e) || (N(this.#n, !1), this.#r(), this.root.hoverCooldown = !1));
	}
	onclick(e) {
		this.opts.disabled.current || e.button === 0 && (this.#a(), m(this.#n) && this.root.opts.open.current && this.root.openedViaHover ? (this.root.openedViaHover = !1, this.root.hasInteractedWithContent = !0) : (m(this.#n) && this.opts.openOnHover.current && this.root.opts.open.current && (this.root.hoverCooldown = !0), this.root.hoverCooldown && !this.root.opts.open.current && (this.root.hoverCooldown = !1), this.root.toggleOpen()));
	}
	onkeydown(e) {
		this.opts.disabled.current || (e.key === "Enter" || e.key === " ") && (e.preventDefault(), this.#a(), this.root.toggleOpen());
	}
	#o() {
		if (this.root.opts.open.current && this.root.contentNode?.id) return this.root.contentNode?.id;
	}
	#s = E(() => ({
		id: this.opts.id.current,
		"aria-haspopup": "dialog",
		"aria-expanded": Ot(this.root.opts.open.current),
		"data-state": kt(this.root.opts.open.current),
		"aria-controls": this.#o(),
		[Ia.trigger]: "",
		disabled: this.opts.disabled.current,
		onkeydown: this.onkeydown,
		onclick: this.onclick,
		onpointerenter: this.onpointerenter,
		onpointerleave: this.onpointerleave,
		...this.attachment
	}));
	get props() {
		return m(this.#s);
	}
	set props(e) {
		N(this.#s, e);
	}
}, Ba = class e {
	static create(t) {
		return new e(t, La.get());
	}
	opts;
	root;
	attachment;
	constructor(e, t) {
		this.opts = e, this.root = t, this.attachment = Dt(this.opts.ref, (e) => this.root.contentNode = e), this.onpointerdown = this.onpointerdown.bind(this), this.onfocusin = this.onfocusin.bind(this), this.onpointerenter = this.onpointerenter.bind(this), this.onpointerleave = this.onpointerleave.bind(this), new Fa({
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
		z(t) && Pn(t) && this.root.markInteraction();
	}
	onpointerenter(e) {
		Rt(e) || this.root.cancelDelayedClose();
	}
	onpointerleave(e) {
		Rt(e);
	}
	onInteractOutside = (e) => {
		if (this.opts.onInteractOutside.current(e), e.defaultPrevented || !z(e.target)) return;
		let t = e.target.closest(Ia.selector("trigger"));
		if (!(t && t === this.root.triggerNode)) {
			if (this.opts.customAnchor.current) {
				if (z(this.opts.customAnchor.current)) {
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
	#e = E(() => ({ open: this.root.opts.open.current }));
	get snippetProps() {
		return m(this.#e);
	}
	set snippetProps(e) {
		N(this.#e, e);
	}
	#t = E(() => ({
		id: this.opts.id.current,
		tabindex: -1,
		"data-state": kt(this.root.opts.open.current),
		...At(this.root.contentPresence.transitionStatus),
		[Ia.content]: "",
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
		return m(this.#t);
	}
	set props(e) {
		N(this.#t, e);
	}
	popperProps = {
		onInteractOutside: this.onInteractOutside,
		onEscapeKeydown: this.onEscapeKeydown
	};
}, Va = /* @__PURE__ */ new Set([
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
]), Ha = ie("<div><div><!></div></div>");
function Ua(r, i) {
	let a = f();
	t(i, !0);
	let l = A(i, "ref", 15, null), p = A(i, "id", 19, () => Ht(a)), h = A(i, "forceMount", 3, !1), v = A(i, "onOpenAutoFocus", 3, B), y = A(i, "onCloseAutoFocus", 3, B), b = A(i, "onEscapeKeydown", 3, B), S = A(i, "onInteractOutside", 3, B), C = A(i, "trapFocus", 3, !0), T = A(i, "preventScroll", 3, !1), D = A(i, "customAnchor", 3, null), O = w(i, Va), j = Ba.create({
		id: P(() => p()),
		ref: P(() => l(), (e) => l(e)),
		onInteractOutside: P(() => S()),
		onEscapeKeydown: P(() => b()),
		customAnchor: P(() => D())
	}), M = E(() => nt(O, j.props)), N = E(() => C() && j.shouldTrapFocus);
	function ee(e) {
		j.shouldTrapFocus || e.preventDefault(), v()(e);
	}
	var te = u(), ne = k(te), re = (t) => {
		ja(t, g(() => m(M), () => j.popperProps, {
			get ref() {
				return j.opts.ref;
			},
			get enabled() {
				return j.root.opts.open.current;
			},
			get id() {
				return p();
			},
			get trapFocus() {
				return m(N);
			},
			get preventScroll() {
				return T();
			},
			loop: !0,
			forceMount: !0,
			get customAnchor() {
				return D();
			},
			onOpenAutoFocus: ee,
			get onCloseAutoFocus() {
				return y();
			},
			get shouldRender() {
				return j.shouldRender;
			},
			popper: (t, r) => {
				let a = () => (r?.()).props, l = () => (r?.()).wrapperProps, d = E(() => nt(a(), { style: aa("popover") }, { style: i.style }));
				var f = u(), p = k(f), h = (e) => {
					var t = u(), r = k(t);
					{
						let e = E(() => ({
							props: m(d),
							wrapperProps: l(),
							...j.snippetProps
						}));
						n(r, () => i.child, () => m(e));
					}
					o(e, t);
				}, g = (t) => {
					var r = Ha();
					x(r, () => ({ ...l() }));
					var a = _(r);
					x(a, () => ({ ...m(d) }));
					var s = _(a);
					n(s, () => i.children ?? c), e(a), e(r), o(t, r);
				};
				s(p, (e) => {
					i.child ? e(h) : e(g, -1);
				}), o(t, f);
			},
			$$slots: { popper: !0 }
		}));
	}, ie = (t) => {
		ka(t, g(() => m(M), () => j.popperProps, {
			get ref() {
				return j.opts.ref;
			},
			get open() {
				return j.root.opts.open.current;
			},
			get id() {
				return p();
			},
			get trapFocus() {
				return m(N);
			},
			get preventScroll() {
				return T();
			},
			loop: !0,
			forceMount: !1,
			get customAnchor() {
				return D();
			},
			onOpenAutoFocus: ee,
			get onCloseAutoFocus() {
				return y();
			},
			get shouldRender() {
				return j.shouldRender;
			},
			popper: (t, r) => {
				let a = () => (r?.()).props, l = () => (r?.()).wrapperProps, d = E(() => nt(a(), { style: aa("popover") }, { style: i.style }));
				var f = u(), p = k(f), h = (e) => {
					var t = u(), r = k(t);
					{
						let e = E(() => ({
							props: m(d),
							wrapperProps: l(),
							...j.snippetProps
						}));
						n(r, () => i.child, () => m(e));
					}
					o(e, t);
				}, g = (t) => {
					var r = Ha();
					x(r, () => ({ ...l() }));
					var a = _(r);
					x(a, () => ({ ...m(d) }));
					var s = _(a);
					n(s, () => i.children ?? c), e(a), e(r), o(t, r);
				};
				s(p, (e) => {
					i.child ? e(h) : e(g, -1);
				}), o(t, f);
			},
			$$slots: { popper: !0 }
		}));
	};
	s(ne, (e) => {
		h() ? e(re) : h() || e(ie, 1);
	}), o(r, te), d();
}
// node_modules/bits-ui/dist/bits/popover/components/popover-trigger.svelte
var Wa = /* @__PURE__ */ new Set([
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
]), Ga = ie("<button><!></button>");
function Ka(r, i) {
	let a = f();
	t(i, !0);
	let l = A(i, "id", 19, () => Ht(a)), p = A(i, "ref", 15, null), h = A(i, "type", 3, "button"), g = A(i, "disabled", 3, !1), v = A(i, "openOnHover", 3, !1), y = A(i, "openDelay", 3, 700), b = A(i, "closeDelay", 3, 300), S = w(i, Wa), C = za.create({
		id: P(() => l()),
		ref: P(() => p(), (e) => p(e)),
		disabled: P(() => !!g()),
		openOnHover: P(() => v()),
		openDelay: P(() => y()),
		closeDelay: P(() => b())
	}), T = E(() => nt(S, C.props, { type: h() }));
	ba(r, {
		get id() {
			return l();
		},
		get ref() {
			return C.opts.ref;
		},
		children: (t, r) => {
			var a = u(), l = k(a), d = (e) => {
				var t = u(), r = k(t);
				n(r, () => i.child, () => ({ props: m(T) })), o(e, t);
			}, f = (t) => {
				var r = Ga();
				x(r, () => ({ ...m(T) }));
				var a = _(r);
				n(a, () => i.children ?? c), e(r), o(t, r);
			};
			s(l, (e) => {
				i.child ? e(d) : e(f, -1);
			}), o(t, a);
		},
		$$slots: { default: !0 }
	}), d();
}
// node_modules/bits-ui/dist/bits/popover/components/popover.svelte
function qa(e, r) {
	t(r, !0);
	let i = A(r, "open", 15, !1), a = A(r, "onOpenChange", 3, B), s = A(r, "onOpenChangeComplete", 3, B);
	Ra.create({
		open: P(() => i(), (e) => {
			i(e), a()(e);
		}),
		onOpenChangeComplete: P(() => s())
	}), ya(e, {
		children: (e, t) => {
			var i = u(), a = k(i);
			n(a, () => r.children ?? c), o(e, i);
		},
		$$slots: { default: !0 }
	}), d();
}
// node_modules/@hugeicons/core-free-icons/dist/esm/ArrowRight01Icon.js
var Ja = [["path", {
	d: "M9.00005 6C9.00005 6 15 10.4189 15 12C15 13.5812 9 18 9 18",
	stroke: "currentColor",
	strokeLinecap: "round",
	strokeLinejoin: "round",
	strokeWidth: "1.5",
	key: "0"
}]], Ya = 6, Xa = 10, Za = 10, Qa = (e) => `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`, $a = (e) => {
	let [t, n, r] = e.split("-").map(Number);
	return new Date(t, n - 1, r);
}, eo = 864e5;
function to(e) {
	try {
		let t = new Intl.Locale(e ?? navigator.language);
		return t.getWeekInfo?.().firstDay ?? t.weekInfo?.firstDay ?? 1;
	} catch {
		return 1;
	}
}
function no(e, t = {}) {
	let n = e.steps.flatMap((e, t) => e.date ? [{
		index: t,
		date: e.date
	}] : []), r = n.map(({ date: e }) => $a(e).getTime()), i, a;
	if (e.calendar && t.month) i = new Date(t.month.getFullYear(), t.month.getMonth(), 1), a = new Date(t.month.getFullYear(), t.month.getMonth() + 1, 0);
	else if (e.calendar) {
		let e = t.today ?? /* @__PURE__ */ new Date(), n = r.length ? new Date(Math.min(...r)) : e, o = r.length ? new Date(Math.max(...r)) : e;
		i = new Date(n.getFullYear(), n.getMonth(), 1), a = new Date(o.getFullYear(), o.getMonth() + 1, 0);
	} else if (n.length < Ya || n.length < e.steps.length * .8 || (i = new Date(Math.min(...r)), a = new Date(Math.max(...r)), Math.round((a.getTime() - i.getTime()) / eo) + 1 < Xa)) return null;
	let o = (t.firstDay ?? to()) % 7, s = new Date(i);
	s.setDate(s.getDate() - (s.getDay() - o + 7) % 7);
	let c = new Date(a);
	c.setDate(c.getDate() + (o + 6 - c.getDay() + 7) % 7);
	let l = Math.round((c.getTime() - s.getTime()) / eo) + 1;
	if (l / 7 > Za && !e.calendar) return null;
	let u = /* @__PURE__ */ new Map();
	for (let { index: e, date: t } of n) u.set(t, [...u.get(t) ?? [], e]);
	let d = Qa(t.today ?? /* @__PURE__ */ new Date()), f = Qa(i), p = Qa(a), m = [];
	for (let e = 0; e < l; e++) {
		let t = new Date(s.getFullYear(), s.getMonth(), s.getDate() + e), n = Qa(t);
		e % 7 == 0 && m.push([]), m.at(-1).push({
			date: n,
			day: t.getDate(),
			opens: e === 0 || t.getDate() === 1,
			outside: n < f || n > p,
			today: n === d,
			weekend: t.getDay() === 0 || t.getDay() === 6,
			steps: u.get(n) ?? [],
			slots: []
		});
	}
	return m;
}
var $ = {
	gutter: 36,
	cell: 124,
	head: 28,
	quiet: 32,
	pad: 8,
	number: 22,
	gap: 4,
	item: 20,
	between: 2,
	rule: 1
}, ro = () => $.gutter + 7 * $.cell;
function io(e, t, n = 0) {
	let r = Math.max(e + t, n), i = r ? $.gap + r * $.item + (r - 1) * $.between : 0;
	return 2 * $.pad + $.number + i + $.rule;
}
var ao = (e, t = !1) => $.head + e.reduce((e, n) => e + (n.kind === "quiet" ? $.quiet + $.rule : io(n.lanes, n.lines, t ? 3 : 0)), 0), oo = (e) => {
	let t = $a(e);
	return Qa(new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1));
};
function so(e) {
	let t = (t, n) => `${e.steps[t].kind}|${e.steps[t].title.trim().toLowerCase()}|${n}`, n = e.steps.flatMap((e, t) => e.date && (e.kind === "stay" || e.kind === "event") ? [t] : []), r = new Map(n.map((n) => [t(n, e.steps[n].date), n])), i = /* @__PURE__ */ new Set(), a = [], o = n.toSorted((t, n) => e.steps[t].date.localeCompare(e.steps[n].date));
	for (let n of o) {
		if (i.has(n)) continue;
		let o = [n];
		for (;;) {
			let n = r.get(t(o.at(-1), oo(e.steps[o.at(-1)].date)));
			if (n === void 0 || i.has(n)) break;
			o.push(n);
		}
		if (!(o.length < 2)) {
			for (let e of o) i.add(e);
			a.push({
				steps: o,
				from: e.steps[o[0]].date,
				to: e.steps[o.at(-1)].date
			});
		}
	}
	return a;
}
function co(e, t, n) {
	let r = t[0].date, i = t[6].date, a = n.filter((e) => e.from <= i && e.to >= r).toSorted((e, t) => e.from.localeCompare(t.from) || t.to.localeCompare(e.to)), o = [], s = t.map((e) => ({
		...e,
		slots: []
	})), c = /* @__PURE__ */ new Set();
	for (let t of a) {
		let n = Math.max(0, s.findIndex((e) => e.date >= t.from)), r = s.findLastIndex((e) => e.date <= t.to), i = o.findIndex((e) => e < n);
		i < 0 ? i = o.push(r) - 1 : o[i] = r;
		let a = e.steps[t.steps[0]];
		for (let o = n; o <= r; o++) {
			let c = s[o];
			for (; c.slots.length <= i;) c.slots.push(null);
			c.slots[i] = {
				steps: t.steps,
				title: a.title,
				kind: a.kind,
				done: t.steps.every((t) => !!e.steps[t].done),
				head: o === n,
				starts: c.date === t.from,
				ends: c.date === t.to,
				span: r - n + 1,
				from: t.from,
				to: t.to
			};
		}
		for (let e of t.steps) c.add(e);
	}
	for (let e of s) for (e.steps = e.steps.filter((e) => !c.has(e)); e.slots.length < o.length;) e.slots.push(null);
	return {
		kind: "week",
		days: s,
		lanes: o.length,
		lines: lo(s),
		month: null
	};
}
var lo = (e) => Math.max(0, ...e.map((e) => Math.min(e.steps.length, 3))), uo = (e) => (e.days.find((e) => e.day === 1) ?? e.days[0]).date.slice(0, 7);
function fo(e, t = !1) {
	let n = "";
	for (let r of e) {
		if (r.kind !== "week") continue;
		let e = uo(r);
		e !== n && !(t && n) && (r.month = e), n = e;
	}
	return e;
}
function po(e, t = {}) {
	let n = no(e, t);
	if (!n) return null;
	let r = () => fo(n.map((e) => ({
		kind: "week",
		days: e,
		lanes: 0,
		lines: lo(e),
		month: null
	})), !0);
	if (t.month) return r();
	let i = so(e), a = n.map((t) => co(e, t.map((e) => ({
		...e,
		outside: !1,
		opens: e.day === 1
	})), i)), o = (e) => e.lanes > 0 || e.days.some((e) => e.steps.length > 0), s = a.findIndex(o), c = a.findLastIndex(o);
	if (s < 0) return r();
	let l = [];
	for (let e = s; e <= c;) {
		if (o(a[e])) {
			l.push(a[e++]);
			continue;
		}
		let t = e;
		for (; t < c && !o(a[t + 1]);) t++;
		t === e ? l.push(a[e]) : l.push({
			kind: "quiet",
			weeks: t - e + 1,
			from: a[e].days[0].date,
			to: a[t].days[6].date
		}), e = t + 1;
	}
	return fo(l);
}
function mo(e) {
	if (e.calendar && !e.steps.some((e) => e.date)) {
		let t = po(e, { month: ho(e) });
		return t && {
			rows: t,
			month: !0
		};
	}
	let t = po(e);
	return t && {
		rows: t,
		month: !1
	};
}
function ho(e, t = /* @__PURE__ */ new Date()) {
	let n = e.steps.flatMap((e) => e.date ? [e.date] : []).sort(), r = n[0] ? $a(n[0]) : t;
	return new Date(r.getFullYear(), r.getMonth(), 1);
}
export { to as a, io as c, Ka as d, Ua as f, P as h, ro as i, Ja as l, Kt as m, ao as n, ho as o, Zt as p, mo as r, po as s, $ as t, qa as u };
