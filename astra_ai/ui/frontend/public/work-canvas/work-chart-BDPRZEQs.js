import { t as e } from "./runtime-Ci9kzAvr.js";
import { o as t } from "./chart-CGAGKx76.js";
import "./Chart-BkEtEoB0.js";
// upstream/src/shared/i18n/messages/work_chart_basis.js
var n = (e) => `Basis: ${e?.basis}`, r = ((t, r = {}) => (r.locale ?? e(), n(t))), i = 24;
function a(e) {
	return e ? [
		e.method,
		e.conditions,
		e.versions,
		e.observedAt
	].map((e) => e?.trim()).filter((e) => !!e).join(" · ") : "";
}
var o = (e) => ({
	key: e.key,
	label: e.label,
	...e.origin ? { origin: e.origin } : {},
	...e.url ? { url: e.url } : {},
	...e.file ? { file: !0 } : {}
});
function s(e) {
	let n = /* @__PURE__ */ new Set(), r = !0, a = !1, s = 0, c = e.series.map((e) => {
		let i = new Set(e.points.map((e) => e.label)).size === e.points.length;
		return s = Math.max(s, e.points.length), {
			name: e.name,
			points: e.points.map((e) => {
				let s = i ? t(e.value) : null;
				return s && (n.add(s.currency), r &&= !!s.percent, a ||= s.y2 !== void 0), {
					x: e.label,
					y: s?.y ?? null,
					...s?.y2 === void 0 ? {} : { y2: s.y2 },
					display: e.value,
					...e.evidence?.length ? { evidence: e.evidence.map(o) } : {}
				};
			})
		};
	}), [l] = n, u = n.size === 1 && l !== void 0, d = n.size > 0;
	return {
		kind: a ? "range" : s > i ? "line" : "bars",
		series: c,
		x: {
			label: e.xLabel,
			kind: "category"
		},
		y: {
			label: e.yLabel,
			...u ? {
				format: "money",
				currency: l
			} : d && r ? { format: "percent" } : { format: "number" }
		},
		...e.basis && !e.compact ? { basis: e.basis } : {},
		...e.generalKnowledge ? { knowledge: !0 } : {},
		...e.compact ? { compact: !0 } : {}
	};
}
export { s as n, r, a as t };
