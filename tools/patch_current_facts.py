#!/usr/bin/env python3
"""
Patch script to fix the current_facts references in the memory system.
"""

import sys
import os
import fileinput
from pathlib import Path

def patch_current_facts_references():
    """Patch the current_facts references in the memory system."""
    
    # File to patch
    file_path = Path("astra_ai/memory/mem0_memory_system.py")
    
    if not file_path.exists():
        print("Memory system file not found!")
        return False
    
    # Backup the original file
    backup_path = file_path.with_suffix(".py.bak")
    if not backup_path.exists():
        import shutil
        shutil.copy2(file_path, backup_path)
        print(f"Created backup: {backup_path}")
    
    # Patches to apply
    patches = [
        # Fix _detect_and_merge_overlapping_facts method
        (4375, 'for fact_type, fact_value in self.data["current_facts"].items():', 
         '# Fix: current_facts was removed, use fact_history instead\n        # for fact_type, fact_value in self.data["current_facts"].items():'),
        
        # Fix _update_memory_relationships method  
        (4465, 'facts = self.data["current_facts"]', 
         '# Fix: current_facts was removed, use fact_history instead\n        # facts = self.data["current_facts"]'),
         
        # Fix _analyze_communication_style method
        (4486, 'for fact_key, fact_value in self.data["current_facts"].items():', 
         '# Fix: current_facts was removed, use fact_history instead\n        # for fact_key, fact_value in self.data["current_facts"].items():'),
         
        # Fix _analyze_activity_patterns method
        (4535, 'for fact_key, fact_value in self.data["current_facts"].items():', 
         '# Fix: current_facts was removed, use fact_history instead\n        # for fact_key, fact_value in self.data["current_facts"].items():'),
    ]
    
    # Apply patches
    lines_changed = 0
    
    with fileinput.FileInput(str(file_path), inplace=True) as file:
        for line_num, line in enumerate(file, 1):
            # Strip the line for comparison
            stripped_line = line.rstrip()
            
            # Check if this line needs to be patched
            patched = False
            for target_line_num, target, replacement in patches:
                if line_num == target_line_num and stripped_line == target:
                    print(replacement)
                    lines_changed += 1
                    patched = True
                    break
            
            # If not patched, print the original line
            if not patched:
                print(line, end='')
    
    print(f"Patched {lines_changed} lines in {file_path}")
    return True

if __name__ == "__main__":
    patch_current_facts_references()