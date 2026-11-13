import { A as e, B as t, Et as n, F as r, G as i, H as a, It as o, K as s, M as c, Nt as l, Q as u, R as d, S as f, Tt as p, V as m, _t as h, ct as g, h as _, ht as v, it as y, lt as b, pt as x, q as S, r as C, ut as w } from "./index-client-oI5R0J23.js";
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
var O = a("<p role=\"alert\"> </p>"), ee = a("<button type=\"button\"> <svg viewBox=\"0 0 8 8\" aria-hidden=\"true\"><path d=\"M1.5 5 4 2.5 6.5 5\"></path></svg></button>"), te = a("<th scope=\"col\"><!></th>"), k = a("<th scope=\"col\" class=\"svelte-14uwvhg\"><span class=\"sr-only svelte-14uwvhg\"> </span></th>"), A = a("<td><!></td>"), j = a("<td class=\"svelte-14uwvhg\"><!></td>"), M = a("<tr><th scope=\"row\" class=\"svelte-14uwvhg\"><!></th><!><!></tr>"), N = a("<tr><td class=\"svelte-14uwvhg\"> </td></tr>"), P = a("<div class=\"pagination svelte-14uwvhg\"><span role=\"status\"> </span> <div class=\"svelte-14uwvhg\"><button type=\"button\" class=\"svelte-14uwvhg\"> </button><button type=\"button\" class=\"svelte-14uwvhg\"> </button></div></div>"), F = a("<div role=\"region\" tabindex=\"0\"><table class=\"svelte-14uwvhg\"><caption> </caption><thead class=\"svelte-14uwvhg\"><tr><th scope=\"col\" class=\"svelte-14uwvhg\"><!></th><!><!></tr></thead><tbody class=\"svelte-14uwvhg\"></tbody></table></div> <!>", 1);
function I(a, s) {
	n(s, !0);
	let T = C(s, "pageSize", 3, 25), I = C(s, "showCaption", 3, !0), L = C(s, "headSortable", 3, !1), R = C(s, "sort", 15, null), z = C(s, "plain", 3, !1), B = v(0), V = h(() => Number.isFinite(T()) ? Math.max(1, Math.min(100, Math.floor(T()))) : 25), H = h(() => D(s.rows, s.columns)), U = h(() => Math.max(1, Math.ceil(s.rows.length / u(V)))), W = h(() => Math.min(u(B), u(U) - 1)), G = h(() => u(W) * u(V)), K = h(() => E(s.rows, R())), q = h(() => u(H) ? s.limit === void 0 ? u(K).slice(u(G), u(G) + u(V)) : u(K).slice(0, Math.max(0, s.limit)) : []);
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
	var X = m(), Z = b(X), Q = (e) => {
		var n = O(), r = g(n, !0);
		l(n), y(() => d(r, s.labels.unavailable)), t(e, n);
	}, $ = (n) => {
		let a = (e, n = o, a = o, s = o) => {
			var c = m(), u = b(c), p = (e) => {
				var r = ee();
				let i;
				var o = g(r, !0), s = w(o);
				let c;
				l(r), y(() => {
					i = f(r, 1, "sort svelte-14uwvhg", null, i, { on: R()?.key === n() }), d(o, a()), c = f(s, 0, "svelte-14uwvhg", null, c, { down: R()?.descending });
				}), S("click", r, () => J(n())), t(e, r);
			}, h = (e) => {
				var n = i();
				y(() => d(n, a())), t(e, n);
			};
			r(u, (e) => {
				s() ? e(p) : e(h, -1);
			}), t(e, c);
		};
		var p = F(), h = b(p);
		let v;
		var C = g(h), T = g(C);
		let E;
		var D = g(T, !0);
		l(T);
		var O = w(T), V = g(O), H = g(V);
		a(g(H), () => "", () => s.labels.rowHeading, L), l(H);
		var K = w(H);
		c(K, 17, () => s.columns, (e) => e.key, (e, n) => {
			var r = te();
			let i;
			var o = g(r);
			a(o, () => u(n).key, () => u(n).label, () => !!u(n).sortable), l(r), y((e) => {
				_(r, "aria-sort", e), i = f(r, 1, "svelte-14uwvhg", null, i, {
					numeric: u(n).numeric,
					centered: u(n).centered
				});
			}, [() => Y(u(n).key)]), t(e, r);
		});
		var X = w(K), Z = (e) => {
			var n = k(), r = g(n), i = g(r, !0);
			l(r), l(n), y(() => d(i, s.labels.actions)), t(e, n);
		};
		r(X, (e) => {
			s.actions && e(Z);
		}), l(V), l(O);
		var Q = w(O);
		c(Q, 21, () => u(q), (e) => e.key, (n, a) => {
			var o = M(), p = g(o), h = g(p), v = (n) => {
				var r = m(), i = b(r);
				e(i, () => s.head, () => u(a)), t(n, r);
			}, x = (e) => {
				var n = i();
				y(() => d(n, u(a).label)), t(e, n);
			};
			r(h, (e) => {
				s.head ? e(v) : e(x, -1);
			}), l(p);
			var S = w(p);
			c(S, 17, () => s.columns, (e) => e.key, (n, o) => {
				var c = A();
				let p;
				var h = g(c), _ = (n) => {
					var r = m(), i = b(r);
					e(i, () => s.cell, () => u(a), () => u(o)), t(n, r);
				}, v = (e) => {
					var n = i();
					y(() => d(n, u(a).cells[u(o).key] ?? s.labels.missing)), t(e, n);
				};
				r(h, (e) => {
					s.cell ? e(_) : e(v, -1);
				}), l(c), y(() => p = f(c, 1, "svelte-14uwvhg", null, p, {
					numeric: u(o).numeric,
					centered: u(o).centered
				})), t(n, c);
			});
			var C = w(S), T = (n) => {
				var r = j(), i = g(r);
				e(i, () => s.actions, () => u(a)), l(r), t(n, r);
			};
			r(C, (e) => {
				s.actions && e(T);
			}), l(o), y(() => _(o, "data-row-key", u(a).key)), t(n, o);
		}, (e) => {
			var n = N(), r = g(n), i = g(r, !0);
			l(r), l(n), y(() => {
				_(r, "colspan", s.columns.length + 1 + +!!s.actions), d(i, s.labels.empty);
			}), t(e, n);
		}), l(Q), l(C), l(h);
		var $ = w(h, 2), ne = (e) => {
			var n = P(), r = g(n), i = g(r, !0);
			l(r);
			var a = w(r, 2), o = g(a), c = g(o, !0);
			l(o);
			var f = w(o), p = g(f, !0);
			l(f), l(a), l(n), y((e) => {
				d(i, e), o.disabled = u(W) === 0, d(c, s.labels.previous), f.disabled = u(W) === u(U) - 1, d(p, s.labels.next);
			}, [() => s.labels.range(u(G) + 1, u(G) + u(q).length, s.rows.length)]), S("click", o, () => x(B, u(W) - 1)), S("click", f, () => x(B, u(W) + 1)), t(e, n);
		};
		r($, (e) => {
			u(U) > 1 && s.limit === void 0 && e(ne);
		}), y((e) => {
			v = f(h, 1, "table-scroll svelte-14uwvhg", null, v, { plain: z() }), _(h, "aria-label", s.caption), E = f(T, 1, "svelte-14uwvhg", null, E, { "sr-only": !I() }), d(D, s.caption), _(H, "aria-sort", e);
		}, [() => Y("")]), t(n, p);
	};
	r(Z, (e) => {
		u(H) ? e($, -1) : e(Q);
	}), t(a, X), p();
}
s(["click"]);
// upstream/src/shared/i18n/messages/work_actions.js
var L = () => "Actions", R = ((e = {}, t = {}) => (t.locale ?? T(), L(e))), z = () => "This content cannot be displayed safely or exceeds the view limits.", B = ((e = {}, t = {}) => (t.locale ?? T(), z(e))), V = () => "No data available.", H = ((e = {}, t = {}) => (t.locale ?? T(), V(e))), U = () => "Next", W = ((e = {}, t = {}) => (t.locale ?? T(), U(e))), G = () => "Previous", K = ((e = {}, t = {}) => (t.locale ?? T(), G(e))), q = (e) => `${e?.first}–${e?.last} of ${e?.total}`, J = ((e, t = {}) => (t.locale ?? T(), q(e)));
// upstream/src/features/work/lib/board/versus.ts
function Y(e) {
	if (e.columns[0]?.kind !== "entity" || e.rows.length < 2 || e.rows.length > 5) return !1;
	let t = e.columns.filter((t, n) => n > 0 && e.rows.some((e) => (e.cells[n] ?? "").trim()));
	return t.length >= 2 && t.length <= 10;
}
export { H as a, I as c, W as i, J as n, B as o, K as r, R as s, Y as t };
