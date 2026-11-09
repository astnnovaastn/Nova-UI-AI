import "./disclose-version-DFvUDwEH.js";
import { A as e, At as t, Ct as n, F as r, G as i, H as a, L as o, M as s, R as c, St as l, U as u, W as d, Y as f, at as p, ft as m, k as h, m as g, mt as _, ot as v, q as y, r as b, st as x, tt as S, ut as C, y as w, z as T } from "./index-client-BSGo5gVb.js";
import { t as E } from "./Icon-BWISRU-8.js";
import D from "./CodeBlock-OnSsLh3E.js";
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
var j = T("<img alt=\"\" decoding=\"async\" loading=\"lazy\" draggable=\"false\"/>"), M = T("<strong class=\"heading svelte-1965wbz\"> </strong>"), N = T("<span class=\"item svelte-1965wbz\"> </span>"), P = T("<span class=\"para svelte-1965wbz\"> </span>"), ee = T("<span><!></span>"), F = T("<img alt=\"\" width=\"64\" height=\"64\" decoding=\"async\" class=\"svelte-1965wbz\"/>"), I = T("<span class=\"icon svelte-1965wbz\"><!></span>"), L = T("<span class=\"meta svelte-1965wbz\"> </span>"), R = T("<figure><button type=\"button\" class=\"face nodrag nopan svelte-1965wbz\"><!></button> <figcaption class=\"svelte-1965wbz\"><span class=\"name svelte-1965wbz\"> </span> <!></figcaption></figure>");
function z(u, T) {
	n(T, !0);
	let z = b(T, "actions", 19, () => ({})), B = b(T, "centre", 3, !1), V = m(null), H = _(() => !!T.object.picture && f(V) === T.object.picture.src), U = _(() => T.object.picture && !f(H) ? T.object.picture : null), W = _(() => /\.(md|markdown)$/iu.test(T.object.name) || T.object.language === "markdown"), G = _(() => [T.object.kindLabel, T.object.size ? A(T.object.size) : ""].filter(Boolean).join(" · "));
	var K = R(), q = p(K), J = p(q), Y = (e) => {
		var t = j();
		let n;
		S(() => {
			g(t, "src", f(U).src), g(t, "width", f(U).width), g(t, "height", f(U).height), n = w(t, 1, "svelte-1965wbz", null, n, { sheet: T.object.file === "pdf" });
		}), i("error", t, () => C(V, T.object.picture?.src ?? null, !0)), y(t), o(e, t);
	}, X = (n) => {
		var i = ee();
		let l;
		var u = p(i), d = (e) => {
			{
				let t = _(() => T.object.language ?? ""), n = _(() => B() ? void 0 : 12);
				D(e, {
					get language() {
						return f(t);
					},
					get text() {
						return T.object.lines;
					},
					get label() {
						return T.object.name;
					},
					get limit() {
						return f(n);
					}
				});
			}
		}, m = (n) => {
			var i = c(), a = v(i);
			h(a, 17, () => k(T.object.lines).slice(0, 8), e, (n, i) => {
				var a = c(), l = v(a), u = (e) => {
					var n = M(), a = p(n, !0);
					t(n), S(() => r(a, f(i).text)), o(e, n);
				}, d = (n) => {
					var a = c(), s = v(a);
					h(s, 17, () => f(i).items, e, (e, n) => {
						var i = N(), a = p(i, !0);
						t(i), S(() => r(a, f(n))), o(e, i);
					}), o(n, a);
				}, m = (e) => {
					var n = P(), a = p(n, !0);
					t(n), S((e) => r(a, e), [() => f(i).lines.join(" ")]), o(e, n);
				};
				s(l, (e) => {
					f(i).kind === "heading" ? e(u) : f(i).kind === "list" ? e(d, 1) : e(m, -1);
				}), o(n, a);
			}), o(n, i);
		}, g = (e) => {
			var t = a();
			S((e) => r(t, e), [() => T.object.lines.split("\n").slice(0, 14).join("\n")]), o(e, t);
		};
		s(u, (e) => {
			T.object.file === "code" ? e(d) : f(W) ? e(m, 1) : e(g, -1);
		}), t(i), S(() => l = w(i, 1, "sheet lines svelte-1965wbz", null, l, {
			mono: T.object.file === "code",
			whole: B()
		})), o(n, i);
	}, Z = (e) => {
		var n = I(), r = p(n), a = (e) => {
			var t = F();
			S(() => g(t, "src", f(U).src)), i("error", t, () => C(V, T.object.picture?.src ?? null, !0)), y(t), o(e, t);
		}, c = (e) => {
			E(e, {
				get icon() {
					return O;
				},
				size: 40
			});
		};
		s(r, (e) => {
			f(U) ? e(a) : e(c, -1);
		}), t(n), o(e, n);
	};
	s(J, (e) => {
		(T.object.file === "image" || T.object.file === "pdf") && f(U) ? e(Y) : (T.object.file === "text" || T.object.file === "code") && T.object.lines !== void 0 ? e(X, 1) : e(Z, -1);
	}), t(q);
	var Q = x(q, 2), $ = p(Q), te = p($, !0);
	t($);
	var ne = x($, 2), re = (e) => {
		var n = L(), i = p(n, !0);
		t(n), S(() => r(i, f(G))), o(e, n);
	};
	s(ne, (e) => {
		f(G) && e(re);
	}), t(Q), t(K), S(() => {
		w(K, 1, `file ${T.object.file ?? ""}`, "svelte-1965wbz"), g(K, "aria-label", T.object.name), g(q, "aria-label", T.object.name), r(te, T.object.name);
	}), d("click", q, () => z().open?.(T.object.id)), o(u, K), l();
}
u(["click"]);
export { z as default };
