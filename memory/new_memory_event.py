"""Fixed version of the new memory event system with proper provenance structure"""

import json
import uuid
import hashlib
import math
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field, asdict
from enum import Enum

# Import shared data models
from astra_ai.memory.memory_data_models import (
    EmotionalContext, SemanticContext, Provenance, 
    MemoryEvent, UpdateLogEntry, Cluster, FactHistoryEntry
)


class MemoryEventType(Enum):
    """Supported memory event types"""
    ADD = "ADD"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    GET = "GET"
    CONSOLIDATE = "CONSOLIDATE"
    CONFIRM = "CONFIRM"
    FORGET = "FORGET"


@dataclass
class VectorIndexEntry:
    """Represents an entry in the vector index"""
    event_id: str
    embedding_vector: List[float] = field(default_factory=list)
    
    def __post_init__(self):
        if not self.embedding_vector:
            self.embedding_vector = [0.0] * 8  # 8-dimensional vector


@dataclass
class MemoryCluster(Cluster):
    """Enhanced cluster with proper structure"""
    topic_label: str = ""
    centroid_vector: List[float] = field(default_factory=list)
    event_ids: List[str] = field(default_factory=list)
    coherence_score: float = 0.0
    last_updated: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        if not self.cluster_id:
            self.cluster_id = f"cluster_{uuid.uuid4().hex[:8]}"
        if not self.last_updated:
            self.last_updated = datetime.now().isoformat()
        if not self.centroid_vector:
            self.centroid_vector = [0.0] * 8  # 8-dimensional vector


@dataclass
class MemoryEngine:
    """Main memory engine containing all memory components"""
    metadata: Dict[str, Any] = field(default_factory=dict)
    memory_events: List[Dict[str, Any]] = field(default_factory=list)
    vector_index: Dict[str, List[float]] = field(default_factory=dict)
    clusters: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    update_log: List[Dict[str, Any]] = field(default_factory=list)
    
    def __post_init__(self):
        if not self.metadata:
            self.metadata = {
                "version": "1.0",
                "generated_at": datetime.now().isoformat(),
                "description": "Mem0 AI Memory Engine - Event-based user memory management system"
            }


