"""
Setup Paths

This module adds all the necessary directories to the Python path.
Import this module at the beginning of your scripts to ensure all modules can find each other.
"""

import sys
import os

def setup_paths():
    """Add all the necessary directories to the Python path."""
    # Get the project root directory
    project_root = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(project_root)
    
    # Add the project directories to the Python path
    paths = [
        parent_dir,
        project_root,
        os.path.join(project_root, "core"),
        os.path.join(project_root, "services"),
        os.path.join(project_root, "memory"),
        os.path.join(project_root, "system"),
        os.path.join(project_root, "tests")
    ]
    
    for path in paths:
        if path not in sys.path:
            sys.path.insert(0, path)
    
    return paths

# Add the paths when this module is imported
added_paths = setup_paths()

if __name__ == "__main__":
    print("Added the following directories to the Python path:")
    for path in added_paths:
        print(f"  - {path}")