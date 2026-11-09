import { n as e } from "./index-client-CT6TpZ12.js";
import { t } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_diagram_cache.js
var n = () => "Cache", r = ((e = {}, r = {}) => (r.locale ?? t(), n(e))), i = () => "Client", a = ((e = {}, n = {}) => (n.locale ?? t(), i(e))), o = () => "Edge", s = ((e = {}, n = {}) => (n.locale ?? t(), o(e))), c = () => "External service", l = ((e = {}, n = {}) => (n.locale ?? t(), c(e))), u = () => "Gateway", d = ((e = {}, n = {}) => (n.locale ?? t(), u(e))), f = () => "Model", p = ((e = {}, n = {}) => (n.locale ?? t(), f(e))), m = () => "Part", h = ((e = {}, n = {}) => (n.locale ?? t(), m(e))), g = () => "Queue", _ = ((e = {}, n = {}) => (n.locale ?? t(), g(e))), ee = () => "Service", v = ((e = {}, n = {}) => (n.locale ?? t(), ee(e))), te = () => "Storage", ne = ((e = {}, n = {}) => (n.locale ?? t(), te(e))), re = () => "Database", y = ((e = {}, n = {}) => (n.locale ?? t(), re(e))), b = () => "Worker", ie = ((e = {}, n = {}) => (n.locale ?? t(), b(e))), x = {
	node: {
		width: 176,
		height: 72
	},
	column: 20,
	row: 56,
	across: 5,
	gutter: 88,
	tier: 16,
	reach: 1120
}, S = {
	stem: 18,
	track: 14,
	drop: 34,
	straight: 44,
	pass: 10,
	port: .28,
	header: 40
}, C = {
	char: 6.6,
	pad: 12,
	line: 15,
	height: 18,
	max: 180
}, w = (e) => Math.ceil(e.trim().length * C.char + C.pad), T = (e) => Math.min(C.max, w(e)), E = (e) => w(e) > C.max ? C.height + C.line : C.height;
function D(e) {
	if (!e.length) return 0;
	let t = Math.max(0, ...e.flatMap((e) => e.split(/\s+/u).map((e) => e.length)));
	return Math.min(168, Math.max(x.gutter, Math.ceil(t * 7.8) + 36));
}
// upstream/src/features/work/lib/diagram-rows.ts
function O(e, t = x.across, n = /* @__PURE__ */ new Set()) {
	let r = new Map(e.parts.map((e, t) => [e.id, t])), i = [...new Set(e.parts.map((e) => e.lane))].sort((e, t) => e - t), a = new Map(e.parts.map((e) => [e.id, e.lane])), o = [], s = [], c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Map();
	for (let t of e.flows) u.set(t.to, [...u.get(t.to) ?? [], t.from]), d.set(t.from, (d.get(t.from) ?? 0) + 1);
	for (let f of i) {
		let i = e.parts.filter((e) => e.lane === f).map((e) => e.id), p = A(i, e.flows.filter((e) => a.get(e.from) === f && a.get(e.to) === f), r), m = o.length, h = [];
		for (let e of i) (h[p.get(e)] ??= []).push(e);
		let g = n.has(f) ? null : k(h, u, d, t);
		if (g) {
			h.pop();
			for (let [e, t] of g) l.set(e, t);
		}
		for (let e of h.filter(Boolean)) {
			let n = Math.ceil(e.length / t), r = Math.ceil(e.length / n);
			for (let t = 0; t < e.length; t += r) o.push(e.slice(t, t + r));
		}
		m && o.length > m && c.add(m), o.length > m && s.push({
			lane: f,
			first: m,
			last: o.length - 1
		});
	}
	let f = /* @__PURE__ */ new Map();
	o.forEach((e, t) => e.forEach((e) => f.set(e, t)));
	for (let [e, t] of l) for (let n of [t.before, t.after]) n && f.set(n, f.get(e));
	let p = (e, t) => l.get(e)?.before === t || l.get(e)?.after === t, m = new Map(e.flows.map((e) => [e.index, f.get(e.from) < f.get(e.to) || p(e.from, e.to)])), h = new Set([...l.keys()].filter((t) => e.flows.some((e) => {
		let [n, r] = [f.get(e.from), f.get(e.to)], i = f.get(t);
		return Math.min(n, r) < i && Math.max(n, r) > i;
	})).map((e) => a.get(e)));
	return [...h].some((e) => !n.has(e)) ? O(e, t, /* @__PURE__ */ new Set([...n, ...h])) : {
		rows: o,
		rowOf: f,
		beside: l,
		tiers: s,
		tierStart: c,
		forward: m
	};
}
function k(e, t, n, r) {
	let i = e.at(-1), a = e.at(-2);
	if (e.length < 2 || !i?.length || !a?.length || a.length + i.length > r) return null;
	let o = /* @__PURE__ */ new Map();
	for (let e of i) {
		let r = t.get(e) ?? [], i = r[0];
		if (r.length !== 1 || n.get(e) || !i || !a.includes(i)) return null;
		let s = o.get(i) ?? {};
		if (!s.after) s.after = e;
		else if (!s.before) s.before = e;
		else return null;
		o.set(i, s);
	}
	for (let [e, t] of o) if ((n.get(e) ?? 0) <= Number(!!t.before) + Number(!!t.after)) return null;
	return o;
}
function A(e, t, n) {
	let r = new Map(e.map((e) => [e, []])), i = new Map(e.map((e) => [e, 0]));
	for (let e of t) r.get(e.from).push(e.to), i.set(e.to, i.get(e.to) + 1);
	let a = new Map(e.map((e) => [e, []])), o = /* @__PURE__ */ new Map(), s = (e) => {
		o.set(e, "open");
		for (let t of r.get(e)) o.get(t) !== "open" && (a.get(e).push(t), o.has(t) || s(t));
		o.set(e, "done");
	}, c = [...e].sort((e, t) => n.get(e) - n.get(t));
	for (let e of [...c.filter((e) => !i.get(e)), ...c]) o.has(e) || s(e);
	let l = new Map(e.map((e) => [e, 0])), u = new Map(e.map((e) => [e, 0]));
	for (let e of a.values()) for (let t of e) u.set(t, u.get(t) + 1);
	let d = c.filter((e) => !u.get(e));
	for (; d.length;) {
		let e = d.shift();
		for (let t of a.get(e)) l.set(t, Math.max(l.get(t), l.get(e) + 1)), u.set(t, u.get(t) - 1), u.get(t) || d.push(t);
	}
	return l;
}
// upstream/src/features/work/lib/diagram-labels.ts
var j = .75, M = {
	part: 4,
	plate: 6,
	end: 6
}, ae = [
	.5,
	.36,
	.64,
	.22,
	.78
], oe = (e, t) => t.slice(1).map((n, r) => {
	let i = t[r];
	return {
		flow: e,
		a: i,
		b: n,
		vertical: Math.abs(i.x - n.x) < j
	};
}), N = (e) => e.vertical ? [Math.min(e.a.y, e.b.y), Math.max(e.a.y, e.b.y)] : [Math.min(e.a.x, e.b.x), Math.max(e.a.x, e.b.x)];
function P(e, t) {
	if (e.vertical !== t.vertical) return !1;
	let n = e.vertical ? e.a.x - t.a.x : e.a.y - t.a.y;
	if (Math.abs(n) > j) return !1;
	let [r, i] = N(e), [a, o] = N(t);
	return Math.min(i, o) - Math.max(r, a) > 2;
}
var F = (e, t, n) => e.x < t.x + t.width + n && t.x < e.x + e.width + n && e.y < t.y + t.height + n && t.y < e.y + e.height + n;
function I(e, t) {
	if (e.vertical) {
		let [n, r] = N(e);
		return e.a.x > t.x + .5 && e.a.x < t.x + t.width - .5 && r > t.y + .5 && n < t.y + t.height - .5;
	}
	let [n, r] = N(e);
	return e.a.y > t.y + .5 && e.a.y < t.y + t.height - .5 && r > t.x + .5 && n < t.x + t.width - .5;
}
function L(e, t) {
	let { width: n, height: r } = x.node, i = Object.values(t.at).map((e) => ({
		...e,
		width: n,
		height: r
	})), a = e.flows.filter((e) => t.flows[e.index] && !t.flows[e.index].twin), o = new Map(a.map((e) => [e.index, oe(e.index, t.flows[e.index].points)])), s = [...o.values()].flat(), c = (e) => t.flows[e].points[0], l = (e) => t.flows[e].points.at(-1), u = (e, t) => Math.abs(e.x - t.x) < j && Math.abs(e.y - t.y) < j, d = [], f = /* @__PURE__ */ new Map(), p = (e) => s.filter((t) => t.flow !== e.flow && P(e, t));
	function m(t, n) {
		let r = o.get(t), i = (t) => p(t).every((t) => e.flows.find((e) => e.index === t.flow)?.label === n), s = r.filter((e) => !p(e).length), d = r.filter((e) => p(e).length && i(e)), f = a.some((e) => e.index !== t && u(c(e.index), c(t))), m = a.some((e) => e.index !== t && u(l(e.index), l(t))), h = (e) => {
			let [t, n] = N(e);
			return n - t;
		}, g = (e) => f && !m ? [...e].reverse() : m && !f ? e : [...e].sort((e, t) => h(t) - h(e));
		return a.some((e) => e.index !== t && e.label === n && (u(c(e.index), c(t)) || u(l(e.index), l(t)))) ? [...g(d), ...g(s)] : [...g(s), ...g(d)];
	}
	function h(e, t, n) {
		let [r, i] = N(e), a = e.vertical ? n : t;
		return i - r < a + M.end * 2 ? [] : ae.map((o) => {
			let s = Math.min(i - M.end - a / 2, Math.max(r + M.end + a / 2, r + (i - r) * o)), c = e.vertical ? {
				x: e.a.x,
				y: s
			} : {
				x: s,
				y: e.a.y
			};
			return {
				x: c.x - t / 2,
				y: c.y - n / 2,
				width: t,
				height: n
			};
		});
	}
	let g = (e, t, n) => i.every((t) => !F(e, t, M.part)) && d.every((t) => !F(e, t, M.plate)) && s.every((r) => r.flow === t || P(n, r) || !I(r, {
		x: e.x - 5,
		y: e.y - 5,
		width: e.width + 10,
		height: e.height + 10
	})), _ = a.filter((e) => e.label).sort((e, n) => Number(t.flows[e.index].quiet) - Number(t.flows[n.index].quiet) || e.label.length - n.label.length || e.index - n.index);
	for (let e of _) {
		if (f.has(e.index)) continue;
		let n = T(e.label), r = E(e.label), i = m(e.index, e.label), a = null;
		for (let t of i) {
			for (let i of h(t, n, r)) if (g(i, e.index, t)) {
				a = {
					box: i,
					segment: t
				};
				break;
			}
			if (a) break;
		}
		if (a) {
			d.push(a.box);
			let t = {
				x: a.box.x + n / 2,
				y: a.box.y + r / 2
			};
			f.set(e.index, {
				at: t,
				resting: !0
			});
			for (let e of p(a.segment)) f.has(e.flow) || f.set(e.flow, {
				at: t,
				resting: !0
			});
			continue;
		}
		let o = i.flatMap((e) => h(e, n, r))[0], s = t.flows[e.index].points, c = s[Math.floor(s.length / 2)], l = s[Math.floor(s.length / 2) - 1] ?? c;
		f.set(e.index, {
			at: o ? {
				x: o.x + n / 2,
				y: o.y + r / 2
			} : {
				x: (c.x + l.x) / 2,
				y: (c.y + l.y) / 2
			},
			resting: !1
		});
	}
	return f;
}
// upstream/src/features/work/lib/diagram.ts
var R = /\b(analytics|metrics|telemetry|monitoring|observability|logs?|logging|traces?|tracing|apm|audit)\b/iu;
function z(e) {
	let t = e.layers.filter((t) => e.nodes.some((e) => e.layer === t.id)), n = (e) => {
		if (!t.length) return -1;
		let n = t.findIndex((t) => t.id === e);
		return n < 0 ? t.length : n;
	}, r = new Set(e.nodes.map((e) => e.id)), i = /* @__PURE__ */ new Set();
	return {
		lanes: t.map((e) => e.name),
		parts: e.nodes.map((e) => ({
			id: e.id,
			lane: n(e.layer),
			...R.test(e.name) ? { side: !0 } : {}
		})),
		flows: e.edges.map((e, t) => ({
			index: t,
			...e
		})).filter((e) => e.from !== e.to && r.has(e.from) && r.has(e.to)).filter((e) => !i.has(`${e.from}>${e.to}`) && !!i.add(`${e.from}>${e.to}`)).map((e) => ({
			index: e.index,
			from: e.from,
			to: e.to,
			label: e.label?.trim() ?? ""
		}))
	};
}
function B(e, t) {
	let { width: n, height: r } = x.node, i = D(e.lanes), a = (e) => {
		let r = t.beside.get(e);
		return n + (r?.before ? n + 64 : 0) + (r?.after ? n + 64 : 0);
	}, o = (e) => e.reduce((e, t) => e + a(t), 0) + Math.max(0, e.length - 1) * x.column, s = Math.max(0, ...t.rows.map(o)), c = {}, l = [], u = 0;
	t.rows.forEach((e, a) => {
		a && t.tierStart.has(a) && (u += x.tier), l.push(u);
		let d = i + (s - o(e)) / 2;
		for (let r of e) {
			let e = t.beside.get(r);
			e?.before && (c[e.before] = {
				x: d,
				y: u
			}, d += n + 64), c[r] = {
				x: d,
				y: u
			}, d += n, e?.after && (c[e.after] = {
				x: d + 64,
				y: u
			}, d += n + 64), d += x.column;
		}
		u += r + x.row;
	});
	let d = {};
	for (let i of e.flows) {
		let a = c[i.from], o = c[i.to], s;
		if (a.y === o.y) {
			let e = a.x < o.x, t = a.y + r / 2;
			s = [{
				x: e ? a.x + n : a.x,
				y: t
			}, {
				x: e ? o.x : o.x + n,
				y: t
			}];
		} else {
			let e = a.y < o.y, t = {
				x: a.x + n / 2,
				y: e ? a.y + r : a.y
			}, i = {
				x: o.x + n / 2,
				y: e ? o.y : o.y + r
			}, c = e ? i.y - x.row / 2 : i.y + x.row / 2;
			s = W([
				t,
				{
					x: t.x,
					y: c
				},
				{
					x: i.x,
					y: c
				},
				i
			]);
		}
		d[i.index] = {
			from: i.from,
			to: i.to,
			points: s,
			resting: !1,
			quiet: !t.forward.get(i.index) || !!H(e, i.to),
			back: !t.forward.get(i.index)
		};
	}
	return {
		way: "down",
		at: c,
		bounds: {
			x: 0,
			y: 0,
			width: i + s,
			height: Math.max(0, u - x.row)
		},
		gutter: i,
		tiers: U(e, t, l, r),
		flows: d,
		settled: !1
	};
}
function V(e, t) {
	let { width: n, height: r } = x.node, i = e.lanes.length ? S.header : 0, a = (e) => e.flatMap((e) => {
		let n = t.beside.get(e);
		return [
			...n?.before ? [n.before] : [],
			e,
			...n?.after ? [n.after] : []
		];
	}), o = Math.max(0, ...t.rows.map((e) => a(e).length)), s = {}, c = [], l = 0;
	t.rows.forEach((e, o) => {
		o && t.tierStart.has(o) && (l += x.tier), c.push(l), a(e).forEach((e, t) => s[e] = {
			x: l,
			y: i + t * (r + x.column)
		}), l += n + 72;
	});
	let u = {};
	for (let i of e.flows) {
		let a = s[i.from], o = s[i.to], c;
		if (a.x === o.x) {
			let e = a.y < o.y;
			c = [{
				x: a.x + n / 2,
				y: e ? a.y + r : a.y
			}, {
				x: o.x + n / 2,
				y: e ? o.y : o.y + r
			}];
		} else {
			let e = a.x < o.x, t = {
				x: e ? a.x + n : a.x,
				y: a.y + r / 2
			}, i = {
				x: e ? o.x : o.x + n,
				y: o.y + r / 2
			}, s = e ? i.x - 36 : i.x + 36;
			c = W([
				t,
				{
					x: s,
					y: t.y
				},
				{
					x: s,
					y: i.y
				},
				i
			]);
		}
		u[i.index] = {
			from: i.from,
			to: i.to,
			points: c,
			resting: !1,
			quiet: !t.forward.get(i.index) || !!H(e, i.to),
			back: !t.forward.get(i.index)
		};
	}
	return {
		way: "right",
		at: s,
		bounds: {
			x: 0,
			y: 0,
			width: Math.max(0, l - 72),
			height: i + Math.max(0, o * (r + x.column) - x.column)
		},
		gutter: i,
		tiers: U(e, t, c, n),
		flows: u,
		settled: !1
	};
}
var H = (e, t) => e.parts.find((e) => e.id === t)?.side;
function U(e, t, n, r) {
	return e.lanes.length ? t.tiers.flatMap((t) => {
		let i = e.lanes[t.lane], a = n[t.first], o = n[t.last];
		return i === void 0 || a === void 0 || o === void 0 ? [] : [{
			name: i,
			start: a,
			extent: o + r - a
		}];
	}) : [];
}
function W(e) {
	let t = [], n = (e, t) => Math.abs(e - t) < .01;
	for (let r of e) {
		let e = t.at(-1);
		if (e && n(e.x, r.x) && n(e.y, r.y)) continue;
		let i = t.at(-2);
		i && e && (n(i.x, e.x) && n(e.x, r.x) || n(i.y, e.y) && n(e.y, r.y)) && t.pop(), t.push(r);
	}
	return t;
}
function G(e, t = 0, n = 8) {
	if (e.length < 2) return "";
	let r = e.at(-1), i = e.at(-2), a = Math.hypot(r.x - i.x, r.y - i.y) || 1, o = Math.min(t, a), s = {
		x: r.x - (r.x - i.x) / a * o,
		y: r.y - (r.y - i.y) / a * o
	}, c = [...e.slice(0, -1), s], l = `M ${c[0].x},${c[0].y}`;
	for (let e = 1; e < c.length - 1; e += 1) {
		let [t, r, i] = [
			c[e - 1],
			c[e],
			c[e + 1]
		], a = Math.hypot(r.x - t.x, r.y - t.y), o = Math.hypot(i.x - r.x, i.y - r.y), s = Math.min(n, a / 2, o / 2);
		if (!s) {
			l += ` L ${r.x},${r.y}`;
			continue;
		}
		let u = {
			x: r.x - (r.x - t.x) / a * s,
			y: r.y - (r.y - t.y) / a * s
		}, d = {
			x: r.x + (i.x - r.x) / o * s,
			y: r.y + (i.y - r.y) / o * s
		};
		l += ` L ${u.x},${u.y} Q ${r.x},${r.y} ${d.x},${d.y}`;
	}
	return `${l} L ${s.x},${s.y}`;
}
function K(e, t = 5) {
	let n = e.at(-1), r = e.at(-2);
	if (!n || !r) return "";
	let i = Math.hypot(n.x - r.x, n.y - r.y) || 1, [a, o] = [(n.x - r.x) / i, (n.y - r.y) / i], s = {
		x: n.x - a * t,
		y: n.y - o * t
	}, c = t * .7;
	return `M ${n.x},${n.y} L ${s.x - o * c},${s.y + a * c} L ${s.x + o * c},${s.y - a * c} Z`;
}
var se = {
	ArrowRight: {
		x: 1,
		y: 0
	},
	ArrowLeft: {
		x: -1,
		y: 0
	},
	ArrowDown: {
		x: 0,
		y: 1
	},
	ArrowUp: {
		x: 0,
		y: -1
	}
};
function ce(e, t, n) {
	let r = se[n];
	if (!r) return null;
	let i = null;
	for (let { id: n, at: a } of t) {
		let t = a.x - e.x, o = a.y - e.y, s = t * r.x + o * r.y;
		if (s <= 0) continue;
		let c = s + 2 * Math.abs(t * r.y - o * r.x);
		(!i || c < i.cost) && (i = {
			id: n,
			cost: c
		});
	}
	return i?.id ?? null;
}
var q = new e(), J = /* @__PURE__ */ new Map(), Y = /* @__PURE__ */ new Set(), X = 48, le = (e, t) => `${t}${JSON.stringify(e)}`;
function Z(e, t, n) {
	let r = J.get(t);
	if (!r) {
		let i = O(e);
		r = Q(e, n === "down" ? B(e, i) : V(e, i)), J.size >= X && J.delete(J.keys().next().value), J.set(t, r);
	}
	return r;
}
function Q(e, t) {
	let n = L(e, t), r = {};
	for (let [e, i] of Object.entries(t.flows)) {
		let t = n.get(Number(e)), { plate: a, ...o } = i;
		r[Number(e)] = t ? {
			...o,
			plate: t.at,
			resting: t.resting
		} : {
			...o,
			resting: !1
		};
	}
	return {
		...t,
		flows: r
	};
}
function $(e, t = "right") {
	let n = z(e), r = le(n, t);
	return q.get(r) || (typeof window < "u" && !Y.has(r) && ue(n, r, t), Z(n, r, t));
}
async function ue(e, t, n) {
	if (Y.add(t), !e.parts.length) return Z(e, t, n);
	try {
		let { engineLayout: r } = await import("./diagram-worker-Cv_zi_Fx.js"), i = Q(e, await r(e, n));
		return q.size >= X && q.delete(q.keys().next().value), q.set(t, i), i;
	} catch {
		return Z(e, t, n);
	}
}
var de = {
	client: a,
	edge: s,
	gateway: d,
	service: v,
	worker: ie,
	model: p,
	store: y,
	queue: _,
	cache: r,
	storage: ne,
	external: l
}, fe = (e) => de[e]?.() ?? h(), pe = (e) => Math.ceil($(e).bounds.width);
export { pe as a, U as c, C as d, S as f, T as h, $ as i, O as l, E as m, W as n, G as o, D as p, fe as r, ce as s, K as t, x as u };
