/*
 * AEGIS Agent Execution Lab — models and providers.
 *
 * Two registries side by side, both read from source, neither called:
 *   Zephium: crates/zephium-core/src/work/model.rs (WorkModelProvider, WorkModelRole,
 *            WorkModelSupports, WorkModelEntry) and work_lead/call.rs (WorkLeadModels).
 *   AEGIS:   astra_ai/core/work/providers.py (SLOTS, PROVIDER_CAPABILITIES, load_slots).
 * The AEGIS rows are a snapshot of the configured provider and model NAMES taken from the
 * root .env on 17 November 2026. No key was read, and none is in this file or the page.
 * In the lab every model is simulated: choosing one changes only the capability checks.
 */
import type { Role } from "./types";

export type Supports = { tools: boolean; vision: boolean; structured: boolean; reasoning: boolean; native_search: boolean };

export type ModelChoice = {
  id: string;
  label: string;
  provider: string;
  owner: "aegis" | "zephium" | "lab";
  /** AEGIS slot it is configured in, if any. */
  slot?: string;
  context: number;
  output: number;
  supports: Supports;
  note: string;
};

/** Zephium's provider kinds (model.rs WorkModelProvider) and the wire each speaks. */
export const ZEPHIUM_PROVIDERS = [
  { id: "open_ai", wire: "OpenAI Responses" },
  { id: "anthropic", wire: "Anthropic Messages" },
  { id: "google", wire: "Gemini" },
  { id: "deep_seek", wire: "Chat Completions" },
  { id: "open_router", wire: "Chat Completions" },
  { id: "xai", wire: "Chat Completions" },
  { id: "mistral", wire: "Chat Completions" },
  { id: "groq", wire: "Chat Completions" },
  { id: "cerebras", wire: "Chat Completions" },
  { id: "compatible", wire: "Chat Completions (any OpenAI-compatible endpoint)" },
  { id: "cloud", wire: "Zephium Cloud (the upstream's own body)" },
];

/** Roles: model.rs WorkModelRole; call.rs for_role maps Decision onto Light. */
export const ROLES: { id: Role; zephium: string; aegis: string }[] = [
  { id: "lead", zephium: "Lead: the conversation with tools; also the Computer helper (helper.rs role())", aegis: "lead slot: plan, frame and write" },
  { id: "page", zephium: "Page: browser and connection helpers that act on pages", aegis: "No equivalent: AEGIS has no page agent" },
  { id: "light", zephium: "Light: research helpers that read and summarise; Decision uses it too", aegis: "worker_a (discovery), worker_b/d (analysis), worker_c (verification), worker_e (writing)" },
];

const caps = (tools: boolean, vision: boolean, reasoning = true, native_search = false): Supports => ({ tools, vision, structured: true, reasoning, native_search });

/** AEGIS slots as configured (names only), with providers.py PROVIDER_CAPABILITIES limits. */
export const AEGIS_MODELS: ModelChoice[] = [
  {
    id: "gemini:gemini-3.5-flash-lite",
    label: "Gemini 3.5 Flash-Lite",
    provider: "gemini",
    owner: "aegis",
    slot: "lead (NOVA_RESEARCH_GEMINI_MODEL; no AEGIS_WORK_LEAD_* set)",
    context: 1_000_000,
    output: 16_000,
    supports: caps(true, true),
    note: "Lead today. AEGIS calls it with a strict JSON schema, not with tool calls (providers.py GeminiAdapter).",
  },
  {
    id: "gemini:gemini-3.5-flash",
    label: "Gemini 3.5 Flash",
    provider: "gemini",
    owner: "aegis",
    slot: "worker_e (writing), falls back to lead",
    context: 1_000_000,
    output: 16_000,
    supports: caps(true, true),
    note: "Writes Deep Research sections.",
  },
  {
    id: "groq:openai/gpt-oss-20b",
    label: "gpt-oss-20b on Groq",
    provider: "groq",
    owner: "aegis",
    slot: "worker_a (discovery)",
    context: 131_072,
    output: 8_000,
    supports: caps(true, false),
    note: "Groq limits tokens per minute (7,200 configured window in providers.py).",
  },
  {
    id: "groq:openai/gpt-oss-120b",
    label: "gpt-oss-120b on Groq",
    provider: "groq",
    owner: "aegis",
    slot: "worker_b (analysis); lead falls back here",
    context: 131_072,
    output: 8_000,
    supports: caps(true, false),
    note: "reasoning_effort low is sent for gpt-oss models.",
  },
  {
    id: "nvidia:nvidia/nemotron-3-ultra-550b-a55b",
    label: "Nemotron 3 Ultra on NVIDIA NIM",
    provider: "nvidia",
    owner: "aegis",
    slot: "worker_c (verification), thinking 512, falls back to worker_d",
    context: 128_000,
    output: 16_000,
    supports: caps(true, false),
    note: "NIM rejects nvext.guided_json; strict json_schema works.",
  },
  {
    id: "nvidia:nvidia/nemotron-3.5-super-vl-120b-a12b",
    label: "Nemotron 3.5 Super VL on NVIDIA NIM",
    provider: "nvidia",
    owner: "aegis",
    slot: "worker_d (second analysis), thinking off, falls back to worker_b",
    context: 128_000,
    output: 16_000,
    supports: caps(true, true),
    note: "Vision-language model.",
  },
  {
    id: "openai:gpt-4.1-mini",
    label: "gpt-4.1-mini (OpenAI)",
    provider: "openai",
    owner: "aegis",
    slot: "Not in a Work slot; NOVA_RESEARCH_OPENAI_MODEL for classic research",
    context: 400_000,
    output: 16_000,
    supports: caps(true, true),
    note: "Key present; only used if a slot names provider openai.",
  },
];

