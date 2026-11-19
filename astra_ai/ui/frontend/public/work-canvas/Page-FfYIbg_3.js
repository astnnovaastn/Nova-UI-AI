import "./disclose-version-7ONGmeVC.js";
import { Ct as e, H as t, J as n, Mt as r, W as i, Y as a, h as o, jt as s, lt as c, pt as l, r as u, tt as d, zt as f } from "./index-client-DH73-vTM.js";
import { t as p } from "./PageFace-D49tiqHZ.js";
// upstream/src/features/work/components/objects/Page.svelte
var m = i("<button type=\"button\" class=\"page nodrag nopan svelte-1tjorl6\"><!></button>");
function h(n, i) {
	r(i, !0);
	let h = u(i, "actions", 19, () => ({}));
	var g = m(), _ = l(g);
	{
		let t = e(() => i.object.frame ?? null), n = e(() => !!i.object.live);
		p(_, {
			get url() {
				return i.object.url;
			},
			get title() {
				return i.object.title;
			},
			get frame() {
				return d(t);
			},
			get live() {
				return d(n);
			}
		});
	}
	f(g), c(() => o(g, "aria-label", i.object.title)), a("click", g, () => h().open ? h().open(i.object.id) : h().link?.(i.object.url)), t(n, g), s();
}
n(["click"]);
export { h as default };
