import { $ as e, B as t, Dt as n, F as r, Ft as i, H as a, K as o, Ot as s, R as c, Tt as l, V as u, dt as d, h as f, ot as p, q as m, ut as h, yt as g } from "./index-client-C_2wYFnt.js";
import "./disclose-version-DFvUDwEH.js";
import { t as _ } from "./runtime-Ci9kzAvr.js";
import "./index-client-RfUBbaI1.js";
import "./bindings-CWWuBYk9.js";
import { x as v } from "./HostGlyph-D7LkZa-a.js";
// upstream/src/shared/i18n/messages/work_make_tasks.js
var y = () => "Make tasks", b = ((e = {}, t = {}) => (t.locale ?? _(), y(e))), x = () => "One task for you per step, linked to this Work", S = ((e = {}, t = {}) => (t.locale ?? _(), x(e))), C = () => "Making tasks…", w = ((e = {}, t = {}) => (t.locale ?? _(), C(e))), T = () => "Open in Tasks", E = ((e = {}, t = {}) => (t.locale ?? _(), T(e))), D = Symbol("work-tasks"), O = a("<button type=\"button\" class=\"open nodrag nopan svelte-twgb0h\"> </button>"), k = a("<button type=\"button\" class=\"make nodrag nopan svelte-twgb0h\"> </button>");
function A(a, o) {
	s(o, !0);
	let _ = l(D), y = g(() => _?.state(o.id) ?? "none"), x = l(v);
	var C = u(), T = d(C), A = (e) => {
		var n = u(), a = d(n), o = (e) => {
			var n = O(), r = h(n, !0);
			i(n), p((e) => c(r, e), [() => E()]), m("click", n, () => x?.()), t(e, n);
		};
		r(a, (e) => {
			x && e(o);
		}), t(e, n);
	}, j = (n) => {
		var r = k(), a = h(r, !0);
		i(r), p((t, n) => {
			r.disabled = e(y) !== "ready", f(r, "title", t), c(a, n);
		}, [() => S(), () => e(y) === "making" ? w() : b()]), m("click", r, () => void _?.make(o.id)), t(n, r);
	};
	r(T, (t) => {
		e(y) === "made" ? t(A) : e(y) !== "none" && t(j, 1);
	}), t(a, C), n();
}
o(["click"]);
export { D as n, A as t };
