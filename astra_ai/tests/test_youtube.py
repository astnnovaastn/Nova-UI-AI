#!/usr/bin/env python3

"""Test the new fast YouTube functionality"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from standalone_self_improving_ai import StandaloneSelfImprovingAI

def test_youtube_requests():
    """Test various YouTube video requests"""
    
    ai = StandaloneSelfImprovingAI()
    
    test_requests = [
        "Go on YouTube and open a new Mr Beast video that he uploaded",
        "Play MrBeast latest video on YouTube", 
        "Open YouTube and watch new PewDiePie video",
        "YouTube play Markiplier new video",
        "Go to YouTube and find Logan Paul recent video"
    ]
    
    print("Testing Fast YouTube System")
    print("=" * 50)
    
    for i, request in enumerate(test_requests, 1):
        print(f"\n{i}. Testing: '{request}'")
        print("-" * 40)
        
        try:
            success, result = ai.process_user_request(request)
            print(f"Success: {success}")
            print(f"Result: {result}")
        except Exception as e:
            print(f"Error: {e}")
        
        print()

if __name__ == "__main__":
    test_youtube_requests()