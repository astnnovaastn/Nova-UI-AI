import { bt as e, tt as t, ut as n, vt as r } from "./index-client-DH73-vTM.js";
// upstream/src/shared/lib/lag.svelte.ts
var i = 500;
function a(a, o = i) {
	let s = e(!1);
	return n(() => {
		if (!a()) {
			r(s, !1);
			return;
		}
		let e = setTimeout(() => r(s, !0), o);
		return () => clearTimeout(e);
	}), { get current() {
		return t(s);
	} };
}
export { a as t };
