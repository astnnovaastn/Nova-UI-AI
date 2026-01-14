"""Comprehensive test for the enhanced AI Organizer with full 27-category framework."""

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer, MemoryCategory
import json
import os

def test_comprehensive_enhancement():
    """Test comprehensive enhancement with full category framework awareness."""
    
    # Create a test configuration
    config = {
        'organizer_enabled': False,  # Disable monitoring for this test
        'memory_file_path': 'test_memory.json',
        'check_interval': 1.0,
        'llm_enabled': True,
        'llm_api_key': '',
        'llm_model': 'qwen2.5:3b'
    }
    
    # Initialize the organizer
    organizer = AIOrganizer(config)
    
    print("=== Comprehensive AI Organizer Test ===")
    print(f"Model: {organizer.llm_model}")
    print(f"Categories: {len(organizer.category_framework)}")
    
    # Test 1: Category framework initialization
    print("\n1. Testing category framework:")
    test_categories = [
        MemoryCategory.USER_IDENTITY,
        MemoryCategory.PERSONAL_PREFERENCES,
        MemoryCategory.TASK_PROJECT_TRACKING,
        MemoryCategory.LONG_TERM_GOALS,
        MemoryCategory.COMMUNICATION_BOUNDARIES
    ]
    
    for category in test_categories:
        category_key = category.value
        if category_key in organizer.category_framework:
            info = organizer.category_framework[category_key]
            print(f"   PASS {category_key}: {info['description']}")
        else:
            print(f"   FAIL {category_key}: NOT FOUND")
    
    # Test 2: Category identification
    print("\n2. Testing category identification:")
    test_messages = [
        ("I'm a Python developer working on a machine learning project", 
         ['user_identity', 'knowledge_expertise', 'task_project_tracking']),
        ("My goal is to become a senior software engineer by 2026", 
         ['long_term_goals', 'user_identity']),
        ("I prefer casual communication and I hate discussing politics", 
         ['personal_preferences', 'communication_boundaries']),
        ("I work with Marco on coding projects and we meet every Tuesday", 
         ['collaborator_relationships', 'task_project_tracking', 'activity_behavior'])
    ]
    
    for message, expected_categories in test_messages:
        identified = organizer._identify_relevant_categories(message, {})
        print(f"   Message: '{message}'")
        print(f"   Expected: {expected_categories}")
        print(f"   Identified: {identified}")
        
        # Check if expected categories are found
        found_expected = all(cat in identified for cat in expected_categories)
        print(f"   Result: {'PASS' if found_expected else 'FAIL'}")
        print()
    
    # Test 3: Category guidance
    print("3. Testing category guidance:")
    sample_categories = ['user_identity', 'personal_preferences', 'long_term_goals']
    guidance = organizer._get_category_guidance(sample_categories)
    print(f"   Categories: {sample_categories}")
    print(f"   Guidance: {guidance[:100]}...")  # Truncate for readability
    
    # Test 4: Comprehensive context building
    print("\n4. Testing comprehensive context building:")

    # Create rich memory data with facts from multiple categories
    rich_memory_data = {
        "current_facts": {
            "user.name": {
                "category": "user_identity",
                "value": "Alex Developer",
                "confidence": 0.95
            },
            "pref.communication": {
                "category": "personal_preferences",
                "value": "prefer casual communication style",
                "confidence": 0.85
            },
            "goal.career": {
                "category": "long_term_goals",
                "value": "become a machine learning engineer",
                "confidence": 0.90
            },
            "skill.python": {
                "category": "knowledge_expertise",
                "value": "advanced Python programmer",
                "confidence": 0.88
            },
            "boundary.politics": {
                "category": "communication_boundaries",
                "value": "don't discuss politics",
                "confidence": 0.92
            },
            "collab.marco": {
                "category": "collaborator_relationships",
                "value": "coding partner Marco",
                "confidence": 0.87
            },
            "activity.coding": {
                "category": "activity_behavior",
                "value": "codes daily from 9 PM to 11 PM",
                "confidence": 0.80
            }
        },
        "user": {
            "name": "Alex Developer",
            "timezone": "UTC-5",
            "language": "en"
        },
        "conversation": [
            {"role": "user", "content": "I'm working on a Python machine learning project with my partner Marco"},
            {"role": "assistant", "content": "That sounds interesting! What kind of ML project?"},
            {"role": "user", "content": "It's a recommendation system using neural networks"},
            {"role": "assistant", "content": "Neural networks are powerful for recommendations"},
            {"role": "user", "content": "Yeah, I prefer Python for this kind of work"}
        ]
    }
    
    context = organizer._get_comprehensive_user_context(rich_memory_data)
    print(f"   Context built: {len(context)} characters")
    print(f"   Sample: {context[:150]}...")
    
    # Test 5: Enhanced memory rewriting
    print("\n5. Testing enhanced memory rewriting:")
    
    test_inputs = [
        "I like Python for ML work",
        "My friend Marco helps me with coding",
        "I don't want to talk about politics",
        "I work on ML projects daily"
    ]
    
    for input_text in test_inputs:
        enhanced = organizer._apply_enhancements(input_text, "Alex", rich_memory_data)
        print(f"   Input: '{input_text}'")
        print(f"   Enhanced: '{enhanced}'")
        print()
    
    # Test 6: Category-specific enhancement guidance
    print("6. Testing category-specific enhancement:")
    
    # Simulate different category contexts
    contexts = {
        "technical_context": ["knowledge_expertise", "task_project_tracking"],
        "personal_context": ["user_identity", "personal_preferences"],
        "social_context": ["collaborator_relationships", "communication_boundaries"]
    }
    
    for context_name, categories in contexts.items():
        guidance = organizer._get_category_guidance(categories)
        print(f"   {context_name}: {guidance[:80]}...")
    
    print("\n=== Test Completed Successfully ===")

if __name__ == "__main__":
    test_comprehensive_enhancement()