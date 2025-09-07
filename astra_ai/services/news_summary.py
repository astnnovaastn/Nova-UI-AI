#!/usr/bin/env python3
"""
News Summary System

This system searches trusted news sources, summarizes the latest information,
and returns clean, accurate answers to news-related questions.
"""

import os
import sys
import json
import requests
import datetime
import re
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variable
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
if not NEWS_API_KEY:
    print("ERROR: No NewsAPI key found. Please set NEWS_API_KEY in your .env file.")
    print("You can get a free API key from https://newsapi.org/")
    sys.exit(1)

class NewsSummarySystem:
    """System for searching and summarizing news from trusted sources with source selection."""
    
    def __init__(self):
        """Initialize the News Summary System."""
        self.api_key = NEWS_API_KEY
        self.base_url = "https://newsapi.org/v2"
        self.last_results = None
        self.raw_articles = None
        self.user_selected_sources = None
        
        # Define source categories for better organization
        self.source_categories = {
            "International": [
                {"id": "reuters", "name": "Reuters", "domain": "reuters.com"},
                {"id": "associated-press", "name": "Associated Press", "domain": "apnews.com"},
                {"id": "afp", "name": "Agence France-Presse", "domain": "afp.com"},
                {"id": "bbc-news", "name": "BBC News", "domain": "bbc.com"},
                {"id": "al-jazeera-english", "name": "Al Jazeera", "domain": "aljazeera.com"}
            ],
            "US News": [
                {"id": "cnn", "name": "CNN", "domain": "cnn.com"},
                {"id": "the-washington-post", "name": "Washington Post", "domain": "washingtonpost.com"},
                {"id": "the-new-york-times", "name": "New York Times", "domain": "nytimes.com"},
                {"id": "nbc-news", "name": "NBC News", "domain": "nbcnews.com"},
                {"id": "usa-today", "name": "USA Today", "domain": "usatoday.com"},
                {"id": "fox-news", "name": "Fox News", "domain": "foxnews.com"}
            ],
            "Business": [
                {"id": "financial-times", "name": "Financial Times", "domain": "ft.com"},
                {"id": "bloomberg", "name": "Bloomberg", "domain": "bloomberg.com"},
                {"id": "the-wall-street-journal", "name": "Wall Street Journal", "domain": "wsj.com"},
                {"id": "business-insider", "name": "Business Insider", "domain": "businessinsider.com"},
                {"id": "cnbc", "name": "CNBC", "domain": "cnbc.com"}
            ],
            "Technology": [
                {"id": "wired", "name": "Wired", "domain": "wired.com"},
                {"id": "techcrunch", "name": "TechCrunch", "domain": "techcrunch.com"},
                {"id": "the-verge", "name": "The Verge", "domain": "theverge.com"},
                {"id": "ars-technica", "name": "Ars Technica", "domain": "arstechnica.com"}
            ],
            "Science": [
                {"id": "national-geographic", "name": "National Geographic", "domain": "nationalgeographic.com"},
                {"id": "new-scientist", "name": "New Scientist", "domain": "newscientist.com"},
                {"id": "science-news", "name": "Science News", "domain": "sciencenews.org"}
            ]
        }
        
        # Create a flat list of trusted sources for backward compatibility
        self.trusted_sources = []
        for category, sources in self.source_categories.items():
            for source in sources:
                self.trusted_sources.append(source["id"])
                
        # Create a mapping of source IDs to names and domains
        self.source_mapping = {}
        for category, sources in self.source_categories.items():
            for source in sources:
                self.source_mapping[source["id"]] = {
                    "name": source["name"],
                    "domain": source["domain"],
                    "category": category
                }
    
    def get_news_summary(self, query: str, allow_source_selection: bool = True) -> Dict[str, Any]:
        """
        Get a summary of news related to the query, including historical news.
        
        Args:
            query: The user's question or news topic
            allow_source_selection: Whether to allow user to select sources
            
        Returns:
            Dictionary with news summary and sources
        """
        # Process query silently
        
        # Extract the core topic and time period from the query
        topic, time_period, from_date, to_date, special_topic = self._extract_topic(query)
       
        # Extract source preferences from the query
        requested_sources = self._extract_source_preferences(query)
        
        # For current conflicts, we need special handling
        if special_topic and special_topic.startswith("conflict_"):
            # Extract the specific conflict
            conflict_name = special_topic.split("_", 1)[1]
            return self._get_conflict_summary(conflict_name, from_date, to_date, allow_source_selection, requested_sources)
        elif special_topic == "current_conflicts":
            return self._get_current_conflicts_summary(allow_source_selection, requested_sources)
        
        # Get relevant news articles with source selection
        articles = self._search_news(topic, from_date, to_date, allow_source_selection, requested_sources)
        
        if not articles:
            time_desc = ""
            if time_period:
                time_desc = f" during {time_period}"
            elif from_date and to_date:
                # Format dates for display
                from_display = datetime.datetime.strptime(from_date, '%Y-%m-%d').strftime('%B %d, %Y')
                to_display = datetime.datetime.strptime(to_date, '%Y-%m-%d').strftime('%B %d, %Y')
                time_desc = f" between {from_display} and {to_display}"
                
            return {
                "query": query,
                "topic": topic,
                "time_period": time_period,
                "from_date": from_date,
                "to_date": to_date,
                "summary": f"No news found about {topic}{time_desc}.",
                "sources": [],
                "date": datetime.datetime.now().strftime("%B %d, %Y"),
                "selected_sources": self.user_selected_sources,
                "requested_sources": requested_sources
            }
        
        # Processing articles and generating summary
        
        # Process and analyze the articles
        processed_articles = self._process_articles(articles, topic)
        
        # Generate a summary
        summary = self._generate_summary(processed_articles, topic)
        
        # Extract sources
        sources = self._extract_sources(processed_articles)
        
        # Determine the date range for the results
        if processed_articles:
            # Get the earliest and latest dates from the articles
            dates = [article.get("published_date") for article in processed_articles 
                    if article.get("published_date") and article.get("published_date") != "Unknown date"]
            
            if dates:
                # Try to parse the dates
                try:
                    parsed_dates = []
                    for date_str in dates:
                        try:
                            parsed_date = datetime.datetime.strptime(date_str, "%B %d, %Y")
                            parsed_dates.append(parsed_date)
                        except:
                            pass
                    
                    if parsed_dates:
                        earliest = min(parsed_dates).strftime("%B %d, %Y")
                        latest = max(parsed_dates).strftime("%B %d, %Y")
                        date_range = f"{earliest} to {latest}" if earliest != latest else earliest
                    else:
                        date_range = datetime.datetime.now().strftime("%B %d, %Y")
                except:
                    date_range = datetime.datetime.now().strftime("%B %d, %Y")
            else:
                date_range = datetime.datetime.now().strftime("%B %d, %Y")
        else:
            date_range = datetime.datetime.now().strftime("%B %d, %Y")
        
        # Store results for later reference
        self.last_results = {
            "query": query,
            "topic": topic,
            "time_period": time_period,
            "from_date": from_date,
            "to_date": to_date,
            "summary": summary,
            "sources": sources,
            "articles": processed_articles,
            "date_range": date_range,
            "special_topic": special_topic,
            "selected_sources": self.user_selected_sources,
            "requested_sources": requested_sources
        }
        
        return self.last_results
        
    def _extract_source_preferences(self, query: str) -> List[str]:
        """
        Extract source preferences from the query.
        
        Args:
            query: The user's question or news topic
            
        Returns:
            List of requested source names
        """
        # Common phrases that indicate source preferences
        source_phrases = [
            r"from\s+([\w\s,]+)(?:only|exclusively)",
            r"using\s+([\w\s,]+)(?:only|exclusively)",
            r"(?:only|exclusively)\s+from\s+([\w\s,]+)",
            r"(?:only|exclusively)\s+using\s+([\w\s,]+)",
            r"use\s+([\w\s,]+)(?:only|exclusively)",
            r"sources?:\s+([\w\s,]+)",
            r"from\s+([\w\s,]+)(?:source|news)",
        ]
        
        # Check for source preferences
        requested_sources = []
        
        for pattern in source_phrases:
            matches = re.search(pattern, query.lower())
            if matches:
                source_text = matches.group(1).strip()
                
                # Split by common separators
                for separator in [" and ", ",", "&"]:
                    if separator in source_text:
                        parts = [part.strip() for part in source_text.split(separator) if part.strip()]
                        source_text = " ".join(parts)
                        requested_sources.extend(parts)
                        break
                else:
                    # If no separators found, use the whole text
                    requested_sources.append(source_text)
        
        # Clean up source names and match to known sources
        clean_sources = []
        if requested_sources:
            for source in requested_sources:
                # Remove common words
                source = re.sub(r'\b(news|media|network|only|source|from|the)\b', '', source, flags=re.IGNORECASE).strip()
                if source:
                    clean_sources.append(source)
        
        return clean_sources
        
    def _get_conflict_summary(self, conflict_name: str, from_date: str, to_date: str, 
                            allow_source_selection: bool = True) -> Dict[str, Any]:
        """
        Get a detailed summary of a specific conflict.
        
        Args:
            conflict_name: Name of the conflict (e.g., "ukraine_russia")
            from_date: Start date
            to_date: End date
            allow_source_selection: Whether to allow user to select sources
            
        Returns:
            Dictionary with conflict summary
        """
        # Map conflict names to search terms and display names
        conflict_info = {
            "ukraine_russia": {
                "search_terms": ["Ukraine Russia war", "Ukraine conflict", "Russian invasion Ukraine"],
                "display_name": "Russia-Ukraine War",
                "started": "February 24, 2022",
                "parties": ["Russia", "Ukraine"],
                "background": "Russia launched a full-scale invasion of Ukraine in February 2022, following years of tensions."
            },
            "israel_gaza": {
                "search_terms": ["Israel Gaza war", "Israel Hamas conflict", "Gaza fighting"],
                "display_name": "Israel-Gaza Conflict",
                "started": "October 7, 2023",
                "parties": ["Israel", "Hamas", "Palestinian militant groups"],
                "background": "The conflict escalated dramatically after Hamas attacks on October 7, 2023, followed by Israeli military operations in Gaza."
            },
            "sudan": {
                "search_terms": ["Sudan civil war", "Sudan conflict", "Sudan fighting RSF SAF"],
                "display_name": "Sudan Civil War",
                "started": "April 15, 2023",
                "parties": ["Sudanese Armed Forces (SAF)", "Rapid Support Forces (RSF)"],
                "background": "Fighting erupted between the Sudanese military and the paramilitary Rapid Support Forces in April 2023."
            },
            "yemen": {
                "search_terms": ["Yemen war", "Yemen conflict", "Houthi Saudi"],
                "display_name": "Yemen Civil War",
                "started": "2014",
                "parties": ["Houthi movement", "Saudi-led coalition", "Yemeni government"],
                "background": "The conflict began in 2014 when Houthi rebels took control of northern areas, escalating with Saudi Arabia's intervention in 2015."
            },
            "myanmar": {
                "search_terms": ["Myanmar civil war", "Myanmar conflict", "Burma fighting junta"],
                "display_name": "Myanmar Civil War",
                "started": "February 1, 2021",
                "parties": ["Military junta", "National Unity Government", "Ethnic armed organizations"],
                "background": "Civil war intensified after the military coup in February 2021 that overthrew the democratically elected government."
            },
            "ethiopia": {
                "search_terms": ["Ethiopia Tigray war", "Ethiopia conflict", "Tigray fighting"],
                "display_name": "Ethiopian Civil Conflict",
                "started": "November 2020",
                "parties": ["Ethiopian government", "Tigray People's Liberation Front (TPLF)"],
                "background": "The conflict began in November 2020 between Ethiopian government forces and the Tigray People's Liberation Front."
            },
            "syria": {
                "search_terms": ["Syria civil war", "Syria conflict", "Syrian fighting"],
                "display_name": "Syrian Civil War",
                "started": "March 2011",
                "parties": ["Syrian government", "Opposition groups", "Kurdish forces", "Islamic State"],
                "background": "The Syrian civil war began during the Arab Spring protests in 2011 and has evolved into a complex multi-sided conflict."
            },
            "afghanistan": {
                "search_terms": ["Afghanistan Taliban", "Afghanistan conflict", "Afghanistan fighting"],
                "display_name": "Afghanistan Conflict",
                "started": "Ongoing since 1978",
                "parties": ["Taliban", "Islamic State Khorasan", "Former government forces"],
                "background": "After decades of conflict, the Taliban retook control in August 2021 following US withdrawal."
            }
        }
        
        # Get conflict details
        conflict_data = conflict_info.get(conflict_name, {
            "search_terms": [conflict_name.replace("_", " ") + " conflict"],
            "display_name": conflict_name.replace("_", "-").title() + " Conflict",
            "started": "Unknown",
            "parties": ["Unknown"],
            "background": "Limited information available about this conflict."
        })
        
        # Search for articles using multiple search terms for better coverage
        all_articles = []
        
        # If source selection is enabled, only do it once for the primary search term
        if allow_source_selection:
            primary_term = conflict_data["search_terms"][0]
            articles = self._search_news(primary_term, from_date, to_date, allow_source_selection=True)
            if articles:
                all_articles.extend(articles)
                
            # For additional search terms, use the same selected sources
            selected_sources = self.user_selected_sources
            for search_term in conflict_data["search_terms"][1:]:
                more_articles = self._search_news(search_term, from_date, to_date, allow_source_selection=False)
                if more_articles and selected_sources:
                    # Filter by the previously selected sources
                    filtered_articles = self._filter_articles_by_sources(more_articles, selected_sources)
                    all_articles.extend(filtered_articles)
                elif more_articles:
                    all_articles.extend(more_articles)
        else:
            # If source selection is disabled, just get all articles
            for search_term in conflict_data["search_terms"]:
                articles = self._search_news(search_term, from_date, to_date, allow_source_selection=False)
                if articles:
                    all_articles.extend(articles)
        
        # Remove duplicates (based on URL)
        unique_articles = []
        seen_urls = set()
        for article in all_articles:
            url = article.get("url", "")
            if url and url not in seen_urls:
                unique_articles.append(article)
                seen_urls.add(url)
        
        # Process the articles
        processed_articles = self._process_articles(unique_articles, conflict_data["display_name"])
        
        # Generate specialized conflict summary
        summary = self._generate_conflict_summary(processed_articles, conflict_data)
        
        # Extract sources
        sources = self._extract_sources(processed_articles)
        
        # Determine the date range for the results
        today = datetime.datetime.now()
        date_range = f"{today.strftime('%B %d, %Y')}"
        
        # Create result
        result = {
            "query": f"Current status of the {conflict_data['display_name']}",
            "topic": conflict_data["display_name"],
            "time_period": "current_conflict",
            "from_date": from_date,
            "to_date": to_date,
            "summary": summary,
            "sources": sources,
            "articles": processed_articles,
            "date_range": date_range,
            "special_topic": "conflict",
            "conflict_data": conflict_data,
            "selected_sources": self.user_selected_sources
        }
        
        # Store results for later reference
        self.last_results = result
        
        return result
        
    def _get_current_conflicts_summary(self, allow_source_selection: bool = True) -> Dict[str, Any]:
        """
        Get a summary of all major ongoing conflicts in the world.
        
        Args:
            allow_source_selection: Whether to allow user to select sources
            
        Returns:
            Dictionary with summary of current conflicts
        """
        # List of major ongoing conflicts
        major_conflicts = [
            "ukraine_russia",
            "israel_gaza",
            "sudan",
            "myanmar",
            "yemen"
        ]
        
        # Get today's date
        today = datetime.datetime.now()
        
        # Set date range for recent conflict news (last 7 days)
        from_date = (today - datetime.timedelta(days=7)).strftime('%Y-%m-%d')
        to_date = today.strftime('%Y-%m-%d')
        
        # Search for articles about "global conflicts" or "ongoing wars"
        search_terms = ["global conflicts", "ongoing wars", "major conflicts", "active wars"]
        all_articles = []
        
        # If source selection is enabled, only do it once for the primary search term
        if allow_source_selection:
            primary_term = search_terms[0]
            articles = self._search_news(primary_term, from_date, to_date, allow_source_selection=True)
            if articles:
                all_articles.extend(articles)
                
            # For additional search terms, use the same selected sources
            selected_sources = self.user_selected_sources
            for search_term in search_terms[1:]:
                more_articles = self._search_news(search_term, from_date, to_date, allow_source_selection=False)
                if more_articles and selected_sources:
                    # Filter by the previously selected sources
                    filtered_articles = self._filter_articles_by_sources(more_articles, selected_sources)
                    all_articles.extend(filtered_articles)
                elif more_articles:
                    all_articles.extend(more_articles)
        else:
            # If source selection is disabled, just get all articles
            for search_term in search_terms:
                articles = self._search_news(search_term, from_date, to_date, allow_source_selection=False)
                if articles:
                    all_articles.extend(articles)
        
        # Process these general articles
        processed_general = self._process_articles(all_articles, "Current Global Conflicts")
        
        # Get brief info about each major conflict
        conflict_summaries = []
        
        for conflict in major_conflicts:
            # Get conflict info - don't allow source selection again for individual conflicts
            conflict_result = self._get_conflict_summary(conflict, from_date, to_date, allow_source_selection=False)
            
            # Extract a brief summary (first sentence or two)
            full_summary = conflict_result.get("summary", "")
            brief_summary = ""
            
            if full_summary:
                sentences = re.split(r'(?<=[.!?])\s+', full_summary)
                if sentences:
                    # Take first sentence, or first two if they're short
                    if len(sentences[0]) < 50 and len(sentences) > 1:
                        brief_summary = sentences[0] + " " + sentences[1]
                    else:
                        brief_summary = sentences[0]
            
            # Add to conflict summaries
            conflict_data = conflict_result.get("conflict_data", {})
            conflict_summaries.append({
                "name": conflict_data.get("display_name", conflict.replace("_", "-").title()),
                "summary": brief_summary,
                "started": conflict_data.get("started", "Unknown"),
                "parties": conflict_data.get("parties", ["Unknown"])
            })
        
        # Create a comprehensive summary of global conflicts
        global_summary = self._generate_global_conflicts_summary(processed_general, conflict_summaries)
        
        # Extract sources
        sources = self._extract_sources(processed_general)
        for conflict in major_conflicts:
            conflict_sources = self.last_results.get("sources", []) if hasattr(self, "last_results") else []
            for source in conflict_sources:
                if source not in sources:
                    sources.append(source)
        
        # Create result
        result = {
            "query": "Current wars and conflicts around the world",
            "topic": "Global Conflicts",
            "time_period": "current",
            "from_date": from_date,
            "to_date": to_date,
            "summary": global_summary,
            "sources": sources,
            "articles": processed_general,
            "date_range": today.strftime("%B %d, %Y"),
            "special_topic": "global_conflicts",
            "conflict_summaries": conflict_summaries,
            "selected_sources": self.user_selected_sources
        }
        
        # Store results for later reference
        self.last_results = result
        
        return result
    
    def _extract_topic(self, query: str) -> tuple:
        """
        Extract the core news topic and time period from the query.
        
        Args:
            query: The user's question
            
        Returns:
            Tuple of (topic, time_period, from_date, to_date, special_topic)
        """
        query_lower = query.lower()
        time_period = None
        from_date = None
        to_date = None
        special_topic = None
        
        # Check for special topics that need custom handling
        if re.search(r'(war|conflict|fighting|battle|invasion|military operation|troops|combat)', query_lower) and re.search(r'(now|current|ongoing|happening|active|present)', query_lower):
            special_topic = "current_conflicts"
            # For current conflicts, we want a slightly longer time range to get comprehensive info
            today = datetime.datetime.now()
            from_date = (today - datetime.timedelta(days=14)).strftime('%Y-%m-%d')  # Last 2 weeks
            to_date = today.strftime('%Y-%m-%d')
            time_period = "current_conflicts"
            
            # Extract the specific conflict if mentioned
            conflict_patterns = [
                (r'(ukraine|russia|ukrainian|russian)', "ukraine_russia"),
                (r'(israel|gaza|hamas|palestine|palestinian)', "israel_gaza"),
                (r'(sudan|sudanese)', "sudan"),
                (r'(yemen|houthi|saudi)', "yemen"),
                (r'(myanmar|burma|rohingya)', "myanmar"),
                (r'(ethiopia|tigray)', "ethiopia"),
                (r'(syria|syrian)', "syria"),
                (r'(afghanistan|taliban|afghan)', "afghanistan")
            ]
            
            for pattern, conflict_id in conflict_patterns:
                if re.search(pattern, query_lower):
                    special_topic = f"conflict_{conflict_id}"
                    break
        
        # Check for specific time periods
        elif re.search(r'(in|during|from) (january|february|march|april|may|june|july|august|september|october|november|december) (\d{4})', query_lower):
            # Extract month and year (e.g., "in January 2022")
            match = re.search(r'(in|during|from) (january|february|march|april|may|june|july|august|september|october|november|december) (\d{4})', query_lower)
            month_name = match.group(2)
            year = match.group(3)
            
            # Convert month name to number
            month_map = {
                'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
                'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12
            }
            month_num = month_map.get(month_name, 1)
            
            # Create date range for that month
            from_date = f"{year}-{month_num:02d}-01"
            
            # Calculate last day of month
            if month_num == 12:
                to_date = f"{int(year)+1}-01-01"
            else:
                to_date = f"{year}-{month_num+1:02d}-01"
                
            # Remove the time period from the query
            query_lower = re.sub(r'(in|during|from) (january|february|march|april|may|june|july|august|september|october|november|december) (\d{4})', '', query_lower)
            
        elif re.search(r'in (\d{4})', query_lower):
            # Extract year (e.g., "in 2022")
            match = re.search(r'in (\d{4})', query_lower)
            year = match.group(1)
            from_date = f"{year}-01-01"
            to_date = f"{int(year)+1}-01-01"
            
            # Remove the time period from the query
            query_lower = re.sub(r'in (\d{4})', '', query_lower)
            
        elif re.search(r'(last|past) (\d+) (day|days|week|weeks|month|months|year|years)', query_lower):
            # Extract relative time period (e.g., "last 3 months")
            match = re.search(r'(last|past) (\d+) (day|days|week|weeks|month|months|year|years)', query_lower)
            number = int(match.group(2))
            unit = match.group(3)
            
            # Calculate the date range
            today = datetime.datetime.now()
            
            if unit in ('day', 'days'):
                from_date = (today - datetime.timedelta(days=number)).strftime('%Y-%m-%d')
                time_period = f"past_{number}_days"
            elif unit in ('week', 'weeks'):
                from_date = (today - datetime.timedelta(weeks=number)).strftime('%Y-%m-%d')
                time_period = f"past_{number}_weeks"
            elif unit in ('month', 'months'):
                # Approximate months as 30 days
                from_date = (today - datetime.timedelta(days=number*30)).strftime('%Y-%m-%d')
                time_period = f"past_{number}_months"
            elif unit in ('year', 'years'):
                # Approximate years as 365 days
                from_date = (today - datetime.timedelta(days=number*365)).strftime('%Y-%m-%d')
                time_period = f"past_{number}_years"
                
            to_date = today.strftime('%Y-%m-%d')
            
            # Remove the time period from the query
            query_lower = re.sub(r'(last|past) (\d+) (day|days|week|weeks|month|months|year|years)', '', query_lower)
            
        elif 'yesterday' in query_lower:
            # Set date range for yesterday
            yesterday = datetime.datetime.now() - datetime.timedelta(days=1)
            from_date = yesterday.strftime('%Y-%m-%d')
            to_date = datetime.datetime.now().strftime('%Y-%m-%d')
            time_period = "yesterday"
            
            # Remove the time period from the query
            query_lower = query_lower.replace('yesterday', '')
            
        elif 'last week' in query_lower:
            # Set date range for last week
            today = datetime.datetime.now()
            from_date = (today - datetime.timedelta(weeks=1)).strftime('%Y-%m-%d')
            to_date = today.strftime('%Y-%m-%d')
            time_period = "last_week"
            
            # Remove the time period from the query
            query_lower = query_lower.replace('last week', '')
            
        elif 'last month' in query_lower:
            # Set date range for last month
            today = datetime.datetime.now()
            from_date = (today - datetime.timedelta(days=30)).strftime('%Y-%m-%d')
            to_date = today.strftime('%Y-%m-%d')
            time_period = "last_month"
            
            # Remove the time period from the query
            query_lower = query_lower.replace('last month', '')
            
        elif 'last year' in query_lower:
            # Set date range for last year
            today = datetime.datetime.now()
            from_date = (today - datetime.timedelta(days=365)).strftime('%Y-%m-%d')
            to_date = today.strftime('%Y-%m-%d')
            time_period = "last_year"
            
            # Remove the time period from the query
            query_lower = query_lower.replace('last year', '')
            
        elif 'today' in query_lower or 'now' in query_lower or 'latest' in query_lower or 'recent' in query_lower:
            # Default to recent news (last 3 days)
            today = datetime.datetime.now()
            from_date = (today - datetime.timedelta(days=3)).strftime('%Y-%m-%d')
            to_date = today.strftime('%Y-%m-%d')
            time_period = "recent"
            
            # Remove these time indicators from the query
            query_lower = re.sub(r'(today|now|latest|recent)', '', query_lower)
        else:
            # Default time period for general queries (last 7 days)
            today = datetime.datetime.now()
            from_date = (today - datetime.timedelta(days=7)).strftime('%Y-%m-%d')
            to_date = today.strftime('%Y-%m-%d')
            time_period = "default_week"
        
        # Remove other common phrases and question words
        query_lower = re.sub(r'^(what|who|when|where|why|how|tell me about|news about|update on|what happened in|what\'s happening in|is going on in|going on in)', '', query_lower)
        query_lower = re.sub(r'\?$', '', query_lower)
        
        # Clean up and return
        topic = query_lower.strip()
        
        # If topic is empty after cleaning, use a more generic search
        if not topic:
            topic = "news"
            
        return (topic, time_period, from_date, to_date, special_topic)
    
    def _search_news(self, topic: str, from_date: Optional[str] = None, to_date: Optional[str] = None, 
                    allow_source_selection: bool = True, requested_sources: List[str] = None) -> List[Dict[str, Any]]:
        """
        Search for news articles on the given topic within a date range.
        
        Args:
            topic: The news topic to search for
            from_date: Start date in YYYY-MM-DD format
            to_date: End date in YYYY-MM-DD format
            allow_source_selection: Whether to allow user to select sources
            requested_sources: List of sources requested in the query
            
        Returns:
            List of news articles
        """
        # Prepare search parameters
        # Improve search query for better relevance
        search_query = topic
        
        # For location-based searches, make the query more specific
        if topic.lower() in ['germany', 'german', 'deutschland']:
            search_query = 'Germany OR German OR Deutschland'
        elif topic.lower() in ['france', 'french']:
            search_query = 'France OR French'
        elif topic.lower() in ['uk', 'britain', 'british', 'england', 'united kingdom']:
            search_query = 'UK OR Britain OR British OR England OR "United Kingdom"'
        elif topic.lower() in ['usa', 'america', 'american', 'united states']:
            search_query = 'USA OR America OR American OR "United States"'
        elif len(topic.split()) == 1 and len(topic) > 3:
            # For single word topics that might be countries/locations, add OR variations
            search_query = f'{topic} OR {topic.title()}'
        
        params = {
            "apiKey": self.api_key,
            "q": search_query,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 25  # Increased to get more sources for selection
        }
        
        # Add date range if specified
        if from_date:
            params["from"] = from_date
        if to_date:
            params["to"] = to_date
            
        # For historical searches, we need to use the /everything endpoint
        endpoint = f"{self.base_url}/everything"
        
        # For very recent news (within last 24 hours) with no date range specified,
        # we can also try the /top-headlines endpoint
        if not from_date and not to_date:
            try_headlines = True
        else:
            try_headlines = False
        
        try:
            # Reset user selected sources
            self.user_selected_sources = None
            
            # Get domains from our source mapping
            domains = []
            for source_id, source_info in self.source_mapping.items():
                if source_info.get("domain"):
                    domains.append(source_info["domain"])
            
            # First, get articles from all sources to allow selection
            all_articles = []
            
            # Try trusted sources first
            trusted_params = params.copy()
            if domains:
                trusted_params["domains"] = ",".join(domains)
            
            response = requests.get(endpoint, params=trusted_params)
            data = response.json()
            
            if data.get("status") == "ok" and data.get("totalResults", 0) > 0:
                all_articles.extend(data.get("articles", []))
            
            # If we didn't get enough results, try a broader search
            if len(all_articles) < 10:
                response = requests.get(endpoint, params=params)
                data = response.json()
                
                if data.get("status") == "ok":
                    all_articles.extend(data.get("articles", []))
            
            # For very recent news, also try the top-headlines endpoint
            if try_headlines and topic:
                headline_params = {
                    "apiKey": self.api_key,
                    "q": topic,
                    "language": "en",
                    "pageSize": 10
                }
                
                try:
                    headline_response = requests.get(f"{self.base_url}/top-headlines", params=headline_params)
                    headline_data = headline_response.json()
                    
                    if headline_data.get("status") == "ok" and headline_data.get("totalResults", 0) > 0:
                        headline_articles = headline_data.get("articles", [])
                        
                        # Add a marker to indicate these are top headlines
                        for article in headline_articles:
                            article["isTopHeadline"] = True
                            
                        all_articles = headline_articles + all_articles
                except Exception as e:
                    print(f"Error fetching headlines: {str(e)}")
            
            # Store the raw articles for later use
            self.raw_articles = all_articles
            
            # Extract available sources from the articles
            available_sources = self._extract_available_sources(all_articles)
            
            # If sources were requested in the query, use those directly
            if requested_sources and len(requested_sources) > 0 and available_sources:
                print(f"Using sources requested in your query: {', '.join(requested_sources)}")
                
                # Match requested sources to available sources
                matched_sources = self._match_requested_sources(requested_sources, available_sources)
                
                if matched_sources:
                    self.user_selected_sources = matched_sources
                    
                    # Filter articles based on matched sources
                    filtered_articles = self._filter_articles_by_sources(all_articles, matched_sources)
                    
                    # Show which sources were matched
                    print(f"\n✅ Found articles from: {', '.join(matched_sources)}")
                    
                    # Show count of articles
                    print(f"📰 Total articles: {len(filtered_articles)}")
                    
                    return filtered_articles
                else:
                    print("\n⚠️ None of the requested sources had articles on this topic.")
                    print("Proceeding with source selection...")
            
            # If we should allow source selection, present the sources to the user
            if allow_source_selection and all_articles and available_sources:
                # Present sources to the user for selection
                selected_sources = self._present_source_selection(available_sources, topic)
                
                # Store the user's selection
                self.user_selected_sources = selected_sources
                
                # Filter articles based on user selection
                if selected_sources:
                    filtered_articles = self._filter_articles_by_sources(all_articles, selected_sources)
                    return filtered_articles
            
            # If no source selection or no sources selected, return all articles
            return all_articles
                
        except Exception as e:
            print(f"Error searching news: {str(e)}")
            return []
            
    def _extract_available_sources(self, articles: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """
        Extract available sources from the articles.
        
        Args:
            articles: List of news articles
            
        Returns:
            Dictionary of available sources with metadata
        """
        available_sources = {}
        
        for article in articles:
            # Get source information
            source_obj = article.get("source", {})
            if not source_obj:
                continue
                
            source_id = source_obj.get("id")
            source_name = source_obj.get("name")
            
            if not source_name:
                continue
                
            # Clean up source name
            source_name = source_name.strip()
            
            # Skip if already added
            if source_name in available_sources:
                available_sources[source_name]["count"] += 1
                continue
                
            # Get the URL to extract domain
            url = article.get("url", "")
            domain = ""
            if url:
                try:
                    from urllib.parse import urlparse
                    parsed_url = urlparse(url)
                    domain = parsed_url.netloc
                    if domain.startswith("www."):
                        domain = domain[4:]
                except:
                    pass
            
            # Determine if this is a trusted source
            is_trusted = False
            category = "Other"
            
            # Check if the source is in our trusted sources
            if source_id and source_id in self.source_mapping:
                is_trusted = True
                source_info = self.source_mapping[source_id]
                category = source_info.get("category", "Other")
            else:
                # Check by domain
                for source_id, source_info in self.source_mapping.items():
                    if domain and source_info.get("domain") in domain:
                        is_trusted = True
                        category = source_info.get("category", "Other")
                        break
            
            # Add to available sources
            available_sources[source_name] = {
                "id": source_id,
                "name": source_name,
                "domain": domain,
                "is_trusted": is_trusted,
                "category": category,
                "count": 1  # Number of articles from this source
            }
        
        return available_sources
        
    def _present_source_selection(self, available_sources: Dict[str, Dict[str, Any]], topic: str) -> List[str]:
        """
        Present available sources to the user for selection.
        
        Args:
            available_sources: Dictionary of available sources
            topic: The news topic
            
        Returns:
            List of selected source names
        """
        # Organize sources by category
        sources_by_category = {}
        for source_name, source_info in available_sources.items():
            category = source_info.get("category", "Other")
            if category not in sources_by_category:
                sources_by_category[category] = []
            sources_by_category[category].append((source_name, source_info))
        
        # Sort categories with trusted sources first
        sorted_categories = sorted(sources_by_category.keys(), 
                                  key=lambda x: (0 if x != "Other" else 1, x))
        
        # Display sources for selection in a clean format
        source_options = []
        source_name_to_index = {}  # Map source names to their index numbers
        option_num = 1
        
        # First, show trusted sources with more than 1 article
        print("--- RECOMMENDED SOURCES ---")
        has_recommended = False
        
        # Collect all recommended sources across categories
        all_recommended = []
        for category in sorted_categories:
            sources = sources_by_category[category]
            # Filter for trusted sources with articles
            recommended_sources = [(name, info, category) for name, info in sources 
                                  if info["is_trusted"] and info["count"] > 0]
            all_recommended.extend(recommended_sources)
        
        # Sort all recommended sources by article count
        all_recommended.sort(key=lambda x: (-x[1]["count"]))
        
        # Show top 5 recommended sources
        top_recommended = all_recommended[:5]
        if top_recommended:
            has_recommended = True
            for source_name, source_info, category in top_recommended:
                domain_str = f"({source_info['domain']})" if source_info["domain"] else ""
                count_str = f"[{source_info['count']} articles]"
                
                # Format with fixed width for cleaner display
                print(f"  {option_num}. [*] {source_name:<20} {domain_str:<20} {count_str}")
                source_options.append(source_name)
                source_name_to_index[source_name.lower()] = option_num
                option_num += 1
        
        if not has_recommended:
            print("  No recommended sources available for this topic.")
        
        # Then show a limited number of other sources
        print("\n--- OTHER AVAILABLE SOURCES ---")
        other_count = 0
        max_other_sources = 5  # Reduced to keep display cleaner
        
        # Collect all other sources
        all_others = []
        for category in sorted_categories:
            sources = sources_by_category[category]
            # Filter for sources not already shown
            other_sources = [(name, info, category) for name, info in sources 
                            if name not in [opt for opt in source_options]]
            all_others.extend(other_sources)
        
        # Sort by article count
        all_others.sort(key=lambda x: (-x[1]["count"]))
        
        # Show limited number of other sources
        top_others = all_others[:max_other_sources]
        for source_name, source_info, category in top_others:
            trusted_marker = "*" if source_info["is_trusted"] else " "
            domain_str = f"({source_info['domain']})" if source_info["domain"] else ""
            count_str = f"[{source_info['count']} articles]"
            
            print(f"  {option_num}. [{trusted_marker}] {source_name:<20} {domain_str:<20} {count_str}")
            source_options.append(source_name)
            source_name_to_index[source_name.lower()] = option_num
            option_num += 1
        
        # Show selection options in a more compact format
        print("\nEnter your selection: ", end="")
        
        # Get user selection
        while True:
            try:
                selection = input("\nEnter your selection: ").strip()
                
                # Check for empty input (use recommended sources)
                if selection == '':
                    # Default to trusted sources if available
                    trusted_sources = [name for name, info in available_sources.items() if info["is_trusted"]]
                    if trusted_sources:
                        print(f"Using {len(trusted_sources)} trusted sources by default.")
                        return trusted_sources
                    else:
                        # Use all sources if no trusted ones available
                        return list(available_sources.keys())
                
                # Check for 'all' keyword
                if selection.lower() == 'all':
                    return list(available_sources.keys())
                
                # Check for 'trusted' keyword
                if selection.lower() == 'trusted':
                    trusted_sources = [name for name, info in available_sources.items() if info["is_trusted"]]
                    if trusted_sources:
                        print(f"Using {len(trusted_sources)} trusted sources.")
                        return trusted_sources
                    else:
                        print("No trusted sources available. Using all sources instead.")
                        return list(available_sources.keys())
                
                # Check if user entered a source name directly
                if selection.lower() in source_name_to_index:
                    source_index = source_name_to_index[selection.lower()]
                    source_name = source_options[source_index-1]
                    print(f"Using source: {source_name}")
                    return [source_name]
                
                # Check for partial source name matches
                matching_sources = []
                for source_name in source_options:
                    if selection.lower() in source_name.lower():
                        matching_sources.append(source_name)
                
                if matching_sources:
                    print(f"Using {len(matching_sources)} matching sources: {', '.join(matching_sources)}")
                    return matching_sources
                
                # Parse comma-separated numbers
                selected_indices = []
                for part in selection.split(','):
                    part = part.strip()
                    
                    # Check for ranges (e.g., "1-5")
                    if '-' in part:
                        try:
                            start, end = map(int, part.split('-'))
                            if 1 <= start <= len(source_options) and 1 <= end <= len(source_options):
                                selected_indices.extend(range(start, end + 1))
                            else:
                                print(f"Invalid range: {part}. Please use numbers between 1 and {len(source_options)}.")
                        except:
                            print(f"Invalid range format: {part}")
                    else:
                        # Single number
                        try:
                            index = int(part)
                            if 1 <= index <= len(source_options):
                                selected_indices.append(index)
                            else:
                                print(f"Invalid number: {index}. Please use numbers between 1 and {len(source_options)}.")
                        except:
                            # Not a number, try as a source name
                            found = False
                            for i, source_name in enumerate(source_options):
                                if part.lower() in source_name.lower():
                                    selected_indices.append(i+1)
                                    found = True
                                    break
                            
                            if not found:
                                print(f"Invalid input: {part}")
                
                # Convert indices to source names
                if selected_indices:
                    selected_sources = [source_options[i-1] for i in selected_indices]
                    print(f"Using {len(selected_sources)} selected sources.")
                    return selected_sources
                else:
                    print("No valid sources selected. Please try again.")
            
            except KeyboardInterrupt:
                print("\nSelection cancelled. Using trusted sources by default.")
                trusted_sources = [name for name, info in available_sources.items() if info["is_trusted"]]
                if trusted_sources:
                    return trusted_sources
                else:
                    return list(available_sources.keys())
            except Exception as e:
                print(f"Error in selection: {str(e)}. Please try again.")
    
    def _filter_articles_by_sources(self, articles: List[Dict[str, Any]], selected_sources: List[str]) -> List[Dict[str, Any]]:
        """
        Filter articles based on selected sources.
        
        Args:
            articles: List of news articles
            selected_sources: List of selected source names
            
        Returns:
            Filtered list of articles
        """
        filtered_articles = []
        
        for article in articles:
            source_obj = article.get("source", {})
            source_name = source_obj.get("name", "")
            
            if source_name in selected_sources:
                filtered_articles.append(article)
        
        return filtered_articles
    
    def _process_articles(self, articles: List[Dict[str, Any]], topic: str) -> List[Dict[str, Any]]:
        """
        Process and analyze news articles.
        
        Args:
            articles: List of news articles
            topic: The news topic
            
        Returns:
            Processed articles with additional metadata
        """
        processed = []
        
        if not articles:
            return processed
            
        for article in articles:
            try:
                # Skip articles without content
                if not article.get("content") and not article.get("description"):
                    continue
                
                # Ensure we have a valid article object
                if not isinstance(article, dict):
                    continue
                
                # Extract the source (safely)
                source_obj = article.get("source", {})
                source = "Unknown Source"
                if isinstance(source_obj, dict) and "name" in source_obj:
                    source_name = source_obj.get("name")
                    if source_name and isinstance(source_name, str):
                        source = source_name
                
                # Calculate relevance score
                try:
                    relevance = self._calculate_relevance(article, topic)
                except Exception as e:
                    print(f"Error calculating relevance: {str(e)}")
                    relevance = 1.0  # Default relevance
                
                # Extract the publication date
                pub_date = article.get("publishedAt", "")
                formatted_date = "Unknown date"
                if pub_date and isinstance(pub_date, str):
                    try:
                        date_obj = datetime.datetime.fromisoformat(pub_date.replace("Z", "+00:00"))
                        formatted_date = date_obj.strftime("%B %d, %Y")
                    except:
                        formatted_date = pub_date
                
                # Process the content (safely)
                content = ""
                if article.get("content") and isinstance(article.get("content"), str):
                    content = article.get("content")
                elif article.get("description") and isinstance(article.get("description"), str):
                    content = article.get("description")
                
                # Remove truncation markers like "[+2342 chars]"
                content = re.sub(r'\[\+\d+ chars\]', '', content)
                
                # Get title (safely)
                title = ""
                if article.get("title") and isinstance(article.get("title"), str):
                    title = article.get("title")
                
                # Get URL (safely)
                url = ""
                if article.get("url") and isinstance(article.get("url"), str):
                    url = article.get("url")
                
                # Add to processed articles
                processed.append({
                    "title": title,
                    "content": content,
                    "source": source,
                    "url": url,
                    "published_date": formatted_date,
                    "relevance": relevance
                })
            except Exception as e:
                print(f"Error processing article: {str(e)}")
                continue
        
        # Sort by relevance and recency
        processed.sort(key=lambda x: (x.get("relevance", 0), x.get("published_date", "")), reverse=True)
        
        return processed
    
    def _calculate_relevance(self, article: Dict[str, Any], topic: str) -> float:
        """
        Calculate the relevance score of an article to the topic.
        
        Args:
            article: News article
            topic: The news topic
            
        Returns:
            Relevance score (0-10)
        """
        score = 0.0
        topic_words = set(topic.lower().split())
        
        # Check title relevance (most important)
        title = article.get("title", "").lower()
        title_words = set(title.split())
        title_match = len(topic_words.intersection(title_words))
        score += title_match * 2.0
        
        # Check content relevance
        content = article.get("content", article.get("description", "")).lower()
        content_words = set(content.split())
        content_match = len(topic_words.intersection(content_words))
        score += content_match * 0.5
        
        # Bonus for trusted sources
        source_obj = article.get("source", {})
        if source_obj:
            source_id = source_obj.get("id", "")
            if source_id and isinstance(source_id, str):
                source_id_lower = source_id.lower()
                if source_id_lower in self.trusted_sources:
                    score += 2.0
            
            # Also check source name if ID is not available
            source_name = source_obj.get("name", "")
            if source_name and isinstance(source_name, str):
                source_name_lower = source_name.lower()
                for trusted_source in self.trusted_sources:
                    if trusted_source in source_name_lower:
                        score += 1.5
                        break
        
        # Bonus for recency
        pub_date = article.get("publishedAt", "")
        if pub_date:
            try:
                date_obj = datetime.datetime.fromisoformat(pub_date.replace("Z", "+00:00"))
                now = datetime.datetime.now(datetime.timezone.utc)
                days_old = (now - date_obj).days
                
                if days_old == 0:  # Today
                    score += 3.0
                elif days_old == 1:  # Yesterday
                    score += 2.0
                elif days_old <= 3:  # Last few days
                    score += 1.0
            except:
                pass
        
        return min(score, 10.0)  # Cap at 10
    
    def _generate_summary(self, articles: List[Dict[str, Any]], topic: str) -> str:
        """
        Generate a well-structured, easy-to-understand summary from the news articles.
        
        Args:
            articles: Processed news articles
            topic: The news topic
            
        Returns:
            Structured news summary
        """
        if not articles:
            return f"No news found about {topic}."
        
        # Get the top most relevant articles
        top_articles = articles[:5]  # Consider more articles for better coverage
        
        # If we have very few articles (1-2) from limited sources, provide more comprehensive coverage
        if len(top_articles) <= 2:
            try:
                return self._generate_comprehensive_summary(top_articles, topic)
            except Exception as e:
                print(f"Error generating comprehensive summary: {str(e)}")
                # Continue with standard summary if comprehensive fails
        
        # Categorize information by type
        main_events = []
        reactions = []
        background = []
        analysis = []
        
        # Extract key information from each article
        for article in top_articles:
            content = article.get("content", "")
            title = article.get("title", "")
            
            # Skip articles with very short content
            if len(content) < 20:
                continue
                
            # Extract sentences
            sentences = re.split(r'(?<=[.!?])\s+', content)
            if not sentences:
                continue
                
            # Analyze the content to categorize information
            if any(word in title.lower() for word in ["happen", "occur", "report", "announce", "confirm"]):
                # This is likely reporting a main event
                if sentences:
                    main_event = self._extract_best_sentence(sentences, topic)
                    if main_event and main_event not in main_events:
                        main_events.append(main_event)
            
            elif any(word in title.lower() for word in ["say", "claim", "state", "respond", "react"]):
                # This is likely a reaction or statement
                if sentences:
                    reaction = self._extract_best_sentence(sentences, topic)
                    if reaction and reaction not in reactions:
                        reactions.append(reaction)
            
            elif any(word in title.lower() for word in ["background", "context", "history", "previous"]):
                # This provides background information
                if sentences:
                    bg_info = self._extract_best_sentence(sentences, topic)
                    if bg_info and bg_info not in background:
                        background.append(bg_info)
            
            elif any(word in title.lower() for word in ["analysis", "expert", "opinion", "impact", "effect"]):
                # This provides analysis or expert opinion
                if sentences:
                    expert_view = self._extract_best_sentence(sentences, topic)
                    if expert_view and expert_view not in analysis:
                        analysis.append(expert_view)
            
            else:
                # For other articles, extract the most informative sentences
                if sentences:
                    # Take first sentence, or first two if they're short
                    if len(sentences[0]) < 50 and len(sentences) > 1:
                        key_point = sentences[0] + " " + sentences[1]
                    else:
                        key_point = sentences[0]
                    
                    # Clean up the key point
                    key_point = key_point.strip()
                    if not key_point.endswith(('.', '!', '?')):
                        key_point += '.'
                    
                    # Add to the appropriate category based on content analysis
                    if any(word in key_point.lower() for word in ["happen", "occur", "report", "today", "yesterday"]):
                        if key_point not in main_events:
                            main_events.append(key_point)
                    elif any(word in key_point.lower() for word in ["say", "claim", "state", "according"]):
                        if key_point not in reactions:
                            reactions.append(key_point)
                    else:
                        # Default to main events if we can't categorize
                        if key_point not in main_events:
                            main_events.append(key_point)
        
        # Build a structured summary
        summary_parts = []
        
        # Start with main events
        if main_events:
            # Take up to 2 main events
            for event in main_events[:2]:
                summary_parts.append(event)
        
        # Add a reaction if available
        if reactions:
            summary_parts.append(reactions[0])
        
        # Add background if available and not too long
        if background and len(summary_parts) < 3:
            summary_parts.append(background[0])
        
        # Add analysis if available and not too long
        if analysis and len(summary_parts) < 3:
            summary_parts.append(analysis[0])
        
        # If we still don't have enough information, use article titles
        if not summary_parts:
            titles = [article.get("title", "") for article in top_articles if article.get("title")]
            if titles:
                summary = f"Recent headlines include: {'; '.join(titles[:3])}."
                return summary
            else:
                return f"Limited information is available about {topic}."
        
        # Combine the parts into a coherent summary
        summary = " ".join(summary_parts)
        
        # Check if the summary is too short
        if len(summary) < 100 and len(top_articles) > 0:
            # Add the title of the top article for context
            top_title = top_articles[0].get("title", "")
            if top_title and top_title not in summary:
                summary = f"{top_title}. {summary}"
        
        # Try to generate a more detailed ChatGPT-style summary
        try:
            chatgpt_summary = self._generate_chatgpt_style_summary(top_articles, topic)
            if chatgpt_summary and len(chatgpt_summary) > len(summary):
                return chatgpt_summary
        except Exception as e:
            # Fall back to standard summary if ChatGPT style fails
            pass
        
        return summary
    
    def _extract_best_sentence(self, sentences: List[str], topic: str) -> str:
        """
        Extract the most informative sentence from a list of sentences.
        
        Args:
            sentences: List of sentences
            topic: The news topic
            
        Returns:
            Most informative sentence
        """
        # Score each sentence based on informativeness
        scored_sentences = []
        topic_words = set(topic.lower().split())
        
        for sentence in sentences:
            # Skip very short sentences
            if len(sentence) < 15:
                continue
                
            # Skip sentences that are likely metadata or formatting
            if re.search(r'^\d+\s+chars', sentence) or re.search(r'^\[\+\d+\s+chars\]', sentence):
                continue
                
            # Calculate a score based on several factors
            score = 0
            
            # Length factor (prefer medium-length sentences)
            length = len(sentence)
            if 30 <= length <= 150:
                score += 3
            elif length < 30:
                score += 1
            else:
                score += 2
                
            # Topic relevance
            sentence_words = set(sentence.lower().split())
            topic_match = len(topic_words.intersection(sentence_words))
            score += topic_match * 2
            
            # Informativeness indicators
            if any(word in sentence.lower() for word in ["report", "confirm", "announce", "say", "according"]):
                score += 2
                
            # Presence of numbers often indicates specific information
            if re.search(r'\d+', sentence):
                score += 1
                
            # Presence of quotes often indicates important statements
            if '"' in sentence or "'" in sentence:
                score += 1
                
            scored_sentences.append((sentence, score))
        
        # Sort by score and return the best sentence
        if scored_sentences:
            scored_sentences.sort(key=lambda x: x[1], reverse=True)
            best_sentence = scored_sentences[0][0].strip()
            
            # Ensure the sentence ends with proper punctuation
            if not best_sentence.endswith(('.', '!', '?')):
                best_sentence += '.'
                
            return best_sentence
            
        # If no good sentence found, return the first one with basic cleanup
        if sentences:
            first_sentence = sentences[0].strip()
            if not first_sentence.endswith(('.', '!', '?')):
                first_sentence += '.'
            return first_sentence
            
        return ""
    
    def _extract_sources(self, articles: List[Dict[str, Any]]) -> List[str]:
        """
        Extract the sources from the articles.
        
        Args:
            articles: Processed news articles
            
        Returns:
            List of source names
        """
        sources = []
        
        for article in articles[:3]:  # Use top 3 articles
            source = article.get("source", "")
            if source and source not in sources:
                sources.append(source)
        
        return sources
    
    def _generate_conflict_summary(self, articles: List[Dict[str, Any]], conflict_data: Dict[str, Any]) -> str:
        """
        Generate a detailed summary of a specific conflict.
        
        Args:
            articles: Processed news articles about the conflict
            conflict_data: Background information about the conflict
            
        Returns:
            Detailed conflict summary
        """
        if not articles:
            return f"No recent updates available on the {conflict_data['display_name']}. {conflict_data['background']}"
        
        # Categorize articles by content type
        recent_developments = []
        casualties = []
        peace_efforts = []
        international_reactions = []
        humanitarian_impact = []
        
        for article in articles:
            title = article.get("title", "").lower()
            content = article.get("content", "").lower()
            
            # Check for casualties/deaths
            if re.search(r'(casualt|kill|dead|death|bodies|wounded|injured)', title + " " + content):
                casualties.append(article)
            
            # Check for peace talks/ceasefires
            elif re.search(r'(peace|ceasefire|truce|negotiat|talk|diplomat|agreement)', title + " " + content):
                peace_efforts.append(article)
            
            # Check for international reactions
            elif re.search(r'(condemn|sanction|response|react|statement|support|aid|assist)', title + " " + content):
                international_reactions.append(article)
            
            # Check for humanitarian impact
            elif re.search(r'(humanitarian|civilian|refugee|displaced|crisis|emergency|aid|food|water|medicine)', title + " " + content):
                humanitarian_impact.append(article)
            
            # Default to recent developments
            else:
                recent_developments.append(article)
        
        # Start with background information
        summary = f"{conflict_data['background']}\n\n"
        
        # Add recent developments
        if recent_developments:
            summary += "RECENT DEVELOPMENTS:\n"
            dev_points = []
            
            for article in recent_developments[:3]:
                content = article.get("content", "")
                sentences = re.split(r'(?<=[.!?])\s+', content)
                
                if sentences:
                    # Extract the most informative sentence
                    best_sentence = self._extract_best_sentence(sentences, conflict_data["display_name"])
                    if best_sentence and best_sentence not in dev_points:
                        dev_points.append(best_sentence)
            
            if dev_points:
                summary += " ".join(dev_points) + "\n\n"
            else:
                # Fallback to titles if no good sentences
                titles = [article.get("title", "") for article in recent_developments[:2]]
                summary += "Recent headlines include: " + "; ".join(titles) + ".\n\n"
        
        # Add casualties information if available
        if casualties:
            summary += "CASUALTIES AND DAMAGE:\n"
            casualty_info = []
            
            for article in casualties[:2]:
                content = article.get("content", "")
                # Look for sentences with numbers, which often indicate casualty figures
                sentences = re.split(r'(?<=[.!?])\s+', content)
                casualty_sentence = ""
                
                for sentence in sentences:
                    if re.search(r'\d+', sentence) and re.search(r'(casualt|kill|dead|death|bodies|wounded|injured)', sentence.lower()):
                        casualty_sentence = sentence
                        break
                
                if casualty_sentence and casualty_sentence not in casualty_info:
                    casualty_info.append(casualty_sentence)
            
            if casualty_info:
                summary += " ".join(casualty_info) + "\n\n"
        
        # Add peace efforts if available
        if peace_efforts:
            summary += "PEACE EFFORTS:\n"
            peace_info = []
            
            for article in peace_efforts[:2]:
                content = article.get("content", "")
                sentences = re.split(r'(?<=[.!?])\s+', content)
                
                for sentence in sentences:
                    if re.search(r'(peace|ceasefire|truce|negotiat|talk|diplomat|agreement)', sentence.lower()):
                        if sentence not in peace_info:
                            peace_info.append(sentence)
                            break
            
            if peace_info:
                summary += " ".join(peace_info) + "\n\n"
        
        # Add international reactions if available
        if international_reactions:
            summary += "INTERNATIONAL RESPONSE:\n"
            reaction_info = []
            
            for article in international_reactions[:2]:
                content = article.get("content", "")
                sentences = re.split(r'(?<=[.!?])\s+', content)
                
                for sentence in sentences:
                    if re.search(r'(condemn|sanction|response|react|statement|support|aid|assist)', sentence.lower()):
                        if sentence not in reaction_info:
                            reaction_info.append(sentence)
                            break
            
            if reaction_info:
                summary += " ".join(reaction_info) + "\n\n"
        
        # Add humanitarian impact if available
        if humanitarian_impact:
            summary += "HUMANITARIAN IMPACT:\n"
            humanitarian_info = []
            
            for article in humanitarian_impact[:2]:
                content = article.get("content", "")
                sentences = re.split(r'(?<=[.!?])\s+', content)
                
                for sentence in sentences:
                    if re.search(r'(humanitarian|civilian|refugee|displaced|crisis|emergency|aid|food|water|medicine)', sentence.lower()):
                        if sentence not in humanitarian_info:
                            humanitarian_info.append(sentence)
                            break
            
            if humanitarian_info:
                summary += " ".join(humanitarian_info)
        
        return summary
    
    def _generate_global_conflicts_summary(self, articles: List[Dict[str, Any]], conflict_summaries: List[Dict[str, Any]]) -> str:
        """
        Generate a summary of global conflicts.
        
        Args:
            articles: Processed general articles about global conflicts
            conflict_summaries: Brief summaries of major conflicts
            
        Returns:
            Global conflicts summary
        """
        # Start with an overview
        summary = "MAJOR ONGOING CONFLICTS AROUND THE WORLD:\n\n"
        
        # Add information about each major conflict
        for conflict in conflict_summaries:
            summary += f"• {conflict['name']} (Started: {conflict['started']})\n"
            if conflict.get("summary"):
                summary += f"  {conflict['summary']}\n"
            summary += f"  Parties involved: {', '.join(conflict['parties'])}\n\n"
        
        # Add general information about global conflicts if available
        if articles:
            summary += "GLOBAL CONFLICT TRENDS:\n"
            
            # Extract key information from general articles
            trend_info = []
            for article in articles[:3]:
                content = article.get("content", "")
                sentences = re.split(r'(?<=[.!?])\s+', content)
                
                for sentence in sentences:
                    # Look for sentences about global trends
                    if re.search(r'(worldwide|global|international|across the world|multiple|several)', sentence.lower()):
                        if sentence not in trend_info:
                            trend_info.append(sentence)
                            break
            
            if trend_info:
                summary += " ".join(trend_info)
            else:
                # Fallback to titles
                titles = [article.get("title", "") for article in articles[:2]]
                if titles:
                    summary += "Recent global conflict headlines include: " + "; ".join(titles) + "."
        
        return summary
        
    def format_news_summary(self, results: Dict[str, Any]) -> str:
        """
        Format the news summary for display with improved readability.
        
        Args:
            results: Results from get_news_summary
            
        Returns:
            Formatted news summary
        """
        topic = results.get("topic", "").title()
        summary = results.get("summary", "No information available.")
        sources = results.get("sources", [])
        special_topic = results.get("special_topic")
        selected_sources = results.get("selected_sources", [])
        
        # Get time period information
        time_period = results.get("time_period")
        from_date = results.get("from_date")
        to_date = results.get("to_date")
        date_range = results.get("date_range")
        
        # Create a descriptive time period string
        time_desc = ""
        if date_range:
            time_desc = f"{date_range}"
        elif time_period == "yesterday":
            time_desc = "Yesterday"
        elif time_period == "last_week":
            time_desc = "Past Week"
        elif time_period == "last_month":
            time_desc = "Past Month"
        elif time_period == "last_year":
            time_desc = "Past Year"
        elif time_period == "recent":
            time_desc = "Recent"
        elif time_period == "current_conflicts":
            time_desc = "Current Situation"
        elif time_period and time_period.startswith("past_"):
            # Extract the time period details (e.g., "past_3_months")
            parts = time_period.split("_")
            if len(parts) >= 3:
                try:
                    number = int(parts[1])
                    unit = parts[2]
                    time_desc = f"Past {number} {unit.title()}"
                except:
                    time_desc = f"{time_period.replace('_', ' ').title()}"
        elif from_date and to_date:
            # Format dates for display
            try:
                from_display = datetime.datetime.strptime(from_date, '%Y-%m-%d').strftime('%b %d, %Y')
                to_display = datetime.datetime.strptime(to_date, '%Y-%m-%d').strftime('%b %d, %Y')
                if from_display == to_display:
                    time_desc = f"{from_display}"
                else:
                    time_desc = f"{from_display} to {to_display}"
            except:
                time_desc = ""
        else:
            # Default to today's date
            time_desc = f"{datetime.datetime.now().strftime('%B %d, %Y')}"
        
        # ENHANCED NEWS FORMAT - Modern, structured format with clear sections
        
        # Create headline based on topic
        if special_topic and special_topic.startswith("conflict_"):
            headline = f"📰 {topic} Conflict Report: {time_desc}"
        elif special_topic == "global_conflicts":
            headline = f"📰 Global Conflicts Report: {time_desc}"
        else:
            headline = f"📰 {topic} News Brief: {time_desc}"
        
        # Start with the headline
        output = headline + "\n\n"
        
        # For conflict reports, use the sections already in the summary
        if special_topic and (special_topic.startswith("conflict_") or special_topic == "global_conflicts"):
            # The summary already has formatting with sections, just add it directly
            output += summary + "\n\n"
        else:
            # Extract key points and format them into structured paragraphs
            paragraphs = re.split(r'(?<=[.!?])\s+(?=[A-Z])', summary)
            
            # Group sentences into logical sections (2-3 sentences per section)
            sections = []
            current_section = []
            
            for sentence in paragraphs:
                current_section.append(sentence)
                
                # Start a new section after 2-3 sentences or if section is getting long
                if len(current_section) >= 3 or sum(len(s) for s in current_section) > 200:
                    sections.append(" ".join(current_section))
                    current_section = []
            
            # Add any remaining sentences as the last section
            if current_section:
                sections.append(" ".join(current_section))
            
            # Try to extract a headline/title from the first section
            if sections:
                first_section = sections[0]
                # Look for a key statement that could serve as a headline
                headline_match = re.search(r'([^.!?]{20,80}[.!?])', first_section)
                if headline_match:
                    main_headline = headline_match.group(1).strip()
                    # Make it bold and add it as a subheading
                    output += f" {main_headline}\n\n"
            
            # Add each section as a paragraph with proper spacing
            for i, section in enumerate(sections):
                # For the first section, we may have already extracted a headline
                if i == 0 and 'main_headline' in locals():
                    # Remove the headline from the first section to avoid repetition
                    section = section.replace(main_headline, "").strip()
                    if not section:
                        continue
                
                output += section.strip() + "\n\n"
        
        # Add sources with better formatting
        if sources:
            output += "📌 Sources: " + ", ".join(sources)
            
        # Add information about selected sources
        if selected_sources:
            source_count = len(selected_sources)
            if source_count <= 3:
                # For a small number of sources, list them all
                output += f"\n\nSummary based on your selected sources: {', '.join(selected_sources)}"
            else:
                # For many sources, just show the count
                output += f"\n\nSummary based on {source_count} selected news sources."
        
        return output


def main():
    """Main function to run the Enhanced News Summary System with Source Selection."""
    # Clear the terminal for a cleaner look
    os.system('cls' if os.name == 'nt' else 'clear')
    
    print("\n=== News Summary System ===")
    print("--------------------------------------")
    print("Get summaries from your preferred news sources")
    
    print("\nExample Queries:")
    print("  * \"What's happening in Ukraine?\"")
    print("  * \"Latest news about climate change from BBC\"")
    print("  * \"Tech news from The Verge and Wired\"")
    
    print("\nCommands:")
    print("  * 'clear' - Clear the terminal")
    print("  * 'help'  - Show more examples")
    print("  * 'exit'  - Exit the program")
    
    # Initialize the news system
    news_system = NewsSummarySystem()
    
    # Main interaction loop
    while True:
        try:
            # Get user input
            user_input = input("\nAsk about news: ").strip()
            
            # Check for exit command
            if user_input.lower() in ('exit', 'quit'):
                print("Goodbye!")
                break
            
            # Check for special commands
            if user_input.lower() == 'sources':
                print("\nTrusted News Sources by Category:")
                for category, sources in news_system.source_categories.items():
                    print(f"\n{category}:")
                    for source in sources:
                        print(f"  • {source['name']} ({source['domain']})")
                continue
                
            if user_input.lower() == 'help':
                print("\nExample Queries:")
                print("  * Basic queries:")
                print("    - \"What's happening in Ukraine?\"")
                print("    - \"Latest news about climate change\"")
                print("  * Time-specific queries:")
                print("    - \"What happened in Gaza in January 2023?\"")
                print("    - \"Stock market news from last week\"")
                print("    - \"Tech news from the past 3 months\"")
                print("  * Source-specific queries:")
                print("    - \"Latest on Ukraine from BBC and CNN\"")
                print("    - \"Climate news from trusted sources only\"")
                print("    - \"Tech news from The Verge and Wired\"")
                print("  * Conflict queries:")
                print("    - \"What wars are happening right now?\"")
                continue
            
            # Skip empty queries
            if not user_input:
                continue
            
            # Show searching indicator
            print("Analyzing query and searching for news sources...", end="\r")
            
            try:
                # Get news summary with source selection
                results = news_system.get_news_summary(user_input, allow_source_selection=True)
                
                # Clear the searching indicator
                print(" " * 50, end="\r")
                
                # If no articles found
                if not results.get("articles"):
                    print(f"\nNo news found about '{results.get('topic')}' in the specified time period.")
                    print("Try a different query or time period.")
                    continue
                
                # Display the formatted summary
                formatted_summary = news_system.format_news_summary(results)
                print("\n" + formatted_summary)
                
                # Show which sources were used
                selected_sources = results.get("selected_sources")
                if selected_sources:
                    print(f"\nThis summary was generated using {len(selected_sources)} selected news sources.")
                    
                    # Ask if user wants to see the sources
                    show_sources = input("Would you like to see the list of sources used? (y/n): ").strip().lower()
                    if show_sources.startswith('y'):
                        print("\nSources used for this summary:")
                        for source in selected_sources:
                            print(f"  • {source}")
            except Exception as e:
                # Clear the searching indicator
                print(" " * 50, end="\r")
                print(f"\nError processing news: {str(e)}")
                print("Please try a different query or check your internet connection.")
            
        except KeyboardInterrupt:
            print("\nOperation cancelled.")
            break
        except Exception as e:
            print(f"\nError: {str(e)}")
            import traceback
            traceback.print_exc()  # Print the full error for debugging


    def _sentence_similarity(self, sentence1: str, sentence2: str) -> float:
        """
        Calculate the similarity between two sentences.
        
        Args:
            sentence1: First sentence
            sentence2: Second sentence
            
        Returns:
            Similarity score (0-1)
        """
        # Convert to lowercase and split into words
        words1 = set(sentence1.lower().split())
        words2 = set(sentence2.lower().split())
        
        # Calculate Jaccard similarity
        if not words1 or not words2:
            return 0.0
            
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union
        
    def _generate_chatgpt_style_summary(self, articles: List[Dict[str, Any]], topic: str) -> str:
        """
        Generate a detailed, well-structured summary in ChatGPT style.
        
        Args:
            articles: List of processed news articles
            topic: The news topic
            
        Returns:
            ChatGPT-style detailed summary
        """
        if not articles:
            return f"No news found about {topic}."
        
        # Categorize information by type for a more structured summary
        main_events = []
        economic_impact = []
        political_aspects = []
        social_impact = []
        future_implications = []
        
        # Extract key information from each article
        for article in articles:
            content = article.get("content", "")
            title = article.get("title", "")
            source = article.get("source", "")
            
            # Skip articles with very short content
            if len(content) < 20:
                continue
                
            # Extract sentences
            sentences = re.split(r'(?<=[.!?])\s+', content)
            if not sentences:
                continue
            
            # Get the top 3 most informative sentences from each article
            top_sentences = []
            for sentence in sentences:
                # Skip very short sentences
                if len(sentence) < 15:
                    continue
                    
                # Skip sentences that are likely metadata or formatting
                if re.search(r'^\d+\s+chars', sentence) or re.search(r'^\[\+\d+\s+chars\]', sentence):
                    continue
                
                # Add to top sentences if not too similar to existing ones
                is_duplicate = False
                for existing in top_sentences:
                    if self._sentence_similarity(sentence, existing) > 0.6:
                        is_duplicate = True
                        break
                
                if not is_duplicate:
                    top_sentences.append(sentence)
                    if len(top_sentences) >= 3:
                        break
            
            # Categorize the sentences
            for sentence in top_sentences:
                # Economic aspects
                if re.search(r'(econom|market|financ|trade|stock|inflation|gdp|growth|recession|investment)', sentence.lower()):
                    if sentence not in economic_impact:
                        economic_impact.append(f"{sentence} ({source})")
                
                # Political aspects
                elif re.search(r'(government|president|minister|election|policy|political|vote|parliament|congress|administration)', sentence.lower()):
                    if sentence not in political_aspects:
                        political_aspects.append(f"{sentence} ({source})")
                
                # Social impact
                elif re.search(r'(people|public|social|community|citizen|resident|population|protest|demonstration)', sentence.lower()):
                    if sentence not in social_impact:
                        social_impact.append(f"{sentence} ({source})")
                
                # Future implications
                elif re.search(r'(future|plan|expect|predict|forecast|upcoming|next|will|would|could|might)', sentence.lower()):
                    if sentence not in future_implications:
                        future_implications.append(f"{sentence} ({source})")
                
                # Main events (default category)
                elif sentence not in main_events:
                    main_events.append(f"{sentence} ({source})")
        
        # Build a structured, detailed summary in ChatGPT style
        summary_parts = []
        
        # Add a title/introduction
        summary_parts.append(f"Here's a comprehensive update on {topic.title()}:\n")
        
        # Add main events section
        if main_events:
            summary_parts.append("KEY DEVELOPMENTS")
            for i, event in enumerate(main_events[:3]):
                summary_parts.append(f"* {event}")
            summary_parts.append("")
        
        # Add economic impact if available
        if economic_impact:
            summary_parts.append("ECONOMIC ASPECTS")
            for impact in economic_impact[:2]:
                summary_parts.append(f"* {impact}")
            summary_parts.append("")
        
        # Add political aspects if available
        if political_aspects:
            summary_parts.append("POLITICAL CONTEXT")
            for aspect in political_aspects[:2]:
                summary_parts.append(f"* {aspect}")
            summary_parts.append("")
        
        # Add social impact if available
        if social_impact:
            summary_parts.append("SOCIAL IMPACT")
            for impact in social_impact[:2]:
                summary_parts.append(f"* {impact}")
            summary_parts.append("")
        
        # Add future implications if available
        if future_implications:
            summary_parts.append("FUTURE OUTLOOK")
            for implication in future_implications[:2]:
                summary_parts.append(f"* {implication}")
            summary_parts.append("")
        
        # If we still don't have enough information, use article titles
        if len(summary_parts) <= 2:
            titles = [f"{article.get('title', '')} ({article.get('source', '')})" for article in articles if article.get("title")]
            if titles:
                summary_parts.append("RECENT HEADLINES")
                for title in titles[:3]:
                    summary_parts.append(f"* {title}")
                summary_parts.append("")
        
        # Combine the parts into a coherent summary
        summary = "\n".join(summary_parts)
        
        return summary
        
    def _generate_comprehensive_summary(self, articles: List[Dict[str, Any]], topic: str) -> str:
        """
        Generate a more comprehensive summary when we have limited articles.
        
        Args:
            articles: List of processed news articles (small number)
            topic: The news topic
            
        Returns:
            Detailed summary text
        """
        if not articles:
            return f"No recent news found about {topic}."
            
        summary_parts = []
        
        for i, article in enumerate(articles):
            title = article.get("title", "")
            content = article.get("content", "")
            source = article.get("source", "")
            
            # Add the title as a heading
            if title:
                if i == 0:
                    summary_parts.append(f"MAIN STORY: {title}")
                else:
                    summary_parts.append(f"RELATED: {title}")
            
            # Extract the most informative sentences
            sentences = re.split(r'(?<=[.!?])\s+', content)
            
            # Get more content from each article since we have fewer articles
            selected_sentences = []
            
            # Take up to 5 sentences, but be selective
            sentence_count = 0
            for sentence in sentences:
                # Skip very short sentences
                if len(sentence.split()) < 5:
                    continue
                    
                # Skip sentences that are too similar to ones we've already included
                is_duplicate = False
                for existing in selected_sentences:
                    if self._sentence_similarity(sentence, existing) > 0.7:
                        is_duplicate = True
                        break
                        
                if not is_duplicate:
                    selected_sentences.append(sentence)
                    sentence_count += 1
                    
                    # Limit to 5 sentences per article
                    if sentence_count >= 5:
                        break
            
            # Add the selected sentences
            if selected_sentences:
                summary_parts.append(" ".join(selected_sentences))
            
            # Add a source attribution
            if source:
                summary_parts.append(f"(Source: {source})")
            
            # Add a separator between articles
            if i < len(articles) - 1:
                summary_parts.append("\n")
        
        # Combine into a coherent summary
        if summary_parts:
            return "\n".join(summary_parts)
        else:
            # Fallback to titles if no good content
            titles = [article.get("title", "") for article in articles]
            return "Recent headlines include: " + "; ".join(titles) + "."
            
    def _extract_source_preferences(self, query: str) -> List[str]:
        """
        Extract source preferences from the query.
        
        Args:
            query: The user's question or news topic
            
        Returns:
            List of requested source names
        """
        # Common phrases that indicate source preferences
        source_phrases = [
            r"from\s+([\w\s,]+)(?:only|exclusively)",
            r"using\s+([\w\s,]+)(?:only|exclusively)",
            r"(?:only|exclusively)\s+from\s+([\w\s,]+)",
            r"(?:only|exclusively)\s+using\s+([\w\s,]+)",
            r"use\s+([\w\s,]+)(?:only|exclusively)",
            r"sources?:\s+([\w\s,]+)",
            r"from\s+([\w\s,]+)(?:source|news)",
        ]
        
        # Check for source preferences
        requested_sources = []
        
        for pattern in source_phrases:
            matches = re.search(pattern, query.lower())
            if matches:
                source_text = matches.group(1).strip()
                
                # Split by common separators
                for separator in [" and ", ",", "&"]:
                    if separator in source_text:
                        parts = [part.strip() for part in source_text.split(separator) if part.strip()]
                        source_text = " ".join(parts)
                        requested_sources.extend(parts)
                        break
                else:
                    # If no separators found, use the whole text
                    requested_sources.append(source_text)
        
        # Clean up source names and match to known sources
        clean_sources = []
        if requested_sources:
            for source in requested_sources:
                # Remove common words
                source = re.sub(r'\b(news|media|network|only|source|from|the)\b', '', source, flags=re.IGNORECASE).strip()
                if source:
                    clean_sources.append(source)
        
        return clean_sources
        
    def _match_requested_sources(self, requested_sources: List[str], available_sources: Dict[str, Dict[str, Any]]) -> List[str]:
        """
        Match requested sources to available sources.
        
        Args:
            requested_sources: List of source names requested by the user
            available_sources: Dictionary of available sources
            
        Returns:
            List of matched source names
        """
        matched_sources = []
        
        # Create a mapping of lowercase source names and domains to actual source names
        source_name_map = {}
        domain_map = {}
        
        for source_name, source_info in available_sources.items():
            # Map the lowercase name to the actual name
            source_name_map[source_name.lower()] = source_name
            
            # Map common variations
            name_variations = [
                source_name.lower(),
                source_name.lower().replace(" ", ""),
                source_name.lower().replace("news", "").strip(),
                source_name.lower().replace("the", "").strip()
            ]
            
            for variation in name_variations:
                if variation and variation not in source_name_map:
                    source_name_map[variation] = source_name
            
            # Map the domain to the source name
            domain = source_info.get("domain", "")
            if domain:
                domain_map[domain.lower()] = source_name
                domain_map[domain.lower().replace("www.", "")] = source_name
                
                # Extract the main part of the domain (e.g., "bbc" from "bbc.com")
                main_domain = domain.split(".")[0].lower()
                if main_domain:
                    domain_map[main_domain] = source_name
        
        # Match requested sources to available sources
        for requested in requested_sources:
            requested_lower = requested.lower()
            
            # Direct match by name
            if requested_lower in source_name_map:
                matched_sources.append(source_name_map[requested_lower])
                continue
                
            # Match by domain
            if requested_lower in domain_map:
                matched_sources.append(domain_map[requested_lower])
                continue
                
            # Partial match by name
            for source_name_lower, actual_name in source_name_map.items():
                if requested_lower in source_name_lower or source_name_lower in requested_lower:
                    if actual_name not in matched_sources:
                        matched_sources.append(actual_name)
                        break
        
        return matched_sources


if __name__ == "__main__":
    main()