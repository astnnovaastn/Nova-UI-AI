"""
Clustering System for Semantic Grouping
Groups semantically related memories together for better organization and retrieval.
"""
import math
import uuid
from typing import List, Dict, Tuple, Any, Optional
from datetime import datetime
from collections import defaultdict
from dataclasses import dataclass, field
from .vector_similarity_engine import VectorSimilarityEngine


@dataclass
class Cluster:
    """Represents a semantic cluster of related memory events"""
    cluster_id: str
    topic_label: str
    centroid_vector: List[float]
    related_events: List[str] = field(default_factory=list)
    active_event: str = ""
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())
    confidence_score: float = 0.8
    semantic_tags: List[str] = field(default_factory=list)


class SemanticClusteringEngine:
    """
    Semantic clustering engine that groups related memory events together based on
    semantic similarity and creates coherent topic clusters.
    """
    
    def __init__(self, similarity_engine: VectorSimilarityEngine = None):
        """
        Initialize the semantic clustering engine.
        
        Args:
            similarity_engine: Vector similarity engine to use for comparisons
        """
        self.clusters: Dict[str, Cluster] = {}
        self.similarity_engine = similarity_engine or VectorSimilarityEngine()
        self.cluster_threshold = 0.6  # Threshold for clustering
    
    def _calculate_centroid(self, event_vectors: List[List[float]]) -> List[float]:
        """
        Calculate the centroid vector for a group of event vectors.
        
        Args:
            event_vectors: List of embedding vectors
            
        Returns:
            Centroid vector (average of all vectors)
        """
        if not event_vectors:
            return [0.0] * self.similarity_engine.embedding_dim
            
        # Calculate average vector
        centroid = [0.0] * len(event_vectors[0])
        for vector in event_vectors:
            for i in range(len(vector)):
                centroid[i] += vector[i]
        
        # Normalize by number of vectors
        for i in range(len(centroid)):
            centroid[i] /= len(event_vectors)
            
        return centroid
    
    def create_cluster(self, topic_label: str, initial_event_id: str, 
                      initial_vector: List[float] = None) -> str:
        """
        Create a new cluster for related events.
        
        Args:
            topic_label: Human-readable label for the cluster
            initial_event_id: The first event to be included in this cluster
            initial_vector: Optional initial vector for the cluster
            
        Returns:
            The ID of the newly created cluster
        """
        cluster_id = f"cluster_{uuid.uuid4().hex[:8]}"
        
        # Get initial vector if not provided
        if initial_vector is None:
            if initial_event_id in self.similarity_engine.vector_index:
                initial_vector = self.similarity_engine.vector_index[initial_event_id]
            else:
                # Create a new vector for this event
                initial_vector = [0.0] * self.similarity_engine.embedding_dim
        
        # Create cluster
        cluster = Cluster(
            cluster_id=cluster_id,
            topic_label=topic_label,
            centroid_vector=initial_vector,
            related_events=[initial_event_id],
            active_event=initial_event_id,
            semantic_tags=[topic_label.lower().replace(' ', '_')]
        )
        
        self.clusters[cluster_id] = cluster
        return cluster_id
    
    def add_event_to_cluster(self, cluster_id: str, event_id: str):
        """
        Add an event to an existing cluster and update the cluster centroid.
        
        Args:
            cluster_id: The ID of the cluster to add to
            event_id: The ID of the event to add
        """
        if cluster_id not in self.clusters:
            return
            
        cluster = self.clusters[cluster_id]
        
        # Add event to cluster if not already present
        if event_id not in cluster.related_events:
            cluster.related_events.append(event_id)
        
        # Update active event to the most recent one
        cluster.active_event = event_id
        cluster.updated_at = datetime.now().isoformat()
        
        # Recalculate centroid vector as average of all vectors in the cluster
        vectors = [self.similarity_engine.vector_index.get(event_id, [0.0] * self.similarity_engine.embedding_dim)
                  for event_id in cluster.related_events 
                  if event_id in self.similarity_engine.vector_index]
        
        if vectors:
            # Calculate average vector
            cluster.centroid_vector = self._calculate_centroid(vectors)
    
    def find_best_cluster(self, event_id: str, event_vector: List[float] = None) -> Optional[str]:
        """
        Find the best cluster for a given event based on semantic similarity.
        
        Args:
            event_id: The ID of the event to cluster
            event_vector: Optional vector for the event
            
        Returns:
            ID of the best matching cluster, or None if no suitable cluster found
        """
        if not self.clusters:
            return None
            
        if event_vector is None:
            if event_id in self.similarity_engine.vector_index:
                event_vector = self.similarity_engine.vector_index[event_id]
            else:
                return None
                
        best_cluster_id = None
        best_similarity = 0.0
        
        # Compare against centroids of all existing clusters
        for cluster_id, cluster in self.clusters.items():
            similarity = self.similarity_engine._cosine_similarity(event_vector, cluster.centroid_vector)
            if similarity >= self.cluster_threshold and similarity > best_similarity:
                best_similarity = similarity
                best_cluster_id = cluster_id
        
        return best_cluster_id
    
    def create_or_update_cluster(self, topic_label: str, event_id: str, 
                                event_vector: List[float] = None) -> str:
        """
        Create a new cluster or add event to existing cluster.
        
        Args:
            topic_label: Label for the cluster
            event_id: ID of the event to cluster
            event_vector: Optional vector for the event
            
        Returns:
            ID of the cluster the event was added to
        """
        # Find best existing cluster
        best_cluster_id = self.find_best_cluster(event_id, event_vector)
        
        if best_cluster_id:
            # Add to existing cluster
            self.add_event_to_cluster(best_cluster_id, event_id)
            return best_cluster_id
        else:
            # Create new cluster
            return self.create_cluster(topic_label, event_id, event_vector)
    
    def get_cluster_events(self, cluster_id: str) -> List[str]:
        """
        Get all events in a cluster.
        
        Args:
            cluster_id: ID of the cluster
            
        Returns:
            List of event IDs in the cluster
        """
        if cluster_id in self.clusters:
            return self.clusters[cluster_id].related_events
        return []
    
    def get_cluster_by_event(self, event_id: str) -> Optional[str]:
        """
        Find which cluster contains a specific event.
        
        Args:
            event_id: ID of the event to find
            
        Returns:
            ID of the cluster containing the event, or None if not found
        """
        for cluster_id, cluster in self.clusters.items():
            if event_id in cluster.related_events:
                return cluster_id
        return None
    
    def get_cluster_summary(self, cluster_id: str) -> Dict[str, Any]:
        """
        Get a summary of a cluster.
        
        Args:
            cluster_id: ID of the cluster to summarize
            
        Returns:
            Dictionary with cluster summary information
        """
        if cluster_id not in self.clusters:
            return {}
            
        cluster = self.clusters[cluster_id]
        return {
            "cluster_id": cluster.cluster_id,
            "topic_label": cluster.topic_label,
            "event_count": len(cluster.related_events),
            "active_event": cluster.active_event,
            "created_at": cluster.created_at,
            "updated_at": cluster.updated_at,
            "confidence_score": cluster.confidence_score,
            "semantic_tags": cluster.semantic_tags
        }
    
    def get_all_clusters_summary(self) -> List[Dict[str, Any]]:
        """
        Get summaries of all clusters.
        
        Returns:
            List of cluster summaries
        """
        summaries = []
        for cluster_id in self.clusters:
            summaries.append(self.get_cluster_summary(cluster_id))
        return summaries
    
    def remove_event_from_cluster(self, event_id: str) -> bool:
        """
        Remove an event from its cluster.
        
        Args:
            event_id: ID of the event to remove
            
        Returns:
            True if event was removed, False otherwise
        """
        cluster_id = self.get_cluster_by_event(event_id)
        if cluster_id and cluster_id in self.clusters:
            cluster = self.clusters[cluster_id]
            if event_id in cluster.related_events:
                cluster.related_events.remove(event_id)
                
                # Update active event if it was the one removed
                if cluster.active_event == event_id and cluster.related_events:
                    cluster.active_event = cluster.related_events[-1]
                elif cluster.active_event == event_id:
                    cluster.active_event = ""
                    
                cluster.updated_at = datetime.now().isoformat()
                
                # Recalculate centroid
                vectors = [self.similarity_engine.vector_index.get(eid, [0.0] * self.similarity_engine.embedding_dim)
                          for eid in cluster.related_events 
                          if eid in self.similarity_engine.vector_index]
                
                if vectors:
                    cluster.centroid_vector = self._calculate_centroid(vectors)
                else:
                    # If no events left, remove the cluster
                    del self.clusters[cluster_id]
                    
                return True
        return False
    
    def merge_similar_clusters(self, similarity_threshold: float = 0.85) -> int:
        """
        Merge clusters that are semantically similar.
        
        Args:
            similarity_threshold: Threshold above which clusters are considered similar
            
        Returns:
            Number of clusters merged
        """
        merged_count = 0
        cluster_ids = list(self.clusters.keys())
        
        # Compare all pairs of clusters
        for i in range(len(cluster_ids)):
            for j in range(i + 1, len(cluster_ids)):
                cluster_id1 = cluster_ids[i]
                cluster_id2 = cluster_ids[j]
                
                # Check if both clusters still exist (may have been merged already)
                if cluster_id1 not in self.clusters or cluster_id2 not in self.clusters:
                    continue
                    
                cluster1 = self.clusters[cluster_id1]
                cluster2 = self.clusters[cluster_id2]
                
                # Calculate similarity between cluster centroids
                similarity = self.similarity_engine._cosine_similarity(
                    cluster1.centroid_vector, cluster2.centroid_vector
                )
                
                if similarity >= similarity_threshold:
                    # Merge clusters - add all events from cluster2 to cluster1
                    for event_id in cluster2.related_events:
                        if event_id not in cluster1.related_events:
                            cluster1.related_events.append(event_id)
                    
                    # Update active event to the most recent one
                    cluster1.active_event = cluster2.active_event
                    
                    # Update cluster metadata
                    cluster1.updated_at = datetime.now().isoformat()
                    cluster1.semantic_tags.extend(cluster2.semantic_tags)
                    cluster1.semantic_tags = list(set(cluster1.semantic_tags))  # Remove duplicates
                    
                    # Update confidence score (average of both)
                    cluster1.confidence_score = (cluster1.confidence_score + cluster2.confidence_score) / 2
                    
                    # Recalculate centroid
                    vectors = [self.similarity_engine.vector_index.get(eid, [0.0] * self.similarity_engine.embedding_dim)
                              for eid in cluster1.related_events 
                              if eid in self.similarity_engine.vector_index]
                    
                    if vectors:
                        cluster1.centroid_vector = self._calculate_centroid(vectors)
                    
                    # Remove the merged cluster
                    del self.clusters[cluster_id2]
                    merged_count += 1
        
        return merged_count
    
    def auto_cluster_events(self, event_ids: List[str]) -> Dict[str, List[str]]:
        """
        Automatically cluster a list of events based on semantic similarity.
        
        Args:
            event_ids: List of event IDs to cluster
            
        Returns:
            Dictionary mapping cluster IDs to lists of event IDs
        """
        # Clear existing clusters for these events
        for event_id in event_ids:
            self.remove_event_from_cluster(event_id)
        
        # Create new clusters
        clustered_events = {}
        
        for event_id in event_ids:
            if event_id in self.similarity_engine.vector_index:
                event_vector = self.similarity_engine.vector_index[event_id]
                # Extract topic label from event metadata if available
                metadata = self.similarity_engine.event_metadata.get(event_id, {})
                topic_label = metadata.get("category", "general_topic")
                
                cluster_id = self.create_or_update_cluster(topic_label, event_id, event_vector)
                if cluster_id not in clustered_events:
                    clustered_events[cluster_id] = []
                clustered_events[cluster_id].append(event_id)
        
        return clustered_events
    
    def get_cluster_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about the clustering system.
        
        Returns:
            Dictionary with clustering statistics
        """
        if not self.clusters:
            return {
                "total_clusters": 0,
                "total_clustered_events": 0,
                "average_events_per_cluster": 0,
                "largest_cluster_size": 0,
                "smallest_cluster_size": 0
            }
        
        cluster_sizes = [len(cluster.related_events) for cluster in self.clusters.values()]
        
        return {
            "total_clusters": len(self.clusters),
            "total_clustered_events": sum(cluster_sizes),
            "average_events_per_cluster": sum(cluster_sizes) / len(cluster_sizes),
            "largest_cluster_size": max(cluster_sizes),
            "smallest_cluster_size": min(cluster_sizes)
        }


# Example usage and test
if __name__ == "__main__":
    # Create clustering engine
    similarity_engine = VectorSimilarityEngine(embedding_dim=32)
    clustering_engine = SemanticClusteringEngine(similarity_engine)
    
    print("Semantic Clustering Engine Test:")
    print("=" * 40)
    
    # Add some sample events with vectors
    sample_events = [
        ("evt_001", "I love watching anime shows", {"category": "entertainment"}),
        ("evt_002", "I enjoy reading manga comics", {"category": "entertainment"}),
        ("evt_003", "I hate spicy Japanese food", {"category": "food"}),
        ("evt_004", "I prefer Python programming language", {"category": "technology"}),
        ("evt_005", "I dislike JavaScript syntax", {"category": "technology"}),
        ("evt_006", "I enjoy Italian cuisine", {"category": "food"})
    ]
    
    # Add events to vector index
    for event_id, text, metadata in sample_events:
        similarity_engine.add_event_vector(event_id, text, metadata)
        print(f"Added event {event_id}: '{text}'")
    
    print("\nCreating clusters:")
    
    # Create clusters for events
    for event_id, text, metadata in sample_events:
        topic_label = metadata["category"]
        cluster_id = clustering_engine.create_or_update_cluster(topic_label, event_id)
        print(f"Event {event_id} added to cluster {cluster_id}")
    
    print("\nCluster summaries:")
    summaries = clustering_engine.get_all_clusters_summary()
    for summary in summaries:
        print(f"  Cluster {summary['cluster_id']}: {summary['topic_label']} "
              f"({summary['event_count']} events)")
    
    # Show clustering statistics
    print("\nClustering statistics:")
    stats = clustering_engine.get_cluster_statistics()
    for key, value in stats.items():
        if isinstance(value, float):
            print(f"  {key}: {value:.2f}")
        else:
            print(f"  {key}: {value}")
    
    # Test merging similar clusters
    print(f"\nMerging similar clusters...")
    merged = clustering_engine.merge_similar_clusters(0.7)
    print(f"Merged {merged} clusters")
    
    print("\nFinal cluster summaries:")
    summaries = clustering_engine.get_all_clusters_summary()
    for summary in summaries:
        print(f"  Cluster {summary['cluster_id']}: {summary['topic_label']} "
              f"({summary['event_count']} events)")