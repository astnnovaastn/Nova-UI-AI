import { B as e, Ct as t, Et as n, F as r, H as i, K as a, Nt as o, Q as s, R as c, Tt as l, V as u, _t as d, ct as f, h as p, it as m, lt as h, q as g } from "./index-client-oI5R0J23.js";
import "./disclose-version-DFvUDwEH.js";
import "./index-client-zcLcgEWT.js";
import { w as _ } from "./HostGlyph-C4fKhFEj.js";
import "./bindings-BGIzoVqy.js";
import { t as v } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_make_tasks.js
var y = () => "Make tasks", b = ((e = {}, t = {}) => (t.locale ?? v(), y(e))), x = () => "One task for you per step, linked to this Work", S = ((e = {}, t = {}) => (t.locale ?? v(), x(e))), C = () => "Making tasks…", w = ((e = {}, t = {}) => (t.locale ?? v(), C(e))), T = () => "Open in Tasks", E = ((e = {}, t = {}) => (t.locale ?? v(), T(e))), D = Symbol("work-tasks"), O = i("<button type=\"button\" class=\"open nodrag nopan svelte-twgb0h\"> </button>"), k = i("<button type=\"button\" class=\"make nodrag nopan svelte-twgb0h\"> </button>");
function A(i, a) {
	n(a, !0);
	let v = t(D), y = d(() => v?.state(a.id) ?? "none"), x = t(_);
	var C = u(), T = h(C), A = (t) => {
		var n = u(), i = h(n), a = (t) => {
			var n = O(), r = f(n, !0);
			o(n), m((e) => c(r, e), [() => E()]), g("click", n, () => x?.()), e(t, n);
		};
		r(i, (e) => {
			x && e(a);
		}), e(t, n);
	}, j = (t) => {
		var n = k(), r = f(n, !0);
		o(n), m((e, t) => {
			n.disabled = s(y) !== "ready", p(n, "title", e), c(r, t);
		}, [() => S(), () => s(y) === "making" ? w() : b()]), g("click", n, () => void v?.make(a.id)), e(t, n);
	};
	r(T, (e) => {
		s(y) === "made" ? e(A) : s(y) !== "none" && e(j, 1);
	}), e(i, C), l();
}
a(["click"]);
export { D as n, A as t };
