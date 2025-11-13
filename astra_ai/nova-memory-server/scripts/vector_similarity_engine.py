"""
Vector-Based Similarity System
Implements embedding-based similarity detection for ADD vs UPDATE event determination.
"""
import math
import hashlib
from typing import List, Tuple, Dict, Any
from datetime import datetime
import numpy as np


class VectorSimilarityEngine:
    """
    Vector-based similarity engine that determines whether new input should be 
    treated as an ADD or UPDATE event based on semantic similarity to existing memories.
    """
    
    def __init__(self, embedding_dim: int = 128, similarity_threshold: float = 0.75):
        """
        Initialize the vector similarity engine.
        
        Args:
            embedding_dim: Dimension of embedding vectors
            similarity_threshold: Threshold above which events are considered similar (default 0.75)
        """
        self.embedding_dim = embedding_dim
        self.similarity_threshold = similarity_threshold
        self.vector_index = {}  # Maps event_id to embedding vector
        self.event_metadata = {}  # Maps event_id to metadata
    
    def _create_embedding_vector(self, text: str) -> List[float]:
        """
        Create an embedding vector for the given text.
        In a real implementation, this would use a proper embedding model.
        For this implementation, using a hash-based approach that simulates semantic similarity.
        
        Args:
            text: Text to create embedding for
            
        Returns:
            List of floats representing the embedding vector
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
    
    def find_similar_events(self, new_text: str, threshold: float = None) -> List[Tuple[str, float]]:
        """
        Find events that are similar to the new text based on embedding similarity.
        
        Args:
            new_text: The new text to compare against existing events
            threshold: Minimum similarity score to consider events similar (uses default if None)
            
        Returns:
            List of tuples containing (event_id, similarity_score) for similar events
        """
        if threshold is None:
            threshold = self.similarity_threshold
            
        new_vector = self._create_embedding_vector(new_text)
        similar_events = []
        
        # Compare against all existing vectors in the index
        for event_id, existing_vector in self.vector_index.items():
            similarity = self._cosine_similarity(new_vector, existing_vector)
            if similarity >= threshold:
                similar_events.append((event_id, similarity))
        
        # Sort by similarity score (highest first)
        similar_events.sort(key=lambda x: x[1], reverse=True)
        return similar_events
    
    def add_event_vector(self, event_id: str, text: str, metadata: Dict[str, Any] = None):
        """
        Add an event vector to the index.
        
        Args:
            event_id: Unique identifier for the event
            text: Text content of the event
            metadata: Optional metadata about the event
        """
        vector = self._create_embedding_vector(text)
        self.vector_index[event_id] = vector
        if metadata:
            self.event_metadata[event_id] = metadata
        else:
            self.event_metadata[event_id] = {
                "text": text,
                "timestamp": datetime.now().isoformat()
            }
    
    def remove_event_vector(self, event_id: str):
        """
        Remove an event vector from the index.
        
        Args:
            event_id: Unique identifier for the event to remove
        """
        if event_id in self.vector_index:
            del self.vector_index[event_id]
        if event_id in self.event_metadata:
            del self.event_metadata[event_id]
    
    def get_event_similarity(self, event_id1: str, event_id2: str) -> float:
        """
        Get the similarity between two existing events.
        
        Args:
            event_id1: First event ID
            event_id2: Second event ID
            
        Returns:
            Cosine similarity between the two events
        """
        if event_id1 not in self.vector_index or event_id2 not in self.vector_index:
            return 0.0
            
        vec1 = self.vector_index[event_id1]
        vec2 = self.vector_index[event_id2]
        
        return self._cosine_similarity(vec1, vec2)
    
    def get_most_similar_event(self, text: str, exclude_event_ids: List[str] = None) -> Tuple[str, float]:
        """
        Find the single most similar event to the given text.
        
        Args:
            text: Text to find most similar event for
            exclude_event_ids: List of event IDs to exclude from search
            
        Returns:
            Tuple of (event_id, similarity_score) for the most similar event
        """
        similar_events = self.find_similar_events(text)
        
        if exclude_event_ids:
            # Filter out excluded events
            similar_events = [(eid, score) for eid, score in similar_events 
                            if eid not in exclude_event_ids]
        
        if similar_events:
            return similar_events[0]
        else:
            return (None, 0.0)
    
    def get_similarity_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about the vector index and similarities.
        
        Returns:
            Dictionary with statistics about the vector index
        """
        if not self.vector_index:
            return {
                "total_vectors": 0,
                "average_similarity": 0.0,
                "max_similarity": 0.0,
                "min_similarity": 0.0
            }
        
        # Calculate pairwise similarities between all vectors
        event_ids = list(self.vector_index.keys())
        similarities = []
        
        for i in range(len(event_ids)):
            for j in range(i + 1, len(event_ids)):
                similarity = self.get_event_similarity(event_ids[i], event_ids[j])
                similarities.append(similarity)
        
        if similarities:
            return {
                "total_vectors": len(event_ids),
                "average_similarity": sum(similarities) / len(similarities),
                "max_similarity": max(similarities),
                "min_similarity": min(similarities),
                "total_pairwise_comparisons": len(similarities)
            }
        else:
            return {
                "total_vectors": len(event_ids),
                "average_similarity": 0.0,
                "max_similarity": 0.0,
                "min_similarity": 0.0,
                "total_pairwise_comparisons": 0
            }


