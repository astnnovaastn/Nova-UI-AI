"""Test script to verify the AI Organizer works with Ollama."""

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def test_ollama_integration():
    # Create an organizer instance with Ollama enabled
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
    print(f'Ollama URL: {organizer.ollama_url}')
    
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
            print(f'Ollama-enhanced text: {enhanced}')
            print('Ollama integration: PASSED')
        else:
            print('Ollama integration: FAILED - no enhancement returned')
    except Exception as e:
        print(f'Ollama integration: FAILED with error - {e}')
    
    print('Test completed!')

if __name__ == "__main__":
    test_ollama_integration()