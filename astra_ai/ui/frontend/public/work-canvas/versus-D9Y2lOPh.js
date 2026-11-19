import { B as e, Ct as t, H as n, J as r, L as i, M as a, Mt as o, P as s, S as c, U as l, W as u, Wt as d, Y as f, bt as p, h as m, ht as h, jt as g, lt as _, mt as v, pt as y, q as b, r as x, tt as S, vt as C, zt as w } from "./index-client-DH73-vTM.js";
import "./disclose-version-7ONGmeVC.js";
import { t as T } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_actions.js
var E = () => "Actions", D = ((e = {}, t = {}) => (t.locale ?? T(), E(e))), O = () => "This content cannot be displayed safely or exceeds the view limits.", k = ((e = {}, t = {}) => (t.locale ?? T(), O(e))), A = () => "No data available.", j = ((e = {}, t = {}) => (t.locale ?? T(), A(e))), M = () => "Next", N = ((e = {}, t = {}) => (t.locale ?? T(), M(e))), P = () => "Previous", F = ((e = {}, t = {}) => (t.locale ?? T(), P(e))), I = (e) => `${e?.first}–${e?.last} of ${e?.total}`, L = ((e, t = {}) => (t.locale ?? T(), I(e)));
// upstream/src/shared/ui/data/DataTable/table.ts
function R(e, t) {
	if (!t) return e;
	let n = (e) => t.key === "" ? e.label : e.sort?.[t.key] ?? e.cells[t.key] ?? null;
	return [...e].sort((e, r) => {
		let i = n(e), a = n(r);
		if (i === null || a === null) return i === a ? 0 : i === null ? 1 : -1;
		let o = typeof i == "number" && typeof a == "number" ? i - a : String(i).localeCompare(String(a), void 0, { numeric: !0 });
		return t.descending ? -o : o;
	});
}
function z(e, t) {
	return e.length <= 1e4 && t.length <= 32 && new Set(e.map((e) => e.key)).size === e.length && new Set(t.map((e) => e.key)).size === t.length;
}
// upstream/src/shared/ui/data/DataTable/DataTable.svelte
var B = u("<p role=\"alert\"> </p>"), V = u("<button type=\"button\"> <svg viewBox=\"0 0 8 8\" aria-hidden=\"true\"><path d=\"M1.5 5 4 2.5 6.5 5\"></path></svg></button>"), H = u("<th scope=\"col\"><!></th>"), U = u("<th scope=\"col\" class=\"svelte-14uwvhg\"><span class=\"sr-only svelte-14uwvhg\"> </span></th>"), W = u("<td><!></td>"), G = u("<td class=\"svelte-14uwvhg\"><!></td>"), K = u("<tr><th scope=\"row\" class=\"svelte-14uwvhg\"><!></th><!><!></tr>"), q = u("<tr><td class=\"svelte-14uwvhg\"> </td></tr>"), ee = u("<div class=\"pagination svelte-14uwvhg\"><span role=\"status\"> </span> <div class=\"svelte-14uwvhg\"><button type=\"button\" class=\"svelte-14uwvhg\"> </button><button type=\"button\" class=\"svelte-14uwvhg\"> </button></div></div>"), te = u("<div role=\"region\" tabindex=\"0\"><table class=\"svelte-14uwvhg\"><caption> </caption><thead class=\"svelte-14uwvhg\"><tr><th scope=\"col\" class=\"svelte-14uwvhg\"><!></th><!><!></tr></thead><tbody class=\"svelte-14uwvhg\"></tbody></table></div> <!>", 1);
function J(r, u) {
	o(u, !0);
	let T = x(u, "pageSize", 3, 25), E = x(u, "showCaption", 3, !0), D = x(u, "headSortable", 3, !1), O = x(u, "sort", 15, null), k = x(u, "plain", 3, !1), A = p(0), j = t(() => Number.isFinite(T()) ? Math.max(1, Math.min(100, Math.floor(T()))) : 25), M = t(() => z(u.rows, u.columns)), N = t(() => Math.max(1, Math.ceil(u.rows.length / S(j)))), P = t(() => Math.min(S(A), S(N) - 1)), F = t(() => S(P) * S(j)), I = t(() => R(u.rows, O())), L = t(() => S(M) ? u.limit === void 0 ? S(I).slice(S(F), S(F) + S(j)) : S(I).slice(0, Math.max(0, u.limit)) : []);
	function J(e) {
		O(O()?.key === e ? O().descending ? null : {
			key: e,
			descending: !0
		} : {
			key: e,
			descending: !1
		});
	}
	let Y = (e) => O()?.key === e ? O().descending ? "descending" : "ascending" : void 0;
	var X = l(), Z = v(X), Q = (t) => {
		var r = B(), i = y(r, !0);
		w(r), _(() => e(i, u.labels.unavailable)), n(t, r);
	}, $ = (t) => {
		let r = (t, r = d, a = d, o = d) => {
			var s = l(), u = v(s), p = (t) => {
				var i = V();
				let o;
				var s = y(i, !0), l = h(s);
				let u;
				w(i), _(() => {
					o = c(i, 1, "sort svelte-14uwvhg", null, o, { on: O()?.key === r() }), e(s, a()), u = c(l, 0, "svelte-14uwvhg", null, u, { down: O()?.descending });
				}), f("click", i, () => J(r())), n(t, i);
			}, m = (t) => {
				var r = b();
				_(() => e(r, a())), n(t, r);
			};
			i(u, (e) => {
				o() ? e(p) : e(m, -1);
			}), n(t, s);
		};
		var o = te(), p = v(o);
		let g;
		var x = y(p), T = y(x);
		let j;
		var M = y(T, !0);
		w(T);
		var I = h(T), R = y(I), z = y(R);
		r(y(z), () => "", () => u.labels.rowHeading, D), w(z);
		var B = h(z);
		s(B, 17, () => u.columns, (e) => e.key, (e, t) => {
			var i = H();
			let a;
			var o = y(i);
			r(o, () => S(t).key, () => S(t).label, () => !!S(t).sortable), w(i), _((e) => {
				m(i, "aria-sort", e), a = c(i, 1, "svelte-14uwvhg", null, a, {
					numeric: S(t).numeric,
					centered: S(t).centered
				});
			}, [() => Y(S(t).key)]), n(e, i);
		});
		var X = h(B), Z = (t) => {
			var r = U(), i = y(r), a = y(i, !0);
			w(i), w(r), _(() => e(a, u.labels.actions)), n(t, r);
		};
		i(X, (e) => {
			u.actions && e(Z);
		}), w(R), w(I);
		var Q = h(I);
		s(Q, 21, () => S(L), (e) => e.key, (t, r) => {
			var o = K(), d = y(o), f = y(d), p = (e) => {
				var t = l(), i = v(t);
				a(i, () => u.head, () => S(r)), n(e, t);
			}, g = (t) => {
				var i = b();
				_(() => e(i, S(r).label)), n(t, i);
			};
			i(f, (e) => {
				u.head ? e(p) : e(g, -1);
			}), w(d);
			var x = h(d);
			s(x, 17, () => u.columns, (e) => e.key, (t, o) => {
				var s = W();
				let d;
				var f = y(s), p = (e) => {
					var t = l(), i = v(t);
					a(i, () => u.cell, () => S(r), () => S(o)), n(e, t);
				}, m = (t) => {
					var i = b();
					_(() => e(i, S(r).cells[S(o).key] ?? u.labels.missing)), n(t, i);
				};
				i(f, (e) => {
					u.cell ? e(p) : e(m, -1);
				}), w(s), _(() => d = c(s, 1, "svelte-14uwvhg", null, d, {
					numeric: S(o).numeric,
					centered: S(o).centered
				})), n(t, s);
			});
			var C = h(x), T = (e) => {
				var t = G(), i = y(t);
				a(i, () => u.actions, () => S(r)), w(t), n(e, t);
			};
			i(C, (e) => {
				u.actions && e(T);
			}), w(o), _(() => m(o, "data-row-key", S(r).key)), n(t, o);
		}, (t) => {
			var r = q(), i = y(r), a = y(i, !0);
			w(i), w(r), _(() => {
				m(i, "colspan", u.columns.length + 1 + +!!u.actions), e(a, u.labels.empty);
			}), n(t, r);
		}), w(Q), w(x), w(p);
		var $ = h(p, 2), ne = (t) => {
			var r = ee(), i = y(r), a = y(i, !0);
			w(i);
			var o = h(i, 2), s = y(o), c = y(s, !0);
			w(s);
			var l = h(s), d = y(l, !0);
			w(l), w(o), w(r), _((t) => {
				e(a, t), s.disabled = S(P) === 0, e(c, u.labels.previous), l.disabled = S(P) === S(N) - 1, e(d, u.labels.next);
			}, [() => u.labels.range(S(F) + 1, S(F) + S(L).length, u.rows.length)]), f("click", s, () => C(A, S(P) - 1)), f("click", l, () => C(A, S(P) + 1)), n(t, r);
		};
		i($, (e) => {
			S(N) > 1 && u.limit === void 0 && e(ne);
		}), _((t) => {
			g = c(p, 1, "table-scroll svelte-14uwvhg", null, g, { plain: k() }), m(p, "aria-label", u.caption), j = c(T, 1, "svelte-14uwvhg", null, j, { "sr-only": !E() }), e(M, u.caption), m(z, "aria-sort", t);
		}, [() => Y("")]), n(t, o);
	};
	i(Z, (e) => {
		S(M) ? e($, -1) : e(Q);
	}), n(r, X), g();
}
r(["click"]);
// upstream/src/features/work/lib/board/versus.ts
function Y(e) {
	if (e.columns[0]?.kind !== "entity" || e.rows.length < 2 || e.rows.length > 5) return !1;
	let t = e.columns.filter((t, n) => n > 0 && e.rows.some((e) => (e.cells[n] ?? "").trim()));
	return t.length >= 2 && t.length <= 10;
}
export { N as a, D as c, F as i, J as n, j as o, L as r, k as s, Y as t };
