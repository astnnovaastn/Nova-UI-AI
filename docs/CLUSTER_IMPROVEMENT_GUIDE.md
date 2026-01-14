# Cluster Improvement Guide — Step‑by‑Step

Purpose
- Practical step-by-step guide to reorganize and improve event clusters in the memory engine.
- Actionable rules, scoring, pseudocode, examples, testing and rollout notes so the system groups events by meaning and behavior.

**Overview**
- Goal: form compact, coherent thematic clusters (routines, interests, habits, goals) rather than many 1-item clusters driven by single emotion tags.
- Primary signals: semantic similarity (meaning), behavioral role (routine/intent), temporal patterns (frequency), and emotional alignment (secondary).

**Quick Summary of Steps**
1. Extract normalized event signals (tokens, noun phrases, role, timestamp, vector).
2. Compute pairwise similarity scores using a weighted formula.
3. Propose merges where score ≥ merge threshold; flag borderline cases for review.
4. Apply merges, recompute centroids and coherence, revert if coherence drops too much.
5. Name clusters, update metadata and `update_log` with explainable reasons.
6. Run tests and human review for borderline merges; tune weights and thresholds.

**Step 1 — Event Signal Extraction (actionable)**
- For each event E extract:
  - `summary_text` → normalize (lowercase, remove punctuation, lemmatize if available).
  - `noun_phrases` and `important_tokens` (stopwords removed).
  - `behavioral_role`: infer labels like `habit`, `preference`, `routine`, `one_off`, `goal`, `health` from `category`, `subcategory`, and verbs in summary.
  - `timestamp` and `frequency` (daily, weekly, one-off) if available.
  - `vector`: use stored vector (if present) or compute embedding.
  - `importance_score` and `confidence` from event metadata.

**Step 2 — Similarity Scoring (formula & thresholds)**
- Compute pairwise S_total(E1,E2):
  - S_total = w_sem*S_sem + w_role*S_role + w_time*S_time + w_emotion*S_emotion
  - Suggested weights: w_sem=0.50, w_role=0.25, w_time=0.15, w_emotion=0.10
- Components:
  - S_sem: semantic similarity (cosine on embeddings or Jaccard over noun-phrases), 0..1
  - S_role: role similarity (1.0 exact, 0.5 related, 0.0 otherwise)
  - S_time: normalized temporal similarity (recent+matching frequency → higher)
  - S_emotion: sentiment + intensity alignment (0..1)

- Merge thresholds (recommendation):
  - Merge automatically if S_total ≥ 0.65
  - Flag for review if 0.50 ≤ S_total < 0.65
  - Do not merge if S_total < 0.50

**Step 3 — Merge Strategy and Coherence**
- Candidate selection:
  - For each event E, find top candidate cluster C where mean S_total(E, members_of(C)) is highest.
- Merge rule:
  - If S_total(E,C) ≥ 0.65 → add E to C.
  - After adding, recompute cluster centroid as weighted average of event vectors: weight = importance_score × confidence.
  - Recompute cluster coherence = mean pairwise S_total across members.
  - If coherence decreases by > 0.15, revert merge and mark E as separate or flagged for review.
- Splitting:
  - If cluster coherence drifts down over time below 0.45, consider splitting using the same scoring system (apply a local clustering algo inside the cluster).

**Step 4 — Naming, Metadata & Insights**
- `topic`: snake_case short machine tag (e.g., `reading_habits`, `morning_routines`).
- `label`: human-friendly phrase (e.g., "Reading Habits & Entertainment").
- `dominant_tags`: top 2–4 normalized tags from members.
- `member_count`, `average_confidence`, `temporal_span`, `creation_timestamp`, `last_updated`.
- `insights.primary_pattern`: 1–2 sentence summary explaining why events are grouped and what personalization opportunities exist.

