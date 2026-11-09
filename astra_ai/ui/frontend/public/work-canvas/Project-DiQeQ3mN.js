import "./disclose-version-DFvUDwEH.js";
import { A as e, At as t, Ct as n, F as r, L as i, M as a, R as o, St as s, U as c, W as l, Y as u, at as d, k as f, m as p, mt as m, ot as h, r as g, st as _, tt as v, v as y, y as b, z as x } from "./index-client-BSGo5gVb.js";
import { t as S } from "./Icon-BWISRU-8.js";
import { t as C } from "./File01Icon-C7ue_hSG.js";
import { t as w } from "./Folder01Icon-DE8-U2cv.js";
import { t as T } from "./GitBranchIcon-BNLwRvty.js";
import { t as E } from "./Mark-DBYTxnH7.js";
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
var U = x("<p class=\"summary svelte-1xtjuz2\"> </p>"), W = x("<span class=\"path svelte-1xtjuz2\"> </span>"), G = x("<span class=\"branch svelte-1xtjuz2\"> </span>"), K = x("<span class=\"sync svelte-1xtjuz2\"> </span>"), q = x("<span class=\"git svelte-1xtjuz2\"><!> <!> <span class=\"changes svelte-1xtjuz2\"> </span> <!> <!></span>"), J = x("<p class=\"meta svelte-1xtjuz2\"><!> <!></p>"), Y = x("<header class=\"svelte-1xtjuz2\"><span class=\"glyph svelte-1xtjuz2\" aria-hidden=\"true\"><!></span> <div class=\"head svelte-1xtjuz2\"><h3 class=\"svelte-1xtjuz2\"> </h3> <!> <!></div></header>"), X = x("<span class=\"count rest svelte-1xtjuz2\"> </span>"), ie = x("<span class=\"count svelte-1xtjuz2\"> </span>"), ae = x("<!><span class=\"entry svelte-1xtjuz2\"> </span><!>", 1), oe = x("<li><!></li>"), se = x("<button type=\"button\" class=\"all nodrag nopan svelte-1xtjuz2\"> </button>"), ce = x("<h4 class=\"svelte-1xtjuz2\"> </h4> <ul class=\"tree svelte-1xtjuz2\"></ul> <!>", 1), le = x("<span class=\"source svelte-1xtjuz2\"> </span>"), ue = x("<dd class=\"svelte-1xtjuz2\"> </dd>"), de = x("<div class=\"svelte-1xtjuz2\"><dt class=\"svelte-1xtjuz2\"><span> </span><!></dt> <!></div>"), fe = x("<h4 class=\"svelte-1xtjuz2\"> </h4> <dl class=\"scripts svelte-1xtjuz2\"></dl>", 1), Z = x("<span class=\"version svelte-1xtjuz2\"> </span>"), pe = x("<li class=\"svelte-1xtjuz2\"><!> <span class=\"name svelte-1xtjuz2\"> </span> <!></li>"), me = x("<ul class=\"stack svelte-1xtjuz2\"></ul>"), Q = x("<div class=\"column svelte-1xtjuz2\"><!></div>"), he = x("<section class=\"project svelte-1xtjuz2\"><!> <!> <div><!> <!></div></section>"), ge = x("<li class=\"svelte-1xtjuz2\"><span class=\"mark svelte-1xtjuz2\"><!></span> <span class=\"name svelte-1xtjuz2\"> </span> <!></li>"), _e = x("<div class=\"piece stack-piece svelte-1xtjuz2\"><h4 class=\"svelte-1xtjuz2\"> </h4> <ul class=\"manifest svelte-1xtjuz2\"></ul></div>"), ve = x("<div class=\"piece tree-piece svelte-1xtjuz2\"><!></div>"), ye = x("<div class=\"piece scripts-piece svelte-1xtjuz2\"><!></div>"), be = x("<section class=\"map svelte-1xtjuz2\"><div class=\"piece lead svelte-1xtjuz2\"><!></div> <!> <!> <!></section>");
function $(c, x) {
	n(x, !0);
	let D = (e) => {
		var n = Y(), o = d(n), s = d(o);
		S(s, {
			get icon() {
				return w;
			},
			size: 22
		}), t(o);
		var c = _(o, 2), l = d(c), f = d(l, !0);
		t(l);
		var m = _(l, 2), h = (e) => {
			var n = U(), a = d(n, !0);
			t(n), v(() => r(a, x.object.summary)), i(e, n);
		};
		a(m, (e) => {
			x.object.summary && e(h);
		});
		var g = _(m, 2), y = (e) => {
			var n = J(), o = d(n), s = (e) => {
				var n = W(), a = d(n, !0);
				t(n), v(() => {
					p(n, "title", x.object.root), r(a, u(R));
				}), i(e, n);
			};
			a(o, (e) => {
				x.object.root && e(s);
			});
			var c = _(o, 2), l = (e) => {
				var n = q(), o = d(n);
				S(o, {
					get icon() {
						return T;
					},
					size: 13
				});
				var s = _(o, 2), c = (e) => {
					var n = G(), a = d(n, !0);
					t(n), v(() => r(a, u(L).branch)), i(e, n);
				};
				a(s, (e) => {
					u(L).branch && e(c);
				});
				var l = _(s, 2), f = d(l, !0);
				t(l);
				var p = _(l, 2), m = (e) => {
					var n = K(), a = d(n, !0);
					t(n), v((e) => r(a, e), [() => k({ count: u(L).ahead })]), i(e, n);
				};
				a(p, (e) => {
					u(L).ahead && e(m);
				});
				var h = _(p, 2), g = (e) => {
					var n = K(), a = d(n, !0);
					t(n), v((e) => r(a, e), [() => ee({ count: u(L).behind })]), i(e, n);
				};
				a(h, (e) => {
					u(L).behind && e(g);
				}), t(n), v((e) => r(f, e), [() => u(L).changed ? M({ count: u(L).changed }) : te()]), i(e, n);
			};
			a(c, (e) => {
				u(L) && e(l);
			}), t(n), i(e, n);
		};
		a(g, (e) => {
			(x.object.root || u(L)) && e(y);
		}), t(c), t(n), v(() => r(f, x.object.name)), i(e, n);
	}, O = (n) => {
		var o = ce(), s = h(o), c = d(s, !0);
		t(s);
		var p = _(s, 2);
		f(p, 21, () => u(I), e, (e, n) => {
			var o = oe();
			let s, c;
			var l = d(o), f = (e) => {
				var a = X(), o = d(a, !0);
				t(a), v((e) => r(o, e), [() => F({ count: u(n).more })]), i(e, a);
			}, p = (e) => {
				var o = ae(), s = h(o);
				{
					let e = m(() => u(n).folder ? w : C);
					S(s, {
						get icon() {
							return u(e);
						},
						size: 14
					});
				}
				var c = _(s), l = d(c, !0);
				t(c);
				var f = _(c), p = (e) => {
					var a = ie(), o = d(a, !0);
					t(a), v(() => r(o, u(n).holds)), i(e, a);
				};
				a(f, (e) => {
					u(n).holds && e(p);
				}), v(() => r(l, u(n).name)), i(e, o);
			};
			a(l, (e) => {
				"more" in u(n) ? e(f) : e(p, -1);
			}), t(o), v(() => {
				s = b(o, 1, "svelte-1xtjuz2", null, s, { folder: "folder" in u(n) && u(n).folder }), c = y(o, "", c, { "padding-inline-start": `${u(n).depth * 18}px` });
			}), i(e, o);
		}), t(p);
		var g = _(p, 2), T = (e) => {
			var n = se(), a = d(n, !0);
			t(n), v((e) => r(a, e), [() => re()]), l("click", n, () => j().open?.(x.object.id)), i(e, n);
		};
		a(g, (e) => {
			u(I).length < u(P).length && e(T);
		}), v((e) => r(c, e), [() => V()]), i(n, o);
	}, A = (n) => {
		var o = fe(), s = h(o), c = d(s, !0);
		t(s);
		var l = _(s, 2);
		f(l, 21, () => x.object.scripts, e, (e, n) => {
			var o = de(), s = d(o), c = d(s), l = d(c, !0);
			t(c);
			var f = _(c), p = (e) => {
				var a = le(), o = d(a, !0);
				t(a), v(() => r(o, u(n).source)), i(e, a);
			};
			a(f, (e) => {
				u(n).source && e(p);
			}), t(s);
			var m = _(s, 2), h = (e) => {
				var a = ue(), o = d(a, !0);
				t(a), v(() => r(o, u(n).command)), i(e, a);
			};
			a(m, (e) => {
				u(n).command && u(n).command !== u(n).name && e(h);
			}), t(o), v(() => r(l, u(n).name)), i(e, o);
		}), t(l), v((e) => r(c, e), [() => ne()]), i(n, o);
	}, j = g(x, "actions", 19, () => ({})), N = g(x, "centre", 3, !1), P = m(() => H(x.object.tree, x.object.more)), I = m(() => N() ? u(P) : u(P).slice(0, 12)), L = m(() => x.object.git), R = m(() => x.object.root.replace(/^\/(?:Users|home)\/[^/]+/u, "~"));
	var B = o(), $ = h(B), xe = (e) => {
		var n = he(), o = d(n);
		D(o);
		var s = _(o, 2), c = (e) => {
			var n = me();
			f(n, 21, () => x.object.stack, (e) => e.name, (e, n) => {
				var o = pe(), s = d(o), c = (e) => {
					E(e, {
						get address() {
							return u(n).host;
						},
						size: 16
					});
				};
				a(s, (e) => {
					u(n).host && e(c);
				});
				var l = _(s, 2), f = d(l, !0);
				t(l);
				var m = _(l, 2), h = (e) => {
					var a = Z(), o = d(a, !0);
					t(a), v(() => r(o, u(n).version)), i(e, a);
				};
				a(m, (e) => {
					u(n).version && e(h);
				}), t(o), v(() => {
					p(o, "title", u(n).role), r(f, u(n).name);
				}), i(e, o);
			}), t(n), v((e) => p(n, "aria-label", e), [() => z()]), i(e, n);
		};
		a(s, (e) => {
			x.object.stack.length && e(c);
		});
		var l = _(s, 2);
		let m;
		var h = d(l), g = (e) => {
			var n = Q(), r = d(n);
			O(r), t(n), i(e, n);
		};
		a(h, (e) => {
			u(P).length && e(g);
		});
		var y = _(h, 2), S = (e) => {
			var n = Q(), r = d(n);
			A(r), t(n), i(e, n);
		};
		a(y, (e) => {
			x.object.scripts.length && e(S);
		}), t(l), t(n), v(() => {
			p(n, "aria-label", x.object.name), m = b(l, 1, "body svelte-1xtjuz2", null, m, { single: !x.object.scripts.length || !u(P).length });
		}), i(e, n);
	}, Se = (e) => {
		var n = be(), o = d(n), s = d(o);
		D(s), t(o);
		var c = _(o, 2), l = (e) => {
			var n = _e(), o = d(n), s = d(o, !0);
			t(o);
			var c = _(o, 2);
			f(c, 21, () => x.object.stack, (e) => e.name, (e, n) => {
				var o = ge(), s = d(o), c = d(s), l = (e) => {
					E(e, {
						get address() {
							return u(n).host;
						},
						size: 16
					});
				};
				a(c, (e) => {
					u(n).host && e(l);
				}), t(s);
				var f = _(s, 2), m = d(f, !0);
				t(f);
				var h = _(f, 2), g = (e) => {
					var a = Z(), o = d(a, !0);
					t(a), v(() => r(o, u(n).version)), i(e, a);
				};
				a(h, (e) => {
					u(n).version && e(g);
				}), t(o), v(() => {
					p(o, "title", u(n).role), r(m, u(n).name);
				}), i(e, o);
			}), t(c), t(n), v((e) => r(s, e), [() => z()]), i(e, n);
		};
		a(c, (e) => {
			x.object.stack.length && e(l);
		});
		var m = _(c, 2), h = (e) => {
			var n = ve(), r = d(n);
			O(r), t(n), i(e, n);
		};
		a(m, (e) => {
			u(P).length && e(h);
		});
		var g = _(m, 2), y = (e) => {
			var n = ye(), r = d(n);
			A(r), t(n), i(e, n);
		};
		a(g, (e) => {
			x.object.scripts.length && e(y);
		}), t(n), v(() => p(n, "aria-label", x.object.name)), i(e, n);
	};
	a($, (e) => {
		N() ? e(xe) : e(Se, -1);
	}), i(c, B), s();
}
c(["click"]);
export { $ as default };
