import "./disclose-version-DFvUDwEH.js";
import { E as e, a as t, n, r, s as i } from "./HostGlyph-BX4wqFXI.js";
import { At as a, Ct as o, L as s, M as c, R as l, St as u, Y as d, at as f, bt as p, mt as m, n as h, ot as g, r as _, z as v } from "./index-client-BSGo5gVb.js";
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
var x = (e) => !!e && !!b(e), S = v("<span class=\"mark svelte-d6sst4\"><!></span>");
function C(n, i) {
	o(i, !0);
	let v = _(i, "size", 3, 16), x = m(() => b(i.address)), C = p(e);
	h(() => {
		if (d(x) || !C) return;
		let e = r(i.address);
		e && C(e);
		let t = y(i.address);
		t && C(`https://${t}`);
	});
	var w = l(), T = g(w), E = (e) => {
		var n = S(), r = f(n);
		t(r, {
			get image() {
				return d(x).image;
			},
			get tone() {
				return d(x).tone;
			},
			get size() {
				return v();
			},
			lit: !0
		}), a(n), s(e, n);
	};
	c(T, (e) => {
		d(x) && e(E);
	}), s(n, w), u();
}
export { x as n, C as t };
