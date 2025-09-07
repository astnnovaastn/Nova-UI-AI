"""
Memory Manager for the AI chatbot.
Handles advanced memory features including:
- Current conversation tracking
- Previous conversations across sessions
- User preferences and facts
- Conversation history with summarization
"""

import json
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Any

# Add project root to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

logger = logging.getLogger("AleChatBot.MemoryManager")

class MemoryManager:
    """Advanced memory system for the chatbot."""
    
    def __init__(self, data_dir: str = "data"):
        """Initialize the memory manager.
        
        Args:
            data_dir: Directory to store memory files
        """
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        # Memory file paths
        self.user_facts_file = self.data_dir / "user_facts.json"
        self.preferences_file = self.data_dir / "user_preferences.json"
        self.conversation_summaries_file = self.data_dir / "conversation_summaries.json"
        self.long_term_memory_file = self.data_dir / "long_term_memory.json"
        
        # Memory structures
        self.user_facts = self._load_json(self.user_facts_file, {})
        self.user_preferences = self._load_json(self.preferences_file, {})
        self.conversation_summaries = self._load_json(self.conversation_summaries_file, [])
        self.long_term_memory = self._load_json(self.long_term_memory_file, {
            "topics_of_interest": [],
            "important_events": [],
            "recurring_themes": [],
            "conversation_count": 0,
            "last_conversation": None
        })
        
        # Short-term memory for current session
        self.short_term_memory = {
            "current_conversation": [],
            "mentioned_entities": set(),
            "questions_asked": [],
            "session_start": datetime.now().isoformat(),
            "conversation_context": {}
        }
        
        # Memory retention settings
        self.max_short_term_items = 50
        self.max_summaries = 20
        self.max_facts = 100
        self.last_memory_update = time.time()
        self.memory_update_interval = 300  # 5 minutes
        
    def _load_json(self, file_path: Path, default_value: Any) -> Any:
        """Load data from a JSON file with error handling.
        
        Args:
            file_path: Path to the JSON file
            default_value: Default value to return if file doesn't exist or has errors
            
        Returns:
            The loaded data or the default value
        """
        try:
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return default_value
        except (json.JSONDecodeError, PermissionError) as e:
            logger.error(f"Error loading {file_path.name}: {str(e)}")
            return default_value
            
    def _save_json(self, file_path: Path, data: Any) -> bool:
        """Save data to a JSON file with error handling.
        
        Args:
            file_path: Path to the JSON file
            data: Data to save
            
        Returns:
            bool: True if saved successfully, False otherwise
        """
        try:
            # Create a temporary file first
            temp_file = file_path.with_suffix('.tmp')
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            # Replace the original file with the temporary file
            temp_file.replace(file_path)
            return True
        except (PermissionError, OSError) as e:
            logger.error(f"Error saving {file_path.name}: {str(e)}")
            return False
    
    def add_to_conversation(self, user_message: str, ai_response: str) -> None:
        """Add a message exchange to the current conversation memory.
        
        Args:
            user_message: The user's message
            ai_response: The AI's response
        """
        timestamp = datetime.now().isoformat()
        exchange = {
            "timestamp": timestamp,
            "user_message": user_message,
            "ai_response": ai_response
        }
        
        # Add to short-term memory
        self.short_term_memory["current_conversation"].append(exchange)
        
        # Limit short-term memory size
        if len(self.short_term_memory["current_conversation"]) > self.max_short_term_items:
            self.short_term_memory["current_conversation"] = self.short_term_memory["current_conversation"][-self.max_short_term_items:]
        
        # Update long-term memory periodically
        current_time = time.time()
        if current_time - self.last_memory_update > self.memory_update_interval:
            self.update_long_term_memory()
            self.last_memory_update = current_time
    
    def extract_user_facts(self, message: str) -> List[str]:
        """Extract potential facts about the user from their message.
        
        Args:
            message: The user's message
            
        Returns:
            List of extracted facts
        """
        facts = []
        
        # Simple fact extraction based on common patterns
        fact_patterns = [
            ("I am ", "identity"),
            ("I'm ", "identity"),
            ("I like ", "preference"),
            ("I love ", "preference"),
            ("I enjoy ", "preference"),
            ("I don't like ", "dislike"),
            ("I hate ", "dislike"),
            ("I work ", "occupation"),
            ("My job ", "occupation"),
            ("I live ", "location"),
            ("I have ", "possession"),
            ("My favorite ", "preference")
        ]
        
        message_lower = message.lower()
        for pattern, category in fact_patterns:
            pattern_lower = pattern.lower()
            if pattern_lower in message_lower:
                start_idx = message_lower.find(pattern_lower) + len(pattern_lower)
                # Find the end of the sentence or phrase
                end_markers = ['.', '!', '?', ',', ';', 'and', 'but']
                end_indices = [message_lower.find(marker, start_idx) for marker in end_markers]
                end_indices = [idx for idx in end_indices if idx != -1]
                
                if end_indices:
                    end_idx = min(end_indices)
                    fact_text = message[start_idx:end_idx].strip()
                else:
                    fact_text = message[start_idx:].strip()
                
                if fact_text:
                    facts.append({
                        "category": category,
                        "text": fact_text,
                        "source_message": message,
                        "timestamp": datetime.now().isoformat()
                    })
        
        return facts
    
    def update_user_facts(self, message: str) -> None:
        """Update stored facts about the user based on their message.
        
        Args:
            message: The user's message
        """
        new_facts = self.extract_user_facts(message)
        
        for fact in new_facts:
            category = fact["category"]
            if category not in self.user_facts:
                self.user_facts[category] = []
            
            # Check if this is a new fact or updates an existing one
            is_new = True
            for existing_fact in self.user_facts[category]:
                if existing_fact["text"].lower() == fact["text"].lower():
                    existing_fact["timestamp"] = fact["timestamp"]
                    existing_fact["source_message"] = fact["source_message"]
                    is_new = False
                    break
            
            if is_new:
                self.user_facts[category].append(fact)
        
        # Save updated facts
        if new_facts:
            self._save_json(self.user_facts_file, self.user_facts)
    
    def update_user_preferences(self, message: str) -> None:
        """Update stored preferences based on user message.
        
        Args:
            message: The user's message
        """
        message_lower = message.lower()
        
        # Look for preference indicators
        preference_indicators = {
            "like": 1,
            "love": 2,
            "enjoy": 1,
            "favorite": 2,
            "prefer": 1,
            "don't like": -1,
            "dislike": -1,
            "hate": -2
        }
        
        for indicator, score in preference_indicators.items():
            if indicator in message_lower:
                # Extract what comes after the indicator
                start_idx = message_lower.find(indicator) + len(indicator)
                end_markers = ['.', '!', '?', ',', ';', 'and', 'but']
                end_indices = [message_lower.find(marker, start_idx) for marker in end_markers]
                end_indices = [idx for idx in end_indices if idx != -1]
                
                if end_indices:
                    end_idx = min(end_indices)
                    preference_text = message[start_idx:end_idx].strip()
                else:
                    preference_text = message[start_idx:].strip()
                
                if preference_text:
                    self.user_preferences[preference_text] = {
                        "score": score,
                        "timestamp": datetime.now().isoformat(),
                        "source_message": message
                    }
        
        # Save updated preferences
        self._save_json(self.preferences_file, self.user_preferences)
    
    def summarize_conversation(self) -> Optional[str]:
        """Create a summary of the current conversation.
        
        Returns:
            A summary string or None if not enough conversation data
        """
        if len(self.short_term_memory["current_conversation"]) < 3:
            return None
            
        # Extract key points from the conversation
        user_messages = [exchange["user_message"] for exchange in self.short_term_memory["current_conversation"]]
        
        # Create a simple summary
        timestamp = datetime.now().isoformat()
        topics = list(self.short_term_memory.get("mentioned_entities", []))
        
        summary = {
            "timestamp": timestamp,
            "message_count": len(self.short_term_memory["current_conversation"]),
            "topics": topics[:5],  # Top 5 topics
            "first_message": user_messages[0] if user_messages else "",
            "last_message": user_messages[-1] if user_messages else ""
        }
        
        # Add to summaries and save
        self.conversation_summaries.append(summary)
        
        # Limit number of summaries
        if len(self.conversation_summaries) > self.max_summaries:
            self.conversation_summaries = self.conversation_summaries[-self.max_summaries:]
            
        self._save_json(self.conversation_summaries_file, self.conversation_summaries)
        
        # Return a readable summary
        topics_str = ", ".join(topics[:3]) if topics else "various topics"
        return f"Conversation about {topics_str} with {summary['message_count']} exchanges"
    
    def update_long_term_memory(self) -> None:
        """Update long-term memory with information from the current session."""
        # Update conversation count
        self.long_term_memory["conversation_count"] += 1
        
        # Update last conversation timestamp
        self.long_term_memory["last_conversation"] = datetime.now().isoformat()
        
        # Update topics of interest
        current_topics = list(self.short_term_memory.get("mentioned_entities", []))
        for topic in current_topics:
            if topic not in self.long_term_memory["topics_of_interest"]:
                self.long_term_memory["topics_of_interest"].append(topic)
        
        # Limit topics to most recent/relevant
        self.long_term_memory["topics_of_interest"] = self.long_term_memory["topics_of_interest"][-20:]
        
        # Create a conversation summary
        summary = self.summarize_conversation()
        if summary:
            self.long_term_memory["important_events"].append({
                "type": "conversation",
                "summary": summary,
                "timestamp": datetime.now().isoformat()
            })
            
            # Limit events
            self.long_term_memory["important_events"] = self.long_term_memory["important_events"][-20:]
        
        # Save long-term memory
        self._save_json(self.long_term_memory_file, self.long_term_memory)
    
    def get_relevant_memories(self, message: str) -> Dict[str, Any]:
        """Retrieve memories relevant to the current message.
        
        Args:
            message: The user's message
            
        Returns:
            Dictionary of relevant memories
        """
        relevant_memories = {
            "facts": [],
            "preferences": [],
            "conversation_history": [],
            "topics_of_interest": []
        }
        
        message_lower = message.lower()
        
        # Find relevant facts
        for category, facts in self.user_facts.items():
            for fact in facts:
                fact_text = fact["text"].lower()
                if any(word in message_lower for word in fact_text.split()):
                    relevant_memories["facts"].append(fact)
        
        # Find relevant preferences
        for item, pref in self.user_preferences.items():
            if item.lower() in message_lower:
                relevant_memories["preferences"].append({
                    "item": item,
                    "score": pref["score"]
                })
        
        # Add topics of interest that match the message
        for topic in self.long_term_memory["topics_of_interest"]:
            if topic.lower() in message_lower:
                relevant_memories["topics_of_interest"].append(topic)
        
        # Add recent conversation history
        relevant_memories["conversation_history"] = self.short_term_memory["current_conversation"][-5:]
        
        return relevant_memories
    
    def get_memory_context(self) -> str:
        """Generate a context string from memory for the AI.
        
        Returns:
            A string summarizing relevant memory context
        """
        context_parts = []
        
        # Add basic stats
        context_parts.append(f"Conversation count: {self.long_term_memory['conversation_count']}")
        
        # Add top preferences if any
        top_preferences = []
        for item, pref in self.user_preferences.items():
            if pref["score"] > 0:
                top_preferences.append(item)
        if top_preferences:
            context_parts.append(f"User likes: {', '.join(top_preferences[:3])}")
        
        # Add top facts if any
        identity_facts = self.user_facts.get("identity", [])
        if identity_facts:
            context_parts.append(f"User identity: {identity_facts[0]['text']}")
        
        occupation_facts = self.user_facts.get("occupation", [])
        if occupation_facts:
            context_parts.append(f"User occupation: {occupation_facts[0]['text']}")
        
        # Add topics of interest
        if self.long_term_memory["topics_of_interest"]:
            topics = self.long_term_memory["topics_of_interest"][-3:]
            context_parts.append(f"Topics of interest: {', '.join(topics)}")
        
        return " | ".join(context_parts)
    
    def clear_short_term_memory(self) -> None:
        """Clear the short-term memory for a new session."""
        self.short_term_memory = {
            "current_conversation": [],
            "mentioned_entities": set(),
            "questions_asked": [],
            "session_start": datetime.now().isoformat(),
            "conversation_context": {}
        }