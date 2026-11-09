import { c as e, d as t, f as n, h as r, l as i, m as a, n as o, p as s, u as c } from "./diagram-BHIHFDf6.js";
// upstream/src/features/work/lib/diagram-route.ts
function l(e, t) {
	let n = (e) => t.rowOf.get(e), r = new Set(e.flows.map((e) => `${e.from}\n${e.to}`)), i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), o = [], s = /* @__PURE__ */ new Map(), c = [], l = [], d = (e, t, n, r, i) => {
		let a = s.get(e);
		a || (a = {
			kind: t,
			roots: [n],
			leaves: []
		}, s.set(e, a), o.push(a)), a.leaves.push({
			index: r,
			part: i,
			root: n
		});
	};
	for (let t of e.flows) {
		let [e, o] = [n(t.from), n(t.to)];
		if (e === o) {
			c.push({
				index: t.index,
				from: t.from,
				to: t.to
			});
			continue;
		}
		let s = a.get(`${t.to}\n${t.from}`);
		if (s !== void 0) i.set(t.index, s);
		else if (r.has(`${t.to}\n${t.from}`)) {
			a.set(`${t.from}\n${t.to}`, t.index);
			let [n, r] = e < o ? [t.from, t.to] : [t.to, t.from];
			d(`pair|${n}`, "pair", n, t.index, r);
		} else e < o ? l.push(t) : d(`back|${t.to}`, "back", t.to, t.index, t.from);
	}
	let f = u(l, n);
	for (let e of f) o.push(e);
	let p = new Set(f.flatMap((e) => e.leaves.map((e) => e.index)));
	for (let e of l) p.has(e.index) || d(`down|${e.from}`, "down", e.from, e.index, e.to);
	return {
		trees: o,
		lateral: c,
		twins: i
	};
}
function u(e, t) {
	let n = [], r = /* @__PURE__ */ new Map();
	for (let t of e) r.has(t.from) || n.push(t.from), r.set(t.from, (r.get(t.from) ?? /* @__PURE__ */ new Set()).add(t.to));
	let i = n.map((e) => [e]), a = (e, n) => {
		let i = Math.max(...[...e, ...n].map(t)), a = (e) => new Set(e.flatMap((e) => [...r.get(e)]).filter((e) => t(e) > i)), [o, s] = [a(e), a(n)], c = [...o].filter((e) => s.has(e)).length;
		return c >= 2 && c / (/* @__PURE__ */ new Set([...o, ...s])).size >= .5;
	};
	for (let e = !0; e;) {
		e = !1;
		for (let t = 0; t < i.length && !e; t += 1) for (let n = t + 1; n < i.length && !e; n += 1) a(i[t], i[n]) && (i[t] = [...i[t], ...i[n]], i.splice(n, 1), e = !0);
	}
	return i.filter((e) => e.length > 1).map((r) => ({
		kind: "down",
		roots: [...r].sort((e, r) => t(e) - t(r) || n.indexOf(e) - n.indexOf(r)),
		leaves: e.filter((e) => r.includes(e.from)).map((e) => ({
			index: e.index,
			part: e.to,
			root: e.from
		}))
	}));
}
var d = (e, t) => Math.min(...e.roots.map((e) => t.rowOf.get(e)));
function f(e, t) {
	let n = d(e, t), r = Math.max(...e.leaves.map((e) => t.rowOf.get(e.part)));
	return Array.from({ length: Math.max(0, r - n - 1) }, (e, t) => n + 1 + t);
}
var p = 10, m = .5, h = (e, t) => Math.abs(e - t) < m, g = (e, t) => t > e.lo + m && t < e.hi - m, _ = (e) => e.hi - e.lo < m, v = (e, t) => e.lo < t.hi + p && t.lo < e.hi + p, y = (e, t) => ({
	stems: e,
	drops: t,
	lo: Math.min(...e, ...t),
	hi: Math.max(...e, ...t),
	level: 0
});
function b(e, t) {
	let n = 0;
	for (let r of e.drops) t.stems.some((e) => h(e, r)) ? n += 100 : g(t, r) && !t.drops.some((e) => h(e, r)) && (n += 1);
	for (let r of t.stems) g(e, r) && (n += 1);
	return n;
}
function* x(e) {
	let t = Array.from({ length: e }, (e, t) => t), n = function* (r) {
		if (r === e) yield t;
		else for (let i = r; i < e; i += 1) [t[r], t[i]] = [t[i], t[r]], yield* n(r + 1), [t[r], t[i]] = [t[i], t[r]];
	};
	yield* n(0);
}
function S(e, t) {
	let n = e.filter((e) => !_(e));
	if (!n.length) return 0;
	let r = (e) => {
		let t = [];
		return e.forEach((r, i) => {
			let a = 0;
			for (let o of e.slice(0, i)) v(n[r], n[o]) && (a = Math.max(a, t[o] + 1));
			t[r] = a;
		}), t;
	}, i = (e) => {
		let t = 0;
		for (let r = 0; r < e.length; r += 1) for (let i = r + 1; i < e.length; i += 1) {
			let [a, o] = [n[e[r]], n[e[i]]];
			v(a, o) && (t += b(a, o));
		}
		return t;
	}, a = null, o = (e) => {
		let t = i(e), n = Math.max(...r(e));
		(!a || t < a.score || t === a.score && n < a.depth) && (a = {
			order: [...e],
			score: t,
			depth: n
		});
	};
	if (n.length <= 6) for (let e of x(n.length)) o(e);
	else o(n.map((e, t) => ({
		at: Math.min(...e.stems),
		index: t
	})).sort((e, t) => e.at - t.at).map((e) => e.index));
	let s = r(a.order);
	return n.forEach((e, n) => e.level = t + s[n]), Math.max(...s) + 1;
}
function ee(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
	for (let r of e) for (let e of r.drops) e.key.startsWith("p") && (t.set(e.key, (t.get(e.key) ?? /* @__PURE__ */ new Set()).add(r.tree)), n.set(e.key, e.at));
	let r = /* @__PURE__ */ new Map();
	for (let [e, n] of t) {
		if (n.size < 2) continue;
		let t = [...n].sort((e, t) => e - t), i = t.join(","), a = r.get(i) ?? {
			trees: t,
			keys: []
		};
		a.keys.push(e), r.set(i, a);
	}
	let i = /* @__PURE__ */ new Set(), a = [...r.values()].filter((e) => e.keys.length >= 2).sort((e, t) => t.trees.length * t.keys.length - e.trees.length * e.keys.length).filter((e) => {
		if (e.trees.some((e) => i.has(e))) return !1;
		for (let t of e.trees) i.add(t);
		return !0;
	}), o = new Set(a.flatMap((e) => e.trees.flatMap((t) => e.keys.map((e) => `${t}|${e}`)))), s = new Map(e.map((e) => [e.tree, e.stems])), c = e.flatMap((e) => {
		let t = e.drops.filter((t) => !o.has(`${e.tree}|${t.key}`));
		return t.length ? [{
			step: e,
			run: y(e.stems, t.map((e) => e.at)),
			keys: t
		}] : [];
	}), l = a.map((e) => ({
		group: e,
		run: y(e.trees.flatMap((e) => s.get(e)), e.keys.map((e) => n.get(e)))
	})), u = S(c.map((e) => e.run), 0), d = S(l.map((e) => e.run), u), f = /* @__PURE__ */ new Map();
	for (let { step: e, run: t, keys: n } of c) for (let r of n) f.set(`${e.tree}|${r.key}`, _(t) ? null : t.level);
	for (let { group: e, run: t } of l) for (let n of e.trees) for (let r of e.keys) f.set(`${n}|${r}`, t.level);
	return {
		levels: u + d,
		level: f
	};
}
function te(e) {
	return e.map((t, n) => {
		let r = [t[0]];
		for (let i = 1; i < t.length; i += 1) {
			let [a, o] = [t[i - 1], t[i]], s = h(a.x, o.x) ? "y" : "x", c = Math.min(a[s], o[s]), l = Math.max(a[s], o[s]), u = s === "y" ? "x" : "y", d = e.flatMap((e, t) => t === n ? [] : e).filter((e) => h(e[u], a[u]) && e[s] > c + m && e[s] < l - m).map((e) => e[s]), f = [...new Set(d.map((e) => Math.round(e * 10) / 10))].sort((e, t) => a[s] < o[s] ? e - t : t - e);
			for (let e of f) r.push(s === "y" ? {
				x: a.x,
				y: e
			} : {
				x: e,
				y: a.y
			});
			r.push(o);
		}
		return r;
	});
}
// upstream/src/features/work/lib/diagram-worker.ts
var C = {
	"elk.algorithm": "layered",
	"elk.direction": "DOWN",
	"elk.edgeRouting": "ORTHOGONAL",
	"elk.layered.layering.strategy": "INTERACTIVE",
	"elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
	"elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
	"elk.layered.thoroughness": "12",
	"elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
	"elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
	"elk.layered.nodePlacement.favorStraightEdges": "true",
	"elk.spacing.nodeNode": String(c.column),
	"elk.layered.spacing.nodeNodeBetweenLayers": "40",
	"elk.separateConnectedComponents": "false",
	"elk.padding": "[top=0,left=0,bottom=0,right=0]",
	"elk.randomSeed": "1"
}, { width: w, height: T } = c.node, E = (e) => e === "down" ? {
	across: w,
	along: T
} : {
	across: T,
	along: w
};
function D(e, n) {
	return n ? e === "down" ? Math.min(t.max + 32, Math.max(40, r(n) + 28)) : Math.max(40, a(n) + 26) : 40;
}
function O(e, t, n) {
	let { across: r } = E(n), i = (t, n) => e.flows.find((e) => e.from === t && e.to === n)?.label ?? "", a = /* @__PURE__ */ new Map();
	for (let e of t.rows.flat()) {
		let o = t.beside.get(e), s = o?.before ? D(n, i(e, o.before)) : 0, c = o?.after ? D(n, i(e, o.after)) : 0, l = o?.before ? r + s : 0;
		a.set(e, {
			width: l + r + (o?.after ? c + r : 0),
			offset: l,
			...o?.before ? { before: s } : {},
			...o?.after ? { after: c } : {}
		});
	}
	return a;
}
var k = (e) => {
	let t = new Map(e.parts.map((e, t) => [e.id, `n${t}`]));
	return (e) => t.get(e);
}, A = (e, t) => `t${e}r${t}`;
function j(e, t = i(e), r = "down") {
	let { across: a, along: o } = E(r), s = k(e), c = O(e, t, r), u = l(e, t), p = [], m = (e, t, n) => [{
		id: `${e}in`,
		x: t,
		y: 0,
		width: 0,
		height: 0,
		layoutOptions: { "elk.port.side": "NORTH" }
	}, {
		id: `${e}out`,
		x: t,
		y: n,
		width: 0,
		height: 0,
		layoutOptions: { "elk.port.side": "SOUTH" }
	}], h = u.trees.map((e) => f(e, t)), g = /* @__PURE__ */ new Map();
	t.rows.forEach((e, t) => {
		let r = e.map((t, n) => {
			let r = c.get(t);
			return g.set(s(t), (n + .5) / e.length), {
				key: g.get(s(t)),
				node: {
					id: s(t),
					width: r.width,
					height: o,
					ports: m(s(t), r.offset + a / 2, o),
					layoutOptions: { "elk.portConstraints": "FIXED_POS" }
				}
			};
		});
		h.forEach((i, a) => {
			if (!i.includes(t)) return;
			let c = i.includes(t - 1) ? A(a, t - 1) : s(u.trees[a].roots[0]), l = e.length > 1 ? [.5 / e.length, 1 - .5 / e.length] : [-1, 2], d = Math.min(l[1] - .01, Math.max(l[0] + .01, g.get(c) ?? 1));
			g.set(A(a, t), d + .001 * (a + 1)), r.push({
				key: g.get(A(a, t)),
				node: {
					id: A(a, t),
					width: n.pass,
					height: o,
					ports: m(A(a, t), n.pass / 2, o),
					layoutOptions: { "elk.portConstraints": "FIXED_POS" }
				}
			});
		}), r.sort((e, t) => e.key - t.key).forEach((e, n) => p.push({
			...e.node,
			x: n * 400,
			y: t * 400
		}));
	});
	let _ = [];
	return u.trees.forEach((e, n) => {
		let r = d(e, t), i = new Set(h[n]), a = Math.max(...e.leaves.map((e) => t.rowOf.get(e.part)));
		for (let o = r + 1; o <= a; o += 1) {
			let r = [...i.has(o - 1) ? [A(n, o - 1)] : [], ...e.roots.filter((e) => t.rowOf.get(e) === o - 1).map(s)], a = [...new Set(e.leaves.filter((e) => t.rowOf.get(e.part) === o).map((e) => s(e.part))), ...i.has(o) ? [A(n, o)] : []];
			for (let e of r) for (let t of a) _.push({
				id: `s${n}_${e}_${t}`,
				sources: [`${e}out`],
				targets: [`${t}in`]
			});
		}
	}), {
		id: "diagram",
		layoutOptions: C,
		children: p,
		edges: _
	};
}
var M = (e) => Math.round(e * 10) / 10;
function N(i, u, p, m) {
	let { across: h, along: g } = E(m), _ = k(i), v = O(i, p, m), y = l(i, p), b = new Map((u.children ?? []).map((e) => [e.id, e])), x = (e) => p.rowOf.get(e), S = /* @__PURE__ */ new Map();
	for (let e of p.rows.flat()) {
		let t = v.get(e), n = b.get(_(e))?.x ?? 0;
		S.set(e, n + t.offset);
		let r = p.beside.get(e);
		r?.before && S.set(r.before, n), r?.after && S.set(r.after, n + t.offset + h + t.after);
	}
	for (let e = 1; e < p.rows.length; e += 1) {
		let [t] = p.rows[e], [n] = p.rows[e - 1];
		if (p.rows[e].length !== 1 || p.rows[e - 1].length !== 1 || !t || !n || p.beside.has(t) || p.beside.has(n)) continue;
		let r = i.flows.some((e) => e.from === n && e.to === t || e.from === t && e.to === n), a = S.get(t) - S.get(n);
		r && a && Math.abs(a) <= h * .6 && S.set(t, S.get(n));
	}
	let C = (e, t) => (b.get(A(e, t))?.x ?? 0) + n.pass / 2, D = n.port * h, j = (e, t) => S.get(t) + h / 2 + (e.kind === "back" ? D : e.kind === "pair" ? -D : 0), N = (e, t) => `p${e.kind === "down" ? "c" : e.kind === "back" ? "b" : "a"}|${t}`, P = (e) => `t${e}`, F = /* @__PURE__ */ new Map();
	y.trees.forEach((e, t) => {
		let n = d(e, p), r = new Set(f(e, p)), i = Math.max(...e.leaves.map((e) => x(e.part)));
		for (let a = n; a < i; a += 1) {
			let i = /* @__PURE__ */ new Map();
			for (let t of e.leaves) x(t.part) === a + 1 && i.set(N(e, t.part), j(e, t.part));
			r.has(a + 1) && i.set(P(t), C(t, a + 1));
			let o = [...a === n ? [] : [C(t, a)], ...e.roots.filter((e) => x(e) === a).map((t) => j(e, t))];
			F.set(a, [...F.get(a) ?? [], {
				tree: t,
				stems: o,
				drops: [...i].map(([e, t]) => ({
					key: e,
					at: t
				}))
			}]);
		}
	});
	let I = /* @__PURE__ */ new Map(), L = /* @__PURE__ */ new Map();
	for (let e of F.values()) for (let t of e) for (let e of t.drops) L.set(e.key, (L.get(e.key) ?? 0) + 1);
	for (let e of F.values()) for (let t of e) for (let e of t.drops) {
		let n = e.key.startsWith("p") ? e.key.slice(e.key.indexOf("|") + 1) : "";
		if (!n || L.get(e.key) !== 1) continue;
		let r = S.get(n), i = Math.min(24, h / 4), a = t.stems.length === 1 ? t.stems[0] : NaN;
		a >= r + i && a <= r + h - i && (I.set(`${t.tree}|${e.key}`, a), e.at = a);
	}
	let R = p.rows.slice(0, -1).map((e, t) => ee(F.get(t) ?? [])), z = (e) => i.flows.find((t) => t.index === e)?.label ?? "", B = /* @__PURE__ */ new Map();
	for (let e of y.trees) for (let t of e.leaves) {
		let e = z(t.index);
		if (!e) continue;
		let n = x(t.part) - 1;
		B.set(n, [...B.get(n) ?? [], e]);
	}
	let V = (e) => {
		let i = B.get(e) ?? [];
		if (m === "down") return i.some((e) => a(e) > t.height) ? t.line : 0;
		let o = Math.max(0, ...i.map(r));
		return o ? Math.max(0, Math.min(t.max, o) + 16 - n.drop) : 0;
	}, H = R.map(({ levels: e }, t) => e ? n.stem + (e - 1) * n.track + n.drop + V(t) : n.straight + V(t)), U = [];
	p.rows.forEach((e, t) => {
		U.push(t ? U[t - 1] + g + H[t - 1] + (p.tierStart.has(t) ? c.tier : 0) : 0);
	});
	let W = /* @__PURE__ */ new Map();
	y.trees.forEach((e, t) => {
		for (let r of e.leaves) {
			let [a, s] = [x(r.root), x(r.part)], c = [{
				x: j(e, r.root),
				y: U[a] + g
			}];
			for (let i = a; i < s; i += 1) {
				let o = i + 1 === s, l = o ? N(e, r.part) : P(t), u = i === a ? j(e, r.root) : C(t, i), d = o ? I.get(`${t}|${l}`) ?? j(e, r.part) : C(t, i + 1), f = R[i].level.get(`${t}|${l}`);
				if (f != null) {
					let e = U[i] + g + n.stem + f * n.track;
					c.push({
						x: u,
						y: e
					}, {
						x: d,
						y: e
					});
				}
				c.push({
					x: d,
					y: U[i + 1]
				}), o || c.push({
					x: d,
					y: U[i + 1] + g
				});
			}
			let l = i.flows.find((e) => e.index === r.index), u = o(c);
			W.set(r.index, l.from === r.root ? u : u.reverse());
		}
	});
	for (let e of y.lateral) {
		let [t, n] = [S.get(e.from), S.get(e.to)], r = U[x(e.from)] + g / 2;
		W.set(e.index, t < n ? [{
			x: t + h,
			y: r
		}, {
			x: n,
			y: r
		}] : [{
			x: t,
			y: r
		}, {
			x: n + h,
			y: r
		}]);
	}
	let G = [...W.keys()], ne = te(G.map((e) => W.get(e)));
	G.forEach((e, t) => W.set(e, ne[t]));
	let K = m === "down" ? s(i.lanes) : i.lanes.length ? n.header : 0, q = (e) => m === "down" ? {
		x: M(e.x + K),
		y: M(e.y)
	} : {
		x: M(e.y),
		y: M(e.x + K)
	}, J = {};
	for (let [e, t] of S) J[e] = q({
		x: t,
		y: U[x(e)]
	});
	let Y = (e) => !!i.parts.find((t) => t.id === e)?.side, X = {}, re = new Map([...y.twins].map(([e, t]) => [t, e])), ie = new Map(y.trees.flatMap((e) => e.leaves.map((t) => [t.index, e])));
	for (let e of i.flows) {
		let t = W.get(e.index);
		if (!t) continue;
		let n = ie.get(e.index), r = t.map(q), a = n?.kind === "back", o = n?.kind === "pair" ? Y(n.leaves[0].part) : a || Y(e.to);
		X[e.index] = {
			from: e.from,
			to: e.to,
			points: r,
			resting: !1,
			quiet: o,
			back: a
		};
		let s = re.get(e.index);
		if (s !== void 0) {
			let e = i.flows.find((e) => e.index === s);
			X[s] = {
				from: e.from,
				to: e.to,
				points: [...r].reverse(),
				resting: !1,
				quiet: o,
				back: !1,
				twin: !0
			};
		}
	}
	let Z = {
		w,
		h: T
	}, ae = [...Object.values(J).map((e) => e.x + Z.w), ...Object.values(X).flatMap((e) => e.points.map((e) => e.x))], oe = [...Object.values(J).map((e) => e.y + Z.h), ...Object.values(X).flatMap((e) => e.points.map((e) => e.y))], Q = 0;
	y.trees.forEach((e, t) => {
		for (let n of f(e, p)) {
			let e = p.rows[n];
			if (e.length < 2) continue;
			let r = Math.min(...e.map((e) => b.get(_(e))?.x ?? 0)), i = Math.max(...e.map((e) => (b.get(_(e))?.x ?? 0) + v.get(e).width)), a = C(t, n);
			(a < r || a > i) && (Q += 1);
		}
	});
	let $ = p.rows.map((e) => {
		let t = e.map((e) => S.get(e));
		return (Math.min(...t) + Math.max(...t) + h) / 2;
	}), se = [...S.values()], ce = Math.max(...se) + h - Math.min(...se);
	return {
		layout: {
			way: m,
			at: J,
			bounds: {
				x: 0,
				y: 0,
				width: Math.ceil(Math.max(0, ...ae)),
				height: Math.ceil(Math.max(0, ...oe))
			},
			gutter: K,
			tiers: e(i, p, U, g),
			flows: X,
			settled: !0
		},
		even: Math.max(...$) - Math.min(...$) <= ce * .3,
		wraps: Q
	};
}
var P = null, F, I = 15e3;
function L() {
	return P ??= typeof document > "u" ? import(
		/* @vite-ignore */
		"elkjs/lib/elk.bundled.js"
).then((e) => new e.default()) : new Promise((e, t) => {
		let n = document.createElement("script");
		n.src = "", n.addEventListener("load", () => {
			let n = globalThis.ELK;
			n ? e(new n()) : t(/* @__PURE__ */ Error("elk"));
		}), n.addEventListener("error", () => t(/* @__PURE__ */ Error("elk"))), document.head.append(n);
	}), P;
}
function R() {
	if (F !== void 0) return F;
	try {
		let e = new Worker(new URL(
			/* @vite-ignore */
			new URL("assets/diagram-layout.worker.js", import.meta.url).href,
			"" + import.meta.url
		), { type: "module" }), t = /* @__PURE__ */ new Map(), n = 0, r, i = (i) => new Promise((a, o) => {
			clearTimeout(r);
			let s = n++;
			t.set(s, {
				resolve: a,
				reject: o
			}), e.postMessage({
				...i,
				id: s
			});
		});
		e.addEventListener("message", (n) => {
			let i = t.get(n.data.id);
			t.delete(n.data.id), n.data.error ? i?.reject(Error(String(n.data.error))) : i?.resolve(n.data.data), t.size || (clearTimeout(r), r = setTimeout(() => {
				t.size || F?.elk !== o || (e.terminate(), F = void 0);
			}, I));
		});
		let a = new Promise((t, n) => e.addEventListener("error", () => n(/* @__PURE__ */ Error("worker")), { once: !0 }));
		a.catch(() => {
			F?.elk === o && (F = null);
		}), i({
			cmd: "register",
			algorithms: ["layered"]
		}).catch(() => {});
		let o = { layout: (e) => i({
			cmd: "layout",
			graph: e,
			layoutOptions: {},
			options: {}
		}) };
		F = {
			elk: o,
			failed: a
		};
	} catch {
		F = null;
	}
	return F;
}
async function z(e) {
	let t = typeof Worker > "u" ? null : R();
	if (t) try {
		return await Promise.race([t.elk.layout(e), t.failed]);
	} catch (e) {
		if (F) throw e;
	}
	return (await L()).layout(e);
}
var B = {
	down: [
		[c.across, "NETWORK_SIMPLEX"],
		[c.across, "BRANDES_KOEPF"],
		[c.across, "SIMPLE"],
		[c.across - 1, "SIMPLE"],
		[c.across - 2, "SIMPLE"]
	],
	right: [[c.across, "NETWORK_SIMPLEX"], [c.across, "SIMPLE"]]
}, V = (e) => e.bounds.width <= c.reach * 1.06;
function H(e) {
	let t = /* @__PURE__ */ new Map(), n = [], r = /* @__PURE__ */ new Set();
	Object.values(e.flows).forEach((e, i) => {
		if (e.twin) return;
		let a = e.points;
		a.slice(1).forEach((e, o) => {
			let s = a[o], c = Math.abs(s.y - e.y) < .5, l = c ? `h${Math.round(s.y)}` : `v${Math.round(s.x)}`, u = c ? [Math.min(s.x, e.x), Math.max(s.x, e.x)] : [Math.min(s.y, e.y), Math.max(s.y, e.y)];
			if (t.set(l, [...t.get(l) ?? [], u]), n.push([
				s,
				e,
				i
			]), o > 0) {
				let e = a[o - 1];
				Math.abs(e.y - s.y) < .5 !== c && r.add(`${Math.round(s.x)},${Math.round(s.y)}`);
			}
		});
	});
	let i = 0;
	for (let e of t.values()) {
		e.sort((e, t) => e[0] - t[0]);
		let [t, n] = e[0];
		for (let [r, a] of e.slice(1)) r > n ? (i += n - t, [t, n] = [r, a]) : n = Math.max(n, a);
		i += n - t;
	}
	let a = /* @__PURE__ */ new Set();
	for (let [e, t, r] of n) if (!(Math.abs(e.y - t.y) >= .5)) for (let [i, o, s] of n) s === r || Math.abs(i.x - o.x) >= .5 || i.x > Math.min(e.x, t.x) + 1 && i.x < Math.max(e.x, t.x) - 1 && e.y > Math.min(i.y, o.y) + 1 && e.y < Math.max(i.y, o.y) - 1 && a.add(`${Math.round(i.x)},${Math.round(e.y)}`);
	return i + r.size * 40 + a.size * 240;
}
function U(e, t, n, r) {
	let i = new Map((t.children ?? []).map((e) => [e.id, e])), a = (e) => i.get(e)?.x ?? 0, o = (e) => a(e) + (i.get(e)?.width ?? 0), s = (t) => a(t) + (e.children.find((e) => e.id === t)?.ports?.[0]?.x ?? 0), c = k(n), u = l(n, r), d = [];
	return r.rows.forEach((t, n) => {
		let r = new Set(t.map(c)), i = e.children.filter((e) => r.has(e.id) || e.id.startsWith("t") && e.id.endsWith(`r${n}`)), l = i.filter((e) => !e.id.startsWith("t")).sort((e, t) => a(e.id) - a(t.id)), f = i.filter((e) => e.id.startsWith("t")).map((e) => {
			let t = u.trees[Number(/^t(\d+)r/u.exec(e.id)[1])], n = s(c(t.roots[0])), r = 0;
			if (l.length > 1) {
				let e = Infinity;
				for (let t = 1; t < l.length; t += 1) {
					let i = (o(l[t - 1].id) + a(l[t].id)) / 2;
					Math.abs(i - n) < e && ([e, r] = [Math.abs(i - n), t]);
				}
			} else l.length === 1 && (r = n < s(l[0].id) ? 0 : 1);
			return {
				child: e,
				gap: r,
				want: n
			};
		}).sort((e, t) => e.gap - t.gap || e.want - t.want), p = [];
		l.forEach((e, t) => {
			for (let e of f) e.gap === t && p.push(e.child);
			p.push(e);
		});
		for (let e of f) e.gap >= l.length && p.push(e.child);
		p.forEach((e, t) => d.push({
			...e,
			x: t * 400
		}));
	}), {
		...e,
		children: d,
		layoutOptions: {
			...e.layoutOptions,
			"elk.layered.crossingMinimization.strategy": "INTERACTIVE"
		}
	};
}
async function W(e, t) {
	let n = null;
	for (let [r, a] of B[t]) {
		let o = i(e, r), s = j(e, o, t);
		s.layoutOptions = {
			...s.layoutOptions,
			"elk.layered.nodePlacement.strategy": a
		};
		let c = await z(s), l = j(e, o, t);
		l.layoutOptions = s.layoutOptions;
		let { layout: u, even: d } = [N(e, c, o, t), N(e, await z(U(l, c, e, o)), o, t)].filter((e, t) => t === 1 || !e.wraps).sort((e, t) => H(e.layout) - H(t.layout))[0];
		if ((t === "right" || V(u)) && (a === "SIMPLE" || d)) return u;
		(!n || u.bounds.width < n.bounds.width) && (n = u);
	}
	return n;
}
async function G(e, t = "right") {
	if (!e.parts.length) throw Error("empty");
	return W(e, t);
}
export { G as engineLayout };