/** Lab-only choices that exist to show the capability checks refusing a run. */
export const LAB_MODELS: ModelChoice[] = [
  {
    id: "lab:no-tools",
    label: "A model without tool calling (lab)",
    provider: "compatible",
    owner: "lab",
    context: 32_000,
    output: 4_000,
    supports: { tools: false, vision: false, structured: false, reasoning: false, native_search: false },
    note: "Shows the refusal: the Zephium lead loop needs tool calls; nothing starts.",
  },
];

export const MODELS = [...AEGIS_MODELS, ...LAB_MODELS];
export const modelOf = (id: string) => MODELS.find((model) => model.id === id);

/** A sensible simulated assignment from the configured slots. */
export const DEFAULT_MODELS: Record<Role, string> = {
  lead: "gemini:gemini-3.5-flash-lite",
  page: "nvidia:nvidia/nemotron-3.5-super-vl-120b-a12b",
  light: "groq:openai/gpt-oss-120b",
};

/** Why a run cannot start on these models, in the person's words; empty when it can. */
export function capabilityFaults(models: Record<Role, string>, needsBrowser: boolean): string[] {
  const out: string[] = [];
  const lead = modelOf(models.lead);
  if (!lead) out.push("No lead model is chosen.");
  else if (!lead.supports.tools) out.push(`${lead.label} has no tool calling; the lead loop (lead.rs drive) proposes work only through tool calls.`);
  const page = modelOf(models.page);
  if (needsBrowser && page && !page.supports.tools) out.push(`${page.label} cannot drive pages: browser and connection helpers need tool calls.`);
  const light = modelOf(models.light);
  if (light && !light.supports.tools) out.push(`${light.label} cannot run research helpers: they need tool calls.`);
  return out;
}

/** Zephium's own error vocabulary (model.rs WorkModelError) and what call.rs does with each. */
export const MODEL_ERRORS = [
  { error: "RateLimited { retry_after_ms }", handling: "Waits the server's retry-after if ≤30 s, up to 2 retries (call.rs RETRIES)" },
  { error: "Overloaded / Network", handling: "Waits 2 s, then 5 s; 2 retries" },
  { error: "MissingKey / Unauthorized / OverBudget / PlanLimit / Hosted", handling: "Fatal for the run: the turn records a plain note (\"No key is set for the chosen model; add one in Settings → AI\")" },
  { error: "ContextTooLong", handling: "Refused turn; older tool results are shortened past 240,000 characters before each call (lead.rs compact)" },
  { error: "Protocol / answer lost after a tool call streamed", handling: "OutcomeUnknown: may have been charged, never replayed" },
  { error: "MaxTokens", handling: "Asked once more with a 2,048-token recovery instruction (lead.rs RAN_LONG), then closes with what it has" },
];

/** AEGIS's own error handling, for comparison (providers.py). */
export const AEGIS_ERRORS = [
  { error: "rate_limit / timeout / transport / http_5xx", handling: "Retried up to 3 attempts, then the slot's fallback; a whole chain of transient failures pauses the run (WorkPaused)" },
  { error: "3 failures in a row", handling: "Circuit opens for 90 s per model (ProviderGuard)" },
  { error: "authentication / invalid_request / model_unavailable", handling: "Fallback slot; no retry" },
  { error: "output_limit / refused / invalid_response", handling: "invalid_response retried; others go to fallback" },
  { error: "Distinct-model cap (AEGIS_WORK_MAX_MODELS = 6)", handling: "A fallback that would add a seventh model is passed over" },
];
