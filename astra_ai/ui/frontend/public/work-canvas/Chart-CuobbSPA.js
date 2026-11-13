import "./disclose-version-DFvUDwEH.js";
import { A as e, B as t, Et as n, F as r, H as i, J as a, K as o, M as s, N as c, Nt as l, Q as u, R as d, S as f, Tt as p, U as m, V as h, W as g, _t as _, at as v, c as y, ct as b, dt as x, h as S, ht as C, it as w, lt as T, pt as E, q as D, r as O, t as k, ut as A, x as j } from "./index-client-oI5R0J23.js";
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
	#e = C(null);
	get index() {
		return u(this.#e);
	}
	set index(e) {
		E(this.#e, e, !0);
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
var _t = i("<span class=\"name svelte-i8crd8\"> </span>"), vt = i("<span class=\"row svelte-i8crd8\"><span></span> <!> <span> </span></span>"), yt = i("<button type=\"button\" class=\"chip svelte-i8crd8\"><!> <span class=\"host svelte-i8crd8\"> </span></button>"), bt = i("<span class=\"chips svelte-i8crd8\"></span>"), xt = i("<div class=\"chart-tooltip svelte-i8crd8\"><span class=\"label svelte-i8crd8\"> </span> <!> <!></div>");
function St(i, a) {
	n(a, !0);
	let o = O(a, "indicator", 3, "dot");
	var m = xt(), g = b(m), _ = b(g, !0);
	l(g);
	var v = A(g, 2);
	s(v, 17, () => a.readout.rows, c, (e, n) => {
		var i = vt(), a = b(i);
		let s;
		var c = A(a, 2), p = (e) => {
			var r = _t(), i = b(r, !0);
			l(r), w(() => d(i, u(n).name)), t(e, r);
		};
		r(c, (e) => {
			u(n).name && e(p);
		});
		var m = A(c, 2);
		let h;
		var g = b(m, !0);
		l(m), l(i), w(() => {
			f(a, 1, `indicator ${o() ?? ""}`, "svelte-i8crd8"), s = j(a, "", s, { "--indicator": u(n).color }), h = f(m, 1, "value svelte-i8crd8", null, h, { alone: !u(n).name }), d(g, u(n).text);
		}), t(e, i);
	});
	var y = A(v, 2), x = (n) => {
		var i = bt();
		s(i, 21, () => a.readout.evidence, (e) => e.key, (n, i) => {
			var o = yt(), s = b(o), c = (n) => {
				var r = h(), o = T(r);
				e(o, () => a.glyph, () => u(i)), t(n, r);
			};
			r(s, (e) => {
				a.glyph && e(c);
			});
			var f = A(s, 2), p = b(f, !0);
			l(f), l(o), w(() => {
				o.disabled = !a.onevidence, S(o, "title", u(i).label), d(p, u(i).file ? u(i).label : u(i).origin || u(i).label);
			}), D("click", o, () => a.onevidence?.(u(i))), t(n, o);
		}), l(i), t(n, i);
	};
	r(y, (e) => {
		a.readout.evidence.length && e(x);
	}), l(m), w(() => d(_, a.readout.title)), t(i, m), p();
}
o(["click"]);
// upstream/src/shared/ui/data/Chart/Tip.svelte
var Ct = i("<div class=\"tip svelte-1bbc4u3\" role=\"presentation\"><!></div>");
function wt(e, r) {
	n(r, !0);
	let i = O(r, "indicator", 3, "dot"), o = C(0), s = C(0), c = _(() => Math.max(0, Math.min(r.x - u(o) / 2, r.width - u(o)))), d = _(() => r.y - u(s) - 10 >= -8 ? r.y - u(s) - 10 : r.y + 14);
	var f = Ct();
	let m;
	St(b(f), {
		get readout() {
			return r.readout;
		},
		get indicator() {
			return i();
		},
		get onevidence() {
			return r.onevidence;
		},
		get glyph() {
			return r.glyph;
		}
	}), l(f), w(() => m = j(f, "", m, {
		left: `${u(c)}px`,
		top: `${u(d)}px`
	})), a("pointerenter", f, () => r.hover.hold()), a("pointerleave", f, () => r.hover.hide()), y(f, "clientWidth", (e) => E(o, e)), y(f, "clientHeight", (e) => E(s, e)), t(e, f), p();
}
// upstream/src/shared/ui/data/Chart/Cartesian.svelte
var Tt = m("<linearGradient x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0%\"></stop><stop offset=\"100%\" stop-opacity=\"0.02\"></stop></linearGradient>"), Et = m("<defs></defs>"), Dt = m("<line class=\"svelte-ocimr6\"></line>"), Ot = m("<g class=\"grid svelte-ocimr6\" aria-hidden=\"true\"></g>"), kt = m("<line class=\"zero svelte-ocimr6\"></line>"), At = m("<rect class=\"cursor svelte-ocimr6\" rx=\"6\"></rect>"), jt = m("<path></path>"), Mt = m("<circle r=\"3.5\"></circle>"), Nt = m("<!><path pathLength=\"1\"></path><!>", 1), Pt = m("<circle r=\"4.5\" class=\"focus svelte-ocimr6\"></circle>"), Ft = m("<line class=\"cursor-line svelte-ocimr6\"></line><!>", 1), It = m("<!><!>", 1), Lt = m("<text> </text>"), Rt = m("<text class=\"tick svelte-ocimr6\" text-anchor=\"middle\"> </text>"), zt = m("<text class=\"tick svelte-ocimr6\" text-anchor=\"end\" dominant-baseline=\"central\"> </text>"), Bt = m("<g class=\"axis\" aria-hidden=\"true\"></g>"), Vt = m("<text class=\"tick name svelte-ocimr6\" text-anchor=\"end\" dominant-baseline=\"central\"><title> </title> </text>"), Ht = m("<text class=\"tick svelte-ocimr6\" text-anchor=\"start\"> </text>"), Ut = m("<text class=\"tick svelte-ocimr6\" text-anchor=\"end\"> </text>"), Wt = m("<text class=\"value end svelte-ocimr6\" dominant-baseline=\"central\" text-anchor=\"start\"> </text>"), Gt = m("<g class=\"axis\" aria-hidden=\"true\"><!><!></g><!>", 1), Kt = m("<svg role=\"img\"><!><!><!><!><!><!><!></svg><!>", 1), qt = i("<div class=\"cartesian svelte-ocimr6\"><!></div>");
function Jt(e, i) {
	n(i, !0);
	let o = 6.5, m = C(0), g = new Ke();
	k(() => g.dispose());
	let v = _(() => i.detail !== "full"), x = _(() => i.detail === "tile"), O = _(() => !!i.spec.compact || u(v)), M = _(() => i.spec.kind === "line" || i.spec.kind === "area"), N = _(() => i.shape.horizontal), P = _(() => i.shape.scale === "band"), R = _(() => i.shape.layout === "stack"), z = _(() => !u(v) && (i.spec.compact ? i.labels.values : (i.spec.kind === "bars" || i.spec.kind === "range") && i.spec.series.length === 1 && i.shape.rows.length <= 12)), B = _(() => !u(O) && !u(z)), ee = _(() => i.spec.kind === "line" && !u(x) && i.shape.rows.length <= 16 && i.spec.series.length <= 3), V = (e, t) => i.spec.compact ? ct(e.points[t], i.spec.y) : F(e.points[t], i.spec.y), te = _(() => Math.max(24, ...i.shape.ticks.map((e) => I(e, i.spec.y).length * o + 10))), H = _(() => Math.min(200, Math.max(...i.shape.rows.map((e) => e.label.length * o), 0) + 12)), ne = _(() => Math.max(24, ...i.shape.rows.flatMap((e) => e.points.map((t, n) => V(e, n).length * o + 12)))), re = _(() => {
		if (u(x)) return {
			top: 2,
			right: 2,
			bottom: 2,
			left: 2
		};
		if (u(N)) return {
			top: 4,
			right: u(z) || i.labels.values ? u(ne) : 8,
			bottom: u(B) ? 22 : 4,
			left: u(v) ? 4 : u(H)
		};
		let e = i.spec.compact && !u(v) && (i.labels.categories || !!i.labels.ends);
		return {
			top: u(z) || i.spec.compact && i.labels.values && !u(v) ? 20 : 8,
			right: i.spec.compact && i.labels.ends && !u(v) ? 36 : u(M) ? 14 : 4,
			bottom: u(v) ? 4 : i.spec.compact ? e ? 18 : 4 : 24,
			left: u(B) ? u(te) : u(M) ? 14 : 0
		};
	}), U = _(() => u(re).left), W = _(() => Math.max(u(U) + 1, u(m) - u(re).right)), G = _(() => u(re).top), K = _(() => Math.max(u(G) + 1, i.height - u(re).bottom)), q = _(() => u(N) ? Pe(i.shape.domain, [u(U), u(W)]) : Pe(i.shape.domain, [u(K), u(G)])), ie = _(() => u(q)(Math.max(i.shape.domain[0], Math.min(0, i.shape.domain[1])))), J = _(() => Fe(i.shape.rows.length, u(N) ? [u(G), u(K)] : [u(U), u(W)], u(x) ? .2 : .28, .1)), ae = _(() => {
		let e = i.shape.rows.map((e) => e.at);
		return [Math.min(...e), Math.max(...e)];
	}), oe = _(() => i.shape.scale === "index" ? Pe([0, Math.max(1, i.shape.rows.length - 1)], [u(U), u(W)]) : Pe(u(ae), [u(U), u(W)]));
	function Y(e) {
		return u(P) ? u(J).start(e.index) + u(J).width / 2 : i.shape.rows.length === 1 ? (u(U) + u(W)) / 2 : u(oe)(e.at);
	}
	let se = _(() => {
		let e = ce();
		return Math.max(2, Math.min(u(x) ? 3 : 6, e / 2));
	});
	function ce() {
		return u(R) || i.spec.series.length === 1 ? u(J).width : Fe(i.spec.series.length, [0, u(J).width], .14, 0).width;
	}
	let le = _(() => {
		if (u(M)) return [];
		let e = [], t = Fe(i.spec.series.length, [0, u(J).width], .14, 0);
		return i.spec.series.forEach((n, r) => {
			i.shape.rows.forEach((n) => {
				let a = n.points[r];
				if (!a || a.y === null) return;
				let o, s, c = "end";
				if (u(R)) {
					if ([o, s] = i.shape.stacks[r][n.index], o === s) return;
					let e = s >= o;
					i.shape.stacks.slice(r + 1).some((t) => {
						let [r, i] = t[n.index];
						return r !== i && i >= r === e;
					}) && (c = "none");
				} else i.spec.kind === "range" ? (o = a.y, s = a.y2 ?? a.y, c = "all") : (o = Math.max(i.shape.domain[0], Math.min(0, i.shape.domain[1])), s = a.y);
				let l = u(R) || i.spec.series.length === 1 ? 0 : t.start(r), d = u(R) || i.spec.series.length === 1 ? u(J).width : t.width, f = Math.min(d, u(N) ? 28 : 64), p = u(J).start(n.index) + l + (d - f) / 2, m = u(q)(o), h = u(q)(s), g = Math.min(f, 8);
				if (i.spec.kind === "range" && Math.abs(h - m) < g) {
					let e = (m + h) / 2, t = g / 2 * (h >= m ? 1 : -1);
					[m, h] = [e - t, e + t];
				}
				let _ = u(R) && o !== 0 ? 2 : 0, v, y;
				if (u(N)) {
					let e = h >= m, t = e ? m + _ : h;
					v = He(t, p, (e ? h : m - _) - t, f, u(se), c, e ? "right" : "left"), y = i.spec.kind === "range" ? "center" : e ? "left" : "right";
				} else {
					let e = h <= m, t = e ? h : m + _;
					v = He(p, t, f, (e ? m - _ : h) - t, u(se), c, e ? "up" : "down"), y = i.spec.kind === "range" ? "center" : e ? "bottom" : "top";
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
	}), ue = _(() => u(M) ? i.shape.series.map((e, t) => {
		let n = i.shape.rows.map((e) => {
			let n = e.points[t]?.y;
			return n == null ? null : {
				x: Y(e),
				y: u(q)(u(R) ? i.shape.stacks[t][e.index][1] : n)
			};
		}), r = i.shape.rows.map((e) => u(R) ? {
			x: Y(e),
			y: u(q)(i.shape.stacks[t][e.index][0])
		} : {
			x: Y(e),
			y: u(ie)
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
	}) : []), de = _(() => {
		if (u(N)) return i.shape.rows;
		if (i.shape.scale === "index") {
			let e = Math.max(1, Math.ceil(i.shape.rows.length / 8));
			return i.shape.rows.filter((t) => t.index % e === 0);
		}
		let e = Math.max(...i.shape.rows.map((e) => X(e).length * o), 0) + 10, t = Math.max(1, u(W) - u(U)), n = Math.max(1, Math.ceil(i.shape.rows.length * e / t));
		return i.shape.rows.filter((e, t) => t % n === 0);
	}), fe = _(() => new Intl.DateTimeFormat(void 0, u(ae)[1] - u(ae)[0] > 1728e5 ? {
		month: "short",
		day: "numeric"
	} : {
		hour: "numeric",
		minute: "2-digit"
	}));
	function X(e) {
		return i.shape.scale === "time" ? u(fe).format(e.at) : i.shape.scale === "linear" ? L(e.at, "linear") : e.label;
	}
	function pe(e, t) {
		let n = Math.max(3, Math.floor(t / o));
		return e.length > n ? `${e.slice(0, n - 1).trimEnd()}…` : e;
	}
	function me(e, t) {
		let n = e.points[t];
		if (!n || n.y === null) return null;
		let r = n.y2 ?? n.y, a = r >= 0, o = i.spec.series.length > 1 && !u(R), s = Fe(i.spec.series.length, [0, u(J).width], .14, 0), c = o ? s.start(t) + s.width / 2 : u(J).width / 2;
		return u(N) ? {
			x: u(q)(r) + (a ? 6 : -6),
			y: u(J).start(e.index) + c,
			anchor: a ? "start" : "end"
		} : {
			x: u(J).start(e.index) + c,
			y: u(q)(r) + (a ? -7 : 14),
			anchor: "middle"
		};
	}
	let he = _(() => i.shape.rows.findLast((e) => e.points[0] && e.points[0].y !== null));
	function ge(e) {
		let t = e.currentTarget.getBoundingClientRect(), n = u(N) ? e.clientY - t.top : e.clientX - t.left, r;
		if (u(P)) r = Math.floor((n - u(J).start(0) + (u(J).step - u(J).width) / 2) / u(J).step);
		else {
			let e = 0, t = Infinity;
			for (let r of i.shape.rows) {
				let i = Math.abs(Y(r) - n);
				i < t && ([e, t] = [r.index, i]);
			}
			r = e;
		}
		g.show(Math.max(0, Math.min(i.shape.rows.length - 1, r)));
	}
	let Z = _(() => g.index === null ? null : i.shape.rows[g.index] ?? null), _e = _(() => u(Z) ? mt(i.spec, i.shape, u(Z).index) : null), ve = _(() => {
		if (!u(Z)) return null;
		let e = u(Z).points.flatMap((e, t) => !e || e.y === null ? [] : u(R) ? [i.shape.stacks[t][u(Z).index][1]] : [e.y2 ?? e.y]), t = e.length ? Math.max(...e) : 0;
		return u(N) ? {
			x: u(q)(t),
			y: u(J).start(u(Z).index)
		} : {
			x: Y(u(Z)),
			y: Math.min(u(q)(t), u(K)) - (u(M) ? 4 : 0)
		};
	});
	var Q = qt();
	let ye;
	var be = b(Q), xe = (e) => {
		var n = Kt(), o = T(n);
		let p;
		var y = b(o), C = (e) => {
			var n = Et();
			s(n, 23, () => i.shape.series, (e) => e.key, (e, n, r) => {
				var a = Tt(), o = b(a), s = A(o);
				l(a), w(() => {
					S(a, "id", `${i.uid}-wash-${u(r)}`), S(o, "stop-color", u(n).color), S(o, "stop-opacity", u(x) ? .5 : .36), S(s, "stop-color", u(n).color);
				}), t(e, a);
			}), l(n), t(e, n);
		};
		r(y, (e) => {
			i.spec.kind === "area" && e(C);
		});
		var E = A(y), k = (e) => {
			var n = Ot();
			s(n, 20, () => i.shape.ticks, (e) => e, (e, n) => {
				let i = _(() => Math.round(u(q)(n)) + .5);
				var a = h(), o = T(a), s = (e) => {
					var n = Dt();
					w(() => {
						S(n, "x1", u(i)), S(n, "x2", u(i)), S(n, "y1", u(G)), S(n, "y2", u(K));
					}), t(e, n);
				}, c = (e) => {
					var n = Dt();
					w(() => {
						S(n, "x1", u(U)), S(n, "x2", u(W)), S(n, "y1", u(i)), S(n, "y2", u(i));
					}), t(e, n);
				};
				r(o, (e) => {
					u(N) ? e(s) : e(c, -1);
				}), t(e, a);
			}), l(n), t(e, n);
		};
		r(E, (e) => {
			!u(x) && !(u(N) && u(z)) && e(k);
		});
		var F = A(E), L = (e) => {
			let n = _(() => Math.round(u(ie)) + .5);
			var i = h(), a = T(i), o = (e) => {
				var r = kt();
				w(() => {
					S(r, "x1", u(n)), S(r, "x2", u(n)), S(r, "y1", u(G)), S(r, "y2", u(K));
				}), t(e, r);
			}, s = (e) => {
				var r = kt();
				w(() => {
					S(r, "x1", u(U)), S(r, "x2", u(W)), S(r, "y1", u(n)), S(r, "y2", u(n));
				}), t(e, r);
			};
			r(a, (e) => {
				u(N) ? e(o) : e(s, -1);
			}), t(e, i);
		};
		r(F, (e) => {
			i.shape.domain[0] < 0 && i.shape.domain[1] > 0 && e(L);
		});
		var R = A(F), te = (e) => {
			let n = _(() => u(J).start(u(Z).index) - (u(J).step - u(J).width) / 2);
			var i = h(), a = T(i), o = (e) => {
				var r = At();
				w(() => {
					S(r, "x", u(U)), S(r, "y", u(n)), S(r, "width", u(W) - u(U)), S(r, "height", u(J).step);
				}), t(e, r);
			}, s = (e) => {
				var r = At();
				w(() => {
					S(r, "x", u(n)), S(r, "y", u(G)), S(r, "width", u(J).step), S(r, "height", u(K) - u(G));
				}), t(e, r);
			};
			r(a, (e) => {
				u(N) ? e(o) : e(s, -1);
			}), t(e, i);
		};
		r(R, (e) => {
			u(Z) && u(P) && e(te);
		});
		var ne = A(R), re = (e) => {
			var n = It(), a = T(n);
			s(a, 19, () => u(ue), (e) => e.key, (e, n, a) => {
				var o = Nt(), l = T(o), d = (e) => {
					var r = jt();
					let o;
					w(() => {
						S(r, "d", u(n).area), o = f(r, 0, "mark area svelte-ocimr6", null, o, { enter: !i.settled }), S(r, "fill", `url(#${i.uid}-wash-${u(a)})`);
					}), t(e, r);
				};
				r(l, (e) => {
					i.spec.kind === "area" && e(d);
				});
				var p = A(l);
				let m;
				var g = A(p), _ = (e) => {
					var a = h(), o = T(a);
					s(o, 17, () => u(n).dots, c, (e, a) => {
						var o = h(), s = T(o), c = (e) => {
							var r = Mt();
							let o;
							w(() => {
								S(r, "cx", u(a).x), S(r, "cy", u(a).y), o = f(r, 0, "mark dot svelte-ocimr6", null, o, { enter: !i.settled }), S(r, "fill", u(n).color);
							}), t(e, r);
						};
						r(s, (e) => {
							u(a) && e(c);
						}), t(e, o);
					}), t(e, a);
				};
				r(g, (e) => {
					u(ee) && e(_);
				}), w(() => {
					S(p, "d", u(n).line), m = f(p, 0, "mark line svelte-ocimr6", null, m, { enter: !i.settled }), S(p, "stroke", u(n).color);
				}), t(e, o);
			});
			var o = A(a), l = (e) => {
				let n = _(() => Y(u(Z)));
				var i = Ft(), a = T(i), o = A(a);
				s(o, 17, () => u(ue), (e) => e.key, (e, n) => {
					let i = _(() => u(n).dots[u(Z).index]);
					var a = h(), o = T(a), s = (e) => {
						var r = Pt();
						w(() => {
							S(r, "cx", u(i).x), S(r, "cy", u(i).y), S(r, "fill", u(n).color);
						}), t(e, r);
					};
					r(o, (e) => {
						u(i) && e(s);
					}), t(e, a);
				}), w(() => {
					S(a, "x1", u(n)), S(a, "x2", u(n)), S(a, "y1", u(G)), S(a, "y2", u(K));
				}), t(e, i);
			};
			r(o, (e) => {
				u(Z) && !u(v) && e(l);
			}), t(e, n);
		}, ae = (e) => {
			var n = It(), a = T(n);
			s(a, 17, () => u(le), (e) => e.key, (e, n) => {
				var r = jt();
				let a, o;
				w((e) => {
					S(r, "d", u(n).d), S(r, "fill", u(n).color), a = f(r, 0, "mark bar svelte-ocimr6", null, a, {
						enter: !i.settled,
						dim: u(Z) !== null && u(Z).index !== u(n).index
					}), o = j(r, "", o, e);
				}, [() => ({
					"transform-origin": u(n).origin,
					"animation-delay": i.settled ? void 0 : `${Math.min(u(n).index * 18, 180)}ms`
				})]), t(e, r);
			});
			var o = A(a), c = (e) => {
				var n = h(), a = T(n);
				s(a, 19, () => i.shape.series, (e) => e.key, (e, n, a) => {
					var o = h(), c = T(o);
					s(c, 17, () => i.shape.rows, (e) => e.key, (e, n) => {
						let o = _(() => me(u(n), u(a)));
						var s = h(), c = T(s), p = (e) => {
							var r = Lt();
							let s;
							var c = b(r, !0);
							l(r), w((e) => {
								S(r, "x", u(o).x), S(r, "y", u(o).y), S(r, "text-anchor", u(o).anchor), S(r, "dominant-baseline", u(N) ? "central" : "auto"), s = f(r, 0, "value svelte-ocimr6", null, s, { enter: !i.settled }), d(c, e);
							}, [() => V(u(n), u(a))]), t(e, r);
						};
						r(c, (e) => {
							u(o) && e(p);
						}), t(e, s);
					}), t(e, o);
				}), t(e, n);
			};
			r(o, (e) => {
				u(z) && e(c);
			}), t(e, n);
		};
		r(ne, (e) => {
			u(M) ? e(re) : e(ae, -1);
		});
		var oe = A(ne), se = (e) => {
			var n = Bt();
			s(n, 20, () => i.shape.ticks, (e) => e, (e, n) => {
				var a = h(), o = T(a), s = (e) => {
					var r = Rt(), a = b(r, !0);
					l(r), w((e, t) => {
						S(r, "x", e), S(r, "y", u(K) + 16), d(a, t);
					}, [() => u(q)(n), () => I(n, i.spec.y)]), t(e, r);
				}, c = (e) => {
					var r = zt(), a = b(r, !0);
					l(r), w((e, t) => {
						S(r, "x", u(U) - 8), S(r, "y", e), d(a, t);
					}, [() => u(q)(n), () => I(n, i.spec.y)]), t(e, r);
				};
				r(o, (e) => {
					u(N) ? e(s) : e(c, -1);
				}), t(e, a);
			}), l(n), t(e, n);
		};
		r(oe, (e) => {
			u(B) && e(se);
		});
		var ce = A(oe), fe = (e) => {
			var n = Bt();
			s(n, 21, () => u(de), (e) => e.key, (e, n) => {
				var a = h(), o = T(a), s = (e) => {
					var r = Vt(), i = b(r), a = b(i, !0);
					l(i);
					var o = A(i, 1, !0);
					l(r), w((e, t) => {
						S(r, "x", u(U) - 8), S(r, "y", e), d(a, u(n).label), d(o, t);
					}, [() => u(J).start(u(n).index) + u(J).width / 2, () => pe(u(n).label, u(H) - 12)]), t(e, r);
				}, c = (e) => {
					var r = Lt();
					let a;
					var o = b(r, !0);
					l(r), w((e, t) => {
						a = f(r, 0, "tick svelte-ocimr6", null, a, { on: u(Z)?.index === u(n).index }), S(r, "x", e), S(r, "y", u(K) + 16), S(r, "text-anchor", !u(P) && u(n).index === 0 && i.shape.rows.length > 1 ? "start" : !u(P) && u(n).index === i.shape.rows.length - 1 && i.shape.rows.length > 1 ? "end" : "middle"), d(o, t);
					}, [() => Y(u(n)), () => X(u(n))]), t(e, r);
				};
				r(o, (e) => {
					u(N) ? e(s) : e(c, -1);
				}), t(e, a);
			}), l(n), t(e, n);
		}, Q = (e) => {
			let n = _(() => i.shape.rows[0]), a = _(() => i.shape.rows.at(-1));
			var o = Gt(), s = T(o), c = b(s), f = (e) => {
				var r = Ht(), i = b(r, !0);
				l(r), w((e, t) => {
					S(r, "x", e), S(r, "y", u(K) + 14), d(i, t);
				}, [() => Y(u(n)), () => X(u(n))]), t(e, r);
			};
			r(c, (e) => {
				u(n) && e(f);
			});
			var p = A(c), m = (e) => {
				var n = Ut(), r = b(n, !0);
				l(n), w((e, t) => {
					S(n, "x", e), S(n, "y", u(K) + 14), d(r, t);
				}, [() => Y(u(a)), () => X(u(a))]), t(e, n);
			};
			r(p, (e) => {
				u(a) && u(a) !== u(n) && e(m);
			}), l(s);
			var g = A(s), v = (e) => {
				let n = _(() => u(ue)[0]?.dots[u(he).index]);
				var a = h(), o = T(a), s = (e) => {
					var r = Wt(), a = b(r, !0);
					l(r), w(() => {
						S(r, "x", u(n).x + 6), S(r, "y", u(n).y), d(a, i.labels.ends.value);
					}), t(e, r);
				};
				r(o, (e) => {
					u(n) && e(s);
				}), t(e, a);
			};
			r(g, (e) => {
				u(he) && e(v);
			}), t(e, o);
		};
		r(ce, (e) => {
			!u(v) && (!u(O) || i.labels.categories) ? e(fe) : !u(v) && i.labels.ends && e(Q, 1);
		}), l(o);
		var ye = A(o), be = (e) => {
			{
				let t = _(() => u(M) ? "line" : "dot");
				wt(e, {
					get readout() {
						return u(_e);
					},
					get x() {
						return u(ve).x;
					},
					get y() {
						return u(ve).y;
					},
					get width() {
						return u(m);
					},
					get hover() {
						return g;
					},
					get indicator() {
						return u(t);
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
		r(ye, (e) => {
			u(_e) && u(ve) && !u(v) && e(be);
		}), w(() => {
			S(o, "width", u(m)), S(o, "height", i.height), S(o, "aria-label", i.summary), p = f(o, 0, "svelte-ocimr6", null, p, { lying: u(N) });
		}), D("pointermove", o, function(...e) {
			(u(v) ? void 0 : ge)?.apply(this, e);
		}), a("pointerleave", o, function(...e) {
			(u(v) ? void 0 : () => g.hide())?.apply(this, e);
		}), t(e, n);
	};
	r(be, (e) => {
		u(m) && e(xe);
	}), l(Q), w(() => ye = j(Q, "", ye, { "block-size": `${i.height}px` })), y(Q, "clientWidth", (e) => E(m, e)), t(e, Q), p();
}
o(["pointermove"]);
// upstream/src/shared/ui/data/Chart/ChartLegend.svelte
var Yt = i("<span class=\"share svelte-lct99f\"> </span>"), Xt = i("<li class=\"svelte-lct99f\"><span class=\"swatch svelte-lct99f\"></span><span class=\"name svelte-lct99f\"> </span><!></li>"), Zt = i("<ul></ul>");
function Qt(e, n) {
	let i = O(n, "layout", 3, "row");
	var a = Zt();
	s(a, 21, () => n.entries, (e) => e.key, (e, n) => {
		var i = Xt(), a = b(i);
		let o;
		var s = A(a), c = b(s, !0);
		l(s);
		var f = A(s), p = (e) => {
			var r = Yt(), i = b(r, !0);
			l(r), w(() => d(i, u(n).share)), t(e, r);
		};
		r(f, (e) => {
			u(n).share && e(p);
		}), l(i), w(() => {
			o = j(a, "", o, { background: u(n).color }), d(c, u(n).label);
		}), t(e, i);
	}), l(a), w(() => f(a, 1, `chart-legend ${i() ?? ""}`, "svelte-lct99f")), t(e, a);
}
// upstream/src/shared/ui/data/Chart/Heat.svelte
var $t = m("<rect rx=\"2\" role=\"presentation\"></rect>"), en = m("<text class=\"tick svelte-9xl1lm\" text-anchor=\"end\" dominant-baseline=\"central\"> </text>"), tn = m("<text class=\"tick svelte-9xl1lm\" text-anchor=\"middle\"> </text>"), nn = m("<g aria-hidden=\"true\"><!><!></g>"), rn = m("<svg role=\"img\" class=\"svelte-9xl1lm\"><!><!></svg><!>", 1), an = i("<div class=\"heat svelte-9xl1lm\"><!></div>");
function on(e, i) {
	n(i, !0);
	let o = 6.5, m = C(0), g = new Ke();
	k(() => g.dispose());
	let v = _(() => i.compact ? 0 : Math.max(...i.spec.series.map((e) => e.name.length * o), 0) + 14), x = _(() => i.height - (i.compact ? 0 : 20)), D = _(() => Fe(i.shape.keys.length, [u(v), Math.max(u(v) + 1, u(m))], .08, 0)), O = _(() => Fe(i.spec.series.length, [i.compact ? 0 : 4, u(x)], .1, 0)), M = (e) => e === null ? "var(--color-fill)" : `color-mix(in oklab, var(--color-lit) ${Math.round(6 + e * 94)}%, var(--color-surface))`, N = _(() => Math.max(1, Math.ceil(i.shape.rows.length * (Math.max(...i.shape.rows.map((e) => e.label.length), 0) * o + 8) / Math.max(1, u(m) - u(v))))), P = _(() => g.index === null ? null : mt(i.spec, i.shape, g.index)), F = _(() => {
		let e = g.index === null ? null : i.shape.cells[g.index];
		if (!e) return null;
		let t = i.shape.keys.indexOf(e.key);
		return {
			x: u(D).start(t) + u(D).width / 2,
			y: u(O).start(Number(e.order))
		};
	});
	var I = an();
	let L;
	var R = b(I), z = (e) => {
		var n = rn(), o = T(n), p = b(o);
		s(p, 17, () => i.shape.cells, (e) => e.index, (e, n) => {
			var r = $t();
			let o;
			w((e, t, a) => {
				S(r, "x", e), S(r, "y", t), S(r, "width", u(D).width), S(r, "height", u(O).width), S(r, "fill", a), o = f(r, 0, "mark cell svelte-9xl1lm", null, o, {
					enter: !i.settled,
					on: g.index === u(n).index
				});
			}, [
				() => u(D).start(i.shape.keys.indexOf(u(n).key)),
				() => u(O).start(Number(u(n).order)),
				() => M(u(n).tone)
			]), a("pointerenter", r, function(...e) {
				(i.quiet ? void 0 : () => g.show(u(n).index))?.apply(this, e);
			}), a("pointerleave", r, function(...e) {
				(i.quiet ? void 0 : () => g.hide())?.apply(this, e);
			}), t(e, r);
		});
		var _ = A(p), y = (e) => {
			var n = nn(), a = b(n);
			s(a, 17, () => i.spec.series, c, (e, n, r) => {
				var i = en(), a = b(i, !0);
				l(i), w((e) => {
					S(i, "x", u(v) - 8), S(i, "y", e), d(a, u(n).name);
				}, [() => u(O).start(r) + u(O).width / 2]), t(e, i);
			});
			var o = A(a);
			s(o, 17, () => i.shape.rows, (e) => e.key, (e, n) => {
				var a = h(), o = T(a), s = (e) => {
					var r = tn(), a = b(r, !0);
					l(r), w((e) => {
						S(r, "x", e), S(r, "y", i.height - 4), d(a, u(n).label);
					}, [() => u(D).start(u(n).index) + u(D).width / 2]), t(e, r);
				};
				r(o, (e) => {
					u(n).index % u(N) === 0 && e(s);
				}), t(e, a);
			}), l(n), t(e, n);
		};
		r(_, (e) => {
			i.compact || e(y);
		}), l(o);
		var x = A(o), C = (e) => {
			wt(e, {
				get readout() {
					return u(P);
				},
				get x() {
					return u(F).x;
				},
				get y() {
					return u(F).y;
				},
				get width() {
					return u(m);
				},
				get hover() {
					return g;
				},
				get onevidence() {
					return i.onevidence;
				},
				get glyph() {
					return i.glyph;
				}
			});
		};
		r(x, (e) => {
			u(P) && u(F) && !i.quiet && e(C);
		}), w(() => {
			S(o, "width", u(m)), S(o, "height", i.height), S(o, "aria-label", i.summary);
		}), t(e, n);
	};
	r(R, (e) => {
		u(m) && e(z);
	}), l(I), w(() => L = j(I, "", L, { "block-size": `${i.height}px` })), y(I, "clientWidth", (e) => E(m, e)), t(e, I), p();
}
// upstream/src/shared/ui/data/Chart/Radar.svelte
var sn = m("<polygon class=\"grid svelte-1j8obo0\"></polygon>"), cn = m("<line class=\"grid svelte-1j8obo0\"></line>"), ln = m("<circle class=\"mark dot svelte-1j8obo0\"></circle>"), un = m("<polygon class=\"mark web svelte-1j8obo0\"></polygon><!>", 1), dn = m("<text> </text>"), fn = m("<path class=\"hit svelte-1j8obo0\" role=\"presentation\"></path>"), pn = m("<!><!>", 1), mn = i("<div class=\"tip svelte-1j8obo0\"><!></div>"), hn = m("<svg role=\"img\"><!><!><!><!></svg><!>", 1), gn = i("<div class=\"radar svelte-1j8obo0\"><!></div>");
function _n(e, i) {
	n(i, !0);
	let o = C(0), m = C(0), g = C(null), v = _(() => st(i.spec)), x = _(() => i.detail === "full"), D = _(() => u(x) ? 28 : i.detail === "overview" ? 8 : 2), O = _(() => Math.max(8, Math.min(u(o), u(m)) / 2 - u(D))), k = _(() => u(o) / 2), M = _(() => u(m) / 2), N = (e, t) => ({
		x: u(k) + Math.sin(e) * u(O) * t,
		y: u(M) - Math.cos(e) * u(O) * t
	}), P = (e) => u(v).axes.map((t) => N(t.angle, e)).map((e) => `${e.x},${e.y}`).join(" "), F = _(() => u(v).ticks.at(-1) ?? 1);
	function I(e) {
		return u(v).axes.map((t, n) => N(t.angle, e[n] ?? 0)).map((e) => `${e.x},${e.y}`).join(" ");
	}
	function L(e) {
		let t = Math.PI / Math.max(1, u(v).axes.length), n = u(v).axes[e].angle, r = N(n - t, 1.08), i = N(n + t, 1.08);
		return `M${u(k)},${u(M)} L${r.x},${r.y} L${i.x},${i.y} Z`;
	}
	let R = _(() => u(g) === null ? null : mt(i.spec, i.shape, u(g))), z = _(() => u(g) === null ? null : N(u(v).axes[u(g)].angle, .9));
	var B = gn(), ee = b(B), V = (e) => {
		var n = hn(), p = T(n);
		let y;
		var C = b(p);
		s(C, 16, () => u(v).ticks, (e) => e, (e, n) => {
			var r = sn();
			w((e) => S(r, "points", e), [() => P(n / u(F))]), t(e, r);
		});
		var D = A(C);
		s(D, 17, () => u(v).axes, (e) => e.key, (e, n) => {
			let r = _(() => N(u(n).angle, 1));
			var i = cn();
			w(() => {
				S(i, "x1", u(k)), S(i, "y1", u(M)), S(i, "x2", u(r).x), S(i, "y2", u(r).y);
			}), t(e, i);
		});
		var O = A(D);
		s(O, 17, () => u(v).series, c, (e, n) => {
			var a = un(), o = T(a);
			let l;
			var d = A(o), f = (e) => {
				var i = h(), a = T(i);
				s(a, 17, () => u(n).reach, c, (e, i, a) => {
					var o = h(), s = T(o), c = (e) => {
						let r = _(() => N(u(v).axes[a].angle, u(i)));
						var o = ln();
						let s;
						w(() => {
							S(o, "cx", u(r).x), S(o, "cy", u(r).y), S(o, "r", u(g) === a ? 4.5 : 3.5), s = j(o, "", s, { fill: u(n).color });
						}), t(e, o);
					};
					r(s, (e) => {
						u(i) !== null && e(c);
					}), t(e, o);
				}), t(e, i);
			};
			r(d, (e) => {
				i.detail !== "tile" && u(v).series.length <= 2 && e(f);
			}), w((e) => {
				S(o, "points", e), l = j(o, "", l, {
					fill: u(n).color,
					stroke: u(n).color,
					"fill-opacity": u(v).series.length > 1 ? .14 : .24
				});
			}, [() => I(u(n).reach)]), t(e, a);
		});
		var B = A(O), ee = (e) => {
			var n = pn(), r = T(n);
			s(r, 19, () => u(v).axes, (e) => e.key, (e, n, r) => {
				let i = _(() => N(u(n).angle, 1)), a = _(() => Math.sin(u(n).angle)), o = _(() => Math.cos(u(n).angle));
				var s = dn();
				let c;
				var p = b(s, !0);
				l(s), w((e) => {
					S(s, "x", u(i).x + u(a) * 10), S(s, "y", u(i).y - u(o) * 10), S(s, "text-anchor", e), S(s, "dominant-baseline", u(o) > .5 ? "auto" : u(o) < -.5 ? "hanging" : "central"), c = f(s, 0, "name svelte-1j8obo0", null, c, { on: u(g) === u(r) }), d(p, u(n).label);
				}, [() => Math.abs(u(a)) < .2 ? "middle" : u(a) > 0 ? "start" : "end"]), t(e, s);
			});
			var i = A(r);
			s(i, 17, () => u(v).axes, c, (e, n, r) => {
				var i = fn();
				w((e) => S(i, "d", e), [() => L(r)]), a("pointerenter", i, () => E(g, r, !0)), a("pointerleave", i, () => E(g, null)), t(e, i);
			}), t(e, n);
		};
		r(B, (e) => {
			u(x) && e(ee);
		}), l(p);
		var V = A(p), te = (e) => {
			var n = mn();
			let r;
			St(b(n), {
				get readout() {
					return u(R);
				},
				get onevidence() {
					return i.onevidence;
				},
				get glyph() {
					return i.glyph;
				}
			}), l(n), w(() => r = j(n, "", r, {
				left: `${u(z).x}px`,
				top: `${u(z).y}px`
			})), t(e, n);
		};
		r(V, (e) => {
			u(R) && u(z) && e(te);
		}), w(() => {
			S(p, "width", u(o)), S(p, "height", u(m)), S(p, "aria-label", i.summary), y = f(p, 0, "svelte-1j8obo0", null, y, { enter: !i.settled });
		}), t(e, n);
	};
	r(ee, (e) => {
		u(o) && u(m) && u(v).axes.length >= 3 && e(V);
	}), l(B), y(B, "clientWidth", (e) => E(o, e)), y(B, "clientHeight", (e) => E(m, e)), t(e, B), p();
}
// upstream/src/shared/ui/data/Chart/Round.svelte
var vn = m("<path role=\"presentation\"></path>"), yn = m("<path pathLength=\"1\" role=\"presentation\"></path>"), bn = m("<circle class=\"track svelte-bbgwfk\"></circle><!>", 1), xn = m("<text text-anchor=\"middle\" dominant-baseline=\"central\"> </text>"), Sn = m("<text text-anchor=\"middle\" dominant-baseline=\"central\" class=\"total svelte-bbgwfk\"> </text><!>", 1), Cn = i("<div class=\"round svelte-bbgwfk\"><svg role=\"img\" class=\"svelte-bbgwfk\"><g><!><!></g><!></svg> <!></div>");
function wn(e, i) {
	n(i, !0);
	let o = new Ke();
	k(() => o.dispose());
	let c = _(() => i.detail !== "full"), m = _(() => i.detail === "tile"), h = _(() => i.size / 2), g = _(() => Math.max(8, i.size / 2 - 2)), v = Math.PI * 2, y = _(() => {
		if (i.spec.kind !== "donut" || !i.shape.total) return [];
		let e = u(g) * (u(m) ? .6 : .7), t = i.shape.parts.length > 1 ? .025 : 0, n = u(m) ? 1.5 : 3, r = 0;
		return i.shape.parts.map((a) => {
			let o = a.value / i.shape.total * v, s = r + t / 2, c = r + o - t / 2;
			return r += o, {
				part: a,
				d: Ge(u(h), u(h), e, u(g), s, Math.max(s, c), n),
				corner: n,
				tip: Ue(u(h), u(h), u(g), (s + c) / 2)
			};
		});
	}), x = _(() => i.spec.kind === "radial" ? ot(i.spec, i.shape.parts) : 1), C = _(() => {
		if (i.spec.kind !== "radial") return [];
		let e = Math.max(1, i.shape.parts.length), t = u(g) * (e === 1 ? .72 : .36), n = (u(g) - t) / e, r = Math.max(3, n * (e === 1 ? 1 : .72));
		return i.shape.parts.map((e) => {
			let t = u(g) - e.index * n - r / 2, i = Math.min(1, Math.max(0, e.value / (u(x) || 1)));
			return {
				part: e,
				radius: t,
				thickness: r,
				d: i > 0 ? We(u(h), u(h), t, 0, i * v) : "",
				tip: Ue(u(h), u(h), t, i * v)
			};
		});
	}), E = _(() => o.index === null ? null : mt(i.spec, i.shape, o.index)), D = _(() => o.index === null ? null : (u(y).find((e) => e.part.index === o.index) ?? u(C).find((e) => e.part.index === o.index))?.tip ?? null), O = (e) => u(c) ? void 0 : () => o.show(e), M = _(() => u(c) ? void 0 : () => o.hide());
	var N = Cn();
	let P;
	var F = b(N), I = b(F);
	let L;
	var R = b(I);
	s(R, 17, () => u(y), (e) => e.part.index, (e, n) => {
		var r = vn();
		let i;
		var s = _(() => O(u(n).part.index));
		w(() => {
			S(r, "d", u(n).d), S(r, "fill", u(n).part.color), S(r, "stroke", u(n).part.color), S(r, "stroke-width", u(n).corner * 2), i = f(r, 0, "mark slice svelte-bbgwfk", null, i, { dim: o.index !== null && o.index !== u(n).part.index });
		}), a("pointerenter", r, function(...e) {
			u(s)?.apply(this, e);
		}), a("pointerleave", r, function(...e) {
			u(M)?.apply(this, e);
		}), t(e, r);
	});
	var z = A(R);
	s(z, 17, () => u(C), (e) => e.part.index, (e, n) => {
		var s = bn(), c = T(s), l = A(c), d = (e) => {
			var r = yn();
			let s;
			var c = _(() => O(u(n).part.index));
			w(() => {
				S(r, "d", u(n).d), S(r, "stroke", u(n).part.color), S(r, "stroke-width", u(n).thickness), s = f(r, 0, "mark slice arc svelte-bbgwfk", null, s, {
					draw: !i.settled,
					dim: o.index !== null && o.index !== u(n).part.index
				});
			}), a("pointerenter", r, function(...e) {
				u(c)?.apply(this, e);
			}), a("pointerleave", r, function(...e) {
				u(M)?.apply(this, e);
			}), t(e, r);
		};
		r(l, (e) => {
			u(n).d && e(d);
		}), w(() => {
			S(c, "cx", u(h)), S(c, "cy", u(h)), S(c, "r", u(n).radius), S(c, "stroke-width", u(n).thickness);
		}), t(e, s);
	}), l(I);
	var B = A(I), ee = (e) => {
		var n = Sn(), a = T(n), o = b(a, !0);
		l(a);
		var s = A(a), c = (e) => {
			var n = xn();
			let r;
			var a = b(n, !0);
			l(n), w(() => {
				S(n, "x", u(h)), S(n, "y", u(h) + (i.spec.compact ? 14 : 18)), r = f(n, 0, "caption-text svelte-bbgwfk", null, r, { lead: i.spec.compact }), d(a, i.middle.label);
			}), t(e, n);
		};
		r(s, (e) => {
			i.detail === "full" && e(c);
		}), w(() => {
			S(a, "x", u(h)), S(a, "y", u(h) + (i.detail === "full" ? -2 : 0)), d(o, i.middle.value);
		}), t(e, n);
	};
	r(B, (e) => {
		i.middle && !u(m) && (i.spec.kind === "donut" || i.shape.parts.length === 1) && e(ee);
	}), l(F);
	var V = A(F, 2), te = (e) => {
		wt(e, {
			get readout() {
				return u(E);
			},
			get x() {
				return u(D).x;
			},
			get y() {
				return u(D).y;
			},
			get width() {
				return i.size;
			},
			get hover() {
				return o;
			},
			get onevidence() {
				return i.onevidence;
			},
			get glyph() {
				return i.glyph;
			}
		});
	};
	r(V, (e) => {
		u(E) && u(D) && e(te);
	}), l(N), w(() => {
		P = j(N, "", P, {
			"inline-size": `${i.size}px`,
			"block-size": `${i.size}px`
		}), S(F, "width", i.size), S(F, "height", i.size), S(F, "aria-label", i.summary), L = f(I, 0, "ring svelte-bbgwfk", null, L, { enter: !i.settled && i.spec.kind === "donut" });
	}), t(e, N), p();
}
// upstream/src/shared/ui/data/Chart/Spark.svelte
var Tn = m("<path></path>"), En = m("<path pathLength=\"1\"></path>"), Dn = m("<svg role=\"img\" class=\"svelte-yumr6r\"><!></svg>"), On = i("<span class=\"spark svelte-yumr6r\"><!></span>");
function kn(e, i) {
	n(i, !0);
	let a = C(0), o = C(0), c = _(() => i.spec.x?.kind === "category"), d = _(() => i.shape.rows.map((e) => e.points[0]?.y ?? null)), m = _(() => {
		if (u(c)) return i.shape.domain;
		let e = u(d).filter((e) => e !== null);
		return e.length ? [Math.min(...e), Math.max(...e)] : [0, 1];
	}), g = _(() => Pe(u(m), [u(o) - 2, 2])), v = _(() => Pe([0, Math.max(1, i.shape.rows.length - 1)], [1, u(a) - 1])), x = _(() => Be(u(d).map((e, t) => e === null ? null : {
		x: u(v)(t),
		y: u(g)(e)
	})).map((e) => ze(e)).join("")), D = _(() => {
		if (!u(c)) return [];
		let e = Fe(i.shape.rows.length, [0, u(a)], .25, .1), t = u(g)(Math.max(u(m)[0], Math.min(0, u(m)[1])));
		return u(d).flatMap((n, r) => {
			if (n === null) return [];
			let i = u(g)(n), a = He(e.start(r), Math.min(i, t), e.width, Math.abs(t - i), Math.min(2, e.width / 2), "end", i <= t ? "up" : "down");
			return a ? [{
				index: r,
				d: a
			}] : [];
		});
	});
	var O = On(), k = b(O), A = (e) => {
		var n = Dn(), d = b(n), p = (e) => {
			var n = h(), r = T(n);
			s(r, 17, () => u(D), (e) => e.index, (e, n) => {
				var r = Tn();
				let a;
				w(() => {
					S(r, "d", u(n).d), S(r, "fill", i.shape.series[0]?.color), a = f(r, 0, "mark bar svelte-yumr6r", null, a, { enter: !i.settled });
				}), t(e, r);
			}), t(e, n);
		}, m = (e) => {
			var n = En();
			let r;
			w(() => {
				S(n, "d", u(x)), S(n, "stroke", i.shape.series[0]?.color), r = f(n, 0, "mark line svelte-yumr6r", null, r, { enter: !i.settled });
			}), t(e, n);
		};
		r(d, (e) => {
			u(c) ? e(p) : e(m, -1);
		}), l(n), w(() => {
			S(n, "width", u(a)), S(n, "height", u(o)), S(n, "aria-label", i.summary);
		}), t(e, n);
	};
	r(k, (e) => {
		u(a) && u(o) && e(A);
	}), l(O), y(O, "clientWidth", (e) => E(a, e)), y(O, "clientHeight", (e) => E(o, e)), t(e, O), p();
}
// upstream/src/shared/ui/data/Chart/Chart.svelte
var An = i("<span class=\"spark-box svelte-13itr0k\"><!></span>"), jn = i("<p class=\"headline svelte-13itr0k\"><span class=\"figure svelte-13itr0k\"> </span><span class=\"what svelte-13itr0k\"> </span></p>"), Mn = i("<div class=\"plot svelte-13itr0k\"><!></div>"), Nn = i("<div><!> <!></div>"), Pn = i("<p role=\"status\" class=\"caption svelte-13itr0k\"> </p>"), Fn = i("<p class=\"caption basis svelte-13itr0k\"> </p>"), In = i("<p class=\"caption svelte-13itr0k\"> </p>"), Ln = i("<button type=\"button\" class=\"copy svelte-13itr0k\"> </button>"), Rn = i("<th scope=\"col\" class=\"svelte-13itr0k\"> </th>"), zn = i("<td class=\"svelte-13itr0k\"> </td>"), Bn = i("<button type=\"button\" class=\"chip svelte-13itr0k\"> </button>"), Vn = i("<td class=\"cites svelte-13itr0k\"></td>"), Hn = i("<tr><th scope=\"row\" class=\"svelte-13itr0k\"> </th><!><!></tr>"), Un = i("<details class=\"svelte-13itr0k\"><summary class=\"svelte-13itr0k\"> </summary> <!> <!> <div class=\"values svelte-13itr0k\"><table class=\"svelte-13itr0k\"><caption class=\"svelte-13itr0k\"> </caption><thead><tr><th scope=\"col\" class=\"svelte-13itr0k\"> </th><!><!></tr></thead><tbody></tbody></table></div></details>"), Wn = i("<figure><!> <!> <!> <!></figure>");
function Gn(e, i) {
	let a = g();
	n(i, !0);
	let o = O(i, "detail", 3, "full"), m = {
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
	}, y = C(x(M()));
	v(() => {
		if (u(y)) return;
		let e = setTimeout(() => E(y, !0), N("page") + 240);
		return () => clearTimeout(e);
	});
	let S = _(() => i.spec.kind === "spark"), k = _(() => o() !== "full"), P = _(() => o() === "tile"), I = _(() => !!i.spec.compact || u(S) || u(k)), L = _(() => nt(i.spec, Ce())), z = _(() => pt(i.spec, u(L))), B = _(() => i.spec.series.some((e) => e.points.some((e) => e.y !== null))), V = _(() => i.spec.kind === "donut" || i.spec.kind === "radial"), te = _(() => u(L).horizontal), H = new Intl.NumberFormat(void 0, {
		style: "percent",
		maximumFractionDigits: 0
	}), ne = _(() => u(S) || i.spec.kind === "heat" || u(k) ? [] : u(V) ? i.spec.compact ? [] : u(L).parts.map((e) => ({
		key: `p${e.index}`,
		label: e.label,
		color: e.color,
		share: i.spec.kind === "donut" ? u(L).total ? H.format(e.value / u(L).total) : "" : F(e.points[0], i.spec.y)
	})) : (i.spec.compact ? u(z).legend : dt(i.spec.series.length, !1)) === "rows" ? u(L).series : []), U = _(() => !u(S) && !u(k) && i.spec.values !== !1 && (!i.spec.compact || u(z).legend === "table")), G = _(() => ee(i.spec)), q = _(() => u(G) ? ae({
		low: ie(u(G).low),
		high: ie(u(G).high)
	}) : ""), J = _(() => {
		let e = [i.spec.x?.label, i.spec.y?.label].filter((e) => !!e?.trim()).join("; ");
		return [
			i.title,
			e,
			`${m[i.spec.kind]()}${u(q) ? `; ${u(q)}` : ""}`
		].filter(Boolean).join(". ");
	}), oe = _(() => i.spec.series.some((e) => e.points.some((e) => e.display !== void 0))), se = _(() => i.spec.series.some((e) => e.points.some((e) => e.evidence?.length))), le = _(() => i.spec.headline), de = _(() => u(I) ? 20 : Math.max(24, 10 + i.spec.series.length * 12)), X = _(() => u(P) && i.height ? i.height : i.spec.kind === "heat" ? (u(I) ? 0 : 24) + i.spec.series.length * (u(I) ? Math.max(6, Math.floor(132 / Math.max(1, i.spec.series.length))) : 20) : u(V) ? u(P) ? 150 : o() === "overview" ? 260 : i.spec.compact ? 132 : 188 : i.spec.kind === "radar" ? u(P) ? 150 : o() === "overview" ? 260 : 280 : u(te) ? (u(I) ? 8 : 30) + u(L).rows.length * u(de) : u(P) ? 96 : o() === "overview" ? 200 : i.spec.compact ? 132 : 220), me = _(() => {
		if (i.spec.compact && u(z).lead) return {
			value: u(z).lead.share,
			label: u(z).lead.label
		};
		if (u(le)) return u(le);
		if (i.spec.kind === "radial") {
			let e = u(L).parts[0];
			return e ? {
				value: F(e.points[0], i.spec.y),
				label: e.label
			} : null;
		}
		return {
			value: R(u(L).total, i.spec.y),
			label: ke()
		};
	}), ge = C(!1);
	function _e() {
		navigator.clipboard.writeText(gt(i.spec)).then(() => {
			E(ge, !0), setTimeout(() => E(ge, !1), 1600);
		}, () => E(ge, !1));
	}
	var Q = h(), be = T(Q), Se = (e) => {
		var n = An();
		let a;
		var o = b(n), s = (e) => {
			kn(e, {
				get spec() {
					return i.spec;
				},
				get shape() {
					return u(L);
				},
				get summary() {
					return u(J);
				},
				get settled() {
					return u(y);
				}
			});
		};
		r(o, (e) => {
			u(B) && e(s);
		}), l(n), w(() => a = j(n, "", a, { "block-size": i.height ? `${i.height}px` : void 0 })), t(e, n);
	}, we = (e) => {
		var n = Wn();
		let p;
		var m = b(n), h = (e) => {
			var n = jn(), r = b(n), i = b(r, !0);
			l(r);
			var a = A(r), o = b(a, !0);
			l(a), l(n), w(() => {
				d(i, u(le).value), d(o, u(le).label);
			}), t(e, n);
		};
		r(m, (e) => {
			u(le) && !u(P) && (!u(V) || i.spec.kind === "radial" && u(L).parts.length > 1) && e(h);
		});
		var g = A(m, 2), v = (e) => {
			var n = Nn();
			let s;
			var c = b(n), d = (e) => {
				var n = Mn();
				let r;
				_n(b(n), {
					get spec() {
						return i.spec;
					},
					get shape() {
						return u(L);
					},
					get detail() {
						return o();
					},
					get summary() {
						return u(J);
					},
					get settled() {
						return u(y);
					},
					get onevidence() {
						return i.onevidence;
					},
					get glyph() {
						return i.glyph;
					}
				}), l(n), w(() => r = j(n, "", r, { "block-size": `${u(X)}px` })), t(e, n);
			}, p = (e) => {
				wn(e, {
					get spec() {
						return i.spec;
					},
					get shape() {
						return u(L);
					},
					get size() {
						return u(X);
					},
					get detail() {
						return o();
					},
					get summary() {
						return u(J);
					},
					get settled() {
						return u(y);
					},
					get middle() {
						return u(me);
					},
					get onevidence() {
						return i.onevidence;
					},
					get glyph() {
						return i.glyph;
					}
				});
			}, m = (e) => {
				on(e, {
					get spec() {
						return i.spec;
					},
					get shape() {
						return u(L);
					},
					get height() {
						return u(X);
					},
					get compact() {
						return u(I);
					},
					get quiet() {
						return u(k);
					},
					get summary() {
						return u(J);
					},
					get settled() {
						return u(y);
					},
					get onevidence() {
						return i.onevidence;
					},
					get glyph() {
						return i.glyph;
					}
				});
			}, h = (e) => {
				Jt(e, {
					get spec() {
						return i.spec;
					},
					get shape() {
						return u(L);
					},
					get labels() {
						return u(z);
					},
					get detail() {
						return o();
					},
					get summary() {
						return u(J);
					},
					get uid() {
						return a;
					},
					get height() {
						return u(X);
					},
					get settled() {
						return u(y);
					},
					get onevidence() {
						return i.onevidence;
					},
					get glyph() {
						return i.glyph;
					}
				});
			};
			r(c, (e) => {
				i.spec.kind === "radar" ? e(d) : u(V) ? e(p, 1) : i.spec.kind === "heat" ? e(m, 2) : e(h, -1);
			});
			var g = A(c, 2), v = (e) => {
				{
					let t = _(() => u(V) ? "list" : i.spec.compact ? "rows" : "row");
					Qt(e, {
						get entries() {
							return u(ne);
						},
						get layout() {
							return u(t);
						}
					});
				}
			};
			r(g, (e) => {
				u(ne).length && e(v);
			}), l(n), w(() => s = f(n, 1, "body svelte-13itr0k", null, s, { beside: u(V) && u(ne).length })), t(e, n);
		}, x = (e) => {
			var n = Pn(), r = b(n, !0);
			l(n), w((e) => d(r, e), [() => je()]), t(e, n);
		};
		r(g, (e) => {
			u(B) ? e(v) : e(x, -1);
		});
		var S = A(g, 2), C = (e) => {
			var n = Fn(), r = b(n, !0);
			l(n), w(() => d(r, i.spec.basis)), t(e, n);
		}, T = _(() => i.spec.basis?.trim() && !u(k));
		r(S, (e) => {
			u(T) && e(C);
		});
		var E = A(S, 2), O = (e) => {
			var n = Un(), a = b(n), o = b(a, !0);
			l(a);
			var f = A(a, 2), p = (e) => {
				var n = In(), r = b(n, !0);
				l(n), w((e) => d(r, e), [() => Te()]), t(e, n);
			};
			r(f, (e) => {
				u(oe) && e(p);
			});
			var m = A(f, 2), h = (e) => {
				var n = Ln(), r = b(n, !0);
				l(n), w((e) => d(r, e), [() => u(ge) ? re() : W()]), D("click", n, _e), t(e, n);
			};
			r(m, (e) => {
				u(I) || e(h);
			});
			var g = A(m, 2), _ = b(g), v = b(_), y = b(v, !0);
			l(v);
			var x = A(v), S = b(x), C = b(S), T = b(C, !0);
			l(C);
			var E = A(C);
			s(E, 17, () => i.spec.series, c, (e, n) => {
				var r = Rn(), a = b(r, !0);
				l(r), w(() => d(a, u(n).name || i.spec.y?.label || "")), t(e, r);
			});
			var O = A(E), k = (e) => {
				var n = Rn(), r = b(n, !0);
				l(n), w((e) => d(r, e), [() => De()]), t(e, n);
			};
			r(O, (e) => {
				u(se) && e(k);
			}), l(S), l(x);
			var j = A(x);
			s(j, 21, () => u(L).rows, (e) => e.key, (e, n) => {
				var a = Hn(), o = b(a), f = b(o, !0);
				l(o);
				var p = A(o);
				s(p, 17, () => u(n).points, c, (e, n) => {
					var r = zn(), a = b(r, !0);
					l(r), w((e) => d(a, e), [() => F(u(n), i.spec.y)]), t(e, r);
				});
				var m = A(p), h = (e) => {
					var r = Vn();
					s(r, 21, () => u(n).points.flatMap((e) => e?.evidence ?? []), c, (e, n) => {
						var r = Bn(), a = b(r, !0);
						l(r), w(() => {
							r.disabled = !i.onevidence, d(a, u(n).origin || u(n).label);
						}), D("click", r, () => i.onevidence?.(u(n))), t(e, r);
					}), l(r), t(e, r);
				};
				r(m, (e) => {
					u(se) && e(h);
				}), l(a), w(() => d(f, u(n).label)), t(e, a);
			}), l(j), l(_), l(g), l(n), w((e) => {
				d(o, e), d(y, i.title), d(T, i.spec.x?.label ?? "");
			}, [() => u(oe) ? K() : Ne()]), t(e, n);
		};
		r(E, (e) => {
			u(U) && e(O);
		}), l(n), w(() => p = f(n, 1, `chart ${o() ?? ""}`, "svelte-13itr0k", p, {
			compact: i.spec.compact,
			round: u(V),
			radar: i.spec.kind === "radar"
		})), t(e, n);
	};
	r(be, (e) => {
		u(S) ? e(Se) : e(we, -1);
	}), t(e, Q), p();
}
o(["click"]);
export { Gn as default };
