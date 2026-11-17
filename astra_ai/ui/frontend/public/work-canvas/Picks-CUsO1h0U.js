import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, E as r, F as i, Ft as a, G as o, H as s, J as c, K as l, M as u, N as d, Ot as f, Pt as p, R as m, S as h, Tt as g, U as _, V as v, _t as y, c as b, dt as x, ft as S, h as C, ht as w, ot as T, q as E, r as D, ut as O, x as k, yt as A } from "./index-client-C_2wYFnt.js";
import { t as j } from "./Icon-E4BzZ4dm.js";
import { n as ee, t as M } from "./Mark-BTIzBHOo.js";
import N, { t as te } from "./Sheet-D8CDaSZX.js";
import { a as P, c as F, o as I, s as L } from "./text-DVq3CuCv.js";
import { a as ne, o as re } from "./link-media-qN432bcy.js";
import { t as ie } from "./frame-thumbs-ML8-cPjB.js";
import { g as ae } from "./HostGlyph-D7LkZa-a.js";
import { t as R } from "./Tick02Icon-COqFGcdx.js";
import { t as oe } from "./Title-BF8NXEcN.js";
import "./diagram-Bg4vYWtj.js";
import { t as z } from "./PageFace-D2__z-9e.js";
import { t as B } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_flight_direct.js
var V = () => "Direct", se = ((e = {}, t = {}) => (t.locale ?? B(), V(e))), H = (e) => `${e?.count} stops`, ce = ((e, t = {}) => (t.locale ?? B(), H(e))), le = (e) => `via ${e?.places}`, ue = ((e, t = {}) => (t.locale ?? B(), le(e))), de = () => "Compare", U = ((e = {}, t = {}) => (t.locale ?? B(), de(e))), W = (e) => `Rated ${e?.value} out of ${e?.max}`, fe = ((e, t = {}) => (t.locale ?? B(), W(e))), G = (e) => `Rated ${e?.value} out of ${e?.max}, ${e?.count} reviews`, K = ((e, t = {}) => (t.locale ?? B(), G(e))), q = () => "Top pick", pe = ((e = {}, t = {}) => (t.locale ?? B(), q(e))), me = (e) => `Was ${e?.price}`, he = ((e, t = {}) => (t.locale ?? B(), me(e))), J = _("<svg viewBox=\"0 0 12 12\" aria-hidden=\"true\" class=\"svelte-1ksbd0d\"><path d=\"M6 .9 7.5 4.1l3.5.4-2.6 2.4.7 3.5L6 8.6 2.9 10.4l.7-3.5L1 4.5l3.5-.4z\"></path></svg>");
function Y(e, n) {
	let r = D(n, "size", 3, 12);
	var i = J();
	T(() => {
		C(i, "width", r()), C(i, "height", r());
	}), t(e, i);
}
// upstream/src/features/work/components/objects/Stars.svelte
var ge = s("<span class=\"count svelte-da6cs6\" aria-hidden=\"true\"> </span>"), _e = s("<span class=\"rating svelte-da6cs6\" role=\"img\"><span class=\"row svelte-da6cs6\" aria-hidden=\"true\"><span class=\"track svelte-da6cs6\"></span> <span class=\"fill svelte-da6cs6\"><span class=\"track svelte-da6cs6\"></span></span></span> <span class=\"value svelte-da6cs6\" aria-hidden=\"true\"> </span> <!></span>");
function ve(r, o) {
	f(o, !0);
	let s = D(o, "size", 3, 12), c = A(() => Math.min(1, Math.max(0, o.rating.value / o.rating.max))), l = A(() => new Intl.NumberFormat(void 0, { maximumFractionDigits: 2 }).format(o.rating.value)), d = A(() => o.rating.count ? new Intl.NumberFormat(void 0).format(o.rating.count) : ""), p = A(() => e(d) ? K({
		value: e(l),
		max: o.rating.max,
		count: e(d)
	}) : fe({
		value: e(l),
		max: o.rating.max
	}));
	var h = _e(), g = O(h), _ = O(g);
	u(_, 20, () => [
		0,
		1,
		2,
		3,
		4
	], (e) => e, (e, t) => {
		Y(e, { get size() {
			return s();
		} });
	}), a(_);
	var v = S(_, 2);
	let y;
	var b = O(v);
	u(b, 20, () => [
		0,
		1,
		2,
		3,
		4
	], (e) => e, (e, t) => {
		Y(e, { get size() {
			return s();
		} });
	}), a(b), a(v), a(g);
	var x = S(g, 2), w = O(x, !0);
	a(x);
	var E = S(x, 2), j = (n) => {
		var r = ge(), i = O(r);
		a(r), T(() => m(i, `(${e(d) ?? ""})`)), t(n, r);
	};
	i(E, (t) => {
		e(d) && t(j);
	}), a(h), T(() => {
		C(h, "aria-label", e(p)), y = k(v, "", y, { "inline-size": `${e(c) * 100}%` }), m(w, e(l));
	}), t(r, h), n();
}
// upstream/src/features/work/lib/board/rating.ts
var X = /^(rating|ratings|ocena|oceny|opinie|reviews?|review score|stars?|score|bewertung|avis|note)\b/iu;
function Z(e) {
	let t = e.replace(/\s/gu, ""), n = /^(\d+)[.,](\d{1,2})$/u.exec(t);
	if (n) return Number(`${n[1]}.${n[2]}`);
	let r = t.replace(/[.,](?=\d{3}\b)/gu, "");
	return /^\d+$/u.test(r) ? Number(r) : null;
}
var Q = /(?<![\d.,])(\d+(?:[.,]\d+)?)\s*(?:na|out\s+of|of|z|von|sur|\/)\s*(5|10)\b/iu, ye = /(?:\(\s*(\d[\d\s.,]*)\s*\)|(\d[\d\s.,]*?)\s*(?:ocen\w*|opini\w*|recenz\w*|reviews?|ratings?|votes?|bewertungen|avis))/iu;
function be(e) {
	let t = Q.exec(e);
	if (!t) return null;
	let n = Z(t[1]), r = Number(t[2]) === 10 ? 10 : 5;
	if (n === null || n > r) return null;
	let i = ye.exec(e.slice(t.index + t[0].length)), a = i ? Z((i[1] ?? i[2] ?? "").trim()) : null;
	return {
		value: n,
		max: r,
		...a ? { count: a } : {}
	};
}
var xe = (e) => e.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
function Se(e, t) {
	let n = xe(e), r = xe(t);
	return r.length > 0 && (n === r || r.length > 12 && (n.includes(r) || r.includes(n)));
}
function Ce(e) {
	let t = e.facts.find((e) => X.test(e.label.trim()) && be(e.value));
	return {
		rating: e.rating ?? (t ? be(t.value) : null),
		facts: e.facts.filter((n) => n !== t && !Se(e.name, n.value))
	};
}
// upstream/src/features/work/components/objects/PickCard.svelte
var we = s("<button type=\"button\" class=\"poster-open nodrag nopan svelte-1f1lvve\"></button>"), Te = s("<span class=\"length svelte-1f1lvve\"> </span>"), Ee = s("<span class=\"play svelte-1f1lvve\" aria-hidden=\"true\"><!></span><!>", 1), De = s("<span class=\"badge svelte-1f1lvve\"><!> </span>"), Oe = s("<div><!> <canvas class=\"svelte-1f1lvve\"></canvas> <!> <!></div>"), ke = s("<span class=\"flag svelte-1f1lvve\"><!> </span>"), Ae = s("<a class=\"nodrag svelte-1f1lvve\"> </a>"), je = s("<p class=\"subtitle svelte-1f1lvve\"> </p>"), Me = s("<span> </span>"), Ne = s("<p class=\"meta svelte-1f1lvve\"><!> <!></p>"), Pe = s("<div class=\"svelte-1f1lvve\"><dt class=\"svelte-1f1lvve\"> </dt> <dd class=\"svelte-1f1lvve\"><!><!></dd></div>"), Fe = s("<dl class=\"facts svelte-1f1lvve\"></dl>"), Ie = s("<p class=\"why svelte-1f1lvve\"> </p>"), Le = s("<li class=\"svelte-1f1lvve\"> </li>"), Re = s("<ul class=\"tags svelte-1f1lvve\"></ul>"), ze = s("<span class=\"period svelte-1f1lvve\"> </span>"), Be = s("<s class=\"was svelte-1f1lvve\"> </s>"), Ve = s("<p class=\"price svelte-1f1lvve\"><span class=\"figure svelte-1f1lvve\"> </span><!><!></p>"), He = s("<article><!> <div class=\"body svelte-1f1lvve\"><!> <header class=\"svelte-1f1lvve\"><!> <div class=\"names svelte-1f1lvve\"><h4><!></h4> <!></div></header> <!> <!> <!> <!> <!></div> <!></article>");
function Ue(s, c) {
	f(c, !0);
	let l = D(c, "video", 3, !1), d = D(c, "product", 3, !1), p = D(c, "actions", 19, () => ({})), _ = A(() => l() && !!c.pick.url && !!ne(c.pick.url)), v = (e) => Number(e.replace(/[^\d.]/gu, "")) || 0, j = A(() => P(c.pick.price?.display ?? "")), N = A(() => {
		if (!c.pick.price) return null;
		if (c.pick.price.was) return {
			value: c.pick.price.was,
			fact: null
		};
		let t = c.pick.price.amount ?? v(e(j)), n = c.pick.facts.find((e) => /^(original|was|regular|usual|list|before)\b/iu.test(e.label.trim()) && v(e.value) > t && t > 0);
		return n ? {
			value: n.value,
			fact: n
		} : null;
	}), F = A(() => Ce(c.pick)), I = A(() => e(F).facts.filter((t) => t !== e(N)?.fact)), L = A(() => c.pick.recommended ? c.pick.tags.filter((e) => !/^(recommended|top pick)$/iu.test(e.trim())) : c.pick.tags), R = y(null), oe = g(ae), z = A(() => c.pick.imageRegion ? 1600 : oe?.far ? 240 : 640), B = A(() => !!c.pick.picture && e(R) === c.pick.picture.src), V = A(() => c.pick.picture && !e(B) ? c.pick.picture : null), se = A(() => !e(V) && c.pick.logo && ee(c.pick.logo) ? c.pick.logo : null), H = A(() => {
		let t = e(j).search(/\s*(\/|per\b)/u);
		return t > 0 ? {
			figure: e(j).slice(0, t),
			period: e(j).slice(t)
		} : {
			figure: e(j),
			period: ""
		};
	}), ce = A(() => c.pick.name.split(/\s+/u).reduce((e, t) => t.length > e.length ? t : e, "")), le = A(() => Math.max(6, e(ce).length)), ue = y(0), de = A(() => !!e(ue) && e(le) * .64 * 12 > e(ue) && e(ce)[0] === e(ce)[0]?.toLowerCase());
	var U = He();
	let W;
	var fe = O(U), G = (n) => {
		var o = Oe();
		let s, u;
		var f = O(o), g = (e) => {
			var n = we();
			T(() => C(n, "aria-label", "Watch " + c.pick.name)), E("click", n, (e) => {
				e.stopPropagation(), p().link?.(c.pick.url);
			}), t(e, n);
		};
		i(f, (e) => {
			l() && c.pick.url && p().link && e(g);
		});
		var v = S(f, 2);
		r(v, (e, t) => ie?.(e, t), () => ({
			url: e(V).src,
			width: e(z),
			onmissing: () => w(R, c.pick.picture?.src ?? null, !0)
		}));
		var y = S(v, 2), b = (n) => {
			var r = Ee(), o = x(r), s = O(o);
			{
				let t = A(() => e(_) ? 52 : 44);
				re(s, {
					get size() {
						return e(t);
					},
					get youtube() {
						return e(_);
					}
				});
			}
			a(o);
			var l = S(o), u = (e) => {
				var n = Te(), r = O(n, !0);
				a(n), T(() => m(r, c.pick.duration)), t(e, n);
			};
			i(l, (e) => {
				c.pick.duration && e(u);
			}), t(n, r);
		};
		i(y, (e) => {
			l() && e(b);
		});
		var D = S(y, 2), j = (e) => {
			var n = De(), r = O(n);
			Y(r, { size: 11 });
			var i = S(r, 1, !0);
			a(n), T((e) => m(i, e), [() => pe()]), t(e, n);
		};
		i(D, (e) => {
			c.pick.recommended && e(j);
		}), a(o), T(() => {
			s = h(o, 1, "photo svelte-1f1lvve", null, s, {
				video: l(),
				product: d(),
				region: !!c.pick.imageRegion
			}), u = k(o, "", u, {
				"--region-w": c.pick.imageRegion?.width || 1,
				"--region-h": c.pick.imageRegion?.height || 1,
				"--region-x": c.pick.imageRegion?.x || 0,
				"--region-y": c.pick.imageRegion?.y || 0
			}), C(v, "data-picture", e(V).src);
		}), t(n, o);
	};
	i(fe, (t) => {
		e(V) && t(G);
	});
	var K = S(fe, 2), q = O(K), me = (e) => {
		var n = ke(), r = O(n);
		Y(r, { size: 11 });
		var i = S(r, 1, !0);
		a(n), T((e) => m(i, e), [() => pe()]), t(e, n);
	};
	i(q, (t) => {
		!e(V) && c.pick.recommended && t(me);
	});
	var J = S(q, 2), ge = O(J), _e = (t) => {
		M(t, {
			get address() {
				return e(se);
			},
			size: 20
		});
	};
	i(ge, (t) => {
		e(se) && t(_e);
	});
	var X = S(ge, 2), Z = O(X);
	let Q, ye;
	var be = O(Z), xe = (e) => {
		var n = Ae(), r = O(n, !0);
		a(n), T(() => {
			C(n, "href", c.pick.url), m(r, c.pick.name);
		}), E("click", n, (e) => {
			p().link && (e.preventDefault(), p().link(c.pick.url));
		}), t(e, n);
	}, Se = (e) => {
		var n = o();
		T(() => m(n, c.pick.name)), t(e, n);
	};
	i(be, (e) => {
		c.pick.url ? e(xe) : e(Se, -1);
	}), a(Z);
	var Ue = S(Z, 2), We = (e) => {
		var n = je(), r = O(n, !0);
		a(n), T(() => m(r, c.pick.subtitle)), t(e, n);
	};
	i(Ue, (e) => {
		c.pick.subtitle && e(We);
	}), a(X), a(J);
	var Ge = S(J, 2), Ke = (n) => {
		var r = Ne(), o = O(r), s = (t) => {
			ve(t, { get rating() {
				return e(F).rating;
			} });
		};
		i(o, (t) => {
			e(F).rating && t(s);
		});
		var u = S(o, 2), d = (e) => {
			var n = Me(), r = O(n, !0);
			a(n), T(() => m(r, c.pick.duration)), t(e, n);
		};
		i(u, (t) => {
			l() && c.pick.duration && !e(V) && t(d);
		}), a(r), t(n, r);
	};
	i(Ge, (t) => {
		(e(F).rating || l() && c.pick.duration && !e(V)) && t(Ke);
	});
	var $ = S(Ge, 2), qe = (n) => {
		var r = Fe();
		u(r, 21, () => e(I), (e) => e.label, (n, r) => {
			var o = Pe(), s = O(o), c = O(s, !0);
			a(s);
			var l = S(s, 2), u = O(l), d = (t) => {
				te(t, {
					get value() {
						return e(r).kind;
					},
					size: 14
				});
			};
			i(u, (t) => {
				(e(r).kind === "yes" || e(r).kind === "no" || e(r).kind === "partial") && t(d);
			});
			var f = S(u), p = (n) => {
				var i = Me();
				let o;
				var s = O(i, !0);
				a(i), T(() => {
					o = h(i, 1, "value svelte-1f1lvve", null, o, { quiet: e(r).kind === "no" }), C(i, "title", e(r).value), m(s, e(r).value);
				}), t(n, i);
			}, g = A(() => !/^(yes|no)$/iu.test(e(r).value.trim()));
			i(f, (t) => {
				e(g) && t(p);
			}), a(l), a(o), T(() => m(c, e(r).label)), t(n, o);
		}), a(r), t(n, r);
	};
	i($, (t) => {
		e(I).length && t(qe);
	});
	var Je = S($, 2), Ye = (e) => {
		var n = Ie(), r = O(n, !0);
		a(n), T(() => m(r, c.pick.why)), t(e, n);
	};
	i(Je, (e) => {
		c.pick.why && e(Ye);
	});
	var Xe = S(Je, 2), Ze = (n) => {
		var r = Re();
		u(r, 20, () => e(L), (e) => e, (e, n) => {
			var r = Le(), i = O(r, !0);
			a(r), T(() => m(i, n)), t(e, r);
		}), a(r), t(n, r);
	};
	i(Xe, (t) => {
		e(L).length && t(Ze);
	});
	var Qe = S(Xe, 2), $e = (n) => {
		var r = Ve(), o = O(r), s = O(o, !0);
		a(o);
		var c = S(o), l = (n) => {
			var r = ze(), i = O(r, !0);
			a(r), T(() => m(i, e(H).period)), t(n, r);
		};
		i(c, (t) => {
			e(H).period && t(l);
		});
		var u = S(c), d = (n) => {
			var r = Be(), i = O(r, !0);
			a(r), T((t) => {
				C(r, "aria-label", t), m(i, e(N).value);
			}, [() => he({ price: e(N).value })]), t(n, r);
		};
		i(u, (t) => {
			e(N) && t(d);
		}), a(r), T(() => m(s, e(H).figure)), t(n, r);
	};
	i(Qe, (e) => {
		c.pick.price && e($e);
	}), a(K);
	var et = S(K, 2);
	i(et, (e) => {}), a(U), T(() => {
		W = h(U, 1, "pick svelte-1f1lvve", null, W, {
			recommended: c.pick.recommended,
			chosen: c.pick.chosen,
			pictured: !!e(V)
		}), C(Z, "title", c.pick.name), Q = h(Z, 1, "svelte-1f1lvve", null, Q, { hyphenate: e(de) }), ye = k(Z, "", ye, { "--longest": e(le) });
	}), b(X, "clientWidth", (e) => w(ue, e)), t(s, U), n();
}
l(["click"]);
// upstream/src/features/work/components/objects/FlightCard.svelte
var We = s("<span class=\"flag svelte-16l3ooh\"><!> </span>"), Ge = s("<span class=\"price svelte-16l3ooh\"> </span>"), Ke = s("<p class=\"when svelte-16l3ooh\"> </p>"), $ = s("<span class=\"place svelte-16l3ooh\"> </span>"), qe = s("<span class=\"duration svelte-16l3ooh\"> </span>"), Je = s("<span class=\"stop svelte-16l3ooh\"></span>"), Ye = s("<span> </span>"), Xe = s("<li class=\"svelte-16l3ooh\"><!><!></li>"), Ze = s("<ul class=\"facts svelte-16l3ooh\"></ul>"), Qe = s("<p class=\"why svelte-16l3ooh\"> </p>"), $e = s("<!> ", 1), et = s("<button type=\"button\" class=\"nodrag nopan svelte-16l3ooh\"><!></button>"), tt = s("<button type=\"button\" class=\"nodrag nopan svelte-16l3ooh\"> </button>"), nt = s("<div class=\"actions svelte-16l3ooh\"><!> <!></div>"), rt = s("<article><header class=\"svelte-16l3ooh\"><!> <span class=\"carrier svelte-16l3ooh\"> </span> <!> <!></header> <!> <div class=\"route svelte-16l3ooh\"><div class=\"end svelte-16l3ooh\"><span class=\"time svelte-16l3ooh\"> </span> <!></div> <div class=\"way svelte-16l3ooh\"><!> <span class=\"line svelte-16l3ooh\" aria-hidden=\"true\"></span> <span> </span></div> <div class=\"end arrive svelte-16l3ooh\"><span class=\"time svelte-16l3ooh\"> </span> <!></div></div> <!> <!> <!></article>");
function it(r, s) {
	f(s, !0);
	let c = D(s, "actions", 19, () => ({})), l = A(() => s.pick.route), d = A(() => e(l).carrierHost ?? s.pick.logo), p = A(() => e(l).stops === 0 ? se() : e(l).via?.length ? ue({ places: e(l).via.join(", ") }) : ce({ count: e(l).stops }));
	var g = rt();
	let _;
	var v = O(g), y = O(v), b = (t) => {
		M(t, {
			get address() {
				return e(d);
			},
			size: 20
		});
	}, C = A(() => e(d) && ee(e(d)));
	i(y, (t) => {
		e(C) && t(b);
	});
	var w = S(y, 2), N = O(w, !0);
	a(w);
	var P = S(w, 2), ne = (e) => {
		var n = We(), r = O(n);
		Y(r, { size: 11 });
		var i = S(r, 1, !0);
		a(n), T((e) => m(i, e), [() => pe()]), t(e, n);
	};
	i(P, (e) => {
		s.pick.recommended && e(ne);
	});
	var re = S(P, 2), ie = (e) => {
		var n = Ge(), r = O(n, !0);
		a(n), T(() => m(r, s.pick.price.display)), t(e, n);
	};
	i(re, (e) => {
		s.pick.price && e(ie);
	}), a(v);
	var ae = S(v, 2), oe = (e) => {
		var n = Ke(), r = O(n, !0);
		a(n), T(() => m(r, s.pick.when)), t(e, n);
	};
	i(ae, (e) => {
		s.pick.when && e(oe);
	});
	var z = S(ae, 2), B = O(z), V = O(B), H = O(V, !0);
	a(V);
	var le = S(V, 2), de = (n) => {
		var r = $(), i = O(r, !0);
		a(r), T(() => m(i, e(l).from)), t(n, r);
	};
	i(le, (t) => {
		e(l).depart && t(de);
	}), a(B);
	var U = S(B, 2), W = O(U), fe = (n) => {
		var r = qe(), i = O(r, !0);
		a(r), T(() => m(i, e(l).duration)), t(n, r);
	};
	i(W, (t) => {
		e(l).duration && t(fe);
	});
	var G = S(W, 2);
	u(G, 20, () => Array.from({ length: e(l).stops }, (e, t) => t), (e) => e, (n, r) => {
		var i = Je();
		let a;
		T(() => a = k(i, "", a, { "inset-inline-start": `${(r + 1) / (e(l).stops + 1) * 100}%` })), t(n, i);
	}), a(G);
	var K = S(G, 2);
	let q;
	var me = O(K, !0);
	a(K), a(U);
	var he = S(U, 2), J = O(he), ge = O(J, !0);
	a(J);
	var _e = S(J, 2), ve = (n) => {
		var r = $(), i = O(r, !0);
		a(r), T(() => m(i, e(l).to)), t(n, r);
	};
	i(_e, (t) => {
		e(l).arrive && t(ve);
	}), a(he), a(z);
	var X = S(z, 2), Z = (n) => {
		var r = Ze();
		u(r, 21, () => s.pick.facts, (e) => e.label, (n, r) => {
			var o = Xe(), s = O(o), c = (t) => {
				te(t, {
					get value() {
						return e(r).kind;
					},
					size: 14
				});
			};
			i(s, (t) => {
				(e(r).kind === "yes" || e(r).kind === "no" || e(r).kind === "partial") && t(c);
			});
			var l = S(s), u = (n) => {
				var i = Ye();
				let o;
				var s = O(i, !0);
				a(i), T(() => {
					o = h(i, 1, "svelte-16l3ooh", null, o, { quiet: e(r).kind === "no" }), m(s, e(r).value);
				}), t(n, i);
			}, d = A(() => !/^(yes|no)$/iu.test(e(r).value.trim()));
			i(l, (t) => {
				e(d) && t(u);
			}), a(o), t(n, o);
		}), a(r), t(n, r);
	};
	i(X, (e) => {
		s.pick.facts.length && e(Z);
	});
	var Q = S(X, 2), ye = (e) => {
		var n = Qe(), r = O(n, !0);
		a(n), T(() => m(r, s.pick.why)), t(e, n);
	};
	i(Q, (e) => {
		s.pick.why && e(ye);
	});
	var be = S(Q, 2), xe = (e) => {
		var n = nt(), r = O(n), l = (e) => {
			var n = et(), r = O(n), l = (e) => {
				var n = $e(), r = x(n);
				j(r, {
					get icon() {
						return R;
					},
					size: 13
				});
				var i = S(r, 1, !0);
				T((e) => m(i, e), [() => I()]), t(e, n);
			}, u = (e) => {
				var n = o();
				T((e) => m(n, e), [() => L()]), t(e, n);
			};
			i(r, (e) => {
				s.pick.chosen ? e(l) : e(u, -1);
			}), a(n), E("click", n, () => c().choose?.(s.pick.element, !s.pick.chosen)), t(e, n);
		};
		i(r, (e) => {
			c().choose && s.pick.element && e(l);
		});
		var u = S(r, 2), d = (e) => {
			var n = tt(), r = O(n, !0);
			a(n), T((e) => m(r, e), [() => F()]), E("click", n, () => c().ask?.(s.pick.name)), t(e, n);
		};
		i(u, (e) => {
			c().ask && e(d);
		}), a(n), t(e, n);
	};
	i(be, (e) => {
		(c().choose || c().ask) && e(xe);
	}), a(g), T(() => {
		_ = h(g, 1, "flight svelte-16l3ooh", null, _, {
			recommended: s.pick.recommended,
			chosen: s.pick.chosen
		}), m(N, e(l).carrier ?? s.pick.name), m(H, e(l).depart ?? e(l).from), q = h(K, 1, "stops svelte-16l3ooh", null, q, { direct: e(l).stops === 0 }), m(me, e(p)), m(ge, e(l).arrive ?? e(l).to);
	}), t(r, g), n();
}
l(["click"]);
// upstream/src/features/work/components/objects/centre.ts
function at(e) {
	let t = [];
	for (let n of e.items) for (let e of n.facts) t.some((t) => t.label === e.label) || t.push({
		label: e.label,
		kind: e.kind === "rating" ? "rating" : e.kind === "text" ? "text" : "yes_no"
	});
	let n = e.items.some((e) => e.price), r = e.items.some((e) => e.rating), i = e.items.find((e) => e.price?.currency)?.price?.currency, a = e.items.every((e) => !e.price || e.price.amount !== void 0), o = [
		{
			label: "",
			kind: "entity"
		},
		...n ? [a && i ? {
			label: "Price",
			kind: "money",
			currency: i,
			best: "min"
		} : {
			label: "Price",
			kind: "text"
		}] : [],
		...r ? [{
			label: "Rating",
			kind: "rating",
			best: "max"
		}] : [],
		...t.slice(0, 9 - !!n - !!r)
	];
	return {
		kind: "sheet",
		id: `${e.id}:compare`,
		columns: o,
		rows: e.items.map((e) => ({
			cells: o.map((t, i) => {
				if (i === 0) return e.name;
				if (t.label === "Price" && n) return t.kind === "money" ? String(e.price?.amount ?? "") : e.price?.display ?? "";
				if (t.label === "Rating" && r) return e.rating ? `${e.rating.value}/${e.rating.max}` : "";
				let a = e.facts.find((e) => e.label === t.label);
				return a ? t.kind === "yes_no" ? a.kind === "text" ? "unknown" : a.kind : a.value : t.kind === "yes_no" ? "unknown" : "";
			}),
			entity: {
				...e.picture ? { picture: e.picture } : {},
				...e.logo ? { logo: e.logo } : {}
			}
		}))
	};
}
function ot(e) {
	if (e.items.length < 2 || e.facet === "video" || e.facet === "article") return !1;
	if (e.items.filter((e) => e.price || e.rating).length >= 2) return !0;
	let t = /* @__PURE__ */ new Map();
	for (let n of e.items) for (let e of new Set(n.facts.map((e) => e.label.toLowerCase()))) t.set(e, (t.get(e) ?? 0) + 1);
	return [...t.values()].filter((e) => e >= 2).length >= 2;
}
// upstream/src/features/work/components/objects/Picks.svelte
var st = s("<button type=\"button\" class=\"compare nodrag nopan svelte-1yroi37\"> </button>"), ct = s("<header class=\"svelte-1yroi37\"><!> <!></header>"), lt = s("<button type=\"button\" class=\"from nodrag nopan svelte-1yroi37\"><!></button><span class=\"stem svelte-1yroi37\" aria-hidden=\"true\"></span>", 1), ut = s("<span class=\"from none svelte-1yroi37\" aria-hidden=\"true\"></span><span class=\"stem none svelte-1yroi37\" aria-hidden=\"true\"></span>", 1), dt = s("<div role=\"group\"><!> <!></div>"), ft = s("<div class=\"compare-sheet svelte-1yroi37\"><!></div>"), pt = s("<section><!> <div></div> <!></section>");
function mt(r, o) {
	f(o, !0);
	let s = {
		pictured: 200,
		plain: 220,
		widest: 248,
		gap: 16
	}, l = D(o, "actions", 19, () => ({})), g = D(o, "centre", 3, !1), _ = y(0), j = A(() => {
		let t = o.object.items.length;
		if (!t) return 1;
		let n = e(te) ? s.pictured : s.plain, r = e(_) ? Math.max(1, Math.floor((e(_) + s.gap) / (n + s.gap))) : Math.min(t, 4), i = Math.ceil(t / Math.min(r, t));
		return Math.ceil(t / i);
	}), ee = (e) => !!e.route, M = A(() => o.object.facet === "flight" && o.object.items.every(ee)), te = A(() => o.object.items.some((e) => e.picture)), P = A(() => {
		if (e(M) || g() || !o.object.items.some((e) => e.from)) return !1;
		let t = o.object.items.map((e) => e.from?.page);
		return t.every((e) => e) && new Set(t).size === t.length;
	}), F = A(() => !!l().compare && !e(M) && ot(o.object)), I = y(null);
	var L = pt();
	let ne, re;
	var ie = O(L), ae = (n) => {
		var r = ct(), s = O(r), c = (e) => {
			oe(e, { get text() {
				return o.object.title;
			} });
		};
		i(s, (e) => {
			o.object.title && e(c);
		});
		var u = S(s, 2), d = (e) => {
			var n = st(), r = O(n, !0);
			a(n), T((e) => m(r, e), [() => U()]), E("click", n, () => l().compare?.(o.object.id)), t(e, n);
		};
		i(u, (t) => {
			e(F) && t(d);
		}), a(r), t(n, r);
	};
	i(ie, (t) => {
		(o.object.title || e(F)) && t(ae);
	});
	var R = S(ie, 2);
	let B;
	u(R, 21, () => o.object.items, d, (n, r, s) => {
		var u = v(), d = x(u), f = (t) => {
			it(t, {
				get pick() {
					return e(r);
				},
				get actions() {
					return l();
				}
			});
		}, m = A(() => e(M) && ee(e(r))), g = (n) => {
			var u = dt();
			let d;
			var f = O(u), m = (n) => {
				let i = A(() => e(r).from);
				var o = lt(), s = x(o), c = O(s);
				z(c, {
					get url() {
						return e(i).url;
					},
					get title() {
						return e(i).title;
					},
					get frame() {
						return e(i).frame;
					}
				}), a(s), p(), T(() => C(s, "aria-label", e(i).title || e(i).url)), E("click", s, (t) => {
					t.stopPropagation(), l().link?.(e(i).url);
				}), t(n, o);
			}, g = (e) => {
				var n = ut();
				p(), t(e, n);
			};
			i(f, (t) => {
				e(r).from ? t(m) : t(g, -1);
			});
			var _ = S(f, 2);
			{
				let t = A(() => o.object.facet === "video"), n = A(() => o.object.facet === "product"), i = A(() => l().open ? () => l().open?.(o.object.id, s) : void 0);
				Ue(_, {
					get pick() {
						return e(r);
					},
					get actions() {
						return l();
					},
					get video() {
						return e(t);
					},
					get product() {
						return e(n);
					},
					get onopen() {
						return e(i);
					}
				});
			}
			a(u), T(() => d = h(u, 1, "cell svelte-1yroi37", null, d, { lit: e(I) === s })), c("pointerenter", u, () => w(I, s, !0)), c("pointerleave", u, () => e(I) === s && w(I, null)), t(n, u);
		}, _ = (t) => {
			{
				let n = A(() => o.object.facet === "video"), i = A(() => o.object.facet === "product"), a = A(() => l().open ? () => l().open?.(o.object.id, s) : void 0);
				Ue(t, {
					get pick() {
						return e(r);
					},
					get actions() {
						return l();
					},
					get video() {
						return e(n);
					},
					get product() {
						return e(i);
					},
					get onopen() {
						return e(a);
					}
				});
			}
		};
		i(d, (t) => {
			e(m) ? t(f) : e(P) ? t(g, 1) : t(_, -1);
		}), t(n, u);
	}), a(R);
	var V = S(R, 2), se = (n) => {
		var r = ft(), i = O(r);
		{
			let t = A(() => at(o.object));
			N(i, {
				get object() {
					return e(t);
				},
				get actions() {
					return l();
				},
				get rows() {
					return o.object.items.length;
				}
			});
		}
		a(r), t(n, r);
	};
	i(V, (t) => {
		g() && o.object.items.length > 1 && !e(M) && t(se);
	}), a(L), T(() => {
		ne = h(L, 1, "picks svelte-1yroi37", null, ne, {
			flights: e(M),
			pictured: e(te)
		}), C(L, "aria-label", o.object.title), re = k(L, "", re, {
			"--across": e(j),
			"--card-widest": `${s.widest}px`
		}), B = h(R, 1, "set svelte-1yroi37", null, B, { sourced: e(P) });
	}), b(L, "clientWidth", (e) => w(_, e)), t(r, L), n();
}
l(["click"]);
export { mt as default };
