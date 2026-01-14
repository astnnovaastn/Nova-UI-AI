"""Test script to verify the AI Organizer fix for processing user content properly."""

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer
import json

def test_content_enhancement():
    # Create an organizer instance with LLM enabled to test actual enhancement
    config = {
        'organizer_enabled': False,  # Disable monitoring for this test
        'memory_file_path': 'test_memory.json',  # Use a test file
        'check_interval': 1.0,
        'llm_enabled': True,
        'llm_api_key': '',  # Not needed for Ollama
        'llm_model': 'qwen2.5:3b'
    }
    
    organizer = AIOrganizer(config)
    print(f'Organizer initialized with model: {organizer.llm_model}')
    
    # Simulate the scenario from the user's example
    # User said: "i like to use ollama model ai"
    # But memory added generic: "Added preference likes: like"
    
    # Create mock memory data similar to what's in the JSON
    mock_memory_data = {
        'user': {'name': 'Nemzz'},
        'conversation': [
            {
                'role': 'user',
                'content': 'i like to use ollama model ai',
                'timestamp': '2025-09-27T12:16:24.750930'
            }
        ],
        'current_facts': {}
    }
    
    # Mock event with a generic summary (like the problematic case)
    mock_event = {
        'type': 'ADD',
        'summary': 'Added preference likes: like',
        'timestamp': '2025-09-27T12:16:24.750930',
        'provenance': {}
    }
    
    # Get the conversation item that matches the timestamp
    conv_item = {
        'role': 'user',
        'content': 'i like to use ollama model ai',
        'timestamp': '2025-09-27T12:16:24.750930'
    }
    
    print(f'Original event summary: {mock_event["summary"]}')
    print(f'User conversation content: {conv_item["content"]}')
    
    # Process the event using the enhanced method
    organizer._enhance_event_in_place(mock_event, conv_item, mock_memory_data)
    
    print(f'Enhanced event summary: {mock_event["summary"]}')
    print(f'Provenance: {mock_event["provenance"]}')
    
    if 'original_summary' in mock_event['provenance']:
        print(f'Original summary preserved in provenance: {mock_event["provenance"]["original_summary"]}')
    
    print('Test completed!')

if __name__ == "__main__":
    test_content_enhancement()