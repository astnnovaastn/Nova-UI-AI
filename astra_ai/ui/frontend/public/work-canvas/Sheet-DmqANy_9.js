import "./disclose-version-DFvUDwEH.js";
import { B as e, Et as t, F as n, H as r, It as i, J as a, K as o, M as s, Mt as c, N as l, Nt as u, Q as d, R as f, S as p, Tt as m, U as h, V as g, _t as _, at as v, c as y, ct as b, dt as x, h as S, ht as C, it as w, lt as T, pt as E, q as D, r as O, s as ee, ut as k, x as te } from "./index-client-oI5R0J23.js";
import { a as ne, c as re, i as ie, n as ae, o as oe, r as se, s as ce, t as le } from "./versus-Bdt1AhxK.js";
import "./Chart-BGTbUTBH.js";
import { i as A } from "./chart-CGAGKx76.js";
import { t as ue } from "./vendors-Bfd9iIH1.js";
import { t as de } from "./Title-DCqcKCqa.js";
import { n as fe, t as j } from "./Mark-k2Ui4Fuu.js";
import { t as M } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_object_no.js
var N = () => "No", P = ((e = {}, t = {}) => (t.locale ?? M(), N(e))), F = () => "Partly", I = ((e = {}, t = {}) => (t.locale ?? M(), F(e))), pe = (e) => `${e?.value} out of ${e?.max}`, me = ((e, t = {}) => (t.locale ?? M(), pe(e))), L = (e) => `Show all ${e?.count}`, he = ((e, t = {}) => (t.locale ?? M(), L(e))), R = () => "Not known", ge = ((e = {}, t = {}) => (t.locale ?? M(), R(e))), z = () => "Yes", B = ((e = {}, t = {}) => (t.locale ?? M(), z(e))), V = () => "Fewer columns", _e = ((e = {}, t = {}) => (t.locale ?? M(), V(e))), H = () => "1 more column", ve = ((e = {}, t = {}) => (t.locale ?? M(), H(e))), ye = (e) => `${e?.count} more columns`, be = ((e, t = {}) => (t.locale ?? M(), ye(e))), xe = () => "Pick", Se = ((e = {}, t = {}) => (t.locale ?? M(), xe(e))), U = h("<circle cx=\"8\" cy=\"8\" r=\"7.25\" class=\"disc svelte-kf30s9\"></circle><path d=\"M4.9 8.3 7 10.3 11.2 5.9\" class=\"stroke svelte-kf30s9\"></path>", 1), Ce = h("<path d=\"M5.25 8h5.5\" class=\"stroke svelte-kf30s9\"></path>"), W = h("<circle cx=\"8\" cy=\"8\" r=\"6.5\" class=\"ring svelte-kf30s9\"></circle><path d=\"M8 1.5a6.5 6.5 0 0 1 0 13z\" class=\"half svelte-kf30s9\"></path>", 1), G = h("<circle cx=\"8\" cy=\"8\" r=\"1.2\" class=\"dot svelte-kf30s9\"></circle>"), K = h("<svg viewBox=\"0 0 16 16\" role=\"img\"><title> </title><!></svg>");
function we(r, i) {
	t(i, !0);
	let a = O(i, "size", 3, 16), o = _(() => i.value === "yes" ? B() : i.value === "no" ? P() : i.value === "partial" ? I() : ge());
	var s = K(), l = b(s), h = b(l, !0);
	u(l);
	var g = k(l), v = (t) => {
		var n = U();
		c(), e(t, n);
	}, y = (t) => {
		var n = Ce();
		e(t, n);
	}, x = (t) => {
		var n = W();
		c(), e(t, n);
	}, C = (t) => {
		var n = G();
		e(t, n);
	};
	n(g, (e) => {
		i.value === "yes" ? e(v) : i.value === "no" ? e(y, 1) : i.value === "partial" ? e(x, 2) : e(C, -1);
	}), u(s), w(() => {
		p(s, 0, `mark ${i.value ?? ""}`, "svelte-kf30s9"), S(s, "width", a()), S(s, "height", a()), S(s, "aria-label", d(o)), f(h, d(o));
	}), e(r, s), m();
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
var Fe = r("<img class=\"zephium-tile svelte-lzoqvv\" src=\"/zephium-icon.png\" srcset=\"/zephium-icon.png 128w, /zephium-icon@2x.png 256w\" alt=\"\" aria-hidden=\"true\" draggable=\"false\"/>");
function Ie(t, n) {
	let r = O(n, "size", 3, 16);
	var i = Fe();
	w(() => {
		S(i, "sizes", `${r()}px`), S(i, "width", r()), S(i, "height", r());
	}), e(t, i);
}
// upstream/src/features/work/components/objects/ZephiumMark.svelte
var Le = (e) => /^zephium\b/iu.test(e.trim());
function Re(e, n) {
	t(n, !0);
	let r = O(n, "size", 3, 16);
	Ie(e, { get size() {
		return r();
	} }), m();
}
// upstream/src/features/work/components/objects/Dots.svelte
var ze = r("<span></span>"), Be = r("<span class=\"dots svelte-1a58xdl\" role=\"img\"></span>");
function Ve(t, n) {
	let r = _(() => n.max > 5 ? 5 : n.max), i = _(() => n.value / n.max * d(r));
	var a = Be();
	s(a, 20, () => Array.from({ length: d(r) }, (e, t) => t), (e) => e, (t, n) => {
		var r = ze();
		let a;
		w(() => a = p(r, 1, "dot svelte-1a58xdl", null, a, {
			on: d(i) >= n + .75,
			half: d(i) >= n + .25 && d(i) < n + .75
		})), e(t, r);
	}), u(a), w(() => {
		S(a, "aria-label", n.label), S(a, "title", n.label);
	}), e(t, a);
}
// upstream/src/features/work/components/objects/Sheet.svelte
var He = r("<span class=\"picture svelte-c5cdt0\"><img alt=\"\" decoding=\"async\" loading=\"lazy\" class=\"svelte-c5cdt0\"/></span>"), Ue = r("<span class=\"none svelte-c5cdt0\">–</span>"), We = r("<span class=\"text svelte-c5cdt0\"> </span>"), Ge = r("<span class=\"subject svelte-c5cdt0\"><!><span class=\"name svelte-c5cdt0\"> </span></span>"), Ke = r("<span class=\"tag svelte-c5cdt0\"> </span>"), qe = r("<a class=\"link nodrag svelte-c5cdt0\"><!><span class=\"svelte-c5cdt0\"> </span></a>"), Je = r("<span> </span>"), Ye = r("<span class=\"pick-tag svelte-c5cdt0\"> </span>"), Xe = r("<div role=\"columnheader\"><span class=\"face svelte-c5cdt0\"><!></span> <span class=\"who svelte-c5cdt0\"> </span> <!></div>"), Ze = r("<span role=\"cell\"><!></span>"), Qe = r("<div class=\"line svelte-c5cdt0\" role=\"row\"><span class=\"measure svelte-c5cdt0\" role=\"rowheader\"> </span> <!></div>"), $e = r("<footer class=\"svelte-c5cdt0\"><p class=\"note svelte-c5cdt0\"> </p></footer>"), et = r("<section><!> <div class=\"grid svelte-c5cdt0\" role=\"table\"><div class=\"line contenders svelte-c5cdt0\" role=\"row\"><span class=\"measure svelte-c5cdt0\" role=\"columnheader\"></span> <!></div> <!></div> <!></section>"), tt = r("<p class=\"note svelte-c5cdt0\"> </p>"), nt = r("<button type=\"button\" class=\"all nodrag nopan svelte-c5cdt0\"> </button>"), rt = r("<footer class=\"svelte-c5cdt0\"><!> <span class=\"more svelte-c5cdt0\"><!> <!></span></footer>"), it = r("<section><!> <div><!></div> <!></section>");
function at(r, o) {
	t(o, !0);
	let c = (t, r = i, a = i) => {
		let s = _(() => o.object.rows[r()]);
		var c = g(), l = T(c), f = (t) => {
			var n = He(), r = b(n);
			u(n), w(() => {
				S(r, "src", d(s).entity.picture.src), S(r, "width", a() + 8), S(r, "height", a() + 8);
			}), e(t, n);
		}, p = (e) => {
			Re(e, { get size() {
				return a();
			} });
		}, m = _(() => Le(d(s)?.cells[0] ?? "")), h = (e) => {
			{
				let t = _(() => W(r()));
				j(e, {
					get address() {
						return d(t);
					},
					get size() {
						return a();
					}
				});
			}
		}, v = _(() => W(r()));
		n(l, (e) => {
			d(s)?.entity?.picture ? e(f) : d(m) ? e(p, 1) : d(v) && e(h, 2);
		}), e(t, c);
	}, h = (t, r = i, a = i) => {
		let s = _(() => o.object.columns[a()]), c = _(() => o.object.rows[r()]?.cells[a()] ?? ""), l = _(() => d(pe)[a()]?.has(String(r())));
		var m = g(), h = T(m), v = (t) => {
			var n = Ue();
			w((e) => S(n, "title", e), [() => ge()]), e(t, n);
		}, y = _(() => !d(c).trim() && d(s).kind !== "yes_no"), x = (e) => {
			{
				let t = _(() => q(d(c)));
				we(e, {
					get value() {
						return d(t);
					},
					size: 16
				});
			}
		}, C = (t) => {
			let r = _(() => Te(d(c)));
			var i = g(), a = T(i), o = (e) => {
				{
					let t = _(() => me({
						value: d(r).value,
						max: d(r).max
					}));
					Ve(e, {
						get value() {
							return d(r).value;
						},
						get max() {
							return d(r).max;
						},
						get label() {
							return d(t);
						}
					});
				}
			}, s = (t) => {
				var n = We(), r = b(n, !0);
				u(n), w(() => {
					S(n, "title", d(c)), f(r, d(c));
				}), e(t, n);
			};
			n(a, (e) => {
				d(r) ? e(o) : e(s, -1);
			}), e(t, i);
		}, E = (t) => {
			let r = _(() => ue(void 0, d(c)));
			var i = Ge(), a = b(i), o = (e) => {
				Re(e, { size: 16 });
			}, s = _(() => Le(d(c))), l = (e) => {
				j(e, {
					get address() {
						return d(r);
					},
					size: 16
				});
			};
			n(a, (e) => {
				d(s) ? e(o) : d(r) && e(l, 1);
			});
			var p = k(a), m = b(p, !0);
			u(p), u(i), w(() => f(m, d(c))), e(t, i);
		}, O = (t) => {
			var r = g(), i = T(r), a = (t) => {
				var n = Ke(), r = b(n, !0);
				u(n), w(() => f(r, d(c))), e(t, n);
			}, o = _(() => d(c).trim());
			n(i, (e) => {
				d(o) && e(a);
			}), e(t, r);
		}, ee = (t) => {
			var n = qe(), r = b(n);
			j(r, {
				get address() {
					return d(c);
				},
				size: 14
			});
			var i = k(r), a = b(i, !0);
			u(i), u(n), w((e) => {
				S(n, "href", d(c)), f(a, e);
			}, [() => Ae(d(c))]), D("click", n, (e) => {
				A().link && (e.preventDefault(), A().link(d(c)));
			}), e(t, n);
		}, te = (t) => {
			var n = Je();
			let r;
			var i = b(n, !0);
			u(n), w((e) => {
				r = p(n, 1, "figure svelte-c5cdt0", null, r, { best: d(l) }), f(i, e);
			}, [() => Oe(d(s), d(c))]), e(t, n);
		}, ne = _(() => Ee(d(s))), re = (t) => {
			var n = We(), r = b(n, !0);
			u(n), w(() => {
				S(n, "title", d(c)), f(r, d(c));
			}), e(t, n);
		};
		n(h, (e) => {
			d(y) ? e(v) : d(s).kind === "yes_no" ? e(x, 1) : d(s).kind === "rating" ? e(C, 2) : d(s).kind === "entity" ? e(E, 3) : d(s).kind === "tag" ? e(O, 4) : d(s).kind === "link" ? e(ee, 5) : d(ne) ? e(te, 6) : e(re, -1);
		}), e(t, m);
	}, A = O(o, "actions", 19, () => ({})), M = O(o, "rows", 3, 8), N = O(o, "centre", 3, !1), P = _(() => o.object.columns[0]), F = _(() => le(o.object)), I = _(() => d(F) ? Pe(o.object) : null), pe = _(() => ke(o.object)), L = C(0), R = C(!1), z = _(() => o.object.columns.map((e, t) => t).filter((e) => e > 0 && je(o.object, e))), B = _(() => d(L) ? Ne(o.object, d(L) - 44) : d(z)), V = _(() => N() || d(R) ? d(z) : d(B)), H = _(() => d(z).length - d(B).length), ye = _(() => d(V).map((e) => {
		let t = o.object.columns[e];
		return {
			key: String(e),
			label: t.unit && t.kind !== "money" ? `${t.label} (${t.unit})` : t.label,
			numeric: Ee(t),
			centered: t.kind === "yes_no" || t.kind === "rating",
			sortable: o.object.rows.length > 2 && t.kind !== "link"
		};
	})), xe = _(() => o.object.rows.map((e, t) => ({
		key: String(t),
		label: e.cells[0] ?? "",
		cells: Object.fromEntries(e.cells.map((e, t) => [String(t), e])),
		sort: Object.fromEntries(o.object.columns.map((t, n) => [String(n), De(t, e.cells[n] ?? "")]))
	}))), U = C(null), Ce = _(() => ({
		rowHeading: d(P)?.label ?? "",
		actions: ce(),
		empty: ne(),
		missing: "",
		unavailable: oe(),
		previous: se(),
		next: ie(),
		range: (e, t, n) => ae({
			first: e,
			last: t,
			total: n
		})
	}));
	function W(e) {
		let t = o.object.rows[e], n = (t?.sources ?? []).flatMap((e) => {
			let t = o.object.sources?.[e]?.url;
			return t ? [t] : [];
		}), r = [
			t?.entity?.logo,
			...d(P)?.kind === "entity" ? [ue(void 0, t?.cells[0] ?? "")] : [],
			...d(P)?.kind === "entity" ? n : []
		].filter((e) => !!e);
		return r.find((e) => fe(e)) ?? r[0] ?? null;
	}
	let G = _(() => N() ? o.object.rows.length : M()), K = C(x({
		before: !1,
		after: !1
	})), J = C(void 0);
	function Y(e) {
		if (!(e instanceof HTMLElement)) return;
		let t = e.scrollWidth - e.clientWidth;
		E(K, {
			before: e.scrollLeft > 1,
			after: t - e.scrollLeft > 1
		}, !0);
	}
	v(() => {
		d(V), d(L);
		let e = d(J)?.querySelector(".table-scroll"), t = requestAnimationFrame(() => Y(e));
		return () => cancelAnimationFrame(t);
	});
	var X = g(), Z = T(X), Q = (t) => {
		var r = et();
		let i;
		var a = b(r), m = (e) => {
			de(e, { get text() {
				return o.object.title;
			} });
		};
		n(a, (e) => {
			o.object.title && e(m);
		});
		var g = k(a, 2);
		let v;
		var y = b(g), x = k(b(y), 2);
		s(x, 17, () => o.object.rows, l, (t, r, i) => {
			var a = Xe();
			let o;
			var s = b(a), l = b(s);
			c(l, () => i, () => 28), u(s);
			var m = k(s, 2), h = b(m, !0);
			u(m);
			var g = k(m, 2), _ = (t) => {
				var n = Ye(), r = b(n, !0);
				u(n), w((e) => f(r, e), [() => Se()]), e(t, n);
			};
			n(g, (e) => {
				d(I) === i && e(_);
			}), u(a), w(() => {
				o = p(a, 1, "contender svelte-c5cdt0", null, o, { pick: d(I) === i }), f(h, d(r).cells[0] ?? "");
			}), e(t, a);
		}), u(y);
		var C = k(y, 2);
		s(C, 16, () => d(z), (e) => e, (t, n) => {
			let r = _(() => o.object.columns[n]);
			var i = Qe(), a = b(i), c = b(a, !0);
			u(a);
			var m = k(a, 2);
			s(m, 17, () => o.object.rows, l, (t, i, a) => {
				var o = Ze();
				let s;
				var c = b(o);
				h(c, () => a, () => n), u(o), w(() => s = p(o, 1, "value svelte-c5cdt0", null, s, {
					pick: d(I) === a,
					centred: d(r).kind === "yes_no" || d(r).kind === "rating"
				})), e(t, o);
			}), u(i), w(() => f(c, d(r).unit && d(r).kind !== "money" ? `${d(r).label} (${d(r).unit})` : d(r).label)), e(t, i);
		}), u(g);
		var T = k(g, 2), E = (t) => {
			var n = $e(), r = b(n), i = b(r, !0);
			u(r), u(n), w(() => f(i, o.object.note)), e(t, n);
		};
		n(T, (e) => {
			o.object.note && e(E);
		}), u(r), w(() => {
			i = p(r, 1, "sheet versus svelte-c5cdt0", null, i, { centre: N() }), S(r, "aria-label", o.object.title), S(g, "aria-label", o.object.title), v = te(g, "", v, { "--columns": o.object.rows.length });
		}), e(t, r);
	}, $ = (t) => {
		var r = it();
		let s;
		var l = b(r), m = (e) => {
			de(e, { get text() {
				return o.object.title;
			} });
		};
		n(l, (e) => {
			o.object.title && e(m);
		});
		var g = k(l, 2);
		let v;
		var x = b(g);
		{
			let t = (t, n = i) => {
				var r = Ge(), a = b(r);
				{
					let e = _(() => Number(n().key));
					c(a, () => d(e), () => 18);
				}
				var o = k(a), s = b(o, !0);
				u(o), u(r), w(() => f(s, n().label)), e(t, r);
			}, n = (e, t = i, n = i) => {
				{
					let r = _(() => Number(t().key)), i = _(() => Number(n().key));
					h(e, () => d(r), () => d(i));
				}
			}, r = _(() => o.object.title ?? ""), a = _(() => o.object.rows.length > 2);
			re(x, {
				get caption() {
					return d(r);
				},
				showCaption: !1,
				get columns() {
					return d(ye);
				},
				get rows() {
					return d(xe);
				},
				get labels() {
					return d(Ce);
				},
				plain: !0,
				get headSortable() {
					return d(a);
				},
				get limit() {
					return d(G);
				},
				get sort() {
					return d(U);
				},
				set sort(e) {
					E(U, e, !0);
				},
				head: t,
				cell: n,
				$$slots: {
					head: !0,
					cell: !0
				}
			});
		}
		u(g), ee(g, (e) => E(J, e), () => d(J));
		var C = k(g, 2), T = (t) => {
			var r = rt(), i = b(r), a = (t) => {
				var n = tt(), r = b(n, !0);
				u(n), w(() => f(r, o.object.note)), e(t, n);
			};
			n(i, (e) => {
				o.object.note && e(a);
			});
			var s = k(i, 2), c = b(s), l = (t) => {
				var n = nt(), r = b(n, !0);
				u(n), w((e) => {
					S(n, "aria-expanded", d(R)), f(r, e);
				}, [() => d(R) ? _e() : d(H) === 1 ? ve() : be({ count: d(H) })]), D("click", n, () => E(R, !d(R))), e(t, n);
			};
			n(c, (e) => {
				d(H) > 0 && !N() && e(l);
			});
			var p = k(c, 2), m = (t) => {
				var n = nt(), r = b(n, !0);
				u(n), w((e) => f(r, e), [() => he({ count: o.object.rows.length })]), D("click", n, () => A().open?.(o.object.id)), e(t, n);
			};
			n(p, (e) => {
				o.object.rows.length > d(G) && e(m);
			}), u(s), u(r), e(t, r);
		};
		n(C, (e) => {
			(o.object.rows.length > d(G) || o.object.note || d(H) > 0 && !N()) && e(T);
		}), u(r), w(() => {
			s = p(r, 1, "sheet svelte-c5cdt0", null, s, { centre: N() }), S(r, "aria-label", o.object.title), v = p(g, 1, "nodrag table svelte-c5cdt0", null, v, {
				before: d(K).before,
				after: d(K).after,
				nowheel: d(K).before || d(K).after
			});
		}), a("scroll", g, (e) => Y(e.target), !0), y(r, "clientWidth", (e) => E(L, e)), e(t, r);
	};
	n(Z, (e) => {
		d(F) ? e(Q) : e($, -1);
	}), e(r, X), m();
}
o(["click"]);
export { at as default, we as t };
