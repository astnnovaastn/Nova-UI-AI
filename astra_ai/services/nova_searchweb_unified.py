#!/usr/bin/env python3
"""
Nova Search Unified - All-in-One Internet Search System

This single file contains everything needed for a powerful internet search system
that automatically searches what you ask and provides high-quality answers.
"""

import os
import sys
import json
import requests
import webbrowser
import re
import time
from typing import Dict, List, Any, Optional, Union
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variable
SERPAPI_KEY = os.getenv("SERPAPI_KEY")
if not SERPAPI_KEY:
    print("ERROR: No SerpAPI key found. Please set SERPAPI_KEY in your .env file.")
    print("You can get a free API key from https://serpapi.com/")
    sys.exit(1)

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
        if re.search(r'(current|latest|newest|2025|this year)', query_lower):
            # Add current year to search query if not already present
            if str(current_year) not in query:
                query = f"{query} {current_year}"
            params["enhanced_query"] = query
            params["time_period"] = "past_month"  # Prefer recent results
        
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

        # If user requested full details (no summary)
        if summarize is False:
            details = []
            if kg_result:
                details.append(f"{kg_result.get('title','')}. {kg_result.get('description','')}")
                if kg_result.get("attributes"):
                    for key, value in kg_result["attributes"].items():
                        details.append(f"{key}: {value}")
            if ab_result:
                details.append(f"{ab_result.get('title','')}. {ab_result.get('answer', ab_result.get('snippet',''))}")
            for r in (web_results + news_results):
                # Only use title and snippet, skip links
                if r.get('title','') or r.get('snippet',''):
                    details.append(f"{r.get('title','')}. {r.get('snippet','')}")
            # Join all details into a single, readable paragraph
            full_info = " ".join([d for d in details if d.strip()])
            return full_info + "\n\n_Sources: Google Search, top web results._"

        # Otherwise, summarize (default)
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
            if len(snippets) >= 8:  # Use more snippets for richer detail
                break
        # Combine all into a single, detailed paragraph
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
        summary = " ".join(sentences)
        summary += "\n\n_Sources: Google Search, top web results._"
        return summary
    
    def summarize_last_result(self, style: str = "short") -> str:
        """
        Summarize the last search result in a shorter, more digestible format.
        
        Args:
            style: Summarization style ("short", "bullet", "simple")
            
        Returns:
            Summarized version of the last search result
        """
        if not self.last_results or not self.last_results.get("answer"):
            return "No previous search results to summarize."
        
        original_answer = self.last_results["answer"]
        query = self.last_results.get("query", "")
        
        # Remove source information for processing
        clean_answer = re.sub(r'_Sources:.*$', '', original_answer, flags=re.MULTILINE | re.DOTALL).strip()
        
        if style == "bullet":
            # Convert to bullet points
            sentences = re.split(r'(?<=[.!?])\s+', clean_answer)
            key_points = []
            for sentence in sentences[:5]:  # Take first 5 sentences
                sentence = sentence.strip()
                if sentence and len(sentence) > 20:  # Skip very short sentences
                    key_points.append(f"• {sentence}")
            
            if key_points:
                summary = f"Summary of '{query}':\n\n" + "\n".join(key_points)
            else:
                summary = f"Key point: {clean_answer[:200]}..."
                
        elif style == "simple":
            # Simple, one-sentence summary
            sentences = re.split(r'(?<=[.!?])\s+', clean_answer)
            if sentences:
                summary = f"In simple terms: {sentences[0]}"
            else:
                summary = f"Simply put: {clean_answer[:150]}..."
                
        else:  # "short" style (default)
            # Shorter version with key information
            sentences = re.split(r'(?<=[.!?])\s+', clean_answer)
            key_sentences = sentences[:3]  # Take first 3 sentences
            summary = " ".join(key_sentences)
            
            # If still too long, truncate
            if len(summary) > 300:
                summary = summary[:297] + "..."
        
        return summary + "\n\n_Summarized from previous search results._"
    
    def open_result(self, index: int = 0) -> bool:
        """
        Open a search result in the web browser.
        
        Args:
            index: Index of the result to open (0 = first result)
            
        Returns:
            True if successful, False otherwise
        """
        if not self.last_results or not self.last_results.get("results"):
            print("No search results available to open")
            return False
        
        results = self.last_results["results"]
        if index >= len(results):
            print(f"Result index {index} out of range (max: {len(results)-1})")
            return False
        
        result = results[index]
        url = None
        
        # Get the URL based on result type
        if result.get("type") == "web_result" or result.get("type") == "news_result":
            url = result.get("link")
        elif result.get("type") == "image_result":
            url = result.get("original")
        elif result.get("type") == "knowledge_graph":
            url = result.get("source")
        elif result.get("type") == "answer_box":
            url = result.get("source")
        
        if url:
            print(f"Opening URL in browser: {url}")
            webbrowser.open(url)
            return True
        else:
            print("No URL found in the selected result")
            return False
    
    def set_results_count(self, count: int) -> None:
        """
        Set the number of results to return.
        
        Args:
            count: Number of results
        """
        if count > 0:
            self.num_results = count
            print(f"Number of results set to {count}")
        else:
            print("Number of results must be positive")
    
    def set_format(self, format_style: str) -> None:
        """
        Set the answer format style.
        
        Args:
            format_style: Format style ("smart", "detailed", "concise")
        """
        if format_style in ("smart", "detailed", "concise"):
            self.format_style = format_style
            print(f"Format style set to {format_style}")
        else:
            print(f"Invalid format style: {format_style}. Use smart, detailed, or concise.")
    
    def _detect_summarize_instruction(self, user_input: str) -> Optional[bool]:
        """
        Returns True if user wants a summary, False if user wants full details, None if not specified.
        """
        user_input = user_input.lower()
        if any(kw in user_input for kw in ["don't summarize", "do not summarize", "no summary", "full details", "be detailed", "show all", "everything", "all info", "complete info"]):
            return False
        if any(kw in user_input for kw in ["summarize", "summary", "brief", "short", "concise", "tldr"]):
            return True
        return None


