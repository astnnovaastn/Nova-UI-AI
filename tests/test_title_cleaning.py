#!/usr/bin/env python3
"""Test the search title cleaning functionality"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'astra_ai'))

# Import the NovaSearch class
from core.nova_ai import NovaSearch

def test_title_cleaning():
    """Test the _clean_search_title method with various queries"""
    
    search = NovaSearch()
    
    test_cases = [
        # (input_query, expected_output)
        ("search about advanced gpu technology", "Advanced GPU Technology"),
        ("tell me about nvidia ai models", "NVIDIA AI Models"),
        ("what is quantum computing", "Quantum Computing"),
        ("info on machine learning", "Machine Learning"),
        ("find out about latest iphone", "Latest iPhone"),
        ("look up python programming", "Python Programming"),
        ("explain blockchain technology", "Blockchain Technology"),
        ("describe artificial intelligence", "Artificial Intelligence"),
        ("news about tesla cars", "Tesla Cars"),
        ("latest on android updates", "Android Updates"),
        ("current info on climate change", "Climate Change"),
        ("research on space exploration", "Space Exploration"),
        ("get me info about vr headsets", "VR Headsets"),
        ("show me details on cloud computing", "Cloud Computing"),
        ("give me info about 5g networks", "5G Networks"),
        ("learn about data science", "Data Science"),
        ("about llm models", "LLM Models"),
        ("search for gpt-4 features", "GPT-4 Features"),
        ("tell me about aws services", "AWS Services"),
        ("what are neural networks", "Neural Networks"),
        ("advanced cpu architecture", "Advanced CPU Architecture"),
        ("the latest nvidia gpus", "NVIDIA GPUs"),
        ("info on llama 3 model", "Llama 3 Model"),
    ]
    
    print("Testing Search Title Cleaning")
    print("=" * 70)
    
    passed = 0
    failed = 0
    
    for query, expected in test_cases:
        result = search._clean_search_title(query)
        status = "PASS" if result == expected else "FAIL"
        
        if status == "PASS":
            passed += 1
        else:
            failed += 1
            
        print(f"[{status}] Input: '{query}'")
        print(f"       Expected: '{expected}'")
        print(f"       Got:      '{result}'")
        print()
    
    print("=" * 70)
    print(f"Results: {passed} passed, {failed} failed out of {len(test_cases)} tests")
    
    if failed == 0:
        print("✅ All tests passed!")
        return True
    else:
        print("⚠️ Some tests failed. Review the output above.")
        return False

if __name__ == "__main__":
    success = test_title_cleaning()
    sys.exit(0 if success else 1)
