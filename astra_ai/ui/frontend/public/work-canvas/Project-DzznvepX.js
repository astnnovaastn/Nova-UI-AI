import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, F as n, H as r, J as i, L as a, Mt as o, P as s, S as c, U as l, W as u, Y as d, h as f, ht as p, jt as m, lt as h, mt as g, pt as _, r as v, tt as y, x as b, zt as x } from "./index-client-DH73-vTM.js";
import { t as S } from "./Icon-D2j1Ej6Z.js";
import "./Icon-CmjKIKuh.js";
import { t as C } from "./File01Icon-1POdYzZt.js";
import { t as w } from "./Folder01Icon-BHrTk5xe.js";
import { t as T } from "./GitBranchIcon-qb9QHJDO.js";
import { t as E } from "./Mark-y83oESZj.js";
import { t as D } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_project_ahead.js
var O = (e) => `${e?.count} ahead`, k = ((e, t = {}) => (t.locale ?? D(), O(e))), A = (e) => `${e?.count} behind`, ee = ((e, t = {}) => (t.locale ?? D(), A(e))), j = (e) => `${e?.count} changed`, M = ((e, t = {}) => (t.locale ?? D(), j(e))), N = () => "No changes", te = ((e = {}, t = {}) => (t.locale ?? D(), N(e))), P = (e) => `${e?.count} more`, F = ((e, t = {}) => (t.locale ?? D(), P(e))), I = () => "Scripts", ne = ((e = {}, t = {}) => (t.locale ?? D(), I(e))), L = () => "Show the whole tree", re = ((e = {}, t = {}) => (t.locale ?? D(), L(e))), R = () => "Stack", z = ((e = {}, t = {}) => (t.locale ?? D(), R(e))), B = () => "Structure", V = ((e = {}, t = {}) => (t.locale ?? D(), B(e)));
// upstream/src/features/work/components/objects/project.ts
function H(e, t) {
	let n = [], r = (e, t, i) => {
		let a = [...e].sort((e, t) => Number(t.folder) - Number(e.folder) || e.name.localeCompare(t.name));
		for (let e of a) {
			let i = !!e.children?.length;
			n.push({
				name: e.name,
				folder: e.folder,
				depth: t,
				...!i && e.more ? { holds: e.more } : {}
			}), i && r(e.children, t + 1, e.more);
		}
		i && n.push({
			more: i,
			depth: t
		});
	};
	return r(e, 0, t), n;
}
// upstream/src/features/work/components/objects/Project.svelte
var U = u("<p class=\"summary svelte-1xtjuz2\"> </p>"), W = u("<span class=\"path svelte-1xtjuz2\"> </span>"), G = u("<span class=\"branch svelte-1xtjuz2\"> </span>"), K = u("<span class=\"sync svelte-1xtjuz2\"> </span>"), q = u("<span class=\"git svelte-1xtjuz2\"><!> <!> <span class=\"changes svelte-1xtjuz2\"> </span> <!> <!></span>"), J = u("<p class=\"meta svelte-1xtjuz2\"><!> <!></p>"), Y = u("<header class=\"svelte-1xtjuz2\"><span class=\"glyph svelte-1xtjuz2\" aria-hidden=\"true\"><!></span> <div class=\"head svelte-1xtjuz2\"><h3 class=\"svelte-1xtjuz2\"> </h3> <!> <!></div></header>"), X = u("<span class=\"count rest svelte-1xtjuz2\"> </span>"), ie = u("<span class=\"count svelte-1xtjuz2\"> </span>"), ae = u("<!><span class=\"entry svelte-1xtjuz2\"> </span><!>", 1), oe = u("<li><!></li>"), se = u("<button type=\"button\" class=\"all nodrag nopan svelte-1xtjuz2\"> </button>"), ce = u("<h4 class=\"svelte-1xtjuz2\"> </h4> <ul class=\"tree svelte-1xtjuz2\"></ul> <!>", 1), le = u("<span class=\"source svelte-1xtjuz2\"> </span>"), ue = u("<dd class=\"svelte-1xtjuz2\"> </dd>"), de = u("<div class=\"svelte-1xtjuz2\"><dt class=\"svelte-1xtjuz2\"><span> </span><!></dt> <!></div>"), fe = u("<h4 class=\"svelte-1xtjuz2\"> </h4> <dl class=\"scripts svelte-1xtjuz2\"></dl>", 1), Z = u("<span class=\"version svelte-1xtjuz2\"> </span>"), pe = u("<li class=\"svelte-1xtjuz2\"><!> <span class=\"name svelte-1xtjuz2\"> </span> <!></li>"), me = u("<ul class=\"stack svelte-1xtjuz2\"></ul>"), Q = u("<div class=\"column svelte-1xtjuz2\"><!></div>"), he = u("<section class=\"project svelte-1xtjuz2\"><!> <!> <div><!> <!></div></section>"), ge = u("<li class=\"svelte-1xtjuz2\"><span class=\"mark svelte-1xtjuz2\"><!></span> <span class=\"name svelte-1xtjuz2\"> </span> <!></li>"), _e = u("<div class=\"piece stack-piece svelte-1xtjuz2\"><h4 class=\"svelte-1xtjuz2\"> </h4> <ul class=\"manifest svelte-1xtjuz2\"></ul></div>"), ve = u("<div class=\"piece tree-piece svelte-1xtjuz2\"><!></div>"), ye = u("<div class=\"piece scripts-piece svelte-1xtjuz2\"><!></div>"), be = u("<section class=\"map svelte-1xtjuz2\"><div class=\"piece lead svelte-1xtjuz2\"><!></div> <!> <!> <!></section>");
function $(i, u) {
	o(u, !0);
	let D = (t) => {
		var n = Y(), i = _(n), o = _(i);
		S(o, {
			get icon() {
				return w;
			},
			size: 22
		}), x(i);
		var s = p(i, 2), c = _(s), l = _(c, !0);
		x(c);
		var d = p(c, 2), m = (t) => {
			var n = U(), i = _(n, !0);
			x(n), h(() => e(i, u.object.summary)), r(t, n);
		};
		a(d, (e) => {
			u.object.summary && e(m);
		});
		var g = p(d, 2), v = (t) => {
			var n = J(), i = _(n), o = (t) => {
				var n = W(), i = _(n, !0);
				x(n), h(() => {
					f(n, "title", u.object.root), e(i, y(R));
				}), r(t, n);
			};
			a(i, (e) => {
				u.object.root && e(o);
			});
			var s = p(i, 2), c = (t) => {
				var n = q(), i = _(n);
				S(i, {
					get icon() {
						return T;
					},
					size: 13
				});
				var o = p(i, 2), s = (t) => {
					var n = G(), i = _(n, !0);
					x(n), h(() => e(i, y(L).branch)), r(t, n);
				};
				a(o, (e) => {
					y(L).branch && e(s);
				});
				var c = p(o, 2), l = _(c, !0);
				x(c);
				var u = p(c, 2), d = (t) => {
					var n = K(), i = _(n, !0);
					x(n), h((t) => e(i, t), [() => k({ count: y(L).ahead })]), r(t, n);
				};
				a(u, (e) => {
					y(L).ahead && e(d);
				});
				var f = p(u, 2), m = (t) => {
					var n = K(), i = _(n, !0);
					x(n), h((t) => e(i, t), [() => ee({ count: y(L).behind })]), r(t, n);
				};
				a(f, (e) => {
					y(L).behind && e(m);
				}), x(n), h((t) => e(l, t), [() => y(L).changed ? M({ count: y(L).changed }) : te()]), r(t, n);
			};
			a(s, (e) => {
				y(L) && e(c);
			}), x(n), r(t, n);
		};
		a(g, (e) => {
			(u.object.root || y(L)) && e(v);
		}), x(s), x(n), h(() => e(l, u.object.name)), r(t, n);
	}, O = (i) => {
		var o = ce(), l = g(o), f = _(l, !0);
		x(l);
		var m = p(l, 2);
		s(m, 21, () => y(I), n, (n, i) => {
			var o = oe();
			let s, l;
			var u = _(o), d = (t) => {
				var n = X(), a = _(n, !0);
				x(n), h((t) => e(a, t), [() => F({ count: y(i).more })]), r(t, n);
			}, f = (n) => {
				var o = ae(), s = g(o);
				{
					let e = t(() => y(i).folder ? w : C);
					S(s, {
						get icon() {
							return y(e);
						},
						size: 14
					});
				}
				var c = p(s), l = _(c, !0);
				x(c);
				var u = p(c), d = (t) => {
					var n = ie(), a = _(n, !0);
					x(n), h(() => e(a, y(i).holds)), r(t, n);
				};
				a(u, (e) => {
					y(i).holds && e(d);
				}), h(() => e(l, y(i).name)), r(n, o);
			};
			a(u, (e) => {
				"more" in y(i) ? e(d) : e(f, -1);
			}), x(o), h(() => {
				s = c(o, 1, "svelte-1xtjuz2", null, s, { folder: "folder" in y(i) && y(i).folder }), l = b(o, "", l, { "padding-inline-start": `${y(i).depth * 18}px` });
			}), r(n, o);
		}), x(m);
		var v = p(m, 2), T = (t) => {
			var n = se(), i = _(n, !0);
			x(n), h((t) => e(i, t), [() => re()]), d("click", n, () => j().open?.(u.object.id)), r(t, n);
		};
		a(v, (e) => {
			y(I).length < y(P).length && e(T);
		}), h((t) => e(f, t), [() => V()]), r(i, o);
	}, A = (t) => {
		var i = fe(), o = g(i), c = _(o, !0);
		x(o);
		var l = p(o, 2);
		s(l, 21, () => u.object.scripts, n, (t, n) => {
			var i = de(), o = _(i), s = _(o), c = _(s, !0);
			x(s);
			var l = p(s), u = (t) => {
				var i = le(), a = _(i, !0);
				x(i), h(() => e(a, y(n).source)), r(t, i);
			};
			a(l, (e) => {
				y(n).source && e(u);
			}), x(o);
			var d = p(o, 2), f = (t) => {
				var i = ue(), a = _(i, !0);
				x(i), h(() => e(a, y(n).command)), r(t, i);
			};
			a(d, (e) => {
				y(n).command && y(n).command !== y(n).name && e(f);
			}), x(i), h(() => e(c, y(n).name)), r(t, i);
		}), x(l), h((t) => e(c, t), [() => ne()]), r(t, i);
	}, j = v(u, "actions", 19, () => ({})), N = v(u, "centre", 3, !1), P = t(() => H(u.object.tree, u.object.more)), I = t(() => N() ? y(P) : y(P).slice(0, 12)), L = t(() => u.object.git), R = t(() => u.object.root.replace(/^\/(?:Users|home)\/[^/]+/u, "~"));
	var B = l(), $ = g(B), xe = (t) => {
		var n = he(), i = _(n);
		D(i);
		var o = p(i, 2), l = (t) => {
			var n = me();
			s(n, 21, () => u.object.stack, (e) => e.name, (t, n) => {
				var i = pe(), o = _(i), s = (e) => {
					E(e, {
						get address() {
							return y(n).host;
						},
						size: 16
					});
				};
				a(o, (e) => {
					y(n).host && e(s);
				});
				var c = p(o, 2), l = _(c, !0);
				x(c);
				var u = p(c, 2), d = (t) => {
					var i = Z(), a = _(i, !0);
					x(i), h(() => e(a, y(n).version)), r(t, i);
				};
				a(u, (e) => {
					y(n).version && e(d);
				}), x(i), h(() => {
					f(i, "title", y(n).role), e(l, y(n).name);
				}), r(t, i);
			}), x(n), h((e) => f(n, "aria-label", e), [() => z()]), r(t, n);
		};
		a(o, (e) => {
			u.object.stack.length && e(l);
		});
		var d = p(o, 2);
		let m;
		var g = _(d), v = (e) => {
			var t = Q(), n = _(t);
			O(n), x(t), r(e, t);
		};
		a(g, (e) => {
			y(P).length && e(v);
		});
		var b = p(g, 2), S = (e) => {
			var t = Q(), n = _(t);
			A(n), x(t), r(e, t);
		};
		a(b, (e) => {
			u.object.scripts.length && e(S);
		}), x(d), x(n), h(() => {
			f(n, "aria-label", u.object.name), m = c(d, 1, "body svelte-1xtjuz2", null, m, { single: !u.object.scripts.length || !y(P).length });
		}), r(t, n);
	}, Se = (t) => {
		var n = be(), i = _(n), o = _(i);
		D(o), x(i);
		var c = p(i, 2), l = (t) => {
			var n = _e(), i = _(n), o = _(i, !0);
			x(i);
			var c = p(i, 2);
			s(c, 21, () => u.object.stack, (e) => e.name, (t, n) => {
				var i = ge(), o = _(i), s = _(o), c = (e) => {
					E(e, {
						get address() {
							return y(n).host;
						},
						size: 16
					});
				};
				a(s, (e) => {
					y(n).host && e(c);
				}), x(o);
				var l = p(o, 2), u = _(l, !0);
				x(l);
				var d = p(l, 2), m = (t) => {
					var i = Z(), a = _(i, !0);
					x(i), h(() => e(a, y(n).version)), r(t, i);
				};
				a(d, (e) => {
					y(n).version && e(m);
				}), x(i), h(() => {
					f(i, "title", y(n).role), e(u, y(n).name);
				}), r(t, i);
			}), x(c), x(n), h((t) => e(o, t), [() => z()]), r(t, n);
		};
		a(c, (e) => {
			u.object.stack.length && e(l);
		});
		var d = p(c, 2), m = (e) => {
			var t = ve(), n = _(t);
			O(n), x(t), r(e, t);
		};
		a(d, (e) => {
			y(P).length && e(m);
		});
		var g = p(d, 2), v = (e) => {
			var t = ye(), n = _(t);
			A(n), x(t), r(e, t);
		};
		a(g, (e) => {
			u.object.scripts.length && e(v);
		}), x(n), h(() => f(n, "aria-label", u.object.name)), r(t, n);
	};
	a($, (e) => {
		N() ? e(xe) : e(Se, -1);
	}), r(i, B), m();
}
i(["click"]);
export { $ as default };
