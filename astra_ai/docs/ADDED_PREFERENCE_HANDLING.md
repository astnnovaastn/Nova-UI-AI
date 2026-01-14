Added preference handling in NovaMemoryAI

Overview
- When memory events of type `ADD` or `UPDATE` have fields prefixed with `Added_preference_...`, the memory synchronization routine treats these as personal preference statements rather than generic facts.
- These preferences are stored under `fact_history.personal_preferences` grouped by a subcategory (e.g., `Added_preference_likes`, `Added_preference_loves`, `Added_preference_hates`).
- The system maps common singular verb forms to canonical plural categories (for example, `Added_preference_like` → `likes`).

Behavior details
- Detection:
  - Any event field name that starts with `Added_preference_` is considered a preference indicator.
  - The substring after `Added_preference_` is used as the preference type (e.g., `Added_preference_like` → `like`).

- Subcategory resolution:
  - The first `Added_preference_*` field found determines the subcategory.
  - The code maps common singular verbs to plural categories using this mapping:
    - `like` → `likes`
    - `love` → `loves`
    - `enjoy` → `enjoys`
    - `hate` → `hates`
    - `dislike` → `dislikes`
    - `prefer` → `prefers`
  - If no mapping is found, the raw substring is used as the subcategory.

- Storage structure
- Personal preferences are stored under `data["fact_history"]["personal_preferences"][<subcategory>]` as a list of entries. Each entry contains:
  - `item`: the textual item (from the event `current_value` or `summary`).
  - `added`: the date the preference was added (YYYY-MM-DD).
  - `updated` (optional): the date the preference was updated (YYYY-MM-DD).
  - `score`: a confidence/importance score (from the event `confidence` or `importance_score`).
  - `provenance`: a list of provenance objects (currently one per originating event). Each provenance object contains:
    - `source_event_type`: the event type (e.g., `ADD`, `UPDATE`).
    - `source_event_field`: the originating `Added_preference_*` field name.
    - `source_event_id`: the event id that produced this provenance.
    - `enhanced_in_place`: boolean flag (set to `false` for automated sync additions).
    - `enhanced_at`: ISO timestamp of when the preference was added to `fact_history`.

Notes on deduplication and updates
- When adding a preference, the synchronizer will skip duplicates (same `item` in the same subcategory).
- When updating an event that corresponds to an existing preference, the synchronizer tries to find and update the matching `item` (case-insensitive). If not found, it will add a new entry.
- Original `fact_history` entries keyed by `event_id` are also updated for consistency (when applicable).

Example JSON (preference event)
{
  "event_id": "evt_12345678",
  "type": "ADD",
  "category": "personal_preferences",
  "Added_preference_like": true,
  "current_value": "Sushi",
  "confidence": 0.92
}

After synchronization, `fact_history.personal_preferences.likes` will include an entry similar to:

{
  "item": "Sushi",
  "added": "2025-11-10",
  "score": 0.92,
  "provenance": [
    {
      "source_event_type": "ADD",
      "source_event_field": "Added_preference_like",
      "source_event_id": "evt_12345678",
      "enhanced_in_place": false,
      "enhanced_at": "2025-11-10T14:23:10.123456"
    }
  ]
}

Implementation notes
- The synchronizer uses the first `Added_preference_*` field discovered on an event to determine subcategory. If multiple such fields are present, the first one is used.
- Dates are stored in `YYYY-MM-DD` for `added`/`updated` fields and a full ISO timestamp for provenance `enhanced_at`.
- The code appends provenance entries; clients reading `fact_history` can inspect provenance to trace back to source events.

If you want different provenance fields, stricter deduplication, or a different timestamp format, tell me which format you'd prefer and I can update the implementation accordingly.
