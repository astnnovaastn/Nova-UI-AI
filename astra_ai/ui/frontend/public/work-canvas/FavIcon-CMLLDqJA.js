import { $ as e, _t as t } from "./index-client-C_2wYFnt.js";
import { n } from "./index-client-RfUBbaI1.js";
import "./native-events-Bexa20bU.js";
import "./FavIcon-DK-naZed.js";
var r = new n(), i = new n(), a = t(null), o = (e, t) => `${e}\u0000${t}`, s = (e, t) => `${e}\u0000${t}`;
function c(e) {
	return e ? r.get(o(e.origin, e.revision))?.image ?? null : null;
}
function l(t) {
	let n = /^(https?):\/\/(?:[^@/?#]*@)?([^/?#:]+)(?::(\d+))?/iu.exec(t);
	if (!n) return null;
	let o = n[1].toLowerCase(), c = n[3] && n[3] !== (o === "https" ? "443" : "80") ? `:${n[3]}` : "";
	if (e(a) === null) return null;
	let l = i.get(s(e(a), `${o}://${n[2].toLowerCase()}${c}`)), u = l === void 0 ? void 0 : r.get(l);
	return u ? {
		image: u.image,
		tone: u.tone
	} : null;
}
function u(e) {
	return e ? r.get(o(e.origin, e.revision))?.tone ?? "mid" : "mid";
}
export { c as n, u as r, l as t };
