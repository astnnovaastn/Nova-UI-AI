import { Ct as e, Tt as t, Z as n, _t as r, at as i, bt as a, et as o, nt as s, tt as c, vt as l, yt as u } from "./index-client-DH73-vTM.js";
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/reactivity/date.js
var d = !1, f = class t extends Date {
	#e = /* @__PURE__ */ a(super.getTime());
	#t = /* @__PURE__ */ new Map();
	#n = o;
	constructor(...e) {
		super(...e), d || this.#r();
	}
	#r() {
		d = !0;
		var n = t.prototype, r = Date.prototype, i = Object.getOwnPropertyNames(r);
		for (let t of i) (t.startsWith("get") || t.startsWith("to") || t === "valueOf") && (n[t] = function(...n) {
			if (n.length > 0) return c(this.#e), r[t].apply(this, n);
			var i = this.#t.get(t);
			if (i === void 0) {
				let a = o;
				s(this.#n), i = /* @__PURE__ */ e(() => (c(this.#e), r[t].apply(this, n))), this.#t.set(t, i), s(a);
			}
			return c(i);
		}), t.startsWith("set") && (n[t] = function(...e) {
			var n = r[t].apply(this, e);
			return l(this.#e, r.getTime.call(this)), n;
		});
	}
}, p = [
	"forEach",
	"isDisjointFrom",
	"isSubsetOf",
	"isSupersetOf"
], m = [
	"difference",
	"intersection",
	"symmetricDifference",
	"union"
], h = !1, g = class e extends Set {
	#e = /* @__PURE__ */ new Map();
	#t = /* @__PURE__ */ a(0);
	#n = /* @__PURE__ */ a(0);
	#r = i || -1;
	constructor(e) {
		if (super(), e) {
			for (var t of e) super.add(t);
			this.#n.v = super.size;
		}
		h || this.#a();
	}
	#i(e) {
		return i === this.#r ? /* @__PURE__ */ a(e) : u(e);
	}
	#a() {
		h = !0;
		var t = e.prototype, n = Set.prototype;
		for (let e of p) t[e] = function(...t) {
			return c(this.#t), n[e].apply(this, t);
		};
		for (let r of m) t[r] = function(...t) {
			c(this.#t);
			var i = n[r].apply(this, t);
			return new e(i);
		};
	}
	has(e) {
		var t = super.has(e), n = this.#e, r = n.get(e);
		if (r === void 0) {
			if (!t) return c(this.#t), !1;
			r = this.#i(!0), n.set(e, r);
		}
		return c(r), t;
	}
	add(e) {
		return super.has(e) || (super.add(e), l(this.#n, super.size), r(this.#t)), this;
	}
	delete(e) {
		var t = super.delete(e), n = this.#e, i = n.get(e);
		return i !== void 0 && (n.delete(e), l(i, !1)), t && (l(this.#n, super.size), r(this.#t)), t;
	}
	clear() {
		if (super.size !== 0) {
			super.clear();
			var e = this.#e;
			for (var t of e.values()) l(t, !1);
			e.clear(), l(this.#n, 0), r(this.#t);
		}
	}
	keys() {
		return this.values();
	}
	values() {
		return c(this.#t), super.values();
	}
	entries() {
		return c(this.#t), super.entries();
	}
	[Symbol.iterator]() {
		return this.keys();
	}
	get size() {
		return c(this.#n);
	}
}, _ = class extends Map {
	#e = /* @__PURE__ */ new Map();
	#t = /* @__PURE__ */ a(0);
	#n = /* @__PURE__ */ a(0);
	#r = i || -1;
	constructor(e) {
		if (super(), e) {
			for (var [t, n] of e) super.set(t, n);
			this.#n.v = super.size;
		}
	}
	#i(e) {
		return i === this.#r ? /* @__PURE__ */ a(e) : u(e);
	}
	has(e) {
		var t = this.#e, n = t.get(e);
		if (n === void 0) {
			if (super.has(e)) n = this.#i(0), t.set(e, n);
			else return c(this.#t), !1;
		}
		return c(n), !0;
	}
	forEach(e, t) {
		this.#a(), super.forEach(e, t);
	}
	get(e) {
		var t = this.#e, n = t.get(e);
		if (n === void 0) {
			if (super.has(e)) n = this.#i(0), t.set(e, n);
			else {
				c(this.#t);
				return;
			}
		}
		return c(n), super.get(e);
	}
	set(e, t) {
		var n = this.#e, i = n.get(e), a = super.get(e), o = super.set(e, t), s = this.#t;
		if (i === void 0) i = this.#i(0), n.set(e, i), l(this.#n, super.size), r(s);
		else if (a !== t) {
			r(i);
			var c = s.reactions === null ? null : new Set(s.reactions);
			c !== null && i.reactions?.every((e) => c.has(e)) || r(s);
		}
		return o;
	}
	delete(e) {
		var t = this.#e, n = t.get(e), i = super.delete(e);
		return n !== void 0 && (t.delete(e), l(n, -1)), i && (l(this.#n, super.size), r(this.#t)), i;
	}
	clear() {
		if (super.size !== 0) {
			super.clear();
			var e = this.#e;
			l(this.#n, 0);
			for (var t of e.values()) l(t, -1);
			r(this.#t), e.clear();
		}
	}
	#a() {
		c(this.#t);
		var e = this.#e;
		if (this.#n.v !== e.size) {
			for (var t of super.keys()) if (!e.has(t)) {
				var n = this.#i(0);
				e.set(t, n);
			}
		}
		for ([, n] of this.#e) c(n);
	}
	keys() {
		return c(this.#t), super.keys();
	}
	values() {
		return this.#a(), super.values();
	}
	entries() {
		return this.#a(), super.entries();
	}
	[Symbol.iterator]() {
		return this.entries();
	}
	get size() {
		return c(this.#n), super.size;
	}
}, v = class {
	#e;
	#t;
	constructor(e, n) {
		this.#e = e, this.#t = t(n);
	}
	get current() {
		return this.#t(), this.#e();
	}
}, y = /\(.+\)/, b = /* @__PURE__ */ new Set([
	"all",
	"print",
	"screen",
	"and",
	"or",
	"not",
	"only"
]), x = class extends v {
	constructor(e, t) {
		let r = y.test(e) || e.split(/[\s,]+/).some((e) => b.has(e.trim())) ? e : `(${e})`, i = window.matchMedia(r);
		super(() => i.matches, (e) => n(i, "change", e));
	}
};
export { f as i, _ as n, g as r, x as t };
