#!/usr/bin/env python3
"""
Test script for calculator functionality
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from core.nova_ai import AleChatBot

def test_calculator_functionality():
    """Test the calculator functionality"""
    
    print("🧮 Testing Calculator Functionality")
    print("=" * 50)
    
    # Initialize the chatbot
    chatbot = AleChatBot()
    
    # Test cases
    test_cases = [
        "show calculator",
        "open calculator", 
        "give me calculator",
        "calculate 2 + 2",
        "what is 15 * 3",
        "compute sqrt(16)",
        "evaluate sin(30)",
        "solve 5^2",
        "what does 10 + 5 equal"
    ]
    
    for test_case in test_cases:
        print(f"\n📝 Testing: '{test_case}'")
        
        # Create a simple message format
        messages = [{"role": "user", "content": test_case}]
        
        try:
            # Test the calculator processing
            response = chatbot._process_calculator_query(test_case)
            
            if response:
                print(f"✅ Response: {response}")
            else:
                print("❌ No response (not a calculator request)")
                
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🧮 Calculator testing complete!")

if __name__ == "__main__":
    test_calculator_functionality() 