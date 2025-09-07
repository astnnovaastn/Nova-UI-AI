"""
Unified Response Management System for Nova AI.
Combines generation, formatting, and personalization of responses.
"""

import json
import logging
import random
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Any
from collections import defaultdict

logger = logging.getLogger(__name__)

class ResponseManager:
    """
    Unified system for generating, formatting, and managing AI responses.
    Combines functionality from ResponseGenerator, ResponseFormatter, and ResponseGeneration.
    """
    
    def __init__(self, personality_manager=None, learning_system=None):
        """
        Initialize the response manager.
        
        Args:
            personality_manager: Optional PersonalityManager instance
            learning_system: Optional ContinuousLearning instance
        """
        # Core components
        self.personality = personality_manager
        self.learning = learning_system
        
        # Initialize personality traits
        self.personality_traits = {
            'friendly': 0.8,
            'professional': 0.7,
            'helpful': 0.9,
            'curious': 0.6,
            'empathetic': 0.75,
            'formality': 0.5,
            'creativity': 0.6
        }
        
        # Response parameters
        self.params = {
            "max_response_length": 150,
            "min_response_length": 20,
            "coherence_threshold": 0.7,
            "creativity_factor": 0.5
        }
        
        # Load templates
        self.templates = self._load_templates()
        
        # Initialize keyword sets for formatting
        self._init_keywords()
        
    def _init_keywords(self):
        """Initialize keyword sets for different response types."""
        self.sports_keywords = {
            "match", "game", "score", "winning", "losing", "vs", "against", 
            "football", "soccer", "basketball", "tennis", "cricket", "rugby",
            "live", "result", "final", "goal", "point", "set"
        }
        
        self.weather_keywords = {
            "weather", "temperature", "rain", "sunny", "cloudy", "forecast",
            "climate", "degrees", "celsius", "fahrenheit", "humidity", "wind"
        }
        
        self.tech_keywords = {
            "api", "code", "programming", "software", "app", "development",
            "framework", "library", "tool", "service", "platform"
        }
        
        self.quick_answer_keywords = {
            "who is winning", "what's the score", "who won", "final score",
            "live score", "current score", "latest score", "who's ahead"
        }
    
    def _load_templates(self) -> Dict:
        """Load response templates."""
        return {
            'greeting': [
                "Hello! How can I help you today?",
                "Hi there! What can I do for you?",
                "Greetings! How may I assist you?"
            ],
            'farewell': [
                "Goodbye! Have a great day!",
                "Take care! Feel free to return if you need anything.",
                "Until next time! It was nice chatting with you."
            ],
            'clarification': [
                "Could you please clarify what you mean by {topic}?",
                "I want to make sure I understand correctly. Are you asking about {topic}?",
                "Let me get this straight - you're interested in {topic}, right?"
            ],
            'acknowledgment': [
                "I understand what you're saying about {topic}.",
                "That's an interesting point about {topic}.",
                "I see what you mean regarding {topic}."
            ],
            'thinking': [
                "Let me think about that for a moment...",
                "I'm processing your request...",
                "Give me a second to consider this..."
            ],
            'emotional': {
                'positive': [
                    "That's great to hear!",
                    "I'm glad to hear that!",
                    "That's wonderful news!"
                ],
                'negative': [
                    "I'm sorry to hear that.",
                    "That must be difficult.",
                    "I understand this is challenging."
                ],
                'neutral': [
                    "I see.",
                    "I understand.",
                    "Got it."
                ]
            }
        }
    
    def generate_response(self,
                         user_message: str,
                         conversation_history: List[Dict],
                         context: Dict,
                         intent: str = None,
                         sentiment: float = 0.0) -> Tuple[str, Dict]:
        """
        Generate a complete response to the user's message.
        
        Args:
            user_message: User's message
            conversation_history: Previous conversation messages
            context: Current conversation context
            intent: Optional intent classification
            sentiment: Optional sentiment score (-1 to 1)
            
        Returns:
            Tuple[str, Dict]: Generated response and response metadata
        """
        # Get learning suggestions if available
        suggestions = {}
        if self.learning:
            suggestions = self.learning.get_learned_response_suggestions(user_message, context)
        
        # Get personality style
        style = self._get_response_style(suggestions.get("message_type", "general"))
        
        # Generate base response
        base_response = self._generate_base_response(user_message, suggestions, style)
        
        # Enhance with personality
        enhanced_response = self._enhance_response(base_response, style, context)
        
        # Add contextual elements
        contextualized_response = self._add_contextual_elements(
            enhanced_response, conversation_history, context
        )
        
        # Format response based on query type
        final_response = self.format_response(contextualized_response, user_message)
        
        # Generate metadata
        metadata = self._generate_response_metadata(final_response, suggestions, style)
        
        return final_response, metadata
    
    def _get_response_style(self, message_type: str) -> Dict[str, float]:
        """Get response style based on message type and personality."""
        style = self.personality_traits.copy()
        
        if message_type == "question":
            style['curiosity'] += 0.2
        elif message_type == "emotional":
            style['empathy'] += 0.2
        elif message_type == "technical":
            style['professional'] += 0.2
            style['formality'] += 0.1
        
        return style
    
    def _generate_base_response(self,
                              user_message: str,
                              suggestions: Dict,
                              style: Dict) -> str:
        """Generate base response using templates and learned patterns."""
        message_type = suggestions.get("message_type", "general")
        
        # Select appropriate template
        if message_type == "question":
            template_key = "clarification" if style["curiosity"] > 0.7 else "thinking"
        elif message_type == "statement":
            template_key = "acknowledgment"
        else:
            template_key = "greeting"
        
        # Get template
        templates = self.templates.get(template_key, self.templates['acknowledgment'])
        template = random.choice(templates)
        
        # Fill template
        topic = suggestions.get("topic", "that")
        response = template.format(topic=topic)
        
        return response
    
    def _enhance_response(self,
                         base_response: str,
                         style: Dict,
                         context: Dict) -> str:
        """Enhance response with personality and style."""
        # Adjust formality
        response = self._adjust_formality(base_response, style["formality"])
        
        # Add personality markers
        if style["creativity"] > 0.7:
            response = self._add_creative_elements(response)
        
        if style["empathy"] > 0.7:
            response = self._add_empathetic_elements(response, context)
        
        if style.get("humor", 0) > 0.6:
            response = self._add_humor_elements(response)
        
        return response
    
    def _add_contextual_elements(self,
                               response: str,
                               conversation_history: List[Dict],
                               context: Dict) -> str:
        """Add contextual elements to response."""
        # Add references to previous conversation
        if conversation_history:
            last_topic = conversation_history[-1].get("topic")
            if last_topic and last_topic in context.get("topics", []):
                response = f"Regarding {last_topic}, {response}"
        
        # Add learned preferences if available
        if self.personality and hasattr(self.personality, 'user_preferences'):
            user_preferences = self.personality.user_preferences
            if "topics_of_interest" in user_preferences:
                relevant_topics = set(user_preferences["topics_of_interest"]).intersection(
                    set(context.get("topics", []))
                )
                if relevant_topics:
                    response += f" I remember you're interested in {', '.join(relevant_topics)}."
        
        return response
    
    def _adjust_formality(self, response: str, formality: float) -> str:
        """Adjust response formality level."""
        informal_replacements = {
            "would like to": "want to",
            "could you": "can you",
            "I would": "I'd",
            "I am": "I'm",
            "it is": "it's",
            "that is": "that's"
        }
        
        formal_replacements = {
            "want to": "would like to",
            "can you": "could you",
            "I'd": "I would",
            "I'm": "I am",
            "it's": "it is",
            "that's": "that is"
        }
        
        if formality < 0.4:  # More informal
            for formal, informal in informal_replacements.items():
                response = response.replace(formal, informal)
        elif formality > 0.7:  # More formal
            for informal, formal in formal_replacements.items():
                response = response.replace(informal, formal)
        
        return response
    
    def _add_creative_elements(self, response: str) -> str:
        """Add creative elements to response."""
        creative_additions = [
            " 🤔",
            " Interesting thought!",
            " That's a unique perspective!",
            " I like how you think!",
            " That's creative!"
        ]
        return response + random.choice(creative_additions)
    
    def _add_empathetic_elements(self, response: str, context: Dict) -> str:
        """Add empathetic elements to response."""
        if "emotion" in context:
            emotion = context["emotion"]
            if emotion == "positive":
                return random.choice(self.templates['emotional']['positive']) + " " + response
            elif emotion == "negative":
                return random.choice(self.templates['emotional']['negative']) + " " + response
        return response
    
    def _add_humor_elements(self, response: str) -> str:
        """Add light humor to response."""
        humor_additions = [
            " 😊",
            " (pun intended!)",
            " *winks*",
            " - as they say!",
            " - or so I've heard!"
        ]
        return response + random.choice(humor_additions)
    
    def format_response(self, response: str, user_query: str) -> str:
        """Format response based on query type."""
        query_lower = user_query.lower()
        
        # Handle special formatting cases
        if any(keyword in query_lower for keyword in self.sports_keywords):
            return self._format_sports_response(response)
        elif any(keyword in query_lower for keyword in self.weather_keywords):
            return self._format_weather_response(response)
        elif any(keyword in query_lower for keyword in self.tech_keywords):
            return self._format_tech_response(response)
        elif any(keyword in query_lower for keyword in self.quick_answer_keywords):
            return self._format_quick_answer(response)
        
        # Check if concise format is requested
        if any(word in query_lower for word in ["brief", "short", "quick", "just tell me", "only"]):
            return self._format_concise(response)
        
        return response
    
    def _format_sports_response(self, response: str) -> str:
        """Format sports-related response."""
        try:
            lines = response.split('\n')
            formatted = "LIVE SPORTS UPDATE\n" + "-" * 30 + "\n"
            
            for line in lines:
                line = line.strip()
                if line:
                    if any(char in line for char in ['-', ':']):
                        formatted += f"Score: {line}\n"
                    elif "status" in line.lower():
                        formatted += f"Status: {line}\n"
                    else:
                        formatted += f"{line}\n"
            
            return formatted
        except Exception as e:
            logger.error(f"Error formatting sports response: {e}")
            return response
    
    def _format_weather_response(self, response: str) -> str:
        """Format weather-related response."""
        try:
            # Extract temperature
            temp_pattern = r'(\d+)°[CF]?'
            temps = re.findall(temp_pattern, response)
            
            # Extract conditions
            conditions = []
            weather_words = ["sunny", "cloudy", "rain", "clear", "overcast"]
            for word in weather_words:
                if word in response.lower():
                    conditions.append(word.title())
            
            if temps or conditions:
                formatted = []
                if temps:
                    formatted.append(f"Temp: {temps[0]}°")
                if conditions:
                    formatted.append(f"Conditions: {conditions[0]}")
                return " | ".join(formatted)
            
            return response
        except Exception as e:
            logger.error(f"Error formatting weather response: {e}")
            return response
    
    def _format_tech_response(self, response: str) -> str:
        """Format technology-related response."""
        try:
            # Extract key points
            lines = response.split('\n')
            key_points = []
            
            for line in lines:
                if any(keyword in line.lower() for keyword in self.tech_keywords):
                    clean_line = line.strip()
                    if clean_line and len(clean_line) < 100:
                        key_points.append(clean_line)
            
            if key_points:
                return "Key Points:\n" + "\n".join(f"• {point}" for point in key_points[:3])
            
            return response
        except Exception as e:
            logger.error(f"Error formatting tech response: {e}")
            return response
    
    def _format_quick_answer(self, response: str) -> str:
        """Format response for quick answer queries."""
        try:
            sentences = response.split('.')
            for sentence in sentences[:2]:
                sentence = sentence.strip()
                if len(sentence) > 20 and len(sentence) < 100:
                    return sentence
            return sentences[0].strip()
        except Exception as e:
            logger.error(f"Error formatting quick answer: {e}")
            return response
    
    def _format_concise(self, response: str) -> str:
        """Format response concisely."""
        try:
            sentences = response.split('.')
            if sentences:
                return sentences[0].strip()
            return response[:100] + "..." if len(response) > 100 else response
        except Exception as e:
            logger.error(f"Error formatting concise response: {e}")
            return response
    
    def _generate_response_metadata(self,
                                  response: str,
                                  suggestions: Dict,
                                  style: Dict) -> Dict:
        """Generate metadata about the response."""
        return {
            "timestamp": datetime.now().isoformat(),
            "response_length": len(response),
            "style_used": style,
            "suggestions_applied": bool(suggestions),
            "formality_level": style.get("formality", 0.5),
            "creativity_level": style.get("creativity", 0.5),
            "empathy_level": style.get("empathy", 0.5)
        }
    
    def update_personality_trait(self, trait: str, value: float):
        """Update a personality trait value."""
        if trait in self.personality_traits:
            self.personality_traits[trait] = max(0.0, min(1.0, value))
    
    def add_response_template(self, category: str, template: str):
        """Add a new response template."""
        if category not in self.templates:
            self.templates[category] = []
        self.templates[category].append(template) 