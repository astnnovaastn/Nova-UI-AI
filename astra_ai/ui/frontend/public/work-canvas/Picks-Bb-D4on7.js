import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, E as n, F as r, G as i, H as a, J as o, L as s, Mt as c, P as l, Q as u, Rt as d, S as f, U as p, W as m, X as h, Y as g, bt as _, c as v, h as y, ht as b, jt as x, kt as S, lt as C, mt as ee, pt as w, q as T, r as E, tt as D, vt as O, x as k, zt as A } from "./index-client-DH73-vTM.js";
import { t as j } from "./Icon-D2j1Ej6Z.js";
import "./Icon-CmjKIKuh.js";
import { n as M, t as te } from "./Mark-y83oESZj.js";
import N, { t as ne } from "./Sheet-hV5w8oyy.js";
import { a as re, c as P, o as F, s as I } from "./text-DVq3CuCv.js";
import { a as ie, o as ae } from "./link-media-Qx-gCMFf.js";
import { t as oe } from "./frame-thumbs-Nfr7pZR2.js";
import { g as L } from "./HostGlyph-CXcYKorm.js";
import { t as se } from "./Tick02Icon-D7tHNRMx.js";
import { t as R } from "./Title-B4cGdolK.js";
import "./diagram-DENtg_HT.js";
import { t as z } from "./PageFace-D49tiqHZ.js";
import { t as B } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_flight_direct.js
var ce = () => "Direct", V = ((e = {}, t = {}) => (t.locale ?? B(), ce(e))), H = (e) => `${e?.count} stops`, U = ((e, t = {}) => (t.locale ?? B(), H(e))), le = (e) => `via ${e?.places}`, ue = ((e, t = {}) => (t.locale ?? B(), le(e))), W = () => "Compare", G = ((e = {}, t = {}) => (t.locale ?? B(), W(e))), K = (e) => `Rated ${e?.value} out of ${e?.max}`, q = ((e, t = {}) => (t.locale ?? B(), K(e))), J = (e) => `Rated ${e?.value} out of ${e?.max}, ${e?.count} reviews`, Y = ((e, t = {}) => (t.locale ?? B(), J(e))), de = () => "Top pick", fe = ((e = {}, t = {}) => (t.locale ?? B(), de(e))), pe = (e) => `Was ${e?.price}`, me = ((e, t = {}) => (t.locale ?? B(), pe(e))), he = i("<svg viewBox=\"0 0 12 12\" aria-hidden=\"true\" class=\"svelte-1ksbd0d\"><path d=\"M6 .9 7.5 4.1l3.5.4-2.6 2.4.7 3.5L6 8.6 2.9 10.4l.7-3.5L1 4.5l3.5-.4z\"></path></svg>");
function X(e, t) {
	let n = E(t, "size", 3, 12);
	var r = he();
	C(() => {
		y(r, "width", n()), y(r, "height", n());
	}), a(e, r);
}
// upstream/src/features/work/components/objects/Stars.svelte
var ge = m("<span class=\"count svelte-da6cs6\" aria-hidden=\"true\"> </span>"), _e = m("<span class=\"rating svelte-da6cs6\" role=\"img\"><span class=\"row svelte-da6cs6\" aria-hidden=\"true\"><span class=\"track svelte-da6cs6\"></span> <span class=\"fill svelte-da6cs6\"><span class=\"track svelte-da6cs6\"></span></span></span> <span class=\"value svelte-da6cs6\" aria-hidden=\"true\"> </span> <!></span>");
function ve(n, r) {
	c(r, !0);
	let i = E(r, "size", 3, 12), o = t(() => Math.min(1, Math.max(0, r.rating.value / r.rating.max))), u = t(() => new Intl.NumberFormat(void 0, { maximumFractionDigits: 2 }).format(r.rating.value)), d = t(() => r.rating.count ? new Intl.NumberFormat(void 0).format(r.rating.count) : ""), f = t(() => D(d) ? Y({
		value: D(u),
		max: r.rating.max,
		count: D(d)
	}) : q({
		value: D(u),
		max: r.rating.max
	}));
	var p = _e(), m = w(p), h = w(m);
	l(h, 20, () => [
		0,
		1,
		2,
		3,
		4
	], (e) => e, (e, t) => {
		X(e, { get size() {
			return i();
		} });
	}), A(h);
	var g = b(h, 2);
	let _;
	var v = w(g);
	l(v, 20, () => [
		0,
		1,
		2,
		3,
		4
	], (e) => e, (e, t) => {
		X(e, { get size() {
			return i();
		} });
	}), A(v), A(g), A(m);
	var S = b(m, 2), ee = w(S, !0);
	A(S);
	var T = b(S, 2), O = (t) => {
		var n = ge(), r = w(n);
		A(n), C(() => e(r, `(${D(d) ?? ""})`)), a(t, n);
	};
	s(T, (e) => {
		D(d) && e(O);
	}), A(p), C(() => {
		y(p, "aria-label", D(f)), _ = k(g, "", _, { "inline-size": `${D(o) * 100}%` }), e(ee, D(u));
	}), a(n, p), x();
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
var we = m("<button type=\"button\" class=\"poster-open nodrag nopan svelte-1f1lvve\"></button>"), Te = m("<span class=\"length svelte-1f1lvve\"> </span>"), Ee = m("<span class=\"play svelte-1f1lvve\" aria-hidden=\"true\"><!></span><!>", 1), De = m("<span class=\"badge svelte-1f1lvve\"><!> </span>"), Oe = m("<div><!> <canvas class=\"svelte-1f1lvve\"></canvas> <!> <!></div>"), ke = m("<div><img alt=\"\" loading=\"lazy\" decoding=\"async\" referrerpolicy=\"no-referrer\" draggable=\"false\" class=\"svelte-1f1lvve\"/> <!></div>"), Ae = m("<span class=\"flag svelte-1f1lvve\"><!> </span>"), je = m("<a class=\"nodrag svelte-1f1lvve\"> </a>"), Me = m("<p class=\"subtitle svelte-1f1lvve\"> </p>"), Ne = m("<span> </span>"), Pe = m("<p class=\"meta svelte-1f1lvve\"><!> <!></p>"), Fe = m("<div class=\"svelte-1f1lvve\"><dt class=\"svelte-1f1lvve\"> </dt> <dd class=\"svelte-1f1lvve\"><!><!></dd></div>"), Ie = m("<dl class=\"facts svelte-1f1lvve\"></dl>"), Le = m("<p class=\"why svelte-1f1lvve\"> </p>"), Re = m("<li class=\"svelte-1f1lvve\"> </li>"), ze = m("<ul class=\"tags svelte-1f1lvve\"></ul>"), Be = m("<span class=\"period svelte-1f1lvve\"> </span>"), Ve = m("<s class=\"was svelte-1f1lvve\"> </s>"), He = m("<p class=\"price svelte-1f1lvve\"><span class=\"figure svelte-1f1lvve\"> </span><!><!></p>"), Ue = m("<article><!> <div class=\"body svelte-1f1lvve\"><!> <header class=\"svelte-1f1lvve\"><!> <div class=\"names svelte-1f1lvve\"><h4><!></h4> <!></div></header> <!> <!> <!> <!> <!></div> <!></article>");
function We(r, i) {
	c(i, !0);
	let o = E(i, "video", 3, !1), d = E(i, "product", 3, !1), p = E(i, "actions", 19, () => ({})), m = t(() => o() && !!i.pick.url && !!ie(i.pick.url)), j = (e) => Number(e.replace(/[^\d.]/gu, "")) || 0, N = t(() => re(i.pick.price?.display ?? "")), P = t(() => {
		if (!i.pick.price) return null;
		if (i.pick.price.was) return {
			value: i.pick.price.was,
			fact: null
		};
		let e = i.pick.price.amount ?? j(D(N)), t = i.pick.facts.find((t) => /^(original|was|regular|usual|list|before)\b/iu.test(t.label.trim()) && j(t.value) > e && e > 0);
		return t ? {
			value: t.value,
			fact: t
		} : null;
	}), F = t(() => Ce(i.pick)), I = t(() => D(F).facts.filter((e) => e !== D(P)?.fact)), se = t(() => i.pick.recommended ? i.pick.tags.filter((e) => !/^(recommended|top pick)$/iu.test(e.trim())) : i.pick.tags), R = _(null), z = S(L), B = t(() => i.pick.imageRegion ? 1600 : z?.far ? 240 : 640), ce = t(() => !!i.pick.picture && D(R) === i.pick.picture.src), V = t(() => i.pick.picture && !D(ce) ? i.pick.picture : null), H = _(0), U = t(() => D(V) ? null : i.pick.remote?.[D(H)] ?? null), le = t(() => !D(V) && i.pick.logo && M(i.pick.logo) ? i.pick.logo : null), ue = t(() => {
		let e = D(N).search(/\s*(\/|per\b)/u);
		return e > 0 ? {
			figure: D(N).slice(0, e),
			period: D(N).slice(e)
		} : {
			figure: D(N),
			period: ""
		};
	}), W = t(() => i.pick.name.split(/\s+/u).reduce((e, t) => t.length > e.length ? t : e, "")), G = t(() => Math.max(6, D(W).length)), K = _(0), q = t(() => !!D(K) && D(G) * .64 * 12 > D(K) && D(W)[0] === D(W)[0]?.toLowerCase());
	var J = Ue();
	let Y;
	var de = w(J), pe = (r) => {
		var c = Oe();
		let l, u;
		var h = w(c), _ = (e) => {
			var t = we();
			C(() => y(t, "aria-label", "Watch " + i.pick.name)), g("click", t, (e) => {
				e.stopPropagation(), p().link?.(i.pick.url);
			}), a(e, t);
		};
		s(h, (e) => {
			o() && i.pick.url && p().link && e(_);
		});
		var v = b(h, 2);
		n(v, (e, t) => oe?.(e, t), () => ({
			url: D(V).src,
			width: D(B),
			onmissing: () => O(R, i.pick.picture?.src ?? null, !0)
		}));
		var x = b(v, 2), S = (n) => {
			var r = Ee(), o = ee(r), c = w(o);
			{
				let e = t(() => D(m) ? 52 : 44);
				ae(c, {
					get size() {
						return D(e);
					},
					get youtube() {
						return D(m);
					}
				});
			}
			A(o);
			var l = b(o), u = (t) => {
				var n = Te(), r = w(n, !0);
				A(n), C(() => e(r, i.pick.duration)), a(t, n);
			};
			s(l, (e) => {
				i.pick.duration && e(u);
			}), a(n, r);
		};
		s(x, (e) => {
			o() && e(S);
		});
		var T = b(x, 2), E = (t) => {
			var n = De(), r = w(n);
			X(r, { size: 11 });
			var i = b(r, 1, !0);
			A(n), C((t) => e(i, t), [() => fe()]), a(t, n);
		};
		s(T, (e) => {
			i.pick.recommended && e(E);
		}), A(c), C(() => {
			l = f(c, 1, "photo svelte-1f1lvve", null, l, {
				video: o(),
				product: d(),
				region: !!i.pick.imageRegion
			}), u = k(c, "", u, {
				"--region-w": i.pick.imageRegion?.width || 1,
				"--region-h": i.pick.imageRegion?.height || 1,
				"--region-x": i.pick.imageRegion?.x || 0,
				"--region-y": i.pick.imageRegion?.y || 0
			}), y(v, "data-picture", D(V).src);
		}), a(r, c);
	}, he = (t) => {
		var n = ke();
		let r;
		var c = w(n), l = b(c, 2), p = (t) => {
			var n = De(), r = w(n);
			X(r, { size: 11 });
			var i = b(r, 1, !0);
			A(n), C((t) => e(i, t), [() => fe()]), a(t, n);
		};
		s(l, (e) => {
			i.pick.recommended && e(p);
		}), A(n), C(() => {
			r = f(n, 1, "photo remote svelte-1f1lvve", null, r, {
				video: o(),
				product: d()
			}), y(c, "src", D(U));
		}), h("error", c, () => O(H, D(H) + 1)), u(c), a(t, n);
	};
	s(de, (e) => {
		D(V) ? e(pe) : D(U) && e(he, 1);
	});
	var ge = b(de, 2), _e = w(ge), ye = (t) => {
		var n = Ae(), r = w(n);
		X(r, { size: 11 });
		var i = b(r, 1, !0);
		A(n), C((t) => e(i, t), [() => fe()]), a(t, n);
	};
	s(_e, (e) => {
		!D(V) && !D(U) && i.pick.recommended && e(ye);
	});
	var Z = b(_e, 2), be = w(Z), xe = (e) => {
		te(e, {
			get address() {
				return D(le);
			},
			size: 20
		});
	};
	s(be, (e) => {
		D(le) && e(xe);
	});
	var Q = b(be, 2), $ = w(Q);
	let Se, We;
	var Ge = w($), Ke = (t) => {
		var n = je(), r = w(n, !0);
		A(n), C(() => {
			y(n, "href", i.pick.url), e(r, i.pick.name);
		}), g("click", n, (e) => {
			p().link && (e.preventDefault(), p().link(i.pick.url));
		}), a(t, n);
	}, qe = (t) => {
		var n = T();
		C(() => e(n, i.pick.name)), a(t, n);
	};
	s(Ge, (e) => {
		i.pick.url ? e(Ke) : e(qe, -1);
	}), A($);
	var Je = b($, 2), Ye = (t) => {
		var n = Me(), r = w(n, !0);
		A(n), C(() => e(r, i.pick.subtitle)), a(t, n);
	};
	s(Je, (e) => {
		i.pick.subtitle && e(Ye);
	}), A(Q), A(Z);
	var Xe = b(Z, 2), Ze = (t) => {
		var n = Pe(), r = w(n), c = (e) => {
			ve(e, { get rating() {
				return D(F).rating;
			} });
		};
		s(r, (e) => {
			D(F).rating && e(c);
		});
		var l = b(r, 2), u = (t) => {
			var n = Ne(), r = w(n, !0);
			A(n), C(() => e(r, i.pick.duration)), a(t, n);
		};
		s(l, (e) => {
			o() && i.pick.duration && !D(V) && e(u);
		}), A(n), a(t, n);
	};
	s(Xe, (e) => {
		(D(F).rating || o() && i.pick.duration && !D(V)) && e(Ze);
	});
	var Qe = b(Xe, 2), $e = (n) => {
		var r = Ie();
		l(r, 21, () => D(I), (e) => e.label, (n, r) => {
			var i = Fe(), o = w(i), c = w(o, !0);
			A(o);
			var l = b(o, 2), u = w(l), d = (e) => {
				ne(e, {
					get value() {
						return D(r).kind;
					},
					size: 14
				});
			};
			s(u, (e) => {
				(D(r).kind === "yes" || D(r).kind === "no" || D(r).kind === "partial") && e(d);
			});
			var p = b(u), m = (t) => {
				var n = Ne();
				let i;
				var o = w(n, !0);
				A(n), C(() => {
					i = f(n, 1, "value svelte-1f1lvve", null, i, { quiet: D(r).kind === "no" }), y(n, "title", D(r).value), e(o, D(r).value);
				}), a(t, n);
			}, h = t(() => !/^(yes|no)$/iu.test(D(r).value.trim()));
			s(p, (e) => {
				D(h) && e(m);
			}), A(l), A(i), C(() => e(c, D(r).label)), a(n, i);
		}), A(r), a(n, r);
	};
	s(Qe, (e) => {
		D(I).length && e($e);
	});
	var et = b(Qe, 2), tt = (t) => {
		var n = Le(), r = w(n, !0);
		A(n), C(() => e(r, i.pick.why)), a(t, n);
	};
	s(et, (e) => {
		i.pick.why && e(tt);
	});
	var nt = b(et, 2), rt = (t) => {
		var n = ze();
		l(n, 20, () => D(se), (e) => e, (t, n) => {
			var r = Re(), i = w(r, !0);
			A(r), C(() => e(i, n)), a(t, r);
		}), A(n), a(t, n);
	};
	s(nt, (e) => {
		D(se).length && e(rt);
	});
	var it = b(nt, 2), at = (t) => {
		var n = He(), r = w(n), i = w(r, !0);
		A(r);
		var o = b(r), c = (t) => {
			var n = Be(), r = w(n, !0);
			A(n), C(() => e(r, D(ue).period)), a(t, n);
		};
		s(o, (e) => {
			D(ue).period && e(c);
		});
		var l = b(o), u = (t) => {
			var n = Ve(), r = w(n, !0);
			A(n), C((t) => {
				y(n, "aria-label", t), e(r, D(P).value);
			}, [() => me({ price: D(P).value })]), a(t, n);
		};
		s(l, (e) => {
			D(P) && e(u);
		}), A(n), C(() => e(i, D(ue).figure)), a(t, n);
	};
	s(it, (e) => {
		i.pick.price && e(at);
	}), A(ge);
	var ot = b(ge, 2);
	s(ot, (e) => {}), A(J), C(() => {
		Y = f(J, 1, "pick svelte-1f1lvve", null, Y, {
			recommended: i.pick.recommended,
			chosen: i.pick.chosen,
			pictured: !!D(V) || !!D(U)
		}), y($, "title", i.pick.name), Se = f($, 1, "svelte-1f1lvve", null, Se, { hyphenate: D(q) }), We = k($, "", We, { "--longest": D(G) });
	}), v(Q, "clientWidth", (e) => O(K, e)), a(r, J), x();
}
o(["click"]);
// upstream/src/features/work/components/objects/FlightCard.svelte
var Ge = m("<span class=\"flag svelte-16l3ooh\"><!> </span>"), Ke = m("<span class=\"price svelte-16l3ooh\"> </span>"), qe = m("<p class=\"when svelte-16l3ooh\"> </p>"), Je = m("<span class=\"place svelte-16l3ooh\"> </span>"), Ye = m("<span class=\"duration svelte-16l3ooh\"> </span>"), Xe = m("<span class=\"stop svelte-16l3ooh\"></span>"), Ze = m("<span> </span>"), Qe = m("<li class=\"svelte-16l3ooh\"><!><!></li>"), $e = m("<ul class=\"facts svelte-16l3ooh\"></ul>"), et = m("<p class=\"why svelte-16l3ooh\"> </p>"), tt = m("<!> ", 1), nt = m("<button type=\"button\" class=\"nodrag nopan svelte-16l3ooh\"><!></button>"), rt = m("<button type=\"button\" class=\"nodrag nopan svelte-16l3ooh\"> </button>"), it = m("<div class=\"actions svelte-16l3ooh\"><!> <!></div>"), at = m("<article><header class=\"svelte-16l3ooh\"><!> <span class=\"carrier svelte-16l3ooh\"> </span> <!> <!></header> <!> <div class=\"route svelte-16l3ooh\"><div class=\"end svelte-16l3ooh\"><span class=\"time svelte-16l3ooh\"> </span> <!></div> <div class=\"way svelte-16l3ooh\"><!> <span class=\"line svelte-16l3ooh\" aria-hidden=\"true\"></span> <span> </span></div> <div class=\"end arrive svelte-16l3ooh\"><span class=\"time svelte-16l3ooh\"> </span> <!></div></div> <!> <!> <!></article>");
function ot(n, r) {
	c(r, !0);
	let i = E(r, "actions", 19, () => ({})), o = t(() => r.pick.route), u = t(() => D(o).carrierHost ?? r.pick.logo), d = t(() => D(o).stops === 0 ? V() : D(o).via?.length ? ue({ places: D(o).via.join(", ") }) : U({ count: D(o).stops }));
	var p = at();
	let m;
	var h = w(p), _ = w(h), v = (e) => {
		te(e, {
			get address() {
				return D(u);
			},
			size: 20
		});
	}, y = t(() => D(u) && M(D(u)));
	s(_, (e) => {
		D(y) && e(v);
	});
	var S = b(_, 2), O = w(S, !0);
	A(S);
	var N = b(S, 2), re = (t) => {
		var n = Ge(), r = w(n);
		X(r, { size: 11 });
		var i = b(r, 1, !0);
		A(n), C((t) => e(i, t), [() => fe()]), a(t, n);
	};
	s(N, (e) => {
		r.pick.recommended && e(re);
	});
	var ie = b(N, 2), ae = (t) => {
		var n = Ke(), i = w(n, !0);
		A(n), C(() => e(i, r.pick.price.display)), a(t, n);
	};
	s(ie, (e) => {
		r.pick.price && e(ae);
	}), A(h);
	var oe = b(h, 2), L = (t) => {
		var n = qe(), i = w(n, !0);
		A(n), C(() => e(i, r.pick.when)), a(t, n);
	};
	s(oe, (e) => {
		r.pick.when && e(L);
	});
	var R = b(oe, 2), z = w(R), B = w(z), ce = w(B, !0);
	A(B);
	var H = b(B, 2), le = (t) => {
		var n = Je(), r = w(n, !0);
		A(n), C(() => e(r, D(o).from)), a(t, n);
	};
	s(H, (e) => {
		D(o).depart && e(le);
	}), A(z);
	var W = b(z, 2), G = w(W), K = (t) => {
		var n = Ye(), r = w(n, !0);
		A(n), C(() => e(r, D(o).duration)), a(t, n);
	};
	s(G, (e) => {
		D(o).duration && e(K);
	});
	var q = b(G, 2);
	l(q, 20, () => Array.from({ length: D(o).stops }, (e, t) => t), (e) => e, (e, t) => {
		var n = Xe();
		let r;
		C(() => r = k(n, "", r, { "inset-inline-start": `${(t + 1) / (D(o).stops + 1) * 100}%` })), a(e, n);
	}), A(q);
	var J = b(q, 2);
	let Y;
	var de = w(J, !0);
	A(J), A(W);
	var pe = b(W, 2), me = w(pe), he = w(me, !0);
	A(me);
	var ge = b(me, 2), _e = (t) => {
		var n = Je(), r = w(n, !0);
		A(n), C(() => e(r, D(o).to)), a(t, n);
	};
	s(ge, (e) => {
		D(o).arrive && e(_e);
	}), A(pe), A(R);
	var ve = b(R, 2), ye = (n) => {
		var i = $e();
		l(i, 21, () => r.pick.facts, (e) => e.label, (n, r) => {
			var i = Qe(), o = w(i), c = (e) => {
				ne(e, {
					get value() {
						return D(r).kind;
					},
					size: 14
				});
			};
			s(o, (e) => {
				(D(r).kind === "yes" || D(r).kind === "no" || D(r).kind === "partial") && e(c);
			});
			var l = b(o), u = (t) => {
				var n = Ze();
				let i;
				var o = w(n, !0);
				A(n), C(() => {
					i = f(n, 1, "svelte-16l3ooh", null, i, { quiet: D(r).kind === "no" }), e(o, D(r).value);
				}), a(t, n);
			}, d = t(() => !/^(yes|no)$/iu.test(D(r).value.trim()));
			s(l, (e) => {
				D(d) && e(u);
			}), A(i), a(n, i);
		}), A(i), a(n, i);
	};
	s(ve, (e) => {
		r.pick.facts.length && e(ye);
	});
	var Z = b(ve, 2), be = (t) => {
		var n = et(), i = w(n, !0);
		A(n), C(() => e(i, r.pick.why)), a(t, n);
	};
	s(Z, (e) => {
		r.pick.why && e(be);
	});
	var xe = b(Z, 2), Q = (t) => {
		var n = it(), o = w(n), c = (t) => {
			var n = nt(), o = w(n), c = (t) => {
				var n = tt(), r = ee(n);
				j(r, {
					get icon() {
						return se;
					},
					size: 13
				});
				var i = b(r, 1, !0);
				C((t) => e(i, t), [() => F()]), a(t, n);
			}, l = (t) => {
				var n = T();
				C((t) => e(n, t), [() => I()]), a(t, n);
			};
			s(o, (e) => {
				r.pick.chosen ? e(c) : e(l, -1);
			}), A(n), g("click", n, () => i().choose?.(r.pick.element, !r.pick.chosen)), a(t, n);
		};
		s(o, (e) => {
			i().choose && r.pick.element && e(c);
		});
		var l = b(o, 2), u = (t) => {
			var n = rt(), o = w(n, !0);
			A(n), C((t) => e(o, t), [() => P()]), g("click", n, () => i().ask?.(r.pick.name)), a(t, n);
		};
		s(l, (e) => {
			i().ask && e(u);
		}), A(n), a(t, n);
	};
	s(xe, (e) => {
		(i().choose || i().ask) && e(Q);
	}), A(p), C(() => {
		m = f(p, 1, "flight svelte-16l3ooh", null, m, {
			recommended: r.pick.recommended,
			chosen: r.pick.chosen
		}), e(O, D(o).carrier ?? r.pick.name), e(ce, D(o).depart ?? D(o).from), Y = f(J, 1, "stops svelte-16l3ooh", null, Y, { direct: D(o).stops === 0 }), e(de, D(d)), e(he, D(o).arrive ?? D(o).to);
	}), a(n, p), x();
}
o(["click"]);
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
var lt = m("<button type=\"button\" class=\"compare nodrag nopan svelte-1yroi37\"> </button>"), ut = m("<header class=\"svelte-1yroi37\"><!> <!></header>"), dt = m("<button type=\"button\" class=\"from nodrag nopan svelte-1yroi37\"><!></button><span class=\"stem svelte-1yroi37\" aria-hidden=\"true\"></span>", 1), ft = m("<span class=\"from none svelte-1yroi37\" aria-hidden=\"true\"></span><span class=\"stem none svelte-1yroi37\" aria-hidden=\"true\"></span>", 1), pt = m("<div role=\"group\"><!> <!></div>"), mt = m("<div class=\"compare-sheet svelte-1yroi37\"><!></div>"), ht = m("<section><!> <div></div> <!></section>");
function gt(n, i) {
	c(i, !0);
	let o = {
		pictured: 200,
		plain: 220,
		widest: 248,
		gap: 16
	}, u = E(i, "actions", 19, () => ({})), m = E(i, "centre", 3, !1), S = _(0), T = t(() => {
		let e = i.object.items.length;
		if (!e) return 1;
		let t = D(te) ? o.pictured : o.plain, n = D(S) ? Math.max(1, Math.floor((D(S) + o.gap) / (t + o.gap))) : Math.min(e, 4), r = Math.ceil(e / Math.min(n, e));
		return Math.ceil(e / r);
	}), j = (e) => !!e.route, M = t(() => i.object.facet === "flight" && i.object.items.every(j)), te = t(() => i.object.items.some((e) => e.picture)), ne = t(() => {
		if (D(M) || m() || !i.object.items.some((e) => e.from)) return !1;
		let e = i.object.items.map((e) => e.from?.page);
		return e.every((e) => e) && new Set(e).size === e.length;
	}), re = t(() => !!u().compare && !D(M) && ct(i.object)), P = _(null);
	var F = ht();
	let I, ie;
	var ae = w(F), oe = (t) => {
		var n = ut(), r = w(n), o = (e) => {
			R(e, { get text() {
				return i.object.title;
			} });
		};
		s(r, (e) => {
			i.object.title && e(o);
		});
		var c = b(r, 2), l = (t) => {
			var n = lt(), r = w(n, !0);
			A(n), C((t) => e(r, t), [() => G()]), g("click", n, () => u().compare?.(i.object.id)), a(t, n);
		};
		s(c, (e) => {
			D(re) && e(l);
		}), A(n), a(t, n);
	};
	s(ae, (e) => {
		(i.object.title || D(re)) && e(oe);
	});
	var L = b(ae, 2);
	let se;
	l(L, 21, () => i.object.items, r, (e, n, r) => {
		var o = p(), c = ee(o), l = (e) => {
			ot(e, {
				get pick() {
					return D(n);
				},
				get actions() {
					return u();
				}
			});
		}, m = t(() => D(M) && j(D(n))), _ = (e) => {
			var o = pt();
			let c;
			var l = w(o), p = (e) => {
				let r = t(() => D(n).from);
				var i = dt(), o = ee(i), s = w(o);
				z(s, {
					get url() {
						return D(r).url;
					},
					get title() {
						return D(r).title;
					},
					get frame() {
						return D(r).frame;
					}
				}), A(o), d(), C(() => y(o, "aria-label", D(r).title || D(r).url)), g("click", o, (e) => {
					e.stopPropagation(), u().link?.(D(r).url);
				}), a(e, i);
			}, m = (e) => {
				var t = ft();
				d(), a(e, t);
			};
			s(l, (e) => {
				D(n).from ? e(p) : e(m, -1);
			});
			var _ = b(l, 2);
			{
				let e = t(() => i.object.facet === "video"), a = t(() => i.object.facet === "product"), o = t(() => u().open ? () => u().open?.(i.object.id, r) : void 0);
				We(_, {
					get pick() {
						return D(n);
					},
					get actions() {
						return u();
					},
					get video() {
						return D(e);
					},
					get product() {
						return D(a);
					},
					get onopen() {
						return D(o);
					}
				});
			}
			A(o), C(() => c = f(o, 1, "cell svelte-1yroi37", null, c, { lit: D(P) === r })), h("pointerenter", o, () => O(P, r, !0)), h("pointerleave", o, () => D(P) === r && O(P, null)), a(e, o);
		}, v = (e) => {
			{
				let a = t(() => i.object.facet === "video"), o = t(() => i.object.facet === "product"), s = t(() => u().open ? () => u().open?.(i.object.id, r) : void 0);
				We(e, {
					get pick() {
						return D(n);
					},
					get actions() {
						return u();
					},
					get video() {
						return D(a);
					},
					get product() {
						return D(o);
					},
					get onopen() {
						return D(s);
					}
				});
			}
		};
		s(c, (e) => {
			D(m) ? e(l) : D(ne) ? e(_, 1) : e(v, -1);
		}), a(e, o);
	}), A(L);
	var B = b(L, 2), ce = (e) => {
		var n = mt(), r = w(n);
		{
			let e = t(() => st(i.object));
			N(r, {
				get object() {
					return D(e);
				},
				get actions() {
					return u();
				},
				get rows() {
					return i.object.items.length;
				}
			});
		}
		A(n), a(e, n);
	};
	s(B, (e) => {
		m() && i.object.items.length > 1 && !D(M) && e(ce);
	}), A(F), C(() => {
		I = f(F, 1, "picks svelte-1yroi37", null, I, {
			flights: D(M),
			pictured: D(te)
		}), y(F, "aria-label", i.object.title), ie = k(F, "", ie, {
			"--across": D(T),
			"--card-widest": `${o.widest}px`
		}), se = f(L, 1, "set svelte-1yroi37", null, se, { sourced: D(ne) });
	}), v(F, "clientWidth", (e) => O(S, e)), a(n, F), x();
}
o(["click"]);
export { gt as default };
