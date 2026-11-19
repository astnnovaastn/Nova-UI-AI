import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, Dt as n, F as r, H as i, J as a, L as o, Mt as s, P as c, U as l, W as u, X as d, Y as f, bt as p, h as m, ht as h, jt as g, lt as _, mt as v, pt as y, r as b, rt as x, s as S, tt as C, u as w, vt as T, zt as E } from "./index-client-DH73-vTM.js";
import { t as D } from "./Inline-GGUrbZg2.js";
import { n as O } from "./markdown-C0lHpopA.js";
import { t as k } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_note_empty.js
var A = () => "Write something", j = ((e = {}, t = {}) => (t.locale ?? k(), A(e))), M = () => "Note", N = ((e = {}, t = {}) => (t.locale ?? k(), M(e))), P = u("<textarea class=\"nodrag nopan nowheel svelte-1wug6d5\"></textarea>"), F = u("<h3 class=\"svelte-1wug6d5\"><!></h3>"), I = u("<li><!></li>"), L = u("<ul class=\"svelte-1wug6d5\"></ul>"), R = u("<br/>"), z = u("<!><!>", 1), B = u("<p class=\"svelte-1wug6d5\"></p>"), V = u("<p class=\"empty svelte-1wug6d5\"> </p>"), H = u("<div class=\"text svelte-1wug6d5\"></div>"), U = u("<div class=\"note svelte-1wug6d5\"><!></div>");
function W(a, u) {
	s(u, !0);
	let k = b(u, "actions", 19, () => ({})), A = p(!1), M = p(""), W = p(void 0), G = t(() => O(u.object.markdown));
	async function K() {
		k().write && (T(M, u.object.markdown, !0), T(A, !0), await x(), C(W)?.focus(), J());
	}
	function q() {
		T(A, !1), C(M) !== u.object.markdown && k().write?.(u.object.id, C(M));
	}
	function J() {
		C(W) && (C(W).style.blockSize = "auto", C(W).style.blockSize = `${C(W).scrollHeight}px`);
	}
	var Y = U(), X = y(Y), Z = (e) => {
		var t = P();
		n(t), S(t, (e) => T(W, e), () => C(W)), _((e) => m(t, "aria-label", e), [() => N()]), f("input", t, J), d("blur", t, q), f("keydown", t, (e) => {
			e.key === "Escape" && (e.preventDefault(), C(W)?.blur());
		}), w(t, () => C(M), (e) => T(M, e)), i(e, t);
	}, Q = (t) => {
		var n = H();
		c(n, 21, () => C(G), r, (e, t) => {
			var n = l(), a = v(n), s = (e) => {
				var n = F(), r = y(n);
				D(r, { get text() {
					return C(t).text;
				} }), E(n), i(e, n);
			}, u = (e) => {
				var n = L();
				c(n, 21, () => C(t).items, r, (e, t) => {
					var n = I(), r = y(n);
					D(r, { get text() {
						return C(t);
					} }), E(n), i(e, n);
				}), E(n), i(e, n);
			}, d = (e) => {
				var n = B();
				c(n, 21, () => C(t).lines, r, (e, t, n) => {
					var r = z(), a = v(r), s = (e) => {
						var t = R();
						i(e, t);
					};
					o(a, (e) => {
						n && e(s);
					});
					var c = h(a);
					D(c, { get text() {
						return C(t);
					} }), i(e, r);
				}), E(n), i(e, n);
			};
			o(a, (e) => {
				C(t).kind === "heading" ? e(s) : C(t).kind === "list" ? e(u, 1) : e(d, -1);
			}), i(e, n);
		}, (t) => {
			var n = V(), r = y(n, !0);
			E(n), _((t) => e(r, t), [() => j()]), i(t, n);
		}), E(n), _(() => {
			m(n, "role", k().write ? "button" : void 0), m(n, "tabindex", k().write ? 0 : void 0);
		}), f("click", n, K), f("keydown", n, (e) => {
			e.key === "Enter" && K();
		}), i(t, n);
	};
	o(X, (e) => {
		C(A) ? e(Z) : e(Q, -1);
	}), E(Y), i(a, Y), g();
}
a([
	"input",
	"keydown",
	"click"
]);
export { W as default };
