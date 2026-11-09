// upstream/src/shared/lib/motion.ts
var e = /* @__PURE__ */ new Map(), t = /* @__PURE__ */ new Map();
function n(e) {
	return getComputedStyle(document.documentElement).getPropertyValue(e).trim();
}
function r(t) {
	let r = e.get(t);
	if (r === void 0) {
		let i = n(`--motion-${t}`);
		r = i.endsWith("ms") ? Number.parseFloat(i) : Number.parseFloat(i) * 1e3, Number.isFinite(r) || (r = 0), e.set(t, r);
	}
	return r;
}
function i(e) {
	let r = t.get(e);
	return r === void 0 && (r = n(`--ease-${e}`).replace(/\s+/gu, " ") || "ease-out", t.set(e, r)), r;
}
function a() {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.reduceMotion === "true";
}
export { i as n, a as r, r as t };
