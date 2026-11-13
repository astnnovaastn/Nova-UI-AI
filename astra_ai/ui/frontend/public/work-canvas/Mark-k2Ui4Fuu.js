import "./disclose-version-DFvUDwEH.js";
import { E as e, a as t, n, r, s as i } from "./HostGlyph-C4fKhFEj.js";
import { B as a, Ct as o, Et as s, F as c, H as l, Nt as u, Q as d, Tt as f, V as p, _t as m, ct as h, lt as g, n as _, r as v } from "./index-client-oI5R0J23.js";
// upstream/src/features/work/components/objects/Mark.svelte
function y(e) {
	let t = r(e);
	if (!t) return null;
	let n = new URL(t).hostname.replace(/^www\./iu, ""), a = i(n);
	return a && a !== n ? a : null;
}
function b(e) {
	let t = y(e);
	return n(e) ?? (t ? n(t) : null);
}
var x = (e) => !!e && !!b(e), S = l("<span class=\"mark svelte-d6sst4\"><!></span>");
function C(n, i) {
	s(i, !0);
	let l = v(i, "size", 3, 16), x = m(() => b(i.address)), C = o(e);
	_(() => {
		if (d(x) || !C) return;
		let e = r(i.address);
		e && C(e);
		let t = y(i.address);
		t && C(`https://${t}`);
	});
	var w = p(), T = g(w), E = (e) => {
		var n = S(), r = h(n);
		t(r, {
			get image() {
				return d(x).image;
			},
			get tone() {
				return d(x).tone;
			},
			get size() {
				return l();
			},
			lit: !0
		}), u(n), a(e, n);
	};
	c(T, (e) => {
		d(x) && e(E);
	}), a(n, w), f();
}
export { x as n, C as t };
