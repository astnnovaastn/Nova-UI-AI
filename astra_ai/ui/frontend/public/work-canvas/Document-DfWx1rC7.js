import "./disclose-version-DFvUDwEH.js";
import { A as e, At as t, Ct as n, F as r, L as i, M as a, R as o, St as s, U as c, W as l, Y as u, at as d, c as f, ft as p, k as m, m as h, mt as g, nt as _, ot as v, r as y, s as b, st as x, tt as S, ut as C, v as w, w as T, y as E, z as D } from "./index-client-BSGo5gVb.js";
import { t as O } from "./DocumentView-ETQDIaql.js";
import { t as k } from "./Inline-Q9m_b8xX.js";
import { n as A } from "./markdown-C0lHpopA.js";
import { t as j } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_object_read_all.js
var M = () => "Read it all", N = ((e = {}, t = {}) => (t.locale ?? j(), M(e))), P = D("<h2 class=\"svelte-8qe97s\"> </h2>"), F = D("<h3><!></h3>"), I = D("<li><!></li>"), L = D("<p><!></p>"), R = D("<button type=\"button\" class=\"read nodrag nopan svelte-8qe97s\"> </button>"), z = D("<article><div><!> <div class=\"text svelte-8qe97s\"><!></div></div> <!></article>");
function B(c, D) {
	n(D, !0);
	let j = y(D, "actions", 19, () => ({})), M = y(D, "centre", 3, !1), B = g(() => D.object.content.formatted ? [] : A(D.object.content.paragraphs.join("\n\n"))), V = p(void 0), H = p(0), U = p(!1);
	_(() => {
		let e = u(V);
		if (!e) return;
		let t = () => C(U, e.scrollHeight > e.clientHeight + 1);
		t();
		let n = new ResizeObserver(t);
		return n.observe(e), () => n.disconnect();
	});
	var W = z();
	let G;
	var K = d(W);
	let q, J;
	var Y = d(K), X = (e) => {
		var n = P(), a = d(n, !0);
		t(n), S(() => r(a, D.object.title)), i(e, n);
	};
	a(Y, (e) => {
		D.object.title && e(X);
	});
	var Z = x(Y, 2), Q = d(Z), $ = (e) => {
		O(e, {
			get document() {
				return D.object.content.formatted;
			},
			get onlink() {
				return j().link;
			}
		});
	}, ee = (n) => {
		var r = o(), s = v(r);
		m(s, 17, () => u(B), e, (n, r) => {
			var s = o(), c = v(s), l = (e) => {
				var n = F(), a = d(n);
				k(a, {
					get text() {
						return u(r).text;
					},
					plain: !0
				}), t(n), i(e, n);
			}, f = (n) => {
				var a = o(), s = v(a);
				T(s, () => u(r).ordered ? "ol" : "ul", !1, (n, a) => {
					E(n, 0, "svelte-8qe97s");
					var s = o(), c = v(s);
					m(c, 17, () => u(r).items, e, (e, n) => {
						var r = I(), a = d(r);
						k(a, {
							get text() {
								return u(n);
							},
							plain: !0
						}), t(r), i(e, r);
					}), i(a, s);
				}), i(n, a);
			}, p = (e) => {
				var n = L(), a = d(n);
				{
					let e = g(() => u(r).lines.join(" "));
					k(a, {
						get text() {
							return u(e);
						},
						plain: !0
					});
				}
				t(n), i(e, n);
			};
			a(c, (e) => {
				u(r).kind === "heading" ? e(l) : u(r).kind === "list" ? e(f, 1) : e(p, -1);
			}), i(n, s);
		}), i(n, r);
	};
	a(Q, (e) => {
		D.object.content.formatted ? e($) : e(ee, -1);
	}), t(Z), t(K), b(K, (e) => C(V, e), () => u(V));
	var te = x(K, 2), ne = (e) => {
		var n = R(), a = d(n, !0);
		t(n), S((e) => r(a, e), [() => N()]), l("click", n, () => j().open?.(D.object.id)), i(e, n);
	};
	a(te, (e) => {
		u(U) && !M() && e(ne);
	}), t(W), S((e) => {
		G = E(W, 1, "paper svelte-8qe97s", null, G, { centre: M() }), h(W, "aria-label", D.object.title), q = E(K, 1, "page svelte-8qe97s", null, q, { overflows: u(U) }), J = w(K, "", J, e);
	}, [() => ({
		"max-block-size": u(H) && !M() ? `${Math.round(u(H) * 1.294)}px` : void 0,
		"min-block-size": u(H) && !M() ? `${Math.round(u(H) * .72)}px` : void 0
	})]), f(K, "clientWidth", (e) => C(H, e)), i(c, W), s();
}
c(["click"]);
export { B as default };
