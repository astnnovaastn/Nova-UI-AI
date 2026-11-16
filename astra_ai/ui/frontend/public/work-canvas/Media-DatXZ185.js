import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, F as r, Ft as i, H as a, J as o, K as s, M as c, Ot as l, R as u, S as d, V as f, X as p, _t as m, dt as h, ft as g, h as _, ht as v, ot as y, q as b, r as x, ut as S, x as C, yt as w } from "./index-client-C_2wYFnt.js";
import { a as T, o as E } from "./link-media-qN432bcy.js";
import { t as D } from "./work_media_missing-Br-Z1leo.js";
import { t as O } from "./Mark-BTIzBHOo.js";
import { t as k } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_media_audio.js
var A = () => "Recording", j = ((e = {}, t = {}) => (t.locale ?? k(), A(e))), M = (e) => `Play ${e?.title}`, N = ((e, t = {}) => (t.locale ?? k(), M(e))), P = () => "YouTube video", F = ((e = {}, t = {}) => (t.locale ?? k(), P(e))), I = a("<img class=\"image svelte-1ndwtb5\" decoding=\"async\" loading=\"lazy\" draggable=\"false\"/>"), L = a("<div class=\"missing svelte-1ndwtb5\"> </div>"), R = a("<img alt=\"\" decoding=\"async\" loading=\"lazy\" draggable=\"false\" class=\"svelte-1ndwtb5\"/>"), z = a("<span class=\"length svelte-1ndwtb5\"> </span>"), B = a("<span class=\"channel svelte-1ndwtb5\"> </span>"), V = a("<figcaption class=\"svelte-1ndwtb5\"><!> <span class=\"words svelte-1ndwtb5\"><span> </span> <!></span></figcaption>"), H = a("<button type=\"button\"><!> <span class=\"play svelte-1ndwtb5\"><!></span> <!></button> <!>", 1), U = a("<span class=\"length-text svelte-1ndwtb5\"> </span>"), W = a("<span class=\"svelte-1ndwtb5\"></span>"), G = a("<div class=\"player svelte-1ndwtb5\"><button type=\"button\" class=\"round nodrag nopan svelte-1ndwtb5\"><!></button> <div class=\"words svelte-1ndwtb5\"><span class=\"title svelte-1ndwtb5\"> </span> <!></div> <span class=\"wave svelte-1ndwtb5\" aria-hidden=\"true\"></span></div>"), K = a("<figure><!></figure>");
function q(a, s) {
	l(s, !0);
	let k = x(s, "actions", 19, () => ({})), A = w(() => s.object.media === "video" && !!T(s.object.url)), M = w(() => s.object.poster ?? s.object.picture), P = m(null), q = w(() => !!e(M) && e(P) === e(M).src);
	var J = K(), Y = S(J), X = (n) => {
		var a = f(), c = h(a), l = (n) => {
			var r = I();
			y(() => {
				_(r, "src", e(M).src), _(r, "alt", s.object.title ?? ""), _(r, "width", e(M).width), _(r, "height", e(M).height);
			}), o("error", r, () => v(P, e(M)?.src ?? null, !0)), p(r), t(n, r);
		}, d = (e) => {
			var n = L(), r = S(n, !0);
			i(n), y((e) => u(r, e), [() => s.object.title ?? D()]), t(e, n);
		};
		r(c, (t) => {
			e(M) && !e(q) ? t(l) : t(d, -1);
		}), t(n, a);
	}, Z = (n) => {
		var a = H(), c = h(a);
		let l;
		var f = S(c), m = (n) => {
			var r = R();
			y(() => {
				_(r, "src", e(M).src), _(r, "width", e(M).width), _(r, "height", e(M).height);
			}), o("error", r, () => v(P, e(M)?.src ?? null, !0)), p(r), t(n, r);
		};
		r(f, (t) => {
			e(M) && !e(q) && t(m);
		});
		var x = g(f, 2), C = S(x);
		{
			let t = w(() => e(A) ? 60 : 52);
			E(C, {
				get size() {
					return e(t);
				},
				get youtube() {
					return e(A);
				}
			});
		}
		i(x);
		var T = g(x, 2), D = (e) => {
			var n = z(), r = S(n, !0);
			i(n), y(() => u(r, s.object.duration)), t(e, n);
		};
		r(T, (e) => {
			s.object.duration && e(D);
		}), i(c);
		var j = g(c, 2), I = (n) => {
			var a = V(), o = S(a), c = (e) => {
				O(e, {
					address: "youtube.com",
					size: 16
				});
			};
			r(o, (t) => {
				e(A) && t(c);
			});
			var l = g(o, 2), f = S(l);
			let p;
			var m = S(f, !0);
			i(f);
			var h = g(f, 2), _ = (e) => {
				var n = B(), r = S(n, !0);
				i(n), y(() => u(r, s.object.channel)), t(e, n);
			};
			r(h, (e) => {
				s.object.title && s.object.channel && e(_);
			}), i(l), i(a), y((e) => {
				p = d(f, 1, "title svelte-1ndwtb5", null, p, {
					unnamed: !s.object.title,
					clamped: !!s.object.title
				}), u(m, e);
			}, [() => s.object.title || F()]), t(n, a);
		};
		r(j, (t) => {
			(s.object.title || e(A)) && t(I);
		}), y((t) => {
			l = d(c, 1, "screen nodrag nopan svelte-1ndwtb5", null, l, { bare: !e(M) || e(q) }), _(c, "aria-label", t);
		}, [() => N({ title: s.object.title || (e(A) ? F() : "") })]), b("click", c, () => k().link?.(s.object.url)), t(n, a);
	}, Q = (e) => {
		var n = G(), a = S(n), o = S(a);
		E(o, { size: 36 }), i(a);
		var l = g(a, 2), d = S(l), f = S(d, !0);
		i(d);
		var p = g(d, 2), m = (e) => {
			var n = U(), r = S(n, !0);
			i(n), y(() => u(r, s.object.duration)), t(e, n);
		};
		r(p, (e) => {
			s.object.duration && e(m);
		}), i(l);
		var h = g(l, 2);
		c(h, 20, () => Array.from({ length: 28 }, (e, t) => t), (e) => e, (e, n) => {
			var r = W();
			let i;
			y(() => i = C(r, "", i, { "block-size": `${30 + n * 37 % 70}%` })), t(e, r);
		}), i(h), i(n), y((e, t) => {
			_(a, "aria-label", e), u(f, t);
		}, [() => N({ title: s.object.title ?? "" }), () => s.object.title ?? j()]), b("click", a, () => k().link?.(s.object.url)), t(e, n);
	};
	r(Y, (e) => {
		s.object.media === "image" ? e(X) : s.object.media === "video" ? e(Z, 1) : e(Q, -1);
	}), i(J), y(() => {
		d(J, 1, `media ${s.object.media ?? ""}`, "svelte-1ndwtb5"), _(J, "aria-label", s.object.title);
	}), t(a, J), n();
}
s(["click"]);
export { q as default };
