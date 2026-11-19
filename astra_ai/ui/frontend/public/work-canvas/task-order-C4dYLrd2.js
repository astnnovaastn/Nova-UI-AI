import { bt as e, gt as t, tt as n, vt as r } from "./index-client-DH73-vTM.js";
import { t as i } from "./runtime-Ci9kzAvr.js";
import { g as a } from "./TaskCheck-B3I-d4Tu.js";
// upstream/src/shared/i18n/messages/resource_pinned.js
var o = () => "Pinned", s = ((e = {}, t = {}) => (t.locale ?? i(), o(e))), c = (e) => `Deadline ${e?.date}`, l = ((e, t = {}) => (t.locale ?? i(), c(e))), u = () => "More actions", d = ((e = {}, t = {}) => (t.locale ?? i(), u(e)));
// upstream/src/shared/lib/visible-interval.ts
function f(e, t) {
	let n, r = () => {
		clearInterval(n), n = void 0, document.visibilityState !== "hidden" && (n = setInterval(t, e));
	}, i = () => {
		document.visibilityState === "visible" && t(), r();
	};
	return r(), document.addEventListener("visibilitychange", i), () => {
		clearInterval(n), document.removeEventListener("visibilitychange", i);
	};
}
// upstream/src/features/tasks/lib/today.svelte.ts
var p = e(t(a())), m, h = 0;
function g() {
	return n(p);
}
function _() {
	let e = a();
	return e !== n(p) && r(p, e, !0), h += 1, m ??= f(6e4, () => {
		let e = a();
		e !== n(p) && r(p, e, !0);
	}), () => {
		--h, h > 0 || m === void 0 || (m(), m = void 0);
	};
}
// upstream/src/shared/lib/pointer-drag.svelte.ts
var v = 4;
function y(i) {
	let a = i.threshold ?? v, o = e(null), s = e(t({
		x: 0,
		y: 0
	})), c = null, l = null, u = {
		x: 0,
		y: 0
	}, d = 0, f = !1;
	function p() {
		d !== 0 && (cancelAnimationFrame(d), d = 0), c = null, l = null, r(o, null);
	}
	function m(e) {
		let t = e.currentTarget;
		t instanceof HTMLElement && t.hasPointerCapture(e.pointerId) && t.releasePointerCapture(e.pointerId);
	}
	return {
		get item() {
			return n(o);
		},
		get at() {
			return n(s);
		},
		absorbClick() {
			return f ? (f = !1, !0) : !1;
		},
		begin(e, t) {
			e.button === 0 && (f = !1, c = {
				x: e.clientX,
				y: e.clientY
			}, l = t);
		},
		move(e) {
			if (c !== null && l !== null && !(n(o) === null && Math.abs(e.clientX - c.x) + Math.abs(e.clientY - c.y) <= a)) {
				if (n(o) === null) {
					let t = e.currentTarget;
					t instanceof HTMLElement && t.setPointerCapture(e.pointerId), r(o, l, !0);
				}
				u = {
					x: e.clientX,
					y: e.clientY
				}, d === 0 && (d = requestAnimationFrame(() => {
					d = 0, r(s, u, !0);
				}));
			}
		},
		end(e) {
			let t = n(o);
			m(e), p(), t !== null && (f = !0, i.ondrop(t, document.elementFromPoint(e.clientX, e.clientY), {
				x: e.clientX,
				y: e.clientY
			}));
		},
		cancel(e) {
			m(e), p();
		}
	};
}
// upstream/src/features/tasks/lib/task-order.ts
var b = 12, x = 65536, S = 1e9;
function C(e) {
	return String(Math.max(1, Math.round(e))).padStart(b, "0");
}
function w(e) {
	if (e === null || !/^\d{1,12}$/u.test(e)) return null;
	let t = Number(e);
	return Number.isSafeInteger(t) && t > 0 ? t : null;
}
function T(e, t) {
	let n = w(e), r = w(t);
	return n === null && r === null ? C(S) : n === null ? r > x ? C(r - x) : null : r === null ? C(n + x) : r - n < 2 ? null : C(Math.floor((n + r) / 2));
}
function E(e, t, n, r) {
	let i = e.filter((e) => e !== t);
	if (n === null || n === t) return {
		before: i.at(-1) ?? null,
		after: null
	};
	let a = i.indexOf(n);
	return a < 0 ? {
		before: i.at(-1) ?? null,
		after: null
	} : r ? {
		before: n,
		after: i[a + 1] ?? null
	} : {
		before: i[a - 1] ?? null,
		after: n
	};
}
function D(e, t) {
	let n = e.findIndex((e) => e.id === t);
	if (n < 0) return {};
	let r = e[n - 1], i = e[n + 1];
	if (!r || r.sortKey !== null) {
		let e = T(r?.sortKey ?? null, i?.sortKey ?? null);
		if (e !== null) return { [t]: e };
	}
	let a = {};
	return e.forEach((e, t) => {
		let n = C(S + t * x);
		e.sortKey !== n && (a[e.id] = n);
	}), a;
}
export { g as a, d as c, y as i, l, E as n, _ as o, D as r, f as s, T as t, s as u };
