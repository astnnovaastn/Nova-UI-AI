#!/usr/bin/env python3
"""
Test script to verify Mem0.ai integration with Nova AI
"""

import os
import sys
import dotenv
from pathlib import Path

# Set the API key directly
os.environ['MEM0_API_KEY'] = "m0-Zqqz5Ach99oBnDkjDins0Kfhg9PqID6yRsUJKJDE"

# Load environment variables
dotenv_path = Path('.env')
if dotenv_path.exists():
    dotenv.load_dotenv(dotenv_path)
    print("[OK] Loaded .env file")
else:
    print("[WARNING] .env file not found, using hardcoded API key")

# Check if MEM0_API_KEY is available
mem0_api_key = os.getenv('MEM0_API_KEY')
if mem0_api_key:
    print(f"[OK] MEM0_API_KEY found: {mem0_api_key[:10]}...")
else:
    print("[ERROR] MEM0_API_KEY not found in environment")
    sys.exit(1)

# Test Mem0AI class
try:
    from astra_ai.core.nova_ai import Mem0AI
    print("[OK] Successfully imported Mem0AI class")
    
    # Initialize Mem0AI
    mem0_ai = Mem0AI()
    print("[OK] Successfully initialized Mem0AI")
    
    # Test storing a memory
    test_content = "User asked about Python programming. I explained basic concepts."
    test_metadata = {
        "timestamp": "2024-01-01T12:00:00.000Z",
        "topic": "programming",
        "language": "python"
    }
    
    print("Testing memory storage...")
    result = mem0_ai.store_memory(test_content, test_metadata, user_id="test_user")
    print(f"[OK] Successfully stored memory: {result}")
    
    # Test retrieving memories
    print("Testing memory retrieval...")
    memories = mem0_ai.retrieve_memories("Python programming", limit=3, user_id="test_user")
    print(f"[OK] Successfully retrieved {len(memories)} memories")
    
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
        
        print(f"  Memory {i+1}: {memory_text[:50]}...")
    
    # Test getting all memories
    print("Testing get all memories...")
    all_memories = mem0_ai.get_all_memories(user_id="test_user")
    print(f"[OK] Successfully retrieved {len(all_memories)} total memories")
    
    print("\n[SUCCESS] Mem0.ai integration test completed successfully!")
    
except Exception as e:
    print(f"[ERROR] Error testing Mem0.ai integration: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)