"""
Machine Learning Personalization module for Nova AI.
Provides user preference learning and response adaptation capabilities.
"""

from typing import Dict, List, Optional, Any
from collections import defaultdict
import json
import os
from datetime import datetime

class MLPersonalization:
    def __init__(self, data_dir: str = "data"):
        """
        Initialize the ML personalization system.
        
        Args:
            data_dir: Directory to store personalization data
        """
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        
        # User preferences and patterns
        self.user_preferences = defaultdict(float)
        self.topic_interests = defaultdict(float)
        self.interaction_patterns = defaultdict(int)
        self.response_effectiveness = defaultdict(list)
        
        # Learning rates
        self.preference_lr = 0.1
        self.topic_lr = 0.05
        
        # Load existing data
        self.load_personalization_data()
        
    def load_personalization_data(self):
        """Load personalization data from disk."""
        try:
            file_path = os.path.join(self.data_dir, "personalization.json")
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    self.user_preferences = defaultdict(float, data.get('preferences', {}))
                    self.topic_interests = defaultdict(float, data.get('topics', {}))
                    self.interaction_patterns = defaultdict(int, data.get('patterns', {}))
        except Exception as e:
            print(f"Error loading personalization data: {e}")
    
    def save_personalization_data(self):
        """Save personalization data to disk."""
        try:
            data = {
                'preferences': dict(self.user_preferences),
                'topics': dict(self.topic_interests),
                'patterns': dict(self.interaction_patterns)
            }
            file_path = os.path.join(self.data_dir, "personalization.json")
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving personalization data: {e}")
    
    def update_from_interaction(self, 
                              user_message: str,
                              ai_response: str,
                              user_feedback: Optional[str] = None,
                              detected_topics: Optional[List[str]] = None):
        """
        Update personalization model based on an interaction.
        
        Args:
            user_message: The user's message
            ai_response: The AI's response
            user_feedback: Optional explicit feedback from user
            detected_topics: Optional list of detected topics
        """
        # Update interaction patterns
        msg_length = len(user_message.split())
        self.interaction_patterns['avg_message_length'] = (
            (self.interaction_patterns['avg_message_length'] * 
             self.interaction_patterns['total_messages'] + msg_length) /
            (self.interaction_patterns['total_messages'] + 1)
        )
        self.interaction_patterns['total_messages'] += 1
        
        # Update topic interests
        if detected_topics:
            for topic in detected_topics:
                self.topic_interests[topic] += self.topic_lr
                
        # Process user feedback
        if user_feedback:
            feedback_lower = user_feedback.lower()
            if any(word in feedback_lower for word in ['good', 'great', 'helpful', 'thanks']):
                self._update_effectiveness(ai_response, 1.0)
            elif any(word in feedback_lower for word in ['bad', 'wrong', 'not helpful']):
                self._update_effectiveness(ai_response, -0.5)
                
        self.save_personalization_data()
    
    def _update_effectiveness(self, response: str, score: float):
        """Update effectiveness scores for response patterns."""
        # Extract and score response characteristics
        characteristics = self._extract_response_characteristics(response)
        for char in characteristics:
            self.response_effectiveness[char].append(score)
            # Keep only last 100 scores
            if len(self.response_effectiveness[char]) > 100:
                self.response_effectiveness[char] = self.response_effectiveness[char][-100:]
    
    def _extract_response_characteristics(self, response: str) -> List[str]:
        """Extract characteristics from a response for learning."""
        characteristics = []
        
        # Length characteristic
        if len(response) < 100:
            characteristics.append('short_response')
        elif len(response) > 300:
            characteristics.append('long_response')
        else:
            characteristics.append('medium_response')
            
        # Style characteristics
        if '?' in response:
            characteristics.append('question_response')
        if any(char in response for char in '!'):
            characteristics.append('enthusiastic_response')
        if any(word in response.lower() for word in ['example', 'instance', 'like']):
            characteristics.append('example_based_response')
            
        return characteristics
    
    def get_response_preferences(self) -> Dict[str, float]:
        """
        Get learned preferences for response generation.
        
        Returns:
            Dict of response characteristics and their effectiveness scores
        """
        preferences = {}
        
        # Calculate average effectiveness for each characteristic
        for char, scores in self.response_effectiveness.items():
            if scores:
                preferences[char] = sum(scores) / len(scores)
                
        return preferences
    
    def get_topic_preferences(self) -> Dict[str, float]:
        """
        Get learned topic preferences.
        
        Returns:
            Dict of topics and their interest scores
        """
        return dict(self.topic_interests)
    
    def get_interaction_patterns(self) -> Dict[str, Any]:
        """
        Get learned interaction patterns.
        
        Returns:
            Dict of interaction patterns and their values
        """
        return dict(self.interaction_patterns)
    
    def adapt_response(self, 
                      base_response: str,
                      detected_topics: Optional[List[str]] = None) -> str:
        """
        Adapt a response based on learned preferences.
        
        Args:
            base_response: The original response to adapt
            detected_topics: Optional list of detected topics
            
        Returns:
            Adapted response
        """
        preferences = self.get_response_preferences()
        
        # Apply learned preferences
        if preferences.get('short_response', 0) > preferences.get('long_response', 0):
            # User prefers shorter responses
            sentences = base_response.split('.')
            if len(sentences) > 3:
                base_response = '. '.join(sentences[:3]) + '.'
                
        if preferences.get('example_based_response', 0) > 0.5:
            # User responds well to examples
            if 'example' not in base_response.lower():
                base_response += "\n\nFor example, " + self._generate_example(detected_topics)
                
        if preferences.get('enthusiastic_response', 0) > 0.5:
            # User responds well to enthusiasm
            base_response = base_response.replace('.', '!')
            
        return base_response
    
    def _generate_example(self, topics: Optional[List[str]] = None) -> str:
        """Generate a relevant example based on topics."""
        # Simple example generation - could be enhanced
        if topics and topics[0] in self.topic_interests:
            return f"this is particularly relevant in the context of {topics[0]}."
        return "this can be applied in various contexts." 