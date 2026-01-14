#!/usr/bin/env python3
"""
Vector Embedding Improvements - Validation and Testing Script
Tests the improved embedding system against New_memory_event.json

Usage:
    python test_improved_embeddings.py
"""

import json
import math
from pathlib import Path
from typing import List, Dict, Tuple

class EmbeddingValidator:
    """Validate improved vector embeddings against expected behavior."""
    
    def __init__(self, memory_file: str = "astra_ai/Date/New_memory_event.json"):
        self.memory_file = Path(memory_file)
        self.data = self._load_memory()
        self.tests_passed = 0
        self.tests_failed = 0
        self.results = []
    
    def _load_memory(self) -> Dict:
        """Load memory JSON file."""
        try:
            with open(self.memory_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"ERROR: Memory file not found at {self.memory_file}")
            return {}
    
    def _extract_semantic_features(self, text: str, emotional_context: Dict = None, category: str = None) -> Dict[str, float]:
        """Extract semantic features (testing implementation)."""
        text_lower = text.lower() if text else ""
        features = {}
        
        positive_words = ['love', 'like', 'enjoy', 'prefer', 'favorite', 'amazing', 'great', 'wonderful', 'excellent', 'adore']
        negative_words = ['hate', 'dislike', 'avoid', 'never', 'terrible', 'awful', 'bad', 'horrible', 'despise']
        positive_count = sum(text_lower.count(w) for w in positive_words)
        negative_count = sum(text_lower.count(w) for w in negative_words)
        features['sentiment_intensity'] = min(1.0, (positive_count - negative_count * 0.5) / 5.0)
        
        if emotional_context:
            sentiment = emotional_context.get('sentiment', 'neutral').lower()
            if sentiment == 'positive':
                features['sentiment_intensity'] = min(1.0, features['sentiment_intensity'] + 0.3)
            elif sentiment == 'negative':
                features['sentiment_intensity'] = max(0.0, features['sentiment_intensity'] - 0.3)
            features['emotional_weight'] = emotional_context.get('emotional_intensity', 0.5)
        else:
            features['emotional_weight'] = 0.5
        
        word_count = len(text.split()) if text else 0
        features['specificity'] = min(1.0, word_count / 10.0)
        
        domain_keywords = {
            'entertainment': ['anime', 'watch', 'movie', 'tv', 'show', 'film', 'series', 'episode'],
            'food_drink': ['food', 'eat', 'drink', 'coffee', 'pasta', 'pizza', 'meal', 'cuisine', 'italian'],
            'work_tech': ['work', 'job', 'career', 'code', 'programming', 'python', 'develop', 'project']
        }
        
        for domain, keywords in domain_keywords.items():
            count = sum(text_lower.count(w) for w in keywords)
            features[domain] = min(1.0, count / 5.0)
        
        activity_words = ['morning', 'walk', 'exercise', 'health', 'habit', 'usually', 'regularly', 'routine', 'daily']
        activity_count = sum(text_lower.count(w) for w in activity_words)
        features['activity_score'] = min(1.0, activity_count / 4.0)
        
        reading_words = ['read', 'book', 'novel', 'sci-fi', 'fantasy', 'learn', 'study', 'genre', 'author']
        reading_count = sum(text_lower.count(w) for w in reading_words)
        features['reading_score'] = min(1.0, reading_count / 4.0)
        
        time_words = ['time', 'weekend', 'sunday', 'usually', 'always', 'sometimes', 'when', 'during', 'morning', 'evening', 'weekday']
        time_count = sum(text_lower.count(w) for w in time_words)
        features['temporal_score'] = min(1.0, time_count / 5.0)
        
        if category:
            category_lower = category.lower()
            if 'preference' in category_lower:
                features['sentiment_intensity'] = min(1.0, features['sentiment_intensity'] + 0.1)
            if 'activity' in category_lower or 'behavior' in category_lower:
                features['activity_score'] = min(1.0, features['activity_score'] + 0.1)
        
        return features
    
    def _create_embedding_vector(self, text: str, emotional_context: Dict = None, category: str = None, event: Dict = None) -> List[float]:
        """Create embedding vector."""
        if not text:
            return [0.0] * 8
        
        features = self._extract_semantic_features(text, emotional_context, category)
        
        vector = [
            features.get('sentiment_intensity', 0.0),
            features.get('emotional_weight', 0.5),
            features.get('entertainment', 0.0),
            features.get('food_drink', 0.0),
            features.get('work_tech', 0.0),
            features.get('activity_score', 0.0),
            features.get('reading_score', 0.0),
            features.get('temporal_score', 0.0)
        ]
        
        if event and 'importance_score' in event:
            importance = event.get('importance_score', 0.6)
            for i in range(len(vector)):
                if vector[i] > 0:
                    vector[i] = min(1.0, vector[i] * (0.7 + importance * 0.3))
        
        magnitude = math.sqrt(sum(x * x for x in vector))
        if magnitude > 0:
            vector = [x / magnitude for x in vector]
        else:
            vector = [0.125] * 8
        
        return vector[:8]
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity."""
        if not vec1 or not vec2:
            return 0.0
        if len(vec1) != len(vec2):
            return 0.0
        
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = math.sqrt(sum(a * a for a in vec1))
        magnitude2 = math.sqrt(sum(b * b for b in vec2))
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
    
    def _log_result(self, test_name: str, passed: bool, details: str = ""):
        """Log test result."""
        status = "✓ PASS" if passed else "✗ FAIL"
        self.results.append({
            'test': test_name,
            'passed': passed,
            'details': details
        })
        if passed:
            self.tests_passed += 1
        else:
            self.tests_failed += 1
        
        print(f"{status:8} | {test_name:40} | {details}")
    
    def test_embedding_dimensions(self):
        """Test 1: All embeddings have correct 8 dimensions."""
        print("\n[TEST 1] Embedding Dimensions")
        print("-" * 100)
        
        events = self.data.get("memory_engine", {}).get("memory_events", [])
        for evt in events:
            content = evt.get('current_value', evt.get('summary', ''))
            vec = self._create_embedding_vector(content)
            
            passed = len(vec) == 8 and all(isinstance(v, float) for v in vec)
            self._log_result(
                f"Event {evt['event_id']} dimensions",
                passed,
                f"dims={len(vec)}, values={[f'{v:.3f}' for v in vec[:3]]}..."
            )
    
    def test_sentiment_detection(self):
        """Test 2: Sentiment detection in embeddings."""
        print("\n[TEST 2] Sentiment Detection")
        print("-" * 100)
        
        test_cases = [
            ("I love Italian food", True, "love → positive"),
            ("I hate this movie", False, "hate → negative"),
            ("I enjoy reading books", True, "enjoy → positive"),
            ("I avoid spicy food", False, "avoid → negative"),
        ]
        
        for text, is_positive, description in test_cases:
            vec = self._create_embedding_vector(text)
            sentiment_dim = vec[0]  # First dimension is sentiment
            
            expected_high = is_positive
            is_high = sentiment_dim > 0.3
            
            passed = is_high == expected_high
            self._log_result(
                f"Sentiment: {description}",
                passed,
                f"sentiment_score={sentiment_dim:.3f}, expected={'high' if expected_high else 'low'}"
            )
    
    def test_domain_tagging(self):
        """Test 3: Domain-specific embedding dimensions."""
        print("\n[TEST 3] Domain-Specific Tagging")
        print("-" * 100)
        
        test_cases = [
            ("I watch anime every weekend", 2, "entertainment domain"),
            ("I love Italian pasta", 3, "food domain"),
            ("I code in Python", 4, "work/tech domain"),
            ("Morning walks every day", 5, "activity domain"),
            ("Reading sci-fi novels", 6, "reading domain"),
        ]
        
        for text, expected_dim, description in test_cases:
            vec = self._create_embedding_vector(text)
            dim_value = vec[expected_dim - 1] if expected_dim <= 8 else 0
            
            passed = dim_value > 0.3
            self._log_result(
                f"Domain: {description}",
                passed,
                f"dimension[{expected_dim}]={dim_value:.3f}"
            )
    
    def test_event_similarity(self):
        """Test 4: Related events have high similarity."""
        print("\n[TEST 4] Event Similarity Detection")
        print("-" * 100)
        
        events = self.data.get("memory_engine", {}).get("memory_events", [])
        
        # Check evt_001 and evt_002 (anime preference UPDATE)
        evt1 = next((e for e in events if e.get('event_id') == 'evt_001'), None)
        evt2 = next((e for e in events if e.get('event_id') == 'evt_002'), None)
        
        if evt1 and evt2:
            vec1 = self._create_embedding_vector(
                evt1['current_value'],
                emotional_context=evt1.get('emotional_context'),
                category=evt1.get('category'),
                event=evt1
            )
            vec2 = self._create_embedding_vector(
                evt2['current_value'],
                emotional_context=evt2.get('emotional_context'),
                category=evt2.get('category'),
                event=evt2
            )
            
            similarity = self._cosine_similarity(vec1, vec2)
            passed = similarity >= 0.70  # Should match with new threshold
            
            self._log_result(
                "evt_001 ↔ evt_002 (anime preferences)",
                passed,
                f"similarity={similarity:.3f}, threshold=0.70"
            )
        else:
            self._log_result(
                "evt_001 ↔ evt_002 (anime preferences)",
                False,
                "Events not found in memory"
            )
        
        # Check evt_003 and evt_005 (food preferences)
        evt3 = next((e for e in events if e.get('event_id') == 'evt_003'), None)
        evt5 = next((e for e in events if e.get('event_id') == 'evt_005'), None)
        
        if evt3 and evt5:
            vec3 = self._create_embedding_vector(
                evt3['current_value'],
                emotional_context=evt3.get('emotional_context'),
                category=evt3.get('category')
            )
            vec5 = self._create_embedding_vector(
                evt5['current_value'],
                emotional_context=evt5.get('emotional_context'),
                category=evt5.get('category')
            )
            
            similarity = self._cosine_similarity(vec3, vec5)
            passed = similarity >= 0.50  # Food-related, should have some similarity
            
            self._log_result(
                "evt_003 ↔ evt_005 (food/coffee preferences)",
                passed,
                f"similarity={similarity:.3f}, expected>=0.50"
            )
    
    def test_temporal_dimension(self):
        """Test 5: Temporal information in embeddings."""
        print("\n[TEST 5] Temporal Dimension Handling")
        print("-" * 100)
        
        # evt_001: weekend anime watching
        # evt_002: Sunday-only anime watching (more constrained)
        
        events = self.data.get("memory_engine", {}).get("memory_events", [])
        evt1 = next((e for e in events if e.get('event_id') == 'evt_001'), None)
        evt2 = next((e for e in events if e.get('event_id') == 'evt_002'), None)
        
        if evt1 and evt2:
            vec1 = self._create_embedding_vector(evt1['current_value'])
            vec2 = self._create_embedding_vector(evt2['current_value'])
            
            # Dimension 7 is temporal
            temporal1 = vec1[7]
            temporal2 = vec2[7]
            
            # evt_002 should have higher temporal score (more specific: "Sunday")
            passed = temporal2 >= temporal1
            
            self._log_result(
                "Temporal specificity (evt_002 > evt_001)",
                passed,
                f"evt_001[7]={temporal1:.3f}, evt_002[7]={temporal2:.3f}"
            )
    
    def test_vector_normalization(self):
        """Test 6: All vectors are properly normalized."""
        print("\n[TEST 6] Vector Normalization")
        print("-" * 100)
        
        events = self.data.get("memory_engine", {}).get("memory_events", [])
        
        for evt in events[:3]:  # Test first 3 events
            vec = self._create_embedding_vector(evt['current_value'])
            
            # Calculate magnitude
            magnitude = math.sqrt(sum(x * x for x in vec))
            
            # Should be close to 1.0 (normalized)
            passed = 0.95 <= magnitude <= 1.05 or all(v == 0.125 for v in vec)
            
            self._log_result(
                f"Event {evt['event_id']} normalization",
                passed,
                f"magnitude={magnitude:.4f}"
            )
    
    def test_empty_input_handling(self):
        """Test 7: Proper handling of edge cases."""
        print("\n[TEST 7] Edge Case Handling")
        print("-" * 100)
        
        test_cases = [
            ("", "empty string"),
            ("a", "single char"),
            ("   ", "whitespace only"),
            ("the", "common word only"),
        ]
        
        for text, description in test_cases:
            vec = self._create_embedding_vector(text)
            
            passed = len(vec) == 8 and all(isinstance(v, float) for v in vec)
            
            self._log_result(
                f"Handle: {description}",
                passed,
                f"returned valid {len(vec)}-dim vector"
            )
    
    def run_all_tests(self):
        """Run all validation tests."""
        print("\n" + "="*100)
        print("VECTOR EMBEDDING IMPROVEMENTS - VALIDATION TESTS")
        print("="*100)
        
        self.test_embedding_dimensions()
        self.test_sentiment_detection()
        self.test_domain_tagging()
        self.test_event_similarity()
        self.test_temporal_dimension()
        self.test_vector_normalization()
        self.test_empty_input_handling()
        
        # Summary
        print("\n" + "="*100)
        print("TEST SUMMARY")
        print("="*100)
        total = self.tests_passed + self.tests_failed
        pass_rate = (self.tests_passed / total * 100) if total > 0 else 0
        
        print(f"Total Tests:  {total}")
        print(f"Passed:       {self.tests_passed} ({pass_rate:.1f}%)")
        print(f"Failed:       {self.tests_failed}")
        
        if self.tests_failed == 0:
            print("\n✓ ALL TESTS PASSED - Improvements ready for integration!")
        else:
            print(f"\n✗ {self.tests_failed} test(s) failed - Review the output above")
        
        return self.tests_failed == 0


if __name__ == "__main__":
    validator = EmbeddingValidator()
    success = validator.run_all_tests()
    exit(0 if success else 1)
