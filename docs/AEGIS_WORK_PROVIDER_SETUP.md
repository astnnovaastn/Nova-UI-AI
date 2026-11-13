# AEGIS Work: model and provider setup

AEGIS Work uses one lead model and up to three specialist workers. Each is a **slot**. Keys stay in the server's `.env`. They never go to the page, a run record, an event or a log.

Don't paste keys into a chat, a screenshot or a file that gets committed.

## It works without new settings

| Slot | Role | Default provider | Default model | Default key |
|---|---|---|---|---|
| `lead` | Plans, assigns and writes the result | `NOVA_RESEARCH_PROVIDER` | Your research model (`NOVA_RESEARCH_GEMINI_MODEL`) | Your research key |
| `worker_a` | Discovery: ranks sources | Groq, if a Groq key exists | `openai/gpt-oss-20b` | `NOVA_RESEARCH_GROQ_API_KEY`, then `GROQ_API_KEY` |
| `worker_b` | Analysis: findings and knowledge maps | Groq | `openai/gpt-oss-120b` | Same |
| `worker_c` | Verification: independent check | Groq | `qwen/qwen3.8-27b` | Same |

**This sends data to Groq by default.** With a `GROQ_API_KEY` present, each Work run sends your prompt and the public web text it retrieved to Groq. Pasted text in a prompt goes too. To keep a run off Groq, set each worker's provider to another provider (see below). With no worker slots available, the lead does the workers' jobs.

Web search uses your existing `TAVILY_API_KEY`.

## Setting your own slots

Add any of these to `.env`, then restart the backend. `<SLOT>` is `LEAD`, `WORKER_A`, `WORKER_B` or `WORKER_C`.

```
AEGIS_WORK_<SLOT>_PROVIDER=groq          # groq, gemini or openai
AEGIS_WORK_<SLOT>_MODEL=openai/gpt-oss-120b
AEGIS_WORK_<SLOT>_API_KEY=               # optional: this slot's own key
AEGIS_WORK_<SLOT>_FALLBACK=lead          # another slot, or none
AEGIS_WORK_<SLOT>_TOKENS_PER_MINUTE=7200 # 0 for no local limit
AEGIS_WORK_<SLOT>_PRICE_PER_MILLION=     # optional: adds a cost estimate to the run's usage
```

Run-wide settings:

```
AEGIS_WORK_DAILY_TOKENS=1500000   # all Work runs together; pauses until midnight UTC when reached
AEGIS_WORK_DEEP_SOURCES=18        # Deep Research source cap, 3 to 40
```

## Things worth knowing

- **Fallback goes only where a setting says.** By default the lead falls back to `worker_b`, and workers fall back to `lead`. Set `FALLBACK=none` to fail instead. A card says when a model stepped in for another.
- **Different keys aren't always different quotas.** Groq reported a limit of 8,000 tokens per minute per model on the key tested on 6 November 2026. A key on a higher tier can raise `TOKENS_PER_MINUTE`.
- **Several models can cost more.** Each run records real tokens per model. Compare before assuming multi-model routing saves money.
- **Model lists change.** Check what's available on the host:

  ```
  GET /api/settings/work-models?check=true
  ```

  The route needs the signed-in host window. It returns each slot's provider, model, health and availability, but no key.

## Budgets per run

| Mode | Model calls | Tokens | Searches | Sources | Workers | Time limit |
|---|---|---|---|---|---|---|
| Direct | 3 | 16,000 | 0 | 0 | 0 | 3 minutes |
| Quick | 5 | 36,000 | 2 | 6 | 1 | 5 minutes |
| Deep | 14 | 170,000 | 10 | 18 | 3 | 20 minutes |
| Structured | 12 | 140,000 | 6 | 12 | 3 | about 17 minutes |

All of these are enforced. The time limit counts working time, not time paused for a provider's limit or for your answer, and it's checked between stages, so a stage already under way finishes first. Retrying a run that hit its time limit gives it a fresh allowance.

## Six slots and NVIDIA NIM (2026-11-10)

A run may use at most **six distinct models, the AEGIS lead included** (`MAX_MODELS = 6`, enforced in `_admit` before every attempt, fallbacks included). Simple runs still use fewer: Quick uses the lead plus discovery (2 models); Deep and Structured use the lead plus discovery, analysis and verification, plus the optional second analyst and synthesis writer.

| Slot | Role | Configured model (probed 2026-11-10) |
|---|---|---|
| `lead` | AEGIS: plan, executive summary/frame, final acceptance | Gemini `gemini-3.5-flash-lite` |
| `worker_a` | discovery: source screening | Groq `openai/gpt-oss-20b` |
| `worker_b` | analysis | Groq `openai/gpt-oss-120b` |
| `worker_c` | independent verification (different model family from the analyst) | NVIDIA `nvidia/nemotron-3-ultra-550b-a55b`, falls back to `worker_d` |
| `worker_d` | second analyst: takes every other analysis branch so branches run in parallel | NVIDIA `nvidia/nemotron-3.5-super-vl-120b-a12b` |
| `worker_e` | synthesis: writes Deep Research body sections | Gemini `gemini-3.5-flash`, falls back only to `lead` |

`worker_d` and `worker_e` have no default model, so an `.env` without them keeps the earlier four slots.

NVIDIA provider: `AEGIS_WORK_<SLOT>_PROVIDER=nvidia`, key from `NVIDIA_API_KEY` (or `NOVA_RESEARCH_NVIDIA_API_KEY`). Base URL `https://integrate.api.nvidia.com/v1`. Requests send `max_tokens` (not `max_completion_tokens`) and a strict `response_format: json_schema`; NIM rejects `nvext.guided_json`. Several listed NIM models (for example `nvidia/nemotron-3-super-120b-a12b`, `moonshotai/kimi-k2.6`) returned 404 for this account, and `deepseek-ai/deepseek-v4.1-flash` and `z-ai/glm-5.3-flash` timed out, so they were not chosen. Gemini Pro models returned 429 (quota) on the current key.

Deep Research now runs the discovery, analysis and verification workers (budget: 22 calls, 320k tokens, 1,500 s). Tests: `astra_ai/ui/backend/tests/test_work_six_models.py`.
