import "./disclose-version-DFvUDwEH.js";
import { B as e, Ct as t, E as n, Et as r, F as i, G as a, H as o, J as s, K as c, M as l, Mt as u, N as d, Nt as f, Q as p, R as m, S as h, Tt as g, U as _, V as v, _t as y, c as b, ct as x, h as S, ht as C, it as w, lt as T, pt as E, q as D, r as O, ut as k, x as ee } from "./index-client-oI5R0J23.js";
import { t as te } from "./Icon-BfOzno3u.js";
import { n as ne, t as A } from "./Mark-k2Ui4Fuu.js";
import j, { t as re } from "./Sheet-DmqANy_9.js";
import { t as ie } from "./Tick02Icon-COqFGcdx.js";
import { a as M, c as N, o as P, s as ae } from "./text-DVq3CuCv.js";
import { a as oe, o as se } from "./link-media-CLTrXU4p.js";
import { t as ce } from "./work_env_open-CZM6S6RQ.js";
import { t as F } from "./frame-thumbs-DqxfUL66.js";
import { y as le } from "./HostGlyph-C4fKhFEj.js";
import { t as I } from "./Title-DCqcKCqa.js";
import "./diagram-CYrcnPZS.js";
import { t as L } from "./PageFace-CpJ4rWOe.js";
import { t as R } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_flight_direct.js
var z = () => "Direct", ue = ((e = {}, t = {}) => (t.locale ?? R(), z(e))), de = (e) => `${e?.count} stops`, fe = ((e, t = {}) => (t.locale ?? R(), de(e))), pe = (e) => `via ${e?.places}`, B = ((e, t = {}) => (t.locale ?? R(), pe(e))), V = () => "Compare", H = ((e = {}, t = {}) => (t.locale ?? R(), V(e))), U = (e) => `Rated ${e?.value} out of ${e?.max}`, W = ((e, t = {}) => (t.locale ?? R(), U(e))), G = (e) => `Rated ${e?.value} out of ${e?.max}, ${e?.count} reviews`, me = ((e, t = {}) => (t.locale ?? R(), G(e))), K = () => "Top pick", he = ((e = {}, t = {}) => (t.locale ?? R(), K(e))), q = (e) => `Was ${e?.price}`, ge = ((e, t = {}) => (t.locale ?? R(), q(e))), _e = _("<svg viewBox=\"0 0 12 12\" aria-hidden=\"true\" class=\"svelte-1ksbd0d\"><path d=\"M6 .9 7.5 4.1l3.5.4-2.6 2.4.7 3.5L6 8.6 2.9 10.4l.7-3.5L1 4.5l3.5-.4z\"></path></svg>");
function J(t, n) {
	let r = O(n, "size", 3, 12);
	var i = _e();
	w(() => {
		S(i, "width", r()), S(i, "height", r());
	}), e(t, i);
}
// upstream/src/features/work/components/objects/Stars.svelte
var ve = o("<span class=\"count svelte-da6cs6\" aria-hidden=\"true\"> </span>"), Y = o("<span class=\"rating svelte-da6cs6\" role=\"img\"><span class=\"row svelte-da6cs6\" aria-hidden=\"true\"><span class=\"track svelte-da6cs6\"></span> <span class=\"fill svelte-da6cs6\"><span class=\"track svelte-da6cs6\"></span></span></span> <span class=\"value svelte-da6cs6\" aria-hidden=\"true\"> </span> <!></span>");
function ye(t, n) {
	r(n, !0);
	let a = O(n, "size", 3, 12), o = y(() => Math.min(1, Math.max(0, n.rating.value / n.rating.max))), s = y(() => new Intl.NumberFormat(void 0, { maximumFractionDigits: 2 }).format(n.rating.value)), c = y(() => n.rating.count ? new Intl.NumberFormat(void 0).format(n.rating.count) : ""), u = y(() => p(c) ? me({
		value: p(s),
		max: n.rating.max,
		count: p(c)
	}) : W({
		value: p(s),
		max: n.rating.max
	}));
	var d = Y(), h = x(d), _ = x(h);
	l(_, 20, () => [
		0,
		1,
		2,
		3,
		4
	], (e) => e, (e, t) => {
		J(e, { get size() {
			return a();
		} });
	}), f(_);
	var v = k(_, 2);
	let b;
	var C = x(v);
	l(C, 20, () => [
		0,
		1,
		2,
		3,
		4
	], (e) => e, (e, t) => {
		J(e, { get size() {
			return a();
		} });
	}), f(C), f(v), f(h);
	var T = k(h, 2), E = x(T, !0);
	f(T);
	var D = k(T, 2), te = (t) => {
		var n = ve(), r = x(n);
		f(n), w(() => m(r, `(${p(c) ?? ""})`)), e(t, n);
	};
	i(D, (e) => {
		p(c) && e(te);
	}), f(d), w(() => {
		S(d, "aria-label", p(u)), b = ee(v, "", b, { "inline-size": `${p(o) * 100}%` }), m(E, p(s));
	}), e(t, d), g();
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
var we = o("<span class=\"length svelte-1f1lvve\"> </span>"), Te = o("<span class=\"play svelte-1f1lvve\" aria-hidden=\"true\"><!></span><!>", 1), Ee = o("<span class=\"badge svelte-1f1lvve\"><!> </span>"), De = o("<div><canvas class=\"svelte-1f1lvve\"></canvas> <!> <!></div>"), Oe = o("<span class=\"flag svelte-1f1lvve\"><!> </span>"), ke = o("<a class=\"nodrag svelte-1f1lvve\"> </a>"), Ae = o("<p class=\"subtitle svelte-1f1lvve\"> </p>"), je = o("<span> </span>"), Me = o("<p class=\"meta svelte-1f1lvve\"><!> <!></p>"), Ne = o("<div class=\"svelte-1f1lvve\"><dt class=\"svelte-1f1lvve\"> </dt> <dd class=\"svelte-1f1lvve\"><!><!></dd></div>"), Pe = o("<dl class=\"facts svelte-1f1lvve\"></dl>"), Fe = o("<p class=\"why svelte-1f1lvve\"> </p>"), Ie = o("<li class=\"svelte-1f1lvve\"> </li>"), Le = o("<ul class=\"tags svelte-1f1lvve\"></ul>"), Re = o("<span class=\"period svelte-1f1lvve\"> </span>"), ze = o("<s class=\"was svelte-1f1lvve\"> </s>"), Be = o("<p class=\"price svelte-1f1lvve\"><span class=\"figure svelte-1f1lvve\"> </span><!><!></p>"), Ve = o("<!> ", 1), He = o("<button type=\"button\"><!></button>"), Ue = o("<button type=\"button\" class=\"nodrag nopan svelte-1f1lvve\"> </button>"), We = o("<div class=\"actions svelte-1f1lvve\"><!> <!> <!></div>"), Ge = o("<article><!> <div class=\"body svelte-1f1lvve\"><!> <header class=\"svelte-1f1lvve\"><!> <div class=\"names svelte-1f1lvve\"><h4><!></h4> <!></div></header> <!> <!> <!> <!> <!></div> <!></article>");
function Ke(o, s) {
	r(s, !0);
	let c = O(s, "video", 3, !1), u = O(s, "product", 3, !1), d = O(s, "actions", 19, () => ({})), _ = y(() => c() && !!s.pick.url && !!oe(s.pick.url)), v = (e) => Number(e.replace(/[^\d.]/gu, "")) || 0, j = y(() => M(s.pick.price?.display ?? "")), I = y(() => {
		if (!s.pick.price) return null;
		if (s.pick.price.was) return {
			value: s.pick.price.was,
			fact: null
		};
		let e = s.pick.price.amount ?? v(p(j)), t = s.pick.facts.find((t) => /^(original|was|regular|usual|list|before)\b/iu.test(t.label.trim()) && v(t.value) > e && e > 0);
		return t ? {
			value: t.value,
			fact: t
		} : null;
	}), L = y(() => Ce(s.pick)), R = y(() => p(L).facts.filter((e) => e !== p(I)?.fact)), z = y(() => s.pick.recommended ? s.pick.tags.filter((e) => !/^(recommended|top pick)$/iu.test(e.trim())) : s.pick.tags), ue = C(null), de = t(le), fe = y(() => de?.far ? 240 : 640), pe = y(() => !!s.pick.picture && p(ue) === s.pick.picture.src), B = y(() => s.pick.picture && !p(pe) ? s.pick.picture : null), V = y(() => !p(B) && s.pick.logo && ne(s.pick.logo) ? s.pick.logo : null), H = y(() => {
		let e = p(j).search(/\s*(\/|per\b)/u);
		return e > 0 ? {
			figure: p(j).slice(0, e),
			period: p(j).slice(e)
		} : {
			figure: p(j),
			period: ""
		};
	}), U = y(() => s.pick.name.split(/\s+/u).reduce((e, t) => t.length > e.length ? t : e, "")), W = y(() => Math.max(6, p(U).length)), G = C(0), me = y(() => !!p(G) && p(W) * .64 * 12 > p(G) && p(U)[0] === p(U)[0]?.toLowerCase());
	var K = Ge();
	let q;
	var _e = x(K), ve = (t) => {
		var r = De();
		let a;
		var o = x(r);
		n(o, (e, t) => F?.(e, t), () => ({
			url: p(B).src,
			width: p(fe),
			onmissing: () => E(ue, s.pick.picture?.src ?? null, !0)
		}));
		var l = k(o, 2), d = (t) => {
			var n = Te(), r = T(n), a = x(r);
			{
				let e = y(() => p(_) ? 52 : 44);
				se(a, {
					get size() {
						return p(e);
					},
					get youtube() {
						return p(_);
					}
				});
			}
			f(r);
			var o = k(r), c = (t) => {
				var n = we(), r = x(n, !0);
				f(n), w(() => m(r, s.pick.duration)), e(t, n);
			};
			i(o, (e) => {
				s.pick.duration && e(c);
			}), e(t, n);
		};
		i(l, (e) => {
			c() && e(d);
		});
		var g = k(l, 2), v = (t) => {
			var n = Ee(), r = x(n);
			J(r, { size: 11 });
			var i = k(r, 1, !0);
			f(n), w((e) => m(i, e), [() => he()]), e(t, n);
		};
		i(g, (e) => {
			s.pick.recommended && e(v);
		}), f(r), w(() => {
			a = h(r, 1, "photo svelte-1f1lvve", null, a, {
				video: c(),
				product: u()
			}), S(o, "data-picture", p(B).src);
		}), e(t, r);
	};
	i(_e, (e) => {
		p(B) && e(ve);
	});
	var Y = k(_e, 2), be = x(Y), X = (t) => {
		var n = Oe(), r = x(n);
		J(r, { size: 11 });
		var i = k(r, 1, !0);
		f(n), w((e) => m(i, e), [() => he()]), e(t, n);
	};
	i(be, (e) => {
		!p(B) && s.pick.recommended && e(X);
	});
	var Z = k(be, 2), xe = x(Z), Se = (e) => {
		A(e, {
			get address() {
				return p(V);
			},
			size: 20
		});
	};
	i(xe, (e) => {
		p(V) && e(Se);
	});
	var Q = k(xe, 2), $ = x(Q);
	let Ke, qe;
	var Je = x($), Ye = (t) => {
		var n = ke(), r = x(n, !0);
		f(n), w(() => {
			S(n, "href", s.pick.url), m(r, s.pick.name);
		}), D("click", n, (e) => {
			d().link && (e.preventDefault(), d().link(s.pick.url));
		}), e(t, n);
	}, Xe = (t) => {
		var n = a();
		w(() => m(n, s.pick.name)), e(t, n);
	};
	i(Je, (e) => {
		s.pick.url ? e(Ye) : e(Xe, -1);
	}), f($);
	var Ze = k($, 2), Qe = (t) => {
		var n = Ae(), r = x(n, !0);
		f(n), w(() => m(r, s.pick.subtitle)), e(t, n);
	};
	i(Ze, (e) => {
		s.pick.subtitle && e(Qe);
	}), f(Q), f(Z);
	var $e = k(Z, 2), et = (t) => {
		var n = Me(), r = x(n), a = (e) => {
			ye(e, { get rating() {
				return p(L).rating;
			} });
		};
		i(r, (e) => {
			p(L).rating && e(a);
		});
		var o = k(r, 2), l = (t) => {
			var n = je(), r = x(n, !0);
			f(n), w(() => m(r, s.pick.duration)), e(t, n);
		};
		i(o, (e) => {
			c() && s.pick.duration && !p(B) && e(l);
		}), f(n), e(t, n);
	};
	i($e, (e) => {
		(p(L).rating || c() && s.pick.duration && !p(B)) && e(et);
	});
	var tt = k($e, 2), nt = (t) => {
		var n = Pe();
		l(n, 21, () => p(R), (e) => e.label, (t, n) => {
			var r = Ne(), a = x(r), o = x(a, !0);
			f(a);
			var s = k(a, 2), c = x(s), l = (e) => {
				re(e, {
					get value() {
						return p(n).kind;
					},
					size: 14
				});
			};
			i(c, (e) => {
				(p(n).kind === "yes" || p(n).kind === "no" || p(n).kind === "partial") && e(l);
			});
			var u = k(c), d = (t) => {
				var r = je();
				let i;
				var a = x(r, !0);
				f(r), w(() => {
					i = h(r, 1, "value svelte-1f1lvve", null, i, { quiet: p(n).kind === "no" }), S(r, "title", p(n).value), m(a, p(n).value);
				}), e(t, r);
			}, g = y(() => !/^(yes|no)$/iu.test(p(n).value.trim()));
			i(u, (e) => {
				p(g) && e(d);
			}), f(s), f(r), w(() => m(o, p(n).label)), e(t, r);
		}), f(n), e(t, n);
	};
	i(tt, (e) => {
		p(R).length && e(nt);
	});
	var rt = k(tt, 2), it = (t) => {
		var n = Fe(), r = x(n, !0);
		f(n), w(() => m(r, s.pick.why)), e(t, n);
	};
	i(rt, (e) => {
		s.pick.why && e(it);
	});
	var at = k(rt, 2), ot = (t) => {
		var n = Le();
		l(n, 20, () => p(z), (e) => e, (t, n) => {
			var r = Ie(), i = x(r, !0);
			f(r), w(() => m(i, n)), e(t, r);
		}), f(n), e(t, n);
	};
	i(at, (e) => {
		p(z).length && e(ot);
	});
	var st = k(at, 2), ct = (t) => {
		var n = Be(), r = x(n), a = x(r, !0);
		f(r);
		var o = k(r), s = (t) => {
			var n = Re(), r = x(n, !0);
			f(n), w(() => m(r, p(H).period)), e(t, n);
		};
		i(o, (e) => {
			p(H).period && e(s);
		});
		var c = k(o), l = (t) => {
			var n = ze(), r = x(n, !0);
			f(n), w((e) => {
				S(n, "aria-label", e), m(r, p(I).value);
			}, [() => ge({ price: p(I).value })]), e(t, n);
		};
		i(c, (e) => {
			p(I) && e(l);
		}), f(n), w(() => m(a, p(H).figure)), e(t, n);
	};
	i(st, (e) => {
		s.pick.price && e(ct);
	}), f(Y);
	var lt = k(Y, 2), ut = (t) => {
		var n = We(), r = x(n), o = (t) => {
			var n = He();
			let r;
			var o = x(n), c = (t) => {
				var n = Ve(), r = T(n);
				te(r, {
					get icon() {
						return ie;
					},
					size: 13
				});
				var i = k(r, 1, !0);
				w((e) => m(i, e), [() => P()]), e(t, n);
			}, l = (t) => {
				var n = a();
				w((e) => m(n, e), [() => ae()]), e(t, n);
			};
			i(o, (e) => {
				s.pick.chosen ? e(c) : e(l, -1);
			}), f(n), w(() => r = h(n, 1, "nodrag nopan svelte-1f1lvve", null, r, { on: s.pick.chosen })), D("click", n, () => d().choose?.(s.pick.element, !s.pick.chosen)), e(t, n);
		};
		i(r, (e) => {
			d().choose && s.pick.element && e(o);
		});
		var c = k(r, 2), l = (t) => {
			var n = Ue(), r = x(n, !0);
			f(n), w((e) => m(r, e), [() => N()]), D("click", n, () => d().ask?.(s.pick.name)), e(t, n);
		};
		i(c, (e) => {
			d().ask && e(l);
		});
		var u = k(c, 2), p = (t) => {
			var n = Ue(), r = x(n, !0);
			f(n), w((e) => m(r, e), [() => ce()]), D("click", n, function(...e) {
				s.onopen?.apply(this, e);
			}), e(t, n);
		};
		i(u, (e) => {
			s.onopen && e(p);
		}), f(n), e(t, n);
	};
	i(lt, (e) => {
		(d().choose || d().ask || s.onopen) && e(ut);
	}), f(K), w(() => {
		q = h(K, 1, "pick svelte-1f1lvve", null, q, {
			recommended: s.pick.recommended,
			chosen: s.pick.chosen,
			pictured: !!p(B)
		}), S($, "title", s.pick.name), Ke = h($, 1, "svelte-1f1lvve", null, Ke, { hyphenate: p(me) }), qe = ee($, "", qe, { "--longest": p(W) });
	}), b(Q, "clientWidth", (e) => E(G, e)), e(o, K), g();
}
c(["click"]);
// upstream/src/features/work/components/objects/FlightCard.svelte
var qe = o("<span class=\"flag svelte-16l3ooh\"><!> </span>"), Je = o("<span class=\"price svelte-16l3ooh\"> </span>"), Ye = o("<p class=\"when svelte-16l3ooh\"> </p>"), Xe = o("<span class=\"place svelte-16l3ooh\"> </span>"), Ze = o("<span class=\"duration svelte-16l3ooh\"> </span>"), Qe = o("<span class=\"stop svelte-16l3ooh\"></span>"), $e = o("<span> </span>"), et = o("<li class=\"svelte-16l3ooh\"><!><!></li>"), tt = o("<ul class=\"facts svelte-16l3ooh\"></ul>"), nt = o("<p class=\"why svelte-16l3ooh\"> </p>"), rt = o("<!> ", 1), it = o("<button type=\"button\" class=\"nodrag nopan svelte-16l3ooh\"><!></button>"), at = o("<button type=\"button\" class=\"nodrag nopan svelte-16l3ooh\"> </button>"), ot = o("<div class=\"actions svelte-16l3ooh\"><!> <!></div>"), st = o("<article><header class=\"svelte-16l3ooh\"><!> <span class=\"carrier svelte-16l3ooh\"> </span> <!> <!></header> <!> <div class=\"route svelte-16l3ooh\"><div class=\"end svelte-16l3ooh\"><span class=\"time svelte-16l3ooh\"> </span> <!></div> <div class=\"way svelte-16l3ooh\"><!> <span class=\"line svelte-16l3ooh\" aria-hidden=\"true\"></span> <span> </span></div> <div class=\"end arrive svelte-16l3ooh\"><span class=\"time svelte-16l3ooh\"> </span> <!></div></div> <!> <!> <!></article>");
function ct(t, n) {
	r(n, !0);
	let o = O(n, "actions", 19, () => ({})), s = y(() => n.pick.route), c = y(() => p(s).carrierHost ?? n.pick.logo), u = y(() => p(s).stops === 0 ? ue() : p(s).via?.length ? B({ places: p(s).via.join(", ") }) : fe({ count: p(s).stops }));
	var d = st();
	let _;
	var v = x(d), b = x(v), S = (e) => {
		A(e, {
			get address() {
				return p(c);
			},
			size: 20
		});
	}, C = y(() => p(c) && ne(p(c)));
	i(b, (e) => {
		p(C) && e(S);
	});
	var E = k(b, 2), j = x(E, !0);
	f(E);
	var M = k(E, 2), oe = (t) => {
		var n = qe(), r = x(n);
		J(r, { size: 11 });
		var i = k(r, 1, !0);
		f(n), w((e) => m(i, e), [() => he()]), e(t, n);
	};
	i(M, (e) => {
		n.pick.recommended && e(oe);
	});
	var se = k(M, 2), ce = (t) => {
		var r = Je(), i = x(r, !0);
		f(r), w(() => m(i, n.pick.price.display)), e(t, r);
	};
	i(se, (e) => {
		n.pick.price && e(ce);
	}), f(v);
	var F = k(v, 2), le = (t) => {
		var r = Ye(), i = x(r, !0);
		f(r), w(() => m(i, n.pick.when)), e(t, r);
	};
	i(F, (e) => {
		n.pick.when && e(le);
	});
	var I = k(F, 2), L = x(I), R = x(L), z = x(R, !0);
	f(R);
	var de = k(R, 2), pe = (t) => {
		var n = Xe(), r = x(n, !0);
		f(n), w(() => m(r, p(s).from)), e(t, n);
	};
	i(de, (e) => {
		p(s).depart && e(pe);
	}), f(L);
	var V = k(L, 2), H = x(V), U = (t) => {
		var n = Ze(), r = x(n, !0);
		f(n), w(() => m(r, p(s).duration)), e(t, n);
	};
	i(H, (e) => {
		p(s).duration && e(U);
	});
	var W = k(H, 2);
	l(W, 20, () => Array.from({ length: p(s).stops }, (e, t) => t), (e) => e, (t, n) => {
		var r = Qe();
		let i;
		w(() => i = ee(r, "", i, { "inset-inline-start": `${(n + 1) / (p(s).stops + 1) * 100}%` })), e(t, r);
	}), f(W);
	var G = k(W, 2);
	let me;
	var K = x(G, !0);
	f(G), f(V);
	var q = k(V, 2), ge = x(q), _e = x(ge, !0);
	f(ge);
	var ve = k(ge, 2), Y = (t) => {
		var n = Xe(), r = x(n, !0);
		f(n), w(() => m(r, p(s).to)), e(t, n);
	};
	i(ve, (e) => {
		p(s).arrive && e(Y);
	}), f(q), f(I);
	var ye = k(I, 2), be = (t) => {
		var r = tt();
		l(r, 21, () => n.pick.facts, (e) => e.label, (t, n) => {
			var r = et(), a = x(r), o = (e) => {
				re(e, {
					get value() {
						return p(n).kind;
					},
					size: 14
				});
			};
			i(a, (e) => {
				(p(n).kind === "yes" || p(n).kind === "no" || p(n).kind === "partial") && e(o);
			});
			var s = k(a), c = (t) => {
				var r = $e();
				let i;
				var a = x(r, !0);
				f(r), w(() => {
					i = h(r, 1, "svelte-16l3ooh", null, i, { quiet: p(n).kind === "no" }), m(a, p(n).value);
				}), e(t, r);
			}, l = y(() => !/^(yes|no)$/iu.test(p(n).value.trim()));
			i(s, (e) => {
				p(l) && e(c);
			}), f(r), e(t, r);
		}), f(r), e(t, r);
	};
	i(ye, (e) => {
		n.pick.facts.length && e(be);
	});
	var X = k(ye, 2), Z = (t) => {
		var r = nt(), i = x(r, !0);
		f(r), w(() => m(i, n.pick.why)), e(t, r);
	};
	i(X, (e) => {
		n.pick.why && e(Z);
	});
	var xe = k(X, 2), Se = (t) => {
		var r = ot(), s = x(r), c = (t) => {
			var r = it(), s = x(r), c = (t) => {
				var n = rt(), r = T(n);
				te(r, {
					get icon() {
						return ie;
					},
					size: 13
				});
				var i = k(r, 1, !0);
				w((e) => m(i, e), [() => P()]), e(t, n);
			}, l = (t) => {
				var n = a();
				w((e) => m(n, e), [() => ae()]), e(t, n);
			};
			i(s, (e) => {
				n.pick.chosen ? e(c) : e(l, -1);
			}), f(r), D("click", r, () => o().choose?.(n.pick.element, !n.pick.chosen)), e(t, r);
		};
		i(s, (e) => {
			o().choose && n.pick.element && e(c);
		});
		var l = k(s, 2), u = (t) => {
			var r = at(), i = x(r, !0);
			f(r), w((e) => m(i, e), [() => N()]), D("click", r, () => o().ask?.(n.pick.name)), e(t, r);
		};
		i(l, (e) => {
			o().ask && e(u);
		}), f(r), e(t, r);
	};
	i(xe, (e) => {
		(o().choose || o().ask) && e(Se);
	}), f(d), w(() => {
		_ = h(d, 1, "flight svelte-16l3ooh", null, _, {
			recommended: n.pick.recommended,
			chosen: n.pick.chosen
		}), m(j, p(s).carrier ?? n.pick.name), m(z, p(s).depart ?? p(s).from), me = h(G, 1, "stops svelte-16l3ooh", null, me, { direct: p(s).stops === 0 }), m(K, p(u)), m(_e, p(s).arrive ?? p(s).to);
	}), e(t, d), g();
}
c(["click"]);
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
var dt = o("<button type=\"button\" class=\"compare nodrag nopan svelte-1yroi37\"> </button>"), ft = o("<header class=\"svelte-1yroi37\"><!> <!></header>"), pt = o("<button type=\"button\" class=\"from nodrag nopan svelte-1yroi37\"><!></button><span class=\"stem svelte-1yroi37\" aria-hidden=\"true\"></span>", 1), mt = o("<span class=\"from none svelte-1yroi37\" aria-hidden=\"true\"></span><span class=\"stem none svelte-1yroi37\" aria-hidden=\"true\"></span>", 1), ht = o("<div role=\"group\"><!> <!></div>"), gt = o("<div class=\"compare-sheet svelte-1yroi37\"><!></div>"), _t = o("<section><!> <div></div> <!></section>");
function vt(t, n) {
	r(n, !0);
	let a = {
		pictured: 200,
		plain: 220,
		widest: 248,
		gap: 16
	}, o = O(n, "actions", 19, () => ({})), c = O(n, "centre", 3, !1), _ = C(0), te = y(() => {
		let e = n.object.items.length;
		if (!e) return 1;
		let t = p(re) ? a.pictured : a.plain, r = p(_) ? Math.max(1, Math.floor((p(_) + a.gap) / (t + a.gap))) : Math.min(e, 4), i = Math.ceil(e / Math.min(r, e));
		return Math.ceil(e / i);
	}), ne = (e) => !!e.route, A = y(() => n.object.facet === "flight" && n.object.items.every(ne)), re = y(() => n.object.items.some((e) => e.picture)), ie = y(() => {
		if (p(A) || c() || !n.object.items.some((e) => e.from)) return !1;
		let e = n.object.items.map((e) => e.from?.page);
		return e.every((e) => e) && new Set(e).size === e.length;
	}), M = y(() => !!o().compare && !p(A) && ut(n.object)), N = C(null);
	var P = _t();
	let ae, oe;
	var se = x(P), ce = (t) => {
		var r = ft(), a = x(r), s = (e) => {
			I(e, { get text() {
				return n.object.title;
			} });
		};
		i(a, (e) => {
			n.object.title && e(s);
		});
		var c = k(a, 2), l = (t) => {
			var r = dt(), i = x(r, !0);
			f(r), w((e) => m(i, e), [() => H()]), D("click", r, () => o().compare?.(n.object.id)), e(t, r);
		};
		i(c, (e) => {
			p(M) && e(l);
		}), f(r), e(t, r);
	};
	i(se, (e) => {
		(n.object.title || p(M)) && e(ce);
	});
	var F = k(se, 2);
	let le;
	l(F, 21, () => n.object.items, d, (t, r, a) => {
		var c = v(), l = T(c), d = (e) => {
			ct(e, {
				get pick() {
					return p(r);
				},
				get actions() {
					return o();
				}
			});
		}, m = y(() => p(A) && ne(p(r))), g = (t) => {
			var c = ht();
			let l;
			var d = x(c), m = (t) => {
				let n = y(() => p(r).from);
				var i = pt(), a = T(i), s = x(a);
				L(s, {
					get url() {
						return p(n).url;
					},
					get title() {
						return p(n).title;
					},
					get frame() {
						return p(n).frame;
					}
				}), f(a), u(), w(() => S(a, "aria-label", p(n).title || p(n).url)), D("click", a, (e) => {
					e.stopPropagation(), o().link?.(p(n).url);
				}), e(t, i);
			}, g = (t) => {
				var n = mt();
				u(), e(t, n);
			};
			i(d, (e) => {
				p(r).from ? e(m) : e(g, -1);
			});
			var _ = k(d, 2);
			{
				let e = y(() => n.object.facet === "video"), t = y(() => n.object.facet === "product"), i = y(() => o().open ? () => o().open?.(n.object.id, a) : void 0);
				Ke(_, {
					get pick() {
						return p(r);
					},
					get actions() {
						return o();
					},
					get video() {
						return p(e);
					},
					get product() {
						return p(t);
					},
					get onopen() {
						return p(i);
					}
				});
			}
			f(c), w(() => l = h(c, 1, "cell svelte-1yroi37", null, l, { lit: p(N) === a })), s("pointerenter", c, () => E(N, a, !0)), s("pointerleave", c, () => p(N) === a && E(N, null)), e(t, c);
		}, _ = (e) => {
			{
				let t = y(() => n.object.facet === "video"), i = y(() => n.object.facet === "product"), s = y(() => o().open ? () => o().open?.(n.object.id, a) : void 0);
				Ke(e, {
					get pick() {
						return p(r);
					},
					get actions() {
						return o();
					},
					get video() {
						return p(t);
					},
					get product() {
						return p(i);
					},
					get onopen() {
						return p(s);
					}
				});
			}
		};
		i(l, (e) => {
			p(m) ? e(d) : p(ie) ? e(g, 1) : e(_, -1);
		}), e(t, c);
	}), f(F);
	var R = k(F, 2), z = (t) => {
		var r = gt(), i = x(r);
		{
			let e = y(() => lt(n.object));
			j(i, {
				get object() {
					return p(e);
				},
				get actions() {
					return o();
				},
				get rows() {
					return n.object.items.length;
				}
			});
		}
		f(r), e(t, r);
	};
	i(R, (e) => {
		c() && n.object.items.length > 1 && !p(A) && e(z);
	}), f(P), w(() => {
		ae = h(P, 1, "picks svelte-1yroi37", null, ae, {
			flights: p(A),
			pictured: p(re)
		}), S(P, "aria-label", n.object.title), oe = ee(P, "", oe, {
			"--across": p(te),
			"--card-widest": `${a.widest}px`
		}), le = h(F, 1, "set svelte-1yroi37", null, le, { sourced: p(ie) });
	}), b(P, "clientWidth", (e) => E(_, e)), e(t, P), g();
}
c(["click"]);
export { vt as default };
