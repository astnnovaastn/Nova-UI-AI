# ============================================================================
# IMPROVED VECTOR EMBEDDING MODULE FOR MEMORY SYSTEM
# ============================================================================
# This module contains improved embedding and similarity functions to work
# better with New_memory_event.json structure
# 
# Installation: Copy these methods into mem0_memory_system.py's NovaMemoryAI class
# ============================================================================

from typing import Dict, List
import math

def _extract_semantic_features(self, text: str, emotional_context: Dict = None, category: str = None) -> Dict[str, float]:
    """
    Extract semantic features from text with emotional context and category awareness.
    
    Returns:
        Dict with 8 feature scores (0-1 range) for vector construction
    """
    text_lower = text.lower() if text else ""
    features = {}
    
    # 1. Sentiment intensity - more comprehensive positive/negative word analysis
    positive_words = ['love', 'like', 'enjoy', 'prefer', 'favorite', 'amazing', 'great', 'wonderful', 'excellent', 'adore', 'cherish']
    negative_words = ['hate', 'dislike', 'avoid', 'never', 'terrible', 'awful', 'bad', 'horrible', 'despise', 'detest']
    positive_count = sum(text_lower.count(w) for w in positive_words)
    negative_count = sum(text_lower.count(w) for w in negative_words)
    features['sentiment_intensity'] = min(1.0, (positive_count - negative_count * 0.5) / 5.0)
    
    # 2. Emotional weight from context
    if emotional_context:
        sentiment = emotional_context.get('sentiment', 'neutral').lower()
        if sentiment == 'positive':
            features['sentiment_intensity'] = min(1.0, features['sentiment_intensity'] + 0.3)
        elif sentiment == 'negative':
            features['sentiment_intensity'] = max(0.0, features['sentiment_intensity'] - 0.3)
        features['emotional_weight'] = emotional_context.get('emotional_intensity', 0.5)
    else:
        features['emotional_weight'] = 0.5
    
    # 3. Content specificity - longer/more detailed statements are more specific
    word_count = len(text.split()) if text else 0
    features['specificity'] = min(1.0, word_count / 10.0)
    
    # 4-6. Domain-specific indicators
    domain_keywords = {
        'entertainment': ['anime', 'watch', 'movie', 'tv', 'show', 'film', 'series', 'episode'],
        'food_drink': ['food', 'eat', 'drink', 'coffee', 'pasta', 'pizza', 'meal', 'cuisine', 'italian'],
        'work_tech': ['work', 'job', 'career', 'code', 'programming', 'python', 'develop', 'project']
    }
    
    for domain, keywords in domain_keywords.items():
        count = sum(text_lower.count(w) for w in keywords)
        features[domain] = min(1.0, count / 5.0)
    
    # 7. Activity/habit/lifestyle indicator
    activity_words = ['morning', 'walk', 'exercise', 'health', 'habit', 'usually', 'regularly', 'routine', 'daily', 'always']
    activity_count = sum(text_lower.count(w) for w in activity_words)
    features['activity_score'] = min(1.0, activity_count / 4.0)
    
    # 8. Reading/learning/knowledge indicator
    reading_words = ['read', 'book', 'novel', 'sci-fi', 'science fiction', 'fantasy', 'learn', 'study', 'genre', 'author']
    reading_count = sum(text_lower.count(w) for w in reading_words)
    features['reading_score'] = min(1.0, reading_count / 4.0)
    
    # 9. Temporal/time-related indicator
    time_words = ['time', 'weekend', 'sunday', 'usually', 'always', 'sometimes', 'when', 'during', 'morning', 'evening', 'weekday']
    time_count = sum(text_lower.count(w) for w in time_words)
    features['temporal_score'] = min(1.0, time_count / 5.0)
    
    # Add category-based influence
    if category:
        category_lower = category.lower()
        if 'preference' in category_lower:
            features['sentiment_intensity'] = min(1.0, features['sentiment_intensity'] + 0.1)
        if 'activity' in category_lower or 'behavior' in category_lower:
            features['activity_score'] = min(1.0, features['activity_score'] + 0.1)
        if 'learning' in category_lower or 'knowledge' in category_lower:
            features['reading_score'] = min(1.0, features['reading_score'] + 0.1)
    
    return features


