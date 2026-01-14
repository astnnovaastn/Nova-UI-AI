"""
New Memory Event Generator for Nova Memory AI System

This module implements the complete memory event system as specified in the requirements,
with proper vector-based similarity detection, clustering, and update logging.
"""

import json
import uuid
import math
import re
from datetime import datetime, date
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum

class MemoryCategory(Enum):
    """27-category memory framework"""
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
class EmotionalContext:
    """Emotional context of a memory event"""
    sentiment: str  # positive, negative, neutral
    emotion_tags: List[str]
    emotional_intensity: float  # 0.0 to 1.0
    mood_context: str
    confidence: float  # 0.0 to 1.0

@dataclass
class SemanticContext:
    """Semantic context of a memory event"""
    related_facts: List[str]  # List of related event IDs
    confidence_score: float   # 0.0 to 1.0 similarity score
    context_type: str          # refinement, reversal, reinforcement, habit_change
    semantic_tags: List[str]
    similarity_hash: str      # Hash for similarity detection

@dataclass
class Provenance:
    """Provenance information for a memory event"""
    enhanced_in_place: bool
    enhanced_at: str
    source_info: Dict[str, Any]
    source_conversation_timestamp: str
    original_summary: Optional[str] = None
    cleanup_operation: Optional[str] = None

@dataclass
class MemoryEvent:
    """Complete memory event structure"""
    event_id: str
    type: str  # ADD, UPDATE, DELETE, etc.
    summary: str
    timestamp: str
    emotional_context: EmotionalContext
    semantic_context: SemanticContext
    importance_score: float  # 0.0 to 1.0
    confidence: float       # 0.0 to 1.0
    category: str
    subcategory: str
    previous_value: Optional[Any]
    current_value: Any
    provenance: Provenance
    Added_preference: Optional[str] = None

