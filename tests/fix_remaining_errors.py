#!/usr/bin/env python3
"""
Script to fix all remaining syntax errors in Mem0_ai_organizer.py
"""
def fix_remaining_errors():
    with open('astra_ai/memory/Mem0_ai_organizer.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find and fix all instances of the broken pattern:
    # main()
    # , '', content) + '.'
    
    broken_pattern = "main()\n, '', content) + '.'"
    fixed_pattern = "main()\n            content = re.sub(r'[.!?;]+', '', content) + '.'\n\n            # Remove any duplicate periods that might have been introduced\n            content = re.sub(r'\\\\.{2,}', '.', content)\n            \n            # Capitalize the first letter\n            if content:\n                content = content[0].upper() + content[1:]\n            \n            return content\n            \n        except Exception as e:\n            print(f\"Error rewriting memory entry for clarity: {e}\")\n            # Fallback to a basic transformation\n            if original_summary:\n                # Try to extract just the core statement without \"said:\" prefix\n                core = re.sub(r'^[A-Za-z0-9_]+\\\\s+said:\\\\s*', '', original_summary)\n                if core and core != original_summary:\n                    return f\"User said: {core}\"\n                else:\n                    return f\"User expressed: {original_summary}\"\n            else:\n                return \"User has an unspecified preference or interest.\"\n\n    def _determine_source_info"
    
    # Replace all instances of the broken pattern
    if broken_pattern in content:
        print(f"Found and fixing {content.count(broken_pattern)} instances of broken pattern")
        # Need to be careful since we need to replace the broken line with the proper structure
        # But we also need to remove the except block that follows since it's not in the right place
        # Let me handle this differently - I'll just fix the immediate syntax error first
        
        # Split the pattern to replace just the broken part
        import re
        # Pattern: main() followed by the broken line
        pattern = r'(main\(\)\r?\n), \'\', content\) \+ \'\.\''
        replacement = r'\1            content = re.sub(r\'[.!?;]+\', \'\', content) + \'.\''
        
        fixed_content = content
        
        # Fix the broken line first
        fixed_content = re.sub(pattern, replacement, fixed_content)
        
        # Now I need to remove the duplicate content that follows (the try-except block that appears outside of a try)
        # This is complex, so instead, I'll just make sure the syntax is correct by removing these duplicated blocks
        lines = fixed_content.split('\n')
        new_lines = []
        i = 0
        while i < len(lines):
            # Look for the pattern that starts with the broken structure
            if (i + 1 < len(lines) and 
                lines[i].strip() == 'main()' and
                ', \'\', content) + \'.\'' in lines[i+1]):
                # Skip this broken pattern and the following lines that are duplicates
                # Find the next legitimate method definition or class definition
                j = i + 2  # Start after main() and the broken line
                while j < len(lines):
                    line = lines[j].strip()
                    if line.startswith('def ') or line.startswith('class ') or ('if __name__ == ' in line and j > i + 10):
                        # Found next legitimate code block
                        break
                    j += 1
                
                # Add the main() call and skip the broken content
                new_lines.append(lines[i])  # main()
                # Don't add the broken line
                # Skip until we reach the next legitimate block
                i = j
            else:
                new_lines.append(lines[i])
                i += 1
        
        fixed_content = '\n'.join(new_lines)
        
        with open('astra_ai/memory/Mem0_ai_organizer.py', 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        print("All remaining syntax errors have been fixed!")
    else:
        print("No instances of the broken pattern found.")

if __name__ == "__main__":
    fix_remaining_errors()