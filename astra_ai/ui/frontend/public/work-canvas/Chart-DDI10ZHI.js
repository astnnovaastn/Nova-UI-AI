import "./disclose-version-DFvUDwEH.js";
import { A as e, At as t, B as n, Ct as r, D as i, F as a, G as o, L as s, M as c, R as l, St as u, U as d, V as f, W as p, Y as m, at as h, c as g, ct as _, ft as v, k as y, m as b, mt as x, nt as S, ot as C, r as w, st as T, t as E, tt as D, ut as O, v as k, y as A, z as j } from "./index-client-BSGo5gVb.js";
import { r as M, t as N } from "./motion-CNlXCFGr.js";
import { a as P, c as F, d as I, f as L, i as R, l as z, n as B, r as ee, s as V, t as te } from "./chart-CGAGKx76.js";
import { t as H } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/chart_copied.js
var ne = () => "Copied", re = ((e = {}, t = {}) => (t.locale ?? H(), ne(e))), U = () => "Copy values (CSV)", W = ((e = {}, t = {}) => (t.locale ?? H(), U(e))), G = () => "Exact values", K = ((e = {}, t = {}) => (t.locale ?? H(), G(e))), q = (e) => `${e?.x} at ${e?.value}`, ie = ((e, t = {}) => (t.locale ?? H(), q(e))), J = (e) => `lowest ${e?.low}, highest ${e?.high}`, ae = ((e, t = {}) => (t.locale ?? H(), J(e))), oe = () => "Area chart", Y = ((e = {}, t = {}) => (t.locale ?? H(), oe(e))), se = () => "Bar chart", ce = ((e = {}, t = {}) => (t.locale ?? H(), se(e))), le = () => "Donut chart", ue = ((e = {}, t = {}) => (t.locale ?? H(), le(e))), de = () => "Heat map", fe = ((e = {}, t = {}) => (t.locale ?? H(), de(e))), X = () => "Line chart", pe = ((e = {}, t = {}) => (t.locale ?? H(), X(e))), me = () => "Radar chart", he = ((e = {}, t = {}) => (t.locale ?? H(), me(e))), ge = () => "Radial chart", Z = ((e = {}, t = {}) => (t.locale ?? H(), ge(e))), _e = () => "Range chart", ve = ((e = {}, t = {}) => (t.locale ?? H(), _e(e))), Q = () => "Sparkline", ye = ((e = {}, t = {}) => (t.locale ?? H(), Q(e))), be = () => "Stacked bar chart", xe = ((e = {}, t = {}) => (t.locale ?? H(), be(e))), Se = () => "Other", Ce = ((e = {}, t = {}) => (t.locale ?? H(), Se(e))), we = () => "The plot is approximate. Inspect the original decimal values below.", Te = ((e = {}, t = {}) => (t.locale ?? H(), we(e))), Ee = () => "Sources", De = ((e = {}, t = {}) => (t.locale ?? H(), Ee(e))), Oe = () => "Total", ke = ((e = {}, t = {}) => (t.locale ?? H(), Oe(e))), Ae = () => "No values to plot.", je = ((e = {}, t = {}) => (t.locale ?? H(), Ae(e))), Me = () => "Values", Ne = ((e = {}, t = {}) => (t.locale ?? H(), Me(e)));
// upstream/src/shared/ui/data/Chart/geometry.ts
function Pe(e, t) {
	let [n, r] = e, [i, a] = t, o = r - n, s = ((e) => o === 0 ? (i + a) / 2 : i + (e - n) / o * (a - i));
	return s.invert = (e) => a === i ? n : n + (e - i) / (a - i) * (o || 1), s;
}
function Fe(e, t, n = .28, r = .1) {
	let [i, a] = t, o = a - i, s = Math.max(1, e), c = o / Math.max(1, s - n + r * 2), l = i + (o - c * (s - n)) / 2;
	return {
		start: (e) => l + c * e,
		width: c * (1 - n),
		step: c
	};
}
function Ie(e) {
	return e < 0 ? -1 : 1;
}
function Le(e, t, n) {
	let r = t.x - e.x, i = n.x - t.x, a = (t.y - e.y) / (r || (i < 0 ? -0 : 0)), o = (n.y - t.y) / (i || (r < 0 ? -0 : 0)), s = (a * i + o * r) / (r + i);
	return (Ie(a) + Ie(o)) * Math.min(Math.abs(a), Math.abs(o), .5 * Math.abs(s)) || 0;
}
function Re(e, t, n) {
	let r = t.x - e.x;
	return r ? (3 * (t.y - e.y) / r - n) / 2 : n;
}
function ze(e) {
	let t = e.length;
	if (t === 0) return "";
	let n = `M${$(e[0].x)},${$(e[0].y)}`;
	if (t === 1) return n;
	if (t === 2) return `${n}L${$(e[1].x)},${$(e[1].y)}`;
	let r = Array(t);
	for (let n = 1; n < t - 1; n++) r[n] = Le(e[n - 1], e[n], e[n + 1]);
	r[0] = Re(e[0], e[1], r[1]), r[t - 1] = Re(e[t - 2], e[t - 1], r[t - 2]);
	let i = n;
	for (let n = 1; n < t; n++) {
		let t = e[n - 1], a = e[n], o = (a.x - t.x) / 3;
		i += `C${$(t.x + o)},${$(t.y + o * r[n - 1])},${$(a.x - o)},${$(a.y - o * r[n])},${$(a.x)},${$(a.y)}`;
	}
	return i;
}
function Be(e) {
	let t = [], n = [];
	for (let r of e) r === null ? (n.length && t.push(n), n = []) : n.push(r);
	return n.length && t.push(n), t;
}
function Ve(e, t) {
	return e.length ? `${ze(e)}${ze([...t].reverse()).replace(/^M/u, "L")}Z` : "";
}
function He(e, t, n, r, i, a, o) {
	let s = Math.max(0, n), c = Math.max(0, r);
	if (!s || !c) return "";
	let l = a === "none" ? 0 : Math.max(0, Math.min(i, s / 2, c / 2)), [u, d, f, p] = a === "all" ? [
		l,
		l,
		l,
		l
	] : a === "none" ? [
		0,
		0,
		0,
		0
	] : o === "up" ? [
		l,
		l,
		0,
		0
	] : o === "down" ? [
		0,
		0,
		l,
		l
	] : o === "right" ? [
		0,
		l,
		l,
		0
	] : [
		l,
		0,
		0,
		l
	], m = e + s, h = t + c;
	return `M${$(e + u)},${$(t)}H${$(m - d)}` + (d ? `A${d},${d} 0 0 1 ${$(m)},${$(t + d)}` : "") + `V${$(h - f)}` + (f ? `A${f},${f} 0 0 1 ${$(m - f)},${$(h)}` : "") + `H${$(e + p)}` + (p ? `A${p},${p} 0 0 1 ${$(e)},${$(h - p)}` : "") + `V${$(t + u)}` + (u ? `A${u},${u} 0 0 1 ${$(e + u)},${$(t)}` : "") + "Z";
}
function Ue(e, t, n, r) {
	return {
		x: e + Math.sin(r) * n,
		y: t - Math.cos(r) * n
	};
}
function We(e, t, n, r, i) {
	let a = Math.min(i - r, Math.PI * 2 - 1e-4), o = Ue(e, t, n, r), s = Ue(e, t, n, r + a);
	return `M${$(o.x)},${$(o.y)}A${$(n)},${$(n)} 0 ${+(a > Math.PI)} 1 ${$(s.x)},${$(s.y)}`;
}
function Ge(e, t, n, r, i, a, o) {
	let s = n + o, c = Math.max(s, r - o), l = Math.min((a - i) / 2, o / Math.max(1, s)), u = i + l, d = Math.max(u, a - l), f = Math.min(d - u, Math.PI * 2 - 1e-4), p = +(f > Math.PI), m = Ue(e, t, c, u), h = Ue(e, t, c, u + f), g = Ue(e, t, s, u + f), _ = Ue(e, t, s, u);
	return `M${$(m.x)},${$(m.y)}A${$(c)},${$(c)} 0 ${p} 1 ${$(h.x)},${$(h.y)}L${$(g.x)},${$(g.y)}A${$(s)},${$(s)} 0 ${p} 0 ${$(_.x)},${$(_.y)}Z`;
}
function $(e) {
	return Math.round(e * 100) / 100;
}
// upstream/src/shared/ui/data/Chart/hover.svelte.ts
var Ke = class {
	#e = v(null);
	get index() {
		return m(this.#e);
	}
	set index(e) {
		O(this.#e, e, !0);
	}
	timer;
	show(e) {
		clearTimeout(this.timer), this.index = e;
	}
	hide(e = 160) {
		clearTimeout(this.timer), this.timer = setTimeout(() => this.index = null, e);
	}
	hold() {
		clearTimeout(this.timer);
	}
	dispose() {
		clearTimeout(this.timer);
	}
}, qe = 8, Je = 12;
function Ye(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	for (let r of e.series) for (let e of r.points) {
		let r = String(e.x);
		n.has(r) || (n.add(r), t.push(r));
	}
	let r = e.x?.kind;
	return r === "time" && t.sort((e, t) => P(e) - P(t)), r === "linear" && t.sort((e, t) => Number(e) - Number(t)), t;
}
function Xe(e, t) {
	if (e.kind !== "bars" && e.kind !== "range") return !1;
	if (e.horizontal) return !0;
	let n = t.some((t) => L(t, e.x?.kind).length > 14);
	return e.compact ? n && t.length <= 6 : n || t.length > 8;
}
function Ze(e, t) {
	let n = (e.series[0]?.points ?? []).filter((e) => e.y !== null && e.y > 0).map((t) => ({
		label: L(t.x, e.x?.kind),
		value: t.y,
		points: [t]
	})).sort((e, t) => t.value - e.value);
	return (n.length <= qe ? n : [...n.slice(0, 7), {
		label: t,
		value: n.slice(7).reduce((e, t) => e + t.value, 0),
		points: n.slice(7).flatMap((e) => e.points),
		other: !0
	}]).map((e, t) => ({
		index: t,
		label: e.label,
		value: e.value,
		points: e.points,
		color: "other" in e ? "var(--color-tint-graphite)" : z(t)
	}));
}
function Qe(e, t, n) {
	let r = e.compact ? 3 : 5, i = t.filter(Number.isFinite), a = Math.min(e.y?.min ?? Infinity, ...i, n ? 0 : Infinity), o = Math.max(e.y?.max ?? -Infinity, ...i, n ? 0 : -Infinity);
	return !Number.isFinite(a) || !Number.isFinite(o) ? [0, 1] : e.y?.format === "duration" ? B(a, o, r) : te(a, o, r, n);
}
function $e(e) {
	return e.flatMap((e) => {
		let t = 0, n = 0;
		for (let r of e.points) {
			let e = r?.y ?? 0;
			e > 0 ? t += e : n += e;
		}
		return [t, n];
	});
}
function et(e, t) {
	return t === "time" ? P(e) : Number(e);
}
function tt(e, t, n) {
	let r = Array.from({ length: t }, () => Array(e.length));
	return e.forEach((e, i) => {
		let a = 0, o = 0;
		for (let s = 0; s < t; s++) {
			let t = e.points[s]?.y ?? 0;
			n && t < 0 ? (r[s][i] = [o, o + t], o += t) : (r[s][i] = [a, a + t], a += t);
		}
	}), r;
}
function nt(e, t = "Other") {
	let n = Ye(e), r = e.kind === "line" || e.kind === "area" || e.kind === "spark", i = r && (e.x?.kind === "time" || e.x?.kind === "linear") ? e.x.kind : r && e.kind !== "spark" ? "index" : "band", a = n.map((t, n) => ({
		index: n,
		key: t,
		at: i === "band" || i === "index" ? n : et(t, e.x?.kind),
		label: L(t, e.x?.kind),
		points: e.series.map((e) => e.points.find((e) => String(e.x) === t))
	})), o = e.kind === "stacked" || e.kind === "area" && !!e.stack, s = e.series.map((e, t) => ({
		key: `s${t}`,
		label: e.name,
		color: z(t)
	})), c = Qe(e, o ? $e(a) : a.flatMap((e) => e.points.flatMap((e) => e && e.y !== null ? [e.y, e.y2 ?? e.y] : [])), e.kind !== "line" && e.kind !== "spark"), l = e.kind === "donut" ? Ze(e, t) : e.kind === "radial" ? at(e) : [];
	return {
		keys: n,
		rows: a,
		series: s,
		horizontal: Xe(e, n),
		scale: i,
		layout: o ? "stack" : r ? "overlap" : "group",
		stacks: o ? tt(a, e.series.length, !r) : [],
		ticks: c,
		domain: [c[0] ?? 0, c.at(-1) ?? 1],
		parts: l,
		total: l.reduce((e, t) => e + t.value, 0),
		cells: e.kind === "heat" ? rt(e, a) : []
	};
}
function rt(e, t) {
	let n = t.flatMap((e) => e.points.flatMap((e) => e && e.y !== null ? [e.y] : [])), r = Math.min(0, ...n), i = Math.max(...n, 0) || 1;
	return e.series.flatMap((e, n) => t.map((a) => {
		let o = a.points[n], s = o?.y ?? null;
		return {
			index: n * t.length + a.index,
			key: a.key,
			order: String(n),
			row: e.name,
			label: a.label,
			value: s,
			tone: s === null ? null : Math.min(1, Math.max(0, (s - r) / (i - r || 1))),
			point: o
		};
	}));
}
var it = 5;
function at(e) {
	return (e.series[0]?.points ?? []).filter((e) => e.y !== null && e.y >= 0).slice(0, it).map((t, n) => ({
		index: n,
		label: L(t.x, e.x?.kind),
		value: t.y,
		points: [t],
		color: z(n)
	}));
}
function ot(e, t) {
	return e.y?.max === void 0 ? e.y?.format === "percent" ? 100 : Math.max(...t.map((e) => e.value), 0) || 1 : e.y.max;
}
function st(e) {
	let t = Ye(e), n = e.series.flatMap((e) => e.points.flatMap((e) => e.y === null ? [] : [e.y])), r = Math.max(...n, 0), i = e.y?.max, a = i !== void 0 && i >= r ? Number.isInteger(i) && i <= 10 ? Array.from({ length: i }, (e, t) => t + 1) : [
		i / 4,
		i / 2,
		i * 3 / 4,
		i
	] : te(0, r, 4).filter((e) => e > 0), o = a.at(-1) ?? 1;
	return {
		axes: t.map((n, r) => ({
			key: n,
			label: L(n, e.x?.kind),
			angle: r / Math.max(1, t.length) * Math.PI * 2
		})),
		series: e.series.map((e, n) => ({
			name: e.name,
			color: z(n),
			reach: t.map((t) => {
				let n = e.points.find((e) => String(e.x) === t)?.y;
				return n == null ? null : Math.max(0, n) / o;
			})
		})),
		ticks: a
	};
}
function ct(e, t) {
	if (!e || e.y === null) return "";
	let n = ut(e.y, t);
	return e.y2 === void 0 ? n : `${n}–${ut(e.y2, t)}`;
}
var lt = new Intl.NumberFormat(void 0, {
	notation: "compact",
	maximumFractionDigits: 1
});
function ut(e, t) {
	return !t?.format || t.format === "number" || t.format === "money" && !t.currency ? lt.format(e) : R(e, t, !0);
}
function dt(e, t) {
	return e < 2 ? "none" : t && e > 4 ? "table" : "rows";
}
var ft = new Intl.NumberFormat(void 0, {
	style: "percent",
	maximumFractionDigits: 0
});
function pt(e, t) {
	let n = e.kind === "donut" || e.kind === "radial" || e.kind === "heat" || e.kind === "spark" ? "none" : dt(e.series.length, !0), r = e.kind === "bars" || e.kind === "range" || e.kind === "stacked", i = null;
	if ((e.kind === "line" || e.kind === "area") && t.rows.length) {
		let n = t.rows.findLast((e) => e.points[0] && e.points[0].y !== null);
		i = {
			first: t.rows[0].label,
			last: t.rows.at(-1).label,
			value: ct(n?.points[0], e.y)
		};
	}
	let a = t.parts[0];
	return {
		categories: r,
		values: (e.kind === "bars" || e.kind === "range") && t.rows.length * e.series.length <= Je,
		ends: i,
		lead: e.kind === "donut" && a && t.total ? {
			label: a.label,
			share: ft.format(a.value / t.total)
		} : null,
		legend: n
	};
}
function mt(e, t, n) {
	if (e.kind === "radial") {
		let r = t.parts[n];
		return r ? {
			title: r.label,
			rows: [{
				name: "",
				color: r.color,
				text: F(r.points[0], e.y)
			}],
			evidence: V(r.points)
		} : null;
	}
	if (e.kind === "donut") {
		let r = t.parts[n];
		if (!r) return null;
		let i = t.total ? r.value / t.total : 0;
		return {
			title: r.label,
			rows: [{
				name: new Intl.NumberFormat(void 0, {
					style: "percent",
					maximumFractionDigits: 1
				}).format(i),
				color: r.color,
				text: r.points.length === 1 ? F(r.points[0], e.y) : F({
					x: "",
					y: r.value
				}, e.y)
			}],
			evidence: V(r.points)
		};
	}
	if (e.kind === "heat") {
		let r = t.cells[n];
		return r ? {
			title: `${r.label} · ${r.row}`,
			rows: [{
				name: "",
				color: "var(--color-lit)",
				text: r.point ? F(r.point, e.y) : "—"
			}],
			evidence: V([r.point])
		} : null;
	}
	let r = t.rows[n];
	if (!r) return null;
	let i = e.series.length === 1;
	return {
		title: r.label,
		rows: e.series.map((t, n) => ({
			name: i ? "" : t.name,
			color: z(n),
			text: F(r.points[n], e.y)
		})),
		evidence: V(r.points)
	};
}
function ht(e) {
	return /[",\n\r]/u.test(e) ? `"${e.replaceAll("\"", "\"\"")}"` : e;
}
function gt(e) {
	let t = Ye(e);
	return [[e.x?.label ?? "", ...e.series.map((t) => t.name || e.y?.label || "")], ...t.map((t) => [L(t, e.x?.kind), ...e.series.map((n) => {
		let r = n.points.find((e) => String(e.x) === t);
		return r && (r.display !== void 0 || r.y !== null) ? F(r, e.y) : "";
	})])].map((e) => e.map(ht).join(",")).join("\n");
}
// upstream/src/shared/ui/data/Chart/Readout.svelte
var _t = j("<span class=\"name svelte-i8crd8\"> </span>"), vt = j("<span class=\"row svelte-i8crd8\"><span></span> <!> <span> </span></span>"), yt = j("<button type=\"button\" class=\"chip svelte-i8crd8\"><!> <span class=\"host svelte-i8crd8\"> </span></button>"), bt = j("<span class=\"chips svelte-i8crd8\"></span>"), xt = j("<div class=\"chart-tooltip svelte-i8crd8\"><span class=\"label svelte-i8crd8\"> </span> <!> <!></div>");
function St(n, o) {
	r(o, !0);
	let d = w(o, "indicator", 3, "dot");
	var f = xt(), g = h(f), _ = h(g, !0);
	t(g);
	var v = T(g, 2);
	y(v, 17, () => o.readout.rows, e, (e, n) => {
		var r = vt(), i = h(r);
		let o;
		var l = T(i, 2), u = (e) => {
			var r = _t(), i = h(r, !0);
			t(r), D(() => a(i, m(n).name)), s(e, r);
		};
		c(l, (e) => {
			m(n).name && e(u);
		});
		var f = T(l, 2);
		let p;
		var g = h(f, !0);
		t(f), t(r), D(() => {
			A(i, 1, `indicator ${d() ?? ""}`, "svelte-i8crd8"), o = k(i, "", o, { "--indicator": m(n).color }), p = A(f, 1, "value svelte-i8crd8", null, p, { alone: !m(n).name }), a(g, m(n).text);
		}), s(e, r);
	});
	var x = T(v, 2), S = (e) => {
		var n = bt();
		y(n, 21, () => o.readout.evidence, (e) => e.key, (e, n) => {
			var r = yt(), u = h(r), d = (e) => {
				var t = l(), r = C(t);
				i(r, () => o.glyph, () => m(n)), s(e, t);
			};
			c(u, (e) => {
				o.glyph && e(d);
			});
			var f = T(u, 2), g = h(f, !0);
			t(f), t(r), D(() => {
				r.disabled = !o.onevidence, b(r, "title", m(n).label), a(g, m(n).file ? m(n).label : m(n).origin || m(n).label);
			}), p("click", r, () => o.onevidence?.(m(n))), s(e, r);
		}), t(n), s(e, n);
	};
	c(x, (e) => {
		o.readout.evidence.length && e(S);
	}), t(f), D(() => a(_, o.readout.title)), s(n, f), u();
}
d(["click"]);
// upstream/src/shared/ui/data/Chart/Tip.svelte
var Ct = j("<div class=\"tip svelte-1bbc4u3\" role=\"presentation\"><!></div>");
function wt(e, n) {
	r(n, !0);
	let i = w(n, "indicator", 3, "dot"), a = v(0), c = v(0), l = x(() => Math.max(0, Math.min(n.x - m(a) / 2, n.width - m(a)))), d = x(() => n.y - m(c) - 10 >= -8 ? n.y - m(c) - 10 : n.y + 14);
	var f = Ct();
	let p;
	St(h(f), {
		get readout() {
			return n.readout;
		},
		get indicator() {
			return i();
		},
		get onevidence() {
			return n.onevidence;
		},
		get glyph() {
			return n.glyph;
		}
	}), t(f), D(() => p = k(f, "", p, {
		left: `${m(l)}px`,
		top: `${m(d)}px`
	})), o("pointerenter", f, () => n.hover.hold()), o("pointerleave", f, () => n.hover.hide()), g(f, "clientWidth", (e) => O(a, e)), g(f, "clientHeight", (e) => O(c, e)), s(e, f), u();
}
// upstream/src/shared/ui/data/Chart/Cartesian.svelte
var Tt = n("<linearGradient x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0%\"></stop><stop offset=\"100%\" stop-opacity=\"0.02\"></stop></linearGradient>"), Et = n("<defs></defs>"), Dt = n("<line class=\"svelte-ocimr6\"></line>"), Ot = n("<g class=\"grid svelte-ocimr6\" aria-hidden=\"true\"></g>"), kt = n("<line class=\"zero svelte-ocimr6\"></line>"), At = n("<rect class=\"cursor svelte-ocimr6\" rx=\"6\"></rect>"), jt = n("<path></path>"), Mt = n("<circle r=\"3.5\"></circle>"), Nt = n("<!><path pathLength=\"1\"></path><!>", 1), Pt = n("<circle r=\"4.5\" class=\"focus svelte-ocimr6\"></circle>"), Ft = n("<line class=\"cursor-line svelte-ocimr6\"></line><!>", 1), It = n("<!><!>", 1), Lt = n("<text> </text>"), Rt = n("<text class=\"tick svelte-ocimr6\" text-anchor=\"middle\"> </text>"), zt = n("<text class=\"tick svelte-ocimr6\" text-anchor=\"end\" dominant-baseline=\"central\"> </text>"), Bt = n("<g class=\"axis\" aria-hidden=\"true\"></g>"), Vt = n("<text class=\"tick name svelte-ocimr6\" text-anchor=\"end\" dominant-baseline=\"central\"><title> </title> </text>"), Ht = n("<text class=\"tick svelte-ocimr6\" text-anchor=\"start\"> </text>"), Ut = n("<text class=\"tick svelte-ocimr6\" text-anchor=\"end\"> </text>"), Wt = n("<text class=\"value end svelte-ocimr6\" dominant-baseline=\"central\" text-anchor=\"start\"> </text>"), Gt = n("<g class=\"axis\" aria-hidden=\"true\"><!><!></g><!>", 1), Kt = n("<svg role=\"img\"><!><!><!><!><!><!><!></svg><!>", 1), qt = j("<div class=\"cartesian svelte-ocimr6\"><!></div>");
function Jt(n, i) {
	r(i, !0);
	let d = 6.5, f = v(0), _ = new Ke();
	E(() => _.dispose());
	let S = x(() => i.detail !== "full"), w = x(() => i.detail === "tile"), j = x(() => !!i.spec.compact || m(S)), M = x(() => i.spec.kind === "line" || i.spec.kind === "area"), N = x(() => i.shape.horizontal), P = x(() => i.shape.scale === "band"), R = x(() => i.shape.layout === "stack"), z = x(() => !m(S) && (i.spec.compact ? i.labels.values : (i.spec.kind === "bars" || i.spec.kind === "range") && i.spec.series.length === 1 && i.shape.rows.length <= 12)), B = x(() => !m(j) && !m(z)), ee = x(() => i.spec.kind === "line" && !m(w) && i.shape.rows.length <= 16 && i.spec.series.length <= 3), V = (e, t) => i.spec.compact ? ct(e.points[t], i.spec.y) : F(e.points[t], i.spec.y), te = x(() => Math.max(24, ...i.shape.ticks.map((e) => I(e, i.spec.y).length * d + 10))), H = x(() => Math.min(200, Math.max(...i.shape.rows.map((e) => e.label.length * d), 0) + 12)), ne = x(() => Math.max(24, ...i.shape.rows.flatMap((e) => e.points.map((t, n) => V(e, n).length * d + 12)))), re = x(() => {
		if (m(w)) return {
			top: 2,
			right: 2,
			bottom: 2,
			left: 2
		};
		if (m(N)) return {
			top: 4,
			right: m(z) || i.labels.values ? m(ne) : 8,
			bottom: m(B) ? 22 : 4,
			left: m(S) ? 4 : m(H)
		};
		let e = i.spec.compact && !m(S) && (i.labels.categories || !!i.labels.ends);
		return {
			top: m(z) || i.spec.compact && i.labels.values && !m(S) ? 20 : 8,
			right: i.spec.compact && i.labels.ends && !m(S) ? 36 : m(M) ? 14 : 4,
			bottom: m(S) ? 4 : i.spec.compact ? e ? 18 : 4 : 24,
			left: m(B) ? m(te) : m(M) ? 14 : 0
		};
	}), U = x(() => m(re).left), W = x(() => Math.max(m(U) + 1, m(f) - m(re).right)), G = x(() => m(re).top), K = x(() => Math.max(m(G) + 1, i.height - m(re).bottom)), q = x(() => m(N) ? Pe(i.shape.domain, [m(U), m(W)]) : Pe(i.shape.domain, [m(K), m(G)])), ie = x(() => m(q)(Math.max(i.shape.domain[0], Math.min(0, i.shape.domain[1])))), J = x(() => Fe(i.shape.rows.length, m(N) ? [m(G), m(K)] : [m(U), m(W)], m(w) ? .2 : .28, .1)), ae = x(() => {
		let e = i.shape.rows.map((e) => e.at);
		return [Math.min(...e), Math.max(...e)];
	}), oe = x(() => i.shape.scale === "index" ? Pe([0, Math.max(1, i.shape.rows.length - 1)], [m(U), m(W)]) : Pe(m(ae), [m(U), m(W)]));
	function Y(e) {
		return m(P) ? m(J).start(e.index) + m(J).width / 2 : i.shape.rows.length === 1 ? (m(U) + m(W)) / 2 : m(oe)(e.at);
	}
	let se = x(() => {
		let e = ce();
		return Math.max(2, Math.min(m(w) ? 3 : 6, e / 2));
	});
	function ce() {
		return m(R) || i.spec.series.length === 1 ? m(J).width : Fe(i.spec.series.length, [0, m(J).width], .14, 0).width;
	}
	let le = x(() => {
		if (m(M)) return [];
		let e = [], t = Fe(i.spec.series.length, [0, m(J).width], .14, 0);
		return i.spec.series.forEach((n, r) => {
			i.shape.rows.forEach((n) => {
				let a = n.points[r];
				if (!a || a.y === null) return;
				let o, s, c = "end";
				if (m(R)) {
					if ([o, s] = i.shape.stacks[r][n.index], o === s) return;
					let e = s >= o;
					i.shape.stacks.slice(r + 1).some((t) => {
						let [r, i] = t[n.index];
						return r !== i && i >= r === e;
					}) && (c = "none");
				} else i.spec.kind === "range" ? (o = a.y, s = a.y2 ?? a.y, c = "all") : (o = Math.max(i.shape.domain[0], Math.min(0, i.shape.domain[1])), s = a.y);
				let l = m(R) || i.spec.series.length === 1 ? 0 : t.start(r), u = m(R) || i.spec.series.length === 1 ? m(J).width : t.width, d = Math.min(u, m(N) ? 28 : 64), f = m(J).start(n.index) + l + (u - d) / 2, p = m(q)(o), h = m(q)(s), g = Math.min(d, 8);
				if (i.spec.kind === "range" && Math.abs(h - p) < g) {
					let e = (p + h) / 2, t = g / 2 * (h >= p ? 1 : -1);
					[p, h] = [e - t, e + t];
				}
				let _ = m(R) && o !== 0 ? 2 : 0, v, y;
				if (m(N)) {
					let e = h >= p, t = e ? p + _ : h;
					v = He(t, f, (e ? h : p - _) - t, d, m(se), c, e ? "right" : "left"), y = i.spec.kind === "range" ? "center" : e ? "left" : "right";
				} else {
					let e = h <= p, t = e ? h : p + _;
					v = He(f, t, d, (e ? p - _ : h) - t, m(se), c, e ? "up" : "down"), y = i.spec.kind === "range" ? "center" : e ? "bottom" : "top";
				}
				v && e.push({
					key: `${r}:${n.key}`,
					d: v,
					color: i.shape.series[r].color,
					origin: y,
					index: n.index
				});
			});
		}), e;
	}), ue = x(() => m(M) ? i.shape.series.map((e, t) => {
		let n = i.shape.rows.map((e) => {
			let n = e.points[t]?.y;
			return n == null ? null : {
				x: Y(e),
				y: m(q)(m(R) ? i.shape.stacks[t][e.index][1] : n)
			};
		}), r = i.shape.rows.map((e) => m(R) ? {
			x: Y(e),
			y: m(q)(i.shape.stacks[t][e.index][0])
		} : {
			x: Y(e),
			y: m(ie)
		}), a = Be(n.map((e, t) => e ? {
			point: e,
			floor: r[t]
		} : null));
		return {
			key: e.key,
			color: e.color,
			line: a.map((e) => ze(e.map((e) => e.point))).join(""),
			area: a.map((e) => Ve(e.map((e) => e.point), e.map((e) => e.floor))).join(""),
			dots: n
		};
	}) : []), de = x(() => {
		if (m(N)) return i.shape.rows;
		if (i.shape.scale === "index") {
			let e = Math.max(1, Math.ceil(i.shape.rows.length / 8));
			return i.shape.rows.filter((t) => t.index % e === 0);
		}
		let e = Math.max(...i.shape.rows.map((e) => X(e).length * d), 0) + 10, t = Math.max(1, m(W) - m(U)), n = Math.max(1, Math.ceil(i.shape.rows.length * e / t));
		return i.shape.rows.filter((e, t) => t % n === 0);
	}), fe = x(() => new Intl.DateTimeFormat(void 0, m(ae)[1] - m(ae)[0] > 1728e5 ? {
		month: "short",
		day: "numeric"
	} : {
		hour: "numeric",
		minute: "2-digit"
	}));
	function X(e) {
		return i.shape.scale === "time" ? m(fe).format(e.at) : i.shape.scale === "linear" ? L(e.at, "linear") : e.label;
	}
	function pe(e, t) {
		let n = Math.max(3, Math.floor(t / d));
		return e.length > n ? `${e.slice(0, n - 1).trimEnd()}…` : e;
	}
	function me(e, t) {
		let n = e.points[t];
		if (!n || n.y === null) return null;
		let r = n.y2 ?? n.y, a = r >= 0, o = i.spec.series.length > 1 && !m(R), s = Fe(i.spec.series.length, [0, m(J).width], .14, 0), c = o ? s.start(t) + s.width / 2 : m(J).width / 2;
		return m(N) ? {
			x: m(q)(r) + (a ? 6 : -6),
			y: m(J).start(e.index) + c,
			anchor: a ? "start" : "end"
		} : {
			x: m(J).start(e.index) + c,
			y: m(q)(r) + (a ? -7 : 14),
			anchor: "middle"
		};
	}
	let he = x(() => i.shape.rows.findLast((e) => e.points[0] && e.points[0].y !== null));
	function ge(e) {
		let t = e.currentTarget.getBoundingClientRect(), n = m(N) ? e.clientY - t.top : e.clientX - t.left, r;
		if (m(P)) r = Math.floor((n - m(J).start(0) + (m(J).step - m(J).width) / 2) / m(J).step);
		else {
			let e = 0, t = Infinity;
			for (let r of i.shape.rows) {
				let i = Math.abs(Y(r) - n);
				i < t && ([e, t] = [r.index, i]);
			}
			r = e;
		}
		_.show(Math.max(0, Math.min(i.shape.rows.length - 1, r)));
	}
	let Z = x(() => _.index === null ? null : i.shape.rows[_.index] ?? null), _e = x(() => m(Z) ? mt(i.spec, i.shape, m(Z).index) : null), ve = x(() => {
		if (!m(Z)) return null;
		let e = m(Z).points.flatMap((e, t) => !e || e.y === null ? [] : m(R) ? [i.shape.stacks[t][m(Z).index][1]] : [e.y2 ?? e.y]), t = e.length ? Math.max(...e) : 0;
		return m(N) ? {
			x: m(q)(t),
			y: m(J).start(m(Z).index)
		} : {
			x: Y(m(Z)),
			y: Math.min(m(q)(t), m(K)) - (m(M) ? 4 : 0)
		};
	});
	var Q = qt();
	let ye;
	var be = h(Q), xe = (n) => {
		var r = Kt(), u = C(r);
		let d;
		var g = h(u), v = (e) => {
			var n = Et();
			y(n, 23, () => i.shape.series, (e) => e.key, (e, n, r) => {
				var a = Tt(), o = h(a), c = T(o);
				t(a), D(() => {
					b(a, "id", `${i.uid}-wash-${m(r)}`), b(o, "stop-color", m(n).color), b(o, "stop-opacity", m(w) ? .5 : .36), b(c, "stop-color", m(n).color);
				}), s(e, a);
			}), t(n), s(e, n);
		};
		c(g, (e) => {
			i.spec.kind === "area" && e(v);
		});
		var E = T(g), O = (e) => {
			var n = Ot();
			y(n, 20, () => i.shape.ticks, (e) => e, (e, t) => {
				let n = x(() => Math.round(m(q)(t)) + .5);
				var r = l(), i = C(r), a = (e) => {
					var t = Dt();
					D(() => {
						b(t, "x1", m(n)), b(t, "x2", m(n)), b(t, "y1", m(G)), b(t, "y2", m(K));
					}), s(e, t);
				}, o = (e) => {
					var t = Dt();
					D(() => {
						b(t, "x1", m(U)), b(t, "x2", m(W)), b(t, "y1", m(n)), b(t, "y2", m(n));
					}), s(e, t);
				};
				c(i, (e) => {
					m(N) ? e(a) : e(o, -1);
				}), s(e, r);
			}), t(n), s(e, n);
		};
		c(E, (e) => {
			!m(w) && !(m(N) && m(z)) && e(O);
		});
		var F = T(E), L = (e) => {
			let t = x(() => Math.round(m(ie)) + .5);
			var n = l(), r = C(n), i = (e) => {
				var n = kt();
				D(() => {
					b(n, "x1", m(t)), b(n, "x2", m(t)), b(n, "y1", m(G)), b(n, "y2", m(K));
				}), s(e, n);
			}, a = (e) => {
				var n = kt();
				D(() => {
					b(n, "x1", m(U)), b(n, "x2", m(W)), b(n, "y1", m(t)), b(n, "y2", m(t));
				}), s(e, n);
			};
			c(r, (e) => {
				m(N) ? e(i) : e(a, -1);
			}), s(e, n);
		};
		c(F, (e) => {
			i.shape.domain[0] < 0 && i.shape.domain[1] > 0 && e(L);
		});
		var R = T(F), te = (e) => {
			let t = x(() => m(J).start(m(Z).index) - (m(J).step - m(J).width) / 2);
			var n = l(), r = C(n), i = (e) => {
				var n = At();
				D(() => {
					b(n, "x", m(U)), b(n, "y", m(t)), b(n, "width", m(W) - m(U)), b(n, "height", m(J).step);
				}), s(e, n);
			}, a = (e) => {
				var n = At();
				D(() => {
					b(n, "x", m(t)), b(n, "y", m(G)), b(n, "width", m(J).step), b(n, "height", m(K) - m(G));
				}), s(e, n);
			};
			c(r, (e) => {
				m(N) ? e(i) : e(a, -1);
			}), s(e, n);
		};
		c(R, (e) => {
			m(Z) && m(P) && e(te);
		});
		var ne = T(R), re = (t) => {
			var n = It(), r = C(n);
			y(r, 19, () => m(ue), (e) => e.key, (t, n, r) => {
				var a = Nt(), o = C(a), u = (e) => {
					var t = jt();
					let a;
					D(() => {
						b(t, "d", m(n).area), a = A(t, 0, "mark area svelte-ocimr6", null, a, { enter: !i.settled }), b(t, "fill", `url(#${i.uid}-wash-${m(r)})`);
					}), s(e, t);
				};
				c(o, (e) => {
					i.spec.kind === "area" && e(u);
				});
				var d = T(o);
				let f;
				var p = T(d), h = (t) => {
					var r = l(), a = C(r);
					y(a, 17, () => m(n).dots, e, (e, t) => {
						var r = l(), a = C(r), o = (e) => {
							var r = Mt();
							let a;
							D(() => {
								b(r, "cx", m(t).x), b(r, "cy", m(t).y), a = A(r, 0, "mark dot svelte-ocimr6", null, a, { enter: !i.settled }), b(r, "fill", m(n).color);
							}), s(e, r);
						};
						c(a, (e) => {
							m(t) && e(o);
						}), s(e, r);
					}), s(t, r);
				};
				c(p, (e) => {
					m(ee) && e(h);
				}), D(() => {
					b(d, "d", m(n).line), f = A(d, 0, "mark line svelte-ocimr6", null, f, { enter: !i.settled }), b(d, "stroke", m(n).color);
				}), s(t, a);
			});
			var a = T(r), o = (e) => {
				let t = x(() => Y(m(Z)));
				var n = Ft(), r = C(n), i = T(r);
				y(i, 17, () => m(ue), (e) => e.key, (e, t) => {
					let n = x(() => m(t).dots[m(Z).index]);
					var r = l(), i = C(r), a = (e) => {
						var r = Pt();
						D(() => {
							b(r, "cx", m(n).x), b(r, "cy", m(n).y), b(r, "fill", m(t).color);
						}), s(e, r);
					};
					c(i, (e) => {
						m(n) && e(a);
					}), s(e, r);
				}), D(() => {
					b(r, "x1", m(t)), b(r, "x2", m(t)), b(r, "y1", m(G)), b(r, "y2", m(K));
				}), s(e, n);
			};
			c(a, (e) => {
				m(Z) && !m(S) && e(o);
			}), s(t, n);
		}, ae = (e) => {
			var n = It(), r = C(n);
			y(r, 17, () => m(le), (e) => e.key, (e, t) => {
				var n = jt();
				let r, a;
				D((e) => {
					b(n, "d", m(t).d), b(n, "fill", m(t).color), r = A(n, 0, "mark bar svelte-ocimr6", null, r, {
						enter: !i.settled,
						dim: m(Z) !== null && m(Z).index !== m(t).index
					}), a = k(n, "", a, e);
				}, [() => ({
					"transform-origin": m(t).origin,
					"animation-delay": i.settled ? void 0 : `${Math.min(m(t).index * 18, 180)}ms`
				})]), s(e, n);
			});
			var o = T(r), u = (e) => {
				var n = l(), r = C(n);
				y(r, 19, () => i.shape.series, (e) => e.key, (e, n, r) => {
					var o = l(), u = C(o);
					y(u, 17, () => i.shape.rows, (e) => e.key, (e, n) => {
						let o = x(() => me(m(n), m(r)));
						var u = l(), d = C(u), f = (e) => {
							var c = Lt();
							let l;
							var u = h(c, !0);
							t(c), D((e) => {
								b(c, "x", m(o).x), b(c, "y", m(o).y), b(c, "text-anchor", m(o).anchor), b(c, "dominant-baseline", m(N) ? "central" : "auto"), l = A(c, 0, "value svelte-ocimr6", null, l, { enter: !i.settled }), a(u, e);
							}, [() => V(m(n), m(r))]), s(e, c);
						};
						c(d, (e) => {
							m(o) && e(f);
						}), s(e, u);
					}), s(e, o);
				}), s(e, n);
			};
			c(o, (e) => {
				m(z) && e(u);
			}), s(e, n);
		};
		c(ne, (e) => {
			m(M) ? e(re) : e(ae, -1);
		});
		var oe = T(ne), se = (e) => {
			var n = Bt();
			y(n, 20, () => i.shape.ticks, (e) => e, (e, n) => {
				var r = l(), o = C(r), u = (e) => {
					var r = Rt(), o = h(r, !0);
					t(r), D((e, t) => {
						b(r, "x", e), b(r, "y", m(K) + 16), a(o, t);
					}, [() => m(q)(n), () => I(n, i.spec.y)]), s(e, r);
				}, d = (e) => {
					var r = zt(), o = h(r, !0);
					t(r), D((e, t) => {
						b(r, "x", m(U) - 8), b(r, "y", e), a(o, t);
					}, [() => m(q)(n), () => I(n, i.spec.y)]), s(e, r);
				};
				c(o, (e) => {
					m(N) ? e(u) : e(d, -1);
				}), s(e, r);
			}), t(n), s(e, n);
		};
		c(oe, (e) => {
			m(B) && e(se);
		});
		var ce = T(oe), fe = (e) => {
			var n = Bt();
			y(n, 21, () => m(de), (e) => e.key, (e, n) => {
				var r = l(), o = C(r), u = (e) => {
					var r = Vt(), i = h(r), o = h(i, !0);
					t(i);
					var c = T(i, 1, !0);
					t(r), D((e, t) => {
						b(r, "x", m(U) - 8), b(r, "y", e), a(o, m(n).label), a(c, t);
					}, [() => m(J).start(m(n).index) + m(J).width / 2, () => pe(m(n).label, m(H) - 12)]), s(e, r);
				}, d = (e) => {
					var r = Lt();
					let o;
					var c = h(r, !0);
					t(r), D((e, t) => {
						o = A(r, 0, "tick svelte-ocimr6", null, o, { on: m(Z)?.index === m(n).index }), b(r, "x", e), b(r, "y", m(K) + 16), b(r, "text-anchor", !m(P) && m(n).index === 0 && i.shape.rows.length > 1 ? "start" : !m(P) && m(n).index === i.shape.rows.length - 1 && i.shape.rows.length > 1 ? "end" : "middle"), a(c, t);
					}, [() => Y(m(n)), () => X(m(n))]), s(e, r);
				};
				c(o, (e) => {
					m(N) ? e(u) : e(d, -1);
				}), s(e, r);
			}), t(n), s(e, n);
		}, Q = (e) => {
			let n = x(() => i.shape.rows[0]), r = x(() => i.shape.rows.at(-1));
			var o = Gt(), u = C(o), d = h(u), f = (e) => {
				var r = Ht(), i = h(r, !0);
				t(r), D((e, t) => {
					b(r, "x", e), b(r, "y", m(K) + 14), a(i, t);
				}, [() => Y(m(n)), () => X(m(n))]), s(e, r);
			};
			c(d, (e) => {
				m(n) && e(f);
			});
			var p = T(d), g = (e) => {
				var n = Ut(), i = h(n, !0);
				t(n), D((e, t) => {
					b(n, "x", e), b(n, "y", m(K) + 14), a(i, t);
				}, [() => Y(m(r)), () => X(m(r))]), s(e, n);
			};
			c(p, (e) => {
				m(r) && m(r) !== m(n) && e(g);
			}), t(u);
			var _ = T(u), v = (e) => {
				let n = x(() => m(ue)[0]?.dots[m(he).index]);
				var r = l(), o = C(r), u = (e) => {
					var r = Wt(), o = h(r, !0);
					t(r), D(() => {
						b(r, "x", m(n).x + 6), b(r, "y", m(n).y), a(o, i.labels.ends.value);
					}), s(e, r);
				};
				c(o, (e) => {
					m(n) && e(u);
				}), s(e, r);
			};
			c(_, (e) => {
				m(he) && e(v);
			}), s(e, o);
		};
		c(ce, (e) => {
			!m(S) && (!m(j) || i.labels.categories) ? e(fe) : !m(S) && i.labels.ends && e(Q, 1);
		}), t(u);
		var ye = T(u), be = (e) => {
			{
				let t = x(() => m(M) ? "line" : "dot");
				wt(e, {
					get readout() {
						return m(_e);
					},
					get x() {
						return m(ve).x;
					},
					get y() {
						return m(ve).y;
					},
					get width() {
						return m(f);
					},
					get hover() {
						return _;
					},
					get indicator() {
						return m(t);
					},
					get onevidence() {
						return i.onevidence;
					},
					get glyph() {
						return i.glyph;
					}
				});
			}
		};
		c(ye, (e) => {
			m(_e) && m(ve) && !m(S) && e(be);
		}), D(() => {
			b(u, "width", m(f)), b(u, "height", i.height), b(u, "aria-label", i.summary), d = A(u, 0, "svelte-ocimr6", null, d, { lying: m(N) });
		}), p("pointermove", u, function(...e) {
			(m(S) ? void 0 : ge)?.apply(this, e);
		}), o("pointerleave", u, function(...e) {
			(m(S) ? void 0 : () => _.hide())?.apply(this, e);
		}), s(n, r);
	};
	c(be, (e) => {
		m(f) && e(xe);
	}), t(Q), D(() => ye = k(Q, "", ye, { "block-size": `${i.height}px` })), g(Q, "clientWidth", (e) => O(f, e)), s(n, Q), u();
}
d(["pointermove"]);
// upstream/src/shared/ui/data/Chart/ChartLegend.svelte
var Yt = j("<span class=\"share svelte-lct99f\"> </span>"), Xt = j("<li class=\"svelte-lct99f\"><span class=\"swatch svelte-lct99f\"></span><span class=\"name svelte-lct99f\"> </span><!></li>"), Zt = j("<ul></ul>");
function Qt(e, n) {
	let r = w(n, "layout", 3, "row");
	var i = Zt();
	y(i, 21, () => n.entries, (e) => e.key, (e, n) => {
		var r = Xt(), i = h(r);
		let o;
		var l = T(i), u = h(l, !0);
		t(l);
		var d = T(l), f = (e) => {
			var r = Yt(), i = h(r, !0);
			t(r), D(() => a(i, m(n).share)), s(e, r);
		};
		c(d, (e) => {
			m(n).share && e(f);
		}), t(r), D(() => {
			o = k(i, "", o, { background: m(n).color }), a(u, m(n).label);
		}), s(e, r);
	}), t(i), D(() => A(i, 1, `chart-legend ${r() ?? ""}`, "svelte-lct99f")), s(e, i);
}
// upstream/src/shared/ui/data/Chart/Heat.svelte
var $t = n("<rect rx=\"2\" role=\"presentation\"></rect>"), en = n("<text class=\"tick svelte-9xl1lm\" text-anchor=\"end\" dominant-baseline=\"central\"> </text>"), tn = n("<text class=\"tick svelte-9xl1lm\" text-anchor=\"middle\"> </text>"), nn = n("<g aria-hidden=\"true\"><!><!></g>"), rn = n("<svg role=\"img\" class=\"svelte-9xl1lm\"><!><!></svg><!>", 1), an = j("<div class=\"heat svelte-9xl1lm\"><!></div>");
function on(n, i) {
	r(i, !0);
	let d = 6.5, f = v(0), p = new Ke();
	E(() => p.dispose());
	let _ = x(() => i.compact ? 0 : Math.max(...i.spec.series.map((e) => e.name.length * d), 0) + 14), S = x(() => i.height - (i.compact ? 0 : 20)), w = x(() => Fe(i.shape.keys.length, [m(_), Math.max(m(_) + 1, m(f))], .08, 0)), j = x(() => Fe(i.spec.series.length, [i.compact ? 0 : 4, m(S)], .1, 0)), M = (e) => e === null ? "var(--color-fill)" : `color-mix(in oklab, var(--color-lit) ${Math.round(6 + e * 94)}%, var(--color-surface))`, N = x(() => Math.max(1, Math.ceil(i.shape.rows.length * (Math.max(...i.shape.rows.map((e) => e.label.length), 0) * d + 8) / Math.max(1, m(f) - m(_))))), P = x(() => p.index === null ? null : mt(i.spec, i.shape, p.index)), F = x(() => {
		let e = p.index === null ? null : i.shape.cells[p.index];
		if (!e) return null;
		let t = i.shape.keys.indexOf(e.key);
		return {
			x: m(w).start(t) + m(w).width / 2,
			y: m(j).start(Number(e.order))
		};
	});
	var I = an();
	let L;
	var R = h(I), z = (n) => {
		var r = rn(), u = C(r), d = h(u);
		y(d, 17, () => i.shape.cells, (e) => e.index, (e, t) => {
			var n = $t();
			let r;
			D((e, a, o) => {
				b(n, "x", e), b(n, "y", a), b(n, "width", m(w).width), b(n, "height", m(j).width), b(n, "fill", o), r = A(n, 0, "mark cell svelte-9xl1lm", null, r, {
					enter: !i.settled,
					on: p.index === m(t).index
				});
			}, [
				() => m(w).start(i.shape.keys.indexOf(m(t).key)),
				() => m(j).start(Number(m(t).order)),
				() => M(m(t).tone)
			]), o("pointerenter", n, function(...e) {
				(i.quiet ? void 0 : () => p.show(m(t).index))?.apply(this, e);
			}), o("pointerleave", n, function(...e) {
				(i.quiet ? void 0 : () => p.hide())?.apply(this, e);
			}), s(e, n);
		});
		var g = T(d), v = (n) => {
			var r = nn(), o = h(r);
			y(o, 17, () => i.spec.series, e, (e, n, r) => {
				var i = en(), o = h(i, !0);
				t(i), D((e) => {
					b(i, "x", m(_) - 8), b(i, "y", e), a(o, m(n).name);
				}, [() => m(j).start(r) + m(j).width / 2]), s(e, i);
			});
			var u = T(o);
			y(u, 17, () => i.shape.rows, (e) => e.key, (e, n) => {
				var r = l(), o = C(r), u = (e) => {
					var r = tn(), o = h(r, !0);
					t(r), D((e) => {
						b(r, "x", e), b(r, "y", i.height - 4), a(o, m(n).label);
					}, [() => m(w).start(m(n).index) + m(w).width / 2]), s(e, r);
				};
				c(o, (e) => {
					m(n).index % m(N) === 0 && e(u);
				}), s(e, r);
			}), t(r), s(n, r);
		};
		c(g, (e) => {
			i.compact || e(v);
		}), t(u);
		var x = T(u), S = (e) => {
			wt(e, {
				get readout() {
					return m(P);
				},
				get x() {
					return m(F).x;
				},
				get y() {
					return m(F).y;
				},
				get width() {
					return m(f);
				},
				get hover() {
					return p;
				},
				get onevidence() {
					return i.onevidence;
				},
				get glyph() {
					return i.glyph;
				}
			});
		};
		c(x, (e) => {
			m(P) && m(F) && !i.quiet && e(S);
		}), D(() => {
			b(u, "width", m(f)), b(u, "height", i.height), b(u, "aria-label", i.summary);
		}), s(n, r);
	};
	c(R, (e) => {
		m(f) && e(z);
	}), t(I), D(() => L = k(I, "", L, { "block-size": `${i.height}px` })), g(I, "clientWidth", (e) => O(f, e)), s(n, I), u();
}
// upstream/src/shared/ui/data/Chart/Radar.svelte
var sn = n("<polygon class=\"grid svelte-1j8obo0\"></polygon>"), cn = n("<line class=\"grid svelte-1j8obo0\"></line>"), ln = n("<circle class=\"mark dot svelte-1j8obo0\"></circle>"), un = n("<polygon class=\"mark web svelte-1j8obo0\"></polygon><!>", 1), dn = n("<text> </text>"), fn = n("<path class=\"hit svelte-1j8obo0\" role=\"presentation\"></path>"), pn = n("<!><!>", 1), mn = j("<div class=\"tip svelte-1j8obo0\"><!></div>"), hn = n("<svg role=\"img\"><!><!><!><!></svg><!>", 1), gn = j("<div class=\"radar svelte-1j8obo0\"><!></div>");
function _n(n, i) {
	r(i, !0);
	let d = v(0), f = v(0), p = v(null), _ = x(() => st(i.spec)), S = x(() => i.detail === "full"), w = x(() => m(S) ? 28 : i.detail === "overview" ? 8 : 2), E = x(() => Math.max(8, Math.min(m(d), m(f)) / 2 - m(w))), j = x(() => m(d) / 2), M = x(() => m(f) / 2), N = (e, t) => ({
		x: m(j) + Math.sin(e) * m(E) * t,
		y: m(M) - Math.cos(e) * m(E) * t
	}), P = (e) => m(_).axes.map((t) => N(t.angle, e)).map((e) => `${e.x},${e.y}`).join(" "), F = x(() => m(_).ticks.at(-1) ?? 1);
	function I(e) {
		return m(_).axes.map((t, n) => N(t.angle, e[n] ?? 0)).map((e) => `${e.x},${e.y}`).join(" ");
	}
	function L(e) {
		let t = Math.PI / Math.max(1, m(_).axes.length), n = m(_).axes[e].angle, r = N(n - t, 1.08), i = N(n + t, 1.08);
		return `M${m(j)},${m(M)} L${r.x},${r.y} L${i.x},${i.y} Z`;
	}
	let R = x(() => m(p) === null ? null : mt(i.spec, i.shape, m(p))), z = x(() => m(p) === null ? null : N(m(_).axes[m(p)].angle, .9));
	var B = gn(), ee = h(B), V = (n) => {
		var r = hn(), u = C(r);
		let g;
		var v = h(u);
		y(v, 16, () => m(_).ticks, (e) => e, (e, t) => {
			var n = sn();
			D((e) => b(n, "points", e), [() => P(t / m(F))]), s(e, n);
		});
		var w = T(v);
		y(w, 17, () => m(_).axes, (e) => e.key, (e, t) => {
			let n = x(() => N(m(t).angle, 1));
			var r = cn();
			D(() => {
				b(r, "x1", m(j)), b(r, "y1", m(M)), b(r, "x2", m(n).x), b(r, "y2", m(n).y);
			}), s(e, r);
		});
		var E = T(w);
		y(E, 17, () => m(_).series, e, (t, n) => {
			var r = un(), a = C(r);
			let o;
			var u = T(a), d = (t) => {
				var r = l(), i = C(r);
				y(i, 17, () => m(n).reach, e, (e, t, r) => {
					var i = l(), a = C(i), o = (e) => {
						let i = x(() => N(m(_).axes[r].angle, m(t)));
						var a = ln();
						let o;
						D(() => {
							b(a, "cx", m(i).x), b(a, "cy", m(i).y), b(a, "r", m(p) === r ? 4.5 : 3.5), o = k(a, "", o, { fill: m(n).color });
						}), s(e, a);
					};
					c(a, (e) => {
						m(t) !== null && e(o);
					}), s(e, i);
				}), s(t, r);
			};
			c(u, (e) => {
				i.detail !== "tile" && m(_).series.length <= 2 && e(d);
			}), D((e) => {
				b(a, "points", e), o = k(a, "", o, {
					fill: m(n).color,
					stroke: m(n).color,
					"fill-opacity": m(_).series.length > 1 ? .14 : .24
				});
			}, [() => I(m(n).reach)]), s(t, r);
		});
		var B = T(E), ee = (n) => {
			var r = pn(), i = C(r);
			y(i, 19, () => m(_).axes, (e) => e.key, (e, n, r) => {
				let i = x(() => N(m(n).angle, 1)), o = x(() => Math.sin(m(n).angle)), c = x(() => Math.cos(m(n).angle));
				var l = dn();
				let u;
				var d = h(l, !0);
				t(l), D((e) => {
					b(l, "x", m(i).x + m(o) * 10), b(l, "y", m(i).y - m(c) * 10), b(l, "text-anchor", e), b(l, "dominant-baseline", m(c) > .5 ? "auto" : m(c) < -.5 ? "hanging" : "central"), u = A(l, 0, "name svelte-1j8obo0", null, u, { on: m(p) === m(r) }), a(d, m(n).label);
				}, [() => Math.abs(m(o)) < .2 ? "middle" : m(o) > 0 ? "start" : "end"]), s(e, l);
			});
			var c = T(i);
			y(c, 17, () => m(_).axes, e, (e, t, n) => {
				var r = fn();
				D((e) => b(r, "d", e), [() => L(n)]), o("pointerenter", r, () => O(p, n, !0)), o("pointerleave", r, () => O(p, null)), s(e, r);
			}), s(n, r);
		};
		c(B, (e) => {
			m(S) && e(ee);
		}), t(u);
		var V = T(u), te = (e) => {
			var n = mn();
			let r;
			St(h(n), {
				get readout() {
					return m(R);
				},
				get onevidence() {
					return i.onevidence;
				},
				get glyph() {
					return i.glyph;
				}
			}), t(n), D(() => r = k(n, "", r, {
				left: `${m(z).x}px`,
				top: `${m(z).y}px`
			})), s(e, n);
		};
		c(V, (e) => {
			m(R) && m(z) && e(te);
		}), D(() => {
			b(u, "width", m(d)), b(u, "height", m(f)), b(u, "aria-label", i.summary), g = A(u, 0, "svelte-1j8obo0", null, g, { enter: !i.settled });
		}), s(n, r);
	};
	c(ee, (e) => {
		m(d) && m(f) && m(_).axes.length >= 3 && e(V);
	}), t(B), g(B, "clientWidth", (e) => O(d, e)), g(B, "clientHeight", (e) => O(f, e)), s(n, B), u();
}
// upstream/src/shared/ui/data/Chart/Round.svelte
var vn = n("<path role=\"presentation\"></path>"), yn = n("<path pathLength=\"1\" role=\"presentation\"></path>"), bn = n("<circle class=\"track svelte-bbgwfk\"></circle><!>", 1), xn = n("<text text-anchor=\"middle\" dominant-baseline=\"central\"> </text>"), Sn = n("<text text-anchor=\"middle\" dominant-baseline=\"central\" class=\"total svelte-bbgwfk\"> </text><!>", 1), Cn = j("<div class=\"round svelte-bbgwfk\"><svg role=\"img\" class=\"svelte-bbgwfk\"><g><!><!></g><!></svg> <!></div>");
function wn(e, n) {
	r(n, !0);
	let i = new Ke();
	E(() => i.dispose());
	let l = x(() => n.detail !== "full"), d = x(() => n.detail === "tile"), f = x(() => n.size / 2), p = x(() => Math.max(8, n.size / 2 - 2)), g = Math.PI * 2, _ = x(() => {
		if (n.spec.kind !== "donut" || !n.shape.total) return [];
		let e = m(p) * (m(d) ? .6 : .7), t = n.shape.parts.length > 1 ? .025 : 0, r = m(d) ? 1.5 : 3, i = 0;
		return n.shape.parts.map((a) => {
			let o = a.value / n.shape.total * g, s = i + t / 2, c = i + o - t / 2;
			return i += o, {
				part: a,
				d: Ge(m(f), m(f), e, m(p), s, Math.max(s, c), r),
				corner: r,
				tip: Ue(m(f), m(f), m(p), (s + c) / 2)
			};
		});
	}), v = x(() => n.spec.kind === "radial" ? ot(n.spec, n.shape.parts) : 1), S = x(() => {
		if (n.spec.kind !== "radial") return [];
		let e = Math.max(1, n.shape.parts.length), t = m(p) * (e === 1 ? .72 : .36), r = (m(p) - t) / e, i = Math.max(3, r * (e === 1 ? 1 : .72));
		return n.shape.parts.map((e) => {
			let t = m(p) - e.index * r - i / 2, n = Math.min(1, Math.max(0, e.value / (m(v) || 1)));
			return {
				part: e,
				radius: t,
				thickness: i,
				d: n > 0 ? We(m(f), m(f), t, 0, n * g) : "",
				tip: Ue(m(f), m(f), t, n * g)
			};
		});
	}), w = x(() => i.index === null ? null : mt(n.spec, n.shape, i.index)), O = x(() => i.index === null ? null : (m(_).find((e) => e.part.index === i.index) ?? m(S).find((e) => e.part.index === i.index))?.tip ?? null), j = (e) => m(l) ? void 0 : () => i.show(e), M = x(() => m(l) ? void 0 : () => i.hide());
	var N = Cn();
	let P;
	var F = h(N), I = h(F);
	let L;
	var R = h(I);
	y(R, 17, () => m(_), (e) => e.part.index, (e, t) => {
		var n = vn();
		let r;
		var a = x(() => j(m(t).part.index));
		D(() => {
			b(n, "d", m(t).d), b(n, "fill", m(t).part.color), b(n, "stroke", m(t).part.color), b(n, "stroke-width", m(t).corner * 2), r = A(n, 0, "mark slice svelte-bbgwfk", null, r, { dim: i.index !== null && i.index !== m(t).part.index });
		}), o("pointerenter", n, function(...e) {
			m(a)?.apply(this, e);
		}), o("pointerleave", n, function(...e) {
			m(M)?.apply(this, e);
		}), s(e, n);
	});
	var z = T(R);
	y(z, 17, () => m(S), (e) => e.part.index, (e, t) => {
		var r = bn(), a = C(r), l = T(a), u = (e) => {
			var r = yn();
			let a;
			var c = x(() => j(m(t).part.index));
			D(() => {
				b(r, "d", m(t).d), b(r, "stroke", m(t).part.color), b(r, "stroke-width", m(t).thickness), a = A(r, 0, "mark slice arc svelte-bbgwfk", null, a, {
					draw: !n.settled,
					dim: i.index !== null && i.index !== m(t).part.index
				});
			}), o("pointerenter", r, function(...e) {
				m(c)?.apply(this, e);
			}), o("pointerleave", r, function(...e) {
				m(M)?.apply(this, e);
			}), s(e, r);
		};
		c(l, (e) => {
			m(t).d && e(u);
		}), D(() => {
			b(a, "cx", m(f)), b(a, "cy", m(f)), b(a, "r", m(t).radius), b(a, "stroke-width", m(t).thickness);
		}), s(e, r);
	}), t(I);
	var B = T(I), ee = (e) => {
		var r = Sn(), i = C(r), o = h(i, !0);
		t(i);
		var l = T(i), u = (e) => {
			var r = xn();
			let i;
			var o = h(r, !0);
			t(r), D(() => {
				b(r, "x", m(f)), b(r, "y", m(f) + (n.spec.compact ? 14 : 18)), i = A(r, 0, "caption-text svelte-bbgwfk", null, i, { lead: n.spec.compact }), a(o, n.middle.label);
			}), s(e, r);
		};
		c(l, (e) => {
			n.detail === "full" && e(u);
		}), D(() => {
			b(i, "x", m(f)), b(i, "y", m(f) + (n.detail === "full" ? -2 : 0)), a(o, n.middle.value);
		}), s(e, r);
	};
	c(B, (e) => {
		n.middle && !m(d) && (n.spec.kind === "donut" || n.shape.parts.length === 1) && e(ee);
	}), t(F);
	var V = T(F, 2), te = (e) => {
		wt(e, {
			get readout() {
				return m(w);
			},
			get x() {
				return m(O).x;
			},
			get y() {
				return m(O).y;
			},
			get width() {
				return n.size;
			},
			get hover() {
				return i;
			},
			get onevidence() {
				return n.onevidence;
			},
			get glyph() {
				return n.glyph;
			}
		});
	};
	c(V, (e) => {
		m(w) && m(O) && e(te);
	}), t(N), D(() => {
		P = k(N, "", P, {
			"inline-size": `${n.size}px`,
			"block-size": `${n.size}px`
		}), b(F, "width", n.size), b(F, "height", n.size), b(F, "aria-label", n.summary), L = A(I, 0, "ring svelte-bbgwfk", null, L, { enter: !n.settled && n.spec.kind === "donut" });
	}), s(e, N), u();
}
// upstream/src/shared/ui/data/Chart/Spark.svelte
var Tn = n("<path></path>"), En = n("<path pathLength=\"1\"></path>"), Dn = n("<svg role=\"img\" class=\"svelte-yumr6r\"><!></svg>"), On = j("<span class=\"spark svelte-yumr6r\"><!></span>");
function kn(e, n) {
	r(n, !0);
	let i = v(0), a = v(0), o = x(() => n.spec.x?.kind === "category"), d = x(() => n.shape.rows.map((e) => e.points[0]?.y ?? null)), f = x(() => {
		if (m(o)) return n.shape.domain;
		let e = m(d).filter((e) => e !== null);
		return e.length ? [Math.min(...e), Math.max(...e)] : [0, 1];
	}), p = x(() => Pe(m(f), [m(a) - 2, 2])), _ = x(() => Pe([0, Math.max(1, n.shape.rows.length - 1)], [1, m(i) - 1])), S = x(() => Be(m(d).map((e, t) => e === null ? null : {
		x: m(_)(t),
		y: m(p)(e)
	})).map((e) => ze(e)).join("")), w = x(() => {
		if (!m(o)) return [];
		let e = Fe(n.shape.rows.length, [0, m(i)], .25, .1), t = m(p)(Math.max(m(f)[0], Math.min(0, m(f)[1])));
		return m(d).flatMap((n, r) => {
			if (n === null) return [];
			let i = m(p)(n), a = He(e.start(r), Math.min(i, t), e.width, Math.abs(t - i), Math.min(2, e.width / 2), "end", i <= t ? "up" : "down");
			return a ? [{
				index: r,
				d: a
			}] : [];
		});
	});
	var T = On(), E = h(T), k = (e) => {
		var r = Dn(), u = h(r), d = (e) => {
			var t = l(), r = C(t);
			y(r, 17, () => m(w), (e) => e.index, (e, t) => {
				var r = Tn();
				let i;
				D(() => {
					b(r, "d", m(t).d), b(r, "fill", n.shape.series[0]?.color), i = A(r, 0, "mark bar svelte-yumr6r", null, i, { enter: !n.settled });
				}), s(e, r);
			}), s(e, t);
		}, f = (e) => {
			var t = En();
			let r;
			D(() => {
				b(t, "d", m(S)), b(t, "stroke", n.shape.series[0]?.color), r = A(t, 0, "mark line svelte-yumr6r", null, r, { enter: !n.settled });
			}), s(e, t);
		};
		c(u, (e) => {
			m(o) ? e(d) : e(f, -1);
		}), t(r), D(() => {
			b(r, "width", m(i)), b(r, "height", m(a)), b(r, "aria-label", n.summary);
		}), s(e, r);
	};
	c(E, (e) => {
		m(i) && m(a) && e(k);
	}), t(T), g(T, "clientWidth", (e) => O(i, e)), g(T, "clientHeight", (e) => O(a, e)), s(e, T), u();
}
// upstream/src/shared/ui/data/Chart/Chart.svelte
var An = j("<span class=\"spark-box svelte-13itr0k\"><!></span>"), jn = j("<p class=\"headline svelte-13itr0k\"><span class=\"figure svelte-13itr0k\"> </span><span class=\"what svelte-13itr0k\"> </span></p>"), Mn = j("<div class=\"plot svelte-13itr0k\"><!></div>"), Nn = j("<div><!> <!></div>"), Pn = j("<p role=\"status\" class=\"caption svelte-13itr0k\"> </p>"), Fn = j("<p class=\"caption basis svelte-13itr0k\"> </p>"), In = j("<p class=\"caption svelte-13itr0k\"> </p>"), Ln = j("<button type=\"button\" class=\"copy svelte-13itr0k\"> </button>"), Rn = j("<th scope=\"col\" class=\"svelte-13itr0k\"> </th>"), zn = j("<td class=\"svelte-13itr0k\"> </td>"), Bn = j("<button type=\"button\" class=\"chip svelte-13itr0k\"> </button>"), Vn = j("<td class=\"cites svelte-13itr0k\"></td>"), Hn = j("<tr><th scope=\"row\" class=\"svelte-13itr0k\"> </th><!><!></tr>"), Un = j("<details class=\"svelte-13itr0k\"><summary class=\"svelte-13itr0k\"> </summary> <!> <!> <div class=\"values svelte-13itr0k\"><table class=\"svelte-13itr0k\"><caption class=\"svelte-13itr0k\"> </caption><thead><tr><th scope=\"col\" class=\"svelte-13itr0k\"> </th><!><!></tr></thead><tbody></tbody></table></div></details>"), Wn = j("<figure><!> <!> <!> <!></figure>");
function Gn(n, i) {
	let o = f();
	r(i, !0);
	let d = w(i, "detail", 3, "full"), g = {
		bars: ce,
		stacked: xe,
		line: pe,
		area: Y,
		range: ve,
		donut: ue,
		radial: Z,
		radar: he,
		heat: fe,
		spark: ye
	}, b = v(_(M()));
	S(() => {
		if (m(b)) return;
		let e = setTimeout(() => O(b, !0), N("page") + 240);
		return () => clearTimeout(e);
	});
	let E = x(() => i.spec.kind === "spark"), j = x(() => d() !== "full"), P = x(() => d() === "tile"), I = x(() => !!i.spec.compact || m(E) || m(j)), L = x(() => nt(i.spec, Ce())), z = x(() => pt(i.spec, m(L))), B = x(() => i.spec.series.some((e) => e.points.some((e) => e.y !== null))), V = x(() => i.spec.kind === "donut" || i.spec.kind === "radial"), te = x(() => m(L).horizontal), H = new Intl.NumberFormat(void 0, {
		style: "percent",
		maximumFractionDigits: 0
	}), ne = x(() => m(E) || i.spec.kind === "heat" || m(j) ? [] : m(V) ? i.spec.compact ? [] : m(L).parts.map((e) => ({
		key: `p${e.index}`,
		label: e.label,
		color: e.color,
		share: i.spec.kind === "donut" ? m(L).total ? H.format(e.value / m(L).total) : "" : F(e.points[0], i.spec.y)
	})) : (i.spec.compact ? m(z).legend : dt(i.spec.series.length, !1)) === "rows" ? m(L).series : []), U = x(() => !m(E) && !m(j) && i.spec.values !== !1 && (!i.spec.compact || m(z).legend === "table")), G = x(() => ee(i.spec)), q = x(() => m(G) ? ae({
		low: ie(m(G).low),
		high: ie(m(G).high)
	}) : ""), J = x(() => {
		let e = [i.spec.x?.label, i.spec.y?.label].filter((e) => !!e?.trim()).join("; ");
		return [
			i.title,
			e,
			`${g[i.spec.kind]()}${m(q) ? `; ${m(q)}` : ""}`
		].filter(Boolean).join(". ");
	}), oe = x(() => i.spec.series.some((e) => e.points.some((e) => e.display !== void 0))), se = x(() => i.spec.series.some((e) => e.points.some((e) => e.evidence?.length))), le = x(() => i.spec.headline), de = x(() => m(I) ? 20 : Math.max(24, 10 + i.spec.series.length * 12)), X = x(() => m(P) && i.height ? i.height : i.spec.kind === "heat" ? (m(I) ? 0 : 24) + i.spec.series.length * (m(I) ? Math.max(6, Math.floor(132 / Math.max(1, i.spec.series.length))) : 20) : m(V) ? m(P) ? 150 : d() === "overview" ? 260 : i.spec.compact ? 132 : 188 : i.spec.kind === "radar" ? m(P) ? 150 : d() === "overview" ? 260 : 280 : m(te) ? (m(I) ? 8 : 30) + m(L).rows.length * m(de) : m(P) ? 96 : d() === "overview" ? 200 : i.spec.compact ? 132 : 220), me = x(() => {
		if (i.spec.compact && m(z).lead) return {
			value: m(z).lead.share,
			label: m(z).lead.label
		};
		if (m(le)) return m(le);
		if (i.spec.kind === "radial") {
			let e = m(L).parts[0];
			return e ? {
				value: F(e.points[0], i.spec.y),
				label: e.label
			} : null;
		}
		return {
			value: R(m(L).total, i.spec.y),
			label: ke()
		};
	}), ge = v(!1);
	function _e() {
		navigator.clipboard.writeText(gt(i.spec)).then(() => {
			O(ge, !0), setTimeout(() => O(ge, !1), 1600);
		}, () => O(ge, !1));
	}
	var Q = l(), be = C(Q), Se = (e) => {
		var n = An();
		let r;
		var a = h(n), o = (e) => {
			kn(e, {
				get spec() {
					return i.spec;
				},
				get shape() {
					return m(L);
				},
				get summary() {
					return m(J);
				},
				get settled() {
					return m(b);
				}
			});
		};
		c(a, (e) => {
			m(B) && e(o);
		}), t(n), D(() => r = k(n, "", r, { "block-size": i.height ? `${i.height}px` : void 0 })), s(e, n);
	}, we = (n) => {
		var r = Wn();
		let l;
		var u = h(r), f = (e) => {
			var n = jn(), r = h(n), i = h(r, !0);
			t(r);
			var o = T(r), c = h(o, !0);
			t(o), t(n), D(() => {
				a(i, m(le).value), a(c, m(le).label);
			}), s(e, n);
		};
		c(u, (e) => {
			m(le) && !m(P) && (!m(V) || i.spec.kind === "radial" && m(L).parts.length > 1) && e(f);
		});
		var g = T(u, 2), _ = (e) => {
			var n = Nn();
			let r;
			var a = h(n), l = (e) => {
				var n = Mn();
				let r;
				_n(h(n), {
					get spec() {
						return i.spec;
					},
					get shape() {
						return m(L);
					},
					get detail() {
						return d();
					},
					get summary() {
						return m(J);
					},
					get settled() {
						return m(b);
					},
					get onevidence() {
						return i.onevidence;
					},
					get glyph() {
						return i.glyph;
					}
				}), t(n), D(() => r = k(n, "", r, { "block-size": `${m(X)}px` })), s(e, n);
			}, u = (e) => {
				wn(e, {
					get spec() {
						return i.spec;
					},
					get shape() {
						return m(L);
					},
					get size() {
						return m(X);
					},
					get detail() {
						return d();
					},
					get summary() {
						return m(J);
					},
					get settled() {
						return m(b);
					},
					get middle() {
						return m(me);
					},
					get onevidence() {
						return i.onevidence;
					},
					get glyph() {
						return i.glyph;
					}
				});
			}, f = (e) => {
				on(e, {
					get spec() {
						return i.spec;
					},
					get shape() {
						return m(L);
					},
					get height() {
						return m(X);
					},
					get compact() {
						return m(I);
					},
					get quiet() {
						return m(j);
					},
					get summary() {
						return m(J);
					},
					get settled() {
						return m(b);
					},
					get onevidence() {
						return i.onevidence;
					},
					get glyph() {
						return i.glyph;
					}
				});
			}, p = (e) => {
				Jt(e, {
					get spec() {
						return i.spec;
					},
					get shape() {
						return m(L);
					},
					get labels() {
						return m(z);
					},
					get detail() {
						return d();
					},
					get summary() {
						return m(J);
					},
					get uid() {
						return o;
					},
					get height() {
						return m(X);
					},
					get settled() {
						return m(b);
					},
					get onevidence() {
						return i.onevidence;
					},
					get glyph() {
						return i.glyph;
					}
				});
			};
			c(a, (e) => {
				i.spec.kind === "radar" ? e(l) : m(V) ? e(u, 1) : i.spec.kind === "heat" ? e(f, 2) : e(p, -1);
			});
			var g = T(a, 2), _ = (e) => {
				{
					let t = x(() => m(V) ? "list" : i.spec.compact ? "rows" : "row");
					Qt(e, {
						get entries() {
							return m(ne);
						},
						get layout() {
							return m(t);
						}
					});
				}
			};
			c(g, (e) => {
				m(ne).length && e(_);
			}), t(n), D(() => r = A(n, 1, "body svelte-13itr0k", null, r, { beside: m(V) && m(ne).length })), s(e, n);
		}, v = (e) => {
			var n = Pn(), r = h(n, !0);
			t(n), D((e) => a(r, e), [() => je()]), s(e, n);
		};
		c(g, (e) => {
			m(B) ? e(_) : e(v, -1);
		});
		var S = T(g, 2), C = (e) => {
			var n = Fn(), r = h(n, !0);
			t(n), D(() => a(r, i.spec.basis)), s(e, n);
		}, w = x(() => i.spec.basis?.trim() && !m(j));
		c(S, (e) => {
			m(w) && e(C);
		});
		var E = T(S, 2), O = (n) => {
			var r = Un(), o = h(r), l = h(o, !0);
			t(o);
			var u = T(o, 2), d = (e) => {
				var n = In(), r = h(n, !0);
				t(n), D((e) => a(r, e), [() => Te()]), s(e, n);
			};
			c(u, (e) => {
				m(oe) && e(d);
			});
			var f = T(u, 2), g = (e) => {
				var n = Ln(), r = h(n, !0);
				t(n), D((e) => a(r, e), [() => m(ge) ? re() : W()]), p("click", n, _e), s(e, n);
			};
			c(f, (e) => {
				m(I) || e(g);
			});
			var _ = T(f, 2), v = h(_), b = h(v), x = h(b, !0);
			t(b);
			var S = T(b), C = h(S), w = h(C), E = h(w, !0);
			t(w);
			var O = T(w);
			y(O, 17, () => i.spec.series, e, (e, n) => {
				var r = Rn(), o = h(r, !0);
				t(r), D(() => a(o, m(n).name || i.spec.y?.label || "")), s(e, r);
			});
			var k = T(O), A = (e) => {
				var n = Rn(), r = h(n, !0);
				t(n), D((e) => a(r, e), [() => De()]), s(e, n);
			};
			c(k, (e) => {
				m(se) && e(A);
			}), t(C), t(S);
			var j = T(S);
			y(j, 21, () => m(L).rows, (e) => e.key, (n, r) => {
				var o = Hn(), l = h(o), u = h(l, !0);
				t(l);
				var d = T(l);
				y(d, 17, () => m(r).points, e, (e, n) => {
					var r = zn(), o = h(r, !0);
					t(r), D((e) => a(o, e), [() => F(m(n), i.spec.y)]), s(e, r);
				});
				var f = T(d), g = (n) => {
					var o = Vn();
					y(o, 21, () => m(r).points.flatMap((e) => e?.evidence ?? []), e, (e, n) => {
						var r = Bn(), o = h(r, !0);
						t(r), D(() => {
							r.disabled = !i.onevidence, a(o, m(n).origin || m(n).label);
						}), p("click", r, () => i.onevidence?.(m(n))), s(e, r);
					}), t(o), s(n, o);
				};
				c(f, (e) => {
					m(se) && e(g);
				}), t(o), D(() => a(u, m(r).label)), s(n, o);
			}), t(j), t(v), t(_), t(r), D((e) => {
				a(l, e), a(x, i.title), a(E, i.spec.x?.label ?? "");
			}, [() => m(oe) ? K() : Ne()]), s(n, r);
		};
		c(E, (e) => {
			m(U) && e(O);
		}), t(r), D(() => l = A(r, 1, `chart ${d() ?? ""}`, "svelte-13itr0k", l, {
			compact: i.spec.compact,
			round: m(V),
			radar: i.spec.kind === "radar"
		})), s(n, r);
	};
	c(be, (e) => {
		m(E) ? e(Se) : e(we, -1);
	}), s(n, Q), u();
}
d(["click"]);
export { Gn as default };
