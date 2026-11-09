import "./disclose-version-DFvUDwEH.js";
import { At as e, Ct as t, F as n, G as r, L as i, M as a, R as o, St as s, U as c, W as l, Y as u, at as d, ft as f, k as p, m, mt as h, ot as g, q as _, r as v, st as y, tt as b, ut as x, v as S, y as C, z as w } from "./index-client-BSGo5gVb.js";
import { a as T, o as E } from "./link-media-2GFJlIGx.js";
import { t as D } from "./work_media_missing-Br-Z1leo.js";
import { t as O } from "./Mark-DBYTxnH7.js";
import { t as k } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_media_audio.js
var A = () => "Recording", j = ((e = {}, t = {}) => (t.locale ?? k(), A(e))), M = (e) => `Play ${e?.title}`, N = ((e, t = {}) => (t.locale ?? k(), M(e))), P = () => "YouTube video", F = ((e = {}, t = {}) => (t.locale ?? k(), P(e))), I = w("<img class=\"image svelte-1ndwtb5\" decoding=\"async\" loading=\"lazy\" draggable=\"false\"/>"), L = w("<div class=\"missing svelte-1ndwtb5\"> </div>"), R = w("<img alt=\"\" decoding=\"async\" loading=\"lazy\" draggable=\"false\" class=\"svelte-1ndwtb5\"/>"), z = w("<span class=\"length svelte-1ndwtb5\"> </span>"), B = w("<span class=\"channel svelte-1ndwtb5\"> </span>"), V = w("<figcaption class=\"svelte-1ndwtb5\"><!> <span class=\"words svelte-1ndwtb5\"><span> </span> <!></span></figcaption>"), H = w("<button type=\"button\"><!> <span class=\"play svelte-1ndwtb5\"><!></span> <!></button> <!>", 1), U = w("<span class=\"length-text svelte-1ndwtb5\"> </span>"), W = w("<span class=\"svelte-1ndwtb5\"></span>"), G = w("<div class=\"player svelte-1ndwtb5\"><button type=\"button\" class=\"round nodrag nopan svelte-1ndwtb5\"><!></button> <div class=\"words svelte-1ndwtb5\"><span class=\"title svelte-1ndwtb5\"> </span> <!></div> <span class=\"wave svelte-1ndwtb5\" aria-hidden=\"true\"></span></div>"), K = w("<figure><!></figure>");
function q(c, w) {
	t(w, !0);
	let k = v(w, "actions", 19, () => ({})), A = h(() => w.object.media === "video" && !!T(w.object.url)), M = h(() => w.object.poster ?? w.object.picture), P = f(null), q = h(() => !!u(M) && u(P) === u(M).src);
	var J = K(), Y = d(J), X = (t) => {
		var s = o(), c = g(s), l = (e) => {
			var t = I();
			b(() => {
				m(t, "src", u(M).src), m(t, "alt", w.object.title ?? ""), m(t, "width", u(M).width), m(t, "height", u(M).height);
			}), r("error", t, () => x(P, u(M)?.src ?? null, !0)), _(t), i(e, t);
		}, f = (t) => {
			var r = L(), a = d(r, !0);
			e(r), b((e) => n(a, e), [() => w.object.title ?? D()]), i(t, r);
		};
		a(c, (e) => {
			u(M) && !u(q) ? e(l) : e(f, -1);
		}), i(t, s);
	}, Z = (t) => {
		var o = H(), s = g(o);
		let c;
		var f = d(s), p = (e) => {
			var t = R();
			b(() => {
				m(t, "src", u(M).src), m(t, "width", u(M).width), m(t, "height", u(M).height);
			}), r("error", t, () => x(P, u(M)?.src ?? null, !0)), _(t), i(e, t);
		};
		a(f, (e) => {
			u(M) && !u(q) && e(p);
		});
		var v = y(f, 2), S = d(v);
		{
			let e = h(() => u(A) ? 60 : 52);
			E(S, {
				get size() {
					return u(e);
				},
				get youtube() {
					return u(A);
				}
			});
		}
		e(v);
		var T = y(v, 2), D = (t) => {
			var r = z(), a = d(r, !0);
			e(r), b(() => n(a, w.object.duration)), i(t, r);
		};
		a(T, (e) => {
			w.object.duration && e(D);
		}), e(s);
		var j = y(s, 2), I = (t) => {
			var r = V(), o = d(r), s = (e) => {
				O(e, {
					address: "youtube.com",
					size: 16
				});
			};
			a(o, (e) => {
				u(A) && e(s);
			});
			var c = y(o, 2), l = d(c);
			let f;
			var p = d(l, !0);
			e(l);
			var m = y(l, 2), h = (t) => {
				var r = B(), a = d(r, !0);
				e(r), b(() => n(a, w.object.channel)), i(t, r);
			};
			a(m, (e) => {
				w.object.title && w.object.channel && e(h);
			}), e(c), e(r), b((e) => {
				f = C(l, 1, "title svelte-1ndwtb5", null, f, {
					unnamed: !w.object.title,
					clamped: !!w.object.title
				}), n(p, e);
			}, [() => w.object.title || F()]), i(t, r);
		};
		a(j, (e) => {
			(w.object.title || u(A)) && e(I);
		}), b((e) => {
			c = C(s, 1, "screen nodrag nopan svelte-1ndwtb5", null, c, { bare: !u(M) || u(q) }), m(s, "aria-label", e);
		}, [() => N({ title: w.object.title || (u(A) ? F() : "") })]), l("click", s, () => k().link?.(w.object.url)), i(t, o);
	}, Q = (t) => {
		var r = G(), o = d(r), s = d(o);
		E(s, { size: 36 }), e(o);
		var c = y(o, 2), u = d(c), f = d(u, !0);
		e(u);
		var h = y(u, 2), g = (t) => {
			var r = U(), a = d(r, !0);
			e(r), b(() => n(a, w.object.duration)), i(t, r);
		};
		a(h, (e) => {
			w.object.duration && e(g);
		}), e(c);
		var _ = y(c, 2);
		p(_, 20, () => Array.from({ length: 28 }, (e, t) => t), (e) => e, (e, t) => {
			var n = W();
			let r;
			b(() => r = S(n, "", r, { "block-size": `${30 + t * 37 % 70}%` })), i(e, n);
		}), e(_), e(r), b((e, t) => {
			m(o, "aria-label", e), n(f, t);
		}, [() => N({ title: w.object.title ?? "" }), () => w.object.title ?? j()]), l("click", o, () => k().link?.(w.object.url)), i(t, r);
	};
	a(Y, (e) => {
		w.object.media === "image" ? e(X) : w.object.media === "video" ? e(Z, 1) : e(Q, -1);
	}), e(J), b(() => {
		C(J, 1, `media ${w.object.media ?? ""}`, "svelte-1ndwtb5"), m(J, "aria-label", w.object.title);
	}), i(c, J), s();
}
c(["click"]);
export { q as default };
