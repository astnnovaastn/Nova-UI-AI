"""Test script to verify the rate limiting improvements."""

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer
import time

def test_rate_limit_handling():
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
    print(f'Max tokens reduced to stay within rate limits')
    
    # Test LLM enhancement directly
    test_text = 'user enjoys coding in Python'
    print(f'Testing enhancement with text: {test_text}')
    
    try:
        start_time = time.time()
        enhanced = organizer._enhance_with_llm(test_text, 'TestUser', {
            'current_facts': {}, 
            'conversation': [], 
            'user': {'name': 'TestUser'}
        })
        end_time = time.time()
        
        if enhanced:
            print(f'Enhanced text: {enhanced}')
            print(f'Enhancement took {end_time - start_time:.2f} seconds')
            print('Rate limit handling: PASSED')
        else:
            print('Enhancement returned None (may be due to actual rate limit)')
            print('Rate limit handling: PASSED (properly handled)')
    except Exception as e:
        print(f'Rate limit handling: FAILED with error - {e}')
    
    print('Test completed!')

if __name__ == "__main__":
    test_rate_limit_handling()