"""
Emotional Intelligence module for Nova AI.
Provides sentiment analysis and emotion detection capabilities.
"""

from typing import Dict, List, Tuple, Optional
import re
from collections import defaultdict

class EmotionalIntelligence:
    def __init__(self):
        # Basic emotion keywords for simple detection
        self.emotion_keywords = {
            'joy': ['happy', 'excited', 'glad', 'great', 'wonderful', 'fantastic'],
            'sadness': ['sad', 'unhappy', 'disappointed', 'upset', 'down'],
            'anger': ['angry', 'mad', 'furious', 'annoyed', 'frustrated'],
            'fear': ['afraid', 'scared', 'worried', 'anxious', 'nervous'],
            'surprise': ['surprised', 'shocked', 'amazed', 'unexpected'],
            'neutral': ['okay', 'fine', 'alright', 'normal']
        }
        
        # Sentiment modifiers
        self.intensifiers = ['very', 'really', 'extremely', 'absolutely']
        self.negators = ['not', "n't", 'never', 'no']
        
    def analyze_sentiment(self, text: str) -> Dict[str, float]:
        """
        Analyze the sentiment of text.
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dict with sentiment scores (positive, negative, neutral)
        """
        text = text.lower()
        words = text.split()
        
        scores = {
            'positive': 0.0,
            'negative': 0.0,
            'neutral': 0.0
        }
        
        # Simple sentiment scoring
        for emotion, keywords in self.emotion_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    if emotion in ['joy', 'surprise']:
                        scores['positive'] += 0.2
                    elif emotion in ['sadness', 'anger', 'fear']:
                        scores['negative'] += 0.2
                    else:
                        scores['neutral'] += 0.2
                        
        # Apply modifiers
        for i, word in enumerate(words):
            if word in self.intensifiers and i > 0:
                # Intensify previous sentiment
                if scores['positive'] > 0:
                    scores['positive'] *= 1.5
                if scores['negative'] > 0:
                    scores['negative'] *= 1.5
            elif word in self.negators:
                # Flip sentiments
                scores['positive'], scores['negative'] = scores['negative'], scores['positive']
        
        # Normalize scores
        total = sum(scores.values())
        if total > 0:
            for key in scores:
                scores[key] /= total
                
        return scores
    
    def detect_emotions(self, text: str) -> Dict[str, float]:
        """
        Detect emotions in text.
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dict mapping emotions to their confidence scores
        """
        text = text.lower()
        emotions = defaultdict(float)
        
        # Check for each emotion's keywords
        for emotion, keywords in self.emotion_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    emotions[emotion] += 0.2
                    
        # Normalize scores
        total = sum(emotions.values())
        if total > 0:
            for emotion in emotions:
                emotions[emotion] /= total
                
        return dict(emotions)
    
    def generate_emotional_response(self, user_emotion: Dict[str, float]) -> str:
        """
        Generate an appropriate emotional response based on detected user emotions.
        
        Args:
            user_emotion: Dict of detected emotions and their scores
            
        Returns:
            Appropriate emotional response prefix
        """
        # Find strongest emotion
        strongest_emotion = max(user_emotion.items(), key=lambda x: x[1])
        
        responses = {
            'joy': ["That's wonderful! ", "I'm glad to hear that! ", "How exciting! "],
            'sadness': ["I'm sorry to hear that. ", "That must be difficult. ", "I understand how you feel. "],
            'anger': ["I understand your frustration. ", "That's understandable to feel that way. ", "Let's work through this. "],
            'fear': ["Don't worry, ", "It's okay to feel anxious. ", "Let's address your concerns. "],
            'surprise': ["Wow! ", "That's unexpected! ", "How interesting! "],
            'neutral': ["I see. ", "Understood. ", "Got it. "]
        }
        
        emotion = strongest_emotion[0]
        if emotion in responses:
            return responses[emotion][0]  # Just use first response for simplicity
        return ""
    
    def adjust_response_tone(self, response: str, user_emotion: Dict[str, float]) -> str:
        """
        Adjust the tone of a response based on detected user emotions.
        
        Args:
            response: Original response text
            user_emotion: Dict of detected emotions and their scores
            
        Returns:
            Adjusted response with appropriate tone
        """
        # Add emotional prefix
        prefix = self.generate_emotional_response(user_emotion)
        
        # Simple tone adjustment
        if max(user_emotion.values()) > 0.5:  # Strong emotion detected
            response = prefix + response
            
        return response 