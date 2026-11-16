import { $ as e, A as t, B as n, Dt as r, Et as i, F as a, H as o, L as s, Ot as c, P as l, Rt as u, Tt as d, V as f, Y as p, Z as m, _t as h, a as g, at as _, ct as v, dt as y, ft as b, ht as x, i as S, kt as C, n as w, nt as T, pt as E, r as D, st as O, tt as k, w as A, wt as ee, xt as te, yt as j, z as ne } from "./index-client-C_2wYFnt.js";
import "./disclose-version-DFvUDwEH.js";
import { n as re } from "./index-client-RfUBbaI1.js";
// node_modules/@hugeicons/core-free-icons/dist/esm/ArrowRight01Icon.js
var ie = [["path", {
	d: "M9.00005 6C9.00005 6 15 10.4189 15 12C15 13.5812 9 18 9 18",
	stroke: "currentColor",
	strokeLinecap: "round",
	strokeLinejoin: "round",
	strokeWidth: "1.5",
	key: "0"
}]];
// node_modules/svelte-toolbelt/dist/utils/is.js
function ae(e) {
	return typeof e == "function";
}
function oe(e) {
	return typeof e == "object" && !!e;
}
var se = [
	"string",
	"number",
	"bigint",
	"boolean"
];
function ce(e) {
	return e == null || se.includes(typeof e) ? !0 : Array.isArray(e) ? e.every((e) => ce(e)) : typeof e == "object" && Object.getPrototypeOf(e) === Object.prototype;
}
// node_modules/svelte-toolbelt/dist/box/box-extras.svelte.js
var le = Symbol("box"), ue = Symbol("is-writable");
function M(t, n) {
	let r = j(t);
	return n ? {
		[le]: !0,
		[ue]: !0,
		get current() {
			return e(r);
		},
		set current(e) {
			n(e);
		}
	} : {
		[le]: !0,
		get current() {
			return t();
		}
	};
}
function de(e) {
	return oe(e) && le in e;
}
function fe(e) {
	return de(e) && ue in e;
}
function pe(e) {
	return de(e) ? e : ae(e) ? M(e) : N(e);
}
function me(e) {
	return Object.entries(e).reduce((e, [t, n]) => de(n) ? (fe(n) ? Object.defineProperty(e, t, {
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
function he(e) {
	return fe(e) ? {
		[le]: !0,
		get current() {
			return e.current;
		}
	} : e;
}
function N(t) {
	let n = h(E(t));
	return {
		[le]: !0,
		[ue]: !0,
		get current() {
			return e(n);
		},
		set current(e) {
			x(n, e, !0);
		}
	};
}
// node_modules/svelte-toolbelt/dist/box/box.svelte.js
function ge(t) {
	let n = h(E(t));
	return {
		[le]: !0,
		[ue]: !0,
		get current() {
			return e(n);
		},
		set current(e) {
			x(n, e, !0);
		}
	};
}
ge.from = pe, ge.with = M, ge.flatten = me, ge.readonly = he, ge.isBox = de, ge.isWritableBox = fe;
// node_modules/svelte-toolbelt/dist/utils/compose-handlers.js
function _e(...e) {
	return function(t) {
		for (let n of e) if (n) {
			if (t.defaultPrevented) return;
			typeof n == "function" ? n.call(this, t) : n.current?.call(this, t);
		}
	};
}
// node_modules/inline-style-parser/esm/index.mjs
var ve = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g, ye = /\n/g, be = /^\s*/, xe = /^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/, Se = /^:\s*/, Ce = /^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/, we = /^[;\s]*/, Te = /^\s+|\s+$/g, Ee = "\n", De = "/", Oe = "*", ke = "", Ae = "comment", je = "declaration";
function Me(e, t) {
	if (typeof e != "string") throw TypeError("First argument must be a string");
	if (!e) return [];
	t ||= {};
	var n = 1, r = 1;
	function i(e) {
		var t = e.match(ye);
		t && (n += t.length);
		var i = e.lastIndexOf(Ee);
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
		c(be);
	}
	function u(e) {
		var t;
		for (e ||= []; t = d();) t !== !1 && e.push(t);
		return e;
	}
	function d() {
		var t = a();
		if (De == e.charAt(0) && Oe == e.charAt(1)) {
			for (var n = 2; ke != e.charAt(n) && (Oe != e.charAt(n) || De != e.charAt(n + 1));) ++n;
			if (n += 2, ke === e.charAt(n - 1)) return s("End of comment missing");
			var o = e.slice(2, n - 2);
			return r += 2, i(o), e = e.slice(n), r += 2, t({
				type: Ae,
				comment: o
			});
		}
	}
	function f() {
		var e = a(), t = c(xe);
		if (t) {
			if (d(), !c(Se)) return s("property missing ':'");
			var n = c(Ce), r = e({
				type: je,
				property: Ne(t[0].replace(ve, ke)),
				value: n ? Ne(n[0].replace(ve, ke)) : ke
			});
			return c(we), r;
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
function Ne(e) {
	return e ? e.replace(Te, ke) : ke;
}
// node_modules/style-to-object/esm/index.mjs
function Pe(e, t) {
	let n = null;
	if (!e || typeof e != "string") return n;
	let r = Me(e), i = typeof t == "function";
	return r.forEach((e) => {
		if (e.type !== "declaration") return;
		let { property: r, value: a } = e;
		i ? t(r, a, e) : a && (n ||= {}, n[r] = a);
	}), n;
}
// node_modules/svelte-toolbelt/dist/utils/strings.js
var Fe = /\d/, Ie = [
	"-",
	"_",
	"/",
	"."
];
function Le(e = "") {
	if (!Fe.test(e)) return e !== e.toLowerCase();
}
function Re(e) {
	let t = [], n = "", r, i;
	for (let a of e) {
		let e = Ie.includes(a);
		if (e === !0) {
			t.push(n), n = "", r = void 0;
			continue;
		}
		let o = Le(a);
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
function ze(e) {
	return e ? Re(e).map((e) => Ve(e)).join("") : "";
}
function Be(e) {
	return He(ze(e || ""));
}
function Ve(e) {
	return e ? e[0].toUpperCase() + e.slice(1) : "";
}
function He(e) {
	return e ? e[0].toLowerCase() + e.slice(1) : "";
}
// node_modules/svelte-toolbelt/dist/utils/css-to-style-obj.js
var Ue = 1e3, We = /* @__PURE__ */ new Map();
function Ge(e) {
	let t = We.get(e);
	return t === void 0 && (t = e.startsWith("-moz-") || e.startsWith("-webkit-") || e.startsWith("-ms-") || e.startsWith("-o-") ? ze(e) : e.startsWith("--") ? e : Be(e), We.size >= Ue && We.clear(), We.set(e, t)), t;
}
var Ke = /["'\\{}]|\/\*/, qe = /^[-\w]+$/;
function Je(e) {
	if (Ke.test(e)) return null;
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
				if (!qe.test(n) || !o) return null;
				t.push(n, o);
			}
			r = a + 1, i = -1;
		}
	}
	return t;
}
function Ye(e, t) {
	let n = Je(t);
	if (n) for (let t = 0; t < n.length; t += 2) e[Ge(n[t])] = n[t + 1];
	else Pe(t, (t, n) => {
		e[Ge(t)] = n;
	});
}
function Xe(e) {
	if (!e) return {};
	let t = {};
	return Ye(t, e), t;
}
// node_modules/svelte-toolbelt/dist/utils/execute-callbacks.js
function Ze(...e) {
	return (...t) => {
		for (let n of e) typeof n == "function" && n(...t);
	};
}
// node_modules/svelte-toolbelt/dist/utils/style-to-css.js
function Qe(e, t) {
	let n = RegExp(e, "g");
	return (e) => {
		if (typeof e != "string") throw TypeError(`expected an argument of type string, but got ${typeof e}`);
		return e.match(n) ? e.replace(n, t) : e;
	};
}
var $e = Qe(/[A-Z]/, (e) => `-${e.toLowerCase()}`), et = /* @__PURE__ */ new Map();
function tt(e) {
	let t = et.get(e);
	return t === void 0 && (t = $e(e), et.size >= 1e3 && et.clear(), et.set(e, t)), t;
}
function nt(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError(`expected an argument of type object, but got ${typeof e}`);
	let t = "";
	for (let n of Object.keys(e)) {
		let r = e[n];
		r != null && r !== "" && (t += `${t ? "\n" : ""}${tt(n)}: ${r};`);
	}
	return t;
}
// node_modules/svelte-toolbelt/dist/utils/style.js
function rt(e = {}) {
	return nt(e).replace("\n", " ");
}
var it = new Set(/* @__PURE__ */ "onabort.onanimationcancel.onanimationend.onanimationiteration.onanimationstart.onauxclick.onbeforeinput.onbeforetoggle.onblur.oncancel.oncanplay.oncanplaythrough.onchange.onclick.onclose.oncompositionend.oncompositionstart.oncompositionupdate.oncontextlost.oncontextmenu.oncontextrestored.oncopy.oncuechange.oncut.ondblclick.ondrag.ondragend.ondragenter.ondragleave.ondragover.ondragstart.ondrop.ondurationchange.onemptied.onended.onerror.onfocus.onfocusin.onfocusout.onformdata.ongotpointercapture.oninput.oninvalid.onkeydown.onkeypress.onkeyup.onload.onloadeddata.onloadedmetadata.onloadstart.onlostpointercapture.onmousedown.onmouseenter.onmouseleave.onmousemove.onmouseout.onmouseover.onmouseup.onpaste.onpause.onplay.onplaying.onpointercancel.onpointerdown.onpointerenter.onpointerleave.onpointermove.onpointerout.onpointerover.onpointerup.onprogress.onratechange.onreset.onresize.onscroll.onscrollend.onsecuritypolicyviolation.onseeked.onseeking.onselect.onselectionchange.onselectstart.onslotchange.onstalled.onsubmit.onsuspend.ontimeupdate.ontoggle.ontouchcancel.ontouchend.ontouchmove.ontouchstart.ontransitioncancel.ontransitionend.ontransitionrun.ontransitionstart.onvolumechange.onwaiting.onwebkitanimationend.onwebkitanimationiteration.onwebkitanimationstart.onwebkittransitionend.onwheel".split("."));
// node_modules/svelte-toolbelt/dist/utils/merge-props.js
function at(e) {
	return it.has(e);
}
function ot(...e) {
	let t = { ...e[0] };
	for (let n = 1; n < e.length; n++) {
		let r = e[n];
		if (r) {
			for (let e of Object.keys(r)) {
				let n = t[e], i = r[e], a = typeof n == "function", o = typeof i == "function";
				if (a && o && at(e)) t[e] = _e(n, i);
				else if (a && o) t[e] = Ze(n, i);
				else if (e === "class") {
					let r = ce(n), a = ce(i);
					r && a ? t[e] = A(n, i) : r ? t[e] = A(n) : a && (t[e] = A(i));
				} else if (e === "style") {
					let r = typeof n == "object", a = typeof i == "object", o = typeof n == "string", s = typeof i == "string";
					if (r && a) t[e] = {
						...n,
						...i
					};
					else if (r && s) {
						let r = Xe(i);
						t[e] = {
							...n,
							...r
						};
					} else if (o && a) t[e] = {
						...Xe(n),
						...i
					};
					else if (o && s) {
						let r = Xe(n), a = Xe(i);
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
	return typeof t.style == "object" && (t.style = rt(t.style).replaceAll("\n", " ")), t.hidden === !1 && (t.hidden = void 0, delete t.hidden), t.disabled === !1 && (t.disabled = void 0, delete t.disabled), t;
}
// node_modules/runed/dist/internal/configurable-globals.js
var st = typeof window < "u" ? window : void 0;
typeof window < "u" && window.document, typeof window < "u" && window.navigator, typeof window < "u" && window.location;
// node_modules/runed/dist/internal/utils/dom.js
function ct(e) {
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
		let { window: t = st, document: n = t?.document } = e;
		t !== void 0 && (this.#e = n, this.#t = te((e) => {
			let n = p(t, "focusin", e), r = p(t, "focusout", e);
			return () => {
				n(), r();
			};
		}));
	}
	get current() {
		return this.#t?.(), this.#e ? ct(this.#e) : null;
	}
}();
// node_modules/runed/dist/internal/utils/is.js
function lt(e) {
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
function ut(e, t) {
	switch (e) {
		case "post":
			O(t);
			break;
		case "pre": v(t);
	}
}
function dt(e, t, n, r = {}) {
	let { lazy: i = !1 } = r, a = !i, o = Array.isArray(e) ? [] : void 0;
	ut(t, () => {
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
	dt(e, "post", t, n);
}
function ft(e, t, n) {
	dt(e, "pre", t, n);
}
F.pre = ft;
// node_modules/runed/dist/internal/utils/get.js
function pt(e) {
	return lt(e) ? e() : e;
}
// node_modules/runed/dist/utilities/element-size/element-size.svelte.js
var mt = class {
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
		let e = pt(this.#r);
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
		this.#i = t.window ?? st, this.#n = t, this.#r = e, this.#e = {
			width: 0,
			height: 0
		};
	}
	calculateSize() {
		let e = pt(this.#r);
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
function ht(e, t) {
	return setTimeout(t, e);
}
// node_modules/svelte-toolbelt/dist/utils/after-tick.js
function L(e) {
	k().then(e);
}
// node_modules/svelte-toolbelt/dist/utils/dom.js
var gt = 1, _t = 9, vt = 11;
function yt(e) {
	return oe(e) && e.nodeType === gt && typeof e.nodeName == "string";
}
function bt(e) {
	return oe(e) && e.nodeType === _t;
}
function xt(e) {
	return oe(e) && e.constructor?.name === "VisualViewport";
}
function St(e) {
	return oe(e) && e.nodeType !== void 0;
}
function Ct(e) {
	return St(e) && e.nodeType === vt && "host" in e;
}
function wt(e, t) {
	if (!e || !t || !yt(e) || !yt(t)) return !1;
	let n = t.getRootNode?.();
	if (e === t || e.contains(t)) return !0;
	if (n && Ct(n)) {
		let n = t;
		for (; n;) {
			if (e === n) return !0;
			n = n.parentNode || n.host;
		}
	}
	return !1;
}
function Tt(e) {
	return bt(e) ? e : xt(e) ? e.document : e?.ownerDocument ?? document;
}
function Et(e) {
	return Ct(e) ? Et(e.host) : bt(e) ? e.defaultView ?? window : yt(e) ? e.ownerDocument?.defaultView ?? window : window;
}
function Dt(e) {
	let t = e.activeElement;
	for (; t?.shadowRoot;) {
		let e = t.shadowRoot.activeElement;
		if (e === t) break;
		t = e;
	}
	return t;
}
// node_modules/svelte-toolbelt/dist/utils/dom-context.svelte.js
var Ot = class {
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
	getDocument = () => Tt(this.root);
	getWindow = () => this.getDocument().defaultView ?? window;
	getActiveElement = () => Dt(this.root);
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
	return { [m()]: (n) => de(e) ? (e.current = n, T(() => t?.(n)), () => {
		"isConnected" in n && n.isConnected || (e.current = null, t?.(null));
	}) : (e(n), T(() => t?.(n)), () => {
		"isConnected" in n && n.isConnected || (e(null), t?.(null));
	}) };
}
// node_modules/bits-ui/dist/internal/attrs.js
function kt(e) {
	return e ? "true" : "false";
}
function At(e) {
	return e ? "" : void 0;
}
function jt(e) {
	return e ? "open" : "closed";
}
function Mt(e) {
	return e === "starting" ? { "data-starting-style": "" } : e === "ending" ? { "data-ending-style": "" } : {};
}
function Nt(e, t) {
	return t ? "mixed" : e ? "true" : "false";
}
var Pt = class {
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
function Ft(e) {
	let t = new Pt(e);
	return {
		...t.attrs,
		selector: t.selector,
		getAttr: t.getAttr
	};
}
// node_modules/bits-ui/dist/internal/kbd-constants.js
var It = "ArrowDown", Lt = "ArrowLeft", Rt = "ArrowRight", zt = "ArrowUp", Bt = "Enter", Vt = "Home", Ht = "PageDown", Ut = "PageUp";
// node_modules/bits-ui/dist/internal/locale.js
function Wt(e) {
	return window.getComputedStyle(e).getPropertyValue("direction");
}
// node_modules/bits-ui/dist/internal/get-directional-keys.js
var Gt = [
	It,
	Ut,
	Vt
], Kt = [
	zt,
	Ht,
	"End"
];
[...Gt, ...Kt];
function qt(e = "ltr", t = "horizontal") {
	return {
		horizontal: e === "rtl" ? Lt : Rt,
		vertical: It
	}[t];
}
function Jt(e = "ltr", t = "horizontal") {
	return {
		horizontal: e === "rtl" ? Rt : Lt,
		vertical: zt
	}[t];
}
function Yt(e = "ltr", t = "horizontal") {
	return ["ltr", "rtl"].includes(e) || (e = "ltr"), ["horizontal", "vertical"].includes(t) || (t = "horizontal"), {
		nextKey: qt(e, t),
		prevKey: Jt(e, t)
	};
}
// node_modules/bits-ui/dist/internal/is.js
var Xt = typeof document < "u", Zt = Qt();
function Qt() {
	return Xt && window?.navigator?.userAgent && (/iP(ad|hone|od)/.test(window.navigator.userAgent) || window?.navigator?.maxTouchPoints > 2 && /iPad|Macintosh/.test(window?.navigator.userAgent));
}
function z(e) {
	return e instanceof HTMLElement;
}
function $t(e) {
	return e instanceof Element;
}
function en(e) {
	return e instanceof Element || e instanceof SVGElement;
}
function tn(e) {
	return e.pointerType === "touch";
}
function nn(e) {
	return e !== null;
}
function rn(e) {
	return e instanceof HTMLInputElement && "select" in e;
}
// node_modules/bits-ui/dist/internal/roving-focus-group.js
var an = class {
	#e;
	#t = ge(null);
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
		let a = i.indexOf(e), { nextKey: o, prevKey: s } = Yt(Wt(r), this.#e.orientation.current), c = this.#e.loop.current, l = {
			[o]: a + 1,
			[s]: a - 1,
			[Vt]: 0,
			End: i.length - 1
		};
		if (n) {
			let e = o === "ArrowDown" ? Rt : It, t = s === "ArrowUp" ? Lt : zt;
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
}, on = class {
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
}, sn = class {
	#e;
	#t;
	#n;
	#r = h(!1);
	#i = h(void 0);
	#a = !1;
	#o = null;
	constructor(e) {
		this.#e = e, x(this.#r, e.open.current, !0), this.#t = e.enabled ?? !0, this.#n = new on({
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
function cn(e, t) {
	return t === void 0 ? `bits-${e}` : `bits-${e}-${t}`;
}
// node_modules/bits-ui/dist/bits/utilities/portal/portal-consumer.svelte
function ln(e, r) {
	var i = f(), a = y(i);
	l(a, () => r.children, (e) => {
		var i = f(), a = y(i);
		t(a, () => r.children ?? u), n(e, i);
	}), n(e, i);
}
// node_modules/bits-ui/dist/bits/utilities/config/bits-config.js
var un = new P("BitsConfig");
function dn() {
	let e = new pn(null, {});
	return un.getOr(e).opts;
}
function fn(e) {
	return un.set(new pn(un.getOr(null), e));
}
var pn = class {
	opts;
	constructor(e, t) {
		let n = mn(e, t);
		this.opts = {
			defaultPortalTo: n((e) => e.defaultPortalTo),
			defaultLocale: n((e) => e.defaultLocale)
		};
	}
};
function mn(e, t) {
	return (n) => M(() => {
		let r = n(t)?.current;
		if (r !== void 0) return r;
		if (e !== null) return n(e.opts)?.current;
	});
}
// node_modules/bits-ui/dist/bits/utilities/config/prop-resolvers.js
function hn(e, t) {
	return (n) => {
		let r = dn();
		return M(() => {
			let i = n();
			if (i !== void 0) return i;
			let a = e(r).current;
			return a === void 0 ? t : a;
		});
	};
}
var gn = hn((e) => e.defaultPortalTo, "body");
// node_modules/bits-ui/dist/bits/utilities/portal/portal.svelte
function _n(i, o) {
	c(o, !0);
	let l = gn(() => o.to), d = ee(), p = j(m);
	function m() {
		if (!Xt || o.disabled) return null;
		let e = null;
		return e = typeof l.current == "string" ? document.querySelector(l.current) : l.current, e;
	}
	let h;
	function g() {
		h &&= (ne(h), null);
	}
	F([() => e(p), () => o.disabled], ([e, t]) => {
		if (!e || t) g();
		else return h = s(ln, {
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
var vn = class {
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
function yn(e, t = 500) {
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
function bn(e, t) {
	return e === t || e.contains(t);
}
function xn(e) {
	return e?.ownerDocument ?? document;
}
// node_modules/bits-ui/dist/internal/dom.js
function Sn(e, t) {
	let { clientX: n, clientY: r } = e, i = t.getBoundingClientRect();
	return n < i.left || n > i.right || r < i.top || r > i.bottom;
}
// node_modules/bits-ui/dist/bits/menu/utils.js
var Cn = [Bt, " "], wn = [
	It,
	Ut,
	Vt
], Tn = [
	zt,
	Ht,
	"End"
], En = [...wn, ...Tn], Dn = {
	ltr: [...Cn, Rt],
	rtl: [...Cn, Lt]
}, On = {
	ltr: [Lt],
	rtl: [Rt]
};
function kn(e) {
	return e === "indeterminate";
}
function An(e) {
	return kn(e) ? "indeterminate" : e ? "checked" : "unchecked";
}
function V(e) {
	return e.pointerType === "mouse";
}
// node_modules/bits-ui/dist/internal/focus.js
function jn(e, { select: t = !1 } = {}) {
	if (!e || !e.focus) return;
	let n = Tt(e);
	if (n.activeElement === e) return;
	let r = n.activeElement;
	e.focus({ preventScroll: !0 }), e !== r && rn(e) && t && e.select();
}
function Mn(e, { select: t = !1 } = {}, n) {
	let r = n();
	for (let i of e) if (jn(i, { select: t }), n() !== r) return !0;
}
// node_modules/bits-ui/dist/bits/utilities/is-using-keyboard/is-using-keyboard.svelte.js
var Nn = h(!1), Pn = class t {
	static _refs = 0;
	static _cleanup;
	constructor() {
		O(() => (t._refs === 0 && (t._cleanup = _(() => {
			let e = [], t = (e) => {
				x(Nn, !1);
			};
			return e.push(p(document, "pointerdown", t, { capture: !0 }), p(document, "pointermove", t, { capture: !0 }), p(document, "keydown", (e) => {
				x(Nn, !0);
			}, { capture: !0 })), Ze(...e);
		})), t._refs++, () => {
			t._refs--, t._refs === 0 && (x(Nn, !1), t._cleanup?.());
		}));
	}
	get current() {
		return e(Nn);
	}
	set current(e) {
		x(Nn, e, !0);
	}
}, Fn = [
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
], In = /* #__PURE__ */ Fn.join(","), Ln = typeof Element > "u", H = Ln ? function() {} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector, Rn = !Ln && Element.prototype.getRootNode ? function(e) {
	return e == null || e.getRootNode == null ? void 0 : e.getRootNode();
} : function(e) {
	return e?.ownerDocument;
}, zn = function(e, t) {
	t === void 0 && (t = !0);
	var n = e == null || e.getAttribute == null ? void 0 : e.getAttribute("inert");
	return n === "" || n === "true" || t && e && (typeof e.closest == "function" ? e.closest("[inert]") : zn(e.parentNode));
}, Bn = function(e) {
	var t, n = e == null || e.getAttribute == null || (t = e.getAttribute("contenteditable")) == null ? void 0 : t.toLowerCase();
	return n === "" || n === "true" || n === "plaintext-only";
}, Vn = function(e, t, n) {
	if (zn(e)) return [];
	var r = Array.prototype.slice.apply(e.querySelectorAll(In));
	return t && H.call(e, In) && r.unshift(e), r = r.filter(n), r;
}, Hn = function(e, t, n) {
	for (var r = [], i = Array.from(e); i.length;) {
		var a = i.shift();
		if (!zn(a, !1)) {
			if (a.tagName === "SLOT") {
				var o = a.assignedElements(), s = Hn(o.length ? o : a.children, !0, n);
				n.flatten ? r.push.apply(r, s) : r.push({
					scopeParent: a,
					candidates: s
				});
			} else {
				H.call(a, In) && n.filter(a) && (t || !e.includes(a)) && r.push(a);
				var c = a.shadowRoot || typeof n.getShadowRoot == "function" && n.getShadowRoot(a), l = !zn(c, !1) && (!n.shadowRootFilter || n.shadowRootFilter(a));
				if (c && l) {
					var u = Hn(c === !0 ? a.children : c.children, !0, n);
					n.flatten ? r.push.apply(r, u) : r.push({
						scopeParent: a,
						candidates: u
					});
				} else i.unshift.apply(i, a.children);
			}
		}
	}
	return r;
}, Un = function(e) {
	return !isNaN(parseInt(e.getAttribute("tabindex"), 10));
}, Wn = function(e) {
	if (!e) throw Error("No node provided");
	return e.tabIndex < 0 && (/^(AUDIO|VIDEO|DETAILS)$/.test(e.tagName) || Bn(e)) && !Un(e) ? 0 : e.tabIndex;
}, Gn = function(e, t) {
	var n = Wn(e);
	return n < 0 && t && !Un(e) ? 0 : n;
}, Kn = function(e, t) {
	return e.tabIndex === t.tabIndex ? e.documentOrder - t.documentOrder : e.tabIndex - t.tabIndex;
}, qn = function(e) {
	return e.tagName === "INPUT";
}, Jn = function(e) {
	return qn(e) && e.type === "hidden";
}, Yn = function(e) {
	return e.tagName === "DETAILS" && Array.prototype.slice.apply(e.children).some(function(e) {
		return e.tagName === "SUMMARY";
	});
}, Xn = function(e, t) {
	for (var n = 0; n < e.length; n++) if (e[n].checked && e[n].form === t) return e[n];
}, Zn = function(e) {
	if (!e.name) return !0;
	var t = e.form || Rn(e), n = function(e) {
		return t.querySelectorAll("input[type=\"radio\"][name=\"" + e + "\"]");
	}, r;
	if (typeof window < "u" && window.CSS !== void 0 && typeof window.CSS.escape == "function") r = n(window.CSS.escape(e.name));
	else try {
		r = n(e.name);
	} catch (e) {
		return console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s", e.message), !1;
	}
	var i = Xn(r, e.form);
	return !i || i === e;
}, Qn = function(e) {
	return qn(e) && e.type === "radio";
}, $n = function(e) {
	return Qn(e) && !Zn(e);
}, er = function(e) {
	var t = e && Rn(e), n = t?.host, r = !1;
	if (t && t !== e) {
		var i, a;
		for (r = !!((i = n) != null && (i = i.ownerDocument) != null && i.contains(n) || e != null && (a = e.ownerDocument) != null && a.contains(e)); !r && n;) {
			var o;
			t = Rn(n), n = t?.host, r = !!((o = n) != null && (o = o.ownerDocument) != null && o.contains(n));
		}
	}
	return r;
}, tr = function(e) {
	var t = e.getBoundingClientRect(), n = t.width, r = t.height;
	return n === 0 && r === 0;
}, nr = function(e, t) {
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
				var s = e.parentElement, c = Rn(e);
				if (s && !s.shadowRoot && r(s) === !0) return tr(e);
				e = e.assignedSlot ? e.assignedSlot : !s && c !== e.ownerDocument ? c.host : s;
			}
			e = o;
		}
		if (er(e)) return !e.getClientRects().length;
		if (n !== "legacy-full") return !0;
	} else if (n === "non-zero-area") return tr(e);
	return !1;
}, rr = function(e) {
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
}, ir = function(e, t) {
	return !(t.disabled || Jn(t) || nr(t, e) || Yn(t) || rr(t));
}, ar = function(e, t) {
	return !($n(t) || Wn(t) < 0 || !ir(e, t));
}, or = function(e) {
	var t = parseInt(e.getAttribute("tabindex"), 10);
	return !!(isNaN(t) || t >= 0);
}, sr = function(e) {
	var t = [], n = [];
	return e.forEach(function(e, r) {
		var i = !!e.scopeParent, a = i ? e.scopeParent : e, o = Gn(a, i), s = i ? sr(e.candidates) : a;
		o === 0 ? i ? t.push.apply(t, s) : t.push(a) : n.push({
			documentOrder: r,
			tabIndex: o,
			item: e,
			isScope: i,
			content: s
		});
	}), n.sort(Kn).reduce(function(e, t) {
		return t.isScope ? e.push.apply(e, t.content) : e.push(t.content), e;
	}, []).concat(t);
}, cr = function(e, t) {
	return t ||= {}, sr(t.getShadowRoot ? Hn([e], t.includeContainer, {
		filter: ar.bind(null, t),
		flatten: !1,
		getShadowRoot: t.getShadowRoot,
		shadowRootFilter: or
	}) : Vn(e, t.includeContainer, ar.bind(null, t)));
}, lr = function(e, t) {
	return t ||= {}, t.getShadowRoot ? Hn([e], t.includeContainer, {
		filter: ir.bind(null, t),
		flatten: !0,
		getShadowRoot: t.getShadowRoot
	}) : Vn(e, t.includeContainer, ir.bind(null, t));
}, ur = function(e, t) {
	if (t ||= {}, !e) throw Error("No node provided");
	return H.call(e, In) !== !1 && ar(t, e);
}, dr = /* #__PURE__ */ Fn.concat("iframe:not([inert]):not([inert] *)").join(","), fr = function(e, t) {
	if (t ||= {}, !e) throw Error("No node provided");
	return H.call(e, dr) !== !1 && ir(t, e);
};
// node_modules/bits-ui/dist/internal/tabbable.js
function pr() {
	return {
		getShadowRoot: !0,
		displayCheck: typeof ResizeObserver == "function" && ResizeObserver.toString().includes("[native code]") ? "full" : "none"
	};
}
function mr(e, t) {
	if (!ur(e, pr())) return hr(e, t);
	let n = Tt(e), r = cr(n.body, pr());
	t === "prev" && r.reverse();
	let i = r.indexOf(e);
	return i === -1 ? n.body : r.slice(i + 1)[0];
}
function hr(e, t) {
	let n = Tt(e);
	if (!fr(e, pr())) return n.body;
	let r = lr(n.body, pr());
	t === "prev" && r.reverse();
	let i = r.indexOf(e);
	return i === -1 ? n.body : r.slice(i + 1).find((e) => ur(e, pr())) ?? n.body;
}
// node_modules/bits-ui/dist/internal/arrays.js
function gr(e, t, n) {
	let r = t.toLowerCase();
	if (r.endsWith(" ")) {
		let i = r.slice(0, -1);
		if (e.filter((e) => e.toLowerCase().startsWith(i)).length <= 1) return gr(e, i, n);
		let a = n?.toLowerCase();
		if (a && a.startsWith(i) && a.charAt(i.length) === " " && t.trim() === i) return n;
		let o = e.filter((e) => e.toLowerCase().startsWith(r));
		if (o.length > 0) {
			let t = n ? e.indexOf(n) : -1;
			return _r(o, Math.max(t, 0)).find((e) => e !== n) || n;
		}
	}
	let i = t.length > 1 && Array.from(t).every((e) => e === t[0]) ? t[0] : t, a = i.toLowerCase(), o = n ? e.indexOf(n) : -1, s = _r(e, Math.max(o, 0));
	i.length === 1 && (s = s.filter((e) => e !== n));
	let c = s.find((e) => e?.toLowerCase().startsWith(a));
	return c === n ? void 0 : c;
}
function _r(e, t) {
	return e.map((n, r) => e[(t + r) % e.length]);
}
// node_modules/bits-ui/dist/internal/box-auto-reset.svelte.js
var vr = {
	afterMs: 1e4,
	onChange: B
};
function yr(t, n) {
	let { afterMs: r, onChange: i, getWindow: a } = {
		...vr,
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
var br = class {
	#e;
	#t;
	#n = j(() => this.#e.onMatch ? this.#e.onMatch : (e) => e.focus());
	#r = j(() => this.#e.getCurrentItem ? this.#e.getCurrentItem : this.#e.getActiveElement);
	constructor(e) {
		this.#e = e, this.#t = yr("", {
			afterMs: 1e3,
			getWindow: e.getWindow
		}), this.handleTypeaheadSearch = this.handleTypeaheadSearch.bind(this), this.resetTypeahead = this.resetTypeahead.bind(this);
	}
	handleTypeaheadSearch(t, n) {
		if (!n.length) return;
		this.#t.current = this.#t.current + t;
		let r = e(this.#r)(), i = n.find((e) => e === r)?.textContent?.trim() ?? "", a = gr(n.map((e) => e.textContent?.trim() ?? ""), this.#t.current, i), o = n.find((e) => e.textContent?.trim() === a);
		return o && e(this.#n)(o), o;
	}
	resetTypeahead() {
		this.#t.current = "";
	}
	get search() {
		return this.#t.current;
	}
}, xr = "data-context-menu-trigger", Sr = "data-context-menu-content", Cr = new P("Menu.Root"), wr = new P("Menu.Root | Menu.Sub"), Tr = new P("Menu.Content");
new P("Menu.Group | Menu.RadioGroup"), new P("Menu.RadioGroup");
var Er = new P("Menu.CheckboxGroup"), Dr = new vn("bitsmenuopen", {
	bubbles: !1,
	cancelable: !0
}), Or = Ft({
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
}), kr = class {
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
					if ($t(e.relatedTarget)) {
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
		let i = n.getBoundingClientRect(), a = r.getBoundingClientRect(), o = Nr(i, a), s, c, l;
		return t === "content" ? (s = this.#r ? this.#a ?? e : e, c = a) : (s = this.#s ?? e, c = this.#c() ?? i, l = a), this.#a = s, {
			corridor: Pr(i, a, o),
			intent: Fr(s, c, o, t, l),
			targetRect: c,
			side: o
		};
	}
	#u(e, t, n) {
		return Ar(e, t) || Ar(e, n);
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
		if ($t(i) && (t === "content" && r.contains(i) || t === "trigger" && n.contains(i))) return;
		let a = {
			x: e.clientX,
			y: e.clientY
		}, o = this.#l(a, t);
		o && (!jr(a, o.targetRect) && !this.#u(a, o.corridor, o.intent) ? this.#w() : (this.#r = !0, this.#i = t, this.#o = a, this.#e.setIsPointerInTransit(!0), this.#b(), this.#S()));
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
		if (this.#i === "content" && jr(r, a) || this.#i === "trigger" && Mr(r, i, 4)) {
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
		let e = Tt(this.#e.triggerNode() ?? this.#e.contentNode());
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
function Ar(e, t) {
	let { x: n, y: r } = e, i = !1;
	for (let e = 0, a = t.length - 1; e < t.length; a = e++) {
		let o = t[e].x, s = t[e].y, c = t[a].x, l = t[a].y;
		s > r != l > r && n < (c - o) * (r - s) / (l - s) + o && (i = !i);
	}
	return i;
}
function jr(e, t) {
	return e.x >= t.left && e.x <= t.right && e.y >= t.top && e.y <= t.bottom;
}
function Mr(e, t, n) {
	return e.x >= t.left + n && e.x <= t.right - n && e.y >= t.top + n && e.y <= t.bottom - n;
}
function Nr(e, t) {
	let n = e.left + e.width / 2, r = e.top + e.height / 2, i = t.left + t.width / 2, a = t.top + t.height / 2, o = i - n, s = a - r;
	return Math.abs(o) > Math.abs(s) ? o > 0 ? "right" : "left" : s > 0 ? "bottom" : "top";
}
function Pr(e, t, n) {
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
function Fr(e, t, n, r, i) {
	let a = r === "trigger" ? Ir(n) : n, o = i ? Math.min(t.top, i.top) - 8 : t.top - 8, s = i ? Math.max(t.bottom, i.bottom) + 8 : t.bottom + 8, c = i ? Math.min(t.left, i.left) - 8 : t.left - 8, l = i ? Math.max(t.right, i.right) + 8 : t.right + 8;
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
function Ir(e) {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}
var Lr = class t {
	static create(e) {
		let n = new t(e);
		return Cr.set(n);
	}
	opts;
	isUsingKeyboard = new Pn();
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
	getBitsAttr = (e) => Or.getAttr(e, this.opts.variant.current);
}, Rr = class t {
	static create(e, n) {
		return wr.set(new t(e, n, null));
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
		this.opts = e, this.root = t, this.parentMenu = n, this.contentPresence = new sn({
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
}, zr = class t {
	static create(e) {
		return Tr.set(new t(e, wr.get()));
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
		this.opts = e, this.parentMenu = t, this.domContext = new Ot(e.ref), this.attachment = R(this.opts.ref, (e) => {
			this.parentMenu.contentNode !== e && (this.parentMenu.contentNode = e);
		}), t.contentId = e.id, this.#i = e.isSub ?? !1, this.onkeydown = this.onkeydown.bind(this), this.onblur = this.onblur.bind(this), this.onfocus = this.onfocus.bind(this), this.handleInteractOutside = this.handleInteractOutside.bind(this), new kr({
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
		}), this.#n = new br({
			getActiveElement: () => this.domContext.getActiveElement(),
			getWindow: () => this.domContext.getWindow()
		}).handleTypeaheadSearch, this.rovingFocusGroup = new an({
			rootNode: M(() => this.parentMenu.contentNode),
			candidateAttr: this.parentMenu.root.getBitsAttr("item"),
			loop: this.opts.loop,
			orientation: M(() => "vertical")
		}), F(() => this.parentMenu.contentNode, (e) => e ? Dr.listen(e, () => {
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
		if (!$t(n)) return;
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
		this.opts.onCloseAutoFocus.current?.(e), e.defaultPrevented || this.#i || (this.parentMenu.root.ignoreCloseAutoFocus ? e.preventDefault() : this.parentMenu.triggerNode && ur(this.parentMenu.triggerNode) && (e.preventDefault(), this.parentMenu.triggerNode.focus()));
	};
	handleTabKeyDown(e) {
		let t = this.parentMenu;
		for (; t.parentMenu !== null;) t = t.parentMenu;
		if (!t.triggerNode) return;
		e.preventDefault();
		let n = mr(t.triggerNode, e.shiftKey ? "prev" : "next");
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
		r && !i && a && this.#n(e.key, o), e.target?.id === this.parentMenu.contentId.current && En.includes(e.key) && (e.preventDefault(), Tn.includes(e.key) && o.reverse(), Mn(o, { select: !1 }, () => this.domContext.getActiveElement()));
	}
	onblur(e) {
		$t(e.currentTarget) && $t(e.target) && (e.currentTarget.contains?.(e.target) || (this.domContext.getWindow().clearTimeout(this.#t), this.search = ""));
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
		if (!en(e.target)) return;
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
		"data-state": jt(this.parentMenu.opts.open.current),
		...Mt(this.parentMenu.contentPresence.transitionStatus),
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
}, Br = class {
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
		"aria-disabled": kt(this.opts.disabled.current),
		"data-disabled": At(this.opts.disabled.current),
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
}, Vr = class t {
	static create(e) {
		let n = new Br(e, Tr.get());
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
		if (!(this.item.opts.disabled.current || t && e.key === " ") && Cn.includes(e.key)) {
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
	#n = j(() => ot(this.item.props, {
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
}, Hr = class t {
	static create(e) {
		let n = Tr.get(), r = new Br(e, n), i = wr.get();
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
		this.item.opts.disabled.current || t && e.key === " " || Dn[this.submenu.root.opts.dir.current].includes(e.key) && (e.currentTarget.click(), e.preventDefault());
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
			e && Dr.dispatch(e);
		}));
	}
	#n = j(() => ot({
		"aria-haspopup": "menu",
		"aria-expanded": kt(this.submenu.opts.open.current),
		"data-state": jt(this.submenu.opts.open.current),
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
}, Ur = class t {
	static create(e, n) {
		let r = new Vr(e, new Br(e, Tr.get()));
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
		"aria-checked": Nt(this.opts.checked.current, this.opts.indeterminate.current),
		"data-state": An(this.opts.checked.current),
		[this.item.root.getBitsAttr("checkbox-item")]: ""
	}));
	get props() {
		return e(this.#t);
	}
	set props(e) {
		x(this.#t, e);
	}
}, Wr = class t {
	static create(e) {
		return new t(e, Cr.get());
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
}, Gr = class t {
	static create(e) {
		return new t(e, wr.get());
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
		"aria-expanded": kt(this.parentMenu.opts.open.current),
		"aria-controls": e(this.#e),
		"data-disabled": At(this.opts.disabled.current),
		"data-state": jt(this.parentMenu.opts.open.current),
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
}, Kr = class {
	static create(e) {
		let t = wr.get();
		return wr.set(new Rr(e, t.root, t));
	}
};
// node_modules/bits-ui/dist/bits/utilities/dismissible-layer/use-dismissable-layer.svelte.js
globalThis.bitsDismissableLayers ??= /* @__PURE__ */ new Map();
var qr = class e {
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
			this.#a = xn(this.opts.ref.current);
		});
		let t = B, n = () => {
			this.#g(), globalThis.bitsDismissableLayers.delete(this), this.#d.destroy(), t();
		};
		F([() => this.opts.enabled.current, () => this.opts.ref.current], () => {
			if (this.opts.enabled.current && this.opts.ref.current) return ht(1, () => {
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
		return Ze(p(this.#a, "pointerdown", Ze(this.#f, this.#m), { capture: !0 }), p(this.#a, "pointerdown", Ze(this.#p, this.#d)), p(this.#a, "focusin", this.#c));
	}
	#u = (e) => {
		let t = e;
		t.defaultPrevented && (t = Zr(e)), this.#e.current(e);
	};
	#d = yn((e) => {
		if (!this.opts.ref.current) {
			this.#s();
			return;
		}
		let t = this.opts.isValidEvent.current(e, this.opts.ref.current) || Xr(e, this.opts.ref.current);
		if (!this.#r || this.#_() || !t) {
			this.#s();
			return;
		}
		let n = e;
		n.defaultPrevented && (n = Zr(n)), this.#t.current !== "close" && this.#t.current !== "defer-otherwise-close" ? this.#s() : e.pointerType === "touch" ? (this.#s(), this.#s = p(this.#a, "click", this.#u, { once: !0 })) : this.#e.current(n);
	}, 10);
	#f = (e) => {
		this.#n[e.type] = !0;
	};
	#p = (e) => {
		this.#n[e.type] = !1;
	};
	#m = () => {
		this.opts.ref.current && (this.#r = Yr(this.opts.ref.current));
	};
	#h = (e) => this.opts.ref.current ? bn(this.opts.ref.current, e) : !1;
	#g = yn(() => {
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
function Jr(e = [...globalThis.bitsDismissableLayers]) {
	return e.findLast(([e, { current: t }]) => t === "close" || t === "ignore");
}
function Yr(e) {
	let t = [...globalThis.bitsDismissableLayers], n = Jr(t);
	if (n) return n[0].opts.ref.current === e;
	let [r] = t[0];
	return r.opts.ref.current === e;
}
function Xr(e, t) {
	let n = e.target;
	if (!en(n)) return !1;
	let r = !!n.closest(`[${xr}]`), i = !!t.closest(`[${Sr}]`);
	return "button" in e && e.button > 0 && !r ? !1 : "button" in e && e.button === 0 && r && i ? !0 : r && i ? !1 : xn(n).documentElement.contains(n) && !bn(t, n) && Sn(e, t);
}
function Zr(e) {
	let t = e.currentTarget, n = e.target, r;
	r = e instanceof PointerEvent ? new PointerEvent(e.type, e) : new PointerEvent("pointerdown", e);
	let i = !1;
	return new Proxy(r, { get: (r, a) => a === "currentTarget" ? t : a === "target" ? n : a === "preventDefault" ? () => {
		i = !0, typeof r.preventDefault == "function" && r.preventDefault();
	} : a === "defaultPrevented" ? i : a in r ? r[a] : e[a] });
}
// node_modules/bits-ui/dist/bits/utilities/dismissible-layer/dismissible-layer.svelte
function Qr(e, i) {
	c(i, !0);
	let a = D(i, "interactOutsideBehavior", 3, "close"), o = D(i, "onInteractOutside", 3, B), s = D(i, "onFocusOutside", 3, B), l = D(i, "isValidEvent", 3, () => !1), d = qr.create({
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
var $r = class e {
	static create(t) {
		return new e(t);
	}
	opts;
	domContext;
	constructor(e) {
		this.opts = e, this.domContext = new Ot(this.opts.ref);
		let t = B;
		F(() => e.enabled.current, (n) => (n && (globalThis.bitsEscapeLayers.set(this, e.escapeKeydownBehavior), t = this.#e()), () => {
			t(), globalThis.bitsEscapeLayers.delete(this);
		}));
	}
	#e = () => p(this.domContext.getDocument(), "keydown", this.#t, { passive: !1 });
	#t = (e) => {
		if (e.key !== "Escape" || !ei(this)) return;
		let t = new KeyboardEvent(e.type, e);
		e.preventDefault();
		let n = this.opts.escapeKeydownBehavior.current;
		(n === "close" || n === "defer-otherwise-close") && this.opts.onEscapeKeydown.current(t);
	};
};
function ei(e) {
	let t = [...globalThis.bitsEscapeLayers], n = t.findLast(([e, { current: t }]) => t === "close" || t === "ignore");
	if (n) return n[0] === e;
	let [r] = t[0];
	return r === e;
}
// node_modules/bits-ui/dist/bits/utilities/escape-layer/escape-layer.svelte
function ti(e, i) {
	c(i, !0);
	let a = D(i, "escapeKeydownBehavior", 3, "close"), o = D(i, "onEscapeKeydown", 3, B);
	$r.create({
		escapeKeydownBehavior: M(() => a()),
		onEscapeKeydown: M(() => o()),
		enabled: M(() => i.enabled),
		ref: i.ref
	});
	var s = f(), l = y(s);
	t(l, () => i.children ?? u), n(e, s), r();
}
// node_modules/bits-ui/dist/bits/utilities/focus-scope/focus-scope-manager.js
var ni = class e {
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
}, ri = class e {
	#e = !1;
	#t = null;
	#n = ni.getInstance();
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
					if (n && e.contains(n) && fr(n)) t.preventDefault(), n.focus();
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
		return this.#t ? cr(this.#t, {
			includeContainer: !1,
			getShadowRoot: !0
		}) : [];
	}
	#u() {
		return this.#l()[0] || null;
	}
	#d() {
		return this.#t ? lr(this.#t, {
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
function ii(e, i) {
	c(i, !0);
	let a = D(i, "enabled", 3, !1), o = D(i, "trapFocus", 3, !1), s = D(i, "loop", 3, !1), l = D(i, "onCloseAutoFocus", 3, B), d = D(i, "onOpenAutoFocus", 3, B), p = ri.use({
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
var ai = () => {};
globalThis.bitsTextSelectionLayers ??= /* @__PURE__ */ new Map();
var oi = class e {
	static create(t) {
		return new e(t);
	}
	opts;
	domContext;
	#e = B;
	#t = !1;
	#n = ai;
	#r = ai;
	constructor(e) {
		this.opts = e, this.domContext = new Ot(e.ref);
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
		return Ze(p(this.domContext.getDocument(), "pointerdown", this.#o), p(this.domContext.getDocument(), "pointerup", _e(this.#s, this.#a)));
	}
	#a = (e) => {
		this.#r(e);
	};
	#o = (e) => {
		let t = this.opts.ref.current, n = e.target;
		z(t) && z(n) && this.#t && ui(this) && wt(t, n) && (this.#n(e), e.defaultPrevented || (this.#e = ci(t, this.domContext.getDocument().body)));
	};
	#s = () => {
		this.#e(), this.#e = B;
	};
}, si = (e) => e.style.userSelect || e.style.webkitUserSelect;
function ci(e, t) {
	let n = si(t), r = si(e);
	return li(t, "none"), li(e, "text"), () => {
		li(t, n), li(e, r);
	};
}
function li(e, t) {
	e.style.userSelect = t, e.style.webkitUserSelect = t;
}
function ui(e) {
	let t = [...globalThis.bitsTextSelectionLayers];
	if (!t.length) return !1;
	let n = t.at(-1);
	return n ? n[0] === e : !1;
}
// node_modules/bits-ui/dist/bits/utilities/text-selection-layer/text-selection-layer.svelte
function di(e, i) {
	c(i, !0);
	let a = D(i, "preventOverflowTextSelection", 3, !0), o = D(i, "onPointerDown", 3, B), s = D(i, "onPointerUp", 3, B);
	oi.create({
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
function fi(e = "bits") {
	return globalThis.bitsIdCounter.current++, `${e}-${globalThis.bitsIdCounter.current}`;
}
// node_modules/bits-ui/dist/internal/shared-state.svelte.js
var pi = class {
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
}, mi = new re(), hi = h(null), gi = null, _i = null, vi = !1, yi = M(() => {
	for (let e of mi.values()) if (e) return !0;
	return !1;
}), bi = null, xi = new pi(() => {
	function t() {
		document.body.setAttribute("style", e(hi) ?? ""), document.body.style.removeProperty("--scrollbar-width"), Zt && gi?.(), x(hi, null);
	}
	function n() {
		_i !== null && (window.clearTimeout(_i), _i = null);
	}
	function r(e, t) {
		n(), vi = !0, bi = Date.now();
		let r = bi, i = () => {
			_i = null, bi === r && (Ci(mi) ? vi = !1 : (vi = !1, t()));
		}, a = e === null ? 24 : e;
		_i = window.setTimeout(i, a);
	}
	function i() {
		e(hi) === null && mi.size === 0 && !vi && x(hi, document.body.getAttribute("style"), !0);
	}
	return F(() => yi.current, () => {
		if (!yi.current) return;
		i(), vi = !1;
		let e = getComputedStyle(document.documentElement), t = getComputedStyle(document.body), n = e.scrollbarGutter?.includes("stable") || t.scrollbarGutter?.includes("stable"), r = window.innerWidth - document.documentElement.clientWidth, a = {
			padding: Number.parseInt(t.paddingRight ?? "0", 10) + r,
			margin: Number.parseInt(t.marginRight ?? "0", 10)
		};
		r > 0 && !n && (document.body.style.paddingRight = `${a.padding}px`, document.body.style.marginRight = `${a.margin}px`, document.body.style.setProperty("--scrollbar-width", `${r}px`)), document.body.style.overflow = "hidden", Zt && (gi = p(document, "touchmove", (e) => {
			e.target === document.documentElement && (e.touches.length > 1 || e.preventDefault());
		}, { passive: !1 })), L(() => {
			document.body.style.pointerEvents = "none", document.body.style.overflow = "hidden";
		});
	}), I(() => () => {
		gi?.();
	}), {
		get lockMap() {
			return mi;
		},
		resetBodyStyle: t,
		scheduleCleanupIfNoNewLocks: r,
		cancelPendingCleanup: n,
		ensureInitialStyleCaptured: i
	};
}), Si = class {
	#e = fi();
	#t;
	#n = () => null;
	#r;
	locked;
	constructor(e, t = () => null) {
		this.#t = e, this.#n = t, this.#r = xi.get(), this.#r && (this.#r.cancelPendingCleanup(), this.#r.ensureInitialStyleCaptured(), this.#r.lockMap.set(this.#e, this.#t ?? !1), this.locked = M(() => this.#r.lockMap.get(this.#e) ?? !1, (e) => this.#r.lockMap.set(this.#e, e)), I(() => {
			if (this.#r.lockMap.delete(this.#e), Ci(this.#r.lockMap)) return;
			let e = this.#n();
			this.#r.scheduleCleanupIfNoNewLocks(e, () => {
				this.#r.resetBodyStyle();
			});
		}));
	}
};
function Ci(e) {
	for (let [t, n] of e) if (n) return !0;
	return !1;
}
// node_modules/bits-ui/dist/bits/utilities/scroll-lock/scroll-lock.svelte
function wi(e, t) {
	c(t, !0);
	let n = D(t, "preventScroll", 3, !0), i = D(t, "restoreScrollDelay", 3, null);
	n() && new Si(n(), () => i()), r();
}
// node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
var Ti = [
	"top",
	"right",
	"bottom",
	"left"
], U = Math.min, W = Math.max, Ei = Math.round, Di = Math.floor, G = (e) => ({
	x: e,
	y: e
}), Oi = {
	left: "right",
	right: "left",
	bottom: "top",
	top: "bottom"
};
function ki(e, t, n) {
	return W(e, U(t, n));
}
function K(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function q(e) {
	return e.split("-")[0];
}
function Ai(e) {
	return e.split("-")[1];
}
function ji(e) {
	return e === "x" ? "y" : "x";
}
function Mi(e) {
	return e === "y" ? "height" : "width";
}
function J(e) {
	let t = e[0];
	return t === "t" || t === "b" ? "y" : "x";
}
function Ni(e) {
	return ji(J(e));
}
function Pi(e, t, n) {
	n === void 0 && (n = !1);
	let r = Ai(e), i = Ni(e), a = Mi(i), o = i === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
	return t.reference[a] > t.floating[a] && (o = Ui(o)), [o, Ui(o)];
}
function Fi(e) {
	let t = Ui(e);
	return [
		Ii(e),
		t,
		Ii(t)
	];
}
function Ii(e) {
	return e.includes("start") ? e.replace("start", "end") : e.replace("end", "start");
}
var Li = ["left", "right"], Ri = ["right", "left"], zi = ["top", "bottom"], Bi = ["bottom", "top"];
function Vi(e, t, n) {
	switch (e) {
		case "top":
		case "bottom": return n ? t ? Ri : Li : t ? Li : Ri;
		case "left":
		case "right": return t ? zi : Bi;
		default: return [];
	}
}
function Hi(e, t, n, r) {
	let i = Ai(e), a = Vi(q(e), n === "start", r);
	return i && (a = a.map((e) => e + "-" + i), t && (a = a.concat(a.map(Ii)))), a;
}
function Ui(e) {
	let t = q(e);
	return Oi[t] + e.slice(t.length);
}
function Wi(e) {
	return {
		top: e.top ?? 0,
		right: e.right ?? 0,
		bottom: e.bottom ?? 0,
		left: e.left ?? 0
	};
}
function Gi(e) {
	return typeof e == "number" ? {
		top: e,
		right: e,
		bottom: e,
		left: e
	} : Wi(e);
}
function Ki(e) {
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
function qi(e, t, n) {
	let { reference: r, floating: i } = e, a = J(t), o = Ni(t), s = Mi(o), c = q(t), l = a === "y", u = r.x + r.width / 2 - i.width / 2, d = r.y + r.height / 2 - i.height / 2, f = r[s] / 2 - i[s] / 2, p;
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
	let m = Ai(t);
	return m && (p[o] += f * (m === "end" ? 1 : -1) * (n && l ? -1 : 1)), p;
}
async function Ji(e, t) {
	t === void 0 && (t = {});
	let { x: n, y: r, platform: i, rects: a, elements: o, strategy: s } = e, { boundary: c = "clippingAncestors", rootBoundary: l = "viewport", elementContext: u = "floating", altBoundary: d = !1, padding: f = 0 } = K(t, e), p = Gi(f), m = o[d ? u === "floating" ? "reference" : "floating" : u], h = Ki(await i.getClippingRect({
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
	}, y = Ki(i.convertOffsetParentRelativeRectToViewportRelativeRect ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
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
var Yi = 50, Xi = async (e, t, n) => {
	let { placement: r = "bottom", strategy: i = "absolute", middleware: a = [], platform: o } = n, s = o.detectOverflow ? o : {
		...o,
		detectOverflow: Ji
	}, c = await (o.isRTL == null ? void 0 : o.isRTL(t)), l = await o.getElementRects({
		reference: e,
		floating: t,
		strategy: i
	}), { x: u, y: d } = qi(l, r, c), f = r, p = 0, m = {};
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
		}, x && p < Yi && (p++, typeof x == "object" && (x.placement && (f = x.placement), x.rects && (l = x.rects === !0 ? await o.getElementRects({
			reference: e,
			floating: t,
			strategy: i
		}) : x.rects), {x: u, y: d} = qi(l, f, c)), n = -1);
	}
	return {
		x: u,
		y: d,
		placement: f,
		strategy: i,
		middlewareData: m
	};
}, Zi = (e) => ({
	name: "arrow",
	options: e,
	async fn(t) {
		let { x: n, y: r, placement: i, rects: a, platform: o, elements: s, middlewareData: c } = t, { element: l, padding: u = 0 } = K(e, t) || {};
		if (l == null) return {};
		let d = Gi(u), f = {
			x: n,
			y: r
		}, p = Ni(i), m = Mi(p), h = await o.getDimensions(l), g = p === "y", _ = g ? "top" : "left", v = g ? "bottom" : "right", y = g ? "clientHeight" : "clientWidth", b = a.reference[m] + a.reference[p] - f[p] - a.floating[m], x = f[p] - a.reference[p], S = await (o.getOffsetParent == null ? void 0 : o.getOffsetParent(l)), C = S ? S[y] : 0;
		C && await (o.isElement == null ? void 0 : o.isElement(S)) || (C = s.floating[y] || a.floating[m]);
		let w = b / 2 - x / 2, T = C / 2 - h[m] / 2 - 1, E = U(d[_], T), D = U(d[v], T), O = C - h[m] - D, k = C / 2 - h[m] / 2 + w, A = ki(E, k, O), ee = !c.arrow && Ai(i) != null && k !== A && a.reference[m] / 2 - (k < E ? E : D) - h[m] / 2 < 0, te = ee ? k < E ? k - E : k - O : 0;
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
}), Qi = function(e) {
	return e === void 0 && (e = {}), {
		name: "flip",
		options: e,
		async fn(t) {
			var n;
			let { placement: r, middlewareData: i, rects: a, initialPlacement: o, platform: s, elements: c } = t, { mainAxis: l = !0, crossAxis: u = !0, fallbackPlacements: d, fallbackStrategy: f = "bestFit", fallbackAxisSideDirection: p = "none", flipAlignment: m = !0, ...h } = K(e, t);
			if ((n = i.arrow) != null && n.alignmentOffset) return {};
			let g = q(r), _ = J(o), v = q(o) === o, y = await (s.isRTL == null ? void 0 : s.isRTL(c.floating)), b = d || (v || !m ? [Ui(o)] : Fi(o)), x = p !== "none";
			!d && x && b.push(...Hi(o, m, p, y));
			let S = [o, ...b], C = await s.detectOverflow(t, h), w = [], T = i.flip?.overflows || [];
			if (l && w.push(C[g]), u) {
				let e = Pi(r, a, y);
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
function $i(e, t) {
	return {
		top: e.top - t.height,
		right: e.right - t.width,
		bottom: e.bottom - t.height,
		left: e.left - t.width
	};
}
function ea(e) {
	return Ti.some((t) => e[t] >= 0);
}
var ta = function(e) {
	return e === void 0 && (e = {}), {
		name: "hide",
		options: e,
		async fn(t) {
			let { rects: n, platform: r } = t, { strategy: i = "referenceHidden", ...a } = K(e, t);
			switch (i) {
				case "referenceHidden": {
					let e = $i(await r.detectOverflow(t, {
						...a,
						elementContext: "reference"
					}), n.reference);
					return { data: {
						referenceHiddenOffsets: e,
						referenceHidden: ea(e)
					} };
				}
				case "escaped": {
					let e = $i(await r.detectOverflow(t, {
						...a,
						altBoundary: !0
					}), n.floating);
					return { data: {
						escapedOffsets: e,
						escaped: ea(e)
					} };
				}
				default: return {};
			}
		}
	};
}, na = /*#__PURE__*/ new Set(["left", "top"]);
async function ra(e, t) {
	let { placement: n, platform: r, elements: i } = e, a = await (r.isRTL == null ? void 0 : r.isRTL(i.floating)), o = q(n), s = Ai(n), c = J(n) === "y", l = na.has(o) ? -1 : 1, u = a && c ? -1 : 1, d = K(t, e), { mainAxis: f, crossAxis: p, alignmentAxis: m } = typeof d == "number" ? {
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
var ia = function(e) {
	return e === void 0 && (e = 0), {
		name: "offset",
		options: e,
		async fn(t) {
			var n;
			let { x: r, y: i, placement: a, middlewareData: o } = t, s = await ra(t, e);
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
}, aa = function(e) {
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
			}, d = await a.detectOverflow(t, l), f = J(i), p = ji(f), m = u[p], h = u[f], g = (e, t) => ki(t + d[e === "y" ? "top" : "left"], t, t - d[e === "y" ? "bottom" : "right"]);
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
}, oa = function(e) {
	return e === void 0 && (e = {}), {
		options: e,
		fn(t) {
			let { x: n, y: r, placement: i, rects: a, middlewareData: o } = t, { offset: s = 0, mainAxis: c = !0, crossAxis: l = !0 } = K(e, t), u = {
				x: n,
				y: r
			}, d = J(i), f = ji(d), p = u[f], m = u[d], h = K(s, t), g = typeof h == "number" ? {
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
				let e = f === "y" ? "width" : "height", t = na.has(q(i)), n = a.reference[d] - a.floating[e] + (t && o.offset?.[d] || 0) + (t ? 0 : g.crossAxis), r = a.reference[d] + a.reference[e] + (t ? 0 : o.offset?.[d] || 0) - (t ? g.crossAxis : 0);
				m < n ? m = n : m > r && (m = r);
			}
			return {
				[f]: p,
				[d]: m
			};
		}
	};
}, sa = function(e) {
	return e === void 0 && (e = {}), {
		name: "size",
		options: e,
		async fn(t) {
			let { placement: n, rects: r, platform: i, elements: a } = t, { apply: o = () => {}, ...s } = K(e, t), c = await i.detectOverflow(t, s), l = q(n), u = Ai(n), d = J(n) === "y", { width: f, height: p } = r.floating, m, h;
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
function ca() {
	return typeof window < "u";
}
function la(e) {
	return ua(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function Y(e) {
	var t;
	return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function X(e) {
	return ((ua(e) ? e.ownerDocument : e.document) || window.document)?.documentElement;
}
function ua(e) {
	return ca() ? e instanceof Node || e instanceof Y(e).Node : !1;
}
function Z(e) {
	return ca() ? e instanceof Element || e instanceof Y(e).Element : !1;
}
function Q(e) {
	return ca() ? e instanceof HTMLElement || e instanceof Y(e).HTMLElement : !1;
}
function da(e) {
	return !ca() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof Y(e).ShadowRoot;
}
function fa(e) {
	let { overflow: t, overflowX: n, overflowY: r, display: i } = $(e);
	return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && i !== "inline" && i !== "contents";
}
function pa(e) {
	return /^(table|td|th)$/.test(la(e));
}
function ma(e) {
	try {
		if (e.matches(":popover-open")) return !0;
	} catch {}
	try {
		return e.matches(":modal");
	} catch {
		return !1;
	}
}
var ha = /transform|translate|scale|rotate|perspective|filter/, ga = /paint|layout|strict|content/, _a = (e) => !!e && e !== "none", va;
function ya(e) {
	let t = Z(e) ? $(e) : e;
	return _a(t.transform) || _a(t.translate) || _a(t.scale) || _a(t.rotate) || _a(t.perspective) || !xa() && (_a(t.backdropFilter) || _a(t.filter)) || ha.test(t.willChange || "") || ga.test(t.contain || "");
}
function ba(e) {
	let t = wa(e);
	for (; Q(t) && !Sa(t);) {
		if (ya(t)) return t;
		if (ma(t)) return null;
		t = wa(t);
	}
	return null;
}
function xa() {
	return va ??= typeof CSS < "u" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none"), va;
}
function Sa(e) {
	return /^(html|body|#document)$/.test(la(e));
}
function $(e) {
	return Y(e).getComputedStyle(e);
}
function Ca(e) {
	return Z(e) ? {
		scrollLeft: e.scrollLeft,
		scrollTop: e.scrollTop
	} : {
		scrollLeft: e.scrollX,
		scrollTop: e.scrollY
	};
}
function wa(e) {
	if (la(e) === "html") return e;
	let t = e.assignedSlot || e.parentNode || da(e) && e.host || X(e);
	return da(t) ? t.host : t;
}
function Ta(e) {
	let t = wa(e);
	return Sa(t) ? (e.ownerDocument || e).body : Q(t) && fa(t) ? t : Ta(t);
}
function Ea(e, t, n) {
	t === void 0 && (t = []), n === void 0 && (n = !0);
	let r = Ta(e), i = r === e.ownerDocument?.body, a = Y(r);
	if (i) {
		let e = Da(a);
		return t.concat(a, a.visualViewport || [], fa(r) ? r : [], e && n ? Ea(e) : []);
	}
	return t.concat(r, Ea(r, [], n));
}
function Da(e) {
	return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
// node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function Oa(e) {
	let t = $(e), n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0, i = Q(e), a = i ? e.offsetWidth : n, o = i ? e.offsetHeight : r, s = Ei(n) !== a || Ei(r) !== o;
	return s && (n = a, r = o), {
		width: n,
		height: r,
		$: s
	};
}
function ka(e) {
	return Z(e) ? e : e.contextElement;
}
function Aa(e) {
	let t = ka(e);
	if (!Q(t)) return G(1);
	let n = t.getBoundingClientRect(), { width: r, height: i, $: a } = Oa(t), o = (a ? Ei(n.width) : n.width) / r, s = (a ? Ei(n.height) : n.height) / i;
	return o && Number.isFinite(o) || (o = 1), s && Number.isFinite(s) || (s = 1), {
		x: o,
		y: s
	};
}
var ja = /*#__PURE__*/ G(0);
function Ma(e) {
	let t = Y(e);
	return !xa() || !t.visualViewport ? ja : {
		x: t.visualViewport.offsetLeft,
		y: t.visualViewport.offsetTop
	};
}
function Na(e, t, n) {
	return t === void 0 && (t = !1), !!n && t && n === Y(e);
}
function Pa(e, t, n, r) {
	t === void 0 && (t = !1), n === void 0 && (n = !1);
	let i = e.getBoundingClientRect(), a = ka(e), o = G(1);
	t && (r ? Z(r) && (o = Aa(r)) : o = Aa(e));
	let s = Na(a, n, r) ? Ma(a) : G(0), c = (i.left + s.x) / o.x, l = (i.top + s.y) / o.y, u = i.width / o.x, d = i.height / o.y;
	if (a && r) {
		let e = Y(a), t = Z(r) ? Y(r) : r, n = e, i = Da(n);
		for (; i && t !== n;) {
			let e = Aa(i), t = i.getBoundingClientRect(), r = $(i), a = t.left + (i.clientLeft + parseFloat(r.paddingLeft)) * e.x, o = t.top + (i.clientTop + parseFloat(r.paddingTop)) * e.y;
			c *= e.x, l *= e.y, u *= e.x, d *= e.y, c += a, l += o, n = Y(i), i = Da(n);
		}
	}
	return Ki({
		width: u,
		height: d,
		x: c,
		y: l
	});
}
function Fa(e, t) {
	let n = Ca(e).scrollLeft;
	return t ? t.left + n : Pa(X(e)).left + n;
}
function Ia(e, t) {
	let n = e.getBoundingClientRect();
	return {
		x: n.left + t.scrollLeft - Fa(e, n),
		y: n.top + t.scrollTop
	};
}
function La(e) {
	let { elements: t, rect: n, offsetParent: r, strategy: i } = e, a = i === "fixed", o = X(r), s = t ? ma(t.floating) : !1;
	if (r === o || s && a) return n;
	let c = {
		scrollLeft: 0,
		scrollTop: 0
	}, l = G(1), u = G(0), d = Q(r);
	if ((d || !a) && ((la(r) !== "body" || fa(o)) && (c = Ca(r)), d)) {
		let e = Pa(r);
		l = Aa(r), u.x = e.x + r.clientLeft, u.y = e.y + r.clientTop;
	}
	let f = o && !d && !a ? Ia(o, c) : G(0);
	return {
		width: n.width * l.x,
		height: n.height * l.y,
		x: n.x * l.x - c.scrollLeft * l.x + u.x + f.x,
		y: n.y * l.y - c.scrollTop * l.y + u.y + f.y
	};
}
function Ra(e) {
	return e.getClientRects ? Array.from(e.getClientRects()) : [];
}
function za(e) {
	let t = Ca(e), n = e.ownerDocument.body, r = W(e.scrollWidth, e.clientWidth, n.scrollWidth, n.clientWidth), i = W(e.scrollHeight, e.clientHeight, n.scrollHeight, n.clientHeight), a = -t.scrollLeft + Fa(e), o = -t.scrollTop;
	return $(n).direction === "rtl" && (a += W(e.clientWidth, n.clientWidth) - r), {
		width: r,
		height: i,
		x: a,
		y: o
	};
}
var Ba = 25;
function Va(e, t, n) {
	n === void 0 && (n = "viewport");
	let r = n === "layoutViewport", i = Y(e), a = X(e), o = i.visualViewport, s = a.clientWidth, c = a.clientHeight, l = 0, u = 0;
	if (o) {
		let e = !xa() || t === "fixed";
		r ? e || (l = -o.offsetLeft, u = -o.offsetTop) : (s = o.width, c = o.height, e && (l = o.offsetLeft, u = o.offsetTop));
	}
	if (Fa(a) <= 0) {
		let e = a.ownerDocument, t = e.body, n = getComputedStyle(t), r = e.compatMode === "CSS1Compat" && parseFloat(n.marginLeft) + parseFloat(n.marginRight) || 0, i = Math.abs(a.clientWidth - t.clientWidth - r), o = getComputedStyle(a).scrollbarGutter === "stable both-edges" ? i / 2 : i;
		o <= Ba && (s -= o);
	}
	return {
		width: s,
		height: c,
		x: l,
		y: u
	};
}
function Ha(e, t) {
	let n = Pa(e, !0, t === "fixed"), r = n.top + e.clientTop, i = n.left + e.clientLeft, a = Aa(e);
	return {
		width: e.clientWidth * a.x,
		height: e.clientHeight * a.y,
		x: i * a.x,
		y: r * a.y
	};
}
function Ua(e, t, n) {
	let r;
	if (t === "viewport" || t === "layoutViewport") r = Va(e, n, t);
	else if (t === "document") r = za(X(e));
	else if (Z(t)) r = Ha(t, n);
	else {
		let n = Ma(e);
		r = {
			x: t.x - n.x,
			y: t.y - n.y,
			width: t.width,
			height: t.height
		};
	}
	return Ki(r);
}
function Wa(e, t) {
	let n = t.get(e);
	if (n) return n;
	let r = Ea(e, [], !1).filter((e) => Z(e) && la(e) !== "body"), i = null, a = $(e).position === "fixed", o = a ? wa(e) : e;
	for (; Z(o) && !Sa(o);) {
		let e = $(o), t = ya(o), n = i ? i.position : a ? "fixed" : "";
		!t && (n === "fixed" || n === "absolute" && e.position === "static") ? r = r.filter((e) => e !== o) : i = e, o = wa(o);
	}
	return t.set(e, r), r;
}
function Ga(e) {
	let { element: t, boundary: n, rootBoundary: r, strategy: i } = e, a = [...n === "clippingAncestors" ? ma(t) ? [] : Wa(t, this._c) : [].concat(n), r], o = Ua(t, a[0], i), s = o.top, c = o.right, l = o.bottom, u = o.left;
	for (let e = 1; e < a.length; e++) {
		let n = Ua(t, a[e], i);
		s = W(n.top, s), c = U(n.right, c), l = U(n.bottom, l), u = W(n.left, u);
	}
	return {
		width: c - u,
		height: l - s,
		x: u,
		y: s
	};
}
function Ka(e) {
	let { width: t, height: n } = Oa(e);
	return {
		width: t,
		height: n
	};
}
function qa(e, t, n) {
	let r = Q(t), i = X(t), a = n === "fixed", o = Pa(e, !0, a, t), s = {
		scrollLeft: 0,
		scrollTop: 0
	}, c = G(0);
	if ((r || !a) && ((la(t) !== "body" || fa(i)) && (s = Ca(t)), r)) {
		let e = Pa(t, !0, a, t);
		c.x = e.x + t.clientLeft, c.y = e.y + t.clientTop;
	}
	!r && i && (c.x = Fa(i));
	let l = i && !r && !a ? Ia(i, s) : G(0);
	return {
		x: o.left + s.scrollLeft - c.x - l.x,
		y: o.top + s.scrollTop - c.y - l.y,
		width: o.width,
		height: o.height
	};
}
function Ja(e) {
	return $(e).position === "static";
}
function Ya(e, t) {
	if (!Q(e) || $(e).position === "fixed") return null;
	if (t) return t(e);
	let n = e.offsetParent;
	return X(e) === n && (n = n.ownerDocument.body), n;
}
function Xa(e, t) {
	let n = Y(e);
	if (ma(e)) return n;
	if (!Q(e)) {
		let t = wa(e);
		for (; t && !Sa(t);) {
			if (Z(t) && !Ja(t)) return t;
			t = wa(t);
		}
		return n;
	}
	let r = Ya(e, t);
	for (; r && pa(r) && Ja(r);) r = Ya(r, t);
	return r && Sa(r) && Ja(r) && !ya(r) ? n : r || ba(e) || n;
}
var Za = async function(e) {
	let t = this.getOffsetParent || Xa, n = this.getDimensions, r = await n(e.floating);
	return {
		reference: qa(e.reference, await t(e.floating), e.strategy),
		floating: {
			x: 0,
			y: 0,
			width: r.width,
			height: r.height
		}
	};
};
function Qa(e) {
	return $(e).direction === "rtl";
}
var $a = {
	convertOffsetParentRelativeRectToViewportRelativeRect: La,
	getDocumentElement: X,
	getClippingRect: Ga,
	getOffsetParent: Xa,
	getElementRects: Za,
	getClientRects: Ra,
	getDimensions: Ka,
	getScale: Aa,
	isElement: Z,
	isRTL: Qa
};
function eo(e, t) {
	return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function to(e, t, n) {
	let r = null, i, a = X(e);
	function o() {
		var e;
		clearTimeout(i), (e = r) == null || e.disconnect(), r = null;
	}
	function s(n, c) {
		n === void 0 && (n = !1), c === void 0 && (c = 1), o();
		let l = e.getBoundingClientRect(), { left: u, top: d, width: f, height: p } = l;
		if (n || t(), !f || !p) return;
		let m = Di(d), h = Di(a.clientWidth - (u + f)), g = Di(a.clientHeight - (d + p)), _ = Di(u), v = {
			rootMargin: -m + "px " + -h + "px " + -g + "px " + -_ + "px",
			threshold: W(0, U(1, c)) || 1
		}, y = !0;
		function b(t) {
			let n = t[0].intersectionRatio;
			if (!eo(l, e.getBoundingClientRect())) return s();
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
function no(e, t, n, r) {
	r === void 0 && (r = {});
	let { ancestorScroll: i = !0, ancestorResize: a = !0, elementResize: o = typeof ResizeObserver == "function", layoutShift: s = typeof IntersectionObserver == "function", animationFrame: c = !1 } = r, l = ka(e), u = i || a ? [...l ? Ea(l) : [], ...t ? Ea(t) : []] : [];
	u.forEach((e) => {
		i && e.addEventListener("scroll", n), a && e.addEventListener("resize", n);
	});
	let d = l && s ? to(l, n, a) : null, f = -1, p = null;
	o && (p = new ResizeObserver((e) => {
		let [r] = e;
		r && r.target === l && p && t && (p.unobserve(t), cancelAnimationFrame(f), f = requestAnimationFrame(() => {
			var e;
			(e = p) == null || e.observe(t);
		})), n();
	}), l && !c && p.observe(l), t && p.observe(t));
	let m, h = c ? Pa(e) : null;
	c && g();
	function g() {
		let t = Pa(e);
		h && !eo(h, t) && n(), h = t, m = requestAnimationFrame(g);
	}
	return n(), () => {
		var e;
		u.forEach((e) => {
			i && e.removeEventListener("scroll", n), a && e.removeEventListener("resize", n);
		}), d?.(), (e = p) == null || e.disconnect(), p = null, c && cancelAnimationFrame(m);
	};
}
var ro = ia, io = aa, ao = Qi, oo = sa, so = ta, co = Zi, lo = oa, uo = (e, t, n) => {
	let r = /* @__PURE__ */ new Map(), i = n ?? {}, a = {
		...$a,
		...i.platform,
		_c: r
	};
	return Xi(e, t, {
		...i,
		platform: a
	});
};
// node_modules/bits-ui/dist/internal/floating-svelte/floating-utils.svelte.js
function fo(e) {
	return typeof e == "function" ? e() : e;
}
function po(e) {
	return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function mo(e, t) {
	let n = po(e);
	return Math.round(t * n) / n;
}
function ho(e) {
	return {
		[`--bits-${e}-content-transform-origin`]: "var(--bits-floating-transform-origin)",
		[`--bits-${e}-content-available-width`]: "var(--bits-floating-available-width)",
		[`--bits-${e}-content-available-height`]: "var(--bits-floating-available-height)",
		[`--bits-${e}-anchor-width`]: "var(--bits-floating-anchor-width)",
		[`--bits-${e}-anchor-height`]: "var(--bits-floating-anchor-height)"
	};
}
// node_modules/bits-ui/dist/internal/floating-svelte/use-floating.svelte.js
function go(t) {
	let n = t.whileElementsMounted, r = j(() => fo(t.open) ?? !0), i = j(() => fo(t.middleware)), a = j(() => fo(t.transform) ?? !0), o = j(() => fo(t.placement) ?? "bottom"), s = j(() => fo(t.strategy) ?? "absolute"), c = j(() => fo(t.sideOffset) ?? 0), l = j(() => fo(t.alignOffset) ?? 0), u = t.reference, d = h(0), f = h(0), p = N(null), m = h(E(e(s))), g = h(E(e(o))), _ = h(E({})), v = h(!1), y = !1, b = 0, S = j(() => {
		let t = p.current ? mo(p.current, e(d)) : e(d), n = p.current ? mo(p.current, e(f)) : e(f);
		return e(a) ? {
			position: e(m),
			left: "0",
			top: "0",
			transform: `translate(${t}px, ${n}px)`,
			...p.current && po(p.current) >= 1.5 && { willChange: "transform" }
		} : {
			position: e(m),
			left: `${t}px`,
			top: `${n}px`
		};
	}), C;
	function w() {
		if (u.current === null || p.current === null) return;
		let t = u.current, n = p.current, a = ++b;
		uo(t, n, {
			middleware: e(i),
			placement: e(o),
			strategy: e(s)
		}).then((i) => {
			if (a === b && u.current === t && p.current === n) {
				if (_o(t)) x(_, {
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
function _o(e) {
	return e instanceof Element ? !e.isConnected || e instanceof HTMLElement && e.hidden ? !0 : e.getClientRects().length === 0 : !1;
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/use-floating-layer.svelte.js
var vo = {
	top: "bottom",
	right: "left",
	bottom: "top",
	left: "right"
}, yo = new P("Floating.Root"), bo = new P("Floating.Content"), xo = new P("Floating.Root"), So = class e {
	static create(t = !1) {
		return t ? xo.set(new e()) : yo.set(new e());
	}
	anchorNode = N(null);
	customAnchorNode = N(null);
	triggerNode = N(null);
	constructor() {
		O(() => {
			this.customAnchorNode.current ? typeof this.customAnchorNode.current == "string" ? this.anchorNode.current = document.querySelector(this.customAnchorNode.current) : this.anchorNode.current = this.customAnchorNode.current : this.anchorNode.current = this.triggerNode.current;
		});
	}
}, Co = class t {
	static create(e, n = !1) {
		return n ? bo.set(new t(e, xo.get())) : bo.set(new t(e, yo.get()));
	}
	opts;
	root;
	contentRef = N(null);
	wrapperRef = N(null);
	arrowRef = N(null);
	contentAttachment = R(this.contentRef);
	wrapperAttachment = R(this.wrapperRef);
	arrowAttachment = R(this.arrowRef);
	arrowId = N(fi());
	#e = j(() => {
		if (typeof this.opts.style == "string") return Xe(this.opts.style);
		if (!this.opts.style) return {};
	});
	#t = void 0;
	#n = new mt(() => this.arrowRef.current ?? void 0);
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
		boundary: e(this.#o).filter(nn),
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
		ro({
			mainAxis: this.opts.sideOffset.current + e(this.#i),
			alignmentAxis: this.opts.alignOffset.current
		}),
		this.opts.avoidCollisions.current && io({
			mainAxis: !0,
			crossAxis: !1,
			limiter: this.opts.sticky.current === "partial" ? lo() : void 0,
			...this.detectOverflowOptions
		}),
		this.opts.avoidCollisions.current && ao({ ...this.detectOverflowOptions }),
		oo({
			...this.detectOverflowOptions,
			apply: ({ rects: e, availableWidth: t, availableHeight: n }) => {
				let { width: r, height: i } = e.reference;
				x(this.#l, t, !0), x(this.#u, n, !0), x(this.#d, r, !0), x(this.#f, i, !0);
			}
		}),
		this.arrowRef.current && co({
			element: this.arrowRef.current,
			padding: this.opts.arrowPadding.current
		}),
		To({
			arrowWidth: e(this.#r),
			arrowHeight: e(this.#i)
		}),
		this.opts.hideWhenDetached.current && so({
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
	#m = j(() => Do(this.floating.placement));
	get placedSide() {
		return e(this.#m);
	}
	set placedSide(e) {
		x(this.#m, e);
	}
	#h = j(() => Oo(this.floating.placement));
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
	#b = j(() => vo[this.placedSide]);
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
		style: rt({ ...e(this.#e) }),
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
		}), this.floating = go({
			strategy: () => this.opts.strategy.current,
			placement: () => e(this.#a),
			middleware: () => this.middleware,
			reference: this.root.anchorNode,
			whileElementsMounted: (...e) => no(...e, { animationFrame: this.#t?.current === "always" }),
			open: () => this.opts.enabled.current,
			sideOffset: () => this.opts.sideOffset.current,
			alignOffset: () => this.opts.alignOffset.current
		}), O(() => {
			this.floating.isPositioned && this.opts.onPlaced?.current();
		}), F(() => this.contentRef.current, (e) => {
			if (!e || !this.opts.enabled.current) return;
			let t = Et(e), n = t.requestAnimationFrame(() => {
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
}, wo = class e {
	static create(t, n = !1) {
		return n ? new e(t, xo.get()) : new e(t, yo.get());
	}
	opts;
	root;
	constructor(e, t) {
		this.opts = e, this.root = t, t.triggerNode = e.virtualEl && e.virtualEl.current ? pe(e.virtualEl.current) : e.ref;
	}
};
function To(e) {
	return {
		name: "transformOrigin",
		options: e,
		fn(t) {
			let { placement: n, rects: r, middlewareData: i } = t, a = i.arrow?.centerOffset !== 0, o = a ? 0 : e.arrowWidth, s = a ? 0 : e.arrowHeight, [c, l] = Eo(n), u = {
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
function Eo(e) {
	let [t, n = "center"] = e.split("-");
	return [t, n];
}
function Do(e) {
	return Eo(e)[0];
}
function Oo(e) {
	return Eo(e)[1];
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer.svelte
function ko(e, i) {
	c(i, !0);
	let a = D(i, "tooltip", 3, !1);
	So.create(a());
	var o = f(), s = y(o);
	t(s, () => i.children ?? u), n(e, o), r();
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-anchor.svelte
function Ao(e, i) {
	c(i, !0);
	let a = D(i, "tooltip", 3, !1);
	wo.create({
		id: M(() => i.id),
		virtualEl: M(() => i.virtualEl),
		ref: i.ref
	}, a());
	var o = f(), s = y(o);
	t(s, () => i.children ?? u), n(e, o), r();
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-content.svelte
function jo(i, a) {
	c(a, !0);
	let o = D(a, "side", 3, "bottom"), s = D(a, "sideOffset", 3, 0), l = D(a, "align", 3, "center"), d = D(a, "alignOffset", 3, 0), p = D(a, "arrowPadding", 3, 0), m = D(a, "avoidCollisions", 3, !0), h = D(a, "collisionBoundary", 19, () => []), g = D(a, "collisionPadding", 3, 0), _ = D(a, "hideWhenDetached", 3, !1), v = D(a, "onPlaced", 3, () => {}), b = D(a, "sticky", 3, "partial"), x = D(a, "updatePositionStrategy", 3, "optimized"), S = D(a, "strategy", 3, "fixed"), C = D(a, "dir", 3, "ltr"), w = D(a, "style", 19, () => ({})), T = D(a, "wrapperId", 19, fi), E = D(a, "customAnchor", 3, null), O = D(a, "tooltip", 3, !1), k = Co.create({
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
	}, O()), A = j(() => ot(k.wrapperProps, { style: { pointerEvents: "auto" } }));
	var ee = f(), te = y(ee);
	t(te, () => a.content ?? u, () => ({
		props: k.props,
		wrapperProps: e(A)
	})), n(i, ee), r();
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-content-static.svelte
function Mo(e, i) {
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
var No = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"content",
	"isStatic",
	"onPlaced"
]);
function Po(e, t) {
	let r = D(t, "isStatic", 3, !1), i = S(t, No);
	var o = f(), s = y(o), c = (e) => {
		Mo(e, {
			get content() {
				return t.content;
			},
			get onPlaced() {
				return t.onPlaced;
			}
		});
	}, l = (e) => {
		jo(e, g({
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
var Fo = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.popper.onEscapeKeydown.escapeKeydownBehavior.preventOverflowTextSelection.id.onPointerDown.onPointerUp.side.sideOffset.align.alignOffset.arrowPadding.avoidCollisions.collisionBoundary.collisionPadding.sticky.hideWhenDetached.updatePositionStrategy.strategy.dir.preventScroll.wrapperId.style.onPlaced.onInteractOutside.onCloseAutoFocus.onOpenAutoFocus.onFocusOutside.interactOutsideBehavior.loop.trapFocus.isValidEvent.customAnchor.isStatic.enabled.ref.tooltip.contentPointerEvents".split(".")), Io = o("<!> <!>", 1);
function Lo(i, o) {
	c(o, !0);
	let s = D(o, "interactOutsideBehavior", 3, "close"), l = D(o, "trapFocus", 3, !0), d = D(o, "isValidEvent", 3, () => !1), p = D(o, "customAnchor", 3, null), m = D(o, "isStatic", 3, !1), h = D(o, "tooltip", 3, !1), g = D(o, "contentPointerEvents", 3, "auto"), _ = S(o, Fo), v = j(() => o.preventScroll ?? !0), x = j(() => o.strategy ?? (e(v) ? "fixed" : "absolute"));
	Po(i, {
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
			var m = Io(), h = y(m), x = (t) => {
				wi(t, { get preventScroll() {
					return e(v);
				} });
			}, S = (t) => {
				wi(t, { get preventScroll() {
					return e(v);
				} });
			};
			a(h, (e) => {
				o.forceMount && o.enabled ? e(x) : o.forceMount || e(S, 1);
			}), ii(b(h, 2), {
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
					ti(r, {
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
							Qr(r, {
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
									di(r, {
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
													props: ot(_, c(), s(), a(), { style: { pointerEvents: g() } }),
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
var Ro = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.popper.open.onEscapeKeydown.escapeKeydownBehavior.preventOverflowTextSelection.id.onPointerDown.onPointerUp.side.sideOffset.align.alignOffset.arrowPadding.avoidCollisions.collisionBoundary.collisionPadding.sticky.hideWhenDetached.updatePositionStrategy.strategy.dir.preventScroll.wrapperId.style.onPlaced.onInteractOutside.onCloseAutoFocus.onOpenAutoFocus.onFocusOutside.interactOutsideBehavior.loop.trapFocus.isValidEvent.customAnchor.isStatic.ref.shouldRender".split("."));
function zo(e, t) {
	let r = D(t, "interactOutsideBehavior", 3, "close"), i = D(t, "trapFocus", 3, !0), o = D(t, "isValidEvent", 3, () => !1), s = D(t, "customAnchor", 3, null), c = D(t, "isStatic", 3, !1), l = S(t, Ro);
	var u = f(), d = y(u), p = (e) => {
		Lo(e, g({
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
var Bo = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.popper.onEscapeKeydown.escapeKeydownBehavior.preventOverflowTextSelection.id.onPointerDown.onPointerUp.side.sideOffset.align.alignOffset.arrowPadding.avoidCollisions.collisionBoundary.collisionPadding.sticky.hideWhenDetached.updatePositionStrategy.strategy.dir.preventScroll.wrapperId.style.onPlaced.onInteractOutside.onCloseAutoFocus.onOpenAutoFocus.onFocusOutside.interactOutsideBehavior.loop.trapFocus.isValidEvent.customAnchor.isStatic.enabled".split("."));
function Vo(e, t) {
	let n = D(t, "interactOutsideBehavior", 3, "close"), r = D(t, "trapFocus", 3, !0), i = D(t, "isValidEvent", 3, () => !1), a = D(t, "customAnchor", 3, null), o = D(t, "isStatic", 3, !1), s = S(t, Bo);
	Lo(e, g({
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
export { jt as A, sn as C, Bt as D, tn as E, F, P as I, ot as L, R as M, Ot as N, kt as O, Tt as P, M as R, B as S, z as T, ur as _, ho as a, fn as b, Ur as c, Rr as d, Dr as f, Kr as g, Hr as h, ko as i, Mt as j, Ft as k, zr as l, Wr as m, zo as n, Gr as o, Lr as p, Ao as r, Er as s, Vo as t, Vr as u, On as v, $t as w, cn as x, _n as y, ie as z };
