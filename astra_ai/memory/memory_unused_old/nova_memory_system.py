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

class ComprehensiveCategoryDetector:
    """
    Advanced 27-category detection engine.
    """
    def __init__(self):
        self.category_schemas = self._initialize_category_schemas()
        self.detection_patterns = self._initialize_detection_patterns()
        self.relationship_map = self._initialize_relationships()
        self.temporal_trackers = {}  # Track time-based patterns
        self.confidence_thresholds = self._initialize_confidence_thresholds()

    def _initialize_category_schemas(self) -> Dict[str, Any]:
        """Initialize schemas for all 27 categories."""
        schemas = {}
        for cat in MemoryCategory:
            schemas[cat.value] = CategorySchema(
                name=cat.value,
                description=cat.name.replace("_", " ").title(),
                fields=["value", "timestamp", "metadata"],
                allow_nested=True,
                privacy_level="normal",
                retention_policy="permanent"
            )
        return schemas

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

    def detect_categories(self, message: str, context: Dict = None) -> List[Dict]:
        """
        Comprehensive category detection across all 22 categories.
        Returns list of detected memory items with category, confidence, and metadata.
        """
        detected_items = []
        message_lower = message.lower().strip()

        # Detect across all categories
        for category, schema in self.category_schemas.items():
            category_items = self._detect_category_specific(message, message_lower, category, schema, context)
            detected_items.extend(category_items)

        # Apply cross-category relationship analysis
        detected_items = self._apply_relationship_analysis(detected_items, message, context)

        # Filter by confidence thresholds
        filtered_items = [
            item for item in detected_items
            if item['confidence'] >= self.confidence_thresholds.get(item['category'], 0.7)
        ]

        return filtered_items

    def _detect_category_specific(self, message: str, message_lower: str, category: str, schema: CategorySchema, context: Dict = None) -> List[Dict]:
        """Detect information specific to a single category"""
        items = []

        # Pattern-based detection
        for pattern in schema.detection_patterns:
            matches = re.findall(pattern, message_lower, re.IGNORECASE)
            if matches:
                value = matches[0].strip() if isinstance(matches[0], str) else ' '.join(matches[0]).strip()

                # Determine subcategory
                subcategory = self._determine_subcategory(category, value, message_lower)

                # Calculate confidence
                confidence = self._calculate_detection_confidence(pattern, value, message, context)

                # Create memory item
                item = {
                    'category': category,
                    'subcategory': subcategory,
                    'key': self._generate_memory_key(category, subcategory, value),
                    'value': value,
                    'confidence': confidence,
                    'timestamp': datetime.now().isoformat(),
                    'source': 'pattern_detection',
                    'pattern_used': pattern,
                    'privacy_level': schema.privacy_level,
                    'retention_policy': schema.retention_policy
                }

                # Add context-specific metadata
                if context:
                    item['session_id'] = context.get('session_id')
                    emotional_context = context.get('emotional_context')
                    if emotional_context and hasattr(emotional_context, 'sentiment'):
                        item['emotional_context'] = emotional_context.sentiment
                    else:
                        item['emotional_context'] = None

                items.append(item)

        # Semantic detection for categories that need deeper understanding
        semantic_items = self._semantic_category_detection(message, message_lower, category, schema, context)
        items.extend(semantic_items)

        return items

    def _determine_subcategory(self, category: str, value: str, message_lower: str) -> str:
        """Determine the most appropriate subcategory for detected information"""
        schema = self.category_schemas[category]

        # Use keyword matching to determine subcategory
        subcategory_keywords = {
            # User Identity subcategories
            'name': ['name', 'called', 'call me'],
            'pronouns': ['pronoun', 'he', 'she', 'they', 'use'],
            'nicknames': ['nickname', 'nick', 'goes by'],

            # Personal Preferences subcategories
            'response_style': ['keep it', 'make it', 'response', 'answer'],
            'formality': ['formal', 'casual', 'professional', 'respectful'],
            'explanation_rules': ['explain', 'don\'t explain', 'only explain'],

            # Task Project subcategories
            'active_projects': ['project', 'working on', 'building'],
            'tech_stack': ['using', 'tech', 'language', 'framework'],
            'deadlines': ['deadline', 'due', 'finish by'],

            # And so on for other categories...
        }

        # Find best matching subcategory
        for subcategory in schema.subcategories:
            keywords = subcategory_keywords.get(subcategory, [subcategory.replace('_', ' ')])
            if any(keyword in message_lower for keyword in keywords):
                return subcategory

        # Default to first subcategory if no specific match
        return schema.subcategories[0] if schema.subcategories else 'general'

    def _calculate_detection_confidence(self, pattern: str, value: str, message: str, context: Dict = None) -> float:
        """Calculate confidence score for detected information"""
        base_confidence = 0.7

        # Adjust based on pattern specificity
        if len(pattern) > 20:  # More specific patterns get higher confidence
            base_confidence += 0.1

        # Adjust based on value quality
        if len(value.split()) > 1:  # Multi-word values are more reliable
            base_confidence += 0.05

        # Adjust based on context
        if context:
            # Higher confidence if emotional context is clear
            emotional_context = context.get('emotional_context')
            if emotional_context and hasattr(emotional_context, 'confidence'):
                if emotional_context.confidence > 0.8:
                    base_confidence += 0.05
            elif emotional_context and hasattr(emotional_context, 'emotional_intensity'):
                if emotional_context.emotional_intensity > 0.7:
                    base_confidence += 0.05

            # Higher confidence if part of ongoing conversation
            if context.get('previous_messages') and len(context['previous_messages']) > 2:
                base_confidence += 0.05

        return min(base_confidence, 1.0)

    def _generate_memory_key(self, category: str, subcategory: str, value: str) -> str:
        """Generate a unique key for the memory item"""
        # Create a hash-based key for uniqueness
        key_string = f"{category}.{subcategory}.{value[:50]}"
        return hashlib.md5(key_string.encode()).hexdigest()[:12]

    def _semantic_category_detection(self, message: str, message_lower: str, category: str, schema: CategorySchema, context: Dict = None) -> List[Dict]:
        """Advanced semantic detection for categories requiring deeper understanding"""
        items = []

        # Semantic patterns for complex categories
        if category == MemoryCategory.PERSONAL_DEVELOPMENT.value:
            items.extend(self._detect_learning_progress(message, message_lower, context))
        elif category == MemoryCategory.COMMUNICATION_BOUNDARIES.value:
            items.extend(self._detect_emotional_boundaries(message, message_lower, context))
        elif category == MemoryCategory.LONG_TERM_GOALS.value:
            items.extend(self._detect_aspirations_goals(message, message_lower, context))
        elif category == MemoryCategory.COLLABORATOR_RELATIONSHIPS.value:
            items.extend(self._detect_collaborator_relationships(message, message_lower, context))
        elif category == MemoryCategory.ACTIVITY_BEHAVIOR.value:
            items.extend(self._detect_behavioral_patterns(message, message_lower, context))

        return items

    def _detect_collaborator_relationships(self, message: str, message_lower: str, context: Dict = None) -> List[Dict]:
        """Detect collaborator relationships like 'Marco is my best friend' or 'cousin (jogging partner)'."""
        items = []

        # Patterns: '<Name> is my <relation>' or '<relation> <Name>' or 'my <relation> is <Name>'
        patterns = [
            r"([A-Z][a-z]+) is my (best friend|friend|cousin|brother|sister|partner|exercise partner|jogging partner)",
            r"my (best friend|friend|cousin|exercise partner|jogging partner) is ([A-Z][a-z]+)",
            r"(cousin|best friend|exercise partner|jogging partner) \(?([A-Z][a-z]+)\)?"
        ]

        for pat in patterns:
            for m in re.finditer(pat, message, flags=re.IGNORECASE):
                groups = m.groups()
                # Normalize extraction
                name = None
                rel = None
                for g in groups:
                    if not g:
                        continue
                    if re.match(r'^[A-Z][a-z]+', str(g)):
                        name = g.strip()
                    else:
                        rel = g.strip().lower().replace(' ', '_')

                if name and rel:
                    # Map common relationship aliases
                    mapping = {
                        'best_friend': 'best_friend',
                        'friend': 'friend',
                        'cousin': 'cousin',
                        'exercise_partner': 'exercise_partner',
                        'jogging_partner': 'exercise_partner',
                        'partner': 'partner'
                    }
                    rel_key = mapping.get(rel, rel)
                    # Store structured collaborator relationship
                    try:
                        self.store_collaborator_relationship(rel_key, name)
                    except Exception:
                        pass

                    # Create concise summary
                    summary = f"User's {rel_key} is {name}"
                    
                    items.append({
                        'category': MemoryCategory.COLLABORATOR_RELATIONSHIPS.value,
                        'subcategory': rel_key,
                        'key': self._generate_memory_key(MemoryCategory.COLLABORATOR_RELATIONSHIPS.value, rel_key, name),
                        'value': name,
                        'confidence': 0.9,
                        'timestamp': datetime.now().isoformat(),
                        'source': 'semantic_detection',
                        'privacy_level': 'normal',
                        'retention_policy': 'permanent',
                        'summary': summary  # Add concise summary
                    })

        return items

    def _detect_learning_progress(self, message: str, message_lower: str, context: Dict = None) -> List[Dict]:
        """Detect learning progress and skill development"""
        items = []

        # Progress indicators
        progress_patterns = [
            (r"getting better at (.+)", "improvement"),
            (r"struggling with (.+)", "challenge"),
            (r"mastered (.+)", "achievement"),
            (r"need to work on (.+)", "development_area"),
            (r"learned (.+)", "new_skill")
        ]

        for pattern, subcategory in progress_patterns:
            matches = re.findall(pattern, message_lower, re.IGNORECASE)
            for match in matches:
                items.append({
                    'category': MemoryCategory.PERSONAL_DEVELOPMENT.value,
                    'subcategory': subcategory,
                    'key': self._generate_memory_key(MemoryCategory.PERSONAL_DEVELOPMENT.value, subcategory, match),
                    'value': match.strip(),
                    'confidence': 0.8,
                    'timestamp': datetime.now().isoformat(),
                    'source': 'semantic_detection',
                    'privacy_level': 'normal',
                    'retention_policy': 'permanent'
                })

        return items

    def _detect_emotional_boundaries(self, message: str, message_lower: str, context: Dict = None) -> List[Dict]:
        """Detect emotional boundaries and sensitive topics"""
        items = []

        boundary_patterns = [
            (r"don't want to talk about (.+)", "sensitive_topic"),
            (r"uncomfortable discussing (.+)", "sensitive_topic"),
            (r"triggers me when (.+)", "trigger"),
            (r"makes me anxious (.+)", "anxiety_trigger"),
            (r"please avoid (.+)", "avoidance_request")
        ]

        for pattern, subcategory in boundary_patterns:
            matches = re.findall(pattern, message_lower, re.IGNORECASE)
            for match in matches:
                items.append({
                    'category': MemoryCategory.COMMUNICATION_BOUNDARIES.value,
                    'subcategory': subcategory,
                    'key': self._generate_memory_key(MemoryCategory.COMMUNICATION_BOUNDARIES.value, subcategory, match),
                    'value': match.strip(),
                    'confidence': 0.9,  # High confidence for explicit boundaries
                    'timestamp': datetime.now().isoformat(),
                    'source': 'semantic_detection',
                    'privacy_level': 'sensitive',
                    'retention_policy': 'permanent'
                })

        return items

    def _detect_aspirations_goals(self, message: str, message_lower: str, context: Dict = None) -> List[Dict]:
        """Detect long-term goals and aspirations"""
        items = []

        goal_patterns = [
            (r"want to become (.+)", "career_aspiration"),
            (r"dream of (.+)", "life_dream"),
            (r"goal is to (.+)", "specific_goal"),
            (r"hoping to (.+)", "aspiration"),
            (r"working towards (.+)", "active_goal")
        ]

        for pattern, subcategory in goal_patterns:
            matches = re.findall(pattern, message_lower, re.IGNORECASE)
            for match in matches:
                val = match.strip()
                # Try to extract target dates like 'by 2026', 'in 2027', 'within 2 years'
                date_match = re.search(r'by\s+(\d{4})|in\s+(\d{4})|within\s+(\d+)\s+years', val)
                target_date = None
                if date_match:
                    if date_match.group(1):
                        target_date = date_match.group(1)
                    elif date_match.group(2):
                        target_date = date_match.group(2)
                    elif date_match.group(3):
                        try:
                            years = int(date_match.group(3))
                            target_date = str(datetime.now().year + years)
                        except Exception:
                            target_date = None

                item = {
                    'category': MemoryCategory.LONG_TERM_GOALS.value,
                    'subcategory': subcategory,
                    'key': self._generate_memory_key(MemoryCategory.LONG_TERM_GOALS.value, subcategory, val),
                    'value': val,
                    'confidence': 0.85,
                    'timestamp': datetime.now().isoformat(),
                    'source': 'semantic_detection',
                    'privacy_level': 'normal',
                    'retention_policy': 'permanent'
                }

                items.append(item)

                # If the subcategory looks like a career or skill aspiration, store structured goal
                if 'career' in subcategory or 'goal' in subcategory or 'skill' in val.lower():
                    try:
                        goal_type = 'career_goal' if 'career' in subcategory or 'become' in val.lower() else 'skill_goal'
                        self.store_long_term_goal(goal_type, val, target_date)
                    except Exception:
                        pass

        return items

    def _detect_behavioral_patterns(self, message: str, message_lower: str, context: Dict = None) -> List[Dict]:
        """Detect activity and behavioral patterns"""
        items = []

        behavior_patterns = [
            (r"usually (.+) in the (.+)", "time_pattern"),
            (r"always (.+) when (.+)", "conditional_behavior"),
            (r"tend to (.+)", "behavioral_tendency"),
            (r"habit of (.+)", "habit"),
            (r"routine (.+)", "routine")
        ]

        for pattern, subcategory in behavior_patterns:
            matches = re.findall(pattern, message_lower, re.IGNORECASE)
            for match in matches:
                value = ' '.join(match) if isinstance(match, tuple) else match
                items.append({
                    'category': MemoryCategory.ACTIVITY_BEHAVIOR.value,
                    'subcategory': subcategory,
                    'key': self._generate_memory_key(MemoryCategory.ACTIVITY_BEHAVIOR.value, subcategory, value),
                    'value': value.strip(),
                    'confidence': 0.75,
                    'timestamp': datetime.now().isoformat(),
                    'source': 'semantic_detection',
                    'privacy_level': 'normal',
                    'retention_policy': 'permanent'
                })

        return items

    def _apply_relationship_analysis(self, detected_items: List[Dict], message: str, context: Dict = None) -> List[Dict]:
        """Apply cross-category relationship analysis to enhance detected items"""
        enhanced_items = []

        for item in detected_items:
            # Add relationship metadata
            item['relationships'] = self._find_related_categories(item, detected_items)

            # Enhance confidence based on relationships
            item['confidence'] = self._adjust_confidence_by_relationships(item, detected_items)

            # Add temporal context
            item['temporal_context'] = self._analyze_temporal_context(item, context)

            enhanced_items.append(item)

        return enhanced_items

    def _find_related_categories(self, item: Dict, all_items: List[Dict]) -> List[str]:
        """Find categories related to the current item"""
        category = item['category']
        related = self.relationship_map.get(category, [])

        # Find actual related items in the current detection
        found_relations = []
        for other_item in all_items:
            if other_item['category'] in related and other_item != item:
                found_relations.append(other_item['category'])

        return found_relations

    def _adjust_confidence_by_relationships(self, item: Dict, all_items: List[Dict]) -> float:
        """Adjust confidence based on related items found"""
        base_confidence = item['confidence']

        # Boost confidence if related items are found
        if item.get('relationships'):
            boost = min(0.1 * len(item['relationships']), 0.2)
            base_confidence += boost

        return min(base_confidence, 1.0)

    def _analyze_temporal_context(self, item: Dict, context: Dict = None) -> Dict:
        """Analyze temporal context for the memory item"""
        temporal_info = {
            'is_current': True,
            'is_historical': False,
            'time_relevance': 'immediate'
        }

        if context and context.get('session_id'):
            temporal_info['session_id'] = context['session_id']

        # Analyze if this is about past, present, or future
        value_lower = str(item['value']).lower()
        if any(word in value_lower for word in ['used to', 'previously', 'before', 'was']):
            temporal_info['is_historical'] = True
            temporal_info['time_relevance'] = 'historical'
        elif any(word in value_lower for word in ['will', 'going to', 'plan to', 'future']):
            temporal_info['time_relevance'] = 'future'

        return temporal_info

