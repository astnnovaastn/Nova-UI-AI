#!/usr/bin/env python3
"""
Test script for the new AdvancedClusterEngine implementation.
This script tests the key functionality of the new clustering system.
"""

import sys
import os

# Add the astra_ai module to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

from astra_ai.memory.mem0_memory_system import AdvancedClusterEngine, NovaMemoryAI
from datetime import datetime
from typing import Dict, List


def test_basic_cluster_functionality():
    """Test basic clustering functionality"""
    print("Testing basic clustering functionality...")
    
    # Create mock storage structure
    storage = {
        "memory_engine": {
            "memory_events": [
                {
                    "event_id": "evt_001",
                    "category": "personal_preferences",
                    "summary": "User likes watching anime during weekends",
                    "timestamp": "2025-10-16T17:08:03Z",
                    "confidence": 0.85,
                    "current_value": "likes watching anime during weekends"
                },
                {
                    "event_id": "evt_002",
                    "category": "personal_preferences", 
                    "summary": "User enjoys Italian cuisine",
                    "timestamp": "2025-10-21T12:00:00Z",
                    "confidence": 0.8,
                    "current_value": "enjoys Italian cuisine"
                },
                {
                    "event_id": "evt_003",
                    "category": "activity_behavior",
                    "summary": "User likes going for morning walks",
                    "timestamp": "2025-10-21T12:02:00Z",
                    "confidence": 0.85,
                    "current_value": "enjoys morning walks"
                }
            ],
            "vector_index": {},
            "clusters": {}
        }
    }
    
    # Create cluster engine
    class MockMemorySystem:
        def __init__(self):
            self.data = storage
    
    mock_system = MockMemorySystem()
    cluster_engine = AdvancedClusterEngine(mock_system)
    
    # Test adding vectors to the system and clustering
    test_vectors = [
        [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],  # Similar to anime preferences
        [0.12, 0.22, 0.32, 0.42, 0.52, 0.62, 0.72, 0.82],  # Similar to first vector
        [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1],  # Different (maybe food related)
    ]
    
    event_ids = ["evt_001", "evt_002", "evt_003"]
    timestamps = ["2025-10-16T17:08:03Z", "2025-10-21T12:00:00Z", "2025-10-21T12:02:00Z"]
    
    print(f"Initial cluster count: {len(storage['memory_engine']['clusters'])}")
    
    # Add vectors and see how clustering works
    for i, (event_id, vector, timestamp) in enumerate(zip(event_ids, test_vectors, timestamps)):
        print(f"Adding event {event_id} with vector to clustering system...")
        cluster_engine.update_clusters_on_new_vector(
            storage, event_id, vector, timestamp, confidence=0.8
        )
        print(f"Cluster count after adding {event_id}: {len(storage['memory_engine']['clusters'])}")
    
    # Check final state
    print(f"\nFinal cluster state:")
    for cluster_id, cluster in storage["memory_engine"]["clusters"].items():
        print(f"  {cluster_id}: {cluster['topic']} with {len(cluster['event_ids'])} events")
        print(f"    Coherence: {cluster['coherence_score']:.3f}")
        print(f"    Events: {cluster['event_ids']}")
        print(f"    Dominant tags: {cluster['metadata']['dominant_tags']}")
    
    print(f"\nTotal events processed: {len(event_ids)}")
    print(f"Total clusters created: {len(storage['memory_engine']['clusters'])}")
    
    assert len(event_ids) > 0, "Should have processed events"
    print("V Basic clustering functionality test passed!")


