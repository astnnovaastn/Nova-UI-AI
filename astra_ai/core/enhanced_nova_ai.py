from typing import Dict, List, Optional, Any
import logging
import asyncio
from datetime import datetime, timedelta
import re

from .context_manager import ContextManager
from .response_generator import ResponseGenerator
from .sentiment_analyzer import SentimentAnalyzer
from ..memory.vector_memory import VectorMemorySystem
from ..memory.semantic_memory import SemanticMemory
from ..services.nova_searchweb_unified import NovaSearch
from ..services.weather_service import WeatherService
from ..services.news_summary import NewsSummarySystem

logger = logging.getLogger(__name__)

class EnhancedNovaAI:
    """Enhanced AI system with advanced memory, context understanding, and natural response generation."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the EnhancedNovaAI system.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config
        
        # Initialize components
        self.context_manager = ContextManager()
        self.response_generator = ResponseGenerator()
        self.sentiment_analyzer = SentimentAnalyzer()
        self.vector_memory = VectorMemorySystem()
        self.semantic_memory = SemanticMemory()
        # NovaSearch doesn't accept parameters in constructor - it uses environment variables
        self.search_client = NovaSearch()
        self.weather_service = WeatherService(
            api_key=config.get('openweather_api_key')
        )
        # Initialize news summary system
        self.news_system = NewsSummarySystem()
        
        # Initialize state
        self.conversation_history = []
        self.current_session = {
            'start_time': datetime.now(),
            'messages': [],
            'topics': set(),
            'goals': []
        }
    
    async def process_message(self, message: str) -> str:
        """Process a user message and generate a response.
        
        Args:
            message: The user's message
            
        Returns:
            str: Generated response
        """
        try:
            # Check for weather-related queries
            weather_info = self._process_weather_query(message)
            if weather_info:
                return weather_info
            
            # Check for news-related queries
            news_info = self._process_news_query(message)
            if news_info:
                return news_info
            
            # Analyze sentiment
            sentiment_score, sentiment_analysis = self.sentiment_analyzer.analyze_sentiment(message)
            
            # Update context
            self.context_manager.update_context(message, sentiment_score)
            current_context = self.context_manager.get_current_context()
            
            # Store in vector memory
            self.vector_memory.add_memory(
                text=message,
                metadata={
                    'timestamp': datetime.now().isoformat(),
                    'sentiment': sentiment_score,
                    'context': current_context
                }
            )
            
            # Search for relevant information
            search_results = await self._perform_search(message)
            
            # Generate response
            response = self.response_generator.generate_response(
                context=current_context,
                intent=current_context['user_intent'],
                sentiment=sentiment_score,
                topic=current_context['current_topic']
            )
            
            # Update conversation history
            self._update_conversation_history(message, response, sentiment_analysis)
            
            # Store response in memory
            self.vector_memory.add_memory(
                text=response,
                metadata={
                    'timestamp': datetime.now().isoformat(),
                    'is_response': True,
                    'context': current_context
                }
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return "I apologize, but I'm having trouble processing your message right now."
    
    def _process_weather_query(self, message: str) -> Optional[str]:
        """Process weather-related queries.
        
        Args:
            message: User message
            
        Returns:
            Optional[str]: Weather information if query is weather-related, None otherwise
        """
        # Weather query patterns
        weather_patterns = [
            r'weather\s+(?:in|at|for)\s+([\w\s,]+)',
            r'forecast\s+(?:in|at|for)\s+([\w\s,]+)',
            r'temperature\s+(?:in|at|for)\s+([\w\s,]+)',
            r'how\s+(?:is|are)\s+the\s+weather\s+(?:in|at|for)\s+([\w\s,]+)',
            r'what\s+(?:is|are)\s+the\s+weather\s+(?:in|at|for)\s+([\w\s,]+)',
            r'weather\s+like\s+(?:in|at|for)\s+([\w\s,]+)',
            r'weather\s+(?:in|at|for)\s+([\w\s,]+)\s+(?:tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)',
            r'forecast\s+(?:in|at|for)\s+([\w\s,]+)\s+(?:tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)'
        ]
        
        # Check for weather patterns
        for pattern in weather_patterns:
            match = re.search(pattern, message.lower())
            if match:
                location = match.group(1).strip()
                
                # Check if it's a forecast request
                is_forecast = 'forecast' in message.lower()
                
                # Check for specific day
                days = {
                    'today': 0,
                    'tomorrow': 1,
                    'monday': 1,
                    'tuesday': 2,
                    'wednesday': 3,
                    'thursday': 4,
                    'friday': 5,
                    'saturday': 6,
                    'sunday': 7
                }
                
                target_day = None
                for day in days:
                    if day in message.lower():
                        target_day = days[day]
                        break
                
                try:
                    if target_day is not None:
                        # Get forecast for specific day
                        forecast_data = self.weather_service.get_forecast(location)
                        if 'error' in forecast_data:
                            return f"❌ {forecast_data['error']}"
                        
                        # Find the forecast for the target day
                        target_date = datetime.now() + timedelta(days=target_day)
                        target_date_str = target_date.strftime('%Y-%m-%d')
                        
                        day_forecasts = [f for f in forecast_data['forecast'] 
                                      if f['datetime'].startswith(target_date_str)]
                        
                        if day_forecasts:
                            # Use the forecast closest to noon
                            noon_forecast = min(day_forecasts, 
                                              key=lambda x: abs(int(x['datetime'].split()[1].split(':')[0]) - 12))
                            return self.weather_service.format_weather_response({
                                'location': location,
                                'temperature': noon_forecast['temperature'],
                                'conditions': noon_forecast['conditions'],
                                'humidity': noon_forecast['humidity'],
                                'wind': noon_forecast['wind'],
                                'sunrise': 'N/A',
                                'sunset': 'N/A'
                            })
                        else:
                            return f"❌ Sorry, I couldn't find weather data for {target_date_str}"
                    
                    elif is_forecast:
                        forecast_data = self.weather_service.get_forecast(location)
                        return self.weather_service.format_forecast_response(forecast_data)
                    else:
                        weather_data = self.weather_service.get_weather(location)
                        return self.weather_service.format_weather_response(weather_data)
                        
                except Exception as e:
                    logger.error(f"Error processing weather query: {e}")
                    return f"❌ Sorry, I couldn't get the weather information for {location}."
        
        return None
    
    def _process_news_query(self, message: str) -> Optional[str]:
        """Process news-related queries.
        
        Args:
            message: User message
            
        Returns:
            Optional[str]: News summary if query is news-related, None otherwise
        """
        # News query patterns
        news_patterns = [
            r'news\s+(?:about|on|regarding)\s+([\w\s,]+)',
            r'what\s+(?:is|are)\s+(?:happening|going on)\s+(?:in|at|with)\s+([\w\s,]+)',
            r'(?:latest|recent)\s+news\s+(?:about|on|from)\s+([\w\s,]+)',
            r'tell me about\s+(?:the\s+)?news\s+(?:in|from|about)\s+([\w\s,]+)',
            r'(?:what|any)\s+news\s+(?:about|on|from)\s+([\w\s,]+)',
            r'(?:current|recent)\s+events\s+(?:in|from|about)\s+([\w\s,]+)',
            r'(?:what\s+happened|what\'s happening)\s+(?:in|at|with)\s+([\w\s,]+)',
            r'(?:is going on|going on)\s+(?:in|at|with)\s+([\w\s,]+)',
            r'news\s+(?:in|from|about)\s+([\w\s,]+)',
            r'(?:update|updates)\s+(?:on|about|from)\s+([\w\s,]+)',
            r'(?:headlines|breaking news)\s+(?:from|about|in)\s+([\w\s,]+)'
        ]
        
        # Check for general news requests
        general_news_patterns = [
            r'^(?:news|latest news|recent news|current news)$',
            r'^(?:what\'s|whats)\s+(?:happening|going on)(?:\s+today)?$',
            r'^(?:any|got any)\s+news\??$',
            r'^(?:tell me|give me)\s+(?:the\s+)?news$'
        ]
        
        # Check for specific news patterns
        for pattern in news_patterns:
            match = re.search(pattern, message.lower())
            if match:
                topic = match.group(1).strip()
                try:
                    # Get news summary
                    news_result = self.news_system.get_news_summary(
                        query=f"news about {topic}",
                        allow_source_selection=False  # Disable interactive source selection for AI integration
                    )
                    
                    if news_result and news_result.get('summary'):
                        # Format the response
                        summary = news_result['summary']
                        sources = news_result.get('sources', [])
                        
                        response = f"📰 **News Summary: {topic.title()}**\n\n{summary}"
                        
                        if sources:
                            source_names = [source.get('name', 'Unknown') for source in sources[:3]]
                            response += f"\n\n📍 **Sources:** {', '.join(source_names)}"
                        
                        return response
                    else:
                        return f"📰 I couldn't find recent news about {topic}. Please try a different topic or check back later."
                        
                except Exception as e:
                    logger.error(f"Error processing news query: {e}")
                    return f"❌ Sorry, I couldn't get news information about {topic} right now."
        
        # Check for general news requests
        for pattern in general_news_patterns:
            if re.search(pattern, message.lower()):
                try:
                    # Get general news
                    news_result = self.news_system.get_news_summary(
                        query="latest news today",
                        allow_source_selection=False
                    )
                    
                    if news_result and news_result.get('summary'):
                        summary = news_result['summary']
                        sources = news_result.get('sources', [])
                        
                        response = f"📰 **Latest News Summary**\n\n{summary}"
                        
                        if sources:
                            source_names = [source.get('name', 'Unknown') for source in sources[:3]]
                            response += f"\n\n📍 **Sources:** {', '.join(source_names)}"
                        
                        return response
                    else:
                        return "📰 I couldn't retrieve the latest news right now. Please try again later."
                        
                except Exception as e:
                    logger.error(f"Error processing general news query: {e}")
                    return "❌ Sorry, I couldn't get the latest news right now."
        
        return None
    
    async def _perform_search(self, query: str) -> Dict:
        """Perform a search for relevant information.
        
        Args:
            query: Search query
            
        Returns:
            Dict: Search results
        """
        try:
            # Perform search
            search_results = self.search_client.search(query)
            
            # Process and store relevant results
            if search_results and 'organic_results' in search_results:
                for result in search_results['organic_results'][:3]:
                    self.semantic_memory.add_concept(
                        name=result.get('title', ''),
                        properties={
                            'description': result.get('snippet', ''),
                            'source': result.get('link', ''),
                            'relevance': result.get('relevance_score', 0.0)
                        }
                    )
            
            return search_results
            
        except Exception as e:
            logger.error(f"Error performing search: {e}")
            return {}
    
    def _update_conversation_history(self, 
                                   message: str,
                                   response: str,
                                   sentiment_analysis: Dict):
        """Update the conversation history.
        
        Args:
            message: User message
            response: AI response
            sentiment_analysis: Sentiment analysis results
        """
        entry = {
            'timestamp': datetime.now().isoformat(),
            'message': message,
            'response': response,
            'sentiment': sentiment_analysis,
            'context': self.context_manager.get_current_context()
        }
        
        self.conversation_history.append(entry)
        self.current_session['messages'].append(entry)
        
        # Update session topics
        if self.context_manager.conversation_state['current_topic']:
            self.current_session['topics'].add(
                self.context_manager.conversation_state['current_topic']
            )
    
    def get_conversation_summary(self) -> Dict:
        """Get a summary of the current conversation.
        
        Returns:
            Dict: Conversation summary
        """
        return {
            'session_duration': (datetime.now() - self.current_session['start_time']).total_seconds(),
            'message_count': len(self.current_session['messages']),
            'topics': list(self.current_session['topics']),
            'goals': self.current_session['goals'],
            'current_context': self.context_manager.get_current_context()
        }
    
    def clear_conversation(self):
        """Clear the current conversation."""
        self.conversation_history = []
        self.current_session = {
            'start_time': datetime.now(),
            'messages': [],
            'topics': set(),
            'goals': []
        }
        self.context_manager.clear_context()
    
    def set_conversation_goal(self, goal: str):
        """Set a conversation goal.
        
        Args:
            goal: The goal to set
        """
        self.current_session['goals'].append(goal)
        self.context_manager.set_conversation_goal(goal)

async def main():
    """Test the EnhancedNovaAI system."""
    # Initialize configuration
    config = {
        'search_api_key': 'your_api_key_here',
        'search_base_url': 'https://api.search.example.com',
        'openweather_api_key': 'your_openweather_api_key_here'
    }
    
    # Create EnhancedNovaAI instance
    nova = EnhancedNovaAI(config)
    
    # Test weather functionality
    test_message = "What's the weather in London?"
    print(f"\nUser: {test_message}")
    
    response = await nova.process_message(test_message)
    print(f"\nNova: {response}")
    
    # Test forecast functionality
    test_message = "What's the forecast for New York?"
    print(f"\nUser: {test_message}")
    
    response = await nova.process_message(test_message)
    print(f"\nNova: {response}")
    
    # Test conversation summary
    summary = nova.get_conversation_summary()
    print("\nConversation Summary:")
    print(f"Duration: {summary['session_duration']} seconds")
    print(f"Messages: {summary['message_count']}")
    print(f"Topics: {summary['topics']}")
    print(f"Goals: {summary['goals']}")

if __name__ == "__main__":
    asyncio.run(main()) 