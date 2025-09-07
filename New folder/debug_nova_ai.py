import subprocess
import sys
import os

def debug_nova_ai():
    """Run Nova AI with error output captured to a file."""
    print("Running Nova AI in debug mode...")
    
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Command to run python scripts
    python_executable = sys.executable
    
    # Path to Nova AI script
    nova_ai_path = os.path.join(current_dir, "nova ai.py")
    
    # Run Nova AI with voice flag and redirect output to a file
    with open("nova_ai_debug.log", "w") as log_file:
        try:
            # Run the process and wait for it to complete
            process = subprocess.Popen(
                [python_executable, nova_ai_path, "--voice"],
                stdout=log_file,
                stderr=subprocess.STDOUT,
                text=True
            )
            
            print("Nova AI is running in debug mode. Press Ctrl+C to stop.")
            process.wait()
        except KeyboardInterrupt:
            print("\nStopping debug mode...")
            process.terminate()
    
    print("\nDebug completed. Check nova_ai_debug.log for errors.")

if __name__ == "__main__":
    debug_nova_ai()