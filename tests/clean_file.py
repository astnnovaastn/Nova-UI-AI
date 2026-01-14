# Script to clean duplicate content from Mem0_ai_organizer.py
with open('c:/Users/afian/OneDrive/Desktop/Astra_ai/astra_ai/memory/Mem0_ai_organizer.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the position of the second occurrence of 'Example configuration'
first_pos = content.find('# Example configuration')
if first_pos != -1:
    second_pos = content.find('# Example configuration', first_pos + 1)
    if second_pos != -1:
        # Keep content only up to the second occurrence
        cleaned_content = content[:second_pos]
        
        # Write the cleaned content back to the file
        with open('c:/Users/afian/OneDrive/Desktop/Astra_ai/astra_ai/memory/Mem0_ai_organizer.py', 'w', encoding='utf-8') as f:
            f.write(cleaned_content)
        
        print(f'File cleaned. Original size: {len(content)} chars, New size: {len(cleaned_content)} chars')
        print(f'Removed {len(content) - len(cleaned_content)} characters of duplicate content')
        print('Success: File cleaned')
    else:
        print('No second occurrence found - file may already be clean')
else:
    print('No first occurrence found')