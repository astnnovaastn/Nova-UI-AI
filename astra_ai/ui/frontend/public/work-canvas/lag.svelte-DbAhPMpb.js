import { $ as e, _t as t, ht as n, st as r } from "./index-client-C_2wYFnt.js";
// upstream/src/shared/lib/lag.svelte.ts
var i = 500;
function a(a, o = i) {
	let s = t(!1);
	return r(() => {
		if (!a()) {
			n(s, !1);
			return;
		}
		let e = setTimeout(() => n(s, !0), o);
		return () => clearTimeout(e);
	}), { get current() {
		return e(s);
	} };
}
export { a as t };