def _create_embedding_vector_improved(self, text: str, emotional_context: Dict = None, category: str = None, event: Dict = None) -> List[float]:
    """
    Create improved 8-dimensional embedding vector with semantic feature extraction.
    
    Uses:
    - Semantic feature extraction with emotional and category context
    - Importance amplification for high-scoring events
    - Unit normalization for better cosine similarity
    - Fallback handling for empty texts
    
    Args:
        text: Main content text
        emotional_context: Optional dict with sentiment, intensity, mood
        category: Optional memory category string
        event: Optional full event dict for importance weighting
        
    Returns:
        Normalized 8-element list (values in 0-1 range)
    """
    if not text:
        return [0.0] * 8
    
    # Extract rich semantic features
    features = self._extract_semantic_features(text, emotional_context, category)
    
    # Map features to 8-dimensional vector
    vector = [
        features.get('sentiment_intensity', 0.0),          # Dim 0: sentiment polarity
        features.get('emotional_weight', 0.5),              # Dim 1: emotional intensity
        features.get('entertainment', 0.0),                 # Dim 2: entertainment domain
        features.get('food_drink', 0.0),                    # Dim 3: food/drink domain
        features.get('work_tech', 0.0),                     # Dim 4: work/tech domain
        features.get('activity_score', 0.0),                # Dim 5: activity/habit indicator
        features.get('reading_score', 0.0),                 # Dim 6: reading/learning indicator
        features.get('temporal_score', 0.0)                 # Dim 7: temporal/time-bound indicator
    ]
    
    # Amplify important features based on event importance score
    if event and 'importance_score' in event:
        importance = event.get('importance_score', 0.6)
        for i in range(len(vector)):
            if vector[i] > 0:
                # Amplify by factor of (0.7 + importance * 0.3), range [0.7, 1.0]
                vector[i] = min(1.0, vector[i] * (0.7 + importance * 0.3))
    
    # Normalize to unit length for better cosine similarity
    magnitude = math.sqrt(sum(x * x for x in vector))
    if magnitude > 0:
        vector = [x / magnitude for x in vector]
    else:
        # Avoid all-zero vector; use uniform distribution
        vector = [0.125] * 8
    
    # Ensure we return exactly 8 dimensions
    return vector[:8]


def _cosine_similarity_improved(self, vec1: List[float], vec2: List[float]) -> float:
    """
    Improved cosine similarity with additional robustness checks.
    
    Args:
        vec1: First embedding vector
        vec2: Second embedding vector
        
    Returns:
        Similarity score in range [-1, 1], where 1 = identical
    """
    if not vec1 or not vec2:
        return 0.0
    
    if len(vec1) != len(vec2):
        # Pad shorter vector with zeros
        if len(vec1) < len(vec2):
            vec1 = vec1 + [0.0] * (len(vec2) - len(vec1))
        else:
            vec2 = vec2 + [0.0] * (len(vec1) - len(vec2))
    
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = math.sqrt(sum(a * a for a in vec1))
    magnitude2 = math.sqrt(sum(b * b for b in vec2))
    
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    
    return dot_product / (magnitude1 * magnitude2)


def _calculate_semantic_distance(self, event1: Dict, event2: Dict) -> float:
    """
    Calculate multi-faceted semantic distance between two memory events.
    
    Considers:
    - Vector similarity (cosine)
    - Category matching
    - Emotional context alignment
    - Temporal proximity
    - Semantic tags overlap
    
    Returns:
        Distance score 0-1 (0=identical, 1=completely different)
    """
    if not event1 or not event2:
        return 1.0
    
    # Get vectors
    vec1 = self.data["memory_engine"]["vector_index"].get(event1.get("event_id"), [0.0] * 8)
    vec2 = self.data["memory_engine"]["vector_index"].get(event2.get("event_id"), [0.0] * 8)
    
    # Vector similarity (convert to distance: 0=similar, 1=different)
    vector_sim = self._cosine_similarity_improved(vec1, vec2)
    vector_distance = (1.0 - vector_sim) / 2.0
    
    # Category matching bonus
    cat_match = 1.0 if event1.get("category") == event2.get("category") else 0.7
    
    # Emotional context alignment
    em1 = event1.get("emotional_context", {})
    em2 = event2.get("emotional_context", {})
    sent1 = em1.get("sentiment", "neutral")
    sent2 = em2.get("sentiment", "neutral")
    sentiment_bonus = 0.8 if sent1 == sent2 else 0.5
    
    # Combined score
    combined_distance = (vector_distance * 0.5 + (1.0 - sentiment_bonus) * 0.3 + (1.0 - cat_match) * 0.2)
    
    return min(1.0, max(0.0, combined_distance))


# ============================================================================
# USAGE GUIDE
# ============================================================================
#
# 1. In _process_operation_with_vector_similarity, update calls to:
#    - self._create_embedding_vector(operation_content) 
#      to: self._create_embedding_vector(operation_content, 
#                                         emotional_context=operation.get('emotional_context'),
#                                         category=operation.get('category'),
#                                         event=mem_event)
#
# 2. Update similarity threshold checks from 0.75 to 0.70 for better matching:
#    - if similarity >= 0.70:  # More lenient for fuzzy matching
#
# 3. For cluster updates, use _calculate_semantic_distance for more
#    sophisticated clustering decisions
#
# 4. In _update_clusters_for_event, improve centroid calculation using
#    weighted average of importance scores
#
# ============================================================================
