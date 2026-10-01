import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function WeatherRadar({ apiHost, latitude, longitude, timezone, autoplay }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [manifest, setManifest] = useState(null);
  const [message, setMessage] = useState('Loading recent radar…');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [retry, setRetry] = useState(0);
  const [tileError, setTileError] = useState(false);
  const hasCoordinates = typeof latitude === 'number' && Number.isFinite(latitude) && Math.abs(latitude) <= 90 && typeof longitude === 'number' && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
  const frames = manifest?.frames || [];
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    setMessage('Loading recent radar…');
    fetch(`${apiHost}/api/weather/radar`, { signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok || !data.success || !data.frames?.length) throw new Error(data.message || 'Radar is unavailable.');
      if (controller.signal.aborted) return;
      setManifest(data); setIndex(data.frames.length - 1); setMessage(data.stale ? data.message : '');
    }).catch(() => { if (!controller.signal.aborted) setMessage('Radar is unavailable. Try again shortly.'); else if (controller.signal.reason?.name === 'AbortError') setMessage('Radar request timed out. Try again.'); }).finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort('unmounted'); };
  }, [apiHost, retry]);

  useEffect(() => {
    if (!hasCoordinates) return;
    const map = L.map(containerRef.current, { attributionControl: true, minZoom: 2, maxZoom: 7, scrollWheelZoom: false }).setView([latitude, longitude], 6);
    mapRef.current = map;
    L.tileLayer(import.meta.env.VITE_WEATHER_BASE_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: import.meta.env.VITE_WEATHER_BASE_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 7,
    }).on('tileerror', () => setTileError(true)).addTo(map);
    L.circleMarker([latitude, longitude], { radius: 5, color: '#fff', weight: 2, fillColor: '#1679ba', fillOpacity: 1 }).addTo(map);
    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    observer.observe(containerRef.current);
    return () => { observer.disconnect(); map.remove(); mapRef.current = null; layerRef.current = null; };
  }, [latitude, longitude, hasCoordinates]);

  useEffect(() => {
    const frame = frames[index];
    const map = mapRef.current;
    if (!map || !frame) return;
    if (layerRef.current) map.removeLayer(layerRef.current);
    setTileError(false);
    layerRef.current = L.tileLayer(`${manifest.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`, {
      opacity: 0.7, maxNativeZoom: 7, maxZoom: 7,
      attribution: '<a href="https://www.rainviewer.com/">RainViewer</a>',
    }).on('tileerror', () => setTileError(true)).addTo(map);
  }, [manifest, index, latitude, longitude]);

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const timer = setInterval(() => { if (!document.hidden) setIndex(value => (value + 1) % frames.length); }, 1500);
    return () => clearInterval(timer);
  }, [playing, frames.length]);
  const step = delta => { setPlaying(false); setIndex(value => (value + delta + frames.length) % frames.length); };
  let timestamp = 'No frame available';
  if (frames[index]) {
    try { timestamp = new Date(frames[index].time * 1000).toLocaleTimeString([], { timeZone: timezone || 'UTC', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }); } catch { timestamp = new Date(frames[index].time * 1000).toISOString(); }
  }
  return <section className="weather-radar-view" aria-label="Recent observed radar">
    <div className="weather-section-heading"><h3>Recent radar</h3><button type="button" className="weather-inline-action" disabled={!hasCoordinates} onClick={() => mapRef.current?.setView([latitude, longitude], 6)}>Recenter</button></div>
    <div className="weather-radar-caption">Observed precipitation · past two hours</div>
    {hasCoordinates ? <div className="weather-radar-map" ref={containerRef} /> : <div className="weather-empty-panel">Choose a location to display its radar map.</div>}
    {message ? <div role="status" className="weather-radar-message">{message} {!message.startsWith('Loading') ? <button type="button" onClick={() => setRetry(value => value + 1)}>Retry radar</button> : null}</div> : null}
    {tileError ? <div role="status">Some map tiles could not load. <button type="button" onClick={() => { setTileError(false); mapRef.current?.eachLayer(layer => layer.redraw?.()); }}>Retry tiles</button></div> : null}
    <div className="weather-radar-controls">
      <button type="button" aria-label="Previous radar frame" title="Previous radar frame" disabled={!frames.length} onClick={() => step(-1)}>‹</button>
      <button type="button" disabled={frames.length < 2} onClick={() => setPlaying(value => !value)}>{playing ? 'Pause' : 'Play'}</button>
      <button type="button" aria-label="Next radar frame" title="Next radar frame" disabled={!frames.length} onClick={() => step(1)}>›</button>
      <input type="range" aria-label="Radar timeline" min="0" max={Math.max(0, frames.length - 1)} value={index} disabled={!frames.length} onChange={event => { setPlaying(false); setIndex(Number(event.target.value)); }} />
      <output>{timestamp}</output>
    </div>
    <div className="weather-radar-legend"><span>Light rain</span><i aria-hidden="true" /><span>Heavy</span><small>Frame generation time; observations may vary.</small></div>
  </section>;
}
