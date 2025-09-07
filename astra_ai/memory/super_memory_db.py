import sqlite3
import threading
from datetime import datetime, timedelta
from typing import List, Dict, Optional

class SuperMemoryDatabase:
    """Persistent, queryable, context-aware memory for AI assistants."""

    def __init__(self, db_path="super_memory.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path, check_same_thread=False, timeout=60)
        self.conn.execute("PRAGMA journal_mode=WAL;")  # Enable WAL mode
        self.conn.execute("PRAGMA busy_timeout=10000;")  # Set busy timeout to 10 seconds
        self._lock = threading.Lock()
        self._create_tables()

    def _create_tables(self):
        c = self.conn.cursor()
        c.execute("""
        CREATE TABLE IF NOT EXISTS memory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            user_message TEXT,
            ai_response TEXT,
            importance REAL,
            topics TEXT,
            emotions TEXT,
            session_id TEXT
        )
        """)
        self.conn.commit()
        c.close()

    def add_exchange(self, user_message: str, ai_response: str, importance: float = 0.5, topics: str = "", emotions: str = "", session_id: Optional[str] = None):
        with self._lock:
            try:
                # Check if connection is still valid, reconnect if needed
                try:
                    self.conn.execute("SELECT 1")
                except (sqlite3.OperationalError, sqlite3.ProgrammingError):
                    # Connection is invalid, reconnect
                    self.conn = sqlite3.connect(self.db_path, check_same_thread=False, timeout=60)
                    self.conn.execute("PRAGMA journal_mode=WAL;")
                    self.conn.execute("PRAGMA busy_timeout=10000;")
                
                c = self.conn.cursor()
                c.execute("""
                INSERT INTO memory (timestamp, user_message, ai_response, importance, topics, emotions, session_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (datetime.now().isoformat(), user_message, ai_response, importance, topics, emotions, session_id))
                self.conn.commit()
                c.close()
            except Exception as e:
                print(f"Error adding exchange to SuperMemoryDatabase: {e}")
                # Try to rollback if possible
                try:
                    self.conn.rollback()
                except:
                    pass

    def get_recent_exchanges(self, limit=20) -> List[Dict]:
        with self._lock:
            c = self.conn.cursor()
            c.execute("SELECT timestamp, user_message, ai_response FROM memory ORDER BY id DESC LIMIT ?", (limit,))
            rows = c.fetchall()
            c.close()
            return [{"timestamp": r[0], "user_message": r[1], "ai_response": r[2]} for r in rows][::-1]

    def search_memories(self, keyword: str, limit=10) -> List[Dict]:
        with self._lock:
            c = self.conn.cursor()
            like_kw = f"%{keyword.lower()}%"
            c.execute("""
            SELECT timestamp, user_message, ai_response FROM memory
            WHERE LOWER(user_message) LIKE ? OR LOWER(ai_response) LIKE ?
            ORDER BY id DESC LIMIT ?
            """, (like_kw, like_kw, limit))
            rows = c.fetchall()
            c.close()
            return [{"timestamp": r[0], "user_message": r[1], "ai_response": r[2]} for r in rows][::-1]

    def get_conversation_summary(self, days: int = 7) -> str:
        with self._lock:
            c = self.conn.cursor()
            since = (datetime.now() - timedelta(days=days)).isoformat()
            c.execute("""
            SELECT user_message, ai_response FROM memory WHERE timestamp >= ? ORDER BY id ASC
            """, (since,))
            rows = c.fetchall()
            c.close()
            if not rows:
                return "No conversation history found for the requested period."
            summary = "\n".join([f"You: {r[0]}\nAI: {r[1]}" for r in rows])
            return summary

    def close(self):
        """Safely close the database connection."""
        try:
            if self.conn:
                self.conn.close()
                print("SuperMemoryDatabase connection closed successfully")
        except Exception as e:
            print(f"Error closing SuperMemoryDatabase connection: {e}")


class SuperMemorySystem:
    """
    Advanced memory system for AI assistants with persistent storage, context management,
    memory prioritization, and natural language interface.
    """

    def __init__(self, db_path="super_memory.db"):
        self.super_memory_db = SuperMemoryDatabase(db_path)

    def store_conversation(self, user_message, ai_response):
        """Store every exchange."""
        self.super_memory_db.add_exchange(user_message, ai_response)

    def get_memory_context(self, user_message, limit=5):
        """Recall relevant memory for prompt injection."""
        memories = self.super_memory_db.search_memories(user_message, limit)
        if not memories:
            return ""
        context = "Relevant past conversation:\n"
        for mem in memories:
            context += f"You: {mem['user_message']}\nAI: {mem['ai_response']}\n"
        return context

    def recall_recent(self, limit=10):
        """Recall recent exchanges."""
        return self.super_memory_db.get_recent_exchanges(limit)

    def recall_about(self, keyword, limit=10):
        """Recall about a topic."""
        return self.super_memory_db.search_memories(keyword, limit)

    def summarize_conversation(self, days=7):
        """Summarize conversation history."""
        return self.super_memory_db.get_conversation_summary(days)

    def close(self):
        self.super_memory_db.close()