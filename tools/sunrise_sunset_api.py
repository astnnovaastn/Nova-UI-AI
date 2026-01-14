import requests
import argparse
import sys
from datetime import datetime
from typing import Dict, Optional, Any

#NIGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGA
BASE_URL = "https://api.sunrise-sunset.org/json"

DEFAULT_COORDINATES = {
    "lat": 45.58,
    "lng": 9.27
}

# API request timeout (in seconds)
REQUEST_TIMEOUT = 30


class SunriseSunsetAPI:
   
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        # Set default headers
        self.session.headers.update({
            'User-Agent': 'SunriseSunset-API-Client/1.0',
            'Accept': 'application/json'
        })
    
    def get_sunrise_sunset(
        self, 
        latitude: float = None, 
        longitude: float = None,
        date: str = None,  # Format: YYYY-MM-DD, or 'today' (default)
        formatted: bool = True  # Whether to return formatted times (default true)
    ) -> Optional[Dict[str, Any]]:
            
        
        lat = latitude or DEFAULT_COORDINATES["lat"]
        lng = longitude or DEFAULT_COORDINATES["lng"]
        
        # Prepare parameters
        params = {
            "lat": lat,
            "lng": lng,
            "formatted": int(formatted)  # API expects 1 or 0
        }
        
        if date:
            params["date"] = date
        
        try:
            response = self.session.get(
                self.base_url,
                params=params,
                timeout=REQUEST_TIMEOUT
            )
            response.raise_for_status()  # Raise an exception for bad status codes
            return response.json()
        
        except requests.exceptions.RequestException as e:
            print(f"Error making request to Sunrise Sunset API: {e}")
            return None
        except ValueError as e:  # JSON decode error
            print(f"Error parsing JSON response: {e}")
            return None
    
    def format_sun_data(self, data: Dict[str, Any], date: str = None) -> str:
        
        if not data:
            return "No sunrise/sunset data available"
        
        try:
            results = data.get("results", {})
            
            # Determine the date to display
            display_date = date if date else "Today"
            if date == "today":
                display_date = "Today"
            
            formatted_output = []
            formatted_output.append(f"Sunrise/Sunset Information for {display_date}:")
            formatted_output.append("=" * 50)
            
            if results:
                formatted_output.append(f"Sunrise: {results.get('sunrise', 'N/A')}")
                formatted_output.append(f"Sunset: {results.get('sunset', 'N/A')}")
                
                # Add additional information
                formatted_output.append(f"Day Length: {results.get('day_length', 'N/A')}")
                formatted_output.append(f"Sunrise civil twilight: {results.get('civil_twilight_begin', 'N/A')} - {results.get('civil_twilight_end', 'N/A')}")
                formatted_output.append(f"Sunrise nautical twilight: {results.get('nautical_twilight_begin', 'N/A')} - {results.get('nautical_twilight_end', 'N/A')}")
                formatted_output.append(f"Sunrise astronomical twilight: {results.get('astronomical_twilight_begin', 'N/A')} - {results.get('astronomical_twilight_end', 'N/A')}")
            
            return "\n".join(formatted_output)
        
        except Exception as e:
            return f"Error formatting sunrise/sunset data: {e}"


def main():
    
    parser = argparse.ArgumentParser(description="Sunrise Sunset API Client")
    parser.add_argument("--latitude", type=float, default=None, 
                        help="Latitude coordinate for sunrise/sunset data")
    parser.add_argument("--longitude", type=float, default=None, 
                        help="Longitude coordinate for sunrise/sunset data")
    parser.add_argument("--date", type=str, default=None, 
                        help="Date in YYYY-MM-DD format or 'today' (default: today)")
    parser.add_argument("--no-format", action="store_true", 
                        help="Return unformatted times (default: formatted)")
    
    args = parser.parse_args()
    
    # Initialize the API client
    api_client = SunriseSunsetAPI()
    
    # Use default coordinates if not provided via arguments
    latitude = args.latitude if args.latitude is not None else DEFAULT_COORDINATES["lat"]
    longitude = args.longitude if args.longitude is not None else DEFAULT_COORDINATES["lng"]
    date = args.date if args.date is not None else "today"
    formatted = not args.no_format  # Invert because --no-format means unformatted
    
    print(f"Fetching sunrise/sunset data for coordinates: {latitude}, {longitude}")
    print(f"Date: {date}")
    
    # Get sunrise/sunset data
    sun_data = api_client.get_sunrise_sunset(latitude, longitude, date, formatted)
    
    # Display formatted sunrise/sunset data
    if sun_data:
        formatted_output = api_client.format_sun_data(sun_data, date)
        print(formatted_output)
    else:
        print("Failed to retrieve sunrise/sunset data. Please check your connection and try again.")
        sys.exit(1)


if __name__ == "__main__":
    main()