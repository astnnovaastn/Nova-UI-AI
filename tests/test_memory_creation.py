"""
Example of creating a memory event based on user conversation using the Nova Memory AI system
"""

from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent
from datetime import datetime

def create_memory_from_conversation():
    """
    Example of creating memory events from a user conversation
    """
    # Initialize the memory agent
    memory_agent = AdvancedMemoryAgent("astra_ai/Date/nova_ai_memory.json")
    
    # Simulate a conversation between user and AI
    conversation_log = [
        {"role": "user", "content": "Hi, my name is John Doe. I work as a software engineer at TechCorp."},
        {"role": "assistant", "content": "Nice to meet you, John! How long have you been working at TechCorp?"},
        {"role": "user", "content": "I've been there for about 2 years now. I love programming in Python and I really enjoy working with machine learning."},
        {"role": "assistant", "content": "That sounds interesting! What type of machine learning projects do you work on?"},
        {"role": "user", "content": "I work on natural language processing projects, specifically sentiment analysis. I prefer detailed explanations when learning new concepts."},
        {"role": "assistant", "content": "That's fascinating! Are you interested in any other areas besides NLP?"},
        {"role": "user", "content": "Yes, I also enjoy watching anime in my free time, especially cyberpunk-themed ones. I usually go for a walk every morning before work."}
    ]
    
    # Process each conversation turn to build memory
    for i, turn in enumerate(conversation_log):
        user_content = turn["content"] if turn["role"] == "user" else ""
        ai_content = turn["content"] if turn["role"] == "assistant" else ""
        
        if user_content:
            # Process the user's message to create memory events
            result = memory_agent.memory_system.process_conversation(
                user_message=user_content,
                ai_response=ai_content,
                session_id=f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{i}"
            )
            print(f"Processed message {i+1}: '{user_content[:50]}...')")
            print(f"Memory operations: {result.get('memory_operations', 0)}")
            print("---")
    
    # Display summary of collected memories
    print("\nMemory Collection Summary:")
    stats = memory_agent.get_memory_stats()
    print(f"Total facts stored: {stats['total_facts']}")
    print(f"Total memory events: {stats['total_events']}")
    
    # Retrieve specific information
    print("\nExtracted Information:")
    session_info = memory_agent.get_session_info()
    print(f"User name (if available): {session_info.get('user_name', 'Not found')}")
    
    # Get user profile information
    user_profile = memory_agent.get_user_profile()
    print(f"User info: {user_profile['user_info']}")
    
    print("\nConversation context:", memory_agent.get_conversation_context())
    
    # Save the memory
    memory_agent.memory_system.save_memory()
    print("\nMemory saved successfully!")

if __name__ == "__main__":
    create_memory_from_conversation()