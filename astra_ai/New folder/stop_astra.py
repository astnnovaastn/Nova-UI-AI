"""
Stop all Astra AI processes
"""

import os
import sys
import subprocess

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Run the stop_all_scripts.py script directly
script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                          "astra_ai", "scripts", "stop_all_scripts.py")

if __name__ == "__main__":
    # Stop all Astra AI processes by running the script
    subprocess.call([sys.executable, script_path])