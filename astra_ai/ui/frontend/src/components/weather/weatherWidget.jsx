import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clampWeatherWindow, convertWeatherValue } from './weatherUtils';
import './weatherWidget.css';
const WeatherRadar = lazy(() => import('./WeatherRadar'));

const API_HOST = (import.meta.env.VITE_API_URL || 'http://localhost:8340').replace(/\/$/, '');
const widgetSizes = ['small', 'normal', 'large', 'xlarge'];
const DEFAULT_WIDGET_WIDTH = 640;
const DEFAULT_WIDGET_HEIGHT = 500;
const MIN_WIDGET_WIDTH = 420;
const MIN_WIDGET_HEIGHT = 360;
const AUTO_DIMENSIONS = { width: null, height: null };
const SHRINK_STEP = 0.05;
const MAX_SHRINK_LEVEL = 10;
const SHRINK_WIDTH_STEP = 48;
const SHRINK_HEIGHT_STEP = 32;
const buildDefaultWeatherState = (location = 'Locating...') => ({
  current: {
    temperature: '--',
    feelsLike: '--',
    condition: 'Waiting for weather data',
    conditionEmoji: '...',
    icon: '...',
    high: '--',
    low: '--',
    location,
    updatedAt: '',
  },
  metrics: {
    humidity: '--',
    windSpeed: '--',
    windDirection: '--',
    precipChance: '--',
    uvIndex: '--',
    visibility: '--',
    pressure: '--',
    dewPoint: '--',
    sunrise: '--:--',
    sunset: '--:--',
    airQuality: null,
  },
  hourlyForecast: [],
  forecastDays: [],
  radarSummary: { points: [] },
  alerts: [],
  viewsAvailable: {
    now: true,
    hourly: false,
    radar: false,
  },
  meta: {
    location,
    updatedAt: '',
    source: '',
    unitSystem: 'metric',
  },
  error: false,
  errorMessage: '',
});

const getValue = (value, fallback = '--') => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return value;
};

