import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, E as r, F as i, Ft as a, H as o, J as s, Ot as c, P as l, R as u, S as d, V as f, X as p, _t as m, dt as h, ft as g, h as _, ht as v, ot as y, r as b, ut as x, xt as S, yt as C } from "./index-client-C_2wYFnt.js";
import { t as w } from "./HostGlyph-D7LkZa-a.js";
import { t as T } from "./frame-thumbs-ML8-cPjB.js";
import "./index-client-RfUBbaI1.js";
// src/preview-provider.ts
function E(e) {
	return {
		name: "saved-data",
		previewFor: (t) => e.get(t) ?? null
	};
}
var D = E(/* @__PURE__ */ new Map()), O = /* @__PURE__ */ new Map(), k, A = S((e) => (k = e, () => {
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
var P = o("<img class=\"favicon svelte-s25qh4\" alt=\"\" width=\"14\" height=\"14\" loading=\"lazy\" referrerpolicy=\"no-referrer\" crossorigin=\"anonymous\"/>"), F = o("<span class=\"arrived svelte-s25qh4\" aria-hidden=\"true\"></span>"), I = o("<span class=\"caption svelte-s25qh4\"> </span>"), L = o("<img class=\"website-thumb svelte-s25qh4\" alt=\"\" loading=\"lazy\" decoding=\"async\"/> <span class=\"preview-label svelte-s25qh4\">Webpage preview</span> <!>", 1), R = o("<canvas class=\"thumb svelte-s25qh4\"></canvas> <!>", 1), z = o("<span class=\"excerpt svelte-s25qh4\"> </span>"), ee = o("<span class=\"face svelte-s25qh4\"><span class=\"sign svelte-s25qh4\"><!></span> <span class=\"words svelte-s25qh4\"> </span> <!></span>"), B = o("<span><span class=\"bar svelte-s25qh4\"><span class=\"mark svelte-s25qh4\"><!></span> <span class=\"host svelte-s25qh4\"> </span> <span class=\"heading svelte-s25qh4\"> </span> <!></span> <span class=\"view svelte-s25qh4\"><!></span></span>");
function V(o, S) {
	c(S, !0);
	let E = b(S, "host", 3, ""), D = b(S, "live", 3, !1), O = b(S, "still", 3, !1), k = b(S, "compact", 3, !1), A = m(null), j = C(() => !!S.frame && e(A) !== S.frame), N = C(() => M(S.url)), V = C(() => {
		try {
			return new URL(S.url).hostname.replace(/^www\./u, "");
		} catch {
			return E().replace(/^www\./u, "");
		}
	}), H = C(() => {
		let e = S.title.split(/\s+[|·–—-]\s+/u).map((e) => e.trim()).filter(Boolean);
		return e.length > 1 ? e.slice(0, -1).join(" – ") : S.title.trim();
	});
	var U = B();
	let W;
	var G = x(U), K = x(G), q = x(K), J = (n) => {
		var r = P();
		y(() => _(r, "src", e(N).favicon)), s("error", r, (e) => e.currentTarget.style.visibility = "hidden"), p(r), t(n, r);
	}, Y = (e) => {
		w(e, {
			get host() {
				return E();
			},
			get url() {
				return S.url;
			},
			size: 14,
			initial: !1
		});
	};
	i(q, (t) => {
		e(N)?.favicon ? t(J) : t(Y, -1);
	}), a(K);
	var X = g(K, 2), Z = x(X, !0);
	a(X);
	var Q = g(X, 2), te = x(Q, !0);
	a(Q);
	var ne = g(Q, 2), re = (e) => {
		var n = f(), r = h(n);
		l(r, () => S.frame, (e) => {
			var n = F();
			t(e, n);
		}), t(e, n);
	};
	i(ne, (e) => {
		D() && !O() && e(re);
	}), a(G);
	var $ = g(G, 2), ie = x($), ae = (n) => {
		var r = L(), o = h(r), s = g(o, 2), c = g(s, 2), l = (n) => {
			var r = I(), i = x(r, !0);
			a(r), y(() => u(i, e(N).excerpt)), t(n, r);
		};
		i(c, (t) => {
			e(N).excerpt && t(l);
		}), y((t) => {
			_(o, "src", e(N).thumbnail), _(s, "title", t);
		}, [() => e(N).capturedAt ? (/* @__PURE__ */ new Date(e(N).capturedAt * 1e3)).toLocaleString() : void 0]), t(n, r);
	}, oe = (n) => {
		var o = R(), s = h(o);
		r(s, (e, t) => T?.(e, t), () => ({
			url: S.frame,
			width: 360,
			onmissing: () => v(A, S.frame, !0)
		}));
		var c = g(s, 2), l = (n) => {
			var r = I(), i = x(r, !0);
			a(r), y(() => u(i, e(N).excerpt)), t(n, r);
		};
		i(c, (t) => {
			e(N)?.excerpt && t(l);
		}), t(n, o);
	}, se = (n) => {
		var r = ee(), o = x(r), s = x(o);
		w(s, {
			get host() {
				return E();
			},
			get url() {
				return S.url;
			},
			size: 28,
			initial: !1
		}), a(o);
		var c = g(o, 2), l = x(c, !0);
		a(c);
		var d = g(c, 2), f = (n) => {
			var r = z(), i = x(r, !0);
			a(r), y(() => u(i, e(N).excerpt)), t(n, r);
		};
		i(d, (t) => {
			e(N)?.excerpt && t(f);
		}), a(r), y(() => u(l, e(H) || e(V))), t(n, r);
	};
	i(ie, (t) => {
		e(N)?.thumbnail ? t(ae) : e(j) ? t(oe, 1) : t(se, -1);
	}), a($), a(U), y((t) => {
		W = d(U, 1, "window svelte-s25qh4", null, W, {
			live: D(),
			still: O(),
			compact: k()
		}), _(U, "title", t), u(Z, e(V)), u(te, e(H));
	}, [() => [
		S.title,
		S.url,
		e(N)?.retrieval ? "Retrieval: " + e(N).retrieval : "",
		e(N)?.citations ? `${e(N).citations} citation(s)` : ""
	].filter(Boolean).join("\n")]), t(o, U), n();
}
export { N as i, j as n, E as r, V as t };
