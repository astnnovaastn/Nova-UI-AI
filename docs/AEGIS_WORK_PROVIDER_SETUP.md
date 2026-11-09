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

Deep Research uses the lead for planning and writing. The search tool gathers and ranks evidence. Quick and Structured may use configured workers, and a configured fallback may handle a failed model call. These calls can send the request and selected evidence to the corresponding provider. Set a slot’s fallback to none to keep it on that slot.

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
AEGIS_WORK_MAX_MODELS=4          # Maximum distinct models per run, 1 to 4
```

## Things worth knowing

- **Fallback goes only where a setting says.** By default the lead falls back to `worker_b`, and workers fall back to `lead`. Set `FALLBACK=none` to fail instead. A card says when a model stepped in for another.
- Provider quotas depend on the account and model. Set the local pacing limit to match the configured account.
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
| Deep | 12 | 200,000 | 5 | 18 | 0 | 20 minutes |
| Structured | 12 | 140,000 | 6 | 12 | 3 | about 17 minutes |

All of these are enforced. The time limit counts working time, not time paused for a provider's limit or for your answer, and it's checked between stages, so a stage already under way finishes first. Retrying a run that hit its time limit gives it a fresh allowance.
