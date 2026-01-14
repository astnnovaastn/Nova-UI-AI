#!/usr/bin/env python3
"""
Enhanced News System for Nova AI
===============================

Enhanced news system that returns results in the same structured format
as the search system for consistency across all information retrieval systems.

Features:
- Structured news format matching search system
- Comprehensive sections: Direct Answer, Additional Information, Background, etc.
- Clean text formatting without ** symbols
- Integration with existing news sources
- Memory system integration for personalized news
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import re

# Import existing news system
try:
    from news_summary import NewsSummarySystem
    NEWS_SYSTEM_AVAILABLE = True
except ImportError:
    try:
        from astra_ai.services.news_summary import NewsSummarySystem
        NEWS_SYSTEM_AVAILABLE = True
    except ImportError:
        NEWS_SYSTEM_AVAILABLE = False
        NewsSummarySystem = None

logger = logging.getLogger(__name__)

class EnhancedNewsSystem:
    """
    Enhanced news system with structured output format matching search system
    """
    
    def __init__(self, memory_system=None):
        """Initialize the enhanced news system"""
        self.memory_system = memory_system
        
        # Initialize underlying news system
        if NEWS_SYSTEM_AVAILABLE:
            try:
                self.news_system = NewsSummarySystem()
                self.is_available = True
                logger.info("[OK] Enhanced news system initialized")
            except Exception as e:
                logger.error(f"[ERROR] Failed to initialize news system: {e}")
                self.news_system = None
                self.is_available = False
        else:
            self.news_system = None
            self.is_available = False
            logger.warning("[WARN] News system not available")
    
    def get_structured_news(self, query: str, source: str = None, allow_source_selection: bool = False) -> str:
        """
        Get news in structured format matching search system

        Args:
            query: News query/topic
            source: Optional specific news source
            allow_source_selection: Whether to allow interactive source selection

        Returns:
            Structured news response matching search format
        """
        if not self.is_available:
            return "NEWS_RESULT\n\nDirect Answer\nNews system is currently unavailable. Please try again later.\n"

        try:
            # Get news from underlying system
            if source:
                # Specific source requested
                news_result = self.news_system.get_news_summary(
                    query=f"{query} from {source}",
                    allow_source_selection=False  # Don't show source selection for specific requests
                )
            else:
                # General query - get comprehensive coverage
                news_result = self.news_system.get_news_summary(
                    query=query,
                    allow_source_selection=allow_source_selection
                )

            # Handle different response types
            if not news_result:
                return self._create_no_results_response(query)

            # Handle string responses (simple summary)
            if isinstance(news_result, str):
                # Create a mock dictionary structure for consistent processing
                mock_result = {
                    'summary': news_result,
                    'articles': [],
                    'sources': [{'name': source or 'Multiple Sources'}],
                    'topic': query,
                    'date_range': datetime.now().strftime('%B %d, %Y')
                }
                return self._format_structured_news(mock_result, query, source)

            # Handle dictionary responses
            elif isinstance(news_result, dict):
                # Check if it has the expected structure
                if news_result.get('summary') or news_result.get('articles'):
                    return self._format_structured_news(news_result, query, source)
                else:
                    # Handle unexpected dictionary structure
                    summary = str(news_result)
                    mock_result = {
                        'summary': summary,
                        'articles': [],
                        'sources': [{'name': source or 'Multiple Sources'}],
                        'topic': query,
                        'date_range': datetime.now().strftime('%B %d, %Y')
                    }
                    return self._format_structured_news(mock_result, query, source)

            # Handle other response types
            else:
                return self._create_no_results_response(query)

        except Exception as e:
            logger.error(f"[ERROR] News retrieval failed: {e}")
            return self._create_error_response(query, str(e))
    
    def _format_structured_news(self, news_result: Dict[str, Any], query: str, source: str = None) -> str:
        """Format news result in structured format matching search system exactly"""

        # Extract information
        summary = news_result.get('summary', '')
        articles = news_result.get('articles', [])
        sources = news_result.get('sources', [])
        topic = news_result.get('topic', query)
        date_range = news_result.get('date_range', datetime.now().strftime('%B %d, %Y'))

        # Build structured response matching search system format exactly
        response_parts = []

        # Header
        response_parts.append("NEWS_RESULT\n")

        # Direct Answer Section
        direct_answer = self._create_direct_answer(summary, topic, date_range)
        response_parts.append(f"Direct Answer\n{direct_answer}\n")

        # Additional Information Section
        additional_info = self._create_additional_information(articles, sources)
        response_parts.append(f"Additional Information\n{additional_info}\n")

        # Background / Origins Section
        background = self._create_background_section(articles, topic)
        response_parts.append(f"Background / Origins\n{background}\n")

        # Current Relevance Section
        relevance = self._create_current_relevance(articles, topic, date_range)
        response_parts.append(f"Current Relevance\n{relevance}\n")

        # Key Facts / Statistics Section
        key_facts = self._create_key_facts(articles, summary)
        response_parts.append(f"Key Facts / Statistics\n{key_facts}\n")

        # Comparisons & Related Information Section
        comparisons = self._create_comparisons_section(articles, topic)
        response_parts.append(f"Comparisons & Related Information\n{comparisons}\n")

        # Applications & Use Cases Section
        applications = self._create_applications_section(articles, topic)
        response_parts.append(f"Applications & Use Cases\n{applications}\n")

        # Challenges, Criticisms, or Controversies Section
        challenges = self._create_challenges_section(articles, topic)
        response_parts.append(f"Challenges, Criticisms, or Controversies\n{challenges}\n")

        # Future Developments / Trends Section
        future_trends = self._create_future_trends_section(articles, topic)
        response_parts.append(f"Future Developments / Trends\n{future_trends}\n")

        # Public / Expert Response Section
        public_response = self._create_public_response_section(articles, topic)
        response_parts.append(f"Public / Expert Response\n{public_response}\n")

        # Impact & Implications Section
        impact = self._create_impact_section(articles, topic)
        response_parts.append(f"Impact & Implications\n{impact}\n")

        # Human Angle / Compassion Section
        human_angle = self._create_human_angle_section(articles, topic)
        response_parts.append(f"Human Angle / Compassion\n{human_angle}\n")

        # Myths vs Facts Section (if needed)
        myths_facts = self._create_myths_facts_section(articles, topic)
        if myths_facts:
            response_parts.append(f"Myths vs Facts\n{myths_facts}\n")

        # FAQ / Likely Questions Section
        faq = self._create_faq_section(articles, topic)
        response_parts.append(f"FAQ / Likely Questions\n{faq}\n")

        # Conclusion / Takeaway Section
        conclusion = self._create_conclusion_section(summary, topic, articles)
        response_parts.append(f"Conclusion / Takeaway\n{conclusion}\n")

        # Sources Section
        sources_section = self._create_sources_section(sources, articles)
        response_parts.append(f"Sources\n{sources_section}")

        return "\n".join(response_parts)
    
    def _create_direct_answer(self, summary: str, topic: str, date_range: str) -> str:
        """Create direct answer section"""
        # Clean summary of markdown formatting and emojis
        clean_summary = self._clean_text(summary)

        # Create concise direct answer
        sentences = re.split(r'[.!?]+', clean_summary)
        key_sentences = [s.strip() for s in sentences if len(s.strip()) > 20][:2]  # Top 2 sentences

        direct_answer = f"Latest news on {topic} as of {date_range}:\n\n"

        if key_sentences:
            for sentence in key_sentences:
                if sentence:
                    direct_answer += f"{sentence}.\n"
        else:
            direct_answer += clean_summary[:200] + "..."

        return direct_answer.strip()
    
    def _create_additional_information(self, articles: List[Dict], sources: List[Dict]) -> str:
        """Create additional information section"""
        additional_info = []

        # Extract key details from articles
        for article in articles[:3]:  # Top 3 articles
            title = article.get('title', '')
            description = article.get('description', '')

            if title and description:
                clean_title = self._clean_text(title)
                clean_desc = self._clean_text(description)

                if len(clean_desc) > 100:
                    clean_desc = clean_desc[:97] + "..."

                additional_info.append(f"{clean_title}: {clean_desc}")

        if additional_info:
            return "\n".join(additional_info)

        return "Additional context and details are being gathered from multiple news sources to provide comprehensive coverage of this developing story."
    
    def _create_background_section(self, articles: List[Dict], topic: str) -> str:
        """Create background/origins section"""
        background_keywords = [
            "background", "history", "context", "origin", "began", "started", 
            "first", "initially", "previously", "earlier", "past", "before"
        ]
        
        background_info = []
        
        for article in articles:
            title = article.get('title', '').lower()
            description = article.get('description', '').lower()
            
            # Check if article contains background information
            if any(keyword in title or keyword in description for keyword in background_keywords):
                original_desc = self._clean_text(article.get('description', ''))
                if original_desc and len(original_desc) > 50:
                    background_info.append(original_desc[:150] + "..." if len(original_desc) > 150 else original_desc)
        
        if background_info:
            return "\n".join(f"• {info}" for info in background_info[:2])  # Top 2 background items
        
        return ""
    
    def _create_current_relevance(self, articles: List[Dict], topic: str, date_range: str) -> str:
        """Create current relevance section"""
        relevance_keywords = [
            "today", "now", "current", "latest", "recent", "breaking", 
            "developing", "ongoing", "update", "new", "just", "this"
        ]
        
        current_info = []
        
        for article in articles:
            title = article.get('title', '').lower()
            description = article.get('description', '').lower()
            
            # Check if article is about current events
            if any(keyword in title or keyword in description for keyword in relevance_keywords):
                original_desc = self._clean_text(article.get('description', ''))
                if original_desc and len(original_desc) > 30:
                    current_info.append(original_desc[:120] + "..." if len(original_desc) > 120 else original_desc)
        
        if current_info:
            relevance_text = f"This topic is highly relevant as of {date_range}:\n\n"
            relevance_text += "\n".join(f"• {info}" for info in current_info[:2])
            return relevance_text
        
        return f"This information is current as of {date_range} and reflects the latest available news on {topic}."

    def _create_comparisons_section(self, articles: List[Dict], topic: str) -> str:
        """Create comparisons & related information section"""
        comparison_keywords = [
            "compared to", "versus", "similar to", "like", "unlike", "different from",
            "in contrast", "meanwhile", "however", "alternatively", "related"
        ]

        comparisons = []

        for article in articles:
            title = article.get('title', '').lower()
            description = article.get('description', '').lower()

            # Check if article contains comparison information
            if any(keyword in title or keyword in description for keyword in comparison_keywords):
                original_desc = self._clean_text(article.get('description', ''))
                if original_desc and len(original_desc) > 30:
                    comparisons.append(original_desc[:150] + "..." if len(original_desc) > 150 else original_desc)

        if comparisons:
            return "\n".join(comparisons[:2])  # Top 2 comparison items

        return f"This news story can be compared to similar recent developments in the same sector or region, providing context for understanding broader trends and patterns."

    def _create_applications_section(self, articles: List[Dict], topic: str) -> str:
        """Create applications & use cases section"""
        application_keywords = [
            "impact", "affect", "influence", "change", "result", "consequence",
            "application", "use", "implementation", "practice", "industry", "business"
        ]

        applications = []

        for article in articles:
            title = article.get('title', '').lower()
            description = article.get('description', '').lower()

            # Check if article contains application information
            if any(keyword in title or keyword in description for keyword in application_keywords):
                original_desc = self._clean_text(article.get('description', ''))
                if original_desc and len(original_desc) > 30:
                    applications.append(original_desc[:150] + "..." if len(original_desc) > 150 else original_desc)

        if applications:
            return "\n".join(applications[:2])  # Top 2 application items

        return f"This development has practical implications for various industries, organizations, and individuals who may need to adapt their practices or strategies accordingly."

    def _create_challenges_section(self, articles: List[Dict], topic: str) -> str:
        """Create challenges, criticisms, or controversies section"""
        challenge_keywords = [
            "challenge", "problem", "issue", "concern", "criticism", "controversy",
            "debate", "dispute", "opposition", "conflict", "risk", "threat", "difficulty"
        ]

        challenges = []

        for article in articles:
            title = article.get('title', '').lower()
            description = article.get('description', '').lower()

            # Check if article contains challenge information
            if any(keyword in title or keyword in description for keyword in challenge_keywords):
                original_desc = self._clean_text(article.get('description', ''))
                if original_desc and len(original_desc) > 30:
                    challenges.append(original_desc[:150] + "..." if len(original_desc) > 150 else original_desc)

        if challenges:
            return "\n".join(challenges[:2])  # Top 2 challenge items

        return f"As with many significant developments, this news may face various challenges, criticisms, or areas of debate that stakeholders will need to address."

    def _create_future_trends_section(self, articles: List[Dict], topic: str) -> str:
        """Create future developments / trends section"""
        future_keywords = [
            "future", "next", "upcoming", "expected", "predict", "forecast",
            "trend", "outlook", "projection", "plan", "will", "going to", "likely"
        ]

        future_info = []

        for article in articles:
            title = article.get('title', '').lower()
            description = article.get('description', '').lower()

            # Check if article contains future information
            if any(keyword in title or keyword in description for keyword in future_keywords):
                original_desc = self._clean_text(article.get('description', ''))
                if original_desc and len(original_desc) > 30:
                    future_info.append(original_desc[:150] + "..." if len(original_desc) > 150 else original_desc)

        if future_info:
            return "\n".join(future_info[:2])  # Top 2 future items

        return f"Future developments related to this story will likely continue to evolve, with experts monitoring the situation for new trends and potential outcomes."

    def _create_public_response_section(self, articles: List[Dict], topic: str) -> str:
        """Create public / expert response section"""
        response_keywords = [
            "response", "reaction", "opinion", "comment", "statement", "expert",
            "analyst", "official", "spokesperson", "public", "people", "citizens"
        ]

        responses = []

        for article in articles:
            title = article.get('title', '').lower()
            description = article.get('description', '').lower()

            # Check if article contains response information
            if any(keyword in title or keyword in description for keyword in response_keywords):
                original_desc = self._clean_text(article.get('description', ''))
                if original_desc and len(original_desc) > 30:
                    responses.append(original_desc[:150] + "..." if len(original_desc) > 150 else original_desc)

        if responses:
            return "\n".join(responses[:2])  # Top 2 response items

        return f"Public and expert responses to this development are being monitored, with various stakeholders likely to provide their perspectives and analysis."

    def _create_impact_section(self, articles: List[Dict], topic: str) -> str:
        """Create impact & implications section"""
        impact_keywords = [
            "impact", "effect", "consequence", "implication", "result", "outcome",
            "influence", "change", "transform", "affect", "economic", "social", "political"
        ]

        impacts = []

        for article in articles:
            title = article.get('title', '').lower()
            description = article.get('description', '').lower()

            # Check if article contains impact information
            if any(keyword in title or keyword in description for keyword in impact_keywords):
                original_desc = self._clean_text(article.get('description', ''))
                if original_desc and len(original_desc) > 30:
                    impacts.append(original_desc[:150] + "..." if len(original_desc) > 150 else original_desc)

        if impacts:
            return "\n".join(impacts[:2])  # Top 2 impact items

        return f"This development may have significant implications across multiple sectors, potentially affecting economic, social, political, or cultural aspects of society."

    def _create_human_angle_section(self, articles: List[Dict], topic: str) -> str:
        """Create human angle / compassion section"""
        human_keywords = [
            "people", "family", "individual", "person", "human", "story", "personal",
            "community", "victim", "survivor", "struggle", "hope", "help", "support"
        ]

        human_stories = []

        for article in articles:
            title = article.get('title', '').lower()
            description = article.get('description', '').lower()

            # Check if article contains human interest information
            if any(keyword in title or keyword in description for keyword in human_keywords):
                original_desc = self._clean_text(article.get('description', ''))
                if original_desc and len(original_desc) > 30:
                    human_stories.append(original_desc[:150] + "..." if len(original_desc) > 150 else original_desc)

        if human_stories:
            return "\n".join(human_stories[:2])  # Top 2 human interest items

        return f"Behind this news story are real people whose lives may be affected, highlighting the human dimension of current events and the importance of compassionate understanding."

    def _create_myths_facts_section(self, articles: List[Dict], topic: str) -> str:
        """Create myths vs facts section (if needed)"""
        myth_keywords = [
            "myth", "false", "misinformation", "rumor", "fact check", "verify",
            "debunk", "clarify", "correct", "misconception", "truth", "accurate"
        ]

        myth_facts = []

        for article in articles:
            title = article.get('title', '').lower()
            description = article.get('description', '').lower()

            # Check if article contains myth/fact information
            if any(keyword in title or keyword in description for keyword in myth_keywords):
                original_desc = self._clean_text(article.get('description', ''))
                if original_desc and len(original_desc) > 30:
                    myth_facts.append(original_desc[:150] + "..." if len(original_desc) > 150 else original_desc)

        if myth_facts:
            return "\n".join(myth_facts[:2])  # Top 2 myth/fact items

        return None  # Only show this section if there are actual myths to address

    def _create_faq_section(self, articles: List[Dict], topic: str) -> str:
        """Create FAQ / likely questions section"""
        # Generate common questions based on topic
        common_questions = [
            f"What exactly happened with {topic}?",
            f"When did this {topic} news break?",
            f"Who is involved in this {topic} story?",
            f"What are the implications of this {topic} development?",
            f"How will this {topic} news affect people?"
        ]

        # Try to extract specific questions from articles
        question_keywords = ["what", "when", "where", "who", "why", "how"]
        extracted_questions = []

        for article in articles:
            title = article.get('title', '')
            if any(keyword in title.lower() for keyword in question_keywords) and "?" in title:
                clean_title = self._clean_text(title)
                if len(clean_title) > 10:
                    extracted_questions.append(clean_title)

        # Combine extracted and common questions
        all_questions = extracted_questions[:2] + common_questions[:3]

        return "\n".join(f"Q: {question}" for question in all_questions[:3])

    def _create_conclusion_section(self, summary: str, topic: str, articles: List[Dict]) -> str:
        """Create conclusion / takeaway section"""
        clean_summary = self._clean_text(summary)

        # Extract key takeaway from summary
        sentences = re.split(r'[.!?]+', clean_summary)
        key_sentence = ""

        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 30:
                key_sentence = sentence
                break

        if key_sentence:
            conclusion = f"The key takeaway from this {topic} news is that {key_sentence.lower()}. "
        else:
            conclusion = f"This {topic} development represents a significant news story that "

        # Add importance statement
        conclusion += f"This story matters because it reflects current trends and may influence future developments in this area. "
        conclusion += f"Staying informed about such developments helps in understanding the broader context of current events."

        return conclusion
    
    def _create_key_facts(self, articles: List[Dict], summary: str) -> str:
        """Create key facts section"""
        facts = []
        
        # Extract facts from summary
        clean_summary = self._clean_text(summary)
        sentences = re.split(r'[.!?]+', clean_summary)
        
        # Look for factual statements
        fact_indicators = [
            "according to", "reported", "announced", "confirmed", "stated", 
            "revealed", "showed", "found", "discovered", "indicated"
        ]
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 30 and any(indicator in sentence.lower() for indicator in fact_indicators):
                facts.append(sentence)
        
        # Also extract from article titles
        for article in articles[:5]:
            title = self._clean_text(article.get('title', ''))
            if title and len(title) > 20:
                facts.append(title)
        
        if facts:
            # Remove duplicates and limit to top facts
            unique_facts = list(dict.fromkeys(facts))[:4]  # Top 4 unique facts
            return "\n".join(f"• {fact}" for fact in unique_facts)
        
        return ""
    
    def _create_sources_section(self, sources: List[Dict], articles: List[Dict]) -> str:
        """Create sources section"""
        source_names = set()
        
        # Extract from sources
        for source in sources:
            name = source.get('name', '')
            if name:
                source_names.add(name)
        
        # Extract from articles
        for article in articles:
            source = article.get('source', {})
            if isinstance(source, dict):
                name = source.get('name', '')
            else:
                name = str(source)
            
            if name:
                source_names.add(name)
        
        if source_names:
            sorted_sources = sorted(list(source_names))
            return ", ".join(sorted_sources[:6])  # Top 6 sources
        
        return "Multiple news sources"
    
    def _create_no_results_response(self, query: str) -> str:
        """Create response when no news results are found"""
        return f"""NEWS_RESULT

