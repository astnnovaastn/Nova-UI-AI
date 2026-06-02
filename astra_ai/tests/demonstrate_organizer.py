#!/usr/bin/env python3
\"\"\"
Demonstration script showing the AI Organizer monitoring nova_ai_memory.json
and enhancing memory entries as they are added by the Nova AI system.
\"\"\"

import json
import os
import time
from datetime import datetime
from threading import Thread
from astra_ai.memory.Mem0_ai_organizer import AIOrganizer, ORGANIZER_CONFIG

def demonstrate_organizer():
    \"\"\"Demonstrate the AI Organizer functionality.\"\"\"
    
    print(\"🚀 AI Organizer Demonstration\")
    print(\"=\" * 50)
    print(\"This script demonstrates how the AI Organizer continuously monitors\")
    print(\"and enhances the nova_ai_memory.json file in real-time.\")
    print()
    
    # Show current configuration
    memory_file_path = ORGANIZER_CONFIG['memory_file_path']
    print(f\"📂 Monitoring file: {memory_file_path}\")
    print(f\"⏱️  Check interval: {ORGANIZER_CONFIG['check_interval']} seconds\")
    print(f\"🧠 LLM enhancement: {'Enabled' if ORGANIZER_CONFIG['llm_enabled'] else 'Disabled'}\")
    print()
    
    # Load current memory data to show initial state
    if os.path.exists(memory_file_path):
        with open(memory_file_path, 'r', encoding='utf-8') as f:
            memory_data = json.load(f)
        print(f\"📊 Initial memory entries: {len(memory_data.get('memory_events', []))}\")
        print(f\"👤 User: {memory_data.get('user', {}).get('name', 'Unknown')}\")
    else:
        print(f\"❌ Memory file does not exist: {memory_file_path}\")
        return
    
    print()
    print(\"🔄 Starting AI Organizer in background...\")
    
    # Create organizer instance
    organizer = AIOrganizer(ORGANIZER_CONFIG)
    
    # Start monitoring in a background thread
    organizer_thread = Thread(target=organizer.start_monitoring, daemon=True)
    organizer_thread.start()
    
    print(\"✅ AI Organizer is now monitoring the memory file!\")
    print()
    print(\"💡 The organizer will:\")
    print(\"   • Continuously watch for new entries in nova_ai_memory.json\")
    print(\"   • Enhance memory summaries to make them clearer and richer\")
    print(\"   • Improve grammar, capitalization, and phrasing\")
    print(\"   • Personalize references using the user's name\")
    print(\"   • Add relevant context or inferred details\")
    print(\"   • Merge updates with existing memories when needed\")
    print(\"   • Work without creating separate ENRICH events\")
    print(\"   • Keep each memory entry in its original place\")
    print()
    print(\"🎬 To see the organizer in action, interact with Nova AI\")
    print(\"   and watch as it enhances new memory entries in real-time!\")
    print()
    print(\"Press Ctrl+C to stop the demonstration...\")
    
    try:
        # Keep the main thread alive to allow monitoring
        while True:
            time.sleep(1)  # Check every second if user wants to exit
    except KeyboardInterrupt:
        print(\"\\n\\n🛑 Stopping AI Organizer demonstration...\")
        print(\"The organizer will continue running in the background if used with Nova AI\")
        print(\"but this demonstration is now complete.\")
        return

if __name__ == \"__main__\":
    demonstrate_organizer()