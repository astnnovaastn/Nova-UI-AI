"""
Comprehensive test of the Nova Memory AI system to demonstrate various memory event types
"""

from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent
from datetime import datetime
import json

def comprehensive_memory_test():
    """
    Comprehensive test to demonstrate how the memory system handles various types of user information
    """
    # Initialize the memory agent
    memory_agent = AdvancedMemoryAgent("astra_ai/Date/nova_ai_memory.json")
    
    # Comprehensive conversation with various types of information
    conversation_log = [
        # User identity and personal info
        {"role": "user", "content": "Hi, my name is Sarah Johnson. You can call me Sarah."}, 
        {"role": "assistant", "content": "Nice to meet you, Sarah! How old are you?"},
        {"role": "user", "content": "I'm 28 years old. I live in Seattle, Washington."},
        
        # Professional information
        {"role": "assistant", "content": "What do you do for work?"},
        {"role": "user", "content": "I'm a data scientist at Microsoft, focusing on AI and machine learning projects."},
        
        # Personal preferences
        {"role": "assistant", "content": "What do you like to do in your free time?"},
        {"role": "user", "content": "I love hiking in the mountains, watching anime series like Attack on Titan, and I prefer detailed explanations when learning new concepts."},

        # Communication boundaries
        {"role": "assistant", "content": "That's great! Do you have any topics you'd prefer not to discuss?"},
        {"role": "user", "content": "Please don't ask me about my ex-boyfriend or my medical history. I'm not comfortable discussing those topics."},

        # Long-term goals
        {"role": "assistant", "content": "What are your career or life goals?"},
        {"role": "user", "content": "I want to become a senior AI researcher and eventually start my own tech company in the next 5 years."},

        # Activity patterns
        {"role": "assistant", "content": "What does a typical day look like for you?"},
        {"role": "user", "content": "I usually wake up at 6 AM, go for a run, then work from 8 AM to 6 PM. Weekends are for hiking and catching up on anime."}
    ]
    
    print("Starting comprehensive memory test...")
    print("="*50)
    
    # Process each conversation turn to build comprehensive memory
    for i, turn in enumerate(conversation_log):
        user_content = turn["content"] if turn["role"] == "user" else ""
        ai_content = turn["content"] if turn["role"] == "assistant" else ""
        
        if user_content:
            print(f"Processing message {i+1}: '{user_content[:60]}...'")
            
            # Process the user's message to create memory events
            result = memory_agent.memory_system.process_conversation(
                user_message=user_content,
                ai_response=ai_content,
                session_id=f"comp_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{i}"
            )
            
            print(f"  Memory operations: {result.get('memory_operations', 0)}")
            print()
    
    print("="*50)
    print("COMPREHENSIVE MEMORY TEST RESULTS")
    print("="*50)
    
    # Display memory statistics
    stats = memory_agent.get_memory_stats()
    print(f"Total facts stored: {stats['total_facts']}")
    print(f"Total memory events: {stats['total_events']}")
    print(f"Total messages processed: {stats['total_messages']}")
    print()
    
    # Show user information
    user_info = stats.get('user_info', {})
    print(f"User name: {user_info.get('name', 'Not found')}")
    print(f"User age: {user_info.get('age', 'Not found')}")
    print()
    
    # Show memory categories that were populated
    print("Memory Category Breakdown:")
    fact_breakdown = stats.get('facts_breakdown', {})
    personal_prefs = fact_breakdown.get('personal_preferences', {})
    
    if personal_prefs:
        print("  Personal Preferences:")
        for category, items in personal_prefs.items():
            if items:  # Only show categories with items
                print(f"    {category}: {len(items)} items")
                for item in items[:3]:  # Show first 3 items
                    if isinstance(item, dict):
                        print(f"      - {item.get('item', 'Unknown')}")
                    else:
                        print(f"      - {item}")
                if len(items) > 3:
                    print(f"      ... and {len(items) - 3} more")
    
    # Show conversation history
    conv_history = memory_agent.get_conversation_history()
    print(f"\nConversation history entries: {len(conv_history)}")
    
    # Get timeline of changes
    timeline = memory_agent.get_timeline()
    print(f"Timeline entries: {len(timeline)}")
    
    # Get semantic insights
    semantic_insights = memory_agent.get_semantic_insights()
    print(f"Semantic insights available: {bool(semantic_insights)}")
    
    # Get emotional timeline
    emotion_timeline = memory_agent.get_emotional_timeline()
    print(f"Emotional timeline entries: {len(emotion_timeline)}")
    
    # Get memory health
    health = memory_agent.analyze_memory_health()
    print(f"Memory health score: {health['health_score']:.2f}")
    
    print("\n" + "="*50)
    print("MEMORY SYSTEM ANALYSIS COMPLETE")
    print("="*50)
    
    # Test memory recall
    print("\nTesting memory recall:")
    
    # Try to recall some specific information
    name_recall = memory_agent.recall_history("What is my name?")
    print(f"Name recall: {name_recall}")
    
    work_recall = memory_agent.recall_history("What do I work as?")
    print(f"Work recall: {work_recall}")
    
    interests_recall = memory_agent.recall_history("What are my interests?")
    print(f"Interests recall: {interests_recall}")
    
    # Save the memory
    memory_agent.memory_system.save_memory()
    print("\nComprehensive memory test completed successfully!")

def test_specific_memory_operations():
    """
    Test specific memory operations to demonstrate ADD, UPDATE, DELETE functionality
    """
    print("\n" + "="*50)
    print("TESTING SPECIFIC MEMORY OPERATIONS")
    print("="*50)
    
    # Initialize the memory agent
    memory_agent = AdvancedMemoryAgent("astra_ai/Date/nova_ai_memory.json")
    
    # Test 1: ADD operation - Initial preference
    print("Test 1: Adding initial preference")
    result1 = memory_agent.memory_system.process_conversation(
        user_message="I like to drink coffee in the morning",
        ai_response="That's nice",
        session_id="test_session_1"
    )
    print(f"  Operations performed: {result1.get('memory_operations', 0)}")
    
    # Test 2: UPDATE operation - Changed preference
    print("\nTest 2: Updating preference")
    result2 = memory_agent.memory_system.process_conversation(
        user_message="Actually, I prefer tea over coffee now",
        ai_response="Thanks for the update",
        session_id="test_session_2"
    )
    print(f"  Operations performed: {result2.get('memory_operations', 0)}")
    
    # Display summary
    stats = memory_agent.get_memory_stats()
    print(f"\nFinal stats after operations:")
    print(f"  Total facts: {stats['total_facts']}")
    print(f"  Total events: {stats['total_events']}")
    
    # Save memory
    memory_agent.memory_system.save_memory()
    print("\nSpecific operations test completed!")

if __name__ == "__main__":
    comprehensive_memory_test()
    test_specific_memory_operations()