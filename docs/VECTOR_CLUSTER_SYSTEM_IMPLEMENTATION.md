# High-Quality Vector Clustering System — Complete Implementation Guide

**Goal:** Create a fast, efficient, and semantically coherent clustering system that intelligently groups user events, handles conflicts/updates smartly, and enables rapid searches without fragmentation.

---

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Vector Creation (Phase 1)](#vector-creation-phase-1)
3. [Cluster Formation (Phase 2)](#cluster-formation-phase-2)
4. [Event Update Logic (Phase 3)](#event-update-logic-phase-3)
5. [Conflict Resolution (Phase 4)](#conflict-resolution-phase-4)
6. [Performance & Quality Optimization (Phase 5)](#performance--quality-optimization-phase-5)
7. [Example Workflows](#example-workflows)
8. [Implementation Checklist](#implementation-checklist)

---

## System Architecture

```
User Input
    ↓
[1. Intent Detection] → Extract intent, category, sentiment, conflicts
    ↓
[2. Vector Generation] → Encode using SentenceTransformer (384D semantic vector)
    ↓
[3. Existing Cluster Search] → Find best matching cluster(s) by cosine similarity
    ↓
[4. Decision Gate]
    ├─→ [Merge to Cluster] → If similarity > merge_threshold (0.55)
    │   ├─ Add event to cluster
    │   ├─ Update centroid
    │   ├─ Recompute coherence
    │   └─ Handle conflicts if sentiment contradicts cluster
    │
    ├─→ [Update Event] → If exact category/item already exists
    │   ├─ Preserve original event ID
    │   ├─ Update `sentiment`, `confidence`, `previous_value` → `current_value`
    │   ├─ Recompute vector (new embedding from updated summary)
    │   ├─ Update cluster membership
    │   ├─ Move to conflicting cluster if sentiment changed
    │   └─ Log update in update_log
    │
    └─→ [Create New Cluster] → If no good match
        ├─ Generate new cluster ID
        ├─ Initialize with single event
        ├─ Set centroid = event vector
        ├─ Compute coherence = 1.0 (single event)
        └─ Wait for new events to merge in
    ↓
[5. Storage] → Persist to JSON (vector_index, clusters, update_log)
    ↓
[6. Post-Process] → Optimize clusters (merge similar, split incoherent)
```

---

## Vector Creation (Phase 1)

### Goal
Encode event summaries into dense, semantically meaningful vectors that capture intent, context, and emotional tone.

### Current State (BAD)
- 8D sparse vectors from hash-based approach.
- No semantic understanding → high fragmentation.
- Example: two "football" events have low similarity despite same topic.

### Improved State (GOOD)
- 384D vectors from SentenceTransformer (`all-MiniLM-L6-v2`).
- Semantic encoding: "I like playing football" and "I don't like playing football" have high similarity but opposite sentiments (captured separately).
- Normalized to unit length for fast cosine similarity.

### Implementation

**Step 1: Install dependencies**
```bash
pip install sentence-transformers numpy scikit-learn
```

**Step 2: Create vector generator**

Create `astra_ai/memory/vector_engine.py`:

```python
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Tuple

class VectorEngine:
    """High-quality semantic vector generation using pre-trained transformers."""
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        """
        Initialize vector engine with SentenceTransformer model.
        
        Args:
            model_name: HuggingFace model ID. Options:
                - "sentence-transformers/all-MiniLM-L6-v2" (384D, fast, good quality)
                - "sentence-transformers/all-mpnet-base-v2" (768D, slower, better quality)
                - "sentence-transformers/paraphrase-MiniLM-L6-v2" (384D, specialized for paraphrasing)
        """
        self.model = SentenceTransformer(model_name)
        self.vector_dim = self.model.get_sentence_embedding_dimension()
        print(f"[VectorEngine] Initialized with {model_name}, dimension={self.vector_dim}")
    
    def encode_event(self, event_summary: str, category: str = "", 
                     emotion_tags: List[str] = None) -> np.ndarray:
        """
        Encode a single event into a dense semantic vector.
        
        Args:
            event_summary: Event text (e.g., "I enjoy playing football every weekend with friends")
            category: Event category for contextual weighting (e.g., "personal_preferences")
            emotion_tags: List of emotion/intent tags (e.g., ["recreation", "social"])
        
        Returns:
            Normalized 384D (or configured dim) numpy array
        """
        # Build augmented input for better encoding
        # Include category and emotion hints to help embedding understand context
        augmented_text = event_summary
        if emotion_tags:
            augmented_text += " [context: " + ", ".join(emotion_tags) + "]"
        if category:
            augmented_text += f" [category: {category}]"
        
        # Generate embedding
        embedding = self.model.encode(augmented_text, convert_to_numpy=True)
        
        # Normalize to unit length (important for cosine similarity stability)
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
        
        return embedding.tolist()  # Return as list for JSON serialization
    
    def batch_encode_events(self, events: List[dict]) -> dict:
        """
        Encode multiple events efficiently in batch mode.
        
        Args:
            events: List of event dicts with 'event_id', 'summary', 'category', 'emotional_context'
        
        Returns:
            Dict mapping event_id → normalized vector
        """
        vectors = {}
        summaries = []
        event_ids = []
        
        for event in events:
            event_id = event.get('event_id')
            summary = event.get('summary', '')
            category = event.get('category', '')
            emotion_tags = event.get('emotional_context', {}).get('emotion_tags', [])
            
            augmented = summary
            if emotion_tags:
                augmented += " [context: " + ", ".join(emotion_tags) + "]"
            if category:
                augmented += f" [category: {category}]"
            
            summaries.append(augmented)
            event_ids.append(event_id)
        
        # Batch encode all at once (faster)
        embeddings = self.model.encode(summaries, convert_to_numpy=True, 
                                      normalize_embeddings=True)
        
        for event_id, embedding in zip(event_ids, embeddings):
            vectors[event_id] = embedding.tolist()
        
        return vectors

# Global instance
_vector_engine = None

def get_vector_engine():
    """Get or create global vector engine instance."""
    global _vector_engine
    if _vector_engine is None:
        _vector_engine = VectorEngine()
    return _vector_engine
```

**Step 3: Update mem0_memory_system.py to use new vector engine**

Find the old embedding function and replace it:

```python
# OLD (in AdvancedClusterEngine)
def _create_embedding_vector(self, text: str) -> List[float]:
    """OLD: Create hash-based 8D vector"""
    # ... sparse hash-based implementation

# NEW
from astra_ai.memory.vector_engine import get_vector_engine

def _create_embedding_vector(self, event: dict) -> List[float]:
    """Create high-quality semantic vector using SentenceTransformer."""
    engine = get_vector_engine()
    vector = engine.encode_event(
        event_summary=event.get('summary', ''),
        category=event.get('category', ''),
        emotion_tags=event.get('emotional_context', {}).get('emotion_tags', [])
    )
    return vector
```

**Quality Metrics:**
- Vector dimension: 384D (vs. 8D old) → **48x more expressive**
- Semantic understanding: YES → captures intent, tone, context
- Similarity correlation: High (related events have high cosine similarity)
- Normalization: Unit length → stable cosine similarity

---

## Cluster Formation (Phase 2)

### Goal
Intelligently group events into semantically coherent clusters that enable fast, accurate searches.

### Key Principles
1. **Merge aggressively (low threshold):** 0.55 instead of 0.65 → combine related events
2. **Centroid-based grouping:** weighted average of member vectors
3. **Coherence gates:** only merge if coherence improves or stays stable
4. **Update existing clusters:** if new event belongs to cluster, add it; don't create duplicate

### Cluster Lifecycle

#### State 1: Empty (Initial)
```json
{
  "cluster_000": {
    "topic": "recreation_activities",
    "label": "Sports & Recreation",
    "centroid_vector": [0.12, 0.34, ...], // Average of member vectors
    "event_ids": ["evt_football_001"],
    "coherence_score": 1.0,
    "member_count": 1,
    "metadata": {
      "dominant_tags": ["recreation", "social"],
      "cluster_type": "preferences",
      "creation_timestamp": "2025-12-09T12:00:00Z"
    }
  }
}
```

#### State 2: Growing (New related events added)
```json
{
  "cluster_000": {
    "topic": "recreation_activities",
    "label": "Sports & Recreation",
    "centroid_vector": [0.15, 0.32, ...], // Updated centroid
    "event_ids": ["evt_football_001", "evt_hiking_002", "evt_tennis_003"],
    "coherence_score": 0.87, // Still good
    "member_count": 3,
    "metadata": {
      "dominant_tags": ["recreation", "social", "outdoor"],
      "average_importance": 0.72
    }
  }
}
```

#### State 3: Conflicting (Contradictory events)
```json
{
  "cluster_000": {
    "topic": "football_sentiment_tracking",
    "label": "Football Activity",
    "centroid_vector": [...], 
    "event_ids": ["evt_football_likes_001", "evt_football_dislikes_002"],
    "coherence_score": 0.65, // Lower due to conflict
    "member_count": 2,
    "metadata": {
      "conflicting_sentiments": {
        "likes": 1,
        "dislikes": 1
      },
      "dominant_tags": ["football", "recreation"],
      "conflict_resolved_at": "2025-12-09T15:00:00Z" // When user clarified
    }
  }
}
```

### Cluster Formation Algorithm

```python
def update_clusters_on_new_event(storage: Dict, event: Dict) -> str:
    """
    Smart cluster assignment: merge to existing or create new.
    
    Returns: cluster_id
    """
    event_id = event['event_id']
    event_vector = storage["memory_engine"]["vector_index"][event_id]
    
    # Step 1: Find best matching cluster by similarity to centroid
    best_cluster_id = None
    best_similarity = 0.0
    clusters = storage["memory_engine"]["clusters"]
    
    for cluster_id, cluster in clusters.items():
        centroid = cluster['centroid_vector']
        similarity = cosine_similarity(event_vector, centroid)
        
        if similarity > best_similarity:
            best_similarity = similarity
            best_cluster_id = cluster_id
    
    # Step 2: Decision gate - merge or create?
    MERGE_THRESHOLD = 0.55  # LOWERED from 0.65
    
    if best_similarity >= MERGE_THRESHOLD and best_cluster_id:
        # MERGE: Add to existing cluster
        cluster = clusters[best_cluster_id]
        
        # Check for conflicts before merging
        if has_sentiment_conflict(event, cluster, storage):
            # Conflicting sentiment: handle carefully (see Conflict Resolution)
            return handle_sentiment_conflict(storage, event, cluster)
        
        # Standard merge: add event, update centroid, recompute coherence
        cluster['event_ids'].append(event_id)
        cluster['member_count'] = len(cluster['event_ids'])
        
        # Recompute centroid (weighted by importance/confidence)
        cluster['centroid_vector'] = compute_weighted_centroid(
            storage, cluster['event_ids']
        )
        
        # Recompute coherence
        cluster['coherence_score'] = calculate_coherence(
            storage, best_cluster_id
        )
        
        # Update metadata
        update_cluster_metadata(storage, best_cluster_id)
        
        return best_cluster_id
    
    else:
        # CREATE: New cluster
        cluster_id = f"cluster_{len(clusters):03d}"
        clusters[cluster_id] = {
            "topic": infer_topic(event),
            "label": infer_label(event),
            "centroid_vector": event_vector,
            "event_ids": [event_id],
            "coherence_score": 1.0,  # Perfect for single event
            "member_count": 1,
            "metadata": {
                "dominant_tags": extract_dominant_tags(event),
                "cluster_type": event.get('category', 'general'),
                "creation_timestamp": event.get('timestamp')
            }
        }
        return cluster_id
```

### Centroid Update (Weighted Average)

```python
def compute_weighted_centroid(storage: Dict, event_ids: List[str]) -> List[float]:
    """
    Compute cluster centroid as weighted average of member vectors.
    
    Weighting:
    - Confidence (0.7 weight): How confident we are in this event
    - Importance (0.3 weight): How important the event is
    
    This prevents low-quality events from pulling centroid away.
    """
    vectors = []
    weights = []
    
    for event_id in event_ids:
        # Get vector
        vector = np.array(storage["memory_engine"]["vector_index"][event_id])
        vectors.append(vector)
        
        # Get weight from event metadata
        event = find_event_by_id(storage, event_id)
        confidence = event.get('confidence', 0.8)
        importance = event.get('importance_score', 0.5)
        
        # Combined weight: 70% confidence + 30% importance
        weight = 0.7 * confidence + 0.3 * importance
        weights.append(weight)
    
    # Compute weighted average
    if sum(weights) == 0:
        # Fallback: simple average if weights are invalid
        centroid = np.mean(vectors, axis=0)
    else:
        weights_array = np.array(weights) / sum(weights)  # Normalize
        centroid = np.average(vectors, axis=0, weights=weights_array)
    
    # Normalize to unit length
    norm = np.linalg.norm(centroid)
    if norm > 0:
        centroid = centroid / norm
    
    return centroid.tolist()
```

### Coherence Calculation (Quality Score)

```python
def calculate_coherence(storage: Dict, cluster_id: str) -> float:
    """
    Measure cluster coherence (0-1) based on:
    1. Pairwise similarity within cluster (events should be similar)
    2. Category consistency (events in same category)
    3. Sentiment consistency (events should have same sentiment)
    4. Importance consistency (avoid mixing high/low importance)
    
    Higher = more coherent cluster.
    """
    cluster = storage["memory_engine"]["clusters"][cluster_id]
    event_ids = cluster['event_ids']
    vectors = [storage["memory_engine"]["vector_index"][eid] for eid in event_ids]
    
    if len(vectors) < 2:
        return 1.0  # Single event cluster is perfectly coherent by definition
    
    # Metric 1: Average pairwise similarity
    similarities = []
    for i in range(len(vectors)):
        for j in range(i+1, len(vectors)):
            sim = cosine_similarity(vectors[i], vectors[j])
            similarities.append(sim)
    
    pairwise_coherence = np.mean(similarities) if similarities else 1.0
    
    # Metric 2: Category consistency
    categories = [find_event_by_id(storage, eid).get('category', 'general') 
                  for eid in event_ids]
    unique_categories = len(set(categories))
    category_coherence = 1.0 - (unique_categories - 1) / len(categories) if len(categories) > 1 else 1.0
    
    # Metric 3: Sentiment consistency
    sentiments = [find_event_by_id(storage, eid).get('emotional_context', {}).get('sentiment', 'neutral')
                  for eid in event_ids]
    unique_sentiments = len(set(sentiments))
    sentiment_coherence = 1.0 - (unique_sentiments - 1) / len(sentiments) if len(sentiments) > 1 else 1.0
    
    # Metric 4: Importance consistency (low variance = high consistency)
    importance_scores = [find_event_by_id(storage, eid).get('importance_score', 0.5)
                        for eid in event_ids]
    avg_importance = np.mean(importance_scores)
    variance = np.var(importance_scores)
    importance_coherence = max(0, 1.0 - variance)
    
    # Combine metrics with weights
    combined_coherence = (
        pairwise_coherence * 0.4 +      # Semantic similarity
        category_coherence * 0.2 +       # Category alignment
        sentiment_coherence * 0.2 +      # Sentiment alignment
        importance_coherence * 0.2       # Importance alignment
    )
    
    return min(1.0, max(0.0, combined_coherence))
```

---

## Event Update Logic (Phase 3)

### Goal
When user provides conflicting or clarifying information, update intelligently without creating duplicates.

### Example Workflow: User Changes Mind About Football

**Timeline:**

**T1: User says "I like playing football"**
```
Input: "I like playing football every weekend"
↓
System creates:
- Event: evt_football_001
- Category: personal_preferences
- Sentiment: positive
- Cluster: cluster_000 (football activities)
```

**T2: User says "Actually, I don't like playing football"**
```
Input: "I don't like playing football anymore"
↓
System detects:
- Same category (personal_preferences)
- Same subject (football)
- CONFLICT: positive → negative sentiment
↓
Options:
A) Create new separate event (BAD - creates duplicate cluster)
B) Update existing event + handle conflict (GOOD)
```

### Implementation: Smart Update Detection

```python
def process_user_input(storage: Dict, user_message: str, context: Dict = None) -> str:
    """
    Process user input and decide: CREATE NEW EVENT or UPDATE EXISTING?
    """
    
    # Step 1: Extract intent from message
    extracted_data = extract_intent_from_message(user_message)
    # Returns: {
    #     "category": "personal_preferences",
    #     "subcategory": "likes",
    #     "item": "playing football",
    #     "sentiment": "negative",  # "I don't like"
    #     "importance": 0.8,
    #     "confidence": 0.85
    # }
    
    # Step 2: Search for EXISTING event with same item in same category
    existing_event = find_existing_event(
        storage,
        category=extracted_data['category'],
        item=extracted_data['item']  # "playing football"
    )
    
    if existing_event:
        # UPDATE existing event
        return update_existing_event(storage, existing_event, extracted_data, user_message)
    else:
        # CREATE new event
        return create_new_event(storage, extracted_data, user_message)


def find_existing_event(storage: Dict, category: str, item: str) -> Optional[Dict]:
    """
    Search for existing event with same category and item.
    Uses fuzzy matching to handle paraphrases (e.g., "football" ≈ "playing football").
    """
    from difflib import SequenceMatcher
    
    for event in storage["memory_engine"]["memory_events"]:
        if event.get('category') != category:
            continue
        
        # Fuzzy match on item/summary
        event_summary = event.get('summary', '').lower()
        item_lower = item.lower()
        
        # Check if item is in summary or summary contains item
        similarity = SequenceMatcher(None, event_summary, item_lower).ratio()
        
        if similarity > 0.7:  # 70% match threshold
            return event
    
    return None


def update_existing_event(storage: Dict, existing_event: Dict, 
                         extracted_data: Dict, user_message: str) -> str:
    """
    Update an existing event with new information.
    
    Changes:
    - previous_value: old sentiment/importance
    - current_value: new sentiment/importance
    - summary: new description
    - timestamp: update time
    - update_log: track change history
    """
    
    event_id = existing_event['event_id']
    cluster_id = find_cluster_containing_event(storage, event_id)
    
    # Preserve previous state
    previous_state = {
        'sentiment': existing_event.get('emotional_context', {}).get('sentiment'),
        'importance': existing_event.get('importance_score'),
        'summary': existing_event.get('summary')
    }
    
    # Update event fields
    new_summary = f"{existing_event.get('summary', '')} [UPDATE: {user_message}]"
    new_sentiment = extracted_data['sentiment']
    new_importance = extracted_data['importance']
    
    existing_event['summary'] = new_summary
    existing_event['emotional_context']['sentiment'] = new_sentiment
    existing_event['importance_score'] = new_importance
    existing_event['confidence'] = extracted_data.get('confidence', 0.85)
    
    # CRITICAL: Re-generate vector with updated summary
    event_copy = dict(existing_event)
    new_vector = get_vector_engine().encode_event(
        event_summary=new_summary,
        category=existing_event.get('category', ''),
        emotion_tags=existing_event.get('emotional_context', {}).get('emotion_tags', [])
    )
    storage["memory_engine"]["vector_index"][event_id] = new_vector
    
    # Step 2: Re-evaluate cluster membership
    #   If sentiment changed significantly, might need to move to different cluster
    
    if should_move_cluster(existing_event, new_sentiment, storage):
        # Move to different cluster
        new_cluster_id = find_best_cluster_for_event(storage, event_id)
        
        if new_cluster_id != cluster_id:
            # Remove from old cluster
            storage["memory_engine"]["clusters"][cluster_id]['event_ids'].remove(event_id)
            
            # Add to new cluster
            storage["memory_engine"]["clusters"][new_cluster_id]['event_ids'].append(event_id)
            
            # Update both clusters
            update_cluster_metadata(storage, cluster_id)
            update_cluster_metadata(storage, new_cluster_id)
            
            cluster_id = new_cluster_id
    
    # Step 3: Update cluster centroid and coherence
    update_cluster_centroid(storage, cluster_id)
    storage["memory_engine"]["clusters"][cluster_id]['coherence_score'] = \
        calculate_coherence(storage, cluster_id)
    
    # Step 4: Log the update
    storage["memory_engine"]["update_log"].append({
        "update_type": "EVENT_UPDATE",
        "operation": "update",
        "event_id": event_id,
        "cluster_id": cluster_id,
        "reason": f"User clarified/corrected: {user_message}",
        "previous_state": previous_state,
        "new_state": {
            "sentiment": new_sentiment,
            "importance": new_importance
        },
        "timestamp": datetime.now().isoformat()
    })
    
    return cluster_id


def should_move_cluster(event: Dict, new_sentiment: str, storage: Dict) -> bool:
    """
    Decide if event should move to a different cluster after update.
    
    Yes if:
    - Sentiment changed AND
    - New sentiment is very different from cluster's average sentiment
    """
    old_sentiment = event.get('emotional_context', {}).get('sentiment', 'neutral')
    
    if old_sentiment == new_sentiment:
        return False  # No change
    
    # Check cluster sentiment (what's the majority sentiment?)
    # If cluster is mostly "positive" and event changed to "negative",
    # it should move to a "negative" cluster
    
    return True  # For now, always re-evaluate
```

### Event Matching Algorithm

```python
def extract_intent_from_message(message: str) -> Dict:
    """
    Extract structured intent from user message.
    
    Example inputs:
    - "I like playing football" 
      → {"category": "personal_preferences", "item": "playing football", "sentiment": "positive"}
    - "I don't like football anymore"
      → {"category": "personal_preferences", "item": "football", "sentiment": "negative"}
    - "Actually, I prefer tennis to football"
      → {"category": "personal_preferences", "item": "tennis", "sentiment": "positive", "comparison": "football"}
    """
    
    # Use NLP/regex to detect:
    # 1. Sentiment indicators: like/love (positive), dislike/hate (negative)
    # 2. Category: preferences, activity, learning, etc.
    # 3. Item: what is the user talking about
    # 4. Importance/confidence: based on modifiers (really, very, kind of, etc.)
    
    positive_indicators = ['like', 'love', 'enjoy', 'prefer', 'adore', 'passion']
    negative_indicators = ['dislike', 'hate', 'avoid', 'don\'t like', 'don\'t enjoy']
    
    message_lower = message.lower()
    
    sentiment = 'neutral'
    if any(ind in message_lower for ind in negative_indicators):
        sentiment = 'negative'
    elif any(ind in message_lower for ind in positive_indicators):
        sentiment = 'positive'
    
    # Determine importance/confidence from modifiers
    importance = 0.5
    if any(mod in message_lower for mod in ['really', 'very', 'absolutely', 'passionate']):
        importance = 0.85
    elif any(mod in message_lower for mod in ['kind of', 'somewhat', 'maybe']):
        importance = 0.5
    
    return {
        "category": "personal_preferences",  # Simplified; real system would detect this
        "item": extract_noun_phrase(message),
        "sentiment": sentiment,
        "importance": importance,
        "confidence": 0.85
    }


def extract_noun_phrase(message: str) -> str:
    """Extract main noun phrase from message using simple heuristics."""
    # Real implementation would use spaCy or NLTK
    # For now, simplified version:
    import re
    # Remove common words, extract key phrase
    stop_words = ['i', 'a', 'the', 'and', 'or', 'but', 'is', 'am', 'are']
    words = [w for w in message.lower().split() if w not in stop_words and len(w) > 2]
    return ' '.join(words[:3]) if words else message
```

---

## Conflict Resolution (Phase 4)

### Goal
Handle conflicting information intelligently (e.g., "I like football" then "I don't like football").

### Conflict Types

| Type | Example | Resolution |
|------|---------|------------|
| **Direct Contradiction** | "I like X" → "I don't like X" | Update event, track history, move to opposite sentiment cluster |
| **Temporal Update** | "I like football" (T1) → "I don't like football anymore" (T2) | Mark T1 as outdated, promote T2, merge into sentiment-tracking cluster |
| **Qualification** | "I like football" → "I only like football on weekends" | Add qualifier to event, refine cluster topic |
| **Preference Evolution** | User preferences change over time | Track evolution separately, maintain historical clusters |

### Implementation

```python
def has_sentiment_conflict(new_event: Dict, cluster: Dict, storage: Dict) -> bool:
    """
    Detect if new event conflicts with cluster's dominant sentiment.
    """
    new_sentiment = new_event.get('emotional_context', {}).get('sentiment', 'neutral')
    
    # Get cluster's dominant sentiment
    cluster_sentiments = []
    for event_id in cluster['event_ids']:
        event = find_event_by_id(storage, event_id)
        sentiment = event.get('emotional_context', {}).get('sentiment', 'neutral')
        cluster_sentiments.append(sentiment)
    
    from collections import Counter
    dominant_sentiment = Counter(cluster_sentiments).most_common(1)[0][0]
    
    if new_sentiment != dominant_sentiment and new_sentiment != 'neutral':
        return True
    
    return False


def handle_sentiment_conflict(storage: Dict, new_event: Dict, 
                             cluster: Dict) -> str:
    """
    Handle conflicting sentiment gracefully.
    
    Strategy: Create a "conflict tracking" cluster that contains both positive/negative
    versions of the same item, enabling easy comparison and history viewing.
    """
    
    new_sentiment = new_event.get('emotional_context', {}).get('sentiment')
    item_name = extract_item_name(new_event)
    
    # Option 1: Create a special "sentiment tracking" cluster
    conflict_cluster_id = find_or_create_conflict_cluster(
        storage, item_name, cluster['metadata']['cluster_type']
    )
    
    # Add new event to conflict cluster
    storage["memory_engine"]["clusters"][conflict_cluster_id]['event_ids'].append(
        new_event['event_id']
    )
    
    # Update cluster metadata with conflict info
    if 'conflicting_events' not in storage["memory_engine"]["clusters"][conflict_cluster_id]['metadata']:
        storage["memory_engine"]["clusters"][conflict_cluster_id]['metadata']['conflicting_events'] = {
            'positive': [],
            'negative': []
        }
    
    storage["memory_engine"]["clusters"][conflict_cluster_id]['metadata']['conflicting_events'][new_sentiment].append(
        new_event['event_id']
    )
    
    # Lower coherence to reflect conflict
    storage["memory_engine"]["clusters"][conflict_cluster_id]['coherence_score'] = \
        calculate_coherence(storage, conflict_cluster_id)
    
    # Log the conflict
    storage["memory_engine"]["update_log"].append({
        "update_type": "CONFLICT_DETECTED",
        "operation": "conflict_resolution",
        "event_id": new_event['event_id'],
        "cluster_id": conflict_cluster_id,
        "reason": f"Sentiment conflict detected: {new_sentiment} contradicts cluster sentiment",
        "timestamp": datetime.now().isoformat()
    })
    
    return conflict_cluster_id


def find_or_create_conflict_cluster(storage: Dict, item_name: str, 
                                   cluster_type: str) -> str:
    """Find existing conflict cluster or create new one."""
    
    # Search for conflict cluster with name pattern: "sentiment_tracking_{item}"
    for cluster_id, cluster in storage["memory_engine"]["clusters"].items():
        if cluster['metadata'].get('is_conflict_cluster'):
            if item_name.lower() in cluster['label'].lower():
                return cluster_id
    
    # Create new conflict cluster
    conflict_cluster_id = f"cluster_conflict_{len(storage['memory_engine']['clusters']):03d}"
    storage["memory_engine"]["clusters"][conflict_cluster_id] = {
        "topic": f"sentiment_tracking_{item_name}",
        "label": f"Sentiment: {item_name} (Pos/Neg)",
        "centroid_vector": [0] * 384,  # Will be updated
        "event_ids": [],
        "coherence_score": 1.0,
        "member_count": 0,
        "metadata": {
            "is_conflict_cluster": True,
            "tracked_item": item_name,
            "cluster_type": cluster_type,
            "conflicting_events": {"positive": [], "negative": []}
        }
    }
    
    return conflict_cluster_id
```

---

## Performance & Quality Optimization (Phase 5)

### Goal
Ensure system runs fast, produces high-quality clusters, and maintains performance at scale.

### Optimization Strategies

#### 1. Lazy Clustering (Post-Processing)

Instead of recomputing all clusters immediately, batch updates and optimize periodically.

```python
def optimize_clusters_batch(storage: Dict, max_iterations: int = 3) -> Dict:
    """
    Run cluster optimization: merge similar, split incoherent, clean up fragmented.
    """
    metrics_before = compute_clustering_metrics(storage)
    
    for iteration in range(max_iterations):
        # Merge similar clusters
        merged_count = merge_similar_clusters(storage, threshold=0.75)
        
        # Split incoherent clusters
        split_count = split_incoherent_clusters(storage, coherence_threshold=0.5)
        
        # Remove empty/junk clusters
        removed_count = remove_empty_clusters(storage)
        
        if merged_count + split_count + removed_count == 0:
            break  # Converged
    
    metrics_after = compute_clustering_metrics(storage)
    
    return {
        "metrics_before": metrics_before,
        "metrics_after": metrics_after,
        "improvement": calculate_improvement(metrics_before, metrics_after)
    }


def merge_similar_clusters(storage: Dict, threshold: float = 0.75) -> int:
    """Merge clusters with centroid similarity > threshold."""
    clusters = storage["memory_engine"]["clusters"]
    merged = 0
    cluster_ids = list(clusters.keys())
    
    for i in range(len(cluster_ids)):
        for j in range(i+1, len(cluster_ids)):
            cluster1_id = cluster_ids[i]
            cluster2_id = cluster_ids[j]
            
            if cluster1_id not in clusters or cluster2_id not in clusters:
                continue
            
            centroid_sim = cosine_similarity(
                clusters[cluster1_id]['centroid_vector'],
                clusters[cluster2_id]['centroid_vector']
            )
            
            if centroid_sim > threshold:
                # Merge cluster2 into cluster1
                clusters[cluster1_id]['event_ids'].extend(
                    clusters[cluster2_id]['event_ids']
                )
                clusters[cluster1_id]['member_count'] = len(
                    clusters[cluster1_id]['event_ids']
                )
                clusters[cluster1_id]['centroid_vector'] = \
                    compute_weighted_centroid(storage, clusters[cluster1_id]['event_ids'])
                
                del clusters[cluster2_id]
                merged += 1
    
    return merged
```

#### 2. Caching and Index

Store computed similarities and metrics to avoid recalculation.

```python
class ClusterCache:
    """Cache for cluster similarity scores and metrics."""
    
    def __init__(self):
        self.similarity_cache = {}  # (cluster_id1, cluster_id2) → similarity
        self.coherence_cache = {}   # cluster_id → coherence_score
        self.event_cluster_map = {} # event_id → cluster_id
    
    def invalidate_cluster(self, cluster_id: str):
        """Invalidate cache for a cluster after modification."""
        # Remove all entries for this cluster
        self.similarity_cache = {k: v for k, v in self.similarity_cache.items()
                                if cluster_id not in k}
        self.coherence_cache.pop(cluster_id, None)
    
    def get_similarity(self, cluster_id1: str, cluster_id2: str, 
                      compute_fn, *args) -> float:
        """Get cached or compute similarity."""
        key = tuple(sorted([cluster_id1, cluster_id2]))
        if key not in self.similarity_cache:
            self.similarity_cache[key] = compute_fn(*args)
        return self.similarity_cache[key]
```

#### 3. Progressive Encoding (Incremental Updates)

For new events, only re-encode that event, not entire dataset.

```python
def add_event_incrementally(storage: Dict, new_event: Dict):
    """Add single event without full recompute."""
    
    # Step 1: Encode new event only
    vector = get_vector_engine().encode_event(
        new_event.get('summary', ''),
        new_event.get('category', ''),
        new_event.get('emotional_context', {}).get('emotion_tags', [])
    )
    storage["memory_engine"]["vector_index"][new_event['event_id']] = vector
    
    # Step 2: Find best cluster for new event
    best_cluster_id = find_best_cluster_for_event_fast(storage, new_event['event_id'])
    
    # Step 3: Update only affected cluster(s)
    update_clusters_on_new_event(storage, new_event)
    
    # Mark cache as needing update
    invalidate_affected_clusters(storage, [best_cluster_id])
```

#### 4. Quality Metrics

```python
def compute_clustering_metrics(storage: Dict) -> Dict:
    """Compute clustering health metrics."""
    events = storage["memory_engine"]["memory_events"]
    clusters = storage["memory_engine"]["clusters"]
    
    fragmentation_ratio = len(clusters) / max(len(events), 1)
    
    coherence_scores = [c.get('coherence_score', 0.8) for c in clusters.values()]
    avg_coherence = np.mean(coherence_scores) if coherence_scores else 0.0
    
    single_item = sum(1 for c in clusters.values() if len(c.get('event_ids', [])) == 1)
    single_item_ratio = single_item / max(len(clusters), 1)
    
    cluster_sizes = [len(c.get('event_ids', [])) for c in clusters.values()]
    avg_cluster_size = np.mean(cluster_sizes) if cluster_sizes else 1.0
    
    return {
        "total_events": len(events),
        "total_clusters": len(clusters),
        "fragmentation_ratio": fragmentation_ratio,
        "avg_coherence": avg_coherence,
        "single_item_ratio": single_item_ratio,
        "avg_cluster_size": avg_cluster_size,
        "timestamp": datetime.now().isoformat()
    }


# Quality Thresholds
QUALITY_TARGETS = {
    "fragmentation_ratio": 0.3,        # Target: 1 cluster per 3 events (< 0.33)
    "avg_coherence": 0.75,             # Target: 75% coherence
    "single_item_ratio": 0.1,          # Target: <10% single-item clusters
    "avg_cluster_size": 5.0            # Target: average 5 events per cluster
}
```

---

## Example Workflows

### Workflow 1: User Expresses Interest (Create)

```
T1: User says "I like playing football every weekend"

System flow:
1. Extract: {item: "football", sentiment: "positive", category: "personal_preferences", importance: 0.85}
2. Search for existing event with "football" in same category → NOT FOUND
3. Create new event:
   - event_id: evt_football_001
   - summary: "I like playing football every weekend with friends"
   - sentiment: positive
   - importance: 0.85
4. Encode with SentenceTransformer → vector (384D)
5. Search clusters for match → similarity = 0.2 (no good match)
6. Create new cluster:
   - cluster_000: {topic: "recreation", label: "Sports Activities", member_count: 1}
7. Store event → vector_index, clusters, update_log
```

### Workflow 2: User Changes Mind (Update)

```
T2: User says "Actually, I don't like football anymore, it's boring"

System flow:
1. Extract: {item: "football", sentiment: "negative", category: "personal_preferences", importance: 0.7}
2. Search for existing event with "football" → FOUND: evt_football_001
3. Update existing event:
   - previous_value: {sentiment: "positive", summary: "..."}
   - current_value: {sentiment: "negative", summary: "..."}
   - confidence: 0.9 (user explicitly clarified)
4. Re-encode updated event → new vector
5. Check for cluster move:
   - Old cluster: mostly "positive"
   - New sentiment: "negative"
   → Move to different cluster or create conflict cluster
6. Update cluster memberships:
   - Remove from cluster_000 (positive sports)
   - Add to cluster_conflict_001 (sentiment tracking: football)
7. Update centroids and coherence scores
8. Log: EVENT_UPDATE + CLUSTER_REORGANIZATION
```

### Workflow 3: New Event Related to Existing Cluster (Merge)

```
T3: User says "I also enjoy hiking on weekends"

System flow:
1. Extract: {item: "hiking", sentiment: "positive", category: "personal_preferences", importance: 0.8}
2. Search for existing event → NOT FOUND
3. Create new event: evt_hiking_001
4. Encode → vector (384D)
5. Search clusters:
   - cluster_000 (recreation): similarity = 0.78 (high!)
   - cluster_conflict_001: similarity = 0.2
6. Best match: cluster_000 with similarity 0.78 > threshold 0.55
7. MERGE:
   - Add evt_hiking_001 to cluster_000
   - Update centroid: average of [football_vector, hiking_vector]
   - Recompute coherence: 0.89 (still good!)
   - Update metadata: member_count = 2, dominant_tags = ["recreation", "outdoor"]
8. Result: cluster_000 now contains 2 related events
```

---

## Implementation Checklist

- [ ] **Phase 1: Vector Engine**
  - [ ] Install SentenceTransformer dependency
  - [ ] Create `vector_engine.py` with `VectorEngine` class
  - [ ] Implement `encode_event()` and `batch_encode_events()`
  - [ ] Update `mem0_memory_system.py` to use new engine
  - [ ] Test: encode 5 events, verify vector quality (cosine sim between related events > 0.7)

- [ ] **Phase 2: Cluster Formation**
  - [ ] Update merge threshold from 0.65 → 0.55
  - [ ] Implement `compute_weighted_centroid()` with importance/confidence weighting
  - [ ] Implement `calculate_coherence()` with 4 metrics (similarity, category, sentiment, importance)
  - [ ] Update `update_clusters_on_new_event()` to use new thresholds
  - [ ] Test: add 10 events, verify fragmentation drops

- [ ] **Phase 3: Event Update Logic**
  - [ ] Implement `find_existing_event()` with fuzzy matching
  - [ ] Implement `update_existing_event()` to preserve history and re-encode
  - [ ] Implement cluster move logic when sentiment changes
  - [ ] Test: update event, verify cluster membership updates

- [ ] **Phase 4: Conflict Resolution**
  - [ ] Implement `has_sentiment_conflict()` detector
  - [ ] Implement `handle_sentiment_conflict()` with conflict tracking
  - [ ] Create conflict cluster structure
  - [ ] Test: add conflicting events, verify conflict cluster created

- [ ] **Phase 5: Optimization**
  - [ ] Implement `optimize_clusters_batch()` with merge/split logic
  - [ ] Implement `ClusterCache` for fast similarity lookups
  - [ ] Implement `compute_clustering_metrics()` and quality thresholds
  - [ ] Create reporting script
  - [ ] Test: measure performance before/after optimization

- [ ] **Integration**
  - [ ] Regenerate all vectors for existing events with SentenceTransformer
  - [ ] Run `recompute_clusters.py` with new settings
  - [ ] Verify fragmentation drops from 1.0 → ~0.3
  - [ ] Verify average coherence improves to > 0.75

---

## Expected Results After Implementation

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Fragmentation Ratio | 1.0 | 0.3–0.4 | < 0.33 |
| Avg Coherence | 1.0* | 0.80–0.85 | > 0.75 |
| Single-Item Clusters | 100% | 10–15% | < 10% |
| Avg Cluster Size | 1.0 | 4–6 | > 5 |
| Search Time** | O(n) | O(log n) | Fast |

*Single-event clusters artificially perfect  
**With indexing and caching

---

## References

- SentenceTransformers: https://www.sbert.net/
- Clustering metrics: https://scikit-learn.org/stable/modules/clustering.html
- Semantic similarity: https://en.wikipedia.org/wiki/Cosine_similarity

---

**Status:** Ready for implementation  
**Last Updated:** 2025-12-09  
**Author:** System Analysis
