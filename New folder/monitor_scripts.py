import subprocess
import sys
import os
import time
import json
import psutil
import signal
from datetime import datetime

def is_process_running(pid):
    """Check if a process with the given PID is running."""
    try:
        process = psutil.Process(pid)
        return process.is_running() and process.status() != psutil.STATUS_ZOMBIE
    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
        return False

def kill_process(pid):
    """Kill a process with the given PID."""
    try:
        process = psutil.Process(pid)
        process.terminate()
        time.sleep(1)
        if process.is_running():
            process.kill()
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        pass

def save_process_info(processes):
    """Save process information to a file."""
    with open("process_info.json", "w") as f:
        json.dump(processes, f)

def load_process_info():
    """Load process information from a file."""
    try:
        with open("process_info.json", "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def clear_files():
    """Clear output.json and transcription.json files."""
    try:
        if os.path.exists("output.json"):
            os.remove("output.json")
            print("Cleared previous output.json data.")
        
        if os.path.exists("transcription.json"):
            os.remove("transcription.json")
            print("Cleared previous transcription.json data.")
            
        # Create an empty transcription.json file with the correct format
        with open("transcription.json", "w", encoding="utf-8") as f:
            json.dump([], f)
            print("Created empty transcription.json file.")
    except Exception as e:
        print(f"Could not clear previous conversation data: {str(e)}")

def start_scripts(voice_mode=True):
    """Start all three scripts and return their process IDs."""
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Command to run python scripts
    python_executable = sys.executable
    
    # Clear files before starting
    clear_files()
    
    processes = {}
    
    # Start Ai_voice.py (text-to-speech) in a new process
    voice_path = os.path.join(current_dir, "Ai vioce.py")
    voice_process = subprocess.Popen([python_executable, voice_path],
                                     creationflags=subprocess.CREATE_NEW_CONSOLE)
    processes["voice"] = {
        "pid": voice_process.pid,
    "name": "Ai vioce.py",
        "path": voice_path,
        "last_restart": datetime.now().isoformat()
    }
    print(f"Started Text-to-Speech with process ID: {voice_process.pid}")
    
    # If voice input is selected, start whisper_speech.py
    if voice_mode:
        whisper_path = os.path.join(current_dir, "whisper_speech.py")
        whisper_process = subprocess.Popen([python_executable, whisper_path],
                                         creationflags=subprocess.CREATE_NEW_CONSOLE)
        processes["whisper"] = {
            "pid": whisper_process.pid,
            "name": "whisper_speech.py",
            "path": whisper_path,
            "last_restart": datetime.now().isoformat()
        }
        print(f"Started voice recognition (Whisper) with process ID: {whisper_process.pid}")
        
        # Give whisper a moment to initialize
        time.sleep(2)
    
    # Start nova ai.py in a new process
    nova_ai_path = os.path.join(current_dir, "nova ai.py")
    
    # Add voice flag if voice input is selected
    nova_args = [python_executable, nova_ai_path]
    if voice_mode:
        nova_args.append("--voice")  # Pass voice flag to Nova AI
        
    nova_process = subprocess.Popen(nova_args, creationflags=subprocess.CREATE_NEW_CONSOLE)
    processes["nova"] = {
        "pid": nova_process.pid,
        "name": "nova ai.py",
        "path": nova_ai_path,
        "voice_mode": voice_mode,
        "last_restart": datetime.now().isoformat()
    }
    print(f"Started Nova AI with process ID: {nova_process.pid}")
    
    # Save process information
    save_process_info(processes)
    
    return processes

def monitor_and_restart(check_interval=5):
    """Monitor all scripts and restart any that have stopped."""
    print("Starting monitoring service...")
    print("This script will ensure all Nova AI components are running.")
    print("Press Ctrl+C to stop monitoring.")
    
    # Load process information if available
    processes = load_process_info()
    
    # If no processes are found, start them
    if not processes:
        print("No running processes found. Starting all scripts...")
        processes = start_scripts()
    
    try:
        while True:
            print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Checking processes...")
            
            # Check each process
            for key, process_info in list(processes.items()):
                pid = process_info.get("pid")
                name = process_info.get("name")
                
                if not is_process_running(pid):
                    print(f"Process {name} (PID: {pid}) is not running. Restarting...")
                    
                    # Kill any zombie processes
                    kill_process(pid)
                    
                    # Clear files before restarting
                    clear_files()
                    
                    # Restart the specific process
                    if key == "voice":
                        voice_path = process_info.get("path")
                        voice_process = subprocess.Popen([python_executable, voice_path],
                                                        creationflags=subprocess.CREATE_NEW_CONSOLE)
                        processes["voice"]["pid"] = voice_process.pid
                        processes["voice"]["last_restart"] = datetime.now().isoformat()
                        print(f"Restarted Text-to-Speech with new process ID: {voice_process.pid}")
                    
                    elif key == "whisper":
                        whisper_path = process_info.get("path")
                        whisper_process = subprocess.Popen([python_executable, whisper_path],
                                                         creationflags=subprocess.CREATE_NEW_CONSOLE)
                        processes["whisper"]["pid"] = whisper_process.pid
                        processes["whisper"]["last_restart"] = datetime.now().isoformat()
                        print(f"Restarted voice recognition (Whisper) with new process ID: {whisper_process.pid}")
                    
                    elif key == "nova":
                        nova_ai_path = process_info.get("path")
                        voice_mode = process_info.get("voice_mode", True)
                        
                        nova_args = [python_executable, nova_ai_path]
                        if voice_mode:
                            nova_args.append("--voice")
                            
                        nova_process = subprocess.Popen(nova_args, creationflags=subprocess.CREATE_NEW_CONSOLE)
                        processes["nova"]["pid"] = nova_process.pid
                        processes["nova"]["last_restart"] = datetime.now().isoformat()
                        print(f"Restarted Nova AI with new process ID: {nova_process.pid}")
                else:
                    print(f"Process {name} (PID: {pid}) is running.")
            
            # Save updated process information
            save_process_info(processes)
            
            # Check if transcription.json exists and is properly formatted
            try:
                if not os.path.exists("transcription.json"):
                    print("transcription.json not found. Creating empty file...")
                    with open("transcription.json", "w", encoding="utf-8") as f:
                        json.dump([], f)
                else:
                    # Verify it's valid JSON
                    with open("transcription.json", "r", encoding="utf-8") as f:
                        try:
                            json.load(f)
                        except json.JSONDecodeError:
                            print("transcription.json is corrupted. Creating new file...")
                            with open("transcription.json", "w", encoding="utf-8") as f:
                                json.dump([], f)
            except Exception as e:
                print(f"Error checking transcription.json: {str(e)}")
            
            # Wait before checking again
            print(f"Next check in {check_interval} seconds...")
            time.sleep(check_interval)
            
    except KeyboardInterrupt:
        print("\nMonitoring stopped by user.")
        print("All processes will continue running.")
        print("To stop all processes, use the stop_all_scripts.py script.")

if __name__ == "__main__":
    # Check if psutil is installed
    try:
        import psutil
    except ImportError:
        print("The psutil module is required. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psutil"])
        print("psutil installed successfully. Restarting script...")
        os.execv(sys.executable, [sys.executable] + sys.argv)
    
    # Check if voice mode parameter is provided
    voice_mode = True  # Default to voice mode
    if len(sys.argv) > 1:
        voice_mode_arg = sys.argv[1].lower()
        voice_mode = voice_mode_arg == "true"
    
    print(f"Starting Nova AI in {'voice' if voice_mode else 'text'} input mode...")
    
    # Start scripts with the specified mode
    processes = start_scripts(voice_mode)
    
    # Start monitoring
    monitor_and_restart()