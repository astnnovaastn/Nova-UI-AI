#!/usr/bin/env python3
"""
Content Analysis System for Nova AI
==================================

This system allows Nova AI to internally analyze and comprehend search results
and news content before presenting it to users, enabling natural follow-up
discussions and contextual understanding.

Features:
- Internal content analysis and comprehension
- Contextual understanding maintenance
- Follow-up question handling
- Content discussion capabilities
"""

import json
import os
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
import re

logger = logging.getLogger(__name__)

@dataclass
class ContentAnalysis:
    """Represents an analysis of retrieved content"""
    content_id: str
    content_type: str  # 'search' or 'news'
    query: str
    raw_content: str
    analyzed_content: Dict[str, Any]
    key_points: List[str]
    topics: List[str]
    sentiment: str
    complexity_level: str
    timestamp: datetime
    user_context: Dict[str, Any] = field(default_factory=dict)

class ContentAnalysisSystem:
    """
    System for analyzing and maintaining contextual understanding of retrieved content
    """
    
    def __init__(self, storage_file: str = "content_analysis.json"):
        self.storage_file = storage_file
        self.current_analyses: Dict[str, ContentAnalysis] = {}
        self.analysis_history: List[ContentAnalysis] = []
        self.load_analysis_data()
        
        logger.info("[OK] Content Analysis System initialized")
    
    def analyze_search_content(self, query: str, search_results: str, user_context: Dict[str, Any] = None) -> ContentAnalysis:
        """
        Analyze search results content for internal comprehension
        
        Args:
            query: The search query
            search_results: The formatted search results
            user_context: Additional context about the user
            
        Returns:
            ContentAnalysis object with comprehensive analysis
        """
        content_id = f"search_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Extract key information from search results
        analysis = self._perform_content_analysis(search_results, "search")
        
        # Create analysis object
        content_analysis = ContentAnalysis(
            content_id=content_id,
            content_type="search",
            query=query,
            raw_content=search_results,
            analyzed_content=analysis,
            key_points=self._extract_key_points(search_results),
            topics=self._extract_topics(query, search_results),
            sentiment=self._analyze_sentiment(search_results),
            complexity_level=self._assess_complexity(search_results),
            timestamp=datetime.now(),
            user_context=user_context or {}
        )
        
        # Store for future reference
        self.current_analyses[content_id] = content_analysis
        self.analysis_history.append(content_analysis)
        self.save_analysis_data()
        
        logger.info(f"[ANALYSIS] Search content analyzed: {query}")
        return content_analysis
    
    def analyze_news_content(self, query: str, news_results: str, user_context: Dict[str, Any] = None) -> ContentAnalysis:
        """
        Analyze news content for internal comprehension
        
        Args:
            query: The news query
            news_results: The formatted news results
            user_context: Additional context about the user
            
        Returns:
            ContentAnalysis object with comprehensive analysis
        """
        content_id = f"news_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Extract key information from news results
        analysis = self._perform_content_analysis(news_results, "news")
        
        # Create analysis object
        content_analysis = ContentAnalysis(
            content_id=content_id,
            content_type="news",
            query=query,
            raw_content=news_results,
            analyzed_content=analysis,
            key_points=self._extract_key_points(news_results),
            topics=self._extract_topics(query, news_results),
            sentiment=self._analyze_sentiment(news_results),
            complexity_level=self._assess_complexity(news_results),
            timestamp=datetime.now(),
            user_context=user_context or {}
        )
        
        # Store for future reference
        self.current_analyses[content_id] = content_analysis
        self.analysis_history.append(content_analysis)
        self.save_analysis_data()
        
        logger.info(f"[ANALYSIS] News content analyzed: {query}")
        return content_analysis
    
    def _perform_content_analysis(self, content: str, content_type: str) -> Dict[str, Any]:
        """Perform detailed analysis of content"""
        analysis = {
            "word_count": len(content.split()),
            "sections": self._identify_sections(content),
            "entities": self._extract_entities(content),
            "facts": self._extract_facts(content),
            "opinions": self._extract_opinions(content),
            "statistics": self._extract_statistics(content),
            "sources": self._extract_sources(content),
            "main_themes": self._identify_themes(content),
            "content_structure": self._analyze_structure(content, content_type)
        }
        
        return analysis
    
    def _extract_key_points(self, content: str) -> List[str]:
        """Extract key points from content"""
        key_points = []
        
        # Look for bullet points or numbered lists
        bullet_pattern = r'[•▪▫◦‣⁃]\s*(.+)'
        numbered_pattern = r'\d+\.\s*(.+)'
        
        bullets = re.findall(bullet_pattern, content)
        numbered = re.findall(numbered_pattern, content)
        
        key_points.extend(bullets[:5])  # Top 5 bullet points
        key_points.extend(numbered[:5])  # Top 5 numbered points
        
        # Extract sentences with key indicators
        key_indicators = [
            "most important", "key finding", "main point", "crucial", "significant",
            "notable", "primary", "essential", "critical", "major"
        ]
        
        sentences = re.split(r'[.!?]+', content)
        for sentence in sentences:
            sentence = sentence.strip()
            if any(indicator in sentence.lower() for indicator in key_indicators):
                if len(sentence) > 20 and len(sentence) < 200:
                    key_points.append(sentence)
        
        return key_points[:10]  # Return top 10 key points
    
    def _extract_topics(self, query: str, content: str) -> List[str]:
        """Extract main topics from content"""
        topics = []
        
        # Add query terms as topics
        query_words = [word.lower() for word in query.split() if len(word) > 3]
        topics.extend(query_words)
        
        # Extract capitalized terms (likely proper nouns/topics)
        capitalized_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b'
        capitalized_terms = re.findall(capitalized_pattern, content)
        
        # Filter and add relevant capitalized terms
        for term in capitalized_terms:
            if len(term) > 3 and term not in topics:
                topics.append(term.lower())
        
        return topics[:15]  # Return top 15 topics
    
    def _analyze_sentiment(self, content: str) -> str:
        """Analyze sentiment of content"""
        positive_words = [
            "good", "great", "excellent", "positive", "success", "achievement",
            "improvement", "growth", "benefit", "advantage", "progress", "breakthrough"
        ]
        
        negative_words = [
            "bad", "terrible", "negative", "failure", "problem", "issue", "crisis",
            "decline", "loss", "disadvantage", "concern", "risk", "threat", "challenge"
        ]
        
        neutral_words = [
            "report", "study", "analysis", "research", "data", "information",
            "statement", "announcement", "update", "development"
        ]
        
        content_lower = content.lower()
        
        positive_count = sum(1 for word in positive_words if word in content_lower)
        negative_count = sum(1 for word in negative_words if word in content_lower)
        neutral_count = sum(1 for word in neutral_words if word in content_lower)
        
        if positive_count > negative_count and positive_count > neutral_count:
            return "positive"
        elif negative_count > positive_count and negative_count > neutral_count:
            return "negative"
        else:
            return "neutral"
    
    def _assess_complexity(self, content: str) -> str:
        """Assess complexity level of content"""
        words = content.split()
        sentences = re.split(r'[.!?]+', content)
        
        avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
        avg_sentence_length = sum(len(sentence.split()) for sentence in sentences) / len(sentences) if sentences else 0
        
        # Count technical terms (words with 8+ characters)
        technical_terms = [word for word in words if len(word) >= 8]
        technical_ratio = len(technical_terms) / len(words) if words else 0
        
        if avg_word_length > 6 and avg_sentence_length > 20 and technical_ratio > 0.15:
            return "high"
        elif avg_word_length > 5 and avg_sentence_length > 15 and technical_ratio > 0.1:
            return "medium"
        else:
            return "low"
    
    def _identify_sections(self, content: str) -> List[str]:
        """Identify main sections in content"""
        sections = []
        
        # Look for section headers
        section_patterns = [
            r'^([A-Z][^.!?]*?)$',  # All caps lines
            r'^([A-Z][a-z\s]+)$',  # Title case lines
            r'^\s*([A-Z][^.!?]*?)\s*$'  # Standalone lines
        ]
        
        lines = content.split('\n')
        for line in lines:
            line = line.strip()
            if len(line) > 5 and len(line) < 100:
                for pattern in section_patterns:
                    if re.match(pattern, line):
                        sections.append(line)
                        break
        
        return sections[:10]  # Return top 10 sections
    
    def _extract_entities(self, content: str) -> List[str]:
        """Extract named entities from content"""
        # Simple entity extraction - look for capitalized words/phrases
        entity_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b'
        entities = re.findall(entity_pattern, content)
        
        # Filter out common words
        common_words = {'The', 'This', 'That', 'These', 'Those', 'And', 'But', 'Or', 'So'}
        entities = [entity for entity in entities if entity not in common_words]
        
        return list(set(entities))[:20]  # Return unique entities, max 20
    
    def _extract_facts(self, content: str) -> List[str]:
        """Extract factual statements from content"""
        facts = []
        
        # Look for sentences with factual indicators
        fact_indicators = [
            "according to", "research shows", "study found", "data indicates",
            "statistics show", "report states", "analysis reveals", "evidence suggests"
        ]
        
        sentences = re.split(r'[.!?]+', content)
        for sentence in sentences:
            sentence = sentence.strip()
            if any(indicator in sentence.lower() for indicator in fact_indicators):
                if len(sentence) > 20:
                    facts.append(sentence)
        
        return facts[:10]  # Return top 10 facts
    
    def _extract_opinions(self, content: str) -> List[str]:
        """Extract opinion statements from content"""
        opinions = []
        
        # Look for sentences with opinion indicators
        opinion_indicators = [
            "believe", "think", "opinion", "view", "perspective", "argue",
            "suggest", "recommend", "should", "could", "might", "may"
        ]
        
        sentences = re.split(r'[.!?]+', content)
        for sentence in sentences:
            sentence = sentence.strip()
            if any(indicator in sentence.lower() for indicator in opinion_indicators):
                if len(sentence) > 20:
                    opinions.append(sentence)
        
        return opinions[:10]  # Return top 10 opinions
    
    def _extract_statistics(self, content: str) -> List[str]:
        """Extract statistical information from content"""
        statistics = []
        
        # Look for numbers with units or percentages
        stat_patterns = [
            r'\d+(?:\.\d+)?%',  # Percentages
            r'\$\d+(?:,\d{3})*(?:\.\d{2})?',  # Money
            r'\d+(?:,\d{3})*(?:\.\d+)?\s+(?:million|billion|thousand)',  # Large numbers
            r'\d+(?:\.\d+)?\s+(?:years?|months?|days?|hours?)',  # Time periods
        ]
        
        for pattern in stat_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            statistics.extend(matches)
        
        return list(set(statistics))[:15]  # Return unique statistics, max 15
    
    def _extract_sources(self, content: str) -> List[str]:
        """Extract source information from content"""
        sources = []
        
        # Look for source patterns
        if "Sources" in content:
            sources_section = content.split("Sources")[-1]
            # Extract source names
            source_lines = sources_section.split('\n')[:5]  # First 5 lines after Sources
            for line in source_lines:
                line = line.strip()
                if line and len(line) > 3:
                    sources.append(line)
        
        return sources
    
    def _identify_themes(self, content: str) -> List[str]:
        """Identify main themes in content"""
        themes = []
        
        # Common theme keywords
        theme_keywords = {
            "technology": ["technology", "tech", "digital", "AI", "artificial intelligence", "software", "hardware"],
            "politics": ["politics", "government", "election", "policy", "political", "congress", "senate"],
            "economy": ["economy", "economic", "finance", "financial", "market", "business", "trade"],
            "health": ["health", "medical", "healthcare", "medicine", "disease", "treatment", "hospital"],
            "environment": ["environment", "climate", "environmental", "green", "sustainability", "pollution"],
            "science": ["science", "research", "study", "scientific", "discovery", "experiment", "analysis"],
            "education": ["education", "school", "university", "learning", "student", "academic", "teaching"],
            "sports": ["sports", "game", "team", "player", "championship", "competition", "athletic"]
        }
        
        content_lower = content.lower()
        
        for theme, keywords in theme_keywords.items():
            if any(keyword in content_lower for keyword in keywords):
                themes.append(theme)
        
        return themes
    
    def _analyze_structure(self, content: str, content_type: str) -> Dict[str, Any]:
        """Analyze the structure of content"""
        structure = {
            "has_sections": "Direct Answer" in content and "Sources" in content,
            "section_count": len(re.findall(r'^[A-Z][^.!?]*?$', content, re.MULTILINE)),
            "paragraph_count": len(content.split('\n\n')),
            "line_count": len(content.split('\n')),
            "content_type": content_type,
            "is_structured": content_type in ["search", "news"] and "Direct Answer" in content
        }
        
        return structure

    def get_recent_analysis(self, content_type: str = None, limit: int = 5) -> List[ContentAnalysis]:
        """Get recent content analyses"""
        analyses = self.analysis_history

        if content_type:
            analyses = [a for a in analyses if a.content_type == content_type]

        # Sort by timestamp (most recent first)
        analyses.sort(key=lambda x: x.timestamp, reverse=True)

        return analyses[:limit]

    def find_analysis_by_query(self, query: str) -> Optional[ContentAnalysis]:
        """Find analysis by query"""
        query_lower = query.lower()

        for analysis in reversed(self.analysis_history):  # Search most recent first
            if query_lower in analysis.query.lower():
                return analysis

        return None

    def get_analysis_summary(self, analysis: ContentAnalysis) -> str:
        """Get a summary of the analysis for AI discussion"""
        summary_parts = []

        # Basic info
        summary_parts.append(f"Content Type: {analysis.content_type.title()}")
        summary_parts.append(f"Query: {analysis.query}")
        summary_parts.append(f"Analyzed: {analysis.timestamp.strftime('%Y-%m-%d %H:%M')}")

        # Key insights
        if analysis.key_points:
            summary_parts.append(f"Key Points: {'; '.join(analysis.key_points[:3])}")

        if analysis.topics:
            summary_parts.append(f"Main Topics: {', '.join(analysis.topics[:5])}")

        summary_parts.append(f"Sentiment: {analysis.sentiment.title()}")
        summary_parts.append(f"Complexity: {analysis.complexity_level.title()}")

        # Content insights
        if analysis.analyzed_content.get('facts'):
            summary_parts.append(f"Facts Found: {len(analysis.analyzed_content['facts'])}")

        if analysis.analyzed_content.get('statistics'):
            summary_parts.append(f"Statistics: {', '.join(analysis.analyzed_content['statistics'][:3])}")

        return " | ".join(summary_parts)

    def can_discuss_topic(self, topic: str) -> Tuple[bool, Optional[ContentAnalysis]]:
        """Check if AI can discuss a topic based on recent analyses"""
        topic_lower = topic.lower()

        # Check recent analyses for relevant content
        for analysis in reversed(self.analysis_history[-10:]):  # Check last 10 analyses
            # Check query
            if topic_lower in analysis.query.lower():
                return True, analysis

            # Check topics
            if any(topic_lower in t.lower() for t in analysis.topics):
                return True, analysis

            # Check key points
            if any(topic_lower in kp.lower() for kp in analysis.key_points):
                return True, analysis

        return False, None

    def generate_discussion_context(self, analysis: ContentAnalysis) -> str:
        """Generate context for AI to discuss the analyzed content"""
        context_parts = []

        context_parts.append(f"I previously analyzed {analysis.content_type} content about '{analysis.query}'.")

        # Add key insights
        if analysis.key_points:
            context_parts.append(f"The main points I found were: {'; '.join(analysis.key_points[:3])}.")

        # Add sentiment and complexity
        context_parts.append(f"The content had a {analysis.sentiment} tone and {analysis.complexity_level} complexity level.")

        # Add specific insights based on content type
        if analysis.content_type == "search":
            context_parts.append("This was from a web search, so it represents current information available online.")
        elif analysis.content_type == "news":
            context_parts.append("This was from news sources, so it represents current events and reporting.")

        # Add topics for context
        if analysis.topics:
            context_parts.append(f"The main topics covered were: {', '.join(analysis.topics[:5])}.")

        # Add any statistics or facts
        if analysis.analyzed_content.get('statistics'):
            stats = analysis.analyzed_content['statistics'][:2]
            context_parts.append(f"Some key statistics mentioned: {', '.join(stats)}.")

        return " ".join(context_parts)

    def save_analysis_data(self):
        """Save analysis data to file"""
        try:
            # Convert analyses to serializable format
            data = {
                "analyses": [
                    {
                        "content_id": a.content_id,
                        "content_type": a.content_type,
                        "query": a.query,
                        "raw_content": a.raw_content[:1000],  # Truncate for storage
                        "analyzed_content": a.analyzed_content,
                        "key_points": a.key_points,
                        "topics": a.topics,
                        "sentiment": a.sentiment,
                        "complexity_level": a.complexity_level,
                        "timestamp": a.timestamp.isoformat(),
                        "user_context": a.user_context
                    }
                    for a in self.analysis_history[-50:]  # Keep last 50 analyses
                ],
                "last_updated": datetime.now().isoformat()
            }

            with open(self.storage_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

        except Exception as e:
            logger.error(f"[ERROR] Failed to save analysis data: {e}")

    def load_analysis_data(self):
        """Load analysis data from file"""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                # Convert back to ContentAnalysis objects
                for item in data.get("analyses", []):
                    analysis = ContentAnalysis(
                        content_id=item["content_id"],
                        content_type=item["content_type"],
                        query=item["query"],
                        raw_content=item["raw_content"],
                        analyzed_content=item["analyzed_content"],
                        key_points=item["key_points"],
                        topics=item["topics"],
                        sentiment=item["sentiment"],
                        complexity_level=item["complexity_level"],
                        timestamp=datetime.fromisoformat(item["timestamp"]),
                        user_context=item.get("user_context", {})
                    )
                    self.analysis_history.append(analysis)

                logger.info(f"[OK] Loaded {len(self.analysis_history)} content analyses")

        except Exception as e:
            logger.error(f"[ERROR] Failed to load analysis data: {e}")
            self.analysis_history = []

    def clear_old_analyses(self, days_old: int = 30):
        """Clear analyses older than specified days"""
        cutoff_date = datetime.now().timestamp() - (days_old * 24 * 60 * 60)

        self.analysis_history = [
            a for a in self.analysis_history
            if a.timestamp.timestamp() > cutoff_date
        ]

        # Update current analyses
        self.current_analyses = {
            k: v for k, v in self.current_analyses.items()
            if v.timestamp.timestamp() > cutoff_date
        }

        self.save_analysis_data()
        logger.info(f"[CLEANUP] Cleared analyses older than {days_old} days")
