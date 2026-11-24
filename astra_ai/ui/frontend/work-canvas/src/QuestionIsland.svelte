<script module lang="ts">
  export type IslandPhase =
    | "idle" | "working" | "thinking" | "searching" | "reading" | "analyzing" | "writing"
    | "question" | "listening" | "speaking" | "sending" | "received" | "stopped"
    | "queued" | "planning" | "gathering" | "reading-repo" | "reading-accounts"
    | "verifying" | "filling-gaps" | "mapping" | "testing" | "checking-draft" | "citations"
    | "creating-image" | "finding-images" | "composing" | "publishing"
    | "waiting-capacity" | "waiting" | "awaiting-approval" | "complete" | "partial" | "failed";

  export interface IslandQuestion {
    /** Stable per run and question. Do not use an option index or the question text. */
    id: string;
    prompt: string;
    options?: readonly string[];
  }

  const activity: Record<IslandPhase, { label: string; shape?: string }> = {
    idle: { label: "" },
    working: { label: "Working", shape: "working" },
    thinking: { label: "Thinking", shape: "pixels" },
    searching: { label: "Searching", shape: "pixels" },
    reading: { label: "Reading sources", shape: "pixels" },
    analyzing: { label: "Analyzing", shape: "pixels" },
    writing: { label: "Writing", shape: "writing" },
    question: { label: "Waiting for you" },
    listening: { label: "Listening" },
    speaking: { label: "Speaking" },
    sending: { label: "Sending answer", shape: "pixels" },
    received: { label: "Answer received", shape: "received" },
    stopped: { label: "Stopped", shape: "stopped" },
    "queued": { label: "Queued", shape: "queued" },
    "planning": { label: "Planning", shape: "planning" },
    "gathering": { label: "Gathering sources", shape: "gathering" },
    "reading-repo": { label: "Reading project files", shape: "reading-repo" },
    "reading-accounts": { label: "Reading connected accounts", shape: "reading-accounts" },
    "verifying": { label: "Checking claims", shape: "verifying" },
    "filling-gaps": { label: "Filling evidence gaps", shape: "filling-gaps" },
    "mapping": { label: "Building knowledge map", shape: "mapping" },
    "testing": { label: "Running sandboxed tests", shape: "testing" },
    "checking-draft": { label: "Testing proposed changes", shape: "checking-draft" },
    "citations": { label: "Fixing citations", shape: "citations" },
    "creating-image": { label: "Creating an image", shape: "creating-image" },
    "finding-images": { label: "Finding report images", shape: "finding-images" },
    "composing": { label: "Creating result cards", shape: "composing" },
    "publishing": { label: "Publishing result", shape: "publishing" },
    "waiting-capacity": { label: "Waiting for capacity", shape: "waiting-capacity" },
    "waiting": { label: "Waiting to continue", shape: "waiting" },
    "awaiting-approval": { label: "Waiting for approval", shape: "awaiting-approval" },
    "complete": { label: "Complete", shape: "complete" },
    "partial": { label: "Partial result", shape: "partial" },
    "failed": { label: "Couldn’t finish", shape: "failed" },
  };

  /** The same thin top contour as the local preview, measured in host CSS pixels. */
  function contour(width: number, panelWidth: number, depth: number, fullEdge: boolean) {
    const left = (width - panelWidth) / 2;
    const right = left + panelWidth;
    const shoulder = Math.min(17, Math.max(0, left - 12), depth / 2);
    const bottom = depth - .5;
    const radius = Math.min(17, panelWidth / 2, bottom / 2);
    const start = left - shoulder;
    const end = right + shoulder;
    const local = [
      `M ${start} .5`,
      `C ${left} .5 ${left} ${shoulder} ${left} ${shoulder + .5}`,
      `V ${bottom - radius} Q ${left} ${bottom} ${left + radius} ${bottom}`,
      `H ${right - radius} Q ${right} ${bottom} ${right} ${bottom - radius}`,
      `V ${shoulder + .5}`,
      `C ${right} ${shoulder} ${right} .5 ${end} .5`,
    ];
    return {
      fill: local.join(" ") + " Z",
      stroke: fullEdge
        ? [`M 12 .5 H ${start}`, ...local.slice(1), `H ${width - 12}`].join(" ")
        : local.join(" "),
    };
  }
</script>

