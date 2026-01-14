#!/usr/bin/env python3
"""
Script to run the AI Organizer and ensure it processes emotional context for all entries.
"""
import os
import sys
import time
import json
from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def run_ai_organizer():
    print("Starting AI Organizer to process emotional context for all entries...")
    
    # Configuration for the organizer
    config = {
        'organizer_enabled': True,
        'memory_file_path': os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'),
        'check_interval': 1.0,  # Check every 1 second
        'llm_enabled': False,   # Disable LLM for consistent processing
        'llm_api_key': 'dummy_key',
        'llm_model': 'dummy_model'
    }
    
    # Create the organizer instance
    organizer = AIOrganizer(config)
    
    print(f"Organizer initialized. Memory file: {config['memory_file_path']}")
    print("Processing existing entries at startup...")
    
    # The organizer will process existing entries at startup and then monitor continuously
    try:
        organizer.start_monitoring()
    except KeyboardInterrupt:
        print("\nOrganizer monitoring stopped by user.")
    except Exception as e:
        print(f"Error running organizer: {e}")

if __name__ == "__main__":
    run_ai_organizer()