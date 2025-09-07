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
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any, Union, Set, Tuple
from dataclasses import dataclass, asdict, field
from enum import Enum
from collections import defaultdict, Counter
import hashlib

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
class MemoryItem:
    """Enhanced memory item with comprehensive metadata"""
    category: str
    subcategory: str
    key: str
    value: Any
    confidence: float
    timestamp: str
    last_accessed: str
    access_count: int = 0
    source: str = "conversation"
    relationships: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    expiry_date: Optional[str] = None
    privacy_level: str = "normal"  # normal, sensitive, private
    validation_status: str = "unverified"  # unverified, confirmed, disputed
    emotional_context: Optional[str] = None
    session_id: Optional[str] = None

@dataclass
class CategorySchema:
    """Schema definition for each memory category"""
    name: str
    description: str
    subcategories: List[str]
    detection_patterns: List[str]
    relationships: List[str]
    retention_policy: str  # permanent, session, temporary, user_controlled
    privacy_default: str   # normal, sensitive, private
    auto_expire: Optional[int] = None  # days until auto-expiry

class ComprehensiveCategoryDetector:
    """
    Advanced 22-category detection engine that automatically identifies and categorizes
    information across all aspects of user interaction and behavior.
    """

    def __init__(self):
        self.category_schemas = self._initialize_category_schemas()
        self.detection_patterns = self._initialize_detection_patterns()
        self.relationship_map = self._initialize_relationships()
        self.temporal_trackers = {}  # Track time-based patterns
        self.confidence_thresholds = self._initialize_confidence_thresholds()

    def _initialize_category_schemas(self) -> Dict[str, CategorySchema]:
        """Initialize comprehensive schemas for all 22 categories"""
        return {
            MemoryCategory.USER_IDENTITY.value: CategorySchema(
                name="User Identity & Profile",
                description="Names, pronouns, identity evolution, personal identifiers",
                subcategories=["name", "pronouns", "nicknames", "identity_changes", "personal_identifiers"],
                detection_patterns=[
                    r"my name is (.+)", r"call me (.+)", r"i'm (.+)", r"i go by (.+)",
                    r"my pronouns are (.+)", r"use (.+) pronouns", r"i identify as (.+)"
                ],
                relationships=["personal_preferences", "communication_boundaries"],
                retention_policy="permanent",
                privacy_default="normal"
            ),

            MemoryCategory.PERSONAL_PREFERENCES.value: CategorySchema(
                name="Personal Preferences & Communication Style",
                description="Response length, formality, explanation rules, interaction preferences",
                subcategories=["response_style", "formality", "explanation_rules", "communication_tone", "interaction_preferences"],
                detection_patterns=[
                    r"keep it (.+)", r"i prefer (.+)", r"don't (.+)", r"always (.+)", r"never (.+)",
                    r"i like when (.+)", r"i hate when (.+)", r"make sure to (.+)"
                ],
                relationships=["communication_boundaries", "response_adaptation"],
                retention_policy="permanent",
                privacy_default="normal"
            ),

            MemoryCategory.TASK_PROJECT_TRACKING.value: CategorySchema(
                name="Task & Project Tracking",
                description="Active projects, tech stacks, deadlines, work context",
                subcategories=["active_projects", "tech_stack", "deadlines", "work_context", "project_status"],
                detection_patterns=[
                    r"working on (.+)", r"my project (.+)", r"using (.+) for", r"deadline (.+)",
                    r"building (.+)", r"developing (.+)", r"tech stack (.+)"
                ],
                relationships=["knowledge_expertise", "tool_integration", "long_term_goals"],
                retention_policy="user_controlled",
                privacy_default="normal"
            ),

            MemoryCategory.ACTIVITY_BEHAVIOR.value: CategorySchema(
                name="Activity & Behavior Patterns",
                description="Active times, conversation topics, engagement style, usage patterns",
                subcategories=["active_times", "conversation_topics", "engagement_style", "usage_patterns", "interaction_frequency", "time_pattern", "learning_style", "conditional_behavior"],
                detection_patterns=[
                    r"usually (.+) at (.+)", r"i'm most active (.+)", r"i typically (.+)",
                    r"my schedule (.+)", r"i work (.+) hours", r"most productive (.+)",
                    r"prefer (.+) learning", r"work best (.+)", r"better in the (.+)",
                    r"i like (.+) learning", r"hands-on (.+)", r"visual (.+)"
                ],
                relationships=["temporal_patterns", "personal_preferences"],
                retention_policy="permanent",
                privacy_default="normal"
            ),

            MemoryCategory.USER_INSTRUCTIONS.value: CategorySchema(
                name="User Instruction Memory",
                description="Permanent commands, rules, triggers, behavioral instructions",
                subcategories=["permanent_commands", "behavioral_rules", "triggers", "automation_rules", "custom_instructions", "reminders"],
                detection_patterns=[
                    r"always remember to (.+)", r"never (.+)", r"when i say (.+) do (.+)",
                    r"if (.+) then (.+)", r"remember that (.+)", r"make sure (.+)",
                    r"always ask (.+)", r"always (.+) when (.+)", r"remind me to (.+)",
                    r"don't forget to (.+)", r"every time (.+)"
                ],
                relationships=["personal_preferences", "response_adaptation"],
                retention_policy="permanent",
                privacy_default="normal"
            ),

            MemoryCategory.CURRENT_STATE.value: CategorySchema(
                name="Current State/Context Memory",
                description="Active topics, mood, recent questions, current focus",
                subcategories=["active_topics", "current_mood", "recent_questions", "current_focus", "session_context"],
                detection_patterns=[
                    r"currently (.+)", r"right now (.+)", r"at the moment (.+)",
                    r"i'm feeling (.+)", r"my mood is (.+)", r"focusing on (.+)"
                ],
                relationships=["session_themes", "personal_development"],
                retention_policy="session",
                privacy_default="normal"
            ),

            MemoryCategory.PERSONAL_DEVELOPMENT.value: CategorySchema(
                name="Personal Development Memory",
                description="Skills learning, progress logs, emotional notes, growth tracking",
                subcategories=["skills_learning", "progress_logs", "emotional_notes", "growth_tracking", "learning_goals"],
                detection_patterns=[
                    r"learning (.+)", r"studying (.+)", r"improving (.+)", r"getting better at (.+)",
                    r"my progress (.+)", r"struggling with (.+)", r"mastered (.+)"
                ],
                relationships=["knowledge_expertise", "long_term_goals"],
                retention_policy="permanent",
                privacy_default="normal"
            ),

            MemoryCategory.COMMUNICATION_BOUNDARIES.value: CategorySchema(
                name="Communication Boundaries & Emotional Safety",
                description="Sensitive topics, triggers, support level, emotional boundaries",
                subcategories=["sensitive_topics", "triggers", "support_level", "emotional_boundaries", "safety_preferences", "private_topics", "acceptable_topics"],
                detection_patterns=[
                    r"don't talk about (.+)", r"sensitive about (.+)", r"triggers me (.+)",
                    r"uncomfortable with (.+)", r"avoid (.+)", r"careful about (.+)",
                    r"don't ask about (.+)", r"that's private", r"(.+) is private",
                    r"you can ask about (.+)", r"(.+) is okay to discuss"
                ],
                relationships=["personal_preferences", "user_identity"],
                retention_policy="permanent",
                privacy_default="sensitive"
            ),

            MemoryCategory.CONTEXTUAL_RULES.value: CategorySchema(
                name="Contextual Memory Rules",
                description="Scope, expiry, recall priority, context-specific behaviors",
                subcategories=["scope_rules", "expiry_rules", "recall_priority", "context_behaviors", "memory_management", "mode_rules", "context_switching"],
                detection_patterns=[
                    r"only remember (.+) for (.+)", r"forget (.+) after (.+)", r"priority (.+)",
                    r"important to remember (.+)", r"temporary (.+)", r"permanent (.+)",
                    r"when (.+) mode (.+)", r"in (.+) context (.+)", r"be (.+) when (.+)",
                    r"when i'm in (.+)", r"in (.+) mode (.+)"
                ],
                relationships=["meta_memory", "data_privacy"],
                retention_policy="permanent",
                privacy_default="normal"
            ),

            MemoryCategory.MULTI_IDENTITY.value: CategorySchema(
                name="Multi-Identity/Role Management",
                description="Role profiles, switching triggers, context-based personas",
                subcategories=["role_profiles", "switching_triggers", "personas", "context_roles", "identity_management"],
                detection_patterns=[
                    r"when i'm (.+) mode", r"as a (.+)", r"in my (.+) role", r"switch to (.+)",
                    r"professional (.+)", r"personal (.+)", r"work (.+)", r"casual (.+)"
                ],
                relationships=["user_identity", "personal_preferences"],
                retention_policy="permanent",
                privacy_default="normal"
            ),

            MemoryCategory.KNOWLEDGE_EXPERTISE.value: CategorySchema(
                name="Knowledge Snapshots & Expertise Mapping",
                description="Skill levels, known concepts, expertise areas, knowledge gaps",
                subcategories=["skill_levels", "known_concepts", "expertise_areas", "knowledge_gaps", "competency_tracking"],
                detection_patterns=[
                    r"i know (.+)", r"expert in (.+)", r"familiar with (.+)", r"don't know (.+)",
                    r"beginner at (.+)", r"advanced in (.+)", r"experienced with (.+)"
                ],
                relationships=["personal_development", "task_project_tracking"],
                retention_policy="permanent",
                privacy_default="normal"
            ),

            MemoryCategory.TOOL_INTEGRATION.value: CategorySchema(
                name="Tool Usage & AI Integration Behavior",
                description="Permissions, preferred languages, tool preferences, integration settings",
                subcategories=["permissions", "preferred_languages", "tool_preferences", "integration_settings", "usage_patterns", "preferred_tools", "integrations"],
                detection_patterns=[
                    r"use (.+) language", r"prefer (.+) tool", r"don't use (.+)", r"always use (.+)",
                    r"permission to (.+)", r"allowed to (.+)", r"restricted from (.+)",
                    r"i use (.+)", r"(.+) with (.+)", r"switched to (.+)",
                    r"(.+) themes", r"(.+) plugins", r"(.+) copilot"
                ],
                relationships=["task_project_tracking", "personal_preferences"],
                retention_policy="permanent",
                privacy_default="normal"
            ),

            # Add remaining categories (continuing the comprehensive framework)
            MemoryCategory.RESPONSE_ADAPTATION.value: CategorySchema(
                name="Response Adaptation Logic",
                description="Style corrections, tone adaptation, response optimization",
                subcategories=["style_corrections", "tone_adaptation", "response_optimization", "feedback_integration", "adaptation_rules"],
                detection_patterns=[
                    r"too (.+)", r"more (.+)", r"less (.+)", r"better if (.+)",
                    r"adjust (.+)", r"change (.+)", r"improve (.+)"
                ],
                relationships=["personal_preferences", "communication_boundaries"],
                retention_policy="permanent",
                privacy_default="normal"
            ),

            MemoryCategory.LONG_TERM_GOALS.value: CategorySchema(
                name="Long-term Goals & Motivation Memory",
                description="Life goals, career objectives, blockers, aspirations",
                subcategories=["life_goals", "career_objectives", "blockers", "aspirations", "motivation_tracking"],
                detection_patterns=[
                    r"my goal is (.+)", r"want to achieve (.+)", r"working towards (.+)",
                    r"dream of (.+)", r"aspire to (.+)", r"blocked by (.+)"
                ],
                relationships=["personal_development", "task_project_tracking"],
                retention_policy="permanent",
                privacy_default="normal"
            ),

            MemoryCategory.COLLABORATOR_RELATIONSHIPS.value: CategorySchema(
                name="Collaborator & Relationship Memory",
                description="Team members, communication styles, relationship dynamics",
                subcategories=["team_members", "communication_styles", "relationship_dynamics", "collaboration_preferences", "social_context"],
                detection_patterns=[
                    r"my (.+) is (.+)", r"work with (.+)", r"team member (.+)",
                    r"colleague (.+)", r"manager (.+)", r"reports to (.+)"
                ],
                relationships=["communication_boundaries", "personal_preferences"],
                retention_policy="permanent",
                privacy_default="sensitive"
            ),

            MemoryCategory.DATA_PRIVACY.value: CategorySchema(
                name="Data Privacy & Memory Boundaries",
                description="Retention policies, private sessions, data sensitivity",
                subcategories=["retention_policies", "private_sessions", "data_sensitivity", "privacy_controls", "access_restrictions"],
                detection_patterns=[
                    r"private (.+)", r"confidential (.+)", r"don't store (.+)",
                    r"delete (.+)", r"temporary (.+)", r"sensitive (.+)"
                ],
                relationships=["contextual_rules", "meta_memory"],
                retention_policy="permanent",
                privacy_default="private"
            ),



            MemoryCategory.META_MEMORY.value: CategorySchema(
                name="Meta-Memory Tools for User Control",
                description="Browser UI, change logs, cleanup, memory management",
                subcategories=["browser_ui", "change_logs", "cleanup", "memory_management", "user_control", "memory_queries", "memory_management"],
                detection_patterns=[
                    r"show me (.+)", r"browse (.+)", r"delete (.+)", r"clean up (.+)",
                    r"manage (.+)", r"control (.+)", r"history of (.+)",
                    r"what do you remember (.+)", r"clear (.+)", r"forget (.+)"
                ],
                relationships=["data_privacy", "contextual_rules"],
                retention_policy="permanent",
                privacy_default="normal"
            ),

            MemoryCategory.FILE_MEDIA.value: CategorySchema(
                name="File & Media Memory",
                description="Uploads, context links, preferences, media handling",
                subcategories=["uploaded_files", "media_context", "file_preferences", "document_history"],
                detection_patterns=[
                    r"uploaded (.+)", r"shared (.+) file", r"attached (.+)",
                    r"diagram (.+)", r"document (.+)", r"image (.+)", r"video (.+)"
                ],
                relationships=["task_project_tracking", "knowledge_expertise"],
                retention_policy="user_controlled",
                privacy_default="normal"
            ),

            MemoryCategory.MULTIMODAL_PREFERENCES.value: CategorySchema(
                name="Multimodal & Sensorial Preferences",
                description="Image styles, audio modes, visual preferences, interaction modalities",
                subcategories=["visual_preferences", "interaction_modes", "media_preferences", "accessibility"],
                detection_patterns=[
                    r"prefer (.+) diagrams", r"like (.+) explanations", r"visual (.+)",
                    r"(.+) highlighting", r"(.+) examples", r"show (.+) format"
                ],
                relationships=["personal_preferences", "tool_integration"],
                retention_policy="permanent",
                privacy_default="normal"
            ),

            MemoryCategory.SYSTEM_AWARENESS.value: CategorySchema(
                name="System Self-Awareness & Debugging Memory",
                description="AI system feedback, performance notes, user awareness of AI capabilities and limitations",
                subcategories=["system_feedback", "performance_notes", "error_tracking", "improvement_suggestions", "ai_capabilities", "ai_limitations"],
                detection_patterns=[
                    r"you (.+) repeat", r"system (.+)", r"responses (.+)", r"ai (.+)", r"you're an ai",
                    r"getting better (.+)", r"improving (.+)", r"sometimes (.+)", r"you can't (.+)",
                    r"i know you're (.+)", r"you don't (.+)", r"your limitations (.+)", r"you understand (.+)",
                    r"as an ai (.+)", r"being an ai (.+)", r"ai system (.+)", r"artificial intelligence (.+)",
                    r"you're not (.+)", r"you can (.+)", r"you're good at (.+)", r"you struggle with (.+)"
                ],
                relationships=["meta_memory", "response_adaptation"],
                retention_policy="permanent",
                privacy_default="normal"
            ),

            MemoryCategory.SESSION_THEMES.value: CategorySchema(
                name="Session Themes & Contextual Threads",
                description="Current session themes, topic transitions, conversation flow, and contextual continuity",
                subcategories=["current_themes", "topic_transitions", "conversation_flow", "session_context", "session_goals", "discussion_topics"],
                detection_patterns=[
                    r"today (.+) focusing", r"switch to (.+)", r"now (.+) discuss", r"this session (.+)",
                    r"theme (.+)", r"topic (.+)", r"let's talk about (.+)", r"want to focus on (.+)",
                    r"today i want to (.+)", r"this conversation (.+)", r"our discussion (.+)",
                    r"session (.+)", r"we're talking about (.+)", r"the main topic (.+)",
                    r"continuing (.+)", r"following up (.+)", r"back to (.+)", r"moving on to (.+)"
                ],
                relationships=["current_state", "contextual_rules"],
                retention_policy="session",
                privacy_default="normal"
            ),

            MemoryCategory.TEMPORAL_PATTERNS.value: CategorySchema(
                name="Temporal Patterns & Time-based Behaviors",
                description="Time-based behaviors, patterns, scheduling preferences",
                subcategories=["time_patterns", "behavioral_cycles", "scheduling_preferences", "temporal_habits"],
                detection_patterns=[
                    r"usually (.+) on (.+)", r"(.+) questions (.+) mornings",
                    r"typically (.+) fridays", r"(.+) in the (.+)", r"(.+) time (.+)"
                ],
                relationships=["activity_behavior", "session_themes"],
                retention_policy="permanent",
                privacy_default="normal"
            ),

            MemoryCategory.SEARCH_EXTERNAL_INFO.value: CategorySchema(
                name="Search & External Information Memory",
                description="Internet search history, preferences, trusted sources, and external information retrieval patterns with intelligent behavioral adaptation",
                subcategories=[
                    "search_history", "news_topics", "preferred_sources", "disliked_sources",
                    "search_preferences", "auto_search_settings", "news_preferences",
                    "search_constraints", "search_scope_rules", "source_attribution_rules",
                    "search_quality_feedback", "behavioral_adaptations", "session_search_logs"
                ],
                detection_patterns=[
                    # Basic search requests
                    r"search for (.+)", r"look up (.+)", r"find information about (.+)",
                    r"what's the latest on (.+)", r"news about (.+)", r"google (.+)",
                    r"find out (.+)", r"research (.+)", r"get news on (.+)",

                    # Search depth preferences
                    r"don't give me short (.+)", r"always go deep (.+)", r"(.+) comprehensive (.+)",
                    r"i want detailed (.+)", r"give me thorough (.+)", r"shallow (.+) is fine",
                    r"brief (.+) only", r"quick (.+) search", r"in-depth (.+)",

                    # Source preferences and constraints
                    r"i don't trust (.+)", r"only use (.+) sources", r"avoid (.+) sources",
                    r"prefer (.+) websites", r"official sources only", r"don't show me (.+) links",
                    r"(.+) unless i ask", r"only trust (.+) when (.+)", r"filter out (.+)",

                    # News delivery preferences
                    r"when giving news (.+)", r"i want (.+) summaries", r"(.+) bullet points (.+)",
                    r"weekly (.+)", r"daily (.+)", r"monthly (.+)", r"(.+) digest (.+)",
                    r"format (.+)", r"deliver (.+)", r"compile (.+)",

                    # Quality and feedback patterns
                    r"that source (.+)", r"good result (.+)", r"not helpful (.+)",
                    r"better sources (.+)", r"more reliable (.+)", r"accurate (.+)"
                ],
                relationships=["task_project_tracking", "knowledge_expertise", "personal_preferences", "response_adaptation"],
                retention_policy="permanent",
                privacy_default="normal"
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
                for match in matches:
                    value = match if isinstance(match, str) else ' '.join(match).strip()
                    if value:
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
                            'privacy_level': schema.privacy_default,
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
        elif category == MemoryCategory.ACTIVITY_BEHAVIOR.value:
            items.extend(self._detect_behavioral_patterns(message, message_lower, context))

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
                items.append({
                    'category': MemoryCategory.LONG_TERM_GOALS.value,
                    'subcategory': subcategory,
                    'key': self._generate_memory_key(MemoryCategory.LONG_TERM_GOALS.value, subcategory, match),
                    'value': match.strip(),
                    'confidence': 0.85,
                    'timestamp': datetime.now().isoformat(),
                    'source': 'semantic_detection',
                    'privacy_level': 'normal',
                    'retention_policy': 'permanent'
                })

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
                r'i\'m (feeling|getting|becoming)',
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
            (r'(never|don\'t|please don\'t|avoid) (.+)', 'user_preferences.avoid'),
            (r'(always|make sure to|remember to) (.+)', 'user_preferences.always'),
            (r'i (prefer|like|love) (.+)', 'user_preferences.likes'),
            (r'i (hate|dislike|can\'t stand) (.+)', 'user_preferences.dislikes'),
            (r'keep it (.+)', 'user_preferences.style'),
            (r'(only .+ when|unless) (.+)', 'user_preferences.conditional')
        ]

        for pattern, fact_type in preference_patterns:
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
                    'confidence': 0.8
                })

        # Detect technology/tool changes
        tech_patterns = [
            (r'i\'m (switching|moving) to (.+)', 'user_stack.current'),
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
            (r'don\'t be (.+) with me', 'user_preferences.response_tone')
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
                    'fact_type': 'user_preferences.meetings',
                    'value': current_message.strip(),
                    'previous_value': current_facts.get('user_preferences.meetings'),
                    'confidence': 0.7,
                    'source': 'contextual_flow'
                })

        return operations

    def _learn_from_corrections(self, message: str, current_facts: Dict) -> List[Dict]:
        """Learn from user corrections to improve pattern recognition"""
        operations = []
        message_lower = message.lower()

        # Detect correction patterns
        correction_indicators = ['actually', 'correction', 'i meant', 'sorry', 'wrong', 'no wait', 'let me correct']

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
            (r'(never|don\'t) call me (.+)', 'user_preferences.formality'),
            (r'keep it (respectful|formal|casual|professional)', 'user_preferences.formality'),
            (r'(only .+ when i say|unless i say) (.+)', 'user_preferences.explain_only_on_request'),
            (r'don\'t explain (.+) i already know', 'user_preferences.explain_only_on_request'),
            (r'i (hate|don\'t like) when you (.+)', 'user_preferences.communication_dislikes')
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
            (r'i (don\'t like|hate|avoid) (.+) meetings', 'user_preferences.meetings'),
            (r'i\'ll do (.+) if needed', 'user_preferences.conditional_acceptance'),
            (r'remember that i (.+)', 'user_preferences.important_note')
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
                r'i\'m\s+(\w+)(?:\s+and|\s*\.|,|$)',
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
                r'just call me\s+[\'"]?(\w+)[\'"]?',
                r'call me\s+[\'"]?(\w+)[\'"]?\s+from now on',
                r'changed my name.*call me\s+[\'"]?(\w+)[\'"]?'
            ],
            'age': [
                r'i\'m\s+(\d+)\s+years?\s+old',
                r'i am\s+(\d+)\s+years?\s+old',
                r'(\d+)\s+years?\s+old',
                r'my age is\s+(\d+)'
            ],
            'occupation': [
                r'i work as\s+(?:a\s+)?(.+?)(?:\.|,|$)',
                r'i\'m\s+(?:a\s+)?(.+?)(?:\s+developer|\s+dev)(?:\.|,|$)',
                r'i am\s+(?:a\s+)?(.+?)(?:\s+developer|\s+dev)(?:\.|,|$)',
                r'my job is\s+(.+?)(?:\.|,|$)',
                r'i do\s+(.+?)(?:\.|,|$)',
                r'i\'ve shifted to\s+(.+?)(?:\s+dev|\s+developer)(?:\.|,|$)',
                r'shifted to\s+(.+?)(?:\s+dev|\s+developer)(?:\.|,|$)',
                r'now i\'m\s+(?:a\s+)?(.+?)(?:\s+developer|\s+dev)(?:\.|,|$)'
            ],
            'company': [
                r'i work at\s+(.+?)(?:\.|,|$)',
                r'i work for\s+(.+?)(?:\.|,|$)',
                r'my company is\s+(.+?)(?:\.|,|$)',
                # Enhanced patterns for job announcements
                r'i got a job at\s+(.+?)(?:\.|,|$)',
                r'i got a new job at\s+(.+?)(?:\.|,|$)',
                r'i started working at\s+(.+?)(?:\.|,|$)',
                r'i joined\s+(.+?)(?:\.|,|$)',
                r'i\'m working at\s+(.+?)(?:\.|,|$)',
                r'i\'m now at\s+(.+?)(?:\.|,|$)',
                r'my new job is at\s+(.+?)(?:\.|,|$)',
                r'i started at\s+(.+?)(?:\.|,|$)',
                # Enhanced patterns for corrections
                r'actually,?\s+i now work at\s+(.+?)(?:\.|,|$)',
                r'actually,?\s+i work at\s+(.+?)(?:\.|,|$)',
                r'i now work at\s+(.+?)(?:\.|,|$)',
                r'correction.*i work at\s+(.+?)(?:\.|,|$)'
            ],
            'previous_company': [
                r'i used to work at\s+(.+?)(?:\.|,|$)',
                r'i previously worked at\s+(.+?)(?:\.|,|$)',
                r'i worked at\s+(.+?)\s+before(?:\.|,|$)',
                r'my previous job was at\s+(.+?)(?:\.|,|$)',
                r'before this i worked at\s+(.+?)(?:\.|,|$)',
                r'i came from\s+(.+?)(?:\.|,|$)'
            ],
            'location': [
                r'i live in\s+(.+?)(?:\.|,|$)',
                r'i\'m from\s+(.+?)(?:\.|,|$)',
                r'i moved to\s+(.+?)(?:\.|,|$)',
                r'based in\s+(.+?)(?:\.|,|$)'
            ],
            'interests': [
                r'i\'m learning\s+(.+?)(?:\.|,|$)',
                r'learning\s+(.+?)(?:\.|,|$)',
                r'i love\s+(.+?)(?:\.|,|$)',
                r'i like\s+(.+?)(?:\.|,|$)',
                r'i enjoy\s+(.+?)(?:\.|,|$)',
                r'i\'m interested in\s+(.+?)(?:\.|,|$)',
                r'interested in\s+(.+?)(?:\.|,|$)',
                r'i\'m into\s+(.+?)(?:\.|,|$)',
                r'into\s+(.+?)(?:\.|,|$)',
                r'i\'m also into\s+(.+?)(?:\.|,|$)'
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
                    value = matches[0].strip()

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
            r'disregard (?:that )?(.+)',
            r'remove (.+)'
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


class SemanticMemoryEngine:
    """Advanced semantic understanding and relationship detection"""

    def __init__(self):
        # Semantic relationship patterns
        self.semantic_patterns = {
            'professional': {
                'keywords': ['work', 'job', 'career', 'developer', 'engineer', 'manager', 'analyst'],
                'related_concepts': {
                    'python': ['programming', 'developer', 'data science', 'machine learning'],
                    'javascript': ['web development', 'frontend', 'programming'],
                    'data science': ['python', 'machine learning', 'analytics', 'statistics'],
                    'machine learning': ['python', 'data science', 'AI', 'algorithms']
                }
            },
            'personal': {
                'keywords': ['name', 'age', 'location', 'family', 'hobby'],
                'related_concepts': {
                    'cars': ['driving', 'automotive', 'speed', 'luxury'],
                    'music': ['instruments', 'concerts', 'genres', 'artists'],
                    'sports': ['fitness', 'competition', 'teams', 'exercise']
                }
            }
        }

        # Context indicators
        self.context_indicators = {
            'professional': ['work', 'job', 'career', 'office', 'company', 'business'],
            'personal': ['home', 'family', 'hobby', 'interest', 'like', 'enjoy'],
            'educational': ['learn', 'study', 'course', 'school', 'university', 'education'],
            'social': ['friend', 'meet', 'party', 'social', 'group', 'community']
        }

    def analyze_semantic_relationships(self, new_fact: str, existing_facts: Dict) -> SemanticContext:
        """Analyze semantic relationships for a new fact"""
        context_type = self._detect_context_type(new_fact)
        related_facts = self._find_related_facts(new_fact, existing_facts)
        semantic_tags = self._extract_semantic_tags(new_fact)
        similarity_hash = self._generate_similarity_hash(new_fact)

        return SemanticContext(
            related_facts=related_facts,
            confidence_score=0.8,
            context_type=context_type,
            semantic_tags=semantic_tags,
            similarity_hash=similarity_hash
        )

    def _detect_context_type(self, fact: str) -> str:
        """Detect the context type of a fact"""
        fact_lower = fact.lower()

        for context, indicators in self.context_indicators.items():
            if any(indicator in fact_lower for indicator in indicators):
                return context

        return "general"

    def _find_related_facts(self, new_fact: str, existing_facts: Dict) -> List[str]:
        """Find facts related to the new fact"""
        related = []
        new_fact_lower = new_fact.lower()

        # Check for direct keyword matches
        for fact_key, fact_value in existing_facts.items():
            if self._calculate_semantic_similarity(new_fact_lower, str(fact_value).lower()) > 0.3:
                related.append(fact_key)

        return related

    def _calculate_semantic_similarity(self, fact1: str, fact2: str) -> float:
        """Calculate semantic similarity between two facts"""
        words1 = set(fact1.split())
        words2 = set(fact2.split())

        intersection = words1.intersection(words2)
        union = words1.union(words2)

        if not union:
            return 0.0

        return len(intersection) / len(union)

    def _extract_semantic_tags(self, fact: str) -> List[str]:
        """Extract semantic tags from a fact"""
        tags = []
        fact_lower = fact.lower()

        # Extract technology tags
        tech_keywords = ['python', 'javascript', 'java', 'react', 'node', 'sql', 'html', 'css']
        for tech in tech_keywords:
            if tech in fact_lower:
                tags.append(f"tech:{tech}")

        return tags

    def _generate_similarity_hash(self, fact: str) -> str:
        """Generate a hash for similarity detection"""
        # Normalize the fact for similarity comparison
        normalized = re.sub(r'[^\w\s]', '', fact.lower())
        normalized = ' '.join(sorted(normalized.split()))
        return hashlib.md5(normalized.encode()).hexdigest()[:8]


class EmotionalMemoryEngine:
    """Advanced emotional context and sentiment tracking"""

    def __init__(self):
        # Emotion indicators
        self.emotion_patterns = {
            'positive': {
                'keywords': ['love', 'enjoy', 'excited', 'happy', 'great', 'awesome', 'amazing', 'fantastic'],
                'intensity_modifiers': ['really', 'very', 'extremely', 'absolutely', 'totally']
            },
            'negative': {
                'keywords': ['hate', 'dislike', 'frustrated', 'angry', 'sad', 'terrible', 'awful', 'horrible'],
                'intensity_modifiers': ['really', 'very', 'extremely', 'absolutely', 'totally']
            },
            'neutral': {
                'keywords': ['okay', 'fine', 'normal', 'average', 'standard', 'regular']
            }
        }

        # Specific emotion detection
        self.specific_emotions = {
            'excited': ['excited', 'thrilled', 'pumped', 'enthusiastic'],
            'proud': ['proud', 'accomplished', 'achieved', 'successful'],
            'anxious': ['anxious', 'worried', 'nervous', 'concerned'],
            'happy': ['happy', 'joyful', 'cheerful', 'delighted'],
            'sad': ['sad', 'disappointed', 'upset', 'down']
        }

    def analyze_sentiment(self, message: str) -> EmotionalContext:
        """Analyze emotional context of a message"""
        sentiment = self._detect_sentiment(message)
        emotion_tags = self._detect_specific_emotions(message)
        emotional_intensity = self._calculate_emotional_intensity(message)
        mood_context = self._detect_mood_context(message)

        return EmotionalContext(
            sentiment=sentiment,
            emotion_tags=emotion_tags,
            emotional_intensity=emotional_intensity,
            mood_context=mood_context,
            confidence=0.7
        )

    def _detect_sentiment(self, message: str) -> str:
        """Detect overall sentiment of message"""
        message_lower = message.lower()

        positive_score = 0
        negative_score = 0

        for keyword in self.emotion_patterns['positive']['keywords']:
            if keyword in message_lower:
                positive_score += 1

        for keyword in self.emotion_patterns['negative']['keywords']:
            if keyword in message_lower:
                negative_score += 1

        if positive_score > negative_score:
            return "positive"
        elif negative_score > positive_score:
            return "negative"
        else:
            return "neutral"

    def _detect_specific_emotions(self, message: str) -> List[str]:
        """Detect specific emotions in message"""
        emotions = []
        message_lower = message.lower()

        for emotion, keywords in self.specific_emotions.items():
            if any(keyword in message_lower for keyword in keywords):
                emotions.append(emotion)

        return emotions

    def _calculate_emotional_intensity(self, message: str) -> float:
        """Calculate emotional intensity (0.0 to 1.0)"""
        message_lower = message.lower()
        intensity = 0.5  # Base intensity

        # Check for intensity modifiers
        for category in self.emotion_patterns.values():
            modifiers = category.get('intensity_modifiers', [])
            for modifier in modifiers:
                if modifier in message_lower:
                    intensity += 0.2

        # Check for exclamation marks
        intensity += min(message.count('!') * 0.1, 0.3)

        # Check for capital letters (excitement indicator)
        if any(word.isupper() for word in message.split()):
            intensity += 0.1

        return min(intensity, 1.0)

    def _detect_mood_context(self, message: str) -> str:
        """Detect overall mood context"""
        message_lower = message.lower()

        if any(word in message_lower for word in ['celebration', 'party', 'success', 'achievement']):
            return "celebratory"
        elif any(word in message_lower for word in ['problem', 'issue', 'difficulty', 'challenge']):
            return "challenging"
        elif any(word in message_lower for word in ['learn', 'new', 'start', 'begin']):
            return "learning"
        else:
            return "normal"


class ConflictResolution:
    """Advanced conflict detection and resolution"""

    def __init__(self):
        self.conflict_patterns = {
            'direct_contradiction': [
                (r'i am (\w+)', r'i am not \1'),
                (r'i work as (.+)', r'i don\'t work as \1'),
                (r'i live in (.+)', r'i don\'t live in \1')
            ],
            'temporal_inconsistency': [
                (r'i am (\d+) years old', r'i am (\d+) years old'),  # Different ages
                (r'i started (.+) in (\d{4})', r'i started \1 in (\d{4})')  # Different start dates
            ]
        }

    def detect_contradictions(self, new_fact: str, existing_facts: Dict) -> List[Conflict]:
        """Detect contradictions between new fact and existing facts"""
        conflicts = []
        new_fact_lower = new_fact.lower()

        for fact_key, fact_value in existing_facts.items():
            fact_value_lower = str(fact_value).lower()

            # Check for direct contradictions
            if self._is_direct_contradiction(new_fact_lower, fact_value_lower):
                conflicts.append(Conflict(
                    conflicting_facts=[new_fact, str(fact_value)],
                    conflict_type=ConflictType.DIRECT_CONTRADICTION.value,
                    severity=0.9,
                    suggested_resolution=f"Update {fact_key} from '{fact_value}' to '{new_fact}'"
                ))

        return conflicts

    def _is_direct_contradiction(self, fact1: str, fact2: str) -> bool:
        """Check if two facts directly contradict each other"""
        # Simple contradiction detection
        if 'not' in fact1 and fact1.replace('not ', '') in fact2:
            return True
        if 'not' in fact2 and fact2.replace('not ', '') in fact1:
            return True

        return False


class SerpAPISearchEngine:
    """
    SerpAPI integration for intelligent web searching with memory-aware preferences.
    Handles search execution, result filtering, and search history management.
    """

    def __init__(self, api_key: str = "a16428a9d6d8ce8fea03fea8421397c86995036a63343f09987508e9bd06d21d"):
        self.api_key = api_key
        self.base_url = "https://serpapi.com/search"

    def search(self, query: str, search_preferences: Dict = None, user_sources: Dict = None) -> Dict[str, Any]:
        """
        Execute a search with user preferences and source filtering

        Args:
            query: Search query string
            search_preferences: User's search depth and style preferences
            user_sources: User's preferred and disliked sources

        Returns:
            Dict containing search results, metadata, and filtered results
        """
        try:
            # Prepare search parameters
            params = {
                "q": query,
                "api_key": self.api_key,
                "engine": "google",
                "num": self._determine_result_count(search_preferences),
                "safe": "active"
            }

            # Execute search
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()

            raw_results = response.json()

            # Process and filter results
            processed_results = self._process_search_results(raw_results, user_sources, search_preferences)

            return {
                "query": query,
                "timestamp": datetime.now().isoformat(),
                "raw_results_count": len(raw_results.get("organic_results", [])),
                "filtered_results_count": len(processed_results["filtered_results"]),
                "results": processed_results["filtered_results"],
                "news_results": processed_results.get("news_results", []),
                "search_metadata": {
                    "search_time": raw_results.get("search_metadata", {}).get("total_time_taken", 0),
                    "sources_filtered": processed_results["sources_filtered"],
                    "quality_score": processed_results["quality_score"]
                },
                "suggested_follow_ups": self._generate_follow_up_suggestions(query, processed_results)
            }

        except requests.exceptions.RequestException as e:
            return {
                "error": f"Search request failed: {str(e)}",
                "query": query,
                "timestamp": datetime.now().isoformat(),
                "results": []
            }
        except Exception as e:
            return {
                "error": f"Search processing failed: {str(e)}",
                "query": query,
                "timestamp": datetime.now().isoformat(),
                "results": []
            }

    def _determine_result_count(self, search_preferences: Dict = None) -> int:
        """Determine number of results based on user's search depth preference"""
        if not search_preferences:
            return 10

        depth = search_preferences.get("search_depth", "moderate")
        if depth == "shallow":
            return 5
        elif depth == "deep":
            return 20
        else:  # moderate
            return 10

    def _process_search_results(self, raw_results: Dict, user_sources: Dict = None, search_preferences: Dict = None) -> Dict:
        """Process and filter search results based on user preferences"""
        organic_results = raw_results.get("organic_results", [])
        news_results = raw_results.get("news_results", [])

        filtered_results = []
        sources_filtered = {"removed": [], "prioritized": []}

        # Get user source preferences
        preferred_sources = user_sources.get("preferred_sources", []) if user_sources else []
        disliked_sources = user_sources.get("disliked_sources", []) if user_sources else []

        for result in organic_results:
            source_domain = self._extract_domain(result.get("link", ""))

            # Skip disliked sources
            if any(disliked in source_domain.lower() for disliked in disliked_sources):
                sources_filtered["removed"].append(source_domain)
                continue

            # Prioritize preferred sources
            priority_score = 0
            if any(preferred in source_domain.lower() for preferred in preferred_sources):
                priority_score = 10
                sources_filtered["prioritized"].append(source_domain)

            # Add processed result
            processed_result = {
                "title": result.get("title", ""),
                "link": result.get("link", ""),
                "snippet": result.get("snippet", ""),
                "source_domain": source_domain,
                "priority_score": priority_score,
                "position": result.get("position", 0)
            }

            filtered_results.append(processed_result)

        # Sort by priority score and original position
        filtered_results.sort(key=lambda x: (-x["priority_score"], x["position"]))

        # Calculate quality score
        quality_score = self._calculate_quality_score(filtered_results, sources_filtered)

        return {
            "filtered_results": filtered_results,
            "news_results": news_results[:5],  # Limit news results
            "sources_filtered": sources_filtered,
            "quality_score": quality_score
        }

    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL"""
        try:
            from urllib.parse import urlparse
            return urlparse(url).netloc.replace("www.", "")
        except:
            return url

    def _calculate_quality_score(self, results: List[Dict], sources_filtered: Dict) -> float:
        """Calculate a quality score for the search results"""
        if not results:
            return 0.0

        # Base score
        score = 0.5

        # Bonus for prioritized sources
        prioritized_count = len(sources_filtered.get("prioritized", []))
        if prioritized_count > 0:
            score += min(0.3, prioritized_count * 0.1)

        # Bonus for result diversity
        unique_domains = len(set(r["source_domain"] for r in results))
        if unique_domains > 3:
            score += 0.2

        return min(1.0, score)

    def _generate_follow_up_suggestions(self, query: str, results: Dict) -> List[str]:
        """Generate intelligent follow-up search suggestions"""
        suggestions = []

        # Based on query type
        if any(word in query.lower() for word in ["how to", "tutorial", "guide"]):
            suggestions.append(f"{query} examples")
            suggestions.append(f"{query} best practices")

        if any(word in query.lower() for word in ["what is", "define", "meaning"]):
            suggestions.append(f"{query} use cases")
            suggestions.append(f"{query} vs alternatives")

        # Based on results
        if results.get("news_results"):
            suggestions.append(f"{query} latest news")
            suggestions.append(f"{query} recent developments")

        return suggestions[:3]  # Limit to 3 suggestions


class NovaMemoryAI:
    """
    Nova Memory AI System - A dedicated memory agent that works alongside Nova

    Core Functions:
    - Only stores & retrieves memory - Pure data storage and recall
    - Activates when Nova forgets - Seamless background operation
    - Feeds missing info back automatically - Transparent to the user
    """

    def __init__(self, storage_file: str = "nova_memory.json"):
        self.storage_file = storage_file
        self.user_id = f"user_{uuid.uuid4().hex[:8]}"

        # Initialize comprehensive 22-category data structure
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
            "memory_events": [],
            "conversation": [],
            "current_facts": {},  # Legacy support
            "fact_history": {},   # Legacy support
            "sessions": {},
            "current_session": None,
            "conversation_state": {
                "greeting_completed": False,
                "introduction_phase": True,
                "established_user": False
            },

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

    def _process_structured_metadata(self, metadata: Dict) -> Dict:
        """Process and validate structured metadata for JSON serialization"""
        if not metadata:
            return {}

        processed = {}
        for key, value in metadata.items():
            # Ensure all metadata values are JSON serializable
            processed[key] = self._serialize_structured_value(value)

        return processed

    def _serialize_structured_value(self, value: Any) -> Any:
        """Serialize complex structured data for JSON compatibility"""
        if value is None:
            return None
        elif isinstance(value, (str, int, float, bool)):
            return value
        elif isinstance(value, (list, tuple)):
            return [self._serialize_structured_value(item) for item in value]
        elif isinstance(value, dict):
            return {k: self._serialize_structured_value(v) for k, v in value.items()}
        elif hasattr(value, '__dict__'):
            # Handle dataclass or custom objects
            return self._serialize_structured_value(value.__dict__)
        else:
            # Convert to string for unsupported types
            return str(value)

    def _deserialize_structured_value(self, value: Any) -> Any:
        """Deserialize structured data from JSON storage"""
        # For now, return as-is since JSON loading handles basic types
        # This method can be extended for custom deserialization logic
        return value

    def query_structured_data(self, category: str, query_filter: Dict = None) -> List[Dict]:
        """Query structured data with complex filtering"""
        if category not in self.data["memory_categories"]:
            return []

        category_data = self.data["memory_categories"][category]
        results = []

        for key, item in category_data.items():
            # Apply query filters if provided
            if query_filter:
                match = True
                for filter_key, filter_value in query_filter.items():
                    if filter_key in item:
                        item_value = item[filter_key]
                        if isinstance(filter_value, dict) and isinstance(item_value, dict):
                            # Deep comparison for nested objects
                            if not self._deep_match(item_value, filter_value):
                                match = False
                                break
                        elif isinstance(filter_value, list) and isinstance(item_value, list):
                            # Check if any items in filter_value are in item_value
                            if not any(fv in item_value for fv in filter_value):
                                match = False
                                break
                        elif item_value != filter_value:
                            match = False
                            break
                    else:
                        match = False
                        break

                if match:
                    results.append(item)
            else:
                results.append(item)

        return results

    def _deep_match(self, item_value: Dict, filter_value: Dict) -> bool:
        """Deep comparison for nested dictionary structures"""
        for key, value in filter_value.items():
            if key not in item_value:
                return False
            if isinstance(value, dict) and isinstance(item_value[key], dict):
                if not self._deep_match(item_value[key], value):
                    return False
            elif item_value[key] != value:
                return False
        return True

    def store_memory_item(self, category: str, subcategory: str, key: str, value: Any, metadata: Dict = None) -> bool:
        """Store a memory item in the appropriate category with full metadata and structured data support"""
        try:
            if category not in self.data["memory_categories"]:
                return False

            # Process structured metadata
            processed_metadata = self._process_structured_metadata(metadata) if metadata else {}

            # Create comprehensive memory item with structured data support
            memory_item = MemoryItem(
                category=category,
                subcategory=subcategory,
                key=key,
                value=self._serialize_structured_value(value),
                confidence=processed_metadata.get('confidence', 0.8),
                timestamp=datetime.now().isoformat(),
                last_accessed=datetime.now().isoformat(),
                source=processed_metadata.get('source', 'conversation'),
                relationships=processed_metadata.get('relationships', []),
                tags=processed_metadata.get('tags', []),
                privacy_level=processed_metadata.get('privacy_level', 'normal'),
                session_id=processed_metadata.get('session_id')
            )

            # Store in appropriate category
            self.data["memory_categories"][category][key] = asdict(memory_item)

            # Update relationships
            if memory_item.relationships:
                self._update_category_relationships(category, memory_item.relationships)

            # Update legacy current_facts for backward compatibility
            fact_key = f"{category}.{subcategory}"
            self.data["current_facts"][fact_key] = value

            return True

        except Exception as e:
            print(f"Error storing memory item: {e}")
            return False

    def retrieve_memory_by_category(self, category: str, subcategory: str = None) -> Dict[str, Any]:
        """Retrieve memory items from a specific category"""
        if category not in self.data["memory_categories"]:
            return {}

        category_data = self.data["memory_categories"][category]

        if subcategory:
            # Filter by subcategory
            filtered_data = {
                key: item for key, item in category_data.items()
                if item.get('subcategory') == subcategory
            }
            return filtered_data

        return category_data

    def get_comprehensive_user_profile(self) -> Dict[str, Any]:
        """Generate a comprehensive user profile across all 22 categories"""
        profile = {
            "user_id": self.data["user"]["user_id"],
            "profile_generated_at": datetime.now().isoformat(),
            "categories": {}
        }

        # Compile information from each category
        for category, data in self.data["memory_categories"].items():
            if data:  # Only include categories with data
                category_summary = self._summarize_category(category, data)
                profile["categories"][category] = category_summary

        # Add behavioral insights
        profile["behavioral_insights"] = self._generate_behavioral_insights()

        # Add relationship map
        profile["relationship_map"] = self.data.get("category_relationships", {})

        return profile

    def _update_category_relationships(self, category: str, relationships: List[str]):
        """Update cross-category relationships"""
        if category not in self.data["category_relationships"]:
            self.data["category_relationships"][category] = []

        for related_category in relationships:
            if related_category not in self.data["category_relationships"][category]:
                self.data["category_relationships"][category].append(related_category)

            # Add bidirectional relationship
            if related_category not in self.data["category_relationships"]:
                self.data["category_relationships"][related_category] = []
            if category not in self.data["category_relationships"][related_category]:
                self.data["category_relationships"][related_category].append(category)

    def _summarize_category(self, category: str, data: Dict) -> Dict[str, Any]:
        """Generate a summary for a specific category"""
        summary = {
            "total_items": len(data),
            "last_updated": max([item.get('timestamp', '') for item in data.values()]) if data else None,
            "subcategories": list(set([item.get('subcategory', 'unknown') for item in data.values()])),
            "key_items": []
        }

        # Get most important/recent items
        sorted_items = sorted(
            data.items(),
            key=lambda x: (x[1].get('confidence', 0), x[1].get('timestamp', '')),
            reverse=True
        )

        # Include top 5 items
        for key, item in sorted_items[:5]:
            summary["key_items"].append({
                "key": key,
                "value": item.get('value'),
                "subcategory": item.get('subcategory'),
                "confidence": item.get('confidence'),
                "last_accessed": item.get('last_accessed')
            })

        return summary

    def _generate_behavioral_insights(self) -> Dict[str, Any]:
        """Generate behavioral insights from stored memory"""
        insights = {
            "communication_style": self._analyze_communication_style(),
            "activity_patterns": self._analyze_activity_patterns(),
            "learning_preferences": self._analyze_learning_preferences(),
            "goal_orientation": self._analyze_goal_orientation()
        }

        return insights

    def _analyze_communication_style(self) -> Dict[str, Any]:
        """Analyze user's communication style from stored preferences"""
        prefs = self.data["memory_categories"].get(MemoryCategory.PERSONAL_PREFERENCES.value, {})
        boundaries = self.data["memory_categories"].get(MemoryCategory.COMMUNICATION_BOUNDARIES.value, {})

        style = {
            "formality_level": "unknown",
            "response_length_preference": "unknown",
            "explanation_preference": "unknown",
            "boundaries_count": len(boundaries)
        }

        # Analyze preferences
        for item in prefs.values():
            subcategory = item.get('subcategory', '')
            value = str(item.get('value', '')).lower()

            if subcategory == 'formality':
                if 'formal' in value or 'professional' in value:
                    style["formality_level"] = "formal"
                elif 'casual' in value or 'relaxed' in value:
                    style["formality_level"] = "casual"
                elif 'respectful' in value:
                    style["formality_level"] = "respectful"

            elif subcategory == 'response_style':
                if 'brief' in value or 'short' in value:
                    style["response_length_preference"] = "brief"
                elif 'detailed' in value or 'comprehensive' in value:
                    style["response_length_preference"] = "detailed"

            elif subcategory == 'explanation_rules':
                if 'don\'t explain' in value or 'only when' in value:
                    style["explanation_preference"] = "minimal"
                elif 'always explain' in value:
                    style["explanation_preference"] = "comprehensive"

        return style

    def _analyze_activity_patterns(self) -> Dict[str, Any]:
        """Analyze user's activity patterns from stored behavior data"""
        behavior = self.data["memory_categories"].get(MemoryCategory.ACTIVITY_BEHAVIOR.value, {})

        patterns = {
            "active_times": "unknown",
            "engagement_style": "unknown",
            "interaction_frequency": "unknown"
        }

        # Analyze behavior patterns
        for item in behavior.values():
            subcategory = item.get('subcategory', '')
            value = str(item.get('value', '')).lower()

            if subcategory == 'active_times':
                patterns["active_times"] = value
            elif subcategory == 'engagement_style':
                patterns["engagement_style"] = value

        return patterns

    def _analyze_learning_preferences(self) -> Dict[str, Any]:
        """Analyze user's learning preferences from development data"""
        development = self.data["memory_categories"].get(MemoryCategory.PERSONAL_DEVELOPMENT.value, {})

        preferences = {
            "learning_style": "unknown",
            "skill_focus_areas": [],
            "progress_tracking": "unknown"
        }

        # Analyze learning patterns
        for item in development.values():
            subcategory = item.get('subcategory', '')
            value = str(item.get('value', ''))

            if subcategory == 'skills_learning':
                preferences["skill_focus_areas"].append(value)
            elif 'hands-on' in value.lower():
                preferences["learning_style"] = "hands-on"
            elif 'visual' in value.lower():
                preferences["learning_style"] = "visual"

        return preferences

    def _analyze_goal_orientation(self) -> Dict[str, Any]:
        """Analyze user's goal orientation from long-term goals"""
        goals = self.data["memory_categories"].get(MemoryCategory.LONG_TERM_GOALS.value, {})

        orientation = {
            "primary_goals": [],
            "goal_type": "unknown",
            "time_horizon": "unknown"
        }

        # Analyze goals
        for item in goals.values():
            subcategory = item.get('subcategory', '')
            value = str(item.get('value', ''))

            if subcategory in ['career_aspiration', 'specific_goal']:
                orientation["primary_goals"].append(value)

                if 'career' in value.lower() or 'engineer' in value.lower():
                    orientation["goal_type"] = "career-focused"
                elif 'learn' in value.lower() or 'skill' in value.lower():
                    orientation["goal_type"] = "skill-focused"

        return orientation

    def _create_comprehensive_memory_event(self, operation: Dict, timestamp: str, emotional_context) -> Optional[MemoryEvent]:
        """Create a comprehensive memory event for the 22-category framework"""
        try:
            # Create enhanced summary with category information
            category = operation.get('category', 'unknown')
            subcategory = operation.get('subcategory', 'general')
            op_type = operation.get('type', 'ADD')
            value = operation.get('value', '')

            # Generate category-aware summary
            if op_type == 'ADD':
                summary = f"Added {category}.{subcategory}: {value}"
            elif op_type == 'UPDATE':
                prev_value = operation.get('previous_value', 'unknown')
                summary = f"Updated {category}.{subcategory}: {prev_value} → {value}"
            elif op_type == 'CONFIRM':
                summary = f"Confirmed {category}.{subcategory}: {value}"
            else:
                summary = f"{op_type} {category}.{subcategory}: {value}"

            # Create comprehensive memory event
            return MemoryEvent(
                type=op_type,
                summary=summary,
                timestamp=timestamp,
                confidence=operation.get('confidence', 0.8),
                category=category,
                subcategory=subcategory,
                relationships=operation.get('relationships', []),
                emotional_context=emotional_context.sentiment if emotional_context else None,
                session_id=operation.get('session_id'),
                privacy_level=operation.get('privacy_level', 'normal'),
                current_value=value,
                previous_value=operation.get('previous_value')
            )

        except Exception as e:
            print(f"Error creating comprehensive memory event: {e}")
            return None

    def _initialize_session(self):
        """Initialize a new conversation session with proper state management"""
        current_time = datetime.now().isoformat()
        session_id = f"session_{uuid.uuid4().hex[:8]}"

        # Determine if this is an established user
        has_previous_sessions = len(self.data.get("sessions", {})) > 0
        has_user_facts = len(self.data.get("current_facts", {})) > 0
        user_name = self.data["user"].get("name")

        # Create new session
        new_session = ConversationSession(
            session_id=session_id,
            start_time=current_time,
            user_name=user_name,
            last_activity=current_time
        )

        # Store session
        self.data["sessions"][session_id] = asdict(new_session)
        self.data["current_session"] = session_id

        # Update conversation state based on user history
        if has_previous_sessions or (has_user_facts and user_name):
            # This is a returning user - skip introduction phase
            self.data["conversation_state"]["introduction_phase"] = False
            self.data["conversation_state"]["established_user"] = True
            self.data["conversation_state"]["greeting_completed"] = True  # Startup greeting counts
            self.data["user"]["relationship_established"] = True
        else:
            # This is a new user - needs introduction
            self.data["conversation_state"]["introduction_phase"] = True
            self.data["conversation_state"]["established_user"] = False
            self.data["conversation_state"]["greeting_completed"] = False

        # Update user metadata
        self.data["user"]["total_sessions"] = len(self.data["sessions"])
        self.data["user"]["last_seen"] = current_time

    def _end_current_session(self):
        """End the current conversation session"""
        if self.data["current_session"]:
            session_id = self.data["current_session"]
            session = self.data["sessions"].get(session_id)

            if session:
                # Calculate session duration
                start_time = datetime.fromisoformat(session["start_time"])
                end_time = datetime.now()
                duration = end_time - start_time

                # Update session data
                session["end_time"] = end_time.isoformat()
                session["session_duration"] = self._format_duration(duration)
                session["message_count"] = len([msg for msg in self.data["conversation"]
                                              if msg.get("session_id") == session_id])

                # Extract topics discussed
                session["topics_discussed"] = self._extract_session_topics(session_id)

                # Save updated session
                self.data["sessions"][session_id] = session

            # Clear current session
            self.data["current_session"] = None

    def _format_duration(self, duration: timedelta) -> str:
        """Format duration for human readability"""
        total_seconds = int(duration.total_seconds())

        if total_seconds < 60:
            return f"{total_seconds} seconds"
        elif total_seconds < 3600:
            minutes = total_seconds // 60
            return f"{minutes} minutes"
        else:
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            if minutes > 0:
                return f"{hours} hours {minutes} minutes"
            else:
                return f"{hours} hours"

    def _extract_session_topics(self, session_id: str) -> List[str]:
        """Extract main topics discussed in a session"""
        topics = set()

        # Get messages from this session
        session_messages = [msg for msg in self.data["conversation"]
                          if msg.get("session_id") == session_id and msg.get("role") == "user"]

        # Extract topics from user messages
        for message in session_messages:
            content = message.get("content", "").lower()

            # Check for common topics
            if any(word in content for word in ['work', 'job', 'career', 'occupation']):
                topics.add("career")
            if any(word in content for word in ['learn', 'study', 'course', 'education']):
                topics.add("learning")
            if any(word in content for word in ['hobby', 'interest', 'like', 'enjoy']):
                topics.add("interests")
            if any(word in content for word in ['python', 'javascript', 'programming', 'code']):
                topics.add("programming")
            if any(word in content for word in ['machine learning', 'ai', 'data science']):
                topics.add("AI/ML")

        return list(topics)

    def get_session_info(self) -> Dict[str, Any]:
        """Get information about conversation sessions"""
        sessions = self.data.get("sessions", {})

        if not sessions:
            return {
                "is_first_time": True,
                "total_sessions": 0,
                "last_session": None,
                "greeting_type": "first_time"
            }

        # Get last completed session (not current one)
        completed_sessions = [s for s in sessions.values() if s.get("end_time")]

        if not completed_sessions:
            return {
                "is_first_time": True,
                "total_sessions": len(sessions),
                "last_session": None,
                "greeting_type": "first_time"
            }

        # Sort by start time and get the most recent
        last_session = max(completed_sessions, key=lambda x: x["start_time"])

        # Calculate time since last session
        last_time = datetime.fromisoformat(last_session["start_time"])
        time_since = datetime.now() - last_time

        return {
            "is_first_time": False,
            "total_sessions": len(sessions),
            "last_session": last_session,
            "time_since_last": self._format_duration(time_since),
            "greeting_type": "returning_user",
            "user_name": self.data["user"].get("name"),
            "last_topics": last_session.get("topics_discussed", []),
            "last_duration": last_session.get("session_duration", "unknown")
        }

    def get_conversation_state(self) -> Dict[str, Any]:
        """Get current conversation state for AI response generation"""
        state = self.data.get("conversation_state", {})
        user_info = self.data.get("user", {})

        return {
            "is_introduction_phase": state.get("introduction_phase", True),
            "is_established_user": state.get("established_user", False),
            "greeting_completed": state.get("greeting_completed", False),
            "relationship_established": user_info.get("relationship_established", False),
            "user_name": user_info.get("name"),
            "total_sessions": len(self.data.get("sessions", {})),
            "has_user_facts": len(self.data.get("current_facts", {})) > 0,
            "conversation_context": self._get_conversation_context_hints()
        }

    def _get_conversation_context_hints(self) -> Dict[str, Any]:
        """Get context hints for natural conversation continuation"""
        facts = self.data.get("current_facts", {})
        recent_topics = []

        # Get recent session topics
        sessions = self.data.get("sessions", {})
        if sessions:
            recent_session = max(sessions.values(), key=lambda x: x.get("start_time", ""))
            recent_topics = recent_session.get("topics_discussed", [])

        return {
            "user_occupation": facts.get("occupation"),
            "user_interests": facts.get("interests"),
            "recent_topics": recent_topics,
            "can_reference_work": "occupation" in facts,
            "can_reference_interests": "interests" in facts,
            "should_avoid_introductions": not self.data.get("conversation_state", {}).get("introduction_phase", True)
        }

    def mark_greeting_completed(self):
        """Mark that greeting has been completed in current session"""
        if "conversation_state" not in self.data:
            self.data["conversation_state"] = {}

        self.data["conversation_state"]["greeting_completed"] = True

        # If user provided name or facts, move out of introduction phase
        if self.data["user"].get("name") or self.data.get("current_facts"):
            self.data["conversation_state"]["introduction_phase"] = False
            self.data["conversation_state"]["established_user"] = True
            self.data["user"]["relationship_established"] = True
    
    def process_conversation(self, user_message: str, ai_response: str) -> Dict[str, Any]:
        """Enhanced conversation processing with advanced memory features"""
        timestamp = datetime.now().isoformat()

        # Add to conversation log with session tracking
        session_id = self.data.get("current_session")
        self.data["conversation"].extend([
            {
                "role": "user",
                "content": user_message,
                "timestamp": timestamp,
                "session_id": session_id
            },
            {
                "role": "assistant",
                "content": ai_response,
                "timestamp": timestamp,
                "session_id": session_id
            }
        ])

        # Update session activity
        if session_id and session_id in self.data["sessions"]:
            self.data["sessions"][session_id]["last_activity"] = timestamp
            self.data["sessions"][session_id]["message_count"] = len([
                msg for msg in self.data["conversation"]
                if msg.get("session_id") == session_id
            ])

        # Check if this interaction should mark greeting as completed
        user_message_lower = user_message.lower()
        if (not self.data.get("conversation_state", {}).get("greeting_completed", False) and
            (any(greeting in user_message_lower for greeting in ['hi', 'hello', 'hey', 'nova']) or
             len(self.data["conversation"]) > 2)):  # After a few exchanges
            self.mark_greeting_completed()

        # Analyze emotional context
        emotional_context = self.emotional_engine.analyze_sentiment(user_message)

        # Build context for adaptive learning
        context = {
            'previous_messages': self.data["conversation"][-10:] if len(self.data["conversation"]) > 10 else self.data["conversation"],
            'session_id': session_id,
            'emotional_context': emotional_context,
            'current_session_data': self.data["sessions"].get(session_id, {}),
            'user_history': self.data.get("fact_history", {}),
            'correction_detected': any(word in user_message.lower() for word in ['actually', 'correction', 'i meant', 'sorry', 'wrong'])
        }

        # Analyze user message using comprehensive 22-category framework
        operations = self.fact_extractor.analyze_message(
            user_message, self.data["current_facts"], context
        )

        # Process operations with comprehensive category storage
        memory_events = []
        for operation in operations:
            # Store in appropriate category
            if operation.get('category') and operation.get('subcategory'):
                success = self.store_memory_item(
                    category=operation['category'],
                    subcategory=operation['subcategory'],
                    key=operation.get('key', operation['fact_type']),
                    value=operation['value'],
                    metadata={
                        'confidence': operation.get('confidence', 0.8),
                        'source': operation.get('source', 'conversation'),
                        'relationships': operation.get('relationships', []),
                        'privacy_level': operation.get('privacy_level', 'normal'),
                        'session_id': session_id,
                        'emotional_context': emotional_context.sentiment if emotional_context else None
                    }
                )

                if success:
                    # Create memory event for tracking
                    enhanced_event = self._create_comprehensive_memory_event(operation, timestamp, emotional_context)
                    if enhanced_event:
                        memory_events.append(enhanced_event)
                        self.data["memory_events"].append(asdict(enhanced_event))
            else:
                # Fallback to legacy processing
                enhanced_event = self._execute_enhanced_operation(operation, timestamp, emotional_context)
                if enhanced_event:
                    memory_events.append(enhanced_event)
                    self.data["memory_events"].append(asdict(enhanced_event))

        # Detect and resolve conflicts
        self._detect_and_resolve_conflicts(memory_events)

        # Update relationships and importance scores
        self._update_memory_relationships()
        self._update_importance_scores()

        # Display memory operations in real-time
        if memory_events:
            self._display_memory_operations(memory_events)

        # Detect and store search behavior preferences
        search_preferences = self.detect_and_store_search_preferences(user_message, context)
        if search_preferences:
            memory_events.extend([{
                'type': 'BEHAVIORAL_ADAPTATION',
                'category': 'search_external_info',
                'summary': f"Learned {len(search_preferences)} search preferences",
                'timestamp': timestamp,
                'preferences': search_preferences
            }])

        # Detect patterns (periodic)
        if len(self.data["memory_events"]) % 10 == 0:  # Every 10 events
            self._detect_memory_patterns()

        # Save memory
        self.save_memory()

        return {
            'memory_operations': len(memory_events),
            'operations': [asdict(event) if hasattr(event, '__dataclass_fields__') else event for event in memory_events],
            'emotional_context': asdict(emotional_context),
            'timestamp': timestamp
        }

    def _execute_operation(self, operation: Dict, timestamp: str) -> Optional[MemoryEvent]:
        """Execute a memory operation with historical tracking"""
        op_type = operation['type']
        fact_type = operation['fact_type']
        value = operation['value']
        previous_value = operation.get('previous_value')

        if op_type == MemoryEventType.ADD.value:
            # Only add if not already exists or if it's different
            current_value = self.data["current_facts"].get(fact_type)

            if current_value is None or current_value != value:
                # Store historical value
                self._add_to_history(fact_type, value, timestamp, "current")

                # Update current facts
                self.data["current_facts"][fact_type] = value

                # Update user name if it's a name
                if fact_type == 'name':
                    self.data["user"]["name"] = value

                # Create summary based on fact type
                summary = self._create_add_summary(fact_type, value)
                return MemoryEvent(type=op_type, summary=summary, timestamp=timestamp)

        elif op_type == MemoryEventType.UPDATE.value:
            # Update existing fact with historical tracking
            old_value = self.data["current_facts"].get(fact_type)

            if old_value != value:
                # Mark previous value as historical
                if old_value is not None:
                    self._mark_as_previous(fact_type, old_value)

                # Add new value as current
                self._add_to_history(fact_type, value, timestamp, "current")

                # Update current facts
                self.data["current_facts"][fact_type] = value

                # Special handling for company updates - move old company to previous_company
                if fact_type == 'company' and old_value is not None:
                    self.data["current_facts"]["previous_company"] = old_value

                # Special handling for boundaries - append instead of replace
                if fact_type == 'boundaries' and old_value is not None:
                    # Combine old and new boundaries
                    if isinstance(old_value, str) and old_value.strip():
                        combined_boundaries = f"{old_value}; {value}"
                        self.data["current_facts"][fact_type] = combined_boundaries
                    else:
                        self.data["current_facts"][fact_type] = value
                elif fact_type != 'boundaries':
                    # Normal update for other fact types (boundaries already handled above)
                    self.data["current_facts"][fact_type] = value

                # Update user name if it's a name
                if fact_type == 'name':
                    self.data["user"]["name"] = value

                # Create summary with previous and updated values
                summary = self._create_update_summary(fact_type, old_value, value)
                return MemoryEvent(type=op_type, summary=summary, timestamp=timestamp)

        elif op_type == MemoryEventType.DELETE.value:
            # Delete fact but preserve in history
            if fact_type in self.data["current_facts"]:
                deleted_value = self.data["current_facts"][fact_type]

                # Mark as deleted in history
                self._mark_as_previous(fact_type, deleted_value)

                # Remove from current facts
                del self.data["current_facts"][fact_type]

                summary = f"Deleted user's {fact_type}: {deleted_value}."
                return MemoryEvent(type=op_type, summary=summary, timestamp=timestamp)

        elif op_type == MemoryEventType.CONFIRM.value:
            # Handle confirmation operations - reinforce existing memories
            if value == 'general confirmation':
                summary = f"User confirmed previous information."
            else:
                summary = f"User confirmed: {value} is still their priority."

            return MemoryEvent(type=op_type, summary=summary, timestamp=timestamp)

        return None

    def _execute_enhanced_operation(self, operation: Dict, timestamp: str, emotional_context: EmotionalContext) -> Optional[MemoryEvent]:
        """Execute operation with enhanced semantic and emotional processing"""
        op_type = operation['type']
        fact_type = operation['fact_type']
        value = operation['value']

        if op_type == MemoryEventType.ADD.value:
            current_value = self.data["current_facts"].get(fact_type)

            if current_value is None or current_value != value:
                # Analyze semantic context
                semantic_context = self.semantic_engine.analyze_semantic_relationships(
                    value, self.data["current_facts"]
                )

                # Store with enhanced context
                self._add_to_history(fact_type, value, timestamp, "current")
                self.data["current_facts"][fact_type] = value

                # Update user name if it's a name
                if fact_type == 'name':
                    self.data["user"]["name"] = value

                # Create enhanced memory event
                summary = self._create_add_summary(fact_type, value)
                return MemoryEvent(
                    type=op_type,
                    summary=summary,
                    timestamp=timestamp,
                    emotional_context=emotional_context,
                    semantic_context=semantic_context,
                    importance_score=self._calculate_fact_importance(fact_type, value)
                )

        elif op_type == MemoryEventType.UPDATE.value:
            old_value = self.data["current_facts"].get(fact_type)

            if old_value != value:
                # Analyze semantic context
                semantic_context = self.semantic_engine.analyze_semantic_relationships(
                    value, self.data["current_facts"]
                )

                # Mark previous value as historical
                if old_value is not None:
                    self._mark_as_previous(fact_type, old_value)

                # Add new value as current
                self._add_to_history(fact_type, value, timestamp, "current")
                self.data["current_facts"][fact_type] = value

                # Update user name if it's a name
                if fact_type == 'name':
                    self.data["user"]["name"] = value

                # Create enhanced memory event
                summary = self._create_update_summary(fact_type, old_value, value)
                return MemoryEvent(
                    type=op_type,
                    summary=summary,
                    timestamp=timestamp,
                    emotional_context=emotional_context,
                    semantic_context=semantic_context,
                    importance_score=self._calculate_fact_importance(fact_type, value)
                )

        return None

    def _calculate_fact_importance(self, fact_type: str, value: str) -> float:
        """Calculate importance score for a fact"""
        importance = 0.5  # Base importance

        # Name and core identity facts are more important
        if fact_type in ['name', 'age', 'occupation']:
            importance += 0.3

        # Facts with emotional context are more important
        if any(emotion in value.lower() for emotion in ['love', 'hate', 'excited', 'passionate']):
            importance += 0.2

        # Professional facts are important
        if fact_type == 'occupation' or any(tech in value.lower() for tech in ['python', 'javascript', 'programming']):
            importance += 0.2

        return min(importance, 1.0)

    def _detect_and_resolve_conflicts(self, memory_events: List[MemoryEvent]):
        """Detect and resolve conflicts in memory"""
        for event in memory_events:
            if hasattr(event, 'semantic_context') and event.semantic_context:
                # Check for conflicts with existing facts
                conflicts = self.conflict_resolver.detect_contradictions(
                    str(event.summary), self.data["current_facts"]
                )

                if conflicts:
                    print(f"⚠️  Conflict detected: {conflicts[0].suggested_resolution}")

    def _update_memory_relationships(self):
        """Update relationships between facts"""
        facts = self.data["current_facts"]

        # Simple relationship detection
        for fact1_key, fact1_value in facts.items():
            for fact2_key, fact2_value in facts.items():
                if fact1_key != fact2_key:
                    similarity = self.semantic_engine._calculate_semantic_similarity(
                        str(fact1_value).lower(), str(fact2_value).lower()
                    )

                    if similarity > 0.3:
                        relationship_key = f"{fact1_key}-{fact2_key}"
                        if relationship_key not in self.memory_graph:
                            self.memory_graph[relationship_key] = {
                                'strength': similarity,
                                'type': 'related_to',
                                'created_at': datetime.now().isoformat()
                            }

    def _update_importance_scores(self):
        """Update importance scores for all facts"""
        for fact_key, fact_value in self.data["current_facts"].items():
            # Calculate access frequency (simplified)
            access_count = len([event for event in self.data["memory_events"]
                              if fact_key in str(event.get('summary', ''))])

            # Calculate recency score
            recent_events = [event for event in self.data["memory_events"][-10:]
                           if fact_key in str(event.get('summary', ''))]
            recency_score = len(recent_events) / 10.0

            # Store importance score
            self.importance_scores[fact_key] = {
                'access_frequency': access_count,
                'recency_score': recency_score,
                'final_importance': (access_count * 0.3 + recency_score * 0.7)
            }

    def _detect_memory_patterns(self):
        """Detect patterns in memory evolution"""
        # Simple pattern detection for career progression
        occupation_history = self.data.get("fact_history", {}).get("occupation", [])

        if len(occupation_history) >= 2:
            pattern = MemoryPattern(
                pattern_type="career_progression",
                confidence=0.8,
                supporting_evidence=[entry["value"] for entry in occupation_history],
                predicted_next_steps=["Senior role", "Management position", "Specialization"]
            )

            if pattern not in self.patterns:
                self.patterns.append(pattern)
                print(f"🔍 Pattern detected: Career progression from {occupation_history[0]['value']} to {occupation_history[-1]['value']}")

    def get_semantic_insights(self) -> Dict[str, Any]:
        """Get semantic insights about user's information"""
        insights = {
            'related_concepts': {},
            'context_analysis': {},
            'relationship_strength': {}
        }

        # Analyze relationships
        for relationship_key, relationship_data in self.memory_graph.items():
            fact1, fact2 = relationship_key.split('-')
            insights['relationship_strength'][f"{fact1} ↔ {fact2}"] = relationship_data['strength']

        # Analyze context distribution
        context_counts = defaultdict(int)
        for fact_key, fact_value in self.data["current_facts"].items():
            context = self.semantic_engine._detect_context_type(str(fact_value))
            context_counts[context] += 1

        insights['context_analysis'] = dict(context_counts)

        return insights

    def get_emotional_timeline(self) -> List[Dict[str, Any]]:
        """Get emotional timeline of memories"""
        emotional_events = []

        for event in self.data["memory_events"]:
            if isinstance(event, dict) and 'emotional_context' in event:
                emotional_events.append({
                    'timestamp': event.get('timestamp'),
                    'sentiment': event['emotional_context'].get('sentiment'),
                    'emotions': event['emotional_context'].get('emotion_tags', []),
                    'intensity': event['emotional_context'].get('emotional_intensity', 0.5),
                    'summary': event.get('summary')
                })

        return emotional_events

    def end_session(self):
        """End the current conversation session"""
        self._end_current_session()
        self.save_memory()

    def _add_to_history(self, fact_type: str, value: Any, timestamp: str, status: str):
        """Add a value to the historical tracking"""
        if fact_type not in self.data["fact_history"]:
            self.data["fact_history"][fact_type] = []

        historical_value = {
            "value": value,
            "timestamp": timestamp,
            "status": status,
            "confidence": 0.8
        }

        self.data["fact_history"][fact_type].append(historical_value)

    def _mark_as_previous(self, fact_type: str, value: Any):
        """Mark existing values as previous in history"""
        if fact_type in self.data["fact_history"]:
            for historical_value in self.data["fact_history"][fact_type]:
                if historical_value["value"] == value and historical_value["status"] == "current":
                    historical_value["status"] = "previous"
                    break

    def _create_add_summary(self, fact_type: str, value: str) -> str:
        """Create summary for ADD operations"""
        if fact_type == 'name':
            return f"User's name is {value}."
        elif fact_type == 'age':
            return f"User is {value} years old."
        elif fact_type == 'occupation':
            return f"User works as {value}."
        elif fact_type == 'location':
            return f"User lives in {value}."
        elif fact_type == 'interests':
            return f"User is interested in {value}."
        else:
            return f"User's {fact_type} is {value}."

    def _create_update_summary(self, fact_type: str, old_value: str, new_value: str) -> str:
        """Create summary for UPDATE operations"""
        if fact_type == 'name':
            previous = f"User's name was {old_value}." if old_value else "User's name was unknown."
            updated = f"User's name is {new_value}."
            return f"Updated name: {previous} → {updated}"
        elif fact_type == 'age':
            previous = f"User was {old_value} years old." if old_value else "User's age was unknown."
            updated = f"User is {new_value} years old."
            return f"Updated age: {previous} → {updated}"
        elif fact_type == 'occupation':
            previous = f"User worked as {old_value}." if old_value else "User's occupation was unknown."
            updated = f"User works as {new_value}."
            return f"Updated occupation: {previous} → {updated}"
        elif fact_type == 'location':
            previous = f"User lived in {old_value}." if old_value else "User's location was unknown."
            updated = f"User lives in {new_value}."
            return f"Updated location: {previous} → {updated}"
        elif fact_type == 'interests':
            previous = f"User was interested in {old_value}." if old_value else "User's interests were unknown."
            updated = f"User is interested in {new_value}."
            return f"Updated interests: {previous} → {updated}"
        else:
            previous = f"User's {fact_type} was {old_value}." if old_value else f"User's {fact_type} was unknown."
            updated = f"User's {fact_type} is {new_value}."
            return f"Updated {fact_type}: {previous} → {updated}"

    def _display_memory_operations(self, operations: List[MemoryEvent]) -> None:
        """Display comprehensive memory operations in real-time with detailed tracking"""
        if not operations:
            return

        print("\n🧠 Memory Update:")
        for event in operations:
            op_type = event.type
            category = getattr(event, 'category', 'unknown')
            subcategory = getattr(event, 'subcategory', 'general')
            current_value = getattr(event, 'current_value', None)
            previous_value = getattr(event, 'previous_value', None)

            # Format category display
            category_display = category.replace('_', ' ').title() if category and category != 'unknown' else 'General'

            if op_type == MemoryEventType.ADD.value:
                if category == 'user_identity' and subcategory == 'name':
                    print(f"current_name = \"{current_value or event.summary.split(': ')[-1]}\"")
                    print(f"Memory log: \"User introduced themselves as {current_value or event.summary.split(': ')[-1]}\"")
                elif category == 'personal_preferences':
                    print(f"{subcategory}_preference = \"{current_value or event.summary.split(': ')[-1]}\"")
                    print(f"Memory log: \"Added user preference: {event.summary}\"")
                elif category == 'task_project_tracking':
                    print(f"current_project = \"{current_value or event.summary.split(': ')[-1]}\"")
                    print(f"Memory log: \"User working on: {event.summary}\"")
                else:
                    print(f"{category}.{subcategory} = \"{current_value or event.summary.split(': ')[-1]}\"")
                    print(f"Memory log: \"Added {category_display}: {event.summary}\"")

            elif op_type == MemoryEventType.UPDATE.value:
                if category == 'user_identity' and subcategory == 'name':
                    print(f"current_name = \"{current_value or event.summary.split(' → ')[-1]}\"")
                    if previous_value:
                        print(f"past_names[] += \"{previous_value}\"")
                    print(f"Memory log: \"User changed name from {previous_value or 'unknown'} to {current_value or event.summary.split(' → ')[-1]}\"")
                elif category == 'task_project_tracking' and 'work' in subcategory:
                    print(f"current_work = \"{current_value or event.summary.split(' → ')[-1]}\"")
                    if previous_value:
                        print(f"past_work[] += \"{previous_value}\"")
                    print(f"Memory log: \"User changed work from {previous_value or 'unknown'} to {current_value or event.summary.split(' → ')[-1]}\"")
                elif category == 'current_state':
                    print(f"current_{subcategory} = \"{current_value or event.summary.split(' → ')[-1]}\"")
                    print(f"Memory log: \"User state updated: {event.summary}\"")
                else:
                    print(f"{category}.{subcategory} = \"{current_value or event.summary.split(' → ')[-1]}\"")
                    if previous_value:
                        print(f"previous_{subcategory} = \"{previous_value}\"")
                    print(f"Memory log: \"Updated {category_display}: {event.summary}\"")

            elif op_type == MemoryEventType.CONFIRM.value:
                print(f"confirmed_{subcategory} = \"{current_value or event.summary.split(': ')[-1]}\"")
                print(f"Memory log: \"User confirmed: {event.summary}\"")

            elif op_type == MemoryEventType.DELETE.value:
                print(f"deleted_{subcategory} = \"{previous_value or 'unknown'}\"")
                print(f"Memory log: \"Removed {category_display}: {event.summary}\"")

            else:
                print(f"→ [{op_type}] {category_display}: {event.summary}")

        print()  # Add spacing after memory operations

    def recall_historical_information(self, query: str) -> Dict[str, Any]:
        """Recall historical information based on natural language queries"""
        query_lower = query.lower()
        results = []

        # Detect what type of historical information is being requested
        if any(phrase in query_lower for phrase in ['old name', 'previous name', 'used to be called', 'former name']):
            results.extend(self._get_historical_values('name', 'previous'))

        elif any(phrase in query_lower for phrase in ['old job', 'previous job', 'used to work', 'former occupation', 'old work']):
            results.extend(self._get_historical_values('occupation', 'previous'))

        elif any(phrase in query_lower for phrase in ['old interests', 'previous interests', 'used to like', 'former hobbies']):
            results.extend(self._get_historical_values('interests', 'previous'))

        elif any(phrase in query_lower for phrase in ['what changed', 'what have i changed', 'updates', 'modifications']):
            results.extend(self._get_all_changes())

        elif any(phrase in query_lower for phrase in ['timeline', 'history', 'evolution', 'over time']):
            results.extend(self._get_timeline())

        elif any(phrase in query_lower for phrase in ['talking about', 'discussed', 'conversation', 'we talked', 'first', 'earlier']):
            # This is a conversation history query - add conversation context
            conversation_results = self._get_conversation_summary(query_lower)
            results.extend(conversation_results)

        else:
            # General historical search
            for fact_type in self.data["fact_history"]:
                if fact_type in query_lower:
                    results.extend(self._get_historical_values(fact_type, 'all'))

            # If no fact history found, try conversation history
            if not results:
                conversation_results = self._get_conversation_summary(query_lower)
                results.extend(conversation_results)

        return {
            'found': len(results) > 0,
            'results': results,
            'query': query
        }

    def _get_historical_values(self, fact_type: str, status_filter: str = 'all') -> List[Dict]:
        """Get historical values for a specific fact type"""
        results = []

        if fact_type in self.data["fact_history"]:
            history = self.data["fact_history"][fact_type]

            for entry in history:
                if status_filter == 'all' or entry["status"] == status_filter:
                    results.append({
                        'fact_type': fact_type,
                        'value': entry["value"],
                        'timestamp': entry["timestamp"],
                        'status': entry["status"],
                        'formatted_time': self._format_timestamp(entry["timestamp"])
                    })

        return results

    def _get_all_changes(self) -> List[Dict]:
        """Get all changes made to facts over time, including recent memory events"""
        changes = []

        # Get changes from fact history
        for fact_type, history in self.data["fact_history"].items():
            if len(history) > 1:  # Only include facts that have changed
                previous_values = [entry for entry in history if entry["status"] == "previous"]
                current_values = [entry for entry in history if entry["status"] == "current"]

                if previous_values and current_values:
                    changes.append({
                        'fact_type': fact_type,
                        'previous_value': previous_values[-1]["value"],  # Most recent previous
                        'current_value': current_values[-1]["value"],   # Current value
                        'change_time': current_values[-1]["timestamp"],
                        'formatted_time': self._format_timestamp(current_values[-1]["timestamp"]),
                        'source': 'fact_history'
                    })

        # Also get recent UPDATE events from memory events
        recent_updates = []
        for event in reversed(self.data.get("memory_events", [])):  # Most recent first
            if isinstance(event, dict) and event.get('type') == 'UPDATE':
                # Extract information from the event
                summary = event.get('summary', '')
                timestamp = event.get('timestamp', '')
                category = event.get('category', 'unknown')

                # Parse the summary to get previous and current values
                if ' → ' in summary:
                    parts = summary.split(' → ')
                    if len(parts) == 2:
                        previous_part = parts[0].split(': ')[-1] if ': ' in parts[0] else parts[0]
                        current_part = parts[1]

                        recent_updates.append({
                            'fact_type': category,
                            'previous_value': previous_part,
                            'current_value': current_part,
                            'change_time': timestamp,
                            'formatted_time': self._format_timestamp(timestamp),
                            'source': 'memory_events'
                        })

        # Combine and sort by timestamp (most recent first)
        all_changes = changes + recent_updates
        all_changes.sort(key=lambda x: x.get("change_time", ""), reverse=True)

        return all_changes

    def _get_timeline(self) -> List[Dict]:
        """Get a chronological timeline of all changes"""
        timeline = []

        for fact_type, history in self.data["fact_history"].items():
            for entry in history:
                timeline.append({
                    'fact_type': fact_type,
                    'value': entry["value"],
                    'timestamp': entry["timestamp"],
                    'status': entry["status"],
                    'formatted_time': self._format_timestamp(entry["timestamp"])
                })

        # Sort by timestamp
        timeline.sort(key=lambda x: x["timestamp"])
        return timeline

    def _get_conversation_summary(self, query_lower: str) -> List[Dict]:
        """Get conversation history summary based on query"""
        results = []
        conversations = self.data.get('conversation', [])

        if not conversations:
            return results

        try:
            if 'first' in query_lower or 'beginning' in query_lower:
                # Get first user messages
                first_messages = conversations[:6]  # First 3 exchanges
                user_messages = [msg for msg in first_messages if msg.get('role') == 'user']
                if user_messages:
                    first_content = user_messages[0].get('content', '')
                    timestamp = user_messages[0].get('timestamp', '')
                    results.append({
                        'fact_type': 'conversation',
                        'value': f"First topic: {first_content}",
                        'timestamp': timestamp,
                        'formatted_time': self._format_timestamp(timestamp) if timestamp else 'unknown time'
                    })

            elif 'last' in query_lower or 'recent' in query_lower:
                # Get recent user messages
                recent_messages = conversations[-6:]  # Last 3 exchanges
                user_messages = [msg for msg in recent_messages if msg.get('role') == 'user']
                if user_messages:
                    last_content = user_messages[-1].get('content', '')
                    timestamp = user_messages[-1].get('timestamp', '')
                    results.append({
                        'fact_type': 'conversation',
                        'value': f"Recent topic: {last_content}",
                        'timestamp': timestamp,
                        'formatted_time': self._format_timestamp(timestamp) if timestamp else 'unknown time'
                    })

            else:
                # General conversation topics
                user_messages = [msg for msg in conversations if msg.get('role') == 'user']
                if user_messages:
                    # Get recent topics (last 3-5 messages)
                    recent_topics = user_messages[-3:] if len(user_messages) >= 3 else user_messages
                    topics = []
                    for msg in recent_topics:
                        content = msg.get('content', '')
                        if len(content) > 50:
                            content = content[:50] + "..."
                        topics.append(content)

                    if topics:
                        latest_timestamp = user_messages[-1].get('timestamp', '') if user_messages else ''
                        results.append({
                            'fact_type': 'conversation',
                            'value': f"Recent topics: {', '.join(topics)}",
                            'timestamp': latest_timestamp,
                            'formatted_time': self._format_timestamp(latest_timestamp) if latest_timestamp else 'unknown time'
                        })

        except Exception as e:
            print(f"Error getting conversation summary: {e}")

        return results

    def get_dynamic_conversation_context(self) -> Dict[str, Any]:
        """Get comprehensive dynamic context for authentic response generation"""
        context = {
            'user_profile': self.data.get('user', {}),
            'current_facts': self.data.get('current_facts', {}),
            'conversation_messages': self.data.get('conversation', []),
            'session_data': self.data.get('sessions', {}),
            'current_session_id': self.data.get('current_session'),
            'conversation_state': self.data.get('conversation_state', {}),
            'memory_events': self.data.get('memory_events', []),
            'relationship_timeline': self._build_relationship_timeline(),
            'conversation_themes': self._extract_conversation_themes(),
            'interaction_patterns': self._analyze_interaction_patterns()
        }

        return context

    def _build_relationship_timeline(self) -> List[Dict[str, Any]]:
        """Build timeline of relationship development from actual data"""
        timeline = []

        # Add session milestones
        sessions = self.data.get('sessions', {})
        for session_id, session_data in sessions.items():
            if session_data.get('end_time'):  # Completed sessions
                timeline.append({
                    'type': 'session',
                    'timestamp': session_data['start_time'],
                    'description': f"Conversation session ({session_data.get('session_duration', 'unknown duration')})",
                    'topics': session_data.get('topics_discussed', [])
                })

        # Add memory events
        for event in self.data.get('memory_events', []):
            if isinstance(event, dict):
                timeline.append({
                    'type': 'memory_event',
                    'timestamp': event.get('timestamp', ''),
                    'description': event.get('summary', 'Memory update'),
                    'event_type': event.get('type', 'unknown')
                })

        # Sort by timestamp
        timeline.sort(key=lambda x: x.get('timestamp', ''))
        return timeline

    def _extract_conversation_themes(self) -> List[str]:
        """Extract main themes from actual conversation history"""
        themes = set()
        conversations = self.data.get('conversation', [])

        # Analyze user messages for themes
        user_messages = [msg.get('content', '').lower() for msg in conversations
                        if msg.get('role') == 'user']

        # Theme detection based on actual content
        theme_keywords = {
            'work': ['work', 'job', 'career', 'office', 'project', 'meeting'],
            'technology': ['python', 'javascript', 'programming', 'code', 'ai', 'machine learning'],
            'personal': ['family', 'home', 'weekend', 'vacation', 'hobby'],
            'learning': ['learn', 'study', 'course', 'book', 'tutorial', 'practice'],
            'interests': ['enjoy', 'love', 'like', 'hobby', 'passion', 'interest']
        }

        for message in user_messages:
            for theme, keywords in theme_keywords.items():
                if any(keyword in message for keyword in keywords):
                    themes.add(theme)

        return list(themes)

    def _analyze_interaction_patterns(self) -> Dict[str, Any]:
        """Analyze patterns in actual interactions"""
        conversations = self.data.get('conversation', [])

        if not conversations:
            return {'total_exchanges': 0, 'avg_message_length': 0, 'interaction_frequency': 'new'}

        user_messages = [msg for msg in conversations if msg.get('role') == 'user']

        # Calculate actual interaction metrics
        total_exchanges = len(user_messages)
        avg_length = sum(len(msg.get('content', '')) for msg in user_messages) / max(len(user_messages), 1)

        # Determine interaction frequency based on session data
        sessions = self.data.get('sessions', {})
        if len(sessions) > 5:
            frequency = 'frequent'
        elif len(sessions) > 2:
            frequency = 'regular'
        else:
            frequency = 'occasional'

        return {
            'total_exchanges': total_exchanges,
            'avg_message_length': round(avg_length),
            'interaction_frequency': frequency,
            'session_count': len(sessions)
        }

    def _format_timestamp(self, timestamp: str) -> str:
        """Format timestamp for human readability"""
        try:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            now = datetime.now()

            # Calculate time difference
            diff = now - dt.replace(tzinfo=None)

            if diff.days > 0:
                return f"{diff.days} days ago"
            elif diff.seconds > 3600:
                hours = diff.seconds // 3600
                return f"{hours} hours ago"
            elif diff.seconds > 60:
                minutes = diff.seconds // 60
                return f"{minutes} minutes ago"
            else:
                return "just now"
        except:
            return timestamp
    
    def retrieve_fact(self, query: str) -> Optional[Dict[str, Any]]:
        """Retrieve specific fact when Nova forgets - On-demand lookup"""
        query_lower = query.lower()

        # Direct key lookup
        if query_lower in self.facts_storage:
            fact = self.facts_storage[query_lower]
            fact.last_accessed = datetime.now().isoformat()
            fact.access_count += 1
            return {
                'key': fact.key,
                'value': fact.value,
                'category': fact.category,
                'confidence': fact.confidence
            }

        # Fuzzy search through facts
        for key, fact in self.facts_storage.items():
            if query_lower in key.lower() or query_lower in str(fact.value).lower():
                fact.last_accessed = datetime.now().isoformat()
                fact.access_count += 1
                return {
                    'key': fact.key,
                    'value': fact.value,
                    'category': fact.category,
                    'confidence': fact.confidence
                }

        return None

    def get_user_context(self, context_type: str = "basic") -> Dict[str, Any]:
        """Get user context for Nova - Feeds missing info back automatically"""
        context = {
            'user_id': self.user_id,
            'facts': {},
            'recent_conversations': [],
            'summary': ""
        }

        # Organize facts by category from current_facts
        for fact_key, fact_value in self.data.get("current_facts", {}).items():
            # Extract category from fact key (e.g., "personal_info.name" -> "personal_info")
            if '.' in fact_key:
                category = fact_key.split('.')[0]
            else:
                category = 'general'

            if category not in context['facts']:
                context['facts'][category] = {}
            context['facts'][category][fact_key] = fact_value

        # Get recent conversations from conversation data
        conversations = self.data.get('conversation', [])
        if conversations:
            # Group by date and get recent ones
            recent_conversations = conversations[-10:]  # Last 10 messages
            context['recent_conversations'] = [
                {
                    'role': msg.get('role', 'unknown'),
                    'content': msg.get('content', ''),
                    'timestamp': msg.get('timestamp', '')
                }
                for msg in recent_conversations
            ]

        # Create summary
        total_facts = len(self.data.get("current_facts", {}))
        context['summary'] = f"User has {total_facts} stored facts across {len(context['facts'])} categories"

        return context

    def query_memory(self, question: str) -> Dict[str, Any]:
        """Query memory for specific information - When Nova needs help"""
        question_lower = question.lower()
        results = []

        # Check for specific question patterns
        if any(word in question_lower for word in ['name', 'called']):
            name_fact = self.retrieve_fact('name')
            if name_fact:
                results.append(f"User's name is {name_fact['value']}")

        if any(word in question_lower for word in ['age', 'old']):
            age_fact = self.retrieve_fact('age')
            if age_fact:
                results.append(f"User is {age_fact['value']} years old")

        if any(word in question_lower for word in ['work', 'job', 'occupation']):
            job_fact = self.retrieve_fact('occupation')
            if job_fact:
                results.append(f"User works as {job_fact['value']}")

        if any(word in question_lower for word in ['like', 'interest', 'hobby']):
            for key, fact in self.facts_storage.items():
                if fact.category == 'interests':
                    results.append(f"User is interested in {fact.value}")

        return {
            'found': len(results) > 0,
            'results': results,
            'total_facts': len(self.facts_storage)
        }

    def optimize_memory(self):
        """Optimize memory storage - Compression and consolidation"""
        # Remove old conversation logs (keep last 30 days)
        cutoff_date = (datetime.now() - timedelta(days=30)).date()
        old_dates = [date_str for date_str in self.conversation_logs.keys()
                    if datetime.fromisoformat(date_str).date() < cutoff_date]

        for date_str in old_dates:
            del self.conversation_logs[date_str]

        # Update access counts and remove rarely accessed facts
        rarely_accessed = [key for key, fact in self.facts_storage.items()
                          if fact.access_count == 0 and
                          (datetime.now() - datetime.fromisoformat(fact.created_at)).days > 7]

        for key in rarely_accessed:
            del self.facts_storage[key]

        print(f"🧹 Memory optimized: Removed {len(old_dates)} old logs and {len(rarely_accessed)} unused facts")
        self.save_all_data()


    def get_memory_context(self, query: str = "") -> Dict[str, Any]:
        """Get memory context for AI response generation"""
        return {
            'user_info': self.data["user"],
            'current_facts': self.data["current_facts"],
            'recent_events': self.data["memory_events"][-5:],
            'conversation_history': self.data["conversation"][-10:]
        }

    def get_full_memory_json(self) -> Dict[str, Any]:
        """Get the complete memory in enhanced JSON format with historical data"""
        return {
            "user": self.data["user"],
            "memory_events": self.data["memory_events"],
            "conversation": self.data["conversation"],
            "current_facts": self.data["current_facts"],
            "fact_history": self.data["fact_history"]
        }

    def get_memory_stats(self) -> Dict[str, Any]:
        """Get memory statistics"""
        return {
            'total_facts': len(self.data["current_facts"]),
            'total_events': len(self.data["memory_events"]),
            'total_messages': len(self.data["conversation"]),
            'user_id': self.data["user"]["user_id"],
            'user_name': self.data["user"]["name"],
            'facts_breakdown': {
                fact_type: value for fact_type, value in self.data["current_facts"].items()
            }
        }

    def load_memory(self):
        """Load memory from storage file and migrate to historical structure"""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r', encoding='utf-8') as f:
                    loaded_data = json.load(f)

                # Merge with existing structure
                self.data.update(loaded_data)

                # Ensure fact_history exists
                if "fact_history" not in self.data:
                    self.data["fact_history"] = {}

                # Migrate existing current_facts to historical structure if needed
                self._migrate_existing_facts_to_history()

                # Silently loaded memory from file
                pass
            else:
                # Silently creating new memory file
                pass
        except Exception as e:
            # Silently handle memory loading error
            pass

    def _migrate_existing_facts_to_history(self):
        """Migrate existing facts to historical structure if they don't have history"""
        current_time = datetime.now().isoformat()

        for fact_type, value in self.data.get("current_facts", {}).items():
            if fact_type not in self.data["fact_history"]:
                # Create historical entry for existing fact
                self.data["fact_history"][fact_type] = [{
                    "value": value,
                    "timestamp": current_time,
                    "status": "current",
                    "confidence": 0.8
                }]

    def search_external_information(self, query: str, auto_store: bool = True) -> Dict[str, Any]:
        """
        Search for external information using SerpAPI with user preferences

        Args:
            query: Search query string
            auto_store: Whether to automatically store search results and preferences

        Returns:
            Dict containing search results and metadata
        """
        try:
            # Get user's search preferences from memory
            search_category = self.data["memory_categories"].get(MemoryCategory.SEARCH_EXTERNAL_INFO.value, {})

            # Apply learned behavioral preferences to query
            enhanced_params = self.apply_search_preferences_to_query(query, search_category)

            # Extract search preferences (enhanced with behavioral adaptations)
            search_preferences = self._extract_search_preferences(search_category)
            search_preferences.update({
                "search_depth": enhanced_params["search_depth"],
                "detail_level": enhanced_params["detail_level"]
            })

            user_sources = self._extract_source_preferences(search_category)
            user_sources.update(enhanced_params["source_filters"])

            # Check if we should search (avoid repetition)
            if not self._should_perform_search(query, search_category):
                recent_result = self._get_recent_search_result(query, search_category)
                if recent_result:
                    return recent_result

            # Execute search
            search_results = self.search_engine.search(query, search_preferences, user_sources)

            # Store search history and results if auto_store is enabled
            if auto_store and not search_results.get("error"):
                self._store_search_results(query, search_results)

            # Display search operation
            if not search_results.get("error"):
                self._display_search_operation(query, search_results)

            return search_results

        except Exception as e:
            return {
                "error": f"Search failed: {str(e)}",
                "query": query,
                "timestamp": datetime.now().isoformat(),
                "results": []
            }

    def _extract_search_preferences(self, search_category: Dict) -> Dict[str, Any]:
        """Extract user's search preferences from stored memory"""
        preferences = {
            "search_depth": "moderate",
            "auto_search_enabled": False,
            "news_frequency": "none",
            "news_delivery_style": "summarize"
        }

        for item in search_category.values():
            if item.get("subcategory") == "search_preferences":
                value = str(item.get("value", "")).lower()
                if "deep" in value:
                    preferences["search_depth"] = "deep"
                elif "shallow" in value:
                    preferences["search_depth"] = "shallow"
                elif "auto" in value and "search" in value:
                    preferences["auto_search_enabled"] = True

        return preferences

    def _extract_source_preferences(self, search_category: Dict) -> Dict[str, List[str]]:
        """Extract user's preferred and disliked sources"""
        sources = {
            "preferred_sources": [],
            "disliked_sources": []
        }

        for item in search_category.values():
            subcategory = item.get("subcategory", "")
            value = str(item.get("value", ""))

            if subcategory == "preferred_sources":
                sources["preferred_sources"].extend([s.strip() for s in value.split(",")])
            elif subcategory == "disliked_sources":
                sources["disliked_sources"].extend([s.strip() for s in value.split(",")])

        return sources

    def _should_perform_search(self, query: str, search_category: Dict) -> bool:
        """Determine if we should perform a new search or use cached results"""
        # Check for recent identical searches (within last hour)
        current_time = datetime.now()

        for item in search_category.values():
            if item.get("subcategory") == "search_history":
                stored_data = item.get("value", {})
                if isinstance(stored_data, dict):
                    stored_query = stored_data.get("query", "")
                    stored_time = stored_data.get("timestamp", "")

                    if stored_query.lower() == query.lower():
                        try:
                            search_time = datetime.fromisoformat(stored_time.replace('Z', '+00:00'))
                            time_diff = (current_time - search_time).total_seconds() / 3600  # hours

                            # Don't search again if within 1 hour for same query
                            if time_diff < 1:
                                return False
                        except:
                            pass

        return True

    def _get_recent_search_result(self, query: str, search_category: Dict) -> Optional[Dict]:
        """Get recent search result for the same query"""
        for item in search_category.values():
            if item.get("subcategory") == "search_history":
                stored_data = item.get("value", {})
                if isinstance(stored_data, dict):
                    stored_query = stored_data.get("query", "")
                    if stored_query.lower() == query.lower():
                        return stored_data.get("results", {})

        return None

    def _store_search_results(self, query: str, search_results: Dict):
        """Store search results and update user preferences"""
        timestamp = datetime.now().isoformat()

        # Store search history
        search_history_key = f"search_{hashlib.md5(query.encode()).hexdigest()[:8]}"
        self.store_memory_item(
            category=MemoryCategory.SEARCH_EXTERNAL_INFO.value,
            subcategory="search_history",
            key=search_history_key,
            value={
                "query": query,
                "timestamp": timestamp,
                "results_count": search_results.get("filtered_results_count", 0),
                "quality_score": search_results.get("search_metadata", {}).get("quality_score", 0),
                "results": search_results  # Store full results for caching
            },
            metadata={
                "confidence": 0.9,
                "source": "search_engine",
                "privacy_level": "normal",
                "session_id": self.data.get("current_session")
            }
        )

        # Update search patterns and preferences based on results
        self._learn_from_search_behavior(query, search_results)

    def _learn_from_search_behavior(self, query: str, search_results: Dict):
        """Learn from search behavior to improve future searches"""
        # Detect search topics for news tracking
        if any(word in query.lower() for word in ["news", "latest", "recent", "update"]):
            topic = query.replace("news", "").replace("latest", "").replace("recent", "").strip()
            if topic:
                self.store_memory_item(
                    category=MemoryCategory.SEARCH_EXTERNAL_INFO.value,
                    subcategory="news_topics",
                    key=f"topic_{hashlib.md5(topic.encode()).hexdigest()[:8]}",
                    value=topic,
                    metadata={"confidence": 0.8, "source": "search_behavior"}
                )

    def _display_search_operation(self, query: str, search_results: Dict):
        """Display search operation in real-time memory format"""
        print(f"\n🔍 Search Operation:")
        print(f"search_query = \"{query}\"")
        print(f"results_found = {search_results.get('filtered_results_count', 0)}")
        print(f"search_quality = {search_results.get('search_metadata', {}).get('quality_score', 0):.2f}")
        print(f"Memory log: \"Searched for: {query}\"")
        print()

    def detect_and_store_search_preferences(self, message: str, context: Dict = None) -> List[Dict]:
        """
        Detect and store intelligent search behavior preferences from natural conversation.
        Handles search depth, source filtering, news delivery, and quality preferences.
        """
        message_lower = message.lower()
        detected_preferences = []

        # Detect search depth preferences
        depth_prefs = self._detect_search_depth_preferences(message, message_lower)
        detected_preferences.extend(depth_prefs)

        # Detect source preferences and constraints
        source_prefs = self._detect_source_preferences(message, message_lower)
        detected_preferences.extend(source_prefs)

        # Detect news delivery preferences
        news_prefs = self._detect_news_preferences(message, message_lower)
        detected_preferences.extend(news_prefs)

        # Detect search quality feedback
        quality_feedback = self._detect_search_quality_feedback(message, message_lower)
        detected_preferences.extend(quality_feedback)

        # Store detected preferences
        for pref in detected_preferences:
            success = self.store_memory_item(
                category=MemoryCategory.SEARCH_EXTERNAL_INFO.value,
                subcategory=pref['subcategory'],
                key=pref['key'],
                value=pref['value'],
                metadata={
                    'confidence': pref.get('confidence', 0.8),
                    'source': 'behavioral_adaptation',
                    'session_id': context.get('session_id') if context else None,
                    'behavioral_change': pref.get('behavioral_change', ''),
                    'adaptation_type': pref.get('adaptation_type', 'preference_learning')
                }
            )

            if success:
                # Display behavioral adaptation
                self._display_behavioral_adaptation(pref)

        return detected_preferences

    def _detect_search_depth_preferences(self, message: str, message_lower: str) -> List[Dict]:
        """Detect user preferences for search depth and detail level"""
        preferences = []

        # Deep search preferences
        if any(pattern in message_lower for pattern in [
            "don't give me short", "always go deep", "comprehensive", "detailed",
            "thorough", "in-depth", "extensive"
        ]):
            preferences.append({
                'subcategory': 'search_preferences',
                'key': 'search_depth',
                'value': 'deep',
                'confidence': 0.9,
                'behavioral_change': 'All future searches use deep search mode (20+ results) and provide detailed, multi-source summaries',
                'adaptation_type': 'search_depth_learning'
            })

            preferences.append({
                'subcategory': 'search_preferences',
                'key': 'detail_level',
                'value': 'comprehensive',
                'confidence': 0.9,
                'behavioral_change': 'Provide comprehensive details with multiple perspectives',
                'adaptation_type': 'detail_level_learning'
            })

        # Shallow/brief search preferences
        elif any(pattern in message_lower for pattern in [
            "brief", "quick", "short", "shallow", "summary only", "just the basics"
        ]):
            preferences.append({
                'subcategory': 'search_preferences',
                'key': 'search_depth',
                'value': 'shallow',
                'confidence': 0.85,
                'behavioral_change': 'Use shallow search mode (5-10 results) and provide concise summaries',
                'adaptation_type': 'search_depth_learning'
            })

            preferences.append({
                'subcategory': 'search_preferences',
                'key': 'detail_level',
                'value': 'summary',
                'confidence': 0.85,
                'behavioral_change': 'Provide brief summaries with key points only',
                'adaptation_type': 'detail_level_learning'
            })

        return preferences

    def _detect_source_preferences(self, message: str, message_lower: str) -> List[Dict]:
        """Detect user preferences for source filtering and constraints"""
        preferences = []

        # Detect disliked sources
        if "don't show me" in message_lower and "links" in message_lower:
            # Extract source from pattern like "don't show me YouTube links"
            import re
            match = re.search(r"don't show me (\w+) links", message_lower)
            if match:
                source = match.group(1)
                preferences.append({
                    'subcategory': 'disliked_sources',
                    'key': f'avoid_{source}',
                    'value': f'{source}.com',
                    'confidence': 0.95,
                    'behavioral_change': f'{source.title()} results are automatically filtered from search results unless explicitly requested',
                    'adaptation_type': 'source_filtering'
                })

                preferences.append({
                    'subcategory': 'search_constraints',
                    'key': f'avoid_{source}_unless_requested',
                    'value': f'Filter {source} unless explicitly requested',
                    'confidence': 0.95,
                    'behavioral_change': f'Apply conditional filtering for {source} content',
                    'adaptation_type': 'conditional_filtering'
                })

        # Detect preferred sources
        if any(pattern in message_lower for pattern in [
            "only trust", "official", "prefer", "use only"
        ]):
            if "official" in message_lower and ("docs" in message_lower or "documentation" in message_lower):
                preferences.append({
                    'subcategory': 'preferred_sources',
                    'key': 'official_documentation',
                    'value': 'official_documentation',
                    'confidence': 0.9,
                    'behavioral_change': 'For technical queries, prioritize official documentation and filter out informal sources',
                    'adaptation_type': 'source_prioritization'
                })

                if "tech" in message_lower:
                    preferences.append({
                        'subcategory': 'search_scope_rules',
                        'key': 'tech_topics_official_only',
                        'value': 'Use official documentation for technical topics',
                        'confidence': 0.9,
                        'behavioral_change': 'Technical searches prioritize official sources over blogs and forums',
                        'adaptation_type': 'scope_rule_learning'
                    })

        return preferences

    def _detect_news_preferences(self, message: str, message_lower: str) -> List[Dict]:
        """Detect user preferences for news delivery format and frequency"""
        preferences = []

        # Detect news frequency preferences
        if "when giving news" in message_lower or "news" in message_lower:
            if "weekly" in message_lower:
                preferences.append({
                    'subcategory': 'news_preferences',
                    'key': 'frequency',
                    'value': 'weekly',
                    'confidence': 0.9,
                    'behavioral_change': 'Compile and deliver weekly news digests',
                    'adaptation_type': 'news_frequency_learning'
                })
            elif "daily" in message_lower:
                preferences.append({
                    'subcategory': 'news_preferences',
                    'key': 'frequency',
                    'value': 'daily',
                    'confidence': 0.9,
                    'behavioral_change': 'Provide daily news updates',
                    'adaptation_type': 'news_frequency_learning'
                })
            elif "monthly" in message_lower:
                preferences.append({
                    'subcategory': 'news_preferences',
                    'key': 'frequency',
                    'value': 'monthly',
                    'confidence': 0.9,
                    'behavioral_change': 'Provide monthly news summaries',
                    'adaptation_type': 'news_frequency_learning'
                })

            # Detect news format preferences
            if "bullet points" in message_lower:
                preferences.append({
                    'subcategory': 'news_preferences',
                    'key': 'format',
                    'value': 'bullet_points',
                    'confidence': 0.95,
                    'behavioral_change': 'Format news in bullet-point lists',
                    'adaptation_type': 'news_format_learning'
                })

            if "summaries" in message_lower:
                preferences.append({
                    'subcategory': 'news_preferences',
                    'key': 'detail_level',
                    'value': 'summary',
                    'confidence': 0.9,
                    'behavioral_change': 'Provide summary-level news details',
                    'adaptation_type': 'news_detail_learning'
                })

        return preferences

    def _detect_search_quality_feedback(self, message: str, message_lower: str) -> List[Dict]:
        """Detect user feedback about search result quality"""
        preferences = []

        # Positive feedback patterns
        if any(pattern in message_lower for pattern in [
            "good result", "helpful", "accurate", "reliable", "perfect"
        ]):
            preferences.append({
                'subcategory': 'search_quality_feedback',
                'key': 'positive_feedback',
                'value': message,
                'confidence': 0.8,
                'behavioral_change': 'Reinforce current search strategies and source selection',
                'adaptation_type': 'quality_reinforcement'
            })

        # Negative feedback patterns
        elif any(pattern in message_lower for pattern in [
            "not helpful", "bad source", "unreliable", "wrong", "inaccurate"
        ]):
            preferences.append({
                'subcategory': 'search_quality_feedback',
                'key': 'negative_feedback',
                'value': message,
                'confidence': 0.8,
                'behavioral_change': 'Adjust search strategies and source prioritization',
                'adaptation_type': 'quality_correction'
            })

        return preferences

    def _display_behavioral_adaptation(self, preference: Dict):
        """Display behavioral adaptation in real-time memory format"""
        print(f"\n🧠 Search Behavior Adaptation:")

        subcategory = preference['subcategory']
        key = preference['key']
        value = preference['value']
        behavioral_change = preference.get('behavioral_change', '')

        print(f"{subcategory}.{key} = \"{value}\"")
        if behavioral_change:
            print(f"Behavioral Change: {behavioral_change}")
        print(f"Memory log: \"Learned search preference: {subcategory}.{key} = {value}\"")
        print()

    def apply_search_preferences_to_query(self, query: str, search_category: Dict) -> Dict[str, Any]:
        """
        Apply learned search preferences to modify search behavior for a specific query.
        Returns enhanced search parameters based on stored preferences.
        """
        enhanced_params = {
            "search_depth": "moderate",
            "detail_level": "standard",
            "source_filters": {"preferred": [], "disliked": []},
            "news_settings": {"frequency": "none", "format": "standard"},
            "quality_adjustments": []
        }

        # Apply stored preferences
        for item in search_category.values():
            subcategory = item.get('subcategory', '')
            key = item.get('key', '')
            value = item.get('value', '')

            # Apply search depth preferences
            if subcategory == 'search_preferences':
                if key == 'search_depth':
                    enhanced_params["search_depth"] = value
                elif key == 'detail_level':
                    enhanced_params["detail_level"] = value

            # Apply source preferences
            elif subcategory == 'preferred_sources':
                enhanced_params["source_filters"]["preferred"].append(value)
            elif subcategory == 'disliked_sources':
                enhanced_params["source_filters"]["disliked"].append(value)

            # Apply news preferences
            elif subcategory == 'news_preferences':
                if key == 'frequency':
                    enhanced_params["news_settings"]["frequency"] = value
                elif key == 'format':
                    enhanced_params["news_settings"]["format"] = value

            # Apply quality feedback
            elif subcategory == 'search_quality_feedback':
                enhanced_params["quality_adjustments"].append({
                    "type": key,
                    "feedback": value
                })

        return enhanced_params

    def log_search_session_behavior(self, query: str, search_results: Dict, user_interaction: str = None):
        """Log search behavior summary in session memory for continuous learning"""
        session_log = {
            "query": query,
            "timestamp": datetime.now().isoformat(),
            "results_count": search_results.get('filtered_results_count', 0),
            "quality_score": search_results.get('search_metadata', {}).get('quality_score', 0),
            "sources_used": [],
            "sources_filtered": search_results.get('search_metadata', {}).get('sources_filtered', {}),
            "user_interaction": user_interaction,
            "satisfaction_indicators": self._analyze_user_satisfaction(user_interaction) if user_interaction else {}
        }

        # Extract sources used
        for result in search_results.get('results', []):
            source_domain = result.get('source_domain', '')
            if source_domain and source_domain not in session_log["sources_used"]:
                session_log["sources_used"].append(source_domain)

        # Store session log
        session_key = f"session_{hashlib.md5(f'{query}_{datetime.now().isoformat()}'.encode()).hexdigest()[:8]}"
        self.store_memory_item(
            category=MemoryCategory.SEARCH_EXTERNAL_INFO.value,
            subcategory="session_search_logs",
            key=session_key,
            value=session_log,
            metadata={
                "confidence": 0.9,
                "source": "session_logging",
                "session_id": self.data.get("current_session")
            }
        )

    def _analyze_user_satisfaction(self, user_interaction: str) -> Dict[str, Any]:
        """Analyze user interaction to determine satisfaction with search results"""
        interaction_lower = user_interaction.lower()

        satisfaction = {
            "level": "neutral",
            "indicators": [],
            "improvement_suggestions": []
        }

        # Positive indicators
        if any(word in interaction_lower for word in ["thanks", "perfect", "exactly", "helpful", "great"]):
            satisfaction["level"] = "high"
            satisfaction["indicators"].append("positive_language")

        # Negative indicators
        elif any(word in interaction_lower for word in ["not helpful", "wrong", "bad", "useless", "terrible"]):
            satisfaction["level"] = "low"
            satisfaction["indicators"].append("negative_language")
            satisfaction["improvement_suggestions"].append("review_source_selection")

        # Request for more information
        if any(phrase in interaction_lower for phrase in ["more details", "tell me more", "expand on"]):
            satisfaction["indicators"].append("needs_more_depth")
            satisfaction["improvement_suggestions"].append("increase_search_depth")

        return satisfaction

    def save_memory(self):
        """Save memory to storage file"""
        try:
            with open(self.storage_file, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"❌ Error saving memory: {e}")





class AdvancedMemoryAgent:
    """
    Nova Memory AI Agent - Interface wrapper for compatibility

    This agent works as a dedicated memory companion to Nova:
    - Stores facts automatically in the background
    - Retrieves information when Nova needs it
    - Maintains conversation logs for context
    """

    def __init__(self, storage_file: str = "nova_memory.json"):
        self.memory_system = NovaMemoryAI(storage_file)
        # Silently initialized Nova Memory AI Agent

    def process_conversation(self, user_message: str, ai_response: str) -> Dict[str, Any]:
        """Process conversation with Mem0-style memory analysis"""
        return self.memory_system.process_conversation(user_message, ai_response)

    def get_memory_context(self, query: str = "") -> Dict[str, Any]:
        """Get memory context for AI response generation"""
        return self.memory_system.get_memory_context(query)

    def get_user_profile(self) -> Dict[str, Any]:
        """Get user profile"""
        return {
            'user_info': self.memory_system.data["user"],
            'facts': self.memory_system.data["current_facts"]
        }

    def get_memory_stats(self) -> Dict[str, Any]:
        """Get memory statistics"""
        return self.memory_system.get_memory_stats()

    def get_session_info(self) -> Dict[str, Any]:
        """Get conversation session information for intelligent greetings"""
        return self.memory_system.get_session_info()

    def end_session(self):
        """End the current conversation session"""
        self.memory_system.end_session()

    def get_conversation_context(self) -> Dict[str, Any]:
        """Get context about previous conversations"""
        session_info = self.get_session_info()

        context = {
            "is_returning_user": not session_info["is_first_time"],
            "total_sessions": session_info["total_sessions"],
            "user_name": session_info.get("user_name"),
            "greeting_message": self._generate_greeting_message(session_info)
        }

        if not session_info["is_first_time"] and session_info.get("last_session"):
            context.update({
                "last_conversation_time": session_info.get("time_since_last"),
                "last_topics": session_info.get("last_topics", []),
                "last_duration": session_info.get("last_duration"),
                "can_reference_previous": True
            })
        else:
            context["can_reference_previous"] = False

        return context

    def _generate_greeting_message(self, session_info: Dict[str, Any]) -> str:
        """Generate appropriate greeting message based on session history"""
        if session_info["is_first_time"]:
            return "Hi there! I'm Nova, your AI memory companion. What's your name?"

        user_name = session_info.get("user_name", "there")
        time_since = session_info.get("time_since_last", "a while")
        last_topics = session_info.get("last_topics", [])

        # Base welcome back message
        greeting = f"Welcome back, {user_name}!"

        # Add time reference
        if time_since:
            greeting += f" We last talked {time_since} ago"

            # Add topic reference if available
            if last_topics:
                if len(last_topics) == 1:
                    greeting += f" about {last_topics[0]}"
                elif len(last_topics) == 2:
                    greeting += f" about {last_topics[0]} and {last_topics[1]}"
                else:
                    greeting += f" about {', '.join(last_topics[:-1])}, and {last_topics[-1]}"

            greeting += "."

        return greeting

    def get_conversation_state(self) -> Dict[str, Any]:
        """Get conversation state for AI response filtering"""
        return self.memory_system.get_conversation_state()

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

            context_hints = state.get("conversation_context", {})
            if context_hints.get("user_occupation"):
                instructions.append(f"You know they work as {context_hints['user_occupation']}.")
            if context_hints.get("user_interests"):
                instructions.append(f"You know their interests include {context_hints['user_interests']}.")
            if context_hints.get("recent_topics"):
                instructions.append(f"Recent conversation topics: {', '.join(context_hints['recent_topics'])}.")

            instructions.append("Respond naturally without re-establishing rapport or asking basic questions.")

            return " ".join(instructions)

        elif state.get("greeting_completed", False):
            return ("You have already greeted the user in this session. "
                   "Continue the conversation naturally without additional greetings or introductions.")

        else:
            return ("This appears to be a new user. You may ask introductory questions "
                   "to get to know them better.")

    def mark_greeting_completed(self):
        """Mark greeting as completed"""
        self.memory_system.mark_greeting_completed()

    def recall_history(self, query: str) -> Dict[str, Any]:
        """Recall historical information based on natural language queries"""
        return self.memory_system.recall_historical_information(query)

    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get conversation history for historical queries"""
        return self.memory_system.data.get('conversation', [])

    def get_dynamic_conversation_context(self) -> Dict[str, Any]:
        """Get comprehensive dynamic context for response generation"""
        return self.memory_system.get_dynamic_conversation_context()

    def get_timeline(self) -> List[Dict]:
        """Get chronological timeline of all changes"""
        return self.memory_system._get_timeline()

    def get_fact_history(self, fact_type: str) -> List[Dict]:
        """Get complete history for a specific fact type"""
        return self.memory_system._get_historical_values(fact_type, 'all')

    def get_semantic_insights(self) -> Dict[str, Any]:
        """Get semantic insights about user's information"""
        return self.memory_system.get_semantic_insights()

    def get_emotional_timeline(self) -> List[Dict[str, Any]]:
        """Get emotional timeline of memories"""
        return self.memory_system.get_emotional_timeline()

    def detect_memory_patterns(self) -> List[Dict[str, Any]]:
        """Get detected memory patterns"""
        return [asdict(pattern) for pattern in self.memory_system.patterns]

    def get_relationship_graph(self) -> Dict[str, Any]:
        """Get memory relationship graph"""
        return self.memory_system.memory_graph

    def get_importance_scores(self) -> Dict[str, Any]:
        """Get fact importance scores"""
        return self.memory_system.importance_scores

    def consolidate_memories(self, timeframe_days: int = 30) -> Dict[str, Any]:
        """Consolidate memories within timeframe"""
        cutoff_date = datetime.now() - timedelta(days=timeframe_days)

        # Simple consolidation - merge similar facts
        consolidated = 0
        for fact_type, history in self.memory_system.data.get("fact_history", {}).items():
            similar_entries = []
            for entry in history:
                entry_date = datetime.fromisoformat(entry["timestamp"])
                if entry_date > cutoff_date:
                    similar_entries.append(entry)

            # If multiple similar entries, keep the most recent
            if len(similar_entries) > 1:
                most_recent = max(similar_entries, key=lambda x: x["timestamp"])
                # Mark others as consolidated
                for entry in similar_entries:
                    if entry != most_recent:
                        entry["status"] = "consolidated"
                        consolidated += 1

        return {
            'consolidated_count': consolidated,
            'timeframe_days': timeframe_days,
            'status': 'completed'
        }

    def suggest_memory_queries(self, context: str = "") -> List[str]:
        """Suggest relevant memory queries based on context"""
        suggestions = []
        facts = self.memory_system.data.get("current_facts", {})

        # Suggest based on existing facts
        if 'occupation' in facts:
            suggestions.extend([
                "What was my previous job?",
                "How has my career evolved?",
                "What skills have I developed?"
            ])

        if 'interests' in facts:
            suggestions.extend([
                "What are my old interests?",
                "How have my interests changed?",
                "What new hobbies have I picked up?"
            ])

        # Context-specific suggestions
        if context.lower() in ['work', 'career', 'job']:
            suggestions.extend([
                "What was my career progression?",
                "What technologies have I learned?",
                "What companies have I worked for?"
            ])

        return suggestions[:5]  # Return top 5 suggestions

    def analyze_memory_health(self) -> Dict[str, Any]:
        """Analyze the health and quality of memory system"""
        facts = self.memory_system.data.get("current_facts", {})
        history = self.memory_system.data.get("fact_history", {})
        events = self.memory_system.data.get("memory_events", [])

        # Calculate metrics
        total_facts = len(facts)
        facts_with_history = len([f for f in history.values() if len(f) > 1])
        recent_activity = len([e for e in events[-10:] if e])  # Last 10 events

        # Relationship density
        relationship_count = len(self.memory_system.memory_graph)
        relationship_density = relationship_count / max(total_facts, 1)

        # Emotional richness
        emotional_events = len([e for e in events if isinstance(e, dict) and 'emotional_context' in e])
        emotional_richness = emotional_events / max(len(events), 1)

        health_score = (
            (total_facts / 10.0) * 0.3 +  # Fact quantity
            (facts_with_history / max(total_facts, 1)) * 0.2 +  # Historical depth
            (recent_activity / 10.0) * 0.2 +  # Recent activity
            relationship_density * 0.15 +  # Relationship richness
            emotional_richness * 0.15  # Emotional context
        )

        return {
            'health_score': min(health_score, 1.0),
            'total_facts': total_facts,
            'facts_with_history': facts_with_history,
            'recent_activity': recent_activity,
            'relationship_count': relationship_count,
            'emotional_events': emotional_events,
            'recommendations': self._get_health_recommendations(health_score)
        }

    def _get_health_recommendations(self, health_score: float) -> List[str]:
        """Get recommendations for improving memory health"""
        recommendations = []

        if health_score < 0.3:
            recommendations.extend([
                "Add more personal information to build a richer profile",
                "Share more about your interests and hobbies",
                "Discuss your professional background and goals"
            ])
        elif health_score < 0.6:
            recommendations.extend([
                "Update existing information to keep it current",
                "Share emotional context about your experiences",
                "Discuss relationships between your interests and work"
            ])
        else:
            recommendations.extend([
                "Your memory system is healthy!",
                "Continue sharing updates about your life",
                "Explore advanced features like pattern analysis"
            ])

        return recommendations

# Factory function for backward compatibility
def create_memory_agent(storage_file: str = "nova_memory") -> AdvancedMemoryAgent:
    """Create Nova Memory AI agent"""
    return AdvancedMemoryAgent(storage_file)
