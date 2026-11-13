import "./disclose-version-DFvUDwEH.js";
import { B as e, C as t, D as n, Et as r, M as i, N as a, Nt as o, Q as s, S as c, Tt as l, U as u, V as d, _t as f, h as p, it as m, lt as h, p as g, r as _, x as v } from "./index-client-oI5R0J23.js";
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
var S = u("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" color=\"currentColor\" focusable=\"false\"></svg>");
function C(u, y) {
	r(y, !0);
	let b = _(y, "size", 3, 16), C = _(y, "strokeWidth", 3, 1.7), w = f(() => x(y.icon, C()));
	var T = S();
	i(T, 21, () => s(w), a, (t, r) => {
		var i = d(), a = h(i);
		n(a, () => s(r).tag, !0, (e, t) => {
			g(e, () => ({
				xmlns: "http://www.w3.org/2000/svg",
				...s(r).attrs
			}));
		}), e(t, i);
	}), o(T), m(() => {
		p(T, "width", b()), p(T, "height", b()), c(T, 0, t(y.class)), v(T, y.style), p(T, "role", y.label ? "img" : void 0), p(T, "aria-label", y.label), p(T, "aria-hidden", y.label ? void 0 : "true");
	}), e(u, T), l();
}
export { C as t };
