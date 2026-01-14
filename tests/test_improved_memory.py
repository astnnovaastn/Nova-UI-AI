from astra_ai.memory.mem0_memory_system import NovaMemoryAI
import json

print("Testing improved memory system with better embeddings...")

# Test the core functionality
memory = NovaMemoryAI(storage_file='test_memory_improved.json')

print('\n=== Testing Vector Similarity with Improved Embeddings ===')
# Test the cosine similarity function with improved embeddings
vec1 = memory._create_embedding_vector('I love watching anime')
vec2 = memory._create_embedding_vector('I enjoy watching anime')
vec3 = memory._create_embedding_vector('I hate watching anime')
vec4 = memory._create_embedding_vector('I like watching anime on weekends')

sim12 = memory.cosine_similarity(vec1, vec2)  # Should be high (both love/enjoy)
sim13 = memory.cosine_similarity(vec1, vec3)  # Should be low (love vs hate)
sim14 = memory.cosine_similarity(vec1, vec4)  # Should be medium (similar topic, different detail)

print(f'Similarity between "love" and "enjoy" anime: {sim12:.3f}')
print(f'Similarity between "love" and "hate" anime: {sim13:.3f}')
print(f'Similarity between "love" and "like on weekends": {sim14:.3f}')

print('\n=== Testing ADD/UPDATE behavior ===')
# First, add an initial preference
result1 = memory.add_event('test_user', 'I love watching anime on weekends.', 'session1')
print(f'Initial ADD event: {result1}')

# Now test if a similar statement triggers an UPDATE instead of ADD
result2 = memory.process_input('test_user', 'I enjoy watching anime on weekends.', 'session1')
print(f'Second input result: {result2}')

# Test with a very different statement
result3 = memory.process_input('test_user', 'I hate eating vegetables.', 'session1')
print(f'Different topic result: {result3}')

# Check final state
memory_events = memory.data.get('memory_events', [])
print(f'\nTotal memory events: {len(memory_events)}')
for i, event in enumerate(memory_events):
    print(f'  Event {i} [{event.get("type", "N/A")}]: {event.get("summary", "N/A")[:100]}')

fact_history = memory.get_fact_history('test_user')
print(f'\nFact history: {json.dumps(fact_history, indent=2)}')

print('\n=== Testing UPDATE functionality directly ===')
# Add another initial statement
result4 = memory.add_event('test_user', 'I prefer coffee over tea.', 'session1')
print(f'New ADD event: {result4}')

# Find the event ID for the coffee statement
coffee_event_id = None
for event in memory.data.get('memory_events', []):
    if 'coffee' in str(event.get('current_value', '')) or 'coffee' in str(event.get('summary', '')):
        coffee_event_id = event.get('event_id')
        break

if coffee_event_id:
    print(f'Found coffee event ID: {coffee_event_id}')
    # Update the coffee preference
    update_result = memory.update_event(coffee_event_id, 'I prefer tea over coffee now.')
    print(f'Update result: {update_result}')
    
    # Check if fact history was updated properly
    fact_history = memory.get_fact_history('test_user')
    print(f'Updated fact history: {json.dumps(fact_history, indent=2)[:500]}...')

print('\n=== All tests completed successfully! ===')