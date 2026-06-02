import subprocess
import sys
import os
import time
import json
from datetime import datetime

def start_scripts():
    """
    Start nova ai.py, whisper_speech.py, and Ai vioce.py simultaneously
    with option to choose between text or voice input
    """
    print("Welcome to Nova AI System!")
    
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Command to run python scripts
    python_executable = sys.executable
    
    # Ask user for input preference
    print("\nHow would you like to interact with Nova AI?")
    print("1. Text input (type in terminal)")
    print("2. Voice input (speak using microphone)")
    
    choice = ""
    while choice not in ["1", "2"]:
        choice = input("Enter your choice (1 or 2): ")
        if choice not in ["1", "2"]:
            print("Invalid choice. Please enter 1 or 2.")
    
    # Clear previous conversation files
    try:
        if os.path.exists("output.json"):
            os.remove("output.json")
        if os.path.exists("transcription.json"):
            os.remove("transcription.json")
        # Create empty transcription.json file with correct format
        with open("transcription.json", "w", encoding="utf-8") as f:
            json.dump([], f)
    except Exception as e:
        print(f"Warning: Could not clear previous conversation data: {str(e)}")
    
    # Start the monitoring script with the appropriate mode
    print("\nStarting Nova AI with monitoring to ensure all components stay running...")
    
    # Pass the user's choice to the monitor script
    monitor_path = os.path.join(current_dir, "monitor_scripts.py")
    
    # Use voice_mode parameter based on user choice
    voice_mode = "true" if choice == "2" else "false"
    monitor_process = subprocess.Popen([python_executable, monitor_path, voice_mode],
                                      creationflags=subprocess.CREATE_NEW_CONSOLE)
    
    print(f"\nMonitor script started with process ID: {monitor_process.pid}")
    print("The monitor will ensure all Nova AI components stay running.")
    
    if choice == "1":
        print("\nYou've chosen text input. Type directly in the Nova AI window.")
    else:
        print("\nYou've chosen voice input mode:")
        print("1. Speak into your microphone and Whisper will transcribe your speech")
        print("2. Your speech will be automatically sent to Nova AI")
        print("3. Nova AI will process your speech and respond")
        print("4. The AI's response will be spoken through the text-to-speech engine")
        print("\nIMPORTANT: Look at the Whisper window to see your transcribed speech")
        print("           Look at the Nova AI window to see the AI's responses")
        print("\nNOTE: Nova AI will automatically detect when Whisper has transcribed your speech")
        print("      and will process it without you having to type anything.")
    
    print("\nAll scripts are now running in separate windows.")
    print("The monitor will automatically restart any component that stops.")
    print("To stop all scripts, run stop_all_scripts.py")
    
    try:
        # Keep the main script running
        while True:
            time.sleep(0.1)
    except KeyboardInterrupt:
        print("Main script exited. The monitor will continue running.")
        print("To stop all scripts, run stop_all_scripts.py")

if __name__ == "__main__":
    # Check if psutil is installed
    try:
        import psutil
    except ImportError:
        print("The psutil module is required. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psutil"])
        print("psutil installed successfully. Restarting script...")
        os.execv(sys.executable, [sys.executable] + sys.argv)
    
    start_scripts()