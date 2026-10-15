# Unified Aegis validation and delivery

Run date: 15 October 2026. Windows desktop, Europe/Madrid. Mobile work paused.
Tests use temporary stores; runtime memories, credentials, recordings and test
screenshots are excluded from source delivery.

## Release checks

| Check | Result |
|---|---|
| Backend regression suite | 566 passed, 1 skipped, 5 warnings; 70.05 seconds. |
| Frontend Node tests | 105 passed; no failures or skips. |
| Supplied globe regression suite | 42 passed; no failures or skips. |
| TypeScript `tsc --noEmit` | Passed. |
| Vite production build | Passed; 131 modules transformed. |
| Source credential-pattern audit | No credential-like strings found in changed/new source. |
| Compatibility preservation | Legacy Aegis source matches the prior entry point after line-ending normalization. |

The build retains pre-existing warnings about Calculator's `eval` and a large
main bundle. These are not new errors or a claim that every existing component
has been redesigned.
The unchanged legacy source retains its pre-existing trailing whitespace;
whitespace checks for the other changed files pass.

## Conversation regression coverage

- Canonical core imports start no additional model, speech system or writer.
- Backend compatibility imports share the canonical module objects.
- October 14's unrelated development-topic replies have regression fixtures.
- Slow turn persistence cannot clear the next utterance or assign its text to
  the completed turn. Receive processing continues while tools are awaiting.
- Typed input uses the existing Live session, including while muted; submitted
  text interrupts the old reply without canceling its durable task.
- Old cancellation packets cannot erase a newer typed turn. Retained completed
  request IDs reconcile after restart without repeating the operation.
- Frontend capture fixtures cover speech beginning 0, 50, 100 and 250 ms after
  playback, plus genuine overlapping speech and waveform echo discrimination.
- Muting capture, transcript hydration, reconnect and stopped playback queues
  retain their separate lifecycle checks.

In the running desktop UI, typed input while muted produced both the assistant
transcript and audio. Browser audio-completion events confirmed playback.
This does not measure physical microphone recognition or real first-word
retention: those remain hardware acceptance checks. No sub-millisecond claim is
made. Time to first audio and physical capture-to-detection latency have not been
measured in this release.

## Research, tasks and Notes

The final visible test requested a quick public OpenAI tools lookup and a new
note in one message. The authoritative durable job recorded:

- Search completed, first attempt.
- Import completed, first attempt; 1,600 report characters persisted.
- Persisted report hash verified against the immutable artifact.
- Frontend acknowledgement completed; Review Notes visibly opened the new note.
- 7.045253 seconds from durable admission to the last recorded transition.

That duration is one observed queue/workflow sample, not full speech latency,
an API percentile or a performance guarantee. An earlier public lookup timed
out and succeeded after the bounded retry. Existing notes and the editing draft
were preserved. Source excerpts in quick mode are explicitly described as such;
they do not claim to reproduce full source documents.

Deterministic fixtures cover reports exceeding 20,000 characters, pagination,
partial evidence, authentication/quota failures, immutable revisions, scope
isolation, Notes verification, duplicate operations, edited-note conflicts,
uncertain writes, result-reference validation and saved-task completion reuse.
UI progress comes from the existing task stores; stale progress and overlapping
snapshot responses cannot overwrite newer state.

SerpAPI was verified against its configured public endpoint. Tavily initially
returned HTTP 401; the live root `.env` was unchanged at that earlier check.
After the user confirmed saving the updated key on 15 October, the official
endpoint returned HTTP 200 with three results. A subsequent real-provider test
using Nova's production `ResearchSearch` implementation completed in 4.164
seconds, retaining 222,849 report characters from three public documentation
sources. Scoped detail retrieval, the first 20,000-character page, continuation
and rejection of an unrelated scope all passed. This used an isolated local
test artifact store and no private memory. It verifies the provider/connector
and artifact path, not a new full voice-to-Notes benchmark. No fallback provider
was used. Nova reads the saved key dynamically; no restart was necessary.
Authentication errors do not trigger code repair.