Direct Answer
No current news found for "{query}". This could be due to the topic not being in recent news coverage, the query needing to be more specific, or news sources not having updated information yet.

Additional Information
Try rephrasing your query or asking about a more general topic. News coverage varies by source and timing.

Background / Origins
News availability depends on multiple factors including source coverage, timing, and topic relevance.

Current Relevance
This search was conducted with current news sources but no matching results were found at this time.

Key Facts / Statistics
No specific facts or statistics are available for this query at the moment.

Comparisons & Related Information
Consider searching for related topics or broader categories that might have more coverage.

Applications & Use Cases
News searches work best with specific, current topics or general categories like politics, technology, or business.

Challenges, Criticisms, or Controversies
No specific challenges or controversies identified for this topic in current news.

Future Developments / Trends
Future news coverage may include this topic as events develop.

Public / Expert Response
No public or expert responses available for this topic in current news coverage.

Impact & Implications
No current impact or implications identified in available news sources.

Human Angle / Compassion
No human interest stories found related to this topic in current news.

FAQ / Likely Questions
Q: Why wasn't any news found for this topic?
Q: How can I search for related news?
Q: When might news about this topic become available?

Conclusion / Takeaway
News coverage varies by topic and timing. Consider trying different search terms or checking back later for updated coverage.

