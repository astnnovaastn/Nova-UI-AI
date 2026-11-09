import "./disclose-version-DFvUDwEH.js";
import { At as e, C as t, Ct as n, F as r, G as i, L as a, M as o, R as s, St as c, Y as l, at as u, ft as d, j as f, m as p, mt as m, ot as h, q as g, r as _, st as v, tt as y, ut as b, y as x, z as S } from "./index-client-BSGo5gVb.js";
import { t as C } from "./HostGlyph-BX4wqFXI.js";
import { t as ee } from "./frame-thumbs-DqxfUL66.js";
// src/preview-provider.ts
function w(e) {
	return {
		name: "saved-data",
		previewFor: (t) => e.get(t) ?? null
	};
}
var T = w(/* @__PURE__ */ new Map());
function E(e) {
	T = e;
}
function D(e) {
	return T.previewFor(e);
}
// upstream/src/features/work/components/run/PageFace.svelte
var O = S("<img class=\"favicon svelte-s25qh4\" alt=\"\" width=\"14\" height=\"14\" loading=\"lazy\" referrerpolicy=\"no-referrer\" crossorigin=\"anonymous\"/>"), k = S("<span class=\"arrived svelte-s25qh4\" aria-hidden=\"true\"></span>"), A = S("<span class=\"caption svelte-s25qh4\"> </span>"), j = S("<canvas class=\"thumb svelte-s25qh4\"></canvas> <!>", 1), M = S("<span class=\"excerpt svelte-s25qh4\"> </span>"), N = S("<span class=\"face svelte-s25qh4\"><span class=\"sign svelte-s25qh4\"><!></span> <span class=\"words svelte-s25qh4\"> </span> <!></span>"), P = S("<span><span class=\"bar svelte-s25qh4\"><span class=\"mark svelte-s25qh4\"><!></span> <span class=\"host svelte-s25qh4\"> </span> <span class=\"heading svelte-s25qh4\"> </span> <!></span> <span class=\"view svelte-s25qh4\"><!></span></span>");
function F(S, w) {
	n(w, !0);
	let T = _(w, "host", 3, ""), E = _(w, "live", 3, !1), F = _(w, "still", 3, !1), I = d(null), L = m(() => !!w.frame && l(I) !== w.frame), R = m(() => D(w.url)), z = m(() => {
		try {
			return new URL(w.url).hostname.replace(/^www\./u, "");
		} catch {
			return T().replace(/^www\./u, "");
		}
	}), B = m(() => {
		let e = w.title.split(/\s+[|·–—-]\s+/u).map((e) => e.trim()).filter(Boolean);
		return e.length > 1 ? e.slice(0, -1).join(" – ") : w.title.trim();
	});
	var V = P();
	let H;
	var U = u(V), W = u(U), G = u(W), K = (e) => {
		var t = O();
		y(() => p(t, "src", l(R).favicon)), i("error", t, (e) => e.currentTarget.style.visibility = "hidden"), g(t), a(e, t);
	}, q = (e) => {
		C(e, {
			get host() {
				return T();
			},
			get url() {
				return w.url;
			},
			size: 14,
			initial: !1
		});
	};
	o(G, (e) => {
		l(R)?.favicon ? e(K) : e(q, -1);
	}), e(W);
	var J = v(W, 2), Y = u(J, !0);
	e(J);
	var X = v(J, 2), Z = u(X, !0);
	e(X);
	var Q = v(X, 2), te = (e) => {
		var t = s(), n = h(t);
		f(n, () => w.frame, (e) => {
			var t = k();
			a(e, t);
		}), a(e, t);
	};
	o(Q, (e) => {
		E() && !F() && e(te);
	}), e(U);
	var $ = v(U, 2), ne = u($), re = (n) => {
		var i = j(), s = h(i);
		t(s, (e, t) => ee?.(e, t), () => ({
			url: w.frame,
			width: 360,
			onmissing: () => b(I, w.frame, !0)
		}));
		var c = v(s, 2), d = (t) => {
			var n = A(), i = u(n, !0);
			e(n), y(() => r(i, l(R).excerpt)), a(t, n);
		};
		o(c, (e) => {
			l(R)?.excerpt && e(d);
		}), a(n, i);
	}, ie = (t) => {
		var n = N(), i = u(n), s = u(i);
		C(s, {
			get host() {
				return T();
			},
			get url() {
				return w.url;
			},
			size: 28,
			initial: !1
		}), e(i);
		var c = v(i, 2), d = u(c, !0);
		e(c);
		var f = v(c, 2), p = (t) => {
			var n = M(), i = u(n, !0);
			e(n), y(() => r(i, l(R).excerpt)), a(t, n);
		};
		o(f, (e) => {
			l(R)?.excerpt && e(p);
		}), e(n), y(() => r(d, l(B) || l(z))), a(t, n);
	};
	o(ne, (e) => {
		l(L) ? e(re) : e(ie, -1);
	}), e($), e(V), y(() => {
		H = x(V, 1, "window svelte-s25qh4", null, H, {
			live: E(),
			still: F()
		}), r(Y, l(z)), r(Z, l(B));
	}), a(S, V), c();
}
export { E as n, w as r, F as t };
