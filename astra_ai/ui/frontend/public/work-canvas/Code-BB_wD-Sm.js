import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, F as r, Ft as i, H as a, K as o, Ot as s, R as c, ft as l, h as u, ot as d, q as f, r as p, ut as m, yt as h } from "./index-client-C_2wYFnt.js";
import g from "./CodeBlock-UJSsbHf7.js";
import { t as _ } from "./code-BgcBJO2A.js";
import "./Code-BzW7xd7w.js";
import { n as v, t as y } from "./path-BnQTIaez.js";
import { t as b } from "./Title-BF8NXEcN.js";
// upstream/src/features/work/components/objects/Code.svelte
var x = a("<p class=\"path svelte-nllmws\"><span class=\"folder svelte-nllmws\"> </span><span class=\"name svelte-nllmws\"> </span></p>"), S = a("<button type=\"button\" class=\"all nodrag nopan svelte-nllmws\"> </button>"), C = a("<section class=\"code svelte-nllmws\"><header class=\"svelte-nllmws\"><!> <!></header> <div class=\"page svelte-nllmws\"><!></div> <!></section>");
function w(a, o) {
	s(o, !0);
	let w = p(o, "actions", 19, () => ({})), T = p(o, "centre", 3, !1), E = h(() => _(o.object.text).length), D = h(() => o.object.path ? y(o.object.path) : null);
	var O = C(), k = m(O), A = m(k), j = (e) => {
		b(e, { get text() {
			return o.object.title;
		} });
	};
	r(A, (e) => {
		o.object.title && e(j);
	});
	var M = l(A, 2), N = (n) => {
		var r = x(), a = m(r), o = m(a, !0);
		i(a);
		var s = l(a), u = m(s, !0);
		i(s), i(r), d(() => {
			c(o, e(D).folder), c(u, e(D).name);
		}), t(n, r);
	};
	r(M, (t) => {
		e(D) && t(N);
	}), i(k);
	var P = l(k, 2), F = m(P);
	{
		let t = h(() => o.object.title ?? o.object.path ?? ""), n = h(() => T() ? void 0 : 16), r = h(() => T() ? "lift" : "card"), i = h(() => o.object.start ?? 1);
		g(F, {
			get language() {
				return o.object.language;
			},
			get text() {
				return o.object.text;
			},
			get label() {
				return e(t);
			},
			get notes() {
				return o.object.notes;
			},
			get limit() {
				return e(n);
			},
			get variant() {
				return e(r);
			},
			get start() {
				return e(i);
			}
		});
	}
	i(P);
	var I = l(P, 2), L = (n) => {
		var r = S(), a = m(r, !0);
		i(r), d((e) => c(a, e), [() => v({ count: e(E) })]), f("click", r, () => w().open?.(o.object.id)), t(n, r);
	};
	r(I, (t) => {
		e(E) > 16 && !T() && t(L);
	}), i(O), d(() => u(O, "aria-label", o.object.title ?? o.object.path)), t(a, O), n();
}
o(["click"]);
export { w as default };
