import "./disclose-version-DFvUDwEH.js";
import { B as e, Et as t, F as n, H as r, K as i, M as a, Nt as o, Q as s, R as c, Tt as l, _t as u, ct as d, h as f, it as p, q as m, r as h, ut as g } from "./index-client-oI5R0J23.js";
import { t as _ } from "./Icon-BfOzno3u.js";
import { t as v } from "./File01Icon-C7ue_hSG.js";
import { t as y } from "./Folder01Icon-DE8-U2cv.js";
import { t as b } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_folder_count.js
var x = (e) => `${e?.count} items`, S = ((e, t = {}) => (t.locale ?? b(), x(e))), C = r("<img alt=\"\" width=\"18\" height=\"18\" decoding=\"async\" class=\"svelte-1wu3m4d\"/>"), w = r("<li class=\"svelte-1wu3m4d\"><!><span class=\"svelte-1wu3m4d\"> </span></li>"), T = r("<ul class=\"svelte-1wu3m4d\"></ul>"), E = r("<figure class=\"folder svelte-1wu3m4d\"><span class=\"behind two svelte-1wu3m4d\" aria-hidden=\"true\"></span> <span class=\"behind one svelte-1wu3m4d\" aria-hidden=\"true\"></span> <button type=\"button\" class=\"front nodrag nopan svelte-1wu3m4d\"><span class=\"head svelte-1wu3m4d\"><!> <span class=\"name svelte-1wu3m4d\"> </span> <span class=\"count svelte-1wu3m4d\"> </span></span> <!></button></figure>");
function D(r, i) {
	t(i, !0);
	let b = h(i, "actions", 19, () => ({})), x = h(i, "centre", 3, !1), D = u(() => x() ? i.object.entries : i.object.entries.slice(0, 4));
	var O = E(), k = g(d(O), 4), A = d(k), j = d(A);
	_(j, {
		get icon() {
			return y;
		},
		size: 18
	});
	var M = g(j, 2), N = d(M, !0);
	o(M);
	var P = g(M, 2), F = d(P, !0);
	o(P), o(A);
	var I = g(A, 2), L = (t) => {
		var r = T();
		a(r, 21, () => s(D), (e) => e.name, (t, r) => {
			var i = w(), a = d(i), l = (t) => {
				var n = C();
				p(() => f(n, "src", s(r).picture.src)), e(t, n);
			}, m = (e) => {
				{
					let t = u(() => s(r).folder ? y : v);
					_(e, {
						get icon() {
							return s(t);
						},
						size: 15
					});
				}
			};
			n(a, (e) => {
				s(r).picture ? e(l) : e(m, -1);
			});
			var h = g(a), b = d(h, !0);
			o(h), o(i), p(() => c(b, s(r).name)), e(t, i);
		}), o(r), e(t, r);
	};
	n(I, (e) => {
		s(D).length && e(L);
	}), o(k), o(O), p((e) => {
		f(O, "aria-label", i.object.name), c(N, i.object.name), c(F, e);
	}, [() => S({ count: i.object.count })]), m("click", k, () => b().open?.(i.object.id)), e(r, O), l();
}
i(["click"]);
export { D as default };
