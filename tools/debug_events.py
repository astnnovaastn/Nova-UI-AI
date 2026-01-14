from astra_ai.memory.mem0_memory_system import NovaMemoryAI

# Create memory system and add some events
memory = NovaMemoryAI(storage_file='debug_test.json')
event_id1 = memory.add_event('user1', 'I love watching anime.', 'session1')
print(f'Created ADD event: {event_id1}')

# Create an update
result = memory.update_event(event_id1, 'I really enjoy watching anime.')
print(f'Created UPDATE event: {result}')

# Check all events in detail
events = memory.data.get('memory_events', [])
print(f'Total events: {len(events)}')
for i, event in enumerate(events):
    print(f'Event {i}: Type={event.get("type", "N/A")}, has_event_id={"event_id" in event}')
    if "event_id" in event:
        print(f'  Event ID: {event["event_id"]}')
    else:
        print(f'  Event content: {str(event)[:200]}...')