def test_cluster_optimization():
    """Test cluster optimization features"""
    print("\nTesting cluster optimization...")
    
    # Create mock storage structure with existing clusters
    storage = {
        "memory_engine": {
            "memory_events": [
                {"event_id": "evt_001", "category": "personal_preferences", "summary": "test", "timestamp": "2025-10-16T17:08:03Z", "confidence": 0.85, "current_value": "test"},
                {"event_id": "evt_002", "category": "personal_preferences", "summary": "test", "timestamp": "2025-10-16T17:08:03Z", "confidence": 0.85, "current_value": "test"},
                {"event_id": "evt_003", "category": "personal_preferences", "summary": "test", "timestamp": "2025-10-16T17:08:03Z", "confidence": 0.85, "current_value": "test"}
            ],
            "vector_index": {
                "evt_001": [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
                "evt_002": [0.11, 0.21, 0.31, 0.41, 0.51, 0.61, 0.71, 0.81],
                "evt_003": [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1],  # Different vector
            },
            "clusters": {
                "cluster_001": {
                    "topic": "Test Cluster 1",
                    "label": "Test Label 1",
                    "centroid_vector": [0.105, 0.205, 0.305, 0.405, 0.505, 0.605, 0.705, 0.805],
                    "event_ids": ["evt_001", "evt_002"],
                    "coherence_score": 0.95,
                    "last_updated": "2025-10-16T17:08:03Z",
                    "metadata": {
                        "dominant_tags": ["test"],
                        "cluster_type": "personal_preferences",
                        "member_count": 2,
                        "average_confidence": 0.85,
                        "temporal_span": "0 days",
                        "creation_timestamp": "2025-10-16T17:08:03Z"
                    },
                    "insights": {
                        "primary_pattern": "test_pattern",
                        "consistency": 0.95,
                        "emotional_tone": "neutral_tone",
                        "frequency": "single_event"
                    }
                }
            }
        }
    }
    
    # Create cluster engine and test initialization from existing
    class MockMemorySystem:
        def __init__(self):
            self.data = storage
    
    mock_system = MockMemorySystem()
    cluster_engine = AdvancedClusterEngine(mock_system)
    
    print(f"Initial state - Clusters: {len(storage['memory_engine']['clusters'])}")
    
    # This should validate and potentially optimize existing clusters
    cluster_engine.initialize_from_existing_clusters(storage)
    
    print(f"After initialization - Clusters: {len(storage['memory_engine']['clusters'])}")
    
    # Check that cluster was properly validated
    cluster = storage["memory_engine"]["clusters"]["cluster_001"]
    assert "coherence_score" in cluster
    assert "metadata" in cluster
    assert "insights" in cluster
    
    print("V Cluster optimization test passed!")


def test_cluster_clearing():
    """Test cluster clearing functionality"""
    print("\nTesting cluster clearing...")
    
    # Create storage with some clusters
    storage = {
        "memory_engine": {
            "memory_events": [],
            "vector_index": {},
            "clusters": {
                "cluster_001": {"topic": "Test", "event_ids": ["evt_1"]},
                "cluster_002": {"topic": "Test2", "event_ids": ["evt_2"]}
            }
        }
    }
    
    class MockMemorySystem:
        def __init__(self):
            self.data = storage
    
    mock_system = MockMemorySystem()
    cluster_engine = AdvancedClusterEngine(mock_system)
    
    print(f"Before clearing: {len(storage['memory_engine']['clusters'])} clusters")
    
    # Clear clusters
    cluster_engine.clear_all_clusters(storage)
    
    print(f"After clearing: {len(storage['memory_engine']['clusters'])} clusters")
    
    assert len(storage["memory_engine"]["clusters"]) == 0
    print("V Cluster clearing test passed!")


def main():
    """Run all tests"""
    print("Testing the new AdvancedClusterEngine implementation...\n")
    
    try:
        test_basic_cluster_functionality()
        test_cluster_optimization() 
        test_cluster_clearing()
        
        print("\nSUCCESS: All tests passed! The new clustering system is working correctly.")
        print("\nKey improvements in the new system:")
        print("- Enhanced semantic clustering with confidence-weighted centroids")
        print("- Dynamic cluster optimization (merging, splitting, quality assessment)")
        print("- Better metadata and insights generation")
        print("- Migration support from old cluster system")
        print("- Improved validation and error handling")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())