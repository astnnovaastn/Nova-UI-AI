#!/usr/bin/env python3
"""
Script to update the memory structure to comply with the new comprehensive format
that includes all required fields for the 27-category framework.
"""

import json
import uuid
import os
from datetime import datetime
from typing import Dict, Any, List, Optional

def load_memory_data(file_path: str) -> Dict[str, Any]:
    """Load memory data from JSON file."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Memory file not found: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read().strip()
        if not content:
            # Return default structure for empty file
            return {
                "user": {},
                "memory_events": [],
                "conversation": [],
                "sessions": {},
                "current_session": None,
                "conversation_state": {},
                "fact_history": {},
                "memory_categories": {},
                "category_relationships": {},
                "behavioral_adaptation": {},
                "privacy_settings": {},
                "vector_index": {},
                "clusters": {},
                "update_log": [],
                "memory_engine": {
                    "metadata": {
                        "version": "1.0",
                        "generated_at": datetime.now().isoformat(),
                        "description": "Mem0 AI Memory Engine - Event-based user memory management system"
                    },
                    "memory_events": [],
                    "vector_index": {},
                    "clusters": {},
                    "update_log": []
                }
            }
        return json.loads(content)

def save_memory_data(file_path: str, data: Dict[str, Any]):
    """Save memory data to JSON file."""
    # Create backup
    if os.path.exists(file_path):
        backup_dir = os.path.join(os.path.dirname(file_path), 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = os.path.join(backup_dir, f'nova_ai_memory_{timestamp}.json')
        with open(file_path, 'r', encoding='utf-8') as src:
            with open(backup_path, 'w', encoding='utf-8') as dst:
                dst.write(src.read())
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)

def generate_event_id() -> str:
    """Generate a unique event ID."""
    return f"evt_{uuid.uuid4().hex[:8]}"

def convert_old_emotional_context(old_ctx: Any) -> Dict[str, Any]:
    """Convert old emotional context to new structure."""
    if not isinstance(old_ctx, dict):
        return {
            "sentiment": "neutral",
            "emotion_tags": [],
            "emotional_intensity": 0.5,
            "mood_context": "normal",
            "confidence": 0.7
        }
    
    # Ensure all required fields are present
    return {
        "sentiment": old_ctx.get("sentiment", "neutral"),
        "emotion_tags": old_ctx.get("emotion_tags", []),
        "emotional_intensity": old_ctx.get("emotional_intensity", 0.5),
        "mood_context": old_ctx.get("mood_context", "normal"),
        "confidence": old_ctx.get("confidence", 0.7)
    }

def convert_old_semantic_context(old_ctx: Any, event: Dict[str, Any]) -> Dict[str, Any]:
    """Convert old semantic context to new structure."""
    # If it's already a dict with the right structure, use it
    if isinstance(old_ctx, dict) and "related_facts" in old_ctx:
        return {
            "related_facts": old_ctx.get("related_facts", []),
            "confidence_score": old_ctx.get("confidence_score", 0.8),
            "context_type": old_ctx.get("context_type", "general"),
            "semantic_tags": old_ctx.get("semantic_tags", []),
            "similarity_hash": old_ctx.get("similarity_hash", "")
        }
    
    # If it's a string, convert it to the new structure
    if isinstance(old_ctx, str):
        return {
            "related_facts": [],
            "confidence_score": event.get("confidence", 0.8),
            "context_type": "inferred_preference",
            "semantic_tags": [],
            "similarity_hash": ""
        }
    
    # Default structure
    return {
        "related_facts": [],
        "confidence_score": 0.8,
        "context_type": "general",
        "semantic_tags": [],
        "similarity_hash": ""
    }

def convert_old_provenance(old_prov: Any) -> Dict[str, Any]:
    """Convert old provenance to new structure."""
    if not isinstance(old_prov, dict):
        return {
            "enhanced_in_place": True,
            "enhanced_at": datetime.now().isoformat(),
            "source_info": {},
            "source_conversation_timestamp": None,
            "cleanup_operation": None,
            "original_summary": None
        }
    
    # Ensure all required fields are present
    return {
        "enhanced_in_place": old_prov.get("enhanced_in_place", True),
        "enhanced_at": old_prov.get("enhanced_at", datetime.now().isoformat()),
        "source_info": old_prov.get("source_info", {}),
        "source_conversation_timestamp": old_prov.get("source_conversation_timestamp"),
        "cleanup_operation": old_prov.get("cleanup_operation"),
        "original_summary": old_prov.get("original_summary")
    }

def classify_category(summary: str, current_value: str = "") -> tuple[str, str]:
    """
    Classify the event into one of the 27 categories and appropriate subcategory.
    
    Returns:
        tuple of (category, subcategory)
    """
    text = (summary + " " + str(current_value) if current_value else summary).lower()
    
    # USER_IDENTITY - Names, pronouns, identity evolution
    if any(word in text for word in ["name is", "my name", "called", "identity", "pronoun"]):
        return ("user_identity", "identity_info")
    
    # PERSONAL_PREFERENCES - Response style, formality, explanation rules
    preference_indicators = ["like", "love", "hate", "dislike", "enjoy", "prefer", "avoid"]
    if any(word in text for word in preference_indicators):
        # Determine subcategory based on context
        if "avoid" in text or "stay away" in text:
            return ("personal_preferences", "avoid")
        elif "love" in text or "adore" in text:
            return ("personal_preferences", "love")
        elif "hate" in text or "despise" in text:
            return ("personal_preferences", "hate")
        elif "dislike" in text:
            return ("personal_preferences", "dislikes")
        elif "enjoy" in text:
            return ("personal_preferences", "enjoy")
        elif "need" in text or "require" in text:
            return ("personal_preferences", "need")
        elif "want" in text or "wish" in text:
            return ("personal_preferences", "want")
        elif "always" in text:
            return ("personal_preferences", "always")
        else:
            return ("personal_preferences", "likes")
    
    # TASK_PROJECT_TRACKING - Active projects, tech stacks, deadlines
    if any(word in text for word in ["project", "working on", "building", "developing", "tech stack", "deadline"]):
        return ("task_project_tracking", "projects")
    
    # ACTIVITY_BEHAVIOR - Active times, conversation topics, engagement
    if any(word in text for word in ["usually", "always", "often", "rarely", "active", "behavior"]):
        return ("activity_behavior", "behavior_patterns")
    
    # USER_INSTRUCTIONS - Permanent commands, rules, triggers
    if any(word in text for word in ["command", "rule", "always", "never", "trigger"]):
        return ("user_instructions", "rules")
    
    # CURRENT_STATE - Active topics, mood, recent questions
    if any(word in text for word in ["currently", "now", "today", "present", "mood"]):
        return ("current_state", "active_state")
    
    # PERSONAL_DEVELOPMENT - Skills learning, progress, emotional notes
    if any(word in text for word in ["learning", "skill", "progress", "develop", "improve"]):
        return ("personal_development", "skills_learning")
    
    # COMMUNICATION_BOUNDARIES - Sensitive topics, triggers, support level
    if any(word in text for word in ["sensitive", "trigger", "support", "boundary", "don't discuss"]):
        return ("communication_boundaries", "boundaries")
    
    # CONTEXTUAL_RULES - Scope, expiry, recall priority
    if any(word in text for word in ["scope", "expiry", "recall", "priority"]):
        return ("contextual_rules", "rules")
    
    # MULTI_IDENTITY - Role profiles, switching triggers
    if any(word in text for word in ["role", "identity", "switch", "profile"]):
        return ("multi_identity", "roles")
    
    # KNOWLEDGE_EXPERTISE - Skill levels, known concepts
    if any(word in text for word in ["expert", "knowledge", "skill", "proficient"]):
        return ("knowledge_expertise", "skills")
    
    # TOOL_INTEGRATION - Permissions, preferred languages
    if any(word in text for word in ["tool", "permission", "language", "integration"]):
        return ("tool_integration", "tools")
    
    # RESPONSE_ADAPTATION - Style corrections, tone adaptation
    if any(word in text for word in ["style", "tone", "adapt", "correction"]):
        return ("response_adaptation", "style")
    
    # FILE_MEDIA - Uploads, context links, preferences
    if any(word in text for word in ["file", "upload", "media", "link"]):
        return ("file_media", "files")
    
    # LONG_TERM_GOALS - Life goals, career objectives, blockers
    if any(word in text for word in ["goal", "dream", "aspiration", "career", "objective"]):
        return ("long_term_goals", "goals")
    
    # COLLABORATOR_RELATIONSHIPS - Team members, communication styles
    if any(word in text for word in ["friend", "colleague", "team", "partner", "relationship"]):
        return ("collaborator_relationships", "relationships")
    
    # DATA_PRIVACY - Retention policies, private sessions
    if any(word in text for word in ["privacy", "retention", "private", "session"]):
        return ("data_privacy", "policies")
    
    # MULTIMODAL_PREFERENCES - Image styles, audio modes
    if any(word in text for word in ["image", "audio", "video", "multimodal"]):
        return ("multimodal_preferences", "preferences")
    
    # SYSTEM_AWARENESS - Errors, feedback, constraints
    if any(word in text for word in ["error", "feedback", "constraint", "system"]):
        return ("system_awareness", "errors")
    
    # SESSION_THEMES - Themes, emotional arcs, continuity
    if any(word in text for word in ["theme", "session", "continuity"]):
        return ("session_themes", "themes")
    
    # META_MEMORY - Browser UI, change logs, cleanup
    if any(word in text for word in ["ui", "browser", "cleanup", "log"]):
        return ("meta_memory", "ui")
    
    # TEMPORAL_PATTERNS - Time-based behaviors and preferences
    if any(word in text for word in ["time", "temporal", "schedule", "pattern"]):
        return ("temporal_patterns", "patterns")
    
    # SEARCH_EXTERNAL_INFO - Internet search history, preferences, trusted sources
    if any(word in text for word in ["search", "internet", "web", "query"]):
        return ("search_external_info", "queries")
    
    # GREETING_PATTERNS - Greeting history, timing, session tracking
    if any(word in text for word in ["hello", "hi", "greeting", "morning", "evening"]):
        return ("greeting_patterns", "greetings")
    
    # CONVERSATION_ANALYTICS - Duration, session gaps, statistics
    if any(word in text for word in ["conversation", "duration", "session", "analytics"]):
        return ("conversation_analytics", "metrics")
    
    # NEWS_WEATHER_HISTORY - News and weather query results and summaries
    if any(word in text for word in ["news", "weather", "forecast"]):
        return ("news_weather_history", "queries")
    
    # TIMEZONE_PREFERENCES - Time zone queries and location preferences
    if any(word in text for word in ["timezone", "location", "time zone"]):
        return ("timezone_preferences", "zones")
    
    # Default fallback
    return ("personal_preferences", "general")

def convert_memory_event(old_event: Dict[str, Any], index: int) -> Dict[str, Any]:
    """
    Convert an old memory event to the new comprehensive structure.
    
    Args:
        old_event: Dictionary representing old memory event structure
        index: Index of the event in the memory_events list
        
    Returns:
        Dictionary representing new memory event structure
    """
    # Ensure we have all required fields
    event_id = old_event.get("event_id")
    if not event_id:
        event_id = generate_event_id()
    
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
    
    # Classify category and subcategory
    category, subcategory = classify_category(summary, str(current_value) if current_value else "")
    
    # Override with existing category if present
    if old_event.get("category"):
        category = old_event["category"]
    if old_event.get("subcategory"):
        subcategory = old_event["subcategory"]
    
    # Create the new event structure that matches MemoryEvent dataclass
    new_event = {
        "event_id": event_id,
        "type": event_type,
        "summary": summary,
        "timestamp": timestamp,
        "emotional_context": emotional_context,
        "semantic_context": semantic_context,
        "importance_score": importance_score,
        "confidence": confidence,
        "category": category,
        "subcategory": subcategory,
        "previous_value": previous_value,
        "current_value": current_value,
        "provenance": provenance
    }
    
    # Add context field if it exists
    if context:
        new_event["context"] = context
    
    # Handle Added_preference fields (convert to the proper field name)
    added_preference_value = None
    for key in list(old_event.keys()):
        if key.startswith("Added_preference"):
            added_preference_value = old_event[key]
            # Remove the old field
            del old_event[key]
            break
    
    # Add the properly named field
    if added_preference_value:
        new_event["Added_preference"] = added_preference_value
    
    return new_event

def update_memory_structure(memory_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update the entire memory structure to the new format.
    
    Args:
        memory_data: The current memory data structure
        
    Returns:
        Updated memory data with new structure
    """
    # Ensure all required top-level fields exist
    required_fields = [
        "user", "memory_events", "conversation", "sessions", "current_session",
        "conversation_state", "fact_history", "memory_categories", "category_relationships",
        "behavioral_adaptation", "privacy_settings", "vector_index", "clusters",
        "update_log"
    ]
    
    for field in required_fields:
        if field not in memory_data:
            if field in ["memory_events", "conversation", "sessions", "category_relationships", 
                        "behavioral_adaptation", "vector_index", "clusters", "update_log"]:
                memory_data[field] = []
            elif field in ["fact_history", "memory_categories", "privacy_settings"]:
                memory_data[field] = {}
            elif field == "user":
                memory_data[field] = {
                    "user_id": "default_user",
                    "name": "User",
                    "created_at": datetime.now().isoformat(),
                    "status": "active",
                    "total_sessions": 0,
                    "last_seen": datetime.now().isoformat(),
                    "relationship_established": False
                }
            else:
                memory_data[field] = None
    
    # Ensure memory_engine structure exists
    if "memory_engine" not in memory_data:
        memory_data["memory_engine"] = {
            "metadata": {
                "version": "1.0",
                "generated_at": datetime.now().isoformat(),
                "description": "Mem0 AI Memory Engine - Event-based user memory management system"
            },
            "memory_events": memory_data.get("memory_events", []),
            "vector_index": memory_data.get("vector_index", {}),
            "clusters": memory_data.get("clusters", {}),
            "update_log": memory_data.get("update_log", [])
        }
    else:
        # Ensure memory_engine has all required fields
        memory_engine = memory_data["memory_engine"]
        if "metadata" not in memory_engine:
            memory_engine["metadata"] = {
                "version": "1.0",
                "generated_at": datetime.now().isoformat(),
                "description": "Mem0 AI Memory Engine - Event-based user memory management system"
            }
        if "memory_events" not in memory_engine:
            memory_engine["memory_events"] = memory_data.get("memory_events", [])
        if "vector_index" not in memory_engine:
            memory_engine["vector_index"] = memory_data.get("vector_index", {})
        if "clusters" not in memory_engine:
            memory_engine["clusters"] = memory_data.get("clusters", {})
        if "update_log" not in memory_engine:
            memory_engine["update_log"] = memory_data.get("update_log", [])
    
    # Convert memory events to new structure
    if "memory_events" in memory_data and isinstance(memory_data["memory_events"], list):
        converted_events = []
        for i, old_event in enumerate(memory_data["memory_events"]):
            if isinstance(old_event, dict):
                try:
                    new_event = convert_memory_event(old_event, i)
                    converted_events.append(new_event)
                except Exception as e:
                    print(f"Error converting event {i}: {e}")
                    # Keep the original event if conversion fails
                    converted_events.append(old_event)
            else:
                # Keep non-dict events as is
                converted_events.append(old_event)
        
        memory_data["memory_events"] = converted_events
        # Also update in memory_engine
        memory_data["memory_engine"]["memory_events"] = converted_events
    
    # Initialize all 27 memory categories if not present
    if "memory_categories" not in memory_data:
        memory_data["memory_categories"] = {}
    
    # Ensure all 27 categories exist
    all_categories = [
        "user_identity", "personal_preferences", "task_project_tracking", "activity_behavior",
        "user_instructions", "current_state", "personal_development", "communication_boundaries",
        "contextual_rules", "multi_identity", "knowledge_expertise", "tool_integration",
        "response_adaptation", "file_media", "long_term_goals", "collaborator_relationships",
        "data_privacy", "multimodal_preferences", "system_awareness", "session_themes",
        "meta_memory", "temporal_patterns", "search_external_info", "greeting_patterns",
        "conversation_analytics", "news_weather_history", "timezone_preferences"
    ]
    
    for category in all_categories:
        if category not in memory_data["memory_categories"]:
            memory_data["memory_categories"][category] = {}
    
    # Ensure fact_history has proper structure
    if "fact_history" not in memory_data:
        memory_data["fact_history"] = {}
    
    # Ensure privacy_settings has defaults
    if "privacy_settings" not in memory_data:
        memory_data["privacy_settings"] = {
            "default_retention": "permanent",
            "sensitive_data_handling": "encrypted",
            "auto_cleanup_enabled": False,
            "privacy_level_defaults": {
                "normal": "store_and_recall",
                "sensitive": "store_encrypted",
                "private": "session_only"
            }
        }
    
    return memory_data

