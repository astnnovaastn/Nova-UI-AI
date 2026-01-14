#!/usr/bin/env python3
"""Test mem0 memory system directly"""

import os
import sys
import json

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent, NovaMemoryAI
    print("[SUCCESS] Imported mem0 memory system")
    
    # Test creating an agent
    storage_path = os.path.normpath(os.path.join(os.path.dirname(__file__), 'data', 'nova_ai_memory.json'))
    print(f"Storage path: {storage_path}")
    
    # Ensure data directory exists
    os.makedirs(os.path.dirname(storage_path), exist_ok=True)
    
    # Create agent
    agent = AdvancedMemoryAgent(storage_path)
    print("[SUCCESS] Created AdvancedMemoryAgent")
    
    # Test processing a conversation
    user_message = "My name is Alice and I'm a data scientist"
    ai_response = "Nice to meet you Alice! Data science is fascinating."
    
    result = agent.process_conversation(user_message, ai_response)
    print(f"[SUCCESS] Processed conversation: {result}")
    
    # Test getting user profile
    profile = agent.get_user_profile()
    print(f"[SUCCESS] User profile: {profile}")
    
    # Test saving memory
    agent.memory_system.save_memory()
    print("[SUCCESS] Saved memory")
    
    # Check if file exists
    if os.path.exists(storage_path):
        print(f"[SUCCESS] Memory file created at: {storage_path}")
        with open(storage_path, 'r') as f:
            content = json.load(f)
            print(f"[SUCCESS] Memory file has {len(content)} top-level keys")
            print(f"Keys: {list(content.keys())}")
    else:
        print(f"[ERROR] Memory file not found at: {storage_path}")
        
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()