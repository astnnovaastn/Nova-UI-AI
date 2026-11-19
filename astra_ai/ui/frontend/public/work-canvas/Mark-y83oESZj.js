import "./disclose-version-7ONGmeVC.js";
import { C as e, n as t, o as n, r } from "./HostGlyph-CXcYKorm.js";
import { Ct as i, H as a, L as o, Mt as s, U as c, W as l, jt as u, kt as d, mt as f, n as p, pt as m, r as h, tt as g, zt as _ } from "./index-client-DH73-vTM.js";
import "./FavIcon-B-1SmexQ.js";
import { t as v } from "./FavIcon-Dsc27BCG.js";
// upstream/src/features/work/components/objects/Mark.svelte
function y(e) {
	let t = r(e);
	if (!t) return null;
	let i = new URL(t).hostname.replace(/^www\./iu, ""), a = n(i);
	return a && a !== i ? a : null;
}
function b(e) {
	let n = y(e);
	return t(e) ?? (n ? t(n) : null);
}
var x = (e) => !!e && !!b(e), S = l("<span class=\"mark svelte-d6sst4\"><!></span>");
function C(t, n) {
	s(n, !0);
	let l = h(n, "size", 3, 16), x = i(() => b(n.address)), C = d(e);
	p(() => {
		if (g(x) || !C) return;
		let e = r(n.address);
		e && C(e);
		let t = y(n.address);
		t && C(`https://${t}`);
	});
	var w = c(), T = f(w), E = (e) => {
		var t = S(), n = m(t);
		v(n, {
			get image() {
				return g(x).image;
			},
			get tone() {
				return g(x).tone;
			},
			get size() {
				return l();
			},
			lit: !0
		}), _(t), a(e, t);
	};
	o(T, (e) => {
		g(x) && e(E);
	}), a(t, w), u();
}
export { x as n, C as t };
