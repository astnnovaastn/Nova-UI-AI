# Deep Research quality

Implemented for version-2 runs:

1. Retain all requested body headings rather than silently clipping to ten.
2. Match evidence to section terms. Do not assign unrelated evidence by round-robin or force every section to have two arbitrary sources.
3. Preserve section drafts and existing section-level retry behavior.
4. Record an explicit evidence-gap section when no sources match; do not ask the writer to fabricate a supported section.
5. Mark evidence gaps in report_failures so publication remains partial.
6. Preserve citation validation, bibliography, persisted report text and the existing Reader path.
7. Publish conservative coverage diagnostics: exact heading presence plus matched evidence IDs. The metadata explicitly says this is not semantic verification.

Existing legacy section behavior remains readable and compatible. Complete-report fixtures now contain evidence for every topic they ask the writer to cover.

A Coverage review object now exposes recorded section/evidence mapping in structured and deep runs. It labels the limits explicitly and does not turn keyword matches into a semantic quality verdict.

Still required for the full quality phase: explicit user requirements beyond model section headings; claim-to-requirement mapping; semantic substance checks; independently bounded gap follow-ups based on requirement importance; and robust uncapped evidence delivery within each model's verified context capacity. Word counts alone are not a quality gate.

No output was lengthened by adding agents. Model configuration, credentials and budgets remain unchanged.
