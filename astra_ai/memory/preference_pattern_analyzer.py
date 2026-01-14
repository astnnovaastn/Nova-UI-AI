"""
Preference Pattern Analyzer
Enhanced module for detecting patterns in user preferences and behaviors.

This module extends the existing memory system with advanced pattern recognition capabilities
that can identify recurring themes, preference evolution, and behavioral patterns.
"""

import re
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any, Optional
from collections import defaultdict, Counter
from dataclasses import dataclass, asdict
from enum import Enum

# Import existing memory system components
from astra_ai.memory.mem0_memory_system import MemoryCategory
from astra_ai.memory.Mem0_ai_organizer import AIOrganizer


class PatternType(Enum):
    """Types of patterns that can be detected in user preferences"""
    RECURRING_THEME = "recurring_theme"
    PREFERENCE_EVOLUTION = "preference_evolution"
    BEHAVIORAL_PATTERN = "behavioral_pattern"
    TEMPORAL_PATTERN = "temporal_pattern"
    CONTRASTING_PREFERENCE = "contrasting_preference"
    EMOTIONAL_ASSOCIATION = "emotional_association"
    CATEGORY_CORRELATION = "category_correlation"


@dataclass
class DetectedPattern:
    """Represents a detected pattern in user preferences"""
    pattern_id: str
    pattern_type: str
    description: str
    confidence: float
    supporting_evidence: List[str]
    related_categories: List[str]
    timestamp: str
    strength_score: float = 0.0
    frequency: int = 1


