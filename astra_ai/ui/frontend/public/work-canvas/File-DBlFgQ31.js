import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, F as n, H as r, J as i, L as a, Mt as o, P as s, Q as c, S as l, U as u, W as d, X as f, Y as p, bt as m, h, ht as g, jt as _, lt as v, mt as y, pt as b, q as x, r as S, tt as C, vt as w, zt as T } from "./index-client-DH73-vTM.js";
import { t as E } from "./Icon-D2j1Ej6Z.js";
import "./Icon-CmjKIKuh.js";
import D from "./CodeBlock-B0FDKzYv.js";
import { t as O } from "./File01Icon-1POdYzZt.js";
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
var j = d("<img alt=\"\" decoding=\"async\" loading=\"lazy\" draggable=\"false\"/>"), M = d("<strong class=\"heading svelte-1965wbz\"> </strong>"), ee = d("<span class=\"item svelte-1965wbz\"> </span>"), N = d("<span class=\"para svelte-1965wbz\"> </span>"), P = d("<span><!></span>"), F = d("<img alt=\"\" width=\"64\" height=\"64\" decoding=\"async\" class=\"svelte-1965wbz\"/>"), I = d("<span class=\"icon svelte-1965wbz\"><!></span>"), L = d("<span class=\"meta svelte-1965wbz\"> </span>"), R = d("<figure><button type=\"button\" class=\"face nodrag nopan svelte-1965wbz\"><!></button> <figcaption class=\"svelte-1965wbz\"><span class=\"name svelte-1965wbz\"> </span> <!></figcaption></figure>");
function z(i, d) {
	o(d, !0);
	let z = S(d, "actions", 19, () => ({})), B = S(d, "centre", 3, !1), V = m(null), H = t(() => !!d.object.picture && C(V) === d.object.picture.src), U = t(() => d.object.picture && !C(H) ? d.object.picture : null), W = t(() => /\.(md|markdown)$/iu.test(d.object.name) || d.object.language === "markdown"), G = t(() => [d.object.kindLabel, d.object.size ? A(d.object.size) : ""].filter(Boolean).join(" · "));
	var K = R(), q = b(K), J = b(q), Y = (e) => {
		var t = j();
		let n;
		v(() => {
			h(t, "src", C(U).src), h(t, "width", C(U).width), h(t, "height", C(U).height), n = l(t, 1, "svelte-1965wbz", null, n, { sheet: d.object.file === "pdf" });
		}), f("error", t, () => w(V, d.object.picture?.src ?? null, !0)), c(t), r(e, t);
	}, X = (i) => {
		var o = P();
		let c;
		var f = b(o), p = (e) => {
			{
				let n = t(() => d.object.language ?? ""), r = t(() => B() ? void 0 : 12);
				D(e, {
					get language() {
						return C(n);
					},
					get text() {
						return d.object.lines;
					},
					get label() {
						return d.object.name;
					},
					get limit() {
						return C(r);
					}
				});
			}
		}, m = (t) => {
			var i = u(), o = y(i);
			s(o, 17, () => k(d.object.lines).slice(0, 8), n, (t, i) => {
				var o = u(), c = y(o), l = (t) => {
					var n = M(), a = b(n, !0);
					T(n), v(() => e(a, C(i).text)), r(t, n);
				}, d = (t) => {
					var a = u(), o = y(a);
					s(o, 17, () => C(i).items, n, (t, n) => {
						var i = ee(), a = b(i, !0);
						T(i), v(() => e(a, C(n))), r(t, i);
					}), r(t, a);
				}, f = (t) => {
					var n = N(), a = b(n, !0);
					T(n), v((t) => e(a, t), [() => C(i).lines.join(" ")]), r(t, n);
				};
				a(c, (e) => {
					C(i).kind === "heading" ? e(l) : C(i).kind === "list" ? e(d, 1) : e(f, -1);
				}), r(t, o);
			}), r(t, i);
		}, h = (t) => {
			var n = x();
			v((t) => e(n, t), [() => d.object.lines.split("\n").slice(0, 14).join("\n")]), r(t, n);
		};
		a(f, (e) => {
			d.object.file === "code" ? e(p) : C(W) ? e(m, 1) : e(h, -1);
		}), T(o), v(() => c = l(o, 1, "sheet lines svelte-1965wbz", null, c, {
			mono: d.object.file === "code",
			whole: B()
		})), r(i, o);
	}, Z = (e) => {
		var t = I(), n = b(t), i = (e) => {
			var t = F();
			v(() => h(t, "src", C(U).src)), f("error", t, () => w(V, d.object.picture?.src ?? null, !0)), c(t), r(e, t);
		}, o = (e) => {
			E(e, {
				get icon() {
					return O;
				},
				size: 40
			});
		};
		a(n, (e) => {
			C(U) ? e(i) : e(o, -1);
		}), T(t), r(e, t);
	};
	a(J, (e) => {
		(d.object.file === "image" || d.object.file === "pdf") && C(U) ? e(Y) : (d.object.file === "text" || d.object.file === "code") && d.object.lines !== void 0 ? e(X, 1) : e(Z, -1);
	}), T(q);
	var Q = g(q, 2), $ = b(Q), te = b($, !0);
	T($);
	var ne = g($, 2), re = (t) => {
		var n = L(), i = b(n, !0);
		T(n), v(() => e(i, C(G))), r(t, n);
	};
	a(ne, (e) => {
		C(G) && e(re);
	}), T(Q), T(K), v(() => {
		l(K, 1, `file ${d.object.file ?? ""}`, "svelte-1965wbz"), h(K, "aria-label", d.object.name), h(q, "aria-label", d.object.name), e(te, d.object.name);
	}), p("click", q, () => z().open?.(d.object.id)), r(i, K), _();
}
i(["click"]);
export { z as default };
