
import sys
import os
import asyncio

# Adjust path to import nova_ai
current_dir = os.path.dirname(os.path.abspath(__file__))
core_dir = os.path.join(current_dir, 'astra_ai', 'core')
sys.path.append(current_dir)
sys.path.append(core_dir)

try:
    from astra_ai.core.nova_ai import AleChatBot
    chatbot = AleChatBot()
    methods = [m for m in dir(chatbot) if not m.startswith('__')]
    print("Public Attributes/Methods:")
    for m in methods:
        print(m)

except Exception as e:
    print(f"Error: {e}")
