import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, F as n, H as r, J as i, L as a, Mt as o, P as s, W as c, X as l, Y as u, bt as d, c as f, ft as p, gt as m, h, ht as g, it as _, jt as v, lt as y, mt as b, n as x, pt as S, s as C, tt as w, ut as T, vt as E, zt as D } from "./index-client-DH73-vTM.js";
import { t as O } from "./Icon-D2j1Ej6Z.js";
import "./Icon-CmjKIKuh.js";
import { t as k } from "./bindings-DgGe59oq.js";
import { t as A } from "./native-events-Bexa20bU.js";
import { t as j } from "./platform-Mb6CdXdB.js";
import { t as M } from "./Alert02Icon-B5KhDP6a.js";
import { t as N } from "./Cancel01Icon-6hDfDS5l.js";
import { i as ee, n as te, r as ne, t as P } from "./daily-reset-CSj0eIlG.js";
import { r as F } from "./motion-CNlXCFGr.js";
import { t as I } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/voice_cancel.js
var L = () => "Cancel dictation", re = ((e = {}, t = {}) => (t.locale ?? I(), L(e))), R = () => "Cancel (Esc)", ie = ((e = {}, t = {}) => (t.locale ?? I(), R(e))), z = () => "Your audio is sent here to be transcribed, then discarded", ae = ((e = {}, t = {}) => (t.locale ?? I(), z(e))), B = () => "Dismiss", oe = ((e = {}, t = {}) => (t.locale ?? I(), B(e))), V = () => "On this device", H = ((e = {}, t = {}) => (t.locale ?? I(), V(e))), U = () => "Groq", W = ((e = {}, t = {}) => (t.locale ?? I(), U(e))), G = () => "On this Mac", K = ((e = {}, t = {}) => (t.locale ?? I(), G(e))), q = () => "OpenAI", J = ((e = {}, t = {}) => (t.locale ?? I(), q(e))), Y = () => "Aegis AI", X = ((e = {}, t = {}) => (t.locale ?? I(), Y(e))), se = () => "Dictation", ce = ((e = {}, t = {}) => (t.locale ?? I(), se(e))), le = () => "Listening", ue = ((e = {}, t = {}) => (t.locale ?? I(), le(e))), de = () => "Recordings can be up to 4 minutes.", fe = ((e = {}, t = {}) => (t.locale ?? I(), de(e))), pe = () => "Your Aegis account is under billing review.", me = ((e = {}, t = {}) => (t.locale ?? I(), pe(e))), he = (e) => `${e?.engine} is busy. Try again in a moment.`, ge = ((e, t = {}) => (t.locale ?? I(), he(e))), _e = (e) => `${e?.engine} has no credit left for dictation.`, ve = ((e, t = {}) => (t.locale ?? I(), _e(e))), ye = (e) => `You’ve reached your daily limit. It resets at ${e?.time}.`, be = ((e, t = {}) => (t.locale ?? I(), ye(e))), xe = () => "Dictation is off on this Mac. Turn it on in System Settings → Keyboard.", Se = ((e = {}, t = {}) => (t.locale ?? I(), xe(e))), Ce = () => "Free Aegis AI usage is paused right now. Credits and your own key still work.", we = ((e = {}, t = {}) => (t.locale ?? I(), Ce(e))), Te = () => "Aegis AI is paused for now. Try again later, or use your own key.", Ee = ((e = {}, t = {}) => (t.locale ?? I(), Te(e))), De = () => "Couldn’t read that recording. Try again.", Oe = ((e = {}, t = {}) => (t.locale ?? I(), De(e))), ke = (e) => `${e?.engine} refused your key. Check it in Settings → AI.`, Ae = ((e, t = {}) => (t.locale ?? I(), ke(e))), je = () => "This device can’t recognize your language. Choose another way to dictate in Settings → AI.", Me = ((e = {}, t = {}) => (t.locale ?? I(), je(e))), Ne = () => "Aegis can’t use the microphone. Allow it in Privacy settings.", Pe = ((e = {}, t = {}) => (t.locale ?? I(), Ne(e))), Fe = () => "Dictation needs Aegis AI or your own OpenAI or Groq key. Set one up in Settings → AI.", Ie = ((e = {}, t = {}) => (t.locale ?? I(), Fe(e))), Le = () => "This Mac can’t recognize your language. Sign in to Aegis AI or add an OpenAI or Groq key in Settings → AI.", Re = ((e = {}, t = {}) => (t.locale ?? I(), Le(e))), ze = () => "No microphone is available.", Be = ((e = {}, t = {}) => (t.locale ?? I(), ze(e))), Ve = () => "Didn’t catch that.", He = ((e = {}, t = {}) => (t.locale ?? I(), Ve(e))), Ue = (e) => `Couldn’t reach ${e?.engine}. Check your connection.`, We = ((e, t = {}) => (t.locale ?? I(), Ue(e))), Ge = () => "Dictation needs a different Aegis plan.", Ke = ((e = {}, t = {}) => (t.locale ?? I(), Ge(e))), qe = () => "Speech recognition is off for Aegis. Allow it in Privacy settings.", Je = ((e = {}, t = {}) => (t.locale ?? I(), qe(e))), Ye = () => "Sign in to Aegis AI again to dictate.", Xe = ((e = {}, t = {}) => (t.locale ?? I(), Ye(e))), Ze = () => "That was too long to transcribe. Try a shorter one.", Qe = ((e = {}, t = {}) => (t.locale ?? I(), Ze(e))), $e = () => "Dictation isn’t available right now.", et = ((e = {}, t = {}) => (t.locale ?? I(), $e(e))), tt = () => "That recording’s format isn’t supported. Try recording again.", nt = ((e = {}, t = {}) => (t.locale ?? I(), tt(e))), rt = () => "Open Keyboard Settings", it = ((e = {}, t = {}) => (t.locale ?? I(), rt(e))), at = () => "Open Privacy Settings", ot = ((e = {}, t = {}) => (t.locale ?? I(), at(e))), st = () => "Try again", ct = ((e = {}, t = {}) => (t.locale ?? I(), st(e))), lt = () => "Settings", ut = ((e = {}, t = {}) => (t.locale ?? I(), lt(e))), dt = () => "Stop and insert", Z = ((e = {}, t = {}) => (t.locale ?? I(), dt(e))), ft = () => "Transcribing…", Q = ((e = {}, t = {}) => (t.locale ?? I(), ft(e))), pt = class {
	commit;
	#e = d("idle");
	get phase() {
		return w(this.#e);
	}
	set phase(e) {
		E(this.#e, e, !0);
	}
	#t = d(null);
	get engine() {
		return w(this.#t);
	}
	set engine(e) {
		E(this.#t, e);
	}
	#n = d("");
	get partial() {
		return w(this.#n);
	}
	set partial(e) {
		E(this.#n, e, !0);
	}
	#r = d(null);
	get problem() {
		return w(this.#r);
	}
	set problem(e) {
		E(this.#r, e);
	}
	#i = d(null);
	get since() {
		return w(this.#i);
	}
	set since(e) {
		E(this.#i, e, !0);
	}
	current = "idle";
	take = null;
	generation = 0;
	listening = null;
	stops = [];
	sinks = [];
	disposed = !1;
	constructor(e) {
		this.commit = e;
	}
	get active() {
		return this.current === "starting" || this.current === "listening" || this.current === "transcribing";
	}
	to(e) {
		this.current = e, this.phase = e;
	}
	onLevels(e) {
		return this.sinks.push(e), () => {
			this.sinks = this.sinks.filter((t) => t !== e);
		};
	}
	listen() {
		return this.listening ??= (async () => {
			let e = await Promise.all([A.voiceChanged.listen(({ payload: e }) => this.changed(e)), A.voiceLevels.listen(({ payload: e }) => {
				if (e.take === this.take && this.current === "listening") for (let t of this.sinks) t(e.levels);
			})]);
			if (this.disposed) for (let t of e) t();
			else this.stops = e;
		})(), this.listening;
	}
	async start() {
		if (this.active || this.disposed) return;
		let e = ++this.generation;
		if (this.reset(), this.engine = null, this.to("starting"), await this.listen(), e !== this.generation) return;
		let t;
		try {
			t = await k.voiceStart();
		} catch {
			t = {
				take: null,
				engine: null,
				fault: "unavailable"
			};
		}
		if (e !== this.generation) t.take !== null && k.voiceCancel().catch(() => {});
		else {
			if (t.fault) return this.fail(t.fault);
			if (t.take === null) return this.reset();
			this.take = t.take, this.engine = t.engine, this.current === "starting" && this.heard();
		}
	}
	heard() {
		this.to("listening"), this.since = performance.now();
	}
	changed(e) {
		if (this.take === null && this.current === "starting" && (this.take = e.take), e.take === this.take) switch (e.engine && (this.engine = e.engine), e.phase) {
			case "listening":
				this.current === "starting" && this.heard(), e.partial !== null && (this.partial = e.partial);
				return;
			case "transcribing":
				this.current === "listening" && this.to("transcribing");
				return;
			case "done": {
				let t = (e.text ?? "").trim();
				if (!t) return this.fail("nothing_heard");
				this.reset(), this.commit(t);
				return;
			}
			case "failed": return this.fail(e.fault ?? "unavailable");
			case "cancelled": return this.reset();
		}
	}
	stop() {
		if (this.current === "starting") return this.cancel();
		this.current === "listening" && this.take !== null && k.voiceStop(this.take).catch(() => this.fail("unavailable"));
	}
	cancel() {
		let e = this.active;
		this.generation += 1, this.reset(), e && k.voiceCancel().catch(() => {});
	}
	fail(e) {
		this.reset(), this.problem = e, this.to("failed");
	}
	reset() {
		this.to("idle"), this.problem = null, this.partial = "", this.since = null, this.take = null;
	}
	dispose() {
		this.cancel(), this.disposed = !0;
		for (let e of this.stops) e();
		this.stops = [], this.sinks = [];
	}
};
// upstream/src/domain/voice/settings.svelte.ts
function $(e) {
	switch (e) {
		case "on_device": return j ? K() : H();
		case "zephium": return X();
		case "open_ai": return J();
		case "groq": return W();
	}
}
// upstream/src/features/work/lib/voice-problem.ts
function mt(e, t) {
	let n = t ? $(t) : X();
	switch (e) {
		case "microphone_denied": return {
			message: Pe(),
			remedy: "microphone"
		};
		case "recognition_denied": return {
			message: Je(),
			remedy: "recognition"
		};
		case "dictation_off": return {
			message: Se(),
			remedy: "dictation"
		};
		case "no_microphone": return {
			message: Be(),
			remedy: "retry"
		};
		case "language_unavailable": return {
			message: Me(),
			remedy: "settings"
		};
		case "no_engine": return {
			message: j ? Re() : Ie(),
			remedy: "settings"
		};
		case "key_refused": return {
			message: Ae({ engine: n }),
			remedy: "settings"
		};
		case "signed_out": return {
			message: Xe(),
			remedy: "settings"
		};
		case "out_of_credit": return {
			message: ve({ engine: n }),
			remedy: t === "zephium" || t === null ? "plans" : "settings"
		};
		case "plan_required": return {
			message: Ke(),
			remedy: "plans"
		};
		case "free_usage_paused": return {
			message: we(),
			remedy: "plans"
		};
		case "billing_review": return {
			message: me(),
			remedy: "account"
		};
		case "daily_limit": return {
			message: be({ time: P() }),
			remedy: "limit"
		};
		case "hosted_paused": return {
			message: Ee(),
			remedy: "settings"
		};
		case "invalid_audio": return {
			message: Oe(),
			remedy: "retry"
		};
		case "unsupported_audio": return {
			message: nt(),
			remedy: "retry"
		};
		case "audio_too_long": return {
			message: fe(),
			remedy: "retry"
		};
		case "rate_limited":
		case "provider_down": return {
			message: ge({ engine: n }),
			remedy: "retry"
		};
		case "offline": return {
			message: We({ engine: n }),
			remedy: "retry"
		};
		case "too_long": return {
			message: Qe(),
			remedy: "retry"
		};
		case "nothing_heard": return {
			message: He(),
			remedy: "retry"
		};
		case "busy":
		case "unavailable": return {
			message: et(),
			remedy: "retry"
		};
	}
}
// upstream/src/features/work/components/bar/VoiceWave.svelte
var ht = c("<span class=\"bar svelte-183kw1n\"></span>"), gt = c("<div class=\"wave svelte-183kw1n\" aria-hidden=\"true\"><div class=\"strip svelte-183kw1n\"></div></div>");
function _t(e, i) {
	o(i, !0);
	let a = [
		.45,
		.75,
		1,
		.75,
		.45
	], c = d(0), l = d(void 0), u = F(), p = t(() => u ? a.length : Math.min(160, Math.max(12, Math.floor(w(c) / 4) + 1))), g = m([]), _ = (e) => .12 + .88 * Math.min(1, e / 100) ** .75, b = [], x = [];
	function O(e = 0) {
		let t = g.slice(0, w(p));
		if (u) {
			let e = b.at(-1) ?? 0;
			t.forEach((t, n) => {
				t.style.transform = `scaleY(${_(e * a[n])})`;
			});
			return;
		}
		let n = b.length - t.length;
		t.forEach((e, t) => {
			e.style.transform = `scaleY(${_(b[n + t] ?? 0)})`;
		}), w(l) && (w(l).style.transform = `translateX(${-e * 4}px)`);
	}
	T(() => i.take.onLevels((e) => {
		x.push(...e), x.length > 12 && (x = x.slice(-4)), u && (b = [x.at(-1) ?? 0], x = [], O());
	})), T(() => {
		if (u || i.phase !== "listening") return;
		w(p);
		let e = 0, t = performance.now(), n = 0, r = (i) => {
			for (n += i - t, t = i; n >= 80;) {
				n -= 80;
				let e = Math.max(x.shift() ?? 0, x.shift() ?? 0);
				b.push(e), b.length > w(p) + 1 && (b = b.slice(-(w(p) + 1)));
			}
			O(n / 80), e = requestAnimationFrame(r);
		};
		return e = requestAnimationFrame(r), () => cancelAnimationFrame(e);
	});
	var k = gt(), A = S(k);
	s(A, 21, () => ({ length: w(p) }), n, (e, t, n) => {
		var i = ht();
		C(i, (e, t) => g[t] = e, (e) => g?.[e], () => [n]), r(e, i);
	}), D(A), C(A, (e) => E(l, e), () => w(l)), D(k), y(() => {
		h(k, "data-phase", i.phase), h(k, "data-reduce", u);
	}), f(k, "clientWidth", (e) => E(c, e)), r(e, k), v();
}
// upstream/src/features/work/components/bar/VoiceView.svelte
var vt = c("<p class=\"partial svelte-1xboy4n\"> </p>"), yt = c("<button type=\"button\" class=\"remedy svelte-1xboy4n\"> </button>"), bt = c("<span class=\"problem-mark svelte-1xboy4n\" aria-hidden=\"true\"><!></span> <p class=\"message svelte-1xboy4n\" role=\"alert\"> </p> <!> <button type=\"button\" class=\"ghost svelte-1xboy4n\"><!></button>", 1), xt = c("<span class=\"working svelte-1xboy4n\"> </span>"), St = c("<span class=\"engine svelte-1xboy4n\"> </span>"), Ct = c("<span class=\"spinner svelte-1xboy4n\" aria-hidden=\"true\"></span>"), wt = c("<span class=\"square svelte-1xboy4n\" aria-hidden=\"true\"></span>"), Tt = c("<button type=\"button\" class=\"ghost svelte-1xboy4n\"><!></button> <div class=\"listen svelte-1xboy4n\"><!> <!></div> <span class=\"meta svelte-1xboy4n\"><!> <span class=\"time svelte-1xboy4n\" aria-hidden=\"true\"> </span></span> <button type=\"button\" class=\"stop svelte-1xboy4n\"><!></button>", 1), Et = c("<div class=\"voice svelte-1xboy4n\" role=\"group\"><!> <div class=\"strip svelte-1xboy4n\"><!></div> <span class=\"sr-only svelte-1xboy4n\" aria-live=\"polite\"> </span></div>");
function Dt(n, i) {
	o(i, !0);
	let s = _(() => i.take) ?? new pt((e) => i.oncommit(e)), c = d(void 0), f = d(m(performance.now()));
	function A() {
		s.phase === "listening" || s.phase === "starting" ? s.stop() : s.phase === "failed" && (s.cancel(), i.onclose());
	}
	x(() => (_(() => i.take) || s.start(), w(c)?.focus(), () => s.dispose()));
	let j = !1;
	T(() => {
		s.phase === "idle" ? j && i.onclose() : j = !0;
	}), T(() => {
		if (s.phase !== "listening") return;
		let e = setInterval(() => E(f, performance.now(), !0), 250);
		return () => clearInterval(e);
	});
	let P = t(() => {
		let e = s.since === null ? 0 : Math.max(0, Math.floor((w(f) - s.since) / 1e3));
		return `${Math.floor(e / 60)}:${String(e % 60).padStart(2, "0")}`;
	}), F = t(() => s.engine !== null && s.engine !== "on_device"), I = t(() => s.problem ? mt(s.problem, s.engine) : null), L = t(() => s.phase === "listening" ? ue() : s.phase === "transcribing" ? Q() : "");
	function R() {
		s.cancel(), i.onclose();
	}
	function z() {
		switch (w(I)?.remedy) {
			case "settings": return k.runCommand("settings.ai"), R();
			case "plans":
			case "account":
			case "limit": return k.runCommand("settings.account"), R();
			case "microphone":
			case "recognition":
			case "dictation": return k.voiceOpenPrivacy(w(I).remedy).catch(() => !1), R();
			case "retry":
				s.start();
				return;
		}
	}
	let B = t(() => w(I)?.remedy === "settings" ? ut() : w(I)?.remedy === "plans" ? te() : w(I)?.remedy === "account" ? ee() : w(I)?.remedy === "limit" ? ne() : w(I)?.remedy === "microphone" || w(I)?.remedy === "recognition" ? ot() : w(I)?.remedy === "dictation" ? it() : w(I)?.remedy === "retry" ? ct() : null);
	var V = { toggle: A }, H = Et();
	l("keydown", p, (e) => {
		e.key !== "Escape" || e.isComposing || s.phase === "idle" || (e.preventDefault(), e.stopPropagation(), R());
	});
	var U = S(H), W = (t) => {
		var n = vt(), i = S(n, !0);
		D(n), y(() => e(i, s.partial)), r(t, n);
	};
	a(U, (e) => {
		s.phase === "listening" && s.partial && e(W);
	});
	var G = g(U, 2), K = S(G), q = (t) => {
		var n = bt(), i = b(n), o = S(i);
		O(o, {
			get icon() {
				return M;
			},
			size: 15
		}), D(i);
		var s = g(i, 2), c = S(s, !0);
		D(s);
		var l = g(s, 2), d = (t) => {
			var n = yt(), i = S(n, !0);
			D(n), y(() => e(i, w(B))), u("click", n, z), r(t, n);
		};
		a(l, (e) => {
			w(B) && e(d);
		});
		var f = g(l, 2), p = S(f);
		O(p, {
			get icon() {
				return N;
			},
			size: 15,
			strokeWidth: 1.8
		}), D(f), y((t) => {
			e(c, w(I).message), h(f, "aria-label", t);
		}, [() => oe()]), u("click", f, R), r(t, n);
	}, J = (t) => {
		var n = Tt(), i = b(n), o = S(i);
		O(o, {
			get icon() {
				return N;
			},
			size: 15,
			strokeWidth: 1.8
		}), D(i);
		var l = g(i, 2), d = S(l);
		_t(d, {
			get take() {
				return s;
			},
			get phase() {
				return s.phase;
			}
		});
		var f = g(d, 2), p = (t) => {
			var n = xt(), i = S(n, !0);
			D(n), y((t) => e(i, t), [() => Q()]), r(t, n);
		};
		a(f, (e) => {
			s.phase === "transcribing" && e(p);
		}), D(l);
		var m = g(l, 2), _ = S(m), v = (t) => {
			var n = St(), i = S(n, !0);
			D(n), y((t, r) => {
				h(n, "title", t), e(i, r);
			}, [() => ae(), () => $(s.engine)]), r(t, n);
		};
		a(_, (e) => {
			w(F) && s.engine && e(v);
		});
		var x = g(_, 2), T = S(x, !0);
		D(x), D(m);
		var k = g(m, 2), A = S(k), j = (e) => {
			var t = Ct();
			r(e, t);
		}, M = (e) => {
			var t = wt();
			r(e, t);
		};
		a(A, (e) => {
			s.phase === "transcribing" ? e(j) : e(M, -1);
		}), D(k), C(k, (e) => E(c, e), () => w(c)), y((t, n, r, a) => {
			h(i, "aria-label", t), h(i, "title", n), e(T, w(P)), h(k, "aria-label", r), h(k, "title", a), h(k, "aria-busy", s.phase === "transcribing" || void 0), k.disabled = s.phase === "transcribing";
		}, [
			() => re(),
			() => ie(),
			() => s.phase === "transcribing" ? Q() : Z(),
			() => Z()
		]), u("click", i, R), u("click", k, () => s.stop()), r(t, n);
	};
	a(K, (e) => {
		w(I) ? e(q) : e(J, -1);
	}), D(G);
	var Y = g(G, 2), X = S(Y, !0);
	return D(Y), D(H), y((t) => {
		h(H, "data-phase", s.phase), h(H, "aria-label", t), e(X, w(L));
	}, [() => ce()]), r(n, H), v(V);
}
i(["click"]);
export { Dt as default };
