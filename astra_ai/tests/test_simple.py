import asyncio
import sys
import os
import threading
import time

# Add the project root to the path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

def timeout_function():
    time.sleep(30)
    print("\nTimeout reached. Exiting...")
    os._exit(1)

async def main_test():
    # Start a timeout thread
    timeout_thread = threading.Thread(target=timeout_function, daemon=True)
    timeout_thread.start()
    
    try:
        from astra_ai.core.nova_ai import main
        await main()
    except KeyboardInterrupt:
        print("\nInterrupted by user")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main_test())