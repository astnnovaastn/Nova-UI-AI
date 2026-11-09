import "./disclose-version-DFvUDwEH.js";
import { A as e, At as t, B as n, C as r, Ct as i, F as a, G as o, H as s, L as c, M as l, R as u, St as d, U as f, W as p, Y as m, at as h, bt as g, c as _, ft as v, k as y, kt as b, m as x, mt as S, ot as C, r as w, st as T, tt as E, ut as D, v as ee, y as O, z as k } from "./index-client-BSGo5gVb.js";
import { t as te } from "./Icon-BWISRU-8.js";
import { n as ne, t as A } from "./Mark-DBYTxnH7.js";
import j, { t as re } from "./Sheet-CqXqAZeV.js";
import { t as ie } from "./Tick02Icon-COqFGcdx.js";
import { a as M, c as N, o as P, s as ae } from "./text-DVq3CuCv.js";
import { a as oe, o as se } from "./link-media-2GFJlIGx.js";
import { t as ce } from "./work_env_open-CZM6S6RQ.js";
import { t as F } from "./frame-thumbs-DqxfUL66.js";
import { y as le } from "./HostGlyph-BX4wqFXI.js";
import { t as I } from "./Title-3U-zV-ZX.js";
import "./diagram-BHIHFDf6.js";
import { t as L } from "./PageFace-DOQBhpid.js";
import { t as R } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_flight_direct.js
var z = () => "Direct", ue = ((e = {}, t = {}) => (t.locale ?? R(), z(e))), de = (e) => `${e?.count} stops`, fe = ((e, t = {}) => (t.locale ?? R(), de(e))), pe = (e) => `via ${e?.places}`, B = ((e, t = {}) => (t.locale ?? R(), pe(e))), V = () => "Compare", H = ((e = {}, t = {}) => (t.locale ?? R(), V(e))), U = (e) => `Rated ${e?.value} out of ${e?.max}`, W = ((e, t = {}) => (t.locale ?? R(), U(e))), G = (e) => `Rated ${e?.value} out of ${e?.max}, ${e?.count} reviews`, me = ((e, t = {}) => (t.locale ?? R(), G(e))), K = () => "Top pick", he = ((e = {}, t = {}) => (t.locale ?? R(), K(e))), q = (e) => `Was ${e?.price}`, ge = ((e, t = {}) => (t.locale ?? R(), q(e))), _e = n("<svg viewBox=\"0 0 12 12\" aria-hidden=\"true\" class=\"svelte-1ksbd0d\"><path d=\"M6 .9 7.5 4.1l3.5.4-2.6 2.4.7 3.5L6 8.6 2.9 10.4l.7-3.5L1 4.5l3.5-.4z\"></path></svg>");
function J(e, t) {
	let n = w(t, "size", 3, 12);
	var r = _e();
	E(() => {
		x(r, "width", n()), x(r, "height", n());
	}), c(e, r);
}
// upstream/src/features/work/components/objects/Stars.svelte
var ve = k("<span class=\"count svelte-da6cs6\" aria-hidden=\"true\"> </span>"), Y = k("<span class=\"rating svelte-da6cs6\" role=\"img\"><span class=\"row svelte-da6cs6\" aria-hidden=\"true\"><span class=\"track svelte-da6cs6\"></span> <span class=\"fill svelte-da6cs6\"><span class=\"track svelte-da6cs6\"></span></span></span> <span class=\"value svelte-da6cs6\" aria-hidden=\"true\"> </span> <!></span>");
function ye(e, n) {
	i(n, !0);
	let r = w(n, "size", 3, 12), o = S(() => Math.min(1, Math.max(0, n.rating.value / n.rating.max))), s = S(() => new Intl.NumberFormat(void 0, { maximumFractionDigits: 2 }).format(n.rating.value)), u = S(() => n.rating.count ? new Intl.NumberFormat(void 0).format(n.rating.count) : ""), f = S(() => m(u) ? me({
		value: m(s),
		max: n.rating.max,
		count: m(u)
	}) : W({
		value: m(s),
		max: n.rating.max
	}));
	var p = Y(), g = h(p), _ = h(g);
	y(_, 20, () => [
		0,
		1,
		2,
		3,
		4
	], (e) => e, (e, t) => {
		J(e, { get size() {
			return r();
		} });
	}), t(_);
	var v = T(_, 2);
	let b;
	var C = h(v);
	y(C, 20, () => [
		0,
		1,
		2,
		3,
		4
	], (e) => e, (e, t) => {
		J(e, { get size() {
			return r();
		} });
	}), t(C), t(v), t(g);
	var D = T(g, 2), O = h(D, !0);
	t(D);
	var k = T(D, 2), te = (e) => {
		var n = ve(), r = h(n);
		t(n), E(() => a(r, `(${m(u) ?? ""})`)), c(e, n);
	};
	l(k, (e) => {
		m(u) && e(te);
	}), t(p), E(() => {
		x(p, "aria-label", m(f)), b = ee(v, "", b, { "inline-size": `${m(o) * 100}%` }), a(O, m(s));
	}), c(e, p), d();
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
var we = k("<span class=\"length svelte-1f1lvve\"> </span>"), Te = k("<span class=\"play svelte-1f1lvve\" aria-hidden=\"true\"><!></span><!>", 1), Ee = k("<span class=\"badge svelte-1f1lvve\"><!> </span>"), De = k("<div><canvas class=\"svelte-1f1lvve\"></canvas> <!> <!></div>"), Oe = k("<span class=\"flag svelte-1f1lvve\"><!> </span>"), ke = k("<a class=\"nodrag svelte-1f1lvve\"> </a>"), Ae = k("<p class=\"subtitle svelte-1f1lvve\"> </p>"), je = k("<span> </span>"), Me = k("<p class=\"meta svelte-1f1lvve\"><!> <!></p>"), Ne = k("<div class=\"svelte-1f1lvve\"><dt class=\"svelte-1f1lvve\"> </dt> <dd class=\"svelte-1f1lvve\"><!><!></dd></div>"), Pe = k("<dl class=\"facts svelte-1f1lvve\"></dl>"), Fe = k("<p class=\"why svelte-1f1lvve\"> </p>"), Ie = k("<li class=\"svelte-1f1lvve\"> </li>"), Le = k("<ul class=\"tags svelte-1f1lvve\"></ul>"), Re = k("<span class=\"period svelte-1f1lvve\"> </span>"), ze = k("<s class=\"was svelte-1f1lvve\"> </s>"), Be = k("<p class=\"price svelte-1f1lvve\"><span class=\"figure svelte-1f1lvve\"> </span><!><!></p>"), Ve = k("<!> ", 1), He = k("<button type=\"button\"><!></button>"), Ue = k("<button type=\"button\" class=\"nodrag nopan svelte-1f1lvve\"> </button>"), We = k("<div class=\"actions svelte-1f1lvve\"><!> <!> <!></div>"), Ge = k("<article><!> <div class=\"body svelte-1f1lvve\"><!> <header class=\"svelte-1f1lvve\"><!> <div class=\"names svelte-1f1lvve\"><h4><!></h4> <!></div></header> <!> <!> <!> <!> <!></div> <!></article>");
function Ke(e, n) {
	i(n, !0);
	let o = w(n, "video", 3, !1), u = w(n, "product", 3, !1), f = w(n, "actions", 19, () => ({})), b = S(() => o() && !!n.pick.url && !!oe(n.pick.url)), k = (e) => Number(e.replace(/[^\d.]/gu, "")) || 0, j = S(() => M(n.pick.price?.display ?? "")), I = S(() => {
		if (!n.pick.price) return null;
		if (n.pick.price.was) return {
			value: n.pick.price.was,
			fact: null
		};
		let e = n.pick.price.amount ?? k(m(j)), t = n.pick.facts.find((t) => /^(original|was|regular|usual|list|before)\b/iu.test(t.label.trim()) && k(t.value) > e && e > 0);
		return t ? {
			value: t.value,
			fact: t
		} : null;
	}), L = S(() => Ce(n.pick)), R = S(() => m(L).facts.filter((e) => e !== m(I)?.fact)), z = S(() => n.pick.recommended ? n.pick.tags.filter((e) => !/^(recommended|top pick)$/iu.test(e.trim())) : n.pick.tags), ue = v(null), de = g(le), fe = S(() => de?.far ? 240 : 640), pe = S(() => !!n.pick.picture && m(ue) === n.pick.picture.src), B = S(() => n.pick.picture && !m(pe) ? n.pick.picture : null), V = S(() => !m(B) && n.pick.logo && ne(n.pick.logo) ? n.pick.logo : null), H = S(() => {
		let e = m(j).search(/\s*(\/|per\b)/u);
		return e > 0 ? {
			figure: m(j).slice(0, e),
			period: m(j).slice(e)
		} : {
			figure: m(j),
			period: ""
		};
	}), U = S(() => n.pick.name.split(/\s+/u).reduce((e, t) => t.length > e.length ? t : e, "")), W = S(() => Math.max(6, m(U).length)), G = v(0), me = S(() => !!m(G) && m(W) * .64 * 12 > m(G) && m(U)[0] === m(U)[0]?.toLowerCase());
	var K = Ge();
	let q;
	var _e = h(K), ve = (e) => {
		var i = De();
		let s;
		var d = h(i);
		r(d, (e, t) => F?.(e, t), () => ({
			url: m(B).src,
			width: m(fe),
			onmissing: () => D(ue, n.pick.picture?.src ?? null, !0)
		}));
		var f = T(d, 2), p = (e) => {
			var r = Te(), i = C(r), o = h(i);
			{
				let e = S(() => m(b) ? 52 : 44);
				se(o, {
					get size() {
						return m(e);
					},
					get youtube() {
						return m(b);
					}
				});
			}
			t(i);
			var s = T(i), u = (e) => {
				var r = we(), i = h(r, !0);
				t(r), E(() => a(i, n.pick.duration)), c(e, r);
			};
			l(s, (e) => {
				n.pick.duration && e(u);
			}), c(e, r);
		};
		l(f, (e) => {
			o() && e(p);
		});
		var g = T(f, 2), _ = (e) => {
			var n = Ee(), r = h(n);
			J(r, { size: 11 });
			var i = T(r, 1, !0);
			t(n), E((e) => a(i, e), [() => he()]), c(e, n);
		};
		l(g, (e) => {
			n.pick.recommended && e(_);
		}), t(i), E(() => {
			s = O(i, 1, "photo svelte-1f1lvve", null, s, {
				video: o(),
				product: u()
			}), x(d, "data-picture", m(B).src);
		}), c(e, i);
	};
	l(_e, (e) => {
		m(B) && e(ve);
	});
	var Y = T(_e, 2), be = h(Y), X = (e) => {
		var n = Oe(), r = h(n);
		J(r, { size: 11 });
		var i = T(r, 1, !0);
		t(n), E((e) => a(i, e), [() => he()]), c(e, n);
	};
	l(be, (e) => {
		!m(B) && n.pick.recommended && e(X);
	});
	var Z = T(be, 2), xe = h(Z), Se = (e) => {
		A(e, {
			get address() {
				return m(V);
			},
			size: 20
		});
	};
	l(xe, (e) => {
		m(V) && e(Se);
	});
	var Q = T(xe, 2), $ = h(Q);
	let Ke, qe;
	var Je = h($), Ye = (e) => {
		var r = ke(), i = h(r, !0);
		t(r), E(() => {
			x(r, "href", n.pick.url), a(i, n.pick.name);
		}), p("click", r, (e) => {
			f().link && (e.preventDefault(), f().link(n.pick.url));
		}), c(e, r);
	}, Xe = (e) => {
		var t = s();
		E(() => a(t, n.pick.name)), c(e, t);
	};
	l(Je, (e) => {
		n.pick.url ? e(Ye) : e(Xe, -1);
	}), t($);
	var Ze = T($, 2), Qe = (e) => {
		var r = Ae(), i = h(r, !0);
		t(r), E(() => a(i, n.pick.subtitle)), c(e, r);
	};
	l(Ze, (e) => {
		n.pick.subtitle && e(Qe);
	}), t(Q), t(Z);
	var $e = T(Z, 2), et = (e) => {
		var r = Me(), i = h(r), s = (e) => {
			ye(e, { get rating() {
				return m(L).rating;
			} });
		};
		l(i, (e) => {
			m(L).rating && e(s);
		});
		var u = T(i, 2), d = (e) => {
			var r = je(), i = h(r, !0);
			t(r), E(() => a(i, n.pick.duration)), c(e, r);
		};
		l(u, (e) => {
			o() && n.pick.duration && !m(B) && e(d);
		}), t(r), c(e, r);
	};
	l($e, (e) => {
		(m(L).rating || o() && n.pick.duration && !m(B)) && e(et);
	});
	var tt = T($e, 2), nt = (e) => {
		var n = Pe();
		y(n, 21, () => m(R), (e) => e.label, (e, n) => {
			var r = Ne(), i = h(r), o = h(i, !0);
			t(i);
			var s = T(i, 2), u = h(s), d = (e) => {
				re(e, {
					get value() {
						return m(n).kind;
					},
					size: 14
				});
			};
			l(u, (e) => {
				(m(n).kind === "yes" || m(n).kind === "no" || m(n).kind === "partial") && e(d);
			});
			var f = T(u), p = (e) => {
				var r = je();
				let i;
				var o = h(r, !0);
				t(r), E(() => {
					i = O(r, 1, "value svelte-1f1lvve", null, i, { quiet: m(n).kind === "no" }), x(r, "title", m(n).value), a(o, m(n).value);
				}), c(e, r);
			}, g = S(() => !/^(yes|no)$/iu.test(m(n).value.trim()));
			l(f, (e) => {
				m(g) && e(p);
			}), t(s), t(r), E(() => a(o, m(n).label)), c(e, r);
		}), t(n), c(e, n);
	};
	l(tt, (e) => {
		m(R).length && e(nt);
	});
	var rt = T(tt, 2), it = (e) => {
		var r = Fe(), i = h(r, !0);
		t(r), E(() => a(i, n.pick.why)), c(e, r);
	};
	l(rt, (e) => {
		n.pick.why && e(it);
	});
	var at = T(rt, 2), ot = (e) => {
		var n = Le();
		y(n, 20, () => m(z), (e) => e, (e, n) => {
			var r = Ie(), i = h(r, !0);
			t(r), E(() => a(i, n)), c(e, r);
		}), t(n), c(e, n);
	};
	l(at, (e) => {
		m(z).length && e(ot);
	});
	var st = T(at, 2), ct = (e) => {
		var n = Be(), r = h(n), i = h(r, !0);
		t(r);
		var o = T(r), s = (e) => {
			var n = Re(), r = h(n, !0);
			t(n), E(() => a(r, m(H).period)), c(e, n);
		};
		l(o, (e) => {
			m(H).period && e(s);
		});
		var u = T(o), d = (e) => {
			var n = ze(), r = h(n, !0);
			t(n), E((e) => {
				x(n, "aria-label", e), a(r, m(I).value);
			}, [() => ge({ price: m(I).value })]), c(e, n);
		};
		l(u, (e) => {
			m(I) && e(d);
		}), t(n), E(() => a(i, m(H).figure)), c(e, n);
	};
	l(st, (e) => {
		n.pick.price && e(ct);
	}), t(Y);
	var lt = T(Y, 2), ut = (e) => {
		var r = We(), i = h(r), o = (e) => {
			var r = He();
			let i;
			var o = h(r), u = (e) => {
				var t = Ve(), n = C(t);
				te(n, {
					get icon() {
						return ie;
					},
					size: 13
				});
				var r = T(n, 1, !0);
				E((e) => a(r, e), [() => P()]), c(e, t);
			}, d = (e) => {
				var t = s();
				E((e) => a(t, e), [() => ae()]), c(e, t);
			};
			l(o, (e) => {
				n.pick.chosen ? e(u) : e(d, -1);
			}), t(r), E(() => i = O(r, 1, "nodrag nopan svelte-1f1lvve", null, i, { on: n.pick.chosen })), p("click", r, () => f().choose?.(n.pick.element, !n.pick.chosen)), c(e, r);
		};
		l(i, (e) => {
			f().choose && n.pick.element && e(o);
		});
		var u = T(i, 2), d = (e) => {
			var r = Ue(), i = h(r, !0);
			t(r), E((e) => a(i, e), [() => N()]), p("click", r, () => f().ask?.(n.pick.name)), c(e, r);
		};
		l(u, (e) => {
			f().ask && e(d);
		});
		var m = T(u, 2), g = (e) => {
			var r = Ue(), i = h(r, !0);
			t(r), E((e) => a(i, e), [() => ce()]), p("click", r, function(...e) {
				n.onopen?.apply(this, e);
			}), c(e, r);
		};
		l(m, (e) => {
			n.onopen && e(g);
		}), t(r), c(e, r);
	};
	l(lt, (e) => {
		(f().choose || f().ask || n.onopen) && e(ut);
	}), t(K), E(() => {
		q = O(K, 1, "pick svelte-1f1lvve", null, q, {
			recommended: n.pick.recommended,
			chosen: n.pick.chosen,
			pictured: !!m(B)
		}), x($, "title", n.pick.name), Ke = O($, 1, "svelte-1f1lvve", null, Ke, { hyphenate: m(me) }), qe = ee($, "", qe, { "--longest": m(W) });
	}), _(Q, "clientWidth", (e) => D(G, e)), c(e, K), d();
}
f(["click"]);
// upstream/src/features/work/components/objects/FlightCard.svelte
var qe = k("<span class=\"flag svelte-16l3ooh\"><!> </span>"), Je = k("<span class=\"price svelte-16l3ooh\"> </span>"), Ye = k("<p class=\"when svelte-16l3ooh\"> </p>"), Xe = k("<span class=\"place svelte-16l3ooh\"> </span>"), Ze = k("<span class=\"duration svelte-16l3ooh\"> </span>"), Qe = k("<span class=\"stop svelte-16l3ooh\"></span>"), $e = k("<span> </span>"), et = k("<li class=\"svelte-16l3ooh\"><!><!></li>"), tt = k("<ul class=\"facts svelte-16l3ooh\"></ul>"), nt = k("<p class=\"why svelte-16l3ooh\"> </p>"), rt = k("<!> ", 1), it = k("<button type=\"button\" class=\"nodrag nopan svelte-16l3ooh\"><!></button>"), at = k("<button type=\"button\" class=\"nodrag nopan svelte-16l3ooh\"> </button>"), ot = k("<div class=\"actions svelte-16l3ooh\"><!> <!></div>"), st = k("<article><header class=\"svelte-16l3ooh\"><!> <span class=\"carrier svelte-16l3ooh\"> </span> <!> <!></header> <!> <div class=\"route svelte-16l3ooh\"><div class=\"end svelte-16l3ooh\"><span class=\"time svelte-16l3ooh\"> </span> <!></div> <div class=\"way svelte-16l3ooh\"><!> <span class=\"line svelte-16l3ooh\" aria-hidden=\"true\"></span> <span> </span></div> <div class=\"end arrive svelte-16l3ooh\"><span class=\"time svelte-16l3ooh\"> </span> <!></div></div> <!> <!> <!></article>");
function ct(e, n) {
	i(n, !0);
	let r = w(n, "actions", 19, () => ({})), o = S(() => n.pick.route), u = S(() => m(o).carrierHost ?? n.pick.logo), f = S(() => m(o).stops === 0 ? ue() : m(o).via?.length ? B({ places: m(o).via.join(", ") }) : fe({ count: m(o).stops }));
	var g = st();
	let _;
	var v = h(g), b = h(v), x = (e) => {
		A(e, {
			get address() {
				return m(u);
			},
			size: 20
		});
	}, D = S(() => m(u) && ne(m(u)));
	l(b, (e) => {
		m(D) && e(x);
	});
	var k = T(b, 2), j = h(k, !0);
	t(k);
	var M = T(k, 2), oe = (e) => {
		var n = qe(), r = h(n);
		J(r, { size: 11 });
		var i = T(r, 1, !0);
		t(n), E((e) => a(i, e), [() => he()]), c(e, n);
	};
	l(M, (e) => {
		n.pick.recommended && e(oe);
	});
	var se = T(M, 2), ce = (e) => {
		var r = Je(), i = h(r, !0);
		t(r), E(() => a(i, n.pick.price.display)), c(e, r);
	};
	l(se, (e) => {
		n.pick.price && e(ce);
	}), t(v);
	var F = T(v, 2), le = (e) => {
		var r = Ye(), i = h(r, !0);
		t(r), E(() => a(i, n.pick.when)), c(e, r);
	};
	l(F, (e) => {
		n.pick.when && e(le);
	});
	var I = T(F, 2), L = h(I), R = h(L), z = h(R, !0);
	t(R);
	var de = T(R, 2), pe = (e) => {
		var n = Xe(), r = h(n, !0);
		t(n), E(() => a(r, m(o).from)), c(e, n);
	};
	l(de, (e) => {
		m(o).depart && e(pe);
	}), t(L);
	var V = T(L, 2), H = h(V), U = (e) => {
		var n = Ze(), r = h(n, !0);
		t(n), E(() => a(r, m(o).duration)), c(e, n);
	};
	l(H, (e) => {
		m(o).duration && e(U);
	});
	var W = T(H, 2);
	y(W, 20, () => Array.from({ length: m(o).stops }, (e, t) => t), (e) => e, (e, t) => {
		var n = Qe();
		let r;
		E(() => r = ee(n, "", r, { "inset-inline-start": `${(t + 1) / (m(o).stops + 1) * 100}%` })), c(e, n);
	}), t(W);
	var G = T(W, 2);
	let me;
	var K = h(G, !0);
	t(G), t(V);
	var q = T(V, 2), ge = h(q), _e = h(ge, !0);
	t(ge);
	var ve = T(ge, 2), Y = (e) => {
		var n = Xe(), r = h(n, !0);
		t(n), E(() => a(r, m(o).to)), c(e, n);
	};
	l(ve, (e) => {
		m(o).arrive && e(Y);
	}), t(q), t(I);
	var ye = T(I, 2), be = (e) => {
		var r = tt();
		y(r, 21, () => n.pick.facts, (e) => e.label, (e, n) => {
			var r = et(), i = h(r), o = (e) => {
				re(e, {
					get value() {
						return m(n).kind;
					},
					size: 14
				});
			};
			l(i, (e) => {
				(m(n).kind === "yes" || m(n).kind === "no" || m(n).kind === "partial") && e(o);
			});
			var s = T(i), u = (e) => {
				var r = $e();
				let i;
				var o = h(r, !0);
				t(r), E(() => {
					i = O(r, 1, "svelte-16l3ooh", null, i, { quiet: m(n).kind === "no" }), a(o, m(n).value);
				}), c(e, r);
			}, d = S(() => !/^(yes|no)$/iu.test(m(n).value.trim()));
			l(s, (e) => {
				m(d) && e(u);
			}), t(r), c(e, r);
		}), t(r), c(e, r);
	};
	l(ye, (e) => {
		n.pick.facts.length && e(be);
	});
	var X = T(ye, 2), Z = (e) => {
		var r = nt(), i = h(r, !0);
		t(r), E(() => a(i, n.pick.why)), c(e, r);
	};
	l(X, (e) => {
		n.pick.why && e(Z);
	});
	var xe = T(X, 2), Se = (e) => {
		var i = ot(), o = h(i), u = (e) => {
			var i = it(), o = h(i), u = (e) => {
				var t = rt(), n = C(t);
				te(n, {
					get icon() {
						return ie;
					},
					size: 13
				});
				var r = T(n, 1, !0);
				E((e) => a(r, e), [() => P()]), c(e, t);
			}, d = (e) => {
				var t = s();
				E((e) => a(t, e), [() => ae()]), c(e, t);
			};
			l(o, (e) => {
				n.pick.chosen ? e(u) : e(d, -1);
			}), t(i), p("click", i, () => r().choose?.(n.pick.element, !n.pick.chosen)), c(e, i);
		};
		l(o, (e) => {
			r().choose && n.pick.element && e(u);
		});
		var d = T(o, 2), f = (e) => {
			var i = at(), o = h(i, !0);
			t(i), E((e) => a(o, e), [() => N()]), p("click", i, () => r().ask?.(n.pick.name)), c(e, i);
		};
		l(d, (e) => {
			r().ask && e(f);
		}), t(i), c(e, i);
	};
	l(xe, (e) => {
		(r().choose || r().ask) && e(Se);
	}), t(g), E(() => {
		_ = O(g, 1, "flight svelte-16l3ooh", null, _, {
			recommended: n.pick.recommended,
			chosen: n.pick.chosen
		}), a(j, m(o).carrier ?? n.pick.name), a(z, m(o).depart ?? m(o).from), me = O(G, 1, "stops svelte-16l3ooh", null, me, { direct: m(o).stops === 0 }), a(K, m(f)), a(_e, m(o).arrive ?? m(o).to);
	}), c(e, g), d();
}
f(["click"]);
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
var dt = k("<button type=\"button\" class=\"compare nodrag nopan svelte-1yroi37\"> </button>"), ft = k("<header class=\"svelte-1yroi37\"><!> <!></header>"), pt = k("<button type=\"button\" class=\"from nodrag nopan svelte-1yroi37\"><!></button><span class=\"stem svelte-1yroi37\" aria-hidden=\"true\"></span>", 1), mt = k("<span class=\"from none svelte-1yroi37\" aria-hidden=\"true\"></span><span class=\"stem none svelte-1yroi37\" aria-hidden=\"true\"></span>", 1), ht = k("<div role=\"group\"><!> <!></div>"), gt = k("<div class=\"compare-sheet svelte-1yroi37\"><!></div>"), _t = k("<section><!> <div></div> <!></section>");
function vt(n, r) {
	i(r, !0);
	let s = {
		pictured: 200,
		plain: 220,
		widest: 248,
		gap: 16
	}, f = w(r, "actions", 19, () => ({})), g = w(r, "centre", 3, !1), k = v(0), te = S(() => {
		let e = r.object.items.length;
		if (!e) return 1;
		let t = m(re) ? s.pictured : s.plain, n = m(k) ? Math.max(1, Math.floor((m(k) + s.gap) / (t + s.gap))) : Math.min(e, 4), i = Math.ceil(e / Math.min(n, e));
		return Math.ceil(e / i);
	}), ne = (e) => !!e.route, A = S(() => r.object.facet === "flight" && r.object.items.every(ne)), re = S(() => r.object.items.some((e) => e.picture)), ie = S(() => {
		if (m(A) || g() || !r.object.items.some((e) => e.from)) return !1;
		let e = r.object.items.map((e) => e.from?.page);
		return e.every((e) => e) && new Set(e).size === e.length;
	}), M = S(() => !!f().compare && !m(A) && ut(r.object)), N = v(null);
	var P = _t();
	let ae, oe;
	var se = h(P), ce = (e) => {
		var n = ft(), i = h(n), o = (e) => {
			I(e, { get text() {
				return r.object.title;
			} });
		};
		l(i, (e) => {
			r.object.title && e(o);
		});
		var s = T(i, 2), u = (e) => {
			var n = dt(), i = h(n, !0);
			t(n), E((e) => a(i, e), [() => H()]), p("click", n, () => f().compare?.(r.object.id)), c(e, n);
		};
		l(s, (e) => {
			m(M) && e(u);
		}), t(n), c(e, n);
	};
	l(se, (e) => {
		(r.object.title || m(M)) && e(ce);
	});
	var F = T(se, 2);
	let le;
	y(F, 21, () => r.object.items, e, (e, n, i) => {
		var a = u(), s = C(a), d = (e) => {
			ct(e, {
				get pick() {
					return m(n);
				},
				get actions() {
					return f();
				}
			});
		}, g = S(() => m(A) && ne(m(n))), _ = (e) => {
			var a = ht();
			let s;
			var u = h(a), d = (e) => {
				let r = S(() => m(n).from);
				var i = pt(), a = C(i), o = h(a);
				L(o, {
					get url() {
						return m(r).url;
					},
					get title() {
						return m(r).title;
					},
					get frame() {
						return m(r).frame;
					}
				}), t(a), b(), E(() => x(a, "aria-label", m(r).title || m(r).url)), p("click", a, (e) => {
					e.stopPropagation(), f().link?.(m(r).url);
				}), c(e, i);
			}, g = (e) => {
				var t = mt();
				b(), c(e, t);
			};
			l(u, (e) => {
				m(n).from ? e(d) : e(g, -1);
			});
			var _ = T(u, 2);
			{
				let e = S(() => r.object.facet === "video"), t = S(() => r.object.facet === "product"), a = S(() => f().open ? () => f().open?.(r.object.id, i) : void 0);
				Ke(_, {
					get pick() {
						return m(n);
					},
					get actions() {
						return f();
					},
					get video() {
						return m(e);
					},
					get product() {
						return m(t);
					},
					get onopen() {
						return m(a);
					}
				});
			}
			t(a), E(() => s = O(a, 1, "cell svelte-1yroi37", null, s, { lit: m(N) === i })), o("pointerenter", a, () => D(N, i, !0)), o("pointerleave", a, () => m(N) === i && D(N, null)), c(e, a);
		}, v = (e) => {
			{
				let t = S(() => r.object.facet === "video"), a = S(() => r.object.facet === "product"), o = S(() => f().open ? () => f().open?.(r.object.id, i) : void 0);
				Ke(e, {
					get pick() {
						return m(n);
					},
					get actions() {
						return f();
					},
					get video() {
						return m(t);
					},
					get product() {
						return m(a);
					},
					get onopen() {
						return m(o);
					}
				});
			}
		};
		l(s, (e) => {
			m(g) ? e(d) : m(ie) ? e(_, 1) : e(v, -1);
		}), c(e, a);
	}), t(F);
	var R = T(F, 2), z = (e) => {
		var n = gt(), i = h(n);
		{
			let e = S(() => lt(r.object));
			j(i, {
				get object() {
					return m(e);
				},
				get actions() {
					return f();
				},
				get rows() {
					return r.object.items.length;
				}
			});
		}
		t(n), c(e, n);
	};
	l(R, (e) => {
		g() && r.object.items.length > 1 && !m(A) && e(z);
	}), t(P), E(() => {
		ae = O(P, 1, "picks svelte-1yroi37", null, ae, {
			flights: m(A),
			pictured: m(re)
		}), x(P, "aria-label", r.object.title), oe = ee(P, "", oe, {
			"--across": m(te),
			"--card-widest": `${s.widest}px`
		}), le = O(F, 1, "set svelte-1yroi37", null, le, { sourced: m(ie) });
	}), _(P, "clientWidth", (e) => D(k, e)), c(n, P), d();
}
f(["click"]);
export { vt as default };
