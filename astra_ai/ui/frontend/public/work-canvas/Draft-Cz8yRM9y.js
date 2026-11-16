import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Ct as n, Dt as r, E as i, F as a, Ft as o, G as s, H as c, J as l, K as u, M as d, N as f, Ot as ee, R as p, Rt as te, S as m, V as h, _t as ne, dt as g, ft as _, h as v, ht as y, it as re, ot as b, q as x, r as S, u as ie, ut as C, yt as w } from "./index-client-C_2wYFnt.js";
import { t as ae } from "./Icon-E4BzZ4dm.js";
import { t as T } from "./Inline-hs44HAd0.js";
import { t as oe } from "./Mark-BTIzBHOo.js";
import { t as se } from "./markdown-C0lHpopA.js";
import { t as ce } from "./Tick02Icon-COqFGcdx.js";
import { t as E } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_draft_approve.js
var D = () => "Approve", le = ((e = {}, t = {}) => (t.locale ?? E(), D(e))), O = () => "Comment", ue = ((e = {}, t = {}) => (t.locale ?? E(), O(e))), k = () => "Draft", de = ((e = {}, t = {}) => (t.locale ?? E(), k(e))), A = () => "Edit the draft", fe = ((e = {}, t = {}) => (t.locale ?? E(), A(e))), j = () => "Email", pe = ((e = {}, t = {}) => (t.locale ?? E(), j(e))), M = () => "Message", me = ((e = {}, t = {}) => (t.locale ?? E(), M(e))), N = () => "now", he = ((e = {}, t = {}) => (t.locale ?? E(), N(e))), P = () => "Post", ge = ((e = {}, t = {}) => (t.locale ?? E(), P(e))), F = () => "Request changes", _e = ((e = {}, t = {}) => (t.locale ?? E(), F(e))), I = () => "Review", ve = ((e = {}, t = {}) => (t.locale ?? E(), I(e))), L = () => "Send", ye = ((e = {}, t = {}) => (t.locale ?? E(), L(e))), R = () => "Sending…", be = ((e = {}, t = {}) => (t.locale ?? E(), R(e))), z = () => "Sent", xe = ((e = {}, t = {}) => (t.locale ?? E(), z(e))), B = () => "Subject", Se = ((e = {}, t = {}) => (t.locale ?? E(), B(e))), V = () => "To", Ce = ((e = {}, t = {}) => (t.locale ?? E(), V(e))), we = c("<textarea></textarea>"), Te = c("<div class=\"body editable svelte-17kuy6k\" role=\"button\" tabindex=\"0\"><!></div>"), Ee = c("<div class=\"body svelte-17kuy6k\"><!></div>"), De = c("<li><!></li>"), Oe = c("<ul class=\"svelte-17kuy6k\"></ul>"), ke = c("<br/>"), Ae = c("<!><!>", 1), je = c("<p class=\"svelte-17kuy6k\"></p>"), Me = c("<img class=\"avatar svelte-17kuy6k\" alt=\"\" decoding=\"async\"/>"), Ne = c("<span class=\"to svelte-17kuy6k\"> </span>"), Pe = c("<div class=\"svelte-17kuy6k\"><dt class=\"svelte-17kuy6k\"> </dt> <dd class=\"svelte-17kuy6k\"> </dd></div>"), Fe = c("<div class=\"svelte-17kuy6k\"><dt class=\"svelte-17kuy6k\"> </dt> <dd class=\"subject svelte-17kuy6k\"> </dd></div>"), Ie = c("<dl class=\"fields svelte-17kuy6k\"><!> <!></dl> <!>", 1), Le = c("<p class=\"who svelte-17kuy6k\"><strong> </strong><span class=\"when svelte-17kuy6k\"> </span></p>"), Re = c("<div class=\"message svelte-17kuy6k\"><!> <div class=\"said svelte-17kuy6k\"><!> <!></div></div>"), ze = c("<span class=\"handle svelte-17kuy6k\"> </span>"), Be = c("<div class=\"byline svelte-17kuy6k\"><!> <div class=\"names svelte-17kuy6k\"><strong> </strong> <!></div></div>"), Ve = c("<!> <!>", 1), He = c("<p class=\"who svelte-17kuy6k\"><strong> </strong></p>"), Ue = c("<div class=\"comment svelte-17kuy6k\"><!> <!></div>"), We = c("<p class=\"note svelte-17kuy6k\" role=\"status\"> </p>"), Ge = c("<button type=\"button\" role=\"radio\" class=\"svelte-17kuy6k\"> </button>"), Ke = c("<div class=\"reviews nodrag nopan svelte-17kuy6k\" role=\"radiogroup\"></div>"), qe = c("<span> </span>"), Je = c("<!> ", 1), Ye = c("<article><header class=\"svelte-17kuy6k\"><!> <span class=\"where svelte-17kuy6k\"> </span> <!> <span class=\"state svelte-17kuy6k\"> </span></header> <!> <footer class=\"svelte-17kuy6k\"><!> <!> <!> <button type=\"button\" class=\"send nodrag nopan svelte-17kuy6k\"><!></button></footer></article>");
function H(c, u) {
	ee(u, !0);
	let E = (r) => {
		var s = h(), c = g(s), d = (r) => {
			var a = we();
			n(a);
			let o;
			re(() => ie(a, () => e(j), (e) => y(j, e))), i(a, (e, t) => I?.(e, t), () => !A()), b(() => {
				o = m(a, 1, "body edit nodrag nopan nowheel svelte-17kuy6k", null, o, { inline: !A() }), v(a, "aria-label", e(H));
			}), x("input", a, (e) => k().write?.(u.object.id, e.currentTarget.value)), l("blur", a, L), x("keydown", a, (e) => {
				e.key === "Escape" && e.currentTarget.blur();
			}), t(r, a);
		}, f = (n) => {
			var r = h(), i = g(r), s = (e) => {
				var n = Te(), r = C(n);
				D(r), o(n), b((e) => v(n, "aria-label", e), [() => fe()]), x("click", n, () => y(M, !0)), x("keydown", n, (e) => {
					(e.key === "Enter" || e.key === " ") && (e.preventDefault(), y(M, !0));
				}), t(e, n);
			}, c = (e) => {
				var n = Ee(), r = C(n);
				D(r), o(n), t(e, n);
			};
			a(i, (t) => {
				e(N) ? t(s) : t(c, -1);
			}), t(n, r);
		};
		a(c, (t) => {
			e(N) && (A() || e(M)) ? t(d) : t(f, -1);
		}), t(r, s);
	}, D = (n) => {
		var r = h(), i = g(r);
		d(i, 17, () => e(Xe), f, (n, r) => {
			var i = h(), s = g(i), c = (n) => {
				var i = Oe();
				d(i, 21, () => e(r).items, f, (n, r) => {
					var i = De(), a = C(i);
					T(a, {
						get text() {
							return e(r);
						},
						plain: !0
					}), o(i), t(n, i);
				}), o(i), t(n, i);
			}, l = (n) => {
				var i = je();
				d(i, 21, () => e(r).lines, f, (n, r, i) => {
					var o = Ae(), s = g(o), c = (e) => {
						var n = ke();
						t(e, n);
					};
					a(s, (e) => {
						i && e(c);
					});
					var l = _(s);
					T(l, {
						get text() {
							return e(r);
						},
						plain: !0
					}), t(n, o);
				}), o(i), t(n, i);
			};
			a(s, (t) => {
				e(r).kind === "list" ? t(c) : t(l, -1);
			}), t(n, i);
		}), t(n, r);
	}, O = (e, n = te) => {
		var r = h(), i = g(r), o = (e) => {
			var r = Me();
			b(() => {
				v(r, "src", u.object.author.picture.src), v(r, "width", n()), v(r, "height", n());
			}), t(e, r);
		};
		a(i, (e) => {
			u.object.author?.picture && e(o);
		}), t(e, r);
	}, k = S(u, "actions", 19, () => ({})), A = S(u, "centre", 3, !1), j = w(() => u.object.body), M = ne(!1), N = w(() => !!k().write && (u.object.send ?? "draft") === "draft"), P = [
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
		e(j) !== u.object.body && k().write?.(u.object.id, e(j)), A() || y(M, !1);
	}, R = {
		slack: "slack.com",
		email: "mail.google.com",
		linkedin: "linkedin.com",
		x: "x.com",
		github: "github.com",
		message: ""
	}, z = w(() => R[u.object.destination]), B = w(() => u.object.send ?? "draft"), V = w(() => u.object.destination === "linkedin" || u.object.destination === "x" ? ge() : u.object.destination === "github" ? F(u.object.review ?? "comment") : ye()), H = w(() => u.object.destination === "slack" ? "Slack" : u.object.destination === "email" ? pe() : u.object.destination === "linkedin" ? "LinkedIn" : u.object.destination === "x" ? "X" : u.object.destination === "github" ? "GitHub" : me()), Xe = w(() => se(u.object.body)), U = w(() => u.object.destination === "x" ? 280 - [...u.object.body].length : null);
	var W = Ye(), G = C(W), K = C(G), Ze = (t) => {
		oe(t, {
			get address() {
				return e(z);
			},
			size: 16
		});
	};
	a(K, (t) => {
		e(z) && t(Ze);
	});
	var q = _(K, 2), Qe = C(q, !0);
	o(q);
	var J = _(q, 2), $e = (e) => {
		var n = Ne(), r = C(n, !0);
		o(n), b(() => p(r, u.object.to)), t(e, n);
	};
	a(J, (e) => {
		u.object.to && u.object.destination !== "email" && e($e);
	});
	var Y = _(J, 2), et = C(Y, !0);
	o(Y), o(G);
	var X = _(G, 2), tt = (e) => {
		var n = Ie(), r = g(n), i = C(r), s = (e) => {
			var n = Pe(), r = C(n), i = C(r, !0);
			o(r);
			var a = _(r, 2), s = C(a, !0);
			o(a), o(n), b((e) => {
				p(i, e), p(s, u.object.to);
			}, [() => Ce()]), t(e, n);
		};
		a(i, (e) => {
			u.object.to && e(s);
		});
		var c = _(i, 2), l = (e) => {
			var n = Fe(), r = C(n), i = C(r, !0);
			o(r);
			var a = _(r, 2), s = C(a, !0);
			o(a), o(n), b((e) => {
				p(i, e), p(s, u.object.subject);
			}, [() => Se()]), t(e, n);
		};
		a(c, (e) => {
			u.object.subject && e(l);
		}), o(r);
		var d = _(r, 2);
		E(d), t(e, n);
	}, nt = (e) => {
		var n = Re(), r = C(n);
		O(r, () => 32);
		var i = _(r, 2), s = C(i), c = (e) => {
			var n = Le(), r = C(n), i = C(r, !0);
			o(r);
			var a = _(r), s = C(a, !0);
			o(a), o(n), b((e) => {
				p(i, u.object.author.name), p(s, e);
			}, [() => he()]), t(e, n);
		};
		a(s, (e) => {
			u.object.author && e(c);
		});
		var l = _(s, 2);
		E(l), o(i), o(n), t(e, n);
	}, rt = (e) => {
		var n = Ve(), r = g(n), i = (e) => {
			var n = Be(), r = C(n);
			O(r, () => 40);
			var i = _(r, 2), s = C(i), c = C(s, !0);
			o(s);
			var l = _(s, 2), d = (e) => {
				var n = ze(), r = C(n, !0);
				o(n), b(() => p(r, u.object.author.handle)), t(e, n);
			};
			a(l, (e) => {
				u.object.author.handle && e(d);
			}), o(i), o(n), b(() => p(c, u.object.author.name)), t(e, n);
		};
		a(r, (e) => {
			u.object.author && e(i);
		});
		var s = _(r, 2);
		E(s), t(e, n);
	}, it = (e) => {
		var n = Ue(), r = C(n), i = (e) => {
			var n = He(), r = C(n), i = C(r, !0);
			o(r), o(n), b(() => p(i, u.object.author.name)), t(e, n);
		};
		a(r, (e) => {
			u.object.author && e(i);
		});
		var s = _(r, 2);
		E(s), o(n), t(e, n);
	};
	a(X, (e) => {
		u.object.destination === "email" ? e(tt) : u.object.destination === "slack" || u.object.destination === "message" ? e(nt, 1) : u.object.destination === "linkedin" || u.object.destination === "x" ? e(rt, 2) : e(it, -1);
	});
	var Z = _(X, 2), at = C(Z), ot = (e) => {
		var n = We(), r = C(n, !0);
		o(n), b(() => p(r, u.object.note)), t(e, n);
	};
	a(at, (e) => {
		u.object.note && e(ot);
	});
	var st = _(at, 2), ct = (e) => {
		var n = Ke();
		d(n, 20, () => P, (e) => e, (e, n) => {
			var r = Ge(), i = C(r, !0);
			o(r), b((e) => {
				v(r, "aria-checked", (u.object.review ?? "comment") === n), p(i, e);
			}, [() => F(n)]), x("click", r, () => k().review?.(u.object.id, n)), t(e, r);
		}), o(n), b((e) => v(n, "aria-label", e), [() => ve()]), t(e, n);
	};
	a(st, (e) => {
		u.object.destination === "github" && k().review && (u.object.send ?? "draft") === "draft" && e(ct);
	});
	var Q = _(st, 2), lt = (n) => {
		var r = qe();
		let i;
		var a = C(r, !0);
		o(r), b(() => {
			i = m(r, 1, "count svelte-17kuy6k", null, i, { over: e(U) < 0 }), p(a, e(U));
		}), t(n, r);
	};
	a(Q, (t) => {
		e(U) !== null && t(lt);
	});
	var $ = _(Q, 2), ut = C($), dt = (e) => {
		var n = Je(), r = g(n);
		ae(r, {
			get icon() {
				return ce;
			},
			size: 13
		});
		var i = _(r, 1, !0);
		b((e) => p(i, e), [() => xe()]), t(e, n);
	}, ft = (e) => {
		var n = s();
		b((e) => p(n, e), [() => be()]), t(e, n);
	}, pt = (n) => {
		var r = s();
		b(() => p(r, e(V))), t(n, r);
	};
	a(ut, (t) => {
		e(B) === "sent" ? t(dt) : e(B) === "sending" ? t(ft, 1) : t(pt, -1);
	}), o($), o(Z), o(W), b((t) => {
		m(W, 1, `draft ${u.object.destination ?? ""}`, "svelte-17kuy6k"), v(W, "aria-label", e(H)), p(Qe, e(H)), p(et, t), $.disabled = e(B) !== "draft" || e(U) !== null && e(U) < 0;
	}, [() => de()]), x("click", $, () => k().send?.(u.object.id)), t(c, W), r();
}
u([
	"input",
	"keydown",
	"click"
]);
export { H as default };
