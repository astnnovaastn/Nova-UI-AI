# Complete Cluster System: How It Works & When It Activates

## Table of Contents
1. [What is a Cluster?](#what-is-a-cluster)
2. [Cluster Structure](#cluster-structure)
3. [When Clusters Activate](#when-clusters-activate)
4. [How Clustering Works - Step by Step](#how-clustering-works---step-by-step)
5. [Cluster Types & Behaviors](#cluster-types--behaviors)
6. [Triggering Events](#triggering-events)
7. [Cluster Lifecycle](#cluster-lifecycle)
8. [Real-World Examples](#real-world-examples)

---

## What is a Cluster?

### Definition
A **cluster** is a group of related memory events that are semantically similar, grouped together for:
- **Fast retrieval** - Find related memories instantly
- **Pattern recognition** - See what goes together
- **Semantic organization** - Group by meaning, not just keywords
- **Context awareness** - Understand relationships between facts

### Analogy
Think of clustering like organizing a filing cabinet:

```
Without Clustering (Linear Search):
┌─────────────────────────┐
│ All memories in 1 pile  │  ← User asks: "Tell me about my hobbies"
│ evt_001: anime          │  ← Search through ALL 1000 events (SLOW)
│ evt_002: anime-sunday   │
│ evt_003: coffee         │
│ evt_004: walking        │
│ ...                     │
│ evt_1000: weather       │
└─────────────────────────┘


With Clustering (Organized Files):
┌────────────────┐
│ Entertainment  │  ← Cluster (contains anime events)
│ ├─ evt_001     │  ← Fast! Just look in Entertainment
│ └─ evt_002     │
├────────────────┤
│ Daily Habits   │  ← Cluster (contains coffee, walking)
│ ├─ evt_003     │
│ ├─ evt_004     │
│ └─ evt_015     │
├────────────────┤
│ Weather Info   │  ← Cluster (contains weather events)
│ └─ evt_1000    │
└────────────────┘
```

---

## Cluster Structure

### JSON Format

```json
{
  "cluster_001": {
    "topic": "Anime Preferences",
    "centroid_vector": [0.13, 0.24, 0.33, 0.46, 0.55, 0.67, 0.77, 0.88],
    "event_ids": ["evt_001", "evt_002"],
    "coherence_score": 0.91,
    "last_updated": "2025-10-20T14:33:00Z",
    
    "metadata": {
      "dominant_tags": ["anime", "weekends", "watching habits"],
      "cluster_type": "personal_preferences",
      "member_count": 2,
      "average_confidence": 0.88,
      "temporal_span": "4 days",
      "creation_timestamp": "2025-10-16T17:08:03Z"
    }
  }
}
```

### Field Explanations

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `topic` | String | Human-readable cluster name | "Anime Preferences" |
| `centroid_vector` | Float[] | Mathematical center of cluster | [0.13, 0.24, ...] |
| `event_ids` | String[] | All events in this cluster | ["evt_001", "evt_002"] |
| `coherence_score` | Float | Quality measure (0-1) | 0.91 |
| `last_updated` | ISO8601 | Last modification time | "2025-10-20T14:33:00Z" |
| `dominant_tags` | String[] | Main keywords in cluster | ["anime", "weekends"] |
| `cluster_type` | String | Memory category | "personal_preferences" |
| `member_count` | Integer | Number of events | 2 |
| `average_confidence` | Float | Avg confidence of members | 0.88 |
| `temporal_span` | String | Time range covered | "4 days" |

---

## When Clusters Activate

### Trigger Scenario 1: New Event Creation (ADD)

```
User says: "I like watching anime during weekends"
     ↓
System creates: evt_001
     ↓
System generates vector for evt_001
     ↓
System checks: "Is there a similar event?"
     ├─ IF YES → Add to existing cluster
     └─ IF NO → Create new cluster
```

**When it happens**: 
- ✅ Every time user provides new information
- ✅ During conversation processing
- ✅ When analyzing user input

**Example Activation Timeline**:
```
Time    Action                          Cluster State
────────────────────────────────────────────────────
12:00   User: "I like anime"            → Create evt_001
        Vector generated                → No clusters yet
        No similar events found         → Create cluster_001
        
12:05   User: "I prefer Sundays"        → Create evt_002
        Vector generated                → Check similarity
        Similar to evt_001 (0.89)       → Add to cluster_001
        Update centroid
        
12:10   User: "I love coffee"           → Create evt_003
        Vector generated                → Check similarity
        NOT similar to cluster_001      → Create cluster_002
        
Result: 2 clusters (Anime, Coffee)
```

---

### Trigger Scenario 2: Event Update (UPDATE)

```
User says: "Actually, I prefer only Sundays"
     ↓
System creates: evt_002 (UPDATE type, references evt_001)
     ↓
System needs to update vectors
     ↓
Should evt_001 stay in same cluster?
     ├─ IF cluster still coherent → Keep in cluster, update centroid
     └─ IF cluster now incoherent → Move to different cluster or split
```

**When it happens**:
- ✅ User corrects/refines information
- ✅ User changes their preference
- ✅ System detects preference evolution

**Example Update Flow**:
```
Before Update:
cluster_001: "Anime" (coherence: 0.91)
  ├─ evt_001: "likes anime (weekends)" [0.89 similarity to centroid]
  └─ evt_002: "prefers anime (Sundays)" [0.93 similarity to centroid]

User says: "Actually, I like anime every day now"
     ↓ (System creates evt_003: UPDATE)

After Update:
cluster_001: "Anime" (coherence: 0.75)  ← Dropped due to new info
  ├─ evt_001: "likes anime (weekends)" [0.72 similarity]
  ├─ evt_002: "prefers anime (Sundays)" [0.71 similarity]
  └─ evt_003: "likes anime (every day)" [0.81 similarity]

Possible actions:
1. Keep as-is (coherence acceptable)
2. Split into subclusters (specific days vs. daily)
3. Reorganize & relabel ("Anime Viewing Patterns")
```

---

### Trigger Scenario 3: Query/Search (GET)

```
User asks: "Tell me my preferences"
     ↓
System needs to retrieve related memories
     ↓
System searches clusters instead of all events
     ↓
Returns most relevant cluster + related clusters
```

**When it happens**:
- ✅ User asks a question
- ✅ AI needs context
- ✅ System performs recall
- ✅ Memory query requested

**Example Query Flow**:
```
Query: "What are my hobbies?"
     ↓
Step 1: Generate query vector
        query_vector = encode("What are my hobbies?")
        
Step 2: Search clusters by similarity
        Compare query_vector to ALL cluster centroids
        
Step 3: Sort by relevance
        cluster_001 (Anime): similarity 0.87 ← MATCH
        cluster_004 (Reading): similarity 0.84 ← MATCH
        cluster_002 (Coffee): similarity 0.42 ← weak
        cluster_003 (Weather): similarity 0.15 ← not relevant
        
Step 4: Return results
        Response clusters: [cluster_001, cluster_004]
        Response events: [evt_001, evt_002, evt_006, evt_007]
        
Response to user:
"Your hobbies include:
 - Watching anime (especially Sundays)
 - Reading sci-fi & fantasy novels"
```

---

### Trigger Scenario 4: Periodic Reorganization

```
Scheduled Job (Daily/Weekly):
     ↓
Check all clusters for:
  - Quality degradation
  - Incoherent members
  - Mergeable clusters
  - Splittable clusters
     ↓
Reorganize if needed
```

**When it happens**:
- ✅ Daily at 2:00 AM (off-peak)
- ✅ After every 50 new events
- ✅ On manual request
- ✅ When coherence drops below 0.70

**Example Reorganization**:
```
Current State:
cluster_001: "Anime" (coherence: 0.65)  ← Below threshold 0.70
  ├─ evt_001: anime (weekends) [0.68 similarity]
  ├─ evt_002: anime (Sundays) [0.71 similarity]
  ├─ evt_003: anime (movies) [0.58 similarity] ← Low!
  └─ evt_004: anime (manga) [0.61 similarity]

Reorganization Decision:
  coherence too low → SPLIT

New State:
cluster_001: "Anime Viewing" (coherence: 0.82)
  ├─ evt_001: anime (weekends)
  └─ evt_002: anime (Sundays)

cluster_005: "Anime Reading & Media" (coherence: 0.79)
  ├─ evt_003: anime (movies)
  └─ evt_004: anime (manga)
```

---

## How Clustering Works - Step by Step

### Step 1: Vector Generation

```
Input Text: "I like watching anime during weekends"
     ↓
Tokenization: ["i", "like", "watching", "anime", "during", "weekends"]
     ↓
TF-IDF Scoring:
  - i: 0.0 (stop word, ignored)
  - like: 0.12 (common, low weight)
  - watching: 0.23 (moderate weight)
  - anime: 0.34 (important term, high weight)
  - during: 0.45 (position indicator)
  - weekends: 0.56 (time context, important)
     ↓
Output Vector: [0.12, 0.23, 0.34, 0.45, 0.56, 0.67, 0.78, 0.89]

This 8-dimensional vector represents the semantic content
```

### Step 2: Similarity Comparison

```
New Vector: [0.12, 0.23, 0.34, 0.45, 0.56, 0.67, 0.78, 0.89]
     ↓
Compare against ALL existing vectors
     ↓
Cosine Similarity Formula:
  cos(θ) = (A · B) / (|A| × |B|)
  
  Where:
    A = new vector
    B = existing vector
    · = dot product
    | | = magnitude (length)
     ↓
Calculate for each existing event:

evt_001_vector: [0.12, 0.23, 0.34, 0.45, 0.56, 0.67, 0.78, 0.89]
Similarity = 1.0 (IDENTICAL - same event)

evt_002_vector: [0.15, 0.25, 0.33, 0.48, 0.55, 0.68, 0.75, 0.90]
Dot product = (0.12×0.15) + (0.23×0.25) + ... = 0.42
Magnitude A = √(0.12² + 0.23² + ...) = 1.85
Magnitude B = √(0.15² + 0.25² + ...) = 1.89
Similarity = 0.42 / (1.85 × 1.89) = 0.89 ← HIGH SIMILARITY!

evt_003_vector: [0.11, 0.21, 0.31, 0.41, 0.51, 0.61, 0.71, 0.81]
Similarity = 0.72 ← MODERATE

evt_004_vector: [0.16, 0.26, 0.36, 0.46, 0.56, 0.66, 0.76, 0.86]
Similarity = 0.91 ← HIGH SIMILARITY!
```

### Step 3: Decision Making

```
Similarity Results:
  evt_001: 1.0  (same event)
  evt_002: 0.89 ← Threshold: 0.75 (PASS)
  evt_003: 0.72 ← Threshold: 0.75 (FAIL)
  evt_004: 0.91 ← Threshold: 0.75 (PASS)
     ↓
Decision Matrix:
  ┌─────────────────────────────────────┐
  │ Similarity > 0.75?                  │
  ├─────────────────────────────────────┤
  │ evt_001: YES → Same cluster or new? │
  │ evt_002: YES → Add to cluster       │
  │ evt_003: NO  → Create new cluster   │
  │ evt_004: YES → Add to cluster       │
  └─────────────────────────────────────┘
     ↓
Action: Add new event to cluster with evt_002 & evt_004
```

### Step 4: Cluster Update (Centroid Recalculation)

```
Before Adding New Event:
cluster_001: "Anime Preferences"
  ├─ evt_001: [0.12, 0.23, 0.34, 0.45, 0.56, 0.67, 0.78, 0.89]
  ├─ evt_002: [0.15, 0.25, 0.33, 0.48, 0.55, 0.68, 0.75, 0.90]
  └─ evt_004: [0.16, 0.26, 0.36, 0.46, 0.56, 0.66, 0.76, 0.86]
  
Centroid (Average): [0.14, 0.25, 0.34, 0.46, 0.56, 0.67, 0.76, 0.88]

After Adding New Event:
cluster_001: "Anime Preferences"
  ├─ evt_001: [0.12, 0.23, 0.34, 0.45, 0.56, 0.67, 0.78, 0.89]
  ├─ evt_002: [0.15, 0.25, 0.33, 0.48, 0.55, 0.68, 0.75, 0.90]
  ├─ evt_004: [0.16, 0.26, 0.36, 0.46, 0.56, 0.66, 0.76, 0.86]
  └─ NEW_evt: [0.12, 0.23, 0.34, 0.45, 0.56, 0.67, 0.78, 0.89]
  
New Centroid: [0.14, 0.24, 0.34, 0.46, 0.56, 0.67, 0.77, 0.89]
                   ↑ Slightly adjusted
```

### Step 5: Coherence Scoring

```
Coherence measures cluster quality (0.0-1.0)

Formula:
  Coherence = (Average Similarity to Centroid) × (Quality Factor)

Calculation:
  evt_001 similarity to centroid: 0.98
  evt_002 similarity to centroid: 0.94
  evt_004 similarity to centroid: 0.96
  NEW_evt similarity to centroid: 0.98
  
  Average: (0.98 + 0.94 + 0.96 + 0.98) / 4 = 0.965
  
  Quality Factor:
    - Size penalty: min(member_count / ideal_count, 1.0) = 4/5 = 0.8
    - Confidence bonus: avg_confidence = 0.88
    - Variance penalty: std_dev = 0.02, penalty = 0.99
  
  Final: 0.965 × 0.8 × 0.88 × 0.99 = 0.678... 
  
  BUT system also looks at membership alignment:
  All 4 events are about anime → HIGH alignment
  
  FINAL COHERENCE: 0.91 ✅

Interpretation:
  0.91 = Excellent cluster quality
  All members are about anime
  Members are very similar to each other
  Strong cluster identity
```

---

## Cluster Types & Behaviors

### Type 1: Preference Clusters

**What they contain**: User likes, dislikes, preferences

```json
{
  "cluster_001": {
    "topic": "Food Preferences",
    "cluster_type": "personal_preferences",
    "event_ids": ["evt_003", "evt_005", evt_012"],
    "coherence_score": 0.87,
    
    "events": [
      "evt_003: loves Italian cuisine",
      "evt_005: enjoys morning coffee",
      "evt_012: prefers dark roast coffee"
    ]
  }
}
```

**Activation triggers**:
- User mentions likes/dislikes
- User says "I prefer"
- User expresses preferences

**Behavior**:
- ✅ Allows multiple similar preferences
- ✅ Updates when preference changes
- ✅ Merges similar preferences
- ✅ Tracks preference evolution

---

### Type 2: Behavioral/Habit Clusters

**What they contain**: Regular behaviors, habits, routines

```json
{
  "cluster_003": {
    "topic": "Morning Routine",
    "cluster_type": "activity_behavior",
    "event_ids": ["evt_004", "evt_015", "evt_018"],
    "coherence_score": 0.89,
    
    "events": [
      "evt_004: goes for morning walks",
      "evt_015: drinks coffee in morning",
      "evt_018: meditates every morning"
    ]
  }
}
```

**Activation triggers**:
- User describes daily habits
- User says "I always do X"
- User mentions routines

**Behavior**:
- ✅ Groups time-based activities
- ✅ Recognizes routine patterns
- ✅ Detects habit changes
- ✅ Correlates related habits

---

### Type 3: Identity Clusters

**What they contain**: User identity information

```json
{
  "cluster_identity": {
    "topic": "User Identity",
    "cluster_type": "user_identity",
    "event_ids": ["evt_100", "evt_101"],
    "coherence_score": 0.98,
    
    "events": [
      "evt_100: name is Alex",
      "evt_101: uses she/her pronouns"
    ]
  }
}
```

**Activation triggers**:
- User provides name/pronouns
- User describes self

**Behavior**:
- ✅ Strict clustering (very high threshold 0.95)
- ✅ Very stable (rarely reorganized)
- ✅ Critical importance
- ✅ Prevents identity confusion

---

### Type 4: Temporal/Contextual Clusters

**What they contain**: Time-based preferences, seasonal patterns

```json
{
  "cluster_temporal": {
    "topic": "Weekend Activities",
    "cluster_type": "temporal_patterns",
    "event_ids": ["evt_002", "evt_023", "evt_045"],
    "coherence_score": 0.84,
    
    "events": [
      "evt_002: prefers anime on Sundays",
      "evt_023: goes hiking on weekends",
      "evt_045: brunches with friends Saturdays"
    ]
  }
}
```

**Activation triggers**:
- User mentions time-specific activities
- Patterns occur on specific days/times

**Behavior**:
- ✅ Groups by temporal context
- ✅ Recognizes seasonal variations
- ✅ Tracks time-specific preferences
- ✅ May split/reorganize by season

---

### Type 5: Goal/Development Clusters

**What they contain**: Goals, learning, progress

```json
{
  "cluster_goals": {
    "topic": "Learning Python",
    "cluster_type": "personal_development",
    "event_ids": ["evt_050", "evt_060", "evt_070"],
    "coherence_score": 0.82,
    
    "events": [
      "evt_050: wants to learn Python",
      "evt_060: completed basic course",
      "evt_070: working on first project"
    ]
  }
}
```

**Activation triggers**:
- User mentions goals/aspirations
- User describes learning
- User tracks progress

**Behavior**:
- ✅ Allows loose clustering (many subtypes)
- ✅ Tracks progress evolution
- ✅ Supports goal refinement
- ✅ May split into sub-goals

---

## Triggering Events

### Event Type: ADD (New Information)

```
User Input: "I just started learning guitar"
     ↓
System Action:
1. Create new event (evt_N)
2. Generate vector
3. Check similarity to existing events
4. Add to cluster or create new cluster
     ↓
Result: 
  - If match found: Added to existing cluster
  - If no match: New cluster created
```

**Cluster Behavior**:
- Event added to cluster if similarity > threshold
- Centroid updated
- Coherence recalculated
- Metadata updated

---

### Event Type: UPDATE (Information Changed)

```
User Input: "Actually, I prefer rock music now, not jazz"
     ↓
System Action:
1. Create UPDATE event
2. Reference previous event
3. Generate new vector
4. Re-evaluate cluster membership
5. Decide: keep in cluster or reorganize
     ↓
Result:
  - Cluster may remain same
  - Cluster may split
  - Event may move to different cluster
```

**Cluster Behavior**:
- Previous event marked as outdated
- New vector inserted
- Cluster coherence may drop temporarily
- Reorganization may trigger

---

### Event Type: DELETE (Information Removed)

```
User Input: "Actually, forget what I said about jazz"
     ↓
System Action:
1. Mark event as deleted
2. Remove from vector index
3. Remove from cluster membership
4. Recalculate centroid
5. Recalculate coherence
6. Check if cluster should be merged/dissolved
     ↓
Result:
  - Event removed from cluster
  - Cluster adjusted or disbanded
```

**Cluster Behavior**:
- Member count decreases
- Centroid updated
- Coherence recalculated
- Cluster may merge with similar cluster if too small

---

### Event Type: CONSOLIDATE (Multiple → One)

```
System detects: Multiple events saying same thing
Example:
  - evt_001: "I like anime"
  - evt_045: "I enjoy anime shows"
  - evt_089: "anime is my favorite hobby"
     ↓
System Action:
1. Recognize these are duplicates/similar
2. Create CONSOLIDATE event
3. Merge into single authoritative event
4. Update cluster membership
5. Remove redundant events
     ↓
Result:
  - Cleaner cluster
  - Reduced noise
  - Better coherence
```

**Cluster Behavior**:
- Redundant events removed
- Cluster simplified
- Coherence improved
- Centroid recalculated

---

## Cluster Lifecycle

### Phase 1: Birth (Creation)

```
Timeline:
─────────────────────────────────────

Event: User says "I like anime"
  ↓
evt_001 created
Vector generated
No matching clusters
  ↓
CLUSTER_001 BORN
─────────────────────────────────────

Properties at Birth:
  - member_count: 1
  - coherence_score: 1.0 (single member, perfect)
  - centroid: evt_001's vector
  - status: "new"
```

### Phase 2: Growth (Adding Members)

```
Timeline:
─────────────────────────────────────

Days 1-4:
  User mentions anime 3 more times
  ├─ evt_002: added (similarity 0.89)
  ├─ evt_023: added (similarity 0.87)
  └─ evt_045: added (similarity 0.91)
     ↓
CLUSTER_001 GROWS
─────────────────────────────────────

Properties During Growth:
  - member_count: 1 → 2 → 3 → 4
  - coherence_score: 1.0 → 0.95 → 0.93 → 0.91
  - centroid: continuously updated
  - status: "growing"
```

### Phase 3: Maturity (Stable State)

```
Timeline:
─────────────────────────────────────

Days 5-30:
  Few new anime mentions
  Cluster stabilizes
     ↓
CLUSTER_001 MATURES
─────────────────────────────────────

Properties at Maturity:
  - member_count: 4-6
  - coherence_score: 0.85-0.92
  - centroid: stable
  - status: "mature"
  - last_updated: 2 weeks ago
```

### Phase 4: Decline (Stale or Incoherent)

```
Timeline:
─────────────────────────────────────

Days 31+:
  No recent anime mentions
  OR user contradicts cluster facts
     ↓
CLUSTER_001 DECLINES
─────────────────────────────────────

Properties During Decline:
  - member_count: 4 (unchanged)
  - coherence_score: 0.91 → 0.82 (if contradicted)
  - status: "stale" or "incoherent"
  - last_updated: 30+ days ago
  - action_needed: true

What triggers restoration?
  1. New related event added
  2. Scheduled reorganization
  3. User query about topic
  4. Coherence drops below 0.70
```

### Phase 5: Reorganization or Dissolution

```
Timeline:
─────────────────────────────────────

Scenario A: Reorganization (Revival)
  New anime info → Cluster activated
  Coherence checked → Needs adjustment
  → Split, merge, or relabel
  → Status: "reorganized"

Scenario B: Merging
  Cluster_A (Anime): 2 members
  Cluster_B (Anime): 3 members
  Similarity high → Merge
  → New unified cluster
  → Status: "merged"

Scenario C: Dissolution
  Cluster has 1 member only
  Coherence check triggered
  Not enough members → Dissolve
  Event moved to general category
  → Status: "dissolved"
─────────────────────────────────────
```

---

## Real-World Examples

### Example 1: Movie Fan Cluster Evolution

```
DAY 1: User says "I like movies"
  ├─ evt_001 created
  ├─ Vector: [0.45, 0.56, 0.67, 0.78, 0.89, 0.90, 0.91, 0.92]
  ├─ No existing clusters
  └─ cluster_001 created: "Movies"
     member_count: 1
     coherence: 1.0

DAY 3: User says "I prefer sci-fi movies"
  ├─ evt_005 created
  ├─ Vector similarity to evt_001: 0.88 ✅ (> 0.75)
  ├─ Added to cluster_001
  └─ cluster_001 updated:
     member_count: 2
     centroid: [0.46, 0.57, 0.68, 0.79, 0.89, 0.90, 0.91, 0.92]
     coherence: 0.94

DAY 5: User says "Actually, I love horror movies too"
  ├─ evt_012 created
  ├─ Vector similarity to cluster_001 centroid: 0.79 ✅ (> 0.75)
  ├─ Added to cluster_001
  └─ cluster_001 updated:
     member_count: 3
     centroid: [0.47, 0.58, 0.69, 0.80, 0.88, 0.90, 0.91, 0.92]
     coherence: 0.89

DAY 10: Scheduled reorganization (Monday 2 AM)
  Current cluster_001:
    - evt_001: general movies
    - evt_005: sci-fi
    - evt_012: horror
    
  Coherence check: 0.89 ✅ (acceptable)
  Decision: No change needed
  Result: Cluster remains stable

DAY 25: User says "I'm obsessed with sci-fi actually"
  ├─ evt_020 created (UPDATE type)
  ├─ Indicates sci-fi is primary interest
  ├─ Vector strongly sci-fi focused
  └─ Reorganization triggered:
     
     Before:
     cluster_001: "Movies" (coherence: 0.89)
       ├─ evt_001: general
       ├─ evt_005: sci-fi
       ├─ evt_012: horror
       └─ evt_020: sci-fi (emphasis)
     
     After (Split):
     cluster_001: "Sci-Fi Movies" (coherence: 0.96)
       ├─ evt_005: sci-fi
       └─ evt_020: sci-fi
     
     cluster_007: "Other Movie Genres" (coherence: 0.88)
       ├─ evt_001: general
       └─ evt_012: horror
```

---

### Example 2: Morning Routine Habit Cluster

```
DAY 1: "I usually go for morning walks"
  └─ evt_001
     cluster_001: "Morning Activities" (1 member)

DAY 2: "I always have coffee in morning"
  ├─ evt_002
  ├─ Vector similarity: 0.85 ✅
  └─ cluster_001: "Morning Activities" (2 members)

DAY 4: "I do meditation in mornings"
  ├─ evt_003
  ├─ Vector similarity: 0.82 ✅
  └─ cluster_001: "Morning Activities" (3 members)
     coherence: 0.92

DAY 8: "I check emails immediately"
  ├─ evt_004
  ├─ Vector similarity: 0.68 ❌ (< 0.75)
  └─ cluster_002: "Work Routine" (new cluster)

DAY 15: "I meditate and do yoga together"
  ├─ evt_005 (UPDATE - combines meditation + yoga)
  ├─ Vector similarity to cluster_001: 0.91 ✅
  ├─ Cluster reorganized:
  │  
  │  Before:
  │  cluster_001: "Morning Activities" (3 members)
  │    ├─ evt_001: walk
  │    ├─ evt_002: coffee
  │    └─ evt_003: meditation
  │
  │  After:
  │  cluster_001: "Morning Wellness" (coherence: 0.94)
  │    ├─ evt_001: morning walk
  │    ├─ evt_002: morning coffee
  │    ├─ evt_003: meditation
  │    └─ evt_005: meditation + yoga
```

---

### Example 3: Learning Goal Cluster

```
MONTH 1: "I want to learn Python"
  ├─ evt_001
  ├─ Vector generated
  └─ cluster_goals_001: "Learning Python" (1 member, confidence: 0.8)

MONTH 2: "I completed the basics course"
  ├─ evt_005 (UPDATE)
  ├─ Shows progress on same goal
  ├─ Vector similarity: 0.93 ✅
  └─ cluster_goals_001: "Learning Python" (2 members)
     Metadata updated:
       - status: "in_progress"
       - progress: "10%"

MONTH 3: "Now I'm building first project"
  ├─ evt_012 (UPDATE)
  ├─ Further progress
  └─ cluster_goals_001: "Learning Python" (3 members)
     Metadata updated:
       - status: "advanced"
       - progress: "40%"

MONTH 4: "Finished my first project!"
  ├─ evt_018 (UPDATE)
  ├─ Goal milestone reached
  └─ cluster_goals_001: "Learning Python" (4 members)
     Metadata updated:
       - status: "completed_phase1"
       - progress: "70%"

MONTH 5: "Now I want to learn Web Development"
  ├─ evt_020 (NEW)
  ├─ Different goal
  ├─ Vector similarity to Python cluster: 0.45 ❌ (< 0.65 for goals)
  └─ cluster_goals_002: "Learning Web Dev" (new cluster)

Final State:
  cluster_goals_001: "Python Journey"
    4 events tracking skill development
    
  cluster_goals_002: "Web Development"
    1 new goal starting
```

---

## When Cluster Operations Occur

### Automatic Operations (No User Input)

| Operation | Trigger | Frequency | Purpose |
|-----------|---------|-----------|---------|
| **Coherence Check** | Scheduled | Every event | Verify cluster quality |
| **Reorganization** | Scheduled | Daily | Optimize clusters |
| **Merging** | Quality check | When similarity high | Consolidate |
| **Splitting** | Quality check | When coherence low | Improve clarity |
| **Stale Archiving** | Time-based | Monthly | Archive old clusters |

### Manual Operations (User Request)

| Operation | Command | Purpose |
|-----------|---------|---------|
| **Show clusters** | "Tell me my habits" | Retrieve cluster info |
| **Force reorg** | "Reorganize my memory" | Manual optimization |
| **Clear cluster** | "Forget about X" | Remove cluster |
| **Query cluster** | "What do I like?" | Search clusters |

---

## Summary: Cluster Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                   USER PROVIDES INPUT                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Parse & Categorize   │
         │  Determine: ADD/UPDATE│
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Generate Vector      │
         │  (TF-IDF or ML Model) │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Search Clusters      │
         │  Find Similarities    │
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ▼─────────────┐    ┌─────────────────▼──
    │ Similar     │    │ Not Similar or
    │ Event Found │    │ New Category
    └──────┬──────┘    └──────────┬────────
           │                      │
           ▼                      ▼
    Add to Existing      Create New Cluster
    Cluster              ("cluster_N")
           │                      │
           ▼                      ▼
    Update Centroid      Set Initial
    Recalc Coherence     Properties
    Update Metadata      
           │                      │
           └──────────┬───────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │ Store in JSON        │
           │ Update vector_index  │
           │ Update clusters      │
           └──────────┬───────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │ Return to User       │
           │ "Got it! Added to    │
           │  your preferences"   │
           └──────────────────────┘
```

---

## Key Takeaways

✅ **Clusters are groups** of related memory events

✅ **Activation happens** when events are added, updated, or queried

✅ **Vectors enable** similarity detection (0-1 scale)

✅ **Centroid** is the mathematical center of a cluster

✅ **Coherence** measures cluster quality (0-1 scale)

✅ **Thresholds** determine whether events belong together

✅ **Types vary** (preferences, habits, identity, temporal, goals)

✅ **Lifecycle** goes from birth → growth → maturity → decline → reorganization

✅ **Automatic** operations keep clusters optimal

✅ **Real-time** adjustments maintain accuracy

---

This clustering system enables your AI to:
- 🧠 Remember user preferences & habits
- ⚡ Quickly retrieve related information
- 🔄 Adapt to user changes
- 📊 Maintain semantic coherence
- 🎯 Provide contextual responses