class NewMemoryEventGenerator:
    """Generates new memory events following the exact specification"""
    
    def __init__(self, storage_file: str = "astra_ai/Date/nova_ai_memory.json"):
        self.storage_file = storage_file
        self.data = self._load_memory_data()
        self._initialize_memory_engine()
        
    def _load_memory_data(self) -> Dict[str, Any]:
        """Load existing memory data or create new structure"""
        try:
            with open(self.storage_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            # Create default structure
            return self._create_default_memory_structure()
    
    def _create_default_memory_structure(self) -> Dict[str, Any]:
        """Create default memory structure"""
        return {
            "user": {
                "user_id": "usr_001",
                "name": "Astra",
                "created_at": datetime.now().isoformat(),
                "status": "active",
                "total_sessions": 3,
                "last_seen": datetime.now().isoformat(),
                "relationship_established": True
            },
            "memory_events": [],
            "conversation": [],
            "sessions": {},
            "current_session": "session_001",
            "conversation_state": {
                "greeting_completed": True,
                "introduction_phase": False,
                "established_user": True
            },
            "fact_history": {},
            "memory_categories": {},
            "category_relationships": {},
            "behavioral_adaptation": {},
            "privacy_settings": {},
            "vector_index": {},
            "clusters": {},
            "update_log": []
        }
    
    def _initialize_memory_engine(self):
        """Initialize the memory_engine wrapper structure"""
        if "memory_engine" not in self.data:
            self.data["memory_engine"] = {
                "metadata": {
                    "version": "1.0",
                    "generated_at": datetime.now().isoformat(),
                    "description": "Mem0 AI Memory Engine - Event-based user memory management system"
                },
                "memory_events": self.data.get("memory_events", []),
                "vector_index": self.data.get("vector_index", {}),
                "clusters": self.data.get("clusters", {}),
                "update_log": self.data.get("update_log", [])
            }
    
    def _create_embedding_vector(self, text: str) -> List[float]:
        """
        Create an 8-dimensional embedding vector for the given text.
        This is a simplified implementation - in production, this would use a proper embedding model.
        """
        if not text:
            return [0.0] * 8
            
        # Normalize text
        text = text.lower().strip()
        
        # Create embedding vector based on text features
        vector = [0.0] * 8
        
        # Feature 1: Text length normalized
        vector[0] = min(len(text) / 100.0, 1.0)
        
        # Feature 2: Word count normalized
        word_count = len(text.split())
        vector[1] = min(word_count / 20.0, 1.0)
        
        # Feature 3: Character diversity (unique chars / total chars)
        if len(text) > 0:
            unique_chars = len(set(text))
            vector[2] = unique_chars / len(text)
        
        # Feature 4: Vowel ratio
        vowels = sum(1 for c in text if c in 'aeiou')
        if len(text) > 0:
            vector[3] = vowels / len(text)
        
        # Feature 5: Consonant ratio
        consonants = sum(1 for c in text if c.isalpha() and c not in 'aeiou')
        if len(text) > 0:
            vector[4] = consonants / len(text)
        
        # Feature 6: Number ratio
        numbers = sum(1 for c in text if c.isdigit())
        if len(text) > 0:
            vector[5] = numbers / len(text)
        
        # Feature 7: Punctuation ratio
        punctuation = sum(1 for c in text if c in '.,!?;:')
        if len(text) > 0:
            vector[6] = punctuation / len(text)
        
        # Feature 8: Space ratio
        spaces = text.count(' ')
        if len(text) > 0:
            vector[7] = spaces / len(text)
        
        # Normalize the vector to unit length
        magnitude = math.sqrt(sum(x * x for x in vector))
        if magnitude > 0:
            vector = [x / magnitude for x in vector]
        
        return vector
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
            
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = math.sqrt(sum(a * a for a in vec1))
        magnitude2 = math.sqrt(sum(b * b for b in vec2))
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
            
        return dot_product / (magnitude1 * magnitude2)
    
    def _find_similar_events(self, new_text: str, threshold: float = 0.75) -> List[Tuple[str, float]]:
        """Find events that are similar to the new text based on embedding similarity"""
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
        """Create a new cluster for related events"""
        if not hasattr(self, 'clusters'):
            self.clusters = {}
            
        cluster_id = f"cluster_{uuid.uuid4().hex[:8]}"
        
        initial_vector = self.vector_index.get(initial_event_id, [0.0] * 8)
        
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
        """Add an event to an existing cluster and update the cluster centroid"""
        if not hasattr(self, 'clusters'):
            self.clusters = {}
            
        if cluster_id not in self.clusters:
            return
            
        cluster = self.clusters[cluster_id]
        
        # Add event to cluster if not already present
        if event_id not in cluster.get("event_ids", []):
            if "event_ids" not in cluster:
                cluster["event_ids"] = []
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
    
    def _create_update_log_entry(self, source_event_id: str, replaced_event_id: str, 
                                similarity_score: float, update_type: str) -> str:
        """Create an entry in the update log for tracking how preferences evolve"""
        if not hasattr(self, 'update_log'):
            self.update_log = []
            
        update_id = f"upd_{uuid.uuid4().hex[:8]}"
        update_entry = {
            "update_id": update_id,
            "source_event": source_event_id,
            "replaced_event": replaced_event_id,
            "timestamp": datetime.now().isoformat(),
            "similarity_score": similarity_score,
            "update_type": update_type  # Only include required fields as per specification
        }
        
        self.update_log.append(update_entry)
        
        # Add to memory events as well for tracking
        update_event = {
            "type": "UPDATE_LOG",
            "summary": f"Update log entry: {update_type} from {replaced_event_id} to {source_event_id}",
            "timestamp": datetime.now().isoformat(),
            "update_entry": update_entry
        }
        
        self.data["memory_events"].append(update_event)
        
        return update_id
    
    def _update_clusters_for_event(self, event_id: str, event_data: Dict):
        """Update clusters to reflect a new event, either by adding to existing cluster or creating new one"""
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
    
    def _determine_update_type(self, old_value: str, new_value: str) -> str:
        """Determine the type of update based on semantic analysis of old and new values"""
        old_lower = old_value.lower()
        new_lower = new_value.lower()
        
        # Check for reversal (opposite meaning or sentiment)
        reversal_indicators = [
            ('love', 'hate'), ('like', 'dislike'), ('enjoy', 'hate'),
            ('prefer', 'avoid'), ('want', 'avoid'), ('need', 'avoid'),
            ('always', 'never'), ('often', 'rarely')
        ]
        
        for positive, negative in reversal_indicators:
            if (positive in old_lower and negative in new_lower) or \
               (negative in old_lower and positive in new_lower):
                return "reversal"
        
        # Check for reinforcement (same meaning but stronger tone)
        reinforcement_indicators = [
            (['like'], ['love', 'adore', 'really like']),
            (['enjoy'], ['love', 'adore', 'really enjoy']),
            (['sometimes'], ['always', 'often', 'regularly'])
        ]
        
        for weaker_terms, stronger_terms in reinforcement_indicators:
            if any(term in old_lower for term in weaker_terms) and \
               any(term in new_lower for term in stronger_terms):
                return "reinforcement"
        
        # Check for habit_change (change in behavior or repeated context)
        habit_indicators = [
            'usually', 'always', 'never', 'often', 'rarely', 'every', 'daily', 'weekly'
        ]
        
        if any(term in old_lower for term in habit_indicators) or \
           any(term in new_lower for term in habit_indicators):
            return "habit_change"
        
        # Default to refinement (gradual or detailed evolution)
        return "refinement"
    
    def _calculate_importance_score(self, text: str, category: str) -> float:
        """Calculate importance score for a memory event"""
        base_score = 0.5  # Base importance
        
        # Higher importance for certain categories
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
        
        content_lower = text.lower()
        for indicator in important_indicators:
            if indicator in content_lower:
                base_score += 0.1
                break
                
        return min(base_score, 1.0)
    
    def _classify_category_and_subcategory(self, text: str) -> Tuple[str, str]:
        """Classify incoming text into appropriate category and subcategory"""
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
    
    def create_add_event(self, text: str, context: str = "") -> Dict[str, Any]:
        """
        Create a complete ADD event as specified in the documentation.
        
        Args:
            text: The text content for the new preference/event
            context: Optional context string
            
        Returns:
            Complete ADD event structure following the specification
        """
        # Generate unique event ID
        event_id = f"evt_{uuid.uuid4().hex[:8]}"
        timestamp = datetime.now().isoformat()
        
        # Classify category and subcategory
        category, subcategory = self._classify_category_and_subcategory(text)
        
        # Calculate importance score
        importance_score = self._calculate_importance_score(text, category)
        
        # Create emotional context
        emotional_context = EmotionalContext(
            sentiment="positive",  # Default to positive for preferences
            emotion_tags=["interest"],  # Default emotion tag
            emotional_intensity=0.6,  # Moderate intensity
            mood_context="normal",
            confidence=0.85  # High confidence for user-provided information
        )
        
        # Create semantic context
        semantic_context = SemanticContext(
            related_facts=[],  # Empty for ADD events
            confidence_score=0.8,  # Default confidence
            context_type="new_fact",  # Type of context
            semantic_tags=[subcategory],  # Semantic tags
            similarity_hash=hash(text) % 1000000  # Simple hash for similarity detection
        )
        
        # Create provenance information
        provenance = Provenance(
            enhanced_in_place=True,
            enhanced_at=timestamp,
            source_info={
                "source_type": "conversation",
                "source_details": "chat input",
                "context": context if context else f"User: {text}",
                "event_index": len(self.data.get("memory_events", []))
            },
            source_conversation_timestamp=timestamp
        )
        
        # Create the ADD event
        add_event = {
            "event_id": event_id,
            "type": "ADD",
            "summary": f"User enjoys {text}" if 'like' in text.lower() or 'love' in text.lower() else text,
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
                "similarity_hash": str(semantic_context.similarity_hash)
            },
            "importance_score": importance_score,
            "confidence": 0.85,
            "category": category,
            "subcategory": subcategory,
            "previous_value": None,
            "current_value": text,
            "provenance": {
                "enhanced_in_place": provenance.enhanced_in_place,
                "enhanced_at": provenance.enhanced_at,
                "source_info": provenance.source_info,
                "source_conversation_timestamp": provenance.source_conversation_timestamp
            },
            "Added_preference": text
        }
        
        # Add to memory events
        if "memory_events" not in self.data:
            self.data["memory_events"] = []
        self.data["memory_events"].append(add_event)
        
        # Add to vector index
        text_vector = self._create_embedding_vector(text)
        if "vector_index" not in self.data:
            self.data["vector_index"] = {}
        self.data["vector_index"][event_id] = text_vector
        
        # Add to cluster
        cluster_id = self._create_cluster(f"{category}_{event_id[:8]}", event_id)
        
        # Update fact history
        if "fact_history" not in self.data:
            self.data["fact_history"] = {}
        if category not in self.data["fact_history"]:
            self.data["fact_history"][category] = {}
        if subcategory not in self.data["fact_history"][category]:
            self.data["fact_history"][category][subcategory] = []
        
        self.data["fact_history"][category][subcategory].append({
            "item": text,
            "added": datetime.now().strftime('%Y-%m-%d'),
            "score": 0.85
        })
        
        # Update clusters to reflect the new event
        self._update_clusters_for_event(event_id, add_event)
        
        # Save memory
        self.save_memory()
        
        return add_event
    
    def create_update_event(self, previous_event_id: str, new_text: str, 
                           previous_value: str, context: str = "") -> Dict[str, Any]:
        """
        Create a complete UPDATE event as specified in the documentation.
        
        Args:
            previous_event_id: ID of the event being updated
            new_text: The new text content
            previous_value: The previous value before update
            context: Optional context string
            
        Returns:
            Complete UPDATE event structure following the specification
        """
        # Generate unique event ID
        event_id = f"evt_{uuid.uuid4().hex[:8]}"
        timestamp = datetime.now().isoformat()
        
        # Classify category and subcategory
        category, subcategory = self._classify_category_and_subcategory(new_text)
        
        # Calculate importance score
        importance_score = self._calculate_importance_score(new_text, category)
        
        # Determine update type based on semantic analysis
        update_type = self._determine_update_type(previous_value, new_text)
        
        # Calculate similarity score between old and new values
        old_vector = self._create_embedding_vector(previous_value)
        new_vector = self._create_embedding_vector(new_text)
        similarity_score = self._cosine_similarity(old_vector, new_vector)
        
        # Create emotional context
        emotional_context = EmotionalContext(
            sentiment="positive",  # Default to positive
            emotion_tags=["interest"],  # Default emotion tag
            emotional_intensity=0.7,  # Moderate-high intensity
            mood_context="happy" if update_type == "reinforcement" else "normal",
            confidence=0.88  # High confidence
        )
        
        # Create semantic context
        semantic_context = SemanticContext(
            related_facts=[previous_event_id],  # Link to previous event
            confidence_score=similarity_score,  # Use calculated similarity
            context_type=update_type,  # Type of update
            semantic_tags=[subcategory],  # Semantic tags
            similarity_hash=hash(new_text) % 1000000  # Hash for similarity detection
        )
        
        # Create provenance information
        provenance = Provenance(
            enhanced_in_place=True,
            enhanced_at=timestamp,
            original_summary=f"User enjoys {previous_value}" if "love" in previous_value.lower() else f"User previously had {previous_value}",
            context=context if context else f"User: Actually, I {new_text}",
            source_conversation_timestamp=timestamp,
            cleanup_operation="merged_preferences" if update_type in ["refinement", "reinforcement"] else "preference_evolution"
        )
        
        # Create the UPDATE event
        update_event = {
            "event_id": event_id,
            "type": "UPDATE",
            "summary": f"User now prefers {new_text} instead of previous value",
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
                "similarity_hash": str(semantic_context.similarity_hash)
            },
            "importance_score": importance_score,
            "confidence": 0.9,
            "category": category,
            "subcategory": subcategory,
            "previous_value": previous_value,
            "current_value": new_text,
            "provenance": {
                "enhanced_in_place": provenance.enhanced_in_place,
                "enhanced_at": provenance.enhanced_at,
                "original_summary": provenance.original_summary,
                "context": provenance.context,
                "source_conversation_timestamp": provenance.source_conversation_timestamp,
                "cleanup_operation": provenance.cleanup_operation
            }
        }
        
        # Add to update log for tracking preference evolution
        self._create_update_log_entry(event_id, previous_event_id, similarity_score, update_type)
        
        # Add to memory events
        if "memory_events" not in self.data:
            self.data["memory_events"] = []
        self.data["memory_events"].append(update_event)
        
        # Update vector index with new vector for this event
        text_vector = self._create_embedding_vector(new_text)
        if "vector_index" not in self.data:
            self.data["vector_index"] = {}
        self.data["vector_index"][event_id] = text_vector
        
        # Update clusters to reflect the new state
        self._update_clusters_for_event(event_id, update_event)
        
        # Update fact history
        if "fact_history" not in self.data:
            self.data["fact_history"] = {}
        if category not in self.data["fact_history"]:
            self.data["fact_history"][category] = {}
        if subcategory not in self.data["fact_history"][category]:
            self.data["fact_history"][category][subcategory] = []
        
        # Update the existing entry or add a new one
        fact_history = self.data["fact_history"][category][subcategory]
        updated = False
        for entry in fact_history:
            if entry.get("item") == previous_value:
                entry["update_item"] = new_text
                entry["updated"] = datetime.now().strftime('%Y-%m-%d')
                entry["score"] = 0.9
                updated = True
                break
        
        if not updated:
            fact_history.append({
                "item": new_text,
                "added": datetime.now().strftime('%Y-%m-%d'),
                "score": 0.9
            })
        
        # Save memory
        self.save_memory()
        
        return update_event
    
    def save_memory(self):
        """Save the complete memory structure to file"""
        # Update memory_engine with latest data
        if "memory_engine" in self.data:
            self.data["memory_engine"]["memory_events"] = self.data.get("memory_events", [])
            self.data["memory_engine"]["vector_index"] = self.data.get("vector_index", {})
            self.data["memory_engine"]["clusters"] = self.data.get("clusters", {})
            self.data["memory_engine"]["update_log"] = self.data.get("update_log", [])
            self.data["memory_engine"]["generated_at"] = datetime.now().isoformat()
        
        # Save to file
        with open(self.storage_file, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False, default=str)
    
    def get_complete_memory_structure(self) -> Dict[str, Any]:
        """
        Get the complete memory structure as specified in New_memory_event.json
        
        Returns:
            Complete memory structure with all required components
        """
        # Ensure memory_engine is up to date
        self._initialize_memory_engine()
        
        # Return the complete structure
        return {
            "user": self.data.get("user", {}),
            "memory_engine": self.data.get("memory_engine", {}),
            "vector_index": self.data.get("vector_index", {}),
            "clusters": self.data.get("clusters", {}),
            "conversation": self.data.get("conversation", []),
            "fact_history": self.data.get("fact_history", {}),
            "sessions": self.data.get("sessions", {}),
            "current_session": self.data.get("current_session"),
            "conversation_state": self.data.get("conversation_state", {}),
            "memory_categories": self.data.get("memory_categories", {}),
            "category_relationships": self.data.get("category_relationships", {}),
            "behavioral_adaptation": self.data.get("behavioral_adaptation", {}),
            "privacy_settings": self.data.get("privacy_settings", {})
        }

# Example usage
def main():
    """Example usage of the new memory event generator"""
    generator = NewMemoryEventGenerator()
    
    # Create an ADD event
    add_event = generator.create_add_event(
        "reading science fiction novels",
        "User: I love reading sci-fi novels."
    )
    print("ADD Event:")
    print(json.dumps(add_event, indent=2))
    
    # Create an UPDATE event
    update_event = generator.create_update_event(
        add_event["event_id"],
        "reading science fiction and fantasy novels",
        "reading science fiction novels",
        "User: Actually, I also like fantasy novels."
    )
    print("\nUPDATE Event:")
    print(json.dumps(update_event, indent=2))
    
    # Get complete memory structure
    complete_structure = generator.get_complete_memory_structure()
    print("\nComplete Memory Structure:")
    print(json.dumps(complete_structure, indent=2))

if __name__ == "__main__":
    main()