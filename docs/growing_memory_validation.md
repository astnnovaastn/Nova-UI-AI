# Growing memory validation

Validated on the development Windows desktop on 2026-10-12, before publication. The source snapshot preserves the tested implementation.

- Backend: 284 tests passed.
- Frontend: 95 tests passed.
- Globe engine and adapter: 20 tests passed.
- TypeScript and production build passed.
- Populated desktop globe, history, themes, learning review, and guest-scope checks passed.
- Temporary real Gemini text and voice checks completed; text 1,408 ms, voice 2,292 ms.
- Temporary Groq helper development activated and completed an isolated invocation in 8,071 ms.

The temporary 20-job workload completed all jobs with four peak concurrent operations in 953.7 ms. Event-loop delay measured 6.13 ms at p95 and 23.62 ms maximum. Parent memory peaked at 39.7 MiB; isolated workers enforce 256 MiB and a 10% CPU cap. Native tool and repair tests verified execution, deduplication, and rollback. These measurements describe this computer and fixture, not a performance guarantee on other hardware.

Preservation checks retained all 701 original record IDs and original values/history, every forgotten record, and all 2,273 original transcript IDs. One analytics record changed through a concurrent application operation with its original value retained in history. Category migration seeded the 27 original categories; temporary fixtures exercised growth beyond 127, aliases, descendants, policy inheritance, merging, scope isolation, retirement, and restoration.

Existing build warnings concern Calculator eval, bundle size, and deprecated FastAPI lifespan hooks. Mobile polish is deferred. Native learned-tool execution fails closed when OS isolation cannot be verified; broader or critical repairs require exact-version review. Private reports, test captures, preservation hashes, and runtime data are excluded from Git.
