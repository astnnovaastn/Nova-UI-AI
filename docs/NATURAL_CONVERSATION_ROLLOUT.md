# Natural conversation and memory graph rollout

Aegis uses the shared persona in text, Live voice and the legacy response path. Completed conversation turns remain separate from durable facts. Topic groups are organizational metadata, with member IDs, source revisions and scope; they do not invent semantic relationships. Original memory class bodies and all 27 categories remain present.

## Conversations

Open Memory, then Toggle conversation panel. Chat and History share the rail. History lists dated sessions and paginated messages. Continue conversation requests an acknowledged logical session switch; New conversation creates a fresh session. Drafts are retained per session in browser session storage. Reload hydrates the active session. Voice is rebuilt only when changing its logical session. Recent conversation content has a separate 12,000-character budget; older information remains available through recall tools.

## Speech

Locally served Silero ONNX runs in a Web Worker. A 250 ms pre-roll, 96 ms confirmation and 650 ms trailing silence gate microphone input. Confirmed speech stops playback synchronously. Noise candidates never cancel it. Capture uses browser echo cancellation/noise suppression. Worker generation IDs prevent old detections crossing pause/resume; audio generation IDs prevent canceled playback returning. Background backlog is bounded. The local detector sends explicit Gemini activity-start/activity-end signals, using manual activity detection on the provider. This avoids a second delayed turn-end decision. Fresh speech releases the stale-response gate even without an input transcript. Enrolled recognition models warm up in the background after restart. Complete-utterance verification is corroborated by shorter windows rather than rejected solely for their naturally lower similarity.

Model provenance is in frontend/public/speech/model-manifest.json. ONNX Runtime Web is pinned through package-lock.json. Its module is served unchanged in Vite development and copied as a static asset in production.

## Recognition — guided enrollment

Recognition work resumed at the user’s request. Settings → Your voice now guides three different sentences, with finish, review, retry and cancel controls. Existing profiles are preserved. The first profile is the main user and retains the existing owner context; additional named profiles use isolated context. Audio is not sent to Gemini during enrollment. No production profile was created by our automated checks. CPU dependencies are listed in requirements_voice_local.txt; this PC has the local model dependencies installed. Fingerprints are separate from memory JSON and protected with Windows DPAPI. Enrollment audio is kept in RAM. Unknown/uncertain speakers use isolated guest memory, cannot change owner rules, and receive no owner UI snapshots. Recognition is context selection, never authorization.

## Graph

Three incomplete shells grow with real records and topic membership. Conversations use a chronological branch with stable slots for appended sessions. Layout additions settle over 600 ms; direct manipulation remains immediate. Idle rotation waits ten seconds. Fit-relative zoom is bounded from 90% to 500% for wheel, pinch, keyboard and AI navigation. Pause and reduced-motion stop traveling signals. Ambient signals are distinct from committed save/recall events.

## Validation

Backend tests cover session resume/reload/scope, source context, topic persistence/deduplication/merge/forget/restore, failed writes and automatic evidenced grouping. Browser tests run real Silero inference on a public speech fixture and brief synthetic clicks, and check History, zoom bounds and Settings on desktop/mobile. Existing memory, conversation, widget, privacy and theme regressions remain in the test suite.

Real text saved a temporary event; Live voice saved and recalled a separate event with audio. The final text recall was not confirmed: a minimal diagnostic returned Gemini HTTP 429. No further provider retries are scheduled. Temporary smoke-test records, groups and transcripts were removed. Real-room keyboard/music/echo/overlap and false-match calibration still require representative microphone testing; fixture tests cannot guarantee performance for every room or voice.

Latest local validation: 234 backend tests and 110 frontend unit tests pass, plus eight desktop/mobile speech, guided-enrollment, shared-chat and history cases. Earlier memory-graph browser cases remain covered by the prior rollout. TypeScript and production build passed. The enhanced History cases also passed acknowledged resume/new-session switching, draft isolation and reload hydration. Backend supervisor reports healthy; frontend remains on port 5173.


## Latest live checks

A public speech fixture passed real Gemini manual turn boundaries and interruption: audio returned after the interrupted turn, with completion about 1,562 ms after speech-end in that single test. This is a measurement, not a provider latency guarantee. Real ECAPA enrollment and matching passed in a temporary DPAPI profile, which was deleted afterward. No user recordings were used by these tests. An isolated REST text test received Gemini HTTP 429; drafts are preserved with a specific quota notice. Text provider availability remains external to these fixes.

Legacy-history session aliases now match across listing, pagination, response context and resume. A late initial history fetch cannot replace a newly submitted message or streaming reply. Test memory stores are separate from production; the final backend restart preserves existing user data. Real microphone accuracy, echo/noise in the user’s room and independent-speaker false-match rates still need the user’s testing.


Recognition follow-up: fixed mean-based enrollment thresholds versus median-based live comparisons. Existing encrypted samples are recalibrated in memory; profile files are not rewritten. Enrollment variation calibrates the allowed comparison spread. The UI explicitly distinguishes main-user confirmation, additional-speaker confirmation and unconfirmed guests. Live sessions receive an accurate owner/guest context description; the main-user label is not used as a personal name.


Echo/language follow-up: the microphone detector now compares confirmed speech candidates with an ephemeral, scheduled playback reference. Correlated delayed echo is zeroed before onset detection; unrelated speech remains eligible for interruption. The reference is bounded and stays in browser RAM. Worker messages carry capture timing. Input transcripts are accepted only when actual locally confirmed microphone activity was submitted; stale output transcripts stay gated after cancellation. Shared personality retains the requested language rather than following an incidental foreign transcript. Fixture tests cover delayed scaled echo, genuine and overlapping speech, queued future audio, and rejected echo leaving playback uninterrupted. Room echo and ASR accuracy require a real microphone retest.

Validation for the echo/language follow-up: 236 backend tests, 115 frontend unit tests, ten distinct relevant desktop/mobile browser cases, TypeScript and the production build pass. The real Gemini manual-activity interruption smoke test also passes. Existing encrypted owner enrollment is preserved and the background speaker model is ready. These tests establish the handling paths; they do not establish that every room echo or provider transcription error is eliminated.

## October 8 transcription and interruption repair

The installed google-genai 1.75.0 converter rejected input transcription language_codes before connecting. Upgraded and pinned the existing backend dependency to 2.29.0. Both preferred Live and fallback accepted an isolated connection using the English en-US hint. Production Live input transcription now uses that hint rather than unrestricted automatic language detection. This guides recognition; it does not guarantee perfect transcription for every accent or microphone.

Fixed a separate cancellation race: Gemini may send interrupted followed by a separate turn_complete. That canceled completion must not reset the new microphone turn, clear its transcript eligibility, or save an empty completed exchange. A regression exercises this exact packet sequence and verifies only the subsequent genuine turn is persisted.

The isolated public English speech fixture now yields “The birch canoe slid on the smooth planks.” after interruption, with 208,804 bytes of returned PCM. Completion took 5,187 ms after activity-end in that run; provider latency is not guaranteed. The smoke test now requires usable audio and nonempty completed input, so a two-byte silence packet cannot produce a false pass. Test stores are temporary and separate from owner memories.

237 backend tests and 115 frontend tests pass, as do TypeScript and production build. Backend supervisor is healthy and frontend returns HTTP 200 on port 5173. The existing enrolled fingerprint remains saved; recognition is currently disabled in the persisted setting, which was left unchanged. A live user microphone retest is still required for transcription accuracy, room echo, and speaker matching.
