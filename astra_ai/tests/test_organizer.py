"""Test script for the updated AI Organizer with Ollama integration."""

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer, ORGANIZER_CONFIG

def test_organizer():
    print('Testing configuration...')
    print(f'LLM Enabled: {ORGANIZER_CONFIG["llm_enabled"]}')
    print(f'Model: {ORGANIZER_CONFIG["llm_model"]}')
    print(f'API Key (should be empty for Ollama): {ORGANIZER_CONFIG["llm_api_key"]}')

    # Create an organizer instance with LLM disabled to avoid API calls during testing
    config = ORGANIZER_CONFIG.copy()
    config['llm_enabled'] = False  # Disable LLM to avoid making calls during test
    organizer = AIOrganizer(config)
    
    print(f'Organizer initialized with model: {organizer.llm_model}')
    print(f'Ollama URL: {organizer.ollama_url}')
    
    # Test basic enhancement without LLM
    test_text = 'user likes python programming'
    enhanced = organizer._apply_enhancements(test_text, 'John', {
        'current_facts': {}, 
        'conversation': [], 
        'user': {}
    })
    print(f'Original: {test_text}')
    print(f'Enhanced: {enhanced}')
    print('Test completed successfully!')

if __name__ == "__main__":
    test_organizer()