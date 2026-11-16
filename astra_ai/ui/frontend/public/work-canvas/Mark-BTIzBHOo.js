import "./disclose-version-DFvUDwEH.js";
import { C as e, n as t, o as n, r } from "./HostGlyph-D7LkZa-a.js";
import { $ as i, B as a, Dt as o, F as s, Ft as c, H as l, Ot as u, Tt as d, V as f, dt as p, n as m, r as h, ut as g, yt as _ } from "./index-client-C_2wYFnt.js";
import "./FavIcon-CMLLDqJA.js";
import { t as v } from "./FavIcon-DK-naZed.js";
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
	u(n, !0);
	let l = h(n, "size", 3, 16), x = _(() => b(n.address)), C = d(e);
	m(() => {
		if (i(x) || !C) return;
		let e = r(n.address);
		e && C(e);
		let t = y(n.address);
		t && C(`https://${t}`);
	});
	var w = f(), T = p(w), E = (e) => {
		var t = S(), n = g(t);
		v(n, {
			get image() {
				return i(x).image;
			},
			get tone() {
				return i(x).tone;
			},
			get size() {
				return l();
			},
			lit: !0
		}), c(t), a(e, t);
	};
	s(T, (e) => {
		i(x) && e(E);
	}), a(t, w), o();
}
export { x as n, C as t };
