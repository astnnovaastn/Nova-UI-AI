import numpy as np
from datetime import datetime
from typing import Dict, List, Optional
import logging
from sentence_transformers import SentenceTransformer
import faiss
import json
import os

logger = logging.getLogger(__name__)

class VectorMemorySystem:
    """Advanced memory system using vector embeddings for semantic search and storage."""
    
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2', dimension: int = 384):
        """Initialize the vector memory system.
        
        Args:
            model_name: Name of the sentence transformer model to use
            dimension: Dimension of the vector embeddings
        """
        self.model = SentenceTransformer(model_name)
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)
        self.memory_vectors = []
        self.metadata_store = {}
        
        # Load existing memories if available
        self._load_memories()
    
    def _load_memories(self):
        """Load existing memories from disk."""
        try:
            if os.path.exists('data/vector_memories.json'):
                with open('data/vector_memories.json', 'r') as f:
                    data = json.load(f)
                    self.memory_vectors = data.get('vectors', [])
                    self.metadata_store = data.get('metadata', {})
                    
                    # Rebuild FAISS index
                    if self.memory_vectors:
                        vectors = np.array(self.memory_vectors).astype('float32')
                        self.index = faiss.IndexFlatL2(self.dimension)
                        self.index.add(vectors)
                        
                logger.info(f"Loaded {len(self.memory_vectors)} vector memories")
        except Exception as e:
            logger.error(f"Error loading vector memories: {e}")
    
    def _save_memories(self):
        """Save memories to disk."""
        try:
            os.makedirs('data', exist_ok=True)
            with open('data/vector_memories.json', 'w') as f:
                json.dump({
                    'vectors': self.memory_vectors,
                    'metadata': self.metadata_store
                }, f)
            logger.info(f"Saved {len(self.memory_vectors)} vector memories")
        except Exception as e:
            logger.error(f"Error saving vector memories: {e}")
    
    def add_memory(self, text: str, metadata: Optional[Dict] = None) -> int:
        """Add a new memory to the vector store.
        
        Args:
            text: The text to store
            metadata: Optional metadata about the memory
            
        Returns:
            int: The memory ID
        """
        try:
            # Generate embedding
            embedding = self.model.encode([text])[0]
            
            # Add to FAISS index
            memory_id = len(self.memory_vectors)
            self.index.add(np.array([embedding]).astype('float32'))
            
            # Store memory
            self.memory_vectors.append(embedding.tolist())
            self.metadata_store[memory_id] = {
                'text': text,
                'metadata': metadata or {},
                'timestamp': datetime.now().isoformat()
            }
            
            # Save to disk
            self._save_memories()
            
            return memory_id
        except Exception as e:
            logger.error(f"Error adding memory: {e}")
            return -1
    
    def search_memories(self, query: str, k: int = 5) -> List[Dict]:
        """Search for similar memories.
        
        Args:
            query: The search query
            k: Number of results to return
            
        Returns:
            List[Dict]: List of similar memories with their metadata
        """
        try:
            # Generate query embedding
            query_embedding = self.model.encode([query])[0]
            
            # Search in FAISS index
            distances, indices = self.index.search(
                np.array([query_embedding]).astype('float32'), 
                min(k, len(self.memory_vectors))
            )
            
            # Format results
            results = []
            for i, idx in enumerate(indices[0]):
                if idx < len(self.metadata_store):
                    memory = self.metadata_store[idx]
                    results.append({
                        'id': int(idx),
                        'text': memory['text'],
                        'metadata': memory['metadata'],
                        'similarity_score': float(1 / (1 + distances[0][i])),
                        'timestamp': memory['timestamp']
                    })
            
            return results
        except Exception as e:
            logger.error(f"Error searching memories: {e}")
            return []
    
    def get_memory(self, memory_id: int) -> Optional[Dict]:
        """Retrieve a specific memory by ID.
        
        Args:
            memory_id: The ID of the memory to retrieve
            
        Returns:
            Optional[Dict]: The memory if found, None otherwise
        """
        return self.metadata_store.get(memory_id)
    
    def update_memory(self, memory_id: int, text: str, metadata: Optional[Dict] = None) -> bool:
        """Update an existing memory.
        
        Args:
            memory_id: The ID of the memory to update
            text: The new text
            metadata: Optional new metadata
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if memory_id not in self.metadata_store:
                return False
            
            # Generate new embedding
            embedding = self.model.encode([text])[0]
            
            # Update FAISS index
            self.index.remove_ids(np.array([memory_id]))
            self.index.add(np.array([embedding]).astype('float32'))
            
            # Update memory
            self.memory_vectors[memory_id] = embedding.tolist()
            self.metadata_store[memory_id].update({
                'text': text,
                'metadata': metadata or self.metadata_store[memory_id]['metadata'],
                'timestamp': datetime.now().isoformat()
            })
            
            # Save to disk
            self._save_memories()
            
            return True
        except Exception as e:
            logger.error(f"Error updating memory: {e}")
            return False
    
    def delete_memory(self, memory_id: int) -> bool:
        """Delete a memory.
        
        Args:
            memory_id: The ID of the memory to delete
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if memory_id not in self.metadata_store:
                return False
            
            # Remove from FAISS index
            self.index.remove_ids(np.array([memory_id]))
            
            # Remove from storage
            del self.metadata_store[memory_id]
            self.memory_vectors[memory_id] = None  # Keep index alignment
            
            # Save to disk
            self._save_memories()
            
            return True
        except Exception as e:
            logger.error(f"Error deleting memory: {e}")
            return False 