Sources
News aggregation services, Real-time news feeds"""

    def _create_error_response(self, query: str, error_message: str) -> str:
        """Create structured error response"""
        return f"""NEWS_RESULT

Direct Answer
An error occurred while retrieving news about "{query}": {error_message}

Additional Information
This error may be temporary. Please try again in a few moments or rephrase your query.

Background / Origins
Technical issues can occur with news data retrieval systems due to various factors.

Current Relevance
News systems require stable connections to data sources for optimal performance.

Key Facts / Statistics
Error details: {error_message}

Comparisons & Related Information
Similar errors may occur during high traffic periods or system maintenance.

Applications & Use Cases
Try rephrasing your query or asking about a different news topic.

Challenges, Criticisms, or Controversies
Technical challenges are common in real-time news aggregation systems.

Future Developments / Trends
System reliability improvements are ongoing to minimize such errors.

Public / Expert Response
Technical support teams work to resolve news system issues promptly.

Impact & Implications
Temporary service interruptions may affect news delivery but are typically resolved quickly.

Human Angle / Compassion
We understand the importance of staying informed and apologize for any inconvenience.

FAQ / Likely Questions
Q: Why did this error occur?
Q: When will the news system be working again?
Q: Can I try a different news query?

Conclusion / Takeaway
Please try your news query again in a few moments, or contact support if the issue persists.

