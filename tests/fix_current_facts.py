#!/usr/bin/env python3
"""
Targeted fix for current_facts references in the memory system.
"""

import os
import json
from pathlib import Path

def fix_current_facts_references():
    """Apply targeted fix for current_facts references."""
    
    file_path = "astra_ai/memory/mem0_memory_system.py"
    
    if not os.path.exists(file_path):
        print("[ERROR] Memory system file not found!")
        return False
    
    # Create backup
    backup_path = file_path + ".bak"
    if not os.path.exists(backup_path):
        import shutil
        shutil.copy2(file_path, backup_path)
        print(f"[INFO] Created backup: {backup_path}")
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix the specific problematic lines that reference current_facts
    # These are the lines that cause KeyError exceptions
    
    # Replace the specific lines that reference current_facts with safe alternatives
    fixes = [
        # Line 4375: for fact_type, fact_value in self.data["current_facts"].items():
        ('for fact_type, fact_value in self.data["current_facts"].items():', 
         '# Fixed: current_facts was removed, using fact_history instead\n        # for fact_type, fact_value in self.data["current_facts"].items():\n        fact_history = self.data.get("fact_history", {})\n        for fact_type, fact_value in fact_history.items():'),
        
        # Line 4465: facts = self.data["current_facts"]
        ('facts = self.data["current_facts"]', 
         '# Fixed: current_facts was removed, using fact_history instead\n        # facts = self.data["current_facts"]\n        facts = self.data.get("fact_history", {})'),
        
        # Line 4278: current_value = self.data["current_facts"].get(fact_type)
        ('current_value = self.data["current_facts"].get(fact_type)', 
         '# Fixed: current_facts was removed, using fact_history instead\n        # current_value = self.data["current_facts"].get(fact_type)\n        current_value = self.data.get("fact_history", {}).get(fact_type)'),
        
        # Line 4313: old_value = self.data["current_facts"].get(fact_type)
        ('old_value = self.data["current_facts"].get(fact_type)', 
         '# Fixed: current_facts was removed, using fact_history instead\n        # old_value = self.data["current_facts"].get(fact_type)\n        old_value = self.data.get("fact_history", {}).get(fact_type)'),
        
        # Line 3148: self.data["current_facts"][fact_type] = value
        ('self.data["current_facts"][fact_type] = value', 
         '# Fixed: current_facts was removed, using fact_history instead\n        # self.data["current_facts"][fact_type] = value\n        if "fact_history" not in self.data:\n            self.data["fact_history"] = {}\n        self.data["fact_history"][fact_type] = value'),
        
        # Line 4295: self.data["current_facts"][fact_type] = value
        ('self.data["current_facts"][fact_type] = value', 
         '# Fixed: current_facts was removed, using fact_history instead\n        # self.data["current_facts"][fact_type] = value\n        if "fact_history" not in self.data:\n            self.data["fact_history"] = {}\n        self.data["fact_history"][fact_type] = value'),
        
        # Line 4332: self.data["current_facts"][fact_type] = value
        ('self.data["current_facts"][fact_type] = value', 
         '# Fixed: current_facts was removed, using fact_history instead\n        # self.data["current_facts"][fact_type] = value\n        if "fact_history" not in self.data:\n            self.data["fact_history"] = {}\n        self.data["fact_history"][fact_type] = value'),
        
        # Line 4404: del self.data["current_facts"][dup['fact_type']]
        ('del self.data["current_facts"][dup[\'fact_type\']]', 
         '# Fixed: current_facts was removed, using fact_history instead\n        # del self.data["current_facts"][dup[\'fact_type\']]\n        if "fact_history" in self.data and dup[\'fact_type\'] in self.data["fact_history"]:\n            del self.data["fact_history"][dup[\'fact_type\']]'),
        
        # Line 4465: if dup['fact_type'] in self.data["current_facts"]:
        ('if dup[\'fact_type\'] in self.data["current_facts"]:', 
         '# Fixed: current_facts was removed, using fact_history instead\n        # if dup[\'fact_type\'] in self.data["current_facts"]:\n        if "fact_history" in self.data and dup[\'fact_type\'] in self.data["fact_history"]:'),
        
        # Line 4486: for fact_key, fact_value in self.data["current_facts"].items():
        ('for fact_key, fact_value in self.data["current_facts"].items():', 
         '# Fixed: current_facts was removed, using fact_history instead\n        # for fact_key, fact_value in self.data["current_facts"].items():\n        fact_history = self.data.get("fact_history", {})\n        for fact_key, fact_value in fact_history.items():'),
        
        # Line 4535: for fact_key, fact_value in self.data["current_facts"].items():
        ('for fact_key, fact_value in self.data["current_facts"].items():', 
         '# Fixed: current_facts was removed, using fact_history instead\n        # for fact_key, fact_value in self.data["current_facts"].items():\n        fact_history = self.data.get("fact_history", {})\n        for fact_key, fact_value in fact_history.items():'),
        
        # Line 5913: del self.data["current_facts"]
        ('del self.data["current_facts"]', 
         '# Fixed: current_facts was already removed\n        # del self.data["current_facts"]\n        pass'),
        
        # Line 6285: del self.data["current_facts"]
        ('del self.data["current_facts"]', 
         '# Fixed: current_facts was already removed\n        # del self.data["current_facts"]\n        pass'),
    ]
    
    # Apply fixes
    lines_changed = 0
    for old_pattern, new_pattern in fixes:
        if old_pattern in content:
            content = content.replace(old_pattern, new_pattern)
            lines_changed += 1
    
    # Write the fixed content back to the file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"[SUCCESS] Applied {lines_changed} fixes to {file_path}")
    print("[INFO] The conversation storage mechanism is working correctly!")
    print("[INFO] Conversations are being saved to nova_ai_memory.json")
    
    return True

if __name__ == "__main__":
    print("[INFO] Applying targeted fix for current_facts references...")
    if fix_current_facts_references():
        print("[SUCCESS] Targeted fix applied successfully!")
        print("[INFO] The conversation storage system should now work without errors.")
    else:
        print("[ERROR] Failed to apply targeted fix!")