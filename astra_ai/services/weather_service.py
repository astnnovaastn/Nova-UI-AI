from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv

logger = logging.getLogger(__name__)


class WeatherService:
    """WeatherAPI.com-backed weather service."""

    def __init__(self, api_key: Optional[str] = None) -> None:
        load_dotenv()
        self.api_key = api_key or os.getenv("WEATHER_API_KEY") or os.getenv("WEATHERAPI_API_KEY")
        if not self.api_key:
            raise ValueError("WeatherAPI.com API key is required")
        self.base_url = "https://api.weatherapi.com/v1"

    def _request(self, endpoint: str, **params: Any) -> Dict[str, Any]:
        response = requests.get(
            f"{self.base_url}/{endpoint}",
            params={"key": self.api_key, **params},
            timeout=15,
        )
        response.raise_for_status()
        payload = response.json() or {}
        if not isinstance(payload, dict):
            raise ValueError("Weather provider returned an invalid response")
        if payload.get("error"):
            raise ValueError(str((payload.get("error") or {}).get("message") or "Weather provider error"))
        return payload

    def _is_coordinate_query(self, location: str) -> bool:
        parts = [part.strip() for part in str(location or "").split(",", 1)]
        if len(parts) != 2:
            return False
        try:
            float(parts[0])
            float(parts[1])
            return True
        except (TypeError, ValueError):
            return False

    def _format_time_label(self, epoch_seconds: Optional[int], timezone_name: str) -> str:
        if epoch_seconds is None:
            return "--"
        try:
            from zoneinfo import ZoneInfo

            dt = datetime.fromtimestamp(int(epoch_seconds), tz=ZoneInfo(timezone_name))
        except Exception:
            dt = datetime.fromtimestamp(int(epoch_seconds))
        return dt.strftime("%I %p").lstrip("0")

    def _format_clock(self, text_value: str) -> str:
        for fmt in ("%I:%M %p", "%H:%M"):
            try:
                return datetime.strptime(str(text_value), fmt).strftime("%H:%M")
            except ValueError:
                continue
        return str(text_value or "--:--").strip() or "--:--"

    def _wind_direction(self, degrees: Optional[float], fallback: str = "") -> str:
        if fallback:
            return fallback
        if degrees is None:
            return "Direction unavailable"
        directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
        return directions[round(float(degrees) / 45) % 8]

    def _estimate_dew_point_c(self, temperature_c: float, humidity: float) -> Optional[int]:
        try:
            import math

            if humidity <= 0:
                return None
            a = 17.27
            b = 237.7
            alpha = ((a * temperature_c) / (b + temperature_c)) + math.log(humidity / 100.0)
            dew_point = (b * alpha) / (a - alpha)
            return round(dew_point)
        except Exception:
            return None

    def _map_air_quality_label(self, us_epa_index: Any) -> str:
        return {
            1: "Good",
            2: "Moderate",
            3: "Unhealthy for Sensitive Groups",
            4: "Unhealthy",
            5: "Very Unhealthy",
            6: "Hazardous",
        }.get(us_epa_index, "Unavailable")

    def _get_condition_emoji(self, condition: str) -> str:
        normalized = str(condition or "").lower()
        if "tornado" in normalized:
            return "🌪️"
        if "thunder" in normalized:
            return "⛈️"
        if "snow" in normalized or "blizzard" in normalized:
            return "❄️"
        if "sleet" in normalized or "ice" in normalized or "hail" in normalized:
            return "🌨️"
        if "rain" in normalized or "drizzle" in normalized or "shower" in normalized:
            return "🌧️"
        if "fog" in normalized or "mist" in normalized or "haze" in normalized or "smoke" in normalized:
            return "🌫️"
        if "cloud" in normalized or "overcast" in normalized:
            return "☁️"
        if "clear" in normalized or "sunny" in normalized:
            return "☀️"
        return "🌤️"

    def _normalize_hour_entry(self, hour: Dict[str, Any], timezone_name: str, *, is_now: bool = False) -> Dict[str, Any]:
        epoch_seconds = hour.get("time_epoch")
        condition = ((hour.get("condition") or {}).get("text") or "Forecast").strip()
        precip = hour.get("chance_of_rain")
        if precip in (None, ""):
            precip = hour.get("chance_of_snow")
        return {
            "time": "Now" if is_now else self._format_time_label(epoch_seconds, timezone_name),
            "timestamp": datetime.fromtimestamp(int(epoch_seconds)).isoformat() if epoch_seconds else "",
            "icon": self._get_condition_emoji(condition),
            "condition": condition,
            "temperature": round(hour.get("temp_c")) if hour.get("temp_c") is not None else "--",
            "precipChance": round(float(precip)) if precip not in (None, "") else None,
            "uvIndex": hour.get("uv"),
            "cloudCover": hour.get("cloud"),
            "isNow": is_now,
            "isDay": bool(hour.get("is_day", 1)),
        }

    def _build_forecast_payloads(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        location_block = payload.get("location") or {}
        current_block = payload.get("current") or {}
        forecast_block = payload.get("forecast") or {}
        timezone_name = str(location_block.get("tz_id") or "UTC")
        localtime_epoch = int(location_block.get("localtime_epoch") or current_block.get("last_updated_epoch") or datetime.now().timestamp())
        current_hour_start = localtime_epoch - (localtime_epoch % 3600)

        hourly_forecast: List[Dict[str, Any]] = []
        forecast_days: List[Dict[str, Any]] = []

        for day_index, day in enumerate(forecast_block.get("forecastday") or []):
            day_block = day.get("day") or {}
            astro_block = day.get("astro") or {}
            date_key = str(day.get("date") or "")
            day_hours: List[Dict[str, Any]] = []

            for hour in day.get("hour") or []:
                hour_epoch = hour.get("time_epoch")
                if hour_epoch is None:
                    continue
                if int(hour_epoch) < current_hour_start:
                    continue
                normalized_hour = self._normalize_hour_entry(hour, timezone_name)
                if not hourly_forecast:
                    normalized_hour["time"] = "Now"
                    normalized_hour["isNow"] = True
                hourly_forecast.append(normalized_hour)
                day_hours.append(normalized_hour)

            forecast_days.append(
                {
                    "date": date_key,
                    "label": "Today" if day_index == 0 else datetime.strptime(date_key, "%Y-%m-%d").strftime("%a"),
                    "fullLabel": datetime.strptime(date_key, "%Y-%m-%d").strftime("%a, %b %d") if date_key else "Forecast",
                    "isToday": day_index == 0,
                    "high": round(day_block.get("maxtemp_c")) if day_block.get("maxtemp_c") is not None else "--",
                    "low": round(day_block.get("mintemp_c")) if day_block.get("mintemp_c") is not None else "--",
                    "sunrise": self._format_clock(str(astro_block.get("sunrise") or "--:--")),
                    "sunset": self._format_clock(str(astro_block.get("sunset") or "--:--")),
                    "hourly": day_hours,
                }
            )

        return {
            "hourlyForecast": hourly_forecast,
            "forecastDays": forecast_days,
        }

    def get_weather(self, location: str) -> Dict[str, Any]:
        try:
            payload = self._request("forecast.json", q=location, days=1, aqi="yes", alerts="yes")
            location_block = payload.get("location") or {}
            current_block = payload.get("current") or {}
            forecast_day = ((payload.get("forecast") or {}).get("forecastday") or [{}])[0] or {}
            day_block = forecast_day.get("day") or {}
            condition = ((current_block.get("condition") or {}).get("text") or "Current").strip()
            return {
                "coordinates": {
                    "lat": location_block.get("lat"),
                    "lon": location_block.get("lon"),
                },
                "location": f"{location_block.get('name')}, {location_block.get('region') or location_block.get('country')}".strip(", "),
                "temperature": {
                    "current": round(current_block.get("temp_c")) if current_block.get("temp_c") is not None else "--",
                    "feels_like": round(current_block.get("feelslike_c")) if current_block.get("feelslike_c") is not None else "--",
                    "min": round(day_block.get("mintemp_c")) if day_block.get("mintemp_c") is not None else "--",
                    "max": round(day_block.get("maxtemp_c")) if day_block.get("maxtemp_c") is not None else "--",
                },
                "conditions": {
                    "main": condition,
                    "description": condition,
                    "icon": self._get_condition_emoji(condition),
                },
                "humidity": current_block.get("humidity"),
                "wind": {
                    "speed": round(current_block.get("wind_kph"), 1) if current_block.get("wind_kph") is not None else "--",
                    "direction": self._wind_direction(current_block.get("wind_degree"), str(current_block.get("wind_dir") or "")),
                },
                "pressure": current_block.get("pressure_mb"),
                "visibility_km": current_block.get("vis_km"),
                "cloud_cover": current_block.get("cloud"),
                "updated_at": current_block.get("last_updated") or datetime.now().isoformat(),
                "sunrise": self._format_clock(str((forecast_day.get("astro") or {}).get("sunrise") or "--:--")),
                "sunset": self._format_clock(str((forecast_day.get("astro") or {}).get("sunset") or "--:--")),
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
        except Exception as exc:
            logger.error("Error fetching weather data: %s", exc)
            return {"error": f"Failed to fetch weather data: {exc}"}

    def get_forecast(self, location: str, days: int = 3) -> Dict[str, Any]:
        try:
            payload = self._request("forecast.json", q=location, days=max(1, min(days, 3)), aqi="yes", alerts="yes")
            location_block = payload.get("location") or {}
            forecast_days = self._build_forecast_payloads(payload)
            return {
                "location": f"{location_block.get('name')}, {location_block.get('region') or location_block.get('country')}".strip(", "),
                "forecast": forecast_days["hourlyForecast"],
                "forecastDays": forecast_days["forecastDays"],
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
        except Exception as exc:
            logger.error("Error fetching forecast data: %s", exc)
            return {"error": f"Failed to fetch forecast data: {exc}"}

    def get_air_quality(self, lat: float, lon: float) -> Dict[str, Any]:
        try:
            payload = self._request("current.json", q=f"{lat},{lon}", aqi="yes")
            current_block = payload.get("current") or {}
            air = current_block.get("air_quality") or {}
            index = air.get("us-epa-index")
            return {
                "aqi": index if index is not None else "--",
                "label": self._map_air_quality_label(index),
                "value": air.get("pm2_5"),
            }
        except Exception as exc:
            logger.warning("Air quality lookup failed: %s", exc)
            return {}

    def get_today_hourly_forecast(self, location: str, slots: int = 8) -> Dict[str, Any]:
        forecast_data = self.get_forecast(location, days=1)
        if "error" in forecast_data:
            return forecast_data
        return {
            "location": forecast_data.get("location"),
            "forecast": (forecast_data.get("forecast") or [])[:slots],
        }

    def get_grouped_forecast_days(self, location: str, days: int = 3, slots_per_day: int = 24) -> Dict[str, Any]:
        forecast_data = self.get_forecast(location, days=days)
        if "error" in forecast_data:
            return forecast_data
        grouped = []
        for day in forecast_data.get("forecastDays") or []:
            grouped.append(
                {
                    **day,
                    "hourly": (day.get("hourly") or [])[:slots_per_day],
                }
            )
        return {
            "location": forecast_data.get("location"),
            "forecastDays": grouped,
        }

    def format_weather_response(self, weather_data: Dict[str, Any]) -> str:
        if "error" in weather_data:
            return f"❌ {weather_data['error']}"
        try:
            return "\n".join(
                [
                    f"🌤️ Weather in {weather_data['location']}:",
                    f"🌡️ Temperature: {weather_data['temperature']['current']}°C",
                    f"   Feels like: {weather_data['temperature']['feels_like']}°C",
                    f"   Min/Max: {weather_data['temperature']['min']}°C / {weather_data['temperature']['max']}°C",
                    f"🌪️ Conditions: {weather_data['conditions']['description']}",
                    f"💧 Humidity: {weather_data['humidity']}%",
                    f"💨 Wind: {weather_data['wind']['speed']} km/h {weather_data['wind']['direction']}",
                    f"🌅 Sunrise: {weather_data['sunrise']}",
                    f"🌇 Sunset: {weather_data['sunset']}",
                ]
            )
        except Exception as exc:
            logger.error("Error formatting weather response: %s", exc)
            return "❌ Sorry, I couldn't format the weather information properly."

    def format_forecast_response(self, forecast_data: Dict[str, Any]) -> str:
        if "error" in forecast_data:
            return f"❌ {forecast_data['error']}"
        location = forecast_data.get("location") or "that location"
        lines = [f"🌤️ Weather Forecast for {location}", ""]
        for day in forecast_data.get("forecastDays") or []:
            hourly = day.get("hourly") or []
            high = day.get("high", "--")
            low = day.get("low", "--")
            summary = hourly[0].get("condition") if hourly else "Forecast"
            lines.extend(
                [
                    f"📅 {day.get('fullLabel') or day.get('label')}",
                    f"🌡️ Temperature: {low}°C - {high}°C",
                    f"🌤️ Conditions: {summary}",
                    "",
                ]
            )
        return "\n".join(lines).strip()

    def get_comprehensive_weather_data(self, location: str) -> Dict[str, Any]:
        try:
            payload = self._request("forecast.json", q=location, days=3, aqi="yes", alerts="yes")
            location_block = payload.get("location") or {}
            current_block = payload.get("current") or {}
            forecast_block = payload.get("forecast") or {}
            alerts_block = ((payload.get("alerts") or {}).get("alert")) or []

            forecast_payloads = self._build_forecast_payloads(payload)
            forecast_days = forecast_payloads["forecastDays"]
            hourly_forecast = forecast_payloads["hourlyForecast"]
            today_block = forecast_days[0] if forecast_days else {}
            day_data = ((forecast_block.get("forecastday") or [{}])[0] or {}).get("day") or {}
            condition = ((current_block.get("condition") or {}).get("text") or "Current").strip()
            temperature = round(current_block.get("temp_c")) if current_block.get("temp_c") is not None else "--"
            humidity = current_block.get("humidity")
            dew_point = self._estimate_dew_point_c(float(temperature), float(humidity)) if temperature != "--" and humidity not in (None, "--") else None
            precip_now = next((item.get("precipChance") for item in hourly_forecast if item.get("precipChance") is not None), None)

            air_quality = {}
            current_air = current_block.get("air_quality") or {}
            if current_air:
                air_index = current_air.get("us-epa-index")
                air_quality = {
                    "aqi": air_index if air_index is not None else "--",
                    "label": self._map_air_quality_label(air_index),
                    "value": current_air.get("pm2_5"),
                }

            alerts = []
            for index, alert in enumerate(alerts_block):
                if not isinstance(alert, dict):
                    continue
                alerts.append(
                    {
                        "id": f"alert-{index}",
                        "title": str(alert.get("headline") or alert.get("event") or "Weather Alert").strip(),
                        "source": str(alert.get("areas") or "WeatherAPI.com").strip(),
                        "startsAt": str(alert.get("effective") or "").strip(),
                        "endsAt": str(alert.get("expires") or "").strip(),
                        "description": str(alert.get("desc") or "").strip(),
                    }
                )

            updated_at = str(current_block.get("last_updated") or datetime.now().isoformat()).replace(" ", "T")
            resolved_location = f"{location_block.get('name')}, {location_block.get('region') or location_block.get('country')}".strip(", ")
            current_payload = {
                "temperature": temperature,
                "feelsLike": round(current_block.get("feelslike_c")) if current_block.get("feelslike_c") is not None else "--",
                "condition": condition,
                "icon": self._get_condition_emoji(condition),
                "conditionEmoji": self._get_condition_emoji(condition),
                "high": today_block.get("high", round(day_data.get("maxtemp_c")) if day_data.get("maxtemp_c") is not None else "--"),
                "low": today_block.get("low", round(day_data.get("mintemp_c")) if day_data.get("mintemp_c") is not None else "--"),
                "location": resolved_location,
                "updatedAt": updated_at,
            }

            return {
                **current_payload,
                "humidity": humidity if humidity is not None else "--",
                "uvIndex": current_block.get("uv", "--"),
                "visibility": current_block.get("vis_km"),
                "windSpeed": round(current_block.get("wind_kph"), 1) if current_block.get("wind_kph") is not None else "--",
                "windDirection": self._wind_direction(current_block.get("wind_degree"), str(current_block.get("wind_dir") or "")),
                "pressure": current_block.get("pressure_mb"),
                "dewPoint": dew_point if dew_point is not None else "--",
                "sunrise": str(today_block.get("sunrise") or "--:--"),
                "sunset": str(today_block.get("sunset") or "--:--"),
                "location": resolved_location,
                "precipChance": precip_now,
                "airQuality": air_quality or None,
                "alerts": alerts,
                "hourlyForecast": hourly_forecast,
                "forecastDays": forecast_days,
                "selectedForecastDate": today_block.get("date"),
                "radarSummary": {
                    "points": [
                        {
                            "time": item.get("time"),
                            "precipChance": item.get("precipChance"),
                            "cloudCover": item.get("cloudCover"),
                        }
                        for item in hourly_forecast
                        if not item.get("isNow")
                    ],
                },
                "viewsAvailable": {
                    "now": True,
                    "hourly": len(hourly_forecast) > 0,
                    "radar": False,
                },
                "meta": {
                    "location": resolved_location,
                    "updatedAt": updated_at,
                    "source": "weatherapi.com",
                    "unitSystem": "metric",
                    "timezoneId": location_block.get("tz_id"),
                    "latitude": location_block.get("lat"),
                    "longitude": location_block.get("lon"),
                    "localtimeEpoch": location_block.get("localtime_epoch"),
                },
                "current": current_payload,
                "metrics": {
                    "humidity": humidity if humidity is not None else "--",
                    "windSpeed": round(current_block.get("wind_kph"), 1) if current_block.get("wind_kph") is not None else "--",
                    "windDirection": self._wind_direction(current_block.get("wind_degree"), str(current_block.get("wind_dir") or "")),
                    "precipChance": precip_now,
                    "uvIndex": current_block.get("uv", "--"),
                    "visibility": current_block.get("vis_km"),
                    "pressure": current_block.get("pressure_mb"),
                    "dewPoint": dew_point if dew_point is not None else "--",
                    "sunrise": str(today_block.get("sunrise") or "--:--"),
                    "sunset": str(today_block.get("sunset") or "--:--"),
                    "airQuality": air_quality or None,
                },
                "provider": {
                    "name": "weatherapi.com",
                    "query": location,
                    "coordinates": {
                        "lat": location_block.get("lat"),
                        "lon": location_block.get("lon"),
                    },
                },
            }
        except Exception as exc:
            logger.error("Error getting comprehensive weather data: %s", exc)
            return {"error": f"Failed to get comprehensive weather data: {exc}"}
