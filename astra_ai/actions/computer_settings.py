#computer_settings.py
import re
import sys
import time
import subprocess
import platform
import shutil
from pathlib import Path

try:
    import pyautogui
    pyautogui.FAILSAFE = True
    pyautogui.PAUSE    = 0.05
    _PYAUTOGUI = True
except (ImportError, Exception):
    pyautogui = None
    _PYAUTOGUI = False

try:
    import pyperclip
    _PYPERCLIP = True
except (ImportError, Exception):
    pyperclip = None
    _PYPERCLIP = False

try:
    import screen_brightness_control as sbc
    _SBC = True
except (ImportError, Exception):
    sbc = None
    _SBC = False

_OS = platform.system()  # "Windows" | "Darwin" | "Linux"


def _get_base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent
    return Path(__file__).resolve().parent.parent

def _get_macos_wifi_interface() -> str:
    try:
        result = subprocess.run(
            ["networksetup", "-listallhardwareports"],
            capture_output=True, text=True, timeout=5
        )
        lines = result.stdout.splitlines()
        for i, line in enumerate(lines):
            if "Wi-Fi" in line or "AirPort" in line:
                for j in range(i, min(i + 4, len(lines))):
                    if lines[j].startswith("Device:"):
                        return lines[j].split(":", 1)[1].strip()
    except Exception:
        pass
    return "en0"


def open_app(app_name: str = ""):
    if not app_name:
        return "No app was specified to open. Please tell me which app you want."
    
    # Special handling for system tools
    name_lower = app_name.lower()
    if "task manager" in name_lower or "taskmgr" in name_lower:
        return open_task_manager()
    if "setting" in name_lower or "preferences" in name_lower:
        return open_system_settings()
    if "explorer" in name_lower or "file manager" in name_lower or "file" in name_lower:
        return open_file_explorer()
    if "desktop" in name_lower:
        return show_desktop()

    try:
        if _OS == "Windows":
            # Try start button search if pyautogui is available
            if _PYAUTOGUI:
                pyautogui.press("win")
                time.sleep(0.5)
                pyautogui.write(app_name, interval=0.05)
                time.sleep(0.5)
                pyautogui.press("enter")
                return f"Searching and opening {app_name} via Start menu."
            else:
                subprocess.Popen(["start", "", app_name], shell=True)
        elif _OS == "Darwin":
            subprocess.Popen(["open", "-a", app_name])
        else:
            subprocess.Popen([app_name], shell=False)
        return f"Opening {app_name}."
    except Exception as e:
        return f"Unable to open '{app_name}': {e}"


def toggle_bluetooth(state: str = None):
    if _OS == "Darwin":
        return "Bluetooth control is not supported on this system build."
    if _OS == "Windows":
        return "Bluetooth control is not available without extra permissions."
    return "Bluetooth control is not supported on this platform."

def volume_up():
    try:
        if _OS == "Windows":
            if _PYAUTOGUI:
                for _ in range(5):
                    pyautogui.press("volumeup")
                return "Volume increased."
            else:
                return "Cannot adjust volume: pyautogui not available."
        elif _OS == "Darwin":
            subprocess.run(["osascript", "-e",
                "set volume output volume (output volume of (get volume settings) + 10)"],
                capture_output=True, timeout=5)
            return "Volume increased."
        else:
            subprocess.run(["pactl", "set-sink-volume", "@DEFAULT_SINK@", "+10%"],
                capture_output=True, timeout=5)
            return "Volume increased."
    except Exception as e:
        print(f"[Settings] volume_up error: {e}")
        return f"Volume adjustment failed: {e}"

def volume_down():
    try:
        if _OS == "Windows":
            if _PYAUTOGUI:
                for _ in range(5): 
                    pyautogui.press("volumedown")
                return "Volume decreased."
            else:
                return "Cannot adjust volume: pyautogui not available."
        elif _OS == "Darwin":
            subprocess.run(["osascript", "-e",
                "set volume output volume (output volume of (get volume settings) - 10)"],
                capture_output=True, timeout=5)
            return "Volume decreased."
        else:
            subprocess.run(["pactl", "set-sink-volume", "@DEFAULT_SINK@", "-10%"],
                capture_output=True, timeout=5)
            return "Volume decreased."
    except Exception as e:
        print(f"[Settings] volume_down error: {e}")
        return f"Volume adjustment failed: {e}"

