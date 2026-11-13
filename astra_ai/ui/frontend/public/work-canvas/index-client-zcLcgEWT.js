import { Q as e, Y as t, ft as n, ht as r, mt as i, pt as a, tt as o, yt as s } from "./index-client-oI5R0J23.js";
// node_modules/svelte/src/reactivity/set.js
var c = [
	"forEach",
	"isDisjointFrom",
	"isSubsetOf",
	"isSupersetOf"
], l = [
	"difference",
	"intersection",
	"symmetricDifference",
	"union"
], u = !1, d = class t extends Set {
	#e = /* @__PURE__ */ new Map();
	#t = /* @__PURE__ */ r(0);
	#n = /* @__PURE__ */ r(0);
	#r = o || -1;
	constructor(e) {
		if (super(), e) {
			for (var t of e) super.add(t);
			this.#n.v = super.size;
		}
		u || this.#a();
	}
	#i(e) {
		return o === this.#r ? /* @__PURE__ */ r(e) : i(e);
	}
	#a() {
		u = !0;
		var n = t.prototype, r = Set.prototype;
		for (let t of c) n[t] = function(...n) {
			return e(this.#t), r[t].apply(this, n);
		};
		for (let i of l) n[i] = function(...n) {
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
		return super.has(e) || (super.add(e), a(this.#n, super.size), n(this.#t)), this;
	}
	delete(e) {
		var t = super.delete(e), r = this.#e, i = r.get(e);
		return i !== void 0 && (r.delete(e), a(i, !1)), t && (a(this.#n, super.size), n(this.#t)), t;
	}
	clear() {
		if (super.size !== 0) {
			super.clear();
			var e = this.#e;
			for (var t of e.values()) a(t, !1);
			e.clear(), a(this.#n, 0), n(this.#t);
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
}, f = class extends Map {
	#e = /* @__PURE__ */ new Map();
	#t = /* @__PURE__ */ r(0);
	#n = /* @__PURE__ */ r(0);
	#r = o || -1;
	constructor(e) {
		if (super(), e) {
			for (var [t, n] of e) super.set(t, n);
			this.#n.v = super.size;
		}
	}
	#i(e) {
		return o === this.#r ? /* @__PURE__ */ r(e) : i(e);
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
		var r = this.#e, i = r.get(e), o = super.get(e), s = super.set(e, t), c = this.#t;
		if (i === void 0) i = this.#i(0), r.set(e, i), a(this.#n, super.size), n(c);
		else if (o !== t) {
			n(i);
			var l = c.reactions === null ? null : new Set(c.reactions);
			l !== null && i.reactions?.every((e) => l.has(e)) || n(c);
		}
		return s;
	}
	delete(e) {
		var t = this.#e, r = t.get(e), i = super.delete(e);
		return r !== void 0 && (t.delete(e), a(r, -1)), i && (a(this.#n, super.size), n(this.#t)), i;
	}
	clear() {
		if (super.size !== 0) {
			super.clear();
			var e = this.#e;
			a(this.#n, 0);
			for (var t of e.values()) a(t, -1);
			n(this.#t), e.clear();
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
}, p = class {
	#e;
	#t;
	constructor(e, t) {
		this.#e = e, this.#t = s(t);
	}
	get current() {
		return this.#t(), this.#e();
	}
}, m = /\(.+\)/, h = /* @__PURE__ */ new Set([
	"all",
	"print",
	"screen",
	"and",
	"or",
	"not",
	"only"
]), g = class extends p {
	constructor(e, n) {
		let r = m.test(e) || e.split(/[\s,]+/).some((e) => h.has(e.trim())) ? e : `(${e})`, i = window.matchMedia(r);
		super(() => i.matches, (e) => t(i, "change", e));
	}
};
export { f as n, d as r, g as t };
