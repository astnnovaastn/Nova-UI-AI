import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, E as r, F as i, Ft as a, G as o, H as s, J as c, K as l, M as u, N as d, Ot as f, Pt as p, R as m, S as h, Tt as g, U as _, V as v, X as y, _t as b, c as x, dt as ee, ft as S, h as C, ht as w, ot as T, q as E, r as D, ut as O, x as k, yt as A } from "./index-client-C_2wYFnt.js";
import { t as j } from "./Icon-E4BzZ4dm.js";
import { n as M, t as te } from "./Mark-BTIzBHOo.js";
import N, { t as ne } from "./Sheet-D8CDaSZX.js";
import { a as re, c as P, o as F, s as I } from "./text-DVq3CuCv.js";
import { a as ie, o as ae } from "./link-media-qN432bcy.js";
import { t as oe } from "./frame-thumbs-ML8-cPjB.js";
import { g as L } from "./HostGlyph-D7LkZa-a.js";
import { t as se } from "./Tick02Icon-COqFGcdx.js";
import { t as R } from "./Title-BF8NXEcN.js";
import "./diagram-Bg4vYWtj.js";
import { t as z } from "./PageFace-D2__z-9e.js";
import { t as B } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_flight_direct.js
var ce = () => "Direct", V = ((e = {}, t = {}) => (t.locale ?? B(), ce(e))), H = (e) => `${e?.count} stops`, U = ((e, t = {}) => (t.locale ?? B(), H(e))), le = (e) => `via ${e?.places}`, ue = ((e, t = {}) => (t.locale ?? B(), le(e))), W = () => "Compare", G = ((e = {}, t = {}) => (t.locale ?? B(), W(e))), K = (e) => `Rated ${e?.value} out of ${e?.max}`, q = ((e, t = {}) => (t.locale ?? B(), K(e))), J = (e) => `Rated ${e?.value} out of ${e?.max}, ${e?.count} reviews`, Y = ((e, t = {}) => (t.locale ?? B(), J(e))), de = () => "Top pick", fe = ((e = {}, t = {}) => (t.locale ?? B(), de(e))), pe = (e) => `Was ${e?.price}`, me = ((e, t = {}) => (t.locale ?? B(), pe(e))), he = _("<svg viewBox=\"0 0 12 12\" aria-hidden=\"true\" class=\"svelte-1ksbd0d\"><path d=\"M6 .9 7.5 4.1l3.5.4-2.6 2.4.7 3.5L6 8.6 2.9 10.4l.7-3.5L1 4.5l3.5-.4z\"></path></svg>");
function X(e, n) {
	let r = D(n, "size", 3, 12);
	var i = he();
	T(() => {
		C(i, "width", r()), C(i, "height", r());
	}), t(e, i);
}
// upstream/src/features/work/components/objects/Stars.svelte
var ge = s("<span class=\"count svelte-da6cs6\" aria-hidden=\"true\"> </span>"), _e = s("<span class=\"rating svelte-da6cs6\" role=\"img\"><span class=\"row svelte-da6cs6\" aria-hidden=\"true\"><span class=\"track svelte-da6cs6\"></span> <span class=\"fill svelte-da6cs6\"><span class=\"track svelte-da6cs6\"></span></span></span> <span class=\"value svelte-da6cs6\" aria-hidden=\"true\"> </span> <!></span>");
function ve(r, o) {
	f(o, !0);
	let s = D(o, "size", 3, 12), c = A(() => Math.min(1, Math.max(0, o.rating.value / o.rating.max))), l = A(() => new Intl.NumberFormat(void 0, { maximumFractionDigits: 2 }).format(o.rating.value)), d = A(() => o.rating.count ? new Intl.NumberFormat(void 0).format(o.rating.count) : ""), p = A(() => e(d) ? Y({
		value: e(l),
		max: o.rating.max,
		count: e(d)
	}) : q({
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
		X(e, { get size() {
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
		X(e, { get size() {
			return s();
		} });
	}), a(b), a(v), a(g);
	var x = S(g, 2), ee = O(x, !0);
	a(x);
	var w = S(x, 2), E = (n) => {
		var r = ge(), i = O(r);
		a(r), T(() => m(i, `(${e(d) ?? ""})`)), t(n, r);
	};
	i(w, (t) => {
		e(d) && t(E);
	}), a(h), T(() => {
		C(h, "aria-label", e(p)), y = k(v, "", y, { "inline-size": `${e(c) * 100}%` }), m(ee, e(l));
	}), t(r, h), n();
}
// upstream/src/features/work/lib/board/rating.ts
var ye = /^(rating|ratings|ocena|oceny|opinie|reviews?|review score|stars?|score|bewertung|avis|note)\b/iu;
function Z(e) {
	let t = e.replace(/\s/gu, ""), n = /^(\d+)[.,](\d{1,2})$/u.exec(t);
	if (n) return Number(`${n[1]}.${n[2]}`);
	let r = t.replace(/[.,](?=\d{3}\b)/gu, "");
	return /^\d+$/u.test(r) ? Number(r) : null;
}
var be = /(?<![\d.,])(\d+(?:[.,]\d+)?)\s*(?:na|out\s+of|of|z|von|sur|\/)\s*(5|10)\b/iu, xe = /(?:\(\s*(\d[\d\s.,]*)\s*\)|(\d[\d\s.,]*?)\s*(?:ocen\w*|opini\w*|recenz\w*|reviews?|ratings?|votes?|bewertungen|avis))/iu;
function Q(e) {
	let t = be.exec(e);
	if (!t) return null;
	let n = Z(t[1]), r = Number(t[2]) === 10 ? 10 : 5;
	if (n === null || n > r) return null;
	let i = xe.exec(e.slice(t.index + t[0].length)), a = i ? Z((i[1] ?? i[2] ?? "").trim()) : null;
	return {
		value: n,
		max: r,
		...a ? { count: a } : {}
	};
}
var $ = (e) => e.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
function Se(e, t) {
	let n = $(e), r = $(t);
	return r.length > 0 && (n === r || r.length > 12 && (n.includes(r) || r.includes(n)));
}
function Ce(e) {
	let t = e.facts.find((e) => ye.test(e.label.trim()) && Q(e.value));
	return {
		rating: e.rating ?? (t ? Q(t.value) : null),
		facts: e.facts.filter((n) => n !== t && !Se(e.name, n.value))
	};
}
// upstream/src/features/work/components/objects/PickCard.svelte
var we = s("<button type=\"button\" class=\"poster-open nodrag nopan svelte-1f1lvve\"></button>"), Te = s("<span class=\"length svelte-1f1lvve\"> </span>"), Ee = s("<span class=\"play svelte-1f1lvve\" aria-hidden=\"true\"><!></span><!>", 1), De = s("<span class=\"badge svelte-1f1lvve\"><!> </span>"), Oe = s("<div><!> <canvas class=\"svelte-1f1lvve\"></canvas> <!> <!></div>"), ke = s("<div><img alt=\"\" loading=\"lazy\" decoding=\"async\" referrerpolicy=\"no-referrer\" draggable=\"false\" class=\"svelte-1f1lvve\"/> <!></div>"), Ae = s("<span class=\"flag svelte-1f1lvve\"><!> </span>"), je = s("<a class=\"nodrag svelte-1f1lvve\"> </a>"), Me = s("<p class=\"subtitle svelte-1f1lvve\"> </p>"), Ne = s("<span> </span>"), Pe = s("<p class=\"meta svelte-1f1lvve\"><!> <!></p>"), Fe = s("<div class=\"svelte-1f1lvve\"><dt class=\"svelte-1f1lvve\"> </dt> <dd class=\"svelte-1f1lvve\"><!><!></dd></div>"), Ie = s("<dl class=\"facts svelte-1f1lvve\"></dl>"), Le = s("<p class=\"why svelte-1f1lvve\"> </p>"), Re = s("<li class=\"svelte-1f1lvve\"> </li>"), ze = s("<ul class=\"tags svelte-1f1lvve\"></ul>"), Be = s("<span class=\"period svelte-1f1lvve\"> </span>"), Ve = s("<s class=\"was svelte-1f1lvve\"> </s>"), He = s("<p class=\"price svelte-1f1lvve\"><span class=\"figure svelte-1f1lvve\"> </span><!><!></p>"), Ue = s("<article><!> <div class=\"body svelte-1f1lvve\"><!> <header class=\"svelte-1f1lvve\"><!> <div class=\"names svelte-1f1lvve\"><h4><!></h4> <!></div></header> <!> <!> <!> <!> <!></div> <!></article>");
function We(s, l) {
	f(l, !0);
	let d = D(l, "video", 3, !1), p = D(l, "product", 3, !1), _ = D(l, "actions", 19, () => ({})), v = A(() => d() && !!l.pick.url && !!ie(l.pick.url)), j = (e) => Number(e.replace(/[^\d.]/gu, "")) || 0, N = A(() => re(l.pick.price?.display ?? "")), P = A(() => {
		if (!l.pick.price) return null;
		if (l.pick.price.was) return {
			value: l.pick.price.was,
			fact: null
		};
		let t = l.pick.price.amount ?? j(e(N)), n = l.pick.facts.find((e) => /^(original|was|regular|usual|list|before)\b/iu.test(e.label.trim()) && j(e.value) > t && t > 0);
		return n ? {
			value: n.value,
			fact: n
		} : null;
	}), F = A(() => Ce(l.pick)), I = A(() => e(F).facts.filter((t) => t !== e(P)?.fact)), se = A(() => l.pick.recommended ? l.pick.tags.filter((e) => !/^(recommended|top pick)$/iu.test(e.trim())) : l.pick.tags), R = b(null), z = g(L), B = A(() => l.pick.imageRegion ? 1600 : z?.far ? 240 : 640), ce = A(() => !!l.pick.picture && e(R) === l.pick.picture.src), V = A(() => l.pick.picture && !e(ce) ? l.pick.picture : null), H = b(0), U = A(() => e(V) ? null : l.pick.remote?.[e(H)] ?? null), le = A(() => !e(V) && l.pick.logo && M(l.pick.logo) ? l.pick.logo : null), ue = A(() => {
		let t = e(N).search(/\s*(\/|per\b)/u);
		return t > 0 ? {
			figure: e(N).slice(0, t),
			period: e(N).slice(t)
		} : {
			figure: e(N),
			period: ""
		};
	}), W = A(() => l.pick.name.split(/\s+/u).reduce((e, t) => t.length > e.length ? t : e, "")), G = A(() => Math.max(6, e(W).length)), K = b(0), q = A(() => !!e(K) && e(G) * .64 * 12 > e(K) && e(W)[0] === e(W)[0]?.toLowerCase());
	var J = Ue();
	let Y;
	var de = O(J), pe = (n) => {
		var o = Oe();
		let s, c;
		var u = O(o), f = (e) => {
			var n = we();
			T(() => C(n, "aria-label", "Watch " + l.pick.name)), E("click", n, (e) => {
				e.stopPropagation(), _().link?.(l.pick.url);
			}), t(e, n);
		};
		i(u, (e) => {
			d() && l.pick.url && _().link && e(f);
		});
		var g = S(u, 2);
		r(g, (e, t) => oe?.(e, t), () => ({
			url: e(V).src,
			width: e(B),
			onmissing: () => w(R, l.pick.picture?.src ?? null, !0)
		}));
		var y = S(g, 2), b = (n) => {
			var r = Ee(), o = ee(r), s = O(o);
			{
				let t = A(() => e(v) ? 52 : 44);
				ae(s, {
					get size() {
						return e(t);
					},
					get youtube() {
						return e(v);
					}
				});
			}
			a(o);
			var c = S(o), u = (e) => {
				var n = Te(), r = O(n, !0);
				a(n), T(() => m(r, l.pick.duration)), t(e, n);
			};
			i(c, (e) => {
				l.pick.duration && e(u);
			}), t(n, r);
		};
		i(y, (e) => {
			d() && e(b);
		});
		var x = S(y, 2), D = (e) => {
			var n = De(), r = O(n);
			X(r, { size: 11 });
			var i = S(r, 1, !0);
			a(n), T((e) => m(i, e), [() => fe()]), t(e, n);
		};
		i(x, (e) => {
			l.pick.recommended && e(D);
		}), a(o), T(() => {
			s = h(o, 1, "photo svelte-1f1lvve", null, s, {
				video: d(),
				product: p(),
				region: !!l.pick.imageRegion
			}), c = k(o, "", c, {
				"--region-w": l.pick.imageRegion?.width || 1,
				"--region-h": l.pick.imageRegion?.height || 1,
				"--region-x": l.pick.imageRegion?.x || 0,
				"--region-y": l.pick.imageRegion?.y || 0
			}), C(g, "data-picture", e(V).src);
		}), t(n, o);
	}, he = (n) => {
		var r = ke();
		let o;
		var s = O(r), u = S(s, 2), f = (e) => {
			var n = De(), r = O(n);
			X(r, { size: 11 });
			var i = S(r, 1, !0);
			a(n), T((e) => m(i, e), [() => fe()]), t(e, n);
		};
		i(u, (e) => {
			l.pick.recommended && e(f);
		}), a(r), T(() => {
			o = h(r, 1, "photo remote svelte-1f1lvve", null, o, {
				video: d(),
				product: p()
			}), C(s, "src", e(U));
		}), c("error", s, () => w(H, e(H) + 1)), y(s), t(n, r);
	};
	i(de, (t) => {
		e(V) ? t(pe) : e(U) && t(he, 1);
	});
	var ge = S(de, 2), _e = O(ge), ye = (e) => {
		var n = Ae(), r = O(n);
		X(r, { size: 11 });
		var i = S(r, 1, !0);
		a(n), T((e) => m(i, e), [() => fe()]), t(e, n);
	};
	i(_e, (t) => {
		!e(V) && !e(U) && l.pick.recommended && t(ye);
	});
	var Z = S(_e, 2), be = O(Z), xe = (t) => {
		te(t, {
			get address() {
				return e(le);
			},
			size: 20
		});
	};
	i(be, (t) => {
		e(le) && t(xe);
	});
	var Q = S(be, 2), $ = O(Q);
	let Se, We;
	var Ge = O($), Ke = (e) => {
		var n = je(), r = O(n, !0);
		a(n), T(() => {
			C(n, "href", l.pick.url), m(r, l.pick.name);
		}), E("click", n, (e) => {
			_().link && (e.preventDefault(), _().link(l.pick.url));
		}), t(e, n);
	}, qe = (e) => {
		var n = o();
		T(() => m(n, l.pick.name)), t(e, n);
	};
	i(Ge, (e) => {
		l.pick.url ? e(Ke) : e(qe, -1);
	}), a($);
	var Je = S($, 2), Ye = (e) => {
		var n = Me(), r = O(n, !0);
		a(n), T(() => m(r, l.pick.subtitle)), t(e, n);
	};
	i(Je, (e) => {
		l.pick.subtitle && e(Ye);
	}), a(Q), a(Z);
	var Xe = S(Z, 2), Ze = (n) => {
		var r = Pe(), o = O(r), s = (t) => {
			ve(t, { get rating() {
				return e(F).rating;
			} });
		};
		i(o, (t) => {
			e(F).rating && t(s);
		});
		var c = S(o, 2), u = (e) => {
			var n = Ne(), r = O(n, !0);
			a(n), T(() => m(r, l.pick.duration)), t(e, n);
		};
		i(c, (t) => {
			d() && l.pick.duration && !e(V) && t(u);
		}), a(r), t(n, r);
	};
	i(Xe, (t) => {
		(e(F).rating || d() && l.pick.duration && !e(V)) && t(Ze);
	});
	var Qe = S(Xe, 2), $e = (n) => {
		var r = Ie();
		u(r, 21, () => e(I), (e) => e.label, (n, r) => {
			var o = Fe(), s = O(o), c = O(s, !0);
			a(s);
			var l = S(s, 2), u = O(l), d = (t) => {
				ne(t, {
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
				var i = Ne();
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
	i(Qe, (t) => {
		e(I).length && t($e);
	});
	var et = S(Qe, 2), tt = (e) => {
		var n = Le(), r = O(n, !0);
		a(n), T(() => m(r, l.pick.why)), t(e, n);
	};
	i(et, (e) => {
		l.pick.why && e(tt);
	});
	var nt = S(et, 2), rt = (n) => {
		var r = ze();
		u(r, 20, () => e(se), (e) => e, (e, n) => {
			var r = Re(), i = O(r, !0);
			a(r), T(() => m(i, n)), t(e, r);
		}), a(r), t(n, r);
	};
	i(nt, (t) => {
		e(se).length && t(rt);
	});
	var it = S(nt, 2), at = (n) => {
		var r = He(), o = O(r), s = O(o, !0);
		a(o);
		var c = S(o), l = (n) => {
			var r = Be(), i = O(r, !0);
			a(r), T(() => m(i, e(ue).period)), t(n, r);
		};
		i(c, (t) => {
			e(ue).period && t(l);
		});
		var u = S(c), d = (n) => {
			var r = Ve(), i = O(r, !0);
			a(r), T((t) => {
				C(r, "aria-label", t), m(i, e(P).value);
			}, [() => me({ price: e(P).value })]), t(n, r);
		};
		i(u, (t) => {
			e(P) && t(d);
		}), a(r), T(() => m(s, e(ue).figure)), t(n, r);
	};
	i(it, (e) => {
		l.pick.price && e(at);
	}), a(ge);
	var ot = S(ge, 2);
	i(ot, (e) => {}), a(J), T(() => {
		Y = h(J, 1, "pick svelte-1f1lvve", null, Y, {
			recommended: l.pick.recommended,
			chosen: l.pick.chosen,
			pictured: !!e(V) || !!e(U)
		}), C($, "title", l.pick.name), Se = h($, 1, "svelte-1f1lvve", null, Se, { hyphenate: e(q) }), We = k($, "", We, { "--longest": e(G) });
	}), x(Q, "clientWidth", (e) => w(K, e)), t(s, J), n();
}
l(["click"]);
// upstream/src/features/work/components/objects/FlightCard.svelte
var Ge = s("<span class=\"flag svelte-16l3ooh\"><!> </span>"), Ke = s("<span class=\"price svelte-16l3ooh\"> </span>"), qe = s("<p class=\"when svelte-16l3ooh\"> </p>"), Je = s("<span class=\"place svelte-16l3ooh\"> </span>"), Ye = s("<span class=\"duration svelte-16l3ooh\"> </span>"), Xe = s("<span class=\"stop svelte-16l3ooh\"></span>"), Ze = s("<span> </span>"), Qe = s("<li class=\"svelte-16l3ooh\"><!><!></li>"), $e = s("<ul class=\"facts svelte-16l3ooh\"></ul>"), et = s("<p class=\"why svelte-16l3ooh\"> </p>"), tt = s("<!> ", 1), nt = s("<button type=\"button\" class=\"nodrag nopan svelte-16l3ooh\"><!></button>"), rt = s("<button type=\"button\" class=\"nodrag nopan svelte-16l3ooh\"> </button>"), it = s("<div class=\"actions svelte-16l3ooh\"><!> <!></div>"), at = s("<article><header class=\"svelte-16l3ooh\"><!> <span class=\"carrier svelte-16l3ooh\"> </span> <!> <!></header> <!> <div class=\"route svelte-16l3ooh\"><div class=\"end svelte-16l3ooh\"><span class=\"time svelte-16l3ooh\"> </span> <!></div> <div class=\"way svelte-16l3ooh\"><!> <span class=\"line svelte-16l3ooh\" aria-hidden=\"true\"></span> <span> </span></div> <div class=\"end arrive svelte-16l3ooh\"><span class=\"time svelte-16l3ooh\"> </span> <!></div></div> <!> <!> <!></article>");
function ot(r, s) {
	f(s, !0);
	let c = D(s, "actions", 19, () => ({})), l = A(() => s.pick.route), d = A(() => e(l).carrierHost ?? s.pick.logo), p = A(() => e(l).stops === 0 ? V() : e(l).via?.length ? ue({ places: e(l).via.join(", ") }) : U({ count: e(l).stops }));
	var g = at();
	let _;
	var v = O(g), y = O(v), b = (t) => {
		te(t, {
			get address() {
				return e(d);
			},
			size: 20
		});
	}, x = A(() => e(d) && M(e(d)));
	i(y, (t) => {
		e(x) && t(b);
	});
	var C = S(y, 2), w = O(C, !0);
	a(C);
	var N = S(C, 2), re = (e) => {
		var n = Ge(), r = O(n);
		X(r, { size: 11 });
		var i = S(r, 1, !0);
		a(n), T((e) => m(i, e), [() => fe()]), t(e, n);
	};
	i(N, (e) => {
		s.pick.recommended && e(re);
	});
	var ie = S(N, 2), ae = (e) => {
		var n = Ke(), r = O(n, !0);
		a(n), T(() => m(r, s.pick.price.display)), t(e, n);
	};
	i(ie, (e) => {
		s.pick.price && e(ae);
	}), a(v);
	var oe = S(v, 2), L = (e) => {
		var n = qe(), r = O(n, !0);
		a(n), T(() => m(r, s.pick.when)), t(e, n);
	};
	i(oe, (e) => {
		s.pick.when && e(L);
	});
	var R = S(oe, 2), z = O(R), B = O(z), ce = O(B, !0);
	a(B);
	var H = S(B, 2), le = (n) => {
		var r = Je(), i = O(r, !0);
		a(r), T(() => m(i, e(l).from)), t(n, r);
	};
	i(H, (t) => {
		e(l).depart && t(le);
	}), a(z);
	var W = S(z, 2), G = O(W), K = (n) => {
		var r = Ye(), i = O(r, !0);
		a(r), T(() => m(i, e(l).duration)), t(n, r);
	};
	i(G, (t) => {
		e(l).duration && t(K);
	});
	var q = S(G, 2);
	u(q, 20, () => Array.from({ length: e(l).stops }, (e, t) => t), (e) => e, (n, r) => {
		var i = Xe();
		let a;
		T(() => a = k(i, "", a, { "inset-inline-start": `${(r + 1) / (e(l).stops + 1) * 100}%` })), t(n, i);
	}), a(q);
	var J = S(q, 2);
	let Y;
	var de = O(J, !0);
	a(J), a(W);
	var pe = S(W, 2), me = O(pe), he = O(me, !0);
	a(me);
	var ge = S(me, 2), _e = (n) => {
		var r = Je(), i = O(r, !0);
		a(r), T(() => m(i, e(l).to)), t(n, r);
	};
	i(ge, (t) => {
		e(l).arrive && t(_e);
	}), a(pe), a(R);
	var ve = S(R, 2), ye = (n) => {
		var r = $e();
		u(r, 21, () => s.pick.facts, (e) => e.label, (n, r) => {
			var o = Qe(), s = O(o), c = (t) => {
				ne(t, {
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
				var i = Ze();
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
	i(ve, (e) => {
		s.pick.facts.length && e(ye);
	});
	var Z = S(ve, 2), be = (e) => {
		var n = et(), r = O(n, !0);
		a(n), T(() => m(r, s.pick.why)), t(e, n);
	};
	i(Z, (e) => {
		s.pick.why && e(be);
	});
	var xe = S(Z, 2), Q = (e) => {
		var n = it(), r = O(n), l = (e) => {
			var n = nt(), r = O(n), l = (e) => {
				var n = tt(), r = ee(n);
				j(r, {
					get icon() {
						return se;
					},
					size: 13
				});
				var i = S(r, 1, !0);
				T((e) => m(i, e), [() => F()]), t(e, n);
			}, u = (e) => {
				var n = o();
				T((e) => m(n, e), [() => I()]), t(e, n);
			};
			i(r, (e) => {
				s.pick.chosen ? e(l) : e(u, -1);
			}), a(n), E("click", n, () => c().choose?.(s.pick.element, !s.pick.chosen)), t(e, n);
		};
		i(r, (e) => {
			c().choose && s.pick.element && e(l);
		});
		var u = S(r, 2), d = (e) => {
			var n = rt(), r = O(n, !0);
			a(n), T((e) => m(r, e), [() => P()]), E("click", n, () => c().ask?.(s.pick.name)), t(e, n);
		};
		i(u, (e) => {
			c().ask && e(d);
		}), a(n), t(e, n);
	};
	i(xe, (e) => {
		(c().choose || c().ask) && e(Q);
	}), a(g), T(() => {
		_ = h(g, 1, "flight svelte-16l3ooh", null, _, {
			recommended: s.pick.recommended,
			chosen: s.pick.chosen
		}), m(w, e(l).carrier ?? s.pick.name), m(ce, e(l).depart ?? e(l).from), Y = h(J, 1, "stops svelte-16l3ooh", null, Y, { direct: e(l).stops === 0 }), m(de, e(p)), m(he, e(l).arrive ?? e(l).to);
	}), t(r, g), n();
}
l(["click"]);
// upstream/src/features/work/components/objects/centre.ts
function st(e) {
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
function ct(e) {
	if (e.items.length < 2 || e.facet === "video" || e.facet === "article") return !1;
	if (e.items.filter((e) => e.price || e.rating).length >= 2) return !0;
	let t = /* @__PURE__ */ new Map();
	for (let n of e.items) for (let e of new Set(n.facts.map((e) => e.label.toLowerCase()))) t.set(e, (t.get(e) ?? 0) + 1);
	return [...t.values()].filter((e) => e >= 2).length >= 2;
}
// upstream/src/features/work/components/objects/Picks.svelte
var lt = s("<button type=\"button\" class=\"compare nodrag nopan svelte-1yroi37\"> </button>"), ut = s("<header class=\"svelte-1yroi37\"><!> <!></header>"), dt = s("<button type=\"button\" class=\"from nodrag nopan svelte-1yroi37\"><!></button><span class=\"stem svelte-1yroi37\" aria-hidden=\"true\"></span>", 1), ft = s("<span class=\"from none svelte-1yroi37\" aria-hidden=\"true\"></span><span class=\"stem none svelte-1yroi37\" aria-hidden=\"true\"></span>", 1), pt = s("<div role=\"group\"><!> <!></div>"), mt = s("<div class=\"compare-sheet svelte-1yroi37\"><!></div>"), ht = s("<section><!> <div></div> <!></section>");
function gt(r, o) {
	f(o, !0);
	let s = {
		pictured: 200,
		plain: 220,
		widest: 248,
		gap: 16
	}, l = D(o, "actions", 19, () => ({})), g = D(o, "centre", 3, !1), _ = b(0), y = A(() => {
		let t = o.object.items.length;
		if (!t) return 1;
		let n = e(te) ? s.pictured : s.plain, r = e(_) ? Math.max(1, Math.floor((e(_) + s.gap) / (n + s.gap))) : Math.min(t, 4), i = Math.ceil(t / Math.min(r, t));
		return Math.ceil(t / i);
	}), j = (e) => !!e.route, M = A(() => o.object.facet === "flight" && o.object.items.every(j)), te = A(() => o.object.items.some((e) => e.picture)), ne = A(() => {
		if (e(M) || g() || !o.object.items.some((e) => e.from)) return !1;
		let t = o.object.items.map((e) => e.from?.page);
		return t.every((e) => e) && new Set(t).size === t.length;
	}), re = A(() => !!l().compare && !e(M) && ct(o.object)), P = b(null);
	var F = ht();
	let I, ie;
	var ae = O(F), oe = (n) => {
		var r = ut(), s = O(r), c = (e) => {
			R(e, { get text() {
				return o.object.title;
			} });
		};
		i(s, (e) => {
			o.object.title && e(c);
		});
		var u = S(s, 2), d = (e) => {
			var n = lt(), r = O(n, !0);
			a(n), T((e) => m(r, e), [() => G()]), E("click", n, () => l().compare?.(o.object.id)), t(e, n);
		};
		i(u, (t) => {
			e(re) && t(d);
		}), a(r), t(n, r);
	};
	i(ae, (t) => {
		(o.object.title || e(re)) && t(oe);
	});
	var L = S(ae, 2);
	let se;
	u(L, 21, () => o.object.items, d, (n, r, s) => {
		var u = v(), d = ee(u), f = (t) => {
			ot(t, {
				get pick() {
					return e(r);
				},
				get actions() {
					return l();
				}
			});
		}, m = A(() => e(M) && j(e(r))), g = (n) => {
			var u = pt();
			let d;
			var f = O(u), m = (n) => {
				let i = A(() => e(r).from);
				var o = dt(), s = ee(o), c = O(s);
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
				var n = ft();
				p(), t(e, n);
			};
			i(f, (t) => {
				e(r).from ? t(m) : t(g, -1);
			});
			var _ = S(f, 2);
			{
				let t = A(() => o.object.facet === "video"), n = A(() => o.object.facet === "product"), i = A(() => l().open ? () => l().open?.(o.object.id, s) : void 0);
				We(_, {
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
			a(u), T(() => d = h(u, 1, "cell svelte-1yroi37", null, d, { lit: e(P) === s })), c("pointerenter", u, () => w(P, s, !0)), c("pointerleave", u, () => e(P) === s && w(P, null)), t(n, u);
		}, _ = (t) => {
			{
				let n = A(() => o.object.facet === "video"), i = A(() => o.object.facet === "product"), a = A(() => l().open ? () => l().open?.(o.object.id, s) : void 0);
				We(t, {
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
			e(m) ? t(f) : e(ne) ? t(g, 1) : t(_, -1);
		}), t(n, u);
	}), a(L);
	var B = S(L, 2), ce = (n) => {
		var r = mt(), i = O(r);
		{
			let t = A(() => st(o.object));
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
	i(B, (t) => {
		g() && o.object.items.length > 1 && !e(M) && t(ce);
	}), a(F), T(() => {
		I = h(F, 1, "picks svelte-1yroi37", null, I, {
			flights: e(M),
			pictured: e(te)
		}), C(F, "aria-label", o.object.title), ie = k(F, "", ie, {
			"--across": e(y),
			"--card-widest": `${s.widest}px`
		}), se = h(L, 1, "set svelte-1yroi37", null, se, { sourced: e(ne) });
	}), x(F, "clientWidth", (e) => w(_, e)), t(r, F), n();
}
l(["click"]);
export { gt as default };
