# 🧠 Nova AI Organizer

The **Nova AI Organizer (Mem0_ai_organizer.py)** is the intelligence layer that sits on top of the memory system.  
It does not create new memories — instead, it **improves, cleans, and manages** the ones your system captures.  

---

## 🚀 Features
- **Enrichment** → Rewrites raw summaries into richer, more human-like insights.  
- **Deletion** → Removes old, unused, or low-value memories while logging `DELETE` events.  
- **Consolidation** → Merges repeating events into smart summaries.  
- **Context Awareness** → Keeps important identity facts while pruning trivial ones.  

onsolidation (Summarize patterns)

Instead of keeping 10 small logs, it merges them into one summary fact.

Example:

Raw logs → “Rich jogged Monday.”, “Rich jogged Wednesday.”, “Rich jogged Friday.”

Consolidated → “Rich jogs three times a week, maintaining a consistent fitness routine.”

Deletes the smaller logs automatically once summarized.

---

## ⚙️ Memory Event Types
The Organizer works with these event types in the JSON file:

- `ADD` → New memory was captured.  
- `UPDATE` → Existing memory was changed.  
- `DELETE` → Memory was removed by Organizer rules.  
- `GET` → Memory retrieved for use.  
- `FORGET` → User explicitly asked to delete something.  
- `CONSOLIDATE` → Multiple small events were merged.  

---

## 🧹 Cleanup Rules
The Organizer deletes memories based on **retention policy**:

- `ephemeral` → auto-deletes after 7 days.  
- `contextual` → auto-deletes after 8-9 days if unused.  
- `permanent` → never deleted unless contradicted.  
- `importance_score` < 0.3 → pruned first.  
- Conflicting facts → old ones deleted immediately.  

---

## 🔄 Example Flow

### Input (Raw Memory System Output)
```json
{
  "type": "ADD",
  "summary": "User jogged on Monday.",
  "timestamp": "2025-09-01T10:00:00Z",
  "retention_policy": "ephemeral",
  "importance_score": 0.2
}
Output (After AI Organizer)
json
Copia codice
{
  "type": "DELETE",
  "summary": "Removed outdated activity: Rich jogged on Monday.",
  "timestamp": "2025-09-20T12:30:00Z",
  "reason": "Expired after 7 days (ephemeral).",
  "archived": true
}

Deletion → Removes expired, unused, or low-value memories while logging a DELETE event.

Expired memories are not just marked — they are actually removed from nova_ai_memory.json.

Deleted memories can also be archived in nova_ai_archive.json.

Consolidation (Summarize Patterns) → Merges small repetitive logs into a single, meaningful fact.

Example:

Logs → “Rich jogged Monday.”, “Rich jogged Wednesday.”, “Rich jogged Friday.”

Consolidated → “Rich jogs three times a week, maintaining a consistent fitness routine.”

Old redundant logs are automatically deleted once summarized.

Context Awareness → Keeps critical identity facts while pruning trivial or outdated details.

Separates short-term context (e.g., tasks, events) from long-term identity (e.g., goals, skills).

Supports multi-identity (student, developer, gamer) and tracks changes over time.