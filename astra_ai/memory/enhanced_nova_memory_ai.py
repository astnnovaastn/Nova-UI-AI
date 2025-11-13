"""Enhanced Nova Memory AI System

This module enhances the existing NovaMemoryAI system to incorporate the complete 
memory event structure with vector index, clusters, and update log systems.
"""

import os
import json
import re
import uuid
import math
import requests
import threading
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any, Union, Set, Tuple
from dataclasses import dataclass, asdict, field
from enum import Enum
from collections import defaultdict, Counter
import hashlib
import numpy as np

# Import existing modules
from astra_ai.memory.Mem0_ai_organizer import AIOrganizer, ORGANIZER_CONFIG
from astra_ai.memory.memory_data_models import (
    EmotionalContext, SemanticContext, MemoryEvent, Provenance, 
    UpdateLogEntry, Cluster, FactHistoryEntry
)
from astra_ai.memory.new_memory_event import (
    NewMemoryEventSystem, MemoryEventType, VectorIndexEntry, 
    MemoryCluster, MemoryEngine
)

# Import libraries for vector operations
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Ensure all required classes are properly defined and exported
__all__ = ['EnhancedNovaMemoryAI', 'MemoryEventType', 'AdvancedMemoryAgent']


class MemoryEventType(Enum):
    ADD = "ADD"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    GET = "GET"
    CONSOLIDATE = "CONSOLIDATE"
    CONFIRM = "CONFIRM"
    FORGET = "FORGET"


class ConflictType(Enum):
    DIRECT_CONTRADICTION = "direct_contradiction"
    TEMPORAL_INCONSISTENCY = "temporal_inconsistency"
    SEMANTIC_CONFLICT = "semantic_conflict"
    VALUE_MISMATCH = "value_mismatch"


class RelationshipType(Enum):
    ENABLES = "enables"
    CONFLICTS = "conflicts"
    SUPPORTS = "supports"
    CAUSED_BY = "caused_by"
    RELATED_TO = "related_to"
    IMPLIES = "implies"


class AdaptiveLearningType(Enum):
    NEW_FACT_TYPE = "new_fact_type"
    NEW_PATTERN = "new_pattern"
    CONTEXT_LEARNING = "context_learning"
    PREFERENCE_LEARNING = "preference_learning"
    STATE_CHANGE = "state_change"


class MemoryCategory(Enum):
    """Comprehensive 27-category memory framework"""
    USER_IDENTITY = "user_identity"
    PERSONAL_PREFERENCES = "personal_preferences"
    TASK_PROJECT_TRACKING = "task_project_tracking"
    ACTIVITY_BEHAVIOR = "activity_behavior"
    USER_INSTRUCTIONS = "user_instructions"
    CURRENT_STATE = "current_state"
    PERSONAL_DEVELOPMENT = "personal_development"
    COMMUNICATION_BOUNDARIES = "communication_boundaries"
    CONTEXTUAL_RULES = "contextual_rules"
    MULTI_IDENTITY = "multi_identity"
    KNOWLEDGE_EXPERTISE = "knowledge_expertise"
    TOOL_INTEGRATION = "tool_integration"
    RESPONSE_ADAPTATION = "response_adaptation"
    FILE_MEDIA = "file_media"
    LONG_TERM_GOALS = "long_term_goals"
    COLLABORATOR_RELATIONSHIPS = "collaborator_relationships"
    DATA_PRIVACY = "data_privacy"
    MULTIMODAL_PREFERENCES = "multimodal_preferences"
    SYSTEM_AWARENESS = "system_awareness"
    SESSION_THEMES = "session_themes"
    META_MEMORY = "meta_memory"
    TEMPORAL_PATTERNS = "temporal_patterns"
    SEARCH_EXTERNAL_INFO = "search_external_info"
    GREETING_PATTERNS = "greeting_patterns"
    CONVERSATION_ANALYTICS = "conversation_analytics"
    NEWS_WEATHER_HISTORY = "news_weather_history"
    TIMEZONE_PREFERENCES = "timezone_preferences"


