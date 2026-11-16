import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Ct as n, Dt as r, F as i, Ft as a, H as o, J as s, K as c, M as l, N as u, Ot as d, R as f, V as p, _t as m, dt as h, ft as g, h as _, ht as v, ot as y, q as b, r as x, s as S, tt as C, u as w, ut as T, yt as E } from "./index-client-C_2wYFnt.js";
import { t as D } from "./Inline-hs44HAd0.js";
import { n as O } from "./markdown-C0lHpopA.js";
import { t as k } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_note_empty.js
var A = () => "Write something", j = ((e = {}, t = {}) => (t.locale ?? k(), A(e))), M = () => "Note", N = ((e = {}, t = {}) => (t.locale ?? k(), M(e))), P = o("<textarea class=\"nodrag nopan nowheel svelte-1wug6d5\"></textarea>"), F = o("<h3 class=\"svelte-1wug6d5\"><!></h3>"), I = o("<li><!></li>"), L = o("<ul class=\"svelte-1wug6d5\"></ul>"), R = o("<br/>"), z = o("<!><!>", 1), B = o("<p class=\"svelte-1wug6d5\"></p>"), V = o("<p class=\"empty svelte-1wug6d5\"> </p>"), H = o("<div class=\"text svelte-1wug6d5\"></div>"), U = o("<div class=\"note svelte-1wug6d5\"><!></div>");
function W(o, c) {
	d(c, !0);
	let k = x(c, "actions", 19, () => ({})), A = m(!1), M = m(""), W = m(void 0), G = E(() => O(c.object.markdown));
	async function K() {
		k().write && (v(M, c.object.markdown, !0), v(A, !0), await C(), e(W)?.focus(), J());
	}
	function q() {
		v(A, !1), e(M) !== c.object.markdown && k().write?.(c.object.id, e(M));
	}
	function J() {
		e(W) && (e(W).style.blockSize = "auto", e(W).style.blockSize = `${e(W).scrollHeight}px`);
	}
	var Y = U(), X = T(Y), Z = (r) => {
		var i = P();
		n(i), S(i, (e) => v(W, e), () => e(W)), y((e) => _(i, "aria-label", e), [() => N()]), b("input", i, J), s("blur", i, q), b("keydown", i, (t) => {
			t.key === "Escape" && (t.preventDefault(), e(W)?.blur());
		}), w(i, () => e(M), (e) => v(M, e)), t(r, i);
	}, Q = (n) => {
		var r = H();
		l(r, 21, () => e(G), u, (n, r) => {
			var o = p(), s = h(o), c = (n) => {
				var i = F(), o = T(i);
				D(o, { get text() {
					return e(r).text;
				} }), a(i), t(n, i);
			}, d = (n) => {
				var i = L();
				l(i, 21, () => e(r).items, u, (n, r) => {
					var i = I(), o = T(i);
					D(o, { get text() {
						return e(r);
					} }), a(i), t(n, i);
				}), a(i), t(n, i);
			}, f = (n) => {
				var o = B();
				l(o, 21, () => e(r).lines, u, (n, r, a) => {
					var o = z(), s = h(o), c = (e) => {
						var n = R();
						t(e, n);
					};
					i(s, (e) => {
						a && e(c);
					});
					var l = g(s);
					D(l, { get text() {
						return e(r);
					} }), t(n, o);
				}), a(o), t(n, o);
			};
			i(s, (t) => {
				e(r).kind === "heading" ? t(c) : e(r).kind === "list" ? t(d, 1) : t(f, -1);
			}), t(n, o);
		}, (e) => {
			var n = V(), r = T(n, !0);
			a(n), y((e) => f(r, e), [() => j()]), t(e, n);
		}), a(r), y(() => {
			_(r, "role", k().write ? "button" : void 0), _(r, "tabindex", k().write ? 0 : void 0);
		}), b("click", r, K), b("keydown", r, (e) => {
			e.key === "Enter" && K();
		}), t(n, r);
	};
	i(X, (t) => {
		e(A) ? t(Z) : t(Q, -1);
	}), a(Y), t(o, Y), r();
}
c([
	"input",
	"keydown",
	"click"
]);
export { W as default };
