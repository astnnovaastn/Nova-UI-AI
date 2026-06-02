# Nova Memory AI System - Memory Event Adding Guide

## Overview

This guide explains how to properly add new memory events to the Nova Memory AI system, following the exact specifications documented in the system requirements. The memory system is built around a comprehensive event-based architecture with 27 distinct memory categories.

## Memory System Architecture

### Core Components

1. **Memory Events** - Structured records of user information with complete metadata
2. **Vector Index** - Embedding vectors for similarity search
3. **Clusters** - Groupings of related events for fast lookup
4. **Fact History** - Historical tracking of facts with timestamps
5. **Memory Categories** - 27-category framework for organizing information

### Supported Event Types

- **ADD**: Create new memory entries
- **UPDATE**: Modify existing memory entries
- **DELETE**: Remove memory entries
- **GET**: Retrieve memory entries
- **CONSOLIDATE**: Merge related entries
- **CONFIRM**: Reinforce existing entries
- **FORGET**: Mark entries for cleanup

## Memory Event Structure

## Key Features

### 1. Vector-Based Similarity Detection
- Each memory event is converted to an embedding vector
- Cosine similarity is used to detect similar or duplicate events
- Prevents redundant memory creation
- Enables intelligent UPDATE operations instead of ADD operations
- Supports semantic understanding of user preferences

### 2. Clustering System
- Related memory events are grouped into semantic clusters
- Each cluster has a centroid vector representing the group
- Enables fast retrieval of related information
- Maintains coherence scores for cluster quality
- Supports temporal reasoning about user preferences

### 4. Continuous Enhancement
- AIOrganizer continuously monitors memory_events for enhancement opportunities
- Automatically improves grammar, clarity, and context of memory entries
- Prevents duplicate entries through intelligent detection
- Merges similar preferences into consolidated entries
- Applies semantic embeddings for better similarity detection

Every memory event must include these required fields:

### Required Fields for ALL Event Types

```json
{
  "event_id": "Unique identifier (e.g., evt_xxxxxxxx)",
  "type": "Event type (ADD, UPDATE, DELETE, etc.)",
  "summary": "Human-readable summary of the event",
  "timestamp": "ISO format timestamp",
  "emotional_context": {
    "sentiment": "positive, negative, or neutral",
    "emotion_tags": ["excited", "proud", "anxious", etc.],
    "emotional_intensity": "0.0 to 1.0",
    "mood_context": "normal, celebratory, challenging, etc.",
    "confidence": "Confidence in emotional analysis (0.0 to 1.0)"
  },
  "semantic_context": "Semantic analysis of the content",
  "importance_score": "Numerical importance rating (0.0-1.0)",
  "confidence": "Confidence in the information (0.0-1.0)",
  "category": "One of the 27 memory categories",
  "subcategory": "Specific subcategory within the category",
  "previous_value": "Previous value (null for ADD events)",
  "current_value": "Current/new value",
  "provenance": {
    "enhanced_in_place": "Boolean indicating in-place enhancement",
    "enhanced_at": "Timestamp of enhancement",
    "source_info": {
      "source_type": "Origin of the information",
      "source_details": "Additional source information",
      "context": "Context where the information was provided",
      "event_index": "Index in the event sequence"
    },
    "source_conversation_timestamp": "Timestamp of original conversation"
  }
}
```

### Additional Fields for Specific Event Types

#### ADD Events
```json
{
  "Added_preference": "String value of the added preference",
  "context": "Optional context string (if available)"
}
```

#### UPDATE Events
```json
{
  "semantic_context": {
    "related_facts": ["List of related event IDs"],
    "confidence_score": "0.0 to 1.0 similarity score",
    "context_type": "preference_update, refinement, etc.",
    "semantic_tags": ["Tags describing semantic meaning"],
    "similarity_hash": "Hash for similarity detection"
  },
  "provenance": {
    // ... (standard provenance fields)
    "original_summary": "Summary from previous value",
    "cleanup_operation": "Type of cleanup performed"
  }
}
```



