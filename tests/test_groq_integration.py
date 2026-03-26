"""Test script to verify the AI Organizer works with Groq API."""

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def test_groq_integration():
    # Create an organizer instance with Groq API enabled
    config = {
        'organizer_enabled': False,  # Disable monitoring for this test
        'memory_file_path': 'test_memory.json',  # Use a test file
        'check_interval': 1.0,
        'llm_enabled': True,
        'llm_api_key': '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',  # Groq API key
        'llm_model': 'llama-3.1-8b-instant'
    }
    
    organizer = AIOrganizer(config)
    print(f'Organizer initialized with model: {organizer.llm_model}')
    print(f'Groq URL: {organizer.groq_url}')
    print(f'API Key starts with: {organizer.llm_api_key[:3] if organizer.llm_api_key else "None"}')
    
    # Test LLM enhancement directly
    test_text = 'user is interested in learning Python programming'
    print(f'Original text: {test_text}')
    
    try:
        enhanced = organizer._enhance_with_llm(test_text, 'Alice', {
            'current_facts': {}, 
            'conversation': [], 
            'user': {'name': 'Alice'}
        })
        
        if enhanced:
            print(f'Groq-enhanced text: {enhanced}')
            print('Groq API integration: PASSED')
        else:
            print('Groq API integration: FAILED - no enhancement returned')
    except Exception as e:
        print(f'Groq API integration: FAILED with error - {e}')
    
    print('Test completed!')

if __name__ == "__main__":
    test_groq_integration()