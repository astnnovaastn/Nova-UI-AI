"""Shared data models for the memory system to avoid circular imports."""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime

@dataclass
class EmotionalContext:
    """Represents emotional context of a memory"""
    sentiment: str = "neutral"  # positive, negative, neutral
    emotion_tags: List[str] = field(default_factory=list)  # excited, proud, anxious, etc.
    emotional_intensity: float = 0.5  # 0.0 to 1.0
    mood_context: str = "normal"
    confidence: float = 0.7

@dataclass
class SemanticContext:
    """Represents semantic understanding of a fact"""
    related_facts: List[str] = field(default_factory=list)
    confidence_score: float = 0.8
    context_type: str = "general"  # professional, personal, hobby, etc.
    semantic_tags: List[str] = field(default_factory=list)
    similarity_hash: str = ""

@dataclass
class Provenance:
    """Represents the origin and enhancement history of memory entries"""
    enhanced_in_place: bool = True
    enhanced_at: str = ""
    source_info: Dict[str, Any] = field(default_factory=dict)
    source_conversation_timestamp: Optional[str] = None
    cleanup_operation: Optional[str] = None
    original_summary: Optional[str] = None

@dataclass
class MemoryEvent:
    """Represents a memory event with complete structure"""
    event_id: str = ""
    type: str = "ADD"  # ADD, UPDATE, DELETE, GET, CONSOLIDATE, CONFIRM, FORGET
    summary: str = ""
    timestamp: str = ""
    emotional_context: EmotionalContext = field(default_factory=EmotionalContext)
    semantic_context: SemanticContext = field(default_factory=SemanticContext)
    importance_score: float = 0.5
    confidence: float = 0.8
    category: str = "general"
    subcategory: str = "general"
    previous_value: Optional[Any] = None
    current_value: Optional[Any] = None
    provenance: Provenance = field(default_factory=Provenance)
    
    # Additional fields for specific event types
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
class Cluster:
    """Represents a semantic cluster of related memory events"""
    cluster_id: str = ""
    topic_label: str = ""
    centroid_vector: List[float] = field(default_factory=list)
    related_events: List[str] = field(default_factory=list)
    coherence_score: float = 0.0
    created_at: str = ""
    updated_at: str = ""
    active_event: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
        if not self.updated_at:
            self.updated_at = self.created_at
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