import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Et as n, F as r, H as i, J as a, K as o, M as s, N as c, Nt as l, Q as u, R as d, Tt as f, V as p, _t as m, ct as h, h as g, ht as _, it as v, lt as y, pt as b, q as x, r as S, s as C, u as w, ut as T, xt as E } from "./index-client-oI5R0J23.js";
import { t as D } from "./Inline-CZHzvbEf.js";
import { n as O } from "./markdown-C0lHpopA.js";
import { t as k } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_note_empty.js
var A = () => "Write something", j = ((e = {}, t = {}) => (t.locale ?? k(), A(e))), M = () => "Note", N = ((e = {}, t = {}) => (t.locale ?? k(), M(e))), P = i("<textarea class=\"nodrag nopan nowheel svelte-1wug6d5\"></textarea>"), F = i("<h3 class=\"svelte-1wug6d5\"><!></h3>"), I = i("<li><!></li>"), L = i("<ul class=\"svelte-1wug6d5\"></ul>"), R = i("<br/>"), z = i("<!><!>", 1), B = i("<p class=\"svelte-1wug6d5\"></p>"), V = i("<p class=\"empty svelte-1wug6d5\"> </p>"), H = i("<div class=\"text svelte-1wug6d5\"></div>"), U = i("<div class=\"note svelte-1wug6d5\"><!></div>");
function W(i, o) {
	n(o, !0);
	let k = S(o, "actions", 19, () => ({})), A = _(!1), M = _(""), W = _(void 0), G = m(() => O(o.object.markdown));
	async function K() {
		k().write && (b(M, o.object.markdown, !0), b(A, !0), await e(), u(W)?.focus(), J());
	}
	function q() {
		b(A, !1), u(M) !== o.object.markdown && k().write?.(o.object.id, u(M));
	}
	function J() {
		u(W) && (u(W).style.blockSize = "auto", u(W).style.blockSize = `${u(W).scrollHeight}px`);
	}
	var Y = U(), X = h(Y), Z = (e) => {
		var n = P();
		E(n), C(n, (e) => b(W, e), () => u(W)), v((e) => g(n, "aria-label", e), [() => N()]), x("input", n, J), a("blur", n, q), x("keydown", n, (e) => {
			e.key === "Escape" && (e.preventDefault(), u(W)?.blur());
		}), w(n, () => u(M), (e) => b(M, e)), t(e, n);
	}, Q = (e) => {
		var n = H();
		s(n, 21, () => u(G), c, (e, n) => {
			var i = p(), a = y(i), o = (e) => {
				var r = F(), i = h(r);
				D(i, { get text() {
					return u(n).text;
				} }), l(r), t(e, r);
			}, d = (e) => {
				var r = L();
				s(r, 21, () => u(n).items, c, (e, n) => {
					var r = I(), i = h(r);
					D(i, { get text() {
						return u(n);
					} }), l(r), t(e, r);
				}), l(r), t(e, r);
			}, f = (e) => {
				var i = B();
				s(i, 21, () => u(n).lines, c, (e, n, i) => {
					var a = z(), o = y(a), s = (e) => {
						var n = R();
						t(e, n);
					};
					r(o, (e) => {
						i && e(s);
					});
					var c = T(o);
					D(c, { get text() {
						return u(n);
					} }), t(e, a);
				}), l(i), t(e, i);
			};
			r(a, (e) => {
				u(n).kind === "heading" ? e(o) : u(n).kind === "list" ? e(d, 1) : e(f, -1);
			}), t(e, i);
		}, (e) => {
			var n = V(), r = h(n, !0);
			l(n), v((e) => d(r, e), [() => j()]), t(e, n);
		}), l(n), v(() => {
			g(n, "role", k().write ? "button" : void 0), g(n, "tabindex", k().write ? 0 : void 0);
		}), x("click", n, K), x("keydown", n, (e) => {
			e.key === "Enter" && K();
		}), t(e, n);
	};
	r(X, (e) => {
		u(A) ? e(Z) : e(Q, -1);
	}), l(Y), t(i, Y), f();
}
o([
	"input",
	"keydown",
	"click"
]);
export { W as default };
