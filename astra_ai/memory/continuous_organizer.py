"""
AI Memory Organizer - Continuous Memory Improvement System
"""

import json
import os
import time
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from pathlib import Path

class ContinuousMemoryOrganizer:
    """
    AI Memory Organizer that continuously watches and improves memory quality.
    
    Main Job:
    - Watch nova_ai_memory.json for new events
    - Continuously organize information to make more sense
    - Rewrite and improve memory entries based on user context
    - Structure raw data into meaningful categories
    """
    
    def __init__(self, memory_file_path: str = "@astra_ai/Date/nova_ai_memory.json"):
        self.memory_file_path = memory_file_path
        self.last_processed_event_count = 0
        self.is_monitoring = False
        
    def start_monitoring(self):
        """Start continuously monitoring the memory file"""
        self.is_monitoring = True
        print("AI Memory Organizer started - watching for new memory events...")
        
        while self.is_monitoring:
            try:
                # Check for new events
                new_events = self._check_for_new_events()
                if new_events:
                    self._process_new_events(new_events)
                    
                # Wait before next check
                time.sleep(1)  # Check every second
                
            except KeyboardInterrupt:
                print("\nAI Memory Organizer stopped by user")
                break
            except Exception as e:
                print(f"Warning: Error while monitoring - {e}")
                time.sleep(5)  # Wait longer on error
                
    def stop_monitoring(self):
        """Stop monitoring the memory file"""
        self.is_monitoring = False
        print("AI Memory Organizer stopped")
        
    def _check_for_new_events(self) -> list:
        """Check if there are new events in the memory file"""
        try:
            if not os.path.exists(self.memory_file_path):
                return []
                
            with open(self.memory_file_path, 'r', encoding='utf-8') as f:
                memory_data = json.load(f)
                
            # Get current event count
            current_events = memory_data.get('memory_events', [])
            current_count = len(current_events)
            
            # If we have new events
            if current_count > self.last_processed_event_count:
                new_events = current_events[self.last_processed_event_count:]
                self.last_processed_event_count = current_count
                return new_events
                
            return []
        except Exception as e:
            print(f"Warning: Could not check for new events - {e}")
            return []
            
    def _process_new_events(self, new_events: list):
        """Process new events and organize them better"""
        print(f"AI Organizer: Processing {len(new_events)} new events...")
        
        for i, event in enumerate(new_events):
            try:
                # Organize this event
                organized_event = self._organize_single_event(event)
                if organized_event:
                    print(f"  Organized event: {organized_event.get('type', 'unknown')}")
                    
                    # Save the organized result back to memory
                    self._update_memory_with_organized_event(organized_event)
                    
            except Exception as e:
                print(f"  Error organizing event {i}: {e}")
                
    def _organize_single_event(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Organize a single event to make it better structured"""
        if not isinstance(event, dict):
            return None
            
        # Get the event content
        content = self._extract_content(event)
        if not content:
            return None
            
        # Improve the organization
        organized = {
            'type': event.get('type', 'UNKNOWN'),
            'improved_summary': self._rewrite_for_better_sense(content),
            'category': self._categorize_content(content),
            'timestamp': datetime.now().isoformat(),
            'confidence': 0.9,
            'processing_notes': 'Organized by AI Memory Organizer'
        }
        
        # Only store original_summary if it's different and meaningful
        original_summary = event.get('summary', '')
        if original_summary and original_summary != organized['improved_summary']:
            organized['original_summary'] = original_summary
        
        return organized
        
    def _extract_content(self, event: Dict[str, Any]) -> str:
        """Extract meaningful content from an event"""
        if not isinstance(event, dict):
            return ""
            
        summary = event.get('summary', '')
        if isinstance(summary, str):
            return summary
        elif isinstance(summary, dict):
            # Join key-value pairs
            parts = [f"{k}: {v}" for k, v in summary.items()]
            return "; ".join(parts)
        return ""
        
    def _rewrite_for_better_sense(self, content: str) -> str:
        """Rewrite content to make more sense and be better structured"""
        # Remove extra whitespace
        content = ' '.join(content.split())
        
        # Apply basic improvements
        improvements = {
            'i m ': 'I am ',
            'i ve ': 'I have ',
            'don t ': "don't ",
            'can t ': "can't ",
            'won t ': "won't "
        }
        
        for old, new in improvements.items():
            content = content.replace(old, new)
            
        return content.strip()
        
    def _categorize_content(self, content: str) -> str:
        """Categorize content into meaningful types"""
        content_lower = content.lower()
        
        # Simple categorization based on keywords
        if any(word in content_lower for word in ['name', 'call me', 'i am']):
            return 'USER_IDENTITY'
        elif any(word in content_lower for word in ['work', 'job', 'occupation', 'developer', 'engineer']):
            return 'WORK_INFO'
        elif any(word in content_lower for word in ['like', 'love', 'hate', 'prefer']):
            return 'PREFERENCES'
        elif any(word in content_lower for word in ['learning', 'studying', 'skill']):
            return 'LEARNING'
        elif any(word in content_lower for word in ['hobby', 'interest', 'free time']):
            return 'INTERESTS'
        else:
            return 'GENERAL_INFO'
            
    def _update_memory_with_organized_event(self, organized_event: Dict[str, Any]):
        """Update the memory file with organized information"""
        try:
            # Read current memory
            if os.path.exists(self.memory_file_path):
                with open(self.memory_file_path, 'r', encoding='utf-8') as f:
                    memory_data = json.load(f)
            else:
                memory_data = {'memory_events': [], 'organized_facts': {}}
                
            # Add to organized facts
            if 'organized_facts' not in memory_data:
                memory_data['organized_facts'] = {}
                
            # Create a key for this organized fact
            fact_key = f"organized_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            memory_data['organized_facts'][fact_key] = organized_event
            
            # Save back to file
            with open(self.memory_file_path, 'w', encoding='utf-8') as f:
                json.dump(memory_data, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            print(f"Warning: Could not update memory with organized event - {e}")

def main():
    """Main function to run the continuous memory organizer"""
    print("AI Memory Organizer - Continuous Memory Improvement System")
    print("=" * 60)
    print("Main Job:")
    print("  - Watch nova_ai_memory.json for new events")
    print("  - Continuously organize information to make more sense")
    print("  - Rewrite and improve memory entries based on user context")
    print()
    
    # Create organizer
    organizer = ContinuousMemoryOrganizer("data/nova_ai_memory.json")
    
    # Start monitoring
    try:
        organizer.start_monitoring()
    except KeyboardInterrupt:
        organizer.stop_monitoring()
        print("\nAI Memory Organizer shutdown complete")

if __name__ == "__main__":
    main()