import "./disclose-version-DFvUDwEH.js";
import { At as e, Ct as t, F as n, L as r, M as i, St as a, U as o, W as s, Y as c, at as l, k as u, m as d, mt as f, r as p, st as m, tt as h, z as g } from "./index-client-BSGo5gVb.js";
import { t as _ } from "./Icon-BWISRU-8.js";
import { t as v } from "./File01Icon-C7ue_hSG.js";
import { t as y } from "./Folder01Icon-DE8-U2cv.js";
import { t as b } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_folder_count.js
var x = (e) => `${e?.count} items`, S = ((e, t = {}) => (t.locale ?? b(), x(e))), C = g("<img alt=\"\" width=\"18\" height=\"18\" decoding=\"async\" class=\"svelte-1wu3m4d\"/>"), w = g("<li class=\"svelte-1wu3m4d\"><!><span class=\"svelte-1wu3m4d\"> </span></li>"), T = g("<ul class=\"svelte-1wu3m4d\"></ul>"), E = g("<figure class=\"folder svelte-1wu3m4d\"><span class=\"behind two svelte-1wu3m4d\" aria-hidden=\"true\"></span> <span class=\"behind one svelte-1wu3m4d\" aria-hidden=\"true\"></span> <button type=\"button\" class=\"front nodrag nopan svelte-1wu3m4d\"><span class=\"head svelte-1wu3m4d\"><!> <span class=\"name svelte-1wu3m4d\"> </span> <span class=\"count svelte-1wu3m4d\"> </span></span> <!></button></figure>");
function D(o, g) {
	t(g, !0);
	let b = p(g, "actions", 19, () => ({})), x = p(g, "centre", 3, !1), D = f(() => x() ? g.object.entries : g.object.entries.slice(0, 4));
	var O = E(), k = m(l(O), 4), A = l(k), j = l(A);
	_(j, {
		get icon() {
			return y;
		},
		size: 18
	});
	var M = m(j, 2), N = l(M, !0);
	e(M);
	var P = m(M, 2), F = l(P, !0);
	e(P), e(A);
	var I = m(A, 2), L = (t) => {
		var a = T();
		u(a, 21, () => c(D), (e) => e.name, (t, a) => {
			var o = w(), s = l(o), u = (e) => {
				var t = C();
				h(() => d(t, "src", c(a).picture.src)), r(e, t);
			}, p = (e) => {
				{
					let t = f(() => c(a).folder ? y : v);
					_(e, {
						get icon() {
							return c(t);
						},
						size: 15
					});
				}
			};
			i(s, (e) => {
				c(a).picture ? e(u) : e(p, -1);
			});
			var g = m(s), b = l(g, !0);
			e(g), e(o), h(() => n(b, c(a).name)), r(t, o);
		}), e(a), r(t, a);
	};
	i(I, (e) => {
		c(D).length && e(L);
	}), e(k), e(O), h((e) => {
		d(O, "aria-label", g.object.name), n(N, g.object.name), n(F, e);
	}, [() => S({ count: g.object.count })]), s("click", k, () => b().open?.(g.object.id)), r(o, O), a();
}
o(["click"]);
export { D as default };
