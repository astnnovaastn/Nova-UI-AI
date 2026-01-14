"""Module for managing AI personality and learning capabilities."""

import json
import random
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

class PersonalityManager:
    """Manages AI personality traits and learning."""
    
    def __init__(self, data_dir: str = "data"):
        """Initialize the personality manager.
        
        Args:
            data_dir: Directory to store personality data
        """
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        # Load or initialize personality data
        self.personality_file = self.data_dir / "personality.json"
        self.personality_data = self._load_personality_data()
        
        # Initialize conversation style parameters
        self.style_params = {
            "formality": 0.3,  # 0 = very informal, 1 = very formal
            "verbosity": 0.4,  # 0 = concise, 1 = verbose
            "empathy": 0.8,    # 0 = neutral, 1 = highly empathetic
            "humor": 0.6,      # 0 = serious, 1 = humorous
            "creativity": 0.7,  # 0 = factual, 1 = creative
            "curiosity": 0.8   # 0 = passive, 1 = inquisitive
        }
        
        # Load learned preferences
        self.user_preferences = self._load_user_preferences()
        
        # Initialize response templates
        self.response_templates = self._load_response_templates()
        
    def _load_personality_data(self) -> Dict:
        """Load personality data from file or create default."""
        if self.personality_file.exists():
            with open(self.personality_file, 'r') as f:
                return json.load(f)
        return {
            "learned_topics": [],
            "conversation_history": [],
            "user_preferences": {},
            "interaction_stats": {
                "total_conversations": 0,
                "total_responses": 0,
                "positive_reactions": 0,
                "negative_reactions": 0
            }
        }
    
    def _load_user_preferences(self) -> Dict:
        """Load learned user preferences."""
        prefs_file = self.data_dir / "user_preferences.json"
        if prefs_file.exists():
            with open(prefs_file, 'r') as f:
                return json.load(f)
        return {
            "topics_of_interest": [],
            "communication_style": {},
            "expertise_areas": [],
            "avoided_topics": [],
            "preferred_response_length": "medium"
        }
    
    def _load_response_templates(self) -> Dict:
        """Load response templates for different conversation styles."""
        return {
            "greeting": [
                "Hey there! What's on your mind?",
                "Hi! How can I help you today?",
                "Hello! Ready to chat when you are.",
                "Great to see you! What would you like to discuss?"
            ],
            "acknowledgment": [
                "I see what you mean.",
                "That makes sense.",
                "Interesting point.",
                "I understand.",
                "Got it."
            ],
            "thinking": [
                "Hmm, let me think about that...",
                "That's an interesting question...",
                "Let me gather my thoughts...",
                "Give me a moment to consider that..."
            ],
            "clarification": [
                "Could you elaborate on that?",
                "What exactly do you mean by {topic}?",
                "Could you provide more context?",
                "I'm not quite sure I follow. Can you explain?"
            ],
            "empathy": [
                "I understand how you feel about that.",
                "That must be {emotion} for you.",
                "I can see why you'd feel that way.",
                "Your perspective on this makes a lot of sense."
            ]
        }
    
    def adapt_to_user(self, message: str, context: Dict) -> None:
        """Adapt personality based on user interaction.
        
        Args:
            message: User's message
            context: Conversation context
        """
        # Analyze message sentiment
        sentiment = self._analyze_sentiment(message)
        
        # Update style parameters based on user interaction
        if sentiment > 0:
            self.style_params["empathy"] = min(1.0, self.style_params["empathy"] + 0.1)
        elif sentiment < 0:
            self.style_params["formality"] = min(1.0, self.style_params["formality"] + 0.1)
        
        # Learn from conversation
        self._update_learned_topics(message)
        self._update_user_preferences(message, context)
        
        # Save updated personality data
        self._save_personality_data()
    
    def generate_response_style(self, message_type: str) -> Dict:
        """Generate response style parameters.
        
        Args:
            message_type: Type of message to respond to
            
        Returns:
            Dict: Style parameters for response generation
        """
        return {
            "formality": self._adjust_for_context(self.style_params["formality"], message_type),
            "verbosity": self._adjust_for_context(self.style_params["verbosity"], message_type),
            "empathy": self._adjust_for_context(self.style_params["empathy"], message_type),
            "humor": self._adjust_for_context(self.style_params["humor"], message_type),
            "creativity": self._adjust_for_context(self.style_params["creativity"], message_type),
            "curiosity": self._adjust_for_context(self.style_params["curiosity"], message_type)
        }
    
    def _analyze_sentiment(self, message: str) -> float:
        """Analyze sentiment of a message.
        
        Args:
            message: Message to analyze
            
        Returns:
            float: Sentiment score (-1 to 1)
        """
        # Simple keyword-based sentiment analysis
        positive_words = {"good", "great", "awesome", "excellent", "thanks", "helpful", "love", "perfect", "wonderful"}
        negative_words = {"bad", "wrong", "terrible", "awful", "unhelpful", "hate", "poor", "stupid", "useless"}
        
        words = set(message.lower().split())
        positive_count = len(words.intersection(positive_words))
        negative_count = len(words.intersection(negative_words))
        
        if positive_count == 0 and negative_count == 0:
            return 0
        
        return (positive_count - negative_count) / (positive_count + negative_count)
    
    def _update_learned_topics(self, message: str) -> None:
        """Update learned topics from conversation.
        
        Args:
            message: User's message
        """
        # Extract potential topics (simple implementation)
        words = message.lower().split()
        potential_topics = [word for word in words if len(word) > 4]  # Simple heuristic
        
        # Update learned topics
        self.personality_data["learned_topics"].extend(potential_topics)
        self.personality_data["learned_topics"] = list(set(self.personality_data["learned_topics"]))
    
    def _update_user_preferences(self, message: str, context: Dict) -> None:
        """Update user preferences based on interaction.
        
        Args:
            message: User's message
            context: Conversation context
        """
        # Update topics of interest
        if "topic" in context:
            self.user_preferences["topics_of_interest"].append(context["topic"])
            self.user_preferences["topics_of_interest"] = list(set(self.user_preferences["topics_of_interest"]))
        
        # Update communication style preferences
        message_length = len(message.split())
        if message_length < 10:
            self.user_preferences["preferred_response_length"] = "short"
        elif message_length > 30:
            self.user_preferences["preferred_response_length"] = "long"
        else:
            self.user_preferences["preferred_response_length"] = "medium"
    
    def _adjust_for_context(self, base_value: float, context: str) -> float:
        """Adjust a style parameter based on context.
        
        Args:
            base_value: Base style parameter value
            context: Context to adjust for
            
        Returns:
            float: Adjusted value
        """
        adjustments = {
            "technical": {"formality": 0.2, "verbosity": 0.2, "creativity": -0.1},
            "emotional": {"empathy": 0.3, "formality": -0.2},
            "casual": {"formality": -0.3, "humor": 0.2},
            "professional": {"formality": 0.3, "humor": -0.2}
        }
        
        if context in adjustments:
            for param, adjustment in adjustments[context].items():
                if param in self.style_params:
                    base_value = max(0.0, min(1.0, base_value + adjustment))
        
        return base_value
    
    def _save_personality_data(self) -> None:
        """Save personality data to file."""
        with open(self.personality_file, 'w') as f:
            json.dump(self.personality_data, f, indent=4)
        
        prefs_file = self.data_dir / "user_preferences.json"
        with open(prefs_file, 'w') as f:
            json.dump(self.user_preferences, f, indent=4) 