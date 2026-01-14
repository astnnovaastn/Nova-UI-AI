"""
Enhanced Search System for Nova AI
Provides advanced semantic search capabilities with multiple ranking algorithms.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import logging
import re
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import faiss
import json
import os
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class SearchStrategy(Enum):
    """Different search strategies available."""
    SEMANTIC = "semantic"
    KEYWORD = "keyword"
    HYBRID = "hybrid"
    TEMPORAL = "temporal"
    IMPORTANCE = "importance"

@dataclass
class SearchResult:
    """Represents a search result with metadata."""
    memory_id: str
    content: str
    relevance_score: float
    semantic_score: float
    keyword_score: float
    temporal_score: float
    importance_score: float
    metadata: Dict[str, Any]
    timestamp: datetime
    
class EnhancedSearchEngine:
    """
    Advanced search engine that combines multiple ranking algorithms:
    - Semantic similarity using sentence transformers
    - Keyword matching with TF-IDF
    - Temporal relevance
    - Importance weighting
    - Hybrid scoring
    """
    
    def __init__(self, 
                 model_name: str = 'all-MiniLM-L6-v2',
                 dimension: int = 384,
                 cache_size: int = 1000):
        """
        Initialize the enhanced search engine.
        
        Args:
            model_name: Sentence transformer model name
            dimension: Vector dimension
            cache_size: Maximum cache size for embeddings
        """
        # Initialize models
        self.sentence_model = SentenceTransformer(model_name)
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.95
        )
        
        # Vector storage
        self.dimension = dimension
        self.faiss_index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
        self.memory_vectors = []
        self.memory_metadata = {}
        
        # TF-IDF storage
        self.tfidf_matrix = None
        self.tfidf_texts = []
        
        # Caching
        self.embedding_cache = {}
        self.cache_size = cache_size
        
        # Search weights (can be tuned)
        self.search_weights = {
            'semantic': 0.4,
            'keyword': 0.3,
            'temporal': 0.2,
            'importance': 0.1
        }
        
        # Load existing data
        self._load_search_data()
    
    def _load_search_data(self):
        """Load existing search data from disk."""
        try:
            data_dir = 'data/search'
            os.makedirs(data_dir, exist_ok=True)
            
            # Load vector data
            vector_file = os.path.join(data_dir, 'vectors.json')
            if os.path.exists(vector_file):
                with open(vector_file, 'r') as f:
                    data = json.load(f)
                    self.memory_vectors = data.get('vectors', [])
                    self.memory_metadata = data.get('metadata', {})
                    
                    # Rebuild FAISS index
                    if self.memory_vectors:
                        vectors = np.array(self.memory_vectors).astype('float32')
                        # Normalize vectors for cosine similarity
                        faiss.normalize_L2(vectors)
                        self.faiss_index = faiss.IndexFlatIP(self.dimension)
                        self.faiss_index.add(vectors)
            
            # Load TF-IDF data
            tfidf_file = os.path.join(data_dir, 'tfidf.json')
            if os.path.exists(tfidf_file):
                with open(tfidf_file, 'r') as f:
                    data = json.load(f)
                    self.tfidf_texts = data.get('texts', [])
                    
                    # Rebuild TF-IDF matrix
                    if self.tfidf_texts:
                        self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(self.tfidf_texts)
                        
            logger.info(f"Loaded {len(self.memory_vectors)} memories for search")
            
        except Exception as e:
            logger.error(f"Error loading search data: {e}")
    
    def _save_search_data(self):
        """Save search data to disk."""
        try:
            data_dir = 'data/search'
            os.makedirs(data_dir, exist_ok=True)
            
            # Save vector data
            vector_file = os.path.join(data_dir, 'vectors.json')
            with open(vector_file, 'w') as f:
                json.dump({
                    'vectors': self.memory_vectors,
                    'metadata': self.memory_metadata
                }, f)
            
            # Save TF-IDF data
            tfidf_file = os.path.join(data_dir, 'tfidf.json')
            with open(tfidf_file, 'w') as f:
                json.dump({
                    'texts': self.tfidf_texts
                }, f)
                
        except Exception as e:
            logger.error(f"Error saving search data: {e}")
    
    def add_memory(self, 
                   memory_id: str, 
                   content: str, 
                   metadata: Optional[Dict] = None,
                   importance: float = 1.0) -> bool:
        """
        Add a memory to the search index.
        
        Args:
            memory_id: Unique identifier for the memory
            content: Text content to index
            metadata: Additional metadata
            importance: Importance score (0.0 to 1.0)
            
        Returns:
            bool: Success status
        """
        try:
            # Generate embedding
            embedding = self._get_embedding(content)
            
            # Add to vector index
            vector_idx = len(self.memory_vectors)
            normalized_embedding = embedding.copy()
            faiss.normalize_L2(normalized_embedding.reshape(1, -1))
            self.faiss_index.add(normalized_embedding.reshape(1, -1).astype('float32'))
            
            # Store vector and metadata
            self.memory_vectors.append(embedding.tolist())
            self.memory_metadata[memory_id] = {
                'vector_idx': vector_idx,
                'content': content,
                'metadata': metadata or {},
                'importance': importance,
                'timestamp': datetime.now().isoformat()
            }
            
            # Add to TF-IDF
            self.tfidf_texts.append(content)
            self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(self.tfidf_texts)
            
            # Save data
            self._save_search_data()
            
            return True
            
        except Exception as e:
            logger.error(f"Error adding memory to search index: {e}")
            return False
    
    def _get_embedding(self, text: str) -> np.ndarray:
        """Get embedding for text with caching."""
        # Check cache first
        if text in self.embedding_cache:
            return self.embedding_cache[text]
        
        # Generate embedding
        embedding = self.sentence_model.encode([text])[0]
        
        # Cache with size limit
        if len(self.embedding_cache) >= self.cache_size:
            # Remove oldest entry
            oldest_key = next(iter(self.embedding_cache))
            del self.embedding_cache[oldest_key]
        
        self.embedding_cache[text] = embedding
        return embedding
    
    def search(self, 
               query: str, 
               strategy: SearchStrategy = SearchStrategy.HYBRID,
               max_results: int = 10,
               min_score: float = 0.1) -> List[SearchResult]:
        """
        Search for relevant memories using the specified strategy.
        
        Args:
            query: Search query
            strategy: Search strategy to use
            max_results: Maximum number of results
            min_score: Minimum relevance score threshold
            
        Returns:
            List[SearchResult]: Ranked search results
        """
        if not self.memory_vectors:
            return []
        
        try:
            # Get different types of scores
            semantic_scores = self._semantic_search(query, max_results * 2)
            keyword_scores = self._keyword_search(query, max_results * 2)
            
            # Combine results
            all_memory_ids = set()
            all_memory_ids.update(semantic_scores.keys())
            all_memory_ids.update(keyword_scores.keys())
            
            results = []
            for memory_id in all_memory_ids:
                metadata = self.memory_metadata.get(memory_id)
                if not metadata:
                    continue
                
                # Calculate individual scores
                semantic_score = semantic_scores.get(memory_id, 0.0)
                keyword_score = keyword_scores.get(memory_id, 0.0)
                temporal_score = self._calculate_temporal_score(metadata['timestamp'])
                importance_score = metadata.get('importance', 1.0)
                
                # Calculate combined score based on strategy
                if strategy == SearchStrategy.SEMANTIC:
                    relevance_score = semantic_score
                elif strategy == SearchStrategy.KEYWORD:
                    relevance_score = keyword_score
                elif strategy == SearchStrategy.TEMPORAL:
                    relevance_score = temporal_score
                elif strategy == SearchStrategy.IMPORTANCE:
                    relevance_score = importance_score
                else:  # HYBRID
                    relevance_score = (
                        semantic_score * self.search_weights['semantic'] +
                        keyword_score * self.search_weights['keyword'] +
                        temporal_score * self.search_weights['temporal'] +
                        importance_score * self.search_weights['importance']
                    )
                
                # Filter by minimum score
                if relevance_score >= min_score:
                    results.append(SearchResult(
                        memory_id=memory_id,
                        content=metadata['content'],
                        relevance_score=relevance_score,
                        semantic_score=semantic_score,
                        keyword_score=keyword_score,
                        temporal_score=temporal_score,
                        importance_score=importance_score,
                        metadata=metadata['metadata'],
                        timestamp=datetime.fromisoformat(metadata['timestamp'])
                    ))
            
            # Sort by relevance score
            results.sort(key=lambda x: x.relevance_score, reverse=True)
            
            return results[:max_results]
            
        except Exception as e:
            logger.error(f"Error during search: {e}")
            return []
    
    def _semantic_search(self, query: str, k: int) -> Dict[str, float]:
        """Perform semantic search using embeddings."""
        try:
            # Get query embedding
            query_embedding = self._get_embedding(query)
            normalized_query = query_embedding.copy()
            faiss.normalize_L2(normalized_query.reshape(1, -1))
            
            # Search in FAISS index
            scores, indices = self.faiss_index.search(
                normalized_query.reshape(1, -1).astype('float32'), 
                min(k, len(self.memory_vectors))
            )
            
            # Map back to memory IDs
            results = {}
            for score, idx in zip(scores[0], indices[0]):
                if idx < len(self.memory_vectors):
                    # Find memory ID by vector index
                    for memory_id, metadata in self.memory_metadata.items():
                        if metadata.get('vector_idx') == idx:
                            results[memory_id] = float(score)
                            break
            
            return results
            
        except Exception as e:
            logger.error(f"Error in semantic search: {e}")
            return {}
    
    def _keyword_search(self, query: str, k: int) -> Dict[str, float]:
        """Perform keyword search using TF-IDF."""
        try:
            if self.tfidf_matrix is None or len(self.tfidf_texts) == 0:
                return {}
            
            # Transform query
            query_vector = self.tfidf_vectorizer.transform([query])
            
            # Calculate similarities
            similarities = cosine_similarity(query_vector, self.tfidf_matrix).flatten()
            
            # Get top k results
            top_indices = np.argsort(similarities)[::-1][:k]
            
            # Map back to memory IDs
            results = {}
            for idx in top_indices:
                if similarities[idx] > 0:
                    # Find memory ID by text index
                    text_idx = 0
                    for memory_id, metadata in self.memory_metadata.items():
                        if text_idx == idx:
                            results[memory_id] = float(similarities[idx])
                            break
                        text_idx += 1
            
            return results
            
        except Exception as e:
            logger.error(f"Error in keyword search: {e}")
            return {}
    
    def _calculate_temporal_score(self, timestamp_str: str) -> float:
        """Calculate temporal relevance score."""
        try:
            timestamp = datetime.fromisoformat(timestamp_str)
            time_diff = datetime.now() - timestamp
            days_elapsed = time_diff.total_seconds() / 86400
            
            # Exponential decay: more recent = higher score
            return np.exp(-days_elapsed / 30)  # 30-day half-life
            
        except Exception:
            return 0.0
    
    def update_search_weights(self, weights: Dict[str, float]):
        """Update search strategy weights."""
        total = sum(weights.values())
        if total > 0:
            self.search_weights = {k: v/total for k, v in weights.items()}
    
    def get_search_statistics(self) -> Dict[str, Any]:
        """Get search system statistics."""
        return {
            'total_memories': len(self.memory_vectors),
            'cache_size': len(self.embedding_cache),
            'search_weights': self.search_weights,
            'model_name': self.sentence_model.get_sentence_embedding_dimension(),
            'vector_dimension': self.dimension
        }
    
    def optimize_index(self):
        """Optimize the search indices for better performance."""
        try:
            # Rebuild FAISS index with better parameters
            if len(self.memory_vectors) > 1000:
                # Use IVF index for large datasets
                nlist = min(100, len(self.memory_vectors) // 10)
                quantizer = faiss.IndexFlatIP(self.dimension)
                self.faiss_index = faiss.IndexIVFFlat(quantizer, self.dimension, nlist)
                
                # Train the index
                vectors = np.array(self.memory_vectors).astype('float32')
                faiss.normalize_L2(vectors)
                self.faiss_index.train(vectors)
                self.faiss_index.add(vectors)
                
                logger.info("Optimized FAISS index with IVF")
            
            # Clear embedding cache to free memory
            self.embedding_cache.clear()
            
        except Exception as e:
            logger.error(f"Error optimizing search index: {e}")