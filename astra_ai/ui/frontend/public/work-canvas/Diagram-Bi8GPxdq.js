import "./disclose-version-7ONGmeVC.js";
import { H as e, L as t, Mt as n, W as r, bt as i, c as a, h as o, ht as s, jt as c, lt as l, pt as u, r as d, tt as f, vt as p, zt as m } from "./index-client-DH73-vTM.js";
import { t as h } from "./Diagram-BSMbUJ0b.js";
import { t as g } from "./Title-B4cGdolK.js";
// upstream/src/features/work/components/objects/Diagram.svelte
var _ = r("<section class=\"diagram svelte-19qshla\"><!> <!></section>");
function v(r, v) {
	n(v, !0);
	let y = d(v, "actions", 19, () => ({})), b = i(0);
	var x = _(), S = u(x), C = (e) => {
		g(e, { get text() {
			return v.object.title;
		} });
	};
	t(S, (e) => {
		v.object.title && e(C);
	});
	var w = s(S, 2), T = (e) => {
		h(e, {
			get diagram() {
				return v.object.diagram;
			},
			get width() {
				return f(b);
			},
			get way() {
				return v.object.way;
			},
			get ask() {
				return y().ask;
			}
		});
	};
	t(w, (e) => {
		f(b) && e(T);
	}), m(x), l(() => o(x, "aria-label", v.object.title)), a(x, "clientWidth", (e) => p(b, e)), e(r, x), c();
}
export { v as default };
