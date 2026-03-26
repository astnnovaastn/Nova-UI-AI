#!/usr/bin/env python3
"""
Enhanced Memory System for Nova AI
==================================

Comprehensive memory system upgrade addressing degradation issues and implementing
continuous processing, expanded categories, and seamless AI integration.

Features:
- Continuous background memory processing
- Advanced memory consolidation and cross-referencing
- Expanded memory categories (35+ categories)
- Memory confidence scoring and gap detection
- Self-awareness and memory integrity monitoring
- Persistent data structure with automatic cleanup
"""

import json
import os
import time
import threading
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum
import logging
from collections import defaultdict, deque
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MemoryConfidence(Enum):
    """Memory confidence levels"""
    VERY_HIGH = 0.9
    HIGH = 0.8
    MEDIUM = 0.6
    LOW = 0.4
    VERY_LOW = 0.2

class MemoryPriority(Enum):
    """Memory priority levels for processing"""
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4
    BACKGROUND = 5

@dataclass
class MemoryItem:
    """Enhanced memory item with comprehensive metadata"""
    id: str
    category: str
    subcategory: str
    content: str
    confidence: float
    priority: MemoryPriority
    created_at: datetime
    last_accessed: datetime
    access_count: int = 0
    relationships: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    source: str = "conversation"
    validation_status: str = "pending"
    consolidation_score: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class MemoryGap:
    """Represents a detected gap in memory"""
    category: str
    description: str
    importance: float
    suggested_questions: List[str]
    detected_at: datetime

@dataclass
class MemoryInsight:
    """Represents an insight derived from memory analysis"""
    type: str
    description: str
    confidence: float
    supporting_memories: List[str]
    created_at: datetime

class EnhancedMemoryCategories(Enum):
    """Expanded memory categories (35+ categories)"""
    # Core Identity & Personal
    USER_IDENTITY = "user_identity"
    PERSONAL_PREFERENCES = "personal_preferences"
    COMMUNICATION_STYLE = "communication_style"
    PERSONALITY_TRAITS = "personality_traits"
    VALUES_BELIEFS = "values_beliefs"
    
    # Behavioral & Patterns
    ACTIVITY_PATTERNS = "activity_patterns"
    CONVERSATION_PATTERNS = "conversation_patterns"
    DECISION_PATTERNS = "decision_patterns"
    LEARNING_PATTERNS = "learning_patterns"
    INTERACTION_PREFERENCES = "interaction_preferences"
    
    # Professional & Skills
    PROFESSIONAL_BACKGROUND = "professional_background"
    SKILLS_EXPERTISE = "skills_expertise"
    CAREER_GOALS = "career_goals"
    WORK_PREFERENCES = "work_preferences"
    INDUSTRY_KNOWLEDGE = "industry_knowledge"
    
    # Projects & Tasks
    CURRENT_PROJECTS = "current_projects"
    PROJECT_HISTORY = "project_history"
    TASK_MANAGEMENT = "task_management"
    DEADLINES_COMMITMENTS = "deadlines_commitments"
    COLLABORATION_HISTORY = "collaboration_history"
    
    # Relationships & Social
    RELATIONSHIPS = "relationships"
    SOCIAL_CONTEXT = "social_context"
    FAMILY_BACKGROUND = "family_background"
    FRIEND_NETWORK = "friend_network"
    PROFESSIONAL_NETWORK = "professional_network"
    
    # Interests & Hobbies
    PERSONAL_INTERESTS = "personal_interests"
    HOBBIES_ACTIVITIES = "hobbies_activities"
    ENTERTAINMENT_PREFERENCES = "entertainment_preferences"
    TRAVEL_EXPERIENCES = "travel_experiences"
    CULTURAL_INTERESTS = "cultural_interests"
    
    # Goals & Development
    SHORT_TERM_GOALS = "short_term_goals"
    LONG_TERM_GOALS = "long_term_goals"
    PERSONAL_DEVELOPMENT = "personal_development"
    LEARNING_OBJECTIVES = "learning_objectives"
    ACHIEVEMENT_HISTORY = "achievement_history"
    
    # Technical & System
    SYSTEM_PREFERENCES = "system_preferences"
    TOOL_USAGE = "tool_usage"
    TECHNICAL_SETUP = "technical_setup"
    INTEGRATION_HISTORY = "integration_history"
    FEEDBACK_HISTORY = "feedback_history"

    # News & Information
    NEWS_WEATHER_HISTORY = "news_weather_history"

