/** The reason a run is waiting, in plain words, from what the backend recorded. */
const WORDS: Record<string, string> = {
  gemini_service_unavailable: "Waiting for the AI service",
  groq_service_unavailable: "Waiting for the AI service",
  openai_service_unavailable: "Waiting for the AI service",
  search_provider_quota: "Waiting for search quota",
  provider_quota: "Waiting for search quota",
  groq_private_consent_required: "Waiting for your permission",
  work_needs_input: "AEGIS has a question",
  work_rate_limited: "Waiting for the AI services' limits",
  work_daily_limit: "Daily AI limit reached; continues tomorrow",
  work_continuing: "Continuing",
};
// Reactive, so the activity line updates as soon as the backend's reason arrives.
let reason = $state("");
export const setWaitingReason = (next: string) => {
  reason = next;
};
export function wordsForWait(recorded: string): string {
  if (!recorded) return "";
  if (WORDS[recorded]) return WORDS[recorded]!;
  return /quota|budget/.test(recorded) ? "Waiting for quota" : "Waiting to continue";
}
export const waitingWords = () => wordsForWait(reason);
const ENDED: Record<string, string> = {
  synthesis_unavailable: "The report couldn't be written",
  research_canceled: "Research stopped",
  research_cancelled: "Research stopped",
  provider_quota: "Search quota ran out",
  search_provider_quota: "Search quota ran out",
  work_budget_exhausted: "The run reached its budget",
  work_deadline: "The run reached its time limit",
  work_model_not_configured: "No AI model is set up for this",
  work_model_authentication: "An AI service refused its key",
  work_model_model_unavailable: "A configured AI model isn't available",
};
/** Why a run ended short, from what the backend recorded. */
export function endedWords(ended: string, state: string): string {
  if (ENDED[ended]) return ENDED[ended]!;
  if (ended.startsWith("work_model_")) return "The AI services couldn't finish this";
  if (ended.startsWith("search_")) return "The web search couldn't run";
  return state === "cancelled" ? "Research stopped" : "Research didn't finish";
}
export const ACTIVE_JOBS = new Set(["running", "queued", "retrying", "waiting", "waiting_for_retry"]);
