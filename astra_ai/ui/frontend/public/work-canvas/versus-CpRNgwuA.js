import { At as e, Ct as t, D as n, F as r, H as i, L as a, M as o, Nt as s, R as c, St as l, U as u, W as d, Y as f, at as p, ft as m, k as h, m as g, mt as _, ot as v, r as y, st as b, tt as x, ut as S, y as C, z as w } from "./index-client-BSGo5gVb.js";
import "./disclose-version-DFvUDwEH.js";
import { t as T } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/ui/data/DataTable/table.ts
function E(e, t) {
	if (!t) return e;
	let n = (e) => t.key === "" ? e.label : e.sort?.[t.key] ?? e.cells[t.key] ?? null;
	return [...e].sort((e, r) => {
		let i = n(e), a = n(r);
		if (i === null || a === null) return i === a ? 0 : i === null ? 1 : -1;
		let o = typeof i == "number" && typeof a == "number" ? i - a : String(i).localeCompare(String(a), void 0, { numeric: !0 });
		return t.descending ? -o : o;
	});
}
function D(e, t) {
	return e.length <= 1e4 && t.length <= 32 && new Set(e.map((e) => e.key)).size === e.length && new Set(t.map((e) => e.key)).size === t.length;
}
// upstream/src/shared/ui/data/DataTable/DataTable.svelte
var O = w("<p role=\"alert\"> </p>"), k = w("<button type=\"button\"> <svg viewBox=\"0 0 8 8\" aria-hidden=\"true\"><path d=\"M1.5 5 4 2.5 6.5 5\"></path></svg></button>"), ee = w("<th scope=\"col\"><!></th>"), te = w("<th scope=\"col\" class=\"svelte-14uwvhg\"><span class=\"sr-only svelte-14uwvhg\"> </span></th>"), A = w("<td><!></td>"), j = w("<td class=\"svelte-14uwvhg\"><!></td>"), M = w("<tr><th scope=\"row\" class=\"svelte-14uwvhg\"><!></th><!><!></tr>"), N = w("<tr><td class=\"svelte-14uwvhg\"> </td></tr>"), P = w("<div class=\"pagination svelte-14uwvhg\"><span role=\"status\"> </span> <div class=\"svelte-14uwvhg\"><button type=\"button\" class=\"svelte-14uwvhg\"> </button><button type=\"button\" class=\"svelte-14uwvhg\"> </button></div></div>"), F = w("<div role=\"region\" tabindex=\"0\"><table class=\"svelte-14uwvhg\"><caption> </caption><thead class=\"svelte-14uwvhg\"><tr><th scope=\"col\" class=\"svelte-14uwvhg\"><!></th><!><!></tr></thead><tbody class=\"svelte-14uwvhg\"></tbody></table></div> <!>", 1);
function I(u, w) {
	t(w, !0);
	let T = y(w, "pageSize", 3, 25), I = y(w, "showCaption", 3, !0), L = y(w, "headSortable", 3, !1), R = y(w, "sort", 15, null), z = y(w, "plain", 3, !1), B = m(0), V = _(() => Number.isFinite(T()) ? Math.max(1, Math.min(100, Math.floor(T()))) : 25), H = _(() => D(w.rows, w.columns)), U = _(() => Math.max(1, Math.ceil(w.rows.length / f(V)))), W = _(() => Math.min(f(B), f(U) - 1)), G = _(() => f(W) * f(V)), K = _(() => E(w.rows, R())), q = _(() => f(H) ? w.limit === void 0 ? f(K).slice(f(G), f(G) + f(V)) : f(K).slice(0, Math.max(0, w.limit)) : []);
	function J(e) {
		R(R()?.key === e ? R().descending ? null : {
			key: e,
			descending: !0
		} : {
			key: e,
			descending: !1
		});
	}
	let Y = (e) => R()?.key === e ? R().descending ? "descending" : "ascending" : void 0;
	var X = c(), Z = v(X), Q = (t) => {
		var n = O(), i = p(n, !0);
		e(n), x(() => r(i, w.labels.unavailable)), a(t, n);
	}, $ = (t) => {
		let l = (t, n = s, l = s, u = s) => {
			var f = c(), m = v(f), h = (t) => {
				var i = k();
				let o;
				var s = p(i, !0), c = b(s);
				let u;
				e(i), x(() => {
					o = C(i, 1, "sort svelte-14uwvhg", null, o, { on: R()?.key === n() }), r(s, l()), u = C(c, 0, "svelte-14uwvhg", null, u, { down: R()?.descending });
				}), d("click", i, () => J(n())), a(t, i);
			}, g = (e) => {
				var t = i();
				x(() => r(t, l())), a(e, t);
			};
			o(m, (e) => {
				u() ? e(h) : e(g, -1);
			}), a(t, f);
		};
		var u = F(), m = v(u);
		let _;
		var y = p(m), T = p(y);
		let E;
		var D = p(T, !0);
		e(T);
		var O = b(T), V = p(O), H = p(V);
		l(p(H), () => "", () => w.labels.rowHeading, L), e(H);
		var K = b(H);
		h(K, 17, () => w.columns, (e) => e.key, (t, n) => {
			var r = ee();
			let i;
			var o = p(r);
			l(o, () => f(n).key, () => f(n).label, () => !!f(n).sortable), e(r), x((e) => {
				g(r, "aria-sort", e), i = C(r, 1, "svelte-14uwvhg", null, i, {
					numeric: f(n).numeric,
					centered: f(n).centered
				});
			}, [() => Y(f(n).key)]), a(t, r);
		});
		var X = b(K), Z = (t) => {
			var n = te(), i = p(n), o = p(i, !0);
			e(i), e(n), x(() => r(o, w.labels.actions)), a(t, n);
		};
		o(X, (e) => {
			w.actions && e(Z);
		}), e(V), e(O);
		var Q = b(O);
		h(Q, 21, () => f(q), (e) => e.key, (t, s) => {
			var l = M(), u = p(l), d = p(u), m = (e) => {
				var t = c(), r = v(t);
				n(r, () => w.head, () => f(s)), a(e, t);
			}, _ = (e) => {
				var t = i();
				x(() => r(t, f(s).label)), a(e, t);
			};
			o(d, (e) => {
				w.head ? e(m) : e(_, -1);
			}), e(u);
			var y = b(u);
			h(y, 17, () => w.columns, (e) => e.key, (t, l) => {
				var u = A();
				let d;
				var m = p(u), h = (e) => {
					var t = c(), r = v(t);
					n(r, () => w.cell, () => f(s), () => f(l)), a(e, t);
				}, g = (e) => {
					var t = i();
					x(() => r(t, f(s).cells[f(l).key] ?? w.labels.missing)), a(e, t);
				};
				o(m, (e) => {
					w.cell ? e(h) : e(g, -1);
				}), e(u), x(() => d = C(u, 1, "svelte-14uwvhg", null, d, {
					numeric: f(l).numeric,
					centered: f(l).centered
				})), a(t, u);
			});
			var S = b(y), T = (t) => {
				var r = j(), i = p(r);
				n(i, () => w.actions, () => f(s)), e(r), a(t, r);
			};
			o(S, (e) => {
				w.actions && e(T);
			}), e(l), x(() => g(l, "data-row-key", f(s).key)), a(t, l);
		}, (t) => {
			var n = N(), i = p(n), o = p(i, !0);
			e(i), e(n), x(() => {
				g(i, "colspan", w.columns.length + 1 + +!!w.actions), r(o, w.labels.empty);
			}), a(t, n);
		}), e(Q), e(y), e(m);
		var $ = b(m, 2), ne = (t) => {
			var n = P(), i = p(n), o = p(i, !0);
			e(i);
			var s = b(i, 2), c = p(s), l = p(c, !0);
			e(c);
			var u = b(c), m = p(u, !0);
			e(u), e(s), e(n), x((e) => {
				r(o, e), c.disabled = f(W) === 0, r(l, w.labels.previous), u.disabled = f(W) === f(U) - 1, r(m, w.labels.next);
			}, [() => w.labels.range(f(G) + 1, f(G) + f(q).length, w.rows.length)]), d("click", c, () => S(B, f(W) - 1)), d("click", u, () => S(B, f(W) + 1)), a(t, n);
		};
		o($, (e) => {
			f(U) > 1 && w.limit === void 0 && e(ne);
		}), x((e) => {
			_ = C(m, 1, "table-scroll svelte-14uwvhg", null, _, { plain: z() }), g(m, "aria-label", w.caption), E = C(T, 1, "svelte-14uwvhg", null, E, { "sr-only": !I() }), r(D, w.caption), g(H, "aria-sort", e);
		}, [() => Y("")]), a(t, u);
	};
	o(Z, (e) => {
		f(H) ? e($, -1) : e(Q);
	}), a(u, X), l();
}
u(["click"]);
// upstream/src/shared/i18n/messages/work_actions.js
var L = () => "Actions", R = ((e = {}, t = {}) => (t.locale ?? T(), L(e))), z = () => "This content cannot be displayed safely or exceeds the view limits.", B = ((e = {}, t = {}) => (t.locale ?? T(), z(e))), V = () => "No data available.", H = ((e = {}, t = {}) => (t.locale ?? T(), V(e))), U = () => "Next", W = ((e = {}, t = {}) => (t.locale ?? T(), U(e))), G = () => "Previous", K = ((e = {}, t = {}) => (t.locale ?? T(), G(e))), q = (e) => `${e?.first}–${e?.last} of ${e?.total}`, J = ((e, t = {}) => (t.locale ?? T(), q(e)));
// upstream/src/features/work/lib/board/versus.ts
function Y(e) {
	if (e.columns[0]?.kind !== "entity" || e.rows.length < 2 || e.rows.length > 5) return !1;
	let t = e.columns.filter((t, n) => n > 0 && e.rows.some((e) => (e.cells[n] ?? "").trim()));
	return t.length >= 2 && t.length <= 10;
}
export { H as a, I as c, W as i, J as n, B as o, K as r, R as s, Y as t };
