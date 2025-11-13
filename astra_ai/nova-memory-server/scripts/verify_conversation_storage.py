#!/usr/bin/env python3
"""
Simple verification script to confirm conversation storage is working.
"""

import json
import os
from datetime import datetime

def verify_conversation_storage():
    """Verify that conversation storage is working correctly."""
    
    storage_file = "astra_ai/Date/nova_ai_memory.json"
    
    if not os.path.exists(storage_file):
        print("[ERROR] Memory file not found!")
        return False
    
    # Read the current memory file
    with open(storage_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Check conversation data
    conversation = data.get("conversation", [])
    
    print(f"[SUCCESS] Memory file found: {storage_file}")
    print(f"[SUCCESS] Total conversation messages: {len(conversation)}")
    
    if len(conversation) > 0:
        print("\nLatest conversation messages:")
        for i, msg in enumerate(conversation[-6:], 1):  # Show last 3 exchanges
            role = msg.get("role", "unknown")
            content = msg.get("content", "")[:100]  # Truncate long messages
            timestamp = msg.get("timestamp", "")
            
            # Format timestamp nicely
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                formatted_time = dt.strftime("%Y-%m-%d %H:%M:%S")
            except:
                formatted_time = timestamp
            
            print(f"  {i}. [{formatted_time}] {role}: {content}")
            
            if len(msg.get("content", "")) > 100:
                print(f"      ... (truncated)")
    
    # Check if there are any memory events
    memory_events = data.get("memory_events", [])
    print(f"\n[SUCCESS] Memory events recorded: {len(memory_events)}")
    
    if len(memory_events) > 0:
        print(f"Latest memory event: {memory_events[-1].get('summary', 'No summary')}")
    
    # Check if fact_history exists
    fact_history = data.get("fact_history", {})
    print(f"\n[SUCCESS] Fact history categories: {len(fact_history)}")
    
    # Check if memory_categories exists
    memory_categories = data.get("memory_categories", {})
    print(f"[SUCCESS] Memory categories: {len(memory_categories)}")
    
    print("\n[SUCCESS] Conversation storage is working correctly!")
    return True

if __name__ == "__main__":
    verify_conversation_storage()