"""Enhanced Nova Memory AI Agent Interface

This module provides a simplified interface wrapper for the enhanced memory system
that maintains backward compatibility while exposing new functionality.
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional

from astra_ai.memory.enhanced_nova_memory_system import (
    EnhancedNovaMemoryAI, create_enhanced_memory_agent
)

class EnhancedMemoryAgent:
    """
    Nova Memory AI Agent - Interface wrapper for compatibility

    This agent works as a dedicated memory companion to Nova:
    - Stores facts automatically in the background
    - Retrieves information when Nova needs it
    - Maintains conversation logs for context
    """

    def __init__(self, storage_file: str = "astra_ai/Date/nova_ai_memory.json"):
        self.memory_system = EnhancedNovaMemoryAI(storage_file)
        # Silently initialized Nova Memory AI Agent

    def process_conversation(self, user_message: str, ai_response: str) -> Dict[str, Any]:
        """Process conversation with Mem0-style memory analysis"""
        # For now, just return basic processing
        return {
            "status": "processed",
            "user_message": user_message,
            "ai_response": ai_response
        }

    def get_memory_context(self, query: str = "") -> Dict[str, Any]:
        """Get memory context for AI response generation"""
        return self.memory_system.get_complete_memory_structure()

    def get_user_profile(self) -> Dict[str, Any]:
        """
        Get user profile without relying on current_facts.
        """
        return {
            'user_info': self.memory_system.data.get("user", {}),
            'facts': {}  # Return empty dict since we're removing current_facts
        }

    def get_memory_stats(self) -> Dict[str, Any]:
        """Get memory statistics"""
        return {
            "total_events": len(self.memory_system.data.get("memory_engine", {}).get("memory_events", [])),
            "total_facts": len(self.memory_system.data.get("fact_history", {})),
            "user_name": self.memory_system.data.get("user", {}).get("name", "Unknown")
        }

    def get_session_info(self) -> Dict[str, Any]:
        """Get conversation session information for intelligent greetings"""
        return {
            "is_first_time": True,
            "total_sessions": 0,
            "user_name": self.memory_system.data.get("user", {}).get("name", "User")
        }

    def end_session(self):
        """End the current conversation session"""
        self.memory_system.save_memory()

    def get_conversation_context(self) -> Dict[str, Any]:
        """Get context about previous conversations"""
        session_info = self.get_session_info()

        context = {
            "is_returning_user": not session_info["is_first_time"],
            "total_sessions": session_info["total_sessions"],
            "user_name": session_info.get("user_name"),
            "greeting_message": self._generate_greeting_message(session_info)
        }

        return context

    def _generate_greeting_message(self, session_info: Dict[str, Any]) -> str:
        """Generate appropriate greeting message based on session history"""
        if session_info["is_first_time"]:
            return "Hi there! I'm Nova, your AI memory companion. What's your name?"

        user_name = session_info.get("user_name", "there")
        return f"Welcome back, {user_name}!"

    def get_conversation_state(self) -> Dict[str, Any]:
        """Get conversation state for AI response filtering"""
        return self.memory_system.data.get("conversation_state", {})

    def should_avoid_introductions(self) -> bool:
        """Check if AI should avoid introduction-style responses"""
        state = self.get_conversation_state()
        return (state.get("is_established_user", False) or
                not state.get("is_introduction_phase", True) or
                state.get("relationship_established", False))

    def get_ai_context_instructions(self) -> str:
        """Get context instructions for AI to avoid inappropriate greeting patterns"""
        state = self.get_conversation_state()

        if state.get("is_established_user", False):
            instructions = [
                "You are continuing an ongoing conversation with an established user.",
                f"User's name is {state.get('user_name', 'the user')}.",
                "Do NOT ask introductory questions or act like you're meeting for the first time.",
                "Continue the conversation naturally based on your existing knowledge of the user."
            ]

            context_hints = state.get("conversation_context", {})
            if context_hints.get("user_occupation"):
                instructions.append(f"You know they work as {context_hints['user_occupation']}.")
            if context_hints.get("user_interests"):
                instructions.append(f"You know their interests include {context_hints['user_interests']}.")
            if context_hints.get("recent_topics"):
                instructions.append(f"Recent conversation topics: {', '.join(context_hints['recent_topics'])}.")

            instructions.append("Respond naturally without re-establishing rapport or asking basic questions.")

            return " ".join(instructions)

        elif state.get("greeting_completed", False):
            return ("You have already greeted the user in this session. "
                   "Continue the conversation naturally without additional greetings or introductions.")

        else:
            return ("This appears to be a new user. You may ask introductory questions "
                   "to get to know them better.")

    def mark_greeting_completed(self):
        """Mark greeting as completed"""
        conversation_state = self.memory_system.data.get("conversation_state", {})
        conversation_state["greeting_completed"] = True
        conversation_state["introduction_phase"] = False
        conversation_state["established_user"] = True
        self.memory_system.data["conversation_state"] = conversation_state
        self.memory_system.data["user"]["relationship_established"] = True
        self.memory_system.save_memory()

    def recall_history(self, query: str) -> Dict[str, Any]:
        """Recall historical information based on natural language queries"""
        # For now, return fact history as historical information
        return {
            "found": len(self.memory_system.data.get("fact_history", {})) > 0,
            "results": [{"fact_type": k, "value": v} for k, v in self.memory_system.data.get("fact_history", {}).items()],
            "query": query
        }

    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get conversation history for historical queries"""
        return self.memory_system.data.get('conversation', [])

    def get_dynamic_conversation_context(self) -> Dict[str, Any]:
        """Get comprehensive dynamic context for response generation"""
        return self.get_memory_context()

    def get_timeline(self) -> List[Dict]:
        """Get chronological timeline of all changes"""
        timeline = []
        
        # Add memory events to timeline
        for event in self.memory_system.data.get("memory_engine", {}).get("memory_events", []):
            if isinstance(event, dict):
                timeline.append({
                    "type": "memory_event",
                    "timestamp": event.get("timestamp", ""),
                    "summary": event.get("summary", ""),
                    "event_type": event.get("type", "UNKNOWN")
                })
        
        # Add conversation entries to timeline
        for conv in self.memory_system.data.get("conversation", []):
            if isinstance(conv, dict):
                timeline.append({
                    "type": "conversation",
                    "timestamp": conv.get("timestamp", ""),
                    "summary": f"{conv.get('role', 'unknown')}: {conv.get('content', '')[:50]}...",
                    "event_type": conv.get("role", "unknown").upper()
                })
        
        # Sort by timestamp
        timeline.sort(key=lambda x: x["timestamp"])
        return timeline

    def get_fact_history(self, fact_type: str) -> List[Dict]:
        """Get complete history for a specific fact type"""
        history = self.memory_system.data.get("fact_history", {}).get(fact_type, [])
        if not isinstance(history, list):
            history = [history]
        return history

    def get_semantic_insights(self) -> Dict[str, Any]:
        """Get semantic insights about user's information"""
        insights = {
            "total_facts": len(self.memory_system.data.get("fact_history", {})),
            "categories_represented": len([cat for cat in self.memory_system.data.get("memory_categories", {}).values() if cat]),
            "relationship_density": len(self.memory_system.data.get("category_relationships", {})) / max(len(self.memory_system.data.get("fact_history", {})), 1)
        }
        return insights

    def get_emotional_timeline(self) -> List[Dict[str, Any]]:
        """Get emotional timeline of memories"""
        timeline = []
        for event in self.memory_system.data.get("memory_engine", {}).get("memory_events", []):
            if isinstance(event, dict) and "emotional_context" in event:
                timeline.append({
                    "timestamp": event["timestamp"],
                    "sentiment": event["emotional_context"].get("sentiment", "neutral"),
                    "emotional_intensity": event["emotional_context"].get("emotional_intensity", 0.5),
                    "summary": event["summary"]
                })
        return timeline

    def detect_memory_patterns(self) -> List[Dict[str, Any]]:
        """Get detected memory patterns"""
        return []  # Placeholder for now

    def get_relationship_graph(self) -> Dict[str, Any]:
        """Get memory relationship graph"""
        return self.memory_system.data.get("category_relationships", {})

    def get_importance_scores(self) -> Dict[str, Any]:
        """Get fact importance scores"""
        return {}  # Placeholder for now

    def get_accumulated_preferences(self, preference_type: str = None) -> Dict[str, Any]:
        """Get accumulated preferences with timestamps"""
        preferences = self.memory_system.data.get("fact_history", {}).get("personal_preferences", {})
        
        if preference_type and preference_type in preferences:
            return {preference_type: preferences[preference_type]}
        elif preference_type:
            return {}
        else:
            return preferences

    def add_memory_event(self, 
                        user_input: str,
                        context: str = "",
                        category: str = "personal_preferences",
                        subcategory: str = "general",
                        confidence: float = 0.8) -> str:
        """
        Add a new memory event to the system
        
        Args:
            user_input: The user's input text
            context: Context where the information was provided
            category: Memory category
            subcategory: Memory subcategory
            confidence: Confidence score (0.0-1.0)
            
        Returns:
            Event ID of the created event
        """
        return self.memory_system.create_add_event(
            user_input=user_input,
            context=context
        )

    def update_memory_event(self,
                           previous_event_id: str,
                           new_value: str,
                           context: str = "",
                           confidence: float = 0.8) -> str:
        """
        Update an existing memory event
        
        Args:
            previous_event_id: ID of the event being updated
            new_value: The new value
            context: Context where the information was provided
            confidence: Confidence score (0.0-1.0)
            
        Returns:
            Event ID of the created event
        """
        return self.memory_system.create_update_event(
            previous_event_id=previous_event_id,
            new_value=new_value,
            context=context,
            confidence=confidence
        )

# Factory function for backward compatibility
def create_memory_agent(storage_file: str = "astra_ai/Date/nova_ai_memory.json") -> EnhancedMemoryAgent:
    """Factory function to create a memory agent with default configuration"""
    return EnhancedMemoryAgent(storage_file)

# Example usage
if __name__ == "__main__":
    # Create enhanced memory agent
    memory_agent = create_memory_agent()
    
    # Add a new memory event
    event_id = memory_agent.add_memory_event(
        user_input="enjoys reading science fiction novels",
        context="User: I love reading sci-fi novels.",
        category="personal_preferences",
        subcategory="likes"
    )
    print(f"Added event with ID: {event_id}")
    
    # Update the memory event
    update_id = memory_agent.update_memory_event(
        previous_event_id=event_id,
        new_value="enjoys reading science fiction and fantasy novels",
        context="User: Actually, I also like fantasy novels."
    )
    print(f"Updated event with ID: {update_id}")
    
    # Get memory context
    context = memory_agent.get_memory_context()
    print(f"Memory context: {json.dumps(context, indent=2)}")
    
    print("Enhanced Nova Memory AI System initialized successfully!")