import re
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class QueryCleaner:
    """A class to clean and optimize search queries."""
    
    def __init__(self):
        # Common filler words and phrases to remove
        self.filler_words = [
            "can you", "please", "could you", "would you", "tell me",
            "i want to know", "i need to know", "i'm looking for",
            "show me", "find", "search for", "look up"
        ]
        
        # Grammar fixes for common patterns
        self.grammar_fixes = {
            r"\b(who|what|where|when|why|how) (is|are|was|were|do|does|did) (.*?)\b": r"\1 \2 \3",
            r"\b(.*?) (winning|losing|playing|score|match|game)\b": r"\1 is \2",
            r"\b(.*?) vs (.*?)\b": r"\1 versus \2",
            r"\b(.*?) v (.*?)\b": r"\1 versus \2"
        }
        
        # Common sports team names to normalize
        self.team_names = {
            "spain": "Spain",
            "portugal": "Portugal",
            "england": "England",
            "france": "France",
            "germany": "Germany",
            "italy": "Italy",
            "brazil": "Brazil",
            "argentina": "Argentina"
        }
        
        # Sports-related keywords
        self.sports_keywords = [
            "score", "match", "game", "team", "player", "goal", "penalty",
            "win", "won", "lose", "lost", "draw", "tie", "league", "cup",
            "championship", "tournament", "final", "semi-final", "quarter-final"
        ]
    
    def clean_query(self, query: str) -> str:
        """Clean and optimize a search query for better results.
        
        Args:
            query: The original search query
            
        Returns:
            str: Cleaned and optimized query
        """
        try:
            # Convert to lowercase and strip whitespace
            query = query.lower().strip()
            
            # Remove common filler words and phrases
            for word in self.filler_words:
                query = query.replace(word, "").strip()
            
            # Fix common grammar issues
            for pattern, replacement in self.grammar_fixes.items():
                query = re.sub(pattern, replacement, query)
            
            # Normalize sports team names
            for team, proper_name in self.team_names.items():
                query = re.sub(rf"\b{team}\b", proper_name, query, flags=re.IGNORECASE)
            
            # Add context for sports queries
            if any(keyword in query.lower() for keyword in self.sports_keywords):
                if "live" not in query.lower():
                    query = f"live {query}"
                if "update" not in query.lower():
                    query = f"{query} update"
            
            # Remove duplicate words
            words = query.split()
            query = " ".join(dict.fromkeys(words))
            
            return query.strip()
            
        except Exception as e:
            logger.error(f"Error cleaning query: {e}")
            return query  # Return original query if cleaning fails 