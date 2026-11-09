import "./disclose-version-DFvUDwEH.js";
import { A as e, At as t, B as n, Ct as r, L as i, R as a, St as o, Y as s, b as c, f as l, k as u, m as d, mt as f, ot as p, r as m, tt as h, v as g, w as _, y as v } from "./index-client-BSGo5gVb.js";
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
var S = n("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" color=\"currentColor\" focusable=\"false\"></svg>");
function C(n, y) {
	r(y, !0);
	let b = m(y, "size", 3, 16), C = m(y, "strokeWidth", 3, 1.7), w = f(() => x(y.icon, C()));
	var T = S();
	u(T, 21, () => s(w), e, (e, t) => {
		var n = a(), r = p(n);
		_(r, () => s(t).tag, !0, (e, n) => {
			l(e, () => ({
				xmlns: "http://www.w3.org/2000/svg",
				...s(t).attrs
			}));
		}), i(e, n);
	}), t(T), h(() => {
		d(T, "width", b()), d(T, "height", b()), v(T, 0, c(y.class)), g(T, y.style), d(T, "role", y.label ? "img" : void 0), d(T, "aria-label", y.label), d(T, "aria-hidden", y.label ? void 0 : "true");
	}), i(n, T), o();
}
export { C as t };
