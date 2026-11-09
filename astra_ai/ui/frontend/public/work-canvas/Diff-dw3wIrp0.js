import "./disclose-version-DFvUDwEH.js";
import { A as e, At as t, Ct as n, F as r, H as i, L as a, M as o, R as s, St as c, U as l, W as u, Y as d, at as f, b as p, k as m, m as h, mt as g, ot as _, r as v, st as y, tt as b, v as x, y as S, z as C } from "./index-client-BSGo5gVb.js";
import { t as w } from "./tokenize-BXqKILGH.js";
import { n as T, t as E } from "./path-BnQTIaez.js";
import { t as D } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_diff_added.js
var O = () => "Added", ee = ((e = {}, t = {}) => (t.locale ?? D(), O(e))), k = (e) => `Line ${e?.line}`, te = ((e, t = {}) => (t.locale ?? D(), k(e))), A = () => "Removed", ne = ((e = {}, t = {}) => (t.locale ?? D(), A(e))), j = C("<span></span>"), M = C("<p class=\"summary svelte-f664u\"> </p>"), re = C("<div class=\"fold svelte-f664u\"> </div>"), ie = C("<span> </span>"), ae = C("<div><span class=\"n svelte-f664u\"> </span><span class=\"n svelte-f664u\"> </span><span class=\"sign svelte-f664u\"> </span><code class=\"svelte-f664u\"></code></div>"), oe = C("<button type=\"button\" class=\"all nodrag nopan svelte-f664u\"> </button>"), N = C("<section class=\"diff svelte-f664u\"><header class=\"svelte-f664u\"><p class=\"path svelte-f664u\"><span class=\"folder svelte-f664u\"> </span><span class=\"name svelte-f664u\"> </span></p> <p class=\"stat svelte-f664u\"><span class=\"added svelte-f664u\"> </span><span class=\"removed svelte-f664u\"> </span> <span class=\"blocks svelte-f664u\" aria-hidden=\"true\"></span></p></header> <!> <div class=\"hunks svelte-f664u\"></div> <!></section>");
function P(l, C) {
	n(C, !0);
	let D = v(C, "actions", 19, () => ({})), O = v(C, "centre", 3, !1), k = g(() => E(C.object.path)), A = g(() => C.object.hunks.reduce((e, t) => e + t.lines.filter((e) => e.op === "add").length, 0)), P = g(() => C.object.hunks.reduce((e, t) => e + t.lines.filter((e) => e.op === "del").length, 0)), F = g(() => {
		let e = d(A) + d(P);
		if (!e) return [];
		let t = Math.round(d(A) / e * 5);
		return Array.from({ length: 5 }, (e, n) => n < t ? "plus" : "minus");
	}), I = g(() => {
		let e = [];
		return C.object.hunks.forEach((t, n) => {
			(n > 0 || t.oldStart > 1) && e.push({
				kind: "hunk",
				at: t.newStart
			});
			let r = w(C.object.language, t.lines.map((e) => e.text).join("\n") + "\n"), i = t.oldStart, a = t.newStart;
			t.lines.forEach((t, n) => {
				e.push({
					kind: "line",
					op: t.op,
					old: t.op === "add" ? null : i++,
					new: t.op === "del" ? null : a++,
					tokens: r[n] ?? [{
						kind: "plain",
						text: t.text
					}]
				});
			});
		}), e;
	}), L = g(() => O() ? d(I) : d(I).slice(0, 24)), se = g(() => String(Math.max(...C.object.hunks.map((e) => e.newStart + e.lines.length), 1)).length), R = g(() => d(I).filter((e) => e.kind === "line").length - d(L).filter((e) => e.kind === "line").length);
	var z = N(), B = f(z), V = f(B), H = f(V), U = f(H, !0);
	t(H);
	var W = y(H), G = f(W, !0);
	t(W), t(V);
	var K = y(V, 2), q = f(K), ce = f(q);
	t(q);
	var J = y(q), le = f(J);
	t(J);
	var Y = y(J, 2);
	m(Y, 21, () => d(F), e, (e, t) => {
		var n = j();
		b(() => S(n, 1, p(d(t)), "svelte-f664u")), a(e, n);
	}), t(Y), t(K), t(B);
	var X = y(B, 2), Z = (e) => {
		var n = M(), i = f(n, !0);
		t(n), b(() => r(i, C.object.summary)), a(e, n);
	};
	o(X, (e) => {
		C.object.summary && e(Z);
	});
	var Q = y(X, 2);
	let $;
	m(Q, 21, () => d(L), e, (n, c) => {
		var l = s(), u = _(l), g = (e) => {
			var n = re(), i = f(n, !0);
			t(n), b((e) => r(i, e), [() => te({ line: d(c).at })]), a(e, n);
		}, v = (n) => {
			var l = ae(), u = f(l), g = f(u, !0);
			t(u);
			var v = y(u), x = f(v, !0);
			t(v);
			var C = y(v), w = f(C, !0);
			t(C);
			var T = y(C);
			m(T, 21, () => d(c).tokens, e, (e, n) => {
				var c = s(), l = _(c), u = (e) => {
					var t = i();
					b(() => r(t, d(n).text)), a(e, t);
				}, m = (e) => {
					var i = ie(), o = f(i, !0);
					t(i), b(() => {
						S(i, 1, p(d(n).kind), "svelte-f664u"), r(o, d(n).text);
					}), a(e, i);
				};
				o(l, (e) => {
					d(n).kind === "plain" ? e(u) : e(m, -1);
				}), a(e, c);
			}), t(T), t(l), b((e) => {
				S(l, 1, `row ${d(c).op ?? ""}`, "svelte-f664u"), r(g, d(c).old ?? ""), r(x, d(c).new ?? ""), h(C, "aria-label", e), r(w, d(c).op === "add" ? "+" : d(c).op === "del" ? "−" : "");
			}, [() => d(c).op === "add" ? ee() : d(c).op === "del" ? ne() : void 0]), a(n, l);
		};
		o(u, (e) => {
			d(c).kind === "hunk" ? e(g) : e(v, -1);
		}), a(n, l);
	}), t(Q);
	var ue = y(Q, 2), de = (e) => {
		var n = oe(), i = f(n, !0);
		t(n), b((e) => r(i, e), [() => T({ count: d(R) + 24 })]), u("click", n, () => D().open?.(C.object.id)), a(e, n);
	};
	o(ue, (e) => {
		d(R) > 0 && e(de);
	}), t(z), b(() => {
		h(z, "aria-label", C.object.path), r(U, d(k).folder), r(G, d(k).name), r(ce, `+${d(A) ?? ""}`), r(le, `−${d(P) ?? ""}`), $ = x(Q, "", $, { "--digits": d(se) });
	}), a(l, z), c();
}
l(["click"]);
export { P as default };
