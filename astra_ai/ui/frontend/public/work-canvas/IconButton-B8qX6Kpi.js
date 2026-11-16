import "./disclose-version-DFvUDwEH.js";
import { B as e, C as t, Dt as n, Ft as r, H as i, J as a, K as o, Ot as s, S as c, h as l, ot as u, q as d, r as f, ut as p, x as m } from "./index-client-C_2wYFnt.js";
import { t as h } from "./Icon-E4BzZ4dm.js";
// upstream/src/shared/ui/IconButton/IconButton.svelte
var g = i("<button type=\"button\"><!></button>");
function _(i, o) {
	s(o, !0);
	let _ = f(o, "size", 3, 16), v = f(o, "buttonSize", 3, 28), y = f(o, "variant", 3, "ghost"), b = f(o, "active", 3, !1), x = f(o, "disabled", 3, !1), S = f(o, "haspopup", 3, !1), C = f(o, "class", 3, ""), w = f(o, "pending", 3, !1), T = f(o, "shape", 3, "rounded"), E, D = !1, O = {
		x: 0,
		y: 0
	};
	function k(e) {
		if (D = !1, clearTimeout(E), !o.onmenu || e.button !== 0) return;
		O = {
			x: e.clientX,
			y: e.clientY
		};
		let t = e.currentTarget;
		E = setTimeout(() => {
			D = !0, o.onmenu(t.getBoundingClientRect());
		}, 450);
	}
	function A(e) {
		Math.hypot(e.clientX - O.x, e.clientY - O.y) > 6 && clearTimeout(E);
	}
	function j() {
		clearTimeout(E);
	}
	function M(e) {
		o.onmenu && (e.preventDefault(), clearTimeout(E), o.onmenu(e.currentTarget.getBoundingClientRect()));
	}
	function N(e) {
		D ? D = !1 : o.onclick?.(e);
	}
	var P = g();
	let F;
	var I = p(P);
	h(I, {
		get icon() {
			return o.icon;
		},
		get size() {
			return _();
		}
	}), r(P), u(() => {
		l(P, "data-shape", T()), l(P, "data-variant", y()), l(P, "aria-label", o.label), l(P, "title", o.label), l(P, "aria-pressed", b() || void 0), l(P, "aria-haspopup", S() === !0 ? "menu" : S() || void 0), l(P, "aria-expanded", S() ? o.expanded : void 0), l(P, "aria-controls", o.controls), P.disabled = x() || w(), l(P, "aria-busy", w() || void 0), c(P, 1, t([
			"icon-button",
			b() && "icon-button-active",
			C()
		]), "svelte-1yhkvif"), F = m(P, "", F, { "--icon-button-size": `${v()}px` });
	}), d("click", P, N), d("pointerdown", P, k), d("pointermove", P, A), d("pointerup", P, j), a("pointercancel", P, j), d("contextmenu", P, M), e(i, P), n();
}
o([
	"click",
	"pointerdown",
	"pointermove",
	"pointerup",
	"contextmenu"
]);
export { _ as t };