@dataclass
class AdaptiveLearning:
    """Represents an adaptive learning event"""
    learning_type: str
    pattern: str
    fact_type: str
    confidence: float
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    examples: List[str] = field(default_factory=list)
    success_count: int = 0
    failure_count: int = 0


@dataclass
class CategorySchema:
    """Schema for each memory category, supporting structured data."""    
    name: str
    description: str
    fields: List[str] = field(default_factory=list)
    allow_nested: bool = True
    privacy_level: str = "normal"  # normal, sensitive, private
    retention_policy: str = "permanent"  # permanent, session, temporary, user-controlled
    relationships: List[str] = field(default_factory=list)
    subcategories: List[str] = field(default_factory=list)
    detection_patterns: List[str] = field(default_factory=list)  # Add missing attribute


@dataclass
class MemoryItem:
    """A single memory item supporting structured/nested data."""
    category: str
    value: Any  # Can be dict, list, str, etc.
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    metadata: Dict[str, Any] = field(default_factory=dict)
    privacy_level: str = "normal"
    retention_policy: str = "permanent"
    confidence: float = 1.0
    subcategory: Optional[str] = None
    # Additional fields used throughout the system
    key: Optional[str] = None
    last_accessed: Optional[str] = None
    source: Optional[str] = None
    relationships: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    session_id: Optional[str] = None