The specifically approved test-generated repair job `2b7c8ffa` was canceled.
Other saved background work was not broadly canceled. Background model quota
exhaustion remains visible and respects the saved budget.

## Organization, permissions and history

Fixtures cover content-based candidate groups, compatible reversible merges,
stale revisions, cross-scope rejection and similar spellings with different
meanings. Word-frequency roots are no longer manufactured; original category
classifications and record values remain intact. The existing memory evaluation
suite remains part of backend regression coverage.

Moved provider, runtime, task, review and artifact infrastructure remains
approval-protected for generated repairs. Tests assert that staged changes to
these paths cannot apply automatically. OS isolation and trusted regression
requirements remain unchanged. No extra executor, provider substitution or
quota reset is introduced.

Populated desktop checks exercised the history day header, Madrid/4 AM metadata,
Chat/History navigation, library task display, muted typing, visible Notes import
and movement between Memory and Dashboard without ending the conversation.
Theme-matched scrollbar tracks and retained reading positions were inspected.

## Drawing and resource observations

During extended populated Memory residence, the existing canvas counters reported
3,021 memory records, 6,403 links, 60.0 FPS and 5.60 ms paint time at quality 1
(3,199 visible dots including hubs). This is a single observed renderer sample.
The globe renderer, palette and dashboard orb were not replaced in this phase.
Existing large-data drawing fixtures also pass.

CPU/RAM distributions, first-audio percentiles and comparable old-hardware
benchmarks were not collected. Physical camera acceptance remains outstanding
on this computer, which has no camera. These limits must not be represented as
successful hardware tests.

## Rollout and rollback

Source changes are copied to the existing live installation and the backend is
restarted through its controller with the previously approved brief reconnect.
The desktop UI remains at `http://127.0.0.1:5173/`. Only tested source and these
documents are committed to the requested GitHub branch.

Private memory, research reports, job journals, keys, recordings, build outputs,
virtual environments and local proof images remain untracked/ignored. Reverting
the source revision restores compatibility code without restoring old memory
files over current authoritative stores. Organization creates its own backup
before its first additive commit; original evidence and reversible merge history
remain authoritative.

## Consolidation and desktop work follow-up — 15 October

Six overlapping production modules were folded into the existing Aegis,
Live-context, action-jobs, research-learning and organizer modules. All active
imports were migrated. Compatibility adapters remain; no competing engines or
writers were introduced. Original memory records were not rewritten. Obsolete
local code-generation helpers are removed separately from production source.

Additional checks cover reviewed paraphrase collections, complete evidence and
privacy rejection, local cached-vector neighbors with no API calls, stale vector
suppression, month/week/day count consistency, the Madrid 4 AM boundary, date-only
historical labels, explicit palette-choice preservation, restored same-conversation
research handles, and folded relays retaining real connection endpoints.
The period suite was rerun after its final date-only correction: 18 passed,
1 skipped. Notification tests cover large backlogs, duplicate polling, bounded
seen IDs and exact task/approval targets. Sound uses synthesized tones, activated
by a browser gesture, and can be disabled independently of the microphone.
Physical listening to the notification chime is not represented as an automated
audio-quality measurement.

Desktop inspection verified notification-to-task navigation and the dedicated
Tasks, Learning and Approvals views. The task counter includes queued/retrying
work; recorded step counts drive percentages. Technical data stays in a
secondary disclosure. Registry metadata migration backs up stores before
redistributing untouched builtin defaults across eleven genuine color families.
Explicit choices, source values, IDs and original timestamps remain intact.

With 3,122 memories and 6,486 retained connections, a populated desktop sample
reported 47.2 FPS, 5.80 ms drawing cost and quality 1. This is one live development
sample, not a percentile or an older-hardware guarantee. All supplied large-data
and reduced-motion regressions continue to pass. Background semantic lookup and
model organization were quota-paused during inspection; local recall and cached
candidates remain available. The archive has not been claimed fully regrouped:
reviewed organization continues incrementally when the existing budget permits.