def volume_mute():
    try:
        if _OS == "Windows":
            if _PYAUTOGUI:
                pyautogui.press("volumemute")
                return "Volume muted/unmuted."
            else:
                return "Cannot mute: pyautogui not available."
        elif _OS == "Darwin":
            subprocess.run(["osascript", "-e", "set volume with output muted"],
                capture_output=True, timeout=5)
            return "Volume muted/unmuted."
        else:
            subprocess.run(["pactl", "set-sink-mute", "@DEFAULT_SINK@", "toggle"],
                capture_output=True, timeout=5)
            return "Volume muted/unmuted."
    except Exception as e:
        print(f"[Settings] volume_mute error: {e}")
        return f"Mute failed: {e}"

def volume_set(value: int):
    value = max(0, min(100, int(value)))
    if _OS == "Windows":
        try:
            import math
            import comtypes
            from ctypes import cast, POINTER
            from comtypes import CLSCTX_ALL
            from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
            
            comtypes.CoInitialize()
            devices   = AudioUtilities.GetSpeakers()
            interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
            vol       = cast(interface, POINTER(IAudioEndpointVolume))
            # SetMasterVolumeLevelScalar handles 0.0 to 1.0 range
            vol.SetMasterVolumeLevelScalar(value / 100.0, None)
            return f"Volume set to {value}%."
        except Exception as e:
            print(f"[Settings] volume_set failed: {e}")
            if _PYAUTOGUI:
                pyautogui.press("volumemute")
                return f"Tried to set volume to {value}%, but it failed: {e}. Toggled mute instead."
            return f"Failed to set volume: {e}"
    elif _OS == "Darwin":
        subprocess.run(["osascript", "-e", f"set volume output volume {value}"],
            capture_output=True)
        return f"Volume set to {value}%."
    else:
        subprocess.run(["pactl", "set-sink-volume", "@DEFAULT_SINK@", f"{value}%"],
            capture_output=True)
        return f"Volume set to {value}%."

def brightness_up():
    if _SBC:
        try:
            current = sbc.get_brightness()[0]
            sbc.set_brightness(min(100, current + 10))
            return "Brightness increased."
        except Exception:
            pass
            
    if _OS == "Darwin":
        subprocess.run(["osascript", "-e",
            'tell application "System Events" to key code 144'],
            capture_output=True)
    elif _OS == "Linux":
        if subprocess.run(["which", "brightnessctl"],
                capture_output=True).returncode == 0:
            subprocess.run(["brightnessctl", "set", "+10%"], capture_output=True)
        else:
            subprocess.run(
                'xrandr --output $(xrandr | grep " connected" | head -1 | cut -d " " -f1)'
                ' --brightness $(python3 -c "import subprocess; '
                'b=float(subprocess.check_output([\"xrandr\",\"--verbose\"]).decode()'
                '.split(\"Brightness:\")[1].split()[0]); print(min(1.0,b+0.1))")',
                shell=True, capture_output=True
            )
    else:
        try:
            subprocess.run(
                ["powershell", "-Command",
                 "(Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightnessMethods)"
                 ".WmiSetBrightness(1, [math]::Min(100, "
                 "(Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightness).CurrentBrightness + 10))"],
                capture_output=True, timeout=5
            )
        except Exception as e:
            print(f"[Settings] Brightness up failed on Windows: {e}")
    return "Brightness increased."

def brightness_down():
    if _SBC:
        try:
            current = sbc.get_brightness()[0]
            sbc.set_brightness(max(0, current - 10))
            return "Brightness decreased."
        except Exception:
            pass

    if _OS == "Darwin":
        subprocess.run(["osascript", "-e",
            'tell application "System Events" to key code 145'],
            capture_output=True)
    elif _OS == "Linux":
        if subprocess.run(["which", "brightnessctl"],
                capture_output=True).returncode == 0:
            subprocess.run(["brightnessctl", "set", "10%-"], capture_output=True)
        else:
            subprocess.run(
                'xrandr --output $(xrandr | grep " connected" | head -1 | cut -d " " -f1)'
                ' --brightness $(python3 -c "import subprocess; '
                'b=float(subprocess.check_output([\"xrandr\",\"--verbose\"]).decode()'
                '.split(\"Brightness:\")[1].split()[0]); print(max(0.1,b-0.1))")',
                shell=True, capture_output=True
            )
    else:
        try:
            subprocess.run(
                ["powershell", "-Command",
                 "(Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightnessMethods)"
                 ".WmiSetBrightness(1, [math]::Max(0, "
                 "(Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightness).CurrentBrightness - 10))"],
                capture_output=True, timeout=5
            )
        except Exception as e:
            print(f"[Settings] Brightness down failed on Windows: {e}")
    return "Brightness decreased."

