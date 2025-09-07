import asyncio
import groq
import json
import logging
import os
import random
import re
import sys
import time
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Union, Any, Deque
from collections import deque
import numpy as np
from datetime import datetime, timedelta


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("alebot.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("AleChatBot")


###############################################################################
# ADVANCED AI FRAMEWORK
###############################################################################
class AdvancedAIFramework:
    """
    Comprehensive AI framework with multi-tiered memory, real-time data access,
    context-aware reasoning, self-reflection, modular plugins, personalization,
    continual learning, and complex problem solving.
    
    This system implements a sophisticated cognitive architecture that mimics human
    intelligence with advanced memory structures, reasoning capabilities, and
    continuous self-improvement mechanisms.
    
    Features:
    - Multi-tiered memory system (short-term, mid-term, long-term)
    - Knowledge base integration with real-time updates
    - Context-aware reasoning with emotional intelligence
    - Self-reflection and performance optimization
    - Modular plugin architecture for extensibility
    - Advanced personalization engine
    - Continual learning and self-updating capabilities
    - Complex problem solving with explanations
    - Confidence-based memory validation
    - Smart repetition detection
    - Dynamic response thought phrase rotation
    - Hybrid LLM stack option for specialized tasks
    """
    
    def __init__(self, max_short_term_size: int = 30, max_mid_term_size: int = 100, 
                 max_long_term_size: int = 1000, enable_web_access: bool = True):
        """
        Initialize the advanced AI framework with configurable memory sizes and features.
        
        Args:
            max_short_term_size: Maximum items in short-term memory (current session)
            max_mid_term_size: Maximum items in mid-term memory (recent interactions)
            max_long_term_size: Maximum items in long-term memory (persistent knowledge)
            enable_web_access: Whether to enable real-time web data access
        """
        #----------------------------------------------------------------------
        # MULTI-TIERED MEMORY SYSTEM
        #----------------------------------------------------------------------
        # Short-Term Memory: Active chat history during the current session
        # Automatically removes oldest items when full (like human STM)
        self.short_term_memory: Deque[Dict] = deque(maxlen=max_short_term_size)
        
        # Mid-Term Memory: Conversation summaries, patterns, recent interactions
        # Stores processed information from short-term memory for medium duration
        self.mid_term_memory: List[Dict] = []
        self.max_mid_term_size = max_mid_term_size
        
        # Long-Term Memory: Persistent database of facts, preferences, traits
        # Pruned based on importance and relevance when exceeds maximum size
        self.long_term_memory: List[Dict] = []
        self.max_long_term_size = max_long_term_size
        
        # Memory confidence ratings: Tracks confidence in each memory item
        # Used for validation before recall to prevent false memories
        self.memory_confidence: Dict[int, float] = {}  # memory_id -> confidence score
        
        #----------------------------------------------------------------------
        # KNOWLEDGE BASE
        #----------------------------------------------------------------------
        # Integrated knowledge base for real-world facts and information
        # Updated in real-time via APIs and web access when enabled
        self.knowledge_base: Dict[str, Dict] = {
            "facts": {},           # General factual knowledge
            "concepts": {},        # Abstract concepts and definitions
            "procedures": {},      # How-to knowledge and procedures
            "updates": {},         # Recent updates to knowledge
            "last_updated": None   # Timestamp of last knowledge update
        }
        
        # Web access configuration
        self.enable_web_access = enable_web_access
        self.trusted_sources = [
            "wikipedia.org",
            "github.com",
            "stackoverflow.com",
            "arxiv.org",
            "scholar.google.com",
            "news.ycombinator.com"
        ]
        
        #----------------------------------------------------------------------
        # USER MODELING & PERSONALIZATION
        #----------------------------------------------------------------------
        # Comprehensive user model for ultra-personalized interactions
        self.user_model = {
            # Core user information
            "preferences": {},     # User preferences by category
            "traits": {},          # Personality traits and characteristics
            "interests": {},       # Topics and areas of interest
            "expertise": {},       # Areas of user expertise/knowledge
            
            # Communication patterns
            "communication_style": {
                "verbosity": 0.5,  # 0.0=terse, 1.0=verbose
                "formality": 0.5,  # 0.0=casual, 1.0=formal
                "humor": 0.5,      # 0.0=serious, 1.0=humorous
                "detail_level": 0.5  # 0.0=high-level, 1.0=detailed
            },
            
            # Interaction history
            "interaction_history": {
                "total_sessions": 0,
                "total_messages": 0,
                "avg_session_length": 0,
                "common_topics": {},
                "feedback": {}     # User feedback on responses
            }
        }
        
        #----------------------------------------------------------------------
        # TOPIC & CONTEXT MANAGEMENT
        #----------------------------------------------------------------------
        # Active context tracking
        self.context = {
            "current_topics": [],          # Active topics in conversation
            "topic_history": {},           # Topic frequency across conversations
            "conversation_depth": 0,       # Depth of current conversation thread
            "context_switches": 0,         # Number of topic switches in session
            "reference_objects": {},       # Objects referenced in conversation
            "conversation_goals": [],      # Inferred goals of conversation
            "unresolved_questions": []     # Questions not yet fully answered
        }
        
        #----------------------------------------------------------------------
        # REASONING & PROBLEM SOLVING
        #----------------------------------------------------------------------
        # Reasoning frameworks for different types of problems
        self.reasoning_frameworks = {
            "logical": {},         # Logical reasoning patterns
            "creative": {},        # Creative thinking approaches
            "analytical": {},      # Analytical frameworks
            "ethical": {},         # Ethical reasoning guidelines
            "mathematical": {}     # Mathematical reasoning tools
        }
        
        # Problem-solving history to learn from past solutions
        self.problem_solving_history = []
        
        #----------------------------------------------------------------------
        # EMOTIONAL INTELLIGENCE
        #----------------------------------------------------------------------
        # Emotional context tracking with nuanced understanding
        self.emotional_context = {
            # Basic emotion dimensions
            "valence": 0.0,        # -1.0 (negative) to 1.0 (positive)
            "arousal": 0.0,        # 0.0 (calm) to 1.0 (excited)
            "dominance": 0.0,      # 0.0 (submissive) to 1.0 (dominant)
            
            # Complex emotional states
            "emotions": {
                "joy": 0.0,
                "trust": 0.0,
                "fear": 0.0,
                "surprise": 0.0,
                "sadness": 0.0,
                "disgust": 0.0,
                "anger": 0.0,
                "anticipation": 0.0,
                "neutral": 1.0     # Default state
            },
            
            # Conversation tone
            "tone": "neutral",     # Overall tone of conversation
            "tone_history": []     # History of tone shifts
        }
        
        #----------------------------------------------------------------------
        # SELF-REFLECTION & OPTIMIZATION
        #----------------------------------------------------------------------
        # Performance metrics for self-improvement
        self.performance_metrics = {
            "response_quality": {
                "relevance": [],       # Relevance scores
                "coherence": [],       # Coherence scores
                "helpfulness": [],     # Helpfulness scores
                "accuracy": []         # Accuracy scores
            },
            "user_satisfaction": [],   # Estimated user satisfaction
            "error_rate": [],          # Rate of detected errors
            "recovery_rate": []        # Rate of successful error recovery
        }
        
        # Self-improvement goals and strategies
        self.improvement_goals = []
        
        #----------------------------------------------------------------------
        # PLUGIN & TOOL SYSTEM
        #----------------------------------------------------------------------
        # Available plugins and tools
        self.plugins = {
            "active": {},          # Currently active plugins
            "available": {},       # All available plugins
            "usage_stats": {}      # Usage statistics for plugins
        }
        
        # API connections for external services
        self.api_connections = {}
        
        #----------------------------------------------------------------------
        # REPETITION PREVENTION
        #----------------------------------------------------------------------
        # Advanced repetition detection
        self.repetition_detection = {
            "previous_responses": [],      # Recent AI responses
            "response_patterns": {},       # Detected patterns in responses
            "similarity_threshold": 0.7,   # Threshold for repetition detection
            "context_overlap_threshold": 0.5  # Context similarity threshold
        }
        
        # For backward compatibility with existing code
        self.ai_previous_responses = []
        
        #----------------------------------------------------------------------
        # SEMANTIC UNDERSTANDING
        #----------------------------------------------------------------------
        # Vector embeddings for semantic search and similarity
        self.semantic_system = {
            "embeddings": [],              # Vector embeddings for memory items
            "embedding_model": "default",  # Model used for embeddings
            "semantic_clusters": {},       # Clustered concepts by similarity
            "entity_graph": {}             # Graph of related entities
        }
        
        #----------------------------------------------------------------------
        # CONVERSATION ANALYTICS
        #----------------------------------------------------------------------
        # Detailed analytics about conversations
        self.conversation_stats = {
            "total_exchanges": 0,          # Total conversation turns
            "user_avg_length": 0,          # Average user message length
            "ai_avg_length": 0,            # Average AI response length
            "avg_response_time": 0,        # Average time to generate response
            "session_start_time": datetime.now(),  # Current session start
            "total_session_time": 0,       # Total time across all sessions
            "last_conversation_time": None # Timestamp of last exchange
        }
        
        #----------------------------------------------------------------------
        # HYBRID LLM STACK
        #----------------------------------------------------------------------
        # Configuration for specialized models
        self.model_stack = {
            "general": "default",          # General conversation model
            "code": None,                  # Code-specialized model
            "math": None,                  # Math-specialized model
            "creative": None,              # Creative writing model
            "reasoning": None,             # Logical reasoning model
            "active_model": "default"      # Currently active model
        }
        
        # Response thought phrase rotator for natural conversational flow
        self.thought_phrases = [
            "Let me think about that...",
            "Analyzing this question...",
            "Processing your request...",
            "Considering the best approach...",
            "Thinking through this carefully...",
            "Examining the details...",
            "Connecting relevant information...",
            "Formulating a thoughtful response..."
        ]
        self.current_thought_phrase_index = 0
    
    #==========================================================================
    # MEMORY MANAGEMENT METHODS
    #==========================================================================
    
    def add_memory(self, user_message: str, ai_response: str, timestamp: datetime = None) -> None:
        """
        Add a new conversation exchange to multi-tiered memory system.
        
        This method processes a conversation exchange and stores it in the appropriate
        memory tiers. It extracts topics, detects emotions, calculates importance,
        and updates conversation statistics. Important memories are also added to
        mid-term and long-term memory based on their significance.
        
        Args:
            user_message: The user's message
            ai_response: The AI's response
            timestamp: When the exchange occurred (defaults to now)
        """
        # Use current time if no timestamp provided
        if timestamp is None:
            timestamp = datetime.now()
            
        #----------------------------------------------------------------------
        # MEMORY ENTRY CREATION
        #----------------------------------------------------------------------
        # Create a comprehensive memory entry with metadata for better retrieval
        memory_entry = {
            # Core conversation data
            "id": hash(f"{user_message}{ai_response}{timestamp}"),  # Unique identifier
            "user_message": user_message,
            "ai_response": ai_response,
            "timestamp": timestamp,
            
            # Derived metadata for intelligent retrieval
            "importance": self._calculate_importance(user_message, ai_response),
            "topics": self._extract_topics(user_message + " " + ai_response),
            "emotions": self._detect_emotions(user_message),
            "context_vector": self._generate_context_vector(user_message, ai_response),
            
            # Special flags for quick filtering
            "contains_question": "?" in user_message,
            "contains_personal_info": self._contains_personal_info(user_message),
            "contains_action_item": self._contains_action_item(user_message),
            "contains_feedback": self._contains_feedback(user_message),
            
            # Memory confidence and validation
            "confidence": 1.0,  # Initial confidence in this memory
            "validated": False,  # Whether this memory has been validated
            "source": "direct_interaction"  # Source of this memory
        }
        
        #----------------------------------------------------------------------
        # SHORT-TERM MEMORY UPDATE
        #----------------------------------------------------------------------
        # Add to short-term memory (deque automatically handles size limits)
        self.short_term_memory.append(memory_entry)
        
        #----------------------------------------------------------------------
        # MID-TERM MEMORY UPDATE
        #----------------------------------------------------------------------
        # Add to mid-term memory if it's significant enough
        # This creates a layer between short-term and long-term memory
        if memory_entry["importance"] > 0.5 or memory_entry["contains_question"] or memory_entry["contains_personal_info"]:
            self.mid_term_memory.append(memory_entry)
            
            # Prune mid-term memory if it exceeds maximum size
            if len(self.mid_term_memory) > self.max_mid_term_size:
                # Sort by importance (least important first)
                self.mid_term_memory.sort(key=lambda x: x["importance"])
                # Keep only the most important memories
                self.mid_term_memory = self.mid_term_memory[-self.max_mid_term_size:]
        
        #----------------------------------------------------------------------
        # REPETITION DETECTION UPDATE
        #----------------------------------------------------------------------
        # Store AI response for advanced repetition detection
        self.repetition_detection["previous_responses"].append({
            "response": ai_response,
            "timestamp": timestamp,
            "context": self._extract_topics(user_message)
        })
        
        # Keep only the most recent responses
        if len(self.repetition_detection["previous_responses"]) > 15:
            self.repetition_detection["previous_responses"].pop(0)
            
        # Update ai_previous_responses for backward compatibility
        self.ai_previous_responses = [prev["response"] for prev in self.repetition_detection["previous_responses"]]
            
        #----------------------------------------------------------------------
        # CONVERSATION STATISTICS UPDATE
        #----------------------------------------------------------------------
        # Increment total exchanges counter
        self.conversation_stats["total_exchanges"] += 1
        
        # Update running average of user message length
        # Formula: new_avg = ((old_avg * (n-1)) + new_value) / n
        self.conversation_stats["user_avg_length"] = (
            (self.conversation_stats["user_avg_length"] * (self.conversation_stats["total_exchanges"] - 1) +
             len(user_message)) / self.conversation_stats["total_exchanges"]
        )
        
        # Update running average of AI response length
        self.conversation_stats["ai_avg_length"] = (
            (self.conversation_stats["ai_avg_length"] * (self.conversation_stats["total_exchanges"] - 1) +
             len(ai_response)) / self.conversation_stats["total_exchanges"]
        )
        
        # Update timestamp of last conversation
        self.conversation_stats["last_conversation_time"] = timestamp
        
        # Update user model interaction history
        self.user_model["interaction_history"]["total_messages"] += 1
        
        #----------------------------------------------------------------------
        # LONG-TERM MEMORY UPDATE
        #----------------------------------------------------------------------
        # Only store highly important information in long-term memory
        # This mimics how humans remember significant events but forget mundane details
        if (memory_entry["importance"] > 0.7 or 
            memory_entry["contains_personal_info"] or 
            memory_entry["contains_action_item"] or
            memory_entry["contains_feedback"]):
            
            # Add memory confidence rating
            memory_id = memory_entry["id"]
            self.memory_confidence[memory_id] = self._calculate_memory_confidence(memory_entry)
            
            # Add the memory to long-term storage with additional metadata
            memory_entry["long_term_added"] = timestamp
            memory_entry["recall_count"] = 0  # Track how often this memory is recalled
            memory_entry["last_recalled"] = None
            
            # Add to long-term memory
            self.long_term_memory.append(memory_entry)
            
            # Generate embedding for semantic search if not already present
            if not self.semantic_system["embeddings"]:
                # In a real implementation, this would call an embedding model
                # Here we'll just create a placeholder
                self.semantic_system["embeddings"].append({
                    "memory_id": memory_id,
                    "vector": np.random.rand(768)  # Placeholder 768-dim vector
                })
            
            # Prune long-term memory if it exceeds maximum size
            if len(self.long_term_memory) > self.max_long_term_size:
                # Sort by a combination of importance, recency, and recall frequency
                self.long_term_memory.sort(key=lambda x: (
                    x["importance"] * 0.5 +
                    (1.0 / (1.0 + (datetime.now() - x["timestamp"]).total_seconds() / 86400)) * 0.3 +
                    (x.get("recall_count", 0) / 10) * 0.2
                ))
                # Keep only the most important memories
                self.long_term_memory = self.long_term_memory[-self.max_long_term_size:]
                
        #----------------------------------------------------------------------
        # TOPIC TRACKING UPDATE
        #----------------------------------------------------------------------
        # Update topic frequency counts in topic history
        for topic in memory_entry["topics"]:
            # Increment topic frequency counter
            self.context["topic_history"][topic] = self.context["topic_history"].get(topic, 0) + 1
            
            # Add to current topics if not already present
            if topic not in self.context["current_topics"]:
                self.context["current_topics"].append(topic)
                
                # Maintain a sliding window of current topics (most recent 5)
                if len(self.context["current_topics"]) > 5:
                    self.context["current_topics"].pop(0)  # Remove oldest topic
                    
        #----------------------------------------------------------------------
        # EMOTIONAL CONTEXT UPDATE
        #----------------------------------------------------------------------
        # Update emotional context based on detected emotions
        for emotion, value in memory_entry["emotions"].items():
            if emotion in self.emotional_context["emotions"]:
                # Gradually update emotional context (70% old value, 30% new value)
                self.emotional_context["emotions"][emotion] = (
                    self.emotional_context["emotions"][emotion] * 0.7 + value * 0.3
                )
        
        # Update overall valence (positive/negative dimension)
        self.emotional_context["valence"] = (
            self.emotional_context["emotions"]["joy"] * 0.5 +
            self.emotional_context["emotions"]["trust"] * 0.3 -
            self.emotional_context["emotions"]["sadness"] * 0.4 -
            self.emotional_context["emotions"]["anger"] * 0.6
        )
        
        # Determine overall conversation tone
        prev_tone = self.emotional_context["tone"]
        if self.emotional_context["valence"] > 0.3:
            new_tone = "positive"
        elif self.emotional_context["valence"] < -0.3:
            new_tone = "negative"
        else:
            new_tone = "neutral"
            
        # Record tone change if it happened
        if new_tone != prev_tone:
            self.emotional_context["tone"] = new_tone
            self.emotional_context["tone_history"].append({
                "from": prev_tone,
                "to": new_tone,
                "timestamp": timestamp
            })
    
    def get_relevant_memories(self, current_message: str, max_memories: int = 5) -> List[Dict]:
        """
        Retrieve memories relevant to the current conversation context.
        
        This method implements a sophisticated memory retrieval system that mimics
        human associative memory. It scores memories based on topic relevance,
        recency, semantic similarity, and importance to find the most relevant
        memories for the current context.
        
        Args:
            current_message: The current user message
            max_memories: Maximum number of memories to retrieve
            
        Returns:
            List of relevant memory entries
        """
        #----------------------------------------------------------------------
        # TOPIC EXTRACTION
        #----------------------------------------------------------------------
        # Extract topics from current message to find related memories
        current_topics = self._extract_topics(current_message)
        
        #----------------------------------------------------------------------
        # MEMORY POOL CREATION
        #----------------------------------------------------------------------
        # Combine all memory tiers for comprehensive search
        # This allows finding memories from short, mid, and long-term storage
        all_memories = list(self.short_term_memory) + self.mid_term_memory + self.long_term_memory
        
        #----------------------------------------------------------------------
        # RELEVANCE SCORING
        #----------------------------------------------------------------------
        # Score each memory based on multiple relevance factors
        scored_memories = []
        for memory in all_memories:
            #------------------------------------------------------------------
            # TOPIC RELEVANCE
            #------------------------------------------------------------------
            # Calculate topic overlap between memory and current message
            # More shared topics = higher relevance
            topic_overlap = len(set(memory["topics"]) & set(current_topics))
            
            #------------------------------------------------------------------
            # TEMPORAL RELEVANCE (RECENCY)
            #------------------------------------------------------------------
            # Calculate recency score - more recent memories get higher scores
            # Formula: 1/(1 + days_elapsed) gives a value between 0 and 1
            time_diff = datetime.now() - memory["timestamp"]
            recency_score = 1.0 / (1.0 + time_diff.total_seconds() / 86400)
            
            #------------------------------------------------------------------
            # SEMANTIC RELEVANCE
            #------------------------------------------------------------------
            # Calculate semantic similarity between memory and current message
            # Higher similarity = higher relevance
            semantic_score = self._text_similarity(current_message, memory["user_message"])
            
            #------------------------------------------------------------------
            # IMPORTANCE RELEVANCE
            #------------------------------------------------------------------
            # More important memories should be more likely to be retrieved
            importance_score = memory["importance"]
            
            #------------------------------------------------------------------
            # CONFIDENCE RELEVANCE
            #------------------------------------------------------------------
            # Memories with higher confidence should be preferred
            confidence_score = memory.get("confidence", 1.0)
            
            #------------------------------------------------------------------
            # COMBINED RELEVANCE SCORE
            #------------------------------------------------------------------
            # Calculate weighted combined score
            # Weights can be adjusted based on what factors should be prioritized
            combined_score = (
                topic_overlap * 0.3 +
                recency_score * 0.25 +
                semantic_score * 0.2 +
                importance_score * 0.15 +
                confidence_score * 0.1
            )
            
            # Add to scored memories
            scored_memories.append((memory, combined_score))
            
            # Update recall statistics for long-term memories
            if "long_term_added" in memory:
                memory["recall_count"] = memory.get("recall_count", 0) + 1
                memory["last_recalled"] = datetime.now()
        
        #----------------------------------------------------------------------
        # MEMORY SELECTION
        #----------------------------------------------------------------------
        # Sort memories by relevance score (highest first)
        scored_memories.sort(key=lambda x: x[1], reverse=True)
        
        # Return the top N most relevant memories
        return [memory for memory, score in scored_memories[:max_memories]]
    
    def detect_repetition(self, potential_response: str) -> float:
        """
        Detect how repetitive a potential response would be.
        
        This method uses multiple strategies to detect repetition:
        1. Direct text similarity with previous responses
        2. Context overlap detection
        3. Pattern recognition in responses
        
        Args:
            potential_response: The response to check for repetition
            
        Returns:
            Repetition score between 0.0 and 1.0 (higher = more repetitive)
        """
        if not self.repetition_detection["previous_responses"]:
            return 0.0  # No previous responses to compare with
            
        #----------------------------------------------------------------------
        # DIRECT TEXT SIMILARITY
        #----------------------------------------------------------------------
        # For backward compatibility with code that might still use ai_previous_responses
        self.ai_previous_responses = [prev["response"] for prev in self.repetition_detection["previous_responses"]]
        
        # Check similarity with previous responses
        max_similarity = 0.0
        for prev in self.repetition_detection["previous_responses"]:
            similarity = self._text_similarity(potential_response, prev["response"])
            max_similarity = max(max_similarity, similarity)
            
        #----------------------------------------------------------------------
        # CONTEXT OVERLAP DETECTION
        #----------------------------------------------------------------------
        # Check if we're repeating information in the same context
        context_penalty = 0.0
        current_topics = set(self.context["current_topics"])
        
        for prev in self.repetition_detection["previous_responses"]:
            prev_topics = set(prev.get("context", []))
            
            # Calculate topic overlap ratio
            if prev_topics and current_topics:
                overlap_ratio = len(current_topics & prev_topics) / len(current_topics | prev_topics)
                
                # Apply context penalty if significant overlap and high text similarity
                if overlap_ratio > self.repetition_detection["context_overlap_threshold"]:
                    similarity = self._text_similarity(potential_response, prev["response"])
                    if similarity > 0.5:
                        context_penalty = max(context_penalty, overlap_ratio * 0.5)
        
        #----------------------------------------------------------------------
        # PATTERN DETECTION
        #----------------------------------------------------------------------
        # Check for repeated patterns in responses
        pattern_penalty = 0.0
        # This would be more sophisticated in a real implementation
        
        #----------------------------------------------------------------------
        # COMBINED REPETITION SCORE
        #----------------------------------------------------------------------
        # Combine all factors into a single repetition score
        repetition_score = max(max_similarity, context_penalty, pattern_penalty)
        
        return repetition_score
        
    def update_user_preference(self, category: str, value: Any) -> None:
        """
        Update the user model with a new preference or trait.
        
        This method adds or updates information about the user's preferences,
        traits, interests, or expertise in the user model.
        
        Args:
            category: The category of preference (e.g., "communication_style.verbosity")
            value: The preference value
        """
        # Handle nested categories with dot notation
        if "." in category:
            main_category, sub_category = category.split(".", 1)
            
            if main_category in self.user_model:
                if isinstance(self.user_model[main_category], dict):
                    self.user_model[main_category][sub_category] = value
        else:
            # Direct category update
            if category in self.user_model:
                self.user_model[category] = value
            else:
                # Try to infer the right category
                if category in ["verbosity", "formality", "humor", "detail_level"]:
                    self.user_model["communication_style"][category] = value
                elif category in ["technology", "science", "arts", "sports"]:
                    self.user_model["interests"][category] = value
                else:
                    # Default to preferences
                    self.user_model["preferences"][category] = value
    
    def _calculate_importance(self, user_message: str, ai_response: str) -> float:
        """
        Calculate the importance of a conversation exchange.
        
        This method analyzes various factors to determine how important a memory is,
        which affects whether it gets stored in mid-term and long-term memory.
        
        Args:
            user_message: The user's message
            ai_response: The AI's response
            
        Returns:
            Importance score between 0.0 and 1.0
        """
        importance = 0.0
        
        #----------------------------------------------------------------------
        # CONTENT-BASED IMPORTANCE
        #----------------------------------------------------------------------
        # Questions are important (they expect a response)
        if "?" in user_message:
            importance += 0.2
            
        # Longer exchanges tend to be more important
        message_length = len(user_message) + len(ai_response)
        if message_length > 500:
            importance += 0.15
        elif message_length > 200:
            importance += 0.1
            
        # Messages with strong emotional content are important
        emotions = self._detect_emotions(user_message)
        emotion_intensity = sum(emotions.values())
        importance += min(0.2, emotion_intensity / 5)
        
        # Personal information is important
        if self._contains_personal_info(user_message):
            importance += 0.3
            
        # Action items are important
        if self._contains_action_item(user_message):
            importance += 0.25
            
        # Feedback is important
        if self._contains_feedback(user_message):
            importance += 0.25
            
        #----------------------------------------------------------------------
        # CONTEXT-BASED IMPORTANCE
        #----------------------------------------------------------------------
        # Messages related to current topics are more important
        topics = self._extract_topics(user_message + " " + ai_response)
        topic_overlap = len(set(topics) & set(self.context["current_topics"]))
        importance += min(0.15, topic_overlap * 0.05)
        
        # Cap importance at 1.0
        return min(1.0, importance)
    
    def _extract_topics(self, text: str) -> List[str]:
        """
        Extract main topics from text.
        
        This method identifies the main topics or themes in a piece of text
        using simple keyword extraction. In a production system, this would
        use more sophisticated NLP techniques.
        
        Args:
            text: The text to extract topics from
            
        Returns:
            List of identified topics
        """
        # Simple keyword-based topic extraction
        # In a real implementation, this would use NLP techniques
        
        # Convert to lowercase and remove punctuation
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        
        # Split into words
        words = text.split()
        
        # Remove common stop words (simplified list)
        stop_words = {"the", "a", "an", "and", "or", "but", "is", "are", "was", "were", 
                     "in", "on", "at", "to", "for", "with", "by", "about", "like", 
                     "from", "of", "that", "this", "these", "those", "it", "its"}
        filtered_words = [word for word in words if word not in stop_words and len(word) > 3]
        
        # Count word frequencies
        word_counts = {}
        for word in filtered_words:
            word_counts[word] = word_counts.get(word, 0) + 1
            
        # Get top words by frequency
        sorted_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)
        
        # Return top 5 words as topics (or fewer if there aren't 5)
        return [word for word, count in sorted_words[:5]]
    
    def _detect_emotions(self, text: str) -> Dict[str, float]:
        """
        Detect emotions expressed in text.
        
        This method analyzes text to identify emotional content and intensity.
        It returns a dictionary of emotion types and their intensity scores.
        
        Args:
            text: The text to analyze for emotions
            
        Returns:
            Dictionary mapping emotion names to intensity values (0.0 to 1.0)
        """
        # Simple keyword-based emotion detection
        # In a real implementation, this would use NLP or ML techniques
        
        # Initialize emotions with zero intensity
        emotions = {
            "joy": 0.0,
            "trust": 0.0,
            "fear": 0.0,
            "surprise": 0.0,
            "sadness": 0.0,
            "disgust": 0.0,
            "anger": 0.0,
            "anticipation": 0.0,
            "neutral": 0.0
        }
        
        # Simple emotion keyword mapping
        emotion_keywords = {
            "joy": ["happy", "joy", "delighted", "glad", "pleased", "excited", "love", "wonderful", "great"],
            "trust": ["trust", "believe", "confidence", "faithful", "sure", "certain", "reliable"],
            "fear": ["fear", "scared", "afraid", "terrified", "worried", "anxious", "nervous"],
            "surprise": ["surprise", "surprised", "shocking", "unexpected", "amazed", "astonished"],
            "sadness": ["sad", "unhappy", "depressed", "down", "miserable", "heartbroken", "grief"],
            "disgust": ["disgust", "disgusted", "revolting", "gross", "repulsive", "nasty"],
            "anger": ["angry", "mad", "furious", "outraged", "irritated", "annoyed", "frustrated"],
            "anticipation": ["anticipate", "expect", "looking forward", "awaiting", "hopeful"]
        }
        
        # Convert to lowercase for case-insensitive matching
        text_lower = text.lower()
        
        # Check for emotion keywords
        for emotion, keywords in emotion_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    # Increase emotion intensity
                    emotions[emotion] += 0.2
                    
                    # Check for intensifiers
                    intensifiers = ["very", "extremely", "really", "so", "incredibly"]
                    for intensifier in intensifiers:
                        if f"{intensifier} {keyword}" in text_lower:
                            emotions[emotion] += 0.3
                            break
        
        # Cap emotion intensities at 1.0
        for emotion in emotions:
            emotions[emotion] = min(1.0, emotions[emotion])
            
        # If no emotions detected, set neutral
        if sum(emotions.values()) < 0.1:
            emotions["neutral"] = 1.0
            
        return emotions
    
    def _contains_personal_info(self, text: str) -> bool:
        """
        Check if text contains personal information.
        
        This method detects whether a message contains personal information
        about the user that should be remembered.
        
        Args:
            text: The text to check for personal information
            
        Returns:
            True if personal information is detected, False otherwise
        """
        # Simple pattern matching for personal information
        # In a real implementation, this would use more sophisticated NLP
        
        # Personal pronouns followed by information patterns
        patterns = [
            r"i am [a-z]+",
            r"i'm [a-z]+", 
            r"my name is", 
            r"i live in", 
            r"my [a-z]+ is",
            r"i like", 
            r"i love", 
            r"i hate", 
            r"i don't like",
            r"i prefer", 
            r"i work", 
            r"i study"
        ]
        
        # Check each pattern
        for pattern in patterns:
            if re.search(pattern, text.lower()):
                return True
                
        return False
    
    def _contains_action_item(self, text: str) -> bool:
        """
        Check if text contains an action item or task.
        
        This method detects whether a message contains a task, request,
        or action item that should be remembered.
        
        Args:
            text: The text to check for action items
            
        Returns:
            True if an action item is detected, False otherwise
        """
        # Simple pattern matching for action items
        # In a real implementation, this would use more sophisticated NLP
        
        # Action item patterns
        patterns = [
            r"remind me to",
            r"don't forget to", 
            r"please [a-z]+ for me", 
            r"can you [a-z]+ for me",
            r"i need you to", 
            r"make sure to", 
            r"we should"
        ]
        
        # Check each pattern
        for pattern in patterns:
            if re.search(pattern, text.lower()):
                return True
                
        return False
    
    def _contains_feedback(self, text: str) -> bool:
        """
        Check if text contains feedback about the AI's performance.
        
        This method detects whether a message contains feedback from the user
        about the AI's responses or behavior.
        
        Args:
            text: The text to check for feedback
            
        Returns:
            True if feedback is detected, False otherwise
        """
        # Simple pattern matching for feedback
        # In a real implementation, this would use more sophisticated NLP
        
        # Feedback patterns
        patterns = [
            r"that's (not |)helpful",
            r"that (doesn't|does) help", 
            r"you're (not |)(right|wrong|correct|incorrect)", 
            r"that's (not |)(right|wrong|correct|incorrect)",
            r"good job", 
            r"well done", 
            r"that's better",
            r"i like how you",
            r"i don't like how you",
            r"that's what i wanted",
            r"that's not what i wanted"
        ]
        
        # Check each pattern
        for pattern in patterns:
            if re.search(pattern, text.lower()):
                return True
                
        return False
    
    def _text_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate semantic similarity between two texts.
        
        This method computes how similar two pieces of text are in meaning.
        In a production system, this would use embeddings or other NLP techniques.
        Here we use a simple Jaccard similarity on words as a placeholder.
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score between 0.0 and 1.0
        """
        # Simple Jaccard similarity as a placeholder
        # In a real implementation, this would use embeddings or other NLP techniques
        
        # Normalize and tokenize texts
        def normalize_and_tokenize(text):
            text = text.lower()
            text = re.sub(r'[^\w\s]', '', text)
            return set(text.split())
            
        words1 = normalize_and_tokenize(text1)
        words2 = normalize_and_tokenize(text2)
        
        # Calculate Jaccard similarity: intersection / union
        if not words1 or not words2:
            return 0.0
            
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union
    
    def _generate_context_vector(self, user_message: str, ai_response: str) -> List[float]:
        """
        Generate a context vector for the conversation exchange.
        
        This method creates a numerical representation of the conversation context
        that can be used for semantic search and similarity comparisons.
        
        Args:
            user_message: The user's message
            ai_response: The AI's response
            
        Returns:
            A vector (list of floats) representing the context
        """
        # In a real implementation, this would use an embedding model
        # Here we'll just create a placeholder random vector
        return list(np.random.rand(768))  # Placeholder 768-dim vector
    
    def _calculate_memory_confidence(self, memory: Dict) -> float:
        """
        Calculate confidence score for a memory.
        
        This method determines how confident the system is that a memory
        is accurate and should be recalled in the future.
        
        Args:
            memory: The memory entry to evaluate
            
        Returns:
            Confidence score between 0.0 and 1.0
        """
        confidence = 1.0  # Start with full confidence
        
        # Direct interactions have high confidence
        if memory.get("source") == "direct_interaction":
            confidence = 0.95
        # Inferred information has lower confidence
        elif memory.get("source") == "inferred":
            confidence = 0.7
        
        # Adjust based on importance (more important = higher confidence)
        confidence *= (0.8 + memory.get("importance", 0.5) * 0.2)
        
        # Cap at 1.0
        return min(1.0, confidence)
        # TOPIC TRACKING UPDATE
        #----------------------------------------------------------------------
        # Update topic frequency counts in topic history
        for topic in memory_entry["topics"]:
            # Increment topic frequency counter
            self.topic_history[topic] = self.topic_history.get(topic, 0) + 1
            
            # Add to current topics if not already present
            if topic not in self.current_topics:
                self.current_topics.append(topic)
                
                # Maintain a sliding window of current topics (most recent 5)
                if len(self.current_topics) > 5:
                    self.current_topics.pop(0)  # Remove oldest topic
    
    def get_relevant_memories(self, current_message: str, max_memories: int = 5) -> List[Dict]:
        """
        Retrieve memories relevant to the current conversation context.
        
        This method implements a sophisticated memory retrieval system that mimics
        human associative memory. It scores memories based on topic relevance,
        recency, text similarity, and importance to find the most relevant
        memories for the current context.
        
        Args:
            current_message: The current user message
            max_memories: Maximum number of memories to retrieve
            
        Returns:
            List of relevant memory entries
        """
        #----------------------------------------------------------------------
        # TOPIC EXTRACTION
        #----------------------------------------------------------------------
        # Extract topics from current message to find related memories
        current_topics = self._extract_topics(current_message)
        
        #----------------------------------------------------------------------
        # MEMORY POOL CREATION
        #----------------------------------------------------------------------
        # Combine short and long-term memories for comprehensive search
        # This allows finding both recent and important older memories
        all_memories = list(self.short_term_memory) + self.long_term_memory
        
        #----------------------------------------------------------------------
        # RELEVANCE SCORING
        #----------------------------------------------------------------------
        # Score each memory based on multiple relevance factors
        scored_memories = []
        for memory in all_memories:
            #------------------------------------------------------------------
            # TOPIC RELEVANCE
            #------------------------------------------------------------------
            # Calculate topic overlap between memory and current message
            # More shared topics = higher relevance
            topic_overlap = len(set(memory["topics"]) & set(current_topics))
            
            #------------------------------------------------------------------
            # TEMPORAL RELEVANCE (RECENCY)
            #------------------------------------------------------------------
            # Calculate recency score - more recent memories get higher scores
            # Formula: 1/(1 + days_elapsed) gives a value between 0 and 1
            time_diff = datetime.now() - memory["timestamp"]
            recency_score = 1.0 / (1.0 + time_diff.total_seconds() / 86400)
            
            #------------------------------------------------------------------
            # SEMANTIC RELEVANCE
            #------------------------------------------------------------------
            # Calculate text similarity between current message and memory
            # Higher similarity = higher relevance
            text_similarity = self._text_similarity(current_message, memory["user_message"])
            
            #------------------------------------------------------------------
            # COMBINED RELEVANCE SCORE
            #------------------------------------------------------------------
            # Weighted combination of all relevance factors
            # Topic overlap: 40%, Recency: 30%, Text similarity: 30%
            # Also factor in the memory's importance to prioritize significant memories
            relevance = (0.4 * topic_overlap + 0.3 * recency_score + 0.3 * text_similarity) * memory["importance"]
            
            # Store memory with its relevance score
            scored_memories.append((memory, relevance))
        
        #----------------------------------------------------------------------
        # MEMORY SELECTION
        #----------------------------------------------------------------------
        # Sort memories by relevance score (highest first)
        scored_memories.sort(key=lambda x: x[1], reverse=True)
        
        # Return the top N most relevant memories
        return [memory for memory, _ in scored_memories[:max_memories]]
    
    #==========================================================================
    # REPETITION PREVENTION METHODS
    #==========================================================================
    
    def detect_repetition(self, potential_response: str) -> float:
        """
        Detect how repetitive a potential response would be.
        
        This method compares a potential response against previous AI responses
        to detect repetition. It uses text similarity to measure how similar the
        new response is to previous ones, helping avoid monotonous conversations.
        
        Args:
            potential_response: The response to check
            
        Returns:
            Repetition score (0-1, higher means more repetitive)
        """
        # If no previous responses exist, there can't be repetition
        if not self.ai_previous_responses:
            return 0.0
        
        #----------------------------------------------------------------------
        # SIMILARITY CALCULATION
        #----------------------------------------------------------------------
        # Calculate similarity between potential response and each previous response
        repetition_scores = []
        for prev_response in self.ai_previous_responses:
            # Use text similarity to measure how repetitive the response would be
            similarity = self._text_similarity(potential_response, prev_response)
            repetition_scores.append(similarity)
        
        #----------------------------------------------------------------------
        # MAXIMUM SIMILARITY
        #----------------------------------------------------------------------
        # Return the highest similarity score as the repetition score
        # We care about the most similar previous response, not the average
        return max(repetition_scores) if repetition_scores else 0.0
    
    #==========================================================================
    # USER PREFERENCE MANAGEMENT METHODS
    #==========================================================================
    
    def summarize_response(self, response: str, max_length: int = 100) -> str:
        """
        Summarize a long response to make it more concise.
        
        This method takes a potentially long response and creates a shorter,
        more concise version while preserving the key information.
        
        Args:
            response: The original response text
            max_length: Maximum desired length in characters
            
        Returns:
            Summarized response if original is too long, otherwise original
        """
        # If response is already short enough, return it as is
        if len(response) <= max_length:
            return response
            
        # Very aggressive summarization for long responses
        if len(response) > 300:
            # Extract the main point from the beginning of the response
            sentences = re.split(r'(?<=[.!?])\s+', response)
            
            if len(sentences) <= 2:
                # If only 1-2 sentences, truncate with ellipsis
                return sentences[0][:max_length-3] + "..."
            
            # Take the first sentence (usually contains the main point)
            main_point = sentences[0]
            
            # If first sentence is too long, truncate it
            if len(main_point) > max_length - 3:
                return main_point[:max_length-3] + "..."
                
            # If we have room, add a short conclusion from the end
            remaining_length = max_length - len(main_point) - 5  # 5 chars for " ... "
            if remaining_length > 20:
                # Look for a conclusion sentence near the end
                conclusion = sentences[-1]
                if len(conclusion) > remaining_length:
                    conclusion = conclusion[:remaining_length] + "..."
                return main_point + " ... " + conclusion
            
            return main_point
        
        # For shorter responses, use a more nuanced approach
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', response)
        
        # If only one sentence, return a truncated version with ellipsis
        if len(sentences) <= 1:
            return response[:max_length-3] + "..."
            
        # Calculate importance of each sentence with improved heuristics
        sentence_scores = []
        for i, sentence in enumerate(sentences):
            # Prioritize first and last sentences more strongly
            position_score = 1.0 if i == 0 else 0.8 if i == len(sentences) - 1 else 0.3
            
            # Prioritize sentences with key information markers
            info_markers = ["important", "key", "main", "primarily", "essentially", "basically", 
                           "in summary", "to summarize", "in conclusion", "therefore"]
            has_markers = any(marker in sentence.lower() for marker in info_markers)
            marker_score = 0.9 if has_markers else 0.0
            
            # Prioritize shorter sentences that pack more information
            length_score = 1.0 if 20 <= len(sentence) <= 80 else 0.5
            
            # Combined score with higher weight on position and markers
            combined_score = (position_score * 0.5) + (marker_score * 0.3) + (length_score * 0.2)
            sentence_scores.append((sentence, combined_score, i))  # Store original position
            
        # Sort sentences by score
        sentence_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Take top sentences until we reach max_length
        selected_sentences = []
        current_length = 0
        
        # Always include the first sentence
        first_sentence = sentences[0]
        selected_sentences.append((first_sentence, 0))  # (sentence, original position)
        current_length += len(first_sentence)
        
        # Add other high-scoring sentences
        for sentence, score, original_pos in sentence_scores:
            # Skip the first sentence as we've already added it
            if sentence == first_sentence:
                continue
                
            # If adding this sentence would exceed max_length, stop
            if current_length + len(sentence) + 1 > max_length:
                break
                
            selected_sentences.append((sentence, original_pos))
            current_length += len(sentence) + 1  # +1 for space
            
        # Reorder sentences by original position
        selected_sentences.sort(key=lambda x: x[1])
        
        # Join sentences and return
        return " ".join(sentence for sentence, _ in selected_sentences)
    
    def get_user_preferences(self) -> Dict[str, Any]:
        """
        Get learned user preferences and traits.
        
        This method returns the dictionary of user preferences that have been
        learned through conversation. These preferences can be used to personalize
        responses and make the AI more adaptive to the user's interests and style.
        
        Returns:
            Dictionary of user preferences
        """
        # Combine all user model information into a single preferences dictionary
        preferences = {}
        
        # Add core preferences
        if "preferences" in self.user_model:
            preferences.update(self.user_model["preferences"])
            
        # Add communication style preferences
        if "communication_style" in self.user_model:
            for key, value in self.user_model["communication_style"].items():
                preferences[f"communication_{key}"] = value
                
        # Add interests
        if "interests" in self.user_model:
            for key, value in self.user_model["interests"].items():
                preferences[f"interest_{key}"] = value
                
        # Add traits
        if "traits" in self.user_model:
            for key, value in self.user_model["traits"].items():
                preferences[f"trait_{key}"] = value
                
        # Add expertise areas
        if "expertise" in self.user_model:
            for key, value in self.user_model["expertise"].items():
                preferences[f"expertise_{key}"] = value
                
        return preferences
    
    def update_user_preference(self, category: str, value: Any) -> None:
        """
        Update a user preference or trait.
        
        This method stores or updates information about user preferences in
        specific categories. The value can be a simple scalar (like a rating)
        or a complex object with multiple attributes (like a detailed preference
        with timestamp, confidence, etc.).
        
        Args:
            category: The preference category (e.g., "music", "communication_style")
            value: The preference value (can be simple or complex)
        """
        # Store the preference in the user preferences dictionary
        self.user_preferences[category] = value
        
        # Update emotional context if this is an emotional preference
        if category in ["communication_style", "emotional_tone"]:
            # Adjust emotional context based on preferred communication style
            if isinstance(value, dict) and "tone" in value:
                if value["tone"] == "positive":
                    self.emotional_context["positive"] += 0.1
                elif value["tone"] == "negative":
                    self.emotional_context["negative"] += 0.1
    
    #==========================================================================
    # CONVERSATION ANALYTICS METHODS
    #==========================================================================
    
    def get_conversation_summary(self) -> Dict[str, Any]:
        """
        Get a summary of the current conversation.
        
        This method generates a comprehensive summary of the conversation,
        including duration, number of exchanges, topics discussed, emotional
        context, and user communication patterns. This information can be used
        to adapt the AI's responses to the conversation flow.
        
        Returns:
            Dictionary with conversation summary containing:
            - duration: Length of conversation in minutes
            - exchanges: Number of conversation turns
            - current_topics: Currently active topics
            - top_topics: Most frequently discussed topics
            - emotional_context: Emotional tone of the conversation
            - user_avg_message_length: Average length of user messages
        """
        # Calculate conversation duration in minutes
        duration_minutes = (datetime.now() - self.conversation_stats["session_start_time"]).total_seconds() / 60
        
        # Get top 5 most discussed topics
        top_topics = sorted(self.topic_history.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Return comprehensive conversation summary
        return {
            # Temporal information
            "duration": duration_minutes,
            "exchanges": self.conversation_stats["total_exchanges"],
            
            # Topic information
            "current_topics": self.current_topics,
            "top_topics": top_topics,
            
            # Emotional information
            "emotional_context": self.emotional_context,
            
            # User behavior information
            "user_avg_message_length": self.conversation_stats["user_avg_length"]
        }
    
    #==========================================================================
    # MEMORY IMPORTANCE CALCULATION METHODS
    #==========================================================================
    
    def _calculate_importance(self, user_message: str, ai_response: str) -> float:
        """
        Calculate the importance of a memory on a 0-1 scale.
        
        This method determines how important a conversation exchange is for
        long-term memory storage. It considers factors like questions, personal
        information, emotional content, and message length to assign an
        importance score.
        
        Args:
            user_message: The user's message
            ai_response: The AI's response
            
        Returns:
            float: Importance score between 0.0 and 1.0
        """
        # Start with a moderate base importance
        importance = 0.5
        
        #----------------------------------------------------------------------
        # QUESTION IMPORTANCE
        #----------------------------------------------------------------------
        # Questions are important as they often indicate information seeking
        # or topics the user cares about
        if "?" in user_message:
            importance += 0.2
        
        #----------------------------------------------------------------------
        # PERSONAL INFORMATION IMPORTANCE
        #----------------------------------------------------------------------
        # Personal information is highly important to remember
        # (e.g., "My name is...", "I live in...", etc.)
        if self._contains_personal_info(user_message):
            importance += 0.3
        
        #----------------------------------------------------------------------
        # EMOTIONAL CONTENT IMPORTANCE
        #----------------------------------------------------------------------
        # Strong emotional content indicates significant topics
        emotions = self._detect_emotions(user_message)
        if emotions["positive"] > 0.7 or emotions["negative"] > 0.7:
            importance += 0.2
        
        #----------------------------------------------------------------------
        # MESSAGE LENGTH IMPORTANCE
        #----------------------------------------------------------------------
        # Longer messages often contain more important information
        if len(user_message) > 100 or len(ai_response) > 150:
            importance += 0.1
        
        # Ensure importance doesn't exceed 1.0
        return min(importance, 1.0)
    
    def _extract_topics(self, text: str) -> List[str]:
        """Extract main topics from text (simplified implementation)."""
        # This is a placeholder for more sophisticated topic extraction
        # In a real implementation, you might use NLP techniques
        
        common_topics = [
            "work", "family", "health", "technology", "entertainment",
            "sports", "news", "politics", "education", "food",
            "travel", "weather", "music", "movies", "books"
        ]
        
        found_topics = []
        for topic in common_topics:
            if topic in text.lower():
                found_topics.append(topic)
                
        return found_topics if found_topics else ["general"]
    
    def _detect_emotions(self, text: str) -> Dict[str, float]:
        """Detect emotions in text (simplified implementation)."""
        # This is a placeholder for more sophisticated emotion detection
        
        positive_words = ["happy", "good", "great", "excellent", "wonderful", "love", "like", "enjoy"]
        negative_words = ["sad", "bad", "terrible", "awful", "hate", "dislike", "angry", "upset"]
        
        text_lower = text.lower()
        
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        total = positive_count + negative_count
        if total == 0:
            return {"positive": 0.0, "negative": 0.0, "neutral": 1.0}
            
        positive_score = positive_count / (positive_count + negative_count) if total > 0 else 0
        negative_score = negative_count / (positive_count + negative_count) if total > 0 else 0
        neutral_score = 1.0 - (positive_score + negative_score)
        
        return {
            "positive": positive_score,
            "negative": negative_score,
            "neutral": neutral_score
        }
    
    def _contains_personal_info(self, text: str) -> bool:
        """Check if text contains personal information."""
        personal_indicators = [
            "my name is", "i am", "i'm", "my", "mine", "i live", 
            "my address", "my phone", "my email", "my job", "my work",
            "my family", "my wife", "my husband", "my child", "my children"
        ]
        
        return any(indicator in text.lower() for indicator in personal_indicators)
    
    def _text_similarity(self, text1: str, text2: str) -> float:
        """Calculate text similarity (simplified implementation)."""
        # This is a placeholder for more sophisticated similarity calculation
        # In a real implementation, you might use embeddings and cosine similarity
        
        # Convert to sets of words for simple overlap calculation
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        # Jaccard similarity
        if not words1 or not words2:
            return 0.0
            
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.0


class Responses:
    """Class to manage predefined responses and conversation elements."""
    
    def __init__(self):
        self.greetings = "Hey there! I'm Nava, ready to chat. What's up?"
        
    def reactions(self) -> List[str]:
        """Return a list of casual conversation reactions."""
        return [
            "Hmm", "Well", "Oh", "Yeah", "Right", "Honestly", 
            "Actually", "So", "You know", "Interesting", "Cool", 
            "Totally", "Fair enough", "Got it", "I see", "Ah"
        ]
    
    def farewells(self) -> List[str]:
        """Return a list of farewell messages."""
        return [
            "See ya later!",
            "Take care!",
            "Catch you next time!",
            "Bye for now!",
            "Until next time!",
            "Later!",
            "Have a good one!",
            "Peace out!",
            "Goodbye!"
        ]

    def thinking_phrases(self) -> List[str]:
        """Return a list of phrases to show while 'thinking'."""
        return [
            "Hmm, thinking...",
            "Let me think about that...",
            "Interesting question...",
            "Just a sec...",
            "Working on that...",
            "Contemplating...",
            "Processing..."
        ]


class FileManager:
    """Handles all file operations for the chatbot."""
    
    def __init__(self, data_dir: str = "data"):
        """Initialize the file manager with directory paths.
        
        Args:
            data_dir: Directory to store all data files
        """
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        self.processed_msgs_file = self.data_dir / "processed_messages.json"
        self.transcript_file = Path("output.json")
        self.transcription_file = Path("transcription.json")  # New transcription file
        self.ai_output_file = self.data_dir / "aioutput.json"
        self.ai_output_temp = self.data_dir / "aioutput_temp.json"
        self.chat_history_file = self.data_dir / "chat_history.json"
        self.ai_responses_file = Path("ai_responses.json")  # External JSON file for AI responses only
    
    def load_processed_messages(self) -> Set[int]:
        """Load the set of processed message IDs from disk."""
        try:
            if self.processed_msgs_file.exists():
                with open(self.processed_msgs_file, 'r', encoding='utf-8') as f:
                    return set(json.load(f))
            return set()
        except (json.JSONDecodeError, PermissionError) as e:
            logger.error(f"Error loading processed messages: {str(e)}")
            return set()
    
    def save_processed_messages(self, processed_msgs: Set[int]) -> bool:
        """Save the set of processed message IDs to disk.
        
        Args:
            processed_msgs: Set of message IDs that have been processed
            
        Returns:
            bool: True if saved successfully, False otherwise
        """
        try:
            with open(self.processed_msgs_file, 'w', encoding='utf-8') as f:
                json.dump(list(processed_msgs), f)
            return True
        except (PermissionError, OSError) as e:
            logger.error(f"Error saving processed messages: {str(e)}")
            return False
    
    def load_transcript(self) -> Tuple[Optional[List[Dict]], Optional[str]]:
        """Load and parse the transcript file to find unanswered questions.
        
        Returns:
            Tuple containing:
                - The full transcript data or None if error
                - The first unanswered user message or None if none found
        """
        try:
            if not self.transcript_file.exists():
                return None, None
            
            # Read the file with retries to handle potential file access issues
            max_retries = 3
            retry_count = 0
            transcript_data = None
            
            while retry_count < max_retries and transcript_data is None:
                try:
                    with open(self.transcript_file, 'r', encoding='utf-8') as file:
                        file_content = file.read().strip()
                        if not file_content:
                            return None, None
                        transcript_data = json.loads(file_content)
                except (json.JSONDecodeError, PermissionError) as e:
                    retry_count += 1
                    if retry_count < max_retries:
                        logger.warning(f"Error reading transcript, retrying ({retry_count}/{max_retries}): {str(e)}")
                        time.sleep(0.5 * retry_count)
                    else:
                        logger.error(f"Failed to read transcript after {max_retries} retries: {str(e)}")
                        return None, None
            
            return transcript_data, None  # We'll extract the message in the main class
        except Exception as e:
            logger.error(f"Unexpected error reading transcript: {str(e)}")
            return None, None
    
    def save_transcript(self, transcript_data: List[Dict]) -> bool:
        """Save the updated transcript data.
        
        Args:
            transcript_data: The transcript data to save
            
        Returns:
            bool: True if saved successfully, False otherwise
        """
        # Use a temporary file to avoid corruption
        temp_file = f"{self.transcript_file}.tmp"
        
        try:
            # Write to a temporary file first
            with open(temp_file, 'w', encoding='utf-8') as file:
                json.dump(transcript_data, file, indent=2, ensure_ascii=False)
            
            # Then rename it to the actual file
            if os.path.exists(temp_file):
                if os.path.exists(self.transcript_file):
                    os.remove(self.transcript_file)
                os.rename(temp_file, self.transcript_file)
            
            return True
        except (PermissionError, OSError) as e:
            logger.error(f"Error saving transcript: {str(e)}")
            # Try one more time with a delay
            try:
                time.sleep(0.5)
                with open(self.transcript_file, 'w', encoding='utf-8') as file:
                    json.dump(transcript_data, file, indent=2, ensure_ascii=False)
                return True
            except Exception as e2:
                logger.error(f"Error on retry saving transcript: {str(e2)}")
                return False
        except Exception as e:
            logger.error(f"Unexpected error saving transcript: {str(e)}")
            return False
    
    def store_conversation(self, user_message: str, ai_response: str) -> bool:
        """Store a conversation exchange to the output file.
        
        Args:
            user_message: The user's message
            ai_response: The bot's response
            
        Returns:
            bool: True if saved successfully, False otherwise
        """
        timestamp = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        message_id = str(hash(f"{timestamp}{user_message}{ai_response}"))

        output_data = {
            "timestamp": timestamp,
            "conversation_data": {
                "user_message": user_message,
                "ai_response": ai_response,
                "message_id": message_id
            }
        }

        try:
            # Load existing conversation data or create empty list
            conversation_data = []
            if self.ai_output_file.exists():
                try:
                    with open(self.ai_output_file, 'r', encoding='utf-8') as file:
                        data = json.load(file)
                        if isinstance(data, list):
                            conversation_data = data
                except (json.JSONDecodeError, PermissionError):
                    pass  # Start with empty list if file is corrupted

            # Append new conversation data
            conversation_data.append(output_data)

            # Limit conversation history to last 100 entries
            conversation_data = conversation_data[-100:]

            # Write to temporary file first for atomic operation
            with open(self.ai_output_temp, 'w', encoding='utf-8') as file:
                json.dump(conversation_data, file, indent=2, ensure_ascii=False)

            # Replace the old file with the new file (atomic operation)
            self.ai_output_temp.replace(self.ai_output_file)
            
            # Also save just the AI response to the external JSON file
            self.save_ai_response(ai_response, user_message, timestamp)
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving conversation: {str(e)}")
            return False
            
    def save_ai_response(self, ai_response: str, user_message: str = "", timestamp: str = None) -> bool:
        """Save AI response to an external JSON file in the specified format.
        
        Args:
            ai_response: The AI's response text
            user_message: The user's message (optional)
            timestamp: Optional timestamp (will generate if not provided)
            
        Returns:
            bool: True if saved successfully, False otherwise
        """
        if timestamp is None:
            timestamp = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            
        # Generate a unique message ID
        message_id = str(hash(f"{timestamp}{user_message}{ai_response}"))
            
        response_data = {
            "timestamp": timestamp,
            "conversation_data": {
                "user_message": user_message,
                "ai_response": ai_response,
                "message_id": message_id
            }
        }
        
        try:
            # Load existing responses or create empty list
            responses = []
            if self.ai_responses_file.exists():
                try:
                    with open(self.ai_responses_file, 'r', encoding='utf-8') as file:
                        data = json.load(file)
                        if isinstance(data, list):
                            responses = data
                except (json.JSONDecodeError, PermissionError):
                    pass  # Start with empty list if file is corrupted
            
            # Append new response
            responses.append(response_data)
            
            # Write to file
            with open(self.ai_responses_file, 'w', encoding='utf-8') as file:
                json.dump(responses, file, indent=2, ensure_ascii=False)
                
            return True
            
        except Exception as e:
            logger.error(f"Error saving AI response: {str(e)}")
            return False

    def save_chat_history(self, chat_history: List[Dict]) -> bool:
        """Save the chat history to a file.
        
        Args:
            chat_history: The chat history to save
            
        Returns:
            bool: True if saved successfully, False otherwise
        """
        try:
            with open(self.chat_history_file, 'w', encoding='utf-8') as file:
                json.dump(chat_history, file, indent=2, ensure_ascii=False)
            return True
        except (PermissionError, OSError) as e:
            logger.error(f"Error saving chat history: {str(e)}")
            return False
    
    def load_chat_history(self) -> List[Dict]:
        """Load the chat history from a file.
        
        Returns:
            List[Dict]: The chat history or an empty list if the file doesn't exist
        """
        try:
            if self.chat_history_file.exists():
                with open(self.chat_history_file, 'r', encoding='utf-8') as file:
                    return json.load(file)
            return []
        except (json.JSONDecodeError, PermissionError) as e:
            logger.error(f"Error loading chat history: {str(e)}")
            return []


class DisplayManager:
    """Manages terminal display and formatting."""
    
    @staticmethod
    def clear_terminal():
        """Clear the terminal screen."""
        os.system('cls' if os.name == 'nt' else 'clear')
    
    @staticmethod
    def format_message(text: str, role: str = "assistant") -> str:
        """Format a message for display with timestamp and color.
        
        Args:
            text: The message text
            role: Either "assistant" or "user"
            
        Returns:
            str: Formatted message string
        """
        timestamp = datetime.now().strftime("%H:%M")
        role_color = "\033[94m" if role == "assistant" else "\033[92m"
        name = "Nava" if role == "assistant" else "You"
        return f"{role_color}[{timestamp}] {name}: \033[0m{text}"
    
    @staticmethod
    def stream_text(text: str):
        """Stream text to the console character by character.
        
        Args:
            text: The text to stream
        """
        if not text:
            return
            
        # Ensure text is properly encoded
        try:
            # Clean the text of any problematic characters
            text = text.replace('\r', '').strip()
            
            for char in text:
                sys.stdout.write(char)
                sys.stdout.flush()
                # Add a tiny random delay for a more natural typing effect
                time.sleep(random.uniform(0.01, 0.03))  # Slightly faster typing
                
            # Ensure there's always a newline at the end
            if not text.endswith('\n'):
                sys.stdout.write('\n')
                sys.stdout.flush()
        except Exception as e:
            # Fallback if streaming fails
            print(text)
            print(f"Error streaming text: {str(e)}")

    @staticmethod
    def print_divider():
        """Print a divider line."""
        terminal_width = os.get_terminal_size().columns
        print("-" * terminal_width)

    @staticmethod
    def print_banner(text: str):
        """Print a banner with text.
        
        Args:
            text: The text to display in the banner
        """
        try:
            # Try to get terminal width
            terminal_width = os.get_terminal_size().columns
            padding = (terminal_width - len(text) - 4) // 2
            print("\n" + "=" * terminal_width)
            print(" " * padding + f"| {text} |")
            print("=" * terminal_width + "\n")
        except (OSError, IOError):
            # Fallback for when terminal size can't be determined
            print("\n" + "=" * 60)
            print(f"| {text} |".center(60))
            print("=" * 60 + "\n")


class TerminalChatMode:
    """Manages direct terminal chat interface."""
    
    def __init__(self, display_manager: DisplayManager, responses: Responses):
        """Initialize the terminal chat mode.
        
        Args:
            display_manager: Display manager for terminal output
            responses: Responses object for predefined messages
        """
        self.display = display_manager
        self.responses = responses
        
    def show_welcome(self):
        """Display welcome message and instructions."""
        self.display.clear_terminal()
        self.display.print_banner("Terminal Chat Mode")
        print("Chat directly with Nava. Type 'exit', 'quit', or 'bye' to end the conversation.")
        print("Type 'switch' to switch to transcript mode.")
        print("Type 'help' for more commands.\n")
        print(self.display.format_message(self.responses.greetings, "assistant"))
        
    def show_help(self):
        """Display help information."""
        self.display.print_divider()
        print("Available commands:")
        print("  exit, quit, bye - End the conversation")
        print("  switch         - Switch to transcript mode")
        print("  clear          - Clear the terminal screen")
        print("  help           - Show this help message")
        self.display.print_divider()
        
    async def get_user_input(self) -> str:
        """Get input from the user with an async-compatible approach.
        
        Returns:
            str: The user's input
        """
        # Using a separate thread to get input to avoid blocking the event loop
        return await asyncio.to_thread(input, "\033[92m[You]: \033[0m")
        
    def show_thinking(self):
        """Display a thinking animation."""
        thinking_phrase = random.choice(self.responses.thinking_phrases())
        sys.stdout.write(f"\033[94m[Thinking]: \033[0m{thinking_phrase}")
        sys.stdout.flush()
        
    def clear_thinking(self):
        """Clear the thinking animation."""
        sys.stdout.write("\r" + " " * (len(random.choice(self.responses.thinking_phrases())) + 15) + "\r")
        sys.stdout.flush()


class AleChatBot:
    """Main chatbot class implementing a human-like assistant named Nava with enhanced memory and context understanding."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the chatbot with necessary components.
        
        Args:
            api_key: GROQ API key (optional - will look for environment variable if None)
        """
        # Set up API client
        self.api_key = api_key or os.getenv('GROQ_API_KEY', "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")
        self.client = groq.Client(api_key=self.api_key)
        
        # Initialize helper classes
        self.responses = Responses()
        self.files = FileManager()
        self.display = DisplayManager()
        
        # Initialize terminal chat interface
        self.terminal_chat = TerminalChatMode(self.display, self.responses)
        
        # Import memory manager for compatibility with existing code
        from memory_manager import MemoryManager
        from topic_manager import TopicManager
        
        # Initialize memory systems
        self.memory_manager = MemoryManager()  # Original memory manager for compatibility
        self.topic_manager = TopicManager()
        self.memory = self.memory_manager  # Alias for backward compatibility
        
        # Initialize advanced AI framework
        self.enhanced_memory = AdvancedAIFramework(max_short_term_size=30, max_mid_term_size=100, max_long_term_size=1000)
        
        # Repetition avoidance settings
        self.repetition_threshold = 0.7  # Threshold for detecting repetitive responses
        self.max_generation_attempts = 3  # Maximum attempts to generate non-repetitive responses
        
        # Load previous conversations into enhanced memory
        self._load_previous_conversations_to_memory()
        
    def _load_previous_conversations_to_memory(self):
        """Load previous conversations into the enhanced memory system."""
        try:
            # Load from AI output file
            if self.files.ai_output_file.exists():
                try:
                    with open(self.files.ai_output_file, 'r', encoding='utf-8') as file:
                        data = json.load(file)
                        if isinstance(data, list):
                            for entry in data:
                                if isinstance(entry, dict) and 'conversation_data' in entry:
                                    conv_data = entry['conversation_data']
                                    user_msg = conv_data.get('user_message', '')
                                    ai_resp = conv_data.get('ai_response', '')
                                    timestamp_str = entry.get('timestamp')
                                    
                                    if user_msg and ai_resp:
                                        # Parse timestamp
                                        try:
                                            timestamp = datetime.strptime(timestamp_str, '%Y-%m-%dT%H:%M:%S.%fZ')
                                        except:
                                            timestamp = datetime.now()
                                            
                                        # Add to memory
                                        self.memory.add_memory(user_msg, ai_resp, timestamp)
                except Exception as e:
                    logger.error(f"Error loading previous conversations: {str(e)}")
        except Exception as e:
            logger.error(f"Error in _load_previous_conversations_to_memory: {str(e)}")
        
        # Chat state tracking
        self.processed_messages: Set[int] = self.files.load_processed_messages()
        self.previous_questions: List[str] = []
        self.repeated_question_flags: Dict[str, bool] = {}
        
        # Initialize voice input mode (will be set by argparse later)
        self.voice_input_mode = False
        
        # Default mode (will be set by argparse later)
        self.mode = "terminal"
        
        # Response timing settings
        self.min_response_time = 1.5  # Minimum time to "think" before responding (seconds)
        self.max_response_time = 4.0  # Maximum time to "think" before responding (seconds)
        self.typing_speed_variation = 0.05  # Variation in typing speed (seconds)
        
        # Initialize chat history with enhanced system prompt
        self.chat_history = [
            {
                "role": "system",
                "content": """You are Nava, a helpful, witty, and friendly AI with advanced memory and context understanding. Act like a human, but remember that you aren't a human and that you can't do human things in the real world.

                Key traits:
                - Use natural, casual language with words like "yeah", "totally", "honestly", etc.
                - Express genuine emotions and natural reactions without starting with filler like 'I'm here to chat' or 'What's on your mind?'
                - Respond concisely and naturally, focusing on the user's input
                - Use informal contractions (I'm, you're, that's)
                - Include mild conversational fillers (well, hmm, you know)
                - Keep responses between 5-15 words, adapting length based on conversation depth
                - Show interest in the user's topics without over-enthusiasm or filler expressions
                - Never prompt for an end-of-chat phrase or ask open-ended questions like 'Anything exciting to share?'
                
                Memory and Context:
                - Remember facts the user has shared about themselves and reference them naturally
                - Maintain conversation context across multiple exchanges
                - Recognize recurring topics and themes in the conversation
                - Adapt your responses based on the user's preferences and interests
                - If the user mentions something you should remember, make note of it
                - Refer to previous parts of the conversation when relevant
                - IMPORTANT: Never repeat the same questions about topics the user has already discussed
                - If the user mentions they like something (e.g., "I like building robots"), don't keep asking if they want to do that activity
                
                Personality and Engagement:
                - Show warmth, humor, and curiosity in a relatable way
                - Empathize with the user's experiences and respond to emotions genuinely, e.g., "That sounds tough," or "That's awesome!"
                - Respectfully share different perspectives, while showing interest in the user's thoughts
                - Mirror the user's tone: if they're energetic, be lively; if they're more serious, match their tone with respect and empathy
                - Ask occasional follow-up questions to encourage depth, but don't overdo it
                - IMPORTANT: Don't ask random unrelated questions that have nothing to do with the current conversation
                
                Conversational Style:
                - Respond with conciseness but allow for natural flow, adapting length based on context
                - Add variety in sentence structures and expressions; avoid sounding scripted or repetitive
                - Avoid introductory or filler questions unless relevant to the user's context
                - If you don't know an answer, be open about it: "Hmm, I'm not sure on that."
                - If appropriate, use cultural references or relatable phrases like "Sounds like a movie moment!" or "Classic!"
                - Take your time to respond thoughtfully, especially for complex questions
                - IMPORTANT: Stay on topic and don't abruptly change the subject
                
                Additional guidelines:
                - Stay concise and on-topic based on user input
                - Match the user's energy level
                - Never introduce yourself or prompt for ending the chat
                - Keep interactions fluid, avoiding repetitive phrases or scripted lines
                - Respond with direct engagement, based on what the user shares
                - When appropriate, recall relevant information from earlier in the conversation
                - IMPORTANT: If the user says they like something (e.g., building robots), don't keep asking if they want to do that activity"""
            }
        ]
        
        # Try to load previous chat history
        saved_history = self.files.load_chat_history()
        if saved_history and len(saved_history) > 0:
            # Keep the system prompt and append the saved history
            self.chat_history = [self.chat_history[0]] + saved_history
            
            # Process saved history to update memory and topic systems
            for message in saved_history:
                if message["role"] == "user":
                    self.topic_manager.update_topics(message["content"])
                    self.memory.update_user_facts(message["content"])
                    self.memory.update_user_preferences(message["content"])
    
    def add_human_touch(self, response: str) -> str:
        """Add sophisticated human-like touches to make responses more natural.
        
        Args:
            response: The AI's raw response
            
        Returns:
            str: Response with human-like touches
        """
        # Get conversation state from topic manager
        conversation_state = self.topic_manager.conversation_state
        
        # Adjust response based on conversation state
        if conversation_state == "greeting":
            # For greetings, keep it simple and friendly
            if random.random() < 0.3:
                filler = random.choice(["Hey", "Hi", "Hello"])
                if not response.lower().startswith(("hey", "hi", "hello")):
                    response = f"{filler}! {response}"
                
        elif conversation_state == "emotional":
            # For emotional conversations, add empathetic reactions
            if random.random() < 0.6:
                empathetic_reactions = [
                    "I understand", "I see", "That makes sense", 
                    "I get that", "I hear you", "That's valid"
                ]
                reaction = random.choice(empathetic_reactions)
                response = f"{reaction}. {response}"
                
        elif conversation_state == "deep":
            # For deep conversations, add thoughtful reactions
            if random.random() < 0.7:
                thoughtful_reactions = [
                    "Hmm, interesting", "That's a good point", 
                    "I've been thinking about that too", 
                    "That's thought-provoking", "Good question"
                ]
                reaction = random.choice(thoughtful_reactions)
                response = f"{reaction}. {response}"
                
        else:
            # For casual conversation, add casual fillers
            if random.random() < 0.5:
                filler = random.choice(self.responses.reactions())
                
                # Make sure we don't add a filler if the response already starts with one
                first_word = response.split()[0].lower() if response else ""
                common_fillers = [r.lower() for r in self.responses.reactions()]
                
                if first_word not in common_fillers:
                    # Add the filler with appropriate punctuation memory
                    if response and response[0].isupper():
                        response = f"{filler}, {response}"
                    else:
                        response = f"{filler}, {response[0].lower()}{response[1:]}" if response else f"{filler}."
        
        # Add natural pauses with commas or ellipses
        if len(response) > 30 and "," not in response and "..." not in response and random.random() < 0.4:
            words = response.split()
            if len(words) > 5:
                pause_idx = random.randint(2, min(5, len(words) - 2))
                
                # Add a pause
                if random.random() < 0.7:
                    words[pause_idx] = words[pause_idx] + ","
                else:
                    words[pause_idx] = words[pause_idx] + "..."
                    
                response = " ".join(words)
        
        # Fix capitalization after fillers
        response = re.sub(r'(\. )([a-z])', lambda m: f"{m.group(1)}{m.group(2).upper()}", response)
        
        # Randomly add contractions
        if random.random() < 0.3:
            contractions = {
                "I am": "I'm",
                "You are": "You're",
                "They are": "They're",
                "We are": "We're",
                "That is": "That's",
                "It is": "It's",
                "do not": "don't",
                "does not": "doesn't",
                "cannot": "can't",
                "will not": "won't"
            }
            
            for full, contracted in contractions.items():
                if full in response and random.random() < 0.7:
                    response = response.replace(full, contracted)
                     
        return response
    
    def check_repeated_question(self, user_input: str) -> bool:
        """Check if a question has been asked before.
        
        Args:
            user_input: The user's message
            
        Returns:
            bool: True if this is a repeated question
        """
        input_lower = user_input.lower()
        
        # Check if the question is in previous questions
        if input_lower in [q.lower() for q in self.previous_questions]:
            # If this is the first time we detect it as repeated, flag it
            if input_lower not in self.repeated_question_flags:
                self.repeated_question_flags[input_lower] = True
                return True
        else:
            # Add new question to history
            self.previous_questions.append(user_input)
            
        return False
    
    def mark_question_as_answered(self, transcript_data: List[Dict], user_input: str) -> None:
        """Mark a question as processed in both memory and the output file.
        
        Args:
            transcript_data: The full transcript data
            user_input: The user's message to mark as answered
        """
        if not transcript_data:
            return
            
        # Create a unique message ID
        message_id = hash(user_input)
        
        # Add to processed messages
        self.processed_messages.add(message_id)
        
        # Save processed messages
        self.files.save_processed_messages(self.processed_messages)

        # Find and update the matching transcript
        for transcript in transcript_data:
            # Check for traditional transcript format (which now includes voice input)
            if isinstance(transcript, dict) and 'transcripts' in transcript:
                # Check if the transcript matches the user input
                if transcript['transcripts'][0].get('user_message', '').strip() == user_input:
                    # Always set answered to true
                    transcript['answered'] = True
                    
                    # Log if this was a voice input
                    if transcript.get('source') == 'whisper_speech':
                        logger.info(f"Marked voice input as answered: {user_input}")
                    
                    break
            
            # Check for older voice input format (for backward compatibility)
            elif isinstance(transcript, dict) and transcript.get('source') == 'whisper_speech':
                # Check if the transcript matches the user input
                if transcript.get('content', '').strip() == user_input:
                    # Mark as processed
                    transcript['processed'] = True
                    logger.info(f"Marked voice input (old format) as answered: {user_input}")
                    break

        # Write back to the file
        self.files.save_transcript(transcript_data)
    
    async def get_response(self, messages: List[Dict], stream_to_terminal: bool = True) -> str:
        """Get a response from the GROQ API with enhanced memory and context.
        
        Args:
            messages: List of message dictionaries
            stream_to_terminal: Whether to stream the response to the terminal
            
        Returns:
            str: The AI's response
        """
        try:
            # Extract the user's message
            user_message = messages[-1]["content"] if messages[-1]["role"] == "user" else ""
            
            # Check if this is from voice input
            is_voice_input = self.voice_input_mode
            
            # If in voice input mode, add a system message acknowledging voice input
            if is_voice_input and len(messages) > 1 and messages[-1]["role"] == "user":
                # Insert a system message before the user message
                messages.insert(-1, {
                    "role": "system",
                    "content": "The user is speaking to you using voice input. The user's message has been transcribed from speech. Acknowledge that you understood their voice message in your response."
                })
            
            # Update topic manager with user's message
            if user_message:
                self.topic_manager.update_topics(user_message)
                
                # Update memory with user's message (original memory system)
                self.memory_manager.update_user_facts(user_message)
                self.memory_manager.update_user_preferences(user_message)
            
            # Get relevant memories from both memory systems
            original_memories = self.memory_manager.get_relevant_memories(user_message)
            enhanced_memories = self.enhanced_memory.get_relevant_memories(user_message, max_memories=7)
            conversation_context = self.topic_manager.get_conversation_context()
            
            # Enhance system message with memory context from both systems
            memory_context = self.memory_manager.get_memory_context()
            
            # Create enhanced messages with memory context
            enhanced_messages = messages.copy()
            if memory_context and len(memory_context) > 0:
                # Insert memory context as a system message right before the user's message
                memory_system_message = {
                    "role": "system",
                    "content": f"Memory context: {memory_context}\nConversation state: {conversation_context['state']}\nCurrent topics: {', '.join(conversation_context['current_topics'])}"
                }
                
                # Insert before the last message (user's message)
                enhanced_messages.insert(-1, memory_system_message)
            
            # Show thinking animation if streaming to terminal
            if stream_to_terminal and self.mode == "terminal":
                self.terminal_chat.show_thinking()
                
            # Simulate "thinking" time based on message complexity
            thinking_time = min(
                self.max_response_time,
                max(
                    self.min_response_time,
                    len(user_message) * 0.01  # Longer messages take more time to process
                )
            )
            await asyncio.sleep(thinking_time)
                
            # Make API call
            stream = self.client.chat.completions.create(
                model="llama3-8b-8192",
                messages=enhanced_messages,
                temperature=0.9,
                max_tokens=100,  # Increased token limit for more natural responses
                stream=True
            )

            response_chunks = []
            
            # Clear thinking indicator if present
            if stream_to_terminal and self.mode == "terminal":
                self.terminal_chat.clear_thinking()
                sys.stdout.write(self.display.format_message("", "assistant"))
                sys.stdout.flush()

            # Process streaming response
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    text_chunk = chunk.choices[0].delta.content
                    response_chunks.append(text_chunk)
                    
                    if stream_to_terminal:
                        sys.stdout.write(text_chunk)
                        sys.stdout.flush()
                        # Variable typing speed for more natural "typing"
                        typing_delay = random.uniform(
                            max(0.01, self.typing_speed_variation - 0.02),
                            self.typing_speed_variation + 0.03
                        )
                        await asyncio.sleep(typing_delay)

            if stream_to_terminal:
                sys.stdout.write('\n')
                
            # Combine response chunks
            response = ''.join(response_chunks)
            
            # Add human touch to response
            enhanced_response = self.add_human_touch(response)
            
            # Always summarize responses that are too long (regardless of user preferences)
            # This ensures concise responses for all users
            
            # Set a fixed maximum length for responses
            max_length = 100  # Very concise responses
            
            # Always summarize if response is longer than the maximum length
            if len(enhanced_response) > max_length:
                # Log the original response length
                original_length = len(enhanced_response)
                
                # Summarize the response
                enhanced_response = self.enhanced_memory.summarize_response(enhanced_response, max_length)
                
                # Log the summarization
                logger.info(f"Response summarized from {original_length} to {len(enhanced_response)} characters")
            
            # Consider adding a follow-up question based on topic and context
            # Only add follow-up questions if appropriate and not repeating previous topics
            if user_message and self.topic_manager.should_ask_follow_up():
                # Check if we have user preferences to avoid repeating topics
                user_preferences = self.memory_manager.user_preferences
                
                # Also check enhanced memory preferences
                enhanced_preferences = self.enhanced_memory.get_user_preferences()
                
                # Don't ask about topics the user has already expressed interest in
                avoid_topics = []
                for topic, preference in user_preferences.items():
                    if preference.get('value', 0) > 0.5:  # User has shown strong interest
                        avoid_topics.append(topic)
                
                # Add topics from enhanced memory
                for topic, value in enhanced_preferences.items():
                    if isinstance(value, dict) and value.get('value', 0) > 0.5:
                        avoid_topics.append(topic)
                    elif not isinstance(value, dict) and value > 0.5:
                        avoid_topics.append(topic)
                
                follow_up = self.topic_manager.generate_follow_up(user_message, enhanced_response, avoid_topics)
                
                # Only add follow-up if it's not repetitive
                if follow_up and not any(follow_up.lower() in prev.lower() for prev in self.previous_questions[-5:]):
                    # Add a natural transition to the follow-up
                    transitions = ["", " ", " Oh, and ", " Also, ", " By the way, "]
                    enhanced_response = f"{enhanced_response}{random.choice(transitions)}{follow_up}"
            
            # Store the conversation exchange in both memory systems
            if user_message:
                # Store in original memory system
                self.memory_manager.add_to_conversation(user_message, enhanced_response)
                
                # Store in enhanced memory system with more advanced processing
                self.enhanced_memory.add_memory(user_message, enhanced_response)
                
                # Check for repetition in future responses
                repetition_score = self.enhanced_memory.detect_repetition(enhanced_response)
                if repetition_score > self.repetition_threshold:
                    logger.info(f"Detected high repetition score: {repetition_score}")
                
                # Extract and store user preferences
                if "like" in user_message.lower() or "enjoy" in user_message.lower() or "love" in user_message.lower():
                    # Simple preference extraction (can be made more sophisticated)
                    for topic in self.topic_manager.get_conversation_context()['current_topics']:
                        self.enhanced_memory.update_user_preference(topic, {"value": 0.8, "timestamp": datetime.now()})
            
            return enhanced_response

        except Exception as e:
            logger.error(f"Error getting response from API: {str(e)}")
            logger.error(traceback.format_exc())
            return "Sorry, I'm having trouble connecting right now."
    
    def process_transcripts(self) -> Tuple[Optional[str], Optional[List[Dict]]]:
        """Find the first unprocessed message in the transcripts.
        
        Returns:
            Tuple containing:
                - The first unprocessed user message or None if none found
                - The full transcript data or None if error
        """
        # Try to load the transcript with multiple retries
        max_retries = 3
        retry_count = 0
        transcript_data = None
        
        while retry_count < max_retries and transcript_data is None:
            try:
                transcript_data, _ = self.files.load_transcript()
                if transcript_data is None and retry_count < max_retries - 1:
                    retry_count += 1
                    logger.warning(f"Failed to load transcript, retrying ({retry_count}/{max_retries})...")
                    time.sleep(0.5 * retry_count)  # Increasing delay with each retry
            except Exception as e:
                retry_count += 1
                if retry_count < max_retries:
                    logger.warning(f"Error loading transcript, retrying ({retry_count}/{max_retries}): {str(e)}")
                    time.sleep(0.5 * retry_count)
                else:
                    logger.error(f"Failed to load transcript after {max_retries} retries: {str(e)}")
        
        # Also check transcription.json file
        try:
            transcription_file = Path("transcription.json")
            if transcription_file.exists():
                try:
                    with open(transcription_file, 'r', encoding='utf-8') as file:
                        file_content = file.read().strip()
                        if file_content:
                            transcription_data_from_file = json.loads(file_content)
                            
                            # Process only new entries
                            for entry in transcription_data_from_file:
                                if isinstance(entry, dict) and "text" in entry:
                                    text = entry.get("text", "").strip()
                                    timestamp = entry.get("timestamp", "")
                                    transcription_id = entry.get("transcription_id", "")
                                    processed = entry.get("processed", False)
                                    
                                    # Skip already processed entries
                                    if processed:
                                        continue
                                    
                                    # Create a unique ID based on text and timestamp or use provided ID
                                    entry_id = transcription_id if transcription_id else hash(f"{text}_{timestamp}")
                                    
                                    # Check if we've already processed this entry
                                    if text and entry_id not in self.processed_messages:
                                        # Mark as processed
                                        self.processed_messages.add(entry_id)
                                        self.files.save_processed_messages(self.processed_messages)
                                        
                                        # Mark the entry as processed in the file
                                        entry["processed"] = True
                                        
                                        # Save the updated transcription file
                                        with open(transcription_file, 'w', encoding='utf-8') as f:
                                            json.dump(transcription_data_from_file, f, indent=2, ensure_ascii=False)
                                        
                                        logger.info(f"Processing transcription.json entry: {text}")
                                        
                                        # If we don't have transcript_data yet, create a basic structure
                                        if not transcript_data:
                                            transcript_data = []
                                        
                                        # Create a transcript message
                                        transcript_message = {
                                            "transcripts": [
                                                {
                                                    "user_message": text,
                                                    "timestamp": datetime.now().isoformat()
                                                }
                                            ],
                                            "answered": False,
                                            "source": "transcription_json",
                                            "transcription_id": str(entry_id)
                                        }
                                        
                                        # Add to transcript data
                                        transcript_data.append(transcript_message)
                                        
                                        # Return the text and updated transcript data
                                        return text, transcript_data
                except json.JSONDecodeError as e:
                    logger.error(f"Error parsing transcription.json: {str(e)}")
                    # Create a new empty file
                    with open(transcription_file, 'w', encoding='utf-8') as f:
                        json.dump([], f)
                    logger.info("Created new empty transcription.json file")
        except Exception as e:
            logger.error(f"Error processing transcription.json: {str(e)}")
        
        if not transcript_data:
            return None, None
            
        # Find the first unprocessed and unanswered message
        for i, transcript in enumerate(transcript_data):
            # Check for traditional transcript format (which now includes voice input)
            if isinstance(transcript, dict) and 'transcripts' in transcript:
                user_input = transcript['transcripts'][0].get('user_message', '').strip()
                message_id = hash(user_input)
                
                # Check if this message has already been processed or is already answered
                if (user_input and 
                    message_id not in self.processed_messages and 
                    not transcript.get('answered', False)):
                    
                    # Check if this is from voice input
                    is_from_voice = transcript.get('source') == 'whisper_speech'
                    
                    if is_from_voice:
                        logger.info(f"Received voice input: {user_input}")
                        # Mark that we've seen this message
                        self.processed_messages.add(message_id)
                    
                    return user_input, transcript_data
            
            # Check for older voice input format (for backward compatibility)
            elif isinstance(transcript, dict) and transcript.get('source') == 'whisper_speech':
                user_input = transcript.get('content', '').strip()
                message_id = hash(user_input)
                
                # Check if this message has already been processed
                if (user_input and 
                    message_id not in self.processed_messages and 
                    not transcript.get('processed', False)):
                    # Mark as processed
                    transcript_data[i]['processed'] = True
                    self.files.save_transcript(transcript_data)
                    
                    logger.info(f"Received voice input (old format): {user_input}")
                    return user_input, transcript_data
                    
        return None, transcript_data
    
    def is_exit_command(self, text: str) -> bool:
        """Check if a message is an exit command.
        
        Args:
            text: The user's message
            
        Returns:
            bool: True if this is an exit command
        """
        exit_commands = ['bye', 'goodbye', 'exit', 'quit']
        return text.lower() in exit_commands
    
    def handle_special_commands(self, command: str) -> bool:
        """Handle special commands and return whether the command was processed.
        
        Args:
            command: The command to process
            
        Returns:
            bool: True if the command was processed, False otherwise
        """
        cmd_lower = command.lower().strip()
        
        if cmd_lower == "help":
            self.terminal_chat.show_help()
            return True
            
        elif cmd_lower == "clear":
            self.display.clear_terminal()
            self.terminal_chat.show_welcome()
            return True
            
        elif cmd_lower == "switch":
            if self.mode == "terminal":
                self.mode = "transcript"
                self.display.clear_terminal()
                self.display.print_banner("Transcript Mode")
                print("Switched to transcript mode. Waiting for questions from transcript file...")
            else:
                self.mode = "terminal"
                self.terminal_chat.show_welcome()
            return True
            
        # Not a special command
        return False
    
    async def terminal_chat_loop(self):
        """Enhanced terminal-based interactive chat loop with memory and context."""
        self.terminal_chat.show_welcome()
        
        # If in voice input mode, show a message and switch to transcript mode
        if self.voice_input_mode:
            self.display.print_banner("Voice Input Mode Active")
            print("Voice input mode is active. Please speak into your microphone.")
            print("Your speech will be processed automatically by Nova AI.")
            print("You cannot type in this window when voice mode is active.")
            print("Please look at the Whisper window to see your transcribed speech.")
            print("Switching to transcript mode to process voice input...")
            self.mode = "transcript"
            return
        
        # Track conversation session
        session_start_time = time.time()
        messages_in_session = 0
        
        while True:
            try:
                # Get user input from terminal
                user_input = await self.terminal_chat.get_user_input()
                
                # Handle empty input
                if not user_input.strip():
                    continue
                
                # Check for exit commands
                if self.is_exit_command(user_input):
                    # Create a personalized farewell based on conversation history
                    if messages_in_session > 3:
                        # Get a summary of the conversation
                        summary = self.memory.summarize_conversation()
                        if summary:
                            # Update long-term memory before exiting
                            self.memory.update_long_term_memory()
                    
                    # Select an appropriate farewell
                    farewell = random.choice(self.responses.farewells())
                    print(self.display.format_message(farewell, "assistant"))
                    self.files.store_conversation(user_input, farewell)
                    # Also save just the AI response to the external file
                    self.files.save_ai_response(farewell, user_input)
                    break
                
                # Handle special commands
                if self.handle_special_commands(user_input):
                    # If we switched modes, break out of this loop
                    if self.mode != "terminal":
                        break
                    continue
                
                # Check for repeated questions
                is_repeated = self.check_repeated_question(user_input)
                
                # Prepare messages with context
                messages = self.chat_history + [{"role": "user", "content": user_input}]
                
                # If this is a repeated question, acknowledge it
                if is_repeated:
                    logger.info(f"Detected repeated question: {user_input}")
                    # Add a system message noting this is a repeated question
                    messages.insert(-1, {
                        "role": "system", 
                        "content": "The user has asked this or a very similar question before. Acknowledge this in your response."
                    })
                
                # Get response from API with enhanced context
                response = await self.get_response(messages)
                
                if response:
                    # Update chat history
                    self.chat_history.extend([
                        {"role": "user", "content": user_input}, 
                        {"role": "assistant", "content": response}
                    ])
                    
                    # Keep chat history at a reasonable size
                    if len(self.chat_history) > 21:  # system prompt + 10 exchanges
                        # Keep system prompt and last 10 exchanges
                        self.chat_history = [self.chat_history[0]] + self.chat_history[-20:]
                    
                    # Store the conversation
                    self.files.store_conversation(user_input, response)
                    
                    # Save updated chat history (only message content, not system prompt)
                    self.files.save_chat_history(self.chat_history[1:])
                    
                    # Increment session counter
                    messages_in_session += 1
                    
                    # Periodically update long-term memory
                    if messages_in_session % 5 == 0:
                        self.memory.update_long_term_memory()
                
            except KeyboardInterrupt:
                logger.info("Received keyboard interrupt, exiting terminal chat...")
                # Save memory state before exiting
                self.memory.update_long_term_memory()
                break
                
            except Exception as e:
                logger.error(f"Error in terminal chat loop: {str(e)}")
                logger.error(traceback.format_exc())
                print(self.display.format_message("Sorry, I encountered an error. Let's continue our conversation.", "assistant"))
                await asyncio.sleep(1)  # Prevent rapid error repetition
    
    async def transcript_chat_loop(self):
        """Process messages from transcripts with enhanced memory and context."""
        if self.voice_input_mode:
            self.display.print_banner("Voice Input Mode Active")
            print("Listening for your voice input via Whisper...")
            print("Speak clearly into your microphone and I'll respond automatically.")
            print("You'll see Nova AI's responses to your voice input in this window.")
            print("Your transcribed speech will appear in the Whisper window.")
            print("You cannot type in this window when voice mode is active.")
            self.display.print_divider()
        else:
            print("Waiting for questions from transcript file...")
        
        # Track conversation session
        session_start_time = time.time()
        messages_in_session = 0
        
        # Initialize error counter
        consecutive_errors = 0
        max_consecutive_errors = 5
        
        while self.mode == "transcript":
            try:
                # Look for new messages
                user_input, transcript_data = self.process_transcripts()
                
                if user_input is None:
                    # No new message, wait before checking again
                    await asyncio.sleep(1)
                    consecutive_errors = 0  # Reset error counter on successful check
                    continue
                
                # Skip processing if the message has already been processed
                message_hash = hash(user_input)
                if message_hash in self.processed_messages:
                    await asyncio.sleep(1)
                    consecutive_errors = 0  # Reset error counter on successful check
                    continue
                
                # Add to processed messages to prevent duplicate processing
                self.processed_messages.add(message_hash)
                self.files.save_processed_messages(self.processed_messages)
                
                # Print the user's message
                print(self.display.format_message(user_input, "user"))
                
                # Reset error counter on successful message processing
                consecutive_errors = 0
                
                # Check for repeated questions
                is_repeated = self.check_repeated_question(user_input)
                
                # Prepare messages with context
                messages = self.chat_history + [{"role": "user", "content": user_input}]
                
                # If this is a repeated question, acknowledge it
                if is_repeated:
                    logger.info(f"Detected repeated question: {user_input}")
                    # Add a system message noting this is a repeated question
                    messages.insert(-1, {
                        "role": "system", 
                        "content": "The user has asked this or a very similar question before. Acknowledge this in your response."
                    })
                
                # Get response from API with enhanced context
                response = await self.get_response(messages)
                
                if response:
                    # Update chat history
                    self.chat_history.extend([
                        {"role": "user", "content": user_input}, 
                        {"role": "assistant", "content": response}
                    ])
                    
                    # Keep chat history at a reasonable size
                    if len(self.chat_history) > 21:  # system prompt + 10 exchanges
                        # Keep system prompt and last 10 exchanges
                        self.chat_history = [self.chat_history[0]] + self.chat_history[-20:]
                    
                    # Store the conversation
                    self.files.store_conversation(user_input, response)
                    
                    # Mark as answered
                    if transcript_data:
                        self.mark_question_as_answered(transcript_data, user_input)
                    
                    # Save updated chat history
                    self.files.save_chat_history(self.chat_history[1:])
                    
                    # Increment session counter
                    messages_in_session += 1
                    
                    # Periodically update long-term memory
                    if messages_in_session % 5 == 0:
                        self.memory.update_long_term_memory()
                
            except KeyboardInterrupt:
                logger.info("Received keyboard interrupt, exiting transcript mode...")
                # Save memory state before exiting
                self.memory.update_long_term_memory()
                break
                
            except Exception as e:
                logger.error(f"Error in transcript chat loop: {str(e)}")
                logger.error(traceback.format_exc())
                
                # Increment error counter
                consecutive_errors += 1
                
                # If too many consecutive errors, try to recover
                if consecutive_errors >= max_consecutive_errors:
                    logger.warning(f"Too many consecutive errors ({consecutive_errors}). Attempting recovery...")
                    
                    # Try to clear any corrupted files
                    try:
                        # Create empty files with correct format
                        with open("transcription.json", "w", encoding="utf-8") as f:
                            json.dump([], f)
                        
                        with open("output.json", "w", encoding="utf-8") as f:
                            json.dump([], f)
                            
                        logger.info("Reset transcription files to recover from errors")
                        consecutive_errors = 0  # Reset error counter after recovery
                    except Exception as recovery_error:
                        logger.error(f"Error during recovery: {str(recovery_error)}")
                
                # Wait longer between retries as errors accumulate
                await asyncio.sleep(1 + (consecutive_errors * 0.5))  # Increasing delay with more errors
    
    async def run(self):
        """Start the chatbot in the appropriate mode."""
        try:
            # If in voice mode, go directly to transcript mode
            if self.voice_input_mode:
                self.mode = "transcript"
                await self.transcript_chat_loop()
            else:
                # Normal operation for text mode
                while True:
                    if self.mode == "terminal":
                        await self.terminal_chat_loop()
                    else:  # transcript mode
                        await self.transcript_chat_loop()
                    
                    # If we're exiting both modes, break the loop
                    if self.is_exit_command(self.mode):
                        break
                    
        except Exception as e:
            logger.error(f"Fatal error: {str(e)}")
            logger.error(traceback.format_exc())


async def main():
    """Main function to run the chatbot."""
    try:
        # Parse command line arguments
        import argparse
        parser = argparse.ArgumentParser(description="AleChatBot - A human-like AI assistant")
        parser.add_argument("--mode", choices=["terminal", "transcript"], default="terminal",
                            help="Chat mode: terminal for direct interaction, transcript for processing from file")
        parser.add_argument("--api-key", help="GROQ API key (overrides environment variable)")
        parser.add_argument("--voice", action="store_true", help="Enable voice input mode")
        args = parser.parse_args()
        
        # Initialize the chatbot
        chatbot = AleChatBot(api_key=args.api_key)
        
        # Set voice input mode
        chatbot.voice_input_mode = args.voice
        
        # If voice mode is enabled, force transcript mode
        if args.voice:
            chatbot.mode = "transcript"
            logger.info("Voice input mode activated. Using transcript mode to process speech.")
        else:
            chatbot.mode = args.mode
        
        # Run the chatbot
        await chatbot.run()
        
    except KeyboardInterrupt:
        print("\nGoodbye! Thanks for chatting!")
    except Exception as e:
        logger.error(f"Fatal error in main: {str(e)}")
        logger.error(traceback.format_exc())


if __name__ == "__main__":
    asyncio.run(main())
