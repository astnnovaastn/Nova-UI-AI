from typing import Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ContextManager:
    """Manages conversation context and state."""
    
    def __init__(self):
        """Initialize the context manager."""
        self.conversation_state = {
            'current_topic': None,
            'user_intent': None,
            'sentiment': 0.0,
            'last_update': datetime.now(),
            'conversation_goal': None,
            'context_window': []
        }
    
    def update_context(self, message: str, sentiment_score: float) -> None:
        """Update the conversation context based on the new message.
        
        Args:
            message: The user's message
            sentiment_score: Sentiment score of the message
        """
        try:
            # Update basic state
            self.conversation_state['last_update'] = datetime.now()
            self.conversation_state['sentiment'] = sentiment_score
            
            # Add message to context window
            self.conversation_state['context_window'].append({
                'message': message,
                'timestamp': datetime.now().isoformat(),
                'sentiment': sentiment_score
            })
            
            # Keep only last 10 messages in context window
            if len(self.conversation_state['context_window']) > 10:
                self.conversation_state['context_window'].pop(0)
            
            # Simple topic detection (can be enhanced with NLP)
            if 'weather' in message.lower():
                self.conversation_state['current_topic'] = 'weather'
                self.conversation_state['user_intent'] = 'get_weather'
            else:
                self.conversation_state['current_topic'] = 'general'
                self.conversation_state['user_intent'] = 'chat'
                
        except Exception as e:
            logger.error(f"Error updating context: {e}")
    
    def get_current_context(self) -> Dict[str, Any]:
        """Get the current conversation context.
        
        Returns:
            Dict[str, Any]: Current context state
        """
        return self.conversation_state
    
    def set_conversation_goal(self, goal: str) -> None:
        """Set a conversation goal.
        
        Args:
            goal: The goal to set
        """
        self.conversation_state['conversation_goal'] = goal
    
    def clear_context(self) -> None:
        """Clear the current context."""
        self.conversation_state = {
            'current_topic': None,
            'user_intent': None,
            'sentiment': 0.0,
            'last_update': datetime.now(),
            'conversation_goal': None,
            'context_window': []
        } 