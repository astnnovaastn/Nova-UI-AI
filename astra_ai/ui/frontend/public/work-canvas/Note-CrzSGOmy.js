import "./disclose-version-DFvUDwEH.js";
import { A as e, At as t, Ct as n, F as r, G as i, L as a, M as o, R as s, St as c, U as l, W as u, X as d, Y as f, at as p, ft as m, k as h, l as g, m as _, mt as v, ot as y, r as b, s as x, st as S, tt as C, ut as w, vt as T, z as E } from "./index-client-BSGo5gVb.js";
import { t as D } from "./Inline-Q9m_b8xX.js";
import { n as O } from "./markdown-C0lHpopA.js";
import { t as k } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_note_empty.js
var A = () => "Write something", j = ((e = {}, t = {}) => (t.locale ?? k(), A(e))), M = () => "Note", N = ((e = {}, t = {}) => (t.locale ?? k(), M(e))), P = E("<textarea class=\"nodrag nopan nowheel svelte-1wug6d5\"></textarea>"), F = E("<h3 class=\"svelte-1wug6d5\"><!></h3>"), I = E("<li><!></li>"), L = E("<ul class=\"svelte-1wug6d5\"></ul>"), R = E("<br/>"), z = E("<!><!>", 1), B = E("<p class=\"svelte-1wug6d5\"></p>"), V = E("<p class=\"empty svelte-1wug6d5\"> </p>"), H = E("<div class=\"text svelte-1wug6d5\"></div>"), U = E("<div class=\"note svelte-1wug6d5\"><!></div>");
function W(l, E) {
	n(E, !0);
	let k = b(E, "actions", 19, () => ({})), A = m(!1), M = m(""), W = m(void 0), G = v(() => O(E.object.markdown));
	async function K() {
		k().write && (w(M, E.object.markdown, !0), w(A, !0), await d(), f(W)?.focus(), J());
	}
	function q() {
		w(A, !1), f(M) !== E.object.markdown && k().write?.(E.object.id, f(M));
	}
	function J() {
		f(W) && (f(W).style.blockSize = "auto", f(W).style.blockSize = `${f(W).scrollHeight}px`);
	}
	var Y = U(), X = p(Y), Z = (e) => {
		var t = P();
		T(t), x(t, (e) => w(W, e), () => f(W)), C((e) => _(t, "aria-label", e), [() => N()]), u("input", t, J), i("blur", t, q), u("keydown", t, (e) => {
			e.key === "Escape" && (e.preventDefault(), f(W)?.blur());
		}), g(t, () => f(M), (e) => w(M, e)), a(e, t);
	}, Q = (n) => {
		var i = H();
		h(i, 21, () => f(G), e, (n, r) => {
			var i = s(), c = y(i), l = (e) => {
				var n = F(), i = p(n);
				D(i, { get text() {
					return f(r).text;
				} }), t(n), a(e, n);
			}, u = (n) => {
				var i = L();
				h(i, 21, () => f(r).items, e, (e, n) => {
					var r = I(), i = p(r);
					D(i, { get text() {
						return f(n);
					} }), t(r), a(e, r);
				}), t(i), a(n, i);
			}, d = (n) => {
				var i = B();
				h(i, 21, () => f(r).lines, e, (e, t, n) => {
					var r = z(), i = y(r), s = (e) => {
						var t = R();
						a(e, t);
					};
					o(i, (e) => {
						n && e(s);
					});
					var c = S(i);
					D(c, { get text() {
						return f(t);
					} }), a(e, r);
				}), t(i), a(n, i);
			};
			o(c, (e) => {
				f(r).kind === "heading" ? e(l) : f(r).kind === "list" ? e(u, 1) : e(d, -1);
			}), a(n, i);
		}, (e) => {
			var n = V(), i = p(n, !0);
			t(n), C((e) => r(i, e), [() => j()]), a(e, n);
		}), t(i), C(() => {
			_(i, "role", k().write ? "button" : void 0), _(i, "tabindex", k().write ? 0 : void 0);
		}), u("click", i, K), u("keydown", i, (e) => {
			e.key === "Enter" && K();
		}), a(n, i);
	};
	o(X, (e) => {
		f(A) ? e(Z) : e(Q, -1);
	}), t(Y), a(l, Y), c();
}
l([
	"input",
	"keydown",
	"click"
]);
export { W as default };