def brightness_set(value: int):
    value = max(0, min(100, int(value)))
    
    if _SBC:
        try:
            sbc.set_brightness(value)
            return f"Brightness set to {value}%."
        except Exception:
            pass

    if _OS == "Windows":
        try:
            subprocess.run(
                ["powershell", "-Command",
                 f"(Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, {value})"],
                capture_output=True, timeout=5
            )
            return f"Brightness set to {value}%."
        except Exception as e:
            return f"Brightness set failed: {e}"
    elif _OS == "Darwin":
        # Approximate mapping for MacOS
        subprocess.run(["osascript", "-e", f"tell application \"System Events\" to repeat {value // 10} times \n key code 144 \n end repeat"],
            capture_output=True)
        return f"Brightness adjusted towards {value}%."
    else:
        if subprocess.run(["which", "brightnessctl"], capture_output=True).returncode == 0:
            subprocess.run(["brightnessctl", "set", f"{value}%"], capture_output=True)
            return f"Brightness set to {value}%."
        return "Brightness control not supported on this Linux setup."

def close_app():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "q")
                return "Closed app."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("alt", "f4")
                return "Closed app."
        return "Cannot close app: pyautogui not available."
    except Exception as e:
        return f"Failed to close app: {e}"

def close_window():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "w")
                return "Closed window."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "w")
                return "Closed window."
        return "Cannot close window: pyautogui not available."
    except Exception as e:
        return f"Failed to close window: {e}"

def full_screen():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "command", "f")
                return "Toggled fullscreen."
        else:
            if _PYAUTOGUI:
                pyautogui.press("f11")
                return "Toggled fullscreen."
        return "Cannot toggle fullscreen: pyautogui not available."
    except Exception as e:
        return f"Failed to toggle fullscreen: {e}"

def minimize_window():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "m")
                return "Minimized window."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("win", "down")
                return "Minimized window."
        return "Cannot minimize window: pyautogui not available."
    except Exception as e:
        return f"Failed to minimize window: {e}"

def maximize_window():
    try:
        if _OS == "Darwin":
            subprocess.run(["osascript", "-e",
                'tell application "System Events" to keystroke "f" '
                'using {control down, command down}'],
                capture_output=True, timeout=5)
            return "Maximized window."
        elif _OS == "Windows":
            if _PYAUTOGUI:
                pyautogui.hotkey("win", "up")
                return "Maximized window."
        else:
            try:
                subprocess.run(["wmctrl", "-r", ":ACTIVE:", "-b", "add,maximized_vert,maximized_horz"],
                    capture_output=True, timeout=5)
                return "Maximized window."
            except Exception:
                if _PYAUTOGUI:
                    pyautogui.hotkey("super", "up")
                    return "Maximized window."
        return "Cannot maximize window: pyautogui not available."
    except Exception as e:
        return f"Failed to maximize window: {e}"

def snap_left():
    try:
        if _OS == "Windows":
            if _PYAUTOGUI:
                pyautogui.hotkey("win", "left")
                return "Snapped left."
        elif _OS == "Linux":
            try:
                subprocess.run(["wmctrl", "-r", ":ACTIVE:", "-e", "0,0,0,960,1080"],
                    capture_output=True, timeout=5)
                return "Snapped left."
            except Exception:
                pass
        return "Snap left not supported or pyautogui unavailable."
    except Exception as e:
        return f"Failed to snap left: {e}"

def snap_right():
    try:
        if _OS == "Windows":
            if _PYAUTOGUI:
                pyautogui.hotkey("win", "right")
                return "Snapped right."
        elif _OS == "Linux":
            try:
                subprocess.run(["wmctrl", "-r", ":ACTIVE:", "-e", "0,960,0,960,1080"],
                    capture_output=True, timeout=5)
                return "Snapped right."
            except Exception:
                pass
        return "Snap right not supported or pyautogui unavailable."
    except Exception as e:
        return f"Failed to snap right: {e}"

def switch_window():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "tab")
                return "Switched window."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("alt", "tab")
                return "Switched window."
        return "Cannot switch window: pyautogui not available."
    except Exception as e:
        return f"Failed to switch window: {e}"

