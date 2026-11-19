import { B as e, Ct as t, H as n, J as r, L as i, Mt as a, U as o, W as s, Y as c, h as l, jt as u, kt as d, lt as f, mt as p, pt as m, tt as h, zt as g } from "./index-client-DH73-vTM.js";
import "./disclose-version-7ONGmeVC.js";
import { t as _ } from "./runtime-Ci9kzAvr.js";
import "./index-client-AzfegT-i.js";
import "./bindings-CEUY5ty1.js";
import { x as v } from "./HostGlyph-CXcYKorm.js";
// upstream/src/shared/i18n/messages/work_make_tasks.js
var y = () => "Make tasks", b = ((e = {}, t = {}) => (t.locale ?? _(), y(e))), x = () => "One task for you per step, linked to this Work", S = ((e = {}, t = {}) => (t.locale ?? _(), x(e))), C = () => "Making tasks…", w = ((e = {}, t = {}) => (t.locale ?? _(), C(e))), T = () => "Open in Tasks", E = ((e = {}, t = {}) => (t.locale ?? _(), T(e))), D = Symbol("work-tasks"), O = s("<button type=\"button\" class=\"open nodrag nopan svelte-twgb0h\"> </button>"), k = s("<button type=\"button\" class=\"make nodrag nopan svelte-twgb0h\"> </button>");
function A(r, s) {
	a(s, !0);
	let _ = d(D), y = t(() => _?.state(s.id) ?? "none"), x = d(v);
	var C = o(), T = p(C), A = (t) => {
		var r = o(), a = p(r), s = (t) => {
			var r = O(), i = m(r, !0);
			g(r), f((t) => e(i, t), [() => E()]), c("click", r, () => x?.()), n(t, r);
		};
		i(a, (e) => {
			x && e(s);
		}), n(t, r);
	}, j = (t) => {
		var r = k(), i = m(r, !0);
		g(r), f((t, n) => {
			r.disabled = h(y) !== "ready", l(r, "title", t), e(i, n);
		}, [() => S(), () => h(y) === "making" ? w() : b()]), c("click", r, () => void _?.make(s.id)), n(t, r);
	};
	i(T, (e) => {
		h(y) === "made" ? e(A) : h(y) !== "none" && e(j, 1);
	}), n(r, C), u();
}
r(["click"]);
export { D as n, A as t };
