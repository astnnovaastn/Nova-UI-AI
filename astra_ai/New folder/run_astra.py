"""
Main entry point for Astra AI
"""

import os
import sys
import subprocess

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Run the start_nova_system.py script directly
script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                          "astra_ai", "scripts", "start_nova_system.py")

if __name__ == "__main__":
    # Start the Nova AI system by running the script
    subprocess.call([sys.executable, script_path])