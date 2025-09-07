#!/usr/bin/env python3
"""
🎵 MUSIC SYSTEM DEMO
====================

Interactive demo of the Nova AI music system.
Shows how voice commands are processed and music is handled.

Author: Nova AI Development Team
Version: 1.0
License: MIT
"""

import asyncio
import sys
from pathlib import Path

# Add the parent directory to the path so we can import from astra_ai
sys.path.append(str(Path(__file__).parent.parent))

try:
    from services.music_service import MusicService
except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure you're running this from the astra_ai directory")
    sys.exit(1)

async def demo_music_system():
    """Interactive demo of the music system."""
    print("🎵 NOVA AI MUSIC SYSTEM DEMO")
    print("=" * 40)
    print("This demo shows how Nova AI processes music commands.")
    print("The music system integrates with YouTube for search and playback.")
    print()
    
    # Initialize music service
    api_key = "AIzaSyCB0N8PNZom2ipR2r1clhQjskbSHL2zxsc"
    music_service = MusicService(youtube_api_key=api_key)
    
    # Demo commands
    demo_commands = [
        "Hey Nova, play Bohemian Rhapsody",
        "Search for Taylor Swift music",
        "Show me lyrics for Imagine Dragons Thunder",
        "What's playing?",
        "Play some Beatles songs"
    ]
    
    print("🎤 DEMO COMMANDS:")
    for i, cmd in enumerate(demo_commands, 1):
        print(f"  {i}. {cmd}")
    
    print("\n" + "="*40)
    
    for i, command in enumerate(demo_commands, 1):
        print(f"\n🎵 DEMO {i}: '{command}'")
        print("-" * 40)
        
        try:
            # Process the command
            response = await music_service.process_music_request(command)
            
            if response:
                # Clean up the response for display
                clean_response = response.replace("MUSIC_RESULT: ", "")
                print(clean_response)
            else:
                print("❌ No response generated")
                
        except Exception as e:
            print(f"❌ Error processing command: {e}")
        
        # Wait a moment between demos
        if i < len(demo_commands):
            print("\n⏳ Press Enter to continue to next demo...")
            input()
    
    print("\n" + "="*40)
    print("🎉 DEMO COMPLETE!")
    print("\n💡 Key Features Demonstrated:")
    print("  ✅ Natural language music command processing")
    print("  ✅ YouTube music search integration")
    print("  ✅ Copyright-compliant lyrics handling")
    print("  ✅ Conversational response formatting")
    print("  ✅ Music playback through browser")
    
    print("\n🎵 How to use in Nova AI:")
    print("  1. Start Nova AI: python nova_ai.py")
    print("  2. Say any music command like 'play [song name]'")
    print("  3. Music will open in your default browser")
    print("  4. Use browser controls for playback")
    
    print("\n🔧 Technical Details:")
    print("  • Uses YouTube Data API v3 for music search")
    print("  • Respects copyright laws for lyrics")
    print("  • Integrates with Nova AI's memory system")
    print("  • Supports natural language processing")

async def interactive_demo():
    """Interactive demo where user can type commands."""
    print("\n🎤 INTERACTIVE MODE")
    print("=" * 40)
    print("Type music commands to see how they're processed.")
    print("Examples: 'play Bohemian Rhapsody', 'search for Beatles'")
    print("Type 'quit' to exit.")
    print()
    
    # Initialize music service
    api_key = "AIzaSyCB0N8PNZom2ipR2r1clhQjskbSHL2zxsc"
    music_service = MusicService(youtube_api_key=api_key)
    
    while True:
        try:
            user_input = input("🎵 Enter music command: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("👋 Goodbye!")
                break
            
            if not user_input:
                continue
            
            print(f"\n🔍 Processing: '{user_input}'")
            
            # Check if it's a music request
            if music_service.is_music_request(user_input):
                print("✅ Detected as music request")
                
                # Parse the command
                cmd_type, query, params = music_service.parse_music_command(user_input)
                print(f"📝 Command type: {cmd_type}")
                print(f"📝 Query: '{query}'")
                
                # Process the request
                response = await music_service.process_music_request(user_input)
                
                if response:
                    clean_response = response.replace("MUSIC_RESULT: ", "")
                    print(f"\n🎵 Response:")
                    print(clean_response)
                else:
                    print("❌ No response generated")
            else:
                print("❌ Not detected as music request")
                print("💡 Try commands like 'play [song]', 'search for [artist]', etc.")
            
            print("\n" + "-"*40)
            
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

async def main():
    """Main demo function."""
    print("🎵 NOVA AI MUSIC SYSTEM")
    print("Choose demo mode:")
    print("1. Automated demo (shows predefined examples)")
    print("2. Interactive demo (type your own commands)")
    print("3. Both")
    
    while True:
        try:
            choice = input("\nEnter choice (1, 2, or 3): ").strip()
            
            if choice == "1":
                await demo_music_system()
                break
            elif choice == "2":
                await interactive_demo()
                break
            elif choice == "3":
                await demo_music_system()
                await interactive_demo()
                break
            else:
                print("❌ Invalid choice. Please enter 1, 2, or 3.")
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break

if __name__ == "__main__":
    asyncio.run(main())
