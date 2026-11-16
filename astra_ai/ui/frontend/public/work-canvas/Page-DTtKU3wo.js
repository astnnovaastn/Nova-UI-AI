import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, Ft as r, H as i, K as a, Ot as o, h as s, ot as c, q as l, r as u, ut as d, yt as f } from "./index-client-C_2wYFnt.js";
import { t as p } from "./PageFace-D2__z-9e.js";
// upstream/src/features/work/components/objects/Page.svelte
var m = i("<button type=\"button\" class=\"page nodrag nopan svelte-1tjorl6\"><!></button>");
function h(i, a) {
	o(a, !0);
	let h = u(a, "actions", 19, () => ({}));
	var g = m(), _ = d(g);
	{
		let t = f(() => a.object.frame ?? null), n = f(() => !!a.object.live);
		p(_, {
			get url() {
				return a.object.url;
			},
			get title() {
				return a.object.title;
			},
			get frame() {
				return e(t);
			},
			get live() {
				return e(n);
			}
		});
	}
	r(g), c(() => s(g, "aria-label", a.object.title)), l("click", g, () => h().open ? h().open(a.object.id) : h().link?.(a.object.url)), t(i, g), n();
}
a(["click"]);
export { h as default };
