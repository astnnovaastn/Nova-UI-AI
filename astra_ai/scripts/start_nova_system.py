import subprocess
import sys
import os
import time
import json
import psutil
from datetime import datetime

# Add project root to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def clear_files():
    """Clear all temporary files to start fresh."""
    try:
        # Files to clear
        files_to_clear = [
            "output.json", 
            "transcription.json", 
            "ai_responses.json",
            "process_info.json",
            "processed_messages.json"
        ]
        
        for file in files_to_clear:
            if os.path.exists(file):
                os.remove(file)
                print(f"Cleared {file}")
        
        # Create empty files with correct format
        empty_files = {
            "transcription.json": [],
            "output.json": [],
            "ai_responses.json": [],
            "processed_messages.json": []
        }
        
        for filename, initial_data in empty_files.items():
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(initial_data, f, indent=2)
            
        print("Created empty files with correct format")
    except Exception as e:
        print(f"Error clearing files: {str(e)}")

def kill_existing_processes():
    """Kill any existing Nova AI processes."""
    try:
        # Process names to look for
        process_names = ["nova_ai.py", "whisper_speech.py", "text_to_speech.py"]
        
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                # Check if this is a python process
                if proc.info['cmdline'] and len(proc.info['cmdline']) > 1 and 'python' in proc.info['cmdline'][0].lower():
                    # Check if it's running one of our scripts
                    for cmd in proc.info['cmdline']:
                        if any(script in cmd for script in process_names):
                            print(f"Killing existing process: {proc.info['pid']} - {cmd}")
                            proc.terminate()
                            time.sleep(0.5)
                            if proc.is_running():
                                proc.kill()
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
    except Exception as e:
        print(f"Error killing existing processes: {str(e)}")

def check_dependencies():
    """Check and install required dependencies."""
    required_packages = [
        "psutil",
        "mem0",
        "groq",
        "python-dotenv"
    ]
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            print(f"Installing required package: {package}")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])

def start_nova_system():
    """Start the complete Nova AI system with all components."""
    print("=== Starting Nova AI System ===")
    
    # Check dependencies first
    check_dependencies()
    
    # Kill any existing processes
    kill_existing_processes()
    
    # Clear all temporary files
    clear_files()
    
    # Get the project root directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))
    
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
    
    # Start processes in the correct order with proper delays
    processes = {}
    
    # 1. Start AI Voice first (text-to-speech)
    print("\nStarting Text-to-Speech...")
    voice_path = os.path.join(project_root, "astra_ai", "speech", "text_to_speech.py")
    voice_process = subprocess.Popen([python_executable, voice_path],
                                     creationflags=subprocess.CREATE_NEW_CONSOLE)
    processes["voice"] = {
        "pid": voice_process.pid,
        "name": "text_to_speech.py",
        "path": voice_path
    }
    print(f"Text-to-Speech started with PID: {voice_process.pid}")
    
    # Wait for AI Voice to initialize
    time.sleep(2)
    
    # 2. Start Whisper if voice input is selected
    if choice == "2":
        print("\nStarting Speech Recognition...")
        whisper_path = os.path.join(project_root, "astra_ai", "speech", "whisper_speech.py")
        whisper_process = subprocess.Popen([python_executable, whisper_path],
                                         creationflags=subprocess.CREATE_NEW_CONSOLE)
        processes["whisper"] = {
            "pid": whisper_process.pid,
            "name": "whisper_speech.py",
            "path": whisper_path
        }
        print(f"Speech Recognition started with PID: {whisper_process.pid}")
        
        # Wait for Whisper to initialize
        time.sleep(3)
    
    # 3. Start Nova AI last
    print("\nStarting Nova AI...")
    nova_ai_path = os.path.join(project_root, "astra_ai", "core", "nova_ai.py")
    
    # Add voice flag if voice input is selected
    nova_args = [python_executable, nova_ai_path]
    if choice == "2":
        nova_args.append("--voice")
        
    nova_process = subprocess.Popen(nova_args, creationflags=subprocess.CREATE_NEW_CONSOLE)
    processes["nova"] = {
        "pid": nova_process.pid,
        "name": "nova_ai.py",
        "path": nova_ai_path,
        "voice_mode": choice == "2"
    }
    print(f"Nova AI started with PID: {nova_process.pid}")
    
    # Save process information for monitoring
    with open("process_info.json", "w") as f:
        json.dump(processes, f, indent=2)
    
    print("\n=== All components started successfully ===")
    
    if choice == "1":
        print("\nYou've chosen text input mode:")
        print("- Type directly in the Nova AI window")
        print("- The AI's responses will appear in the Nova AI window")
        print("- The AI's responses will also be spoken through the text-to-speech engine")
    else:
        print("\nYou've chosen voice input mode:")
        print("- Speak into your microphone")
        print("- Your speech will be transcribed in the Whisper window")
        print("- The AI's responses will appear in the Nova AI window")
        print("- The AI's responses will also be spoken through the text-to-speech engine")
    
    print("\nIMPORTANT: If any component stops working, run this script again to restart all components.")
    print("To stop all components, press Ctrl+C in this window and then run stop_all_scripts.py")
    
    # Monitor the processes
    try:
        print("\nMonitoring all components. Press Ctrl+C to exit...")
        while True:
            all_running = True
            for key, process_info in processes.items():
                pid = process_info["pid"]
                name = process_info["name"]
                
                try:
                    process = psutil.Process(pid)
                    if not process.is_running():
                        print(f"\nWARNING: {name} (PID: {pid}) has stopped running!")
                        all_running = False
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    print(f"\nWARNING: {name} (PID: {pid}) is no longer running!")
                    all_running = False
            
            if not all_running:
                print("\nOne or more components have stopped running.")
                print("Please restart the system by running this script again.")
                break
                
            time.sleep(5)
    except KeyboardInterrupt:
        print("\nMonitoring stopped by user.")
        print("All components will continue running.")
        print("To stop all components, run stop_all_scripts.py")

if __name__ == "__main__":
    # Start the Nova AI system
    start_nova_system()