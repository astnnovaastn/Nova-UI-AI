import "./disclose-version-DFvUDwEH.js";
import { A as e, At as t, Ct as n, F as r, H as i, L as a, M as o, R as s, St as c, Y as l, at as u, k as d, ot as f, r as p, tt as m, y as h, z as g } from "./index-client-BSGo5gVb.js";
// upstream/src/features/work/components/objects/inline.ts
function _(e) {
	let t = [], n = /(\*\*([^*]+)\*\*|`([^`]+)`)/gu, r = 0;
	for (let i of e.matchAll(n)) i.index > r && t.push({ text: e.slice(r, i.index) }), t.push(i[2] === void 0 ? {
		text: i[3],
		code: !0
	} : {
		text: i[2],
		strong: !0
	}), r = i.index + i[0].length;
	return r < e.length && t.push({ text: e.slice(r) }), t;
}
// upstream/src/features/work/components/objects/Inline.svelte
var v = g("<strong> </strong>"), y = g("<code class=\"svelte-11x120k\"> </code>");
function b(g, b) {
	n(b, !0);
	let x = p(b, "plain", 3, !1);
	var S = s(), C = f(S);
	d(C, 17, () => _(b.text), e, (e, n) => {
		var c = s(), d = f(c), p = (e) => {
			var i = v();
			let o;
			var s = u(i, !0);
			t(i), m(() => {
				o = h(i, 1, "svelte-11x120k", null, o, { plain: x() }), r(s, l(n).text);
			}), a(e, i);
		}, g = (e) => {
			var i = y(), o = u(i, !0);
			t(i), m(() => r(o, l(n).text)), a(e, i);
		}, _ = (e) => {
			var t = i();
			m(() => r(t, l(n).text)), a(e, t);
		};
		o(d, (e) => {
			l(n).strong ? e(p) : l(n).code ? e(g, 1) : e(_, -1);
		}), a(e, c);
	}), a(g, S), c();
}
export { b as t };
