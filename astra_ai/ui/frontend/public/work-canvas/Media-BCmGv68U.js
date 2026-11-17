import { t as e } from "./rolldown-runtime-CGnMp29N.js";
import { $ as t, B as n, Dt as r, F as i, Ft as a, H as o, J as s, K as c, M as l, Ot as u, R as d, S as f, V as p, X as m, _t as h, dt as g, ft as _, h as v, ht as y, ot as b, q as x, r as S, ut as C, x as w, yt as T } from "./index-client-C_2wYFnt.js";
import "./disclose-version-DFvUDwEH.js";
import { t as E } from "./runtime-Ci9kzAvr.js";
import { a as D, o as O } from "./link-media-qN432bcy.js";
import { t as k } from "./Mark-BTIzBHOo.js";
// upstream/src/shared/i18n/messages/work_media_audio.js
var A = () => "Recording", j = ((e = {}, t = {}) => (t.locale ?? E(), A(e))), M = () => "The stored file is missing.", N = ((e = {}, t = {}) => (t.locale ?? E(), M(e))), P = (e) => `Play ${e?.title}`, F = ((e, t = {}) => (t.locale ?? E(), P(e))), I = () => "YouTube video", L = ((e = {}, t = {}) => (t.locale ?? E(), I(e))), R = /* @__PURE__ */ e({ default: () => Q }), z = o("<img class=\"image svelte-1ndwtb5\" decoding=\"async\" loading=\"lazy\" draggable=\"false\"/>"), B = o("<div class=\"missing svelte-1ndwtb5\"> </div>"), V = o("<img alt=\"\" decoding=\"async\" loading=\"lazy\" draggable=\"false\" class=\"svelte-1ndwtb5\"/>"), H = o("<span class=\"length svelte-1ndwtb5\"> </span>"), U = o("<span class=\"channel svelte-1ndwtb5\"> </span>"), W = o("<figcaption class=\"svelte-1ndwtb5\"><!> <span class=\"words svelte-1ndwtb5\"><span> </span> <!></span></figcaption>"), G = o("<img alt=\"\" loading=\"lazy\" decoding=\"async\" draggable=\"false\" class=\"svelte-1ndwtb5\"/>"), K = o("<span class=\"clip-channel svelte-1ndwtb5\"> </span>"), q = o("<div role=\"listitem\" class=\"clip-item svelte-1ndwtb5\"><button type=\"button\" class=\"clip svelte-1ndwtb5\"><!> <span class=\"play svelte-1ndwtb5\"><!></span></button> <span class=\"clip-title svelte-1ndwtb5\"> </span> <!></div>"), J = o("<span class=\"collection-label svelte-1ndwtb5\"> </span> <div class=\"strip nodrag nopan nowheel svelte-1ndwtb5\" role=\"list\" aria-label=\"More videos in this collection\"></div>", 1), Y = o("<button type=\"button\"><!> <span class=\"play svelte-1ndwtb5\"><!></span> <!></button> <!> <!>", 1), X = o("<span class=\"length-text svelte-1ndwtb5\"> </span>"), Z = o("<span class=\"svelte-1ndwtb5\"></span>"), ee = o("<div class=\"player svelte-1ndwtb5\"><button type=\"button\" class=\"round nodrag nopan svelte-1ndwtb5\"><!></button> <div class=\"words svelte-1ndwtb5\"><span class=\"title svelte-1ndwtb5\"> </span> <!></div> <span class=\"wave svelte-1ndwtb5\" aria-hidden=\"true\"></span></div>"), te = o("<figure><!></figure>");
function Q(e, o) {
	u(o, !0);
	let c = S(o, "actions", 19, () => ({})), E = T(() => o.object.media === "video" && !!D(o.object.url)), A = h("right");
	function M(e) {
		if (!o.object.more?.length) return;
		let t = e.getBoundingClientRect(), n = t.width / Math.max(1, e.offsetWidth), r = Math.min(o.object.more.length, 3) * 252 * n + 16 * n;
		y(A, t.right + r > window.innerWidth && t.left - r > 0 ? "left" : "right", !0);
	}
	let P = T(() => o.object.poster ?? o.object.picture), I = h(null), R = T(() => !!t(P) && t(I) === t(P).src);
	var Q = te();
	let $;
	var ne = C(Q), re = (e) => {
		var r = p(), c = g(r), l = (e) => {
			var r = z();
			b(() => {
				v(r, "src", t(P).src), v(r, "alt", o.object.title ?? ""), v(r, "width", t(P).width), v(r, "height", t(P).height);
			}), s("error", r, () => y(I, t(P)?.src ?? null, !0)), m(r), n(e, r);
		}, u = (e) => {
			var t = B(), r = C(t, !0);
			a(t), b((e) => d(r, e), [() => o.object.title ?? N()]), n(e, t);
		};
		i(c, (e) => {
			t(P) && !t(R) ? e(l) : e(u, -1);
		}), n(e, r);
	}, ie = (e) => {
		var r = Y(), u = g(r);
		let p;
		var h = C(u), S = (e) => {
			var r = V();
			b(() => {
				v(r, "src", t(P).src), v(r, "width", t(P).width), v(r, "height", t(P).height);
			}), s("error", r, () => y(I, t(P)?.src ?? null, !0)), m(r), n(e, r);
		};
		i(h, (e) => {
			t(P) && !t(R) && e(S);
		});
		var A = _(h, 2), j = C(A);
		{
			let e = T(() => t(E) ? 60 : 52);
			O(j, {
				get size() {
					return t(e);
				},
				get youtube() {
					return t(E);
				}
			});
		}
		a(A);
		var M = _(A, 2), N = (e) => {
			var t = H(), r = C(t, !0);
			a(t), b(() => d(r, o.object.duration)), n(e, t);
		};
		i(M, (e) => {
			o.object.duration && e(N);
		}), a(u);
		var z = _(u, 2), B = (e) => {
			var r = W(), s = C(r), c = (e) => {
				k(e, {
					address: "youtube.com",
					size: 16
				});
			};
			i(s, (e) => {
				t(E) && e(c);
			});
			var l = _(s, 2), u = C(l);
			let p;
			var m = C(u, !0);
			a(u);
			var h = _(u, 2), g = (e) => {
				var t = U(), r = C(t, !0);
				a(t), b(() => d(r, o.object.channel)), n(e, t);
			};
			i(h, (e) => {
				o.object.title && o.object.channel && e(g);
			}), a(l), a(r), b((e) => {
				p = f(u, 1, "title svelte-1ndwtb5", null, p, {
					unnamed: !o.object.title,
					clamped: !!o.object.title
				}), d(m, e);
			}, [() => o.object.title || L()]), n(e, r);
		};
		i(z, (e) => {
			(o.object.title || t(E)) && e(B);
		});
		var X = _(z, 2), Z = (e) => {
			var r = J(), s = g(r), u = C(s);
			a(s);
			var f = _(s, 2);
			l(f, 23, () => o.object.more, (e) => e.url, (e, r, o) => {
				var s = q();
				let l;
				var u = C(s), f = C(u), p = (e) => {
					var i = G();
					b(() => v(i, "src", t(r).poster)), n(e, i);
				};
				i(f, (e) => {
					t(r).poster && e(p);
				});
				var m = _(f, 2), h = C(m);
				{
					let e = T(() => !!D(t(r).url));
					O(h, {
						size: 34,
						get youtube() {
							return t(e);
						}
					});
				}
				a(m), a(u);
				var g = _(u, 2), y = C(g, !0);
				a(g);
				var S = _(g, 2), E = (e) => {
					var i = K(), o = C(i, !0);
					a(i), b(() => d(o, t(r).channel)), n(e, i);
				};
				i(S, (e) => {
					t(r).channel && e(E);
				}), a(s), b(() => {
					l = w(s, "", l, { "--i": t(o) + 1 }), v(u, "aria-label", `Play ${t(r).title || "video"}`), d(y, t(r).title || "Video");
				}), x("click", u, () => c().link?.(t(r).url)), n(e, s);
			}), a(f), b(() => d(u, `Video collection · ${o.object.more.length + 1} videos`)), n(e, r);
		};
		i(X, (e) => {
			o.object.more?.length && e(Z);
		}), b((e) => {
			p = f(u, 1, "screen nodrag nopan svelte-1ndwtb5", null, p, { bare: !t(P) || t(R) }), v(u, "aria-label", e);
		}, [() => F({ title: o.object.title || (t(E) ? L() : "") })]), x("click", u, () => c().link?.(o.object.url)), n(e, r);
	}, ae = (e) => {
		var t = ee(), r = C(t), s = C(r);
		O(s, { size: 36 }), a(r);
		var u = _(r, 2), f = C(u), p = C(f, !0);
		a(f);
		var m = _(f, 2), h = (e) => {
			var t = X(), r = C(t, !0);
			a(t), b(() => d(r, o.object.duration)), n(e, t);
		};
		i(m, (e) => {
			o.object.duration && e(h);
		}), a(u);
		var g = _(u, 2);
		l(g, 20, () => Array.from({ length: 28 }, (e, t) => t), (e) => e, (e, t) => {
			var r = Z();
			let i;
			b(() => i = w(r, "", i, { "block-size": `${30 + t * 37 % 70}%` })), n(e, r);
		}), a(g), a(t), b((e, t) => {
			v(r, "aria-label", e), d(p, t);
		}, [() => F({ title: o.object.title ?? "" }), () => o.object.title ?? j()]), x("click", r, () => c().link?.(o.object.url)), n(e, t);
	};
	i(ne, (e) => {
		o.object.media === "image" ? e(re) : o.object.media === "video" ? e(ie, 1) : e(ae, -1);
	}), a(Q), b(() => {
		$ = f(Q, 1, `media ${o.object.media ?? ""}`, "svelte-1ndwtb5", $, { collection: !!o.object.more?.length }), v(Q, "data-side", t(A)), v(Q, "aria-label", o.object.title);
	}), s("pointerenter", Q, (e) => M(e.currentTarget)), x("focusin", Q, (e) => M(e.currentTarget)), n(e, Q), r();
}
c(["focusin", "click"]);
export { R as n, N as r, Q as t };
