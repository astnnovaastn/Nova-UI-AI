"""Small, bounded cache for the public observed-radar manifest (not tile images)."""
import re
import time
from threading import Lock
import requests


class RadarManifestService:
    def __init__(self, fetch=None, clock=time.monotonic):
        self.fetch = fetch or self._fetch
        self.clock = clock
        self.cached = None
        self.fetched_at = float('-inf')
        self.retry_at = 0
        self.lock = Lock()

    @staticmethod
    def _fetch():
        response = requests.get('https://api.rainviewer.com/public/weather-maps.json', timeout=(3, 8))
        response.raise_for_status()
        return response.json()

    def get(self):
        with self.lock:
            now = self.clock()
            if self.cached and now - self.fetched_at < 300:
                return {**self.cached, 'stale': False}
            if now >= self.retry_at:
                try:
                    payload = self.fetch()
                    host = payload.get('host', '')
                    if host != 'https://tilecache.rainviewer.com':
                        raise ValueError('Unsupported radar host')
                    frames = [{'time': f['time'], 'path': f['path']} for f in payload.get('radar', {}).get('past', [])
                              if isinstance(f.get('time'), (int, float)) and f['time'] > 0
                              and isinstance(f.get('path'), str) and re.fullmatch(r'/v2/radar/[A-Za-z0-9_./-]+', f['path']) and '..' not in f['path']]
                    if not frames:
                        raise ValueError('No observed radar frames')
                    self.cached = {'success': True, 'host': host, 'frames': sorted(frames, key=lambda f: f['time'])[-24:]}
                    self.fetched_at = now
                    return {**self.cached, 'stale': False}
                except (requests.RequestException, ValueError, TypeError, KeyError, TimeoutError):
                    self.retry_at = now + 30
            if self.cached and now - self.fetched_at < 3600:
                return {**self.cached, 'stale': True, 'message': 'Radar refresh unavailable. Showing earlier frames.'}
            return {'success': False, 'stale': False, 'frames': [], 'message': 'Radar is unavailable. Try again shortly.'}


radar_manifest_service = RadarManifestService()
