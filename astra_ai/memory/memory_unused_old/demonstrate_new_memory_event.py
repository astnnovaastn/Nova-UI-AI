"""Demonstration of New Memory Event System

This script demonstrates how to use the new memory event system with proper
structure, vector index, clusters, and update log.
"""

import json
import os
from datetime import datetime
from astra_ai.memory.enhanced_nova_memory_ai import AdvancedMemoryAgent, create_memory_agent


def demonstrate_new_memory_event_system():
    """Demonstrate the complete new memory event system"""
    
    print("=== Nova Memory AI System - New Memory Event Demonstration ===\n")
    
    # Create memory agent
    storage_file = "astra_ai/Date/nova_ai_memory_demo.json"
    memory_agent = create_memory_agent(storage_file)
    
    print("1. Creating ADD memory event...")
    
    # Create an ADD event for user preference
    add_event_id = memory_agent.add_memory_event(
        user_input="enjoys reading science fiction novels",
        context="User: I love reading sci-fi novels.",
        category="personal_preferences",
        subcategory="likes",
        confidence=0.85
    )
    
    print(f"   Created ADD event with ID: {add_event_id}")
    
    print("\n2. Creating UPDATE memory event...")
    
    # Create an UPDATE event that modifies the previous preference
    update_event_id = memory_agent.update_memory_event(
        previous_event_id=add_event_id,
        new_value="enjoys reading science fiction and fantasy novels",
        context="User: Actually, I also like fantasy novels.",
        confidence=0.88
    )
    
    print(f"   Created UPDATE event with ID: {update_event_id}")
    
    print("\n3. Retrieving memory context...")
    
    # Get memory context
    context = memory_agent.get_memory_context()
    print(f"   Total memory events: {context['total_events']}")
    print(f"   Total facts: {context['total_facts']}")
    
    print("\n4. Checking saved memory file...")
    
    # Check if file was saved correctly
    if os.path.exists(storage_file):
        with open(storage_file, 'r') as f:
            memory_data = json.load(f)
        
        print("   Memory file structure:")
        print(f"   - User: {memory_data.get('user', {}).get('name', 'Unknown')}")
        print(f"   - Memory events: {len(memory_data.get('memory_engine', {}).get('memory_events', []))}")
        print(f"   - Vector index entries: {len(memory_data.get('memory_engine', {}).get('vector_index', {}))}")
        print(f"   - Clusters: {len(memory_data.get('memory_engine', {}).get('clusters', {}))}")
        print(f"   - Update log entries: {len(memory_data.get('memory_engine', {}).get('update_log', []))}")
        
        # Show the last few events
        memory_events = memory_data.get('memory_engine', {}).get('memory_events', [])
        if memory_events:
            print("\n   Recent memory events:")
            for event in memory_events[-2:]:  # Show last 2 events
                print(f"   - {event.get('type', 'UNKNOWN')}: {event.get('summary', 'No summary')}")
                print(f"     Event ID: {event.get('event_id', 'No ID')}")
                print(f"     Timestamp: {event.get('timestamp', 'No timestamp')}")
                print(f"     Category: {event.get('category', 'No category')}")
                print(f"     Confidence: {event.get('confidence', 'No confidence')}")
                print()
    
    print("\n5. Testing memory context retrieval...")
    
    # Test getting memory context
    memory_context = memory_agent.get_memory_context()
    print(f"   User name: {memory_context.get('user', {}).get('name', 'Unknown')}")
    print(f"   Total sessions: {memory_context.get('user', {}).get('total_sessions', 0)}")
    
    print("\n6. Testing conversation context...")
    
    # Test conversation context
    conversation_context = memory_agent.get_conversation_context()
    print(f"   Is returning user: {conversation_context.get('is_returning_user', False)}")
    print(f"   Total sessions: {conversation_context.get('total_sessions', 0)}")
    
    print("\n7. Testing memory stats...")
    
    # Test memory stats
    stats = memory_agent.get_memory_stats()
    print(f"   Memory events: {stats.get('total_events', 0)}")
    print(f"   Facts: {stats.get('total_facts', 0)}")
    
    print("\n=== Demonstration Complete ===")
    
    # Clean up demo file
    try:
        if os.path.exists(storage_file):
            os.remove(storage_file)
            print(f"\nCleaned up demo file: {storage_file}")
    except Exception as e:
        print(f"\nError cleaning up demo file: {e}")


def demonstrate_category_framework():
    """Demonstrate the 27-category memory framework"""
    
    print("\n=== 27-Category Memory Framework Demonstration ===\n")
    
    # Categories with example facts
    categories_examples = {
        "user_identity": "User's name is Alex, prefers they/them pronouns",
        "personal_preferences": "User likes casual conversation style, prefers detailed explanations when asked",
        "task_project_tracking": "User is working on a Python web application using Django framework",
        "activity_behavior": "User is most active during evening hours, prefers discussing technology topics",
        "user_instructions": "User wants Nova to always be respectful and never discuss politics",
        "current_state": "User is currently working on debugging a Python script",
        "personal_development": "User is learning JavaScript and improving their web development skills",
        "communication_boundaries": "User is uncomfortable discussing their salary or personal finances",
        "contextual_rules": "User prefers technical discussions during work hours, casual chat in evenings",
        "multi_identity": "User has a professional developer role and casual hobbyist role",
        "knowledge_expertise": "User is proficient in Python and has intermediate JavaScript skills",
        "tool_integration": "User prefers using VS Code and has granted permission for file operations",
        "response_adaptation": "User appreciates code examples and step-by-step explanations",
        "file_media": "User uploaded project_files.zip and prefers Markdown documentation",
        "long_term_goals": "User wants to become a senior software engineer within 2 years",
        "collaborator_relationships": "User works with team member Sarah who prefers email communication",
        "data_privacy": "User has private sessions enabled and retention policy set to user-controlled",
        "multimodal_preferences": "User prefers code snippets in monospace font and diagrams in PNG format",
        "system_awareness": "User reported an error with the search function on 2025-10-15",
        "session_themes": "Current session theme focuses on Python debugging techniques",
        "meta_memory": "User interface changed to dark mode on 2025-10-20",
        "temporal_patterns": "User typically works on coding projects Monday through Friday",
        "search_external_info": "User frequently searches for Python tutorials and JavaScript libraries",
        "greeting_patterns": "User prefers informal greetings like 'Hey' rather than formal 'Hello'",
        "conversation_analytics": "Average session duration is 25 minutes with 15 messages per session",
        "news_weather_history": "User checked weather forecast for New York City yesterday",
        "timezone_preferences": "User is in EST timezone and prefers scheduling meetings between 9 AM - 5 PM"
    }
    
    print("Demonstrating category framework with example facts:")
    for i, (category, example) in enumerate(categories_examples.items(), 1):
        print(f"{i:2d}. {category.replace('_', ' ').title()}: {example}")
    
    print(f"\nTotal categories demonstrated: {len(categories_examples)}")


if __name__ == "__main__":
    # Run demonstrations
    demonstrate_new_memory_event_system()
    demonstrate_category_framework()
    
    print("\n=== All Demonstrations Complete ===")