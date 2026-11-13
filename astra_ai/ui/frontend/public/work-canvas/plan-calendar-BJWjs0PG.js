import { $ as e, A as t, B as n, Ct as r, Dt as i, Et as a, F as o, H as s, It as c, L as l, Nt as u, P as d, Q as f, St as p, Tt as m, V as h, W as g, Y as _, Z as v, _t as y, a as b, at as x, ct as S, dt as C, et as w, ht as T, i as E, lt as D, n as ee, ot as O, p as k, pt as A, r as j, rt as te, ut as ne, w as re, wt as ie, yt as ae, z as oe } from "./index-client-oI5R0J23.js";
import "./disclose-version-DFvUDwEH.js";
import { n as se } from "./index-client-zcLcgEWT.js";
// node_modules/svelte-toolbelt/dist/utils/is.js
function ce(e) {
	return typeof e == "function";
}
function le(e) {
	return typeof e == "object" && !!e;
}
var ue = [
	"string",
	"number",
	"bigint",
	"boolean"
];
function de(e) {
	return e == null || ue.includes(typeof e) ? !0 : Array.isArray(e) ? e.every((e) => de(e)) : typeof e == "object" && Object.getPrototypeOf(e) === Object.prototype;
}
// node_modules/svelte-toolbelt/dist/box/box-extras.svelte.js
var fe = Symbol("box"), pe = Symbol("is-writable");
function M(e, t) {
	let n = y(e);
	return t ? {
		[fe]: !0,
		[pe]: !0,
		get current() {
			return f(n);
		},
		set current(e) {
			t(e);
		}
	} : {
		[fe]: !0,
		get current() {
			return e();
		}
	};
}
function me(e) {
	return le(e) && fe in e;
}
function he(e) {
	return me(e) ? e : ce(e) ? M(e) : N(e);
}
function N(e) {
	let t = T(C(e));
	return {
		[fe]: !0,
		[pe]: !0,
		get current() {
			return f(t);
		},
		set current(e) {
			A(t, e, !0);
		}
	};
}
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
var _e = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g, ve = /\n/g, ye = /^\s*/, be = /^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/, xe = /^:\s*/, Se = /^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/, Ce = /^[;\s]*/, we = /^\s+|\s+$/g, Te = "\n", Ee = "/", De = "*", P = "", Oe = "comment", ke = "declaration";
function Ae(e, t) {
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
			for (var n = 2; P != e.charAt(n) && (De != e.charAt(n) || Ee != e.charAt(n + 1));) ++n;
			if (n += 2, P === e.charAt(n - 1)) return s("End of comment missing");
			var o = e.slice(2, n - 2);
			return r += 2, i(o), e = e.slice(n), r += 2, t({
				type: Oe,
				comment: o
			});
		}
	}
	function f() {
		var e = a(), t = c(be);
		if (t) {
			if (d(), !c(xe)) return s("property missing ':'");
			var n = c(Se), r = e({
				type: ke,
				property: je(t[0].replace(_e, P)),
				value: n ? je(n[0].replace(_e, P)) : P
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
function je(e) {
	return e ? e.replace(we, P) : P;
}
// node_modules/style-to-object/esm/index.mjs
function Me(e, t) {
	let n = null;
	if (!e || typeof e != "string") return n;
	let r = Ae(e), i = typeof t == "function";
	return r.forEach((e) => {
		if (e.type !== "declaration") return;
		let { property: r, value: a } = e;
		i ? t(r, a, e) : a && (n ||= {}, n[r] = a);
	}), n;
}
// node_modules/svelte-toolbelt/dist/utils/strings.js
var Ne = /\d/, Pe = [
	"-",
	"_",
	"/",
	"."
];
function Fe(e = "") {
	if (!Ne.test(e)) return e !== e.toLowerCase();
}
function Ie(e) {
	let t = [], n = "", r, i;
	for (let a of e) {
		let e = Pe.includes(a);
		if (e === !0) {
			t.push(n), n = "", r = void 0;
			continue;
		}
		let o = Fe(a);
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
function Le(e) {
	return e ? Ie(e).map((e) => ze(e)).join("") : "";
}
function Re(e) {
	return Be(Le(e || ""));
}
function ze(e) {
	return e ? e[0].toUpperCase() + e.slice(1) : "";
}
function Be(e) {
	return e ? e[0].toLowerCase() + e.slice(1) : "";
}
// node_modules/svelte-toolbelt/dist/utils/css-to-style-obj.js
var Ve = 1e3, He = /* @__PURE__ */ new Map();
function Ue(e) {
	let t = He.get(e);
	return t === void 0 && (t = e.startsWith("-moz-") || e.startsWith("-webkit-") || e.startsWith("-ms-") || e.startsWith("-o-") ? Le(e) : e.startsWith("--") ? e : Re(e), He.size >= Ve && He.clear(), He.set(e, t)), t;
}
var We = /["'\\{}]|\/\*/, Ge = /^[-\w]+$/;
function Ke(e) {
	if (We.test(e)) return null;
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
				if (!Ge.test(n) || !o) return null;
				t.push(n, o);
			}
			r = a + 1, i = -1;
		}
	}
	return t;
}
function qe(e, t) {
	let n = Ke(t);
	if (n) for (let t = 0; t < n.length; t += 2) e[Ue(n[t])] = n[t + 1];
	else Me(t, (t, n) => {
		e[Ue(t)] = n;
	});
}
function Je(e) {
	if (!e) return {};
	let t = {};
	return qe(t, e), t;
}
// node_modules/svelte-toolbelt/dist/utils/execute-callbacks.js
function Ye(...e) {
	return (...t) => {
		for (let n of e) typeof n == "function" && n(...t);
	};
}
// node_modules/svelte-toolbelt/dist/utils/style-to-css.js
function Xe(e, t) {
	let n = RegExp(e, "g");
	return (e) => {
		if (typeof e != "string") throw TypeError(`expected an argument of type string, but got ${typeof e}`);
		return e.match(n) ? e.replace(n, t) : e;
	};
}
var Ze = Xe(/[A-Z]/, (e) => `-${e.toLowerCase()}`), Qe = /* @__PURE__ */ new Map();
function $e(e) {
	let t = Qe.get(e);
	return t === void 0 && (t = Ze(e), Qe.size >= 1e3 && Qe.clear(), Qe.set(e, t)), t;
}
function et(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw TypeError(`expected an argument of type object, but got ${typeof e}`);
	let t = "";
	for (let n of Object.keys(e)) {
		let r = e[n];
		r != null && r !== "" && (t += `${t ? "\n" : ""}${$e(n)}: ${r};`);
	}
	return t;
}
// node_modules/svelte-toolbelt/dist/utils/style.js
function tt(e = {}) {
	return et(e).replace("\n", " ");
}
var nt = new Set(/* @__PURE__ */ "onabort.onanimationcancel.onanimationend.onanimationiteration.onanimationstart.onauxclick.onbeforeinput.onbeforetoggle.onblur.oncancel.oncanplay.oncanplaythrough.onchange.onclick.onclose.oncompositionend.oncompositionstart.oncompositionupdate.oncontextlost.oncontextmenu.oncontextrestored.oncopy.oncuechange.oncut.ondblclick.ondrag.ondragend.ondragenter.ondragleave.ondragover.ondragstart.ondrop.ondurationchange.onemptied.onended.onerror.onfocus.onfocusin.onfocusout.onformdata.ongotpointercapture.oninput.oninvalid.onkeydown.onkeypress.onkeyup.onload.onloadeddata.onloadedmetadata.onloadstart.onlostpointercapture.onmousedown.onmouseenter.onmouseleave.onmousemove.onmouseout.onmouseover.onmouseup.onpaste.onpause.onplay.onplaying.onpointercancel.onpointerdown.onpointerenter.onpointerleave.onpointermove.onpointerout.onpointerover.onpointerup.onprogress.onratechange.onreset.onresize.onscroll.onscrollend.onsecuritypolicyviolation.onseeked.onseeking.onselect.onselectionchange.onselectstart.onslotchange.onstalled.onsubmit.onsuspend.ontimeupdate.ontoggle.ontouchcancel.ontouchend.ontouchmove.ontouchstart.ontransitioncancel.ontransitionend.ontransitionrun.ontransitionstart.onvolumechange.onwaiting.onwebkitanimationend.onwebkitanimationiteration.onwebkitanimationstart.onwebkittransitionend.onwheel".split("."));
// node_modules/svelte-toolbelt/dist/utils/merge-props.js
function rt(e) {
	return nt.has(e);
}
function it(...e) {
	let t = { ...e[0] };
	for (let n = 1; n < e.length; n++) {
		let r = e[n];
		if (r) {
			for (let e of Object.keys(r)) {
				let n = t[e], i = r[e], a = typeof n == "function", o = typeof i == "function";
				if (a && o && rt(e)) t[e] = ge(n, i);
				else if (a && o) t[e] = Ye(n, i);
				else if (e === "class") {
					let r = de(n), a = de(i);
					r && a ? t[e] = re(n, i) : r ? t[e] = re(n) : a && (t[e] = re(i));
				} else if (e === "style") {
					let r = typeof n == "object", a = typeof i == "object", o = typeof n == "string", s = typeof i == "string";
					if (r && a) t[e] = {
						...n,
						...i
					};
					else if (r && s) {
						let r = Je(i);
						t[e] = {
							...n,
							...r
						};
					} else if (o && a) t[e] = {
						...Je(n),
						...i
					};
					else if (o && s) {
						let r = Je(n), a = Je(i);
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
	return typeof t.style == "object" && (t.style = tt(t.style).replaceAll("\n", " ")), t.hidden === !1 && (t.hidden = void 0, delete t.hidden), t.disabled === !1 && (t.disabled = void 0, delete t.disabled), t;
}
// node_modules/runed/dist/internal/configurable-globals.js
var at = typeof window < "u" ? window : void 0;
typeof window < "u" && window.document, typeof window < "u" && window.navigator, typeof window < "u" && window.location;
// node_modules/runed/dist/internal/utils/dom.js
function ot(e) {
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
		let { window: t = at, document: n = t?.document } = e;
		t !== void 0 && (this.#e = n, this.#t = ae((e) => {
			let n = _(t, "focusin", e), r = _(t, "focusout", e);
			return () => {
				n(), r();
			};
		}));
	}
	get current() {
		return this.#t?.(), this.#e ? ot(this.#e) : null;
	}
}();
// node_modules/runed/dist/internal/utils/is.js
function st(e) {
	return typeof e == "function";
}
// node_modules/runed/dist/utilities/context/context.js
var F = class {
	#e;
	#t;
	constructor(e) {
		this.#e = e, this.#t = Symbol(e);
	}
	get key() {
		return this.#t;
	}
	exists() {
		return ie(this.#t);
	}
	get() {
		let e = r(this.#t);
		if (e === void 0) throw Error(`Context "${this.#e}" not found`);
		return e;
	}
	getOr(e) {
		let t = r(this.#t);
		return t === void 0 ? e : t;
	}
	set(e) {
		return i(this.#t, e);
	}
};
// node_modules/runed/dist/utilities/watch/watch.svelte.js
function ct(e, t) {
	switch (e) {
		case "post":
			x(t);
			break;
		case "pre": O(t);
	}
}
function lt(e, t, n, r = {}) {
	let { lazy: i = !1 } = r, a = !i, o = Array.isArray(e) ? [] : void 0;
	ct(t, () => {
		let t = Array.isArray(e) ? e.map((e) => e()) : e();
		if (!a) {
			a = !0, o = t;
			return;
		}
		let r = w(() => n(t, o));
		return o = t, r;
	});
}
function I(e, t, n) {
	lt(e, "post", t, n);
}
function ut(e, t, n) {
	lt(e, "pre", t, n);
}
I.pre = ut;
// node_modules/runed/dist/internal/utils/get.js
function dt(e) {
	return st(e) ? e() : e;
}
// node_modules/runed/dist/utilities/element-size/element-size.svelte.js
var ft = class {
	#e = {
		width: 0,
		height: 0
	};
	#t = !1;
	#n;
	#r;
	#i;
	#a = y(() => (f(this.#s)?.(), this.getSize().width));
	#o = y(() => (f(this.#s)?.(), this.getSize().height));
	#s = y(() => {
		let e = dt(this.#r);
		if (e) return ae((t) => {
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
		this.#i = t.window ?? at, this.#n = t, this.#r = e, this.#e = {
			width: 0,
			height: 0
		};
	}
	calculateSize() {
		let e = dt(this.#r);
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
		return f(this.#s)?.(), this.getSize();
	}
	get width() {
		return f(this.#a);
	}
	get height() {
		return f(this.#o);
	}
};
// node_modules/svelte-toolbelt/dist/utils/on-destroy-effect.svelte.js
function pt(e) {
	x(() => () => {
		e();
	});
}
// node_modules/svelte-toolbelt/dist/utils/after-sleep.js
function mt(e, t) {
	return setTimeout(t, e);
}
// node_modules/svelte-toolbelt/dist/utils/after-tick.js
function ht(t) {
	e().then(t);
}
// node_modules/svelte-toolbelt/dist/utils/dom.js
var gt = 1, _t = 9, vt = 11;
function yt(e) {
	return le(e) && e.nodeType === gt && typeof e.nodeName == "string";
}
function bt(e) {
	return le(e) && e.nodeType === _t;
}
function xt(e) {
	return le(e) && e.constructor?.name === "VisualViewport";
}
function St(e) {
	return le(e) && e.nodeType !== void 0;
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
	#e = y(() => this.element.current ? this.element.current.getRootNode() ?? document : document);
	get root() {
		return f(this.#e);
	}
	set root(e) {
		A(this.#e, e);
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
function kt(e, t) {
	return { [v()]: (n) => me(e) ? (e.current = n, w(() => t?.(n)), () => {
		"isConnected" in n && n.isConnected || (e.current = null, t?.(null));
	}) : (e(n), w(() => t?.(n)), () => {
		"isConnected" in n && n.isConnected || (e(null), t?.(null));
	}) };
}
// node_modules/bits-ui/dist/internal/attrs.js
function At(e) {
	return e ? "true" : "false";
}
function jt(e) {
	return e ? "open" : "closed";
}
function Mt(e) {
	return e === "starting" ? { "data-starting-style": "" } : e === "ending" ? { "data-ending-style": "" } : {};
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
// node_modules/bits-ui/dist/internal/is.js
var Ft = typeof document < "u", It = Lt();
function Lt() {
	return Ft && window?.navigator?.userAgent && (/iP(ad|hone|od)/.test(window.navigator.userAgent) || window?.navigator?.maxTouchPoints > 2 && /iPad|Macintosh/.test(window?.navigator.userAgent));
}
function Rt(e) {
	return e instanceof HTMLElement;
}
function L(e) {
	return e instanceof Element;
}
function zt(e) {
	return e instanceof Element || e instanceof SVGElement;
}
function Bt(e) {
	return e.pointerType === "touch";
}
function Vt(e) {
	return e !== null;
}
// node_modules/bits-ui/dist/internal/animations-complete.js
var Ht = class {
	#e;
	#t = null;
	#n = null;
	#r = 0;
	constructor(e) {
		this.#e = e, pt(() => this.#i());
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
		this.#e.afterTick ? ht(t) : t();
	}
}, Ut = class {
	#e;
	#t;
	#n;
	#r = T(!1);
	#i = T(void 0);
	#a = !1;
	#o = null;
	constructor(e) {
		this.#e = e, A(this.#r, e.open.current, !0), this.#t = e.enabled ?? !0, this.#n = new Ht({
			ref: this.#e.ref,
			afterTick: this.#e.open
		}), pt(() => this.#s()), I(() => this.#e.open.current, (e) => {
			this.#a ? (this.#s(), !e && this.#e.shouldSkipExitAnimation?.() ? (A(this.#r, !1), A(this.#i, void 0), this.#e.onComplete?.()) : (e && A(this.#r, !0), A(this.#i, e ? "starting" : "ending", !0), e && (this.#o = window.requestAnimationFrame(() => {
				this.#o = null, this.#e.open.current && A(this.#i, void 0);
			})), this.#t ? this.#n.run(() => {
				e === this.#e.open.current && (this.#e.open.current || A(this.#r, !1), A(this.#i, void 0), this.#e.onComplete?.());
			}) : (e || A(this.#r, !1), A(this.#i, void 0), this.#e.onComplete?.()))) : this.#a = !0;
		});
	}
	get shouldRender() {
		return f(this.#r);
	}
	get transitionStatus() {
		return f(this.#i);
	}
	#s() {
		this.#o !== null && (window.cancelAnimationFrame(this.#o), this.#o = null);
	}
};
// node_modules/bits-ui/dist/internal/noop.js
function R() {}
// node_modules/bits-ui/dist/internal/create-id.js
function Wt(e, t) {
	return t === void 0 ? `bits-${e}` : `bits-${e}-${t}`;
}
// node_modules/bits-ui/dist/bits/utilities/portal/portal-consumer.svelte
function Gt(e, r) {
	var i = h(), a = D(i);
	d(a, () => r.children, (e) => {
		var i = h(), a = D(i);
		t(a, () => r.children ?? c), n(e, i);
	}), n(e, i);
}
// node_modules/bits-ui/dist/bits/utilities/config/bits-config.js
var Kt = new F("BitsConfig");
function qt() {
	let e = new Yt(null, {});
	return Kt.getOr(e).opts;
}
function Jt(e) {
	return Kt.set(new Yt(Kt.getOr(null), e));
}
var Yt = class {
	opts;
	constructor(e, t) {
		let n = Xt(e, t);
		this.opts = {
			defaultPortalTo: n((e) => e.defaultPortalTo),
			defaultLocale: n((e) => e.defaultLocale)
		};
	}
};
function Xt(e, t) {
	return (n) => M(() => {
		let r = n(t)?.current;
		if (r !== void 0) return r;
		if (e !== null) return n(e.opts)?.current;
	});
}
// node_modules/bits-ui/dist/bits/utilities/config/prop-resolvers.js
function Zt(e, t) {
	return (n) => {
		let r = qt();
		return M(() => {
			let i = n();
			if (i !== void 0) return i;
			let a = e(r).current;
			return a === void 0 ? t : a;
		});
	};
}
var Qt = Zt((e) => e.defaultPortalTo, "body");
// node_modules/bits-ui/dist/bits/utilities/portal/portal.svelte
function $t(e, r) {
	a(r, !0);
	let i = Qt(() => r.to), s = p(), u = y(d);
	function d() {
		if (!Ft || r.disabled) return null;
		let e = null;
		return e = typeof i.current == "string" ? document.querySelector(i.current) : i.current, e;
	}
	let g;
	function _() {
		g &&= (oe(g), null);
	}
	I([() => f(u), () => r.disabled], ([e, t]) => {
		if (!e || t) _();
		else return g = l(Gt, {
			target: e,
			props: { children: r.children },
			context: s
		}), () => {
			_();
		};
	});
	var v = h(), b = D(v), x = (e) => {
		var i = h(), a = D(i);
		t(a, () => r.children ?? c), n(e, i);
	};
	o(b, (e) => {
		r.disabled && e(x);
	}), n(e, v), m();
}
// node_modules/bits-ui/dist/internal/events.js
var en = class {
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
		return _(e, this.eventName, (e) => {
			t(e);
		}, n);
	}
};
// node_modules/bits-ui/dist/internal/debounce.js
function tn(e, t = 500) {
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
function nn(e, t) {
	return e === t || e.contains(t);
}
function rn(e) {
	return e?.ownerDocument ?? document;
}
// node_modules/bits-ui/dist/internal/dom.js
function an(e, t) {
	let { clientX: n, clientY: r } = e, i = t.getBoundingClientRect();
	return n < i.left || n > i.right || r < i.top || r > i.bottom;
}
// node_modules/tabbable/dist/index.esm.js
var on = [
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
], sn = /* #__PURE__ */ on.join(","), cn = typeof Element > "u", z = cn ? function() {} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector, ln = !cn && Element.prototype.getRootNode ? function(e) {
	return e == null || e.getRootNode == null ? void 0 : e.getRootNode();
} : function(e) {
	return e?.ownerDocument;
}, un = function(e, t) {
	t === void 0 && (t = !0);
	var n = e == null || e.getAttribute == null ? void 0 : e.getAttribute("inert");
	return n === "" || n === "true" || t && e && (typeof e.closest == "function" ? e.closest("[inert]") : un(e.parentNode));
}, dn = function(e) {
	var t, n = e == null || e.getAttribute == null || (t = e.getAttribute("contenteditable")) == null ? void 0 : t.toLowerCase();
	return n === "" || n === "true" || n === "plaintext-only";
}, fn = function(e, t, n) {
	if (un(e)) return [];
	var r = Array.prototype.slice.apply(e.querySelectorAll(sn));
	return t && z.call(e, sn) && r.unshift(e), r = r.filter(n), r;
}, pn = function(e, t, n) {
	for (var r = [], i = Array.from(e); i.length;) {
		var a = i.shift();
		if (!un(a, !1)) {
			if (a.tagName === "SLOT") {
				var o = a.assignedElements(), s = pn(o.length ? o : a.children, !0, n);
				n.flatten ? r.push.apply(r, s) : r.push({
					scopeParent: a,
					candidates: s
				});
			} else {
				z.call(a, sn) && n.filter(a) && (t || !e.includes(a)) && r.push(a);
				var c = a.shadowRoot || typeof n.getShadowRoot == "function" && n.getShadowRoot(a), l = !un(c, !1) && (!n.shadowRootFilter || n.shadowRootFilter(a));
				if (c && l) {
					var u = pn(c === !0 ? a.children : c.children, !0, n);
					n.flatten ? r.push.apply(r, u) : r.push({
						scopeParent: a,
						candidates: u
					});
				} else i.unshift.apply(i, a.children);
			}
		}
	}
	return r;
}, mn = function(e) {
	return !isNaN(parseInt(e.getAttribute("tabindex"), 10));
}, hn = function(e) {
	if (!e) throw Error("No node provided");
	return e.tabIndex < 0 && (/^(AUDIO|VIDEO|DETAILS)$/.test(e.tagName) || dn(e)) && !mn(e) ? 0 : e.tabIndex;
}, gn = function(e, t) {
	var n = hn(e);
	return n < 0 && t && !mn(e) ? 0 : n;
}, _n = function(e, t) {
	return e.tabIndex === t.tabIndex ? e.documentOrder - t.documentOrder : e.tabIndex - t.tabIndex;
}, vn = function(e) {
	return e.tagName === "INPUT";
}, yn = function(e) {
	return vn(e) && e.type === "hidden";
}, bn = function(e) {
	return e.tagName === "DETAILS" && Array.prototype.slice.apply(e.children).some(function(e) {
		return e.tagName === "SUMMARY";
	});
}, xn = function(e, t) {
	for (var n = 0; n < e.length; n++) if (e[n].checked && e[n].form === t) return e[n];
}, Sn = function(e) {
	if (!e.name) return !0;
	var t = e.form || ln(e), n = function(e) {
		return t.querySelectorAll("input[type=\"radio\"][name=\"" + e + "\"]");
	}, r;
	if (typeof window < "u" && window.CSS !== void 0 && typeof window.CSS.escape == "function") r = n(window.CSS.escape(e.name));
	else try {
		r = n(e.name);
	} catch (e) {
		return console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s", e.message), !1;
	}
	var i = xn(r, e.form);
	return !i || i === e;
}, Cn = function(e) {
	return vn(e) && e.type === "radio";
}, wn = function(e) {
	return Cn(e) && !Sn(e);
}, Tn = function(e) {
	var t = e && ln(e), n = t?.host, r = !1;
	if (t && t !== e) {
		var i, a;
		for (r = !!((i = n) != null && (i = i.ownerDocument) != null && i.contains(n) || e != null && (a = e.ownerDocument) != null && a.contains(e)); !r && n;) {
			var o;
			t = ln(n), n = t?.host, r = !!((o = n) != null && (o = o.ownerDocument) != null && o.contains(n));
		}
	}
	return r;
}, En = function(e) {
	var t = e.getBoundingClientRect(), n = t.width, r = t.height;
	return n === 0 && r === 0;
}, Dn = function(e, t) {
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
	var a = z.call(e, "details>summary:first-of-type") ? e.parentElement : e;
	if (z.call(a, "details:not([open]) *")) return !0;
	if (!n || n === "full" || n === "full-native" || n === "legacy-full") {
		if (typeof r == "function") {
			for (var o = e; e;) {
				var s = e.parentElement, c = ln(e);
				if (s && !s.shadowRoot && r(s) === !0) return En(e);
				e = e.assignedSlot ? e.assignedSlot : !s && c !== e.ownerDocument ? c.host : s;
			}
			e = o;
		}
		if (Tn(e)) return !e.getClientRects().length;
		if (n !== "legacy-full") return !0;
	} else if (n === "non-zero-area") return En(e);
	return !1;
}, On = function(e) {
	if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(e.tagName)) for (var t = e.parentElement; t;) {
		if (t.tagName === "FIELDSET" && t.disabled) {
			for (var n = 0; n < t.children.length; n++) {
				var r = t.children.item(n);
				if (r.tagName === "LEGEND") return z.call(t, "fieldset[disabled] *") ? !0 : !r.contains(e);
			}
			return !0;
		}
		t = t.parentElement;
	}
	return !1;
}, kn = function(e, t) {
	return !(t.disabled || yn(t) || Dn(t, e) || bn(t) || On(t));
}, An = function(e, t) {
	return !(wn(t) || hn(t) < 0 || !kn(e, t));
}, jn = function(e) {
	var t = parseInt(e.getAttribute("tabindex"), 10);
	return !!(isNaN(t) || t >= 0);
}, Mn = function(e) {
	var t = [], n = [];
	return e.forEach(function(e, r) {
		var i = !!e.scopeParent, a = i ? e.scopeParent : e, o = gn(a, i), s = i ? Mn(e.candidates) : a;
		o === 0 ? i ? t.push.apply(t, s) : t.push(a) : n.push({
			documentOrder: r,
			tabIndex: o,
			item: e,
			isScope: i,
			content: s
		});
	}), n.sort(_n).reduce(function(e, t) {
		return t.isScope ? e.push.apply(e, t.content) : e.push(t.content), e;
	}, []).concat(t);
}, Nn = function(e, t) {
	return t ||= {}, Mn(t.getShadowRoot ? pn([e], t.includeContainer, {
		filter: An.bind(null, t),
		flatten: !1,
		getShadowRoot: t.getShadowRoot,
		shadowRootFilter: jn
	}) : fn(e, t.includeContainer, An.bind(null, t)));
}, Pn = function(e, t) {
	return t ||= {}, t.getShadowRoot ? pn([e], t.includeContainer, {
		filter: kn.bind(null, t),
		flatten: !0,
		getShadowRoot: t.getShadowRoot
	}) : fn(e, t.includeContainer, kn.bind(null, t));
}, Fn = function(e, t) {
	if (t ||= {}, !e) throw Error("No node provided");
	return z.call(e, sn) !== !1 && An(t, e);
}, In = /* #__PURE__ */ on.concat("iframe:not([inert]):not([inert] *)").join(","), Ln = function(e, t) {
	if (t ||= {}, !e) throw Error("No node provided");
	return z.call(e, In) !== !1 && kn(t, e);
}, Rn = "data-context-menu-trigger", zn = "data-context-menu-content";
// node_modules/bits-ui/dist/bits/utilities/dismissible-layer/use-dismissable-layer.svelte.js
new F("Menu.Root"), new F("Menu.Root | Menu.Sub"), new F("Menu.Content"), new F("Menu.Group | Menu.RadioGroup"), new F("Menu.RadioGroup"), new F("Menu.CheckboxGroup"), new en("bitsmenuopen", {
	bubbles: !1,
	cancelable: !0
}), Pt({
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
var Bn = class e {
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
	#s = R;
	constructor(e) {
		this.opts = e, this.#t = e.interactOutsideBehavior, this.#e = e.onInteractOutside, this.#o = e.onFocusOutside, x(() => {
			this.#a = rn(this.opts.ref.current);
		});
		let t = R, n = () => {
			this.#g(), globalThis.bitsDismissableLayers.delete(this), this.#d.destroy(), t();
		};
		I([() => this.opts.enabled.current, () => this.opts.ref.current], () => {
			if (this.opts.enabled.current && this.opts.ref.current) return mt(1, () => {
				this.opts.ref.current && (globalThis.bitsDismissableLayers.set(this, this.#t), t(), t = this.#l());
			}), n;
		}), pt(() => {
			this.#g.destroy(), globalThis.bitsDismissableLayers.delete(this), this.#d.destroy(), this.#s(), t();
		});
	}
	#c = (e) => {
		e.defaultPrevented || this.opts.ref.current && ht(() => {
			this.opts.ref.current && !this.#h(e.target) && e.target && !this.#i && this.#o.current?.(e);
		});
	};
	#l() {
		return Ye(_(this.#a, "pointerdown", Ye(this.#f, this.#m), { capture: !0 }), _(this.#a, "pointerdown", Ye(this.#p, this.#d)), _(this.#a, "focusin", this.#c));
	}
	#u = (e) => {
		let t = e;
		t.defaultPrevented && (t = Wn(e)), this.#e.current(e);
	};
	#d = tn((e) => {
		if (!this.opts.ref.current) {
			this.#s();
			return;
		}
		let t = this.opts.isValidEvent.current(e, this.opts.ref.current) || Un(e, this.opts.ref.current);
		if (!this.#r || this.#_() || !t) {
			this.#s();
			return;
		}
		let n = e;
		n.defaultPrevented && (n = Wn(n)), this.#t.current !== "close" && this.#t.current !== "defer-otherwise-close" ? this.#s() : e.pointerType === "touch" ? (this.#s(), this.#s = _(this.#a, "click", this.#u, { once: !0 })) : this.#e.current(n);
	}, 10);
	#f = (e) => {
		this.#n[e.type] = !0;
	};
	#p = (e) => {
		this.#n[e.type] = !1;
	};
	#m = () => {
		this.opts.ref.current && (this.#r = Hn(this.opts.ref.current));
	};
	#h = (e) => this.opts.ref.current ? nn(this.opts.ref.current, e) : !1;
	#g = tn(() => {
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
function Vn(e = [...globalThis.bitsDismissableLayers]) {
	return e.findLast(([e, { current: t }]) => t === "close" || t === "ignore");
}
function Hn(e) {
	let t = [...globalThis.bitsDismissableLayers], n = Vn(t);
	if (n) return n[0].opts.ref.current === e;
	let [r] = t[0];
	return r.opts.ref.current === e;
}
function Un(e, t) {
	let n = e.target;
	if (!zt(n)) return !1;
	let r = !!n.closest(`[${Rn}]`), i = !!t.closest(`[${zn}]`);
	return "button" in e && e.button > 0 && !r ? !1 : "button" in e && e.button === 0 && r && i ? !0 : r && i ? !1 : rn(n).documentElement.contains(n) && !nn(t, n) && an(e, t);
}
function Wn(e) {
	let t = e.currentTarget, n = e.target, r;
	r = e instanceof PointerEvent ? new PointerEvent(e.type, e) : new PointerEvent("pointerdown", e);
	let i = !1;
	return new Proxy(r, { get: (r, a) => a === "currentTarget" ? t : a === "target" ? n : a === "preventDefault" ? () => {
		i = !0, typeof r.preventDefault == "function" && r.preventDefault();
	} : a === "defaultPrevented" ? i : a in r ? r[a] : e[a] });
}
// node_modules/bits-ui/dist/bits/utilities/dismissible-layer/dismissible-layer.svelte
function Gn(e, r) {
	a(r, !0);
	let i = j(r, "interactOutsideBehavior", 3, "close"), o = j(r, "onInteractOutside", 3, R), s = j(r, "onFocusOutside", 3, R), l = j(r, "isValidEvent", 3, () => !1), u = Bn.create({
		id: M(() => r.id),
		interactOutsideBehavior: M(() => i()),
		onInteractOutside: M(() => o()),
		enabled: M(() => r.enabled),
		onFocusOutside: M(() => s()),
		isValidEvent: M(() => l()),
		ref: r.ref
	});
	var d = h(), f = D(d);
	t(f, () => r.children ?? c, () => ({ props: u.props })), n(e, d), m();
}
// node_modules/bits-ui/dist/bits/utilities/escape-layer/use-escape-layer.svelte.js
globalThis.bitsEscapeLayers ??= /* @__PURE__ */ new Map();
var Kn = class e {
	static create(t) {
		return new e(t);
	}
	opts;
	domContext;
	constructor(e) {
		this.opts = e, this.domContext = new Ot(this.opts.ref);
		let t = R;
		I(() => e.enabled.current, (n) => (n && (globalThis.bitsEscapeLayers.set(this, e.escapeKeydownBehavior), t = this.#e()), () => {
			t(), globalThis.bitsEscapeLayers.delete(this);
		}));
	}
	#e = () => _(this.domContext.getDocument(), "keydown", this.#t, { passive: !1 });
	#t = (e) => {
		if (e.key !== "Escape" || !qn(this)) return;
		let t = new KeyboardEvent(e.type, e);
		e.preventDefault();
		let n = this.opts.escapeKeydownBehavior.current;
		(n === "close" || n === "defer-otherwise-close") && this.opts.onEscapeKeydown.current(t);
	};
};
function qn(e) {
	let t = [...globalThis.bitsEscapeLayers], n = t.findLast(([e, { current: t }]) => t === "close" || t === "ignore");
	if (n) return n[0] === e;
	let [r] = t[0];
	return r === e;
}
// node_modules/bits-ui/dist/bits/utilities/escape-layer/escape-layer.svelte
function Jn(e, r) {
	a(r, !0);
	let i = j(r, "escapeKeydownBehavior", 3, "close"), o = j(r, "onEscapeKeydown", 3, R);
	Kn.create({
		escapeKeydownBehavior: M(() => i()),
		onEscapeKeydown: M(() => o()),
		enabled: M(() => r.enabled),
		ref: r.ref
	});
	var s = h(), l = D(s);
	t(l, () => r.children ?? c), n(e, s), m();
}
// node_modules/bits-ui/dist/bits/utilities/focus-scope/focus-scope-manager.js
var Yn = class e {
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
}, Xn = class e {
	#e = !1;
	#t = null;
	#n = Yn.getInstance();
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
		this.#r.push(_(t, "focusin", (t) => {
			if (this.#e || !this.#n.isActiveScope(this)) return;
			let n = t.target;
			if (n) {
				if (e.contains(n)) this.#n.setFocusMemory(this, n);
				else {
					let n = this.#n.getFocusMemory(this);
					if (n && e.contains(n) && Ln(n)) t.preventDefault(), n.focus();
					else {
						let t = this.#u(), n = this.#d()[0];
						(t || n || e).focus();
					}
				}
			}
		}, { capture: !0 }), _(e, "keydown", (e) => {
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
		return this.#t ? Nn(this.#t, {
			includeContainer: !1,
			getShadowRoot: !0
		}) : [];
	}
	#u() {
		return this.#l()[0] || null;
	}
	#d() {
		return this.#t ? Pn(this.#t, {
			includeContainer: !1,
			getShadowRoot: !0
		}) : [];
	}
	static use(t) {
		let n = null;
		return I([() => t.ref.current, () => t.enabled.current], ([r, i]) => {
			r && i ? (n ||= new e(t), n.mount(r)) : n &&= (n.unmount(), null);
		}), pt(() => {
			n?.unmount();
		}), { get props() {
			return { tabindex: -1 };
		} };
	}
};
// node_modules/bits-ui/dist/bits/utilities/focus-scope/focus-scope.svelte
function Zn(e, r) {
	a(r, !0);
	let i = j(r, "enabled", 3, !1), o = j(r, "trapFocus", 3, !1), s = j(r, "loop", 3, !1), l = j(r, "onCloseAutoFocus", 3, R), u = j(r, "onOpenAutoFocus", 3, R), d = Xn.use({
		enabled: M(() => i()),
		trap: M(() => o()),
		loop: s(),
		onCloseAutoFocus: M(() => l()),
		onOpenAutoFocus: M(() => u()),
		ref: r.ref
	});
	var f = h(), p = D(f);
	t(p, () => r.focusScope ?? c, () => ({ props: d.props })), n(e, f), m();
}
// node_modules/bits-ui/dist/bits/utilities/text-selection-layer/use-text-selection-layer.svelte.js
var Qn = () => {};
globalThis.bitsTextSelectionLayers ??= /* @__PURE__ */ new Map();
var $n = class e {
	static create(t) {
		return new e(t);
	}
	opts;
	domContext;
	#e = R;
	#t = !1;
	#n = Qn;
	#r = Qn;
	constructor(e) {
		this.opts = e, this.domContext = new Ot(e.ref);
		let t = R;
		I(() => [
			this.opts.enabled.current,
			this.opts.onPointerDown.current,
			this.opts.onPointerUp.current
		], ([e, n, r]) => (this.#t = e, this.#n = n, this.#r = r, e && (globalThis.bitsTextSelectionLayers.set(this, this.opts.enabled), t(), t = this.#i()), () => {
			this.#t = !1, t(), this.#s(), globalThis.bitsTextSelectionLayers.delete(this);
		}));
	}
	#i() {
		return Ye(_(this.domContext.getDocument(), "pointerdown", this.#o), _(this.domContext.getDocument(), "pointerup", ge(this.#s, this.#a)));
	}
	#a = (e) => {
		this.#r(e);
	};
	#o = (e) => {
		let t = this.opts.ref.current, n = e.target;
		Rt(t) && Rt(n) && this.#t && rr(this) && wt(t, n) && (this.#n(e), e.defaultPrevented || (this.#e = tr(t, this.domContext.getDocument().body)));
	};
	#s = () => {
		this.#e(), this.#e = R;
	};
}, er = (e) => e.style.userSelect || e.style.webkitUserSelect;
function tr(e, t) {
	let n = er(t), r = er(e);
	return nr(t, "none"), nr(e, "text"), () => {
		nr(t, n), nr(e, r);
	};
}
function nr(e, t) {
	e.style.userSelect = t, e.style.webkitUserSelect = t;
}
function rr(e) {
	let t = [...globalThis.bitsTextSelectionLayers];
	if (!t.length) return !1;
	let n = t.at(-1);
	return n ? n[0] === e : !1;
}
// node_modules/bits-ui/dist/bits/utilities/text-selection-layer/text-selection-layer.svelte
function ir(e, r) {
	a(r, !0);
	let i = j(r, "preventOverflowTextSelection", 3, !0), o = j(r, "onPointerDown", 3, R), s = j(r, "onPointerUp", 3, R);
	$n.create({
		id: M(() => r.id),
		onPointerDown: M(() => o()),
		onPointerUp: M(() => s()),
		enabled: M(() => r.enabled && i()),
		ref: r.ref
	});
	var l = h(), u = D(l);
	t(u, () => r.children ?? c), n(e, l), m();
}
// node_modules/bits-ui/dist/internal/use-id.js
globalThis.bitsIdCounter ??= { current: 0 };
function ar(e = "bits") {
	return globalThis.bitsIdCounter.current++, `${e}-${globalThis.bitsIdCounter.current}`;
}
// node_modules/bits-ui/dist/internal/shared-state.svelte.js
var or = class {
	#e;
	#t = 0;
	#n = T();
	#r;
	constructor(e) {
		this.#e = e;
	}
	#i() {
		--this.#t, this.#r && this.#t <= 0 && (this.#r(), A(this.#n, void 0), this.#r = void 0);
	}
	get(...e) {
		return this.#t += 1, f(this.#n) === void 0 && (this.#r = te(() => {
			A(this.#n, this.#e(...e), !0);
		})), x(() => () => {
			this.#i();
		}), f(this.#n);
	}
}, sr = new se(), cr = T(null), lr = null, ur = null, dr = !1, fr = M(() => {
	for (let e of sr.values()) if (e) return !0;
	return !1;
}), pr = null, mr = new or(() => {
	function e() {
		document.body.setAttribute("style", f(cr) ?? ""), document.body.style.removeProperty("--scrollbar-width"), It && lr?.(), A(cr, null);
	}
	function t() {
		ur !== null && (window.clearTimeout(ur), ur = null);
	}
	function n(e, n) {
		t(), dr = !0, pr = Date.now();
		let r = pr, i = () => {
			ur = null, pr === r && (gr(sr) ? dr = !1 : (dr = !1, n()));
		}, a = e === null ? 24 : e;
		ur = window.setTimeout(i, a);
	}
	function r() {
		f(cr) === null && sr.size === 0 && !dr && A(cr, document.body.getAttribute("style"), !0);
	}
	return I(() => fr.current, () => {
		if (!fr.current) return;
		r(), dr = !1;
		let e = getComputedStyle(document.documentElement), t = getComputedStyle(document.body), n = e.scrollbarGutter?.includes("stable") || t.scrollbarGutter?.includes("stable"), i = window.innerWidth - document.documentElement.clientWidth, a = {
			padding: Number.parseInt(t.paddingRight ?? "0", 10) + i,
			margin: Number.parseInt(t.marginRight ?? "0", 10)
		};
		i > 0 && !n && (document.body.style.paddingRight = `${a.padding}px`, document.body.style.marginRight = `${a.margin}px`, document.body.style.setProperty("--scrollbar-width", `${i}px`)), document.body.style.overflow = "hidden", It && (lr = _(document, "touchmove", (e) => {
			e.target === document.documentElement && (e.touches.length > 1 || e.preventDefault());
		}, { passive: !1 })), ht(() => {
			document.body.style.pointerEvents = "none", document.body.style.overflow = "hidden";
		});
	}), pt(() => () => {
		lr?.();
	}), {
		get lockMap() {
			return sr;
		},
		resetBodyStyle: e,
		scheduleCleanupIfNoNewLocks: n,
		cancelPendingCleanup: t,
		ensureInitialStyleCaptured: r
	};
}), hr = class {
	#e = ar();
	#t;
	#n = () => null;
	#r;
	locked;
	constructor(e, t = () => null) {
		this.#t = e, this.#n = t, this.#r = mr.get(), this.#r && (this.#r.cancelPendingCleanup(), this.#r.ensureInitialStyleCaptured(), this.#r.lockMap.set(this.#e, this.#t ?? !1), this.locked = M(() => this.#r.lockMap.get(this.#e) ?? !1, (e) => this.#r.lockMap.set(this.#e, e)), pt(() => {
			if (this.#r.lockMap.delete(this.#e), gr(this.#r.lockMap)) return;
			let e = this.#n();
			this.#r.scheduleCleanupIfNoNewLocks(e, () => {
				this.#r.resetBodyStyle();
			});
		}));
	}
};
function gr(e) {
	for (let [t, n] of e) if (n) return !0;
	return !1;
}
// node_modules/bits-ui/dist/bits/utilities/scroll-lock/scroll-lock.svelte
function _r(e, t) {
	a(t, !0);
	let n = j(t, "preventScroll", 3, !0), r = j(t, "restoreScrollDelay", 3, null);
	n() && new hr(n(), () => r()), m();
}
// node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
var vr = [
	"top",
	"right",
	"bottom",
	"left"
], B = Math.min, V = Math.max, yr = Math.round, br = Math.floor, H = (e) => ({
	x: e,
	y: e
}), xr = {
	left: "right",
	right: "left",
	bottom: "top",
	top: "bottom"
};
function Sr(e, t, n) {
	return V(e, B(t, n));
}
function U(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function W(e) {
	return e.split("-")[0];
}
function Cr(e) {
	return e.split("-")[1];
}
function wr(e) {
	return e === "x" ? "y" : "x";
}
function Tr(e) {
	return e === "y" ? "height" : "width";
}
function G(e) {
	let t = e[0];
	return t === "t" || t === "b" ? "y" : "x";
}
function Er(e) {
	return wr(G(e));
}
function Dr(e, t, n) {
	n === void 0 && (n = !1);
	let r = Cr(e), i = Er(e), a = Tr(i), o = i === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
	return t.reference[a] > t.floating[a] && (o = Ir(o)), [o, Ir(o)];
}
function Or(e) {
	let t = Ir(e);
	return [
		kr(e),
		t,
		kr(t)
	];
}
function kr(e) {
	return e.includes("start") ? e.replace("start", "end") : e.replace("end", "start");
}
var Ar = ["left", "right"], jr = ["right", "left"], Mr = ["top", "bottom"], Nr = ["bottom", "top"];
function Pr(e, t, n) {
	switch (e) {
		case "top":
		case "bottom": return n ? t ? jr : Ar : t ? Ar : jr;
		case "left":
		case "right": return t ? Mr : Nr;
		default: return [];
	}
}
function Fr(e, t, n, r) {
	let i = Cr(e), a = Pr(W(e), n === "start", r);
	return i && (a = a.map((e) => e + "-" + i), t && (a = a.concat(a.map(kr)))), a;
}
function Ir(e) {
	let t = W(e);
	return xr[t] + e.slice(t.length);
}
function Lr(e) {
	return {
		top: e.top ?? 0,
		right: e.right ?? 0,
		bottom: e.bottom ?? 0,
		left: e.left ?? 0
	};
}
function Rr(e) {
	return typeof e == "number" ? {
		top: e,
		right: e,
		bottom: e,
		left: e
	} : Lr(e);
}
function zr(e) {
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
function Br(e, t, n) {
	let { reference: r, floating: i } = e, a = G(t), o = Er(t), s = Tr(o), c = W(t), l = a === "y", u = r.x + r.width / 2 - i.width / 2, d = r.y + r.height / 2 - i.height / 2, f = r[s] / 2 - i[s] / 2, p;
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
	let m = Cr(t);
	return m && (p[o] += f * (m === "end" ? 1 : -1) * (n && l ? -1 : 1)), p;
}
async function Vr(e, t) {
	t === void 0 && (t = {});
	let { x: n, y: r, platform: i, rects: a, elements: o, strategy: s } = e, { boundary: c = "clippingAncestors", rootBoundary: l = "viewport", elementContext: u = "floating", altBoundary: d = !1, padding: f = 0 } = U(t, e), p = Rr(f), m = o[d ? u === "floating" ? "reference" : "floating" : u], h = zr(await i.getClippingRect({
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
	}, y = zr(i.convertOffsetParentRelativeRectToViewportRelativeRect ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
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
var Hr = 50, Ur = async (e, t, n) => {
	let { placement: r = "bottom", strategy: i = "absolute", middleware: a = [], platform: o } = n, s = o.detectOverflow ? o : {
		...o,
		detectOverflow: Vr
	}, c = await (o.isRTL == null ? void 0 : o.isRTL(t)), l = await o.getElementRects({
		reference: e,
		floating: t,
		strategy: i
	}), { x: u, y: d } = Br(l, r, c), f = r, p = 0, m = {};
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
		}, x && p < Hr && (p++, typeof x == "object" && (x.placement && (f = x.placement), x.rects && (l = x.rects === !0 ? await o.getElementRects({
			reference: e,
			floating: t,
			strategy: i
		}) : x.rects), {x: u, y: d} = Br(l, f, c)), n = -1);
	}
	return {
		x: u,
		y: d,
		placement: f,
		strategy: i,
		middlewareData: m
	};
}, Wr = (e) => ({
	name: "arrow",
	options: e,
	async fn(t) {
		let { x: n, y: r, placement: i, rects: a, platform: o, elements: s, middlewareData: c } = t, { element: l, padding: u = 0 } = U(e, t) || {};
		if (l == null) return {};
		let d = Rr(u), f = {
			x: n,
			y: r
		}, p = Er(i), m = Tr(p), h = await o.getDimensions(l), g = p === "y", _ = g ? "top" : "left", v = g ? "bottom" : "right", y = g ? "clientHeight" : "clientWidth", b = a.reference[m] + a.reference[p] - f[p] - a.floating[m], x = f[p] - a.reference[p], S = await (o.getOffsetParent == null ? void 0 : o.getOffsetParent(l)), C = S ? S[y] : 0;
		C && await (o.isElement == null ? void 0 : o.isElement(S)) || (C = s.floating[y] || a.floating[m]);
		let w = b / 2 - x / 2, T = C / 2 - h[m] / 2 - 1, E = B(d[_], T), D = B(d[v], T), ee = C - h[m] - D, O = C / 2 - h[m] / 2 + w, k = Sr(E, O, ee), A = !c.arrow && Cr(i) != null && O !== k && a.reference[m] / 2 - (O < E ? E : D) - h[m] / 2 < 0, j = A ? O < E ? O - E : O - ee : 0;
		return {
			[p]: f[p] + j,
			data: {
				[p]: k,
				centerOffset: O - k - j,
				...A && { alignmentOffset: j }
			},
			reset: A
		};
	}
}), Gr = function(e) {
	return e === void 0 && (e = {}), {
		name: "flip",
		options: e,
		async fn(t) {
			var n;
			let { placement: r, middlewareData: i, rects: a, initialPlacement: o, platform: s, elements: c } = t, { mainAxis: l = !0, crossAxis: u = !0, fallbackPlacements: d, fallbackStrategy: f = "bestFit", fallbackAxisSideDirection: p = "none", flipAlignment: m = !0, ...h } = U(e, t);
			if ((n = i.arrow) != null && n.alignmentOffset) return {};
			let g = W(r), _ = G(o), v = W(o) === o, y = await (s.isRTL == null ? void 0 : s.isRTL(c.floating)), b = d || (v || !m ? [Ir(o)] : Or(o)), x = p !== "none";
			!d && x && b.push(...Fr(o, m, p, y));
			let S = [o, ...b], C = await s.detectOverflow(t, h), w = [], T = i.flip?.overflows || [];
			if (l && w.push(C[g]), u) {
				let e = Dr(r, a, y);
				w.push(C[e[0]], C[e[1]]);
			}
			if (T = [...T, {
				placement: r,
				overflows: w
			}], !w.every((e) => e <= 0)) {
				let e = (i.flip?.index || 0) + 1, t = S[e];
				if (t && (u !== "alignment" || _ === G(t) || T.every((e) => G(e.placement) !== _ || e.overflows[0] > 0))) return {
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
								let t = G(e.placement);
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
function Kr(e, t) {
	return {
		top: e.top - t.height,
		right: e.right - t.width,
		bottom: e.bottom - t.height,
		left: e.left - t.width
	};
}
function qr(e) {
	return vr.some((t) => e[t] >= 0);
}
var Jr = function(e) {
	return e === void 0 && (e = {}), {
		name: "hide",
		options: e,
		async fn(t) {
			let { rects: n, platform: r } = t, { strategy: i = "referenceHidden", ...a } = U(e, t);
			switch (i) {
				case "referenceHidden": {
					let e = Kr(await r.detectOverflow(t, {
						...a,
						elementContext: "reference"
					}), n.reference);
					return { data: {
						referenceHiddenOffsets: e,
						referenceHidden: qr(e)
					} };
				}
				case "escaped": {
					let e = Kr(await r.detectOverflow(t, {
						...a,
						altBoundary: !0
					}), n.floating);
					return { data: {
						escapedOffsets: e,
						escaped: qr(e)
					} };
				}
				default: return {};
			}
		}
	};
}, Yr = /*#__PURE__*/ new Set(["left", "top"]);
async function Xr(e, t) {
	let { placement: n, platform: r, elements: i } = e, a = await (r.isRTL == null ? void 0 : r.isRTL(i.floating)), o = W(n), s = Cr(n), c = G(n) === "y", l = Yr.has(o) ? -1 : 1, u = a && c ? -1 : 1, d = U(t, e), { mainAxis: f, crossAxis: p, alignmentAxis: m } = typeof d == "number" ? {
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
var Zr = function(e) {
	return e === void 0 && (e = 0), {
		name: "offset",
		options: e,
		async fn(t) {
			var n;
			let { x: r, y: i, placement: a, middlewareData: o } = t, s = await Xr(t, e);
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
}, Qr = function(e) {
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
			} }, ...l } = U(e, t), u = {
				x: n,
				y: r
			}, d = await a.detectOverflow(t, l), f = G(i), p = wr(f), m = u[p], h = u[f], g = (e, t) => Sr(t + d[e === "y" ? "top" : "left"], t, t - d[e === "y" ? "bottom" : "right"]);
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
}, $r = function(e) {
	return e === void 0 && (e = {}), {
		options: e,
		fn(t) {
			let { x: n, y: r, placement: i, rects: a, middlewareData: o } = t, { offset: s = 0, mainAxis: c = !0, crossAxis: l = !0 } = U(e, t), u = {
				x: n,
				y: r
			}, d = G(i), f = wr(d), p = u[f], m = u[d], h = U(s, t), g = typeof h == "number" ? {
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
				let e = f === "y" ? "width" : "height", t = Yr.has(W(i)), n = a.reference[d] - a.floating[e] + (t && o.offset?.[d] || 0) + (t ? 0 : g.crossAxis), r = a.reference[d] + a.reference[e] + (t ? 0 : o.offset?.[d] || 0) - (t ? g.crossAxis : 0);
				m < n ? m = n : m > r && (m = r);
			}
			return {
				[f]: p,
				[d]: m
			};
		}
	};
}, ei = function(e) {
	return e === void 0 && (e = {}), {
		name: "size",
		options: e,
		async fn(t) {
			let { placement: n, rects: r, platform: i, elements: a } = t, { apply: o = () => {}, ...s } = U(e, t), c = await i.detectOverflow(t, s), l = W(n), u = Cr(n), d = G(n) === "y", { width: f, height: p } = r.floating, m, h;
			l === "top" || l === "bottom" ? (m = l, h = u === (await (i.isRTL == null ? void 0 : i.isRTL(a.floating)) ? "start" : "end") ? "left" : "right") : (h = l, m = u === "end" ? "top" : "bottom");
			let g = p - c.top - c.bottom, _ = f - c.left - c.right, v = B(p - c[m], g), y = B(f - c[h], _), b = t.middlewareData.shift, x = !b, S = v, C = y;
			b != null && b.enabled.x && (C = _), b != null && b.enabled.y && (S = g), x && !u && (d ? C = f - 2 * V(c.left, c.right) : S = p - 2 * V(c.top, c.bottom)), await o({
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
function ti() {
	return typeof window < "u";
}
function ni(e) {
	return ri(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function K(e) {
	var t;
	return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function q(e) {
	return ((ri(e) ? e.ownerDocument : e.document) || window.document)?.documentElement;
}
function ri(e) {
	return ti() ? e instanceof Node || e instanceof K(e).Node : !1;
}
function J(e) {
	return ti() ? e instanceof Element || e instanceof K(e).Element : !1;
}
function Y(e) {
	return ti() ? e instanceof HTMLElement || e instanceof K(e).HTMLElement : !1;
}
function ii(e) {
	return !ti() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof K(e).ShadowRoot;
}
function ai(e) {
	let { overflow: t, overflowX: n, overflowY: r, display: i } = Z(e);
	return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && i !== "inline" && i !== "contents";
}
function oi(e) {
	return /^(table|td|th)$/.test(ni(e));
}
function si(e) {
	try {
		if (e.matches(":popover-open")) return !0;
	} catch {}
	try {
		return e.matches(":modal");
	} catch {
		return !1;
	}
}
var ci = /transform|translate|scale|rotate|perspective|filter/, li = /paint|layout|strict|content/, X = (e) => !!e && e !== "none", ui;
function di(e) {
	let t = J(e) ? Z(e) : e;
	return X(t.transform) || X(t.translate) || X(t.scale) || X(t.rotate) || X(t.perspective) || !pi() && (X(t.backdropFilter) || X(t.filter)) || ci.test(t.willChange || "") || li.test(t.contain || "");
}
function fi(e) {
	let t = Q(e);
	for (; Y(t) && !mi(t);) {
		if (di(t)) return t;
		if (si(t)) return null;
		t = Q(t);
	}
	return null;
}
function pi() {
	return ui ??= typeof CSS < "u" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none"), ui;
}
function mi(e) {
	return /^(html|body|#document)$/.test(ni(e));
}
function Z(e) {
	return K(e).getComputedStyle(e);
}
function hi(e) {
	return J(e) ? {
		scrollLeft: e.scrollLeft,
		scrollTop: e.scrollTop
	} : {
		scrollLeft: e.scrollX,
		scrollTop: e.scrollY
	};
}
function Q(e) {
	if (ni(e) === "html") return e;
	let t = e.assignedSlot || e.parentNode || ii(e) && e.host || q(e);
	return ii(t) ? t.host : t;
}
function gi(e) {
	let t = Q(e);
	return mi(t) ? (e.ownerDocument || e).body : Y(t) && ai(t) ? t : gi(t);
}
function _i(e, t, n) {
	t === void 0 && (t = []), n === void 0 && (n = !0);
	let r = gi(e), i = r === e.ownerDocument?.body, a = K(r);
	if (i) {
		let e = vi(a);
		return t.concat(a, a.visualViewport || [], ai(r) ? r : [], e && n ? _i(e) : []);
	}
	return t.concat(r, _i(r, [], n));
}
function vi(e) {
	return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
// node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function yi(e) {
	let t = Z(e), n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0, i = Y(e), a = i ? e.offsetWidth : n, o = i ? e.offsetHeight : r, s = yr(n) !== a || yr(r) !== o;
	return s && (n = a, r = o), {
		width: n,
		height: r,
		$: s
	};
}
function bi(e) {
	return J(e) ? e : e.contextElement;
}
function xi(e) {
	let t = bi(e);
	if (!Y(t)) return H(1);
	let n = t.getBoundingClientRect(), { width: r, height: i, $: a } = yi(t), o = (a ? yr(n.width) : n.width) / r, s = (a ? yr(n.height) : n.height) / i;
	return o && Number.isFinite(o) || (o = 1), s && Number.isFinite(s) || (s = 1), {
		x: o,
		y: s
	};
}
var Si = /*#__PURE__*/ H(0);
function Ci(e) {
	let t = K(e);
	return !pi() || !t.visualViewport ? Si : {
		x: t.visualViewport.offsetLeft,
		y: t.visualViewport.offsetTop
	};
}
function wi(e, t, n) {
	return t === void 0 && (t = !1), !!n && t && n === K(e);
}
function Ti(e, t, n, r) {
	t === void 0 && (t = !1), n === void 0 && (n = !1);
	let i = e.getBoundingClientRect(), a = bi(e), o = H(1);
	t && (r ? J(r) && (o = xi(r)) : o = xi(e));
	let s = wi(a, n, r) ? Ci(a) : H(0), c = (i.left + s.x) / o.x, l = (i.top + s.y) / o.y, u = i.width / o.x, d = i.height / o.y;
	if (a && r) {
		let e = K(a), t = J(r) ? K(r) : r, n = e, i = vi(n);
		for (; i && t !== n;) {
			let e = xi(i), t = i.getBoundingClientRect(), r = Z(i), a = t.left + (i.clientLeft + parseFloat(r.paddingLeft)) * e.x, o = t.top + (i.clientTop + parseFloat(r.paddingTop)) * e.y;
			c *= e.x, l *= e.y, u *= e.x, d *= e.y, c += a, l += o, n = K(i), i = vi(n);
		}
	}
	return zr({
		width: u,
		height: d,
		x: c,
		y: l
	});
}
function Ei(e, t) {
	let n = hi(e).scrollLeft;
	return t ? t.left + n : Ti(q(e)).left + n;
}
function Di(e, t) {
	let n = e.getBoundingClientRect();
	return {
		x: n.left + t.scrollLeft - Ei(e, n),
		y: n.top + t.scrollTop
	};
}
function Oi(e) {
	let { elements: t, rect: n, offsetParent: r, strategy: i } = e, a = i === "fixed", o = q(r), s = t ? si(t.floating) : !1;
	if (r === o || s && a) return n;
	let c = {
		scrollLeft: 0,
		scrollTop: 0
	}, l = H(1), u = H(0), d = Y(r);
	if ((d || !a) && ((ni(r) !== "body" || ai(o)) && (c = hi(r)), d)) {
		let e = Ti(r);
		l = xi(r), u.x = e.x + r.clientLeft, u.y = e.y + r.clientTop;
	}
	let f = o && !d && !a ? Di(o, c) : H(0);
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
	let t = hi(e), n = e.ownerDocument.body, r = V(e.scrollWidth, e.clientWidth, n.scrollWidth, n.clientWidth), i = V(e.scrollHeight, e.clientHeight, n.scrollHeight, n.clientHeight), a = -t.scrollLeft + Ei(e), o = -t.scrollTop;
	return Z(n).direction === "rtl" && (a += V(e.clientWidth, n.clientWidth) - r), {
		width: r,
		height: i,
		x: a,
		y: o
	};
}
var ji = 25;
function Mi(e, t, n) {
	n === void 0 && (n = "viewport");
	let r = n === "layoutViewport", i = K(e), a = q(e), o = i.visualViewport, s = a.clientWidth, c = a.clientHeight, l = 0, u = 0;
	if (o) {
		let e = !pi() || t === "fixed";
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
	else if (t === "document") r = Ai(q(e));
	else if (J(t)) r = Ni(t, n);
	else {
		let n = Ci(e);
		r = {
			x: t.x - n.x,
			y: t.y - n.y,
			width: t.width,
			height: t.height
		};
	}
	return zr(r);
}
function Fi(e, t) {
	let n = t.get(e);
	if (n) return n;
	let r = _i(e, [], !1).filter((e) => J(e) && ni(e) !== "body"), i = null, a = Z(e).position === "fixed", o = a ? Q(e) : e;
	for (; J(o) && !mi(o);) {
		let e = Z(o), t = di(o), n = i ? i.position : a ? "fixed" : "";
		!t && (n === "fixed" || n === "absolute" && e.position === "static") ? r = r.filter((e) => e !== o) : i = e, o = Q(o);
	}
	return t.set(e, r), r;
}
function Ii(e) {
	let { element: t, boundary: n, rootBoundary: r, strategy: i } = e, a = [...n === "clippingAncestors" ? si(t) ? [] : Fi(t, this._c) : [].concat(n), r], o = Pi(t, a[0], i), s = o.top, c = o.right, l = o.bottom, u = o.left;
	for (let e = 1; e < a.length; e++) {
		let n = Pi(t, a[e], i);
		s = V(n.top, s), c = B(n.right, c), l = B(n.bottom, l), u = V(n.left, u);
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
	let r = Y(t), i = q(t), a = n === "fixed", o = Ti(e, !0, a, t), s = {
		scrollLeft: 0,
		scrollTop: 0
	}, c = H(0);
	if ((r || !a) && ((ni(t) !== "body" || ai(i)) && (s = hi(t)), r)) {
		let e = Ti(t, !0, a, t);
		c.x = e.x + t.clientLeft, c.y = e.y + t.clientTop;
	}
	!r && i && (c.x = Ei(i));
	let l = i && !r && !a ? Di(i, s) : H(0);
	return {
		x: o.left + s.scrollLeft - c.x - l.x,
		y: o.top + s.scrollTop - c.y - l.y,
		width: o.width,
		height: o.height
	};
}
function zi(e) {
	return Z(e).position === "static";
}
function Bi(e, t) {
	if (!Y(e) || Z(e).position === "fixed") return null;
	if (t) return t(e);
	let n = e.offsetParent;
	return q(e) === n && (n = n.ownerDocument.body), n;
}
function Vi(e, t) {
	let n = K(e);
	if (si(e)) return n;
	if (!Y(e)) {
		let t = Q(e);
		for (; t && !mi(t);) {
			if (J(t) && !zi(t)) return t;
			t = Q(t);
		}
		return n;
	}
	let r = Bi(e, t);
	for (; r && oi(r) && zi(r);) r = Bi(r, t);
	return r && mi(r) && zi(r) && !di(r) ? n : r || fi(e) || n;
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
	return Z(e).direction === "rtl";
}
var Wi = {
	convertOffsetParentRelativeRectToViewportRelativeRect: Oi,
	getDocumentElement: q,
	getClippingRect: Ii,
	getOffsetParent: Vi,
	getElementRects: Hi,
	getClientRects: ki,
	getDimensions: Li,
	getScale: xi,
	isElement: J,
	isRTL: Ui
};
function Gi(e, t) {
	return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function Ki(e, t, n) {
	let r = null, i, a = q(e);
	function o() {
		var e;
		clearTimeout(i), (e = r) == null || e.disconnect(), r = null;
	}
	function s(n, c) {
		n === void 0 && (n = !1), c === void 0 && (c = 1), o();
		let l = e.getBoundingClientRect(), { left: u, top: d, width: f, height: p } = l;
		if (n || t(), !f || !p) return;
		let m = br(d), h = br(a.clientWidth - (u + f)), g = br(a.clientHeight - (d + p)), _ = br(u), v = {
			rootMargin: -m + "px " + -h + "px " + -g + "px " + -_ + "px",
			threshold: V(0, B(1, c)) || 1
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
	let c = K(e), l = () => s(n);
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
var Ji = Zr, Yi = Qr, Xi = Gr, Zi = ei, Qi = Jr, $i = Wr, ea = $r, ta = (e, t, n) => {
	let r = /* @__PURE__ */ new Map(), i = n ?? {}, a = {
		...Wi,
		...i.platform,
		_c: r
	};
	return Ur(e, t, {
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
	let t = e.whileElementsMounted, n = y(() => na(e.open) ?? !0), r = y(() => na(e.middleware)), i = y(() => na(e.transform) ?? !0), a = y(() => na(e.placement) ?? "bottom"), o = y(() => na(e.strategy) ?? "absolute"), s = y(() => na(e.sideOffset) ?? 0), c = y(() => na(e.alignOffset) ?? 0), l = e.reference, u = T(0), d = T(0), p = N(null), m = T(C(f(o))), h = T(C(f(a))), g = T(C({})), _ = T(!1), v = !1, b = 0, S = y(() => {
		let e = p.current ? ia(p.current, f(u)) : f(u), t = p.current ? ia(p.current, f(d)) : f(d);
		return f(i) ? {
			position: f(m),
			left: "0",
			top: "0",
			transform: `translate(${e}px, ${t}px)`,
			...p.current && ra(p.current) >= 1.5 && { willChange: "transform" }
		} : {
			position: f(m),
			left: `${e}px`,
			top: `${t}px`
		};
	}), w;
	function E() {
		if (l.current === null || p.current === null) return;
		let e = l.current, t = p.current, i = ++b;
		ta(e, t, {
			middleware: f(r),
			placement: f(a),
			strategy: f(o)
		}).then((r) => {
			if (i === b && l.current === e && p.current === t) {
				if (sa(e)) A(g, {
					...f(g),
					hide: {
						...f(g).hide,
						referenceHidden: !0
					}
				}, !0);
				else {
					if (!f(n) && f(u) !== 0 && f(d) !== 0) {
						let e = Math.max(Math.abs(f(s)), Math.abs(f(c)), 15);
						if (r.x <= e && r.y <= e) return;
					}
					A(u, r.x, !0), A(d, r.y, !0), A(m, r.strategy, !0), A(h, r.placement, !0), A(g, r.middlewareData, !0), A(_, !0);
				}
			}
		});
	}
	function D() {
		typeof w == "function" && (w(), w = void 0), b++;
	}
	function ee() {
		D(), t === void 0 ? E() : f(n) && l.current !== null && p.current !== null && (w = t(l.current, p.current, E));
	}
	function O() {
		!f(n) && p.current === null && A(_, !1);
	}
	function k() {
		return [
			f(r),
			f(a),
			f(o),
			f(s),
			f(c),
			f(n)
		];
	}
	return x(() => {
		t === void 0 && f(n) && E();
	}), x(ee), x(() => {
		t !== void 0 && (k(), f(n) && f(_) ? v ? E() : v = !0 : v = !1);
	}), x(O), x(() => D), {
		floating: p,
		reference: l,
		get strategy() {
			return f(m);
		},
		get placement() {
			return f(h);
		},
		get middlewareData() {
			return f(g);
		},
		get isPositioned() {
			return f(_);
		},
		get floatingStyles() {
			return f(S);
		},
		get update() {
			return E;
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
}, la = new F("Floating.Root"), ua = new F("Floating.Content"), da = new F("Floating.Root"), fa = class e {
	static create(t = !1) {
		return t ? da.set(new e()) : la.set(new e());
	}
	anchorNode = N(null);
	customAnchorNode = N(null);
	triggerNode = N(null);
	constructor() {
		x(() => {
			this.customAnchorNode.current ? typeof this.customAnchorNode.current == "string" ? this.anchorNode.current = document.querySelector(this.customAnchorNode.current) : this.anchorNode.current = this.customAnchorNode.current : this.anchorNode.current = this.triggerNode.current;
		});
	}
}, pa = class e {
	static create(t, n = !1) {
		return n ? ua.set(new e(t, da.get())) : ua.set(new e(t, la.get()));
	}
	opts;
	root;
	contentRef = N(null);
	wrapperRef = N(null);
	arrowRef = N(null);
	contentAttachment = kt(this.contentRef);
	wrapperAttachment = kt(this.wrapperRef);
	arrowAttachment = kt(this.arrowRef);
	arrowId = N(ar());
	#e = y(() => {
		if (typeof this.opts.style == "string") return Je(this.opts.style);
		if (!this.opts.style) return {};
	});
	#t = void 0;
	#n = new ft(() => this.arrowRef.current ?? void 0);
	#r = y(() => this.#n?.width ?? 0);
	#i = y(() => this.#n?.height ?? 0);
	#a = y(() => this.opts.side?.current + (this.opts.align.current === "center" ? "" : `-${this.opts.align.current}`));
	#o = y(() => Array.isArray(this.opts.collisionBoundary.current) ? this.opts.collisionBoundary.current : [this.opts.collisionBoundary.current]);
	#s = y(() => f(this.#o).length > 0);
	get hasExplicitBoundaries() {
		return f(this.#s);
	}
	set hasExplicitBoundaries(e) {
		A(this.#s, e);
	}
	#c = y(() => ({
		padding: this.opts.collisionPadding.current,
		boundary: f(this.#o).filter(Vt),
		altBoundary: this.hasExplicitBoundaries
	}));
	get detectOverflowOptions() {
		return f(this.#c);
	}
	set detectOverflowOptions(e) {
		A(this.#c, e);
	}
	#l = T(void 0);
	#u = T(void 0);
	#d = T(void 0);
	#f = T(void 0);
	#p = y(() => [
		Ji({
			mainAxis: this.opts.sideOffset.current + f(this.#i),
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
				A(this.#l, t, !0), A(this.#u, n, !0), A(this.#d, r, !0), A(this.#f, i, !0);
			}
		}),
		this.arrowRef.current && $i({
			element: this.arrowRef.current,
			padding: this.opts.arrowPadding.current
		}),
		ha({
			arrowWidth: f(this.#r),
			arrowHeight: f(this.#i)
		}),
		this.opts.hideWhenDetached.current && Qi({
			strategy: "referenceHidden",
			...this.detectOverflowOptions
		})
	].filter(Boolean));
	get middleware() {
		return f(this.#p);
	}
	set middleware(e) {
		A(this.#p, e);
	}
	floating;
	#m = y(() => _a(this.floating.placement));
	get placedSide() {
		return f(this.#m);
	}
	set placedSide(e) {
		A(this.#m, e);
	}
	#h = y(() => va(this.floating.placement));
	get placedAlign() {
		return f(this.#h);
	}
	set placedAlign(e) {
		A(this.#h, e);
	}
	#g = y(() => this.floating.middlewareData.arrow?.x ?? 0);
	get arrowX() {
		return f(this.#g);
	}
	set arrowX(e) {
		A(this.#g, e);
	}
	#_ = y(() => this.floating.middlewareData.arrow?.y ?? 0);
	get arrowY() {
		return f(this.#_);
	}
	set arrowY(e) {
		A(this.#_, e);
	}
	#v = y(() => this.floating.middlewareData.arrow?.centerOffset !== 0);
	get cannotCenterArrow() {
		return f(this.#v);
	}
	set cannotCenterArrow(e) {
		A(this.#v, e);
	}
	#y = T();
	get contentZIndex() {
		return f(this.#y);
	}
	set contentZIndex(e) {
		A(this.#y, e, !0);
	}
	#b = y(() => ca[this.placedSide]);
	get arrowBaseSide() {
		return f(this.#b);
	}
	set arrowBaseSide(e) {
		A(this.#b, e);
	}
	#x = y(() => ({
		id: this.opts.wrapperId.current,
		"data-bits-floating-content-wrapper": "",
		style: {
			...this.floating.floatingStyles,
			transform: this.floating.isPositioned ? this.floating.floatingStyles.transform : "translate(0, -200%)",
			minWidth: "max-content",
			zIndex: this.contentZIndex,
			"--bits-floating-transform-origin": `${this.floating.middlewareData.transformOrigin?.x} ${this.floating.middlewareData.transformOrigin?.y}`,
			"--bits-floating-available-width": `${f(this.#l)}px`,
			"--bits-floating-available-height": `${f(this.#u)}px`,
			"--bits-floating-anchor-width": `${f(this.#d)}px`,
			"--bits-floating-anchor-height": `${f(this.#f)}px`,
			...this.floating.middlewareData.hide?.referenceHidden && {
				visibility: "hidden",
				"pointer-events": "none"
			},
			...f(this.#e)
		},
		dir: this.opts.dir.current,
		...this.wrapperAttachment
	}));
	get wrapperProps() {
		return f(this.#x);
	}
	set wrapperProps(e) {
		A(this.#x, e);
	}
	#S = y(() => ({
		"data-side": this.placedSide,
		"data-align": this.placedAlign,
		style: tt({ ...f(this.#e) }),
		...this.contentAttachment
	}));
	get props() {
		return f(this.#S);
	}
	set props(e) {
		A(this.#S, e);
	}
	#C = y(() => ({
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
		return f(this.#C);
	}
	set arrowStyle(e) {
		A(this.#C, e);
	}
	constructor(e, t) {
		this.opts = e, this.root = t, this.#t = e.updatePositionStrategy, e.customAnchor && (this.root.customAnchorNode.current = e.customAnchor.current), I(() => e.customAnchor.current, (e) => {
			this.root.customAnchorNode.current = e;
		}), this.floating = oa({
			strategy: () => this.opts.strategy.current,
			placement: () => f(this.#a),
			middleware: () => this.middleware,
			reference: this.root.anchorNode,
			whileElementsMounted: (...e) => qi(...e, { animationFrame: this.#t?.current === "always" }),
			open: () => this.opts.enabled.current,
			sideOffset: () => this.opts.sideOffset.current,
			alignOffset: () => this.opts.alignOffset.current
		}), x(() => {
			this.floating.isPositioned && this.opts.onPlaced?.current();
		}), I(() => this.contentRef.current, (e) => {
			if (!e || !this.opts.enabled.current) return;
			let t = Et(e), n = t.requestAnimationFrame(() => {
				if (this.contentRef.current !== e || !this.opts.enabled.current) return;
				let n = t.getComputedStyle(e).zIndex;
				n !== this.contentZIndex && (this.contentZIndex = n);
			});
			return () => {
				t.cancelAnimationFrame(n);
			};
		}), x(() => {
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
		this.opts = e, this.root = t, t.triggerNode = e.virtualEl && e.virtualEl.current ? he(e.virtualEl.current) : e.ref;
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
	a(r, !0);
	let i = j(r, "tooltip", 3, !1);
	fa.create(i());
	var o = h(), s = D(o);
	t(s, () => r.children ?? c), n(e, o), m();
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-anchor.svelte
function ba(e, r) {
	a(r, !0);
	let i = j(r, "tooltip", 3, !1);
	ma.create({
		id: M(() => r.id),
		virtualEl: M(() => r.virtualEl),
		ref: r.ref
	}, i());
	var o = h(), s = D(o);
	t(s, () => r.children ?? c), n(e, o), m();
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-content.svelte
function xa(e, r) {
	a(r, !0);
	let i = j(r, "side", 3, "bottom"), o = j(r, "sideOffset", 3, 0), s = j(r, "align", 3, "center"), l = j(r, "alignOffset", 3, 0), u = j(r, "arrowPadding", 3, 0), d = j(r, "avoidCollisions", 3, !0), p = j(r, "collisionBoundary", 19, () => []), g = j(r, "collisionPadding", 3, 0), _ = j(r, "hideWhenDetached", 3, !1), v = j(r, "onPlaced", 3, () => {}), b = j(r, "sticky", 3, "partial"), x = j(r, "updatePositionStrategy", 3, "optimized"), S = j(r, "strategy", 3, "fixed"), C = j(r, "dir", 3, "ltr"), w = j(r, "style", 19, () => ({})), T = j(r, "wrapperId", 19, ar), E = j(r, "customAnchor", 3, null), ee = j(r, "tooltip", 3, !1), O = pa.create({
		side: M(() => i()),
		sideOffset: M(() => o()),
		align: M(() => s()),
		alignOffset: M(() => l()),
		id: M(() => r.id),
		arrowPadding: M(() => u()),
		avoidCollisions: M(() => d()),
		collisionBoundary: M(() => p()),
		collisionPadding: M(() => g()),
		hideWhenDetached: M(() => _()),
		onPlaced: M(() => v()),
		sticky: M(() => b()),
		updatePositionStrategy: M(() => x()),
		strategy: M(() => S()),
		dir: M(() => C()),
		style: M(() => w()),
		enabled: M(() => r.enabled),
		wrapperId: M(() => T()),
		customAnchor: M(() => E())
	}, ee()), k = y(() => it(O.wrapperProps, { style: { pointerEvents: "auto" } }));
	var A = h(), te = D(A);
	t(te, () => r.content ?? c, () => ({
		props: O.props,
		wrapperProps: f(k)
	})), n(e, A), m();
}
// node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-content-static.svelte
function Sa(e, r) {
	a(r, !0), ee(() => {
		r.onPlaced?.();
	});
	var i = h(), o = D(i);
	t(o, () => r.content ?? c, () => ({
		props: {},
		wrapperProps: {}
	})), n(e, i), m();
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
	let r = j(t, "isStatic", 3, !1), i = E(t, Ca);
	var a = h(), s = D(a), c = (e) => {
		Sa(e, {
			get content() {
				return t.content;
			},
			get onPlaced() {
				return t.onPlaced;
			}
		});
	}, l = (e) => {
		xa(e, b({
			get content() {
				return t.content;
			},
			get onPlaced() {
				return t.onPlaced;
			}
		}, () => i));
	};
	o(s, (e) => {
		r() ? e(c) : e(l, -1);
	}), n(e, a);
}
// node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer-inner.svelte
var Ta = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.popper.onEscapeKeydown.escapeKeydownBehavior.preventOverflowTextSelection.id.onPointerDown.onPointerUp.side.sideOffset.align.alignOffset.arrowPadding.avoidCollisions.collisionBoundary.collisionPadding.sticky.hideWhenDetached.updatePositionStrategy.strategy.dir.preventScroll.wrapperId.style.onPlaced.onInteractOutside.onCloseAutoFocus.onOpenAutoFocus.onFocusOutside.interactOutsideBehavior.loop.trapFocus.isValidEvent.customAnchor.isStatic.enabled.ref.tooltip.contentPointerEvents".split(".")), Ea = s("<!> <!>", 1);
function Da(e, r) {
	a(r, !0);
	let i = j(r, "interactOutsideBehavior", 3, "close"), s = j(r, "trapFocus", 3, !0), l = j(r, "isValidEvent", 3, () => !1), u = j(r, "customAnchor", 3, null), d = j(r, "isStatic", 3, !1), p = j(r, "tooltip", 3, !1), g = j(r, "contentPointerEvents", 3, "auto"), _ = E(r, Ta), v = y(() => r.preventScroll ?? !0), b = y(() => r.strategy ?? (f(v) ? "fixed" : "absolute"));
	wa(e, {
		get isStatic() {
			return d();
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
			return f(b);
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
			return u();
		},
		get enabled() {
			return r.enabled;
		},
		get tooltip() {
			return p();
		},
		content: (e, a) => {
			let u = () => (a?.()).props, d = () => (a?.()).wrapperProps;
			var p = Ea(), m = D(p), b = (e) => {
				_r(e, { get preventScroll() {
					return f(v);
				} });
			}, x = (e) => {
				_r(e, { get preventScroll() {
					return f(v);
				} });
			};
			o(m, (e) => {
				r.forceMount && r.enabled ? e(b) : r.forceMount || e(x, 1);
			}), Zn(ne(m, 2), {
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
					return s();
				},
				get forceMount() {
					return r.forceMount;
				},
				get ref() {
					return r.ref;
				},
				focusScope: (e, a) => {
					let o = () => (a?.()).props;
					Jn(e, {
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
						children: (e, a) => {
							Gn(e, {
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
								children: (e, i) => {
									let a = () => (i?.()).props;
									ir(e, {
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
										children: (e, i) => {
											var s = h(), l = D(s);
											{
												let e = y(() => ({
													props: it(_, u(), a(), o(), { style: { pointerEvents: g() } }),
													wrapperProps: d()
												}));
												t(l, () => r.popper ?? c, () => f(e));
											}
											n(e, s);
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
			}), n(e, p);
		},
		$$slots: { content: !0 }
	}), m();
}
// node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer.svelte
var Oa = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.popper.open.onEscapeKeydown.escapeKeydownBehavior.preventOverflowTextSelection.id.onPointerDown.onPointerUp.side.sideOffset.align.alignOffset.arrowPadding.avoidCollisions.collisionBoundary.collisionPadding.sticky.hideWhenDetached.updatePositionStrategy.strategy.dir.preventScroll.wrapperId.style.onPlaced.onInteractOutside.onCloseAutoFocus.onOpenAutoFocus.onFocusOutside.interactOutsideBehavior.loop.trapFocus.isValidEvent.customAnchor.isStatic.ref.shouldRender".split("."));
function ka(e, t) {
	let r = j(t, "interactOutsideBehavior", 3, "close"), i = j(t, "trapFocus", 3, !0), a = j(t, "isValidEvent", 3, () => !1), s = j(t, "customAnchor", 3, null), c = j(t, "isStatic", 3, !1), l = E(t, Oa);
	var u = h(), d = D(u), f = (e) => {
		Da(e, b({
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
				return a();
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
	o(d, (e) => {
		t.shouldRender && e(f);
	}), n(e, u);
}
// node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer-force-mount.svelte
var Aa = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.popper.onEscapeKeydown.escapeKeydownBehavior.preventOverflowTextSelection.id.onPointerDown.onPointerUp.side.sideOffset.align.alignOffset.arrowPadding.avoidCollisions.collisionBoundary.collisionPadding.sticky.hideWhenDetached.updatePositionStrategy.strategy.dir.preventScroll.wrapperId.style.onPlaced.onInteractOutside.onCloseAutoFocus.onOpenAutoFocus.onFocusOutside.interactOutsideBehavior.loop.trapFocus.isValidEvent.customAnchor.isStatic.enabled".split("."));
function ja(e, t) {
	let n = j(t, "interactOutsideBehavior", 3, "close"), r = j(t, "trapFocus", 3, !0), i = j(t, "isValidEvent", 3, () => !1), a = j(t, "customAnchor", 3, null), o = j(t, "isStatic", 3, !1), s = E(t, Aa);
	Da(e, b({
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
		this.#n = typeof t == "number" && t > 0 ? t : null, I([
			e.triggerNode,
			e.contentNode,
			e.enabled
		], ([e, t, n]) => {
			if (!e || !t || !n) {
				this.#o = null, this.#m();
				return;
			}
			this.#o && this.#o !== e && this.#m(), this.#o = e;
			let r = Tt(e);
			return [
				_(r, "pointermove", (n) => {
					this.#p([n.clientX, n.clientY], e, t);
				}),
				_(e, "pointerleave", (e) => {
					let n = e.relatedTarget;
					if (L(n) && t.contains(n)) return;
					let r = this.#e.ignoredTargets?.() ?? [];
					L(n) && r.some((e) => e === n || e.contains(n)) || (this.#a = L(n) && r.length > 0 ? r.filter((e) => n.contains(e)) : [], this.#r = [e.clientX, e.clientY], this.#i = "content", this.#u());
				}),
				_(e, "pointerenter", () => {
					this.#m();
				}),
				_(t, "pointerenter", () => {
					this.#m();
				}),
				_(t, "pointerleave", (t) => {
					let n = t.relatedTarget;
					L(n) && e.contains(n) || (this.#r = [t.clientX, t.clientY], this.#i = "trigger", this.#u());
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
}, Ia = Pt({
	component: "popover",
	parts: [
		"root",
		"trigger",
		"content",
		"close",
		"overlay"
	]
}), La = new F("Popover.Root"), Ra = class e {
	static create(t) {
		return La.set(new e(t));
	}
	opts;
	#e = T(null);
	get contentNode() {
		return f(this.#e);
	}
	set contentNode(e) {
		A(this.#e, e, !0);
	}
	contentPresence;
	#t = T(null);
	get triggerNode() {
		return f(this.#t);
	}
	set triggerNode(e) {
		A(this.#t, e, !0);
	}
	#n = T(null);
	get overlayNode() {
		return f(this.#n);
	}
	set overlayNode(e) {
		A(this.#n, e, !0);
	}
	overlayPresence;
	#r = T(!1);
	get openedViaHover() {
		return f(this.#r);
	}
	set openedViaHover(e) {
		A(this.#r, e, !0);
	}
	#i = T(!1);
	get hasInteractedWithContent() {
		return f(this.#i);
	}
	set hasInteractedWithContent(e) {
		A(this.#i, e, !0);
	}
	#a = T(!1);
	get hoverCooldown() {
		return f(this.#a);
	}
	set hoverCooldown(e) {
		A(this.#a, e, !0);
	}
	#o = T(0);
	get closeDelay() {
		return f(this.#o);
	}
	set closeDelay(e) {
		A(this.#o, e, !0);
	}
	#s = null;
	#c = null;
	constructor(e) {
		this.opts = e, this.contentPresence = new Ut({
			ref: M(() => this.contentNode),
			open: this.opts.open,
			onComplete: () => {
				this.opts.onOpenChangeComplete.current(this.opts.open.current);
			}
		}), this.overlayPresence = new Ut({
			ref: M(() => this.overlayNode),
			open: this.opts.open
		}), I(() => this.opts.open.current, (e) => {
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
	#n = T(!1);
	constructor(e, t) {
		this.opts = e, this.root = t, this.attachment = kt(this.opts.ref, (e) => this.root.triggerNode = e), this.domContext = new Ot(e.ref), this.root.setDomContext(this.domContext), this.onclick = this.onclick.bind(this), this.onkeydown = this.onkeydown.bind(this), this.onpointerenter = this.onpointerenter.bind(this), this.onpointerleave = this.onpointerleave.bind(this), I(() => this.opts.closeDelay.current, (e) => {
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
		if (this.opts.disabled.current || !this.opts.openOnHover.current || Bt(e) || (A(this.#n, !0), this.#i(), this.root.cancelDelayedClose(), this.root.opts.open.current || this.root.hoverCooldown)) return;
		let t = this.opts.openDelay.current;
		t <= 0 ? this.root.handleHoverOpen() : this.#e = this.domContext.setTimeout(() => {
			this.root.handleHoverOpen(), this.#e = null;
		}, t);
	}
	onpointerleave(e) {
		this.opts.disabled.current || this.opts.openOnHover.current && (Bt(e) || (A(this.#n, !1), this.#r(), this.root.hoverCooldown = !1));
	}
	onclick(e) {
		this.opts.disabled.current || e.button === 0 && (this.#a(), f(this.#n) && this.root.opts.open.current && this.root.openedViaHover ? (this.root.openedViaHover = !1, this.root.hasInteractedWithContent = !0) : (f(this.#n) && this.opts.openOnHover.current && this.root.opts.open.current && (this.root.hoverCooldown = !0), this.root.hoverCooldown && !this.root.opts.open.current && (this.root.hoverCooldown = !1), this.root.toggleOpen()));
	}
	onkeydown(e) {
		this.opts.disabled.current || (e.key === "Enter" || e.key === " ") && (e.preventDefault(), this.#a(), this.root.toggleOpen());
	}
	#o() {
		if (this.root.opts.open.current && this.root.contentNode?.id) return this.root.contentNode?.id;
	}
	#s = y(() => ({
		id: this.opts.id.current,
		"aria-haspopup": "dialog",
		"aria-expanded": At(this.root.opts.open.current),
		"data-state": jt(this.root.opts.open.current),
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
		return f(this.#s);
	}
	set props(e) {
		A(this.#s, e);
	}
}, Ba = class e {
	static create(t) {
		return new e(t, La.get());
	}
	opts;
	root;
	attachment;
	constructor(e, t) {
		this.opts = e, this.root = t, this.attachment = kt(this.opts.ref, (e) => this.root.contentNode = e), this.onpointerdown = this.onpointerdown.bind(this), this.onfocusin = this.onfocusin.bind(this), this.onpointerenter = this.onpointerenter.bind(this), this.onpointerleave = this.onpointerleave.bind(this), new Fa({
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
		L(t) && Fn(t) && this.root.markInteraction();
	}
	onpointerenter(e) {
		Bt(e) || this.root.cancelDelayedClose();
	}
	onpointerleave(e) {
		Bt(e);
	}
	onInteractOutside = (e) => {
		if (this.opts.onInteractOutside.current(e), e.defaultPrevented || !L(e.target)) return;
		let t = e.target.closest(Ia.selector("trigger"));
		if (!(t && t === this.root.triggerNode)) {
			if (this.opts.customAnchor.current) {
				if (L(this.opts.customAnchor.current)) {
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
	#e = y(() => ({ open: this.root.opts.open.current }));
	get snippetProps() {
		return f(this.#e);
	}
	set snippetProps(e) {
		A(this.#e, e);
	}
	#t = y(() => ({
		id: this.opts.id.current,
		tabindex: -1,
		"data-state": jt(this.root.opts.open.current),
		...Mt(this.root.contentPresence.transitionStatus),
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
		return f(this.#t);
	}
	set props(e) {
		A(this.#t, e);
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
]), Ha = s("<div><div><!></div></div>");
function Ua(e, r) {
	let i = g();
	a(r, !0);
	let s = j(r, "ref", 15, null), l = j(r, "id", 19, () => Wt(i)), d = j(r, "forceMount", 3, !1), p = j(r, "onOpenAutoFocus", 3, R), _ = j(r, "onCloseAutoFocus", 3, R), v = j(r, "onEscapeKeydown", 3, R), x = j(r, "onInteractOutside", 3, R), C = j(r, "trapFocus", 3, !0), w = j(r, "preventScroll", 3, !1), T = j(r, "customAnchor", 3, null), ee = E(r, Va), O = Ba.create({
		id: M(() => l()),
		ref: M(() => s(), (e) => s(e)),
		onInteractOutside: M(() => x()),
		onEscapeKeydown: M(() => v()),
		customAnchor: M(() => T())
	}), A = y(() => it(ee, O.props)), te = y(() => C() && O.shouldTrapFocus);
	function ne(e) {
		O.shouldTrapFocus || e.preventDefault(), p()(e);
	}
	var re = h(), ie = D(re), ae = (e) => {
		ja(e, b(() => f(A), () => O.popperProps, {
			get ref() {
				return O.opts.ref;
			},
			get enabled() {
				return O.root.opts.open.current;
			},
			get id() {
				return l();
			},
			get trapFocus() {
				return f(te);
			},
			get preventScroll() {
				return w();
			},
			loop: !0,
			forceMount: !0,
			get customAnchor() {
				return T();
			},
			onOpenAutoFocus: ne,
			get onCloseAutoFocus() {
				return _();
			},
			get shouldRender() {
				return O.shouldRender;
			},
			popper: (e, i) => {
				let a = () => (i?.()).props, s = () => (i?.()).wrapperProps, l = y(() => it(a(), { style: aa("popover") }, { style: r.style }));
				var d = h(), p = D(d), m = (e) => {
					var i = h(), a = D(i);
					{
						let e = y(() => ({
							props: f(l),
							wrapperProps: s(),
							...O.snippetProps
						}));
						t(a, () => r.child, () => f(e));
					}
					n(e, i);
				}, g = (e) => {
					var i = Ha();
					k(i, () => ({ ...s() }));
					var a = S(i);
					k(a, () => ({ ...f(l) }));
					var o = S(a);
					t(o, () => r.children ?? c), u(a), u(i), n(e, i);
				};
				o(p, (e) => {
					r.child ? e(m) : e(g, -1);
				}), n(e, d);
			},
			$$slots: { popper: !0 }
		}));
	}, oe = (e) => {
		ka(e, b(() => f(A), () => O.popperProps, {
			get ref() {
				return O.opts.ref;
			},
			get open() {
				return O.root.opts.open.current;
			},
			get id() {
				return l();
			},
			get trapFocus() {
				return f(te);
			},
			get preventScroll() {
				return w();
			},
			loop: !0,
			forceMount: !1,
			get customAnchor() {
				return T();
			},
			onOpenAutoFocus: ne,
			get onCloseAutoFocus() {
				return _();
			},
			get shouldRender() {
				return O.shouldRender;
			},
			popper: (e, i) => {
				let a = () => (i?.()).props, s = () => (i?.()).wrapperProps, l = y(() => it(a(), { style: aa("popover") }, { style: r.style }));
				var d = h(), p = D(d), m = (e) => {
					var i = h(), a = D(i);
					{
						let e = y(() => ({
							props: f(l),
							wrapperProps: s(),
							...O.snippetProps
						}));
						t(a, () => r.child, () => f(e));
					}
					n(e, i);
				}, g = (e) => {
					var i = Ha();
					k(i, () => ({ ...s() }));
					var a = S(i);
					k(a, () => ({ ...f(l) }));
					var o = S(a);
					t(o, () => r.children ?? c), u(a), u(i), n(e, i);
				};
				o(p, (e) => {
					r.child ? e(m) : e(g, -1);
				}), n(e, d);
			},
			$$slots: { popper: !0 }
		}));
	};
	o(ie, (e) => {
		d() ? e(ae) : d() || e(oe, 1);
	}), n(e, re), m();
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
]), Ga = s("<button><!></button>");
function Ka(e, r) {
	let i = g();
	a(r, !0);
	let s = j(r, "id", 19, () => Wt(i)), l = j(r, "ref", 15, null), d = j(r, "type", 3, "button"), p = j(r, "disabled", 3, !1), _ = j(r, "openOnHover", 3, !1), v = j(r, "openDelay", 3, 700), b = j(r, "closeDelay", 3, 300), x = E(r, Wa), C = za.create({
		id: M(() => s()),
		ref: M(() => l(), (e) => l(e)),
		disabled: M(() => !!p()),
		openOnHover: M(() => _()),
		openDelay: M(() => v()),
		closeDelay: M(() => b())
	}), w = y(() => it(x, C.props, { type: d() }));
	ba(e, {
		get id() {
			return s();
		},
		get ref() {
			return C.opts.ref;
		},
		children: (e, i) => {
			var a = h(), s = D(a), l = (e) => {
				var i = h(), a = D(i);
				t(a, () => r.child, () => ({ props: f(w) })), n(e, i);
			}, d = (e) => {
				var i = Ga();
				k(i, () => ({ ...f(w) }));
				var a = S(i);
				t(a, () => r.children ?? c), u(i), n(e, i);
			};
			o(s, (e) => {
				r.child ? e(l) : e(d, -1);
			}), n(e, a);
		},
		$$slots: { default: !0 }
	}), m();
}
// node_modules/bits-ui/dist/bits/popover/components/popover.svelte
function qa(e, r) {
	a(r, !0);
	let i = j(r, "open", 15, !1), o = j(r, "onOpenChange", 3, R), s = j(r, "onOpenChangeComplete", 3, R);
	Ra.create({
		open: M(() => i(), (e) => {
			i(e), o()(e);
		}),
		onOpenChangeComplete: M(() => s())
	}), ya(e, {
		children: (e, i) => {
			var a = h(), o = D(a);
			t(o, () => r.children ?? c), n(e, a);
		},
		$$slots: { default: !0 }
	}), m();
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
export { to as a, io as c, Ka as d, Ua as f, M as h, ro as i, Ja as l, Jt as m, ao as n, ho as o, $t as p, mo as r, po as s, $ as t, qa as u };
