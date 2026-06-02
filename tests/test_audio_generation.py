#!/usr/bin/env python3
"""Test audio generation by adding a new AI response to memory file"""

import json
from pathlib import Path
import time

memory_file = Path("d:\\Astra_ai\\astra_ai\\Date\\nova_ai_memory.json")

print(f"Loading memory file: {memory_file}")
with open(memory_file, "r") as f:
    data = json.load(f)

# Add a new AI response
new_response = {
    "role": "assistant",
    "content": "Testing the audio generation system! This is a test message to verify that the ElevenLabs API is working correctly and generating voice audio."
}

data["conversation"].append(new_response)

print(f"Added new response at index {len(data['conversation'])-1}")
print(f"Content: {new_response['content']}")

# Write back
with open(memory_file, "w") as f:
    json.dump(data, f, indent=2)

print("✓ Test response added to memory file")
print("Waiting for server to detect and process...\n")

# Wait and monitor
for i in range(10):
    print(f".", end="", flush=True)
    time.sleep(1)

print("\n\nTest complete!")
