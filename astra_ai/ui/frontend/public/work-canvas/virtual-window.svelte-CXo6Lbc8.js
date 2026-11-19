import { Ct as e, bt as t, tt as n, vt as r } from "./index-client-DH73-vTM.js";
// upstream/src/shared/lib/virtual-window.svelte.ts
var i = 8, a = 200;
function o(e) {
	let t = Array(e.length + 1), n = 0;
	for (let r = 0; r < e.length; r += 1) t[r] = n, n += e[r] ?? 0;
	return t[e.length] = n, t;
}
function s(e) {
	return e.length ? e[e.length - 1] ?? 0 : 0;
}
function c(e, t) {
	let n = 0, r = e.length - 2;
	for (; n < r;) {
		let i = n + r + 1 >> 1;
		(e[i] ?? 0) <= t ? n = i : r = i - 1;
	}
	return Math.max(0, n);
}
function l(e, t, n, r = i) {
	let a = Math.max(0, e.length - 1);
	if (a === 0) return {
		first: 0,
		last: 0,
		before: 0,
		after: 0
	};
	let o = Math.max(0, t), l = Math.max(0, c(e, o) - r), u = Math.min(a, c(e, o + n) + 1 + r);
	return {
		first: l,
		last: u,
		before: e[l] ?? 0,
		after: s(e) - (e[u] ?? 0)
	};
}
function u(i) {
	let s = i.threshold ?? a, c = t(void 0), u = t(0), d = t(0), f = e(() => i.heights()), p = e(() => n(f).length > s), m = e(() => n(p) ? o(n(f)) : []), h = e(() => n(p) ? l(n(m), n(u), n(d), i.overscan) : {
		first: 0,
		last: n(f).length,
		before: 0,
		after: 0
	});
	return {
		attach(e) {
			r(c, e, !0), r(d, e.clientHeight, !0), r(u, e.scrollTop, !0);
			let t = new ResizeObserver(() => {
				r(d, e.clientHeight, !0);
			});
			t.observe(e);
			let n = () => {
				r(u, e.scrollTop, !0);
			};
			return e.addEventListener("scroll", n, { passive: !0 }), { destroy() {
				t.disconnect(), e.removeEventListener("scroll", n), r(c, void 0);
			} };
		},
		get active() {
			return n(p);
		},
		get window() {
			return n(h);
		},
		scrollToIndex(e) {
			if (!n(c)) return;
			if (!n(p)) {
				n(c).querySelector(`[data-virtual-index="${e}"]`)?.scrollIntoView({ block: "nearest" });
				return;
			}
			let t = n(m)[e] ?? 0, r = n(m)[e + 1] ?? t, i = n(c).scrollTop;
			t < i ? n(c).scrollTop = t : r > i + n(d) && (n(c).scrollTop = r - n(d));
		}
	};
}
export { u as t };
