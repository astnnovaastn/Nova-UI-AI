import "./disclose-version-DFvUDwEH.js";
import { B as e, Et as t, F as n, H as r, Nt as i, Q as a, Tt as o, c as s, ct as c, h as l, ht as u, it as d, pt as f, r as p, ut as m } from "./index-client-oI5R0J23.js";
import { t as h } from "./Diagram-33EpJNE3.js";
import { t as g } from "./Title-DCqcKCqa.js";
// upstream/src/features/work/components/objects/Diagram.svelte
var _ = r("<section class=\"diagram svelte-19qshla\"><!> <!></section>");
function v(r, v) {
	t(v, !0);
	let y = p(v, "actions", 19, () => ({})), b = u(0);
	var x = _(), S = c(x), C = (e) => {
		g(e, { get text() {
			return v.object.title;
		} });
	};
	n(S, (e) => {
		v.object.title && e(C);
	});
	var w = m(S, 2), T = (e) => {
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
	n(w, (e) => {
		a(b) && e(T);
	}), i(x), d(() => l(x, "aria-label", v.object.title)), s(x, "clientWidth", (e) => f(b, e)), e(r, x), o();
}
export { v as default };
