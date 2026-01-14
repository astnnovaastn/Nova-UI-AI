#!/usr/bin/env python3
"""
Nova News - All-in-One News Search System

This system searches trusted news sources and returns comprehensive news summaries.
"""

import os
import sys
import json
import requests
import datetime
import re
import webbrowser
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API keys from environment variables
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

if not NEWS_API_KEY:
    print("ERROR: No NewsAPI key found. Please set NEWS_API_KEY in your .env file.")
    print("You can get a free API key from https://newsapi.org/")
    sys.exit(1)

class NovaNews:
    """All-in-one news search system that provides comprehensive news summaries."""

    def __init__(self):
        """Initialize the Nova News system."""
        self.api_key = NEWS_API_KEY
        self.base_url = "https://newsapi.org/v2"
        self.last_results = None
        self.num_results = 15  # Increased for more comprehensive information

    def search(self, query: str, summarize: Optional[bool] = False) -> Dict[str, Any]:
        """
        Search for news articles and provide comprehensive information.

        Args:
            query: The user's question or news topic
            summarize: Whether to summarize the answer (True/False/None)

        Returns:
            Dictionary with news search results and synthesized answer
        """
        print(f"\nSearching news for: {query}")

        # Perform the news search
        results = self._execute_news_search(query)

        # Process the results
        processed_results = self._process_news_results(results)

        # Generate a comprehensive, cohesive narrative
        answer = self._generate_answer(processed_results, query, summarize=summarize)

        # Store results for later reference
        self.last_results = {
            "query": query,
            "results": processed_results,
            "answer": answer,
            "raw_results": results
        }

        return self.last_results

    def _preprocess_query(self, query: str) -> str:
        """
        Preprocess and clean the user's query to extract the core news topic.

        Args:
            query: Raw user query

        Returns:
            Cleaned query optimized for news search
        """
        # Convert to lowercase for processing
        cleaned = query.lower().strip()

        # Fix common typos first
        typo_corrections = {
            "aboit": "about",
            "new": "news",  # Only if it seems like a typo
            "iphon": "iphone",
            "samsumg": "samsung",
            "googl": "google",
            "microsof": "microsoft",
            "facebok": "facebook",
            "twiter": "twitter",
            "amazn": "amazon",
            "teslaa": "tesla",
            "spacexx": "spacex"
        }

        words = cleaned.split()
        corrected_words = []

        for word in words:
            # Check for exact matches first
            if word in typo_corrections:
                corrected_words.append(typo_corrections[word])
            else:
                # Check for partial matches (typos at end of words)
                corrected = False
                for typo, correction in typo_corrections.items():
                    if word.endswith(typo):
                        corrected_words.append(word.replace(typo, correction))
                        corrected = True
                        break
                if not corrected:
                    corrected_words.append(word)

        cleaned = " ".join(corrected_words)

        # Remove common conversational prefixes (after typo correction)
        prefixes_to_remove = [
            "give me news about",
            "tell me about",
            "what's new about",
            "news about",
            "give me new about",  # Handle typos
            "give me news on",
            "tell me news about",
            "i want news about",
            "show me news about",
            "find news about",
            "search for news about",
            "latest news about",
            "breaking news about",
            "what's happening with",
            "what's going on with",
            "update me on",
            "inform me about",
            "brief me on"
        ]

        # Apply prefix removal multiple times in case of nested prefixes
        for _ in range(3):  # Max 3 iterations to prevent infinite loops
            original_cleaned = cleaned
            for prefix in prefixes_to_remove:
                if cleaned.startswith(prefix):
                    cleaned = cleaned[len(prefix):].strip()
                    print(f"Removed prefix '{prefix}' from '{original_cleaned}' -> '{cleaned}'")
                    break
            else:
                break  # No prefix found, exit loop

        # Correct brand names and common terms
        brand_corrections = {
            "tik tok": "TikTok",
            "face book": "Facebook",
            "twiter": "Twitter",
            "amazn": "Amazon",
            "iphon": "iPhone",
            "samsumg": "Samsung",
            "googl": "Google",
            "microsof": "Microsoft",
            "teslaa": "Tesla",
            "spacexx": "SpaceX",
            "netflix": "Netflix",
            "instagram": "Instagram",
            "whatsapp": "WhatsApp",
            "youtube": "YouTube"
        }

        if cleaned in brand_corrections:
            cleaned = brand_corrections[cleaned]

        # Remove extra whitespace and punctuation
        cleaned = re.sub(r'[^\w\s]', '', cleaned)  # Remove punctuation
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()  # Normalize whitespace

        # If the query became too short or empty, fall back to original
        if len(cleaned) < 2:
            return query.strip()

        return cleaned

    def _execute_news_search(self, query: str) -> Dict[str, Any]:
        """
        Execute news search using NewsAPI.

        Args:
            query: The search query

        Returns:
            Raw news search results from NewsAPI
        """
        # Clean and prepare the search query
        search_query = self._preprocess_query(query)
        print(f"Preprocessed query: '{query}' -> '{search_query}'")

        # Set up API parameters for comprehensive news search
        params = {
            "apiKey": self.api_key,
            "q": search_query,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": self.num_results
        }

        # Try /everything endpoint for comprehensive results
        try:
            response = requests.get(f"{self.base_url}/everything", params=params)
            response.raise_for_status()
            result = response.json()

            if result.get("status") == "ok" and result.get("totalResults", 0) > 0:
                return result
        except Exception as e:
            print(f"Error with /everything endpoint: {e}")

        # Fallback to /top-headlines if /everything fails or returns no results
        try:
            headline_params = {
                "apiKey": self.api_key,
                "q": search_query,
                "language": "en",
                "pageSize": self.num_results
            }
            response = requests.get(f"{self.base_url}/top-headlines", params=headline_params)
            response.raise_for_status()
            result = response.json()

            if result.get("status") == "ok":
                return result
        except Exception as e:
            print(f"Error with /top-headlines endpoint: {e}")

        return {"error": "Failed to retrieve news articles"}

    def _process_news_results(self, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Process news search results into a standardized format.

        Args:
            results: Raw NewsAPI response

        Returns:
            List of processed news articles
        """
        processed = []

        # Check for errors
        if "error" in results:
            return [{"type": "error", "message": results["error"]}]

        # Process articles
        articles = results.get("articles", [])
        for article in articles:
            try:
                # Extract article information
                title = article.get("title", "").strip()
                description = article.get("description", "").strip()
                content = article.get("content", "").strip()
                url = article.get("url", "").strip()

                # Extract source information
                source_obj = article.get("source", {})
                source_name = source_obj.get("name", "Unknown Source") if source_obj else "Unknown Source"

                # Extract publication date
                published_at = article.get("publishedAt", "")
                formatted_date = "Unknown date"
                if published_at:
                    try:
                        date_obj = datetime.datetime.fromisoformat(published_at.replace("Z", "+00:00"))
                        formatted_date = date_obj.strftime("%B %d, %Y")
                    except:
                        formatted_date = published_at

                # Combine content for better information
                full_content = ""
                if title:
                    full_content += title + ". "
                if description:
                    full_content += description + " "
                if content:
                    # Remove the "[+X chars]" truncation marker
                    content = re.sub(r'\[\+\d+ chars\]', '', content)
                    full_content += content

                processed.append({
                    "type": "news_article",
                    "title": title,
                    "content": full_content.strip(),
                    "source": source_name,
                    "url": url,
                    "published_date": formatted_date,
                    "relevance": 8  # All news articles are considered highly relevant
                })

            except Exception as e:
                print(f"Error processing article: {e}")
                continue

        return processed

    def _generate_answer(self, results: List[Dict[str, Any]], query: str, summarize: Optional[bool] = None) -> str:
        """
        Generate a comprehensive, cohesive narrative from news articles.
        """
        if not results:
            return f"No news found about '{query}'."

        if results[0].get("type") == "error":
            return f"News search error: {results[0].get('message')}"

        # Collect all available information
        all_info = self._collect_all_info(results)

        if not all_info.strip():
            return f"No good news information found for '{query}'."

        # Generate basic text-based news summary
        return self._generate_basic_summary(all_info, query, results, summarize)

    def _collect_all_info(self, results: List[Dict[str, Any]]) -> str:
        """
        Collect all information from news articles into a single text block.

        Args:
            results: List of processed news articles

        Returns:
            Combined text from all articles
        """
        info_parts = []

        for result in results:
            if result.get("type") == "news_article":
                title = result.get("title", "").strip()
                content = result.get("content", "").strip()
                source = result.get("source", "").strip()
                date = result.get("published_date", "").strip()

                # Format the article information
                article_info = f"Article: {title}\nContent: {content}\nSource: {source}\nDate: {date}"
                info_parts.append(article_info)

        return "\n\n".join(info_parts)

    def _generate_basic_summary(self, all_info: str, query: str, results: List[Dict[str, Any]], summarize: Optional[bool] = None) -> str:
        """
        Generate a basic news summary by combining and cleaning text (fallback method).

        Args:
            all_info: Combined information from news articles
            query: The original search query
            summarize: Whether to create a summary or full details

        Returns:
            Basic text-based news summary
        """
        # Split into sections and clean up
        sections = [section.strip() for section in all_info.split('\n\n') if section.strip()]

        combined_content = []
        for section in sections:
            lines = section.split('\n')
            content = ""
            for line in lines:
                if line.startswith("Content: "):
                    content = line.replace("Content: ", "").strip()
                    break
            if content:
                combined_content.append(content)

        # Combine all content
        full_text = " ".join(combined_content)

        # Split into sentences and remove duplicates
        sentences = re.split(r'(?<=[.!?])\s+', full_text)
        unique_sentences = []
        seen = set()

        for sentence in sentences:
            sentence = sentence.strip()
            # Remove URLs and clean up
            sentence = re.sub(r'https?://\S+', '', sentence)
            sentence = re.sub(r'\s+', ' ', sentence).strip()

            if sentence and sentence not in seen and len(sentence) > 10:
                unique_sentences.append(sentence)
                seen.add(sentence)

        # Create a cohesive summary
        summary_sentences = unique_sentences[:15]  # Take more sentences for comprehensive news coverage
        summary = " ".join(summary_sentences)

        if len(summary) > 2000:
            summary = summary[:1997] + "..."

        # Add source information
        sources = self._extract_sources_from_results(results)
        if sources:
            summary += f"\n\n_Sources: {', '.join(sources[:5])}._"

        return summary

    def _extract_sources_from_results(self, results: List[Dict[str, Any]]) -> List[str]:
        """
        Extract unique source names from results.

        Args:
            results: List of processed results

        Returns:
            List of unique source names
        """
        sources = []
        seen = set()

        for result in results:
            if result.get("type") == "news_article":
                source = result.get("source", "").strip()
                if source and source not in seen:
                    sources.append(source)
                    seen.add(source)

        return sources

    def open_result(self, index: int = 0) -> bool:
        """
        Open a news article in the web browser.

        Args:
            index: Index of the article to open (0 = first article)

        Returns:
            True if successful, False otherwise
        """
        if not self.last_results or not self.last_results.get("results"):
            print("No news results available to open")
            return False

        results = self.last_results["results"]
        if index >= len(results):
            print(f"Article index {index} out of range (max: {len(results)-1})")
            return False

        result = results[index]
        url = result.get("url")

        if url:
            print(f"Opening article in browser: {url}")
            webbrowser.open(url)
            return True
        else:
            print("No URL found in the selected article")
            return False

    def set_results_count(self, count: int) -> None:
        """
        Set the number of news articles to return.

        Args:
            count: Number of articles
        """
        if count > 0 and count <= 100:  # NewsAPI limit
            self.num_results = count
            print(f"Number of news articles set to {count}")
        else:
            print("Number of articles must be between 1 and 100")

    def summarize_last_result(self, style: str = "short") -> str:
        """
        Summarize the last news search result in a different format.

        Args:
            style: Summarization style ("short", "bullet", "key_points")

        Returns:
            Summarized version of the last news search result
        """
        if not self.last_results or not self.last_results.get("answer"):
            return "No previous news search results to summarize."

        original_answer = self.last_results["answer"]
        query = self.last_results.get("query", "")

        # Remove source information for processing
        clean_answer = re.sub(r'_Sources:.*$', '', original_answer, flags=re.MULTILINE | re.DOTALL).strip()

        if style == "bullet":
            # Convert to bullet points by splitting into sentences
            sentences = re.split(r'(?<=[.!?])\s+', clean_answer)
            key_points = []
            for sentence in sentences[:8]:  # Take first 8 sentences
                sentence = sentence.strip()
                if sentence and len(sentence) > 20:
                    key_points.append(f"• {sentence}")

            if key_points:
                summary = f"News Summary: '{query}'\n\n" + "\n".join(key_points)
            else:
                summary = f"Key news: {clean_answer[:300]}..."

        elif style == "key_points":
            # Extract key facts and developments
            sentences = re.split(r'(?<=[.!?])\s+', clean_answer)
            key_sentences = []

            # Look for sentences that contain important information
            for sentence in sentences[:10]:
                sentence = sentence.strip()
                # Skip very short sentences and look for substantial content
                if len(sentence) > 30 and not sentence.lower().startswith(('the', 'a', 'an', 'in', 'on', 'at')):
                    key_sentences.append(sentence)

            if key_sentences:
                summary = f"Key Developments in '{query}':\n\n" + "\n".join(f"• {s}" for s in key_sentences[:6])
            else:
                summary = f"Key news: {clean_answer[:400]}..."

        else:  # "short" style (default)
            # Shorter version with main points
            sentences = re.split(r'(?<=[.!?])\s+', clean_answer)
            key_sentences = sentences[:4]  # Take first 4 sentences
            summary = " ".join(key_sentences)

            if len(summary) > 400:
                summary = summary[:397] + "..."

        return summary + "\n\n_Summarized from latest news articles._"


def main():
    """Command-line interface for Nova News."""
    news_system = NovaNews()

    print("Nova News - All-in-One News Search System")
    print("==========================================")
    print("Enter a news topic or question, or use these commands:")
    print("  'open <number>' - Open an article in browser")
    print("  'results <number>' - Set number of articles (1-100)")
    print("  'summarize' - Summarize last result in different style")
    print("  'quit' or 'exit' - Exit the program")
    print()

    while True:
        try:
            query = input("News query: ").strip()

            if not query:
                continue

            if query.lower() in ['quit', 'exit', 'q']:
                print("Goodbye!")
                break

            # Handle special commands
            if query.lower().startswith('open '):
                try:
                    index = int(query.split()[1]) - 1  # Convert to 0-based
                    news_system.open_result(index)
                except (ValueError, IndexError):
                    print("Usage: open <number> (e.g., 'open 1')")
                continue

            elif query.lower().startswith('results '):
                try:
                    count = int(query.split()[1])
                    news_system.set_results_count(count)
                except (ValueError, IndexError):
                    print("Usage: results <number> (e.g., 'results 20')")
                continue

            elif query.lower() == 'summarize':
                style = input("Summarization style (short/bullets/key_points): ").strip().lower()
                if style not in ['short', 'bullets', 'key_points']:
                    style = 'short'
                summary = news_system.summarize_last_result(style)
                print(f"\n{summary}\n")
                continue

            # Regular news search
            result = news_system.search(query)
            print(f"\n{result['answer']}\n")

        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
        except Exception as e:
            print(f"Error: {e}")
            continue

if __name__ == "__main__":
    main()