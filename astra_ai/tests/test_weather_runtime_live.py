import logging
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

from astra_ai.ui.backend.weather_runtime import WeatherRuntimeService


class WeatherRuntimeTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.provider = Mock()
        self.provider.get_comprehensive_weather_data.return_value = {
            "current": {"temperature": 23, "location": "Paris, France"},
            "hourlyForecast": [{"temperature": 24}],
        }
        self.runtime = WeatherRuntimeService(
            backend_dir=Path(self.directory.name),
            weather_service_factory=lambda: self.provider,
            logger=logging.getLogger(__name__),
            fallback_location="Milan, IT", ipinfo_url="",
        )

    def test_open_loads_provider_weather_for_default_location(self):
        result = self.runtime.get_current_weather()
        self.assertEqual(result["current"]["temperature"], 23)
        self.assertEqual(len(result["hourlyForecast"]), 1)
        self.provider.get_comprehensive_weather_data.assert_called_once_with("Milan, IT")

    def test_manual_and_coordinate_queries_reach_provider(self):
        self.runtime.get_current_weather(location="Paris")
        self.provider.get_comprehensive_weather_data.assert_called_with("Paris")
        self.runtime.get_current_weather(lat=0, lon=12)
        self.provider.get_comprehensive_weather_data.assert_called_with("0,12")

    def test_provider_failure_is_not_reported_as_success(self):
        self.provider.get_comprehensive_weather_data.return_value = {"error": "provider unavailable"}
        result = self.runtime.get_current_weather()
        self.assertFalse(result["success"])
        self.assertTrue(result["error"])

    def test_factory_failure_does_not_expose_credentials(self):
        self.runtime.weather_service_factory = Mock(side_effect=ValueError("secret credential"))
        result = self.runtime.get_current_weather()
        self.assertFalse(result["success"])
        self.assertNotIn("secret credential", str(result))
