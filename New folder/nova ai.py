#!/usr/bin/env python3
"""
🚀 NOVA AI - ENHANCED HUMAN-LIKE AI ASSISTANT
=============================================

A sophisticated AI chatbot with advanced features for natural conversation,
performance optimization, and specialized knowledge.

🌟 ENHANCED FEATURES:
  • 💾 Smart Response Caching - Faster responses for common queries
  • 📊 Real-time Performance Monitoring - Track response times and optimize
  • 🧠 Enhanced Context Understanding - Intent analysis and conversation flow
  • 📚 Specialized Knowledge System - Domain expertise in tech, science, business, health
  • 📰 Integrated News System - Real-time news summaries from trusted sources
  • 🎤 Voice Input Support - Natural speech interaction with Whisper
  • ⚡ Performance Optimization - Multiple models and intelligent fallbacks
  • 🤖 Interactive Commands - Rich command system for system control

🚀 QUICK START:
  python nova_ai.py                    # Basic chat mode
  python nova_ai.py --enable-all       # All enhanced features
  python nova_ai.py --voice            # Voice input mode
  python nova_ai.py --performance-mode # Performance optimized
  python nova_ai.py --test             # Test all features

💬 ENHANCED COMMANDS:
  help        - Show comprehensive help
  status      - System status and performance
  features    - Show enhanced features
  performance - Detailed performance report
  toggle <feature> - Enable/disable features
  clear cache - Clear all caches
  query <text> - Direct knowledge query
  
📰 NEWS COMMANDS:
  news about <topic> - Get news summary about specific topic
  what's happening in <location> - Get location-based news
  latest news - Get general news summary
  news from <source> - Get news from specific sources

🔧 TECHNICAL FEATURES:
  • Intelligent caching with LRU eviction
  • Multi-model fallback (llama3-70b → llama3-8b → original)
  • Context-aware response generation
  • Memory optimization and garbage collection
  • Real-time performance metrics
  • Advanced error handling and recovery

Author: Enhanced AI Development Team
Version: 3.0 Enhanced Edition
License: MIT
"""

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
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Union, Any, Deque, Callable
from collections import deque, defaultdict, Counter
from dataclasses import dataclass, field
import threading
import hashlib
import sqlite3
import pickle
import requests
from dotenv import load_dotenv
try:
    import numpy as np
except ImportError:
    np = None  # Optional dependency
try:
    import psutil
except ImportError:
    psutil = None  # Optional dependency
import weakref
import gc
import uuid
from enum import Enum
# NovaSearch will be integrated directly below

# Load environment variables
load_dotenv()

# Get API keys
SERPAPI_KEY = os.getenv("SERPAPI_KEY")
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")

# Import news system
try:
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from services.news_summary import NewsSummarySystem
except ImportError:
    print("Warning: News system not available. Install required dependencies.")
    NewsSummarySystem = None

# ============================================================================
# INTEGRATED NOVA SEARCH CLASS
# ============================================================================

