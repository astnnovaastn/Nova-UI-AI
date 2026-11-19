import "./disclose-version-7ONGmeVC.js";
import { C as e, H as t, J as n, Mt as r, S as i, W as a, X as o, Y as s, h as c, jt as l, lt as u, pt as d, r as f, x as p, zt as m } from "./index-client-DH73-vTM.js";
import { t as h } from "./Icon-D2j1Ej6Z.js";
// upstream/src/shared/ui/IconButton/IconButton.svelte
var g = a("<button type=\"button\"><!></button>");
function _(n, a) {
	r(a, !0);
	let _ = f(a, "size", 3, 16), v = f(a, "buttonSize", 3, 28), y = f(a, "variant", 3, "ghost"), b = f(a, "active", 3, !1), x = f(a, "disabled", 3, !1), S = f(a, "haspopup", 3, !1), C = f(a, "class", 3, ""), w = f(a, "pending", 3, !1), T = f(a, "shape", 3, "rounded"), E, D = !1, O = {
		x: 0,
		y: 0
	};
	function k(e) {
		if (D = !1, clearTimeout(E), !a.onmenu || e.button !== 0) return;
		O = {
			x: e.clientX,
			y: e.clientY
		};
		let t = e.currentTarget;
		E = setTimeout(() => {
			D = !0, a.onmenu(t.getBoundingClientRect());
		}, 450);
	}
	function A(e) {
		Math.hypot(e.clientX - O.x, e.clientY - O.y) > 6 && clearTimeout(E);
	}
	function j() {
		clearTimeout(E);
	}
	function M(e) {
		a.onmenu && (e.preventDefault(), clearTimeout(E), a.onmenu(e.currentTarget.getBoundingClientRect()));
	}
	function N(e) {
		D ? D = !1 : a.onclick?.(e);
	}
	var P = g();
	let F;
	var I = d(P);
	h(I, {
		get icon() {
			return a.icon;
		},
		get size() {
			return _();
		}
	}), m(P), u(() => {
		c(P, "data-shape", T()), c(P, "data-variant", y()), c(P, "aria-label", a.label), c(P, "title", a.label), c(P, "aria-pressed", b() || void 0), c(P, "aria-haspopup", S() === !0 ? "menu" : S() || void 0), c(P, "aria-expanded", S() ? a.expanded : void 0), c(P, "aria-controls", a.controls), P.disabled = x() || w(), c(P, "aria-busy", w() || void 0), i(P, 1, e([
			"icon-button",
			b() && "icon-button-active",
			C()
		]), "svelte-1yhkvif"), F = p(P, "", F, { "--icon-button-size": `${v()}px` });
	}), s("click", P, N), s("pointerdown", P, k), s("pointermove", P, A), s("pointerup", P, j), o("pointercancel", P, j), s("contextmenu", P, M), t(n, P), l();
}
n([
	"click",
	"pointerdown",
	"pointermove",
	"pointerup",
	"contextmenu"
]);
export { _ as t };
