# Emotion Tagging Guidelines 

## Goal
Generate 2–3 high-quality `emotion_tags` per **individual event** by deeply analyzing that event's unique context, sentiment, semantic meaning, and emotional intent. This is **per-event analysis**, not cluster-based.

Files:
- Source: [astra_ai/Date/nova_ai_memory.json](astra_ai/Date/nova_ai_memory.json)
- Reference example: [astra_ai/Date/New_memory_event.json](astra_ai/Date/New_memory_event.json)
- Implementation: [astra_ai/memory/Mem0_ai_organizer.py](astra_ai/memory/Mem0_ai_organizer.py)

## Core Principles — Individual Event Context First

1. **Per-Event Analysis**: Analyze each event_id in isolation. Tags must reflect THAT event's unique meaning and emotional signature, not broader categories.
2. **Semantic Accuracy**: Tags must be extractable from the event's `summary`, `semantic_context`, and `emotional_context` — not generic labels.
3. **2–3 Tags Maximum**: Prefer exactly 2 when strong signals exist. Allow 3 only if all three are independently justified by the event.
4. **Emotional & Semantic Dual Focus**: Tags should capture both what the event IS (semantic) and how the user FEELS about it (emotional).
5. **Specificity Over Vagueness**: Prefer `italian_cuisine` + `culinary_passion` over generic `food` + `preference`.
6. **Format**: Lowercase, underscore-separated, 1–3 words per tag.

## Individual Event Context Layers

For each event, analyze in this order:

### Layer 1: Semantic (What is the event about?)
- Extract nouns, entities, topics from `summary` (e.g., "Italian cuisine" → `italian_cuisine`)
- Named entities: people (`brandon_sanderson`), places (`paris`, `milan`), objects (`coffee`)
- Domain concepts: `reading`, `anime`, `walking`, `travel`

### Layer 2: Emotional (How does the user feel about it?)
- Sentiment: positive, neutral, negative
- Intensity: 0–1 scale from `emotional_context.emotional_intensity`
- Emotion keywords: joy, frustration, curiosity, relaxation, ambition, passion
- Extract from `emotional_context` field

### Layer 3: Intent (Why does this matter to the user?)
- Is this a **preference** (I like X), **habit** (I do X regularly), **goal** (I want to X), **identity** (I am X)?
- Is this a **discovery** (learning about X) or **behavior** (doing X)?
- Relate to `category` and `subcategory` fields

### Layer 4: Relationships (How does this connect to other known info?)
- Does this relate to existing facts? (e.g., "reads sci-fi" + "Brandon Sanderson" → same topic)
- Is this a refinement of existing info? (e.g., "watches anime weekends" → "only Sundays")
- Cross-reference with user profile for context

## Tag Selection Algorithm (Individual Event Focus)

```
For each event:

1. SEMANTIC TAG (Primary):
   - Extract 1 dominant semantic entity from summary
   - Normalize to canonical form
   - Example: "enjoying Italian cuisine" → italian_cuisine

2. EMOTIONAL TAG (Secondary):
   - Score event's emotional intensity (0–1)
   - Map intensity + sentiment → emotion keyword
   - intensity ≥ 0.7 + positive sentiment → passion, enthusiasm, joy, love
   - intensity 0.4–0.6 → interest, curiosity, preference, comfort
   - intensity < 0.4 → routine, habit, neutral
   - Example: intensity=0.75, sentiment=positive → culinary_passion

3. CONTEXTUAL TAG (Optional, if strong):
   - Only if event_context provides additional dimension
   - Must not duplicate semantic or emotional tag
   - Example: "watches anime on Sundays" → semantic: anime, emotional: relaxation, contextual: weekly_ritual

4. SCORING & SELECTION:
   score = (semantic_relevance × 0.35) + (emotional_intensity × 0.35) + (importance_score × 0.20) + (confidence × 0.10)
   
   - Keep top 2 scoring tags
   - Only add third if its score ≥ 0.8 × (second tag's score)
```

