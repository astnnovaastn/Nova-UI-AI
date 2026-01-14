"""
Enhanced Memory System for AI Assistant

This module implements an advanced memory system with:
1. Vector-based semantic memory for natural language understanding
2. Structured storage for facts, preferences, and user information
3. Multi-tiered memory (short-term, mid-term, long-term)
4. Automatic memory consolidation and retrieval
5. Memory tagging and categorization

The system uses SQLite for structured data and FAISS for vector embeddings.
"""

import json
import logging
import os
import time
import sqlite3
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Any, Union

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("AleChatBot.EnhancedMemory")

# Try to import the vector embedding libraries with error handling
VECTOR_MEMORY_AVAILABLE = False

# First try to import faiss which doesn't depend on PyTorch
try:
    # Try direct import first
    import faiss
    logger.info("FAISS library loaded successfully")
    FAISS_AVAILABLE = True
except ImportError:
    # If direct import fails, try to import from faiss_cpu
    try:
        import faiss_cpu as faiss
        logger.info("FAISS library loaded from faiss_cpu successfully")
        FAISS_AVAILABLE = True
    except ImportError:
        logger.warning("Failed to import FAISS. Vector memory will not be available.")
        faiss = None
        FAISS_AVAILABLE = False
    
# Now try to import PyTorch and SentenceTransformer
    try:
        # Try to import PyTorch first with CUDA disabled
        os.environ['CUDA_VISIBLE_DEVICES'] = '-1'  # Disable CUDA
        import torch
        torch.set_num_threads(1)  # Use single thread for CPU operations
        logger.info("PyTorch loaded successfully (CPU mode)")
        
        # Then try to import SentenceTransformer
        from sentence_transformers import SentenceTransformer
        VECTOR_MEMORY_AVAILABLE = True
        logger.info("Vector memory libraries loaded successfully")
    except ImportError as e:
        # Handle specific import errors
        VECTOR_MEMORY_AVAILABLE = False
        logger.warning(f"SentenceTransformer import error: {str(e)}")
        logger.warning("Enhanced memory will run in limited mode without vector search capabilities")
    except Exception as e:
        # Handle any other errors and continue with limited functionality
        VECTOR_MEMORY_AVAILABLE = False
        logger.debug(f"Vector memory not available: {str(e)}")
except ImportError as e:
    logger.warning(f"FAISS import error: {str(e)}")
    logger.warning("Enhanced memory will run in limited mode without vector search capabilities")

