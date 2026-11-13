import "./disclose-version-DFvUDwEH.js";
import { B as e, Ct as t, Dt as n, Et as r, F as i, H as a, Nt as o, Q as s, S as c, Tt as l, V as u, _t as d, at as f, ct as p, h as m, ht as h, it as g, lt as _, n as v, pt as y, r as b, s as x, x as S } from "./index-client-oI5R0J23.js";
import { n as C } from "./index-client-zcLcgEWT.js";
import "./native-events-Bexa20bU.js";
import { t as w } from "./Icon-BfOzno3u.js";
import { t as T } from "./File01Icon-C7ue_hSG.js";
// upstream/src/features/work/lib/canvas-context.ts
var E = Symbol("canvas-inspection"), D = Symbol("canvas-resize"), O = Symbol("canvas-action"), k = Symbol("canvas-evidence"), A = Symbol("canvas-focus-result"), j = Symbol("canvas-open"), M = Symbol("canvas-open-link"), N = Symbol("canvas-open-tasks"), ee = Symbol("canvas-areas"), te = Symbol("canvas-pictures"), P = Symbol("canvas-area-actions"), ne = Symbol("canvas-arrival"), F = Symbol("canvas-probe"), re = Symbol("canvas-work"), ie = Symbol("canvas-seen"), ae = Symbol("canvas-toolbar"), I = Symbol("canvas-far"), L = Symbol("canvas-board"), R = Symbol("site-marks");
function oe(e) {
	n(R, e);
}
function se() {
	return t(R);
}
var z = new C(), ce = new C(), B = h(null), V = (e, t) => `${e}\u0000${t}`, H = (e, t) => `${e}\u0000${t}`;
function U(e) {
	return e ? z.get(V(e.origin, e.revision))?.image ?? null : null;
}
function W(e) {
	let t = /^(https?):\/\/(?:[^@/?#]*@)?([^/?#:]+)(?::(\d+))?/iu.exec(e);
	if (!t) return null;
	let n = t[1].toLowerCase(), r = t[3] && t[3] !== (n === "https" ? "443" : "80") ? `:${t[3]}` : "";
	if (s(B) === null) return null;
	let i = ce.get(H(s(B), `${n}://${t[2].toLowerCase()}${r}`)), a = i === void 0 ? void 0 : z.get(i);
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
var pe = a("<span><canvas></canvas></span>"), me = a("<span class=\"favicon-fallback\"><!></span>"), he = a("<span class=\"favicon-blank\"></span>"), ge = a("<span class=\"favicon\" data-favicon=\"\" aria-hidden=\"true\"><!></span>");
function X(t, n) {
	r(n, !0);
	let a = b(n, "tone", 3, "mid"), u = b(n, "loading", 3, !1), _ = b(n, "size", 3, 17), v = b(n, "lit", 3, !1), C = b(n, "notched", 3, !1), T = h(void 0), E = d(() => Math.max(4, Math.round(_() * .28))), D = d(() => Math.max(1, Math.round(_() * .12)));
	f(() => {
		let e = n.image;
		e && s(T) && s(T).getContext("2d")?.putImageData(e, 0, 0);
	});
	var O = ge();
	let k;
	var A = p(O), j = (t) => {
		var r = pe();
		let i, l;
		var u = p(r);
		x(u, (e) => y(T, e), () => s(T)), o(r), g(() => {
			m(r, "data-tone", a()), i = c(r, 1, "favicon-plate", null, i, { "favicon-plate-lit": v() }), l = S(r, "", l, {
				"border-radius": `${s(E)}px`,
				"--favicon-inset": `${s(D)}px`
			}), m(u, "width", n.image.width), m(u, "height", n.image.height);
		}), e(t, r);
	}, M = (t) => {
		var r = me(), i = p(r);
		{
			let e = d(() => Math.round(_() * .85));
			w(i, {
				get icon() {
					return n.fallback;
				},
				get size() {
					return s(e);
				}
			});
		}
		o(r), e(t, r);
	}, N = (t) => {
		var n = he();
		e(t, n);
	};
	i(A, (e) => {
		n.image ? e(j) : n.fallback ? e(M, 1) : e(N, -1);
	}), o(O), g(() => {
		m(O, "data-loading", u()), m(O, "data-notched", C() || void 0), k = S(O, "", k, {
			width: `${_()}px`,
			height: `${_()}px`
		});
	}), e(t, O), l();
}
// upstream/src/shared/ui/data/Artifact/HostGlyph.svelte
var _e = a("<span class=\"glyph svelte-1jlsa7o\" aria-hidden=\"true\"><!></span>");
function Z(t, n) {
	r(n, !0);
	let a = b(n, "host", 3, ""), c = b(n, "url", 3, ""), f = b(n, "file", 3, !1), m = b(n, "size", 3, 16), h = se(), v = d(() => !f() && h ? h(c() || a()) : null);
	var y = u(), x = _(y), C = (e) => {
		X(e, {
			get image() {
				return s(v).image;
			},
			get tone() {
				return s(v).tone;
			},
			get size() {
				return m();
			}
		});
	}, E = (t) => {
		var n = _e();
		let r;
		var i = p(n);
		{
			let e = d(() => Math.round(m() * .62));
			w(i, {
				get icon() {
					return T;
				},
				get size() {
					return s(e);
				}
			});
		}
		o(n), g(() => r = S(n, "", r, { "--glyph": `${m()}px` })), e(t, n);
	};
	i(x, (e) => {
		s(v) ? e(C) : f() && e(E, 1);
	}), e(t, y), l();
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
function ve(n, a) {
	r(a, !0);
	let o = b(a, "host", 3, ""), c = b(a, "url", 3, ""), f = b(a, "icon", 3, null), p = b(a, "file", 3, !1), m = b(a, "size", 3, 16), h = b(a, "loading", 3, !1);
	b(a, "initial", 3, !0);
	let g = d(() => f() ? U(f()) : null), y = d(() => p() ? null : s(g) ? {
		image: s(g),
		tone: G(f())
	} : Q(c() || o())), x = t(F);
	v(() => {
		if (p() || s(y) || !x) return;
		let e = $(c() || o());
		if (!e) return;
		x(e);
		let t = new URL(e).hostname.replace(/^www\./iu, ""), n = K(t);
		n !== t && x(`https://${n}`);
	});
	var S = u(), C = _(S), w = (e) => {
		{
			let t = d(() => s(y)?.image ?? null), n = d(() => s(y)?.tone ?? "mid"), r = d(() => p() ? T : void 0);
			X(e, {
				get image() {
					return s(t);
				},
				get tone() {
					return s(n);
				},
				get size() {
					return m();
				},
				get loading() {
					return h();
				},
				get fallback() {
					return s(r);
				}
			});
		}
	}, E = (e) => {
		Z(e, {
			get host() {
				return o();
			},
			get file() {
				return p();
			},
			get size() {
				return m();
			}
		});
	};
	i(C, (e) => {
		s(y) || h() ? e(w) : p() && e(E, 1);
	}), e(n, S), l();
}
export { re as A, M as C, D, F as E, ie as O, j as S, te as T, L as _, X as a, A as b, q as c, G as d, oe as f, ne as g, ee as h, Z as i, ae as k, fe as l, P as m, Q as n, ue as o, O as p, $ as r, K as s, ve as t, U as u, k as v, N as w, E as x, I as y };
