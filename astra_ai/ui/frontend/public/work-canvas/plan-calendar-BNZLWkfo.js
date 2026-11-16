var e = (e) => `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`, t = (e) => {
	let [t, n, r] = e.split("-").map(Number);
	return new Date(t, n - 1, r);
}, n = 864e5;
function r(e) {
	try {
		let t = new Intl.Locale(e ?? navigator.language);
		return t.getWeekInfo?.().firstDay ?? t.weekInfo?.firstDay ?? 1;
	} catch {
		return 1;
	}
}
function i(i, a = {}) {
	let o = i.steps.flatMap((e, t) => e.date ? [{
		index: t,
		date: e.date
	}] : []), s = o.map(({ date: e }) => t(e).getTime()), c, l;
	if (i.calendar && a.month) c = new Date(a.month.getFullYear(), a.month.getMonth(), 1), l = new Date(a.month.getFullYear(), a.month.getMonth() + 1, 0);
	else if (i.calendar) {
		let e = a.today ?? /* @__PURE__ */ new Date(), t = s.length ? new Date(Math.min(...s)) : e, n = s.length ? new Date(Math.max(...s)) : e;
		c = new Date(t.getFullYear(), t.getMonth(), 1), l = new Date(n.getFullYear(), n.getMonth() + 1, 0);
	} else if (o.length < 6 || o.length < i.steps.length * .8 || (c = new Date(Math.min(...s)), l = new Date(Math.max(...s)), Math.round((l.getTime() - c.getTime()) / n) + 1 < 10)) return null;
	let u = (a.firstDay ?? r()) % 7, d = new Date(c);
	d.setDate(d.getDate() - (d.getDay() - u + 7) % 7);
	let f = new Date(l);
	f.setDate(f.getDate() + (u + 6 - f.getDay() + 7) % 7);
	let p = Math.round((f.getTime() - d.getTime()) / n) + 1;
	if (p / 7 > 10 && !i.calendar) return null;
	let m = /* @__PURE__ */ new Map();
	for (let { index: e, date: t } of o) m.set(t, [...m.get(t) ?? [], e]);
	let h = e(a.today ?? /* @__PURE__ */ new Date()), g = e(c), _ = e(l), v = [];
	for (let t = 0; t < p; t++) {
		let n = new Date(d.getFullYear(), d.getMonth(), d.getDate() + t), r = e(n);
		t % 7 == 0 && v.push([]), v.at(-1).push({
			date: r,
			day: n.getDate(),
			opens: t === 0 || n.getDate() === 1,
			outside: r < g || r > _,
			today: r === h,
			weekend: n.getDay() === 0 || n.getDay() === 6,
			steps: m.get(r) ?? [],
			slots: []
		});
	}
	return v;
}
var a = {
	gutter: 36,
	cell: 124,
	head: 28,
	quiet: 32,
	pad: 8,
	number: 22,
	gap: 4,
	item: 20,
	between: 2,
	rule: 1
}, o = () => a.gutter + 7 * a.cell;
function s(e, t, n = 0) {
	let r = Math.max(e + t, n), i = r ? a.gap + r * a.item + (r - 1) * a.between : 0;
	return 2 * a.pad + a.number + i + a.rule;
}
var c = (e, t = !1) => a.head + e.reduce((e, n) => e + (n.kind === "quiet" ? a.quiet + a.rule : s(n.lanes, n.lines, t ? 3 : 0)), 0), l = (n) => {
	let r = t(n);
	return e(new Date(r.getFullYear(), r.getMonth(), r.getDate() + 1));
};
function u(e) {
	let t = (t, n) => `${e.steps[t].kind}|${e.steps[t].title.trim().toLowerCase()}|${n}`, n = e.steps.flatMap((e, t) => e.date && (e.kind === "stay" || e.kind === "event") ? [t] : []), r = new Map(n.map((n) => [t(n, e.steps[n].date), n])), i = /* @__PURE__ */ new Set(), a = [], o = n.toSorted((t, n) => e.steps[t].date.localeCompare(e.steps[n].date));
	for (let n of o) {
		if (i.has(n)) continue;
		let o = [n];
		for (;;) {
			let n = r.get(t(o.at(-1), l(e.steps[o.at(-1)].date)));
			if (n === void 0 || i.has(n)) break;
			o.push(n);
		}
		if (!(o.length < 2)) {
			for (let e of o) i.add(e);
			a.push({
				steps: o,
				from: e.steps[o[0]].date,
				to: e.steps[o.at(-1)].date
			});
		}
	}
	return a;
}
function d(e, t, n) {
	let r = t[0].date, i = t[6].date, a = n.filter((e) => e.from <= i && e.to >= r).toSorted((e, t) => e.from.localeCompare(t.from) || t.to.localeCompare(e.to)), o = [], s = t.map((e) => ({
		...e,
		slots: []
	})), c = /* @__PURE__ */ new Set();
	for (let t of a) {
		let n = Math.max(0, s.findIndex((e) => e.date >= t.from)), r = s.findLastIndex((e) => e.date <= t.to), i = o.findIndex((e) => e < n);
		i < 0 ? i = o.push(r) - 1 : o[i] = r;
		let a = e.steps[t.steps[0]];
		for (let o = n; o <= r; o++) {
			let c = s[o];
			for (; c.slots.length <= i;) c.slots.push(null);
			c.slots[i] = {
				steps: t.steps,
				title: a.title,
				kind: a.kind,
				done: t.steps.every((t) => !!e.steps[t].done),
				head: o === n,
				starts: c.date === t.from,
				ends: c.date === t.to,
				span: r - n + 1,
				from: t.from,
				to: t.to
			};
		}
		for (let e of t.steps) c.add(e);
	}
	for (let e of s) for (e.steps = e.steps.filter((e) => !c.has(e)); e.slots.length < o.length;) e.slots.push(null);
	return {
		kind: "week",
		days: s,
		lanes: o.length,
		lines: f(s),
		month: null
	};
}
var f = (e) => Math.max(0, ...e.map((e) => Math.min(e.steps.length, 3))), p = (e) => (e.days.find((e) => e.day === 1) ?? e.days[0]).date.slice(0, 7);
function m(e, t = !1) {
	let n = "";
	for (let r of e) {
		if (r.kind !== "week") continue;
		let e = p(r);
		e !== n && !(t && n) && (r.month = e), n = e;
	}
	return e;
}
function h(e, t = {}) {
	let n = i(e, t);
	if (!n) return null;
	let r = () => m(n.map((e) => ({
		kind: "week",
		days: e,
		lanes: 0,
		lines: f(e),
		month: null
	})), !0);
	if (t.month) return r();
	let a = u(e), o = n.map((t) => d(e, t.map((e) => ({
		...e,
		outside: !1,
		opens: e.day === 1
	})), a)), s = (e) => e.lanes > 0 || e.days.some((e) => e.steps.length > 0), c = o.findIndex(s), l = o.findLastIndex(s);
	if (c < 0) return r();
	let p = [];
	for (let e = c; e <= l;) {
		if (s(o[e])) {
			p.push(o[e++]);
			continue;
		}
		let t = e;
		for (; t < l && !s(o[t + 1]);) t++;
		t === e ? p.push(o[e]) : p.push({
			kind: "quiet",
			weeks: t - e + 1,
			from: o[e].days[0].date,
			to: o[t].days[6].date
		}), e = t + 1;
	}
	return m(p);
}
function g(e) {
	if (e.calendar && !e.steps.some((e) => e.date)) {
		let t = h(e, { month: _(e) });
		return t && {
			rows: t,
			month: !0
		};
	}
	let t = h(e);
	return t && {
		rows: t,
		month: !1
	};
}
function _(e, n = /* @__PURE__ */ new Date()) {
	let r = e.steps.flatMap((e) => e.date ? [e.date] : []).sort(), i = r[0] ? t(r[0]) : n;
	return new Date(i.getFullYear(), i.getMonth(), 1);
}
export { r as a, s as c, o as i, c as n, _ as o, g as r, h as s, a as t };
