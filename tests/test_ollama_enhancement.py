"""Test script for the Ollama LLM enhancement functionality."""

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def test_ollama_enhancement():
    # Create an organizer instance with LLM enabled to test actual Ollama integration
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
    
    enhanced = organizer._enhance_with_llm(test_text, 'Alice', {
        'current_facts': {}, 
        'conversation': [], 
        'user': {'name': 'Alice'}
    })
    
    if enhanced:
        print(f'Ollama-enhanced text: {enhanced}')
        print('Ollama enhancement test: PASSED')
    else:
        print('Ollama enhancement test: FAILED - no enhancement returned')
    
    print('Test completed!')

if __name__ == "__main__":
    test_ollama_enhancement()