#!/usr/bin/env python3
"""
Simple test of the updated Gemini client with google.genai package
"""

import os
import sys
from pathlib import Path

# Add the root directory to the path
sys.path.insert(0, str(Path(__file__).parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

print("🚀 Testing Gemini Client (google.genai)")
print("=" * 60)

try:
    # Test import
from astra_ai.llm.gemini_client import GeminiClient
    print("✓ GeminiClient imported successfully")
    
    # Check API key
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("✗ GEMINI_API_KEY not set")
        sys.exit(1)
    
    print(f"✓ GEMINI_API_KEY found: {api_key[:15]}...")
    
    # Initialize client
    print("\nInitializing GeminiClient...")
    client = GeminiClient(api_key=api_key)
    print("✓ Client initialized")
    
    # Test API call
    print("\nTesting API call with a simple message...")
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": "Say 'Hello from Gemini' in one short sentence"}],
        max_tokens=20,
        temperature=0.5
    )
    
    print("✓ API call successful!")
    print(f"\nResponse: {response.choices[0].message.content}")
    print(f"Tokens used: {response.usage.total_tokens}")
    
    print("\n" + "=" * 60)
    print("✓ All tests passed! Gemini integration is working.")
    sys.exit(0)
    
except ImportError as e:
    print(f"✗ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