**Step 5 — Update Log & Explainability**
- Use `CLUSTER_REORGANIZATION` entries for large reorganizations with: timestamp, reason, changes (from→to), pre_metrics and post_metrics.
- Use `CLUSTER_UPDATE` for smaller ops: `create`, `merge`, `split`, `assign`, `retain`. Each should include `event_ids`, `reason`, and `pre_metrics`/`post_metrics`.
- Always include an explainable textual reason for each merge (e.g., "shared noun-phrases: read, bedtime; behavioral roles: habit+leisure").

**Step 6 — Pseudocode (implementable)**
```
# Precompute signals for all events
for E in events:
  E.signals = extract_signals(E)

# Maintain clusters list
clusters = load_existing_clusters()

# Assign or merge loop
for E in events_not_assigned:
  best = None; best_score = 0
  for C in clusters:
    score = mean([score_pairwise(E, M) for M in C.members])
    if score > best_score:
      best_score = score; best = C
  if best_score >= 0.65:
    best.add(E)
    best.recompute_centroid()
    if best.coherence_drop() > 0.15:
      best.remove(E); create_new_cluster(E)
  elif best_score >= 0.5:
    flag_for_review(E, best, best_score)
  else:
    create_new_cluster(E)

# After processing: recompute all metadata and write update_log
```

**Step 7 — Concrete Examples (how to decide)**
- Example A: "User enjoys reading sci-fi novels." + "User always read 30 minutes before bed." →
  - S_sem high (read, sci-fi, book), S_role = habit+leisure → S_total ≥ 0.65 → merge to `reading_habits`.
  - Benefit: personalized suggestions (book recommendations, bedtime routines).

- Example B: "I walk for 45 minutes every morning." + "I prefer dark roast coffee, black." →
  - Semantic overlap modest but temporal/role link strong (both morning rituals) → S_total typically ≥ 0.65 → merge to `morning_routines`.
  - If coffee mention is incidental (<2 occurrences), S_time or frequency lowers S_total and they stay separate.

- Example C: "I love trying new restaurants and cuisines." →
  - Stands alone with high S_sem within culinary domain; no other events overlap → keep as `culinary_adventure`.

**Step 8 — Testing & Validation**
- Unit tests:
  - `test_similarity_scores()` verifying S_sem, S_role, S_time computations.
  - `test_merge_decision()` confirming merges at threshold boundaries and reverts on coherence drop.
- Integration test:
  - Run reorg on a copy of `astra_ai/Date/nova_ai_memory.json`, compute fragmentation metric (cluster_count / event_count) and mean coherence before/after.
- Suggested acceptance criteria:
  - Reduced fragmentation (fewer single-item clusters), average coherence >= 0.7, no critical personalization loss.

**Step 9 — Rollout & Operations**
- Run reorganizations in batches (nightly or after N new events), not per-event, to avoid oscillation.
- Keep small human-review queue for 0.5–0.65 decisions.
- Track cluster lifecycle and decay: archive clusters inactive > 180 days or move to low-priority index.
- Expose cluster explanations for transparency when the assistant uses cluster data to make suggestions.

**Step 10 — Tuning & Monitoring**
- Monitor:
  - Fragmentation (target lower over time)
  - Average coherence (target ≥ 0.7)
  - Impact on downstream features (suggestion relevance, recall accuracy)
- Tune weights and thresholds based on live feedback and A/B tests.

**Edge cases & policies**
- High-importance but unique events: keep singletons if importance_score > 0.9.
- Conflicting events across time: treat as time-scoped clusters with date ranges.
- Sensitive data: follow privacy rules — do not cluster sensitive personal data across sessions unless allowed.

**Appendix: Implementation tips**
- Use embeddings + noun-phrase extraction when available for best semantic accuracy.
- Prefer explainability: store `why` text with each cluster update.
- Use weighted centroid recomputation so high-importance events influence cluster vectors more.

---

File saved as `CLUSTER_IMPROVEMENT_GUIDE.md` in the workspace. Want me to run the reorganization on the current memory file and produce a short report next?