def show_desktop():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("fn", "f11")
                return "Showing desktop."
        elif _OS == "Windows":
            if _PYAUTOGUI:
                pyautogui.hotkey("win", "d")
                return "Showing desktop."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("super", "d")
                return "Showing desktop."
        return "Cannot show desktop: pyautogui not available."
    except Exception as e:
        return f"Failed to show desktop: {e}"

def open_task_manager():
    if _OS == "Windows":
        try:
            subprocess.Popen(["taskmgr"], shell=False)
            return "Task Manager opened."
        except Exception:
            pass
        if _PYAUTOGUI:
            pyautogui.hotkey("ctrl", "shift", "esc")
            return "Task Manager opened via shortcut."
        return "Could not open Task Manager."
    elif _OS == "Darwin":
        subprocess.Popen(["open", "-a", "Activity Monitor"])
        return "Activity Monitor opened."
    else:
        for cmd in [["gnome-system-monitor"], ["xfce4-taskmanager"], ["htop"]]:
            if subprocess.run(["which", cmd[0]], capture_output=True).returncode == 0:
                subprocess.Popen(cmd)
                return f"{cmd[0]} opened."
        return "System monitor not found."


def focus_search():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "l")
                return "Focused search bar."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "l")
                return "Focused search bar."
        return "Cannot focus search: pyautogui not available."
    except Exception as e:
        return f"Failed to focus search: {e}"

def pause_video():
    try:
        if _PYAUTOGUI:
            pyautogui.press("space")
            return "Toggled play/pause."
        return "Cannot pause video: pyautogui not available."
    except Exception as e:
        return f"Failed to toggle play/pause: {e}"

def refresh_page():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "r")
                return "Page refreshed."
        else:
            if _PYAUTOGUI:
                pyautogui.press("f5")
                return "Page refreshed."
        return "Cannot refresh page: pyautogui not available."
    except Exception as e:
        return f"Failed to refresh page: {e}"

def close_tab():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "w")
                return "Tab closed."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "w")
                return "Tab closed."
        return "Cannot close tab: pyautogui not available."
    except Exception as e:
        return f"Failed to close tab: {e}"

def new_tab():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "t")
                return "New tab opened."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "t")
                return "New tab opened."
        return "Cannot open new tab: pyautogui not available."
    except Exception as e:
        return f"Failed to open new tab: {e}"

def next_tab():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "shift", "bracketright")
                return "Next tab."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "tab")
                return "Next tab."
        return "Cannot go to next tab: pyautogui not available."
    except Exception as e:
        return f"Failed to go to next tab: {e}"

def prev_tab():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "shift", "bracketleft")
                return "Previous tab."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "shift", "tab")
                return "Previous tab."
        return "Cannot go to previous tab: pyautogui not available."
    except Exception as e:
        return f"Failed to go to previous tab: {e}"

def go_back():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "left")
                return "Navigated back."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("alt", "left")
                return "Navigated back."
        return "Cannot go back: pyautogui not available."
    except Exception as e:
        return f"Failed to go back: {e}"

def go_forward():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "right")
                return "Navigated forward."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("alt", "right")
                return "Navigated forward."
        return "Cannot go forward: pyautogui not available."
    except Exception as e:
        return f"Failed to go forward: {e}"

def zoom_in():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "equal")
                return "Zoomed in."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "equal")
                return "Zoomed in."
        return "Cannot zoom in: pyautogui not available."
    except Exception as e:
        return f"Failed to zoom in: {e}"

def zoom_out():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "minus")
                return "Zoomed out."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "minus")
                return "Zoomed out."
        return "Cannot zoom out: pyautogui not available."
    except Exception as e:
        return f"Failed to zoom out: {e}"

def zoom_reset():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "0")
                return "Zoom reset."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "0")
                return "Zoom reset."
        return "Cannot reset zoom: pyautogui not available."
    except Exception as e:
        return f"Failed to reset zoom: {e}"

def find_on_page():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "f")
                return "Find on page opened."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "f")
                return "Find on page opened."
        return "Cannot open find dialog: pyautogui not available."
    except Exception as e:
        return f"Failed to open find dialog: {e}"

def reload_page_n(n: int):
    for _ in range(max(1, n)):
        refresh_page()
        time.sleep(0.8)
    return f"Reloaded {n} times."


