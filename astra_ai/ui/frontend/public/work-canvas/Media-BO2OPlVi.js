import { t as e } from "./rolldown-runtime-CGnMp29N.js";
import { B as t, Ct as n, H as r, J as i, L as a, Mt as o, P as s, Q as c, S as l, U as u, W as d, X as f, Y as p, bt as m, h, ht as g, jt as _, lt as v, mt as y, pt as b, r as x, tt as S, vt as C, x as w, zt as T } from "./index-client-DH73-vTM.js";
import "./disclose-version-7ONGmeVC.js";
import { t as E } from "./runtime-Ci9kzAvr.js";
import { a as D, o as O } from "./link-media-Qx-gCMFf.js";
import { t as k } from "./Mark-y83oESZj.js";
// upstream/src/shared/i18n/messages/work_media_audio.js
var A = () => "Recording", j = ((e = {}, t = {}) => (t.locale ?? E(), A(e))), M = () => "The stored file is missing.", N = ((e = {}, t = {}) => (t.locale ?? E(), M(e))), P = (e) => `Play ${e?.title}`, F = ((e, t = {}) => (t.locale ?? E(), P(e))), I = () => "YouTube video", L = ((e = {}, t = {}) => (t.locale ?? E(), I(e))), R = /* @__PURE__ */ e({ default: () => Q }), z = d("<img class=\"image svelte-1ndwtb5\" decoding=\"async\" loading=\"lazy\" draggable=\"false\"/>"), B = d("<div class=\"missing svelte-1ndwtb5\"> </div>"), V = d("<img alt=\"\" decoding=\"async\" loading=\"lazy\" draggable=\"false\" class=\"svelte-1ndwtb5\"/>"), H = d("<span class=\"length svelte-1ndwtb5\"> </span>"), U = d("<span class=\"channel svelte-1ndwtb5\"> </span>"), W = d("<figcaption class=\"svelte-1ndwtb5\"><!> <span class=\"words svelte-1ndwtb5\"><span> </span> <!></span></figcaption>"), G = d("<img alt=\"\" loading=\"lazy\" decoding=\"async\" draggable=\"false\" class=\"svelte-1ndwtb5\"/>"), K = d("<span class=\"clip-channel svelte-1ndwtb5\"> </span>"), q = d("<div role=\"listitem\" class=\"clip-item svelte-1ndwtb5\"><button type=\"button\" class=\"clip svelte-1ndwtb5\"><!> <span class=\"play svelte-1ndwtb5\"><!></span></button> <span class=\"clip-title svelte-1ndwtb5\"> </span> <!></div>"), J = d("<span class=\"collection-label svelte-1ndwtb5\"> </span> <div class=\"strip nodrag nopan nowheel svelte-1ndwtb5\" role=\"list\" aria-label=\"More videos in this collection\"></div>", 1), Y = d("<button type=\"button\"><!> <span class=\"play svelte-1ndwtb5\"><!></span> <!></button> <!> <!>", 1), X = d("<span class=\"length-text svelte-1ndwtb5\"> </span>"), Z = d("<span class=\"svelte-1ndwtb5\"></span>"), ee = d("<div class=\"player svelte-1ndwtb5\"><button type=\"button\" class=\"round nodrag nopan svelte-1ndwtb5\"><!></button> <div class=\"words svelte-1ndwtb5\"><span class=\"title svelte-1ndwtb5\"> </span> <!></div> <span class=\"wave svelte-1ndwtb5\" aria-hidden=\"true\"></span></div>"), te = d("<figure><!></figure>");
function Q(e, i) {
	o(i, !0);
	let d = x(i, "actions", 19, () => ({})), E = n(() => i.object.media === "video" && !!D(i.object.url)), A = m("right");
	function M(e) {
		if (!i.object.more?.length) return;
		let t = e.getBoundingClientRect(), n = Math.max(240, e.offsetWidth);
		e.style.setProperty("--clip-w", `${n}px`);
		let r = t.width / Math.max(1, e.offsetWidth), a = (Math.min(i.object.more.length, 3) * (n + 16) + 16) * r;
		C(A, t.right + a > window.innerWidth && t.left - a > 0 ? "left" : "right", !0);
	}
	let P = n(() => i.object.poster ?? i.object.picture), I = m(null), R = n(() => !!S(P) && S(I) === S(P).src);
	var Q = te();
	let $;
	var ne = b(Q), re = (e) => {
		var n = u(), o = y(n), s = (e) => {
			var t = z();
			v(() => {
				h(t, "src", S(P).src), h(t, "alt", i.object.title ?? ""), h(t, "width", S(P).width), h(t, "height", S(P).height);
			}), f("error", t, () => C(I, S(P)?.src ?? null, !0)), c(t), r(e, t);
		}, l = (e) => {
			var n = B(), a = b(n, !0);
			T(n), v((e) => t(a, e), [() => i.object.title ?? N()]), r(e, n);
		};
		a(o, (e) => {
			S(P) && !S(R) ? e(s) : e(l, -1);
		}), r(e, n);
	}, ie = (e) => {
		var o = Y(), u = y(o);
		let m;
		var _ = b(u), x = (e) => {
			var t = V();
			v(() => {
				h(t, "src", S(P).src), h(t, "width", S(P).width), h(t, "height", S(P).height);
			}), f("error", t, () => C(I, S(P)?.src ?? null, !0)), c(t), r(e, t);
		};
		a(_, (e) => {
			S(P) && !S(R) && e(x);
		});
		var A = g(_, 2), j = b(A);
		{
			let e = n(() => S(E) ? 60 : 52);
			O(j, {
				get size() {
					return S(e);
				},
				get youtube() {
					return S(E);
				}
			});
		}
		T(A);
		var M = g(A, 2), N = (e) => {
			var n = H(), a = b(n, !0);
			T(n), v(() => t(a, i.object.duration)), r(e, n);
		};
		a(M, (e) => {
			i.object.duration && e(N);
		}), T(u);
		var z = g(u, 2), B = (e) => {
			var n = W(), o = b(n), s = (e) => {
				k(e, {
					address: "youtube.com",
					size: 16
				});
			};
			a(o, (e) => {
				S(E) && e(s);
			});
			var c = g(o, 2), u = b(c);
			let d;
			var f = b(u, !0);
			T(u);
			var p = g(u, 2), m = (e) => {
				var n = U(), a = b(n, !0);
				T(n), v(() => t(a, i.object.channel)), r(e, n);
			};
			a(p, (e) => {
				i.object.title && i.object.channel && e(m);
			}), T(c), T(n), v((e) => {
				d = l(u, 1, "title svelte-1ndwtb5", null, d, {
					unnamed: !i.object.title,
					clamped: !!i.object.title
				}), t(f, e);
			}, [() => i.object.title || L()]), r(e, n);
		};
		a(z, (e) => {
			(i.object.title || S(E)) && e(B);
		});
		var X = g(z, 2), Z = (e) => {
			var o = J(), c = y(o), l = b(c);
			T(c);
			var u = g(c, 2);
			s(u, 23, () => i.object.more, (e) => e.url, (e, i, o) => {
				var s = q();
				let c;
				var l = b(s), u = b(l), f = (e) => {
					var t = G();
					v(() => h(t, "src", S(i).poster)), r(e, t);
				};
				a(u, (e) => {
					S(i).poster && e(f);
				});
				var m = g(u, 2), _ = b(m);
				{
					let e = n(() => !!D(S(i).url));
					O(_, {
						size: 34,
						get youtube() {
							return S(e);
						}
					});
				}
				T(m), T(l);
				var y = g(l, 2), x = b(y, !0);
				T(y);
				var C = g(y, 2), E = (e) => {
					var n = K(), a = b(n, !0);
					T(n), v(() => t(a, S(i).channel)), r(e, n);
				};
				a(C, (e) => {
					S(i).channel && e(E);
				}), T(s), v(() => {
					c = w(s, "", c, { "--i": S(o) + 1 }), h(l, "aria-label", `Play ${S(i).title || "video"}`), t(x, S(i).title || "Video");
				}), p("click", l, () => d().link?.(S(i).url)), r(e, s);
			}), T(u), v(() => t(l, `Video collection · ${i.object.more.length + 1} videos`)), r(e, o);
		};
		a(X, (e) => {
			i.object.more?.length && e(Z);
		}), v((e) => {
			m = l(u, 1, "screen nodrag nopan svelte-1ndwtb5", null, m, { bare: !S(P) || S(R) }), h(u, "aria-label", e);
		}, [() => F({ title: i.object.title || (S(E) ? L() : "") })]), p("click", u, () => d().link?.(i.object.url)), r(e, o);
	}, ae = (e) => {
		var n = ee(), o = b(n), c = b(o);
		O(c, { size: 36 }), T(o);
		var l = g(o, 2), u = b(l), f = b(u, !0);
		T(u);
		var m = g(u, 2), _ = (e) => {
			var n = X(), a = b(n, !0);
			T(n), v(() => t(a, i.object.duration)), r(e, n);
		};
		a(m, (e) => {
			i.object.duration && e(_);
		}), T(l);
		var y = g(l, 2);
		s(y, 20, () => Array.from({ length: 28 }, (e, t) => t), (e) => e, (e, t) => {
			var n = Z();
			let i;
			v(() => i = w(n, "", i, { "block-size": `${30 + t * 37 % 70}%` })), r(e, n);
		}), T(y), T(n), v((e, n) => {
			h(o, "aria-label", e), t(f, n);
		}, [() => F({ title: i.object.title ?? "" }), () => i.object.title ?? j()]), p("click", o, () => d().link?.(i.object.url)), r(e, n);
	};
	a(ne, (e) => {
		i.object.media === "image" ? e(re) : i.object.media === "video" ? e(ie, 1) : e(ae, -1);
	}), T(Q), v(() => {
		$ = l(Q, 1, `media ${i.object.media ?? ""}`, "svelte-1ndwtb5", $, { collection: !!i.object.more?.length }), h(Q, "data-side", S(A)), h(Q, "aria-label", i.object.title);
	}), f("pointerenter", Q, (e) => M(e.currentTarget)), p("focusin", Q, (e) => M(e.currentTarget)), r(e, Q), _();
}
i(["focusin", "click"]);
export { R as n, N as r, Q as t };
