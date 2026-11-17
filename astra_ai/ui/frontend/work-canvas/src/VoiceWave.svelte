<script lang="ts">
  /*
   * The composer's live voice strip: while the microphone is on, or AEGIS is speaking, the bar shows
   * what is being said and a recording-style waveform, newest sound on the right, moving left.
   * The person's voice and AEGIS's voice have their own colours. Levels come from the two analysers
   * the app already runs for its orb (window.__aegisVoice); no second audio graph, no recording.
   */
  import { onDestroy } from "svelte";

  let {
    listening = false,
    speaking = false,
    host,
  }: {
    /** The microphone is on. */
    listening?: boolean;
    /** AEGIS's voice is playing. */
    speaking?: boolean;
    /** The composer dock; the strip stands over its text field. */
    host?: HTMLElement;
  } = $props();

  type Who = "user" | "ai" | null;
  const STEP_MS = 60;
  const BAR = 3;
  const GAP = 2;
  const MAX_BARS = 400;

  let canvas = $state<HTMLCanvasElement>();
  let box = $state<{ left: number; top: number; width: number; height: number } | null>(null);
  let said = $state<{ who: "user" | "ai"; text: string }>({ who: "user", text: "" });
  let talking = $state<Who>(null);
  const active = $derived(listening || speaking);

  // Stand over the text field, wherever the bar lays it out.
  $effect(() => {
    const dock = host;
    if (!dock || !active) {
      box = null;
      return;
    }
    const field = dock.querySelector<HTMLElement>("form.field textarea") ?? dock.querySelector<HTMLElement>("textarea");
    if (!field) return;
    const place = () => {
      const outer = dock.getBoundingClientRect();
      const inner = field.getBoundingClientRect();
      box = { left: inner.left - outer.left, top: inner.top - outer.top, width: inner.width, height: Math.max(36, inner.height) };
    };
    const observer = new ResizeObserver(place);
    observer.observe(dock);
    observer.observe(field);
    place();
    return () => observer.disconnect();
  });

  // What is being said, as the live transcription gives it.
  $effect(() => {
    const heard = (event: Event) => {
      const detail = (event as CustomEvent<{ who: "user" | "ai"; text: string }>).detail;
      if (detail?.text) said = { who: detail.who, text: detail.text };
    };
    window.addEventListener("aegis-voice-transcript", heard);
    return () => window.removeEventListener("aegis-voice-transcript", heard);
  });
  $effect(() => {
    if (!active) said = { who: "user", text: "" };
  });

  const bars: { level: number; who: Who }[] = [];
  const time = new Float32Array(256);
  function level(analyser: AnalyserNode | null | undefined) {
    if (!analyser) return 0;
    const samples = time.subarray(0, Math.min(time.length, analyser.fftSize));
    analyser.getFloatTimeDomainData(samples);
    let sum = 0;
    for (const value of samples) sum += value * value;
    return Math.sqrt(sum / samples.length);
  }

  let frame = 0;
  let last = 0;
  let shift = 0;
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function sample() {
    const voice = (window as unknown as { __aegisVoice?: { ai?: AnalyserNode; mic?: AnalyserNode | null } }).__aegisVoice;
    const ai = speaking ? level(voice?.ai) : 0;
    const mic = listening ? level(voice?.mic) : 0;
    const who: Who = ai > 0.015 && ai >= mic ? "ai" : mic > 0.01 ? "user" : null;
    talking = who;
    // Loudness on a soft curve, so quiet speech still reads and loud speech never clips.
    const loud = Math.min(1, Math.sqrt(Math.max(ai, mic) * 6));
    bars.push({ level: who ? Math.max(0.12, loud) : 0.05, who });
    if (bars.length > MAX_BARS) bars.splice(0, bars.length - MAX_BARS);
  }

  function draw(now: number) {
    frame = 0;
    const surface = canvas;
    if (!surface || !active) return;
    if (now - last >= STEP_MS) {
      last = now;
      sample();
      shift = 0;
    } else if (!reduced) shift = (now - last) / STEP_MS;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = surface.clientWidth;
    const height = surface.clientHeight;
    if (surface.width !== Math.round(width * ratio) || surface.height !== Math.round(height * ratio)) {
      surface.width = Math.round(width * ratio);
      surface.height = Math.round(height * ratio);
    }
    const context = surface.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const style = getComputedStyle(surface);
    const colours = { user: style.getPropertyValue("--voice-user").trim() || "#dfe3ea", ai: style.getPropertyValue("--voice-ai").trim() || "#ff8a3d", none: style.getPropertyValue("--voice-quiet").trim() || "#8a8f98" };
    const pitch = BAR + GAP;
    const middle = height / 2;
    // Newest on the right; each bar slides left as the next arrives.
    for (let index = bars.length - 1, x = width - BAR - shift * pitch; index >= 0 && x > -BAR; index--, x -= pitch) {
      const bar = bars[index]!;
      const h = Math.max(2, bar.level * (height - 4));
      context.fillStyle = bar.who === "ai" ? colours.ai : bar.who === "user" ? colours.user : colours.none;
      context.globalAlpha = bar.who ? 1 : 0.5;
      context.beginPath();
      context.roundRect(x, middle - h / 2, BAR, h, BAR / 2);
      context.fill();
    }
    context.globalAlpha = 1;
    frame = requestAnimationFrame(draw);
  }

  // The loop runs only while the strip is shown.
  $effect(() => {
    if (!active || !canvas) return;
    bars.length = 0;
    frame = requestAnimationFrame(draw);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
  });
  onDestroy(() => frame && cancelAnimationFrame(frame));

  const label = $derived(talking === "ai" || (speaking && !listening) ? "AEGIS" : listening ? "Listening" : "");
