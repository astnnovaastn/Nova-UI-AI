import { bt as e, tt as t, vt as n } from "./index-client-DH73-vTM.js";
import { n as r } from "./index-client-AzfegT-i.js";
import { t as i } from "./native-events-Bexa20bU.js";
import "./FavIcon-Dsc27BCG.js";
// upstream/src/shared/lib/lifecycle.ts
function a() {
	let e = 0, t = !1;
	return {
		begin() {
			return t = !0, ++e;
		},
		isCurrent(n) {
			return t && e === n;
		},
		end() {
			t = !1, e++;
		}
	};
}
async function o(e) {
	let t = await Promise.allSettled(e), n = [], r;
	for (let e of t) e.status === "fulfilled" ? n.push(e.value) : r ??= e;
	if (r) {
		for (let e of n) try {
			e();
		} catch {}
		throw r.reason;
	}
	return n;
}
// upstream/src/domain/favicons/favicons.svelte.ts
var s = 32, c = 4096, l = Math.ceil(c / 3) * 4, u = 1024, d = 70, f = 200, p = 40, m = new r(), h = new r(), g = e(null), _ = a(), v = null;
function y(e) {
	if (e.length !== l || typeof ImageData > "u") return null;
	try {
		let t = atob(e);
		if (t.length !== c) return null;
		let n = new Uint8ClampedArray(c);
		for (let e = 0; e < c; e += 1) n[e] = t.charCodeAt(e);
		return new ImageData(n, s, s);
	} catch {
		return null;
	}
}
function b(e) {
	let t = e.data, n = 0, r = 0, i = 0;
	for (let e = 0; e < t.length; e += 4) {
		if (t[e + 3] < 32) continue;
		let a = t[e], o = t[e + 1], s = t[e + 2];
		i += 1, n += .2126 * a + .7152 * o + .0722 * s, r += Math.max(a, o, s) - Math.min(a, o, s);
	}
	if (i === 0) return "mid";
	let a = n / i;
	return r / i >= p ? "mid" : a < d ? "dark" : a > f ? "light" : "mid";
}
var x = (e, t) => `${e}\u0000${t}`, S = (e, t) => `${e}\u0000${t}`;
function C(e) {
	for (; e.size > u;) {
		let t = e.keys().next();
		if (t.done) break;
		e.delete(t.value);
	}
}
function w(e, t) {
	n(g, e, !0);
	for (let n of t) {
		let t = x(n.origin, n.revision), r = m.get(t), i = r ? r.image : y(n.rgba);
		i && (m.delete(t), m.set(t, r ?? {
			image: i,
			tone: b(i)
		}), h.delete(S(e, n.origin)), h.set(S(e, n.origin), t));
	}
	C(m), C(h);
}
function T(e) {
	return e ? m.get(x(e.origin, e.revision))?.image ?? null : null;
}
function E(e) {
	let n = /^(https?):\/\/(?:[^@/?#]*@)?([^/?#:]+)(?::(\d+))?/iu.exec(e);
	if (!n) return null;
	let r = n[1].toLowerCase(), i = n[3] && n[3] !== (r === "https" ? "443" : "80") ? `:${n[3]}` : "";
	if (t(g) === null) return null;
	let a = h.get(S(t(g), `${r}://${n[2].toLowerCase()}${i}`)), o = a === void 0 ? void 0 : m.get(a);
	return o ? {
		image: o.image,
		tone: o.tone
	} : null;
}
function D(e, t) {
	let n = T(e);
	return n ? {
		image: n,
		tone: O(e)
	} : t ? E(t) : null;
}
function O(e) {
	return e ? m.get(x(e.origin, e.revision))?.tone ?? "mid" : "mid";
}
function k() {
	if (v) return v;
	let e = _.begin();
	return v = o([i.favicons.listen((t) => {
		_.isCurrent(e) && w(t.payload.profile_id, t.payload.entries);
	})]).then((t) => {
		if (!_.isCurrent(e)) for (let e of t) e();
	}).catch((e) => {
		throw v = null, e;
	}), v;
}
export { O as a, D as i, T as n, o, k as r, E as t };
