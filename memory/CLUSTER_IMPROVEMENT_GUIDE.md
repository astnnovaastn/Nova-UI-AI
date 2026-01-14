**Cluster Improvement Guide**

- **Purpose**: Practical, actionable guidance to improve clustering in `nova_ai_memory.json` using `New_memory_event.json` as source of truth for new/updated events.
- **Audience**: Engineers maintaining `Mem0` organizer and cluster code, data engineers validating vectors, and QA engineers writing tests.

**Overview**:
- **Problem**: Clusters in `nova_ai_memory.json` are informative but brittle: missing vectors, stale centroid vectors, inconsistent `dominant_tags`, and events marked as enhanced but missing emotional tags cause cluster quality problems.
- **Goal**: Make clusters more coherent and robust by combining vector-based clustering with semantic/tag augmentation, and put safe operational processes in place (validation, backups, metrics, rollbacks).

**High-Level Strategy**:
- **Validate** memory and vector data first (schema, types, vector lengths).
- **Augment** event data with domain tags (`emotion_tags`, `category`) when vectors are missing or weak.
- **Group** events (hybrid): primary grouping by dominant tag (semantic), refine with vector similarity inside each group, and optionally merge small groups using agglomerative clustering.
- **Compute** stable centroids and coherence score (average pairwise similarity) for each cluster.
- **Persist** cluster updates atomically with a backup of `nova_ai_memory.json`.

**Detailed Steps**:
- **1. Validate Files and Schema**:
  - **Files**: `nova_ai_memory.json`, `New_memory_event.json`.
  - **Checks**: valid JSON, `memory_engine.memory_events` exists, `vector_index` keys numeric lists, all vectors have consistent dimensionality.
  - **Fail-safe**: if JSON invalid, create a `.repair` copy and do not overwrite the original; surface a clear error to logs.

- **2. Ensure Vector Index Consistency**:
  - **Normalize** each vector to floats and consistent length. If vectors of variable length are found, try to infer or pad with zeros but mark them as low-confidence.
  - **Backfill**: for events lacking vectors, derive a lightweight vector using TF-IDF or embed the summary using an inexpensive model; tag these vectors as `derived_vector: true` and use a lower similarity weight.

- **3. Enrich Semantic Tags**:
  - **Compute** or verify `emotional_context.emotion_tags` for each event (use the existing `_generate_emotion_tags()` or a simplified rule-based fallback).
  - **Dominant Tag**: choose dominant tag = first `emotion_tag` if present, else `category` or fallback `'general'`.
  - **Normalize tags** (lowercase, replace spaces with underscore) to keep cluster keys consistent.

- **4. Hybrid Grouping Approach**:
  - **Primary grouping**: group event IDs by `dominant_tag`.
  - **Secondary refinement**: within each tag-group, compute pairwise cosine similarity (vector space). Split group into subclusters if low intra-group coherence is detected.
  - **Merge rules**: if two clusters have centroid similarity > merge threshold (e.g., 0.85) and share semantic overlap (Jaccard of tags >= 0.5), merge them.

- **5. Centroid & Coherence Calculation**:
  - **Centroid**: element-wise arithmetic mean of member vectors (only use real vectors; if many events lack vectors, mark centroid as sparse).
  - **Coherence**: average pairwise cosine similarity. Provide fallback 0.0 if insufficient vectors.
  - **Member_count** and **average_confidence**: average `emotional_context.confidence` across members.

- **6. Update Cluster Metadata**:
  - **Fields**: `topic`, `label`, `centroid_vector`, `event_ids`, `coherence_score`, `last_updated`, `metadata.dominant_tags`, `metadata.cluster_type`, `metadata.member_count`, `metadata.average_confidence`, `insights`.
  - **Timestamps**: use latest `timestamp` of member events for `last_updated` and `creation_timestamp` for new clusters.

- **7. Atomic Save and Backup**:
  - Save the updated file to a temporary path, validate JSON, then atomically replace `nova_ai_memory.json`. Keep a timestamped backup in `backups/`.
  - Example: write to `nova_ai_memory.json.tmp`, validate, rename original to `backups/nova_ai_memory.YYYYMMDD_HHMMSS.json`, then rename `.tmp` to final.

- **8. Scheduling & Orchestration**:
  - Run full re-clustering as a scheduled batch (e.g., nightly or on demand when `New_memory_event.json` changes).
  - For live systems, run incremental cluster updates when new events arrive (recompute only clusters impacted by new events for speed).

**Algorithms & thresholds**:
- **Cosine similarity thresholds**:
  - **member_similarity_split**: 0.4 → if average pairwise similarity < 0.4, split cluster into smaller groups.
  - **merge_clusters_threshold**: 0.85 → merge clusters with highly similar centroids.
  - **assign_to_cluster_threshold**: 0.75 → assign an event to an existing cluster if similarity to centroid >= threshold, else create new cluster.

