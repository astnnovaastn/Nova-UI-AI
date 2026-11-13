import { B as e, F as t, U as n, V as r, h as i, it as a, lt as o, r as s } from "./index-client-oI5R0J23.js";
import "./disclose-version-DFvUDwEH.js";
// upstream/src/features/work/components/objects/PlayMark.svelte
var c = n("<svg class=\"youtube svelte-vmuls2\" viewBox=\"0 0 68 48\" aria-hidden=\"true\"><path class=\"plate svelte-vmuls2\" d=\"M66.5 7.5A8.5 8.5 0 0 0 60.5 1.5C55.2 0 34 0 34 0S12.8 0 7.5 1.5A8.5 8.5 0 0 0 1.5 7.5C0 12.8 0 24 0 24s0 11.2 1.5 16.5a8.5 8.5 0 0 0 6 6C12.8 48 34 48 34 48s21.2 0 26.5-1.5a8.5 8.5 0 0 0 6-6C68 35.2 68 24 68 24s0-11.2-1.5-16.5z\"></path><path class=\"play svelte-vmuls2\" d=\"M27 34.3 44.8 24 27 13.7z\"></path></svg>"), l = n("<svg class=\"disc svelte-vmuls2\" viewBox=\"0 0 44 44\" aria-hidden=\"true\"><circle cx=\"22\" cy=\"22\" r=\"22\" class=\"plate svelte-vmuls2\"></circle><path d=\"M18 14.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72l-12.4-7.5A1 1 0 0 0 18 14.5z\" class=\"play svelte-vmuls2\"></path></svg>");
function u(n, u) {
	let d = s(u, "size", 3, 44), f = s(u, "youtube", 3, !1);
	var p = r(), m = o(p), h = (t) => {
		var n = c();
		a(() => {
			i(n, "width", d()), i(n, "height", d() * 48 / 68);
		}), e(t, n);
	}, g = (t) => {
		var n = l();
		a(() => {
			i(n, "width", d()), i(n, "height", d());
		}), e(t, n);
	};
	t(m, (e) => {
		f() ? e(h) : e(g, -1);
	}), e(n, p);
}
// upstream/src/features/work/lib/link-media.ts
var d = /^[\w-]{11}$/u;
function f(e) {
	let t;
	try {
		t = new URL(e);
	} catch {
		return null;
	}
	if (t.protocol !== "https:" && t.protocol !== "http:") return null;
	let n = t.hostname.toLowerCase().replace(/^(www|m)\./u, ""), r = t.pathname.split("/").filter(Boolean), i = n === "youtu.be" ? r[0] : n === "youtube.com" && r[0] === "watch" ? t.searchParams.get("v") : n === "youtube.com" && r[0] === "shorts" ? r[1] : null;
	return i && d.test(i) ? i : null;
}
function p(e) {
	let [t = "", ...n] = e.split("\n"), r = n.join(" ").trim();
	return {
		title: t.trim(),
		...r ? { channel: r } : {}
	};
}
function m(e, t) {
	try {
		let n = new URL(t).hostname.replace(/^www\./u, "");
		return e.replace(/^www\./u, "") === n;
	} catch {
		return !1;
	}
}
function h(e) {
	return e.media_attempted ? [] : [...e.image_candidates ?? []];
}
function g(e) {
	let t;
	try {
		t = new URL(e);
	} catch {
		return;
	}
	let n = t.searchParams.get("t") ?? t.searchParams.get("start");
	if (!n) return;
	let r = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/u.exec(n);
	if (!r) return;
	let i = Number(r[1] ?? 0) * 3600 + Number(r[2] ?? 0) * 60 + Number(r[3] ?? 0);
	return i > 0 ? i : void 0;
}
function _(e, t, { title: n, channel: r, poster: i } = {}) {
	if (!f(t)) return null;
	let a = g(t);
	return {
		kind: "media",
		id: e,
		media: "video",
		url: t,
		provider: "youtube",
		...n ? { title: n } : {},
		...n && r ? { channel: r } : {},
		...i ? { poster: i } : {},
		...a ? { startSecs: a } : {}
	};
}
export { f as a, p as i, _ as n, u as o, h as r, m as t };
