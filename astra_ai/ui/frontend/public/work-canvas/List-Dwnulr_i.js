import "./disclose-version-DFvUDwEH.js";
import { A as e, At as t, Ct as n, F as r, G as i, L as a, M as o, R as s, St as c, U as l, W as u, X as d, Y as f, at as p, ft as m, h, k as g, l as _, m as v, mt as y, ot as b, p as x, r as S, s as C, st as w, tt as T, ut as E, y as D, z as O } from "./index-client-BSGo5gVb.js";
import { r as k } from "./index-client-CT6TpZ12.js";
import { t as A } from "./Icon-BWISRU-8.js";
import { t as j } from "./MakeTasks-D0aGM3GJ.js";
import { t as M } from "./Mark-DBYTxnH7.js";
import { t as N } from "./Title-3U-zV-ZX.js";
import { t as P } from "./work_env_open-CZM6S6RQ.js";
import { t as F } from "./work_list_open_in-Bj6MoqBE.js";
import { t as I } from "./Tick02Icon-COqFGcdx.js";
import { t as L } from "./ArrowUpRight01Icon-BuQKjoN4.js";
import { t as R } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_block_add_item.js
var z = () => "Add an item", B = ((e = {}, t = {}) => (t.locale ?? R(), z(e))), V = () => "Priority", H = ((e = {}, t = {}) => (t.locale ?? R(), V(e))), U = () => "Show answer", W = ((e = {}, t = {}) => (t.locale ?? R(), U(e))), G = O("<h3 class=\"svelte-uvek3x\"> </h3>"), K = O("<span class=\"count svelte-uvek3x\"> </span>"), q = O("<li><button type=\"button\" class=\"box nodrag nopan svelte-uvek3x\"><!></button> <input class=\"text nodrag nopan svelte-uvek3x\"/></li>"), J = O("<section class=\"checklist svelte-uvek3x\"><header class=\"svelte-uvek3x\"><!> <!></header> <ul class=\"svelte-uvek3x\"></ul> <label class=\"add svelte-uvek3x\"><span class=\"box ghost svelte-uvek3x\" aria-hidden=\"true\"></span> <input class=\"text nodrag nopan svelte-uvek3x\"/></label></section>");
function Y(s, l) {
	n(l, !0);
	let b = m(void 0), S = m(""), O = y(() => l.object.items.filter((e) => e.done).length);
	function k(e) {
		l.actions.edit?.(l.object.id, (t) => t.kind === "list" ? {
			...t,
			items: e([...t.items])
		} : t);
	}
	async function j(e) {
		await d();
		let t = f(b)?.querySelector(`[data-item="${e}"]`);
		t?.focus(), t?.setSelectionRange(t.value.length, t.value.length);
	}
	let M = (e) => k((t) => t.map((t, n) => n === e ? {
		...t,
		done: !t.done
	} : t));
	function N(e, t) {
		let n = t.trim();
		n !== l.object.items[e]?.title && k((t) => n ? t.map((t, r) => r === e ? {
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
			k((e) => {
				let n = e.map((e, n) => n === t ? {
					...e,
					title: r
				} : e);
				return n.splice(t + 1, 0, { title: "" }), n;
			}), j(t + 1);
		} else e.key === "Backspace" && !n.value ? (e.preventDefault(), k((e) => e.filter((e, n) => n !== t)), j(Math.max(0, t - 1))) : e.key === "Escape" && n.blur();
	}
	function F(e) {
		if (e.key !== "Enter") return;
		e.preventDefault();
		let t = f(S).trim();
		t && (k((e) => [...e, { title: t }]), E(S, ""));
	}
	var L = J(), R = p(L), z = p(R), V = (e) => {
		var n = G(), i = p(n, !0);
		t(n), T(() => r(i, l.object.title)), a(e, n);
	};
	o(z, (e) => {
		l.object.title && e(V);
	});
	var H = w(z, 2), U = (e) => {
		var n = K(), i = p(n);
		t(n), T(() => r(i, `${f(O) ?? ""}/${l.object.items.length ?? ""}`)), a(e, n);
	};
	o(H, (e) => {
		l.object.items.length && e(U);
	}), t(R);
	var W = w(R, 2);
	g(W, 21, () => l.object.items, e, (e, n, r) => {
		var s = q();
		let c;
		var l = p(s), d = p(l), m = (e) => {
			A(e, {
				get icon() {
					return I;
				},
				size: 12
			});
		};
		o(d, (e) => {
			f(n).done && e(m);
		}), t(l);
		var g = w(l, 2);
		x(g), v(g, "data-item", r), t(s), T(() => {
			c = D(s, 1, "svelte-uvek3x", null, c, { done: f(n).done }), v(l, "aria-pressed", !!f(n).done), v(l, "aria-label", f(n).title), h(g, f(n).title), v(g, "aria-label", f(n).title);
		}), u("click", l, () => M(r)), i("blur", g, (e) => N(r, e.currentTarget.value)), u("keydown", g, (e) => P(e, r)), a(e, s);
	}), t(W);
	var Y = w(W, 2), X = w(p(Y), 2);
	x(X), t(Y), t(L), C(L, (e) => E(b, e), () => f(b)), T((e) => {
		v(L, "aria-label", l.object.title), v(X, "placeholder", e);
	}, [() => B()]), u("keydown", X, F), _(X, () => f(S), (e) => E(S, e)), a(s, L), c();
}
l(["click", "keydown"]);
// upstream/src/features/work/components/objects/List.svelte
var X = O("<span class=\"hint svelte-ddoo8x\"> </span>"), Z = O("<li class=\"svelte-ddoo8x\"><button type=\"button\"><span class=\"face obverse svelte-ddoo8x\"><span class=\"number svelte-ddoo8x\"></span> <span class=\"question svelte-ddoo8x\"> </span> <!></span> <span class=\"face reverse svelte-ddoo8x\"><span class=\"asked svelte-ddoo8x\"> </span> <span class=\"answer svelte-ddoo8x\"> </span></span></button></li>"), Q = O("<ol class=\"cards svelte-ddoo8x\"></ol>"), $ = O("<button type=\"button\" class=\"box nodrag nopan svelte-ddoo8x\"><!></button>"), ee = O("<span class=\"box svelte-ddoo8x\" aria-hidden=\"true\"><!></span>"), te = O("<span class=\"lead svelte-ddoo8x\" aria-hidden=\"true\"></span>"), ne = O("<span class=\"priority svelte-ddoo8x\"> </span>"), re = O("<span class=\"due svelte-ddoo8x\"> </span>"), ie = O("<span class=\"when svelte-ddoo8x\"><!><!></span>"), ae = O("<p class=\"detail svelte-ddoo8x\"> </p>"), oe = O("<a class=\"back nodrag svelte-ddoo8x\"><!></a>"), se = O("<blockquote class=\"svelte-ddoo8x\"> </blockquote>"), ce = O("<div class=\"from svelte-ddoo8x\"><!> <span class=\"who\"> </span> <!></div> <!>", 1), le = O("<li><!> <div class=\"body svelte-ddoo8x\"><div class=\"line svelte-ddoo8x\"><h4 class=\"svelte-ddoo8x\"> </h4> <!></div> <!> <!></div></li>"), ue = O("<ul class=\"items svelte-ddoo8x\"></ul>"), de = O("<footer class=\"svelte-ddoo8x\"><!></footer>"), fe = O("<section><!> <!> <!></section>");
function pe(i, l) {
	n(l, !0);
	let d = S(l, "actions", 19, () => ({})), m = S(l, "centre", 3, !1), h = y(() => l.object.style === "todo"), _ = y(() => l.object.style === "questions"), x = new k(), C = (e) => {
		x.delete(e) || x.add(e);
	}, E = (e) => (t) => {
		d().link && (t.preventDefault(), d().link(e));
	};
	var O = s(), R = b(O), z = (e) => {
		Y(e, {
			get object() {
				return l.object;
			},
			get actions() {
				return d();
			}
		});
	}, B = (n) => {
		var i = fe();
		let c;
		var S = p(i), O = (e) => {
			N(e, { get text() {
				return l.object.title;
			} });
		};
		o(S, (e) => {
			l.object.title && e(O);
		});
		var k = w(S, 2), R = (n) => {
			var i = Q();
			g(i, 21, () => l.object.items, e, (e, n, i) => {
				var s = Z(), c = p(s);
				let l;
				var d = p(c), m = p(d);
				m.textContent = i + 1;
				var h = w(m, 2), g = p(h, !0);
				t(h);
				var _ = w(h, 2), y = (e) => {
					var n = X(), i = p(n, !0);
					t(n), T((e) => r(i, e), [() => W()]), a(e, n);
				};
				o(_, (e) => {
					f(n).detail && e(y);
				}), t(d);
				var b = w(d, 2), S = p(b), E = p(S, !0);
				t(S);
				var O = w(S, 2), k = p(O, !0);
				t(O), t(b), t(c), t(s), T((e, t, i, a) => {
					l = D(c, 1, "card nodrag nopan svelte-ddoo8x", null, l, e), v(c, "aria-pressed", t), v(d, "aria-hidden", i), r(g, f(n).title), v(b, "aria-hidden", a), r(E, f(n).title), r(k, f(n).detail ?? "");
				}, [
					() => ({ turned: x.has(i) }),
					() => x.has(i),
					() => x.has(i),
					() => !x.has(i)
				]), u("click", c, () => C(i)), a(e, s);
			}), t(i), a(n, i);
		}, z = (n) => {
			var i = ue();
			g(i, 21, () => l.object.items, e, (e, n, i) => {
				var c = le();
				let m;
				var g = p(c), _ = (e) => {
					var r = s(), c = b(r), m = (e) => {
						var r = $(), s = p(r), c = (e) => {
							A(e, {
								get icon() {
									return I;
								},
								size: 12
							});
						};
						o(s, (e) => {
							f(n).done && e(c);
						}), t(r), T(() => {
							v(r, "aria-pressed", !!f(n).done), v(r, "aria-label", f(n).title);
						}), u("click", r, () => d().check?.(l.object.id, i, !f(n).done)), a(e, r);
					}, h = (e) => {
						var r = ee(), i = p(r), s = (e) => {
							A(e, {
								get icon() {
									return I;
								},
								size: 12
							});
						};
						o(i, (e) => {
							f(n).done && e(s);
						}), t(r), a(e, r);
					};
					o(c, (e) => {
						d().check ? e(m) : e(h, -1);
					}), a(e, r);
				}, x = (e) => {
					var t = te();
					a(e, t);
				};
				o(g, (e) => {
					f(h) ? e(_) : e(x, -1);
				});
				var S = w(g, 2), C = p(S), O = p(C), k = p(O, !0);
				t(O);
				var j = w(O, 2), N = (e) => {
					var i = ie(), s = p(i), c = (e) => {
						var n = ne(), i = p(n, !0);
						t(n), T((e) => r(i, e), [() => H()]), a(e, n);
					};
					o(s, (e) => {
						f(n).priority === "high" && e(c);
					});
					var l = w(s), u = (e) => {
						var i = re(), o = p(i, !0);
						t(i), T(() => r(o, f(n).due)), a(e, i);
					};
					o(l, (e) => {
						f(n).due && e(u);
					}), t(i), a(e, i);
				};
				o(j, (e) => {
					(f(n).priority === "high" || f(n).due) && e(N);
				}), t(C);
				var R = w(C, 2), z = (e) => {
					var i = ae(), o = p(i, !0);
					t(i), T(() => r(o, f(n).detail)), a(e, i);
				};
				o(R, (e) => {
					f(n).detail && e(z);
				});
				var B = w(R, 2), V = (e) => {
					let i = y(() => f(n).from);
					var s = ce(), c = b(s), l = p(c), d = (e) => {
						M(e, {
							get address() {
								return f(i).host;
							},
							size: 14
						});
					};
					o(l, (e) => {
						f(i).host && e(d);
					});
					var m = w(l, 2), h = p(m, !0);
					t(m);
					var g = w(m, 2), _ = (e) => {
						var n = oe(), r = y(() => E(f(i).url)), o = p(n);
						A(o, {
							get icon() {
								return L;
							},
							size: 13
						}), t(n), T((e) => {
							v(n, "href", f(i).url), v(n, "title", e);
						}, [() => f(i).app ? F({ app: f(i).app }) : P()]), u("click", n, function(...e) {
							f(r)?.apply(this, e);
						}), a(e, n);
					};
					o(g, (e) => {
						f(i).url && e(_);
					}), t(c);
					var x = w(c, 2), S = (e) => {
						var n = se(), o = p(n, !0);
						t(n), T(() => r(o, f(i).quote)), a(e, n);
					};
					o(x, (e) => {
						f(i).quote && e(S);
					}), T((e) => r(h, e), [() => [
						f(i).who,
						f(i).app,
						f(i).when
					].filter(Boolean).join(" · ")]), a(e, s);
				};
				o(B, (e) => {
					f(n).from && e(V);
				}), t(S), t(c), T(() => {
					m = D(c, 1, "svelte-ddoo8x", null, m, { done: f(n).done }), r(k, f(n).title);
				}), a(e, c);
			}), t(i), a(n, i);
		};
		o(k, (e) => {
			f(_) ? e(R) : e(z, -1);
		});
		var B = w(k, 2), V = (e) => {
			var n = de(), r = p(n);
			j(r, { get id() {
				return l.object.id;
			} }), t(n), a(e, n);
		};
		o(B, (e) => {
			f(h) && !m() && e(V);
		}), t(i), T(() => {
			c = D(i, 1, "list svelte-ddoo8x", null, c, { deck: f(_) }), v(i, "aria-label", l.object.title);
		}), a(n, i);
	};
	o(R, (e) => {
		d().edit && f(h) ? e(z) : e(B, -1);
	}), a(i, O), c();
}
l(["click"]);
export { pe as default };
