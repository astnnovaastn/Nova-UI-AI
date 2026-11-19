import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, E as n, H as r, I as i, L as a, Mt as o, Q as s, S as c, Tt as l, U as u, W as d, X as f, bt as p, h as m, ht as h, jt as g, lt as _, mt as v, pt as y, r as b, tt as x, vt as S, zt as C } from "./index-client-DH73-vTM.js";
import { t as w } from "./HostGlyph-CXcYKorm.js";
import { t as T } from "./frame-thumbs-Nfr7pZR2.js";
import "./index-client-AzfegT-i.js";
// src/preview-provider.ts
function E(e) {
	return {
		name: "saved-data",
		previewFor: (t) => e.get(t) ?? null
	};
}
var D = E(/* @__PURE__ */ new Map()), O = /* @__PURE__ */ new Map(), k, A = l((e) => (k = e, () => {
	k = void 0;
}));
function j(e) {
	D = e, k?.();
}
function M(e) {
	A();
	let t = D.previewFor(e);
	return t ? {
		...t,
		...O.get(e)
	} : null;
}
function N(e, t, n, r) {
	let i = new AbortController(), a = {
		headers: r,
		signal: i.signal
	}, o = "/api/research/" + encodeURIComponent(e) + "/source-previews", s = t ? "?revision=" + encodeURIComponent(t) : "", c = /* @__PURE__ */ new Map(), l;
	async function u() {
		try {
			let e = await fetch(o + s, a);
			if (!e.ok) return;
			let t = (await e.json()).previews.filter((e) => n.has(e.url)), r = t.filter((e) => e.status === "ready" && !c.has(e.url));
			for (let e = 0; e < r.length; e += 4) {
				if (await Promise.all(r.slice(e, e + 4).map(async (e) => {
					try {
						let t = await fetch(o + "/" + e.id + s, a);
						if (!t.ok) return;
						let n = await t.blob();
						if (i.signal.aborted) return;
						c.set(e.url, {
							thumbnail: URL.createObjectURL(n),
							capturedAt: e.captured_at ?? 0
						});
					} catch {}
				})), i.signal.aborted) return;
				O = c, k?.();
			}
			t.some((e) => e.status === "pending") && !i.signal.aborted && (l = setTimeout(() => void u(), 3500));
		} catch {}
	}
	return u(), () => {
		i.abort(), clearTimeout(l);
		for (let e of c.values()) URL.revokeObjectURL(e.thumbnail);
		O === c && (O = /* @__PURE__ */ new Map(), k?.());
	};
}
// upstream/src/features/work/components/run/PageFace.svelte
var P = d("<img class=\"favicon svelte-s25qh4\" alt=\"\" width=\"14\" height=\"14\" loading=\"lazy\" referrerpolicy=\"no-referrer\" crossorigin=\"anonymous\"/>"), F = d("<span class=\"arrived svelte-s25qh4\" aria-hidden=\"true\"></span>"), I = d("<span class=\"caption svelte-s25qh4\"> </span>"), L = d("<img class=\"website-thumb svelte-s25qh4\" alt=\"\" loading=\"lazy\" decoding=\"async\"/> <span class=\"preview-label svelte-s25qh4\">Webpage preview</span> <!>", 1), ee = d("<canvas class=\"thumb svelte-s25qh4\"></canvas> <!>", 1), R = d("<span class=\"excerpt svelte-s25qh4\"> </span>"), z = d("<span class=\"face svelte-s25qh4\"><span class=\"sign svelte-s25qh4\"><!></span> <span class=\"words svelte-s25qh4\"> </span> <!></span>"), B = d("<span><span class=\"bar svelte-s25qh4\"><span class=\"mark svelte-s25qh4\"><!></span> <span class=\"host svelte-s25qh4\"> </span> <span class=\"heading svelte-s25qh4\"> </span> <!></span> <span class=\"view svelte-s25qh4\"><!></span></span>");
function V(l, d) {
	o(d, !0);
	let E = b(d, "host", 3, ""), D = b(d, "live", 3, !1), O = b(d, "still", 3, !1), k = b(d, "compact", 3, !1), A = p(null), j = t(() => !!d.frame && x(A) !== d.frame), N = t(() => M(d.url)), V = t(() => {
		try {
			return new URL(d.url).hostname.replace(/^www\./u, "");
		} catch {
			return E().replace(/^www\./u, "");
		}
	}), H = t(() => {
		let e = d.title.split(/\s+[|·–—-]\s+/u).map((e) => e.trim()).filter(Boolean);
		return e.length > 1 ? e.slice(0, -1).join(" – ") : d.title.trim();
	});
	var U = B();
	let W;
	var G = y(U), K = y(G), q = y(K), J = (e) => {
		var t = P();
		_(() => m(t, "src", x(N).favicon)), f("error", t, (e) => e.currentTarget.style.visibility = "hidden"), s(t), r(e, t);
	}, Y = (e) => {
		w(e, {
			get host() {
				return E();
			},
			get url() {
				return d.url;
			},
			size: 14,
			initial: !1
		});
	};
	a(q, (e) => {
		x(N)?.favicon ? e(J) : e(Y, -1);
	}), C(K);
	var X = h(K, 2), Z = y(X, !0);
	C(X);
	var Q = h(X, 2), te = y(Q, !0);
	C(Q);
	var ne = h(Q, 2), re = (e) => {
		var t = u(), n = v(t);
		i(n, () => d.frame, (e) => {
			var t = F();
			r(e, t);
		}), r(e, t);
	};
	a(ne, (e) => {
		D() && !O() && e(re);
	}), C(G);
	var $ = h(G, 2), ie = y($), ae = (t) => {
		var n = L(), i = v(n), o = h(i, 2), s = h(o, 2), c = (t) => {
			var n = I(), i = y(n, !0);
			C(n), _(() => e(i, x(N).excerpt)), r(t, n);
		};
		a(s, (e) => {
			x(N).excerpt && e(c);
		}), _((e) => {
			m(i, "src", x(N).thumbnail), m(o, "title", e);
		}, [() => x(N).capturedAt ? (/* @__PURE__ */ new Date(x(N).capturedAt * 1e3)).toLocaleString() : void 0]), r(t, n);
	}, oe = (t) => {
		var i = ee(), o = v(i);
		n(o, (e, t) => T?.(e, t), () => ({
			url: d.frame,
			width: 360,
			onmissing: () => S(A, d.frame, !0)
		}));
		var s = h(o, 2), c = (t) => {
			var n = I(), i = y(n, !0);
			C(n), _(() => e(i, x(N).excerpt)), r(t, n);
		};
		a(s, (e) => {
			x(N)?.excerpt && e(c);
		}), r(t, i);
	}, se = (t) => {
		var n = z(), i = y(n), o = y(i);
		w(o, {
			get host() {
				return E();
			},
			get url() {
				return d.url;
			},
			size: 28,
			initial: !1
		}), C(i);
		var s = h(i, 2), c = y(s, !0);
		C(s);
		var l = h(s, 2), u = (t) => {
			var n = R(), i = y(n, !0);
			C(n), _(() => e(i, x(N).excerpt)), r(t, n);
		};
		a(l, (e) => {
			x(N)?.excerpt && e(u);
		}), C(n), _(() => e(c, x(H) || x(V))), r(t, n);
	};
	a(ie, (e) => {
		x(N)?.thumbnail ? e(ae) : x(j) ? e(oe, 1) : e(se, -1);
	}), C($), C(U), _((t) => {
		W = c(U, 1, "window svelte-s25qh4", null, W, {
			live: D(),
			still: O(),
			compact: k()
		}), m(U, "title", t), e(Z, x(V)), e(te, x(H));
	}, [() => [
		d.title,
		d.url,
		x(N)?.retrieval ? "Retrieval: " + x(N).retrieval : "",
		x(N)?.citations ? `${x(N).citations} citation(s)` : ""
	].filter(Boolean).join("\n")]), r(l, U), g();
}
export { N as i, j as n, E as r, V as t };
