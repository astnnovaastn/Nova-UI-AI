import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, F as r, Ft as i, G as a, H as o, J as s, K as c, M as l, N as u, Ot as d, R as f, S as p, V as m, X as h, _t as g, dt as _, ft as v, h as y, ht as b, ot as x, q as S, r as C, ut as w, yt as T } from "./index-client-C_2wYFnt.js";
import { t as E } from "./Icon-E4BzZ4dm.js";
import D from "./CodeBlock-UJSsbHf7.js";
import { t as O } from "./File01Icon-C7ue_hSG.js";
import { n as k } from "./markdown-C0lHpopA.js";
// upstream/src/features/work/components/objects/size-text.ts
function A(e) {
	let t = [
		"bytes",
		"KB",
		"MB",
		"GB",
		"TB"
	], n = e, r = 0;
	for (; n >= 1e3 && r < t.length - 1;) n /= 1e3, r += 1;
	let i = r === 0 || n >= 10 ? 0 : 1;
	return `${new Intl.NumberFormat(void 0, { maximumFractionDigits: i }).format(n)} ${t[r]}`;
}
// upstream/src/features/work/components/objects/File.svelte
var j = o("<img alt=\"\" decoding=\"async\" loading=\"lazy\" draggable=\"false\"/>"), M = o("<strong class=\"heading svelte-1965wbz\"> </strong>"), N = o("<span class=\"item svelte-1965wbz\"> </span>"), ee = o("<span class=\"para svelte-1965wbz\"> </span>"), P = o("<span><!></span>"), F = o("<img alt=\"\" width=\"64\" height=\"64\" decoding=\"async\" class=\"svelte-1965wbz\"/>"), I = o("<span class=\"icon svelte-1965wbz\"><!></span>"), L = o("<span class=\"meta svelte-1965wbz\"> </span>"), R = o("<figure><button type=\"button\" class=\"face nodrag nopan svelte-1965wbz\"><!></button> <figcaption class=\"svelte-1965wbz\"><span class=\"name svelte-1965wbz\"> </span> <!></figcaption></figure>");
function z(o, c) {
	d(c, !0);
	let z = C(c, "actions", 19, () => ({})), B = C(c, "centre", 3, !1), V = g(null), H = T(() => !!c.object.picture && e(V) === c.object.picture.src), U = T(() => c.object.picture && !e(H) ? c.object.picture : null), W = T(() => /\.(md|markdown)$/iu.test(c.object.name) || c.object.language === "markdown"), G = T(() => [c.object.kindLabel, c.object.size ? A(c.object.size) : ""].filter(Boolean).join(" · "));
	var K = R(), q = w(K), J = w(q), Y = (n) => {
		var r = j();
		let i;
		x(() => {
			y(r, "src", e(U).src), y(r, "width", e(U).width), y(r, "height", e(U).height), i = p(r, 1, "svelte-1965wbz", null, i, { sheet: c.object.file === "pdf" });
		}), s("error", r, () => b(V, c.object.picture?.src ?? null, !0)), h(r), t(n, r);
	}, X = (n) => {
		var o = P();
		let s;
		var d = w(o), h = (t) => {
			{
				let n = T(() => c.object.language ?? ""), r = T(() => B() ? void 0 : 12);
				D(t, {
					get language() {
						return e(n);
					},
					get text() {
						return c.object.lines;
					},
					get label() {
						return c.object.name;
					},
					get limit() {
						return e(r);
					}
				});
			}
		}, g = (n) => {
			var a = m(), o = _(a);
			l(o, 17, () => k(c.object.lines).slice(0, 8), u, (n, a) => {
				var o = m(), s = _(o), c = (n) => {
					var r = M(), o = w(r, !0);
					i(r), x(() => f(o, e(a).text)), t(n, r);
				}, d = (n) => {
					var r = m(), o = _(r);
					l(o, 17, () => e(a).items, u, (n, r) => {
						var a = N(), o = w(a, !0);
						i(a), x(() => f(o, e(r))), t(n, a);
					}), t(n, r);
				}, p = (n) => {
					var r = ee(), o = w(r, !0);
					i(r), x((e) => f(o, e), [() => e(a).lines.join(" ")]), t(n, r);
				};
				r(s, (t) => {
					e(a).kind === "heading" ? t(c) : e(a).kind === "list" ? t(d, 1) : t(p, -1);
				}), t(n, o);
			}), t(n, a);
		}, v = (e) => {
			var n = a();
			x((e) => f(n, e), [() => c.object.lines.split("\n").slice(0, 14).join("\n")]), t(e, n);
		};
		r(d, (t) => {
			c.object.file === "code" ? t(h) : e(W) ? t(g, 1) : t(v, -1);
		}), i(o), x(() => s = p(o, 1, "sheet lines svelte-1965wbz", null, s, {
			mono: c.object.file === "code",
			whole: B()
		})), t(n, o);
	}, Z = (n) => {
		var a = I(), o = w(a), l = (n) => {
			var r = F();
			x(() => y(r, "src", e(U).src)), s("error", r, () => b(V, c.object.picture?.src ?? null, !0)), h(r), t(n, r);
		}, u = (e) => {
			E(e, {
				get icon() {
					return O;
				},
				size: 40
			});
		};
		r(o, (t) => {
			e(U) ? t(l) : t(u, -1);
		}), i(a), t(n, a);
	};
	r(J, (t) => {
		(c.object.file === "image" || c.object.file === "pdf") && e(U) ? t(Y) : (c.object.file === "text" || c.object.file === "code") && c.object.lines !== void 0 ? t(X, 1) : t(Z, -1);
	}), i(q);
	var Q = v(q, 2), $ = w(Q), te = w($, !0);
	i($);
	var ne = v($, 2), re = (n) => {
		var r = L(), a = w(r, !0);
		i(r), x(() => f(a, e(G))), t(n, r);
	};
	r(ne, (t) => {
		e(G) && t(re);
	}), i(Q), i(K), x(() => {
		p(K, 1, `file ${c.object.file ?? ""}`, "svelte-1965wbz"), y(K, "aria-label", c.object.name), y(q, "aria-label", c.object.name), f(te, c.object.name);
	}), S("click", q, () => z().open?.(c.object.id)), t(o, K), n();
}
c(["click"]);
export { z as default };
