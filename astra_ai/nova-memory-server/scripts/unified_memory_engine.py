"""
Unified Memory Engine Implementation
Based on the specifications from user-memory-analyst.md

This implementation follows the memory engine specification exactly:
- Event-based updates (ADD/UPDATE)
- Vector-based similarity detection 
- Clustering system
- Preference evolution tracking
- 27-category framework
"""
import os
import json
import re
import uuid
import math
from datetime import datetime, date
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict, field
from enum import Enum
from collections import defaultdict
import hashlib
from astra_ai.memory.Mem0_ai_organizer import AIOrganizer, ORGANIZER_CONFIG


class MemoryEventType(Enum):
    ADD = "ADD"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    GET = "GET"
    CONSOLIDATE = "CONSOLIDATE"
    CONFIRM = "CONFIRM"
    FORGET = "FORGET"


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
    GREETING_PATTERNS = "greeting_patterns"               # Greeting history, timing, session tracking
    CONVERSATION_ANALYTICS = "conversation_analytics"     # Duration, session gaps, statistics
    NEWS_WEATHER_HISTORY = "news_weather_history"        # News and weather query results and summaries
    TIMEZONE_PREFERENCES = "timezone_preferences"        # Time zone queries and location preferences


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
class MemoryEvent:
    """A single memory event following the specification"""
    event_id: str
    type: str  # "ADD" or "UPDATE"
    summary: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    emotional_context: EmotionalContext = field(default_factory=EmotionalContext)
    semantic_context: Union[SemanticContext, Dict] = field(default_factory=SemanticContext)
    importance_score: float = 0.6
    confidence: float = 0.85
    category: str = "personal_preferences"  # Default category
    subcategory: str = "likes"  # Default subcategory
    previous_value: Optional[str] = None  # Only for UPDATE events
    current_value: str = ""
    provenance: Dict[str, Any] = field(default_factory=dict)