- **Vector weighting**:
  - If vector is `derived_vector`, weight it by 0.7 in centroid and coherence calculations.
  - If `emotional_context.confidence` < 0.6, downweight the event when computing `average_confidence`.

- **Hybrid scoring for assignment**:
  - score = alpha * vector_similarity + beta * tag_overlap_score
  - Suggested: alpha = 0.7, beta = 0.3

**Implementation blueprint (Python snippets)**:
- Example: improved `recompute_clusters()` (pseudocode + small helper functions).

- **Helper: normalize_tag**:
```python
def normalize_tag(tag: str) -> str:
    return tag.strip().lower().replace(' ', '_')
```

- **Helper: event_dominant_tag**:
```python
def event_dominant_tag(event):
    tags = event.get('emotional_context', {}).get('emotion_tags') or []
    if tags:
        return normalize_tag(tags[0])
    cat = event.get('category') or 'general'
    return normalize_tag(cat)
```

- **Core: recompute_clusters** (outline):
```python
# gather events and ensure vectors
events = mem['memory_engine']['memory_events']
vector_index = mem['memory_engine'].get('vector_index', {})
# ensure vector length consistency, backfill derived vectors if missing
# primary grouping by dominant_tag
groups = defaultdict(list)
for e in events:
    dom = event_dominant_tag(e)
    groups[dom].append(e)

# refine clusters inside each group by vector similarity
for tag, members in groups.items():
    vectors = [(e['event_id'], get_vector(e['event_id'])) for e in members]
    # if many vectors and low coherence -> run agglomerative or kmeans
    # compute centroid = avg(vectors)
    # compute coherence = average pairwise cosine
    # build cluster obj
```

- **Atomic save**:
```python
import json, tempfile, os
with tempfile.NamedTemporaryFile('w', delete=False, dir=dirpath) as tmp:
    json.dump(nova, tmp, indent=2, ensure_ascii=False)
tmp_path = tmp.name
# validate by loading
with open(tmp_path,'r') as f: json.load(f)
# backup and move
shutil.copyfile(original, backup_path)
os.replace(tmp_path, original)
```

**Operational Guidelines / Best Practices**:
- **Testing**: Unit tests for centroid, coherence and cluster merge logic. Use small deterministic examples.
- **Acceptance tests**: Create a `small_nova.json` fixture (10-30 events) and validate cluster shape before/after.
- **Monitoring**: Track `coherence_score` distribution and cluster sizes. Alert when average coherence falls below 0.45.
- **Performance**: For large event sets (>5k), use approximate nearest neighbors (FAISS/Annoy) to compute similarities.
- **Logging**: Log cluster changes (create/merge/split) and keep `update_log` entries inside `memory_engine.update_log` (timestamp, operation, event_ids impacted).
- **Rollback**: Maintain backups in `backups/` for quick rollback and include a `version` in metadata to trace changes.

**Concrete improvements mapped to your files**:
- `New_memory_event.json` provides well-formed events with emotion tags (e.g., `anime`, `food`, `health`) — use these tags to seed dominant tags for `nova_ai_memory.json` clusters.
- For `evt_001..evt_014` in `New_memory_event.json`:
  - Expect clusters: `anime` cluster (evt_001, evt_002, evt_011), `food` cluster (evt_003, evt_005, evt_009, evt_012), `reading` cluster (evt_006, evt_007, evt_008, evt_013), `health/routine` cluster (evt_004, evt_010), `learning` cluster (evt_014).
  - Use the `vector_index` entries as strong signals when available.

**Suggested small tasks to implement immediately**:
- Add a robust `recompute_clusters.py` (idempotent) script that:
  - Validates JSON → merges new events → recomputes clusters using hybrid approach → saves atomically with backup.
- Add unit tests for `average_vectors`, `cosine_similarity`, and `compute_coherence`.
- Add a small incremental updater: when a new event is added, compute its dominant tag and try to assign to the best existing cluster using hybrid scoring; if score < `assign_to_cluster_threshold`, create new cluster.

**Example commands (PowerShell)**:
```
# Run the recompute script
C:/Users/afian/AppData/Local/Programs/Python/Python314/python.exe scripts\recompute_clusters.py

# Run tests (if pytest added)
C:/Users/afian/AppData/Local/Programs/Python/Python314/python.exe -m pytest tests/test_cluster.py
```

**Quality checklist before merge**:
- [ ] JSON validation passes for both files
- [ ] All event vectors have consistent length or marked derived
- [ ] Centroids computed and coherence > 0.4 for most clusters
- [ ] Update_log contains a record of the cluster operation
- [ ] Backups created and accessible

**Next steps I can do for you**:
- Implement and run the recompute script and commit the updated `nova_ai_memory.json`.
- Add unit tests for cluster helpers and run them.
- Add incremental assignment logic into `Mem0_ai_organizer.py`.

---

If you want I can now run the `scripts/recompute_clusters.py` script to produce an updated `nova_ai_memory.json` with improved clusters and provide a diff and report. Tell me to proceed and I will run it and report results.