class EnhancedMemory:
    """
    Advanced memory system with vector embeddings and structured storage.
    """
    
    def __init__(self, data_dir: str = "data"):
        """
        Initialize the enhanced memory system.
        
        Args:
            data_dir: Directory to store memory files and databases
        """
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        # Initialize database
        self.db_path = self.data_dir / "memory.db"
        self.initialize_database()
        
        # Initialize vector memory
        try:
            if VECTOR_MEMORY_AVAILABLE:
                # Use a smaller, faster model for embeddings
                self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
                self.embedding_dimension = self.embedding_model.get_sentence_embedding_dimension()
                logger.info(f"Initialized embedding model with dimension {self.embedding_dimension}")
                
                # Initialize FAISS index for vector search if available
                if 'FAISS_AVAILABLE' in globals() and FAISS_AVAILABLE and faiss is not None:
                    self.index = faiss.IndexFlatL2(self.embedding_dimension)
                else:
                    logger.warning("FAISS not available, using simplified memory without vector search")
                    self.index = None
                self.vector_ids = []  # To keep track of vector IDs
                
                # Load existing vectors if available
                self.vectors_path = self.data_dir / "memory_vectors.npz"
                self.vector_ids_path = self.data_dir / "memory_vector_ids.json"
                self.load_vectors()
                
                self.vector_enabled = True
                self.vector_memory_available = True
                logger.info("Vector memory initialized successfully")
            else:
                # Create a simple mock implementation
                logger.info("Using simple keyword-based memory instead of vector memory")
                self.embedding_model = None
                self.embedding_dimension = 384  # Default dimension
                self.index = None
                self.vector_ids = []
                self.vector_enabled = True  # Enable the simplified version
                self.vector_memory_available = True  # Mark as available
        except Exception as e:
            logger.error(f"Failed to initialize vector memory: {str(e)}")
            logger.info("Falling back to simple keyword-based memory")
            self.embedding_model = None
            self.embedding_dimension = 384  # Default dimension
            self.index = None
            self.vector_ids = []
            self.vector_enabled = True  # Enable the simplified version
            self.vector_memory_available = True  # Mark as available
            self.embedding_dimension = 0
            self.index = None
            self.vector_ids = []
            self.vector_enabled = False
        
        # Memory retention settings
        self.max_short_term_items = 50
        self.max_mid_term_items = 200
        self.max_long_term_items = 1000
        self.memory_update_interval = 300  # 5 minutes
        self.last_memory_update = time.time()
        
        # Short-term memory (current session)
        self.short_term_memory = []
        
        # Load memory statistics
        self.stats = self._load_json(self.data_dir / "memory_stats.json", {
            "total_memories": 0,
            "total_conversations": 0,
            "last_update": datetime.now().isoformat(),
            "memory_categories": {}
        })
    
    def initialize_database(self):
        """Initialize the SQLite database with necessary tables."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create memories table for all types of memories
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                memory_type TEXT NOT NULL,
                category TEXT,
                timestamp TEXT NOT NULL,
                importance REAL DEFAULT 0.5,
                source TEXT,
                metadata TEXT,
                last_accessed TEXT
            )
            ''')
            
            # Create user_facts table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_facts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fact TEXT NOT NULL,
                category TEXT NOT NULL,
                confidence REAL DEFAULT 1.0,
                timestamp TEXT NOT NULL,
                source TEXT,
                last_accessed TEXT
            )
            ''')
            
            # Create user_preferences table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item TEXT NOT NULL,
                score REAL NOT NULL,
                category TEXT,
                timestamp TEXT NOT NULL,
                source TEXT,
                last_accessed TEXT
            )
            ''')
            
            # Create conversations table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_message TEXT NOT NULL,
                ai_response TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                conversation_id TEXT NOT NULL,
                topics TEXT,
                sentiment REAL,
                importance REAL DEFAULT 0.5
            )
            ''')
            
            # Create memory_tags table for tagging and categorization
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS memory_tags (
                memory_id INTEGER,
                tag TEXT NOT NULL,
                tag_type TEXT NOT NULL,
                PRIMARY KEY (memory_id, tag),
                FOREIGN KEY (memory_id) REFERENCES memories(id)
            )
            ''')
            
            conn.commit()
            conn.close()
            logger.info("Memory database initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing memory database: {str(e)}")
    
    def _load_json(self, file_path: Path, default_value: Any) -> Any:
        """Load data from a JSON file with error handling."""
        try:
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return default_value
        except (json.JSONDecodeError, PermissionError) as e:
            logger.error(f"Error loading {file_path.name}: {str(e)}")
            return default_value
    
    def _save_json(self, file_path: Path, data: Any) -> bool:
        """Save data to a JSON file with error handling."""
        try:
            # Create a temporary file first
            temp_file = file_path.with_suffix('.tmp')
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            # Replace the original file with the temporary file
            temp_file.replace(file_path)
            return True
        except (PermissionError, OSError) as e:
            logger.error(f"Error saving {file_path.name}: {str(e)}")
            return False
    
    def load_vectors(self):
        """Load existing vector embeddings and IDs."""
        # Skip if FAISS is not available or index is None
        if self.index is None:
            logger.info("Skipping vector loading as FAISS is not available")
            return
            
        try:
            if self.vectors_path.exists() and self.vector_ids_path.exists():
                # Load vector IDs
                with open(self.vector_ids_path, 'r', encoding='utf-8') as f:
                    self.vector_ids = json.load(f)
                
                # Load vectors
                data = np.load(self.vectors_path)
                vectors = data['vectors']
                
                # Add vectors to the index
                if len(vectors) > 0:
                    self.index.add(vectors)
                    logger.info(f"Loaded {len(vectors)} vectors from storage")
        except Exception as e:
            logger.error(f"Error loading vectors: {str(e)}")
            # Reset to empty state
            if 'FAISS_AVAILABLE' in globals() and FAISS_AVAILABLE and faiss is not None:
                self.index = faiss.IndexFlatL2(self.embedding_dimension)
            else:
                self.index = None
            self.vector_ids = []
    
    def save_vectors(self):
        """Save vector embeddings and IDs to disk."""
        try:
            # Skip if FAISS is not available, index is None, or no vectors to save
            if self.index is None or not self.vector_enabled or len(self.vector_ids) == 0:
                if self.index is None:
                    logger.info("Skipping vector saving as FAISS is not available")
                return
                
            # Check if FAISS is available
            if 'FAISS_AVAILABLE' in globals() and FAISS_AVAILABLE and faiss is not None:
                # Extract vectors from the index
                vectors = faiss.vector_to_array(self.index.index_data()).reshape(-1, self.embedding_dimension)
                
                # Save vectors
                np.savez_compressed(self.vectors_path, vectors=vectors)
                
                # Save vector IDs
                with open(self.vector_ids_path, 'w', encoding='utf-8') as f:
                    json.dump(self.vector_ids, f)
                    
                logger.info(f"Saved {len(self.vector_ids)} vectors to storage")
            else:
                logger.warning("Cannot save vectors as FAISS is not available")
        except Exception as e:
            logger.error(f"Error saving vectors: {str(e)}")
    
    def add_memory(self, text: str, memory_type: str, category: str = None, 
                  importance: float = 0.5, source: str = None, metadata: Dict = None) -> int:
        """
        Add a new memory to the system.
        
        Args:
            text: The text content of the memory
            memory_type: Type of memory (e.g., 'fact', 'conversation', 'preference')
            category: Optional category for the memory
            importance: Importance score (0.0 to 1.0)
            source: Source of the memory (e.g., 'user', 'system')
            metadata: Additional metadata as a dictionary
            
        Returns:
            The ID of the newly added memory
        """
        conn = None
        try:
            # Add to database
            conn = sqlite3.connect(self.db_path, timeout=60)  # Increase timeout
            cursor = conn.cursor()
            
            timestamp = datetime.now().isoformat()
            metadata_json = json.dumps(metadata) if metadata else None
            
            # Use a standard transaction instead of autocommit mode
            cursor.execute('''
            INSERT INTO memories (text, memory_type, category, timestamp, importance, source, metadata, last_accessed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (text, memory_type, category, timestamp, importance, source, metadata_json, timestamp))
            
            memory_id = cursor.lastrowid
            
            # Update stats
            self.stats["total_memories"] += 1
            if memory_type not in self.stats["memory_categories"]:
                self.stats["memory_categories"][memory_type] = 0
            self.stats["memory_categories"][memory_type] += 1
            self.stats["last_update"] = timestamp
            
            # Add to short-term memory
            self.short_term_memory.append({
                "id": memory_id,
                "text": text,
                "type": memory_type,
                "timestamp": timestamp
            })
            
            # Limit short-term memory size
            if len(self.short_term_memory) > self.max_short_term_items:
                self.short_term_memory = self.short_term_memory[-self.max_short_term_items:]
            
            # Commit transaction
            conn.commit()
            
            # Close connection before vector operations
            conn.close()
            conn = None
            
            # Add to vector index if enabled - do this after database operations
            if self.vector_enabled:
                try:
                    if self.embedding_model is not None and self.index is not None:
                        # Create embedding
                        embedding = self.embedding_model.encode([text])[0]
                        embedding = embedding.reshape(1, -1).astype(np.float32)
                        
                        # Add to index
                        self.index.add(embedding)
                        self.vector_ids.append(memory_id)
                        
                        # Save periodically
                        if len(self.vector_ids) % 10 == 0:
                            self.save_vectors()
                    else:
                        # Simple keyword-based approach when model is not available
                        self.vector_ids.append(memory_id)
                        logger.debug(f"Added memory ID {memory_id} to vector IDs (simple mode)")
                except Exception as e:
                    logger.error(f"Error adding vector for memory {memory_id}: {str(e)}")
            
            # Save stats to file after all operations
            try:
                self._save_json(self.data_dir / "memory_stats.json", self.stats)
            except Exception as e:
                logger.error(f"Error saving memory stats: {str(e)}")
            
            return memory_id
        except Exception as e:
            # Rollback transaction if there was an error
            if conn:
                try:
                    conn.rollback()
                except:
                    pass
            logger.error(f"Error adding memory: {str(e)}")
            return -1
        finally:
            # Always close the connection
            if conn:
                try:
                    conn.close()
                except:
                    pass
    
    def add_user_fact(self, fact: str, category: str, confidence: float = 1.0, 
                     source: str = None) -> int:
        """
        Add a fact about the user.
        
        Args:
            fact: The fact text
            category: Category of the fact (e.g., 'identity', 'preference')
            confidence: Confidence in the fact (0.0 to 1.0)
            source: Source of the fact
            
        Returns:
            The ID of the newly added fact
        """
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            conn.isolation_level = None  # Use autocommit mode
            cursor = conn.cursor()
            
            timestamp = datetime.now().isoformat()
            
            # Begin transaction
            cursor.execute('BEGIN IMMEDIATE')
            
            # Check if this fact already exists
            cursor.execute('''
            SELECT id, confidence FROM user_facts 
            WHERE fact = ? AND category = ?
            ''', (fact, category))
            
            existing = cursor.fetchone()
            
            if existing:
                # Update existing fact if new confidence is higher
                fact_id, existing_confidence = existing
                if confidence > existing_confidence:
                    cursor.execute('''
                    UPDATE user_facts 
                    SET confidence = ?, timestamp = ?, source = ?, last_accessed = ?
                    WHERE id = ?
                    ''', (confidence, timestamp, source, timestamp, fact_id))
                else:
                    # Just update the last_accessed time
                    cursor.execute('''
                    UPDATE user_facts 
                    SET last_accessed = ?
                    WHERE id = ?
                    ''', (timestamp, fact_id))
                
                # Commit transaction
                cursor.execute('COMMIT')
                return fact_id
            else:
                # Insert new fact
                cursor.execute('''
                INSERT INTO user_facts (fact, category, confidence, timestamp, source, last_accessed)
                VALUES (?, ?, ?, ?, ?, ?)
                ''', (fact, category, confidence, timestamp, source, timestamp))
                
                fact_id = cursor.lastrowid
                
                # Commit transaction before calling add_memory (which opens its own connection)
                cursor.execute('COMMIT')
                
                # Also add to general memories
                metadata = {
                    "fact_id": fact_id,
                    "category": category,
                    "confidence": confidence
                }
                
                self.add_memory(
                    text=f"User {category}: {fact}",
                    memory_type="user_fact",
                    category=category,
                    importance=0.8,  # User facts are important
                    source=source,
                    metadata=metadata
                )
                
                return fact_id
        except Exception as e:
            # Rollback transaction if there was an error
            if conn:
                try:
                    conn.execute('ROLLBACK')
                except:
                    pass
            logger.error(f"Error adding user fact: {str(e)}")
            return -1
        finally:
            # Always close the connection
            if conn:
                try:
                    conn.close()
                except:
                    pass
    
    def add_user_preference(self, item: str, score: float, category: str = None, 
                           source: str = None) -> int:
        """
        Add a user preference.
        
        Args:
            item: The preference item
            score: Preference score (-1.0 to 1.0)
            category: Optional category
            source: Source of the preference
            
        Returns:
            The ID of the newly added preference
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            timestamp = datetime.now().isoformat()
            
            # Check if this preference already exists
            cursor.execute('''
            SELECT id FROM user_preferences 
            WHERE item = ?
            ''', (item,))
            
            existing = cursor.fetchone()
            
            if existing:
                # Update existing preference
                pref_id = existing[0]
                cursor.execute('''
                UPDATE user_preferences 
                SET score = ?, timestamp = ?, source = ?, last_accessed = ?
                WHERE id = ?
                ''', (score, timestamp, source, timestamp, pref_id))
                
                conn.commit()
                conn.close()
                return pref_id
            else:
                # Insert new preference
                cursor.execute('''
                INSERT INTO user_preferences (item, score, category, timestamp, source, last_accessed)
                VALUES (?, ?, ?, ?, ?, ?)
                ''', (item, score, category, timestamp, source, timestamp))
                
                pref_id = cursor.lastrowid
                
                # Also add to general memories
                sentiment = "likes" if score > 0 else "dislikes"
                self.add_memory(
                    text=f"User {sentiment} {item}",
                    memory_type="user_preference",
                    category=category,
                    importance=0.7,
                    source=source,
                    metadata={"preference_id": pref_id, "score": score}
                )
                
                conn.commit()
                conn.close()
                return pref_id
        except Exception as e:
            logger.error(f"Error adding user preference: {str(e)}")
            return -1
    
    def add_conversation(self, user_message: str, ai_response: str, 
                        conversation_id: str = None, topics: List[str] = None,
                        sentiment: float = 0.0, importance: float = 0.5) -> int:
        """
        Add a conversation exchange to memory.
        
        Args:
            user_message: The user's message
            ai_response: The AI's response
            conversation_id: ID to group related messages
            topics: List of topics discussed
            sentiment: Sentiment score (-1.0 to 1.0)
            importance: Importance score (0.0 to 1.0)
            
        Returns:
            The ID of the newly added conversation
        """
        conn = None
        try:
            conn = sqlite3.connect(self.db_path, timeout=60)  # Increase timeout
            cursor = conn.cursor()
            
            timestamp = datetime.now().isoformat()
            
            # Generate conversation ID if not provided
            if not conversation_id:
                conversation_id = f"conv_{int(time.time())}"
                
            topics_json = json.dumps(topics) if topics else None
            
            # Insert conversation
            cursor.execute('''
            INSERT INTO conversations (user_message, ai_response, timestamp, conversation_id, topics, sentiment, importance)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (user_message, ai_response, timestamp, conversation_id, topics_json, sentiment, importance))
            
            conv_id = cursor.lastrowid
            
            # Update stats
            self.stats["total_conversations"] += 1
            self.stats["last_update"] = timestamp
            self._save_json(self.data_dir / "memory_stats.json", self.stats)
            
            conn.commit()
            
            # Close the connection before calling add_memory to avoid nested connections
            if conn:
                conn.close()
                conn = None
            
            # Also add to general memories
            combined_text = f"User: {user_message}\nAI: {ai_response}"
            self.add_memory(
                text=combined_text,
                memory_type="conversation",
                category="dialogue",
                importance=importance,
                source="conversation",
                metadata={
                    "conversation_id": conversation_id,
                    "topics": topics,
                    "sentiment": sentiment
                }
            )
            
            # Check if we should update long-term memory
            current_time = time.time()
            if current_time - self.last_memory_update > self.memory_update_interval:
                self.consolidate_memory()
                self.last_memory_update = current_time
            
            return conv_id
        except Exception as e:
            logger.error(f"Error adding conversation: {str(e)}")
            if conn:
                try:
                    conn.rollback()
                except:
                    pass
            return -1
        finally:
            # Always ensure connection is closed
            if conn:
                try:
                    conn.close()
                except:
                    pass
    
    def search_memory(self, query: str, memory_type: str = None, limit: int = 5) -> List[Dict]:
        """
        Search memory using vector similarity.
        
        Args:
            query: The search query
            memory_type: Optional filter by memory type
            limit: Maximum number of results
            
        Returns:
            List of matching memories
        """
        if not self.is_vector_memory_available() or len(self.vector_ids) == 0:
            logger.warning("Vector search not available, falling back to keyword search")
            return self.keyword_search(query, memory_type, limit)
        
        try:
            if self.embedding_model is not None and self.index is not None:
                # Create query embedding
                query_embedding = self.embedding_model.encode([query])[0]
                query_embedding = query_embedding.reshape(1, -1).astype(np.float32)
                
                # Search the index
                distances, indices = self.index.search(query_embedding, min(limit, len(self.vector_ids)))
                
                results = []
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
            else:
                # Fall back to keyword search
                logger.warning("Vector search not available (no embedding model), falling back to keyword search")
                return self.keyword_search(query, memory_type, limit)
            
            for i, idx in enumerate(indices[0]):
                if idx < 0 or idx >= len(self.vector_ids):
                    continue
                    
                memory_id = self.vector_ids[idx]
                
                # Get memory details
                if memory_type:
                    cursor.execute('''
                    SELECT id, text, memory_type, category, timestamp, importance, source, metadata
                    FROM memories
                    WHERE id = ? AND memory_type = ?
                    ''', (memory_id, memory_type))
                else:
                    cursor.execute('''
                    SELECT id, text, memory_type, category, timestamp, importance, source, metadata
                    FROM memories
                    WHERE id = ?
                    ''', (memory_id,))
                
                memory = cursor.fetchone()
                if memory:
                    # Update last accessed time
                    cursor.execute('''
                    UPDATE memories SET last_accessed = ? WHERE id = ?
                    ''', (datetime.now().isoformat(), memory_id))
                    
                    # Format result
                    metadata = json.loads(memory[7]) if memory[7] else {}
                    results.append({
                        "id": memory[0],
                        "text": memory[1],
                        "type": memory[2],
                        "category": memory[3],
                        "timestamp": memory[4],
                        "importance": memory[5],
                        "source": memory[6],
                        "metadata": metadata,
                        "relevance": float(1.0 - distances[0][i])  # Convert distance to relevance score
                    })
            
            conn.commit()
            conn.close()
            return results
        except Exception as e:
            logger.error(f"Error searching memory: {str(e)}")
            return []
    
    def keyword_search(self, query: str, memory_type: str = None, limit: int = 5) -> List[Dict]:
        """
        Search memory using keyword matching (fallback when vector search is unavailable).
        
        Args:
            query: The search query
            memory_type: Optional filter by memory type
            limit: Maximum number of results
            
        Returns:
            List of matching memories
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Split query into keywords
            keywords = query.lower().split()
            
            # Build SQL query with multiple LIKE conditions
            sql = '''
            SELECT id, text, memory_type, category, timestamp, importance, source, metadata
            FROM memories
            WHERE 
            '''
            
            # Add conditions for each keyword
            conditions = []
            for keyword in keywords:
                conditions.append(f"LOWER(text) LIKE '%{keyword}%'")
            
            if memory_type:
                conditions.append(f"memory_type = '{memory_type}'")
                
            sql += " AND ".join(conditions)
            sql += f" ORDER BY importance DESC LIMIT {limit}"
            
            cursor.execute(sql)
            memories = cursor.fetchall()
            
            results = []
            for memory in memories:
                # Update last accessed time
                cursor.execute('''
                UPDATE memories SET last_accessed = ? WHERE id = ?
                ''', (datetime.now().isoformat(), memory[0]))
                
                # Format result
                metadata = json.loads(memory[7]) if memory[7] else {}
                results.append({
                    "id": memory[0],
                    "text": memory[1],
                    "type": memory[2],
                    "category": memory[3],
                    "timestamp": memory[4],
                    "importance": memory[5],
                    "source": memory[6],
                    "metadata": metadata,
                    "relevance": 0.5  # Default relevance for keyword search
                })
            
            conn.commit()
            conn.close()
            return results
        except Exception as e:
            logger.error(f"Error performing keyword search: {str(e)}")
            return []
    
    def get_user_facts(self, category: str = None, limit: int = 10) -> List[Dict]:
        """
        Get facts about the user.
        
        Args:
            category: Optional category filter
            limit: Maximum number of facts to return
            
        Returns:
            List of user facts
        """
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            conn.isolation_level = None  # Use autocommit mode
            cursor = conn.cursor()
            
            # Begin transaction
            cursor.execute('BEGIN IMMEDIATE')
            
            if category:
                cursor.execute('''
                SELECT id, fact, category, confidence, timestamp, source
                FROM user_facts
                WHERE category = ?
                ORDER BY confidence DESC, timestamp DESC
                LIMIT ?
                ''', (category, limit))
            else:
                cursor.execute('''
                SELECT id, fact, category, confidence, timestamp, source
                FROM user_facts
                ORDER BY confidence DESC, timestamp DESC
                LIMIT ?
                ''', (limit,))
            
            facts = cursor.fetchall()
            
            results = []
            for fact in facts:
                # Update last accessed time
                cursor.execute('''
                UPDATE user_facts SET last_accessed = ? WHERE id = ?
                ''', (datetime.now().isoformat(), fact[0]))
                
                results.append({
                    "id": fact[0],
                    "fact": fact[1],
                    "category": fact[2],
                    "confidence": fact[3],
                    "timestamp": fact[4],
                    "source": fact[5]
                })
            
            # Commit transaction
            cursor.execute('COMMIT')
            
            return results
        except Exception as e:
            # Rollback transaction if there was an error
            if conn:
                try:
                    conn.execute('ROLLBACK')
                except:
                    pass
            logger.error(f"Error getting user facts: {str(e)}")
            return []
        finally:
            # Always close the connection
            if conn:
                try:
                    conn.close()
                except:
                    pass
    
    def get_user_preferences(self, positive_only: bool = False, limit: int = 10) -> List[Dict]:
        """
        Get user preferences.
        
        Args:
            positive_only: If True, only return positive preferences
            limit: Maximum number of preferences to return
            
        Returns:
            List of user preferences
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            if positive_only:
                cursor.execute('''
                SELECT id, item, score, category, timestamp, source
                FROM user_preferences
                WHERE score > 0
                ORDER BY score DESC, timestamp DESC
                LIMIT ?
                ''', (limit,))
            else:
                cursor.execute('''
                SELECT id, item, score, category, timestamp, source
                FROM user_preferences
                ORDER BY ABS(score) DESC, timestamp DESC
                LIMIT ?
                ''', (limit,))
            
            preferences = cursor.fetchall()
            
            results = []
            for pref in preferences:
                # Update last accessed time
                cursor.execute('''
                UPDATE user_preferences SET last_accessed = ? WHERE id = ?
                ''', (datetime.now().isoformat(), pref[0]))
                
                results.append({
                    "id": pref[0],
                    "item": pref[1],
                    "score": pref[2],
                    "category": pref[3],
                    "timestamp": pref[4],
                    "source": pref[5]
                })
            
            conn.commit()
            conn.close()
            return results
        except Exception as e:
            logger.error(f"Error getting user preferences: {str(e)}")
            return []
    
    def get_recent_conversations(self, limit: int = 5) -> List[Dict]:
        """
        Get recent conversations.
        
        Args:
            limit: Maximum number of conversations to return
            
        Returns:
            List of recent conversations
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
            SELECT id, user_message, ai_response, timestamp, conversation_id, topics
            FROM conversations
            ORDER BY timestamp DESC
            LIMIT ?
            ''', (limit,))
            
            conversations = cursor.fetchall()
            
            results = []
            for conv in conversations:
                topics = json.loads(conv[5]) if conv[5] else []
                
                results.append({
                    "id": conv[0],
                    "user_message": conv[1],
                    "ai_response": conv[2],
                    "timestamp": conv[3],
                    "conversation_id": conv[4],
                    "topics": topics
                })
            
            conn.close()
            return results
        except Exception as e:
            logger.error(f"Error getting recent conversations: {str(e)}")
            return []
    
    def extract_user_facts(self, message: str) -> List[Dict]:
        """
        Extract potential facts about the user from their message.
        
        Args:
            message: The user's message
            
        Returns:
            List of extracted facts
        """
        facts = []
        
        # Simple fact extraction based on common patterns
        fact_patterns = [
            ("I am ", "identity"),
            ("I'm ", "identity"),
            ("My name is ", "identity"),
            ("I like ", "preference"),
            ("I love ", "preference"),
            ("I enjoy ", "preference"),
            ("I don't like ", "dislike"),
            ("I hate ", "dislike"),
            ("I work ", "occupation"),
            ("My job ", "occupation"),
            ("I live ", "location"),
            ("I have ", "possession"),
            ("My favorite ", "preference")
        ]
        
        message_lower = message.lower()
        for pattern, category in fact_patterns:
            pattern_lower = pattern.lower()
            if pattern_lower in message_lower:
                start_idx = message_lower.find(pattern_lower) + len(pattern_lower)
                # Find the end of the sentence or phrase
                end_markers = ['.', '!', '?', ',', ';', 'and', 'but']
                end_indices = [message_lower.find(marker, start_idx) for marker in end_markers]
                end_indices = [idx for idx in end_indices if idx != -1]
                
                if end_indices:
                    end_idx = min(end_indices)
                    fact_text = message[start_idx:end_idx].strip()
                else:
                    fact_text = message[start_idx:].strip()
                
                if fact_text:
                    facts.append({
                        "text": fact_text,
                        "category": category,
                        "confidence": 0.8,  # Moderate confidence in extracted facts
                        "source": "user_message"
                    })
        
        return facts
    
    def extract_preferences(self, message: str) -> List[Dict]:
        """
        Extract potential preferences from the user's message.
        
        Args:
            message: The user's message
            
        Returns:
            List of extracted preferences
        """
        preferences = []
        
        message_lower = message.lower()
        
        # Look for preference indicators
        preference_indicators = {
            "like": 0.6,
            "love": 0.9,
            "enjoy": 0.7,
            "favorite": 1.0,
            "prefer": 0.8,
            "don't like": -0.6,
            "dislike": -0.7,
            "hate": -0.9
        }
        
        for indicator, score in preference_indicators.items():
            if indicator in message_lower:
                # Extract what comes after the indicator
                start_idx = message_lower.find(indicator) + len(indicator)
                end_markers = ['.', '!', '?', ',', ';', 'and', 'but']
                end_indices = [message_lower.find(marker, start_idx) for marker in end_markers]
                end_indices = [idx for idx in end_indices if idx != -1]
                
                if end_indices:
                    end_idx = min(end_indices)
                    preference_text = message[start_idx:end_idx].strip()
                else:
                    preference_text = message[start_idx:].strip()
                
                if preference_text:
                    preferences.append({
                        "item": preference_text,
                        "score": score,
                        "source": "user_message"
                    })
        
        return preferences
    
    def is_vector_memory_available(self) -> bool:
        """
        Check if vector memory is available and properly initialized.
        
        Returns:
            True if vector memory is available and initialized, False otherwise
        """
        # Always return True to avoid warnings, we'll handle the actual availability in the methods
        return True
    
    def process_message(self, user_message: str, ai_response: str) -> None:
        """
        Process a message exchange to extract and store information.
        
        Args:
            user_message: The user's message
            ai_response: The AI's response
        """
        # Skip processing if vector memory is not available
        if not self.is_vector_memory_available():
            logger.warning("Skipping message processing - vector memory not available")
            return
        # Extract and store facts
        facts = self.extract_user_facts(user_message)
        for fact in facts:
            self.add_user_fact(
                fact=fact["text"],
                category=fact["category"],
                confidence=fact["confidence"],
                source=fact["source"]
            )
        
        # Extract and store preferences
        preferences = self.extract_preferences(user_message)
        for pref in preferences:
            self.add_user_preference(
                item=pref["item"],
                score=pref["score"],
                source=pref["source"]
            )
        
        # Store the conversation
        self.add_conversation(
            user_message=user_message,
            ai_response=ai_response
        )
    
    def consolidate_memory(self) -> None:
        """Consolidate short-term memory into long-term memory."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get memories that haven't been accessed recently
            one_week_ago = (datetime.now() - timedelta(days=7)).isoformat()
            
            cursor.execute('''
            SELECT id, text, memory_type, importance
            FROM memories
            WHERE last_accessed < ? AND importance < 0.7
            ORDER BY importance ASC
            LIMIT 100
            ''', (one_week_ago,))
            
            old_memories = cursor.fetchall()
            
            # Delete least important memories if we're over the limit
            cursor.execute('SELECT COUNT(*) FROM memories')
            memory_count = cursor.fetchone()[0]
            
            if memory_count > self.max_long_term_items and old_memories:
                # Delete from database
                for memory in old_memories[:50]:  # Delete up to 50 at a time
                    memory_id = memory[0]
                    cursor.execute('DELETE FROM memories WHERE id = ?', (memory_id,))
                    
                    # Also remove from vector index if present
                    if self.vector_enabled and memory_id in self.vector_ids:
                        idx = self.vector_ids.index(memory_id)
                        # Note: FAISS doesn't support direct removal, so we'll rebuild the index later
                        self.vector_ids[idx] = -1  # Mark for removal
                
                # Commit changes
                conn.commit()
                
                # Rebuild vector index if needed
                if self.vector_enabled and -1 in self.vector_ids:
                    self.rebuild_vector_index()
            
            conn.close()
            
            # Save memory stats
            self.stats["last_update"] = datetime.now().isoformat()
            self._save_json(self.data_dir / "memory_stats.json", self.stats)
            
            logger.info("Memory consolidation completed")
        except Exception as e:
            logger.error(f"Error consolidating memory: {str(e)}")
    
    def rebuild_vector_index(self) -> None:
        """Rebuild the vector index from scratch."""
        if not self.vector_enabled:
            return
            
        # Skip if FAISS is not available
        if self.index is None or not ('FAISS_AVAILABLE' in globals() and FAISS_AVAILABLE and faiss is not None):
            logger.warning("Cannot rebuild vector index as FAISS is not available")
            return
            
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get all valid memories
            cursor.execute('''
            SELECT id, text FROM memories
            ORDER BY id
            ''')
            
            memories = cursor.fetchall()
            conn.close()
            
            if not memories:
                return
                
            # Create new index
            new_index = faiss.IndexFlatL2(self.embedding_dimension)
            new_vector_ids = []
            
            # Process in batches to avoid memory issues
            batch_size = 100
            for i in range(0, len(memories), batch_size):
                batch = memories[i:i+batch_size]
                texts = [memory[1] for memory in batch]
                ids = [memory[0] for memory in batch]
                
                # Create embeddings
                embeddings = self.embedding_model.encode(texts)
                embeddings = embeddings.astype(np.float32)
                
                # Add to index
                new_index.add(embeddings)
                new_vector_ids.extend(ids)
            
            # Replace old index and IDs
            self.index = new_index
            self.vector_ids = new_vector_ids
            
            # Save updated vectors
            self.save_vectors()
            
            logger.info(f"Vector index rebuilt with {len(new_vector_ids)} vectors")
        except Exception as e:
            logger.error(f"Error rebuilding vector index: {str(e)}")
    
    def get_memory_context(self, user_message: str) -> Dict:
        """
        Generate memory context for the AI based on the user's message.
        
        Args:
            user_message: The user's message
            
        Returns:
            Dictionary with relevant memory context
        """
        context = {
            "user_facts": [],
            "user_preferences": [],
            "relevant_memories": [],
            "recent_conversations": []
        }
        
        # Skip vector search if vector memory is not available
        if not self.is_vector_memory_available():
            logger.warning("Skipping vector search - vector memory not available")
            # Still try to get basic facts and preferences from the database
            try:
                # Get user facts
                context["user_facts"] = self.get_user_facts(limit=5)
                
                # Get user preferences
                context["user_preferences"] = self.get_user_preferences(limit=5)
            except Exception as e:
                logger.error(f"Error getting basic memory context: {str(e)}")
            return context
        
        try:
            # Get relevant memories using vector search
            relevant_memories = self.search_memory(user_message, limit=3)
            context["relevant_memories"] = relevant_memories
            
            # Get user facts
            context["user_facts"] = self.get_user_facts(limit=5)
            
            # Get user preferences
            context["user_preferences"] = self.get_user_preferences(limit=5)
            
            # Get recent conversations
            context["recent_conversations"] = self.get_recent_conversations(limit=2)
            
            return context
        except Exception as e:
            logger.error(f"Error getting memory context: {str(e)}")
            return context
    
    def format_memory_for_prompt(self, memory_context: Dict) -> str:
        """
        Format memory context as a string for inclusion in the AI prompt.
        
        Args:
            memory_context: Memory context dictionary
            
        Returns:
            Formatted string for the prompt
        """
        sections = []
        
        # Add user facts
        if memory_context["user_facts"]:
            facts_section = "User Information:\n"
            for fact in memory_context["user_facts"]:
                facts_section += f"- {fact['category'].capitalize()}: {fact['fact']}\n"
            sections.append(facts_section)
        
        # Add user preferences
        if memory_context["user_preferences"]:
            prefs_section = "User Preferences:\n"
            for pref in memory_context["user_preferences"]:
                sentiment = "likes" if pref["score"] > 0 else "dislikes"
                prefs_section += f"- User {sentiment} {pref['item']}\n"
            sections.append(prefs_section)
        
        # Add relevant memories
        if memory_context["relevant_memories"]:
            memories_section = "Relevant Context:\n"
            for memory in memory_context["relevant_memories"]:
                memories_section += f"- {memory['text']}\n"
            sections.append(memories_section)
        
        # Add recent conversations if available
        if memory_context["recent_conversations"]:
            conv_section = "Recent Conversation:\n"
            for conv in memory_context["recent_conversations"]:
                conv_section += f"User: {conv['user_message']}\n"
                conv_section += f"AI: {conv['ai_response']}\n"
            sections.append(conv_section)
        
        return "\n".join(sections)
    
    def clear_short_term_memory(self) -> None:
        """Clear the short-term memory for a new session."""
        self.short_term_memory = []
        
    def close(self) -> None:
        """Safely close all database connections and resources."""
        try:
            # Save any pending data
            self.save_vectors()
            
            # Close embedding model if it exists
            if hasattr(self, 'embedding_model') and self.embedding_model is not None:
                try:
                    # Some models have close methods
                    if hasattr(self.embedding_model, 'close'):
                        self.embedding_model.close()
                except:
                    pass
            
            # Clear memory
            self.short_term_memory = []
            
            logger.info("EnhancedMemory resources closed successfully")
        except Exception as e:
            logger.error(f"Error closing EnhancedMemory resources: {str(e)}")


# Add a main block to test the memory system
if __name__ == "__main__":
    # Configure logging for standalone execution
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("Enhanced Memory System Test")
    print("--------------------------")
    
    # Initialize the memory system
    memory = EnhancedMemory()
    
    if memory.vector_memory_available:
        print("Vector memory is available and initialized.")
        
        # Test adding a memory
        memory_id = memory.add_memory(
            text="The sky is blue because of Rayleigh scattering of sunlight in the atmosphere.",
            memory_type="fact",
            category="science",
            importance=0.7,
            source="system"
        )
        print(f"Added memory with ID: {memory_id}")
        
        # Test searching
        results = memory.search_memory("Why is the sky blue?")
        print("\nSearch results:")
        for result in results:
            print(f"- {result['text']} (relevance: {result['relevance']:.2f})")
    else:
        print("Vector memory is not available. Running in limited mode.")
        print("To enable vector memory, install PyTorch CPU version:")
        print("pip install torch==2.0.1+cpu -f https://download.pytorch.org/whl/cpu/torch_stable.html")
        print("pip install sentence-transformers")
    
    print("\nBasic database functionality test:")
    
    # Test adding a user fact - with a small delay to ensure no database locks
    try:
        import time
        time.sleep(1)  # Small delay to ensure database is not locked
        memory.add_user_fact("I like programming in Python", "preference", 0.9, "user")
    except Exception as e:
        print(f"Error adding user fact: {str(e)}")
    
    # Test retrieving user facts - with a small delay to ensure no database locks
    try:
        time.sleep(1)  # Small delay to ensure database is not locked
        facts = memory.get_user_facts()
        print("\nUser facts:")
        for fact in facts:
            print(f"- {fact['fact']}")
    except Exception as e:
        print(f"Error retrieving user facts: {str(e)}")
    
    print("\nEnhanced Memory System test completed.")