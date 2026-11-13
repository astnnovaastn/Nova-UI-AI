import "./disclose-version-DFvUDwEH.js";
import { B as e, E as t, Et as n, F as r, H as i, J as a, Nt as o, P as s, Q as c, R as l, S as u, Tt as d, V as f, X as p, _t as m, ct as h, h as g, ht as _, it as v, lt as y, pt as b, r as x, ut as S } from "./index-client-oI5R0J23.js";
import { t as C } from "./HostGlyph-C4fKhFEj.js";
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
var O = i("<img class=\"favicon svelte-s25qh4\" alt=\"\" width=\"14\" height=\"14\" loading=\"lazy\" referrerpolicy=\"no-referrer\" crossorigin=\"anonymous\"/>"), k = i("<span class=\"arrived svelte-s25qh4\" aria-hidden=\"true\"></span>"), A = i("<span class=\"caption svelte-s25qh4\"> </span>"), j = i("<canvas class=\"thumb svelte-s25qh4\"></canvas> <!>", 1), M = i("<span class=\"excerpt svelte-s25qh4\"> </span>"), N = i("<span class=\"face svelte-s25qh4\"><span class=\"sign svelte-s25qh4\"><!></span> <span class=\"words svelte-s25qh4\"> </span> <!></span>"), te = i("<span><span class=\"bar svelte-s25qh4\"><span class=\"mark svelte-s25qh4\"><!></span> <span class=\"host svelte-s25qh4\"> </span> <span class=\"heading svelte-s25qh4\"> </span> <!></span> <span class=\"view svelte-s25qh4\"><!></span></span>");
function P(i, w) {
	n(w, !0);
	let T = x(w, "host", 3, ""), E = x(w, "live", 3, !1), P = x(w, "still", 3, !1), F = _(null), I = m(() => !!w.frame && c(F) !== w.frame), L = m(() => D(w.url)), R = m(() => {
		try {
			return new URL(w.url).hostname.replace(/^www\./u, "");
		} catch {
			return T().replace(/^www\./u, "");
		}
	}), z = m(() => {
		let e = w.title.split(/\s+[|·–—-]\s+/u).map((e) => e.trim()).filter(Boolean);
		return e.length > 1 ? e.slice(0, -1).join(" – ") : w.title.trim();
	});
	var B = te();
	let V;
	var H = h(B), U = h(H), W = h(U), G = (t) => {
		var n = O();
		v(() => g(n, "src", c(L).favicon)), a("error", n, (e) => e.currentTarget.style.visibility = "hidden"), p(n), e(t, n);
	}, K = (e) => {
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
	r(W, (e) => {
		c(L)?.favicon ? e(G) : e(K, -1);
	}), o(U);
	var q = S(U, 2), J = h(q, !0);
	o(q);
	var Y = S(q, 2), X = h(Y, !0);
	o(Y);
	var Z = S(Y, 2), Q = (t) => {
		var n = f(), r = y(n);
		s(r, () => w.frame, (t) => {
			var n = k();
			e(t, n);
		}), e(t, n);
	};
	r(Z, (e) => {
		E() && !P() && e(Q);
	}), o(H);
	var $ = S(H, 2), ne = h($), re = (n) => {
		var i = j(), a = y(i);
		t(a, (e, t) => ee?.(e, t), () => ({
			url: w.frame,
			width: 360,
			onmissing: () => b(F, w.frame, !0)
		}));
		var s = S(a, 2), u = (t) => {
			var n = A(), r = h(n, !0);
			o(n), v(() => l(r, c(L).excerpt)), e(t, n);
		};
		r(s, (e) => {
			c(L)?.excerpt && e(u);
		}), e(n, i);
	}, ie = (t) => {
		var n = N(), i = h(n), a = h(i);
		C(a, {
			get host() {
				return T();
			},
			get url() {
				return w.url;
			},
			size: 28,
			initial: !1
		}), o(i);
		var s = S(i, 2), u = h(s, !0);
		o(s);
		var d = S(s, 2), f = (t) => {
			var n = M(), r = h(n, !0);
			o(n), v(() => l(r, c(L).excerpt)), e(t, n);
		};
		r(d, (e) => {
			c(L)?.excerpt && e(f);
		}), o(n), v(() => l(u, c(z) || c(R))), e(t, n);
	};
	r(ne, (e) => {
		c(I) ? e(re) : e(ie, -1);
	}), o($), o(B), v(() => {
		V = u(B, 1, "window svelte-s25qh4", null, V, {
			live: E(),
			still: P()
		}), l(J, c(R)), l(X, c(z));
	}), e(i, B), d();
}
export { E as n, w as r, P as t };
