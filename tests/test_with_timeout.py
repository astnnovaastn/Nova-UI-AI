import asyncio
import sys
import os
import signal

# Add the project root to the path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

def timeout_handler(signum, frame):
    print("\nTimeout reached. Exiting...")
    sys.exit(0)

async def main_with_timeout():
    # Set a timeout of 30 seconds
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(30)
    
    try:
        from astra_ai.core.nova_ai import main
        await main()
    except KeyboardInterrupt:
        print("\nInterrupted by user")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        signal.alarm(0)  # Cancel the alarm

if __name__ == "__main__":
    asyncio.run(main_with_timeout())