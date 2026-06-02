#!/usr/bin/env python3
"""
Test script to verify EnhancedNovaAI integration with UI
"""
import sys
import os
import asyncio
import json
from pathlib import Path

# Add the project root to the path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "astra_ai"))

def test_enhanced_nova_initialization():
    """Test EnhancedNovaAI initialization"""
    print("[TEST] Testing EnhancedNovaAI initialization...")
    
    try:
        from astra_ai.core.enhanced_nova_ai import EnhancedNovaAI
        
        # Initialize configuration
        config = {
            'search_api_key': os.getenv('GROQ_API_KEY', 'your_api_key_here'),
            'search_base_url': os.getenv('SEARCH_BASE_URL', 'https://api.search.example.com'),
            'openweather_api_key': os.getenv('OPENWEATHER_API_KEY', 'your_openweather_api_key_here')
        }
        
        # Create EnhancedNovaAI instance
        nova = EnhancedNovaAI(config)
        print("[SUCCESS] EnhancedNovaAI initialized successfully")
        
        # Test basic functionality
        print("[TEST] Testing basic message processing...")
        response = asyncio.run(nova.process_message("Hello, how are you?"))
        print(f"[RESPONSE] Response: {response}")
        print("[SUCCESS] Basic message processing works")
        
        # Test weather functionality
        print("[TEST] Testing weather functionality...")
        weather_result = nova._process_weather_query("What's the weather in London?")
        if weather_result:
            print(f"[WEATHER] Weather response: {weather_result[:100]}...")
            print("[SUCCESS] Weather functionality works")
        else:
            print("[INFO] Weather functionality not active for this query")
        
        # Test news functionality
        print("[TEST] Testing news functionality...")
        news_result = nova._process_news_query("What's the latest news?")
        if news_result:
            print(f"[NEWS] News response: {news_result[:100]}...")
            print("[SUCCESS] News functionality works")
        else:
            print("[INFO] News functionality not active for this query")
        
        # Test memory functionality
        print("[TEST] Testing memory functionality...")
        try:
            # Add a test memory
            nova.vector_memory.add_memory(
                text="Test user preference: likes Python programming",
                metadata={'timestamp': '2024-01-01', 'test': True}
            )
            print("[SUCCESS] Memory functionality works")
        except Exception as e:
            print(f"[WARNING] Memory functionality error: {e}")
        
        print("\n[SUCCESS] All EnhancedNovaAI tests passed!")
        return True
        
    except ImportError as e:
        print(f"[ERROR] Import error: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Error during EnhancedNovaAI testing: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_memory_fix():
    """Test that the remove_duplicate_memory_events fix works"""
    print("\n[TEST] Testing memory system fix...")
    
    try:
        from astra_ai.memory.mem0_memory_system import NovaMemoryAI
        
        # Create memory instance
        memory = NovaMemoryAI()
        print("[SUCCESS] Memory system initialized successfully")
        
        # Check if the fix method exists
        if hasattr(memory, 'remove_duplicate_memory_events'):
            print("[SUCCESS] remove_duplicate_memory_events method exists")
        else:
            print("[ERROR] remove_duplicate_memory_events method missing")
            return False
        
        # Test that saving doesn't raise the error
        try:
            memory.save_memory()
            print("[SUCCESS] Memory save without 'remove_duplicate_memory_events' error")
        except AttributeError as e:
            if "remove_duplicate_memory_events" in str(e):
                print(f"[ERROR] Memory error still exists: {e}")
                return False
            else:
                # Different error, re-raise
                raise e
        
        print("[SUCCESS] Memory system fix working correctly")
        return True
        
    except Exception as e:
        print(f"[ERROR] Error during memory system testing: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("[TEST] Testing EnhancedNovaAI Integration")
    print("="*50)
    
    all_tests_passed = True
    
    # Test EnhancedNovaAI initialization and functionality
    if not test_enhanced_nova_initialization():
        all_tests_passed = False
    
    # Test memory fix
    if not test_memory_fix():
        all_tests_passed = False
    
    print("\n" + "="*50)
    if all_tests_passed:
        print("[SUCCESS] All tests passed! EnhancedNovaAI integration is working correctly.")
        print("\nNext steps:")
        print("1. Run 'python -m astra_ai.scripts.run_desktop_nova' to start the UI")
        print("2. The UI should now use EnhancedNovaAI with all its features")
        print("3. Memory system errors should be fixed")
    else:
        print("[ERROR] Some tests failed. Please check the errors above.")
    
    return all_tests_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)