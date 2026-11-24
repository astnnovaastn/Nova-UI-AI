import { t as e } from "./runtime-Ci9kzAvr.js";
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/@hugeicons/core-free-icons/dist/esm/ComputerTerminal01Icon.js
var t = [
	["path", {
		d: "M7.5 7.5L8.72654 8.55719C9.24218 9.00163 9.5 9.22386 9.5 9.5C9.5 9.77614 9.24218 9.99836 8.72654 10.4428L7.5 11.5",
		stroke: "currentColor",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		strokeWidth: "1.5",
		key: "0"
	}],
	["path", {
		d: "M11.5 12.5H15.5",
		stroke: "currentColor",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		strokeWidth: "1.5",
		key: "1"
	}],
	["path", {
		d: "M12 21C15.7497 21 17.6246 21 18.9389 20.0451C19.3634 19.7367 19.7367 19.3634 20.0451 18.9389C21 17.6246 21 15.7497 21 12C21 8.25027 21 6.3754 20.0451 5.06107C19.7367 4.6366 19.3634 4.26331 18.9389 3.95491C17.6246 3 15.7497 3 12 3C8.25027 3 6.3754 3 5.06107 3.95491C4.6366 4.26331 4.26331 4.6366 3.95491 5.06107C3 6.3754 3 8.25027 3 12C3 15.7497 3 17.6246 3.95491 18.9389C4.26331 19.3634 4.6366 19.7367 5.06107 20.0451C6.3754 21 8.25027 21 12 21Z",
		stroke: "currentColor",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		strokeWidth: "1.5",
		key: "2"
	}]
], n = [["path", {
	d: "M20 12L4 12",
	stroke: "currentColor",
	strokeLinecap: "round",
	strokeLinejoin: "round",
	strokeWidth: "1.5",
	key: "0"
}]], r = () => "Allow", i = ((t = {}, n = {}) => (n.locale ?? e(), r(t))), a = () => "Choose folder…", o = ((t = {}, n = {}) => (n.locale ?? e(), a(t))), s = () => "Sign in", c = ((t = {}, n = {}) => (n.locale ?? e(), s(t))), l = () => "Open page", u = ((t = {}, n = {}) => (n.locale ?? e(), l(t))), d = (e) => `Solve the check on ${e?.host}`, f = ((t, n = {}) => (n.locale ?? e(), d(t))), p = () => "Choose a folder", m = ((t = {}, n = {}) => (n.locale ?? e(), p(t))), h = /* @__PURE__ */ new Map(), g, _ = !1, v = !1, y = () => document.visibilityState === "hidden";
function b() {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.reduceMotion === "true";
}
function x(e) {
	e.notify(!e.visible || y() || _);
}
function S() {
	_ = b();
	for (let e of h.values()) x(e);
}
var C, w;
function T() {
	v || (v = !0, _ = b(), document.addEventListener("visibilitychange", S), w = window.matchMedia("(prefers-reduced-motion: reduce)"), w.addEventListener("change", S), C = new MutationObserver(S), C.observe(document.documentElement, { attributeFilter: ["data-reduce-motion"] }), g = new IntersectionObserver((e) => {
		for (let t of e) {
			let e = h.get(t.target);
			e && e.visible !== t.isIntersecting && (e.visible = t.isIntersecting, x(e));
		}
	}));
}
function E() {
	v && !h.size && (v = !1, document.removeEventListener("visibilitychange", S), w?.removeEventListener("change", S), C?.disconnect(), g?.disconnect(), g = void 0);
}
function D(e, t) {
	T();
	let n = {
		visible: !0,
		notify: t
	};
	return h.set(e, n), g.observe(e), x(n), () => {
		g?.unobserve(e), h.delete(e), E();
	};
}
function O(e) {
	return { destroy: D(e, (t) => e.toggleAttribute("data-still", t)) };
}
export { u as a, i as c, f as i, n as l, D as n, c as o, m as r, o as s, O as t, t as u };
