import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, F as n, G as r, H as i, J as a, K as o, L as s, M as c, Mt as l, P as u, S as d, U as f, W as p, X as m, Y as h, bt as g, c as _, gt as v, h as y, ht as b, jt as x, lt as S, mt as C, pt as w, r as T, t as E, tt as D, ut as O, vt as k, x as A, zt as j } from "./index-client-DH73-vTM.js";
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
	#e = g(null);
	get index() {
		return D(this.#e);
	}
	set index(e) {
		k(this.#e, e, !0);
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
var _t = p("<span class=\"name svelte-i8crd8\"> </span>"), vt = p("<span class=\"row svelte-i8crd8\"><span></span> <!> <span> </span></span>"), yt = p("<button type=\"button\" class=\"chip svelte-i8crd8\"><!> <span class=\"host svelte-i8crd8\"> </span></button>"), bt = p("<span class=\"chips svelte-i8crd8\"></span>"), xt = p("<div class=\"chart-tooltip svelte-i8crd8\"><span class=\"label svelte-i8crd8\"> </span> <!> <!></div>");
function St(t, r) {
	l(r, !0);
	let a = T(r, "indicator", 3, "dot");
	var o = xt(), p = w(o), m = w(p, !0);
	j(p);
	var g = b(p, 2);
	u(g, 17, () => r.readout.rows, n, (t, n) => {
		var r = vt(), o = w(r);
		let c;
		var l = b(o, 2), u = (t) => {
			var r = _t(), a = w(r, !0);
			j(r), S(() => e(a, D(n).name)), i(t, r);
		};
		s(l, (e) => {
			D(n).name && e(u);
		});
		var f = b(l, 2);
		let p;
		var m = w(f, !0);
		j(f), j(r), S(() => {
			d(o, 1, `indicator ${a() ?? ""}`, "svelte-i8crd8"), c = A(o, "", c, { "--indicator": D(n).color }), p = d(f, 1, "value svelte-i8crd8", null, p, { alone: !D(n).name }), e(m, D(n).text);
		}), i(t, r);
	});
	var _ = b(g, 2), v = (t) => {
		var n = bt();
		u(n, 21, () => r.readout.evidence, (e) => e.key, (t, n) => {
			var a = yt(), o = w(a), l = (e) => {
				var t = f(), a = C(t);
				c(a, () => r.glyph, () => D(n)), i(e, t);
			};
			s(o, (e) => {
				r.glyph && e(l);
			});
			var u = b(o, 2), d = w(u, !0);
			j(u), j(a), S(() => {
				a.disabled = !r.onevidence, y(a, "title", D(n).label), e(d, D(n).file ? D(n).label : D(n).origin || D(n).label);
			}), h("click", a, () => r.onevidence?.(D(n))), i(t, a);
		}), j(n), i(t, n);
	};
	s(_, (e) => {
		r.readout.evidence.length && e(v);
	}), j(o), S(() => e(m, r.readout.title)), i(t, o), x();
}
a(["click"]);
// upstream/src/shared/ui/data/Chart/Tip.svelte
var Ct = p("<div class=\"tip svelte-1bbc4u3\" role=\"presentation\"><!></div>");
function wt(e, n) {
	l(n, !0);
	let r = T(n, "indicator", 3, "dot"), a = g(0), o = g(0), s = t(() => Math.max(0, Math.min(n.x - D(a) / 2, n.width - D(a)))), c = t(() => n.y - D(o) - 10 >= -8 ? n.y - D(o) - 10 : n.y + 14);
	var u = Ct();
	let d;
	St(w(u), {
		get readout() {
			return n.readout;
		},
		get indicator() {
			return r();
		},
		get onevidence() {
			return n.onevidence;
		},
		get glyph() {
			return n.glyph;
		}
	}), j(u), S(() => d = A(u, "", d, {
		left: `${D(s)}px`,
		top: `${D(c)}px`
	})), m("pointerenter", u, () => n.hover.hold()), m("pointerleave", u, () => n.hover.hide()), _(u, "clientWidth", (e) => k(a, e)), _(u, "clientHeight", (e) => k(o, e)), i(e, u), x();
}
// upstream/src/shared/ui/data/Chart/Cartesian.svelte
var Tt = r("<linearGradient x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0%\"></stop><stop offset=\"100%\" stop-opacity=\"0.02\"></stop></linearGradient>"), Et = r("<defs></defs>"), Dt = r("<line class=\"svelte-ocimr6\"></line>"), Ot = r("<g class=\"grid svelte-ocimr6\" aria-hidden=\"true\"></g>"), kt = r("<line class=\"zero svelte-ocimr6\"></line>"), At = r("<rect class=\"cursor svelte-ocimr6\" rx=\"6\"></rect>"), jt = r("<path></path>"), Mt = r("<circle r=\"3.5\"></circle>"), Nt = r("<!><path pathLength=\"1\"></path><!>", 1), Pt = r("<circle r=\"4.5\" class=\"focus svelte-ocimr6\"></circle>"), Ft = r("<line class=\"cursor-line svelte-ocimr6\"></line><!>", 1), It = r("<!><!>", 1), Lt = r("<text> </text>"), Rt = r("<text class=\"tick svelte-ocimr6\" text-anchor=\"middle\"> </text>"), zt = r("<text class=\"tick svelte-ocimr6\" text-anchor=\"end\" dominant-baseline=\"central\"> </text>"), Bt = r("<g class=\"axis\" aria-hidden=\"true\"></g>"), Vt = r("<text class=\"tick name svelte-ocimr6\" text-anchor=\"end\" dominant-baseline=\"central\"><title> </title> </text>"), Ht = r("<text class=\"tick svelte-ocimr6\" text-anchor=\"start\"> </text>"), Ut = r("<text class=\"tick svelte-ocimr6\" text-anchor=\"end\"> </text>"), Wt = r("<text class=\"value end svelte-ocimr6\" dominant-baseline=\"central\" text-anchor=\"start\"> </text>"), Gt = r("<g class=\"axis\" aria-hidden=\"true\"><!><!></g><!>", 1), Kt = r("<svg role=\"img\"><!><!><!><!><!><!><!></svg><!>", 1), qt = p("<div class=\"cartesian svelte-ocimr6\"><!></div>");
function Jt(r, a) {
	l(a, !0);
	let o = 6.5, c = g(0), p = new Ke();
	E(() => p.dispose());
	let v = t(() => a.detail !== "full"), T = t(() => a.detail === "tile"), O = t(() => !!a.spec.compact || D(v)), M = t(() => a.spec.kind === "line" || a.spec.kind === "area"), N = t(() => a.shape.horizontal), P = t(() => a.shape.scale === "band"), R = t(() => a.shape.layout === "stack"), z = t(() => !D(v) && (a.spec.compact ? a.labels.values : (a.spec.kind === "bars" || a.spec.kind === "range") && a.spec.series.length === 1 && a.shape.rows.length <= 12)), B = t(() => !D(O) && !D(z)), ee = t(() => a.spec.kind === "line" && !D(T) && a.shape.rows.length <= 16 && a.spec.series.length <= 3), V = (e, t) => a.spec.compact ? ct(e.points[t], a.spec.y) : F(e.points[t], a.spec.y), te = t(() => Math.max(24, ...a.shape.ticks.map((e) => I(e, a.spec.y).length * o + 10))), H = t(() => Math.min(200, Math.max(...a.shape.rows.map((e) => e.label.length * o), 0) + 12)), ne = t(() => Math.max(24, ...a.shape.rows.flatMap((e) => e.points.map((t, n) => V(e, n).length * o + 12)))), re = t(() => {
		if (D(T)) return {
			top: 2,
			right: 2,
			bottom: 2,
			left: 2
		};
		if (D(N)) return {
			top: 4,
			right: D(z) || a.labels.values ? D(ne) : 8,
			bottom: D(B) ? 22 : 4,
			left: D(v) ? 4 : D(H)
		};
		let e = a.spec.compact && !D(v) && (a.labels.categories || !!a.labels.ends);
		return {
			top: D(z) || a.spec.compact && a.labels.values && !D(v) ? 20 : 8,
			right: a.spec.compact && a.labels.ends && !D(v) ? 36 : D(M) ? 14 : 4,
			bottom: D(v) ? 4 : a.spec.compact ? e ? 18 : 4 : 24,
			left: D(B) ? D(te) : D(M) ? 14 : 0
		};
	}), U = t(() => D(re).left), W = t(() => Math.max(D(U) + 1, D(c) - D(re).right)), G = t(() => D(re).top), K = t(() => Math.max(D(G) + 1, a.height - D(re).bottom)), q = t(() => D(N) ? Pe(a.shape.domain, [D(U), D(W)]) : Pe(a.shape.domain, [D(K), D(G)])), ie = t(() => D(q)(Math.max(a.shape.domain[0], Math.min(0, a.shape.domain[1])))), J = t(() => Fe(a.shape.rows.length, D(N) ? [D(G), D(K)] : [D(U), D(W)], D(T) ? .2 : .28, .1)), ae = t(() => {
		let e = a.shape.rows.map((e) => e.at);
		return [Math.min(...e), Math.max(...e)];
	}), oe = t(() => a.shape.scale === "index" ? Pe([0, Math.max(1, a.shape.rows.length - 1)], [D(U), D(W)]) : Pe(D(ae), [D(U), D(W)]));
	function Y(e) {
		return D(P) ? D(J).start(e.index) + D(J).width / 2 : a.shape.rows.length === 1 ? (D(U) + D(W)) / 2 : D(oe)(e.at);
	}
	let se = t(() => {
		let e = ce();
		return Math.max(2, Math.min(D(T) ? 3 : 6, e / 2));
	});
	function ce() {
		return D(R) || a.spec.series.length === 1 ? D(J).width : Fe(a.spec.series.length, [0, D(J).width], .14, 0).width;
	}
	let le = t(() => {
		if (D(M)) return [];
		let e = [], t = Fe(a.spec.series.length, [0, D(J).width], .14, 0);
		return a.spec.series.forEach((n, r) => {
			a.shape.rows.forEach((n) => {
				let i = n.points[r];
				if (!i || i.y === null) return;
				let o, s, c = "end";
				if (D(R)) {
					if ([o, s] = a.shape.stacks[r][n.index], o === s) return;
					let e = s >= o;
					a.shape.stacks.slice(r + 1).some((t) => {
						let [r, i] = t[n.index];
						return r !== i && i >= r === e;
					}) && (c = "none");
				} else a.spec.kind === "range" ? (o = i.y, s = i.y2 ?? i.y, c = "all") : (o = Math.max(a.shape.domain[0], Math.min(0, a.shape.domain[1])), s = i.y);
				let l = D(R) || a.spec.series.length === 1 ? 0 : t.start(r), u = D(R) || a.spec.series.length === 1 ? D(J).width : t.width, d = Math.min(u, D(N) ? 28 : 64), f = D(J).start(n.index) + l + (u - d) / 2, p = D(q)(o), m = D(q)(s), h = Math.min(d, 8);
				if (a.spec.kind === "range" && Math.abs(m - p) < h) {
					let e = (p + m) / 2, t = h / 2 * (m >= p ? 1 : -1);
					[p, m] = [e - t, e + t];
				}
				let g = D(R) && o !== 0 ? 2 : 0, _, v;
				if (D(N)) {
					let e = m >= p, t = e ? p + g : m;
					_ = He(t, f, (e ? m : p - g) - t, d, D(se), c, e ? "right" : "left"), v = a.spec.kind === "range" ? "center" : e ? "left" : "right";
				} else {
					let e = m <= p, t = e ? m : p + g;
					_ = He(f, t, d, (e ? p - g : m) - t, D(se), c, e ? "up" : "down"), v = a.spec.kind === "range" ? "center" : e ? "bottom" : "top";
				}
				_ && e.push({
					key: `${r}:${n.key}`,
					d: _,
					color: a.shape.series[r].color,
					origin: v,
					index: n.index
				});
			});
		}), e;
	}), ue = t(() => D(M) ? a.shape.series.map((e, t) => {
		let n = a.shape.rows.map((e) => {
			let n = e.points[t]?.y;
			return n == null ? null : {
				x: Y(e),
				y: D(q)(D(R) ? a.shape.stacks[t][e.index][1] : n)
			};
		}), r = a.shape.rows.map((e) => D(R) ? {
			x: Y(e),
			y: D(q)(a.shape.stacks[t][e.index][0])
		} : {
			x: Y(e),
			y: D(ie)
		}), i = Be(n.map((e, t) => e ? {
			point: e,
			floor: r[t]
		} : null));
		return {
			key: e.key,
			color: e.color,
			line: i.map((e) => ze(e.map((e) => e.point))).join(""),
			area: i.map((e) => Ve(e.map((e) => e.point), e.map((e) => e.floor))).join(""),
			dots: n
		};
	}) : []), de = t(() => {
		if (D(N)) return a.shape.rows;
		if (a.shape.scale === "index") {
			let e = Math.max(1, Math.ceil(a.shape.rows.length / 8));
			return a.shape.rows.filter((t) => t.index % e === 0);
		}
		let e = Math.max(...a.shape.rows.map((e) => X(e).length * o), 0) + 10, t = Math.max(1, D(W) - D(U)), n = Math.max(1, Math.ceil(a.shape.rows.length * e / t));
		return a.shape.rows.filter((e, t) => t % n === 0);
	}), fe = t(() => new Intl.DateTimeFormat(void 0, D(ae)[1] - D(ae)[0] > 1728e5 ? {
		month: "short",
		day: "numeric"
	} : {
		hour: "numeric",
		minute: "2-digit"
	}));
	function X(e) {
		return a.shape.scale === "time" ? D(fe).format(e.at) : a.shape.scale === "linear" ? L(e.at, "linear") : e.label;
	}
	function pe(e, t) {
		let n = Math.max(3, Math.floor(t / o));
		return e.length > n ? `${e.slice(0, n - 1).trimEnd()}…` : e;
	}
	function me(e, t) {
		let n = e.points[t];
		if (!n || n.y === null) return null;
		let r = n.y2 ?? n.y, i = r >= 0, o = a.spec.series.length > 1 && !D(R), s = Fe(a.spec.series.length, [0, D(J).width], .14, 0), c = o ? s.start(t) + s.width / 2 : D(J).width / 2;
		return D(N) ? {
			x: D(q)(r) + (i ? 6 : -6),
			y: D(J).start(e.index) + c,
			anchor: i ? "start" : "end"
		} : {
			x: D(J).start(e.index) + c,
			y: D(q)(r) + (i ? -7 : 14),
			anchor: "middle"
		};
	}
	let he = t(() => a.shape.rows.findLast((e) => e.points[0] && e.points[0].y !== null));
	function ge(e) {
		let t = e.currentTarget.getBoundingClientRect(), n = D(N) ? e.clientY - t.top : e.clientX - t.left, r;
		if (D(P)) r = Math.floor((n - D(J).start(0) + (D(J).step - D(J).width) / 2) / D(J).step);
		else {
			let e = 0, t = Infinity;
			for (let r of a.shape.rows) {
				let i = Math.abs(Y(r) - n);
				i < t && ([e, t] = [r.index, i]);
			}
			r = e;
		}
		p.show(Math.max(0, Math.min(a.shape.rows.length - 1, r)));
	}
	let Z = t(() => p.index === null ? null : a.shape.rows[p.index] ?? null), _e = t(() => D(Z) ? mt(a.spec, a.shape, D(Z).index) : null), ve = t(() => {
		if (!D(Z)) return null;
		let e = D(Z).points.flatMap((e, t) => !e || e.y === null ? [] : D(R) ? [a.shape.stacks[t][D(Z).index][1]] : [e.y2 ?? e.y]), t = e.length ? Math.max(...e) : 0;
		return D(N) ? {
			x: D(q)(t),
			y: D(J).start(D(Z).index)
		} : {
			x: Y(D(Z)),
			y: Math.min(D(q)(t), D(K)) - (D(M) ? 4 : 0)
		};
	});
	var Q = qt();
	let ye;
	var be = w(Q), xe = (r) => {
		var o = Kt(), l = C(o);
		let g;
		var _ = w(l), x = (e) => {
			var t = Et();
			u(t, 23, () => a.shape.series, (e) => e.key, (e, t, n) => {
				var r = Tt(), o = w(r), s = b(o);
				j(r), S(() => {
					y(r, "id", `${a.uid}-wash-${D(n)}`), y(o, "stop-color", D(t).color), y(o, "stop-opacity", D(T) ? .5 : .36), y(s, "stop-color", D(t).color);
				}), i(e, r);
			}), j(t), i(e, t);
		};
		s(_, (e) => {
			a.spec.kind === "area" && e(x);
		});
		var E = b(_), k = (e) => {
			var n = Ot();
			u(n, 20, () => a.shape.ticks, (e) => e, (e, n) => {
				let r = t(() => Math.round(D(q)(n)) + .5);
				var a = f(), o = C(a), c = (e) => {
					var t = Dt();
					S(() => {
						y(t, "x1", D(r)), y(t, "x2", D(r)), y(t, "y1", D(G)), y(t, "y2", D(K));
					}), i(e, t);
				}, l = (e) => {
					var t = Dt();
					S(() => {
						y(t, "x1", D(U)), y(t, "x2", D(W)), y(t, "y1", D(r)), y(t, "y2", D(r));
					}), i(e, t);
				};
				s(o, (e) => {
					D(N) ? e(c) : e(l, -1);
				}), i(e, a);
			}), j(n), i(e, n);
		};
		s(E, (e) => {
			!D(T) && !(D(N) && D(z)) && e(k);
		});
		var F = b(E), L = (e) => {
			let n = t(() => Math.round(D(ie)) + .5);
			var r = f(), a = C(r), o = (e) => {
				var t = kt();
				S(() => {
					y(t, "x1", D(n)), y(t, "x2", D(n)), y(t, "y1", D(G)), y(t, "y2", D(K));
				}), i(e, t);
			}, c = (e) => {
				var t = kt();
				S(() => {
					y(t, "x1", D(U)), y(t, "x2", D(W)), y(t, "y1", D(n)), y(t, "y2", D(n));
				}), i(e, t);
			};
			s(a, (e) => {
				D(N) ? e(o) : e(c, -1);
			}), i(e, r);
		};
		s(F, (e) => {
			a.shape.domain[0] < 0 && a.shape.domain[1] > 0 && e(L);
		});
		var R = b(F), te = (e) => {
			let n = t(() => D(J).start(D(Z).index) - (D(J).step - D(J).width) / 2);
			var r = f(), a = C(r), o = (e) => {
				var t = At();
				S(() => {
					y(t, "x", D(U)), y(t, "y", D(n)), y(t, "width", D(W) - D(U)), y(t, "height", D(J).step);
				}), i(e, t);
			}, c = (e) => {
				var t = At();
				S(() => {
					y(t, "x", D(n)), y(t, "y", D(G)), y(t, "width", D(J).step), y(t, "height", D(K) - D(G));
				}), i(e, t);
			};
			s(a, (e) => {
				D(N) ? e(o) : e(c, -1);
			}), i(e, r);
		};
		s(R, (e) => {
			D(Z) && D(P) && e(te);
		});
		var ne = b(R), re = (e) => {
			var r = It(), o = C(r);
			u(o, 19, () => D(ue), (e) => e.key, (e, t, r) => {
				var o = Nt(), c = C(o), l = (e) => {
					var n = jt();
					let o;
					S(() => {
						y(n, "d", D(t).area), o = d(n, 0, "mark area svelte-ocimr6", null, o, { enter: !a.settled }), y(n, "fill", `url(#${a.uid}-wash-${D(r)})`);
					}), i(e, n);
				};
				s(c, (e) => {
					a.spec.kind === "area" && e(l);
				});
				var p = b(c);
				let m;
				var h = b(p), g = (e) => {
					var r = f(), o = C(r);
					u(o, 17, () => D(t).dots, n, (e, n) => {
						var r = f(), o = C(r), c = (e) => {
							var r = Mt();
							let o;
							S(() => {
								y(r, "cx", D(n).x), y(r, "cy", D(n).y), o = d(r, 0, "mark dot svelte-ocimr6", null, o, { enter: !a.settled }), y(r, "fill", D(t).color);
							}), i(e, r);
						};
						s(o, (e) => {
							D(n) && e(c);
						}), i(e, r);
					}), i(e, r);
				};
				s(h, (e) => {
					D(ee) && e(g);
				}), S(() => {
					y(p, "d", D(t).line), m = d(p, 0, "mark line svelte-ocimr6", null, m, { enter: !a.settled }), y(p, "stroke", D(t).color);
				}), i(e, o);
			});
			var c = b(o), l = (e) => {
				let n = t(() => Y(D(Z)));
				var r = Ft(), a = C(r), o = b(a);
				u(o, 17, () => D(ue), (e) => e.key, (e, n) => {
					let r = t(() => D(n).dots[D(Z).index]);
					var a = f(), o = C(a), c = (e) => {
						var t = Pt();
						S(() => {
							y(t, "cx", D(r).x), y(t, "cy", D(r).y), y(t, "fill", D(n).color);
						}), i(e, t);
					};
					s(o, (e) => {
						D(r) && e(c);
					}), i(e, a);
				}), S(() => {
					y(a, "x1", D(n)), y(a, "x2", D(n)), y(a, "y1", D(G)), y(a, "y2", D(K));
				}), i(e, r);
			};
			s(c, (e) => {
				D(Z) && !D(v) && e(l);
			}), i(e, r);
		}, ae = (n) => {
			var r = It(), o = C(r);
			u(o, 17, () => D(le), (e) => e.key, (e, t) => {
				var n = jt();
				let r, o;
				S((e) => {
					y(n, "d", D(t).d), y(n, "fill", D(t).color), r = d(n, 0, "mark bar svelte-ocimr6", null, r, {
						enter: !a.settled,
						dim: D(Z) !== null && D(Z).index !== D(t).index
					}), o = A(n, "", o, e);
				}, [() => ({
					"transform-origin": D(t).origin,
					"animation-delay": a.settled ? void 0 : `${Math.min(D(t).index * 18, 180)}ms`
				})]), i(e, n);
			});
			var c = b(o), l = (n) => {
				var r = f(), o = C(r);
				u(o, 19, () => a.shape.series, (e) => e.key, (n, r, o) => {
					var c = f(), l = C(c);
					u(l, 17, () => a.shape.rows, (e) => e.key, (n, r) => {
						let c = t(() => me(D(r), D(o)));
						var l = f(), u = C(l), p = (t) => {
							var n = Lt();
							let s;
							var l = w(n, !0);
							j(n), S((t) => {
								y(n, "x", D(c).x), y(n, "y", D(c).y), y(n, "text-anchor", D(c).anchor), y(n, "dominant-baseline", D(N) ? "central" : "auto"), s = d(n, 0, "value svelte-ocimr6", null, s, { enter: !a.settled }), e(l, t);
							}, [() => V(D(r), D(o))]), i(t, n);
						};
						s(u, (e) => {
							D(c) && e(p);
						}), i(n, l);
					}), i(n, c);
				}), i(n, r);
			};
			s(c, (e) => {
				D(z) && e(l);
			}), i(n, r);
		};
		s(ne, (e) => {
			D(M) ? e(re) : e(ae, -1);
		});
		var oe = b(ne), se = (t) => {
			var n = Bt();
			u(n, 20, () => a.shape.ticks, (e) => e, (t, n) => {
				var r = f(), o = C(r), c = (t) => {
					var r = Rt(), o = w(r, !0);
					j(r), S((t, n) => {
						y(r, "x", t), y(r, "y", D(K) + 16), e(o, n);
					}, [() => D(q)(n), () => I(n, a.spec.y)]), i(t, r);
				}, l = (t) => {
					var r = zt(), o = w(r, !0);
					j(r), S((t, n) => {
						y(r, "x", D(U) - 8), y(r, "y", t), e(o, n);
					}, [() => D(q)(n), () => I(n, a.spec.y)]), i(t, r);
				};
				s(o, (e) => {
					D(N) ? e(c) : e(l, -1);
				}), i(t, r);
			}), j(n), i(t, n);
		};
		s(oe, (e) => {
			D(B) && e(se);
		});
		var ce = b(oe), fe = (t) => {
			var n = Bt();
			u(n, 21, () => D(de), (e) => e.key, (t, n) => {
				var r = f(), o = C(r), c = (t) => {
					var r = Vt(), a = w(r), o = w(a, !0);
					j(a);
					var s = b(a, 1, !0);
					j(r), S((t, i) => {
						y(r, "x", D(U) - 8), y(r, "y", t), e(o, D(n).label), e(s, i);
					}, [() => D(J).start(D(n).index) + D(J).width / 2, () => pe(D(n).label, D(H) - 12)]), i(t, r);
				}, l = (t) => {
					var r = Lt();
					let o;
					var s = w(r, !0);
					j(r), S((t, i) => {
						o = d(r, 0, "tick svelte-ocimr6", null, o, { on: D(Z)?.index === D(n).index }), y(r, "x", t), y(r, "y", D(K) + 16), y(r, "text-anchor", !D(P) && D(n).index === 0 && a.shape.rows.length > 1 ? "start" : !D(P) && D(n).index === a.shape.rows.length - 1 && a.shape.rows.length > 1 ? "end" : "middle"), e(s, i);
					}, [() => Y(D(n)), () => X(D(n))]), i(t, r);
				};
				s(o, (e) => {
					D(N) ? e(c) : e(l, -1);
				}), i(t, r);
			}), j(n), i(t, n);
		}, Q = (n) => {
			let r = t(() => a.shape.rows[0]), o = t(() => a.shape.rows.at(-1));
			var c = Gt(), l = C(c), u = w(l), d = (t) => {
				var n = Ht(), a = w(n, !0);
				j(n), S((t, r) => {
					y(n, "x", t), y(n, "y", D(K) + 14), e(a, r);
				}, [() => Y(D(r)), () => X(D(r))]), i(t, n);
			};
			s(u, (e) => {
				D(r) && e(d);
			});
			var p = b(u), m = (t) => {
				var n = Ut(), r = w(n, !0);
				j(n), S((t, i) => {
					y(n, "x", t), y(n, "y", D(K) + 14), e(r, i);
				}, [() => Y(D(o)), () => X(D(o))]), i(t, n);
			};
			s(p, (e) => {
				D(o) && D(o) !== D(r) && e(m);
			}), j(l);
			var h = b(l), g = (n) => {
				let r = t(() => D(ue)[0]?.dots[D(he).index]);
				var o = f(), c = C(o), l = (t) => {
					var n = Wt(), o = w(n, !0);
					j(n), S(() => {
						y(n, "x", D(r).x + 6), y(n, "y", D(r).y), e(o, a.labels.ends.value);
					}), i(t, n);
				};
				s(c, (e) => {
					D(r) && e(l);
				}), i(n, o);
			};
			s(h, (e) => {
				D(he) && e(g);
			}), i(n, c);
		};
		s(ce, (e) => {
			!D(v) && (!D(O) || a.labels.categories) ? e(fe) : !D(v) && a.labels.ends && e(Q, 1);
		}), j(l);
		var ye = b(l), be = (e) => {
			{
				let n = t(() => D(M) ? "line" : "dot");
				wt(e, {
					get readout() {
						return D(_e);
					},
					get x() {
						return D(ve).x;
					},
					get y() {
						return D(ve).y;
					},
					get width() {
						return D(c);
					},
					get hover() {
						return p;
					},
					get indicator() {
						return D(n);
					},
					get onevidence() {
						return a.onevidence;
					},
					get glyph() {
						return a.glyph;
					}
				});
			}
		};
		s(ye, (e) => {
			D(_e) && D(ve) && !D(v) && e(be);
		}), S(() => {
			y(l, "width", D(c)), y(l, "height", a.height), y(l, "aria-label", a.summary), g = d(l, 0, "svelte-ocimr6", null, g, { lying: D(N) });
		}), h("pointermove", l, function(...e) {
			(D(v) ? void 0 : ge)?.apply(this, e);
		}), m("pointerleave", l, function(...e) {
			(D(v) ? void 0 : () => p.hide())?.apply(this, e);
		}), i(r, o);
	};
	s(be, (e) => {
		D(c) && e(xe);
	}), j(Q), S(() => ye = A(Q, "", ye, { "block-size": `${a.height}px` })), _(Q, "clientWidth", (e) => k(c, e)), i(r, Q), x();
}
a(["pointermove"]);
// upstream/src/shared/ui/data/Chart/ChartLegend.svelte
var Yt = p("<span class=\"share svelte-lct99f\"> </span>"), Xt = p("<li class=\"svelte-lct99f\"><span class=\"swatch svelte-lct99f\"></span><span class=\"name svelte-lct99f\"> </span><!></li>"), Zt = p("<ul></ul>");
function Qt(t, n) {
	let r = T(n, "layout", 3, "row");
	var a = Zt();
	u(a, 21, () => n.entries, (e) => e.key, (t, n) => {
		var r = Xt(), a = w(r);
		let o;
		var c = b(a), l = w(c, !0);
		j(c);
		var u = b(c), d = (t) => {
			var r = Yt(), a = w(r, !0);
			j(r), S(() => e(a, D(n).share)), i(t, r);
		};
		s(u, (e) => {
			D(n).share && e(d);
		}), j(r), S(() => {
			o = A(a, "", o, { background: D(n).color }), e(l, D(n).label);
		}), i(t, r);
	}), j(a), S(() => d(a, 1, `chart-legend ${r() ?? ""}`, "svelte-lct99f")), i(t, a);
}
// upstream/src/shared/ui/data/Chart/Heat.svelte
var $t = r("<rect rx=\"2\" role=\"presentation\"></rect>"), en = r("<text class=\"tick svelte-9xl1lm\" text-anchor=\"end\" dominant-baseline=\"central\"> </text>"), tn = r("<text class=\"tick svelte-9xl1lm\" text-anchor=\"middle\"> </text>"), nn = r("<g aria-hidden=\"true\"><!><!></g>"), rn = r("<svg role=\"img\" class=\"svelte-9xl1lm\"><!><!></svg><!>", 1), an = p("<div class=\"heat svelte-9xl1lm\"><!></div>");
function on(r, a) {
	l(a, !0);
	let o = 6.5, c = g(0), p = new Ke();
	E(() => p.dispose());
	let h = t(() => a.compact ? 0 : Math.max(...a.spec.series.map((e) => e.name.length * o), 0) + 14), v = t(() => a.height - (a.compact ? 0 : 20)), T = t(() => Fe(a.shape.keys.length, [D(h), Math.max(D(h) + 1, D(c))], .08, 0)), O = t(() => Fe(a.spec.series.length, [a.compact ? 0 : 4, D(v)], .1, 0)), M = (e) => e === null ? "var(--color-fill)" : `color-mix(in oklab, var(--color-lit) ${Math.round(6 + e * 94)}%, var(--color-surface))`, N = t(() => Math.max(1, Math.ceil(a.shape.rows.length * (Math.max(...a.shape.rows.map((e) => e.label.length), 0) * o + 8) / Math.max(1, D(c) - D(h))))), P = t(() => p.index === null ? null : mt(a.spec, a.shape, p.index)), F = t(() => {
		let e = p.index === null ? null : a.shape.cells[p.index];
		if (!e) return null;
		let t = a.shape.keys.indexOf(e.key);
		return {
			x: D(T).start(t) + D(T).width / 2,
			y: D(O).start(Number(e.order))
		};
	});
	var I = an();
	let L;
	var R = w(I), z = (t) => {
		var r = rn(), o = C(r), l = w(o);
		u(l, 17, () => a.shape.cells, (e) => e.index, (e, t) => {
			var n = $t();
			let r;
			S((e, i, o) => {
				y(n, "x", e), y(n, "y", i), y(n, "width", D(T).width), y(n, "height", D(O).width), y(n, "fill", o), r = d(n, 0, "mark cell svelte-9xl1lm", null, r, {
					enter: !a.settled,
					on: p.index === D(t).index
				});
			}, [
				() => D(T).start(a.shape.keys.indexOf(D(t).key)),
				() => D(O).start(Number(D(t).order)),
				() => M(D(t).tone)
			]), m("pointerenter", n, function(...e) {
				(a.quiet ? void 0 : () => p.show(D(t).index))?.apply(this, e);
			}), m("pointerleave", n, function(...e) {
				(a.quiet ? void 0 : () => p.hide())?.apply(this, e);
			}), i(e, n);
		});
		var g = b(l), _ = (t) => {
			var r = nn(), o = w(r);
			u(o, 17, () => a.spec.series, n, (t, n, r) => {
				var a = en(), o = w(a, !0);
				j(a), S((t) => {
					y(a, "x", D(h) - 8), y(a, "y", t), e(o, D(n).name);
				}, [() => D(O).start(r) + D(O).width / 2]), i(t, a);
			});
			var c = b(o);
			u(c, 17, () => a.shape.rows, (e) => e.key, (t, n) => {
				var r = f(), o = C(r), c = (t) => {
					var r = tn(), o = w(r, !0);
					j(r), S((t) => {
						y(r, "x", t), y(r, "y", a.height - 4), e(o, D(n).label);
					}, [() => D(T).start(D(n).index) + D(T).width / 2]), i(t, r);
				};
				s(o, (e) => {
					D(n).index % D(N) === 0 && e(c);
				}), i(t, r);
			}), j(r), i(t, r);
		};
		s(g, (e) => {
			a.compact || e(_);
		}), j(o);
		var v = b(o), x = (e) => {
			wt(e, {
				get readout() {
					return D(P);
				},
				get x() {
					return D(F).x;
				},
				get y() {
					return D(F).y;
				},
				get width() {
					return D(c);
				},
				get hover() {
					return p;
				},
				get onevidence() {
					return a.onevidence;
				},
				get glyph() {
					return a.glyph;
				}
			});
		};
		s(v, (e) => {
			D(P) && D(F) && !a.quiet && e(x);
		}), S(() => {
			y(o, "width", D(c)), y(o, "height", a.height), y(o, "aria-label", a.summary);
		}), i(t, r);
	};
	s(R, (e) => {
		D(c) && e(z);
	}), j(I), S(() => L = A(I, "", L, { "block-size": `${a.height}px` })), _(I, "clientWidth", (e) => k(c, e)), i(r, I), x();
}
// upstream/src/shared/ui/data/Chart/Radar.svelte
var sn = r("<polygon class=\"grid svelte-1j8obo0\"></polygon>"), cn = r("<line class=\"grid svelte-1j8obo0\"></line>"), ln = r("<circle class=\"mark dot svelte-1j8obo0\"></circle>"), un = r("<polygon class=\"mark web svelte-1j8obo0\"></polygon><!>", 1), dn = r("<text> </text>"), fn = r("<path class=\"hit svelte-1j8obo0\" role=\"presentation\"></path>"), pn = r("<!><!>", 1), mn = p("<div class=\"tip svelte-1j8obo0\"><!></div>"), hn = r("<svg role=\"img\"><!><!><!><!></svg><!>", 1), gn = p("<div class=\"radar svelte-1j8obo0\"><!></div>");
function _n(r, a) {
	l(a, !0);
	let o = g(0), c = g(0), p = g(null), h = t(() => st(a.spec)), v = t(() => a.detail === "full"), T = t(() => D(v) ? 28 : a.detail === "overview" ? 8 : 2), E = t(() => Math.max(8, Math.min(D(o), D(c)) / 2 - D(T))), O = t(() => D(o) / 2), M = t(() => D(c) / 2), N = (e, t) => ({
		x: D(O) + Math.sin(e) * D(E) * t,
		y: D(M) - Math.cos(e) * D(E) * t
	}), P = (e) => D(h).axes.map((t) => N(t.angle, e)).map((e) => `${e.x},${e.y}`).join(" "), F = t(() => D(h).ticks.at(-1) ?? 1);
	function I(e) {
		return D(h).axes.map((t, n) => N(t.angle, e[n] ?? 0)).map((e) => `${e.x},${e.y}`).join(" ");
	}
	function L(e) {
		let t = Math.PI / Math.max(1, D(h).axes.length), n = D(h).axes[e].angle, r = N(n - t, 1.08), i = N(n + t, 1.08);
		return `M${D(O)},${D(M)} L${r.x},${r.y} L${i.x},${i.y} Z`;
	}
	let R = t(() => D(p) === null ? null : mt(a.spec, a.shape, D(p))), z = t(() => D(p) === null ? null : N(D(h).axes[D(p)].angle, .9));
	var B = gn(), ee = w(B), V = (r) => {
		var l = hn(), g = C(l);
		let _;
		var x = w(g);
		u(x, 16, () => D(h).ticks, (e) => e, (e, t) => {
			var n = sn();
			S((e) => y(n, "points", e), [() => P(t / D(F))]), i(e, n);
		});
		var T = b(x);
		u(T, 17, () => D(h).axes, (e) => e.key, (e, n) => {
			let r = t(() => N(D(n).angle, 1));
			var a = cn();
			S(() => {
				y(a, "x1", D(O)), y(a, "y1", D(M)), y(a, "x2", D(r).x), y(a, "y2", D(r).y);
			}), i(e, a);
		});
		var E = b(T);
		u(E, 17, () => D(h).series, n, (e, r) => {
			var o = un(), c = C(o);
			let l;
			var d = b(c), m = (e) => {
				var a = f(), o = C(a);
				u(o, 17, () => D(r).reach, n, (e, n, a) => {
					var o = f(), c = C(o), l = (e) => {
						let o = t(() => N(D(h).axes[a].angle, D(n)));
						var s = ln();
						let c;
						S(() => {
							y(s, "cx", D(o).x), y(s, "cy", D(o).y), y(s, "r", D(p) === a ? 4.5 : 3.5), c = A(s, "", c, { fill: D(r).color });
						}), i(e, s);
					};
					s(c, (e) => {
						D(n) !== null && e(l);
					}), i(e, o);
				}), i(e, a);
			};
			s(d, (e) => {
				a.detail !== "tile" && D(h).series.length <= 2 && e(m);
			}), S((e) => {
				y(c, "points", e), l = A(c, "", l, {
					fill: D(r).color,
					stroke: D(r).color,
					"fill-opacity": D(h).series.length > 1 ? .14 : .24
				});
			}, [() => I(D(r).reach)]), i(e, o);
		});
		var B = b(E), ee = (r) => {
			var a = pn(), o = C(a);
			u(o, 19, () => D(h).axes, (e) => e.key, (n, r, a) => {
				let o = t(() => N(D(r).angle, 1)), s = t(() => Math.sin(D(r).angle)), c = t(() => Math.cos(D(r).angle));
				var l = dn();
				let u;
				var f = w(l, !0);
				j(l), S((t) => {
					y(l, "x", D(o).x + D(s) * 10), y(l, "y", D(o).y - D(c) * 10), y(l, "text-anchor", t), y(l, "dominant-baseline", D(c) > .5 ? "auto" : D(c) < -.5 ? "hanging" : "central"), u = d(l, 0, "name svelte-1j8obo0", null, u, { on: D(p) === D(a) }), e(f, D(r).label);
				}, [() => Math.abs(D(s)) < .2 ? "middle" : D(s) > 0 ? "start" : "end"]), i(n, l);
			});
			var s = b(o);
			u(s, 17, () => D(h).axes, n, (e, t, n) => {
				var r = fn();
				S((e) => y(r, "d", e), [() => L(n)]), m("pointerenter", r, () => k(p, n, !0)), m("pointerleave", r, () => k(p, null)), i(e, r);
			}), i(r, a);
		};
		s(B, (e) => {
			D(v) && e(ee);
		}), j(g);
		var V = b(g), te = (e) => {
			var t = mn();
			let n;
			St(w(t), {
				get readout() {
					return D(R);
				},
				get onevidence() {
					return a.onevidence;
				},
				get glyph() {
					return a.glyph;
				}
			}), j(t), S(() => n = A(t, "", n, {
				left: `${D(z).x}px`,
				top: `${D(z).y}px`
			})), i(e, t);
		};
		s(V, (e) => {
			D(R) && D(z) && e(te);
		}), S(() => {
			y(g, "width", D(o)), y(g, "height", D(c)), y(g, "aria-label", a.summary), _ = d(g, 0, "svelte-1j8obo0", null, _, { enter: !a.settled });
		}), i(r, l);
	};
	s(ee, (e) => {
		D(o) && D(c) && D(h).axes.length >= 3 && e(V);
	}), j(B), _(B, "clientWidth", (e) => k(o, e)), _(B, "clientHeight", (e) => k(c, e)), i(r, B), x();
}
// upstream/src/shared/ui/data/Chart/Round.svelte
var vn = r("<path role=\"presentation\"></path>"), yn = r("<path pathLength=\"1\" role=\"presentation\"></path>"), bn = r("<circle class=\"track svelte-bbgwfk\"></circle><!>", 1), xn = r("<text text-anchor=\"middle\" dominant-baseline=\"central\"> </text>"), Sn = r("<text text-anchor=\"middle\" dominant-baseline=\"central\" class=\"total svelte-bbgwfk\"> </text><!>", 1), Cn = p("<div class=\"round svelte-bbgwfk\"><svg role=\"img\" class=\"svelte-bbgwfk\"><g><!><!></g><!></svg> <!></div>");
function wn(n, r) {
	l(r, !0);
	let a = new Ke();
	E(() => a.dispose());
	let o = t(() => r.detail !== "full"), c = t(() => r.detail === "tile"), f = t(() => r.size / 2), p = t(() => Math.max(8, r.size / 2 - 2)), h = Math.PI * 2, g = t(() => {
		if (r.spec.kind !== "donut" || !r.shape.total) return [];
		let e = D(p) * (D(c) ? .6 : .7), t = r.shape.parts.length > 1 ? .025 : 0, n = D(c) ? 1.5 : 3, i = 0;
		return r.shape.parts.map((a) => {
			let o = a.value / r.shape.total * h, s = i + t / 2, c = i + o - t / 2;
			return i += o, {
				part: a,
				d: Ge(D(f), D(f), e, D(p), s, Math.max(s, c), n),
				corner: n,
				tip: Ue(D(f), D(f), D(p), (s + c) / 2)
			};
		});
	}), _ = t(() => r.spec.kind === "radial" ? ot(r.spec, r.shape.parts) : 1), v = t(() => {
		if (r.spec.kind !== "radial") return [];
		let e = Math.max(1, r.shape.parts.length), t = D(p) * (e === 1 ? .72 : .36), n = (D(p) - t) / e, i = Math.max(3, n * (e === 1 ? 1 : .72));
		return r.shape.parts.map((e) => {
			let t = D(p) - e.index * n - i / 2, r = Math.min(1, Math.max(0, e.value / (D(_) || 1)));
			return {
				part: e,
				radius: t,
				thickness: i,
				d: r > 0 ? We(D(f), D(f), t, 0, r * h) : "",
				tip: Ue(D(f), D(f), t, r * h)
			};
		});
	}), T = t(() => a.index === null ? null : mt(r.spec, r.shape, a.index)), O = t(() => a.index === null ? null : (D(g).find((e) => e.part.index === a.index) ?? D(v).find((e) => e.part.index === a.index))?.tip ?? null), k = (e) => D(o) ? void 0 : () => a.show(e), M = t(() => D(o) ? void 0 : () => a.hide());
	var N = Cn();
	let P;
	var F = w(N), I = w(F);
	let L;
	var R = w(I);
	u(R, 17, () => D(g), (e) => e.part.index, (e, n) => {
		var r = vn();
		let o;
		var s = t(() => k(D(n).part.index));
		S(() => {
			y(r, "d", D(n).d), y(r, "fill", D(n).part.color), y(r, "stroke", D(n).part.color), y(r, "stroke-width", D(n).corner * 2), o = d(r, 0, "mark slice svelte-bbgwfk", null, o, { dim: a.index !== null && a.index !== D(n).part.index });
		}), m("pointerenter", r, function(...e) {
			D(s)?.apply(this, e);
		}), m("pointerleave", r, function(...e) {
			D(M)?.apply(this, e);
		}), i(e, r);
	});
	var z = b(R);
	u(z, 17, () => D(v), (e) => e.part.index, (e, n) => {
		var o = bn(), c = C(o), l = b(c), u = (e) => {
			var o = yn();
			let s;
			var c = t(() => k(D(n).part.index));
			S(() => {
				y(o, "d", D(n).d), y(o, "stroke", D(n).part.color), y(o, "stroke-width", D(n).thickness), s = d(o, 0, "mark slice arc svelte-bbgwfk", null, s, {
					draw: !r.settled,
					dim: a.index !== null && a.index !== D(n).part.index
				});
			}), m("pointerenter", o, function(...e) {
				D(c)?.apply(this, e);
			}), m("pointerleave", o, function(...e) {
				D(M)?.apply(this, e);
			}), i(e, o);
		};
		s(l, (e) => {
			D(n).d && e(u);
		}), S(() => {
			y(c, "cx", D(f)), y(c, "cy", D(f)), y(c, "r", D(n).radius), y(c, "stroke-width", D(n).thickness);
		}), i(e, o);
	}), j(I);
	var B = b(I), ee = (t) => {
		var n = Sn(), a = C(n), o = w(a, !0);
		j(a);
		var c = b(a), l = (t) => {
			var n = xn();
			let a;
			var o = w(n, !0);
			j(n), S(() => {
				y(n, "x", D(f)), y(n, "y", D(f) + (r.spec.compact ? 14 : 18)), a = d(n, 0, "caption-text svelte-bbgwfk", null, a, { lead: r.spec.compact }), e(o, r.middle.label);
			}), i(t, n);
		};
		s(c, (e) => {
			r.detail === "full" && e(l);
		}), S(() => {
			y(a, "x", D(f)), y(a, "y", D(f) + (r.detail === "full" ? -2 : 0)), e(o, r.middle.value);
		}), i(t, n);
	};
	s(B, (e) => {
		r.middle && !D(c) && (r.spec.kind === "donut" || r.shape.parts.length === 1) && e(ee);
	}), j(F);
	var V = b(F, 2), te = (e) => {
		wt(e, {
			get readout() {
				return D(T);
			},
			get x() {
				return D(O).x;
			},
			get y() {
				return D(O).y;
			},
			get width() {
				return r.size;
			},
			get hover() {
				return a;
			},
			get onevidence() {
				return r.onevidence;
			},
			get glyph() {
				return r.glyph;
			}
		});
	};
	s(V, (e) => {
		D(T) && D(O) && e(te);
	}), j(N), S(() => {
		P = A(N, "", P, {
			"inline-size": `${r.size}px`,
			"block-size": `${r.size}px`
		}), y(F, "width", r.size), y(F, "height", r.size), y(F, "aria-label", r.summary), L = d(I, 0, "ring svelte-bbgwfk", null, L, { enter: !r.settled && r.spec.kind === "donut" });
	}), i(n, N), x();
}
// upstream/src/shared/ui/data/Chart/Spark.svelte
var Tn = r("<path></path>"), En = r("<path pathLength=\"1\"></path>"), Dn = r("<svg role=\"img\" class=\"svelte-yumr6r\"><!></svg>"), On = p("<span class=\"spark svelte-yumr6r\"><!></span>");
function kn(e, n) {
	l(n, !0);
	let r = g(0), a = g(0), o = t(() => n.spec.x?.kind === "category"), c = t(() => n.shape.rows.map((e) => e.points[0]?.y ?? null)), p = t(() => {
		if (D(o)) return n.shape.domain;
		let e = D(c).filter((e) => e !== null);
		return e.length ? [Math.min(...e), Math.max(...e)] : [0, 1];
	}), m = t(() => Pe(D(p), [D(a) - 2, 2])), h = t(() => Pe([0, Math.max(1, n.shape.rows.length - 1)], [1, D(r) - 1])), v = t(() => Be(D(c).map((e, t) => e === null ? null : {
		x: D(h)(t),
		y: D(m)(e)
	})).map((e) => ze(e)).join("")), b = t(() => {
		if (!D(o)) return [];
		let e = Fe(n.shape.rows.length, [0, D(r)], .25, .1), t = D(m)(Math.max(D(p)[0], Math.min(0, D(p)[1])));
		return D(c).flatMap((n, r) => {
			if (n === null) return [];
			let i = D(m)(n), a = He(e.start(r), Math.min(i, t), e.width, Math.abs(t - i), Math.min(2, e.width / 2), "end", i <= t ? "up" : "down");
			return a ? [{
				index: r,
				d: a
			}] : [];
		});
	});
	var T = On(), E = w(T), O = (e) => {
		var t = Dn(), c = w(t), l = (e) => {
			var t = f(), r = C(t);
			u(r, 17, () => D(b), (e) => e.index, (e, t) => {
				var r = Tn();
				let a;
				S(() => {
					y(r, "d", D(t).d), y(r, "fill", n.shape.series[0]?.color), a = d(r, 0, "mark bar svelte-yumr6r", null, a, { enter: !n.settled });
				}), i(e, r);
			}), i(e, t);
		}, p = (e) => {
			var t = En();
			let r;
			S(() => {
				y(t, "d", D(v)), y(t, "stroke", n.shape.series[0]?.color), r = d(t, 0, "mark line svelte-yumr6r", null, r, { enter: !n.settled });
			}), i(e, t);
		};
		s(c, (e) => {
			D(o) ? e(l) : e(p, -1);
		}), j(t), S(() => {
			y(t, "width", D(r)), y(t, "height", D(a)), y(t, "aria-label", n.summary);
		}), i(e, t);
	};
	s(E, (e) => {
		D(r) && D(a) && e(O);
	}), j(T), _(T, "clientWidth", (e) => k(r, e)), _(T, "clientHeight", (e) => k(a, e)), i(e, T), x();
}
// upstream/src/shared/ui/data/Chart/Chart.svelte
var An = p("<span class=\"spark-box svelte-13itr0k\"><!></span>"), jn = p("<p class=\"headline svelte-13itr0k\"><span class=\"figure svelte-13itr0k\"> </span><span class=\"what svelte-13itr0k\"> </span></p>"), Mn = p("<div class=\"plot svelte-13itr0k\"><!></div>"), Nn = p("<div><!> <!></div>"), Pn = p("<p role=\"status\" class=\"caption svelte-13itr0k\"> </p>"), Fn = p("<p class=\"caption basis svelte-13itr0k\"> </p>"), In = p("<p class=\"caption svelte-13itr0k\"> </p>"), Ln = p("<button type=\"button\" class=\"copy svelte-13itr0k\"> </button>"), Rn = p("<th scope=\"col\" class=\"svelte-13itr0k\"> </th>"), zn = p("<td class=\"svelte-13itr0k\"> </td>"), Bn = p("<button type=\"button\" class=\"chip svelte-13itr0k\"> </button>"), Vn = p("<td class=\"cites svelte-13itr0k\"></td>"), Hn = p("<tr><th scope=\"row\" class=\"svelte-13itr0k\"> </th><!><!></tr>"), Un = p("<details class=\"svelte-13itr0k\"><summary class=\"svelte-13itr0k\"> </summary> <!> <!> <div class=\"values svelte-13itr0k\"><table class=\"svelte-13itr0k\"><caption class=\"svelte-13itr0k\"> </caption><thead><tr><th scope=\"col\" class=\"svelte-13itr0k\"> </th><!><!></tr></thead><tbody></tbody></table></div></details>"), Wn = p("<figure><!> <!> <!> <!></figure>");
function Gn(r, a) {
	let c = o();
	l(a, !0);
	let p = T(a, "detail", 3, "full"), m = {
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
	}, _ = g(v(M()));
	O(() => {
		if (D(_)) return;
		let e = setTimeout(() => k(_, !0), N("page") + 240);
		return () => clearTimeout(e);
	});
	let y = t(() => a.spec.kind === "spark"), E = t(() => p() !== "full"), P = t(() => p() === "tile"), I = t(() => !!a.spec.compact || D(y) || D(E)), L = t(() => nt(a.spec, Ce())), z = t(() => pt(a.spec, D(L))), B = t(() => a.spec.series.some((e) => e.points.some((e) => e.y !== null))), V = t(() => a.spec.kind === "donut" || a.spec.kind === "radial"), te = t(() => D(L).horizontal), H = new Intl.NumberFormat(void 0, {
		style: "percent",
		maximumFractionDigits: 0
	}), ne = t(() => D(y) || a.spec.kind === "heat" || D(E) ? [] : D(V) ? a.spec.compact ? [] : D(L).parts.map((e) => ({
		key: `p${e.index}`,
		label: e.label,
		color: e.color,
		share: a.spec.kind === "donut" ? D(L).total ? H.format(e.value / D(L).total) : "" : F(e.points[0], a.spec.y)
	})) : (a.spec.compact ? D(z).legend : dt(a.spec.series.length, !1)) === "rows" ? D(L).series : []), U = t(() => !D(y) && !D(E) && a.spec.values !== !1 && (!a.spec.compact || D(z).legend === "table")), G = t(() => ee(a.spec)), q = t(() => D(G) ? ae({
		low: ie(D(G).low),
		high: ie(D(G).high)
	}) : ""), J = t(() => {
		let e = [a.spec.x?.label, a.spec.y?.label].filter((e) => !!e?.trim()).join("; ");
		return [
			a.title,
			e,
			`${m[a.spec.kind]()}${D(q) ? `; ${D(q)}` : ""}`
		].filter(Boolean).join(". ");
	}), oe = t(() => a.spec.series.some((e) => e.points.some((e) => e.display !== void 0))), se = t(() => a.spec.series.some((e) => e.points.some((e) => e.evidence?.length))), le = t(() => a.spec.headline), de = t(() => D(I) ? 20 : Math.max(24, 10 + a.spec.series.length * 12)), X = t(() => D(P) && a.height ? a.height : a.spec.kind === "heat" ? (D(I) ? 0 : 24) + a.spec.series.length * (D(I) ? Math.max(6, Math.floor(132 / Math.max(1, a.spec.series.length))) : 20) : D(V) ? D(P) ? 150 : p() === "overview" ? 260 : a.spec.compact ? 132 : 188 : a.spec.kind === "radar" ? D(P) ? 150 : p() === "overview" ? 260 : 280 : D(te) ? (D(I) ? 8 : 30) + D(L).rows.length * D(de) : D(P) ? 96 : p() === "overview" ? 200 : a.spec.compact ? 132 : 220), me = t(() => {
		if (a.spec.compact && D(z).lead) return {
			value: D(z).lead.share,
			label: D(z).lead.label
		};
		if (D(le)) return D(le);
		if (a.spec.kind === "radial") {
			let e = D(L).parts[0];
			return e ? {
				value: F(e.points[0], a.spec.y),
				label: e.label
			} : null;
		}
		return {
			value: R(D(L).total, a.spec.y),
			label: ke()
		};
	}), ge = g(!1);
	function _e() {
		navigator.clipboard.writeText(gt(a.spec)).then(() => {
			k(ge, !0), setTimeout(() => k(ge, !1), 1600);
		}, () => k(ge, !1));
	}
	var Q = f(), be = C(Q), Se = (e) => {
		var t = An();
		let n;
		var r = w(t), o = (e) => {
			kn(e, {
				get spec() {
					return a.spec;
				},
				get shape() {
					return D(L);
				},
				get summary() {
					return D(J);
				},
				get settled() {
					return D(_);
				}
			});
		};
		s(r, (e) => {
			D(B) && e(o);
		}), j(t), S(() => n = A(t, "", n, { "block-size": a.height ? `${a.height}px` : void 0 })), i(e, t);
	}, we = (r) => {
		var o = Wn();
		let l;
		var f = w(o), m = (t) => {
			var n = jn(), r = w(n), a = w(r, !0);
			j(r);
			var o = b(r), s = w(o, !0);
			j(o), j(n), S(() => {
				e(a, D(le).value), e(s, D(le).label);
			}), i(t, n);
		};
		s(f, (e) => {
			D(le) && !D(P) && (!D(V) || a.spec.kind === "radial" && D(L).parts.length > 1) && e(m);
		});
		var g = b(f, 2), v = (e) => {
			var n = Nn();
			let r;
			var o = w(n), l = (e) => {
				var t = Mn();
				let n;
				_n(w(t), {
					get spec() {
						return a.spec;
					},
					get shape() {
						return D(L);
					},
					get detail() {
						return p();
					},
					get summary() {
						return D(J);
					},
					get settled() {
						return D(_);
					},
					get onevidence() {
						return a.onevidence;
					},
					get glyph() {
						return a.glyph;
					}
				}), j(t), S(() => n = A(t, "", n, { "block-size": `${D(X)}px` })), i(e, t);
			}, u = (e) => {
				wn(e, {
					get spec() {
						return a.spec;
					},
					get shape() {
						return D(L);
					},
					get size() {
						return D(X);
					},
					get detail() {
						return p();
					},
					get summary() {
						return D(J);
					},
					get settled() {
						return D(_);
					},
					get middle() {
						return D(me);
					},
					get onevidence() {
						return a.onevidence;
					},
					get glyph() {
						return a.glyph;
					}
				});
			}, f = (e) => {
				on(e, {
					get spec() {
						return a.spec;
					},
					get shape() {
						return D(L);
					},
					get height() {
						return D(X);
					},
					get compact() {
						return D(I);
					},
					get quiet() {
						return D(E);
					},
					get summary() {
						return D(J);
					},
					get settled() {
						return D(_);
					},
					get onevidence() {
						return a.onevidence;
					},
					get glyph() {
						return a.glyph;
					}
				});
			}, m = (e) => {
				Jt(e, {
					get spec() {
						return a.spec;
					},
					get shape() {
						return D(L);
					},
					get labels() {
						return D(z);
					},
					get detail() {
						return p();
					},
					get summary() {
						return D(J);
					},
					get uid() {
						return c;
					},
					get height() {
						return D(X);
					},
					get settled() {
						return D(_);
					},
					get onevidence() {
						return a.onevidence;
					},
					get glyph() {
						return a.glyph;
					}
				});
			};
			s(o, (e) => {
				a.spec.kind === "radar" ? e(l) : D(V) ? e(u, 1) : a.spec.kind === "heat" ? e(f, 2) : e(m, -1);
			});
			var h = b(o, 2), g = (e) => {
				{
					let n = t(() => D(V) ? "list" : a.spec.compact ? "rows" : "row");
					Qt(e, {
						get entries() {
							return D(ne);
						},
						get layout() {
							return D(n);
						}
					});
				}
			};
			s(h, (e) => {
				D(ne).length && e(g);
			}), j(n), S(() => r = d(n, 1, "body svelte-13itr0k", null, r, { beside: D(V) && D(ne).length })), i(e, n);
		}, y = (t) => {
			var n = Pn(), r = w(n, !0);
			j(n), S((t) => e(r, t), [() => je()]), i(t, n);
		};
		s(g, (e) => {
			D(B) ? e(v) : e(y, -1);
		});
		var x = b(g, 2), C = (t) => {
			var n = Fn(), r = w(n, !0);
			j(n), S(() => e(r, a.spec.basis)), i(t, n);
		}, T = t(() => a.spec.basis?.trim() && !D(E));
		s(x, (e) => {
			D(T) && e(C);
		});
		var O = b(x, 2), k = (t) => {
			var r = Un(), o = w(r), c = w(o, !0);
			j(o);
			var l = b(o, 2), d = (t) => {
				var n = In(), r = w(n, !0);
				j(n), S((t) => e(r, t), [() => Te()]), i(t, n);
			};
			s(l, (e) => {
				D(oe) && e(d);
			});
			var f = b(l, 2), p = (t) => {
				var n = Ln(), r = w(n, !0);
				j(n), S((t) => e(r, t), [() => D(ge) ? re() : W()]), h("click", n, _e), i(t, n);
			};
			s(f, (e) => {
				D(I) || e(p);
			});
			var m = b(f, 2), g = w(m), _ = w(g), v = w(_, !0);
			j(_);
			var y = b(_), x = w(y), C = w(x), T = w(C, !0);
			j(C);
			var E = b(C);
			u(E, 17, () => a.spec.series, n, (t, n) => {
				var r = Rn(), o = w(r, !0);
				j(r), S(() => e(o, D(n).name || a.spec.y?.label || "")), i(t, r);
			});
			var O = b(E), k = (t) => {
				var n = Rn(), r = w(n, !0);
				j(n), S((t) => e(r, t), [() => De()]), i(t, n);
			};
			s(O, (e) => {
				D(se) && e(k);
			}), j(x), j(y);
			var A = b(y);
			u(A, 21, () => D(L).rows, (e) => e.key, (t, r) => {
				var o = Hn(), c = w(o), l = w(c, !0);
				j(c);
				var d = b(c);
				u(d, 17, () => D(r).points, n, (t, n) => {
					var r = zn(), o = w(r, !0);
					j(r), S((t) => e(o, t), [() => F(D(n), a.spec.y)]), i(t, r);
				});
				var f = b(d), p = (t) => {
					var o = Vn();
					u(o, 21, () => D(r).points.flatMap((e) => e?.evidence ?? []), n, (t, n) => {
						var r = Bn(), o = w(r, !0);
						j(r), S(() => {
							r.disabled = !a.onevidence, e(o, D(n).origin || D(n).label);
						}), h("click", r, () => a.onevidence?.(D(n))), i(t, r);
					}), j(o), i(t, o);
				};
				s(f, (e) => {
					D(se) && e(p);
				}), j(o), S(() => e(l, D(r).label)), i(t, o);
			}), j(A), j(g), j(m), j(r), S((t) => {
				e(c, t), e(v, a.title), e(T, a.spec.x?.label ?? "");
			}, [() => D(oe) ? K() : Ne()]), i(t, r);
		};
		s(O, (e) => {
			D(U) && e(k);
		}), j(o), S(() => l = d(o, 1, `chart ${p() ?? ""}`, "svelte-13itr0k", l, {
			compact: a.spec.compact,
			round: D(V),
			radar: a.spec.kind === "radar"
		})), i(r, o);
	};
	s(be, (e) => {
		D(y) ? e(Se) : e(we, -1);
	}), i(r, Q), x();
}
a(["click"]);
export { Gn as default };
