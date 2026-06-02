#!/usr/bin/env python3
"""
Nova AI - Server Debug & Diagnostic Tool
========================================
This script helps diagnose why the AI server might not be running the AI properly.
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def print_section(text):
    print(f"\n✓ {text}")
    print("-" * 60)

def check_environment():
    """Check Python environment and imports"""
    print_section("ENVIRONMENT CHECK")
    
    print(f"Python version: {sys.version}")
    print(f"Python executable: {sys.executable}")
    print(f"Current directory: {os.getcwd()}")
    
    # Check required packages
    required_packages = ['flask', 'flask_cors', 'aiofiles', 'asyncio']
    print("\nChecking packages...")
    for package in required_packages:
        try:
            __import__(package)
            print(f"  ✅ {package}")
        except ImportError:
            print(f"  ❌ {package} - NOT INSTALLED")

def check_imports():
    """Check if Nova AI can be imported"""
    print_section("NOVA AI IMPORTS CHECK")
    
    sys.path.append(str(Path(__file__).parent / "astra_ai"))
    
    # Check core.nova_ai
    try:
        from core.nova_ai import AleChatBot
        print("✅ Successfully imported AleChatBot from core.nova_ai")
        
        # Try to create instance
        print("   Attempting to create AleChatBot instance...")
        bot = AleChatBot()
        print("   ✅ AleChatBot instance created successfully")
        
        # Check methods
        print("   Checking available methods:")
        if hasattr(bot, 'get_response'):
            print("      ✅ get_response() method available")
        else:
            print("      ❌ get_response() method NOT found")
            
        if hasattr(bot, 'chat'):
            print("      ✅ chat() method available")
        else:
            print("      ❌ chat() method NOT found")
            
        if hasattr(bot, 'process_message'):
            print("      ✅ process_message() method available")
        else:
            print("      ❌ process_message() method NOT found")
            
        return bot
        
    except Exception as e:
        print(f"❌ Failed to import or create AleChatBot: {e}")
        import traceback
        traceback.print_exc()
        return None

def check_groq_api():
    """Check if GROQ API key is set"""
    print_section("GROQ API CHECK")
    
    api_key = os.getenv('GROQ_API_KEY')
    if api_key:
        print(f"✅ GROQ_API_KEY is set")
        print(f"   Key starts with: {api_key[:10]}...")
    else:
        print(f"❌ GROQ_API_KEY is NOT set")
        print(f"   Please set: export GROQ_API_KEY='your_key_here'")

def test_ai_response(bot):
    """Test if AI can generate a response"""
    print_section("AI RESPONSE TEST")
    
    if not bot:
        print("❌ No AI bot available for testing")
        return
    
    try:
        print("Sending test message: 'Hello!'")
        
        # Try async method
        import asyncio
        
        if hasattr(bot, 'get_response'):
            print("Using get_response() method...")
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                messages = [{"role": "user", "content": "Hello!"}]
                response = loop.run_until_complete(bot.get_response(messages, stream_to_terminal=False))
                print(f"✅ Response generated!")
                print(f"   Response: {response[:100]}..." if len(response) > 100 else f"   Response: {response}")
                return True
            except Exception as e:
                print(f"❌ Error: {e}")
                return False
            finally:
                loop.close()
        else:
            print("❌ get_response() method not available")
            return False
            
    except Exception as e:
        print(f"❌ Failed to test AI: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print_header("Nova AI Server Diagnostic Tool")
    
    # Run checks
    check_environment()
    check_groq_api()
    bot = check_imports()
    
    if bot:
        test_ai_response(bot)
    
    print_header("Diagnosis Complete")
    
    print("""
NEXT STEPS:

1. If GROQ_API_KEY is not set:
   - Get your key from https://console.groq.com
   - Set it: export GROQ_API_KEY='your_key'
   - Restart the server

2. If imports fail:
   - Check that you're in the correct directory
   - Try: cd c:\\Users\\afian\\OneDrive\\Desktop\\Astra_ai
   - Install requirements: pip install -r requirements.txt

3. If AI response fails:
   - Check network connectivity
   - Verify GROQ API key is correct
   - Check firewall settings

4. To run the server with full debugging:
   - python astra_ai/scripts/run_desktop_nova.py
   - Watch the terminal output carefully
   - Check for any ERROR or EXCEPTION messages
""")

if __name__ == "__main__":
    os.chdir(Path(__file__).parent)
    main()