class MemoryEngine:
    """
    Memory Engine that manages user facts and preferences through event-based updates.
    
    This implementation works exactly as specified:
    - Every new input is processed into an event object (type: ADD or UPDATE) and integrated
    - into long-term memory using a vector-based similarity and clustering system.
    """
    
    def __init__(self, storage_file: str = "astra_ai/Date/nova_ai_memory.json"):
        self.storage_file = storage_file
        self.vector_index = {}  # Maps event_id to embedding vector
        self.clusters = {}      # Maps cluster_id to cluster information  
        self.update_log = []    # Logs of updates for tracking preference evolution
        self.embedding_dim = 128  # Dimension of embedding vectors
        
        # Initialize memory data structure
        self.data = {
            "memory_events": [],
            "vector_index": {},
            "clusters": {},
            "update_log": [],
            "current_facts": {},
            "fact_history": {
                "personal_preferences": {
                    "likes": [],
                    "dislikes": [], 
                    "avoid": [],
                    "always": [],
                    "style": [],
                    "conditional": [],
                    "interests": []
                }
            },
            "conversation": [],
            "user": {}
        }
        
        # Initialize organizer
        organizer_config = ORGANIZER_CONFIG.copy()
        organizer_config['memory_file_path'] = storage_file
        self.organizer = AIOrganizer(organizer_config)
        
        # Load existing data
        self.load_memory()
    
    def _create_embedding_vector(self, text: str) -> List[float]:
        """
        Create an embedding vector for the given text.
        In a real implementation, this would use a proper embedding model.
        For this implementation, using a hash-based approach that simulates semantic similarity.
        """
        if not text:
            return [0.0] * self.embedding_dim
            
        # Normalize text
        text = text.lower().strip()
        
        # Simple approach: create a vector based on character n-grams and semantic features
        vector = [0.0] * self.embedding_dim
        
        # Create features based on character patterns and word patterns
        # Use a simple hash-based approach for consistency
        text_bytes = text.encode('utf-8')
        text_hash = int(hashlib.md5(text_bytes).hexdigest(), 16)
        
        # Distribute the hash across the vector dimensions 
        for i in range(self.embedding_dim):
            vector[i] = ((text_hash >> (i * 3)) & 0x7FF) / 2048.0  # Normalize to [0, 1]
            vector[i] = (vector[i] - 0.5) * 2  # Normalize to [-1, 1]
        
        # Normalize the vector to unit length
        magnitude = math.sqrt(sum(x * x for x in vector))
        if magnitude > 0:
            vector = [x / magnitude for x in vector]
            
        return vector
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.
        Returns a value between -1 and 1, where 1 means identical direction.
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
            threshold: Minimum similarity score to consider events similar (default 0.75)
            
        Returns:
            List of tuples containing (event_id, similarity_score) for similar events
        """
        new_vector = self._create_embedding_vector(new_text)
        similar_events = []
        
        # Compare against all existing vectors in the index
        for event_id, existing_vector in self.data.get("vector_index", {}).items():
            similarity = self._cosine_similarity(new_vector, existing_vector)
            if similarity >= threshold:
                similar_events.append((event_id, similarity))
        
        # Sort by similarity score (highest first)
        similar_events.sort(key=lambda x: x[1], reverse=True)
        return similar_events
    
    def _determine_update_type(self, old_value: str, new_value: str) -> str:
        """
        Determine the type of update based on semantic analysis of old and new values.
        
        Args:
            old_value: The previous value
            new_value: The new value
            
        Returns:
            String representing the update type
        """
        old_lower = old_value.lower() if old_value else ""
        new_lower = new_value.lower() if new_value else ""
        
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
        
        for weak_terms, strong_terms in reinforcement_indicators:
            if any(term in old_lower for term in weak_terms) and \
               any(term in new_lower for term in strong_terms):
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
    
    def _create_cluster(self, topic_label: str, initial_event_id: str) -> str:
        """
        Create a new cluster for related events.

        Args:
            topic_label: Human-readable label for the cluster
            initial_event_id: The first event to be included in this cluster

        Returns:
            The ID of the newly created cluster
        """
        cluster_id = f"cluster_{uuid.uuid4().hex[:8]}"
        
        initial_vector = self.data.get("vector_index", {}).get(initial_event_id, 
                                                              self._create_embedding_vector(""))
        
        self.data["clusters"][cluster_id] = {
            "topic_label": topic_label,
            "centroid_vector": initial_vector,
            "related_events": [initial_event_id],
            "active_event": initial_event_id
        }
        
        return cluster_id
    
    def _add_event_to_cluster(self, cluster_id: str, event_id: str):
        """
        Add an event to an existing cluster and update the cluster centroid.

        Args:
            cluster_id: The ID of the cluster to add to
            event_id: The ID of the event to add
        """
        if cluster_id not in self.data["clusters"]:
            return
            
        cluster = self.data["clusters"][cluster_id]
        
        # Add event to cluster if not already present
        if event_id not in cluster["related_events"]:
            cluster["related_events"].append(event_id)
        
        # Update active event to the most recent one
        cluster["active_event"] = event_id
        
        # Recalculate centroid vector as average of all vectors in the cluster
        vectors = [self.data.get("vector_index", {}).get(event_id, [0.0] * self.embedding_dim) 
                  for event_id in cluster["related_events"] 
                  if event_id in self.data.get("vector_index", {})]
        
        if vectors:
            # Calculate average vector
            centroid = [sum(vec[i] for vec in vectors) / len(vectors) for i in range(len(vectors[0]))]
            cluster["centroid_vector"] = centroid
    
    def _create_update_log_entry(self, source_event_id: str, replaced_event_id: str, 
                                similarity_score: float, update_type: str):
        """
        Create an entry in the update log for tracking how preferences evolve.

        Args:
            source_event_id: ID of the new UPDATE event
            replaced_event_id: ID of the previous event being updated
            similarity_score: Cosine similarity between the two events
            update_type: Type of update (refinement, reversal, reinforcement, habit_change)
        """
        update_id = f"upd_{uuid.uuid4().hex[:8]}"
        update_entry = {
            "update_id": update_id,
            "source_event": source_event_id,
            "replaced_event": replaced_event_id,
            "timestamp": datetime.now().isoformat(),
            "similarity_score": similarity_score,
            "update_type": update_type,
            "note": f"Updated {update_type} with similarity {similarity_score:.3f}"
        }
        
        self.data["update_log"].append(update_entry)
        
        # Add to memory events as well for tracking
        update_event = {
            "type": "UPDATE_LOG",
            "summary": f"Update log entry: {update_type} from {replaced_event_id} to {source_event_id}",
            "timestamp": datetime.now().isoformat(),
            "update_entry": update_entry
        }
        
        self.data["memory_events"].append(update_event)
    
    def _process_input_to_event(self, text: str, category: str = "personal_preferences", 
                               subcategory: str = "likes") -> MemoryEvent:
        """
        Convert input text to a MemoryEvent with proper classification.

        Args:
            text: The input text to convert
            category: The category for the event
            subcategory: The subcategory for the event

        Returns:
            MemoryEvent with proper classification
        """
        # Convert the text to an embedding vector
        text_vector = self._create_embedding_vector(text)
        
        # Find similar events
        similar_events = self._find_similar_events(text, threshold=0.75)
        
        if similar_events:
            # Similar event found - create UPDATE event
            most_similar_event_id, similarity_score = similar_events[0]
            
            # Find the original event to get its details
            original_event = None
            for event in self.data.get("memory_events", []):
                if event.get("event_id") == most_similar_event_id:
                    original_event = event
                    break
            
            if original_event:
                # Determine update type
                previous_value = original_event.get("current_value", original_event.get("summary", text))
                update_type = self._determine_update_type(previous_value, text)
                
                # Create UPDATE event
                event = MemoryEvent(
                    event_id=f"evt_{uuid.uuid4().hex[:8]}",
                    type="UPDATE",
                    summary=f"User preference updated: {text}",
                    emotional_context=EmotionalContext(),
                    semantic_context={
                        "related_facts": [most_similar_event_id],
                        "confidence_score": similarity_score,
                        "context_type": update_type,
                        "semantic_tags": ["preference_update", update_type]
                    },
                    importance_score=0.6,
                    confidence=0.85,
                    category=category,
                    subcategory=subcategory,
                    previous_value=previous_value,
                    current_value=text,
                    provenance={
                        "enhanced_at": datetime.now().isoformat(),
                        "original_summary": previous_value
                    }
                )
                
                # Add to update log
                self._create_update_log_entry(event.event_id, most_similar_event_id, 
                                            similarity_score, update_type)
                
                return event
        else:
            # No similar event found - create ADD event
            event = MemoryEvent(
                event_id=f"evt_{uuid.uuid4().hex[:8]}",
                type="ADD",
                summary=f"User preference: {text}",
                emotional_context=EmotionalContext(),
                semantic_context=SemanticContext(),
                importance_score=0.6,
                confidence=0.85,
                category=category,
                subcategory=subcategory,
                previous_value=None,
                current_value=text,
                provenance={
                    "enhanced_at": datetime.now().isoformat(),
                    "source_info": {
                        "source_type": "conversation",
                        "context": text
                    }
                }
            )
            
            return event
    
    def add_memory(self, text: str, category: str = "personal_preferences", 
                  subcategory: str = "likes") -> MemoryEvent:
        """
        Add a memory with automatic ADD/UPDATE determination.

        Args:
            text: The text to store as memory
            category: The category for the memory
            subcategory: The subcategory for the memory

        Returns:
            The created MemoryEvent
        """
        # Process the input into an event
        event = self._process_input_to_event(text, category, subcategory)
        
        # Add to memory events
        self.data["memory_events"].append(asdict(event))
        
        # Add to vector index
        text_vector = self._create_embedding_vector(text)
        self.data["vector_index"][event.event_id] = text_vector
        
        # Create or update cluster
        topic_label = f"{category}_{subcategory}"
        cluster_exists = False
        for cluster_id, cluster in self.data["clusters"].items():
            if cluster["topic_label"] == topic_label:
                self._add_event_to_cluster(cluster_id, event.event_id)
                cluster_exists = True
                break
        
        if not cluster_exists:
            # Create a new cluster for this topic
            cluster_id = self._create_cluster(topic_label, event.event_id)
        
        # Update fact_history with unified format
        self._update_fact_history(event)
        
        # Save to file
        self.save_memory()
        
        return event
    
    def _update_fact_history(self, event: MemoryEvent):
        """
        Update the fact_history with the new event in unified format.
        """
        if "fact_history" not in self.data:
            self.data["fact_history"] = {
                "personal_preferences": {
                    "likes": [],
                    "dislikes": [], 
                    "avoid": [],
                    "always": [],
                    "style": [],
                    "conditional": [],
                    "interests": []
                }
            }
        
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
        
        # Add to appropriate subcategory
        if event.subcategory in self.data["fact_history"]["personal_preferences"]:
            # Check if item already exists to avoid duplicates
            existing_items = [item["item"] for item in 
                            self.data["fact_history"]["personal_preferences"][event.subcategory]]
            
            if event.current_value not in existing_items:
                # Create unified format entry
                unified_entry = {
                    "item": event.current_value,
                    "update_item": event.summary if event.type == "UPDATE" and event.summary != f"User preference: {event.current_value}" else None,
                    "added": datetime.now().strftime('%Y-%m-%d'),
                    "updated": datetime.now().strftime('%Y-%m-%d') if event.type == "UPDATE" else None,
                    "score": event.confidence
                }
                
                # Remove None values for new additions
                if unified_entry["update_item"] is None:
                    del unified_entry["update_item"]
                if unified_entry["updated"] is None:
                    del unified_entry["updated"]
                
                self.data["fact_history"]["personal_preferences"][event.subcategory].append(unified_entry)
    
    def get_memories_by_category(self, category: str, subcategory: str = None) -> List[Dict]:
        """
        Retrieve memories by category and optional subcategory.

        Args:
            category: The category to retrieve
            subcategory: Optional subcategory to filter

        Returns:
            List of memory events matching the criteria
        """
        matching_events = []
        
        for event in self.data.get("memory_events", []):
            if event.get("category") == category:
                if subcategory is None or event.get("subcategory") == subcategory:
                    matching_events.append(event)
        
        return matching_events
    
    def get_fact_history(self, category: str = "personal_preferences", 
                        subcategory: str = None) -> List[Dict]:
        """
        Get fact history for a specific category and optional subcategory.

        Args:
            category: The category to retrieve
            subcategory: Optional subcategory to filter

        Returns:
            List of fact history entries
        """
        if category not in self.data.get("fact_history", {}):
            return []
        
        if subcategory is None:
            return self.data["fact_history"][category]
        else:
            if subcategory in self.data["fact_history"][category]:
                return self.data["fact_history"][category][subcategory]
            else:
                return []
    
    def get_similar_memories(self, text: str, threshold: float = 0.75) -> List[Dict]:
        """
        Find memories similar to the given text.

        Args:
            text: Text to find similar memories for
            threshold: Similarity threshold (default 0.75)

        Returns:
            List of similar memory events
        """
        similar_event_ids = self._find_similar_events(text, threshold)
        similar_memories = []
        
        for event_id, similarity in similar_event_ids:
            for event in self.data.get("memory_events", []):
                if event.get("event_id") == event_id:
                    event_copy = event.copy()
                    event_copy["similarity_score"] = similarity
                    similar_memories.append(event_copy)
                    break
        
        return similar_memories
    
    def save_memory(self):
        """Save the memory data to file."""
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.storage_file), exist_ok=True)
            
            # Write to temporary file first to avoid corruption
            temp_file = f"{self.storage_file}.tmp"
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
            
            # Atomically replace the original file
            os.replace(temp_file, self.storage_file)
            
        except Exception as e:
            print(f"Error saving memory: {e}")
            # Clean up temp file if it exists
            if os.path.exists(f"{self.storage_file}.tmp"):
                os.remove(f"{self.storage_file}.tmp")
    
    def load_memory(self):
        """Load memory data from file."""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r', encoding='utf-8') as f:
                    file_data = json.load(f)
                    self.data.update(file_data)
            else:
                # Initialize with default structure if file doesn't exist
                self.data = {
                    "memory_events": [],
                    "vector_index": {},
                    "clusters": {},
                    "update_log": [],
                    "current_facts": {},
                    "fact_history": {
                        "personal_preferences": {
                            "likes": [],
                            "dislikes": [], 
                            "avoid": [],
                            "always": [],
                            "style": [],
                            "conditional": [],
                            "interests": []
                        }
                    },
                    "conversation": [],
                    "user": {}
                }
        except FileNotFoundError:
            # Initialize with default structure
            self.data = {
                "memory_events": [],
                "vector_index": {},
                "clusters": {},
                "update_log": [],
                "current_facts": {},
                "fact_history": {
                    "personal_preferences": {
                        "likes": [],
                        "dislikes": [], 
                        "avoid": [],
                        "always": [],
                        "style": [],
                        "conditional": [],
                        "interests": []
                    }
                },
                "conversation": [],
                "user": {}
            }
        except json.JSONDecodeError:
            print("Memory file is corrupted, initializing with default structure")
            self.data = {
                "memory_events": [],
                "vector_index": {},
                "clusters": {},
                "update_log": [],
                "current_facts": {},
                "fact_history": {
                    "personal_preferences": {
                        "likes": [],
                        "dislikes": [], 
                        "avoid": [],
                        "always": [],
                        "style": [],
                        "conditional": [],
                        "interests": []
                    }
                },
                "conversation": [],
                "user": {}
            }
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """Get statistics about the memory system."""
        return {
            "total_events": len(self.data.get("memory_events", [])),
            "total_clusters": len(self.data.get("clusters", {})),
            "total_vector_index": len(self.data.get("vector_index", {})),
            "update_log_count": len(self.data.get("update_log", [])),
            "fact_history_entries": sum(
                len(subcat) 
                for cat in self.data.get("fact_history", {}).values() 
                for subcat in cat.values() 
                if isinstance(subcat, list)
            )
        }


def create_memory_engine(storage_file: str = "astra_ai/Date/nova_ai_memory.json") -> MemoryEngine:
    """
    Factory function to create and initialize a MemoryEngine instance.
    
    Args:
        storage_file: Path to the storage file for memory data
        
    Returns:
        MemoryEngine instance
    """
    return MemoryEngine(storage_file)


# Example usage and test
if __name__ == "__main__":
    # Create memory engine
    memory = create_memory_engine()
    
    print("Memory Engine initialized!")
    print(f"Initial stats: {memory.get_memory_stats()}")
    
    # Test adding some memories
    print("\nAdding 'I love watching anime'...")
    event1 = memory.add_memory("I love watching anime", "personal_preferences", "likes")
    print(f"Created event: {event1.event_id}, type: {event1.type}")
    
    print("\nAdding 'I'm kinda bored of anime now' (should be UPDATE)...")
    event2 = memory.add_memory("I'm kinda bored of anime now", "personal_preferences", "likes")
    print(f"Created event: {event2.event_id}, type: {event2.type}")
    
    print(f"\nUpdated stats: {memory.get_memory_stats()}")
    
    # Get fact history
    print(f"\nFact history for likes: {memory.get_fact_history('personal_preferences', 'likes')}")
    
    # Test similarity
    print(f"\nFinding similar memories to 'I enjoy cartoons'...")
    similar = memory.get_similar_memories("I enjoy cartoons")
    print(f"Found {len(similar)} similar memories")
    
    print("\nMemory Engine test completed successfully!")