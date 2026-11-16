import "./disclose-version-DFvUDwEH.js";
import { A as e, B as t, Dt as n, F as r, Ft as i, H as a, Ot as o, ft as s, i as c, p as l, r as u, s as d, ut as f } from "./index-client-C_2wYFnt.js";
// upstream/src/shared/ui/Button/Button.svelte
var p = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"children",
	"variant",
	"size",
	"shape",
	"pending",
	"disabled",
	"ref",
	"class"
]), m = a("<span class=\"pending svelte-19kjijl\" aria-hidden=\"true\"><i class=\"svelte-19kjijl\"></i><i class=\"svelte-19kjijl\"></i><i class=\"svelte-19kjijl\"></i></span>"), h = a("<button><!> <!></button>");
function g(a, g) {
	o(g, !0);
	let _ = u(g, "variant", 3, "secondary"), v = u(g, "size", 3, "regular"), y = u(g, "shape", 3, "rounded"), b = u(g, "pending", 3, !1), x = u(g, "disabled", 3, !1), S = u(g, "ref", 15), C = u(g, "class", 3, ""), w = c(g, p);
	var T = h();
	l(T, () => ({
		type: "button",
		...w,
		disabled: x() || b(),
		"aria-busy": b() || void 0,
		class: [
			"ui-button ui-control",
			_() === "secondary" && "ui-shine ui-shine-press",
			C()
		],
		"data-variant": _(),
		"data-size": v() === "large" ? "large" : "regular",
		"data-shape": y()
	}), void 0, void 0, void 0, "svelte-19kjijl");
	var E = f(T), D = (e) => {
		var n = m();
		t(e, n);
	};
	r(E, (e) => {
		b() && e(D);
	});
	var O = s(E, 2);
	e(O, () => g.children), i(T), d(T, (e) => S(e), () => S()), t(a, T), n();
}
export { g as t };
