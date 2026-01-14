#!/usr/bin/env python3
"""
Final fix for duplicate content after main()
"""
def remove_remaining_duplicates():
    with open('astra_ai/memory/Mem0_ai_organizer.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"Original file has {len(lines)} lines")
    
    # Find all instances of main() function calls and remove the duplicate content after them
    # (except for the first/main instance)
    
    main_indices = []
    for i, line in enumerate(lines):
        if 'if __name__ == "__main__":' in line:
            main_indices.append(i)
    
    print(f"Found {len(main_indices)} instances of main(): at lines {[i+1 for i in main_indices]}")
    
    # For each instance after the first, remove the duplicate content
    # The duplicate content starts after main() and continues until the next legitimate code block
    lines_to_remove = set()
    
    for main_idx in main_indices[1:]:  # Skip the first/main one
        # From the main() line, find where the duplicate content starts and ends
        # It starts at main_idx + 2 (after "if __name__ == ..." and "main()")
        
        start_remove = main_idx + 2  # Start removing from after main()
        
        # Find where to stop removing (next legitimate method/class definition, or when we see a proper main() pattern again)
        end_remove = len(lines)  # Default to end of file
        
        for j in range(start_remove, len(lines)):
            line = lines[j].strip()
            # If we find a legitimate function or class definition, or another main(), stop removing here
            if (line.startswith('def ') and not 'main()' in line) or line.startswith('class ') or ('if __name__ ==' in line and j != main_idx):
                end_remove = j
                break
        
        print(f"Removing duplicate content from line {start_remove+1} to {end_remove} after main() at line {main_idx+1}")
        
        for k in range(start_remove, end_remove):
            lines_to_remove.add(k)
    
    # Create new lines list without the duplicate content
    new_lines = []
    for i, line in enumerate(lines):
        if i not in lines_to_remove:
            new_lines.append(line)
    
    print(f"New file will have {len(new_lines)} lines")
    
    with open('astra_ai/memory/Mem0_ai_organizer.py', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print("Removed all remaining duplicate content!")

if __name__ == "__main__":
    remove_remaining_duplicates()