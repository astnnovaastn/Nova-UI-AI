#!/usr/bin/env python3
"""
Test script to verify that conversations are being saved correctly.
"""

import sys
import os
import json
from pathlib import Path

# Add the memory module to the path
sys.path.append(str(Path(__file__).parent / "astra_ai" / "memory"))

from mem0_memory_system import create_memory_agent

def test_conversation_saving():
    """Test that conversations are saved to the memory file."""
    
    # Create memory agent
    memory_agent = create_memory_agent()
    
    # Test conversation
    test_user_message = "This is a test message for conversation saving"
    test_ai_response = "This is a test response to verify conversation saving"
    
    print("Testing conversation saving...")
    print(f"User message: {test_user_message}")
    print(f"AI response: {test_ai_response}")
    
    # Process conversation
    result = memory_agent.process_conversation(test_user_message, test_ai_response)
    print(f"Process result: {result}")
    
    # Save memory explicitly
    memory_agent.memory_system.save_memory()
    
    # Check if conversation was saved
    storage_file = "astra_ai/Date/nova_ai_memory.json"
    if os.path.exists(storage_file):
        with open(storage_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Check if our test messages are in the conversation
        conversation = data.get("conversation", [])
        found_user_message = False
        found_ai_response = False
        
        for message in conversation:
            if message.get("content") == test_user_message:
                found_user_message = True
            if message.get("content") == test_ai_response:
                found_ai_response = True
                
        if found_user_message and found_ai_response:
            print("✅ SUCCESS: Conversation messages found in memory file!")
            print(f"   Total conversation messages: {len(conversation)}")
            return True
        else:
            print("❌ FAILURE: Conversation messages not found in memory file!")
            print(f"   Total conversation messages: {len(conversation)}")
            return False
    else:
        print("❌ FAILURE: Memory file not found!")
        return False

if __name__ == "__main__":
    test_conversation_saving()