import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, Dt as n, E as r, F as i, H as a, J as o, L as s, Mt as c, P as l, S as u, U as d, W as f, Wt as ee, X as te, Y as p, bt as ne, h as m, ht as h, jt as re, lt as g, mt as _, ot as ie, pt as v, q as y, r as b, tt as x, u as ae, vt as S, zt as C } from "./index-client-DH73-vTM.js";
import { t as oe } from "./Icon-D2j1Ej6Z.js";
import "./Icon-CmjKIKuh.js";
import { t as w } from "./Inline-GGUrbZg2.js";
import { t as se } from "./Mark-y83oESZj.js";
import { t as ce } from "./markdown-C0lHpopA.js";
import { t as le } from "./Tick02Icon-D7tHNRMx.js";
import { t as T } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_draft_approve.js
var E = () => "Approve", ue = ((e = {}, t = {}) => (t.locale ?? T(), E(e))), D = () => "Comment", de = ((e = {}, t = {}) => (t.locale ?? T(), D(e))), O = () => "Draft", fe = ((e = {}, t = {}) => (t.locale ?? T(), O(e))), k = () => "Edit the draft", pe = ((e = {}, t = {}) => (t.locale ?? T(), k(e))), A = () => "Email", me = ((e = {}, t = {}) => (t.locale ?? T(), A(e))), j = () => "Message", he = ((e = {}, t = {}) => (t.locale ?? T(), j(e))), M = () => "now", ge = ((e = {}, t = {}) => (t.locale ?? T(), M(e))), N = () => "Post", _e = ((e = {}, t = {}) => (t.locale ?? T(), N(e))), P = () => "Request changes", ve = ((e = {}, t = {}) => (t.locale ?? T(), P(e))), F = () => "Review", ye = ((e = {}, t = {}) => (t.locale ?? T(), F(e))), I = () => "Send", be = ((e = {}, t = {}) => (t.locale ?? T(), I(e))), L = () => "Sending…", xe = ((e = {}, t = {}) => (t.locale ?? T(), L(e))), R = () => "Sent", Se = ((e = {}, t = {}) => (t.locale ?? T(), R(e))), z = () => "Subject", Ce = ((e = {}, t = {}) => (t.locale ?? T(), z(e))), B = () => "To", we = ((e = {}, t = {}) => (t.locale ?? T(), B(e))), Te = f("<textarea></textarea>"), Ee = f("<div class=\"body editable svelte-17kuy6k\" role=\"button\" tabindex=\"0\"><!></div>"), De = f("<div class=\"body svelte-17kuy6k\"><!></div>"), Oe = f("<li><!></li>"), ke = f("<ul class=\"svelte-17kuy6k\"></ul>"), Ae = f("<br/>"), je = f("<!><!>", 1), Me = f("<p class=\"svelte-17kuy6k\"></p>"), Ne = f("<img class=\"avatar svelte-17kuy6k\" alt=\"\" decoding=\"async\"/>"), Pe = f("<span class=\"to svelte-17kuy6k\"> </span>"), Fe = f("<div class=\"svelte-17kuy6k\"><dt class=\"svelte-17kuy6k\"> </dt> <dd class=\"svelte-17kuy6k\"> </dd></div>"), Ie = f("<div class=\"svelte-17kuy6k\"><dt class=\"svelte-17kuy6k\"> </dt> <dd class=\"subject svelte-17kuy6k\"> </dd></div>"), Le = f("<dl class=\"fields svelte-17kuy6k\"><!> <!></dl> <!>", 1), Re = f("<p class=\"who svelte-17kuy6k\"><strong> </strong><span class=\"when svelte-17kuy6k\"> </span></p>"), ze = f("<div class=\"message svelte-17kuy6k\"><!> <div class=\"said svelte-17kuy6k\"><!> <!></div></div>"), Be = f("<span class=\"handle svelte-17kuy6k\"> </span>"), Ve = f("<div class=\"byline svelte-17kuy6k\"><!> <div class=\"names svelte-17kuy6k\"><strong> </strong> <!></div></div>"), He = f("<!> <!>", 1), Ue = f("<p class=\"who svelte-17kuy6k\"><strong> </strong></p>"), We = f("<div class=\"comment svelte-17kuy6k\"><!> <!></div>"), Ge = f("<p class=\"note svelte-17kuy6k\" role=\"status\"> </p>"), Ke = f("<button type=\"button\" role=\"radio\" class=\"svelte-17kuy6k\"> </button>"), qe = f("<div class=\"reviews nodrag nopan svelte-17kuy6k\" role=\"radiogroup\"></div>"), Je = f("<span> </span>"), Ye = f("<!> ", 1), Xe = f("<article><header class=\"svelte-17kuy6k\"><!> <span class=\"where svelte-17kuy6k\"> </span> <!> <span class=\"state svelte-17kuy6k\"> </span></header> <!> <footer class=\"svelte-17kuy6k\"><!> <!> <!> <button type=\"button\" class=\"send nodrag nopan svelte-17kuy6k\"><!></button></footer></article>");
function V(o, f) {
	c(f, !0);
	let T = (e) => {
		var t = d(), i = _(t), o = (e) => {
			var t = Te();
			n(t);
			let i;
			ie(() => ae(t, () => x(A), (e) => S(A, e))), r(t, (e, t) => F?.(e, t), () => !k()), g(() => {
				i = u(t, 1, "body edit nodrag nopan nowheel svelte-17kuy6k", null, i, { inline: !k() }), m(t, "aria-label", x(V));
			}), p("input", t, (e) => O().write?.(f.object.id, e.currentTarget.value)), te("blur", t, I), p("keydown", t, (e) => {
				e.key === "Escape" && e.currentTarget.blur();
			}), a(e, t);
		}, c = (e) => {
			var t = d(), n = _(t), r = (e) => {
				var t = Ee(), n = v(t);
				E(n), C(t), g((e) => m(t, "aria-label", e), [() => pe()]), p("click", t, () => S(j, !0)), p("keydown", t, (e) => {
					(e.key === "Enter" || e.key === " ") && (e.preventDefault(), S(j, !0));
				}), a(e, t);
			}, i = (e) => {
				var t = De(), n = v(t);
				E(n), C(t), a(e, t);
			};
			s(n, (e) => {
				x(M) ? e(r) : e(i, -1);
			}), a(e, t);
		};
		s(i, (e) => {
			x(M) && (k() || x(j)) ? e(o) : e(c, -1);
		}), a(e, t);
	}, E = (e) => {
		var t = d(), n = _(t);
		l(n, 17, () => x(Ze), i, (e, t) => {
			var n = d(), r = _(n), o = (e) => {
				var n = ke();
				l(n, 21, () => x(t).items, i, (e, t) => {
					var n = Oe(), r = v(n);
					w(r, {
						get text() {
							return x(t);
						},
						plain: !0
					}), C(n), a(e, n);
				}), C(n), a(e, n);
			}, c = (e) => {
				var n = Me();
				l(n, 21, () => x(t).lines, i, (e, t, n) => {
					var r = je(), i = _(r), o = (e) => {
						var t = Ae();
						a(e, t);
					};
					s(i, (e) => {
						n && e(o);
					});
					var c = h(i);
					w(c, {
						get text() {
							return x(t);
						},
						plain: !0
					}), a(e, r);
				}), C(n), a(e, n);
			};
			s(r, (e) => {
				x(t).kind === "list" ? e(o) : e(c, -1);
			}), a(e, n);
		}), a(e, t);
	}, D = (e, t = ee) => {
		var n = d(), r = _(n), i = (e) => {
			var n = Ne();
			g(() => {
				m(n, "src", f.object.author.picture.src), m(n, "width", t()), m(n, "height", t());
			}), a(e, n);
		};
		s(r, (e) => {
			f.object.author?.picture && e(i);
		}), a(e, n);
	}, O = b(f, "actions", 19, () => ({})), k = b(f, "centre", 3, !1), A = t(() => f.object.body), j = ne(!1), M = t(() => !!O().write && (f.object.send ?? "draft") === "draft"), N = [
		"comment",
		"approve",
		"request_changes"
	], P = (e) => e === "approve" ? ue() : e === "request_changes" ? ve() : de();
	function F(e, t) {
		let n = () => {
			e.style.blockSize = "auto", e.style.blockSize = `${e.scrollHeight}px`;
		};
		return n(), t && (e.focus({ preventScroll: !0 }), e.setSelectionRange(e.value.length, e.value.length)), e.addEventListener("input", n), { destroy: () => e.removeEventListener("input", n) };
	}
	let I = () => {
		x(A) !== f.object.body && O().write?.(f.object.id, x(A)), k() || S(j, !1);
	}, L = {
		slack: "slack.com",
		email: "mail.google.com",
		linkedin: "linkedin.com",
		x: "x.com",
		github: "github.com",
		message: ""
	}, R = t(() => L[f.object.destination]), z = t(() => f.object.send ?? "draft"), B = t(() => f.object.destination === "linkedin" || f.object.destination === "x" ? _e() : f.object.destination === "github" ? P(f.object.review ?? "comment") : be()), V = t(() => f.object.destination === "slack" ? "Slack" : f.object.destination === "email" ? me() : f.object.destination === "linkedin" ? "LinkedIn" : f.object.destination === "x" ? "X" : f.object.destination === "github" ? "GitHub" : he()), Ze = t(() => ce(f.object.body)), H = t(() => f.object.destination === "x" ? 280 - [...f.object.body].length : null);
	var U = Xe(), W = v(U), G = v(W), Qe = (e) => {
		se(e, {
			get address() {
				return x(R);
			},
			size: 16
		});
	};
	s(G, (e) => {
		x(R) && e(Qe);
	});
	var K = h(G, 2), $e = v(K, !0);
	C(K);
	var q = h(K, 2), et = (t) => {
		var n = Pe(), r = v(n, !0);
		C(n), g(() => e(r, f.object.to)), a(t, n);
	};
	s(q, (e) => {
		f.object.to && f.object.destination !== "email" && e(et);
	});
	var J = h(q, 2), tt = v(J, !0);
	C(J), C(W);
	var Y = h(W, 2), nt = (t) => {
		var n = Le(), r = _(n), i = v(r), o = (t) => {
			var n = Fe(), r = v(n), i = v(r, !0);
			C(r);
			var o = h(r, 2), s = v(o, !0);
			C(o), C(n), g((t) => {
				e(i, t), e(s, f.object.to);
			}, [() => we()]), a(t, n);
		};
		s(i, (e) => {
			f.object.to && e(o);
		});
		var c = h(i, 2), l = (t) => {
			var n = Ie(), r = v(n), i = v(r, !0);
			C(r);
			var o = h(r, 2), s = v(o, !0);
			C(o), C(n), g((t) => {
				e(i, t), e(s, f.object.subject);
			}, [() => Ce()]), a(t, n);
		};
		s(c, (e) => {
			f.object.subject && e(l);
		}), C(r);
		var u = h(r, 2);
		T(u), a(t, n);
	}, rt = (t) => {
		var n = ze(), r = v(n);
		D(r, () => 32);
		var i = h(r, 2), o = v(i), c = (t) => {
			var n = Re(), r = v(n), i = v(r, !0);
			C(r);
			var o = h(r), s = v(o, !0);
			C(o), C(n), g((t) => {
				e(i, f.object.author.name), e(s, t);
			}, [() => ge()]), a(t, n);
		};
		s(o, (e) => {
			f.object.author && e(c);
		});
		var l = h(o, 2);
		T(l), C(i), C(n), a(t, n);
	}, it = (t) => {
		var n = He(), r = _(n), i = (t) => {
			var n = Ve(), r = v(n);
			D(r, () => 40);
			var i = h(r, 2), o = v(i), c = v(o, !0);
			C(o);
			var l = h(o, 2), u = (t) => {
				var n = Be(), r = v(n, !0);
				C(n), g(() => e(r, f.object.author.handle)), a(t, n);
			};
			s(l, (e) => {
				f.object.author.handle && e(u);
			}), C(i), C(n), g(() => e(c, f.object.author.name)), a(t, n);
		};
		s(r, (e) => {
			f.object.author && e(i);
		});
		var o = h(r, 2);
		T(o), a(t, n);
	}, at = (t) => {
		var n = We(), r = v(n), i = (t) => {
			var n = Ue(), r = v(n), i = v(r, !0);
			C(r), C(n), g(() => e(i, f.object.author.name)), a(t, n);
		};
		s(r, (e) => {
			f.object.author && e(i);
		});
		var o = h(r, 2);
		T(o), C(n), a(t, n);
	};
	s(Y, (e) => {
		f.object.destination === "email" ? e(nt) : f.object.destination === "slack" || f.object.destination === "message" ? e(rt, 1) : f.object.destination === "linkedin" || f.object.destination === "x" ? e(it, 2) : e(at, -1);
	});
	var X = h(Y, 2), Z = v(X), ot = (t) => {
		var n = Ge(), r = v(n, !0);
		C(n), g(() => e(r, f.object.note)), a(t, n);
	};
	s(Z, (e) => {
		f.object.note && e(ot);
	});
	var st = h(Z, 2), ct = (t) => {
		var n = qe();
		l(n, 20, () => N, (e) => e, (t, n) => {
			var r = Ke(), i = v(r, !0);
			C(r), g((t) => {
				m(r, "aria-checked", (f.object.review ?? "comment") === n), e(i, t);
			}, [() => P(n)]), p("click", r, () => O().review?.(f.object.id, n)), a(t, r);
		}), C(n), g((e) => m(n, "aria-label", e), [() => ye()]), a(t, n);
	};
	s(st, (e) => {
		f.object.destination === "github" && O().review && (f.object.send ?? "draft") === "draft" && e(ct);
	});
	var Q = h(st, 2), lt = (t) => {
		var n = Je();
		let r;
		var i = v(n, !0);
		C(n), g(() => {
			r = u(n, 1, "count svelte-17kuy6k", null, r, { over: x(H) < 0 }), e(i, x(H));
		}), a(t, n);
	};
	s(Q, (e) => {
		x(H) !== null && e(lt);
	});
	var $ = h(Q, 2), ut = v($), dt = (t) => {
		var n = Ye(), r = _(n);
		oe(r, {
			get icon() {
				return le;
			},
			size: 13
		});
		var i = h(r, 1, !0);
		g((t) => e(i, t), [() => Se()]), a(t, n);
	}, ft = (t) => {
		var n = y();
		g((t) => e(n, t), [() => xe()]), a(t, n);
	}, pt = (t) => {
		var n = y();
		g(() => e(n, x(B))), a(t, n);
	};
	s(ut, (e) => {
		x(z) === "sent" ? e(dt) : x(z) === "sending" ? e(ft, 1) : e(pt, -1);
	}), C($), C(X), C(U), g((t) => {
		u(U, 1, `draft ${f.object.destination ?? ""}`, "svelte-17kuy6k"), m(U, "aria-label", x(V)), e($e, x(V)), e(tt, t), $.disabled = x(z) !== "draft" || x(H) !== null && x(H) < 0;
	}, [() => fe()]), p("click", $, () => O().send?.(f.object.id)), a(o, U), re();
}
o([
	"input",
	"keydown",
	"click"
]);
export { V as default };
