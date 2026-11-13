import "./disclose-version-DFvUDwEH.js";
import { B as e, E as t, Et as n, F as r, G as i, H as a, It as o, J as s, K as c, M as l, N as u, Nt as d, Q as f, R as p, S as m, Tt as ee, V as h, _t as g, ct as _, h as v, ht as te, it as y, lt as b, nt as ne, pt as x, q as S, r as C, u as re, ut as w, xt as ie } from "./index-client-oI5R0J23.js";
import { t as ae } from "./Icon-BfOzno3u.js";
import { t as T } from "./Inline-CZHzvbEf.js";
import { t as oe } from "./Mark-k2Ui4Fuu.js";
import { t as se } from "./markdown-C0lHpopA.js";
import { t as ce } from "./Tick02Icon-COqFGcdx.js";
import { t as E } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_draft_approve.js
var D = () => "Approve", le = ((e = {}, t = {}) => (t.locale ?? E(), D(e))), O = () => "Comment", ue = ((e = {}, t = {}) => (t.locale ?? E(), O(e))), k = () => "Draft", de = ((e = {}, t = {}) => (t.locale ?? E(), k(e))), A = () => "Edit the draft", fe = ((e = {}, t = {}) => (t.locale ?? E(), A(e))), j = () => "Email", pe = ((e = {}, t = {}) => (t.locale ?? E(), j(e))), M = () => "Message", me = ((e = {}, t = {}) => (t.locale ?? E(), M(e))), N = () => "now", he = ((e = {}, t = {}) => (t.locale ?? E(), N(e))), P = () => "Post", ge = ((e = {}, t = {}) => (t.locale ?? E(), P(e))), F = () => "Request changes", _e = ((e = {}, t = {}) => (t.locale ?? E(), F(e))), I = () => "Review", ve = ((e = {}, t = {}) => (t.locale ?? E(), I(e))), L = () => "Send", ye = ((e = {}, t = {}) => (t.locale ?? E(), L(e))), R = () => "Sending…", be = ((e = {}, t = {}) => (t.locale ?? E(), R(e))), z = () => "Sent", xe = ((e = {}, t = {}) => (t.locale ?? E(), z(e))), B = () => "Subject", Se = ((e = {}, t = {}) => (t.locale ?? E(), B(e))), V = () => "To", Ce = ((e = {}, t = {}) => (t.locale ?? E(), V(e))), we = a("<textarea></textarea>"), Te = a("<div class=\"body editable svelte-17kuy6k\" role=\"button\" tabindex=\"0\"><!></div>"), Ee = a("<div class=\"body svelte-17kuy6k\"><!></div>"), De = a("<li><!></li>"), Oe = a("<ul class=\"svelte-17kuy6k\"></ul>"), ke = a("<br/>"), Ae = a("<!><!>", 1), je = a("<p class=\"svelte-17kuy6k\"></p>"), Me = a("<img class=\"avatar svelte-17kuy6k\" alt=\"\" decoding=\"async\"/>"), Ne = a("<span class=\"to svelte-17kuy6k\"> </span>"), Pe = a("<div class=\"svelte-17kuy6k\"><dt class=\"svelte-17kuy6k\"> </dt> <dd class=\"svelte-17kuy6k\"> </dd></div>"), Fe = a("<div class=\"svelte-17kuy6k\"><dt class=\"svelte-17kuy6k\"> </dt> <dd class=\"subject svelte-17kuy6k\"> </dd></div>"), Ie = a("<dl class=\"fields svelte-17kuy6k\"><!> <!></dl> <!>", 1), Le = a("<p class=\"who svelte-17kuy6k\"><strong> </strong><span class=\"when svelte-17kuy6k\"> </span></p>"), Re = a("<div class=\"message svelte-17kuy6k\"><!> <div class=\"said svelte-17kuy6k\"><!> <!></div></div>"), ze = a("<span class=\"handle svelte-17kuy6k\"> </span>"), Be = a("<div class=\"byline svelte-17kuy6k\"><!> <div class=\"names svelte-17kuy6k\"><strong> </strong> <!></div></div>"), Ve = a("<!> <!>", 1), He = a("<p class=\"who svelte-17kuy6k\"><strong> </strong></p>"), Ue = a("<div class=\"comment svelte-17kuy6k\"><!> <!></div>"), We = a("<p class=\"note svelte-17kuy6k\" role=\"status\"> </p>"), Ge = a("<button type=\"button\" role=\"radio\" class=\"svelte-17kuy6k\"> </button>"), Ke = a("<div class=\"reviews nodrag nopan svelte-17kuy6k\" role=\"radiogroup\"></div>"), qe = a("<span> </span>"), Je = a("<!> ", 1), Ye = a("<article><header class=\"svelte-17kuy6k\"><!> <span class=\"where svelte-17kuy6k\"> </span> <!> <span class=\"state svelte-17kuy6k\"> </span></header> <!> <footer class=\"svelte-17kuy6k\"><!> <!> <!> <button type=\"button\" class=\"send nodrag nopan svelte-17kuy6k\"><!></button></footer></article>");
function H(a, c) {
	n(c, !0);
	let E = (n) => {
		var i = h(), a = b(i), o = (n) => {
			var r = we();
			ie(r);
			let i;
			ne(() => re(r, () => f(j), (e) => x(j, e))), t(r, (e, t) => I?.(e, t), () => !A()), y(() => {
				i = m(r, 1, "body edit nodrag nopan nowheel svelte-17kuy6k", null, i, { inline: !A() }), v(r, "aria-label", f(H));
			}), s("blur", r, L), S("keydown", r, (e) => {
				e.key === "Escape" && e.currentTarget.blur();
			}), e(n, r);
		}, c = (t) => {
			var n = h(), i = b(n), a = (t) => {
				var n = Te(), r = _(n);
				D(r), d(n), y((e) => v(n, "aria-label", e), [() => fe()]), S("click", n, () => x(M, !0)), S("keydown", n, (e) => {
					(e.key === "Enter" || e.key === " ") && (e.preventDefault(), x(M, !0));
				}), e(t, n);
			}, o = (t) => {
				var n = Ee(), r = _(n);
				D(r), d(n), e(t, n);
			};
			r(i, (e) => {
				f(N) ? e(a) : e(o, -1);
			}), e(t, n);
		};
		r(a, (e) => {
			f(N) && (A() || f(M)) ? e(o) : e(c, -1);
		}), e(n, i);
	}, D = (t) => {
		var n = h(), i = b(n);
		l(i, 17, () => f(Xe), u, (t, n) => {
			var i = h(), a = b(i), o = (t) => {
				var r = Oe();
				l(r, 21, () => f(n).items, u, (t, n) => {
					var r = De(), i = _(r);
					T(i, {
						get text() {
							return f(n);
						},
						plain: !0
					}), d(r), e(t, r);
				}), d(r), e(t, r);
			}, s = (t) => {
				var i = je();
				l(i, 21, () => f(n).lines, u, (t, n, i) => {
					var a = Ae(), o = b(a), s = (t) => {
						var n = ke();
						e(t, n);
					};
					r(o, (e) => {
						i && e(s);
					});
					var c = w(o);
					T(c, {
						get text() {
							return f(n);
						},
						plain: !0
					}), e(t, a);
				}), d(i), e(t, i);
			};
			r(a, (e) => {
				f(n).kind === "list" ? e(o) : e(s, -1);
			}), e(t, i);
		}), e(t, n);
	}, O = (t, n = o) => {
		var i = h(), a = b(i), s = (t) => {
			var r = Me();
			y(() => {
				v(r, "src", c.object.author.picture.src), v(r, "width", n()), v(r, "height", n());
			}), e(t, r);
		};
		r(a, (e) => {
			c.object.author?.picture && e(s);
		}), e(t, i);
	}, k = C(c, "actions", 19, () => ({})), A = C(c, "centre", 3, !1), j = g(() => c.object.body), M = te(!1), N = g(() => !!k().write && (c.object.send ?? "draft") === "draft"), P = [
		"comment",
		"approve",
		"request_changes"
	], F = (e) => e === "approve" ? le() : e === "request_changes" ? _e() : ue();
	function I(e, t) {
		let n = () => {
			e.style.blockSize = "auto", e.style.blockSize = `${e.scrollHeight}px`;
		};
		return n(), t && (e.focus({ preventScroll: !0 }), e.setSelectionRange(e.value.length, e.value.length)), e.addEventListener("input", n), { destroy: () => e.removeEventListener("input", n) };
	}
	let L = () => {
		f(j) !== c.object.body && k().write?.(c.object.id, f(j)), A() || x(M, !1);
	}, R = {
		slack: "slack.com",
		email: "mail.google.com",
		linkedin: "linkedin.com",
		x: "x.com",
		github: "github.com",
		message: ""
	}, z = g(() => R[c.object.destination]), B = g(() => c.object.send ?? "draft"), V = g(() => c.object.destination === "linkedin" || c.object.destination === "x" ? ge() : c.object.destination === "github" ? F(c.object.review ?? "comment") : ye()), H = g(() => c.object.destination === "slack" ? "Slack" : c.object.destination === "email" ? pe() : c.object.destination === "linkedin" ? "LinkedIn" : c.object.destination === "x" ? "X" : c.object.destination === "github" ? "GitHub" : me()), Xe = g(() => se(c.object.body)), U = g(() => c.object.destination === "x" ? 280 - [...c.object.body].length : null);
	var W = Ye(), G = _(W), K = _(G), Ze = (e) => {
		oe(e, {
			get address() {
				return f(z);
			},
			size: 16
		});
	};
	r(K, (e) => {
		f(z) && e(Ze);
	});
	var q = w(K, 2), Qe = _(q, !0);
	d(q);
	var J = w(q, 2), $e = (t) => {
		var n = Ne(), r = _(n, !0);
		d(n), y(() => p(r, c.object.to)), e(t, n);
	};
	r(J, (e) => {
		c.object.to && c.object.destination !== "email" && e($e);
	});
	var Y = w(J, 2), et = _(Y, !0);
	d(Y), d(G);
	var X = w(G, 2), tt = (t) => {
		var n = Ie(), i = b(n), a = _(i), o = (t) => {
			var n = Pe(), r = _(n), i = _(r, !0);
			d(r);
			var a = w(r, 2), o = _(a, !0);
			d(a), d(n), y((e) => {
				p(i, e), p(o, c.object.to);
			}, [() => Ce()]), e(t, n);
		};
		r(a, (e) => {
			c.object.to && e(o);
		});
		var s = w(a, 2), l = (t) => {
			var n = Fe(), r = _(n), i = _(r, !0);
			d(r);
			var a = w(r, 2), o = _(a, !0);
			d(a), d(n), y((e) => {
				p(i, e), p(o, c.object.subject);
			}, [() => Se()]), e(t, n);
		};
		r(s, (e) => {
			c.object.subject && e(l);
		}), d(i);
		var u = w(i, 2);
		E(u), e(t, n);
	}, nt = (t) => {
		var n = Re(), i = _(n);
		O(i, () => 32);
		var a = w(i, 2), o = _(a), s = (t) => {
			var n = Le(), r = _(n), i = _(r, !0);
			d(r);
			var a = w(r), o = _(a, !0);
			d(a), d(n), y((e) => {
				p(i, c.object.author.name), p(o, e);
			}, [() => he()]), e(t, n);
		};
		r(o, (e) => {
			c.object.author && e(s);
		});
		var l = w(o, 2);
		E(l), d(a), d(n), e(t, n);
	}, rt = (t) => {
		var n = Ve(), i = b(n), a = (t) => {
			var n = Be(), i = _(n);
			O(i, () => 40);
			var a = w(i, 2), o = _(a), s = _(o, !0);
			d(o);
			var l = w(o, 2), u = (t) => {
				var n = ze(), r = _(n, !0);
				d(n), y(() => p(r, c.object.author.handle)), e(t, n);
			};
			r(l, (e) => {
				c.object.author.handle && e(u);
			}), d(a), d(n), y(() => p(s, c.object.author.name)), e(t, n);
		};
		r(i, (e) => {
			c.object.author && e(a);
		});
		var o = w(i, 2);
		E(o), e(t, n);
	}, it = (t) => {
		var n = Ue(), i = _(n), a = (t) => {
			var n = He(), r = _(n), i = _(r, !0);
			d(r), d(n), y(() => p(i, c.object.author.name)), e(t, n);
		};
		r(i, (e) => {
			c.object.author && e(a);
		});
		var o = w(i, 2);
		E(o), d(n), e(t, n);
	};
	r(X, (e) => {
		c.object.destination === "email" ? e(tt) : c.object.destination === "slack" || c.object.destination === "message" ? e(nt, 1) : c.object.destination === "linkedin" || c.object.destination === "x" ? e(rt, 2) : e(it, -1);
	});
	var Z = w(X, 2), at = _(Z), ot = (t) => {
		var n = We(), r = _(n, !0);
		d(n), y(() => p(r, c.object.note)), e(t, n);
	};
	r(at, (e) => {
		c.object.note && e(ot);
	});
	var st = w(at, 2), ct = (t) => {
		var n = Ke();
		l(n, 20, () => P, (e) => e, (t, n) => {
			var r = Ge(), i = _(r, !0);
			d(r), y((e) => {
				v(r, "aria-checked", (c.object.review ?? "comment") === n), p(i, e);
			}, [() => F(n)]), S("click", r, () => k().review?.(c.object.id, n)), e(t, r);
		}), d(n), y((e) => v(n, "aria-label", e), [() => ve()]), e(t, n);
	};
	r(st, (e) => {
		c.object.destination === "github" && k().review && (c.object.send ?? "draft") === "draft" && e(ct);
	});
	var Q = w(st, 2), lt = (t) => {
		var n = qe();
		let r;
		var i = _(n, !0);
		d(n), y(() => {
			r = m(n, 1, "count svelte-17kuy6k", null, r, { over: f(U) < 0 }), p(i, f(U));
		}), e(t, n);
	};
	r(Q, (e) => {
		f(U) !== null && e(lt);
	});
	var $ = w(Q, 2), ut = _($), dt = (t) => {
		var n = Je(), r = b(n);
		ae(r, {
			get icon() {
				return ce;
			},
			size: 13
		});
		var i = w(r, 1, !0);
		y((e) => p(i, e), [() => xe()]), e(t, n);
	}, ft = (t) => {
		var n = i();
		y((e) => p(n, e), [() => be()]), e(t, n);
	}, pt = (t) => {
		var n = i();
		y(() => p(n, f(V))), e(t, n);
	};
	r(ut, (e) => {
		f(B) === "sent" ? e(dt) : f(B) === "sending" ? e(ft, 1) : e(pt, -1);
	}), d($), d(Z), d(W), y((e) => {
		m(W, 1, `draft ${c.object.destination ?? ""}`, "svelte-17kuy6k"), v(W, "aria-label", f(H)), p(Qe, f(H)), p(et, e), $.disabled = f(B) !== "draft" || f(U) !== null && f(U) < 0;
	}, [() => de()]), S("click", $, () => k().send?.(c.object.id)), e(a, W), ee();
}
c(["keydown", "click"]);
export { H as default };