## Weights & heuristics (recommended)
- importance_score: indicates how notable the event is — strong multiplier.
- emotional_intensity: boosts emotional tags when present.
- semantic_relevance: computed as string/keyword overlap or small embedding similarity between candidate and summary.
- confidence: small smoothing factor so only high-confidence events have stronger tags.
- Deduplicate synonyms using a small mapping table (see below).

## Canonical Tag Normalization Mapping

Use this table to map raw candidate tags to canonical emotion/semantic tags:

| Input / Synonym | Canonical Form | Tag Type | Emotional Intensity |
|---|---|---|---|
| Italian, Italy, pasta, risotto, ravioli, carbonara | italian_cuisine | semantic | variable |
| anime, manga, Japanese animation | anime_interest | semantic | variable |
| Brandon Sanderson, Cosmere, Stormlight | brandon_sanderson | semantic (author) | variable |
| coffee, espresso, caffeine, latte | coffee_affinity | semantic | variable |
| walking, hiking, strolling, trails | walking | semantic (activity) | variable |
| reading, books, novels, fiction | reading_interest | semantic | variable |
| passionate, passionate about, devoted | passion | emotional | high (0.7–1.0) |
| enthusiastic, enthusiast, keen | enthusiasm | emotional | high (0.7–1.0) |
| enjoys, likes, prefers, fond | interest | emotional | medium (0.4–0.6) |
| curious, exploring, discovering | curiosity | emotional | medium (0.4–0.6) |
| relaxing, calm, peaceful, meditative | relaxation | emotional | low–medium (0.3–0.5) |
| routine, regular, daily, weekly, habit | habit | behavioral | low (0.1–0.3) |
| boring, dull, tedious, uninterested | disinterest | emotional | medium–high (0.5–0.8), negative |

### Tag Grouping Strategy
- **Food/Culinary**: italian_cuisine, coffee_affinity, food_interest → pick most specific from summary
- **Entertainment**: anime_interest, reading_interest, fiction_preference → pick most specific
- **Activity**: walking, travel, exploration → determine primary based on summary context
- **Emotion**: passion, enthusiasm, interest, curiosity → prioritize by intensity level
- **Behavioral**: habit, routine, ritual → use when emotional_intensity < 0.4

### Canonicalization Rules
1. **Plurals**: "novels" → "reading", "walks" → "walking"
2. **Partial Names**: "Sanderson" → "brandon_sanderson", "Italian" → "italian_cuisine"
3. **Synonyms**: "enjoy" / "like" / "prefer" all map to "interest" (if intensity < 0.6)
4. **Compound**: "Italian food" → "italian_cuisine", "morning walks" → "walking" + "routine"

## Fallback Strategy

If no strong semantic candidates (score < 0.5 for all):
1. Use category-based tag (e.g., `category="hobby"` → `hobby_interest`)
2. Use generic emotional tag (e.g., `preference`, `interest`)
3. Last resort: return `["personal_fact"]` (indicates low confidence)

## Tag format and examples
- Format: `lowercase_words_with_underscores` (no spaces)
- Length: prefer 1–3 words

Example event -> tags (2-3):
- Summary: "User enjoys Italian cuisine" → `['italian_cuisine', 'culinary_interest']`
- Summary: "Brandon Sanderson is my favorite author" → `['brandon_sanderson', 'literary_enthusiasm']`
- Summary: "I usually watch anime on Sundays" → `['anime', 'weekly_relaxation']`
- Summary: "I walk for 45 minutes every morning" → `['walking', 'health_commitment']`

## Pseudocode (Python-style)

