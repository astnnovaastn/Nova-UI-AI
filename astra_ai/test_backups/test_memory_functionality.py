from astra_ai.memory.mem0_memory_system import NovaMemoryAI
import json

print("Testing memory system functionality...")

# Test the core functionality
memory = NovaMemoryAI(storage_file='test_memory.json')

# Check if the required methods exist
methods = ['add_event', 'process_input', 'update_event', 'get_fact_history', 'recompute_clusters', 'persist_memory', 'load_memory', 'cosine_similarity']
print('Available methods:')
for method in methods:
    exists = hasattr(memory, method)
    print(f'  {method}: {exists}')

print('\nTesting ADD event creation...')
try:
    result = memory.add_event('test_user', 'I love watching anime on weekends.', 'session1')
    print(f'ADD event created: {result}')
    
    # Check memory events
    memory_events = memory.data.get('memory_events', [])
    print(f'Number of memory events: {len(memory_events)}')
    for i, event in enumerate(memory_events[-1:]):  # Show last event
        print(f'Event {i}: {event.get("type", "N/A")} - {event.get("summary", "N/A")[:100]}')
        
    # Test process_input (UPDATE scenario)
    print('\nTesting UPDATE event creation...')
    result2 = memory.process_input('test_user', 'Actually, I prefer Sundays only for anime.', 'session1') 
    print(f'Process result: {result2}')
    
    # Check memory events after update
    memory_events = memory.data.get('memory_events', [])
    print(f'Number of memory events after update: {len(memory_events)}')
    for i, event in enumerate(memory_events[-2:]):  # Show last 2 events
        print(f'Event {i}: {event.get("type", "N/A")} - {event.get("summary", "N/A")[:100]}')
        
    # Check fact history
    fact_history = memory.get_fact_history('test_user')
    print(f'Fact history: {json.dumps(fact_history, indent=2)[:500]}...')
    
except Exception as e:
    print(f'Error in testing: {e}')
    import traceback
    traceback.print_exc()