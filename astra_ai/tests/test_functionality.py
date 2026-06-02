import sys
import os
import re

# Add the path to the memory module
sys.path.append(os.path.join(os.getcwd(), 'astra_ai', 'memory'))

# Import the necessary functions directly by reading and executing the file content
with open('astra_ai/memory/Mem0_ai_organizer.py', 'r') as f:
    content = f.read()

# Execute the module to make functions available
exec(content)

# Create a minimal mock of the AIOrganizer class to test the methods
class MockOrganizer:
    def __init__(self):
        pass
        
    def _process_user_input_to_summary(self, user_input: str, user_name: str) -> str:
        """Copy of the method we created"""
        user_input = user_input.strip()
        user_ref = user_name or "User"
        
        # Normalize the input for analysis
        normalized_input = user_input.lower().strip()
        
        # Detect common patterns in user input
        if any(word in normalized_input for word in ['like', 'love', 'enjoy', 'prefer', 'adore', 'appreciate']):
            # Extract the specific thing they like
            like_pattern = r'(?:i|me|my|we|us)\s+(like|love|enjoy|prefer|adore|appreciate)\s+(.+?)(?:\.|$)'
            match = re.search(like_pattern, user_input, re.IGNORECASE)
            if match:
                liked_thing = match.group(2).strip()
                return f"{user_ref} likes {liked_thing} and considers it an interest."
            else:
                # If pattern doesn't match, just extract what follows the like verb
                for verb in ['like', 'love', 'enjoy', 'prefer']:
                    if verb in normalized_input:
                        # Extract everything after the verb
                        parts = user_input.split(verb, 1)
                        if len(parts) > 1:
                            liked_thing = parts[1].strip()
                            if liked_thing:
                                return f"{user_ref} likes {liked_thing} and considers it an interest."
        
        elif any(word in normalized_input for word in ['want', 'need', 'wish', 'hope', 'desire']):
            # Extract what they want/need
            want_pattern = r'(?:i|me|my|we|us)\s+(want|need|wish|hope|desire)\s+(.+?)(?:\.|$)'
            match = re.search(want_pattern, user_input, re.IGNORECASE)
            if match:
                wanted_thing = match.group(2).strip()
                return f"{user_ref} wants {wanted_thing}."
            else:
                # Simple extraction after want/need
                for verb in ['want', 'need']:
                    if verb in normalized_input:
                        parts = user_input.split(verb, 1)
                        if len(parts) > 1:
                            wanted_thing = parts[1].strip()
                            if wanted_thing:
                                return f"{user_ref} wants {wanted_thing}."

        elif any(word in normalized_input for word in ['think', 'believe', 'feel', 'find']):
            # Extract their thoughts/feelings
            think_pattern = r'(?:i|me|my|we|us)\s+(think|believe|feel|find)\s+(.+?)(?:\.|$)'
            match = re.search(think_pattern, user_input, re.IGNORECASE)
            if match:
                thought = match.group(2).strip()
                return f"{user_ref} thinks {thought}."

        elif 'name' in normalized_input and ('nova' in normalized_input or 'nova' in (user_name or '').lower()):
            # Special case for name preferences
            if 'like' in normalized_input or 'love' in normalized_input:
                return f"{user_ref} likes the name nova and considers it a personal preference."

        # If no specific pattern matched, return a general statement
        # Try to convert first-person to third-person
        first_person_patterns = [
            (r'\bi\b', f'{user_ref}'),
            (r'\bmy\b', f'{user_ref}\'s'),
            (r'\bme\b', f'{user_ref}'),
            (r'\bmine\b', f'{user_ref}\'s'),
            (r'\bam\b', 'is'),
            (r'\bwas\b', 'was'),
            (r'\bare\b', 'is'),
            (r'\bwere\b', 'was'),
        ]

        processed_input = user_input
        for pattern, replacement in first_person_patterns:
            processed_input = re.sub(rf'\b{pattern}\b', replacement, processed_input, flags=re.IGNORECASE)

        # Only return if it's meaningful, otherwise fallback to generic
        if len(processed_input.split()) > 2 and processed_input != user_input:
            return f"{processed_input} and values it."

        # Final fallback: if we can't extract meaning, create a general summary
        if user_input.strip():
            # Just return the input as a third-person statement
            return f"{user_ref} expressed interest in {user_input.strip('.')} and considers it an interest."

        # If all else fails, return a fallback message
        return f"{user_ref} expressed a preference, but details are unclear."

    def _rewrite_memory_entry(self, original_summary: str, source_context: str, user_name: str = None) -> str:
        """Simplified rewrite function for testing"""
        # First, let's get the original summary from the provenance if available,
        # as it contains the raw user input before processing
        original_source = ""
        
        # Check if the source_context contains the actual user statement
        if source_context and ('User user:' in source_context or 'Nemzz:' in source_context or 'user:' in source_context):
            # Extract the actual user statement from the context
            # Look for patterns like "User user: actual message..." or "Nemzz: actual message..."
            match = re.search(r'(?:User user:|Nemzz:|user:)\s*(.+?)(?:\.{3}|$)', source_context)
            if match:
                original_source = match.group(1).strip()
        
        # If we have a clean original source from context, use that
        if original_source:
            return self._process_user_input_to_summary(original_source, user_name)
        
        # Otherwise, check if original_summary is a simple preference pattern
        # Try to extract what the user actually wants based on the original summary
        if "Added preference likes:" in original_summary:
            # Extract what comes after "Added preference likes:"
            parts = original_summary.split("Added preference likes:", 1)
            if len(parts) > 1:
                preference = parts[1].strip()
                # Check if it's meaningful
                if preference and preference.lower() not in ['like', 'dislike', 'love', 'enjoy', 'prefer']:
                    user_ref = user_name or "User"
                    return f"{user_ref} likes {preference} and considers it an interest."
                else:
                    user_ref = user_name or "User"
                    return f"{user_ref} expressed a general preference, but details are unclear."
        
        # Fallback to original processing if no context available
        user_ref = user_name or "User"
        return f"{user_ref} expressed a preference, but details are unclear."

# Create an instance and run tests
mock_org = MockOrganizer()

print("Testing the fixed _rewrite_memory_entry function:")
print()

# Test case 1: Basic preference with context
result1 = mock_org._rewrite_memory_entry("Added preference likes: 2pac", "User user: i like 2pac ...", "Nemzz")
print("Test 1 - Input: Added preference likes: 2pac, Context: User user: i like 2pac ...")
print("Result:", result1)
print()

# Test case 2: Ambiguous preference
result2 = mock_org._rewrite_memory_entry("Added preference likes: like", "User user: i like the name 2pac...", "Nemzz")
print("Test 2 - Input: Added preference likes: like, Context: User user: i like the name 2pac...")
print("Result:", result2)
print()

# Test case 3: Direct user input processing
result3 = mock_org._process_user_input_to_summary("i like 2pac", "Nemzz")
print("Test 3 - Direct input: i like 2pac")
print("Result:", result3)
print()

# Test case 4: Name preference
result4 = mock_org._process_user_input_to_summary("i like the name nova", "Nemzz")
print("Test 4 - Direct input: i like the name nova")
print("Result:", result4)