"""
Response Generator for EnhancedNovaAI system.
This module provides response generation functionality.
"""

from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class ResponseGenerator:
    """Generates responses for the EnhancedNovaAI system."""
    
    def __init__(self):
        """Initialize the response generator."""
        # You can add any initialization logic here if needed
        pass
    
    def generate_response(self, context: Dict[str, Any], intent: str, sentiment: float, topic: str) -> str:
        """
        Generate a response based on the provided context and parameters.
        
        Args:
            context: Current context information
            intent: User's intended purpose or goal
            sentiment: Sentiment score (-1 to 1)
            topic: Current conversation topic
            
        Returns:
            str: Generated response
        """
        try:
            # Build response based on context and parameters
            base_response = self._build_base_response(context, intent, topic)
            
            # Adjust for sentiment
            if sentiment > 0.3:
                # Positive sentiment
                response = f"That sounds great! {base_response}"
            elif sentiment < -0.3:
                # Negative sentiment
                response = f"I understand your concern. {base_response}"
            else:
                # Neutral sentiment
                response = base_response
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return "I understand. How else can I help you?"
    
    def _build_base_response(self, context: Dict[str, Any], intent: str, topic: str) -> str:
        """Build a base response based on context."""
        # Default responses based on intent and topic
        if intent == "greeting":
            return "Hello! How can I assist you today?"
        elif intent == "information_request":
            if topic:
                return f"I understand you're interested in {topic}. Let me help you with that."
            else:
                return "I understand you're looking for information. How can I help?"
        elif intent == "conversation":
            return "That's interesting. Tell me more about that."
        elif intent == "task_request":
            return "I can help with that task. What specific details do you need?"
        else:
            # Default response - but handle greeting-like messages specially
            message = context.get('context_window', [{}])[-1].get('message', '') if context.get('context_window') else ''
            message_lower = message.lower().strip()
            
            # Check if this is actually a greeting despite being classified as general
            greeting_patterns = [
                'hi', 'hello', 'hey', 'what\'s up', 'whats up', 'how\'s it going', 'how are you',
                'what up', 'yo', 'sup', 'good day', 'hows it going'
            ]
            
            is_greeting_like = any(greeting in message_lower for greeting in greeting_patterns) or \
                              (message_lower.startswith('hi ') or message_lower.startswith('hello ') or 
                               message_lower.startswith('hey ') or 'nova' in message_lower and 
                               any(greeting in message_lower for greeting in ['hi', 'hello', 'hey', 'what up']))
            
            if is_greeting_like:
                return "Hello there! How can I help you today?"
            
            if topic and topic != 'general':
                return f"Thanks for sharing information about {topic}. How can I assist you further?"
            else:
                return "Thanks for sharing. How can I help you further?"