class NewMemoryEventSystem:
    """Complete implementation of the new memory event system"""
    
    def __init__(self, storage_file: str = "astra_ai/Date/nova_ai_memory.json"):
        self.storage_file = storage_file
        self.memory_engine = MemoryEngine()
        self._initialize_memory_engine()
    
    def _initialize_memory_engine(self):
        """Initialize memory engine with proper structure"""
        # Ensure all required components exist
        if not self.memory_engine.metadata:
            self.memory_engine.metadata = {
                "version": "1.0",
                "generated_at": datetime.now().isoformat(),
                "description": "Mem0 AI Memory Engine - Event-based user memory management system"
            }
        
        if not self.memory_engine.memory_events:
            self.memory_engine.memory_events = []
            
        if not self.memory_engine.vector_index:
            self.memory_engine.vector_index = {}
            
        if not self.memory_engine.clusters:
            self.memory_engine.clusters = {}
            
        if not self.memory_engine.update_log:
            self.memory_engine.update_log = []
    
    def create_add_event(self, 
                        user_input: str,
                        context: str = "",
                        category: str = "personal_preferences",
                        subcategory: str = "general",
                        confidence: float = 0.8) -> Dict[str, Any]:
        """
        Create a complete ADD event with all required fields
        
        Args:
            user_input: The user's input text
            context: Context where the information was provided
            category: Memory category
            subcategory: Memory subcategory
            confidence: Confidence score (0.0-1.0)
            
        Returns:
            Complete MemoryEvent object as dictionary
        """
        event_id = f"evt_{uuid.uuid4().hex[:8]}"
        timestamp = datetime.now().isoformat()
        
        # Create emotional context
        emotional_context = {
            "sentiment": "positive" if any(word in user_input.lower() for word in 
                                      ["love", "like", "enjoy", "prefer", "happy"]) else "neutral",
            "emotion_tags": self._extract_emotion_tags(user_input),
            "emotional_intensity": 0.5,
            "mood_context": "normal",
            "confidence": confidence
        }
        
        # Create semantic context
        semantic_context = {
            "related_facts": [],
            "confidence_score": confidence,
            "context_type": "new_fact",
            "semantic_tags": [subcategory],
            "similarity_hash": hashlib.md5(user_input.encode()).hexdigest()[:8]
        }
        
        # Create provenance
        provenance = {
            "enhanced_in_place": True,
            "enhanced_at": timestamp,
            "source_info": {
                "source_type": "conversation",
                "source_details": "chat input",
                "context": context or user_input,
                "event_index": len(self.memory_engine.memory_events)
            },
            "source_conversation_timestamp": timestamp
        }
        
        # Create memory event
        event = {
            "event_id": event_id,
            "type": MemoryEventType.ADD.value,
            "summary": self._generate_summary(user_input, "ADD"),
            "timestamp": timestamp,
            "emotional_context": emotional_context,
            "semantic_context": semantic_context,
            "importance_score": self._calculate_importance_score(user_input, category),
            "confidence": confidence,
            "category": category,
            "subcategory": subcategory,
            "previous_value": None,
            "current_value": user_input,
            "provenance": provenance,
            "Added_preference": user_input
        }
        
        return event
    
    def create_update_event(self,
                           previous_event: Dict[str, Any],
                           new_value: str,
                           context: str = "",
                           confidence: float = 0.8) -> Dict[str, Any]:
        """
        Create a complete UPDATE event with all required fields
        
        Args:
            previous_event: The event being updated (as dictionary)
            new_value: The new value
            context: Context where the information was provided
            confidence: Confidence score (0.0-1.0)
            
        Returns:
            Complete MemoryEvent object as dictionary
        """
        event_id = f"evt_{uuid.uuid4().hex[:8]}"
        timestamp = datetime.now().isoformat()
        
        # Calculate similarity score
        similarity_score = self._calculate_similarity(
            str(previous_event.get("current_value", "")), new_value
        )
        
        # Determine update type
        update_type = self._determine_update_type(
            str(previous_event.get("current_value", "")), new_value
        )
        
        # Create emotional context
        emotional_context = {
            "sentiment": "positive" if any(word in new_value.lower() for word in 
                                      ["love", "like", "enjoy", "prefer", "happy"]) else "neutral",
            "emotion_tags": self._extract_emotion_tags(new_value),
            "emotional_intensity": 0.7 if update_type == "reinforcement" else 0.5,
            "mood_context": "happy" if update_type == "reinforcement" else "normal",
            "confidence": confidence
        }
        
        # Create semantic context
        semantic_context = {
            "related_facts": [previous_event.get("event_id", "")],
            "confidence_score": similarity_score,
            "context_type": "preference_update",
            "semantic_tags": previous_event.get("semantic_context", {}).get("semantic_tags", ["general"]),
            "similarity_hash": hashlib.md5(new_value.encode()).hexdigest()[:8]
        }
        
        # Create provenance with all required fields
        provenance = {
            "enhanced_in_place": True,
            "enhanced_at": timestamp,
            "source_info": {
                "source_type": "conversation",
                "source_details": "chat input",
                "context": context or f"User: {new_value}",
                "event_index": len(self.memory_engine.memory_events)
            },
            "original_summary": previous_event.get("summary", ""),
            "context": context or f"User: {new_value}",
            "source_conversation_timestamp": timestamp,
            "cleanup_operation": f"{update_type}_update"
        }
        
        # Create memory event
        event = {
            "event_id": event_id,
            "type": MemoryEventType.UPDATE.value,
            "summary": self._generate_summary(new_value, "UPDATE", previous_event.get("summary", "")),
            "timestamp": timestamp,
            "emotional_context": emotional_context,
            "semantic_context": semantic_context,
            "importance_score": self._calculate_importance_score(new_value, previous_event.get("category", "general")),
            "confidence": confidence,
            "category": previous_event.get("category", "general"),
            "subcategory": previous_event.get("subcategory", "general"),
            "previous_value": previous_event.get("current_value"),
            "current_value": new_value,
            "provenance": provenance
        }
        
        return event
    
    def _extract_emotion_tags(self, text: str) -> List[str]:
        """Extract emotion tags from text"""
        tags = []
        text_lower = text.lower()
        
        # Positive emotions
        if any(word in text_lower for word in ["love", "like", "enjoy", "prefer", "happy", "excited"]):
            tags.append("interest")
        if any(word in text_lower for word in ["love", "adore", "cherish"]):
            tags.append("love")
        if any(word in text_lower for word in ["excited", "thrilled", "pumped"]):
            tags.append("excited")
        if any(word in text_lower for word in ["proud", "accomplished"]):
            tags.append("proud")
            
        # Negative emotions
        if any(word in text_lower for word in ["hate", "dislike", "avoid"]):
            tags.append("dislike")
        if any(word in text_lower for word in ["frustrated", "annoyed"]):
            tags.append("frustration")
        if any(word in text_lower for word in ["sad", "disappointed"]):
            tags.append("sadness")
            
        return tags if tags else ["neutral"]
    
    def _generate_summary(self, value: str, event_type: str, previous_summary: str = "") -> str:
        """Generate human-readable summary"""
        if event_type == "ADD":
            return f"User {value}" if not value.startswith("User") else value
        elif event_type == "UPDATE":
            return f"User now prefers {value} instead of previous preference"
        else:
            return value
    
    def _calculate_importance_score(self, text: str, category: str) -> float:
        """Calculate importance score for memory event"""
        base_score = 0.5
        
        # Higher importance for certain categories
        high_importance_categories = [
            "user_identity", "personal_preferences", "user_instructions", 
            "communication_boundaries"
        ]
        
        if category in high_importance_categories:
            base_score += 0.3
            
        # Higher importance for emotionally charged words
        emotional_words = [
            "love", "hate", "always", "never", "important", "crucial", 
            "essential", "critical", "must", "need", "require"
        ]
        
        if any(word in text.lower() for word in emotional_words):
            base_score += 0.2
            
        return min(base_score, 1.0)
    
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
    
    def _determine_update_type(self, old_value: str, new_value: str) -> str:
        """Determine the type of update based on semantic analysis"""
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
    
    def add_to_vector_index(self, event_id: str, text: str):
        """Add event to vector index with embedding"""
        embedding = self._create_embedding(text)
        self.memory_engine.vector_index[event_id] = embedding
    
    def _create_embedding(self, text: str) -> List[float]:
        """Create simple embedding vector for text"""
        if not text:
            return [0.0] * 8
            
        # Normalize text
        text = text.lower().strip()
        
        # Create a simple hash-based embedding
        vector = [0.0] * 8
        text_hash = hash(text) % 1000000
        
        for i in range(8):
            vector[i] = (text_hash >> (i * 4)) & 0xF
            vector[i] = (vector[i] - 7.5) / 7.5  # Normalize to [-1, 1]
        
        # Normalize to unit length
        magnitude = math.sqrt(sum(x * x for x in vector))
        if magnitude > 0:
            vector = [x / magnitude for x in vector]
        
        return vector
    
    def create_cluster(self, topic_label: str, event_ids: List[str]) -> str:
        """Create a new cluster for related events"""
        cluster_id = f"cluster_{uuid.uuid4().hex[:8]}"
        
        # Calculate centroid vector
        centroid = self._calculate_centroid(event_ids)
        coherence_score = self._calculate_cluster_coherence(event_ids)
        
        # Extract metadata
        metadata = {
            "dominant_tags": self._extract_dominant_tags(event_ids),
            "cluster_type": "personal_preferences"  # Default type
        }
        
        cluster = {
            "cluster_id": cluster_id,
            "topic_label": topic_label,
            "centroid_vector": centroid,
            "event_ids": event_ids,
            "coherence_score": coherence_score,
            "last_updated": datetime.now().isoformat(),
            "metadata": metadata
        }
        
        self.memory_engine.clusters[cluster_id] = cluster
        return cluster_id
    
    def _calculate_centroid(self, event_ids: List[str]) -> List[float]:
        """Calculate centroid vector for a cluster"""
        vectors = []
        for event_id in event_ids:
            if event_id in self.memory_engine.vector_index:
                vectors.append(self.memory_engine.vector_index[event_id])
        
        if not vectors:
            return [0.0] * 8
        
        # Calculate average vector
        centroid = [0.0] * 8
        for vector in vectors:
            for i in range(len(vector)):
                centroid[i] += vector[i]
        
        for i in range(len(centroid)):
            centroid[i] /= len(vectors)
        
        # Normalize
        magnitude = math.sqrt(sum(x * x for x in centroid))
        if magnitude > 0:
            centroid = [x / magnitude for x in centroid]
        
        return centroid
    
    def _calculate_cluster_coherence(self, event_ids: List[str]) -> float:
        """Calculate coherence score for a cluster"""
        if len(event_ids) < 2:
            return 1.0
            
        vectors = []
        for event_id in event_ids:
            if event_id in self.memory_engine.vector_index:
                vectors.append(self.memory_engine.vector_index[event_id])
        
        if len(vectors) < 2:
            return 1.0
        
        # Calculate centroid
        centroid = self._calculate_centroid(event_ids)
        
        # Calculate average distance from centroid
        total_distance = 0.0
        for vector in vectors:
            distance = self._euclidean_distance(vector, centroid)
            total_distance += distance
        
        avg_distance = total_distance / len(vectors)
        
        # Convert to coherence score (lower distance = higher coherence)
        coherence = 1.0 / (1.0 + avg_distance)
        return min(coherence, 1.0)
    
    def _euclidean_distance(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate Euclidean distance between two vectors"""
        if len(vec1) != len(vec2):
            return 0.0
        
        return math.sqrt(sum((a - b) ** 2 for a, b in zip(vec1, vec2)))
    
    def _extract_dominant_tags(self, event_ids: List[str]) -> List[str]:
        """Extract dominant tags from clustered events"""
        tags = []
        for event_id in event_ids:
            # Find the event and extract its semantic tags
            for event_dict in self.memory_engine.memory_events:
                if event_dict.get("event_id") == event_id:
                    semantic_context = event_dict.get("semantic_context", {})
                    tags.extend(semantic_context.get("semantic_tags", []))
                    break
        
        # Return unique tags
        return list(set(tags))
    
    def add_to_update_log(self, source_event_id: str, replaced_event_id: str, 
                         similarity_score: float, update_type: str) -> Dict[str, Any]:
        """Add entry to update log"""
        update_id = f"upd_{uuid.uuid4().hex[:8]}"
        timestamp = datetime.now().isoformat()
        
        update_entry = {
            "update_id": update_id,
            "source_event": source_event_id,
            "replaced_event": replaced_event_id,
            "timestamp": timestamp,
            "similarity_score": similarity_score,
            "update_type": update_type
        }
        
        self.memory_engine.update_log.append(update_entry)
        return update_entry
    
    def save_memory(self):
        """Save memory to storage file"""
        try:
            # Create complete memory structure
            memory_data = {
                "user": {
                    "user_id": "usr_001",
                    "name": "Astra",
                    "created_at": datetime.now().isoformat(),
                    "status": "active",
                    "total_sessions": 1,
                    "last_seen": datetime.now().isoformat(),
                    "relationship_established": True
                },
                "memory_engine": {
                    "metadata": self.memory_engine.metadata,
                    "memory_events": self.memory_engine.memory_events,
                    "vector_index": self.memory_engine.vector_index,
                    "clusters": self.memory_engine.clusters,
                    "update_log": self.memory_engine.update_log
                },
                "vector_index": self.memory_engine.vector_index,
                "clusters": self.memory_engine.clusters,
                "conversation": [],
                "fact_history": {},
                "sessions": {},
                "current_session": "session_001",
                "conversation_state": {
                    "greeting_completed": True,
                    "introduction_phase": False,
                    "established_user": True
                },
                "memory_categories": {},
                "category_relationships": {},
                "behavioral_adaptation": {},
                "privacy_settings": {}
            }
            
            # Save to file
            with open(self.storage_file, 'w', encoding='utf-8') as f:
                json.dump(memory_data, f, indent=2, ensure_ascii=False, default=str)
                
        except Exception as e:
            print(f"Error saving memory: {e}")
    
    def load_memory(self):
        """Load memory from storage file"""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r', encoding='utf-8') as f:
                    memory_data = json.load(f)
                
                # Load memory engine
                if "memory_engine" in memory_data:
                    engine_data = memory_data["memory_engine"]
                    self.memory_engine = MemoryEngine(
                        metadata=engine_data.get("metadata", {}),
                        memory_events=engine_data.get("memory_events", []),
                        vector_index=engine_data.get("vector_index", {}),
                        clusters=engine_data.get("clusters", {}),
                        update_log=engine_data.get("update_log", [])
                    )
        except Exception as e:
            print(f"Error loading memory: {e}")

# Example usage
if __name__ == "__main__":
    # Create new memory event system
    memory_system = NewMemoryEventSystem()
    
    # Create an ADD event
    add_event = memory_system.create_add_event(
        user_input="enjoys reading science fiction novels",
        context="User: I love reading sci-fi novels.",
        category="personal_preferences",
        subcategory="likes"
    )
    
    # Add to memory engine
    memory_system.memory_engine.memory_events.append(add_event)
    
    # Add to vector index
    memory_system.add_to_vector_index(add_event["event_id"], str(add_event["current_value"]))
    
    # Create an UPDATE event
    update_event = memory_system.create_update_event(
        previous_event=add_event,
        new_value="enjoys reading science fiction and fantasy novels",
        context="User: Actually, I also like fantasy novels."
    )
    
    # Add to memory engine
    memory_system.memory_engine.memory_events.append(update_event)
    
    # Add to vector index
    memory_system.add_to_vector_index(update_event["event_id"], str(update_event["current_value"]))
    
    # Create cluster
    cluster_id = memory_system.create_cluster(
        topic_label="Book Preferences",
        event_ids=[add_event["event_id"], update_event["event_id"]]
    )
    
    # Add to update log
    update_log_entry = memory_system.add_to_update_log(
        source_event_id=update_event["event_id"],
        replaced_event_id=add_event["event_id"],
        similarity_score=0.85,
        update_type="refinement"
    )
    
    # Save memory
    memory_system.save_memory()
    
    print("Memory events created and saved successfully!")