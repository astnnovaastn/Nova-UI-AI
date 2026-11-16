import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, F as r, Ft as i, H as a, K as o, M as s, Ot as c, R as l, ft as u, h as d, ot as f, q as p, r as m, ut as h, yt as g } from "./index-client-C_2wYFnt.js";
import { t as _ } from "./Icon-E4BzZ4dm.js";
import { t as v } from "./File01Icon-C7ue_hSG.js";
import { t as y } from "./Folder01Icon-DE8-U2cv.js";
import { t as b } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_folder_count.js
var x = (e) => `${e?.count} items`, S = ((e, t = {}) => (t.locale ?? b(), x(e))), C = a("<img alt=\"\" width=\"18\" height=\"18\" decoding=\"async\" class=\"svelte-1wu3m4d\"/>"), w = a("<li class=\"svelte-1wu3m4d\"><!><span class=\"svelte-1wu3m4d\"> </span></li>"), T = a("<ul class=\"svelte-1wu3m4d\"></ul>"), E = a("<figure class=\"folder svelte-1wu3m4d\"><span class=\"behind two svelte-1wu3m4d\" aria-hidden=\"true\"></span> <span class=\"behind one svelte-1wu3m4d\" aria-hidden=\"true\"></span> <button type=\"button\" class=\"front nodrag nopan svelte-1wu3m4d\"><span class=\"head svelte-1wu3m4d\"><!> <span class=\"name svelte-1wu3m4d\"> </span> <span class=\"count svelte-1wu3m4d\"> </span></span> <!></button></figure>");
function D(a, o) {
	c(o, !0);
	let b = m(o, "actions", 19, () => ({})), x = m(o, "centre", 3, !1), D = g(() => x() ? o.object.entries : o.object.entries.slice(0, 4));
	var O = E(), k = u(h(O), 4), A = h(k), j = h(A);
	_(j, {
		get icon() {
			return y;
		},
		size: 18
	});
	var M = u(j, 2), N = h(M, !0);
	i(M);
	var P = u(M, 2), F = h(P, !0);
	i(P), i(A);
	var I = u(A, 2), L = (n) => {
		var a = T();
		s(a, 21, () => e(D), (e) => e.name, (n, a) => {
			var o = w(), s = h(o), c = (n) => {
				var r = C();
				f(() => d(r, "src", e(a).picture.src)), t(n, r);
			}, p = (t) => {
				{
					let n = g(() => e(a).folder ? y : v);
					_(t, {
						get icon() {
							return e(n);
						},
						size: 15
					});
				}
			};
			r(s, (t) => {
				e(a).picture ? t(c) : t(p, -1);
			});
			var m = u(s), b = h(m, !0);
			i(m), i(o), f(() => l(b, e(a).name)), t(n, o);
		}), i(a), t(n, a);
	};
	r(I, (t) => {
		e(D).length && t(L);
	}), i(k), i(O), f((e) => {
		d(O, "aria-label", o.object.name), l(N, o.object.name), l(F, e);
	}, [() => S({ count: o.object.count })]), p("click", k, () => b().open?.(o.object.id)), t(a, O), n();
}
o(["click"]);
export { D as default };
