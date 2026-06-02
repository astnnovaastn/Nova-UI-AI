import asyncio
import sys
import os

# Add the project root to the path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

def test_chatbot_initialization():
    print("Testing chatbot initialization...")
    try:
        from astra_ai.core.nova_ai import AleChatBot
        print("Import successful")
        
        # Initialize the chatbot
        chatbot = AleChatBot()
        print("Chatbot initialized successfully")
        print(f"Memory enabled: {chatbot.memory_enabled}")
        print(f"Voice input mode: {chatbot.voice_input_mode}")
        print(f"Mode: {chatbot.mode}")
        
        # Test chat history
        print(f"Chat history length: {len(chatbot.chat_history)}")
        
        return True
    except Exception as e:
        print(f"Error initializing chatbot: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_chatbot_initialization()