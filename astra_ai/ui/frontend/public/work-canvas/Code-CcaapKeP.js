import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, H as n, J as r, L as i, Mt as a, W as o, Y as s, h as c, ht as l, jt as u, lt as d, pt as f, r as p, tt as m, zt as h } from "./index-client-DH73-vTM.js";
import g from "./CodeBlock-B0FDKzYv.js";
import { t as _ } from "./code-BgcBJO2A.js";
import "./Code-C36TWaU2.js";
import { n as v, t as y } from "./path-BnQTIaez.js";
import { t as b } from "./Title-B4cGdolK.js";
// upstream/src/features/work/components/objects/Code.svelte
var x = o("<p class=\"path svelte-nllmws\"><span class=\"folder svelte-nllmws\"> </span><span class=\"name svelte-nllmws\"> </span></p>"), S = o("<button type=\"button\" class=\"all nodrag nopan svelte-nllmws\"> </button>"), C = o("<section class=\"code svelte-nllmws\"><header class=\"svelte-nllmws\"><!> <!></header> <div class=\"page svelte-nllmws\"><!></div> <!></section>");
function w(r, o) {
	a(o, !0);
	let w = p(o, "actions", 19, () => ({})), T = p(o, "centre", 3, !1), E = t(() => _(o.object.text).length), D = t(() => o.object.path ? y(o.object.path) : null);
	var O = C(), k = f(O), A = f(k), j = (e) => {
		b(e, { get text() {
			return o.object.title;
		} });
	};
	i(A, (e) => {
		o.object.title && e(j);
	});
	var M = l(A, 2), N = (t) => {
		var r = x(), i = f(r), a = f(i, !0);
		h(i);
		var o = l(i), s = f(o, !0);
		h(o), h(r), d(() => {
			e(a, m(D).folder), e(s, m(D).name);
		}), n(t, r);
	};
	i(M, (e) => {
		m(D) && e(N);
	}), h(k);
	var P = l(k, 2), F = f(P);
	{
		let e = t(() => o.object.title ?? o.object.path ?? ""), n = t(() => T() ? void 0 : 16), r = t(() => T() ? "lift" : "card"), i = t(() => o.object.start ?? 1);
		g(F, {
			get language() {
				return o.object.language;
			},
			get text() {
				return o.object.text;
			},
			get label() {
				return m(e);
			},
			get notes() {
				return o.object.notes;
			},
			get limit() {
				return m(n);
			},
			get variant() {
				return m(r);
			},
			get start() {
				return m(i);
			}
		});
	}
	h(P);
	var I = l(P, 2), L = (t) => {
		var r = S(), i = f(r, !0);
		h(r), d((t) => e(i, t), [() => v({ count: m(E) })]), s("click", r, () => w().open?.(o.object.id)), n(t, r);
	};
	i(I, (e) => {
		m(E) > 16 && !T() && e(L);
	}), h(O), d(() => c(O, "aria-label", o.object.title ?? o.object.path)), n(r, O), u();
}
r(["click"]);
export { w as default };
