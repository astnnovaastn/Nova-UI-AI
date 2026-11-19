import "./disclose-version-7ONGmeVC.js";
import { B as e, F as t, H as n, L as r, Mt as i, P as a, S as o, U as s, W as c, jt as l, lt as u, mt as d, pt as f, q as p, r as m, tt as h, zt as g } from "./index-client-DH73-vTM.js";
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
var v = c("<strong> </strong>"), y = c("<code class=\"svelte-11x120k\"> </code>");
function b(c, b) {
	i(b, !0);
	let x = m(b, "plain", 3, !1);
	var S = s(), C = d(S);
	a(C, 17, () => _(b.text), t, (t, i) => {
		var a = s(), c = d(a), l = (t) => {
			var r = v();
			let a;
			var s = f(r, !0);
			g(r), u(() => {
				a = o(r, 1, "svelte-11x120k", null, a, { plain: x() }), e(s, h(i).text);
			}), n(t, r);
		}, m = (t) => {
			var r = y(), a = f(r, !0);
			g(r), u(() => e(a, h(i).text)), n(t, r);
		}, _ = (t) => {
			var r = p();
			u(() => e(r, h(i).text)), n(t, r);
		};
		r(c, (e) => {
			h(i).strong ? e(l) : h(i).code ? e(m, 1) : e(_, -1);
		}), n(t, a);
	}), n(c, S), l();
}
export { b as t };
