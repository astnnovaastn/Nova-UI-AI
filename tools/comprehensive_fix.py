#!/usr/bin/env python3
"""
Comprehensive fix for indentation and current_facts references in mem0_memory_system.py
"""

import os
import re

def fix_indentation_and_references():
    """Fix indentation issues and current_facts references comprehensively."""
    
    file_path = "astra_ai/memory/mem0_memory_system.py"
    
    if not os.path.exists(file_path):
        print("[ERROR] Memory system file not found!")
        return False
    
    # Create backup
    backup_path = file_path + ".backup"
    if not os.path.exists(backup_path):
        import shutil
        shutil.copy2(file_path, backup_path)
        print(f"[INFO] Created backup: {backup_path}")
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix specific indentation issues
    # Fix the problematic block around lines 4275-4290
    pattern = r"""        if op_type == MemoryEventType\.ADD\.value:\s*\n\s*# Fixed: current_facts was removed, using fact_history instead\s*\n\s*# current_value = self\.data\["current_facts"\]\.get\(fact_type\)\s*\n\s*current_value = self\.data\.get\("fact_history", {}\)\.get\(fact_type\)\s*\n\s*\n\s*if current_value is None or current_value != value:"""
    
    replacement = """        if op_type == MemoryEventType.ADD.value:
            # Fixed: current_facts was removed, using fact_history instead
            # current_value = self.data["current_facts"].get(fact_type)
            current_value = self.data.get("fact_history", {}).get(fact_type)

            if current_value is None or current_value != value:"""
    
    content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    
    # Fix another reference to current_facts on the semantic analysis line
    content = content.replace(
        'semantic_context = self.semantic_engine.analyze_semantic_relationships(\n                    value, self.data["current_facts"]',
        '# Fixed: current_facts was removed, using fact_history instead\n            # semantic_context = self.semantic_engine.analyze_semantic_relationships(\n            #     value, self.data["current_facts"]\n            semantic_context = self.semantic_engine.analyze_semantic_relationships(\n                value, self.data.get("fact_history", {})'
    )
    
    # Fix the store operation line
    content = content.replace(
        'self.data["current_facts"][fact_type] = value',
        '# Fixed: current_facts was removed, using fact_history instead\n            # self.data["current_facts"][fact_type] = value\n            if "fact_history" not in self.data:\n                self.data["fact_history"] = {}\n            self.data["fact_history"][fact_type] = value'
    )
    
    # Write the fixed content back to the file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("[SUCCESS] Fixed indentation and current_facts references")
    return True

if __name__ == "__main__":
    print("[INFO] Applying comprehensive fix for indentation and current_facts references...")
    if fix_indentation_and_references():
        print("[SUCCESS] Comprehensive fix applied successfully!")
    else:
        print("[ERROR] Failed to apply comprehensive fix!")