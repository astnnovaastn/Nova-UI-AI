"""
Update Log System
Tracks preference evolution and changes over time with detailed logging.
"""
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum


class UpdateType(Enum):
    """Types of updates that can occur"""
    REFINEMENT = "refinement"        # Gradual or detailed evolution
    REVERSAL = "reversal"           # Opposite meaning or sentiment
    REINFORCEMENT = "reinforcement"  # Same meaning but stronger tone
    HABIT_CHANGE = "habit_change"   # Change in behavior or repeated context


@dataclass
class UpdateLogEntry:
    """Represents a single update log entry"""
    update_id: str
    source_event: str  # ID of the new UPDATE event
    replaced_event: str  # ID of the previous event being updated
    timestamp: str
    similarity_score: float  # Cosine similarity between the two events
    update_type: str  # Type of update (refinement, reversal, reinforcement, habit_change)
    note: str = ""
    confidence: float = 0.85
    semantic_context: Dict[str, Any] = field(default_factory=dict)


class UpdateLogger:
    """
    Update logger that tracks how preferences evolve over time and maintains
    a detailed history of all changes for analysis and retrieval.
    """
    
    def __init__(self):
        """Initialize the update logger."""
        self.update_log: List[UpdateLogEntry] = []
        self.event_update_history: Dict[str, List[str]] = {}  # Maps event_id to list of update_ids
    
    def create_update_log_entry(self, source_event_id: str, replaced_event_id: str, 
                               similarity_score: float, update_type: str,
                               additional_context: Dict[str, Any] = None) -> str:
        """
        Create an entry in the update log for tracking how preferences evolve.
        
        Args:
            source_event_id: ID of the new UPDATE event
            replaced_event_id: ID of the previous event being updated
            similarity_score: Cosine similarity between the two events
            update_type: Type of update (refinement, reversal, reinforcement, habit_change)
            additional_context: Optional additional context for the update
            
        Returns:
            The ID of the created update log entry
        """
        update_id = f"upd_{uuid.uuid4().hex[:8]}"
        
        # Create semantic context from additional context
        semantic_context = {
            "source_event": source_event_id,
            "replaced_event": replaced_event_id,
            "update_type": update_type,
            "similarity_score": similarity_score
        }
        
        if additional_context:
            semantic_context.update(additional_context)
        
        # Create the update log entry
        update_entry = UpdateLogEntry(
            update_id=update_id,
            source_event=source_event_id,
            replaced_event=replaced_event_id,
            timestamp=datetime.now().isoformat(),
            similarity_score=similarity_score,
            update_type=update_type,
            note=f"Updated {update_type} with similarity {similarity_score:.3f}",
            semantic_context=semantic_context
        )
        
        # Add to update log
        self.update_log.append(update_entry)
        
        # Track this update in the event history
        if source_event_id not in self.event_update_history:
            self.event_update_history[source_event_id] = []
        self.event_update_history[source_event_id].append(update_id)
        
        if replaced_event_id not in self.event_update_history:
            self.event_update_history[replaced_event_id] = []
        self.event_update_history[replaced_event_id].append(update_id)
        
        return update_id
    
    def get_update_history(self, event_id: str) -> List[UpdateLogEntry]:
        """
        Get the complete update history for a specific event.
        
        Args:
            event_id: ID of the event to get history for
            
        Returns:
            List of update log entries related to this event
        """
        update_ids = self.event_update_history.get(event_id, [])
        history = []
        
        for update_id in update_ids:
            for entry in self.update_log:
                if entry.update_id == update_id:
                    history.append(entry)
                    break
        
        # Sort by timestamp (oldest first)
        history.sort(key=lambda x: x.timestamp)
        return history
    
    def get_updates_by_type(self, update_type: str) -> List[UpdateLogEntry]:
        """
        Get all updates of a specific type.
        
        Args:
            update_type: Type of update to filter by
            
        Returns:
            List of update log entries of the specified type
        """
        return [entry for entry in self.update_log if entry.update_type == update_type]
    
    def get_updates_by_similarity_range(self, min_similarity: float, 
                                       max_similarity: float) -> List[UpdateLogEntry]:
        """
        Get updates within a specific similarity score range.
        
        Args:
            min_similarity: Minimum similarity score
            max_similarity: Maximum similarity score
            
        Returns:
            List of update log entries within the similarity range
        """
        return [
            entry for entry in self.update_log 
            if min_similarity <= entry.similarity_score <= max_similarity
        ]
    
    def get_recent_updates(self, hours: int = 24) -> List[UpdateLogEntry]:
        """
        Get recent updates within the specified number of hours.
        
        Args:
            hours: Number of hours to look back (default 24)
            
        Returns:
            List of recent update log entries
        """
        cutoff_time = datetime.now().timestamp() - (hours * 3600)
        recent_updates = []
        
        for entry in self.update_log:
            try:
                entry_time = datetime.fromisoformat(entry.timestamp).timestamp()
                if entry_time >= cutoff_time:
                    recent_updates.append(entry)
            except ValueError:
                # Handle invalid timestamp formats
                continue
        
        # Sort by timestamp (newest first)
        recent_updates.sort(key=lambda x: x.timestamp, reverse=True)
        return recent_updates
    
    def get_update_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about the update log.
        
        Returns:
            Dictionary with update statistics
        """
        if not self.update_log:
            return {
                "total_updates": 0,
                "update_types": {},
                "average_similarity": 0.0,
                "similarity_distribution": {},
                "events_with_updates": 0
            }
        
        # Count update types
        update_type_counts = {}
        for entry in self.update_log:
            update_type = entry.update_type
            update_type_counts[update_type] = update_type_counts.get(update_type, 0) + 1
        
        # Calculate average similarity
        total_similarity = sum(entry.similarity_score for entry in self.update_log)
        average_similarity = total_similarity / len(self.update_log)
        
        # Create similarity distribution
        similarity_ranges = {
            "0.0-0.2": 0,
            "0.2-0.4": 0,
            "0.4-0.6": 0,
            "0.6-0.8": 0,
            "0.8-1.0": 0
        }
        
        for entry in self.update_log:
            similarity = entry.similarity_score
            if similarity <= 0.2:
                similarity_ranges["0.0-0.2"] += 1
            elif similarity <= 0.4:
                similarity_ranges["0.2-0.4"] += 1
            elif similarity <= 0.6:
                similarity_ranges["0.4-0.6"] += 1
            elif similarity <= 0.8:
                similarity_ranges["0.6-0.8"] += 1
            else:
                similarity_ranges["0.8-1.0"] += 1
        
        # Count unique events with updates
        unique_events = set()
        for entry in self.update_log:
            unique_events.add(entry.source_event)
            unique_events.add(entry.replaced_event)
        
        return {
            "total_updates": len(self.update_log),
            "update_types": update_type_counts,
            "average_similarity": average_similarity,
            "similarity_distribution": similarity_ranges,
            "events_with_updates": len(unique_events)
        }
    
    def get_update_summary(self, event_id: str) -> Dict[str, Any]:
        """
        Get a summary of updates for a specific event.
        
        Args:
            event_id: ID of the event to summarize
            
        Returns:
            Dictionary with update summary for the event
        """
        history = self.get_update_history(event_id)
        
        if not history:
            return {
                "event_id": event_id,
                "total_updates": 0,
                "update_types": {},
                "first_update": None,
                "latest_update": None,
                "average_similarity": 0.0
            }
        
        # Count update types
        update_type_counts = {}
        total_similarity = 0.0
        
        for entry in history:
            update_type = entry.update_type
            update_type_counts[update_type] = update_type_counts.get(update_type, 0) + 1
            total_similarity += entry.similarity_score
        
        # Get timestamps
        timestamps = [entry.timestamp for entry in history]
        first_update = min(timestamps) if timestamps else None
        latest_update = max(timestamps) if timestamps else None
        
        average_similarity = total_similarity / len(history) if history else 0.0
        
        return {
            "event_id": event_id,
            "total_updates": len(history),
            "update_types": update_type_counts,
            "first_update": first_update,
            "latest_update": latest_update,
            "average_similarity": average_similarity
        }
    
    def find_reversals(self) -> List[UpdateLogEntry]:
        """
        Find all reversal updates where preferences changed to opposite meaning.
        
        Returns:
            List of reversal update log entries
        """
        return self.get_updates_by_type(UpdateType.REVERSAL.value)
    
    def find_reinforcements(self) -> List[UpdateLogEntry]:
        """
        Find all reinforcement updates where preferences became stronger.
        
        Returns:
            List of reinforcement update log entries
        """
        return self.get_updates_by_type(UpdateType.REINFORCEMENT.value)
    
    def export_update_log(self) -> List[Dict[str, Any]]:
        """
        Export the complete update log as a list of dictionaries.
        
        Returns:
            List of update log entries as dictionaries
        """
        return [entry.__dict__ for entry in self.update_log]
    
    def import_update_log(self, update_log_data: List[Dict[str, Any]]):
        """
        Import update log data from a list of dictionaries.
        
        Args:
            update_log_data: List of update log entries as dictionaries
        """
        self.update_log = []
        self.event_update_history = {}
        
        for entry_data in update_log_data:
            # Create UpdateLogEntry from dictionary
            entry = UpdateLogEntry(**entry_data)
            self.update_log.append(entry)
            
            # Rebuild event update history
            source_event = entry.source_event
            replaced_event = entry.replaced_event
            update_id = entry.update_id
            
            if source_event not in self.event_update_history:
                self.event_update_history[source_event] = []
            self.event_update_history[source_event].append(update_id)
            
            if replaced_event not in self.event_update_history:
                self.event_update_history[replaced_event] = []
            self.event_update_history[replaced_event].append(update_id)
    
    def clear_old_updates(self, days_to_keep: int = 30) -> int:
        """
        Clear old update log entries older than specified days.
        
        Args:
            days_to_keep: Number of days to keep updates (default 30)
            
        Returns:
            Number of entries removed
        """
        cutoff_time = datetime.now().timestamp() - (days_to_keep * 24 * 3600)
        entries_to_remove = []
        
        for i, entry in enumerate(self.update_log):
            try:
                entry_time = datetime.fromisoformat(entry.timestamp).timestamp()
                if entry_time < cutoff_time:
                    entries_to_remove.append(i)
            except ValueError:
                # Handle invalid timestamp formats
                entries_to_remove.append(i)
        
        # Remove entries in reverse order to maintain indices
        for i in reversed(entries_to_remove):
            removed_entry = self.update_log.pop(i)
            # Remove from event update history
            if removed_entry.source_event in self.event_update_history:
                if removed_entry.update_id in self.event_update_history[removed_entry.source_event]:
                    self.event_update_history[removed_entry.source_event].remove(removed_entry.update_id)
            if removed_entry.replaced_event in self.event_update_history:
                if removed_entry.update_id in self.event_update_history[removed_entry.replaced_event]:
                    self.event_update_history[removed_entry.replaced_event].remove(removed_entry.update_id)
        
        return len(entries_to_remove)


# Example usage and test
if __name__ == "__main__":
    # Create update logger
    update_logger = UpdateLogger()
    
    print("Update Logger Test:")
    print("=" * 30)
    
    # Create some sample update log entries
    sample_updates = [
        ("evt_new_001", "evt_old_001", 0.85, "refinement", 
         {"context": "Gradual preference evolution"}),
        ("evt_new_002", "evt_old_002", 0.92, "reversal", 
         {"context": "Complete preference reversal"}),
        ("evt_new_003", "evt_old_003", 0.78, "reinforcement", 
         {"context": "Strengthened existing preference"}),
        ("evt_new_004", "evt_old_004", 0.65, "habit_change", 
         {"context": "Changed behavioral pattern"})
    ]
    
    # Add updates to log
    for source_event, replaced_event, similarity, update_type, context in sample_updates:
        update_id = update_logger.create_update_log_entry(
            source_event, replaced_event, similarity, update_type, context
        )
        print(f"Created update {update_id}: {update_type} ({similarity:.2f})")
    
    print("\nUpdate Statistics:")
    stats = update_logger.get_update_statistics()
    print(f"Total updates: {stats['total_updates']}")
    print(f"Average similarity: {stats['average_similarity']:.3f}")
    print(f"Events with updates: {stats['events_with_updates']}")
    print("Update types:")
    for update_type, count in stats['update_types'].items():
        print(f"  {update_type}: {count}")
    
    print("\nRecent Updates (last 24 hours):")
    recent = update_logger.get_recent_updates(24)
    print(f"Found {len(recent)} recent updates")
    
    print("\nUpdate Summary for evt_new_001:")
    summary = update_logger.get_update_summary("evt_new_001")
    print(f"  Total updates: {summary['total_updates']}")
    print(f"  Average similarity: {summary['average_similarity']:.3f}")
    print(f"  Latest update: {summary['latest_update']}")
    
    print("\nFinding reversals:")
    reversals = update_logger.find_reversals()
    print(f"Found {len(reversals)} reversal updates")
    
    print("\nExporting update log:")
    exported = update_logger.export_update_log()
    print(f"Exported {len(exported)} update entries")