class ContinuousMemoryProcessor:
    """Background processor for continuous memory operations"""
    
    def __init__(self, memory_system):
        self.memory_system = memory_system
        self.processing_thread = None
        self.is_running = False
        self.processing_queue = deque()
        self.last_consolidation = datetime.now()
        self.consolidation_interval = timedelta(hours=1)  # Consolidate every hour
        
    def start_processing(self):
        """Start the background processing thread"""
        if not self.is_running:
            self.is_running = True
            self.processing_thread = threading.Thread(target=self._processing_loop, daemon=True)
            self.processing_thread.start()
            logger.info("[OK] Continuous memory processing started")
    
    def stop_processing(self):
        """Stop the background processing thread"""
        self.is_running = False
        if self.processing_thread:
            self.processing_thread.join(timeout=5)
        logger.info("[OK] Continuous memory processing stopped")
    
    def _processing_loop(self):
        """Main processing loop running in background"""
        while self.is_running:
            try:
                # Process queued operations
                self._process_queue()
                
                # Periodic consolidation
                if datetime.now() - self.last_consolidation > self.consolidation_interval:
                    self._perform_consolidation()
                    self.last_consolidation = datetime.now()
                
                # Memory integrity check
                self._check_memory_integrity()
                
                # Generate insights
                self._generate_insights()
                
                # Sleep for a short interval
                time.sleep(30)  # Process every 30 seconds
                
            except Exception as e:
                logger.error(f"[ERROR] Memory processing error: {e}")
                time.sleep(60)  # Wait longer on error
    
    def _process_queue(self):
        """Process items in the processing queue"""
        while self.processing_queue and self.is_running:
            try:
                operation = self.processing_queue.popleft()
                self._execute_operation(operation)
            except Exception as e:
                logger.error(f"[ERROR] Queue processing error: {e}")
    
    def _execute_operation(self, operation):
        """Execute a queued memory operation"""
        op_type = operation.get('type')
        
        if op_type == 'consolidate':
            self._consolidate_memories(operation.get('category'))
        elif op_type == 'cross_reference':
            self._update_cross_references(operation.get('memory_id'))
        elif op_type == 'validate':
            self._validate_memory(operation.get('memory_id'))
        elif op_type == 'cleanup':
            self._cleanup_redundant_memories()
    
    def _perform_consolidation(self):
        """Perform memory consolidation"""
        logger.info("[PROCESSING] Performing memory consolidation...")
        
        # Consolidate each category
        for category in EnhancedMemoryCategories:
            self._consolidate_memories(category.value)
        
        # Update cross-references
        self._update_all_cross_references()
        
        # Clean up redundant data
        self._cleanup_redundant_memories()
        
        logger.info("[OK] Memory consolidation completed")
    
    def _consolidate_memories(self, category: str):
        """Consolidate memories within a category"""
        memories = self.memory_system.get_memories_by_category(category)
        
        # Group similar memories
        similar_groups = self._group_similar_memories(memories)
        
        # Merge similar memories
        for group in similar_groups:
            if len(group) > 1:
                self._merge_memories(group)
    
    def _group_similar_memories(self, memories: List[MemoryItem]) -> List[List[MemoryItem]]:
        """Group similar memories together"""
        groups = []
        processed = set()
        
        for memory in memories:
            if memory.id in processed:
                continue
                
            similar_group = [memory]
            processed.add(memory.id)
            
            # Find similar memories
            for other_memory in memories:
                if other_memory.id in processed:
                    continue
                    
                if self._calculate_similarity(memory, other_memory) > 0.8:
                    similar_group.append(other_memory)
                    processed.add(other_memory.id)
            
            groups.append(similar_group)
        
        return groups
    
    def _calculate_similarity(self, memory1: MemoryItem, memory2: MemoryItem) -> float:
        """Calculate similarity between two memories"""
        # Simple similarity based on content overlap and category
        if memory1.category != memory2.category or memory1.subcategory != memory2.subcategory:
            return 0.0
        
        # Calculate content similarity (simplified)
        content1_words = set(memory1.content.lower().split())
        content2_words = set(memory2.content.lower().split())
        
        if not content1_words or not content2_words:
            return 0.0
        
        intersection = len(content1_words.intersection(content2_words))
        union = len(content1_words.union(content2_words))
        
        return intersection / union if union > 0 else 0.0
    
    def _merge_memories(self, memories: List[MemoryItem]):
        """Merge similar memories into a single consolidated memory"""
        if len(memories) <= 1:
            return
        
        # Sort by confidence and recency
        memories.sort(key=lambda m: (m.confidence, m.created_at), reverse=True)
        primary_memory = memories[0]
        
        # Merge content and metadata
        merged_content = primary_memory.content
        merged_tags = set(primary_memory.tags)
        merged_relationships = set(primary_memory.relationships)
        total_access_count = primary_memory.access_count
        
        for memory in memories[1:]:
            merged_tags.update(memory.tags)
            merged_relationships.update(memory.relationships)
            total_access_count += memory.access_count
            
            # Remove the redundant memory
            self.memory_system.remove_memory(memory.id)
        
        # Update primary memory
        primary_memory.tags = list(merged_tags)
        primary_memory.relationships = list(merged_relationships)
        primary_memory.access_count = total_access_count
        primary_memory.consolidation_score = len(memories) - 1
        primary_memory.validation_status = "consolidated"
        
        self.memory_system.update_memory(primary_memory)
    
    def _update_cross_references(self, memory_id: str):
        """Update cross-references for a specific memory"""
        memory = self.memory_system.get_memory(memory_id)
        if not memory:
            return
        
        # Find related memories
        related_memories = self.memory_system.find_related_memories(memory)
        
        # Update relationships
        for related_memory in related_memories:
            if related_memory.id not in memory.relationships:
                memory.relationships.append(related_memory.id)
            if memory.id not in related_memory.relationships:
                related_memory.relationships.append(memory.id)
                self.memory_system.update_memory(related_memory)
        
        self.memory_system.update_memory(memory)
    
    def _update_all_cross_references(self):
        """Update cross-references for all memories"""
        all_memories = self.memory_system.get_all_memories()
        
        for memory in all_memories:
            self._update_cross_references(memory.id)
    
    def _check_memory_integrity(self):
        """Check memory system integrity"""
        # Check for orphaned references
        all_memories = self.memory_system.get_all_memories()
        memory_ids = {m.id for m in all_memories}
        
        for memory in all_memories:
            # Clean up invalid relationships
            valid_relationships = [rel_id for rel_id in memory.relationships if rel_id in memory_ids]
            if len(valid_relationships) != len(memory.relationships):
                memory.relationships = valid_relationships
                self.memory_system.update_memory(memory)
    
    def _cleanup_redundant_memories(self):
        """Clean up redundant or low-value memories"""
        all_memories = self.memory_system.get_all_memories()
        
        # Remove very low confidence memories that haven't been accessed
        cutoff_date = datetime.now() - timedelta(days=30)
        
        for memory in all_memories:
            if (memory.confidence < 0.3 and 
                memory.access_count == 0 and 
                memory.created_at < cutoff_date):
                self.memory_system.remove_memory(memory.id)
                logger.info(f"[CLEANUP] Removed low-value memory: {memory.id}")
    
    def _generate_insights(self):
        """Generate insights from memory patterns"""
        # This would analyze memory patterns and generate insights
        # Implementation would depend on specific insight types needed
        pass
    
    def queue_operation(self, operation: Dict[str, Any]):
        """Queue an operation for background processing"""
        self.processing_queue.append(operation)


