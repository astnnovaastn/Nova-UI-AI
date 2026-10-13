"""Shared memory categories and relationship semantics; no ML dependencies."""

from enum import Enum

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
    TASK_PROJECT_TRACKING = "task_project_tracking"          # Active projects, tech stacks, howdeadlines
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
