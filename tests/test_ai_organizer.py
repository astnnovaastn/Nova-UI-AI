"""
Test script for AI Organizer integration with Nova Memory AI System
"""

import sys
import os
import json
from datetime import datetime

# Add the project root to the Python path
project_root = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, project_root)

# Add astra_ai to the Python path
astra_ai_path = os.path.join(project_root, 'astra_ai')
sys.path.insert(0, astra_ai_path)

from memory.mem0_memory_system import NovaMemoryAI
from memory.Mem0_ai_organizer import ORGANIZER_CONFIG

def test_ai_organizer_integration():
    """Test the AI Organizer integration with Nova Memory AI"""
    
    print("Testing AI Organizer Integration")
    print("=" * 50)
    
    # Create a test memory system
    memory_system = NovaMemoryAI("test_organizer_memory.json")
    
    # Enable the organizer
    ORGANIZER_CONFIG['organizer_enabled'] = True
    ORGANIZER_CONFIG['llm_enrich_enabled'] = False  # Keep it simple for testing
    
    # Update the organizer config
    memory_system.organizer.organizer_enabled = ORGANIZER_CONFIG['organizer_enabled']
    memory_system.organizer.llm_enrich_enabled = ORGANIZER_CONFIG['llm_enrich_enabled']
    
    print("AI Organizer initialized")
    
    # Test cases with different types of user messages
    test_cases = [
        {
            "user_message": "Hi, I'm John and I work as a Python developer at Google.",
            "ai_response": "Nice to meet you John! That's exciting that you work with Python at Google."
        },
        {
            "user_message": "I'm learning JavaScript and React these days.",
            "ai_response": "That's great! JavaScript and React are very popular technologies."
        },
        {
            "user_message": "Actually, I changed my job. I'm now working at Microsoft as a senior developer.",
            "ai_response": "Congratulations on your new role at Microsoft!"
        },
        {
            "user_message": "I love hiking and photography in my free time.",
            "ai_response": "Those are wonderful hobbies! Hiking and photography are great ways to enjoy nature."
        }
    ]
    
    print("\nProcessing test conversations...")
    
    # Process each test case
    for i, case in enumerate(test_cases, 1):
        print(f"\nTest Case {i}:")
        print(f"User: {case['user_message']}")
        print(f"AI: {case['ai_response']}")
        
        # Process the conversation
        result = memory_system.process_conversation(
            case['user_message'], 
            case['ai_response']
        )
        
        print(f"Processed with {result['memory_operations']} memory operations")
    
    # Check if organizer events were created
    organizer_events = [
        event for event in memory_system.data["memory_events"] 
        if event.get("type") in ["ENRICH", "UPDATE", "ORGANIZER_ERROR"]
    ]
    
    print(f"\nOrganizer Events Created: {len(organizer_events)}")
    
    for event in organizer_events:
        summary = str(event['summary'])[:100]
        # Remove any problematic Unicode characters
        summary = summary.encode('ascii', 'ignore').decode('unicode_escape')
        print(f"  - {event['type']}: {summary}")
    
    # Check current facts
    print(f"\nCurrent Facts ({len(memory_system.data['current_facts'])} items):")
    for key, value in memory_system.data['current_facts'].items():
        print(f"  - {key}: {value}")
    
    # Check memory categories
    print(f"\nMemory Categories:")
    for category, items in memory_system.data['memory_categories'].items():
        if items:  # Only show categories with data
            print(f"  - {category}: {len(items)} items")
    
    # Verify organizer log was created
    if os.path.exists("data/organizer_log.json"):
        print("\nOrganizer log file created successfully")
        try:
            with open("data/organizer_log.json", "r") as f:
                log_data = json.load(f)
                print(f"   Log entries: {len(log_data)}")
        except Exception as e:
            print(f"   Error reading log: {e}")
    else:
        print("\nOrganizer log file not found")
    
    # Test with LLM enrichment disabled (should still work)
    print("\nTesting with LLM enrichment disabled...")
    memory_system.organizer.llm_enrich_enabled = False
    
    result = memory_system.process_conversation(
        "My favorite programming language is Rust.",
        "Rust is a great choice for systems programming!"
    )
    
    print(f"Processed with LLM enrichment disabled: {result['memory_operations']} operations")
    
    # Clean up test file
    try:
        if os.path.exists("test_organizer_memory.json"):
            os.remove("test_organizer_memory.json")
        print("\nCleaned up test files")
    except Exception as e:
        print(f"\nError cleaning up: {e}")
    
    print("\nAI Organizer Integration Test Complete!")

if __name__ == "__main__":
    test_ai_organizer_integration()