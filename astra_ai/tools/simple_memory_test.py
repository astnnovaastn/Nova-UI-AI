"""
Simple test to verify the memory system works properly after fixes
"""

from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent
from datetime import datetime

def simple_memory_test():
    """
    Simple test to verify memory system functionality
    """
    print("Starting simple memory test...")
    
    # Initialize the memory agent
    memory_agent = AdvancedMemoryAgent("astra_ai/Date/nova_ai_memory.json")
    
    # Simple conversation
    conversation_log = [
        {"role": "user", "content": "Hi, my name is Alex."},
        {"role": "assistant", "content": "Hello Alex, nice to meet you!"},
        {"role": "user", "content": "I like to drink coffee in the morning."}
    ]
    
    # Process the conversation
    for i, turn in enumerate(conversation_log):
        user_content = turn["content"] if turn["role"] == "user" else ""
        ai_content = turn["content"] if turn["role"] == "assistant" else ""
        
        if user_content:
            result = memory_agent.memory_system.process_conversation(
                user_message=user_content,
                ai_response=ai_content,
                session_id=f"simple_test_{i}"
            )
            print(f"Processed: '{user_content}' -> {result.get('memory_operations', 0)} operations")
    
    # Show basic stats
    stats = memory_agent.get_memory_stats()
    print(f"\nMemory stats:")
    print(f"  Total facts: {stats['total_facts']}")
    print(f"  Total events: {stats['total_events']}")
    
    # Get user info
    user_info = memory_agent.get_session_info()
    print(f"  User name: {user_info.get('user_name', 'Not found')}")
    
    # Test recall
    print(f"\nTesting recall:")
    name_recall = memory_agent.recall_history("What is my name?")
    print(f"  Name recall: {name_recall['found']}")
    
    interests_recall = memory_agent.recall_history("What are my interests?")
    print(f"  Interests recall: {interests_recall['found']}")
    
    # Save memory
    memory_agent.memory_system.save_memory()
    print("\nSimple memory test completed successfully!")

if __name__ == "__main__":
    simple_memory_test()