import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Et as n, F as r, H as i, J as a, K as o, M as s, N as c, Nt as l, Q as u, R as d, Tt as f, _ as p, ct as m, h, ht as g, it as _, m as v, pt as y, q as b, s as x, ut as S, x as C } from "./index-client-oI5R0J23.js";
import { t as w } from "./Icon-BfOzno3u.js";
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
}]], O = () => "Add a column", k = ((e = {}, t = {}) => (t.locale ?? E(), O(e))), A = () => "New row", j = ((e = {}, t = {}) => (t.locale ?? E(), A(e))), M = (e) => `Column ${e?.number}`, N = ((e, t = {}) => (t.locale ?? E(), M(e))), P = () => "Remove row", F = ((e = {}, t = {}) => (t.locale ?? E(), P(e))), I = i("<h3 class=\"svelte-130o4uk\"> </h3>"), ee = i("<input class=\"label nodrag nopan svelte-130o4uk\" role=\"columnheader\" maxlength=\"24\"/>"), te = i("<button type=\"button\" class=\"edge nodrag nopan svelte-130o4uk\"><!></button>"), ne = i("<span></span>"), L = i("<input class=\"cell nodrag nopan svelte-130o4uk\" role=\"gridcell\" maxlength=\"60\"/>"), R = i("<div class=\"row svelte-130o4uk\" role=\"row\"><!> <button type=\"button\" class=\"edge remove nodrag nopan svelte-130o4uk\"><!></button></div>"), z = i("<section class=\"table-block svelte-130o4uk\"><!> <div class=\"grid svelte-130o4uk\" role=\"grid\"><div class=\"row head svelte-130o4uk\" role=\"row\"><!> <!></div> <!></div> <button type=\"button\" class=\"new nodrag nopan svelte-130o4uk\"><!> </button></section>");
function B(i, o) {
	n(o, !0);
	let E = g(void 0);
	function O(e) {
		o.actions.edit?.(o.object.id, (t) => t.kind === "sheet" ? e(t) : t);
	}
	async function A(t, n) {
		await e(), u(E)?.querySelector(`[data-cell="${t}:${n}"]`)?.focus();
	}
	function M(e, t, n) {
		(o.object.rows[e]?.cells[t] ?? "") !== n && O((r) => ({
			...r,
			rows: r.rows.map((r, i) => i === e ? {
				...r,
				cells: r.cells.map((e, r) => r === t ? n : e)
			} : r)
		}));
	}
	function P(e, t) {
		let n = t.trim();
		n && n !== o.object.columns[e]?.label && O((t) => ({
			...t,
			columns: t.columns.map((t, r) => r === e ? {
				...t,
				label: n
			} : t)
		}));
	}
	function B(e = 0) {
		let t = o.object.rows.length;
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
		if (o.object.columns.length >= 8) return;
		let t = o.object.columns.length;
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
		})), e().then(() => u(E)?.querySelector(`[data-label="${t}"]`)?.select());
	}
	function U(e, t, n) {
		e.key === "Enter" && (e.preventDefault(), M(t, n, e.currentTarget.value), t + 1 < o.object.rows.length ? A(t + 1, n) : B(n));
	}
	var W = z();
	let G;
	var K = m(W), q = (e) => {
		var n = I(), r = m(n, !0);
		l(n), _(() => d(r, o.object.title)), t(e, n);
	};
	r(K, (e) => {
		o.object.title && e(q);
	});
	var J = S(K, 2), Y = m(J), X = m(Y);
	s(X, 17, () => o.object.columns, c, (e, n, r) => {
		var i = ee();
		v(i), h(i, "data-label", r), _(() => {
			p(i, u(n).label), h(i, "aria-label", u(n).label);
		}), a("blur", i, (e) => P(r, e.currentTarget.value)), b("keydown", i, (e) => e.key === "Enter" && e.currentTarget.blur()), t(e, i);
	});
	var re = S(X, 2), Z = (e) => {
		var n = te(), r = m(n);
		w(r, {
			get icon() {
				return D;
			},
			size: 13
		}), l(n), _((e, t) => {
			h(n, "aria-label", e), h(n, "title", t);
		}, [() => k(), () => k()]), b("click", n, H), t(e, n);
	}, ie = (e) => {
		var n = ne();
		t(e, n);
	};
	r(re, (e) => {
		o.object.columns.length < 8 ? e(Z) : e(ie, -1);
	}), l(Y);
	var ae = S(Y, 2);
	s(ae, 17, () => o.object.rows, c, (e, n, r) => {
		var i = R(), d = m(i);
		s(d, 17, () => o.object.columns, c, (e, i, o) => {
			var s = L();
			v(s), h(s, "data-cell", `${r}:${o}`), _(() => {
				p(s, u(n).cells[o] ?? ""), h(s, "aria-label", u(i).label);
			}), a("blur", s, (e) => M(r, o, e.currentTarget.value)), b("keydown", s, (e) => U(e, r, o)), t(e, s);
		});
		var f = S(d, 2), g = m(f);
		w(g, {
			get icon() {
				return T;
			},
			size: 12
		}), l(f), l(i), _((e, t) => {
			h(f, "aria-label", e), h(f, "title", t);
		}, [() => F(), () => F()]), b("click", f, () => V(r)), t(e, i);
	}), l(J);
	var Q = S(J, 2), $ = m(Q);
	w($, {
		get icon() {
			return D;
		},
		size: 13
	});
	var oe = S($, 1, !0);
	l(Q), l(W), x(W, (e) => y(E, e), () => u(E)), _((e) => {
		h(W, "aria-label", o.object.title), G = C(W, "", G, { "--columns": o.object.columns.length }), d(oe, e);
	}, [() => j()]), b("click", Q, () => B()), t(i, W), f();
}
o(["keydown", "click"]);
export { B as default };
