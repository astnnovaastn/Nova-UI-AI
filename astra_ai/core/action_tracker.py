"""
Action Tracker for AI Self-Awareness
Tracks what the AI is doing, sources used, and actions performed
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import logging

logger = logging.getLogger(__name__)

@dataclass
class AIAction:
    """Represents an action performed by the AI"""
    id: str
    action_type: str  # 'search', 'response', 'command', 'summary', etc.
    description: str
    sources: List[str]  # Where information came from
    user_query: str
    ai_response: str
    timestamp: str
    metadata: Dict[str, Any]

class ActionTracker:
    """Tracks AI actions and sources for self-awareness"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.actions_file = os.path.join(data_dir, "ai_actions.json")
        self.recent_actions: List[AIAction] = []
        self.max_recent_actions = 50  # Keep last 50 actions in memory
        
        # Ensure data directory exists
        os.makedirs(data_dir, exist_ok=True)
        
        # Load existing actions
        self._load_actions()
    
    def track_action(self, action_type: str, description: str, sources: List[str], 
                    user_query: str, ai_response: str, metadata: Dict[str, Any] = None) -> str:
        """Track a new AI action"""
        
        action_id = f"{action_type}_{int(datetime.now().timestamp())}"
        
        action = AIAction(
            id=action_id,
            action_type=action_type,
            description=description,
            sources=sources,
            user_query=user_query,
            ai_response=ai_response,
            timestamp=datetime.now().isoformat(),
            metadata=metadata or {}
        )
        
        # Add to recent actions
        self.recent_actions.append(action)
        
        # Keep only recent actions in memory
        if len(self.recent_actions) > self.max_recent_actions:
            self.recent_actions = self.recent_actions[-self.max_recent_actions:]
        
        # Save to file
        self._save_actions()
        
        logger.debug(f"Tracked action: {action_type} - {description}")
        return action_id
    
    def get_last_action(self) -> Optional[AIAction]:
        """Get the most recent action"""
        return self.recent_actions[-1] if self.recent_actions else None
    
    def get_last_actions(self, count: int = 5) -> List[AIAction]:
        """Get the last N actions"""
        return self.recent_actions[-count:] if self.recent_actions else []
    
    def get_actions_by_type(self, action_type: str, count: int = 10) -> List[AIAction]:
        """Get recent actions of a specific type"""
        filtered_actions = [action for action in self.recent_actions if action.action_type == action_type]
        return filtered_actions[-count:] if filtered_actions else []
    
    def get_context_for_query(self, query: str) -> str:
        """Generate context about recent actions for the AI"""
        last_action = self.get_last_action()
        
        if not last_action:
            return "I haven't performed any recent actions."
        
        context_parts = []
        
        # Add information about the last action
        if last_action.action_type == "search":
            sources_text = ", ".join(last_action.sources) if last_action.sources else "web search"
            context_parts.append(f"My last action was performing a search for '{last_action.user_query}' using {sources_text}.")
        
        elif last_action.action_type == "response":
            context_parts.append(f"My last action was responding to your question: '{last_action.user_query}'.")
        
        elif last_action.action_type == "command":
            context_parts.append(f"My last action was executing the command: '{last_action.description}'.")
        
        # Add source information if available
        if last_action.sources:
            context_parts.append(f"I used these sources: {', '.join(last_action.sources)}.")
        
        # Add recent search history if relevant
        recent_searches = self.get_actions_by_type("search", 3)
        if len(recent_searches) > 1:
            search_queries = [action.user_query for action in recent_searches[-3:]]
            context_parts.append(f"Recent searches I performed: {', '.join(search_queries)}.")
        
        return " ".join(context_parts)
    
    def find_source_for_query(self, query_keywords: List[str]) -> Optional[AIAction]:
        """Find the action that provided information for specific keywords"""
        for action in reversed(self.recent_actions):
            # Check if any keywords match the action's query or response
            query_text = action.user_query.lower()
            response_text = action.ai_response.lower()
            
            for keyword in query_keywords:
                if keyword.lower() in query_text or keyword.lower() in response_text:
                    return action
        
        return None
    
    def get_source_explanation(self, user_query: str) -> str:
        """Generate an explanation of where information came from"""
        last_action = self.get_last_action()
        
        if not last_action:
            return "I don't have information about recent sources."
        
        if last_action.action_type == "search":
            if last_action.sources:
                sources_list = []
                for source in last_action.sources:
                    if "google" in source.lower():
                        sources_list.append("Google Search")
                    elif "wikipedia" in source.lower():
                        sources_list.append("Wikipedia")
                    elif "reddit" in source.lower():
                        sources_list.append("Reddit")
                    elif "web" in source.lower():
                        sources_list.append("Web Search")
                    else:
                        sources_list.append(source)
                
                sources_text = ", ".join(sources_list)
                return f"I got that information from {sources_text} when you asked me to search for '{last_action.user_query}'."
            else:
                return f"I performed a web search for '{last_action.user_query}' but I don't have specific source details."
        
        elif last_action.action_type == "response":
            return "That information came from my training data and knowledge base."
        
        else:
            return f"I performed a {last_action.action_type} action: {last_action.description}."
    
    def clear_actions(self):
        """Clear all tracked actions"""
        self.recent_actions.clear()
        self._save_actions()
        logger.info("Cleared all tracked actions")
    
    def _load_actions(self):
        """Load actions from file"""
        try:
            if os.path.exists(self.actions_file):
                with open(self.actions_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    actions_data = data.get('actions', [])
                    for action_data in actions_data[-self.max_recent_actions:]:  # Load only recent actions
                        action = AIAction(**action_data)
                        self.recent_actions.append(action)
                        
        except Exception as e:
            logger.error(f"Error loading actions: {e}")
    
    def _save_actions(self):
        """Save actions to file"""
        try:
            data = {
                'actions': [asdict(action) for action in self.recent_actions],
                'last_updated': datetime.now().isoformat()
            }
            
            with open(self.actions_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            logger.error(f"Error saving actions: {e}")