import { Ct as e, bt as t, gt as n, st as r, tt as i, ut as a, vt as o } from "./index-client-DH73-vTM.js";
// src/native/host-session.ts
var s = () => ({});
function c(e) {
	s = e;
}
function l() {
	return {
		"Content-Type": "application/json",
		...s()
	};
}
// src/browser-host.ts
var u = Promise.resolve(), ee = {
	kind: "frame",
	openSource: () => u,
	navigate: () => u,
	goBack: () => u,
	goForward: () => u,
	reload: () => u,
	close: () => u,
	setBounds: () => u,
	setVisible: () => u,
	openTab: () => u,
	stop: () => u,
	downloads: async () => [],
	showDownload: () => u,
	blockerStatus: async () => null,
	blockerSet: async () => null,
	blockerAllow: async () => null,
	permissions: async () => [],
	resetPermissions: async () => [],
	clearData: () => u,
	async openExternal(e) {
		window.open(e, "_blank", "noopener,noreferrer");
	},
	subscribe: () => () => {}
};
function te(e, t) {
	let n = /* @__PURE__ */ new Set();
	window.__aegisBrowserEvent = (e) => {
		if (e && typeof e.id == "number" && typeof e.kind == "string") for (let t of n) t(e);
	};
	let r = (t, n) => e.invoke(t, n), i = (e, t) => r(e, t).catch(() => {});
	return {
		kind: "native",
		openSource: (e, t, n) => r("browser_open", {
			id: e,
			url: t,
			rect: n
		}),
		navigate: (e, t) => r("browser_navigate", {
			id: e,
			url: t
		}),
		goBack: (e) => r("browser_back", { id: e }),
		goForward: (e) => r("browser_forward", { id: e }),
		reload: (e) => r("browser_reload", { id: e }),
		close: (e) => i("browser_close", { id: e }),
		setBounds: (e, t) => i("browser_bounds", {
			id: e,
			rect: t
		}),
		setVisible: (e, t) => i("browser_show", {
			id: e,
			visible: t
		}),
		openTab: (e, t, n) => r("tab_open", {
			id: e,
			url: t,
			rect: n
		}),
		stop: (e) => i("browser_stop", { id: e }),
		media: t ? (e, t) => r("tab_media", {
			id: e,
			action: t
		}) : void 0,
		setPageZoom: t ? (e) => r("tab_zoom", { percent: e }) : void 0,
		downloads: () => e.invoke("tab_downloads", {}),
		showDownload: (e) => i("download_show", { id: e }),
		blockerStatus: (t) => e.invoke("blocker_status", t == null ? {} : { id: t }).catch(() => null),
		blockerSet: (t) => e.invoke("blocker_set", { enabled: t }),
		blockerAllow: (t, n) => e.invoke("blocker_allow", {
			host: t,
			allowed: n
		}),
		permissions: () => e.invoke("permissions_list", {}),
		resetPermissions: (t) => e.invoke("permissions_reset", t ? { origin: t } : {}),
		clearData: (t) => e.invoke("tab_clear_data", t),
		openExternal: (e) => r("open_external", { url: e }),
		subscribe(e) {
			return n.add(e), () => n.delete(e);
		}
	};
}
function ne() {
	let e = typeof window > "u" ? void 0 : window, t = e?.aegisDesktop ?? e?.__TAURI_INTERNALS__;
	return t && typeof t.invoke == "function" ? te(t, !!e?.aegisDesktop) : ee;
}
var d = ne(), re = (() => {
	let e = (typeof window > "u" ? void 0 : window)?.aegisDesktop, t = !!(e && typeof e.invoke == "function"), n = (n, r = {}) => t ? e.invoke(n, r) : Promise.reject(/* @__PURE__ */ Error("Folder access needs AEGIS Desktop."));
	return {
		available: t,
		selectFolder: (e = {}) => n("dev_folder_select", e),
		selectFile: () => n("dev_file_select"),
		folders: () => t ? n("dev_folders") : Promise.resolve([]),
		revoke: (e) => n("dev_folder_revoke", { id: e }),
		pageMeta: (e) => t ? n("tab_page_meta", { id: e }).catch(() => null) : Promise.resolve(null),
		mediaHandoff: (e) => t ? n("media_handoff", { id: e }).catch(() => ({
			time: null,
			playing: !1,
			count: 0
		})) : Promise.resolve({
			time: null,
			playing: !1,
			count: 0
		})
	};
})(), ie = "aegis-browser-settings-v1", ae = {
	wallpaper: { kind: "sky" },
	dim: !1,
	showClock: !0,
	pageZoom: 100,
	figures: {
		trackers: !0,
		focus: !0,
		due: !0
	},
	restoreTabs: !0,
	afterClose: "next",
	history: !0,
	focus: {
		minutes: 25,
		goal: 120,
		breaks: !1,
		holdSites: !1,
		sites: [
			"youtube.com",
			"x.com",
			"reddit.com"
		]
	}
}, oe = /^#[0-9a-f]{6}$/i;
function f(e) {
	let t = e && typeof e == "object" ? e : {}, n = t.wallpaper, r = n?.kind === "image" && typeof n.data == "string" && n.data.startsWith("data:image/") || n?.kind === "color" && typeof n.color == "string" && oe.test(n.color) ? n : { kind: "sky" }, i = t.figures ?? {}, a = t.focus ?? {}, o = Number(a.minutes), s = Number(a.goal);
	return {
		wallpaper: r,
		dim: t.dim === !0,
		showClock: t.showClock !== !1,
		pageZoom: typeof t.pageZoom == "number" && Number.isInteger(t.pageZoom) && t.pageZoom >= 50 && t.pageZoom <= 200 ? t.pageZoom : 100,
		figures: {
			trackers: i.trackers !== !1,
			focus: i.focus !== !1,
			due: i.due !== !1
		},
		restoreTabs: t.restoreTabs !== !1,
		afterClose: t.afterClose === "previous" || t.afterClose === "recent" ? t.afterClose : "next",
		history: t.history !== !1,
		focus: {
			minutes: Number.isFinite(o) && o >= 5 && o <= 120 ? Math.round(o) : 25,
			goal: Number.isFinite(s) && s >= 15 && s <= 720 ? Math.round(s) : 120,
			breaks: a.breaks === !0,
			holdSites: a.holdSites === !0,
			sites: Array.isArray(a.sites) ? a.sites.filter((e) => typeof e == "string" && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(e)).slice(0, 50) : ae.focus.sites
		}
	};
}
function se() {
	try {
		return f(JSON.parse(localStorage.getItem(ie) || "null"));
	} catch {
		return f(null);
	}
}
var p = new class {
	#e = t(n(se()));
	get value() {
		return i(this.#e);
	}
	set value(e) {
		o(this.#e, e, !0);
	}
	#t = t("");
	get error() {
		return i(this.#t);
	}
	set error(e) {
		o(this.#t, e, !0);
	}
	update(e) {
		let t = f(JSON.parse(JSON.stringify(this.value)));
		e(t);
		let n = f(t);
		try {
			localStorage.setItem(ie, JSON.stringify(n)), this.error = "";
		} catch {
			this.error = "That picture is too large to keep. Choose a smaller one.";
			return;
		}
		this.value = n;
	}
}();
async function ce(e, t = 1920) {
	if (!/^image\/(png|jpeg|webp|avif|gif)$/.test(e.type)) throw Error("Choose a PNG, JPEG, WebP or AVIF picture.");
	let n = await createImageBitmap(e), r = Math.min(1, t / Math.max(n.width, n.height)), i = document.createElement("canvas");
	return i.width = Math.round(n.width * r), i.height = Math.round(n.height * r), i.getContext("2d").drawImage(n, 0, 0, i.width, i.height), n.close(), i.toDataURL("image/jpeg", .82);
}
// src/focus.svelte.ts
var m = "aegis-focus-v1";
function le(e) {
	let t = Math.min(20, Math.max(3, Math.floor(e / 5)));
	return {
		short: t,
		long: Math.min(30, t * 3)
	};
}
function h(e) {
	return `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`;
}
function ue(e, t = Date.now()) {
	let n = e.phase === "focus" ? Math.max(0, Math.min(t, e.phaseEndsAt) - e.phaseStartedAt) / 1e3 : 0;
	return e.focused + n;
}
function g(e, t) {
	if (e.phase === "focus") {
		let n = Math.max(0, (Math.min(t, e.phaseEndsAt) - e.phaseStartedAt) / 1e3), r = e.rounds + 1, i = e.focused + n;
		if (!e.breaks) return {
			next: {
				...e,
				rounds: r,
				focused: i,
				allowed: [],
				phaseStartedAt: t,
				phaseEndsAt: t + e.minutes * 6e4
			},
			finishedRound: n
		};
		let a = r % 4 == 0, o = a ? e.longBreakMinutes : e.breakMinutes;
		return {
			next: {
				...e,
				phase: a ? "long_break" : "break",
				rounds: r,
				focused: i,
				allowed: [],
				phaseStartedAt: t,
				phaseEndsAt: t + o * 6e4
			},
			finishedRound: n
		};
	}
	return {
		next: {
			...e,
			phase: "focus",
			phaseStartedAt: t,
			phaseEndsAt: t + e.minutes * 6e4
		},
		finishedRound: 0
	};
}
function de() {
	try {
		let e = JSON.parse(localStorage.getItem(m) || "null");
		if (e && typeof e == "object" && e.days && typeof e.days == "object") return {
			session: e.session ?? null,
			days: e.days,
			rounds: e.rounds && typeof e.rounds == "object" ? e.rounds : {}
		};
	} catch {}
	return {
		session: null,
		days: {}
	};
}
var _ = new class {
	#e = t(null);
	get session() {
		return i(this.#e);
	}
	set session(e) {
		o(this.#e, e, !0);
	}
	#t = t(n({}));
	get days() {
		return i(this.#t);
	}
	set days(e) {
		o(this.#t, e, !0);
	}
	#n = t(n({}));
	get rounds() {
		return i(this.#n);
	}
	set rounds(e) {
		o(this.#n, e, !0);
	}
	#r = t(n(Date.now()));
	get now() {
		return i(this.#r);
	}
	set now(e) {
		o(this.#r, e, !0);
	}
	timer;
	constructor() {
		let e = de();
		this.days = e.days, this.rounds = e.rounds ?? {}, this.session = e.session, this.catchUp(Date.now());
	}
	save() {
		let e = Object.keys(this.days).sort().slice(-30);
		try {
			localStorage.setItem(m, JSON.stringify({
				session: this.session,
				days: Object.fromEntries(e.map((e) => [e, this.days[e]])),
				rounds: Object.fromEntries(e.filter((e) => this.rounds[e]).map((e) => [e, this.rounds[e]]))
			}));
		} catch {}
	}
	credit(e, t, n = !1) {
		if (e <= 0) return;
		let r = h(new Date(t));
		this.days = {
			...this.days,
			[r]: (this.days[r] ?? 0) + e
		};
		let i = this.rounds[r] ?? {
			sessions: 0,
			completed: 0
		};
		this.rounds = {
			...this.rounds,
			[r]: {
				sessions: i.sessions + 1,
				completed: i.completed + +!!n
			}
		};
	}
	catchUp(e) {
		let t = 0;
		for (; this.session && this.session.phaseEndsAt <= e && t++ < 500;) {
			let e = this.session.phaseEndsAt, { next: t, finishedRound: n } = g(this.session, e);
			this.credit(n, e, !0), this.session = t, this.announce(t);
		}
		this.save(), this.schedule();
	}
	schedule() {
		clearTimeout(this.timer), this.session && (this.timer = setTimeout(() => this.catchUp(Date.now()), Math.max(250, this.session.phaseEndsAt - Date.now() + 50)));
	}
	announce(e) {
		if (typeof Notification < "u" && Notification.permission === "granted" && document.visibilityState !== "visible") try {
			new Notification(e.phase === "focus" ? "Focus round started" : "Time for a break", {
				body: e.phase === "focus" ? `${e.minutes} minutes` : `Round ${e.rounds} done`,
				silent: !0
			});
		} catch {}
	}
	start(e, t = !0, n = Date.now()) {
		let { short: r, long: i } = le(e);
		this.session = {
			phase: "focus",
			startedAt: n,
			phaseStartedAt: n,
			phaseEndsAt: n + e * 6e4,
			minutes: e,
			breaks: t,
			breakMinutes: r,
			longBreakMinutes: i,
			rounds: 0,
			focused: 0,
			allowed: []
		}, this.save(), this.schedule();
	}
	stop(e = Date.now()) {
		this.session && (this.session.phase === "focus" && this.credit(Math.max(0, (Math.min(e, this.session.phaseEndsAt) - this.session.phaseStartedAt) / 1e3), e), this.session = null, clearTimeout(this.timer), this.save());
	}
	skip(e = Date.now()) {
		if (!this.session) return;
		let { next: t, finishedRound: n } = g({
			...this.session,
			phaseEndsAt: Math.min(e, this.session.phaseEndsAt)
		}, e);
		this.credit(n, e), this.session = t, this.save(), this.schedule();
	}
	allow(e) {
		this.session && !this.session.allowed.includes(e) && (this.session = {
			...this.session,
			allowed: [...this.session.allowed, e]
		}, this.save());
	}
	holds(e, t, n) {
		if (!n || !this.session || this.session.phase !== "focus") return null;
		let r = "";
		try {
			r = new URL(e).hostname.toLowerCase().replace(/^www\./, "");
		} catch {
			return null;
		}
		let i = t.find((e) => r === e || r.endsWith("." + e));
		return i && !this.session.allowed.includes(i) ? i : null;
	}
	today(e = this.now) {
		let t = h(new Date(e));
		return (this.days[t] ?? 0) + (this.session ? ue(this.session, e) - this.session.focused : 0);
	}
}(), fe = /* @__PURE__ */ new Set(/* @__PURE__ */ "a.i.e.x.r.b.d.g.k.w.so.aw.gm.gl.gr.tw.wa.ia.tr.sp.ok.hi.no.yo.go.to.in.on.at.it.is.me.my.we.us.or.an.as.be.do.he.if.of.up.ya.lol.omg.idk.brb.btw.hey.yes.google.brave.perplexity.wiki.images.maps.twitter.crates.crate.translate.rust.twitch.archive".split("."));
function v(e, t) {
	let n = e.indexOf(" ");
	if (n < 2) return null;
	let r = e.slice(0, n).toLowerCase();
	if (fe.has(r)) return null;
	let i = t.find((e) => e.enabled && e.keywords.some((e) => e.toLowerCase() === r));
	return i ? {
		shortcut: i,
		query: e.slice(n + 1).trim()
	} : null;
}
function pe(e, t) {
	let n = v(e, t);
	return n && !n.query ? "" : null;
}
function me(e, t) {
	let n = v(e, t);
	if (n) return n.shortcut;
	for (let n of e.split(/\s+/u)) {
		if (!n.startsWith("!")) continue;
		let e = n.slice(1).toLowerCase(), r = t.find((t) => t.enabled && t.keywords.some((t) => t.toLowerCase() === e));
		if (r) return r;
	}
	return null;
}
function he(e) {
	return `!${e.keywords[0] ?? ""}`;
}
function y(e, t, n) {
	let r = v(e, n), i = r ? r.query : e.split(/\s+/u).filter((e) => !e.startsWith("!") || !n.some((t) => t.enabled && t.keywords.some((t) => t.toLowerCase() === e.slice(1).toLowerCase()))).join(" ").trim();
	return i ? `${t} ${i}` : `${t} `;
}
// upstream/search-shortcuts.json
var ge = [
	{
		id: "google",
		name: "Google",
		keywords: ["g", "google"],
		search_url: "https://www.google.com/search?q={query}",
		home_url: "https://www.google.com/",
		domain: "www.google.com",
		suggestions: "google",
		enabled: !0
	},
	{
		id: "duckduckgo",
		name: "DuckDuckGo",
		keywords: [
			"d",
			"ddg",
			"duckduckgo"
		],
		search_url: "https://duckduckgo.com/?q={query}",
		home_url: "https://duckduckgo.com/",
		domain: "duckduckgo.com",
		suggestions: "duckduckgo",
		enabled: !0
	},
	{
		id: "bing",
		name: "Bing",
		keywords: ["b", "bing"],
		search_url: "https://www.bing.com/search?q={query}",
		home_url: "https://www.bing.com/",
		domain: "www.bing.com",
		suggestions: "bing",
		enabled: !0
	},
	{
		id: "brave",
		name: "Brave",
		keywords: ["br", "brave"],
		search_url: "https://search.brave.com/search?q={query}",
		home_url: "https://search.brave.com/",
		domain: "search.brave.com",
		suggestions: "brave",
		enabled: !0
	},
	{
		id: "kagi",
		name: "Kagi",
		keywords: ["k", "kagi"],
		search_url: "https://kagi.com/search?q={query}",
		home_url: "https://kagi.com/",
		domain: "kagi.com",
		suggestions: null,
		enabled: !0
	},
	{
		id: "perplexity",
		name: "Perplexity",
		keywords: ["pplx", "perplexity"],
		search_url: "https://www.perplexity.ai/search?q={query}",
		home_url: "https://www.perplexity.ai/",
		domain: "www.perplexity.ai",
		suggestions: null,
		enabled: !0
	},
	{
		id: "chatgpt",
		name: "ChatGPT",
		keywords: ["gpt", "chatgpt"],
		search_url: "https://chatgpt.com/?q={query}",
		home_url: "https://chatgpt.com/",
		domain: "chatgpt.com",
		suggestions: null,
		enabled: !0
	},
	{
		id: "claude",
		name: "Claude",
		keywords: ["cl", "claude"],
		search_url: "https://claude.ai/new?q={query}",
		home_url: "https://claude.ai/",
		domain: "claude.ai",
		suggestions: null,
		enabled: !0
	},
	{
		id: "wikipedia",
		name: "Wikipedia",
		keywords: [
			"w",
			"wiki",
			"wikipedia"
		],
		search_url: "https://en.wikipedia.org/w/index.php?search={query}",
		home_url: "https://en.wikipedia.org/",
		domain: "en.wikipedia.org",
		suggestions: null,
		enabled: !0
	},
	{
		id: "youtube",
		name: "YouTube",
		keywords: ["yt", "youtube"],
		search_url: "https://www.youtube.com/results?search_query={query}",
		home_url: "https://www.youtube.com/",
		domain: "www.youtube.com",
		suggestions: null,
		enabled: !0
	},
	{
		id: "google-images",
		name: "Google Images",
		keywords: ["gi", "images"],
		search_url: "https://www.google.com/search?tbm=isch&q={query}",
		home_url: "https://images.google.com/",
		domain: "images.google.com",
		suggestions: null,
		enabled: !0
	},
	{
		id: "google-maps",
		name: "Google Maps",
		keywords: ["gm", "maps"],
		search_url: "https://www.google.com/maps/search/{query}",
		home_url: "https://maps.google.com/",
		domain: "maps.google.com",
		suggestions: null,
		enabled: !0
	},
	{
		id: "github",
		name: "GitHub",
		keywords: ["gh", "github"],
		search_url: "https://github.com/search?q={query}",
		home_url: "https://github.com/",
		domain: "github.com",
		suggestions: null,
		enabled: !0
	},
	{
		id: "reddit",
		name: "Reddit",
		keywords: ["r", "reddit"],
		search_url: "https://www.reddit.com/search/?q={query}",
		home_url: "https://www.reddit.com/",
		domain: "www.reddit.com",
		suggestions: null,
		enabled: !0
	},
	{
		id: "x",
		name: "X",
		keywords: ["x", "twitter"],
		search_url: "https://x.com/search?q={query}",
		home_url: "https://x.com/",
		domain: "x.com",
		suggestions: null,
		enabled: !0
	},
	{
		id: "amazon",
		name: "Amazon",
		keywords: ["a", "amazon"],
		search_url: "https://www.amazon.com/s?k={query}",
		home_url: "https://www.amazon.com/",
		domain: "www.amazon.com",
		suggestions: null,
		enabled: !0
	},
	{
		id: "mdn",
		name: "MDN",
		keywords: ["mdn"],
		search_url: "https://developer.mozilla.org/en-US/search?q={query}",
		home_url: "https://developer.mozilla.org/",
		domain: "developer.mozilla.org",
		suggestions: null,
		enabled: !0
	},
	{
		id: "stackoverflow",
		name: "Stack Overflow",
		keywords: ["so", "stackoverflow"],
		search_url: "https://stackoverflow.com/search?q={query}",
		home_url: "https://stackoverflow.com/",
		domain: "stackoverflow.com",
		suggestions: null,
		enabled: !0
	},
	{
		id: "hackernews",
		name: "Hacker News",
		keywords: ["hn", "hackernews"],
		search_url: "https://hn.algolia.com/?q={query}",
		home_url: "https://news.ycombinator.com/",
		domain: "news.ycombinator.com",
		suggestions: null,
		enabled: !0
	},
	{
		id: "translate",
		name: "Translate",
		keywords: ["tr", "translate"],
		search_url: "https://translate.google.com/?sl=auto&tl=en&text={query}",
		home_url: "https://translate.google.com/",
		domain: "translate.google.com",
		suggestions: null,
		enabled: !0
	},
	{
		id: "ebay",
		name: "eBay",
		keywords: ["e", "ebay"],
		search_url: "https://www.ebay.com/sch/i.html?_nkw={query}",
		home_url: "https://www.ebay.com/",
		domain: "www.ebay.com",
		suggestions: null,
		enabled: !0
	},
	{
		id: "wolframalpha",
		name: "Wolfram Alpha",
		keywords: ["wa", "wolfram"],
		search_url: "https://www.wolframalpha.com/input?i={query}",
		home_url: "https://www.wolframalpha.com/",
		domain: "www.wolframalpha.com",
		suggestions: null,
		enabled: !0
	},
	{
		id: "archwiki",
		name: "ArchWiki",
		keywords: ["aw", "archwiki"],
		search_url: "https://wiki.archlinux.org/index.php?search={query}",
		home_url: "https://wiki.archlinux.org/",
		domain: "wiki.archlinux.org",
		suggestions: null,
		enabled: !0
	},
	{
		id: "docs-rs",
		name: "docs.rs",
		keywords: ["docsrs"],
		search_url: "https://docs.rs/releases/search?query={query}",
		home_url: "https://docs.rs/",
		domain: "docs.rs",
		suggestions: null,
		enabled: !0
	},
	{
		id: "twitch",
		name: "Twitch",
		keywords: ["tw", "twitch"],
		search_url: "https://www.twitch.tv/search?term={query}",
		home_url: "https://www.twitch.tv/",
		domain: "www.twitch.tv",
		suggestions: null,
		enabled: !0
	},
	{
		id: "spotify",
		name: "Spotify",
		keywords: ["sp", "spotify"],
		search_url: "https://open.spotify.com/search/{query}",
		home_url: "https://open.spotify.com/",
		domain: "open.spotify.com",
		suggestions: null,
		enabled: !0
	},
	{
		id: "startpage",
		name: "Startpage",
		keywords: ["startpage"],
		search_url: "https://www.startpage.com/sp/search?query={query}",
		home_url: "https://www.startpage.com/",
		domain: "www.startpage.com",
		suggestions: null,
		enabled: !0
	},
	{
		id: "internet-archive",
		name: "Internet Archive",
		keywords: ["ia", "archive"],
		search_url: "https://archive.org/search?query={query}",
		home_url: "https://archive.org/",
		domain: "archive.org",
		suggestions: null,
		enabled: !0
	}
], _e = /^(localhost|.*\.localhost|.*\.local|.*\.internal|127\.\d+\.\d+\.\d+|0\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|\[.*\])$/i;
function b(e, t = "") {
	let n = e.trim();
	if (!n || /\s/.test(n)) return null;
	(!/^[a-z][a-z0-9+.-]*:/i.test(n) || /^[^/:]+\.[a-z]{2,}:\d+/i.test(n)) && (n = `https://${n}`);
	let r;
	try {
		r = new URL(n);
	} catch {
		return null;
	}
	if (r.protocol !== "https:" && r.protocol !== "http:" || r.username || r.password || r.port) return null;
	let i = r.hostname.replace(/\.$/, "");
	return !i.includes(".") || _e.test(i) || t && i === t.split(":")[0]?.toLowerCase().replace(/\.$/, "") ? null : r.href;
}
function ve(e) {
	switch (e) {
		case "x_frame_options":
		case "frame_ancestors": return "This site doesn't allow being shown inside other apps.";
		case "invalid_address":
		case "non_public_address":
		case "address": return "This address can't be opened here. The workspace browser only opens public websites.";
		default: return "This page couldn't be opened here.";
	}
}
// src/search-engines.ts
var x = ge.map((e) => ({
	...e,
	suggestions: null
}));
function ye(e) {
	try {
		let t = new URL(e).hostname.replace(/^www\./, "");
		return t === "youtu.be" || t === "m.youtube.com" ? "youtube" : t === "mail.google.com" ? null : x.find((e) => e.domain.replace(/^www\./, "") === t)?.id ?? null;
	} catch {
		return null;
	}
}
function be(e) {
	if (e.length > 96e3) return null;
	let t;
	try {
		t = JSON.parse(e);
	} catch {
		return null;
	}
	if (!Array.isArray(t) || t.length > 128) return null;
	let n = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set(), i = [];
	for (let e of t) {
		if (!e || typeof e.id != "string" || !/^[a-z0-9:-]{1,96}$/i.test(e.id) || n.has(e.id) || typeof e.name != "string" || !e.name.trim() || e.name.length > 80 || !Array.isArray(e.keywords) || !e.keywords.length || e.keywords.length > 8 || typeof e.enabled != "boolean" || typeof e.search_url != "string" || typeof e.home_url != "string" || e.search_url.length > 2048 || !e.home_url.startsWith("https://") || !b(e.home_url)) return null;
		let t = C(e.search_url);
		if (!t) return null;
		for (let t of e.keywords) {
			if (typeof t != "string" || !/^[a-z0-9_-]{1,32}$/i.test(t) || r.has(t.toLowerCase())) return null;
			r.add(t.toLowerCase());
		}
		n.add(e.id), i.push({
			id: e.id,
			name: e.name,
			keywords: e.keywords,
			search_url: t,
			home_url: e.home_url,
			domain: new URL(e.home_url).hostname,
			enabled: e.enabled,
			suggestions: null
		});
	}
	return i;
}
var S = [
	{
		id: "google",
		name: "Google",
		template: "https://www.google.com/search?q={query}"
	},
	{
		id: "bing",
		name: "Bing",
		template: "https://www.bing.com/search?q={query}"
	},
	{
		id: "duckduckgo",
		name: "DuckDuckGo",
		template: "https://duckduckgo.com/?q={query}"
	},
	{
		id: "brave",
		name: "Brave Search",
		template: "https://search.brave.com/search?q={query}"
	}
], xe = { id: "google" };
function C(e) {
	let t = e.trim().replace("%s", "{query}");
	return (t.match(/\{query\}/g) ?? []).length === 1 && b(t.replace("{query}", "aegis")) && t.startsWith("https://") ? t : null;
}
function w(e) {
	let t = e.trim().replace(/\/+$/, "");
	if (!/^https?:\/\//i.test(t)) return null;
	try {
		let e = new URL(t);
		return `${e.origin}${e.pathname.replace(/\/+$/, "")}/search?q={query}`;
	} catch {
		return null;
	}
}
function Se(e) {
	return e.id === "custom" ? C(e.custom ?? "") ?? S[0].template : e.id === "searxng" ? w(e.searxng ?? "") ?? S[0].template : (S.find((t) => t.id === e.id) ?? S[0]).template;
}
function Ce(e) {
	return e.id === "custom" ? "Custom search" : e.id === "searxng" ? "SearXNG" : (S.find((t) => t.id === e.id) ?? S[0]).name;
}
function T(e, t, n = x) {
	let r = e.trim();
	if (!r) return null;
	if (!/\s/.test(r) && (/^https?:\/\//i.test(r) || /^[^\s/?#]+\.[a-z]{2,}(?::\d+)?([/?#].*)?$/i.test(r))) {
		let e = b(r);
		if (e) return {
			url: e,
			search: !1
		};
	}
	let i = me(r, n);
	if (i) {
		let e = y(r, "", n).trim(), t = C(i.search_url);
		if (!t) return null;
		let a = encodeURIComponent(e), o = e ? t.replace("{query}", a) : i.home_url;
		return b(o) ? {
			url: o,
			search: !!e,
			destination: i.name
		} : null;
	}
	return {
		url: Se(t).replace("{query}", encodeURIComponent(r).replace(/%20/g, "+")),
		search: !0
	};
}
function we(e, t) {
	let [n] = Se(t).split("{query}");
	if (n && e.startsWith(n)) {
		let t = e.slice(n.length).split(/[&#]/)[0] ?? "";
		try {
			return decodeURIComponent(t.replace(/\+/g, " "));
		} catch {
			return e;
		}
	}
	return e;
}
var Te = new class {
	#e = t({
		report: null,
		trace: [],
		workSources: [],
		run: void 0,
		view: {
			chosen: [],
			hidden: []
		},
		jobId: "",
		jobs: [],
		connected: !1,
		guest: !1,
		busy: !1,
		muted: !0,
		voiceState: "idle",
		status: "",
		loading: !1,
		depth: "detailed",
		theme: "dark",
		panel: "",
		error: ""
	});
	get state() {
		return i(this.#e);
	}
	set state(e) {
		o(this.#e, e);
	}
	#t = t(null);
	get actions() {
		return i(this.#t);
	}
	set actions(e) {
		o(this.#t, e);
	}
}();
// src/video-player.ts
function E(e) {
	try {
		let t = new URL(e);
		if (!["https:", "http:"].includes(t.protocol) || t.username || t.password) return "";
		let n = t.hostname.toLowerCase(), r = "";
		return n === "youtu.be" ? r = t.pathname.slice(1) : [
			"youtube.com",
			"www.youtube.com",
			"m.youtube.com",
			"youtube-nocookie.com",
			"www.youtube-nocookie.com"
		].includes(n) && (r = t.pathname === "/watch" ? t.searchParams.get("v") || "" : /^\/(?:embed|shorts|live)\/([^/]+)\/?$/.exec(t.pathname)?.[1] || ""), /^[a-zA-Z0-9_-]{11}$/.test(r) ? r : "";
	} catch {
		return "";
	}
}
// src/work-handoff.ts
var Ee = /^(utm_\w+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|igshid|ref_src|si|feature)$/i, De = [
	[/^consent\.(youtube|google)\.com$/i, "continue"],
	[/^(www\.)?google\.[a-z.]+$/i, "url"],
	[/^l\.facebook\.com$/i, "u"],
	[/^out\.reddit\.com$/i, "url"]
];
function D(e) {
	try {
		let t = new URL(e);
		return t.protocol === "https:" || t.protocol === "http:" ? t : null;
	} catch {
		return null;
	}
}
function Oe(e) {
	for (let [t, n] of De) {
		if (!t.test(e.hostname) || t.source.includes("google") && e.pathname !== "/url" && !e.hostname.startsWith("consent.")) continue;
		let r = D(e.searchParams.get(n) ?? "");
		if (r) return r;
	}
	return e;
}
function ke(e, t) {
	let n = E(e);
	return n ? `https://www.youtube.com/watch?v=${n}${t && t >= 1 ? `&t=${Math.floor(t)}s` : (() => {
		let t = D(e)?.searchParams.get("t") ?? D(e)?.searchParams.get("start");
		return t && /^\d+s?$/.test(t) ? `&t=${parseInt(t, 10)}s` : "";
	})()}` : null;
}
function Ae({ live: e, asked: t, recorded: n }, r) {
	let i = [
		e,
		t,
		n
	].map((e) => e ? D(e) : null).find(Boolean);
	if (!i) return null;
	let a = Oe(i);
	return ke(a.href, r) ?? a.href;
}
function je(e) {
	let t = E(e);
	if (t) return `youtube:${t}`;
	let n = D(e.trim());
	if (!n) return e;
	let r = n.hostname.toLowerCase().replace(/^www\./, ""), i = n.port && n.port !== "80" && n.port !== "443" ? `:${n.port}` : "", a = [...n.searchParams.entries()].filter(([e]) => !Ee.test(e)).sort(([e, t], [n, r]) => e === n ? t < r ? -1 : +(t > r) : e < n ? -1 : 1), o = a.length ? "?" + new URLSearchParams(a).toString() : "";
	return `${n.protocol}//${r}${i}${n.pathname.replace(/\/+$/, "")}${o}`;
}
var O = (e, t) => !!e && !!t && je(e) === je(t), k = "aegis-browser-tabs-v1", A = "aegis-search-engine-v1", j = "aegis-browser-search-shortcuts-v1", M = "aegis-browser-kept-v1", N = "aegis-browser-history-v1", P = "aegis-browser-closed-v1", Me = 1500, Ne = 1e5;
function F(e, t) {
	try {
		let n = localStorage.getItem(e);
		return n ? JSON.parse(n) : t;
	} catch {
		return t;
	}
}
function I(e, t) {
	try {
		localStorage.setItem(e, JSON.stringify(t));
	} catch {}
}
var L = (e, t = "", n = "") => ({
	id: e,
	url: t,
	title: n,
	favicon: "",
	loading: !1,
	back: !1,
	forward: !1,
	error: "",
	opened: !1,
	download: "",
	blocked: 0,
	from: null,
	held: null
}), Pe = (e) => /^https?:\/\//.test(e);
function R(e, t, n = 6) {
	let r = t.toLowerCase().split(/\s+/).filter(Boolean);
	return r.length ? e.filter((e) => {
		let t = (e.title + " " + e.url.replace(/^https?:\/\/(www\.)?/, "")).toLowerCase();
		return r.every((e) => t.includes(e));
	}).sort((e, t) => t.count - e.count || t.at - e.at).slice(0, n) : [];
}
var z = new class {
	available = d.kind === "native";
	#e = t(n([]));
	get tabs() {
		return i(this.#e);
	}
	set tabs(e) {
		o(this.#e, e, !0);
	}
	#t = t("work");
	get active() {
		return i(this.#t);
	}
	set active(e) {
		o(this.#t, e, !0);
	}
	#n = t(n(F(A, xe)));
	get engine() {
		return i(this.#n);
	}
	set engine(e) {
		o(this.#n, e, !0);
	}
	#r = t(n(F(j, "")));
	get shortcutPreference() {
		return i(this.#r);
	}
	set shortcutPreference(e) {
		o(this.#r, e, !0);
	}
	#i = e(() => be(this.shortcutPreference) ?? x);
	get shortcuts() {
		return i(this.#i);
	}
	set shortcuts(e) {
		o(this.#i, e);
	}
	#a = t(n(F(N, []).filter((e) => e && typeof e.url == "string").slice(0, Me)));
	get history() {
		return i(this.#a);
	}
	set history(e) {
		o(this.#a, e, !0);
	}
	#o = t(n(F(P, []).slice(0, 10)));
	get closed() {
		return i(this.#o);
	}
	set closed(e) {
		o(this.#o, e, !0);
	}
	#s = t(n(F(M, []).filter((e) => typeof e?.url == "string" && b(e.url) && typeof e.title == "string").slice(0, 64)));
	get kept() {
		return i(this.#s);
	}
	set kept(e) {
		o(this.#s, e, !0);
	}
	#c = t(null);
	get lastTab() {
		return i(this.#c);
	}
	set lastTab(e) {
		o(this.#c, e, !0);
	}
	rect = null;
	#l = t(!1);
	get overlay() {
		return i(this.#l);
	}
	set overlay(e) {
		o(this.#l, e, !0);
	}
	#u = t(!1);
	get shelfOpen() {
		return i(this.#u);
	}
	set shelfOpen(e) {
		o(this.#u, e, !0);
	}
	#d = t(n({
		shown: !1,
		height: 36,
		duration: 0
	}));
	get caption() {
		return i(this.#d);
	}
	set caption(e) {
		o(this.#d, e, !0);
	}
	#f = t(null);
	get page() {
		return i(this.#f);
	}
	set page(e) {
		o(this.#f, e, !0);
	}
	#p = t(0);
	get focusAddress() {
		return i(this.#p);
	}
	set focusAddress(e) {
		o(this.#p, e, !0);
	}
	#m = t(null);
	get focusFor() {
		return i(this.#m);
	}
	set focusFor(e) {
		o(this.#m, e, !0);
	}
	#h = t(null);
	get origin() {
		return i(this.#h);
	}
	set origin(e) {
		o(this.#h, e, !0);
	}
	next = Ne;
	recent = [];
	covered = !1;
	unsubscribe = null;
	constructor() {
		if (!this.available) return;
		let e = F(k, []), t = Array.isArray(e) ? e : e.tabs ?? [];
		if (p.value.restoreTabs) {
			for (let e of t.slice(0, 16)) typeof e?.url == "string" && e.url && this.tabs.push({
				...L(this.next++, e.url, String(e.title ?? "")),
				pinned: e.pinned === !0
			});
			this.keepPinnedFirst();
			let n = Array.isArray(e) ? -1 : Number(e.active ?? -1);
			this.lastTab = this.tabs[n]?.id ?? this.tabs.at(-1)?.id ?? null;
		}
		this.unsubscribe = d.subscribe((e) => this.onEvent(e));
	}
	get current() {
		return typeof this.active == "number" ? this.tabs.find((e) => e.id === this.active) ?? null : null;
	}
	save() {
		let e = this.tabs.filter((e) => e.url), t = typeof this.active == "number" ? this.active : this.lastTab;
		I(k, {
			tabs: e.map((e) => ({
				url: e.url,
				title: e.title,
				...e.pinned ? { pinned: !0 } : {}
			})),
			active: Math.max(-1, e.findIndex((e) => e.id === t))
		});
	}
	keep(e) {
		let t = this.tabs.find((t) => t.id === e);
		!t?.url || !b(t.url) || this.kept.length >= 64 || this.kept.some((e) => O(e.url, t.url)) || (this.kept = [...this.kept, {
			url: t.url,
			title: t.title || t.url
		}], I(M, this.kept));
	}
	forgetKept(e) {
		this.kept = this.kept.filter((t) => t.url !== e), I(M, this.kept);
	}
	openAddress(e) {
		if (!b(e)) return;
		let t = this.tabs.find((t) => O(t.url, e));
		t ? (this.page = null, this.show(t.id)) : this.tabs.length < 16 && (this.page = null, this.newTab(e));
	}
	setEngine(e) {
		this.engine = e, I(A, e);
	}
	setShortcuts(e) {
		if (e !== "" && !be(e)) return !1;
		try {
			localStorage.setItem(j, JSON.stringify(e));
		} catch {
			return !1;
		}
		return this.shortcutPreference = e, !0;
	}
	newTab(e = "", t = !1) {
		if (!this.available || this.tabs.length >= 16) return null;
		let n = L(this.next++, e), r = typeof this.active == "number" ? this.tabs.findIndex((e) => e.id === this.active) + 1 : this.tabs.length;
		return this.tabs.splice(r > 0 ? r : this.tabs.length, 0, n), t || this.show(n.id), this.save(), n;
	}
	openFromSource(e, { title: t = "", rect: n = null, researchId: r = "" } = {}) {
		let i = this.tabs.find((t) => t.url === e) ?? this.tabs.find((t) => O(t.url, e));
		if (i) return (!i.from || r) && (i.from = {
			kind: "source",
			title: t || i.from?.title || "Research",
			researchId: r || i.from?.researchId
		}), this.origin = n, this.show(i.id), i;
		let a = this.newTab(e, !0);
		if (!a) return null;
		let o = this.tabs.find((e) => e.id === a.id);
		return o.from = {
			kind: "source",
			title: t || "Research",
			...r ? { researchId: r } : {}
		}, this.origin = n, this.show(a.id), o;
	}
	show(e) {
		let t = this.active;
		this.active = e, typeof t == "number" && t !== e && (this.lastTab = t, d.setVisible(t, !1)), typeof e == "number" && (this.lastTab = e, this.recent = [e, ...this.recent.filter((t) => t !== e)], !this.current?.url && this.page === null && (this.focusFor = e, this.focusAddress += 1), this.attach(e)), this.save();
	}
	returnToWork(e = typeof this.active == "number" ? this.active : null) {
		let t = this.tabs.find((t) => t.id === e);
		this.page = null, this.show("work");
		let n = t?.from?.researchId;
		n && Te.state.report?.research_id !== n && typeof window < "u" && window.dispatchEvent(new CustomEvent("nova-open-research", { detail: { research_id: n } }));
	}
	resume() {
		let e = this.tabs.find((e) => e.id === this.lastTab) ?? this.tabs.at(-1);
		e ? this.show(e.id) : this.newTab();
	}
	async attach(e = this.active) {
		if (typeof e != "number" || !this.rect) return;
		let t = this.tabs.find((t) => t.id === e);
		if (t && t.url && !t.held) {
			if (t.opened) await d.setBounds(t.id, this.rect);
			else {
				t.opened = !0;
				try {
					await d.openTab(t.id, t.url, this.rect);
				} catch (e) {
					t.opened = !1, t.error = e instanceof Error ? e.message : "This page could not be opened.";
					return;
				}
			}
			this.tabs.some((t) => t.id === e) ? await d.setVisible(t.id, this.active === e && !t.held && !this.covered && this.page === null && !!this.rect) : await d.close(e);
		}
	}
	setRect(e) {
		this.rect = e, typeof this.active == "number" && e && d.setBounds(this.active, e);
	}
	cover(e) {
		this.covered = e, typeof this.active == "number" && this.current?.opened && d.setVisible(this.active, !e);
	}
	go(e, t) {
		let n = this.tabs.find((t) => t.id === e), r = T(t, this.engine, this.shortcuts);
		if (!n || !r) return !1;
		if (n.error = "", n.url) try {
			new URL(n.url).origin !== new URL(r.url).origin && (n.favicon = "", n.icon = void 0);
		} catch {
			n.favicon = "", n.icon = void 0;
		}
		return n.url = r.url, n.loading = !0, n.held = _.holds(r.url, p.value.focus.sites, p.value.focus.holdSites), n.held ? (n.loading = !1, n.opened && d.setVisible(e, !1)) : n.opened ? d.navigate(e, r.url).catch((e) => n.error = e instanceof Error ? e.message : "This page could not be opened.") : this.attach(e), this.save(), !0;
	}
	release(e) {
		let t = this.tabs.find((t) => t.id === e);
		t?.held && (_.allow(t.held), t.held = null, t.opened ? d.navigate(e, t.url).then(() => d.setVisible(e, this.active === e)) : this.attach(e));
	}
	back(e) {
		d.goBack(e);
	}
	forward(e) {
		d.goForward(e);
	}
	reload(e) {
		d.reload(e);
	}
	stop(e) {
		d.stop(e);
	}
	cycle(e = !1) {
		if (this.tabs.length < 2) return;
		let t = this.tabs.findIndex((e) => e.id === this.active), n = this.tabs[(t + (e ? -1 : 1) + this.tabs.length) % this.tabs.length];
		n && (this.page = null, this.show(n.id));
	}
	close(e) {
		let t = this.tabs.findIndex((t) => t.id === e);
		if (t < 0) return;
		let [n] = this.tabs.splice(t, 1);
		if (n?.url && (this.closed = [{
			url: n.url,
			title: n.title
		}, ...this.closed].slice(0, 10), I(P, this.closed)), n?.opened && d.close(e), this.recent = this.recent.filter((t) => t !== e), this.lastTab === e && (this.lastTab = null), this.active === e) {
			let e = p.value.afterClose, r = this.tabs.filter((e) => !e.pinned), i = !n?.pinned && r.length ? r : this.tabs, a = t - (i === r ? this.tabs.length - r.length : 0), o = e === "recent" ? this.recent.find((e) => i.some((t) => t.id === e)) : void 0, s = Math.max(0, Math.min(i.length - 1, a - +(e === "previous"))), c = o ?? i[s]?.id;
			c === void 0 ? (this.page = null, this.newTab()) : this.show(c);
		}
		this.save();
	}
	reopen(e = 0) {
		let t = this.closed[e];
		if (!t) return;
		let n = this.newTab(t.url, !0);
		if (n) {
			this.closed = this.closed.filter((t, n) => n !== e), I(P, this.closed), this.page = null;
			let r = this.tabs.find((e) => e.id === n.id);
			r.title = t.title, this.show(n.id);
		}
	}
	move(e, t) {
		let n = this.tabs.findIndex((t) => t.id === e);
		if (n < 0) return;
		let [r] = this.tabs.splice(n, 1);
		this.tabs.splice(Math.max(0, Math.min(t, this.tabs.length)), 0, r);
		let i = this.tabs.findIndex((t) => t.id === e), a = this.tabs[i], o = this.tabs[i - 1], s = this.tabs[i + 1];
		a.pinned = o?.pinned ? !!s?.pinned || !!a.pinned : !!s?.pinned, this.keepPinnedFirst(), this.save();
	}
	setPinned(e, t) {
		let n = this.tabs.find((t) => t.id === e);
		n && !!n.pinned !== t && (n.pinned = t, this.tabs = [...this.tabs.filter((e) => e.pinned), ...this.tabs.filter((e) => !e.pinned)], this.save());
	}
	keepPinnedFirst() {
		this.tabs.some((e, t) => e.pinned && t > 0 && !this.tabs[t - 1].pinned) && (this.tabs = [...this.tabs.filter((e) => e.pinned), ...this.tabs.filter((e) => !e.pinned)]);
	}
	remember(e, t) {
		if (!p.value.history || !Pe(e)) return;
		let n = this.history.find((t) => t.url === e), r = {
			url: e,
			title: t || n?.title || "",
			at: Date.now(),
			count: (n?.count ?? 0) + 1
		};
		this.history = [r, ...this.history.filter((t) => t.url !== e)].slice(0, Me), I(N, this.history);
	}
	clearHistory() {
		this.history = [], this.closed = [], I(N, []), I(P, []);
	}
	onEvent(e) {
		if (e.kind === "caption") {
			this.caption = {
				shown: e.shown,
				height: e.height,
				duration: Math.max(0, Math.min(400, Number(e.duration) || 0))
			};
			return;
		}
		let t = this.tabs.find((t) => t.id === e.id);
		if (t) switch (e.kind) {
			case "load":
				if (t.loading = e.loading, e.url && t.url !== e.url) {
					try {
						new URL(e.url).origin !== new URL(t.url).origin && (t.favicon = "", t.icon = void 0);
					} catch {}
					t.url = e.url;
				}
				if (!e.loading) {
					this.save(), this.remember(t.url, t.title);
					let e = _.holds(t.url, p.value.focus.sites, p.value.focus.holdSites);
					e && !t.held && (t.held = e, d.setVisible(t.id, !1));
				}
				break;
			case "title":
				t.title = e.title, this.save(), this.history[0]?.url === t.url && this.remember(t.url, e.title);
				break;
			case "media":
				t.media = {
					available: e.available,
					playing: e.playing,
					muted: e.muted,
					audible: e.audible
				};
				break;
			case "favicon":
				t.favicon = e.url, e.rgba && (t.icon = e.rgba);
				break;
			case "history":
				t.back = e.back, t.forward = e.forward;
				break;
			case "failed":
				t.loading = !1, t.error = e.description || "This page could not be loaded.";
				break;
			case "blocked":
				t.error = "This address can't be opened in a browser tab. Only public websites open here.";
				break;
			case "open-tab":
				this.newTab(e.url, !!e.background);
				break;
			case "shortcut":
				e.key === "t" && e.shift ? this.reopen() : e.key === "t" ? this.newTab() : e.key === "w" ? this.close(t.id) : e.key === "l" ? (this.focusFor = e.id, this.focusAddress += 1) : e.key === "tab" ? this.cycle(!!e.shift) : window.dispatchEvent(new CustomEvent("aegis-browser-tools-key", { detail: {
					key: e.key,
					shift: e.shift
				} }));
				break;
			case "blocked-count":
				t.blocked = e.count;
				break;
			case "download": t.download = e.filename ? `${e.filename}: ${e.state === "completed" ? "saved" : e.state === "cancelled" ? "cancelled" : e.state === "interrupted" ? "interrupted" : "downloading"}` : "";
		}
	}
	dispose() {
		this.unsubscribe?.();
	}
}();
typeof window < "u" && (window.__aegisBrowserTabs = z);
// src/settings/settings-view.svelte.ts
var B = [
	{
		id: "accounts",
		group: "identity",
		title: "Profile and accounts",
		description: "Your AEGIS profile, your browser profile, Google, and what AEGIS agents may use."
	},
	{
		id: "search",
		group: "browser",
		title: "Search engine",
		description: "Used when you type words instead of an address in a tab. AEGIS agents never use it."
	},
	{
		id: "appearance",
		group: "browser",
		title: "Appearance",
		description: "Color mode, themes, accent, window surfaces and interface scale."
	},
	{
		id: "new-tab",
		group: "browser",
		title: "New Tab",
		description: "The new tab wallpaper and indicators, and the Dashboard orb."
	},
	{
		id: "tabs",
		group: "browser",
		title: "Tabs and startup",
		description: "What opens when AEGIS starts, and tabs you closed."
	},
	{
		id: "privacy",
		group: "browser",
		title: "Privacy and blocking",
		description: "Adverts and trackers, history and cached files in your tabs."
	},
	{
		id: "permissions",
		group: "browser",
		title: "Site access",
		description: "Camera, microphone, location and notifications that sites asked for."
	},
	{
		id: "downloads",
		group: "browser",
		title: "Downloads",
		description: "Files downloaded since AEGIS started."
	},
	{
		id: "focus",
		group: "browser",
		title: "Focus",
		description: "Focus rounds, breaks, the daily goal and sites held back during focus."
	},
	{
		id: "tasks",
		group: "browser",
		title: "Tasks",
		description: "Your one task list, shared by Browse, Work, research and AEGIS's assistant."
	},
	{
		id: "ai",
		group: "aegis",
		title: "AI models",
		description: "Which provider writes research, its model and backups. Chat and voice stay on Gemini Live."
	},
	{
		id: "keys",
		group: "aegis",
		title: "API keys",
		description: "Provider keys, kept by the AEGIS server in its environment file. Saved keys are never shown."
	},
	{
		id: "voice",
		group: "aegis",
		title: "Voice and sound",
		description: "Your voice profile, sounds and your name as AEGIS uses it."
	},
	{
		id: "work",
		group: "aegis",
		title: "Work",
		description: "The models AEGIS Work routes to, and their availability."
	},
	{
		id: "skills",
		group: "aegis",
		title: "Skills",
		description: "Manage the instructions available to AEGIS Work and research."
	},
	{
		id: "memory",
		group: "aegis",
		title: "Memory",
		description: "Open the saved memories in your AEGIS workspace."
	},
	{
		id: "connections",
		group: "aegis",
		title: "Connections and devices",
		description: "Services AEGIS reaches, windows connected to it, and paired computers."
	},
	{
		id: "system",
		group: "aegis",
		title: "System",
		description: "The AEGIS server, memories and tasks it holds, and recovery."
	}
], Fe = [{
	id: "browser",
	label: "Browser"
}, {
	id: "aegis",
	label: "AEGIS"
}], Ie = {
	accounts: "profile account google sign in sign out oauth gmail calendar agents authorization browser profile name",
	search: "search engine google bing duckduckgo brave searxng custom address",
	appearance: "light dark system appearance palette theme accent color colour glass frosted font reduced motion zoom scale",
	"new-tab": "background wallpaper picture colour sky dim clock figures trackers focus tasks orb theme",
	tabs: "tabs startup restore reopen closed",
	privacy: "privacy blocker adverts trackers allow history cache clear",
	permissions: "permissions camera microphone location notifications forget",
	downloads: "downloads files",
	focus: "focus round minutes breaks goal held back sites shut",
	tasks: "tasks today due overdue lists board",
	ai: "ai model research writer gemini openai groq backup fallback cooperative",
	keys: "api keys gemini openai groq elevenlabs serpapi tavily quick search deep research voice id",
	voice: "voice speaker profile enrollment recognition sound notification volume cues name honorific calendar accounts",
	work: "work models router availability",
	skills: "skills work workflows custom built-in instructions",
	memory: "memories memory context saved workspace",
	connections: "connections status server calendar mail windows devices pair pairing",
	system: "system memory tasks port uptime restart server fix"
};
function Le(e) {
	let t = e.trim().toLowerCase().split(/\s+/).filter(Boolean);
	return t.length ? B.filter((e) => {
		let n = `${e.title} ${e.description} ${Ie[e.id]}`.toLowerCase();
		return t.every((e) => n.includes(e));
	}) : [];
}
var V = new class {
	#e = t("search");
	get section() {
		return i(this.#e);
	}
	set section(e) {
		o(this.#e, e, !0);
	}
	#t = t("");
	get query() {
		return i(this.#t);
	}
	set query(e) {
		o(this.#t, e, !0);
	}
	#n = t(!1);
	get isOpen() {
		return i(this.#n);
	}
	set isOpen(e) {
		o(this.#n, e, !0);
	}
	#r = t(0);
	get revision() {
		return i(this.#r);
	}
	set revision(e) {
		o(this.#r, e, !0);
	}
	opener = null;
	select(e) {
		this.section = e, this.query = "", this.revision++;
	}
	open(e) {
		let t = B.find((t) => t.id === e);
		!this.isOpen && typeof document < "u" && (this.opener = document.activeElement instanceof HTMLElement ? document.activeElement : null), this.select(t?.id ?? this.section), this.isOpen = !0;
	}
	dismiss() {
		this.isOpen = !1, this.query = "", this.opener = null;
	}
	close() {
		let e = this.opener;
		this.dismiss(), e && requestAnimationFrame(() => {
			!this.isOpen && e.isConnected && e.focus({ preventScroll: !0 });
		});
	}
}(), Re = (e) => e.toLocaleLowerCase(), H;
function U(e, t, n = Re) {
	let r = n(t.trim());
	if (!r) return null;
	let i = n(e), a = i.indexOf(r);
	if (a < 0) return null;
	let o = a + r.length;
	if (i.length === e.length) return [a, o];
	H ??= new Intl.Segmenter(void 0, { granularity: "grapheme" });
	let s = 0, c;
	for (let { segment: t, index: r } of H.segment(e)) {
		let e = s + n(t).length;
		if (c === void 0 && e > a && (c = r), e >= o) return [c ?? r, r + t.length];
		s = e;
	}
	return null;
}
// upstream/src/features/search/lib/search-model.ts
function ze(e) {
	let t = e.action;
	return t.type === "OpenNote" ? `note:${t.id}` : t.type === "ActivateTab" ? `tab:${t.id}` : t.type === "OpenUrl" ? `url:${t.url}` : `command:${t.id}`;
}
function W(e, t) {
	return !!e && !!t && e.session_id === t.session_id && e.request_id === t.request_id && e.window_id === t.window_id && e.profile_id === t.profile_id && e.space_id === t.space_id;
}
function Be(e) {
	return e.kind === "tab" ? "tabs" : e.kind === "note" ? "notes" : e.kind === "history" || e.kind === "bookmark" || e.kind === "search_history" ? "history" : e.kind === "command" ? "commands" : "search";
}
function Ve(e) {
	let t = [];
	for (let n of e) {
		let e = t.at(-1);
		e?.section === n.section ? e.rows.push(n) : t.push({
			section: n.section,
			rows: [n]
		});
	}
	return t;
}
function He(e) {
	return e.kind === "search" || e.kind === "suggestion" || e.kind === "note" ? e.detail : e.kind !== "tab" && e.kind !== "history" && e.kind !== "bookmark" && e.kind !== "search_history" ? "" : G(e.detail);
}
var Ue = (e) => e.toLowerCase();
function We(e, t) {
	return U(e, t, Ue);
}
function G(e) {
	try {
		return new URL(e).host.replace(/^www\./u, "");
	} catch {
		return e.replace(/^www\./u, "");
	}
}
function Ge(e) {
	return e.kind === "tab" ? G(e.detail) : e.kind !== "history" && e.kind !== "url" ? "" : e.action.type === "OpenUrl" ? G(e.action.url) : "";
}
function Ke(e, t) {
	return t ? e.find((e) => !!e.result && Ge(e.result) === t) ?? null : null;
}
function qe(e, t) {
	if (!t || !e.trim()) return null;
	let n = t.toLowerCase(), r = e.toLowerCase();
	return !n.startsWith(r) || t.length <= e.length ? null : t.slice(e.length);
}
// src/native/newtab-search.ts
var K = null;
function Je(e) {
	return K && K.tab === z.current?.id && !z.current.url && z.page === null && K.owner.session_id === e?.session_id && K.owner.window_id === e.window_id && K.owner.space_id === e.space_id && K.owner.profile_id === e.profile_id;
}
function Ye(e) {
	let t = e.trim();
	if (!t) return [];
	let n = T(e, z.engine, z.shortcuts), r = [], i = /* @__PURE__ */ new Set();
	n && (r.push({
		kind: n.search ? "search" : "url",
		title: n.destination && n.search ? y(e, "", z.shortcuts).trim() : t,
		detail: n.search ? n.destination || Ce(z.engine) : n.url,
		icon: null,
		action: {
			type: "OpenUrl",
			url: n.url
		}
	}), i.add(n.url));
	let a = t.toLowerCase();
	for (let e of z.tabs.filter((e) => e.url && !i.has(e.url) && (e.title + " " + e.url).toLowerCase().includes(a)).slice(0, 3)) r.push({
		kind: "tab",
		title: e.title || e.url,
		detail: e.url,
		icon: null,
		action: {
			type: "ActivateTab",
			id: String(e.id)
		}
	}), i.add(e.url);
	if (p.value.history) for (let e of R(z.history, t, 18).filter((e) => !i.has(e.url))) {
		let t = S.map((t) => we(e.url, { id: t.id })).find((t) => t !== e.url);
		r.push({
			kind: t ? "search_history" : "history",
			title: t || e.title || e.url,
			detail: e.url,
			icon: null,
			action: {
				type: "OpenUrl",
				url: e.url
			}
		}), i.add(e.url);
	}
	return r;
}
function Xe(e, t) {
	if (e === "newtab_search_context") {
		let e = z.current;
		if (!e || e.url || e.id !== Number(t.tabId) || z.page !== null) return null;
		let n = {
			window_id: "aegis-window",
			session_id: crypto.randomUUID(),
			profile_id: "aegis-local",
			space_id: "aegis-space"
		};
		return K = {
			owner: n,
			tab: e.id,
			results: [],
			current: null
		}, {
			...n,
			request_id: ""
		};
	}
	let n = t.context;
	if (!K || !Je(n)) return e === "newtab_run" && {
		operation_id: null,
		accepted: !1
	};
	let r = K;
	switch (e) {
		case "newtab_search": {
			if (typeof t.query != "string" || t.query.length > 2048 || typeof n.request_id != "string") return !1;
			let e = t.query;
			return r.current = n, r.results = Ye(e), queueMicrotask(() => {
				K === r && W(r.current, n) && window.dispatchEvent(new CustomEvent("zephium:search", { detail: {
					query: e,
					context: n,
					pending: !1,
					completion: null,
					results: r.results
				} }));
			}), !0;
		}
		case "newtab_cancel": return W(r.current, n) ? (r.current = null, r.results = [], !0) : !1;
		case "newtab_run": {
			let e = t.action;
			if (!W(r.current, n) || !e) return {
				operation_id: null,
				accepted: !1
			};
			let i = r.results.some(({ action: t }) => e.type === "OpenUrl" && t.type === "OpenUrl" ? t.url === e.url : e.type === "ActivateTab" && t.type === "ActivateTab" && t.id === e.id), a = !1;
			return i && e.type === "OpenUrl" && (a = z.go(r.tab, e.url)), i && e.type === "ActivateTab" && z.tabs.some((t) => t.id === Number(e.id)) && (z.show(Number(e.id)), a = !0), a && (K = null), {
				operation_id: null,
				accepted: a
			};
		}
		default: return;
	}
}
// src/native/zephium-bridge.svelte.ts
var Ze = {
	id: "aegis-local",
	name: "AEGIS",
	kind: "default"
}, q = {
	operation_id: null,
	accepted: !0
}, Qe = 864e5, $e = 0, et = () => (++$e).toString(16).padStart(32, "0"), J = (e, t) => queueMicrotask(() => window.dispatchEvent(new CustomEvent(e, { detail: t }))), Y = (e) => Number(e), tt = /* @__PURE__ */ new Map();
function nt(e) {
	let t = JSON.stringify([
		e.title,
		e.url,
		e.loading,
		e.back,
		e.forward,
		e.icon ? e.icon.slice(-24) : null,
		e.error,
		e.media
	]), n = tt.get(e.id), r = n?.key === t ? n.revision : et();
	return tt.set(e.id, {
		key: t,
		revision: r
	}), {
		id: String(e.id),
		projection_revision: r,
		title: e.title || (e.url ? rt(e.url) : "New tab"),
		url: e.url || null,
		content: "web",
		loading: e.loading,
		can_go_back: e.back,
		can_go_forward: e.forward,
		audio: e.media?.audible || e.media?.muted ? {
			muted: e.media.muted,
			can_mute: !!d.media
		} : null,
		icon: e.icon && e.url ? {
			origin: it(e.url),
			revision: String(e.icon.length) + e.icon.slice(-8)
		} : null
	};
}
var rt = (e) => {
	try {
		return new URL(e).hostname.replace(/^www\./, "");
	} catch {
		return e;
	}
}, it = (e) => {
	try {
		return new URL(e).origin;
	} catch {
		return e;
	}
};
function at() {
	let e = z.tabs.map(nt);
	return {
		projection_revision: et(),
		profile: Ze,
		spaces: [{
			id: "aegis-space",
			name: "Browse",
			icon: null,
			color: 210,
			theme: null,
			tabs: e.length,
			previews: []
		}],
		active_space_id: "aegis-space",
		nodes: e.map((e) => ({
			id: `node-${e.id}`,
			parent_id: null,
			section: "today",
			kind: {
				type: "tab",
				tab_id: e.id
			}
		})),
		tabs: e,
		active: typeof z.active == "number" ? String(z.active) : null,
		split_group: null
	};
}
function ot() {
	return r(() => {
		a(() => {
			J("zephium:items", at());
			let e = z.tabs.filter((e) => e.icon && e.url).map((e) => ({
				origin: it(e.url),
				revision: String(e.icon.length) + e.icon.slice(-8),
				rgba: e.icon
			}));
			e.length && J("zephium:favicons", {
				surface: "chrome",
				profile_id: Ze.id,
				entries: e
			});
		}), a(() => {
			J("zephium:ui-command", `browser.${z.page ?? (z.active === "work" ? "work" : null) ?? "return"}`);
		}), a(() => {
			J("zephium:focus", {
				session: ct(_.session),
				shut: []
			});
		});
		let e = /* @__PURE__ */ new Map();
		a(() => {
			p.value, z.engine.id;
			for (let t of st) {
				let n = ut(t) ?? "";
				if (e.get(t) === n) continue;
				let r = !e.has(t);
				e.set(t, n), r || J("zephium:ui-command", `preference.${t}=${n}`);
			}
		});
	});
}
var st = [
	"search.engine",
	"focus.minutes",
	"focus.goal",
	"focus.breaks",
	"focus.blocked"
];
function ct(e) {
	return e ? {
		phase: e.phase,
		started_at: e.startedAt,
		phase_started_at: e.phaseStartedAt,
		phase_ends_at: e.phaseEndsAt,
		minutes: e.minutes,
		breaks: e.breaks,
		break_minutes: e.breakMinutes,
		long_break_minutes: e.longBreakMinutes,
		rounds: e.rounds,
		focused: e.focused,
		allowed: e.allowed
	} : null;
}
function lt(e) {
	let [t, n, r] = e.split("-").map(Number);
	return Math.floor(Date.UTC(t, n - 1, r) / Qe);
}
function ut(e) {
	switch (e) {
		case "search.engine": return z.engine.id;
		case "search.shortcuts": return z.shortcutPreference;
		case "time.track": return null;
		case "focus.goal": return String(p.value.focus.goal);
		case "focus.minutes": return String(p.value.focus.minutes);
		case "focus.breaks": return String(p.value.focus.breaks);
		case "focus.blocked": return p.value.focus.holdSites ? p.value.focus.sites.join("\n") : "";
		default: return null;
	}
}
function dt(e, t) {
	if (e === "search.shortcuts") return z.setShortcuts(t) ? q : {
		operation_id: null,
		accepted: !1
	};
	if (e === "search.engine" && S.some((e) => e.id === t)) return z.setEngine({
		...z.engine,
		id: t
	}), q;
	if (e === "focus.goal" || e === "focus.minutes") {
		let n = Number(t);
		return !Number.isFinite(n) || n <= 0 ? {
			operation_id: null,
			accepted: !1
		} : (p.update((t) => {
			t.focus[e === "focus.goal" ? "goal" : "minutes"] = Math.round(n);
		}), q);
	}
	if (e === "focus.breaks" && (t === "true" || t === "false")) return p.update((e) => {
		e.focus.breaks = t === "true";
	}), q;
	if (e === "focus.blocked") {
		let e = t.split("\n").map((e) => e.trim().toLowerCase()).filter(Boolean).slice(0, 50);
		return p.update((t) => {
			t.focus.sites = e, t.focus.holdSites = e.length > 0;
		}), q;
	}
	return {
		operation_id: null,
		accepted: !1
	};
}
function ft(e, t = {}) {
	switch (e) {
		case "operations_reconcile": return [];
		case "operation_status": return { state: "unknown" };
		case "operation_acknowledge": return !0;
		case "newtab_search_context":
		case "newtab_search":
		case "newtab_run":
		case "newtab_cancel": return Xe(e, t);
		case "search_shortcut_defaults": return x;
		case "setting_get": return ut(String(t.key));
		case "setting_set": return dt(String(t.key), String(t.value));
		case "tabs_bootstrap": return queueMicrotask(() => J("zephium:items", at())), q;
		case "tabs_open": return z.newTab(), q;
		case "tabs_activate": return z.page = null, z.show(Y(t.id)), q;
		case "tab_set_muted": return d.media?.(Y(t.id), t.muted === !0 ? "mute" : "unmute").then(() => q) ?? {
			operation_id: null,
			accepted: !1
		};
		case "tabs_close": return z.close(Y(t.id)), q;
		case "tabs_navigate": return z.go(Y(t.id), String(t.input ?? "")) ? q : {
			operation_id: null,
			accepted: !1
		};
		case "tabs_back": return z.back(Y(t.id)), q;
		case "tabs_forward": return z.forward(Y(t.id)), q;
		case "tabs_reload": return z.reload(Y(t.id)), q;
		case "run_command": {
			let e = String(t.id ?? "");
			if (!e.startsWith("browser.")) return {
				operation_id: null,
				accepted: !1
			};
			let n = e.slice(8);
			if (n === "work") z.page = null, z.show("work");
			else if (n === "return") z.page = null, z.active === "work" && z.resume();
			else if (n === "settings") V.open();
			else if (n === "tasks" || n === "time") z.page = n, z.active === "work" && z.resume();
			else return {
				operation_id: null,
				accepted: !1
			};
			return q;
		}
		case "focus_control": {
			let e = t.control;
			if (e?.kind === "start") _.start(Number(e.minutes) || p.value.focus.minutes, typeof e.breaks == "boolean" ? e.breaks : p.value.focus.breaks);
			else if (e?.kind === "stop") _.stop();
			else if (e?.kind === "skip") _.skip();
			else if (e?.kind === "allow" && e.site) _.allow(e.site);
			else return {
				operation_id: null,
				accepted: !1
			};
			return q;
		}
		case "time_call": {
			let e = t.call;
			if (e?.kind === "focus_days") {
				let t = Number(e.from_day), n = Math.min(400, Number(e.days) || 0);
				return {
					kind: "focus_days",
					days: Array.from({ length: n }, (e, n) => {
						let r = t + n, i = Object.keys(_.days).find((e) => lt(e) === r), a = i ? _.days[i] : 0, o = i && _.rounds[i] || {
							sessions: 0,
							completed: 0
						};
						return {
							day: r,
							seconds: a,
							sessions: o.sessions,
							completed: o.completed
						};
					})
				};
			}
			return {
				kind: "error",
				error: "unavailable"
			};
		}
		default: return;
	}
}
// src/native/core.ts
var pt = {
	favicon_probe: !0,
	work_release_memory: !0,
	keymap_entries: []
}, mt = /* @__PURE__ */ new Set(), X;
function ht(e) {
	e.isTrusted && (X = e, queueMicrotask(() => {
		X === e && (X = void 0);
	}));
}
var gt = () => [...mt];
globalThis.__aegisMissingCommands = gt;
async function Z(e, t) {
	if (e === "browser_open_url") {
		let e = new URL(String(t?.url));
		if (!X?.isTrusted || !["http:", "https:"].includes(e.protocol) || e.username || e.password) throw Error("Choose a valid page to open.");
		window.dispatchEvent(new CustomEvent("aegis-open-source-window", { detail: {
			url: e.href,
			activation: X
		} }));
		return;
	}
	if (e === "resource_call") {
		let e = await fetch("/api/workspace/v22/resources", {
			method: "POST",
			credentials: "same-origin",
			headers: l(),
			body: JSON.stringify(t)
		});
		if (!e.ok) throw Error("Task request failed");
		let n = await e.json(), r = n.response;
		return r.kind === "applied" && window.dispatchEvent(new CustomEvent("zephium:resource-changed", { detail: {
			profile: n.profile,
			kind: "task",
			id: r.record.id,
			revision: r.record.revision
		} })), r.kind === "task_list_applied" && window.dispatchEvent(new CustomEvent("zephium:task-lists-changed", { detail: { profile: n.profile } })), n;
	}
	if (e === "work_save_calendar") {
		if (typeof t?.text != "string" || !t.text.startsWith("BEGIN:VCALENDAR")) throw Error("Invalid calendar");
		let e = URL.createObjectURL(new Blob([t.text], { type: "text/calendar;charset=utf-8" })), n = document.createElement("a");
		return n.href = e, n.download = String(t.name || "calendar.ics").replace(/[\\/]/g, "-"), n.click(), setTimeout(() => URL.revokeObjectURL(e), 1e3), !0;
	}
	if (e === "note_call") {
		let e = t?.call;
		if (e?.kind === "reveal" && !e.id) {
			let e = window.aegisDesktop;
			if (!e) return {
				profile: t?.expectedProfile,
				response: {
					kind: "error",
					error: "unavailable"
				}
			};
			if (!await e.invoke("notes_folder_select")) return {
				profile: t?.expectedProfile,
				response: { kind: "done" }
			};
			let n = await fetch("/api/workspace/v21/notes/export", { headers: l() }).then((e) => e.json()), r = await e.invoke("notes_folder_sync", { notes: n.items });
			for (let e of r.updates || []) await Z("note_call", {
				...t,
				call: {
					kind: "write",
					request_id: crypto.randomUUID(),
					...e
				}
			});
			return {
				profile: t?.expectedProfile,
				response: {
					kind: r.conflicts?.length ? "error" : "done",
					...r.conflicts?.length ? { error: "conflict" } : {}
				}
			};
		}
		if (e?.kind === "reveal" && e.id) {
			let n = await Z("note_call", {
				...t,
				call: {
					kind: "get",
					id: e.id
				}
			});
			if (n.response.kind !== "record") return n;
			let r = new Blob([n.response.record.markdown], { type: "text/markdown;charset=utf-8" }), i = URL.createObjectURL(r), a = document.createElement("a");
			return a.href = i, a.download = e.id + ".md", a.click(), setTimeout(() => URL.revokeObjectURL(i), 1e3), {
				profile: t?.expectedProfile,
				response: { kind: "done" }
			};
		}
		let n = await fetch("/api/workspace/v21/notes", {
			method: "POST",
			credentials: "same-origin",
			headers: l(),
			body: JSON.stringify(t)
		});
		if (!n.ok) throw Error("Notes request failed");
		return n.json();
	}
	let n = ft(e, t);
	if (n !== void 0) return n;
	if (e in pt) return pt[e];
	throw mt.add(e), Error(`"${e}" is not available in AEGIS Research.`);
}
// src/native/event.ts
var _t = async (e, t) => {
	let n = (n) => t({
		event: e,
		id: 0,
		payload: n.detail
	});
	return window.addEventListener(e, n), () => window.removeEventListener(e, n);
}, vt = async (e, t) => {
	let n;
	return n = await _t(e, (e) => {
		n(), t(e);
	}), n;
}, yt = async (e, t) => {
	window.dispatchEvent(new CustomEvent(e, { detail: t }));
}, bt = {
	workCall: (e, t) => Z("work_call", {
		expectedProfile: e,
		call: t
	}),
	workSaveCalendar: (e, t) => Z("work_save_calendar", {
		name: e,
		text: t
	}),
	workEditDraft: (e, t, n, r, i, a, o) => Z("work_edit_draft", {
		expectedProfile: e,
		work: t,
		expectedRevision: n,
		command: r,
		execution: i,
		artifact: a,
		body: o
	}),
	workOperation: (e, t, n) => Z("work_operation", {
		expectedProfile: e,
		operation: t,
		input: n
	}),
	workOperationStatus: (e, t, n, r) => Z("work_operation_status", {
		expectedProfile: e,
		work: t,
		operation: n,
		acknowledge: r
	}),
	workRunning: () => Z("work_running"),
	workContextPreview: (e, t, n) => Z("work_context_preview", {
		expectedProfile: e,
		purpose: t,
		selection: n
	}),
	mediaImport: (e) => Q(Z("media_import", { expectedProfile: e })),
	mediaOpen: (e, t) => Q(Z("media_open", {
		expectedProfile: e,
		id: t
	})),
	mediaAdmitRemote: (e, t, n, r) => Q(Z("media_admit_remote", {
		expectedProfile: e,
		environment: t,
		element: n,
		url: r
	})),
	linkDescribe: (e, t, n) => Q(Z("link_describe", {
		expectedProfile: e,
		environment: t,
		element: n
	})),
	workAdmitFolder: (e, t) => Q(Z("work_admit_folder", {
		expectedProfile: e,
		path: t
	})),
	workPickFolder: (e) => Q(Z("work_pick_folder", { expectedProfile: e })),
	workRevealPath: (e, t) => Q(Z("work_reveal_path", {
		expectedProfile: e,
		path: t
	})),
	workReleaseMemory: (e) => Z("work_release_memory", { idle: e }),
	workChooseFolder: (e, t) => Q(Z("work_choose_folder", {
		expectedProfile: e,
		start: t
	})),
	workActivity: (e, t) => Z("work_activity", {
		expectedProfile: e,
		work: t
	}),
	workHumanPages: (e, t) => Z("work_human_pages", {
		expectedProfile: e,
		work: t
	}),
	workHumanPresent: (e, t, n, r) => Z("work_human_present", {
		expectedProfile: e,
		work: t,
		page: n,
		region: r
	}),
	workHumanContinue: (e, t, n, r) => Z("work_human_continue", {
		expectedProfile: e,
		work: t,
		page: n,
		account: r
	}),
	workHumanRelease: (e, t, n) => Z("work_human_release", {
		expectedProfile: e,
		work: t,
		page: n
	}),
	workHumanExtend: (e, t, n) => Z("work_human_extend", {
		expectedProfile: e,
		work: t,
		page: n
	}),
	workHumanCheck: (e, t, n) => Z("work_human_check", {
		expectedProfile: e,
		work: t,
		page: n
	}),
	workDecisionPreference: (e) => Z("work_decision_preference", { expectedProfile: e }),
	workSetDecisionPreference: (e, t) => Z("work_set_decision_preference", {
		expectedProfile: e,
		choice: t
	}),
	workSetDecisionKey: (e, t) => Z("work_set_decision_key", {
		expectedProfile: e,
		secret: t
	}),
	workClearDecisionKey: (e) => Z("work_clear_decision_key", { expectedProfile: e }),
	workModels: (e) => Z("work_models", { expectedProfile: e }),
	workModelsReady: (e) => Z("work_models_ready", { expectedProfile: e }),
	workChooseModel: (e, t, n) => Z("work_choose_model", {
		expectedProfile: e,
		role: t,
		id: n
	}),
	workSetModelEffort: (e, t) => Z("work_set_model_effort", {
		expectedProfile: e,
		effort: t
	}),
	workSetProviderKey: (e, t, n) => Z("work_set_provider_key", {
		expectedProfile: e,
		provider: t,
		key: n
	}),
	workTestProviderKey: (e, t) => Z("work_test_provider_key", {
		expectedProfile: e,
		provider: t
	}),
	workClearProviderKey: (e, t) => Z("work_clear_provider_key", {
		expectedProfile: e,
		provider: t
	}),
	workSetModelEndpoint: (e, t) => Z("work_set_model_endpoint", {
		expectedProfile: e,
		base: t
	}),
	workMoreModels: (e, t) => Z("work_more_models", {
		expectedProfile: e,
		provider: t
	}),
	workLocalServers: () => Z("work_local_servers"),
	voiceStatus: () => Z("voice_status"),
	voiceChooseEngine: (e) => Z("voice_choose_engine", { engine: e }),
	voiceChooseLanguage: (e) => Z("voice_choose_language", { language: e }),
	voiceStart: () => Z("voice_start"),
	voiceStop: (e) => Z("voice_stop", { take: e }),
	voiceCancel: () => Z("voice_cancel"),
	voiceOpenPrivacy: (e) => Z("voice_open_privacy", { kind: e }),
	pageAssistStatus: (e, t) => Z("page_assist_status", {
		space: e,
		tab: t
	}),
	pageAssistAsk: (e) => Z("page_assist_ask", { request: e }),
	pageAssistStop: (e) => Z("page_assist_stop", { space: e }),
	pageAssistCite: (e, t, n) => Z("page_assist_cite", {
		conversation: e,
		reply: t,
		n
	}),
	pageAssistFocus: (e, t, n, r) => Z("page_assist_focus", {
		conversation: e,
		reply: t,
		block: n,
		n: r
	}),
	pageAssistDecide: (e, t, n, r) => Z("page_assist_decide", {
		conversation: e,
		reply: t,
		block: n,
		decision: r
	}),
	pageAssistResume: (e, t) => Z("page_assist_resume", {
		conversation: e,
		reply: t
	}),
	pageAssistContinue: (e, t, n) => Z("page_assist_continue", {
		conversation: e,
		reply: t,
		block: n
	}),
	pageAssistNew: (e) => Z("page_assist_new", { space: e }),
	pageAssistHistory: (e) => Z("page_assist_history", { space: e }),
	pageAssistOpen: (e, t) => Z("page_assist_open", {
		space: e,
		conversation: t
	}),
	pageAssistDelete: (e, t) => Z("page_assist_delete", {
		space: e,
		conversation: t
	}),
	pageAssistPick: (e, t) => Z("page_assist_pick", {
		space: e,
		tab: t
	}),
	pageAssistPickCancel: (e) => Z("page_assist_pick_cancel", { tab: e }),
	pageAssistDetach: (e, t) => Z("page_assist_detach", {
		tab: e,
		pick: t
	}),
	pageAssistClose: (e) => Z("page_assist_close", { space: e }),
	pageStyles: (e) => Z("page_styles", { tab: e }),
	pageStyleToggle: (e, t, n) => Z("page_style_toggle", {
		tab: e,
		style: t,
		enabled: n
	}),
	pageStyleRemove: (e, t) => Z("page_style_remove", {
		tab: e,
		style: t
	}),
	pageStylesAll: (e) => Z("page_styles_all", { profile: e }),
	pageStyleToggleFor: (e, t, n, r) => Z("page_style_toggle_for", {
		profile: e,
		site: t,
		style: n,
		enabled: r
	}),
	pageStyleRemoveFor: (e, t, n) => Z("page_style_remove_for", {
		profile: e,
		site: t,
		style: n
	}),
	accountGet: () => Z("account_get"),
	accountSendCode: (e) => Z("account_send_code", { email: e }),
	accountVerify: (e) => Z("account_verify", { code: e }),
	accountCancelCode: () => Z("account_cancel_code"),
	accountSignOut: () => Z("account_sign_out"),
	accountRefresh: () => Z("account_refresh"),
	accountBuy: (e) => Z("account_buy", { purchase: e }),
	accountManage: () => Z("account_manage"),
	accountSetDailyLimit: (e) => Z("account_set_daily_limit", { limit: e }),
	accountPlanPreview: (e, t) => Z("account_plan_preview", {
		plan: e,
		interval: t
	}),
	accountPlanConfirm: () => Z("account_plan_confirm"),
	accountPlanDismiss: () => Z("account_plan_dismiss"),
	accountSessions: () => Z("account_sessions"),
	accountRevokeSession: (e) => Z("account_revoke_session", { id: e }),
	accountSetServer: (e) => Z("account_set_server", { server: e }),
	accountDeletionCode: () => Z("account_deletion_code"),
	accountDelete: (e) => Z("account_delete", { code: e }),
	accountSetName: (e) => Z("account_set_name", { name: e }),
	accountReauthCode: () => Z("account_reauth_code"),
	accountEmailCode: (e) => Z("account_email_code", { email: e }),
	accountChangeEmail: (e, t) => Z("account_change_email", {
		email: e,
		code: t
	}),
	accountSignOutEverywhere: () => Z("account_sign_out_everywhere"),
	accountExport: () => Z("account_export"),
	accountUsageHistory: (e) => Z("account_usage_history", { cursor: e }),
	accountReceipt: (e) => Z("account_receipt", { id: e }),
	accountAvatarPick: () => Q(Z("account_avatar_pick")),
	accountAvatarSave: (e, t) => Z("account_avatar_save", {
		token: e,
		crop: t
	}),
	accountAvatarDiscard: (e) => Z("account_avatar_discard", { token: e }),
	accountAvatarRemove: () => Z("account_avatar_remove"),
	workSites: (e) => Z("work_sites", { expectedProfile: e }),
	workSetSite: (e, t) => Z("work_set_site", {
		expectedProfile: e,
		change: t
	}),
	workScreenshotSites: (e) => Z("work_screenshot_sites", { expectedProfile: e }),
	workSetScreenshotSite: (e, t) => Z("work_set_screenshot_site", {
		expectedProfile: e,
		change: t
	}),
	workClearWebsiteData: (e) => Z("work_clear_website_data", { expectedProfile: e }),
	workConnections: (e) => Z("work_connections", { expectedProfile: e }),
	workSaveConnection: (e, t) => Z("work_save_connection", {
		expectedProfile: e,
		draft: t
	}),
	workPreviewConnection: (e, t) => Z("work_preview_connection", {
		expectedProfile: e,
		draft: t
	}),
	workRemoveConnection: (e, t) => Z("work_remove_connection", {
		expectedProfile: e,
		id: t
	}),
	workCheckConnection: (e, t) => Z("work_check_connection", {
		expectedProfile: e,
		id: t
	}),
	workSignInConnection: (e, t) => Z("work_sign_in_connection", {
		expectedProfile: e,
		id: t
	}),
	workCancelConnectionSignIn: (e, t, n) => Z("work_cancel_connection_sign_in", {
		expectedProfile: e,
		id: t,
		requestId: n
	}),
	workMemories: (e, t) => Z("work_memories", {
		expectedProfile: e,
		query: t
	}),
	workChangeMemory: (e, t, n) => Z("work_change_memory", {
		expectedProfile: e,
		query: t,
		change: n
	}),
	workSkills: (e) => Z("work_skills", { expectedProfile: e }),
	workSkillText: (e, t) => Z("work_skill_text", {
		expectedProfile: e,
		name: t
	}),
	workChangeSkill: (e, t) => Z("work_change_skill", {
		expectedProfile: e,
		change: t
	}),
	tabsBootstrap: () => Z("tabs_bootstrap"),
	tabsOpen: () => Z("tabs_open"),
	tabsActivate: (e) => Z("tabs_activate", { id: e }),
	tabsClose: (e) => Z("tabs_close", { id: e }),
	tabsSetEssential: (e, t, n) => Z("tabs_set_essential", {
		id: e,
		essential: t,
		before: n
	}),
	essentialsKeep: (e) => Z("essentials_keep", { site: e }),
	essentialsRelease: (e) => Z("essentials_release", { site: e }),
	profileRename: (e) => Z("profile_rename", { name: e }),
	onboardingPlayIntro: () => Z("onboarding_play_intro"),
	onboardingFinish: () => Z("onboarding_finish"),
	tabsNavigate: (e, t) => Z("tabs_navigate", {
		id: e,
		input: t
	}),
	tabsReload: (e) => Z("tabs_reload", { id: e }),
	tabsAnswerPageRequest: (e, t, n) => Z("tabs_answer_page_request", {
		id: e,
		request: t,
		answer: n
	}),
	tabsAnswerSignIn: (e, t, n) => Z("tabs_answer_sign_in", {
		id: e,
		request: t,
		credentials: n
	}),
	tabsContinuePastCertificate: (e) => Z("tabs_continue_past_certificate", { id: e }),
	tabsContinuePastBlock: (e, t) => Z("tabs_continue_past_block", {
		id: e,
		url: t
	}),
	tabsLeaveBlockedPage: (e) => Z("tabs_leave_blocked_page", { id: e }),
	diagnosticsShowLogs: () => Z("diagnostics_show_logs"),
	diagnosticsReport: () => Z("diagnostics_report"),
	tabsBack: (e) => Z("tabs_back", { id: e }),
	tabsForward: (e) => Z("tabs_forward", { id: e }),
	workPaneShow: (e, t) => Z("work_pane_show", {
		target: e,
		rect: t
	}),
	workPaneSetRect: (e, t) => Z("work_pane_set_rect", {
		rect: e,
		generation: t
	}),
	workPaneHide: () => Z("work_pane_hide"),
	tabsSplit: (e) => Z("tabs_split", { other: e }),
	tabsUnsplit: () => Z("tabs_unsplit"),
	tabsLeaveSplit: (e) => Z("tabs_leave_split", { id: e }),
	chromeMenuPopup: (e, t, n, r) => Z("chrome_menu_popup", {
		x: e,
		y: t,
		page: n,
		canSplit: r
	}),
	extensionActionInvoke: (e, t, n, r, i, a, o, s) => Z("extension_action_invoke", {
		profileId: e,
		installId: t,
		runtimeGeneration: n,
		actionRevision: r,
		anchorX: i,
		anchorY: a,
		anchorWidth: o,
		anchorHeight: s
	}),
	extensionActionMenu: (e, t, n, r, i, a, o, s) => Z("extension_action_menu", {
		profileId: e,
		installId: t,
		runtimeGeneration: n,
		actionRevision: r,
		anchorX: i,
		anchorY: a,
		anchorWidth: o,
		anchorHeight: s
	}),
	webExtensionPrepare: (e) => Q(Z("web_extension_prepare", { tabId: e })),
	webExtensionStoreButton: (e, t, n, r) => Z("web_extension_store_button", {
		tabId: e,
		extensionId: t,
		state: n,
		label: r
	}),
	webExtensionConfirm: (e, t) => Q(Z("web_extension_confirm", {
		id: e,
		reviewId: t
	})),
	webExtensionCancel: (e) => Z("web_extension_cancel", { reviewId: e }),
	webExtensionList: () => Q(Z("web_extension_list")),
	webExtensionSetEnabled: (e, t) => Q(Z("web_extension_set_enabled", {
		id: e,
		enabled: t
	})),
	webExtensionSetPinned: (e, t) => Q(Z("web_extension_set_pinned", {
		id: e,
		pinned: t
	})),
	webExtensionRetry: (e, t) => Q(Z("web_extension_retry", {
		profileId: e,
		installId: t
	})),
	webExtensionUninstall: (e) => Q(Z("web_extension_uninstall", { id: e })),
	webExtensionAnswerAccess: (e, t) => Q(Z("web_extension_answer_access", {
		request: e,
		allowed: t
	})),
	webExtensionSetAccess: (e, t, n) => Q(Z("web_extension_set_access", {
		id: e,
		mode: t,
		sites: n
	})),
	webExtensionOpenOptions: (e) => Q(Z("web_extension_open_options", { id: e })),
	webExtensionChooseFile: (e) => Q(Z("web_extension_choose_file", { folder: e })),
	webExtensionPrepareFile: (e) => Q(Z("web_extension_prepare_file", { path: e })),
	webExtensionReviewUpdate: (e) => Q(Z("web_extension_review_update", { id: e })),
	browserCredentialCapability: () => Z("browser_credential_capability"),
	browserPasskeyAuthorizationRequest: () => Z("browser_passkey_authorization_request"),
	pagePermissionRespond: (e, t, n, r) => Z("page_permission_respond", {
		profileId: e,
		itemId: t,
		requestId: n,
		decision: r
	}),
	pagePermissionCardHost: (e) => Z("page_permission_card_host", { available: e }),
	chromeModal: (e) => Z("chrome_modal", { open: e }),
	tabSetMuted: (e, t) => Z("tab_set_muted", {
		id: e,
		muted: t
	}),
	mediaPlayer: (e, t) => Z("media_player", {
		id: e,
		action: t
	}),
	sitePermissions: (e) => Q(Z("site_permissions", { origin: e })),
	sitePermissionSet: (e, t, n, r) => Z("site_permission_set", {
		origin: e,
		kind: t,
		decision: n,
		scheme: r
	}),
	blockerStatus: () => Q(Z("blocker_status")),
	blockerStats: (e) => Q(Z("blocker_stats", { profile: e })),
	blockerSetEnabled: (e) => Z("blocker_set_enabled", { enabled: e }),
	blockerSiteChange: (e, t) => Z("blocker_site_change", {
		context: e,
		action: t
	}),
	blockerPicker: (e, t) => Q(Z("blocker_picker", {
		context: e,
		action: t
	})),
	blockerRetry: (e) => Z("blocker_retry", { failedGeneration: e }),
	blockerRefreshSources: () => Z("blocker_refresh_sources"),
	profilesDelete: (e) => Z("profiles_delete", { profile: e }),
	profilesGet: () => Q(Z("profiles_get")),
	profilesCreate: (e, t, n) => Z("profiles_create", {
		name: e,
		avatar: t,
		andSwitch: n
	}),
	profilesSwitch: (e) => Z("profiles_switch", { profile: e }),
	profilesRename: (e, t) => Z("profiles_rename", {
		profile: e,
		name: t
	}),
	profilesSetAvatar: (e, t) => Z("profiles_set_avatar", {
		profile: e,
		avatar: t
	}),
	profileAvatarPick: () => Q(Z("profile_avatar_pick")),
	spacesCreate: (e, t) => Z("spaces_create", {
		name: e,
		look: t
	}),
	spacesUpdate: (e, t, n) => Z("spaces_update", {
		space: e,
		name: t,
		look: n
	}),
	spacesDelete: (e) => Z("spaces_delete", { space: e }),
	spacesReorder: (e, t) => Z("spaces_reorder", {
		space: e,
		before: t
	}),
	spacesSwitch: (e) => Z("spaces_switch", { space: e }),
	spacesStep: (e) => Z("spaces_step", { step: e }),
	spacesMoveTab: (e, t) => Z("spaces_move_tab", {
		tab: e,
		space: t
	}),
	spacesMenuPopup: (e, t) => Z("spaces_menu_popup", {
		x: e,
		y: t
	}),
	operationStatus: (e) => Z("operation_status", { operationId: e }),
	operationsReconcile: () => Z("operations_reconcile"),
	operationAcknowledge: (e) => Z("operation_acknowledge", { operationId: e }),
	runCommand: (e) => Z("run_command", { id: e }),
	panelHide: () => Z("panel_hide"),
	panelReady: () => Z("panel_ready"),
	tabSwitcherOpen: () => Z("tab_switcher_open"),
	tabSwitcherAction: (e, t) => Z("tab_switcher_action", {
		sessionId: e,
		intent: t
	}),
	panelIntent: (e) => Z("panel_intent", { intent: e }),
	panelLayout: (e) => Z("panel_layout", { layout: e }),
	launcherEdit: (e, t) => Z("launcher_edit", {
		tabId: e,
		url: t
	}),
	launcherTrigger: () => Z("launcher_trigger"),
	launcherSetShortcut: (e) => Z("launcher_set_shortcut", { accelerator: e }),
	launcherRecordShortcut: (e) => Z("launcher_record_shortcut", { active: e }),
	launcherSetDoubleTap: (e) => Z("launcher_set_double_tap", { mode: e }),
	launcherOpenAccessibility: () => Z("launcher_open_accessibility"),
	settingGet: (e) => Z("setting_get", { key: e }),
	searchShortcutDefaults: () => Z("search_shortcut_defaults"),
	settingSet: (e, t) => Z("setting_set", {
		key: e,
		value: t
	}),
	windowsDiagnosticsSettings: () => Z("windows_diagnostics_settings"),
	windowsReputationManaged: () => Z("windows_reputation_managed"),
	uiInfo: () => Z("ui_info"),
	uiReady: () => Z("ui_ready"),
	captionReplay: () => Z("caption_replay"),
	menuPopup: (e, t) => Z("menu_popup", {
		x: e,
		y: t
	}),
	addMenuPopup: (e, t, n) => Z("add_menu_popup", {
		x: e,
		y: t,
		canSplit: n
	}),
	tabMenuPopup: (e, t, n, r) => Z("tab_menu_popup", {
		id: e,
		x: t,
		y: n,
		context: r
	}),
	bookmarkMenuPopup: (e, t, n) => Z("bookmark_menu_popup", {
		x: e,
		y: t,
		folder: n
	}),
	profileMenuPopup: (e, t) => Z("profile_menu_popup", {
		x: e,
		y: t
	}),
	sidebarMenuPopup: (e, t, n, r, i, a, o) => Z("sidebar_menu_popup", {
		x: e,
		y: t,
		siteProtected: n,
		canHide: r,
		canClearData: i,
		extensions: a,
		manageExtensions: o
	}),
	toolsMenuPopup: (e, t) => Z("tools_menu_popup", {
		x: e,
		y: t
	}),
	newtabSearchContext: (e) => Z("newtab_search_context", { tabId: e }),
	newtabSearch: (e, t) => Z("newtab_search", {
		query: e,
		context: t
	}),
	newtabRun: (e, t) => Z("newtab_run", {
		action: e,
		context: t
	}),
	newtabCancel: (e) => Z("newtab_cancel", { context: e }),
	launcherSearch: (e, t) => Z("launcher_search", {
		query: e,
		requestId: t
	}),
	launcherRun: (e, t, n) => Z("launcher_run", {
		action: e,
		context: t,
		background: n
	}),
	sidebarSetWidth: (e, t, n) => Z("sidebar_set_width", {
		width: e,
		animate: t,
		revision: n
	}),
	sidebarSetHidden: (e) => Z("sidebar_set_hidden", { hidden: e }),
	sidebarPeek: (e, t, n) => Z("sidebar_peek", {
		peek: e,
		lights: t,
		slide: n
	}),
	sidebarResize: (e, t, n) => Z("sidebar_resize", {
		width: e,
		enabled: t,
		revision: n
	}),
	sidebarResizeGuide: (e) => Z("sidebar_resize_guide", { width: e }),
	tabDragOver: (e, t) => Z("tab_drag_over", {
		x: e,
		y: t
	}),
	resourceCall: (e, t) => Z("resource_call", {
		expectedProfile: e,
		call: t
	}),
	noteCall: (e, t) => Z("note_call", {
		expectedProfile: e,
		call: t
	}),
	historyCall: (e, t) => Z("history_call", {
		expectedProfile: e,
		call: t
	}),
	browsingDataCall: (e, t) => Z("browsing_data_call", {
		expectedProfile: e,
		call: t
	}),
	faviconProbe: (e, t) => Z("favicon_probe", {
		expectedProfile: e,
		origins: t
	}),
	downloadCall: (e, t) => Z("download_call", {
		expectedProfile: e,
		call: t
	}),
	downloadOpenAccessSettings: () => Z("download_open_access_settings"),
	aboutInfo: () => Z("about_info"),
	systemClock24h: () => Z("system_clock_24h"),
	updateStatus: () => Z("update_status"),
	updateCheck: () => Z("update_check"),
	updateRelaunch: () => Z("update_relaunch"),
	appRelaunch: () => Z("app_relaunch"),
	updateHighlights: () => Z("update_highlights"),
	openSoftwareUpdate: () => Z("open_software_update"),
	browserOpenUrl: (e, t) => Z("browser_open_url", {
		url: e,
		newTab: t
	}),
	keymapEntries: () => Z("keymap_entries"),
	keymapBind: (e, t, n) => Z("keymap_bind", {
		id: e,
		accelerator: t,
		replace: n
	}),
	keymapReset: (e) => Z("keymap_reset", { id: e }),
	keymapRecord: (e) => Z("keymap_record", { active: e }),
	defaultBrowserStatus: () => Z("default_browser_status"),
	defaultBrowserRequest: () => Z("default_browser_request"),
	loginItemStatus: () => Z("login_item_status"),
	loginItemSet: (e) => Z("login_item_set", { enabled: e }),
	loginItemOpenSettings: () => Z("login_item_open_settings"),
	haptic: (e) => Z("haptic", { kind: e }),
	bookmarkCall: (e, t) => Z("bookmark_call", {
		expectedProfile: e,
		call: t
	}),
	timeCall: (e, t) => Z("time_call", {
		expectedProfile: e,
		call: t
	}),
	zoomCall: (e, t) => Z("zoom_call", {
		expectedProfile: e,
		call: t
	}),
	focusControl: (e) => Z("focus_control", { control: e }),
	pageFind: (e, t) => Z("page_find", {
		query: e,
		forward: t
	}),
	importSources: () => Z("import_sources"),
	importStart: (e, t, n) => Z("import_start", {
		source: e,
		profile: t,
		kinds: n
	}),
	importCancel: () => Z("import_cancel"),
	importOpenPermission: (e) => Z("import_open_permission", { source: e }),
	exportBrowserData: (e) => Z("export_browser_data", { kind: e }),
	historyMenuPopup: (e, t, n, r) => Z("history_menu_popup", {
		id: e,
		forward: t,
		x: n,
		y: r
	}),
	pageSource: (e) => Z("page_source", { id: e }),
	resourceCloseReady: (e, t) => Z("resource_close_ready", {
		token: e,
		success: t
	}),
	tabDrop: (e, t, n) => Z("tab_drop", {
		id: e,
		x: t,
		y: n
	}),
	dividerGrab: (e, t) => Z("divider_grab", {
		x: e,
		y: t
	}),
	dividerDrag: (e, t) => Z("divider_drag", {
		x: e,
		y: t
	}),
	dividerRelease: (e, t) => Z("divider_release", {
		x: e,
		y: t
	}),
	swipeRegion: (e) => Z("swipe_region", { region: e })
};
$("blocker-status-changed"), $("browser-credential-capability-changed"), $("downloads-changed"), $("extension-action-failed"), $("extension-action-shortcut"), $("extension-actions-changed"), $("favicons-changed"), $("find-changed"), $("focus-changed"), $("items-changed"), $("layout-changed"), $("media-player-changed"), $("note-open-requested"), $("notes-changed"), $("operation-processed"), $("page-permission-prompt-changed"), $("resource-changed"), $("runtime-status-changed"), $("search-changed"), $("tab-changed"), $("ui-command"), $("web-extension-access-requested"), $("web-extension-store-clicked"), $("work-changed"), $("work-environment-changed"), $("zephium:account-changed"), $("zephium:import-progress"), $("zephium:keymap-changed"), $("zephium:page-assist-changed"), $("zephium:swipe"), $("zephium:voice-changed"), $("zephium:voice-levels"), $("zephium:work-decision-preference-changed"), $("zephium:work-human-changed"), $("zephium:work-models-changed");
async function Q(e) {
	try {
		return {
			status: "ok",
			data: await e
		};
	} catch (e) {
		if (e instanceof Error) throw e;
		return {
			status: "error",
			error: e
		};
	}
}
function $(e, t, n) {
	let r = (e) => (t) => e({
		...t,
		payload: n ? n(t.payload) : t.payload
	}), i = (e) => t ? t(e) : e;
	return Object.assign((t) => ({
		listen: (n) => t.listen(e, r(n)),
		once: (n) => t.once(e, r(n)),
		emit: ((n) => t.emit(e, i(n)))
	}), {
		listen: (t) => _t(e, r(t)),
		once: (t) => vt(e, r(t)),
		emit: ((t) => yt(e, i(t)))
	});
}
export { w as A, h as B, E as C, Ce as D, we as E, me as F, c as G, ce as H, he as I, l as K, v as L, ve as M, b as N, ye as O, pe as P, y as R, O as S, S as T, d as U, p as V, re as W, Le as _, ot as a, R as b, Ve as c, ze as d, Be as f, B as g, Fe as h, gt as i, C as j, T as k, We as l, U as m, ht as n, qe as o, W as p, Z as r, Ke as s, bt as t, He as u, V as v, Te as w, Ae as x, z as y, _ as z };