def main():
    """Main function to run the Nova Search system."""
    print("\n===== Nova Search - Smart Summarization Search System =====")
    print("Ask me anything and I'll give you concise, summarized answers!")
    print("Special commands:")
    print("  - 'open <number>' - Open a result in your browser (e.g., 'open 2')")
    print("  - 'results <number>' - Change number of results (e.g., 'results 10')")
    print("  - 'detail' - Toggle between concise and detailed answers")
    print("  - 'exit' or 'quit' - Exit the program")
    
    # Initialize the search system
    nova = NovaSearch()
    concise_mode = True  # Start in concise mode by default
    
    # Main interaction loop
    while True:
        try:
            # Get user input
            user_input = input("\nAsk me anything: ").strip()
            
            # Check for exit command
            if user_input.lower() in ('exit', 'quit'):
                print("Goodbye!")
                break
            
            # Check for special commands
            if user_input.lower().startswith('open '):
                try:
                    index = int(user_input.lower().replace('open ', '').strip()) - 1
                    nova.open_result(index)
                except ValueError:
                    print("Please provide a valid result number")
                continue
            
            if user_input.lower().startswith('results '):
                try:
                    count = int(user_input.lower().replace('results ', '').strip())
                    nova.set_results_count(count)
                except ValueError:
                    print("Please provide a valid number")
                continue
            
            if user_input.lower() == 'detail':
                concise_mode = not concise_mode
                mode_name = "concise summary" if concise_mode else "detailed information"
                print(f"Switched to {mode_name} mode")
                continue
            
            # Skip empty queries
            if not user_input:
                continue
            
            # Show searching indicator
            print("Searching...", end="\r")
            
            summarize_pref = nova._detect_summarize_instruction(user_input)
            results = nova.search(user_input, summarize=False)  # Always show full info by default
            
            # Clear the searching indicator
            print(" " * 30, end="\r")
            
            LARGE_INFO_THRESHOLD = 900  # Adjust as needed

            # If user explicitly asked for summarize/don't summarize, always respect that
            if summarize_pref is not None:
                answer = nova._generate_answer(results["results"], user_input, results["search_type"], summarize=summarize_pref)
                print("\n" + answer)
                if concise_mode:
                    print("\nTip: Type 'open 1' to see the full source or 'detail' for more information.")
                continue

            # If info is large, ask the user what to do
            answer_full = nova._generate_answer(results["results"], user_input, results["search_type"], summarize=False)
            if len(answer_full) > LARGE_INFO_THRESHOLD:
                print("\nThe information is quite long. Would you like me to summarize it? (yes/no)")
                while True:
                    user_reply = input("Summarize? (yes/no): ").strip().lower()
                    if user_reply in ("yes", "y", "summarize"):
                        summarized = nova._generate_answer(results["results"], user_input, results["search_type"], summarize=True)
                        print("\n" + summarized)
                        break
                    elif user_reply in ("no", "n", "don't summarize", "do not summarize"):
                        print("\n" + answer_full)
                        break
                    else:
                        print("Please answer 'yes' or 'no'.")
            else:
                # Info is not large, just show it
                print("\n" + answer_full)
                if concise_mode:
                    print("\nTip: Type 'open 1' to see the full source or 'detail' for more information.")
            
        except KeyboardInterrupt:
            print("\nSearch cancelled.")
        except Exception as e:
            print(f"\nError: {str(e)}")

if __name__ == "__main__":
    main()