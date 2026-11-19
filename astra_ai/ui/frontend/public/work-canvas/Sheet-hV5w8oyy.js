import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, F as n, G as r, H as i, J as a, L as o, Mt as s, P as c, Rt as l, S as u, U as d, W as f, Wt as p, X as m, Y as h, bt as g, c as _, gt as v, h as y, ht as b, jt as x, lt as S, mt as C, pt as w, r as T, s as E, tt as D, ut as ee, vt as O, x as te, zt as k } from "./index-client-DH73-vTM.js";
import { a as ne, c as re, i as ie, n as ae, o as oe, r as se, s as ce, t as le } from "./versus-D9Y2lOPh.js";
import "./Chart-CQm0QC-e.js";
import { i as A } from "./chart-CGAGKx76.js";
import { t as ue } from "./vendors-Bfd9iIH1.js";
import { t as de } from "./Title-B4cGdolK.js";
import { n as fe, t as j } from "./Mark-y83oESZj.js";
import { t as M } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_object_no.js
var N = () => "No", P = ((e = {}, t = {}) => (t.locale ?? M(), N(e))), F = () => "Partly", I = ((e = {}, t = {}) => (t.locale ?? M(), F(e))), pe = (e) => `${e?.value} out of ${e?.max}`, me = ((e, t = {}) => (t.locale ?? M(), pe(e))), L = (e) => `Show all ${e?.count}`, he = ((e, t = {}) => (t.locale ?? M(), L(e))), R = () => "Not known", ge = ((e = {}, t = {}) => (t.locale ?? M(), R(e))), z = () => "Yes", B = ((e = {}, t = {}) => (t.locale ?? M(), z(e))), V = () => "Fewer columns", _e = ((e = {}, t = {}) => (t.locale ?? M(), V(e))), H = () => "1 more column", ve = ((e = {}, t = {}) => (t.locale ?? M(), H(e))), ye = (e) => `${e?.count} more columns`, be = ((e, t = {}) => (t.locale ?? M(), ye(e))), xe = () => "Pick", Se = ((e = {}, t = {}) => (t.locale ?? M(), xe(e))), U = r("<circle cx=\"8\" cy=\"8\" r=\"7.25\" class=\"disc svelte-kf30s9\"></circle><path d=\"M4.9 8.3 7 10.3 11.2 5.9\" class=\"stroke svelte-kf30s9\"></path>", 1), Ce = r("<path d=\"M5.25 8h5.5\" class=\"stroke svelte-kf30s9\"></path>"), W = r("<circle cx=\"8\" cy=\"8\" r=\"6.5\" class=\"ring svelte-kf30s9\"></circle><path d=\"M8 1.5a6.5 6.5 0 0 1 0 13z\" class=\"half svelte-kf30s9\"></path>", 1), G = r("<circle cx=\"8\" cy=\"8\" r=\"1.2\" class=\"dot svelte-kf30s9\"></circle>"), K = r("<svg viewBox=\"0 0 16 16\" role=\"img\"><title> </title><!></svg>");
function we(n, r) {
	s(r, !0);
	let a = T(r, "size", 3, 16), c = t(() => r.value === "yes" ? B() : r.value === "no" ? P() : r.value === "partial" ? I() : ge());
	var d = K(), f = w(d), p = w(f, !0);
	k(f);
	var m = b(f), h = (e) => {
		var t = U();
		l(), i(e, t);
	}, g = (e) => {
		var t = Ce();
		i(e, t);
	}, _ = (e) => {
		var t = W();
		l(), i(e, t);
	}, v = (e) => {
		var t = G();
		i(e, t);
	};
	o(m, (e) => {
		r.value === "yes" ? e(h) : r.value === "no" ? e(g, 1) : r.value === "partial" ? e(_, 2) : e(v, -1);
	}), k(d), S(() => {
		u(d, 0, `mark ${r.value ?? ""}`, "svelte-kf30s9"), y(d, "width", a()), y(d, "height", a()), y(d, "aria-label", D(c)), e(p, D(c));
	}), i(n, d), x();
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
var Fe = f("<img class=\"zephium-tile svelte-lzoqvv\" src=\"/zephium-icon.png\" srcset=\"/zephium-icon.png 128w, /zephium-icon@2x.png 256w\" alt=\"\" aria-hidden=\"true\" draggable=\"false\"/>");
function Ie(e, t) {
	let n = T(t, "size", 3, 16);
	var r = Fe();
	S(() => {
		y(r, "sizes", `${n()}px`), y(r, "width", n()), y(r, "height", n());
	}), i(e, r);
}
// upstream/src/features/work/components/objects/ZephiumMark.svelte
var Le = (e) => /^zephium\b/iu.test(e.trim());
function Re(e, t) {
	s(t, !0);
	let n = T(t, "size", 3, 16);
	Ie(e, { get size() {
		return n();
	} }), x();
}
// upstream/src/features/work/components/objects/Dots.svelte
var ze = f("<span></span>"), Be = f("<span class=\"dots svelte-1a58xdl\" role=\"img\"></span>");
function Ve(e, n) {
	let r = t(() => n.max > 5 ? 5 : n.max), a = t(() => n.value / n.max * D(r));
	var o = Be();
	c(o, 20, () => Array.from({ length: D(r) }, (e, t) => t), (e) => e, (e, t) => {
		var n = ze();
		let r;
		S(() => r = u(n, 1, "dot svelte-1a58xdl", null, r, {
			on: D(a) >= t + .75,
			half: D(a) >= t + .25 && D(a) < t + .75
		})), i(e, n);
	}), k(o), S(() => {
		y(o, "aria-label", n.label), y(o, "title", n.label);
	}), i(e, o);
}
// upstream/src/features/work/components/objects/Sheet.svelte
var He = f("<span class=\"picture svelte-c5cdt0\"><img alt=\"\" decoding=\"async\" loading=\"lazy\" class=\"svelte-c5cdt0\"/></span>"), Ue = f("<span class=\"none svelte-c5cdt0\">–</span>"), We = f("<span class=\"text svelte-c5cdt0\"> </span>"), Ge = f("<span class=\"subject svelte-c5cdt0\"><!><span class=\"name svelte-c5cdt0\"> </span></span>"), Ke = f("<span class=\"tag svelte-c5cdt0\"> </span>"), qe = f("<a class=\"link nodrag svelte-c5cdt0\"><!><span class=\"svelte-c5cdt0\"> </span></a>"), Je = f("<span> </span>"), Ye = f("<span class=\"pick-tag svelte-c5cdt0\"> </span>"), Xe = f("<div role=\"columnheader\"><span class=\"face svelte-c5cdt0\"><!></span> <span class=\"who svelte-c5cdt0\"> </span> <!></div>"), Ze = f("<span role=\"cell\"><!></span>"), Qe = f("<div class=\"line svelte-c5cdt0\" role=\"row\"><span class=\"measure svelte-c5cdt0\" role=\"rowheader\"> </span> <!></div>"), $e = f("<footer class=\"svelte-c5cdt0\"><p class=\"note svelte-c5cdt0\"> </p></footer>"), et = f("<section><!> <div class=\"grid svelte-c5cdt0\" role=\"table\"><div class=\"line contenders svelte-c5cdt0\" role=\"row\"><span class=\"measure svelte-c5cdt0\" role=\"columnheader\"></span> <!></div> <!></div> <!></section>"), tt = f("<p class=\"note svelte-c5cdt0\"> </p>"), nt = f("<button type=\"button\" class=\"all nodrag nopan svelte-c5cdt0\"> </button>"), rt = f("<footer class=\"svelte-c5cdt0\"><!> <span class=\"more svelte-c5cdt0\"><!> <!></span></footer>"), it = f("<section><!> <div><!></div> <!></section>");
function at(r, a) {
	s(a, !0);
	let l = (e, n = p, r = p) => {
		let s = t(() => a.object.rows[n()]);
		var c = d(), l = C(c), u = (e) => {
			var t = He(), n = w(t);
			k(t), S(() => {
				y(n, "src", D(s).entity.picture.src), y(n, "width", r() + 8), y(n, "height", r() + 8);
			}), i(e, t);
		}, f = (e) => {
			Re(e, { get size() {
				return r();
			} });
		}, m = t(() => Le(D(s)?.cells[0] ?? "")), h = (e) => {
			{
				let i = t(() => W(n()));
				j(e, {
					get address() {
						return D(i);
					},
					get size() {
						return r();
					}
				});
			}
		}, g = t(() => W(n()));
		o(l, (e) => {
			D(s)?.entity?.picture ? e(u) : D(m) ? e(f, 1) : D(g) && e(h, 2);
		}), i(e, c);
	}, f = (n, r = p, s = p) => {
		let c = t(() => a.object.columns[s()]), l = t(() => a.object.rows[r()]?.cells[s()] ?? ""), f = t(() => D(pe)[s()]?.has(String(r())));
		var m = d(), g = C(m), _ = (e) => {
			var t = Ue();
			S((e) => y(t, "title", e), [() => ge()]), i(e, t);
		}, v = t(() => !D(l).trim() && D(c).kind !== "yes_no"), x = (e) => {
			{
				let n = t(() => q(D(l)));
				we(e, {
					get value() {
						return D(n);
					},
					size: 16
				});
			}
		}, T = (n) => {
			let r = t(() => Te(D(l)));
			var a = d(), s = C(a), c = (e) => {
				{
					let n = t(() => me({
						value: D(r).value,
						max: D(r).max
					}));
					Ve(e, {
						get value() {
							return D(r).value;
						},
						get max() {
							return D(r).max;
						},
						get label() {
							return D(n);
						}
					});
				}
			}, u = (t) => {
				var n = We(), r = w(n, !0);
				k(n), S(() => {
					y(n, "title", D(l)), e(r, D(l));
				}), i(t, n);
			};
			o(s, (e) => {
				D(r) ? e(c) : e(u, -1);
			}), i(n, a);
		}, E = (n) => {
			let r = t(() => ue(void 0, D(l)));
			var a = Ge(), s = w(a), c = (e) => {
				Re(e, { size: 16 });
			}, u = t(() => Le(D(l))), d = (e) => {
				j(e, {
					get address() {
						return D(r);
					},
					size: 16
				});
			};
			o(s, (e) => {
				D(u) ? e(c) : D(r) && e(d, 1);
			});
			var f = b(s), p = w(f, !0);
			k(f), k(a), S(() => e(p, D(l))), i(n, a);
		}, ee = (n) => {
			var r = d(), a = C(r), s = (t) => {
				var n = Ke(), r = w(n, !0);
				k(n), S(() => e(r, D(l))), i(t, n);
			}, c = t(() => D(l).trim());
			o(a, (e) => {
				D(c) && e(s);
			}), i(n, r);
		}, O = (t) => {
			var n = qe(), r = w(n);
			j(r, {
				get address() {
					return D(l);
				},
				size: 14
			});
			var a = b(r), o = w(a, !0);
			k(a), k(n), S((t) => {
				y(n, "href", D(l)), e(o, t);
			}, [() => Ae(D(l))]), h("click", n, (e) => {
				A().link && (e.preventDefault(), A().link(D(l)));
			}), i(t, n);
		}, te = (t) => {
			var n = Je();
			let r;
			var a = w(n, !0);
			k(n), S((t) => {
				r = u(n, 1, "figure svelte-c5cdt0", null, r, { best: D(f) }), e(a, t);
			}, [() => Oe(D(c), D(l))]), i(t, n);
		}, ne = t(() => Ee(D(c))), re = (t) => {
			var n = We(), r = w(n, !0);
			k(n), S(() => {
				y(n, "title", D(l)), e(r, D(l));
			}), i(t, n);
		};
		o(g, (e) => {
			D(v) ? e(_) : D(c).kind === "yes_no" ? e(x, 1) : D(c).kind === "rating" ? e(T, 2) : D(c).kind === "entity" ? e(E, 3) : D(c).kind === "tag" ? e(ee, 4) : D(c).kind === "link" ? e(O, 5) : D(ne) ? e(te, 6) : e(re, -1);
		}), i(n, m);
	}, A = T(a, "actions", 19, () => ({})), M = T(a, "rows", 3, 8), N = T(a, "centre", 3, !1), P = t(() => a.object.columns[0]), F = t(() => le(a.object)), I = t(() => D(F) ? Pe(a.object) : null), pe = t(() => ke(a.object)), L = g(0), R = g(!1), z = t(() => a.object.columns.map((e, t) => t).filter((e) => e > 0 && je(a.object, e))), B = t(() => D(L) ? Ne(a.object, D(L) - 44) : D(z)), V = t(() => N() || D(R) ? D(z) : D(B)), H = t(() => D(z).length - D(B).length), ye = t(() => D(V).map((e) => {
		let t = a.object.columns[e];
		return {
			key: String(e),
			label: t.unit && t.kind !== "money" ? `${t.label} (${t.unit})` : t.label,
			numeric: Ee(t),
			centered: t.kind === "yes_no" || t.kind === "rating",
			sortable: a.object.rows.length > 2 && t.kind !== "link"
		};
	})), xe = t(() => a.object.rows.map((e, t) => ({
		key: String(t),
		label: e.cells[0] ?? "",
		cells: Object.fromEntries(e.cells.map((e, t) => [String(t), e])),
		sort: Object.fromEntries(a.object.columns.map((t, n) => [String(n), De(t, e.cells[n] ?? "")]))
	}))), U = g(null), Ce = t(() => ({
		rowHeading: D(P)?.label ?? "",
		actions: re(),
		empty: oe(),
		missing: "",
		unavailable: ce(),
		previous: ie(),
		next: ne(),
		range: (e, t, n) => se({
			first: e,
			last: t,
			total: n
		})
	}));
	function W(e) {
		let t = a.object.rows[e], n = (t?.sources ?? []).flatMap((e) => {
			let t = a.object.sources?.[e]?.url;
			return t ? [t] : [];
		}), r = [
			t?.entity?.logo,
			...D(P)?.kind === "entity" ? [ue(void 0, t?.cells[0] ?? "")] : [],
			...D(P)?.kind === "entity" ? n : []
		].filter((e) => !!e);
		return r.find((e) => fe(e)) ?? r[0] ?? null;
	}
	let G = t(() => N() ? a.object.rows.length : M()), K = g(v({
		before: !1,
		after: !1
	})), J = g(void 0);
	function Y(e) {
		if (!(e instanceof HTMLElement)) return;
		let t = e.scrollWidth - e.clientWidth;
		O(K, {
			before: e.scrollLeft > 1,
			after: t - e.scrollLeft > 1
		}, !0);
	}
	ee(() => {
		D(V), D(L);
		let e = D(J)?.querySelector(".table-scroll"), t = requestAnimationFrame(() => Y(e));
		return () => cancelAnimationFrame(t);
	});
	var X = d(), Z = C(X), Q = (r) => {
		var s = et();
		let d;
		var p = w(s), m = (e) => {
			de(e, { get text() {
				return a.object.title;
			} });
		};
		o(p, (e) => {
			a.object.title && e(m);
		});
		var h = b(p, 2);
		let g;
		var _ = w(h), v = b(w(_), 2);
		c(v, 17, () => a.object.rows, n, (t, n, r) => {
			var a = Xe();
			let s;
			var c = w(a), d = w(c);
			l(d, () => r, () => 28), k(c);
			var f = b(c, 2), p = w(f, !0);
			k(f);
			var m = b(f, 2), h = (t) => {
				var n = Ye(), r = w(n, !0);
				k(n), S((t) => e(r, t), [() => Se()]), i(t, n);
			};
			o(m, (e) => {
				D(I) === r && e(h);
			}), k(a), S(() => {
				s = u(a, 1, "contender svelte-c5cdt0", null, s, { pick: D(I) === r }), e(p, D(n).cells[0] ?? "");
			}), i(t, a);
		}), k(_);
		var x = b(_, 2);
		c(x, 16, () => D(z), (e) => e, (r, o) => {
			let s = t(() => a.object.columns[o]);
			var l = Qe(), d = w(l), p = w(d, !0);
			k(d);
			var m = b(d, 2);
			c(m, 17, () => a.object.rows, n, (e, t, n) => {
				var r = Ze();
				let a;
				var c = w(r);
				f(c, () => n, () => o), k(r), S(() => a = u(r, 1, "value svelte-c5cdt0", null, a, {
					pick: D(I) === n,
					centred: D(s).kind === "yes_no" || D(s).kind === "rating"
				})), i(e, r);
			}), k(l), S(() => e(p, D(s).unit && D(s).kind !== "money" ? `${D(s).label} (${D(s).unit})` : D(s).label)), i(r, l);
		}), k(h);
		var C = b(h, 2), T = (t) => {
			var n = $e(), r = w(n), o = w(r, !0);
			k(r), k(n), S(() => e(o, a.object.note)), i(t, n);
		};
		o(C, (e) => {
			a.object.note && e(T);
		}), k(s), S(() => {
			d = u(s, 1, "sheet versus svelte-c5cdt0", null, d, { centre: N() }), y(s, "aria-label", a.object.title), y(h, "aria-label", a.object.title), g = te(h, "", g, { "--columns": a.object.rows.length });
		}), i(r, s);
	}, $ = (n) => {
		var r = it();
		let s;
		var c = w(r), d = (e) => {
			de(e, { get text() {
				return a.object.title;
			} });
		};
		o(c, (e) => {
			a.object.title && e(d);
		});
		var g = b(c, 2);
		let v;
		var x = w(g);
		{
			let n = (n, r = p) => {
				var a = Ge(), o = w(a);
				{
					let e = t(() => Number(r().key));
					l(o, () => D(e), () => 18);
				}
				var s = b(o), c = w(s, !0);
				k(s), k(a), S(() => e(c, r().label)), i(n, a);
			}, r = (e, n = p, r = p) => {
				{
					let i = t(() => Number(n().key)), a = t(() => Number(r().key));
					f(e, () => D(i), () => D(a));
				}
			}, o = t(() => a.object.title ?? ""), s = t(() => a.object.rows.length > 2);
			ae(x, {
				get caption() {
					return D(o);
				},
				showCaption: !1,
				get columns() {
					return D(ye);
				},
				get rows() {
					return D(xe);
				},
				get labels() {
					return D(Ce);
				},
				plain: !0,
				get headSortable() {
					return D(s);
				},
				get limit() {
					return D(G);
				},
				get sort() {
					return D(U);
				},
				set sort(e) {
					O(U, e, !0);
				},
				head: n,
				cell: r,
				$$slots: {
					head: !0,
					cell: !0
				}
			});
		}
		k(g), E(g, (e) => O(J, e), () => D(J));
		var C = b(g, 2), T = (t) => {
			var n = rt(), r = w(n), s = (t) => {
				var n = tt(), r = w(n, !0);
				k(n), S(() => e(r, a.object.note)), i(t, n);
			};
			o(r, (e) => {
				a.object.note && e(s);
			});
			var c = b(r, 2), l = w(c), u = (t) => {
				var n = nt(), r = w(n, !0);
				k(n), S((t) => {
					y(n, "aria-expanded", D(R)), e(r, t);
				}, [() => D(R) ? _e() : D(H) === 1 ? ve() : be({ count: D(H) })]), h("click", n, () => O(R, !D(R))), i(t, n);
			};
			o(l, (e) => {
				D(H) > 0 && !N() && e(u);
			});
			var d = b(l, 2), f = (t) => {
				var n = nt(), r = w(n, !0);
				k(n), S((t) => e(r, t), [() => he({ count: a.object.rows.length })]), h("click", n, () => A().open?.(a.object.id)), i(t, n);
			};
			o(d, (e) => {
				a.object.rows.length > D(G) && e(f);
			}), k(c), k(n), i(t, n);
		};
		o(C, (e) => {
			(a.object.rows.length > D(G) || a.object.note || D(H) > 0 && !N()) && e(T);
		}), k(r), S(() => {
			s = u(r, 1, "sheet svelte-c5cdt0", null, s, { centre: N() }), y(r, "aria-label", a.object.title), v = u(g, 1, "nodrag table svelte-c5cdt0", null, v, {
				before: D(K).before,
				after: D(K).after,
				nowheel: D(K).before || D(K).after
			});
		}), m("scroll", g, (e) => Y(e.target), !0), _(r, "clientWidth", (e) => O(L, e)), i(n, r);
	};
	o(Z, (e) => {
		D(F) ? e(Q) : e($, -1);
	}), i(r, X), x();
}
a(["click"]);
export { at as default, we as t };
