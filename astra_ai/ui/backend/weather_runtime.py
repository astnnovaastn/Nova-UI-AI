from __future__ import annotations

import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional


class WeatherRuntimeService:
    def __init__(
        self,
        *,
        backend_dir: Path,
        weather_service_factory: Callable[[], Any],
        logger: Any,
        fallback_location: str,
        ipinfo_url: str,
    ) -> None:
        self.backend_dir = Path(backend_dir)
        self.weather_service_factory = weather_service_factory
        self.logger = logger
        self.fallback_location = fallback_location
        self.ipinfo_url = ipinfo_url
        self.state_dir = self.backend_dir / "weather_widget_data"
        self.state_dir.mkdir(parents=True, exist_ok=True)
        self.location_snapshot_file = self.state_dir / "location_snapshot.json"
        self.weather_history_file = self.state_dir / "weather_history.json"
        self._client_location = self.default_location_snapshot()

    def default_location_snapshot(self) -> Dict[str, Any]:
        return {
            "label": self.fallback_location,
            "weather_query": self.fallback_location,
            "latitude": None,
            "longitude": None,
            "accuracy": None,
            "updated_at": datetime.now().isoformat(),
            "source": "fallback",
        }

    def _save_location_snapshot(self, snapshot: Dict[str, Any]) -> None:
        self.location_snapshot_file.write_text(json.dumps(snapshot, indent=2), encoding="utf-8")

    def _load_location_snapshot(self) -> Dict[str, Any]:
        if not self.location_snapshot_file.exists():
            return self.default_location_snapshot()
        try:
            return json.loads(self.location_snapshot_file.read_text(encoding="utf-8"))
        except Exception:
            return self.default_location_snapshot()

    async def initialize(self) -> Dict[str, Any]:
        self._client_location = self._load_location_snapshot()
        if not self._client_location:
            self._client_location = self.default_location_snapshot()
        self._save_location_snapshot(self._client_location)
        return self._client_location

    def _fetch_ipinfo_location_snapshot(self) -> Dict[str, Any]:
        return self._client_location or self.default_location_snapshot()

    def refresh_client_location_snapshot(self, force: bool = False) -> Dict[str, Any]:
        if force or not self._client_location:
            self._client_location = self._load_location_snapshot()
        return self._client_location

    async def refresh_client_location_snapshot_async(self, force: bool = False) -> Dict[str, Any]:
        return self.refresh_client_location_snapshot(force=force)

    async def location_refresh_loop(self) -> None:
        while True:
            await asyncio.sleep(600)
            self.refresh_client_location_snapshot(force=False)

    def update_client_location(
        self,
        *,
        latitude: float,
        longitude: float,
        accuracy: Optional[float] = None,
        label: str = "",
    ) -> Dict[str, Any]:
        snapshot = {
            "label": label or self.fallback_location,
            "weather_query": label or f"{latitude},{longitude}",
            "latitude": latitude,
            "longitude": longitude,
            "accuracy": accuracy,
            "updated_at": datetime.now().isoformat(),
            "source": "client",
        }
        self._client_location = snapshot
        self._save_location_snapshot(snapshot)
        return snapshot

    def merge_client_location_label(self, label: str) -> Dict[str, Any]:
        snapshot = dict(self._client_location or self.default_location_snapshot())
        snapshot["label"] = label or snapshot.get("label") or self.fallback_location
        snapshot["weather_query"] = label or snapshot.get("weather_query") or self.fallback_location
        snapshot["updated_at"] = datetime.now().isoformat()
        self._client_location = snapshot
        self._save_location_snapshot(snapshot)
        return snapshot

    def get_client_location(self) -> Dict[str, Any]:
        return dict(self._client_location or self.default_location_snapshot())

    def _read_weather_history(self) -> List[Dict[str, Any]]:
        if not self.weather_history_file.exists():
            return []
        try:
            return json.loads(self.weather_history_file.read_text(encoding="utf-8"))
        except Exception:
            return []

    def _write_weather_history(self, records: List[Dict[str, Any]]) -> None:
        self.weather_history_file.write_text(json.dumps(records, indent=2), encoding="utf-8")

    def _normalize_weather_result(self, location_label: str) -> Dict[str, Any]:
        return {
            "success": True,
            "current": {
                "temperature": "--",
                "feelsLike": "--",
                "condition": "Weather data unavailable",
                "conditionEmoji": "...",
                "icon": "...",
                "high": "--",
                "low": "--",
                "location": location_label,
                "updatedAt": datetime.now().isoformat(),
            },
            "metrics": {
                "humidity": "--",
                "windSpeed": "--",
                "windDirection": "--",
                "precipChance": "--",
                "uvIndex": "--",
                "visibility": "--",
                "pressure": "--",
                "dewPoint": "--",
                "sunrise": "--:--",
                "sunset": "--:--",
                "airQuality": None,
            },
            "hourlyForecast": [],
            "forecastDays": [],
            "radarSummary": {"points": []},
            "alerts": [],
            "viewsAvailable": {"now": True, "hourly": False, "radar": False},
            "meta": {
                "location": location_label,
                "updatedAt": datetime.now().isoformat(),
                "source": "runtime-fallback",
                "unitSystem": "metric",
            },
        }

    def get_current_weather(
        self,
        *,
        location: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        refresh: bool = False,
    ) -> Dict[str, Any]:
        location_label = str(location or self._client_location.get("weather_query") or self.fallback_location).strip() or self.fallback_location
        query = f"{lat},{lon}" if lat is not None and lon is not None else location_label
        try:
            provider = self.weather_service_factory()
            result = provider.get_comprehensive_weather_data(query)
            if not isinstance(result, dict) or result.get("error") or result.get("success") is False:
                raise ValueError("Weather provider returned no usable data")
            if not isinstance(result.get("current"), dict) or result["current"].get("temperature") in (None, "--"):
                raise ValueError("Weather provider returned no current temperature")
            result = {**result, "success": True}
        except Exception as exc:
            # Provider exceptions can contain request URLs with credentials.
            self.logger.warning("Weather lookup failed (%s)", type(exc).__name__)
            return {"success": False, "error": "Unable to load live weather. Check the weather provider configuration and connection, then retry."}
        record = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "requested_at": datetime.now().isoformat(),
            "location": location_label,
            "lat": lat,
            "lon": lon,
            "result": result,
        }
        history = self._read_weather_history()
        history.insert(0, record)
        self._write_weather_history(history[:200])
        return result

    def get_weather_history(self, *, date: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        records = self._read_weather_history()
        if date:
            records = [record for record in records if str(record.get("date") or "") == date]
        return records[:limit]
