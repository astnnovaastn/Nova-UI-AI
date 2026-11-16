import { $ as e, A as t, B as n, Dt as r, F as i, Ft as a, H as o, J as s, K as c, M as l, Ot as u, R as d, Rt as f, V as p, W as m, _t as h, dt as g, ft as _, h as v, ht as y, ot as b, p as x, pt as S, q as C, r as w, s as T, u as E, ut as D, x as O, yt as k } from "./index-client-C_2wYFnt.js";
import "./disclose-version-DFvUDwEH.js";
import { t as A } from "./Icon-E4BzZ4dm.js";
import { R as j, b as M } from "./popper-layer-force-mount-14zYO5kv.js";
import { t as N } from "./Search01Icon-BdltxnVJ.js";
import { t as P } from "./runtime-Ci9kzAvr.js";
import { n as F } from "./index-client-RfUBbaI1.js";
// upstream/src/shared/ui/SearchField/SearchField.svelte
var I = o("<form role=\"search\" class=\"ui-search svelte-1sis143\"><label class=\"sr-only\"> </label><!><input/></form>");
function L(o, c) {
	let l = m();
	u(c, !0);
	let f = w(c, "size", 3, "chrome"), h = w(c, "value", 15, ""), y = w(c, "ref", 15), S = w(c, "inputProps", 19, () => ({}));
	var C = I(), O = D(C), j = D(O, !0);
	a(O);
	var M = _(O), P = (e) => {
		var r = p(), i = g(r);
		t(i, () => c.lead), n(e, r);
	}, F = (t) => {
		{
			let n = k(() => f() === "page" ? 16 : 14);
			A(t, {
				get icon() {
					return N;
				},
				get size() {
					return e(n);
				}
			});
		}
	};
	i(M, (e) => {
		c.lead ? e(P) : e(F, -1);
	});
	var L = _(M), R = (e) => c.oninput?.(e.currentTarget.value);
	x(L, () => ({
		id: l,
		type: "search",
		placeholder: c.placeholder,
		autocomplete: "off",
		...S(),
		oninput: R
	}), void 0, void 0, void 0, "svelte-1sis143", !0), T(L, (e) => y(e), () => y()), a(C), b(() => {
		v(C, "data-size", f()), v(O, "for", l), d(j, c.label);
	}), s("submit", C, (e) => {
		e.preventDefault(), c.onsubmit?.(h().trim());
	}), E(L, h), n(o, C), r();
}
// upstream/src/shared/i18n/messages/panel_load_failed.js
var R = () => "This view could not be loaded.", z = ((e = {}, t = {}) => (t.locale ?? P(), R(e))), B = () => "Opening view…", V = ((e = {}, t = {}) => (t.locale ?? P(), B(e))), H = () => "Try again", U = ((e = {}, t = {}) => (t.locale ?? P(), H(e))), W = () => "Today", G = ((e = {}, t = {}) => (t.locale ?? P(), W(e))), K = () => "Upcoming", q = ((e = {}, t = {}) => (t.locale ?? P(), K(e))), J = S({
	page: null,
	source: null
}), ee = {
	open: async (e) => {
		(e === "notes" || e === "tasks") && (J.page = e, window.dispatchEvent(new CustomEvent("aegis-tools-page", { detail: { kind: e } })));
	},
	close: async () => {
		J.page = null, window.dispatchEvent(new CustomEvent("aegis-tools-page", { detail: { kind: null } }));
	}
}, te = {
	profile: () => ({ id: "aegis-owner" }),
	activeTab: () => J.source
}, Y = () => ({
	scope: "today",
	trashed: !1,
	board: !1,
	list: null
}), X = new F(), Z = "unbound", Q = h(S(Y())), ne = () => e(Q);
function $(t) {
	Z !== t && (X.set(Z, e(Q)), Z = t, y(Q, X.get(t) ?? Y(), !0));
}
function re(t, n) {
	n && $(n), y(Q, {
		...e(Q),
		...t
	}, !0);
}
// upstream/src/features/tasks/index.ts
var ie = () => import("./Tasks-C7XJL2RE.js").then((e) => e.n);
// node_modules/bits-ui/dist/bits/utilities/config/components/bits-config.svelte
function ae(e, i) {
	u(i, !0), M({
		defaultPortalTo: j(() => i.defaultPortalTo),
		defaultLocale: j(() => i.defaultLocale)
	});
	var a = p(), o = g(a);
	t(o, () => i.children ?? f), n(e, a), r();
}
// upstream/src/shared/ui/SegmentedControl/SegmentedControl.svelte
var oe = o("<button type=\"button\" role=\"radio\" class=\"segment svelte-1w7qvif\"><!> <span class=\"text svelte-1w7qvif\"> </span></button>"), se = o("<div class=\"segmented svelte-1w7qvif\" role=\"radiogroup\"><span class=\"thumb svelte-1w7qvif\" aria-hidden=\"true\"></span> <!></div>");
function ce(t, o) {
	u(o, !0);
	let s = w(o, "value", 15, ""), c = w(o, "size", 3, "regular"), f = w(o, "full", 3, !1), p = w(o, "iconOnly", 3, !1), m = w(o, "disabled", 3, !1), h = k(() => o.options.findIndex((e) => e.value === s())), g = S([]);
	function y(e) {
		e !== s() && (s(e), o.onchange?.(e));
	}
	function x(t) {
		let n = t.key === "ArrowRight" || t.key === "ArrowDown" ? 1 : t.key === "ArrowLeft" || t.key === "ArrowUp" ? -1 : null, r = Math.max(0, e(h)), i = null;
		if (n === null ? t.key === "Home" ? i = 0 : t.key === "End" && (i = o.options.length - 1) : i = (r + (getComputedStyle(t.currentTarget).direction === "rtl" ? -n : n) + o.options.length) % o.options.length, i === null) return;
		t.preventDefault();
		let a = o.options[i];
		a && !a.disabled && (y(a.value), g[i]?.focus());
	}
	var E = se();
	let j;
	var M = D(E), N = _(M, 2);
	l(N, 19, () => o.options, (e) => e.value, (t, r, o) => {
		var c = oe(), l = D(c), u = (t) => {
			A(t, {
				get icon() {
					return e(r).icon;
				},
				size: 13
			});
		};
		i(l, (t) => {
			e(r).icon && t(u);
		});
		var f = _(l, 2), S = D(f, !0);
		a(f), a(c), T(c, (e, t) => g[t] = e, (e) => g?.[e], () => [e(o)]), b((t) => {
			v(c, "aria-checked", e(r).value === s()), v(c, "tabindex", t), c.disabled = m() || e(r).disabled, v(c, "title", p() ? e(r).label : void 0), d(S, e(r).label);
		}, [() => e(o) === Math.max(0, e(h)) ? 0 : -1]), C("click", c, () => y(e(r).value)), C("keydown", c, x), n(t, c);
	}), a(E), b((t) => {
		v(E, "aria-label", o.label), v(E, "aria-disabled", m() || void 0), v(E, "data-size", c()), v(E, "data-full", f()), v(E, "data-icon-only", p()), j = O(E, "", j, t), v(M, "data-visible", e(h) >= 0);
	}, [() => ({
		"--seg-count": o.options.length,
		"--seg-index": Math.max(0, e(h))
	})]), n(t, E), r();
}
c(["click", "keydown"]);
export { $ as a, te as c, G as d, U as f, L as h, ne as i, J as l, z as m, ae as n, re as o, V as p, ie as r, ee as s, ce as t, q as u };
