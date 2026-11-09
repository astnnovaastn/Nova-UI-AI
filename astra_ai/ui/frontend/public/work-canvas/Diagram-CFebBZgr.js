import "./disclose-version-DFvUDwEH.js";
import { At as e, Ct as t, L as n, M as r, St as i, Y as a, at as o, c as s, ft as c, m as l, r as u, st as d, tt as f, ut as p, z as m } from "./index-client-BSGo5gVb.js";
import { t as h } from "./Diagram-D-p3NjBb.js";
import { t as g } from "./Title-3U-zV-ZX.js";
// upstream/src/features/work/components/objects/Diagram.svelte
var _ = m("<section class=\"diagram svelte-19qshla\"><!> <!></section>");
function v(m, v) {
	t(v, !0);
	let y = u(v, "actions", 19, () => ({})), b = c(0);
	var x = _(), S = o(x), C = (e) => {
		g(e, { get text() {
			return v.object.title;
		} });
	};
	r(S, (e) => {
		v.object.title && e(C);
	});
	var w = d(S, 2), T = (e) => {
		h(e, {
			get diagram() {
				return v.object.diagram;
			},
			get width() {
				return a(b);
			},
			get ask() {
				return y().ask;
			}
		});
	};
	r(w, (e) => {
		a(b) && e(T);
	}), e(x), f(() => l(x, "aria-label", v.object.title)), s(x, "clientWidth", (e) => p(b, e)), n(m, x), i();
}
export { v as default };