class PreferencePatternAnalyzer:
    """
    Advanced analyzer for detecting patterns in user preferences and behaviors.
    
    This analyzer works alongside the existing AIOrganizer to identify complex patterns
    in user preferences that might not be immediately obvious from individual memory entries.
    """
    
    def __init__(self, memory_data: Dict[str, Any]):
        """
        Initialize the pattern analyzer with memory data.
        
        Args:
            memory_data: The complete memory data structure to analyze
        """
        self.memory_data = memory_data
        self.detected_patterns = []
        self.pattern_history = defaultdict(list)
        
        # Initialize pattern detection rules
        self._initialize_pattern_rules()
        
    def _initialize_pattern_rules(self):
        """Initialize rules for different types of pattern detection"""
        self.pattern_rules = {
            "temporal_patterns": [
                r"(?:usually|always|often|rarely|never|every|daily|weekly|monthly)\s+(?:do|use|like|prefer|enjoy)\s+(.+)",
                r"(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekend|morning|afternoon|evening)\s+(?:i|we|you)\s+(?:do|use|like|prefer|enjoy)\s+(.+)"
            ],
            "emotional_patterns": [
                r"(?:happy|excited|pleased|satisfied)\s+(?:when|about|with)\s+(.+)",
                r"(?:sad|angry|frustrated|annoyed|disappointed)\s+(?:about|with|when)\s+(.+)"
            ],
            "contrast_patterns": [
                r"(?:instead of|rather than|rather)\s+(.+?)\s+(?:i|we|you)\s+(?:now|currently|recently)\s+(?:like|prefer|enjoy)\s+(.+)",
                r"(?:used to|previously)\s+(?:like|prefer|enjoy)\s+(.+?)\s+(?:but|now)\s+(?:i|we|you)\s+(?:like|prefer|enjoy)\s+(.+)"
            ],
            "evolution_patterns": [
                r"(?:getting better at|improving|developing)\s+(.+)",
                r"(?:learning|studying)\s+(.+)",
                r"(?:working towards|trying to|aiming to)\s+(.+)"
            ]
        }
        
        # Keywords for different preference categories
        self.preference_keywords = {
            "likes": ["like", "love", "enjoy", "adore", "appreciate", "prefer"],
            "dislikes": ["dislike", "hate", "despise", "loathe", "detest"],
            "avoid": ["avoid", "stay away from", "don't like", "don't enjoy"],
            "interests": ["interested in", "interested by", "fascinated by", "curious about"],
            "goals": ["want to", "aim to", "hope to", "plan to", "intend to", "goal is"]
        }
        
    def analyze_preference_patterns(self) -> List[DetectedPattern]:
        """
        Analyze all memory data to detect patterns in user preferences.
        
        Returns:
            List of detected patterns with supporting evidence
        """
        patterns = []
        
        # 1. Analyze temporal patterns in preferences
        temporal_patterns = self._detect_temporal_patterns()
        patterns.extend(temporal_patterns)
        
        # 2. Analyze emotional associations with preferences
        emotional_patterns = self._detect_emotional_patterns()
        patterns.extend(emotional_patterns)
        
        # 3. Analyze preference evolution over time
        evolution_patterns = self._detect_preference_evolution()
        patterns.extend(evolution_patterns)
        
        # 4. Analyze contrasting preferences
        contrast_patterns = self._detect_contrasting_preferences()
        patterns.extend(contrast_patterns)
        
        # 5. Analyze category correlations
        correlation_patterns = self._detect_category_correlations()
        patterns.extend(correlation_patterns)
        
        # 6. Find recurring themes
        theme_patterns = self._detect_recurring_themes()
        patterns.extend(theme_patterns)
        
        # Store detected patterns
        self.detected_patterns = patterns
        
        # Update pattern history
        for pattern in patterns:
            self.pattern_history[pattern.pattern_type].append(pattern)
            
        return patterns
    
    def _detect_temporal_patterns(self) -> List[DetectedPattern]:
        """Detect temporal patterns in user preferences"""
        patterns = []
        
        # Get all memory events
        memory_events = self.memory_data.get("memory_events", [])
        
        # Look for temporal keywords in memory events
        temporal_matches = defaultdict(list)
        
        for event in memory_events:
            if not isinstance(event, dict):
                continue
                
            summary = str(event.get("summary", ""))
            timestamp = event.get("timestamp", "")
            
            # Check for temporal patterns
            for pattern in self.pattern_rules["temporal_patterns"]:
                matches = re.findall(pattern, summary, re.IGNORECASE)
                for match in matches:
                    temporal_matches[match.lower().strip()].append({
                        "timestamp": timestamp,
                        "summary": summary
                    })
        
        # Create patterns for frequently occurring temporal preferences
        for preference, occurrences in temporal_matches.items():
            if len(occurrences) >= 2:  # Need at least 2 occurrences to form a pattern
                # Calculate time-based consistency
                time_consistency = self._calculate_time_consistency(occurrences)
                
                if time_consistency > 0.5:  # Strong enough temporal pattern
                    pattern = DetectedPattern(
                        pattern_id=f"pat_{uuid.uuid4().hex[:8]}",
                        pattern_type=PatternType.TEMPORAL_PATTERN.value,
                        description=f"User consistently engages with '{preference}' at specific times",
                        confidence=min(0.9, time_consistency + 0.1),
                        supporting_evidence=[occ["summary"] for occ in occurrences[:5]],
                        related_categories=[MemoryCategory.ACTIVITY_BEHAVIOR.value, MemoryCategory.PERSONAL_PREFERENCES.value],
                        timestamp=datetime.now().isoformat(),
                        strength_score=time_consistency,
                        frequency=len(occurrences)
                    )
                    patterns.append(pattern)
        
        return patterns
    
    def _detect_emotional_patterns(self) -> List[DetectedPattern]:
        """Detect emotional associations with preferences"""
        patterns = []
        
        # Get all memory events
        memory_events = self.memory_data.get("memory_events", [])
        
        # Look for emotional keywords in memory events
        emotional_matches = defaultdict(list)
        
        for event in memory_events:
            if not isinstance(event, dict):
                continue
                
            summary = str(event.get("summary", ""))
            timestamp = event.get("timestamp", "")
            emotional_context = event.get("emotional_context", {})
            
            # Check for emotional patterns
            for pattern in self.pattern_rules["emotional_patterns"]:
                matches = re.findall(pattern, summary, re.IGNORECASE)
                for match in matches:
                    emotional_matches[match.lower().strip()].append({
                        "timestamp": timestamp,
                        "summary": summary,
                        "emotional_context": emotional_context
                    })
        
        # Create patterns for emotionally associated preferences
        for preference, occurrences in emotional_matches.items():
            if len(occurrences) >= 2:
                # Calculate emotional consistency
                emotional_consistency = self._calculate_emotional_consistency(occurrences)
                
                if emotional_consistency > 0.5:
                    pattern = DetectedPattern(
                        pattern_id=f"pat_{uuid.uuid4().hex[:8]}",
                        pattern_type=PatternType.EMOTIONAL_ASSOCIATION.value,
                        description=f"User consistently associates '{preference}' with strong emotions",
                        confidence=min(0.9, emotional_consistency + 0.1),
                        supporting_evidence=[occ["summary"] for occ in occurrences[:5]],
                        related_categories=[MemoryCategory.PERSONAL_PREFERENCES.value, MemoryCategory.PERSONAL_DEVELOPMENT.value],
                        timestamp=datetime.now().isoformat(),
                        strength_score=emotional_consistency,
                        frequency=len(occurrences)
                    )
                    patterns.append(pattern)
        
        return patterns
    
    def _detect_preference_evolution(self) -> List[DetectedPattern]:
        """Detect how user preferences evolve over time"""
        patterns = []
        
        # Get fact history to analyze preference evolution
        fact_history = self.memory_data.get("fact_history", {})
        
        # Look for evolving preferences
        for fact_key, history in fact_history.items():
            if not isinstance(history, list) or len(history) < 2:
                continue
                
            # Check if this is a preference-related fact
            if "preference" in fact_key.lower() or any(cat in fact_key for cat in ["likes", "dislikes", "avoid", "interests"]):
                # Analyze the evolution pattern
                evolution_pattern = self._analyze_preference_evolution(history)
                
                if evolution_pattern:
                    patterns.append(evolution_pattern)
        
        return patterns
    
    def _analyze_preference_evolution(self, history: List[Dict]) -> Optional[DetectedPattern]:
        """Analyze how a specific preference has evolved over time"""
        if len(history) < 2:
            return None
            
        # Get the first and last entries
        first_entry = history[0]
        last_entry = history[-1]
        
        # Extract values
        first_value = str(first_entry.get("value", first_entry.get("item", "")))
        last_value = str(last_entry.get("value", last_entry.get("item", "")))
        
        if first_value != last_value:
            # Preference has changed, create evolution pattern
            pattern = DetectedPattern(
                pattern_id=f"pat_{uuid.uuid4().hex[:8]}",
                pattern_type=PatternType.PREFERENCE_EVOLUTION.value,
                description=f"User preference evolved from '{first_value}' to '{last_value}'",
                confidence=0.8,
                supporting_evidence=[
                    f"Initial preference: {first_value}",
                    f"Current preference: {last_value}",
                    f"Evolution over {len(history)} updates"
                ],
                related_categories=[MemoryCategory.PERSONAL_PREFERENCES.value],
                timestamp=datetime.now().isoformat(),
                strength_score=0.8,
                frequency=len(history)
            )
            return pattern
            
        return None
    
    def _detect_contrasting_preferences(self) -> List[DetectedPattern]:
        """Detect contrasting or opposing preferences"""
        patterns = []
        
        # Get all memory events
        memory_events = self.memory_data.get("memory_events", [])
        
        # Look for contrasting patterns
        contrast_matches = defaultdict(list)
        
        for event in memory_events:
            if not isinstance(event, dict):
                continue
                
            summary = str(event.get("summary", ""))
            timestamp = event.get("timestamp", "")
            
            # Check for contrasting patterns
            for pattern in self.pattern_rules["contrast_patterns"]:
                matches = re.findall(pattern, summary, re.IGNORECASE)
                for match in matches:
                    if isinstance(match, tuple) and len(match) == 2:
                        old_pref, new_pref = match
                        contrast_matches[f"{old_pref}_vs_{new_pref}"].append({
                            "timestamp": timestamp,
                            "summary": summary,
                            "old_preference": old_pref,
                            "new_preference": new_pref
                        })
        
        # Create patterns for contrasting preferences
        for contrast_key, occurrences in contrast_matches.items():
            pattern = DetectedPattern(
                pattern_id=f"pat_{uuid.uuid4().hex[:8]}",
                pattern_type=PatternType.CONTRASTING_PREFERENCE.value,
                description=f"User shows contrasting preferences in different contexts",
                confidence=0.85,
                supporting_evidence=[occ["summary"] for occ in occurrences[:3]],
                related_categories=[MemoryCategory.PERSONAL_PREFERENCES.value],
                timestamp=datetime.now().isoformat(),
                strength_score=0.85,
                frequency=len(occurrences)
            )
            patterns.append(pattern)
        
        return patterns
    
    def _detect_category_correlations(self) -> List[DetectedPattern]:
        """Detect correlations between different memory categories"""
        patterns = []
        
        # Get memory categories
        memory_categories = self.memory_data.get("memory_categories", {})
        
        # Look for correlations between categories
        category_combinations = defaultdict(int)
        
        # Count how often categories appear together
        for category_name, category_data in memory_categories.items():
            if isinstance(category_data, dict):
                # Get timestamps of entries in this category
                category_timestamps = []
                for item_key, item_data in category_data.items():
                    if isinstance(item_data, dict) and "timestamp" in item_data:
                        category_timestamps.append(item_data["timestamp"])
                
                # Check correlations with other categories
                for other_category_name, other_category_data in memory_categories.items():
                    if category_name != other_category_name and isinstance(other_category_data, dict):
                        other_timestamps = []
                        for item_key, item_data in other_category_data.items():
                            if isinstance(item_data, dict) and "timestamp" in item_data:
                                other_timestamps.append(item_data["timestamp"])
                        
                        # Calculate temporal correlation
                        correlation = self._calculate_temporal_correlation(category_timestamps, other_timestamps)
                        
                        if correlation > 0.5:
                            category_combinations[(category_name, other_category_name)] += 1
        
        # Create patterns for correlated categories
        for (cat1, cat2), frequency in category_combinations.items():
            if frequency >= 2:
                pattern = DetectedPattern(
                    pattern_id=f"pat_{uuid.uuid4().hex[:8]}",
                    pattern_type=PatternType.CATEGORY_CORRELATION.value,
                    description=f"Categories '{cat1}' and '{cat2}' frequently appear together",
                    confidence=min(0.9, 0.5 + (frequency * 0.1)),
                    supporting_evidence=[f"Co-occurrence frequency: {frequency}"],
                    related_categories=[cat1, cat2],
                    timestamp=datetime.now().isoformat(),
                    strength_score=min(1.0, frequency * 0.2),
                    frequency=frequency
                )
                patterns.append(pattern)
        
        return patterns
    
    def _detect_recurring_themes(self) -> List[DetectedPattern]:
        """Detect recurring themes in user preferences and behaviors"""
        patterns = []
        
        # Collect all preference-related content
        all_preferences = []
        
        # Get preferences from fact_history
        fact_history = self.memory_data.get("fact_history", {})
        for key, history in fact_history.items():
            if isinstance(history, list):
                for entry in history:
                    if isinstance(entry, dict):
                        value = entry.get("value", entry.get("item", ""))
                        if value:
                            all_preferences.append(str(value).lower())
        
        # Get preferences from memory events
        memory_events = self.memory_data.get("memory_events", [])
        for event in memory_events:
            if isinstance(event, dict):
                summary = str(event.get("summary", "")).lower()
                # Extract preference-related content
                for keyword_list in self.preference_keywords.values():
                    for keyword in keyword_list:
                        if keyword in summary:
                            # Extract what comes after the keyword
                            pattern = rf"{keyword}\s+(.+?)(?:\.|,|;|$)"
                            matches = re.findall(pattern, summary, re.IGNORECASE)
                            for match in matches:
                                all_preferences.append(match.strip())
        
        # Find recurring themes using word frequency analysis
        if all_preferences:
            theme_counter = Counter()
            for preference in all_preferences:
                # Split into words and count
                words = preference.split()
                theme_counter.update(words)
            
            # Find common themes (words that appear frequently)
            common_themes = [word for word, count in theme_counter.most_common(10) if count > 1]
            
            if common_themes:
                pattern = DetectedPattern(
                    pattern_id=f"pat_{uuid.uuid4().hex[:8]}",
                    pattern_type=PatternType.RECURRING_THEME.value,
                    description=f"User frequently mentions themes: {', '.join(common_themes[:5])}",
                    confidence=min(0.9, 0.5 + (len(common_themes) * 0.05)),
                    supporting_evidence=all_preferences[:5],  # First 5 preferences as evidence
                    related_categories=[MemoryCategory.PERSONAL_PREFERENCES.value],
                    timestamp=datetime.now().isoformat(),
                    strength_score=min(1.0, len(common_themes) * 0.1),
                    frequency=len(common_themes)
                )
                patterns.append(pattern)
        
        return patterns
    
    def _calculate_time_consistency(self, occurrences: List[Dict]) -> float:
        """Calculate temporal consistency of occurrences"""
        if len(occurrences) < 2:
            return 0.0
            
        # For simplicity, we'll return a basic consistency score
        # In a real implementation, this would analyze actual time patterns
        return min(1.0, len(occurrences) * 0.1)
    
    def _calculate_emotional_consistency(self, occurrences: List[Dict]) -> float:
        """Calculate emotional consistency of occurrences"""
        if len(occurrences) < 2:
            return 0.0
            
        # Count consistent emotional contexts
        emotional_contexts = [occ.get("emotional_context", {}) for occ in occurrences]
        consistent_emotions = sum(1 for ctx in emotional_contexts if ctx)
        
        return min(1.0, consistent_emotions / len(occurrences))
    
    def _calculate_temporal_correlation(self, timestamps1: List[str], timestamps2: List[str]) -> float:
        """Calculate temporal correlation between two sets of timestamps"""
        if not timestamps1 or not timestamps2:
            return 0.0
            
        # For simplicity, we'll use a basic proximity measure
        # In a real implementation, this would use proper temporal correlation algorithms
        return min(1.0, len(set(timestamps1) & set(timestamps2)) / max(len(timestamps1), len(timestamps2), 1))
    
    def get_pattern_insights(self) -> Dict[str, Any]:
        """
        Get insights from detected patterns to guide memory enhancement.
        
        Returns:
            Dictionary with pattern insights and recommendations
        """
        if not self.detected_patterns:
            self.analyze_preference_patterns()
        
        insights = {
            "total_patterns_detected": len(self.detected_patterns),
            "pattern_distribution": defaultdict(int),
            "strongest_patterns": [],
            "recommendations": []
        }
        
        # Categorize patterns by type
        for pattern in self.detected_patterns:
            insights["pattern_distribution"][pattern.pattern_type] += 1
            
            # Track strongest patterns (high confidence and frequency)
            if pattern.confidence > 0.7 and pattern.frequency > 2:
                insights["strongest_patterns"].append({
                    "type": pattern.pattern_type,
                    "description": pattern.description,
                    "strength": pattern.strength_score
                })
        
        # Generate recommendations based on patterns
        insights["recommendations"] = self._generate_pattern_recommendations()
        
        return insights
    
    def _generate_pattern_recommendations(self) -> List[str]:
        """Generate recommendations based on detected patterns"""
        recommendations = []
        
        # Count pattern types
        pattern_counts = defaultdict(int)
        for pattern in self.detected_patterns:
            pattern_counts[pattern.pattern_type] += 1
        
        # Generate recommendations based on pattern distribution
        if pattern_counts[PatternType.TEMPORAL_PATTERN.value] > 2:
            recommendations.append("User shows strong temporal patterns in preferences - consider time-based personalization")
        
        if pattern_counts[PatternType.EMOTIONAL_ASSOCIATION.value] > 2:
            recommendations.append("User frequently associates emotions with preferences - leverage emotional context in responses")
        
        if pattern_counts[PatternType.PREFERENCE_EVOLUTION.value] > 1:
            recommendations.append("User preferences evolve over time - regularly check for updated preferences")
        
        if pattern_counts[PatternType.CONTRASTING_PREFERENCE.value] > 1:
            recommendations.append("User shows contrasting preferences - consider context when interpreting preferences")
        
        if pattern_counts[PatternType.RECURRING_THEME.value] > 0:
            recommendations.append("User has recurring themes in preferences - these could inform content recommendations")
        
        # Add general recommendation if many patterns detected
        if len(self.detected_patterns) > 5:
            recommendations.append("Rich pattern landscape detected - user has complex, evolving preferences")
        
        return recommendations
    
    def save_patterns_to_memory(self):
        """Save detected patterns to the memory data structure"""
        if not self.detected_patterns:
            return
            
        # Ensure memory_categories exists
        if "memory_categories" not in self.memory_data:
            self.memory_data["memory_categories"] = {}
        
        # Create or update pattern analysis category
        pattern_category = "pattern_analysis"
        if pattern_category not in self.memory_data["memory_categories"]:
            self.memory_data["memory_categories"][pattern_category] = {}
        
        # Save each pattern as a memory item
        for pattern in self.detected_patterns:
            pattern_key = f"pattern_{pattern.pattern_id}"
            
            # Convert pattern to memory item format
            memory_item = {
                "category": pattern_category,
                "subcategory": pattern.pattern_type,
                "key": pattern_key,
                "value": pattern.description,
                "confidence": pattern.confidence,
                "timestamp": pattern.timestamp,
                "metadata": {
                    "strength_score": pattern.strength_score,
                    "frequency": pattern.frequency,
                    "supporting_evidence": pattern.supporting_evidence[:3],  # First 3 pieces of evidence
                    "related_categories": pattern.related_categories
                },
                "relationships": pattern.related_categories,
                "tags": [pattern.pattern_type, "pattern_analysis"]
            }
            
            # Add to memory categories
            self.memory_data["memory_categories"][pattern_category][pattern_key] = memory_item
        
        # Add pattern insights summary
        insights = self.get_pattern_insights()
        insights_key = f"pattern_insights_{datetime.now().strftime('%Y%m%d')}"
        
        insights_item = {
            "category": pattern_category,
            "subcategory": "insights_summary",
            "key": insights_key,
            "value": "Pattern analysis insights summary",
            "confidence": 0.9,
            "timestamp": datetime.now().isoformat(),
            "metadata": insights,
            "tags": ["insights", "summary"]
        }
        
        self.memory_data["memory_categories"][pattern_category][insights_key] = insights_item


