You are managing a memory system that stores user-related events under the key "memory_events".

Each memory event may include one or more of the following keys:
- "Added_preference_likes"
- "Added_preference_dislikes"
- "Added_preference_avoid"
- "Added_preference_love"
- "Added_preference_hate"

Your task:
1. The system must ensure that there are no duplicate preference entries across "memory_events".
2. A duplicate is defined as any event where the value of an "Added_preference_*" field is identical (ignoring capitalization or spacing) to one already stored.
3. If a duplicate is detected, ignore the new entry and keep only the first occurrence.
4. When adding new memory events, perform a check across all existing ones before insertion.
5. Do not merge or alter existing entries — just skip duplicates silently.
6. Always preserve timestamps, provenance, and other contextual fields for unique events.

Example:
If two events contain:
    "Added_preference_avoid": "avoids to eat a lod of food the weekend"
The second instance should be ignored, leaving only the first.

Final rule:
The "memory_events" array should always contain only **unique preference entries** based on their "Added_preference_*" values.
