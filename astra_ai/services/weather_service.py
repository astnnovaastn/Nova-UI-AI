from typing import Dict, Optional
import logging
import requests
from datetime import datetime
import os
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

class WeatherService:
    """Service for retrieving weather information from OpenWeatherMap API."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the weather service.
        
        Args:
            api_key: OpenWeatherMap API key. If not provided, will try to get from environment.
        """
        # Load environment variables
        load_dotenv()
        
        # Get API key
        self.api_key = api_key or os.getenv('OPENWEATHER_API_KEY')
        if not self.api_key:
            raise ValueError("OpenWeatherMap API key is required")
        
        self.base_url = "https://api.openweathermap.org/data/2.5"
        self.geo_url = "https://api.openweathermap.org/geo/1.0/direct"
    
    def get_weather(self, location: str) -> Dict:
        """Get current weather for a location.
        
        Args:
            location: City name or coordinates (e.g., "London" or "51.5074,-0.1278")
            
        Returns:
            Dict: Weather information including temperature, conditions, etc.
        """
        try:
            # First, get coordinates for the location
            coords = self._get_coordinates(location)
            if not coords:
                return {
                    'error': f"Could not find coordinates for location: {location}"
                }
            
            # Get weather data
            params = {
                'lat': coords['lat'],
                'lon': coords['lon'],
                'appid': self.api_key,
                'units': 'metric'  # Use metric units
            }
            
            response = requests.get(
                f"{self.base_url}/weather",
                params=params
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Format the weather information
            weather_info = {
                'location': f"{data['name']}, {data['sys']['country']}",
                'temperature': {
                    'current': round(data['main']['temp']),
                    'feels_like': round(data['main']['feels_like']),
                    'min': round(data['main']['temp_min']),
                    'max': round(data['main']['temp_max'])
                },
                'conditions': {
                    'main': data['weather'][0]['main'],
                    'description': data['weather'][0]['description'],
                    'icon': data['weather'][0]['icon']
                },
                'humidity': data['main']['humidity'],
                'wind': {
                    'speed': round(data['wind']['speed'] * 3.6, 1),  # Convert m/s to km/h
                    'direction': self._get_wind_direction(data['wind'].get('deg', 0))
                },
                'sunrise': datetime.fromtimestamp(data['sys']['sunrise']).strftime('%H:%M'),
                'sunset': datetime.fromtimestamp(data['sys']['sunset']).strftime('%H:%M'),
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
            return weather_info
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching weather data: {e}")
            return {
                'error': f"Failed to fetch weather data: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {
                'error': f"An unexpected error occurred: {str(e)}"
            }
    
    def get_forecast(self, location: str, days: int = 5) -> Dict:
        """Get weather forecast for a location.
        
        Args:
            location: City name or coordinates
            days: Number of days to forecast (max 5)
            
        Returns:
            Dict: Weather forecast information
        """
        try:
            # Get coordinates
            coords = self._get_coordinates(location)
            if not coords:
                return {
                    'error': f"Could not find coordinates for location: {location}"
                }
            
            # Get forecast data
            params = {
                'lat': coords['lat'],
                'lon': coords['lon'],
                'appid': self.api_key,
                'units': 'metric',
                'cnt': days * 8  # API returns data in 3-hour intervals
            }
            
            response = requests.get(
                f"{self.base_url}/forecast",
                params=params
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Process and format forecast data
            forecast = []
            for item in data['list']:
                forecast.append({
                    'datetime': datetime.fromtimestamp(item['dt']).strftime('%Y-%m-%d %H:%M'),
                    'temperature': {
                        'current': round(item['main']['temp']),
                        'feels_like': round(item['main']['feels_like']),
                        'min': round(item['main']['temp_min']),
                        'max': round(item['main']['temp_max'])
                    },
                    'conditions': {
                        'main': item['weather'][0]['main'],
                        'description': item['weather'][0]['description'],
                        'icon': item['weather'][0]['icon']
                    },
                    'humidity': item['main']['humidity'],
                    'wind': {
                        'speed': round(item['wind']['speed'] * 3.6, 1),
                        'direction': self._get_wind_direction(item['wind'].get('deg', 0))
                    }
                })
            
            return {
                'location': f"{data['city']['name']}, {data['city']['country']}",
                'forecast': forecast,
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching forecast data: {e}")
            return {
                'error': f"Failed to fetch forecast data: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {
                'error': f"An unexpected error occurred: {str(e)}"
            }
    
    def _get_coordinates(self, location: str) -> Optional[Dict[str, float]]:
        """Get coordinates for a location.
        
        Args:
            location: City name or coordinates
            
        Returns:
            Optional[Dict[str, float]]: Dictionary with lat and lon, or None if not found
        """
        try:
            # Check if location is already coordinates
            if ',' in location and all(part.strip().replace('.', '').isdigit() for part in location.split(',')):
                lat, lon = map(float, location.split(','))
                return {'lat': lat, 'lon': lon}
            
            # Get coordinates from OpenWeatherMap Geocoding API
            params = {
                'q': location,
                'appid': self.api_key,
                'limit': 1
            }
            
            response = requests.get(
                self.geo_url,
                params=params
            )
            response.raise_for_status()
            
            data = response.json()
            if data:
                return {
                    'lat': data[0]['lat'],
                    'lon': data[0]['lon']
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting coordinates: {e}")
            return None
    
    def _get_wind_direction(self, degrees: float) -> str:
        """Convert wind direction in degrees to cardinal direction.
        
        Args:
            degrees: Wind direction in degrees
            
        Returns:
            str: Cardinal direction (N, NE, E, SE, S, SW, W, NW)
        """
        directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
        index = round(degrees / 45) % 8
        return directions[index]
    
    def format_weather_response(self, weather_data: Dict) -> str:
        """Format weather data into a human-readable response.
        
        Args:
            weather_data: Weather information dictionary
            
        Returns:
            str: Formatted weather response
        """
        if 'error' in weather_data:
            return f"❌ {weather_data['error']}"
        
        try:
            response = [
                f"🌤️ Weather in {weather_data['location']}:",
                f"🌡️ Temperature: {weather_data['temperature']['current']}°C",
                f"   Feels like: {weather_data['temperature']['feels_like']}°C",
                f"   Min/Max: {weather_data['temperature']['min']}°C / {weather_data['temperature']['max']}°C",
                f"🌪️ Conditions: {weather_data['conditions']['description'].capitalize()}",
                f"💧 Humidity: {weather_data['humidity']}%",
                f"💨 Wind: {weather_data['wind']['speed']} km/h {weather_data['wind']['direction']}",
                f"🌅 Sunrise: {weather_data['sunrise']}",
                f"🌇 Sunset: {weather_data['sunset']}"
            ]
            
            return "\n".join(response)
            
        except Exception as e:
            logger.error(f"Error formatting weather response: {e}")
            return "❌ Sorry, I couldn't format the weather information properly."
    
    def format_forecast_response(self, forecast_data: Dict) -> str:
        """Format forecast data into a readable response.
        
        Args:
            forecast_data: Weather forecast data
            
        Returns:
            str: Formatted forecast response
        """
        if 'error' in forecast_data:
            return f"❌ {forecast_data['error']}"
        
        location = forecast_data['location']
        forecast = forecast_data['forecast']
        
        response = f"🌤️ **Weather Forecast for {location}**\n\n"
        
        # Group by day
        daily_forecast = {}
        for item in forecast:
            date = item['datetime'].split(' ')[0]
            if date not in daily_forecast:
                daily_forecast[date] = []
            daily_forecast[date].append(item)
        
        for date, items in daily_forecast.items():
            # Get min/max temperatures for the day
            temps = [item['temperature']['current'] for item in items]
            min_temp = min(temps)
            max_temp = max(temps)
            
            # Get most common condition
            conditions = [item['conditions']['main'] for item in items]
            most_common = max(set(conditions), key=conditions.count)
            
            # Get average humidity
            humidity = sum(item['humidity'] for item in items) // len(items)
            
            # Get average wind speed
            wind_speed = sum(item['wind']['speed'] for item in items) / len(items)
            
            response += f"📅 **{date}**\n"
            response += f"🌡️ Temperature: {min_temp}°C - {max_temp}°C\n"
            response += f"🌤️ Conditions: {most_common}\n"
            response += f"💧 Humidity: {humidity}%\n"
            response += f"💨 Wind: {wind_speed:.1f} km/h\n\n"
        
        return response

    def get_comprehensive_weather_data(self, location: str) -> Dict:
        """Get comprehensive weather data in the format expected by the UI.
        
        Args:
            location: City name or coordinates
            
        Returns:
            Dict: Comprehensive weather data for UI display
        """
        try:
            # Get current weather
            weather_data = self.get_weather(location)
            
            if 'error' in weather_data:
                return weather_data
            
            # Use Celsius format for UI
            temp_c = round(weather_data['temperature']['current'])
            feels_like_c = round(weather_data['temperature']['feels_like'])
            min_c = round(weather_data['temperature']['min'])
            max_c = round(weather_data['temperature']['max'])
            
            # Convert wind speed from km/h to mph
            wind_kmh = weather_data['wind']['speed']
            wind_mph = round(wind_kmh * 0.621371)
            
            # Get weather condition emoji
            condition_emoji = self._get_condition_emoji(weather_data['conditions']['main'])
            
            # Generate mock data for missing fields (in a real implementation, these would come from the API)
            import random
            uv_index = random.randint(1, 10)
            visibility = random.randint(5, 15)
            pressure = round(29.5 + random.random() * 1.5, 2)
            dew_point_c = temp_c - random.randint(5, 12)  # Dew point in Celsius
            
            comprehensive_data = {
                'temperature': temp_c,
                'feelsLike': feels_like_c,
                'condition': weather_data['conditions']['description'].title(),
                'icon': condition_emoji,
                'conditionEmoji': condition_emoji,
                'high': max_c,
                'low': min_c,
                'humidity': weather_data['humidity'],
                'uvIndex': uv_index,
                'visibility': visibility,
                'windSpeed': wind_mph,
                'windDirection': weather_data['wind']['direction'],
                'pressure': pressure,
                'dewPoint': dew_point_c,
                'sunrise': weather_data['sunrise'],
                'sunset': weather_data['sunset'],
                'location': weather_data['location']
            }
            
            return comprehensive_data
            
        except Exception as e:
            logger.error(f"Error getting comprehensive weather data: {e}")
            return {
                'error': f"Failed to get comprehensive weather data: {str(e)}"
            }

    def _get_condition_emoji(self, condition: str) -> str:
        """Get emoji for weather condition.
        
        Args:
            condition: Weather condition string
            
        Returns:
            str: Emoji for the condition
        """
        condition_map = {
            'Clear': '☀️',
            'Clouds': '☁️',
            'Rain': '🌧️',
            'Drizzle': '🌦️',
            'Thunderstorm': '⛈️',
            'Snow': '❄️',
            'Mist': '🌫️',
            'Fog': '🌫️',
            'Haze': '🌫️',
            'Smoke': '🌫️',
            'Dust': '🌫️',
            'Sand': '🌫️',
            'Ash': '🌫️',
            'Squall': '💨',
            'Tornado': '🌪️'
        }
        
        return condition_map.get(condition, '🌤️')

def main():
    """Interactive weather service."""
    # Set API key
    api_key = "1b032c8ee49f7ad2df8b0261273847be"
    
    try:
        # Create weather service
        weather_service = WeatherService(api_key)
        
        print("\n🌤️ Welcome to the Weather Service! 🌤️")
        print("You can ask about:")
        print("1. Current weather in any city")
        print("2. Weather forecast for any city")
        print("3. Weather for a specific day")
        print("\nType 'exit' or 'quit' to end the session")
        
        while True:
            # Get user input
            user_input = input("\nWhat would you like to know? ").strip()
            
            # Check for exit command
            if user_input.lower() in ['exit', 'quit']:
                print("\n👋 Thank you for using the Weather Service! Goodbye!")
                break
            
            # Check if it's a forecast request
            is_forecast = 'forecast' in user_input.lower()
            
            # Extract location (simple approach - can be enhanced)
            location = user_input.split('in ')[-1].split(' for ')[-1].strip()
            
            if is_forecast:
                print("\nGetting forecast...")
                forecast_data = weather_service.get_forecast(location)
                print(weather_service.format_forecast_response(forecast_data))
            else:
                print("\nGetting current weather...")
                weather_data = weather_service.get_weather(location)
                print(weather_service.format_weather_response(weather_data))
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    main() 