def integrate_pattern_analyzer_with_organizer(memory_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Integrate the pattern analyzer with the existing AI organizer.
    
    This function creates pattern insights and adds them to the memory data
    to enhance the organizer's understanding of user preferences.
    
    Args:
        memory_data: The complete memory data structure
        
    Returns:
        Updated memory data with pattern insights
    """
    # Create pattern analyzer instance
    analyzer = PreferencePatternAnalyzer(memory_data)
    
    # Detect patterns
    detected_patterns = analyzer.analyze_preference_patterns()
    
    # Save patterns to memory
    analyzer.save_patterns_to_memory()
    
    # Return updated memory data
    return analyzer.memory_data


# Example usage function
def analyze_user_patterns_example():
    """
    Example of how to use the pattern analyzer.
    
    This would typically be called by the AI organizer during memory processing.
    """
    # This is just an example - in practice, this would be integrated with real memory data
    example_memory_data = {
        "memory_events": [
            {
                "event_id": "evt_12345678",
                "type": "ADD",
                "summary": "User likes playing guitar every evening",
                "timestamp": "2023-01-01T18:00:00",
                "category": MemoryCategory.ACTIVITY_BEHAVIOR.value,
                "subcategory": "hobbies"
            },
            {
                "event_id": "evt_87654321",
                "type": "ADD", 
                "summary": "User enjoys hiking on weekends",
                "timestamp": "2023-01-02T10:00:00",
                "category": MemoryCategory.ACTIVITY_BEHAVIOR.value,
                "subcategory": "outdoor_activities"
            }
        ],
        "fact_history": {
            "personal_preferences.likes": [
                {
                    "item": "playing guitar",
                    "added": "2023-01-01",
                    "updated": "2023-01-01",
                    "score": 0.9
                },
                {
                    "item": "hiking",
                    "added": "2023-01-02", 
                    "updated": "2023-01-02",
                    "score": 0.8
                }
            ]
        },
        "memory_categories": {}
    }
    
    # Analyze patterns
    updated_memory_data = integrate_pattern_analyzer_with_organizer(example_memory_data)
    
    # Get pattern insights
    analyzer = PreferencePatternAnalyzer(updated_memory_data)
    insights = analyzer.get_pattern_insights()
    
    return updated_memory_data, insights