import "./disclose-version-DFvUDwEH.js";
import { B as e, Et as t, F as n, H as r, J as i, K as a, M as o, Nt as s, Q as c, R as l, S as u, Tt as d, V as f, X as p, _t as m, ct as h, h as g, ht as _, it as v, lt as y, pt as b, q as x, r as S, ut as C, x as w } from "./index-client-oI5R0J23.js";
import { a as T, o as E } from "./link-media-CLTrXU4p.js";
import { t as D } from "./work_media_missing-Br-Z1leo.js";
import { t as O } from "./Mark-k2Ui4Fuu.js";
import { t as k } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_media_audio.js
var A = () => "Recording", j = ((e = {}, t = {}) => (t.locale ?? k(), A(e))), M = (e) => `Play ${e?.title}`, N = ((e, t = {}) => (t.locale ?? k(), M(e))), P = () => "YouTube video", F = ((e = {}, t = {}) => (t.locale ?? k(), P(e))), I = r("<img class=\"image svelte-1ndwtb5\" decoding=\"async\" loading=\"lazy\" draggable=\"false\"/>"), L = r("<div class=\"missing svelte-1ndwtb5\"> </div>"), R = r("<img alt=\"\" decoding=\"async\" loading=\"lazy\" draggable=\"false\" class=\"svelte-1ndwtb5\"/>"), z = r("<span class=\"length svelte-1ndwtb5\"> </span>"), B = r("<span class=\"channel svelte-1ndwtb5\"> </span>"), V = r("<figcaption class=\"svelte-1ndwtb5\"><!> <span class=\"words svelte-1ndwtb5\"><span> </span> <!></span></figcaption>"), H = r("<button type=\"button\"><!> <span class=\"play svelte-1ndwtb5\"><!></span> <!></button> <!>", 1), U = r("<span class=\"length-text svelte-1ndwtb5\"> </span>"), W = r("<span class=\"svelte-1ndwtb5\"></span>"), G = r("<div class=\"player svelte-1ndwtb5\"><button type=\"button\" class=\"round nodrag nopan svelte-1ndwtb5\"><!></button> <div class=\"words svelte-1ndwtb5\"><span class=\"title svelte-1ndwtb5\"> </span> <!></div> <span class=\"wave svelte-1ndwtb5\" aria-hidden=\"true\"></span></div>"), K = r("<figure><!></figure>");
function q(r, a) {
	t(a, !0);
	let k = S(a, "actions", 19, () => ({})), A = m(() => a.object.media === "video" && !!T(a.object.url)), M = m(() => a.object.poster ?? a.object.picture), P = _(null), q = m(() => !!c(M) && c(P) === c(M).src);
	var J = K(), Y = h(J), X = (t) => {
		var r = f(), o = y(r), u = (t) => {
			var n = I();
			v(() => {
				g(n, "src", c(M).src), g(n, "alt", a.object.title ?? ""), g(n, "width", c(M).width), g(n, "height", c(M).height);
			}), i("error", n, () => b(P, c(M)?.src ?? null, !0)), p(n), e(t, n);
		}, d = (t) => {
			var n = L(), r = h(n, !0);
			s(n), v((e) => l(r, e), [() => a.object.title ?? D()]), e(t, n);
		};
		n(o, (e) => {
			c(M) && !c(q) ? e(u) : e(d, -1);
		}), e(t, r);
	}, Z = (t) => {
		var r = H(), o = y(r);
		let d;
		var f = h(o), _ = (t) => {
			var n = R();
			v(() => {
				g(n, "src", c(M).src), g(n, "width", c(M).width), g(n, "height", c(M).height);
			}), i("error", n, () => b(P, c(M)?.src ?? null, !0)), p(n), e(t, n);
		};
		n(f, (e) => {
			c(M) && !c(q) && e(_);
		});
		var S = C(f, 2), w = h(S);
		{
			let e = m(() => c(A) ? 60 : 52);
			E(w, {
				get size() {
					return c(e);
				},
				get youtube() {
					return c(A);
				}
			});
		}
		s(S);
		var T = C(S, 2), D = (t) => {
			var n = z(), r = h(n, !0);
			s(n), v(() => l(r, a.object.duration)), e(t, n);
		};
		n(T, (e) => {
			a.object.duration && e(D);
		}), s(o);
		var j = C(o, 2), I = (t) => {
			var r = V(), i = h(r), o = (e) => {
				O(e, {
					address: "youtube.com",
					size: 16
				});
			};
			n(i, (e) => {
				c(A) && e(o);
			});
			var d = C(i, 2), f = h(d);
			let p;
			var m = h(f, !0);
			s(f);
			var g = C(f, 2), _ = (t) => {
				var n = B(), r = h(n, !0);
				s(n), v(() => l(r, a.object.channel)), e(t, n);
			};
			n(g, (e) => {
				a.object.title && a.object.channel && e(_);
			}), s(d), s(r), v((e) => {
				p = u(f, 1, "title svelte-1ndwtb5", null, p, {
					unnamed: !a.object.title,
					clamped: !!a.object.title
				}), l(m, e);
			}, [() => a.object.title || F()]), e(t, r);
		};
		n(j, (e) => {
			(a.object.title || c(A)) && e(I);
		}), v((e) => {
			d = u(o, 1, "screen nodrag nopan svelte-1ndwtb5", null, d, { bare: !c(M) || c(q) }), g(o, "aria-label", e);
		}, [() => N({ title: a.object.title || (c(A) ? F() : "") })]), x("click", o, () => k().link?.(a.object.url)), e(t, r);
	}, Q = (t) => {
		var r = G(), i = h(r), c = h(i);
		E(c, { size: 36 }), s(i);
		var u = C(i, 2), d = h(u), f = h(d, !0);
		s(d);
		var p = C(d, 2), m = (t) => {
			var n = U(), r = h(n, !0);
			s(n), v(() => l(r, a.object.duration)), e(t, n);
		};
		n(p, (e) => {
			a.object.duration && e(m);
		}), s(u);
		var _ = C(u, 2);
		o(_, 20, () => Array.from({ length: 28 }, (e, t) => t), (e) => e, (t, n) => {
			var r = W();
			let i;
			v(() => i = w(r, "", i, { "block-size": `${30 + n * 37 % 70}%` })), e(t, r);
		}), s(_), s(r), v((e, t) => {
			g(i, "aria-label", e), l(f, t);
		}, [() => N({ title: a.object.title ?? "" }), () => a.object.title ?? j()]), x("click", i, () => k().link?.(a.object.url)), e(t, r);
	};
	n(Y, (e) => {
		a.object.media === "image" ? e(X) : a.object.media === "video" ? e(Z, 1) : e(Q, -1);
	}), s(J), v(() => {
		u(J, 1, `media ${a.object.media ?? ""}`, "svelte-1ndwtb5"), g(J, "aria-label", a.object.title);
	}), e(r, J), d();
}
a(["click"]);
export { q as default };