<script lang="ts">
  import { tick, type Snippet } from "svelte";

  interface Props {
    phase: IslandPhase;
    question?: IslandQuestion | null;
    label?: string;
    detail?: string;
    disabled?: boolean;
    answerFailed?: boolean;
    /** Set false when the workspace already draws the straight portions of the rim. */
    fullEdge?: boolean;
    onAnswer?: (text: string, questionId: string) => void | Promise<void>;
    onMicrophone?: (questionId: string) => void;
    onStopVoice?: (mode: "listening" | "speaking") => void;
    onQuestionToggle?: (expanded: boolean, questionId: string) => void;
    questionExtras?: Snippet<[IslandQuestion, boolean]>;
    activityActions?: Snippet;
  }

  let {
    phase, question = null, label, detail, disabled = false, answerFailed = false, fullEdge = true,
    onAnswer, onMicrophone, onStopVoice, onQuestionToggle, questionExtras, activityActions,
  }: Props = $props();

  const id = $props.id();
  const bars = Array.from({ length: 13 }, (_, index) => index);
  let signalLevels = $state(bars.map(() => 0.12));
  let rail: HTMLElement | undefined = $state();
  let head: HTMLButtonElement | undefined = $state();
  let answerInput: HTMLInputElement | undefined = $state();
  let width = $state(0);
  let panelWidth = $state(0);
  let depth = $state(0);
  let draft = $state("");
  let folded = $state(false);
  let pendingId: string | null = $state(null);
  let failedId: string | null = $state(null);
  let documentHidden = $state(false);
  let submissionToken = 0;

  const questionId = $derived(question?.id ?? null);
  // Hold a phase briefly through transient idle gaps so the island does not flash.
  let displayPhase = $state<IslandPhase>("idle");
  $effect(() => {
    const next = phase;
    if (next !== "idle") { displayPhase = next; return; }
    if (displayPhase === "idle") return;
    const timer = window.setTimeout(() => { displayPhase = "idle"; }, 180);
    return () => window.clearTimeout(timer);
  });
  const activePhase = $derived(phase === "idle" ? displayPhase : phase);

  const visibleQuestion = $derived(
    activePhase !== "idle" && activePhase !== "received" && activePhase !== "speaking" ? question : null,
  );
  const busy = $derived(phase === "sending" || (pendingId !== null && pendingId === visibleQuestion?.id));
  const failed = $derived(answerFailed || (failedId !== null && failedId === visibleQuestion?.id));
  const shownPhase = $derived(busy ? "sending" : visibleQuestion && activePhase !== "listening" ? "question" : activePhase);
  const text = $derived(
    busy ? activity.sending.label : visibleQuestion && activePhase !== "listening" && failed ? "Try again"
      : label?.trim() || activity[shownPhase].label,
  );
  const expanded = $derived(!!visibleQuestion && !folded);
  const isVoice = $derived(shownPhase === "listening" || shownPhase === "speaking");
  // Reuse AEGIS mic and playback analysers; this creates no extra audio stream or recording.
  $effect(() => {
    const voicePhase = shownPhase;
    if (!isVoice || documentHidden) {
      signalLevels = bars.map(() => 0.12);
      return;
    }
    let frame = 0;
    let samples = new Float32Array(512);
    let smooth = bars.map(() => 0.12);
    const draw = () => {
      const bridge = (window as Window & { __aegisVoice?: { mic?: AnalyserNode | null; ai?: AnalyserNode } }).__aegisVoice;
      const analyser = voicePhase === "listening" ? bridge?.mic : bridge?.ai;
      if (analyser) {
        const length = Math.min(2048, analyser.fftSize);
        if (samples.length !== length) samples = new Float32Array(length);
        analyser.getFloatTimeDomainData(samples);
        const targets = bars.map((_, index) => {
          const start = Math.floor(index * samples.length / bars.length);
          const end = Math.max(start + 1, Math.floor((index + 1) * samples.length / bars.length));
          let energy = 0;
          for (let sample = start; sample < end; sample += 1) energy += samples[sample]! * samples[sample]!;
          const rms = Math.sqrt(energy / (end - start));
          return Math.max(0.1, Math.min(1, 0.1 + Math.max(0, rms - 0.004) * 17));
        });
        smooth = targets.map((target, index) => {
          const previous = smooth[index] ?? 0.12;
          return previous + (target - previous) * (target > previous ? 0.38 : 0.2);
        });
        signalLevels = smooth;
      } else {
        smooth = smooth.map(level => level + (0.1 - level) * 0.2);
        signalLevels = smooth;
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { if (frame) cancelAnimationFrame(frame); };
  });
  const shape = $derived(
    width > 0 && panelWidth > 0 && depth > 0 ? contour(width, panelWidth, depth, fullEdge) : null,
  );

  function resetQuestion(_id: string | null) {
    submissionToken += 1;
    draft = "";
    folded = false;
    pendingId = null;
    failedId = null;
  }
  $effect(() => {
    resetQuestion(questionId);
    if (!questionId) return;
    const frame = requestAnimationFrame(() => {
      const active = document.activeElement;
      if (!active || active === document.body || active.closest(".canvas-stage, .svelte-flow")) head?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  });

  $effect(() => {
    const read = () => { documentHidden = document.hidden; };
    read();
    document.addEventListener("visibilitychange", read);
    return () => document.removeEventListener("visibilitychange", read);
  });

  function toggleQuestion() {
    if (!visibleQuestion || busy) return;
    folded = !folded;
    onQuestionToggle?.(!folded, visibleQuestion.id);
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== "Escape" || !(event.target instanceof Node) || !rail?.contains(event.target)) return;
    if (visibleQuestion && expanded && !busy) {
      event.preventDefault();
      event.stopPropagation();
      head?.focus();
      toggleQuestion();
    } else if (!visibleQuestion && isVoice && onStopVoice) {
      event.preventDefault();
      onStopVoice(shownPhase === "speaking" ? "speaking" : "listening");
    }
  }

  async function submit(raw: string) {
    const value = raw.trim();
    const key = visibleQuestion?.id;
    if (!value || !key || busy || disabled || !onAnswer) return;
    const token = ++submissionToken;
    const trigger = document.activeElement;
    rail?.focus({ preventScroll: true });
    pendingId = key;
    failedId = null;
    try {
      // The host owns success. It advances phase or supplies a new question once its API accepts.
      await onAnswer(value, key);
    } catch {
      if (token !== submissionToken || pendingId !== key || questionId !== key) return;
      pendingId = null;
      failedId = key;
      await tick();
      if (token === submissionToken && questionId === key && document.activeElement === rail) {
        if (trigger instanceof HTMLElement && rail?.contains(trigger)) trigger.focus({ preventScroll: true });
        else answerInput?.focus({ preventScroll: true });
      }
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#snippet wave()}
  <span class="voice-signal" aria-hidden="true">
    {#each bars as bar (bar)}<i style:--signal-level={signalLevels[bar]}></i>{/each}
  </span>
{/snippet}

{#if activePhase !== "idle"}
  <div class="island-rail" class:document-hidden={documentHidden} class:ready={!!shape}
    class:compact={width > 0 && width < 900} class:settling={phase === "idle"} bind:this={rail} bind:clientWidth={width}
    role="region" aria-label="AEGIS island" tabindex="-1">
    {#if shape}
      <svg class="contour" aria-hidden="true" viewBox={`0 0 ${width} ${depth + 1}`} height={depth + 1}>
        <path class="contour-fill" d={shape.fill} />
        <path class="contour-edge" d={shape.stroke} />
      </svg>
    {/if}
    <div class="notch" data-phase={shownPhase} class:has-question={!!visibleQuestion}
      class:has-detail={!!detail && !visibleQuestion} class:open={expanded}
      bind:clientWidth={panelWidth} bind:clientHeight={depth}>
      <div class="island">
        <div class="island-top">
          {#if visibleQuestion && !busy}
            <button class="question-head" type="button" bind:this={head} aria-expanded={expanded}
              aria-controls={`${id}-body`} onclick={toggleQuestion}>
              <span class="robot" aria-hidden="true"></span>
              {@render wave()}
              <span class="question-head-label">{text}</span>
              <span class="question-toggle" aria-hidden="true"><span class="chevron"></span></span>
            </button>
          {:else}
            {@const shape = activity[shownPhase].shape}
            <div class="activity">
              {#if shape}
                <svg class="glyph" viewBox={shape === "pixels" ? "0 0 15 15" : "0 0 24 24"} aria-hidden="true" data-shape={shape}>
                  {#if shape === "pixels"}
                    <rect class="glyph-pixel" x="1" y="1" width="3" height="3" rx="1"/>
                    <rect class="glyph-pixel" x="6" y="1" width="3" height="3" rx="1"/>
                    <rect class="glyph-pixel" x="11" y="1" width="3" height="3" rx="1"/>
                    <rect class="glyph-pixel" x="1" y="6" width="3" height="3" rx="1"/>
                    <rect class="glyph-pixel" x="6" y="6" width="3" height="3" rx="1"/>
                    <rect class="glyph-pixel" x="11" y="6" width="3" height="3" rx="1"/>
                    <rect class="glyph-pixel" x="1" y="11" width="3" height="3" rx="1"/>
                    <rect class="glyph-pixel" x="6" y="11" width="3" height="3" rx="1"/>
                    <rect class="glyph-pixel" x="11" y="11" width="3" height="3" rx="1"/>
                  {:else if shape === "working"}
                    <g class="pieces" data-motion="lift">
                      <rect x="2" y="8" width="3.4" height="8" rx="1.25"/>
                      <rect x="7.5" y="4" width="3.4" height="16" rx="1.25"/>
                      <rect x="13" y="6" width="3.4" height="12" rx="1.25"/>
                      <rect x="18.5" y="9" width="3.4" height="6" rx="1.25"/>
                    </g>
                  {:else if shape === "writing"}
                    <g class="pieces" data-motion="extend">
                      <rect x="3" y="4.5" width="15" height="3" rx="1"/>
                      <rect x="3" y="10.5" width="18" height="3" rx="1"/>
                      <rect x="3" y="16.5" width="11" height="3" rx="1"/>
                    </g>
                  {:else if shape === "received"}
                    <g class="pieces" data-motion="settle">
                      <polygon points="5,9.4 7.6,12 5,14.6 2.4,12"/>
                      <polygon points="12,8.5 15.5,12 12,15.5 8.5,12"/>
                      <polygon points="19,9.4 21.6,12 19,14.6 16.4,12"/>
                    </g>
                  {:else if shape === "stopped"}
                    <g class="pieces" data-motion="brake">
                      <rect x="3" y="10.5" width="13" height="3" rx="1.5" class="piece-quiet"/>
                      <rect x="18" y="9.6" width="4.8" height="4.8" rx=".7"/>
                    </g>
                  {:else if shape === "queued"}
                    <g class="pieces" data-motion="queue">
                      <rect x="2.5" y="10" width="4" height="4" rx=".7"/>
                      <rect x="10" y="10" width="4" height="4" rx=".7" class="piece-quiet"/>
                      <rect x="17.5" y="10" width="4" height="4" rx=".7" class="piece-quiet"/>
                    </g>
                  {:else if shape === "planning"}
                    <g class="pieces" data-motion="grow">
                      <polygon points="12,1.5999999999999996 15.2,4.8 12,8 8.8,4.8"/>
                      <polygon points="6,9.1 9.4,12.5 6,15.9 2.6,12.5"/>
                      <polygon points="18,9.1 21.4,12.5 18,15.9 14.6,12.5"/>
                      <polygon points="12,17 14.5,19.5 12,22 9.5,19.5"/>
                    </g>
                  {:else if shape === "gathering"}
                    <g class="pieces" data-motion="gather">
                      <circle cx="4" cy="6" r="2"/>
                      <circle cx="19" cy="5" r="2.2"/>
                      <circle cx="12" cy="11.5" r="2.8"/>
                      <circle cx="4.5" cy="17.5" r="2.4"/>
                      <circle cx="18.5" cy="17" r="2.55"/>
                      <circle cx="11" cy="21" r="1.5"/>
                    </g>
                  {:else if shape === "reading-repo"}
                    <g class="pieces" data-motion="sweep">
                      <rect x="3" y="3" width="11" height="4" rx="1"/>
                      <rect x="16" y="3" width="4" height="4" rx=".7"/>
                      <rect x="3" y="10" width="4" height="4" rx=".7"/>
                      <rect x="9" y="10" width="11" height="4" rx="1"/>
                      <rect x="3" y="17" width="9" height="4" rx="1"/>
                      <rect x="14" y="17" width="6" height="4" rx="1"/>
                    </g>
                  {:else if shape === "reading-accounts"}
                    <g class="pieces" data-motion="packets">
                      <rect x="2" y="6" width="9" height="3.5" rx="1"/>
                      <rect x="15" y="6" width="4" height="3.5" rx="1"/>
                      <rect x="5" y="14.5" width="4" height="3.5" rx="1"/>
                      <rect x="13" y="14.5" width="9" height="3.5" rx="1"/>
                    </g>
                  {:else if shape === "verifying"}
                    <g class="pieces" data-motion="sweep">
                      <rect x="3" y="15" width="5" height="3.5" rx="1.75"/>
                      <rect x="9" y="10" width="6" height="3.5" rx="1.75"/>
                      <rect x="16" y="5" width="5" height="3.5" rx="1.75"/>
                    </g>
                  {:else if shape === "filling-gaps"}
                    <g class="pieces" data-motion="focus">
                      <rect x="3" y="3" width="4.5" height="4.5" rx=".7"/>
                      <rect x="16.5" y="3" width="4.5" height="4.5" rx=".7"/>
                      <rect x="16.5" y="16.5" width="4.5" height="4.5" rx=".7"/>
                      <rect x="3" y="16.5" width="4.5" height="4.5" rx=".7"/>
                      <polygon points="12,8.2 15.8,12 12,15.8 8.2,12"/>
                    </g>
                  {:else if shape === "mapping"}
                    <g class="pieces" data-motion="grow">
                      <polygon points="1.4,7 3.2,3.94 6.8,3.94 8.6,7 6.8,10.06 3.2,10.06"/>
                      <polygon points="10.5,4.5 12,1.9500000000000002 15,1.9500000000000002 16.5,4.5 15,7.05 12,7.05"/>
                      <polygon points="15.7,11.5 17.35,8.695 20.65,8.695 22.3,11.5 20.65,14.305 17.35,14.305"/>
                      <polygon points="8.1,13 10.05,9.685 13.95,9.685 15.9,13 13.95,16.315 10.05,16.315"/>
                      <polygon points="2.85,17 4.175,14.7475 6.825,14.7475 8.15,17 6.825,19.2525 4.175,19.2525"/>
                      <polygon points="13,20 14.25,17.875 16.75,17.875 18,20 16.75,22.125 14.25,22.125"/>
                    </g>
                  {:else if shape === "testing"}
                    <g class="pieces" data-motion="lift">
                      <polygon points="2,16 5.7,8.2 9.4,16"/>
                      <polygon points="8.3,7.5 15.7,7.5 12,15.3"/>
                      <polygon points="14.6,16 18.3,8.2 22,16"/>
                    </g>
                  {:else if shape === "checking-draft"}
                    <g class="pieces" data-motion="sweep">
                      <rect x="4" y="3" width="5.5" height="8" rx="1"/>
                      <rect x="4" y="13" width="5.5" height="8" rx="1"/>
                      <circle cx="15" cy="6" r="2.7"/>
                      <circle cx="19.5" cy="12" r="1.9"/>
                      <circle cx="15" cy="18" r="2.7"/>
                    </g>
                  {:else if shape === "citations"}
                    <g class="pieces" data-motion="gather">
                      <polygon points="7,4 11,8 7,12 3,8"/>
                      <polygon points="17,12 21,16 17,20 13,16"/>
                      <circle cx="12" cy="12" r="1.55"/>
                    </g>
                  {:else if shape === "creating-image"}
                    <g class="pieces" data-motion="focus">
                      <rect x="3" y="3" width="7" height="9" rx="1.4"/>
                      <rect x="12" y="3" width="9" height="5" rx="1.2"/>
                      <rect x="12" y="10" width="9" height="11" rx="1.4"/>
                      <rect x="3" y="14" width="7" height="7" rx="1.2"/>
                    </g>
                  {:else if shape === "finding-images"}
                    <g class="pieces" data-motion="sweep">
                      <polygon points="2,15.5 10.5,5.5 14,5.5 5.5,15.5"/>
                      <polygon points="6,19 14.5,9 18,9 9.5,19"/>
                      <polygon points="13,19 20,10.7 23,10.7 16,19"/>
                    </g>
                  {:else if shape === "composing"}
                    <g class="pieces" data-motion="gather">
                      <rect x="3" y="10" width="4.5" height="4.5" rx=".7"/>
                      <polygon points="11.8,2.2 15.1,7.5 8.5,7.5"/>
                      <circle cx="19" cy="11.7" r="2.8"/>
                      <polygon points="12.2,14.5 15.899999999999999,18.2 12.2,21.9 8.5,18.2"/>
                    </g>
                  {:else if shape === "publishing"}
                    <g class="pieces" data-motion="rise">
                      <rect x="3" y="12" width="4" height="8" rx="1"/>
                      <rect x="10" y="8" width="4" height="12" rx="1"/>
                      <rect x="17" y="4" width="4" height="16" rx="1"/>
                    </g>
                  {:else if shape === "waiting-capacity"}
                    <g class="pieces" data-motion="capacity">
                      <rect x="7" y="4" width="10" height="3" rx="1.5" class="piece-quiet"/>
                      <rect x="4" y="10" width="16" height="3" rx="1.5" class="piece-quiet"/>
                      <rect x="7" y="16" width="10" height="3" rx="1.5"/>
                    </g>
                  {:else if shape === "waiting"}
                    <g class="pieces" data-motion="wait">
                      <circle cx="4.9" cy="12" r="1.7" class="piece-quiet"/>
                      <circle cx="12" cy="12" r="2"/>
                      <circle cx="19.1" cy="12" r="1.7" class="piece-quiet"/>
                    </g>
                  {:else if shape === "awaiting-approval"}
                    <g class="pieces" data-motion="approval">
                      <circle cx="4.5" cy="12" r="1.45" class="piece-quiet"/>
                      <polygon points="12,7.1 16.9,12 12,16.9 7.1,12"/>
                      <circle cx="19.5" cy="12" r="1.45" class="piece-quiet"/>
                    </g>
                  {:else if shape === "complete"}
                    <g class="pieces" data-motion="settle">
                      <rect x="5" y="5" width="6" height="6" rx=".7"/>
                      <rect x="13" y="5" width="6" height="6" rx=".7"/>
                      <rect x="5" y="13" width="6" height="6" rx=".7"/>
                      <rect x="13" y="13" width="6" height="6" rx=".7"/>
                    </g>
                  {:else if shape === "partial"}
                    <g class="pieces" data-motion="resolve">
                      <rect x="5" y="5" width="6" height="6" rx=".7"/>
                      <rect x="13" y="5" width="6" height="6" rx=".7" class="piece-outline"/>
                      <rect x="5" y="13" width="6" height="6" rx=".7"/>
                      <rect x="13" y="13" width="6" height="6" rx=".7" class="piece-outline"/>
                    </g>
                  {:else if shape === "failed"}
                    <g class="pieces" data-motion="fade">
                      <polygon points="2.5,8.5 7.6,8.5 5,13.5" class="piece-quiet"/>
                      <polygon points="8.6,12.5 12.2,5.7 15.6,12.5"/>
                      <polygon points="16.1,14 21.5,14 18.8,19" class="piece-quiet"/>
                    </g>
                  {/if}
                </svg>
              {/if}
              {@render wave()}
              <div class="activity-copy">
                {#if detail && !busy}<span class="previous" title={detail}>{detail}</span>{/if}
                {#key text}<span class="status" title={text}>{text}</span>{/key}
              </div>
              {#if isVoice && onStopVoice}
                <button class="voice-stop" type="button"
                  aria-label={shownPhase === "speaking" ? "Stop speaking" : "Finish dictation"}
                  onclick={() => onStopVoice?.(shownPhase === "speaking" ? "speaking" : "listening")}><span aria-hidden="true"></span></button>
              {/if}
              {#if activityActions}{@render activityActions()}{/if}
            </div>
          {/if}
          <span class="sr-only" role="status">{failed && visibleQuestion && !busy ? "Try sending your answer again." : text}</span>
        </div>

        <div class="question-reveal" id={`${id}-body`} inert={!expanded} aria-hidden={!expanded}>
          <div class="question-clip">
            {#if visibleQuestion}
              <div class="question-content">
                <p class="question-kind"><span aria-hidden="true"></span>Question</p>
                <h2>{visibleQuestion.prompt}</h2>
                {#if visibleQuestion.options?.length}
                  <div class="options" role="group" aria-label="Suggested answers">
                    {#each visibleQuestion.options as option}
                      <button class="option" type="button" disabled={disabled || busy || !onAnswer}
                        onclick={() => submit(option)}>{option}</button>
                    {/each}
                  </div>
                {/if}
                <form class="answer-form" aria-busy={busy}
                  onsubmit={(event) => { event.preventDefault(); void submit(draft); }}>
                  <div class="answer-field">
                    <label class="sr-only" for={`${id}-input`}>Your answer</label>
                    <input class="answer-input" id={`${id}-input`} bind:this={answerInput} bind:value={draft}
                      placeholder="Or say it in your words" autocomplete="off" disabled={disabled || busy || !onAnswer} />
                    {#if onMicrophone}
                      <button class="icon-button" type="button" disabled={disabled || busy}
                        aria-label={activePhase === "listening" ? "Finish voice answer" : "Answer by voice"}
                        aria-pressed={activePhase === "listening"} onclick={() => onMicrophone?.(visibleQuestion!.id)}>
                        <span class="microphone" aria-hidden="true"></span>
                      </button>
                    {/if}
                  </div>
                  <button class="icon-button send" type="submit" disabled={disabled || busy || !draft.trim() || !onAnswer} aria-label="Send answer">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 19V5m-5 5 5-5 5 5"/>
                    </svg>
                  </button>
                </form>
                {#if questionExtras}{@render questionExtras(visibleQuestion, disabled || busy)}{/if}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
.notch {
  --notch-width: 138px;
  --mark: #b6a9ff;
  position: absolute;
  z-index: 5;
  top: 0;
  left: 50%;
  width: min(var(--notch-width), calc(100% - 42px));
  translate: -50% 0;
  transition: width var(--morph) var(--ease), min-width var(--morph) var(--ease);
}
.island {
  position: relative;
  overflow: hidden;
  border-radius: 0 0 17px 17px;
}
.island-top { display: grid; min-height: 36px; }

.notch.has-question .island-top { height: 44px; }
.activity {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 7px 12px 8px;
}
.activity-copy { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 1px; line-height: 17px; }
.status, .previous { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status { white-space: normal; overflow-wrap: anywhere; color: var(--color-text, var(--ink)); font-size: 13px; font-weight: 620; letter-spacing: -.014em; text-shadow: 0 1px 12px color-mix(in srgb, var(--mark) 16%, transparent); }
.previous { color: var(--color-muted, #9698a7); font-size: 11px; font-weight: 450; }
.notch[data-phase="searching"] { --notch-width: 152px; --mark: #78c6a9; }
.notch[data-phase="reading"] { --notch-width: 210px; --mark: #e8bd85; }
.notch[data-phase="analyzing"] { --notch-width: 196px; --mark: #87b9f9; }
.notch[data-phase="sending"] { --notch-width: 171px; --mark: #a394ee; }
.notch[data-phase="received"] { --notch-width: 158px; --mark: #82c4a8; }
.notch[data-phase="question"], .notch[data-phase="listening"], .notch.has-question { --notch-width: 204px; }
.notch.open { --notch-width: min(560px, calc(100% - 42px)); }

.glyph {
  display: block;
  width: 17px;
  height: 17px;
  flex: none;
  --activity-ink: light-dark(color-mix(in srgb, var(--mark) 50%, var(--ink)), var(--mark));
  fill: var(--activity-ink);
}
.glyph[data-shape="pixels"] { width: 15px; height: 15px; }
.glyph-pixel { opacity: .19; }
.glyph-pixel:nth-child(2n) { opacity: .72; }
.glyph-pixel:nth-child(5) { opacity: 1; }

[data-phase="thinking"] .glyph { filter: drop-shadow(0 0 6px color-mix(in srgb, var(--mark) 52%, transparent)); }
[data-phase="thinking"] .glyph-pixel { animation: pixel-breathe 1.6s ease-in-out infinite alternate; }
[data-phase="thinking"] .glyph-pixel:nth-child(even) { animation-delay: -.5s; }
[data-phase="thinking"] .glyph-pixel:nth-child(5) { animation-delay: -.95s; }
[data-phase="searching"] .glyph-pixel { animation: pixel-pulse 1.3s linear infinite; }
[data-phase="searching"] .glyph-pixel:nth-child(3n+2) { animation-delay: -.88s; }
[data-phase="searching"] .glyph-pixel:nth-child(3n) { animation-delay: -.45s; }
[data-phase="reading"] .glyph[data-shape="pixels"] { transform: rotate(-12deg); }
[data-phase="reading"] .glyph-pixel { animation: pixel-pulse 1.45s linear infinite; }
[data-phase="reading"] .glyph-pixel:is(:nth-child(2), :nth-child(4)) { animation-delay: -.29s; }
[data-phase="reading"] .glyph-pixel:is(:nth-child(3), :nth-child(5), :nth-child(7)) { animation-delay: -.58s; }
[data-phase="reading"] .glyph-pixel:is(:nth-child(6), :nth-child(8)) { animation-delay: -.87s; }
[data-phase="reading"] .glyph-pixel:nth-child(9) { animation-delay: -1.16s; }
[data-phase="analyzing"] .glyph[data-shape="pixels"] { animation: pixel-orbit 2s steps(8) infinite; }
[data-phase="analyzing"] .glyph-pixel:is(:nth-child(1), :nth-child(3)) { opacity: .8; }
[data-phase="analyzing"] .glyph-pixel:nth-child(5) { opacity: 0; }
[data-phase="sending"] .glyph-pixel { animation: pixel-pulse .8s linear infinite; }
[data-phase="sending"] .glyph-pixel:nth-child(3n+2) { animation-delay: .12s; }
[data-phase="sending"] .glyph-pixel:nth-child(3n) { animation-delay: .24s; }

@keyframes pixel-breathe { from { opacity: .18; scale: .82; } to { opacity: .95; scale: 1; } }
@keyframes pixel-pulse { 0%, 100% { opacity: .21; } 22% { opacity: 1; } 62% { opacity: .34; } }
@keyframes pixel-orbit { to { rotate: 1turn; } }

.glyph-pixel, .pieces > * { transform-box: fill-box; transform-origin: center; }
.pieces .piece-quiet { opacity: .38; }
.pieces .piece-outline { fill: none; stroke: var(--activity-ink); stroke-width: 1.2; opacity: .72; }
.pieces > :nth-child(2) { --piece-delay: -.2s; }
.pieces > :nth-child(3) { --piece-delay: -.4s; }
.pieces > :nth-child(4) { --piece-delay: -.6s; }
.pieces > :nth-child(5) { --piece-delay: -.8s; }
.pieces > :nth-child(6) { --piece-delay: -1s; }
.pieces[data-motion="lift"] > * { animation: piece-lift 1.45s ease-in-out var(--piece-delay, 0s) infinite; }
.pieces[data-motion="extend"] > * { animation: piece-extend 1.8s ease-in-out var(--piece-delay, 0s) infinite; }
.pieces[data-motion="grow"] > * { animation: piece-grow 1.65s ease-in-out var(--piece-delay, 0s) infinite; }
.pieces[data-motion="sweep"] > * { animation: piece-sweep 1.65s ease-in-out var(--piece-delay, 0s) infinite; }
.pieces[data-motion="gather"] > * {
  transform-origin: center;
  transform-box: view-box;
  animation: piece-gather 2.1s ease-in-out var(--piece-delay, 0s) infinite;
}
.pieces[data-motion="focus"] > * { animation: piece-focus 1.9s ease-in-out var(--piece-delay, 0s) infinite; }
.pieces[data-motion="rise"] > * { animation: piece-rise 1.65s ease-in-out var(--piece-delay, 0s) infinite; transform-origin: center bottom; }
.pieces[data-motion="settle"] > * { animation: piece-settle .5s ease-out both; }

@keyframes piece-lift { 0%, 100% { translate: 0 1px; opacity: .45; } 50% { translate: 0 -1.7px; opacity: 1; } }
@keyframes piece-extend { 0%, 100% { scale: .57 1; opacity: .45; } 50% { scale: 1; opacity: 1; } }
@keyframes piece-grow { 0%, 100% { scale: .72; opacity: .46; } 50% { scale: 1.05; opacity: 1; } }
@keyframes piece-sweep { 0%, 100% { opacity: .32; } 45% { opacity: 1; } }
@keyframes piece-gather { 0%, 100% { scale: .86; opacity: .54; } 50% { scale: 1.04; opacity: 1; } }
@keyframes piece-focus { 0%, 100% { scale: .85; opacity: .55; } 50% { scale: 1; opacity: 1; } }
@keyframes piece-rise { 0%, 100% { scale: 1 .54; opacity: .4; } 55% { scale: 1; opacity: 1; } }
@keyframes piece-settle { from { scale: .67; opacity: .4; } to { scale: 1; opacity: 1; } }

.pieces[data-motion="queue"] > * { animation: piece-queue 2s ease-in-out var(--piece-delay, 0s) infinite; }
.pieces[data-motion="capacity"] > * { animation: piece-capacity 2.7s ease-in-out var(--piece-delay, 0s) infinite; }
.pieces[data-motion="wait"] > * { animation: piece-wait 2.1s ease-in-out var(--piece-delay, 0s) infinite; }
.pieces[data-motion="approval"] > :nth-child(2) { animation: piece-approval 2.25s ease-in-out infinite; }
.pieces[data-motion="packets"] > * { animation: piece-packet 1.9s ease-in-out var(--piece-delay, 0s) infinite; }
.pieces[data-motion="packets"] > :nth-child(n+3) { animation-direction: reverse; }
.pieces[data-motion="brake"] > * { animation: piece-brake .95s cubic-bezier(.2,.75,.25,1) both; }
.pieces[data-motion="resolve"] > * { animation: piece-resolve .8s ease-out both; }
.pieces[data-motion="fade"] > * { animation: piece-fade .9s ease-out both; }

@keyframes piece-queue {
  0%, 70%, 100% { opacity: .4; }
  26% { opacity: 1; translate: 0 -1.7px; }
}
@keyframes piece-capacity {
  0%, 100% { opacity: .35; scale: .8 1; }
  45% { opacity: 1; scale: 1 1; }
}
@keyframes piece-wait {
  0%, 75%, 100% { opacity: .4; scale: .85; }
  30% { opacity: 1; scale: 1.24; }
}
@keyframes piece-approval {
  0%, 100% { scale: .83; opacity: .66; }
  45% { scale: 1.08; opacity: 1; }
}
@keyframes piece-packet {
  0%, 100% { opacity: .4; translate: -1.6px 0; }
  55% { opacity: 1; translate: 1.6px 0; }
}
@keyframes piece-brake { from { translate: -5px 0; scale: .55 1; } to { translate: 0 0; scale: 1; } }
@keyframes piece-resolve { from { scale: .63; } to { scale: 1; } }
@keyframes piece-fade { from { translate: 0 -3px; scale: .75; } to { translate: 0 0; scale: 1; } }

.question-head {
  position: relative;
  min-height: 44px;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 16px;
  border: 0;
  background: transparent;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
}
.question-head { color: var(--ink); }
.question-head:hover, .question-head:focus-visible { color: var(--ink); }
.question-head:focus-visible { outline: none; }
.question-head:focus-visible .question-toggle { outline: 1px solid var(--accent); outline-offset: 0; }
.question-head-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.question-toggle {
  flex: none;
  margin-inline-start: auto;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--island-muted);
  transition: background-color 130ms ease, color 130ms ease;
}
.question-head:hover .question-toggle, .question-head:focus-visible .question-toggle { background: var(--island-row); color: var(--ink); }
.robot {
  position: relative;
  flex: none;
  width: 21px;
  height: 17px;
  border-radius: 7px;
  background: #292640;
  border: 1px solid #625887;
}
.robot::before, .robot::after {
  content: "";
  position: absolute;
  top: 5px;
  width: 3px;
  height: 4px;
  border-radius: 1.5px;
  background: #d2c9ff;
}
.robot::before { left: 5px; }
.robot::after { right: 5px; }
.chevron {
  width: 7px;
  height: 7px;
  border: solid currentColor;
  border-width: 0 1px 1px 0;
  rotate: 45deg;
  translate: 0 -1px;
  transition: rotate var(--morph) var(--ease);
}
.open .chevron { rotate: 225deg; translate: 0 1px; }

.question-reveal {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows var(--morph) var(--ease), opacity 130ms ease;
}
.open .question-reveal { grid-template-rows: 1fr; opacity: 1; }
.question-clip { min-height: 0; overflow: hidden; }
.question-content {
  max-height: min(53svh, 350px);
  overflow: auto;
  padding: 1px 22px 20px;
}
.question-kind {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 1px 0 7px;
  color: var(--island-muted);
  font-size: 11px;
}
.question-kind span {
  width: 12px;
  height: 12px;
  display: inline-grid;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 50%;
}
.question-kind span::after { content: ""; width: 4px; height: 4px; border-radius: 50%; background: currentColor; }
.question-content h2 { font-size: 15px; line-height: 1.4; font-weight: 640; margin: 0 0 10px; letter-spacing: -.012em; }
.options { display: grid; gap: 5px; }
.option {
  min-height: 37px;
  border: 0;
  background: var(--island-row);
  border-radius: 11px;
  padding: 7px 12px;
  text-align: left;
  font-size: 13px;
  line-height: 1.3;
}
.option:hover:not(:disabled) { background: var(--island-hover); }
.option:focus-visible { outline-offset: -2px; }
.option:disabled { opacity: .58; }
.answer-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  margin-top: 12px;
}
.answer-field {
  display: flex;
  min-width: 0;
  align-items: center;
  border-radius: 999px;
  padding: 0 2px 0 12px;
  background: var(--island-field);
  box-shadow: inset 0 0 0 1px transparent;
}
.answer-field:focus-within { box-shadow: inset 0 0 0 1px var(--color-accent, #80759d); }
.answer-input { flex: 1; min-width: 0; min-height: 36px; color: var(--ink); border: 0; background: transparent; padding: 0; font-size: 13px; }
.answer-input:focus { outline: none; }
.answer-input::placeholder { color: var(--color-muted, #a09eaa); }
.icon-button { flex: none; width: 36px; height: 36px; display: grid; place-items: center; border: 0; border-radius: 50%; background: transparent; color: var(--color-muted, #b4b1c1); }
.icon-button:hover:not(:disabled), .icon-button[aria-pressed="true"] { background: color-mix(in srgb, var(--color-accent, #b6a9ff) 18%, var(--color-raised, #3a344b)); color: var(--color-text, #e5ddff); }
.send { background: var(--island-field); color: var(--island-muted); }
.send:not(:disabled) { background: var(--color-accent, #d9d1ff); color: var(--color-on-accent, #1a142d); }
.send:hover:not(:disabled) { background: color-mix(in srgb, var(--color-accent, #d9d1ff) 88%, white); color: var(--color-on-accent, #1a142d); }
.send:disabled svg { opacity: .68; }
.microphone { width: 12px; height: 9px; position: relative; border: solid currentColor; border-width: 0 1px 1px; border-radius: 0 0 6px 6px; }
.microphone::before, .microphone::after { content: ""; position: absolute; left: 50%; translate: -50% 0; }
.microphone::before { width: 4px; height: 8px; border: 1px solid currentColor; border-radius: 3px; top: -5px; }
.microphone::after { width: 1px; height: 4px; background: currentColor; bottom: -5px; }

.voice-signal { display: none; }
:is([data-phase="listening"], [data-phase="speaking"]) .activity .glyph { display: none; }
:is([data-phase="listening"], [data-phase="speaking"]) .activity {
  justify-content: start;
  gap: 9px;
  padding: 0 5px 0 13px;
}
.notch[data-phase="listening"]:not(.has-question) { --notch-width: 204px; }
.notch[data-phase="speaking"] { --notch-width: 204px; }
.notch[data-phase="listening"] { --voice-ink: var(--aegis-voice-user, color-mix(in srgb, var(--color-accent, #b6a9ff) 30%, #78d9b3 70%)); --mark: var(--voice-ink); }
.notch[data-phase="speaking"] { --voice-ink: var(--aegis-voice-ai, var(--color-accent, #ad98ff)); --mark: var(--voice-ink); }
.notch[data-phase="listening"] .question-head .robot { display: none; }
:is([data-phase="listening"], [data-phase="speaking"]) .activity .voice-signal,
[data-phase="listening"] .question-head .voice-signal {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 54px;
  height: 19px;
  flex: none;
  color: var(--voice-ink);
}
.voice-signal i {
  width: 2px;
  height: 15px;
  border-radius: 2px;
  background: currentColor;
  transform: scaleY(var(--signal-level, .12));
  transform-origin: center;
  transition: transform 55ms linear, opacity 55ms linear;
  opacity: calc(.4 + var(--signal-level, .12) * .6);
}
.voice-signal i:nth-child(1) { --base: .22; --voice-delay: 0s; }
.voice-signal i:nth-child(2) { --base: .44; --voice-delay: -0.13s; }
.voice-signal i:nth-child(3) { --base: .68; --voice-delay: -0.26s; }
.voice-signal i:nth-child(4) { --base: .38; --voice-delay: -0.39s; }
.voice-signal i:nth-child(5) { --base: .8; --voice-delay: -0.52s; }
.voice-signal i:nth-child(6) { --base: .54; --voice-delay: -0.65s; }
.voice-signal i:nth-child(7) { --base: .91; --voice-delay: -0.78s; }
.voice-signal i:nth-child(8) { --base: .69; --voice-delay: -0.91s; }
.voice-signal i:nth-child(9) { --base: .93; --voice-delay: -1.04s; }
.voice-signal i:nth-child(10) { --base: .52; --voice-delay: -1.17s; }
.voice-signal i:nth-child(11) { --base: .65; --voice-delay: -1.30s; }
.voice-signal i:nth-child(12) { --base: .39; --voice-delay: -1.43s; }
.voice-signal i:nth-child(13) { --base: .22; --voice-delay: -1.56s; }
[data-phase="listening"] .voice-signal i { animation: none; }
[data-phase="speaking"] .voice-signal i { animation: none; }
@keyframes listen-signal {
  0%, 100% { transform: scaleY(.2); opacity: .52; }
  36% { transform: scaleY(var(--base)); opacity: 1; }
  73% { transform: scaleY(calc(var(--base) * .57)); opacity: .75; }
}
@keyframes speak-signal {
  0%, 17%, 44%, 61%, 83%, 100% { transform: scaleY(.22); opacity: .56; }
  8%, 31%, 53%, 72% { transform: scaleY(var(--base)); opacity: 1; }
  23%, 38%, 65% { transform: scaleY(calc(var(--base) * .59)); opacity: .85; }
}
.voice-stop {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex: none;
  margin-inline-start: auto;
  border-radius: 50%;
  border: 1px solid transparent;
  background: #ffffff0c;
  color: #bcbac8;
}
.voice-stop span { width: 7px; height: 7px; border-radius: 2px; background: currentColor; }
.voice-stop:hover, .voice-stop:focus-visible { background: #ffffff15; border-color: #ffffff18; color: var(--ink); }
.voice-stop:focus-visible { outline-offset: 1px; }

.island-rail {
  --ink: var(--aegis-island-ink, var(--color-text, #edeff4));
  --island-surface: var(--aegis-island-fill, var(--color-surface, #111116));
  --island-muted: var(--color-muted, #a6a4b0);
  --island-row: color-mix(in srgb, var(--ink) 7%, var(--island-surface));
  --island-hover: color-mix(in srgb, var(--ink) 12%, var(--island-surface));
  --island-field: color-mix(in srgb, var(--ink) 10%, var(--island-surface));
  --accent: var(--color-accent, #b6a9ff);
  --ease: cubic-bezier(.22, .8, .27, 1);
  --morph: 240ms;
  position: absolute;
  inset: var(--aegis-island-top, 0px) 0 auto;
  height: 0;
  z-index: var(--aegis-island-z, 50);
  color: var(--aegis-island-ink, var(--ink));
  outline: none;
  pointer-events: none;
  font: 14px/1.4 var(--font-sans, "Inter", "Segoe UI", system-ui, sans-serif);
  opacity: 0;
  transition: opacity 160ms ease;
}
.island-rail.ready:not(.settling) { opacity: 1; }
.island-rail.compact { top: var(--aegis-island-top-narrow, 52px); }
.island-rail * { box-sizing: border-box; }
:where(.island-rail) button { cursor: pointer; color: inherit; font-family: inherit; }
:where(.island-rail) input { font-family: inherit; }
:where(.island-rail) button:disabled { cursor: default; }
:where(.island-rail) button:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.contour { position: absolute; inset: 0 0 auto; width: 100%; display: block; overflow: visible; }
.contour-fill { fill: var(--island-surface); }
.contour-edge { fill: none; stroke: var(--aegis-island-edge, color-mix(in srgb, var(--color-text, #fff) 15%, transparent)); stroke-width: 1; vector-effect: non-scaling-stroke; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.notch { pointer-events: auto; -webkit-app-region: no-drag; }
.question-content { max-height: min(65vh, 580px); overflow-y: auto; overscroll-behavior: contain; }
.question-head { width: 100%; }
.notch[data-phase="working"] { --notch-width: 148px; --mark: #abb6ce; }
.notch[data-phase="writing"] { --notch-width: 172px; --mark: #e1a9cc; }
.notch[data-phase="stopped"] { --notch-width: 176px; --mark: #d5ad86; }

.notch:not(.has-question) {
  width: max-content;
  min-width: min(var(--notch-width), calc(100% - 42px));
  max-width: min(560px, calc(100% - 42px));
}
.notch.has-detail .island-top { height: auto; min-height: 52px; }
.notch.has-detail .previous { white-space: normal; overflow-wrap: anywhere; }
.status { animation: island-label 150ms ease-out; }
@keyframes island-label { from { opacity: .35; translate: 0 2px; } to { opacity: 1; translate: 0 0; } }
.document-hidden :is(.glyph, .glyph *, .voice-signal i, .status) { animation-play-state: paused; }
@media (max-width: 720px) {
  .question-content { padding-inline: 14px; }
  .option { min-height: 44px; }
  .icon-button { width: 42px; height: 44px; }
  .send { width: 44px; }
}
.notch[data-phase="queued"] { --notch-width: 150px; --mark: #a7afbf; }
.notch[data-phase="planning"] { --notch-width: 150px; --mark: #9db4f0; }
.notch[data-phase="gathering"] { --notch-width: 166px; --mark: #80cbb1; }
.notch[data-phase="reading-repo"] { --notch-width: 194px; --mark: #9ec6ec; }
.notch[data-phase="reading-accounts"] { --notch-width: 229px; --mark: #8dcdbb; }
.notch[data-phase="verifying"] { --notch-width: 152px; --mark: #89d1bb; }
.notch[data-phase="filling-gaps"] { --notch-width: 194px; --mark: #91c6ed; }
.notch[data-phase="mapping"] { --notch-width: 201px; --mark: #a8b4f7; }
.notch[data-phase="testing"] { --notch-width: 208px; --mark: #91c4ee; }
.notch[data-phase="checking-draft"] { --notch-width: 215px; --mark: #9abfee; }
.notch[data-phase="citations"] { --notch-width: 159px; --mark: #ebc48a; }
.notch[data-phase="creating-image"] { --notch-width: 166px; --mark: #dfa3db; }
.notch[data-phase="finding-images"] { --notch-width: 194px; --mark: #dcb6e9; }
.notch[data-phase="composing"] { --notch-width: 194px; --mark: #d5aff0; }
.notch[data-phase="publishing"] { --notch-width: 166px; --mark: #bba7ef; }
.notch[data-phase="waiting-capacity"] { --notch-width: 187px; --mark: #ebc48a; }
.notch[data-phase="waiting"] { --notch-width: 180px; --mark: #a7afbf; }
.notch[data-phase="awaiting-approval"] { --notch-width: 187px; --mark: #ebc48a; }
.notch[data-phase="complete"] { --notch-width: 150px; --mark: #8ad2b4; }
.notch[data-phase="partial"] { --notch-width: 150px; --mark: #ebc48a; }
.notch[data-phase="failed"] { --notch-width: 152px; --mark: #eca4a9; }
@media (prefers-reduced-motion: reduce) {
  .island-rail { --morph: 0ms; transition: none; }
  .notch { transition-duration: 0ms; }
  .island-rail :is(.glyph, .glyph *, .voice-signal i, .status) { animation: none !important; }
  .question-reveal, .question-toggle { transition: none; }
}

</style>
