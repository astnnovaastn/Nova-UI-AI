import { $ as e, A as t, B as n, Dt as r, F as i, Ft as a, G as o, H as s, K as c, M as l, Ot as u, R as d, Rt as f, S as p, V as m, _t as h, dt as g, ft as _, h as v, ht as y, ot as b, q as x, r as S, ut as C, yt as w } from "./index-client-C_2wYFnt.js";
import "./disclose-version-DFvUDwEH.js";
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
var B = s("<p role=\"alert\"> </p>"), V = s("<button type=\"button\"> <svg viewBox=\"0 0 8 8\" aria-hidden=\"true\"><path d=\"M1.5 5 4 2.5 6.5 5\"></path></svg></button>"), H = s("<th scope=\"col\"><!></th>"), U = s("<th scope=\"col\" class=\"svelte-14uwvhg\"><span class=\"sr-only svelte-14uwvhg\"> </span></th>"), W = s("<td><!></td>"), G = s("<td class=\"svelte-14uwvhg\"><!></td>"), K = s("<tr><th scope=\"row\" class=\"svelte-14uwvhg\"><!></th><!><!></tr>"), q = s("<tr><td class=\"svelte-14uwvhg\"> </td></tr>"), ee = s("<div class=\"pagination svelte-14uwvhg\"><span role=\"status\"> </span> <div class=\"svelte-14uwvhg\"><button type=\"button\" class=\"svelte-14uwvhg\"> </button><button type=\"button\" class=\"svelte-14uwvhg\"> </button></div></div>"), te = s("<div role=\"region\" tabindex=\"0\"><table class=\"svelte-14uwvhg\"><caption> </caption><thead class=\"svelte-14uwvhg\"><tr><th scope=\"col\" class=\"svelte-14uwvhg\"><!></th><!><!></tr></thead><tbody class=\"svelte-14uwvhg\"></tbody></table></div> <!>", 1);
function J(s, c) {
	u(c, !0);
	let T = S(c, "pageSize", 3, 25), E = S(c, "showCaption", 3, !0), D = S(c, "headSortable", 3, !1), O = S(c, "sort", 15, null), k = S(c, "plain", 3, !1), A = h(0), j = w(() => Number.isFinite(T()) ? Math.max(1, Math.min(100, Math.floor(T()))) : 25), M = w(() => z(c.rows, c.columns)), N = w(() => Math.max(1, Math.ceil(c.rows.length / e(j)))), P = w(() => Math.min(e(A), e(N) - 1)), F = w(() => e(P) * e(j)), I = w(() => R(c.rows, O())), L = w(() => e(M) ? c.limit === void 0 ? e(I).slice(e(F), e(F) + e(j)) : e(I).slice(0, Math.max(0, c.limit)) : []);
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
	var X = m(), Z = g(X), Q = (e) => {
		var t = B(), r = C(t, !0);
		a(t), b(() => d(r, c.labels.unavailable)), n(e, t);
	}, $ = (r) => {
		let s = (e, t = f, r = f, s = f) => {
			var c = m(), l = g(c), u = (e) => {
				var i = V();
				let o;
				var s = C(i, !0), c = _(s);
				let l;
				a(i), b(() => {
					o = p(i, 1, "sort svelte-14uwvhg", null, o, { on: O()?.key === t() }), d(s, r()), l = p(c, 0, "svelte-14uwvhg", null, l, { down: O()?.descending });
				}), x("click", i, () => J(t())), n(e, i);
			}, h = (e) => {
				var t = o();
				b(() => d(t, r())), n(e, t);
			};
			i(l, (e) => {
				s() ? e(u) : e(h, -1);
			}), n(e, c);
		};
		var u = te(), h = g(u);
		let S;
		var w = C(h), T = C(w);
		let j;
		var M = C(T, !0);
		a(T);
		var I = _(T), R = C(I), z = C(R);
		s(C(z), () => "", () => c.labels.rowHeading, D), a(z);
		var B = _(z);
		l(B, 17, () => c.columns, (e) => e.key, (t, r) => {
			var i = H();
			let o;
			var c = C(i);
			s(c, () => e(r).key, () => e(r).label, () => !!e(r).sortable), a(i), b((t) => {
				v(i, "aria-sort", t), o = p(i, 1, "svelte-14uwvhg", null, o, {
					numeric: e(r).numeric,
					centered: e(r).centered
				});
			}, [() => Y(e(r).key)]), n(t, i);
		});
		var X = _(B), Z = (e) => {
			var t = U(), r = C(t), i = C(r, !0);
			a(r), a(t), b(() => d(i, c.labels.actions)), n(e, t);
		};
		i(X, (e) => {
			c.actions && e(Z);
		}), a(R), a(I);
		var Q = _(I);
		l(Q, 21, () => e(L), (e) => e.key, (r, s) => {
			var u = K(), f = C(u), h = C(f), y = (r) => {
				var i = m(), a = g(i);
				t(a, () => c.head, () => e(s)), n(r, i);
			}, x = (t) => {
				var r = o();
				b(() => d(r, e(s).label)), n(t, r);
			};
			i(h, (e) => {
				c.head ? e(y) : e(x, -1);
			}), a(f);
			var S = _(f);
			l(S, 17, () => c.columns, (e) => e.key, (r, l) => {
				var u = W();
				let f;
				var h = C(u), _ = (r) => {
					var i = m(), a = g(i);
					t(a, () => c.cell, () => e(s), () => e(l)), n(r, i);
				}, v = (t) => {
					var r = o();
					b(() => d(r, e(s).cells[e(l).key] ?? c.labels.missing)), n(t, r);
				};
				i(h, (e) => {
					c.cell ? e(_) : e(v, -1);
				}), a(u), b(() => f = p(u, 1, "svelte-14uwvhg", null, f, {
					numeric: e(l).numeric,
					centered: e(l).centered
				})), n(r, u);
			});
			var w = _(S), T = (r) => {
				var i = G(), o = C(i);
				t(o, () => c.actions, () => e(s)), a(i), n(r, i);
			};
			i(w, (e) => {
				c.actions && e(T);
			}), a(u), b(() => v(u, "data-row-key", e(s).key)), n(r, u);
		}, (e) => {
			var t = q(), r = C(t), i = C(r, !0);
			a(r), a(t), b(() => {
				v(r, "colspan", c.columns.length + 1 + +!!c.actions), d(i, c.labels.empty);
			}), n(e, t);
		}), a(Q), a(w), a(h);
		var $ = _(h, 2), ne = (t) => {
			var r = ee(), i = C(r), o = C(i, !0);
			a(i);
			var s = _(i, 2), l = C(s), u = C(l, !0);
			a(l);
			var f = _(l), p = C(f, !0);
			a(f), a(s), a(r), b((t) => {
				d(o, t), l.disabled = e(P) === 0, d(u, c.labels.previous), f.disabled = e(P) === e(N) - 1, d(p, c.labels.next);
			}, [() => c.labels.range(e(F) + 1, e(F) + e(L).length, c.rows.length)]), x("click", l, () => y(A, e(P) - 1)), x("click", f, () => y(A, e(P) + 1)), n(t, r);
		};
		i($, (t) => {
			e(N) > 1 && c.limit === void 0 && t(ne);
		}), b((e) => {
			S = p(h, 1, "table-scroll svelte-14uwvhg", null, S, { plain: k() }), v(h, "aria-label", c.caption), j = p(T, 1, "svelte-14uwvhg", null, j, { "sr-only": !E() }), d(M, c.caption), v(z, "aria-sort", e);
		}, [() => Y("")]), n(r, u);
	};
	i(Z, (t) => {
		e(M) ? t($, -1) : t(Q);
	}), n(s, X), r();
}
c(["click"]);
// upstream/src/features/work/lib/board/versus.ts
function Y(e) {
	if (e.columns[0]?.kind !== "entity" || e.rows.length < 2 || e.rows.length > 5) return !1;
	let t = e.columns.filter((t, n) => n > 0 && e.rows.some((e) => (e.cells[n] ?? "").trim()));
	return t.length >= 2 && t.length <= 10;
}
export { N as a, D as c, F as i, J as n, j as o, L as r, k as s, Y as t };
