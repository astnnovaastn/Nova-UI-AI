#!/usr/bin/env python3
"""
Notes Service for Nova AI

This service handles saving, retrieving, and managing user notes.
It provides a backend for the enhanced notes widget.
"""

import json
import os
import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

class NotesService:
    """Service for managing user notes with enhanced features."""
    
    def __init__(self, data_directory: str = "data"):
        """
        Initialize the Notes Service.
        
        Args:
            data_directory: Directory to store notes data
        """
        self.data_dir = Path(data_directory)
        self.data_dir.mkdir(exist_ok=True)
        
        self.notes_file = self.data_dir / "user_notes.json"
        self.notes_backup_file = self.data_dir / "user_notes_backup.json"
        
        # Initialize notes storage
        self.notes = self._load_notes()
    
    def _load_notes(self) -> List[Dict[str, Any]]:
        """Load notes from storage."""
        try:
            if self.notes_file.exists():
                with open(self.notes_file, 'r', encoding='utf-8') as f:
                    notes = json.load(f)
                    # Ensure each note has required fields
                    for note in notes:
                        if 'id' not in note:
                            note['id'] = str(int(datetime.datetime.now().timestamp() * 1000))
                        if 'created_at' not in note:
                            note['created_at'] = datetime.datetime.now().isoformat()
                        if 'updated_at' not in note:
                            note['updated_at'] = note['created_at']
                    return notes
            return []
        except Exception as e:
            print(f"Error loading notes: {e}")
            # Try to load from backup
            try:
                if self.notes_backup_file.exists():
                    with open(self.notes_backup_file, 'r', encoding='utf-8') as f:
                        return json.load(f)
            except Exception as backup_e:
                print(f"Error loading backup notes: {backup_e}")
            return []
    
    def _save_notes(self) -> bool:
        """Save notes to storage with backup."""
        try:
            # Create backup first
            if self.notes_file.exists():
                with open(self.notes_file, 'r', encoding='utf-8') as f:
                    backup_data = f.read()
                with open(self.notes_backup_file, 'w', encoding='utf-8') as f:
                    f.write(backup_data)
            
            # Save current notes
            with open(self.notes_file, 'w', encoding='utf-8') as f:
                json.dump(self.notes, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            print(f"Error saving notes: {e}")
            return False
    
    def create_note(self, content: str, title: str = "", tags: List[str] = None) -> Dict[str, Any]:
        """
        Create a new note.
        
        Args:
            content: The note content
            title: Optional title for the note
            tags: Optional list of tags
            
        Returns:
            Dictionary containing the created note
        """
        if not content.strip():
            raise ValueError("Note content cannot be empty")
        
        now = datetime.datetime.now()
        note_id = str(int(now.timestamp() * 1000))
        
        # Generate title if not provided
        if not title:
            title = content[:50] + "..." if len(content) > 50 else content
        
        note = {
            "id": note_id,
            "title": title,
            "content": content,
            "tags": tags or [],
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "word_count": len(content.split()),
            "char_count": len(content),
            "preview": content[:120] + "..." if len(content) > 120 else content
        }
        
        self.notes.insert(0, note)  # Add to beginning for newest first
        self._save_notes()
        
        return note
    
    def get_note(self, note_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific note by ID.
        
        Args:
            note_id: The note ID
            
        Returns:
            Note dictionary or None if not found
        """
        for note in self.notes:
            if note["id"] == note_id:
                return note
        return None
    
    def get_all_notes(self) -> List[Dict[str, Any]]:
        """
        Get all notes.
        
        Returns:
            List of all notes
        """
        return self.notes.copy()
    
    def update_note(self, note_id: str, content: str = None, title: str = None, tags: List[str] = None) -> Optional[Dict[str, Any]]:
        """
        Update an existing note.
        
        Args:
            note_id: The note ID
            content: New content (optional)
            title: New title (optional)
            tags: New tags (optional)
            
        Returns:
            Updated note dictionary or None if not found
        """
        for note in self.notes:
            if note["id"] == note_id:
                if content is not None:
                    note["content"] = content
                    note["word_count"] = len(content.split())
                    note["char_count"] = len(content)
                    note["preview"] = content[:120] + "..." if len(content) > 120 else content
                
                if title is not None:
                    note["title"] = title
                
                if tags is not None:
                    note["tags"] = tags
                
                note["updated_at"] = datetime.datetime.now().isoformat()
                self._save_notes()
                return note
        return None
    
    def delete_note(self, note_id: str) -> bool:
        """
        Delete a note.
        
        Args:
            note_id: The note ID
            
        Returns:
            True if deleted, False if not found
        """
        for i, note in enumerate(self.notes):
            if note["id"] == note_id:
                del self.notes[i]
                self._save_notes()
                return True
        return False
    
    def search_notes(self, query: str, search_content: bool = True, search_tags: bool = True) -> List[Dict[str, Any]]:
        """
        Search notes by content or tags.
        
        Args:
            query: Search query
            search_content: Whether to search in content
            search_tags: Whether to search in tags
            
        Returns:
            List of matching notes
        """
        if not query.strip():
            return self.notes.copy()
        
        query_lower = query.lower()
        matches = []
        
        for note in self.notes:
            found = False
            
            if search_content:
                if (query_lower in note["content"].lower() or 
                    query_lower in note["title"].lower()):
                    found = True
            
            if search_tags and note["tags"]:
                for tag in note["tags"]:
                    if query_lower in tag.lower():
                        found = True
                        break
            
            if found:
                matches.append(note)
        
        return matches
    
    def get_notes_by_tag(self, tag: str) -> List[Dict[str, Any]]:
        """
        Get notes by tag.
        
        Args:
            tag: Tag to search for
            
        Returns:
            List of notes with the specified tag
        """
        tag_lower = tag.lower()
        return [note for note in self.notes if any(t.lower() == tag_lower for t in note["tags"])]
    
    def get_all_tags(self) -> List[str]:
        """
        Get all unique tags.
        
        Returns:
            List of all unique tags
        """
        all_tags = set()
        for note in self.notes:
            all_tags.update(note["tags"])
        return sorted(list(all_tags))
    
    def get_notes_stats(self) -> Dict[str, Any]:
        """
        Get statistics about notes.
        
        Returns:
            Dictionary with notes statistics
        """
        if not self.notes:
            return {
                "total_notes": 0,
                "total_words": 0,
                "total_characters": 0,
                "unique_tags": 0,
                "oldest_note": None,
                "newest_note": None
            }
        
        total_words = sum(note["word_count"] for note in self.notes)
        total_chars = sum(note["char_count"] for note in self.notes)
        
        # Sort by creation date for oldest/newest
        sorted_notes = sorted(self.notes, key=lambda x: x["created_at"])
        
        return {
            "total_notes": len(self.notes),
            "total_words": total_words,
            "total_characters": total_chars,
            "unique_tags": len(self.get_all_tags()),
            "oldest_note": sorted_notes[0]["created_at"] if sorted_notes else None,
            "newest_note": sorted_notes[-1]["created_at"] if sorted_notes else None
        }
    
    def export_notes(self, format: str = "json") -> str:
        """
        Export notes to various formats.
        
        Args:
            format: Export format ('json', 'markdown', 'txt')
            
        Returns:
            Exported data as string
        """
        if format == "json":
            return json.dumps(self.notes, indent=2, ensure_ascii=False)
        
        elif format == "markdown":
            markdown_content = ["# My Notes\n"]
            for note in self.notes:
                markdown_content.append(f"## {note['title']}")
                markdown_content.append(f"**Created:** {note['created_at']}")
                if note['tags']:
                    markdown_content.append(f"**Tags:** {', '.join(note['tags'])}")
                markdown_content.append(f"\n{note['content']}\n")
                markdown_content.append("---\n")
            return "\n".join(markdown_content)
        
        elif format == "txt":
            text_content = ["MY NOTES\n" + "=" * 50 + "\n"]
            for note in self.notes:
                text_content.append(f"TITLE: {note['title']}")
                text_content.append(f"CREATED: {note['created_at']}")
                if note['tags']:
                    text_content.append(f"TAGS: {', '.join(note['tags'])}")
                text_content.append(f"\nCONTENT:\n{note['content']}\n")
                text_content.append("-" * 50 + "\n")
            return "\n".join(text_content)
        
        else:
            raise ValueError(f"Unsupported export format: {format}")
    
    def import_notes(self, data: str, format: str = "json") -> int:
        """
        Import notes from various formats.
        
        Args:
            data: Import data as string
            format: Import format ('json')
            
        Returns:
            Number of notes imported
        """
        if format == "json":
            try:
                imported_notes = json.loads(data)
                if not isinstance(imported_notes, list):
                    raise ValueError("JSON must contain a list of notes")
                
                imported_count = 0
                for note_data in imported_notes:
                    if "content" in note_data:
                        # Create note (this will generate new ID and timestamps)
                        self.create_note(
                            content=note_data["content"],
                            title=note_data.get("title", ""),
                            tags=note_data.get("tags", [])
                        )
                        imported_count += 1
                
                return imported_count
            except Exception as e:
                raise ValueError(f"Error importing JSON: {e}")
        
        else:
            raise ValueError(f"Unsupported import format: {format}")
    
    def clear_all_notes(self) -> bool:
        """
        Clear all notes (use with caution).
        
        Returns:
            True if successful
        """
        self.notes = []
        return self._save_notes()

# Example usage and testing
if __name__ == "__main__":
    # Initialize service
    notes_service = NotesService()
    
    # Create some sample notes
    note1 = notes_service.create_note("This is my first note about Python programming", "Python Notes", ["programming", "python"])
    note2 = notes_service.create_note("Remember to check the weather tomorrow", "Weather Reminder", ["reminder", "weather"])
    note3 = notes_service.create_note("Ideas for the new project: AI assistant, note-taking, widget system", "Project Ideas", ["ideas", "project"])
    
    print(f"Created {len(notes_service.get_all_notes())} notes")
    
    # Test search
    search_results = notes_service.search_notes("python")
    print(f"Found {len(search_results)} notes containing 'python'")
    
    # Test stats
    stats = notes_service.get_notes_stats()
    print(f"Stats: {stats}")
    
    # Test export
    exported = notes_service.export_notes("markdown")
    print(f"Exported {len(exported)} characters in markdown format")