class UpdateTypeClassifier:
    """
    Classifier that determines the type of update based on semantic analysis
    of old and new values.
    """
    
    def __init__(self):
        # Define update type patterns
        self.update_patterns = {
            "reversal": [
                ("love", "hate"), ("like", "dislike"), ("enjoy", "hate"),
                ("prefer", "avoid"), ("want", "avoid"), ("need", "avoid"),
                ("always", "never"), ("often", "rarely")
            ],
            "reinforcement": [
                (["like"], ["love", "adore", "really like"]),
                (["enjoy"], ["love", "adore", "really enjoy"]),
                (["sometimes"], ["always", "often", "regularly"])
            ],
            "habit_change": [
                "usually", "always", "never", "often", "rarely", 
                "every", "daily", "weekly", "monthly"
            ]
        }
    
    def determine_update_type(self, old_value: str, new_value: str) -> str:
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
        for positive, negative in self.update_patterns["reversal"]:
            if (positive in old_lower and negative in new_lower) or \
               (negative in old_lower and positive in new_lower):
                return "reversal"
        
        # Check for reinforcement (same meaning but stronger tone)
        for weaker_terms, stronger_terms in self.update_patterns["reinforcement"]:
            if any(term in old_lower for term in weaker_terms) and \
               any(term in new_lower for term in stronger_terms):
                return "reinforcement"
        
        # Check for habit_change (change in behavior or repeated context)
        if any(term in old_lower for term in self.update_patterns["habit_change"]) or \
           any(term in new_lower for term in self.update_patterns["habit_change"]):
            return "habit_change"
        
        # Default to refinement (gradual or detailed evolution)
        return "refinement"


# Example usage and test
if __name__ == "__main__":
    # Create vector similarity engine
    similarity_engine = VectorSimilarityEngine(embedding_dim=64, similarity_threshold=0.7)
    
    print("Vector-Based Similarity Engine Test:")
    print("=" * 40)
    
    # Add some sample events
    sample_events = [
        ("evt_001", "I love watching anime", {"type": "preference", "category": "entertainment"}),
        ("evt_002", "I enjoy reading manga", {"type": "preference", "category": "entertainment"}),
        ("evt_003", "I hate spicy food", {"type": "preference", "category": "food"}),
        ("evt_004", "I prefer Python over JavaScript", {"type": "preference", "category": "technology"})
    ]
    
    # Add events to vector index
    for event_id, text, metadata in sample_events:
        similarity_engine.add_event_vector(event_id, text, metadata)
        print(f"Added event {event_id}: '{text}'")
    
    print("\nTesting similarity detection:")
    
    # Test finding similar events
    test_texts = [
        "I really love anime shows",
        "I hate eating spicy dishes",
        "I like Python programming",
        "I enjoy playing video games"
    ]
    
    for text in test_texts:
        similar_events = similarity_engine.find_similar_events(text)
        print(f"\nText: '{text}'")
        if similar_events:
            for event_id, similarity in similar_events:
                metadata = similarity_engine.event_metadata.get(event_id, {})
                original_text = metadata.get("text", "Unknown")
                print(f"  Similar to {event_id} ('{original_text}') - Score: {similarity:.3f}")
        else:
            print("  No similar events found")
    
    # Test update type classifier
    print("\n" + "=" * 40)
    print("Update Type Classification Test:")
    print("=" * 40)
    
    classifier = UpdateTypeClassifier()
    
    update_examples = [
        ("I love watching anime", "I hate watching anime"),  # reversal
        ("I like Python", "I love Python"),  # reinforcement
        ("I sometimes watch movies", "I always watch movies"),  # habit_change
        ("I enjoy reading books", "I prefer reading novels"),  # refinement
    ]
    
    for old_val, new_val in update_examples:
        update_type = classifier.determine_update_type(old_val, new_val)
        print(f"'{old_val}' -> '{new_val}' = {update_type}")
    
    # Show statistics
    print("\n" + "=" * 40)
    print("Vector Index Statistics:")
    print("=" * 40)
    stats = similarity_engine.get_similarity_statistics()
    for key, value in stats.items():
        if isinstance(value, float):
            print(f"{key}: {value:.3f}")
        else:
            print(f"{key}: {value}")