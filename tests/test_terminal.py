import asyncio
import sys
import os

# Add the project root to the path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

async def test_terminal_chat():
    print("Testing terminal chat loop...")
    try:
        from astra_ai.core.nova_ai import AleChatBot
        print("Import successful")
        
        # Initialize the chatbot
        chatbot = AleChatBot()
        print("Chatbot initialized successfully")
        
        # Test the welcome message
        print("Testing welcome message...")
        chatbot.terminal_chat.show_welcome()
        print("Welcome message displayed")
        
        return True
    except Exception as e:
        print(f"Error in terminal chat test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    asyncio.run(test_terminal_chat())