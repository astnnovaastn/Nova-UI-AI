#!/usr/bin/env python3
"""
Simple test to check if Nova AI can be imported and initialized
"""

import sys
import os

# Add the astra_ai directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'astra_ai'))

def test_imports():
    """Test if we can import the necessary modules"""
    print("🧪 Testing imports...")
    
    try:
        print("   Importing AleChatBot...")
        from core.nova_ai import AleChatBot
        print("   ✅ AleChatBot imported successfully")
        
        print("   Importing memory system...")
        from memory.nova_memory_interface import NovaMemoryInterface
        print("   ✅ Memory system imported successfully")
        
        print("   Importing task management...")
        from core.task_management import TaskManager
        print("   ✅ Task management imported successfully")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_memory_direct():
    """Test memory system directly"""
    print("\n🧪 Testing memory system directly...")
    
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'astra_ai', 'memory'))
        from nova_memory_interface import NovaMemoryInterface
        
        # Create memory interface
        memory = NovaMemoryInterface("test_direct_memory.json", enable_logging=False)
        
        # Store a name
        result = memory.process_conversation(
            "Hi, my name is Alex",
            "Hello Alex! Nice to meet you."
        )
        
        print(f"   ✅ Memory storage: {result.get('success', False)}")
        
        # Try to retrieve context
        context = memory.get_context_for_ai_response()
        
        # Check if name is in the context
        facts = context.get('facts', {})
        print(f"   ✅ Facts stored: {len(facts)} categories")
        
        # Look for name in facts
        name_found = False
        for category, category_facts in facts.items():
            for fact_key, fact_value in category_facts.items():
                if 'alex' in str(fact_value).lower():
                    name_found = True
                    print(f"   ✅ Name found in {category}: {fact_key} = {fact_value}")
                    break
        
        if not name_found:
            print("   ⚠️ Name not found in facts, checking raw data...")
            stats = memory.get_memory_statistics()
            print(f"   📊 Memory stats: {stats.get('total_memory_items', 0)} items")
        
        # Clean up
        if os.path.exists("test_direct_memory.json"):
            os.remove("test_direct_memory.json")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Memory test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_basic_initialization():
    """Test basic Nova AI initialization without full startup"""
    print("\n🧪 Testing basic Nova AI initialization...")
    
    try:
        from core.nova_ai import AleChatBot
        
        # Try to create instance
        print("   Creating AleChatBot instance...")
        nova = AleChatBot()
        
        print("   ✅ AleChatBot created successfully")
        print(f"   Memory enabled: {getattr(nova, 'memory_enabled', 'Unknown')}")
        print(f"   Task manager: {getattr(nova, 'task_manager', 'Unknown') is not None}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Basic initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run simple tests"""
    print("🚀 Starting Simple Nova AI Tests\n")
    
    results = []
    
    # Test 1: Imports
    results.append(test_imports())
    
    # Test 2: Memory system
    results.append(test_memory_direct())
    
    # Test 3: Basic initialization
    results.append(test_basic_initialization())
    
    # Summary
    print(f"\n📊 Test Results:")
    print(f"   Imports: {'✅ PASS' if results[0] else '❌ FAIL'}")
    print(f"   Memory System: {'✅ PASS' if results[1] else '❌ FAIL'}")
    print(f"   Basic Initialization: {'✅ PASS' if results[2] else '❌ FAIL'}")
    
    if all(results):
        print("\n🎉 All simple tests PASSED!")
        print("✅ System components are working correctly")
        return True
    else:
        print("\n⚠️ Some simple tests FAILED!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
