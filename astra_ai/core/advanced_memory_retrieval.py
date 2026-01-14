"""
Advanced Memory Retrieval System
Provides intelligent memory retrieval with context awareness and learning.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any, Set
from datetime import datetime, timedelta
import logging
import json
import os
from dataclasses import dataclass, asdict
from enum import Enum
import re
from collections import defaultdict, Counter
import math

from .enhanced_search import EnhancedSearchEngine, SearchStrategy, SearchResult

logger = logging.getLogger(__name__)

class MemoryType(Enum):
    """Types of memories in the system."""
    CONVERSATION = "conversation"
    FACT = "fact"
    PREFERENCE = "preference"
    CONTEXT = "context"
    EMOTION = "emotion"
    ACTION = "action"

class RetrievalContext(Enum):
    """Different contexts for memory retrieval."""
    GENERAL_CHAT = "general_chat"
    PROBLEM_SOLVING = "problem_solving"
    CREATIVE_TASK = "creative_task"
    FACTUAL_QUERY = "factual_query"
    EMOTIONAL_SUPPORT = "emotional_support"

@dataclass
class MemoryEntry:
    """Enhanced memory entry with rich metadata."""
    id: str
    content: str
    memory_type: MemoryType
    importance: float
    confidence: float
    topics: List[str]
    entities: List[str]
    emotions: Dict[str, float]
    context: Dict[str, Any]
    timestamp: datetime
    access_count: int = 0
    last_accessed: Optional[datetime] = None
    related_memories: List[str] = None
    
    def __post_init__(self):
        if self.related_memories is None:
            self.related_memories = []

@dataclass
class RetrievalResult:
    """Result of memory retrieval with explanation."""
    memories: List[MemoryEntry]
    retrieval_strategy: str
    confidence_score: float
    explanation: str
    context_used: Dict[str, Any]

class AdvancedMemoryRetrieval:
    """
    Advanced memory retrieval system that:
    - Uses multiple search strategies
    - Learns from user interactions
    - Provides context-aware retrieval
    - Explains retrieval decisions
    - Adapts to user preferences
    """
    
    def __init__(self, search_engine: EnhancedSearchEngine):
        """
        Initialize the advanced memory retrieval system.
        
        Args:
            search_engine: Enhanced search engine instance
        """
        self.search_engine = search_engine
        self.memories: Dict[str, MemoryEntry] = {}
        self.user_preferences = {}
        self.retrieval_history = []
        self.context_patterns = defaultdict(list)
        
        # Learning parameters
        self.feedback_weight = 0.1
        self.adaptation_rate = 0.05
        
        # Load existing data
        self._load_retrieval_data()
    
    def _load_retrieval_data(self):
        """Load retrieval data from disk."""
        try:
            data_dir = 'data/retrieval'
            os.makedirs(data_dir, exist_ok=True)
            
            # Load memories
            memories_file = os.path.join(data_dir, 'memories.json')
            if os.path.exists(memories_file):
                with open(memories_file, 'r') as f:
                    data = json.load(f)
                    for memory_data in data:
                        memory = MemoryEntry(
                            id=memory_data['id'],
                            content=memory_data['content'],
                            memory_type=MemoryType(memory_data['memory_type']),
                            importance=memory_data['importance'],
                            confidence=memory_data['confidence'],
                            topics=memory_data['topics'],
                            entities=memory_data['entities'],
                            emotions=memory_data['emotions'],
                            context=memory_data['context'],
                            timestamp=datetime.fromisoformat(memory_data['timestamp']),
                            access_count=memory_data.get('access_count', 0),
                            last_accessed=datetime.fromisoformat(memory_data['last_accessed']) if memory_data.get('last_accessed') else None,
                            related_memories=memory_data.get('related_memories', [])
                        )
                        self.memories[memory.id] = memory
            
            # Load user preferences
            prefs_file = os.path.join(data_dir, 'preferences.json')
            if os.path.exists(prefs_file):
                with open(prefs_file, 'r') as f:
                    self.user_preferences = json.load(f)
            
            logger.info(f"Loaded {len(self.memories)} memories for retrieval")
            
        except Exception as e:
            logger.error(f"Error loading retrieval data: {e}")
    
    def _save_retrieval_data(self):
        """Save retrieval data to disk."""
        try:
            data_dir = 'data/retrieval'
            os.makedirs(data_dir, exist_ok=True)
            
            # Save memories
            memories_file = os.path.join(data_dir, 'memories.json')
            memories_data = []
            for memory in self.memories.values():
                memory_dict = asdict(memory)
                memory_dict['memory_type'] = memory.memory_type.value
                memory_dict['timestamp'] = memory.timestamp.isoformat()
                if memory.last_accessed:
                    memory_dict['last_accessed'] = memory.last_accessed.isoformat()
                memories_data.append(memory_dict)
            
            with open(memories_file, 'w') as f:
                json.dump(memories_data, f, indent=2)
            
            # Save user preferences
            prefs_file = os.path.join(data_dir, 'preferences.json')
            with open(prefs_file, 'w') as f:
                json.dump(self.user_preferences, f, indent=2)
                
        except Exception as e:
            logger.error(f"Error saving retrieval data: {e}")
    
    def add_memory(self, 
                   content: str,
                   memory_type: MemoryType = MemoryType.CONVERSATION,
                   importance: float = 1.0,
                   confidence: float = 1.0,
                   context: Optional[Dict] = None) -> str:
        """
        Add a new memory to the system.
        
        Args:
            content: Memory content
            memory_type: Type of memory
            importance: Importance score (0.0 to 1.0)
            confidence: Confidence score (0.0 to 1.0)
            context: Additional context information
            
        Returns:
            str: Memory ID
        """
        try:
            # Generate unique ID
            memory_id = f"mem_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(self.memories)}"
            
            # Extract topics and entities
            topics = self._extract_topics(content)
            entities = self._extract_entities(content)
            emotions = self._detect_emotions(content)
            
            # Create memory entry
            memory = MemoryEntry(
                id=memory_id,
                content=content,
                memory_type=memory_type,
                importance=importance,
                confidence=confidence,
                topics=topics,
                entities=entities,
                emotions=emotions,
                context=context or {},
                timestamp=datetime.now()
            )
            
            # Store memory
            self.memories[memory_id] = memory
            
            # Add to search engine
            self.search_engine.add_memory(
                memory_id=memory_id,
                content=content,
                metadata={
                    'memory_type': memory_type.value,
                    'topics': topics,
                    'entities': entities,
                    'emotions': emotions
                },
                importance=importance
            )
            
            # Find related memories
            self._find_related_memories(memory_id)
            
            # Save data
            self._save_retrieval_data()
            
            return memory_id
            
        except Exception as e:
            logger.error(f"Error adding memory: {e}")
            return ""
    
    def retrieve_memories(self,
                         query: str,
                         context: RetrievalContext = RetrievalContext.GENERAL_CHAT,
                         max_memories: int = 5,
                         min_relevance: float = 0.1) -> RetrievalResult:
        """
        Retrieve relevant memories with intelligent strategy selection.
        
        Args:
            query: Search query
            context: Retrieval context
            max_memories: Maximum number of memories to retrieve
            min_relevance: Minimum relevance threshold
            
        Returns:
            RetrievalResult: Retrieval results with explanation
        """
        try:
            # Determine best search strategy based on context and query
            strategy = self._select_search_strategy(query, context)
            
            # Perform search
            search_results = self.search_engine.search(
                query=query,
                strategy=strategy,
                max_results=max_memories * 2,  # Get more for filtering
                min_score=min_relevance
            )
            
            # Convert to memory entries and apply additional filtering
            relevant_memories = []
            for result in search_results:
                if result.memory_id in self.memories:
                    memory = self.memories[result.memory_id]
                    
                    # Apply context-specific filtering
                    if self._is_memory_relevant_for_context(memory, context, query):
                        # Update access statistics
                        memory.access_count += 1
                        memory.last_accessed = datetime.now()
                        
                        relevant_memories.append(memory)
                        
                        if len(relevant_memories) >= max_memories:
                            break
            
            # Calculate confidence score
            confidence_score = self._calculate_retrieval_confidence(relevant_memories, query)
            
            # Generate explanation
            explanation = self._generate_retrieval_explanation(
                relevant_memories, strategy, context, query
            )
            
            # Record retrieval for learning
            self._record_retrieval(query, context, strategy, relevant_memories)
            
            # Save updated access statistics
            self._save_retrieval_data()
            
            return RetrievalResult(
                memories=relevant_memories,
                retrieval_strategy=strategy.value,
                confidence_score=confidence_score,
                explanation=explanation,
                context_used={'context': context.value, 'query_length': len(query)}
            )
            
        except Exception as e:
            logger.error(f"Error retrieving memories: {e}")
            return RetrievalResult(
                memories=[],
                retrieval_strategy="error",
                confidence_score=0.0,
                explanation=f"Error during retrieval: {str(e)}",
                context_used={}
            )
    
    def _select_search_strategy(self, query: str, context: RetrievalContext) -> SearchStrategy:
        """Select the best search strategy based on query and context."""
        # Analyze query characteristics
        query_length = len(query.split())
        has_questions = '?' in query
        has_specific_terms = any(term in query.lower() for term in ['what', 'when', 'where', 'who', 'how'])
        
        # Context-based strategy selection
        if context == RetrievalContext.FACTUAL_QUERY:
            return SearchStrategy.KEYWORD if has_specific_terms else SearchStrategy.SEMANTIC
        elif context == RetrievalContext.EMOTIONAL_SUPPORT:
            return SearchStrategy.SEMANTIC
        elif context == RetrievalContext.PROBLEM_SOLVING:
            return SearchStrategy.HYBRID
        elif context == RetrievalContext.CREATIVE_TASK:
            return SearchStrategy.SEMANTIC
        else:
            # General chat - use hybrid with preference for recent memories
            if query_length < 5:
                return SearchStrategy.TEMPORAL
            else:
                return SearchStrategy.HYBRID
    
    def _is_memory_relevant_for_context(self, 
                                       memory: MemoryEntry, 
                                       context: RetrievalContext, 
                                       query: str) -> bool:
        """Check if a memory is relevant for the given context."""
        # Basic relevance check
        if memory.confidence < 0.3:
            return False
        
        # Context-specific relevance
        if context == RetrievalContext.EMOTIONAL_SUPPORT:
            # Prefer memories with emotional content
            return any(score > 0.3 for score in memory.emotions.values())
        elif context == RetrievalContext.FACTUAL_QUERY:
            # Prefer fact-type memories
            return memory.memory_type in [MemoryType.FACT, MemoryType.CONTEXT]
        elif context == RetrievalContext.PROBLEM_SOLVING:
            # Prefer action and context memories
            return memory.memory_type in [MemoryType.ACTION, MemoryType.CONTEXT, MemoryType.FACT]
        
        return True
    
    def _calculate_retrieval_confidence(self, memories: List[MemoryEntry], query: str) -> float:
        """Calculate confidence in the retrieval results."""
        if not memories:
            return 0.0
        
        # Factors affecting confidence
        avg_memory_confidence = np.mean([m.confidence for m in memories])
        memory_count_factor = min(1.0, len(memories) / 3)  # Optimal around 3 memories
        recency_factor = np.mean([
            1.0 / (1.0 + (datetime.now() - m.timestamp).days / 30) 
            for m in memories
        ])
        
        return (avg_memory_confidence * 0.5 + 
                memory_count_factor * 0.3 + 
                recency_factor * 0.2)
    
    def _generate_retrieval_explanation(self, 
                                       memories: List[MemoryEntry], 
                                       strategy: SearchStrategy, 
                                       context: RetrievalContext, 
                                       query: str) -> str:
        """Generate human-readable explanation of retrieval results."""
        if not memories:
            return "No relevant memories found for your query."
        
        explanation_parts = []
        
        # Strategy explanation
        strategy_explanations = {
            SearchStrategy.SEMANTIC: "based on meaning and context",
            SearchStrategy.KEYWORD: "based on keyword matching",
            SearchStrategy.HYBRID: "using a combination of semantic and keyword analysis",
            SearchStrategy.TEMPORAL: "prioritizing recent memories",
            SearchStrategy.IMPORTANCE: "focusing on important memories"
        }
        
        explanation_parts.append(f"Found {len(memories)} relevant memories {strategy_explanations.get(strategy, 'using advanced search')}")
        
        # Memory type distribution
        memory_types = Counter(m.memory_type.value for m in memories)
        if len(memory_types) > 1:
            type_desc = ", ".join([f"{count} {mtype}" for mtype, count in memory_types.most_common()])
            explanation_parts.append(f"including {type_desc} memories")
        
        # Recency information
        recent_count = sum(1 for m in memories if (datetime.now() - m.timestamp).days < 7)
        if recent_count > 0:
            explanation_parts.append(f"{recent_count} from recent conversations")
        
        return ". ".join(explanation_parts) + "."
    
    def _record_retrieval(self, 
                         query: str, 
                         context: RetrievalContext, 
                         strategy: SearchStrategy, 
                         memories: List[MemoryEntry]):
        """Record retrieval for learning and adaptation."""
        retrieval_record = {
            'timestamp': datetime.now().isoformat(),
            'query': query,
            'context': context.value,
            'strategy': strategy.value,
            'memory_count': len(memories),
            'memory_ids': [m.id for m in memories]
        }
        
        self.retrieval_history.append(retrieval_record)
        
        # Keep only recent history
        if len(self.retrieval_history) > 1000:
            self.retrieval_history = self.retrieval_history[-1000:]
    
    def provide_feedback(self, query: str, memory_ids: List[str], helpful: bool):
        """Provide feedback on retrieval results for learning."""
        try:
            # Update memory importance based on feedback
            for memory_id in memory_ids:
                if memory_id in self.memories:
                    memory = self.memories[memory_id]
                    if helpful:
                        memory.importance = min(1.0, memory.importance + self.feedback_weight)
                    else:
                        memory.importance = max(0.1, memory.importance - self.feedback_weight)
            
            # Update user preferences
            query_topics = self._extract_topics(query)
            for topic in query_topics:
                if topic not in self.user_preferences:
                    self.user_preferences[topic] = 0.5
                
                if helpful:
                    self.user_preferences[topic] = min(1.0, self.user_preferences[topic] + self.adaptation_rate)
                else:
                    self.user_preferences[topic] = max(0.0, self.user_preferences[topic] - self.adaptation_rate)
            
            # Save updated data
            self._save_retrieval_data()
            
        except Exception as e:
            logger.error(f"Error processing feedback: {e}")
    
    def _extract_topics(self, text: str) -> List[str]:
        """Extract topics from text using improved methods."""
        # Clean text
        text = re.sub(r'[^\w\s]', '', text.lower())
        words = text.split()
        
        # Remove stopwords
        stopwords = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
            'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
            'before', 'after', 'above', 'below', 'between', 'among', 'is', 'are',
            'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
            'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
            'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we',
            'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her',
            'its', 'our', 'their'
        }
        
        # Filter words
        filtered_words = [word for word in words if word not in stopwords and len(word) > 2]
        
        # Count frequencies and return top topics
        word_counts = Counter(filtered_words)
        return [word for word, count in word_counts.most_common(5)]
    
    def _extract_entities(self, text: str) -> List[str]:
        """Extract named entities from text."""
        # Simple entity extraction (in production, use spaCy or similar)
        entities = []
        
        # Find capitalized words (potential names/places)
        capitalized = re.findall(r'\b[A-Z][a-z]+\b', text)
        entities.extend(capitalized)
        
        # Find dates
        dates = re.findall(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', text)
        entities.extend(dates)
        
        # Find numbers
        numbers = re.findall(r'\b\d+\b', text)
        entities.extend(numbers)
        
        return list(set(entities))
    
    def _detect_emotions(self, text: str) -> Dict[str, float]:
        """Detect emotions in text using keyword-based approach."""
        emotion_keywords = {
            'joy': ['happy', 'joy', 'excited', 'pleased', 'delighted', 'cheerful'],
            'sadness': ['sad', 'unhappy', 'depressed', 'disappointed', 'grief'],
            'anger': ['angry', 'mad', 'furious', 'annoyed', 'irritated'],
            'fear': ['afraid', 'scared', 'worried', 'anxious', 'nervous'],
            'surprise': ['surprised', 'amazed', 'shocked', 'astonished'],
            'disgust': ['disgusted', 'revolted', 'repulsed']
        }
        
        text_lower = text.lower()
        emotions = {}
        
        for emotion, keywords in emotion_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            emotions[emotion] = min(1.0, score / len(keywords))
        
        return emotions
    
    def _find_related_memories(self, memory_id: str):
        """Find and link related memories."""
        if memory_id not in self.memories:
            return
        
        current_memory = self.memories[memory_id]
        
        # Find memories with similar topics or entities
        for other_id, other_memory in self.memories.items():
            if other_id == memory_id:
                continue
            
            # Check topic overlap
            topic_overlap = len(set(current_memory.topics) & set(other_memory.topics))
            entity_overlap = len(set(current_memory.entities) & set(other_memory.entities))
            
            if topic_overlap >= 2 or entity_overlap >= 1:
                if other_id not in current_memory.related_memories:
                    current_memory.related_memories.append(other_id)
                if memory_id not in other_memory.related_memories:
                    other_memory.related_memories.append(memory_id)
    
    def get_memory_statistics(self) -> Dict[str, Any]:
        """Get statistics about the memory system."""
        if not self.memories:
            return {}
        
        memory_types = Counter(m.memory_type.value for m in self.memories.values())
        avg_importance = np.mean([m.importance for m in self.memories.values()])
        avg_confidence = np.mean([m.confidence for m in self.memories.values()])
        total_accesses = sum(m.access_count for m in self.memories.values())
        
        return {
            'total_memories': len(self.memories),
            'memory_types': dict(memory_types),
            'average_importance': avg_importance,
            'average_confidence': avg_confidence,
            'total_accesses': total_accesses,
            'retrieval_history_size': len(self.retrieval_history),
            'user_preferences_count': len(self.user_preferences)
        }