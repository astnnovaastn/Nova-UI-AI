import "./disclose-version-DFvUDwEH.js";
import { $ as e, A as t, B as n, Dt as r, F as i, Ft as a, H as o, J as s, K as c, M as l, N as u, Ot as d, R as f, S as p, U as m, V as h, W as g, _t as _, c as v, dt as y, ft as b, h as x, ht as S, ot as C, pt as w, q as T, r as E, st as D, t as O, ut as k, x as A, yt as j } from "./index-client-C_2wYFnt.js";
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
	#e = _(null);
	get index() {
		return e(this.#e);
	}
	set index(e) {
		S(this.#e, e, !0);
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
var _t = o("<span class=\"name svelte-i8crd8\"> </span>"), vt = o("<span class=\"row svelte-i8crd8\"><span></span> <!> <span> </span></span>"), yt = o("<button type=\"button\" class=\"chip svelte-i8crd8\"><!> <span class=\"host svelte-i8crd8\"> </span></button>"), bt = o("<span class=\"chips svelte-i8crd8\"></span>"), xt = o("<div class=\"chart-tooltip svelte-i8crd8\"><span class=\"label svelte-i8crd8\"> </span> <!> <!></div>");
function St(o, s) {
	d(s, !0);
	let c = E(s, "indicator", 3, "dot");
	var m = xt(), g = k(m), _ = k(g, !0);
	a(g);
	var v = b(g, 2);
	l(v, 17, () => s.readout.rows, u, (t, r) => {
		var o = vt(), s = k(o);
		let l;
		var u = b(s, 2), d = (t) => {
			var i = _t(), o = k(i, !0);
			a(i), C(() => f(o, e(r).name)), n(t, i);
		};
		i(u, (t) => {
			e(r).name && t(d);
		});
		var m = b(u, 2);
		let h;
		var g = k(m, !0);
		a(m), a(o), C(() => {
			p(s, 1, `indicator ${c() ?? ""}`, "svelte-i8crd8"), l = A(s, "", l, { "--indicator": e(r).color }), h = p(m, 1, "value svelte-i8crd8", null, h, { alone: !e(r).name }), f(g, e(r).text);
		}), n(t, o);
	});
	var S = b(v, 2), w = (r) => {
		var o = bt();
		l(o, 21, () => s.readout.evidence, (e) => e.key, (r, o) => {
			var c = yt(), l = k(c), u = (r) => {
				var i = h(), a = y(i);
				t(a, () => s.glyph, () => e(o)), n(r, i);
			};
			i(l, (e) => {
				s.glyph && e(u);
			});
			var d = b(l, 2), p = k(d, !0);
			a(d), a(c), C(() => {
				c.disabled = !s.onevidence, x(c, "title", e(o).label), f(p, e(o).file ? e(o).label : e(o).origin || e(o).label);
			}), T("click", c, () => s.onevidence?.(e(o))), n(r, c);
		}), a(o), n(r, o);
	};
	i(S, (e) => {
		s.readout.evidence.length && e(w);
	}), a(m), C(() => f(_, s.readout.title)), n(o, m), r();
}
c(["click"]);
// upstream/src/shared/ui/data/Chart/Tip.svelte
var Ct = o("<div class=\"tip svelte-1bbc4u3\" role=\"presentation\"><!></div>");
function wt(t, i) {
	d(i, !0);
	let o = E(i, "indicator", 3, "dot"), c = _(0), l = _(0), u = j(() => Math.max(0, Math.min(i.x - e(c) / 2, i.width - e(c)))), f = j(() => i.y - e(l) - 10 >= -8 ? i.y - e(l) - 10 : i.y + 14);
	var p = Ct();
	let m;
	St(k(p), {
		get readout() {
			return i.readout;
		},
		get indicator() {
			return o();
		},
		get onevidence() {
			return i.onevidence;
		},
		get glyph() {
			return i.glyph;
		}
	}), a(p), C(() => m = A(p, "", m, {
		left: `${e(u)}px`,
		top: `${e(f)}px`
	})), s("pointerenter", p, () => i.hover.hold()), s("pointerleave", p, () => i.hover.hide()), v(p, "clientWidth", (e) => S(c, e)), v(p, "clientHeight", (e) => S(l, e)), n(t, p), r();
}
// upstream/src/shared/ui/data/Chart/Cartesian.svelte
var Tt = m("<linearGradient x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0%\"></stop><stop offset=\"100%\" stop-opacity=\"0.02\"></stop></linearGradient>"), Et = m("<defs></defs>"), Dt = m("<line class=\"svelte-ocimr6\"></line>"), Ot = m("<g class=\"grid svelte-ocimr6\" aria-hidden=\"true\"></g>"), kt = m("<line class=\"zero svelte-ocimr6\"></line>"), At = m("<rect class=\"cursor svelte-ocimr6\" rx=\"6\"></rect>"), jt = m("<path></path>"), Mt = m("<circle r=\"3.5\"></circle>"), Nt = m("<!><path pathLength=\"1\"></path><!>", 1), Pt = m("<circle r=\"4.5\" class=\"focus svelte-ocimr6\"></circle>"), Ft = m("<line class=\"cursor-line svelte-ocimr6\"></line><!>", 1), It = m("<!><!>", 1), Lt = m("<text> </text>"), Rt = m("<text class=\"tick svelte-ocimr6\" text-anchor=\"middle\"> </text>"), zt = m("<text class=\"tick svelte-ocimr6\" text-anchor=\"end\" dominant-baseline=\"central\"> </text>"), Bt = m("<g class=\"axis\" aria-hidden=\"true\"></g>"), Vt = m("<text class=\"tick name svelte-ocimr6\" text-anchor=\"end\" dominant-baseline=\"central\"><title> </title> </text>"), Ht = m("<text class=\"tick svelte-ocimr6\" text-anchor=\"start\"> </text>"), Ut = m("<text class=\"tick svelte-ocimr6\" text-anchor=\"end\"> </text>"), Wt = m("<text class=\"value end svelte-ocimr6\" dominant-baseline=\"central\" text-anchor=\"start\"> </text>"), Gt = m("<g class=\"axis\" aria-hidden=\"true\"><!><!></g><!>", 1), Kt = m("<svg role=\"img\"><!><!><!><!><!><!><!></svg><!>", 1), qt = o("<div class=\"cartesian svelte-ocimr6\"><!></div>");
function Jt(t, o) {
	d(o, !0);
	let c = 6.5, m = _(0), g = new Ke();
	O(() => g.dispose());
	let w = j(() => o.detail !== "full"), E = j(() => o.detail === "tile"), D = j(() => !!o.spec.compact || e(w)), M = j(() => o.spec.kind === "line" || o.spec.kind === "area"), N = j(() => o.shape.horizontal), P = j(() => o.shape.scale === "band"), R = j(() => o.shape.layout === "stack"), z = j(() => !e(w) && (o.spec.compact ? o.labels.values : (o.spec.kind === "bars" || o.spec.kind === "range") && o.spec.series.length === 1 && o.shape.rows.length <= 12)), B = j(() => !e(D) && !e(z)), ee = j(() => o.spec.kind === "line" && !e(E) && o.shape.rows.length <= 16 && o.spec.series.length <= 3), V = (e, t) => o.spec.compact ? ct(e.points[t], o.spec.y) : F(e.points[t], o.spec.y), te = j(() => Math.max(24, ...o.shape.ticks.map((e) => I(e, o.spec.y).length * c + 10))), H = j(() => Math.min(200, Math.max(...o.shape.rows.map((e) => e.label.length * c), 0) + 12)), ne = j(() => Math.max(24, ...o.shape.rows.flatMap((e) => e.points.map((t, n) => V(e, n).length * c + 12)))), re = j(() => {
		if (e(E)) return {
			top: 2,
			right: 2,
			bottom: 2,
			left: 2
		};
		if (e(N)) return {
			top: 4,
			right: e(z) || o.labels.values ? e(ne) : 8,
			bottom: e(B) ? 22 : 4,
			left: e(w) ? 4 : e(H)
		};
		let t = o.spec.compact && !e(w) && (o.labels.categories || !!o.labels.ends);
		return {
			top: e(z) || o.spec.compact && o.labels.values && !e(w) ? 20 : 8,
			right: o.spec.compact && o.labels.ends && !e(w) ? 36 : e(M) ? 14 : 4,
			bottom: e(w) ? 4 : o.spec.compact ? t ? 18 : 4 : 24,
			left: e(B) ? e(te) : e(M) ? 14 : 0
		};
	}), U = j(() => e(re).left), W = j(() => Math.max(e(U) + 1, e(m) - e(re).right)), G = j(() => e(re).top), K = j(() => Math.max(e(G) + 1, o.height - e(re).bottom)), q = j(() => e(N) ? Pe(o.shape.domain, [e(U), e(W)]) : Pe(o.shape.domain, [e(K), e(G)])), ie = j(() => e(q)(Math.max(o.shape.domain[0], Math.min(0, o.shape.domain[1])))), J = j(() => Fe(o.shape.rows.length, e(N) ? [e(G), e(K)] : [e(U), e(W)], e(E) ? .2 : .28, .1)), ae = j(() => {
		let e = o.shape.rows.map((e) => e.at);
		return [Math.min(...e), Math.max(...e)];
	}), oe = j(() => o.shape.scale === "index" ? Pe([0, Math.max(1, o.shape.rows.length - 1)], [e(U), e(W)]) : Pe(e(ae), [e(U), e(W)]));
	function Y(t) {
		return e(P) ? e(J).start(t.index) + e(J).width / 2 : o.shape.rows.length === 1 ? (e(U) + e(W)) / 2 : e(oe)(t.at);
	}
	let se = j(() => {
		let t = ce();
		return Math.max(2, Math.min(e(E) ? 3 : 6, t / 2));
	});
	function ce() {
		return e(R) || o.spec.series.length === 1 ? e(J).width : Fe(o.spec.series.length, [0, e(J).width], .14, 0).width;
	}
	let le = j(() => {
		if (e(M)) return [];
		let t = [], n = Fe(o.spec.series.length, [0, e(J).width], .14, 0);
		return o.spec.series.forEach((r, i) => {
			o.shape.rows.forEach((r) => {
				let a = r.points[i];
				if (!a || a.y === null) return;
				let s, c, l = "end";
				if (e(R)) {
					if ([s, c] = o.shape.stacks[i][r.index], s === c) return;
					let e = c >= s;
					o.shape.stacks.slice(i + 1).some((t) => {
						let [n, i] = t[r.index];
						return n !== i && i >= n === e;
					}) && (l = "none");
				} else o.spec.kind === "range" ? (s = a.y, c = a.y2 ?? a.y, l = "all") : (s = Math.max(o.shape.domain[0], Math.min(0, o.shape.domain[1])), c = a.y);
				let u = e(R) || o.spec.series.length === 1 ? 0 : n.start(i), d = e(R) || o.spec.series.length === 1 ? e(J).width : n.width, f = Math.min(d, e(N) ? 28 : 64), p = e(J).start(r.index) + u + (d - f) / 2, m = e(q)(s), h = e(q)(c), g = Math.min(f, 8);
				if (o.spec.kind === "range" && Math.abs(h - m) < g) {
					let e = (m + h) / 2, t = g / 2 * (h >= m ? 1 : -1);
					[m, h] = [e - t, e + t];
				}
				let _ = e(R) && s !== 0 ? 2 : 0, v, y;
				if (e(N)) {
					let t = h >= m, n = t ? m + _ : h;
					v = He(n, p, (t ? h : m - _) - n, f, e(se), l, t ? "right" : "left"), y = o.spec.kind === "range" ? "center" : t ? "left" : "right";
				} else {
					let t = h <= m, n = t ? h : m + _;
					v = He(p, n, f, (t ? m - _ : h) - n, e(se), l, t ? "up" : "down"), y = o.spec.kind === "range" ? "center" : t ? "bottom" : "top";
				}
				v && t.push({
					key: `${i}:${r.key}`,
					d: v,
					color: o.shape.series[i].color,
					origin: y,
					index: r.index
				});
			});
		}), t;
	}), ue = j(() => e(M) ? o.shape.series.map((t, n) => {
		let r = o.shape.rows.map((t) => {
			let r = t.points[n]?.y;
			return r == null ? null : {
				x: Y(t),
				y: e(q)(e(R) ? o.shape.stacks[n][t.index][1] : r)
			};
		}), i = o.shape.rows.map((t) => e(R) ? {
			x: Y(t),
			y: e(q)(o.shape.stacks[n][t.index][0])
		} : {
			x: Y(t),
			y: e(ie)
		}), a = Be(r.map((e, t) => e ? {
			point: e,
			floor: i[t]
		} : null));
		return {
			key: t.key,
			color: t.color,
			line: a.map((e) => ze(e.map((e) => e.point))).join(""),
			area: a.map((e) => Ve(e.map((e) => e.point), e.map((e) => e.floor))).join(""),
			dots: r
		};
	}) : []), de = j(() => {
		if (e(N)) return o.shape.rows;
		if (o.shape.scale === "index") {
			let e = Math.max(1, Math.ceil(o.shape.rows.length / 8));
			return o.shape.rows.filter((t) => t.index % e === 0);
		}
		let t = Math.max(...o.shape.rows.map((e) => X(e).length * c), 0) + 10, n = Math.max(1, e(W) - e(U)), r = Math.max(1, Math.ceil(o.shape.rows.length * t / n));
		return o.shape.rows.filter((e, t) => t % r === 0);
	}), fe = j(() => new Intl.DateTimeFormat(void 0, e(ae)[1] - e(ae)[0] > 1728e5 ? {
		month: "short",
		day: "numeric"
	} : {
		hour: "numeric",
		minute: "2-digit"
	}));
	function X(t) {
		return o.shape.scale === "time" ? e(fe).format(t.at) : o.shape.scale === "linear" ? L(t.at, "linear") : t.label;
	}
	function pe(e, t) {
		let n = Math.max(3, Math.floor(t / c));
		return e.length > n ? `${e.slice(0, n - 1).trimEnd()}…` : e;
	}
	function me(t, n) {
		let r = t.points[n];
		if (!r || r.y === null) return null;
		let i = r.y2 ?? r.y, a = i >= 0, s = o.spec.series.length > 1 && !e(R), c = Fe(o.spec.series.length, [0, e(J).width], .14, 0), l = s ? c.start(n) + c.width / 2 : e(J).width / 2;
		return e(N) ? {
			x: e(q)(i) + (a ? 6 : -6),
			y: e(J).start(t.index) + l,
			anchor: a ? "start" : "end"
		} : {
			x: e(J).start(t.index) + l,
			y: e(q)(i) + (a ? -7 : 14),
			anchor: "middle"
		};
	}
	let he = j(() => o.shape.rows.findLast((e) => e.points[0] && e.points[0].y !== null));
	function ge(t) {
		let n = t.currentTarget.getBoundingClientRect(), r = e(N) ? t.clientY - n.top : t.clientX - n.left, i;
		if (e(P)) i = Math.floor((r - e(J).start(0) + (e(J).step - e(J).width) / 2) / e(J).step);
		else {
			let e = 0, t = Infinity;
			for (let n of o.shape.rows) {
				let i = Math.abs(Y(n) - r);
				i < t && ([e, t] = [n.index, i]);
			}
			i = e;
		}
		g.show(Math.max(0, Math.min(o.shape.rows.length - 1, i)));
	}
	let Z = j(() => g.index === null ? null : o.shape.rows[g.index] ?? null), _e = j(() => e(Z) ? mt(o.spec, o.shape, e(Z).index) : null), ve = j(() => {
		if (!e(Z)) return null;
		let t = e(Z).points.flatMap((t, n) => !t || t.y === null ? [] : e(R) ? [o.shape.stacks[n][e(Z).index][1]] : [t.y2 ?? t.y]), n = t.length ? Math.max(...t) : 0;
		return e(N) ? {
			x: e(q)(n),
			y: e(J).start(e(Z).index)
		} : {
			x: Y(e(Z)),
			y: Math.min(e(q)(n), e(K)) - (e(M) ? 4 : 0)
		};
	});
	var Q = qt();
	let ye;
	var be = k(Q), xe = (t) => {
		var r = Kt(), c = y(r);
		let d;
		var _ = k(c), v = (t) => {
			var r = Et();
			l(r, 23, () => o.shape.series, (e) => e.key, (t, r, i) => {
				var s = Tt(), c = k(s), l = b(c);
				a(s), C(() => {
					x(s, "id", `${o.uid}-wash-${e(i)}`), x(c, "stop-color", e(r).color), x(c, "stop-opacity", e(E) ? .5 : .36), x(l, "stop-color", e(r).color);
				}), n(t, s);
			}), a(r), n(t, r);
		};
		i(_, (e) => {
			o.spec.kind === "area" && e(v);
		});
		var S = b(_), O = (t) => {
			var r = Ot();
			l(r, 20, () => o.shape.ticks, (e) => e, (t, r) => {
				let a = j(() => Math.round(e(q)(r)) + .5);
				var o = h(), s = y(o), c = (t) => {
					var r = Dt();
					C(() => {
						x(r, "x1", e(a)), x(r, "x2", e(a)), x(r, "y1", e(G)), x(r, "y2", e(K));
					}), n(t, r);
				}, l = (t) => {
					var r = Dt();
					C(() => {
						x(r, "x1", e(U)), x(r, "x2", e(W)), x(r, "y1", e(a)), x(r, "y2", e(a));
					}), n(t, r);
				};
				i(s, (t) => {
					e(N) ? t(c) : t(l, -1);
				}), n(t, o);
			}), a(r), n(t, r);
		};
		i(S, (t) => {
			!e(E) && !(e(N) && e(z)) && t(O);
		});
		var F = b(S), L = (t) => {
			let r = j(() => Math.round(e(ie)) + .5);
			var a = h(), o = y(a), s = (t) => {
				var i = kt();
				C(() => {
					x(i, "x1", e(r)), x(i, "x2", e(r)), x(i, "y1", e(G)), x(i, "y2", e(K));
				}), n(t, i);
			}, c = (t) => {
				var i = kt();
				C(() => {
					x(i, "x1", e(U)), x(i, "x2", e(W)), x(i, "y1", e(r)), x(i, "y2", e(r));
				}), n(t, i);
			};
			i(o, (t) => {
				e(N) ? t(s) : t(c, -1);
			}), n(t, a);
		};
		i(F, (e) => {
			o.shape.domain[0] < 0 && o.shape.domain[1] > 0 && e(L);
		});
		var R = b(F), te = (t) => {
			let r = j(() => e(J).start(e(Z).index) - (e(J).step - e(J).width) / 2);
			var a = h(), o = y(a), s = (t) => {
				var i = At();
				C(() => {
					x(i, "x", e(U)), x(i, "y", e(r)), x(i, "width", e(W) - e(U)), x(i, "height", e(J).step);
				}), n(t, i);
			}, c = (t) => {
				var i = At();
				C(() => {
					x(i, "x", e(r)), x(i, "y", e(G)), x(i, "width", e(J).step), x(i, "height", e(K) - e(G));
				}), n(t, i);
			};
			i(o, (t) => {
				e(N) ? t(s) : t(c, -1);
			}), n(t, a);
		};
		i(R, (t) => {
			e(Z) && e(P) && t(te);
		});
		var ne = b(R), re = (t) => {
			var r = It(), a = y(r);
			l(a, 19, () => e(ue), (e) => e.key, (t, r, a) => {
				var s = Nt(), c = y(s), d = (t) => {
					var i = jt();
					let s;
					C(() => {
						x(i, "d", e(r).area), s = p(i, 0, "mark area svelte-ocimr6", null, s, { enter: !o.settled }), x(i, "fill", `url(#${o.uid}-wash-${e(a)})`);
					}), n(t, i);
				};
				i(c, (e) => {
					o.spec.kind === "area" && e(d);
				});
				var f = b(c);
				let m;
				var g = b(f), _ = (t) => {
					var a = h(), s = y(a);
					l(s, 17, () => e(r).dots, u, (t, a) => {
						var s = h(), c = y(s), l = (t) => {
							var i = Mt();
							let s;
							C(() => {
								x(i, "cx", e(a).x), x(i, "cy", e(a).y), s = p(i, 0, "mark dot svelte-ocimr6", null, s, { enter: !o.settled }), x(i, "fill", e(r).color);
							}), n(t, i);
						};
						i(c, (t) => {
							e(a) && t(l);
						}), n(t, s);
					}), n(t, a);
				};
				i(g, (t) => {
					e(ee) && t(_);
				}), C(() => {
					x(f, "d", e(r).line), m = p(f, 0, "mark line svelte-ocimr6", null, m, { enter: !o.settled }), x(f, "stroke", e(r).color);
				}), n(t, s);
			});
			var s = b(a), c = (t) => {
				let r = j(() => Y(e(Z)));
				var a = Ft(), o = y(a), s = b(o);
				l(s, 17, () => e(ue), (e) => e.key, (t, r) => {
					let a = j(() => e(r).dots[e(Z).index]);
					var o = h(), s = y(o), c = (t) => {
						var i = Pt();
						C(() => {
							x(i, "cx", e(a).x), x(i, "cy", e(a).y), x(i, "fill", e(r).color);
						}), n(t, i);
					};
					i(s, (t) => {
						e(a) && t(c);
					}), n(t, o);
				}), C(() => {
					x(o, "x1", e(r)), x(o, "x2", e(r)), x(o, "y1", e(G)), x(o, "y2", e(K));
				}), n(t, a);
			};
			i(s, (t) => {
				e(Z) && !e(w) && t(c);
			}), n(t, r);
		}, ae = (t) => {
			var r = It(), s = y(r);
			l(s, 17, () => e(le), (e) => e.key, (t, r) => {
				var i = jt();
				let a, s;
				C((t) => {
					x(i, "d", e(r).d), x(i, "fill", e(r).color), a = p(i, 0, "mark bar svelte-ocimr6", null, a, {
						enter: !o.settled,
						dim: e(Z) !== null && e(Z).index !== e(r).index
					}), s = A(i, "", s, t);
				}, [() => ({
					"transform-origin": e(r).origin,
					"animation-delay": o.settled ? void 0 : `${Math.min(e(r).index * 18, 180)}ms`
				})]), n(t, i);
			});
			var c = b(s), u = (t) => {
				var r = h(), s = y(r);
				l(s, 19, () => o.shape.series, (e) => e.key, (t, r, s) => {
					var c = h(), u = y(c);
					l(u, 17, () => o.shape.rows, (e) => e.key, (t, r) => {
						let c = j(() => me(e(r), e(s)));
						var l = h(), u = y(l), d = (t) => {
							var i = Lt();
							let l;
							var u = k(i, !0);
							a(i), C((t) => {
								x(i, "x", e(c).x), x(i, "y", e(c).y), x(i, "text-anchor", e(c).anchor), x(i, "dominant-baseline", e(N) ? "central" : "auto"), l = p(i, 0, "value svelte-ocimr6", null, l, { enter: !o.settled }), f(u, t);
							}, [() => V(e(r), e(s))]), n(t, i);
						};
						i(u, (t) => {
							e(c) && t(d);
						}), n(t, l);
					}), n(t, c);
				}), n(t, r);
			};
			i(c, (t) => {
				e(z) && t(u);
			}), n(t, r);
		};
		i(ne, (t) => {
			e(M) ? t(re) : t(ae, -1);
		});
		var oe = b(ne), se = (t) => {
			var r = Bt();
			l(r, 20, () => o.shape.ticks, (e) => e, (t, r) => {
				var s = h(), c = y(s), l = (t) => {
					var i = Rt(), s = k(i, !0);
					a(i), C((t, n) => {
						x(i, "x", t), x(i, "y", e(K) + 16), f(s, n);
					}, [() => e(q)(r), () => I(r, o.spec.y)]), n(t, i);
				}, u = (t) => {
					var i = zt(), s = k(i, !0);
					a(i), C((t, n) => {
						x(i, "x", e(U) - 8), x(i, "y", t), f(s, n);
					}, [() => e(q)(r), () => I(r, o.spec.y)]), n(t, i);
				};
				i(c, (t) => {
					e(N) ? t(l) : t(u, -1);
				}), n(t, s);
			}), a(r), n(t, r);
		};
		i(oe, (t) => {
			e(B) && t(se);
		});
		var ce = b(oe), fe = (t) => {
			var r = Bt();
			l(r, 21, () => e(de), (e) => e.key, (t, r) => {
				var s = h(), c = y(s), l = (t) => {
					var i = Vt(), o = k(i), s = k(o, !0);
					a(o);
					var c = b(o, 1, !0);
					a(i), C((t, n) => {
						x(i, "x", e(U) - 8), x(i, "y", t), f(s, e(r).label), f(c, n);
					}, [() => e(J).start(e(r).index) + e(J).width / 2, () => pe(e(r).label, e(H) - 12)]), n(t, i);
				}, u = (t) => {
					var i = Lt();
					let s;
					var c = k(i, !0);
					a(i), C((t, n) => {
						s = p(i, 0, "tick svelte-ocimr6", null, s, { on: e(Z)?.index === e(r).index }), x(i, "x", t), x(i, "y", e(K) + 16), x(i, "text-anchor", !e(P) && e(r).index === 0 && o.shape.rows.length > 1 ? "start" : !e(P) && e(r).index === o.shape.rows.length - 1 && o.shape.rows.length > 1 ? "end" : "middle"), f(c, n);
					}, [() => Y(e(r)), () => X(e(r))]), n(t, i);
				};
				i(c, (t) => {
					e(N) ? t(l) : t(u, -1);
				}), n(t, s);
			}), a(r), n(t, r);
		}, Q = (t) => {
			let r = j(() => o.shape.rows[0]), s = j(() => o.shape.rows.at(-1));
			var c = Gt(), l = y(c), u = k(l), d = (t) => {
				var i = Ht(), o = k(i, !0);
				a(i), C((t, n) => {
					x(i, "x", t), x(i, "y", e(K) + 14), f(o, n);
				}, [() => Y(e(r)), () => X(e(r))]), n(t, i);
			};
			i(u, (t) => {
				e(r) && t(d);
			});
			var p = b(u), m = (t) => {
				var r = Ut(), i = k(r, !0);
				a(r), C((t, n) => {
					x(r, "x", t), x(r, "y", e(K) + 14), f(i, n);
				}, [() => Y(e(s)), () => X(e(s))]), n(t, r);
			};
			i(p, (t) => {
				e(s) && e(s) !== e(r) && t(m);
			}), a(l);
			var g = b(l), _ = (t) => {
				let r = j(() => e(ue)[0]?.dots[e(he).index]);
				var s = h(), c = y(s), l = (t) => {
					var i = Wt(), s = k(i, !0);
					a(i), C(() => {
						x(i, "x", e(r).x + 6), x(i, "y", e(r).y), f(s, o.labels.ends.value);
					}), n(t, i);
				};
				i(c, (t) => {
					e(r) && t(l);
				}), n(t, s);
			};
			i(g, (t) => {
				e(he) && t(_);
			}), n(t, c);
		};
		i(ce, (t) => {
			!e(w) && (!e(D) || o.labels.categories) ? t(fe) : !e(w) && o.labels.ends && t(Q, 1);
		}), a(c);
		var ye = b(c), be = (t) => {
			{
				let n = j(() => e(M) ? "line" : "dot");
				wt(t, {
					get readout() {
						return e(_e);
					},
					get x() {
						return e(ve).x;
					},
					get y() {
						return e(ve).y;
					},
					get width() {
						return e(m);
					},
					get hover() {
						return g;
					},
					get indicator() {
						return e(n);
					},
					get onevidence() {
						return o.onevidence;
					},
					get glyph() {
						return o.glyph;
					}
				});
			}
		};
		i(ye, (t) => {
			e(_e) && e(ve) && !e(w) && t(be);
		}), C(() => {
			x(c, "width", e(m)), x(c, "height", o.height), x(c, "aria-label", o.summary), d = p(c, 0, "svelte-ocimr6", null, d, { lying: e(N) });
		}), T("pointermove", c, function(...t) {
			(e(w) ? void 0 : ge)?.apply(this, t);
		}), s("pointerleave", c, function(...t) {
			(e(w) ? void 0 : () => g.hide())?.apply(this, t);
		}), n(t, r);
	};
	i(be, (t) => {
		e(m) && t(xe);
	}), a(Q), C(() => ye = A(Q, "", ye, { "block-size": `${o.height}px` })), v(Q, "clientWidth", (e) => S(m, e)), n(t, Q), r();
}
c(["pointermove"]);
// upstream/src/shared/ui/data/Chart/ChartLegend.svelte
var Yt = o("<span class=\"share svelte-lct99f\"> </span>"), Xt = o("<li class=\"svelte-lct99f\"><span class=\"swatch svelte-lct99f\"></span><span class=\"name svelte-lct99f\"> </span><!></li>"), Zt = o("<ul></ul>");
function Qt(t, r) {
	let o = E(r, "layout", 3, "row");
	var s = Zt();
	l(s, 21, () => r.entries, (e) => e.key, (t, r) => {
		var o = Xt(), s = k(o);
		let c;
		var l = b(s), u = k(l, !0);
		a(l);
		var d = b(l), p = (t) => {
			var i = Yt(), o = k(i, !0);
			a(i), C(() => f(o, e(r).share)), n(t, i);
		};
		i(d, (t) => {
			e(r).share && t(p);
		}), a(o), C(() => {
			c = A(s, "", c, { background: e(r).color }), f(u, e(r).label);
		}), n(t, o);
	}), a(s), C(() => p(s, 1, `chart-legend ${o() ?? ""}`, "svelte-lct99f")), n(t, s);
}
// upstream/src/shared/ui/data/Chart/Heat.svelte
var $t = m("<rect rx=\"2\" role=\"presentation\"></rect>"), en = m("<text class=\"tick svelte-9xl1lm\" text-anchor=\"end\" dominant-baseline=\"central\"> </text>"), tn = m("<text class=\"tick svelte-9xl1lm\" text-anchor=\"middle\"> </text>"), nn = m("<g aria-hidden=\"true\"><!><!></g>"), rn = m("<svg role=\"img\" class=\"svelte-9xl1lm\"><!><!></svg><!>", 1), an = o("<div class=\"heat svelte-9xl1lm\"><!></div>");
function on(t, o) {
	d(o, !0);
	let c = 6.5, m = _(0), g = new Ke();
	O(() => g.dispose());
	let w = j(() => o.compact ? 0 : Math.max(...o.spec.series.map((e) => e.name.length * c), 0) + 14), T = j(() => o.height - (o.compact ? 0 : 20)), E = j(() => Fe(o.shape.keys.length, [e(w), Math.max(e(w) + 1, e(m))], .08, 0)), D = j(() => Fe(o.spec.series.length, [o.compact ? 0 : 4, e(T)], .1, 0)), M = (e) => e === null ? "var(--color-fill)" : `color-mix(in oklab, var(--color-lit) ${Math.round(6 + e * 94)}%, var(--color-surface))`, N = j(() => Math.max(1, Math.ceil(o.shape.rows.length * (Math.max(...o.shape.rows.map((e) => e.label.length), 0) * c + 8) / Math.max(1, e(m) - e(w))))), P = j(() => g.index === null ? null : mt(o.spec, o.shape, g.index)), F = j(() => {
		let t = g.index === null ? null : o.shape.cells[g.index];
		if (!t) return null;
		let n = o.shape.keys.indexOf(t.key);
		return {
			x: e(E).start(n) + e(E).width / 2,
			y: e(D).start(Number(t.order))
		};
	});
	var I = an();
	let L;
	var R = k(I), z = (t) => {
		var r = rn(), c = y(r), d = k(c);
		l(d, 17, () => o.shape.cells, (e) => e.index, (t, r) => {
			var i = $t();
			let a;
			C((t, n, s) => {
				x(i, "x", t), x(i, "y", n), x(i, "width", e(E).width), x(i, "height", e(D).width), x(i, "fill", s), a = p(i, 0, "mark cell svelte-9xl1lm", null, a, {
					enter: !o.settled,
					on: g.index === e(r).index
				});
			}, [
				() => e(E).start(o.shape.keys.indexOf(e(r).key)),
				() => e(D).start(Number(e(r).order)),
				() => M(e(r).tone)
			]), s("pointerenter", i, function(...t) {
				(o.quiet ? void 0 : () => g.show(e(r).index))?.apply(this, t);
			}), s("pointerleave", i, function(...e) {
				(o.quiet ? void 0 : () => g.hide())?.apply(this, e);
			}), n(t, i);
		});
		var _ = b(d), v = (t) => {
			var r = nn(), s = k(r);
			l(s, 17, () => o.spec.series, u, (t, r, i) => {
				var o = en(), s = k(o, !0);
				a(o), C((t) => {
					x(o, "x", e(w) - 8), x(o, "y", t), f(s, e(r).name);
				}, [() => e(D).start(i) + e(D).width / 2]), n(t, o);
			});
			var c = b(s);
			l(c, 17, () => o.shape.rows, (e) => e.key, (t, r) => {
				var s = h(), c = y(s), l = (t) => {
					var i = tn(), s = k(i, !0);
					a(i), C((t) => {
						x(i, "x", t), x(i, "y", o.height - 4), f(s, e(r).label);
					}, [() => e(E).start(e(r).index) + e(E).width / 2]), n(t, i);
				};
				i(c, (t) => {
					e(r).index % e(N) === 0 && t(l);
				}), n(t, s);
			}), a(r), n(t, r);
		};
		i(_, (e) => {
			o.compact || e(v);
		}), a(c);
		var S = b(c), T = (t) => {
			wt(t, {
				get readout() {
					return e(P);
				},
				get x() {
					return e(F).x;
				},
				get y() {
					return e(F).y;
				},
				get width() {
					return e(m);
				},
				get hover() {
					return g;
				},
				get onevidence() {
					return o.onevidence;
				},
				get glyph() {
					return o.glyph;
				}
			});
		};
		i(S, (t) => {
			e(P) && e(F) && !o.quiet && t(T);
		}), C(() => {
			x(c, "width", e(m)), x(c, "height", o.height), x(c, "aria-label", o.summary);
		}), n(t, r);
	};
	i(R, (t) => {
		e(m) && t(z);
	}), a(I), C(() => L = A(I, "", L, { "block-size": `${o.height}px` })), v(I, "clientWidth", (e) => S(m, e)), n(t, I), r();
}
// upstream/src/shared/ui/data/Chart/Radar.svelte
var sn = m("<polygon class=\"grid svelte-1j8obo0\"></polygon>"), cn = m("<line class=\"grid svelte-1j8obo0\"></line>"), ln = m("<circle class=\"mark dot svelte-1j8obo0\"></circle>"), un = m("<polygon class=\"mark web svelte-1j8obo0\"></polygon><!>", 1), dn = m("<text> </text>"), fn = m("<path class=\"hit svelte-1j8obo0\" role=\"presentation\"></path>"), pn = m("<!><!>", 1), mn = o("<div class=\"tip svelte-1j8obo0\"><!></div>"), hn = m("<svg role=\"img\"><!><!><!><!></svg><!>", 1), gn = o("<div class=\"radar svelte-1j8obo0\"><!></div>");
function _n(t, o) {
	d(o, !0);
	let c = _(0), m = _(0), g = _(null), w = j(() => st(o.spec)), T = j(() => o.detail === "full"), E = j(() => e(T) ? 28 : o.detail === "overview" ? 8 : 2), D = j(() => Math.max(8, Math.min(e(c), e(m)) / 2 - e(E))), O = j(() => e(c) / 2), M = j(() => e(m) / 2), N = (t, n) => ({
		x: e(O) + Math.sin(t) * e(D) * n,
		y: e(M) - Math.cos(t) * e(D) * n
	}), P = (t) => e(w).axes.map((e) => N(e.angle, t)).map((e) => `${e.x},${e.y}`).join(" "), F = j(() => e(w).ticks.at(-1) ?? 1);
	function I(t) {
		return e(w).axes.map((e, n) => N(e.angle, t[n] ?? 0)).map((e) => `${e.x},${e.y}`).join(" ");
	}
	function L(t) {
		let n = Math.PI / Math.max(1, e(w).axes.length), r = e(w).axes[t].angle, i = N(r - n, 1.08), a = N(r + n, 1.08);
		return `M${e(O)},${e(M)} L${i.x},${i.y} L${a.x},${a.y} Z`;
	}
	let R = j(() => e(g) === null ? null : mt(o.spec, o.shape, e(g))), z = j(() => e(g) === null ? null : N(e(w).axes[e(g)].angle, .9));
	var B = gn(), ee = k(B), V = (t) => {
		var r = hn(), d = y(r);
		let _;
		var v = k(d);
		l(v, 16, () => e(w).ticks, (e) => e, (t, r) => {
			var i = sn();
			C((e) => x(i, "points", e), [() => P(r / e(F))]), n(t, i);
		});
		var E = b(v);
		l(E, 17, () => e(w).axes, (e) => e.key, (t, r) => {
			let i = j(() => N(e(r).angle, 1));
			var a = cn();
			C(() => {
				x(a, "x1", e(O)), x(a, "y1", e(M)), x(a, "x2", e(i).x), x(a, "y2", e(i).y);
			}), n(t, a);
		});
		var D = b(E);
		l(D, 17, () => e(w).series, u, (t, r) => {
			var a = un(), s = y(a);
			let c;
			var d = b(s), f = (t) => {
				var a = h(), o = y(a);
				l(o, 17, () => e(r).reach, u, (t, a, o) => {
					var s = h(), c = y(s), l = (t) => {
						let i = j(() => N(e(w).axes[o].angle, e(a)));
						var s = ln();
						let c;
						C(() => {
							x(s, "cx", e(i).x), x(s, "cy", e(i).y), x(s, "r", e(g) === o ? 4.5 : 3.5), c = A(s, "", c, { fill: e(r).color });
						}), n(t, s);
					};
					i(c, (t) => {
						e(a) !== null && t(l);
					}), n(t, s);
				}), n(t, a);
			};
			i(d, (t) => {
				o.detail !== "tile" && e(w).series.length <= 2 && t(f);
			}), C((t) => {
				x(s, "points", t), c = A(s, "", c, {
					fill: e(r).color,
					stroke: e(r).color,
					"fill-opacity": e(w).series.length > 1 ? .14 : .24
				});
			}, [() => I(e(r).reach)]), n(t, a);
		});
		var B = b(D), ee = (t) => {
			var r = pn(), i = y(r);
			l(i, 19, () => e(w).axes, (e) => e.key, (t, r, i) => {
				let o = j(() => N(e(r).angle, 1)), s = j(() => Math.sin(e(r).angle)), c = j(() => Math.cos(e(r).angle));
				var l = dn();
				let u;
				var d = k(l, !0);
				a(l), C((t) => {
					x(l, "x", e(o).x + e(s) * 10), x(l, "y", e(o).y - e(c) * 10), x(l, "text-anchor", t), x(l, "dominant-baseline", e(c) > .5 ? "auto" : e(c) < -.5 ? "hanging" : "central"), u = p(l, 0, "name svelte-1j8obo0", null, u, { on: e(g) === e(i) }), f(d, e(r).label);
				}, [() => Math.abs(e(s)) < .2 ? "middle" : e(s) > 0 ? "start" : "end"]), n(t, l);
			});
			var o = b(i);
			l(o, 17, () => e(w).axes, u, (e, t, r) => {
				var i = fn();
				C((e) => x(i, "d", e), [() => L(r)]), s("pointerenter", i, () => S(g, r, !0)), s("pointerleave", i, () => S(g, null)), n(e, i);
			}), n(t, r);
		};
		i(B, (t) => {
			e(T) && t(ee);
		}), a(d);
		var V = b(d), te = (t) => {
			var r = mn();
			let i;
			St(k(r), {
				get readout() {
					return e(R);
				},
				get onevidence() {
					return o.onevidence;
				},
				get glyph() {
					return o.glyph;
				}
			}), a(r), C(() => i = A(r, "", i, {
				left: `${e(z).x}px`,
				top: `${e(z).y}px`
			})), n(t, r);
		};
		i(V, (t) => {
			e(R) && e(z) && t(te);
		}), C(() => {
			x(d, "width", e(c)), x(d, "height", e(m)), x(d, "aria-label", o.summary), _ = p(d, 0, "svelte-1j8obo0", null, _, { enter: !o.settled });
		}), n(t, r);
	};
	i(ee, (t) => {
		e(c) && e(m) && e(w).axes.length >= 3 && t(V);
	}), a(B), v(B, "clientWidth", (e) => S(c, e)), v(B, "clientHeight", (e) => S(m, e)), n(t, B), r();
}
// upstream/src/shared/ui/data/Chart/Round.svelte
var vn = m("<path role=\"presentation\"></path>"), yn = m("<path pathLength=\"1\" role=\"presentation\"></path>"), bn = m("<circle class=\"track svelte-bbgwfk\"></circle><!>", 1), xn = m("<text text-anchor=\"middle\" dominant-baseline=\"central\"> </text>"), Sn = m("<text text-anchor=\"middle\" dominant-baseline=\"central\" class=\"total svelte-bbgwfk\"> </text><!>", 1), Cn = o("<div class=\"round svelte-bbgwfk\"><svg role=\"img\" class=\"svelte-bbgwfk\"><g><!><!></g><!></svg> <!></div>");
function wn(t, o) {
	d(o, !0);
	let c = new Ke();
	O(() => c.dispose());
	let u = j(() => o.detail !== "full"), m = j(() => o.detail === "tile"), h = j(() => o.size / 2), g = j(() => Math.max(8, o.size / 2 - 2)), _ = Math.PI * 2, v = j(() => {
		if (o.spec.kind !== "donut" || !o.shape.total) return [];
		let t = e(g) * (e(m) ? .6 : .7), n = o.shape.parts.length > 1 ? .025 : 0, r = e(m) ? 1.5 : 3, i = 0;
		return o.shape.parts.map((a) => {
			let s = a.value / o.shape.total * _, c = i + n / 2, l = i + s - n / 2;
			return i += s, {
				part: a,
				d: Ge(e(h), e(h), t, e(g), c, Math.max(c, l), r),
				corner: r,
				tip: Ue(e(h), e(h), e(g), (c + l) / 2)
			};
		});
	}), S = j(() => o.spec.kind === "radial" ? ot(o.spec, o.shape.parts) : 1), w = j(() => {
		if (o.spec.kind !== "radial") return [];
		let t = Math.max(1, o.shape.parts.length), n = e(g) * (t === 1 ? .72 : .36), r = (e(g) - n) / t, i = Math.max(3, r * (t === 1 ? 1 : .72));
		return o.shape.parts.map((t) => {
			let n = e(g) - t.index * r - i / 2, a = Math.min(1, Math.max(0, t.value / (e(S) || 1)));
			return {
				part: t,
				radius: n,
				thickness: i,
				d: a > 0 ? We(e(h), e(h), n, 0, a * _) : "",
				tip: Ue(e(h), e(h), n, a * _)
			};
		});
	}), T = j(() => c.index === null ? null : mt(o.spec, o.shape, c.index)), E = j(() => c.index === null ? null : (e(v).find((e) => e.part.index === c.index) ?? e(w).find((e) => e.part.index === c.index))?.tip ?? null), D = (t) => e(u) ? void 0 : () => c.show(t), M = j(() => e(u) ? void 0 : () => c.hide());
	var N = Cn();
	let P;
	var F = k(N), I = k(F);
	let L;
	var R = k(I);
	l(R, 17, () => e(v), (e) => e.part.index, (t, r) => {
		var i = vn();
		let a;
		var o = j(() => D(e(r).part.index));
		C(() => {
			x(i, "d", e(r).d), x(i, "fill", e(r).part.color), x(i, "stroke", e(r).part.color), x(i, "stroke-width", e(r).corner * 2), a = p(i, 0, "mark slice svelte-bbgwfk", null, a, { dim: c.index !== null && c.index !== e(r).part.index });
		}), s("pointerenter", i, function(...t) {
			e(o)?.apply(this, t);
		}), s("pointerleave", i, function(...t) {
			e(M)?.apply(this, t);
		}), n(t, i);
	});
	var z = b(R);
	l(z, 17, () => e(w), (e) => e.part.index, (t, r) => {
		var a = bn(), l = y(a), u = b(l), d = (t) => {
			var i = yn();
			let a;
			var l = j(() => D(e(r).part.index));
			C(() => {
				x(i, "d", e(r).d), x(i, "stroke", e(r).part.color), x(i, "stroke-width", e(r).thickness), a = p(i, 0, "mark slice arc svelte-bbgwfk", null, a, {
					draw: !o.settled,
					dim: c.index !== null && c.index !== e(r).part.index
				});
			}), s("pointerenter", i, function(...t) {
				e(l)?.apply(this, t);
			}), s("pointerleave", i, function(...t) {
				e(M)?.apply(this, t);
			}), n(t, i);
		};
		i(u, (t) => {
			e(r).d && t(d);
		}), C(() => {
			x(l, "cx", e(h)), x(l, "cy", e(h)), x(l, "r", e(r).radius), x(l, "stroke-width", e(r).thickness);
		}), n(t, a);
	}), a(I);
	var B = b(I), ee = (t) => {
		var r = Sn(), s = y(r), c = k(s, !0);
		a(s);
		var l = b(s), u = (t) => {
			var r = xn();
			let i;
			var s = k(r, !0);
			a(r), C(() => {
				x(r, "x", e(h)), x(r, "y", e(h) + (o.spec.compact ? 14 : 18)), i = p(r, 0, "caption-text svelte-bbgwfk", null, i, { lead: o.spec.compact }), f(s, o.middle.label);
			}), n(t, r);
		};
		i(l, (e) => {
			o.detail === "full" && e(u);
		}), C(() => {
			x(s, "x", e(h)), x(s, "y", e(h) + (o.detail === "full" ? -2 : 0)), f(c, o.middle.value);
		}), n(t, r);
	};
	i(B, (t) => {
		o.middle && !e(m) && (o.spec.kind === "donut" || o.shape.parts.length === 1) && t(ee);
	}), a(F);
	var V = b(F, 2), te = (t) => {
		wt(t, {
			get readout() {
				return e(T);
			},
			get x() {
				return e(E).x;
			},
			get y() {
				return e(E).y;
			},
			get width() {
				return o.size;
			},
			get hover() {
				return c;
			},
			get onevidence() {
				return o.onevidence;
			},
			get glyph() {
				return o.glyph;
			}
		});
	};
	i(V, (t) => {
		e(T) && e(E) && t(te);
	}), a(N), C(() => {
		P = A(N, "", P, {
			"inline-size": `${o.size}px`,
			"block-size": `${o.size}px`
		}), x(F, "width", o.size), x(F, "height", o.size), x(F, "aria-label", o.summary), L = p(I, 0, "ring svelte-bbgwfk", null, L, { enter: !o.settled && o.spec.kind === "donut" });
	}), n(t, N), r();
}
// upstream/src/shared/ui/data/Chart/Spark.svelte
var Tn = m("<path></path>"), En = m("<path pathLength=\"1\"></path>"), Dn = m("<svg role=\"img\" class=\"svelte-yumr6r\"><!></svg>"), On = o("<span class=\"spark svelte-yumr6r\"><!></span>");
function kn(t, o) {
	d(o, !0);
	let s = _(0), c = _(0), u = j(() => o.spec.x?.kind === "category"), f = j(() => o.shape.rows.map((e) => e.points[0]?.y ?? null)), m = j(() => {
		if (e(u)) return o.shape.domain;
		let t = e(f).filter((e) => e !== null);
		return t.length ? [Math.min(...t), Math.max(...t)] : [0, 1];
	}), g = j(() => Pe(e(m), [e(c) - 2, 2])), b = j(() => Pe([0, Math.max(1, o.shape.rows.length - 1)], [1, e(s) - 1])), w = j(() => Be(e(f).map((t, n) => t === null ? null : {
		x: e(b)(n),
		y: e(g)(t)
	})).map((e) => ze(e)).join("")), T = j(() => {
		if (!e(u)) return [];
		let t = Fe(o.shape.rows.length, [0, e(s)], .25, .1), n = e(g)(Math.max(e(m)[0], Math.min(0, e(m)[1])));
		return e(f).flatMap((r, i) => {
			if (r === null) return [];
			let a = e(g)(r), o = He(t.start(i), Math.min(a, n), t.width, Math.abs(n - a), Math.min(2, t.width / 2), "end", a <= n ? "up" : "down");
			return o ? [{
				index: i,
				d: o
			}] : [];
		});
	});
	var E = On(), D = k(E), O = (t) => {
		var r = Dn(), d = k(r), f = (t) => {
			var r = h(), i = y(r);
			l(i, 17, () => e(T), (e) => e.index, (t, r) => {
				var i = Tn();
				let a;
				C(() => {
					x(i, "d", e(r).d), x(i, "fill", o.shape.series[0]?.color), a = p(i, 0, "mark bar svelte-yumr6r", null, a, { enter: !o.settled });
				}), n(t, i);
			}), n(t, r);
		}, m = (t) => {
			var r = En();
			let i;
			C(() => {
				x(r, "d", e(w)), x(r, "stroke", o.shape.series[0]?.color), i = p(r, 0, "mark line svelte-yumr6r", null, i, { enter: !o.settled });
			}), n(t, r);
		};
		i(d, (t) => {
			e(u) ? t(f) : t(m, -1);
		}), a(r), C(() => {
			x(r, "width", e(s)), x(r, "height", e(c)), x(r, "aria-label", o.summary);
		}), n(t, r);
	};
	i(D, (t) => {
		e(s) && e(c) && t(O);
	}), a(E), v(E, "clientWidth", (e) => S(s, e)), v(E, "clientHeight", (e) => S(c, e)), n(t, E), r();
}
// upstream/src/shared/ui/data/Chart/Chart.svelte
var An = o("<span class=\"spark-box svelte-13itr0k\"><!></span>"), jn = o("<p class=\"headline svelte-13itr0k\"><span class=\"figure svelte-13itr0k\"> </span><span class=\"what svelte-13itr0k\"> </span></p>"), Mn = o("<div class=\"plot svelte-13itr0k\"><!></div>"), Nn = o("<div><!> <!></div>"), Pn = o("<p role=\"status\" class=\"caption svelte-13itr0k\"> </p>"), Fn = o("<p class=\"caption basis svelte-13itr0k\"> </p>"), In = o("<p class=\"caption svelte-13itr0k\"> </p>"), Ln = o("<button type=\"button\" class=\"copy svelte-13itr0k\"> </button>"), Rn = o("<th scope=\"col\" class=\"svelte-13itr0k\"> </th>"), zn = o("<td class=\"svelte-13itr0k\"> </td>"), Bn = o("<button type=\"button\" class=\"chip svelte-13itr0k\"> </button>"), Vn = o("<td class=\"cites svelte-13itr0k\"></td>"), Hn = o("<tr><th scope=\"row\" class=\"svelte-13itr0k\"> </th><!><!></tr>"), Un = o("<details class=\"svelte-13itr0k\"><summary class=\"svelte-13itr0k\"> </summary> <!> <!> <div class=\"values svelte-13itr0k\"><table class=\"svelte-13itr0k\"><caption class=\"svelte-13itr0k\"> </caption><thead><tr><th scope=\"col\" class=\"svelte-13itr0k\"> </th><!><!></tr></thead><tbody></tbody></table></div></details>"), Wn = o("<figure><!> <!> <!> <!></figure>");
function Gn(t, o) {
	let s = g();
	d(o, !0);
	let c = E(o, "detail", 3, "full"), m = {
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
	}, v = _(w(M()));
	D(() => {
		if (e(v)) return;
		let t = setTimeout(() => S(v, !0), N("page") + 240);
		return () => clearTimeout(t);
	});
	let x = j(() => o.spec.kind === "spark"), O = j(() => c() !== "full"), P = j(() => c() === "tile"), I = j(() => !!o.spec.compact || e(x) || e(O)), L = j(() => nt(o.spec, Ce())), z = j(() => pt(o.spec, e(L))), B = j(() => o.spec.series.some((e) => e.points.some((e) => e.y !== null))), V = j(() => o.spec.kind === "donut" || o.spec.kind === "radial"), te = j(() => e(L).horizontal), H = new Intl.NumberFormat(void 0, {
		style: "percent",
		maximumFractionDigits: 0
	}), ne = j(() => e(x) || o.spec.kind === "heat" || e(O) ? [] : e(V) ? o.spec.compact ? [] : e(L).parts.map((t) => ({
		key: `p${t.index}`,
		label: t.label,
		color: t.color,
		share: o.spec.kind === "donut" ? e(L).total ? H.format(t.value / e(L).total) : "" : F(t.points[0], o.spec.y)
	})) : (o.spec.compact ? e(z).legend : dt(o.spec.series.length, !1)) === "rows" ? e(L).series : []), U = j(() => !e(x) && !e(O) && o.spec.values !== !1 && (!o.spec.compact || e(z).legend === "table")), G = j(() => ee(o.spec)), q = j(() => e(G) ? ae({
		low: ie(e(G).low),
		high: ie(e(G).high)
	}) : ""), J = j(() => {
		let t = [o.spec.x?.label, o.spec.y?.label].filter((e) => !!e?.trim()).join("; ");
		return [
			o.title,
			t,
			`${m[o.spec.kind]()}${e(q) ? `; ${e(q)}` : ""}`
		].filter(Boolean).join(". ");
	}), oe = j(() => o.spec.series.some((e) => e.points.some((e) => e.display !== void 0))), se = j(() => o.spec.series.some((e) => e.points.some((e) => e.evidence?.length))), le = j(() => o.spec.headline), de = j(() => e(I) ? 20 : Math.max(24, 10 + o.spec.series.length * 12)), X = j(() => e(P) && o.height ? o.height : o.spec.kind === "heat" ? (e(I) ? 0 : 24) + o.spec.series.length * (e(I) ? Math.max(6, Math.floor(132 / Math.max(1, o.spec.series.length))) : 20) : e(V) ? e(P) ? 150 : c() === "overview" ? 260 : o.spec.compact ? 132 : 188 : o.spec.kind === "radar" ? e(P) ? 150 : c() === "overview" ? 260 : 280 : e(te) ? (e(I) ? 8 : 30) + e(L).rows.length * e(de) : e(P) ? 96 : c() === "overview" ? 200 : o.spec.compact ? 132 : 220), me = j(() => {
		if (o.spec.compact && e(z).lead) return {
			value: e(z).lead.share,
			label: e(z).lead.label
		};
		if (e(le)) return e(le);
		if (o.spec.kind === "radial") {
			let t = e(L).parts[0];
			return t ? {
				value: F(t.points[0], o.spec.y),
				label: t.label
			} : null;
		}
		return {
			value: R(e(L).total, o.spec.y),
			label: ke()
		};
	}), ge = _(!1);
	function _e() {
		navigator.clipboard.writeText(gt(o.spec)).then(() => {
			S(ge, !0), setTimeout(() => S(ge, !1), 1600);
		}, () => S(ge, !1));
	}
	var Q = h(), be = y(Q), Se = (t) => {
		var r = An();
		let s;
		var c = k(r), l = (t) => {
			kn(t, {
				get spec() {
					return o.spec;
				},
				get shape() {
					return e(L);
				},
				get summary() {
					return e(J);
				},
				get settled() {
					return e(v);
				}
			});
		};
		i(c, (t) => {
			e(B) && t(l);
		}), a(r), C(() => s = A(r, "", s, { "block-size": o.height ? `${o.height}px` : void 0 })), n(t, r);
	}, we = (t) => {
		var r = Wn();
		let d;
		var m = k(r), h = (t) => {
			var r = jn(), i = k(r), o = k(i, !0);
			a(i);
			var s = b(i), c = k(s, !0);
			a(s), a(r), C(() => {
				f(o, e(le).value), f(c, e(le).label);
			}), n(t, r);
		};
		i(m, (t) => {
			e(le) && !e(P) && (!e(V) || o.spec.kind === "radial" && e(L).parts.length > 1) && t(h);
		});
		var g = b(m, 2), _ = (t) => {
			var r = Nn();
			let l;
			var u = k(r), d = (t) => {
				var r = Mn();
				let i;
				_n(k(r), {
					get spec() {
						return o.spec;
					},
					get shape() {
						return e(L);
					},
					get detail() {
						return c();
					},
					get summary() {
						return e(J);
					},
					get settled() {
						return e(v);
					},
					get onevidence() {
						return o.onevidence;
					},
					get glyph() {
						return o.glyph;
					}
				}), a(r), C(() => i = A(r, "", i, { "block-size": `${e(X)}px` })), n(t, r);
			}, f = (t) => {
				wn(t, {
					get spec() {
						return o.spec;
					},
					get shape() {
						return e(L);
					},
					get size() {
						return e(X);
					},
					get detail() {
						return c();
					},
					get summary() {
						return e(J);
					},
					get settled() {
						return e(v);
					},
					get middle() {
						return e(me);
					},
					get onevidence() {
						return o.onevidence;
					},
					get glyph() {
						return o.glyph;
					}
				});
			}, m = (t) => {
				on(t, {
					get spec() {
						return o.spec;
					},
					get shape() {
						return e(L);
					},
					get height() {
						return e(X);
					},
					get compact() {
						return e(I);
					},
					get quiet() {
						return e(O);
					},
					get summary() {
						return e(J);
					},
					get settled() {
						return e(v);
					},
					get onevidence() {
						return o.onevidence;
					},
					get glyph() {
						return o.glyph;
					}
				});
			}, h = (t) => {
				Jt(t, {
					get spec() {
						return o.spec;
					},
					get shape() {
						return e(L);
					},
					get labels() {
						return e(z);
					},
					get detail() {
						return c();
					},
					get summary() {
						return e(J);
					},
					get uid() {
						return s;
					},
					get height() {
						return e(X);
					},
					get settled() {
						return e(v);
					},
					get onevidence() {
						return o.onevidence;
					},
					get glyph() {
						return o.glyph;
					}
				});
			};
			i(u, (t) => {
				o.spec.kind === "radar" ? t(d) : e(V) ? t(f, 1) : o.spec.kind === "heat" ? t(m, 2) : t(h, -1);
			});
			var g = b(u, 2), _ = (t) => {
				{
					let n = j(() => e(V) ? "list" : o.spec.compact ? "rows" : "row");
					Qt(t, {
						get entries() {
							return e(ne);
						},
						get layout() {
							return e(n);
						}
					});
				}
			};
			i(g, (t) => {
				e(ne).length && t(_);
			}), a(r), C(() => l = p(r, 1, "body svelte-13itr0k", null, l, { beside: e(V) && e(ne).length })), n(t, r);
		}, y = (e) => {
			var t = Pn(), r = k(t, !0);
			a(t), C((e) => f(r, e), [() => je()]), n(e, t);
		};
		i(g, (t) => {
			e(B) ? t(_) : t(y, -1);
		});
		var x = b(g, 2), S = (e) => {
			var t = Fn(), r = k(t, !0);
			a(t), C(() => f(r, o.spec.basis)), n(e, t);
		}, w = j(() => o.spec.basis?.trim() && !e(O));
		i(x, (t) => {
			e(w) && t(S);
		});
		var E = b(x, 2), D = (t) => {
			var r = Un(), s = k(r), c = k(s, !0);
			a(s);
			var d = b(s, 2), p = (e) => {
				var t = In(), r = k(t, !0);
				a(t), C((e) => f(r, e), [() => Te()]), n(e, t);
			};
			i(d, (t) => {
				e(oe) && t(p);
			});
			var m = b(d, 2), h = (t) => {
				var r = Ln(), i = k(r, !0);
				a(r), C((e) => f(i, e), [() => e(ge) ? re() : W()]), T("click", r, _e), n(t, r);
			};
			i(m, (t) => {
				e(I) || t(h);
			});
			var g = b(m, 2), _ = k(g), v = k(_), y = k(v, !0);
			a(v);
			var x = b(v), S = k(x), w = k(S), E = k(w, !0);
			a(w);
			var D = b(w);
			l(D, 17, () => o.spec.series, u, (t, r) => {
				var i = Rn(), s = k(i, !0);
				a(i), C(() => f(s, e(r).name || o.spec.y?.label || "")), n(t, i);
			});
			var O = b(D), A = (e) => {
				var t = Rn(), r = k(t, !0);
				a(t), C((e) => f(r, e), [() => De()]), n(e, t);
			};
			i(O, (t) => {
				e(se) && t(A);
			}), a(S), a(x);
			var j = b(x);
			l(j, 21, () => e(L).rows, (e) => e.key, (t, r) => {
				var s = Hn(), c = k(s), d = k(c, !0);
				a(c);
				var p = b(c);
				l(p, 17, () => e(r).points, u, (t, r) => {
					var i = zn(), s = k(i, !0);
					a(i), C((e) => f(s, e), [() => F(e(r), o.spec.y)]), n(t, i);
				});
				var m = b(p), h = (t) => {
					var i = Vn();
					l(i, 21, () => e(r).points.flatMap((e) => e?.evidence ?? []), u, (t, r) => {
						var i = Bn(), s = k(i, !0);
						a(i), C(() => {
							i.disabled = !o.onevidence, f(s, e(r).origin || e(r).label);
						}), T("click", i, () => o.onevidence?.(e(r))), n(t, i);
					}), a(i), n(t, i);
				};
				i(m, (t) => {
					e(se) && t(h);
				}), a(s), C(() => f(d, e(r).label)), n(t, s);
			}), a(j), a(_), a(g), a(r), C((e) => {
				f(c, e), f(y, o.title), f(E, o.spec.x?.label ?? "");
			}, [() => e(oe) ? K() : Ne()]), n(t, r);
		};
		i(E, (t) => {
			e(U) && t(D);
		}), a(r), C(() => d = p(r, 1, `chart ${c() ?? ""}`, "svelte-13itr0k", d, {
			compact: o.spec.compact,
			round: e(V),
			radar: o.spec.kind === "radar"
		})), n(t, r);
	};
	i(be, (t) => {
		e(x) ? t(Se) : t(we, -1);
	}), n(t, Q), r();
}
c(["click"]);
export { Gn as default };
