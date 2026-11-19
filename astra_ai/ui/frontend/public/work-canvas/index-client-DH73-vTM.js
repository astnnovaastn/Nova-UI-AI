// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/shared/utils.js
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/constants.js
var b = 1 << 24, x = 1024, S = 2048, ee = 4096, te = 8192, ne = 16384, re = 32768, ie = 1 << 25, ae = 65536, oe = 1 << 19, se = 1 << 20, ce = 1 << 25, le = 65536, ue = 1 << 21, de = 1 << 22, fe = 1 << 23, C = Symbol("$state"), pe = Symbol("legacy props"), me = Symbol(""), he = Symbol("proxy path"), ge = Symbol("attributes"), _e = Symbol("class"), ve = Symbol("style"), ye = Symbol("text"), be = Symbol("form reset"), xe = new class extends Error {
	name = "StaleReactionError";
	message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}(), Se = !!globalThis.document?.contentType && /* @__PURE__ */ globalThis.document.contentType.includes("xml");
function Ce(e) {
	throw Error("https://svelte.dev/e/lifecycle_outside_component");
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/errors.js
function we() {
	throw Error("https://svelte.dev/e/async_derived_orphan");
}
function Te(e, t, n) {
	throw Error("https://svelte.dev/e/each_key_duplicate");
}
function Ee(e) {
	throw Error("https://svelte.dev/e/effect_in_teardown");
}
function De() {
	throw Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Oe(e) {
	throw Error("https://svelte.dev/e/effect_orphan");
}
function ke() {
	throw Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Ae(e) {
	throw Error("https://svelte.dev/e/props_invalid_value");
}
function je() {
	throw Error("https://svelte.dev/e/state_descriptors_fixed");
}
function Me() {
	throw Error("https://svelte.dev/e/state_prototype_fixed");
}
function Ne() {
	throw Error("https://svelte.dev/e/state_unsafe_mutation");
}
function Pe() {
	throw Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/constants.js
var Fe = {}, w = Symbol("uninitialized"), Ie = "http://www.w3.org/1999/xhtml", Le = "http://www.w3.org/2000/svg", Re = "http://www.w3.org/1998/Math/MathML", ze = "@attach";
function Be() {
	console.warn("https://svelte.dev/e/derived_inert");
}
function Ve(e) {
	console.warn("https://svelte.dev/e/hydration_mismatch");
}
function He() {
	console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function Ue() {
	console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function We(e) {
	console.warn("https://svelte.dev/e/transition_slide_display");
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/hydration.js
var T = !1;
function E(e) {
	T = e;
}
var D;
function O(e) {
	if (e === null) throw Ve(), Fe;
	return D = e;
}
function k() {
	return O(/* @__PURE__ */ z(D));
}
function Ge(e) {
	if (T) {
		if (/* @__PURE__ */ z(D) !== null) throw Ve(), Fe;
		D = e;
	}
}
function Ke(e = 1) {
	if (T) {
		for (var t = e, n = D; t--;) n = /* @__PURE__ */ z(n);
		D = n;
	}
}
function qe(e = !0) {
	for (var t = 0, n = D;;) {
		if (n.nodeType === 8) {
			var r = n.data;
			if (r === "]") {
				if (t === 0) return n;
				--t;
			} else (r === "[" || r === "[!" || r[0] === "[" && !isNaN(Number(r.slice(1)))) && (t += 1);
		}
		var i = /* @__PURE__ */ z(n);
		e && n.remove(), n = i;
	}
}
function Je(e) {
	if (!e || e.nodeType !== 8) throw Ve(), Fe;
	return e.data;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/reactivity/equality.js
function Ye(e) {
	return e === this.v;
}
function Xe(e, t) {
	return e == e ? e !== t || typeof e == "object" && !!e || typeof e == "function" : t == t;
}
function Ze(e) {
	return !Xe(e, this.v);
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/flags/index.js
var Qe = !1;
function $e() {
	Qe = !0;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/shared/clone.js
var et = [];
function tt(e, t = !1, n = !1) {
	return nt(e, /* @__PURE__ */ new Map(), "", et, null, n);
}
function nt(t, n, r, i, a = null, o = !1) {
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
				d in t && (u[d] = nt(f, n, r, i, null, o));
			}
			return u;
		}
		if (l(t) === s) {
			u = {}, n.set(t, u), a !== null && n.set(a, u);
			for (var p of Object.keys(t)) u[p] = nt(t[p], n, r, i, null, o);
			return u;
		}
		if (t instanceof Date) return structuredClone(t);
		if (typeof t.toJSON == "function" && !o) return nt(t.toJSON(), n, r, i, t);
	}
	if (t instanceof EventTarget) return t;
	try {
		return structuredClone(t);
	} catch {
		return t;
	}
}
function rt(e, t) {
	return e.label = t, it(e.v, t), e;
}
function it(e, t) {
	return e?.[he]?.(t), e;
}
function at(e) {
	return typeof e == "symbol" ? `Symbol(${e.description})` : typeof e == "function" ? "<function>" : typeof e == "object" && e ? "<object>" : String(e);
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/context.js
var A = null;
function ot(e) {
	A = e;
}
function st(e) {
	return mt("getContext").get(e);
}
function ct(e, t) {
	return mt("setContext").set(e, t), t;
}
function lt(e) {
	return mt("hasContext").has(e);
}
function ut() {
	return mt("getAllContexts");
}
function dt(e, t = !1, n) {
	A = {
		p: A,
		i: !1,
		c: null,
		e: null,
		s: e,
		x: null,
		r: K,
		l: Qe && !t ? {
			s: null,
			u: null,
			$: []
		} : null
	};
}
function ft(e) {
	var t = A, n = t.e;
	if (n !== null) {
		t.e = null;
		for (var r of n) Gn(r);
	}
	return e !== void 0 && (t.x = e), t.i = !0, A = t.p, e ?? {};
}
function pt() {
	return !Qe || A !== null && A.l === null;
}
function mt(e) {
	return A === null && Ce(e), A.c ??= new Map(ht(A) || void 0);
}
function ht(e) {
	let t = e.p;
	for (; t !== null;) {
		let e = t.c;
		if (e !== null) return e;
		t = t.p;
	}
	return null;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/task.js
var gt = [];
function _t() {
	var e = gt;
	gt = [], h(e);
}
function j(e) {
	if (gt.length === 0 && !en) {
		var t = gt;
		queueMicrotask(() => {
			t === gt && _t();
		});
	}
	gt.push(e);
}
function vt() {
	for (; gt.length > 0;) _t();
}
function yt(e) {
	var t = K;
	if (t === null) return U.f |= fe, e;
	if (!(t.f & 32768) && !(t.f & 4)) throw e;
	bt(e, t);
}
function bt(e, t) {
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/reactivity/status.js
var xt = ~(S | ee | x);
function M(e, t) {
	e.f = e.f & xt | t;
}
function St(e) {
	e.f & 512 || e.deps === null ? M(e, x) : M(e, ee);
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/reactivity/utils.js
function Ct(e) {
	if (e !== null) for (let t of e) t.f & 2 && t.f & 65536 && (t.f ^= le, Ct(t.deps));
}
function wt(e, t, n) {
	e.f & 2048 ? t.add(e) : e.f & 4096 && n.add(e), Ct(e.deps), M(e, x);
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/reactivity/store.js
var Tt = !1;
function Et(e) {
	var t = Tt;
	try {
		return Tt = !1, [e(), Tt];
	} finally {
		Tt = t;
	}
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/elements/misc.js
function Dt(e, t) {
	if (t) {
		let t = document.body;
		e.autofocus = !0, j(() => {
			document.activeElement === t && e.focus();
		});
	}
}
function Ot(e) {
	T && /* @__PURE__ */ R(e) !== null && In(e);
}
var kt = !1;
function At() {
	kt || (kt = !0, document.addEventListener("reset", (e) => {
		Promise.resolve().then(() => {
			if (!e.defaultPrevented) for (let t of e.target.elements) t[be]?.();
		});
	}, { capture: !0 }));
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/elements/bindings/shared.js
function jt(e) {
	var t = U, n = K;
	G(null), q(null);
	try {
		return e();
	} finally {
		G(t), q(n);
	}
}
function Mt(e, t, n, r = n) {
	e.addEventListener(t, () => jt(n));
	let i = e[be];
	e[be] = i ? () => {
		i(), r(!0);
	} : () => r(!0), At();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/reactivity/create-subscriber.js
function Nt(e) {
	let t = 0, n = F(0), r;
	return () => {
		Hn() && (Z(n), Zn(() => (t === 0 && (r = Q(() => e(() => Cn(n)))), t += 1, () => {
			j(() => {
				--t, t === 0 && (r?.(), r = void 0, Cn(n));
			});
		})));
	};
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/blocks/boundary.js
var Pt = ae | oe;
function Ft(e, t, n, r) {
	new It(e, t, n, r);
}
var It = class {
	parent;
	is_pending = !1;
	transform_error;
	#e;
	#t = T ? D : null;
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
	#h = Nt(() => (this.#m = F(this.#l), () => {
		this.#m = null;
	}));
	constructor(e, t, n, r) {
		this.#e = e, this.#n = t, this.#r = (e) => {
			var t = K;
			t.b = this, t.f |= 128, n(e);
		}, this.parent = K.b, this.transform_error = r ?? this.parent?.transform_error ?? ((e) => e), this.#i = $n(() => {
			if (T) {
				let e = this.#t;
				k();
				let t = e.data === "[!";
				if (e.data.startsWith("[?")) {
					let t = JSON.parse(e.data.slice(2));
					this.#_(t);
				} else t ? this.#y() : this.#g();
			} else this.#b();
		}, Pt), T && (this.#e = D);
	}
	#g() {
		try {
			this.#a = V(() => this.#r(this.#e));
		} catch (e) {
			this.error(e);
		}
	}
	#_(e) {
		let t = this.#n.failed, { reset: n, invoke_onerror: r } = this.#v(e);
		j(r), t && (this.#s = V(() => {
			t(this.#e, () => e, () => n);
		}));
	}
	#v(e) {
		var t = !1, n = !1;
		let r = () => {
			t ? Ue() : (t = !0, n && Pe(), this.#s !== null && or(this.#s, () => {
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
					bt(e, this.#i && this.#i.parent);
				}
			}
		};
	}
	#y() {
		let e = this.#n.pending;
		e && (this.is_pending = !0, this.#o = V(() => e(this.#e)), j(() => {
			var e = this.#c = document.createDocumentFragment(), t = L();
			e.append(t), this.#a = this.#S(() => V(() => this.#r(t))), this.#u === 0 && (this.#e.before(e), this.#c = null, or(this.#o, () => {
				this.#o = null;
			}), this.#x(N));
		}));
	}
	#b() {
		try {
			if (this.is_pending = this.has_pending_snippet(), this.#u = 0, this.#l = 0, this.#a = V(() => {
				this.#r(this.#e);
			}), this.#u > 0) {
				var e = this.#c = document.createDocumentFragment();
				ur(this.#a, e);
				let t = this.#n.pending;
				this.#o = V(() => t(this.#e));
			} else this.#x(N);
		} catch (e) {
			this.error(e);
		}
	}
	#x(e) {
		this.is_pending = !1, e.transfer_effects(this.#f, this.#p);
	}
	defer_effect(e) {
		wt(e, this.#f, this.#p);
	}
	is_rendered() {
		return !this.is_pending && (!this.parent || this.parent.is_rendered());
	}
	has_pending_snippet() {
		return !!this.#n.pending;
	}
	#S(e) {
		var t = K, n = U, r = A;
		q(this.#i), G(this.#i), ot(this.#i.ctx);
		try {
			return sn.ensure(), e();
		} catch (e) {
			return yt(e), null;
		} finally {
			q(t), G(n), ot(r);
		}
	}
	#C(e, t) {
		this.has_pending_snippet() ? (this.#u += e, this.#u === 0 && (this.#x(t), this.#o && or(this.#o, () => {
			this.#o = null;
		}), this.#c &&= (this.#e.before(this.#c), null))) : this.parent && this.parent.#C(e, t);
	}
	update_pending_count(e, t) {
		this.#C(e, t), this.#l += e, !this.#m || this.#d || (this.#d = !0, j(() => {
			this.#d = !1, this.#m && bn(this.#m, this.#l);
		}));
	}
	get_effect_pending() {
		return this.#h(), Z(this.#m);
	}
	error(e) {
		if (!this.#n.onerror && !this.#n.failed) throw e;
		N?.is_fork ? (this.#a && N.skip_effect(this.#a), this.#o && N.skip_effect(this.#o), this.#s && N.skip_effect(this.#s), N.oncommit(() => {
			this.#w(e);
		})) : this.#w(e);
	}
	#w(e) {
		this.#a &&= (H(this.#a), null), this.#o &&= (H(this.#o), null), this.#s &&= (H(this.#s), null), T && (O(this.#t), Ke(), O(qe()));
		let t = this.#n.failed, n = (e) => {
			let { reset: n, invoke_onerror: r } = this.#v(e);
			r(), t && (this.#s = this.#S(() => {
				try {
					return V(() => {
						var r = K;
						r.b = this, r.f |= 128, t(this.#e, () => e, () => n);
					});
				} catch (e) {
					return bt(e, this.#i.parent), null;
				}
			}));
		};
		j(() => {
			var t;
			try {
				t = this.transform_error(e);
			} catch (e) {
				bt(e, this.#i && this.#i.parent);
				return;
			}
			typeof t == "object" && t && typeof t.then == "function" ? t.then(n, (e) => bt(e, this.#i && this.#i.parent)) : n(t);
		});
	}
};
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/reactivity/async.js
function Lt(e, t, n, r) {
	let i = pt() ? Vt : Gt;
	var a = e.filter((e) => !e.settled), o = t.map(i);
	if (n.length === 0 && a.length === 0) {
		r(o);
		return;
	}
	var s = K, c = Rt(), l = a.length === 1 ? a[0].promise : a.length > 1 ? Promise.all(a.map((e) => e.promise)) : null;
	function u(e) {
		if (!(s.f & 16384)) {
			c();
			try {
				r([...o, ...e]);
			} catch (e) {
				bt(e, s);
			}
			zt();
		}
	}
	var d = Bt();
	if (n.length === 0) {
		l.then(() => u([])).finally(d);
		return;
	}
	function f() {
		Promise.all(n.map((e) => /* @__PURE__ */ Ut(e))).then(u).catch((e) => bt(e, s)).finally(d);
	}
	l ? l.then(() => {
		c(), f(), zt();
	}) : f();
}
function Rt() {
	var e = K, t = U, n = A, r = N;
	return function(i = !0) {
		q(e), G(t), ot(n), i && !(e.f & 16384) && (r?.activate(), r?.apply());
	};
}
function zt(e = !0) {
	q(null), G(null), ot(null), e && N?.deactivate();
}
function Bt() {
	var e = K, t = e.b, n = N, r = !!t?.is_rendered();
	return t?.update_pending_count(1, n), n.increment(r, e), () => {
		t?.update_pending_count(-1, n), n.decrement(r, e);
	};
}
/*#__NO_SIDE_EFFECTS__*/
function Vt(e) {
	var t = 2 | S;
	return K !== null && (K.f |= oe), {
		ctx: A,
		deps: null,
		effects: null,
		equals: Ye,
		f: t,
		fn: e,
		reactions: null,
		rv: 0,
		v: w,
		wv: 0,
		parent: K,
		ac: null
	};
}
var Ht = Symbol("obsolete");
/*#__NO_SIDE_EFFECTS__*/
function Ut(e, t, n) {
	let r = K;
	r === null && we();
	var i = void 0, a = F(w), o = !U, s = /* @__PURE__ */ new Set();
	return Xn(() => {
		var t = K, n = g();
		i = n.promise;
		try {
			Promise.resolve(e()).then(n.resolve, (e) => {
				e !== xe && n.reject(e);
			}).finally(zt);
		} catch (e) {
			n.reject(e), zt();
		}
		var c = N;
		if (o) {
			if (t.f & 32768) var l = Bt();
			if (r.b?.is_rendered()) c.async_deriveds.get(t)?.reject(Ht);
			else for (let e of s.values()) e.reject(Ht);
			s.add(n), c.async_deriveds.set(t, n);
		}
		let u = (e, t = void 0) => {
			l?.(), s.delete(n), t !== Ht && (c.activate(), t ? (a.f |= fe, bn(a, t)) : (a.f & 8388608 && (a.f ^= fe), bn(a, e)), c.deactivate());
		};
		n.promise.then(u, (e) => u(null, e || "unknown"));
	}), Un(() => {
		for (let e of s) e.reject(Ht);
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
function Wt(e) {
	let t = /* @__PURE__ */ Vt(e);
	return gr(t), t;
}
/*#__NO_SIDE_EFFECTS__*/
function Gt(e) {
	let t = /* @__PURE__ */ Vt(e);
	return t.equals = Ze, t;
}
function Kt(e) {
	var t = e.effects;
	if (t !== null) {
		e.effects = null;
		for (var n = 0; n < t.length; n += 1) H(t[n]);
	}
}
function qt(e) {
	var t, n = K, r = e.parent;
	if (!pr && r !== null && e.v !== w && r.f & 24576) return Be(), e.v;
	q(r);
	try {
		e.f &= ~le, Kt(e), t = Tr(e);
	} finally {
		q(n);
	}
	return t;
}
function Jt(e) {
	var t = qt(e);
	!e.equals(t) && (e.wv = Sr(), (!N?.is_fork || e.deps === null) && (N === null ? e.v = t : (N.capture(e, t, !0), Qt?.capture(e, t, !0)), e.deps === null)) ? M(e, x) : pr || (P === null ? St(e) : (Hn() || N?.is_fork) && P.set(e, t));
}
function Yt(e) {
	if (e.effects !== null) for (let t of e.effects) (t.teardown || t.ac) && (t.teardown?.(), t.ac !== null && jt(() => {
		t.ac.abort(xe), t.ac = null;
	}), t.fn !== null && (t.teardown = f), Dr(t, 0), nr(t));
}
function Xt(e) {
	if (e.effects !== null) for (let t of e.effects) t.teardown && t.fn !== null && Or(t);
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/reactivity/batch.js
var Zt = null, N = null, Qt = null, P = null, $t = null, en = !1, tn = !1, nn = null, rn = null, an = 0, on = 1, sn = class e {
	id = on++;
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
		Zt === null ? Zt = this : (Zt.#n = this, this.#t = Zt), Zt = this;
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
			for (var r of n.d) M(r, S), t(r);
			for (r of n.m) M(r, ee), t(r);
		}
		this.#p.add(e);
	}
	#g() {
		this.#e = !0, an++ > 1e3 && (this.#x(), ln());
		for (let e of this.#u) this.#d.delete(e), M(e, S), this.schedule(e);
		for (let e of this.#d) M(e, ee), this.schedule(e);
		let t = this.#c;
		this.#c = [], this.apply();
		var n = nn = [], r = [], i = rn = [];
		for (let e of t) try {
			this.#_(e, n, r);
		} catch (t) {
			throw mn(e), this.#h() || this.discard(), t;
		}
		if (N = null, i.length > 0) {
			var a = e.ensure();
			for (let e of i) a.schedule(e);
		}
		if (nn = null, rn = null, this.#h()) {
			this.#b(r), this.#b(n);
			for (let [e, t] of this.#f) pn(e, t);
			i.length > 0 && N.#g();
			return;
		}
		let o = this.#v();
		if (o) this.#b(r), this.#b(n), o.#y(this);
		else {
			this.#u.clear(), this.#d.clear();
			for (let e of this.#r) e(this);
			this.#r.clear(), Qt = this, dn(r), dn(n), Qt = null, this.#s?.resolve();
			var s = N;
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
				a ? r.f ^= x : i & 4 ? t.push(r) : Cr(r) && (i & 16 && this.#d.add(r), Or(r));
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
					r & 4194320 && !this.async_deriveds.has(i) && (this.#d.delete(i), M(i, S), this.schedule(i));
				}
			}
		};
		for (let e of this.current.keys()) t(e);
		this.oncommit(() => e.discard()), e.#x(), N = this, this.#g();
	}
	#b(e) {
		for (var t = 0; t < e.length; t += 1) wt(e[t], this.#u, this.#d);
	}
	capture(e, t, n = !1) {
		e.v !== w && !this.previous.has(e) && this.previous.set(e, e.v), e.f & 8388608 || (this.current.set(e, [t, n]), P?.set(e, t)), this.is_fork || (e.v = t);
	}
	activate() {
		N = this;
	}
	deactivate() {
		N = null, P = null;
	}
	flush() {
		try {
			tn = !0, N = this, this.#g();
		} finally {
			an = 0, $t = null, nn = null, rn = null, tn = !1, N = null, P = null, gn.clear();
		}
	}
	discard() {
		for (let e of this.#i) e(this);
		this.#i.clear();
		for (let e of this.async_deriveds.values()) e.reject(Ht);
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
		this.#m || (this.#m = !0, j(() => {
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
		if (N === null) {
			let t = N = new e();
			!tn && !en && j(() => {
				t.#e || t.flush();
			});
		}
		return N;
	}
	apply() {
		P = null;
	}
	schedule(e) {
		if ($t = e, e.b?.is_pending && e.f & 16777228 && !(e.f & 32768)) e.b.defer_effect(e);
		else {
			for (var t = e; t.parent !== null;) {
				t = t.parent;
				var n = t.f;
				if (nn !== null && t === K && (U === null || !(U.f & 2))) return;
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
			e === null || (e.#n = t), t === null ? Zt = e : t.#t = e, this.linked = !1;
		}
	}
};
function cn(e) {
	var t = en;
	en = !0;
	try {
		var n;
		for (e && (N !== null && !N.is_fork && N.flush(), n = e());;) {
			if (vt(), N === null) return n;
			N.flush();
		}
	} finally {
		en = t;
	}
}
function ln() {
	try {
		ke();
	} catch (e) {
		bt(e, $t);
	}
}
var un = null;
function dn(e) {
	var t = e.length;
	if (t !== 0) {
		for (var n = 0; n < t;) {
			var r = e[n++];
			if (!(r.f & 24576) && Cr(r) && (un = /* @__PURE__ */ new Set(), Or(r), r.deps === null && r.first === null && r.nodes === null && r.teardown === null && r.ac === null && ar(r), un?.size > 0)) {
				gn.clear();
				for (let e of un) {
					if (e.f & 24576) continue;
					let t = [e], n = e.parent;
					for (; n !== null;) un.has(n) && (un.delete(n), t.push(n)), n = n.parent;
					for (let e = t.length - 1; e >= 0; e--) {
						let n = t[e];
						n.f & 24576 || Or(n);
					}
				}
				un.clear();
			}
		}
		un = null;
	}
}
function fn(e) {
	N.schedule(e);
}
function pn(e, t) {
	if (!(e.f & 32 && e.f & 1024)) {
		e.f & 2048 ? t.d.push(e) : e.f & 4096 && t.m.push(e), M(e, x);
		for (var n = e.first; n !== null;) pn(n, t), n = n.next;
	}
}
function mn(e) {
	M(e, x);
	for (var t = e.first; t !== null;) mn(t), t = t.next;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/reactivity/sources.js
var hn = /* @__PURE__ */ new Set(), gn = /* @__PURE__ */ new Map(), _n = !1;
function F(e, t) {
	return {
		f: 0,
		v: e,
		reactions: null,
		equals: Ye,
		rv: 0,
		wv: 0
	};
}
/*#__NO_SIDE_EFFECTS__*/
function vn(e, t) {
	let n = F(e, t);
	return gr(n), n;
}
/*#__NO_SIDE_EFFECTS__*/
function yn(e, t = !1, n = !0) {
	let r = F(e);
	return t || (r.equals = Ze), Qe && n && A !== null && A.l !== null && (A.l.s ??= []).push(r), r;
}
function I(e, t, n = !1) {
	return U !== null && (!W || U.f & 131072) && pt() && U.f & 4325394 && (hr === null || !hr.has(e)) && Ne(), bn(e, n ? Tn(t) : t, rn);
}
function bn(e, t, n = null) {
	if (!e.equals(t)) {
		gn.set(e, pr ? t : e.v);
		var r = sn.ensure();
		if (r.capture(e, t), e.f & 2) {
			let t = e;
			e.f & 2048 && qt(t), P === null && St(t);
		}
		e.wv = Sr(), wn(e, S, n), pt() && K !== null && K.f & 1024 && !(K.f & 96) && (X === null ? _r([e]) : X.push(e)), !r.is_fork && hn.size > 0 && !_n && xn();
	}
	return t;
}
function xn() {
	_n = !1;
	for (let e of hn) {
		e.f & 1024 && M(e, ee);
		let t;
		try {
			t = Cr(e);
		} catch {
			t = !0;
		}
		t && Or(e);
	}
	hn.clear();
}
function Sn(e, t = 1) {
	var n = Z(e), r = t === 1 ? n++ : n--;
	return I(e, n), r;
}
function Cn(e) {
	I(e, e.v + 1);
}
function wn(e, t, n) {
	var r = e.reactions;
	if (r !== null) for (var i = pt(), a = r.length, o = 0; o < a; o++) {
		var s = r[o], c = s.f;
		if (i || s !== K) {
			var l = (c & S) === 0;
			if (l && M(s, t), c & 131072) hn.add(s);
			else if (c & 2) {
				var u = s;
				P?.delete(u), c & 65536 || (c & 512 && (K === null || !(K.f & 2097152)) && (s.f |= le), wn(u, ee, n));
			} else if (l) {
				var d = s;
				c & 16 && un !== null && un.add(d), n === null ? fn(d) : n.push(d);
			}
		}
	}
}
function Tn(t) {
	if (typeof t != "object" || !t || C in t) return t;
	let n = l(t);
	if (n !== s && n !== c) return t;
	var r = /* @__PURE__ */ new Map(), i = e(t), o = /* @__PURE__ */ vn(0), u = null, d = br, f = (e) => {
		if (br === d) return e();
		var t = U, n = br;
		G(null), xr(d);
		var r = e();
		return G(t), xr(n), r;
	};
	return i && r.set("length", /* @__PURE__ */ vn(t.length, u)), new Proxy(t, {
		defineProperty(e, t, n) {
			"value" in n && n.configurable !== !1 && n.enumerable !== !1 && n.writable !== !1 || je();
			var i = r.get(t);
			return i === void 0 ? f(() => {
				var e = /* @__PURE__ */ vn(n.value, u);
				return r.set(t, e), e;
			}) : I(i, n.value, !0), !0;
		},
		deleteProperty(e, t) {
			var n = r.get(t);
			if (n === void 0) {
				if (t in e) {
					let e = f(() => /* @__PURE__ */ vn(w, u));
					r.set(t, e), Cn(o);
				}
			} else I(n, w), Cn(o);
			return !0;
		},
		get(e, n, i) {
			if (n === C) return t;
			var o = r.get(n), s = n in e;
			if (o === void 0 && (!s || a(e, n)?.writable) && (o = f(() => /* @__PURE__ */ vn(Tn(s ? e[n] : w), u)), r.set(n, o)), o !== void 0) {
				var c = Z(o);
				return c === w ? void 0 : c;
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
				if (a !== void 0 && o !== w) return {
					enumerable: !0,
					configurable: !0,
					value: o,
					writable: !0
				};
			}
			return n;
		},
		has(e, t) {
			if (t === C) return !0;
			var n = r.get(t), i = n !== void 0 && n.v !== w || Reflect.has(e, t);
			return (n !== void 0 || K !== null && (!i || a(e, t)?.writable)) && (n === void 0 && (n = f(() => /* @__PURE__ */ vn(i ? Tn(e[t]) : w, u)), r.set(t, n)), Z(n) === w) ? !1 : i;
		},
		set(e, t, n, s) {
			var c = r.get(t), l = t in e;
			if (i && t === "length") for (var d = n; d < c.v; d += 1) {
				var p = r.get(d + "");
				p === void 0 ? d in e && (p = f(() => /* @__PURE__ */ vn(w, u)), r.set(d + "", p)) : I(p, w);
			}
			if (c === void 0) (!l || a(e, t)?.writable) && (c = f(() => /* @__PURE__ */ vn(void 0, u)), I(c, Tn(n)), r.set(t, c));
			else {
				l = c.v !== w;
				var m = f(() => Tn(n));
				I(c, m);
			}
			var h = Reflect.getOwnPropertyDescriptor(e, t);
			if (h?.set && h.set.call(s, n), !l) {
				if (i && typeof t == "string") {
					var g = r.get("length"), _ = Number(t);
					Number.isInteger(_) && _ >= g.v && I(g, _ + 1);
				}
				Cn(o);
			}
			return !0;
		},
		ownKeys(e) {
			Z(o);
			var t = Reflect.ownKeys(e).filter((e) => {
				var t = r.get(e);
				return t === void 0 || t.v !== w;
			});
			for (var [n, i] of r) i.v !== w && !(n in e) && t.push(n);
			return t;
		},
		setPrototypeOf() {
			Me();
		}
	});
}
function En(e) {
	try {
		if (typeof e == "object" && e && C in e) return e[C];
	} catch {}
	return e;
}
function Dn(e, t) {
	return Object.is(En(e), En(t));
}
var On, kn, An, jn;
function Mn() {
	if (On === void 0) {
		On = window, kn = /Firefox/.test(navigator.userAgent);
		var e = Element.prototype, t = Node.prototype, n = Text.prototype;
		An = a(t, "firstChild").get, jn = a(t, "nextSibling").get, u(e) && (e[_e] = void 0, e[ge] = null, e[ve] = void 0, e.__e = void 0), u(n) && (n[ye] = void 0);
	}
}
function L(e = "") {
	return document.createTextNode(e);
}
/*@__NO_SIDE_EFFECTS__*/
function R(e) {
	return An.call(e);
}
/*@__NO_SIDE_EFFECTS__*/
function z(e) {
	return jn.call(e);
}
function Nn(e, t) {
	if (!T) return /* @__PURE__ */ R(e);
	var n = /* @__PURE__ */ R(D);
	if (n === null) n = D.appendChild(L());
	else if (t && n.nodeType !== 3) {
		var r = L();
		return n?.before(r), O(r), r;
	}
	return t && zn(n), O(n), n;
}
function Pn(e, t = !1) {
	if (!T) {
		var n = /* @__PURE__ */ R(e);
		return n instanceof Comment && n.data === "" ? /* @__PURE__ */ z(n) : n;
	}
	if (t) {
		if (D?.nodeType !== 3) {
			var r = L();
			return D?.before(r), O(r), r;
		}
		zn(D);
	}
	return D;
}
function Fn(e, t = 1, n = !1) {
	let r = T ? D : e;
	for (var i; t--;) i = r, r = /* @__PURE__ */ z(r);
	if (!T) return r;
	if (n) {
		if (r?.nodeType !== 3) {
			var a = L();
			return r === null ? i?.after(a) : r.before(a), O(a), a;
		}
		zn(r);
	}
	return O(r), r;
}
function In(e) {
	e.textContent = "";
}
function Ln() {
	return !1;
}
function Rn(e, t, n) {
	return t == null || t === "http://www.w3.org/1999/xhtml" ? n ? document.createElement(e, { is: n }) : document.createElement(e) : n ? document.createElementNS(t, e, { is: n }) : document.createElementNS(t, e);
}
function zn(e) {
	if (e.nodeValue.length < 65536) return;
	let t = e.nextSibling;
	for (; t !== null && t.nodeType === 3;) t.remove(), e.nodeValue += t.nodeValue, t = e.nextSibling;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/reactivity/effects.js
function Bn(e) {
	K === null && (U === null && Oe(e), De()), pr && Ee(e);
}
function Vn(e, t) {
	var n = t.last;
	n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function B(e, t) {
	var n = K;
	n !== null && n.f & 8192 && (e |= te);
	var r = {
		ctx: A,
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
	N?.register_created_effect(r);
	var i = r;
	if (e & 4) nn === null ? sn.ensure().schedule(r) : nn.push(r);
	else if (t !== null) {
		try {
			Or(r);
		} catch (e) {
			throw H(r), e;
		}
		i.deps === null && i.teardown === null && i.nodes === null && i.first === i.last && !(i.f & 524288) && (i = i.first, e & 16 && e & 65536 && i !== null && (i.f |= ae));
	}
	if (i !== null && (i.parent = n, n !== null && Vn(i, n), U !== null && U.f & 2 && !(e & 64))) {
		var a = U;
		(a.effects ??= []).push(i);
	}
	return r;
}
function Hn() {
	return U !== null && !W;
}
function Un(e) {
	let t = B(8, null);
	return M(t, x), t.teardown = e, t;
}
function Wn(e) {
	Bn("$effect");
	var t = K.f;
	if (!U && t & 32 && A !== null && !A.i) {
		var n = A;
		(n.e ??= []).push(e);
	} else return Gn(e);
}
function Gn(e) {
	return B(4 | se, e);
}
function Kn(e) {
	return Bn("$effect.pre"), B(8 | se, e);
}
function qn(e) {
	sn.ensure();
	let t = B(64 | oe, e);
	return () => {
		H(t);
	};
}
function Jn(e) {
	sn.ensure();
	let t = B(64 | oe, e);
	return (e = {}) => new Promise((n) => {
		e.outro ? or(t, () => {
			H(t), n(void 0);
		}) : (H(t), n(void 0));
	});
}
function Yn(e) {
	return B(4, e);
}
function Xn(e) {
	return B(de | oe, e);
}
function Zn(e, t = 0) {
	return B(8 | t, e);
}
function Qn(e, t = [], n = [], r = []) {
	Lt(r, t, n, (t) => {
		B(8, () => {
			e(...t.map(Z));
		});
	});
}
function $n(e, t = 0) {
	return B(16 | t, e);
}
function er(e, t = 0) {
	return B(b | t, e);
}
function V(e) {
	return B(32 | oe, e);
}
function tr(e) {
	var t = e.teardown;
	if (t !== null) {
		let e = pr, n = U;
		mr(!0), G(null);
		try {
			t.call(null);
		} finally {
			mr(e), G(n);
		}
	}
}
function nr(e, t = !1) {
	var n = e.first;
	for (e.first = e.last = null; n !== null;) {
		let e = n.ac;
		e !== null && jt(() => {
			e.abort(xe);
		});
		var r = n.next;
		n.f & 64 ? n.parent = null : H(n, t), n = r;
	}
}
function rr(e) {
	for (var t = e.first; t !== null;) {
		var n = t.next;
		t.f & 32 || H(t), t = n;
	}
}
function H(e, t = !0) {
	var n = !1;
	(t || e.f & 262144) && e.nodes !== null && e.nodes.end !== null && (ir(e.nodes.start, e.nodes.end), n = !0), e.f |= ie, nr(e, t && !n), Dr(e, 0);
	var r = e.nodes && e.nodes.t;
	if (r !== null) for (let e of r) e.stop();
	tr(e), e.f ^= ie, e.f |= ne;
	var i = e.parent;
	i !== null && i.first !== null && ar(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function ir(e, t) {
	for (; e !== null;) {
		var n = e === t ? null : /* @__PURE__ */ z(e);
		e.remove(), e = n;
	}
}
function ar(e) {
	var t = e.parent, n = e.prev, r = e.next;
	n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function or(e, t, n = !0) {
	var r = [];
	sr(e, r, !0);
	var i = () => {
		n && H(e), t && t();
	}, a = r.length;
	if (a > 0) {
		var o = () => --a || i();
		for (var s of r) s.out(o);
	} else i();
}
function sr(e, t, n) {
	if (!(e.f & 8192)) {
		e.f ^= te;
		var r = e.nodes && e.nodes.t;
		if (r !== null) for (let e of r) (e.is_global || n) && t.push(e);
		for (var i = e.first; i !== null;) {
			var a = i.next;
			if (!(i.f & 64)) {
				var o = !!(i.f & 65536) || !!(i.f & 32) && !!(e.f & 16);
				sr(i, t, o ? n : !1);
			}
			i = a;
		}
	}
}
function cr(e) {
	lr(e, !0);
}
function lr(e, t) {
	if (e.f & 8192) {
		e.f ^= te, e.f & 1024 || (M(e, S), sn.ensure().schedule(e));
		for (var n = e.first; n !== null;) {
			var r = n.next, i = !!(n.f & 65536) || !!(n.f & 32);
			lr(n, i ? t : !1), n = r;
		}
		var a = e.nodes && e.nodes.t;
		if (a !== null) for (let e of a) (e.is_global || t) && e.in();
	}
}
function ur(e, t) {
	if (e.nodes) for (var n = e.nodes.start, r = e.nodes.end; n !== null;) {
		var i = n === r ? null : /* @__PURE__ */ z(n);
		t.append(n), n = i;
	}
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/legacy.js
var dr = null, fr = !1, pr = !1;
function mr(e) {
	pr = e;
}
var U = null, W = !1;
function G(e) {
	U = e;
}
var K = null;
function q(e) {
	K = e;
}
var hr = null;
function gr(e) {
	U !== null && (hr ??= /* @__PURE__ */ new Set()).add(e);
}
var J = null, Y = 0, X = null;
function _r(e) {
	X = e;
}
var vr = 1, yr = 0, br = yr;
function xr(e) {
	br = e;
}
function Sr() {
	return ++vr;
}
function Cr(e) {
	var t = e.f;
	if (t & 2048) return !0;
	if (t & 2 && (e.f &= ~le), t & 4096) {
		for (var n = e.deps, r = n.length, i = 0; i < r; i++) {
			var a = n[i];
			if (Cr(a) && Jt(a), a.wv > e.wv) return !0;
		}
		t & 512 && P === null && M(e, x);
	}
	return !1;
}
function wr(e, t, n = !0) {
	var r = e.reactions;
	if (r !== null && !(hr !== null && hr.has(e))) for (var i = 0; i < r.length; i++) {
		var a = r[i];
		a.f & 2 ? wr(a, t, !1) : t === a && (n ? M(a, S) : a.f & 1024 && M(a, ee), fn(a));
	}
}
function Tr(e) {
	var t = J, n = Y, r = X, i = U, a = hr, o = A, s = W, c = br, l = e.f;
	J = null, Y = 0, X = null, U = l & 96 ? null : e, hr = null, ot(e.ctx), W = !1, br = ++yr, e.ac !== null && (jt(() => {
		e.ac.abort(xe);
	}), e.ac = null);
	try {
		e.f |= ue;
		var u = e.fn, d = u();
		e.f |= re;
		var f = e.deps, p = N?.is_fork;
		if (J !== null) {
			var m;
			if (p || Dr(e, Y), f !== null && Y > 0) for (f.length = Y + J.length, m = 0; m < J.length; m++) f[Y + m] = J[m];
			else e.deps = f = J;
			if (Hn() && e.f & 512) for (m = Y; m < f.length; m++) (f[m].reactions ??= []).push(e);
		} else !p && f !== null && Y < f.length && (Dr(e, Y), f.length = Y);
		if (pt() && X !== null && !W && f !== null && !(e.f & 6146)) for (m = 0; m < X.length; m++) wr(X[m], e);
		if (i !== null && i !== e) {
			if (yr++, i.deps !== null) for (let e = 0; e < n; e += 1) i.deps[e].rv = yr;
			if (t !== null) for (let e of t) e.rv = yr;
			X !== null && (r === null ? r = X : r.push(...X));
		}
		return e.f & 8388608 && (e.f ^= fe), d;
	} catch (e) {
		return yt(e);
	} finally {
		e.f ^= ue, J = t, Y = n, X = r, U = i, hr = a, ot(o), W = s, br = c;
	}
}
function Er(e, r) {
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
		s.f & 512 && (s.f ^= 512, s.f &= ~le), s.v !== w && St(s), s.ac !== null && jt(() => {
			s.ac.abort(xe), s.ac = null, M(s, S);
		}), Yt(s), Dr(s, 0);
	}
}
function Dr(e, t) {
	var n = e.deps;
	if (n !== null) for (var r = t; r < n.length; r++) Er(e, n[r]);
}
function Or(e) {
	var t = e.f;
	if (!(t & 16384)) {
		M(e, x);
		var n = K, r = fr;
		K = e, fr = !(t & 96);
		try {
			t & 16777232 ? rr(e) : nr(e), tr(e);
			var i = Tr(e);
			e.teardown = typeof i == "function" ? i : null, e.wv = vr;
		} finally {
			fr = r, K = n;
		}
	}
}
async function kr() {
	await Promise.resolve(), cn();
}
function Z(e) {
	var t = !!(e.f & 2);
	if (dr?.add(e), U !== null && !W && !(K !== null && K.f & 16384) && (hr === null || !hr.has(e))) {
		var r = U.deps;
		if (U.f & 2097152) e.rv < yr && (e.rv = yr, J === null && r !== null && r[Y] === e ? Y++ : J === null ? J = [e] : J.push(e));
		else {
			U.deps ??= [], n.call(U.deps, e) || U.deps.push(e);
			var i = e.reactions;
			i === null ? e.reactions = [U] : n.call(i, U) || i.push(U);
		}
	}
	if (pr && gn.has(e)) return gn.get(e);
	if (t) {
		var a = e;
		if (pr) {
			var o = a.v;
			return (!(a.f & 1024) && a.reactions !== null || jr(a)) && (o = qt(a)), gn.set(a, o), o;
		}
		var s = !(a.f & 512) && !W && U !== null && (fr || !!(U.f & 512)), c = (a.f & re) === 0;
		Cr(a) && (s && (a.f |= 512), Jt(a)), s && !c && (Xt(a), Ar(a));
	}
	if (P?.has(e)) return P.get(e);
	if (e.f & 8388608) throw e.v;
	return e.v;
}
function Ar(e) {
	if (e.f |= 512, e.deps !== null) for (let t of e.deps) (t.reactions ??= []).push(e), t.f & 2 && !(t.f & 512) && (Xt(t), Ar(t));
}
function jr(e) {
	if (e.v === w) return !0;
	if (e.deps === null) return !1;
	for (let t of e.deps) if (gn.has(t) || t.f & 2 && jr(t)) return !0;
	return !1;
}
function Q(e) {
	var t = W;
	try {
		return W = !0, e();
	} finally {
		W = t;
	}
}
function Mr(e) {
	if (!(typeof e != "object" || !e || e instanceof EventTarget)) {
		if (C in e) Nr(e);
		else if (!Array.isArray(e)) for (let t in e) {
			let n = e[t];
			typeof n == "object" && n && C in n && Nr(n);
		}
	}
}
function Nr(e, t = /* @__PURE__ */ new Set()) {
	if (typeof e == "object" && e && !(e instanceof EventTarget) && !t.has(e)) {
		t.add(e), e instanceof Date && e.getTime();
		for (let n in e) try {
			Nr(e[n], t);
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/attachments/index.js
function Pr() {
	return Symbol(ze);
}
function Fr(e) {
	return e.endsWith("capture") && e !== "gotpointercapture" && e !== "lostpointercapture";
}
var Ir = [
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
function Lr(e) {
	return Ir.includes(e);
}
var Rr = /* @__PURE__ */ "allowfullscreen.async.autofocus.autoplay.checked.controls.default.disabled.formnovalidate.indeterminate.inert.ismap.loop.multiple.muted.nomodule.novalidate.open.playsinline.readonly.required.reversed.seamless.selected.webkitdirectory.defer.disablepictureinpicture.disableremoteplayback".split("."), zr = {
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
function Br(e) {
	return e = e.toLowerCase(), zr[e] ?? e;
}
[...Rr];
var Vr = ["touchstart", "touchmove"];
function Hr(e) {
	return Vr.includes(e);
}
var Ur = [
	"textarea",
	"script",
	"style",
	"title"
];
function Wr(e) {
	return Ur.includes(e);
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/elements/events.js
var Gr = Symbol("events"), Kr = /* @__PURE__ */ new Set(), qr = /* @__PURE__ */ new Set();
function Jr(e) {
	if (!T) return;
	e.removeAttribute("onload"), e.removeAttribute("onerror");
	let t = e.__e;
	t !== void 0 && (e.__e = void 0, queueMicrotask(() => {
		e.isConnected && e.dispatchEvent(t);
	}));
}
function Yr(e, t, n, r = {}) {
	function i(e) {
		if (r.capture || ti.call(t, e), !e.cancelBubble) return jt(() => n?.call(this, e));
	}
	return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? j(() => {
		t.addEventListener(e, i, r);
	}) : t.addEventListener(e, i, r), i;
}
function Xr(e, t, n, r = {}) {
	var i = Yr(t, e, n, r);
	return () => {
		e.removeEventListener(t, i, r);
	};
}
function Zr(e, t, n, r, i) {
	var a = {
		capture: r,
		passive: i
	}, o = Yr(e, t, n, a);
	(t === document.body || t === window || t === document || t instanceof HTMLMediaElement) && Un(() => {
		t.removeEventListener(e, o, a);
	});
}
function Qr(e, t, n) {
	(t[Gr] ??= {})[e] = n;
}
function $r(e) {
	for (var t = 0; t < e.length; t++) Kr.add(e[t]);
	for (var n of qr) n(e);
}
var ei = null;
function ti(e) {
	var t = this, n = t.ownerDocument, r = e.type, a = e.composedPath?.() || [], o = a[0] || e.target;
	ei = e;
	var s = 0, c = ei === e && e[Gr];
	if (c) {
		var l = a.indexOf(c);
		if (l !== -1 && (t === document || t === window)) {
			e[Gr] = t;
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
		var d = U, f = K;
		G(null), q(null);
		try {
			for (var p, m = []; o !== null && o !== t;) {
				try {
					var h = o[Gr]?.[r];
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
			e[Gr] = t, delete e.currentTarget, G(d), q(f);
		}
	}
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/reconciler.js
var ni = globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", { createHTML: (e) => e });
function ri(e) {
	return ni?.createHTML(e) ?? e;
}
function ii(e) {
	var t = Rn("template");
	return t.innerHTML = ri(e.replaceAll("<!>", "<!---->")), t.content;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/template.js
function $(e, t) {
	var n = K;
	n.nodes === null && (n.nodes = {
		start: e,
		end: t,
		a: null,
		t: null
	});
}
/*#__NO_SIDE_EFFECTS__*/
function ai(e, t) {
	var n = !!(t & 1), r = !!(t & 2), i, a = !e.startsWith("<!>");
	return () => {
		if (T) return $(D, null), D;
		i === void 0 && (i = ii(a ? e : "<!>" + e), n || (i = /* @__PURE__ */ R(i)));
		var t = r || kn ? document.importNode(i, !0) : i.cloneNode(!0);
		if (n) {
			var o = /* @__PURE__ */ R(t), s = t.lastChild;
			$(o, s);
		} else $(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function oi(e, t, n = "svg") {
	var r = !e.startsWith("<!>"), i = !!(t & 1), a = `<${n}>${r ? e : "<!>" + e}</${n}>`, o;
	return () => {
		if (T) return $(D, null), D;
		if (!o) {
			var e = /* @__PURE__ */ R(ii(a));
			if (i) for (o = document.createDocumentFragment(); /* @__PURE__ */ R(e);) o.appendChild(/* @__PURE__ */ R(e));
			else o = /* @__PURE__ */ R(e);
		}
		var t = o.cloneNode(!0);
		if (i) {
			var n = /* @__PURE__ */ R(t), r = t.lastChild;
			$(n, r);
		} else $(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function si(e, t) {
	return /* @__PURE__ */ oi(e, t, "svg");
}
function ci(e = "") {
	if (!T) {
		var t = L(e + "");
		return $(t, t), t;
	}
	var n = D;
	return n.nodeType === 3 ? zn(n) : (n.before(n = L()), O(n)), $(n, n), n;
}
function li() {
	if (T) return $(D, null), D;
	var e = document.createDocumentFragment(), t = document.createComment(""), n = L();
	return e.append(t, n), $(t, n), e;
}
function ui(e, t) {
	if (T) {
		var n = K;
		n.f & 32768 && n.nodes.end !== null || (n.nodes.end = D), k();
	} else e !== null && e.before(t);
}
function di() {
	if (T && D && D.nodeType === 8 && D.textContent?.startsWith("$")) {
		let e = D.textContent.substring(1);
		return k(), e;
	}
	return (window.__svelte ??= {}).uid ??= 1, `c${window.__svelte.uid++}`;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/render.js
var fi = !0;
function pi(e) {
	fi = e;
}
function mi(e, t) {
	var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
	n !== (e[ye] ??= e.nodeValue) && (e[ye] = n, e.nodeValue = `${n}`);
}
function hi(e, t) {
	return _i(e, t);
}
var gi = /* @__PURE__ */ new Map();
function _i(e, { target: t, anchor: n, props: i = {}, events: a, context: o, intro: s = !0, transformError: c }) {
	Mn();
	var l = void 0, u = Jn(() => {
		var u = n ?? t.appendChild(L());
		Ft(u, { pending: () => {} }, (t) => {
			dt({});
			var n = A;
			if (o && (n.c = o), a && (i.$$events = a), T && $(t, null), fi = s, l = e(t, i) || {}, fi = !0, T && (K.nodes.end = D, D === null || D.nodeType !== 8 || D.data !== "]")) throw Ve(), Fe;
			ft();
		}, c);
		var d = /* @__PURE__ */ new Set(), f = (e) => {
			for (var n = 0; n < e.length; n++) {
				var r = e[n];
				if (!d.has(r)) {
					d.add(r);
					var i = Hr(r);
					for (let e of [t, document]) {
						var a = gi.get(e);
						a === void 0 && (a = /* @__PURE__ */ new Map(), gi.set(e, a));
						var o = a.get(r);
						o === void 0 ? (e.addEventListener(r, ti, { passive: i }), a.set(r, 1)) : a.set(r, o + 1);
					}
				}
			}
		};
		return f(r(Kr)), qr.add(f), () => {
			for (var e of d) for (let n of [t, document]) {
				var r = gi.get(n), i = r.get(e);
				--i == 0 ? (n.removeEventListener(e, ti), r.delete(e), r.size === 0 && gi.delete(n)) : r.set(e, i);
			}
			qr.delete(f), u !== n && u.parentNode?.removeChild(u);
		};
	});
	return vi.set(l, u), l;
}
var vi = /* @__PURE__ */ new WeakMap();
function yi(e, t) {
	let n = vi.get(e);
	return n ? (vi.delete(e), n(t)) : Promise.resolve();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/blocks/branches.js
var bi = class {
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
			if (n) cr(n), this.#r.delete(t);
			else {
				var r = this.#n.get(t);
				r && (cr(r.effect), this.#t.set(t, r.effect), this.#n.delete(t), r.fragment.lastChild.remove(), this.anchor.before(r.fragment), n = r.effect);
			}
			for (let [t, n] of this.#e) {
				if (this.#e.delete(t), t === e) break;
				let r = this.#n.get(n);
				r && (H(r.effect), this.#n.delete(n));
			}
			for (let [e, r] of this.#t) {
				if (e === t || this.#r.has(e)) continue;
				let i = () => {
					if (Array.from(this.#e.values()).includes(e)) {
						var t = document.createDocumentFragment();
						ur(r, t), t.append(L()), this.#n.set(e, {
							effect: r,
							fragment: t
						});
					} else H(r);
					this.#r.delete(e), this.#t.delete(e);
				};
				this.#i || !n ? (this.#r.add(e), or(r, i, !1)) : i();
			}
		}
	};
	#o = (e) => {
		this.#e.delete(e);
		let t = Array.from(this.#e.values());
		for (let [e, n] of this.#n) t.includes(e) || (H(n.effect), this.#n.delete(e));
	};
	ensure(e, t) {
		var n = N, r = Ln();
		if (t && !this.#t.has(e) && !this.#n.has(e)) {
			if (r) {
				var i = document.createDocumentFragment(), a = L();
				i.append(a), this.#n.set(e, {
					effect: V(() => t(a)),
					fragment: i
				});
			} else this.#t.set(e, V(() => t(this.anchor)));
		}
		if (this.#e.set(n, e), r) {
			for (let [t, r] of this.#t) t === e ? n.unskip_effect(r) : n.skip_effect(r);
			for (let [t, r] of this.#n) t === e ? n.unskip_effect(r.effect) : n.skip_effect(r.effect);
			n.oncommit(this.#a), n.ondiscard(this.#o);
		} else T && (this.anchor = D), this.#a(n);
	}
}, xi = 0, Si = 1, Ci = 2;
function wi(e, t, n, r, i) {
	T && k();
	var a = pt(), o = w, s = a ? F(o) : /* @__PURE__ */ yn(o, !1, !1), c = a ? F(o) : /* @__PURE__ */ yn(o, !1, !1), l = new bi(e);
	$n(() => {
		var a = N, o = t(), u = !1;
		let d = T && p(o) === (e.data === "[!");
		if (d && (O(qe()), E(!1)), p(o)) {
			var f = Rt(), m = !1;
			let e = (e) => {
				if (!u) {
					m = !0, f(!1), N === a && a.deactivate(), sn.ensure();
					try {
						e();
					} finally {
						zt(!1), en || cn();
					}
				}
			};
			o.then((t) => {
				e(() => {
					bn(s, t), l.ensure(Si, r && ((e) => r(e, s)));
				});
			}, (t) => {
				e(() => {
					if (bn(c, t), l.ensure(Ci, i && ((e) => i(e, c))), !i) throw c.v;
				});
			}), T ? l.ensure(xi, n) : j(() => {
				m || e(() => {
					l.ensure(xi, n);
				});
			});
		} else bn(s, o), l.ensure(Si, r && ((e) => r(e, s)));
		return d && E(!0), () => {
			u = !0;
		};
	});
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/blocks/if.js
function Ti(e, t, n = !1) {
	var r;
	T && (r = D, k());
	var i = new bi(e), a = n ? ae : 0;
	function o(e, t) {
		if (T) {
			var n = Je(r);
			if (e !== parseInt(n.substring(1))) {
				var a = qe();
				O(a), i.anchor = a, E(!1), i.ensure(e, t), E(!0);
				return;
			}
		}
		i.ensure(e, t);
	}
	$n(() => {
		var e = !1;
		t((t, n = 0) => {
			e = !0, o(n, t);
		}), e || o(-1, null);
	}, a);
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/blocks/key.js
var Ei = Symbol("NaN");
function Di(e, t, n) {
	T && k();
	var r = new bi(e), i = !pt();
	$n(() => {
		var e = t();
		e !== e && (e = Ei), i && typeof e == "object" && e && (e = {}), r.ensure(e, n);
	});
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/blocks/each.js
function Oi(e, t) {
	return t;
}
function ki(e, t, n) {
	for (var i = [], a = t.length, o, s = t.length, c = 0; c < a; c++) {
		let n = t[c];
		or(n, () => {
			if (o) {
				if (o.pending.delete(n), o.done.add(n), o.pending.size === 0) {
					var t = e.outrogroups;
					Ai(e, r(o.done)), t.delete(o), t.size === 0 && (e.outrogroups = null);
				}
			} else --s;
		}, !1);
	}
	if (s === 0) {
		var l = i.length === 0 && n !== null;
		if (l) {
			var u = n, d = u.parentNode;
			In(d), d.append(u), e.items.clear();
		}
		Ai(e, t, !l);
	} else o = {
		pending: new Set(t),
		done: /* @__PURE__ */ new Set()
	}, (e.outrogroups ??= /* @__PURE__ */ new Set()).add(o);
}
function Ai(e, t, n = !0) {
	var r;
	if (e.pending.size > 0) {
		r = /* @__PURE__ */ new Set();
		for (let t of e.pending.values()) for (let n of t) r.add(e.items.get(n).e);
	}
	for (var i = 0; i < t.length; i++) {
		var a = t[i];
		r?.has(a) ? (a.f |= ce, ur(a, document.createDocumentFragment())) : H(t[i], n);
	}
}
var ji;
function Mi(t, n, i, a, o, s = null) {
	var c = t, l = /* @__PURE__ */ new Map();
	if (n & 4) {
		var u = t;
		c = T ? O(/* @__PURE__ */ R(u)) : u.appendChild(L());
	}
	T && k();
	var d = null, f = /* @__PURE__ */ Gt(() => {
		var t = i();
		return e(t) ? t : t == null ? [] : r(t);
	}), p, m = /* @__PURE__ */ new Map(), h = !0;
	function g(e) {
		v.effect.f & 16384 || (v.pending.delete(e), v.fallback = d, Pi(v, p, c, n, a), d !== null && (p.length === 0 ? d.f & 33554432 ? (d.f ^= ce, Ii(d, null, c)) : cr(d) : or(d, () => {
			d = null;
		})));
	}
	function _(e) {
		v.pending.delete(e);
	}
	var v = {
		effect: $n(() => {
			p = Z(f);
			var e = p.length;
			let t = !1;
			T && Je(c) === "[!" != (e === 0) && (c = qe(), O(c), E(!1), t = !0);
			for (var r = /* @__PURE__ */ new Set(), u = N, v = Ln(), y = 0; y < e; y += 1) {
				T && D.nodeType === 8 && D.data === "]" && (c = D, t = !0, E(!1));
				var b = p[y], x = a(b, y), S = h ? null : l.get(x);
				S ? (S.v && bn(S.v, b), S.i && bn(S.i, y), v && u.unskip_effect(S.e)) : (S = Fi(l, h ? c : ji ??= L(), b, x, y, o, n, i), h || (S.e.f |= ce), l.set(x, S)), r.add(x);
			}
			if (e === 0 && s && !d && (h ? d = V(() => s(c)) : (d = V(() => s(ji ??= L())), d.f |= ce)), e > r.size && Te("", "", ""), T && e > 0 && O(qe()), !h) {
				if (m.set(u, r), v) {
					for (let [e, t] of l) r.has(e) || u.skip_effect(t.e);
					u.oncommit(g), u.ondiscard(_);
				} else g(u);
			}
			t && E(!0), Z(f);
		}),
		flags: n,
		items: l,
		pending: m,
		outrogroups: null,
		fallback: d
	};
	h = !1, T && (c = D);
}
function Ni(e) {
	for (; e !== null && !(e.f & 32);) e = e.next;
	return e;
}
function Pi(e, t, n, i, a) {
	var o = !!(i & 8), s = t.length, c = e.items, l = Ni(e.effect.first), u, d = null, f, p = [], m = [], h, g, _, v;
	if (o) for (v = 0; v < s; v += 1) h = t[v], g = a(h, v), _ = c.get(g).e, _.f & 33554432 || (_.nodes?.a?.measure(), (f ??= /* @__PURE__ */ new Set()).add(_));
	for (v = 0; v < s; v += 1) {
		if (h = t[v], g = a(h, v), _ = c.get(g).e, e.outrogroups !== null) for (let t of e.outrogroups) t.pending.delete(_), t.done.delete(_);
		if (_.f & 8192 && (cr(_), o && (_.nodes?.a?.unfix(), (f ??= /* @__PURE__ */ new Set()).delete(_))), _.f & 33554432) {
			if (_.f ^= ce, _ === l) Ii(_, null, n);
			else {
				var y = d ? d.next : l;
				_ === e.effect.last && (e.effect.last = _.prev), _.prev && (_.prev.next = _.next), _.next && (_.next.prev = _.prev), Li(e, d, _), Li(e, _, y), Ii(_, y, n), d = _, p = [], m = [], l = Ni(d.next);
				continue;
			}
		}
		if (_ !== l) {
			if (u !== void 0 && u.has(_)) {
				if (p.length < m.length) {
					var b = m[0], x;
					d = b.prev;
					var S = p[0], ee = p[p.length - 1];
					for (x = 0; x < p.length; x += 1) Ii(p[x], b, n);
					for (x = 0; x < m.length; x += 1) u.delete(m[x]);
					Li(e, S.prev, ee.next), Li(e, d, S), Li(e, ee, b), l = b, d = ee, --v, p = [], m = [];
				} else u.delete(_), Ii(_, l, n), Li(e, _.prev, _.next), Li(e, _, d === null ? e.effect.first : d.next), Li(e, d, _), d = _;
				continue;
			}
			for (p = [], m = []; l !== null && l !== _;) (u ??= /* @__PURE__ */ new Set()).add(l), m.push(l), l = Ni(l.next);
			if (l === null) continue;
		}
		_.f & 33554432 || p.push(_), d = _, l = Ni(_.next);
	}
	if (e.outrogroups !== null) {
		for (let t of e.outrogroups) t.pending.size === 0 && (Ai(e, r(t.done)), e.outrogroups?.delete(t));
		e.outrogroups.size === 0 && (e.outrogroups = null);
	}
	if (l !== null || u !== void 0) {
		var te = [];
		if (u !== void 0) for (_ of u) _.f & 8192 || te.push(_);
		for (; l !== null;) !(l.f & 8192) && l !== e.fallback && te.push(l), l = Ni(l.next);
		var ne = te.length;
		if (ne > 0) {
			var re = i & 4 && s === 0 ? n : null;
			if (o) {
				for (v = 0; v < ne; v += 1) te[v].nodes?.a?.measure();
				for (v = 0; v < ne; v += 1) te[v].nodes?.a?.fix();
			}
			ki(e, te, re);
		}
	}
	o && j(() => {
		if (f !== void 0) for (_ of f) _.nodes?.a?.apply();
	});
}
function Fi(e, t, n, r, i, a, o, s) {
	var c = o & 1 ? o & 16 ? F(n) : /* @__PURE__ */ yn(n, !1, !1) : null, l = o & 2 ? F(i) : null;
	return {
		v: c,
		i: l,
		e: V(() => (a(t, c ?? n, l ?? i, s), () => {
			e.delete(r);
		}))
	};
}
function Ii(e, t, n) {
	if (e.nodes) for (var r = e.nodes.start, i = e.nodes.end, a = t && !(t.f & 33554432) ? t.nodes.start : n; r !== null;) {
		var o = /* @__PURE__ */ z(r);
		if (a.before(r), r === i) return;
		r = o;
	}
}
function Li(e, t, n) {
	t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
function Ri(e, t, n = !1, r = !1, i = !1, a = !1) {
	var o = e, s = "";
	if (n) {
		var c = e;
		T && (o = O(/* @__PURE__ */ R(c)));
	}
	Qn(() => {
		var e = K;
		if (s === (s = t() ?? "")) T && k();
		else if (n && !T) e.nodes = null, c.innerHTML = s, s !== "" && $(/* @__PURE__ */ R(c), c.lastChild);
		else if (e.nodes !== null && (ir(e.nodes.start, e.nodes.end), e.nodes = null), s !== "") {
			if (T) {
				for (var a = D.data, l = k(), u = l; l !== null && (l.nodeType !== 8 || l.data !== "");) u = l, l = /* @__PURE__ */ z(l);
				if (l === null) throw Ve(), Fe;
				$(D, u), o = O(l);
			} else {
				var d = Rn(r ? "svg" : i ? "math" : "template", r ? Le : i ? Re : void 0);
				d.innerHTML = s;
				var f = r || i ? d : d.content;
				if ($(/* @__PURE__ */ R(f), f.lastChild), r || i) for (; /* @__PURE__ */ R(f);) o.before(/* @__PURE__ */ R(f));
				else o.before(f);
			}
		}
	});
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/blocks/snippet.js
function zi(e, t, ...n) {
	var r = new bi(e);
	$n(() => {
		let e = t() ?? null;
		r.ensure(e, e && ((t) => e(t, ...n)));
	}, ae);
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/blocks/svelte-component.js
function Bi(e, t, n) {
	var r;
	T && (r = D, k());
	var i = new bi(e);
	$n(() => {
		var e = t() ?? null;
		if (T && Je(r) === "[" != (e !== null)) {
			var a = qe();
			O(a), i.anchor = a, E(!1), i.ensure(e, e && ((t) => n(t, e))), E(!0);
		} else i.ensure(e, e && ((t) => n(t, e)));
	}, ae);
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/timing.js
var Vi = () => performance.now(), Hi = {
	tick: (e) => requestAnimationFrame(e),
	now: () => Vi(),
	tasks: /* @__PURE__ */ new Set()
};
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/loop.js
function Ui() {
	let e = Hi.now();
	Hi.tasks.forEach((t) => {
		t.c(e) || (Hi.tasks.delete(t), t.f());
	}), Hi.tasks.size !== 0 && Hi.tick(Ui);
}
function Wi(e) {
	let t;
	return Hi.tasks.size === 0 && Hi.tick(Ui), {
		promise: new Promise((n) => {
			Hi.tasks.add(t = {
				c: e,
				f: n
			});
		}),
		abort() {
			Hi.tasks.delete(t);
		}
	};
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/elements/transitions.js
function Gi(e, t) {
	jt(() => {
		e.dispatchEvent(new CustomEvent(t));
	});
}
function Ki(e) {
	if (e === "float") return "cssFloat";
	if (e === "offset") return "cssOffset";
	if (e.startsWith("--")) return e;
	let t = e.split("-");
	return t.length === 1 ? t[0] : t[0] + t.slice(1).map((e) => e[0].toUpperCase() + e.slice(1)).join("");
}
function qi(e) {
	let t = {}, n = e.split(";");
	for (let e of n) {
		let [n, r] = e.split(":");
		if (!n || r === void 0) break;
		let i = Ki(n.trim());
		t[i] = r.trim();
	}
	return t;
}
var Ji = (e) => e;
function Yi(e, t, n, r) {
	var i = !!(e & 1), a = !!(e & 2), o = i && a, s = !!(e & 4), c = o ? "both" : i ? "in" : "out", l, u = t.inert, d = t.style.overflow, f, p;
	function m() {
		return jt(() => l ??= n()(t, r?.() ?? {}, { direction: c }));
	}
	var h = {
		is_global: s,
		in() {
			t.inert = u, i ? (a || f?.abort(), f = Xi(t, m(), p, 1, () => {
				Gi(t, "introstart");
			}, () => {
				Gi(t, "introend"), f?.abort(), f = l = void 0, t.style.overflow = d;
			})) : (p?.abort(), p?.reset?.());
		},
		out(e) {
			a ? (t.inert = !0, p = Xi(t, m(), f, 0, () => {
				Gi(t, "outrostart");
			}, () => {
				Gi(t, "outroend"), e?.();
			})) : (e?.(), l = void 0);
		},
		stop: () => {
			f?.abort(), p?.abort();
		}
	}, g = K;
	if ((g.nodes.t ??= []).push(h), i && fi) {
		var _ = s;
		if (!_) {
			for (var v = g.parent; v && v.f & 65536;) for (; (v = v.parent) && !(v.f & 16););
			_ = !v || !!(v.f & 32768);
		}
		_ && Yn(() => {
			Q(() => h.in());
		});
	}
}
function Xi(e, t, n, r, i, a) {
	var o = r === 1;
	if (d(t)) {
		var s, c = !1;
		return j(() => {
			c || (s = Xi(e, t({ direction: o ? "in" : "out" }), n, r, i, a));
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
	let { delay: l = 0, css: u, tick: p, easing: m = Ji } = t;
	var h = [];
	if (o && n === void 0 && (p && p(0, 1), u)) {
		var g = qi(u(0, 1));
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
				var g = o + s * m(h / f), y = qi(u(g, 1 - g));
				l.push(y), d ||= y.overflow === "hidden";
			}
			d && (e.style.overflow = "hidden"), _ = () => {
				var e = v.currentTime;
				return o + s * m(e / c);
			}, p && Wi(() => {
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
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/blocks/svelte-element.js
function Zi(e, t, n, r, i, a) {
	let o = T;
	T && k();
	var s = null;
	T && D.nodeType === 1 && (s = D, k());
	var c = T ? D : e, l = new bi(c, !1);
	$n(() => {
		let e = t() || null;
		var a = i ? i() : n || e === "svg" ? Le : void 0;
		if (e === null) l.ensure(null, null), pi(!0);
		else return l.ensure(e, (t) => {
			if (e) {
				if (s = T ? s : Rn(e, a), $(s, s), r) {
					var n = null;
					T && Wr(e) && s.append(n = document.createComment(""));
					var i = T ? /* @__PURE__ */ R(s) : s.appendChild(L());
					T && (i === null ? E(!1) : O(i)), r(s, i), n?.remove();
				}
				K.nodes.end = s, t.before(s);
			}
			T && O(t);
		}), pi(!0), () => {
			e && pi(!1);
		};
	}, ae), Un(() => {
		pi(!0);
	}), o && (E(!0), O(c));
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/elements/actions.js
function Qi(e, t, n) {
	Yn(() => {
		var r = Q(() => t(e, n?.()) || {});
		if (n && r?.update) {
			var i = !1, a = {};
			Zn(() => {
				var e = n();
				Mr(e), i && Xe(a, e) && (a = e, r.update(e));
			}), i = !0;
		}
		if (r?.destroy) return () => r.destroy();
	});
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/elements/attachments.js
function $i(e, t) {
	var n = void 0, r;
	er(() => {
		n !== (n = t()) && (r &&= (H(r), null), n && (r = V(() => {
			Yn(() => n(e));
		})));
	});
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/clsx/dist/clsx.mjs
function ea(e) {
	var t, n, r = "";
	if (typeof e == "string" || typeof e == "number") r += e;
	else if (typeof e == "object") {
		if (Array.isArray(e)) {
			var i = e.length;
			for (t = 0; t < i; t++) e[t] && (n = ea(e[t])) && (r && (r += " "), r += n);
		} else for (n in e) e[n] && (r && (r += " "), r += n);
	}
	return r;
}
function ta() {
	for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = ea(e)) && (r && (r += " "), r += t);
	return r;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/shared/attributes.js
function na(e) {
	return typeof e == "object" ? ta(e) : e ?? "";
}
var ra = [..." 	\n\r\f\xA0\v﻿"];
function ia(e, t, n) {
	var r = e == null ? "" : "" + e;
	if (t && (r = r ? r + " " + t : t), n) {
		for (var i of Object.keys(n)) if (n[i]) r = r ? r + " " + i : i;
		else if (r.length) for (var a = i.length, o = 0; (o = r.indexOf(i, o)) >= 0;) {
			var s = o + a;
			(o === 0 || ra.includes(r[o - 1])) && (s === r.length || ra.includes(r[s])) ? r = (o === 0 ? "" : r.substring(0, o)) + r.substring(s + 1) : o = s;
		}
	}
	return r === "" ? null : r;
}
function aa(e, t = !1) {
	var n = t ? " !important;" : ";", r = "";
	for (var i of Object.keys(e)) {
		var a = e[i];
		a != null && a !== "" && (r += " " + i + ": " + a + n);
	}
	return r;
}
function oa(e) {
	return e[0] !== "-" || e[1] !== "-" ? e.toLowerCase() : e;
}
function sa(e, t) {
	if (t) {
		var n = "", r, i;
		if (Array.isArray(t) ? (r = t[0], i = t[1]) : r = t, e) {
			e = String(e).replaceAll(/\s*\/\*.*?\*\/\s*/g, "").trim();
			var a = !1, o = 0, s = !1, c = [];
			r && c.push(...Object.keys(r).map(oa)), i && c.push(...Object.keys(i).map(oa));
			var l = 0, u = -1;
			let t = e.length;
			for (var d = 0; d < t; d++) {
				var f = e[d];
				if (s ? f === "/" && e[d - 1] === "*" && (s = !1) : a ? a === f && (a = !1) : f === "/" && e[d + 1] === "*" ? s = !0 : f === "\"" || f === "'" ? a = f : f === "(" ? o++ : f === ")" && o--, !s && a === !1 && o === 0) {
					if (f === ":" && u === -1) u = d;
					else if (f === ";" || d === t - 1) {
						if (u !== -1) {
							var p = oa(e.substring(l, u).trim());
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
		return r && (n += aa(r)), i && (n += aa(i, !0)), n = n.trim(), n === "" ? null : n;
	}
	return e == null ? null : String(e);
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/elements/class.js
function ca(e, t, n, r, i, a) {
	var o = e[_e];
	if (T || o !== n || o === void 0) {
		var s = ia(n, r, a);
		T && s === e.getAttribute("class") || (s == null ? e.removeAttribute("class") : t ? e.className = s : e.setAttribute("class", s)), e[_e] = n;
	} else if (a && i !== a) for (var c in a) {
		var l = !!a[c];
		(i == null || l !== !!i[c]) && e.classList.toggle(c, l);
	}
	return a;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/elements/style.js
function la(e, t = {}, n, r) {
	for (var i in n) {
		var a = n[i];
		t[i] !== a && (n[i] == null ? e.style.removeProperty(i) : e.style.setProperty(i, a, r));
	}
}
function ua(e, t, n, r) {
	var i = e[ve];
	if (T || i !== t) {
		var a = sa(t, r);
		T && a === e.getAttribute("style") || (a == null ? e.removeAttribute("style") : e.style.cssText = a), e[ve] = t;
	} else r && (Array.isArray(r) ? (la(e, n?.[0], r[0]), la(e, n?.[1], r[1], "important")) : la(e, n, r));
	return r;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/elements/bindings/select.js
function da(t, n, r = !1) {
	if (t.multiple) {
		if (n == null) return;
		if (!e(n)) return He();
		for (var i of t.options) i.selected = n.includes(ma(i));
	} else {
		for (i of t.options) if (Dn(ma(i), n)) {
			i.selected = !0;
			return;
		}
		r && n === void 0 || (t.selectedIndex = -1);
	}
}
function fa(e) {
	var t = new MutationObserver(() => {
		"__value" in e && da(e, e.__value);
	});
	t.observe(e, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: ["value"]
	}), Un(() => {
		t.disconnect();
	});
}
function pa(e, t, n = t) {
	var r = /* @__PURE__ */ new WeakSet(), i = !0;
	Mt(e, "change", (t) => {
		var i = t ? "[selected]" : ":checked", a;
		if (e.multiple) a = [].map.call(e.querySelectorAll(i), ma);
		else {
			var o = e.querySelector(i) ?? e.querySelector("option:not([disabled])");
			a = o && ma(o);
		}
		n(a), e.__value = a, N !== null && r.add(N);
	}), Yn(() => {
		var a = t();
		if (e === document.activeElement) {
			var o = N;
			if (r.has(o)) return;
		}
		if (da(e, a, i), i && a === void 0) {
			var s = e.querySelector(":checked");
			s !== null && (a = ma(s), n(a));
		}
		e.__value = a, i = !1;
	}), fa(e);
}
function ma(e) {
	return "__value" in e ? e.__value : e.value;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/elements/attributes.js
var ha = Symbol("class"), ga = Symbol("style"), _a = Symbol("is custom element"), va = Symbol("is html"), ya = Se ? "link" : "LINK", ba = Se ? "input" : "INPUT", xa = Se ? "option" : "OPTION", Sa = Se ? "select" : "SELECT", Ca = Se ? "progress" : "PROGRESS";
function wa(e) {
	if (T) {
		var t = !1, n = () => {
			if (!t) {
				if (t = !0, e.hasAttribute("value")) {
					var n = e.value;
					Oa(e, "value", null), e.value = n;
				}
				if (e.hasAttribute("checked")) {
					var r = e.checked;
					Oa(e, "checked", null), e.checked = r;
				}
			}
		};
		e[be] = n, j(n), At();
	}
}
function Ta(e, t) {
	var n = ja(e);
	n.value !== (n.value = t ?? void 0) && (e.value !== t || t === 0 && e.nodeName === Ca) && (e.value = t ?? "");
}
function Ea(e, t) {
	var n = ja(e);
	n.checked !== (n.checked = t ?? void 0) && (e.checked = t);
}
function Da(e, t) {
	t ? e.hasAttribute("selected") || e.setAttribute("selected", "") : e.removeAttribute("selected");
}
function Oa(e, t, n, r) {
	var i = ja(e);
	T && (i[t] = e.getAttribute(t), t === "src" || t === "srcset" || t === "href" && e.nodeName === ya) || i[t] !== (i[t] = n) && (t === "loading" && (e[me] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && Na(e).includes(t) ? e[t] = n : e.setAttribute(t, n));
}
function ka(e, t, n, r, i = !1, a = !1) {
	if (T && i && e.nodeName === ba) {
		var o = e;
		(o.type === "checkbox" ? "defaultChecked" : "defaultValue") in n || wa(o);
	}
	var s = ja(e), c = s[_a], l = !s[va];
	let u = T && c;
	u && E(!1);
	var d = t || {}, f = e.nodeName === xa;
	for (var p in t) p in n || (n[p] = null);
	n.class ? n.class = na(n.class) : (r || n[ha]) && (n.class = null), n[ga] && (n.style ??= null);
	var m = Na(e);
	if (e.nodeName === ba && "type" in n && ("value" in n || "__value" in n)) {
		var h = n.type;
		(h !== d.type || h === void 0 && e.hasAttribute("type")) && (d.type = h, Oa(e, "type", h, a));
	}
	for (let i in n) {
		let o = n[i];
		if (f && i === "value" && o == null) e.value = e.__value = "", d[i] = o;
		else if (i === "class") ca(e, e.namespaceURI === "http://www.w3.org/1999/xhtml", o, r, t?.[ha], n[ha]), d[i] = o, d[ha] = n[ha];
		else if (i === "style") ua(e, o, t?.[ga], n[ga]), d[i] = o, d[ga] = n[ga];
		else {
			var g = d[i];
			if (o !== g || o === void 0 && e.hasAttribute(i)) {
				d[i] = o;
				var _ = i[0] + i[1];
				if (_ !== "$$") {
					if (_ === "on") {
						let t = {}, n = "$$" + i, r = i.slice(2);
						var v = Lr(r);
						if (Fr(r) && (r = r.slice(0, -7), t.capture = !0), !v && g) {
							if (o != null) continue;
							e.removeEventListener(r, d[n], t), d[n] = null;
						}
						if (v) Qr(r, e, o), $r([r]);
						else if (o != null) {
							function a(e) {
								d[i].call(this, e);
							}
							d[n] = Yr(r, e, a, t);
						}
					} else if (i === "style") Oa(e, i, o);
					else if (i === "autofocus") Dt(e, !!o);
					else if (!c && (i === "__value" || i === "value" && o != null)) e.value = e.__value = o;
					else if (i === "selected" && f) Da(e, o);
					else {
						var y = i;
						l || (y = Br(y));
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
						} else b || m.includes(y) && (c || typeof o != "string") ? (e[y] = o, y in s && (s[y] = w)) : typeof o != "function" && Oa(e, y, o, a);
					}
				}
			}
		}
	}
	return u && E(!0), d;
}
function Aa(e, t, n = [], r = [], i = [], a, o = !1, s = !1) {
	Lt(i, n, r, (n) => {
		var r = void 0, i = {}, c = e.nodeName === Sa, l = !1;
		if (er(() => {
			var u = t(...n.map(Z)), d = ka(e, r, u, a, o, s);
			l && c && "value" in u && da(e, u.value);
			for (let e of Object.getOwnPropertySymbols(i)) u[e] || H(i[e]);
			for (let t of Object.getOwnPropertySymbols(u)) {
				var f = u[t];
				t.description !== "@attach" || r && f === r[t] || (i[t] && H(i[t]), i[t] = V(() => $i(e, () => f))), d[t] = f;
			}
			r = d;
		}), c) {
			var u = e;
			Yn(() => {
				da(u, r.value, !0), fa(u);
			});
		}
		l = !0;
	});
}
function ja(e) {
	return e[ge] ??= {
		[_a]: e.nodeName.includes("-"),
		[va]: e.namespaceURI === Ie
	};
}
var Ma = /* @__PURE__ */ new Map();
function Na(e) {
	var t = e.getAttribute("is") || e.nodeName, n = Ma.get(t);
	if (n) return n;
	Ma.set(t, n = []);
	for (var r, i = e, a = Element.prototype; a !== i;) {
		for (var s in r = o(i), r) r[s].set && s !== "innerHTML" && s !== "textContent" && s !== "innerText" && n.push(s);
		i = l(i);
	}
	return n;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/elements/bindings/input.js
function Pa(e, t, n = t) {
	var r = /* @__PURE__ */ new WeakSet();
	Mt(e, "input", async (i) => {
		var a = i ? e.defaultValue : e.value;
		if (a = Ia(e) ? La(a) : a, n(a), N !== null && r.add(N), await kr(), a !== (a = t())) {
			var o = e.selectionStart, s = e.selectionEnd, c = e.value.length;
			if (e.value = a ?? "", s !== null) {
				var l = e.value.length;
				o === s && s === c && l > c ? (e.selectionStart = l, e.selectionEnd = l) : (e.selectionStart = o, e.selectionEnd = Math.min(s, l));
			}
		}
	}), (T && e.defaultValue !== e.value || Q(t) == null && e.value) && (n(Ia(e) ? La(e.value) : e.value), N !== null && r.add(N)), Zn(() => {
		var n = t();
		if (e === document.activeElement) {
			var i = N;
			if (r.has(i)) return;
		}
		Ia(e) && n === La(e.value) || (e.type !== "date" || n || e.value) && n !== e.value && (e.value = n ?? "");
	});
}
function Fa(e, t, n = t) {
	Mt(e, "change", (t) => {
		n(t ? e.defaultChecked : e.checked);
	}), (T && e.defaultChecked !== e.checked || Q(t) == null) && n(e.checked), Zn(() => {
		e.checked = !!t();
	});
}
function Ia(e) {
	var t = e.type;
	return t === "number" || t === "range";
}
function La(e) {
	return e === "" ? null : +e;
}
var Ra = /* @__PURE__ */ new class e {
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
function za(e, t, n) {
	var r = Ra.observe(e, () => n(e[t]));
	Yn(() => (Q(() => n(e[t])), r));
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/elements/bindings/this.js
function Ba(e, t) {
	return e === t || e?.[C] === t;
}
function Va(e = {}, t, n, r) {
	var i = A.r, a = K;
	return Yn(() => {
		var o, s;
		return Zn(() => {
			o = s, s = r?.() || [], Q(() => {
				Ba(n(...s), e) || (t(e, ...s), o && Ba(n(...o), e) && t(null, ...o));
			});
		}), () => {
			let r = a;
			for (; r !== i && r.parent !== null && r.parent.f & 33554432;) r = r.parent;
			let o = () => {
				s && Ba(n(...s), e) && t(null, ...s);
			}, c = r.teardown;
			r.teardown = () => {
				o(), c?.();
			};
		};
	}), e;
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/dom/legacy/lifecycle.js
function Ha(e = !1) {
	let t = A, n = t.l.u;
	if (!n) return;
	let r = () => Mr(t.s);
	if (e) {
		let e = 0, n = {}, i = /* @__PURE__ */ Vt(() => {
			let r = !1, i = t.s;
			for (let e in i) i[e] !== n[e] && (n[e] = i[e], r = !0);
			return r && e++, e;
		});
		r = () => Z(i);
	}
	n.b.length && Kn(() => {
		Ua(t, r), h(n.b);
	}), Wn(() => {
		let e = Q(() => n.m.map(m));
		return () => {
			for (let t of e) typeof t == "function" && t();
		};
	}), n.a.length && Wn(() => {
		Ua(t, r), h(n.a);
	});
}
function Ua(e, t) {
	if (e.l.s) for (let t of e.l.s) Z(t);
	t();
}
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/svelte/src/internal/client/reactivity/props.js
var Wa = {
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
function Ga(e, t, n) {
	return new Proxy({
		props: e,
		exclude: t
	}, Wa);
}
var Ka = {
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
		if (t === C || t === pe) return !1;
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
function qa(...e) {
	return new Proxy({ props: e }, Ka);
}
function Ja(e, t, n, r) {
	var i = !Qe || !!(n & 2), o = !!(n & 8), s = !!(n & 16), c = r, l = !0, u = void 0, d = () => s && i ? (u ??= /* @__PURE__ */ Vt(r), Z(u)) : (l && (l = !1, c = s ? Q(r) : r), c);
	let f;
	if (o) {
		var p = C in e || pe in e;
		f = a(e, t)?.set ?? (p && t in e ? (n) => e[t] = n : void 0);
	}
	var m, h = !1;
	o ? [m, h] = Et(() => e[t]) : m = e[t], m === void 0 && r !== void 0 && (m = d(), f && (i && Ae(t), f(m)));
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
	var v = !1, y = (n & 1 ? Vt : Gt)(() => (v = !1, g()));
	o && Z(y);
	var b = K;
	return (function(e, t) {
		if (arguments.length > 0) {
			let n = t ? Z(y) : i && o ? Tn(e) : e;
			return I(y, n), v = !0, c !== void 0 && (c = n), e;
		}
		return pr && v || b.f & 16384 ? y.v : Z(y);
	});
}
function Ya(e) {
	A === null && Ce("onMount"), Qe && A.l !== null ? Za(A).m.push(e) : Wn(() => {
		let t = Q(e);
		if (typeof t == "function") return t;
	});
}
function Xa(e) {
	A === null && Ce("onDestroy"), Ya(() => () => Q(e));
}
function Za(e) {
	var t = e.l;
	return t.u ??= {
		a: [],
		b: [],
		m: []
	};
}
export { Pr as $, Hi as A, lt as At, mi as B, We as Bt, na as C, Wt as Ct, Zi as D, Ot as Dt, Qi as E, Dt as Et, Oi as F, rt as Ft, si as G, v as Gt, ui as H, y as Ht, Di as I, tt as It, $r as J, di as K, Ti as L, $e as Lt, zi as M, dt as Mt, Ri as N, ct as Nt, Yi as O, ut as Ot, Mi as P, at as Pt, Jr as Q, wi as R, Ke as Rt, ca as S, cn as St, $i as T, Nt as Tt, li as U, _ as Ut, yi as V, g as Vt, ai as W, f as Wt, Zr as X, Qr as Y, Xr as Z, Ta as _, Cn as _t, qa as a, br as at, da as b, vn as bt, za as c, Zn as ct, ha as d, Kn as dt, U as et, ga as f, On as ft, Ea as g, Tn as gt, Oa as h, Fn as ht, Ga as i, Q as it, Bi as j, ft as jt, Wi as k, st as kt, Fa as l, Qn as lt, wa as m, Pn as mt, Ya as n, G as nt, Ha as o, Yn as ot, Aa as p, Nn as pt, ci as q, Ja as r, kr as rt, Va as s, qn as st, Xa as t, Z as tt, Pa as u, Wn as ut, pa as v, I as vt, ta as w, Ft as wt, ua as x, Sn as xt, fa as y, F as yt, hi as z, Ge as zt };
