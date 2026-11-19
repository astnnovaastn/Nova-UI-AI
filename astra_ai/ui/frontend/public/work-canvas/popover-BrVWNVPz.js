import { $ as e, At as t, Ct as n, H as r, I as i, L as a, M as o, Mt as s, Nt as c, Ot as l, Tt as u, U as d, V as f, W as p, Wt as m, Z as h, a as g, bt as _, dt as v, gt as y, ht as b, i as x, it as S, jt as C, kt as w, mt as T, n as E, r as D, rt as ee, st as O, tt as k, ut as A, vt as j, w as te, z as ne } from "./index-client-DH73-vTM.js";
import "./disclose-version-7ONGmeVC.js";
import { n as re } from "./index-client-AzfegT-i.js";
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte-toolbelt/dist/utils/is.js
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte-toolbelt/dist/box/box-extras.svelte.js
var ce = Symbol("box"), le = Symbol("is-writable");
function M(e, t) {
	let r = n(e);
	return t ? {
		[ce]: !0,
		[le]: !0,
		get current() {
			return k(r);
		},
		set current(e) {
			t(e);
		}
	} : {
		[ce]: !0,
		get current() {
			return e();
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
function N(e) {
	let t = _(y(e));
	return {
		[ce]: !0,
		[le]: !0,
		get current() {
			return k(t);
		},
		set current(e) {
			j(t, e, !0);
		}
	};
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte-toolbelt/dist/box/box.svelte.js
function he(e) {
	let t = _(y(e));
	return {
		[ce]: !0,
		[le]: !0,
		get current() {
			return k(t);
		},
		set current(e) {
			j(t, e, !0);
		}
	};
}
he.from = fe, he.with = M, he.flatten = pe, he.readonly = me, he.isBox = ue, he.isWritableBox = de;
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte-toolbelt/dist/utils/compose-handlers.js
function ge(...e) {
	return function(t) {
		for (let n of e) if (n) {
			if (t.defaultPrevented) return;
			typeof n == "function" ? n.call(this, t) : n.current?.call(this, t);
		}
	};
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/inline-style-parser/esm/index.mjs
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/style-to-object/esm/index.mjs
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte-toolbelt/dist/utils/strings.js
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte-toolbelt/dist/utils/css-to-style-obj.js
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte-toolbelt/dist/utils/execute-callbacks.js
function Xe(...e) {
	return (...t) => {
		for (let n of e) typeof n == "function" && n(...t);
	};
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte-toolbelt/dist/utils/style-to-css.js
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte-toolbelt/dist/utils/style.js
function nt(e = {}) {
	return tt(e).replace("\n", " ");
}
var rt = new Set(/* @__PURE__ */ "onabort.onanimationcancel.onanimationend.onanimationiteration.onanimationstart.onauxclick.onbeforeinput.onbeforetoggle.onblur.oncancel.oncanplay.oncanplaythrough.onchange.onclick.onclose.oncompositionend.oncompositionstart.oncompositionupdate.oncontextlost.oncontextmenu.oncontextrestored.oncopy.oncuechange.oncut.ondblclick.ondrag.ondragend.ondragenter.ondragleave.ondragover.ondragstart.ondrop.ondurationchange.onemptied.onended.onerror.onfocus.onfocusin.onfocusout.onformdata.ongotpointercapture.oninput.oninvalid.onkeydown.onkeypress.onkeyup.onload.onloadeddata.onloadedmetadata.onloadstart.onlostpointercapture.onmousedown.onmouseenter.onmouseleave.onmousemove.onmouseout.onmouseover.onmouseup.onpaste.onpause.onplay.onplaying.onpointercancel.onpointerdown.onpointerenter.onpointerleave.onpointermove.onpointerout.onpointerover.onpointerup.onprogress.onratechange.onreset.onresize.onscroll.onscrollend.onsecuritypolicyviolation.onseeked.onseeking.onselect.onselectionchange.onselectstart.onslotchange.onstalled.onsubmit.onsuspend.ontimeupdate.ontoggle.ontouchcancel.ontouchend.ontouchmove.ontouchstart.ontransitioncancel.ontransitionend.ontransitionrun.ontransitionstart.onvolumechange.onwaiting.onwebkitanimationend.onwebkitanimationiteration.onwebkitanimationstart.onwebkittransitionend.onwheel".split("."));
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte-toolbelt/dist/utils/merge-props.js
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
					r && a ? t[e] = te(n, i) : r ? t[e] = te(n) : a && (t[e] = te(i));
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/runed/dist/internal/configurable-globals.js
var ot = typeof window < "u" ? window : void 0;
typeof window < "u" && window.document, typeof window < "u" && window.navigator, typeof window < "u" && window.location;
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/runed/dist/internal/utils/dom.js
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
		t !== void 0 && (this.#e = n, this.#t = u((e) => {
			let n = h(t, "focusin", e), r = h(t, "focusout", e);
			return () => {
				n(), r();
			};
		}));
	}
	get current() {
		return this.#t?.(), this.#e ? st(this.#e) : null;
	}
}();
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/runed/dist/internal/utils/is.js
function ct(e) {
	return typeof e == "function";
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/runed/dist/utilities/context/context.js
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
		return t(this.#t);
	}
	get() {
		let e = w(this.#t);
		if (e === void 0) throw Error(`Context "${this.#e}" not found`);
		return e;
	}
	getOr(e) {
		let t = w(this.#t);
		return t === void 0 ? e : t;
	}
	set(e) {
		return c(this.#t, e);
	}
};
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/runed/dist/utilities/watch/watch.svelte.js
function lt(e, t) {
	switch (e) {
		case "post":
			A(t);
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
		let r = S(() => n(t, o));
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/runed/dist/internal/utils/get.js
function ft(e) {
	return ct(e) ? e() : e;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/runed/dist/utilities/element-size/element-size.svelte.js
var pt = class {
	#e = {
		width: 0,
		height: 0
	};
	#t = !1;
	#n;
	#r;
	#i;
	#a = n(() => (k(this.#s)?.(), this.getSize().width));
	#o = n(() => (k(this.#s)?.(), this.getSize().height));
	#s = n(() => {
		let e = ft(this.#r);
		if (e) return u((t) => {
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
		return k(this.#s)?.(), this.getSize();
	}
	get width() {
		return k(this.#a);
	}
	get height() {
		return k(this.#o);
	}
};
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte-toolbelt/dist/utils/on-destroy-effect.svelte.js
function I(e) {
	A(() => () => {
		e();
	});
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte-toolbelt/dist/utils/after-sleep.js
function mt(e, t) {
	return setTimeout(t, e);
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte-toolbelt/dist/utils/after-tick.js
function L(e) {
	ee().then(e);
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte-toolbelt/dist/utils/dom.js
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte-toolbelt/dist/utils/dom-context.svelte.js
var Dt = class {
	element;
	#e = n(() => this.element.current ? this.element.current.getRootNode() ?? document : document);
	get root() {
		return k(this.#e);
	}
	set root(e) {
		j(this.#e, e);
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte-toolbelt/dist/utils/attach-ref.js
function R(t, n) {
	return { [e()]: (e) => ue(t) ? (t.current = e, S(() => n?.(e)), () => {
		"isConnected" in e && e.isConnected || (t.current = null, n?.(null));
	}) : (t(e), S(() => n?.(e)), () => {
		"isConnected" in e && e.isConnected || (t(null), n?.(null));
	}) };
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/attrs.js
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/kbd-constants.js
var Ft = "ArrowDown", It = "ArrowLeft", Lt = "ArrowRight", Rt = "ArrowUp", zt = "Enter", Bt = "Home", Vt = "PageDown", Ht = "PageUp";
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/locale.js
function Ut(e) {
	return window.getComputedStyle(e).getPropertyValue("direction");
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/get-directional-keys.js
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/is.js
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/roving-focus-group.js
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
	#r = _(!1);
	#i = _(void 0);
	#a = !1;
	#o = null;
	constructor(e) {
		this.#e = e, j(this.#r, e.open.current, !0), this.#t = e.enabled ?? !0, this.#n = new an({
			ref: this.#e.ref,
			afterTick: this.#e.open
		}), I(() => this.#s()), F(() => this.#e.open.current, (e) => {
			this.#a ? (this.#s(), !e && this.#e.shouldSkipExitAnimation?.() ? (j(this.#r, !1), j(this.#i, void 0), this.#e.onComplete?.()) : (e && j(this.#r, !0), j(this.#i, e ? "starting" : "ending", !0), e && (this.#o = window.requestAnimationFrame(() => {
				this.#o = null, this.#e.open.current && j(this.#i, void 0);
			})), this.#t ? this.#n.run(() => {
				e === this.#e.open.current && (this.#e.open.current || j(this.#r, !1), j(this.#i, void 0), this.#e.onComplete?.());
			}) : (e || j(this.#r, !1), j(this.#i, void 0), this.#e.onComplete?.()))) : this.#a = !0;
		});
	}
	get shouldRender() {
		return k(this.#r);
	}
	get transitionStatus() {
		return k(this.#i);
	}
	#s() {
		this.#o !== null && (window.cancelAnimationFrame(this.#o), this.#o = null);
	}
};
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/noop.js
function B() {}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/create-id.js
function sn(e, t) {
	return t === void 0 ? `bits-${e}` : `bits-${e}-${t}`;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/portal/portal-consumer.svelte
function cn(e, t) {
	var n = d(), a = T(n);
	i(a, () => t.children, (e) => {
		var n = d(), i = T(n);
		o(i, () => t.children ?? m), r(e, n);
	}), r(e, n);
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/config/bits-config.js
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/config/prop-resolvers.js
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/portal/portal.svelte
function gn(e, t) {
	s(t, !0);
	let i = hn(() => t.to), c = l(), u = n(p);
	function p() {
		if (!Yt || t.disabled) return null;
		let e = null;
		return e = typeof i.current == "string" ? document.querySelector(i.current) : i.current, e;
	}
	let h;
	function g() {
		h &&= (f(h), null);
	}
	F([() => k(u), () => t.disabled], ([e, n]) => {
		if (!e || n) g();
		else return h = ne(cn, {
			target: e,
			props: { children: t.children },
			context: c
		}), () => {
			g();
		};
	});
	var _ = d(), v = T(_), y = (e) => {
		var n = d(), i = T(n);
		o(i, () => t.children ?? m), r(e, n);
	};
	a(v, (e) => {
		t.disabled && e(y);
	}), r(e, _), C();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/events.js
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
		return h(e, this.eventName, (e) => {
			t(e);
		}, n);
	}
};
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/debounce.js
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/elements.js
function yn(e, t) {
	return e === t || e.contains(t);
}
function bn(e) {
	return e?.ownerDocument ?? document;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/dom.js
function xn(e, t) {
	let { clientX: n, clientY: r } = e, i = t.getBoundingClientRect();
	return n < i.left || n > i.right || r < i.top || r > i.bottom;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/menu/utils.js
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/focus.js
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/is-using-keyboard/is-using-keyboard.svelte.js
var Mn = _(!1), Nn = class e {
	static _refs = 0;
	static _cleanup;
	constructor() {
		A(() => (e._refs === 0 && (e._cleanup = O(() => {
			let e = [], t = (e) => {
				j(Mn, !1);
			};
			return e.push(h(document, "pointerdown", t, { capture: !0 }), h(document, "pointermove", t, { capture: !0 }), h(document, "keydown", (e) => {
				j(Mn, !0);
			}, { capture: !0 })), Xe(...e);
		})), e._refs++, () => {
			e._refs--, e._refs === 0 && (j(Mn, !1), e._cleanup?.());
		}));
	}
	get current() {
		return k(Mn);
	}
	set current(e) {
		j(Mn, e, !0);
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
], Fn = /* #__PURE__ */ Pn.join(","), In = typeof Element > "u", Ln = In ? function() {} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector, Rn = !In && Element.prototype.getRootNode ? function(e) {
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
	var r = Array.prototype.slice.apply(e.querySelectorAll(Fn));
	return t && Ln.call(e, Fn) && r.unshift(e), r = r.filter(n), r;
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
				Ln.call(a, Fn) && n.filter(a) && (t || !e.includes(a)) && r.push(a);
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
	var a = Ln.call(e, "details>summary:first-of-type") ? e.parentElement : e;
	if (Ln.call(a, "details:not([open]) *")) return !0;
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
				if (r.tagName === "LEGEND") return Ln.call(t, "fieldset[disabled] *") ? !0 : !r.contains(e);
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
	return Ln.call(e, Fn) !== !1 && ar(t, e);
}, dr = /* #__PURE__ */ Pn.concat("iframe:not([inert]):not([inert] *)").join(","), fr = function(e, t) {
	if (t ||= {}, !e) throw Error("No node provided");
	return Ln.call(e, dr) !== !1 && ir(t, e);
};
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/tabbable.js
function pr() {
	return {
		getShadowRoot: !0,
		displayCheck: typeof ResizeObserver == "function" && ResizeObserver.toString().includes("[native code]") ? "full" : "none"
	};
}
function mr(e, t) {
	if (!ur(e, pr())) return hr(e, t);
	let n = wt(e), r = cr(n.body, pr());
	t === "prev" && r.reverse();
	let i = r.indexOf(e);
	return i === -1 ? n.body : r.slice(i + 1)[0];
}
function hr(e, t) {
	let n = wt(e);
	if (!fr(e, pr())) return n.body;
	let r = lr(n.body, pr());
	t === "prev" && r.reverse();
	let i = r.indexOf(e);
	return i === -1 ? n.body : r.slice(i + 1).find((e) => ur(e, pr())) ?? n.body;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/arrays.js
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/box-auto-reset.svelte.js
var vr = {
	afterMs: 1e4,
	onChange: B
};
function yr(e, t) {
	let { afterMs: n, onChange: r, getWindow: i } = {
		...vr,
		...t
	}, a = null, o = _(y(e));
	function s() {
		return i().setTimeout(() => {
			j(o, e, !0), r?.(e);
		}, n);
	}
	return A(() => () => {
		a && i().clearTimeout(a);
	}), M(() => k(o), (e) => {
		j(o, e, !0), r?.(e), a && i().clearTimeout(a), a = s();
	});
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/dom-typeahead.svelte.js
var br = class {
	#e;
	#t;
	#n = n(() => this.#e.onMatch ? this.#e.onMatch : (e) => e.focus());
	#r = n(() => this.#e.getCurrentItem ? this.#e.getCurrentItem : this.#e.getActiveElement);
	constructor(e) {
		this.#e = e, this.#t = yr("", {
			afterMs: 1e3,
			getWindow: e.getWindow
		}), this.handleTypeaheadSearch = this.handleTypeaheadSearch.bind(this), this.resetTypeahead = this.resetTypeahead.bind(this);
	}
	handleTypeaheadSearch(e, t) {
		if (!t.length) return;
		this.#t.current = this.#t.current + e;
		let n = k(this.#r)(), r = t.find((e) => e === n)?.textContent?.trim() ?? "", i = gr(t.map((e) => e.textContent?.trim() ?? ""), this.#t.current, r), a = t.find((e) => e.textContent?.trim() === i);
		return a && k(this.#n)(a), a;
	}
	resetTypeahead() {
		this.#t.current = "";
	}
	get search() {
		return this.#t.current;
	}
}, xr = "data-context-menu-trigger", Sr = "data-context-menu-content", Cr = new P("Menu.Root"), wr = new P("Menu.Root | Menu.Sub"), Tr = new P("Menu.Content");
new P("Menu.Group | Menu.RadioGroup"), new P("Menu.RadioGroup");
var Er = new P("Menu.CheckboxGroup"), Dr = new _n("bitsmenuopen", {
	bubbles: !1,
	cancelable: !0
}), Or = Pt({
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
		if (Qt(i) && (t === "content" && r.contains(i) || t === "trigger" && n.contains(i))) return;
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
var Lr = class e {
	static create(t) {
		let n = new e(t);
		return Cr.set(n);
	}
	opts;
	isUsingKeyboard = new Nn();
	#e = _(!1);
	get ignoreCloseAutoFocus() {
		return k(this.#e);
	}
	set ignoreCloseAutoFocus(e) {
		j(this.#e, e, !0);
	}
	#t = _(!1);
	get isPointerInTransit() {
		return k(this.#t);
	}
	set isPointerInTransit(e) {
		j(this.#t, e, !0);
	}
	constructor(e) {
		this.opts = e;
	}
	getBitsAttr = (e) => Or.getAttr(e, this.opts.variant.current);
}, Rr = class e {
	static create(t, n) {
		return wr.set(new e(t, n, null));
	}
	opts;
	root;
	parentMenu;
	contentId = M(() => "");
	#e = _(null);
	get contentNode() {
		return k(this.#e);
	}
	set contentNode(e) {
		j(this.#e, e, !0);
	}
	contentPresence;
	#t = _(null);
	get triggerNode() {
		return k(this.#t);
	}
	set triggerNode(e) {
		j(this.#t, e, !0);
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
}, zr = class e {
	static create(t) {
		return Tr.set(new e(t, wr.get()));
	}
	opts;
	parentMenu;
	rovingFocusGroup;
	domContext;
	attachment;
	#e = _("");
	get search() {
		return k(this.#e);
	}
	set search(e) {
		j(this.#e, e, !0);
	}
	#t = 0;
	#n;
	#r = _(!1);
	get mounted() {
		return k(this.#r);
	}
	set mounted(e) {
		j(this.#r, e, !0);
	}
	#i;
	constructor(e, t) {
		this.opts = e, this.parentMenu = t, this.domContext = new Dt(e.ref), this.attachment = R(this.opts.ref, (e) => {
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
		}).handleTypeaheadSearch, this.rovingFocusGroup = new rn({
			rootNode: M(() => this.parentMenu.contentNode),
			candidateAttr: this.parentMenu.root.getBitsAttr("item"),
			loop: this.opts.loop,
			orientation: M(() => "vertical")
		}), F(() => this.parentMenu.contentNode, (e) => e ? Dr.listen(e, () => {
			L(() => {
				this.parentMenu.root.isUsingKeyboard.current && this.rovingFocusGroup.focusFirstCandidate();
			});
		}) : void 0), A(() => {
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
	#c = n(() => ({ open: this.parentMenu.opts.open.current }));
	get snippetProps() {
		return k(this.#c);
	}
	set snippetProps(e) {
		j(this.#c, e);
	}
	#l = n(() => ({
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
		return k(this.#l);
	}
	set props(e) {
		j(this.#l, e);
	}
	popperProps = { onCloseAutoFocus: (e) => this.onCloseAutoFocus(e) };
}, Br = class {
	opts;
	content;
	attachment;
	#e = _(!1);
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
			e.defaultPrevented || this.opts.disabled.current || j(this.#e, !0);
		});
	}
	onblur(e) {
		L(() => {
			e.defaultPrevented || j(this.#e, !1);
		});
	}
	#t = n(() => ({
		id: this.opts.id.current,
		tabindex: -1,
		role: "menuitem",
		"aria-disabled": Ot(this.opts.disabled.current),
		"data-disabled": kt(this.opts.disabled.current),
		"data-highlighted": k(this.#e) ? "" : void 0,
		[this.content.parentMenu.root.getBitsAttr("item")]: "",
		onpointermove: this.onpointermove,
		onpointerleave: this.onpointerleave,
		onfocus: this.onfocus,
		onblur: this.onblur,
		...this.attachment
	}));
	get props() {
		return k(this.#t);
	}
	set props(e) {
		j(this.#t, e);
	}
}, Vr = class e {
	static create(t) {
		let n = new Br(t, Tr.get());
		return new e(t, n);
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
	#n = n(() => at(this.item.props, {
		onclick: this.onclick,
		onpointerdown: this.onpointerdown,
		onpointerup: this.onpointerup,
		onkeydown: this.onkeydown
	}));
	get props() {
		return k(this.#n);
	}
	set props(e) {
		j(this.#n, e);
	}
}, Hr = class e {
	static create(t) {
		let n = Tr.get(), r = new Br(t, n), i = wr.get();
		return new e(t, r, n, i);
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
			e && Dr.dispatch(e);
		}));
	}
	#n = n(() => at({
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
		return k(this.#n);
	}
	set props(e) {
		j(this.#n, e);
	}
}, Ur = class e {
	static create(t, n) {
		let r = new Vr(t, new Br(t, Tr.get()));
		return new e(t, r, n);
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
	#e = n(() => ({
		checked: this.opts.checked.current,
		indeterminate: this.opts.indeterminate.current
	}));
	get snippetProps() {
		return k(this.#e);
	}
	set snippetProps(e) {
		j(this.#e, e);
	}
	#t = n(() => ({
		...this.item.props,
		role: "menuitemcheckbox",
		"aria-checked": Mt(this.opts.checked.current, this.opts.indeterminate.current),
		"data-state": kn(this.opts.checked.current),
		[this.item.root.getBitsAttr("checkbox-item")]: ""
	}));
	get props() {
		return k(this.#t);
	}
	set props(e) {
		j(this.#t, e);
	}
}, Wr = class e {
	static create(t) {
		return new e(t, Cr.get());
	}
	opts;
	root;
	attachment;
	constructor(e, t) {
		this.opts = e, this.root = t, this.attachment = R(this.opts.ref);
	}
	#e = n(() => ({
		id: this.opts.id.current,
		role: "group",
		[this.root.getBitsAttr("separator")]: "",
		...this.attachment
	}));
	get props() {
		return k(this.#e);
	}
	set props(e) {
		j(this.#e, e);
	}
}, Gr = class e {
	static create(t) {
		return new e(t, wr.get());
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
	#e = n(() => {
		if (this.parentMenu.opts.open.current && this.parentMenu.contentId.current) return this.parentMenu.contentId.current;
	});
	#t = n(() => ({
		id: this.opts.id.current,
		disabled: this.opts.disabled.current,
		"aria-haspopup": "menu",
		"aria-expanded": Ot(this.parentMenu.opts.open.current),
		"aria-controls": k(this.#e),
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
		return k(this.#t);
	}
	set props(e) {
		j(this.#t, e);
	}
}, Kr = class {
	static create(e) {
		let t = wr.get();
		return wr.set(new Rr(e, t.root, t));
	}
};
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/dismissible-layer/use-dismissable-layer.svelte.js
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
		this.opts = e, this.#t = e.interactOutsideBehavior, this.#e = e.onInteractOutside, this.#o = e.onFocusOutside, A(() => {
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
		return Xe(h(this.#a, "pointerdown", Xe(this.#f, this.#m), { capture: !0 }), h(this.#a, "pointerdown", Xe(this.#p, this.#d)), h(this.#a, "focusin", this.#c));
	}
	#u = (e) => {
		let t = e;
		t.defaultPrevented && (t = Zr(e)), this.#e.current(e);
	};
	#d = vn((e) => {
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
		n.defaultPrevented && (n = Zr(n)), this.#t.current !== "close" && this.#t.current !== "defer-otherwise-close" ? this.#s() : e.pointerType === "touch" ? (this.#s(), this.#s = h(this.#a, "click", this.#u, { once: !0 })) : this.#e.current(n);
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
	if (!$t(n)) return !1;
	let r = !!n.closest(`[${xr}]`), i = !!t.closest(`[${Sr}]`);
	return "button" in e && e.button > 0 && !r ? !1 : "button" in e && e.button === 0 && r && i ? !0 : r && i ? !1 : bn(n).documentElement.contains(n) && !yn(t, n) && xn(e, t);
}
function Zr(e) {
	let t = e.currentTarget, n = e.target, r;
	r = e instanceof PointerEvent ? new PointerEvent(e.type, e) : new PointerEvent("pointerdown", e);
	let i = !1;
	return new Proxy(r, { get: (r, a) => a === "currentTarget" ? t : a === "target" ? n : a === "preventDefault" ? () => {
		i = !0, typeof r.preventDefault == "function" && r.preventDefault();
	} : a === "defaultPrevented" ? i : a in r ? r[a] : e[a] });
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/dismissible-layer/dismissible-layer.svelte
function Qr(e, t) {
	s(t, !0);
	let n = D(t, "interactOutsideBehavior", 3, "close"), i = D(t, "onInteractOutside", 3, B), a = D(t, "onFocusOutside", 3, B), c = D(t, "isValidEvent", 3, () => !1), l = qr.create({
		id: M(() => t.id),
		interactOutsideBehavior: M(() => n()),
		onInteractOutside: M(() => i()),
		enabled: M(() => t.enabled),
		onFocusOutside: M(() => a()),
		isValidEvent: M(() => c()),
		ref: t.ref
	});
	var u = d(), f = T(u);
	o(f, () => t.children ?? m, () => ({ props: l.props })), r(e, u), C();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/escape-layer/use-escape-layer.svelte.js
globalThis.bitsEscapeLayers ??= /* @__PURE__ */ new Map();
var $r = class e {
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
	#e = () => h(this.domContext.getDocument(), "keydown", this.#t, { passive: !1 });
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/escape-layer/escape-layer.svelte
function ti(e, t) {
	s(t, !0);
	let n = D(t, "escapeKeydownBehavior", 3, "close"), i = D(t, "onEscapeKeydown", 3, B);
	$r.create({
		escapeKeydownBehavior: M(() => n()),
		onEscapeKeydown: M(() => i()),
		enabled: M(() => t.enabled),
		ref: t.ref
	});
	var a = d(), c = T(a);
	o(c, () => t.children ?? m), r(e, a), C();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/focus-scope/focus-scope-manager.js
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
		this.#r.push(h(t, "focusin", (t) => {
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
		}, { capture: !0 }), h(e, "keydown", (e) => {
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/focus-scope/focus-scope.svelte
function ii(e, t) {
	s(t, !0);
	let n = D(t, "enabled", 3, !1), i = D(t, "trapFocus", 3, !1), a = D(t, "loop", 3, !1), c = D(t, "onCloseAutoFocus", 3, B), l = D(t, "onOpenAutoFocus", 3, B), u = ri.use({
		enabled: M(() => n()),
		trap: M(() => i()),
		loop: a(),
		onCloseAutoFocus: M(() => c()),
		onOpenAutoFocus: M(() => l()),
		ref: t.ref
	});
	var f = d(), p = T(f);
	o(p, () => t.focusScope ?? m, () => ({ props: u.props })), r(e, f), C();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/text-selection-layer/use-text-selection-layer.svelte.js
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
		return Xe(h(this.domContext.getDocument(), "pointerdown", this.#o), h(this.domContext.getDocument(), "pointerup", ge(this.#s, this.#a)));
	}
	#a = (e) => {
		this.#r(e);
	};
	#o = (e) => {
		let t = this.opts.ref.current, n = e.target;
		z(t) && z(n) && this.#t && ui(this) && Ct(t, n) && (this.#n(e), e.defaultPrevented || (this.#e = ci(t, this.domContext.getDocument().body)));
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/text-selection-layer/text-selection-layer.svelte
function di(e, t) {
	s(t, !0);
	let n = D(t, "preventOverflowTextSelection", 3, !0), i = D(t, "onPointerDown", 3, B), a = D(t, "onPointerUp", 3, B);
	oi.create({
		id: M(() => t.id),
		onPointerDown: M(() => i()),
		onPointerUp: M(() => a()),
		enabled: M(() => t.enabled && n()),
		ref: t.ref
	});
	var c = d(), l = T(c);
	o(l, () => t.children ?? m), r(e, c), C();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/use-id.js
globalThis.bitsIdCounter ??= { current: 0 };
function fi(e = "bits") {
	return globalThis.bitsIdCounter.current++, `${e}-${globalThis.bitsIdCounter.current}`;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/shared-state.svelte.js
var pi = class {
	#e;
	#t = 0;
	#n = _();
	#r;
	constructor(e) {
		this.#e = e;
	}
	#i() {
		--this.#t, this.#r && this.#t <= 0 && (this.#r(), j(this.#n, void 0), this.#r = void 0);
	}
	get(...e) {
		return this.#t += 1, k(this.#n) === void 0 && (this.#r = O(() => {
			j(this.#n, this.#e(...e), !0);
		})), A(() => () => {
			this.#i();
		}), k(this.#n);
	}
}, mi = new re(), hi = _(null), gi = null, _i = null, vi = !1, yi = M(() => {
	for (let e of mi.values()) if (e) return !0;
	return !1;
}), bi = null, xi = new pi(() => {
	function e() {
		document.body.setAttribute("style", k(hi) ?? ""), document.body.style.removeProperty("--scrollbar-width"), Xt && gi?.(), j(hi, null);
	}
	function t() {
		_i !== null && (window.clearTimeout(_i), _i = null);
	}
	function n(e, n) {
		t(), vi = !0, bi = Date.now();
		let r = bi, i = () => {
			_i = null, bi === r && (Ci(mi) ? vi = !1 : (vi = !1, n()));
		}, a = e === null ? 24 : e;
		_i = window.setTimeout(i, a);
	}
	function r() {
		k(hi) === null && mi.size === 0 && !vi && j(hi, document.body.getAttribute("style"), !0);
	}
	return F(() => yi.current, () => {
		if (!yi.current) return;
		r(), vi = !1;
		let e = getComputedStyle(document.documentElement), t = getComputedStyle(document.body), n = e.scrollbarGutter?.includes("stable") || t.scrollbarGutter?.includes("stable"), i = window.innerWidth - document.documentElement.clientWidth, a = {
			padding: Number.parseInt(t.paddingRight ?? "0", 10) + i,
			margin: Number.parseInt(t.marginRight ?? "0", 10)
		};
		i > 0 && !n && (document.body.style.paddingRight = `${a.padding}px`, document.body.style.marginRight = `${a.margin}px`, document.body.style.setProperty("--scrollbar-width", `${i}px`)), document.body.style.overflow = "hidden", Xt && (gi = h(document, "touchmove", (e) => {
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
		resetBodyStyle: e,
		scheduleCleanupIfNoNewLocks: n,
		cancelPendingCleanup: t,
		ensureInitialStyleCaptured: r
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/scroll-lock/scroll-lock.svelte
function wi(e, t) {
	s(t, !0);
	let n = D(t, "preventScroll", 3, !0), r = D(t, "restoreScrollDelay", 3, null);
	n() && new Si(n(), () => r()), C();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
var Ti = [
	"top",
	"right",
	"bottom",
	"left"
], H = Math.min, U = Math.max, Ei = Math.round, Di = Math.floor, W = (e) => ({
	x: e,
	y: e
}), Oi = {
	left: "right",
	right: "left",
	bottom: "top",
	top: "bottom"
};
function ki(e, t, n) {
	return U(e, H(t, n));
}
function G(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function K(e) {
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
function q(e) {
	let t = e[0];
	return t === "t" || t === "b" ? "y" : "x";
}
function Ni(e) {
	return ji(q(e));
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
	let i = Ai(e), a = Vi(K(e), n === "start", r);
	return i && (a = a.map((e) => e + "-" + i), t && (a = a.concat(a.map(Ii)))), a;
}
function Ui(e) {
	let t = K(e);
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/@floating-ui/core/dist/floating-ui.core.mjs
function qi(e, t, n) {
	let { reference: r, floating: i } = e, a = q(t), o = Ni(t), s = Mi(o), c = K(t), l = a === "y", u = r.x + r.width / 2 - i.width / 2, d = r.y + r.height / 2 - i.height / 2, f = r[s] / 2 - i[s] / 2, p;
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
	let { x: n, y: r, platform: i, rects: a, elements: o, strategy: s } = e, { boundary: c = "clippingAncestors", rootBoundary: l = "viewport", elementContext: u = "floating", altBoundary: d = !1, padding: f = 0 } = G(t, e), p = Gi(f), m = o[d ? u === "floating" ? "reference" : "floating" : u], h = Ki(await i.getClippingRect({
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
		let { x: n, y: r, placement: i, rects: a, platform: o, elements: s, middlewareData: c } = t, { element: l, padding: u = 0 } = G(e, t) || {};
		if (l == null) return {};
		let d = Gi(u), f = {
			x: n,
			y: r
		}, p = Ni(i), m = Mi(p), h = await o.getDimensions(l), g = p === "y", _ = g ? "top" : "left", v = g ? "bottom" : "right", y = g ? "clientHeight" : "clientWidth", b = a.reference[m] + a.reference[p] - f[p] - a.floating[m], x = f[p] - a.reference[p], S = await (o.getOffsetParent == null ? void 0 : o.getOffsetParent(l)), C = S ? S[y] : 0;
		C && await (o.isElement == null ? void 0 : o.isElement(S)) || (C = s.floating[y] || a.floating[m]);
		let w = b / 2 - x / 2, T = C / 2 - h[m] / 2 - 1, E = H(d[_], T), D = H(d[v], T), ee = C - h[m] - D, O = C / 2 - h[m] / 2 + w, k = ki(E, O, ee), A = !c.arrow && Ai(i) != null && O !== k && a.reference[m] / 2 - (O < E ? E : D) - h[m] / 2 < 0, j = A ? O < E ? O - E : O - ee : 0;
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
}), Qi = function(e) {
	return e === void 0 && (e = {}), {
		name: "flip",
		options: e,
		async fn(t) {
			var n;
			let { placement: r, middlewareData: i, rects: a, initialPlacement: o, platform: s, elements: c } = t, { mainAxis: l = !0, crossAxis: u = !0, fallbackPlacements: d, fallbackStrategy: f = "bestFit", fallbackAxisSideDirection: p = "none", flipAlignment: m = !0, ...h } = G(e, t);
			if ((n = i.arrow) != null && n.alignmentOffset) return {};
			let g = K(r), _ = q(o), v = K(o) === o, y = await (s.isRTL == null ? void 0 : s.isRTL(c.floating)), b = d || (v || !m ? [Ui(o)] : Fi(o)), x = p !== "none";
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
				if (t && (u !== "alignment" || _ === q(t) || T.every((e) => q(e.placement) !== _ || e.overflows[0] > 0))) return {
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
								let t = q(e.placement);
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
			let { rects: n, platform: r } = t, { strategy: i = "referenceHidden", ...a } = G(e, t);
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
	let { placement: n, platform: r, elements: i } = e, a = await (r.isRTL == null ? void 0 : r.isRTL(i.floating)), o = K(n), s = Ai(n), c = q(n) === "y", l = na.has(o) ? -1 : 1, u = a && c ? -1 : 1, d = G(t, e), { mainAxis: f, crossAxis: p, alignmentAxis: m } = typeof d == "number" ? {
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
			} }, ...l } = G(e, t), u = {
				x: n,
				y: r
			}, d = await a.detectOverflow(t, l), f = q(i), p = ji(f), m = u[p], h = u[f], g = (e, t) => ki(t + d[e === "y" ? "top" : "left"], t, t - d[e === "y" ? "bottom" : "right"]);
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
			let { x: n, y: r, placement: i, rects: a, middlewareData: o } = t, { offset: s = 0, mainAxis: c = !0, crossAxis: l = !0 } = G(e, t), u = {
				x: n,
				y: r
			}, d = q(i), f = ji(d), p = u[f], m = u[d], h = G(s, t), g = typeof h == "number" ? {
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
				let e = f === "y" ? "width" : "height", t = na.has(K(i)), n = a.reference[d] - a.floating[e] + (t && o.offset?.[d] || 0) + (t ? 0 : g.crossAxis), r = a.reference[d] + a.reference[e] + (t ? 0 : o.offset?.[d] || 0) - (t ? g.crossAxis : 0);
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
			let { placement: n, rects: r, platform: i, elements: a } = t, { apply: o = () => {}, ...s } = G(e, t), c = await i.detectOverflow(t, s), l = K(n), u = Ai(n), d = q(n) === "y", { width: f, height: p } = r.floating, m, h;
			l === "top" || l === "bottom" ? (m = l, h = u === (await (i.isRTL == null ? void 0 : i.isRTL(a.floating)) ? "start" : "end") ? "left" : "right") : (h = l, m = u === "end" ? "top" : "bottom");
			let g = p - c.top - c.bottom, _ = f - c.left - c.right, v = H(p - c[m], g), y = H(f - c[h], _), b = t.middlewareData.shift, x = !b, S = v, C = y;
			b != null && b.enabled.x && (C = _), b != null && b.enabled.y && (S = g), x && !u && (d ? C = f - 2 * U(c.left, c.right) : S = p - 2 * U(c.top, c.bottom)), await o({
				...t,
				availableWidth: C,
				availableHeight: S
			});
			let w = await i.getDimensions(a.floating);
			return f !== w.width || p !== w.height ? { reset: { rects: !0 } } : {};
		}
	};
};
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function ca() {
	return typeof window < "u";
}
function la(e) {
	return ua(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function J(e) {
	var t;
	return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function Y(e) {
	return ((ua(e) ? e.ownerDocument : e.document) || window.document)?.documentElement;
}
function ua(e) {
	return ca() ? e instanceof Node || e instanceof J(e).Node : !1;
}
function X(e) {
	return ca() ? e instanceof Element || e instanceof J(e).Element : !1;
}
function Z(e) {
	return ca() ? e instanceof HTMLElement || e instanceof J(e).HTMLElement : !1;
}
function da(e) {
	return !ca() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof J(e).ShadowRoot;
}
function fa(e) {
	let { overflow: t, overflowX: n, overflowY: r, display: i } = Q(e);
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
	let t = X(e) ? Q(e) : e;
	return _a(t.transform) || _a(t.translate) || _a(t.scale) || _a(t.rotate) || _a(t.perspective) || !xa() && (_a(t.backdropFilter) || _a(t.filter)) || ha.test(t.willChange || "") || ga.test(t.contain || "");
}
function ba(e) {
	let t = wa(e);
	for (; Z(t) && !Sa(t);) {
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
function Q(e) {
	return J(e).getComputedStyle(e);
}
function Ca(e) {
	return X(e) ? {
		scrollLeft: e.scrollLeft,
		scrollTop: e.scrollTop
	} : {
		scrollLeft: e.scrollX,
		scrollTop: e.scrollY
	};
}
function wa(e) {
	if (la(e) === "html") return e;
	let t = e.assignedSlot || e.parentNode || da(e) && e.host || Y(e);
	return da(t) ? t.host : t;
}
function Ta(e) {
	let t = wa(e);
	return Sa(t) ? (e.ownerDocument || e).body : Z(t) && fa(t) ? t : Ta(t);
}
function Ea(e, t, n) {
	t === void 0 && (t = []), n === void 0 && (n = !0);
	let r = Ta(e), i = r === e.ownerDocument?.body, a = J(r);
	if (i) {
		let e = Da(a);
		return t.concat(a, a.visualViewport || [], fa(r) ? r : [], e && n ? Ea(e) : []);
	}
	return t.concat(r, Ea(r, [], n));
}
function Da(e) {
	return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function Oa(e) {
	let t = Q(e), n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0, i = Z(e), a = i ? e.offsetWidth : n, o = i ? e.offsetHeight : r, s = Ei(n) !== a || Ei(r) !== o;
	return s && (n = a, r = o), {
		width: n,
		height: r,
		$: s
	};
}
function ka(e) {
	return X(e) ? e : e.contextElement;
}
function Aa(e) {
	let t = ka(e);
	if (!Z(t)) return W(1);
	let n = t.getBoundingClientRect(), { width: r, height: i, $: a } = Oa(t), o = (a ? Ei(n.width) : n.width) / r, s = (a ? Ei(n.height) : n.height) / i;
	return o && Number.isFinite(o) || (o = 1), s && Number.isFinite(s) || (s = 1), {
		x: o,
		y: s
	};
}
var ja = /*#__PURE__*/ W(0);
function Ma(e) {
	let t = J(e);
	return !xa() || !t.visualViewport ? ja : {
		x: t.visualViewport.offsetLeft,
		y: t.visualViewport.offsetTop
	};
}
function Na(e, t, n) {
	return t === void 0 && (t = !1), !!n && t && n === J(e);
}
function $(e, t, n, r) {
	t === void 0 && (t = !1), n === void 0 && (n = !1);
	let i = e.getBoundingClientRect(), a = ka(e), o = W(1);
	t && (r ? X(r) && (o = Aa(r)) : o = Aa(e));
	let s = Na(a, n, r) ? Ma(a) : W(0), c = (i.left + s.x) / o.x, l = (i.top + s.y) / o.y, u = i.width / o.x, d = i.height / o.y;
	if (a && r) {
		let e = J(a), t = X(r) ? J(r) : r, n = e, i = Da(n);
		for (; i && t !== n;) {
			let e = Aa(i), t = i.getBoundingClientRect(), r = Q(i), a = t.left + (i.clientLeft + parseFloat(r.paddingLeft)) * e.x, o = t.top + (i.clientTop + parseFloat(r.paddingTop)) * e.y;
			c *= e.x, l *= e.y, u *= e.x, d *= e.y, c += a, l += o, n = J(i), i = Da(n);
		}
	}
	return Ki({
		width: u,
		height: d,
		x: c,
		y: l
	});
}
function Pa(e, t) {
	let n = Ca(e).scrollLeft;
	return t ? t.left + n : $(Y(e)).left + n;
}
function Fa(e, t) {
	let n = e.getBoundingClientRect();
	return {
		x: n.left + t.scrollLeft - Pa(e, n),
		y: n.top + t.scrollTop
	};
}
function Ia(e) {
	let { elements: t, rect: n, offsetParent: r, strategy: i } = e, a = i === "fixed", o = Y(r), s = t ? ma(t.floating) : !1;
	if (r === o || s && a) return n;
	let c = {
		scrollLeft: 0,
		scrollTop: 0
	}, l = W(1), u = W(0), d = Z(r);
	if ((d || !a) && ((la(r) !== "body" || fa(o)) && (c = Ca(r)), d)) {
		let e = $(r);
		l = Aa(r), u.x = e.x + r.clientLeft, u.y = e.y + r.clientTop;
	}
	let f = o && !d && !a ? Fa(o, c) : W(0);
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
	let t = Ca(e), n = e.ownerDocument.body, r = U(e.scrollWidth, e.clientWidth, n.scrollWidth, n.clientWidth), i = U(e.scrollHeight, e.clientHeight, n.scrollHeight, n.clientHeight), a = -t.scrollLeft + Pa(e), o = -t.scrollTop;
	return Q(n).direction === "rtl" && (a += U(e.clientWidth, n.clientWidth) - r), {
		width: r,
		height: i,
		x: a,
		y: o
	};
}
var za = 25;
function Ba(e, t, n) {
	n === void 0 && (n = "viewport");
	let r = n === "layoutViewport", i = J(e), a = Y(e), o = i.visualViewport, s = a.clientWidth, c = a.clientHeight, l = 0, u = 0;
	if (o) {
		let e = !xa() || t === "fixed";
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
	let n = $(e, !0, t === "fixed"), r = n.top + e.clientTop, i = n.left + e.clientLeft, a = Aa(e);
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
	else if (t === "document") r = Ra(Y(e));
	else if (X(t)) r = Va(t, n);
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
function Ua(e, t) {
	let n = t.get(e);
	if (n) return n;
	let r = Ea(e, [], !1).filter((e) => X(e) && la(e) !== "body"), i = null, a = Q(e).position === "fixed", o = a ? wa(e) : e;
	for (; X(o) && !Sa(o);) {
		let e = Q(o), t = ya(o), n = i ? i.position : a ? "fixed" : "";
		!t && (n === "fixed" || n === "absolute" && e.position === "static") ? r = r.filter((e) => e !== o) : i = e, o = wa(o);
	}
	return t.set(e, r), r;
}
function Wa(e) {
	let { element: t, boundary: n, rootBoundary: r, strategy: i } = e, a = [...n === "clippingAncestors" ? ma(t) ? [] : Ua(t, this._c) : [].concat(n), r], o = Ha(t, a[0], i), s = o.top, c = o.right, l = o.bottom, u = o.left;
	for (let e = 1; e < a.length; e++) {
		let n = Ha(t, a[e], i);
		s = U(n.top, s), c = H(n.right, c), l = H(n.bottom, l), u = U(n.left, u);
	}
	return {
		width: c - u,
		height: l - s,
		x: u,
		y: s
	};
}
function Ga(e) {
	let { width: t, height: n } = Oa(e);
	return {
		width: t,
		height: n
	};
}
function Ka(e, t, n) {
	let r = Z(t), i = Y(t), a = n === "fixed", o = $(e, !0, a, t), s = {
		scrollLeft: 0,
		scrollTop: 0
	}, c = W(0);
	if ((r || !a) && ((la(t) !== "body" || fa(i)) && (s = Ca(t)), r)) {
		let e = $(t, !0, a, t);
		c.x = e.x + t.clientLeft, c.y = e.y + t.clientTop;
	}
	!r && i && (c.x = Pa(i));
	let l = i && !r && !a ? Fa(i, s) : W(0);
	return {
		x: o.left + s.scrollLeft - c.x - l.x,
		y: o.top + s.scrollTop - c.y - l.y,
		width: o.width,
		height: o.height
	};
}
function qa(e) {
	return Q(e).position === "static";
}
function Ja(e, t) {
	if (!Z(e) || Q(e).position === "fixed") return null;
	if (t) return t(e);
	let n = e.offsetParent;
	return Y(e) === n && (n = n.ownerDocument.body), n;
}
function Ya(e, t) {
	let n = J(e);
	if (ma(e)) return n;
	if (!Z(e)) {
		let t = wa(e);
		for (; t && !Sa(t);) {
			if (X(t) && !qa(t)) return t;
			t = wa(t);
		}
		return n;
	}
	let r = Ja(e, t);
	for (; r && pa(r) && qa(r);) r = Ja(r, t);
	return r && Sa(r) && qa(r) && !ya(r) ? n : r || ba(e) || n;
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
	return Q(e).direction === "rtl";
}
var Qa = {
	convertOffsetParentRelativeRectToViewportRelativeRect: Ia,
	getDocumentElement: Y,
	getClippingRect: Wa,
	getOffsetParent: Ya,
	getElementRects: Xa,
	getClientRects: La,
	getDimensions: Ga,
	getScale: Aa,
	isElement: X,
	isRTL: Za
};
function $a(e, t) {
	return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function eo(e, t, n) {
	let r = null, i, a = Y(e);
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
			threshold: U(0, H(1, c)) || 1
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
	let c = J(e), l = () => s(n);
	return c.addEventListener("resize", l), s(!0), () => {
		c.removeEventListener("resize", l), o();
	};
}
function to(e, t, n, r) {
	r === void 0 && (r = {});
	let { ancestorScroll: i = !0, ancestorResize: a = !0, elementResize: o = typeof ResizeObserver == "function", layoutShift: s = typeof IntersectionObserver == "function", animationFrame: c = !1 } = r, l = ka(e), u = i || a ? [...l ? Ea(l) : [], ...t ? Ea(t) : []] : [];
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
	let m, h = c ? $(e) : null;
	c && g();
	function g() {
		let t = $(e);
		h && !$a(h, t) && n(), h = t, m = requestAnimationFrame(g);
	}
	return n(), () => {
		var e;
		u.forEach((e) => {
			i && e.removeEventListener("scroll", n), a && e.removeEventListener("resize", n);
		}), d?.(), (e = p) == null || e.disconnect(), p = null, c && cancelAnimationFrame(m);
	};
}
var no = ia, ro = aa, io = Qi, ao = sa, oo = ta, so = Zi, co = oa, lo = (e, t, n) => {
	let r = /* @__PURE__ */ new Map(), i = n ?? {}, a = {
		...Qa,
		...i.platform,
		_c: r
	};
	return Xi(e, t, {
		...i,
		platform: a
	});
};
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/floating-svelte/floating-utils.svelte.js
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/internal/floating-svelte/use-floating.svelte.js
function ho(e) {
	let t = e.whileElementsMounted, r = n(() => uo(e.open) ?? !0), i = n(() => uo(e.middleware)), a = n(() => uo(e.transform) ?? !0), o = n(() => uo(e.placement) ?? "bottom"), s = n(() => uo(e.strategy) ?? "absolute"), c = n(() => uo(e.sideOffset) ?? 0), l = n(() => uo(e.alignOffset) ?? 0), u = e.reference, d = _(0), f = _(0), p = N(null), m = _(y(k(s))), h = _(y(k(o))), g = _(y({})), v = _(!1), b = !1, x = 0, S = n(() => {
		let e = p.current ? po(p.current, k(d)) : k(d), t = p.current ? po(p.current, k(f)) : k(f);
		return k(a) ? {
			position: k(m),
			left: "0",
			top: "0",
			transform: `translate(${e}px, ${t}px)`,
			...p.current && fo(p.current) >= 1.5 && { willChange: "transform" }
		} : {
			position: k(m),
			left: `${e}px`,
			top: `${t}px`
		};
	}), C;
	function w() {
		if (u.current === null || p.current === null) return;
		let e = u.current, t = p.current, n = ++x;
		lo(e, t, {
			middleware: k(i),
			placement: k(o),
			strategy: k(s)
		}).then((i) => {
			if (n === x && u.current === e && p.current === t) {
				if (go(e)) j(g, {
					...k(g),
					hide: {
						...k(g).hide,
						referenceHidden: !0
					}
				}, !0);
				else {
					if (!k(r) && k(d) !== 0 && k(f) !== 0) {
						let e = Math.max(Math.abs(k(c)), Math.abs(k(l)), 15);
						if (i.x <= e && i.y <= e) return;
					}
					j(d, i.x, !0), j(f, i.y, !0), j(m, i.strategy, !0), j(h, i.placement, !0), j(g, i.middlewareData, !0), j(v, !0);
				}
			}
		});
	}
	function T() {
		typeof C == "function" && (C(), C = void 0), x++;
	}
	function E() {
		T(), t === void 0 ? w() : k(r) && u.current !== null && p.current !== null && (C = t(u.current, p.current, w));
	}
	function D() {
		!k(r) && p.current === null && j(v, !1);
	}
	function ee() {
		return [
			k(i),
			k(o),
			k(s),
			k(c),
			k(l),
			k(r)
		];
	}
	return A(() => {
		t === void 0 && k(r) && w();
	}), A(E), A(() => {
		t !== void 0 && (ee(), k(r) && k(v) ? b ? w() : b = !0 : b = !1);
	}), A(D), A(() => T), {
		floating: p,
		reference: u,
		get strategy() {
			return k(m);
		},
		get placement() {
			return k(h);
		},
		get middlewareData() {
			return k(g);
		},
		get isPositioned() {
			return k(v);
		},
		get floatingStyles() {
			return k(S);
		},
		get update() {
			return w;
		}
	};
}
function go(e) {
	return e instanceof Element ? !e.isConnected || e instanceof HTMLElement && e.hidden ? !0 : e.getClientRects().length === 0 : !1;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/floating-layer/use-floating-layer.svelte.js
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
		A(() => {
			this.customAnchorNode.current ? typeof this.customAnchorNode.current == "string" ? this.anchorNode.current = document.querySelector(this.customAnchorNode.current) : this.anchorNode.current = this.customAnchorNode.current : this.anchorNode.current = this.triggerNode.current;
		});
	}
}, So = class e {
	static create(t, n = !1) {
		return n ? yo.set(new e(t, bo.get())) : yo.set(new e(t, vo.get()));
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
	#e = n(() => {
		if (typeof this.opts.style == "string") return Ye(this.opts.style);
		if (!this.opts.style) return {};
	});
	#t = void 0;
	#n = new pt(() => this.arrowRef.current ?? void 0);
	#r = n(() => this.#n?.width ?? 0);
	#i = n(() => this.#n?.height ?? 0);
	#a = n(() => this.opts.side?.current + (this.opts.align.current === "center" ? "" : `-${this.opts.align.current}`));
	#o = n(() => Array.isArray(this.opts.collisionBoundary.current) ? this.opts.collisionBoundary.current : [this.opts.collisionBoundary.current]);
	#s = n(() => k(this.#o).length > 0);
	get hasExplicitBoundaries() {
		return k(this.#s);
	}
	set hasExplicitBoundaries(e) {
		j(this.#s, e);
	}
	#c = n(() => ({
		padding: this.opts.collisionPadding.current,
		boundary: k(this.#o).filter(tn),
		altBoundary: this.hasExplicitBoundaries
	}));
	get detectOverflowOptions() {
		return k(this.#c);
	}
	set detectOverflowOptions(e) {
		j(this.#c, e);
	}
	#l = _(void 0);
	#u = _(void 0);
	#d = _(void 0);
	#f = _(void 0);
	#p = n(() => [
		no({
			mainAxis: this.opts.sideOffset.current + k(this.#i),
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
				j(this.#l, t, !0), j(this.#u, n, !0), j(this.#d, r, !0), j(this.#f, i, !0);
			}
		}),
		this.arrowRef.current && so({
			element: this.arrowRef.current,
			padding: this.opts.arrowPadding.current
		}),
		wo({
			arrowWidth: k(this.#r),
			arrowHeight: k(this.#i)
		}),
		this.opts.hideWhenDetached.current && oo({
			strategy: "referenceHidden",
			...this.detectOverflowOptions
		})
	].filter(Boolean));
	get middleware() {
		return k(this.#p);
	}
	set middleware(e) {
		j(this.#p, e);
	}
	floating;
	#m = n(() => Eo(this.floating.placement));
	get placedSide() {
		return k(this.#m);
	}
	set placedSide(e) {
		j(this.#m, e);
	}
	#h = n(() => Do(this.floating.placement));
	get placedAlign() {
		return k(this.#h);
	}
	set placedAlign(e) {
		j(this.#h, e);
	}
	#g = n(() => this.floating.middlewareData.arrow?.x ?? 0);
	get arrowX() {
		return k(this.#g);
	}
	set arrowX(e) {
		j(this.#g, e);
	}
	#_ = n(() => this.floating.middlewareData.arrow?.y ?? 0);
	get arrowY() {
		return k(this.#_);
	}
	set arrowY(e) {
		j(this.#_, e);
	}
	#v = n(() => this.floating.middlewareData.arrow?.centerOffset !== 0);
	get cannotCenterArrow() {
		return k(this.#v);
	}
	set cannotCenterArrow(e) {
		j(this.#v, e);
	}
	#y = _();
	get contentZIndex() {
		return k(this.#y);
	}
	set contentZIndex(e) {
		j(this.#y, e, !0);
	}
	#b = n(() => _o[this.placedSide]);
	get arrowBaseSide() {
		return k(this.#b);
	}
	set arrowBaseSide(e) {
		j(this.#b, e);
	}
	#x = n(() => ({
		id: this.opts.wrapperId.current,
		"data-bits-floating-content-wrapper": "",
		style: {
			...this.floating.floatingStyles,
			transform: this.floating.isPositioned ? this.floating.floatingStyles.transform : "translate(0, -200%)",
			minWidth: "max-content",
			zIndex: this.contentZIndex,
			"--bits-floating-transform-origin": `${this.floating.middlewareData.transformOrigin?.x} ${this.floating.middlewareData.transformOrigin?.y}`,
			"--bits-floating-available-width": `${k(this.#l)}px`,
			"--bits-floating-available-height": `${k(this.#u)}px`,
			"--bits-floating-anchor-width": `${k(this.#d)}px`,
			"--bits-floating-anchor-height": `${k(this.#f)}px`,
			...this.floating.middlewareData.hide?.referenceHidden && {
				visibility: "hidden",
				"pointer-events": "none"
			},
			...k(this.#e)
		},
		dir: this.opts.dir.current,
		...this.wrapperAttachment
	}));
	get wrapperProps() {
		return k(this.#x);
	}
	set wrapperProps(e) {
		j(this.#x, e);
	}
	#S = n(() => ({
		"data-side": this.placedSide,
		"data-align": this.placedAlign,
		style: nt({ ...k(this.#e) }),
		...this.contentAttachment
	}));
	get props() {
		return k(this.#S);
	}
	set props(e) {
		j(this.#S, e);
	}
	#C = n(() => ({
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
		return k(this.#C);
	}
	set arrowStyle(e) {
		j(this.#C, e);
	}
	constructor(e, t) {
		this.opts = e, this.root = t, this.#t = e.updatePositionStrategy, e.customAnchor && (this.root.customAnchorNode.current = e.customAnchor.current), F(() => e.customAnchor.current, (e) => {
			this.root.customAnchorNode.current = e;
		}), this.floating = ho({
			strategy: () => this.opts.strategy.current,
			placement: () => k(this.#a),
			middleware: () => this.middleware,
			reference: this.root.anchorNode,
			whileElementsMounted: (...e) => to(...e, { animationFrame: this.#t?.current === "always" }),
			open: () => this.opts.enabled.current,
			sideOffset: () => this.opts.sideOffset.current,
			alignOffset: () => this.opts.alignOffset.current
		}), A(() => {
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
		}), A(() => {
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer.svelte
function Oo(e, t) {
	s(t, !0);
	let n = D(t, "tooltip", 3, !1);
	xo.create(n());
	var i = d(), a = T(i);
	o(a, () => t.children ?? m), r(e, i), C();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-anchor.svelte
function ko(e, t) {
	s(t, !0);
	let n = D(t, "tooltip", 3, !1);
	Co.create({
		id: M(() => t.id),
		virtualEl: M(() => t.virtualEl),
		ref: t.ref
	}, n());
	var i = d(), a = T(i);
	o(a, () => t.children ?? m), r(e, i), C();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-content.svelte
function Ao(e, t) {
	s(t, !0);
	let i = D(t, "side", 3, "bottom"), a = D(t, "sideOffset", 3, 0), c = D(t, "align", 3, "center"), l = D(t, "alignOffset", 3, 0), u = D(t, "arrowPadding", 3, 0), f = D(t, "avoidCollisions", 3, !0), p = D(t, "collisionBoundary", 19, () => []), h = D(t, "collisionPadding", 3, 0), g = D(t, "hideWhenDetached", 3, !1), _ = D(t, "onPlaced", 3, () => {}), v = D(t, "sticky", 3, "partial"), y = D(t, "updatePositionStrategy", 3, "optimized"), b = D(t, "strategy", 3, "fixed"), x = D(t, "dir", 3, "ltr"), S = D(t, "style", 19, () => ({})), w = D(t, "wrapperId", 19, fi), E = D(t, "customAnchor", 3, null), ee = D(t, "tooltip", 3, !1), O = So.create({
		side: M(() => i()),
		sideOffset: M(() => a()),
		align: M(() => c()),
		alignOffset: M(() => l()),
		id: M(() => t.id),
		arrowPadding: M(() => u()),
		avoidCollisions: M(() => f()),
		collisionBoundary: M(() => p()),
		collisionPadding: M(() => h()),
		hideWhenDetached: M(() => g()),
		onPlaced: M(() => _()),
		sticky: M(() => v()),
		updatePositionStrategy: M(() => y()),
		strategy: M(() => b()),
		dir: M(() => x()),
		style: M(() => S()),
		enabled: M(() => t.enabled),
		wrapperId: M(() => w()),
		customAnchor: M(() => E())
	}, ee()), A = n(() => at(O.wrapperProps, { style: { pointerEvents: "auto" } }));
	var j = d(), te = T(j);
	o(te, () => t.content ?? m, () => ({
		props: O.props,
		wrapperProps: k(A)
	})), r(e, j), C();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-content-static.svelte
function jo(e, t) {
	s(t, !0), E(() => {
		t.onPlaced?.();
	});
	var n = d(), i = T(n);
	o(i, () => t.content ?? m, () => ({
		props: {},
		wrapperProps: {}
	})), r(e, n), C();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-content.svelte
var Mo = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"content",
	"isStatic",
	"onPlaced"
]);
function No(e, t) {
	let n = D(t, "isStatic", 3, !1), i = x(t, Mo);
	var o = d(), s = T(o), c = (e) => {
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
		n() ? e(c) : e(l, -1);
	}), r(e, o);
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer-inner.svelte
var Po = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.popper.onEscapeKeydown.escapeKeydownBehavior.preventOverflowTextSelection.id.onPointerDown.onPointerUp.side.sideOffset.align.alignOffset.arrowPadding.avoidCollisions.collisionBoundary.collisionPadding.sticky.hideWhenDetached.updatePositionStrategy.strategy.dir.preventScroll.wrapperId.style.onPlaced.onInteractOutside.onCloseAutoFocus.onOpenAutoFocus.onFocusOutside.interactOutsideBehavior.loop.trapFocus.isValidEvent.customAnchor.isStatic.enabled.ref.tooltip.contentPointerEvents".split(".")), Fo = p("<!> <!>", 1);
function Io(e, t) {
	s(t, !0);
	let i = D(t, "interactOutsideBehavior", 3, "close"), c = D(t, "trapFocus", 3, !0), l = D(t, "isValidEvent", 3, () => !1), u = D(t, "customAnchor", 3, null), f = D(t, "isStatic", 3, !1), p = D(t, "tooltip", 3, !1), h = D(t, "contentPointerEvents", 3, "auto"), g = x(t, Po), _ = n(() => t.preventScroll ?? !0), v = n(() => t.strategy ?? (k(_) ? "fixed" : "absolute"));
	No(e, {
		get isStatic() {
			return f();
		},
		get id() {
			return t.id;
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
			return k(v);
		},
		get dir() {
			return t.dir;
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
			return u();
		},
		get enabled() {
			return t.enabled;
		},
		get tooltip() {
			return p();
		},
		content: (e, s) => {
			let u = () => (s?.()).props, f = () => (s?.()).wrapperProps;
			var p = Fo(), v = T(p), y = (e) => {
				wi(e, { get preventScroll() {
					return k(_);
				} });
			}, x = (e) => {
				wi(e, { get preventScroll() {
					return k(_);
				} });
			};
			a(v, (e) => {
				t.forceMount && t.enabled ? e(y) : t.forceMount || e(x, 1);
			}), ii(b(v, 2), {
				get onOpenAutoFocus() {
					return t.onOpenAutoFocus;
				},
				get onCloseAutoFocus() {
					return t.onCloseAutoFocus;
				},
				get loop() {
					return t.loop;
				},
				get enabled() {
					return t.enabled;
				},
				get trapFocus() {
					return c();
				},
				get forceMount() {
					return t.forceMount;
				},
				get ref() {
					return t.ref;
				},
				focusScope: (e, a) => {
					let s = () => (a?.()).props;
					ti(e, {
						get onEscapeKeydown() {
							return t.onEscapeKeydown;
						},
						get escapeKeydownBehavior() {
							return t.escapeKeydownBehavior;
						},
						get enabled() {
							return t.enabled;
						},
						get ref() {
							return t.ref;
						},
						children: (e, a) => {
							Qr(e, {
								get id() {
									return t.id;
								},
								get onInteractOutside() {
									return t.onInteractOutside;
								},
								get onFocusOutside() {
									return t.onFocusOutside;
								},
								get interactOutsideBehavior() {
									return i();
								},
								get isValidEvent() {
									return l();
								},
								get enabled() {
									return t.enabled;
								},
								get ref() {
									return t.ref;
								},
								children: (e, i) => {
									let a = () => (i?.()).props;
									di(e, {
										get id() {
											return t.id;
										},
										get preventOverflowTextSelection() {
											return t.preventOverflowTextSelection;
										},
										get onPointerDown() {
											return t.onPointerDown;
										},
										get onPointerUp() {
											return t.onPointerUp;
										},
										get enabled() {
											return t.enabled;
										},
										get ref() {
											return t.ref;
										},
										children: (e, i) => {
											var c = d(), l = T(c);
											{
												let e = n(() => ({
													props: at(g, u(), a(), s(), { style: { pointerEvents: h() } }),
													wrapperProps: f()
												}));
												o(l, () => t.popper ?? m, () => k(e));
											}
											r(e, c);
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
			}), r(e, p);
		},
		$$slots: { content: !0 }
	}), C();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer.svelte
var Lo = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.popper.open.onEscapeKeydown.escapeKeydownBehavior.preventOverflowTextSelection.id.onPointerDown.onPointerUp.side.sideOffset.align.alignOffset.arrowPadding.avoidCollisions.collisionBoundary.collisionPadding.sticky.hideWhenDetached.updatePositionStrategy.strategy.dir.preventScroll.wrapperId.style.onPlaced.onInteractOutside.onCloseAutoFocus.onOpenAutoFocus.onFocusOutside.interactOutsideBehavior.loop.trapFocus.isValidEvent.customAnchor.isStatic.ref.shouldRender".split("."));
function Ro(e, t) {
	let n = D(t, "interactOutsideBehavior", 3, "close"), i = D(t, "trapFocus", 3, !0), o = D(t, "isValidEvent", 3, () => !1), s = D(t, "customAnchor", 3, null), c = D(t, "isStatic", 3, !1), l = x(t, Lo);
	var u = d(), f = T(u), p = (e) => {
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
				return n();
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
	a(f, (e) => {
		t.shouldRender && e(p);
	}), r(e, u);
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer-force-mount.svelte
var zo = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.popper.onEscapeKeydown.escapeKeydownBehavior.preventOverflowTextSelection.id.onPointerDown.onPointerUp.side.sideOffset.align.alignOffset.arrowPadding.avoidCollisions.collisionBoundary.collisionPadding.sticky.hideWhenDetached.updatePositionStrategy.strategy.dir.preventScroll.wrapperId.style.onPlaced.onInteractOutside.onCloseAutoFocus.onOpenAutoFocus.onFocusOutside.interactOutsideBehavior.loop.trapFocus.isValidEvent.customAnchor.isStatic.enabled".split("."));
function Bo(e, t) {
	let n = D(t, "interactOutsideBehavior", 3, "close"), r = D(t, "trapFocus", 3, !0), i = D(t, "isValidEvent", 3, () => !1), a = D(t, "customAnchor", 3, null), o = D(t, "isStatic", 3, !1), s = x(t, zo);
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
export { At as A, on as C, zt as D, en as E, F, P as I, at as L, R as M, Dt as N, Ot as O, wt as P, M as R, B as S, z as T, ur as _, mo as a, dn as b, Ur as c, Rr as d, Dr as f, Kr as g, Hr as h, Oo as i, jt as j, Pt as k, zr as l, Wr as m, Ro as n, Gr as o, Lr as p, ko as r, Er as s, Bo as t, Vr as u, Dn as v, Qt as w, sn as x, gn as y };
