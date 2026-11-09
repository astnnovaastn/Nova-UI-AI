import "./disclose-version-DFvUDwEH.js";
import { A as e, At as t, Ct as n, F as r, G as i, L as a, M as o, St as s, U as c, W as l, X as u, Y as d, at as f, ft as p, h as m, k as h, m as g, p as _, s as v, st as y, tt as b, ut as x, v as S, z as C } from "./index-client-BSGo5gVb.js";
import { t as w } from "./Icon-BWISRU-8.js";
import { t as T } from "./Cancel01Icon-D3Oj0kt9.js";
import { t as E } from "./runtime-Ci9kzAvr.js";
// node_modules/@hugeicons/core-free-icons/dist/esm/Add01Icon.js
var D = [["path", {
	d: "M12.001 5.00003V19.002",
	stroke: "currentColor",
	strokeLinecap: "round",
	strokeLinejoin: "round",
	strokeWidth: "1.5",
	key: "0"
}], ["path", {
	d: "M19.002 12.002L4.99998 12.002",
	stroke: "currentColor",
	strokeLinecap: "round",
	strokeLinejoin: "round",
	strokeWidth: "1.5",
	key: "1"
}]], O = () => "Add a column", k = ((e = {}, t = {}) => (t.locale ?? E(), O(e))), A = () => "New row", j = ((e = {}, t = {}) => (t.locale ?? E(), A(e))), M = (e) => `Column ${e?.number}`, N = ((e, t = {}) => (t.locale ?? E(), M(e))), P = () => "Remove row", F = ((e = {}, t = {}) => (t.locale ?? E(), P(e))), I = C("<h3 class=\"svelte-130o4uk\"> </h3>"), ee = C("<input class=\"label nodrag nopan svelte-130o4uk\" role=\"columnheader\" maxlength=\"24\"/>"), te = C("<button type=\"button\" class=\"edge nodrag nopan svelte-130o4uk\"><!></button>"), ne = C("<span></span>"), L = C("<input class=\"cell nodrag nopan svelte-130o4uk\" role=\"gridcell\" maxlength=\"60\"/>"), R = C("<div class=\"row svelte-130o4uk\" role=\"row\"><!> <button type=\"button\" class=\"edge remove nodrag nopan svelte-130o4uk\"><!></button></div>"), z = C("<section class=\"table-block svelte-130o4uk\"><!> <div class=\"grid svelte-130o4uk\" role=\"grid\"><div class=\"row head svelte-130o4uk\" role=\"row\"><!> <!></div> <!></div> <button type=\"button\" class=\"new nodrag nopan svelte-130o4uk\"><!> </button></section>");
function B(c, C) {
	n(C, !0);
	let E = p(void 0);
	function O(e) {
		C.actions.edit?.(C.object.id, (t) => t.kind === "sheet" ? e(t) : t);
	}
	async function A(e, t) {
		await u(), d(E)?.querySelector(`[data-cell="${e}:${t}"]`)?.focus();
	}
	function M(e, t, n) {
		(C.object.rows[e]?.cells[t] ?? "") !== n && O((r) => ({
			...r,
			rows: r.rows.map((r, i) => i === e ? {
				...r,
				cells: r.cells.map((e, r) => r === t ? n : e)
			} : r)
		}));
	}
	function P(e, t) {
		let n = t.trim();
		n && n !== C.object.columns[e]?.label && O((t) => ({
			...t,
			columns: t.columns.map((t, r) => r === e ? {
				...t,
				label: n
			} : t)
		}));
	}
	function B(e = 0) {
		let t = C.object.rows.length;
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
		if (C.object.columns.length >= 8) return;
		let e = C.object.columns.length;
		O((t) => ({
			...t,
			columns: [...t.columns, {
				label: N({ number: e + 1 }),
				kind: "text"
			}],
			rows: t.rows.map((e) => ({
				...e,
				cells: [...e.cells, ""]
			}))
		})), u().then(() => d(E)?.querySelector(`[data-label="${e}"]`)?.select());
	}
	function U(e, t, n) {
		e.key === "Enter" && (e.preventDefault(), M(t, n, e.currentTarget.value), t + 1 < C.object.rows.length ? A(t + 1, n) : B(n));
	}
	var W = z();
	let G;
	var K = f(W), q = (e) => {
		var n = I(), i = f(n, !0);
		t(n), b(() => r(i, C.object.title)), a(e, n);
	};
	o(K, (e) => {
		C.object.title && e(q);
	});
	var J = y(K, 2), Y = f(J), X = f(Y);
	h(X, 17, () => C.object.columns, e, (e, t, n) => {
		var r = ee();
		_(r), g(r, "data-label", n), b(() => {
			m(r, d(t).label), g(r, "aria-label", d(t).label);
		}), i("blur", r, (e) => P(n, e.currentTarget.value)), l("keydown", r, (e) => e.key === "Enter" && e.currentTarget.blur()), a(e, r);
	});
	var re = y(X, 2), Z = (e) => {
		var n = te(), r = f(n);
		w(r, {
			get icon() {
				return D;
			},
			size: 13
		}), t(n), b((e, t) => {
			g(n, "aria-label", e), g(n, "title", t);
		}, [() => k(), () => k()]), l("click", n, H), a(e, n);
	}, ie = (e) => {
		var t = ne();
		a(e, t);
	};
	o(re, (e) => {
		C.object.columns.length < 8 ? e(Z) : e(ie, -1);
	}), t(Y);
	var ae = y(Y, 2);
	h(ae, 17, () => C.object.rows, e, (n, r, o) => {
		var s = R(), c = f(s);
		h(c, 17, () => C.object.columns, e, (e, t, n) => {
			var s = L();
			_(s), g(s, "data-cell", `${o}:${n}`), b(() => {
				m(s, d(r).cells[n] ?? ""), g(s, "aria-label", d(t).label);
			}), i("blur", s, (e) => M(o, n, e.currentTarget.value)), l("keydown", s, (e) => U(e, o, n)), a(e, s);
		});
		var u = y(c, 2), p = f(u);
		w(p, {
			get icon() {
				return T;
			},
			size: 12
		}), t(u), t(s), b((e, t) => {
			g(u, "aria-label", e), g(u, "title", t);
		}, [() => F(), () => F()]), l("click", u, () => V(o)), a(n, s);
	}), t(J);
	var Q = y(J, 2), $ = f(Q);
	w($, {
		get icon() {
			return D;
		},
		size: 13
	});
	var oe = y($, 1, !0);
	t(Q), t(W), v(W, (e) => x(E, e), () => d(E)), b((e) => {
		g(W, "aria-label", C.object.title), G = S(W, "", G, { "--columns": C.object.columns.length }), r(oe, e);
	}, [() => j()]), l("click", Q, () => B()), a(c, W), s();
}
c(["keydown", "click"]);
export { B as default };
