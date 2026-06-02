#!/usr/bin/env python3
"""
Script to remove the duplicate content that was after main() function
"""
def remove_duplicates():
    with open('astra_ai/memory/Mem0_ai_organizer.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"Original file has {len(lines)} lines")
    
    # Find the sections to remove
    # The duplicate content starts after main() and ends before the duplicate _determine_source_info method
    
    # Look for the patterns
    main_line_idx = -1
    determine_source_start = -1
    
    for i, line in enumerate(lines):
        if 'if __name__ == "__main__":' in line:
            if main_line_idx == -1:  # First occurrence
                main_line_idx = i
            else:  # Second occurrence (for the duplicate section)
                break
        elif i > main_line_idx and 'def _determine_source_info' in line and main_line_idx != -1:
            determine_source_start = i
            break
    
    print(f"First main() at line {main_line_idx}")
    print(f"Duplicate _determine_source_info starts at line {determine_source_start}")
    
    if main_line_idx != -1 and determine_source_start != -1:
        # Remove lines from after main() to before the duplicate method
        # Keep the main() call itself but remove the duplicate content
        lines_to_remove_start = main_line_idx + 2  # Skip "if __name__ == ..." and "main()"
        lines_to_remove_end = determine_source_start
        
        print(f"Removing lines from {lines_to_remove_start} to {lines_to_remove_end-1} ({lines_to_remove_end - lines_to_remove_start} lines)")
        
        # Keep lines before the duplicate content and after it
        new_lines = lines[:lines_to_remove_start] + lines[lines_to_remove_end:]
        
        print(f"New file will have {len(new_lines)} lines")
        
        with open('astra_ai/memory/Mem0_ai_organizer.py', 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        
        print("Duplicate content removed successfully!")
    else:
        print("Could not identify the duplicate sections to remove.")

if __name__ == "__main__":
    remove_duplicates()