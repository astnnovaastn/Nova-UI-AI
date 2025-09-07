#!/usr/bin/env python3
"""
Comprehensive test script for Mem0.ai integration with Nova AI
"""

import os
import sys
import time
from datetime import datetime

# Set the API key directly
os.environ['MEM0_API_KEY'] = "m0-Zqqz5Ach99oBnDkjDins0Kfhg9PqID6yRsUJKJDE"

# Test Mem0AI class
try:
    from astra_ai.core.nova_ai import Mem0AI
    print("[OK] Successfully imported Mem0AI class")
    
    # Initialize Mem0AI
    mem0_ai = Mem0AI()
    print("[OK] Successfully initialized Mem0AI")
    
    # Test user ID for this session
    test_user_id = f"nova_test_{int(time.time())}"
    print(f"[INFO] Using test user ID: {test_user_id}")
    
    # Test storing multiple memories
    test_memories = [
        {
            "content": "User loves Python programming and wants to learn machine learning",
            "metadata": {"topic": "programming", "interest": "ML"}
        },
        {
            "content": "User prefers coffee over tea and drinks it in the morning",
            "metadata": {"topic": "preferences", "category": "beverages"}
        },
        {
            "content": "User is working on a chatbot project using GROQ API",
            "metadata": {"topic": "projects", "technology": "AI"}
        }
    ]
    
    print("\n=== Testing Memory Storage ===")
    stored_memories = []
    for i, memory_data in enumerate(test_memories):
        try:
            result = mem0_ai.store_memory(
                memory_data["content"], 
                memory_data["metadata"], 
                user_id=test_user_id
            )
            stored_memories.append(result)
            print(f"[OK] Stored memory {i+1}: {memory_data['content'][:50]}...")
            print(f"     Result: {result}")
        except Exception as e:
            print(f"[ERROR] Failed to store memory {i+1}: {e}")
    
    # Wait a moment for indexing
    print("\n[INFO] Waiting 3 seconds for memory indexing...")
    time.sleep(3)
    
    # Test retrieving memories with different queries
    print("\n=== Testing Memory Retrieval ===")
    test_queries = [
        "What programming languages does the user like?",
        "What does the user drink?",
        "What projects is the user working on?",
        "Tell me about the user's preferences"
    ]
    
    for query in test_queries:
        try:
            memories = mem0_ai.retrieve_memories(query, limit=5, user_id=test_user_id)
            print(f"\n[QUERY] {query}")
            print(f"[RESULT] Found {len(memories)} relevant memories:")
            
            for j, memory in enumerate(memories):
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
                
                print(f"  {j+1}. {memory_text}")
                
        except Exception as e:
            print(f"[ERROR] Failed to retrieve memories for query '{query}': {e}")
    
    # Test getting all memories for the user
    print("\n=== Testing Get All Memories ===")
    try:
        all_memories = mem0_ai.get_all_memories(user_id=test_user_id)
        print(f"[OK] Retrieved {len(all_memories)} total memories for user {test_user_id}")
        
        for i, memory in enumerate(all_memories):
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
            
            print(f"  Memory {i+1}: {memory_text}")
            
    except Exception as e:
        print(f"[ERROR] Failed to get all memories: {e}")
    
    print(f"\n[SUCCESS] Comprehensive Mem0.ai integration test completed!")
    print(f"[INFO] Test user ID was: {test_user_id}")
    
except Exception as e:
    print(f"[ERROR] Error during comprehensive test: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)