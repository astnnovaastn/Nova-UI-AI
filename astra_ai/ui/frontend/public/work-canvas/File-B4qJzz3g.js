import "./disclose-version-DFvUDwEH.js";
import { B as e, Et as t, F as n, G as r, H as i, J as a, K as o, M as s, N as c, Nt as l, Q as u, R as d, S as f, Tt as p, V as m, X as h, _t as g, ct as _, h as v, ht as y, it as b, lt as x, pt as S, q as C, r as w, ut as T } from "./index-client-oI5R0J23.js";
import { t as E } from "./Icon-BfOzno3u.js";
import D from "./CodeBlock-BG1V8jsF.js";
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
var j = i("<img alt=\"\" decoding=\"async\" loading=\"lazy\" draggable=\"false\"/>"), M = i("<strong class=\"heading svelte-1965wbz\"> </strong>"), N = i("<span class=\"item svelte-1965wbz\"> </span>"), ee = i("<span class=\"para svelte-1965wbz\"> </span>"), P = i("<span><!></span>"), F = i("<img alt=\"\" width=\"64\" height=\"64\" decoding=\"async\" class=\"svelte-1965wbz\"/>"), I = i("<span class=\"icon svelte-1965wbz\"><!></span>"), L = i("<span class=\"meta svelte-1965wbz\"> </span>"), R = i("<figure><button type=\"button\" class=\"face nodrag nopan svelte-1965wbz\"><!></button> <figcaption class=\"svelte-1965wbz\"><span class=\"name svelte-1965wbz\"> </span> <!></figcaption></figure>");
function z(i, o) {
	t(o, !0);
	let z = w(o, "actions", 19, () => ({})), B = w(o, "centre", 3, !1), V = y(null), H = g(() => !!o.object.picture && u(V) === o.object.picture.src), U = g(() => o.object.picture && !u(H) ? o.object.picture : null), W = g(() => /\.(md|markdown)$/iu.test(o.object.name) || o.object.language === "markdown"), G = g(() => [o.object.kindLabel, o.object.size ? A(o.object.size) : ""].filter(Boolean).join(" · "));
	var K = R(), q = _(K), J = _(q), Y = (t) => {
		var n = j();
		let r;
		b(() => {
			v(n, "src", u(U).src), v(n, "width", u(U).width), v(n, "height", u(U).height), r = f(n, 1, "svelte-1965wbz", null, r, { sheet: o.object.file === "pdf" });
		}), a("error", n, () => S(V, o.object.picture?.src ?? null, !0)), h(n), e(t, n);
	}, X = (t) => {
		var i = P();
		let a;
		var p = _(i), h = (e) => {
			{
				let t = g(() => o.object.language ?? ""), n = g(() => B() ? void 0 : 12);
				D(e, {
					get language() {
						return u(t);
					},
					get text() {
						return o.object.lines;
					},
					get label() {
						return o.object.name;
					},
					get limit() {
						return u(n);
					}
				});
			}
		}, v = (t) => {
			var r = m(), i = x(r);
			s(i, 17, () => k(o.object.lines).slice(0, 8), c, (t, r) => {
				var i = m(), a = x(i), o = (t) => {
					var n = M(), i = _(n, !0);
					l(n), b(() => d(i, u(r).text)), e(t, n);
				}, f = (t) => {
					var n = m(), i = x(n);
					s(i, 17, () => u(r).items, c, (t, n) => {
						var r = N(), i = _(r, !0);
						l(r), b(() => d(i, u(n))), e(t, r);
					}), e(t, n);
				}, p = (t) => {
					var n = ee(), i = _(n, !0);
					l(n), b((e) => d(i, e), [() => u(r).lines.join(" ")]), e(t, n);
				};
				n(a, (e) => {
					u(r).kind === "heading" ? e(o) : u(r).kind === "list" ? e(f, 1) : e(p, -1);
				}), e(t, i);
			}), e(t, r);
		}, y = (t) => {
			var n = r();
			b((e) => d(n, e), [() => o.object.lines.split("\n").slice(0, 14).join("\n")]), e(t, n);
		};
		n(p, (e) => {
			o.object.file === "code" ? e(h) : u(W) ? e(v, 1) : e(y, -1);
		}), l(i), b(() => a = f(i, 1, "sheet lines svelte-1965wbz", null, a, {
			mono: o.object.file === "code",
			whole: B()
		})), e(t, i);
	}, Z = (t) => {
		var r = I(), i = _(r), s = (t) => {
			var n = F();
			b(() => v(n, "src", u(U).src)), a("error", n, () => S(V, o.object.picture?.src ?? null, !0)), h(n), e(t, n);
		}, c = (e) => {
			E(e, {
				get icon() {
					return O;
				},
				size: 40
			});
		};
		n(i, (e) => {
			u(U) ? e(s) : e(c, -1);
		}), l(r), e(t, r);
	};
	n(J, (e) => {
		(o.object.file === "image" || o.object.file === "pdf") && u(U) ? e(Y) : (o.object.file === "text" || o.object.file === "code") && o.object.lines !== void 0 ? e(X, 1) : e(Z, -1);
	}), l(q);
	var Q = T(q, 2), $ = _(Q), te = _($, !0);
	l($);
	var ne = T($, 2), re = (t) => {
		var n = L(), r = _(n, !0);
		l(n), b(() => d(r, u(G))), e(t, n);
	};
	n(ne, (e) => {
		u(G) && e(re);
	}), l(Q), l(K), b(() => {
		f(K, 1, `file ${o.object.file ?? ""}`, "svelte-1965wbz"), v(K, "aria-label", o.object.name), v(q, "aria-label", o.object.name), d(te, o.object.name);
	}), C("click", q, () => z().open?.(o.object.id)), e(i, K), p();
}
o(["click"]);
export { z as default };
