#!/usr/bin/env python3
"""
Manual fix for indentation issues in mem0_memory_system.py
"""

import os
import re

def fix_indentation_issues():
    """Fix indentation issues in the memory system file."""
    
    file_path = "astra_ai/memory/mem0_memory_system.py"
    
    if not os.path.exists(file_path):
        print("[ERROR] Memory system file not found!")
        return False
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Fix indentation issues around line 4280
    fixed_lines = []
    for i, line in enumerate(lines):
        # Fix the specific indentation issue at line 4280
        if i == 4279:  # Line 4280 (0-indexed)
            # Check if this is the problematic line
            if "current_value = self.data.get(\"fact_history\", {}).get(fact_type)" in line:
                # Make sure it's properly indented
                fixed_lines.append("                current_value = self.data.get(\"fact_history\", {}).get(fact_type)\n")
            else:
                fixed_lines.append(line)
        else:
            fixed_lines.append(line)
    
    # Write the fixed content back to the file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)
    
    print("[SUCCESS] Fixed indentation issues in mem0_memory_system.py")
    return True

if __name__ == "__main__":
    fix_indentation_issues()