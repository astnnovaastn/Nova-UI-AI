import "./disclose-version-7ONGmeVC.js";
import { C as e, Ct as t, D as n, F as r, G as i, H as a, Mt as o, P as s, S as c, U as l, h as u, jt as d, lt as f, mt as p, p as m, r as h, tt as g, x as _, zt as v } from "./index-client-DH73-vTM.js";
// upstream/src/shared/ui/Icon/Icon.svelte
var y = (e) => e.replace(/([a-z0-9])([A-Z])/gu, "$1-$2").toLowerCase(), b = /* @__PURE__ */ new WeakMap();
function x(e, t) {
	let n = b.get(e);
	n || b.set(e, n = {});
	let r = n[t];
	return r || (r = e.map(([e, n]) => {
		let r = {};
		for (let [e, t] of Object.entries(n)) e !== "key" && (r[y(e)] = String(t));
		return r.stroke === "none" || (r["stroke-width"] = String(t), r.stroke = "currentColor"), {
			tag: e,
			attrs: r
		};
	}), n[t] = r, r);
}
var S = i("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" color=\"currentColor\" focusable=\"false\"></svg>");
function C(i, y) {
	o(y, !0);
	let b = h(y, "size", 3, 16), C = h(y, "strokeWidth", 3, 1.7), w = t(() => x(y.icon, C()));
	var T = S();
	s(T, 21, () => g(w), r, (e, t) => {
		var r = l(), i = p(r);
		n(i, () => g(t).tag, !0, (e, n) => {
			m(e, () => ({
				xmlns: "http://www.w3.org/2000/svg",
				...g(t).attrs
			}));
		}), a(e, r);
	}), v(T), f(() => {
		u(T, "width", b()), u(T, "height", b()), c(T, 0, e(y.class)), _(T, y.style), u(T, "role", y.label ? "img" : void 0), u(T, "aria-label", y.label), u(T, "aria-hidden", y.label ? void 0 : "true");
	}), a(i, T), d();
}
export { C as t };
