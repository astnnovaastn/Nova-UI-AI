import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, F as r, Ft as i, H as a, J as o, K as s, M as c, N as l, Ot as u, Pt as d, R as f, Rt as p, S as m, U as h, V as g, _t as _, c as v, dt as y, ft as b, h as x, ht as S, ot as C, pt as w, q as T, r as E, s as ee, st as te, ut as D, x as ne, yt as O } from "./index-client-C_2wYFnt.js";
import { a as re, c as k, i as ie, n as ae, o as oe, r as se, s as ce, t as le } from "./versus-DMEgJnIZ.js";
import "./Chart-CDaCpqw7.js";
import { i as A } from "./chart-CGAGKx76.js";
import { t as ue } from "./vendors-Bfd9iIH1.js";
import { t as de } from "./Title-BF8NXEcN.js";
import { n as fe, t as j } from "./Mark-BTIzBHOo.js";
import { t as M } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_object_no.js
var N = () => "No", P = ((e = {}, t = {}) => (t.locale ?? M(), N(e))), F = () => "Partly", I = ((e = {}, t = {}) => (t.locale ?? M(), F(e))), pe = (e) => `${e?.value} out of ${e?.max}`, me = ((e, t = {}) => (t.locale ?? M(), pe(e))), L = (e) => `Show all ${e?.count}`, he = ((e, t = {}) => (t.locale ?? M(), L(e))), R = () => "Not known", ge = ((e = {}, t = {}) => (t.locale ?? M(), R(e))), z = () => "Yes", B = ((e = {}, t = {}) => (t.locale ?? M(), z(e))), V = () => "Fewer columns", _e = ((e = {}, t = {}) => (t.locale ?? M(), V(e))), H = () => "1 more column", ve = ((e = {}, t = {}) => (t.locale ?? M(), H(e))), ye = (e) => `${e?.count} more columns`, be = ((e, t = {}) => (t.locale ?? M(), ye(e))), xe = () => "Pick", Se = ((e = {}, t = {}) => (t.locale ?? M(), xe(e))), U = h("<circle cx=\"8\" cy=\"8\" r=\"7.25\" class=\"disc svelte-kf30s9\"></circle><path d=\"M4.9 8.3 7 10.3 11.2 5.9\" class=\"stroke svelte-kf30s9\"></path>", 1), Ce = h("<path d=\"M5.25 8h5.5\" class=\"stroke svelte-kf30s9\"></path>"), W = h("<circle cx=\"8\" cy=\"8\" r=\"6.5\" class=\"ring svelte-kf30s9\"></circle><path d=\"M8 1.5a6.5 6.5 0 0 1 0 13z\" class=\"half svelte-kf30s9\"></path>", 1), G = h("<circle cx=\"8\" cy=\"8\" r=\"1.2\" class=\"dot svelte-kf30s9\"></circle>"), K = h("<svg viewBox=\"0 0 16 16\" role=\"img\"><title> </title><!></svg>");
function we(a, o) {
	u(o, !0);
	let s = E(o, "size", 3, 16), c = O(() => o.value === "yes" ? B() : o.value === "no" ? P() : o.value === "partial" ? I() : ge());
	var l = K(), p = D(l), h = D(p, !0);
	i(p);
	var g = b(p), _ = (e) => {
		var n = U();
		d(), t(e, n);
	}, v = (e) => {
		var n = Ce();
		t(e, n);
	}, y = (e) => {
		var n = W();
		d(), t(e, n);
	}, S = (e) => {
		var n = G();
		t(e, n);
	};
	r(g, (e) => {
		o.value === "yes" ? e(_) : o.value === "no" ? e(v, 1) : o.value === "partial" ? e(y, 2) : e(S, -1);
	}), i(l), C(() => {
		m(l, 0, `mark ${o.value ?? ""}`, "svelte-kf30s9"), x(l, "width", s()), x(l, "height", s()), x(l, "aria-label", e(c)), f(h, e(c));
	}), t(a, l), n();
}
// upstream/src/features/work/components/objects/sheet.ts
var q = (e) => {
	let t = e.trim().toLowerCase();
	return t === "yes" || t === "no" || t === "partial" ? t : "unknown";
};
function Te(e) {
	let t = /^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)\s*$/u.exec(e);
	if (!t) return null;
	let n = Number(t[1]), r = Number(t[2]);
	return r > 0 && n >= 0 && n <= r ? {
		value: n,
		max: r
	} : null;
}
var J = (e) => {
	let t = Number(e.replace(/[,\s]/gu, ""));
	return e.trim() && Number.isFinite(t) ? t : null;
}, Y = /* @__PURE__ */ new Set([
	"number",
	"money",
	"percent",
	"duration"
]), Ee = (e) => Y.has(e.kind);
function De(e, t) {
	switch (e.kind) {
		case "number":
		case "money":
		case "percent":
		case "duration": return J(t);
		case "rating": {
			let e = Te(t);
			return e ? e.value / e.max : null;
		}
		case "yes_no": return {
			yes: 2,
			partial: 1,
			no: 0,
			unknown: null
		}[q(t)];
		default: return t.trim() ? t.trim() : null;
	}
}
function Oe(e, t) {
	let n = J(t);
	if (n === null) return t;
	switch (e.kind) {
		case "money": return e.currency ? A(n, {
			format: "money",
			currency: e.currency
		}) : A(n);
		case "percent": return A(n, { format: "percent" });
		case "duration": return e.unit ? A(n) : A(n, { format: "duration" });
		default: return A(n);
	}
}
function ke(e) {
	return e.columns.map((t, n) => {
		if (!t.best) return /* @__PURE__ */ new Set();
		let r = e.rows.map((e) => De(t, e.cells[n] ?? "")), i = r.filter((e) => typeof e == "number");
		if (i.length < 2) return /* @__PURE__ */ new Set();
		let a = t.best === "max" ? Math.max(...i) : Math.min(...i);
		return i.every((e) => e === a) ? /* @__PURE__ */ new Set() : new Set(r.flatMap((e, t) => e === a ? [String(t)] : []));
	});
}
function Ae(e) {
	try {
		return new URL(e).hostname.replace(/^www\./u, "");
	} catch {
		return e;
	}
}
function je(e, t) {
	let n = e.columns[t];
	return e.rows.some((e) => {
		let r = (e.cells[t] ?? "").trim();
		return !!r && (n?.kind !== "yes_no" || q(r) !== "unknown");
	});
}
var X = {
	money: 104,
	number: 88,
	percent: 80,
	duration: 96,
	date: 120,
	yes_no: 72,
	rating: 104,
	tag: 128,
	link: 160
}, Z = [
	"money",
	"yes_no",
	"rating",
	"number",
	"percent",
	"duration",
	"tag",
	"date",
	"entity",
	"link"
], Q = 7, $ = 24, Me = 240;
function Ne(e, t) {
	let n = (t) => Math.max(0, ...(e.columns[t]?.label ?? "").split(/\s+/u).map((e) => e.length)), r = (t) => Math.max(n(t), ...e.rows.map((e) => (e.cells[t] ?? "").trim().length)), i = (t) => {
		let i = X[e.columns[t].kind];
		return i ? Math.max(i, n(t) * Q + $) : Math.min(Me, Math.max(96, Math.ceil(r(t) * .55) * Q)) + $;
	}, a = (t) => {
		let n = e.columns[t].kind;
		return Z.includes(n) ? Z.indexOf(n) : Z.length + r(t) / 100;
	}, o = e.columns.map((e, t) => t).slice(1).filter((t) => je(e, t)).sort((e, t) => a(e) - a(t) || e - t), s = t - Math.min(220, r(0) * Q + 40), c = [];
	for (let e of o) {
		let t = i(e);
		t > s || (c.push(e), s -= t);
	}
	return c.sort((e, t) => e - t);
}
function Pe(e) {
	let t = e.rows.map(() => 0);
	for (let n of ke(e)) for (let e of n) t[Number(e)] += 1;
	let n = Math.max(0, ...t);
	return !n || t.filter((e) => e === n).length > 1 ? null : t.indexOf(n);
}
// upstream/src/shared/ui/ZephiumTile/ZephiumTile.svelte
var Fe = a("<img class=\"zephium-tile svelte-lzoqvv\" src=\"/zephium-icon.png\" srcset=\"/zephium-icon.png 128w, /zephium-icon@2x.png 256w\" alt=\"\" aria-hidden=\"true\" draggable=\"false\"/>");
function Ie(e, n) {
	let r = E(n, "size", 3, 16);
	var i = Fe();
	C(() => {
		x(i, "sizes", `${r()}px`), x(i, "width", r()), x(i, "height", r());
	}), t(e, i);
}
// upstream/src/features/work/components/objects/ZephiumMark.svelte
var Le = (e) => /^zephium\b/iu.test(e.trim());
function Re(e, t) {
	u(t, !0);
	let r = E(t, "size", 3, 16);
	Ie(e, { get size() {
		return r();
	} }), n();
}
// upstream/src/features/work/components/objects/Dots.svelte
var ze = a("<span></span>"), Be = a("<span class=\"dots svelte-1a58xdl\" role=\"img\"></span>");
function Ve(n, r) {
	let a = O(() => r.max > 5 ? 5 : r.max), o = O(() => r.value / r.max * e(a));
	var s = Be();
	c(s, 20, () => Array.from({ length: e(a) }, (e, t) => t), (e) => e, (n, r) => {
		var i = ze();
		let a;
		C(() => a = m(i, 1, "dot svelte-1a58xdl", null, a, {
			on: e(o) >= r + .75,
			half: e(o) >= r + .25 && e(o) < r + .75
		})), t(n, i);
	}), i(s), C(() => {
		x(s, "aria-label", r.label), x(s, "title", r.label);
	}), t(n, s);
}
// upstream/src/features/work/components/objects/Sheet.svelte
var He = a("<span class=\"picture svelte-c5cdt0\"><img alt=\"\" decoding=\"async\" loading=\"lazy\" class=\"svelte-c5cdt0\"/></span>"), Ue = a("<span class=\"none svelte-c5cdt0\">–</span>"), We = a("<span class=\"text svelte-c5cdt0\"> </span>"), Ge = a("<span class=\"subject svelte-c5cdt0\"><!><span class=\"name svelte-c5cdt0\"> </span></span>"), Ke = a("<span class=\"tag svelte-c5cdt0\"> </span>"), qe = a("<a class=\"link nodrag svelte-c5cdt0\"><!><span class=\"svelte-c5cdt0\"> </span></a>"), Je = a("<span> </span>"), Ye = a("<span class=\"pick-tag svelte-c5cdt0\"> </span>"), Xe = a("<div role=\"columnheader\"><span class=\"face svelte-c5cdt0\"><!></span> <span class=\"who svelte-c5cdt0\"> </span> <!></div>"), Ze = a("<span role=\"cell\"><!></span>"), Qe = a("<div class=\"line svelte-c5cdt0\" role=\"row\"><span class=\"measure svelte-c5cdt0\" role=\"rowheader\"> </span> <!></div>"), $e = a("<footer class=\"svelte-c5cdt0\"><p class=\"note svelte-c5cdt0\"> </p></footer>"), et = a("<section><!> <div class=\"grid svelte-c5cdt0\" role=\"table\"><div class=\"line contenders svelte-c5cdt0\" role=\"row\"><span class=\"measure svelte-c5cdt0\" role=\"columnheader\"></span> <!></div> <!></div> <!></section>"), tt = a("<p class=\"note svelte-c5cdt0\"> </p>"), nt = a("<button type=\"button\" class=\"all nodrag nopan svelte-c5cdt0\"> </button>"), rt = a("<footer class=\"svelte-c5cdt0\"><!> <span class=\"more svelte-c5cdt0\"><!> <!></span></footer>"), it = a("<section><!> <div><!></div> <!></section>");
function at(a, s) {
	u(s, !0);
	let d = (n, a = p, o = p) => {
		let c = O(() => s.object.rows[a()]);
		var l = g(), u = y(l), d = (n) => {
			var r = He(), a = D(r);
			i(r), C(() => {
				x(a, "src", e(c).entity.picture.src), x(a, "width", o() + 8), x(a, "height", o() + 8);
			}), t(n, r);
		}, f = (e) => {
			Re(e, { get size() {
				return o();
			} });
		}, m = O(() => Le(e(c)?.cells[0] ?? "")), h = (t) => {
			{
				let n = O(() => W(a()));
				j(t, {
					get address() {
						return e(n);
					},
					get size() {
						return o();
					}
				});
			}
		}, _ = O(() => W(a()));
		r(u, (t) => {
			e(c)?.entity?.picture ? t(d) : e(m) ? t(f, 1) : e(_) && t(h, 2);
		}), t(n, l);
	}, h = (n, a = p, o = p) => {
		let c = O(() => s.object.columns[o()]), l = O(() => s.object.rows[a()]?.cells[o()] ?? ""), u = O(() => e(pe)[o()]?.has(String(a())));
		var d = g(), h = y(d), _ = (e) => {
			var n = Ue();
			C((e) => x(n, "title", e), [() => ge()]), t(e, n);
		}, v = O(() => !e(l).trim() && e(c).kind !== "yes_no"), S = (t) => {
			{
				let n = O(() => q(e(l)));
				we(t, {
					get value() {
						return e(n);
					},
					size: 16
				});
			}
		}, w = (n) => {
			let a = O(() => Te(e(l)));
			var o = g(), s = y(o), c = (t) => {
				{
					let n = O(() => me({
						value: e(a).value,
						max: e(a).max
					}));
					Ve(t, {
						get value() {
							return e(a).value;
						},
						get max() {
							return e(a).max;
						},
						get label() {
							return e(n);
						}
					});
				}
			}, u = (n) => {
				var r = We(), a = D(r, !0);
				i(r), C(() => {
					x(r, "title", e(l)), f(a, e(l));
				}), t(n, r);
			};
			r(s, (t) => {
				e(a) ? t(c) : t(u, -1);
			}), t(n, o);
		}, E = (n) => {
			let a = O(() => ue(void 0, e(l)));
			var o = Ge(), s = D(o), c = (e) => {
				Re(e, { size: 16 });
			}, u = O(() => Le(e(l))), d = (t) => {
				j(t, {
					get address() {
						return e(a);
					},
					size: 16
				});
			};
			r(s, (t) => {
				e(u) ? t(c) : e(a) && t(d, 1);
			});
			var p = b(s), m = D(p, !0);
			i(p), i(o), C(() => f(m, e(l))), t(n, o);
		}, ee = (n) => {
			var a = g(), o = y(a), s = (n) => {
				var r = Ke(), a = D(r, !0);
				i(r), C(() => f(a, e(l))), t(n, r);
			}, c = O(() => e(l).trim());
			r(o, (t) => {
				e(c) && t(s);
			}), t(n, a);
		}, te = (n) => {
			var r = qe(), a = D(r);
			j(a, {
				get address() {
					return e(l);
				},
				size: 14
			});
			var o = b(a), s = D(o, !0);
			i(o), i(r), C((t) => {
				x(r, "href", e(l)), f(s, t);
			}, [() => Ae(e(l))]), T("click", r, (t) => {
				A().link && (t.preventDefault(), A().link(e(l)));
			}), t(n, r);
		}, ne = (n) => {
			var r = Je();
			let a;
			var o = D(r, !0);
			i(r), C((t) => {
				a = m(r, 1, "figure svelte-c5cdt0", null, a, { best: e(u) }), f(o, t);
			}, [() => Oe(e(c), e(l))]), t(n, r);
		}, re = O(() => Ee(e(c))), k = (n) => {
			var r = We(), a = D(r, !0);
			i(r), C(() => {
				x(r, "title", e(l)), f(a, e(l));
			}), t(n, r);
		};
		r(h, (t) => {
			e(v) ? t(_) : e(c).kind === "yes_no" ? t(S, 1) : e(c).kind === "rating" ? t(w, 2) : e(c).kind === "entity" ? t(E, 3) : e(c).kind === "tag" ? t(ee, 4) : e(c).kind === "link" ? t(te, 5) : e(re) ? t(ne, 6) : t(k, -1);
		}), t(n, d);
	}, A = E(s, "actions", 19, () => ({})), M = E(s, "rows", 3, 8), N = E(s, "centre", 3, !1), P = O(() => s.object.columns[0]), F = O(() => le(s.object)), I = O(() => e(F) ? Pe(s.object) : null), pe = O(() => ke(s.object)), L = _(0), R = _(!1), z = O(() => s.object.columns.map((e, t) => t).filter((e) => e > 0 && je(s.object, e))), B = O(() => e(L) ? Ne(s.object, e(L) - 44) : e(z)), V = O(() => N() || e(R) ? e(z) : e(B)), H = O(() => e(z).length - e(B).length), ye = O(() => e(V).map((e) => {
		let t = s.object.columns[e];
		return {
			key: String(e),
			label: t.unit && t.kind !== "money" ? `${t.label} (${t.unit})` : t.label,
			numeric: Ee(t),
			centered: t.kind === "yes_no" || t.kind === "rating",
			sortable: s.object.rows.length > 2 && t.kind !== "link"
		};
	})), xe = O(() => s.object.rows.map((e, t) => ({
		key: String(t),
		label: e.cells[0] ?? "",
		cells: Object.fromEntries(e.cells.map((e, t) => [String(t), e])),
		sort: Object.fromEntries(s.object.columns.map((t, n) => [String(n), De(t, e.cells[n] ?? "")]))
	}))), U = _(null), Ce = O(() => ({
		rowHeading: e(P)?.label ?? "",
		actions: k(),
		empty: oe(),
		missing: "",
		unavailable: ce(),
		previous: ie(),
		next: re(),
		range: (e, t, n) => se({
			first: e,
			last: t,
			total: n
		})
	}));
	function W(t) {
		let n = s.object.rows[t], r = (n?.sources ?? []).flatMap((e) => {
			let t = s.object.sources?.[e]?.url;
			return t ? [t] : [];
		}), i = [
			n?.entity?.logo,
			...e(P)?.kind === "entity" ? [ue(void 0, n?.cells[0] ?? "")] : [],
			...e(P)?.kind === "entity" ? r : []
		].filter((e) => !!e);
		return i.find((e) => fe(e)) ?? i[0] ?? null;
	}
	let G = O(() => N() ? s.object.rows.length : M()), K = _(w({
		before: !1,
		after: !1
	})), J = _(void 0);
	function Y(e) {
		if (!(e instanceof HTMLElement)) return;
		let t = e.scrollWidth - e.clientWidth;
		S(K, {
			before: e.scrollLeft > 1,
			after: t - e.scrollLeft > 1
		}, !0);
	}
	te(() => {
		e(V), e(L);
		let t = e(J)?.querySelector(".table-scroll"), n = requestAnimationFrame(() => Y(t));
		return () => cancelAnimationFrame(n);
	});
	var X = g(), Z = y(X), Q = (n) => {
		var a = et();
		let o;
		var u = D(a), p = (e) => {
			de(e, { get text() {
				return s.object.title;
			} });
		};
		r(u, (e) => {
			s.object.title && e(p);
		});
		var g = b(u, 2);
		let _;
		var v = D(g), y = b(D(v), 2);
		c(y, 17, () => s.object.rows, l, (n, a, o) => {
			var s = Xe();
			let c;
			var l = D(s), u = D(l);
			d(u, () => o, () => 28), i(l);
			var p = b(l, 2), h = D(p, !0);
			i(p);
			var g = b(p, 2), _ = (e) => {
				var n = Ye(), r = D(n, !0);
				i(n), C((e) => f(r, e), [() => Se()]), t(e, n);
			};
			r(g, (t) => {
				e(I) === o && t(_);
			}), i(s), C(() => {
				c = m(s, 1, "contender svelte-c5cdt0", null, c, { pick: e(I) === o }), f(h, e(a).cells[0] ?? "");
			}), t(n, s);
		}), i(v);
		var S = b(v, 2);
		c(S, 16, () => e(z), (e) => e, (n, r) => {
			let a = O(() => s.object.columns[r]);
			var o = Qe(), u = D(o), d = D(u, !0);
			i(u);
			var p = b(u, 2);
			c(p, 17, () => s.object.rows, l, (n, o, s) => {
				var c = Ze();
				let l;
				var u = D(c);
				h(u, () => s, () => r), i(c), C(() => l = m(c, 1, "value svelte-c5cdt0", null, l, {
					pick: e(I) === s,
					centred: e(a).kind === "yes_no" || e(a).kind === "rating"
				})), t(n, c);
			}), i(o), C(() => f(d, e(a).unit && e(a).kind !== "money" ? `${e(a).label} (${e(a).unit})` : e(a).label)), t(n, o);
		}), i(g);
		var w = b(g, 2), T = (e) => {
			var n = $e(), r = D(n), a = D(r, !0);
			i(r), i(n), C(() => f(a, s.object.note)), t(e, n);
		};
		r(w, (e) => {
			s.object.note && e(T);
		}), i(a), C(() => {
			o = m(a, 1, "sheet versus svelte-c5cdt0", null, o, { centre: N() }), x(a, "aria-label", s.object.title), x(g, "aria-label", s.object.title), _ = ne(g, "", _, { "--columns": s.object.rows.length });
		}), t(n, a);
	}, $ = (n) => {
		var a = it();
		let c;
		var l = D(a), u = (e) => {
			de(e, { get text() {
				return s.object.title;
			} });
		};
		r(l, (e) => {
			s.object.title && e(u);
		});
		var g = b(l, 2);
		let _;
		var y = D(g);
		{
			let n = (n, r = p) => {
				var a = Ge(), o = D(a);
				{
					let t = O(() => Number(r().key));
					d(o, () => e(t), () => 18);
				}
				var s = b(o), c = D(s, !0);
				i(s), i(a), C(() => f(c, r().label)), t(n, a);
			}, r = (t, n = p, r = p) => {
				{
					let i = O(() => Number(n().key)), a = O(() => Number(r().key));
					h(t, () => e(i), () => e(a));
				}
			}, a = O(() => s.object.title ?? ""), o = O(() => s.object.rows.length > 2);
			ae(y, {
				get caption() {
					return e(a);
				},
				showCaption: !1,
				get columns() {
					return e(ye);
				},
				get rows() {
					return e(xe);
				},
				get labels() {
					return e(Ce);
				},
				plain: !0,
				get headSortable() {
					return e(o);
				},
				get limit() {
					return e(G);
				},
				get sort() {
					return e(U);
				},
				set sort(e) {
					S(U, e, !0);
				},
				head: n,
				cell: r,
				$$slots: {
					head: !0,
					cell: !0
				}
			});
		}
		i(g), ee(g, (e) => S(J, e), () => e(J));
		var w = b(g, 2), E = (n) => {
			var a = rt(), o = D(a), c = (e) => {
				var n = tt(), r = D(n, !0);
				i(n), C(() => f(r, s.object.note)), t(e, n);
			};
			r(o, (e) => {
				s.object.note && e(c);
			});
			var l = b(o, 2), u = D(l), d = (n) => {
				var r = nt(), a = D(r, !0);
				i(r), C((t) => {
					x(r, "aria-expanded", e(R)), f(a, t);
				}, [() => e(R) ? _e() : e(H) === 1 ? ve() : be({ count: e(H) })]), T("click", r, () => S(R, !e(R))), t(n, r);
			};
			r(u, (t) => {
				e(H) > 0 && !N() && t(d);
			});
			var p = b(u, 2), m = (e) => {
				var n = nt(), r = D(n, !0);
				i(n), C((e) => f(r, e), [() => he({ count: s.object.rows.length })]), T("click", n, () => A().open?.(s.object.id)), t(e, n);
			};
			r(p, (t) => {
				s.object.rows.length > e(G) && t(m);
			}), i(l), i(a), t(n, a);
		};
		r(w, (t) => {
			(s.object.rows.length > e(G) || s.object.note || e(H) > 0 && !N()) && t(E);
		}), i(a), C(() => {
			c = m(a, 1, "sheet svelte-c5cdt0", null, c, { centre: N() }), x(a, "aria-label", s.object.title), _ = m(g, 1, "nodrag table svelte-c5cdt0", null, _, {
				before: e(K).before,
				after: e(K).after,
				nowheel: e(K).before || e(K).after
			});
		}), o("scroll", g, (e) => Y(e.target), !0), v(a, "clientWidth", (e) => S(L, e)), t(n, a);
	};
	r(Z, (t) => {
		e(F) ? t(Q) : t($, -1);
	}), t(a, X), n();
}
s(["click"]);
export { at as default, we as t };
