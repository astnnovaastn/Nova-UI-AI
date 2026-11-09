import "./disclose-version-DFvUDwEH.js";
import { Ct as e, St as t, Y as n, mt as r, r as i } from "./index-client-BSGo5gVb.js";
import a from "./Chart-DDI10ZHI.js";
import { n as o, r as s, t as c } from "./work-chart-BDPRZEQs.js";
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
				return n(f);
			},
			get glyph() {
				return u.glyph;
			},
			get onevidence() {
				return n(e);
			}
		});
	}
	t();
}
export { l as default };
