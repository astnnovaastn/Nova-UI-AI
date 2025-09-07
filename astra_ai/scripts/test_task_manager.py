#!/usr/bin/env python3
"""
Test script to verify task management system works correctly
"""

import sys
import os
from pathlib import Path

# Add the correct paths
sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent.parent / "astra_ai"))

def test_task_manager():
    """Test the task management system"""
    print("🧪 Testing Task Management System...")
    print()
    
    try:
        # Test imports
        print("1. Testing imports...")
        from core.nova_ai import AleChatBot, TASK_MANAGEMENT_AVAILABLE
        print(f"   ✅ AleChatBot imported")
        print(f"   ✅ TASK_MANAGEMENT_AVAILABLE: {TASK_MANAGEMENT_AVAILABLE}")
        
        # Test initialization
        print("\n2. Testing Nova AI initialization...")
        bot = AleChatBot()
        print(f"   ✅ AleChatBot initialized")
        
        # Test task manager
        print("\n3. Testing task manager...")
        print(f"   Task manager exists: {bot.task_manager is not None}")
        
        if bot.task_manager:
            print("   ✅ Task manager is available!")
            
            # Test basic task operations
            print("\n4. Testing task operations...")
            
            # Get all tasks
            tasks = bot.task_manager.get_all_tasks()
            print(f"   Current tasks: {len(tasks)}")
            
            # Get statistics
            stats = bot.task_manager.get_task_statistics()
            print(f"   Task statistics: {stats}")
            
            # Test task creation
            print("\n5. Testing task creation...")
            from core.task_management import TaskPriority
            from datetime import datetime, timedelta
            
            # Create a test task
            due_date = datetime.now() + timedelta(hours=1)
            task = bot.task_manager.create_task(
                title="Test Task",
                description="This is a test task",
                due_date=due_date,
                priority=TaskPriority.MEDIUM
            )

            if task:
                print(f"   ✅ Test task created with ID: {task.id}")

                # Get the task
                retrieved_task = bot.task_manager.get_task(task.id)
                if retrieved_task:
                    print(f"   ✅ Task retrieved: {retrieved_task.title}")

                    # Clean up - delete the test task
                    if bot.task_manager.delete_task(task.id):
                        print(f"   ✅ Test task deleted")
                    else:
                        print(f"   ⚠️ Failed to delete test task")
                else:
                    print(f"   ❌ Failed to retrieve test task")
            else:
                print(f"   ❌ Failed to create test task")
                
        else:
            print("   ❌ Task manager is not available")
            print("   Checking why...")
            
            # Check memory integration
            print(f"   Memory integration: {bot.memory_integration is not None}")
            
            # Check if task management is available
            print(f"   TASK_MANAGEMENT_AVAILABLE: {TASK_MANAGEMENT_AVAILABLE}")
            
            if not TASK_MANAGEMENT_AVAILABLE:
                print("   Issue: Task management system not detected as available")
                print("   Trying to import task management components...")
                try:
                    from core.task_management import TaskManager, TaskNLPProcessor, TaskStatus, TaskPriority
                    print("   ✅ Task management components can be imported")
                except ImportError as e:
                    print(f"   ❌ Task management import failed: {e}")
            
        print("\n" + "="*50)
        if bot.task_manager:
            print("🎉 Task Management System is working!")
            return True
        else:
            print("❌ Task Management System has issues")
            return False
            
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_desktop_nova_compatibility():
    """Test if desktop Nova script can access task management"""
    print("\n🖥️ Testing Desktop Nova Compatibility...")
    print()
    
    try:
        # Change to parent directory (simulating desktop Nova script)
        original_cwd = os.getcwd()
        parent_dir = Path(__file__).parent.parent.parent
        os.chdir(parent_dir)
        
        # Add paths like desktop Nova script does
        sys.path.insert(0, str(parent_dir))
        sys.path.insert(0, str(parent_dir / "astra_ai"))
        
        print(f"Changed to directory: {os.getcwd()}")
        print(f"Python path includes: {[p for p in sys.path[:3]]}")
        
        # Test import
        from core.nova_ai import AleChatBot
        bot = AleChatBot()
        
        print(f"Task manager available: {bot.task_manager is not None}")
        
        # Restore original directory
        os.chdir(original_cwd)
        
        return bot.task_manager is not None
        
    except Exception as e:
        print(f"❌ Desktop Nova compatibility test failed: {e}")
        # Restore original directory
        try:
            os.chdir(original_cwd)
        except:
            pass
        return False

if __name__ == "__main__":
    print("🧪 NOVA AI TASK MANAGEMENT TEST")
    print("=" * 50)
    
    # Test 1: Basic task management
    success1 = test_task_manager()
    
    # Test 2: Desktop Nova compatibility
    success2 = test_desktop_nova_compatibility()
    
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"Basic Task Management: {'✅ PASS' if success1 else '❌ FAIL'}")
    print(f"Desktop Nova Compatibility: {'✅ PASS' if success2 else '❌ FAIL'}")
    
    if success1 and success2:
        print("\n🎉 All tests passed! Task management should work in desktop Nova.")
    elif success1:
        print("\n⚠️ Task management works but may have issues in desktop Nova.")
        print("💡 Try running desktop Nova from the astra_ai directory.")
    else:
        print("\n❌ Task management system needs fixes.")
        print("💡 Check the import paths and dependencies.")
