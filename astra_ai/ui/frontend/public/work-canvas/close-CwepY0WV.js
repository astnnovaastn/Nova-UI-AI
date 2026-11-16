import "./native-events-Bexa20bU.js";
import "./bindings-CWWuBYk9.js";
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
// upstream/src/shared/lib/close.ts
var t = /* @__PURE__ */ new Set();
function n(e) {
	return t.add(e), () => {
		t.delete(e);
	};
}
export { e as n, n as t };
