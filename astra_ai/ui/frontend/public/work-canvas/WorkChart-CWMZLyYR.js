import "./disclose-version-7ONGmeVC.js";
import { Ct as e, Mt as t, jt as n, r, tt as i } from "./index-client-DH73-vTM.js";
import a from "./Chart-PPvfZNgx.js";
import { n as o, r as s, t as c } from "./work-chart-nwJY5bJI.js";
// upstream/src/shared/ui/data/Artifact/WorkChart.svelte
function l(l, u) {
	t(u, !0);
	let d = r(u, "compact", 3, !1), f = e(() => {
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
		let t = e(() => u.onevidence ? p : void 0);
		a(l, {
			get title() {
				return u.title;
			},
			get spec() {
				return i(f);
			},
			get glyph() {
				return u.glyph;
			},
			get onevidence() {
				return i(t);
			}
		});
	}
	n();
}
export { l as default };
