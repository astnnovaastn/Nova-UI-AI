import { t as e } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_env_ask.js
var t = () => "Ask", n = ((n = {}, r = {}) => (r.locale ?? e(), t(n))), r = () => "Choose", i = ((t = {}, n = {}) => (n.locale ?? e(), r(t))), a = () => "Chosen", o = ((t = {}, n = {}) => (n.locale ?? e(), a(t)));
// upstream/src/features/work/lib/board/text.ts
function s(e) {
	return e.type === "text" ? e.text ?? "" : e.type === "hardBreak" ? " " : (e.content ?? []).map(s).join(e.type === "listItem" ? " " : "");
}
function c(e) {
	let t = e.replace(/\s+/gu, " ").trim(), n = /^(.+?[.!?])(?:\s+|$)(.*)$/u.exec(t);
	return n ? {
		lead: n[1].trim(),
		rest: n[2].trim()
	} : {
		lead: t,
		rest: ""
	};
}
var l = new Set("about after also and any are because been before being between both but can could does each for from have here into its just like more most much must not only other over same should some such than that the their them then there these they this those through under very was were what when where which while who will with would your you our out per via".split(" "));
function u(e) {
	let t = e.normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]+/gu);
	return new Set((t ?? []).filter((e) => (e.length >= 4 || /\d/u.test(e)) && !l.has(e)));
}
function d(e, t) {
	let n = 0;
	for (let r of e) t.has(r) && (n += 1);
	return n;
}
function f(e) {
	return e.replace(/^\s*(\S+(?:\s+\S+)*?)\s+\1(?=\s|[,;]|$)/u, "$1");
}
export { f as a, n as c, u as i, s as n, o, c as r, i as s, d as t };
