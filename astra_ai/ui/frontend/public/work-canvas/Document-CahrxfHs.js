import "./disclose-version-DFvUDwEH.js";
import { B as e, D as t, Et as n, F as r, H as i, K as a, M as o, N as s, Nt as c, Q as l, R as u, S as d, Tt as f, V as p, _t as m, at as h, c as g, ct as _, h as v, ht as y, it as b, lt as x, pt as S, q as C, r as w, s as T, ut as E, x as D } from "./index-client-oI5R0J23.js";
import { t as O } from "./DocumentView-7LUhPbJg.js";
import { t as k } from "./Inline-CZHzvbEf.js";
import { n as A } from "./markdown-C0lHpopA.js";
import { t as j } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_object_read_all.js
var M = () => "Read it all", N = ((e = {}, t = {}) => (t.locale ?? j(), M(e))), P = i("<h2 class=\"svelte-8qe97s\"> </h2>"), F = i("<h3><!></h3>"), I = i("<li><!></li>"), L = i("<p><!></p>"), R = i("<button type=\"button\" class=\"read nodrag nopan svelte-8qe97s\"> </button>"), z = i("<article><div><!> <div class=\"text svelte-8qe97s\"><!></div></div> <!></article>");
function B(i, a) {
	n(a, !0);
	let j = w(a, "actions", 19, () => ({})), M = w(a, "centre", 3, !1), B = m(() => a.object.content.formatted ? [] : A(a.object.content.paragraphs.join("\n\n"))), V = y(void 0), H = y(0), U = y(!1);
	h(() => {
		let e = l(V);
		if (!e) return;
		let t = () => S(U, e.scrollHeight > e.clientHeight + 1);
		t();
		let n = new ResizeObserver(t);
		return n.observe(e), () => n.disconnect();
	});
	var W = z();
	let G;
	var K = _(W);
	let q, J;
	var Y = _(K), X = (t) => {
		var n = P(), r = _(n, !0);
		c(n), b(() => u(r, a.object.title)), e(t, n);
	};
	r(Y, (e) => {
		a.object.title && e(X);
	});
	var Z = E(Y, 2), Q = _(Z), $ = (e) => {
		O(e, {
			get document() {
				return a.object.content.formatted;
			},
			get onlink() {
				return j().link;
			}
		});
	}, ee = (n) => {
		var i = p(), a = x(i);
		o(a, 17, () => l(B), s, (n, i) => {
			var a = p(), u = x(a), f = (t) => {
				var n = F(), r = _(n);
				k(r, {
					get text() {
						return l(i).text;
					},
					plain: !0
				}), c(n), e(t, n);
			}, h = (n) => {
				var r = p(), a = x(r);
				t(a, () => l(i).ordered ? "ol" : "ul", !1, (t, n) => {
					d(t, 0, "svelte-8qe97s");
					var r = p(), a = x(r);
					o(a, 17, () => l(i).items, s, (t, n) => {
						var r = I(), i = _(r);
						k(i, {
							get text() {
								return l(n);
							},
							plain: !0
						}), c(r), e(t, r);
					}), e(n, r);
				}), e(n, r);
			}, g = (t) => {
				var n = L(), r = _(n);
				{
					let e = m(() => l(i).lines.join(" "));
					k(r, {
						get text() {
							return l(e);
						},
						plain: !0
					});
				}
				c(n), e(t, n);
			};
			r(u, (e) => {
				l(i).kind === "heading" ? e(f) : l(i).kind === "list" ? e(h, 1) : e(g, -1);
			}), e(n, a);
		}), e(n, i);
	};
	r(Q, (e) => {
		a.object.content.formatted ? e($) : e(ee, -1);
	}), c(Z), c(K), T(K, (e) => S(V, e), () => l(V));
	var te = E(K, 2), ne = (t) => {
		var n = R(), r = _(n, !0);
		c(n), b((e) => u(r, e), [() => N()]), C("click", n, () => j().open?.(a.object.id)), e(t, n);
	};
	r(te, (e) => {
		l(U) && !M() && e(ne);
	}), c(W), b((e) => {
		G = d(W, 1, "paper svelte-8qe97s", null, G, { centre: M() }), v(W, "aria-label", a.object.title), q = d(K, 1, "page svelte-8qe97s", null, q, { overflows: l(U) }), J = D(K, "", J, e);
	}, [() => ({
		"max-block-size": l(H) && !M() ? `${Math.round(l(H) * 1.294)}px` : void 0,
		"min-block-size": l(H) && !M() ? `${Math.round(l(H) * .72)}px` : void 0
	})]), g(K, "clientWidth", (e) => S(H, e)), e(i, W), f();
}
a(["click"]);
export { B as default };
