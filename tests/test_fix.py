#!/usr/bin/env python3

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer, ORGANIZER_CONFIG

organizer = AIOrganizer(ORGANIZER_CONFIG)

test_cases = [
    'User: i don\'t like to use old pc from the 2010',
    'User user: i hate to use slow software like the old version of photoshop',
    'User: i try to avoid junk food like mcdonald\'s',
    'User: i enjoy programming in python and javascript',
    'User: i love playing guitar and piano'
]

print("Testing AI Organizer fixes...")
print("=" * 50)

for i, test_context in enumerate(test_cases, 1):
    print(f"Test {i}: {test_context}")
    pref_type = organizer._classify_preference_type_from_context(test_context)
    pref_sentence = organizer._create_natural_preference_sentence(test_context, pref_type)
    print(f"  Type: {pref_type}")
    print(f"  Sentence: {pref_sentence}")
    
    # Check for "User" artifacts
    if "User" in pref_sentence and "User" not in test_context.replace("User:", "").replace("User user:", "").strip():
        print("  WARNING: 'User' found in preference sentence!")
    else:
        print("  OK: No 'User' artifacts found")
    
    print()

print("Test completed!")