import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, F as n, H as r, J as i, L as a, Mt as o, P as s, S as c, U as l, W as u, X as d, Y as f, _ as p, bt as m, h, ht as g, jt as _, lt as v, m as y, mt as b, pt as x, r as S, rt as C, s as w, tt as T, u as E, vt as D, zt as O } from "./index-client-DH73-vTM.js";
import { t as k } from "./Icon-D2j1Ej6Z.js";
import { r as A } from "./index-client-AzfegT-i.js";
import "./Icon-CmjKIKuh.js";
import { t as j } from "./MakeTasks-CZ2ztwgI.js";
import { t as M } from "./Mark-y83oESZj.js";
import { t as N } from "./work_env_open-CZM6S6RQ.js";
import { t as P } from "./work_list_open_in-Bj6MoqBE.js";
import { t as F } from "./Title-B4cGdolK.js";
import { t as I } from "./Tick02Icon-D7tHNRMx.js";
import { t as L } from "./ArrowUpRight01Icon-DgTzXYx_.js";
import { t as R } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_block_add_item.js
var z = () => "Add an item", B = ((e = {}, t = {}) => (t.locale ?? R(), z(e))), V = () => "Priority", H = ((e = {}, t = {}) => (t.locale ?? R(), V(e))), U = () => "Show answer", W = ((e = {}, t = {}) => (t.locale ?? R(), U(e))), G = u("<h3 class=\"svelte-uvek3x\"> </h3>"), K = u("<span class=\"count svelte-uvek3x\"> </span>"), q = u("<li><button type=\"button\" class=\"box nodrag nopan svelte-uvek3x\"><!></button> <input class=\"text nodrag nopan svelte-uvek3x\"/></li>"), J = u("<section class=\"checklist svelte-uvek3x\"><header class=\"svelte-uvek3x\"><!> <!></header> <ul class=\"svelte-uvek3x\"></ul> <label class=\"add svelte-uvek3x\"><span class=\"box ghost svelte-uvek3x\" aria-hidden=\"true\"></span> <input class=\"text nodrag nopan svelte-uvek3x\"/></label></section>");
function Y(i, l) {
	o(l, !0);
	let u = m(void 0), b = m(""), S = t(() => l.object.items.filter((e) => e.done).length);
	function A(e) {
		l.actions.edit?.(l.object.id, (t) => t.kind === "list" ? {
			...t,
			items: e([...t.items])
		} : t);
	}
	async function j(e) {
		await C();
		let t = T(u)?.querySelector(`[data-item="${e}"]`);
		t?.focus(), t?.setSelectionRange(t.value.length, t.value.length);
	}
	let M = (e) => A((t) => t.map((t, n) => n === e ? {
		...t,
		done: !t.done
	} : t));
	function N(e, t) {
		let n = t.trim();
		n !== l.object.items[e]?.title && A((t) => n ? t.map((t, r) => r === e ? {
			...t,
			title: n
		} : t) : t.filter((t, n) => n !== e));
	}
	function P(e, t) {
		let n = e.currentTarget;
		if (e.key === "Enter") {
			e.preventDefault();
			let r = n.value.trim();
			if (!r) return;
			A((e) => {
				let n = e.map((e, n) => n === t ? {
					...e,
					title: r
				} : e);
				return n.splice(t + 1, 0, { title: "" }), n;
			}), j(t + 1);
		} else e.key === "Backspace" && !n.value ? (e.preventDefault(), A((e) => e.filter((e, n) => n !== t)), j(Math.max(0, t - 1))) : e.key === "Escape" && n.blur();
	}
	function F(e) {
		if (e.key !== "Enter") return;
		e.preventDefault();
		let t = T(b).trim();
		t && (A((e) => [...e, { title: t }]), D(b, ""));
	}
	var L = J(), R = x(L), z = x(R), V = (t) => {
		var n = G(), i = x(n, !0);
		O(n), v(() => e(i, l.object.title)), r(t, n);
	};
	a(z, (e) => {
		l.object.title && e(V);
	});
	var H = g(z, 2), U = (t) => {
		var n = K(), i = x(n);
		O(n), v(() => e(i, `${T(S) ?? ""}/${l.object.items.length ?? ""}`)), r(t, n);
	};
	a(H, (e) => {
		l.object.items.length && e(U);
	}), O(R);
	var W = g(R, 2);
	s(W, 21, () => l.object.items, n, (e, t, n) => {
		var i = q();
		let o;
		var s = x(i), l = x(s), u = (e) => {
			k(e, {
				get icon() {
					return I;
				},
				size: 12
			});
		};
		a(l, (e) => {
			T(t).done && e(u);
		}), O(s);
		var m = g(s, 2);
		y(m), h(m, "data-item", n), O(i), v(() => {
			o = c(i, 1, "svelte-uvek3x", null, o, { done: T(t).done }), h(s, "aria-pressed", !!T(t).done), h(s, "aria-label", T(t).title), p(m, T(t).title), h(m, "aria-label", T(t).title);
		}), f("click", s, () => M(n)), d("blur", m, (e) => N(n, e.currentTarget.value)), f("keydown", m, (e) => P(e, n)), r(e, i);
	}), O(W);
	var Y = g(W, 2), X = g(x(Y), 2);
	y(X), O(Y), O(L), w(L, (e) => D(u, e), () => T(u)), v((e) => {
		h(L, "aria-label", l.object.title), h(X, "placeholder", e);
	}, [() => B()]), f("keydown", X, F), E(X, () => T(b), (e) => D(b, e)), r(i, L), _();
}
i(["click", "keydown"]);
// upstream/src/features/work/components/objects/List.svelte
var X = u("<span class=\"hint svelte-ddoo8x\"> </span>"), Z = u("<li class=\"svelte-ddoo8x\"><button type=\"button\"><span class=\"face obverse svelte-ddoo8x\"><span class=\"number svelte-ddoo8x\"></span> <span class=\"question svelte-ddoo8x\"> </span> <!></span> <span class=\"face reverse svelte-ddoo8x\"><span class=\"asked svelte-ddoo8x\"> </span> <span class=\"answer svelte-ddoo8x\"> </span></span></button></li>"), Q = u("<ol class=\"cards svelte-ddoo8x\"></ol>"), $ = u("<button type=\"button\" class=\"box nodrag nopan svelte-ddoo8x\"><!></button>"), ee = u("<span class=\"box svelte-ddoo8x\" aria-hidden=\"true\"><!></span>"), te = u("<span class=\"lead svelte-ddoo8x\" aria-hidden=\"true\"></span>"), ne = u("<span class=\"priority svelte-ddoo8x\"> </span>"), re = u("<span class=\"due svelte-ddoo8x\"> </span>"), ie = u("<span class=\"when svelte-ddoo8x\"><!><!></span>"), ae = u("<p class=\"detail svelte-ddoo8x\"> </p>"), oe = u("<a class=\"back nodrag svelte-ddoo8x\"><!></a>"), se = u("<blockquote class=\"svelte-ddoo8x\"> </blockquote>"), ce = u("<div class=\"from svelte-ddoo8x\"><!> <span class=\"who\"> </span> <!></div> <!>", 1), le = u("<li><!> <div class=\"body svelte-ddoo8x\"><div class=\"line svelte-ddoo8x\"><h4 class=\"svelte-ddoo8x\"> </h4> <!></div> <!> <!></div></li>"), ue = u("<ul class=\"items svelte-ddoo8x\"></ul>"), de = u("<footer class=\"svelte-ddoo8x\"><!></footer>"), fe = u("<section><!> <!> <!></section>");
function pe(i, u) {
	o(u, !0);
	let d = S(u, "actions", 19, () => ({})), p = S(u, "centre", 3, !1), m = t(() => u.object.style === "todo"), y = t(() => u.object.style === "questions"), C = new A(), w = (e) => {
		C.delete(e) || C.add(e);
	}, E = (e) => (t) => {
		d().link && (t.preventDefault(), d().link(e));
	};
	var D = l(), R = b(D), z = (e) => {
		Y(e, {
			get object() {
				return u.object;
			},
			get actions() {
				return d();
			}
		});
	}, B = (i) => {
		var o = fe();
		let _;
		var S = x(o), D = (e) => {
			F(e, { get text() {
				return u.object.title;
			} });
		};
		a(S, (e) => {
			u.object.title && e(D);
		});
		var A = g(S, 2), R = (t) => {
			var i = Q();
			s(i, 21, () => u.object.items, n, (t, n, i) => {
				var o = Z(), s = x(o);
				let l;
				var u = x(s), d = x(u);
				d.textContent = i + 1;
				var p = g(d, 2), m = x(p, !0);
				O(p);
				var _ = g(p, 2), y = (t) => {
					var n = X(), i = x(n, !0);
					O(n), v((t) => e(i, t), [() => W()]), r(t, n);
				};
				a(_, (e) => {
					T(n).detail && e(y);
				}), O(u);
				var b = g(u, 2), S = x(b), E = x(S, !0);
				O(S);
				var D = g(S, 2), k = x(D, !0);
				O(D), O(b), O(s), O(o), v((t, r, i, a) => {
					l = c(s, 1, "card nodrag nopan svelte-ddoo8x", null, l, t), h(s, "aria-pressed", r), h(u, "aria-hidden", i), e(m, T(n).title), h(b, "aria-hidden", a), e(E, T(n).title), e(k, T(n).detail ?? "");
				}, [
					() => ({ turned: C.has(i) }),
					() => C.has(i),
					() => C.has(i),
					() => !C.has(i)
				]), f("click", s, () => w(i)), r(t, o);
			}), O(i), r(t, i);
		}, z = (i) => {
			var o = ue();
			s(o, 21, () => u.object.items, n, (n, i, o) => {
				var s = le();
				let p;
				var _ = x(s), y = (e) => {
					var t = l(), n = b(t), s = (e) => {
						var t = $(), n = x(t), s = (e) => {
							k(e, {
								get icon() {
									return I;
								},
								size: 12
							});
						};
						a(n, (e) => {
							T(i).done && e(s);
						}), O(t), v(() => {
							h(t, "aria-pressed", !!T(i).done), h(t, "aria-label", T(i).title);
						}), f("click", t, () => d().check?.(u.object.id, o, !T(i).done)), r(e, t);
					}, c = (e) => {
						var t = ee(), n = x(t), o = (e) => {
							k(e, {
								get icon() {
									return I;
								},
								size: 12
							});
						};
						a(n, (e) => {
							T(i).done && e(o);
						}), O(t), r(e, t);
					};
					a(n, (e) => {
						d().check ? e(s) : e(c, -1);
					}), r(e, t);
				}, S = (e) => {
					var t = te();
					r(e, t);
				};
				a(_, (e) => {
					T(m) ? e(y) : e(S, -1);
				});
				var C = g(_, 2), w = x(C), D = x(w), A = x(D, !0);
				O(D);
				var j = g(D, 2), F = (t) => {
					var n = ie(), o = x(n), s = (t) => {
						var n = ne(), i = x(n, !0);
						O(n), v((t) => e(i, t), [() => H()]), r(t, n);
					};
					a(o, (e) => {
						T(i).priority === "high" && e(s);
					});
					var c = g(o), l = (t) => {
						var n = re(), a = x(n, !0);
						O(n), v(() => e(a, T(i).due)), r(t, n);
					};
					a(c, (e) => {
						T(i).due && e(l);
					}), O(n), r(t, n);
				};
				a(j, (e) => {
					(T(i).priority === "high" || T(i).due) && e(F);
				}), O(w);
				var R = g(w, 2), z = (t) => {
					var n = ae(), a = x(n, !0);
					O(n), v(() => e(a, T(i).detail)), r(t, n);
				};
				a(R, (e) => {
					T(i).detail && e(z);
				});
				var B = g(R, 2), V = (n) => {
					let o = t(() => T(i).from);
					var s = ce(), c = b(s), l = x(c), u = (e) => {
						M(e, {
							get address() {
								return T(o).host;
							},
							size: 14
						});
					};
					a(l, (e) => {
						T(o).host && e(u);
					});
					var d = g(l, 2), p = x(d, !0);
					O(d);
					var m = g(d, 2), _ = (e) => {
						var n = oe(), i = t(() => E(T(o).url)), a = x(n);
						k(a, {
							get icon() {
								return L;
							},
							size: 13
						}), O(n), v((e) => {
							h(n, "href", T(o).url), h(n, "title", e);
						}, [() => T(o).app ? P({ app: T(o).app }) : N()]), f("click", n, function(...e) {
							T(i)?.apply(this, e);
						}), r(e, n);
					};
					a(m, (e) => {
						T(o).url && e(_);
					}), O(c);
					var y = g(c, 2), S = (t) => {
						var n = se(), i = x(n, !0);
						O(n), v(() => e(i, T(o).quote)), r(t, n);
					};
					a(y, (e) => {
						T(o).quote && e(S);
					}), v((t) => e(p, t), [() => [
						T(o).who,
						T(o).app,
						T(o).when
					].filter(Boolean).join(" · ")]), r(n, s);
				};
				a(B, (e) => {
					T(i).from && e(V);
				}), O(C), O(s), v(() => {
					p = c(s, 1, "svelte-ddoo8x", null, p, { done: T(i).done }), e(A, T(i).title);
				}), r(n, s);
			}), O(o), r(i, o);
		};
		a(A, (e) => {
			T(y) ? e(R) : e(z, -1);
		});
		var B = g(A, 2), V = (e) => {
			var t = de(), n = x(t);
			j(n, { get id() {
				return u.object.id;
			} }), O(t), r(e, t);
		};
		a(B, (e) => {
			T(m) && !p() && e(V);
		}), O(o), v(() => {
			_ = c(o, 1, "list svelte-ddoo8x", null, _, { deck: T(y) }), h(o, "aria-label", u.object.title);
		}), r(i, o);
	};
	a(R, (e) => {
		d().edit && T(m) ? e(z) : e(B, -1);
	}), r(i, D), _();
}
i(["click"]);
export { pe as default };
