import os
import json
import sys
import psutil
import time

def load_process_info():
    """Load process information from a file."""
    try:
        with open("process_info.json", "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def kill_process(pid):
    """Kill a process with the given PID."""
    try:
        process = psutil.Process(pid)
        print(f"Terminating process with PID {pid}...")
        process.terminate()
        
        # Wait for process to terminate
        try:
            process.wait(timeout=3)
        except psutil.TimeoutExpired:
            print(f"Process {pid} did not terminate within timeout, killing forcefully...")
            process.kill()
        
        print(f"Process with PID {pid} has been stopped.")
        return True
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        print(f"Process with PID {pid} not found or access denied.")
        return False

def kill_all_nova_processes():
    """Kill all Nova AI related processes regardless of PID."""
    print("Searching for all Nova AI related processes...")
    
    # Process names to look for
    process_names = ["nova ai.py", "whisper_speech.py", "Ai vioce.py"]
    killed_count = 0
    
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            # Check if this is a python process
            if proc.info['cmdline'] and len(proc.info['cmdline']) > 1 and 'python' in proc.info['cmdline'][0].lower():
                # Check if it's running one of our scripts
                for cmd in proc.info['cmdline']:
                    if any(script in cmd for script in process_names):
                        print(f"Found Nova AI process: {proc.info['pid']} - {cmd}")
                        try:
                            proc.terminate()
                            time.sleep(0.5)
                            if proc.is_running():
                                proc.kill()
                            print(f"Killed process with PID {proc.info['pid']}")
                            killed_count += 1
                        except (psutil.NoSuchProcess, psutil.AccessDenied):
                            print(f"Could not kill process with PID {proc.info['pid']}")
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    
    return killed_count

def stop_all_scripts():
    """Stop all Nova AI scripts."""
    print("Stopping all Nova AI scripts...")
    
    # First try to stop processes from process_info.json
    processes = load_process_info()
    stopped_count = 0
    
    if processes:
        print("Stopping processes from process_info.json...")
        for key, process_info in processes.items():
            pid = process_info.get("pid")
            name = process_info.get("name")
            
            print(f"Stopping {name} (PID: {pid})...")
            success = kill_process(pid)
            
            if success:
                print(f"Successfully stopped {name}.")
                stopped_count += 1
            else:
                print(f"Failed to stop {name}.")
    else:
        print("No process information found in process_info.json.")
    
    # Then try to find and kill any remaining Nova AI processes
    print("\nSearching for any remaining Nova AI processes...")
    killed_count = kill_all_nova_processes()
    
    # Clear process information
    if os.path.exists("process_info.json"):
        os.remove("process_info.json")
        print("Cleared process information.")
    
    total_stopped = stopped_count + killed_count
    if total_stopped > 0:
        print(f"Successfully stopped {total_stopped} Nova AI processes.")
    else:
        print("No Nova AI processes were found running.")
    
    print("All Nova AI scripts have been stopped.")

if __name__ == "__main__":
    # Check if psutil is installed
    try:
        import psutil
    except ImportError:
        print("The psutil module is required. Installing...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psutil"])
        print("psutil installed successfully. Restarting script...")
        os.execv(sys.executable, [sys.executable] + sys.argv)
    
    # Stop all scripts
    stop_all_scripts()