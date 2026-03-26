from typing import Dict, List, Optional
from datetime import datetime
import logging
import json
import os
from collections import deque

logger = logging.getLogger(__name__)

class ContextManager:
    """Advanced context management system for tracking conversation state and history."""
    
    def __init__(self, max_history: int = 50):
        """Initialize the context manager.
        
        Args:
            max_history: Maximum number of context entries to keep
        """
        self.max_history = max_history
        self.conversation_state = {
            'current_topic': None,
            'topic_history': deque(maxlen=max_history),
            'sentiment_history': deque(maxlen=max_history),
            'user_intent': None,
            'conversation_goal': None,
            'active_contexts': set(),
            'context_switches': [],
            'last_update': None
        }
        
        # Load existing context if available
        self._load_context()
    
    def _load_context(self):
        """Load context from disk."""
        try:
            if os.path.exists('data/context.json'):
                with open('data/context.json', 'r') as f:
                    data = json.load(f)
                    
                    # Convert lists back to deques
                    self.conversation_state['topic_history'] = deque(
                        data.get('topic_history', []),
                        maxlen=self.max_history
                    )
                    self.conversation_state['sentiment_history'] = deque(
                        data.get('sentiment_history', []),
                        maxlen=self.max_history
                    )
                    
                    # Load other state
                    self.conversation_state['current_topic'] = data.get('current_topic')
                    self.conversation_state['user_intent'] = data.get('user_intent')
                    self.conversation_state['conversation_goal'] = data.get('conversation_goal')
                    self.conversation_state['active_contexts'] = set(data.get('active_contexts', []))
                    self.conversation_state['context_switches'] = data.get('context_switches', [])
                    self.conversation_state['last_update'] = data.get('last_update')
                    
                logger.info("Loaded conversation context")
        except Exception as e:
            logger.error(f"Error loading context: {e}")
    
    def _save_context(self):
        """Save context to disk."""
        try:
            os.makedirs('data', exist_ok=True)
            with open('data/context.json', 'w') as f:
                # Convert deques to lists for JSON serialization
                data = self.conversation_state.copy()
                data['topic_history'] = list(data['topic_history'])
                data['sentiment_history'] = list(data['sentiment_history'])
                data['active_contexts'] = list(data['active_contexts'])
                
                json.dump(data, f, indent=2)
            
            logger.info("Saved conversation context")
        except Exception as e:
            logger.error(f"Error saving context: {e}")
    
    def update_context(self, message: str, sentiment: Optional[float] = None):
        """Update the conversation context with a new message.
        
        Args:
            message: The new message
            sentiment: Optional sentiment score (-1 to 1)
        """
        try:
            # Update topic
            self._update_topic(message)
            
            # Update sentiment
            if sentiment is not None:
                self.conversation_state['sentiment_history'].append({
                    'sentiment': sentiment,
                    'timestamp': datetime.now().isoformat()
                })
            
            # Update user intent
            self._update_intent(message)
            
            # Update last update time
            self.conversation_state['last_update'] = datetime.now().isoformat()
            
            # Save changes
            self._save_context()
        except Exception as e:
            logger.error(f"Error updating context: {e}")
    
    def _update_topic(self, message: str):
        """Update the current topic based on the message."""
        try:
            # Simple topic extraction (can be enhanced with NLP)
            words = message.lower().split()
            if len(words) > 0:
                # Use the first noun or verb as topic
                topic = words[0]
                
                # Check if topic has changed
                if topic != self.conversation_state['current_topic']:
                    # Record the topic change
                    self.conversation_state['context_switches'].append({
                        'from_topic': self.conversation_state['current_topic'],
                        'to_topic': topic,
                        'timestamp': datetime.now().isoformat()
                    })
                    
                    # Update current topic
                    self.conversation_state['current_topic'] = topic
                    
                    # Add to history
                    self.conversation_state['topic_history'].append({
                        'topic': topic,
                        'timestamp': datetime.now().isoformat()
                    })
        except Exception as e:
            logger.error(f"Error updating topic: {e}")
    
    def _update_intent(self, message: str):
        """Update the user's intent based on the message."""
        try:
            # Simple intent detection (can be enhanced with NLP)
            message = message.lower()
            
            if any(word in message for word in ['what', 'how', 'why', 'when', 'where', 'who']):
                self.conversation_state['user_intent'] = 'question'
            elif any(word in message for word in ['please', 'can you', 'could you']):
                self.conversation_state['user_intent'] = 'request'
            elif any(word in message for word in ['thanks', 'thank you']):
                self.conversation_state['user_intent'] = 'gratitude'
            else:
                self.conversation_state['user_intent'] = 'statement'
        except Exception as e:
            logger.error(f"Error updating intent: {e}")
    
    def get_current_context(self) -> Dict:
        """Get the current conversation context.
        
        Returns:
            Dict: Current context information
        """
        return {
            'current_topic': self.conversation_state['current_topic'],
            'user_intent': self.conversation_state['user_intent'],
            'conversation_goal': self.conversation_state['conversation_goal'],
            'active_contexts': list(self.conversation_state['active_contexts']),
            'recent_topics': list(self.conversation_state['topic_history'])[-5:],
            'recent_sentiments': list(self.conversation_state['sentiment_history'])[-5:]
        }
    
    def set_conversation_goal(self, goal: str):
        """Set the conversation goal.
        
        Args:
            goal: The conversation goal
        """
        self.conversation_state['conversation_goal'] = goal
        self._save_context()
    
    def add_active_context(self, context: str):
        """Add an active context.
        
        Args:
            context: The context to add
        """
        self.conversation_state['active_contexts'].add(context)
        self._save_context()
    
    def remove_active_context(self, context: str):
        """Remove an active context.
        
        Args:
            context: The context to remove
        """
        self.conversation_state['active_contexts'].discard(context)
        self._save_context()
    
    def get_context_switch_history(self) -> List[Dict]:
        """Get the history of context switches.
        
        Returns:
            List[Dict]: List of context switches
        """
        return self.conversation_state['context_switches']
    
    def clear_context(self):
        """Clear all context information."""
        self.conversation_state = {
            'current_topic': None,
            'topic_history': deque(maxlen=self.max_history),
            'sentiment_history': deque(maxlen=self.max_history),
            'user_intent': None,
            'conversation_goal': None,
            'active_contexts': set(),
            'context_switches': [],
            'last_update': None
        }
        self._save_context() 