def initialize_vector_index(memory_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Initialize or update the vector index for similarity detection.
    
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
        if isinstance(event, dict):
            event_id = event.get("event_id")
            if event_id and event_id not in memory_data["vector_index"]:
                # Create a simple hash-based vector for demonstration
                # In practice, this would use a proper embedding model
                text_content = event.get("summary", "") + " " + str(event.get("current_value", ""))
                vector = [hash(text_content) % 1000 / 1000.0] * 8  # Simple 8-dimensional vector
                memory_data["vector_index"][event_id] = vector
    
    # Also update in memory_engine
    if "memory_engine" in memory_data:
        memory_data["memory_engine"]["vector_index"] = memory_data["vector_index"]
    
    return memory_data

def initialize_clusters(memory_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Initialize or update clusters for related events.
    
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
        if isinstance(event, dict):
            category = event.get("category", "general")
            if category not in category_groups:
                category_groups[category] = []
            category_groups[category].append(event)
    
    # Create a cluster for each category group
    for category, events in category_groups.items():
        if events and category not in memory_data["clusters"]:
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
    
    # Also update in memory_engine
    if "memory_engine" in memory_data:
        memory_data["memory_engine"]["clusters"] = memory_data["clusters"]
    
    return memory_data

def initialize_update_log(memory_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Initialize or update the update log for tracking preference evolution.
    
    Args:
        memory_data: The memory data structure
        
    Returns:
        Updated memory data with update log
    """
    # Initialize update_log if it doesn't exist
    if "update_log" not in memory_data:
        memory_data["update_log"] = []
    
    # Also update in memory_engine
    if "memory_engine" in memory_data:
        memory_data["memory_engine"]["update_log"] = memory_data["update_log"]
    
    return memory_data

def update_all_memory_structures(memory_file_path: str):
    """
    Update all memory structures in the file to the new format.
    
    Args:
        memory_file_path: Path to the memory JSON file
    """
    print(f"Loading memory data from {memory_file_path}...")
    
    # Load the memory data
    try:
        memory_data = load_memory_data(memory_file_path)
        print(f"Loaded memory data with {len(memory_data.get('memory_events', []))} events")
    except Exception as e:
        print(f"Error loading memory data: {e}")
        return
    
    # Update to new structure
    print("Updating memory structure...")
    memory_data = update_memory_structure(memory_data)
    
    # Initialize vector index
    print("Initializing vector index...")
    memory_data = initialize_vector_index(memory_data)
    
    # Initialize clusters
    print("Initializing clusters...")
    memory_data = initialize_clusters(memory_data)
    
    # Initialize update log
    print("Initializing update log...")
    memory_data = initialize_update_log(memory_data)
    
    # Save the updated data
    print(f"Saving updated memory data to {memory_file_path}...")
    try:
        save_memory_data(memory_file_path, memory_data)
        print("Memory structure update completed successfully!")
    except Exception as e:
        print(f"Error saving memory data: {e}")

def main():
    """Main function to run the update."""
    memory_file_path = os.path.join("astra_ai", "Date", "nova_ai_memory.json")
    
    try:
        update_all_memory_structures(memory_file_path)
    except Exception as e:
        print(f"Error during update: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()