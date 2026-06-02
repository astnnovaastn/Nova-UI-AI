"""Test script to verify the enhanced AI Organizer with 27-category framework."""

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer, MemoryCategory
import json
import os

def test_category_aware_enhancement():
    """Test the AI Organizer's category-aware enhancement capabilities."""
    
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
    
    print("Testing AI Organizer with 27-category framework...")
    print(f"Initialized with model: {organizer.llm_model}")
    
    # Test the category framework initialization
    print("\n1. Testing category framework initialization:")
    print(f"   Number of categories: {len(organizer.category_framework)}")
    
    # Check a few specific categories
    test_categories = [
        MemoryCategory.USER_IDENTITY.value,
        MemoryCategory.PERSONAL_PREFERENCES.value,
        MemoryCategory.LONG_TERM_GOALS.value
    ]
    
    for category in test_categories:
        if category in organizer.category_framework:
            info = organizer.category_framework[category]
            print(f"   {category}: {info['description']}")
        else:
            print(f"   {category}: NOT FOUND")
    
    # Test category identification
    print("\n2. Testing category identification:")
    test_messages = [
        "I like Python programming and I'm working on a project",
        "My goal is to become a software engineer by 2026",
        "I prefer casual communication style and I hate spicy food"
    ]
    
    for message in test_messages:
        categories = organizer._identify_relevant_categories(message, {})
        print(f"   Message: '{message}'")
        print(f"   Relevant categories: {categories}")
    
    # Test enhancement with category awareness
    print("\n3. Testing category-aware enhancement:")
    
    # Create sample memory data with some facts
    sample_memory_data = {
        "current_facts": {
            "user_identity.name": {
                "category": "user_identity",
                "value": "Alice",
                "confidence": 0.9
            },
            "personal_preferences.communication_style": {
                "category": "personal_preferences",
                "value": "casual",
                "confidence": 0.8
            },
            "long_term_goals.career": {
                "category": "long_term_goals",
                "value": "software engineer",
                "confidence": 0.9
            }
        },
        "user": {
            "name": "Alice"
        },
        "conversation": []
    }
    
    test_text = "I'm interested in learning Python and JavaScript for my career goals"
    
    print(f"   Original text: {test_text}")
    
    # Test the enhancement
    enhanced_text = organizer._apply_enhancements(test_text, "Alice", sample_memory_data)
    print(f"   Enhanced text: {enhanced_text}")
    
    # Test category guidance
    print("\n4. Testing category guidance:")
    relevant_categories = organizer._identify_relevant_categories(test_text, sample_memory_data)
    guidance = organizer._get_category_guidance(relevant_categories)
    print(f"   Relevant categories: {relevant_categories}")
    print(f"   Category guidance: {guidance}")
    
    print("\nTest completed successfully!")

if __name__ == "__main__":
    test_category_aware_enhancement()