"""Shared data models for the memory system to avoid circular imports."""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

@dataclass
class EmotionalContext:
    """Represents emotional context of a memory - following New_memory_event.json schema"""
    sentiment: str = "neutral"  # positive, negative, neutral
    emotion_tags: List[str] = field(default_factory=list)  # interest, food, health, etc.
    emotional_intensity: float = 0.5  # 0.0 to 1.0
    mood_context: str = "normal"
    confidence: float = 0.7

@dataclass
class SemanticContext:
    """Represents semantic understanding of a fact - following New_memory_event.json schema"""
    related_facts: List[str] = field(default_factory=list)  # List of event IDs
    confidence_score: float = 0.8
    context_type: str = "general"  # general, preference_update, etc.
    semantic_tags: List[str] = field(default_factory=list)
    similarity_hash: str = ""
    # For string-based semantic context (backward compatibility)
    raw_text: str = ""

@dataclass
class SourceInfo:
    """Source information for provenance - following New_memory_event.json schema"""
    source_type: str = "conversation"
    source_details: str = "chat input"
    context: str = ""
    event_index: int = 0

@dataclass
class Provenance:
    """Represents the origin and enhancement history of memory entries - following New_memory_event.json schema"""
    enhanced_in_place: bool = True
    enhanced_at: str = ""
    source_info: SourceInfo = field(default_factory=SourceInfo)
    source_conversation_timestamp: Optional[str] = None
    cleanup_operation: Optional[str] = None
    original_summary: Optional[str] = None
    # Additional fields for new schema
    event_index: Optional[int] = None

@dataclass
class MemoryEvent:
    """Represents a memory event with complete structure - following New_memory_event.json schema"""
    event_id: str = ""
    type: str = "ADD"  # ADD, UPDATE, DELETE, GET, CONSOLIDATE, CONFIRM, FORGET
    summary: str = ""
    timestamp: str = ""
    emotional_context: EmotionalContext = field(default_factory=EmotionalContext)
    # Can be string (for backward compatibility) or SemanticContext object
    semantic_context: Union[SemanticContext, str] = field(default_factory=str)
    importance_score: float = 0.5
    confidence: float = 0.8
    category: str = "general"
    subcategory: str = "general"
    previous_value: Optional[Any] = None
    current_value: Optional[Any] = None
    provenance: Provenance = field(default_factory=Provenance)

    # Additional fields for specific event types (as per New_memory_event.json)
    Added_preference: Optional[str] = None
    context: Optional[str] = None

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
        if not self.event_id:
            import uuid
            self.event_id = f"evt_{uuid.uuid4().hex[:8]}"

@dataclass
class UpdateLogEntry:
    """Represents an entry in the update log for tracking preference evolution"""
    update_id: str = ""
    source_event: str = ""
    replaced_event: str = ""
    timestamp: str = ""
    similarity_score: float = 0.0
    update_type: str = "refinement"  # refinement, reversal, reinforcement, habit_change

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
        if not self.update_id:
            import uuid
            self.update_id = f"upd_{uuid.uuid4().hex[:8]}"

@dataclass
class ClusterMetadata:
    """Represents metadata for clusters - following New_memory_event.json schema"""
    dominant_tags: List[str] = field(default_factory=list)
    cluster_type: str = "general"
    member_count: int = 0
    average_confidence: float = 0.8
    temporal_span: str = "0 days"
    creation_timestamp: str = ""
    # Additional metadata fields from new schema
    activity_type: Optional[str] = None

    def __post_init__(self):
        if not self.creation_timestamp:
            self.creation_timestamp = datetime.now().isoformat()

@dataclass
class ClusterInsights:
    """Represents insights for clusters - following New_memory_event.json schema"""
    primary_pattern: str = "general_pattern"
    consistency: float = 0.5
    emotional_tone: str = "neutral_tone"
    frequency: str = "irregular_frequency"
    # Additional insight fields from new schema
    food_preference: Optional[str] = None
    coffee_specificity: Optional[str] = None
    restaurant_behavior: Optional[str] = None
    emotional_connection: Optional[str] = None
    daily_routine: Optional[str] = None
    physical_activity: Optional[str] = None
    wellness_score: Optional[str] = None
    time_investment: Optional[str] = None
    favorite_author: Optional[str] = None
    genre_preference: Optional[str] = None
    reading_time: Optional[str] = None
    learning_target: Optional[str] = None
    motivation: Optional[str] = None
    learning_style: Optional[str] = None

@dataclass
class Cluster:
    """Represents a semantic cluster of related memory events - following New_memory_event.json schema"""
    cluster_id: str = ""
    topic: str = ""  # Changed from topic_label to match new schema
    label: str = ""  # Added from new schema
    centroid_vector: List[float] = field(default_factory=list)
    event_ids: List[str] = field(default_factory=list)  # Changed from related_events to match new schema
    coherence_score: float = 0.0
    last_updated: str = ""  # Changed from updated_at to match new schema
    metadata: ClusterMetadata = field(default_factory=ClusterMetadata)
    insights: ClusterInsights = field(default_factory=ClusterInsights)

    def __post_init__(self):
        if not self.last_updated:
            self.last_updated = datetime.now().isoformat()
        if not self.cluster_id:
            import uuid
            self.cluster_id = f"cluster_{uuid.uuid4().hex[:8]}"

@dataclass
class FactHistoryEntry:
    """Represents an entry in fact history with complete tracking"""
    item: str = ""
    score: float = 0.8
    added: str = ""  # Date in YYYY-MM-DD format
    updated: Optional[str] = None  # Date in YYYY-MM-DD format
    update_item: Optional[str] = None

    def __post_init__(self):
        if not self.added:
            self.added = datetime.now().strftime('%Y-%m-%d')