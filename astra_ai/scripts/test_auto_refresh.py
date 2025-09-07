#!/usr/bin/env python3
"""
Test script for auto-refresh functionality
This script can be used to test if the file watcher is working correctly
"""

import time
import os
from pathlib import Path

def test_auto_refresh():
    """Test the auto-refresh functionality by creating a test file"""
    
    # Get the UI directory
    current_dir = Path(__file__).parent.parent
    ui_dir = current_dir / 'ui'
    test_file = ui_dir / 'test_refresh.txt'
    
    print("🧪 Testing auto-refresh functionality...")
    print(f"📁 UI directory: {ui_dir}")
    print(f"📄 Test file: {test_file}")
    
    # Create a test file
    try:
        with open(test_file, 'w') as f:
            f.write(f"Test file created at {time.strftime('%H:%M:%S')}")
        print("✅ Test file created")
        
        # Wait a moment
        time.sleep(1)
        
        # Modify the test file
        with open(test_file, 'a') as f:
            f.write(f"\nModified at {time.strftime('%H:%M:%S')}")
        print("✅ Test file modified")
        
        # Wait a moment
        time.sleep(1)
        
        # Delete the test file
        test_file.unlink()
        print("✅ Test file deleted")
        
        print("\n🎉 Auto-refresh test completed!")
        print("💡 If the UI refreshed automatically, the auto-refresh is working!")
        
    except Exception as e:
        print(f"❌ Error during test: {e}")

def test_nova_ai_reload():
    """Test Nova AI module reload by creating a test Python file"""
    
    # Get the core directory
    current_dir = Path(__file__).parent.parent
    core_dir = current_dir / 'core'
    test_file = core_dir / 'test_nova_reload.py'
    
    print("\n🧪 Testing Nova AI module reload...")
    print(f"📁 Core directory: {core_dir}")
    print(f"📄 Test file: {test_file}")
    
    # Create a test Python file
    try:
        with open(test_file, 'w') as f:
            f.write(f"# Test file for Nova AI reload\n")
            f.write(f"# Created at {time.strftime('%H:%M:%S')}\n")
            f.write(f"print('Test Nova AI reload')\n")
        print("✅ Test Python file created")
        
        # Wait a moment
        time.sleep(1)
        
        # Modify the test file
        with open(test_file, 'a') as f:
            f.write(f"# Modified at {time.strftime('%H:%M:%S')}\n")
        print("✅ Test Python file modified")
        
        # Wait a moment
        time.sleep(1)
        
        # Delete the test file
        test_file.unlink()
        print("✅ Test Python file deleted")
        
        print("\n🎉 Nova AI reload test completed!")
        print("💡 If you saw 'Nova AI reloaded successfully' in the console, the reload is working!")
        
    except Exception as e:
        print(f"❌ Error during test: {e}")

if __name__ == '__main__':
    print("="*50)
    print("🧪 Auto-Refresh Test Suite")
    print("="*50)
    
    # Test UI refresh
    test_auto_refresh()
    
    # Test Nova AI reload
    test_nova_ai_reload()
    
    print("\n" + "="*50)
    print("✅ All tests completed!")
    print("💡 Check the console output for auto-refresh messages")
    print("="*50) 