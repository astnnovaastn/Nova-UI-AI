import { At as e, Ct as t, F as n, L as r, M as i, R as a, St as o, U as s, W as c, Y as l, at as u, bt as d, m as f, mt as p, ot as m, tt as h, z as g } from "./index-client-BSGo5gVb.js";
import "./disclose-version-DFvUDwEH.js";
import "./index-client-CT6TpZ12.js";
import { w as _ } from "./HostGlyph-BX4wqFXI.js";
import "./bindings-BGIzoVqy.js";
import { t as v } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_make_tasks.js
var y = () => "Make tasks", b = ((e = {}, t = {}) => (t.locale ?? v(), y(e))), x = () => "One task for you per step, linked to this Work", S = ((e = {}, t = {}) => (t.locale ?? v(), x(e))), C = () => "Making tasks…", w = ((e = {}, t = {}) => (t.locale ?? v(), C(e))), T = () => "Open in Tasks", E = ((e = {}, t = {}) => (t.locale ?? v(), T(e))), D = Symbol("work-tasks"), O = g("<button type=\"button\" class=\"open nodrag nopan svelte-twgb0h\"> </button>"), k = g("<button type=\"button\" class=\"make nodrag nopan svelte-twgb0h\"> </button>");
function A(s, g) {
	t(g, !0);
	let v = d(D), y = p(() => v?.state(g.id) ?? "none"), x = d(_);
	var C = a(), T = m(C), A = (t) => {
		var o = a(), s = m(o), l = (t) => {
			var i = O(), a = u(i, !0);
			e(i), h((e) => n(a, e), [() => E()]), c("click", i, () => x?.()), r(t, i);
		};
		i(s, (e) => {
			x && e(l);
		}), r(t, o);
	}, j = (t) => {
		var i = k(), a = u(i, !0);
		e(i), h((e, t) => {
			i.disabled = l(y) !== "ready", f(i, "title", e), n(a, t);
		}, [() => S(), () => l(y) === "making" ? w() : b()]), c("click", i, () => void v?.make(g.id)), r(t, i);
	};
	i(T, (e) => {
		l(y) === "made" ? e(A) : l(y) !== "none" && e(j, 1);
	}), r(s, C), o();
}
s(["click"]);
export { D as n, A as t };
