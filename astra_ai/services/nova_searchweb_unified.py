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

# Import Groq client for AI-powered summarization
try:
    from groq_client_fix import GroqClient
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    print("Warning: Groq client not available. Using basic summarization.")

# Load environment variables from .env file
load_dotenv()

# Get API keys from environment variables
SERPAPI_KEY = os.getenv("SERPAPI_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

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
        self.num_results = 15  # Increased for more comprehensive information
        self.format_style = "smart"  # Smart format adapts to the query type
        
        # Initialize Groq client for AI-powered summarization
        self.groq_client = None
        if GROQ_AVAILABLE and GROQ_API_KEY:
            try:
                self.groq_client = GroqClient(api_key=GROQ_API_KEY)
                print("AI-powered summarization enabled.")
            except Exception as e:
                print(f"Warning: Could not initialize Groq client: {e}")
                self.groq_client = None
        else:
            print("Using basic text combination for summarization.")
    
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
        current_year = 2026
        if re.search(r'(current|latest|newest|2026|this year)', query_lower):
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
        using AI for cohesive narrative when available.
        """
        if not results:
            return f"No information found about '{query}'."

        if results[0].get("type") == "error":
            return f"Search error: {results[0].get('message')}"

        # Collect all available information
        all_info = self._collect_all_info(results)
        
        if not all_info.strip():
            return f"No good information found for '{query}'."

        # Use AI-powered summarization if available
        if self.groq_client:
            try:
                return self._generate_ai_summary(all_info, query, summarize)
            except Exception as e:
                print(f"AI summarization failed: {e}. Using basic method.")
        
        # Fallback to basic text combination
        return self._generate_basic_summary(all_info, query, summarize)
    
    def _collect_all_info(self, results: List[Dict[str, Any]]) -> str:
        """
        Collect all available information from search results into a single text block.
        
        Args:
            results: List of processed search results
            
        Returns:
            Combined text from all results
        """
        info_parts = []
        
        for result in results:
            result_type = result.get("type")
            
            if result_type == "knowledge_graph":
                title = result.get("title", "")
                description = result.get("description", "")
                if title:
                    info_parts.append(f"Knowledge Graph - {title}: {description}")
                else:
                    info_parts.append(f"Knowledge Graph: {description}")
                
                attributes = result.get("attributes", {})
                for key, value in attributes.items():
                    info_parts.append(f"{key}: {value}")
            
            elif result_type == "answer_box":
                title = result.get("title", "")
                answer = result.get("answer", "")
                if title:
                    info_parts.append(f"Answer Box - {title}: {answer}")
                else:
                    info_parts.append(f"Answer Box: {answer}")
            
            elif result_type in ["web_result", "news_result"]:
                title = result.get("title", "").strip()
                snippet = result.get("snippet", "").strip()
                date = result.get("date", "").strip()
                source = result.get("source", "").strip()
                
                if title or snippet:
                    if result_type == "news_result" and (date or source):
                        metadata = []
                        if date:
                            metadata.append(f"Date: {date}")
                        if source:
                            metadata.append(f"Source: {source}")
                        metadata_str = " | ".join(metadata)
                        info_parts.append(f"News: {title}. {snippet} ({metadata_str})")
                    else:
                        info_parts.append(f"Web: {title}. {snippet}")
            
            elif result_type == "image_result":
                title = result.get("title", "").strip()
                if title:
                    info_parts.append(f"Image: {title}")
        
        return "\n".join(info_parts)
    
    def _generate_ai_summary(self, all_info: str, query: str, summarize: Optional[bool] = None) -> str:
        """
        Generate a cohesive, narrative summary using AI.
        
        Args:
            all_info: Combined information from search results
            query: The original search query
            summarize: Whether to create a summary or full details
            
        Returns:
            AI-generated summary
        """
        # Determine the type of response needed
        if summarize is False:
            prompt = f"""Based on the following search results about "{query}", create a comprehensive, cohesive, and well-written overview that synthesizes all the information into a single flowing narrative. Make it informative, detailed, and engaging, like a well-researched article section. Include all key facts, developments, and context from the results.

Search Results:
{all_info}

Please provide a detailed synthesis that reads naturally and covers all important aspects."""
        else:
            prompt = f"""Based on the following search results about "{query}", create a concise but comprehensive summary that captures the most important information in a cohesive narrative.

Search Results:
{all_info}

Please provide a well-written summary that flows naturally and covers the key points."""
        
        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that creates comprehensive, well-written summaries from search results. Always provide informative, accurate content based on the given information."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000 if summarize is False else 1000,
                temperature=0.3  # Lower temperature for more factual responses
            )
            
            summary = response.choices[0].message.content.strip()
            return summary + "\n\n_Sources: Google Search, top web results._"
            
        except Exception as e:
            raise Exception(f"AI summarization failed: {e}")
    
    def _generate_basic_summary(self, all_info: str, query: str, summarize: Optional[bool] = None) -> str:
        """
        Generate a basic summary by combining and cleaning text (fallback method).
        
        Args:
            all_info: Combined information from search results
            query: The original search query
            summarize: Whether to create a summary or full details
            
        Returns:
            Basic text-based summary
        """
        # Split into lines and clean up
        lines = [line.strip() for line in all_info.split('\n') if line.strip()]
        
        if summarize is False:
            # For full details, combine all lines with better formatting
            combined = []
            for line in lines:
                # Clean up prefixes and format
                line = re.sub(r'^(Knowledge Graph|Answer Box|Web|News|Image)( - )?', '', line)
                if line:
                    combined.append(line)
            
            full_info = " ".join(combined)
            
            # Remove duplicate sentences
            sentences = []
            seen = set()
            for s in re.split(r'(?<=[.!?])\s+', full_info):
                s_clean = s.strip()
                # Remove URLs
                s_clean = re.sub(r'https?://\S+', '', s_clean)
                if s_clean and s_clean not in seen and len(s_clean) > 10:
                    sentences.append(s_clean)
                    seen.add(s_clean)
            
            return " ".join(sentences) + "\n\n_Sources: Google Search, top web results._"
        
        else:
            # For summary, take key sentences
            all_text = " ".join(lines)
            sentences = re.split(r'(?<=[.!?])\s+', all_text)
            
            # Remove duplicates and URLs
            unique_sentences = []
            seen = set()
            for s in sentences:
                s_clean = s.strip()
                s_clean = re.sub(r'https?://\S+', '', s_clean)
                s_clean = re.sub(r'^(Knowledge Graph|Answer Box|Web|News|Image)( - )?', '', s_clean)
                if s_clean and s_clean not in seen and len(s_clean) > 15:
                    unique_sentences.append(s_clean)
                    seen.add(s_clean)
            
            # Take first 10-15 sentences for a good summary
            summary_sentences = unique_sentences[:12]
            summary = " ".join(summary_sentences)
            
            if len(summary) > 1500:
                summary = summary[:1497] + "..."
            
            return summary + "\n\n_Sources: Google Search, top web results._"
    
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
            
            # Always provide comprehensive, AI-synthesized information
            answer = nova._generate_answer(results["results"], user_input, results["search_type"], summarize=False)
            print("\n" + answer)
            if concise_mode:
                print("\nTip: Type 'open 1' to see the full source or 'detail' for more information.")
            
        except KeyboardInterrupt:
            print("\nSearch cancelled.")
        except Exception as e:
            print(f"\nError: {str(e)}")

if __name__ == "__main__":
    main()