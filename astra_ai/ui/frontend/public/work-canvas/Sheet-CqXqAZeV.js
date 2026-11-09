import "./disclose-version-DFvUDwEH.js";
import { A as e, At as t, B as n, Ct as r, F as i, G as a, L as o, M as s, Nt as c, R as l, St as u, U as d, W as f, Y as p, at as m, c as h, ct as g, ft as _, k as v, kt as y, m as b, mt as x, nt as S, ot as C, r as w, s as ee, st as T, tt as E, ut as D, v as te, y as O, z as k } from "./index-client-BSGo5gVb.js";
import { a as ne, c as re, i as ie, n as ae, o as oe, r as se, s as ce, t as le } from "./versus-CpRNgwuA.js";
import "./Chart-BkEtEoB0.js";
import { i as A } from "./chart-CGAGKx76.js";
import { t as ue } from "./vendors-Bfd9iIH1.js";
import { t as de } from "./Title-3U-zV-ZX.js";
import { n as fe, t as j } from "./Mark-DBYTxnH7.js";
import { t as M } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_object_no.js
var N = () => "No", P = ((e = {}, t = {}) => (t.locale ?? M(), N(e))), F = () => "Partly", I = ((e = {}, t = {}) => (t.locale ?? M(), F(e))), pe = (e) => `${e?.value} out of ${e?.max}`, me = ((e, t = {}) => (t.locale ?? M(), pe(e))), L = (e) => `Show all ${e?.count}`, he = ((e, t = {}) => (t.locale ?? M(), L(e))), R = () => "Not known", ge = ((e = {}, t = {}) => (t.locale ?? M(), R(e))), z = () => "Yes", B = ((e = {}, t = {}) => (t.locale ?? M(), z(e))), V = () => "Fewer columns", _e = ((e = {}, t = {}) => (t.locale ?? M(), V(e))), H = () => "1 more column", ve = ((e = {}, t = {}) => (t.locale ?? M(), H(e))), ye = (e) => `${e?.count} more columns`, be = ((e, t = {}) => (t.locale ?? M(), ye(e))), xe = () => "Pick", Se = ((e = {}, t = {}) => (t.locale ?? M(), xe(e))), U = n("<circle cx=\"8\" cy=\"8\" r=\"7.25\" class=\"disc svelte-kf30s9\"></circle><path d=\"M4.9 8.3 7 10.3 11.2 5.9\" class=\"stroke svelte-kf30s9\"></path>", 1), Ce = n("<path d=\"M5.25 8h5.5\" class=\"stroke svelte-kf30s9\"></path>"), W = n("<circle cx=\"8\" cy=\"8\" r=\"6.5\" class=\"ring svelte-kf30s9\"></circle><path d=\"M8 1.5a6.5 6.5 0 0 1 0 13z\" class=\"half svelte-kf30s9\"></path>", 1), G = n("<circle cx=\"8\" cy=\"8\" r=\"1.2\" class=\"dot svelte-kf30s9\"></circle>"), K = n("<svg viewBox=\"0 0 16 16\" role=\"img\"><title> </title><!></svg>");
function we(e, n) {
	r(n, !0);
	let a = w(n, "size", 3, 16), c = x(() => n.value === "yes" ? B() : n.value === "no" ? P() : n.value === "partial" ? I() : ge());
	var l = K(), d = m(l), f = m(d, !0);
	t(d);
	var h = T(d), g = (e) => {
		var t = U();
		y(), o(e, t);
	}, _ = (e) => {
		var t = Ce();
		o(e, t);
	}, v = (e) => {
		var t = W();
		y(), o(e, t);
	}, S = (e) => {
		var t = G();
		o(e, t);
	};
	s(h, (e) => {
		n.value === "yes" ? e(g) : n.value === "no" ? e(_, 1) : n.value === "partial" ? e(v, 2) : e(S, -1);
	}), t(l), E(() => {
		O(l, 0, `mark ${n.value ?? ""}`, "svelte-kf30s9"), b(l, "width", a()), b(l, "height", a()), b(l, "aria-label", p(c)), i(f, p(c));
	}), o(e, l), u();
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
var Fe = k("<img class=\"zephium-tile svelte-lzoqvv\" src=\"/zephium-icon.png\" srcset=\"/zephium-icon.png 128w, /zephium-icon@2x.png 256w\" alt=\"\" aria-hidden=\"true\" draggable=\"false\"/>");
function Ie(e, t) {
	let n = w(t, "size", 3, 16);
	var r = Fe();
	E(() => {
		b(r, "sizes", `${n()}px`), b(r, "width", n()), b(r, "height", n());
	}), o(e, r);
}
// upstream/src/features/work/components/objects/ZephiumMark.svelte
var Le = (e) => /^zephium\b/iu.test(e.trim());
function Re(e, t) {
	r(t, !0);
	let n = w(t, "size", 3, 16);
	Ie(e, { get size() {
		return n();
	} }), u();
}
// upstream/src/features/work/components/objects/Dots.svelte
var ze = k("<span></span>"), Be = k("<span class=\"dots svelte-1a58xdl\" role=\"img\"></span>");
function Ve(e, n) {
	let r = x(() => n.max > 5 ? 5 : n.max), i = x(() => n.value / n.max * p(r));
	var a = Be();
	v(a, 20, () => Array.from({ length: p(r) }, (e, t) => t), (e) => e, (e, t) => {
		var n = ze();
		let r;
		E(() => r = O(n, 1, "dot svelte-1a58xdl", null, r, {
			on: p(i) >= t + .75,
			half: p(i) >= t + .25 && p(i) < t + .75
		})), o(e, n);
	}), t(a), E(() => {
		b(a, "aria-label", n.label), b(a, "title", n.label);
	}), o(e, a);
}
// upstream/src/features/work/components/objects/Sheet.svelte
var He = k("<span class=\"picture svelte-c5cdt0\"><img alt=\"\" decoding=\"async\" loading=\"lazy\" class=\"svelte-c5cdt0\"/></span>"), Ue = k("<span class=\"none svelte-c5cdt0\">–</span>"), We = k("<span class=\"text svelte-c5cdt0\"> </span>"), Ge = k("<span class=\"subject svelte-c5cdt0\"><!><span class=\"name svelte-c5cdt0\"> </span></span>"), Ke = k("<span class=\"tag svelte-c5cdt0\"> </span>"), qe = k("<a class=\"link nodrag svelte-c5cdt0\"><!><span class=\"svelte-c5cdt0\"> </span></a>"), Je = k("<span> </span>"), Ye = k("<span class=\"pick-tag svelte-c5cdt0\"> </span>"), Xe = k("<div role=\"columnheader\"><span class=\"face svelte-c5cdt0\"><!></span> <span class=\"who svelte-c5cdt0\"> </span> <!></div>"), Ze = k("<span role=\"cell\"><!></span>"), Qe = k("<div class=\"line svelte-c5cdt0\" role=\"row\"><span class=\"measure svelte-c5cdt0\" role=\"rowheader\"> </span> <!></div>"), $e = k("<footer class=\"svelte-c5cdt0\"><p class=\"note svelte-c5cdt0\"> </p></footer>"), et = k("<section><!> <div class=\"grid svelte-c5cdt0\" role=\"table\"><div class=\"line contenders svelte-c5cdt0\" role=\"row\"><span class=\"measure svelte-c5cdt0\" role=\"columnheader\"></span> <!></div> <!></div> <!></section>"), tt = k("<p class=\"note svelte-c5cdt0\"> </p>"), nt = k("<button type=\"button\" class=\"all nodrag nopan svelte-c5cdt0\"> </button>"), rt = k("<footer class=\"svelte-c5cdt0\"><!> <span class=\"more svelte-c5cdt0\"><!> <!></span></footer>"), it = k("<section><!> <div><!></div> <!></section>");
function at(n, d) {
	r(d, !0);
	let y = (e, n = c, r = c) => {
		let i = x(() => d.object.rows[n()]);
		var a = l(), u = C(a), f = (e) => {
			var n = He(), a = m(n);
			t(n), E(() => {
				b(a, "src", p(i).entity.picture.src), b(a, "width", r() + 8), b(a, "height", r() + 8);
			}), o(e, n);
		}, h = (e) => {
			Re(e, { get size() {
				return r();
			} });
		}, g = x(() => Le(p(i)?.cells[0] ?? "")), _ = (e) => {
			{
				let t = x(() => W(n()));
				j(e, {
					get address() {
						return p(t);
					},
					get size() {
						return r();
					}
				});
			}
		}, v = x(() => W(n()));
		s(u, (e) => {
			p(i)?.entity?.picture ? e(f) : p(g) ? e(h, 1) : p(v) && e(_, 2);
		}), o(e, a);
	}, k = (e, n = c, r = c) => {
		let a = x(() => d.object.columns[r()]), u = x(() => d.object.rows[n()]?.cells[r()] ?? ""), h = x(() => p(pe)[r()]?.has(String(n())));
		var g = l(), _ = C(g), v = (e) => {
			var t = Ue();
			E((e) => b(t, "title", e), [() => ge()]), o(e, t);
		}, y = x(() => !p(u).trim() && p(a).kind !== "yes_no"), S = (e) => {
			{
				let t = x(() => q(p(u)));
				we(e, {
					get value() {
						return p(t);
					},
					size: 16
				});
			}
		}, w = (e) => {
			let n = x(() => Te(p(u)));
			var r = l(), a = C(r), c = (e) => {
				{
					let t = x(() => me({
						value: p(n).value,
						max: p(n).max
					}));
					Ve(e, {
						get value() {
							return p(n).value;
						},
						get max() {
							return p(n).max;
						},
						get label() {
							return p(t);
						}
					});
				}
			}, d = (e) => {
				var n = We(), r = m(n, !0);
				t(n), E(() => {
					b(n, "title", p(u)), i(r, p(u));
				}), o(e, n);
			};
			s(a, (e) => {
				p(n) ? e(c) : e(d, -1);
			}), o(e, r);
		}, ee = (e) => {
			let n = x(() => ue(void 0, p(u)));
			var r = Ge(), a = m(r), c = (e) => {
				Re(e, { size: 16 });
			}, l = x(() => Le(p(u))), d = (e) => {
				j(e, {
					get address() {
						return p(n);
					},
					size: 16
				});
			};
			s(a, (e) => {
				p(l) ? e(c) : p(n) && e(d, 1);
			});
			var f = T(a), h = m(f, !0);
			t(f), t(r), E(() => i(h, p(u))), o(e, r);
		}, D = (e) => {
			var n = l(), r = C(n), a = (e) => {
				var n = Ke(), r = m(n, !0);
				t(n), E(() => i(r, p(u))), o(e, n);
			}, c = x(() => p(u).trim());
			s(r, (e) => {
				p(c) && e(a);
			}), o(e, n);
		}, te = (e) => {
			var n = qe(), r = m(n);
			j(r, {
				get address() {
					return p(u);
				},
				size: 14
			});
			var a = T(r), s = m(a, !0);
			t(a), t(n), E((e) => {
				b(n, "href", p(u)), i(s, e);
			}, [() => Ae(p(u))]), f("click", n, (e) => {
				A().link && (e.preventDefault(), A().link(p(u)));
			}), o(e, n);
		}, k = (e) => {
			var n = Je();
			let r;
			var s = m(n, !0);
			t(n), E((e) => {
				r = O(n, 1, "figure svelte-c5cdt0", null, r, { best: p(h) }), i(s, e);
			}, [() => Oe(p(a), p(u))]), o(e, n);
		}, ne = x(() => Ee(p(a))), re = (e) => {
			var n = We(), r = m(n, !0);
			t(n), E(() => {
				b(n, "title", p(u)), i(r, p(u));
			}), o(e, n);
		};
		s(_, (e) => {
			p(y) ? e(v) : p(a).kind === "yes_no" ? e(S, 1) : p(a).kind === "rating" ? e(w, 2) : p(a).kind === "entity" ? e(ee, 3) : p(a).kind === "tag" ? e(D, 4) : p(a).kind === "link" ? e(te, 5) : p(ne) ? e(k, 6) : e(re, -1);
		}), o(e, g);
	}, A = w(d, "actions", 19, () => ({})), M = w(d, "rows", 3, 8), N = w(d, "centre", 3, !1), P = x(() => d.object.columns[0]), F = x(() => le(d.object)), I = x(() => p(F) ? Pe(d.object) : null), pe = x(() => ke(d.object)), L = _(0), R = _(!1), z = x(() => d.object.columns.map((e, t) => t).filter((e) => e > 0 && je(d.object, e))), B = x(() => p(L) ? Ne(d.object, p(L) - 44) : p(z)), V = x(() => N() || p(R) ? p(z) : p(B)), H = x(() => p(z).length - p(B).length), ye = x(() => p(V).map((e) => {
		let t = d.object.columns[e];
		return {
			key: String(e),
			label: t.unit && t.kind !== "money" ? `${t.label} (${t.unit})` : t.label,
			numeric: Ee(t),
			centered: t.kind === "yes_no" || t.kind === "rating",
			sortable: d.object.rows.length > 2 && t.kind !== "link"
		};
	})), xe = x(() => d.object.rows.map((e, t) => ({
		key: String(t),
		label: e.cells[0] ?? "",
		cells: Object.fromEntries(e.cells.map((e, t) => [String(t), e])),
		sort: Object.fromEntries(d.object.columns.map((t, n) => [String(n), De(t, e.cells[n] ?? "")]))
	}))), U = _(null), Ce = x(() => ({
		rowHeading: p(P)?.label ?? "",
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
		let t = d.object.rows[e], n = (t?.sources ?? []).flatMap((e) => {
			let t = d.object.sources?.[e]?.url;
			return t ? [t] : [];
		}), r = [
			t?.entity?.logo,
			...p(P)?.kind === "entity" ? [ue(void 0, t?.cells[0] ?? "")] : [],
			...p(P)?.kind === "entity" ? n : []
		].filter((e) => !!e);
		return r.find((e) => fe(e)) ?? r[0] ?? null;
	}
	let G = x(() => N() ? d.object.rows.length : M()), K = _(g({
		before: !1,
		after: !1
	})), J = _(void 0);
	function Y(e) {
		if (!(e instanceof HTMLElement)) return;
		let t = e.scrollWidth - e.clientWidth;
		D(K, {
			before: e.scrollLeft > 1,
			after: t - e.scrollLeft > 1
		}, !0);
	}
	S(() => {
		p(V), p(L);
		let e = p(J)?.querySelector(".table-scroll"), t = requestAnimationFrame(() => Y(e));
		return () => cancelAnimationFrame(t);
	});
	var X = l(), Z = C(X), Q = (n) => {
		var r = et();
		let a;
		var c = m(r), l = (e) => {
			de(e, { get text() {
				return d.object.title;
			} });
		};
		s(c, (e) => {
			d.object.title && e(l);
		});
		var u = T(c, 2);
		let f;
		var h = m(u), g = T(m(h), 2);
		v(g, 17, () => d.object.rows, e, (e, n, r) => {
			var a = Xe();
			let c;
			var l = m(a), u = m(l);
			y(u, () => r, () => 28), t(l);
			var d = T(l, 2), f = m(d, !0);
			t(d);
			var h = T(d, 2), g = (e) => {
				var n = Ye(), r = m(n, !0);
				t(n), E((e) => i(r, e), [() => Se()]), o(e, n);
			};
			s(h, (e) => {
				p(I) === r && e(g);
			}), t(a), E(() => {
				c = O(a, 1, "contender svelte-c5cdt0", null, c, { pick: p(I) === r }), i(f, p(n).cells[0] ?? "");
			}), o(e, a);
		}), t(h);
		var _ = T(h, 2);
		v(_, 16, () => p(z), (e) => e, (n, r) => {
			let a = x(() => d.object.columns[r]);
			var s = Qe(), c = m(s), l = m(c, !0);
			t(c);
			var u = T(c, 2);
			v(u, 17, () => d.object.rows, e, (e, n, i) => {
				var s = Ze();
				let c;
				var l = m(s);
				k(l, () => i, () => r), t(s), E(() => c = O(s, 1, "value svelte-c5cdt0", null, c, {
					pick: p(I) === i,
					centred: p(a).kind === "yes_no" || p(a).kind === "rating"
				})), o(e, s);
			}), t(s), E(() => i(l, p(a).unit && p(a).kind !== "money" ? `${p(a).label} (${p(a).unit})` : p(a).label)), o(n, s);
		}), t(u);
		var S = T(u, 2), C = (e) => {
			var n = $e(), r = m(n), a = m(r, !0);
			t(r), t(n), E(() => i(a, d.object.note)), o(e, n);
		};
		s(S, (e) => {
			d.object.note && e(C);
		}), t(r), E(() => {
			a = O(r, 1, "sheet versus svelte-c5cdt0", null, a, { centre: N() }), b(r, "aria-label", d.object.title), b(u, "aria-label", d.object.title), f = te(u, "", f, { "--columns": d.object.rows.length });
		}), o(n, r);
	}, $ = (e) => {
		var n = it();
		let r;
		var l = m(n), u = (e) => {
			de(e, { get text() {
				return d.object.title;
			} });
		};
		s(l, (e) => {
			d.object.title && e(u);
		});
		var g = T(l, 2);
		let _;
		var v = m(g);
		{
			let e = (e, n = c) => {
				var r = Ge(), a = m(r);
				{
					let e = x(() => Number(n().key));
					y(a, () => p(e), () => 18);
				}
				var s = T(a), l = m(s, !0);
				t(s), t(r), E(() => i(l, n().label)), o(e, r);
			}, n = (e, t = c, n = c) => {
				{
					let r = x(() => Number(t().key)), i = x(() => Number(n().key));
					k(e, () => p(r), () => p(i));
				}
			}, r = x(() => d.object.title ?? ""), a = x(() => d.object.rows.length > 2);
			re(v, {
				get caption() {
					return p(r);
				},
				showCaption: !1,
				get columns() {
					return p(ye);
				},
				get rows() {
					return p(xe);
				},
				get labels() {
					return p(Ce);
				},
				plain: !0,
				get headSortable() {
					return p(a);
				},
				get limit() {
					return p(G);
				},
				get sort() {
					return p(U);
				},
				set sort(e) {
					D(U, e, !0);
				},
				head: e,
				cell: n,
				$$slots: {
					head: !0,
					cell: !0
				}
			});
		}
		t(g), ee(g, (e) => D(J, e), () => p(J));
		var S = T(g, 2), C = (e) => {
			var n = rt(), r = m(n), a = (e) => {
				var n = tt(), r = m(n, !0);
				t(n), E(() => i(r, d.object.note)), o(e, n);
			};
			s(r, (e) => {
				d.object.note && e(a);
			});
			var c = T(r, 2), l = m(c), u = (e) => {
				var n = nt(), r = m(n, !0);
				t(n), E((e) => {
					b(n, "aria-expanded", p(R)), i(r, e);
				}, [() => p(R) ? _e() : p(H) === 1 ? ve() : be({ count: p(H) })]), f("click", n, () => D(R, !p(R))), o(e, n);
			};
			s(l, (e) => {
				p(H) > 0 && !N() && e(u);
			});
			var h = T(l, 2), g = (e) => {
				var n = nt(), r = m(n, !0);
				t(n), E((e) => i(r, e), [() => he({ count: d.object.rows.length })]), f("click", n, () => A().open?.(d.object.id)), o(e, n);
			};
			s(h, (e) => {
				d.object.rows.length > p(G) && e(g);
			}), t(c), t(n), o(e, n);
		};
		s(S, (e) => {
			(d.object.rows.length > p(G) || d.object.note || p(H) > 0 && !N()) && e(C);
		}), t(n), E(() => {
			r = O(n, 1, "sheet svelte-c5cdt0", null, r, { centre: N() }), b(n, "aria-label", d.object.title), _ = O(g, 1, "nodrag table svelte-c5cdt0", null, _, {
				before: p(K).before,
				after: p(K).after,
				nowheel: p(K).before || p(K).after
			});
		}), a("scroll", g, (e) => Y(e.target), !0), h(n, "clientWidth", (e) => D(L, e)), o(e, n);
	};
	s(Z, (e) => {
		p(F) ? e(Q) : e($, -1);
	}), o(n, X), u();
}
d(["click"]);
export { at as default, we as t };
