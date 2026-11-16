import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, E as r, F as i, Ft as a, G as o, H as s, J as c, K as l, M as u, N as d, Ot as f, Pt as p, R as m, S as h, Tt as g, U as _, V as v, _t as y, c as b, dt as x, ft as S, h as C, ht as w, ot as T, q as E, r as D, ut as O, x as ee, yt as k } from "./index-client-C_2wYFnt.js";
import { t as te } from "./Icon-E4BzZ4dm.js";
import { n as ne, t as A } from "./Mark-BTIzBHOo.js";
import j, { t as re } from "./Sheet-D8CDaSZX.js";
import { t as ie } from "./Tick02Icon-COqFGcdx.js";
import { a as M, c as N, o as P, s as ae } from "./text-DVq3CuCv.js";
import { t as oe } from "./work_env_open-CZM6S6RQ.js";
import { a as se, o as ce } from "./link-media-qN432bcy.js";
import { t as F } from "./frame-thumbs-ML8-cPjB.js";
import { g as le } from "./HostGlyph-D7LkZa-a.js";
import { t as I } from "./Title-BF8NXEcN.js";
import "./diagram-CqxN4SxA.js";
import { t as L } from "./PageFace-D2__z-9e.js";
import { t as R } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_flight_direct.js
var z = () => "Direct", ue = ((e = {}, t = {}) => (t.locale ?? R(), z(e))), de = (e) => `${e?.count} stops`, fe = ((e, t = {}) => (t.locale ?? R(), de(e))), pe = (e) => `via ${e?.places}`, B = ((e, t = {}) => (t.locale ?? R(), pe(e))), V = () => "Compare", H = ((e = {}, t = {}) => (t.locale ?? R(), V(e))), U = (e) => `Rated ${e?.value} out of ${e?.max}`, W = ((e, t = {}) => (t.locale ?? R(), U(e))), G = (e) => `Rated ${e?.value} out of ${e?.max}, ${e?.count} reviews`, me = ((e, t = {}) => (t.locale ?? R(), G(e))), K = () => "Top pick", he = ((e = {}, t = {}) => (t.locale ?? R(), K(e))), q = (e) => `Was ${e?.price}`, ge = ((e, t = {}) => (t.locale ?? R(), q(e))), _e = _("<svg viewBox=\"0 0 12 12\" aria-hidden=\"true\" class=\"svelte-1ksbd0d\"><path d=\"M6 .9 7.5 4.1l3.5.4-2.6 2.4.7 3.5L6 8.6 2.9 10.4l.7-3.5L1 4.5l3.5-.4z\"></path></svg>");
function J(e, n) {
	let r = D(n, "size", 3, 12);
	var i = _e();
	T(() => {
		C(i, "width", r()), C(i, "height", r());
	}), t(e, i);
}
// upstream/src/features/work/components/objects/Stars.svelte
var ve = s("<span class=\"count svelte-da6cs6\" aria-hidden=\"true\"> </span>"), Y = s("<span class=\"rating svelte-da6cs6\" role=\"img\"><span class=\"row svelte-da6cs6\" aria-hidden=\"true\"><span class=\"track svelte-da6cs6\"></span> <span class=\"fill svelte-da6cs6\"><span class=\"track svelte-da6cs6\"></span></span></span> <span class=\"value svelte-da6cs6\" aria-hidden=\"true\"> </span> <!></span>");
function ye(r, o) {
	f(o, !0);
	let s = D(o, "size", 3, 12), c = k(() => Math.min(1, Math.max(0, o.rating.value / o.rating.max))), l = k(() => new Intl.NumberFormat(void 0, { maximumFractionDigits: 2 }).format(o.rating.value)), d = k(() => o.rating.count ? new Intl.NumberFormat(void 0).format(o.rating.count) : ""), p = k(() => e(d) ? me({
		value: e(l),
		max: o.rating.max,
		count: e(d)
	}) : W({
		value: e(l),
		max: o.rating.max
	}));
	var h = Y(), g = O(h), _ = O(g);
	u(_, 20, () => [
		0,
		1,
		2,
		3,
		4
	], (e) => e, (e, t) => {
		J(e, { get size() {
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
		J(e, { get size() {
			return s();
		} });
	}), a(b), a(v), a(g);
	var x = S(g, 2), w = O(x, !0);
	a(x);
	var E = S(x, 2), te = (n) => {
		var r = ve(), i = O(r);
		a(r), T(() => m(i, `(${e(d) ?? ""})`)), t(n, r);
	};
	i(E, (t) => {
		e(d) && t(te);
	}), a(h), T(() => {
		C(h, "aria-label", e(p)), y = ee(v, "", y, { "inline-size": `${e(c) * 100}%` }), m(w, e(l));
	}), t(r, h), n();
}
// upstream/src/features/work/lib/board/rating.ts
var be = /^(rating|ratings|ocena|oceny|opinie|reviews?|review score|stars?|score|bewertung|avis|note)\b/iu;
function X(e) {
	let t = e.replace(/\s/gu, ""), n = /^(\d+)[.,](\d{1,2})$/u.exec(t);
	if (n) return Number(`${n[1]}.${n[2]}`);
	let r = t.replace(/[.,](?=\d{3}\b)/gu, "");
	return /^\d+$/u.test(r) ? Number(r) : null;
}
var Z = /(?<![\d.,])(\d+(?:[.,]\d+)?)\s*(?:na|out\s+of|of|z|von|sur|\/)\s*(5|10)\b/iu, xe = /(?:\(\s*(\d[\d\s.,]*)\s*\)|(\d[\d\s.,]*?)\s*(?:ocen\w*|opini\w*|recenz\w*|reviews?|ratings?|votes?|bewertungen|avis))/iu;
function Se(e) {
	let t = Z.exec(e);
	if (!t) return null;
	let n = X(t[1]), r = Number(t[2]) === 10 ? 10 : 5;
	if (n === null || n > r) return null;
	let i = xe.exec(e.slice(t.index + t[0].length)), a = i ? X((i[1] ?? i[2] ?? "").trim()) : null;
	return {
		value: n,
		max: r,
		...a ? { count: a } : {}
	};
}
var Q = (e) => e.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
function $(e, t) {
	let n = Q(e), r = Q(t);
	return r.length > 0 && (n === r || r.length > 12 && (n.includes(r) || r.includes(n)));
}
function Ce(e) {
	let t = e.facts.find((e) => be.test(e.label.trim()) && Se(e.value));
	return {
		rating: e.rating ?? (t ? Se(t.value) : null),
		facts: e.facts.filter((n) => n !== t && !$(e.name, n.value))
	};
}
// upstream/src/features/work/components/objects/PickCard.svelte
var we = s("<span class=\"length svelte-1f1lvve\"> </span>"), Te = s("<span class=\"play svelte-1f1lvve\" aria-hidden=\"true\"><!></span><!>", 1), Ee = s("<span class=\"badge svelte-1f1lvve\"><!> </span>"), De = s("<div><canvas class=\"svelte-1f1lvve\"></canvas> <!> <!></div>"), Oe = s("<span class=\"flag svelte-1f1lvve\"><!> </span>"), ke = s("<a class=\"nodrag svelte-1f1lvve\"> </a>"), Ae = s("<p class=\"subtitle svelte-1f1lvve\"> </p>"), je = s("<span> </span>"), Me = s("<p class=\"meta svelte-1f1lvve\"><!> <!></p>"), Ne = s("<div class=\"svelte-1f1lvve\"><dt class=\"svelte-1f1lvve\"> </dt> <dd class=\"svelte-1f1lvve\"><!><!></dd></div>"), Pe = s("<dl class=\"facts svelte-1f1lvve\"></dl>"), Fe = s("<p class=\"why svelte-1f1lvve\"> </p>"), Ie = s("<li class=\"svelte-1f1lvve\"> </li>"), Le = s("<ul class=\"tags svelte-1f1lvve\"></ul>"), Re = s("<span class=\"period svelte-1f1lvve\"> </span>"), ze = s("<s class=\"was svelte-1f1lvve\"> </s>"), Be = s("<p class=\"price svelte-1f1lvve\"><span class=\"figure svelte-1f1lvve\"> </span><!><!></p>"), Ve = s("<!> ", 1), He = s("<button type=\"button\"><!></button>"), Ue = s("<button type=\"button\" class=\"nodrag nopan svelte-1f1lvve\"> </button>"), We = s("<div class=\"actions svelte-1f1lvve\"><!> <!> <!></div>"), Ge = s("<article><!> <div class=\"body svelte-1f1lvve\"><!> <header class=\"svelte-1f1lvve\"><!> <div class=\"names svelte-1f1lvve\"><h4><!></h4> <!></div></header> <!> <!> <!> <!> <!></div> <!></article>");
function Ke(s, c) {
	f(c, !0);
	let l = D(c, "video", 3, !1), d = D(c, "product", 3, !1), p = D(c, "actions", 19, () => ({})), _ = k(() => l() && !!c.pick.url && !!se(c.pick.url)), v = (e) => Number(e.replace(/[^\d.]/gu, "")) || 0, j = k(() => M(c.pick.price?.display ?? "")), I = k(() => {
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
	}), L = k(() => Ce(c.pick)), R = k(() => e(L).facts.filter((t) => t !== e(I)?.fact)), z = k(() => c.pick.recommended ? c.pick.tags.filter((e) => !/^(recommended|top pick)$/iu.test(e.trim())) : c.pick.tags), ue = y(null), de = g(le), fe = k(() => de?.far ? 240 : 640), pe = k(() => !!c.pick.picture && e(ue) === c.pick.picture.src), B = k(() => c.pick.picture && !e(pe) ? c.pick.picture : null), V = k(() => !e(B) && c.pick.logo && ne(c.pick.logo) ? c.pick.logo : null), H = k(() => {
		let t = e(j).search(/\s*(\/|per\b)/u);
		return t > 0 ? {
			figure: e(j).slice(0, t),
			period: e(j).slice(t)
		} : {
			figure: e(j),
			period: ""
		};
	}), U = k(() => c.pick.name.split(/\s+/u).reduce((e, t) => t.length > e.length ? t : e, "")), W = k(() => Math.max(6, e(U).length)), G = y(0), me = k(() => !!e(G) && e(W) * .64 * 12 > e(G) && e(U)[0] === e(U)[0]?.toLowerCase());
	var K = Ge();
	let q;
	var _e = O(K), ve = (n) => {
		var o = De();
		let s;
		var u = O(o);
		r(u, (e, t) => F?.(e, t), () => ({
			url: e(B).src,
			width: e(fe),
			onmissing: () => w(ue, c.pick.picture?.src ?? null, !0)
		}));
		var f = S(u, 2), p = (n) => {
			var r = Te(), o = x(r), s = O(o);
			{
				let t = k(() => e(_) ? 52 : 44);
				ce(s, {
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
				var n = we(), r = O(n, !0);
				a(n), T(() => m(r, c.pick.duration)), t(e, n);
			};
			i(l, (e) => {
				c.pick.duration && e(u);
			}), t(n, r);
		};
		i(f, (e) => {
			l() && e(p);
		});
		var g = S(f, 2), v = (e) => {
			var n = Ee(), r = O(n);
			J(r, { size: 11 });
			var i = S(r, 1, !0);
			a(n), T((e) => m(i, e), [() => he()]), t(e, n);
		};
		i(g, (e) => {
			c.pick.recommended && e(v);
		}), a(o), T(() => {
			s = h(o, 1, "photo svelte-1f1lvve", null, s, {
				video: l(),
				product: d()
			}), C(u, "data-picture", e(B).src);
		}), t(n, o);
	};
	i(_e, (t) => {
		e(B) && t(ve);
	});
	var Y = S(_e, 2), be = O(Y), X = (e) => {
		var n = Oe(), r = O(n);
		J(r, { size: 11 });
		var i = S(r, 1, !0);
		a(n), T((e) => m(i, e), [() => he()]), t(e, n);
	};
	i(be, (t) => {
		!e(B) && c.pick.recommended && t(X);
	});
	var Z = S(be, 2), xe = O(Z), Se = (t) => {
		A(t, {
			get address() {
				return e(V);
			},
			size: 20
		});
	};
	i(xe, (t) => {
		e(V) && t(Se);
	});
	var Q = S(xe, 2), $ = O(Q);
	let Ke, qe;
	var Je = O($), Ye = (e) => {
		var n = ke(), r = O(n, !0);
		a(n), T(() => {
			C(n, "href", c.pick.url), m(r, c.pick.name);
		}), E("click", n, (e) => {
			p().link && (e.preventDefault(), p().link(c.pick.url));
		}), t(e, n);
	}, Xe = (e) => {
		var n = o();
		T(() => m(n, c.pick.name)), t(e, n);
	};
	i(Je, (e) => {
		c.pick.url ? e(Ye) : e(Xe, -1);
	}), a($);
	var Ze = S($, 2), Qe = (e) => {
		var n = Ae(), r = O(n, !0);
		a(n), T(() => m(r, c.pick.subtitle)), t(e, n);
	};
	i(Ze, (e) => {
		c.pick.subtitle && e(Qe);
	}), a(Q), a(Z);
	var $e = S(Z, 2), et = (n) => {
		var r = Me(), o = O(r), s = (t) => {
			ye(t, { get rating() {
				return e(L).rating;
			} });
		};
		i(o, (t) => {
			e(L).rating && t(s);
		});
		var u = S(o, 2), d = (e) => {
			var n = je(), r = O(n, !0);
			a(n), T(() => m(r, c.pick.duration)), t(e, n);
		};
		i(u, (t) => {
			l() && c.pick.duration && !e(B) && t(d);
		}), a(r), t(n, r);
	};
	i($e, (t) => {
		(e(L).rating || l() && c.pick.duration && !e(B)) && t(et);
	});
	var tt = S($e, 2), nt = (n) => {
		var r = Pe();
		u(r, 21, () => e(R), (e) => e.label, (n, r) => {
			var o = Ne(), s = O(o), c = O(s, !0);
			a(s);
			var l = S(s, 2), u = O(l), d = (t) => {
				re(t, {
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
				var i = je();
				let o;
				var s = O(i, !0);
				a(i), T(() => {
					o = h(i, 1, "value svelte-1f1lvve", null, o, { quiet: e(r).kind === "no" }), C(i, "title", e(r).value), m(s, e(r).value);
				}), t(n, i);
			}, g = k(() => !/^(yes|no)$/iu.test(e(r).value.trim()));
			i(f, (t) => {
				e(g) && t(p);
			}), a(l), a(o), T(() => m(c, e(r).label)), t(n, o);
		}), a(r), t(n, r);
	};
	i(tt, (t) => {
		e(R).length && t(nt);
	});
	var rt = S(tt, 2), it = (e) => {
		var n = Fe(), r = O(n, !0);
		a(n), T(() => m(r, c.pick.why)), t(e, n);
	};
	i(rt, (e) => {
		c.pick.why && e(it);
	});
	var at = S(rt, 2), ot = (n) => {
		var r = Le();
		u(r, 20, () => e(z), (e) => e, (e, n) => {
			var r = Ie(), i = O(r, !0);
			a(r), T(() => m(i, n)), t(e, r);
		}), a(r), t(n, r);
	};
	i(at, (t) => {
		e(z).length && t(ot);
	});
	var st = S(at, 2), ct = (n) => {
		var r = Be(), o = O(r), s = O(o, !0);
		a(o);
		var c = S(o), l = (n) => {
			var r = Re(), i = O(r, !0);
			a(r), T(() => m(i, e(H).period)), t(n, r);
		};
		i(c, (t) => {
			e(H).period && t(l);
		});
		var u = S(c), d = (n) => {
			var r = ze(), i = O(r, !0);
			a(r), T((t) => {
				C(r, "aria-label", t), m(i, e(I).value);
			}, [() => ge({ price: e(I).value })]), t(n, r);
		};
		i(u, (t) => {
			e(I) && t(d);
		}), a(r), T(() => m(s, e(H).figure)), t(n, r);
	};
	i(st, (e) => {
		c.pick.price && e(ct);
	}), a(Y);
	var lt = S(Y, 2), ut = (e) => {
		var n = We(), r = O(n), s = (e) => {
			var n = He();
			let r;
			var s = O(n), l = (e) => {
				var n = Ve(), r = x(n);
				te(r, {
					get icon() {
						return ie;
					},
					size: 13
				});
				var i = S(r, 1, !0);
				T((e) => m(i, e), [() => P()]), t(e, n);
			}, u = (e) => {
				var n = o();
				T((e) => m(n, e), [() => ae()]), t(e, n);
			};
			i(s, (e) => {
				c.pick.chosen ? e(l) : e(u, -1);
			}), a(n), T(() => r = h(n, 1, "nodrag nopan svelte-1f1lvve", null, r, { on: c.pick.chosen })), E("click", n, () => p().choose?.(c.pick.element, !c.pick.chosen)), t(e, n);
		};
		i(r, (e) => {
			p().choose && c.pick.element && e(s);
		});
		var l = S(r, 2), u = (e) => {
			var n = Ue(), r = O(n, !0);
			a(n), T((e) => m(r, e), [() => N()]), E("click", n, () => p().ask?.(c.pick.name)), t(e, n);
		};
		i(l, (e) => {
			p().ask && e(u);
		});
		var d = S(l, 2), f = (e) => {
			var n = Ue(), r = O(n, !0);
			a(n), T((e) => m(r, e), [() => oe()]), E("click", n, function(...e) {
				c.onopen?.apply(this, e);
			}), t(e, n);
		};
		i(d, (e) => {
			c.onopen && e(f);
		}), a(n), t(e, n);
	};
	i(lt, (e) => {
		(p().choose || p().ask || c.onopen) && e(ut);
	}), a(K), T(() => {
		q = h(K, 1, "pick svelte-1f1lvve", null, q, {
			recommended: c.pick.recommended,
			chosen: c.pick.chosen,
			pictured: !!e(B)
		}), C($, "title", c.pick.name), Ke = h($, 1, "svelte-1f1lvve", null, Ke, { hyphenate: e(me) }), qe = ee($, "", qe, { "--longest": e(W) });
	}), b(Q, "clientWidth", (e) => w(G, e)), t(s, K), n();
}
l(["click"]);
// upstream/src/features/work/components/objects/FlightCard.svelte
var qe = s("<span class=\"flag svelte-16l3ooh\"><!> </span>"), Je = s("<span class=\"price svelte-16l3ooh\"> </span>"), Ye = s("<p class=\"when svelte-16l3ooh\"> </p>"), Xe = s("<span class=\"place svelte-16l3ooh\"> </span>"), Ze = s("<span class=\"duration svelte-16l3ooh\"> </span>"), Qe = s("<span class=\"stop svelte-16l3ooh\"></span>"), $e = s("<span> </span>"), et = s("<li class=\"svelte-16l3ooh\"><!><!></li>"), tt = s("<ul class=\"facts svelte-16l3ooh\"></ul>"), nt = s("<p class=\"why svelte-16l3ooh\"> </p>"), rt = s("<!> ", 1), it = s("<button type=\"button\" class=\"nodrag nopan svelte-16l3ooh\"><!></button>"), at = s("<button type=\"button\" class=\"nodrag nopan svelte-16l3ooh\"> </button>"), ot = s("<div class=\"actions svelte-16l3ooh\"><!> <!></div>"), st = s("<article><header class=\"svelte-16l3ooh\"><!> <span class=\"carrier svelte-16l3ooh\"> </span> <!> <!></header> <!> <div class=\"route svelte-16l3ooh\"><div class=\"end svelte-16l3ooh\"><span class=\"time svelte-16l3ooh\"> </span> <!></div> <div class=\"way svelte-16l3ooh\"><!> <span class=\"line svelte-16l3ooh\" aria-hidden=\"true\"></span> <span> </span></div> <div class=\"end arrive svelte-16l3ooh\"><span class=\"time svelte-16l3ooh\"> </span> <!></div></div> <!> <!> <!></article>");
function ct(r, s) {
	f(s, !0);
	let c = D(s, "actions", 19, () => ({})), l = k(() => s.pick.route), d = k(() => e(l).carrierHost ?? s.pick.logo), p = k(() => e(l).stops === 0 ? ue() : e(l).via?.length ? B({ places: e(l).via.join(", ") }) : fe({ count: e(l).stops }));
	var g = st();
	let _;
	var v = O(g), y = O(v), b = (t) => {
		A(t, {
			get address() {
				return e(d);
			},
			size: 20
		});
	}, C = k(() => e(d) && ne(e(d)));
	i(y, (t) => {
		e(C) && t(b);
	});
	var w = S(y, 2), j = O(w, !0);
	a(w);
	var M = S(w, 2), oe = (e) => {
		var n = qe(), r = O(n);
		J(r, { size: 11 });
		var i = S(r, 1, !0);
		a(n), T((e) => m(i, e), [() => he()]), t(e, n);
	};
	i(M, (e) => {
		s.pick.recommended && e(oe);
	});
	var se = S(M, 2), ce = (e) => {
		var n = Je(), r = O(n, !0);
		a(n), T(() => m(r, s.pick.price.display)), t(e, n);
	};
	i(se, (e) => {
		s.pick.price && e(ce);
	}), a(v);
	var F = S(v, 2), le = (e) => {
		var n = Ye(), r = O(n, !0);
		a(n), T(() => m(r, s.pick.when)), t(e, n);
	};
	i(F, (e) => {
		s.pick.when && e(le);
	});
	var I = S(F, 2), L = O(I), R = O(L), z = O(R, !0);
	a(R);
	var de = S(R, 2), pe = (n) => {
		var r = Xe(), i = O(r, !0);
		a(r), T(() => m(i, e(l).from)), t(n, r);
	};
	i(de, (t) => {
		e(l).depart && t(pe);
	}), a(L);
	var V = S(L, 2), H = O(V), U = (n) => {
		var r = Ze(), i = O(r, !0);
		a(r), T(() => m(i, e(l).duration)), t(n, r);
	};
	i(H, (t) => {
		e(l).duration && t(U);
	});
	var W = S(H, 2);
	u(W, 20, () => Array.from({ length: e(l).stops }, (e, t) => t), (e) => e, (n, r) => {
		var i = Qe();
		let a;
		T(() => a = ee(i, "", a, { "inset-inline-start": `${(r + 1) / (e(l).stops + 1) * 100}%` })), t(n, i);
	}), a(W);
	var G = S(W, 2);
	let me;
	var K = O(G, !0);
	a(G), a(V);
	var q = S(V, 2), ge = O(q), _e = O(ge, !0);
	a(ge);
	var ve = S(ge, 2), Y = (n) => {
		var r = Xe(), i = O(r, !0);
		a(r), T(() => m(i, e(l).to)), t(n, r);
	};
	i(ve, (t) => {
		e(l).arrive && t(Y);
	}), a(q), a(I);
	var ye = S(I, 2), be = (n) => {
		var r = tt();
		u(r, 21, () => s.pick.facts, (e) => e.label, (n, r) => {
			var o = et(), s = O(o), c = (t) => {
				re(t, {
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
				var i = $e();
				let o;
				var s = O(i, !0);
				a(i), T(() => {
					o = h(i, 1, "svelte-16l3ooh", null, o, { quiet: e(r).kind === "no" }), m(s, e(r).value);
				}), t(n, i);
			}, d = k(() => !/^(yes|no)$/iu.test(e(r).value.trim()));
			i(l, (t) => {
				e(d) && t(u);
			}), a(o), t(n, o);
		}), a(r), t(n, r);
	};
	i(ye, (e) => {
		s.pick.facts.length && e(be);
	});
	var X = S(ye, 2), Z = (e) => {
		var n = nt(), r = O(n, !0);
		a(n), T(() => m(r, s.pick.why)), t(e, n);
	};
	i(X, (e) => {
		s.pick.why && e(Z);
	});
	var xe = S(X, 2), Se = (e) => {
		var n = ot(), r = O(n), l = (e) => {
			var n = it(), r = O(n), l = (e) => {
				var n = rt(), r = x(n);
				te(r, {
					get icon() {
						return ie;
					},
					size: 13
				});
				var i = S(r, 1, !0);
				T((e) => m(i, e), [() => P()]), t(e, n);
			}, u = (e) => {
				var n = o();
				T((e) => m(n, e), [() => ae()]), t(e, n);
			};
			i(r, (e) => {
				s.pick.chosen ? e(l) : e(u, -1);
			}), a(n), E("click", n, () => c().choose?.(s.pick.element, !s.pick.chosen)), t(e, n);
		};
		i(r, (e) => {
			c().choose && s.pick.element && e(l);
		});
		var u = S(r, 2), d = (e) => {
			var n = at(), r = O(n, !0);
			a(n), T((e) => m(r, e), [() => N()]), E("click", n, () => c().ask?.(s.pick.name)), t(e, n);
		};
		i(u, (e) => {
			c().ask && e(d);
		}), a(n), t(e, n);
	};
	i(xe, (e) => {
		(c().choose || c().ask) && e(Se);
	}), a(g), T(() => {
		_ = h(g, 1, "flight svelte-16l3ooh", null, _, {
			recommended: s.pick.recommended,
			chosen: s.pick.chosen
		}), m(j, e(l).carrier ?? s.pick.name), m(z, e(l).depart ?? e(l).from), me = h(G, 1, "stops svelte-16l3ooh", null, me, { direct: e(l).stops === 0 }), m(K, e(p)), m(_e, e(l).arrive ?? e(l).to);
	}), t(r, g), n();
}
l(["click"]);
// upstream/src/features/work/components/objects/centre.ts
function lt(e) {
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
function ut(e) {
	if (e.items.length < 2 || e.facet === "video" || e.facet === "article") return !1;
	if (e.items.filter((e) => e.price || e.rating).length >= 2) return !0;
	let t = /* @__PURE__ */ new Map();
	for (let n of e.items) for (let e of new Set(n.facts.map((e) => e.label.toLowerCase()))) t.set(e, (t.get(e) ?? 0) + 1);
	return [...t.values()].filter((e) => e >= 2).length >= 2;
}
// upstream/src/features/work/components/objects/Picks.svelte
var dt = s("<button type=\"button\" class=\"compare nodrag nopan svelte-1yroi37\"> </button>"), ft = s("<header class=\"svelte-1yroi37\"><!> <!></header>"), pt = s("<button type=\"button\" class=\"from nodrag nopan svelte-1yroi37\"><!></button><span class=\"stem svelte-1yroi37\" aria-hidden=\"true\"></span>", 1), mt = s("<span class=\"from none svelte-1yroi37\" aria-hidden=\"true\"></span><span class=\"stem none svelte-1yroi37\" aria-hidden=\"true\"></span>", 1), ht = s("<div role=\"group\"><!> <!></div>"), gt = s("<div class=\"compare-sheet svelte-1yroi37\"><!></div>"), _t = s("<section><!> <div></div> <!></section>");
function vt(r, o) {
	f(o, !0);
	let s = {
		pictured: 200,
		plain: 220,
		widest: 248,
		gap: 16
	}, l = D(o, "actions", 19, () => ({})), g = D(o, "centre", 3, !1), _ = y(0), te = k(() => {
		let t = o.object.items.length;
		if (!t) return 1;
		let n = e(re) ? s.pictured : s.plain, r = e(_) ? Math.max(1, Math.floor((e(_) + s.gap) / (n + s.gap))) : Math.min(t, 4), i = Math.ceil(t / Math.min(r, t));
		return Math.ceil(t / i);
	}), ne = (e) => !!e.route, A = k(() => o.object.facet === "flight" && o.object.items.every(ne)), re = k(() => o.object.items.some((e) => e.picture)), ie = k(() => {
		if (e(A) || g() || !o.object.items.some((e) => e.from)) return !1;
		let t = o.object.items.map((e) => e.from?.page);
		return t.every((e) => e) && new Set(t).size === t.length;
	}), M = k(() => !!l().compare && !e(A) && ut(o.object)), N = y(null);
	var P = _t();
	let ae, oe;
	var se = O(P), ce = (n) => {
		var r = ft(), s = O(r), c = (e) => {
			I(e, { get text() {
				return o.object.title;
			} });
		};
		i(s, (e) => {
			o.object.title && e(c);
		});
		var u = S(s, 2), d = (e) => {
			var n = dt(), r = O(n, !0);
			a(n), T((e) => m(r, e), [() => H()]), E("click", n, () => l().compare?.(o.object.id)), t(e, n);
		};
		i(u, (t) => {
			e(M) && t(d);
		}), a(r), t(n, r);
	};
	i(se, (t) => {
		(o.object.title || e(M)) && t(ce);
	});
	var F = S(se, 2);
	let le;
	u(F, 21, () => o.object.items, d, (n, r, s) => {
		var u = v(), d = x(u), f = (t) => {
			ct(t, {
				get pick() {
					return e(r);
				},
				get actions() {
					return l();
				}
			});
		}, m = k(() => e(A) && ne(e(r))), g = (n) => {
			var u = ht();
			let d;
			var f = O(u), m = (n) => {
				let i = k(() => e(r).from);
				var o = pt(), s = x(o), c = O(s);
				L(c, {
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
				var n = mt();
				p(), t(e, n);
			};
			i(f, (t) => {
				e(r).from ? t(m) : t(g, -1);
			});
			var _ = S(f, 2);
			{
				let t = k(() => o.object.facet === "video"), n = k(() => o.object.facet === "product"), i = k(() => l().open ? () => l().open?.(o.object.id, s) : void 0);
				Ke(_, {
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
			a(u), T(() => d = h(u, 1, "cell svelte-1yroi37", null, d, { lit: e(N) === s })), c("pointerenter", u, () => w(N, s, !0)), c("pointerleave", u, () => e(N) === s && w(N, null)), t(n, u);
		}, _ = (t) => {
			{
				let n = k(() => o.object.facet === "video"), i = k(() => o.object.facet === "product"), a = k(() => l().open ? () => l().open?.(o.object.id, s) : void 0);
				Ke(t, {
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
			e(m) ? t(f) : e(ie) ? t(g, 1) : t(_, -1);
		}), t(n, u);
	}), a(F);
	var R = S(F, 2), z = (n) => {
		var r = gt(), i = O(r);
		{
			let t = k(() => lt(o.object));
			j(i, {
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
	i(R, (t) => {
		g() && o.object.items.length > 1 && !e(A) && t(z);
	}), a(P), T(() => {
		ae = h(P, 1, "picks svelte-1yroi37", null, ae, {
			flights: e(A),
			pictured: e(re)
		}), C(P, "aria-label", o.object.title), oe = ee(P, "", oe, {
			"--across": e(te),
			"--card-widest": `${s.widest}px`
		}), le = h(F, 1, "set svelte-1yroi37", null, le, { sourced: e(ie) });
	}), b(P, "clientWidth", (e) => w(_, e)), t(r, P), n();
}
l(["click"]);
export { vt as default };
