import "./disclose-version-DFvUDwEH.js";
import { At as e, Ct as t, L as n, St as r, U as i, W as a, Y as o, at as s, m as c, mt as l, r as u, tt as d, z as f } from "./index-client-BSGo5gVb.js";
import { t as p } from "./PageFace-DOQBhpid.js";
// upstream/src/features/work/components/objects/Page.svelte
var m = f("<button type=\"button\" class=\"page nodrag nopan svelte-1tjorl6\"><!></button>");
function h(i, f) {
	t(f, !0);
	let h = u(f, "actions", 19, () => ({}));
	var g = m(), _ = s(g);
	{
		let e = l(() => f.object.frame ?? null), t = l(() => !!f.object.live);
		p(_, {
			get url() {
				return f.object.url;
			},
			get title() {
				return f.object.title;
			},
			get frame() {
				return o(e);
			},
			get live() {
				return o(t);
			}
		});
	}
	e(g), d(() => c(g, "aria-label", f.object.title)), a("click", g, () => h().open ? h().open(f.object.id) : h().link?.(f.object.url)), n(i, g), r();
}
i(["click"]);
export { h as default };
