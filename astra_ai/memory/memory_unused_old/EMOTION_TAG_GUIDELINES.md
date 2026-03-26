**Emotion Tagging Guidelines for Mem0_ai_organizer**

**Overview**
- **Purpose:** Describe how the `Mem0_ai_organizer` derives a concise set of emotion tags (2–3 tags) from a single contextual event. These tags are semantic labels that summarize salient emotional, topical, or domain cues present in the event text.
- **Scope:** The AI must generate no more than 2–3 tags per event and must base tags strictly on the immediate context of that event (no outside inference or unrelated memory merging).

**Principles**
- **Clarity:** Use short, single-word or short-phrase tags (no sentences). Tags should be human-readable and readily interpretable by downstream systems.
- **No required keyword map:** The system does not need a pre-defined `keyword_map` to generate emotion tags. Tagging should rely on direct analysis of the event text rather than lookups against an external keyword mapping.
- **Context validation (know before tagging):** The AI must validate and understand the cleaned event context before producing tags — ensure explicit cues exist in the text that justify each tag.
- **Strip generic 'User' references:** Do not tag "user" or use generic prefixes like "user_preference" or "user_behavior." Instead, extract the actual *object* or *topic* the user is engaged with (e.g., "anime," "coffee," "restaurants," "reading").
- **Extract actual meaningful context:** Analyze what the user is actually doing or interested in. For example, "User loves Italian food" should yield tags like `["italian", "food"]` or `["pasta", "cuisine"]`—not vague categories like `["food", "user_preference"]`.
- **Prefer concrete over abstract:** Tags must reference specific activities, objects, places, or interests present in the text. Avoid meta-tags or category labels that don't convey actionable information.

**Tagging Process (Logical Steps)**
- **1. Normalize the text:** Convert the event text to a normalized form for analysis (lowercasing, basic punctuation trimming, preserving named entities). This is purely preparatory and not a source of additional facts.
- **2. Strip generic 'User' prefix and noise:** Remove generic qualifiers like "User," "User loves," "User enjoys." Look for the *core content* after these prefixes. For example: "User loves Italian food" → extract "Italian" and "food," not "User" or vague category labels.
- **3. Identify salient tokens/phrases:** Extract the most prominent nouns, noun phrases, activities, places, and expressed sentiments that are explicitly present in the event text. Prioritize concrete things (objects, places, activities, genres, cuisines, interests) over abstract meta-categories.
- **4. Rank candidate cues by explicitness and concreteness:** Score candidates by how explicitly they appear in the context and how specific they are. Strong signals include: direct nouns (anime, coffee, pasta, restaurants), direct verbs of emotion or preference (loves, hates, prefers), and specific attributes (Italian, dark roast, sci-fi). Penalize generic words like "user," "preference," "behavior," "habit."
- **5. Select top 2–3 candidates:** Choose the highest-scoring 2–3 cues as tags. If only one clear cue exists, produce a single tag. If two concrete cues are clearly present, produce two. Only produce a third tag when it adds distinct and relevant topical information.
- **6. Prefer topical/semantic tags over vague emotions:** When the context names specific objects or activities (e.g., "anime", "restaurants", "reading"), prefer those concrete tags. Only include emotion tags (e.g., "excited") if the emotional state is the primary focus of the event.
- **7. Avoid inference and aggregation:** Do not infer additional emotional states or categories beyond what the text supports. Do not aggregate across multiple events; treat each event independently. Stick strictly to what is explicitly stated in the summary.

**Tag Types and Examples**
- **Topic/Domain tags:** Capture the specific subject matter (e.g., anime, food, travel, reading, coffee, restaurants).
- **Activity tags:** Capture a concrete action or habit (e.g., reading, walking, cooking, watching).
- **Attribute/Style tags:** Capture specific qualities (e.g., italian, dark roast, sci-fi, 45-minutes).
- **Object/Entity tags:** Capture important nouns when they define the context (e.g., pasta, guitar, coffee, novel).
- **Emotion/valence tags:** Use *only* when the emotional state is the primary focus, not as filler (e.g., excited, anxious).

**Real examples from user data (corrected tagging):**
- Summary: "User sees watch anime sometimes during the weekend." → Tags: `["anime", "weekend"]` (not "learning" — not explicit; not "user" — that's noise).
- Summary: "User loves Italian food, especially pasta." → Tags: `["italian", "pasta"]` or `["food", "italian"]` (not just "food" — extract the type).
- Summary: "User always have coffee in the morning." → Tags: `["coffee", "morning"]` (concrete activity and time).
- Summary: "User enjoys reading sci-fi novels." → Tags: `["reading", "sci-fi"]` (not "books" — specify the genre).
- Summary: "User prefer dark roast coffee, black." → Tags: `["coffee", "dark-roast"]` (specify the type/style).
- Summary: "User walk for about 45 minutes every morning." → Tags: `["walking", "morning"]` (concrete activity and timing).
- Summary: "User loves trying new restaurants and cuisines." → Tags: `["restaurants", "food"]` or `["dining", "cuisine"]` (extract actual topics, not "adventure").
- Summary: "User always read for 30 minutes before bed." → Tags: `["reading", "bedtime"]` (concrete activity and context).

**Common Mistakes to Avoid**
- **DO NOT include "user" as a tag.** It is always present and conveys no useful information. Focus on the *action*, *object*, or *topic* instead.
- **DO NOT use vague category labels** like "preference," "behavior," "habit," or "learning" unless they are the *only* explicit content. These are meta-tags, not meaningful tags.
- **DO NOT infer emotions or categories** that aren't explicitly stated. If the summary says "User enjoys reading," tag `["reading"]`, not `["reading", "learning"]` (learning is inferred).
- **DO NOT tag generic qualifiers.** Words like "sometimes," "always," "about," "new," "dark," "quiet" rarely stand alone as tags unless they are part of the core meaning (e.g., "dark roast" where "dark roast" is the actual coffee type).
- **DO extract specific genres, types, and attributes.** "sci-fi" is better than "books"; "italian" is better than "food"; "dark roast" is better than "coffee."

**Constraints and Edge Cases**
- **Ambiguous text:** If the event contains multiple minor cues but no dominant topics, choose 1–2 tags that best represent the likely focus; prefer topics over tenuous emotion labels.
- **Compound events:** When the event includes two clearly distinct topics, produce two tags—one per topic—rather than a third catch-all tag.
- **Neutral or factual statements:** If text is purely factual with no topical focus, generate a single, descriptive tag reflecting the subject (e.g., "appointment", "preference-change").
- **No tagging when empty:** If the event text is empty or contains only noise, leave the tag list empty rather than guessing.

**Integration Notes for `Mem0_ai_organizer`**
- Apply these rules at the point where the organizer finalizes event metadata. The tag generation should run after the event summary is cleaned and validated, and before any merge or clustering operations that might combine multiple events.
- Store tags alongside the event entry as a small list (2–3 items). Downstream consumers should expect concise, context-bound labels.

**Quality Control**
- When evaluating generated tags, check that each tag can be traced back to explicit words or phrases in the original event text.
- Reject tags that rely on inference, unrelated history, or external knowledge not present in the event.

**Goal**
- Keep tags minimal, precise, and strictly faithful to the event text so they provide fast, reliable semantic cues to downstream features (search, filtering, clustering) without introducing noise from over-generalized emotion inference.
