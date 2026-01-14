import asyncio
import sys
import os

# Add the project root to the path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

async def test_nova_ai():
    """Test Nova AI with voice service"""
    try:
        from astra_ai.core.nova_ai import main
        print("Starting Nova AI...")
        
        # Run the main function
        await main()
        
    except KeyboardInterrupt:
        print("\nStopping Nova AI...")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("Testing Nova AI with voice service...")
    asyncio.run(test_nova_ai())
    print("Test completed.")