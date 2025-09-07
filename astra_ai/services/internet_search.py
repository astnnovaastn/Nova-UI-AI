#!/usr/bin/env python3
"""
Internet Search System

This module provides a wrapper around the NovaSearch class to maintain compatibility
with the search_cli.py interface.

IMPORTANT: For all search functionality, use NovaSearch directly from nova_searchweb_unified.py
"""

import os
import sys
import webbrowser
from typing import Dict, Any, Optional, List

# Add the project root directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Now we can import from astra_ai
from astra_ai.services.nova_searchweb_unified import NovaSearch

class InternetSearchSystem:
    """
    Internet Search System that wraps the NovaSearch class to maintain
    compatibility with the search_cli.py interface.
    """
    
    def __init__(self, api_key: str):
        """
        Initialize the Internet Search System.
        
        Args:
            api_key: SerpAPI key    
        """
        # Set the API key in the environment for NovaSearch to use
        os.environ["SERPAPI_KEY"] = api_key
        self.search_system = NovaSearch()
        self.last_results = None
    
    def answer_question(self, query: str, num_results: int = 5, 
                        time_period: Optional[str] = None, 
                        site_restrict: Optional[str] = None,
                        search_type: str = "web",
                        fetch_content: bool = False) -> Dict[str, Any]:
        """
        Search for an answer to a question.
        
        Args:
            query: The search query
            num_results: Number of results to return
            time_period: Time filter (e.g., "past_day", "past_week")
            site_restrict: Restrict search to a specific website
            search_type: Type of search ("web", "images", "news")
            fetch_content: Whether to fetch content of top result
            
        Returns:
            Search results
        """
        # Set the number of results
        self.search_system.set_results_count(num_results)
        
        # Modify query based on parameters
        modified_query = query
        
        # Add time period if specified
        if time_period:
            modified_query = f"{time_period} {modified_query}"
        
        # Add site restriction if specified
        if site_restrict:
            modified_query = f"site:{site_restrict} {modified_query}"
        
        # Perform the search based on search type
        if search_type == "images":
            results = self.search_system.search(f"image {modified_query}")
        elif search_type == "news":
            results = self.search_system.search(f"news {modified_query}")
        else:
            results = self.search_system.search(modified_query)
        
        # Store the results for later reference
        self.last_results = results
        
        return results
    
    def search_images(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """
        Search for images.
        
        Args:
            query: The search query
            num_results: Number of results to return
            
        Returns:
            Search results
        """
        return self.answer_question(query, num_results=num_results, search_type="images")
    
    def search_news(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """
        Search for news.
        
        Args:
            query: The search query
            num_results: Number of results to return
            
        Returns:
            Search results
        """
        return self.answer_question(query, num_results=num_results, search_type="news")
    
    def search_site(self, query: str, site: str, num_results: int = 5) -> Dict[str, Any]:
        """
        Search within a specific website.
        
        Args:
            query: The search query
            site: Website to search within
            num_results: Number of results to return
            
        Returns:
            Search results
        """
        return self.answer_question(query, num_results=num_results, site_restrict=site)
    
    def search_recent(self, query: str, time_period: str, num_results: int = 5) -> Dict[str, Any]:
        """
        Search with a time filter.
        
        Args:
            query: The search query
            time_period: Time filter (e.g., "past_day", "past_week")
            num_results: Number of results to return
            
        Returns:
            Search results
        """
        return self.answer_question(query, num_results=num_results, time_period=time_period)
    
    def real_time_browse(self, query: str) -> Dict[str, Any]:
        """
        Search and fetch content of top result.
        
        Args:
            query: The search query
            
        Returns:
            Search results with content
        """
        return self.answer_question(query, fetch_content=True)
    
    def format_answer(self, search_response: Dict[str, Any], format_style: str = "detailed") -> str:
        """
        Format the search results.
        
        Args:
            search_response: Search results
            format_style: Format style ("detailed", "concise", "citation")
            
        Returns:
            Formatted answer
        """
        # Set the format style in the search system
        self.search_system.set_format(format_style)
        
        # Return the answer from the search response
        if "answer" in search_response:
            return search_response["answer"]
        else:
            return "No answer found."
    
    def open_result_in_browser(self, result_index: int = 0) -> bool:
        """
        Open a search result in the web browser.
        
        Args:
            result_index: Index of the result to open
            
        Returns:
            True if successful, False otherwise
        """
        return self.search_system.open_result(result_index)

# Simple test code when run directly
if __name__ == "__main__":
    print("Internet Search System module loaded successfully!")
    print("\nRECOMMENDED: Use NovaSearch directly for all search functionality:")
    print("from astra_ai.services.nova_searchweb_unified import NovaSearch")
    print("search_engine = NovaSearch()")
    print("results = search_engine.search('your query here')")
    
    # Example of direct usage
    try:
        if os.environ.get("SERPAPI_KEY"):
            print("\nTesting direct NovaSearch usage:")
            direct_search = NovaSearch()
            results = direct_search.search("What is the current weather in New York?")
            print(f"Search successful: {'answer' in results}")
        else:
            print("\nSkipping test: SERPAPI_KEY environment variable not set")
    except Exception as e:
        print(f"Error testing direct search: {str(e)}")
        
    # Legacy wrapper usage example
    print("\nLegacy wrapper usage (not recommended for new code):")
    print("api_key = 'your_serpapi_key_here'")
    print("search = InternetSearchSystem(api_key)")
    print("results = search.answer_question('What is the weather in New York?')")