class ComprehensiveMemoryManager:
    """
    Comprehensive memory management system for the 22-category framework.
    Handles browsing, editing, cleanup, privacy controls, and optimization.
    """

    def __init__(self, data: Dict):
        self.data = data
        self.cleanup_rules = self._initialize_cleanup_rules()
        self.privacy_controls = self._initialize_privacy_controls()

    def _initialize_cleanup_rules(self) -> Dict[str, Dict]:
        """Initialize automatic cleanup rules for different categories"""
        return {
            MemoryCategory.CURRENT_STATE.value: {
                "auto_expire_days": 1,
                "max_items": 50,
                "cleanup_strategy": "oldest_first"
            },
            MemoryCategory.SESSION_THEMES.value: {
                "auto_expire_days": 7,
                "max_items": 100,
                "cleanup_strategy": "least_accessed"
            },
            MemoryCategory.TEMPORAL_PATTERNS.value: {
                "auto_expire_days": 30,
                "max_items": 200,
                "cleanup_strategy": "confidence_based"
            }
        }

    def _initialize_privacy_controls(self) -> Dict[str, str]:
        """Initialize privacy control settings"""
        return {
            MemoryCategory.COMMUNICATION_BOUNDARIES.value: "sensitive",
            MemoryCategory.COLLABORATOR_RELATIONSHIPS.value: "sensitive",
            MemoryCategory.DATA_PRIVACY.value: "private",
            MemoryCategory.PERSONAL_DEVELOPMENT.value: "normal",
            MemoryCategory.USER_IDENTITY.value: "normal"
        }

    def browse_memories(self, category: str = None, filters: Dict = None) -> Dict[str, Any]:
        """Browse memories with filtering and pagination"""
        if category:
            memories = self.data["memory_categories"].get(category, {})
        else:
            memories = {}
            for cat, items in self.data["memory_categories"].items():
                memories.update({f"{cat}.{k}": v for k, v in items.items()})

        # Apply filters
        if filters:
            memories = self._apply_filters(memories, filters)

        return {
            "total_count": len(memories),
            "memories": memories,
            "categories_represented": list(set([
                mem.get('category', 'unknown') for mem in memories.values()
            ]))
        }

    def _apply_filters(self, memories: Dict, filters: Dict) -> Dict:
        """Apply filtering criteria to memories"""
        filtered = memories.copy()

        # Filter by confidence
        if 'min_confidence' in filters:
            filtered = {
                k: v for k, v in filtered.items()
                if v.get('confidence', 0) >= filters['min_confidence']
            }

        # Filter by date range
        if 'date_from' in filters or 'date_to' in filters:
            date_from = filters.get('date_from')
            date_to = filters.get('date_to')

            filtered = {
                k: v for k, v in filtered.items()
                if self._is_in_date_range(v.get('timestamp'), date_from, date_to)
            }

        # Filter by privacy level
        if 'privacy_level' in filters:
            filtered = {
                k: v for k, v in filtered.items()
                if v.get('privacy_level') == filters['privacy_level']
            }

        return filtered

    def _is_in_date_range(self, timestamp: str, date_from: str = None, date_to: str = None) -> bool:
        """Check if timestamp is within date range"""
        if not timestamp:
            return False

        try:
            ts = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))

            if date_from:
                from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                if ts < from_date:
                    return False

            if date_to:
                to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                if ts > to_date:
                    return False

            return True
        except:
            return False

    def cleanup_memories(self, category: str = None, dry_run: bool = True) -> Dict[str, Any]:
        """Clean up memories based on retention policies and rules"""
        cleanup_results = {
            "items_to_remove": [],
            "items_to_archive": [],
            "space_saved": 0,
            "categories_affected": []
        }

        categories_to_clean = [category] if category else self.cleanup_rules.keys()

        for cat in categories_to_clean:
            if cat in self.data["memory_categories"]:
                cat_results = self._cleanup_category(cat, dry_run)
                cleanup_results["items_to_remove"].extend(cat_results["removed"])
                cleanup_results["items_to_archive"].extend(cat_results["archived"])
                cleanup_results["categories_affected"].append(cat)

        return cleanup_results

    def _cleanup_category(self, category: str, dry_run: bool) -> Dict[str, List]:
        """Clean up a specific category"""
        results = {"removed": [], "archived": []}

        if category not in self.cleanup_rules:
            return results

        rules = self.cleanup_rules[category]
        items = self.data["memory_categories"][category]

        # Apply cleanup based on strategy
        if rules["cleanup_strategy"] == "oldest_first":
            results = self._cleanup_oldest_first(items, rules, dry_run)
        elif rules["cleanup_strategy"] == "least_accessed":
            results = self._cleanup_least_accessed(items, rules, dry_run)
        elif rules["cleanup_strategy"] == "confidence_based":
            results = self._cleanup_confidence_based(items, rules, dry_run)

        return results

    def _cleanup_oldest_first(self, items: Dict, rules: Dict, dry_run: bool) -> Dict[str, List]:
        """Clean up oldest items first"""
        results = {"removed": [], "archived": []}

        # Sort by timestamp
        sorted_items = sorted(
            items.items(),
            key=lambda x: x[1].get('timestamp', ''),
            reverse=False  # Oldest first
        )

        # Remove items beyond max_items limit
        if len(sorted_items) > rules.get("max_items", float('inf')):
            excess_items = sorted_items[rules["max_items"]:]
            for key, item in excess_items:
                results["removed"].append({"key": key, "item": item})
                if not dry_run:
                    del items[key]

        return results

    def _cleanup_least_accessed(self, items: Dict, rules: Dict, dry_run: bool) -> Dict[str, List]:
        """Clean up least accessed items"""
        results = {"removed": [], "archived": []}

        # Sort by access count
        sorted_items = sorted(
            items.items(),
            key=lambda x: x[1].get('access_count', 0),
            reverse=False  # Least accessed first
        )

        # Remove items beyond max_items limit
        if len(sorted_items) > rules.get("max_items", float('inf')):
            excess_items = sorted_items[rules["max_items"]:]
            for key, item in excess_items:
                results["removed"].append({"key": key, "item": item})
                if not dry_run:
                    del items[key]

        return results

    def _cleanup_confidence_based(self, items: Dict, rules: Dict, dry_run: bool) -> Dict[str, List]:
        """Clean up based on confidence scores"""
        results = {"removed": [], "archived": []}

        # Remove low-confidence items
        low_confidence_threshold = 0.3
        for key, item in list(items.items()):
            if item.get('confidence', 1.0) < low_confidence_threshold:
                results["removed"].append({"key": key, "item": item})
                if not dry_run:
                    del items[key]

        return results

class AdaptiveLearningEngine:
    """
    Advanced adaptive learning engine that automatically learns new patterns,
    fact types, and user preferences from any conversation input.
    """

    def __init__(self):
        self.learned_patterns = {}  # fact_type -> [patterns]
        self.learning_history = []  # List of AdaptiveLearning objects
        self.context_patterns = {}  # Context-based pattern learning
        self.semantic_clusters = {}  # Semantic groupings of similar concepts
        self.user_communication_style = {}  # Learned communication preferences
        self.temporal_patterns = {}  # Time-based pattern recognition

        # Initialize comprehensive category detector
        self.category_detector = ComprehensiveCategoryDetector()

        # Initialize with common linguistic patterns for bootstrapping
        self.bootstrap_patterns()

    def bootstrap_patterns(self):
        """Initialize with basic linguistic patterns for learning foundation"""
        self.base_linguistic_patterns = {
            'preference_indicators': [
                r'i (prefer|like|love|hate|dislike|can\'t stand)',
                r'(never|always|sometimes|usually) (do|use|want|need)',
                r'i\'m (not|really) into',
                r'(don\'t|please don\'t|avoid|stop)',
                r'keep it (simple|detailed|brief|formal|casual)'
            ],
            'state_change_indicators': [
                r'i\'m (now|currently|recently|lately)',
                r'i\'ve (switched|moved|changed|decided|started)',
                r'i (used to|no longer|stopped)',
                r'(switching|moving|changing|dropping) (to|from|away from)'
            ],
            'emotional_indicators': [
                r'i\'m (getting|feeling|becoming)',
                r'i feel (like|that|so)',
                r'(stressed|tired|excited|frustrated|happy|sad|burnt out)'
            ],
            'work_indicators': [
                r'i work (at|for|with|as)',
                r'my (job|work|career|role|position)',
                r'i\'m (freelancing|consulting|employed|unemployed)'
            ]
        }

    def analyze_and_learn(self, message: str, current_facts: Dict, context: Dict = None) -> List[Dict]:
        """
        Comprehensive analysis using 22-category framework with adaptive learning.
        Returns list of extracted operations including newly learned ones.
        """
        operations = []

        # 1. Use comprehensive category detection (primary method)
        detected_items = self.category_detector.detect_categories(message, context)

        # Convert detected items to operations
        for item in detected_items:
            operation = self._convert_item_to_operation(item, current_facts)
            if operation:
                operations.append(operation)

        # 2. Apply existing learned patterns (fallback/enhancement)
        existing_operations = self._apply_existing_patterns(message, current_facts)
        operations.extend(existing_operations)

        # 3. Learn new patterns from unmatched content
        if not operations:  # Only if no operations found
            new_patterns = self._detect_new_patterns(message, current_facts, context)
            operations.extend(new_patterns)

        # 4. Learn from context and conversation flow
        context_operations = self._learn_from_context(message, current_facts, context)
        operations.extend(context_operations)

        # 5. Apply intelligent deduplication and merging
        operations = self._deduplicate_and_merge_operations(operations)

        return operations

    def _convert_item_to_operation(self, item: Dict, current_facts: Dict) -> Optional[Dict]:
        """Convert a detected memory item to a memory operation"""
        fact_key = f"{item['category']}.{item['subcategory']}"
        current_value = current_facts.get(fact_key)

        # Determine operation type
        if current_value is None:
            operation_type = 'ADD'
        elif str(current_value).lower() != str(item['value']).lower():
            operation_type = 'UPDATE'
        else:
            operation_type = 'CONFIRM'  # Same value, just confirming

        return {
            'type': operation_type,
            'fact_type': fact_key,
            'key': item.get('key', fact_key),
            'value': item['value'],
            'previous_value': current_value,
            'confidence': item['confidence'],
            'source': 'comprehensive_detection',
            'category': item['category'],
            'subcategory': item['subcategory'],
            'privacy_level': item.get('privacy_level', 'normal'),
            'retention_policy': item.get('retention_policy', 'permanent'),
            'relationships': item.get('relationships', []),
            'temporal_context': item.get('temporal_context', {}),
            'session_id': item.get('session_id'),
            'emotional_context': item.get('emotional_context')
        }

    def _deduplicate_and_merge_operations(self, operations: List[Dict]) -> List[Dict]:
        """Remove duplicates and merge similar operations intelligently"""
        if not operations:
            return operations

        # Group operations by fact_type
        grouped = defaultdict(list)
        for op in operations:
            grouped[op['fact_type']].append(op)

        # Merge operations for each fact_type
        merged_operations = []
        for fact_type, ops in grouped.items():
            if len(ops) == 1:
                merged_operations.append(ops[0])
            else:
                # Merge multiple operations for the same fact
                merged_op = self._merge_operations(ops)
                merged_operations.append(merged_op)

        return merged_operations

    def _merge_operations(self, operations: List[Dict]) -> Dict:
        """Merge multiple operations for the same fact type"""
        # Use the operation with highest confidence as base
        base_op = max(operations, key=lambda x: x.get('confidence', 0))

        # Merge additional metadata from other operations
        merged_relationships = set()
        merged_sources = set()

        for op in operations:
            merged_relationships.update(op.get('relationships', []))
            merged_sources.add(op.get('source', 'unknown'))

        base_op['relationships'] = list(merged_relationships)
        base_op['merged_sources'] = list(merged_sources)
        base_op['merge_count'] = len(operations)

        return base_op

    def _apply_existing_patterns(self, message: str, current_facts: Dict) -> List[Dict]:
        """Apply existing learned patterns to extract information"""
        operations = []
        message_lower = message.lower()

        # Apply learned patterns
        for fact_type, patterns in self.learned_patterns.items():
            for pattern_data in patterns:
                pattern = pattern_data['pattern']
                matches = re.findall(pattern, message_lower, re.IGNORECASE)
                if matches:
                    value = matches[0].strip() if isinstance(matches[0], str) else matches[0][0].strip()

                    operations.append({
                        'type': self._determine_operation_type(fact_type, value, current_facts),
                        'fact_type': fact_type,
                        'value': value,
                        'previous_value': current_facts.get(fact_type),
                        'confidence': pattern_data['confidence'],
                        'source': 'learned_pattern'
                    })

                    # Update pattern success
                    pattern_data['success_count'] += 1
                    break

        return operations

    def _detect_new_patterns(self, message: str, current_facts: Dict, context: Dict = None) -> List[Dict]:
        """Detect and learn new patterns from user input"""
        operations = []
        message_lower = message.lower()

        # Analyze sentence structure for new information patterns
        new_patterns = self._analyze_sentence_structure(message)

        for pattern_info in new_patterns:
            fact_type = pattern_info['fact_type']
            value = pattern_info['value']
            pattern = pattern_info['pattern']
            confidence = pattern_info['confidence']

            # Learn this new pattern
            self._learn_new_pattern(fact_type, pattern, confidence, message)

            operations.append({
                'type': self._determine_operation_type(fact_type, value, current_facts),
                'fact_type': fact_type,
                'value': value,
                'previous_value': current_facts.get(fact_type),
                'confidence': confidence,
                'source': 'new_pattern'
            })

        return operations

    def _analyze_sentence_structure(self, message: str) -> List[Dict]:
        """Analyze sentence structure to detect new information patterns"""
        patterns = []
        message_lower = message.lower().strip()

        # Detect preference statements
        preference_patterns = [
            (r'i (prefer|like|love) (.+)', 'personal_preferences.likes'),
            (r'i (hate|can\'t stand) (.+)', 'personal_preferences.dislikes'),
            (r'i don\'t like (.+)', 'personal_preferences.dislikes'),  # Specific for "don't like"
            (r'i (never|don\'t|please don\'t) (?:like|enjoy|want|do|go for|eat|drink) (.+)', 'personal_preferences.avoid'),
            (r'(never|don\'t|please don\'t|avoid) (.+)', 'personal_preferences.avoid'),
            (r'(always|make sure to|remember to) (.+)', 'personal_preferences.always'),
            (r'keep it (.+)', 'personal_preferences.style'),
            (r'(only .+ when|unless) (.+)', 'personal_preferences.conditional')
        ]

        # Keep track of already processed parts to avoid duplicates
        processed_segments = []
        
        for pattern, fact_type in preference_patterns:
            matches = re.findall(pattern, message_lower, re.IGNORECASE)
            if matches:
                if isinstance(matches[0], tuple):
                    # Take the last element which is typically the actual preference/object
                    value = matches[0][-1].strip() if len(matches[0]) > 0 else matches[0][0].strip()
                else:
                    value = matches[0].strip()
                
                # Avoid duplicate processing of the same value for different categories
                value_key = f"{fact_type}:{value}"
                if value_key not in processed_segments:
                    processed_segments.append(value_key)
                    # Determine category and subcategory from fact_type
                    if '.' in fact_type:
                        category_part, subcategory_part = fact_type.split('.', 1)
                        category = category_part  # This should map to the MemoryCategory enum string
                        subcategory = subcategory_part
                    else:
                        category = None
                        subcategory = None
                    
                    patterns.append({
                        'fact_type': fact_type,
                        'value': value,
                        'pattern': pattern,
                        'confidence': 0.8,
                        'category': category,
                        'subcategory': subcategory
                    })

        # Detect technology/tool changes
        tech_patterns = [
            (r'i\'m switching to (.+)', 'user_stack.current'),
            (r'(dropping|leaving|moving away from) (.+)', 'user_stack.deprecated'),
            (r'i use (.+) now', 'user_stack.current'),
            (r'i don\'t use (.+) anymore', 'user_stack.deprecated')
        ]

        for pattern, fact_type in tech_patterns:
            matches = re.findall(pattern, message_lower, re.IGNORECASE)
            if matches:
                if isinstance(matches[0], tuple):
                    value = matches[0][1].strip() if len(matches[0]) > 1 else matches[0][0].strip()
                else:
                    value = matches[0].strip()

                patterns.append({
                    'fact_type': fact_type,
                    'value': value,
                    'pattern': pattern,
                    'confidence': 0.9
                })

        # Detect work/career changes
        work_patterns = [
            (r'i\'ve decided to (.+)', 'user_work.decision'),
            (r'i\'m (.+) full-time now', 'user_work.status'),
            (r'i (left|quit|leaving) (.+)', 'user_work.previous'),
            (r'i\'m (freelancing|consulting|employed at) (.+)', 'user_work.current')
        ]

        for pattern, fact_type in work_patterns:
            matches = re.findall(pattern, message_lower, re.IGNORECASE)
            if matches:
                if isinstance(matches[0], tuple):
                    value = ' '.join(matches[0]).strip()
                else:
                    value = matches[0].strip()

                patterns.append({
                    'fact_type': fact_type,
                    'value': value,
                    'pattern': pattern,
                    'confidence': 0.85
                })

        # Detect emotional states
        emotion_patterns = [
            (r'i\'m (getting|feeling) (.+) lately', 'user_emotion_state'),
            (r'i\'m (.+) right now', 'user_emotion_state'),
            (r'don\'t be (.+) with me', 'personal_preferences.response_tone')
        ]

        for pattern, fact_type in emotion_patterns:
            matches = re.findall(pattern, message_lower, re.IGNORECASE)
            if matches:
                if isinstance(matches[0], tuple):
                    value = matches[0][1].strip() if len(matches[0]) > 1 else matches[0][0].strip()
                else:
                    value = matches[0].strip()

                patterns.append({
                    'fact_type': fact_type,
                    'value': value,
                    'pattern': pattern,
                    'confidence': 0.75
                })

        return patterns

    def _learn_new_pattern(self, fact_type: str, pattern: str, confidence: float, example: str):
        """Learn and store a new pattern"""
        if fact_type not in self.learned_patterns:
            self.learned_patterns[fact_type] = []

        # Check if pattern already exists
        existing = next((p for p in self.learned_patterns[fact_type] if p['pattern'] == pattern), None)
        if existing:
            existing['confidence'] = min(1.0, existing['confidence'] + 0.1)
            existing['examples'].append(example)
        else:
            self.learned_patterns[fact_type].append({
                'pattern': pattern,
                'confidence': confidence,
                'examples': [example],
                'success_count': 1,
                'failure_count': 0,
                'created_at': datetime.now().isoformat()
            })

        # Log learning event
        learning_event = AdaptiveLearning(
            learning_type=AdaptiveLearningType.NEW_PATTERN.value,
            pattern=pattern,
            fact_type=fact_type,
            confidence=confidence,
            examples=[example]
        )
        self.learning_history.append(learning_event)

    def _learn_from_context(self, message: str, current_facts: Dict, context: Dict = None) -> List[Dict]:
        """Learn from conversation context and flow"""
        operations = []

        if not context:
            return operations

        # Analyze conversation flow for implicit information
        if 'previous_messages' in context:
            operations.extend(self._analyze_conversation_flow(message, context['previous_messages'], current_facts))

        # Learn from user corrections
        if 'correction_detected' in context:
            operations.extend(self._learn_from_corrections(message, current_facts))

        return operations

    def _analyze_conversation_flow(self, message: str, previous_messages: List[Dict], current_facts: Dict) -> List[Dict]:
        """Analyze conversation flow for implicit information"""
        operations = []

        if not previous_messages or len(previous_messages) < 2:
            return operations

        # Look for patterns in conversation flow
        recent_messages = previous_messages[-5:]  # Last 5 messages
        user_messages = [msg for msg in recent_messages if msg.get('role') == 'user']

        # Detect topic continuations
        if len(user_messages) >= 2:
            prev_content = user_messages[-2].get('content', '').lower()
            curr_content = message.lower()

            # If user continues a topic, extract additional context
            if any(word in prev_content and word in curr_content for word in ['work', 'job', 'project', 'tech', 'code']):
                # This is a topic continuation - might contain additional preferences
                operations.extend(self._extract_contextual_preferences(message, prev_content, current_facts))

        return operations

    def _extract_contextual_preferences(self, current_message: str, previous_message: str, current_facts: Dict) -> List[Dict]:
        """Extract preferences from contextual conversation flow"""
        operations = []

        # Look for implicit preferences based on conversation context
        current_lower = current_message.lower()

        # If previous message mentioned work and current adds constraints
        if 'work' in previous_message and any(word in current_lower for word in ['but', 'however', 'except', 'unless']):
            # Extract work-related preferences
            if 'meeting' in current_lower:
                operations.append({
                    'type': 'UPDATE',
                    'fact_type': 'personal_preferences.meetings',
                    'value': current_message.strip(),
                    'previous_value': current_facts.get('personal_preferences.meetings'),
                    'confidence': 0.7,
                    'source': 'contextual_flow'
                })

        return operations

    def _learn_from_corrections(self, message: str, current_facts: Dict) -> List[Dict]:
        """Learn from user corrections to improve pattern recognition"""
        operations = []
        message_lower = message.lower()

        # Detect correction patterns
        correction_indicators = ['actually', 'correction', 'i meant', 'sorry', 'wrong',
                               'now i', 'i\'ve shifted', 'i changed', 'update', 'shifted to',
                               'no wait', 'let me correct', 'i should say', 'rather']

        if any(indicator in message_lower for indicator in correction_indicators):
            # This is a correction - learn from it
            # Extract what's being corrected
            for fact_type, current_value in current_facts.items():
                if current_value and str(current_value).lower() in message_lower:
                    # User is correcting this fact
                    # Learn a new pattern for corrections
                    correction_pattern = f"(actually|correction|i meant|sorry|wrong).+{fact_type}"
                    self._learn_new_pattern(f"{fact_type}_correction", correction_pattern, 0.9, message)

        return operations

    def _detect_complex_preferences(self, message: str, current_facts: Dict) -> List[Dict]:
        """Detect complex nested preferences and communication styles"""
        operations = []
        message_lower = message.lower()

        # Communication style preferences
        comm_patterns = [
            (r'(never|don\'t) call me (.+)', 'personal_preferences.formality'),
            (r'keep it (respectful|formal|casual|professional)', 'personal_preferences.formality'),
            (r'(only .+ when i say|unless i say) (.+)', 'personal_preferences.explain_only_on_request'),
            (r'don\'t explain (.+) i already know', 'personal_preferences.explain_only_on_request'),
            (r'i (hate|don\'t like) when you (.+)', 'personal_preferences.communication_dislikes')
        ]

        for pattern, fact_type in comm_patterns:
            matches = re.findall(pattern, message_lower, re.IGNORECASE)
            if matches:
                if isinstance(matches[0], tuple):
                    value = ' '.join(matches[0]).strip()
                else:
                    value = matches[0].strip()

                operations.append({
                    'type': 'UPDATE',
                    'fact_type': fact_type,
                    'value': value,
                    'previous_value': current_facts.get(fact_type),
                    'confidence': 0.9,
                    'source': 'complex_preference'
                })

        # Work preferences
        work_pref_patterns = [
            (r'i (don\'t like|hate|avoid) (.+) meetings', 'personal_preferences.meetings'),
            (r'i\'ll do (.+) if needed', 'personal_preferences.conditional_acceptance'),
            (r'remember that i (.+)', 'personal_preferences.important_note')
        ]

        for pattern, fact_type in work_pref_patterns:
            matches = re.findall(pattern, message_lower, re.IGNORECASE)
            if matches:
                if isinstance(matches[0], tuple):
                    value = ' '.join(matches[0]).strip()
                else:
                    value = matches[0].strip()

                operations.append({
                    'type': 'UPDATE',
                    'fact_type': fact_type,
                    'value': value,
                    'previous_value': current_facts.get(fact_type),
                    'confidence': 0.85,
                    'source': 'work_preference'
                })

        return operations

    def _detect_state_changes(self, message: str, current_facts: Dict) -> List[Dict]:
        """Detect and track state changes over time with proper UPDATE and DEPRECATE operations"""
        operations = []
        message_lower = message.lower()

        # Technology stack changes
        tech_change_patterns = [
            (r'i\'m switching to (.+)', 'user_stack.frontend', 'UPDATE'),
            (r'moving away from (.+)', 'user_stack.deprecated', 'DEPRECATE'),
            (r'dropping (.+) for (.+)', 'user_stack.replacement', 'UPDATE'),
            (r'i don\'t use (.+) anymore', 'user_stack.deprecated', 'DEPRECATE')
        ]

        for pattern, fact_type, op_type in tech_change_patterns:
            matches = re.findall(pattern, message_lower, re.IGNORECASE)
            if matches:
                value = matches[0].strip() if isinstance(matches[0], str) else matches[0][0].strip()

                operations.append({
                    'type': op_type,
                    'fact_type': fact_type,
                    'value': value,
                    'previous_value': current_facts.get(fact_type),
                    'confidence': 0.9,
                    'source': 'state_change'
                })

        # Career changes
        career_change_patterns = [
            (r'i\'ve decided to (.+)', 'user_work.current', 'UPDATE'),
            (r'i\'m (.+) full-time now', 'user_work.status', 'UPDATE'),
            (r'leaving (.+)', 'user_work.previous', 'DEPRECATE')
        ]

        for pattern, fact_type, op_type in career_change_patterns:
            matches = re.findall(pattern, message_lower, re.IGNORECASE)
            if matches:
                value = matches[0].strip() if isinstance(matches[0], str) else matches[0][0].strip()

                operations.append({
                    'type': op_type,
                    'fact_type': fact_type,
                    'value': value,
                    'previous_value': current_facts.get(fact_type),
                    'confidence': 0.9,
                    'source': 'career_change'
                })

        return operations

    def _determine_operation_type(self, fact_type: str, value: str, current_facts: Dict) -> str:
        """Determine whether this should be ADD, UPDATE, or DEPRECATE"""
        current_value = current_facts.get(fact_type)

        if current_value is None:
            return 'ADD'
        elif current_value != value:
            return 'UPDATE'
        else:
            return 'CONFIRM'