const formatLongDateTime = (isoValue) => {
  if (!isoValue) return 'Date unavailable';
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatUpdatedLabel = (isoValue) => {
  if (!isoValue) return 'Updated recently';
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return 'Updated recently';
  return `Updated ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
};

const parseWeatherTimestamp = (value) => {
  if (!value) return null;
  const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseClockTimeToMinutes = (value) => {
  if (!value || typeof value !== 'string' || !value.includes(':')) return null;
  const [hoursText, minutesText] = value.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return (hours * 60) + minutes;
};

const isNightForWeather = ({ timestamp, sunrise, sunset }) => {
  const date = parseWeatherTimestamp(timestamp);
  const sunriseMinutes = parseClockTimeToMinutes(sunrise);
  const sunsetMinutes = parseClockTimeToMinutes(sunset);
  if (!date || sunriseMinutes === null || sunsetMinutes === null) return false;
  const currentMinutes = (date.getHours() * 60) + date.getMinutes();
  return currentMinutes < sunriseMinutes || currentMinutes >= sunsetMinutes;
};

const getWeatherIconKind = ({ condition = '', timestamp = '', sunrise = '', sunset = '' }) => {
  const normalized = String(condition || '').toLowerCase();
  const isNight = isNightForWeather({ timestamp, sunrise, sunset });

  if (normalized.includes('tornado')) return 'tornado';
  if (normalized.includes('hail')) return 'hail';
  if (normalized.includes('thunder')) return 'thunderstorm';
  if (normalized.includes('heavy rain') || normalized.includes('shower')) return 'heavy-rain';
  if (normalized.includes('rain')) return 'rain';
  if (normalized.includes('drizzle')) return 'drizzle';
  if (normalized.includes('sleet') || normalized.includes('ice pellets')) return 'sleet';
  if (normalized.includes('snow') || normalized.includes('blizzard')) return 'snow';
  if (normalized.includes('mist') || normalized.includes('fog') || normalized.includes('haze') || normalized.includes('smoke')) return 'fog';
  if (normalized.includes('wind')) return 'windy';
  if (normalized.includes('overcast')) return 'overcast';
  if (normalized.includes('few clouds') || normalized.includes('partly cloudy')) return isNight ? 'partly-cloudy-night' : 'partly-cloudy-day';
  if (normalized.includes('broken clouds') || normalized.includes('scattered clouds') || normalized.includes('cloudy')) return 'cloudy';
  if (normalized.includes('clear') || normalized.includes('sunny')) return isNight ? 'clear-night' : 'clear-day';
  return isNight ? 'partly-cloudy-night' : 'partly-cloudy-day';
};

const normalizeAirQuality = (airQuality) => {
  if (!airQuality || typeof airQuality !== 'object') {
    return null;
  }
  return {
    aqi: getValue(airQuality.aqi, '--'),
    label: getValue(airQuality.label, 'Unavailable'),
    value: getValue(airQuality.value, '--'),
  };
};

const normalizeHourlyForecast = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => ({
    id: `${item.time || item.timestamp || 'slot'}-${index}`,
    time: getValue(item.time, '--'),
    timestamp: getValue(item.timestamp || item.datetime || item.dateTime, ''),
    icon: getValue(item.icon || item.conditionEmoji, '...'),
    condition: getValue(item.condition, 'Unavailable'),
    temperature: getValue(item.temperature),
    precipChance: item.precipChance === null || item.precipChance === undefined || item.precipChance === ''
      ? null
      : item.precipChance,
    uvIndex: item.uvIndex === null || item.uvIndex === undefined || item.uvIndex === ''
      ? null
      : item.uvIndex,
    cloudCover: item.cloudCover === null || item.cloudCover === undefined || item.cloudCover === ''
      ? null
      : item.cloudCover,
    isNow: Boolean(item.isNow),
  }));
};

const normalizeForecastDays = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => ({
    id: `${item.date || item.label || 'day'}-${index}`,
    date: getValue(item.date, ''),
    label: getValue(item.label, index === 0 ? 'Today' : `Day ${index + 1}`),
    fullLabel: getValue(item.fullLabel, getValue(item.label, 'Forecast')),
    isToday: Boolean(item.isToday),
    hourly: normalizeHourlyForecast(item.hourly || []),
  }));
};

const normalizeWeatherData = (payload = {}, fallbackLocation = 'Locating...') => {
  const base = buildDefaultWeatherState(fallbackLocation);
  const currentBlock = payload.current && typeof payload.current === 'object' ? payload.current : payload;
  const metricsBlock = payload.metrics && typeof payload.metrics === 'object' ? payload.metrics : payload;
  const location = getValue(
    currentBlock.location || payload.location || payload.meta?.location,
    fallbackLocation,
  );
  const updatedAt = getValue(
    currentBlock.updatedAt || payload.meta?.updatedAt,
    '',
  );

  return {
    current: {
      temperature: getValue(currentBlock.temperature, base.current.temperature),
      feelsLike: getValue(currentBlock.feelsLike, getValue(metricsBlock.feelsLike, base.current.feelsLike)),
      condition: getValue(currentBlock.condition, base.current.condition),
      conditionEmoji: getValue(currentBlock.conditionEmoji || currentBlock.icon, base.current.conditionEmoji),
      icon: getValue(currentBlock.icon || currentBlock.conditionEmoji, base.current.icon),
      high: getValue(currentBlock.high, base.current.high),
      low: getValue(currentBlock.low, base.current.low),
      location,
      updatedAt,
    },
    metrics: {
      humidity: getValue(metricsBlock.humidity, base.metrics.humidity),
      windSpeed: getValue(metricsBlock.windSpeed, base.metrics.windSpeed),
      windDirection: getValue(metricsBlock.windDirection, base.metrics.windDirection),
      precipChance: getValue(metricsBlock.precipChance, base.metrics.precipChance),
      uvIndex: getValue(metricsBlock.uvIndex, base.metrics.uvIndex),
      visibility: getValue(metricsBlock.visibility, base.metrics.visibility),
      pressure: getValue(metricsBlock.pressure, base.metrics.pressure),
      dewPoint: getValue(metricsBlock.dewPoint, base.metrics.dewPoint),
      sunrise: getValue(metricsBlock.sunrise, base.metrics.sunrise),
      sunset: getValue(metricsBlock.sunset, base.metrics.sunset),
      airQuality: normalizeAirQuality(metricsBlock.airQuality || payload.airQuality),
    },
    hourlyForecast: normalizeHourlyForecast(payload.hourlyForecast),
    forecastDays: normalizeForecastDays(payload.forecastDays),
    radarSummary: {
      points: Array.isArray(payload.radarSummary?.points) ? payload.radarSummary.points : [],
    },
    alerts: Array.isArray(payload.alerts) ? payload.alerts : [],
    viewsAvailable: {
      now: payload.viewsAvailable?.now !== false,
      hourly: Array.isArray(payload.hourlyForecast) ? payload.hourlyForecast.length > 0 : Boolean(payload.viewsAvailable?.hourly),
      radar: Boolean(payload.viewsAvailable?.radar),
    },
    meta: {
      ...payload.meta,
      location,
      updatedAt,
      source: getValue(payload.meta?.source, ''),
      unitSystem: getValue(payload.meta?.unitSystem, 'metric'),
    },
    error: Boolean(payload.error),
    errorMessage: String(payload.errorMessage || payload.error || ''),
  };
};

const getUvLevel = (uv) => {
  const numericUv = Number(uv);
  if (!Number.isFinite(numericUv)) return 'Unavailable';
  if (numericUv <= 2) return 'Low';
  if (numericUv <= 5) return 'Moderate';
  if (numericUv <= 7) return 'High';
  return 'Extreme';
};

const formatUnitValue = (value, suffix = '') => (value === '--' ? '--' : `${value}${suffix}`);
const getSizeDimensions = (size) => ({
  small: { width: 480, height: 400 },
  normal: { width: 640, height: 500 },
  large: { width: 760, height: 560 },
  xlarge: { width: 860, height: 620 },
}[size] || { width: DEFAULT_WIDGET_WIDTH, height: DEFAULT_WIDGET_HEIGHT });

const clampPositionToViewport = (nextPosition, widgetWidth, widgetHeight) => ({
  x: Math.max(0, Math.min(nextPosition.x, Math.max(0, window.innerWidth - widgetWidth))),
  y: Math.max(0, Math.min(nextPosition.y, Math.max(0, window.innerHeight - widgetHeight))),
});

const getNextWidgetSize = (currentSize) => {
  const currentIndex = widgetSizes.indexOf(currentSize);
  const safeIndex = currentIndex >= 0 ? currentIndex : widgetSizes.indexOf('normal');
  return widgetSizes[(safeIndex + 1) % widgetSizes.length];
};

function readWeatherWindow() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('widget_weatherDisplay_position') || '{}'); } catch { /* Optional storage. */ }
  const size = widgetSizes.includes(saved.size) ? saved.size : 'normal';
  const defaults = getSizeDimensions(size);
  return { ...clampWeatherWindow({ x: parseInt(saved.left, 10), y: parseInt(saved.top, 10), width: parseInt(saved.width, 10) || defaults.width, height: parseInt(saved.height, 10) || defaults.height }, window.innerWidth, window.innerHeight), size };
}

const MetricGlyph = ({ name, accent = 'blue' }) => {
  const className = `weather-metric-icon accent-${accent}`;

  if (name === 'humidity') {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3C9 7 6 10.5 6 14a6 6 0 0 0 12 0c0-3.5-3-7-6-11Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === 'wind') {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9h10a3 3 0 1 0-3-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M3 13h14a2.5 2.5 0 1 1-2.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 17h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'precip') {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4c-3 0-6 2.6-6 6h12c0-3.4-3-6-6-6Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6 10h12" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="m12 10 2 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'uv') {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M5.2 18.8l2.1-2.1M16.7 7.3l2.1-2.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'sun') {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 15h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M7 15a5 5 0 0 1 10 0" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 6V3.5M8 11l-1.8-1.8M16 11l1.8-1.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="7" cy="12" r="1.3" fill="currentColor" opacity="0.7" />
      <circle cx="17" cy="12" r="1.3" fill="currentColor" opacity="0.7" />
      <circle cx="12" cy="7" r="1.3" fill="currentColor" opacity="0.7" />
      <circle cx="12" cy="17" r="1.3" fill="currentColor" opacity="0.7" />
    </svg>
  );
};

const WEATHER_STROKE_WIDTH = 5.5;
const WEATHER_GLOW_STYLE = {
  filter: 'drop-shadow(0 0 6px rgba(214, 240, 255, 0.55)) drop-shadow(0 0 14px rgba(171, 223, 255, 0.16))',
};
const WeatherSvg = ({ className, children, alt }) => (
  <svg className={className} viewBox="0 0 128 128" aria-hidden={alt ? undefined : 'true'} role={alt ? 'img' : undefined}>
    {alt ? <title>{alt}</title> : null}
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth={WEATHER_STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={WEATHER_GLOW_STYLE}
    >
      {children}
    </g>
  </svg>
);

const sunCore = (
  <>
    <circle cx="50" cy="44" r="20" />
    <path d="M50 10v10M50 68v10M16 44h10M74 44h10M26 20l7 7M67 61l7 7M26 68l7-7M67 27l7-7" />
  </>
);

const moonCore = (
  <>
    <path d="M60 18c-12 4-22 16-22 31 0 17 13 31 30 33-6 5-13 8-22 8-21 0-38-17-38-38 0-18 13-34 31-37 9-2 17-1 21 3Z" />
    <circle cx="84" cy="34" r="2" />
    <path d="M92 48l3 5 5 3-5 3-3 5-3-5-5-3 5-3 3-5Z" />
    <circle cx="78" cy="58" r="1.5" />
  </>
);

const largeCloud = <path d="M25 84h66c11 0 20-8 20-18s-8-18-18-18c-3-16-16-27-32-27-13 0-24 7-30 19-2-1-4-1-6-1-11 0-20 9-20 20s9 25 20 25Z" />;
const smallCloud = <path d="M41 88h39c8 0 14-5 14-12s-6-12-12-12c-2-10-10-17-21-17-8 0-15 4-19 11h-1c-8 0-14 6-14 15 0 8 6 15 14 15Z" />;

const renderWeatherIconByKind = (kind) => {
  if (kind === 'clear-day') return sunCore;
  if (kind === 'clear-night') return moonCore;
  if (kind === 'partly-cloudy-day') {
    return (
      <>
        <g transform="translate(0 -6)">{sunCore}</g>
        {smallCloud}
      </>
    );
  }
  if (kind === 'partly-cloudy-night') {
    return (
      <>
        <g transform="translate(-2 -4)">{moonCore}</g>
        {smallCloud}
      </>
    );
  }
  if (kind === 'cloudy') {
    return (
      <>
        {largeCloud}
        <path d="M40 86h38c8 0 14-5 14-12s-6-12-12-12c-2-10-10-17-21-17-8 0-15 4-19 11h-1c-8 0-14 6-14 15 0 8 6 15 14 15Z" />
      </>
    );
  }
  if (kind === 'overcast') {
    return (
      <>
        <g opacity="0.82">{largeCloud}</g>
        <path d="M34 90h58c10 0 18-7 18-16" />
      </>
    );
  }
  if (kind === 'fog') {
    return (
      <>
        {smallCloud}
        <path d="M26 86h62M34 96h44M42 106h28" />
      </>
    );
  }
  if (kind === 'windy') {
    return (
      <>
        <path d="M20 46h48c10 0 10-14 0-14" />
        <path d="M16 64h72c10 0 11 13 1 13" />
        <path d="M28 82h46" />
      </>
    );
  }
  if (kind === 'drizzle') {
    return (
      <>
        {smallCloud}
        <path d="M38 94v8M56 98v8M74 94v8" />
        <path d="M47 104v6M65 108v6" opacity="0.62" />
      </>
    );
  }
  if (kind === 'rain') {
    return (
      <>
        {smallCloud}
        <path d="M38 96c0 4-3 7-6 10 4 0 8-3 8-8 0-1-1-2-2-2Z" />
        <path d="M54 102c0 4-3 7-6 10 4 0 8-3 8-8 0-1-1-2-2-2Z" />
        <path d="M72 96c0 4-3 7-6 10 4 0 8-3 8-8 0-1-1-2-2-2Z" />
      </>
    );
  }
  if (kind === 'heavy-rain') {
    return (
      <>
        {smallCloud}
        <path d="M36 94l-5 13M52 94l-5 13M68 94l-5 13M84 94l-5 13" />
        <path d="M58 104c0 4-3 7-6 10 4 0 8-3 8-8 0-1-1-2-2-2Z" />
      </>
    );
  }
  if (kind === 'thunderstorm') {
    return (
      <>
        {smallCloud}
        <path d="M60 86 48 106h12l-8 16 24-26H63l7-10Z" />
        <path d="M36 95l-4 10M84 95l-4 10" />
      </>
    );
  }
  if (kind === 'snow') {
    return (
      <>
        {smallCloud}
        <path d="M42 100h10M47 95v10M44 97l6 6M50 97l-6 6" />
        <path d="M70 100h10M75 95v10M72 97l6 6M78 97l-6 6" />
        <circle cx="34" cy="106" r="2.5" />
        <circle cx="90" cy="104" r="2.5" />
      </>
    );
  }
  if (kind === 'sleet') {
    return (
      <>
        {smallCloud}
        <path d="M40 102h10M45 97v10M42 99l6 6M48 99l-6 6" />
        <path d="M66 96l-5 12M82 100c0 4-3 7-6 10" />
      </>
    );
  }
  if (kind === 'hail') {
    return (
      <>
        {smallCloud}
        <circle cx="38" cy="102" r="4" />
        <circle cx="56" cy="108" r="4" />
        <circle cx="74" cy="102" r="4" />
        <circle cx="90" cy="108" r="3" />
      </>
    );
  }
  if (kind === 'tornado') {
    return (
      <>
        <path d="M34 28h60M28 40h70M36 52h54M44 64h38M52 76h20M60 88l-6 20" />
        <path d="M34 28c8 7 12 9 18 12M88 28c-8 7-12 9-18 12M44 64c8 6 10 7 14 12" opacity="0.55" />
      </>
    );
  }
  return (
    <>
      <g transform="translate(0 -6)">{sunCore}</g>
      {smallCloud}
    </>
  );
};

const WeatherGlyph = ({
  condition = '',
  size = 'large',
  timestamp = '',
  sunrise = '',
  sunset = '',
  alt = '',
}) => {
  const className = `weather-glyph weather-glyph-${size}`;
  const kind = getWeatherIconKind({ condition, timestamp, sunrise, sunset });
  return (
    <WeatherSvg className={className} alt={alt || condition || 'Weather'}>
      {renderWeatherIconByKind(kind)}
    </WeatherSvg>
  );
};

const ControlGlyph = ({ name }) => {
  const sharedProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  if (name === 'minimize') {
    return <svg width="14" height="14" viewBox="0 0 24 24" {...sharedProps}><path d="M5 12h14" /></svg>;
  }
  if (name === 'close') {
    return <svg width="14" height="14" viewBox="0 0 24 24" {...sharedProps}><path d="m6 6 12 12" /><path d="m18 6-12 12" /></svg>;
  }
  if (name === 'left') {
    return <svg width="14" height="14" viewBox="0 0 24 24" {...sharedProps}><path d="m15 18-6-6 6-6" /></svg>;
  }
  if (name === 'right') {
    return <svg width="14" height="14" viewBox="0 0 24 24" {...sharedProps}><path d="m9 18 6-6-6-6" /></svg>;
  }
  if (name === 'caret') {
    return <svg width="12" height="12" viewBox="0 0 24 24" {...sharedProps}><path d="m6 9 6 6 6-6" /></svg>;
  }
  if (name === 'settings') {
    return <svg width="14" height="14" viewBox="0 0 24 24" {...sharedProps}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 .9-1.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5.9H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1Z" /></svg>;
  }
  if (name === 'refresh') {
    return <svg width="14" height="14" viewBox="0 0 24 24" {...sharedProps}><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15.5-6.4L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15.5 6.4L3 16" /></svg>;
  }
  if (name === 'search') {
    return <svg width="14" height="14" viewBox="0 0 24 24" {...sharedProps}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
  }
  if (name === 'resize') {
    return <svg width="14" height="14" viewBox="0 0 24 24" {...sharedProps}><path d="M8 3H3v5" /><path d="M3 3l6 6" /><path d="M16 21h5v-5" /><path d="M21 21l-6-6" /></svg>;
  }
  return null;
};

const WeatherWidget = ({
  initialWeatherData = null,
  initialLocation = '',
  onClose,
  onMinimize,
  aiConnected = false,
  aiCommand = null,
  onCommandResult,
}) => {
  const [weather, setWeather] = useState(() => normalizeWeatherData(initialWeatherData || {}, initialLocation || 'Locating...'));
  const [initialWindow] = useState(readWeatherWindow);
  const [position, setPosition] = useState({ x: initialWindow.x, y: initialWindow.y });
  const [dimensions, setDimensions] = useState({ width: initialWindow.width, height: initialWindow.height });
  const [size, setSize] = useState(initialWindow.size);
  const [shrinkLevel, setShrinkLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('now');
  const [searchValue, setSearchValue] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    try { return { units: 'metric', radarAutoplay: false, ...JSON.parse(localStorage.getItem('weather_preferences_v1') || '{}') }; }
    catch { return { units: 'metric', radarAutoplay: false }; }
  });
  const requestRef = useRef(null);
  const popoverRef = useRef(null);
  const popoverTriggerRef = useRef(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 80, left: 12 });
  const units = preferences.units === 'imperial' ? 'imperial' : 'metric';
  const temperature = (value) => convertWeatherValue(value, 'temperature', units);
  const temperatureUnit = units === 'imperial' ? '°F' : '°C';
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const widgetRef = useRef(null);
  const searchInputRef = useRef(null);
  const nowSectionRef = useRef(null);
  const hourlySectionRef = useRef(null);
  const hourlyTrackRef = useRef(null);
  const radarSectionRef = useRef(null);
  const currentLocationRef = useRef(initialLocation || '');
  const locationModeRef = useRef('live');
  const dragRef = useRef({ active: false, offsetX: 0, offsetY: 0 });
  const resizeRef = useRef({ active: false, startX: 0, startY: 0, width: 0, height: 0 });
  const handledCommandIdsRef = useRef(new Set());
  const initialCommandRef = useRef(aiCommand);

  useEffect(() => {
    try { localStorage.setItem('weather_preferences_v1', JSON.stringify(preferences)); } catch { /* Storage can be unavailable. */ }
  }, [preferences]);
  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    if (!settingsOpen && !locationOpen) return;
    const place = () => {
      const trigger = popoverTriggerRef.current?.getBoundingClientRect();
      const root = widgetRef.current?.getBoundingClientRect();
      const panel = popoverRef.current;
      if (!trigger || !root || !panel) return;
      setPopoverPosition({ left: Math.max(12, Math.min(trigger.left - root.left, root.width - panel.offsetWidth - 12)), top: Math.max(12, Math.min(trigger.bottom - root.top + 6, root.height - panel.offsetHeight - 12)) });
    };
    place();
    popoverRef.current?.querySelector('button,input,select')?.focus();
    const dismiss = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type !== 'keydown' && (popoverRef.current?.contains(event.target) || popoverTriggerRef.current?.contains(event.target))) return;
      setSettingsOpen(false); setLocationOpen(false);
      if (event.type === 'keydown') { event.stopPropagation(); popoverTriggerRef.current?.focus(); }
    };
    const observer = new ResizeObserver(place);
    observer.observe(widgetRef.current);
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', dismiss);
    return () => { observer.disconnect(); document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', dismiss); };
  }, [settingsOpen, locationOpen]);

  const emitCommandResult = useCallback((command, status, detail, metadata = {}) => {
    if (!command?.request_id || !onCommandResult) return;
    onCommandResult({
      widget: 'weather',
      command: command.command,
      request_id: command.request_id,
      status,
      detail,
      ...metadata,
    });
  }, [onCommandResult]);

  const persistWidgetState = useCallback((nextPosition = position, nextDimensions = dimensions, nextSize = size, nextShrinkLevel = shrinkLevel) => {
    try { localStorage.setItem('widget_weatherDisplay_position', JSON.stringify({
      left: `${nextPosition.x}px`,
      top: `${nextPosition.y}px`,
      width: nextDimensions.width ? `${nextDimensions.width}px` : '',
      height: nextDimensions.height ? `${nextDimensions.height}px` : '',
      size: nextSize,
      shrinkLevel: nextShrinkLevel,
    })); } catch { /* Storage is optional. */ }
  }, [dimensions, position, shrinkLevel, size]);

  const cycleWidgetSize = useCallback(() => {
    const nextSize = getNextWidgetSize(size);
    setSize(nextSize);
    setDimensions(AUTO_DIMENSIONS);
    setShrinkLevel(0);
    setSettingsOpen(false);
  }, [size]);

  const getBrowserCoordinates = useCallback(() => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Browser geolocation is not available'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  }), []);

  const syncBrowserLocationToBackend = useCallback(async (coords) => {
    await fetch(`${API_HOST}/api/client/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      }),
    });
  }, []);

  const buildFetchUrl = useCallback((options = {}) => {
    const params = new URLSearchParams();
    if (options.forceRefresh) {
      params.set('refresh', '1');
    }
    if (options.location) {
      params.set('location', String(options.location));
    }
    if (options.lat !== undefined && options.lon !== undefined) {
      params.set('lat', String(options.lat));
      params.set('lon', String(options.lon));
    }
    const query = params.toString();
    return `${API_HOST}/api/weather/current${query ? `?${query}` : ''}`;
  }, []);

  const scrollToSection = useCallback((sectionName) => {
    const targetMap = {
      now: nowSectionRef,
      hourly: hourlySectionRef,
      radar: radarSectionRef,
    };
    const targetRef = targetMap[sectionName];
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  }, []);

  const fetchWeather = useCallback(async (options = {}) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = setTimeout(() => controller.abort('timeout'), 30000);
    const requestedLocation = String(options.location || currentLocationRef.current || initialLocation || 'Locating...').trim();

    if (options.location) {
      locationModeRef.current = 'manual';
    } else {
      locationModeRef.current = 'live';
    }

    setIsLoading(true);
      try {
        let requestOptions = { ...options };
      if (options.useBrowserLocation && !options.location) {
          try {
            const position = await getBrowserCoordinates();
            if (controller.signal.aborted) return { error: true, errorMessage: 'Request superseded.' };
            await syncBrowserLocationToBackend(position.coords);
            requestOptions = {
              ...requestOptions,
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
        } catch (geoError) {
          throw new Error(geoError.code === 1 ? 'Location permission denied. Search for a city instead.' : 'Could not obtain your location. Try again or search for a city.');
        }
      }

      const response = await fetch(buildFetchUrl(requestOptions), { signal: controller.signal });
      const payload = await response.json();
      if (controller.signal.aborted || requestRef.current !== controller) return { error: true, errorMessage: 'Request superseded.' };
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || payload?.detail || 'Failed to load weather data');
      }

      const resolvedLocation = String(payload?.weather_data?.location || payload?.location || requestedLocation || 'Current location').trim();
      const normalized = {
        ...normalizeWeatherData(payload.weather_data || payload, resolvedLocation),
        _backendMessage: String(payload?.message || '').trim(),
      };
      currentLocationRef.current = resolvedLocation;
      setWeather(normalized);
      const todayIndex = (normalized.forecastDays || []).findIndex((day) => day.isToday);
      setSelectedDayIndex(todayIndex >= 0 ? todayIndex : 0);
      setSearchValue('');
      setStatusMessage(String(payload?.message || '').trim());
      return normalized;
    } catch (error) {
      if (requestRef.current !== controller || (controller.signal.aborted && controller.signal.reason !== 'timeout')) return { error: true, errorMessage: 'Request superseded.' };
      const errorMessage = controller.signal.reason === 'timeout' ? 'Weather request timed out. Try again.' : error.message || 'Unable to load weather.';
      const failed = { error: true, errorMessage };
      setStatusMessage(errorMessage);
      setWeather(previous => ({ ...previous, ...failed }));
      return failed;
      } finally {
        clearTimeout(timeout);
        if (requestRef.current === controller) setIsLoading(false);
      }
  }, [buildFetchUrl, getBrowserCoordinates, initialLocation, syncBrowserLocationToBackend]);

  useEffect(() => {
    // The command effect owns initial loading when AI opens the widget.
    // A second default-location request could overwrite its requested city.
    if (initialCommandRef.current?.command) return;
    if (initialWeatherData) {
      const normalized = normalizeWeatherData(initialWeatherData, initialLocation || 'Current location');
      currentLocationRef.current = normalized.current.location;
      setWeather(normalized);
      return;
    }

    if (initialLocation) {
      fetchWeather({ location: initialLocation, forceRefresh: true });
      return;
    }

    fetchWeather({ forceRefresh: true });
  }, [fetchWeather, initialLocation, initialWeatherData]);

  useEffect(() => {
    const handleWeatherUpdate = (event) => {
      if (!event.detail) return;
      requestRef.current?.abort();
      setIsLoading(false);
      setWeather(normalizeWeatherData(event.detail, currentLocationRef.current || 'Current location'));
    };
    window.addEventListener('weather-data-update', handleWeatherUpdate);
    return () => window.removeEventListener('weather-data-update', handleWeatherUpdate);
  }, []);

  useEffect(() => {
    if (!aiCommand?.command) return;
    const commandId = `${aiCommand.request_id || 'no-request'}:${aiCommand.command}:${aiCommand.issuedAt || ''}`;
    if (handledCommandIdsRef.current.has(commandId)) return;
    handledCommandIdsRef.current.add(commandId);

    const runCommand = async () => {
      try {
        if (aiCommand.command === 'open') {
          const location = String(aiCommand.location || aiCommand.query || '').trim();
          const result = await fetchWeather({ forceRefresh: true, ...(location ? { location } : {}) });
          emitCommandResult(aiCommand, result.error ? 'failed' : 'completed', result.error ? result.errorMessage : 'Weather widget opened.');
          return;
        }

        if (aiCommand.command === 'show_weather' || aiCommand.command === 'update_weather') {
          if (aiCommand.weather_data) {
            requestRef.current?.abort();
            setIsLoading(false);
            const resolvedLocation = String(aiCommand.location || aiCommand.weather_data.location || currentLocationRef.current || 'Current location').trim();
            if (aiCommand.location) {
              locationModeRef.current = 'manual';
            }
            currentLocationRef.current = resolvedLocation;
            setWeather(normalizeWeatherData(aiCommand.weather_data, resolvedLocation));
            emitCommandResult(aiCommand, 'completed', 'Weather data displayed.');
            return;
          }

          const explicitLocation = String(aiCommand.location || aiCommand.query || '').trim();
          const result = explicitLocation
            ? await fetchWeather({ location: explicitLocation, forceRefresh: true })
            : await fetchWeather({ forceRefresh: true });
          emitCommandResult(aiCommand, result.error ? 'failed' : 'completed', result.error ? result.errorMessage : 'Weather data displayed.');
          return;
        }

        if (aiCommand.command === 'refresh_weather') {
          const result = locationModeRef.current === 'live'
            ? await fetchWeather({ forceRefresh: true })
            : await fetchWeather({ location: currentLocationRef.current, forceRefresh: true });
          emitCommandResult(aiCommand, result.error ? 'failed' : 'completed', result.error ? result.errorMessage : 'Weather refreshed.');
        }
      } catch (error) {
        emitCommandResult(aiCommand, 'failed', error.message || 'Weather widget command failed.');
      }
    };

    runCommand();
  }, [aiCommand, emitCommandResult, fetchWeather]);

  useEffect(() => {
    persistWidgetState();
  }, [dimensions, persistWidgetState, position, shrinkLevel, size]);

  const handleDragMove = useCallback((event) => {
    if (!dragRef.current.active || !widgetRef.current) return;
    const widgetWidth = widgetRef.current.offsetWidth || DEFAULT_WIDGET_WIDTH;
    const widgetHeight = widgetRef.current.offsetHeight || DEFAULT_WIDGET_HEIGHT;
    const nextPosition = {
      x: event.clientX - dragRef.current.offsetX,
      y: event.clientY - dragRef.current.offsetY,
    };
    setPosition(clampPositionToViewport(nextPosition, widgetWidth, widgetHeight));
  }, []);

  const handleDragEnd = useCallback(() => {
    dragRef.current.active = false;
    document.removeEventListener('pointermove', handleDragMove);
    document.removeEventListener('pointerup', handleDragEnd);
    document.removeEventListener('pointercancel', handleDragEnd);
  }, [handleDragMove]);

  const handleDragStart = useCallback((event) => {
    if (event.button !== 0) return;
    if (
      event.target.closest('button') ||
      event.target.closest('input') ||
      event.target.closest('.weather-toolbar') ||
      event.target.closest('.weather-search-shell')
    ) {
      return;
    }
    const rect = widgetRef.current?.getBoundingClientRect();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSettingsOpen(false); setLocationOpen(false);
    dragRef.current.active = true;
    dragRef.current.offsetX = event.clientX - (rect?.left || 0);
    dragRef.current.offsetY = event.clientY - (rect?.top || 0);
    document.addEventListener('pointermove', handleDragMove);
    document.addEventListener('pointerup', handleDragEnd);
    document.addEventListener('pointercancel', handleDragEnd);
  }, [handleDragEnd, handleDragMove]);

  const handleResizeMove = useCallback((event) => {
    if (!resizeRef.current.active) return;
    const nextDimensions = clampWeatherWindow({
      x: resizeRef.current.x, y: resizeRef.current.y,
      width: Math.max(MIN_WIDGET_WIDTH, resizeRef.current.width + (event.clientX - resizeRef.current.startX)),
      height: Math.max(MIN_WIDGET_HEIGHT, resizeRef.current.height + (event.clientY - resizeRef.current.startY)),
    }, window.innerWidth - resizeRef.current.x + 10, window.innerHeight - resizeRef.current.y + 10);
    setShrinkLevel(0);
    setDimensions(nextDimensions);
  }, []);

  const handleResizeEnd = useCallback(() => {
    resizeRef.current.active = false;
    document.removeEventListener('pointermove', handleResizeMove);
    document.removeEventListener('pointerup', handleResizeEnd);
    document.removeEventListener('pointercancel', handleResizeEnd);
  }, [handleResizeMove]);

  const handleResizeStart = useCallback((event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = widgetRef.current?.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSettingsOpen(false); setLocationOpen(false);
    resizeRef.current = {
      x: rect.left, y: rect.top,
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      width: rect?.width || DEFAULT_WIDGET_WIDTH,
      height: rect?.height || DEFAULT_WIDGET_HEIGHT,
    };
    document.addEventListener('pointermove', handleResizeMove);
    document.addEventListener('pointerup', handleResizeEnd);
    document.addEventListener('pointercancel', handleResizeEnd);
  }, [handleResizeEnd, handleResizeMove]);

  useEffect(() => () => {
    document.removeEventListener('pointermove', handleDragMove);
    document.removeEventListener('pointermove', handleResizeMove);
    document.removeEventListener('pointerup', handleDragEnd);
    document.removeEventListener('pointerup', handleResizeEnd);
    document.removeEventListener('pointercancel', handleDragEnd);
    document.removeEventListener('pointercancel', handleResizeEnd);
  }, [handleDragMove, handleResizeMove, handleDragEnd, handleResizeEnd]);

  const toolbarLocationLabel = weather.current.location || currentLocationRef.current || 'Current location';
  const forecastDays = weather.forecastDays || [];
  const activeForecastDay = forecastDays[selectedDayIndex] || forecastDays[0] || null;
  const canMoveBackward = selectedDayIndex > 0;
  const canMoveForward = selectedDayIndex < forecastDays.length - 1;
  const radarPoints = activeForecastDay?.hourly?.length
    ? activeForecastDay.hourly
    : (Array.isArray(weather.radarSummary?.points) ? weather.radarSummary.points : []);

  const refreshCurrentWeather = useCallback(async () => {
    if (currentLocationRef.current && locationModeRef.current === 'manual') {
      return fetchWeather({ location: currentLocationRef.current, forceRefresh: true });
    }
    return fetchWeather({ forceRefresh: true });
  }, [fetchWeather]);

  const openNowView = useCallback((message = '') => {
    setActiveTab('now');
    setSettingsOpen(false);
    setStatusMessage(message);
    scrollToSection('now');
  }, [scrollToSection]);

  const openHourlyView = useCallback((message = '') => {
    setActiveTab('hourly');
    setSettingsOpen(false);
    setStatusMessage(message);
    scrollToSection('hourly');
  }, [scrollToSection]);

  const openRadarView = useCallback(() => {
    setActiveTab('radar');
    setSettingsOpen(false);
    setLocationOpen(false);
    setStatusMessage('');
  }, []);

  const handleShowToday = useCallback(async () => {
    const result = currentLocationRef.current && locationModeRef.current === 'manual'
      ? await fetchWeather({ location: currentLocationRef.current })
      : await fetchWeather({});
    const nextForecastDays = result?.forecastDays || forecastDays;
    const todayIndex = nextForecastDays.findIndex((day) => day.isToday);
    setSelectedDayIndex(todayIndex >= 0 ? todayIndex : 0);
    openNowView(result?.error ? 'Unable to refresh today\'s weather.' : '');
  }, [fetchWeather, forecastDays, openNowView]);

  const handleMoveBackward = useCallback(() => {
    if (!canMoveBackward) return;
    setSelectedDayIndex((previous) => Math.max(0, previous - 1));
    setSettingsOpen(false);
    setStatusMessage('');
  }, [canMoveBackward]);

  const handleMoveForward = useCallback(() => {
    if (!canMoveForward) return;
    setSelectedDayIndex((previous) => Math.min(forecastDays.length - 1, previous + 1));
    setSettingsOpen(false);
    setStatusMessage('');
  }, [canMoveForward, forecastDays.length]);

  const handleToggleSettings = useCallback((event) => {
    popoverTriggerRef.current = event.currentTarget;
    setLocationOpen(false);
    setSettingsOpen((previous) => !previous);
    setStatusMessage('');
  }, []);

  const handleRefreshAction = useCallback(async () => {
    setSettingsOpen(false);
    setStatusMessage('Refreshing weather...');
    const result = await refreshCurrentWeather();
    if (result?.error) {
      setStatusMessage(result.errorMessage || 'Unable to refresh weather right now.');
      return;
    }

    if (activeTab === 'radar') {
      scrollToSection('radar');
    } else if (activeTab === 'hourly') {
      scrollToSection('hourly');
    } else {
      scrollToSection('now');
    }
    setStatusMessage(result?._backendMessage || 'Weather refreshed.');
  }, [activeTab, refreshCurrentWeather, scrollToSection]);

  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
    setSettingsOpen(false);
    setActiveTab('now');
    setStatusMessage('Type a city or location and press Enter to update the dashboard.');
  }, []);

  const handleSearchSubmit = useCallback(async (event) => {
    event.preventDefault();
    const nextLocation = searchValue.trim();
    if (!nextLocation) {
      setStatusMessage('Enter a city or location to search.');
      focusSearch();
      return;
    }
    const result = await fetchWeather({ location: nextLocation });
    if (!result?.error) {
      setLocationOpen(false);
      setStatusMessage(`Weather updated for ${currentLocationRef.current}.`);
      openNowView('');
    }
  }, [fetchWeather, focusSearch, openNowView, searchValue]);

  const openLiveLocation = useCallback(async () => {
    locationModeRef.current = 'live';
    setSearchValue('');
    setActiveTab('now');
    const result = await fetchWeather({ forceRefresh: true, useBrowserLocation: true });
    if (!result.error) setLocationOpen(false);
  }, [fetchWeather]);

  const activeMetrics = useMemo(() => ([
    {
      key: 'humidity',
      label: 'Humidity',
      icon: 'humidity',
      value: formatUnitValue(weather.metrics.humidity, '%'),
      subtext: weather.metrics.dewPoint !== '--' ? `Dew point ${temperature(weather.metrics.dewPoint)}${temperatureUnit}` : 'Moisture level',
      accent: 'blue',
    },
    {
      key: 'wind',
      label: 'Wind',
      icon: 'wind',
      value: formatUnitValue(convertWeatherValue(weather.metrics.windSpeed, 'wind', units), units === 'imperial' ? ' mph' : ' km/h'),
      subtext: weather.metrics.windDirection || 'Direction unavailable',
      accent: 'cyan',
    },
    {
      key: 'precip',
      label: 'Precip Chance',
      icon: 'precip',
      value: weather.metrics.precipChance === '--' ? '--' : `${weather.metrics.precipChance}%`,
      subtext: weather.metrics.precipChance === '--' ? 'No forecast data yet' : 'Chance of precipitation',
      accent: 'blue',
    },
    {
      key: 'uv',
      label: 'UV Index',
      icon: 'uv',
      value: weather.metrics.uvIndex,
      subtext: getUvLevel(weather.metrics.uvIndex),
      accent: 'amber',
    },
    {
      key: 'sun',
      label: 'Sunrise / Sunset',
      icon: 'sun',
      value: weather.metrics.sunrise,
      subtext: weather.metrics.sunset,
      accent: 'amber',
    },
    {
      key: 'air',
      label: 'Air Quality',
      icon: 'air',
      value: weather.metrics.airQuality?.aqi ?? '--',
      subtext: weather.metrics.airQuality?.label ?? 'Unavailable',
      accent: 'green',
    },
    { key: 'visibility', label: 'Visibility', icon: 'air', value: formatUnitValue(convertWeatherValue(weather.metrics.visibility, 'visibility', units), units === 'imperial' ? ' mi' : ' km'), subtext: 'Horizontal visibility', accent: 'blue' },
  ]), [weather.metrics, units]);

  const displayedHourlyForecast = useMemo(() => {
    const activeHourly = Array.isArray(activeForecastDay?.hourly) ? activeForecastDay.hourly : [];
    if (activeHourly.length > 0) {
      const collectedHours = [...activeHourly];
      if (collectedHours.length < 24 && forecastDays.length > 1) {
        for (let dayIndex = selectedDayIndex + 1; dayIndex < forecastDays.length && collectedHours.length < 24; dayIndex += 1) {
          const nextDayHours = Array.isArray(forecastDays[dayIndex]?.hourly) ? forecastDays[dayIndex].hourly : [];
          nextDayHours.forEach((hour) => {
            if (collectedHours.length < 24) {
              collectedHours.push(hour);
            }
          });
        }
      }

      return collectedHours.map((item, index) => ({
        ...item,
        id: item.id || `${activeForecastDay?.date || activeForecastDay?.label || 'day'}-${item.time || index}`,
        isNow: Boolean(item.isNow) || (activeForecastDay?.isToday && index === 0),
      }));
    }
    return weather.hourlyForecast.map((item, index) => ({
      ...item,
      id: item.id || `${item.time || 'hour'}-${index}`,
      isNow: Boolean(item.isNow) || index === 0,
    }));
  }, [activeForecastDay, forecastDays, selectedDayIndex, weather.hourlyForecast]);
  const handleShowMoreHourly = useCallback(() => {
    if (!displayedHourlyForecast.length) {
      setStatusMessage('Hourly forecast data is not available yet for this source.');
      return;
    }
    hourlyTrackRef.current?.scrollBy({
      left: Math.max(280, Math.round((hourlyTrackRef.current?.clientWidth || 0) * 0.85)),
      behavior: 'smooth',
    });
  }, [displayedHourlyForecast.length]);
  const weatherScale = 1;
  const baseDimensions = dimensions.width && dimensions.height
    ? dimensions
    : getSizeDimensions(size);
  const currentSizeIndex = widgetSizes.indexOf(size);
  const nextPresetSize = widgetSizes[((currentSizeIndex >= 0 ? currentSizeIndex : 1) + 1) % widgetSizes.length];

  useEffect(() => {
    const todayIndex = forecastDays.findIndex((day) => day.isToday);
    setSelectedDayIndex(todayIndex >= 0 ? todayIndex : 0);
  }, [forecastDays]);

  useEffect(() => {
    const clampCurrentPosition = () => {
      const clampedWindow = clampWeatherWindow({ ...position, ...baseDimensions }, window.innerWidth, window.innerHeight);
      setDimensions(previous => previous.width === clampedWindow.width && previous.height === clampedWindow.height ? previous : { width: clampedWindow.width, height: clampedWindow.height });
      setPosition((previous) => {
        const clamped = clampWeatherWindow({ ...previous, ...clampedWindow }, window.innerWidth, window.innerHeight);
        return clamped.x === previous.x && clamped.y === previous.y ? previous : clamped;
      });
    };

    clampCurrentPosition();
    window.addEventListener('resize', clampCurrentPosition);
    return () => window.removeEventListener('resize', clampCurrentPosition);
  }, [baseDimensions.height, baseDimensions.width, size]);

  return (
    <div
      ref={widgetRef}
      data-aegis-widget="weather"
      className={`weather-display widget-draggable widget-size-${size} ${aiConnected ? 'ai-connected' : ''}`}
      style={{
        '--weather-scale': String(weatherScale),
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: dimensions.width ? `${dimensions.width}px` : undefined,
        height: dimensions.height ? `${dimensions.height}px` : undefined,
      }}
      id="weatherDisplay"
    >
      <div className="weather-shell">
        <div className="weather-header drag-handle" onPointerDown={handleDragStart}>
          <div className="weather-brand">
            <div className="weather-brand-icon" aria-hidden="true">
              <WeatherGlyph
                condition={weather.current.condition}
                size="brand"
                timestamp={weather.current.updatedAt}
                sunrise={weather.metrics.sunrise}
                sunset={weather.metrics.sunset}
                alt={`${weather.current.condition} icon`}
              />
            </div>
            <div className="weather-title-group">
              <div className="weather-title">Weather</div>
            </div>
          </div>

          <div className="weather-header-actions">
            <button
              type="button"
              className="weather-window-button"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                onMinimize?.();
              }}
              title="Minimize Weather"
              aria-label="Minimize Weather"
            >
              −
            </button>
            <button
              type="button"
              className="weather-window-button"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                cycleWidgetSize();
              }}
              title={`Resize weather widget to ${nextPresetSize}`}
              aria-label={`Resize weather widget to ${nextPresetSize}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 3H3v5" />
                <path d="M3 3l6 6" />
                <path d="M16 21h5v-5" />
                <path d="M21 21l-6-6" />
              </svg>
            </button>
            <button
              type="button"
              className="weather-window-button weather-window-button-close"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                onClose?.();
              }}
              title="Close Weather"
              aria-label="Close Weather"
            >
              ×
            </button>
          </div>
        </div>

        <div className="weather-toolbar">
          <div className="weather-toolbar-row weather-toolbar-row-primary">
            <div className="weather-toolbar-cluster">
            <button
              type="button"
              className="weather-tool-button"
              onClick={handleMoveBackward}
              disabled={!canMoveBackward}
              title={canMoveBackward ? 'Show previous forecast period' : 'No earlier forecast available'}
              aria-label="Previous forecast period"
            >
              ←
            </button>
            <div className="weather-toolbar-primary-content">
            <button
              type="button"
              className="weather-tool-pill is-active"
              onClick={handleShowToday}
              title="Return to today's forecast"
            >
              Today
            </button>
            <button
              type="button"
              className="weather-toolbar-location"
              onClick={(event) => { popoverTriggerRef.current = event.currentTarget; setSettingsOpen(false); setLocationOpen(value => !value); setStatusMessage(''); }}
              title="Choose location"
              aria-expanded={locationOpen}
            >
              <span>{toolbarLocationLabel}</span>
              <span className="weather-toolbar-location-caret">⌄</span>
            </button>
            <button
              type="button"
              className="weather-tool-button"
              onClick={handleMoveForward}
              disabled={!canMoveForward}
              title={canMoveForward ? 'Show next forecast period' : 'No later forecast available'}
              aria-label="Next forecast period"
            >
              →
            </button>
            </div>
            </div>
          </div>

          <div className="weather-toolbar-row weather-toolbar-row-controls">
            <div className="weather-toolbar-cluster weather-toolbar-cluster-right">
            <div className="weather-toolbar-row-spacer" aria-hidden="true"></div>
            <div className="weather-toolbar-secondary-content">
            <div className="weather-tab-strip" role="tablist" aria-label="Weather sections">
              <button
                type="button"
                className={`weather-tab-button${activeTab === 'now' ? ' is-active' : ''}`}
                role="tab" aria-selected={activeTab === 'now'}
                onClick={() => openNowView('')}
                title="Show current weather"
              >
                Now
              </button>
              <button
                type="button"
                className={`weather-tab-button${activeTab === 'hourly' ? ' is-active' : ''}`}
                role="tab" aria-selected={activeTab === 'hourly'}
                onClick={() => openHourlyView('')}
                title="Show hourly forecast"
              >
                Hourly
              </button>
              <button
                type="button"
                className={`weather-tab-button${activeTab === 'radar' ? ' is-active' : ''}`}
                role="tab" aria-selected={activeTab === 'radar'}
                onClick={openRadarView}
                title="Show recent observed radar"
              >
                Radar
              </button>
            </div>
            <button type="button" className="weather-tool-button" onClick={handleToggleSettings} title="Weather settings" aria-label="Open weather settings">⚙</button>
            <button type="button" className="weather-tool-button" onClick={handleRefreshAction} title="Refresh weather" aria-label="Refresh weather data">↻</button>
            </div>
            </div>
          </div>
        </div>

        {settingsOpen || locationOpen ? (
          <div ref={popoverRef} className="weather-popover" role="dialog" aria-label={locationOpen ? 'Choose location' : 'Weather settings'} style={popoverPosition}>
            <div className="weather-popover-heading"><strong>{locationOpen ? 'Choose location' : 'Weather settings'}</strong><button type="button" aria-label="Close panel" onClick={() => { setLocationOpen(false); setSettingsOpen(false); popoverTriggerRef.current?.focus(); }}>×</button></div>
            {locationOpen ? <>
              <button type="button" className="weather-settings-action" onClick={openLiveLocation}>Use my live location</button>
              <form className="weather-location-form" onSubmit={handleSearchSubmit}>
                <label htmlFor="weather-city">Search a manual location</label>
                <div className="weather-location-search"><input id="weather-city" ref={searchInputRef} value={searchValue} onChange={event => setSearchValue(event.target.value)} placeholder="City or postcode" aria-label="Search for a location" /><button type="submit" aria-label="Search location">Search</button></div>
              </form>
              <button type="button" className="weather-units-shortcut" onClick={() => { setLocationOpen(false); setSettingsOpen(true); }}>Units: {units === 'metric' ? 'Metric' : 'Imperial'} →</button>
              {statusMessage ? <p role="status">{statusMessage}</p> : null}
            </> : <>
              <label className="weather-setting-row">Units<select aria-label="Units" value={units} onChange={event => setPreferences(previous => ({ ...previous, units: event.target.value }))}><option value="metric">Metric · °C, km/h</option><option value="imperial">Imperial · °F, mph</option></select></label>
              <label className="weather-setting-row"><span>Autoplay recent radar</span><input type="checkbox" checked={preferences.radarAutoplay === true} onChange={event => setPreferences(previous => ({ ...previous, radarAutoplay: event.target.checked }))} /></label>
              <button type="button" className="weather-settings-action" onClick={() => { setDimensions({ width: 640, height: 500 }); setSize('normal'); setSettingsOpen(false); }}>Reset widget size</button>
            </>}
          </div>
        ) : null}

        {statusMessage ? <div className="weather-inline-message">{statusMessage}</div> : null}

        <div className="weather-dashboard" aria-busy={isLoading}>
          {activeTab === 'now' ? <>
          <section ref={nowSectionRef} className="weather-current-card weather-panel">
            <div className="weather-current-visual">
             <div className="weather-current-icon">
               <WeatherGlyph
                 condition={weather.current.condition}
                 size="hero"
                 timestamp={weather.current.updatedAt}
                 sunrise={weather.metrics.sunrise}
                 sunset={weather.metrics.sunset}
                 alt={`${weather.current.condition} icon`}
               />
             </div>
              <div className="weather-current-copy">
                <div className="weather-current-temp">{temperature(weather.current.temperature)}<span>{temperatureUnit}</span></div>
                <div className="weather-current-condition">{weather.current.condition}</div>
                <div className="weather-current-location">{weather.current.location}</div>
                <div className="weather-current-feels">Feels like {temperature(weather.current.feelsLike)}{temperatureUnit}</div>
              </div>
            </div>

            <div className="weather-current-side">
              <div className="weather-current-range">
                <span className="weather-high">High {temperature(weather.current.high)}°</span>
                <span className="weather-low">Low {temperature(weather.current.low)}°</span>
              </div>
              <div className="weather-current-meta">{formatUpdatedLabel(weather.current.updatedAt)}</div>
              <div className="weather-current-meta">{activeForecastDay?.fullLabel || formatLongDateTime(weather.current.updatedAt)}</div>
            </div>
          </section>

          <section className="weather-details weather-metrics-grid weather-panel">
            {activeMetrics.map((metric) => (
              <article key={metric.key} className={`weather-detail-item weather-metric-card accent-${metric.accent}`}>
                <div className="weather-detail-head">
                  <MetricGlyph name={metric.icon} accent={metric.accent} />
                  <div className="weather-detail-label">{metric.label}</div>
                </div>
                <div className="weather-detail-value">{metric.value}</div>
                <div className="weather-detail-subtext">{metric.subtext}</div>
              </article>
            ))}
          </section>
          </> : null}

          {activeTab === 'hourly' ? <section ref={hourlySectionRef} className="weather-hourly weather-panel">
            <div className="weather-section-heading">
              <h3>Hourly Forecast</h3>
              <button
                type="button"
                className="weather-inline-action"
                onClick={handleShowMoreHourly}
              >
                {displayedHourlyForecast.length > 0 ? 'Show more' : 'Unavailable'}
              </button>
            </div>

            {displayedHourlyForecast.length > 0 ? (
              <div ref={hourlyTrackRef} className="weather-hourly-track">
                {displayedHourlyForecast.map((item) => (
                  <article key={item.id} className={`weather-hour-card${item.isNow ? ' is-now' : ''}`}>
                    <div className="weather-hour-time">{item.time}</div>
                    <div className="weather-hour-icon">
                      <WeatherGlyph
                        condition={item.condition}
                        size="hour"
                        timestamp={item.timestamp}
                        sunrise={weather.metrics.sunrise}
                        sunset={weather.metrics.sunset}
                        alt={`${item.condition} icon`}
                      />
                    </div>
                    <div className="weather-hour-temp">{temperature(item.temperature)}°</div>
                    <div className="weather-hour-precip">
                      {item.precipChance === null || item.precipChance === undefined ? '--%' : `${item.precipChance}%`}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="weather-empty-panel">Hourly forecast data is not available yet for this source.</div>
            )}
          </section> : null}

          {activeTab === 'radar' ? (
            <Suspense fallback={<div role="status">Loading radar map…</div>}><WeatherRadar apiHost={API_HOST} latitude={weather.meta.latitude} longitude={weather.meta.longitude} timezone={weather.meta.timezoneId} autoplay={preferences.radarAutoplay === true} /></Suspense>
          ) : null}

        </div>

        {weather.error && weather.errorMessage ? (
          <div className="weather-error" role="alert">{weather.errorMessage} <button type="button" onClick={handleRefreshAction}>Retry</button></div>
        ) : null}

        {isLoading ? (
          <div className="weather-loading-status" role="status">Updating weather…</div>
        ) : null}

        <button type="button" className="weather-resize-handle" title="Resize Weather" aria-label="Resize Weather" onPointerDown={handleResizeStart} onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
          event.preventDefault();
          setDimensions(previous => ({ width: (previous.width || 640) + (event.key === 'ArrowRight' ? 20 : event.key === 'ArrowLeft' ? -20 : 0), height: (previous.height || 500) + (event.key === 'ArrowDown' ? 20 : event.key === 'ArrowUp' ? -20 : 0) }));
        }}><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 13 13 4M9 13l4-4" stroke="currentColor" strokeWidth="1.5" /></svg></button>
      </div>
    </div>
  );
};

export default WeatherWidget;
