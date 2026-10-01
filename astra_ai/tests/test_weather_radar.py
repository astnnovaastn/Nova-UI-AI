import unittest
from astra_ai.ui.backend.weather_radar import RadarManifestService


class RadarTests(unittest.TestCase):
    def test_cache_and_stale_fallback(self):
        now = [0]
        calls = []
        def fetch():
            calls.append(1)
            if len(calls) > 1:
                raise TimeoutError()
            return {'host': 'https://tilecache.rainviewer.com', 'radar': {'past': [{'time': 100, 'path': '/v2/radar/sample'}]}}
        service = RadarManifestService(fetch=fetch, clock=lambda: now[0])
        self.assertEqual(service.get()['frames'][0]['time'], 100)
        now[0] = 299
        self.assertFalse(service.get()['stale'])
        self.assertEqual(len(calls), 1)
        now[0] = 301
        self.assertTrue(service.get()['stale'])

    def test_invalid_host_and_empty_frames_are_unavailable(self):
        for payload in [{'host': 'http://evil.test', 'radar': {'past': [{'time': 1, 'path': '/a'}]}}, {'host': 'https://tilecache.rainviewer.com', 'radar': {'past': []}}]:
            self.assertFalse(RadarManifestService(fetch=lambda: payload).get()['success'])

if __name__ == '__main__':
    unittest.main()
