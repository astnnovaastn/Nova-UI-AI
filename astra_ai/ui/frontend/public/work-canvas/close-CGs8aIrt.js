import "./native-events-Bexa20bU.js";
import "./bindings-CEUY5ty1.js";
// upstream/src/shared/lib/observe.ts
function e(e, t, n) {
	return new Promise((r) => {
		let i = !1, a, o = (e) => {
			i || (i = !0, clearTimeout(a), n?.removeEventListener("abort", s), r(e));
		}, s = () => o({ state: "aborted" });
		e.then((e) => o({
			state: "received",
			value: e
		}), () => o({ state: "failed" })), n?.aborted ? s() : !Number.isFinite(t) || t <= 0 ? o({ state: "timeout" }) : (n?.addEventListener("abort", s, { once: !0 }), a = setTimeout(() => o({ state: "timeout" }), t));
	});
}
function t(e, t) {
	return new Promise((n) => {
		let r, i = () => {
			clearTimeout(r), t?.removeEventListener("abort", i), n();
		};
		t?.aborted ? i() : (t?.addEventListener("abort", i, { once: !0 }), r = setTimeout(i, e));
	});
}
// upstream/src/shared/lib/close.ts
var n = /* @__PURE__ */ new Set();
function r(e) {
	return n.add(e), () => {
		n.delete(e);
	};
}
export { e as n, t as r, r as t };
