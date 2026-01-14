"""
Demonstration of AI Organizer Integration with Nova Memory AI System
Using Qwen2.5:3b model
"""

import sys
import os
import json

# Add the project root to the Python path
project_root = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, project_root)

# Add astra_ai to the Python path
astra_ai_path = os.path.join(project_root, 'astra_ai')
sys.path.insert(0, astra_ai_path)

from memory.mem0_memory_system import NovaMemoryAI
from memory.Mem0_ai_organizer import ORGANIZER_CONFIG

def demonstrate_ai_organizer():
    """Demonstrate the AI Organizer integration with Nova Memory AI"""
    
    print("AI Organizer Integration Demonstration")
    print("=" * 50)
    
    # Create a memory system using nova_ai_memory.json
    memory_system = NovaMemoryAI("data/nova_ai_memory.json")
    
    # Enable the organizer with Qwen2.5:3b model
    ORGANIZER_CONFIG['organizer_enabled'] = True
    ORGANIZER_CONFIG['llm_enrich_enabled'] = False  # Keep it simple for demo
    ORGANIZER_CONFIG['ollama_model'] = 'qwen2.5:3b'  # Use Qwen2.5:3b model
    
    # Update the organizer config
    memory_system.organizer.organizer_enabled = ORGANIZER_CONFIG['organizer_enabled']
    memory_system.organizer.llm_enrich_enabled = ORGANIZER_CONFIG['llm_enrich_enabled']
    memory_system.organizer.config['ollama_model'] = ORGANIZER_CONFIG['ollama_model']
    
    print("AI Organizer initialized and enabled with Qwen2.5:3b model")
    print()
    
    # Demo conversation
    print("Demo Conversation:")
    print("-" * 20)
    
    conversation = [
        {
            "user": "Hi, I'm Alice and I work as a Python developer at Google.",
            "ai": "Nice to meet you Alice! That's exciting that you work with Python at Google."
        },
        {
            "user": "I'm learning JavaScript and React these days.",
            "ai": "That's great! JavaScript and React are very popular technologies."
        },
        {
            "user": "Actually, I changed my job. I'm now working at Microsoft as a senior developer.",
            "ai": "Congratulations on your new role at Microsoft!"
        },
        {
            "user": "I love hiking and photography in my free time.",
            "ai": "Those are wonderful hobbies! Hiking and photography are great ways to enjoy nature."
        }
    ]
    
    # Process each conversation turn
    for i, turn in enumerate(conversation, 1):
        print(f"{i}. User: {turn['user']}")
        print(f"   AI: {turn['ai']}")
        
        # Process the conversation
        result = memory_system.process_conversation(
            turn['user'], 
            turn['ai']
        )
        
        print(f"   Memory operations: {result['memory_operations']}")
        print()
    
    # Show the results
    print("Results:")
    print("-" * 10)
    
    # Show current facts
    print("Current Facts:")
    for key, value in memory_system.data['current_facts'].items():
        # Handle both string and dictionary values
        if isinstance(value, dict):
            fact_value = value.get('value', value)
        else:
            fact_value = value
            
        # Convert to string and handle encoding issues
        fact_str = str(fact_value)
        try:
            print(f"  - {key}: {fact_str}")
        except UnicodeEncodeError:
            # Remove problematic characters
            safe_str = fact_str.encode('ascii', 'ignore').decode('ascii')
            print(f"  - {key}: {safe_str}")
    
    print()
    
    # Show memory categories
    print("Memory Categories:")
    for category, items in memory_system.data['memory_categories'].items():
        if items:  # Only show categories with data
            print(f"  - {category}: {len(items)} items")
    
    print()
    
    # Show organizer events
    organizer_events = [
        event for event in memory_system.data["memory_events"] 
        if event.get("type") in ["ENRICH", "UPDATE", "ORGANIZER_ERROR"]
    ]
    
    print(f"Organizer Events: {len(organizer_events)}")
    for event in organizer_events:
        summary = str(event['summary'])[:80]
        # Remove any problematic Unicode characters
        summary = summary.encode('ascii', 'ignore').decode('unicode_escape')
        print(f"  - {event['type']}: {summary}...")
    
    print()
    
    print("Demonstration complete!")

if __name__ == "__main__":
    demonstrate_ai_organizer()