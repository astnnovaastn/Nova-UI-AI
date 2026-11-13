import "./disclose-version-DFvUDwEH.js";
import { Et as e, Q as t, Tt as n, _t as r, r as i } from "./index-client-oI5R0J23.js";
import a from "./Chart-CuobbSPA.js";
import { n as o, r as s, t as c } from "./work-chart-BUVMYKhU.js";
// upstream/src/shared/ui/data/Artifact/WorkChart.svelte
function l(l, u) {
	e(u, !0);
	let d = i(u, "compact", 3, !1), f = r(() => {
		let e = c(u.chart.basis);
		return o({
			...u.chart,
			basis: e && s({ basis: e }),
			compact: d()
		});
	});
	function p(e) {
		for (let t of u.chart.series) for (let n of t.points) {
			let t = n.evidence?.find((t) => t.key === e.key);
			if (t) return u.onevidence?.(t);
		}
	}
	{
		let e = r(() => u.onevidence ? p : void 0);
		a(l, {
			get title() {
				return u.title;
			},
			get spec() {
				return t(f);
			},
			get glyph() {
				return u.glyph;
			},
			get onevidence() {
				return t(e);
			}
		});
	}
	n();
}
export { l as default };
