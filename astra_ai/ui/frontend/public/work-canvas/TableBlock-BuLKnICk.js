import "./disclose-version-7ONGmeVC.js";
import { B as e, F as t, H as n, J as r, L as i, Mt as a, P as o, W as s, X as c, Y as l, _ as u, bt as d, h as f, ht as p, jt as m, lt as h, m as g, pt as _, rt as v, s as y, tt as b, vt as x, x as S, zt as C } from "./index-client-DH73-vTM.js";
import { t as w } from "./Icon-D2j1Ej6Z.js";
import "./Icon-CmjKIKuh.js";
import { t as T } from "./Add01Icon-CxgurxUR.js";
import { t as ee } from "./Cancel01Icon-6hDfDS5l.js";
import { t as E } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_block_add_column.js
var D = () => "Add a column", O = ((e = {}, t = {}) => (t.locale ?? E(), D(e))), k = () => "New row", A = ((e = {}, t = {}) => (t.locale ?? E(), k(e))), j = (e) => `Column ${e?.number}`, M = ((e, t = {}) => (t.locale ?? E(), j(e))), N = () => "Remove row", P = ((e = {}, t = {}) => (t.locale ?? E(), N(e))), F = s("<h3 class=\"svelte-130o4uk\"> </h3>"), I = s("<input class=\"label nodrag nopan svelte-130o4uk\" role=\"columnheader\" maxlength=\"24\"/>"), L = s("<button type=\"button\" class=\"edge nodrag nopan svelte-130o4uk\"><!></button>"), R = s("<span></span>"), z = s("<input class=\"cell nodrag nopan svelte-130o4uk\" role=\"gridcell\" maxlength=\"60\"/>"), B = s("<div class=\"row svelte-130o4uk\" role=\"row\"><!> <button type=\"button\" class=\"edge remove nodrag nopan svelte-130o4uk\"><!></button></div>"), V = s("<section class=\"table-block svelte-130o4uk\"><!> <div class=\"grid svelte-130o4uk\" role=\"grid\"><div class=\"row head svelte-130o4uk\" role=\"row\"><!> <!></div> <!></div> <button type=\"button\" class=\"new nodrag nopan svelte-130o4uk\"><!> </button></section>");
function H(r, s) {
	a(s, !0);
	let E = d(void 0);
	function D(e) {
		s.actions.edit?.(s.object.id, (t) => t.kind === "sheet" ? e(t) : t);
	}
	async function k(e, t) {
		await v(), b(E)?.querySelector(`[data-cell="${e}:${t}"]`)?.focus();
	}
	function j(e, t, n) {
		(s.object.rows[e]?.cells[t] ?? "") !== n && D((r) => ({
			...r,
			rows: r.rows.map((r, i) => i === e ? {
				...r,
				cells: r.cells.map((e, r) => r === t ? n : e)
			} : r)
		}));
	}
	function N(e, t) {
		let n = t.trim();
		n && n !== s.object.columns[e]?.label && D((t) => ({
			...t,
			columns: t.columns.map((t, r) => r === e ? {
				...t,
				label: n
			} : t)
		}));
	}
	function H(e = 0) {
		let t = s.object.rows.length;
		D((e) => ({
			...e,
			rows: [...e.rows, { cells: e.columns.map(() => "") }]
		})), k(t, e);
	}
	function U(e) {
		D((t) => ({
			...t,
			rows: t.rows.filter((t, n) => n !== e)
		}));
	}
	function W() {
		if (s.object.columns.length >= 8) return;
		let e = s.object.columns.length;
		D((t) => ({
			...t,
			columns: [...t.columns, {
				label: M({ number: e + 1 }),
				kind: "text"
			}],
			rows: t.rows.map((e) => ({
				...e,
				cells: [...e.cells, ""]
			}))
		})), v().then(() => b(E)?.querySelector(`[data-label="${e}"]`)?.select());
	}
	function G(e, t, n) {
		e.key === "Enter" && (e.preventDefault(), j(t, n, e.currentTarget.value), t + 1 < s.object.rows.length ? k(t + 1, n) : H(n));
	}
	var K = V();
	let q;
	var J = _(K), te = (t) => {
		var r = F(), i = _(r, !0);
		C(r), h(() => e(i, s.object.title)), n(t, r);
	};
	i(J, (e) => {
		s.object.title && e(te);
	});
	var Y = p(J, 2), X = _(Y), Z = _(X);
	o(Z, 17, () => s.object.columns, t, (e, t, r) => {
		var i = I();
		g(i), f(i, "data-label", r), h(() => {
			u(i, b(t).label), f(i, "aria-label", b(t).label);
		}), c("blur", i, (e) => N(r, e.currentTarget.value)), l("keydown", i, (e) => e.key === "Enter" && e.currentTarget.blur()), n(e, i);
	});
	var ne = p(Z, 2), re = (e) => {
		var t = L(), r = _(t);
		w(r, {
			get icon() {
				return T;
			},
			size: 13
		}), C(t), h((e, n) => {
			f(t, "aria-label", e), f(t, "title", n);
		}, [() => O(), () => O()]), l("click", t, W), n(e, t);
	}, ie = (e) => {
		var t = R();
		n(e, t);
	};
	i(ne, (e) => {
		s.object.columns.length < 8 ? e(re) : e(ie, -1);
	}), C(X);
	var ae = p(X, 2);
	o(ae, 17, () => s.object.rows, t, (e, r, i) => {
		var a = B(), d = _(a);
		o(d, 17, () => s.object.columns, t, (e, t, a) => {
			var o = z();
			g(o), f(o, "data-cell", `${i}:${a}`), h(() => {
				u(o, b(r).cells[a] ?? ""), f(o, "aria-label", b(t).label);
			}), c("blur", o, (e) => j(i, a, e.currentTarget.value)), l("keydown", o, (e) => G(e, i, a)), n(e, o);
		});
		var m = p(d, 2), v = _(m);
		w(v, {
			get icon() {
				return ee;
			},
			size: 12
		}), C(m), C(a), h((e, t) => {
			f(m, "aria-label", e), f(m, "title", t);
		}, [() => P(), () => P()]), l("click", m, () => U(i)), n(e, a);
	}), C(Y);
	var Q = p(Y, 2), $ = _(Q);
	w($, {
		get icon() {
			return T;
		},
		size: 13
	});
	var oe = p($, 1, !0);
	C(Q), C(K), y(K, (e) => x(E, e), () => b(E)), h((t) => {
		f(K, "aria-label", s.object.title), q = S(K, "", q, { "--columns": s.object.columns.length }), e(oe, t);
	}, [() => A()]), l("click", Q, () => H()), n(r, K), m();
}
r(["keydown", "click"]);
export { H as default };
