"""
Main Memory Engine
Integrates all components into a complete memory system following the specification.
"""
import os
import json
import uuid
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass, asdict, field

from .category_detection_engine import CategoryDetectionEngine, MemoryCategory
from .vector_similarity_engine import VectorSimilarityEngine, UpdateTypeClassifier
from .semantic_clustering_engine import SemanticClusteringEngine
from .update_logger import UpdateLogger, UpdateType
from .unified_fact_history import UnifiedFactHistory, UnifiedPreferenceEntry
from .Mem0_ai_organizer import AIOrganizer, ORGANIZER_CONFIG


@dataclass
class MemoryEvent:
    """A single memory event following the specification"""
    event_id: str
    type: str  # "ADD" or "UPDATE"
    summary: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    emotional_context: Dict[str, Any] = field(default_factory=dict)
    semantic_context: Dict[str, Any] = field(default_factory=dict)
    importance_score: float = 0.6
    confidence: float = 0.85
    category: str = "personal_preferences"  # Default category
    subcategory: str = "likes"  # Default subcategory
    previous_value: Optional[str] = None  # Only for UPDATE events
    current_value: str = ""
    provenance: Dict[str, Any] = field(default_factory=dict)


class NovaMemoryEngine:
    """
    Main Memory Engine that integrates all components and follows the specification exactly.
    
    This implementation works exactly as specified:
    - Every new input is processed into an event object (type: ADD or UPDATE) and integrated
    - into long-term memory using a vector-based similarity and clustering system.
    """
    
    def __init__(self, storage_file: str = "astra_ai/Date/nova_ai_memory.json"):
        """
        Initialize the Nova Memory Engine.
        
        Args:
            storage_file: Path to the storage file for memory data
        """
        self.storage_file = storage_file
        self.backup_file = f"{storage_file}.backup"
        
        # Initialize all components
        self.category_detector = CategoryDetectionEngine()
        self.vector_engine = VectorSimilarityEngine()
        self.update_classifier = UpdateTypeClassifier()
        self.clustering_engine = SemanticClusteringEngine(self.vector_engine)
        self.update_logger = UpdateLogger()
        self.fact_history = UnifiedFactHistory()
        
        # Initialize organizer
        organizer_config = ORGANIZER_CONFIG.copy()
        organizer_config['memory_file_path'] = storage_file
        self.organizer = AIOrganizer(organizer_config)
        
        # Initialize memory data structure
        self.data = {
            "memory_events": [],
            "current_facts": {},
            "fact_history": self.fact_history.fact_history,
            "conversation": [],
            "user": {
                "user_id": "default_user",
                "name": None,
                "created_at": datetime.now().isoformat(),
                "status": "active",
                "total_sessions": 0,
                "last_seen": None,
                "relationship_established": False
            },
            "conversation_state": {
                "greeting_completed": False,
                "introduction_phase": True,
                "established_user": False
            }
        }
        
        # Load existing data
        self.load_memory()
    
    def process_input(self, text: str, context: Dict[str, Any] = None) -> MemoryEvent:
        """
        Process new input text into a memory event (ADD or UPDATE).
        
        This is the core function that implements the specification:
        "Every new input is processed into an event object (type: ADD or UPDATE) and integrated"
        
        Args:
            text: The input text to process
            context: Optional context information
            
        Returns:
            MemoryEvent with proper classification and processing
        """
        # Step 1: Automatic category detection
        category, subcategory, confidence = self.category_detector.classify_text(text)
        
        # Step 2: Convert text to vector for similarity comparison
        text_vector = self.vector_engine._create_embedding_vector(text)
        
        # Step 3: Find similar existing events using vector-based similarity
        similar_events = self.vector_engine.find_similar_events(text)
        
        # Step 4: Determine if this should be an ADD or UPDATE event
        if similar_events:
            # Similar event found - create UPDATE event
            most_similar_event_id, similarity_score = similar_events[0]
            
            # Find the original event to get its details
            original_event = None
            for event in self.data["memory_events"]:
                if event.get("event_id") == most_similar_event_id:
                    original_event = event
                    break
            
            if original_event:
                # Determine update type using semantic analysis
                previous_value = original_event.get("current_value", original_event.get("summary", text))
                update_type = self.update_classifier.determine_update_type(previous_value, text)
                
                # Create UPDATE event
                event = MemoryEvent(
                    event_id=f"evt_{uuid.uuid4().hex[:8]}",
                    type="UPDATE",
                    summary=f"User preference updated: {text}",
                    emotional_context={"sentiment": "neutral"},
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
                
                # Log the update
                self.update_logger.create_update_log_entry(
                    source_event_id=event.event_id,
                    replaced_event_id=most_similar_event_id,
                    similarity_score=similarity_score,
                    update_type=update_type,
                    additional_context={
                        "text": text,
                        "previous_value": previous_value
                    }
                )
                
                # Update the fact history with the change
                self._update_fact_history_with_change(
                    subcategory=subcategory,
                    old_value=previous_value,
                    new_value=text,
                    update_type=update_type
                )
        else:
            # No similar event found - create ADD event
            event = MemoryEvent(
                event_id=f"evt_{uuid.uuid4().hex[:8]}",
                type="ADD",
                summary=f"User preference: {text}",
                emotional_context={"sentiment": "neutral"},
                semantic_context={
                    "related_facts": [],
                    "confidence_score": 0.8,
                    "context_type": "new_entry",
                    "semantic_tags": ["new_preference"]
                },
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
            
            # Add to fact history as new preference
            self.fact_history.add_preference(
                subcategory=subcategory,
                item=text,
                score=0.85,
                update_item=f"User preference: {text}"
            )
        
        # Step 5: Add to memory events
        self.data["memory_events"].append(asdict(event))
        
        # Step 6: Add to vector index
        self.vector_engine.add_event_vector(event.event_id, text)
        
        # Step 7: Create or update cluster
        cluster_id = self.clustering_engine.create_or_update_cluster(
            topic_label=f"{category}_{subcategory}", 
            event_id=event.event_id, 
            event_vector=text_vector
        )
        
        # Step 8: Apply AI Organizer enhancement if enabled
        if self.organizer.organizer_enabled:
            try:
                # Enhance the event in place
                enhanced_event = self.organizer._timed_rewrite_entry(asdict(event))
                # Update the event in memory
                for i, mem_event in enumerate(self.data["memory_events"]):
                    if mem_event["event_id"] == event.event_id:
                        self.data["memory_events"][i] = enhanced_event
                        break
            except Exception as e:
                print(f"Organizer enhancement failed: {e}")
        
        # Step 9: Save memory
        self.save_memory()
        
        return event
    
    def _update_fact_history_with_change(self, subcategory: str, old_value: str, 
                                        new_value: str, update_type: str):
        """
        Update the fact history when a preference changes.
        
        Args:
            subcategory: The preference subcategory
            old_value: The previous value
            new_value: The new value
            update_type: Type of update
        """
        # Remove the old value
        self.fact_history.remove_preference(subcategory, old_value)
        
        # Add the new value with update information
        update_message = f"Updated {update_type}: {old_value} -> {new_value}"
        self.fact_history.add_preference(
            subcategory=subcategory,
            item=new_value,
            score=0.9,
            update_item=update_message
        )
    
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
    
    def get_similar_memories(self, text: str, threshold: float = 0.75) -> List[Dict]:
        """
        Find memories similar to the given text.
        
        Args:
            text: Text to find similar memories for
            threshold: Similarity threshold (default 0.75)
            
        Returns:
            List of similar memory events
        """
        similar_event_ids = self.vector_engine.find_similar_events(text, threshold)
        similar_memories = []
        
        for event_id, similarity in similar_event_ids:
            for event in self.data.get("memory_events", []):
                if event.get("event_id") == event_id:
                    event_copy = event.copy()
                    event_copy["similarity_score"] = similarity
                    similar_memories.append(event_copy)
                    break
        
        return similar_memories
    
    def get_update_history(self, event_id: str) -> List[Dict]:
        """
        Get the update history for a specific event.
        
        Args:
            event_id: ID of the event to get history for
            
        Returns:
            List of update log entries for this event
        """
        return [asdict(entry) for entry in self.update_logger.get_update_history(event_id)]
    
    def get_preference_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about user preferences.
        
        Returns:
            Dictionary with preference statistics
        """
        return self.fact_history.get_statistics()
    
    def search_preferences(self, query: str, subcategory: str = None) -> List[Dict]:
        """
        Search for preferences containing the query string.
        
        Args:
            query: Query string to search for
            subcategory: Optional specific subcategory to search in
            
        Returns:
            List of matching preference entries
        """
        return self.fact_history.search_preferences(query, subcategory)
    
    def get_cluster_summary(self, cluster_id: str) -> Dict[str, Any]:
        """
        Get a summary of a specific cluster.
        
        Args:
            cluster_id: ID of the cluster to summarize
            
        Returns:
            Dictionary with cluster summary information
        """
        return self.clustering_engine.get_cluster_summary(cluster_id)
    
    def get_all_clusters_summary(self) -> List[Dict[str, Any]]:
        """
        Get summaries of all clusters.
        
        Returns:
            List of cluster summaries
        """
        return self.clustering_engine.get_all_clusters_summary()
    
    def save_memory(self):
        """Save the memory data to file with backup."""
        try:
            # Create backup
            if os.path.exists(self.storage_file):
                import shutil
                shutil.copy2(self.storage_file, self.backup_file)
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.storage_file), exist_ok=True)
            
            # Update fact_history in data
            self.data["fact_history"] = self.fact_history.fact_history
            
            # Write to file
            with open(self.storage_file, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            print(f"Error saving memory: {e}")
    
    def load_memory(self):
        """Load memory data from file."""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r', encoding='utf-8') as f:
                    file_data = json.load(f)
                    self.data.update(file_data)
                
                # Load fact history
                if "fact_history" in file_data:
                    self.fact_history.fact_history = file_data["fact_history"]
                
                # Load vector index data if available
                if "vector_index" in file_data:
                    self.vector_engine.vector_index = file_data["vector_index"]
                
                # Load clusters data if available
                if "clusters" in file_data:
                    self.clustering_engine.clusters = file_data["clusters"]
                
                # Load update log data if available
                if "update_log" in file_data:
                    self.update_logger.import_update_log(file_data["update_log"])
            else:
                # Initialize with default structure
                self._initialize_default_structure()
        except Exception as e:
            print(f"Error loading memory: {e}")
            # Initialize with default structure
            self._initialize_default_structure()
    
    def _initialize_default_structure(self):
        """Initialize memory with default structure."""
        self.data = {
            "memory_events": [],
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
            "user": {
                "user_id": "default_user",
                "name": None,
                "created_at": datetime.now().isoformat(),
                "status": "active",
                "total_sessions": 0,
                "last_seen": None,
                "relationship_established": False
            },
            "conversation_state": {
                "greeting_completed": False,
                "introduction_phase": True,
                "established_user": False
            }
        }
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """Get statistics about the memory system."""
        return {
            "total_events": len(self.data.get("memory_events", [])),
            "total_clusters": len(self.clustering_engine.clusters),
            "update_log_count": len(self.update_logger.update_log),
            "preference_count": self.fact_history.get_preference_count(),
            "user_name": self.data["user"].get("name"),
            "total_sessions": self.data["user"].get("total_sessions", 0)
        }
    
    def get_conversation_context(self) -> Dict[str, Any]:
        """
        Get context for AI response generation.
        
        Returns:
            Dictionary with conversation context
        """
        return {
            "user_info": self.data["user"],
            "current_facts": self.data["current_facts"],
            "fact_history": self.fact_history.fact_history,
            "recent_events": self.data["memory_events"][-5:] if self.data["memory_events"] else [],
            "conversation_history": self.data["conversation"][-10:] if self.data["conversation"] else [],
            "conversation_state": self.data["conversation_state"]
        }


def create_memory_engine(storage_file: str = "astra_ai/Date/nova_ai_memory.json") -> NovaMemoryEngine:
    """
    Factory function to create and initialize a NovaMemoryEngine instance.
    
    Args:
        storage_file: Path to the storage file for memory data
        
    Returns:
        NovaMemoryEngine instance
    """
    return NovaMemoryEngine(storage_file)


# Example usage and test
if __name__ == "__main__":
    # Create memory engine
    memory = create_memory_engine()
    
    print("Nova Memory Engine Test:")
    print("=" * 30)
    
    # Test processing some inputs
    test_inputs = [
        "I love watching anime shows",
        "I really enjoy reading manga comics",
        "I hate spicy Japanese food", 
        "I prefer Python over JavaScript",
        "Actually, I've changed my mind - I now love spicy food"
    ]
    
    print("Processing test inputs:")
    for i, text in enumerate(test_inputs):
        print(f"\n{i+1}. Processing: '{text}'")
        event = memory.process_input(text)
        print(f"   Created {event.type} event: {event.event_id}")
        print(f"   Category: {event.category}.{event.subcategory}")
        print(f"   Summary: {event.summary}")
    
    print(f"\nMemory Statistics:")
    stats = memory.get_memory_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")
    
    print(f"\nPreference Statistics:")
    pref_stats = memory.get_preference_statistics()
    print(f"  Total preferences: {pref_stats['total_preferences']}")
    print(f"  Average confidence: {pref_stats['average_confidence']:.2f}")
    for subcat, count in pref_stats['subcategory_counts'].items():
        print(f"  {subcat}: {count}")
    
    print(f"\nSearching for 'anime':")
    anime_results = memory.search_preferences("anime")
    print(f"  Found {len(anime_results)} results")
    for result in anime_results:
        print(f"    - {result['item']} (subcategory: {result.get('subcategory', 'unknown')})")
    
    print(f"\nFinding similar memories to 'I enjoy Japanese media':")
    similar = memory.get_similar_memories("I enjoy Japanese media")
    print(f"  Found {len(similar)} similar memories")
    for mem in similar:
        print(f"    - {mem['summary']} (similarity: {mem.get('similarity_score', 0):.3f})")
    
    print(f"\nClusters:")
    clusters = memory.get_all_clusters_summary()
    print(f"  Found {len(clusters)} clusters")
    for cluster in clusters:
        print(f"    Cluster {cluster['cluster_id']}: {cluster['topic_label']} "
              f"({cluster['event_count']} events)")
    
    print("\nTest completed successfully!")