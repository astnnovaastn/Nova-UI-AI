import { H as e, L as t, M as n, Mt as r, W as i, ht as a, i as o, jt as s, p as c, pt as l, r as u, s as d, zt as f } from "./index-client-DH73-vTM.js";
import "./disclose-version-7ONGmeVC.js";
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/@hugeicons/core-free-icons/dist/esm/ArrowUp02Icon.js
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
]), h = i("<span class=\"pending svelte-19kjijl\" aria-hidden=\"true\"><i class=\"svelte-19kjijl\"></i><i class=\"svelte-19kjijl\"></i><i class=\"svelte-19kjijl\"></i></span>"), g = i("<button><!> <!></button>");
function _(i, p) {
	r(p, !0);
	let _ = u(p, "variant", 3, "secondary"), v = u(p, "size", 3, "regular"), y = u(p, "shape", 3, "rounded"), b = u(p, "pending", 3, !1), x = u(p, "disabled", 3, !1), S = u(p, "ref", 15), C = u(p, "class", 3, ""), w = o(p, m);
	var T = g();
	c(T, () => ({
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
	var E = l(T), D = (t) => {
		var n = h();
		e(t, n);
	};
	t(E, (e) => {
		b() && e(D);
	});
	var O = a(E, 2);
	n(O, () => p.children), f(T), d(T, (e) => S(e), () => S()), e(i, T), s();
}
export { p as n, _ as t };
