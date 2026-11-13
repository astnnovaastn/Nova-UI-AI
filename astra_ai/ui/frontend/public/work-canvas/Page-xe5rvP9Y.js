import "./disclose-version-DFvUDwEH.js";
import { B as e, Et as t, H as n, K as r, Nt as i, Q as a, Tt as o, _t as s, ct as c, h as l, it as u, q as d, r as f } from "./index-client-oI5R0J23.js";
import { t as p } from "./PageFace-CpJ4rWOe.js";
// upstream/src/features/work/components/objects/Page.svelte
var m = n("<button type=\"button\" class=\"page nodrag nopan svelte-1tjorl6\"><!></button>");
function h(n, r) {
	t(r, !0);
	let h = f(r, "actions", 19, () => ({}));
	var g = m(), _ = c(g);
	{
		let e = s(() => r.object.frame ?? null), t = s(() => !!r.object.live);
		p(_, {
			get url() {
				return r.object.url;
			},
			get title() {
				return r.object.title;
			},
			get frame() {
				return a(e);
			},
			get live() {
				return a(t);
			}
		});
	}
	i(g), u(() => l(g, "aria-label", r.object.title)), d("click", g, () => h().open ? h().open(r.object.id) : h().link?.(r.object.url)), e(n, g), o();
}
r(["click"]);
export { h as default };
