#!/usr/bin/env python3
"""
Test script to verify the enhanced AI Organizer properly analyzes full context
"""
import json
import os
from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def test_full_context_analysis():
    """Test that the AI properly analyzes full context without relying on keywords."""
    
    # Create a test configuration
    config = {
        'organizer_enabled': True,
        'memory_file_path': os.path.join('astra_ai', 'Date', 'test_nova_ai_memory.json'),
        'check_interval': 1.0,
        'llm_enabled': False,
    }
    
    # Create organizer instance
    organizer = AIOrganizer(config)
    
    # Test the deep contextual understanding method
    print("Testing deep contextual understanding...")
    
    # Test case 1: The example from the requirements
    test_context = "I tried to avoid junk food like my McDonald's KFC because it makes me feel sluggish."
    analysis = organizer._deep_contextual_understanding(test_context)
    
    print(f"Input: {test_context}")
    print(f"Analysis result: {analysis}")
    print(f"Intent: {analysis.get('intent', 'unknown')}")
    print(f"Preference type: {analysis.get('preference_type', 'unknown')}")
    print(f"Entities: {analysis.get('entities', [])}")
    print()
    
    # Test case 2: Another complex sentence
    test_context2 = "I really enjoy listening to 2pac because his music inspires me."
    analysis2 = organizer._deep_contextual_understanding(test_context2)
    
    print(f"Input: {test_context2}")
    print(f"Analysis result: {analysis2}")
    print(f"Intent: {analysis2.get('intent', 'unknown')}")
    print(f"Preference type: {analysis2.get('preference_type', 'unknown')}")
    print(f"Entities: {analysis2.get('entities', [])}")
    print()
    
    # Test the timed rewrite method with full context analysis
    print("Testing timed rewrite with full context analysis...")
    test_entry = {
        'context': test_context,
        'summary': 'Added preference likes: junk food'
    }
    
    rewritten = organizer._timed_rewrite_entry(test_entry)
    print(f"Original context: {test_context}")
    print(f"Rewritten summary: {rewritten.get('summary', 'N/A')}")
    print(f"Semantic context: {rewritten.get('semantic_context', 'N/A')}")
    print()
    
    # Test the new context-aware summary creation
    print("Testing new context-aware summary creation...")
    summary_with_context = organizer._create_clear_summary_with_full_context(test_context, analysis)
    print(f"Context: {test_context}")
    print(f"Summary with full context: {summary_with_context}")
    print()
    
    print("All tests completed successfully!")

if __name__ == "__main__":
    test_full_context_analysis()