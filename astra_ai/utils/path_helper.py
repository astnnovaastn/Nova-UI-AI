"""
Path helper utilities for Astra AI
"""

import os
import sys
from pathlib import Path

def add_project_root_to_path():
    """
    Add the project root directory to the Python path.
    This allows imports from the astra_ai package from any script.
    """
    # Get the current file's directory
    current_dir = Path(os.path.dirname(os.path.abspath(__file__)))
    
    # Navigate up to the project root (two levels up from utils)
    project_root = current_dir.parent.parent
    
    # Add to path if not already there
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))
        return True
    return False

def get_project_root():
    """
    Get the absolute path to the project root directory.
    """
    current_dir = Path(os.path.dirname(os.path.abspath(__file__)))
    return str(current_dir.parent.parent)