def scroll_up(amount: int = 500):
    try:
        if _PYAUTOGUI:
            pyautogui.scroll(amount)
            return f"Scrolled up by {amount} pixels."
        return "Cannot scroll: pyautogui not available."
    except Exception as e:
        return f"Failed to scroll up: {e}"

def scroll_down(amount: int = 500):
    try:
        if _PYAUTOGUI:
            pyautogui.scroll(-amount)
            return f"Scrolled down by {amount} pixels."
        return "Cannot scroll: pyautogui not available."
    except Exception as e:
        return f"Failed to scroll down: {e}"

def scroll_top():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "up")
                return "Scrolled to top."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "home")
                return "Scrolled to top."
        return "Cannot scroll to top: pyautogui not available."
    except Exception as e:
        return f"Failed to scroll to top: {e}"

def scroll_bottom():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "down")
                return "Scrolled to bottom."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "end")
                return "Scrolled to bottom."
        return "Cannot scroll to bottom: pyautogui not available."
    except Exception as e:
        return f"Failed to scroll to bottom: {e}"

def page_up():
    try:
        if _PYAUTOGUI:
            pyautogui.press("pageup")
            return "Page up."
        return "Cannot go page up: pyautogui not available."
    except Exception as e:
        return f"Failed to go page up: {e}"

def page_down():
    try:
        if _PYAUTOGUI:
            pyautogui.press("pagedown")
            return "Page down."
        return "Cannot go page down: pyautogui not available."
    except Exception as e:
        return f"Failed to go page down: {e}"


def copy():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "c")
                return "Copied to clipboard."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "c")
                return "Copied to clipboard."
        return "Cannot copy: pyautogui not available."
    except Exception as e:
        return f"Failed to copy: {e}"

def paste():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "v")
                return "Pasted from clipboard."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "v")
                return "Pasted from clipboard."
        return "Cannot paste: pyautogui not available."
    except Exception as e:
        return f"Failed to paste: {e}"

def cut():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "x")
                return "Cut to clipboard."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "x")
                return "Cut to clipboard."
        return "Cannot cut: pyautogui not available."
    except Exception as e:
        return f"Failed to cut: {e}"

def undo():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "z")
                return "Undone last action."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "z")
                return "Undone last action."
        return "Cannot undo: pyautogui not available."
    except Exception as e:
        return f"Failed to undo: {e}"

def redo():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "shift", "z")
                return "Redone action."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "y")
                return "Redone action."
        return "Cannot redo: pyautogui not available."
    except Exception as e:
        return f"Failed to redo: {e}"

def select_all():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "a")
                return "Selected all."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "a")
                return "Selected all."
        return "Cannot select all: pyautogui not available."
    except Exception as e:
        return f"Failed to select all: {e}"

def save_file():
    try:
        if _OS == "Darwin":
            if _PYAUTOGUI:
                pyautogui.hotkey("command", "s")
                return "File saved."
        else:
            if _PYAUTOGUI:
                pyautogui.hotkey("ctrl", "s")
                return "File saved."
        return "Cannot save: pyautogui not available."
    except Exception as e:
        return f"Failed to save: {e}"

def press_enter():
    try:
        if _PYAUTOGUI:
            pyautogui.press("enter")
            return "Enter key pressed."
        return "Cannot press enter: pyautogui not available."
    except Exception as e:
        return f"Failed to press enter: {e}"

def press_escape():
    try:
        if _PYAUTOGUI:
            pyautogui.press("escape")
            return "Escape key pressed."
        return "Cannot press escape: pyautogui not available."
    except Exception as e:
        return f"Failed to press escape: {e}"

def press_key(key: str):
    try:
        if not key:
            return "No key specified."
        if _PYAUTOGUI:
            pyautogui.press(key)
            return f"Key '{key}' pressed."
        return f"Cannot press key: pyautogui not available."
    except Exception as e:
        return f"Failed to press key '{key}': {e}"

def type_text(text: str, press_enter_after: bool = False):
    try:
        if not text:
            return "No text to type."
        if _PYPERCLIP and _PYAUTOGUI:
            pyperclip.copy(str(text))
            time.sleep(0.15)
            paste()
            if press_enter_after:
                time.sleep(0.1)
                pyautogui.press("enter")
            return f"Typed: {text[:50]}..."
        elif _PYAUTOGUI:
            pyautogui.write(str(text), interval=0.03)
            if press_enter_after:
                time.sleep(0.1)
            pyautogui.press("enter")
            return f"Typed: {text[:50]}..."
        else:
            return "Cannot type: pyautogui/pyperclip not available."
    except Exception as e:
        return f"Failed to type text: {e}"

