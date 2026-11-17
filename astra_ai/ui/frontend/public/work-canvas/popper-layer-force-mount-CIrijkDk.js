import { $ as e, A as t, B as n, Dt as r, Et as i, F as a, H as o, L as s, Ot as c, P as l, Rt as u, Tt as d, V as f, Y as p, Z as m, _t as h, a as g, at as _, ct as v, dt as y, ft as b, ht as x, i as S, kt as C, n as w, nt as T, pt as E, r as D, st as O, tt as k, w as A, wt as ee, xt as te, yt as j, z as ne } from "./index-client-C_2wYFnt.js";
import "./disclose-version-DFvUDwEH.js";
import { n as re } from "./index-client-RfUBbaI1.js";
// node_modules/svelte-toolbelt/dist/utils/is.js
function ie(e) {
	return typeof e == "function";
}
function ae(e) {
	return typeof e == "object" && !!e;
}
var oe = [
	"string",
	"number",
	"bigint",
	"boolean"
];
function se(e) {
	return e == null || oe.includes(typeof e) ? !0 : Array.isArray(e) ? e.every((e) => se(e)) : typeof e == "object" && Object.getPrototypeOf(e) === Object.prototype;
}
// node_modules/svelte-toolbelt/dist/box/box-extras.svelte.js
var ce = Symbol("box"), le = Symbol("is-writable");
function M(t, n) {
	let r = j(t);
	return n ? {
		[ce]: !0,
		[le]: !0,
		get current() {
			return e(r);
		},
		set current(e) {
			n(e);
		}
	} : {
		[ce]: !0,
		get current() {
			return t();
		}
	};
}
function ue(e) {
	return ae(e) && ce in e;
}
function de(e) {
	return ue(e) && le in e;
}
function fe(e) {
	return ue(e) ? e : ie(e) ? M(e) : N(e);
}
function pe(e) {
	return Object.entries(e).reduce((e, [t, n]) => ue(n) ? (de(n) ? Object.defineProperty(e, t, {
		get() {
			return n.current;
		},
		set(e) {
			n.current = e;
		}
	}) : Object.defineProperty(e, t, { get() {
		return n.current;
	} }), e) : Object.assign(e, { [t]: n }), {});
}
function me(e) {
	return de(e) ? {
		[ce]: !0,
		get current() {
			return e.current;
		}
	} : e;
}
function N(t) {
	let n = h(E(t));
	return {
		[ce]: !0,
		[le]: !0,
		get current() {
			return e(n);
		},
		set current(e) {
			x(n, e, !0);
		}
	};
}
// node_modules/svelte-toolbelt/dist/box/box.svelte.js
function he(t) {
	let n = h(E(t));
	return {
		[ce]: !0,
		[le]: !0,
		get current() {
			return e(n);
		},
		set current(e) {
			x(n, e, !0);
		}
	};
}
he.from = fe, he.with = M, he.flatten = pe, he.readonly = me, he.isBox = ue, he.isWritableBox = de;
// node_modules/svelte-toolbelt/dist/utils/compose-handlers.js
function ge(...e) {
	return function(t) {
		for (let n of e) if (n) {
			if (t.defaultPrevented) return;
			typeof n == "function" ? n.call(this, t) : n.current?.call(this, t);
		}
	};
}
// node_modules/inline-style-parser/esm/index.mjs
var _e = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g, ve = /\n/g, ye = /^\s*/, be = /^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/, xe = /^:\s*/, Se = /^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/, Ce = /^[;\s]*/, we = /^\s+|\s+$/g, Te = "\n", Ee = "/", De = "*", Oe = "", ke = "comment", Ae = "declaration";
function je(e, t) {
	if (typeof e != "string") throw TypeError("First argument must be a string");
	if (!e) return [];
	t ||= {};
	var n = 1, r = 1;
	function i(e) {
		var t = e.match(ve);
		t && (n += t.length);
		var i = e.lastIndexOf(Te);
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
		c(ye);
	}
	function u(e) {
		var t;
		for (e ||= []; t = d();) t !== !1 && e.push(t);
		return e;
	}
	function d() {
		var t = a();
		if (Ee == e.charAt(0) && De == e.charAt(1)) {
			for (var n = 2; Oe != e.charAt(n) && (De != e.charAt(n) || Ee != e.charAt(n + 1));) ++n;
			if (n += 2, Oe === e.charAt(n - 1)) return s("End of comment missing");
			var o = e.slice(2, n - 2);
			return r += 2, i(o), e = e.slice(n), r += 2, t({
				type: ke,
				comment: o
			});
		}
	}
	function f() {
		var e = a(), t = c(be);
		if (t) {
			if (d(), !c(xe)) return s("property missing ':'");
			var n = c(Se), r = e({
				type: Ae,
				property: Me(t[0].replace(_e, Oe)),
				value: n ? Me(n[0].replace(_e, Oe)) : Oe
			});
			return c(Ce), r;
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
function Me(e) {
	return e ? e.replace(we, Oe) : Oe;
}
// node_modules/style-to-object/esm/index.mjs
function Ne(e, t) {
	let n = null;
	if (!e || typeof e != "string") return n;
	let r = je(e), i = typeof t == "function";
	return r.forEach((e) => {
		if (e.type !== "declaration") return;
		let { property: r, value: a } = e;
		i ? t(r, a, e) : a && (n ||= {}, n[r] = a);
	}), n;
}
// node_modules/svelte-toolbelt/dist/utils/strings.js
var Pe = /\d/, Fe = [
	"-",
	"_",
	"/",
	"."
];
function Ie(e = "") {
	if (!Pe.test(e)) return e !== e.toLowerCase();
}
function Le(e) {
	let t = [], n = "", r, i;
	for (let a of e) {
		let e = Fe.includes(a);
		if (e === !0) {
			t.push(n), n = "", r = void 0;
			continue;
		}
		let o = Ie(a);
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
function Re(e) {
	return e ? Le(e).map((e) => Be(e)).join("") : "";
}
function ze(e) {
	return Ve(Re(e || ""));
}
function Be(e) {
	return e ? e[0].toUpperCase() + e.slice(1) : "";
}
function Ve(e) {
	return e ? e[0].toLowerCase() + e.slice(1) : "";
}
// node_modules/svelte-toolbelt/dist/utils/css-to-style-obj.js
var He = 1e3, Ue = /* @__PURE__ */ new Map();
function We(e) {
	let t = Ue.get(e);
	return t === void 0 && (t = e.startsWith("-moz-") || e.startsWith("-webkit-") || e.startsWith("-ms-") || e.startsWith("-o-") ? Re(e) : e.startsWith("--") ? e : ze(e), Ue.size >= He && Ue.clear(), Ue.set(e, t)), t;
}
var Ge = /["'\\{}]|\/\*/, Ke = /^[-\w]+$/;
function qe(e) {
	if (Ge.test(e)) return null;
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
				if (!Ke.test(n) || !o) return null;
				t.push(n, o);
			}
			r = a + 1, i = -1;
		}
	}
	return t;
}
function Je(e, t) {
	let n = qe(t);
	if (n) for (let t = 0; t < n.length; t += 2) e[We(n[t])] = n[t + 1];
	else Ne(t, (t, n) => {
		e[We(t)] = n;
	});
}
function Ye(e) {
	if (!e) return {};
	let t = {};
	return Je(t, e), t;
}
// node_modules/svelte-toolbelt/dist/utils/execute-callbacks.js
function Xe(...e) {
	return (...t) => {
		for (let n of e) typeof n == "function" && n(...t);
	};
}
// node_modules/svelte-toolbelt/dist/utils/style-to-css.js
function Ze(e, t) {
	let n = RegExp(e, "g");
	return (e) => {
		if (typeof e != "string") throw TypeError(`expected an argument of type string, but got ${typeof e}`);
		return e.match(n) ? e.replace(n, t) : e;
	};
}
var Qe = Ze(/[A-Z]/, (e) => `-${e.toLowerCase()}`), $e = /* @__PURE__ */ new Map();
function et(e) {
	let t = $e.get(e);
	return t === void 0 && (t = Qe(e), $e.size >= 1e3 && $e.clear(), $e.set(e, t)), t;
}
function tt(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError(`expected an argument of type object, but got ${typeof e}`);
	let t = "";
	for (let n of Object.keys(e)) {
		let r = e[n];
		r != null && r !== "" && (t += `${t ? "\n" : ""}${et(n)}: ${r};`);
	}
	return t;
}
// node_modules/svelte-toolbelt/dist/utils/style.js
function nt(e = {}) {
	return tt(e).replace("\n", " ");
}
var rt = new Set(/* @__PURE__ */ "onabort.onanimationcancel.onanimationend.onanimationiteration.onanimationstart.onauxclick.onbeforeinput.onbeforetoggle.onblur.oncancel.oncanplay.oncanplaythrough.onchange.onclick.onclose.oncompositionend.oncompositionstart.oncompositionupdate.oncontextlost.oncontextmenu.oncontextrestored.oncopy.oncuechange.oncut.ondblclick.ondrag.ondragend.ondragenter.ondragleave.ondragover.ondragstart.ondrop.ondurationchange.onemptied.onended.onerror.onfocus.onfocusin.onfocusout.onformdata.ongotpointercapture.oninput.oninvalid.onkeydown.onkeypress.onkeyup.onload.onloadeddata.onloadedmetadata.onloadstart.onlostpointercapture.onmousedown.onmouseenter.onmouseleave.onmousemove.onmouseout.onmouseover.onmouseup.onpaste.onpause.onplay.onplaying.onpointercancel.onpointerdown.onpointerenter.onpointerleave.onpointermove.onpointerout.onpointerover.onpointerup.onprogress.onratechange.onreset.onresize.onscroll.onscrollend.onsecuritypolicyviolation.onseeked.onseeking.onselect.onselectionchange.onselectstart.onslotchange.onstalled.onsubmit.onsuspend.ontimeupdate.ontoggle.ontouchcancel.ontouchend.ontouchmove.ontouchstart.ontransitioncancel.ontransitionend.ontransitionrun.ontransitionstart.onvolumechange.onwaiting.onwebkitanimationend.onwebkitanimationiteration.onwebkitanimationstart.onwebkittransitionend.onwheel".split("."));
// node_modules/svelte-toolbelt/dist/utils/merge-props.js
function it(e) {
	return rt.has(e);
}
function at(...e) {
	let t = { ...e[0] };
	for (let n = 1; n < e.length; n++) {
		let r = e[n];
		if (r) {
			for (let e of Object.keys(r)) {
				let n = t[e], i = r[e], a = typeof n == "function", o = typeof i == "function";
				if (a && o && it(e)) t[e] = ge(n, i);
				else if (a && o) t[e] = Xe(n, i);
				else if (e === "class") {
					let r = se(n), a = se(i);
					r && a ? t[e] = A(n, i) : r ? t[e] = A(n) : a && (t[e] = A(i));
				} else if (e === "style") {
					let r = typeof n == "object", a = typeof i == "object", o = typeof n == "string", s = typeof i == "string";
					if (r && a) t[e] = {
						...n,
						...i
					};
					else if (r && s) {
						let r = Ye(i);
						t[e] = {
							...n,
							...r
						};
					} else if (o && a) t[e] = {
						...Ye(n),
						...i
					};
					else if (o && s) {
						let r = Ye(n), a = Ye(i);
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
	return typeof t.style == "object" && (t.style = nt(t.style).replaceAll("\n", " ")), t.hidden === !1 && (t.hidden = void 0, delete t.hidden), t.disabled === !1 && (t.disabled = void 0, delete t.disabled), t;
}
// node_modules/runed/dist/internal/configurable-globals.js
var ot = typeof window < "u" ? window : void 0;
typeof window < "u" && window.document, typeof window < "u" && window.navigator, typeof window < "u" && window.location;
// node_modules/runed/dist/internal/utils/dom.js
function st(e) {
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
		let { window: t = ot, document: n = t?.document } = e;
		t !== void 0 && (this.#e = n, this.#t = te((e) => {
			let n = p(t, "focusin", e), r = p(t, "focusout", e);
			return () => {
				n(), r();
			};
		}));
	}
	get current() {
		return this.#t?.(), this.#e ? st(this.#e) : null;
	}
}();
// node_modules/runed/dist/internal/utils/is.js
function ct(e) {
	return typeof e == "function";
}
// node_modules/runed/dist/utilities/context/context.js
var P = class {
	#e;
	#t;
	constructor(e) {
		this.#e = e, this.#t = Symbol(e);
	}
	get key() {
		return this.#t;
	}
	exists() {
		return i(this.#t);
	}
	get() {
		let e = d(this.#t);
		if (e === void 0) throw Error(`Context "${this.#e}" not found`);
		return e;
	}
	getOr(e) {
		let t = d(this.#t);
		return t === void 0 ? e : t;
	}
	set(e) {
		return C(this.#t, e);
	}
};
// node_modules/runed/dist/utilities/watch/watch.svelte.js
function lt(e, t) {
	switch (e) {
		case "post":
			O(t);
			break;
		case "pre": v(t);
	}
}
function ut(e, t, n, r = {}) {
	let { lazy: i = !1 } = r, a = !i, o = Array.isArray(e) ? [] : void 0;
	lt(t, () => {
		let t = Array.isArray(e) ? e.map((e) => e()) : e();
		if (!a) {
			a = !0, o = t;
			return;
		}
		let r = T(() => n(t, o));
		return o = t, r;
	});
}
function F(e, t, n) {
	ut(e, "post", t, n);
}
function dt(e, t, n) {
	ut(e, "pre", t, n);
}
F.pre = dt;
// node_modules/runed/dist/internal/utils/get.js
function ft(e) {
	return ct(e) ? e() : e;
}
// node_modules/runed/dist/utilities/element-size/element-size.svelte.js
var pt = class {
	#e = {
		width: 0,
		height: 0
	};
	#t = !1;
	#n;
	#r;
	#i;
	#a = j(() => (e(this.#s)?.(), this.getSize().width));
	#o = j(() => (e(this.#s)?.(), this.getSize().height));
	#s = j(() => {
		let e = ft(this.#r);
		if (e) return te((t) => {
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
		this.#i = t.window ?? ot, this.#n = t, this.#r = e, this.#e = {
			width: 0,
			height: 0
		};
	}
	calculateSize() {
		let e = ft(this.#r);
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
		return e(this.#s)?.(), this.getSize();
	}
	get width() {
		return e(this.#a);
	}
	get height() {
		return e(this.#o);
	}
};
// node_modules/svelte-toolbelt/dist/utils/on-destroy-effect.svelte.js
function I(e) {
	O(() => () => {
		e();
	});
}
// node_modules/svelte-toolbelt/dist/utils/after-sleep.js
function mt(e, t) {
	return setTimeout(t, e);
}
// node_modules/svelte-toolbelt/dist/utils/after-tick.js
function L(e) {
	k().then(e);
}
// node_modules/svelte-toolbelt/dist/utils/dom.js
var ht = 1, gt = 9, _t = 11;
function vt(e) {
	return ae(e) && e.nodeType === ht && typeof e.nodeName == "string";
}
function yt(e) {
	return ae(e) && e.nodeType === gt;
}
function bt(e) {
	return ae(e) && e.constructor?.name === "VisualViewport";
}
function xt(e) {
	return ae(e) && e.nodeType !== void 0;
}
function St(e) {
	return xt(e) && e.nodeType === _t && "host" in e;
}
function Ct(e, t) {
	if (!e || !t || !vt(e) || !vt(t)) return !1;
	let n = t.getRootNode?.();
	if (e === t || e.contains(t)) return !0;
	if (n && St(n)) {
		let n = t;
		for (; n;) {
			if (e === n) return !0;
			n = n.parentNode || n.host;
		}
	}
	return !1;
}
function wt(e) {
	return yt(e) ? e : bt(e) ? e.document : e?.ownerDocument ?? document;
}
function Tt(e) {
	return St(e) ? Tt(e.host) : yt(e) ? e.defaultView ?? window : vt(e) ? e.ownerDocument?.defaultView ?? window : window;
}
function Et(e) {
	let t = e.activeElement;
	for (; t?.shadowRoot;) {
		let e = t.shadowRoot.activeElement;
		if (e === t) break;
		t = e;
	}
	return t;
}
// node_modules/svelte-toolbelt/dist/utils/dom-context.svelte.js
var Dt = class {
	element;
	#e = j(() => this.element.current ? this.element.current.getRootNode() ?? document : document);
	get root() {
		return e(this.#e);
	}
	set root(e) {
		x(this.#e, e);
	}
	constructor(e) {
		this.element = typeof e == "function" ? M(e) : e;
	}
	getDocument = () => wt(this.root);
	getWindow = () => this.getDocument().defaultView ?? window;
	getActiveElement = () => Et(this.root);
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
function R(e, t) {
	return { [m()]: (n) => ue(e) ? (e.current = n, T(() => t?.(n)), () => {
		"isConnected" in n && n.isConnected || (e.current = null, t?.(null));
	}) : (e(n), T(() => t?.(n)), () => {
		"isConnected" in n && n.isConnected || (e(null), t?.(null));
	}) };
}
// node_modules/bits-ui/dist/internal/attrs.js
function Ot(e) {
	return e ? "true" : "false";
}
function kt(e) {
	return e ? "" : void 0;
}
function At(e) {
	return e ? "open" : "closed";
}
function jt(e) {
	return e === "starting" ? { "data-starting-style": "" } : e === "ending" ? { "data-ending-style": "" } : {};
}
function Mt(e, t) {
	return t ? "mixed" : e ? "true" : "false";
}
var Nt = class {
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
function Pt(e) {
	let t = new Nt(e);
	return {
		...t.attrs,
		selector: t.selector,
		getAttr: t.getAttr
	};
}
// node_modules/bits-ui/dist/internal/kbd-constants.js
var Ft = "ArrowDown", It = "ArrowLeft", Lt = "ArrowRight", Rt = "ArrowUp", zt = "Enter", Bt = "Home", Vt = "PageDown", Ht = "PageUp";
// node_modules/bits-ui/dist/internal/locale.js
function Ut(e) {
	return window.getComputedStyle(e).getPropertyValue("direction");
}
// node_modules/bits-ui/dist/internal/get-directional-keys.js
var Wt = [
	Ft,
	Ht,
	Bt
], Gt = [
	Rt,
	Vt,
	"End"
];
[...Wt, ...Gt];
function Kt(e = "ltr", t = "horizontal") {
	return {
		horizontal: e === "rtl" ? It : Lt,
		vertical: Ft
	}[t];
}
function qt(e = "ltr", t = "horizontal") {
	return {
		horizontal: e === "rtl" ? Lt : It,
		vertical: Rt
	}[t];
}
function Jt(e = "ltr", t = "horizontal") {
	return ["ltr", "rtl"].includes(e) || (e = "ltr"), ["horizontal", "vertical"].includes(t) || (t = "horizontal"), {
		nextKey: Kt(e, t),
		prevKey: qt(e, t)
	};
}
// node_modules/bits-ui/dist/internal/is.js
var Yt = typeof document < "u", Xt = Zt();
function Zt() {
	return Yt && window?.navigator?.userAgent && (/iP(ad|hone|od)/.test(window.navigator.userAgent) || window?.navigator?.maxTouchPoints > 2 && /iPad|Macintosh/.test(window?.navigator.userAgent));
}
function z(e) {
	return e instanceof HTMLElement;
}
function Qt(e) {
	return e instanceof Element;
}
function $t(e) {
	return e instanceof Element || e instanceof SVGElement;
}
function en(e) {
	return e.pointerType === "touch";
}
function tn(e) {
	return e !== null;
}
function nn(e) {
	return e instanceof HTMLInputElement && "select" in e;
}
// node_modules/bits-ui/dist/internal/roving-focus-group.js
var rn = class {
	#e;
	#t = he(null);
	constructor(e) {
		this.#e = e;
	}
	getCandidateNodes() {
		return this.#e.rootNode.current ? this.#e.candidateSelector ? Array.from(this.#e.rootNode.current.querySelectorAll(this.#e.candidateSelector)) : this.#e.candidateAttr ? Array.from(this.#e.rootNode.current.querySelectorAll(`[${this.#e.candidateAttr}]:not([data-disabled])`)) : [] : [];
	}
	focusFirstCandidate() {
		let e = this.getCandidateNodes();
		e.length && e[0]?.focus();
	}
	handleKeydown(e, t, n = !1) {
		let r = this.#e.rootNode.current;
		if (!r || !e) return;
		let i = this.getCandidateNodes();
		if (!i.length) return;
		let a = i.indexOf(e), { nextKey: o, prevKey: s } = Jt(Ut(r), this.#e.orientation.current), c = this.#e.loop.current, l = {
			[o]: a + 1,
			[s]: a - 1,
			[Bt]: 0,
			End: i.length - 1
		};
		if (n) {
			let e = o === "ArrowDown" ? Lt : Ft, t = s === "ArrowUp" ? It : Rt;
			l[e] = a + 1, l[t] = a - 1;
		}
		let u = l[t.key];
		if (u === void 0) return;
		t.preventDefault(), u < 0 && c ? u = i.length - 1 : u === i.length && c && (u = 0);
		let d = i[u];
		if (d) return d.focus(), this.#t.current = d.id, this.#e.onCandidateFocus?.(d), d;
	}
	getTabIndex(e) {
		let t = this.getCandidateNodes(), n = this.#t.current !== null;
		return e && !n && t[0] === e ? (this.#t.current = e.id, 0) : e?.id === this.#t.current ? 0 : -1;
	}
	setCurrentTabStopId(e) {
		this.#t.current = e;
	}
	focusCurrentTabStop() {
		let e = this.#t.current;
		if (!e) return;
		let t = this.#e.rootNode.current?.querySelector(`#${e}`);
		t && z(t) && t.focus();
	}
}, an = class {
	#e;
	#t = null;
	#n = null;
	#r = 0;
	constructor(e) {
		this.#e = e, I(() => this.#i());
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
		this.#e.afterTick ? L(t) : t();
	}
}, on = class {
	#e;
	#t;
	#n;
	#r = h(!1);
	#i = h(void 0);
	#a = !1;
	#o = null;
	constructor(e) {
		this.#e = e, x(this.#r, e.open.current, !0), this.#t = e.enabled ?? !0, this.#n = new an({
			ref: this.#e.ref,
			afterTick: this.#e.open
		}), I(() => this.#s()), F(() => this.#e.open.current, (e) => {
			this.#a ? (this.#s(), !e && this.#e.shouldSkipExitAnimation?.() ? (x(this.#r, !1), x(this.#i, void 0), this.#e.onComplete?.()) : (e && x(this.#r, !0), x(this.#i, e ? "starting" : "ending", !0), e && (this.#o = window.requestAnimationFrame(() => {
				this.#o = null, this.#e.open.current && x(this.#i, void 0);
			})), this.#t ? this.#n.run(() => {
				e === this.#e.open.current && (this.#e.open.current || x(this.#r, !1), x(this.#i, void 0), this.#e.onComplete?.());
			}) : (e || x(this.#r, !1), x(this.#i, void 0), this.#e.onComplete?.()))) : this.#a = !0;
		});
	}
	get shouldRender() {
		return e(this.#r);
	}
	get transitionStatus() {
		return e(this.#i);
	}
	#s() {
		this.#o !== null && (window.cancelAnimationFrame(this.#o), this.#o = null);
	}
};
// node_modules/bits-ui/dist/internal/noop.js
function B() {}
// node_modules/bits-ui/dist/internal/create-id.js
function sn(e, t) {
	return t === void 0 ? `bits-${e}` : `bits-${e}-${t}`;
}
// node_modules/bits-ui/dist/bits/utilities/portal/portal-consumer.svelte
function cn(e, r) {
	var i = f(), a = y(i);
	l(a, () => r.children, (e) => {
		var i = f(), a = y(i);
		t(a, () => r.children ?? u), n(e, i);
	}), n(e, i);
}
// node_modules/bits-ui/dist/bits/utilities/config/bits-config.js
var ln = new P("BitsConfig");
function un() {
	let e = new fn(null, {});
	return ln.getOr(e).opts;
}
function dn(e) {
	return ln.set(new fn(ln.getOr(null), e));
}
var fn = class {
	opts;
	constructor(e, t) {
		let n = pn(e, t);
		this.opts = {
			defaultPortalTo: n((e) => e.defaultPortalTo),
			defaultLocale: n((e) => e.defaultLocale)
		};
	}
};
function pn(e, t) {
	return (n) => M(() => {
		let r = n(t)?.current;
		if (r !== void 0) return r;
		if (e !== null) return n(e.opts)?.current;
	});
}
// node_modules/bits-ui/dist/bits/utilities/config/prop-resolvers.js
function mn(e, t) {
	return (n) => {
		let r = un();
		return M(() => {
			let i = n();
			if (i !== void 0) return i;
			let a = e(r).current;
			return a === void 0 ? t : a;
		});
	};
}
var hn = mn((e) => e.defaultPortalTo, "body");
// node_modules/bits-ui/dist/bits/utilities/portal/portal.svelte
function gn(i, o) {
	c(o, !0);
	let l = hn(() => o.to), d = ee(), p = j(m);
	function m() {
		if (!Yt || o.disabled) return null;
		let e = null;
		return e = typeof l.current == "string" ? document.querySelector(l.current) : l.current, e;
	}
	let h;
	function g() {
		h &&= (ne(h), null);
	}
	F([() => e(p), () => o.disabled], ([e, t]) => {
		if (!e || t) g();
		else return h = s(cn, {
			target: e,
			props: { children: o.children },
			context: d
		}), () => {
			g();
		};
	});
	var _ = f(), v = y(_), b = (e) => {
		var r = f(), i = y(r);
		t(i, () => o.children ?? u), n(e, r);
	};
	a(v, (e) => {
		o.disabled && e(b);
	}), n(i, _), r();
}
// node_modules/bits-ui/dist/internal/events.js
var _n = class {
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
		return p(e, this.eventName, (e) => {
			t(e);
		}, n);
	}
};
// node_modules/bits-ui/dist/internal/debounce.js
function vn(e, t = 500) {
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
function yn(e, t) {
	return e === t || e.contains(t);
}
function bn(e) {
	return e?.ownerDocument ?? document;
}
// node_modules/bits-ui/dist/internal/dom.js
function xn(e, t) {
	let { clientX: n, clientY: r } = e, i = t.getBoundingClientRect();
	return n < i.left || n > i.right || r < i.top || r > i.bottom;
}
// node_modules/bits-ui/dist/bits/menu/utils.js
var Sn = [zt, " "], Cn = [
	Ft,
	Ht,
	Bt
], wn = [
	Rt,
	Vt,
	"End"
], Tn = [...Cn, ...wn], En = {
	ltr: [...Sn, Lt],
	rtl: [...Sn, It]
}, Dn = {
	ltr: [It],
	rtl: [Lt]
};
function On(e) {
	return e === "indeterminate";
}
function kn(e) {
	return On(e) ? "indeterminate" : e ? "checked" : "unchecked";
}
function V(e) {
	return e.pointerType === "mouse";
}
// node_modules/bits-ui/dist/internal/focus.js
function An(e, { select: t = !1 } = {}) {
	if (!e || !e.focus) return;
	let n = wt(e);
	if (n.activeElement === e) return;
	let r = n.activeElement;
	e.focus({ preventScroll: !0 }), e !== r && nn(e) && t && e.select();
}
function jn(e, { select: t = !1 } = {}, n) {
	let r = n();
	for (let i of e) if (An(i, { select: t }), n() !== r) return !0;
}
// node_modules/bits-ui/dist/bits/utilities/is-using-keyboard/is-using-keyboard.svelte.js
var Mn = h(!1), Nn = class t {
	static _refs = 0;
	static _cleanup;
	constructor() {
		O(() => (t._refs === 0 && (t._cleanup = _(() => {
			let e = [], t = (e) => {
				x(Mn, !1);
			};
			return e.push(p(document, "pointerdown", t, { capture: !0 }), p(document, "pointermove", t, { capture: !0 }), p(document, "keydown", (e) => {
				x(Mn, !0);
			}, { capture: !0 })), Xe(...e);
		})), t._refs++, () => {
			t._refs--, t._refs === 0 && (x(Mn, !1), t._cleanup?.());
		}));
	}
	get current() {
		return e(Mn);
	}
	set current(e) {
		x(Mn, e, !0);
	}
}, Pn = [
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
], Fn = /* #__PURE__ */ Pn.join(","), In = typeof Element > "u", H = In ? function() {} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector, Ln = !In && Element.prototype.getRootNode ? function(e) {
	return e == null || e.getRootNode == null ? void 0 : e.getRootNode();
} : function(e) {
	return e?.ownerDocument;
}, Rn = function(e, t) {
	t === void 0 && (t = !0);
	var n = e == null || e.getAttribute == null ? void 0 : e.getAttribute("inert");
	return n === "" || n === "true" || t && e && (typeof e.closest == "function" ? e.closest("[inert]") : Rn(e.parentNode));
}, zn = function(e) {
	var t, n = e == null || e.getAttribute == null || (t = e.getAttribute("contenteditable")) == null ? void 0 : t.toLowerCase();
	return n === "" || n === "true" || n === "plaintext-only";
}, Bn = function(e, t, n) {
	if (Rn(e)) return [];
	var r = Array.prototype.slice.apply(e.querySelectorAll(Fn));
	return t && H.call(e, Fn) && r.unshift(e), r = r.filter(n), r;
}, Vn = function(e, t, n) {
	for (var r = [], i = Array.from(e); i.length;) {
		var a = i.shift();
		if (!Rn(a, !1)) {
			if (a.tagName === "SLOT") {
				var o = a.assignedElements(), s = Vn(o.length ? o : a.children, !0, n);
				n.flatten ? r.push.apply(r, s) : r.push({
					scopeParent: a,
					candidates: s
				});
			} else {
				H.call(a, Fn) && n.filter(a) && (t || !e.includes(a)) && r.push(a);
				var c = a.shadowRoot || typeof n.getShadowRoot == "function" && n.getShadowRoot(a), l = !Rn(c, !1) && (!n.shadowRootFilter || n.shadowRootFilter(a));
				if (c && l) {
					var u = Vn(c === !0 ? a.children : c.children, !0, n);
					n.flatten ? r.push.apply(r, u) : r.push({
						scopeParent: a,
						candidates: u
					});
				} else i.unshift.apply(i, a.children);
			}
		}
	}
	return r;
}, Hn = function(e) {
	return !isNaN(parseInt(e.getAttribute("tabindex"), 10));
}, Un = function(e) {
	if (!e) throw Error("No node provided");
	return e.tabIndex < 0 && (/^(AUDIO|VIDEO|DETAILS)$/.test(e.tagName) || zn(e)) && !Hn(e) ? 0 : e.tabIndex;
}, Wn = function(e, t) {
	var n = Un(e);
	return n < 0 && t && !Hn(e) ? 0 : n;
}, Gn = function(e, t) {
	return e.tabIndex === t.tabIndex ? e.documentOrder - t.documentOrder : e.tabIndex - t.tabIndex;
}, Kn = function(e) {
	return e.tagName === "INPUT";
}, qn = function(e) {
	return Kn(e) && e.type === "hidden";
}, Jn = function(e) {
	return e.tagName === "DETAILS" && Array.prototype.slice.apply(e.children).some(function(e) {
		return e.tagName === "SUMMARY";
	});
}, Yn = function(e, t) {
	for (var n = 0; n < e.length; n++) if (e[n].checked && e[n].form === t) return e[n];
}, Xn = function(e) {
	if (!e.name) return !0;
	var t = e.form || Ln(e), n = function(e) {
		return t.querySelectorAll("input[type=\"radio\"][name=\"" + e + "\"]");
	}, r;
	if (typeof window < "u" && window.CSS !== void 0 && typeof window.CSS.escape == "function") r = n(window.CSS.escape(e.name));
	else try {
		r = n(e.name);
	} catch (e) {
		return console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s", e.message), !1;
	}
	var i = Yn(r, e.form);
	return !i || i === e;
}, Zn = function(e) {
	return Kn(e) && e.type === "radio";
}, Qn = function(e) {
	return Zn(e) && !Xn(e);
}, $n = function(e) {
	var t = e && Ln(e), n = t?.host, r = !1;
	if (t && t !== e) {
		var i, a;
		for (r = !!((i = n) != null && (i = i.ownerDocument) != null && i.contains(n) || e != null && (a = e.ownerDocument) != null && a.contains(e)); !r && n;) {
			var o;
			t = Ln(n), n = t?.host, r = !!((o = n) != null && (o = o.ownerDocument) != null && o.contains(n));
		}
	}
	return r;
}, er = function(e) {
	var t = e.getBoundingClientRect(), n = t.width, r = t.height;
	return n === 0 && r === 0;
}, tr = function(e, t) {
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
	var a = H.call(e, "details>summary:first-of-type") ? e.parentElement : e;
	if (H.call(a, "details:not([open]) *")) return !0;
	if (!n || n === "full" || n === "full-native" || n === "legacy-full") {
		if (typeof r == "function") {
			for (var o = e; e;) {
				var s = e.parentElement, c = Ln(e);
				if (s && !s.shadowRoot && r(s) === !0) return er(e);
				e = e.assignedSlot ? e.assignedSlot : !s && c !== e.ownerDocument ? c.host : s;
			}
			e = o;
		}
		if ($n(e)) return !e.getClientRects().length;
		if (n !== "legacy-full") return !0;
	} else if (n === "non-zero-area") return er(e);
	return !1;
}, nr = function(e) {
	if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(e.tagName)) for (var t = e.parentElement; t;) {
		if (t.tagName === "FIELDSET" && t.disabled) {
			for (var n = 0; n < t.children.length; n++) {
				var r = t.children.item(n);
				if (r.tagName === "LEGEND") return H.call(t, "fieldset[disabled] *") ? !0 : !r.contains(e);
			}
			return !0;
		}
		t = t.parentElement;
	}
	return !1;
}, rr = function(e, t) {
	return !(t.disabled || qn(t) || tr(t, e) || Jn(t) || nr(t));
}, ir = function(e, t) {
	return !(Qn(t) || Un(t) < 0 || !rr(e, t));
}, ar = function(e) {
	var t = parseInt(e.getAttribute("tabindex"), 10);
	return !!(isNaN(t) || t >= 0);
}, or = function(e) {
	var t = [], n = [];
	return e.forEach(function(e, r) {
		var i = !!e.scopeParent, a = i ? e.scopeParent : e, o = Wn(a, i), s = i ? or(e.candidates) : a;
		o === 0 ? i ? t.push.apply(t, s) : t.push(a) : n.push({
			documentOrder: r,
			tabIndex: o,
			item: e,
			isScope: i,
			content: s
		});
	}), n.sort(Gn).reduce(function(e, t) {
		return t.isScope ? e.push.apply(e, t.content) : e.push(t.content), e;
	}, []).concat(t);
}, sr = function(e, t) {
	return t ||= {}, or(t.getShadowRoot ? Vn([e], t.includeContainer, {
		filter: ir.bind(null, t),
		flatten: !1,
		getShadowRoot: t.getShadowRoot,
		shadowRootFilter: ar
	}) : Bn(e, t.includeContainer, ir.bind(null, t)));
}, cr = function(e, t) {
	return t ||= {}, t.getShadowRoot ? Vn([e], t.includeContainer, {
		filter: rr.bind(null, t),
		flatten: !0,
		getShadowRoot: t.getShadowRoot
	}) : Bn(e, t.includeContainer, rr.bind(null, t));
}, lr = function(e, t) {
	if (t ||= {}, !e) throw Error("No node provided");
	return H.call(e, Fn) !== !1 && ir(t, e);
}, ur = /* #__PURE__ */ Pn.concat("iframe:not([inert]):not([inert] *)").join(","), dr = function(e, t) {
	if (t ||= {}, !e) throw Error("No node provided");
	return H.call(e, ur) !== !1 && rr(t, e);
};
// node_modules/bits-ui/dist/internal/tabbable.js
function fr() {
	return {
		getShadowRoot: !0,
		displayCheck: typeof ResizeObserver == "function" && ResizeObserver.toString().includes("[native code]") ? "full" : "none"
	};
}
function pr(e, t) {
	if (!lr(e, fr())) return mr(e, t);
	let n = wt(e), r = sr(n.body, fr());
	t === "prev" && r.reverse();
	let i = r.indexOf(e);
	return i === -1 ? n.body : r.slice(i + 1)[0];
}
function mr(e, t) {
	let n = wt(e);
	if (!dr(e, fr())) return n.body;
	let r = cr(n.body, fr());
	t === "prev" && r.reverse();
	let i = r.indexOf(e);
	return i === -1 ? n.body : r.slice(i + 1).find((e) => lr(e, fr())) ?? n.body;
}
// node_modules/bits-ui/dist/internal/arrays.js
function hr(e, t, n) {
	let r = t.toLowerCase();
	if (r.endsWith(" ")) {
		let i = r.slice(0, -1);
		if (e.filter((e) => e.toLowerCase().startsWith(i)).length <= 1) return hr(e, i, n);
		let a = n?.toLowerCase();
		if (a && a.startsWith(i) && a.charAt(i.length) === " " && t.trim() === i) return n;
		let o = e.filter((e) => e.toLowerCase().startsWith(r));
		if (o.length > 0) {
			let t = n ? e.indexOf(n) : -1;
			return gr(o, Math.max(t, 0)).find((e) => e !== n) || n;
		}
	}
	let i = t.length > 1 && Array.from(t).every((e) => e === t[0]) ? t[0] : t, a = i.toLowerCase(), o = n ? e.indexOf(n) : -1, s = gr(e, Math.max(o, 0));
	i.length === 1 && (s = s.filter((e) => e !== n));
	let c = s.find((e) => e?.toLowerCase().startsWith(a));
	return c === n ? void 0 : c;
}
function gr(e, t) {
	return e.map((n, r) => e[(t + r) % e.length]);
}
// node_modules/bits-ui/dist/internal/box-auto-reset.svelte.js
var _r = {
	afterMs: 1e4,
	onChange: B
};
function vr(t, n) {
	let { afterMs: r, onChange: i, getWindow: a } = {
		..._r,
		...n
	}, o = null, s = h(E(t));
	function c() {
		return a().setTimeout(() => {
			x(s, t, !0), i?.(t);
		}, r);
	}
	return O(() => () => {
		o && a().clearTimeout(o);
	}), M(() => e(s), (e) => {
		x(s, e, !0), i?.(e), o && a().clearTimeout(o), o = c();
	});
}
// node_modules/bits-ui/dist/internal/dom-typeahead.svelte.js
var yr = class {
	#e;
	#t;
	#n = j(() => this.#e.onMatch ? this.#e.onMatch : (e) => e.focus());
	#r = j(() => this.#e.getCurrentItem ? this.#e.getCurrentItem : this.#e.getActiveElement);
	constructor(e) {
		this.#e = e, this.#t = vr("", {
			afterMs: 1e3,
			getWindow: e.getWindow
		}), this.handleTypeaheadSearch = this.handleTypeaheadSearch.bind(this), this.resetTypeahead = this.resetTypeahead.bind(this);
	}
	handleTypeaheadSearch(t, n) {
		if (!n.length) return;
		this.#t.current = this.#t.current + t;
		let r = e(this.#r)(), i = n.find((e) => e === r)?.textContent?.trim() ?? "", a = hr(n.map((e) => e.textContent?.trim() ?? ""), this.#t.current, i), o = n.find((e) => e.textContent?.trim() === a);
		return o && e(this.#n)(o), o;
	}
	resetTypeahead() {
		this.#t.current = "";
	}
	get search() {
		return this.#t.current;
	}
}, br = "data-context-menu-trigger", xr = "data-context-menu-content", Sr = new P("Menu.Root"), Cr = new P("Menu.Root | Menu.Sub"), wr = new P("Menu.Content");
new P("Menu.Group | Menu.RadioGroup"), new P("Menu.RadioGroup");
var Tr = new P("Menu.CheckboxGroup"), Er = new _n("bitsmenuopen", {
	bubbles: !1,
	cancelable: !0
}), Dr = Pt({
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
}), Or = class {
	#e;
	#t = null;
	#n = null;
	#r = !1;
	#i = null;
	#a = null;
	#o = null;
	#s = null;
	constructor(e) {
		this.#e = e, F([
			e.triggerNode,
			e.contentNode,
			e.enabled
		], ([e, t, n]) => {
			if (this.#_(), !e || !t || !n) return;
			let r = (e) => {
				V(e) && (this.#s = {
					x: e.clientX,
					y: e.clientY
				}, this.#r || this.#d(e, "content"));
			}, i = (e) => {
				V(e) && this.#f(e, "content");
			}, a = (e) => {
				V(e) && (this.#r || this.#d(e, "trigger"));
			}, o = (e) => {
				if (V(e)) {
					if (Qt(e.relatedTarget)) {
						let n = this.#e.subContentSelector(), r = e.relatedTarget.closest(n);
						if (r && r !== t && r.id && t.querySelector(`[aria-controls="${r.id}"]`)) return;
					}
					this.#f(e, "trigger");
				}
			}, s = (e) => {
				V(e) && this.#m();
			}, c = (e) => {
				V(e) && this.#m();
			};
			return e.addEventListener("pointermove", r), e.addEventListener("pointerleave", i), e.addEventListener("pointerenter", s), t.addEventListener("pointermove", a), t.addEventListener("pointerleave", o), t.addEventListener("pointerenter", c), () => {
				e.removeEventListener("pointermove", r), e.removeEventListener("pointerleave", i), e.removeEventListener("pointerenter", s), t.removeEventListener("pointermove", a), t.removeEventListener("pointerleave", o), t.removeEventListener("pointerenter", c), this.#_();
			};
		}), I(() => {
			this.#_();
		});
	}
	#c() {
		let e = this.#e.parentContentNode();
		return e ? e.getBoundingClientRect() : this.#e.triggerNode()?.getBoundingClientRect() ?? null;
	}
	#l(e, t) {
		let n = this.#e.triggerNode(), r = this.#e.contentNode();
		if (!n || !r) return null;
		let i = n.getBoundingClientRect(), a = r.getBoundingClientRect(), o = Mr(i, a), s, c, l;
		return t === "content" ? (s = this.#r ? this.#a ?? e : e, c = a) : (s = this.#s ?? e, c = this.#c() ?? i, l = a), this.#a = s, {
			corridor: Nr(i, a, o),
			intent: Pr(s, c, o, t, l),
			targetRect: c,
			side: o
		};
	}
	#u(e, t, n) {
		return kr(e, t) || kr(e, n);
	}
	#d(e, t) {
		let n = {
			x: e.clientX,
			y: e.clientY
		};
		this.#l(n, t) && (this.#i = t, this.#o = n);
	}
	#f(e, t) {
		if (!this.#e.enabled()) return;
		let n = this.#e.triggerNode(), r = this.#e.contentNode();
		if (!n || !r) return;
		let i = e.relatedTarget;
		if (Qt(i) && (t === "content" && r.contains(i) || t === "trigger" && n.contains(i))) return;
		let a = {
			x: e.clientX,
			y: e.clientY
		}, o = this.#l(a, t);
		o && (!Ar(a, o.targetRect) && !this.#u(a, o.corridor, o.intent) ? this.#w() : (this.#r = !0, this.#i = t, this.#o = a, this.#e.setIsPointerInTransit(!0), this.#b(), this.#S()));
	}
	#p = null;
	#m() {
		if (!this.#r) return;
		let e = this.#i === "trigger";
		this.#x(), this.#C(), this.#r = !1, this.#w(), e ? (this.#h(), this.#p = setTimeout(() => {
			this.#p = null, this.#e.setIsPointerInTransit(!1);
		}, 100)) : this.#e.setIsPointerInTransit(!1);
	}
	#h() {
		this.#p !== null && (clearTimeout(this.#p), this.#p = null);
	}
	#g() {
		let e = this.#o;
		this.#x(), this.#C(), this.#h(), this.#r = !1, this.#e.setIsPointerInTransit(!1), this.#w(), this.#e.onIntentExit(e);
	}
	#_() {
		this.#x(), this.#C(), this.#h(), this.#r && this.#e.setIsPointerInTransit(!1), this.#r = !1, this.#i = null, this.#a = null, this.#o = null, this.#s = null;
	}
	#v(e) {
		let t = this.#e.contentNode();
		if (!t) return !1;
		let n = t.ownerDocument.elementFromPoint(e.x, e.y);
		if (!n) return !1;
		let r = this.#e.subContentSelector(), i = n.closest(r);
		return !i || i === t ? !1 : i.id ? !!t.querySelector(`[aria-controls="${i.id}"]`) : !1;
	}
	#y = (e) => {
		if (!this.#r || !this.#i || !V(e)) return;
		let t = this.#e.triggerNode(), n = this.#e.contentNode();
		if (!t || !n) {
			this.#g();
			return;
		}
		this.#C();
		let r = {
			x: e.clientX,
			y: e.clientY
		};
		this.#o = r;
		let i = t.getBoundingClientRect(), a = n.getBoundingClientRect();
		if (this.#i === "content" && Ar(r, a) || this.#i === "trigger" && jr(r, i, 4)) {
			this.#m();
			return;
		}
		if (this.#v(r)) {
			this.#S();
			return;
		}
		let o = this.#l(r, this.#i);
		o && this.#u(r, o.corridor, o.intent) ? this.#S() : this.#g();
	};
	#b() {
		if (this.#t) return;
		let e = wt(this.#e.triggerNode() ?? this.#e.contentNode());
		e && (e.addEventListener("pointermove", this.#y, !0), this.#t = () => {
			e.removeEventListener("pointermove", this.#y, !0), this.#t = null;
		});
	}
	#x() {
		this.#t?.();
	}
	#S() {
		this.#C(), this.#n = setTimeout(() => {
			this.#n = null, this.#r && this.#g();
		}, 500);
	}
	#C() {
		this.#n !== null && (clearTimeout(this.#n), this.#n = null);
	}
	#w() {
		this.#i = null, this.#a = null, this.#o = null;
	}
};
function kr(e, t) {
	let { x: n, y: r } = e, i = !1;
	for (let e = 0, a = t.length - 1; e < t.length; a = e++) {
		let o = t[e].x, s = t[e].y, c = t[a].x, l = t[a].y;
		s > r != l > r && n < (c - o) * (r - s) / (l - s) + o && (i = !i);
	}
	return i;
}
function Ar(e, t) {
	return e.x >= t.left && e.x <= t.right && e.y >= t.top && e.y <= t.bottom;
}
function jr(e, t, n) {
	return e.x >= t.left + n && e.x <= t.right - n && e.y >= t.top + n && e.y <= t.bottom - n;
}
function Mr(e, t) {
	let n = e.left + e.width / 2, r = e.top + e.height / 2, i = t.left + t.width / 2, a = t.top + t.height / 2, o = i - n, s = a - r;
	return Math.abs(o) > Math.abs(s) ? o > 0 ? "right" : "left" : s > 0 ? "bottom" : "top";
}
function Nr(e, t, n) {
	switch (n) {
		case "top": return [
			{
				x: Math.min(e.left, t.left) - 2,
				y: e.top
			},
			{
				x: Math.min(e.left, t.left) - 2,
				y: t.bottom
			},
			{
				x: Math.max(e.right, t.right) + 2,
				y: t.bottom
			},
			{
				x: Math.max(e.right, t.right) + 2,
				y: e.top
			}
		];
		case "bottom": return [
			{
				x: Math.min(e.left, t.left) - 2,
				y: e.bottom
			},
			{
				x: Math.min(e.left, t.left) - 2,
				y: t.top
			},
			{
				x: Math.max(e.right, t.right) + 2,
				y: t.top
			},
			{
				x: Math.max(e.right, t.right) + 2,
				y: e.bottom
			}
		];
		case "left": return [
			{
				x: e.left,
				y: Math.min(e.top, t.top) - 2
			},
			{
				x: t.right,
				y: Math.min(e.top, t.top) - 2
			},
			{
				x: t.right,
				y: Math.max(e.bottom, t.bottom) + 2
			},
			{
				x: e.left,
				y: Math.max(e.bottom, t.bottom) + 2
			}
		];
		case "right": return [
			{
				x: e.right,
				y: Math.min(e.top, t.top) - 2
			},
			{
				x: t.left,
				y: Math.min(e.top, t.top) - 2
			},
			{
				x: t.left,
				y: Math.max(e.bottom, t.bottom) + 2
			},
			{
				x: e.right,
				y: Math.max(e.bottom, t.bottom) + 2
			}
		];
	}
}
function Pr(e, t, n, r, i) {
	let a = r === "trigger" ? Fr(n) : n, o = i ? Math.min(t.top, i.top) - 8 : t.top - 8, s = i ? Math.max(t.bottom, i.bottom) + 8 : t.bottom + 8, c = i ? Math.min(t.left, i.left) - 8 : t.left - 8, l = i ? Math.max(t.right, i.right) + 8 : t.right + 8;
	switch (a) {
		case "right": return [
			e,
			{
				x: t.left,
				y: o
			},
			{
				x: t.left,
				y: s
			}
		];
		case "left": return [
			e,
			{
				x: t.right,
				y: o
			},
			{
				x: t.right,
				y: s
			}
		];
		case "bottom": return [
			e,
			{
				x: c,
				y: t.top
			},
			{
				x: l,
				y: t.top
			}
		];
		case "top": return [
			e,
			{
				x: c,
				y: t.bottom
			},
			{
				x: l,
				y: t.bottom
			}
		];
	}
}
function Fr(e) {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}
var Ir = class t {
	static create(e) {
		let n = new t(e);
		return Sr.set(n);
	}
	opts;
	isUsingKeyboard = new Nn();
	#e = h(!1);
	get ignoreCloseAutoFocus() {
		return e(this.#e);
	}
	set ignoreCloseAutoFocus(e) {
		x(this.#e, e, !0);
	}
	#t = h(!1);
	get isPointerInTransit() {
		return e(this.#t);
	}
	set isPointerInTransit(e) {
		x(this.#t, e, !0);
	}
	constructor(e) {
		this.opts = e;
	}
	getBitsAttr = (e) => Dr.getAttr(e, this.opts.variant.current);
}, Lr = class t {
	static create(e, n) {
		return Cr.set(new t(e, n, null));
	}
	opts;
	root;
	parentMenu;
	contentId = M(() => "");
	#e = h(null);
	get contentNode() {
		return e(this.#e);
	}
	set contentNode(e) {
		x(this.#e, e, !0);
	}
	contentPresence;
	#t = h(null);
	get triggerNode() {
		return e(this.#t);
	}
	set triggerNode(e) {
		x(this.#t, e, !0);
	}
	constructor(e, t, n) {
		this.opts = e, this.root = t, this.parentMenu = n, this.contentPresence = new on({
			ref: M(() => this.contentNode),
			open: this.opts.open,
			onComplete: () => {
				this.opts.onOpenChangeComplete.current(this.opts.open.current);
			},
			shouldSkipExitAnimation: () => this.root.opts.variant.current !== "menubar" || this.parentMenu !== null ? !1 : this.root.opts.shouldSkipExitAnimation?.() ?? !1
		}), n && F(() => n.opts.open.current, () => {
			n.opts.open.current || (this.opts.open.current = !1);
		});
	}
	toggleOpen() {
		this.opts.open.current = !this.opts.open.current;
	}
	onOpen() {
		this.opts.open.current = !0;
	}
	onClose() {
		this.opts.open.current = !1;
	}
}, Rr = class t {
	static create(e) {
		return wr.set(new t(e, Cr.get()));
	}
	opts;
	parentMenu;
	rovingFocusGroup;
	domContext;
	attachment;
	#e = h("");
	get search() {
		return e(this.#e);
	}
	set search(e) {
		x(this.#e, e, !0);
	}
	#t = 0;
	#n;
	#r = h(!1);
	get mounted() {
		return e(this.#r);
	}
	set mounted(e) {
		x(this.#r, e, !0);
	}
	#i;
	constructor(e, t) {
		this.opts = e, this.parentMenu = t, this.domContext = new Dt(e.ref), this.attachment = R(this.opts.ref, (e) => {
			this.parentMenu.contentNode !== e && (this.parentMenu.contentNode = e);
		}), t.contentId = e.id, this.#i = e.isSub ?? !1, this.onkeydown = this.onkeydown.bind(this), this.onblur = this.onblur.bind(this), this.onfocus = this.onfocus.bind(this), this.handleInteractOutside = this.handleInteractOutside.bind(this), new Or({
			contentNode: () => this.parentMenu.contentNode,
			triggerNode: () => this.parentMenu.triggerNode,
			parentContentNode: () => this.parentMenu.parentMenu?.contentNode ?? null,
			subContentSelector: () => `[${this.parentMenu.root.getBitsAttr("sub-content")}]`,
			enabled: () => this.parentMenu.opts.open.current && !!this.parentMenu.triggerNode?.hasAttribute(this.parentMenu.root.getBitsAttr("sub-trigger")),
			onIntentExit: (e) => {
				this.parentMenu.opts.open.current = !1, this.#s(e);
			},
			setIsPointerInTransit: (e) => {
				this.parentMenu.root.isPointerInTransit = e;
			}
		}), this.#n = new yr({
			getActiveElement: () => this.domContext.getActiveElement(),
			getWindow: () => this.domContext.getWindow()
		}).handleTypeaheadSearch, this.rovingFocusGroup = new rn({
			rootNode: M(() => this.parentMenu.contentNode),
			candidateAttr: this.parentMenu.root.getBitsAttr("item"),
			loop: this.opts.loop,
			orientation: M(() => "vertical")
		}), F(() => this.parentMenu.contentNode, (e) => e ? Er.listen(e, () => {
			L(() => {
				this.parentMenu.root.isUsingKeyboard.current && this.rovingFocusGroup.focusFirstCandidate();
			});
		}) : void 0), O(() => {
			this.parentMenu.opts.open.current || this.domContext.getWindow().clearTimeout(this.#t);
		});
	}
	#a() {
		let e = this.parentMenu.contentNode;
		return e ? Array.from(e.querySelectorAll(`[${this.parentMenu.root.getBitsAttr("item")}]:not([data-disabled])`)) : [];
	}
	#o() {
		return this.parentMenu.root.isPointerInTransit;
	}
	#s(e) {
		if (!e) return;
		let t = this.parentMenu.parentMenu?.contentNode;
		if (!t) return;
		let n = this.domContext.getDocument().elementFromPoint(e.x, e.y);
		if (!Qt(n)) return;
		let r = n.closest(`[${this.parentMenu.root.getBitsAttr("sub-trigger")}]`);
		r && t.contains(r) && r !== this.parentMenu.triggerNode && r.dispatchEvent(new PointerEvent("pointermove", {
			bubbles: !0,
			cancelable: !0,
			pointerType: "mouse",
			clientX: e.x,
			clientY: e.y
		}));
	}
	onCloseAutoFocus = (e) => {
		this.opts.onCloseAutoFocus.current?.(e), e.defaultPrevented || this.#i || (this.parentMenu.root.ignoreCloseAutoFocus ? e.preventDefault() : this.parentMenu.triggerNode && lr(this.parentMenu.triggerNode) && (e.preventDefault(), this.parentMenu.triggerNode.focus()));
	};
	handleTabKeyDown(e) {
		let t = this.parentMenu;
		for (; t.parentMenu !== null;) t = t.parentMenu;
		if (!t.triggerNode) return;
		e.preventDefault();
		let n = pr(t.triggerNode, e.shiftKey ? "prev" : "next");
		n ? (this.parentMenu.root.ignoreCloseAutoFocus = !0, t.onClose(), L(() => {
			n.focus(), L(() => {
				this.parentMenu.root.ignoreCloseAutoFocus = !1;
			});
		})) : this.domContext.getDocument().body.focus();
	}
	onkeydown(e) {
		if (e.defaultPrevented) return;
		if (e.key === "Tab") {
			this.handleTabKeyDown(e);
			return;
		}
		let t = e.target, n = e.currentTarget;
		if (!z(t) || !z(n)) return;
		let r = t.closest(`[${this.parentMenu.root.getBitsAttr("content")}]`)?.id === this.parentMenu.contentId.current, i = e.ctrlKey || e.altKey || e.metaKey, a = e.key.length === 1;
		if (this.rovingFocusGroup.handleKeydown(t, e) || e.code === "Space") return;
		let o = this.#a();
		r && !i && a && this.#n(e.key, o), e.target?.id === this.parentMenu.contentId.current && Tn.includes(e.key) && (e.preventDefault(), wn.includes(e.key) && o.reverse(), jn(o, { select: !1 }, () => this.domContext.getActiveElement()));
	}
	onblur(e) {
		Qt(e.currentTarget) && Qt(e.target) && (e.currentTarget.contains?.(e.target) || (this.domContext.getWindow().clearTimeout(this.#t), this.search = ""));
	}
	onfocus(e) {
		this.parentMenu.root.isUsingKeyboard.current && L(() => this.rovingFocusGroup.focusFirstCandidate());
	}
	onItemEnter() {
		return this.#o();
	}
	onItemLeave(e) {
		e.currentTarget.hasAttribute(this.parentMenu.root.getBitsAttr("sub-trigger")) || this.#o() || this.parentMenu.root.isUsingKeyboard.current || (this.parentMenu.contentNode?.focus({ preventScroll: !0 }), this.rovingFocusGroup.setCurrentTabStopId(""));
	}
	onTriggerLeave() {
		return !!this.#o();
	}
	handleInteractOutside(e) {
		if (!$t(e.target)) return;
		let t = this.parentMenu.triggerNode?.id;
		e.target.id === t || e.target.closest(`#${t}`) ? e.preventDefault() : (this.parentMenu.root.ignoreCloseAutoFocus = !0, L(() => {
			this.parentMenu.root.ignoreCloseAutoFocus = !1;
		}));
	}
	get shouldRender() {
		return this.parentMenu.contentPresence.shouldRender;
	}
	#c = j(() => ({ open: this.parentMenu.opts.open.current }));
	get snippetProps() {
		return e(this.#c);
	}
	set snippetProps(e) {
		x(this.#c, e);
	}
	#l = j(() => ({
		id: this.opts.id.current,
		role: "menu",
		"aria-orientation": "vertical",
		[this.parentMenu.root.getBitsAttr("content")]: "",
		"data-state": At(this.parentMenu.opts.open.current),
		...jt(this.parentMenu.contentPresence.transitionStatus),
		onkeydown: this.onkeydown,
		onblur: this.onblur,
		onfocus: this.onfocus,
		dir: this.parentMenu.root.opts.dir.current,
		style: {
			pointerEvents: "auto",
			contain: "layout style"
		},
		...this.attachment
	}));
	get props() {
		return e(this.#l);
	}
	set props(e) {
		x(this.#l, e);
	}
	popperProps = { onCloseAutoFocus: (e) => this.onCloseAutoFocus(e) };
}, zr = class {
	opts;
	content;
	attachment;
	#e = h(!1);
	constructor(e, t) {
		this.opts = e, this.content = t, this.attachment = R(this.opts.ref), this.onpointermove = this.onpointermove.bind(this), this.onpointerleave = this.onpointerleave.bind(this), this.onfocus = this.onfocus.bind(this), this.onblur = this.onblur.bind(this);
	}
	onpointermove(e) {
		if (!e.defaultPrevented && V(e)) {
			if (this.opts.disabled.current) this.content.onItemLeave(e);
			else {
				if (this.content.onItemEnter()) return;
				let t = e.currentTarget;
				if (!z(t)) return;
				t.focus({ preventScroll: !0 });
			}
		}
	}
	onpointerleave(e) {
		e.defaultPrevented || V(e) && this.content.onItemLeave(e);
	}
	onfocus(e) {
		L(() => {
			e.defaultPrevented || this.opts.disabled.current || x(this.#e, !0);
		});
	}
	onblur(e) {
		L(() => {
			e.defaultPrevented || x(this.#e, !1);
		});
	}
	#t = j(() => ({
		id: this.opts.id.current,
		tabindex: -1,
		role: "menuitem",
		"aria-disabled": Ot(this.opts.disabled.current),
		"data-disabled": kt(this.opts.disabled.current),
		"data-highlighted": e(this.#e) ? "" : void 0,
		[this.content.parentMenu.root.getBitsAttr("item")]: "",
		onpointermove: this.onpointermove,
		onpointerleave: this.onpointerleave,
		onfocus: this.onfocus,
		onblur: this.onblur,
		...this.attachment
	}));
	get props() {
		return e(this.#t);
	}
	set props(e) {
		x(this.#t, e);
	}
}, Br = class t {
	static create(e) {
		let n = new zr(e, wr.get());
		return new t(e, n);
	}
	opts;
	item;
	root;
	#e = !1;
	constructor(e, t) {
		this.opts = e, this.item = t, this.root = t.content.parentMenu.root, this.onkeydown = this.onkeydown.bind(this), this.onclick = this.onclick.bind(this), this.onpointerdown = this.onpointerdown.bind(this), this.onpointerup = this.onpointerup.bind(this);
	}
	#t() {
		if (this.item.opts.disabled.current) return;
		let e = new CustomEvent("menuitemselect", {
			bubbles: !0,
			cancelable: !0
		});
		this.opts.onSelect.current(e), e.defaultPrevented ? this.item.content.parentMenu.root.isUsingKeyboard.current = !1 : this.opts.closeOnSelect.current && this.item.content.parentMenu.root.opts.onClose();
	}
	onkeydown(e) {
		let t = this.item.content.search !== "";
		if (!(this.item.opts.disabled.current || t && e.key === " ") && Sn.includes(e.key)) {
			if (!z(e.currentTarget)) return;
			e.currentTarget.click(), e.preventDefault();
		}
	}
	onclick(e) {
		this.item.opts.disabled.current || this.#t();
	}
	onpointerup(e) {
		if (!e.defaultPrevented && !this.#e) {
			if (!z(e.currentTarget)) return;
			e.currentTarget?.click();
		}
	}
	onpointerdown(e) {
		this.#e = !0;
	}
	#n = j(() => at(this.item.props, {
		onclick: this.onclick,
		onpointerdown: this.onpointerdown,
		onpointerup: this.onpointerup,
		onkeydown: this.onkeydown
	}));
	get props() {
		return e(this.#n);
	}
	set props(e) {
		x(this.#n, e);
	}
}, Vr = class t {
	static create(e) {
		let n = wr.get(), r = new zr(e, n), i = Cr.get();
		return new t(e, r, n, i);
	}
	opts;
	item;
	content;
	submenu;
	attachment;
	#e = null;
	constructor(e, t, n, r) {
		this.opts = e, this.item = t, this.content = n, this.submenu = r, this.attachment = R(this.opts.ref, (e) => this.submenu.triggerNode = e), this.onpointerleave = this.onpointerleave.bind(this), this.onpointermove = this.onpointermove.bind(this), this.onkeydown = this.onkeydown.bind(this), this.onclick = this.onclick.bind(this), I(() => {
			this.#t();
		});
	}
	#t() {
		this.#e !== null && (this.content.domContext.getWindow().clearTimeout(this.#e), this.#e = null);
	}
	onpointermove(e) {
		if (V(e)) {
			if (this.submenu.root.isPointerInTransit) this.#e !== null && this.#t();
			else if (!this.item.opts.disabled.current && !this.submenu.opts.open.current && !this.#e) {
				let e = this.opts.openDelay.current;
				if (e <= 0) {
					this.submenu.onOpen();
					return;
				}
				this.#e = this.content.domContext.setTimeout(() => {
					this.submenu.root.isPointerInTransit || this.submenu.onOpen(), this.#t();
				}, e);
			}
		}
	}
	onpointerleave(e) {
		V(e) && this.#t();
	}
	onkeydown(e) {
		let t = this.content.search !== "";
		this.item.opts.disabled.current || t && e.key === " " || En[this.submenu.root.opts.dir.current].includes(e.key) && (e.currentTarget.click(), e.preventDefault());
	}
	onclick(e) {
		if (this.item.opts.disabled.current || !z(e.currentTarget)) return;
		e.currentTarget.focus();
		let t = new CustomEvent("menusubtriggerselect", {
			bubbles: !0,
			cancelable: !0
		});
		this.opts.onSelect.current(t), this.submenu.opts.open.current || (this.submenu.onOpen(), L(() => {
			let e = this.submenu.contentNode;
			e && Er.dispatch(e);
		}));
	}
	#n = j(() => at({
		"aria-haspopup": "menu",
		"aria-expanded": Ot(this.submenu.opts.open.current),
		"data-state": At(this.submenu.opts.open.current),
		"aria-controls": this.submenu.opts.open.current ? this.submenu.contentId.current : void 0,
		[this.submenu.root.getBitsAttr("sub-trigger")]: "",
		onclick: this.onclick,
		onpointermove: this.onpointermove,
		onpointerleave: this.onpointerleave,
		onkeydown: this.onkeydown,
		...this.attachment
	}, this.item.props));
	get props() {
		return e(this.#n);
	}
	set props(e) {
		x(this.#n, e);
	}
}, Hr = class t {
	static create(e, n) {
		let r = new Br(e, new zr(e, wr.get()));
		return new t(e, r, n);
	}
	opts;
	item;
	group;
	constructor(e, t, n = null) {
		this.opts = e, this.item = t, this.group = n, this.group && (F(() => this.group.opts.value.current, (e) => {
			this.opts.checked.current = e.includes(this.opts.value.current);
		}), F(() => this.opts.checked.current, (e) => {
			e ? this.group.addValue(this.opts.value.current) : this.group.removeValue(this.opts.value.current);
		}));
	}
	toggleChecked() {
		this.opts.indeterminate.current ? (this.opts.indeterminate.current = !1, this.opts.checked.current = !0) : this.opts.checked.current = !this.opts.checked.current;
	}
	#e = j(() => ({
		checked: this.opts.checked.current,
		indeterminate: this.opts.indeterminate.current
	}));
	get snippetProps() {
		return e(this.#e);
	}
	set snippetProps(e) {
		x(this.#e, e);
	}
	#t = j(() => ({
		...this.item.props,
		role: "menuitemcheckbox",
		"aria-checked": Mt(this.opts.checked.current, this.opts.indeterminate.current),
		"data-state": kn(this.opts.checked.current),
		[this.item.root.getBitsAttr("checkbox-item")]: ""
	}));
	get props() {
		return e(this.#t);
	}
	set props(e) {
		x(this.#t, e);
	}
}, Ur = class t {
	static create(e) {
		return new t(e, Sr.get());
	}
	opts;
	root;
	attachment;
	constructor(e, t) {
		this.opts = e, this.root = t, this.attachment = R(this.opts.ref);
	}
	#e = j(() => ({
		id: this.opts.id.current,
		role: "group",
		[this.root.getBitsAttr("separator")]: "",
		...this.attachment
	}));
	get props() {
		return e(this.#e);
	}
	set props(e) {
		x(this.#e, e);
	}
}, Wr = class t {
	static create(e) {
		return new t(e, Cr.get());
	}
	opts;
	parentMenu;
	attachment;
	constructor(e, t) {
		this.opts = e, this.parentMenu = t, this.attachment = R(this.opts.ref, (e) => this.parentMenu.triggerNode = e);
	}
	onclick = (e) => {
		this.opts.disabled.current || e.detail !== 0 || (this.parentMenu.toggleOpen(), e.preventDefault());
	};
	onpointerdown = (e) => {
		if (!this.opts.disabled.current) {
			if (e.pointerType === "touch") return e.preventDefault();
			e.button === 0 && e.ctrlKey === !1 && (this.parentMenu.toggleOpen(), this.parentMenu.opts.open.current || e.preventDefault());
		}
	};
	onpointerup = (e) => {
		this.opts.disabled.current || e.pointerType === "touch" && (e.preventDefault(), this.parentMenu.toggleOpen());
	};
	onkeydown = (e) => {
		this.opts.disabled.current || (e.key === " " || e.key === "Enter" ? (this.parentMenu.toggleOpen(), e.preventDefault()) : e.key === "ArrowDown" && (this.parentMenu.onOpen(), e.preventDefault()));
	};
	#e = j(() => {
		if (this.parentMenu.opts.open.current && this.parentMenu.contentId.current) return this.parentMenu.contentId.current;
	});
	#t = j(() => ({
		id: this.opts.id.current,
		disabled: this.opts.disabled.current,
		"aria-haspopup": "menu",
		"aria-expanded": Ot(this.parentMenu.opts.open.current),
		"aria-controls": e(this.#e),
		"data-disabled": kt(this.opts.disabled.current),
		"data-state": At(this.parentMenu.opts.open.current),
		[this.parentMenu.root.getBitsAttr("trigger")]: "",
		onclick: this.onclick,
		onpointerdown: this.onpointerdown,
		onpointerup: this.onpointerup,
		onkeydown: this.onkeydown,
		...this.attachment
	}));
	get props() {
		return e(this.#t);
	}
	set props(e) {
		x(this.#t, e);
	}
}, Gr = class {
	static create(e) {
		let t = Cr.get();
		return Cr.set(new Lr(e, t.root, t));
	}
};
// node_modules/bits-ui/dist/bits/utilities/dismissible-layer/use-dismissable-layer.svelte.js
globalThis.bitsDismissableLayers ??= /* @__PURE__ */ new Map();
var Kr = class e {
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
			this.#a = bn(this.opts.ref.current);
		});
		let t = B, n = () => {
			this.#g(), globalThis.bitsDismissableLayers.delete(this), this.#d.destroy(), t();
		};
		F([() => this.opts.enabled.current, () => this.opts.ref.current], () => {
			if (this.opts.enabled.current && this.opts.ref.current) return mt(1, () => {
				this.opts.ref.current && (globalThis.bitsDismissableLayers.set(this, this.#t), t(), t = this.#l());
			}), n;
		}), I(() => {
			this.#g.destroy(), globalThis.bitsDismissableLayers.delete(this), this.#d.destroy(), this.#s(), t();
		});
	}
	#c = (e) => {
		e.defaultPrevented || this.opts.ref.current && L(() => {
			this.opts.ref.current && !this.#h(e.target) && e.target && !this.#i && this.#o.current?.(e);
		});
	};
	#l() {
		return Xe(p(this.#a, "pointerdown", Xe(this.#f, this.#m), { capture: !0 }), p(this.#a, "pointerdown", Xe(this.#p, this.#d)), p(this.#a, "focusin", this.#c));
	}
	#u = (e) => {
		let t = e;
		t.defaultPrevented && (t = Xr(e)), this.#e.current(e);
	};
	#d = vn((e) => {
		if (!this.opts.ref.current) {
			this.#s();
			return;
		}
		let t = this.opts.isValidEvent.current(e, this.opts.ref.current) || Yr(e, this.opts.ref.current);
		if (!this.#r || this.#_() || !t) {
			this.#s();
			return;
		}
		let n = e;
		n.defaultPrevented && (n = Xr(n)), this.#t.current !== "close" && this.#t.current !== "defer-otherwise-close" ? this.#s() : e.pointerType === "touch" ? (this.#s(), this.#s = p(this.#a, "click", this.#u, { once: !0 })) : this.#e.current(n);
	}, 10);
	#f = (e) => {
		this.#n[e.type] = !0;
	};
	#p = (e) => {
		this.#n[e.type] = !1;
	};
	#m = () => {
		this.opts.ref.current && (this.#r = Jr(this.opts.ref.current));
	};
	#h = (e) => this.opts.ref.current ? yn(this.opts.ref.current, e) : !1;
	#g = vn(() => {
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
function qr(e = [...globalThis.bitsDismissableLayers]) {
	return e.findLast(([e, { current: t }]) => t === "close" || t === "ignore");
}
function Jr(e) {
	let t = [...globalThis.bitsDismissableLayers], n = qr(t);
	if (n) return n[0].opts.ref.current === e;
	let [r] = t[0];
	return r.opts.ref.current === e;
}
function Yr(e, t) {
	let n = e.target;
	if (!$t(n)) return !1;
	let r = !!n.closest(`[${br}]`), i = !!t.closest(`[${xr}]`);
	return "button" in e && e.button > 0 && !r ? !1 : "button" in e && e.button === 0 && r && i ? !0 : r && i ? !1 : bn(n).documentElement.contains(n) && !yn(t, n) && xn(e, t);
}
function Xr(e) {
	let t = e.currentTarget, n = e.target, r;
	r = e instanceof PointerEvent ? new PointerEvent(e.type, e) : new PointerEvent("pointerdown", e);
	let i = !1;
	return new Proxy(r, { get: (r, a) => a === "currentTarget" ? t : a === "target" ? n : a === "preventDefault" ? () => {
		i = !0, typeof r.preventDefault == "function" && r.preventDefault();
	} : a === "defaultPrevented" ? i : a in r ? r[a] : e[a] });
}
// node_modules/bits-ui/dist/bits/utilities/dismissible-layer/dismissible-layer.svelte
function Zr(e, i) {
	c(i, !0);
	let a = D(i, "interactOutsideBehavior", 3, "close"), o = D(i, "onInteractOutside", 3, B), s = D(i, "onFocusOutside", 3, B), l = D(i, "isValidEvent", 3, () => !1), d = Kr.create({
		id: M(() => i.id),
		interactOutsideBehavior: M(() => a()),
		onInteractOutside: M(() => o()),
		enabled: M(() => i.enabled),
		onFocusOutside: M(() => s()),
		isValidEvent: M(() => l()),
		ref: i.ref
	});
	var p = f(), m = y(p);
	t(m, () => i.children ?? u, () => ({ props: d.props })), n(e, p), r();
}
// node_modules/bits-ui/dist/bits/utilities/escape-layer/use-escape-layer.svelte.js
globalThis.bitsEscapeLayers ??= /* @__PURE__ */ new Map();
var Qr = class e {
	static create(t) {
		return new e(t);
	}
	opts;
	domContext;
	constructor(e) {
		this.opts = e, this.domContext = new Dt(this.opts.ref);
		let t = B;
		F(() => e.enabled.current, (n) => (n && (globalThis.bitsEscapeLayers.set(this, e.escapeKeydownBehavior), t = this.#e()), () => {
			t(), globalThis.bitsEscapeLayers.delete(this);
		}));
	}
	#e = () => p(this.domContext.getDocument(), "keydown", this.#t, { passive: !1 });
	#t = (e) => {
		if (e.key !== "Escape" || !$r(this)) return;
		let t = new KeyboardEvent(e.type, e);
		e.preventDefault();
		let n = this.opts.escapeKeydownBehavior.current;
		(n === "close" || n === "defer-otherwise-close") && this.opts.onEscapeKeydown.current(t);
	};
};
function $r(e) {
	let t = [...globalThis.bitsEscapeLayers], n = t.findLast(([e, { current: t }]) => t === "close" || t === "ignore");
	if (n) return n[0] === e;
	let [r] = t[0];
	return r === e;
}
// node_modules/bits-ui/dist/bits/utilities/escape-layer/escape-layer.svelte
function ei(e, i) {
	c(i, !0);
	let a = D(i, "escapeKeydownBehavior", 3, "close"), o = D(i, "onEscapeKeydown", 3, B);
	Qr.create({
		escapeKeydownBehavior: M(() => a()),
		onEscapeKeydown: M(() => o()),
		enabled: M(() => i.enabled),
		ref: i.ref
	});
	var s = f(), l = y(s);
	t(l, () => i.children ?? u), n(e, s), r();
}
// node_modules/bits-ui/dist/bits/utilities/focus-scope/focus-scope-manager.js
var ti = class e {
	static instance;
	#e = N([]);
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
}, ni = class e {
	#e = !1;
	#t = null;
	#n = ti.getInstance();
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
		this.#r.push(p(t, "focusin", (t) => {
			if (this.#e || !this.#n.isActiveScope(this)) return;
			let n = t.target;
			if (n) {
				if (e.contains(n)) this.#n.setFocusMemory(this, n);
				else {
					let n = this.#n.getFocusMemory(this);
					if (n && e.contains(n) && dr(n)) t.preventDefault(), n.focus();
					else {
						let t = this.#u(), n = this.#d()[0];
						(t || n || e).focus();
					}
				}
			}
		}, { capture: !0 }), p(e, "keydown", (e) => {
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
		return this.#t ? sr(this.#t, {
			includeContainer: !1,
			getShadowRoot: !0
		}) : [];
	}
	#u() {
		return this.#l()[0] || null;
	}
	#d() {
		return this.#t ? cr(this.#t, {
			includeContainer: !1,
			getShadowRoot: !0
		}) : [];
	}
	static use(t) {
		let n = null;
		return F([() => t.ref.current, () => t.enabled.current], ([r, i]) => {
			r && i ? (n ||= new e(t), n.mount(r)) : n &&= (n.unmount(), null);
		}), I(() => {
			n?.unmount();
		}), { get props() {
			return { tabindex: -1 };
		} };
	}
};
// node_modules/bits-ui/dist/bits/utilities/focus-scope/focus-scope.svelte
function ri(e, i) {
	c(i, !0);
	let a = D(i, "enabled", 3, !1), o = D(i, "trapFocus", 3, !1), s = D(i, "loop", 3, !1), l = D(i, "onCloseAutoFocus", 3, B), d = D(i, "onOpenAutoFocus", 3, B), p = ni.use({
		enabled: M(() => a()),
		trap: M(() => o()),
		loop: s(),
		onCloseAutoFocus: M(() => l()),
		onOpenAutoFocus: M(() => d()),
		ref: i.ref
	});
	var m = f(), h = y(m);
	t(h, () => i.focusScope ?? u, () => ({ props: p.props })), n(e, m), r();
}
// node_modules/bits-ui/dist/bits/utilities/text-selection-layer/use-text-selection-layer.svelte.js
var ii = () => {};
globalThis.bitsTextSelectionLayers ??= /* @__PURE__ */ new Map();
var ai = class e {
	static create(t) {
		return new e(t);
	}
	opts;
	domContext;
	#e = B;
	#t = !1;
	#n = ii;
	#r = ii;
	constructor(e) {
		this.opts = e, this.domContext = new Dt(e.ref);
		let t = B;
		F(() => [
			this.opts.enabled.current,
			this.opts.onPointerDown.current,
			this.opts.onPointerUp.current
		], ([e, n, r]) => (this.#t = e, this.#n = n, this.#r = r, e && (globalThis.bitsTextSelectionLayers.set(this, this.opts.enabled), t(), t = this.#i()), () => {
			this.#t = !1, t(), this.#s(), globalThis.bitsTextSelectionLayers.delete(this);
		}));
	}
	#i() {
		return Xe(p(this.domContext.getDocument(), "pointerdown", this.#o), p(this.domContext.getDocument(), "pointerup", ge(this.#s, this.#a)));
	}
	#a = (e) => {
		this.#r(e);
	};
	#o = (e) => {
		let t = this.opts.ref.current, n = e.target;
		z(t) && z(n) && this.#t && li(this) && Ct(t, n) && (this.#n(e), e.defaultPrevented || (this.#e = si(t, this.domContext.getDocument().body)));
	};
	#s = () => {
		this.#e(), this.#e = B;
	};
}, oi = (e) => e.style.userSelect || e.style.webkitUserSelect;
function si(e, t) {
	let n = oi(t), r = oi(e);
	return ci(t, "none"), ci(e, "text"), () => {
		ci(t, n), ci(e, r);
	};
}
function ci(e, t) {
	e.style.userSelect = t, e.style.webkitUserSelect = t;
}
function li(e) {
	let t = [...globalThis.bitsTextSelectionLayers];
	if (!t.length) return !1;
	let n = t.at(-1);
	return n ? n[0] === e : !1;
}
// node_modules/bits-ui/dist/bits/utilities/text-selection-layer/text-selection-layer.svelte
function ui(e, i) {
	c(i, !0);
	let a = D(i, "preventOverflowTextSelection", 3, !0), o = D(i, "onPointerDown", 3, B), s = D(i, "onPointerUp", 3, B);
	ai.create({
		id: M(() => i.id),
		onPointerDown: M(() => o()),
		onPointerUp: M(() => s()),
		enabled: M(() => i.enabled && a()),
		ref: i.ref
	});
	var l = f(), d = y(l);
	t(d, () => i.children ?? u), n(e, l), r();
}
// node_modules/bits-ui/dist/internal/use-id.js
globalThis.bitsIdCounter ??= { current: 0 };
function di(e = "bits") {
	return globalThis.bitsIdCounter.current++, `${e}-${globalThis.bitsIdCounter.current}`;
}
// node_modules/bits-ui/dist/internal/shared-state.svelte.js
var fi = class {
	#e;
	#t = 0;
	#n = h();
	#r;
	constructor(e) {
		this.#e = e;
	}
	#i() {
		--this.#t, this.#r && this.#t <= 0 && (this.#r(), x(this.#n, void 0), this.#r = void 0);
	}
	get(...t) {
		return this.#t += 1, e(this.#n) === void 0 && (this.#r = _(() => {
			x(this.#n, this.#e(...t), !0);
		})), O(() => () => {
			this.#i();
		}), e(this.#n);
	}
}, pi = new re(), mi = h(null), hi = null, gi = null, _i = !1, vi = M(() => {
	for (let e of pi.values()) if (e) return !0;
	return !1;
}), yi = null, bi = new fi(() => {
	function t() {
		document.body.setAttribute("style", e(mi) ?? ""), document.body.style.removeProperty("--scrollbar-width"), Xt && hi?.(), x(mi, null);
	}
	function n() {
		gi !== null && (window.clearTimeout(gi), gi = null);
	}
	function r(e, t) {
		n(), _i = !0, yi = Date.now();
		let r = yi, i = () => {
			gi = null, yi === r && (Si(pi) ? _i = !1 : (_i = !1, t()));
		}, a = e === null ? 24 : e;
		gi = window.setTimeout(i, a);
	}
	function i() {
		e(mi) === null && pi.size === 0 && !_i && x(mi, document.body.getAttribute("style"), !0);
	}
	return F(() => vi.current, () => {
		if (!vi.current) return;
		i(), _i = !1;
		let e = getComputedStyle(document.documentElement), t = getComputedStyle(document.body), n = e.scrollbarGutter?.includes("stable") || t.scrollbarGutter?.includes("stable"), r = window.innerWidth - document.documentElement.clientWidth, a = {
			padding: Number.parseInt(t.paddingRight ?? "0", 10) + r,
			margin: Number.parseInt(t.marginRight ?? "0", 10)
		};
		r > 0 && !n && (document.body.style.paddingRight = `${a.padding}px`, document.body.style.marginRight = `${a.margin}px`, document.body.style.setProperty("--scrollbar-width", `${r}px`)), document.body.style.overflow = "hidden", Xt && (hi = p(document, "touchmove", (e) => {
			e.target === document.documentElement && (e.touches.length > 1 || e.preventDefault());
		}, { passive: !1 })), L(() => {
			document.body.style.pointerEvents = "none", document.body.style.overflow = "hidden";
		});
	}), I(() => () => {
		hi?.();
	}), {
		get lockMap() {
			return pi;
		},
		resetBodyStyle: t,
		scheduleCleanupIfNoNewLocks: r,
		cancelPendingCleanup: n,
		ensureInitialStyleCaptured: i
	};
}), xi = class {
	#e = di();
	#t;
	#n = () => null;
	#r;
	locked;
	constructor(e, t = () => null) {
		this.#t = e, this.#n = t, this.#r = bi.get(), this.#r && (this.#r.cancelPendingCleanup(), this.#r.ensureInitialStyleCaptured(), this.#r.lockMap.set(this.#e, this.#t ?? !1), this.locked = M(() => this.#r.lockMap.get(this.#e) ?? !1, (e) => this.#r.lockMap.set(this.#e, e)), I(() => {
			if (this.#r.lockMap.delete(this.#e), Si(this.#r.lockMap)) return;
			let e = this.#n();
			this.#r.scheduleCleanupIfNoNewLocks(e, () => {
				this.#r.resetBodyStyle();
			});
		}));
	}
};
function Si(e) {
	for (let [t, n] of e) if (n) return !0;
	return !1;
}
// node_modules/bits-ui/dist/bits/utilities/scroll-lock/scroll-lock.svelte
function Ci(e, t) {
	c(t, !0);
	let n = D(t, "preventScroll", 3, !0), i = D(t, "restoreScrollDelay", 3, null);
	n() && new xi(n(), () => i()), r();
}
// node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
var wi = [
	"top",
	"right",
	"bottom",
	"left"
], U = Math.min, W = Math.max, Ti = Math.round, Ei = Math.floor, G = (e) => ({
	x: e,
	y: e
}), Di = {
	left: "right",
	right: "left",
	bottom: "top",
	top: "bottom"
};
function Oi(e, t, n) {
	return W(e, U(t, n));
}
function K(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function q(e) {
	return e.split("-")[0];
}
function ki(e) {
	return e.split("-")[1];
}
function Ai(e) {
	return e === "x" ? "y" : "x";
}
function ji(e) {
	return e === "y" ? "height" : "width";
}
function J(e) {
	let t = e[0];
	return t === "t" || t === "b" ? "y" : "x";
}
function Mi(e) {
	return Ai(J(e));
}
function Ni(e, t, n) {
	n === void 0 && (n = !1);
	let r = ki(e), i = Mi(e), a = ji(i), o = i === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
	return t.reference[a] > t.floating[a] && (o = Hi(o)), [o, Hi(o)];
}
function Pi(e) {
	let t = Hi(e);
	return [
		Fi(e),
		t,
		Fi(t)
	];
}
function Fi(e) {
	return e.includes("start") ? e.replace("start", "end") : e.replace("end", "start");
}
var Ii = ["left", "right"], Li = ["right", "left"], Ri = ["top", "bottom"], zi = ["bottom", "top"];
function Bi(e, t, n) {
	switch (e) {
		case "top":
		case "bottom": return n ? t ? Li : Ii : t ? Ii : Li;
		case "left":
		case "right": return t ? Ri : zi;
		default: return [];
	}
}
function Vi(e, t, n, r) {
	let i = ki(e), a = Bi(q(e), n === "start", r);
	return i && (a = a.map((e) => e + "-" + i), t && (a = a.concat(a.map(Fi)))), a;
}
function Hi(e) {
	let t = q(e);
	return Di[t] + e.slice(t.length);
}
function Ui(e) {
	return {
		top: e.top ?? 0,
		right: e.right ?? 0,
		bottom: e.bottom ?? 0,
		left: e.left ?? 0
	};
}
function Wi(e) {
	return typeof e == "number" ? {
		top: e,
		right: e,
		bottom: e,
		left: e
	} : Ui(e);
}
function Gi(e) {
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
function Ki(e, t, n) {
	let { reference: r, floating: i } = e, a = J(t), o = Mi(t), s = ji(o), c = q(t), l = a === "y", u = r.x + r.width / 2 - i.width / 2, d = r.y + r.height / 2 - i.height / 2, f = r[s] / 2 - i[s] / 2, p;
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
	let m = ki(t);
	return m && (p[o] += f * (m === "end" ? 1 : -1) * (n && l ? -1 : 1)), p;
}
async function qi(e, t) {
	t === void 0 && (t = {});
	let { x: n, y: r, platform: i, rects: a, elements: o, strategy: s } = e, { boundary: c = "clippingAncestors", rootBoundary: l = "viewport", elementContext: u = "floating", altBoundary: d = !1, padding: f = 0 } = K(t, e), p = Wi(f), m = o[d ? u === "floating" ? "reference" : "floating" : u], h = Gi(await i.getClippingRect({
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
	}, y = Gi(i.convertOffsetParentRelativeRectToViewportRelativeRect ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
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
var Ji = 50, Yi = async (e, t, n) => {
	let { placement: r = "bottom", strategy: i = "absolute", middleware: a = [], platform: o } = n, s = o.detectOverflow ? o : {
		...o,
		detectOverflow: qi
	}, c = await (o.isRTL == null ? void 0 : o.isRTL(t)), l = await o.getElementRects({
		reference: e,
		floating: t,
		strategy: i
	}), { x: u, y: d } = Ki(l, r, c), f = r, p = 0, m = {};
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
		}, x && p < Ji && (p++, typeof x == "object" && (x.placement && (f = x.placement), x.rects && (l = x.rects === !0 ? await o.getElementRects({
			reference: e,
			floating: t,
			strategy: i
		}) : x.rects), {x: u, y: d} = Ki(l, f, c)), n = -1);
	}
	return {
		x: u,
		y: d,
		placement: f,
		strategy: i,
		middlewareData: m
	};
}, Xi = (e) => ({
	name: "arrow",
	options: e,
	async fn(t) {
		let { x: n, y: r, placement: i, rects: a, platform: o, elements: s, middlewareData: c } = t, { element: l, padding: u = 0 } = K(e, t) || {};
		if (l == null) return {};
		let d = Wi(u), f = {
			x: n,
			y: r
		}, p = Mi(i), m = ji(p), h = await o.getDimensions(l), g = p === "y", _ = g ? "top" : "left", v = g ? "bottom" : "right", y = g ? "clientHeight" : "clientWidth", b = a.reference[m] + a.reference[p] - f[p] - a.floating[m], x = f[p] - a.reference[p], S = await (o.getOffsetParent == null ? void 0 : o.getOffsetParent(l)), C = S ? S[y] : 0;
		C && await (o.isElement == null ? void 0 : o.isElement(S)) || (C = s.floating[y] || a.floating[m]);
		let w = b / 2 - x / 2, T = C / 2 - h[m] / 2 - 1, E = U(d[_], T), D = U(d[v], T), O = C - h[m] - D, k = C / 2 - h[m] / 2 + w, A = Oi(E, k, O), ee = !c.arrow && ki(i) != null && k !== A && a.reference[m] / 2 - (k < E ? E : D) - h[m] / 2 < 0, te = ee ? k < E ? k - E : k - O : 0;
		return {
			[p]: f[p] + te,
			data: {
				[p]: A,
				centerOffset: k - A - te,
				...ee && { alignmentOffset: te }
			},
			reset: ee
		};
	}
}), Zi = function(e) {
	return e === void 0 && (e = {}), {
		name: "flip",
		options: e,
		async fn(t) {
			var n;
			let { placement: r, middlewareData: i, rects: a, initialPlacement: o, platform: s, elements: c } = t, { mainAxis: l = !0, crossAxis: u = !0, fallbackPlacements: d, fallbackStrategy: f = "bestFit", fallbackAxisSideDirection: p = "none", flipAlignment: m = !0, ...h } = K(e, t);
			if ((n = i.arrow) != null && n.alignmentOffset) return {};
			let g = q(r), _ = J(o), v = q(o) === o, y = await (s.isRTL == null ? void 0 : s.isRTL(c.floating)), b = d || (v || !m ? [Hi(o)] : Pi(o)), x = p !== "none";
			!d && x && b.push(...Vi(o, m, p, y));
			let S = [o, ...b], C = await s.detectOverflow(t, h), w = [], T = i.flip?.overflows || [];
			if (l && w.push(C[g]), u) {
				let e = Ni(r, a, y);
				w.push(C[e[0]], C[e[1]]);
			}
			if (T = [...T, {
				placement: r,
				overflows: w
			}], !w.every((e) => e <= 0)) {
				let e = (i.flip?.index || 0) + 1, t = S[e];
				if (t && (u !== "alignment" || _ === J(t) || T.every((e) => J(e.placement) !== _ || e.overflows[0] > 0))) return {
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
								let t = J(e.placement);
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
function Qi(e, t) {
	return {
		top: e.top - t.height,
		right: e.right - t.width,
		bottom: e.bottom - t.height,
		left: e.left - t.width
	};
}
function $i(e) {
	return wi.some((t) => e[t] >= 0);
}
var ea = function(e) {
	return e === void 0 && (e = {}), {
		name: "hide",
		options: e,
		async fn(t) {
			let { rects: n, platform: r } = t, { strategy: i = "referenceHidden", ...a } = K(e, t);
			switch (i) {
				case "referenceHidden": {
					let e = Qi(await r.detectOverflow(t, {
						...a,
						elementContext: "reference"
					}), n.reference);
					return { data: {
						referenceHiddenOffsets: e,
						referenceHidden: $i(e)
					} };
				}
				case "escaped": {
					let e = Qi(await r.detectOverflow(t, {
						...a,
						altBoundary: !0
					}), n.floating);
					return { data: {
						escapedOffsets: e,
						escaped: $i(e)
					} };
				}
				default: return {};
			}
		}
	};
}, ta = /*#__PURE__*/ new Set(["left", "top"]);
async function na(e, t) {
	let { placement: n, platform: r, elements: i } = e, a = await (r.isRTL == null ? void 0 : r.isRTL(i.floating)), o = q(n), s = ki(n), c = J(n) === "y", l = ta.has(o) ? -1 : 1, u = a && c ? -1 : 1, d = K(t, e), { mainAxis: f, crossAxis: p, alignmentAxis: m } = typeof d == "number" ? {
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
var ra = function(e) {
	return e === void 0 && (e = 0), {
		name: "offset",
		options: e,
		async fn(t) {
			var n;
			let { x: r, y: i, placement: a, middlewareData: o } = t, s = await na(t, e);
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
}, ia = function(e) {
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
			} }, ...l } = K(e, t), u = {
				x: n,
				y: r
			}, d = await a.detectOverflow(t, l), f = J(i), p = Ai(f), m = u[p], h = u[f], g = (e, t) => Oi(t + d[e === "y" ? "top" : "left"], t, t - d[e === "y" ? "bottom" : "right"]);
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
}, aa = function(e) {
	return e === void 0 && (e = {}), {
		options: e,
		fn(t) {
			let { x: n, y: r, placement: i, rects: a, middlewareData: o } = t, { offset: s = 0, mainAxis: c = !0, crossAxis: l = !0 } = K(e, t), u = {
				x: n,
				y: r
			}, d = J(i), f = Ai(d), p = u[f], m = u[d], h = K(s, t), g = typeof h == "number" ? {
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
				let e = f === "y" ? "width" : "height", t = ta.has(q(i)), n = a.reference[d] - a.floating[e] + (t && o.offset?.[d] || 0) + (t ? 0 : g.crossAxis), r = a.reference[d] + a.reference[e] + (t ? 0 : o.offset?.[d] || 0) - (t ? g.crossAxis : 0);
				m < n ? m = n : m > r && (m = r);
			}
			return {
				[f]: p,
				[d]: m
			};
		}
	};
}, oa = function(e) {
	return e === void 0 && (e = {}), {
		name: "size",
		options: e,
		async fn(t) {
			let { placement: n, rects: r, platform: i, elements: a } = t, { apply: o = () => {}, ...s } = K(e, t), c = await i.detectOverflow(t, s), l = q(n), u = ki(n), d = J(n) === "y", { width: f, height: p } = r.floating, m, h;
			l === "top" || l === "bottom" ? (m = l, h = u === (await (i.isRTL == null ? void 0 : i.isRTL(a.floating)) ? "start" : "end") ? "left" : "right") : (h = l, m = u === "end" ? "top" : "bottom");
			let g = p - c.top - c.bottom, _ = f - c.left - c.right, v = U(p - c[m], g), y = U(f - c[h], _), b = t.middlewareData.shift, x = !b, S = v, C = y;
			b != null && b.enabled.x && (C = _), b != null && b.enabled.y && (S = g), x && !u && (d ? C = f - 2 * W(c.left, c.right) : S = p - 2 * W(c.top, c.bottom)), await o({
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
function sa() {
	return typeof window < "u";
}
function ca(e) {
	return la(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function Y(e) {
	var t;
	return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function X(e) {
	return ((la(e) ? e.ownerDocument : e.document) || window.document)?.documentElement;
}
function la(e) {
	return sa() ? e instanceof Node || e instanceof Y(e).Node : !1;
}
function Z(e) {
	return sa() ? e instanceof Element || e instanceof Y(e).Element : !1;
}
function Q(e) {
	return sa() ? e instanceof HTMLElement || e instanceof Y(e).HTMLElement : !1;
}
function ua(e) {
	return !sa() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof Y(e).ShadowRoot;
}
function da(e) {
	let { overflow: t, overflowX: n, overflowY: r, display: i } = $(e);
	return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && i !== "inline" && i !== "contents";
}
function fa(e) {
	return /^(table|td|th)$/.test(ca(e));
}
function pa(e) {
	try {
		if (e.matches(":popover-open")) return !0;
	} catch {}
	try {
		return e.matches(":modal");
	} catch {
		return !1;
	}
}
var ma = /transform|translate|scale|rotate|perspective|filter/, ha = /paint|layout|strict|content/, ga = (e) => !!e && e !== "none", _a;
function va(e) {
	let t = Z(e) ? $(e) : e;
	return ga(t.transform) || ga(t.translate) || ga(t.scale) || ga(t.rotate) || ga(t.perspective) || !ba() && (ga(t.backdropFilter) || ga(t.filter)) || ma.test(t.willChange || "") || ha.test(t.contain || "");
}
function ya(e) {
	let t = Ca(e);
	for (; Q(t) && !xa(t);) {
		if (va(t)) return t;
		if (pa(t)) return null;
		t = Ca(t);
	}
	return null;
}
function ba() {
	return _a ??= typeof CSS < "u" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none"), _a;
}
function xa(e) {
	return /^(html|body|#document)$/.test(ca(e));
}
function $(e) {
	return Y(e).getComputedStyle(e);
}
function Sa(e) {
	return Z(e) ? {
		scrollLeft: e.scrollLeft,
		scrollTop: e.scrollTop
	} : {
		scrollLeft: e.scrollX,
		scrollTop: e.scrollY
	};
}
function Ca(e) {
	if (ca(e) === "html") return e;
	let t = e.assignedSlot || e.parentNode || ua(e) && e.host || X(e);
	return ua(t) ? t.host : t;
}
function wa(e) {
	let t = Ca(e);
	return xa(t) ? (e.ownerDocument || e).body : Q(t) && da(t) ? t : wa(t);
}
function Ta(e, t, n) {
	t === void 0 && (t = []), n === void 0 && (n = !0);
	let r = wa(e), i = r === e.ownerDocument?.body, a = Y(r);
	if (i) {
		let e = Ea(a);
		return t.concat(a, a.visualViewport || [], da(r) ? r : [], e && n ? Ta(e) : []);
	}
	return t.concat(r, Ta(r, [], n));
}
function Ea(e) {
	return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
// node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function Da(e) {
	let t = $(e), n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0, i = Q(e), a = i ? e.offsetWidth : n, o = i ? e.offsetHeight : r, s = Ti(n) !== a || Ti(r) !== o;
	return s && (n = a, r = o), {
		width: n,
		height: r,
		$: s
	};
}
function Oa(e) {
	return Z(e) ? e : e.contextElement;
}
function ka(e) {
	let t = Oa(e);
	if (!Q(t)) return G(1);
	let n = t.getBoundingClientRect(), { width: r, height: i, $: a } = Da(t), o = (a ? Ti(n.width) : n.width) / r, s = (a ? Ti(n.height) : n.height) / i;
	return o && Number.isFinite(o) || (o = 1), s && Number.isFinite(s) || (s = 1), {
		x: o,
		y: s
	};
}
var Aa = /*#__PURE__*/ G(0);
function ja(e) {
	let t = Y(e);
	return !ba() || !t.visualViewport ? Aa : {
		x: t.visualViewport.offsetLeft,
		y: t.visualViewport.offsetTop
	};
}
function Ma(e, t, n) {
	return t === void 0 && (t = !1), !!n && t && n === Y(e);
}
function Na(e, t, n, r) {
	t === void 0 && (t = !1), n === void 0 && (n = !1);
	let i = e.getBoundingClientRect(), a = Oa(e), o = G(1);
	t && (r ? Z(r) && (o = ka(r)) : o = ka(e));
	let s = Ma(a, n, r) ? ja(a) : G(0), c = (i.left + s.x) / o.x, l = (i.top + s.y) / o.y, u = i.width / o.x, d = i.height / o.y;
	if (a && r) {
		let e = Y(a), t = Z(r) ? Y(r) : r, n = e, i = Ea(n);
		for (; i && t !== n;) {
			let e = ka(i), t = i.getBoundingClientRect(), r = $(i), a = t.left + (i.clientLeft + parseFloat(r.paddingLeft)) * e.x, o = t.top + (i.clientTop + parseFloat(r.paddingTop)) * e.y;
			c *= e.x, l *= e.y, u *= e.x, d *= e.y, c += a, l += o, n = Y(i), i = Ea(n);
		}
	}
	return Gi({
		width: u,
		height: d,
		x: c,
		y: l
	});
}
function Pa(e, t) {
	let n = Sa(e).scrollLeft;
	return t ? t.left + n : Na(X(e)).left + n;
}
function Fa(e, t) {
	let n = e.getBoundingClientRect();
	return {
		x: n.left + t.scrollLeft - Pa(e, n),
		y: n.top + t.scrollTop
	};
}
function Ia(e) {
	let { elements: t, rect: n, offsetParent: r, strategy: i } = e, a = i === "fixed", o = X(r), s = t ? pa(t.floating) : !1;
	if (r === o || s && a) return n;
	let c = {
		scrollLeft: 0,
		scrollTop: 0
	}, l = G(1), u = G(0), d = Q(r);
	if ((d || !a) && ((ca(r) !== "body" || da(o)) && (c = Sa(r)), d)) {
		let e = Na(r);
		l = ka(r), u.x = e.x + r.clientLeft, u.y = e.y + r.clientTop;
	}
	let f = o && !d && !a ? Fa(o, c) : G(0);
	return {
		width: n.width * l.x,
		height: n.height * l.y,
		x: n.x * l.x - c.scrollLeft * l.x + u.x + f.x,
		y: n.y * l.y - c.scrollTop * l.y + u.y + f.y
	};
}
function La(e) {
	return e.getClientRects ? Array.from(e.getClientRects()) : [];
}
function Ra(e) {
	let t = Sa(e), n = e.ownerDocument.body, r = W(e.scrollWidth, e.clientWidth, n.scrollWidth, n.clientWidth), i = W(e.scrollHeight, e.clientHeight, n.scrollHeight, n.clientHeight), a = -t.scrollLeft + Pa(e), o = -t.scrollTop;
	return $(n).direction === "rtl" && (a += W(e.clientWidth, n.clientWidth) - r), {
		width: r,
		height: i,
		x: a,
		y: o
	};
}
var za = 25;
function Ba(e, t, n) {
	n === void 0 && (n = "viewport");
	let r = n === "layoutViewport", i = Y(e), a = X(e), o = i.visualViewport, s = a.clientWidth, c = a.clientHeight, l = 0, u = 0;
	if (o) {
		let e = !ba() || t === "fixed";
		r ? e || (l = -o.offsetLeft, u = -o.offsetTop) : (s = o.width, c = o.height, e && (l = o.offsetLeft, u = o.offsetTop));
	}
	if (Pa(a) <= 0) {
		let e = a.ownerDocument, t = e.body, n = getComputedStyle(t), r = e.compatMode === "CSS1Compat" && parseFloat(n.marginLeft) + parseFloat(n.marginRight) || 0, i = Math.abs(a.clientWidth - t.clientWidth - r), o = getComputedStyle(a).scrollbarGutter === "stable both-edges" ? i / 2 : i;
		o <= za && (s -= o);
	}
	return {
		width: s,
		height: c,
		x: l,
		y: u
	};
}
function Va(e, t) {
	let n = Na(e, !0, t === "fixed"), r = n.top + e.clientTop, i = n.left + e.clientLeft, a = ka(e);
	return {
		width: e.clientWidth * a.x,
		height: e.clientHeight * a.y,
		x: i * a.x,
		y: r * a.y
	};
}
function Ha(e, t, n) {
	let r;
	if (t === "viewport" || t === "layoutViewport") r = Ba(e, n, t);
	else if (t === "document") r = Ra(X(e));
	else if (Z(t)) r = Va(t, n);
	else {
		let n = ja(e);
		r = {
			x: t.x - n.x,
			y: t.y - n.y,
			width: t.width,
			height: t.height
		};
	}
	return Gi(r);
}
function Ua(e, t) {
	let n = t.get(e);
	if (n) return n;
	let r = Ta(e, [], !1).filter((e) => Z(e) && ca(e) !== "body"), i = null, a = $(e).position === "fixed", o = a ? Ca(e) : e;
	for (; Z(o) && !xa(o);) {
		let e = $(o), t = va(o), n = i ? i.position : a ? "fixed" : "";
		!t && (n === "fixed" || n === "absolute" && e.position === "static") ? r = r.filter((e) => e !== o) : i = e, o = Ca(o);
	}
	return t.set(e, r), r;
}
function Wa(e) {
	let { element: t, boundary: n, rootBoundary: r, strategy: i } = e, a = [...n === "clippingAncestors" ? pa(t) ? [] : Ua(t, this._c) : [].concat(n), r], o = Ha(t, a[0], i), s = o.top, c = o.right, l = o.bottom, u = o.left;
	for (let e = 1; e < a.length; e++) {
		let n = Ha(t, a[e], i);
		s = W(n.top, s), c = U(n.right, c), l = U(n.bottom, l), u = W(n.left, u);
	}
	return {
		width: c - u,
		height: l - s,
		x: u,
		y: s
	};
}
function Ga(e) {
	let { width: t, height: n } = Da(e);
	return {
		width: t,
		height: n
	};
}
function Ka(e, t, n) {
	let r = Q(t), i = X(t), a = n === "fixed", o = Na(e, !0, a, t), s = {
		scrollLeft: 0,
		scrollTop: 0
	}, c = G(0);
	if ((r || !a) && ((ca(t) !== "body" || da(i)) && (s = Sa(t)), r)) {
		let e = Na(t, !0, a, t);
		c.x = e.x + t.clientLeft, c.y = e.y + t.clientTop;
	}
	!r && i && (c.x = Pa(i));
	let l = i && !r && !a ? Fa(i, s) : G(0);
	return {
		x: o.left + s.scrollLeft - c.x - l.x,
		y: o.top + s.scrollTop - c.y - l.y,
		width: o.width,
		height: o.height
	};
}
function qa(e) {
	return $(e).position === "static";
}
function Ja(e, t) {
	if (!Q(e) || $(e).position === "fixed") return null;
	if (t) return t(e);
	let n = e.offsetParent;
	return X(e) === n && (n = n.ownerDocument.body), n;
}
function Ya(e, t) {
	let n = Y(e);
	if (pa(e)) return n;
	if (!Q(e)) {
		let t = Ca(e);
		for (; t && !xa(t);) {
			if (Z(t) && !qa(t)) return t;
			t = Ca(t);
		}
		return n;
	}
	let r = Ja(e, t);
	for (; r && fa(r) && qa(r);) r = Ja(r, t);
	return r && xa(r) && qa(r) && !va(r) ? n : r || ya(e) || n;
}
var Xa = async function(e) {
	let t = this.getOffsetParent || Ya, n = this.getDimensions, r = await n(e.floating);
	return {
		reference: Ka(e.reference, await t(e.floating), e.strategy),
		floating: {
			x: 0,
			y: 0,
			width: r.width,
			height: r.height
		}
	};
};
function Za(e) {
	return $(e).direction === "rtl";
}
var Qa = {
	convertOffsetParentRelativeRectToViewportRelativeRect: Ia,
	getDocumentElement: X,
	getClippingRect: Wa,
	getOffsetParent: Ya,
	getElementRects: Xa,
	getClientRects: La,
	getDimensions: Ga,
	getScale: ka,
	isElement: Z,
	isRTL: Za
};
function $a(e, t) {
	return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function eo(e, t, n) {
	let r = null, i, a = X(e);
	function o() {
		var e;
		clearTimeout(i), (e = r) == null || e.disconnect(), r = null;
	}
	function s(n, c) {
		n === void 0 && (n = !1), c === void 0 && (c = 1), o();
		let l = e.getBoundingClientRect(), { left: u, top: d, width: f, height: p } = l;
		if (n || t(), !f || !p) return;
		let m = Ei(d), h = Ei(a.clientWidth - (u + f)), g = Ei(a.clientHeight - (d + p)), _ = Ei(u), v = {
			rootMargin: -m + "px " + -h + "px " + -g + "px " + -_ + "px",
			threshold: W(0, U(1, c)) || 1
		}, y = !0;
		function b(t) {
			let n = t[0].intersectionRatio;
			if (!$a(l, e.getBoundingClientRect())) return s();
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
	let c = Y(e), l = () => s(n);
	return c.addEventListener("resize", l), s(!0), () => {
		c.removeEventListener("resize", l), o();
	};
}
function to(e, t, n, r) {
	r === void 0 && (r = {});
	let { ancestorScroll: i = !0, ancestorResize: a = !0, elementResize: o = typeof ResizeObserver == "function", layoutShift: s = typeof IntersectionObserver == "function", animationFrame: c = !1 } = r, l = Oa(e), u = i || a ? [...l ? Ta(l) : [], ...t ? Ta(t) : []] : [];
	u.forEach((e) => {
		i && e.addEventListener("scroll", n), a && e.addEventListener("resize", n);
	});
	let d = l && s ? eo(l, n, a) : null, f = -1, p = null;
	o && (p = new ResizeObserver((e) => {
		let [r] = e;
		r && r.target === l && p && t && (p.unobserve(t), cancelAnimationFrame(f), f = requestAnimationFrame(() => {
			var e;
			(e = p) == null || e.observe(t);
		})), n();
	}), l && !c && p.observe(l), t && p.observe(t));
	let m, h = c ? Na(e) : null;
	c && g();
	function g() {
		let t = Na(e);
		h && !$a(h, t) && n(), h = t, m = requestAnimationFrame(g);
	}
	return n(), () => {
		var e;
		u.forEach((e) => {
			i && e.removeEventListener("scroll", n), a && e.removeEventListener("resize", n);
		}), d?.(), (e = p) == null || e.disconnect(), p = null, c && cancelAnimationFrame(m);
	};
}
var no = ra, ro = ia, io = Zi, ao = oa, oo = ea, so = Xi, co = aa, lo = (e, t, n) => {
	let r = /* @__PURE__ */ new Map(), i = n ?? {}, a = {
		...Qa,
		...i.platform,
		_c: r
	};
	return Yi(e, t, {
		...i,
		platform: a
	});
};
// node_modules/bits-ui/dist/internal/floating-svelte/floating-utils.svelte.js
function uo(e) {
	return typeof e == "function" ? e() : e;
}
function fo(e) {
	return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function po(e, t) {
	let n = fo(e);
	return Math.round(t * n) / n;
}
function mo(e) {
	return {
		[`--bits-${e}-content-transform-origin`]: "var(--bits-floating-transform-origin)",
		[`--bits-${e}-content-available-width`]: "var(--bits-floating-available-width)",
		[`--bits-${e}-content-available-height`]: "var(--bits-floating-available-height)",
		[`--bits-${e}-anchor-width`]: "var(--bits-floating-anchor-width)",
		[`--bits-${e}-anchor-height`]: "var(--bits-floating-anchor-height)"
	};
}
// node_modules/bits-ui/dist/internal/floating-svelte/use-floating.svelte.js
function ho(t) {
	let n = t.whileElementsMounted, r = j(() => uo(t.open) ?? !0), i = j(() => uo(t.middleware)), a = j(() => uo(t.transform) ?? !0), o = j(() => uo(t.placement) ?? "bottom"), s = j(() => uo(t.strategy) ?? "absolute"), c = j(() => uo(t.sideOffset) ?? 0), l = j(() => uo(t.alignOffset) ?? 0), u = t.reference, d = h(0), f = h(0), p = N(null), m = h(E(e(s))), g = h(E(e(o))), _ = h(E({})), v = h(!1), y = !1, b = 0, S = j(() => {
		let t = p.current ? po(p.current, e(d)) : e(d), n = p.current ? po(p.current, e(f)) : e(f);
		return e(a) ? {
			position: e(m),
			left: "0",
			top: "0",
			transform: `translate(${t}px, ${n}px)`,
			...p.current && fo(p.current) >= 1.5 && { willChange: "transform" }
		} : {
			position: e(m),
			left: `${t}px`,
			top: `${n}px`
		};
	}), C;
	function w() {
		if (u.current === null || p.current === null) return;
		let t = u.current, n = p.current, a = ++b;
		lo(t, n, {
			middleware: e(i),
			placement: e(o),
			strategy: e(s)
		}).then((i) => {
			if (a === b && u.current === t && p.current === n) {
				if (go(t)) x(_, {
					...e(_),
					hide: {
						...e(_).hide,
						referenceHidden: !0
					}
				}, !0);
				else {
					if (!e(r) && e(d) !== 0 && e(f) !== 0) {
						let t = Math.max(Math.abs(e(c)), Math.abs(e(l)), 15);
						if (i.x <= t && i.y <= t) return;
					}
					x(d, i.x, !0), x(f, i.y, !0), x(m, i.strategy, !0), x(g, i.placement, !0), x(_, i.middlewareData, !0), x(v, !0);
				}
			}
		});
	}
	function T() {
		typeof C == "function" && (C(), C = void 0), b++;
	}
	function D() {
		T(), n === void 0 ? w() : e(r) && u.current !== null && p.current !== null && (C = n(u.current, p.current, w));
	}
	function k() {
		!e(r) && p.current === null && x(v, !1);
	}
	function A() {
		return [
			e(i),
			e(o),
			e(s),
			e(c),
			e(l),
			e(r)
		];
	}
	return O(() => {
		n === void 0 && e(r) && w();
	}), O(D), O(() => {
		n !== void 0 && (A(), e(r) && e(v) ? y ? w() : y = !0 : y = !1);
	}), O(k), O(() => T), {
		floating: p,
		reference: u,
		get strategy() {
			return e(m);
		},
		get placement() {
			return e(g);
		},
		get middlewareData() {
			return e(_);
		},
		get isPositioned() {
			return e(v);
		},
		get floatingStyles() {
			return e(S);
		},
		get update() {
			return w;
		}
	};
}
function go(e) {
	return e instanceof Element ? !e.isConnected || e instanceof HTMLElement && e.hidden ? !0 : e.getClientRects().length === 0 : !1;
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/use-floating-layer.svelte.js
var _o = {
	top: "bottom",
	right: "left",
	bottom: "top",
	left: "right"
}, vo = new P("Floating.Root"), yo = new P("Floating.Content"), bo = new P("Floating.Root"), xo = class e {
	static create(t = !1) {
		return t ? bo.set(new e()) : vo.set(new e());
	}
	anchorNode = N(null);
	customAnchorNode = N(null);
	triggerNode = N(null);
	constructor() {
		O(() => {
			this.customAnchorNode.current ? typeof this.customAnchorNode.current == "string" ? this.anchorNode.current = document.querySelector(this.customAnchorNode.current) : this.anchorNode.current = this.customAnchorNode.current : this.anchorNode.current = this.triggerNode.current;
		});
	}
}, So = class t {
	static create(e, n = !1) {
		return n ? yo.set(new t(e, bo.get())) : yo.set(new t(e, vo.get()));
	}
	opts;
	root;
	contentRef = N(null);
	wrapperRef = N(null);
	arrowRef = N(null);
	contentAttachment = R(this.contentRef);
	wrapperAttachment = R(this.wrapperRef);
	arrowAttachment = R(this.arrowRef);
	arrowId = N(di());
	#e = j(() => {
		if (typeof this.opts.style == "string") return Ye(this.opts.style);
		if (!this.opts.style) return {};
	});
	#t = void 0;
	#n = new pt(() => this.arrowRef.current ?? void 0);
	#r = j(() => this.#n?.width ?? 0);
	#i = j(() => this.#n?.height ?? 0);
	#a = j(() => this.opts.side?.current + (this.opts.align.current === "center" ? "" : `-${this.opts.align.current}`));
	#o = j(() => Array.isArray(this.opts.collisionBoundary.current) ? this.opts.collisionBoundary.current : [this.opts.collisionBoundary.current]);
	#s = j(() => e(this.#o).length > 0);
	get hasExplicitBoundaries() {
		return e(this.#s);
	}
	set hasExplicitBoundaries(e) {
		x(this.#s, e);
	}
	#c = j(() => ({
		padding: this.opts.collisionPadding.current,
		boundary: e(this.#o).filter(tn),
		altBoundary: this.hasExplicitBoundaries
	}));
	get detectOverflowOptions() {
		return e(this.#c);
	}
	set detectOverflowOptions(e) {
		x(this.#c, e);
	}
	#l = h(void 0);
	#u = h(void 0);
	#d = h(void 0);
	#f = h(void 0);
	#p = j(() => [
		no({
			mainAxis: this.opts.sideOffset.current + e(this.#i),
			alignmentAxis: this.opts.alignOffset.current
		}),
		this.opts.avoidCollisions.current && ro({
			mainAxis: !0,
			crossAxis: !1,
			limiter: this.opts.sticky.current === "partial" ? co() : void 0,
			...this.detectOverflowOptions
		}),
		this.opts.avoidCollisions.current && io({ ...this.detectOverflowOptions }),
		ao({
			...this.detectOverflowOptions,
			apply: ({ rects: e, availableWidth: t, availableHeight: n }) => {
				let { width: r, height: i } = e.reference;
				x(this.#l, t, !0), x(this.#u, n, !0), x(this.#d, r, !0), x(this.#f, i, !0);
			}
		}),
		this.arrowRef.current && so({
			element: this.arrowRef.current,
			padding: this.opts.arrowPadding.current
		}),
		wo({
			arrowWidth: e(this.#r),
			arrowHeight: e(this.#i)
		}),
		this.opts.hideWhenDetached.current && oo({
			strategy: "referenceHidden",
			...this.detectOverflowOptions
		})
	].filter(Boolean));
	get middleware() {
		return e(this.#p);
	}
	set middleware(e) {
		x(this.#p, e);
	}
	floating;
	#m = j(() => Eo(this.floating.placement));
	get placedSide() {
		return e(this.#m);
	}
	set placedSide(e) {
		x(this.#m, e);
	}
	#h = j(() => Do(this.floating.placement));
	get placedAlign() {
		return e(this.#h);
	}
	set placedAlign(e) {
		x(this.#h, e);
	}
	#g = j(() => this.floating.middlewareData.arrow?.x ?? 0);
	get arrowX() {
		return e(this.#g);
	}
	set arrowX(e) {
		x(this.#g, e);
	}
	#_ = j(() => this.floating.middlewareData.arrow?.y ?? 0);
	get arrowY() {
		return e(this.#_);
	}
	set arrowY(e) {
		x(this.#_, e);
	}
	#v = j(() => this.floating.middlewareData.arrow?.centerOffset !== 0);
	get cannotCenterArrow() {
		return e(this.#v);
	}
	set cannotCenterArrow(e) {
		x(this.#v, e);
	}
	#y = h();
	get contentZIndex() {
		return e(this.#y);
	}
	set contentZIndex(e) {
		x(this.#y, e, !0);
	}
	#b = j(() => _o[this.placedSide]);
	get arrowBaseSide() {
		return e(this.#b);
	}
	set arrowBaseSide(e) {
		x(this.#b, e);
	}
	#x = j(() => ({
		id: this.opts.wrapperId.current,
		"data-bits-floating-content-wrapper": "",
		style: {
			...this.floating.floatingStyles,
			transform: this.floating.isPositioned ? this.floating.floatingStyles.transform : "translate(0, -200%)",
			minWidth: "max-content",
			zIndex: this.contentZIndex,
			"--bits-floating-transform-origin": `${this.floating.middlewareData.transformOrigin?.x} ${this.floating.middlewareData.transformOrigin?.y}`,
			"--bits-floating-available-width": `${e(this.#l)}px`,
			"--bits-floating-available-height": `${e(this.#u)}px`,
			"--bits-floating-anchor-width": `${e(this.#d)}px`,
			"--bits-floating-anchor-height": `${e(this.#f)}px`,
			...this.floating.middlewareData.hide?.referenceHidden && {
				visibility: "hidden",
				"pointer-events": "none"
			},
			...e(this.#e)
		},
		dir: this.opts.dir.current,
		...this.wrapperAttachment
	}));
	get wrapperProps() {
		return e(this.#x);
	}
	set wrapperProps(e) {
		x(this.#x, e);
	}
	#S = j(() => ({
		"data-side": this.placedSide,
		"data-align": this.placedAlign,
		style: nt({ ...e(this.#e) }),
		...this.contentAttachment
	}));
	get props() {
		return e(this.#S);
	}
	set props(e) {
		x(this.#S, e);
	}
	#C = j(() => ({
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
		return e(this.#C);
	}
	set arrowStyle(e) {
		x(this.#C, e);
	}
	constructor(t, n) {
		this.opts = t, this.root = n, this.#t = t.updatePositionStrategy, t.customAnchor && (this.root.customAnchorNode.current = t.customAnchor.current), F(() => t.customAnchor.current, (e) => {
			this.root.customAnchorNode.current = e;
		}), this.floating = ho({
			strategy: () => this.opts.strategy.current,
			placement: () => e(this.#a),
			middleware: () => this.middleware,
			reference: this.root.anchorNode,
			whileElementsMounted: (...e) => to(...e, { animationFrame: this.#t?.current === "always" }),
			open: () => this.opts.enabled.current,
			sideOffset: () => this.opts.sideOffset.current,
			alignOffset: () => this.opts.alignOffset.current
		}), O(() => {
			this.floating.isPositioned && this.opts.onPlaced?.current();
		}), F(() => this.contentRef.current, (e) => {
			if (!e || !this.opts.enabled.current) return;
			let t = Tt(e), n = t.requestAnimationFrame(() => {
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
}, Co = class e {
	static create(t, n = !1) {
		return n ? new e(t, bo.get()) : new e(t, vo.get());
	}
	opts;
	root;
	constructor(e, t) {
		this.opts = e, this.root = t, t.triggerNode = e.virtualEl && e.virtualEl.current ? fe(e.virtualEl.current) : e.ref;
	}
};
function wo(e) {
	return {
		name: "transformOrigin",
		options: e,
		fn(t) {
			let { placement: n, rects: r, middlewareData: i } = t, a = i.arrow?.centerOffset !== 0, o = a ? 0 : e.arrowWidth, s = a ? 0 : e.arrowHeight, [c, l] = To(n), u = {
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
function To(e) {
	let [t, n = "center"] = e.split("-");
	return [t, n];
}
function Eo(e) {
	return To(e)[0];
}
function Do(e) {
	return To(e)[1];
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer.svelte
function Oo(e, i) {
	c(i, !0);
	let a = D(i, "tooltip", 3, !1);
	xo.create(a());
	var o = f(), s = y(o);
	t(s, () => i.children ?? u), n(e, o), r();
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-anchor.svelte
function ko(e, i) {
	c(i, !0);
	let a = D(i, "tooltip", 3, !1);
	Co.create({
		id: M(() => i.id),
		virtualEl: M(() => i.virtualEl),
		ref: i.ref
	}, a());
	var o = f(), s = y(o);
	t(s, () => i.children ?? u), n(e, o), r();
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-content.svelte
function Ao(i, a) {
	c(a, !0);
	let o = D(a, "side", 3, "bottom"), s = D(a, "sideOffset", 3, 0), l = D(a, "align", 3, "center"), d = D(a, "alignOffset", 3, 0), p = D(a, "arrowPadding", 3, 0), m = D(a, "avoidCollisions", 3, !0), h = D(a, "collisionBoundary", 19, () => []), g = D(a, "collisionPadding", 3, 0), _ = D(a, "hideWhenDetached", 3, !1), v = D(a, "onPlaced", 3, () => {}), b = D(a, "sticky", 3, "partial"), x = D(a, "updatePositionStrategy", 3, "optimized"), S = D(a, "strategy", 3, "fixed"), C = D(a, "dir", 3, "ltr"), w = D(a, "style", 19, () => ({})), T = D(a, "wrapperId", 19, di), E = D(a, "customAnchor", 3, null), O = D(a, "tooltip", 3, !1), k = So.create({
		side: M(() => o()),
		sideOffset: M(() => s()),
		align: M(() => l()),
		alignOffset: M(() => d()),
		id: M(() => a.id),
		arrowPadding: M(() => p()),
		avoidCollisions: M(() => m()),
		collisionBoundary: M(() => h()),
		collisionPadding: M(() => g()),
		hideWhenDetached: M(() => _()),
		onPlaced: M(() => v()),
		sticky: M(() => b()),
		updatePositionStrategy: M(() => x()),
		strategy: M(() => S()),
		dir: M(() => C()),
		style: M(() => w()),
		enabled: M(() => a.enabled),
		wrapperId: M(() => T()),
		customAnchor: M(() => E())
	}, O()), A = j(() => at(k.wrapperProps, { style: { pointerEvents: "auto" } }));
	var ee = f(), te = y(ee);
	t(te, () => a.content ?? u, () => ({
		props: k.props,
		wrapperProps: e(A)
	})), n(i, ee), r();
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-content-static.svelte
function jo(e, i) {
	c(i, !0), w(() => {
		i.onPlaced?.();
	});
	var a = f(), o = y(a);
	t(o, () => i.content ?? u, () => ({
		props: {},
		wrapperProps: {}
	})), n(e, a), r();
}
// node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-content.svelte
var Mo = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"content",
	"isStatic",
	"onPlaced"
]);
function No(e, t) {
	let r = D(t, "isStatic", 3, !1), i = S(t, Mo);
	var o = f(), s = y(o), c = (e) => {
		jo(e, {
			get content() {
				return t.content;
			},
			get onPlaced() {
				return t.onPlaced;
			}
		});
	}, l = (e) => {
		Ao(e, g({
			get content() {
				return t.content;
			},
			get onPlaced() {
				return t.onPlaced;
			}
		}, () => i));
	};
	a(s, (e) => {
		r() ? e(c) : e(l, -1);
	}), n(e, o);
}
// node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer-inner.svelte
var Po = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.popper.onEscapeKeydown.escapeKeydownBehavior.preventOverflowTextSelection.id.onPointerDown.onPointerUp.side.sideOffset.align.alignOffset.arrowPadding.avoidCollisions.collisionBoundary.collisionPadding.sticky.hideWhenDetached.updatePositionStrategy.strategy.dir.preventScroll.wrapperId.style.onPlaced.onInteractOutside.onCloseAutoFocus.onOpenAutoFocus.onFocusOutside.interactOutsideBehavior.loop.trapFocus.isValidEvent.customAnchor.isStatic.enabled.ref.tooltip.contentPointerEvents".split(".")), Fo = o("<!> <!>", 1);
function Io(i, o) {
	c(o, !0);
	let s = D(o, "interactOutsideBehavior", 3, "close"), l = D(o, "trapFocus", 3, !0), d = D(o, "isValidEvent", 3, () => !1), p = D(o, "customAnchor", 3, null), m = D(o, "isStatic", 3, !1), h = D(o, "tooltip", 3, !1), g = D(o, "contentPointerEvents", 3, "auto"), _ = S(o, Po), v = j(() => o.preventScroll ?? !0), x = j(() => o.strategy ?? (e(v) ? "fixed" : "absolute"));
	No(i, {
		get isStatic() {
			return m();
		},
		get id() {
			return o.id;
		},
		get side() {
			return o.side;
		},
		get sideOffset() {
			return o.sideOffset;
		},
		get align() {
			return o.align;
		},
		get alignOffset() {
			return o.alignOffset;
		},
		get arrowPadding() {
			return o.arrowPadding;
		},
		get avoidCollisions() {
			return o.avoidCollisions;
		},
		get collisionBoundary() {
			return o.collisionBoundary;
		},
		get collisionPadding() {
			return o.collisionPadding;
		},
		get sticky() {
			return o.sticky;
		},
		get hideWhenDetached() {
			return o.hideWhenDetached;
		},
		get updatePositionStrategy() {
			return o.updatePositionStrategy;
		},
		get strategy() {
			return e(x);
		},
		get dir() {
			return o.dir;
		},
		get wrapperId() {
			return o.wrapperId;
		},
		get style() {
			return o.style;
		},
		get onPlaced() {
			return o.onPlaced;
		},
		get customAnchor() {
			return p();
		},
		get enabled() {
			return o.enabled;
		},
		get tooltip() {
			return h();
		},
		content: (r, i) => {
			let c = () => (i?.()).props, p = () => (i?.()).wrapperProps;
			var m = Fo(), h = y(m), x = (t) => {
				Ci(t, { get preventScroll() {
					return e(v);
				} });
			}, S = (t) => {
				Ci(t, { get preventScroll() {
					return e(v);
				} });
			};
			a(h, (e) => {
				o.forceMount && o.enabled ? e(x) : o.forceMount || e(S, 1);
			}), ri(b(h, 2), {
				get onOpenAutoFocus() {
					return o.onOpenAutoFocus;
				},
				get onCloseAutoFocus() {
					return o.onCloseAutoFocus;
				},
				get loop() {
					return o.loop;
				},
				get enabled() {
					return o.enabled;
				},
				get trapFocus() {
					return l();
				},
				get forceMount() {
					return o.forceMount;
				},
				get ref() {
					return o.ref;
				},
				focusScope: (r, i) => {
					let a = () => (i?.()).props;
					ei(r, {
						get onEscapeKeydown() {
							return o.onEscapeKeydown;
						},
						get escapeKeydownBehavior() {
							return o.escapeKeydownBehavior;
						},
						get enabled() {
							return o.enabled;
						},
						get ref() {
							return o.ref;
						},
						children: (r, i) => {
							Zr(r, {
								get id() {
									return o.id;
								},
								get onInteractOutside() {
									return o.onInteractOutside;
								},
								get onFocusOutside() {
									return o.onFocusOutside;
								},
								get interactOutsideBehavior() {
									return s();
								},
								get isValidEvent() {
									return d();
								},
								get enabled() {
									return o.enabled;
								},
								get ref() {
									return o.ref;
								},
								children: (r, i) => {
									let s = () => (i?.()).props;
									ui(r, {
										get id() {
											return o.id;
										},
										get preventOverflowTextSelection() {
											return o.preventOverflowTextSelection;
										},
										get onPointerDown() {
											return o.onPointerDown;
										},
										get onPointerUp() {
											return o.onPointerUp;
										},
										get enabled() {
											return o.enabled;
										},
										get ref() {
											return o.ref;
										},
										children: (r, i) => {
											var l = f(), d = y(l);
											{
												let n = j(() => ({
													props: at(_, c(), s(), a(), { style: { pointerEvents: g() } }),
													wrapperProps: p()
												}));
												t(d, () => o.popper ?? u, () => e(n));
											}
											n(r, l);
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
			}), n(r, m);
		},
		$$slots: { content: !0 }
	}), r();
}
// node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer.svelte
var Lo = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.popper.open.onEscapeKeydown.escapeKeydownBehavior.preventOverflowTextSelection.id.onPointerDown.onPointerUp.side.sideOffset.align.alignOffset.arrowPadding.avoidCollisions.collisionBoundary.collisionPadding.sticky.hideWhenDetached.updatePositionStrategy.strategy.dir.preventScroll.wrapperId.style.onPlaced.onInteractOutside.onCloseAutoFocus.onOpenAutoFocus.onFocusOutside.interactOutsideBehavior.loop.trapFocus.isValidEvent.customAnchor.isStatic.ref.shouldRender".split("."));
function Ro(e, t) {
	let r = D(t, "interactOutsideBehavior", 3, "close"), i = D(t, "trapFocus", 3, !0), o = D(t, "isValidEvent", 3, () => !1), s = D(t, "customAnchor", 3, null), c = D(t, "isStatic", 3, !1), l = S(t, Lo);
	var u = f(), d = y(u), p = (e) => {
		Io(e, g({
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
				return s();
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
				return r();
			},
			get loop() {
				return t.loop;
			},
			get trapFocus() {
				return i();
			},
			get isValidEvent() {
				return o();
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
	a(d, (e) => {
		t.shouldRender && e(p);
	}), n(e, u);
}
// node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer-force-mount.svelte
var zo = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.popper.onEscapeKeydown.escapeKeydownBehavior.preventOverflowTextSelection.id.onPointerDown.onPointerUp.side.sideOffset.align.alignOffset.arrowPadding.avoidCollisions.collisionBoundary.collisionPadding.sticky.hideWhenDetached.updatePositionStrategy.strategy.dir.preventScroll.wrapperId.style.onPlaced.onInteractOutside.onCloseAutoFocus.onOpenAutoFocus.onFocusOutside.interactOutsideBehavior.loop.trapFocus.isValidEvent.customAnchor.isStatic.enabled".split("."));
function Bo(e, t) {
	let n = D(t, "interactOutsideBehavior", 3, "close"), r = D(t, "trapFocus", 3, !0), i = D(t, "isValidEvent", 3, () => !1), a = D(t, "customAnchor", 3, null), o = D(t, "isStatic", 3, !1), s = S(t, zo);
	Io(e, g({
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
export { At as A, on as C, zt as D, en as E, F, P as I, at as L, R as M, Dt as N, Ot as O, wt as P, M as R, B as S, z as T, lr as _, mo as a, dn as b, Hr as c, Lr as d, Er as f, Gr as g, Vr as h, Oo as i, jt as j, Pt as k, Rr as l, Ur as m, Ro as n, Wr as o, Ir as p, ko as r, Tr as s, Bo as t, Br as u, Dn as v, Qt as w, sn as x, gn as y };
