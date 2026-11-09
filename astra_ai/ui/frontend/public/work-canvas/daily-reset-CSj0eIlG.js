import { t as e } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_fault_fix_account.js
var t = () => "Open account", n = ((n = {}, r = {}) => (r.locale ?? e(), t(n))), r = () => "Change limit", i = ((t = {}, n = {}) => (n.locale ?? e(), r(t))), a = () => "See plans", o = ((t = {}, n = {}) => (n.locale ?? e(), a(t)));
// upstream/src/features/work/lib/daily-reset.ts
function s(e = /* @__PURE__ */ new Date()) {
	let t = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate() + 1);
	return new Intl.DateTimeFormat(void 0, {
		hour: "numeric",
		minute: "2-digit"
	}).format(t);
}
export { n as i, o as n, i as r, s as t };
