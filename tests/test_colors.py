import os
import sys
import ctypes

def test_colors():
    # Test if we can enable ANSI colors on Windows
    if os.name == 'nt':
        try:
            kernel32 = ctypes.windll.kernel32
            handle = kernel32.GetStdHandle(-11)  # STD_OUTPUT_HANDLE
            mode = ctypes.c_ulong()
            kernel32.GetConsoleMode(handle, ctypes.byref(mode))
            print(f"Current console mode: {mode.value}")
            
            # Try to enable virtual terminal processing
            new_mode = mode.value | 0x0004  # ENABLE_VIRTUAL_TERMINAL_PROCESSING
            result = kernel32.SetConsoleMode(handle, new_mode)
            print(f"SetConsoleMode result: {result}")
            
            # Test color output
            print("\033[92m\033[1mGREEN BOLD TEXT\033[0m")
            print("\033[91mRED TEXT\033[0m")
            print("\033[94mBLUE TEXT\033[0m")
            print("Normal text")
            
        except Exception as e:
            print(f"Error with console colors: {e}")
    else:
        print("Not on Windows")

if __name__ == "__main__":
    test_colors()