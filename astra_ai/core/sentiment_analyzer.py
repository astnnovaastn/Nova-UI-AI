from typing import Dict, Tuple
import logging

logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    """Analyzes sentiment in text."""
    
    def __init__(self):
        """Initialize the sentiment analyzer."""
        # Simple sentiment word lists
        self.positive_words = {
            'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic',
            'happy', 'love', 'like', 'enjoy', 'beautiful', 'perfect', 'best',
            'awesome', 'brilliant', 'nice', 'pleased', 'delighted', 'satisfied'
        }
        
        self.negative_words = {
            'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'dislike',
            'poor', 'wrong', 'difficult', 'hard', 'problem', 'issue', 'trouble',
            'upset', 'angry', 'sad', 'disappointed', 'frustrated', 'annoyed'
        }
    
    def analyze_sentiment(self, text: str) -> Tuple[float, Dict]:
        """Analyze sentiment in text.
        
        Args:
            text: Text to analyze
            
        Returns:
            Tuple[float, Dict]: Sentiment score (-1 to 1) and analysis details
        """
        try:
            # Convert to lowercase and split into words
            words = text.lower().split()
            
            # Count positive and negative words
            positive_count = sum(1 for word in words if word in self.positive_words)
            negative_count = sum(1 for word in words if word in self.negative_words)
            
            # Calculate sentiment score
            total_words = len(words)
            if total_words == 0:
                return 0.0, {'score': 0.0, 'positive': 0, 'negative': 0}
            
            # Normalize score between -1 and 1
            score = (positive_count - negative_count) / total_words
            
            # Ensure score is between -1 and 1
            score = max(min(score, 1.0), -1.0)
            
            return score, {
                'score': score,
                'positive': positive_count,
                'negative': negative_count,
                'total_words': total_words
            }
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return 0.0, {'score': 0.0, 'error': str(e)}

    def add_emotional_keyword(self, word: str, score: float, category: str):
        """Add a new emotional keyword.
        
        Args:
            word: The keyword to add
            score: Emotional score (-1 to 1)
            category: 'positive' or 'negative'
        """
        if category in self.emotional_keywords:
            self.emotional_keywords[category][word.lower()] = max(-1.0, min(1.0, score))
    
    def add_intensity_modifier(self, word: str, multiplier: float):
        """Add a new intensity modifier.
        
        Args:
            word: The modifier word
            multiplier: Intensity multiplier
        """
        self.intensity_modifiers[word.lower()] = max(0.0, multiplier) 