def take_screenshot():
    try:
        save_dir = Path.home() / "Pictures" / "Screenshots"
        save_dir.mkdir(parents=True, exist_ok=True)
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        filename = f"screenshot_{timestamp}.png"
        filepath = save_dir / filename
        
        if _PYAUTOGUI:
            screenshot = pyautogui.screenshot()
            screenshot.save(filepath)
            # Trigger Snipping Tool for visual feedback on Windows if desired
            if _OS == "Windows":
                 # Using Win+Shift+S is interactive, but we already saved the file.
                 # Let's just return the success message.
                 pass
            return f"Screenshot saved to {filepath}"
        
        if _OS == "Windows":
            subprocess.run(["powershell", "-Command", "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{PRTSC}')"], capture_output=True)
            return "Screenshot triggered (PrintScreen)."
        elif _OS == "Darwin":
            subprocess.run(["screencapture", str(filepath)], capture_output=True)
            return f"Screenshot saved to {filepath}"
        else:
            for cmd in [["scrot", str(filepath)], ["gnome-screenshot", "-f", str(filepath)]]:
                if shutil.which(cmd[0]):
                    subprocess.run(cmd, capture_output=True)
                    return f"Screenshot saved to {filepath}"
        return "Screenshot tool opened."
    except Exception as e:
        return f"Failed to take screenshot: {e}"

def lock_screen():
    try:
        if _OS == "Windows":
            import ctypes
            ctypes.windll.user32.LockWorkStation()
            return "PC locked."
        elif _OS == "Darwin":
            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke "q" using {control down, command down}'], capture_output=True)
            return "Mac locked."
        else:
            for cmd in [["xdg-screensaver", "lock"], ["loginctl", "lock-session"]]:
                if shutil.which(cmd[0]):
                    subprocess.run(cmd, capture_output=True)
                    return "Screen locked."
        return "Could not lock screen."
    except Exception as e:
        return f"Failed to lock screen: {e}"

def sleep_pc():
    try:
        if _OS == "Windows":
            # 0, 1, 0 means Suspend (Sleep)
            subprocess.run(["powershell", "-Command", "Add-Type -Assembly 'System.Windows.Forms'; [System.Windows.Forms.Application]::SetSuspendState([System.Windows.Forms.PowerState]::Suspend, $false, $false)"], capture_output=True)
            return "PC put to sleep."
        elif _OS == "Darwin":
            subprocess.run(["osascript", "-e", 'tell application "System Events" to sleep'], capture_output=True)
            return "Mac put to sleep."
        else:
            subprocess.run(["systemctl", "suspend"], capture_output=True)
            return "System suspended."
    except Exception as e:
        return f"Failed to sleep PC: {e}"

def sleep_display():
    try:
        if _OS == "Windows":
            import ctypes
            # 0xFFFF = HWND_BROADCAST, 0x0112 = WM_SYSCOMMAND, 0xF170 = SC_MONITORPOWER, 2 = Power Off
            ctypes.windll.user32.SendMessageW(0xFFFF, 0x0112, 0xF170, 2)
            return "Display put to sleep."
        elif _OS == "Darwin":
            subprocess.run(["pmset", "displaysleepnow"], capture_output=True)
            return "Display put to sleep."
        else:
            subprocess.run(["xset", "dpms", "force", "off"], capture_output=True)
            return "Display off."
    except Exception as e:
        return f"Failed to sleep display: {e}"

def open_system_settings():
    try:
        if _OS == "Windows":
            subprocess.run(["start", "ms-settings:"], shell=True, check=False)
            return "Settings opened."
        elif _OS == "Darwin":
            subprocess.Popen(["open", "-a", "System Preferences"])
            return "System Preferences opened."
        else:
            for cmd in [["gnome-control-center"], ["xfce4-settings-manager"]]:
                if shutil.which(cmd[0]):
                    subprocess.Popen(cmd)
                    return "Settings opened."
        return "Could not open system settings."
    except Exception as e:
        return f"Failed to open settings: {e}"

