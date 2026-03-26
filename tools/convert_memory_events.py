#!/usr/bin/env python3
"""
Script to convert existing memory events to the new comprehensive structure
that complies with the 27-category framework and all specified requirements.
"""

import json
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional
import os

# Import the data models
from astra_ai.memory.memory_data_models import (
    EmotionalContext, SemanticContext, Provenance, MemoryEvent
)

def load_memory_data(file_path: str) -> Dict[str, Any]:
    """Load memory data from JSON file."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Memory file not found: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_memory_data(file_path: str, data: Dict[str, Any]):
    """Save memory data to JSON file."""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)

def generate_event_id() -> str:
    """Generate a unique event ID."""
    return f"evt_{uuid.uuid4().hex[:8]}"

def convert_old_emotional_context(old_ctx: Dict[str, Any]) -> EmotionalContext:
    """Convert old emotional context to new structure."""
    if not isinstance(old_ctx, dict):
        return EmotionalContext()
    
    return EmotionalContext(
        sentiment=old_ctx.get("sentiment", "neutral"),
        emotion_tags=old_ctx.get("emotion_tags", []),
        emotional_intensity=old_ctx.get("emotional_intensity", 0.0),
        mood_context=old_ctx.get("mood_context", "normal"),
        confidence=old_ctx.get("confidence", 0.7)
    )

def convert_old_semantic_context(old_ctx: Any, event: Dict[str, Any]) -> SemanticContext:
    """Convert old semantic context to new structure."""
    # If it's already a dict with the right structure, use it
    if isinstance(old_ctx, dict) and "related_facts" in old_ctx:
        return SemanticContext(
            related_facts=old_ctx.get("related_facts", []),
            confidence_score=old_ctx.get("confidence_score", 0.8),
            context_type=old_ctx.get("context_type", "general"),
            semantic_tags=old_ctx.get("semantic_tags", []),
            similarity_hash=old_ctx.get("similarity_hash", "")
        )
    
    # Otherwise, create a new semantic context
    return SemanticContext(
        related_facts=[],  # Will be populated later with similarity detection
        confidence_score=event.get("confidence", 0.8),
        context_type="inferred_preference",
        semantic_tags=[],  # Will be extracted from content
        similarity_hash=""  # Will be computed later
    )

def convert_old_provenance(old_prov: Dict[str, Any]) -> Provenance:
    """Convert old provenance to new structure."""
    if not isinstance(old_prov, dict):
        return Provenance()
    
    return Provenance(
        enhanced_in_place=old_prov.get("enhanced_in_place", True),
        enhanced_at=old_prov.get("enhanced_at", datetime.now().isoformat()),
        source_info=old_prov.get("source_info", {}),
        source_conversation_timestamp=old_prov.get("source_conversation_timestamp"),
        cleanup_operation=old_prov.get("cleanup_operation"),
        original_summary=old_prov.get("original_summary")
    )

def classify_category(summary: str, current_value: str = "") -> tuple[str, str]:
    """
    Classify the event into one of the 27 categories and appropriate subcategory.
    
    Returns:
        tuple of (category, subcategory)
    """
    text = (summary + " " + current_value).lower()
    
    # USER_IDENTITY - Names, pronouns, identity evolution
    if any(word in text for word in ["name is", "my name", "called", "identity"]):
        return ("user_identity", "name")
    
    # PERSONAL_PREFERENCES - Response style, formality, explanation rules
    if any(word in text for word in ["like", "love", "hate", "dislike", "enjoy", "prefer"]):
        if "game" in text:
            return ("personal_preferences", "likes")
        elif "avoid" in text:
            return ("personal_preferences", "avoid")
        else:
            return ("personal_preferences", "likes")
    
    # TASK_PROJECT_TRACKING - Active projects, tech stacks, deadlines
    if any(word in text for word in ["project", "working on", "building", "developing"]):
        return ("task_project_tracking", "active_projects")
    
    # CURRENT_STATE - Active topics, mood, recent questions
    if any(word in text for word in ["currently", "right now", "at the moment"]):
        return ("current_state", "active_topics")
    
    # Default fallback
    return ("personal_preferences", "general")

def convert_memory_event(old_event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert an old memory event to the new comprehensive structure.
    
    Args:
        old_event: Dictionary representing old memory event structure
        
    Returns:
        Dictionary representing new memory event structure
    """
    # Ensure we have all required fields
    event_id = old_event.get("event_id", generate_event_id())
    event_type = old_event.get("type", "ADD")
    summary = old_event.get("summary", "")
    timestamp = old_event.get("timestamp", datetime.now().isoformat())
    
    # Convert emotional context
    old_emotional_ctx = old_event.get("emotional_context", {})
    emotional_context = convert_old_emotional_context(old_emotional_ctx)
    
    # Convert semantic context
    old_semantic_ctx = old_event.get("semantic_context", {})
    semantic_context = convert_old_semantic_context(old_semantic_ctx, old_event)
    
    # Convert provenance
    old_provenance = old_event.get("provenance", {})
    provenance = convert_old_provenance(old_provenance)
    
    # Extract other fields
    importance_score = old_event.get("importance_score", 0.5)
    confidence = old_event.get("confidence", 0.8)
    previous_value = old_event.get("previous_value")
    current_value = old_event.get("current_value")
    context = old_event.get("context")
    
    # Handle Added_preference fields
    added_preference = None
    for key in old_event:
        if key.startswith("Added_preference"):
            added_preference = old_event[key]
            break
    
    # If no Added_preference found, check for the old format
    if not added_preference:
        for key in old_event:
            if key.startswith("Added_preference_"):
                added_preference = old_event[key]
                break
    
    # Classify category and subcategory
    category, subcategory = classify_category(summary, str(current_value) if current_value else "")
    
    # Create the new event structure
    new_event = {
        "event_id": event_id,
        "type": event_type,
        "summary": summary,
        "timestamp": timestamp,
        "emotional_context": {
            "sentiment": emotional_context.sentiment,
            "emotion_tags": emotional_context.emotion_tags,
            "emotional_intensity": emotional_context.emotional_intensity,
            "mood_context": emotional_context.mood_context,
            "confidence": emotional_context.confidence
        },
        "semantic_context": {
            "related_facts": semantic_context.related_facts,
            "confidence_score": semantic_context.confidence_score,
            "context_type": semantic_context.context_type,
            "semantic_tags": semantic_context.semantic_tags,
            "similarity_hash": semantic_context.similarity_hash
        },
        "importance_score": importance_score,
        "confidence": confidence,
        "category": category,
        "subcategory": subcategory,
        "previous_value": previous_value,
        "current_value": current_value,
        "provenance": {
            "enhanced_in_place": provenance.enhanced_in_place,
            "enhanced_at": provenance.enhanced_at,
            "source_info": provenance.source_info,
            "source_conversation_timestamp": provenance.source_conversation_timestamp,
            "cleanup_operation": provenance.cleanup_operation,
            "original_summary": provenance.original_summary
        }
    }
    
    # Add Added_preference field if it exists
    if added_preference:
        new_event["Added_preference"] = added_preference
    
    # Add context field if it exists
    if context:
        new_event["context"] = context
    
    return new_event

