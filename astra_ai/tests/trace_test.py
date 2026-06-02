"""Very simple debug test to trace exactly what happens."""

import json
import os
import re
from astra_ai.memory.mem0_memory_system import EnhancedFactExtractor

def test_fact_extractor_directly():
    print("Testing EnhancedFactExtractor directly...")
    
    extractor = EnhancedFactExtractor()
    
    # Test the sentence structure analyzer directly
    message = "I like coffee"
    current_facts = {}
    context = {}
    
    print(f"\nTesting message: '{message}'")
    
    # Call the method that analyzes sentence structure
    results = extractor._analyze_sentence_structure(message, current_facts, context)
    print(f"Results from _analyze_sentence_structure: {results}")
    
    # Now test full analyze_message
    full_results = extractor.analyze_message(message, current_facts, context)
    print(f"Results from analyze_message: {full_results}")

if __name__ == "__main__":
    test_fact_extractor_directly()