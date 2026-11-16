import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, D as n, Dt as r, F as i, Ft as a, H as o, K as s, M as c, N as l, Ot as u, R as d, S as f, V as p, _t as m, c as h, dt as g, ft as _, h as v, ht as y, ot as b, q as x, r as S, s as C, st as w, ut as T, x as E, yt as D } from "./index-client-C_2wYFnt.js";
import { t as O } from "./DocumentView-D9LS7FFF.js";
import { t as k } from "./Inline-hs44HAd0.js";
import { n as A } from "./markdown-C0lHpopA.js";
import { t as j } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_object_read_all.js
var M = () => "Read it all", N = ((e = {}, t = {}) => (t.locale ?? j(), M(e))), P = o("<h2 class=\"svelte-8qe97s\"> </h2>"), F = o("<h3><!></h3>"), I = o("<li><!></li>"), L = o("<p><!></p>"), R = o("<button type=\"button\" class=\"read nodrag nopan svelte-8qe97s\"> </button>"), z = o("<article><div><!> <div class=\"text svelte-8qe97s\"><!></div></div> <!></article>");
function B(o, s) {
	u(s, !0);
	let j = S(s, "actions", 19, () => ({})), M = S(s, "centre", 3, !1), B = D(() => s.object.content.formatted ? [] : A(s.object.content.paragraphs.join("\n\n"))), V = m(void 0), H = m(0), U = m(!1);
	w(() => {
		let t = e(V);
		if (!t) return;
		let n = () => y(U, t.scrollHeight > t.clientHeight + 1);
		n();
		let r = new ResizeObserver(n);
		return r.observe(t), () => r.disconnect();
	});
	var W = z();
	let G;
	var K = T(W);
	let q, J;
	var Y = T(K), X = (e) => {
		var n = P(), r = T(n, !0);
		a(n), b(() => d(r, s.object.title)), t(e, n);
	};
	i(Y, (e) => {
		s.object.title && e(X);
	});
	var Z = _(Y, 2), Q = T(Z), $ = (e) => {
		O(e, {
			get document() {
				return s.object.content.formatted;
			},
			get onlink() {
				return j().link;
			}
		});
	}, ee = (r) => {
		var o = p(), s = g(o);
		c(s, 17, () => e(B), l, (r, o) => {
			var s = p(), u = g(s), d = (n) => {
				var r = F(), i = T(r);
				k(i, {
					get text() {
						return e(o).text;
					},
					plain: !0
				}), a(r), t(n, r);
			}, m = (r) => {
				var i = p(), s = g(i);
				n(s, () => e(o).ordered ? "ol" : "ul", !1, (n, r) => {
					f(n, 0, "svelte-8qe97s");
					var i = p(), s = g(i);
					c(s, 17, () => e(o).items, l, (n, r) => {
						var i = I(), o = T(i);
						k(o, {
							get text() {
								return e(r);
							},
							plain: !0
						}), a(i), t(n, i);
					}), t(r, i);
				}), t(r, i);
			}, h = (n) => {
				var r = L(), i = T(r);
				{
					let t = D(() => e(o).lines.join(" "));
					k(i, {
						get text() {
							return e(t);
						},
						plain: !0
					});
				}
				a(r), t(n, r);
			};
			i(u, (t) => {
				e(o).kind === "heading" ? t(d) : e(o).kind === "list" ? t(m, 1) : t(h, -1);
			}), t(r, s);
		}), t(r, o);
	};
	i(Q, (e) => {
		s.object.content.formatted ? e($) : e(ee, -1);
	}), a(Z), a(K), C(K, (e) => y(V, e), () => e(V));
	var te = _(K, 2), ne = (e) => {
		var n = R(), r = T(n, !0);
		a(n), b((e) => d(r, e), [() => N()]), x("click", n, () => j().open?.(s.object.id)), t(e, n);
	};
	i(te, (t) => {
		e(U) && !M() && t(ne);
	}), a(W), b((t) => {
		G = f(W, 1, "paper svelte-8qe97s", null, G, { centre: M() }), v(W, "aria-label", s.object.title), q = f(K, 1, "page svelte-8qe97s", null, q, { overflows: e(U) }), J = E(K, "", J, t);
	}, [() => ({
		"max-block-size": e(H) && !M() ? `${Math.round(e(H) * 1.294)}px` : void 0,
		"min-block-size": e(H) && !M() ? `${Math.round(e(H) * .72)}px` : void 0
	})]), h(K, "clientWidth", (e) => y(H, e)), t(o, W), r();
}
s(["click"]);
export { B as default };
