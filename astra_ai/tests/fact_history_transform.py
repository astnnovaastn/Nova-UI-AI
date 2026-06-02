"""
Transform fact_history to unified, short, clean format.

This module provides functionality to transform the existing fact_history JSON structure
into a unified format that consolidates all personal preferences under a single
personal_preferences object with clean, standardized entries while preserving all data.
"""

import json
from datetime import datetime
from typing import Dict, List, Any, Optional


def transform_fact_history_to_unified_format(fact_history: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform the existing fact_history structure to a unified, clean format.
    
    Args:
        fact_history: Original fact_history dictionary with flat structure
        
    Returns:
        Dict with unified personal_preferences structure
    """
    # Create the new structure with preserved non-personal-preference entries
    new_fact_history = {}
    
    # Define the personal preference types that need to be unified
    personal_pref_types = [
        "personal_preferences.likes",
        "personal_preferences.dislikes", 
        "personal_preferences.avoid",
        "personal_preferences.always",
        "personal_preferences.style",
        "personal_preferences.conditional",
        "interests"
    ]
    
    # Group all personal preferences together
    personal_preferences = {
        "likes": [],
        "dislikes": [],
        "avoid": [],
        "always": [],
        "style": [],
        "conditional": [],
        "interests": []
    }
    
    # Process all entries in the original fact_history
    for key, value in fact_history.items():
        if key in personal_pref_types:
            # Extract the subcategory (the part after the dot or 'interests')
            if key == "interests":
                subcategory = "interests"
            else:
                subcategory = key.split('.')[-1]
            
            # Process each entry in the value list
            for item in value:
                processed_item = _process_preference_item(item, subcategory)
                if processed_item:
                    personal_preferences[subcategory].append(processed_item)
        else:
            # Preserve non-personal preference entries as they are
            new_fact_history[key] = value
    
    # Add the unified personal_preferences section
    new_fact_history["personal_preferences"] = personal_preferences
    
    return new_fact_history


def _process_preference_item(item: Dict[str, Any], subcategory: str) -> Optional[Dict[str, Any]]:
    """
    Process a single preference item to extract 'item', 'added', 'updated', and 'score'.
    
    Args:
        item: Individual preference item from the fact_history
        subcategory: The subcategory of the preference
        
    Returns:
        Processed item with standardized format, or None if invalid
    """
    if not isinstance(item, dict):
        return None
    
    # Extract the item value and additional metadata
    value_str = item.get("value", "")
    timestamp = item.get("timestamp", "")
    confidence = item.get("confidence", 0.8)
    status = item.get("status", "current")
    
    # Parse the value field to extract the actual item
    # It can be in the form "[{'item': 'love', 'added_at': '2025-10-12T17:11:22.358875'}]"
    # or it can be a simple string
    actual_item = None
    added_at = ""
    
    if isinstance(value_str, str) and value_str.startswith("[{"):
        # This appears to be a serialized list containing item and timestamp
        try:
            parsed_values = json.loads(value_str)
            if isinstance(parsed_values, list) and len(parsed_values) > 0:
                first_entry = parsed_values[0]
                if isinstance(first_entry, dict):
                    actual_item = first_entry.get("item", value_str)
                    added_at = first_entry.get("added_at", "")
        except json.JSONDecodeError:
            # If JSON parsing fails, use the value string as the item
            actual_item = value_str
    elif isinstance(value_str, str):
        # It might be a string like "love" or just the item itself
        actual_item = value_str
    elif isinstance(value_str, dict):
        # It might already be in the right format
        actual_item = value_str.get("item", str(value_str))
        added_at = value_str.get("added_at", "")
    else:
        # Just convert to string
        actual_item = str(value_str)
    
    # Use timestamp as added_at if no added_at was found in value
    if not added_at and timestamp:
        added_at = timestamp
    
    # Extract date part (YYYY-MM-DD) from ISO format timestamp
    added_date = _extract_date_from_timestamp(added_at)
    updated_date = _extract_date_from_timestamp(timestamp)
    
    if not actual_item:
        return None
    
    # Create the standardized entry
    return {
        "item": actual_item,
        "score": confidence,
        "added": added_date,
        "updated": updated_date
    }


def _extract_date_from_timestamp(timestamp: str) -> str:
    """
    Extract date in YYYY-MM-DD format from ISO timestamp.
    
    Args:
        timestamp: ISO format timestamp string
        
    Returns:
        Date in YYYY-MM-DD format or original string if parsing fails
    """
    if not timestamp:
        return ""
    
    try:
        # Parse the timestamp and extract just the date part
        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00').split('.')[0])
        return dt.strftime('%Y-%m-%d')
    except ValueError:
        # If parsing fails, return the original timestamp
        return timestamp


def append_new_preference_entry(fact_history: Dict[str, Any], 
                               pref_type: str, 
                               item_value: str, 
                               confidence: float = 0.8,
                               timestamp: str = None) -> Dict[str, Any]:
    """
    Append a new preference entry to the unified fact_history structure.
    
    Args:
        fact_history: The fact_history dictionary (in unified format)
        pref_type: Type of preference (e.g., 'likes', 'dislikes', 'interests')
        item_value: The actual preference item
        confidence: Confidence score (default 0.8)
        timestamp: ISO timestamp (will use current time if None)
        
    Returns:
        Updated fact_history with the new entry appended
    """
    if timestamp is None:
        timestamp = datetime.now().isoformat()
    
    # Ensure the personal_preferences section exists
    if "personal_preferences" not in fact_history:
        fact_history["personal_preferences"] = {
            "likes": [],
            "dislikes": [],
            "avoid": [],
            "always": [],
            "style": [],
            "conditional": [],
            "interests": []
        }
    
    # Create the new preference entry
    new_entry = {
        "item": item_value,
        "score": confidence,
        "added": _extract_date_from_timestamp(timestamp),
        "updated": _extract_date_from_timestamp(timestamp)
    }
    
    # Append to the appropriate preference type
    if pref_type in fact_history["personal_preferences"]:
        fact_history["personal_preferences"][pref_type].append(new_entry)
    else:
        # If the preference type doesn't exist, create it
        fact_history["personal_preferences"][pref_type] = [new_entry]
    
    return fact_history


def transform_complete_memory_file(memory_file_path: str) -> None:
    """
    Transform an entire memory file's fact_history structure.
    
    Args:
        memory_file_path: Path to the memory JSON file (e.g., nova_ai_memory.json)
    """
    # Load the memory file
    with open(memory_file_path, 'r', encoding='utf-8') as f:
        memory_data = json.load(f)
    
    # Transform the fact_history
    original_fact_history = memory_data.get("fact_history", {})
    transformed_fact_history = transform_fact_history_to_unified_format(original_fact_history)
    
    # Update the memory data
    memory_data["fact_history"] = transformed_fact_history
    
    # Save the updated memory file
    with open(memory_file_path, 'w', encoding='utf-8') as f:
        json.dump(memory_data, f, indent=2, ensure_ascii=False)


# Example usage and test function
def test_transformation():
    """Test the transformation with sample data."""
    # Sample original fact_history structure
    sample_fact_history = {
        "name": [
            {
                "value": "John Doe",
                "timestamp": "2025-10-12T17:34:16.695305",
                "status": "current",
                "confidence": 0.9
            }
        ],
        "personal_preferences.likes": [
            {
                "value": "[{'item': 'love programming', 'added_at': '2025-10-12T17:11:22.358875'}]",
                "timestamp": "2025-10-12T17:34:16.695305",
                "status": "current",
                "confidence": 0.8
            },
            {
                "value": "[{'item': 'coffee', 'added_at': '2025-10-13T10:15:30.123456'}]",
                "timestamp": "2025-10-13T11:20:45.789012",
                "status": "current",
                "confidence": 0.9
            }
        ],
        "personal_preferences.dislikes": [
            {
                "value": "[{'item': 'debugging my scripts', 'added_at': '2025-10-12T16:45:10.987654'}]",
                "timestamp": "2025-10-12T17:34:16.695305",
                "status": "current",
                "confidence": 0.7
            }
        ],
        "personal_preferences.avoid": [
            {
                "value": "[{'item': 'junk food like mcdonald\\'s', 'added_at': '2025-10-11T09:30:15.543210'}]",
                "timestamp": "2025-10-11T10:00:20.098765",
                "status": "current",
                "confidence": 0.85
            }
        ],
        "personal_preferences.always": [
            {
                "value": "[{'item': 'drink coffee before studying', 'added_at': '2025-10-10T08:15:45.111222'}]",
                "timestamp": "2025-10-10T08:30:50.333444",
                "status": "current",
                "confidence": 0.95
            }
        ],
        "personal_preferences.style": [
            {
                "value": "[{'item': 'keep it minimal', 'added_at': '2025-10-09T14:20:30.555666'}]",
                "timestamp": "2025-10-09T14:45:35.777888",
                "status": "current",
                "confidence": 0.75
            }
        ],
        "personal_preferences.conditional": [
            {
                "value": "[{'item': 'only exercise when feeling energetic', 'added_at': '2025-10-08T07:00:12.999000'}]",
                "timestamp": "2025-10-08T07:15:18.111222",
                "status": "current",
                "confidence": 0.8
            }
        ],
        "interests": [
            {
                "value": "[{'item': 'Javascript next', 'added_at': '2025-10-07T16:30:44.333444'}]",
                "timestamp": "2025-10-07T17:00:50.555666",
                "status": "current",
                "confidence": 0.88
            }
        ]
    }
    
    # Transform the sample data
    transformed = transform_fact_history_to_unified_format(sample_fact_history)
    
    # Print the transformed structure
    print("Transformed fact_history:")
    print(json.dumps(transformed, indent=2))
    
    return transformed


if __name__ == "__main__":
    # Run the test
    test_transformation()