```
def generate_emotion_tags(event):
    summary = event.get('summary','').lower()
    semantic_tags = event.get('semantic_context',{}).get('semantic_tags', [])
    emotional = event.get('emotional_context', {})
    importance = event.get('importance_score', 0.5)
    intensity = emotional.get('emotional_intensity', 0.5)
    confidence = emotional.get('confidence', 0.8)

    candidates = []
    # 1. Extract nouns/entities from summary (use NLP)
    candidates += extract_entities_and_nouns(summary)
    # 2. Include semantic tags
    candidates += semantic_tags
    # 3. Include emotion keywords if present
    if emotional.get('sentiment'):
        candidates.append(emotional['sentiment'])
    candidates = normalize_candidates(candidates)

    # Score each candidate
    scores = {}
    for c in set(candidates):
        semantic_relevance = compute_relevance(c, summary)  # 0..1
        score = (importance * 0.4) + (intensity * 0.3) + (semantic_relevance * 0.2) + (confidence * 0.1)
        scores[c] = score

    sorted_cands = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    tags = [c for c,_ in sorted_cands[:2]]
    # allow third if very strong
    if len(sorted_cands) > 2 and sorted_cands[2][1] >= 0.8 * sorted_cands[1][1]:
        tags.append(sorted_cands[2][0])

    if not tags:
        # fallback to category-based tags
        tags = fallback_category_tags(event.get('category'))

    return tags
```

Notes:
- `extract_entities_and_nouns` should use a lightweight NLP: spaCy, or simple regex + noun-chunking. For offline or small systems, prefer spaCy small model.
- `compute_relevance` can be a Jaccard of keyword overlap or a small embedding cosine similarity when available.

## Example mapping for `nova_ai_memory.json` events
(Apply these rules to each `event_id` in the file.)
- `evt_0704ab42` — "enjoys reading science fiction novels" → `['science_fiction', 'reading_interest']`
- `evt_b616b439` — "watch anime sometimes during the weekend" → `['anime', 'weekend_relaxation']`
- `evt_280bb193` — "going to Paris next week" → `['travel', 'paris_trip']`
- `evt_80e5c4c0` — "name is Alex prefer Al" → `['identity', 'preferred_name']`
- `evt_f596a7d4` — "live in Milan, Italy" → `['milan', 'location']`
- `evt_ebd15552` — "I work at a bakery, pastry chef" → `['pastry_chef', 'profession']`
- `evt_382b1cb0` — "loves italian food especially pasta" → `['italian_cuisine', 'food_enthusiasm']`
- `evt_86979d1b` — "prefer Sundays only" → `['time_preference', 'sunday']`
- `evt_0b92ab29` — "usually go for morning walks" → `['walking', 'routine']`
- `evt_a9515518` — "always have coffee in the morning" → `['coffee', 'morning_routine']`

## Testing & validation
- Unit tests: for each sample event, assert output tags match expected canonical tags.
- Manual review: sample 10% of generated tags with a human-in-the-loop to ensure quality.
- Metrics: track tag accuracy (human agreement), tag diversity, number of fallback tags used.

## Migration & rollout
1. Run generation offline on `nova_ai_memory.json` and write a new file `nova_ai_memory_with_refined_tags.json`.
2. Keep original file unchanged and maintain mapping for audit (`event_id` -> old tags -> new tags).
3. Roll forward by replacing `emotional_context.emotion_tags` when tests and QA pass.
4. Optionally, add a `tagging_metadata` field to each event noting algorithm version and timestamp.

## Operational considerations
- Rate-limit NLP model usage when processing large files.
- Cache normalized entity lookups and synonym maps to keep processing fast.
- Keep the canonical mapping table editable for team updates.

## Minimal implementation checklist
- [ ] Implement `normalize_candidates` and canonical mapping
- [ ] Integrate small NLP extractor for entities/nouns
- [ ] Implement `compute_relevance` (Jaccard fallback, embedding optional)
- [ ] Run generator on `astra_ai/Date/nova_ai_memory.json`
- [ ] Validate results and audit sample
- [ ] Add `tagging_metadata` to updated events

---

Last updated: December 8, 2025
