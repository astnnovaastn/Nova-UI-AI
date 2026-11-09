import { K as e, Q as t, Y as n, dt as r, ft as i, gt as a, lt as o, ut as s } from "./index-client-BSGo5gVb.js";
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
], u = !1, d = class e extends Set {
	#e = /* @__PURE__ */ new Map();
	#t = /* @__PURE__ */ i(0);
	#n = /* @__PURE__ */ i(0);
	#r = t || -1;
	constructor(e) {
		if (super(), e) {
			for (var t of e) super.add(t);
			this.#n.v = super.size;
		}
		u || this.#a();
	}
	#i(e) {
		return t === this.#r ? /* @__PURE__ */ i(e) : r(e);
	}
	#a() {
		u = !0;
		var t = e.prototype, r = Set.prototype;
		for (let e of c) t[e] = function(...t) {
			return n(this.#t), r[e].apply(this, t);
		};
		for (let i of l) t[i] = function(...t) {
			n(this.#t);
			var a = r[i].apply(this, t);
			return new e(a);
		};
	}
	has(e) {
		var t = super.has(e), r = this.#e, i = r.get(e);
		if (i === void 0) {
			if (!t) return n(this.#t), !1;
			i = this.#i(!0), r.set(e, i);
		}
		return n(i), t;
	}
	add(e) {
		return super.has(e) || (super.add(e), s(this.#n, super.size), o(this.#t)), this;
	}
	delete(e) {
		var t = super.delete(e), n = this.#e, r = n.get(e);
		return r !== void 0 && (n.delete(e), s(r, !1)), t && (s(this.#n, super.size), o(this.#t)), t;
	}
	clear() {
		if (super.size !== 0) {
			super.clear();
			var e = this.#e;
			for (var t of e.values()) s(t, !1);
			e.clear(), s(this.#n, 0), o(this.#t);
		}
	}
	keys() {
		return this.values();
	}
	values() {
		return n(this.#t), super.values();
	}
	entries() {
		return n(this.#t), super.entries();
	}
	[Symbol.iterator]() {
		return this.keys();
	}
	get size() {
		return n(this.#n);
	}
}, f = class extends Map {
	#e = /* @__PURE__ */ new Map();
	#t = /* @__PURE__ */ i(0);
	#n = /* @__PURE__ */ i(0);
	#r = t || -1;
	constructor(e) {
		if (super(), e) {
			for (var [t, n] of e) super.set(t, n);
			this.#n.v = super.size;
		}
	}
	#i(e) {
		return t === this.#r ? /* @__PURE__ */ i(e) : r(e);
	}
	has(e) {
		var t = this.#e, r = t.get(e);
		if (r === void 0) {
			if (super.has(e)) r = this.#i(0), t.set(e, r);
			else return n(this.#t), !1;
		}
		return n(r), !0;
	}
	forEach(e, t) {
		this.#a(), super.forEach(e, t);
	}
	get(e) {
		var t = this.#e, r = t.get(e);
		if (r === void 0) {
			if (super.has(e)) r = this.#i(0), t.set(e, r);
			else {
				n(this.#t);
				return;
			}
		}
		return n(r), super.get(e);
	}
	set(e, t) {
		var n = this.#e, r = n.get(e), i = super.get(e), a = super.set(e, t), c = this.#t;
		if (r === void 0) r = this.#i(0), n.set(e, r), s(this.#n, super.size), o(c);
		else if (i !== t) {
			o(r);
			var l = c.reactions === null ? null : new Set(c.reactions);
			l !== null && r.reactions?.every((e) => l.has(e)) || o(c);
		}
		return a;
	}
	delete(e) {
		var t = this.#e, n = t.get(e), r = super.delete(e);
		return n !== void 0 && (t.delete(e), s(n, -1)), r && (s(this.#n, super.size), o(this.#t)), r;
	}
	clear() {
		if (super.size !== 0) {
			super.clear();
			var e = this.#e;
			s(this.#n, 0);
			for (var t of e.values()) s(t, -1);
			o(this.#t), e.clear();
		}
	}
	#a() {
		n(this.#t);
		var e = this.#e;
		if (this.#n.v !== e.size) {
			for (var t of super.keys()) if (!e.has(t)) {
				var r = this.#i(0);
				e.set(t, r);
			}
		}
		for ([, r] of this.#e) n(r);
	}
	keys() {
		return n(this.#t), super.keys();
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
		return n(this.#n), super.size;
	}
}, p = class {
	#e;
	#t;
	constructor(e, t) {
		this.#e = e, this.#t = a(t);
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
	constructor(t, n) {
		let r = m.test(t) || t.split(/[\s,]+/).some((e) => h.has(e.trim())) ? t : `(${t})`, i = window.matchMedia(r);
		super(() => i.matches, (t) => e(i, "change", t));
	}
};
export { f as n, d as r, g as t };
