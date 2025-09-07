"""Module for making intelligent decisions about when to search."""

import re
from typing import List, Optional, Tuple

class SearchDecisionMaker:
    """Makes intelligent decisions about when to perform searches."""
    
    # Search trigger phrases that explicitly indicate a search request
    EXPLICIT_SEARCH_TRIGGERS = [
        r"(?i)look up",
        r"(?i)search for",
        r"(?i)find information about",
        r"(?i)tell me about",
        r"(?i)what is",
        r"(?i)who is",
        r"(?i)when (did|was)",
        r"(?i)where is",
        r"(?i)how (to|do|does|did)",
        r"(?i)give me info(rmation)? (on|about)",
        r"(?i)can you research",
        r"(?i)find out about",
        r"(?i)what do you know about",
        r"(?i)latest news (on|about)",
        r"(?i)current information (on|about)"
    ]
    
    # Phrases that indicate temporal context requiring fresh information
    TEMPORAL_TRIGGERS = [
        r"(?i)current",
        r"(?i)latest",
        r"(?i)recent",
        r"(?i)now",
        r"(?i)today",
        r"(?i)this week",
        r"(?i)this month",
        r"(?i)this year",
        r"(?i)updates? (on|about)",
        r"(?i)news about"
    ]
    
    # Phrases that indicate the user wants to verify or fact-check
    VERIFICATION_TRIGGERS = [
        r"(?i)verify",
        r"(?i)confirm",
        r"(?i)fact[- ]check",
        r"(?i)is it true",
        r"(?i)are you sure",
        r"(?i)can you confirm",
        r"(?i)double[- ]check"
    ]
    
    def __init__(self):
        """Initialize the search decision maker."""
        # Compile regular expressions for efficiency
        self.explicit_patterns = [re.compile(pattern) for pattern in self.EXPLICIT_SEARCH_TRIGGERS]
        self.temporal_patterns = [re.compile(pattern) for pattern in self.TEMPORAL_TRIGGERS]
        self.verification_patterns = [re.compile(pattern) for pattern in self.VERIFICATION_TRIGGERS]
    
    def should_search(self, query: str) -> Tuple[bool, str]:
        """Determine if a search should be performed for the given query.
        
        Args:
            query: The user's input query
            
        Returns:
            Tuple[bool, str]: (should_search, reason)
        """
        # Check for explicit search requests
        for pattern in self.explicit_patterns:
            if pattern.search(query):
                return True, "Explicit search request detected"
        
        # Check for temporal context requiring fresh information
        for pattern in self.temporal_patterns:
            if pattern.search(query):
                return True, "Current/recent information requested"
        
        # Check for verification requests
        for pattern in self.verification_patterns:
            if pattern.search(query):
                return True, "Verification/fact-checking requested"
        
        # Additional contextual analysis
        if self._contains_factual_question(query):
            return True, "Factual question detected"
        
        if self._requires_real_time_data(query):
            return True, "Real-time data required"
        
        return False, "No search triggers detected"
    
    def extract_search_terms(self, query: str) -> Optional[str]:
        """Extract the actual search terms from the query.
        
        Args:
            query: The user's input query
            
        Returns:
            Optional[str]: The extracted search terms, or None if no clear terms found
        """
        # Remove common search trigger phrases
        cleaned_query = query.lower()
        for pattern in self.explicit_patterns:
            cleaned_query = pattern.sub('', cleaned_query)
        
        # Remove question words and other common prefixes
        cleaned_query = re.sub(r'^(what|who|when|where|why|how|can you|could you|please|hey|hi|tell me|find|search)', '', cleaned_query, flags=re.IGNORECASE)
        
        # Remove punctuation and clean up whitespace
        cleaned_query = re.sub(r'[^\w\s]', ' ', cleaned_query)
        cleaned_query = ' '.join(cleaned_query.split())
        
        return cleaned_query if cleaned_query else None
    
    def _contains_factual_question(self, query: str) -> bool:
        """Check if the query contains a factual question.
        
        Args:
            query: The user's input query
            
        Returns:
            bool: True if the query contains a factual question
        """
        # Patterns for factual questions
        factual_patterns = [
            r"(?i)what (is|are|was|were) the",
            r"(?i)how many",
            r"(?i)which (one|ones|type|kind)",
            r"(?i)when (did|was|were)",
            r"(?i)where (is|are|was|were)",
            r"(?i)who (is|are|was|were)",
            r"(?i)why (is|are|was|were)"
        ]
        
        return any(re.search(pattern, query) for pattern in factual_patterns)
    
    def _requires_real_time_data(self, query: str) -> bool:
        """Check if the query requires real-time or very recent data.
        
        Args:
            query: The user's input query
            
        Returns:
            bool: True if the query requires real-time data
        """
        real_time_patterns = [
            r"(?i)weather",
            r"(?i)stock price",
            r"(?i)market",
            r"(?i)score",
            r"(?i)traffic",
            r"(?i)status",
            r"(?i)live",
            r"(?i)current",
            r"(?i)right now"
        ]
        
        return any(re.search(pattern, query) for pattern in real_time_patterns)
    
    def get_search_type(self, query: str) -> str:
        """Determine the type of search needed.
        
        Args:
            query: The user's input query
            
        Returns:
            str: The type of search needed ('web', 'news', 'academic', etc.)
        """
        # Check for news-related queries
        if any(term in query.lower() for term in ['news', 'latest', 'recent', 'update']):
            return 'news'
        
        # Check for academic/scientific queries
        if any(term in query.lower() for term in ['research', 'study', 'paper', 'scientific', 'academic']):
            return 'academic'
        
        # Check for technical documentation
        if any(term in query.lower() for term in ['documentation', 'docs', 'api', 'tutorial', 'guide']):
            return 'technical'
        
        # Default to web search
        return 'web' 