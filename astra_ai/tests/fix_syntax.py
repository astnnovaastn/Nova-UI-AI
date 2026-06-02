#!/usr/bin/env python3
"""
Script to fix the syntax error in Mem0_ai_organizer.py
"""
import re

def fix_syntax_error():
    # Read the file
    with open('astra_ai/memory/Mem0_ai_organizer.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # The issue is that the _rewrite_memory_entry_for_clarity method's try block
    # is not properly closed with except/finally before the next method starts
    
    # Find the problematic section: the try block that starts and continues to the next method
    # Look for the content: content = re.sub(r'[.!?;]+', '', content) + '.'
    # That should be followed by more processing and then the except block, not the next method's docstring
    
    # Replace the transition between the method's processing and the next method
    # by inserting the missing exception handling
    
    before_fix = """            content = re.sub(r'[.!?;]+', '', content) + '.'
        \"\"\"Determine where the memory entry came from and provide context."""
    
    after_fix = """            content = re.sub(r'[.!?;]+', '', content) + '.'

            # Remove any duplicate periods that might have been introduced
            content = re.sub(r'\\\\.{2,}', '.', content)
            
            # Capitalize the first letter
            if content:
                content = content[0].upper() + content[1:]
            
            return content
            
        except Exception as e:
            print(f"Error rewriting memory entry for clarity: {e}")
            # Fallback to a basic transformation
            if original_summary:
                # Try to extract just the core statement without "said:" prefix
                core = re.sub(r'^[A-Za-z0-9_]+\\\\s+said:\\\\s*', '', original_summary)
                if core and core != original_summary:
                    return f"User said: {core}"
                else:
                    return f"User expressed: {original_summary}"
            else:
                return "User has an unspecified preference or interest."

        \"\"\"Determine where the memory entry came from and provide context."""
    
    # Perform the replacement
    if before_fix in content:
        print("Found the problematic section, fixing it...")
        fixed_content = content.replace(before_fix, after_fix)
        
        # Write the fixed content back to the file
        with open('astra_ai/memory/Mem0_ai_organizer.py', 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        print("File fixed successfully!")
    else:
        print("Could not find the exact problematic section to fix.")
        
        # Try to find similar patterns
        import re
        pattern = re.compile(r"content = re\.sub\(r'\[.!?;\]\+', \'\', content\) \+ \'\..*?\"\"\"Determine where the memory entry came from", re.DOTALL)
        matches = pattern.findall(content)
        if matches:
            print(f"Found similar patterns: {matches[:2]}...")  # Show first 2 matches
        else:
            print("Could not find any similar patterns either.")
    
if __name__ == "__main__":
    fix_syntax_error()