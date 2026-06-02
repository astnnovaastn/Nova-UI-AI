import os
import sys
import subprocess

# Add current directory to path
sys.path.append(os.getcwd())

def run_stt():
    print("Starting Groq Live STT...")
    venv_python = os.path.join(os.getcwd(), ".venv-1", "Scripts", "python.exe")
    if not os.path.exists(venv_python):
        venv_python = "python" # Fallback
    
    script_path = os.path.join("astra_ai", "speech", "groq_live_stt.py")
    
    try:
        subprocess.run([venv_python, script_path], check=True)
    except KeyboardInterrupt:
        print("\nSTT stopped.")
    except Exception as e:
        print(f"Error running STT: {e}")

if __name__ == "__main__":
    run_stt()
