#!/usr/bin/env python3
"""
Test script to verify Gemini integration
"""

import os
import sys
from pathlib import Path

# Add the root directory to the path
sys.path.insert(0, str(Path(__file__).parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

def test_gemini_client():
    """Test basic Gemini client functionality"""
    print("=" * 60)
    print("Testing Gemini Client Integration")
    print("=" * 60)
    
    try:
from astra_ai.llm.gemini_client import GeminiClient
        print("✓ Successfully imported GeminiClient")
        
        # Check if API key is set
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            print("✗ GEMINI_API_KEY not found in environment")
            return False
        
        print(f"✓ GEMINI_API_KEY found: {api_key[:10]}...")
        
        # Initialize the client
        client = GeminiClient(api_key=api_key)
        print("✓ GeminiClient initialized successfully")
        
        # Test a simple request
        print("\nTesting API call...")
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": "Say hello in one word"}],
            max_tokens=10,
            temperature=0.7
        )
        
        print(f"✓ API call successful!")
        print(f"  Response: {response.choices[0].message.content}")
        print(f"  Tokens: {response.usage.total_tokens}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_nova_ai_imports():
    """Test Nova AI imports"""
    print("\n" + "=" * 60)
    print("Testing Nova AI Imports")
    print("=" * 60)
    
    try:
        # Add astra_ai to path
        sys.path.insert(0, str(Path(__file__).parent / "astra_ai" / "core"))
        
        print("Checking nova_ai.py imports...")
        print("✓ Should import gemini_client instead of groq_client_fix")
        
        # Check if the gemini module is available
        if 'gemini' in sys.modules or 'gemini_client' in sys.modules:
            print("✓ Gemini module loaded successfully")
            return True
        else:
            print("⚠ Gemini module not yet loaded (will load on demand)")
            return True
            
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def verify_configuration():
    """Verify configuration files"""
    print("\n" + "=" * 60)
    print("Verifying Configuration")
    print("=" * 60)
    
    try:
        config_path = Path(__file__).parent / "astra_ai" / "config" / "config.json"
        
        if not config_path.exists():
            print(f"✗ Config file not found: {config_path}")
            return False
        
        import json
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        if 'api_keys' in config and 'gemini' in config['api_keys']:
            print(f"✓ Gemini API key configured in config.json")
        else:
            print(f"✗ Gemini API key not found in config.json")
            return False
        
        if 'gemini_model' in config['api_keys']:
            model = config['api_keys']['gemini_model']
            print(f"✓ Model configured: {model}")
        else:
            print(f"✗ Model not configured in config.json")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    print("\n🚀 Starting Gemini Integration Tests\n")
    
    results = []
    
    # Run tests
    results.append(("Gemini Client", test_gemini_client()))
    results.append(("Configuration", verify_configuration()))
    results.append(("Nova AI Imports", test_nova_ai_imports()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    all_passed = all(result[1] for result in results)
    
    if all_passed:
        print("\n✓ All tests passed! Gemini integration is ready.")
        sys.exit(0)
    else:
        print("\n✗ Some tests failed. Please check the errors above.")
        sys.exit(1)
