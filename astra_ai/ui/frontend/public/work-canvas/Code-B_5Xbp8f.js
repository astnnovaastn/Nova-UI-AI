import "./disclose-version-DFvUDwEH.js";
import { At as e, Ct as t, F as n, L as r, M as i, St as a, U as o, W as s, Y as c, at as l, m as u, mt as d, r as f, st as p, tt as m, z as h } from "./index-client-BSGo5gVb.js";
import g from "./CodeBlock-OnSsLh3E.js";
import { t as _ } from "./code-BgcBJO2A.js";
import "./Code-CzPYjmBC.js";
import { n as v, t as y } from "./path-BnQTIaez.js";
import { t as b } from "./Title-3U-zV-ZX.js";
// upstream/src/features/work/components/objects/Code.svelte
var x = h("<p class=\"path svelte-nllmws\"><span class=\"folder svelte-nllmws\"> </span><span class=\"name svelte-nllmws\"> </span></p>"), S = h("<button type=\"button\" class=\"all nodrag nopan svelte-nllmws\"> </button>"), C = h("<section class=\"code svelte-nllmws\"><header class=\"svelte-nllmws\"><!> <!></header> <div class=\"page svelte-nllmws\"><!></div> <!></section>");
function w(o, h) {
	t(h, !0);
	let w = f(h, "actions", 19, () => ({})), T = f(h, "centre", 3, !1), E = d(() => _(h.object.text).length), D = d(() => h.object.path ? y(h.object.path) : null);
	var O = C(), k = l(O), A = l(k), j = (e) => {
		b(e, { get text() {
			return h.object.title;
		} });
	};
	i(A, (e) => {
		h.object.title && e(j);
	});
	var M = p(A, 2), N = (t) => {
		var i = x(), a = l(i), o = l(a, !0);
		e(a);
		var s = p(a), u = l(s, !0);
		e(s), e(i), m(() => {
			n(o, c(D).folder), n(u, c(D).name);
		}), r(t, i);
	};
	i(M, (e) => {
		c(D) && e(N);
	}), e(k);
	var P = p(k, 2), F = l(P);
	{
		let e = d(() => h.object.title ?? h.object.path ?? ""), t = d(() => T() ? void 0 : 16), n = d(() => T() ? "lift" : "card"), r = d(() => h.object.start ?? 1);
		g(F, {
			get language() {
				return h.object.language;
			},
			get text() {
				return h.object.text;
			},
			get label() {
				return c(e);
			},
			get notes() {
				return h.object.notes;
			},
			get limit() {
				return c(t);
			},
			get variant() {
				return c(n);
			},
			get start() {
				return c(r);
			}
		});
	}
	e(P);
	var I = p(P, 2), L = (t) => {
		var i = S(), a = l(i, !0);
		e(i), m((e) => n(a, e), [() => v({ count: c(E) })]), s("click", i, () => w().open?.(h.object.id)), r(t, i);
	};
	i(I, (e) => {
		c(E) > 16 && !T() && e(L);
	}), e(O), m(() => u(O, "aria-label", h.object.title ?? h.object.path)), r(o, O), a();
}
o(["click"]);
export { w as default };
