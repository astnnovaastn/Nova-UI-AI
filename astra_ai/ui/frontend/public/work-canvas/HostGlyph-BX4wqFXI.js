import "./disclose-version-DFvUDwEH.js";
import { At as e, Ct as t, L as n, M as r, R as i, St as a, Y as o, at as s, bt as c, ft as l, m as u, mt as d, n as f, nt as p, ot as m, r as h, s as g, tt as _, ut as v, v as y, wt as b, y as x, z as S } from "./index-client-BSGo5gVb.js";
import { n as C } from "./index-client-CT6TpZ12.js";
import "./native-events-Bexa20bU.js";
import { t as w } from "./Icon-BWISRU-8.js";
import { t as T } from "./File01Icon-C7ue_hSG.js";
// upstream/src/features/work/lib/canvas-context.ts
var E = Symbol("canvas-inspection"), D = Symbol("canvas-resize"), O = Symbol("canvas-action"), k = Symbol("canvas-evidence"), A = Symbol("canvas-focus-result"), j = Symbol("canvas-open"), M = Symbol("canvas-open-link"), N = Symbol("canvas-open-tasks"), ee = Symbol("canvas-areas"), te = Symbol("canvas-pictures"), P = Symbol("canvas-area-actions"), ne = Symbol("canvas-arrival"), F = Symbol("canvas-probe"), re = Symbol("canvas-work"), ie = Symbol("canvas-seen"), ae = Symbol("canvas-toolbar"), I = Symbol("canvas-far"), L = Symbol("canvas-board"), R = Symbol("site-marks");
function oe(e) {
	b(R, e);
}
function se() {
	return c(R);
}
var z = new C(), ce = new C(), B = l(null), V = (e, t) => `${e}\u0000${t}`, H = (e, t) => `${e}\u0000${t}`;
function U(e) {
	return e ? z.get(V(e.origin, e.revision))?.image ?? null : null;
}
function W(e) {
	let t = /^(https?):\/\/(?:[^@/?#]*@)?([^/?#:]+)(?::(\d+))?/iu.exec(e);
	if (!t) return null;
	let n = t[1].toLowerCase(), r = t[3] && t[3] !== (n === "https" ? "443" : "80") ? `:${t[3]}` : "";
	if (o(B) === null) return null;
	let i = ce.get(H(o(B), `${n}://${t[2].toLowerCase()}${r}`)), a = i === void 0 ? void 0 : z.get(i);
	return a ? {
		image: a.image,
		tone: a.tone
	} : null;
}
function G(e) {
	return e ? z.get(V(e.origin, e.revision))?.tone ?? "mid" : "mid";
}
// upstream/src/features/work/lib/run/site.ts
var le = /* @__PURE__ */ new Set(/* @__PURE__ */ "co.uk,org.uk,ac.uk,gov.uk,me.uk,com.au,net.au,org.au,co.nz,co.jp,ne.jp,or.jp,co.kr,com.br,com.mx,com.ar,com.tr,com.cn,com.hk,com.sg,com.tw,co.in,co.za,co.il,com.pl,com.ua,github.io,gitlab.io,vercel.app,netlify.app,pages.dev,workers.dev,herokuapp.com,blogspot.com".split(","));
function ue(e) {
	try {
		return new URL(e).hostname.replace(/^www\./u, "").toLowerCase();
	} catch {
		return "";
	}
}
function K(e) {
	let t = e.replace(/^www\./u, "").toLowerCase().split(".").filter(Boolean);
	if (t.length <= 2 || /^\d+$/u.test(t.at(-1))) return t.join(".");
	let n = t.slice(-2).join(".");
	return le.has(n) ? t.slice(-3).join(".") : n;
}
function q(e) {
	let t = K(e);
	return t.split(".")[0] ?? t;
}
var J = {
	ycombinator: "Y Combinator",
	linkedin: "LinkedIn",
	github: "GitHub",
	gitlab: "GitLab",
	youtube: "YouTube",
	openai: "OpenAI",
	paypal: "PayPal",
	tripadvisor: "Tripadvisor",
	booking: "Booking.com",
	airbnb: "Airbnb",
	stackoverflow: "Stack Overflow",
	duckduckgo: "DuckDuckGo",
	wikipedia: "Wikipedia",
	greenhouse: "Greenhouse",
	ashbyhq: "Ashby",
	lever: "Lever",
	google: "Google",
	reddit: "Reddit",
	lot: "LOT",
	lufthansa: "Lufthansa",
	amazon: "Amazon",
	apple: "Apple",
	microsoft: "Microsoft",
	notion: "Notion",
	slack: "Slack",
	figma: "Figma",
	stripe: "Stripe",
	cloudflare: "Cloudflare",
	vercel: "Vercel",
	hetzner: "Hetzner",
	skyscanner: "Skyscanner",
	kayak: "Kayak",
	expedia: "Expedia",
	lego: "LEGO",
	epam: "EPAM",
	mit: "MIT",
	stanford: "Stanford",
	cmu: "Carnegie Mellon",
	berkeley: "UC Berkeley",
	harvard: "Harvard",
	coursera: "Coursera",
	edx: "edX",
	udemy: "Udemy",
	medium: "Medium",
	substack: "Substack"
}, de = {
	"mail.google.com": "Gmail",
	"calendar.google.com": "Google Calendar",
	"docs.google.com": "Google Docs",
	"drive.google.com": "Google Drive",
	"meet.google.com": "Google Meet",
	"maps.google.com": "Google Maps",
	"outlook.live.com": "Outlook",
	"outlook.office.com": "Outlook",
	"teams.microsoft.com": "Teams",
	"aws.amazon.com": "AWS",
	"console.aws.amazon.com": "AWS"
}, Y = (e) => e.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
function fe(e, t = []) {
	let n = de[e.replace(/^www\./u, "").toLowerCase()];
	if (n) return n;
	let r = K(e), i = q(e);
	if (!i) return e;
	if (J[i]) return J[i];
	let a = Y(r);
	for (let e of t) for (let t of e.split(/\s+[|·•–—-]\s+|\s*[|·•]\s*/u)) {
		let e = t.trim();
		if (e && e.length <= 32 && (Y(e) === i || Y(e) === a)) return e;
	}
	let o = RegExp(`(?:^|[^\\p{L}\\p{N}])(${i.replace(/[^a-z0-9]/gu, "")})(?![\\p{L}\\p{N}])`, "iu");
	for (let e of t) {
		let t = o.exec(e)?.[1];
		if (t && t !== t.toLowerCase()) return t;
	}
	return r;
}
// upstream/src/shared/ui/FavIcon/FavIcon.svelte
var pe = S("<span><canvas></canvas></span>"), me = S("<span class=\"favicon-fallback\"><!></span>"), he = S("<span class=\"favicon-blank\"></span>"), ge = S("<span class=\"favicon\" data-favicon=\"\" aria-hidden=\"true\"><!></span>");
function X(i, c) {
	t(c, !0);
	let f = h(c, "tone", 3, "mid"), m = h(c, "loading", 3, !1), b = h(c, "size", 3, 17), S = h(c, "lit", 3, !1), C = h(c, "notched", 3, !1), T = l(void 0), E = d(() => Math.max(4, Math.round(b() * .28))), D = d(() => Math.max(1, Math.round(b() * .12)));
	p(() => {
		let e = c.image;
		e && o(T) && o(T).getContext("2d")?.putImageData(e, 0, 0);
	});
	var O = ge();
	let k;
	var A = s(O), j = (t) => {
		var r = pe();
		let i, a;
		var l = s(r);
		g(l, (e) => v(T, e), () => o(T)), e(r), _(() => {
			u(r, "data-tone", f()), i = x(r, 1, "favicon-plate", null, i, { "favicon-plate-lit": S() }), a = y(r, "", a, {
				"border-radius": `${o(E)}px`,
				"--favicon-inset": `${o(D)}px`
			}), u(l, "width", c.image.width), u(l, "height", c.image.height);
		}), n(t, r);
	}, M = (t) => {
		var r = me(), i = s(r);
		{
			let e = d(() => Math.round(b() * .85));
			w(i, {
				get icon() {
					return c.fallback;
				},
				get size() {
					return o(e);
				}
			});
		}
		e(r), n(t, r);
	}, N = (e) => {
		var t = he();
		n(e, t);
	};
	r(A, (e) => {
		c.image ? e(j) : c.fallback ? e(M, 1) : e(N, -1);
	}), e(O), _(() => {
		u(O, "data-loading", m()), u(O, "data-notched", C() || void 0), k = y(O, "", k, {
			width: `${b()}px`,
			height: `${b()}px`
		});
	}), n(i, O), a();
}
// upstream/src/shared/ui/data/Artifact/HostGlyph.svelte
var _e = S("<span class=\"glyph svelte-1jlsa7o\" aria-hidden=\"true\"><!></span>");
function Z(c, l) {
	t(l, !0);
	let u = h(l, "host", 3, ""), f = h(l, "url", 3, ""), p = h(l, "file", 3, !1), g = h(l, "size", 3, 16), v = se(), b = d(() => !p() && v ? v(f() || u()) : null);
	var x = i(), S = m(x), C = (e) => {
		X(e, {
			get image() {
				return o(b).image;
			},
			get tone() {
				return o(b).tone;
			},
			get size() {
				return g();
			}
		});
	}, E = (t) => {
		var r = _e();
		let i;
		var a = s(r);
		{
			let e = d(() => Math.round(g() * .62));
			w(a, {
				get icon() {
					return T;
				},
				get size() {
					return o(e);
				}
			});
		}
		e(r), _(() => i = y(r, "", i, { "--glyph": `${g()}px` })), n(t, r);
	};
	r(S, (e) => {
		o(b) ? e(C) : p() && e(E, 1);
	}), n(c, x), a();
}
// upstream/src/features/work/components/cards/HostGlyph.svelte
function Q(e) {
	let t = e.trim();
	if (!t) return null;
	let n = t;
	if (/^https?:\/\//iu.test(t)) {
		let e = W(t);
		if (e) return e;
		try {
			n = new URL(t).host;
		} catch {
			return null;
		}
	}
	let r = n.replace(/^www\./iu, ""), i = (e) => W(`https://${e}`) ?? W(`https://www.${e}`) ?? W(`http://${e}`), a = K(r);
	return i(r) ?? (a === r ? null : i(a));
}
function $(e) {
	let t = e.trim();
	if (!t) return null;
	try {
		let e = new URL(/^https?:\/\//iu.test(t) ? t : `https://${t}`);
		return e.protocol === "https:" && e.hostname.includes(".") ? e.origin : null;
	} catch {
		return null;
	}
}
function ve(e, s) {
	t(s, !0);
	let l = h(s, "host", 3, ""), u = h(s, "url", 3, ""), p = h(s, "icon", 3, null), g = h(s, "file", 3, !1), _ = h(s, "size", 3, 16), v = h(s, "loading", 3, !1);
	h(s, "initial", 3, !0);
	let y = d(() => p() ? U(p()) : null), b = d(() => g() ? null : o(y) ? {
		image: o(y),
		tone: G(p())
	} : Q(u() || l())), x = c(F);
	f(() => {
		if (g() || o(b) || !x) return;
		let e = $(u() || l());
		if (!e) return;
		x(e);
		let t = new URL(e).hostname.replace(/^www\./iu, ""), n = K(t);
		n !== t && x(`https://${n}`);
	});
	var S = i(), C = m(S), w = (e) => {
		{
			let t = d(() => o(b)?.image ?? null), n = d(() => o(b)?.tone ?? "mid"), r = d(() => g() ? T : void 0);
			X(e, {
				get image() {
					return o(t);
				},
				get tone() {
					return o(n);
				},
				get size() {
					return _();
				},
				get loading() {
					return v();
				},
				get fallback() {
					return o(r);
				}
			});
		}
	}, E = (e) => {
		Z(e, {
			get host() {
				return l();
			},
			get file() {
				return g();
			},
			get size() {
				return _();
			}
		});
	};
	r(C, (e) => {
		o(b) || v() ? e(w) : g() && e(E, 1);
	}), n(e, S), a();
}
export { re as A, M as C, D, F as E, ie as O, j as S, te as T, L as _, X as a, A as b, q as c, G as d, oe as f, ne as g, ee as h, Z as i, ae as k, fe as l, P as m, Q as n, ue as o, O as p, $ as r, K as s, ve as t, U as u, k as v, N as w, E as x, I as y };
