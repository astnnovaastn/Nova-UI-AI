import "./disclose-version-DFvUDwEH.js";
import { B as e, Et as t, F as n, G as r, H as i, M as a, N as o, Nt as s, Q as c, R as l, S as u, Tt as d, V as f, ct as p, it as m, lt as h, r as g } from "./index-client-oI5R0J23.js";
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
var v = i("<strong> </strong>"), y = i("<code class=\"svelte-11x120k\"> </code>");
function b(i, b) {
	t(b, !0);
	let x = g(b, "plain", 3, !1);
	var S = f(), C = h(S);
	a(C, 17, () => _(b.text), o, (t, i) => {
		var a = f(), o = h(a), d = (t) => {
			var n = v();
			let r;
			var a = p(n, !0);
			s(n), m(() => {
				r = u(n, 1, "svelte-11x120k", null, r, { plain: x() }), l(a, c(i).text);
			}), e(t, n);
		}, g = (t) => {
			var n = y(), r = p(n, !0);
			s(n), m(() => l(r, c(i).text)), e(t, n);
		}, _ = (t) => {
			var n = r();
			m(() => l(n, c(i).text)), e(t, n);
		};
		n(o, (e) => {
			c(i).strong ? e(d) : c(i).code ? e(g, 1) : e(_, -1);
		}), e(t, a);
	}), e(i, S), d();
}
export { b as t };