class ComprehensiveCategoryDetector:
    """
    Advanced 27-category detection engine.
    """
    def __init__(self):
        self.category_schemas = self._initialize_category_framework()
        self.detection_patterns = self._initialize_detection_patterns()
        self.relationship_map = self._initialize_relationships()
        self.temporal_trackers = {}  # Track time-based patterns
        self.confidence_thresholds = self._initialize_confidence_thresholds()

    def _initialize_category_framework(self) -> Dict[str, CategorySchema]:
        """Initialize the comprehensive 27-category memory framework with detailed specifications."""
        return {
            MemoryCategory.USER_IDENTITY.value: CategorySchema(
                name=MemoryCategory.USER_IDENTITY.value,
                description="Names, pronouns, identity evolution",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.PERSONAL_PREFERENCES.value: CategorySchema(
                name=MemoryCategory.PERSONAL_PREFERENCES.value,
                description="Response style, formality, explanation rules",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.TASK_PROJECT_TRACKING.value: CategorySchema(
                name=MemoryCategory.TASK_PROJECT_TRACKING.value,
                description="Active projects, tech stacks, deadlines",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.ACTIVITY_BEHAVIOR.value: CategorySchema(
                name=MemoryCategory.ACTIVITY_BEHAVIOR.value,
                description="Active times, conversation topics, engagement",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.USER_INSTRUCTIONS.value: CategorySchema(
                name=MemoryCategory.USER_INSTRUCTIONS.value,
                description="Permanent commands, rules, triggers",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.CURRENT_STATE.value: CategorySchema(
                name=MemoryCategory.CURRENT_STATE.value,
                description="Active topics, mood, recent questions",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.PERSONAL_DEVELOPMENT.value: CategorySchema(
                name=MemoryCategory.PERSONAL_DEVELOPMENT.value,
                description="Skills learning, progress, emotional notes",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.COMMUNICATION_BOUNDARIES.value: CategorySchema(
                name=MemoryCategory.COMMUNICATION_BOUNDARIES.value,
                description="Sensitive topics, triggers, support level",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="sensitive",
                retention_policy="permanent"
            ),
            MemoryCategory.CONTEXTUAL_RULES.value: CategorySchema(
                name=MemoryCategory.CONTEXTUAL_RULES.value,
                description="Scope, expiry, recall priority",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.MULTI_IDENTITY.value: CategorySchema(
                name=MemoryCategory.MULTI_IDENTITY.value,
                description="Role profiles, switching triggers",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.KNOWLEDGE_EXPERTISE.value: CategorySchema(
                name=MemoryCategory.KNOWLEDGE_EXPERTISE.value,
                description="Skill levels, known concepts",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.TOOL_INTEGRATION.value: CategorySchema(
                name=MemoryCategory.TOOL_INTEGRATION.value,
                description="Permissions, preferred languages",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.RESPONSE_ADAPTATION.value: CategorySchema(
                name=MemoryCategory.RESPONSE_ADAPTATION.value,
                description="Style corrections, tone adaptation",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.FILE_MEDIA.value: CategorySchema(
                name=MemoryCategory.FILE_MEDIA.value,
                description="Uploads, context links, preferences",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.LONG_TERM_GOALS.value: CategorySchema(
                name=MemoryCategory.LONG_TERM_GOALS.value,
                description="Life goals, career objectives, blockers",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.COLLABORATOR_RELATIONSHIPS.value: CategorySchema(
                name=MemoryCategory.COLLABORATOR_RELATIONSHIPS.value,
                description="Team members, communication styles",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.DATA_PRIVACY.value: CategorySchema(
                name=MemoryCategory.DATA_PRIVACY.value,
                description="Retention policies, private sessions",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="private",
                retention_policy="permanent"
            ),
            MemoryCategory.MULTIMODAL_PREFERENCES.value: CategorySchema(
                name=MemoryCategory.MULTIMODAL_PREFERENCES.value,
                description="Image styles, audio modes",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.SYSTEM_AWARENESS.value: CategorySchema(
                name=MemoryCategory.SYSTEM_AWARENESS.value,
                description="Errors, feedback, constraints",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.SESSION_THEMES.value: CategorySchema(
                name=MemoryCategory.SESSION_THEMES.value,
                description="Themes, emotional arcs, continuity",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.META_MEMORY.value: CategorySchema(
                name=MemoryCategory.META_MEMORY.value,
                description="Browser UI, change logs, cleanup",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.TEMPORAL_PATTERNS.value: CategorySchema(
                name=MemoryCategory.TEMPORAL_PATTERNS.value,
                description="Time-based behaviors and preferences",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.SEARCH_EXTERNAL_INFO.value: CategorySchema(
                name=MemoryCategory.SEARCH_EXTERNAL_INFO.value,
                description="Internet search history, preferences, trusted sources",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.GREETING_PATTERNS.value: CategorySchema(
                name=MemoryCategory.GREETING_PATTERNS.value,
                description="Greeting history, timing, session tracking",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.CONVERSATION_ANALYTICS.value: CategorySchema(
                name=MemoryCategory.CONVERSATION_ANALYTICS.value,
                description="Duration, session gaps, statistics",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.NEWS_WEATHER_HISTORY.value: CategorySchema(
                name=MemoryCategory.NEWS_WEATHER_HISTORY.value,
                description="News and weather query results and summaries",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            ),
            MemoryCategory.TIMEZONE_PREFERENCES.value: CategorySchema(
                name=MemoryCategory.TIMEZONE_PREFERENCES.value,
                description="Time zone queries and location preferences",
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            )
        }

    def _initialize_detection_patterns(self) -> Dict[str, List[str]]:
        """Initialize comprehensive detection patterns for all categories"""
        patterns = {}
        for category, schema in self.category_schemas.items():
            patterns[category] = schema.detection_patterns
        return patterns

    def _initialize_relationships(self) -> Dict[str, List[str]]:
        """Initialize relationship mappings between categories"""
        relationships = {}
        for category, schema in self.category_schemas.items():
            relationships[category] = schema.relationships
        return relationships

    def _initialize_confidence_thresholds(self) -> Dict[str, float]:
        """Initialize confidence thresholds for each category"""
        return {category: 0.7 for category in self.category_schemas.keys()}


class EnhancedNovaMemoryAI:
    """
    Enhanced Nova Memory AI System with complete memory event structure
    
    This system extends the existing NovaMemoryAI with:
    - Complete memory event structure with all required fields
    - Vector index for similarity detection
    - Clustering system for related events
    - Update log for tracking preference evolution
    - Proper fact history with timestamps
    """

    def __init__(self, storage_file: str = "astra_ai/Date/nova_ai_memory.json"):
        """Initialize the enhanced Nova Memory AI System"""
        # Storage configuration
        self.storage_file = storage_file
        self.session_timeout_minutes = 30  # Default 30 minutes
        
        # Initialize user_id
        self.user_id = "default_user"
        
        # Initialize new memory event system
        self.memory_event_system = NewMemoryEventSystem(storage_file)
        
        # Initialize vector index and clustering structures
        self.vector_index = {}  # Maps event_id to embedding vector
        self.clusters = {}      # Maps cluster_id to cluster information
        self.update_log = []    # Logs of updates for tracking preference evolution
        
        # Initialize data structure with enhanced memory engine
        self.data = {
            "user": {
                "user_id": self.user_id,
                "name": None,
                "created_at": datetime.now().isoformat(),
                "status": "active",
                "total_sessions": 0,
                "last_seen": None,
                "relationship_established": False
            },
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
            },
            "conversation": [],
            "sessions": {},
            "current_session": None,
            "conversation_state": {
                "greeting_completed": False,
                "introduction_phase": True,
                "established_user": False
            },
            "fact_history": {},
            "memory_categories": {
                MemoryCategory.USER_IDENTITY.value: {},
                MemoryCategory.PERSONAL_PREFERENCES.value: {},
                MemoryCategory.TASK_PROJECT_TRACKING.value: {},
                MemoryCategory.ACTIVITY_BEHAVIOR.value: {},
                MemoryCategory.USER_INSTRUCTIONS.value: {},
                MemoryCategory.CURRENT_STATE.value: {},
                MemoryCategory.PERSONAL_DEVELOPMENT.value: {},
                MemoryCategory.COMMUNICATION_BOUNDARIES.value: {},
                MemoryCategory.CONTEXTUAL_RULES.value: {},
                MemoryCategory.MULTI_IDENTITY.value: {},
                MemoryCategory.KNOWLEDGE_EXPERTISE.value: {},
                MemoryCategory.TOOL_INTEGRATION.value: {},
                MemoryCategory.RESPONSE_ADAPTATION.value: {},
                MemoryCategory.FILE_MEDIA.value: {},
                MemoryCategory.LONG_TERM_GOALS.value: {},
                MemoryCategory.COLLABORATOR_RELATIONSHIPS.value: {},
                MemoryCategory.DATA_PRIVACY.value: {},
                MemoryCategory.MULTIMODAL_PREFERENCES.value: {},
                MemoryCategory.SYSTEM_AWARENESS.value: {},
                MemoryCategory.SESSION_THEMES.value: {},
                MemoryCategory.META_MEMORY.value: {},
                MemoryCategory.TEMPORAL_PATTERNS.value: {},
                MemoryCategory.SEARCH_EXTERNAL_INFO.value: {},
                MemoryCategory.GREETING_PATTERNS.value: {},
                MemoryCategory.CONVERSATION_ANALYTICS.value: {},
                MemoryCategory.NEWS_WEATHER_HISTORY.value: {},
                MemoryCategory.TIMEZONE_PREFERENCES.value: {}
            },
            "category_relationships": {},
            "behavioral_adaptation": {},
            "privacy_settings": {
                "default_retention": "permanent",
                "sensitive_data_handling": "encrypted",
                "auto_cleanup_enabled": False,
                "privacy_level_defaults": {
                    "normal": "store_and_recall",
                    "sensitive": "store_encrypted",
                    "private": "session_only"
                }
            }
        }
        
        # Initialize AI Organizer
        organizer_config = ORGANIZER_CONFIG.copy()
        organizer_config['memory_file_path'] = storage_file
        self.organizer = AIOrganizer(organizer_config)
        self.organizer.organizer_enabled = organizer_config.get('organizer_enabled', True)
        
        # Load existing data
        self.load_memory()
    
    def create_add_event(self, 
                        user_input: str,
                        context: str = "",
                        category: str = "personal_preferences",
                        subcategory: str = "general",
                        confidence: float = 0.8) -> str:
        """
        Create a complete ADD event with all required fields
        
        Args:
            user_input: The user's input text
            context: Context where the information was provided
            category: Memory category
            subcategory: Memory subcategory
            confidence: Confidence score (0.0-1.0)
            
        Returns:
            Event ID of the created event
        """
        # Create event using new memory event system
        event = self.memory_event_system.create_add_event(
            user_input=user_input,
            context=context,
            category=category,
            subcategory=subcategory,
            confidence=confidence
        )
        
        # Add to memory events
        self.data["memory_engine"]["memory_events"].append(event)
        
        # Add to vector index
        self.memory_event_system.add_to_vector_index(event["event_id"], user_input)
        self.data["memory_engine"]["vector_index"][event["event_id"]] = \
            self.memory_event_system.memory_engine.vector_index[event["event_id"]]
        
        # Update fact history
        self._update_fact_history(event, user_input)
        
        # Save memory
        self.save_memory()
        
        return event["event_id"]
    
    def create_update_event(self,
                           previous_event_id: str,
                           new_value: str,
                           context: str = "",
                           confidence: float = 0.8) -> str:
        """
        Create a complete UPDATE event with all required fields
        
        Args:
            previous_event_id: ID of the event being updated
            new_value: The new value
            context: Context where the information was provided
            confidence: Confidence score (0.0-1.0)
            
        Returns:
            Event ID of the created event
        """
        # Find the previous event
        previous_event = None
        for event_dict in self.data["memory_engine"]["memory_events"]:
            if event_dict["event_id"] == previous_event_id:
                previous_event = event_dict
                break
        
        if not previous_event:
            raise ValueError(f"Previous event with ID {previous_event_id} not found")
        
        # Create update event using new memory event system
        event = self.memory_event_system.create_update_event(
            previous_event=previous_event,
            new_value=new_value,
            context=context,
            confidence=confidence
        )
        
        # Add to memory events
        self.data["memory_engine"]["memory_events"].append(event)
        
        # Add to vector index
        self.memory_event_system.add_to_vector_index(event["event_id"], new_value)
        self.data["memory_engine"]["vector_index"][event["event_id"]] = \
            self.memory_event_system.memory_engine.vector_index[event["event_id"]]
        
        # Update fact history
        self._update_fact_history(event, new_value)
        
        # Add to update log
        similarity_score = self._calculate_similarity(
            str(previous_event.get("current_value", "")), new_value
        )
        update_type = self.memory_event_system._determine_update_type(
            str(previous_event.get("current_value", "")), new_value
        )
        
        update_entry = self.memory_event_system.add_to_update_log(
            source_event_id=event["event_id"],
            replaced_event_id=previous_event_id,
            similarity_score=similarity_score,
            update_type=update_type
        )
        
        # Add to update log in data
        self.data["memory_engine"]["update_log"].append(update_entry)
        
        # Save memory
        self.save_memory()
        
        return event["event_id"]
    
    def _update_fact_history(self, event: Dict[str, Any], value: str):
        """Update fact history with the new event"""
        # Ensure fact_history exists
        if "fact_history" not in self.data:
            self.data["fact_history"] = {}
        
        # Ensure personal_preferences exists in fact_history
        if "personal_preferences" not in self.data["fact_history"]:
            self.data["fact_history"]["personal_preferences"] = {
                "likes": [],
                "dislikes": [],
                "avoid": [],
                "always": [],
                "style": [],
                "conditional": [],
                "interests": []
            }
        
        # Add to appropriate category and subcategory
        category = event.get("category", "personal_preferences")
        subcategory = event.get("subcategory", "likes")
        
        # Make sure the category exists
        if category not in self.data["fact_history"]:
            self.data["fact_history"][category] = {}
        
        # Make sure the subcategory exists
        if subcategory not in self.data["fact_history"][category]:
            self.data["fact_history"][category][subcategory] = []
        
        # Create fact history entry
        fact_entry = {
            "item": value,
            "added": datetime.now().strftime('%Y-%m-%d'),
            "score": event.get("confidence", 0.8)
        }
        
        # If this is an UPDATE event, add update information
        if event.get("type", "ADD") == "UPDATE":
            fact_entry["update_item"] = event.get("current_value", value)
            fact_entry["updated"] = datetime.now().strftime('%Y-%m-%d')
        
        # Add to fact history
        self.data["fact_history"][category][subcategory].append(fact_entry)
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts"""
        # Simple word overlap calculation
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 and not words2:
            return 1.0
        if not words1 or not words2:
            return 0.0
            
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.0
    
    def save_memory(self):
        """Save memory to storage file"""
        try:
            # Create backup
            if os.path.exists(self.storage_file):
                backup_file = f"{self.storage_file}.backup"
                import shutil
                shutil.copy2(self.storage_file, backup_file)
            
            # Save data
            with open(self.storage_file, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False, default=str)
                
        except Exception as e:
            print(f"Error saving memory: {e}")
    
    def load_memory(self):
        """Load memory from storage file"""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r', encoding='utf-8') as f:
                    loaded_data = json.load(f)
                
                # Merge with existing structure
                self.data.update(loaded_data)
                
                # Ensure all required structures exist
                if "memory_engine" not in self.data:
                    self.data["memory_engine"] = {
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
                
                # Ensure fact_history exists
                if "fact_history" not in self.data:
                    self.data["fact_history"] = {}
                
                # Ensure memory_categories exists
                required_categories = [cat.value for cat in MemoryCategory]
                for category in required_categories:
                    if category not in self.data["fact_history"]:
                        self.data["fact_history"][category] = {}
                
        except Exception as e:
            print(f"Error loading memory: {e}")
    
    def get_memory_context(self) -> Dict[str, Any]:
        """Get comprehensive memory context"""
        return {
            "user": self.data.get("user", {}),
            "memory_events": self.data.get("memory_engine", {}).get("memory_events", []),
            "fact_history": self.data.get("fact_history", {}),
            "conversation_state": self.data.get("conversation_state", {}),
            "total_events": len(self.data.get("memory_engine", {}).get("memory_events", [])),
            "total_facts": len(self.data.get("fact_history", {}))
        }


class AdvancedMemoryAgent:
    """
    Nova Memory AI Agent - Interface wrapper for compatibility

    This agent works as a dedicated memory companion to Nova:
    - Stores facts automatically in the background
    - Retrieves information when Nova needs it
    - Maintains conversation logs for context
    """

    def __init__(self, storage_file: str = "astra_ai/Date/nova_ai_memory.json"):
        self.memory_system = EnhancedNovaMemoryAI(storage_file)
        # Silently initialized Nova Memory AI Agent

    def process_conversation(self, user_message: str, ai_response: str) -> Dict[str, Any]:
        """Process conversation with Mem0-style memory analysis"""
        # For now, just return basic processing
        return {
            "status": "processed",
            "user_message": user_message,
            "ai_response": ai_response
        }

    def get_memory_context(self, query: str = "") -> Dict[str, Any]:
        """Get memory context for AI response generation"""
        return self.memory_system.get_memory_context()

    def get_user_profile(self) -> Dict[str, Any]:
        """
        Get user profile without relying on current_facts.
        """
        return {
            'user_info': self.memory_system.data.get("user", {}),
            'facts': {}  # Return empty dict since we're removing current_facts
        }

    def get_memory_stats(self) -> Dict[str, Any]:
        """Get memory statistics"""
        return {
            "total_events": len(self.memory_system.data.get("memory_engine", {}).get("memory_events", [])),
            "total_facts": len(self.memory_system.data.get("fact_history", {})),
            "user_name": self.memory_system.data.get("user", {}).get("name", "Unknown")
        }

    def get_session_info(self) -> Dict[str, Any]:
        """Get conversation session information for intelligent greetings"""
        return {
            "is_first_time": True,
            "total_sessions": 0,
            "user_name": self.memory_system.data.get("user", {}).get("name", "User")
        }

    def end_session(self):
        """End the current conversation session"""
        self.memory_system.save_memory()

    def get_conversation_context(self) -> Dict[str, Any]:
        """Get context about previous conversations"""
        session_info = self.get_session_info()

        context = {
            "is_returning_user": not session_info["is_first_time"],
            "total_sessions": session_info["total_sessions"],
            "user_name": session_info.get("user_name"),
            "greeting_message": self._generate_greeting_message(session_info)
        }

        return context

    def _generate_greeting_message(self, session_info: Dict[str, Any]) -> str:
        """Generate appropriate greeting message based on session history"""
        if session_info["is_first_time"]:
            return "Hi there! I'm Nova, your AI memory companion. What's your name?"

        user_name = session_info.get("user_name", "there")
        return f"Welcome back, {user_name}!"

    def get_conversation_state(self) -> Dict[str, Any]:
        """Get conversation state for AI response filtering"""
        return self.memory_system.data.get("conversation_state", {})

    def should_avoid_introductions(self) -> bool:
        """Check if AI should avoid introduction-style responses"""
        state = self.get_conversation_state()
        return (state.get("is_established_user", False) or
                not state.get("is_introduction_phase", True) or
                state.get("relationship_established", False))

    def get_ai_context_instructions(self) -> str:
        """Get context instructions for AI to avoid inappropriate greeting patterns"""
        state = self.get_conversation_state()

        if state.get("is_established_user", False):
            instructions = [
                "You are continuing an ongoing conversation with an established user.",
                f"User's name is {state.get('user_name', 'the user')}.",
                "Do NOT ask introductory questions or act like you're meeting for the first time.",
                "Continue the conversation naturally based on your existing knowledge of the user."
            ]
            return " ".join(instructions)

        else:
            return ("This appears to be a new user. You may ask introductory questions "
                   "to get to know them better.")

    def add_memory_event(self, 
                        user_input: str,
                        context: str = "",
                        category: str = "personal_preferences",
                        subcategory: str = "general",
                        confidence: float = 0.8) -> str:
        """
        Add a new memory event to the system
        
        Args:
            user_input: The user's input text
            context: Context where the information was provided
            category: Memory category
            subcategory: Memory subcategory
            confidence: Confidence score (0.0-1.0)
            
        Returns:
            Event ID of the created event
        """
        return self.memory_system.create_add_event(
            user_input=user_input,
            context=context,
            category=category,
            subcategory=subcategory,
            confidence=confidence
        )

    def update_memory_event(self,
                           previous_event_id: str,
                           new_value: str,
                           context: str = "",
                           confidence: float = 0.8) -> str:
        """
        Update an existing memory event
        
        Args:
            previous_event_id: ID of the event being updated
            new_value: The new value
            context: Context where the information was provided
            confidence: Confidence score (0.0-1.0)
            
        Returns:
            Event ID of the created event
        """
        return self.memory_system.create_update_event(
            previous_event_id=previous_event_id,
            new_value=new_value,
            context=context,
            confidence=confidence
        )


# Factory function for backward compatibility
def create_memory_agent(storage_file: str = "astra_ai/Date/nova_ai_memory.json") -> AdvancedMemoryAgent:
    """Factory function to create a memory agent with default configuration"""
    return AdvancedMemoryAgent(storage_file)


# Example usage
if __name__ == "__main__":
    # Create enhanced memory agent
    memory_agent = create_memory_agent()
    
    # Add a new memory event
    event_id = memory_agent.add_memory_event(
        user_input="enjoys reading science fiction novels",
        context="User: I love reading sci-fi novels.",
        category="personal_preferences",
        subcategory="likes"
    )
    print(f"Added event with ID: {event_id}")
    
    # Update the memory event
    update_id = memory_agent.update_memory_event(
        previous_event_id=event_id,
        new_value="enjoys reading science fiction and fantasy novels",
        context="User: Actually, I also like fantasy novels."
    )
    print(f"Updated event with ID: {update_id}")
    
    # Get memory context
    context = memory_agent.get_memory_context()
    print(f"Memory context: {context}")
    
    print("Enhanced Nova Memory AI System initialized successfully!")