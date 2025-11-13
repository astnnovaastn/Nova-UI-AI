"""
Unified Fact History Format
Implements the unified fact_history format with personal_preferences consolidation.
"""
import json
import os
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass, field, asdict


@dataclass
class UnifiedPreferenceEntry:
    """Represents a unified preference entry in the fact_history format"""
    item: str
    score: float = 0.8
    added: str = field(default_factory=lambda: datetime.now().strftime('%Y-%m-%d'))
    updated: Optional[str] = None
    update_item: Optional[str] = None
    
    def __post_init__(self):
        # Ensure dates are in proper format
        if self.added and len(self.added) > 10:
            try:
                self.added = datetime.fromisoformat(self.added).strftime('%Y-%m-%d')
            except:
                self.added = datetime.now().strftime('%Y-%m-%d')
        if self.updated and len(self.updated) > 10:
            try:
                self.updated = datetime.fromisoformat(self.updated).strftime('%Y-%m-%d')
            except:
                self.updated = datetime.now().strftime('%Y-%m-%d')


class UnifiedFactHistory:
    """
    Unified fact_history format with personal_preferences consolidation.
    
    This implements the required format:
    {
      "personal_preferences": {
        "likes": [
          {
            "item": "anime",
            "score": 0.95,
            "added": "2024-01-15",
            "updated": "2024-02-20",
            "update_item": "I really love watching anime"
          }
        ],
        "dislikes": [...],
        "avoid": [...],
        "always": [...],
        "style": [...],
        "conditional": [...],
        "interests": [...]
      }
    }
    """
    
    def __init__(self, storage_file: str = None):
        """Initialize the unified fact history."""
        self.storage_file = storage_file
        self.fact_history = self._initialize_fact_history()
        if storage_file:
            self.load_fact_history()
    
    def _initialize_fact_history(self) -> Dict[str, Any]:
        """
        Initialize the fact_history structure with unified personal_preferences format.
        
        Returns:
            Dictionary with initialized fact_history structure
        """
        return {
            "personal_preferences": {
                "likes": [],
                "dislikes": [],
                "avoid": [],
                "always": [],
                "style": [],
                "conditional": [],
                "interests": []
            }
        }
    
    def add_preference(self, subcategory: str, item: str, score: float = 0.8, 
                      update_item: Optional[str] = None) -> bool:
        """
        Add a preference to the unified fact_history format.
        
        Args:
            subcategory: Preference subcategory (likes, dislikes, avoid, etc.)
            item: The preference item
            score: Confidence score (0.0 to 1.0)
            update_item: Optional update information for existing items
            
        Returns:
            True if added successfully, False otherwise
        """
        # Validate subcategory
        valid_subcategories = [
            "likes", "dislikes", "avoid", "always", "style", 
            "conditional", "interests"
        ]
        
        if subcategory not in valid_subcategories:
            return False
        
        # Check if item already exists to avoid duplicates
        existing_items = [pref.item for pref in 
                         self.fact_history["personal_preferences"][subcategory]]
        
        if item in existing_items:
            # Update existing item
            for i, pref in enumerate(self.fact_history["personal_preferences"][subcategory]):
                if pref.item == item:
                    # Update the item
                    self.fact_history["personal_preferences"][subcategory][i].updated = \
                        datetime.now().strftime('%Y-%m-%d')
                    self.fact_history["personal_preferences"][subcategory][i].score = score
                    if update_item:
                        self.fact_history["personal_preferences"][subcategory][i].update_item = update_item
                    break
        else:
            # Create new preference entry
            new_entry = UnifiedPreferenceEntry(
                item=item,
                score=min(max(score, 0.0), 1.0),  # Clamp between 0 and 1
                added=datetime.now().strftime('%Y-%m-%d'),
                updated=datetime.now().strftime('%Y-%m-%d') if update_item else None,
                update_item=update_item
            )
            
            # Add to the appropriate subcategory
            self.fact_history["personal_preferences"][subcategory].append(new_entry)
        
        # Save if storage file is specified
        if self.storage_file:
            self.save_fact_history()
        
        return True
    
    def update_preference(self, subcategory: str, old_item: str, new_item: str, 
                         score: float = 0.8, update_item: Optional[str] = None) -> bool:
        """
        Update an existing preference in the unified fact_history format.
        
        Args:
            subcategory: Preference subcategory (likes, dislikes, avoid, etc.)
            old_item: The existing preference item to update
            new_item: The new preference item value
            score: Confidence score (0.0 to 1.0)
            update_item: Optional update information
            
        Returns:
            True if updated successfully, False otherwise
        """
        # Validate subcategory
        valid_subcategories = [
            "likes", "dislikes", "avoid", "always", "style", 
            "conditional", "interests"
        ]
        
        if subcategory not in valid_subcategories:
            return False
        
        # Find and update the existing item
        for i, pref in enumerate(self.fact_history["personal_preferences"][subcategory]):
            if pref.item == old_item:
                # Update the item
                self.fact_history["personal_preferences"][subcategory][i].item = new_item
                self.fact_history["personal_preferences"][subcategory][i].updated = \
                    datetime.now().strftime('%Y-%m-%d')
                self.fact_history["personal_preferences"][subcategory][i].score = \
                    min(max(score, 0.0), 1.0)  # Clamp between 0 and 1
                if update_item:
                    self.fact_history["personal_preferences"][subcategory][i].update_item = update_item
                return True
        
        # Item not found
        return False
    
    def remove_preference(self, subcategory: str, item: str) -> bool:
        """
        Remove a preference from the unified fact_history format.
        
        Args:
            subcategory: Preference subcategory (likes, dislikes, avoid, etc.)
            item: The preference item to remove
            
        Returns:
            True if removed successfully, False otherwise
        """
        # Validate subcategory
        valid_subcategories = [
            "likes", "dislikes", "avoid", "always", "style", 
            "conditional", "interests"
        ]
        
        if subcategory not in valid_subcategories:
            return False
        
        # Find and remove the item
        for i, pref in enumerate(self.fact_history["personal_preferences"][subcategory]):
            if pref.item == item:
                del self.fact_history["personal_preferences"][subcategory][i]
                # Save if storage file is specified
                if self.storage_file:
                    self.save_fact_history()
                return True
        
        # Item not found
        return False
    
    def get_preferences(self, subcategory: str = None) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get preferences from the unified fact_history format.
        
        Args:
            subcategory: Optional specific subcategory to retrieve
            
        Returns:
            Dictionary with preference data in dictionary format
        """
        if subcategory:
            # Return specific subcategory
            if subcategory in self.fact_history["personal_preferences"]:
                return {
                    subcategory: [
                        asdict(pref) for pref in 
                        self.fact_history["personal_preferences"][subcategory]
                    ]
                }
            else:
                return {subcategory: []}
        else:
            # Return all subcategories
            result = {}
            for cat, prefs in self.fact_history["personal_preferences"].items():
                result[cat] = [asdict(pref) for pref in prefs]
            return result
    
    def get_preference_count(self, subcategory: str = None) -> int:
        """
        Get the count of preferences in the unified fact_history format.
        
        Args:
            subcategory: Optional specific subcategory to count
            
        Returns:
            Number of preference entries
        """
        if subcategory:
            if subcategory in self.fact_history["personal_preferences"]:
                return len(self.fact_history["personal_preferences"][subcategory])
            else:
                return 0
        else:
            # Count all preferences
            total = 0
            for prefs in self.fact_history["personal_preferences"].values():
                total += len(prefs)
            return total
    
    def search_preferences(self, query: str, subcategory: str = None) -> List[Dict[str, Any]]:
        """
        Search for preferences containing the query string.
        
        Args:
            query: Query string to search for
            subcategory: Optional specific subcategory to search in
            
        Returns:
            List of matching preference entries
        """
        query_lower = query.lower()
        matches = []
        
        if subcategory:
            # Search in specific subcategory
            if subcategory in self.fact_history["personal_preferences"]:
                for pref in self.fact_history["personal_preferences"][subcategory]:
                    if query_lower in pref.item.lower():
                        match_dict = asdict(pref)
                        match_dict["subcategory"] = subcategory
                        matches.append(match_dict)
        else:
            # Search in all subcategories
            for cat, prefs in self.fact_history["personal_preferences"].items():
                for pref in prefs:
                    if query_lower in pref.item.lower():
                        match_dict = asdict(pref)
                        match_dict["subcategory"] = cat
                        matches.append(match_dict)
        
        return matches
    
    def merge_preference_lists(self, source_history: Dict[str, Any]) -> bool:
        """
        Merge another fact_history structure into this one.
        
        Args:
            source_history: Source fact_history to merge from
            
        Returns:
            True if merged successfully, False otherwise
        """
        try:
            source_preferences = source_history.get("personal_preferences", {})
            
            # Merge each subcategory
            for subcategory, source_prefs in source_preferences.items():
                if subcategory in self.fact_history["personal_preferences"]:
                    # Add each preference from source
                    for source_pref in source_prefs:
                        if isinstance(source_pref, dict):
                            # Convert to UnifiedPreferenceEntry
                            pref_entry = UnifiedPreferenceEntry(
                                item=source_pref.get("item", ""),
                                score=source_pref.get("score", 0.8),
                                added=source_pref.get("added", datetime.now().strftime('%Y-%m-%d')),
                                updated=source_pref.get("updated"),
                                update_item=source_pref.get("update_item")
                            )
                            
                            # Check for duplicates
                            existing_items = [
                                pref.item for pref in 
                                self.fact_history["personal_preferences"][subcategory]
                            ]
                            
                            if pref_entry.item not in existing_items:
                                self.fact_history["personal_preferences"][subcategory].append(pref_entry)
                        elif hasattr(source_pref, 'item'):  # Already a UnifiedPreferenceEntry
                            # Check for duplicates
                            existing_items = [
                                pref.item for pref in 
                                self.fact_history["personal_preferences"][subcategory]
                            ]
                            
                            if source_pref.item not in existing_items:
                                self.fact_history["personal_preferences"][subcategory].append(source_pref)
            
            # Save if storage file is specified
            if self.storage_file:
                self.save_fact_history()
            
            return True
        except Exception as e:
            print(f"Error merging preference lists: {e}")
            return False
    
    def convert_legacy_format(self, legacy_data: Dict[str, Any]) -> bool:
        """
        Convert legacy fact_history format to unified format.
        
        Args:
            legacy_data: Legacy fact_history data to convert
            
        Returns:
            True if converted successfully, False otherwise
        """
        try:
            # Process legacy data structure
            for key, value in legacy_data.items():
                # Handle personal preference keys
                if key.startswith("personal_preferences.") or key in [
                    "likes", "dislikes", "avoid", "always", "style", 
                    "conditional", "interests"
                ]:
                    # Extract subcategory
                    if "." in key:
                        subcategory = key.split(".")[-1]
                    else:
                        subcategory = key
                    
                    # Validate subcategory
                    valid_subcategories = [
                        "likes", "dislikes", "avoid", "always", "style", 
                        "conditional", "interests"
                    ]
                    
                    if subcategory in valid_subcategories:
                        # Process value list
                        if isinstance(value, list):
                            for item in value:
                                if isinstance(item, dict):
                                    # Handle dictionary format
                                    item_value = item.get("item") or item.get("value") or str(item)
                                    item_score = item.get("score", 0.8)
                                    item_added = item.get("added", datetime.now().strftime('%Y-%m-%d'))
                                    item_updated = item.get("updated")
                                    item_update = item.get("update_item")
                                else:
                                    # Handle simple value format
                                    item_value = str(item)
                                    item_score = 0.8
                                    item_added = datetime.now().strftime('%Y-%m-%d')
                                    item_updated = None
                                    item_update = None
                                
                                # Add to unified format
                                self.add_preference(
                                    subcategory=subcategory,
                                    item=item_value,
                                    score=item_score,
                                    update_item=item_update
                                )
                                # Update the added date to match the original
                                for i, pref in enumerate(
                                    self.fact_history["personal_preferences"][subcategory]
                                ):
                                    if pref.item == item_value:
                                        self.fact_history["personal_preferences"][subcategory][i].added = item_added
                                        if item_updated:
                                            self.fact_history["personal_preferences"][subcategory][i].updated = item_updated
                                        break
                elif key == "interests" and isinstance(value, list):
                    # Special handling for interests
                    for item in value:
                        if isinstance(item, dict):
                            item_value = item.get("item") or item.get("value") or str(item)
                            item_score = item.get("score", 0.8)
                            item_added = item.get("added", datetime.now().strftime('%Y-%m-%d'))
                            item_updated = item.get("updated")
                            item_update = item.get("update_item")
                        else:
                            item_value = str(item)
                            item_score = 0.8
                            item_added = datetime.now().strftime('%Y-%m-%d')
                            item_updated = None
                            item_update = None
                        
                        # Add to interests subcategory
                        self.add_preference(
                            subcategory="interests",
                            item=item_value,
                            score=item_score,
                            update_item=item_update
                        )
                        # Update the added date to match the original
                        for i, pref in enumerate(
                            self.fact_history["personal_preferences"]["interests"]
                        ):
                            if pref.item == item_value:
                                self.fact_history["personal_preferences"]["interests"][i].added = item_added
                                if item_updated:
                                    self.fact_history["personal_preferences"]["interests"][i].updated = item_updated
                                break
            
            # Save if storage file is specified
            if self.storage_file:
                self.save_fact_history()
            
            return True
        except Exception as e:
            print(f"Error converting legacy format: {e}")
            return False
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about the unified fact history.
        
        Returns:
            Dictionary with fact history statistics
        """
        stats = {
            "total_preferences": 0,
            "subcategory_counts": {},
            "average_confidence": 0.0,
            "date_range": {
                "earliest": None,
                "latest": None
            }
        }
        
        total_score = 0.0
        score_count = 0
        all_dates = []
        
        # Process each subcategory
        for subcategory, prefs in self.fact_history["personal_preferences"].items():
            stats["subcategory_counts"][subcategory] = len(prefs)
            stats["total_preferences"] += len(prefs)
            
            # Collect scores and dates
            for pref in prefs:
                total_score += pref.score
                score_count += 1
                
                # Collect dates
                all_dates.append(pref.added)
                if pref.updated:
                    all_dates.append(pref.updated)
        
        # Calculate average confidence
        if score_count > 0:
            stats["average_confidence"] = total_score / score_count
        
        # Determine date range
        if all_dates:
            try:
                dates = [datetime.strptime(date_str, '%Y-%m-%d') for date_str in all_dates if date_str]
                if dates:
                    stats["date_range"]["earliest"] = min(dates).strftime('%Y-%m-%d')
                    stats["date_range"]["latest"] = max(dates).strftime('%Y-%m-%d')
            except Exception:
                pass  # Ignore date parsing errors
        
        return stats
    
    def save_fact_history(self):
        """Save the fact history to storage file."""
        if not self.storage_file:
            return
            
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.storage_file), exist_ok=True)
            
            # Convert to serializable format
            serializable_history = {}
            for cat, prefs in self.fact_history.items():
                if cat == "personal_preferences":
                    serializable_history[cat] = {}
                    for subcat, subprefs in prefs.items():
                        serializable_history[cat][subcat] = [asdict(pref) for pref in subprefs]
                else:
                    serializable_history[cat] = prefs
            
            # Write to file
            with open(self.storage_file, 'w', encoding='utf-8') as f:
                json.dump(serializable_history, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving fact history: {e}")
    
    def load_fact_history(self):
        """Load the fact history from storage file."""
        if not self.storage_file or not os.path.exists(self.storage_file):
            return
            
        try:
            with open(self.storage_file, 'r', encoding='utf-8') as f:
                loaded_data = json.load(f)
            
            # Convert loaded data to proper format
            self.fact_history = self._initialize_fact_history()
            
            if "personal_preferences" in loaded_data:
                for subcategory, prefs in loaded_data["personal_preferences"].items():
                    if subcategory in self.fact_history["personal_preferences"]:
                        for pref_data in prefs:
                            if isinstance(pref_data, dict):
                                pref_entry = UnifiedPreferenceEntry(
                                    item=pref_data.get("item", ""),
                                    score=pref_data.get("score", 0.8),
                                    added=pref_data.get("added", datetime.now().strftime('%Y-%m-%d')),
                                    updated=pref_data.get("updated"),
                                    update_item=pref_data.get("update_item")
                                )
                                self.fact_history["personal_preferences"][subcategory].append(pref_entry)
        except Exception as e:
            print(f"Error loading fact history: {e}")
            # Initialize with default structure
            self.fact_history = self._initialize_fact_history()


# Example usage and test
if __name__ == "__main__":
    # Create unified fact history
    fact_history = UnifiedFactHistory()
    
    print("Unified Fact History Test:")
    print("=" * 35)
    
    # Add some sample preferences
    sample_preferences = [
        ("likes", "anime", 0.95, "I love watching anime shows"),
        ("likes", "manga", 0.90, "I enjoy reading manga comics"),
        ("dislikes", "spicy food", 0.85, "I hate spicy Japanese dishes"),
        ("avoid", "horror movies", 0.80, "I avoid scary horror films"),
        ("interests", "Japanese culture", 0.88, "I'm interested in Japanese traditions"),
        ("style", "formal communication", 0.75, "Keep responses professional"),
    ]
    
    # Add preferences
    for subcategory, item, score, update_item in sample_preferences:
        success = fact_history.add_preference(subcategory, item, score, update_item)
        print(f"Added {subcategory}: '{item}' - Success: {success}")
    
    print("\nCurrent preferences:")
    all_prefs = fact_history.get_preferences()
    for subcategory, prefs in all_prefs.items():
        print(f"  {subcategory}: {len(prefs)} items")
        for pref in prefs[:3]:  # Show first 3 items
            print(f"    - {pref['item']} (score: {pref['score']:.2f})")
    
    print("\nSearching for 'anime':")
    anime_prefs = fact_history.search_preferences("anime")
    for pref in anime_prefs:
        print(f"  Found in {pref['subcategory']}: {pref['item']}")
    
    print("\nStatistics:")
    stats = fact_history.get_statistics()
    print(f"  Total preferences: {stats['total_preferences']}")
    print(f"  Average confidence: {stats['average_confidence']:.2f}")
    print("  Subcategory counts:")
    for subcat, count in stats['subcategory_counts'].items():
        print(f"    {subcat}: {count}")
    
    print("\nUpdating preference:")
    success = fact_history.update_preference("likes", "anime", "Japanese animation", 
                                           0.98, "I'm really into Japanese animation")
    print(f"Updated 'anime' to 'Japanese animation': {success}")
    
    print("\nLikes after update:")
    likes = fact_history.get_preferences("likes")
    for pref in likes["likes"]:
        print(f"  - {pref['item']} (updated: {pref['updated']})")
    
    print("\nTest completed successfully!")