class NovaSearch:
    """All-in-one search system that automatically searches and answers questions."""
    
    def __init__(self):
        """Initialize the Nova Search system."""
        self.api_key = SERPAPI_KEY
        self.base_url = "https://serpapi.com/search"
        self.last_results = None
        self.num_results = 5
        self.format_style = "smart"  # Smart format adapts to the query type
    
    def search(self, query: str, summarize: Optional[bool] = False, target_site: Optional[str] = None) -> Dict[str, Any]:
        """
        Automatically search for anything the user asks about.
        
        Args:
            query: The user's question or search query
            summarize: Whether to summarize the answer (True/False/None)
            target_site: Specific site to search (e.g., "wikipedia", "reddit", "youtube")
            
        Returns:
            Dictionary with search results and answer
        """
        if not self.api_key:
            return {
                "query": query,
                "search_type": "error",
                "results": [],
                "answer": "Search functionality is not available. Please set SERPAPI_KEY in your .env file.",
                "raw_results": {"error": "No API key"}
            }
        
        # Handle targeted site searches
        if target_site:
            print(f"\nSearching for: {query} on {target_site}")
            query = self._format_site_search(query, target_site)
        else:
            print(f"\nSearching for: {query}")

        # Determine search type based on query
        search_type, params = self._analyze_query(query)

        # Perform the search
        results = self._execute_search(query, search_type, params)

        # Process and enhance the results
        processed_results = self._process_results(results, search_type)

        # Generate a natural language answer
        answer = self._generate_answer(processed_results, query, search_type, summarize=summarize)

        # Store results for later reference
        self.last_results = {
            "query": query,
            "search_type": search_type,
            "results": processed_results,
            "answer": answer,
            "raw_results": results
        }

        return self.last_results
    
    def _analyze_query(self, query: str) -> tuple:
        """
        Analyze the query to determine the best search approach.
        
        Args:
            query: The user's question or search query
            
        Returns:
            Tuple of (search_type, params)
        """
        query_lower = query.lower()
        params = {"num": self.num_results}
        
        # Check for summarization intent
        if re.search(r'(summarize|brief|short|quick|concise|tldr|in (a )?few (words|sentences))', query_lower):
            params["ultra_concise"] = True
            # Remove these words from the query for better search results
            clean_query = re.sub(r'(summarize|brief|short|quick|concise|tldr|in (a )?few (words|sentences))', '', query_lower)
            query_lower = clean_query.strip()
        
        # Check for image search intent
        if re.search(r'(image|picture|photo|show me|what does .* look like)', query_lower):
            return "images", params
        
        # Check for news intent or current information requests
        if re.search(r'(news|latest|recent|current event|what happened|update on)', query_lower):
            params["time_period"] = "past_week"
            return "news", params
        
        # Check for current year information requests
        current_year = 2025
        
        # Enhanced patterns for current/new product detection
        current_keywords = r'(current|latest|newest|new|upcoming|coming out|release|launch|announce|2025|this year|now|today|recent)'
        product_keywords = r'(iphone|ipad|macbook|samsung|google|tesla|car|phone|laptop|computer|device|product)'
        
        # Check for explicit current information requests
        if re.search(current_keywords, query_lower):
            # Add current year to search query if not already present
            if str(current_year) not in query:
                query = f"{query} {current_year}"
            params["enhanced_query"] = query
            params["time_period"] = "past_month"  # Prefer very recent results
        
        # Check for product-specific queries that need current info
        elif re.search(rf'(new|latest|best|top|price|cost|specs|features).*{product_keywords}', query_lower) or \
             re.search(rf'{product_keywords}.*(new|latest|coming out|release|launch|2025)', query_lower):
            # Product queries automatically get current year bias
            if str(current_year) not in query:
                query = f"{query} {current_year}"
            params["enhanced_query"] = query
            params["time_period"] = "past_month"  # Prefer very recent results for products
        
        # DEFAULT: Always bias towards current year unless specifically asking for historical info
        elif not re.search(r'(history|historical|past|before|old|vintage|classic|traditional|ancient|was|were|used to|originally|first|early|began|started)', query_lower):
            # Add current year bias for better relevance
            if str(current_year) not in query:
                query = f"{query} {current_year}"
            params["enhanced_query"] = query
            params["time_period"] = "past_year"  # Prefer recent results by default
        
        # Check for time-based intent
        time_match = re.search(r'(recent|latest|past|last) (day|week|month|year)', query_lower)
        if time_match:
            params["time_period"] = f"past_{time_match.group(2)}"
        
        # Check for site-specific intent
        site_match = re.search(r'(on|in|at|from) ([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', query_lower)
        if site_match:
            params["site"] = site_match.group(2)
        
        # Check for definition/explanation intent
        if re.search(r'^(what is|who is|define|explain|tell me about)', query_lower):
            params["include_knowledge_graph"] = True
        
        # Default to web search
        return "web", params
    
    def _format_site_search(self, query: str, target_site: str) -> str:
        """
        Format a query for site-specific search.
        
        Args:
            query: The original search query
            target_site: The target site to search
            
        Returns:
            Formatted search query
        """
        # Map common site names to their actual domains
        site_mapping = {
            "wikipedia": "site:wikipedia.org",
            "reddit": "site:reddit.com",
            "youtube": "site:youtube.com",
            "twitter": "site:twitter.com",
            "github": "site:github.com",
            "stackoverflow": "site:stackoverflow.com",
            "quora": "site:quora.com",
            "medium": "site:medium.com",
            "linkedin": "site:linkedin.com",
            "facebook": "site:facebook.com",
            "instagram": "site:instagram.com",
            "tiktok": "site:tiktok.com",
            "amazon": "site:amazon.com",
            "ebay": "site:ebay.com",
            "news": "site:news.google.com OR site:bbc.com OR site:cnn.com OR site:reuters.com",
            "academic": "site:scholar.google.com OR site:researchgate.net OR site:arxiv.org",
            "tech": "site:techcrunch.com OR site:wired.com OR site:theverge.com",
            "finance": "site:bloomberg.com OR site:reuters.com OR site:marketwatch.com"
        }
        
        target_lower = target_site.lower()
        
        # Check if it's a mapped site
        if target_lower in site_mapping:
            return f"{site_mapping[target_lower]} {query}"
        
        # If it looks like a domain, use it directly
        if "." in target_site:
            return f"site:{target_site} {query}"
        
        # Otherwise, treat it as a general site search
        return f"site:{target_site}.com {query}"
    
    def _execute_search(self, query: str, search_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the search using SerpAPI.
        
        Args:
            query: The search query
            search_type: Type of search to perform
            params: Additional search parameters
            
        Returns:
            Raw search results from API
        """
        # Build the search query
        search_query = params.get("enhanced_query", query)
        if "site" in params:
            search_query = f"site:{params['site']} {search_query}"
        
        # Set up API parameters
        api_params = {
            "q": search_query,
            "api_key": self.api_key,
            "engine": "google",
            "num": params.get("num", 5)
        }
        
        # Add time period filter if specified
        if "time_period" in params:
            if params["time_period"] == "past_day":
                api_params["tbs"] = "qdr:d"
            elif params["time_period"] == "past_week":
                api_params["tbs"] = "qdr:w"
            elif params["time_period"] == "past_month":
                api_params["tbs"] = "qdr:m"
            elif params["time_period"] == "past_year":
                api_params["tbs"] = "qdr:y"
        
        # Set search type
        if search_type == "images":
            api_params["tbm"] = "isch"
        elif search_type == "news":
            api_params["tbm"] = "nws"
        
        try:
            # Execute the search
            response = requests.get(self.base_url, params=api_params)
            response.raise_for_status()
            result = response.json()
            
            # Add ultra_concise flag if it was in the params
            if params.get("ultra_concise"):
                result["ultra_concise"] = True
                
            return result
        except Exception as e:
            print(f"Search error: {str(e)}")
            return {"error": str(e)}
    
    def _process_results(self, results: Dict[str, Any], search_type: str) -> List[Dict[str, Any]]:
        """
        Process and enhance the search results.
        
        Args:
            results: Raw search results from API
            search_type: Type of search performed
            
        Returns:
            List of processed search results
        """
        processed = []
        
        # Check for errors
        if "error" in results:
            return [{"type": "error", "message": results["error"]}]
        
        # Check if ultra_concise mode was requested
        ultra_concise = results.get("ultra_concise", False)
        if ultra_concise:
            # Add this as a special result to signal the answer generator
            processed.append({"type": "meta", "ultra_concise": True})
        
        # Process knowledge graph if available
        if "knowledge_graph" in results:
            kg = results["knowledge_graph"]
            processed.append({
                "type": "knowledge_graph",
                "title": kg.get("title", ""),
                "description": kg.get("description", ""),
                "attributes": kg.get("attributes", {}),
                "source": kg.get("source", {}).get("link", ""),
                "relevance": 10  # Knowledge graph is highly relevant
            })
        
        # Process answer box if available
        if "answer_box" in results:
            ab = results["answer_box"]
            processed.append({
                "type": "answer_box",
                "title": ab.get("title", ""),
                "answer": ab.get("answer", ab.get("snippet", "")),
                "source": ab.get("link", ""),
                "relevance": 9  # Answer box is highly relevant
            })
        
        # Process organic web results
        if search_type == "web" and "organic_results" in results:
            for result in results["organic_results"]:
                processed.append({
                    "type": "web_result",
                    "title": result.get("title", ""),
                    "snippet": result.get("snippet", ""),
                    "link": result.get("link", ""),
                    "position": result.get("position", 0),
                    "relevance": 8 - (result.get("position", 0) * 0.1)  # Higher positions are more relevant
                })
        
        # Process image results
        elif search_type == "images" and "images_results" in results:
            for result in results["images_results"]:
                processed.append({
                    "type": "image_result",
                    "title": result.get("title", ""),
                    "thumbnail": result.get("thumbnail", ""),
                    "original": result.get("original", ""),
                    "source": result.get("source", ""),
                    "link": result.get("link", ""),
                    "relevance": 5
                })
        
        # Process news results
        elif search_type == "news" and "news_results" in results:
            for result in results["news_results"]:
                processed.append({
                    "type": "news_result",
                    "title": result.get("title", ""),
                    "snippet": result.get("snippet", ""),
                    "link": result.get("link", ""),
                    "source": result.get("source", ""),
                    "date": result.get("date", ""),
                    "relevance": 6
                })
        
        # Sort by relevance
        processed.sort(key=lambda x: x.get("relevance", 0), reverse=True)
        return processed
    
    def _generate_answer(self, results: List[Dict[str, Any]], query: str, search_type: str, summarize: Optional[bool] = None) -> str:
        """
        Generate a natural, well-written summary or full details from all search results,
        with no links and improved detail.
        """
        if not results:
            return f"No information found about '{query}'."

        if results[0].get("type") == "error":
            return f"Search error: {results[0].get('message')}"

        # Use knowledge graph or answer box if present
        kg_result = next((r for r in results if r.get("type") == "knowledge_graph"), None)
        ab_result = next((r for r in results if r.get("type") == "answer_box"), None)
        web_results = [r for r in results if r.get("type") == "web_result"]
        news_results = [r for r in results if r.get("type") == "news_result"]

        # If user specifically requested a summary
        if summarize is True:
            # Generate a concise summary
            summary_parts = []
            if kg_result:
                summary_parts.append(kg_result.get("description", ""))
                if kg_result.get("attributes"):
                    for key, value in kg_result["attributes"].items():
                        summary_parts.append(f"{key}: {value}")
            if ab_result:
                summary_parts.append(ab_result.get("answer", ab_result.get("snippet", "")))
            snippets = []
            for r in (web_results + news_results):
                snippet = r.get("snippet", "")
                if snippet and snippet not in snippets:
                    snippets.append(snippet)
                if len(snippets) >= 3:  # Limit for summary
                    break
            # Combine all into a concise summary
            all_text = " ".join(summary_parts + snippets)
            if not all_text.strip():
                return f"No good summary found for '{query}'."
            # Remove duplicate sentences and links
            sentences = []
            seen = set()
            for s in re.split(r'(?<=[.!?])\s+', all_text):
                s_clean = s.strip()
                # Remove anything that looks like a URL
                s_clean = re.sub(r'https?://\S+', '', s_clean)
                if s_clean and s_clean not in seen:
                    sentences.append(s_clean)
                    seen.add(s_clean)
            summary = " ".join(sentences[:3])  # Limit to 3 sentences for summary
            summary += "\n\n_Sources: Google Search, top web results._"
            return summary

        # Default behavior: Show full details (no summary unless requested)
        details = []
        if kg_result:
            details.append(f"{kg_result.get('title','')}. {kg_result.get('description','')}")
            if kg_result.get("attributes"):
                for key, value in kg_result["attributes"].items():
                    details.append(f"{key}: {value}")
        if ab_result:
            details.append(f"{ab_result.get('title','')}. {ab_result.get('answer', ab_result.get('snippet',''))}")
        for r in (web_results + news_results):
            # Show full title and snippet for each result
            if r.get('title','') or r.get('snippet',''):
                result_text = f"{r.get('title','')}. {r.get('snippet','')}"
                if r.get('date',''):
                    result_text += f" ({r.get('date','')})"
                details.append(result_text)
        
        # Join all details into comprehensive information
        if not details:
            return f"No detailed information found for '{query}'."
        
        full_info = "\n\n".join([d for d in details if d.strip()])
        full_info += "\n\n_Sources: Google Search, comprehensive web results._"
        return full_info

# ============================================================================
# END OF NOVA SEARCH INTEGRATION
# ============================================================================

# Configure logging - less verbose for terminal
logging.basicConfig(
    level=logging.WARNING,  # Only show warnings and errors in terminal
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("alebot.log"),
        logging.StreamHandler()
    ]
)

# Create a separate logger for file-only detailed logs
file_logger = logging.getLogger("AleChatBot.Detailed")
file_logger.setLevel(logging.DEBUG)
file_handler = logging.FileHandler("alebot_detailed.log")
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
file_logger.addHandler(file_handler)
file_logger.propagate = False

# Suppress verbose HTTP logging
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logger = logging.getLogger("AleChatBot")

# Enhanced AI System Data Structures
@dataclass
class ResponseMetrics:
    """Track response performance metrics"""
    response_time: float
    token_count: int
    model_used: str
    timestamp: datetime
    user_satisfaction: Optional[float] = None
    memory_usage: Optional[float] = None

@dataclass
class ContextEntity:
    """Represents a contextual entity"""
    text: str
    entity_type: str
    confidence: float
    first_mentioned: datetime
    last_mentioned: datetime
    mention_count: int
    relevance_score: float

@dataclass
class ConversationIntent:
    """Represents user intent in conversation"""
    intent_type: str
    confidence: float
    parameters: Dict[str, Any]
    context_window: List[str]
    timestamp: datetime

@dataclass
class KnowledgeNode:
    """Represents a piece of knowledge"""
    id: str
    content: str
    domain: str
    knowledge_type: str  # fact, procedure, concept, rule
    confidence: float
    sources: List[str] = field(default_factory=list)
    related_nodes: Set[str] = field(default_factory=set)
    last_updated: datetime = field(default_factory=datetime.now)
    access_count: int = 0
    validation_status: str = "unvalidated"  # unvalidated, validated, disputed
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ExpertDomain:
    """Represents a domain of expertise"""
    name: str
    description: str
    knowledge_nodes: Set[str] = field(default_factory=set)
    expertise_level: float = 0.0
    specialized_vocabulary: Set[str] = field(default_factory=set)
    reasoning_patterns: List[str] = field(default_factory=list)
    validation_rules: List[str] = field(default_factory=list)

class MemoryType(Enum):
    """Types of memories that can be stored"""
    USER_PREFERENCE = "user_preference"
    FACT = "fact"
    CONVERSATION_SUMMARY = "conversation_summary"
    PROJECT_CONTEXT = "project_context"
    TASK_HISTORY = "task_history"
    LEARNING = "learning"
    EMOTIONAL_STATE = "emotional_state"
    EXPERTISE = "expertise"

@dataclass
class MemorySchema:
    """Structured schema for organizing memories"""
    memory_id: str
    user_id: str
    content: str
    memory_type: MemoryType
    topic: Optional[str] = None
    project: Optional[str] = None
    importance_score: float = 0.5
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    last_accessed: datetime = field(default_factory=datetime.now)
    access_count: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


class Mem0AI:
    """
    Advanced Mem0.ai integration with RAG-like architecture for long-term memory management
    """
    
    def __init__(self, user_id: str = "nova_user"):
        """Initialize Mem0.ai client with the latest output format.
        
        Args:
            user_id: Unique identifier for the user
        """
        self.user_id = user_id
        self.memory_schemas = {}  # Store memory schemas for better organization
        self.cache_lock = threading.Lock()
        self.local_cache = {}  # Local memory cache
        
        # Load config
        config_file = os.path.join(os.path.dirname(__file__), '..', 'config', 'config.json')
        try:
            with open(config_file) as f:
                config = json.load(f)
                mem0_config = config.get('memory', {}).get('mem0_ai', {})
                
                # Set configuration values - OPTIMIZED FOR SPEED
                self.cache_timeout = mem0_config.get('cache_timeout', 600)  # 10 minutes (longer cache)
                self.batch_size = mem0_config.get('batch_size', 1)  # Process immediately, no batching delay
                self.batch_timeout = mem0_config.get('batch_timeout', 1)  # Flush immediately
                self.max_cache_size = mem0_config.get('max_cache_size', 500)  # Smaller cache for speed
                self.retry_attempts = mem0_config.get('retry_attempts', 2)  # Fewer retries
                self.retry_delay = mem0_config.get('retry_delay', 0.5)  # Faster retries
                
                # Get API key
                mem0_api_key = mem0_config.get('api_key') or os.getenv('MEM0_API_KEY')
                if not mem0_api_key:
                    mem0_api_key = "m0-GOeUOLXjNgYMVqIyyLv0sFLZn0wDHnE3uAJXJsQ6"
        except Exception as e:
            logger.warning(f"Failed to load config, using defaults: {e}")
            self.cache_timeout = 300
            self.batch_size = 3
            self.batch_timeout = 5
            self.max_cache_size = 1000
            self.retry_attempts = 3
            self.retry_delay = 1
            mem0_api_key = "m0-GOeUOLXjNgYMVqIyyLv0sFLZn0wDHnE3uAJXJsQ6"
        
        self.batch_queue = []  # Queue for batch processing
        self.last_batch_time = datetime.now()
        
        # Initialize the client with retry mechanism
        try:
            from mem0 import MemoryClient
            
            for attempt in range(self.retry_attempts):
                try:
                    self.client = MemoryClient(api_key=mem0_api_key)
                    # Test the connection
                    self.client.get_all(user_id=self.user_id)
                    logger.info("Successfully initialized Mem0.ai client")
                    break
                except Exception as e:
                    if attempt == self.retry_attempts - 1:
                        raise RuntimeError(f"Failed to initialize Mem0.ai client after {self.retry_attempts} attempts: {e}")
                    logger.warning(f"Attempt {attempt + 1} failed, retrying in {self.retry_delay}s...")
                    time.sleep(self.retry_delay * (2 ** attempt))  # Exponential backoff
            
            # Start background tasks first (non-blocking)
            self._start_background_tasks()
            
            # Load existing memories in background (non-blocking)
            threading.Thread(target=self._load_existing_memories_async, daemon=True).start()
            
        except ImportError:
            raise ImportError("Failed to import mem0 package. Please install it with: pip install mem0")
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Mem0.ai: {e}")
    
    def _load_existing_memories_async(self):
        """Load existing memories from Mem0.ai into local cache asynchronously."""
        try:
            logger.info("Loading memories in background...")
            self._load_existing_memories()
            logger.info("Background memory loading completed")
        except Exception as e:
            logger.warning(f"Background memory loading failed: {e}")
    
    def _load_existing_memories(self):
        """Load existing memories from Mem0.ai into local cache."""
        try:
            # Get all memories with retry mechanism
            max_retries = 3
            retry_delay = 1
            memories = None
            
            for attempt in range(max_retries):
                try:
                    memories = self.client.get_all(user_id=self.user_id)
                    break
                except Exception as e:
                    if attempt == max_retries - 1:
                        logger.error(f"Failed to load memories after {max_retries} attempts: {e}")
                        return
                    time.sleep(retry_delay)
                    retry_delay *= 2
            
            if not memories:
                logger.info("No existing memories found")
                return
            
            # Process and cache memories
            loaded_count = 0
            for memory in memories:
                try:
                    memory_id = memory.get('id')
                    if not memory_id:
                        continue
                    
                    memory_content = memory.get('memory', '')
                    memory_metadata = memory.get('metadata', {})
                    
                    # Create schema
                    schema = MemorySchema(
                        memory_id=memory_id,
                        user_id=self.user_id,
                        content=memory_content,
                        memory_type=MemoryType(memory_metadata.get('memory_type', 'FACT')),
                        topic=memory_metadata.get('topic'),
                        project=memory_metadata.get('project'),
                        importance_score=memory_metadata.get('importance_score', 0.5),
                        tags=memory_metadata.get('tags', []),
                        metadata=memory_metadata
                    )
                    
                    # Store in cache with lock
                    with self.cache_lock:
                        self.memory_schemas[memory_id] = schema
                        self.local_cache[memory_id] = {
                            'data': memory,
                            'last_accessed': datetime.now()
                        }
                    loaded_count += 1
                    
                except Exception as e:
                    logger.debug(f"Error processing memory {memory.get('id')}: {e}")
                    continue
            
            logger.info(f"Successfully loaded {loaded_count} memories into cache")
            
        except Exception as e:
            logger.error(f"Error loading existing memories: {e}")
            # Continue with empty cache rather than failing completely
            
    def _start_background_tasks(self):
        """Start background tasks for maintenance"""
        def cleanup_task():
            while True:
                try:
                    self._cleanup_cache()
                    self._process_batch_queue()
                    time.sleep(60)  # Run every 60 seconds (less frequent)
                except Exception as e:
                    logger.error(f"Background task error: {e}")
                    time.sleep(10)  # Longer delay before retrying
        
        thread = threading.Thread(target=cleanup_task, daemon=True)
        thread.start()
        logger.info("Started background maintenance tasks")
    
    def _cleanup_cache(self):
        """Clean up expired cache entries and manage cache size"""
        now = datetime.now()
        with self.cache_lock:
            # Remove expired entries
            expired = []
            for key, value in self.local_cache.items():
                if (now - value['last_accessed']).total_seconds() > self.cache_timeout:
                    expired.append(key)
            for key in expired:
                del self.local_cache[key]
                if key in self.memory_schemas:
                    del self.memory_schemas[key]
            
            # Check if we're over the max cache size
            if len(self.local_cache) > self.max_cache_size:
                # Sort by last accessed time and remove oldest entries
                sorted_cache = sorted(
                    self.local_cache.items(),
                    key=lambda x: x[1]['last_accessed']
                )
                
                # Keep only the most recently accessed entries
                to_remove = sorted_cache[:(len(self.local_cache) - self.max_cache_size)]
                for key, _ in to_remove:
                    del self.local_cache[key]
                    if key in self.memory_schemas:
                        del self.memory_schemas[key]
                
                logger.info(f"Cleaned up {len(to_remove)} entries to maintain cache size limit")
            
            if expired:
                logger.info(f"Cleaned up {len(expired)} expired cache entries")
    
    def _process_batch_queue(self):
        """Process queued memory operations in batch"""
        now = datetime.now()
        if not self.batch_queue:
            return
            
        if len(self.batch_queue) >= self.batch_size or \
           (now - self.last_batch_time).total_seconds() > self.batch_timeout:
            try:
                # Process batch items individually since add_batch is not available
                processed = 0
                failed = 0
                batch = self.batch_queue[:self.batch_size]
                
                for memory in batch:
                    try:
                        # Use the standard add method instead of add_batch
                        self.client.add(
                            messages=memory['messages'],
                            user_id=memory['user_id'],
                            metadata=memory['metadata']
                        )
                        processed += 1
                    except Exception as e:
                        logger.error(f"Failed to process memory in batch: {e}")
                        failed += 1
                        continue
                
                # Remove processed items from queue
                self.batch_queue = self.batch_queue[self.batch_size:]
                self.last_batch_time = now
                
                if processed > 0:
                    logger.info(f"Batch processed {processed} memories (failed: {failed})")
                
            except Exception as e:
                logger.error(f"Batch processing error: {e}")
                # Don't clear queue on error to allow retry
                time.sleep(1)  # Add small delay before retry

    def store_memory(self, content: str, memory_type: MemoryType = MemoryType.FACT, 
                    topic: Optional[str] = None, project: Optional[str] = None,
                    importance_score: float = 0.5, tags: Optional[List[str]] = None,
                    metadata: Optional[Dict[str, Any]] = None) -> str:
        """Store a memory with optimized processing"""
        try:
            memory_metadata = {
                "memory_type": memory_type.value,
                "topic": topic,
                "project": project,
                "importance_score": importance_score,
                "tags": tags or [],
                "created_at": datetime.now().isoformat(),
                "user_id": self.user_id,
                **(metadata or {})
            }
            
            messages = [{"role": "user", "content": content}]
            memory_id = str(uuid.uuid4())
            
            # For chat responses, process immediately instead of batching
            if memory_type == MemoryType.CONVERSATION_SUMMARY:
                try:
                    self.client.add(
                        messages=messages,
                        user_id=self.user_id,
                        metadata=memory_metadata
                    )
                except Exception as e:
                    logger.error(f"Failed to store conversation memory: {e}")
            else:
                # Use batch queue for non-conversation memories
                self.batch_queue.append({
                    "messages": messages,
                    "user_id": self.user_id,
                    "metadata": memory_metadata,
                    "id": memory_id
                })
            
            # Cache locally
            with self.cache_lock:
                self.memory_schemas[memory_id] = MemorySchema(
                    memory_id=memory_id,
                    user_id=self.user_id,
                    content=content,
                    memory_type=memory_type,
                    topic=topic,
                    project=project,
                    importance_score=importance_score,
                    tags=tags or [],
                    metadata=memory_metadata
                )
                self.local_cache[memory_id] = {
                    'data': {
                        'memory': content,
                        'metadata': memory_metadata,
                        'id': memory_id
                    },
                    'last_accessed': datetime.now()
                }
            
            return memory_id
            
        except Exception as e:
            logger.error(f"Failed to store memory: {e}")
            return str(uuid.uuid4())  # Return temporary ID on failure

    def retrieve_memories(self, query: str, limit: int = 3, 
                         memory_type: Optional[MemoryType] = None,
                         topic: Optional[str] = None, project: Optional[str] = None,
                         min_importance: float = 0.0) -> List[Dict[str, Any]]:
        """Retrieve memories with optimized caching"""
        try:
            # Check cache first
            cache_key = f"{query}:{limit}:{memory_type}:{topic}:{project}:{min_importance}"
            with self.cache_lock:
                if cache_key in self.local_cache:
                    cache_entry = self.local_cache[cache_key]
                    if (datetime.now() - cache_entry['last_accessed']).total_seconds() <= self.cache_timeout:
                        return cache_entry['data']
            
            # Search in Mem0
            memories = self.client.search(
                query=query,
                user_id=self.user_id,
                limit=limit * 2  # Get more to allow for filtering
            )
            
            if not memories:
                return []
            
            # Process and filter memories
            processed_memories = []
            for memory in memories:
                try:
                    memory_content = memory.get('memory', '')
                    memory_metadata = memory.get('metadata', {})
                    memory_id = memory.get('id', str(uuid.uuid4()))
                    score = memory.get('score', 0.5)
                    
                    # Apply filters
                    if memory_type and memory_metadata.get('memory_type') != memory_type.value:
                        continue
                    if topic and memory_metadata.get('topic') != topic:
                        continue
                    if project and memory_metadata.get('project') != project:
                        continue
                    if memory_metadata.get('importance_score', 0.5) < min_importance:
                        continue
                    
                    processed_memory = {
                        'id': memory_id,
                        'content': memory_content,
                        'metadata': memory_metadata,
                        'relevance_score': score,
                        'memory_type': memory_metadata.get('memory_type', 'unknown'),
                        'topic': memory_metadata.get('topic'),
                        'project': memory_metadata.get('project'),
                        'importance_score': memory_metadata.get('importance_score', 0.5),
                        'tags': memory_metadata.get('tags', [])
                    }
                    
                    processed_memories.append(processed_memory)
                    
                except Exception as memory_error:
                    logger.debug(f"Error processing memory: {memory_error}")
                    continue
            
            # Sort by combined score
            processed_memories.sort(
                key=lambda x: (x['relevance_score'] * 0.7 + x['importance_score'] * 0.3),
                reverse=True
            )
            
            result = processed_memories[:limit]
            
            # Cache the result
            with self.cache_lock:
                self.local_cache[cache_key] = {
                    'data': result,
                    'last_accessed': datetime.now()
                }
            
            # Update access stats
            for memory in result:
                memory_id = memory['id']
                if memory_id in self.memory_schemas:
                    self.memory_schemas[memory_id].last_accessed = datetime.now()
                    self.memory_schemas[memory_id].access_count += 1
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to retrieve memories: {e}")
            return []

    def get_contextual_memories(self, current_message: str, conversation_history: List[Dict[str, str]] = None) -> str:
        """Get contextual memories with optimized retrieval"""
        try:
            # Get most relevant memories
            memories = self.retrieve_memories(
                query=current_message,
                limit=3,  # Reduced for speed
                min_importance=0.3
            )
            
            if not memories:
                return ""
            
            # Format memories for context
            context_parts = []
            for memory in memories:
                content = memory['content']
                score = memory['relevance_score']
                if score >= 0.6:  # Only include highly relevant memories
                    context_parts.append(content)
            
            return " ".join(context_parts)
            
        except Exception as e:
            logger.error(f"Error getting contextual memories: {e}")
            return ""
    
    def store_conversation_summary(self, conversation_snippet: str, topics: List[str] = None,
                                 project: Optional[str] = None) -> str:
        """Store a conversation summary for future reference"""
        return self.store_memory(
            content=f"Conversation summary: {conversation_snippet}",
            memory_type=MemoryType.CONVERSATION_SUMMARY,
            topic=topics[0] if topics else None,
            project=project,
            importance_score=0.6,
            tags=topics or [],
            metadata={"conversation_summary": True}
        )
    
    def store_user_preference(self, preference: str, category: str = "general") -> str:
        """Store a user preference"""
        return self.store_memory(
            content=f"User preference: {preference}",
            memory_type=MemoryType.USER_PREFERENCE,
            topic=category,
            importance_score=0.8,
            tags=["preference", category],
            metadata={"preference_category": category}
        )
    
    def store_project_context(self, project_name: str, context: str, tags: List[str] = None) -> str:
        """Store project-specific context"""
        return self.store_memory(
            content=context,
            memory_type=MemoryType.PROJECT_CONTEXT,
            project=project_name,
            importance_score=0.7,
            tags=(tags or []) + ["project", project_name],
            metadata={"project_name": project_name}
        )
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """Get statistics about stored memories"""
        try:
            all_memories = self.client.get_all(user_id=self.user_id)
            memory_count = len(all_memories) if all_memories else 0
            
            # Analyze memory types from cache
            type_counts = {}
            topic_counts = {}
            
            for schema in self.memory_schemas.values():
                memory_type = schema.memory_type.value
                type_counts[memory_type] = type_counts.get(memory_type, 0) + 1
                
                if schema.topic:
                    topic_counts[schema.topic] = topic_counts.get(schema.topic, 0) + 1
            
            return {
                "total_memories": memory_count,
                "memory_types": type_counts,
                "topics": topic_counts,
                "cached_schemas": len(self.memory_schemas)
            }
            
        except Exception as e:
            logger.error(f"Failed to get memory stats: {e}")
            return {"error": str(e)}
    
    def clear_memories(self, memory_type: Optional[MemoryType] = None, 
                      project: Optional[str] = None) -> bool:
        """Clear memories based on filters"""
        try:
            # For now, implement basic clearing
            # In a production system, you'd want more sophisticated filtering
            if not memory_type and not project:
                # Clear all memories for user
                all_memories = self.client.get_all(user_id=self.user_id)
                if all_memories:
                    for memory in all_memories:
                        if isinstance(memory, dict) and 'id' in memory:
                            self.client.delete(memory['id'])
                
                # Clear local cache
                with self.cache_lock:
                    self.memory_schemas.clear()
                    self.local_cache.clear()
                
                return True
            
            # Selective clearing would require more advanced filtering
            logger.warning("Selective memory clearing not fully implemented")
            return False
            
        except Exception as e:
            logger.error(f"Failed to clear memories: {e}")
            return False


class SmartCacheSystem:
    """
    Intelligent caching system for common queries and responses
    """
    def __init__(self, max_cache_size: int = 1000):
        self.response_cache = {}
        self.access_frequency = {}
        self.last_access = {}
        self.max_cache_size = max_cache_size
        self.cache_lock = threading.Lock()
        
    def _generate_cache_key(self, messages: List[Dict]) -> str:
        """Generate a unique cache key for messages"""
        # Use last 3 messages for context-aware caching
        recent_messages = messages[-3:] if len(messages) > 3 else messages
        key_data = [f"{msg['role']}:{msg['content'][:100]}" for msg in recent_messages]
        return str(hash("|".join(key_data)))
    
    def get_cached_response(self, messages: List[Dict]) -> Optional[str]:
        """Get cached response if available"""
        cache_key = self._generate_cache_key(messages)
        
        with self.cache_lock:
            if cache_key in self.response_cache:
                # Update access statistics
                self.access_frequency[cache_key] = self.access_frequency.get(cache_key, 0) + 1
                self.last_access[cache_key] = datetime.now()
                
                logger.debug(f"Cache hit for key: {cache_key}")
                return self.response_cache[cache_key]
        
        return None
    
    def cache_response(self, messages: List[Dict], response: str):
        """Cache a response for future use"""
        cache_key = self._generate_cache_key(messages)
        
        with self.cache_lock:
            # If cache is full, remove least recently used items
            if len(self.response_cache) >= self.max_cache_size:
                self._cleanup_cache()
            
            self.response_cache[cache_key] = response
            self.access_frequency[cache_key] = 1
            self.last_access[cache_key] = datetime.now()
            
            logger.debug(f"Cached response for key: {cache_key}")
    
    def _cleanup_cache(self):
        """Remove least recently used cache entries"""
        # Sort by access frequency and recency
        sorted_keys = sorted(
            self.response_cache.keys(),
            key=lambda k: (
                self.access_frequency.get(k, 0),
                self.last_access.get(k, datetime.min)
            )
        )
        
        # Remove bottom 25% of entries
        keys_to_remove = sorted_keys[:len(sorted_keys) // 4]
        
        for key in keys_to_remove:
            self.response_cache.pop(key, None)
            self.access_frequency.pop(key, None)
            self.last_access.pop(key, None)

class PerformanceMonitor:
    """
    Real-time performance monitoring and optimization
    """
    def __init__(self):
        self.metrics_history = deque(maxlen=1000)
        self.current_load = 0.0
        self.optimization_suggestions = []
        self.monitoring_active = True
        
    def record_response_metrics(self, metrics: ResponseMetrics):
        """Record response performance metrics"""
        self.metrics_history.append(metrics)
        self._analyze_performance()
    
    def _analyze_performance(self):
        """Analyze performance and suggest optimizations"""
        if len(self.metrics_history) < 10:
            return
        
        recent_metrics = list(self.metrics_history)[-10:]
        avg_response_time = sum(m.response_time for m in recent_metrics) / len(recent_metrics)
        
        # Generate optimization suggestions
        suggestions = []
        
        if avg_response_time > 3.0:
            suggestions.append("Consider reducing max_tokens for faster responses")
        
        if avg_response_time > 5.0:
            suggestions.append("Switch to faster model (llama3-8b-8192)")
        
        # Check memory usage
        try:
            memory_usage = psutil.Process().memory_info().rss / 1024 / 1024  # MB
            if memory_usage > 500:
                suggestions.append("High memory usage detected - consider clearing caches")
        except:
            pass
        
        self.optimization_suggestions = suggestions
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get current performance statistics"""
        if not self.metrics_history:
            return {"status": "no_data"}
        
        recent_metrics = list(self.metrics_history)[-20:]
        
        try:
            memory_usage = psutil.Process().memory_info().rss / 1024 / 1024  # MB
            cpu_usage = psutil.cpu_percent()
        except:
            memory_usage = 0
            cpu_usage = 0
        
        return {
            "avg_response_time": sum(m.response_time for m in recent_metrics) / len(recent_metrics),
            "min_response_time": min(m.response_time for m in recent_metrics),
            "max_response_time": max(m.response_time for m in recent_metrics),
            "total_responses": len(self.metrics_history),
            "memory_usage_mb": memory_usage,
            "cpu_usage_percent": cpu_usage,
            "optimization_suggestions": self.optimization_suggestions
        }

class EnhancedContextSystem:
    """
    Enhanced context understanding system
    """
    def __init__(self):
        self.conversation_flow = deque(maxlen=50)
        self.active_entities = []
        self.current_topic = None
        self.intent_patterns = {
            'question': [
                r'^(what|how|when|where|why|who|which|whose|can|could|would|should|is|are|do|does|did)\b',
                r'\?',
                r'\b(tell me|explain|describe|clarify)\b'
            ],
            'request': [
                r'^(please|could you|can you|would you)\b',
                r'\b(help|assist|support)\b',
                r'\b(create|make|generate|build|write)\b'
            ],
            'command': [
                r'^(do|execute|run|perform|start|stop|open|close)\b',
                r'!$'
            ],
            'greeting': [
                r'^(hello|hi|hey|good morning|good afternoon|good evening)\b'
            ],
            'goodbye': [
                r'\b(bye|goodbye|see you|farewell|take care)\b'
            ],
            'appreciation': [
                r'\b(thank|thanks|appreciate|grateful)\b'
            ]
        }
    
    def analyze_intent(self, text: str) -> ConversationIntent:
        """Analyze user intent from text"""
        text_lower = text.lower().strip()
        
        # Check patterns
        best_intent = 'general'
        best_confidence = 0.0
        
        for intent_type, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    confidence = 0.8  # Base confidence for pattern match
                    if confidence > best_confidence:
                        best_intent = intent_type
                        best_confidence = confidence
        
        # Extract parameters based on intent
        parameters = self._extract_intent_parameters(text, best_intent)
        
        return ConversationIntent(
            intent_type=best_intent,
            confidence=best_confidence,
            parameters=parameters,
            context_window=[],
            timestamp=datetime.now()
        )
    
    def _extract_intent_parameters(self, text: str, intent_type: str) -> Dict[str, Any]:
        """Extract parameters based on intent type"""
        parameters = {}
        
        if intent_type == 'question':
            # Extract question type
            question_words = re.findall(r'\b(what|how|when|where|why|who|which)\b', text.lower())
            if question_words:
                parameters['question_type'] = question_words[0]
        
        elif intent_type == 'request':
            # Extract action verbs
            action_verbs = re.findall(r'\b(help|create|make|generate|build|write|explain|describe)\b', text.lower())
            if action_verbs:
                parameters['requested_action'] = action_verbs[0]
        
        return parameters
    
    def process_user_input(self, user_input: str) -> Dict[str, Any]:
        """Process user input and extract context"""
        try:
            intent = self.analyze_intent(user_input)
            
            # Simple entity extraction (basic implementation)
            entities = self._extract_basic_entities(user_input)
            
            # Update conversation flow
            turn = {
                'user_input': user_input,
                'intent': intent,
                'entities': entities,
                'timestamp': datetime.now()
            }
            
            self.conversation_flow.append(turn)
            
            return {
                'intent': intent,
                'entities': entities,
                'conversation_context': list(self.conversation_flow)[-5:],  # Last 5 turns
                'current_topic': self.current_topic
            }
            
        except Exception as e:
            logger.error(f"Error processing context: {e}")
            return {
                'intent': ConversationIntent('general', 0.5, {}, [], datetime.now()),
                'entities': [],
                'error': str(e)
            }
    
    def _extract_basic_entities(self, text: str) -> List[ContextEntity]:
        """Basic entity extraction"""
        entities = []
        
        # Simple pattern-based entity extraction
        # Email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        for email in emails:
            entities.append(ContextEntity(
                text=email,
                entity_type='EMAIL',
                confidence=0.9,
                first_mentioned=datetime.now(),
                last_mentioned=datetime.now(),
                mention_count=1,
                relevance_score=0.5
            ))
        
        # URLs
        url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        urls = re.findall(url_pattern, text)
        for url in urls:
            entities.append(ContextEntity(
                text=url,
                entity_type='URL',
                confidence=0.9,
                first_mentioned=datetime.now(),
                last_mentioned=datetime.now(),
                mention_count=1,
                relevance_score=0.5
            ))
        
        return entities

class BasicMemoryManager:
    """
    Basic memory management system integrated into Nova AI
    """
    def __init__(self):
        self.user_facts = {}
        self.user_preferences = {}
        self.conversation_history = deque(maxlen=100)
        self.important_memories = []
        self.short_term_memory = deque(maxlen=20)
        self.long_term_memory = {}
        
    def update_user_facts(self, message: str):
        """Extract and store user facts from message"""
        try:
            # Simple fact extraction patterns
            fact_patterns = [
                (r"my name is ([A-Za-z]+)", "name"),
                (r"i live in ([A-Za-z\s]+)", "location"),
                (r"i work as? (?:a |an )?([A-Za-z\s]+)", "job"),
                (r"i am (\d+) years old", "age"),
                (r"i like ([A-Za-z\s]+)", "likes"),
                (r"i have (?:a |an )?([A-Za-z\s]+)", "possessions")
            ]
            
            message_lower = message.lower()
            for pattern, fact_type in fact_patterns:
                matches = re.findall(pattern, message_lower)
                if matches:
                    self.user_facts[fact_type] = matches[0].strip()
                    
        except Exception as e:
            logger.debug(f"Error updating user facts: {e}")
    
    def update_user_preferences(self, message: str):
        """Extract and store user preferences"""
        try:
            message_lower = message.lower()
            
            # Positive preferences
            positive_patterns = [
                r"i love ([A-Za-z\s]+)",
                r"i enjoy ([A-Za-z\s]+)",
                r"i like ([A-Za-z\s]+)",
                r"i prefer ([A-Za-z\s]+)"
            ]
            
            for pattern in positive_patterns:
                matches = re.findall(pattern, message_lower)
                for match in matches:
                    preference = match.strip()
                    if preference:
                        self.user_preferences[preference] = {"value": 0.8, "type": "positive"}
            
            # Negative preferences
            negative_patterns = [
                r"i hate ([A-Za-z\s]+)",
                r"i don't like ([A-Za-z\s]+)",
                r"i dislike ([A-Za-z\s]+)"
            ]
            
            for pattern in negative_patterns:
                matches = re.findall(pattern, message_lower)
                for match in matches:
                    preference = match.strip()
                    if preference:
                        self.user_preferences[preference] = {"value": -0.8, "type": "negative"}
                        
        except Exception as e:
            logger.debug(f"Error updating user preferences: {e}")
    
    def get_relevant_memories(self, query: str) -> List[str]:
        """Get memories relevant to the current query"""
        try:
            relevant = []
            query_lower = query.lower()
            
            # Check user facts
            for fact_type, fact_value in self.user_facts.items():
                if any(word in query_lower for word in fact_value.lower().split()):
                    relevant.append(f"User {fact_type}: {fact_value}")
            
            # Check preferences
            for pref, details in self.user_preferences.items():
                if any(word in query_lower for word in pref.split()):
                    sentiment = "likes" if details["value"] > 0 else "dislikes"
                    relevant.append(f"User {sentiment} {pref}")
            
            return relevant[:5]  # Limit to top 5 relevant memories
            
        except Exception as e:
            logger.debug(f"Error getting relevant memories: {e}")
            return []
    
    def get_memory_context(self) -> str:
        """Get memory context for system prompt"""
        try:
            context_parts = []
            
            if self.user_facts:
                facts = ", ".join([f"{k}: {v}" for k, v in self.user_facts.items()])
                context_parts.append(f"User facts: {facts}")
            
            if self.user_preferences:
                prefs = []
                for pref, details in self.user_preferences.items():
                    sentiment = "likes" if details["value"] > 0 else "dislikes"
                    prefs.append(f"{sentiment} {pref}")
                if prefs:
                    context_parts.append(f"User preferences: {', '.join(prefs[:3])}")
            
            return "; ".join(context_parts) if context_parts else ""
            
        except Exception as e:
            logger.debug(f"Error getting memory context: {e}")
            return ""
    
    def add_to_conversation(self, user_message: str, ai_response: str):
        """Add conversation turn to memory"""
        try:
            turn = {
                "user": user_message,
                "assistant": ai_response,
                "timestamp": datetime.now()
            }
            self.conversation_history.append(turn)
            self.short_term_memory.append(turn)
                    
        except Exception as e:
            logger.debug(f"Error adding to conversation: {e}")
    
    def summarize_conversation(self) -> str:
        """Summarize recent conversation"""
        try:
            if len(self.conversation_history) < 3:
                return ""
            
            recent = list(self.conversation_history)[-5:]
            topics = []
            
            for turn in recent:
                user_msg = turn["user"].lower()
                # Simple topic extraction
                if any(word in user_msg for word in ["what", "how", "explain"]):
                    topics.append("questions")
                elif any(word in user_msg for word in ["help", "assist", "support"]):
                    topics.append("help")
                elif any(word in user_msg for word in ["create", "make", "build"]):
                    topics.append("creation")
            
            return f"Recent topics: {', '.join(set(topics))}" if topics else "General conversation"
            
        except Exception as e:
            logger.debug(f"Error summarizing conversation: {e}")
            return ""
    
    def update_long_term_memory(self):
        """Update long-term memory from short-term"""
        try:
            # Move important short-term memories to long-term
            for turn in self.short_term_memory:
                if len(turn["user"]) > 50:  # Longer messages might be more important
                    key = str(hash(turn["user"]))
                    self.long_term_memory[key] = turn
            
        except Exception as e:
            logger.debug(f"Error updating long-term memory: {e}")

class BasicTopicManager:
    """
    Basic topic management system integrated into Nova AI
    """
    def __init__(self):
        self.current_topics = []
        self.topic_history = deque(maxlen=50)
        self.conversation_state = "greeting"
        self.last_follow_up_time = None
        self.follow_up_cooldown = 300  # 5 minutes
        
    def update_topics(self, message: str):
        """Update current topics based on message"""
        try:
            message_lower = message.lower()
            
            # Detect topics using simple keyword matching
            topic_keywords = {
                "technology": ["code", "programming", "software", "computer", "AI", "robot", "app"],
                "science": ["research", "experiment", "theory", "study", "discovery"],
                "health": ["exercise", "fitness", "medical", "health", "doctor", "medicine"],
                "business": ["work", "job", "career", "money", "business", "company"],
                "education": ["school", "learn", "study", "university", "college", "course"],
                "entertainment": ["movie", "music", "game", "book", "art", "sport"],
                "personal": ["family", "friend", "relationship", "love", "life", "feel"]
            }
            
            detected_topics = []
            for topic, keywords in topic_keywords.items():
                if any(keyword in message_lower for keyword in keywords):
                    detected_topics.append(topic)
            
            # Update current topics
            self.current_topics = detected_topics[:3]  # Keep top 3 topics
            
            # Update conversation state
            if any(word in message_lower for word in ["hello", "hi", "hey", "good morning"]):
                self.conversation_state = "greeting"
            elif any(word in message_lower for word in ["sad", "upset", "angry", "happy", "excited"]):
                self.conversation_state = "emotional"
            elif len(message) > 100:
                self.conversation_state = "deep"
            else:
                self.conversation_state = "casual"
            
            # Add to history
            self.topic_history.append({
                "topics": detected_topics,
                "state": self.conversation_state,
                "timestamp": datetime.now()
            })
            
        except Exception as e:
            logger.debug(f"Error updating topics: {e}")
    
    def get_conversation_context(self) -> Dict[str, Any]:
        """Get current conversation context"""
        try:
            return {
                "current_topics": self.current_topics,
                "state": self.conversation_state,
                "recent_topics": [entry["topics"] for entry in list(self.topic_history)[-5:]]
            }
        except Exception as e:
            logger.debug(f"Error getting conversation context: {e}")
            return {"current_topics": [], "state": "unknown", "recent_topics": []}
    
    def should_ask_follow_up(self) -> bool:
        """Determine if a follow-up question should be asked"""
        try:
            if self.last_follow_up_time is None:
                return True
            
            time_since_last = (datetime.now() - self.last_follow_up_time).total_seconds()
            return time_since_last > self.follow_up_cooldown
            
        except Exception as e:
            logger.debug(f"Error checking follow-up: {e}")
            return False
    
    def generate_follow_up(self, user_message: str, ai_response: str, avoid_topics: List[str] = None) -> str:
        """Generate a follow-up question"""
        try:
            avoid_topics = avoid_topics or []
            
            # Simple follow-up generation based on topics
            if "technology" in self.current_topics and "technology" not in avoid_topics:
                follow_ups = [
                    "What tech stuff interests you most?",
                    "Working on any coding projects?",
                    "What's your favorite programming language?"
                ]
            elif "science" in self.current_topics and "science" not in avoid_topics:
                follow_ups = [
                    "What area of science fascinates you?",
                    "Ever done any interesting experiments?",
                    "What scientific discovery amazes you most?"
                ]
            elif "personal" in self.current_topics and "personal" not in avoid_topics:
                follow_ups = [
                    "How's everything going with that?",
                    "What's been on your mind lately?",
                    "How are you feeling about it?"
                ]
            else:
                follow_ups = [
                    "What else is on your mind?",
                    "Anything interesting happening lately?",
                    "What's been keeping you busy?"
                ]
            
            if random.random() < 0.3:  # 30% chance of follow-up
                self.last_follow_up_time = datetime.now()
                return random.choice(follow_ups)
            
            return ""
            
        except Exception as e:
            logger.debug(f"Error generating follow-up: {e}")
            return ""

class SpecializedKnowledgeSystem:
    """
    Specialized knowledge system with domain expertise
    """
    def __init__(self):
        self.knowledge_base = {
            "technology": {
                "REST API": "Representational State Transfer API - uses HTTP methods for web services",
                "Machine Learning": "AI technique that enables computers to learn without explicit programming",
                "Database Indexing": "Improves query performance by creating shortcuts to data",
                "Caching": "Temporary storage of frequently accessed data for faster retrieval",
                "Algorithm": "Step-by-step procedure for solving a problem or completing a computation"
            },
            "science": {
                "Scientific Method": "Systematic approach to understanding natural phenomena through observation and experimentation",
                "Hypothesis": "Proposed explanation for a phenomenon, testable through experimentation",
                "Peer Review": "Evaluation of work by experts in the same field to ensure quality and validity"
            },
            "business": {
                "SWOT Analysis": "Strategic planning tool examining Strengths, Weaknesses, Opportunities, and Threats",
                "ROI": "Return on Investment - measures efficiency and profitability of investments",
                "Market Segmentation": "Dividing target market into distinct groups with similar characteristics"
            },
            "health": {
                "Cardiovascular Exercise": "Physical activity that strengthens heart and improves circulation",
                "Balanced Nutrition": "Consuming appropriate amounts of proteins, carbs, fats, vitamins, and minerals",
                "Preventive Care": "Medical care focused on preventing illness rather than treating existing conditions"
            }
        }
        
        self.domain_keywords = {
            "technology": ["code", "programming", "software", "algorithm", "database", "API", "machine learning", "AI"],
            "science": ["research", "experiment", "hypothesis", "theory", "analysis", "study"],
            "business": ["strategy", "market", "revenue", "profit", "investment", "analysis"],
            "health": ["medical", "health", "exercise", "nutrition", "wellness", "care"]
        }
    
    def detect_domain(self, query: str) -> str:
        """Detect the most likely domain for a query"""
        query_lower = query.lower()
        domain_scores = {}
        
        for domain, keywords in self.domain_keywords.items():
            score = sum(1 for keyword in keywords if keyword in query_lower)
            domain_scores[domain] = score
        
        if domain_scores:
            best_domain = max(domain_scores, key=domain_scores.get)
            if domain_scores[best_domain] > 0:
                return best_domain
        
        return "technology"  # Default domain
    
    def query_knowledge(self, query: str, domain: str = None) -> Dict[str, Any]:
        """Query specialized knowledge"""
        if not domain:
            domain = self.detect_domain(query)
        
        relevant_knowledge = []
        query_lower = query.lower()
        
        if domain in self.knowledge_base:
            for concept, explanation in self.knowledge_base[domain].items():
                if any(word in concept.lower() for word in query_lower.split()):
                    relevant_knowledge.append({
                        "concept": concept,
                        "explanation": explanation,
                        "domain": domain
                    })
        
        return {
            "domain": domain,
            "knowledge": relevant_knowledge,
            "confidence": 0.8 if relevant_knowledge else 0.3,
            "query": query
        }

class Responses:
    """Class to manage predefined responses and conversation elements."""
    
    def __init__(self):
        self.greetings = "Hey there! I'm Nova, ready to chat. What's up?"
        
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
        """Load the set of processed message IDs from file.
        
        Returns:
            Set[int]: Set of processed message IDs
        """
        try:
            with open("processed_messages.json", "r", encoding="utf-8") as f:
                data = json.load(f)
                return set(data)
        except (FileNotFoundError, json.JSONDecodeError):
            # Create empty file if it doesn't exist or is invalid
            with open("processed_messages.json", "w", encoding="utf-8") as f:
                json.dump([], f)
            return set()
        except Exception as e:
            logger.error(f"Error loading processed messages: {e}")
            return set()
            
    def save_processed_messages(self, processed_msgs: Set[int]) -> bool:
        """Save the set of processed message IDs to file.
        
        Args:
            processed_msgs: Set of processed message IDs
            
        Returns:
            bool: True if successful
        """
        try:
            with open("processed_messages.json", "w", encoding="utf-8") as f:
                json.dump(list(processed_msgs), f)
            return True
        except Exception as e:
            logger.error(f"Error saving processed messages: {e}")
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
    
    def __init__(self):
        """Initialize the display manager and enable colors on Windows."""
        # Enable ANSI escape sequences on Windows
        if os.name == 'nt':
            import ctypes
            kernel32 = ctypes.windll.kernel32
            kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
    
    # Enhanced color codes that work on both Windows and Unix
    COLORS = {
        'BLACK': '\033[30m',
        'RED': '\033[91m',  # Bright red
        'GREEN': '\033[92m',  # Bright green
        'YELLOW': '\033[93m',  # Bright yellow
        'BLUE': '\033[94m',  # Bright blue
        'MAGENTA': '\033[95m',  # Bright magenta
        'CYAN': '\033[96m',  # Bright cyan
        'WHITE': '\033[97m',  # Bright white
        'RESET': '\033[0m',
        'BOLD': '\033[1m',
        'DIM': '\033[2m',
        'ITALIC': '\033[3m',
        'UNDERLINE': '\033[4m',
        'BLINK': '\033[5m',
        'REVERSE': '\033[7m',
        'HIDDEN': '\033[8m',
        'STRIKE': '\033[9m',
        # Background colors
        'BG_BLACK': '\033[40m',
        'BG_RED': '\033[41m',
        'BG_GREEN': '\033[42m',
        'BG_YELLOW': '\033[43m',
        'BG_BLUE': '\033[44m',
        'BG_MAGENTA': '\033[45m',
        'BG_CYAN': '\033[46m',
        'BG_WHITE': '\033[47m'
    }
    
    def format_message(self, text: str, role: str = "assistant") -> str:
        """Format a message with colors based on role.
        
        Args:
            text: The message text
            role: The role (user/assistant)
            
        Returns:
            str: Formatted message
        """
        if role == "user":
            return f"{self.COLORS['GREEN']}{self.COLORS['BOLD']}You:{self.COLORS['RESET']} {text}"
        else:
            return f"{self.COLORS['MAGENTA']}{self.COLORS['BOLD']}Nova:{self.COLORS['RESET']} {self.COLORS['CYAN']}{text}{self.COLORS['RESET']}"
    
    def stream_text(self, text: str):
        """Stream text to terminal with typing effect.
        
        Args:
            text: Text to stream
        """
        sys.stdout.write(text)
        sys.stdout.flush()
    
    def print_divider(self):
        """Print a colored divider line."""
        print(f"\n{self.COLORS['BLUE']}{'='*90}{self.COLORS['RESET']}\n")
    
    def print_banner(self, text: str):
        """Print a stylized banner with text.
        
        Args:
            text: Banner text
        """
        width = 60  # Reduced width for better readability
        padding = (width - len(text) - 4) // 2
        print(f"{self.COLORS['MAGENTA']}{self.COLORS['BOLD']}{'═'*width}")
        print(f"║{' '*padding}{self.COLORS['CYAN']}{text}{self.COLORS['MAGENTA']}{' '*padding}║")
        print(f"{'═'*width}{self.COLORS['RESET']}")
    
    def print_status(self, status: str, status_type: str = "info"):
        """Print a status message with appropriate color.
        
        Args:
            status: Status message
            status_type: Type of status (info/success/warning/error)
        """
        colors = {
            "info": self.COLORS['CYAN'] + self.COLORS['BOLD'],
            "success": self.COLORS['GREEN'] + self.COLORS['BOLD'],
            "warning": self.COLORS['YELLOW'] + self.COLORS['BOLD'],
            "error": self.COLORS['RED'] + self.COLORS['BOLD']
        }
        color = colors.get(status_type, self.COLORS['WHITE'])
        print(f"{color}[{status_type.upper()}] {status}{self.COLORS['RESET']}")
    
    def print_thinking(self):
        """Show an animated thinking indicator."""
        frames = ["◐", "◓", "◑", "◒"]  # More visible spinner
        sys.stdout.write(f"\r{self.COLORS['CYAN']}{self.COLORS['BOLD']}Thinking {frames[0]}{self.COLORS['RESET']}")
        sys.stdout.flush()


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
        """Display clean and simple welcome message."""
        colors = DisplayManager.COLORS
        # Show a colorful welcome banner
        self.display.print_banner("Welcome to Nova AI")
        # Show listening prompt with a nice cyan color
        self.display.print_status("Listening...", "info")
        print(f"{colors['CYAN']}>{colors['RESET']} ", end="", flush=True)
        
    def show_help(self):
        """Display help information."""
        colors = DisplayManager.COLORS
        self.display.print_divider()
        print(f"{colors['YELLOW']}{colors['BOLD']}Available commands:{colors['RESET']}")
        commands = {
            "exit, quit, bye": "End the conversation",
            "switch": "Switch to transcript mode",
            "clear": "Clear the terminal screen",
            "help": "Show this help message"
        }
        for cmd, desc in commands.items():
            print(f"  {colors['CYAN']}{cmd}{colors['RESET']} - {colors['WHITE']}{desc}{colors['RESET']}")
        self.display.print_divider()
        
    async def get_user_input(self) -> str:
        """Get input from the user with an async-compatible approach.
        
        Returns:
            str: The user's input
        """
        # Using a separate thread to get input to avoid blocking the event loop
        return await asyncio.to_thread(input, "")
        
    def show_thinking(self):
        """Display a thinking animation."""
        self.display.print_thinking()
        
    def clear_thinking(self):
        """Clear the thinking animation."""
        sys.stdout.write("\r" + " " * 20 + "\r")
        sys.stdout.flush()


class AleChatBot:
    """Main chatbot class implementing a human-like assistant named Nava with enhanced memory and context understanding."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the chatbot with necessary components.
        
        Args:
            api_key: GROQ API key (optional - will look for environment variable if None)
        """
        # Set up API client
        self.api_key = api_key or os.getenv('GROQ_API_KEY')
        if not self.api_key:
            logger.error("No GROQ API key provided. Please set GROQ_API_KEY environment variable or pass api_key parameter.")
            raise ValueError("GROQ API key is required")
            
        # Initialize API client
        try:
            self.client = groq.Client(api_key=self.api_key)
            
            # Test API connection
            test_completion = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",  # Using the correct model name
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            logger.info("✅ API connection test successful")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize API client: {e}")
            raise RuntimeError(f"API client initialization failed: {e}")
        
        # Initialize advanced Mem0.ai memory system (optional)
        self.memory = None
        self.memory_enabled = False
        
        try:
            # Try to initialize memory system with retries
            max_retries = 3
            retry_delay = 1
            last_error = None
            
            for attempt in range(max_retries):
                try:
                    self.memory = Mem0AI(user_id="nova_user")
                    self.memory_enabled = True
                    print("✅ Memory system enabled")
                    file_logger.info("Advanced Mem0.ai memory system initialized successfully")
                    break
                except ImportError as e:
                    # Don't retry on import errors
                    print("Warning: Memory system disabled (mem0 package not installed)")
                    file_logger.warning(f"Memory system import error: {e}")
                    break
                except Exception as e:
                    last_error = e
                    if attempt < max_retries - 1:
                        print(f"Memory system initialization attempt {attempt + 1} failed, retrying...")
                        time.sleep(retry_delay)
                        retry_delay *= 2
                    else:
                        print("Warning: Memory system disabled (working with basic functionality)")
                        file_logger.warning(f"Failed to initialize Mem0.ai memory system after {max_retries} attempts: {e}")
        except Exception as e:
            print(f"Error during memory system initialization: {e}")
            file_logger.error(f"Memory system initialization error: {e}")
        finally:
            if not self.memory_enabled:
                print("Running with basic functionality (no memory system)")
                file_logger.info("Memory system disabled, running in basic mode")
        
        # Initialize topic manager
        self.topic_manager = BasicTopicManager()
        logger.info("Memory systems initialized successfully")
        
        # Initialize helper classes
        self.responses = Responses()
        self.files = FileManager()
        self.display = DisplayManager()
        self.terminal_chat = TerminalChatMode(self.display, self.responses)
        
        # Initialize Enhanced AI Systems with optimized settings
        self.smart_cache = SmartCacheSystem(max_cache_size=500)  # Reduced cache size
        self.performance_monitor = PerformanceMonitor()
        self.context_system = EnhancedContextSystem()
        self.knowledge_system = SpecializedKnowledgeSystem()
        
        # Initialize news system
        try:
            if NewsSummarySystem:
                self.news_system = NewsSummarySystem()
                logger.info("✅ News system initialized successfully")
            else:
                self.news_system = None
                logger.warning("⚠️ News system not available")
        except Exception as e:
            logger.error(f"❌ Failed to initialize news system: {e}")
            self.news_system = None
        
        # Performance optimization settings
        self.enable_caching = True
        self.enable_performance_monitoring = True
        self.enable_context_understanding = True
        self.enable_specialized_knowledge = True
        
        # Chat state tracking with optimized memory usage
        self.processed_messages: Set[int] = self.files.load_processed_messages()
        self.previous_questions: List[str] = []
        self.repeated_question_flags: Dict[str, bool] = {}
        
        # Initialize voice input mode (will be set by argparse later)
        self.voice_input_mode = False
        
        # Default mode (will be set by argparse later)
        self.mode = "terminal"
        
        # Optimized response timing settings
        self.min_response_time = 0.05  # Reduced minimum response time
        self.max_response_time = 0.2  # Reduced maximum response time
        self.typing_speed_variation = 0.001  # Minimal typing speed variation
        
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
            try:
                for message in saved_history:
                    if message["role"] == "user":
                        self.topic_manager.update_topics(message["content"])
                        self.memory.update_user_facts(message["content"])
                        self.memory.update_user_preferences(message["content"])
                logger.info(f"Processed {len(saved_history)} saved messages")
            except Exception as e:
                logger.debug(f"Error processing saved history: {e}")
        
        # Initialize web search capability
        self.search_system = NovaSearch()
    
    def add_human_touch(self, response: str) -> str:
        """Add sophisticated human-like touches to make responses more natural.
        
        Args:
            response: The AI's raw response
            
        Returns:
            str: Response with human-like touches
        """
        # Get conversation state from topic manager
        try:
            conversation_state = self.topic_manager.conversation_state
        except:
            conversation_state = "casual"
        
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
                    # Add the filler with appropriate punctuation
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
    
    def _parse_enhanced_search_request(self, user_message: str) -> tuple:
        """Parse user message to extract search query and options.
        
        Args:
            user_message: The user's search request
            
        Returns:
            Tuple of (clean_query, options_dict)
        """
        message_lower = user_message.lower()
        options = {}
        
        # Check for detailed request
        if re.search(r'(full |detailed |complete )?details', message_lower):
            options['format'] = 'detailed'
            options['summarize'] = False
        
        # Check for summary request
        elif re.search(r'(summarize|summary|brief|make it short)', message_lower):
            options['format'] = 'summary'
            options['summarize'] = True
        
        # Check for site-specific search
        site_match = re.search(r'(on|from|in) (wikipedia|reddit|youtube|github|stackoverflow|twitter|news|academic)', message_lower)
        if site_match:
            options['target_site'] = site_match.group(2)
        else:
            # Check for custom domain
            domain_match = re.search(r'(on|from|in) ([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', message_lower)
            if domain_match:
                options['target_site'] = domain_match.group(2)
        
        # Clean the query by removing command words
        clean_query = user_message
        
        # Remove search command words
        clean_query = re.sub(r'^(search|find|look up|google|check|get information about)\s+', '', clean_query, flags=re.IGNORECASE)
        
        # Remove format specifiers
        clean_query = re.sub(r'\s+(and )?(give me |show me )?(full |detailed |complete )?details?$', '', clean_query, flags=re.IGNORECASE)
        clean_query = re.sub(r'\s+(and )?(summarize|give me a summary|brief|make it short)$', '', clean_query, flags=re.IGNORECASE)
        
        # Remove site specifiers
        clean_query = re.sub(r'\s+(on|from|in) (wikipedia|reddit|youtube|github|stackoverflow|twitter|news|academic)$', '', clean_query, flags=re.IGNORECASE)
        clean_query = re.sub(r'\s+(on|from|in) [a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', '', clean_query, flags=re.IGNORECASE)
        
        return clean_query.strip(), options
    
    def _format_detailed_results(self, search_results: dict) -> str:
        """Format search results for detailed output."""
        answer = search_results.get("answer", "")
        results = search_results.get("results", [])
        
        detailed_output = f"**DETAILED SEARCH RESULTS**\n\n{answer}\n\n"
        
        if results:
            detailed_output += "**ADDITIONAL SOURCES:**\n"
            for i, result in enumerate(results[:5], 1):
                if result.get("type") == "web_result":
                    title = result.get("title", "")
                    snippet = result.get("snippet", "")
                    link = result.get("link", "")
                    
                    detailed_output += f"\n{i}. **{title}**\n"
                    detailed_output += f"   {snippet}\n"
                    if link:
                        detailed_output += f"   Source: {link}\n"
        
        return detailed_output
    
    def _format_summary_results(self, search_results: dict) -> str:
        """Format search results for summary output."""
        answer = search_results.get("answer", "")
        
        # Extract key points for summary
        sentences = re.split(r'[.!?]+', answer)
        key_sentences = [s.strip() for s in sentences if len(s.strip()) > 20][:3]  # Top 3 key sentences
        
        summary = "**QUICK SUMMARY:**\n\n"
        for sentence in key_sentences:
            if sentence:
                summary += f"• {sentence}.\n"
        
        summary += f"\n_This is a brief summary. For more details, ask for 'detailed information'._"
        
        return summary
    
    async def _store_search_memory_async(self, search_answer: str, user_message: str):
        """Store search results in memory asynchronously.
        
        Args:
            search_answer: The search results to store
            user_message: The original user query
        """
        if self.memory_enabled and self.memory:
            try:
                await asyncio.to_thread(
                    self.memory.store_memory,
                    content=search_answer,
                    memory_type=MemoryType.FACT,
                    topic="web_search",
                    metadata={
                        "query": user_message,
                        "timestamp": datetime.now().isoformat()
                    }
                )
            except Exception as e:
                logger.warning(f"Failed to store search memory: {e}")

    async def get_response(self, messages: List[Dict], stream_to_terminal: bool = True) -> str:
        """Get a response from the AI model.
        
        Args:
            messages: List of conversation messages
            stream_to_terminal: Whether to stream the response to terminal
            
        Returns:
            str: The AI's response
        """
        try:
            # Get the user's message
            user_message = messages[-1]["content"]
            
            # Check for news-related queries first
            if self.news_system:
                news_response = self._process_news_query(user_message)
                if news_response:
                    return news_response
            
            # Enhanced search patterns with new features
            search_patterns = [
                # Basic search patterns
                r"^(search|google|look up|find online|search online|search the internet|search the web)\s+.+",
                r"^can you (search|look up|find) (on|in|at|from) (google|the internet|the web|online)\s+.+",
                r"^please (search|look up|find) (on|in|at|from) (google|the internet|the web|online)\s+.+",
                r"^(search|look up|find) information about\s+.+",
                r"^(search|look up|find) the latest (news|information) (about|on|for)\s+.+",
                
                # NEW: Detailed search patterns
                r"^(search|find|look up) .+ (and )?(give me |show me )?(full |detailed |complete )?details",
                r"^(give me |show me )?(full |detailed |complete )?details (about|on|for) .+",
                
                # NEW: Summarization patterns
                r"^(search|find|look up) .+ (and )?(summarize|give me a summary|brief|make it short)",
                r"^(summarize|give me a summary of) .+ (from search|by searching)",
                r"^search and summarize .+",
                
                # NEW: Site-specific patterns
                r"^(search|find|look up) .+ (on|from|in) (wikipedia|reddit|youtube|github|stackoverflow|twitter|news|academic)",
                r"^(search|find|look up) .+ (on|from|in) [a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
                r"^check .+ (on|from|in) (wikipedia|reddit|youtube|github|stackoverflow|twitter|news)",
                r"^get information about .+ from .+"
            ]
            
            # Make sure it's an explicit search request
            is_search_request = any(re.search(pattern, user_message.lower()) for pattern in search_patterns)
            
            if is_search_request and SERPAPI_KEY:
                try:
                    # Show searching status
                    if self.display:
                        self.display.print_status("Searching the internet...", "info")
                    
                    # Parse the search request for enhanced features
                    search_query, search_options = self._parse_enhanced_search_request(user_message)
                    
                    # Perform web search with enhanced options
                    search_results = self.search_system.search(
                        query=search_query,
                        summarize=search_options.get('summarize'),
                        target_site=search_options.get('target_site')
                    )
                    search_answer = search_results["answer"]
                    
                    # Apply post-processing based on user request
                    if search_options.get('format') == 'detailed':
                        search_answer = self._format_detailed_results(search_results)
                    elif search_options.get('format') == 'summary':
                        search_answer = self._format_summary_results(search_results)
                    
                    # Store the search results in memory asynchronously
                    asyncio.create_task(self._store_search_memory_async(search_answer, user_message))
                    
                    return search_answer
                    
                except Exception as e:
                    logger.error(f"Search error: {e}")
                    return "I encountered an error while searching. Let me try to answer based on what I know."
            
            # If not a search request or search failed, proceed with normal response
            try:
                # Add thinking delay for more natural interaction
                await asyncio.sleep(random.uniform(self.min_response_time, self.max_response_time))
                
                # Get response from model
                completion = await asyncio.to_thread(
                    self.client.chat.completions.create,
                    model="llama-3.3-70b-versatile",  # Using the correct model name
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1000,
                    stream=stream_to_terminal
                )
                
                if stream_to_terminal:
                    # Stream the response
                    response_chunks = []
                    async for chunk in completion:
                        if chunk.choices[0].delta.content:
                            response_chunks.append(chunk.choices[0].delta.content)
                            if self.display:
                                self.display.stream_text(chunk.choices[0].delta.content)
                    response = "".join(response_chunks)
                else:
                    # Return complete response
                    response = completion.choices[0].message.content
                
                # Update chat history
                if response:
                    self.chat_history.extend([
                        {"role": "user", "content": user_message},
                        {"role": "assistant", "content": response}
                    ])
                    
                    # Store conversation memory asynchronously
                    if self.memory_enabled and self.memory:
                        asyncio.create_task(self._store_conversation_memory_async(user_message, response))
                
                return response
                
            except Exception as e:
                logger.error(f"Model response error: {e}")
                return "I apologize, but I encountered an error generating a response. Could you please try again?"
            
        except Exception as e:
            logger.error(f"Error getting response: {e}")
            return "I apologize, but I encountered an error. Could you please try again?"
    
    async def _store_conversation_memory_async(self, user_message: str, ai_response: str):
        """Store conversation in memory asynchronously.
        
        Args:
            user_message: The user's message
            ai_response: The AI's response
        """
        try:
            await asyncio.to_thread(
                self.store_conversation_memory,
                user_message,
                ai_response
            )
        except Exception as e:
            logger.warning(f"Failed to store conversation memory: {e}")
            
    def handle_special_commands(self, command: str) -> bool:
        """Handle special commands including search-related ones."""
        # Add search-specific commands
        if command.startswith("search "):
            query = command[7:].strip()
            if query:
                results = self.search_system.search(query)
                print(results["answer"])
                return True
                
        # Handle other commands
        return super().handle_special_commands(command)
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status with all enhanced features"""
        try:
            # Get performance stats
            perf_stats = self.performance_monitor.get_performance_stats() if self.enable_performance_monitoring else {}
            
            # Get cache stats
            cache_stats = {
                "cache_size": len(self.smart_cache.response_cache),
                "cache_hits": sum(self.smart_cache.access_frequency.values()),
                "max_cache_size": self.smart_cache.max_cache_size
            } if self.enable_caching else {}
            
            # Get context system stats
            context_stats = {
                "conversation_turns": len(self.context_system.conversation_flow),
                "active_entities": len(self.context_system.active_entities),
                "current_topic": self.context_system.current_topic
            } if self.enable_context_understanding else {}
            
            # Get knowledge system stats
            knowledge_stats = {
                "domains": list(self.knowledge_system.knowledge_base.keys()),
                "total_concepts": sum(len(concepts) for concepts in self.knowledge_system.knowledge_base.values())
            } if self.enable_specialized_knowledge else {}
            
            return {
                "timestamp": datetime.now().isoformat(),
                "enhanced_features": {
                    "caching": self.enable_caching,
                    "performance_monitoring": self.enable_performance_monitoring,
                    "context_understanding": self.enable_context_understanding,
                    "specialized_knowledge": self.enable_specialized_knowledge
                },
                "performance": perf_stats,
                "cache": cache_stats,
                "context": context_stats,
                "knowledge": knowledge_stats,
                "memory_system": bool(self.memory),
                "voice_input": self.voice_input_mode,
                "mode": self.mode
            }
            
        except Exception as e:
            logger.error(f"Error getting system status: {e}")
            return {"error": str(e), "timestamp": datetime.now().isoformat()}
    
    def toggle_feature(self, feature_name: str) -> str:
        """Toggle enhanced features on/off"""
        feature_map = {
            "caching": "enable_caching",
            "performance": "enable_performance_monitoring", 
            "context": "enable_context_understanding",
            "knowledge": "enable_specialized_knowledge"
        }
        
        if feature_name.lower() in feature_map:
            attr_name = feature_map[feature_name.lower()]
            current_value = getattr(self, attr_name)
            setattr(self, attr_name, not current_value)
            new_value = getattr(self, attr_name)
            return f"✅ {feature_name.title()} {'enabled' if new_value else 'disabled'}"
        else:
            return f"❌ Unknown feature: {feature_name}. Available: {', '.join(feature_map.keys())}"
    
    def clear_caches(self) -> str:
        """Clear all caches and temporary data"""
        try:
            cleared_items = []
            
            if self.enable_caching:
                cache_size = len(self.smart_cache.response_cache)
                self.smart_cache.response_cache.clear()
                self.smart_cache.access_frequency.clear()
                self.smart_cache.last_access.clear()
                cleared_items.append(f"Response cache ({cache_size} items)")
            
            if self.enable_context_understanding:
                context_size = len(self.context_system.conversation_flow)
                self.context_system.conversation_flow.clear()
                self.context_system.active_entities.clear()
                self.context_system.current_topic = None
                cleared_items.append(f"Context data ({context_size} turns)")
            
            # Force garbage collection
            gc.collect()
            
            return f"Cleared: {', '.join(cleared_items) if cleared_items else 'No cached data found'}"
            
        except Exception as e:
            logger.error(f"Error clearing caches: {e}")
            return f"Error clearing caches: {e}"
    
    def clear_memory(self) -> str:
        """Clear all memories using the enhanced Mem0AI system"""
        if not self.memory_enabled or not self.memory:
            return "Memory system not available"
            
        try:
            stats_before = self.memory.get_memory_stats()
            memory_count_before = stats_before.get('total_memories', 0)
            
            if self.memory.clear_memories():
                logger.info(f"Cleared {memory_count_before} memories from Mem0.ai")
                return f"✅ Cleared {memory_count_before} memories from Mem0.ai"
            else:
                return "❌ Failed to clear memories"
        except Exception as e:
            logger.error(f"Error clearing memories: {e}")
            return f"❌ Error clearing memories: {e}"
    
    def store_conversation_memory(self, user_message: str, ai_response: str) -> None:
        """Store conversation using the enhanced Mem0AI system"""
        if not self.memory_enabled or not self.memory:
            logger.debug("Memory system not available - skipping conversation storage")
            return
            
        try:
            # Store conversation summary using the new memory system
            conversation_content = f"User: {user_message}\nAssistant: {ai_response}"
            self.memory.store_conversation_summary(
                conversation_snippet=conversation_content,
                topics=["general"]
            )
            logger.debug("Conversation stored in Mem0AI system")
        except Exception as e:
            logger.error(f"Error storing conversation in Mem0AI system: {e}")
    
    def get_relevant_memories(self, query: str) -> str:
        """Get relevant memories using the enhanced Mem0AI system"""
        if not self.memory_enabled or not self.memory:
            return "Memory system not available"
            
        try:
            memories = self.memory.retrieve_memories(query, limit=5)
            if memories:
                memory_texts = []
                for memory in memories:
                    content = memory.get('content', 'No content')
                    memory_type = memory.get('memory_type', 'unknown').replace('_', ' ').title()
                    relevance = memory.get('relevance_score', 0.0)
                    memory_texts.append(f"[{memory_type}] {content} (Score: {relevance:.2f})")
                
                return "🔍 Relevant memories:\n" + "\n".join(f"• {mem}" for mem in memory_texts[:5])
            else:
                return "❌ No relevant memories found."
        except Exception as e:
            logger.error(f"Error retrieving memories: {e}")
            return f"❌ Error retrieving memories: {e}"
    
    def _auto_extract_and_store_memories(self, user_message: str, ai_response: str, topics: List[str]):
        """Auto-extract and store various types of memories from conversation"""
        if not self.memory_enabled or not self.memory:
            logger.debug("Memory system not available - skipping auto-extraction")
            return
            
        try:
            # Extract user preferences
            preference_patterns = [
                r"i (like|love|prefer|enjoy|hate|dislike) (.+)",
                r"my favorite (.+) is (.+)",
                r"i'm (not )?interested in (.+)",
                r"i work (as|at|with) (.+)",
                r"i'm (learning|studying|working on) (.+)"
            ]
            
            for pattern in preference_patterns:
                matches = re.findall(pattern, user_message.lower(), re.IGNORECASE)
                for match in matches:
                    if isinstance(match, tuple):
                        preference_text = " ".join(match)
                    else:
                        preference_text = match
                    
                    self.memory.store_user_preference(
                        preference=preference_text,
                        category=topics[0] if topics else "general"
                    )
            
            # Extract facts and important information
            fact_patterns = [
                r"my name is (.+)",
                r"i am (.+) years old",
                r"i live in (.+)",
                r"i'm from (.+)",
                r"i have (.+)",
                r"i use (.+) for (.+)"
            ]
            
            for pattern in fact_patterns:
                matches = re.findall(pattern, user_message.lower(), re.IGNORECASE)
                for match in matches:
                    fact_text = match if isinstance(match, str) else " ".join(match)
                    self.memory.store_memory(
                        content=f"User fact: {fact_text}",
                        memory_type=MemoryType.FACT,
                        topic=topics[0] if topics else "personal",
                        importance_score=0.8,
                        tags=["user_info", "fact"] + topics
                    )
            
            # Store project context if detected
            project_patterns = [
                r"i'm working on (.+)",
                r"my project (.+)",
                r"the project (.+)",
                r"this project (.+)"
            ]
            
            for pattern in project_patterns:
                matches = re.findall(pattern, user_message.lower(), re.IGNORECASE)
                for match in matches:
                    project_context = match if isinstance(match, str) else " ".join(match)
                    # Try to extract project name
                    project_name = project_context.split()[0] if project_context else "current_project"
                    
                    self.memory.store_project_context(
                        project_name=project_name,
                        context=f"Project discussion: {user_message}",
                        tags=topics + ["project_discussion"]
                    )
                    
        except Exception as e:
            logger.debug(f"Auto-extraction error: {e}")
    
    def get_memory_status(self) -> str:
        """Get current memory system status"""
        if not self.memory_enabled or not self.memory:
            return "Memory system: Disabled (not available)"
            
        try:
            stats = self.memory.get_memory_stats()
            if "error" in stats:
                return f"Mem0.ai Memory: Error - {stats['error']}"
            
            total = stats.get('total_memories', 0)
            types = stats.get('memory_types', {})
            topics = stats.get('topics', {})
            
            status_parts = [f"Mem0.ai Memory: {total} memories stored"]
            
            if types:
                type_summary = ", ".join([f"{t}: {c}" for t, c in list(types.items())[:3]])
                status_parts.append(f"Types: {type_summary}")
            
            if topics:
                topic_summary = ", ".join([f"{t}: {c}" for t, c in list(topics.items())[:3]])
                status_parts.append(f"Topics: {topic_summary}")
            
            return " | ".join(status_parts)
            
        except Exception as e:
            return f"Mem0.ai Memory: Error - {e}"
    
    def get_performance_report(self) -> str:
        """Get a formatted performance report"""
        try:
            if not self.enable_performance_monitoring:
                return "📊 Performance monitoring is disabled. Enable it with: toggle performance"
            
            stats = self.performance_monitor.get_performance_stats()
            
            if stats.get("status") == "no_data":
                return "📊 No performance data available yet. Chat a bit and try again!"
            
            report = "📊 PERFORMANCE REPORT\n"
            report += "=" * 30 + "\n"
            report += f"⚡ Average Response Time: {stats.get('avg_response_time', 0):.2f}s\n"
            report += f"🚀 Fastest Response: {stats.get('min_response_time', 0):.2f}s\n"
            report += f"🐌 Slowest Response: {stats.get('max_response_time', 0):.2f}s\n"
            report += f"💬 Total Responses: {stats.get('total_responses', 0)}\n"
            report += f"💾 Memory Usage: {stats.get('memory_usage_mb', 0):.1f}MB\n"
            report += f"🖥️  CPU Usage: {stats.get('cpu_usage_percent', 0):.1f}%\n"
            
            suggestions = stats.get('optimization_suggestions', [])
            if suggestions:
                report += "\n💡 OPTIMIZATION SUGGESTIONS:\n"
                for i, suggestion in enumerate(suggestions, 1):
                    report += f"   {i}. {suggestion}\n"
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating performance report: {e}")
            return f"❌ Error generating report: {e}"
    
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
        cmd_parts = cmd_lower.split()
        
        if cmd_lower == "help":
            self.show_enhanced_help()
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
        
        # 🚀 NEW ENHANCED COMMANDS
        elif cmd_lower == "status":
            status = self.get_system_status()
            self.display_status(status)
            return True
            
        elif cmd_lower == "performance" or cmd_lower == "perf":
            report = self.get_performance_report()
            print(report)
            return True
            
        elif cmd_lower.startswith("toggle "):
            if len(cmd_parts) >= 2:
                feature = cmd_parts[1]
                result = self.toggle_feature(feature)
                print(result)
            else:
                print("❌ Usage: toggle <feature>")
                print("   Available features: caching, performance, context, knowledge")
            return True
            
        elif cmd_lower == "clear cache" or cmd_lower == "clearcache":
            result = self.clear_caches()
            print(result)
            return True
            
        elif cmd_lower == "clear memory" or cmd_lower == "clearmemory":
            result = self.clear_memory()
            print(result)
            return True
            
        elif cmd_lower.startswith("memory "):
            # Enhanced memory commands
            if not self.memory_enabled or not self.memory:
                print("Memory system not available. Memory features are disabled.")
                return True
                
            memory_cmd = cmd_lower[7:].strip()
            
            if memory_cmd == "status":
                status = self.get_memory_status()
                print(f"💾 {status}")
                
            elif memory_cmd == "stats":
                stats = self.memory.get_memory_stats()
                self._display_memory_stats(stats)
                
            elif memory_cmd.startswith("search "):
                query = memory_cmd[7:].strip()
                if query:
                    memories = self.memory.retrieve_memories(query, limit=5)
                    self._display_retrieved_memories(memories, query)
                else:
                    print("❌ Usage: memory search <query>")
                    
            elif memory_cmd.startswith("store "):
                content = memory_cmd[6:].strip()
                if content:
                    memory_id = self.memory.store_memory(content, MemoryType.FACT)
                    print(f"✅ Stored memory: {memory_id}")
                else:
                    print("❌ Usage: memory store <content>")
                    
            elif memory_cmd == "clear":
                if self.memory.clear_memories():
                    print("✅ All memories cleared")
                else:
                    print("❌ Failed to clear memories")
                    
            elif memory_cmd == "help":
                self._show_memory_help()
                
            else:
                # Default: search memories
                if memory_cmd:
                    memories = self.memory.retrieve_memories(memory_cmd, limit=5)
                    self._display_retrieved_memories(memories, memory_cmd)
                else:
                    status = self.get_memory_status()
                    print(f"💾 {status}")
            return True
            
        elif cmd_lower == "features":
            self.show_enhanced_features()
            return True
            
        elif cmd_lower.startswith("query "):
            query_text = command[6:].strip()  # Remove "query " prefix
            if query_text:
                knowledge_result = self.knowledge_system.query_knowledge(query_text)
                self.display_knowledge_result(knowledge_result)
            else:
                print("❌ Usage: query <your question>")
            return True
            
        # Not a special command
        return False
    
    def _display_memory_stats(self, stats: Dict[str, Any]):
        """Display formatted memory statistics"""
        print("\n💾 MEMORY SYSTEM STATISTICS")
        print("═" * 40)
        
        if "error" in stats:
            print(f"❌ Error: {stats['error']}")
            return
        
        total = stats.get('total_memories', 0)
        print(f"📊 Total Memories: {total}")
        
        # Display memory types
        types = stats.get('memory_types', {})
        if types:
            print("\n📂 Memory Types:")
            for memory_type, count in types.items():
                formatted_type = memory_type.replace('_', ' ').title()
                print(f"   • {formatted_type}: {count}")
        
        # Display topics
        topics = stats.get('topics', {})
        if topics:
            print("\n🏷️  Topics:")
            for topic, count in list(topics.items())[:5]:  # Show top 5
                print(f"   • {topic}: {count}")
            if len(topics) > 5:
                print(f"   ... and {len(topics) - 5} more topics")
        
        cached = stats.get('cached_schemas', 0)
        if cached:
            print(f"\n🧠 Cached Schemas: {cached}")
    
    def _display_retrieved_memories(self, memories: List[Dict[str, Any]], query: str):
        """Display retrieved memories in a formatted way"""
        print(f"\n🔍 MEMORIES FOR: '{query}'")
        print("═" * 50)
        
        if not memories:
            print("❌ No relevant memories found")
            return
        
        for i, memory in enumerate(memories, 1):
            content = memory.get('content', 'No content')
            memory_type = memory.get('memory_type', 'unknown').replace('_', ' ').title()
            relevance = memory.get('relevance_score', 0.0)
            importance = memory.get('importance_score', 0.0)
            topic = memory.get('topic', 'General')
            
            print(f"\n{i}. [{memory_type}] {content}")
            print(f"   📈 Relevance: {relevance:.2f} | ⭐ Importance: {importance:.2f}")
            if topic != 'General':
                print(f"   🏷️  Topic: {topic}")
            
            tags = memory.get('tags', [])
            if tags:
                print(f"   🏷️  Tags: {', '.join(tags[:3])}")
    
    def _show_memory_help(self):
        """Show memory command help"""
        help_text = """
💾 MEMORY SYSTEM COMMANDS
═══════════════════════════════════════

📊 INFORMATION:
   memory status    - Show memory system status
   memory stats     - Show detailed memory statistics
   
🔍 SEARCH & RETRIEVAL:
   memory search <query>   - Search memories by query
   memory <query>          - Quick memory search
   
📝 STORAGE:
   memory store <content>  - Manually store a memory
   
🧹 MAINTENANCE:
   memory clear     - Clear all memories (use with caution!)
   memory help      - Show this help message

💡 EXAMPLES:
   memory search python       - Find memories about Python
   memory status             - Show current memory stats
   memory store I prefer tea - Store a preference
   
═══════════════════════════════════════
🤖 Memories are automatically stored during conversations!
        """
        print(help_text)
    
    def show_enhanced_help(self):
        """Show enhanced help with all available commands"""
        help_text = """
🤖 NOVA AI - ENHANCED CHAT COMMANDS
═══════════════════════════════════════

📝 BASIC COMMANDS:
   help       - Show this help message
   clear      - Clear screen and restart chat
   switch     - Switch between terminal and transcript mode
   exit/quit  - Exit the chat

🚀 ENHANCED FEATURES:
   status     - Show comprehensive system status
   performance - Show detailed performance report  
   features   - Show all enhanced features status
   
🔧 FEATURE CONTROLS:
   toggle <feature> - Enable/disable features
                     Features: caching, performance, context, knowledge
   
💾 MEMORY SYSTEM:
   memory status    - Show memory system status
   memory stats     - Show detailed memory statistics
   memory search <query> - Search stored memories
   memory store <content> - Manually store a memory
   memory help      - Show memory commands help
   
🧹 MAINTENANCE:
   clear cache  - Clear all caches and temporary data
   clear memory - Clear all memory data (use with caution!)
   
📚 KNOWLEDGE SYSTEM:
   query <question> - Query specialized knowledge directly
   
💡 EXAMPLES:
   toggle caching     - Enable/disable smart response caching
   query what is AI   - Ask the specialized knowledge system
   performance        - See response times and optimization tips
   
═══════════════════════════════════════
💬 Just type naturally to chat with Nova AI!
        """
        print(help_text)
    
    def display_status(self, status: Dict[str, Any]):
        """Display formatted system status"""
        print("\n🚀 NOVA AI ENHANCED SYSTEM STATUS")
        print("═" * 50)
        
        # Enhanced features status
        features = status.get('enhanced_features', {})
        print("🛠️  ENHANCED FEATURES:")
        for feature, enabled in features.items():
            status_icon = "✅" if enabled else "❌"
            print(f"   {status_icon} {feature.replace('_', ' ').title()}")
        
        # Performance stats
        perf = status.get('performance', {})
        if perf and perf.get('total_responses', 0) > 0:
            print(f"\n⚡ PERFORMANCE:")
            print(f"   Response Time: {perf.get('avg_response_time', 0):.2f}s avg")
            print(f"   Total Responses: {perf.get('total_responses', 0)}")
            print(f"   Memory Usage: {perf.get('memory_usage_mb', 0):.1f}MB")
        
        # Cache stats
        cache = status.get('cache', {})
        if cache:
            print(f"\n💾 CACHE:")
            print(f"   Cached Responses: {cache.get('cache_size', 0)}")
            print(f"   Cache Hits: {cache.get('cache_hits', 0)}")
        
        # Knowledge stats
        knowledge = status.get('knowledge', {})
        if knowledge:
            print(f"\n📚 KNOWLEDGE BASE: ")
            print(f"   Domains: {', '.join(knowledge.get('domains', []))}")
            print(f"   Total Concepts: {knowledge.get('total_concepts', 0)}")
        
        print(f"\n🤖 System Mode: {status.get('mode', 'unknown')}")
        print(f"🎤 Voice Input: {'Enabled' if status.get('voice_input') else 'Disabled'}")
        print(f"🧠 Memory System: {'Available' if status.get('memory_system') else 'Unavailable'}")
        print("═" * 50)
    
    def show_enhanced_features(self):
        """Show detailed enhanced features information"""
        print("\n🚀 NOVA AI ENHANCED FEATURES")
        print("═" * 40)
        
        features_info = [
            ("🧠 Smart Context Understanding", 
             "Analyzes your intent and conversation flow", 
             self.enable_context_understanding),
            ("💾 Intelligent Caching", 
             "Speeds up responses for common queries", 
             self.enable_caching),
            ("📊 Performance Monitoring", 
             "Tracks response times and system resources", 
             self.enable_performance_monitoring),
            ("📚 Specialized Knowledge", 
             "Domain expertise in tech, science, business & health", 
             self.enable_specialized_knowledge),
        ]
        
        for name, description, enabled in features_info:
            status_icon = "✅" if enabled else "❌"
            print(f"{status_icon} {name}")
            print(f"   {description}")
            print()
        
        print("💡 Use 'toggle <feature>' to enable/disable features")
        print("   Example: toggle caching")
        print("═" * 40)
    
    def display_knowledge_result(self, result: Dict[str, Any]):
        """Display knowledge query results"""
        print(f"\n📚 KNOWLEDGE QUERY RESULT")
        print("═" * 30)
        print(f"🎯 Domain: {result.get('domain', 'Unknown')}")
        print(f"🎯 Query: {result.get('query', 'N/A')}")
        print(f"⚡ Confidence: {result.get('confidence', 0):.1%}")
        
        knowledge_items = result.get('knowledge', [])
        if knowledge_items:
            print(f"\n💡 FOUND {len(knowledge_items)} RELEVANT CONCEPTS:")
            for i, item in enumerate(knowledge_items, 1):
                print(f"\n{i}. 📖 {item.get('concept', 'Unknown')}")
                print(f"   {item.get('explanation', 'No explanation available')}")
        else:
            print("\n❌ No specific knowledge found for this query.")
            print("💬 Try asking Nova AI directly for a comprehensive response!")
        
        print("═" * 30)
    
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
                        logger.info(f"Session completed with {messages_in_session} messages stored in mem0.ai")
                    
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
                
                # Get response from API with enhanced context (don't stream to terminal)
                response = await self.get_response(messages, stream_to_terminal=False)
                
                if response:
                    # Display the response
                    print(self.display.format_message(response, "assistant"))
                    
                    # Update chat history
                    self.chat_history.extend([
                        {"role": "user", "content": user_input}, 
                        {"role": "assistant", "content": response}
                    ])
                    
                    # Keep chat history at a reasonable size
                    if len(self.chat_history) > 21:  # system prompt + 10 exchanges
                        # Keep system prompt and last 10 exchanges
                        self.chat_history = [self.chat_history[0]] + self.chat_history[-20:]
                    
                    # Store the conversation locally
                    self.files.store_conversation(user_input, response)
                    
                    # Store in mem0.ai cloud memory
                    self.store_conversation_memory(user_input, response)
                    
                    # Save updated chat history (only message content, not system prompt)
                    self.files.save_chat_history(self.chat_history[1:])
                    
                    # Increment session counter
                    messages_in_session += 1
                    
                    # Show the prompt for next input
                    print(">", end=" ", flush=True)
                
            except KeyboardInterrupt:
                logger.info("Received keyboard interrupt, exiting terminal chat...")
                logger.info(f"Session ended with {messages_in_session} messages stored in mem0.ai")
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
    
    def _process_news_query(self, message: str) -> Optional[str]:
        """Process news-related queries and return current news.
        
        Args:
            message: User message
            
        Returns:
            Optional[str]: News summary if query is news-related, None otherwise
        """
        if not self.news_system:
            return None
            
        # News query patterns - focusing on current news
        news_patterns = [
            r'news\s+(?:about|on|regarding)\s+([\w\s,.-]+)',
            r'what\s+(?:is|are)\s+(?:happening|going on)\s+(?:in|at|with)\s+([\w\s,.-]+)',
            r'(?:latest|recent|current)\s+news\s+(?:about|on|from)\s+([\w\s,.-]+)',
            r'tell me about\s+(?:the\s+)?news\s+(?:in|from|about)\s+([\w\s,.-]+)',
            r'(?:what|any)\s+news\s+(?:about|on|from)\s+([\w\s,.-]+)',
            r'(?:current|recent)\s+events\s+(?:in|from|about)\s+([\w\s,.-]+)',
            r'(?:what\s+happened|what\'s happening)\s+(?:in|at|with)\s+([\w\s,.-]+)',
            r'(?:is going on|going on)\s+(?:in|at|with)\s+([\w\s,.-]+)',
            r'news\s+(?:in|from|about)\s+([\w\s,.-]+)',
            r'(?:update|updates)\s+(?:on|about|from)\s+([\w\s,.-]+)',
            r'(?:headlines|breaking news)\s+(?:from|about|in)\s+([\w\s,.-]+)',
            # More flexible patterns
            r'give me news (?:about|on)\s+([\w\s,.-]+)',
            r'find news (?:about|on)\s+([\w\s,.-]+)',
            r'search news (?:about|on)\s+([\w\s,.-]+)',
            r'show me news (?:about|on)\s+([\w\s,.-]+)',
            r'i want news (?:about|on)\s+([\w\s,.-]+)',
            r'get me news (?:about|on)\s+([\w\s,.-]+)'
        ]
        
        # Check for general news requests
        general_news_patterns = [
            r'^(?:news|latest news|recent news|current news)$',
            r'^(?:what\'s|whats)\s+(?:happening|going on)(?:\s+today)?$',
            r'^(?:any|got any)\s+news\??$',
            r'^(?:tell me|give me)\s+(?:the\s+)?news$',
            r'^(?:what\'s|whats)\s+(?:new|the latest)$'
        ]
        
        try:
            # Check for specific news patterns
            for pattern in news_patterns:
                match = re.search(pattern, message.lower())
                if match:
                    topic = match.group(1).strip()
                    logger.info(f"📰 Processing news query for topic: {topic}")
                    
                    # Get current news summary
                    news_result = self.news_system.get_news_summary(
                        query=f"latest news about {topic}",
                        allow_source_selection=False  # Disable interactive source selection
                    )
                    
                    # Handle both string and dictionary responses
                    if news_result:
                        if isinstance(news_result, str):
                            # If it's a string, use it directly
                            current_date = datetime.now().strftime('%B %d, %Y')
                            response = f"📰 **Current News: {topic.title()}** ({current_date})\n\n{news_result}"
                            return response
                        elif isinstance(news_result, dict) and news_result.get('summary'):
                            # If it's a dictionary with summary
                            summary = news_result['summary']
                            sources = news_result.get('sources', [])
                            current_date = datetime.now().strftime('%B %d, %Y')
                            
                            response = f"📰 **Current News: {topic.title()}** ({current_date})\n\n{summary}"
                            
                            if sources:
                                source_names = [source.get('name', 'Unknown') for source in sources[:3]]
                                response += f"\n\n📍 **Sources:** {', '.join(source_names)}"
                            
                            return response
                    
                    return f"📰 I couldn't find recent news about {topic}. This might be because:\n• The topic is very specific or niche\n• There's no recent news coverage\n• The news API is temporarily unavailable\n\nTry asking about a broader topic or check back later."
            
            # Check for general news requests
            for pattern in general_news_patterns:
                if re.search(pattern, message.lower()):
                    logger.info("📰 Processing general news query")
                    
                    # Get general current news
                    news_result = self.news_system.get_news_summary(
                        query="latest breaking news today",
                        allow_source_selection=False
                    )
                    
                    # Handle both string and dictionary responses
                    if news_result:
                        if isinstance(news_result, str):
                            # If it's a string, use it directly
                            current_date = datetime.now().strftime('%B %d, %Y')
                            response = f"📰 **Latest News Summary** ({current_date})\n\n{news_result}"
                            return response
                        elif isinstance(news_result, dict) and news_result.get('summary'):
                            # If it's a dictionary with summary
                            summary = news_result['summary']
                            sources = news_result.get('sources', [])
                            current_date = datetime.now().strftime('%B %d, %Y')
                            
                            response = f"📰 **Latest News Summary** ({current_date})\n\n{summary}"
                            
                            if sources:
                                source_names = [source.get('name', 'Unknown') for source in sources[:3]]
                                response += f"\n\n📍 **Sources:** {', '.join(source_names)}"
                            
                            return response
                    
                    return f"📰 I couldn't retrieve the latest news right now. This might be due to:\n• Temporary API issues\n• Network connectivity problems\n• Rate limiting\n\nPlease try again in a few moments."
            
        except Exception as e:
            logger.error(f"Error processing news query: {e}")
            return f"❌ Sorry, I encountered an error while getting the news: {str(e)}\n\nPlease try again or ask about a different topic."
        
        return None
    
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
    """Main function to run the enhanced chatbot."""
    try:
        # Parse command line arguments
        import argparse
        parser = argparse.ArgumentParser(
            description="Nova AI - Enhanced Human-like AI Assistant with Performance Optimization",
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog="""
ENHANCED FEATURES:
  * Smart response caching for faster interactions
  * Real-time performance monitoring and optimization
  * Advanced context understanding with intent analysis
  * Specialized knowledge base for technical domains
  * Voice input support with automatic transcription
  * Interactive command system with status reporting

EXAMPLES:
  python nova_ai.py --mode terminal --enable-all
  python nova_ai.py --voice --performance-mode
  python nova_ai.py --disable-cache --enable-knowledge
            """
        )
        
        # Mode and basic options
        parser.add_argument("--mode", choices=["terminal", "transcript"], default="terminal",
                            help="Chat mode: terminal for direct interaction, transcript for processing from file")
        parser.add_argument("--api-key", help="GROQ API key (overrides environment variable)")
        parser.add_argument("--voice", action="store_true", help="Enable voice input mode")
        
        # Enhanced feature toggles
        parser.add_argument("--enable-all", action="store_true", 
                            help="Enable all enhanced features (recommended)")
        parser.add_argument("--performance-mode", action="store_true",
                            help="Enable performance monitoring and optimization")
        parser.add_argument("--disable-cache", action="store_true",
                            help="Disable smart response caching")
        parser.add_argument("--disable-context", action="store_true",
                            help="Disable context understanding")
        parser.add_argument("--disable-knowledge", action="store_true",
                            help="Disable specialized knowledge system")
        parser.add_argument("--disable-performance", action="store_true",
                            help="Disable performance monitoring")
        
        # Advanced options
        parser.add_argument("--cache-size", type=int, default=1000,
                            help="Maximum cache size (default: 1000)")
        parser.add_argument("--fast-mode", action="store_true",
                            help="Optimize for maximum speed (may reduce some features)")
        parser.add_argument("--debug", action="store_true",
                            help="Enable debug logging for troubleshooting")
        
        args = parser.parse_args()
        
        # Configure logging level
        if args.debug:
            logging.getLogger().setLevel(logging.DEBUG)
            logger.info("🔧 Debug logging enabled")
        
        # Initialize the chatbot
        chatbot = AleChatBot(api_key=args.api_key)
        
        # Configure enhanced features based on arguments
        if args.enable_all:
            chatbot.enable_caching = True
            chatbot.enable_performance_monitoring = True
            chatbot.enable_context_understanding = True
            chatbot.enable_specialized_knowledge = True
            logger.info("All enhanced features enabled")
        
        elif args.performance_mode:
            chatbot.enable_performance_monitoring = True
            chatbot.enable_caching = True
            logger.info("Performance mode enabled")
        
        elif args.fast_mode:
            # Optimize for speed
            chatbot.enable_caching = True
            chatbot.enable_performance_monitoring = True
            chatbot.enable_context_understanding = False
            chatbot.enable_specialized_knowledge = False
            logger.info("Fast mode enabled - some features disabled for speed")
        
        # Apply specific disable flags
        if args.disable_cache:
            chatbot.enable_caching = False
            logger.info("Caching disabled")
        
        if args.disable_context:
            chatbot.enable_context_understanding = False
            logger.info("Context understanding disabled")
        
        if args.disable_knowledge:
            chatbot.enable_specialized_knowledge = False
            logger.info("Specialized knowledge disabled")
        
        if args.disable_performance:
            chatbot.enable_performance_monitoring = False
            logger.info("Performance monitoring disabled")
        
        # Configure cache size
        if args.cache_size != 1000:
            chatbot.smart_cache.max_cache_size = args.cache_size
            logger.info(f"Cache size set to {args.cache_size}")
        
        # Set voice input mode
        chatbot.voice_input_mode = args.voice
        
        # If voice mode is enabled, force transcript mode
        if args.voice:
            chatbot.mode = "transcript"
            logger.info("Voice input mode activated. Using transcript mode to process speech.")
        else:
            chatbot.mode = args.mode
        
        # Show boot sequence
        print("[BOOT] Initializing system modules...")
        
        # Check memory status
        if chatbot.memory_enabled:
            print("[OK  ] Memory module online")
        else:
            print("[FAIL] Memory module offline")
        
        # Check cache status (simulate cache log restore)
        try:
            # Try to read cache log (this will likely fail on first run)
            with open("cache.log", "r") as f:
                json.load(f)
            print("[OK  ] Cache log restored")
        except:
            print("[FAIL] Cache log restore: Invalid JSON (line 1, col 1)")
        
        # Show terminal interface
        print("┌────────────────────────────────────────────────────────────┐")
        print("│                     N O V A   A I   ⬤  TERMINUS             │")
        print("├────────────────────────────────────────────────────────────┤")
        print(f"│ MODE      : {chatbot.mode.upper():<13}        MEMORY     : {'ENABLED' if chatbot.memory_enabled else 'DISABLED'}       │")
        print(f"│ VOICE     : {'ENABLED' if chatbot.voice_input_mode else 'DISABLED'}             CACHE      : {'ACTIVE' if chatbot.enable_caching else 'INACTIVE'}        │")
        print(f"│ USER      : twuma                THREAD     : MAIN          │")
        
        # Calculate uptime (will be 0 at start)
        import time
        start_time = time.time()
        uptime_seconds = int(time.time() - start_time)
        hours = uptime_seconds // 3600
        minutes = (uptime_seconds % 3600) // 60
        seconds = uptime_seconds % 60
        uptime_str = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        
        print(f"│ UPTIME    : {uptime_str}             CORE       : ASTRA v1.2    │")
        print("└────────────────────────────────────────────────────────────┘")
        print("Available commands: `help`, `status`, `memory`, `exit`")
        
        # Run the chatbot
        await chatbot.run()
        
    except KeyboardInterrupt:
        print("\nGoodbye! Thanks for chatting!")
    except Exception as e:
        logger.error(f"Fatal error in main: {str(e)}")
        logger.error(traceback.format_exc())


def test_enhanced_features():
    """Quick test of enhanced features"""
    print("Testing Enhanced Features...")
    
    try:
        # Test smart cache
        cache = SmartCacheSystem(max_cache_size=10)
        test_messages = [{"role": "user", "content": "Hello world"}]
        cache.cache_response(test_messages, "Hello there!")
        cached = cache.get_cached_response(test_messages)
        assert cached == "Hello there!", "Cache test failed"
        print("  [OK] Smart Cache System")
        
        # Test performance monitor
        monitor = PerformanceMonitor()
        test_metrics = ResponseMetrics(
            response_time=1.5,
            token_count=25,
            model_used="test",
            timestamp=datetime.now()
        )
        monitor.record_response_metrics(test_metrics)
        stats = monitor.get_performance_stats()
        assert stats['total_responses'] == 1, "Performance monitor test failed"
        print("  [OK] Performance Monitor")
        
        # Test context system
        context = EnhancedContextSystem()
        result = context.process_user_input("What is machine learning?")
        assert 'intent' in result, "Context system test failed"
        print("  [OK] Enhanced Context System")
        
        # Test knowledge system
        knowledge = SpecializedKnowledgeSystem()
        result = knowledge.query_knowledge("What is an API?")
        assert result.get('domain'), "Knowledge system test failed"
        print("  [OK] Specialized Knowledge System")
        
        print("SUCCESS: All enhanced features working correctly!")
        return True
        
    except Exception as e:
        print(f"ERROR: Feature test failed: {e}")
        return False

if __name__ == "__main__":
    # Run feature test if --test argument is provided
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        if test_enhanced_features():
            print("\nSUCCESS: Nova AI enhanced features are ready!")
            print("Run without --test to start chatting:")
            print("   python nova_ai.py")
            print("   python nova_ai.py --enable-all")
            print("   python nova_ai.py --voice")
        else:
            print("\nERROR: Some features may not work correctly.")
            print("Try running with basic features: python nova_ai.py --fast-mode")
    else:
        # Normal startup
        asyncio.run(main())
