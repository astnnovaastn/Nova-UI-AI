import "./disclose-version-DFvUDwEH.js";
import { $ as e, Dt as t, Ot as n, r, yt as i } from "./index-client-C_2wYFnt.js";
import a from "./Chart-CUJMssbk.js";
import { n as o, r as s, t as c } from "./work-chart-CymzVUfR.js";
// upstream/src/shared/ui/data/Artifact/WorkChart.svelte
function l(l, u) {
	n(u, !0);
	let d = r(u, "compact", 3, !1), f = i(() => {
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
		let t = i(() => u.onevidence ? p : void 0);
		a(l, {
			get title() {
				return u.title;
			},
			get spec() {
				return e(f);
			},
			get glyph() {
				return u.glyph;
			},
			get onevidence() {
				return e(t);
			}
		});
	}
	t();
}
export { l as default };
