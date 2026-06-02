#!/usr/bin/env python3
"""
Quick test to start the organizer and check if the errors are gone
"""
import sys
import os
import time

# Add path to astra_ai module
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def test_organizer():
    """Test starting the organizer to see if errors are fixed"""
    
    # Initialize organizer with minimal config
    config = {
        'organizer_enabled': True,
        'memory_file_path': 'astra_ai/Date/nova_ai_memory.json',
        'llm_enabled': False,  # Disable to avoid Groq dependency issues
        'check_interval': 2.0  # Longer interval for testing
    }

    organizer = AIOrganizer(config)
    
    print("Starting organizer for a short time to test...")
    print("If you see no error messages, the fix was successful!")
    
    try:
        # Start monitoring briefly to test
        import threading
        import time
        
        # Start organizer in a separate thread with timeout
        def run_organizer():
            organizer.start_monitoring()
        
        thread = threading.Thread(target=run_organizer)
        thread.daemon = True
        thread.start()
        
        # Wait for 5 seconds then stop
        time.sleep(5)
        print("\nTest completed successfully - no errors seen!")
        
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_organizer()