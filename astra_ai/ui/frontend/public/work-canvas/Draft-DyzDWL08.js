import "./disclose-version-DFvUDwEH.js";
import { $ as e, A as t, At as n, C as r, Ct as i, F as a, G as o, H as s, L as c, M as l, Nt as u, R as d, St as ee, U as f, W as p, Y as m, at as h, ft as te, k as g, l as ne, m as _, mt as v, ot as y, r as b, st as x, tt as S, ut as C, vt as re, y as w, z as T } from "./index-client-BSGo5gVb.js";
import { t as ie } from "./Icon-BWISRU-8.js";
import { t as E } from "./Inline-Q9m_b8xX.js";
import { t as ae } from "./Mark-DBYTxnH7.js";
import { t as oe } from "./markdown-C0lHpopA.js";
import { t as se } from "./Tick02Icon-COqFGcdx.js";
import { t as D } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_draft_approve.js
var O = () => "Approve", ce = ((e = {}, t = {}) => (t.locale ?? D(), O(e))), k = () => "Comment", le = ((e = {}, t = {}) => (t.locale ?? D(), k(e))), A = () => "Draft", ue = ((e = {}, t = {}) => (t.locale ?? D(), A(e))), j = () => "Edit the draft", de = ((e = {}, t = {}) => (t.locale ?? D(), j(e))), M = () => "Email", fe = ((e = {}, t = {}) => (t.locale ?? D(), M(e))), N = () => "Message", pe = ((e = {}, t = {}) => (t.locale ?? D(), N(e))), P = () => "now", me = ((e = {}, t = {}) => (t.locale ?? D(), P(e))), F = () => "Post", he = ((e = {}, t = {}) => (t.locale ?? D(), F(e))), I = () => "Request changes", ge = ((e = {}, t = {}) => (t.locale ?? D(), I(e))), L = () => "Review", _e = ((e = {}, t = {}) => (t.locale ?? D(), L(e))), R = () => "Send", ve = ((e = {}, t = {}) => (t.locale ?? D(), R(e))), z = () => "Sending…", ye = ((e = {}, t = {}) => (t.locale ?? D(), z(e))), B = () => "Sent", be = ((e = {}, t = {}) => (t.locale ?? D(), B(e))), V = () => "Subject", xe = ((e = {}, t = {}) => (t.locale ?? D(), V(e))), H = () => "To", Se = ((e = {}, t = {}) => (t.locale ?? D(), H(e))), Ce = T("<textarea></textarea>"), we = T("<div class=\"body editable svelte-17kuy6k\" role=\"button\" tabindex=\"0\"><!></div>"), Te = T("<div class=\"body svelte-17kuy6k\"><!></div>"), Ee = T("<li><!></li>"), De = T("<ul class=\"svelte-17kuy6k\"></ul>"), Oe = T("<br/>"), ke = T("<!><!>", 1), Ae = T("<p class=\"svelte-17kuy6k\"></p>"), je = T("<img class=\"avatar svelte-17kuy6k\" alt=\"\" decoding=\"async\"/>"), Me = T("<span class=\"to svelte-17kuy6k\"> </span>"), Ne = T("<div class=\"svelte-17kuy6k\"><dt class=\"svelte-17kuy6k\"> </dt> <dd class=\"svelte-17kuy6k\"> </dd></div>"), Pe = T("<div class=\"svelte-17kuy6k\"><dt class=\"svelte-17kuy6k\"> </dt> <dd class=\"subject svelte-17kuy6k\"> </dd></div>"), Fe = T("<dl class=\"fields svelte-17kuy6k\"><!> <!></dl> <!>", 1), Ie = T("<p class=\"who svelte-17kuy6k\"><strong> </strong><span class=\"when svelte-17kuy6k\"> </span></p>"), Le = T("<div class=\"message svelte-17kuy6k\"><!> <div class=\"said svelte-17kuy6k\"><!> <!></div></div>"), Re = T("<span class=\"handle svelte-17kuy6k\"> </span>"), ze = T("<div class=\"byline svelte-17kuy6k\"><!> <div class=\"names svelte-17kuy6k\"><strong> </strong> <!></div></div>"), Be = T("<!> <!>", 1), Ve = T("<p class=\"who svelte-17kuy6k\"><strong> </strong></p>"), He = T("<div class=\"comment svelte-17kuy6k\"><!> <!></div>"), Ue = T("<p class=\"note svelte-17kuy6k\" role=\"status\"> </p>"), We = T("<button type=\"button\" role=\"radio\" class=\"svelte-17kuy6k\"> </button>"), Ge = T("<div class=\"reviews nodrag nopan svelte-17kuy6k\" role=\"radiogroup\"></div>"), Ke = T("<span> </span>"), qe = T("<!> ", 1), Je = T("<article><header class=\"svelte-17kuy6k\"><!> <span class=\"where svelte-17kuy6k\"> </span> <!> <span class=\"state svelte-17kuy6k\"> </span></header> <!> <footer class=\"svelte-17kuy6k\"><!> <!> <!> <button type=\"button\" class=\"send nodrag nopan svelte-17kuy6k\"><!></button></footer></article>");
function U(f, T) {
	i(T, !0);
	let D = (t) => {
		var i = d(), a = y(i), s = (t) => {
			var n = Ce();
			re(n);
			let i;
			e(() => ne(n, () => m(M), (e) => C(M, e))), r(n, (e, t) => L?.(e, t), () => !j()), S(() => {
				i = w(n, 1, "body edit nodrag nopan nowheel svelte-17kuy6k", null, i, { inline: !j() }), _(n, "aria-label", m(U));
			}), o("blur", n, R), p("keydown", n, (e) => {
				e.key === "Escape" && e.currentTarget.blur();
			}), c(t, n);
		}, u = (e) => {
			var t = d(), r = y(t), i = (e) => {
				var t = we(), r = h(t);
				O(r), n(t), S((e) => _(t, "aria-label", e), [() => de()]), p("click", t, () => C(N, !0)), p("keydown", t, (e) => {
					(e.key === "Enter" || e.key === " ") && (e.preventDefault(), C(N, !0));
				}), c(e, t);
			}, a = (e) => {
				var t = Te(), r = h(t);
				O(r), n(t), c(e, t);
			};
			l(r, (e) => {
				m(P) ? e(i) : e(a, -1);
			}), c(e, t);
		};
		l(a, (e) => {
			m(P) && (j() || m(N)) ? e(s) : e(u, -1);
		}), c(t, i);
	}, O = (e) => {
		var r = d(), i = y(r);
		g(i, 17, () => m(Ye), t, (e, r) => {
			var i = d(), a = y(i), o = (e) => {
				var i = De();
				g(i, 21, () => m(r).items, t, (e, t) => {
					var r = Ee(), i = h(r);
					E(i, {
						get text() {
							return m(t);
						},
						plain: !0
					}), n(r), c(e, r);
				}), n(i), c(e, i);
			}, s = (e) => {
				var i = Ae();
				g(i, 21, () => m(r).lines, t, (e, t, n) => {
					var r = ke(), i = y(r), a = (e) => {
						var t = Oe();
						c(e, t);
					};
					l(i, (e) => {
						n && e(a);
					});
					var o = x(i);
					E(o, {
						get text() {
							return m(t);
						},
						plain: !0
					}), c(e, r);
				}), n(i), c(e, i);
			};
			l(a, (e) => {
				m(r).kind === "list" ? e(o) : e(s, -1);
			}), c(e, i);
		}), c(e, r);
	}, k = (e, t = u) => {
		var n = d(), r = y(n), i = (e) => {
			var n = je();
			S(() => {
				_(n, "src", T.object.author.picture.src), _(n, "width", t()), _(n, "height", t());
			}), c(e, n);
		};
		l(r, (e) => {
			T.object.author?.picture && e(i);
		}), c(e, n);
	}, A = b(T, "actions", 19, () => ({})), j = b(T, "centre", 3, !1), M = v(() => T.object.body), N = te(!1), P = v(() => !!A().write && (T.object.send ?? "draft") === "draft"), F = [
		"comment",
		"approve",
		"request_changes"
	], I = (e) => e === "approve" ? ce() : e === "request_changes" ? ge() : le();
	function L(e, t) {
		let n = () => {
			e.style.blockSize = "auto", e.style.blockSize = `${e.scrollHeight}px`;
		};
		return n(), t && (e.focus({ preventScroll: !0 }), e.setSelectionRange(e.value.length, e.value.length)), e.addEventListener("input", n), { destroy: () => e.removeEventListener("input", n) };
	}
	let R = () => {
		m(M) !== T.object.body && A().write?.(T.object.id, m(M)), j() || C(N, !1);
	}, z = {
		slack: "slack.com",
		email: "mail.google.com",
		linkedin: "linkedin.com",
		x: "x.com",
		github: "github.com",
		message: ""
	}, B = v(() => z[T.object.destination]), V = v(() => T.object.send ?? "draft"), H = v(() => T.object.destination === "linkedin" || T.object.destination === "x" ? he() : T.object.destination === "github" ? I(T.object.review ?? "comment") : ve()), U = v(() => T.object.destination === "slack" ? "Slack" : T.object.destination === "email" ? fe() : T.object.destination === "linkedin" ? "LinkedIn" : T.object.destination === "x" ? "X" : T.object.destination === "github" ? "GitHub" : pe()), Ye = v(() => oe(T.object.body)), W = v(() => T.object.destination === "x" ? 280 - [...T.object.body].length : null);
	var G = Je(), K = h(G), q = h(K), Xe = (e) => {
		ae(e, {
			get address() {
				return m(B);
			},
			size: 16
		});
	};
	l(q, (e) => {
		m(B) && e(Xe);
	});
	var J = x(q, 2), Ze = h(J, !0);
	n(J);
	var Y = x(J, 2), Qe = (e) => {
		var t = Me(), r = h(t, !0);
		n(t), S(() => a(r, T.object.to)), c(e, t);
	};
	l(Y, (e) => {
		T.object.to && T.object.destination !== "email" && e(Qe);
	});
	var X = x(Y, 2), $e = h(X, !0);
	n(X), n(K);
	var Z = x(K, 2), et = (e) => {
		var t = Fe(), r = y(t), i = h(r), o = (e) => {
			var t = Ne(), r = h(t), i = h(r, !0);
			n(r);
			var o = x(r, 2), s = h(o, !0);
			n(o), n(t), S((e) => {
				a(i, e), a(s, T.object.to);
			}, [() => Se()]), c(e, t);
		};
		l(i, (e) => {
			T.object.to && e(o);
		});
		var s = x(i, 2), u = (e) => {
			var t = Pe(), r = h(t), i = h(r, !0);
			n(r);
			var o = x(r, 2), s = h(o, !0);
			n(o), n(t), S((e) => {
				a(i, e), a(s, T.object.subject);
			}, [() => xe()]), c(e, t);
		};
		l(s, (e) => {
			T.object.subject && e(u);
		}), n(r);
		var d = x(r, 2);
		D(d), c(e, t);
	}, tt = (e) => {
		var t = Le(), r = h(t);
		k(r, () => 32);
		var i = x(r, 2), o = h(i), s = (e) => {
			var t = Ie(), r = h(t), i = h(r, !0);
			n(r);
			var o = x(r), s = h(o, !0);
			n(o), n(t), S((e) => {
				a(i, T.object.author.name), a(s, e);
			}, [() => me()]), c(e, t);
		};
		l(o, (e) => {
			T.object.author && e(s);
		});
		var u = x(o, 2);
		D(u), n(i), n(t), c(e, t);
	}, nt = (e) => {
		var t = Be(), r = y(t), i = (e) => {
			var t = ze(), r = h(t);
			k(r, () => 40);
			var i = x(r, 2), o = h(i), s = h(o, !0);
			n(o);
			var u = x(o, 2), d = (e) => {
				var t = Re(), r = h(t, !0);
				n(t), S(() => a(r, T.object.author.handle)), c(e, t);
			};
			l(u, (e) => {
				T.object.author.handle && e(d);
			}), n(i), n(t), S(() => a(s, T.object.author.name)), c(e, t);
		};
		l(r, (e) => {
			T.object.author && e(i);
		});
		var o = x(r, 2);
		D(o), c(e, t);
	}, rt = (e) => {
		var t = He(), r = h(t), i = (e) => {
			var t = Ve(), r = h(t), i = h(r, !0);
			n(r), n(t), S(() => a(i, T.object.author.name)), c(e, t);
		};
		l(r, (e) => {
			T.object.author && e(i);
		});
		var o = x(r, 2);
		D(o), n(t), c(e, t);
	};
	l(Z, (e) => {
		T.object.destination === "email" ? e(et) : T.object.destination === "slack" || T.object.destination === "message" ? e(tt, 1) : T.object.destination === "linkedin" || T.object.destination === "x" ? e(nt, 2) : e(rt, -1);
	});
	var it = x(Z, 2), at = h(it), ot = (e) => {
		var t = Ue(), r = h(t, !0);
		n(t), S(() => a(r, T.object.note)), c(e, t);
	};
	l(at, (e) => {
		T.object.note && e(ot);
	});
	var st = x(at, 2), ct = (e) => {
		var t = Ge();
		g(t, 20, () => F, (e) => e, (e, t) => {
			var r = We(), i = h(r, !0);
			n(r), S((e) => {
				_(r, "aria-checked", (T.object.review ?? "comment") === t), a(i, e);
			}, [() => I(t)]), p("click", r, () => A().review?.(T.object.id, t)), c(e, r);
		}), n(t), S((e) => _(t, "aria-label", e), [() => _e()]), c(e, t);
	};
	l(st, (e) => {
		T.object.destination === "github" && A().review && (T.object.send ?? "draft") === "draft" && e(ct);
	});
	var Q = x(st, 2), lt = (e) => {
		var t = Ke();
		let r;
		var i = h(t, !0);
		n(t), S(() => {
			r = w(t, 1, "count svelte-17kuy6k", null, r, { over: m(W) < 0 }), a(i, m(W));
		}), c(e, t);
	};
	l(Q, (e) => {
		m(W) !== null && e(lt);
	});
	var $ = x(Q, 2), ut = h($), dt = (e) => {
		var t = qe(), n = y(t);
		ie(n, {
			get icon() {
				return se;
			},
			size: 13
		});
		var r = x(n, 1, !0);
		S((e) => a(r, e), [() => be()]), c(e, t);
	}, ft = (e) => {
		var t = s();
		S((e) => a(t, e), [() => ye()]), c(e, t);
	}, pt = (e) => {
		var t = s();
		S(() => a(t, m(H))), c(e, t);
	};
	l(ut, (e) => {
		m(V) === "sent" ? e(dt) : m(V) === "sending" ? e(ft, 1) : e(pt, -1);
	}), n($), n(it), n(G), S((e) => {
		w(G, 1, `draft ${T.object.destination ?? ""}`, "svelte-17kuy6k"), _(G, "aria-label", m(U)), a(Ze, m(U)), a($e, e), $.disabled = m(V) !== "draft" || m(W) !== null && m(W) < 0;
	}, [() => ue()]), p("click", $, () => A().send?.(T.object.id)), c(f, G), ee();
}
f(["keydown", "click"]);
export { U as default };