class EmotionType(Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    EXCITED = "excited"
    PROUD = "proud"
    ANXIOUS = "anxious"
    HAPPY = "happy"
    SAD = "sad"

@dataclass
class FactRelationship:
    """Represents relationship between facts"""
    source_fact: str
    target_fact: str
    relationship_type: str
    strength: float = 0.5  # 0.0 to 1.0
    evidence: List[str] = field(default_factory=list)
    created_at: str = ""

    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()

@dataclass
class Conflict:
    """Represents a conflict between facts"""
    conflicting_facts: List[str]
    conflict_type: str
    severity: float = 0.5  # 0.0 to 1.0
    suggested_resolution: str = ""
    detected_at: str = ""

    def __post_init__(self):
        if not self.detected_at:
            self.detected_at = datetime.now().isoformat()

@dataclass
class MemoryPattern:
    """Represents detected patterns in memory"""
    pattern_type: str
    confidence: float
    supporting_evidence: List[str] = field(default_factory=list)
    predicted_next_steps: List[str] = field(default_factory=list)
    detected_at: str = ""

    def __post_init__(self):
        if not self.detected_at:
            self.detected_at = datetime.now().isoformat()

@dataclass
class MemoryImportance:
    """Calculates importance score for memories"""
    access_frequency: float = 0.0
    recency_score: float = 0.0
    emotional_weight: float = 0.0
    cross_reference_count: int = 0
    final_importance: float = 0.0

@dataclass
class MemoryEvent:
    """Enhanced memory event with comprehensive 22-category support"""
    type: str
    summary: Union[str, Dict[str, str]]
    timestamp: str
    emotional_context: Optional[EmotionalContext] = None
    semantic_context: Optional[SemanticContext] = None
    importance_score: float = 0.5
    # Additional fields for 22-category framework
    confidence: float = 0.8
    category: Optional[str] = None
    subcategory: Optional[str] = None
    relationships: List[str] = field(default_factory=list)
    session_id: Optional[str] = None
    privacy_level: str = "normal"
    previous_value: Optional[Any] = None
    current_value: Optional[Any] = None

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()

@dataclass
class HistoricalValue:
    """Represents a historical value of a fact"""
    value: Any
    timestamp: str
    status: str  # "current" or "previous"
    confidence: float = 0.8

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()

@dataclass
class MemoryFact:
    """Enhanced memory fact with advanced context and relationships"""
    key: str
    value: Any
    category: str
    confidence: float
    created_at: str
    last_accessed: str
    access_count: int = 0
    history: List[HistoricalValue] = field(default_factory=list)
    emotional_context: Optional[EmotionalContext] = None
    semantic_context: Optional[SemanticContext] = None
    importance_score: float = 0.5
    relationships: List[FactRelationship] = field(default_factory=list)
    conflicts: List[Conflict] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)

    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
        if not self.last_accessed:
            self.last_accessed = self.created_at
        if not self.semantic_context:
            self.semantic_context = SemanticContext()
        if not self.emotional_context:
            self.emotional_context = EmotionalContext()

@dataclass
class ConversationSession:
    """Represents a conversation session with metadata"""
    session_id: str
    start_time: str
    end_time: Optional[str] = None
    message_count: int = 0
    topics_discussed: List[str] = field(default_factory=list)
    user_name: Optional[str] = None
    session_duration: Optional[str] = None
    last_activity: str = ""

    def __post_init__(self):
        if not self.session_id:
            self.session_id = f"session_{uuid.uuid4().hex[:8]}"
        if not self.start_time:
            self.start_time = datetime.now().isoformat()
        if not self.last_activity:
            self.last_activity = self.start_time

@dataclass
class ConversationMessage:
    """Represents a conversation message with session context"""
    role: str
    content: str
    timestamp: str = ""
    session_id: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()

