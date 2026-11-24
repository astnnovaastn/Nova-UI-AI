import { a as e } from "./resources-C333bKSQ.js";
import { t } from "./vendors-Bfd9iIH1.js";
import { c as n } from "./HostGlyph-CXcYKorm.js";
// upstream/src/features/work/components/asks/asks.ts
var r = {
	allow: "Allow",
	notNow: "Not now",
	alwaysFor: "Always for ",
	web: "Use the website instead",
	chooseFolder: "Choose folder…"
}, i = {
	history: "Use your history?",
	notes: "Use your notes?",
	tabs: "Use your open tabs?"
};
function a(e) {
	try {
		return new URL(e).hostname.replace(/^www\./u, "");
	} catch {
		return null;
	}
}
var o = (e, t) => e.status === "running" ? t ? "working" : "open" : e.status === "succeeded" ? "done" : e.status === "cancelled" ? t ? "declined" : "gone" : e.status === "outcome_unknown" ? "unknown" : t ? "failed" : "gone";
function s(e, t) {
	let n = /^press (.+)$/u.exec(t.trim())?.[1]?.trim() ?? "";
	if (n && !/^Enter\b/u.test(n) && n.length <= 24 && n.split(/\s+/u).length <= 3) return n;
	switch (e) {
		case "communication": return "Send";
		case "purchase": return "Book";
		case "destructive": return "Delete";
		case "save":
		case "edit": return "Save";
		case "type": return "Type";
	}
}
function c(e, r) {
	let i = e.flatMap((e) => e.kind.kind === "read" && e.kind.goal && e.status === "running" ? [a(e.kind.url)].filter((e) => !!e) : []), o = r.toLocaleLowerCase().replace(/\s+/gu, ""), s = t(void 0, r), c = (e) => n(e).toLocaleLowerCase().replace(/\s+/gu, "").endsWith(o);
	return i.find((e) => s && (e === s || e.endsWith(`.${s}`)) || e === o || e.split(".").includes(o.replace(/\.[a-z]+$/u, "")) || c(e)) ?? (i.length === 1 ? i[0] : s);
}
function l(e, { prompt: t, options: n, answer: i }, a) {
	let o = n.find((e) => e.startsWith(r.alwaysFor)), s = o?.slice(r.alwaysFor.length) ?? /^Work in your (.+?)\?/u.exec(t)?.[1];
	if (!s) return null;
	let l = `Work in your ${s}?`, u = t.startsWith(l) ? t.slice(l.length).trim() : t, d = s.split(/, | and /u).flatMap((e) => c(a, e) ?? []);
	return {
		...e,
		kind: "entry",
		name: s,
		host: d.length > 1 ? null : c(a, s),
		hosts: [...new Set(d)],
		plan: u.replace(/\.$/u, ""),
		always: o ?? `${r.alwaysFor}${s}`,
		answer: i
	};
}
function u(e, { prompt: t, options: n, answer: i }) {
	try {
		let a = new URL(t);
		return !["http:", "https:"].includes(a.protocol) || a.origin !== t || n.length !== 3 || n[0] !== r.allow || n[1] !== "Always allow" || n[2] !== r.notNow ? null : {
			...e,
			kind: "entry",
			screenshotOrigin: t,
			name: a.hostname,
			host: a.hostname,
			hosts: [a.hostname],
			plan: "",
			always: n[1],
			answer: i
		};
	} catch {
		return null;
	}
}
function d(e, { prompt: t, answer: n }, r) {
	for (let r of Object.keys(i)) {
		let a = i[r];
		if (t.startsWith(a)) return {
			...e,
			kind: "context",
			source: r,
			reason: t.slice(a.length).trim(),
			answer: n
		};
	}
	if (!r) return null;
	let a = /\b(history|notes|tabs)\b/iu.exec(t)?.[1]?.toLocaleLowerCase();
	return a ? {
		...e,
		kind: "context",
		source: a,
		reason: t,
		answer: n
	} : null;
}
function f(e, { prompt: n, options: i, answer: a }) {
	let o = /^Use (.+?)(?: \(([a-z0-9-]+)\))?\?(?:\s+(.*))?$/su.exec(n), [s, c] = i;
	if (!o || !s) return null;
	let l = o[1];
	return {
		...e,
		kind: "connection",
		service: l,
		tool: o[2] ?? null,
		host: t(void 0, l),
		use: s,
		web: c ?? r.web,
		answer: a
	};
}
function p(e, { prompt: t, options: n, answer: r }) {
	let [i, a, o] = n;
	if (!i || !a || !o) return null;
	let s;
	try {
		let e = new URL(t);
		if (e.protocol !== "https:") return null;
		s = e.host;
	} catch {
		return null;
	}
	return {
		...e,
		kind: "address",
		url: t,
		host: s,
		open: i,
		allowSite: a,
		decline: o,
		answer: r
	};
}
function m(e, t, { prompt: n, options: i, answer: a }) {
	let o = t.local?.folder?.trim() || null, s = i[0] === r.chooseFolder;
	if (!o && (!s || !t.local)) return null;
	let c = o ? h(o) : "", l = s ? n.replace(/^[^?]*\?\s*/u, "").trim() : "";
	return {
		...e,
		kind: "folder",
		name: c,
		path: o,
		allow: i[0] ?? r.allow,
		decline: i[1] ?? r.notNow,
		choose: s,
		reason: l || null,
		answer: a
	};
}
var h = (e) => e.replace(/[\\/]+$/u, "").split(/[\\/]/u).at(-1) || e, g = (e) => e && (/^\/(?!\/)/u.test(e) || /^[a-z]:[\\/]/iu.test(e) || e.startsWith("\\\\")) ? e : null;
function _(e, t) {
	if (e.kind.kind !== "ask") return null;
	let { prompt: n, options: i, purpose: a } = e.kind, s = e.kind.answer ?? null, c = {
		step: e.id,
		part: e.part ?? null,
		state: o(e, !!s)
	}, h = {
		prompt: n,
		options: i,
		answer: s
	}, g = {
		...c,
		kind: "question",
		prompt: n,
		options: i,
		answer: s
	};
	switch (a) {
		case "entry": return l(c, h, t) ?? g;
		case "screenshot": return u(c, h) ?? g;
		case "context": return d(c, h, !0) ?? g;
		case "connection": return f(c, h) ?? g;
		case "folder": return m(c, e, h) ?? g;
		case "address": return p(c, h) ?? g;
		case "question":
		case "budget":
		case "confirm": return g;
	}
	let [_, v, y] = i;
	if (i.length === 3 && _ === r.allow && y === r.notNow && v?.startsWith(r.alwaysFor)) return l(c, h, t);
	if (i.length === 2 && _ === r.allow && v === r.notNow) {
		let e = d(c, h, !1);
		if (e) return e;
	}
	if (i.length === 2 && v === r.web) {
		let e = f(c, h);
		if (e) return e;
	}
	return g;
}
function v(t, n) {
	if (t.kind.kind !== "confirm") return null;
	let r = t.kind.confirm, i = r.decision ?? null, a = r.page ? n.find((e) => e.step === r.page) : void 0, c = a?.frame ? e(a.attempt, a.step, a.frame.generation) : null, l = i === "declined" ? t.status === "running" ? "working" : "declined" : o(t, i !== null);
	return {
		kind: "confirm",
		step: t.id,
		part: t.part ?? null,
		state: l,
		site: r.site,
		category: r.category,
		headline: r.headline,
		verb: s(r.category, r.action),
		action: r.action,
		text: r.text ?? null,
		facts: r.facts ?? [],
		frame: c,
		url: a?.url ?? null,
		provenance: r.provenance ?? [],
		runOption: !!r.run_option,
		allowedForRun: i === "allowed_for_run",
		note: t.note ?? null
	};
}
function y(e, t = [], n = []) {
	let r = e.steps ?? [], i = [];
	for (let e of r) {
		let n = v(e, t) ?? _(e, r);
		n && i.push(n);
	}
	for (let e of n) {
		if (e.reason !== "sign_in" && e.reason !== "challenge" || e.phase === "reading" || e.phase === "released") continue;
		let t = r.find((t) => t.id === e.id.step), n = t?.kind.kind === "read" ? t.kind.url : null, o = n ? a(n) : null;
		o && i.push({
			kind: e.reason === "sign_in" ? "sign_in" : "check",
			step: e.id.step,
			part: t?.part ?? null,
			host: o,
			page: e,
			state: e.phase === "continuing" ? "working" : "open"
		});
	}
	for (let e of r) {
		if (e.kind.kind !== "read" || i.some((t) => t.step === e.id)) continue;
		let t = a(e.kind.url), n = e.measurements?.outcome?.kind, r = n === "needs_sign_in" ? "sign_in" : n === "needs_check" ? "check" : null, o = e.measurements?.resolved_handoff, s = r ?? (o === "sign_in_and_check" ? "sign_in" : o);
		t && s && i.push({
			kind: s,
			step: e.id,
			part: e.part ?? null,
			host: t,
			page: null,
			state: r ? "failed" : "done"
		});
	}
	return i;
}
function b(e) {
	let t = [];
	for (let n of e) {
		let e = new Map(y(n).flatMap((e) => e.kind === "question" ? [[e.step, e]] : []));
		for (let r of n.steps ?? []) {
			r.kind.kind === "steer" && r.kind.text.trim() && t.push({
				kind: "steer",
				text: r.kind.text.trim()
			});
			let n = e.get(r.id);
			n && n.state !== "gone" && t.push({
				kind: "ask",
				question: n.prompt,
				answer: n.answer?.trim() || null
			});
		}
	}
	return t;
}
export { h as i, b as n, g as r, r as t };
