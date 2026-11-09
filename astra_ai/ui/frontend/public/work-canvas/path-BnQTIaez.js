import { t as e } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_object_show_all_lines.js
var t = (e) => `Show all ${e?.count} lines`, n = ((n, r = {}) => (r.locale ?? e(), t(n)));
// upstream/src/features/work/components/objects/path.ts
function r(e) {
	let t = e.lastIndexOf("/");
	return t < 0 ? {
		folder: "",
		name: e
	} : {
		folder: e.slice(0, t + 1),
		name: e.slice(t + 1)
	};
}
export { n, r as t };
