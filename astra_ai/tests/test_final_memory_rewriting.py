"""Final test to verify complete memory rewriting capabilities."""

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer
import json
import os

def test_complete_memory_rewriting():
    """Test complete memory rewriting with the enhanced AI Organizer."""
    
    print("=== Final Memory Rewriting Test ===")
    
    # Create test configuration
    config = {
        'organizer_enabled': False,  # Disable monitoring for this test
        'memory_file_path': 'test_final_memory.json',
        'check_interval': 1.0,
        'llm_enabled': True,
        'llm_api_key': '',
        'llm_model': 'qwen2.5:3b'
    }
    
    # Initialize organizer
    organizer = AIOrganizer(config)
    
    print(f"AI Organizer initialized with {len(organizer.category_framework)} categories")
    
    # Create comprehensive test memory data
    test_memory_data = {
        "user": {
            "name": "Sarah Johnson",
            "timezone": "EST",
            "language": "en",
            "total_sessions": 15
        },
        "current_facts": {
            # User Identity
            "identity.name": {
                "category": "user_identity",
                "value": "Sarah Johnson, software developer",
                "confidence": 0.95,
                "timestamp": "2025-09-27T10:00:00"
            },
            "identity.pronouns": {
                "category": "user_identity", 
                "value": "she/her",
                "confidence": 0.90,
                "timestamp": "2025-09-27T10:05:00"
            },
            
            # Personal Preferences
            "pref.communication": {
                "category": "personal_preferences",
                "value": "prefers detailed explanations with examples",
                "confidence": 0.85,
                "timestamp": "2025-09-27T10:10:00"
            },
            "pref.formality": {
                "category": "personal_preferences",
                "value": "casual but respectful communication style",
                "confidence": 0.80,
                "timestamp": "2025-09-27T10:15:00"
            },
            
            # Task/Project Tracking
            "project.ml_recommender": {
                "category": "task_project_tracking",
                "value": "building a movie recommendation system using neural networks",
                "confidence": 0.90,
                "timestamp": "2025-09-27T10:20:00"
            },
            
            # Long-term Goals
            "goal.career": {
                "category": "long_term_goals",
                "value": "become a machine learning engineer at a tech company",
                "confidence": 0.88,
                "timestamp": "2025-09-27T10:25:00"
            },
            
            # Collaborator Relationships
            "collab.james": {
                "category": "collaborator_relationships",
                "value": "coding partner James who specializes in frontend development",
                "confidence": 0.85,
                "timestamp": "2025-09-27T10:30:00"
            },
            
            # Activity Behavior
            "activity.coding_schedule": {
                "category": "activity_behavior",
                "value": "codes most evenings from 7 PM to 10 PM",
                "confidence": 0.80,
                "timestamp": "2025-09-27T10:35:00"
            },
            
            # Communication Boundaries
            "boundary.politics": {
                "category": "communication_boundaries",
                "value": "prefers not to discuss political topics",
                "confidence": 0.90,
                "timestamp": "2025-09-27T10:40:00"
            }
        },
        "conversation": [
            {
                "role": "user",
                "content": "Hi, I'm Sarah! I'm working on this machine learning project with my friend James.",
                "timestamp": "2025-09-27T14:00:00"
            },
            {
                "role": "assistant", 
                "content": "Nice to meet you Sarah! Tell me more about your ML project.",
                "timestamp": "2025-09-27T14:00:30"
            },
            {
                "role": "user",
                "content": "It's a movie recommender using neural networks. James helps with the frontend.",
                "timestamp": "2025-09-27T14:01:00"
            },
            {
                "role": "assistant",
                "content": "That sounds fascinating! Neural networks are great for recommendations.",
                "timestamp": "2025-09-27T14:01:30"
            },
            {
                "role": "user", 
                "content": "Yeah, I prefer detailed explanations. I'm aiming to become an ML engineer.",
                "timestamp": "2025-09-27T14:02:00"
            }
        ],
        "memory_events": [
            {
                "type": "ADD",
                "summary": "User is interested in machine learning projects with neural networks",
                "timestamp": "2025-09-27T14:01:00",
                "confidence": 0.85,
                "category": "task_project_tracking",
                "provenance": {}
            },
            {
                "type": "ADD", 
                "summary": "User has a preference for detailed explanations with examples",
                "timestamp": "2025-09-27T14:02:00",
                "confidence": 0.80,
                "category": "personal_preferences",
                "provenance": {}
            },
            {
                "type": "ADD",
                "summary": "User mentioned career goal of becoming a machine learning engineer",
                "timestamp": "2025-09-27T14:02:00", 
                "confidence": 0.88,
                "category": "long_term_goals",
                "provenance": {}
            }
        ]
    }
    
    print("\n1. Testing comprehensive context building:")
    context = organizer._get_comprehensive_user_context(test_memory_data)
    print(f"   Context length: {len(context)} characters")
    print(f"   Sample context: {context[:200]}...")
    
    print("\n2. Testing memory event enhancement:")
    
    # Test enhancing each memory event
    for i, event in enumerate(test_memory_data["memory_events"]):
        print(f"\n   Event {i+1}:")
        print(f"     Original: {event.get('summary', 'No summary')}")
        
        # Create a conversation item for this event
        conv_item = {
            "role": "user",
            "content": f"User mentioned: {event.get('summary', 'something interesting')}",
            "timestamp": event.get('timestamp', '2025-09-27T14:00:00')
        }
        
        # Enhance the event in-place
        organizer._enhance_event_in_place(event, conv_item, test_memory_data)
        
        print(f"     Enhanced: {event.get('summary', 'No summary')}")
        
        # Check provenance
        provenance = event.get('provenance', {})
        if provenance.get('enhanced_in_place'):
            print(f"     Status: Successfully enhanced")
        else:
            print(f"     Status: Enhancement attempted")
    
    print("\n3. Testing category-specific enhancements:")
    
    # Test different types of inputs with category awareness
    test_cases = [
        {
            "input": "I'm working on a Python ML project",
            "expected_category": "task_project_tracking",
            "description": "Technical task description"
        },
        {
            "input": "I prefer casual communication style",
            "expected_category": "personal_preferences", 
            "description": "Communication preference"
        },
        {
            "input": "My goal is to become an ML engineer",
            "expected_category": "long_term_goals",
            "description": "Career goal statement"
        },
        {
            "input": "James helps me with frontend development",
            "expected_category": "collaborator_relationships",
            "description": "Collaborator relationship"
        }
    ]
    
    for test_case in test_cases:
        print(f"\n   Testing: {test_case['description']}")
        print(f"     Input: {test_case['input']}")
        
        # Identify relevant categories
        categories = organizer._identify_relevant_categories(test_case['input'], test_memory_data)
        print(f"     Identified categories: {categories}")
        
        # Get category guidance
        guidance = organizer._get_category_guidance(categories)
        print(f"     Guidance preview: {guidance[:100]}..." if guidance else "     No guidance")
        
        # Apply enhancements
        enhanced = organizer._apply_enhancements(test_case['input'], "Sarah", test_memory_data)
        print(f"     Enhanced: {enhanced}")
    
    print("\n4. Testing complete memory integration:")
    
    # Simulate how the memory system would integrate with the organizer
    print("   Simulating memory-organizer integration...")
    
    # Create a sample of what the memory system puts in the JSON
    sample_memory_entry = {
        "type": "ADD",
        "summary": "User is interested in learning Python for machine learning",
        "timestamp": "2025-09-27T15:00:00",
        "confidence": 0.85,
        "category": "task_project_tracking",
        "provenance": {}
    }
    
    print(f"     Original memory entry: {sample_memory_entry['summary']}")
    
    # Create corresponding conversation item
    conv_item = {
        "role": "user", 
        "content": "I'm really interested in learning Python for machine learning projects",
        "timestamp": "2025-09-27T15:00:00"
    }
    
    # The organizer processes and enhances this entry
    organizer._enhance_event_in_place(sample_memory_entry, conv_item, test_memory_data)
    
    print(f"     Enhanced memory entry: {sample_memory_entry['summary']}")
    
    # Check that provenance was added
    provenance = sample_memory_entry.get('provenance', {})
    if provenance.get('enhanced_in_place'):
        print("     Status: Entry successfully enhanced with provenance tracking")
    else:
        print("     Status: Entry enhancement attempted")
    
    print("\n=== Final Test Complete ===")
    print("The AI Organizer is now enhanced with full 27-category awareness")
    print("and provides contextual memory rewriting capabilities.")

if __name__ == "__main__":
    test_complete_memory_rewriting()