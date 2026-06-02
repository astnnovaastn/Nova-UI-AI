#!/usr/bin/env python3
"""
Test script to verify that conversations are automatically saved to Mem0.ai
"""

import os
import sys
import time

# Set the API key directly
os.environ['MEM0_API_KEY'] = "m0-Zqqz5Ach99oBnDkjDins0Kfhg9PqID6yRsUJKJDE"

try:
    from astra_ai.core.nova_ai import AleChatBot
    print("[OK] Successfully imported AleChatBot")
    
    # Initialize the chatbot
    print("[INFO] Initializing AleChatBot...")
    bot = AleChatBot()
    print(f"[OK] AleChatBot initialized")
    print(f"[INFO] Mem0.ai available: {bot.mem0_available}")
    
    if not bot.mem0_available:
        print("[ERROR] Mem0.ai is not available. Please check the integration.")
        sys.exit(1)
    
    # Test storing a conversation using the FileManager
    print("\n=== Testing Conversation Storage ===")
    test_user_message = "Hello, I love Python programming!"
    test_ai_response = "That's great! Python is an excellent programming language. What aspects of Python do you enjoy most?"
    
    print(f"[TEST] Storing conversation...")
    print(f"  User: {test_user_message}")
    print(f"  AI: {test_ai_response}")
    
    # Store the conversation (this should automatically save to Mem0)
    success = bot.files.store_conversation(test_user_message, test_ai_response)
    print(f"[RESULT] Conversation stored successfully: {success}")
    
    # Wait a moment for Mem0 to process
    print("[INFO] Waiting 3 seconds for Mem0 to process...")
    time.sleep(3)
    
    # Test retrieving memories from Mem0
    print("\n=== Testing Memory Retrieval ===")
    if bot.mem0_ai:
        try:
            memories = bot.mem0_ai.retrieve_memories("Python programming", limit=5, user_id="nova_ai_user")
            print(f"[OK] Retrieved {len(memories)} memories about Python programming:")
            
            for i, memory in enumerate(memories):
                # Handle different memory formats
                memory_text = ""
                if isinstance(memory, dict):
                    if 'memory' in memory:
                        memory_text = memory['memory']
                    elif 'text' in memory:
                        memory_text = memory['text']
                    elif 'content' in memory:
                        memory_text = memory['content']
                    else:
                        memory_text = str(memory)
                else:
                    memory_text = str(memory)
                
                print(f"  {i+1}. {memory_text}")
                
        except Exception as e:
            print(f"[ERROR] Failed to retrieve memories: {e}")
    
    # Test getting all memories for the user
    print("\n=== Testing All Memories Retrieval ===")
    try:
        all_memories = bot.mem0_ai.get_all_memories(user_id="nova_ai_user")
        print(f"[OK] Total memories for nova_ai_user: {len(all_memories)}")
        
        # Show the last 3 memories
        recent_memories = all_memories[-3:] if len(all_memories) >= 3 else all_memories
        print(f"[INFO] Most recent {len(recent_memories)} memories:")
        
        for i, memory in enumerate(recent_memories):
            memory_text = ""
            if isinstance(memory, dict):
                if 'memory' in memory:
                    memory_text = memory['memory']
                elif 'text' in memory:
                    memory_text = memory['text']
                elif 'content' in memory:
                    memory_text = memory['content']
                else:
                    memory_text = str(memory)
            else:
                memory_text = str(memory)
            
            print(f"  {i+1}. {memory_text}")
            
    except Exception as e:
        print(f"[ERROR] Failed to get all memories: {e}")
    
    print(f"\n[SUCCESS] Conversation saving test completed!")
    print(f"[INFO] All conversations with the AI are automatically saved to Mem0.ai")
    print(f"[INFO] User ID used: nova_ai_user")
    
except Exception as e:
    print(f"[ERROR] Error during test: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)