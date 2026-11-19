import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, H as n, J as r, L as i, Mt as a, P as o, W as s, Y as c, h as l, ht as u, jt as d, lt as f, pt as p, r as m, tt as h, zt as g } from "./index-client-DH73-vTM.js";
import { t as _ } from "./Icon-D2j1Ej6Z.js";
import "./Icon-CmjKIKuh.js";
import { t as v } from "./File01Icon-1POdYzZt.js";
import { t as y } from "./Folder01Icon-BHrTk5xe.js";
import { t as b } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_folder_count.js
var x = (e) => `${e?.count} items`, S = ((e, t = {}) => (t.locale ?? b(), x(e))), C = s("<img alt=\"\" width=\"18\" height=\"18\" decoding=\"async\" class=\"svelte-1wu3m4d\"/>"), w = s("<li class=\"svelte-1wu3m4d\"><!><span class=\"svelte-1wu3m4d\"> </span></li>"), T = s("<ul class=\"svelte-1wu3m4d\"></ul>"), E = s("<figure class=\"folder svelte-1wu3m4d\"><span class=\"behind two svelte-1wu3m4d\" aria-hidden=\"true\"></span> <span class=\"behind one svelte-1wu3m4d\" aria-hidden=\"true\"></span> <button type=\"button\" class=\"front nodrag nopan svelte-1wu3m4d\"><span class=\"head svelte-1wu3m4d\"><!> <span class=\"name svelte-1wu3m4d\"> </span> <span class=\"count svelte-1wu3m4d\"> </span></span> <!></button></figure>");
function D(r, s) {
	a(s, !0);
	let b = m(s, "actions", 19, () => ({})), x = m(s, "centre", 3, !1), D = t(() => x() ? s.object.entries : s.object.entries.slice(0, 4));
	var O = E(), k = u(p(O), 4), A = p(k), j = p(A);
	_(j, {
		get icon() {
			return y;
		},
		size: 18
	});
	var M = u(j, 2), N = p(M, !0);
	g(M);
	var P = u(M, 2), F = p(P, !0);
	g(P), g(A);
	var I = u(A, 2), L = (r) => {
		var a = T();
		o(a, 21, () => h(D), (e) => e.name, (r, a) => {
			var o = w(), s = p(o), c = (e) => {
				var t = C();
				f(() => l(t, "src", h(a).picture.src)), n(e, t);
			}, d = (e) => {
				{
					let n = t(() => h(a).folder ? y : v);
					_(e, {
						get icon() {
							return h(n);
						},
						size: 15
					});
				}
			};
			i(s, (e) => {
				h(a).picture ? e(c) : e(d, -1);
			});
			var m = u(s), b = p(m, !0);
			g(m), g(o), f(() => e(b, h(a).name)), n(r, o);
		}), g(a), n(r, a);
	};
	i(I, (e) => {
		h(D).length && e(L);
	}), g(k), g(O), f((t) => {
		l(O, "aria-label", s.object.name), e(N, s.object.name), e(F, t);
	}, [() => S({ count: s.object.count })]), c("click", k, () => b().open?.(s.object.id)), n(r, O), d();
}
r(["click"]);
export { D as default };