Sources
System error logs, Technical support documentation"""

    def get_conversational_news(self, query: str, source: str = None) -> str:
        """
        Get news with conversational source handling

        Args:
            query: News query/topic
            source: Optional specific news source

        Returns:
            Either structured news response or conversational source selection
        """
        if not self.is_available:
            return "I'm sorry, but the news system is currently unavailable. Please try again later."

        try:
            # If specific source requested, get news directly
            if source:
                try:
                    return self.get_structured_news(query, source, allow_source_selection=False)
                except Exception as e:
                    logger.error(f"[ERROR] Specific source news failed: {e}")
                    return self._create_error_response(query, str(e))

            # For general queries, try to get comprehensive news first
            # This will handle the source selection internally
            try:
                news_result = self.news_system.get_news_summary(
                    query=query,
                    allow_source_selection=False  # We'll handle source selection conversationally
                )
            except Exception as e:
                logger.error(f"[ERROR] News system call failed: {e}")
                return self._create_error_response(query, str(e))

            # Handle different response types
            if isinstance(news_result, str):
                # Got a direct summary - format it
                try:
                    mock_result = {
                        'summary': news_result,
                        'articles': [],
                        'sources': [{'name': 'Multiple Sources'}],
                        'topic': query,
                        'date_range': datetime.now().strftime('%B %d, %Y')
                    }
                    return self._format_structured_news(mock_result, query, None)
                except Exception as e:
                    logger.error(f"[ERROR] String formatting failed: {e}")
                    return self._create_error_response(query, str(e))

            elif isinstance(news_result, dict):
                # Got structured data - format it
                try:
                    return self._format_structured_news(news_result, query, None)
                except Exception as e:
                    logger.error(f"[ERROR] Dict formatting failed: {e}")
                    return self._create_error_response(query, str(e))

            elif news_result is None:
                # No results
                return self._create_no_results_response(query)

            else:
                # Unexpected format - convert to string and handle
                try:
                    news_str = str(news_result)
                    mock_result = {
                        'summary': news_str,
                        'articles': [],
                        'sources': [{'name': 'Multiple Sources'}],
                        'topic': query,
                        'date_range': datetime.now().strftime('%B %d, %Y')
                    }
                    return self._format_structured_news(mock_result, query, None)
                except Exception as e:
                    logger.error(f"[ERROR] Unexpected format handling failed: {e}")
                    return self._create_error_response(query, str(e))

        except Exception as e:
            logger.error(f"[ERROR] Conversational news retrieval failed: {e}")
            return f"I encountered an error while getting news about {query}. Please try again or rephrase your request."

    def create_conversational_source_selection(self, query: str, available_sources: List[Dict[str, Any]]) -> str:
        """
        Create a conversational source selection message

        Args:
            query: The news query
            available_sources: List of available sources with article counts

        Returns:
            Conversational source selection message
        """
        if not available_sources:
            return f"I couldn't find any news sources covering {query} right now. Please try a different topic or check back later."

        # Sort sources by article count (descending)
        sorted_sources = sorted(available_sources, key=lambda x: x.get('article_count', 0), reverse=True)

        # Create conversational message
        message_parts = [f"I found several reliable news sources covering {query}."]

        # Describe top sources
        if len(sorted_sources) >= 3:
            top_source = sorted_sources[0]
            second_source = sorted_sources[1]
            third_source = sorted_sources[2]

            message_parts.append(
                f"The most comprehensive coverage is from {top_source['name']} with {top_source.get('article_count', 0)} articles, "
                f"followed by {second_source['name']} with {second_source.get('article_count', 0)} articles, "
                f"and {third_source['name']} with {third_source.get('article_count', 0)} articles."
            )
        elif len(sorted_sources) == 2:
            message_parts.append(
                f"The best coverage is from {sorted_sources[0]['name']} with {sorted_sources[0].get('article_count', 0)} articles "
                f"and {sorted_sources[1]['name']} with {sorted_sources[1].get('article_count', 0)} articles."
            )
        else:
            message_parts.append(
                f"I found coverage from {sorted_sources[0]['name']} with {sorted_sources[0].get('article_count', 0)} articles."
            )

        # Add selection prompt
        if len(sorted_sources) > 1:
            message_parts.append("Which source would you prefer, or would you like me to combine information from all sources?")
        else:
            message_parts.append("Would you like me to get the news from this source?")

        return " ".join(message_parts)
    
    def _clean_text(self, text: str) -> str:
        """Clean text by removing markdown formatting, emojis, and extra whitespace"""
        if not text:
            return ""

        # Remove markdown formatting
        text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)  # Remove **bold**
        text = re.sub(r'\*([^*]+)\*', r'\1', text)      # Remove *italic*
        text = re.sub(r'`([^`]+)`', r'\1', text)        # Remove `code`
        text = re.sub(r'#{1,6}\s*', '', text)           # Remove headers

        # Remove emojis and special characters
        # Remove emoji characters (Unicode ranges for emojis)
        text = re.sub(r'[\U0001F600-\U0001F64F]', '', text)  # Emoticons
        text = re.sub(r'[\U0001F300-\U0001F5FF]', '', text)  # Symbols & pictographs
        text = re.sub(r'[\U0001F680-\U0001F6FF]', '', text)  # Transport & map symbols
        text = re.sub(r'[\U0001F1E0-\U0001F1FF]', '', text)  # Flags (iOS)
        text = re.sub(r'[\U00002600-\U000027BF]', '', text)  # Miscellaneous symbols
        text = re.sub(r'[\U0001f900-\U0001f9ff]', '', text)  # Supplemental symbols

        # Remove common emoji-like characters
        text = re.sub(r'[✅❌⚠️🎉🔥💡📊🚀⭐️✨🎯📈📉💪🏆🌟]', '', text)

        # Remove bullet points and special formatting
        text = re.sub(r'[•·▪▫◦‣⁃]', '', text)

        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()

        return text
    
    def get_news_with_memory_context(self, query: str, source: str = None) -> str:
        """Get news with memory system context for personalization"""
        if self.memory_system:
            try:
                # Get user preferences from memory
                user_context = self.memory_system.get_context_for_ai_response("basic")
                
                # Extract news preferences
                preferences = user_context.get('user_profile', {})
                
                # Customize query based on preferences
                if preferences:
                    # This could be enhanced to use user interests, location, etc.
                    pass
                
            except Exception as e:
                logger.error(f"[ERROR] Memory context retrieval failed: {e}")
        
        # Get structured news
        return self.get_structured_news(query, source)


# Convenience function for easy integration
def get_enhanced_news_system(memory_system=None) -> EnhancedNewsSystem:
    """Get enhanced news system instance"""
    return EnhancedNewsSystem(memory_system)