class EnhancedFactExtractor:
    """Enhanced fact extractor with adaptive learning capabilities"""

    def __init__(self):
        # Initialize adaptive learning engine
        self.adaptive_engine = AdaptiveLearningEngine()

        # Enhanced patterns for better detection (now serves as fallback)
        self.fact_patterns = {
            'name': [
                r'hi,?\s+i\'m\s+(\w+)',
                r'hello,?\s+i\'m\s+(\w+)',
                r'my name is\s+(\w+)',
                r'i\'m\s+(\w+)(?:\s+and|\s*\.)',
                r'call me\s+(\w+)',
                # Enhanced patterns for name changes
                r'my new name is\s+(\w+)',
                r'new name is\s+(\w+)',
                r'i changed my name to\s+(\w+)',
                r'changed my name to\s+(\w+)',
                r'now call me\s+(\w+)',
                r'actually i\'m\s+(\w+)',
                r'actually my name is\s+(\w+)',
                r'i\'m actually\s+(\w+)',
                r'just call me\s+[\'\"]?(\w+)[\'\"]?',
                r'call me\s+[\'\"]?(\w+)[\'\"]?\s+from now on',
                r'changed my name.*call me\s+[\'\"]?(\w+)[\'\"]?'
            ],
            'age': [
                r'i\'m\s+(\d+)\s+years?\s+old',
                r'i am\s+(\d+)\s+years?\s+old',
                r'(\d+)\s+years?\s+old',
                r'my age is\s+(\d+)'
            ],
            'occupation': [
                r'i work as\s+(?:a\s+)?(.+?)(?:\.)',
                r'i\'m\s+(?:a\s+)?(.+?)(?:\s+developer|\s+dev)',
                r'i am\s+(?:a\s+)?(.+?)(?:\s+developer|\s+dev)',
                r'my job is\s+(.+?)(?:\.)',
                r'i do\s+(.+?)(?:\.)',
                r'i\'ve shifted to\s+(.+?)(?:\s+dev|\s+developer)',
                r'shifted to\s+(.+?)(?:\s+dev|\s+developer)',
                r'now i\'m\s+(?:a\s+)?(.+?)(?:\s+developer|\s+dev)'
            ],
            'company': [
                r'i work at\s+(.+?)(?:\.)',
                r'i work for\s+(.+?)(?:\.)',
                r'my company is\s+(.+?)(?:\.)',
                # Enhanced patterns for job announcements
                r'i got a job at\s+(.+?)(?:\.)',
                r'i got a new job at\s+(.+?)(?:\.)',
                r'i started working at\s+(.+?)(?:\.)',
                r'i joined\s+(.+?)(?:\.)',
                r'i\'m working at\s+(.+?)(?:\.)',
                r'i\'m now at\s+(.+?)(?:\.)',
                r'my new job is at\s+(.+?)(?:\.)',
                r'i started at\s+(.+?)(?:\.)',
                # Enhanced patterns for corrections
                r'actually,?\s+i now work at\s+(.+?)(?:\.)',
                r'actually,?\s+i work at\s+(.+?)(?:\.)',
                r'i now work at\s+(.+?)(?:\.)',
                r'correction.*i work at\s+(.+?)(?:\.)'
            ],
            'previous_company': [
                r'i used to work at\s+(.+?)(?:\.)',
                r'i previously worked at\s+(.+?)(?:\.)',
                r'i worked at\s+(.+?)\s+before',
                r'my previous job was at\s+(.+?)(?:\.)',
                r'before this i worked at\s+(.+?)(?:\.)',
                r'i came from\s+(.+?)(?:\.)'
            ],
            'location': [
                r'i live in\s+(.+?)(?:\.)',
                r'i\'m from\s+(.+?)(?:\.)',
                r'i moved to\s+(.+?)(?:\.)',
                r'based in\s+(.+?)(?:\.)'
            ],
            'interests': [
                r'i\'m learning\s+(.+?)(?:\.)',
                r'learning\s+(.+?)(?:\.)',
                r'i love\s+(.+?)(?:\.)',
                r'i like\s+(.+?)(?:\.)',
                r'i enjoy\s+(.+?)(?:\.)',
                r'i\'m interested in\s+(.+?)(?:\.)',
                r'interested in\s+(.+?)(?:\.)',
                r'i\'m into\s+(.+?)(?:\.)',
                r'into\s+(.+?)(?:\.)',
                r'i\'m also into\s+(.+?)(?:\.)'
            ],
            'preferences': [
                r'always give me detailed answers',
                r'give me detailed responses',
                r'i want detailed answers',
                r'provide detailed information',
                r'give me brief answers',
                r'keep it short',
                r'be concise'
            ],
            'boundaries': [
                r'don\'t ask me personal questions',
                r'don\'t ask personal questions',
                r'please don\'t ask personal questions',
                r'no personal questions',
                r'don\'t ask about (.+)',
                r'please don\'t ask about (.+)',
                r'i don\'t want to talk about (.+)',
                r'let\'s not discuss (.+)',
                r'don\'t ask me (.+) unless i bring it up',
                r'only ask about (.+) if i mention it first',
                r'wait for me to bring up (.+)',
                r'i don\'t want you asking me about (.+?) anymore unless i bring it up',
                r'don\'t want you asking.*about (.+?) unless',
                r'stop asking.*about (.+?) unless',
                # Capture full boundary statements
                r'(i don\'t want you asking me about .+ unless .+)',
                r'(don\'t ask me about .+ unless .+)',
                r'(please don\'t ask about .+ unless .+)'
            ],
            'confirmation': [
                r'yep,?\s+that\'s still my (.+)',
                r'yes,?\s+that\'s still my (.+)',
                r'that\'s still my (.+)',
                r'still my (.+)',
                r'yep,?\s+(.+) is still my priority',
                r'yes,?\s+(.+) is still my priority',
                r'(.+) is still my priority',
                r'that\'s correct',
                r'that\'s right',
                r'exactly',
                r'yep',
                r'yes'
            ]
        }

        # Update indicators for detecting corrections
        self.update_indicators = [
            'actually', 'correction', 'i meant', 'sorry', 'wrong',
            'now i', 'i\'ve shifted', 'i changed', 'update', 'shifted to',
            'no wait', 'let me correct', 'i should say', 'rather'
        ]

        # Delete indicators
        self.delete_indicators = [
            'forget', 'ignore', 'never mind', 'disregard', 'remove'
        ]
    
    def analyze_message(self, message: str, current_facts: Dict[str, Any], context: Dict = None) -> List[Dict[str, Any]]:
        """Analyze message using adaptive learning engine and fallback patterns"""
        operations = []

        # 1. First, try adaptive learning engine (primary method)
        adaptive_operations = self.adaptive_engine.analyze_and_learn(message, current_facts, context)
        operations.extend(adaptive_operations)

        # 2. If no operations found, use fallback patterns
        if not operations:
            operations = self._analyze_with_fallback_patterns(message, current_facts)

        # 3. Handle special cases
        operations = self._handle_interests_special_cases(message, current_facts, operations)
        operations = self._handle_confirmations(message, current_facts, operations)

        return operations

    def _analyze_with_fallback_patterns(self, message: str, current_facts: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fallback analysis using traditional patterns"""
        operations = []
        message_lower = message.lower().strip()

        # Check for delete operations first
        if any(indicator in message_lower for indicator in self.delete_indicators):
            delete_ops = self._detect_delete_operations(message, current_facts)
            operations.extend(delete_ops)

        # Check for update indicators
        is_update = any(indicator in message_lower for indicator in self.update_indicators)

        # Analyze for each fact type with priority for correction patterns
        for fact_type, patterns in self.fact_patterns.items():
            best_match = None
            best_priority = -1

            for i, pattern in enumerate(patterns):
                matches = re.findall(pattern, message_lower, re.IGNORECASE)
                if matches:
                    value = matches[0].strip() if isinstance(matches[0], str) else ' '.join(matches[0]).strip()

                    # Assign priority - correction patterns get higher priority
                    priority = 0
                    if 'actually' in pattern or 'correction' in pattern or 'now work' in pattern:
                        priority = 10  # High priority for corrections
                    elif 'new' in pattern or 'changed' in pattern:
                        priority = 5   # Medium priority for changes
                    elif pattern.startswith('(') and pattern.endswith(')') and ("i don\\'t want you asking" in pattern or "i don't want you asking" in pattern):
                        priority = 9   # Highest priority for full boundary statements (patterns that capture the whole statement)
                    elif ("i don\\'t want you asking" in pattern or "i don't want you asking" in pattern) and '(' in pattern and ')' in pattern:
                        priority = 6   # Medium priority for partial boundary statements
                    elif ("don\\'t ask me about .+ unless" in pattern or "don't ask me about .+ unless" in pattern) and '(' in pattern:
                        priority = 7   # High priority for full boundary statements
                    else:
                        priority = 1   # Low priority for basic patterns

                    # Take the highest priority match
                    if priority > best_priority:
                        best_priority = priority
                        best_match = value

            if best_match:
                # Clean up the value
                value = self._clean_value(fact_type, best_match)

                if value:
                    # Determine operation type
                    operation_type = self._determine_operation_type_fallback(
                        fact_type, value, current_facts, is_update
                    )

                    operations.append({
                        'type': operation_type,
                        'fact_type': fact_type,
                        'value': value,
                        'previous_value': current_facts.get(fact_type),
                        'message': message
                    })

        return operations

    def _determine_operation_type_fallback(self, fact_type: str, value: str, current_facts: Dict, is_update: bool) -> str:
        """Determine operation type for fallback patterns"""
        current_value = current_facts.get(fact_type)

        if current_value is None:
            return MemoryEventType.ADD.value
        elif current_value != value or is_update:
            return MemoryEventType.UPDATE.value
        else:
            return MemoryEventType.ADD.value  # Duplicate, but we'll handle it

    def _clean_value(self, fact_type: str, value: str) -> str:
        """Clean and normalize extracted values"""
        value = value.strip()

        if fact_type == 'name':
            return value.title()
        elif fact_type == 'age':
            try:
                return str(int(value))
            except ValueError:
                return ""
        elif fact_type in ['occupation', 'location']:
            # Remove common articles and clean up
            value = re.sub(r'^(a|an|the)\s+', '', value, flags=re.IGNORECASE)
            return value.strip()
        elif fact_type == 'interests':
            # Handle multiple interests separated by "and", commas, etc.
            interests = re.split(r'\s+and\s+|,\s*', value)
            cleaned_interests = []
            for interest in interests:
                interest = interest.strip()
                if interest:
                    # Handle complex descriptions like "cars, especially fast and luxurious ones"
                    if 'especially' in interest:
                        parts = interest.split('especially')
                        main_interest = parts[0].strip().rstrip(',')
                        detail = parts[1].strip()
                        cleaned_interests.append(f"{main_interest} ({detail})")
                    else:
                        cleaned_interests.append(interest)
            return ', '.join(cleaned_interests)

        return value

    def _determine_operation_type(self, fact_type: str, value: str, current_facts: Dict, is_update: bool) -> str:
        """Determine if this should be ADD or UPDATE"""
        current_value = current_facts.get(fact_type)

        if current_value is None:
            return MemoryEventType.ADD.value
        elif current_value != value or is_update:
            return MemoryEventType.UPDATE.value
        else:
            return MemoryEventType.ADD.value  # Duplicate, but we'll handle it

    def _handle_interests_special_cases(self, message: str, current_facts: Dict, operations: List) -> List:
        """Handle special cases for interests (adding to existing list)"""
        message_lower = message.lower()

        # Check if this is adding to existing interests
        current_interests = current_facts.get('interests', '')

        # Look for new interests being added
        for op in operations:
            if op['fact_type'] == 'interests' and current_interests:
                new_interests = op['value']

                # Combine with existing interests if not already present
                existing_list = [i.strip() for i in current_interests.split(',')]
                new_list = [i.strip() for i in new_interests.split(',')]

                # Add only new interests
                combined_interests = existing_list.copy()
                for interest in new_list:
                    if interest not in existing_list:
                        combined_interests.append(interest)

                # Update the operation
                op['value'] = ', '.join(combined_interests)
                op['type'] = MemoryEventType.UPDATE.value if current_interests else MemoryEventType.ADD.value

        return operations

    def _detect_delete_operations(self, message: str, current_facts: Dict) -> List[Dict]:
        """Detect delete operations"""
        operations = []
        message_lower = message.lower()

        # Enhanced delete detection
        delete_patterns = [
            r'forget (?:that )?(.+)',
            r'ignore (?:that )?(.+)',
            r'never mind (?:about )?(.+)',
            r'disregard (?:that )?(.+)'
        ]

        for pattern in delete_patterns:
            matches = re.findall(pattern, message_lower)
            if matches:
                target = matches[0].strip()

                # Try to match target to existing facts
                for fact_type, fact_value in current_facts.items():
                    if (fact_type in target or
                        (isinstance(fact_value, str) and target in fact_value.lower())):
                        operations.append({
                            'type': MemoryEventType.DELETE.value,
                            'fact_type': fact_type,
                            'value': None,
                            'previous_value': fact_value,
                            'message': message
                        })

        return operations
    
    def _clean_value(self, fact_type: str, value: str) -> str:
        """Clean and normalize extracted values"""
        value = value.strip()
        
        if fact_type == 'name':
            return value.title()
        elif fact_type == 'age':
            try:
            return str(int(value))
            except ValueError:
                return ""
        elif fact_type in ['occupation', 'location']:
            # Remove common articles and clean up
            value = re.sub(r'^(a|an|the)\s+', '', value, flags=re.IGNORECASE)
            return value.strip()
        elif fact_type == 'interests':
            # Handle multiple interests
            interests = [i.strip() for i in re.split(r'[,&]|\sand\s', value)]
            return ', '.join(interests)
        
        return value
    
    def _determine_operation_type(self, fact_type: str, value: str, current_facts: Dict, is_update: bool) -> str:
        """Determine if this should be ADD or UPDATE"""
        current_value = current_facts.get(fact_type)
        
        if current_value is None:
            return MemoryEventType.ADD.value
        elif current_value != value or is_update:
            return MemoryEventType.UPDATE.value
        else:
            return MemoryEventType.ADD.value  # Duplicate, but we'll handle it

    def _handle_confirmations(self, message: str, current_facts: Dict, operations: List) -> List:
        """Handle confirmation statements that reinforce existing memories"""
        message_lower = message.lower().strip()

        # Check for confirmation patterns
        confirmation_patterns = [
            r'yep,?\s+that\'s still my (.+)',
            r'yes,?\s+that\'s still my (.+)',
            r'that\'s still my (.+)',
            r'still my (.+)',
            r'yep,?\s+(.+) is still my priority',
            r'yes,?\s+(.+) is still my priority',
            r'(.+) is still my priority'
        ]

        # Simple confirmation patterns
        simple_confirmations = ['that\'s correct', 'that\'s right', 'exactly', 'yep', 'yes']

        for pattern in confirmation_patterns:
            matches = re.findall(pattern, message_lower, re.IGNORECASE)
            if matches:
                confirmed_item = matches[0].strip()

                # Create a confirmation operation
                operations.append({
                    'type': 'CONFIRM',
                    'fact_type': 'confirmation',
                    'value': confirmed_item,
                    'previous_value': None,
                    'message': message
                })
                break

        # Check for simple confirmations
        if any(conf in message_lower for conf in simple_confirmations):
            operations.append({
                'type': 'CONFIRM',
                'fact_type': 'confirmation',
                'value': 'general confirmation',
                'previous_value': None,
                'message': message
            })

        return operations

    def _handle_interests_special_cases(self, message: str, current_facts: Dict, operations: List) -> List:
        """Handle special cases for interests (adding to existing list)"""
        message_lower = message.lower()

        # Check if this is adding to existing interests
        current_interests = current_facts.get('interests', '')

        # Look for new interests being added
        for op in operations:
            if op['fact_type'] == 'interests' and current_interests:
                new_interests = op['value']

                # Combine with existing interests if not already present
                existing_list = [i.strip() for i in current_interests.split(',')]
                new_list = [i.strip() for i in new_interests.split(',')]

                # Add only new interests
                combined_interests = existing_list.copy()
                for interest in new_list:
                    if interest not in existing_list:
                        combined_interests.append(interest)

                # Update the operation
                op['value'] = ', '.join(combined_interests)
                op['type'] = MemoryEventType.UPDATE.value if current_interests else MemoryEventType.ADD.value

        return operations

    def _detect_delete_operations(self, message: str, current_facts: Dict) -> List[Dict]:
        """Detect delete operations"""
        operations = []
        message_lower = message.lower()

        # Enhanced delete detection
        delete_patterns = [
            r'forget (?:that )?(.+)',
            r'ignore (?:that )?(.+)',
            r'never mind (?:about )?(.+)',
            r'disregard (?:that )?(.+)'
        ]

        for pattern in delete_patterns:
            matches = re.findall(pattern, message_lower)
            if matches:
                target = matches[0].strip()

                # Try to match target to existing facts
                for fact_type, fact_value in current_facts.items():
                    if (fact_type in target or
                        (isinstance(fact_value, str) and target in fact_value.lower())):
                        operations.append({
                            'type': MemoryEventType.DELETE.value,
                            'fact_type': fact_type,
                            'value': None,
                            'previous_value': fact_value,
                            'message': message
                        })

        return operations
    
    def _detect_delete_operations(self, message: str, current_facts: Dict) -> List[Dict]:
        """Detect delete operations"""
        operations = []
        message_lower = message.lower()

        # Enhanced delete detection
        delete_patterns = [
            r'forget (?:that )?(.+)',
            r'ignore (?:that )?(.+)',
            r'never mind (?:about )?(.+)',
            r'disregard (?:that )?(.+)'
        ]

        for pattern in delete_patterns:
            matches = re.findall(pattern, message_lower)
            if matches:
                target = matches[0].strip()

                # Try to match target to existing facts
                for fact_type, fact_value in current_facts.items():
                    if (fact_type in target or
                        (isinstance(fact_value, str) and target in fact_value.lower())):
                        operations.append({
                            'type': MemoryEventType.DELETE.value,
                            'fact_type': fact_type,
                            'value': None,
                            'previous_value': fact_value,
                            'message': message
                        })

        return operations\n\nclass SemanticMemoryEngine:\n    \"\"\"Advanced semantic understanding and relationship detection\"\"\"\n\n    def __init__(self):\n        # Semantic relationship patterns\n        self.semantic_patterns = {\n            'professional': {\n                'keywords': ['work', 'job', 'career', 'developer', 'engineer', 'manager', 'analyst'],\n                'related_concepts': {\n                    'python': ['programming', 'developer', 'data science', 'machine learning'],\n                    'javascript': ['web development', 'frontend', 'programming'],\n                    'data science': ['python', 'machine learning', 'analytics', 'statistics'],\n                    'machine learning': ['python', 'data science', 'AI', 'algorithms']\n                }\n            },\n            'personal': {\n                'keywords': ['name', 'age', 'location', 'family', 'hobby'],\n                'related_concepts': {\n                    'cars': ['driving', 'automotive', 'speed', 'luxury'],\n                    'music': ['instruments', 'concerts', 'genres', 'artists'],\n                    'sports': ['fitness', 'competition', 'teams', 'exercise']\n                }\n            }\n        }\n\n        # Context indicators\n        self.context_indicators = {\n            'professional': ['work', 'job', 'career', 'office', 'company', 'business'],\n            'personal': ['home', 'family', 'hobby', 'interest', 'like', 'enjoy'],\n            'educational': ['learn', 'study', 'course', 'school', 'university', 'education'],\n            'social': ['friend', 'meet', 'party', 'social', 'group', 'community']\n        }\n\n    def analyze_semantic_relationships(self, new_fact: str, existing_facts: Dict) -> SemanticContext:\n        \"\"\"Analyze semantic relationships for a new fact\"\"\"\n        context_type = self._detect_context_type(new_fact)\n        related_facts = self._find_related_facts(new_fact, existing_facts)\n        semantic_tags = self._extract_semantic_tags(new_fact)\n        similarity_hash = self._generate_similarity_hash(new_fact)\n\n        return SemanticContext(\n            related_facts=related_facts,\n            confidence_score=0.8,\n            context_type=context_type,\n            semantic_tags=semantic_tags,\n            similarity_hash=similarity_hash\n        )\n\n    def _detect_context_type(self, fact: str) -> str:\n        \"\"\"Detect the context type of a fact\"\"\"\n        fact_lower = fact.lower()\n\n        for context, indicators in self.context_indicators.items():\n            if any(indicator in fact_lower for indicator in indicators):\n                return context\n\n        return \"general\"\n\n    def _find_related_facts(self, new_fact: str, existing_facts: Dict) -> List[str]:\n        \"\"\"Find facts related to the new fact\"\"\"\n        related = []\n        new_fact_lower = new_fact.lower()\n\n        # Check for direct keyword matches\n        for fact_key, fact_value in existing_facts.items():\n            if self._calculate_semantic_similarity(new_fact_lower, str(fact_value).lower()) > 0.3:\n                related.append(fact_key)\n\n        return related\n\n    def _calculate_semantic_similarity(self, fact1: str, fact2: str) -> float:\n        \"\"\"Calculate semantic similarity between two facts\"\"\"\n        words1 = set(fact1.split())\n        words2 = set(fact2.split())\n\n        intersection = words1.intersection(words2)\n        union = words1.union(words2)\n\n        if not union:\n            return 0.0\n\n        return len(intersection) / len(union)\n\n    def _extract_semantic_tags(self, fact: str) -> List[str]:\n        \"\"\"Extract semantic tags from a fact\"\"\"\n        tags = []\n        fact_lower = fact.lower()\n\n        # Extract technology tags\n        tech_keywords = ['python', 'javascript', 'java', 'react', 'node', 'sql', 'html', 'css']\n        for tech in tech_keywords:\n            if tech in fact_lower:\n                tags.append(f\"tech:{tech}\")\n\n        return tags\n\n    def _generate_similarity_hash(self, fact: str) -> str:\n        \"\"\"Generate a hash for similarity detection\"\"\"\n        # Normalize the fact for similarity comparison\n        normalized = re.sub(r'[^\\w\\s]', '', fact.lower())\n        normalized = ' '.join(sorted(normalized.split()))\n        return hashlib.md5(normalized.encode()).hexdigest()[:8]\n\n\nclass EmotionalMemoryEngine:\n    \"\"\"Advanced emotional context and sentiment tracking\"\"\"\n\n    def __init__(self):\n        # Emotion indicators\n        self.emotion_patterns = {\n            'positive': {\n                'keywords': ['love', 'like', 'enjoy', 'excited', 'happy', 'great', 'awesome', 'amazing', 'fantastic'],\n                'intensity_modifiers': ['really', 'very', 'extremely', 'absolutely', 'totally']\n            },\n            'negative': {\n                'keywords': ['hate', 'dislike', 'frustrated', 'angry', 'sad', 'terrible', 'awful', 'horrible'],\n                'intensity_modifiers': ['really', 'very', 'extremely', 'absolutely', 'totally']\n            },\n            'neutral': {\n                'keywords': ['okay', 'fine', 'normal', 'average', 'standard', 'regular']\n            }\n        }\n\n        # Specific emotion detection\n        self.specific_emotions = {\n            'excited': ['excited', 'thrilled', 'pumped', 'enthusiastic'],\n            'proud': ['proud', 'accomplished', 'achieved', 'successful'],\n            'anxious': ['anxious', 'worried', 'nervous', 'concerned'],\n            'happy': ['happy', 'joyful', 'cheerful', 'delighted'],\n            'sad': ['sad', 'disappointed', 'upset', 'down']\n        }\n\n    def analyze_sentiment(self, message: str) -> EmotionalContext:\n        \"\"\"Analyze emotional context of a message\"\"\"\n        sentiment = self._detect_sentiment(message)\n        emotion_tags = self._detect_specific_emotions(message)\n        emotional_intensity = self._calculate_emotional_intensity(message)\n        mood_context = self._detect_mood_context(message)\n\n        return EmotionalContext(\n            sentiment=sentiment,\n            emotion_tags=emotion_tags,\n            emotional_intensity=emotional_intensity,\n            mood_context=mood_context,\n            confidence=0.7\n        )\n\n    def _detect_sentiment(self, message: str) -> str:\n        \"\"\"Detect overall sentiment of message\"\"\"\n        message_lower = message.lower()\n\n        positive_score = 0\n        negative_score = 0\n\n        for keyword in self.emotion_patterns['positive']['keywords']:\n            if keyword in message_lower:\n                positive_score += 1\n\n        for keyword in self.emotion_patterns['negative']['keywords']:\n            if keyword in message_lower:\n                negative_score += 1\n\n        if positive_score > negative_score:\n            return \"positive\"\n        elif negative_score > positive_score:\n            return \"negative\"\n        else:\n            return \"neutral\"\n\n    def _detect_specific_emotions(self, message: str) -> List[str]:\n        \"\"\"Detect specific emotions in message\"\"\"\n        emotions = []\n        message_lower = message.lower()\n\n        for emotion, keywords in self.specific_emotions.items():\n            if any(keyword in message_lower for keyword in keywords):\n                emotions.append(emotion)\n\n        return emotions\n\n    def _calculate_emotional_intensity(self, message: str) -> float:\n        \"\"\"Calculate emotional intensity (0.0 to 1.0)\"\"\"\n        message_lower = message.lower()\n        intensity = 0.5  # Base intensity\n\n        # Check for intensity modifiers\n        for category in self.emotion_patterns.values():\n            modifiers = category.get('intensity_modifiers', [])\n            for modifier in modifiers:\n                if modifier in message_lower:\n                    intensity += 0.2\n\n        # Check for exclamation marks\n        intensity += min(message.count('!') * 0.1, 0.3)\n\n        # Check for capital letters (excitement indicator)\n        if any(word.isupper() for word in message.split()):\n            intensity += 0.1\n\n        return min(intensity, 1.0)\n\n    def _detect_mood_context(self, message: str) -> str:\n        \"\"\"Detect overall mood context\"\"\"\n        message_lower = message.lower()\n\n        if any(word in message_lower for word in ['celebration', 'party', 'success', 'achievement']):\n            return \"celebratory\"\n        elif any(word in message_lower for word in ['problem', 'issue', 'difficulty', 'challenge']):\n            return \"challenging\"\n        elif any(word in message_lower for word in ['learn', 'new', 'start', 'begin']):\n            return \"learning\"\n        else:\n            return \"normal\"\n\n\nclass ConflictResolution:\n    \"\"\"Advanced conflict detection and resolution\"\"\"\n\n    def __init__(self):\n        self.conflict_patterns = {\n            'direct_contradiction': [\n                (r'i am (\\w+)', r'i am not \\1'),\n                (r'i work as (.+)', r'i don\\'t work as \\1'),\n                (r'i live in (.+)', r'i don\\'t live in \\1')\n            ],\n            'temporal_inconsistency': [\n                (r'i am (\\d+) years old', r'i am (\\d+) years old'),  # Different ages\n                (r'i started (.+) in (\\d{4})', r'i started \\1 in (\\d{4})')  # Different start dates\n            ]\n        }\n        \n        # Enhanced contradiction patterns\n        self.enhanced_patterns = {\n            'preference_contradiction': [\n                (r'i (like|love) (.+)', r'i (hate|dislike) (.+)'),\n                (r'i (hate|dislike) (.+)', r'i (like|love) (.+)')\n            ],\n            'state_change': [\n                (r'i (used to|previously) (.+)', r'i (now|currently) (.+)'),\n                (r'i (now|currently) (.+)', r'i (used to|previously) (.+)')\n            ],\n            'boolean_contradiction': [\n                (r'i am (.+)', r'i am not (.+)'),\n                (r'i do (.+)', \"i don't (.+)\")\n            ]\n        }\n\n    def detect_contradictions(self, new_fact: str, existing_facts: Dict) -> List[Conflict]:\n        \"\"\"Detect contradictions between new fact and existing facts\"\"\"\n        conflicts = []\n        new_fact_lower = new_fact.lower()\n\n        for fact_key, fact_value in existing_facts.items():\n            fact_value_lower = str(fact_value).lower()\n\n            # Check for direct contradictions\n            if self._is_direct_contradiction(new_fact_lower, fact_value_lower):\n                conflicts.append(Conflict(\n                    conflicting_facts=[new_fact, str(fact_value)],\n                    conflict_type=ConflictType.DIRECT_CONTRADICTION.value,\n                    severity=0.9,\n                    suggested_resolution=f\"Update {fact_key} from '{fact_value}' to '{new_fact}'\"\n                ))\n            \n            # Check for temporal inconsistencies\n            elif self._is_temporal_inconsistency(new_fact_lower, fact_value_lower):\n                conflicts.append(Conflict(\n                    conflicting_facts=[new_fact, str(fact_value)],\n                    conflict_type=ConflictType.TEMPORAL_INCONSISTENCY.value,\n                    severity=0.7,\n                    suggested_resolution=f\"Consider updating {fact_key} from '{fact_value}' to '{new_fact}' or marking as historical\"\n                ))\n            \n            # Check for semantic contradictions\n            elif self._is_semantic_contradiction(new_fact_lower, fact_value_lower):\n                conflicts.append(Conflict(\n                    conflicting_facts=[new_fact, str(fact_value)],\n                    conflict_type=ConflictType.SEMANTIC_CONFLICT.value,\n                    severity=0.8,\n                    suggested_resolution=f\"Resolve semantic conflict between '{fact_value}' and '{new_fact}' in {fact_key}\"\n                ))\n\n        return conflicts\n\n    def _is_direct_contradiction(self, fact1: str, fact2: str) -> bool:\n        \"\"\"Check if two facts directly contradict each other\"\"\"\n        # Simple contradiction detection\n        if 'not' in fact1 and fact1.replace('not ', '') in fact2:\n            return True\n        if 'not' in fact2 and fact2.replace('not ', '') in fact1:\n            return True\n            \n        # Check enhanced boolean contradictions\n        for pattern1, pattern2 in self.enhanced_patterns['boolean_contradiction']:\n            match1 = re.search(pattern1, fact1)\n            match2 = re.search(pattern2, fact2)\n            if match1 and match2:\n                # Extract the subject from both patterns and compare\n                subject1 = match1.group(1) if match1.lastindex and match1.lastindex >= 1 else \"\"\n                subject2 = match2.group(1) if match2.lastindex and match2.lastindex >= 1 else \"\"\n                if subject1 and subject2 and subject1.lower() == subject2.lower():\n                    return True\n\n        return False\n\n    def _is_temporal_inconsistency(self, fact1: str, fact2: str) -> bool:\n        \"\"\"Check for temporal inconsistencies between facts\"\"\"\n        # Check for state change contradictions\n        for pattern1, pattern2 in self.enhanced_patterns['state_change']:\n            match1 = re.search(pattern1, fact1)\n            match2 = re.search(pattern2, fact2)\n            if match1 and match2:\n                # If both facts refer to the same subject but different time states\n                return True\n                \n        return False\n\n    def _is_semantic_contradiction(self, fact1: str, fact2: str) -> bool:\n        \"\"\"Check for semantic contradictions between facts\"\"\"\n        # Check for preference contradictions\n        for pattern1, pattern2 in self.enhanced_patterns['preference_contradiction']:\n            match1 = re.search(pattern1, fact1)\n            match2 = re.search(pattern2, fact2)\n            if match1 and match2:\n                # Extract subjects from both patterns and compare\n                subject1 = match1.group(2) if match1.lastindex and match1.lastindex >= 2 else \"\"\n                subject2 = match2.group(2) if match2.lastindex and match2.lastindex >= 2 else \"\"\n                if subject1 and subject2 and subject1.lower() == subject2.lower():\n                    # Same subject but opposite preferences\n                    return True\n                \n        return False\n\n    def resolve_conflict(self, conflict: Conflict, current_facts: Dict) -> Dict[str, Any]:\n        \"\"\"Resolve a detected conflict with intelligent suggestions\"\"\"\n        resolution = {\n            'action': 'review',\n            'details': conflict.suggested_resolution,\n            'confidence': conflict.severity\n        }\n        \n        # For direct contradictions, suggest update\n        if conflict.conflict_type == ConflictType.DIRECT_CONTRADICTION.value:\n            resolution['action'] = 'update'\n            resolution['confidence'] = 0.9\n            \n        # For temporal inconsistencies, suggest historical tracking\n        elif conflict.conflict_type == ConflictType.TEMPORAL_INCONSISTENCY.value:\n            resolution['action'] = 'mark_historical'\n            resolution['confidence'] = 0.7\n            \n        # For semantic conflicts, suggest review\n        elif conflict.conflict_type == ConflictType.SEMANTIC_CONFLICT.value:\n            resolution['action'] = 'review'\n            resolution['confidence'] = 0.8\n            \n        return resolution\n\n\nclass SerpAPISearchEngine:\n    \"\"\"\n    SerpAPI integration for intelligent web searching with memory-aware preferences.\n    Handles search execution, result filtering, and search history management.\n    \"\"\"\n\n    def __init__(self, api_key: str = \"a16428a9d6d8ce8fea03fea8421397c86995036a63343f09987508e9bd06d21d\"):\n        self.api_key = api_key\n        self.base_url = \"https://serpapi.com/search\"\n\n    def search(self, query: str, search_preferences: Dict = None, user_sources: Dict = None) -> Dict[str, Any]:\n        \"\"\"\n        Execute a search with user preferences and source filtering\n\n        Args:\n            query: Search query string\n            search_preferences: User's search depth and style preferences\n            user_sources: User's preferred and disliked sources\n\n        Returns:\n            Dict containing search results, metadata, and filtered results\n        \"\"\"\n        try:\n            # Prepare search parameters\n            params = {\n                \"q\": query,\n                \"api_key\": self.api_key,\n                \"engine\": \"google\",\n                \"num\": self._determine_result_count(search_preferences),\n                \"safe\": \"active\"\n            }\n\n            # Execute search\n            response = requests.get(self.base_url, params=params, timeout=10)\n            response.raise_for_status()\n\n            raw_results = response.json()\n\n            # Process and filter results\n            processed_results = self._process_search_results(raw_results, user_sources, search_preferences)\n\n            return {\n                \"query\": query,\n                \"timestamp\": datetime.now().isoformat(),\n                \"raw_results_count\": len(raw_results.get(\"organic_results\", [])),\n                \"filtered_results_count\": len(processed_results[\"filtered_results\"]),\n                \"results\": processed_results[\"filtered_results\"],\n                \"news_results\": processed_results.get(\"news_results\", []),\n                \"search_metadata\": {\n                    \"search_time\": raw_results.get(\"search_metadata\", {}).get(\"total_time_taken\", 0),\n                    \"sources_filtered\": processed_results[\"sources_filtered\"],\n                    \"quality_score\": processed_results[\"quality_score\"]\n                },\n                \"suggested_follow_ups\": self._generate_follow_up_suggestions(query, processed_results)\n            }\n\n        except requests.exceptions.RequestException as e:\n            return {\n                \"error\": f\"Search request failed: {str(e)}\",\n                \"query\": query,\n                \"timestamp\": datetime.now().isoformat(),\n                \"results\": []\n            }\n        except Exception as e:\n            return {\n                \"error\": f\"Search processing failed: {str(e)}\",\n                \"query\": query,\n                \"timestamp\": datetime.now().isoformat(),\n                \"results\": []\n            }\n\n    def _determine_result_count(self, search_preferences: Dict = None) -> int:\n        \"\"\"Determine number of results based on user's search depth preference\"\"\"\n        if not search_preferences:\n            return 10\n\n        depth = search_preferences.get(\"search_depth\", \"moderate\")\n        if depth == \"shallow\":\n            return 5\n        elif depth == \"deep\":\n            return 20\n        else:  # moderate\n            return 10\n\n    def _process_search_results(self, raw_results: Dict, user_sources: Dict = None, search_preferences: Dict = None) -> Dict:\n        \"\"\"Process and filter search results based on user preferences\"\"\"\n        organic_results = raw_results.get(\"organic_results\", [])\n        news_results = raw_results.get(\"news_results\", [])\n\n        filtered_results = []\n        sources_filtered = {\"removed\": [], \"prioritized\": []}\n\n        # Get user source preferences\n        preferred_sources = user_sources.get(\"preferred_sources\", []) if user_sources else []\n        disliked_sources = user_sources.get(\"disliked_sources\", []) if user_sources else []\n\n        for result in organic_results:\n            source_domain = self._extract_domain(result.get(\"link\", \"\"))\n\n            # Skip disliked sources\n            if any(disliked in source_domain.lower() for disliked in disliked_sources):\n                sources_filtered[\"removed\"].append(source_domain)\n                continue\n\n            # Prioritize preferred sources\n            priority_score = 0\n            if any(preferred in source_domain.lower() for preferred in preferred_sources):\n                priority_score = 10\n                sources_filtered[\"prioritized\"].append(source_domain)\n\n            # Add processed result\n            processed_result = {\n                \"title\": result.get(\"title\", \"\"),\n                \"link\": result.get(\"link\", \"\"),\n                \"snippet\": result.get(\"snippet\", \"\"),\n                \"source_domain\": source_domain,\n                \"priority_score\": priority_score,\n                \"position\": result.get(\"position\", 0)\n            }\n\n            filtered_results.append(processed_result)\n\n        # Sort by priority score and original position\n        filtered_results.sort(key=lambda x: (-x[\"priority_score\"], x[\"position\"]))\n\n        # Calculate quality score\n        quality_score = self._calculate_quality_score(filtered_results, sources_filtered)\n\n        return {\n            \"filtered_results\": filtered_results,\n            \"news_results\": news_results[:5],  # Limit news results\n            \"sources_filtered\": sources_filtered,\n            \"quality_score\": quality_score\n        }\n\n    def _extract_domain(self, url: str) -> str:\n        \"\"\"Extract domain from URL\"\"\"\n        try:\n            from urllib.parse import urlparse\n            return urlparse(url).netloc.replace(\"www.\", \"\")\n        except:\n            return url\n\n    def _calculate_quality_score(self, results: List[Dict], sources_filtered: Dict) -> float:\n        \"\"\"Calculate a quality score for the search results\"\"\"\n        if not results:\n            return 0.0\n\n        # Base score\n        score = 0.5\n\n        # Bonus for prioritized sources\n        prioritized_count = len(sources_filtered.get(\"prioritized\", []))\n        if prioritized_count > 0:\n            score += min(0.3, prioritized_count * 0.1)\n\n        # Bonus for result diversity\n        unique_domains = len(set(r[\"source_domain\"] for r in results))\n        if unique_domains > 3:\n            score += 0.2\n\n        return min(score, 1.0)\n\n    def _generate_follow_up_suggestions(self, query: str, results: Dict) -> List[str]:\n        \"\"\"Generate intelligent follow-up search suggestions\"\"\"\n        suggestions = []\n\n        # Based on query type\n        if any(word in query.lower() for word in [\"how to\", \"tutorial\", \"guide\"]):\n            suggestions.append(f\"{query} examples\")\n            suggestions.append(f\"{query} best practices\")\n\n        if any(word in query.lower() for word in [\"what is\", \"define\", \"meaning\"]):\n            suggestions.append(f\"{query} use cases\")\n            suggestions.append(f\"{query} vs alternatives\")\n\n        # Based on results\n        if results.get(\"news_results\"):\n            suggestions.append(f\"{query} latest news\")\n            suggestions.append(f\"{query} recent developments\")\n\n        return suggestions[:3]  # Limit to 3 suggestions\n\n\nclass NovaMemoryAI:\n    \"\"\"\n    Nova Memory AI System - A dedicated memory agent that works alongside Nova\n\n    Core Functions:\n    - Only stores & retrieves memory - Pure data storage and recall\n    - Activates when Nova forgets - Seamless background operation\n    - Feeds missing info back automatically - Transparent to the user\n    \"\"\"\n\n    def __init__(self, storage_file: str = \"astra_ai/Date/nova_ai_memory.json\"):\n        \"\"\"Initialize the Nova Memory AI System\"\"\"\n        # Storage configuration\n        self.storage_file = storage_file\n        self.session_timeout_minutes = 30  # Default 30 minutes\n        \n        # Initialize user_id\n        self.user_id = \"default_user\"\n        \n        # Initialize vector index and clustering structures\n        self.vector_index = {}  # Maps event_id to embedding vector\n        self.clusters = {}      # Maps cluster_id to cluster information\n        self.update_log = []    # Logs of updates for tracking preference evolution\n        \n        # Initialize TF-IDF vectorizer for text embeddings\n        self.vectorizer = TfidfVectorizer(max_features=100, stop_words='english')\n        \n        # Initialize data structure\n        self.data = {\n            \"user\": {\n                \"user_id\": self.user_id,\n                \"name\": None,\n                \"created_at\": datetime.now().isoformat(),\n                \"status\": \"active\",\n                \"total_sessions\": 0,\n                \"last_seen\": None,\n                \"relationship_established\": False\n            },\n            \"memory_events\": [],  # Keep original for compatibility\n            \"conversation\": [],\n            \"sessions\": {},\n            \"current_session\": None,\n            \"conversation_state\": {\n                \"greeting_completed\": False,\n                \"introduction_phase\": True,\n                \"established_user\": False\n            },\n            \"fact_history\": {},  # Initialize fact_history from the start\n\n            # Comprehensive 27-Category Memory Framework\n            \"memory_categories\": {\n                MemoryCategory.USER_IDENTITY.value: {},\n                MemoryCategory.PERSONAL_PREFERENCES.value: {},\n                MemoryCategory.TASK_PROJECT_TRACKING.value: {},\n                MemoryCategory.ACTIVITY_BEHAVIOR.value: {},\n                MemoryCategory.USER_INSTRUCTIONS.value: {},\n                MemoryCategory.CURRENT_STATE.value: {},\n                MemoryCategory.PERSONAL_DEVELOPMENT.value: {},\n                MemoryCategory.COMMUNICATION_BOUNDARIES.value: {},\n                MemoryCategory.CONTEXTUAL_RULES.value: {},\n                MemoryCategory.MULTI_IDENTITY.value: {},\n                MemoryCategory.KNOWLEDGE_EXPERTISE.value: {},\n                MemoryCategory.TOOL_INTEGRATION.value: {},\n                MemoryCategory.RESPONSE_ADAPTATION.value: {},\n                MemoryCategory.FILE_MEDIA.value: {},\n                MemoryCategory.LONG_TERM_GOALS.value: {},\n                MemoryCategory.COLLABORATOR_RELATIONSHIPS.value: {},\n                MemoryCategory.DATA_PRIVACY.value: {},\n                MemoryCategory.MULTIMODAL_PREFERENCES.value: {},\n                MemoryCategory.SYSTEM_AWARENESS.value: {},\n                MemoryCategory.SESSION_THEMES.value: {},\n                MemoryCategory.META_MEMORY.value: {},\n                MemoryCategory.TEMPORAL_PATTERNS.value: {},\n                MemoryCategory.SEARCH_EXTERNAL_INFO.value: {},\n\n                # New Enhanced Categories for Intelligence Features\n                MemoryCategory.GREETING_PATTERNS.value: {},\n                MemoryCategory.CONVERSATION_ANALYTICS.value: {},\n                MemoryCategory.NEWS_WEATHER_HISTORY.value: {},\n                MemoryCategory.TIMEZONE_PREFERENCES.value: {}\n            },\n\n            # Enhanced metadata and relationships\n            \"category_relationships\": {},  # Cross-category relationships\n            \"memory_metadata\": {},         # Enhanced metadata for each memory item\n            \"privacy_settings\": {          # Privacy controls\n                \"default_retention\": \"permanent\",\n                \"sensitive_data_handling\": \"encrypted\",\n                \"auto_cleanup_enabled\": False,\n                \"privacy_level_defaults\": {\n                    \"normal\": \"store_and_recall\",\n                    \"sensitive\": \"store_encrypted\",\n                    \"private\": \"session_only\"\n                }\n            },\n            \"behavioral_adaptation\": {     # Dynamic behavior adaptation\n                \"response_style_preferences\": {},\n                \"communication_adaptations\": {},\n                \"learned_patterns\": {},\n                \"user_feedback_integration\": {}\n            }\n        }\n        \n        # Add the memory_engine structure as per specification\n        self.data[\"memory_engine\"] = {\n            \"metadata\": {\n                \"version\": \"1.0\",\n                \"generated_at\": datetime.now().isoformat(),\n                \"description\": \"Mem0 AI Memory Engine - Event-based user memory management system\"\n            },\n            \"memory_events\": self.data[\"memory_events\"],  # Reference the same list for consistency\n            \"vector_index\": self.vector_index,            # Reference the same dict\n            \"clusters\": self.clusters,                    # Reference the same dict\n            \"update_log\": self.update_log                 # Reference the same list\n        }\n\n        # Initialize advanced engines\n        self.fact_extractor = EnhancedFactExtractor()\n        self.semantic_engine = SemanticMemoryEngine()\n        self.emotional_engine = EmotionalMemoryEngine()\n        self.conflict_resolver = ConflictResolution()\n\n        # Advanced memory features\n        self.memory_graph = {}  # Relationship graph\n        self.importance_scores = {}  # Fact importance tracking\n        self.patterns = []  # Detected patterns\n\n        # Load existing data\n        self.load_memory()\n\n        # Initialize comprehensive memory management\n        self.memory_manager = ComprehensiveMemoryManager(self.data)\n\n        # Initialize search engine for external information retrieval\n        self.search_engine = SerpAPISearchEngine()\n\n        # Initialize AI Organizer\n        organizer_config = ORGANIZER_CONFIG.copy()\n        organizer_config['memory_file_path'] = storage_file\n        self.organizer = AIOrganizer(organizer_config)\n        self.organizer.organizer_enabled = organizer_config.get('organizer_enabled', True)\n        \n        # Initialize vector index for semantic similarity and clustering\n        self.vector_index = {}  # Maps event_id to embedding vector\n        self.clusters = {}      # Maps cluster_id to cluster information\n        self.update_log = []    # Logs of updates for tracking preference evolution\n\n    def _process_structured_metadata(self, metadata: Dict) -> Dict:\n        \"\"\"Process and validate structured metadata for JSON serialization\"\"\"\n        if not metadata:\n            return {}\n\n        processed = {}\n        for key, value in metadata.items():\n            # Ensure all metadata values are JSON serializable\n            processed[key] = self._serialize_structured_value(value)\n\n        return processed\n\n    def _serialize_structured_value(self, value: Any) -> Any:\n        \"\"\"Serialize complex structured data for JSON compatibility\"\"\"\n        if value is None:\n            return None\n        elif isinstance(value, (str, int, float, bool)):\n            return value\n        elif isinstance(value, (list, tuple)):\n            return [self._serialize_structured_value(item) for item in value]\n        elif isinstance(value, dict):\n            return {k: self._serialize_structured_value(v) for k, v in value.items()}\n        elif hasattr(value, '__dict__'):\n            # Handle dataclass or custom objects\n            return self._serialize_structured_value(value.__dict__)\n        else:\n            # Convert to string for unsupported types\n            return str(value)\n\n    def _deserialize_structured_value(self, value: Any) -> Any:\n        \"\"\"Deserialize structured data from JSON storage\"\"\"\n        # For now, return as-is since JSON loading handles basic types\n        # This method can be extended for custom deserialization logic\n        return value\n\n    def query_structured_data(self, category: str, query_filter: Dict = None) -> List[Dict]:\n        \"\"\"Query structured data with complex filtering\"\"\"\n        if category not in self.data[\"memory_categories\"]:\n            return []\n\n        category_data = self.data[\"memory_categories\"][category]\n        results = []\n\n        for key, item in category_data.items():\n            # Apply query filters if provided\n            if query_filter:\n                match = True\n                for filter_key, filter_value in query_filter.items():\n                    if filter_key in item:\n                        item_value = item[filter_key]\n                        if isinstance(filter_value, dict) and isinstance(item_value, dict):\n                            # Deep comparison for nested objects\n                            if not self._deep_match(item_value, filter_value):\n                                match = False\n                                break\n                        elif isinstance(filter_value, list) and isinstance(item_value, list):\n                            # Check if any items in filter_value are in item_value\n                            if not any(fv in item_value for fv in filter_value):\n                                match = False\n                                break\n                        elif item_value != filter_value:\n                            match = False\n                            break\n                    else:\n                        match = False\n                        break\n\n                if match:\n                    results.append(item)\n            else:\n                results.append(item)\n\n        return results\n\n    def _deep_match(self, item_value: Dict, filter_value: Dict) -> bool:\n        \"\"\"Deep comparison for nested dictionary structures\"\"\"\n        for key, value in filter_value.items():\n            if key not in item_value:\n                return False\n            if isinstance(value, dict) and isinstance(item_value[key], dict):\n                if not self._deep_match(item_value[key], value):\n                    return False\n            elif item_value[key] != value:\n                return False\n        return True\n\n    def store_memory_item(self, category: str, subcategory: str, key: str, value: Any, metadata: Dict = None) -> bool:\n        \"\"\"Store a memory item in the appropriate category with full metadata and structured data support\"\"\"\n        try:\n            if category not in self.data[\"memory_categories\"]:\n                return False\n\n            # Process structured metadata\n            processed_metadata = self._process_structured_metadata(metadata) if metadata else {}\n\n            # Create comprehensive memory item with structured data support\n            memory_item = MemoryItem(\n                category=category,\n                subcategory=subcategory,\n                key=key,\n                value=self._serialize_structured_value(value),\n                confidence=processed_metadata.get('confidence', 0.8),\n                timestamp=datetime.now().isoformat(),\n                last_accessed=datetime.now().isoformat(),\n                source=processed_metadata.get('source', 'conversation'),\n                relationships=processed_metadata.get('relationships', []),\n                tags=processed_metadata.get('tags', []),\n                privacy_level=processed_metadata.get('privacy_level', 'normal'),\n                session_id=processed_metadata.get('session_id')\n            )\n\n            # Store in appropriate category\n            self.data[\"memory_categories\"][category][key] = asdict(memory_item)\n\n            # Update relationships\n            if memory_item.relationships:\n                self._update_category_relationships(category, memory_item.relationships)\n\n            # Store in fact_history instead of current_facts\n            fact_key = f\"{category}.{subcategory}\"\n            if \"fact_history\" not in self.data:\n                self.data[\"fact_history\"] = {}\n            self.data[\"fact_history\"][fact_key] = value\n\n            # Special-case: if storing personal preferences, maintain accumulated lists with timestamps under personal_preferences\n            try:\n                if category == MemoryCategory.PERSONAL_PREFERENCES.value and subcategory in ['likes', 'dislikes', 'interests', 'hobbies', 'favorites', 'avoid', 'goals', 'values', 'boundaries']:\n                    fh_key = f'personal_preferences.{subcategory}'\n                    if \"fact_history\" not in self.data:\n                        self.data[\"fact_history\"] = {}\n                    existing_collection = self.data['fact_history'].get(fh_key, [])\n                    \n                    # Create new preference entry with timestamp\n                    new_entry = {\n                        'item': value,\n                        'added_at': memory_item.timestamp\n                    }\n                    \n                    # Check if this specific preference already exists in the collection\n                    exists = False\n                    for entry in existing_collection:\n                        if isinstance(entry, dict) and entry.get('item') == value:\n                            exists = True\n                            break\n                    \n                    # If it doesn't exist, add it to the collection\n                    if not exists:\n                        if isinstance(existing_collection, list):\n                            existing_collection.append(new_entry)\n                        else:\n                            # If it was stored as a different format, convert to list format\n                            existing_collection = [new_entry]\n                        \n                        self.data['fact_history'][fh_key] = existing_collection\n            except Exception:\n                pass\n\n            return True\n\n        except Exception as e:\n            print(f\"Error storing memory item: {e}\")\n            return False\n\n    # ---------------------- New Structured Helpers ----------------------\n    def store_user_conversation_context(self, context: Dict[str, Any]) -> bool:\n        \"\"\"Store structured conversation context provided explicitly by the user.\n\n        Example context:\n        {\n          \"preferred_answer_length\": \"short\",\n          \"avoid_topics\": [\"politics\"],\n          \"languages_used\": [\"English\"]\n        }\n        \"\"\"\n        try:\n            ctx = {\n                'preferred_answer_length': context.get('preferred_answer_length', ''),\n                'avoid_topics': context.get('avoid_topics', []),\n                'languages_used': context.get('languages_used', [])\n            }\n\n            # Store as single structured entry under conversation_context\n            key = 'conversation_context'\n            self.data['memory_categories'][MemoryCategory.RESPONSE_ADAPTATION.value].setdefault(key, {})\n            self.data['memory_categories'][MemoryCategory.RESPONSE_ADAPTATION.value][key] = {\n                'category': MemoryCategory.RESPONSE_ADAPTATION.value,\n                'subcategory': 'conversation_context',\n                'key': key,\n                'value': ctx,\n                'confidence': 0.95,\n                'timestamp': datetime.now().isoformat()\n            }\n\n            # Store in fact_history for persistence\n            if \"fact_history\" not in self.data:\n                self.data[\"fact_history\"] = {}\n            self.data['fact_history']['conversation_context'] = ctx\n            return True\n        except Exception as e:\n            print(f\"Error storing conversation context: {e}\")\n            return False\n\n    def store_collaborator_relationship(self, rel_type: str, name: str) -> bool:\n        \"\"\"Store or update a named collaborator relationship.\n\n        rel_type examples: 'best_friend' -> stored under collaborator_relationships.best_friend\n                           'exercise_partner' -> stored under collaborator_relationships.exercise_partner\n        \"\"\"\n        try:\n            cat = MemoryCategory.COLLABORATOR_RELATIONSHIPS.value\n            self.data['memory_categories'].setdefault(cat, {})\n            key = f\"collab.{rel_type}\"\n            entry = {\n                'category': cat,\n                'subcategory': rel_type,\n                'key': key,\n                'value': name,\n                'confidence': 0.95,\n                'timestamp': datetime.now().isoformat()\n            }\n            self.data['memory_categories'][cat][key] = entry\n            # Keep a convenient mapping in fact_history\n            if \"fact_history\" not in self.data:\n                self.data[\"fact_history\"] = {}\n            self.data['fact_history'][f'collaborator.{rel_type}'] = name\n            return True\n        except Exception as e:\n            print(f\"Error storing collaborator relationship: {e}\")\n            return False\n\n    def store_long_term_goal(self, goal_type: str, value: str, target_date: Optional[str] = None) -> bool:\n        \"\"\"Store a structured long-term goal with optional target date.\n\n        goal_type examples: 'career_goal', 'skill_goal'\n        \"\"\"\n        try:\n            cat = MemoryCategory.LONG_TERM_GOALS.value\n            self.data['memory_categories'].setdefault(cat, {})\n            key = f\"goal.{goal_type}\"\n            entry_value = {'value': value, 'target_date': target_date}\n            entry = {\n                'category': cat,\n                'subcategory': goal_type,\n                'key': key,\n                'value': entry_value,\n                'confidence': 0.9,\n                'timestamp': datetime.now().isoformat()\n            }\n            self.data['memory_categories'][cat][key] = entry\n            # Also update fact_history for persistence\n            if \"fact_history\" not in self.data:\n                self.data[\"fact_history\"] = {}\n            self.data['fact_history'][f'long_term.{goal_type}'] = entry_value\n            return True\n        except Exception as e:\n            print(f\"Error storing long term goal: {e}\")\n            return False\n\n    def retrieve_memory_by_category(self, category: str, subcategory: str = None) -> Dict[str, Any]:\n        \"\"\"Retrieve memory items from a specific category\"\"\"\n        if category not in self.data[\"memory_categories\"]:\n            return {}\n\n        category_data = self.data[\"memory_categories\"][category]\n\n        if subcategory:\n            # Filter by subcategory\n            filtered_data = {\n                key: item for key, item in category_data.items()\n                if item.get('subcategory') == subcategory\n            }\n            return filtered_data\n\n        return category_data\n\n    def get_comprehensive_user_profile(self) -> Dict[str, Any]:\n        \"\"\"Generate a comprehensive user profile across all 22 categories\"\"\"\n        profile = {\n            \"user_id\": self.data[\"user\"][\"user_id\"],\n            \"profile_generated_at\": datetime.now().isoformat(),\n            \"categories\": {}\n        }\n\n        # Compile information from each category\n        for category, data in self.data[\"memory_categories\"].items():\n            if data:  # Only include categories with data\n                category_summary = self._summarize_category(category, data)\n                profile[\"categories\"][category] = category_summary\n\n        # Add behavioral insights\n        profile[\"behavioral_insights\"] = self._generate_behavioral_insights()\n\n        # Add relationship map\n        profile[\"relationship_map\"] = self.data.get(\"category_relationships\", {})\n\n        return profile\n\n    def _update_category_relationships(self, category: str, relationships: List[str]):\n        \"\"\"Update cross-category relationships\"\"\"\n        if category not in self.data[\"category_relationships\"]:\n            self.data[\"category_relationships\"][category] = []\n\n        for related_category in relationships:\n            if related_category not in self.data[\"category_relationships\"][category]:\n                self.data[\"category_relationships\"][category].append(related_category)\n\n            # Add bidirectional relationship\n            if related_category not in self.data[\"category_relationships\"]:\n                self.data[\"category_relationships\"][related_category] = []\n            if category not in self.data[\"category_relationships\"][related_category]:\n                self.data[\"category_relationships\"][related_category].append(category)\n\n    def _summarize_category(self, category: str, data: Dict) -> Dict[str, Any]:\n        \"\"\"Generate a summary for a specific category\"\"\"\n        summary = {\n            \"total_items\": len(data),\n            \"last_updated\": max([item.get('timestamp', '') for item in data.values()]) if data else None,\n            \"subcategories\": list(set([item.get('subcategory', 'unknown') for item in data.values()])),\n            \"key_items\": []\n        }\n\n        # Get most important/recent items\n        sorted_items = sorted(\n            data.items(),\n            key=lambda x: (x[1].get('confidence', 0), x[1].get('timestamp', '')),\n            reverse=True\n        )\n\n        # Include top 5 items\n        for key, item in sorted_items[:5]:\n            summary[\"key_items\"].append({\n                \"key\": key,\n                \"value\": item.get('value'),\n                \"subcategory\": item.get('subcategory'),\n                \"confidence\": item.get('confidence'),\n                \"last_accessed\": item.get('last_accessed')\n            })\n\n        return summary\n\n    def _generate_behavioral_insights(self) -> Dict[str, Any]:\n        \"\"\"Generate behavioral insights from stored memory\"\"\"\n        insights = {\n            \"communication_style\": self._analyze_communication_style(),\n            \"activity_patterns\": self._analyze_activity_patterns(),\n            \"learning_preferences\": self._analyze_learning_preferences(),\n            \"goal_orientation\": self._analyze_goal_orientation()\n        }\n\n        return insights\n\n    def _analyze_communication_style(self) -> Dict[str, Any]:\n        \"\"\"Analyze user's communication style from stored preferences\"\"\"\n        prefs = self.data[\"memory_categories\"].get(MemoryCategory.PERSONAL_PREFERENCES.value, {})\n        boundaries = self.data[\"memory_categories\"].get(MemoryCategory.COMMUNICATION_BOUNDARIES.value, {})\n\n        style = {\n            \"formality_level\": \"unknown\",\n            \"response_length_preference\": \"unknown\",\n            \"explanation_preference\": \"unknown\",\n            \"boundaries_count\": len(boundaries)\n        }\n\n        # Analyze preferences\n        for item in prefs.values():\n            subcategory = item.get('subcategory', '')\n            value = str(item.get('value', '')).lower()\n\n            if subcategory == 'formality':\n                if 'formal' in value or 'professional' in value:\n                    style[\"formality_level\"] = \"formal\"\n                elif 'casual' in value or 'relaxed' in value:\n                    style[\"formality_level\"] = \"casual\"\n                elif 'respectful' in value:\n                    style[\"formality_level\"] = \"respectful\"\n\n            elif subcategory == 'response_style':\n                if 'brief' in value or 'short' in value:\n                    style[\"response_length_preference\"] = \"brief\"\n                elif 'detailed' in value or 'comprehensive' in value:\n                    style[\"response_length_preference\"] = \"detailed\"\n\n            elif subcategory == 'explanation_rules':\n                if 'don\\'t explain' in value or 'only when' in value:\n                    style[\"explanation_preference\"] = \"minimal\"\n                elif 'always explain' in value:\n                    style[\"explanation_preference\"] = \"comprehensive\"\n\n        return style\n\n    def _analyze_activity_patterns(self) -> Dict[str, Any]:\n        \"\"\"Analyze user's activity patterns from stored behavior data\"\"\"\n        behavior = self.data[\"memory_categories\"].get(MemoryCategory.ACTIVITY_BEHAVIOR.value, {})\n\n        patterns = {\n            \"active_times\": \"unknown\",\n            \"engagement_style\": \"unknown\",\n            \"interaction_frequency\": \"unknown\"\n        }\n\n        # Analyze behavior patterns\n        for item in behavior.values():\n            subcategory = item.get('subcategory', '')\n            value = str(item.get('value', '')).lower()\n\n            if subcategory == 'active_times':\n                patterns[\"active_times\"] = value\n            elif subcategory == 'engagement_style':\n                patterns[\"engagement_style\"] = value\n\n        return patterns\n\n    def _analyze_learning_preferences(self) -> Dict[str, Any]:\n        \"\"\"Analyze user's learning preferences from development data\"\"\"\n        development = self.data[\"memory_categories\"].get(MemoryCategory.PERSONAL_DEVELOPMENT.value, {})\n\n        preferences = {\n            \"learning_style\": \"unknown\",\n            \"skill_focus_areas\": [],\n            \"progress_tracking\": \"unknown\"\n        }\n\n        # Analyze learning patterns\n        for item in development.values():\n            subcategory = item.get('subcategory', '')\n            value = str(item.get('value', ''))\n\n            if subcategory == 'skills_learning':\n                preferences[\"skill_focus_areas\"].append(value)\n            elif 'hands-on' in value.lower():\n                preferences[\"learning_style\"] = \"hands-on\"\n            elif 'visual' in value.lower():\n                preferences[\"learning_style\"] = \"visual\"\n\n        return preferences\n\n    def _analyze_goal_orientation(self) -> Dict[str, Any]:\n        \"\"\"Analyze user's goal orientation from long-term goals\"\"\"\n        goals = self.data[\"memory_categories\"].get(MemoryCategory.LONG_TERM_GOALS.value, {})\n\n        orientation = {\n            \"primary_goals\": [],\n            \"goal_type\": \"unknown\",\n            \"time_horizon\": \"unknown\"\n        }\n\n        # Analyze goals\n        for item in goals.values():\n            subcategory = item.get('subcategory', '')\n            value = str(item.get('value', ''))\n\n            if subcategory in ['career_aspiration', 'specific_goal']:\n                orientation[\"primary_goals\"].append(value)\n\n                if 'career' in value.lower() or 'engineer' in value.lower():\n                    orientation[\"goal_type\"] = \"career-focused\"\n                elif 'learn' in value.lower() or 'skill' in value.lower():\n                    orientation[\"goal_type\"] = \"skill-focused\"\n\n        return orientation\n\n    def _create_comprehensive_memory_event(self, operation: Dict, timestamp: str, emotional_context) -> Optional[MemoryEvent]:\n        \"\"\"Create a comprehensive memory event for the 22-category framework\"\"\"\n        try:\n            # Create enhanced summary with category information\n            category = operation.get('category', 'unknown')\n            subcategory = operation.get('subcategory', 'general')\n            op_type = operation.get('type', 'ADD')\n            value = operation.get('value', '')\n\n            # Generate category-aware summary\n            if op_type == 'ADD':\n                summary = f\"Added {category}.{subcategory}: {value}\"\n            elif op_type == 'UPDATE':\n                prev_value = operation.get('previous_value', 'unknown')\n                summary = f\"Updated {category}.{subcategory}: {prev_value} → {value}\"\n            elif op_type == 'CONFIRM':\n                summary = f\"Confirmed {category}.{subcategory}: {value}\"\n            else:\n                summary = f\"{op_type} {category}.{subcategory}: {value}\"\n\n            # Create comprehensive memory event\n            return MemoryEvent(\n                type=op_type,\n                summary=summary,\n                timestamp=timestamp,\n                confidence=operation.get('confidence', 0.8),\n                category=category,\n                subcategory=subcategory,\n                relationships=operation.get('relationships', []),\n                emotional_context=emotional_context,\n                session_id=operation.get('session_id'),\n                privacy_level=operation.get('privacy_level', 'normal'),\n                previous_value=operation.get('previous_value'),\n                current_value=operation.get('value'),\n                provenance={\n                    \"enhanced_in_place\": True,\n                    \"enhanced_at\": timestamp,\n                    \"source_info\": {\n                        \"source_type\": operation.get('source', 'conversation'),\n                        \"source_details\": \"chat input\",\n                        \"context\": f\"User: {value}\",\n                        \"event_index\": len(self.data.get(\"memory_events\", []))\n                    },\n                    \"source_conversation_timestamp\": timestamp\n                },\n                Added_preference=value\n            )\n\n        except Exception as e:\n            print(f\"Error creating comprehensive memory event: {e}\")\n            return None\n\n    def _process_operation_with_vector_similarity(self, operation: Dict) -> Dict:\n        \"\"\"\n        Process an operation with vector-based similarity detection to determine if it should be an ADD or UPDATE.\n        \n        Args:\n            operation: The operation to process\n            \n        Returns:\n            Processed operation with appropriate type (ADD or UPDATE) based on vector similarity\n        \"\"\"\n        # Extract the main content from the operation for similarity comparison\n        operation_content = str(operation.get('value', ''))\n        fact_type = operation.get('fact_type', '')\n        \n        if not operation_content:\n            return operation  # Return unchanged if no content to process\n        \n        # Create embedding vector for the new content\n        text_vector = self._create_embedding_vector(operation_content)\n        \n        # Compare with existing vectors in vector_index to find similar ones\n        similar_events = []\n        for event_id, existing_vector in self.vector_index.items():\n            # Find the corresponding event in memory_events to get its content\n            event_obj = None\n            for mem_event in self.data.get(\"memory_events\", []):\n                if isinstance(mem_event, dict) and mem_event.get(\"event_id\") == event_id:\n                    event_obj = mem_event\n                    break\n            \n            if event_obj:\n                # Use current_value or summary for similarity comparison\n                existing_content = str(event_obj.get('current_value', event_obj.get('summary', '')))\n                if existing_content:\n                    similarity = self._cosine_similarity(text_vector, existing_vector)\n                    \n                    # If similarity is above threshold (0.75), consider it for UPDATE\n                    if similarity >= 0.75:\n                        similar_events.append({\n                            'event_id': event_id,\n                            'event': event_obj,\n                            'similarity': similarity\n                        })\n        \n        # If we found similar events, this should be an UPDATE instead of ADD\n        if similar_events:\n            # Get the most similar event\n            most_similar = sorted(similar_events, key=lambda x: x['similarity'], reverse=True)[0]\n            similarity_score = most_similar['similarity']\n            similar_event = most_similar['event']\n            similar_event_id = most_similar['event_id']\n            \n            # Determine update type\n            previous_value = str(similar_event.get('current_value', similar_event.get('summary', '')))\n            update_type = self._determine_update_type(previous_value, operation_content)\n            \n            # Create timestamp\n            timestamp = datetime.now().isoformat()\n            event_id = f\"evt_{uuid.uuid4().hex[:8]}\"\n            \n            # Update the operation to be an UPDATE event\n            update_event = {\n                \"event_id\": event_id,\n                \"type\": \"UPDATE\",\n                \"summary\": f\"User is bored of {operation_content} now.\" if \"bored\" in operation_content.lower() else f\"Updated {fact_type}: {operation_content}\",\n                \"timestamp\": timestamp,\n                \"emotional_context\": operation.get('emotional_context', {\n                    \"sentiment\": \"neutral\",\n                    \"emotion_tags\": [],\n                    \"emotional_intensity\": 0.5,\n                    \"mood_context\": \"normal\",\n                    \"confidence\": 0.8\n                }),\n                \"semantic_context\": {\n                    \"related_facts\": [similar_event_id],\n                    \"confidence_score\": similarity_score,\n                    \"context_type\": update_type,\n                    \"semantic_tags\": [fact_type.split('.')[-1]] if '.' in fact_type else [fact_type]\n                },\n                \"importance_score\": operation.get('importance_score', 0.6),\n                \"confidence\": 0.90,  # Higher confidence for updates\n                \"category\": similar_event.get('category', fact_type.split('.')[0] if '.' in fact_type else fact_type),\n                \"subcategory\": similar_event.get('subcategory', fact_type.split('.')[1] if '.' in fact_type else 'general'),\n                \"previous_value\": previous_value,\n                \"current_value\": operation_content,\n                \"provenance\": {\n                    \"enhanced_in_place\": True,\n                    \"enhanced_at\": timestamp,\n                    \"original_summary\": f\"User: {previous_value}\",\n                    \"source_info\": {\n                        \"source_type\": operation.get('source', 'conversation'),\n                        \"source_details\": \"chat input\",\n                        \"context\": f\"User: {operation_content}\",\n                        \"event_index\": len(self.data.get(\"memory_events\", []))\n                    },\n                    \"source_conversation_timestamp\": timestamp,\n                    \"cleanup_operation\": \"stacked_prefix_removal\"\n                }\n            }\n            \n            # Add to update log for tracking preference evolution\n            self._create_update_log_entry(event_id, similar_event_id, \n                                         similarity_score, update_type)\n            \n            # Update the vector index with the new vector for this event\n            self.vector_index[event_id] = text_vector\n            \n            # Update clusters to reflect the new state\n            self._update_clusters_for_event(event_id, update_event)\n            \n            # Add to memory events\n            memory_events = self.data.get(\"memory_events\", [])\n            memory_events.append(update_event)\n            \n            return update_event\n        else:\n            # No similar events found, create a new ADD event\n            timestamp = datetime.now().isoformat()\n            event_id = f\"evt_{uuid.uuid4().hex[:8]}\"\n            \n            # Check for duplicates (cosine similarity > 0.95)\n            duplicate_events = []\n            for event_id_check, existing_vector in self.vector_index.items():\n                similarity = self._cosine_similarity(text_vector, existing_vector)\n                if similarity > 0.95:\n                    duplicate_events.append(event_id_check)\n            \n            if duplicate_events:\n                # This is a duplicate, mark as redundant and skip\n                return operation  # Return original operation unchanged\n            \n            # Create complete ADD event with all required fields from the specification\n            add_event = {\n                \"event_id\": event_id,\n                \"type\": \"ADD\",\n                \"summary\": f\"Added {fact_type}: {operation_content}\",\n                \"timestamp\": timestamp,\n                \"emotional_context\": operation.get('emotional_context', {\n                    \"sentiment\": \"neutral\",\n                    \"emotion_tags\": [],\n                    \"emotional_intensity\": 0.5,\n                    \"mood_context\": \"normal\",\n                    \"confidence\": 0.8\n                }),\n                \"semantic_context\": operation.get('semantic_context', {\n                    \"related_facts\": [],\n                    \"confidence_score\": 0.8,\n                    \"context_type\": \"new_fact\",\n                    \"semantic_tags\": [fact_type.split('.')[-1]] if '.' in fact_type else [fact_type]\n                }),\n                \"importance_score\": operation.get('importance_score', 0.6),\n                \"confidence\": operation.get('confidence', 0.85),\n                \"category\": operation.get('category', fact_type.split('.')[0] if '.' in fact_type else fact_type),\n                \"subcategory\": operation.get('subcategory', fact_type.split('.')[1] if '.' in fact_type else 'general'),\n                \"previous_value\": None,\n                \"current_value\": operation_content,\n                \"provenance\": {\n                    \"enhanced_in_place\": True,\n                    \"enhanced_at\": timestamp,\n                    \"source_info\": {\n                        \"source_type\": operation.get('source', 'conversation'),\n                        \"source_details\": \"chat input\",\n                        \"context\": f\"User: {operation_content}\",\n                        \"event_index\": len(self.data.get(\"memory_events\", []))\n                    },\n                    \"source_conversation_timestamp\": timestamp\n                },\n                \"Added_preference\": operation_content\n            }\n            \n            # Add to vector index\n            self.vector_index[event_id] = text_vector\n            \n            # Create a new cluster for this event\n            cluster_id = self._create_cluster(f\"{category}_{event_id[:8]}\", event_id)\n            \n            # Add to memory events\n            memory_events = self.data.get(\"memory_events\", [])\n            memory_events.append(add_event)\n            \n            return add_event\n\n    def create_update_event(self, previous_event_id: str, summary: str, timestamp: str, \n                           emotional_context: Dict, semantic_context: Dict, \n                           importance_score: float, confidence: float, category: str, \n                           subcategory: str, previous_value: str, current_value: str,\n                           provenance: Dict) -> Dict:\n        \"\"\"\n        Create a complete UPDATE event as specified in the documentation.\n        \n        Args:\n            previous_event_id: ID of the event being updated\n            summary: Summary of the update\n            timestamp: Timestamp of the update\n            emotional_context: Emotional context of the update\n            semantic_context: Semantic context including related facts\n            importance_score: Importance score for the update\n            confidence: Confidence score for the update\n            category: Memory category\n            subcategory: Memory subcategory\n            previous_value: Previous value before update\n            current_value: Current value after update\n            provenance: Provenance information\n            \n        Returns:\n            Complete UPDATE event structure following the specification\n        \"\"\"\n        # Generate a new event ID\n        event_id = f\"evt_{uuid.uuid4().hex[:8]}\"\n        \n        # Get the semantic context from the previous event\n        if not semantic_context.get(\"related_facts\"):\n            semantic_context[\"related_facts\"] = [previous_event_id]\n        \n        # Create the update event\n        update_event = {\n            \"event_id\": event_id,\n            \"type\": \"UPDATE\",\n            \"summary\": summary,\n            \"timestamp\": timestamp,\n            \"emotional_context\": emotional_context,\n            \"semantic_context\": semantic_context,\n            \"importance_score\": importance_score,\n            \"confidence\": confidence,\n            \"category\": category,\n            \"subcategory\": subcategory,\n            \"previous_value\": previous_value,\n            \"current_value\": current_value,\n            \"provenance\": provenance\n        }\n        \n        # Add to update log for tracking preference evolution\n        self._create_update_log_entry(event_id, previous_event_id, \n                                     semantic_context.get(\"confidence_score\", 0.85), \n                                     semantic_context.get(\"context_type\", \"refinement\"))\n        \n        # Update the vector index with the new vector for this event\n        self.vector_index[event_id] = self._create_embedding_vector(current_value)\n        \n        # Update clusters to reflect the new state\n        self._update_clusters_for_event(event_id, update_event)\n        \n        # Add to memory events\n        memory_events = self.data.get(\"memory_events\", [])\n        memory_events.append(update_event)\n        \n        return update_event\n\n    def calculate_importance_score(self, event_content: str, category: str, emotional_context: Dict = None, \n                                  access_frequency: int = 0, recency_score: float = 0.0, \n                                  emotional_weight: float = 0.0, cross_reference_count: int = 0) -> float:\n        \"\"\"\n        Calculate importance score for a memory event based on various factors.\n        \n        Args:\n            event_content: Content of the event\n            category: Category of the memory\n            emotional_context: Emotional context of the event\n            access_frequency: How often the memory is accessed\n            recency_score: How recent the memory is (0.0-1.0)\n            emotional_weight: Emotional weight of the memory (0.0-1.0)\n            cross_reference_count: How many other facts reference this fact\n            \n        Returns:\n            Importance score between 0.0 and 1.0\n        \"\"\"\n        base_score = 0.5  # Base importance\n        \n        # Category-based weighting\n        high_importance_categories = [\n            MemoryCategory.USER_IDENTITY.value, \n            MemoryCategory.PERSONAL_PREFERENCES.value,\n            MemoryCategory.USER_INSTRUCTIONS.value,\n            MemoryCategory.COMMUNICATION_BOUNDARIES.value\n        ]\n        \n        if category in high_importance_categories:\n            base_score += 0.2\n        \n        # Content-based weighting\n        important_indicators = [\n            'name', 'identity', 'important', 'critical', 'essential', 'must', 'never', \n            'always', 'always remember', 'do not forget', 'key', 'primary', 'main'\n        ]\n        \n        content_lower = event_content.lower()\n        for indicator in important_indicators:\n            if indicator in content_lower:\n                base_score += 0.1\n                break\n        \n        # Emotional context weighting\n        if emotional_context:\n            if isinstance(emotional_context, dict):\n                emotional_intensity = emotional_context.get('emotional_intensity', 0.5)\n                sentiment_value = emotional_context.get('sentiment', '')\n            else:\n                # If it's an EmotionalContext object, convert to dict format\n                emotional_intensity = getattr(emotional_context, 'emotional_intensity', 0.5)\n                sentiment_value = getattr(emotional_context, 'sentiment', '')\n            sentiment_importance = 0.1 if sentiment_value in ['positive', 'negative'] else 0.05\n            base_score += emotional_intensity * 0.1 + sentiment_importance\n        \n        # Access frequency weighting\n        access_weight = min(access_frequency * 0.05, 0.2)  # Max 0.2 for access frequency\n        base_score += access_weight\n        \n        # Recency weighting\n        recency_weight = recency_score * 0.1  # Max 0.1 for recency\n        base_score += recency_weight\n        \n        # Cross-reference weighting\n        cross_ref_weight = min(cross_reference_count * 0.05, 0.15)  # Max 0.15 for cross-references\n        base_score += cross_ref_weight\n        \n        # Emotional weight (if provided separately)\n        base_score += emotional_weight * 0.1\n        \n        # Ensure score is between 0.0 and 1.0\n        return max(0.0, min(1.0, base_score))\n\n    def classify_category_and_subcategory(self, text: str) -> Tuple[str, str]:\n        \"\"\"\n        Classify incoming text into appropriate category and subcategory.\n        \n        Args:\n            text: Input text to classify\n            \n        Returns:\n            Tuple of (category, subcategory)\n        \"\"\"\n        text_lower = text.lower()\n        \n        # Category classification\n        if any(keyword in text_lower for keyword in ['name', 'identity', 'pronoun', 'called', 'call me']):\n            return MemoryCategory.USER_IDENTITY.value, 'identity_info'\n        elif any(keyword in text_lower for keyword in ['like', 'love', 'dislike', 'hate', 'enjoy', 'prefer', 'style', 'formality']):\n            return MemoryCategory.PERSONAL_PREFERENCES.value, 'preferences'\n        elif any(keyword in text_lower for keyword in ['project', 'working on', 'building', 'task', 'deadline', 'tech stack']):\n            return MemoryCategory.TASK_PROJECT_TRACKING.value, 'projects'\n        elif any(keyword in text_lower for keyword in ['usually', 'always', 'often', 'time', 'active', 'schedule']):\n            return MemoryCategory.ACTIVITY_BEHAVIOR.value, 'behavior_patterns'\n        elif any(keyword in text_lower for keyword in ['don\\'t', 'never', 'stop', 'avoid asking', 'unless']):\n            return MemoryCategory.COMMUNICATION_BOUNDARIES.value, 'boundaries'\n        elif any(keyword in text_lower for keyword in ['currently', 'now', 'recently', 'today']):\n            return MemoryCategory.CURRENT_STATE.value, 'current_state'\n        elif any(keyword in text_lower for keyword in ['learning', 'skill', 'improve', 'develop', 'progress']):\n            return MemoryCategory.PERSONAL_DEVELOPMENT.value, 'development'\n        elif any(keyword in text_lower for keyword in ['goal', 'dream', 'aspiration', 'career', 'future']):\n            return MemoryCategory.LONG_TERM_GOALS.value, 'goals'\n        elif any(keyword in text_lower for keyword in ['friend', 'colleague', 'team', 'partner', 'coworker']):\n            return MemoryCategory.COLLABORATOR_RELATIONSHIPS.value, 'relationships'\n        elif any(keyword in text_lower for keyword in ['data', 'privacy', 'retention', 'private']):\n            return MemoryCategory.DATA_PRIVACY.value, 'privacy'\n        elif any(keyword in text_lower for keyword in ['tool', 'integration', 'api', 'permission']):\n            return MemoryCategory.TOOL_INTEGRATION.value, 'tools'\n        elif any(keyword in text_lower for keyword in ['response', 'tone', 'style', 'adaptation']):\n            return MemoryCategory.RESPONSE_ADAPTATION.value, 'adaptation'\n        elif any(keyword in text_lower for keyword in ['file', 'media', 'upload', 'link']):\n            return MemoryCategory.FILE_MEDIA.value, 'media'\n        elif any(keyword in text_lower for keyword in ['knowledge', 'expertise', 'skill', 'competency']):\n            return MemoryCategory.KNOWLEDGE_EXPERTISE.value, 'expertise'\n        elif any(keyword in text_lower for keyword in ['multi', 'role', 'profile', 'identity']):\n            return MemoryCategory.MULTI_IDENTITY.value, 'identity'\n        elif any(keyword in text_lower for keyword in ['multimodal', 'image', 'audio', 'visual']):\n            return MemoryCategory.MULTIMODAL_PREFERENCES.value, 'multimodal'\n        elif any(keyword in text_lower for keyword in ['system', 'error', 'feedback', 'constraint']):\n            return MemoryCategory.SYSTEM_AWARENESS.value, 'system'\n        elif any(keyword in text_lower for keyword in ['theme', 'emotional arc', 'continuity']):\n            return MemoryCategory.SESSION_THEMES.value, 'themes'\n        elif any(keyword in text_lower for keyword in ['meta', 'browser', 'ui', 'change log']):\n            return MemoryCategory.META_MEMORY.value, 'meta'\n        elif any(keyword in text_lower for keyword in ['temporal', 'pattern', 'behavior']):\n            return MemoryCategory.TEMPORAL_PATTERNS.value, 'patterns'\n        elif any(keyword in text_lower for keyword in ['search', 'external', 'internet', 'query']):\n            return MemoryCategory.SEARCH_EXTERNAL_INFO.value, 'search'\n        elif any(keyword in text_lower for keyword in ['greeting', 'hello', 'hi', 'welcome']):\n            return MemoryCategory.GREETING_PATTERNS.value, 'greetings'\n        elif any(keyword in text_lower for keyword in ['conversation', 'duration', 'session', 'analytics']):\n            return MemoryCategory.CONVERSATION_ANALYTICS.value, 'analytics'\n        elif any(keyword in text_lower for keyword in ['news', 'weather', 'current events']):\n            return MemoryCategory.NEWS_WEATHER_HISTORY.value, 'news_weather'\n        elif any(keyword in text_lower for keyword in ['timezone', 'location', 'time']):\n            return MemoryCategory.TIMEZONE_PREFERENCES.value, 'timezone'\n        else:\n            return MemoryCategory.USER_IDENTITY.value, 'general'  # Default category\n\n    def _create_update_log_entry(self, source_event_id: str, replaced_event_id: str, \n                                similarity_score: float, update_type: str):\n        \"\"\"\n        Create an entry in the update log for tracking how preferences evolve.\n        \n        Args:\n            source_event_id: ID of the new UPDATE event\n            replaced_event_id: ID of the previous event being updated\n            similarity_score: Cosine similarity between the two events\n            update_type: Type of update (refinement, reversal, reinforcement, habit_change)\n        \"\"\"\n        if not hasattr(self, 'update_log'):\n            self.update_log = []\n            \n        update_id = f\"upd_{uuid.uuid4().hex[:8]}\"\n        update_entry = {\n            \"update_id\": update_id,\n            \"source_event\": source_event_id,\n            \"replaced_event\": replaced_event_id,\n            \"timestamp\": datetime.now().isoformat(),\n            \"similarity_score\": similarity_score,\n            \"update_type\": update_type  # Only include required fields as per specification\n        }\n        \n        self.update_log.append(update_entry)\n        \n        # Add to memory events as well for tracking\n        update_event = {\n            \"type\": \"UPDATE_LOG\",\n            \"summary\": f\"Update log entry: {update_type} from {replaced_event_id} to {source_event_id}\",\n            \"timestamp\": datetime.now().isoformat(),\n            \"update_entry\": update_entry\n        }\n        \n        self.data[\"memory_events\"].append(update_event)\n\n    def _update_clusters_for_event(self, event_id: str, event_data: Dict):\n        \"\"\"\n        Update clusters to reflect a new event, either by adding to existing cluster or creating new one.\n        \n        Args:\n            event_id: The ID of the event to add to clusters\n            event_data: The complete event data\n        \"\"\"\n        if not hasattr(self, 'vector_index') or event_id not in self.vector_index:\n            return\n            \n        if not hasattr(self, 'clusters'):\n            self.clusters = {}\n            \n        event_vector = self.vector_index[event_id]\n        event_content = str(event_data.get('current_value', event_data.get('summary', '')))\n        event_category = event_data.get('category', 'general')\n        \n        # Find the most similar existing cluster\n        best_cluster_id = None\n        best_similarity = -1\n        \n        for cluster_id, cluster in self.clusters.items():\n            if 'centroid_vector' in cluster:\n                similarity = self._cosine_similarity(event_vector, cluster['centroid_vector'])\n                if similarity > best_similarity and similarity >= 0.7:  # Threshold for clustering\n                    best_similarity = similarity\n                    best_cluster_id = cluster_id\n        \n        # If we found a similar cluster, add to it\n        if best_cluster_id:\n            self._add_event_to_cluster(best_cluster_id, event_id)\n        else:\n            # Create a new cluster for this event\n            topic_label = f\"{event_category}_{event_id[:8]}\"\n            cluster_id = self._create_cluster(topic_label, event_id)\n            \n            # Add semantic context to the cluster\n            cluster = self.clusters[cluster_id]\n            cluster[\"semantic_context\"] = {\n                \"primary_topic\": event_category,\n                \"related_concepts\": [event_data.get('subcategory', 'general')],\n                \"confidence_score\": event_data.get('confidence', 0.8),\n                \"context_type\": event_data.get('semantic_context', {}).get('context_type', 'new_fact')\n            }\n\n    def _determine_update_type(self, old_value: str, new_value: str) -> str:\n        \"\"\"\n        Determine the type of update based on semantic analysis of old and new values.\n        \n        Args:\n            old_value: The previous value\n            new_value: The new value\n            \n        Returns:\n            String representing the update type\n        \"\"\"\n        old_lower = old_value.lower()\n        new_lower = new_value.lower()\n        \n        # Check for reversal (opposite meaning or sentiment)\n        reversal_indicators = [\n            ('love', 'hate'), ('like', 'dislike'), ('enjoy', 'hate'),\n            ('prefer', 'avoid'), ('want', 'avoid'), ('need', 'avoid'),\n            ('always', 'never'), ('often', 'rarely')\n        ]\n        \n        for positive, negative in reversal_indicators:\n            if (positive in old_lower and negative in new_lower) or \\\n               (negative in old_lower and positive in new_lower):\n                return \"reversal\"\n        \n        # Check for reinforcement (same meaning but stronger tone)\n        reinforcement_indicators = [\n            (['like'], ['love', 'adore', 'really like']),\n            (['enjoy'], ['love', 'adore', 'really enjoy']),\n            (['sometimes'], ['always', 'often', 'regularly'])\n        ]\n        \n        for weaker_terms, stronger_terms in reinforcement_indicators:\n            if any(term in old_lower for term in weaker_terms) and \\\n               any(term in new_lower for term in stronger_terms):\n                return \"reinforcement\"\n        \n        # Check for habit_change (change in behavior or repeated context)\n        habit_indicators = [\n            'usually', 'always', 'never', 'often', 'rarely', 'every', 'daily', 'weekly'\n        ]\n        \n        if any(term in old_lower for term in habit_indicators) or \\\n           any(term in new_lower for term in habit_indicators):\n            return \"habit_change\"\n        \n        # Default to refinement (gradual or detailed evolution)\n        return \"refinement\"\n\n\n\n\n\n\nclass AdvancedMemoryAgent:\n    \"\"\"\n    Nova Memory AI Agent - Interface wrapper for compatibility\n\n    This agent works as a dedicated memory companion to Nova:\n    - Stores facts automatically in the background\n    - Retrieves information when Nova needs it\n    - Maintains conversation logs for context\n    \"\"\"\n\n    def __init__(self, storage_file: str = \"astra_ai/Date/nova_ai_memory.json\"):\n        self.memory_system = NovaMemoryAI(storage_file)\n        # Silently initialized Nova Memory AI Agent\n\n    def process_conversation(self, user_message: str, ai_response: str) -> Dict[str, Any]:\n        \"\"\"Process conversation with Mem0-style memory analysis\"\"\"\n        return self.memory_system.process_conversation(user_message, ai_response)\n\n    def get_memory_context(self, query: str = \"\") -> Dict[str, Any]:\n        \"\"\"Get memory context for AI response generation\"\"\"\n        return self.memory_system.get_memory_context(query)\n\n    def get_user_profile(self) -> Dict[str, Any]:\n        \"\"\"\n        Get user profile without relying on current_facts.\n        \"\"\"\n        return {\n            'user_info': self.memory_system.data.get(\"user\", {}),\n            'facts': {}  # Return empty dict since we're removing current_facts\n        }\n\n    def get_memory_stats(self) -> Dict[str, Any]:\n        \"\"\"Get memory statistics\"\"\"\n        return self.memory_system.get_memory_stats()\n\n    def get_session_info(self) -> Dict[str, Any]:\n        \"\"\"Get conversation session information for intelligent greetings\"\"\"\n        return self.memory_system.get_session_info()\n\n    def end_session(self):\n        \"\"\"End the current conversation session\"\"\"\n        self.memory_system.end_session()\n\n    def get_conversation_context(self) -> Dict[str, Any]:\n        \"\"\"Get context about previous conversations\"\"\"\n        session_info = self.get_session_info()\n\n        context = {\n            \"is_returning_user\": not session_info[\"is_first_time\"],\n            \"total_sessions\": session_info[\"total_sessions\"],\n            \"user_name\": session_info.get(\"user_name\"),\n            \"greeting_message\": self._generate_greeting_message(session_info)\n        }\n\n        if not session_info[\"is_first_time\"] and session_info.get(\"last_session\"):\n            context.update({\n                \"last_conversation_time\": session_info.get(\"time_since_last\"),\n                \"last_topics\": session_info.get(\"last_topics\", []),\n                \"last_duration\": session_info.get(\"last_duration\"),\n                \"can_reference_previous\": True\n            })\n        else:\n            context[\"can_reference_previous\"] = False\n\n        return context\n\n    def _generate_greeting_message(self, session_info: Dict[str, Any]) -> str:\n        \"\"\"Generate appropriate greeting message based on session history\"\"\"\n        if session_info[\"is_first_time\"]:\n            return \"Hi there! I'm Nova, your AI memory companion. What's your name?\"\n\n        user_name = session_info.get(\"user_name\", \"there\")\n        time_since = session_info.get(\"time_since_last\", \"a while\")\n        last_topics = session_info.get(\"last_topics\", [])\n\n        # Base welcome back message\n        greeting = f\"Welcome back, {user_name}!\"\n\n        # Add time reference\n        if time_since:\n            greeting += f\" We last talked {time_since} ago\"\n\n            # Add topic reference if available\n            if last_topics:\n                if len(last_topics) == 1:\n                    greeting += f\" about {last_topics[0]}\"\n                elif len(last_topics) == 2:\n                    greeting += f\" about {last_topics[0]} and {last_topics[1]}\"\n                else:\n                    greeting += f\" about {', '.join(last_topics[:-1])}, and {last_topics[-1]}\"\n\n            greeting += \".\"\n\n        return greeting\n\n    def get_conversation_state(self) -> Dict[str, Any]:\n        \"\"\"Get conversation state for AI response filtering\"\"\"\n        return self.memory_system.get_conversation_state()\n\n    def should_avoid_introductions(self) -> bool:\n        \"\"\"Check if AI should avoid introduction-style responses\"\"\"\n        state = self.get_conversation_state()\n        return (state.get(\"is_established_user\", False) or\n                not state.get(\"is_introduction_phase\", True) or\n                state.get(\"relationship_established\", False))\n\n    def get_ai_context_instructions(self) -> str:\n        \"\"\"Get context instructions for AI to avoid inappropriate greeting patterns\"\"\"\n        state = self.get_conversation_state()\n\n        if state.get(\"is_established_user\", False):\n            instructions = [\n                \"You are continuing an ongoing conversation with an established user.\",\n                f\"User's name is {state.get('user_name', 'the user')}.\",\n                \"Do NOT ask introductory questions or act like you're meeting for the first time.\",\n                \"Continue the conversation naturally based on your existing knowledge of the user.\"\n            ]\n\n            context_hints = state.get(\"conversation_context\", {})\n            if context_hints.get(\"user_occupation\"):\n                instructions.append(f\"You know they work as {context_hints['user_occupation']}.\")\n            if context_hints.get(\"user_interests\"):\n                instructions.append(f\"You know their interests include {context_hints['user_interests']}.\")\n            if context_hints.get(\"recent_topics\"):\n                instructions.append(f\"Recent conversation topics: {', '.join(context_hints['recent_topics'])}.\")\n\n            instructions.append(\"Respond naturally without re-establishing rapport or asking basic questions.\")\n\n            return \" \".join(instructions)\n\n        elif state.get(\"greeting_completed\", False):\n            return (\"You have already greeted the user in this session. \"\n                   \"Continue the conversation naturally without additional greetings or introductions.\")\n\n        else:\n            return (\"This appears to be a new user. You may ask introductory questions \"\n                   \"to get to know them better.\")\n\n    def mark_greeting_completed(self):\n        \"\"\"Mark greeting as completed\"\"\"\n        self.memory_system.mark_greeting_completed()\n\n    def recall_history(self, query: str) -> Dict[str, Any]:\n        \"\"\"Recall historical information based on natural language queries\"\"\"\n        return self.memory_system.recall_historical_information(query)\n\n    def get_conversation_history(self) -> List[Dict[str, Any]]:\n        \"\"\"Get conversation history for historical queries\"\"\"\n        return self.memory_system.data.get('conversation', [])\n\n    def get_dynamic_conversation_context(self) -> Dict[str, Any]:\n        \"\"\"Get comprehensive dynamic context for response generation\"\"\"\n        return self.memory_system.get_dynamic_conversation_context()\n\n    def get_timeline(self) -> List[Dict]:\n        \"\"\"Get chronological timeline of all changes\"\"\"\n        return self.memory_system._get_timeline()\n\n    def get_fact_history(self, fact_type: str) -> List[Dict]:\n        \"\"\"Get complete history for a specific fact type\"\"\"\n        return self.memory_system._get_historical_values(fact_type, 'all')\n\n    def get_semantic_insights(self) -> Dict[str, Any]:\n        \"\"\"Get semantic insights about user's information\"\"\"\n        return self.memory_system.get_semantic_insights()\n\n    def get_emotional_timeline(self) -> List[Dict[str, Any]]:\n        \"\"\"Get emotional timeline of memories\"\"\"\n        return self.memory_system.get_emotional_timeline()\n\n    def detect_memory_patterns(self) -> List[Dict[str, Any]]:\n        \"\"\"Get detected memory patterns\"\"\"\n        return [asdict(pattern) for pattern in self.memory_system.patterns]\n\n    def get_relationship_graph(self) -> Dict[str, Any]:\n        \"\"\"Get memory relationship graph\"\"\"\n        return self.memory_system.memory_graph\n\n    def get_importance_scores(self) -> Dict[str, Any]:\n        \"\"\"Get fact importance scores\"\"\"\n        return self.memory_system.importance_scores\n\n    def consolidate_memories(self, timeframe_days: int = 30) -> Dict[str, Any]:\n        \"\"\"Consolidate memories within timeframe\"\"\"\n        cutoff_date = datetime.now() - timedelta(days=timeframe_days)\n\n        # Simple consolidation - merge similar facts\n        consolidated = 0\n        for fact_type, history in self.memory_system.data.get(\"fact_history\", {}).items():\n            similar_entries = []\n            for entry in history:\n                entry_date = datetime.fromisoformat(entry[\"timestamp\"])\n                if entry_date > cutoff_date:\n                    similar_entries.append(entry)\n\n            # If multiple similar entries, keep the most recent\n            if len(similar_entries) > 1:\n                most_recent = max(similar_entries, key=lambda x: x[\"timestamp\"])\n                # Mark others as consolidated\n                for entry in similar_entries:\n                    if entry != most_recent:\n                        entry[\"status\"] = \"consolidated\"\n                        consolidated += 1\n\n        return {\n            'consolidated_count': consolidated,\n            'timeframe_days': timeframe_days,\n            'status': 'completed'\n        }\n\n    def suggest_memory_queries(self, context: str = \"\") -> List[str]:\n        \"\"\"Suggest relevant memory queries based on context\"\"\"\n        suggestions = []\n        # Use fact_history instead of current_facts\n        facts = {}\n        fact_history = self.memory_system.data.get(\"fact_history\", {})\n        # Extract some basic facts from fact_history if possible\n        for key, history in fact_history.items():\n            if isinstance(history, list) and len(history) > 0:\n                # Get the most recent entry\n                latest_entry = history[-1]\n                if isinstance(latest_entry, dict):\n                    # Try to extract value from the latest entry\n                    value = latest_entry.get(\"value\", \"\")\n                    if value:\n                        # Add to facts dict for suggestion generation\n                        facts[key] = value\n\n        # Suggest based on existing facts\n        if 'occupation' in facts:\n            suggestions.extend([\n                \"What was my previous job?\",\n                \"How has my career evolved?\",\n                \"What skills have I developed?\"\n            ])\n\n        if 'interests' in facts:\n            suggestions.extend([\n                \"What are my old interests?\",\n                \"How have my interests changed?\",\n                \"What new hobbies have I picked up?\"\n            ]\n\n        # Context-specific suggestions\n        if context.lower() in ['work', 'career', 'job']:\n            suggestions.extend([\n                \"What was my career progression?\",\n                \"What technologies have I learned?\",\n                \"What companies have I worked for?\"\n            ])\n\n        return suggestions[:5]  # Return top 5 suggestions\n\n    def analyze_memory_health(self) -> Dict[str, Any]:\n        \"\"\"Analyze the health and quality of memory system\"\"\"\n        # Use fact_history instead of current_facts\n        facts = {}\n        history = self.memory_system.data.get(\"fact_history\", {})\n        events = self.memory_system.data.get(\"memory_events\", [])\n        \n        # Derive facts from fact_history\n        for key, history_list in history.items():\n            if isinstance(history_list, list) and len(history_list) > 0:\n                # Get the most recent entry\n                latest_entry = history_list[-1]\n                if isinstance(latest_entry, dict):\n                    # Try to extract value from the latest entry\n                    value = latest_entry.get(\"value\", \"\")\n                    if value:\n                        # Add to facts dict for health analysis\n                        facts[key] = value\n\n        # Calculate metrics\n        total_facts = len(facts)\n        facts_with_history = len([f for f in history.values() if len(f) > 1])\n        recent_activity = len([e for e in events[-10:] if e])  # Last 10 events\n\n        # Relationship density\n        relationship_count = len(self.memory_system.memory_graph)\n        relationship_density = relationship_count / max(total_facts, 1)\n\n        # Emotional richness\n        emotional_events = len([e for e in events if isinstance(e, dict) and 'emotional_context' in e])\n        emotional_richness = emotional_events / max(len(events), 1)\n\n        health_score = (\n            (total_facts / 10.0) * 0.3 +  # Fact quantity\n            (facts_with_history / max(total_facts, 1)) * 0.2 +  # Historical depth\n            (recent_activity / 10.0) * 0.2 +  # Recent activity\n            relationship_density * 0.15 +  # Relationship richness\n            emotional_richness * 0.15  # Emotional context\n        )\n\n        return {\n            'health_score': min(health_score, 1.0),\n            'total_facts': total_facts,\n            'facts_with_history': facts_with_history,\n            'recent_activity': recent_activity,\n            'relationship_count': relationship_count,\n            'emotional_events': emotional_events,\n            'recommendations': self._get_health_recommendations(health_score)\n        }\n\n    def _get_health_recommendations(self, health_score: float) -> List[str]:\n        \"\"\"Get recommendations for improving memory health\"\"\"\n        recommendations = []\n\n        if health_score < 0.3:\n            recommendations.extend([\n                \"Add more personal information to build a richer profile\",\n                \"Share more about your interests and hobbies\",\n                \"Discuss your professional background and goals\"\n            ])\n        elif health_score < 0.6:\n            recommendations.extend([\n                \"Update existing information to keep it current\",\n                \"Share emotional context about your experiences\",\n                \"Discuss relationships between your interests and work\"\n            ])\n        else:\n            recommendations.extend([\n                \"Your memory system is healthy!\",\n                \"Continue sharing updates about your life\",\n                \"Explore advanced features like pattern analysis\"\n            ])\n\n        return recommendations\n\n    def get_accumulated_preferences(self, preference_type: str = None) -> Dict[str, Any]:\n        \"\"\"Get accumulated preferences with timestamps\"\"\"\n        return self.memory_system.get_accumulated_preferences(preference_type)\n\n    def start_organizer_monitoring(self):\n        \"\"\"Start the organizer monitoring in a separate thread (for continuous file monitoring)\"\"\"\n        if self.memory_system.organizer and self.memory_system.organizer.organizer_enabled:\n            import threading\n            organizer_thread = threading.Thread(\n                target=self.memory_system.organizer.start_monitoring, \n                daemon=True\n            )\n            organizer_thread.start()\n            return organizer_thread\n        return None\n\n    def transform_fact_history_to_unified_format(self):\n        \"\"\"Transform fact_history to unified format with all personal preferences consolidated.\"\"\"\n        return self.memory_system.transform_fact_history_to_unified_format()\n\n\n# Factory function for backward compatibility\ndef create_memory_agent(storage_file: str = \"astra_ai/Date/nova_ai_memory.json\") -> AdvancedMemoryAgent:\n    \"\"\"Factory function to create a memory agent with default configuration\"\"\"\n    return AdvancedMemoryAgent(storage_file)\n"}