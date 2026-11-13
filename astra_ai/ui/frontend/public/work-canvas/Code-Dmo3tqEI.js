import "./disclose-version-DFvUDwEH.js";
import { B as e, Et as t, F as n, H as r, K as i, Nt as a, Q as o, R as s, Tt as c, _t as l, ct as u, h as d, it as f, q as p, r as m, ut as h } from "./index-client-oI5R0J23.js";
import g from "./CodeBlock-BG1V8jsF.js";
import { t as _ } from "./code-BgcBJO2A.js";
import "./Code-D9M0qQmA.js";
import { n as v, t as y } from "./path-BnQTIaez.js";
import { t as b } from "./Title-DCqcKCqa.js";
// upstream/src/features/work/components/objects/Code.svelte
var x = r("<p class=\"path svelte-nllmws\"><span class=\"folder svelte-nllmws\"> </span><span class=\"name svelte-nllmws\"> </span></p>"), S = r("<button type=\"button\" class=\"all nodrag nopan svelte-nllmws\"> </button>"), C = r("<section class=\"code svelte-nllmws\"><header class=\"svelte-nllmws\"><!> <!></header> <div class=\"page svelte-nllmws\"><!></div> <!></section>");
function w(r, i) {
	t(i, !0);
	let w = m(i, "actions", 19, () => ({})), T = m(i, "centre", 3, !1), E = l(() => _(i.object.text).length), D = l(() => i.object.path ? y(i.object.path) : null);
	var O = C(), k = u(O), A = u(k), j = (e) => {
		b(e, { get text() {
			return i.object.title;
		} });
	};
	n(A, (e) => {
		i.object.title && e(j);
	});
	var M = h(A, 2), N = (t) => {
		var n = x(), r = u(n), i = u(r, !0);
		a(r);
		var c = h(r), l = u(c, !0);
		a(c), a(n), f(() => {
			s(i, o(D).folder), s(l, o(D).name);
		}), e(t, n);
	};
	n(M, (e) => {
		o(D) && e(N);
	}), a(k);
	var P = h(k, 2), F = u(P);
	{
		let e = l(() => i.object.title ?? i.object.path ?? ""), t = l(() => T() ? void 0 : 16), n = l(() => T() ? "lift" : "card"), r = l(() => i.object.start ?? 1);
		g(F, {
			get language() {
				return i.object.language;
			},
			get text() {
				return i.object.text;
			},
			get label() {
				return o(e);
			},
			get notes() {
				return i.object.notes;
			},
			get limit() {
				return o(t);
			},
			get variant() {
				return o(n);
			},
			get start() {
				return o(r);
			}
		});
	}
	a(P);
	var I = h(P, 2), L = (t) => {
		var n = S(), r = u(n, !0);
		a(n), f((e) => s(r, e), [() => v({ count: o(E) })]), p("click", n, () => w().open?.(i.object.id)), e(t, n);
	};
	n(I, (e) => {
		o(E) > 16 && !T() && e(L);
	}), a(O), f(() => d(O, "aria-label", i.object.title ?? i.object.path)), e(r, O), c();
}
i(["click"]);
export { w as default };
