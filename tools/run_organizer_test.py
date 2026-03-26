import json
import copy
from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def run_organizer_on_existing_file():
    """Run the organizer on the existing memory file to update emotion tags"""
    
    # Load the existing memory file
    memory_file_path = "astra_ai/Date/nova_ai_memory.json"
    
    with open(memory_file_path, 'r', encoding='utf-8') as f:
        memory_data = json.load(f)
    
    print("Before processing:")
    memory_events = memory_data.get('memory_engine', {}).get('memory_events', [])
    for i, event in enumerate(memory_events):
        if event.get('type') == 'ADD':
            print(f"Event {i+1}: {event.get('summary')}")
            print(f"  Emotion tags: {event.get('emotional_context', {}).get('emotion_tags', [])}")
            print(f"  Context: {event.get('provenance', {}).get('source_info', {}).get('context', 'N/A')}")
            print()
    
    # Create organizer config
    config = {
        'organizer_enabled': True,
        'memory_file_path': memory_file_path,
        'check_interval': 0.5,  # Fast check for testing
        'llm_enabled': False,   # Disable for faster testing
        'max_cache_size': 10
    }

    # Create organizer and process the file once
    organizer = AIOrganizer(config)

    # Process all ADD events to enhance them (this should update emotion tags)
    for i, event in enumerate(memory_events):
        if event.get('type', '').upper() == 'ADD':
            print(f"Processing ADD event {i+1}: {event.get('summary')}")
            
            # Find source info for the event
            source_info = organizer._determine_source_info(memory_data, event, i)
            
            # Enhance the event in place to populate emotion tags
            enhanced_event = organizer._enhance_event_in_place(event, None, memory_data, source_info)
            
            # Update the event in the list
            memory_events[i] = enhanced_event
            
            print(f"  Updated emotion tags: {enhanced_event.get('emotional_context', {}).get('emotion_tags', [])}")
            print(f"  Sentiment: {enhanced_event.get('emotional_context', {}).get('sentiment', 'unknown')}")
            print()

    # Save the updated data
    with open(memory_file_path, 'w', encoding='utf-8') as f:
        json.dump(memory_data, f, indent=2)
    
    print("Processing complete! File updated.")

if __name__ == "__main__":
    run_organizer_on_existing_file()