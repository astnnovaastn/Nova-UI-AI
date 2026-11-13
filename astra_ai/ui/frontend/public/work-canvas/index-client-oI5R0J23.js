// node_modules/svelte/src/internal/shared/utils.js
var e = Array.isArray, t = Array.prototype.indexOf, n = Array.prototype.includes, r = Array.from, i = Object.defineProperty, a = Object.getOwnPropertyDescriptor, o = Object.getOwnPropertyDescriptors, s = Object.prototype, c = Array.prototype, l = Object.getPrototypeOf, u = Object.isExtensible;
function d(e) {
	return typeof e == "function";
}
var f = () => {};
function p(e) {
	return typeof e?.then == "function";
}
function m(e) {
	return e();
}
function h(e) {
	for (var t = 0; t < e.length; t++) e[t]();
}
function g() {
	var e, t;
	return {
		promise: new Promise((n, r) => {
			e = n, t = r;
		}),
		resolve: e,
		reject: t
	};
}
function _(e, t, n = !1) {
	return e === void 0 ? n ? t() : t : e;
}
function v(e, t) {
	if (Array.isArray(e)) return e;
	if (t === void 0 || !(Symbol.iterator in e)) return Array.from(e);
	let n = [];
	for (let r of e) if (n.push(r), n.length === t) break;
	return n;
}
function y(e, t) {
	var n = {};
	for (var r in e) t.includes(r) || (n[r] = e[r]);
	for (var i of Object.getOwnPropertySymbols(e)) Object.propertyIsEnumerable.call(e, i) && !t.includes(i) && (n[i] = e[i]);
	return n;
}
// node_modules/svelte/src/internal/client/constants.js
var b = 1 << 24, x = 1024, S = 2048, C = 4096, ee = 8192, te = 16384, ne = 32768, re = 1 << 25, ie = 65536, ae = 1 << 19, oe = 1 << 20, se = 1 << 25, ce = 65536, le = 1 << 21, ue = 1 << 22, de = 1 << 23, w = Symbol("$state"), fe = Symbol("legacy props"), pe = Symbol(""), me = Symbol("proxy path"), he = Symbol("attributes"), ge = Symbol("class"), _e = Symbol("style"), ve = Symbol("text"), ye = Symbol("form reset"), be = new class extends Error {
	name = "StaleReactionError";
	message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}(), xe = !!globalThis.document?.contentType && /* @__PURE__ */ globalThis.document.contentType.includes("xml");