def open_file_explorer():
    try:
        if _OS == "Windows":
            subprocess.Popen(["explorer.exe", str(Path.home())], shell=False)
            return "File Explorer opened."
        elif _OS == "Darwin":
            subprocess.Popen(["open", str(Path.home())])
            return "Finder opened."
        else:
            subprocess.Popen(["xdg-open", str(Path.home())])
            return "File manager opened."
    except Exception as e:
        return f"Failed to open file manager: {e}"

def dark_mode():
    try:
        if _OS == "Windows":
            import winreg
            key_path = r"SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize"
            reg_key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_ALL_ACCESS)
            current_value, _ = winreg.QueryValueEx(reg_key, "AppsUseLightTheme")
            new_value = 0 if current_value == 1 else 1
            winreg.SetValueEx(reg_key, "AppsUseLightTheme", 0, winreg.REG_DWORD, new_value)
            winreg.SetValueEx(reg_key, "SystemUsesLightTheme", 0, winreg.REG_DWORD, new_value)
            winreg.CloseKey(reg_key)
            return f"Dark mode {'enabled' if new_value == 0 else 'disabled'}."
        elif _OS == "Darwin":
            subprocess.run(["osascript", "-e", 'tell application "System Events" to tell appearance preferences to set dark mode to not dark mode'], capture_output=True)
            return "Toggled dark mode."
        else:
            return "Dark mode toggle not supported on this Linux setup."
    except Exception as e:
        return f"Failed to toggle dark mode: {e}"

def toggle_wifi():
    try:
        if _OS == "Darwin":
            iface = _get_macos_wifi_interface()
            result = subprocess.run(["networksetup", "-getairportpower", iface], capture_output=True, text=True)
            state = "off" if "On" in result.stdout else "on"
            subprocess.run(["networksetup", "-setairportpower", iface, state], capture_output=True)
            return "WiFi toggled."
        elif _OS == "Windows":
            subprocess.run(["powershell", "-Command", "$adapter = Get-NetAdapter | Where-Object {$_.PhysicalMediaType -eq 'Native 802.11'}; if ($adapter.Status -eq 'Up') { Disable-NetAdapter -Name $adapter.Name -Confirm:$false } else { Enable-NetAdapter -Name $adapter.Name -Confirm:$false }"], capture_output=True)
            return "WiFi toggled."
        else:
            result = subprocess.run(["nmcli", "radio", "wifi"], capture_output=True, text=True)
            state  = "off" if "enabled" in result.stdout else "on"
            subprocess.run(["nmcli", "radio", "wifi", state], capture_output=True)
            return "WiFi toggled."
    except Exception as e:
        return f"Failed to toggle WiFi: {e}"

def restart_computer():
    try:
        if _OS == "Windows":
            subprocess.run(["shutdown", "/r", "/t", "10"], capture_output=True)
        elif _OS == "Darwin":
            subprocess.run(["osascript", "-e", 'tell application "System Events" to restart'], capture_output=True)
        else:
            subprocess.run(["systemctl", "reboot"], capture_output=True)
        return "PC restarting in 10 seconds."
    except Exception as e:
        return f"Failed to restart: {e}"

def shutdown_computer():
    try:
        if _OS == "Windows":
            subprocess.run(["shutdown", "/s", "/t", "10"], capture_output=True)
        elif _OS == "Darwin":
            subprocess.run(["osascript", "-e", 'tell application "System Events" to shut down'], capture_output=True)
        else:
            subprocess.run(["systemctl", "poweroff"], capture_output=True)
        return "PC shutting down in 10 seconds."
    except Exception as e:
        return f"Failed to shutdown: {e}"

