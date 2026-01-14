import sys
import os
sys.path.append(os.getcwd())

from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def test_selection_method():
    print('=== Testing Operation Selection Method ===')
    
    # Create a new memory system instance
    memory_system = NovaMemoryAI()
    
    # Manually create test operations similar to what the fact extractor returns
    operations = [
        {
            'type': 'ADD',
            'fact_type': 'personal_preferences.general', 
            'value': 'to watch anime',
            'category': 'personal_preferences',
            'subcategory': 'general'
        },
        {
            'type': 'ADD',
            'fact_type': 'personal_preferences.likes',
            'value': 'like to watch anime',
            'category': 'personal_preferences', 
            'subcategory': 'likes'
        }
    ]
    
    user_message = "i like to watch anime"
    print(f'User message: "{user_message}"')
    print(f'Input operations: {len(operations)}')
    
    selected_operation = memory_system._select_most_appropriate_operation(operations, user_message)
    
    print(f'Selected operation: {selected_operation}')
    print(f'  type={selected_operation.get("type")}')
    print(f'  fact_type={selected_operation.get("fact_type")}')  
    print(f'  value={selected_operation.get("value")}')
    print(f'  category={selected_operation.get("category")}')
    print(f'  subcategory={selected_operation.get("subcategory")}')

if __name__ == "__main__":
    test_selection_method()