import { $ as e, Q as t, Y as n, _t as r, et as i, gt as a, ht as o, mt as s, rt as c, xt as l, yt as u } from "./index-client-C_2wYFnt.js";
// node_modules/svelte/src/reactivity/date.js
var d = !1, f = class n extends Date {
	#e = /* @__PURE__ */ r(super.getTime());
	#t = /* @__PURE__ */ new Map();
	#n = t;
	constructor(...e) {
		super(...e), d || this.#r();
	}
	#r() {
		d = !0;
		var r = n.prototype, a = Date.prototype, s = Object.getOwnPropertyNames(a);
		for (let n of s) (n.startsWith("get") || n.startsWith("to") || n === "valueOf") && (r[n] = function(...r) {
			if (r.length > 0) return e(this.#e), a[n].apply(this, r);
			var o = this.#t.get(n);
			if (o === void 0) {
				let s = t;
				i(this.#n), o = /* @__PURE__ */ u(() => (e(this.#e), a[n].apply(this, r))), this.#t.set(n, o), i(s);
			}
			return e(o);
		}), n.startsWith("set") && (r[n] = function(...e) {
			var t = a[n].apply(this, e);
			return o(this.#e, a.getTime.call(this)), t;
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
], h = !1, g = class t extends Set {
	#e = /* @__PURE__ */ new Map();
	#t = /* @__PURE__ */ r(0);
	#n = /* @__PURE__ */ r(0);
	#r = c || -1;
	constructor(e) {
		if (super(), e) {
			for (var t of e) super.add(t);
			this.#n.v = super.size;
		}
		h || this.#a();
	}
	#i(e) {
		return c === this.#r ? /* @__PURE__ */ r(e) : a(e);
	}
	#a() {
		h = !0;
		var n = t.prototype, r = Set.prototype;
		for (let t of p) n[t] = function(...n) {
			return e(this.#t), r[t].apply(this, n);
		};
		for (let i of m) n[i] = function(...n) {
			e(this.#t);
			var a = r[i].apply(this, n);
			return new t(a);
		};
	}
	has(t) {
		var n = super.has(t), r = this.#e, i = r.get(t);
		if (i === void 0) {
			if (!n) return e(this.#t), !1;
			i = this.#i(!0), r.set(t, i);
		}
		return e(i), n;
	}
	add(e) {
		return super.has(e) || (super.add(e), o(this.#n, super.size), s(this.#t)), this;
	}
	delete(e) {
		var t = super.delete(e), n = this.#e, r = n.get(e);
		return r !== void 0 && (n.delete(e), o(r, !1)), t && (o(this.#n, super.size), s(this.#t)), t;
	}
	clear() {
		if (super.size !== 0) {
			super.clear();
			var e = this.#e;
			for (var t of e.values()) o(t, !1);
			e.clear(), o(this.#n, 0), s(this.#t);
		}
	}
	keys() {
		return this.values();
	}
	values() {
		return e(this.#t), super.values();
	}
	entries() {
		return e(this.#t), super.entries();
	}
	[Symbol.iterator]() {
		return this.keys();
	}
	get size() {
		return e(this.#n);
	}
}, _ = class extends Map {
	#e = /* @__PURE__ */ new Map();
	#t = /* @__PURE__ */ r(0);
	#n = /* @__PURE__ */ r(0);
	#r = c || -1;
	constructor(e) {
		if (super(), e) {
			for (var [t, n] of e) super.set(t, n);
			this.#n.v = super.size;
		}
	}
	#i(e) {
		return c === this.#r ? /* @__PURE__ */ r(e) : a(e);
	}
	has(t) {
		var n = this.#e, r = n.get(t);
		if (r === void 0) {
			if (super.has(t)) r = this.#i(0), n.set(t, r);
			else return e(this.#t), !1;
		}
		return e(r), !0;
	}
	forEach(e, t) {
		this.#a(), super.forEach(e, t);
	}
	get(t) {
		var n = this.#e, r = n.get(t);
		if (r === void 0) {
			if (super.has(t)) r = this.#i(0), n.set(t, r);
			else {
				e(this.#t);
				return;
			}
		}
		return e(r), super.get(t);
	}
	set(e, t) {
		var n = this.#e, r = n.get(e), i = super.get(e), a = super.set(e, t), c = this.#t;
		if (r === void 0) r = this.#i(0), n.set(e, r), o(this.#n, super.size), s(c);
		else if (i !== t) {
			s(r);
			var l = c.reactions === null ? null : new Set(c.reactions);
			l !== null && r.reactions?.every((e) => l.has(e)) || s(c);
		}
		return a;
	}
	delete(e) {
		var t = this.#e, n = t.get(e), r = super.delete(e);
		return n !== void 0 && (t.delete(e), o(n, -1)), r && (o(this.#n, super.size), s(this.#t)), r;
	}
	clear() {
		if (super.size !== 0) {
			super.clear();
			var e = this.#e;
			o(this.#n, 0);
			for (var t of e.values()) o(t, -1);
			s(this.#t), e.clear();
		}
	}
	#a() {
		e(this.#t);
		var t = this.#e;
		if (this.#n.v !== t.size) {
			for (var n of super.keys()) if (!t.has(n)) {
				var r = this.#i(0);
				t.set(n, r);
			}
		}
		for ([, r] of this.#e) e(r);
	}
	keys() {
		return e(this.#t), super.keys();
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
		return e(this.#n), super.size;
	}
}, v = class {
	#e;
	#t;
	constructor(e, t) {
		this.#e = e, this.#t = l(t);
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