function Se(e) {
	throw Error("https://svelte.dev/e/lifecycle_outside_component");
}
// node_modules/svelte/src/internal/client/errors.js
function Ce() {
	throw Error("https://svelte.dev/e/async_derived_orphan");
}
function we(e, t, n) {
	throw Error("https://svelte.dev/e/each_key_duplicate");
}
function Te(e) {
	throw Error("https://svelte.dev/e/effect_in_teardown");
}
function Ee() {
	throw Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function De(e) {
	throw Error("https://svelte.dev/e/effect_orphan");
}
function Oe() {
	throw Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function ke(e) {
	throw Error("https://svelte.dev/e/props_invalid_value");
}
function Ae() {
	throw Error("https://svelte.dev/e/state_descriptors_fixed");
}
function je() {
	throw Error("https://svelte.dev/e/state_prototype_fixed");
}
function Me() {
	throw Error("https://svelte.dev/e/state_unsafe_mutation");
}
function Ne() {
	throw Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
// node_modules/svelte/src/constants.js
var Pe = {}, T = Symbol("uninitialized"), Fe = "http://www.w3.org/1999/xhtml", Ie = "http://www.w3.org/2000/svg", Le = "http://www.w3.org/1998/Math/MathML", Re = "@attach";
function ze() {
	console.warn("https://svelte.dev/e/derived_inert");
}
function Be(e) {
	console.warn("https://svelte.dev/e/hydration_mismatch");
}
function Ve() {
	console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function He() {
	console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
// node_modules/svelte/src/internal/client/dom/hydration.js
var E = !1;
function D(e) {
	E = e;
}
var O;
function k(e) {
	if (e === null) throw Be(), Pe;
	return O = e;
}
function A() {
	return k(/* @__PURE__ */ B(O));
}
function Ue(e) {
	if (E) {
		if (/* @__PURE__ */ B(O) !== null) throw Be(), Pe;
		O = e;
	}
}
function We(e = 1) {
	if (E) {
		for (var t = e, n = O; t--;) n = /* @__PURE__ */ B(n);
		O = n;
	}
}
function Ge(e = !0) {
	for (var t = 0, n = O;;) {
		if (n.nodeType === 8) {
			var r = n.data;
			if (r === "]") {
				if (t === 0) return n;
				--t;
			} else (r === "[" || r === "[!" || r[0] === "[" && !isNaN(Number(r.slice(1)))) && (t += 1);
		}
		var i = /* @__PURE__ */ B(n);
		e && n.remove(), n = i;
	}
}
function Ke(e) {
	if (!e || e.nodeType !== 8) throw Be(), Pe;
	return e.data;
}
// node_modules/svelte/src/internal/client/reactivity/equality.js
function qe(e) {
	return e === this.v;
}
function Je(e, t) {
	return e == e ? e !== t || typeof e == "object" && !!e || typeof e == "function" : t == t;
}
function Ye(e) {
	return !Je(e, this.v);
}
// node_modules/svelte/src/internal/flags/index.js
var Xe = !1;
function Ze() {
	Xe = !0;
}
// node_modules/svelte/src/internal/shared/clone.js
var Qe = [];
function $e(e, t = !1, n = !1) {
	return et(e, /* @__PURE__ */ new Map(), "", Qe, null, n);
}
function et(t, n, r, i, a = null, o = !1) {
	if (typeof t == "object" && t) {
		var c = n.get(t);
		if (c !== void 0) return c;
		if (t instanceof Map) return new Map(t);
		if (t instanceof Set) return new Set(t);
		if (e(t)) {
			var u = Array(t.length);
			n.set(t, u), a !== null && n.set(a, u);
			for (var d = 0; d < t.length; d += 1) {
				var f = t[d];
				d in t && (u[d] = et(f, n, r, i, null, o));
			}
			return u;
		}
		if (l(t) === s) {
			u = {}, n.set(t, u), a !== null && n.set(a, u);
			for (var p of Object.keys(t)) u[p] = et(t[p], n, r, i, null, o);
			return u;
		}
		if (t instanceof Date) return structuredClone(t);
		if (typeof t.toJSON == "function" && !o) return et(t.toJSON(), n, r, i, t);
	}
	if (t instanceof EventTarget) return t;
	try {
		return structuredClone(t);
	} catch {
		return t;
	}
}
function tt(e, t) {
	return e.label = t, nt(e.v, t), e;
}
function nt(e, t) {
	return e?.[me]?.(t), e;
}
function rt(e) {
	return typeof e == "symbol" ? `Symbol(${e.description})` : typeof e == "function" ? "<function>" : typeof e == "object" && e ? "<object>" : String(e);
}
// node_modules/svelte/src/internal/client/context.js
var j = null;
function it(e) {
	j = e;
}
function at(e) {
	return ft("getContext").get(e);
}
function ot(e, t) {
	return ft("setContext").set(e, t), t;
}
function st(e) {
	return ft("hasContext").has(e);
}
function ct() {
	return ft("getAllContexts");
}
function lt(e, t = !1, n) {
	j = {
		p: j,
		i: !1,
		c: null,
		e: null,
		s: e,
		x: null,
		r: q,
		l: Xe && !t ? {
			s: null,
			u: null,
			$: []
		} : null
	};
}
function ut(e) {
	var t = j, n = t.e;
	if (n !== null) {
		t.e = null;
		for (var r of n) Un(r);
	}
	return e !== void 0 && (t.x = e), t.i = !0, j = t.p, e ?? {};
}
function dt() {
	return !Xe || j !== null && j.l === null;
}
function ft(e) {
	return j === null && Se(e), j.c ??= new Map(pt(j) || void 0);
}
function pt(e) {
	let t = e.p;
	for (; t !== null;) {
		let e = t.c;
		if (e !== null) return e;
		t = t.p;
	}
	return null;
}
// node_modules/svelte/src/internal/client/dom/task.js
var mt = [];
function ht() {
	var e = mt;
	mt = [], h(e);
}
function M(e) {
	if (mt.length === 0 && !Qt) {
		var t = mt;
		queueMicrotask(() => {
			t === mt && ht();
		});
	}
	mt.push(e);
}
function gt() {
	for (; mt.length > 0;) ht();
}
function _t(e) {
	var t = q;
	if (t === null) return W.f |= de, e;
	if (!(t.f & 32768) && !(t.f & 4)) throw e;
	vt(e, t);
}
function vt(e, t) {
	if (!(t !== null && t.f & 16384)) {
		for (; t !== null;) {
			if (t.f & 128) {
				if (!(t.f & 32768)) throw e;
				try {
					t.b.error(e);
					return;
				} catch (t) {
					e = t;
				}
			}
			t = t.parent;
		}
		throw e;
	}
}
// node_modules/svelte/src/internal/client/reactivity/status.js
var yt = ~(S | C | x);
function N(e, t) {
	e.f = e.f & yt | t;
}
function bt(e) {
	e.f & 512 || e.deps === null ? N(e, x) : N(e, C);
}
// node_modules/svelte/src/internal/client/reactivity/utils.js
function xt(e) {
	if (e !== null) for (let t of e) t.f & 2 && t.f & 65536 && (t.f ^= ce, xt(t.deps));
}
function St(e, t, n) {
	e.f & 2048 ? t.add(e) : e.f & 4096 && n.add(e), xt(e.deps), N(e, x);
}
// node_modules/svelte/src/internal/client/reactivity/store.js
var Ct = !1;
function wt(e) {
	var t = Ct;
	try {
		return Ct = !1, [e(), Ct];
	} finally {
		Ct = t;
	}
}
// node_modules/svelte/src/internal/client/dom/elements/misc.js
function Tt(e, t) {
	if (t) {
		let t = document.body;
		e.autofocus = !0, M(() => {
			document.activeElement === t && e.focus();
		});
	}
}
function Et(e) {
	E && /* @__PURE__ */ z(e) !== null && Pn(e);
}
var Dt = !1;
function Ot() {
	Dt || (Dt = !0, document.addEventListener("reset", (e) => {
		Promise.resolve().then(() => {
			if (!e.defaultPrevented) for (let t of e.target.elements) t[ye]?.();
		});
	}, { capture: !0 }));
}
// node_modules/svelte/src/internal/client/dom/elements/bindings/shared.js
function kt(e) {
	var t = W, n = q;
	K(null), pr(null);
	try {
		return e();
	} finally {
		K(t), pr(n);
	}
}
function At(e, t, n, r = n) {
	e.addEventListener(t, () => kt(n));
	let i = e[ye];
	e[ye] = i ? () => {
		i(), r(!0);
	} : () => r(!0), Ot();
}
// node_modules/svelte/src/reactivity/create-subscriber.js
function jt(e) {
	let t = 0, n = I(0), r;
	return () => {
		Bn() && (Z(n), Yn(() => (t === 0 && (r = Q(() => e(() => xn(n)))), t += 1, () => {
			M(() => {
				--t, t === 0 && (r?.(), r = void 0, xn(n));
			});
		})));
	};
}
// node_modules/svelte/src/internal/client/dom/blocks/boundary.js
var Mt = ie | ae;
function Nt(e, t, n, r) {
	new Pt(e, t, n, r);
}
var Pt = class {
	parent;
	is_pending = !1;
	transform_error;
	#e;
	#t = E ? O : null;
	#n;
	#r;
	#i;
	#a = null;
	#o = null;
	#s = null;
	#c = null;
	#l = 0;
	#u = 0;
	#d = !1;
	#f = /* @__PURE__ */ new Set();
	#p = /* @__PURE__ */ new Set();
	#m = null;
	#h = jt(() => (this.#m = I(this.#l), () => {
		this.#m = null;
	}));
	constructor(e, t, n, r) {
		this.#e = e, this.#n = t, this.#r = (e) => {
			var t = q;
			t.b = this, t.f |= 128, n(e);
		}, this.parent = q.b, this.transform_error = r ?? this.parent?.transform_error ?? ((e) => e), this.#i = Zn(() => {
			if (E) {
				let e = this.#t;
				A();
				let t = e.data === "[!";
				if (e.data.startsWith("[?")) {
					let t = JSON.parse(e.data.slice(2));
					this.#_(t);
				} else t ? this.#y() : this.#g();
			} else this.#b();
		}, Mt), E && (this.#e = O);
	}
	#g() {
		try {
			this.#a = H(() => this.#r(this.#e));
		} catch (e) {
			this.error(e);
		}
	}
	#_(e) {
		let t = this.#n.failed, { reset: n, invoke_onerror: r } = this.#v(e);
		M(r), t && (this.#s = H(() => {
			t(this.#e, () => e, () => n);
		}));
	}
	#v(e) {
		var t = !1, n = !1;
		let r = () => {
			t ? He() : (t = !0, n && Ne(), this.#s !== null && ir(this.#s, () => {
				this.#s = null;
			}), this.#S(() => {
				this.#b();
			}));
		};
		return {
			reset: r,
			invoke_onerror: () => {
				try {
					n = !0, this.#n.onerror?.(e, r), n = !1;
				} catch (e) {
					vt(e, this.#i && this.#i.parent);
				}
			}
		};
	}
	#y() {
		let e = this.#n.pending;
		e && (this.is_pending = !0, this.#o = H(() => e(this.#e)), M(() => {
			var e = this.#c = document.createDocumentFragment(), t = R();
			e.append(t), this.#a = this.#S(() => H(() => this.#r(t))), this.#u === 0 && (this.#e.before(e), this.#c = null, ir(this.#o, () => {
				this.#o = null;
			}), this.#x(P));
		}));
	}
	#b() {
		try {
			if (this.is_pending = this.has_pending_snippet(), this.#u = 0, this.#l = 0, this.#a = H(() => {
				this.#r(this.#e);
			}), this.#u > 0) {
				var e = this.#c = document.createDocumentFragment();
				cr(this.#a, e);
				let t = this.#n.pending;
				this.#o = H(() => t(this.#e));
			} else this.#x(P);
		} catch (e) {
			this.error(e);
		}
	}
	#x(e) {
		this.is_pending = !1, e.transfer_effects(this.#f, this.#p);
	}
	defer_effect(e) {
		St(e, this.#f, this.#p);
	}
	is_rendered() {
		return !this.is_pending && (!this.parent || this.parent.is_rendered());
	}
	has_pending_snippet() {
		return !!this.#n.pending;
	}
	#S(e) {
		var t = q, n = W, r = j;
		pr(this.#i), K(this.#i), it(this.#i.ctx);
		try {
			return an.ensure(), e();
		} catch (e) {
			return _t(e), null;
		} finally {
			pr(t), K(n), it(r);
		}
	}
	#C(e, t) {
		this.has_pending_snippet() ? (this.#u += e, this.#u === 0 && (this.#x(t), this.#o && ir(this.#o, () => {
			this.#o = null;
		}), this.#c &&= (this.#e.before(this.#c), null))) : this.parent && this.parent.#C(e, t);
	}
	update_pending_count(e, t) {
		this.#C(e, t), this.#l += e, !this.#m || this.#d || (this.#d = !0, M(() => {
			this.#d = !1, this.#m && vn(this.#m, this.#l);
		}));
	}
	get_effect_pending() {
		return this.#h(), Z(this.#m);
	}
	error(e) {
		if (!this.#n.onerror && !this.#n.failed) throw e;
		P?.is_fork ? (this.#a && P.skip_effect(this.#a), this.#o && P.skip_effect(this.#o), this.#s && P.skip_effect(this.#s), P.oncommit(() => {
			this.#w(e);
		})) : this.#w(e);
	}
	#w(e) {
		this.#a &&= (U(this.#a), null), this.#o &&= (U(this.#o), null), this.#s &&= (U(this.#s), null), E && (k(this.#t), We(), k(Ge()));
		let t = this.#n.failed, n = (e) => {
			let { reset: n, invoke_onerror: r } = this.#v(e);
			r(), t && (this.#s = this.#S(() => {
				try {
					return H(() => {
						var r = q;
						r.b = this, r.f |= 128, t(this.#e, () => e, () => n);
					});
				} catch (e) {
					return vt(e, this.#i.parent), null;
				}
			}));
		};
		M(() => {
			var t;
			try {
				t = this.transform_error(e);
			} catch (e) {
				vt(e, this.#i && this.#i.parent);
				return;
			}
			typeof t == "object" && t && typeof t.then == "function" ? t.then(n, (e) => vt(e, this.#i && this.#i.parent)) : n(t);
		});
	}
};
// node_modules/svelte/src/internal/client/reactivity/async.js
function Ft(e, t, n, r) {
	let i = dt() ? zt : Ut;
	var a = e.filter((e) => !e.settled), o = t.map(i);
	if (n.length === 0 && a.length === 0) {
		r(o);
		return;
	}
	var s = q, c = It(), l = a.length === 1 ? a[0].promise : a.length > 1 ? Promise.all(a.map((e) => e.promise)) : null;
	function u(e) {
		if (!(s.f & 16384)) {
			c();
			try {
				r([...o, ...e]);
			} catch (e) {
				vt(e, s);
			}
			Lt();
		}
	}
	var d = Rt();
	if (n.length === 0) {
		l.then(() => u([])).finally(d);
		return;
	}
	function f() {
		Promise.all(n.map((e) => /* @__PURE__ */ Vt(e))).then(u).catch((e) => vt(e, s)).finally(d);
	}
	l ? l.then(() => {
		c(), f(), Lt();
	}) : f();
}
function It() {
	var e = q, t = W, n = j, r = P;
	return function(i = !0) {
		pr(e), K(t), it(n), i && !(e.f & 16384) && (r?.activate(), r?.apply());
	};
}
function Lt(e = !0) {
	pr(null), K(null), it(null), e && P?.deactivate();
}
function Rt() {
	var e = q, t = e.b, n = P, r = !!t?.is_rendered();
	return t?.update_pending_count(1, n), n.increment(r, e), () => {
		t?.update_pending_count(-1, n), n.decrement(r, e);
	};
}
/*#__NO_SIDE_EFFECTS__*/
function zt(e) {
	var t = 2 | S;
	return q !== null && (q.f |= ae), {
		ctx: j,
		deps: null,
		effects: null,
		equals: qe,
		f: t,
		fn: e,
		reactions: null,
		rv: 0,
		v: T,
		wv: 0,
		parent: q,
		ac: null
	};
}
var Bt = Symbol("obsolete");
/*#__NO_SIDE_EFFECTS__*/
function Vt(e, t, n) {
	let r = q;
	r === null && Ce();
	var i = void 0, a = I(T), o = !W, s = /* @__PURE__ */ new Set();
	return Jn(() => {
		var t = q, n = g();
		i = n.promise;
		try {
			Promise.resolve(e()).then(n.resolve, (e) => {
				e !== be && n.reject(e);
			}).finally(Lt);
		} catch (e) {
			n.reject(e), Lt();
		}
		var c = P;
		if (o) {
			if (t.f & 32768) var l = Rt();
			if (r.b?.is_rendered()) c.async_deriveds.get(t)?.reject(Bt);
			else for (let e of s.values()) e.reject(Bt);
			s.add(n), c.async_deriveds.set(t, n);
		}
		let u = (e, t = void 0) => {
			l?.(), s.delete(n), t !== Bt && (c.activate(), t ? (a.f |= de, vn(a, t)) : (a.f & 8388608 && (a.f ^= de), vn(a, e)), c.deactivate());
		};
		n.promise.then(u, (e) => u(null, e || "unknown"));
	}), Vn(() => {
		for (let e of s) e.reject(Bt);
	}), new Promise((e) => {
		function t(n) {
			function r() {
				n === i ? e(a) : t(i);
			}
			n.then(r, r);
		}
		t(i);
	});
}
/*#__NO_SIDE_EFFECTS__*/
function Ht(e) {
	let t = /* @__PURE__ */ zt(e);
	return hr(t), t;
}
/*#__NO_SIDE_EFFECTS__*/
function Ut(e) {
	let t = /* @__PURE__ */ zt(e);
	return t.equals = Ye, t;
}
function Wt(e) {
	var t = e.effects;
	if (t !== null) {
		e.effects = null;
		for (var n = 0; n < t.length; n += 1) U(t[n]);
	}
}
function Gt(e) {
	var t, n = q, r = e.parent;
	if (!dr && r !== null && e.v !== T && r.f & 24576) return ze(), e.v;
	pr(r);
	try {
		e.f &= ~ce, Wt(e), t = wr(e);
	} finally {
		pr(n);
	}
	return t;
}
function Kt(e) {
	var t = Gt(e);
	!e.equals(t) && (e.wv = xr(), (!P?.is_fork || e.deps === null) && (P === null ? e.v = t : (P.capture(e, t, !0), Xt?.capture(e, t, !0)), e.deps === null)) ? N(e, x) : dr || (F === null ? bt(e) : (Bn() || P?.is_fork) && F.set(e, t));
}
function qt(e) {
	if (e.effects !== null) for (let t of e.effects) (t.teardown || t.ac) && (t.teardown?.(), t.ac !== null && kt(() => {
		t.ac.abort(be), t.ac = null;
	}), t.fn !== null && (t.teardown = f), Er(t, 0), er(t));
}
function Jt(e) {
	if (e.effects !== null) for (let t of e.effects) t.teardown && t.fn !== null && Dr(t);
}
// node_modules/svelte/src/internal/client/reactivity/batch.js
var Yt = null, P = null, Xt = null, F = null, Zt = null, Qt = !1, $t = !1, en = null, tn = null, nn = 0, rn = 1, an = class e {
	id = rn++;
	#e = !1;
	linked = !0;
	#t = null;
	#n = null;
	async_deriveds = /* @__PURE__ */ new Map();
	current = /* @__PURE__ */ new Map();
	previous = /* @__PURE__ */ new Map();
	#r = /* @__PURE__ */ new Set();
	#i = /* @__PURE__ */ new Set();
	#a = 0;
	#o = /* @__PURE__ */ new Map();
	#s = null;
	#c = [];
	#l = [];
	#u = /* @__PURE__ */ new Set();
	#d = /* @__PURE__ */ new Set();
	#f = /* @__PURE__ */ new Map();
	#p = /* @__PURE__ */ new Set();
	is_fork = !1;
	#m = !1;
	constructor() {
		Yt === null ? Yt = this : (Yt.#n = this, this.#t = Yt), Yt = this;
	}
	#h() {
		if (this.is_fork) return !0;
		for (let n of this.#o.keys()) {
			for (var e = n, t = !1; e.parent !== null;) {
				if (this.#f.has(e)) {
					t = !0;
					break;
				}
				e = e.parent;
			}
			if (!t) return !0;
		}
		return !1;
	}
	skip_effect(e) {
		this.#f.has(e) || this.#f.set(e, {
			d: [],
			m: []
		}), this.#p.delete(e);
	}
	unskip_effect(e, t = (e) => this.schedule(e)) {
		var n = this.#f.get(e);
		if (n) {
			this.#f.delete(e);
			for (var r of n.d) N(r, S), t(r);
			for (r of n.m) N(r, C), t(r);
		}
		this.#p.add(e);
	}
	#g() {
		this.#e = !0, nn++ > 1e3 && (this.#x(), sn());
		for (let e of this.#u) this.#d.delete(e), N(e, S), this.schedule(e);
		for (let e of this.#d) N(e, C), this.schedule(e);
		let t = this.#c;
		this.#c = [], this.apply();
		var n = en = [], r = [], i = tn = [];
		for (let e of t) try {
			this.#_(e, n, r);
		} catch (t) {
			throw fn(e), this.#h() || this.discard(), t;
		}
		if (P = null, i.length > 0) {
			var a = e.ensure();
			for (let e of i) a.schedule(e);
		}
		if (en = null, tn = null, this.#h()) {
			this.#b(r), this.#b(n);
			for (let [e, t] of this.#f) dn(e, t);
			i.length > 0 && P.#g();
			return;
		}
		let o = this.#v();
		if (o) this.#b(r), this.#b(n), o.#y(this);
		else {
			this.#u.clear(), this.#d.clear();
			for (let e of this.#r) e(this);
			this.#r.clear(), Xt = this, ln(r), ln(n), Xt = null, this.#s?.resolve();
			var s = P;
			if (this.#a === 0 && (this.#c.length === 0 || s !== null) && this.#x(), this.#c.length > 0) {
				if (s !== null) {
					let e = s;
					e.#c.push(...this.#c.filter((t) => !e.#c.includes(t)));
				} else s = this;
			}
			s !== null && s.#g();
		}
	}
	#_(e, t, n) {
		e.f ^= x;
		for (var r = e.first; r !== null;) {
			var i = r.f, a = !!(i & 96);
			if (!(a && i & 1024 || i & 8192 || this.#f.has(r)) && r.fn !== null) {
				a ? r.f ^= x : i & 4 ? t.push(r) : Sr(r) && (i & 16 && this.#d.add(r), Dr(r));
				var o = r.first;
				if (o !== null) {
					r = o;
					continue;
				}
			}
			for (; r !== null;) {
				var s = r.next;
				if (s !== null) {
					r = s;
					break;
				}
				r = r.parent;
			}
		}
	}
	#v() {
		for (var e = this.#t; e !== null;) {
			if (!e.is_fork) {
				for (let [t, [, n]] of this.current) if (e.current.has(t) && !n) return e;
			}
			e = e.#t;
		}
		return null;
	}
	#y(e) {
		for (let [t, n] of e.current) !this.previous.has(t) && e.previous.has(t) && this.previous.set(t, e.previous.get(t)), this.current.set(t, n);
		for (let [t, n] of e.async_deriveds) {
			let e = this.async_deriveds.get(t);
			e && n.promise.then(e.resolve).catch(e.reject);
		}
		e.async_deriveds.clear(), this.transfer_effects(e.#u, e.#d);
		let t = (e) => {
			var n = e.reactions;
			if (n !== null && !(e.f & 2 && !(e.f & 6144))) for (let e of n) {
				var r = e.f;
				if (r & 2) t(e);
				else {
					var i = e;
					r & 4194320 && !this.async_deriveds.has(i) && (this.#d.delete(i), N(i, S), this.schedule(i));
				}
			}
		};
		for (let e of this.current.keys()) t(e);
		this.oncommit(() => e.discard()), e.#x(), P = this, this.#g();
	}
	#b(e) {
		for (var t = 0; t < e.length; t += 1) St(e[t], this.#u, this.#d);
	}
	capture(e, t, n = !1) {
		e.v !== T && !this.previous.has(e) && this.previous.set(e, e.v), e.f & 8388608 || (this.current.set(e, [t, n]), F?.set(e, t)), this.is_fork || (e.v = t);
	}
	activate() {
		P = this;
	}
	deactivate() {
		P = null, F = null;
	}
	flush() {
		try {
			$t = !0, P = this, this.#g();
		} finally {
			nn = 0, Zt = null, en = null, tn = null, $t = !1, P = null, F = null, mn.clear();
		}
	}
	discard() {
		for (let e of this.#i) e(this);
		this.#i.clear();
		for (let e of this.async_deriveds.values()) e.reject(Bt);
		this.#x(), this.#s?.resolve();
	}
	register_created_effect(e) {
		this.#l.push(e);
	}
	increment(e, t) {
		if (this.#a += 1, e) {
			let e = this.#o.get(t) ?? 0;
			this.#o.set(t, e + 1);
		}
	}
	decrement(e, t) {
		if (--this.#a, e) {
			let e = this.#o.get(t) ?? 0;
			e === 1 ? this.#o.delete(t) : this.#o.set(t, e - 1);
		}
		this.#m || (this.#m = !0, M(() => {
			this.#m = !1, this.linked && this.flush();
		}));
	}
	transfer_effects(e, t) {
		for (let t of e) this.#u.add(t);
		for (let e of t) this.#d.add(e);
		e.clear(), t.clear();
	}
	oncommit(e) {
		this.#r.add(e);
	}
	ondiscard(e) {
		this.#i.add(e);
	}
	settled() {
		return (this.#s ??= g()).promise;
	}
	static ensure() {
		if (P === null) {
			let t = P = new e();
			!$t && !Qt && M(() => {
				t.#e || t.flush();
			});
		}
		return P;
	}
	apply() {
		F = null;
	}
	schedule(e) {
		if (Zt = e, e.b?.is_pending && e.f & 16777228 && !(e.f & 32768)) e.b.defer_effect(e);
		else {
			for (var t = e; t.parent !== null;) {
				t = t.parent;
				var n = t.f;
				if (en !== null && t === q && (W === null || !(W.f & 2))) return;
				if (n & 96) {
					if (!(n & 1024)) return;
					t.f ^= x;
				}
			}
			this.#c.push(t);
		}
	}
	#x() {
		if (this.linked) {
			var e = this.#t, t = this.#n;
			e === null || (e.#n = t), t === null ? Yt = e : t.#t = e, this.linked = !1;
		}
	}
};
function on(e) {
	var t = Qt;
	Qt = !0;
	try {
		var n;
		for (e && (P !== null && !P.is_fork && P.flush(), n = e());;) {
			if (gt(), P === null) return n;
			P.flush();
		}
	} finally {
		Qt = t;
	}
}
function sn() {
	try {
		Oe();
	} catch (e) {
		vt(e, Zt);
	}
}
var cn = null;
function ln(e) {
	var t = e.length;
	if (t !== 0) {
		for (var n = 0; n < t;) {
			var r = e[n++];
			if (!(r.f & 24576) && Sr(r) && (cn = /* @__PURE__ */ new Set(), Dr(r), r.deps === null && r.first === null && r.nodes === null && r.teardown === null && r.ac === null && rr(r), cn?.size > 0)) {
				mn.clear();
				for (let e of cn) {
					if (e.f & 24576) continue;
					let t = [e], n = e.parent;
					for (; n !== null;) cn.has(n) && (cn.delete(n), t.push(n)), n = n.parent;
					for (let e = t.length - 1; e >= 0; e--) {
						let n = t[e];
						n.f & 24576 || Dr(n);
					}
				}
				cn.clear();
			}
		}
		cn = null;
	}
}
function un(e) {
	P.schedule(e);
}
function dn(e, t) {
	if (!(e.f & 32 && e.f & 1024)) {
		e.f & 2048 ? t.d.push(e) : e.f & 4096 && t.m.push(e), N(e, x);
		for (var n = e.first; n !== null;) dn(n, t), n = n.next;
	}
}
function fn(e) {
	N(e, x);
	for (var t = e.first; t !== null;) fn(t), t = t.next;
}
// node_modules/svelte/src/internal/client/reactivity/sources.js
var pn = /* @__PURE__ */ new Set(), mn = /* @__PURE__ */ new Map(), hn = !1;
function I(e, t) {
	return {
		f: 0,
		v: e,
		reactions: null,
		equals: qe,
		rv: 0,
		wv: 0
	};
}
/*#__NO_SIDE_EFFECTS__*/
function gn(e, t) {
	let n = I(e, t);
	return hr(n), n;
}
/*#__NO_SIDE_EFFECTS__*/
function _n(e, t = !1, n = !0) {
	let r = I(e);
	return t || (r.equals = Ye), Xe && n && j !== null && j.l !== null && (j.l.s ??= []).push(r), r;
}
function L(e, t, n = !1) {
	return W !== null && (!G || W.f & 131072) && dt() && W.f & 4325394 && (mr === null || !mr.has(e)) && Me(), vn(e, n ? Cn(t) : t, tn);
}
function vn(e, t, n = null) {
	if (!e.equals(t)) {
		mn.set(e, dr ? t : e.v);
		var r = an.ensure();
		if (r.capture(e, t), e.f & 2) {
			let t = e;
			e.f & 2048 && Gt(t), F === null && bt(t);
		}
		e.wv = xr(), Sn(e, S, n), dt() && q !== null && q.f & 1024 && !(q.f & 96) && (X === null ? gr([e]) : X.push(e)), !r.is_fork && pn.size > 0 && !hn && yn();
	}
	return t;
}
function yn() {
	hn = !1;
	for (let e of pn) {
		e.f & 1024 && N(e, C);
		let t;
		try {
			t = Sr(e);
		} catch {
			t = !0;
		}
		t && Dr(e);
	}
	pn.clear();
}
function bn(e, t = 1) {
	var n = Z(e), r = t === 1 ? n++ : n--;
	return L(e, n), r;
}
function xn(e) {
	L(e, e.v + 1);
}
function Sn(e, t, n) {
	var r = e.reactions;
	if (r !== null) for (var i = dt(), a = r.length, o = 0; o < a; o++) {
		var s = r[o], c = s.f;
		if (i || s !== q) {
			var l = (c & S) === 0;
			if (l && N(s, t), c & 131072) pn.add(s);
			else if (c & 2) {
				var u = s;
				F?.delete(u), c & 65536 || (c & 512 && (q === null || !(q.f & 2097152)) && (s.f |= ce), Sn(u, C, n));
			} else if (l) {
				var d = s;
				c & 16 && cn !== null && cn.add(d), n === null ? un(d) : n.push(d);
			}
		}
	}
}
function Cn(t) {
	if (typeof t != "object" || !t || w in t) return t;
	let n = l(t);
	if (n !== s && n !== c) return t;
	var r = /* @__PURE__ */ new Map(), i = e(t), o = /* @__PURE__ */ gn(0), u = null, d = yr, f = (e) => {
		if (yr === d) return e();
		var t = W, n = yr;
		K(null), br(d);
		var r = e();
		return K(t), br(n), r;
	};
	return i && r.set("length", /* @__PURE__ */ gn(t.length, u)), new Proxy(t, {
		defineProperty(e, t, n) {
			"value" in n && n.configurable !== !1 && n.enumerable !== !1 && n.writable !== !1 || Ae();
			var i = r.get(t);
			return i === void 0 ? f(() => {
				var e = /* @__PURE__ */ gn(n.value, u);
				return r.set(t, e), e;
			}) : L(i, n.value, !0), !0;
		},
		deleteProperty(e, t) {
			var n = r.get(t);
			if (n === void 0) {
				if (t in e) {
					let e = f(() => /* @__PURE__ */ gn(T, u));
					r.set(t, e), xn(o);
				}
			} else L(n, T), xn(o);
			return !0;
		},
		get(e, n, i) {
			if (n === w) return t;
			var o = r.get(n), s = n in e;
			if (o === void 0 && (!s || a(e, n)?.writable) && (o = f(() => /* @__PURE__ */ gn(Cn(s ? e[n] : T), u)), r.set(n, o)), o !== void 0) {
				var c = Z(o);
				return c === T ? void 0 : c;
			}
			return Reflect.get(e, n, i);
		},
		getOwnPropertyDescriptor(e, t) {
			var n = Reflect.getOwnPropertyDescriptor(e, t);
			if (n && "value" in n) {
				var i = r.get(t);
				i && (n.value = Z(i));
			} else if (n === void 0) {
				var a = r.get(t), o = a?.v;
				if (a !== void 0 && o !== T) return {
					enumerable: !0,
					configurable: !0,
					value: o,
					writable: !0
				};
			}
			return n;
		},
		has(e, t) {
			if (t === w) return !0;
			var n = r.get(t), i = n !== void 0 && n.v !== T || Reflect.has(e, t);
			return (n !== void 0 || q !== null && (!i || a(e, t)?.writable)) && (n === void 0 && (n = f(() => /* @__PURE__ */ gn(i ? Cn(e[t]) : T, u)), r.set(t, n)), Z(n) === T) ? !1 : i;
		},
		set(e, t, n, s) {
			var c = r.get(t), l = t in e;
			if (i && t === "length") for (var d = n; d < c.v; d += 1) {
				var p = r.get(d + "");
				p === void 0 ? d in e && (p = f(() => /* @__PURE__ */ gn(T, u)), r.set(d + "", p)) : L(p, T);
			}
			if (c === void 0) (!l || a(e, t)?.writable) && (c = f(() => /* @__PURE__ */ gn(void 0, u)), L(c, Cn(n)), r.set(t, c));
			else {
				l = c.v !== T;
				var m = f(() => Cn(n));
				L(c, m);
			}
			var h = Reflect.getOwnPropertyDescriptor(e, t);
			if (h?.set && h.set.call(s, n), !l) {
				if (i && typeof t == "string") {
					var g = r.get("length"), _ = Number(t);
					Number.isInteger(_) && _ >= g.v && L(g, _ + 1);
				}
				xn(o);
			}
			return !0;
		},
		ownKeys(e) {
			Z(o);
			var t = Reflect.ownKeys(e).filter((e) => {
				var t = r.get(e);
				return t === void 0 || t.v !== T;
			});
			for (var [n, i] of r) i.v !== T && !(n in e) && t.push(n);
			return t;
		},
		setPrototypeOf() {
			je();
		}
	});
}
function wn(e) {
	try {
		if (typeof e == "object" && e && w in e) return e[w];
	} catch {}
	return e;
}
function Tn(e, t) {
	return Object.is(wn(e), wn(t));
}
var En, Dn, On, kn;
function An() {
	if (En === void 0) {
		En = window, Dn = /Firefox/.test(navigator.userAgent);
		var e = Element.prototype, t = Node.prototype, n = Text.prototype;
		On = a(t, "firstChild").get, kn = a(t, "nextSibling").get, u(e) && (e[ge] = void 0, e[he] = null, e[_e] = void 0, e.__e = void 0), u(n) && (n[ve] = void 0);
	}
}
function R(e = "") {
	return document.createTextNode(e);
}
/*@__NO_SIDE_EFFECTS__*/
function z(e) {
	return On.call(e);
}
/*@__NO_SIDE_EFFECTS__*/
function B(e) {
	return kn.call(e);
}
function jn(e, t) {
	if (!E) return /* @__PURE__ */ z(e);
	var n = /* @__PURE__ */ z(O);
	if (n === null) n = O.appendChild(R());
	else if (t && n.nodeType !== 3) {
		var r = R();
		return n?.before(r), k(r), r;
	}
	return t && Ln(n), k(n), n;
}
function Mn(e, t = !1) {
	if (!E) {
		var n = /* @__PURE__ */ z(e);
		return n instanceof Comment && n.data === "" ? /* @__PURE__ */ B(n) : n;
	}
	if (t) {
		if (O?.nodeType !== 3) {
			var r = R();
			return O?.before(r), k(r), r;
		}
		Ln(O);
	}
	return O;
}
function Nn(e, t = 1, n = !1) {
	let r = E ? O : e;
	for (var i; t--;) i = r, r = /* @__PURE__ */ B(r);
	if (!E) return r;
	if (n) {
		if (r?.nodeType !== 3) {
			var a = R();
			return r === null ? i?.after(a) : r.before(a), k(a), a;
		}
		Ln(r);
	}
	return k(r), r;
}
function Pn(e) {
	e.textContent = "";
}
function Fn() {
	return !1;
}
function In(e, t, n) {
	return t == null || t === "http://www.w3.org/1999/xhtml" ? n ? document.createElement(e, { is: n }) : document.createElement(e) : n ? document.createElementNS(t, e, { is: n }) : document.createElementNS(t, e);
}
function Ln(e) {
	if (e.nodeValue.length < 65536) return;
	let t = e.nextSibling;
	for (; t !== null && t.nodeType === 3;) t.remove(), e.nodeValue += t.nodeValue, t = e.nextSibling;
}
// node_modules/svelte/src/internal/client/reactivity/effects.js
function Rn(e) {
	q === null && (W === null && De(e), Ee()), dr && Te(e);
}
function zn(e, t) {
	var n = t.last;
	n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function V(e, t) {
	var n = q;
	n !== null && n.f & 8192 && (e |= ee);
	var r = {
		ctx: j,
		deps: null,
		nodes: null,
		f: e | S | 512,
		first: null,
		fn: t,
		last: null,
		next: null,
		parent: n,
		b: n && n.b,
		prev: null,
		teardown: null,
		wv: 0,
		ac: null
	};
	P?.register_created_effect(r);
	var i = r;
	if (e & 4) en === null ? an.ensure().schedule(r) : en.push(r);
	else if (t !== null) {
		try {
			Dr(r);
		} catch (e) {
			throw U(r), e;
		}
		i.deps === null && i.teardown === null && i.nodes === null && i.first === i.last && !(i.f & 524288) && (i = i.first, e & 16 && e & 65536 && i !== null && (i.f |= ie));
	}
	if (i !== null && (i.parent = n, n !== null && zn(i, n), W !== null && W.f & 2 && !(e & 64))) {
		var a = W;
		(a.effects ??= []).push(i);
	}
	return r;
}
function Bn() {
	return W !== null && !G;
}
function Vn(e) {
	let t = V(8, null);
	return N(t, x), t.teardown = e, t;
}
function Hn(e) {
	Rn("$effect");
	var t = q.f;
	if (!W && t & 32 && j !== null && !j.i) {
		var n = j;
		(n.e ??= []).push(e);
	} else return Un(e);
}
function Un(e) {
	return V(4 | oe, e);
}
function Wn(e) {
	return Rn("$effect.pre"), V(8 | oe, e);
}
function Gn(e) {
	an.ensure();
	let t = V(64 | ae, e);
	return () => {
		U(t);
	};
}
function Kn(e) {
	an.ensure();
	let t = V(64 | ae, e);
	return (e = {}) => new Promise((n) => {
		e.outro ? ir(t, () => {
			U(t), n(void 0);
		}) : (U(t), n(void 0));
	});
}
function qn(e) {
	return V(4, e);
}
function Jn(e) {
	return V(ue | ae, e);
}
function Yn(e, t = 0) {
	return V(8 | t, e);
}
function Xn(e, t = [], n = [], r = []) {
	Ft(r, t, n, (t) => {
		V(8, () => {
			e(...t.map(Z));
		});
	});
}
function Zn(e, t = 0) {
	return V(16 | t, e);
}
function Qn(e, t = 0) {
	return V(b | t, e);
}
function H(e) {
	return V(32 | ae, e);
}
function $n(e) {
	var t = e.teardown;
	if (t !== null) {
		let e = dr, n = W;
		fr(!0), K(null);
		try {
			t.call(null);
		} finally {
			fr(e), K(n);
		}
	}
}
function er(e, t = !1) {
	var n = e.first;
	for (e.first = e.last = null; n !== null;) {
		let e = n.ac;
		e !== null && kt(() => {
			e.abort(be);
		});
		var r = n.next;
		n.f & 64 ? n.parent = null : U(n, t), n = r;
	}
}
function tr(e) {
	for (var t = e.first; t !== null;) {
		var n = t.next;
		t.f & 32 || U(t), t = n;
	}
}
function U(e, t = !0) {
	var n = !1;
	(t || e.f & 262144) && e.nodes !== null && e.nodes.end !== null && (nr(e.nodes.start, e.nodes.end), n = !0), e.f |= re, er(e, t && !n), Er(e, 0);
	var r = e.nodes && e.nodes.t;
	if (r !== null) for (let e of r) e.stop();
	$n(e), e.f ^= re, e.f |= te;
	var i = e.parent;
	i !== null && i.first !== null && rr(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function nr(e, t) {
	for (; e !== null;) {
		var n = e === t ? null : /* @__PURE__ */ B(e);
		e.remove(), e = n;
	}
}
function rr(e) {
	var t = e.parent, n = e.prev, r = e.next;
	n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function ir(e, t, n = !0) {
	var r = [];
	ar(e, r, !0);
	var i = () => {
		n && U(e), t && t();
	}, a = r.length;
	if (a > 0) {
		var o = () => --a || i();
		for (var s of r) s.out(o);
	} else i();
}
function ar(e, t, n) {
	if (!(e.f & 8192)) {
		e.f ^= ee;
		var r = e.nodes && e.nodes.t;
		if (r !== null) for (let e of r) (e.is_global || n) && t.push(e);
		for (var i = e.first; i !== null;) {
			var a = i.next;
			if (!(i.f & 64)) {
				var o = !!(i.f & 65536) || !!(i.f & 32) && !!(e.f & 16);
				ar(i, t, o ? n : !1);
			}
			i = a;
		}
	}
}
function or(e) {
	sr(e, !0);
}
function sr(e, t) {
	if (e.f & 8192) {
		e.f ^= ee, e.f & 1024 || (N(e, S), an.ensure().schedule(e));
		for (var n = e.first; n !== null;) {
			var r = n.next, i = !!(n.f & 65536) || !!(n.f & 32);
			sr(n, i ? t : !1), n = r;
		}
		var a = e.nodes && e.nodes.t;
		if (a !== null) for (let e of a) (e.is_global || t) && e.in();
	}
}
function cr(e, t) {
	if (e.nodes) for (var n = e.nodes.start, r = e.nodes.end; n !== null;) {
		var i = n === r ? null : /* @__PURE__ */ B(n);
		t.append(n), n = i;
	}
}
// node_modules/svelte/src/internal/client/legacy.js
var lr = null, ur = !1, dr = !1;
function fr(e) {
	dr = e;
}
var W = null, G = !1;
function K(e) {
	W = e;
}
var q = null;
function pr(e) {
	q = e;
}
var mr = null;
function hr(e) {
	W !== null && (mr ??= /* @__PURE__ */ new Set()).add(e);
}
var J = null, Y = 0, X = null;
function gr(e) {
	X = e;
}
var _r = 1, vr = 0, yr = vr;
function br(e) {
	yr = e;
}
function xr() {
	return ++_r;
}
function Sr(e) {
	var t = e.f;
	if (t & 2048) return !0;
	if (t & 2 && (e.f &= ~ce), t & 4096) {
		for (var n = e.deps, r = n.length, i = 0; i < r; i++) {
			var a = n[i];
			if (Sr(a) && Kt(a), a.wv > e.wv) return !0;
		}
		t & 512 && F === null && N(e, x);
	}
	return !1;
}
function Cr(e, t, n = !0) {
	var r = e.reactions;
	if (r !== null && !(mr !== null && mr.has(e))) for (var i = 0; i < r.length; i++) {
		var a = r[i];
		a.f & 2 ? Cr(a, t, !1) : t === a && (n ? N(a, S) : a.f & 1024 && N(a, C), un(a));
	}
}
function wr(e) {
	var t = J, n = Y, r = X, i = W, a = mr, o = j, s = G, c = yr, l = e.f;
	J = null, Y = 0, X = null, W = l & 96 ? null : e, mr = null, it(e.ctx), G = !1, yr = ++vr, e.ac !== null && (kt(() => {
		e.ac.abort(be);
	}), e.ac = null);
	try {
		e.f |= le;
		var u = e.fn, d = u();
		e.f |= ne;
		var f = e.deps, p = P?.is_fork;
		if (J !== null) {
			var m;
			if (p || Er(e, Y), f !== null && Y > 0) for (f.length = Y + J.length, m = 0; m < J.length; m++) f[Y + m] = J[m];
			else e.deps = f = J;
			if (Bn() && e.f & 512) for (m = Y; m < f.length; m++) (f[m].reactions ??= []).push(e);
		} else !p && f !== null && Y < f.length && (Er(e, Y), f.length = Y);
		if (dt() && X !== null && !G && f !== null && !(e.f & 6146)) for (m = 0; m < X.length; m++) Cr(X[m], e);
		if (i !== null && i !== e) {
			if (vr++, i.deps !== null) for (let e = 0; e < n; e += 1) i.deps[e].rv = vr;
			if (t !== null) for (let e of t) e.rv = vr;
			X !== null && (r === null ? r = X : r.push(...X));
		}
		return e.f & 8388608 && (e.f ^= de), d;
	} catch (e) {
		return _t(e);
	} finally {
		e.f ^= le, J = t, Y = n, X = r, W = i, mr = a, it(o), G = s, yr = c;
	}
}
function Tr(e, r) {
	let i = r.reactions;
	if (i !== null) {
		var a = t.call(i, e);
		if (a !== -1) {
			var o = i.length - 1;
			o === 0 ? i = r.reactions = null : (i[a] = i[o], i.pop());
		}
	}
	if (i === null && r.f & 2 && (J === null || !n.call(J, r))) {
		var s = r;
		s.f & 512 && (s.f ^= 512, s.f &= ~ce), s.v !== T && bt(s), s.ac !== null && kt(() => {
			s.ac.abort(be), s.ac = null, N(s, S);
		}), qt(s), Er(s, 0);
	}
}
function Er(e, t) {
	var n = e.deps;
	if (n !== null) for (var r = t; r < n.length; r++) Tr(e, n[r]);
}
function Dr(e) {
	var t = e.f;
	if (!(t & 16384)) {
		N(e, x);
		var n = q, r = ur;
		q = e, ur = !(t & 96);
		try {
			t & 16777232 ? tr(e) : er(e), $n(e);
			var i = wr(e);
			e.teardown = typeof i == "function" ? i : null, e.wv = _r;
		} finally {
			ur = r, q = n;
		}
	}
}
async function Or() {
	await Promise.resolve(), on();
}
function Z(e) {
	var t = !!(e.f & 2);
	if (lr?.add(e), W !== null && !G && !(q !== null && q.f & 16384) && (mr === null || !mr.has(e))) {
		var r = W.deps;
		if (W.f & 2097152) e.rv < vr && (e.rv = vr, J === null && r !== null && r[Y] === e ? Y++ : J === null ? J = [e] : J.push(e));
		else {
			W.deps ??= [], n.call(W.deps, e) || W.deps.push(e);
			var i = e.reactions;
			i === null ? e.reactions = [W] : n.call(i, W) || i.push(W);
		}
	}
	if (dr && mn.has(e)) return mn.get(e);
	if (t) {
		var a = e;
		if (dr) {
			var o = a.v;
			return (!(a.f & 1024) && a.reactions !== null || Ar(a)) && (o = Gt(a)), mn.set(a, o), o;
		}
		var s = !(a.f & 512) && !G && W !== null && (ur || !!(W.f & 512)), c = (a.f & ne) === 0;
		Sr(a) && (s && (a.f |= 512), Kt(a)), s && !c && (Jt(a), kr(a));
	}
	if (F?.has(e)) return F.get(e);
	if (e.f & 8388608) throw e.v;
	return e.v;
}
function kr(e) {
	if (e.f |= 512, e.deps !== null) for (let t of e.deps) (t.reactions ??= []).push(e), t.f & 2 && !(t.f & 512) && (Jt(t), kr(t));
}
function Ar(e) {
	if (e.v === T) return !0;
	if (e.deps === null) return !1;
	for (let t of e.deps) if (mn.has(t) || t.f & 2 && Ar(t)) return !0;
	return !1;
}
function Q(e) {
	var t = G;
	try {
		return G = !0, e();
	} finally {
		G = t;
	}
}
function jr(e) {
	if (!(typeof e != "object" || !e || e instanceof EventTarget)) {
		if (w in e) Mr(e);
		else if (!Array.isArray(e)) for (let t in e) {
			let n = e[t];
			typeof n == "object" && n && w in n && Mr(n);
		}
	}
}
function Mr(e, t = /* @__PURE__ */ new Set()) {
	if (typeof e == "object" && e && !(e instanceof EventTarget) && !t.has(e)) {
		t.add(e), e instanceof Date && e.getTime();
		for (let n in e) try {
			Mr(e[n], t);
		} catch {}
		let n = l(e);
		if (n !== Object.prototype && n !== Array.prototype && n !== Map.prototype && n !== Set.prototype && n !== Date.prototype) {
			let t = o(n);
			for (let n in t) {
				let r = t[n].get;
				if (r) try {
					r.call(e);
				} catch {}
			}
		}
	}
}
// node_modules/svelte/src/attachments/index.js
function Nr() {
	return Symbol(Re);
}
function Pr(e) {
	return e.endsWith("capture") && e !== "gotpointercapture" && e !== "lostpointercapture";
}
var Fr = [
	"beforeinput",
	"click",
	"change",
	"dblclick",
	"contextmenu",
	"focusin",
	"focusout",
	"input",
	"keydown",
	"keyup",
	"mousedown",
	"mousemove",
	"mouseout",
	"mouseover",
	"mouseup",
	"pointerdown",
	"pointermove",
	"pointerout",
	"pointerover",
	"pointerup",
	"touchend",
	"touchmove",
	"touchstart"
];
function Ir(e) {
	return Fr.includes(e);
}
var Lr = /* @__PURE__ */ "allowfullscreen.async.autofocus.autoplay.checked.controls.default.disabled.formnovalidate.indeterminate.inert.ismap.loop.multiple.muted.nomodule.novalidate.open.playsinline.readonly.required.reversed.seamless.selected.webkitdirectory.defer.disablepictureinpicture.disableremoteplayback".split("."), Rr = {
	formnovalidate: "formNoValidate",
	ismap: "isMap",
	nomodule: "noModule",
	playsinline: "playsInline",
	readonly: "readOnly",
	defaultvalue: "defaultValue",
	defaultchecked: "defaultChecked",
	srcobject: "srcObject",
	novalidate: "noValidate",
	allowfullscreen: "allowFullscreen",
	disablepictureinpicture: "disablePictureInPicture",
	disableremoteplayback: "disableRemotePlayback"
};
function zr(e) {
	return e = e.toLowerCase(), Rr[e] ?? e;
}
[...Lr];
var Br = ["touchstart", "touchmove"];
function Vr(e) {
	return Br.includes(e);
}
var Hr = [
	"textarea",
	"script",
	"style",
	"title"
];
function Ur(e) {
	return Hr.includes(e);
}
// node_modules/svelte/src/internal/client/dom/elements/events.js
var Wr = Symbol("events"), Gr = /* @__PURE__ */ new Set(), Kr = /* @__PURE__ */ new Set();
function qr(e) {
	if (!E) return;
	e.removeAttribute("onload"), e.removeAttribute("onerror");
	let t = e.__e;
	t !== void 0 && (e.__e = void 0, queueMicrotask(() => {
		e.isConnected && e.dispatchEvent(t);
	}));
}
function Jr(e, t, n, r = {}) {
	function i(e) {
		if (r.capture || ei.call(t, e), !e.cancelBubble) return kt(() => n?.call(this, e));
	}
	return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? M(() => {
		t.addEventListener(e, i, r);
	}) : t.addEventListener(e, i, r), i;
}
function Yr(e, t, n, r = {}) {
	var i = Jr(t, e, n, r);
	return () => {
		e.removeEventListener(t, i, r);
	};
}
function Xr(e, t, n, r, i) {
	var a = {
		capture: r,
		passive: i
	}, o = Jr(e, t, n, a);
	(t === document.body || t === window || t === document || t instanceof HTMLMediaElement) && Vn(() => {
		t.removeEventListener(e, o, a);
	});
}
function Zr(e, t, n) {
	(t[Wr] ??= {})[e] = n;
}
function Qr(e) {
	for (var t = 0; t < e.length; t++) Gr.add(e[t]);
	for (var n of Kr) n(e);
}
var $r = null;
function ei(e) {
	var t = this, n = t.ownerDocument, r = e.type, a = e.composedPath?.() || [], o = a[0] || e.target;
	$r = e;
	var s = 0, c = $r === e && e[Wr];
	if (c) {
		var l = a.indexOf(c);
		if (l !== -1 && (t === document || t === window)) {
			e[Wr] = t;
			return;
		}
		var u = a.indexOf(t);
		if (u === -1) return;
		l <= u && (s = l);
	}
	if (o = a[s] || e.target, o !== t) {
		i(e, "currentTarget", {
			configurable: !0,
			get() {
				return o || n;
			}
		});
		var d = W, f = q;
		K(null), pr(null);
		try {
			for (var p, m = []; o !== null && o !== t;) {
				try {
					var h = o[Wr]?.[r];
					h == null || o.disabled && e.target !== o || h.call(o, e);
				} catch (e) {
					p ? m.push(e) : p = e;
				}
				if (e.cancelBubble) break;
				s++, o = s < a.length ? a[s] : null;
			}
			if (p) {
				for (let e of m) queueMicrotask(() => {
					throw e;
				});
				throw p;
			}
		} finally {
			e[Wr] = t, delete e.currentTarget, K(d), pr(f);
		}
	}
}
// node_modules/svelte/src/internal/client/dom/reconciler.js
var ti = globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", { createHTML: (e) => e });
function ni(e) {
	return ti?.createHTML(e) ?? e;
}
function ri(e) {
	var t = In("template");
	return t.innerHTML = ni(e.replaceAll("<!>", "<!---->")), t.content;
}
// node_modules/svelte/src/internal/client/dom/template.js
function $(e, t) {
	var n = q;
	n.nodes === null && (n.nodes = {
		start: e,
		end: t,
		a: null,
		t: null
	});
}
/*#__NO_SIDE_EFFECTS__*/
function ii(e, t) {
	var n = !!(t & 1), r = !!(t & 2), i, a = !e.startsWith("<!>");
	return () => {
		if (E) return $(O, null), O;
		i === void 0 && (i = ri(a ? e : "<!>" + e), n || (i = /* @__PURE__ */ z(i)));
		var t = r || Dn ? document.importNode(i, !0) : i.cloneNode(!0);
		if (n) {
			var o = /* @__PURE__ */ z(t), s = t.lastChild;
			$(o, s);
		} else $(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function ai(e, t, n = "svg") {
	var r = !e.startsWith("<!>"), i = !!(t & 1), a = `<${n}>${r ? e : "<!>" + e}</${n}>`, o;
	return () => {
		if (E) return $(O, null), O;
		if (!o) {
			var e = /* @__PURE__ */ z(ri(a));
			if (i) for (o = document.createDocumentFragment(); /* @__PURE__ */ z(e);) o.appendChild(/* @__PURE__ */ z(e));
			else o = /* @__PURE__ */ z(e);
		}
		var t = o.cloneNode(!0);
		if (i) {
			var n = /* @__PURE__ */ z(t), r = t.lastChild;
			$(n, r);
		} else $(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function oi(e, t) {
	return /* @__PURE__ */ ai(e, t, "svg");
}
function si(e = "") {
	if (!E) {
		var t = R(e + "");
		return $(t, t), t;
	}
	var n = O;
	return n.nodeType === 3 ? Ln(n) : (n.before(n = R()), k(n)), $(n, n), n;
}
function ci() {
	if (E) return $(O, null), O;
	var e = document.createDocumentFragment(), t = document.createComment(""), n = R();
	return e.append(t, n), $(t, n), e;
}
function li(e, t) {
	if (E) {
		var n = q;
		n.f & 32768 && n.nodes.end !== null || (n.nodes.end = O), A();
	} else e !== null && e.before(t);
}
function ui() {
	if (E && O && O.nodeType === 8 && O.textContent?.startsWith("$")) {
		let e = O.textContent.substring(1);
		return A(), e;
	}
	return (window.__svelte ??= {}).uid ??= 1, `c${window.__svelte.uid++}`;
}
// node_modules/svelte/src/internal/client/render.js
var di = !0;
function fi(e) {
	di = e;
}
function pi(e, t) {
	var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
	n !== (e[ve] ??= e.nodeValue) && (e[ve] = n, e.nodeValue = `${n}`);
}
function mi(e, t) {
	return gi(e, t);
}
var hi = /* @__PURE__ */ new Map();
function gi(e, { target: t, anchor: n, props: i = {}, events: a, context: o, intro: s = !0, transformError: c }) {
	An();
	var l = void 0, u = Kn(() => {
		var u = n ?? t.appendChild(R());
		Nt(u, { pending: () => {} }, (t) => {
			lt({});
			var n = j;
			if (o && (n.c = o), a && (i.$$events = a), E && $(t, null), di = s, l = e(t, i) || {}, di = !0, E && (q.nodes.end = O, O === null || O.nodeType !== 8 || O.data !== "]")) throw Be(), Pe;
			ut();
		}, c);
		var d = /* @__PURE__ */ new Set(), f = (e) => {
			for (var n = 0; n < e.length; n++) {
				var r = e[n];
				if (!d.has(r)) {
					d.add(r);
					var i = Vr(r);
					for (let e of [t, document]) {
						var a = hi.get(e);
						a === void 0 && (a = /* @__PURE__ */ new Map(), hi.set(e, a));
						var o = a.get(r);
						o === void 0 ? (e.addEventListener(r, ei, { passive: i }), a.set(r, 1)) : a.set(r, o + 1);
					}
				}
			}
		};
		return f(r(Gr)), Kr.add(f), () => {
			for (var e of d) for (let n of [t, document]) {
				var r = hi.get(n), i = r.get(e);
				--i == 0 ? (n.removeEventListener(e, ei), r.delete(e), r.size === 0 && hi.delete(n)) : r.set(e, i);
			}
			Kr.delete(f), u !== n && u.parentNode?.removeChild(u);
		};
	});
	return _i.set(l, u), l;
}
var _i = /* @__PURE__ */ new WeakMap();
function vi(e, t) {
	let n = _i.get(e);
	return n ? (_i.delete(e), n(t)) : Promise.resolve();
}
// node_modules/svelte/src/internal/client/dom/blocks/branches.js
var yi = class {
	anchor;
	#e = /* @__PURE__ */ new Map();
	#t = /* @__PURE__ */ new Map();
	#n = /* @__PURE__ */ new Map();
	#r = /* @__PURE__ */ new Set();
	#i = !0;
	constructor(e, t = !0) {
		this.anchor = e, this.#i = t;
	}
	#a = (e) => {
		if (this.#e.has(e)) {
			var t = this.#e.get(e), n = this.#t.get(t);
			if (n) or(n), this.#r.delete(t);
			else {
				var r = this.#n.get(t);
				r && (or(r.effect), this.#t.set(t, r.effect), this.#n.delete(t), r.fragment.lastChild.remove(), this.anchor.before(r.fragment), n = r.effect);
			}
			for (let [t, n] of this.#e) {
				if (this.#e.delete(t), t === e) break;
				let r = this.#n.get(n);
				r && (U(r.effect), this.#n.delete(n));
			}
			for (let [e, r] of this.#t) {
				if (e === t || this.#r.has(e)) continue;
				let i = () => {
					if (Array.from(this.#e.values()).includes(e)) {
						var t = document.createDocumentFragment();
						cr(r, t), t.append(R()), this.#n.set(e, {
							effect: r,
							fragment: t
						});
					} else U(r);
					this.#r.delete(e), this.#t.delete(e);
				};
				this.#i || !n ? (this.#r.add(e), ir(r, i, !1)) : i();
			}
		}
	};
	#o = (e) => {
		this.#e.delete(e);
		let t = Array.from(this.#e.values());
		for (let [e, n] of this.#n) t.includes(e) || (U(n.effect), this.#n.delete(e));
	};
	ensure(e, t) {
		var n = P, r = Fn();
		if (t && !this.#t.has(e) && !this.#n.has(e)) {
			if (r) {
				var i = document.createDocumentFragment(), a = R();
				i.append(a), this.#n.set(e, {
					effect: H(() => t(a)),
					fragment: i
				});
			} else this.#t.set(e, H(() => t(this.anchor)));
		}
		if (this.#e.set(n, e), r) {
			for (let [t, r] of this.#t) t === e ? n.unskip_effect(r) : n.skip_effect(r);
			for (let [t, r] of this.#n) t === e ? n.unskip_effect(r.effect) : n.skip_effect(r.effect);
			n.oncommit(this.#a), n.ondiscard(this.#o);
		} else E && (this.anchor = O), this.#a(n);
	}
}, bi = 0, xi = 1, Si = 2;
function Ci(e, t, n, r, i) {
	E && A();
	var a = dt(), o = T, s = a ? I(o) : /* @__PURE__ */ _n(o, !1, !1), c = a ? I(o) : /* @__PURE__ */ _n(o, !1, !1), l = new yi(e);
	Zn(() => {
		var a = P, o = t(), u = !1;
		let d = E && p(o) === (e.data === "[!");
		if (d && (k(Ge()), D(!1)), p(o)) {
			var f = It(), m = !1;
			let e = (e) => {
				if (!u) {
					m = !0, f(!1), P === a && a.deactivate(), an.ensure();
					try {
						e();
					} finally {
						Lt(!1), Qt || on();
					}
				}
			};
			o.then((t) => {
				e(() => {
					vn(s, t), l.ensure(xi, r && ((e) => r(e, s)));
				});
			}, (t) => {
				e(() => {
					if (vn(c, t), l.ensure(Si, i && ((e) => i(e, c))), !i) throw c.v;
				});
			}), E ? l.ensure(bi, n) : M(() => {
				m || e(() => {
					l.ensure(bi, n);
				});
			});
		} else vn(s, o), l.ensure(xi, r && ((e) => r(e, s)));
		return d && D(!0), () => {
			u = !0;
		};
	});
}
// node_modules/svelte/src/internal/client/dom/blocks/if.js
function wi(e, t, n = !1) {
	var r;
	E && (r = O, A());
	var i = new yi(e), a = n ? ie : 0;
	function o(e, t) {
		if (E) {
			var n = Ke(r);
			if (e !== parseInt(n.substring(1))) {
				var a = Ge();
				k(a), i.anchor = a, D(!1), i.ensure(e, t), D(!0);
				return;
			}
		}
		i.ensure(e, t);
	}
	Zn(() => {
		var e = !1;
		t((t, n = 0) => {
			e = !0, o(n, t);
		}), e || o(-1, null);
	}, a);
}
// node_modules/svelte/src/internal/client/dom/blocks/key.js
var Ti = Symbol("NaN");
function Ei(e, t, n) {
	E && A();
	var r = new yi(e), i = !dt();
	Zn(() => {
		var e = t();
		e !== e && (e = Ti), i && typeof e == "object" && e && (e = {}), r.ensure(e, n);
	});
}
// node_modules/svelte/src/internal/client/dom/blocks/each.js
function Di(e, t) {
	return t;
}
function Oi(e, t, n) {
	for (var i = [], a = t.length, o, s = t.length, c = 0; c < a; c++) {
		let n = t[c];
		ir(n, () => {
			if (o) {
				if (o.pending.delete(n), o.done.add(n), o.pending.size === 0) {
					var t = e.outrogroups;
					ki(e, r(o.done)), t.delete(o), t.size === 0 && (e.outrogroups = null);
				}
			} else --s;
		}, !1);
	}
	if (s === 0) {
		var l = i.length === 0 && n !== null;
		if (l) {
			var u = n, d = u.parentNode;
			Pn(d), d.append(u), e.items.clear();
		}
		ki(e, t, !l);
	} else o = {
		pending: new Set(t),
		done: /* @__PURE__ */ new Set()
	}, (e.outrogroups ??= /* @__PURE__ */ new Set()).add(o);
}
function ki(e, t, n = !0) {
	var r;
	if (e.pending.size > 0) {
		r = /* @__PURE__ */ new Set();
		for (let t of e.pending.values()) for (let n of t) r.add(e.items.get(n).e);
	}
	for (var i = 0; i < t.length; i++) {
		var a = t[i];
		r?.has(a) ? (a.f |= se, cr(a, document.createDocumentFragment())) : U(t[i], n);
	}
}
var Ai;
function ji(t, n, i, a, o, s = null) {
	var c = t, l = /* @__PURE__ */ new Map();
	if (n & 4) {
		var u = t;
		c = E ? k(/* @__PURE__ */ z(u)) : u.appendChild(R());
	}
	E && A();
	var d = null, f = /* @__PURE__ */ Ut(() => {
		var t = i();
		return e(t) ? t : t == null ? [] : r(t);
	}), p, m = /* @__PURE__ */ new Map(), h = !0;
	function g(e) {
		v.effect.f & 16384 || (v.pending.delete(e), v.fallback = d, Ni(v, p, c, n, a), d !== null && (p.length === 0 ? d.f & 33554432 ? (d.f ^= se, Fi(d, null, c)) : or(d) : ir(d, () => {
			d = null;
		})));
	}
	function _(e) {
		v.pending.delete(e);
	}
	var v = {
		effect: Zn(() => {
			p = Z(f);
			var e = p.length;
			let t = !1;
			E && Ke(c) === "[!" != (e === 0) && (c = Ge(), k(c), D(!1), t = !0);
			for (var r = /* @__PURE__ */ new Set(), u = P, v = Fn(), y = 0; y < e; y += 1) {
				E && O.nodeType === 8 && O.data === "]" && (c = O, t = !0, D(!1));
				var b = p[y], x = a(b, y), S = h ? null : l.get(x);
				S ? (S.v && vn(S.v, b), S.i && vn(S.i, y), v && u.unskip_effect(S.e)) : (S = Pi(l, h ? c : Ai ??= R(), b, x, y, o, n, i), h || (S.e.f |= se), l.set(x, S)), r.add(x);
			}
			if (e === 0 && s && !d && (h ? d = H(() => s(c)) : (d = H(() => s(Ai ??= R())), d.f |= se)), e > r.size && we("", "", ""), E && e > 0 && k(Ge()), !h) {
				if (m.set(u, r), v) {
					for (let [e, t] of l) r.has(e) || u.skip_effect(t.e);
					u.oncommit(g), u.ondiscard(_);
				} else g(u);
			}
			t && D(!0), Z(f);
		}),
		flags: n,
		items: l,
		pending: m,
		outrogroups: null,
		fallback: d
	};
	h = !1, E && (c = O);
}
function Mi(e) {
	for (; e !== null && !(e.f & 32);) e = e.next;
	return e;
}
function Ni(e, t, n, i, a) {
	var o = !!(i & 8), s = t.length, c = e.items, l = Mi(e.effect.first), u, d = null, f, p = [], m = [], h, g, _, v;
	if (o) for (v = 0; v < s; v += 1) h = t[v], g = a(h, v), _ = c.get(g).e, _.f & 33554432 || (_.nodes?.a?.measure(), (f ??= /* @__PURE__ */ new Set()).add(_));
	for (v = 0; v < s; v += 1) {
		if (h = t[v], g = a(h, v), _ = c.get(g).e, e.outrogroups !== null) for (let t of e.outrogroups) t.pending.delete(_), t.done.delete(_);
		if (_.f & 8192 && (or(_), o && (_.nodes?.a?.unfix(), (f ??= /* @__PURE__ */ new Set()).delete(_))), _.f & 33554432) {
			if (_.f ^= se, _ === l) Fi(_, null, n);
			else {
				var y = d ? d.next : l;
				_ === e.effect.last && (e.effect.last = _.prev), _.prev && (_.prev.next = _.next), _.next && (_.next.prev = _.prev), Ii(e, d, _), Ii(e, _, y), Fi(_, y, n), d = _, p = [], m = [], l = Mi(d.next);
				continue;
			}
		}
		if (_ !== l) {
			if (u !== void 0 && u.has(_)) {
				if (p.length < m.length) {
					var b = m[0], x;
					d = b.prev;
					var S = p[0], C = p[p.length - 1];
					for (x = 0; x < p.length; x += 1) Fi(p[x], b, n);
					for (x = 0; x < m.length; x += 1) u.delete(m[x]);
					Ii(e, S.prev, C.next), Ii(e, d, S), Ii(e, C, b), l = b, d = C, --v, p = [], m = [];
				} else u.delete(_), Fi(_, l, n), Ii(e, _.prev, _.next), Ii(e, _, d === null ? e.effect.first : d.next), Ii(e, d, _), d = _;
				continue;
			}
			for (p = [], m = []; l !== null && l !== _;) (u ??= /* @__PURE__ */ new Set()).add(l), m.push(l), l = Mi(l.next);
			if (l === null) continue;
		}
		_.f & 33554432 || p.push(_), d = _, l = Mi(_.next);
	}
	if (e.outrogroups !== null) {
		for (let t of e.outrogroups) t.pending.size === 0 && (ki(e, r(t.done)), e.outrogroups?.delete(t));
		e.outrogroups.size === 0 && (e.outrogroups = null);
	}
	if (l !== null || u !== void 0) {
		var ee = [];
		if (u !== void 0) for (_ of u) _.f & 8192 || ee.push(_);
		for (; l !== null;) !(l.f & 8192) && l !== e.fallback && ee.push(l), l = Mi(l.next);
		var te = ee.length;
		if (te > 0) {
			var ne = i & 4 && s === 0 ? n : null;
			if (o) {
				for (v = 0; v < te; v += 1) ee[v].nodes?.a?.measure();
				for (v = 0; v < te; v += 1) ee[v].nodes?.a?.fix();
			}
			Oi(e, ee, ne);
		}
	}
	o && M(() => {
		if (f !== void 0) for (_ of f) _.nodes?.a?.apply();
	});
}
function Pi(e, t, n, r, i, a, o, s) {
	var c = o & 1 ? o & 16 ? I(n) : /* @__PURE__ */ _n(n, !1, !1) : null, l = o & 2 ? I(i) : null;
	return {
		v: c,
		i: l,
		e: H(() => (a(t, c ?? n, l ?? i, s), () => {
			e.delete(r);
		}))
	};
}
function Fi(e, t, n) {
	if (e.nodes) for (var r = e.nodes.start, i = e.nodes.end, a = t && !(t.f & 33554432) ? t.nodes.start : n; r !== null;) {
		var o = /* @__PURE__ */ B(r);
		if (a.before(r), r === i) return;
		r = o;
	}
}
function Ii(e, t, n) {
	t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
function Li(e, t, n = !1, r = !1, i = !1, a = !1) {
	var o = e, s = "";
	if (n) {
		var c = e;
		E && (o = k(/* @__PURE__ */ z(c)));
	}
	Xn(() => {
		var e = q;
		if (s === (s = t() ?? "")) E && A();
		else if (n && !E) e.nodes = null, c.innerHTML = s, s !== "" && $(/* @__PURE__ */ z(c), c.lastChild);
		else if (e.nodes !== null && (nr(e.nodes.start, e.nodes.end), e.nodes = null), s !== "") {
			if (E) {
				for (var a = O.data, l = A(), u = l; l !== null && (l.nodeType !== 8 || l.data !== "");) u = l, l = /* @__PURE__ */ B(l);
				if (l === null) throw Be(), Pe;
				$(O, u), o = k(l);
			} else {
				var d = In(r ? "svg" : i ? "math" : "template", r ? Ie : i ? Le : void 0);
				d.innerHTML = s;
				var f = r || i ? d : d.content;
				if ($(/* @__PURE__ */ z(f), f.lastChild), r || i) for (; /* @__PURE__ */ z(f);) o.before(/* @__PURE__ */ z(f));
				else o.before(f);
			}
		}
	});
}
// node_modules/svelte/src/internal/client/dom/blocks/snippet.js
function Ri(e, t, ...n) {
	var r = new yi(e);
	Zn(() => {
		let e = t() ?? null;
		r.ensure(e, e && ((t) => e(t, ...n)));
	}, ie);
}
// node_modules/svelte/src/internal/client/dom/blocks/svelte-component.js
function zi(e, t, n) {
	var r;
	E && (r = O, A());
	var i = new yi(e);
	Zn(() => {
		var e = t() ?? null;
		if (E && Ke(r) === "[" != (e !== null)) {
			var a = Ge();
			k(a), i.anchor = a, D(!1), i.ensure(e, e && ((t) => n(t, e))), D(!0);
		} else i.ensure(e, e && ((t) => n(t, e)));
	}, ie);
}
// node_modules/svelte/src/internal/client/timing.js
var Bi = () => performance.now(), Vi = {
	tick: (e) => requestAnimationFrame(e),
	now: () => Bi(),
	tasks: /* @__PURE__ */ new Set()
};
// node_modules/svelte/src/internal/client/loop.js
function Hi() {
	let e = Vi.now();
	Vi.tasks.forEach((t) => {
		t.c(e) || (Vi.tasks.delete(t), t.f());
	}), Vi.tasks.size !== 0 && Vi.tick(Hi);
}
function Ui(e) {
	let t;
	return Vi.tasks.size === 0 && Vi.tick(Hi), {
		promise: new Promise((n) => {
			Vi.tasks.add(t = {
				c: e,
				f: n
			});
		}),
		abort() {
			Vi.tasks.delete(t);
		}
	};
}
// node_modules/svelte/src/internal/client/dom/elements/transitions.js
function Wi(e, t) {
	kt(() => {
		e.dispatchEvent(new CustomEvent(t));
	});
}
function Gi(e) {
	if (e === "float") return "cssFloat";
	if (e === "offset") return "cssOffset";
	if (e.startsWith("--")) return e;
	let t = e.split("-");
	return t.length === 1 ? t[0] : t[0] + t.slice(1).map((e) => e[0].toUpperCase() + e.slice(1)).join("");
}
function Ki(e) {
	let t = {}, n = e.split(";");
	for (let e of n) {
		let [n, r] = e.split(":");
		if (!n || r === void 0) break;
		let i = Gi(n.trim());
		t[i] = r.trim();
	}
	return t;
}
var qi = (e) => e;
function Ji(e, t, n, r) {
	var i = !!(e & 1), a = !!(e & 2), o = i && a, s = !!(e & 4), c = o ? "both" : i ? "in" : "out", l, u = t.inert, d = t.style.overflow, f, p;
	function m() {
		return kt(() => l ??= n()(t, r?.() ?? {}, { direction: c }));
	}
	var h = {
		is_global: s,
		in() {
			t.inert = u, i ? (a || f?.abort(), f = Yi(t, m(), p, 1, () => {
				Wi(t, "introstart");
			}, () => {
				Wi(t, "introend"), f?.abort(), f = l = void 0, t.style.overflow = d;
			})) : (p?.abort(), p?.reset?.());
		},
		out(e) {
			a ? (t.inert = !0, p = Yi(t, m(), f, 0, () => {
				Wi(t, "outrostart");
			}, () => {
				Wi(t, "outroend"), e?.();
			})) : (e?.(), l = void 0);
		},
		stop: () => {
			f?.abort(), p?.abort();
		}
	}, g = q;
	if ((g.nodes.t ??= []).push(h), i && di) {
		var _ = s;
		if (!_) {
			for (var v = g.parent; v && v.f & 65536;) for (; (v = v.parent) && !(v.f & 16););
			_ = !v || !!(v.f & 32768);
		}
		_ && qn(() => {
			Q(() => h.in());
		});
	}
}
function Yi(e, t, n, r, i, a) {
	var o = r === 1;
	if (d(t)) {
		var s, c = !1;
		return M(() => {
			c || (s = Yi(e, t({ direction: o ? "in" : "out" }), n, r, i, a));
		}), {
			abort: () => {
				c = !0, s?.abort();
			},
			deactivate: () => s.deactivate(),
			reset: () => s.reset(),
			t: () => s.t()
		};
	}
	if (n?.deactivate(), !t?.duration && !t?.delay) return i(), a(), {
		abort: f,
		deactivate: f,
		reset: f,
		t: () => r
	};
	let { delay: l = 0, css: u, tick: p, easing: m = qi } = t;
	var h = [];
	if (o && n === void 0 && (p && p(0, 1), u)) {
		var g = Ki(u(0, 1));
		h.push(g, g);
	}
	var _ = () => 1 - r, v = e.animate(h, {
		duration: l,
		fill: "forwards"
	});
	return v.onfinish = () => {
		v.cancel(), i();
		var o = n?.t() ?? 1 - r;
		n?.abort();
		var s = r - o, c = t.duration * Math.abs(s), l = [];
		if (c > 0) {
			var d = !1;
			if (u) for (var f = Math.ceil(c / (1e3 / 60)), h = 0; h <= f; h += 1) {
				var g = o + s * m(h / f), y = Ki(u(g, 1 - g));
				l.push(y), d ||= y.overflow === "hidden";
			}
			d && (e.style.overflow = "hidden"), _ = () => {
				var e = v.currentTime;
				return o + s * m(e / c);
			}, p && Ui(() => {
				if (v.playState !== "running") return !1;
				var e = _();
				return p(e, 1 - e), !0;
			});
		}
		v = e.animate(l, {
			duration: c,
			fill: "forwards"
		}), v.onfinish = () => {
			_ = () => r, p?.(r, 1 - r), a();
		};
	}, {
		abort: () => {
			v && (v.cancel(), v.effect = null, v.onfinish = f);
		},
		deactivate: () => {
			a = f;
		},
		reset: () => {
			r === 0 && p?.(1, 0);
		},
		t: () => _()
	};
}
// node_modules/svelte/src/internal/client/dom/blocks/svelte-element.js
function Xi(e, t, n, r, i, a) {
	let o = E;
	E && A();
	var s = null;
	E && O.nodeType === 1 && (s = O, A());
	var c = E ? O : e, l = new yi(c, !1);
	Zn(() => {
		let e = t() || null;
		var a = i ? i() : n || e === "svg" ? Ie : void 0;
		if (e === null) l.ensure(null, null), fi(!0);
		else return l.ensure(e, (t) => {
			if (e) {
				if (s = E ? s : In(e, a), $(s, s), r) {
					var n = null;
					E && Ur(e) && s.append(n = document.createComment(""));
					var i = E ? /* @__PURE__ */ z(s) : s.appendChild(R());
					E && (i === null ? D(!1) : k(i)), r(s, i), n?.remove();
				}
				q.nodes.end = s, t.before(s);
			}
			E && k(t);
		}), fi(!0), () => {
			e && fi(!1);
		};
	}, ie), Vn(() => {
		fi(!0);
	}), o && (D(!0), k(c));
}
// node_modules/svelte/src/internal/client/dom/elements/actions.js
function Zi(e, t, n) {
	qn(() => {
		var r = Q(() => t(e, n?.()) || {});
		if (n && r?.update) {
			var i = !1, a = {};
			Yn(() => {
				var e = n();
				jr(e), i && Je(a, e) && (a = e, r.update(e));
			}), i = !0;
		}
		if (r?.destroy) return () => r.destroy();
	});
}
// node_modules/svelte/src/internal/client/dom/elements/attachments.js
function Qi(e, t) {
	var n = void 0, r;
	Qn(() => {
		n !== (n = t()) && (r &&= (U(r), null), n && (r = H(() => {
			qn(() => n(e));
		})));
	});
}
// node_modules/clsx/dist/clsx.mjs
function $i(e) {
	var t, n, r = "";
	if (typeof e == "string" || typeof e == "number") r += e;
	else if (typeof e == "object") {
		if (Array.isArray(e)) {
			var i = e.length;
			for (t = 0; t < i; t++) e[t] && (n = $i(e[t])) && (r && (r += " "), r += n);
		} else for (n in e) e[n] && (r && (r += " "), r += n);
	}
	return r;
}
function ea() {
	for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = $i(e)) && (r && (r += " "), r += t);
	return r;
}
// node_modules/svelte/src/internal/shared/attributes.js
function ta(e) {
	return typeof e == "object" ? ea(e) : e ?? "";
}
var na = [..." 	\n\r\f\xA0\v﻿"];
function ra(e, t, n) {
	var r = e == null ? "" : "" + e;
	if (t && (r = r ? r + " " + t : t), n) {
		for (var i of Object.keys(n)) if (n[i]) r = r ? r + " " + i : i;
		else if (r.length) for (var a = i.length, o = 0; (o = r.indexOf(i, o)) >= 0;) {
			var s = o + a;
			(o === 0 || na.includes(r[o - 1])) && (s === r.length || na.includes(r[s])) ? r = (o === 0 ? "" : r.substring(0, o)) + r.substring(s + 1) : o = s;
		}
	}
	return r === "" ? null : r;
}
function ia(e, t = !1) {
	var n = t ? " !important;" : ";", r = "";
	for (var i of Object.keys(e)) {
		var a = e[i];
		a != null && a !== "" && (r += " " + i + ": " + a + n);
	}
	return r;
}
function aa(e) {
	return e[0] !== "-" || e[1] !== "-" ? e.toLowerCase() : e;
}
function oa(e, t) {
	if (t) {
		var n = "", r, i;
		if (Array.isArray(t) ? (r = t[0], i = t[1]) : r = t, e) {
			e = String(e).replaceAll(/\s*\/\*.*?\*\/\s*/g, "").trim();
			var a = !1, o = 0, s = !1, c = [];
			r && c.push(...Object.keys(r).map(aa)), i && c.push(...Object.keys(i).map(aa));
			var l = 0, u = -1;
			let t = e.length;
			for (var d = 0; d < t; d++) {
				var f = e[d];
				if (s ? f === "/" && e[d - 1] === "*" && (s = !1) : a ? a === f && (a = !1) : f === "/" && e[d + 1] === "*" ? s = !0 : f === "\"" || f === "'" ? a = f : f === "(" ? o++ : f === ")" && o--, !s && a === !1 && o === 0) {
					if (f === ":" && u === -1) u = d;
					else if (f === ";" || d === t - 1) {
						if (u !== -1) {
							var p = aa(e.substring(l, u).trim());
							if (!c.includes(p)) {
								f !== ";" && d++;
								var m = e.substring(l, d).trim();
								n += " " + m + ";";
							}
						}
						l = d + 1, u = -1;
					}
				}
			}
		}
		return r && (n += ia(r)), i && (n += ia(i, !0)), n = n.trim(), n === "" ? null : n;
	}
	return e == null ? null : String(e);
}
// node_modules/svelte/src/internal/client/dom/elements/class.js
function sa(e, t, n, r, i, a) {
	var o = e[ge];
	if (E || o !== n || o === void 0) {
		var s = ra(n, r, a);
		E && s === e.getAttribute("class") || (s == null ? e.removeAttribute("class") : t ? e.className = s : e.setAttribute("class", s)), e[ge] = n;
	} else if (a && i !== a) for (var c in a) {
		var l = !!a[c];
		(i == null || l !== !!i[c]) && e.classList.toggle(c, l);
	}
	return a;
}
// node_modules/svelte/src/internal/client/dom/elements/style.js
function ca(e, t = {}, n, r) {
	for (var i in n) {
		var a = n[i];
		t[i] !== a && (n[i] == null ? e.style.removeProperty(i) : e.style.setProperty(i, a, r));
	}
}
function la(e, t, n, r) {
	var i = e[_e];
	if (E || i !== t) {
		var a = oa(t, r);
		E && a === e.getAttribute("style") || (a == null ? e.removeAttribute("style") : e.style.cssText = a), e[_e] = t;
	} else r && (Array.isArray(r) ? (ca(e, n?.[0], r[0]), ca(e, n?.[1], r[1], "important")) : ca(e, n, r));
	return r;
}
// node_modules/svelte/src/internal/client/dom/elements/bindings/select.js
function ua(t, n, r = !1) {
	if (t.multiple) {
		if (n == null) return;
		if (!e(n)) return Ve();
		for (var i of t.options) i.selected = n.includes(pa(i));
	} else {
		for (i of t.options) if (Tn(pa(i), n)) {
			i.selected = !0;
			return;
		}
		r && n === void 0 || (t.selectedIndex = -1);
	}
}
function da(e) {
	var t = new MutationObserver(() => {
		"__value" in e && ua(e, e.__value);
	});
	t.observe(e, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: ["value"]
	}), Vn(() => {
		t.disconnect();
	});
}
function fa(e, t, n = t) {
	var r = /* @__PURE__ */ new WeakSet(), i = !0;
	At(e, "change", (t) => {
		var i = t ? "[selected]" : ":checked", a;
		if (e.multiple) a = [].map.call(e.querySelectorAll(i), pa);
		else {
			var o = e.querySelector(i) ?? e.querySelector("option:not([disabled])");
			a = o && pa(o);
		}
		n(a), e.__value = a, P !== null && r.add(P);
	}), qn(() => {
		var a = t();
		if (e === document.activeElement) {
			var o = P;
			if (r.has(o)) return;
		}
		if (ua(e, a, i), i && a === void 0) {
			var s = e.querySelector(":checked");
			s !== null && (a = pa(s), n(a));
		}
		e.__value = a, i = !1;
	}), da(e);
}
function pa(e) {
	return "__value" in e ? e.__value : e.value;
}
// node_modules/svelte/src/internal/client/dom/elements/attributes.js
var ma = Symbol("class"), ha = Symbol("style"), ga = Symbol("is custom element"), _a = Symbol("is html"), va = xe ? "link" : "LINK", ya = xe ? "input" : "INPUT", ba = xe ? "option" : "OPTION", xa = xe ? "select" : "SELECT", Sa = xe ? "progress" : "PROGRESS";
function Ca(e) {
	if (E) {
		var t = !1, n = () => {
			if (!t) {
				if (t = !0, e.hasAttribute("value")) {
					var n = e.value;
					Da(e, "value", null), e.value = n;
				}
				if (e.hasAttribute("checked")) {
					var r = e.checked;
					Da(e, "checked", null), e.checked = r;
				}
			}
		};
		e[ye] = n, M(n), Ot();
	}
}
function wa(e, t) {
	var n = Aa(e);
	n.value !== (n.value = t ?? void 0) && (e.value !== t || t === 0 && e.nodeName === Sa) && (e.value = t ?? "");
}
function Ta(e, t) {
	var n = Aa(e);
	n.checked !== (n.checked = t ?? void 0) && (e.checked = t);
}
function Ea(e, t) {
	t ? e.hasAttribute("selected") || e.setAttribute("selected", "") : e.removeAttribute("selected");
}
function Da(e, t, n, r) {
	var i = Aa(e);
	E && (i[t] = e.getAttribute(t), t === "src" || t === "srcset" || t === "href" && e.nodeName === va) || i[t] !== (i[t] = n) && (t === "loading" && (e[pe] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && Ma(e).includes(t) ? e[t] = n : e.setAttribute(t, n));
}
function Oa(e, t, n, r, i = !1, a = !1) {
	if (E && i && e.nodeName === ya) {
		var o = e;
		(o.type === "checkbox" ? "defaultChecked" : "defaultValue") in n || Ca(o);
	}
	var s = Aa(e), c = s[ga], l = !s[_a];
	let u = E && c;
	u && D(!1);
	var d = t || {}, f = e.nodeName === ba;
	for (var p in t) p in n || (n[p] = null);
	n.class ? n.class = ta(n.class) : (r || n[ma]) && (n.class = null), n[ha] && (n.style ??= null);
	var m = Ma(e);
	if (e.nodeName === ya && "type" in n && ("value" in n || "__value" in n)) {
		var h = n.type;
		(h !== d.type || h === void 0 && e.hasAttribute("type")) && (d.type = h, Da(e, "type", h, a));
	}
	for (let i in n) {
		let o = n[i];
		if (f && i === "value" && o == null) e.value = e.__value = "", d[i] = o;
		else if (i === "class") sa(e, e.namespaceURI === "http://www.w3.org/1999/xhtml", o, r, t?.[ma], n[ma]), d[i] = o, d[ma] = n[ma];
		else if (i === "style") la(e, o, t?.[ha], n[ha]), d[i] = o, d[ha] = n[ha];
		else {
			var g = d[i];
			if (o !== g || o === void 0 && e.hasAttribute(i)) {
				d[i] = o;
				var _ = i[0] + i[1];
				if (_ !== "$$") {
					if (_ === "on") {
						let t = {}, n = "$$" + i, r = i.slice(2);
						var v = Ir(r);
						if (Pr(r) && (r = r.slice(0, -7), t.capture = !0), !v && g) {
							if (o != null) continue;
							e.removeEventListener(r, d[n], t), d[n] = null;
						}
						if (v) Zr(r, e, o), Qr([r]);
						else if (o != null) {
							function a(e) {
								d[i].call(this, e);
							}
							d[n] = Jr(r, e, a, t);
						}
					} else if (i === "style") Da(e, i, o);
					else if (i === "autofocus") Tt(e, !!o);
					else if (!c && (i === "__value" || i === "value" && o != null)) e.value = e.__value = o;
					else if (i === "selected" && f) Ea(e, o);
					else {
						var y = i;
						l || (y = zr(y));
						var b = y === "defaultValue" || y === "defaultChecked";
						if (o == null && !c && !b) {
							if (s[i] = null, y === "value" || y === "checked") {
								let n = e, r = t === void 0;
								if (y === "value") {
									let e = n.defaultValue;
									n.removeAttribute(y), n.defaultValue = e, n.value = n.__value = r ? e : null;
								} else {
									let e = n.defaultChecked;
									n.removeAttribute(y), n.defaultChecked = e, n.checked = r ? e : !1;
								}
							} else e.removeAttribute(i);
						} else b || m.includes(y) && (c || typeof o != "string") ? (e[y] = o, y in s && (s[y] = T)) : typeof o != "function" && Da(e, y, o, a);
					}
				}
			}
		}
	}
	return u && D(!0), d;
}
function ka(e, t, n = [], r = [], i = [], a, o = !1, s = !1) {
	Ft(i, n, r, (n) => {
		var r = void 0, i = {}, c = e.nodeName === xa, l = !1;
		if (Qn(() => {
			var u = t(...n.map(Z)), d = Oa(e, r, u, a, o, s);
			l && c && "value" in u && ua(e, u.value);
			for (let e of Object.getOwnPropertySymbols(i)) u[e] || U(i[e]);
			for (let t of Object.getOwnPropertySymbols(u)) {
				var f = u[t];
				t.description !== "@attach" || r && f === r[t] || (i[t] && U(i[t]), i[t] = H(() => Qi(e, () => f))), d[t] = f;
			}
			r = d;
		}), c) {
			var u = e;
			qn(() => {
				ua(u, r.value, !0), da(u);
			});
		}
		l = !0;
	});
}
function Aa(e) {
	return e[he] ??= {
		[ga]: e.nodeName.includes("-"),
		[_a]: e.namespaceURI === Fe
	};
}
var ja = /* @__PURE__ */ new Map();
function Ma(e) {
	var t = e.getAttribute("is") || e.nodeName, n = ja.get(t);
	if (n) return n;
	ja.set(t, n = []);
	for (var r, i = e, a = Element.prototype; a !== i;) {
		for (var s in r = o(i), r) r[s].set && s !== "innerHTML" && s !== "textContent" && s !== "innerText" && n.push(s);
		i = l(i);
	}
	return n;
}
// node_modules/svelte/src/internal/client/dom/elements/bindings/input.js
function Na(e, t, n = t) {
	var r = /* @__PURE__ */ new WeakSet();
	At(e, "input", async (i) => {
		var a = i ? e.defaultValue : e.value;
		if (a = Fa(e) ? Ia(a) : a, n(a), P !== null && r.add(P), await Or(), a !== (a = t())) {
			var o = e.selectionStart, s = e.selectionEnd, c = e.value.length;
			if (e.value = a ?? "", s !== null) {
				var l = e.value.length;
				o === s && s === c && l > c ? (e.selectionStart = l, e.selectionEnd = l) : (e.selectionStart = o, e.selectionEnd = Math.min(s, l));
			}
		}
	}), (E && e.defaultValue !== e.value || Q(t) == null && e.value) && (n(Fa(e) ? Ia(e.value) : e.value), P !== null && r.add(P)), Yn(() => {
		var n = t();
		if (e === document.activeElement) {
			var i = P;
			if (r.has(i)) return;
		}
		Fa(e) && n === Ia(e.value) || (e.type !== "date" || n || e.value) && n !== e.value && (e.value = n ?? "");
	});
}
function Pa(e, t, n = t) {
	At(e, "change", (t) => {
		n(t ? e.defaultChecked : e.checked);
	}), (E && e.defaultChecked !== e.checked || Q(t) == null) && n(e.checked), Yn(() => {
		e.checked = !!t();
	});
}
function Fa(e) {
	var t = e.type;
	return t === "number" || t === "range";
}
function Ia(e) {
	return e === "" ? null : +e;
}
var La = /* @__PURE__ */ new class e {
	#e = /* @__PURE__ */ new WeakMap();
	#t;
	#n;
	static entries = /* @__PURE__ */ new WeakMap();
	constructor(e) {
		this.#n = e;
	}
	observe(e, t) {
		var n = this.#e.get(e) || /* @__PURE__ */ new Set();
		return n.add(t), this.#e.set(e, n), this.#r().observe(e, this.#n), () => {
			var n = this.#e.get(e);
			n.delete(t), n.size === 0 && (this.#e.delete(e), this.#t.unobserve(e));
		};
	}
	#r() {
		return this.#t ??= new ResizeObserver((t) => {
			for (var n of t) {
				e.entries.set(n.target, n);
				for (var r of this.#e.get(n.target) || []) r(n);
			}
		});
	}
}({ box: "border-box" });
function Ra(e, t, n) {
	var r = La.observe(e, () => n(e[t]));
	qn(() => (Q(() => n(e[t])), r));
}
// node_modules/svelte/src/internal/client/dom/elements/bindings/this.js
function za(e, t) {
	return e === t || e?.[w] === t;
}
function Ba(e = {}, t, n, r) {
	var i = j.r, a = q;
	return qn(() => {
		var o, s;
		return Yn(() => {
			o = s, s = r?.() || [], Q(() => {
				za(n(...s), e) || (t(e, ...s), o && za(n(...o), e) && t(null, ...o));
			});
		}), () => {
			let r = a;
			for (; r !== i && r.parent !== null && r.parent.f & 33554432;) r = r.parent;
			let o = () => {
				s && za(n(...s), e) && t(null, ...s);
			}, c = r.teardown;
			r.teardown = () => {
				o(), c?.();
			};
		};
	}), e;
}
// node_modules/svelte/src/internal/client/dom/legacy/lifecycle.js
function Va(e = !1) {
	let t = j, n = t.l.u;
	if (!n) return;
	let r = () => jr(t.s);
	if (e) {
		let e = 0, n = {}, i = /* @__PURE__ */ zt(() => {
			let r = !1, i = t.s;
			for (let e in i) i[e] !== n[e] && (n[e] = i[e], r = !0);
			return r && e++, e;
		});
		r = () => Z(i);
	}
	n.b.length && Wn(() => {
		Ha(t, r), h(n.b);
	}), Hn(() => {
		let e = Q(() => n.m.map(m));
		return () => {
			for (let t of e) typeof t == "function" && t();
		};
	}), n.a.length && Hn(() => {
		Ha(t, r), h(n.a);
	});
}
function Ha(e, t) {
	if (e.l.s) for (let t of e.l.s) Z(t);
	t();
}
// node_modules/svelte/src/internal/client/reactivity/props.js
var Ua = {
	get(e, t) {
		if (!e.exclude.has(t)) return e.props[t];
	},
	set(e, t) {
		return !1;
	},
	getOwnPropertyDescriptor(e, t) {
		if (!e.exclude.has(t) && t in e.props) return {
			enumerable: !0,
			configurable: !0,
			value: e.props[t]
		};
	},
	has(e, t) {
		return !e.exclude.has(t) && t in e.props;
	},
	ownKeys(e) {
		return Reflect.ownKeys(e.props).filter((t) => !e.exclude.has(t));
	}
};
/*#__NO_SIDE_EFFECTS__*/
function Wa(e, t, n) {
	return new Proxy({
		props: e,
		exclude: t
	}, Ua);
}
var Ga = {
	get(e, t) {
		let n = e.props.length;
		for (; n--;) {
			let r = e.props[n];
			if (d(r) && (r = r()), typeof r == "object" && r && t in r) return r[t];
		}
	},
	set(e, t, n) {
		let r = e.props.length;
		for (; r--;) {
			let i = e.props[r];
			d(i) && (i = i());
			let o = a(i, t);
			if (o && o.set) return o.set(n), !0;
		}
		return !1;
	},
	getOwnPropertyDescriptor(e, t) {
		let n = e.props.length;
		for (; n--;) {
			let r = e.props[n];
			if (d(r) && (r = r()), typeof r == "object" && r && t in r) {
				let e = a(r, t);
				return e && !e.configurable && (e.configurable = !0), e;
			}
		}
	},
	has(e, t) {
		if (t === w || t === fe) return !1;
		for (let n of e.props) if (d(n) && (n = n()), n != null && t in n) return !0;
		return !1;
	},
	ownKeys(e) {
		let t = [];
		for (let n of e.props) if (d(n) && (n = n()), n) {
			for (let e in n) t.includes(e) || t.push(e);
			for (let e of Object.getOwnPropertySymbols(n)) t.includes(e) || t.push(e);
		}
		return t;
	}
};
function Ka(...e) {
	return new Proxy({ props: e }, Ga);
}
function qa(e, t, n, r) {
	var i = !Xe || !!(n & 2), o = !!(n & 8), s = !!(n & 16), c = r, l = !0, u = void 0, d = () => s && i ? (u ??= /* @__PURE__ */ zt(r), Z(u)) : (l && (l = !1, c = s ? Q(r) : r), c);
	let f;
	if (o) {
		var p = w in e || fe in e;
		f = a(e, t)?.set ?? (p && t in e ? (n) => e[t] = n : void 0);
	}
	var m, h = !1;
	o ? [m, h] = wt(() => e[t]) : m = e[t], m === void 0 && r !== void 0 && (m = d(), f && (i && ke(t), f(m)));
	var g = i ? () => {
		var n = e[t];
		return n === void 0 ? d() : (l = !0, n);
	} : () => {
		var n = e[t];
		return n !== void 0 && (c = void 0), n === void 0 ? c : n;
	};
	if (i && !(n & 4)) return g;
	if (f) {
		var _ = e.$$legacy;
		return (function(e, t) {
			return arguments.length > 0 ? ((!i || !t || _ || h) && f(t ? g() : e), e) : g();
		});
	}
	var v = !1, y = (n & 1 ? zt : Ut)(() => (v = !1, g()));
	o && Z(y);
	var b = q;
	return (function(e, t) {
		if (arguments.length > 0) {
			let n = t ? Z(y) : i && o ? Cn(e) : e;
			return L(y, n), v = !0, c !== void 0 && (c = n), e;
		}
		return dr && v || b.f & 16384 ? y.v : Z(y);
	});
}
function Ja(e) {
	j === null && Se("onMount"), Xe && j.l !== null ? Xa(j).m.push(e) : Hn(() => {
		let t = Q(e);
		if (typeof t == "function") return t;
	});
}
function Ya(e) {
	j === null && Se("onDestroy"), Ja(() => () => Q(e));
}
function Xa(e) {
	var t = e.l;
	return t.u ??= {
		a: [],
		b: [],
		m: []
	};
}
export { Or as $, Ri as A, $e as At, li as B, ta as C, at as Ct, Xi as D, ot as Dt, Zi as E, lt as Et, wi as F, _ as Ft, si as G, ii as H, Ci as I, f as It, Xr as J, Qr as K, mi as L, v as Lt, ji as M, We as Mt, Di as N, Ue as Nt, Ji as O, rt as Ot, Ei as P, y as Pt, Z as Q, pi as R, sa as S, ct as St, Qi as T, ut as Tt, oi as U, ci as V, ui as W, qr as X, Yr as Y, Nr as Z, wa as _, Ht as _t, Ka as a, Hn as at, ua as b, Tt as bt, Ra as c, jn as ct, ma as d, Cn as dt, Q as et, ha as f, xn as ft, Ta as g, bn as gt, Da as h, gn as ht, Wa as i, Xn as it, Li as j, Ze as jt, zi as k, tt as kt, Pa as l, Mn as lt, Ca as m, I as mt, Ja as n, qn as nt, Va as o, Wn as ot, ka as p, L as pt, Zr as q, qa as r, Gn as rt, Ba as s, En as st, Ya as t, yr as tt, Na as u, Nn as ut, fa as v, Nt as vt, ea as w, st as wt, la as x, Et as xt, da as y, jt as yt, vi as z };
