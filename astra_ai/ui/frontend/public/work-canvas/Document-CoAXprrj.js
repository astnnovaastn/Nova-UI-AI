import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, D as n, F as r, H as i, J as a, L as o, Mt as s, P as c, S as l, U as u, W as d, Y as f, bt as p, c as m, h, ht as g, jt as _, lt as v, mt as y, pt as b, r as x, s as S, tt as C, ut as w, vt as T, x as E, zt as D } from "./index-client-DH73-vTM.js";
import { t as O } from "./DocumentView-Dru8XpjZ.js";
import { t as k } from "./Inline-GGUrbZg2.js";
import { n as A } from "./markdown-C0lHpopA.js";
import { t as j } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_object_read_all.js
var M = () => "Read it all", N = ((e = {}, t = {}) => (t.locale ?? j(), M(e))), P = d("<h2 class=\"svelte-8qe97s\"> </h2>"), F = d("<h3><!></h3>"), I = d("<li><!></li>"), L = d("<p><!></p>"), R = d("<button type=\"button\" class=\"read nodrag nopan svelte-8qe97s\"> </button>"), z = d("<article><div><!> <div class=\"text svelte-8qe97s\"><!></div></div> <!></article>");
function B(a, d) {
	s(d, !0);
	let j = x(d, "actions", 19, () => ({})), M = x(d, "centre", 3, !1), B = t(() => d.object.content.formatted ? [] : A(d.object.content.paragraphs.join("\n\n"))), V = p(void 0), H = p(0), U = p(!1);
	w(() => {
		let e = C(V);
		if (!e) return;
		let t = () => T(U, e.scrollHeight > e.clientHeight + 1);
		t();
		let n = new ResizeObserver(t);
		return n.observe(e), () => n.disconnect();
	});
	var W = z();
	let G;
	var K = b(W);
	let q, J;
	var Y = b(K), X = (t) => {
		var n = P(), r = b(n, !0);
		D(n), v(() => e(r, d.object.title)), i(t, n);
	};
	o(Y, (e) => {
		d.object.title && e(X);
	});
	var Z = g(Y, 2), Q = b(Z), $ = (e) => {
		O(e, {
			get document() {
				return d.object.content.formatted;
			},
			get onlink() {
				return j().link;
			}
		});
	}, ee = (e) => {
		var a = u(), s = y(a);
		c(s, 17, () => C(B), r, (e, a) => {
			var s = u(), d = y(s), f = (e) => {
				var t = F(), n = b(t);
				k(n, {
					get text() {
						return C(a).text;
					},
					plain: !0
				}), D(t), i(e, t);
			}, p = (e) => {
				var t = u(), o = y(t);
				n(o, () => C(a).ordered ? "ol" : "ul", !1, (e, t) => {
					l(e, 0, "svelte-8qe97s");
					var n = u(), o = y(n);
					c(o, 17, () => C(a).items, r, (e, t) => {
						var n = I(), r = b(n);
						k(r, {
							get text() {
								return C(t);
							},
							plain: !0
						}), D(n), i(e, n);
					}), i(t, n);
				}), i(e, t);
			}, m = (e) => {
				var n = L(), r = b(n);
				{
					let e = t(() => C(a).lines.join(" "));
					k(r, {
						get text() {
							return C(e);
						},
						plain: !0
					});
				}
				D(n), i(e, n);
			};
			o(d, (e) => {
				C(a).kind === "heading" ? e(f) : C(a).kind === "list" ? e(p, 1) : e(m, -1);
			}), i(e, s);
		}), i(e, a);
	};
	o(Q, (e) => {
		d.object.content.formatted ? e($) : e(ee, -1);
	}), D(Z), D(K), S(K, (e) => T(V, e), () => C(V));
	var te = g(K, 2), ne = (t) => {
		var n = R(), r = b(n, !0);
		D(n), v((t) => e(r, t), [() => N()]), f("click", n, () => j().open?.(d.object.id)), i(t, n);
	};
	o(te, (e) => {
		C(U) && !M() && e(ne);
	}), D(W), v((e) => {
		G = l(W, 1, "paper svelte-8qe97s", null, G, { centre: M() }), h(W, "aria-label", d.object.title), q = l(K, 1, "page svelte-8qe97s", null, q, { overflows: C(U) }), J = E(K, "", J, e);
	}, [() => ({
		"max-block-size": C(H) && !M() ? `${Math.round(C(H) * 1.294)}px` : void 0,
		"min-block-size": C(H) && !M() ? `${Math.round(C(H) * .72)}px` : void 0
	})]), m(K, "clientWidth", (e) => T(H, e)), i(a, W), _();
}
a(["click"]);
export { B as default };