class EnhancedMemorySystem:
    """
    Enhanced Memory System with continuous processing and advanced features

    Features:
    - Continuous background processing
    - Memory consolidation and cross-referencing
    - Confidence scoring and gap detection
    - Self-awareness and integrity monitoring
    - Expanded memory categories (35+)
    """

    def __init__(self, storage_file: str = "enhanced_nova_memory.json"):
        self.storage_file = storage_file
        self.memories: Dict[str, MemoryItem] = {}
        self.memory_gaps: List[MemoryGap] = []
        self.memory_insights: List[MemoryInsight] = []
        self.category_schemas = self._initialize_category_schemas()

        # Continuous processing
        self.processor = ContinuousMemoryProcessor(self)

        # Memory statistics
        self.stats = {
            'total_memories': 0,
            'total_categories': 0,
            'average_confidence': 0.0,
            'last_consolidation': None,
            'memory_gaps_detected': 0,
            'insights_generated': 0
        }

        # Load existing data
        self.load_memory_data()

        # Start continuous processing
        self.processor.start_processing()

        logger.info(f"[OK] Enhanced Memory System initialized with {len(self.memories)} memories")

    @property
    def memory_system(self):
        """Provide memory_system property for backward compatibility with TaskManager and other systems"""
        return self

    @property
    def data(self):
        """Provide data property for backward compatibility"""
        return {
            "memory_categories": {
                category: [
                    {
                        "content": memory.content,
                        "timestamp": memory.timestamp.isoformat(),
                        "confidence": memory.confidence,
                        "tags": memory.tags,
                        "metadata": memory.metadata
                    }
                    for memory in self.memories.values()
                    if memory.category == category
                ]
                for category in self.category_schemas.keys()
            }
        }

    def _initialize_category_schemas(self) -> Dict[str, Dict[str, Any]]:
        """Initialize schemas for all memory categories"""
        schemas = {}

        for category in EnhancedMemoryCategories:
            schemas[category.value] = {
                'name': category.value.replace('_', ' ').title(),
                'subcategories': self._get_subcategories_for_category(category.value),
                'relationships': self._get_related_categories(category.value),
                'importance_weight': self._get_category_importance(category.value),
                'retention_policy': self._get_retention_policy(category.value)
            }

        return schemas

    def _get_subcategories_for_category(self, category: str) -> List[str]:
        """Get subcategories for a specific category"""
        subcategory_map = {
            'user_identity': ['name', 'pronouns', 'nicknames', 'identity_evolution', 'personal_identifiers'],
            'personal_preferences': ['communication_style', 'response_format', 'detail_level', 'formality', 'topics'],
            'communication_style': ['tone', 'formality', 'directness', 'humor', 'technical_level'],
            'personality_traits': ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'],
            'values_beliefs': ['core_values', 'beliefs', 'principles', 'ethics', 'worldview'],
            'activity_patterns': ['daily_routine', 'work_schedule', 'peak_hours', 'break_patterns', 'seasonal_changes'],
            'conversation_patterns': ['topic_preferences', 'question_types', 'engagement_style', 'conversation_flow'],
            'decision_patterns': ['decision_style', 'risk_tolerance', 'information_needs', 'consultation_preferences'],
            'learning_patterns': ['learning_style', 'preferred_formats', 'pace', 'feedback_preferences', 'retention_methods'],
            'interaction_preferences': ['meeting_style', 'collaboration_preferences', 'feedback_style', 'conflict_resolution'],
            'professional_background': ['current_role', 'company', 'industry', 'experience_level', 'career_path'],
            'skills_expertise': ['technical_skills', 'soft_skills', 'certifications', 'specializations', 'skill_levels'],
            'career_goals': ['short_term_goals', 'long_term_vision', 'desired_roles', 'skill_development', 'career_changes'],
            'work_preferences': ['work_environment', 'team_size', 'autonomy_level', 'challenge_level', 'work_life_balance'],
            'industry_knowledge': ['industry_trends', 'key_players', 'technologies', 'best_practices', 'regulations'],
            'current_projects': ['active_projects', 'project_roles', 'deadlines', 'priorities', 'challenges'],
            'project_history': ['completed_projects', 'outcomes', 'lessons_learned', 'success_factors', 'failures'],
            'task_management': ['task_organization', 'prioritization_methods', 'tools_used', 'delegation_style'],
            'deadlines_commitments': ['upcoming_deadlines', 'recurring_commitments', 'availability', 'scheduling_preferences'],
            'collaboration_history': ['team_experiences', 'collaboration_tools', 'communication_patterns', 'conflict_resolution'],
            'relationships': ['family', 'friends', 'colleagues', 'mentors', 'professional_contacts'],
            'social_context': ['social_circles', 'community_involvement', 'social_preferences', 'networking_style'],
            'family_background': ['family_structure', 'relationships', 'influences', 'traditions', 'values'],
            'friend_network': ['close_friends', 'social_groups', 'friendship_patterns', 'social_activities'],
            'professional_network': ['industry_contacts', 'mentors', 'collaborators', 'professional_groups'],
            'personal_interests': ['hobbies', 'passions', 'curiosities', 'exploration_areas', 'creative_pursuits'],
            'hobbies_activities': ['regular_activities', 'seasonal_hobbies', 'skill_development', 'time_investment'],
            'entertainment_preferences': ['movies', 'music', 'books', 'games', 'shows', 'genres'],
            'travel_experiences': ['places_visited', 'travel_style', 'preferences', 'memorable_experiences'],
            'cultural_interests': ['cultural_activities', 'art_preferences', 'cultural_background', 'traditions'],
            'short_term_goals': ['immediate_objectives', 'monthly_goals', 'quarterly_targets', 'current_focus'],
            'long_term_goals': ['life_vision', 'career_aspirations', 'personal_development', 'legacy_goals'],
            'personal_development': ['growth_areas', 'development_plans', 'learning_objectives', 'self_improvement'],
            'learning_objectives': ['skill_acquisition', 'knowledge_areas', 'learning_timeline', 'success_metrics'],
            'achievement_history': ['major_accomplishments', 'awards', 'recognition', 'milestones', 'proud_moments'],
            'system_preferences': ['interface_preferences', 'notification_settings', 'automation_preferences'],
            'tool_usage': ['preferred_tools', 'tool_proficiency', 'workflow_integration', 'tool_feedback'],
            'technical_setup': ['hardware', 'software', 'configurations', 'integrations', 'customizations'],
            'integration_history': ['system_integrations', 'api_usage', 'automation_setups', 'workflow_optimizations'],
            'feedback_history': ['system_feedback', 'improvement_suggestions', 'feature_requests', 'satisfaction_ratings'],
            'news_weather_history': ['news_queries', 'weather_queries', 'search_history', 'information_requests', 'topic_interests']
        }

        return subcategory_map.get(category, ['general'])

    def _get_related_categories(self, category: str) -> List[str]:
        """Get categories related to the given category"""
        relationship_map = {
            'user_identity': ['personal_preferences', 'communication_style', 'personality_traits'],
            'personal_preferences': ['communication_style', 'interaction_preferences', 'work_preferences'],
            'communication_style': ['personality_traits', 'interaction_preferences', 'professional_background'],
            'professional_background': ['skills_expertise', 'career_goals', 'industry_knowledge'],
            'current_projects': ['task_management', 'deadlines_commitments', 'collaboration_history'],
            'relationships': ['social_context', 'family_background', 'professional_network'],
            'personal_interests': ['hobbies_activities', 'entertainment_preferences', 'cultural_interests'],
            'short_term_goals': ['long_term_goals', 'personal_development', 'learning_objectives'],
            'system_preferences': ['tool_usage', 'technical_setup', 'integration_history']
        }

        return relationship_map.get(category, [])

    def _get_category_importance(self, category: str) -> float:
        """Get importance weight for a category"""
        importance_map = {
            'user_identity': 1.0,
            'personal_preferences': 0.9,
            'communication_style': 0.9,
            'professional_background': 0.8,
            'current_projects': 0.8,
            'relationships': 0.7,
            'personal_interests': 0.6,
            'system_preferences': 0.5
        }

        return importance_map.get(category, 0.5)

    def _get_retention_policy(self, category: str) -> str:
        """Get retention policy for a category"""
        policy_map = {
            'user_identity': 'permanent',
            'personal_preferences': 'permanent',
            'communication_style': 'permanent',
            'personality_traits': 'permanent',
            'professional_background': 'long_term',
            'current_projects': 'medium_term',
            'task_management': 'short_term',
            'system_preferences': 'permanent'
        }

        return policy_map.get(category, 'medium_term')

    def store_memory(self, category: str, subcategory: str, content: str,
                    confidence: float = 0.8, priority: MemoryPriority = MemoryPriority.MEDIUM,
                    tags: List[str] = None, metadata: Dict[str, Any] = None) -> str:
        """Store a new memory item"""
        memory_id = str(uuid.uuid4())

        memory = MemoryItem(
            id=memory_id,
            category=category,
            subcategory=subcategory,
            content=content,
            confidence=confidence,
            priority=priority,
            created_at=datetime.now(),
            last_accessed=datetime.now(),
            tags=tags or [],
            metadata=metadata or {}
        )

        self.memories[memory_id] = memory
        self.stats['total_memories'] = len(self.memories)

        # Queue for background processing
        self.processor.queue_operation({
            'type': 'cross_reference',
            'memory_id': memory_id
        })

        # Save to disk
        self.save_memory_data()

        logger.info(f"[MEMORY] Stored: {category}.{subcategory} - {content[:50]}...")
        return memory_id

    def get_memory(self, memory_id: str) -> Optional[MemoryItem]:
        """Get a specific memory by ID"""
        memory = self.memories.get(memory_id)
        if memory:
            memory.last_accessed = datetime.now()
            memory.access_count += 1
        return memory

    def get_memories_by_category(self, category: str) -> List[MemoryItem]:
        """Get all memories in a specific category"""
        return [memory for memory in self.memories.values() if memory.category == category]

    def get_all_memories(self) -> List[MemoryItem]:
        """Get all memories"""
        return list(self.memories.values())

    def update_memory(self, memory: MemoryItem):
        """Update an existing memory"""
        self.memories[memory.id] = memory
        self.save_memory_data()

    def remove_memory(self, memory_id: str) -> bool:
        """Remove a memory"""
        if memory_id in self.memories:
            del self.memories[memory_id]
            self.stats['total_memories'] = len(self.memories)
            self.save_memory_data()
            return True
        return False

    def find_related_memories(self, memory: MemoryItem, threshold: float = 0.6) -> List[MemoryItem]:
        """Find memories related to the given memory"""
        related = []

        for other_memory in self.memories.values():
            if other_memory.id == memory.id:
                continue

            # Check category relationships
            if other_memory.category in self.category_schemas[memory.category]['relationships']:
                related.append(other_memory)
                continue

            # Check content similarity
            similarity = self.processor._calculate_similarity(memory, other_memory)
            if similarity >= threshold:
                related.append(other_memory)

            # Check tag overlap
            tag_overlap = len(set(memory.tags).intersection(set(other_memory.tags)))
            if tag_overlap > 0 and len(memory.tags) > 0:
                related.append(other_memory)

        return related

    def search_memories(self, query: str, category: str = None, limit: int = 10) -> List[MemoryItem]:
        """Search memories by content"""
        query_words = set(query.lower().split())
        results = []

        for memory in self.memories.values():
            if category and memory.category != category:
                continue

            # Calculate relevance score
            content_words = set(memory.content.lower().split())
            tag_words = set(' '.join(memory.tags).lower().split())
            all_words = content_words.union(tag_words)

            overlap = len(query_words.intersection(all_words))
            if overlap > 0:
                relevance = overlap / len(query_words)
                results.append((memory, relevance))

        # Sort by relevance and confidence
        results.sort(key=lambda x: (x[1], x[0].confidence), reverse=True)

        return [memory for memory, _ in results[:limit]]

    def get_comprehensive_user_profile(self) -> Dict[str, Any]:
        """Get comprehensive user profile from all memories"""
        profile = {
            'identity': {},
            'preferences': {},
            'professional': {},
            'personal': {},
            'goals': {},
            'patterns': {},
            'relationships': {},
            'system': {},
            'confidence_scores': {},
            'memory_gaps': [],
            'last_updated': datetime.now().isoformat()
        }

        # Organize memories by category
        for memory in self.memories.values():
            category_group = self._get_category_group(memory.category)

            if category_group not in profile:
                profile[category_group] = {}

            if memory.category not in profile[category_group]:
                profile[category_group][memory.category] = {}

            if memory.subcategory not in profile[category_group][memory.category]:
                profile[category_group][memory.category][memory.subcategory] = []

            profile[category_group][memory.category][memory.subcategory].append({
                'content': memory.content,
                'confidence': memory.confidence,
                'last_accessed': memory.last_accessed.isoformat(),
                'access_count': memory.access_count,
                'tags': memory.tags
            })

            # Track confidence scores
            if memory.category not in profile['confidence_scores']:
                profile['confidence_scores'][memory.category] = []
            profile['confidence_scores'][memory.category].append(memory.confidence)

        # Calculate average confidence per category
        for category, scores in profile['confidence_scores'].items():
            profile['confidence_scores'][category] = sum(scores) / len(scores) if scores else 0.0

        # Add detected memory gaps
        profile['memory_gaps'] = [
            {
                'category': gap.category,
                'description': gap.description,
                'importance': gap.importance,
                'suggested_questions': gap.suggested_questions
            }
            for gap in self.memory_gaps
        ]

        return profile

    def _get_category_group(self, category: str) -> str:
        """Get the group for a category"""
        group_map = {
            'user_identity': 'identity',
            'personal_preferences': 'preferences',
            'communication_style': 'preferences',
            'personality_traits': 'identity',
            'values_beliefs': 'identity',
            'professional_background': 'professional',
            'skills_expertise': 'professional',
            'career_goals': 'goals',
            'work_preferences': 'professional',
            'industry_knowledge': 'professional',
            'current_projects': 'professional',
            'project_history': 'professional',
            'relationships': 'relationships',
            'social_context': 'relationships',
            'personal_interests': 'personal',
            'hobbies_activities': 'personal',
            'short_term_goals': 'goals',
            'long_term_goals': 'goals',
            'activity_patterns': 'patterns',
            'conversation_patterns': 'patterns',
            'system_preferences': 'system',
            'tool_usage': 'system'
        }

        return group_map.get(category, 'other')

    def detect_memory_gaps(self) -> List[MemoryGap]:
        """Detect gaps in memory coverage"""
        gaps = []

        # Check for missing essential categories
        essential_categories = [
            'user_identity', 'personal_preferences', 'communication_style',
            'professional_background', 'personal_interests'
        ]

        for category in essential_categories:
            memories = self.get_memories_by_category(category)
            if not memories:
                gaps.append(MemoryGap(
                    category=category,
                    description=f"No memories stored for {category.replace('_', ' ')}",
                    importance=self._get_category_importance(category),
                    suggested_questions=self._get_suggested_questions_for_category(category),
                    detected_at=datetime.now()
                ))
            elif len(memories) < 3:  # Insufficient coverage
                gaps.append(MemoryGap(
                    category=category,
                    description=f"Limited coverage for {category.replace('_', ' ')} ({len(memories)} memories)",
                    importance=self._get_category_importance(category) * 0.7,
                    suggested_questions=self._get_suggested_questions_for_category(category),
                    detected_at=datetime.now()
                ))

        # Check for low confidence areas
        for category in EnhancedMemoryCategories:
            memories = self.get_memories_by_category(category.value)
            if memories:
                avg_confidence = sum(m.confidence for m in memories) / len(memories)
                if avg_confidence < 0.5:
                    gaps.append(MemoryGap(
                        category=category.value,
                        description=f"Low confidence in {category.value.replace('_', ' ')} (avg: {avg_confidence:.2f})",
                        importance=self._get_category_importance(category.value) * avg_confidence,
                        suggested_questions=self._get_validation_questions_for_category(category.value),
                        detected_at=datetime.now()
                    ))

        self.memory_gaps = gaps
        self.stats['memory_gaps_detected'] = len(gaps)
        return gaps

    def _get_suggested_questions_for_category(self, category: str) -> List[str]:
        """Get suggested questions to fill gaps in a category"""
        question_map = {
            'user_identity': [
                "What is your name?",
                "What pronouns do you prefer?",
                "How would you like me to address you?",
                "Is there anything specific about your identity I should know?"
            ],
            'personal_preferences': [
                "How do you prefer me to communicate with you?",
                "Do you prefer detailed or brief responses?",
                "What level of formality do you prefer?",
                "Are there any topics you'd rather avoid?"
            ],
            'communication_style': [
                "Do you prefer direct or diplomatic communication?",
                "How do you like to receive feedback?",
                "What's your preferred tone for our conversations?",
                "Do you enjoy humor in our interactions?"
            ],
            'professional_background': [
                "What do you do for work?",
                "What industry are you in?",
                "What's your role or position?",
                "How long have you been in your current field?"
            ],
            'personal_interests': [
                "What are your hobbies or interests?",
                "What do you enjoy doing in your free time?",
                "Are there any topics you're passionate about?",
                "What kind of entertainment do you prefer?"
            ]
        }

        return question_map.get(category, [f"Tell me more about your {category.replace('_', ' ')}"])

    def _get_validation_questions_for_category(self, category: str) -> List[str]:
        """Get questions to validate/improve confidence in a category"""
        return [
            f"Can you confirm or clarify your {category.replace('_', ' ')}?",
            f"Has anything changed regarding your {category.replace('_', ' ')}?",
            f"Is there anything else I should know about your {category.replace('_', ' ')}?"
        ]

    def get_memory_confidence_report(self) -> Dict[str, Any]:
        """Get a report on memory confidence levels"""
        report = {
            'overall_confidence': 0.0,
            'category_confidence': {},
            'low_confidence_areas': [],
            'high_confidence_areas': [],
            'recommendations': []
        }

        all_confidences = []

        for category in EnhancedMemoryCategories:
            memories = self.get_memories_by_category(category.value)
            if memories:
                avg_confidence = sum(m.confidence for m in memories) / len(memories)
                report['category_confidence'][category.value] = {
                    'confidence': avg_confidence,
                    'memory_count': len(memories),
                    'last_updated': max(m.last_accessed for m in memories).isoformat()
                }
                all_confidences.append(avg_confidence)

                if avg_confidence < 0.5:
                    report['low_confidence_areas'].append(category.value)
                elif avg_confidence > 0.8:
                    report['high_confidence_areas'].append(category.value)

        report['overall_confidence'] = sum(all_confidences) / len(all_confidences) if all_confidences else 0.0

        # Generate recommendations
        if report['low_confidence_areas']:
            report['recommendations'].append("Consider asking clarifying questions about: " +
                                          ", ".join(report['low_confidence_areas']))

        if len(report['category_confidence']) < 10:
            report['recommendations'].append("Expand memory coverage to more categories")

        return report

    def get_self_awareness_status(self) -> Dict[str, Any]:
        """Get AI's self-awareness of its memory state"""
        status = {
            'memory_coverage': {},
            'knowledge_gaps': [],
            'confidence_assessment': {},
            'learning_priorities': [],
            'memory_health': 'unknown'
        }

        # Assess memory coverage
        total_categories = len(EnhancedMemoryCategories)
        covered_categories = len([cat for cat in EnhancedMemoryCategories
                                if self.get_memories_by_category(cat.value)])

        status['memory_coverage'] = {
            'total_categories': total_categories,
            'covered_categories': covered_categories,
            'coverage_percentage': (covered_categories / total_categories) * 100,
            'uncovered_categories': [cat.value for cat in EnhancedMemoryCategories
                                   if not self.get_memories_by_category(cat.value)]
        }

        # Identify knowledge gaps
        gaps = self.detect_memory_gaps()
        status['knowledge_gaps'] = [
            {
                'category': gap.category,
                'description': gap.description,
                'importance': gap.importance
            }
            for gap in gaps[:5]  # Top 5 gaps
        ]

        # Confidence assessment
        confidence_report = self.get_memory_confidence_report()
        status['confidence_assessment'] = {
            'overall_confidence': confidence_report['overall_confidence'],
            'low_confidence_count': len(confidence_report['low_confidence_areas']),
            'high_confidence_count': len(confidence_report['high_confidence_areas'])
        }

        # Learning priorities
        status['learning_priorities'] = [
            gap.category for gap in sorted(gaps, key=lambda x: x.importance, reverse=True)[:3]
        ]

        # Memory health assessment
        if status['confidence_assessment']['overall_confidence'] > 0.8:
            status['memory_health'] = 'excellent'
        elif status['confidence_assessment']['overall_confidence'] > 0.6:
            status['memory_health'] = 'good'
        elif status['confidence_assessment']['overall_confidence'] > 0.4:
            status['memory_health'] = 'fair'
        else:
            status['memory_health'] = 'poor'

        return status

    def process_conversation(self, user_message: str, ai_response: str,
                           context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Process a conversation and extract memories"""
        result = {
            'success': False,
            'memory_operations': 0,
            'categories_affected': [],
            'new_memories': [],
            'updated_memories': [],
            'insights_generated': [],
            'error': None
        }

        try:
            # Extract information from user message
            extracted_info = self._extract_information(user_message, context)

            # Extract information from AI response (for learning)
            ai_extracted_info = self._extract_ai_learning(ai_response, context)

            # Process extracted information
            for info in extracted_info + ai_extracted_info:
                memory_id = self.store_memory(
                    category=info['category'],
                    subcategory=info['subcategory'],
                    content=info['content'],
                    confidence=info['confidence'],
                    priority=info.get('priority', MemoryPriority.MEDIUM),
                    tags=info.get('tags', []),
                    metadata=info.get('metadata', {})
                )

                result['new_memories'].append(memory_id)
                result['memory_operations'] += 1

                if info['category'] not in result['categories_affected']:
                    result['categories_affected'].append(info['category'])

            # Update conversation patterns
            self._update_conversation_patterns(user_message, ai_response)

            # Generate insights
            insights = self._generate_conversation_insights(user_message, ai_response)
            result['insights_generated'] = insights

            result['success'] = True

        except Exception as e:
            result['error'] = str(e)
            logger.error(f"[ERROR] Conversation processing failed: {e}")

        return result

    def _extract_information(self, message: str, context: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Extract information from user message"""
        extracted = []
        message_lower = message.lower()

        # Identity extraction
        identity_patterns = [
            (r"my name is (\w+)", 'user_identity', 'name'),
            (r"i'm (\w+)", 'user_identity', 'name'),
            (r"call me (\w+)", 'user_identity', 'nickname'),
            (r"i go by (\w+)", 'user_identity', 'nickname'),
            (r"my pronouns are ([\w/]+)", 'user_identity', 'pronouns'),
        ]

        # Preference extraction
        preference_patterns = [
            (r"i prefer ([\w\s]+)", 'personal_preferences', 'general'),
            (r"i like ([\w\s]+)", 'personal_preferences', 'likes'),
            (r"i don't like ([\w\s]+)", 'personal_preferences', 'dislikes'),
            (r"i hate ([\w\s]+)", 'personal_preferences', 'dislikes'),
            (r"please ([\w\s]+)", 'personal_preferences', 'requests'),
        ]

        # Professional extraction
        professional_patterns = [
            (r"i work (?:as|in) ([\w\s]+)", 'professional_background', 'role'),
            (r"i'm a ([\w\s]+)", 'professional_background', 'role'),
            (r"my job is ([\w\s]+)", 'professional_background', 'role'),
            (r"i specialize in ([\w\s]+)", 'skills_expertise', 'specialization'),
            (r"i'm good at ([\w\s]+)", 'skills_expertise', 'skills'),
        ]

        # Interest extraction
        interest_patterns = [
            (r"i enjoy ([\w\s]+)", 'personal_interests', 'activities'),
            (r"i love ([\w\s]+)", 'personal_interests', 'passions'),
            (r"my hobby is ([\w\s]+)", 'hobbies_activities', 'hobbies'),
            (r"i'm interested in ([\w\s]+)", 'personal_interests', 'interests'),
        ]

        all_patterns = identity_patterns + preference_patterns + professional_patterns + interest_patterns

        import re
        for pattern, category, subcategory in all_patterns:
            matches = re.findall(pattern, message_lower)
            for match in matches:
                extracted.append({
                    'category': category,
                    'subcategory': subcategory,
                    'content': match.strip(),
                    'confidence': 0.8,
                    'priority': MemoryPriority.HIGH if category == 'user_identity' else MemoryPriority.MEDIUM,
                    'tags': ['conversation_extracted'],
                    'metadata': {
                        'source_message': message[:100],
                        'extraction_method': 'pattern_matching',
                        'context': context
                    }
                })

        return extracted

    def _extract_ai_learning(self, ai_response: str, context: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Extract learning information from AI response"""
        extracted = []

        # Track AI's communication patterns
        response_length = len(ai_response.split())

        extracted.append({
            'category': 'conversation_patterns',
            'subcategory': 'ai_response_style',
            'content': f"Response length: {response_length} words",
            'confidence': 0.9,
            'priority': MemoryPriority.LOW,
            'tags': ['ai_learning', 'response_analysis'],
            'metadata': {
                'response_length': response_length,
                'response_preview': ai_response[:50],
                'context': context
            }
        })

        return extracted

    def _update_conversation_patterns(self, user_message: str, ai_response: str):
        """Update conversation patterns based on interaction"""
        # Track conversation timing, topics, etc.
        pattern_memory = {
            'category': 'conversation_patterns',
            'subcategory': 'interaction_timing',
            'content': f"Conversation at {datetime.now().strftime('%H:%M')}",
            'confidence': 0.7,
            'priority': MemoryPriority.LOW,
            'tags': ['timing', 'patterns'],
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'user_message_length': len(user_message),
                'ai_response_length': len(ai_response)
            }
        }

        self.store_memory(**pattern_memory)

    def _generate_conversation_insights(self, user_message: str, ai_response: str) -> List[str]:
        """Generate insights from conversation"""
        insights = []

        # Simple insight generation
        if len(user_message.split()) > 50:
            insights.append("User tends to provide detailed messages")

        if "?" in user_message:
            insights.append("User is asking questions - curious/learning mode")

        return insights

    def save_memory_data(self):
        """Save memory data to disk"""
        try:
            data = {
                'version': '2.0',
                'created_at': datetime.now().isoformat(),
                'memories': {},
                'memory_gaps': [],
                'memory_insights': [],
                'stats': self.stats,
                'category_schemas': self.category_schemas
            }

            # Serialize memories
            for memory_id, memory in self.memories.items():
                data['memories'][memory_id] = {
                    'id': memory.id,
                    'category': memory.category,
                    'subcategory': memory.subcategory,
                    'content': memory.content,
                    'confidence': memory.confidence,
                    'priority': memory.priority.value,
                    'created_at': memory.created_at.isoformat(),
                    'last_accessed': memory.last_accessed.isoformat(),
                    'access_count': memory.access_count,
                    'relationships': memory.relationships,
                    'tags': memory.tags,
                    'source': memory.source,
                    'validation_status': memory.validation_status,
                    'consolidation_score': memory.consolidation_score,
                    'metadata': memory.metadata
                }

            # Serialize memory gaps
            for gap in self.memory_gaps:
                data['memory_gaps'].append({
                    'category': gap.category,
                    'description': gap.description,
                    'importance': gap.importance,
                    'suggested_questions': gap.suggested_questions,
                    'detected_at': gap.detected_at.isoformat()
                })

            # Serialize insights
            for insight in self.memory_insights:
                data['memory_insights'].append({
                    'type': insight.type,
                    'description': insight.description,
                    'confidence': insight.confidence,
                    'supporting_memories': insight.supporting_memories,
                    'created_at': insight.created_at.isoformat()
                })

            with open(self.storage_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

        except Exception as e:
            logger.error(f"[ERROR] Failed to save memory data: {e}")

    def load_memory_data(self):
        """Load memory data from disk"""
        if not os.path.exists(self.storage_file):
            logger.info("[INFO] No existing memory file found, starting fresh")
            return

        try:
            with open(self.storage_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Load memories
            for memory_id, memory_data in data.get('memories', {}).items():
                memory = MemoryItem(
                    id=memory_data['id'],
                    category=memory_data['category'],
                    subcategory=memory_data['subcategory'],
                    content=memory_data['content'],
                    confidence=memory_data['confidence'],
                    priority=MemoryPriority(memory_data.get('priority', 3)),
                    created_at=datetime.fromisoformat(memory_data['created_at']),
                    last_accessed=datetime.fromisoformat(memory_data['last_accessed']),
                    access_count=memory_data.get('access_count', 0),
                    relationships=memory_data.get('relationships', []),
                    tags=memory_data.get('tags', []),
                    source=memory_data.get('source', 'conversation'),
                    validation_status=memory_data.get('validation_status', 'pending'),
                    consolidation_score=memory_data.get('consolidation_score', 0.0),
                    metadata=memory_data.get('metadata', {})
                )
                self.memories[memory_id] = memory

            # Load memory gaps
            for gap_data in data.get('memory_gaps', []):
                gap = MemoryGap(
                    category=gap_data['category'],
                    description=gap_data['description'],
                    importance=gap_data['importance'],
                    suggested_questions=gap_data['suggested_questions'],
                    detected_at=datetime.fromisoformat(gap_data['detected_at'])
                )
                self.memory_gaps.append(gap)

            # Load insights
            for insight_data in data.get('memory_insights', []):
                insight = MemoryInsight(
                    type=insight_data['type'],
                    description=insight_data['description'],
                    confidence=insight_data['confidence'],
                    supporting_memories=insight_data['supporting_memories'],
                    created_at=datetime.fromisoformat(insight_data['created_at'])
                )
                self.memory_insights.append(insight)

            # Load stats
            self.stats.update(data.get('stats', {}))
            self.stats['total_memories'] = len(self.memories)

            logger.info(f"[OK] Loaded {len(self.memories)} memories from {self.storage_file}")

        except Exception as e:
            logger.error(f"[ERROR] Failed to load memory data: {e}")

    def __del__(self):
        """Cleanup when object is destroyed"""
        if hasattr(self, 'processor'):
            self.processor.stop_processing()
        self.save_memory_data()
