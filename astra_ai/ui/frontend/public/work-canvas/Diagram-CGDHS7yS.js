import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, F as r, Ft as i, H as a, Ot as o, _t as s, c, ft as l, h as u, ht as d, ot as f, r as p, ut as m } from "./index-client-C_2wYFnt.js";
import { t as h } from "./Diagram-CnBuQMhA.js";
import { t as g } from "./Title-BF8NXEcN.js";
// upstream/src/features/work/components/objects/Diagram.svelte
var _ = a("<section class=\"diagram svelte-19qshla\"><!> <!></section>");
function v(a, v) {
	o(v, !0);
	let y = p(v, "actions", 19, () => ({})), b = s(0);
	var x = _(), S = m(x), C = (e) => {
		g(e, { get text() {
			return v.object.title;
		} });
	};
	r(S, (e) => {
		v.object.title && e(C);
	});
	var w = l(S, 2), T = (t) => {
		h(t, {
			get diagram() {
				return v.object.diagram;
			},
			get width() {
				return e(b);
			},
			get way() {
				return v.object.way;
			},
			get ask() {
				return y().ask;
			}
		});
	};
	r(w, (t) => {
		e(b) && t(T);
	}), i(x), f(() => u(x, "aria-label", v.object.title)), c(x, "clientWidth", (e) => d(b, e)), t(a, x), n();
}
export { v as default };
