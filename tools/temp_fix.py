#!/usr/bin/env python3
"""
Script to fix the unbound variable error in mem0_memory_system.py
The issue is that 'category' and 'importance_score' are used before being defined
"""

def fix_memory_system_file():
    with open('C:\\Users\\afian\\OneDrive\\Desktop\\Astra_ai\\astra_ai\\memory\\mem0_memory_system.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Find the problematic section and fix it
    fixed_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if we're at the beginning of the problematic pattern
        if 'if op_type == \'ADD\':' in line:
            # Collect the ADD block lines
            add_block_start = i
            add_block_lines = []
            
            # Add the if line
            add_block_lines.append(lines[i])  # if op_type == 'ADD':
            i += 1
            
            # Look for the pattern where category is used before being defined
            found_problem = False
            current_block_lines = [lines[i]]  # First line after if
            
            # Read until we find where category, subcategory = ... is defined
            j = i
            in_create_embedding = False
            while j < len(lines) and not lines[j].strip().startswith('category, subcategory = self.classify_category_and_subcategory'):
                current_block_lines.append(lines[j])
                if 'category=category,' in lines[j] or '"category": category,' in lines[j]:
                    in_create_embedding = True
                j += 1
                
            if in_create_embedding and j < len(lines):
                # We found the problematic pattern
                # The category assignment comes after it's used
                current_block_lines.append(lines[j])  # The category assignment line
                j += 1
                # Add importance_score assignment too
                if j < len(lines) and 'importance_score = self.calculate_importance_score' in lines[j]:
                    current_block_lines.append(lines[j])
                    j += 1
                
                # Now we have the full problematic block
                # Let's reorder it properly
                
                # Find where the embedding vector creation starts
                embed_start_idx = -1
                embed_end_idx = -1
                category_assign_idx = -1
                importance_assign_idx = -1
                
                for k, block_line in enumerate(current_block_lines):
                    if 'text_vector = self._create_embedding_vector(' in block_line:
                        embed_start_idx = k
                    elif embed_start_idx != -1 and embed_end_idx == -1 and ')' in block_line and block_line.strip().endswith('}'):
                        # Find the closing parenthesis for the function call
                        embed_end_idx = k
                    elif 'category, subcategory = self.classify_category_and_subcategory' in block_line:
                        category_assign_idx = k
                    elif 'importance_score = self.calculate_importance_score' in block_line:
                        importance_assign_idx = k
                
                if embed_start_idx != -1 and category_assign_idx != -1 and category_assign_idx > embed_start_idx:
                    # Need to reorder: category assignment first, then importance, then embedding
                    reordered_block = []
                    
                    # Add lines before embedding call
                    reordered_block.extend(current_block_lines[:embed_start_idx])
                    
                    # Add category assignment
                    reordered_block.append(current_block_lines[category_assign_idx])
                    
                    # Add importance score calculation if it exists
                    if importance_assign_idx != -1:
                        reordered_block.append(current_block_lines[importance_assign_idx])
                    
                    # Add the embedding call
                    reordered_block.extend(current_block_lines[embed_start_idx:embed_end_idx+1])
                    
                    # Add lines between embedding and other assignments
                    for k in range(embed_end_idx + 1, len(current_block_lines)):
                        if k != category_assign_idx and k != importance_assign_idx:
                            reordered_block.append(current_block_lines[k])
                    
                    # Add the reordered block to fixed_lines
                    fixed_lines.extend(reordered_block)
                    found_problem = True
                    i = j  # Move to after the original problematic section
                    continue
            
            if not found_problem:
                # Add the lines as they were
                fixed_lines.extend(current_block_lines)
                i = j
            continue
            
        fixed_lines.append(line)
        i += 1
    
    # Write the fixed file back
    with open('C:\\Users\\afian\\OneDrive\\Desktop\\Astra_ai\\astra_ai\\memory\\mem0_memory_system.py', 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)
    
    print("File has been fixed!")

if __name__ == "__main__":
    fix_memory_system_file()