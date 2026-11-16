import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, F as r, Ft as i, G as a, H as o, M as s, N as c, Ot as l, R as u, S as d, V as f, dt as p, ot as m, r as h, ut as g } from "./index-client-C_2wYFnt.js";
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
var v = o("<strong> </strong>"), y = o("<code class=\"svelte-11x120k\"> </code>");
function b(o, b) {
	l(b, !0);
	let x = h(b, "plain", 3, !1);
	var S = f(), C = p(S);
	s(C, 17, () => _(b.text), c, (n, o) => {
		var s = f(), c = p(s), l = (n) => {
			var r = v();
			let a;
			var s = g(r, !0);
			i(r), m(() => {
				a = d(r, 1, "svelte-11x120k", null, a, { plain: x() }), u(s, e(o).text);
			}), t(n, r);
		}, h = (n) => {
			var r = y(), a = g(r, !0);
			i(r), m(() => u(a, e(o).text)), t(n, r);
		}, _ = (n) => {
			var r = a();
			m(() => u(r, e(o).text)), t(n, r);
		};
		r(c, (t) => {
			e(o).strong ? t(l) : e(o).code ? t(h, 1) : t(_, -1);
		}), t(n, s);
	}), t(o, S), n();
}
export { b as t };
