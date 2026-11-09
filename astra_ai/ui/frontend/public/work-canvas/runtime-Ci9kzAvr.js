// upstream/src/shared/i18n/runtime.js
var e = {}, t = ["en"], n = "PARAGLIDE_LOCALE", r = ["baseLocale"], i = [], a = typeof window > "u";
globalThis.__paraglide = globalThis.__paraglide ?? {}, globalThis.__paraglide.ssr = globalThis.__paraglide.ssr ?? {};
var o = !1, s = () => {
	let e = r;
	!a && typeof window < "u" && window.location?.href && (e = S(window.location.href));
	let t = c(e, typeof window < "u" ? window.location?.href : void 0);
	if (t) return o || (o = !0, u(t, { reload: !1 })), t;
	throw Error("No locale found. Read the docs https://paraglidejs.com/errors#no-locale-found");
};
function c(e, t) {
	let n;
	for (let t of e) {
		if (t === "baseLocale") n = "en";
		else if (w(t) && C.has(t)) {
			let e = C.get(t);
			if (e) {
				let t = e.getLocale();
				if (t instanceof Promise) continue;
				if (t !== void 0) return p(t);
			}
		}
		let e = f(n);
		if (e) return e;
	}
}
var l = (e) => {
	e ? window.location.href = e : window.location.reload();
}, u = (e, t) => {
	let n = {
		reload: !0,
		...t
	}, i;
	try {
		i = s();
	} catch {}
	let o = [], c = r;
	!a && typeof window < "u" && window.location?.href && (c = S(window.location.href));
	for (let t of c) if (t === "baseLocale") continue;
	else if (w(t) && C.has(t)) {
		let n = C.get(t);
		if (n) {
			let r = n.setLocale(e);
			r instanceof Promise && (r = r.catch((e) => {
				throw Error(`Custom strategy "${t}" setLocale failed.`, { cause: e });
			}), o.push(r));
		}
	}
	let u = () => {
		!a && n.reload && window.location && e !== i && l(void 0);
	};
	if (o.length) return Promise.all(o).then(() => {
		u();
	});
	u();
}, d = () => typeof window < "u" ? window.location.origin : "http://fallback.com";
function f(e) {
	if (typeof e != "string") return;
	let n = e.toLowerCase();
	for (let e of t) if (e.toLowerCase() === n) return e;
}
function p(e) {
	let n = f(e);
	if (n) return n;
	throw Error(`Invalid locale: ${e}. Expected one of: ${t.join(", ")}`);
}
function m(e) {
	return e;
}
function h(e, t) {
	return e.exec(t.href);
}
var g = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
RegExp(`(?:^|;\\s*)${g}=([^;]*)`);
function _(e) {
	return v(e);
}
function v(e) {
	let t = m(typeof e == "string" ? new URL(e, d()) : new URL(e)), n = t.pathname.split("/").filter(Boolean);
	return n.length > 0 && f(n[0]) && (t.pathname = "/" + n.slice(1).join("/")), m(t);
}
var y, b;
function x(t) {
	if (i.length === 0) return;
	let n = typeof t == "string" ? t : t.href;
	if (y === n) return b;
	let r = m(new URL(n, "http://example.com")), a = _(r), o = a.href === r.href ? [r] : [r, a], s;
	for (let t of o) {
		for (let n of i) if (h(new e(n.match, t.href), t)) {
			s = n;
			break;
		}
		if (s) break;
	}
	return y = n, b = s, s;
}
function S(e) {
	let t = x(e);
	return t && t.exclude !== !0 && Array.isArray(t.strategy) ? t.strategy : r;
}
var C = /* @__PURE__ */ new Map();
function w(e) {
	return typeof e == "string" && /^custom-[A-Za-z0-9_-]+$/.test(e);
}
export { s as t };
