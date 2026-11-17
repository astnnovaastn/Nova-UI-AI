import { A as e, B as t, Dt as n, F as r, Ft as i, H as a, Ot as o, ft as s, i as c, p as l, r as u, s as d, ut as f } from "./index-client-C_2wYFnt.js";
import "./disclose-version-DFvUDwEH.js";
// node_modules/@hugeicons/core-free-icons/dist/esm/ArrowUp02Icon.js
var p = [["path", {
	d: "M12 5.5V19",
	stroke: "currentColor",
	strokeLinecap: "round",
	strokeLinejoin: "round",
	strokeWidth: "1.5",
	key: "0"
}], ["path", {
	d: "M18 11C18 11 13.5811 5.00001 12 5C10.4188 4.99999 6 11 6 11",
	stroke: "currentColor",
	strokeLinecap: "round",
	strokeLinejoin: "round",
	strokeWidth: "1.5",
	key: "1"
}]], m = /* @__PURE__ */ new Set([
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
]), h = a("<span class=\"pending svelte-19kjijl\" aria-hidden=\"true\"><i class=\"svelte-19kjijl\"></i><i class=\"svelte-19kjijl\"></i><i class=\"svelte-19kjijl\"></i></span>"), g = a("<button><!> <!></button>");
function _(a, p) {
	o(p, !0);
	let _ = u(p, "variant", 3, "secondary"), v = u(p, "size", 3, "regular"), y = u(p, "shape", 3, "rounded"), b = u(p, "pending", 3, !1), x = u(p, "disabled", 3, !1), S = u(p, "ref", 15), C = u(p, "class", 3, ""), w = c(p, m);
	var T = g();
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
		var n = h();
		t(e, n);
	};
	r(E, (e) => {
		b() && e(D);
	});
	var O = s(E, 2);
	e(O, () => p.children), i(T), d(T, (e) => S(e), () => S()), t(a, T), n();
}
export { p as n, _ as t };
