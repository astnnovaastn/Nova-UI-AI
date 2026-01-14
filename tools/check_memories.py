import json
with open('astra_ai/Date/nova_ai_memory.json', 'r') as f:
    data = json.load(f)
    
events = data['memory_engine']['memory_events']
for i, event in enumerate(events):
    print(f'Event {i+1}: {event["summary"]}')
    print(f'  Emotion tags: {event["emotional_context"]["emotion_tags"]}')
    print(f'  Sentiment: {event["emotional_context"]["sentiment"]}')
    print(f'  Intensity: {event["emotional_context"]["emotional_intensity"]}')
    print(f'  Mood: {event["emotional_context"]["mood_context"]}')
    print()