ACTION_MAP: dict[str, callable] = {
    "volume_up":           volume_up,
    "volume_down":         volume_down,
    "mute":                volume_mute,
    "unmute":              volume_mute,
    "toggle_mute":         volume_mute,
    "brightness_up":       brightness_up,
    "brightness_down":     brightness_down,
    "sleep_display":       sleep_display,
    "screen_off":          sleep_display,
    "sleep_pc":            sleep_pc,
    "sleep":               sleep_pc,
    "pause_video":         pause_video,
    "play_pause":          pause_video,
    "close_app":           close_app,
    "close_window":        close_window,
    "full_screen":         full_screen,
    "fullscreen":          full_screen,
    "minimize":            minimize_window,
    "maximize":            maximize_window,
    "snap_left":           snap_left,
    "snap_right":          snap_right,
    "switch_window":       switch_window,
    "show_desktop":        show_desktop,
    "task_manager":        open_task_manager,
    "focus_search":        focus_search,
    "refresh_page":        refresh_page,
    "reload":              refresh_page,
    "close_tab":           close_tab,
    "new_tab":             new_tab,
    "next_tab":            next_tab,
    "prev_tab":            prev_tab,
    "go_back":             go_back,
    "go_forward":          go_forward,
    "zoom_in":             zoom_in,
    "zoom_out":            zoom_out,
    "zoom_reset":          zoom_reset,
    "find_on_page":        find_on_page,
    "scroll_up":           scroll_up,
    "scroll_down":         scroll_down,
    "scroll_top":          scroll_top,
    "scroll_bottom":       scroll_bottom,
    "page_up":             page_up,
    "page_down":           page_down,
    "copy":                copy,
    "paste":               paste,
    "cut":                 cut,
    "undo":                undo,
    "redo":                redo,
    "select_all":          select_all,
    "save":                save_file,
    "enter":               press_enter,
    "escape":              press_escape,
    "screenshot":          take_screenshot,
    "lock_screen":         lock_screen,
    "lock":                lock_screen,
    "open_settings":       open_system_settings,
    "file_explorer":       open_file_explorer,
    "open_run":            open_run,
    "dark_mode":           dark_mode,
    "toggle_wifi":         toggle_wifi,
    "toggle_bluetooth":    toggle_bluetooth,
    "open_app":            open_app,
    "restart":             restart_computer,
    "shutdown":            shutdown_computer,
}

_DANGEROUS_ACTIONS = {"restart", "shutdown"}

def computer_settings(
    parameters: dict = None,
    response=None,
    player=None,
    session_memory=None,
) -> str:
    params      = parameters or {}
    raw_action  = params.get("action", "").strip()
    description = params.get("description", "").strip()
    value       = params.get("value", None)

    action = raw_action.lower().strip().replace(" ", "_").replace("-", "_")

    if not action:
        return "No action could be determined. Please specify an action."

    print(f"[Settings] Action: {action}  Value: {value}  OS: {_OS}")
    if player:
        player.write_log(f"[Settings] {action}")

    if action in _DANGEROUS_ACTIONS:
        confirmed = str(params.get("confirmed", "")).lower()
        if confirmed not in ("yes", "true", "1", "confirm"):
            return (
                f"This will {action} the computer. "
                f"Please confirm by calling again with confirmed=yes."
            )

    if action == "volume_set":
        try:
            return volume_set(int(value or 50))
        except (ValueError, TypeError) as e:
            return f"Could not set volume: invalid value. {e}"

    if action == "brightness_set":
        try:
            return brightness_set(int(value or 50))
        except (ValueError, TypeError) as e:
            return f"Could not set brightness: invalid value. {e}"

    if action in ("type_text", "write_on_screen", "type", "write"):
        text = str(value or params.get("text", "")).strip()
        if not text:
            return "No text provided to type."
        enter_after = str(params.get("press_enter", "false")).lower() in ("true", "1", "yes")
        return type_text(text, press_enter_after=enter_after)

    if action == "press_key":
        key = str(value or params.get("key", "")).strip()
        if not key:
            return "No key specified."
        return press_key(key)

    if action in ("reload_n", "refresh_n", "reload_page_n"):
        try:
            return reload_page_n(int(value or 1))
        except (ValueError, TypeError) as e:
            return f"Reload failed: invalid count. {e}"

    if action == "scroll_up":
        try:
            amount = int(value or 500)
            return scroll_up(amount)
        except (ValueError, TypeError):
            return scroll_up(500)

    if action == "scroll_down":
        try:
            amount = int(value or 500)
            return scroll_down(amount)
        except (ValueError, TypeError):
            return scroll_down(500)

    if action == "open_app":
        app_name = str(value or params.get("app_name", "")).strip()
        if not app_name:
            return "No app name provided."
        return open_app(app_name)

    func = ACTION_MAP.get(action)
    if not func:
        available = ", ".join(sorted(ACTION_MAP.keys())[:10]) + "..."
        return f"Unknown action: '{raw_action}'. Available: {available}"

    try:
        if action == "toggle_bluetooth":
            return func(value)
        
        res = func()
        return res or f"Done: {action}."
    except Exception as e:
        print(f"[Settings] Action failed ({action}): {e}")
        return f"Action failed ({action}): {e}"
