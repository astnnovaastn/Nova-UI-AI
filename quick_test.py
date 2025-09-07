#!/usr/bin/env python3
"""Quick test of the enhanced AI."""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from standalone_self_improving_ai import StandaloneSelfImprovingAI

def quick_test():
    """Quick test of WhatsApp functionality."""
    print("Quick Test: WhatsApp Launch with Browser Fallback")
    print("-" * 50)
    
    # Initialize the AI
    ai = StandaloneSelfImprovingAI()
    
    # Test WhatsApp
    print("Testing: 'open WhatsApp on my pc'")
    success, response = ai.process_user_request("open WhatsApp on my pc")
    
    print(f"\nSuccess: {success}")
    print(f"Response: {response}")
    
    # Test browser-specific request
    print("\n" + "-" * 50)
    print("Testing: 'open WhatsApp in browser'")
    success2, response2 = ai.process_user_request("open WhatsApp in browser")
    
    print(f"\nSuccess: {success2}")
    print(f"Response: {response2}")

if __name__ == "__main__":
    quick_test()