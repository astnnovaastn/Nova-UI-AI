#!/usr/bin/env python3
"""
Search and News Memory System for Nova AI
=========================================

Dedicated memory system for storing and retrieving search and news history
with comprehensive metadata and cross-session persistence.

Features:
- Separate JSON files for search and news history
- Complete query and result storage with timestamps
- User question and AI analysis tracking
- Cross-session memory persistence
- Comprehensive history retrieval
"""

import json
import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
import hashlib

logger = logging.getLogger(__name__)

@dataclass
class SearchRecord:
    """Represents a search query and its results"""
    search_id: str
    query: str
    results: str
    timestamp: datetime
    user_context: Dict[str, Any]
    analysis_summary: str = ""
    follow_up_questions: List[str] = field(default_factory=list)
    ai_insights: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class NewsRecord:
    """Represents a news query and its results"""
    news_id: str
    query: str
    source: Optional[str]
    results: str
    timestamp: datetime
    user_context: Dict[str, Any]
    analysis_summary: str = ""
    follow_up_questions: List[str] = field(default_factory=list)
    ai_insights: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

class SearchNewsMemorySystem:
    """
    Dedicated memory system for search and news history
    """
    
    def __init__(self, search_file: str = "search_history.json", news_file: str = "news_history.json"):
        self.search_file = search_file
        self.news_file = news_file
        
        # In-memory storage
        self.search_history: List[SearchRecord] = []
        self.news_history: List[NewsRecord] = []
        
        # Load existing data
        self.load_search_history()
        self.load_news_history()
        
        logger.info(f"[OK] Search and News Memory System initialized")
        logger.info(f"[OK] Loaded {len(self.search_history)} search records")
        logger.info(f"[OK] Loaded {len(self.news_history)} news records")
    
    def store_search_record(self, query: str, results: str, user_context: Dict[str, Any] = None, 
                           analysis_summary: str = "") -> str:
        """
        Store a search query and its results
        
        Args:
            query: The search query
            results: The search results
            user_context: Additional context about the user
            analysis_summary: AI's analysis of the content
            
        Returns:
            search_id: Unique identifier for the search record
        """
        # Generate unique ID
        search_id = self._generate_search_id(query)
        
        # Create search record
        record = SearchRecord(
            search_id=search_id,
            query=query,
            results=results,
            timestamp=datetime.now(),
            user_context=user_context or {},
            analysis_summary=analysis_summary,
            metadata={
                "result_length": len(results),
                "query_length": len(query),
                "session_id": self._get_session_id()
            }
        )
        
        # Store in memory and file
        self.search_history.append(record)
        self.save_search_history()
        
        logger.info(f"[SEARCH] Stored search record: {query[:50]}...")
        return search_id
    
    def store_news_record(self, query: str, results: str, source: str = None, 
                         user_context: Dict[str, Any] = None, analysis_summary: str = "") -> str:
        """
        Store a news query and its results
        
        Args:
            query: The news query
            results: The news results
            source: The news source (if specified)
            user_context: Additional context about the user
            analysis_summary: AI's analysis of the content
            
        Returns:
            news_id: Unique identifier for the news record
        """
        # Generate unique ID
        news_id = self._generate_news_id(query, source)
        
        # Create news record
        record = NewsRecord(
            news_id=news_id,
            query=query,
            source=source,
            results=results,
            timestamp=datetime.now(),
            user_context=user_context or {},
            analysis_summary=analysis_summary,
            metadata={
                "result_length": len(results),
                "query_length": len(query),
                "has_source": source is not None,
                "session_id": self._get_session_id()
            }
        )
        
        # Store in memory and file
        self.news_history.append(record)
        self.save_news_history()
        
        logger.info(f"[NEWS] Stored news record: {query[:50]}...")
        return news_id
    
    def add_follow_up_question(self, record_id: str, question: str, record_type: str = "search"):
        """Add a follow-up question to a record"""
        if record_type == "search":
            for record in self.search_history:
                if record.search_id == record_id:
                    record.follow_up_questions.append(question)
                    self.save_search_history()
                    break
        else:  # news
            for record in self.news_history:
                if record.news_id == record_id:
                    record.follow_up_questions.append(question)
                    self.save_news_history()
                    break
    
    def add_ai_insight(self, record_id: str, insight: str, record_type: str = "search"):
        """Add an AI insight to a record"""
        if record_type == "search":
            for record in self.search_history:
                if record.search_id == record_id:
                    record.ai_insights.append(insight)
                    self.save_search_history()
                    break
        else:  # news
            for record in self.news_history:
                if record.news_id == record_id:
                    record.ai_insights.append(insight)
                    self.save_news_history()
                    break
    
    def get_all_search_history(self, limit: int = None) -> List[SearchRecord]:
        """Get all search history, optionally limited"""
        history = sorted(self.search_history, key=lambda x: x.timestamp, reverse=True)
        return history[:limit] if limit else history
    
    def get_all_news_history(self, limit: int = None) -> List[NewsRecord]:
        """Get all news history, optionally limited"""
        history = sorted(self.news_history, key=lambda x: x.timestamp, reverse=True)
        return history[:limit] if limit else history
    
    def search_history_by_query(self, query_term: str, record_type: str = "both") -> Tuple[List[SearchRecord], List[NewsRecord]]:
        """Search history by query term"""
        query_lower = query_term.lower()
        
        matching_searches = []
        matching_news = []
        
        if record_type in ["search", "both"]:
            matching_searches = [
                record for record in self.search_history
                if query_lower in record.query.lower() or query_lower in record.results.lower()
            ]
        
        if record_type in ["news", "both"]:
            matching_news = [
                record for record in self.news_history
                if query_lower in record.query.lower() or query_lower in record.results.lower()
            ]
        
        return matching_searches, matching_news
    
    def get_recent_activity(self, days: int = 7) -> Dict[str, Any]:
        """Get recent search and news activity"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        recent_searches = [
            record for record in self.search_history
            if record.timestamp > cutoff_date
        ]
        
        recent_news = [
            record for record in self.news_history
            if record.timestamp > cutoff_date
        ]
        
        return {
            "searches": recent_searches,
            "news": recent_news,
            "total_searches": len(recent_searches),
            "total_news": len(recent_news),
            "period_days": days
        }
    
    def generate_history_summary(self, record_type: str = "both", limit: int = 20) -> str:
        """Generate a comprehensive history summary for user"""
        summary_parts = []
        
        if record_type in ["search", "both"]:
            recent_searches = self.get_all_search_history(limit)
            if recent_searches:
                summary_parts.append("**Search History:**")
                for i, record in enumerate(recent_searches, 1):
                    date_str = record.timestamp.strftime("%Y-%m-%d %H:%M")
                    summary_parts.append(f"{i}. {record.query} ({date_str})")
                    if record.follow_up_questions:
                        summary_parts.append(f"   Follow-ups: {'; '.join(record.follow_up_questions[:2])}")
        
        if record_type in ["news", "both"]:
            recent_news = self.get_all_news_history(limit)
            if recent_news:
                summary_parts.append("\n**News History:**")
                for i, record in enumerate(recent_news, 1):
                    date_str = record.timestamp.strftime("%Y-%m-%d %H:%M")
                    source_info = f" from {record.source}" if record.source else ""
                    summary_parts.append(f"{i}. {record.query}{source_info} ({date_str})")
                    if record.follow_up_questions:
                        summary_parts.append(f"   Follow-ups: {'; '.join(record.follow_up_questions[:2])}")
        
        if not summary_parts:
            return "No search or news history found."
        
        return "\n".join(summary_parts)
    
    def find_related_content(self, query: str, limit: int = 5) -> Dict[str, List]:
        """Find content related to a query"""
        query_lower = query.lower()
        query_words = set(query_lower.split())
        
        related_searches = []
        related_news = []
        
        # Score records by relevance
        for record in self.search_history:
            record_words = set(record.query.lower().split())
            overlap = len(query_words.intersection(record_words))
            if overlap > 0:
                related_searches.append((record, overlap))
        
        for record in self.news_history:
            record_words = set(record.query.lower().split())
            overlap = len(query_words.intersection(record_words))
            if overlap > 0:
                related_news.append((record, overlap))
        
        # Sort by relevance and return top results
        related_searches.sort(key=lambda x: x[1], reverse=True)
        related_news.sort(key=lambda x: x[1], reverse=True)
        
        return {
            "searches": [record for record, _ in related_searches[:limit]],
            "news": [record for record, _ in related_news[:limit]]
        }
    
    def _generate_search_id(self, query: str) -> str:
        """Generate unique search ID"""
        timestamp = datetime.now().isoformat()
        content = f"search_{query}_{timestamp}"
        return hashlib.md5(content.encode()).hexdigest()[:12]
    
    def _generate_news_id(self, query: str, source: str = None) -> str:
        """Generate unique news ID"""
        timestamp = datetime.now().isoformat()
        content = f"news_{query}_{source or 'general'}_{timestamp}"
        return hashlib.md5(content.encode()).hexdigest()[:12]
    
    def _get_session_id(self) -> str:
        """Get current session ID"""
        # Simple session ID based on current hour
        return datetime.now().strftime("%Y%m%d_%H")
    
    def save_search_history(self):
        """Save search history to file"""
        try:
            data = {
                "searches": [
                    {
                        "search_id": record.search_id,
                        "query": record.query,
                        "results": record.results,
                        "timestamp": record.timestamp.isoformat(),
                        "user_context": record.user_context,
                        "analysis_summary": record.analysis_summary,
                        "follow_up_questions": record.follow_up_questions,
                        "ai_insights": record.ai_insights,
                        "metadata": record.metadata
                    }
                    for record in self.search_history[-100:]  # Keep last 100 searches
                ],
                "last_updated": datetime.now().isoformat()
            }
            
            with open(self.search_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            logger.error(f"[ERROR] Failed to save search history: {e}")
    
    def save_news_history(self):
        """Save news history to file"""
        try:
            data = {
                "news": [
                    {
                        "news_id": record.news_id,
                        "query": record.query,
                        "source": record.source,
                        "results": record.results,
                        "timestamp": record.timestamp.isoformat(),
                        "user_context": record.user_context,
                        "analysis_summary": record.analysis_summary,
                        "follow_up_questions": record.follow_up_questions,
                        "ai_insights": record.ai_insights,
                        "metadata": record.metadata
                    }
                    for record in self.news_history[-100:]  # Keep last 100 news items
                ],
                "last_updated": datetime.now().isoformat()
            }
            
            with open(self.news_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            logger.error(f"[ERROR] Failed to save news history: {e}")

    def load_search_history(self):
        """Load search history from file"""
        try:
            if os.path.exists(self.search_file):
                with open(self.search_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                # Convert back to SearchRecord objects
                for item in data.get("searches", []):
                    record = SearchRecord(
                        search_id=item["search_id"],
                        query=item["query"],
                        results=item["results"],
                        timestamp=datetime.fromisoformat(item["timestamp"]),
                        user_context=item.get("user_context", {}),
                        analysis_summary=item.get("analysis_summary", ""),
                        follow_up_questions=item.get("follow_up_questions", []),
                        ai_insights=item.get("ai_insights", []),
                        metadata=item.get("metadata", {})
                    )
                    self.search_history.append(record)

        except Exception as e:
            logger.error(f"[ERROR] Failed to load search history: {e}")
            self.search_history = []

    def load_news_history(self):
        """Load news history from file"""
        try:
            if os.path.exists(self.news_file):
                with open(self.news_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                # Convert back to NewsRecord objects
                for item in data.get("news", []):
                    record = NewsRecord(
                        news_id=item["news_id"],
                        query=item["query"],
                        source=item.get("source"),
                        results=item["results"],
                        timestamp=datetime.fromisoformat(item["timestamp"]),
                        user_context=item.get("user_context", {}),
                        analysis_summary=item.get("analysis_summary", ""),
                        follow_up_questions=item.get("follow_up_questions", []),
                        ai_insights=item.get("ai_insights", []),
                        metadata=item.get("metadata", {})
                    )
                    self.news_history.append(record)

        except Exception as e:
            logger.error(f"[ERROR] Failed to load news history: {e}")
            self.news_history = []

    def cleanup_old_records(self, days_old: int = 90):
        """Clean up records older than specified days"""
        cutoff_date = datetime.now() - timedelta(days=days_old)

        # Filter search history
        old_search_count = len(self.search_history)
        self.search_history = [
            record for record in self.search_history
            if record.timestamp > cutoff_date
        ]

        # Filter news history
        old_news_count = len(self.news_history)
        self.news_history = [
            record for record in self.news_history
            if record.timestamp > cutoff_date
        ]

        # Save updated data
        self.save_search_history()
        self.save_news_history()

        search_removed = old_search_count - len(self.search_history)
        news_removed = old_news_count - len(self.news_history)

        logger.info(f"[CLEANUP] Removed {search_removed} old search records and {news_removed} old news records")

    def get_statistics(self) -> Dict[str, Any]:
        """Get memory system statistics"""
        now = datetime.now()

        # Calculate time ranges
        today = [r for r in self.search_history + self.news_history if r.timestamp.date() == now.date()]
        this_week = [r for r in self.search_history + self.news_history if (now - r.timestamp).days <= 7]
        this_month = [r for r in self.search_history + self.news_history if (now - r.timestamp).days <= 30]

        return {
            "total_searches": len(self.search_history),
            "total_news": len(self.news_history),
            "total_records": len(self.search_history) + len(self.news_history),
            "today_activity": len(today),
            "week_activity": len(this_week),
            "month_activity": len(this_month),
            "oldest_search": min([r.timestamp for r in self.search_history], default=now),
            "oldest_news": min([r.timestamp for r in self.news_history], default=now),
            "most_recent_search": max([r.timestamp for r in self.search_history], default=now),
            "most_recent_news": max([r.timestamp for r in self.news_history], default=now)
        }
