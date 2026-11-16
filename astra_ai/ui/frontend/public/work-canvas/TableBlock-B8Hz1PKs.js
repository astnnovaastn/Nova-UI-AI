import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, F as r, Ft as i, H as a, J as o, K as s, M as c, N as l, Ot as u, R as d, _ as f, _t as p, ft as m, h, ht as g, m as _, ot as v, q as y, s as b, tt as x, ut as S, x as C } from "./index-client-C_2wYFnt.js";
import { t as w } from "./Icon-E4BzZ4dm.js";
import { t as T } from "./Add01Icon-DrbHi4EB.js";
import { t as E } from "./Cancel01Icon-D3Oj0kt9.js";
import { t as D } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_block_add_column.js
var O = () => "Add a column", k = ((e = {}, t = {}) => (t.locale ?? D(), O(e))), A = () => "New row", j = ((e = {}, t = {}) => (t.locale ?? D(), A(e))), M = (e) => `Column ${e?.number}`, N = ((e, t = {}) => (t.locale ?? D(), M(e))), P = () => "Remove row", F = ((e = {}, t = {}) => (t.locale ?? D(), P(e))), I = a("<h3 class=\"svelte-130o4uk\"> </h3>"), L = a("<input class=\"label nodrag nopan svelte-130o4uk\" role=\"columnheader\" maxlength=\"24\"/>"), ee = a("<button type=\"button\" class=\"edge nodrag nopan svelte-130o4uk\"><!></button>"), te = a("<span></span>"), ne = a("<input class=\"cell nodrag nopan svelte-130o4uk\" role=\"gridcell\" maxlength=\"60\"/>"), R = a("<div class=\"row svelte-130o4uk\" role=\"row\"><!> <button type=\"button\" class=\"edge remove nodrag nopan svelte-130o4uk\"><!></button></div>"), z = a("<section class=\"table-block svelte-130o4uk\"><!> <div class=\"grid svelte-130o4uk\" role=\"grid\"><div class=\"row head svelte-130o4uk\" role=\"row\"><!> <!></div> <!></div> <button type=\"button\" class=\"new nodrag nopan svelte-130o4uk\"><!> </button></section>");
function B(a, s) {
	u(s, !0);
	let D = p(void 0);
	function O(e) {
		s.actions.edit?.(s.object.id, (t) => t.kind === "sheet" ? e(t) : t);
	}
	async function A(t, n) {
		await x(), e(D)?.querySelector(`[data-cell="${t}:${n}"]`)?.focus();
	}
	function M(e, t, n) {
		(s.object.rows[e]?.cells[t] ?? "") !== n && O((r) => ({
			...r,
			rows: r.rows.map((r, i) => i === e ? {
				...r,
				cells: r.cells.map((e, r) => r === t ? n : e)
			} : r)
		}));
	}
	function P(e, t) {
		let n = t.trim();
		n && n !== s.object.columns[e]?.label && O((t) => ({
			...t,
			columns: t.columns.map((t, r) => r === e ? {
				...t,
				label: n
			} : t)
		}));
	}
	function B(e = 0) {
		let t = s.object.rows.length;
		O((e) => ({
			...e,
			rows: [...e.rows, { cells: e.columns.map(() => "") }]
		})), A(t, e);
	}
	function V(e) {
		O((t) => ({
			...t,
			rows: t.rows.filter((t, n) => n !== e)
		}));
	}
	function H() {
		if (s.object.columns.length >= 8) return;
		let t = s.object.columns.length;
		O((e) => ({
			...e,
			columns: [...e.columns, {
				label: N({ number: t + 1 }),
				kind: "text"
			}],
			rows: e.rows.map((e) => ({
				...e,
				cells: [...e.cells, ""]
			}))
		})), x().then(() => e(D)?.querySelector(`[data-label="${t}"]`)?.select());
	}
	function U(e, t, n) {
		e.key === "Enter" && (e.preventDefault(), M(t, n, e.currentTarget.value), t + 1 < s.object.rows.length ? A(t + 1, n) : B(n));
	}
	var W = z();
	let G;
	var K = S(W), q = (e) => {
		var n = I(), r = S(n, !0);
		i(n), v(() => d(r, s.object.title)), t(e, n);
	};
	r(K, (e) => {
		s.object.title && e(q);
	});
	var J = m(K, 2), Y = S(J), X = S(Y);
	c(X, 17, () => s.object.columns, l, (n, r, i) => {
		var a = L();
		_(a), h(a, "data-label", i), v(() => {
			f(a, e(r).label), h(a, "aria-label", e(r).label);
		}), o("blur", a, (e) => P(i, e.currentTarget.value)), y("keydown", a, (e) => e.key === "Enter" && e.currentTarget.blur()), t(n, a);
	});
	var Z = m(X, 2), re = (e) => {
		var n = ee(), r = S(n);
		w(r, {
			get icon() {
				return T;
			},
			size: 13
		}), i(n), v((e, t) => {
			h(n, "aria-label", e), h(n, "title", t);
		}, [() => k(), () => k()]), y("click", n, H), t(e, n);
	}, ie = (e) => {
		var n = te();
		t(e, n);
	};
	r(Z, (e) => {
		s.object.columns.length < 8 ? e(re) : e(ie, -1);
	}), i(Y);
	var ae = m(Y, 2);
	c(ae, 17, () => s.object.rows, l, (n, r, a) => {
		var u = R(), d = S(u);
		c(d, 17, () => s.object.columns, l, (n, i, s) => {
			var c = ne();
			_(c), h(c, "data-cell", `${a}:${s}`), v(() => {
				f(c, e(r).cells[s] ?? ""), h(c, "aria-label", e(i).label);
			}), o("blur", c, (e) => M(a, s, e.currentTarget.value)), y("keydown", c, (e) => U(e, a, s)), t(n, c);
		});
		var p = m(d, 2), g = S(p);
		w(g, {
			get icon() {
				return E;
			},
			size: 12
		}), i(p), i(u), v((e, t) => {
			h(p, "aria-label", e), h(p, "title", t);
		}, [() => F(), () => F()]), y("click", p, () => V(a)), t(n, u);
	}), i(J);
	var Q = m(J, 2), $ = S(Q);
	w($, {
		get icon() {
			return T;
		},
		size: 13
	});
	var oe = m($, 1, !0);
	i(Q), i(W), b(W, (e) => g(D, e), () => e(D)), v((e) => {
		h(W, "aria-label", s.object.title), G = C(W, "", G, { "--columns": s.object.columns.length }), d(oe, e);
	}, [() => j()]), y("click", Q, () => B()), t(a, W), n();
}
s(["keydown", "click"]);
export { B as default };
