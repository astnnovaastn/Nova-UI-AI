import asyncio
import sys
import os

# Add the project root to the path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Redirect stdout to see if there's any output
class OutputCapture:
    def __init__(self):
        self.output = []
        
    def write(self, text):
        self.output.append(text)
        # Also write to the original stdout
        sys.__stdout__.write(text)
        sys.__stdout__.flush()
        
    def flush(self):
        sys.__stdout__.flush()

async def test_full_application():
    print("Testing full Nova AI application...")
    try:
        # Capture output
        capture = OutputCapture()
        sys.stdout = capture
        
        from astra_ai.core.nova_ai import main
        
        # Mock command line arguments
        sys.argv = [sys.argv[0]]
        
        print("Starting Nova AI...")
        await main()
        
        print("Application finished")
        print("Captured output:")
        for line in capture.output:
            print(repr(line))
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Restore stdout
        sys.stdout = sys.__stdout__

if __name__ == "__main__":
    asyncio.run(test_full_application())