## How to Add Memory Events

### Method 1: Direct File Manipulation

1. **Load the current memory file**
```python
import json

with open('astra_ai/Date/nova_ai_memory.json', 'r') as f:
    memory_data = json.load(f)
```

2. **Create a properly formatted event**
```python
import uuid
from datetime import datetime

# Generate unique event ID
event_id = f"evt_{uuid.uuid4().hex[:8]}"
timestamp = datetime.now().isoformat()

# Create event with all required fields
new_event = {
    "event_id": event_id,
    "type": "ADD",
    "summary": "User enjoys hiking in mountain trails",
    "timestamp": timestamp,
    "emotional_context": {
        "sentiment": "positive",
        "emotion_tags": ["interest", "outdoors"],
        "emotional_intensity": 0.7,
        "mood_context": "normal",
        "confidence": 0.9
    },
    "semantic_context": "Inferred from input: 'I love hiking in the mountains'",
    "importance_score": 0.75,
    "confidence": 0.9,
    "category": "personal_preferences",
    "subcategory": "likes",
    "previous_value": None,
    "current_value": "enjoys hiking in mountain trails",
    "provenance": {
        "enhanced_in_place": True,
        "enhanced_at": timestamp,
        "source_info": {
            "source_type": "conversation",
            "source_details": "chat input",
            "context": "User: I love hiking in the mountains",
            "event_index": len(memory_data.get("memory_events", []))
        },
        "source_conversation_timestamp": timestamp
    },
    "Added_preference": "mountain hiking"
}
```

3. **Add to memory events**
```python
if "memory_events" not in memory_data:
    memory_data["memory_events"] = []

memory_data["memory_events"].append(new_event)
```

4. **Update fact history**
```python
if "fact_history" not in memory_data:
    memory_data["fact_history"] = {}

if "personal_preferences" not in memory_data["fact_history"]:
    memory_data["fact_history"]["personal_preferences"] = {}

if "likes" not in memory_data["fact_history"]["personal_preferences"]:
    memory_data["fact_history"]["personal_preferences"]["likes"] = []

memory_data["fact_history"]["personal_preferences"]["likes"].append({
    "item": "enjoys hiking in mountain trails",
    "added": datetime.now().strftime('%Y-%m-%d'),
    "score": 0.9
})
```

5. **Save the updated memory**
```python
with open('astra_ai/Date/nova_ai_memory.json', 'w') as f:
    json.dump(memory_data, f, indent=2)
```

### Method 2: Using the Memory System API

1. **Initialize the memory system**
```python
from astra_ai.memory.mem0_memory_system import NovaMemoryAI

memory_system = NovaMemoryAI("astra_ai/Date/nova_ai_memory.json")
```

2. **Create and add events using system methods**
```python
# The system automatically handles proper formatting
event_id = memory_system.add_event(
    user_id="usr_001",
    text="User enjoys hiking in mountain trails",
    session_id=memory_system.data.get("current_session")
)
```

## Best Practices

### 1. Always Include All Required Fields
Never omit required fields. The system validates the presence of all required fields.

### 2. Use Proper Category Classification
Select the most appropriate category and subcategory from the 27-category framework.

### 3. Maintain Semantic Consistency
Ensure that UPDATE events semantically relate to their previous values.

### 4. Provide Accurate Confidence Scores
Use realistic confidence scores based on the reliability of the source.

### 5. Include Complete Provenance Information
Always include complete source information for traceability.

### 6. Respect Privacy Levels
Follow privacy settings for sensitive information.

### 7. Update Related Structures
When adding events, also update:
- Vector index for similarity search
- Clusters for grouping related events
- Fact history for historical tracking

## Example Complete ADD Event

