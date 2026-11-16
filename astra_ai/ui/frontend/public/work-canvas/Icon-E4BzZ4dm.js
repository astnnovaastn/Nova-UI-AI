import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, C as n, D as r, Dt as i, Ft as a, M as o, N as s, Ot as c, S as l, U as u, V as d, dt as f, h as p, ot as m, p as h, r as g, x as _, yt as v } from "./index-client-C_2wYFnt.js";
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
	c(y, !0);
	let b = g(y, "size", 3, 16), C = g(y, "strokeWidth", 3, 1.7), w = v(() => x(y.icon, C()));
	var T = S();
	o(T, 21, () => e(w), s, (n, i) => {
		var a = d(), o = f(a);
		r(o, () => e(i).tag, !0, (t, n) => {
			h(t, () => ({
				xmlns: "http://www.w3.org/2000/svg",
				...e(i).attrs
			}));
		}), t(n, a);
	}), a(T), m(() => {
		p(T, "width", b()), p(T, "height", b()), l(T, 0, n(y.class)), _(T, y.style), p(T, "role", y.label ? "img" : void 0), p(T, "aria-label", y.label), p(T, "aria-hidden", y.label ? void 0 : "true");
	}), t(u, T), i();
}
export { C as t };
