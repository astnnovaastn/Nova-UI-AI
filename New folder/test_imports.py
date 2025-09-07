"""
Test script to verify that all modules can be imported correctly
"""

import os
import sys

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test importing all modules"""
    print("Testing imports...")
    
    try:
        # Core modules
        from astra_ai.core.nova_ai import AleChatBot
        print("[OK] Successfully imported AleChatBot from nova_ai")
        
        # Memory modules
        from astra_ai.memory.memory_manager import MemoryManager
        print("[OK] Successfully imported MemoryManager")
        
        from astra_ai.memory.topic_manager import TopicManager
        print("[OK] Successfully imported TopicManager")
        
        # Speech modules
        from astra_ai.speech.text_to_speech import TextToSpeech
        print("[OK] Successfully imported TextToSpeech")
        
        # Script modules
        from astra_ai.scripts.start_nova_system import start_nova_system
        print("[OK] Successfully imported start_nova_system")
        
        print("\n[SUCCESS] All imports successful! Your package structure is working correctly.")
        return True
    except ImportError as e:
        print(f"[ERROR] Import error: {e}")
        return False

if __name__ == "__main__":
    test_imports()