</script>

{#if active && box}
  <div
    class="voice-strip"
    data-who={talking ?? (speaking ? "ai" : "user")}
    style:left="{box.left}px"
    style:top="{box.top}px"
    style:width="{box.width}px"
    style:height="{box.height}px"
    role="status"
    aria-live="polite"
  >
    <span class="who"><span class="dot" aria-hidden="true"></span>{label}</span>
    <span class="said" class:ai={said.who === "ai"}><span>{said.text ? said.text.slice(-240) : listening ? "Speak to AEGIS…" : ""}</span></span>
    <canvas bind:this={canvas} class="wave" aria-hidden="true"></canvas>
  </div>
{/if}

<style>
  .voice-strip {
    --voice-user: #dfe3ea;
    --voice-ai: #ff8a3d;
    --voice-quiet: color-mix(in oklab, var(--color-muted, #8a8f98) 70%, transparent);
    position: absolute;
    z-index: 3;
    display: flex;
    align-items: center;
    gap: 10px;
    box-sizing: border-box;
    padding: 0 4px;
    background: var(--color-surface, #1f1f22);
    pointer-events: none;
    font: 13px/1.35 var(--font-sans, Inter, sans-serif);
    color: var(--color-text, #eee);
  }
  .who {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: none;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--color-muted, #9aa0a6);
  }
  .dot {
    inline-size: 7px;
    block-size: 7px;
    border-radius: 50%;
    background: var(--voice-user);
    box-shadow: 0 0 0 0 color-mix(in oklab, var(--voice-user) 50%, transparent);
    animation: pulse 1.6s ease-out infinite;
  }
  .voice-strip[data-who="ai"] .dot {
    background: var(--voice-ai);
    box-shadow: 0 0 0 0 color-mix(in oklab, var(--voice-ai) 50%, transparent);
  }
  .said {
    flex: 1 1 40%;
    min-inline-size: 0;
    display: flex;
    /* The newest words stay in view: the line is right-aligned and its start is cut off. */
    justify-content: flex-end;
    overflow: hidden;
    white-space: nowrap;
    mask-image: linear-gradient(to right, transparent, #000 24px);
  }
  .said.ai {
    color: color-mix(in oklab, var(--voice-ai) 55%, var(--color-text, #eee));
  }
  .wave {
    flex: 1 1 60%;
    min-inline-size: 120px;
    block-size: 100%;
    max-block-size: 40px;
  }
  @keyframes pulse {
    to {
      box-shadow: 0 0 0 7px transparent;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dot {
      animation: none;
    }
  }
</style>