def update_vector_index(memory_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update or create the vector index for similarity detection.
    
    Args:
        memory_data: The memory data structure
        
    Returns:
        Updated memory data with vector index
    """
    # Initialize vector index if it doesn't exist
    if "vector_index" not in memory_data:
        memory_data["vector_index"] = {}
    
    # For each memory event, create a simple vector representation
    # In a real implementation, this would use proper embeddings
    for event in memory_data.get("memory_events", []):
        event_id = event.get("event_id")
        if event_id and event_id not in memory_data["vector_index"]:
            # Create a simple hash-based vector for demonstration
            # In practice, this would use a proper embedding model
            text_content = event.get("summary", "") + " " + str(event.get("current_value", ""))
            vector = [hash(text_content) % 1000 / 1000.0] * 8  # Simple 8-dimensional vector
            memory_data["vector_index"][event_id] = vector
    
    return memory_data

def update_clusters(memory_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update or create clusters for related events.
    
    Args:
        memory_data: The memory data structure
        
    Returns:
        Updated memory data with clusters
    """
    # Initialize clusters if they don't exist
    if "clusters" not in memory_data:
        memory_data["clusters"] = {}
    
    # Group events by category for simple clustering
    category_groups = {}
    for event in memory_data.get("memory_events", []):
        category = event.get("category", "general")
        if category not in category_groups:
            category_groups[category] = []
        category_groups[category].append(event)
    
    # Create a cluster for each category group
    for category, events in category_groups.items():
        if events:  # Only create cluster if there are events
            cluster_id = f"cluster_{category}_{uuid.uuid4().hex[:8]}"
            centroid_vector = [0.0] * 8  # Placeholder
            
            # Simple coherence score based on number of events
            coherence_score = min(1.0, len(events) / 10.0)
            
            memory_data["clusters"][cluster_id] = {
                "topic_label": category,
                "centroid_vector": centroid_vector,
                "related_events": [event.get("event_id") for event in events if event.get("event_id")],
                "coherence_score": coherence_score,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
    
    return memory_data

def update_fact_history(memory_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update fact history with proper tracking.
    
    Args:
        memory_data: The memory data structure
        
    Returns:
        Updated memory data with fact history
    """
    # Initialize fact_history if it doesn't exist
    if "fact_history" not in memory_data:
        memory_data["fact_history"] = {}
    
    # Ensure fact_history has the personal_preferences structure
    if "personal_preferences" not in memory_data["fact_history"]:
        memory_data["fact_history"]["personal_preferences"] = {
            "likes": [],
            "dislikes": [],
            "avoid": [],
            "always": [],
            "style": [],
            "conditional": [],
            "interests": [],
            "love": [],
            "hate": [],
            "enjoy": [],
            "need": [],
            "want": [],
            "continue": []
        }
    
    # Update personal preferences based on memory events
    for event in memory_data.get("memory_events", []):
        category = event.get("category", "")
        subcategory = event.get("subcategory", "")
        current_value = event.get("current_value", "")
        timestamp = event.get("timestamp", datetime.now().isoformat())
        
        # Only process personal preferences
        if category == "personal_preferences" and current_value:
            # Add to appropriate subcategory list
            pref_category = subcategory if subcategory in memory_data["fact_history"]["personal_preferences"] else "likes"
            
            # Create fact history entry
            fact_entry = {
                "item": str(current_value),
                "score": event.get("confidence", 0.8),
                "added": datetime.fromisoformat(timestamp).strftime('%Y-%m-%d') if 'T' in timestamp else timestamp.split('T')[0],
                "updated": datetime.fromisoformat(timestamp).strftime('%Y-%m-%d') if 'T' in timestamp else timestamp.split('T')[0]
            }
            
            # Check if this item already exists to avoid duplicates
            existing_items = [item["item"] for item in memory_data["fact_history"]["personal_preferences"][pref_category]]
            if str(current_value) not in existing_items:
                memory_data["fact_history"]["personal_preferences"][pref_category].append(fact_entry)
    
    return memory_data

def convert_all_memory_events(memory_file_path: str):
    """
    Convert all memory events in the file to the new structure.
    
    Args:
        memory_file_path: Path to the memory JSON file
    """
    print(f"Loading memory data from {memory_file_path}...")
    
    # Load the memory data
    memory_data = load_memory_data(memory_file_path)
    
    # Convert memory events
    if "memory_events" in memory_data:
        print(f"Converting {len(memory_data['memory_events'])} memory events...")
        
        converted_events = []
        for i, old_event in enumerate(memory_data["memory_events"]):
            try:
                new_event = convert_memory_event(old_event)
                converted_events.append(new_event)
                print(f"Converted event {i+1}/{len(memory_data['memory_events'])}")
            except Exception as e:
                print(f"Error converting event {i+1}: {e}")
                # Keep the original event if conversion fails
                converted_events.append(old_event)
        
        memory_data["memory_events"] = converted_events
        print("Conversion complete!")
    else:
        print("No memory_events found in the file.")
    
    # Update vector index for similarity detection
    print("Updating vector index...")
    memory_data = update_vector_index(memory_data)
    
    # Update clusters for related events
    print("Updating clusters...")
    memory_data = update_clusters(memory_data)
    
    # Update fact history
    print("Updating fact history...")
    memory_data = update_fact_history(memory_data)
    
    # Save the updated data
    print(f"Saving updated memory data to {memory_file_path}...")
    save_memory_data(memory_file_path, memory_data)
    
    print("Memory events conversion completed successfully!")

def main():
    """Main function to run the conversion."""
    memory_file_path = os.path.join("astra_ai", "Date", "nova_ai_memory.json")
    
    try:
        convert_all_memory_events(memory_file_path)
    except Exception as e:
        print(f"Error during conversion: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()