import "./disclose-version-DFvUDwEH.js";
import { n as e, r as t, t as n } from "./FavIcon-CMLLDqJA.js";
import { $ as r, B as i, Dt as a, F as o, Ft as s, H as c, Ot as l, Tt as u, V as d, dt as f, kt as p, n as m, ot as h, r as g, ut as _, x as v, yt as y } from "./index-client-C_2wYFnt.js";
import { t as b } from "./Icon-E4BzZ4dm.js";
import { t as x } from "./File01Icon-C7ue_hSG.js";
import { t as S } from "./FavIcon-DK-naZed.js";
// upstream/src/features/work/lib/canvas-context.ts
var C = Symbol("canvas-inspection"), w = Symbol("canvas-resize"), T = Symbol("canvas-action"), E = Symbol("canvas-evidence"), D = Symbol("canvas-focus-result"), O = Symbol("canvas-open"), k = Symbol("canvas-open-link"), A = Symbol("canvas-open-tasks"), j = Symbol("canvas-areas"), M = Symbol("canvas-pictures"), N = Symbol("canvas-area-actions"), P = Symbol("canvas-arrival"), F = Symbol("canvas-probe"), I = Symbol("canvas-work"), L = Symbol("canvas-seen"), R = Symbol("canvas-toolbar"), z = Symbol("canvas-far"), B = Symbol("canvas-board"), V = Symbol("site-marks");
function H(e) {
	p(V, e);
}
function U() {
	return u(V);
}
// upstream/src/features/work/lib/run/site.ts
var W = /* @__PURE__ */ new Set(/* @__PURE__ */ "co.uk,org.uk,ac.uk,gov.uk,me.uk,com.au,net.au,org.au,co.nz,co.jp,ne.jp,or.jp,co.kr,com.br,com.mx,com.ar,com.tr,com.cn,com.hk,com.sg,com.tw,co.in,co.za,co.il,com.pl,com.ua,github.io,gitlab.io,vercel.app,netlify.app,pages.dev,workers.dev,herokuapp.com,blogspot.com".split(","));
function G(e) {
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
	return W.has(n) ? t.slice(-3).join(".") : n;
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
}, Y = {
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
}, X = (e) => e.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
function ee(e, t = []) {
	let n = Y[e.replace(/^www\./u, "").toLowerCase()];
	if (n) return n;
	let r = K(e), i = q(e);
	if (!i) return e;
	if (J[i]) return J[i];
	let a = X(r);
	for (let e of t) for (let t of e.split(/\s+[|·•–—-]\s+|\s*[|·•]\s*/u)) {
		let e = t.trim();
		if (e && e.length <= 32 && (X(e) === i || X(e) === a)) return e;
	}
	let o = RegExp(`(?:^|[^\\p{L}\\p{N}])(${i.replace(/[^a-z0-9]/gu, "")})(?![\\p{L}\\p{N}])`, "iu");
	for (let e of t) {
		let t = o.exec(e)?.[1];
		if (t && t !== t.toLowerCase()) return t;
	}
	return r;
}
// upstream/src/shared/ui/data/Artifact/HostGlyph.svelte
var te = c("<span class=\"glyph svelte-1jlsa7o\" aria-hidden=\"true\"><!></span>");
function Z(e, t) {
	l(t, !0);
	let n = g(t, "host", 3, ""), c = g(t, "url", 3, ""), u = g(t, "file", 3, !1), p = g(t, "size", 3, 16), m = U(), C = y(() => !u() && m ? m(c() || n()) : null);
	var w = d(), T = f(w), E = (e) => {
		S(e, {
			get image() {
				return r(C).image;
			},
			get tone() {
				return r(C).tone;
			},
			get size() {
				return p();
			}
		});
	}, D = (e) => {
		var t = te();
		let n;
		var a = _(t);
		{
			let e = y(() => Math.round(p() * .62));
			b(a, {
				get icon() {
					return x;
				},
				get size() {
					return r(e);
				}
			});
		}
		s(t), h(() => n = v(t, "", n, { "--glyph": `${p()}px` })), i(e, t);
	};
	o(T, (e) => {
		r(C) ? e(E) : u() && e(D, 1);
	}), i(e, w), a();
}
// upstream/src/features/work/components/cards/HostGlyph.svelte
function Q(e) {
	let t = e.trim();
	if (!t) return null;
	let r = t;
	if (/^https?:\/\//iu.test(t)) {
		let e = n(t);
		if (e) return e;
		try {
			r = new URL(t).host;
		} catch {
			return null;
		}
	}
	let i = r.replace(/^www\./iu, ""), a = (e) => n(`https://${e}`) ?? n(`https://www.${e}`) ?? n(`http://${e}`), o = K(i);
	return a(i) ?? (o === i ? null : a(o));
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
function ne(n, s) {
	l(s, !0);
	let c = g(s, "host", 3, ""), p = g(s, "url", 3, ""), h = g(s, "icon", 3, null), _ = g(s, "file", 3, !1), v = g(s, "size", 3, 16), b = g(s, "loading", 3, !1);
	g(s, "initial", 3, !0);
	let C = y(() => h() ? e(h()) : null), w = y(() => _() ? null : r(C) ? {
		image: r(C),
		tone: t(h())
	} : Q(p() || c())), T = u(F);
	m(() => {
		if (_() || r(w) || !T) return;
		let e = $(p() || c());
		if (!e) return;
		T(e);
		let t = new URL(e).hostname.replace(/^www\./iu, ""), n = K(t);
		n !== t && T(`https://${n}`);
	});
	var E = d(), D = f(E), O = (e) => {
		{
			let t = y(() => r(w)?.image ?? null), n = y(() => r(w)?.tone ?? "mid"), i = y(() => _() ? x : void 0);
			S(e, {
				get image() {
					return r(t);
				},
				get tone() {
					return r(n);
				},
				get size() {
					return v();
				},
				get loading() {
					return b();
				},
				get fallback() {
					return r(i);
				}
			});
		}
	}, k = (e) => {
		Z(e, {
			get host() {
				return c();
			},
			get file() {
				return _();
			},
			get size() {
				return v();
			}
		});
	};
	o(D, (e) => {
		r(w) || b() ? e(O) : _() && e(k, 1);
	}), i(n, E), a();
}
export { F as C, I as D, R as E, M as S, L as T, D as _, G as a, k as b, ee as c, N as d, j as f, z as g, E as h, Z as i, H as l, B as m, Q as n, K as o, P as p, $ as r, q as s, ne as t, T as u, C as v, w, A as x, O as y };