```json
{
  "event_id": "evt_a1b2c3d4",
  "type": "ADD",
  "summary": "User enjoys reading science fiction novels",
  "timestamp": "2025-10-21T14:30:00Z",
  "emotional_context": {
    "sentiment": "positive",
    "emotion_tags": ["interest", "reading"],
    "emotional_intensity": 0.6,
    "mood_context": "normal",
    "confidence": 0.85
  },
  "semantic_context": "Inferred from input: 'I love reading sci-fi novels.'",
  "importance_score": 0.7,
  "confidence": 0.85,
  "category": "personal_preferences",
  "subcategory": "likes",
  "previous_value": null,
  "current_value": "enjoys reading science fiction novels",
  "provenance": {
    "enhanced_in_place": true,
    "enhanced_at": "2025-10-21T14:30:00Z",
    "source_info": {
      "source_type": "conversation",
      "source_details": "chat input",
      "context": "User: I love reading sci-fi novels.",
      "event_index": 15
    },
    "source_conversation_timestamp": "2025-10-21T14:30:00Z"
  },
  "Added_preference": "sci-fi reading"
}
```

## Example Complete UPDATE Event

```json
{
  "event_id": "evt_e5f6g7h8",
  "type": "UPDATE",
  "summary": "User now prefers reading science fiction and fantasy novels",
  "timestamp": "2025-10-21T15:45:00Z",
  "emotional_context": {
    "sentiment": "positive",
    "emotion_tags": ["interest", "reading"],
    "emotional_intensity": 0.7,
    "mood_context": "happy",
    "confidence": 0.88
  },
  "semantic_context": {
    "related_facts": ["evt_a1b2c3d4"],
    "confidence_score": 0.87,
    "context_type": "preference_update",
    "semantic_tags": ["books", "genre"],
    "similarity_hash": "bcd12345"
  },
  "importance_score": 0.7,
  "confidence": 0.88,
  "category": "personal_preferences",
  "subcategory": "likes",
  "previous_value": "enjoys reading science fiction novels",
  "current_value": "enjoys reading science fiction and fantasy novels",
  "provenance": {
    "enhanced_in_place": true,
    "enhanced_at": "2025-10-21T15:45:00Z",
    "original_summary": "User enjoys reading science fiction novels.",
    "context": "User: Actually, I also like fantasy novels.",
    "source_conversation_timestamp": "2025-10-21T15:45:00Z",
    "cleanup_operation": "merged_genres"
  }
}
```
### Example Complete Vector Index
```json
{
  "event_id": [0.12, 0.23, 0.34, 0.45, 0.56, 0.67, 0.78, 0.89]
}
```
### Example Complete Clusters
```json
{
  "cluster_id": {
    "topic_label": "cluster_topic",
    "centroid_vector": [...],
    "related_events": ["event_id1", "event_id2"],
    "coherence_score": 0.0-1.0
  }
}
```
### Example Complete  Update Log
```json
{
  "update_id": "unique_identifier",
  "source_event": "event_id_of_new_update",
  "replaced_event": "event_id_of_previous_event",
  "timestamp": "ISO 8601 timestamp",
  "similarity_score": 0.0-1.0,
  "update_type": "refinement|reversal|reinforcement|habit_change"
}

## Troubleshooting

### Common Issues

1. **Missing Required Fields**
   - Solution: Always validate that all required fields are present

2. **Invalid Category/Subcategory**
   - Solution: Use only the predefined 27 categories

3. **Incorrect Timestamp Format**
   - Solution: Use ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)

4. **Duplicate Event IDs**
   - Solution: Always generate unique UUID-based event IDs

### Validation Checklist

Before adding any memory event, verify that:

- [ ] All required fields are present
- [ ] Event ID is unique and properly formatted
- [ ] Timestamp is in correct ISO 8601 format
- [ ] Category is one of the 27 predefined categories
- [ ] Confidence scores are between 0.0 and 1.0
- [ ] Provenance information is complete
- [ ] Emotional context is properly structured
- [ ] Semantic context includes related facts for UPDATE events

## Conclusion

Following these guidelines ensures that memory events are properly structured and integrated into the Nova Memory AI system. The comprehensive metadata enables advanced features like semantic search, clustering, and preference evolution tracking.