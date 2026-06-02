import sys
import os
sys.path.append(os.getcwd())

from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def debug_fact_extraction():
    print('=== Debugging Fact Extraction ===')
    
    # Create a new memory system instance
    memory_system = NovaMemoryAI()
    
    # Call the fact extractor directly to see what it returns
    context = {
        'session_id': 'test_session',
        'timestamp': '2023-01-01T00:00:00',
        'previous_messages': []
    }
    
    message = "i like to watch anime"
    current_facts = memory_system.data.get("fact_history", {})
    
    print(f'Analyzing message: "{message}"')
    operations = memory_system.fact_extractor.analyze_message(message, current_facts, context)
    
    print(f'Number of operations returned: {len(operations)}')
    print('Operations details:')
    for i, op in enumerate(operations):
        print(f'  Operation {i+1}: type={op.get("type")}, fact_type={op.get("fact_type")}, value={op.get("value")}, category={op.get("category", "None")}, subcategory={op.get("subcategory", "None")}')
    
    print('\nThe issue is that the fact extractor returns multiple operations for one input.')

if __name__ == "__main__":
    debug_fact_extraction()