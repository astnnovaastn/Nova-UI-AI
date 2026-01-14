"""
Nova Memory AI System
A dedicated AI Memory Agent that works alongside Nova to provide persistent memory capabilities.

Core Concept:
- Only stores & retrieves memory - Pure data storage and recall
- Activates when Nova forgets - Seamless background operation
- Feeds missing info back automatically - Transparent to the user

System Architecture: User ↔ Nova (Main AI) ↔ Memory AI ↔ JSON Storage
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

# Import AI Organizer
from astra_ai.memory.Mem0_ai_organizer import AIOrganizer, ORGANIZER_CONFIG

# Import shared data models
from astra_ai.memory.memory_data_models import EmotionalContext, SemanticContext, MemoryEvent, Provenance, UpdateLogEntry, Cluster, FactHistoryEntry

# Import libraries for vector operations
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Ensure all required classes are properly defined and exported
__all__ = ['NovaMemoryAI', 'MemoryEventType', 'AdvancedMemoryAgent']

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
    USER_IDENTITY = "user_identity"                           # Names, pronouns, identity evolution
    PERSONAL_PREFERENCES = "personal_preferences"             # Response style, formality, explanation rules
    TASK_PROJECT_TRACKING = "task_project_tracking"          # Active projects, tech stacks, deadlines
    ACTIVITY_BEHAVIOR = "activity_behavior"                  # Active times, conversation topics, engagement
    USER_INSTRUCTIONS = "user_instructions"                  # Permanent commands, rules, triggers
    CURRENT_STATE = "current_state"                          # Active topics, mood, recent questions
    PERSONAL_DEVELOPMENT = "personal_development"            # Skills learning, progress, emotional notes
    COMMUNICATION_BOUNDARIES = "communication_boundaries"    # Sensitive topics, triggers, support level
    CONTEXTUAL_RULES = "contextual_rules"                   # Scope, expiry, recall priority
    MULTI_IDENTITY = "multi_identity"                       # Role profiles, switching triggers
    KNOWLEDGE_EXPERTISE = "knowledge_expertise"             # Skill levels, known concepts
    TOOL_INTEGRATION = "tool_integration"                   # Permissions, preferred languages
    RESPONSE_ADAPTATION = "response_adaptation"             # Style corrections, tone adaptation
    FILE_MEDIA = "file_media"                              # Uploads, context links, preferences
    LONG_TERM_GOALS = "long_term_goals"                    # Life goals, career objectives, blockers
    COLLABORATOR_RELATIONSHIPS = "collaborator_relationships" # Team members, communication styles
    DATA_PRIVACY = "data_privacy"                          # Retention policies, private sessions
    MULTIMODAL_PREFERENCES = "multimodal_preferences"      # Image styles, audio modes
    SYSTEM_AWARENESS = "system_awareness"                  # Errors, feedback, constraints
    SESSION_THEMES = "session_themes"                      # Themes, emotional arcs, continuity
    META_MEMORY = "meta_memory"                           # Browser UI, change logs, cleanup
    TEMPORAL_PATTERNS = "temporal_patterns"               # Time-based behaviors and preferences
    SEARCH_EXTERNAL_INFO = "search_external_info"         # Internet search history, preferences, trusted sources

    # New Enhanced Categories for Intelligence Features
    GREETING_PATTERNS = "greeting_patterns"               # Greeting history, timing, session tracking
    CONVERSATION_ANALYTICS = "conversation_analytics"     # Duration, session gaps, statistics
    NEWS_WEATHER_HISTORY = "news_weather_history"        # News and weather query results and summaries
    TIMEZONE_PREFERENCES = "timezone_preferences"        # Time zone queries and location preferences

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

class NovaMemoryAI:
    """
    Nova Memory AI System - A dedicated memory agent that works alongside Nova

    Core Functions:
    - Only stores & retrieves memory - Pure data storage and recall
    - Activates when Nova forgets - Seamless background operation
    - Feeds missing info back automatically - Transparent to the user
    """

    def __init__(self, storage_file: str = "astra_ai/Date/nova_ai_memory.json"):
        """Initialize the Nova Memory AI System"""
        self.storage_file = storage_file
        self.session_timeout_minutes = 30  # Default 30 minutes
        
        # Initialize user_id
        self.user_id = "default_user"
        
        # Initialize vector index and clustering structures
        self.vector_index = {}  # Maps event_id to embedding vector
        self.clusters = {}      # Maps cluster_id to cluster information
        self.update_log = []    # Logs of updates for tracking preference evolution
        
        # Initialize TF-IDF vectorizer for text embeddings
        self.vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
        
        # Initialize data structure
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
            "memory_events": [],  # Keep original for compatibility
            "conversation": [],
            "sessions": {},
            "current_session": None,
            "conversation_state": {
                "greeting_completed": False,
                "introduction_phase": True,
                "established_user": False
            },
            "fact_history": {},  # Initialize fact_history from the start

            # Comprehensive 27-Category Memory Framework
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

                # New Enhanced Categories for Intelligence Features
                MemoryCategory.GREETING_PATTERNS.value: {},
                MemoryCategory.CONVERSATION_ANALYTICS.value: {},
                MemoryCategory.NEWS_WEATHER_HISTORY.value: {},
                MemoryCategory.TIMEZONE_PREFERENCES.value: {}
            },

            # Enhanced metadata and relationships
            "category_relationships": {},  # Cross-category relationships
            "memory_metadata": {},         # Enhanced metadata for each memory item
            "privacy_settings": {          # Privacy controls
                "default_retention": "permanent",
                "sensitive_data_handling": "encrypted",
                "auto_cleanup_enabled": False,
                "privacy_level_defaults": {
                    "normal": "store_and_recall",
                    "sensitive": "store_encrypted",
                    "private": "session_only"
                }
            },
            "behavioral_adaptation": {     # Dynamic behavior adaptation
                "response_style_preferences": {},
                "communication_adaptations": {},
                "learned_patterns": {},
                "user_feedback_integration": {}
            }
        }
        
        # Add the memory_engine structure as per specification
        self.data["memory_engine"] = {
            "metadata": {
                "version": "1.0",
                "generated_at": datetime.now().isoformat(),
                "description": "Mem0 AI Memory Engine - Event-based user memory management system"
            },
            "memory_events": self.data["memory_events"],  # Reference the same list for consistency
            "vector_index": self.vector_index,            # Reference the same dict
            "clusters": self.clusters,                    # Reference the same dict
            "update_log": self.update_log                 # Reference the same list
        }

        # Initialize advanced engines
        self.fact_extractor = EnhancedFactExtractor()
        self.semantic_engine = SemanticMemoryEngine()
        self.emotional_engine = EmotionalMemoryEngine()
        self.conflict_resolver = ConflictResolution()

        # Advanced memory features
        self.memory_graph = {}  # Relationship graph
        self.importance_scores = {}  # Fact importance tracking
        self.patterns = []  # Detected patterns

        # Load existing data
        self.load_memory()

        # Initialize comprehensive memory management
        self.memory_manager = ComprehensiveMemoryManager(self.data)

        # Initialize search engine for external information retrieval
        self.search_engine = SerpAPISearchEngine()

        # Initialize AI Organizer
        organizer_config = ORGANIZER_CONFIG.copy()
        organizer_config['memory_file_path'] = storage_file
        self.organizer = AIOrganizer(organizer_config)
        self.organizer.organizer_enabled = organizer_config.get('organizer_enabled', True)
        
        # Initialize vector index for semantic similarity and clustering
        self.vector_index = {}  # Maps event_id to embedding vector
        self.clusters = {}      # Maps cluster_id to cluster information
        self.update_log = []    # Logs of updates for tracking preference evolution

    def _json_default(self, o: Any):
        """Custom JSON serializer for dataclasses and other types."""
        if isinstance(o, (datetime, date)):
            return o.isoformat()
        if dataclasses.is_dataclass(o):
            return dataclasses.asdict(o)
        if isinstance(o, Enum):
            return o.value
        try:
            return str(o)
        except Exception:
            return f"<unserializable type: {type(o).__name__}>"

    def load_memory(self):
        """Load memory from storage file"""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    if content:  # Check if file is not empty
                        self.data = json.loads(content)
                    else:
                        # File is empty, use default structure
                        self.data = self._create_default_memory_structure()
            else:
                # File doesn't exist, create default structure
                self.data = self._create_default_memory_structure()
                self.save_memory()
        except json.JSONDecodeError as e:
            print(f"Error loading memory file: {e}")
            # If JSON is invalid/corrupted, use default structure
            self.data = self._create_default_memory_structure()
        except Exception as e:
            print(f"Error loading memory file: {e}")

    def _create_default_memory_structure(self) -> Dict[str, Any]:
        """Create default memory structure"""
        return {
            "user": {
                "user_id": self.user_id,
                "name": None,
                "created_at": datetime.now().isoformat(),
                "status": "active",
                "total_sessions": 0,
                "last_seen": None,
                "relationship_established": False
            },
            "memory_events": [],
            "conversation": [],
            "sessions": {},
            "current_session": None,
            "conversation_state": {
                "greeting_completed": False,
                "introduction_phase": True,
                "established_user": False
            },
            "fact_history": {},

            # Comprehensive 27-Category Memory Framework
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

                # New Enhanced Categories for Intelligence Features
                MemoryCategory.GREETING_PATTERNS.value: {},
                MemoryCategory.CONVERSATION_ANALYTICS.value: {},
                MemoryCategory.NEWS_WEATHER_HISTORY.value: {},
                MemoryCategory.TIMEZONE_PREFERENCES.value: {}
            },

            # Enhanced metadata and relationships
            "category_relationships": {},
            "memory_metadata": {},
            "privacy_settings": {
                "default_retention": "permanent",
                "sensitive_data_handling": "encrypted",
                "auto_cleanup_enabled": False,
                "privacy_level_defaults": {
                    "normal": "store_and_recall",
                    "sensitive": "store_encrypted",
                    "private": "session_only"
                }
            },
            "behavioral_adaptation": {
                "response_style_preferences": {},
                "communication_adaptations": {},
                "learned_patterns": {},
                "user_feedback_integration": {}
            }
        }

    def save_memory(self):
        """Save memory to storage file"""
        try:
            # Create directory if needed
            os.makedirs(os.path.dirname(os.path.abspath(self.storage_file)), exist_ok=True)
            
            # Create backup
            self._create_backup()
            
            # Save updated data
            with open(self.storage_file, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False, default=self._json_default)
        except Exception as e:
            print(f"Error saving memory file: {e}")
            
    def _create_backup(self):
        """Create a backup of the current memory file"""
        try:
            if os.path.exists(self.storage_file):
                backup_dir = os.path.join(os.path.dirname(self.storage_file), 'backups')
                os.makedirs(backup_dir, exist_ok=True)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                backup_path = os.path.join(backup_dir, f'nova_ai_memory_{timestamp}.json')
                shutil.copy2(self.storage_file, backup_path)
        except Exception as e:
            print(f"Warning: Could not create backup: {e}")

    def process_conversation(self, user_message: str, ai_response: str) -> Dict[str, Any]:
        """
        Process a conversation between user and AI, extracting and storing memories
        
        Args:
            user_message: The user's message
            ai_response: The AI's response
            
        Returns:
            Dict containing processing results
        """
        timestamp = datetime.now().isoformat()
        
        # Add to conversation log
        self.data["conversation"].extend([
            {
                "role": "user",
                "content": user_message,
                "timestamp": timestamp
            },
            {
                "role": "assistant",
                "content": ai_response,
                "timestamp": timestamp
            }
        ])
        
        # Extract facts from user message
        facts = self.extract_facts(user_message)
        
        # Process facts
        operations = []
        for fact_type, value in facts.items():
            operations.append(self._process_fact(fact_type, value, timestamp))
        
        # Save memory
        self.save_memory()
        
        return {
            "memory_operations": len(operations),
            "operations": operations,
            "timestamp": timestamp
        }

    def extract_facts(self, message: str) -> Dict[str, Any]:
        """
        Extract facts from user message using enhanced pattern matching
        
        Args:
            message: User message to extract facts from
            
        Returns:
            Dict of extracted facts
        """
        facts = {}
        message_lower = message.lower().strip()
        
        # Extract user name
        name_patterns = [
            r"hi,?\s+i'm\s+(\w+)",
            r"hello,?\s+i'm\s+(\w+)",
            r"my name is\s+(\w+)",
            r"i'm\s+(\w+)(?:\s+and|\s*\.|,|$)",
            r"call me\s+(\w+)"
        ]
        
        for pattern in name_patterns:
            match = re.search(pattern, message_lower, re.IGNORECASE)
            if match:
                name = match.group(1).strip().title()
                facts["name"] = name
                break
        
        # Extract occupation
        occupation_patterns = [
            r"i work as\s+(?:a\s+)?(.+?)(?:\.|,|$)",
            r"i'm\s+(?:a\s+)?(.+?)(?:\s+developer|\s+dev)(?:\.|,|$)",
            r"my job is\s+(.+?)(?:\.|,|$)"
        ]
        
        for pattern in occupation_patterns:
            match = re.search(pattern, message_lower, re.IGNORECASE)
            if match:
                occupation = match.group(1).strip()
                facts["occupation"] = occupation
                break
        
        # Extract preferences
        preference_patterns = [
            (r"i (like|love|enjoy)\s+(.+?)(?:\.|,|$)", "likes"),
            (r"i (hate|dislike)\s+(.+?)(?:\.|,|$)", "dislikes"),
            (r"i (avoid|don't like)\s+(.+?)(?:\.|,|$)", "avoid"),
            (r"i always\s+(.+?)(?:\.|,|$)", "always"),
            (r"keep it\s+(.+?)(?:\.|,|$)", "style"),
            (r"only\s+.+\s+when\s+(.+?)(?:\.|,|$)", "conditional")
        ]
        
        for pattern, pref_type in preference_patterns:
            matches = re.findall(pattern, message_lower, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    value = match[1].strip() if len(match) > 1 else match[0].strip()
                else:
                    value = match.strip()
                
                if pref_type not in facts:
                    facts[pref_type] = []
                facts[pref_type].append(value)
        
        return facts

    def _process_fact(self, fact_type: str, value: Any, timestamp: str) -> Dict[str, Any]:
        """
        Process a single fact and create appropriate memory events
        
        Args:
            fact_type: Type of fact being processed
            value: Value of the fact
            timestamp: Timestamp of the fact
            
        Returns:
            Dict containing the memory operation details
        """
        # Create embedding vector for the fact
        text_vector = self._create_embedding_vector(str(value))
        
        # Create event ID
        event_id = f"evt_{uuid.uuid4().hex[:8]}"
        
        # Analyze emotional context
        emotional_context = self.emotional_engine.analyze_sentiment(str(value))
        
        # Classify category and subcategory
        category, subcategory = self.classify_category_and_subcategory(str(value))
        
        # Calculate importance score
        importance_score = self.calculate_importance_score(str(value), category, asdict(emotional_context))
        
        # Generate semantic context
        semantic_context = self.semantic_engine.analyze_semantic_relationships(str(value), self.data["fact_history"])
        
        # Create provenance information
        provenance = {
            "enhanced_in_place": True,
            "enhanced_at": timestamp,
            "source_info": {
                "source_type": "conversation",
                "source_details": "chat input",
                "context": f"User: {value}",
                "event_index": len(self.data["memory_events"])
            },
            "source_conversation_timestamp": timestamp
        }
        
        # Create appropriate memory event based on fact type
        if fact_type in ["name", "occupation"]:
            # For identity and occupation facts, create ADD event initially
            summary = f"User's {fact_type} is {value}"
            previous_value = None
            
            # Check if this is an update to an existing fact
            if fact_type in self.data["fact_history"]:
                previous_value = self.data["fact_history"][fact_type]
                event_type = "UPDATE"
                summary = f"User's {fact_type} updated from '{previous_value}' to '{value}'"
            else:
                event_type = "ADD"
            
            # Create the memory event
            memory_event = {
                "event_id": event_id,
                "type": event_type,
                "summary": summary,
                "timestamp": timestamp,
                "emotional_context": asdict(emotional_context),
                "semantic_context": asdict(semantic_context),
                "importance_score": importance_score,
                "confidence": 0.85,
                "category": category,
                "subcategory": subcategory,
                "previous_value": previous_value,
                "current_value": value,
                "provenance": provenance,
                f"Added_preference_{fact_type}": f"enjoys {value}" if fact_type == "name" else str(value)
            }
            
            # Store in fact history
            self.data["fact_history"][fact_type] = value
            
        else:
            # For preference facts, create ADD event
            if isinstance(value, list):
                # Handle list of preferences
                preferences_summary = ", ".join(value)
                summary = f"User {fact_type}: {preferences_summary}"
            else:
                summary = f"User {fact_type}: {value}"
            
            memory_event = {
                "event_id": event_id,
                "type": "ADD",
                "summary": summary,
                "timestamp": timestamp,
                "emotional_context": asdict(emotional_context),
                "semantic_context": asdict(semantic_context),
                "importance_score": importance_score,
                "confidence": 0.8,
                "category": category,
                "subcategory": subcategory,
                "previous_value": None,
                "current_value": value,
                "provenance": provenance,
                f"Added_preference_{fact_type}": f"enjoys {', '.join(value)}" if isinstance(value, list) else f"enjoys {value}"
            }
            
            # Store in fact history
            if fact_type not in self.data["fact_history"]:
                self.data["fact_history"][fact_type] = []
            if isinstance(value, list):
                self.data["fact_history"][fact_type].extend(value)
            else:
                self.data["fact_history"][fact_type].append(value)
        
        # Add to memory events
        self.data["memory_events"].append(memory_event)
        
        # Add to vector index
        self.vector_index[event_id] = text_vector
        
        # Add to cluster
        cluster_id = self._create_cluster(f"{category}_{event_id[:8]}", event_id)
        
        # Create update log entry for tracking preference evolution
        if memory_event["type"] == "UPDATE":
            self._create_update_log_entry(event_id, memory_event["previous_value"], 
                                        semantic_context.confidence_score, "refinement")
        
        return memory_event

    def _create_embedding_vector(self, text: str) -> List[float]:
        """
        Create a simple embedding vector for the given text using TF-IDF.
        In a real implementation, this would use a proper embedding model.
        
        Args:
            text: Text to create embedding for
            
        Returns:
            List of floats representing the embedding vector
        """
        if not text:
            return [0.0] * 8  # Return zero vector of fixed size
        
        # Normalize text
        text = text.lower().strip()
        
        # Create a more sophisticated vector based on semantic features
        # Using 8 dimensions for better differentiation
        vector = [0.0] * 8
        
        # Define semantic keywords and their positions
        semantic_keywords = {
            'love': 0, 'like': 1, 'enjoy': 2, 'prefer': 3, 'hate': 4, 'dislike': 5, 'avoid': 6, 'never': 7
        }
        
        # Set values for semantic features
        for word, idx in semantic_keywords.items():
            if word in text:
                vector[idx] = 1.0  # Binary presence
        
        # Add character-based features for uniqueness
        text_hash = hash(text) % 1000000
        # Use some positions to store hash-derived features
        for i in range(4, min(8, 4 + 4)):
            if i < 8:
                vector[i] += ((text_hash >> ((i-4) * 2)) & 0x3) / 4.0  # Add fine-grained differences
        
        # Normalize the vector to unit length
        magnitude = math.sqrt(sum(x * x for x in vector))
        if magnitude > 0:
            vector = [x / magnitude for x in vector]
        
        return vector

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.
        Returns a value between -1 and 1, where 1 means identical direction.
        
        Args:
            vec1: First vector
            vec2: Second vector
            
        Returns:
            Cosine similarity score between the vectors
        """
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = math.sqrt(sum(a * a for a in vec1))
        magnitude2 = math.sqrt(sum(b * b for b in vec2))
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)

    def _find_similar_events(self, new_text: str, threshold: float = 0.75) -> List[Tuple[str, float]]:
        """
        Find events that are similar to the new text based on embedding similarity.
        
        Args:
            new_text: The new text to compare against existing events
            threshold: Minimum similarity score to consider events similar
            
        Returns:
            List of tuples containing (event_id, similarity_score) for similar events
        """
        if not hasattr(self, 'vector_index'):
            self.vector_index = {}
            
        new_vector = self._create_embedding_vector(new_text)
        similar_events = []
        
        for event_id, existing_vector in self.vector_index.items():
            similarity = self._cosine_similarity(new_vector, existing_vector)
            if similarity >= threshold:
                similar_events.append((event_id, similarity))
        
        # Sort by similarity score (highest first)
        similar_events.sort(key=lambda x: x[1], reverse=True)
        return similar_events

    def _create_cluster(self, topic_label: str, initial_event_id: str) -> str:
        """
        Create a new cluster for related events.
        
        Args:
            topic_label: Human-readable label for the cluster
            initial_event_id: The first event to be included in this cluster
            
        Returns:
            The ID of the newly created cluster
        """
        if not hasattr(self, 'clusters'):
            self.clusters = {}
            
        cluster_id = f"cluster_{uuid.uuid4().hex[:8]}"
        
        initial_vector = self.vector_index.get(initial_event_id, [0.0] * 8)  # Use 8 dimensions for consistency
        
        # Calculate coherence score for single event
        coherence_score = 1.0  # Perfect coherence for single event
        
        # Extract semantic tags from topic_label
        dominant_tags = [topic_label.split('_')[0]] if '_' in topic_label else [topic_label]
        cluster_type = topic_label.split('_')[0] if '_' in topic_label else topic_label
        
        self.clusters[cluster_id] = {
            "topic_label": topic_label,
            "centroid_vector": initial_vector,
            "event_ids": [initial_event_id],  # Changed to match specification
            "coherence_score": coherence_score,
            "last_updated": datetime.now().isoformat(),
            "metadata": {
                "dominant_tags": dominant_tags,
                "cluster_type": cluster_type
            }
        }
        
        return cluster_id

    def _add_event_to_cluster(self, cluster_id: str, event_id: str):
        """
        Add an event to an existing cluster and update the cluster centroid.
        
        Args:
            cluster_id: The ID of the cluster to add to
            event_id: The ID of the event to add
        """
        if not hasattr(self, 'clusters'):
            self.clusters = {}
            
        if cluster_id not in self.clusters:
            return
        
        cluster = self.clusters[cluster_id]
        
        # Add event to cluster if not already present
        if event_id not in cluster["event_ids"]:
            cluster["event_ids"].append(event_id)
        
        # Update cluster's last updated timestamp
        cluster["last_updated"] = datetime.now().isoformat()
        
        # Recalculate centroid vector as average of all vectors in the cluster
        vectors = [self.vector_index[event_id] for event_id in cluster["event_ids"] 
                  if event_id in self.vector_index]
        
        if vectors:
            # Calculate average vector
            centroid = [sum(vec[i] for vec in vectors) / len(vectors) for i in range(len(vectors[0]))]
            cluster["centroid_vector"] = centroid

    def _create_update_log_entry(self, source_event_id: str, replaced_value: str, 
                                similarity_score: float, update_type: str):
        """
        Create an entry in the update log for tracking how preferences evolve.
        
        Args:
            source_event_id: ID of the new event
            replaced_value: Previous value being updated
            similarity_score: Cosine similarity between the two values
            update_type: Type of update (refinement, reversal, reinforcement, habit_change)
        """
        if not hasattr(self, 'update_log'):
            self.update_log = []
            
        update_id = f"upd_{uuid.uuid4().hex[:8]}"
        update_entry = {
            "update_id": update_id,
            "source_event": source_event_id,
            "replaced_value": replaced_value,
            "timestamp": datetime.now().isoformat(),
            "similarity_score": similarity_score,
            "update_type": update_type  # Only include required fields as per specification
        }
        
        self.update_log.append(update_entry)
        
        # Add to memory events as well for tracking
        update_event = {
            "type": "UPDATE_LOG",
            "summary": f"Update log entry: {update_type} from {replaced_value} to {source_event_id}",
            "timestamp": datetime.now().isoformat(),
            "update_entry": update_entry
        }
        
        self.data["memory_events"].append(update_event)

    def _update_clusters_for_event(self, event_id: str, event_data: Dict):
        """
        Update clusters to reflect a new event, either by adding to existing cluster or creating new one.
        
        Args:
            event_id: The ID of the event to add to clusters
            event_data: The complete event data
        """
        if not hasattr(self, 'vector_index') or event_id not in self.vector_index:
            return
            
        if not hasattr(self, 'clusters'):
            self.clusters = {}
            
        event_vector = self.vector_index[event_id]
        event_content = str(event_data.get('current_value', event_data.get('summary', '')))
        event_category = event_data.get('category', 'general')
        
        # Find the most similar existing cluster
        best_cluster_id = None
        best_similarity = -1
        
        for cluster_id, cluster in self.clusters.items():
            if 'centroid_vector' in cluster:
                similarity = self._cosine_similarity(event_vector, cluster['centroid_vector'])
                if similarity > best_similarity and similarity >= 0.7:  # Threshold for clustering
                    best_similarity = similarity
                    best_cluster_id = cluster_id
        
        # If we found a similar cluster, add to it
        if best_cluster_id:
            self._add_event_to_cluster(best_cluster_id, event_id)
        else:
            # Create a new cluster for this event
            topic_label = f"{event_category}_{event_id[:8]}"
            cluster_id = self._create_cluster(topic_label, event_id)
            
            # Add semantic context to the cluster
            cluster = self.clusters[cluster_id]
            cluster["semantic_context"] = {
                "primary_topic": event_category,
                "related_concepts": [event_data.get('subcategory', 'general')],
                "confidence_score": event_data.get('confidence', 0.8),
                "context_type": event_data.get('semantic_context', {}).get('context_type', 'new_fact')
            }

    def classify_category_and_subcategory(self, text: str) -> Tuple[str, str]:
        """
        Classify incoming text into appropriate category and subcategory.
        
        Args:
            text: Input text to classify
            
        Returns:
            Tuple of (category, subcategory)
        """
        text_lower = text.lower()
        
        # Category classification
        if any(keyword in text_lower for keyword in ['name', 'identity', 'pronoun', 'called', 'call me']):
            return MemoryCategory.USER_IDENTITY.value, 'identity_info'
        elif any(keyword in text_lower for keyword in ['like', 'love', 'dislike', 'hate', 'enjoy', 'prefer', 'style', 'formality']):
            return MemoryCategory.PERSONAL_PREFERENCES.value, 'preferences'
        elif any(keyword in text_lower for keyword in ['project', 'working on', 'building', 'task', 'deadline', 'tech stack']):
            return MemoryCategory.TASK_PROJECT_TRACKING.value, 'projects'
        elif any(keyword in text_lower for keyword in ['usually', 'always', 'often', 'time', 'active', 'schedule']):
            return MemoryCategory.ACTIVITY_BEHAVIOR.value, 'behavior_patterns'
        elif any(keyword in text_lower for keyword in ['don\'t', 'never', 'stop', 'avoid asking', 'unless']):
            return MemoryCategory.COMMUNICATION_BOUNDARIES.value, 'boundaries'
        elif any(keyword in text_lower for keyword in ['currently', 'now', 'recently', 'today']):
            return MemoryCategory.CURRENT_STATE.value, 'current_state'
        elif any(keyword in text_lower for keyword in ['learning', 'skill', 'improve', 'develop', 'progress']):
            return MemoryCategory.PERSONAL_DEVELOPMENT.value, 'development'
        elif any(keyword in text_lower for keyword in ['goal', 'dream', 'aspiration', 'career', 'future']):
            return MemoryCategory.LONG_TERM_GOALS.value, 'goals'
        elif any(keyword in text_lower for keyword in ['friend', 'colleague', 'team', 'partner', 'coworker']):
            return MemoryCategory.COLLABORATOR_RELATIONSHIPS.value, 'relationships'
        elif any(keyword in text_lower for keyword in ['data', 'privacy', 'retention', 'private']):
            return MemoryCategory.DATA_PRIVACY.value, 'privacy'
        elif any(keyword in text_lower for keyword in ['tool', 'integration', 'api', 'permission']):
            return MemoryCategory.TOOL_INTEGRATION.value, 'tools'
        elif any(keyword in text_lower for keyword in ['response', 'tone', 'style', 'adaptation']):
            return MemoryCategory.RESPONSE_ADAPTATION.value, 'adaptation'
        elif any(keyword in text_lower for keyword in ['file', 'media', 'upload', 'link']):
            return MemoryCategory.FILE_MEDIA.value, 'media'
        elif any(keyword in text_lower for keyword in ['knowledge', 'expertise', 'skill', 'competency']):
            return MemoryCategory.KNOWLEDGE_EXPERTISE.value, 'expertise'
        elif any(keyword in text_lower for keyword in ['multi', 'role', 'profile', 'identity']):
            return MemoryCategory.MULTI_IDENTITY.value, 'identity'
        elif any(keyword in text_lower for keyword in ['multimodal', 'image', 'audio', 'visual']):
            return MemoryCategory.MULTIMODAL_PREFERENCES.value, 'multimodal'
        elif any(keyword in text_lower for keyword in ['system', 'error', 'feedback', 'constraint']):
            return MemoryCategory.SYSTEM_AWARENESS.value, 'system'
        elif any(keyword in text_lower for keyword in ['theme', 'emotional arc', 'continuity']):
            return MemoryCategory.SESSION_THEMES.value, 'themes'
        elif any(keyword in text_lower for keyword in ['meta', 'browser', 'ui', 'change log']):
            return MemoryCategory.META_MEMORY.value, 'meta'
        elif any(keyword in text_lower for keyword in ['temporal', 'pattern', 'behavior']):
            return MemoryCategory.TEMPORAL_PATTERNS.value, 'patterns'
        elif any(keyword in text_lower for keyword in ['search', 'external', 'internet', 'query']):
            return MemoryCategory.SEARCH_EXTERNAL_INFO.value, 'search'
        elif any(keyword in text_lower for keyword in ['greeting', 'hello', 'hi', 'welcome']):
            return MemoryCategory.GREETING_PATTERNS.value, 'greetings'
        elif any(keyword in text_lower for keyword in ['conversation', 'duration', 'session', 'analytics']):
            return MemoryCategory.CONVERSATION_ANALYTICS.value, 'analytics'
        elif any(keyword in text_lower for keyword in ['news', 'weather', 'current events']):
            return MemoryCategory.NEWS_WEATHER_HISTORY.value, 'news_weather'
        elif any(keyword in text_lower for keyword in ['timezone', 'location', 'time']):
            return MemoryCategory.TIMEZONE_PREFERENCES.value, 'timezone'
        else:
            return MemoryCategory.USER_IDENTITY.value, 'general'  # Default category

    def calculate_importance_score(self, text: str, category: str, emotional_context: Dict = None) -> float:
        """
        Calculate importance score for a memory event based on various factors.
        
        Args:
            text: Text content of the event
            category: Category of the event
            emotional_context: Emotional context of the event
            
        Returns:
            Importance score between 0.0 and 1.0
        """
        base_score = 0.5  # Base importance
        
        # Category-based weighting
        high_importance_categories = [
            MemoryCategory.USER_IDENTITY.value, 
            MemoryCategory.PERSONAL_PREFERENCES.value,
            MemoryCategory.USER_INSTRUCTIONS.value,
            MemoryCategory.COMMUNICATION_BOUNDARIES.value
        ]
        
        if category in high_importance_categories:
            base_score += 0.2
        
        # Content-based weighting
        important_indicators = [
            'name', 'identity', 'important', 'critical', 'essential', 'must', 'never', 
            'always', 'always remember', 'do not forget', 'key', 'primary', 'main'
        ]
        
        text_lower = text.lower()
        for indicator in important_indicators:
            if indicator in text_lower:
                base_score += 0.1
                break
        
        # Emotional context weighting
        if emotional_context:
            emotional_intensity = emotional_context.get('emotional_intensity', 0.5)
            sentiment_value = emotional_context.get('sentiment', '')
            sentiment_importance = 0.1 if sentiment_value in ['positive', 'negative'] else 0.05
            base_score += emotional_intensity * 0.1 + sentiment_importance
        
        return min(base_score, 1.0)

    def get_memory_context(self, query: str = "") -> Dict[str, Any]:
        """
        Get memory context for AI response generation
        
        Args:
            query: Optional query to filter context
            
        Returns:
            Dict containing memory context
        """
        context = {
            "user_info": self.data["user"],
            "facts": self.data["fact_history"],
            "recent_conversations": self.data["conversation"][-10:] if self.data["conversation"] else [],
            "memory_events": self.data["memory_events"][-5:] if self.data["memory_events"] else [],
            "session_info": self.get_session_info(),
            "conversation_state": self.data["conversation_state"]
        }
        
        return context

    def get_user_context(self, context_type: str = "comprehensive") -> Dict[str, Any]:
        """
        Get user context for AI response generation
        
        Args:
            context_type: Type of context to retrieve
            
        Returns:
            Dict containing user context
        """
        return self.get_memory_context()

    def get_comprehensive_user_profile(self) -> Dict[str, Any]:
        """
        Get comprehensive user profile across all memory categories
        
        Returns:
            Dict containing complete user profile
        """
        profile = {
            "user_info": self.data["user"],
            "facts": self.data["fact_history"],
            "total_items": len(self.data["fact_history"]),
            "categories": {},
            "relationship_established": self.data["user"].get("relationship_established", False),
            "last_activity": self.data["user"].get("last_seen")
        }
        
        # Count items in each category
        for category, items in self.data["memory_categories"].items():
            profile["categories"][category] = len(items)
        
        return profile

    def get_memory_stats(self) -> Dict[str, Any]:
        """
        Get memory statistics
        
        Returns:
            Dict containing memory statistics
        """
        return {
            "total_facts": len(self.data["fact_history"]),
            "total_events": len(self.data["memory_events"]),
            "total_conversations": len(self.data["conversation"]),
            "active_categories": len([cat for cat, items in self.data["memory_categories"].items() if items]),
            "total_sessions": len(self.data["sessions"])
        }

    def get_session_info(self) -> Dict[str, Any]:
        """
        Get conversation session information for intelligent greetings
        
        Returns:
            Dict containing session information
        """
        sessions = self.data["sessions"]
        current_session = self.data["current_session"]
        
        if not sessions:
            return {
                "is_first_time": True,
                "total_sessions": 0,
                "last_session": None,
                "time_since_last": None,
                "user_name": self.data["user"].get("name")
            }
        
        session_count = len(sessions)
        last_session = max(sessions.values(), key=lambda x: x["start_time"]) if sessions else None
        
        # Calculate time since last session
        time_since_last = None
        if last_session:
            try:
                last_time = datetime.fromisoformat(last_session["start_time"])
                time_since_last = (datetime.now() - last_time).total_seconds() / 3600  # Hours
            except:
                pass
        
        return {
            "is_first_time": session_count <= 1,
            "total_sessions": session_count,
            "last_session": last_session,
            "time_since_last": time_since_last,
            "user_name": self.data["user"].get("name")
        }

    def end_session(self):
        """End the current conversation session"""
        current_session_id = self.data["current_session"]
        if current_session_id and current_session_id in self.data["sessions"]:
            session = self.data["sessions"][current_session_id]
            session["end_time"] = datetime.now().isoformat()
            
            # Calculate session duration
            try:
                start_time = datetime.fromisoformat(session["start_time"])
                end_time = datetime.fromisoformat(session["end_time"])
                duration = end_time - start_time
                session["session_duration"] = str(duration)
            except:
                session["session_duration"] = "unknown"
        
        # Save memory
        self.save_memory()

    def get_conversation_state(self) -> Dict[str, Any]:
        """Get conversation state for AI response filtering"""
        return self.data["conversation_state"]

    def mark_greeting_completed(self):
        """Mark greeting as completed"""
        self.data["conversation_state"]["greeting_completed"] = True
        self.data["conversation_state"]["introduction_phase"] = False
        self.data["conversation_state"]["established_user"] = True
        self.data["user"]["relationship_established"] = True
        self.save_memory()

    def recall_historical_information(self, query: str) -> Dict[str, Any]:
        """Recall historical information based on natural language queries"""
        # For now, return fact history as historical information
        return {
            "found": len(self.data["fact_history"]) > 0,
            "results": [{"fact_type": k, "value": v} for k, v in self.data["fact_history"].items()],
            "query": query
        }

    def get_dynamic_conversation_context(self) -> Dict[str, Any]:
        """Get comprehensive dynamic context for response generation"""
        return self.get_memory_context()

    def _get_timeline(self) -> List[Dict]:
        """Get chronological timeline of all changes"""
        timeline = []
        
        # Add memory events to timeline
        for event in self.data["memory_events"]:
            if isinstance(event, dict):
                timeline.append({
                    "type": "memory_event",
                    "timestamp": event.get("timestamp", ""),
                    "summary": event.get("summary", ""),
                    "event_type": event.get("type", "UNKNOWN")
                })
        
        # Add conversation entries to timeline
        for conv in self.data["conversation"]:
            if isinstance(conv, dict):
                timeline.append({
                    "type": "conversation",
                    "timestamp": conv.get("timestamp", ""),
                    "summary": f"{conv.get('role', 'unknown')}: {conv.get('content', '')[:50]}...",
                    "event_type": conv.get("role", "unknown").upper()
                })
        
        # Sort by timestamp
        timeline.sort(key=lambda x: x["timestamp"])
        return timeline

    def _get_historical_values(self, fact_type: str, filter_type: str = "all") -> List[Dict]:
        """Get complete history for a specific fact type"""
        history = self.data["fact_history"].get(fact_type, [])
        if not isinstance(history, list):
            history = [history]
        return history

    def get_semantic_insights(self) -> Dict[str, Any]:
        """Get semantic insights about user's information"""
        insights = {
            "total_facts": len(self.data["fact_history"]),
            "categories_represented": len([cat for cat in self.data["memory_categories"].values() if cat]),
            "relationship_density": len(self.memory_graph) / max(len(self.data["fact_history"]), 1)
        }
        return insights

    def get_emotional_timeline(self) -> List[Dict[str, Any]]:
        """Get emotional timeline of memories"""
        timeline = []
        for event in self.data["memory_events"]:
            if isinstance(event, dict) and "emotional_context" in event:
                timeline.append({
                    "timestamp": event["timestamp"],
                    "sentiment": event["emotional_context"].get("sentiment", "neutral"),
                    "emotional_intensity": event["emotional_context"].get("emotional_intensity", 0.5),
                    "summary": event["summary"]
                })
        return timeline

    def get_accumulated_preferences(self, preference_type: str = None) -> Dict[str, Any]:
        """Get accumulated preferences with timestamps"""
        preferences = self.data["fact_history"].get("personal_preferences", {})
        
        if preference_type and preference_type in preferences:
            return {preference_type: preferences[preference_type]}
        elif preference_type:
            return {}
        else:
            return preferences

    def transform_fact_history_to_unified_format(self) -> Dict[str, Any]:
        """
        Transform fact_history to unified format with all personal preferences consolidated
        under personal_preferences with subcategories.
        """
        # Define personal preference types that need to be unified
        personal_pref_types = [
            "likes", "dislikes", "avoid", "always", "style", "conditional", "interests"
        ]
        
        # Create the new structure with preserved non-personal-preference entries
        new_fact_history = {}
        
        # Group all personal preferences together
        personal_preferences = {
            "likes": [],
            "dislikes": [],
            "avoid": [],
            "always": [],
            "style": [],
            "conditional": [],
            "interests": []
        }
        
        # Process all entries in the original fact_history
        original_fact_history = self.data.get("fact_history", {})
        for key, value in original_fact_history.items():
            if key in personal_pref_types:
                # Process each entry in the value list
                if isinstance(value, list):
                    for item in value:
                        processed_item = self._process_preference_item(item, key)
                        if processed_item:
                            personal_preferences[key].append(processed_item)
                else:
                    processed_item = self._process_preference_item(value, key)
                    if processed_item:
                        personal_preferences[key].append(processed_item)
            else:
                # Preserve non-personal preference entries as they are
                new_fact_history[key] = value
        
        # Add the unified personal_preferences section
        new_fact_history["personal_preferences"] = personal_preferences
        
        # Update the data structure
        self.data["fact_history"] = new_fact_history
        
        # Save the updated data
        self.save_memory()
        
        return new_fact_history

    def _process_preference_item(self, item: Any, subcategory: str) -> Optional[Dict[str, Any]]:
        """
        Process a single preference item to extract 'item', 'added', 'updated', and 'score'.
        
        Args:
            item: Individual preference item from the fact_history
            subcategory: The subcategory of the preference
            
        Returns:
            Processed item with standardized format, or None if invalid
        """
        if not item:
            return None
        
        # Handle if item is already in unified format
        if isinstance(item, dict) and "item" in item:
            # Validate that all required fields exist
            if all(field in item for field in ["item", "score", "added", "updated"]):
                # Ensure score is a valid float between 0 and 1
                score = item.get("score", 0.8)
                if not isinstance(score, (int, float)):
                    score = 0.8
                score = min(max(float(score), 0.0), 1.0)  # Clamp between 0 and 1
                
                return {
                    "item": item["item"],
                    "score": score,
                    "added": item["added"],
                    "updated": item["updated"]
                }
            else:
                # If not in unified format, continue with processing
                pass
        
        # Handle if item is a dict with value and timestamp
        elif isinstance(item, dict):
            value_str = item.get("value", "")
            timestamp = item.get("timestamp", "")
            confidence = item.get("confidence", 0.8)
            
            # Ensure confidence is a valid float between 0 and 1
            if not isinstance(confidence, (int, float)):
                confidence = 0.8
            confidence = min(max(float(confidence), 0.0), 1.0)
            
            # If the value_str is already in a list format like "[{'item': '...', 'added_at': '...'}]"
            if isinstance(value_str, str) and value_str.startswith("[{"):
                try:
                    parsed_values = json.loads(value_str)
                    if isinstance(parsed_values, list) and len(parsed_values) > 0:
                        first_entry = parsed_values[0]
                        if isinstance(first_entry, dict):
                            actual_item = first_entry.get("item", str(value_str))
                            added_at = first_entry.get("added_at", timestamp)
                        else:
                            actual_item = str(value_str)
                            added_at = timestamp
                    else:
                        actual_item = str(value_str)
                        added_at = timestamp
                except json.JSONDecodeError:
                    # If JSON parsing fails, extract using regex
                    item_match = re.search(r"'item':\s*'([^']*)'", value_str)
                    if item_match:
                        actual_item = item_match.group(1)
                        added_match = re.search(r"'added_at':\s*'([^']*)'", value_str)
                        added_at = added_match.group(1) if added_match else timestamp
                    else:
                        actual_item = str(value_str)
                        added_at = timestamp
            else:
                actual_item = str(value_str)
                added_at = timestamp
            
            added_date = self._extract_date_from_timestamp(added_at)
            updated_date = self._extract_date_from_timestamp(timestamp)
            
            if not actual_item:
                return None
            
            return {
                "item": actual_item,
                "score": confidence,
                "added": added_date,
                "updated": updated_date
            }
        
        # Handle string values directly
        else:
            return {
                "item": str(item),
                "score": 0.8,
                "added": datetime.now().strftime('%Y-%m-%d'),
                "updated": datetime.now().strftime('%Y-%m-%d')
            }

    def _extract_date_from_timestamp(self, timestamp: str) -> str:
        """
        Extract date in YYYY-MM-DD format from ISO timestamp.
        
        Args:
            timestamp: ISO format timestamp string
            
        Returns:
            Date in YYYY-MM-DD format or today's date if parsing fails
        """
        if not timestamp:
            # Return today's date if no timestamp provided
            return datetime.now().strftime('%Y-%m-%d')
        
        try:
            # Parse the timestamp and extract just the date part
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            return dt.strftime('%Y-%m-%d')
        except ValueError:
            # If parsing fails, return today's date
            return datetime.now().strftime('%Y-%m-%d')

# Additional classes and functions continued in the full implementation...