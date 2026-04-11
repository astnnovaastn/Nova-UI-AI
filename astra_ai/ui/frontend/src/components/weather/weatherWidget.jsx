import React, { useState, useEffect, useRef, useCallback } from 'react';
import './weatherWidget.css';

const WeatherWidget = ({
  initialWeatherData = null,
  initialLocation = 'Current Location',
  onClose,
  apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/chat',
  sessionId = null
}) => {
  // State for weather data
  const [weather, setWeather] = useState({
    temperature: 'Loading...',
    feelsLike: 'Loading...',
    condition: 'Loading weather data...',
    conditionEmoji: '⏳',
    icon: '⏳',
    high: 'Loading...',
    low: 'Loading...',
    humidity: 'Loading...',
    uvIndex: 'Loading...',
    visibility: 'Loading...',
    windSpeed: 'Loading...',
    windDirection: 'Loading...',
    pressure: 'Loading...',
    dewPoint: 'Loading...',
    sunrise: 'Loading...',
    sunset: 'Loading...',
    location: initialLocation,
    error: false
  });

  // State for widget controls
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ x: 60, y: 100 }); // Default position (6vh, 12vh approx)
  const [size, setSize] = useState('normal'); // 'small', 'normal', 'large', 'xlarge'
  const [dimensions, setDimensions] = useState({ width: null, height: null });
  const [isLoading, setIsLoading] = useState(false);

  // Refs for drag and resize functionality
  const widgetRef = useRef(null);
  const dragRef = useRef({ isDragging: false, offsetX: 0, offsetY: 0, startX: 0, startY: 0 });
  const resizeRef = useRef({ isResizing: false, startWidth: 0, startHeight: 0, startX: 0, startY: 0 });
  const intervalRef = useRef(null);
  const currentLocationRef = useRef(initialLocation);

  // Weather cache
  const [weatherCache, setWeatherCache] = useState({});
  const WEATHER_CACHE_DURATION = 300000; // 5 minutes
  const MAX_CACHE_ENTRIES = 20; // Limit cache size to prevent memory issues

  // Load saved position and size from localStorage on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('widget_weatherDisplay_position');
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        if (parsed.left && parsed.top) {
          setPosition({
            x: parseInt(parsed.left),
            y: parseInt(parsed.top)
          });
        }
        if (parsed.width && parsed.height) {
          setDimensions({
            width: parseInt(parsed.width),
            height: parseInt(parsed.height)
          });
        }
        // Map saved size index to string if needed, or just use default
      } catch (e) {
        console.error("Failed to load widget position", e);
      }
    }

    // Initial fetch
    startWeatherUpdates(initialLocation);

    return () => {
      stopWeatherUpdates();
      window.removeEventListener('resize', handleViewportResizeDebounced);
    };
  }, []);

  // Update on prop change
  useEffect(() => {
    if (initialWeatherData) {
      setWeather(prev => ({ ...prev, ...initialWeatherData }));
    }
  }, [initialWeatherData]);

  // Handle location change
  useEffect(() => {
    if (initialLocation !== currentLocationRef.current) {
      startWeatherUpdates(initialLocation);
    }
  }, [initialLocation]);

  // Listen for live weather updates from Chat or other components
  useEffect(() => {
    const handleWeatherUpdate = (event) => {
      if (event.detail) {
        setIsVisible(true); // Auto-show widget
        updateWeatherDisplay(event.detail);
        if (event.detail.location) {
          currentLocationRef.current = event.detail.location;
        }
      }
    };

    window.addEventListener('weather-data-update', handleWeatherUpdate);
    return () => window.removeEventListener('weather-data-update', handleWeatherUpdate);
  }, []);

  // Viewport scaling logic
  const getViewportScale = useCallback(() => {
    const baseWidth = 1920;
    const baseHeight = 1080;
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    const scaleX = currentWidth / baseWidth;
    const scaleY = currentHeight / baseHeight;
    const scale = Math.min(scaleX, scaleY);
    return Math.max(0.5, Math.min(2.0, scale));
  }, []);

  // Dynamic Text Scaling Function (Ported from splash_screen.html)
  const applyDynamicTextScaling = useCallback(() => {
    const widget = widgetRef.current;
    if (!widget) return;

    // Use current dimensions or client rect
    const rect = widget.getBoundingClientRect();
    const width = dimensions.width || rect.width;
    const height = dimensions.height || rect.height;

    const baseWidth = 260; // Aligned with CSS default width
    const baseHeight = 380; // Aligned with CSS default min-height
    const scaleX = width / baseWidth;
    const scaleY = height / baseHeight;
    const avgScale = (scaleX + scaleY) / 2;

    const viewportScale = getViewportScale();
    const dampedScale = Math.pow(avgScale, 0.6);
    const textScale = Math.pow(avgScale, 0.7);
    const elementScale = Math.pow(avgScale, 0.8);

    const finalScale = dampedScale * viewportScale;
    const finalTextScale = textScale * viewportScale;
    const finalElementScale = elementScale * viewportScale;

    const clampedTextScale = Math.max(0.6, Math.min(2.0, finalTextScale));
    const clampedElementScale = Math.max(0.7, Math.min(2.2, finalElementScale));

    // Helper to safely set style
    const setStyle = (selector, styleProps) => {
      const elements = widget.querySelectorAll(selector);
      elements.forEach(el => {
        Object.entries(styleProps).forEach(([prop, value]) => {
          el.style[prop] = value;
        });
      });
    };

    // Scale Labels
    setStyle('.weather-label', {
      fontSize: `${Math.max(8, 12 * clampedTextScale)}px`,
      padding: `${Math.max(2, 3 * clampedElementScale)}px ${Math.max(6, 10 * clampedElementScale)}px`,
      marginBottom: `${Math.max(4, 8 * clampedElementScale)}px`
    });

    // Scale Main Temps
    setStyle('.weather-temp', {
      fontSize: `${Math.max(16, 24 * clampedTextScale)}px`,
      marginTop: `${Math.max(4, 6 * clampedElementScale)}px`,
      lineHeight: `${Math.max(1.0, 1.1 * clampedElementScale)}`
    });

    // Scale Details
    setStyle('.weather-condition', {
      fontSize: `${Math.max(8, 11 * clampedTextScale)}px`,
      marginTop: `${Math.max(2, 4 * clampedElementScale)}px`,
      lineHeight: `${Math.max(1.2, 1.3 * clampedElementScale)}`
    });

    setStyle('.weather-feels-like', {
      fontSize: `${Math.max(8, 11 * clampedTextScale)}px`,
      marginTop: `${Math.max(2, 3 * clampedElementScale)}px`,
      lineHeight: `${Math.max(1.2, 1.3 * clampedElementScale)}`
    });

    setStyle('.weather-location', {
      fontSize: `${Math.max(8, 11 * clampedTextScale)}px`,
      marginTop: `${Math.max(2, 3 * clampedElementScale)}px`,
      lineHeight: `${Math.max(1.2, 1.3 * clampedElementScale)}`
    });

    setStyle('.weather-icon-main', { // Target class weather-icon-main NOT weather-icon
      width: 'auto', // Icons in React are usually text/emojis, so font-size matters more
      fontSize: `${Math.max(16, 24 * clampedElementScale)}px`
    });

    // Scale detail items
    setStyle('.weather-detail-value', {
      fontSize: `${Math.max(7, 10 * clampedTextScale)}px`
    });

    setStyle('.weather-detail-item', {
      padding: `${Math.max(1, 4 * clampedElementScale)}px`,
    });

    // Scale Controls
    setStyle('.widget-control-btn', {
      width: `${Math.max(16, 20 * clampedElementScale)}px`,
      height: `${Math.max(16, 20 * clampedElementScale)}px`,
      fontSize: `${Math.max(10, 14 * clampedTextScale)}px`
    });

  }, [dimensions, getViewportScale]);

  // Re-apply scaling when dimensions/size change
  useEffect(() => {
    applyDynamicTextScaling();
  }, [dimensions, size, applyDynamicTextScaling, weather]);

  // Handle window resize
  const handleViewportResizeDebounced = useCallback(() => {
    setTimeout(applyDynamicTextScaling, 150);
  }, [applyDynamicTextScaling]);

  useEffect(() => {
    window.addEventListener('resize', handleViewportResizeDebounced);
    return () => window.removeEventListener('resize', handleViewportResizeDebounced);
  }, [handleViewportResizeDebounced]);

  // --- Size Controls (Presets) ---
  const widgetSizes = ['small', 'normal', 'large', 'xlarge'];

  const cycleSize = useCallback((direction) => {
    setSize(prevSize => {
      const currentIndex = widgetSizes.indexOf(prevSize);
      let newIndex;
      if (direction === 'up') {
        newIndex = Math.min(widgetSizes.length - 1, currentIndex + 1);
      } else {
        newIndex = Math.max(0, currentIndex - 1);
      }
      return widgetSizes[newIndex];
    });
    // Reset custom dimensions when using presets
    setDimensions({ width: null, height: null });
  }, []);

  // Keyboard shortcuts for widget controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only respond to shortcuts when widget is visible
      if (!isVisible) return;

      // 'Escape' key to close the widget
      if (e.key === 'Escape') {
        setIsVisible(false);
        if (onClose) onClose();
      }

      // 'ArrowUp' to increase size
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        cycleSize('up');
      }

      // 'ArrowDown' to decrease size
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        cycleSize('down');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose, cycleSize]);


  // --- Drag Logic ---
  const handleDragStart = (e) => {
    // Only allow dragging from the drag handle area
    if (!e.target.classList.contains('drag-handle') && !e.target.closest('.drag-handle')) {
      // If not clicking on drag handle, don't allow dragging
      return;
    }

    dragRef.current.isDragging = true;
    const rect = widgetRef.current.getBoundingClientRect();
    dragRef.current.offsetX = e.clientX - rect.left;
    dragRef.current.offsetY = e.clientY - rect.top;

    // Add visual feedback
    if (widgetRef.current) widgetRef.current.classList.add('widget-dragging');

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = useCallback((e) => {
    if (!dragRef.current.isDragging) return;

    const newX = e.clientX - dragRef.current.offsetX;
    const newY = e.clientY - dragRef.current.offsetY;

    // Boundary checking to keep widget within viewport
    const widgetWidth = widgetRef.current?.offsetWidth || 300;
    const widgetHeight = widgetRef.current?.offsetHeight || 200;

    const boundedX = Math.max(0, Math.min(newX, window.innerWidth - widgetWidth));
    const boundedY = Math.max(0, Math.min(newY, window.innerHeight - widgetHeight));

    setPosition({ x: boundedX, y: boundedY });
  }, []);

  const handleDragEnd = useCallback(() => {
    dragRef.current.isDragging = false;
    // Remove visual feedback
    if (widgetRef.current) widgetRef.current.classList.remove('widget-dragging');
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    saveWidgetState();
  }, []);

  // --- Resize Logic ---
  const handleResizeStart = (e) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection
    resizeRef.current.isResizing = true;
    resizeRef.current.startX = e.clientX;
    resizeRef.current.startY = e.clientY;

    const rect = widgetRef.current.getBoundingClientRect();
    resizeRef.current.startWidth = rect.width;
    resizeRef.current.startHeight = rect.height;

    // Add resizing class to disable transitions and provide visual feedback
    if (widgetRef.current) widgetRef.current.classList.add('widget-resizing');

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = useCallback((e) => {
    if (!resizeRef.current.isResizing) return;

    const deltaX = e.clientX - resizeRef.current.startX;
    const deltaY = e.clientY - resizeRef.current.startY;

    const newWidth = Math.max(260, resizeRef.current.startWidth + deltaX); // Minimum width
    const newHeight = Math.max(380, resizeRef.current.startHeight + deltaY); // Minimum height

    setDimensions({ width: newWidth, height: newHeight });
  }, []);

  const handleResizeEnd = useCallback(() => {
    resizeRef.current.isResizing = false;
    if (widgetRef.current) widgetRef.current.classList.remove('widget-resizing');
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    saveWidgetState();
  }, []);

  const saveWidgetState = () => {
    const state = {
      left: position.x + 'px',
      top: position.y + 'px',
      width: dimensions.width ? dimensions.width + 'px' : undefined,
      height: dimensions.height ? dimensions.height + 'px' : undefined
    };
    localStorage.setItem('widget_weatherDisplay_position', JSON.stringify(state));
  };





  // --- Weather Fetching Logic ---
  const startWeatherUpdates = (location) => {
    stopWeatherUpdates();
    if (!location) return;

    currentLocationRef.current = location;
    // Initial fetch
    getWeatherForLocation(location, true).then(data => {
      if (data) updateWeatherDisplay(data);
    });

    // Interval - update every 10 minutes (600000ms) instead of 5 minutes for better API usage
    intervalRef.current = setInterval(async () => {
      if (currentLocationRef.current) {
        const data = await getWeatherForLocation(currentLocationRef.current, false); // Use cache when possible
        if (data) updateWeatherDisplay(data);
      }
    }, 600000); // Increased to 10 minutes to be more respectful of API limits
  };

  const stopWeatherUpdates = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const getWeatherForLocation = async (location, forceRefresh = false) => {
    const cacheKey = location.toLowerCase();
    const now = Date.now();

    // Check cache first (unless force refresh)
    if (!forceRefresh && weatherCache[cacheKey] && (now - weatherCache[cacheKey].timestamp < WEATHER_CACHE_DURATION)) {
      console.log(`📋 Using cached weather for ${location}`);
      return weatherCache[cacheKey].data;
    }

    setIsLoading(true);
    console.log(`🌐 Fetching weather for: ${location}`);

    try {
      // Implement exponential backoff for retries
      let attempts = 0;
      const maxAttempts = 3;
      let lastError;

      while (attempts < maxAttempts) {
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `What is the current weather in ${location}? Provide detailed, accurate weather data in CELSIUS. Include: temperature, feels_like, condition, humidity, wind_speed, wind_direction, pressure, uv_index, visibility, dew_point, sunrise, sunset. Format as: WEATHER_DATA: {JSON object}`,
              session_id: sessionId
            }),
            // Add timeout
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const data = await response.json();
          console.log(`📡 Weather API response:`, data.response?.substring(0, 200) + '...');

          if (data.response && data.response.includes('WEATHER_DATA:')) {
            try {
              // Extract JSON after WEATHER_DATA:
              const weatherJsonMatch = data.response.match(/WEATHER_DATA:\s*(\{[\s\S]*\})/);
              if (weatherJsonMatch) {
                const weatherJson = weatherJsonMatch[1].trim();
                console.log(`🌤️ Parsing weather JSON: ${weatherJson}`);

                // Validate JSON structure before parsing
                let weatherData;
                try {
                  weatherData = JSON.parse(weatherJson);
                } catch (parseError) {
                  console.error('❌ Invalid JSON format:', parseError);
                  throw new Error('Invalid JSON format in weather response');
                }

                // Validate required fields
                const requiredFields = ['temperature', 'condition', 'humidity'];
                const missingFields = requiredFields.filter(field => !(field in weatherData));
                if (missingFields.length > 0) {
                  console.warn(`⚠️ Missing required fields: ${missingFields.join(', ')}`);
                }

                // Validate data types and ranges
                if (typeof weatherData.temperature !== 'number' && typeof weatherData.temperature !== 'string') {
                  console.warn('⚠️ Temperature is not a number or string');
                }

                // Validate numeric ranges
                if (typeof weatherData.temperature === 'number') {
                  if (weatherData.temperature < -100 || weatherData.temperature > 100) {
                    console.warn('⚠️ Temperature value seems unrealistic:', weatherData.temperature);
                  }
                }

                // Validate condition
                if (typeof weatherData.condition !== 'string' || !weatherData.condition.trim()) {
                  console.warn('⚠️ Condition is not a valid string');
                }

                // Validate humidity
                if (typeof weatherData.humidity === 'number' && (weatherData.humidity < 0 || weatherData.humidity > 100)) {
                  console.warn('⚠️ Humidity value is out of range:', weatherData.humidity);
                }

                // Validate and normalize the weather data structure
                const normalizedData = normalizeWeatherData(weatherData, location);

                // Clean up cache if it exceeds max entries
                if (Object.keys(weatherCache).length >= MAX_CACHE_ENTRIES) {
                  // Remove oldest entries
                  const sortedEntries = Object.entries(weatherCache)
                    .sort((a, b) => a[1].timestamp - b[1].timestamp);

                  const entriesToRemove = sortedEntries.slice(0, Math.floor(MAX_CACHE_ENTRIES / 4));
                  const newCache = { ...weatherCache };

                  entriesToRemove.forEach(([key]) => {
                    delete newCache[key];
                  });

                  setWeatherCache(newCache);
                }

                // Cache the normalized data
                setWeatherCache(prev => ({
                  ...prev,
                  [cacheKey]: { data: normalizedData, timestamp: now }
                }));

                console.log(`✅ Successfully parsed weather data for ${location}`);
                return normalizedData;
              }
            } catch (parseError) {
              console.error('❌ Failed to parse weather JSON:', parseError);
            }
          }

          // If WEATHER_DATA format not found or parsing failed, try text extraction as fallback
          console.log('🔄 WEATHER_DATA format not found, trying text extraction...');
          const extractedData = extractWeatherFromText(data.response, location);
          if (extractedData) {
            // Clean up cache if it exceeds max entries
            if (Object.keys(weatherCache).length >= MAX_CACHE_ENTRIES) {
              // Remove oldest entries
              const sortedEntries = Object.entries(weatherCache)
                .sort((a, b) => a[1].timestamp - b[1].timestamp);

              const entriesToRemove = sortedEntries.slice(0, Math.floor(MAX_CACHE_ENTRIES / 4));
              const newCache = { ...weatherCache };

              entriesToRemove.forEach(([key]) => {
                delete newCache[key];
              });

              setWeatherCache(newCache);
            }

            setWeatherCache(prev => ({
              ...prev,
              [cacheKey]: { data: extractedData, timestamp: now }
            }));
            return extractedData;
          }

          // If all parsing methods fail, throw an error
          throw new Error(`Could not extract weather data for ${location}`);

        } catch (attemptError) {
          lastError = attemptError;
          attempts++;

          if (attempts < maxAttempts) {
            // Exponential backoff: wait 1s, then 2s, then 4s
            const delay = Math.pow(2, attempts - 1) * 1000;
            console.log(`Attempt ${attempts} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // If all attempts failed, throw the last error
      throw lastError;

    } catch (error) {
      console.error(`❌ Weather fetch error for ${location}:`, error);

      // Return error data instead of mock data
      const errorData = {
        temperature: 'Error',
        feelsLike: 'Error',
        condition: 'Unable to load',
        conditionEmoji: '❌',
        icon: '❌',
        high: 'Error',
        low: 'Error',
        humidity: 'Error',
        uvIndex: 'Error',
        visibility: 'Error',
        windSpeed: 'Error',
        windDirection: 'Error',
        pressure: 'Error',
        dewPoint: 'Error',
        sunrise: 'Error',
        sunset: 'Error',
        location: location,
        error: true,
        errorMessage: error.message
      };

      // Cache error data for a shorter time (half the normal duration)
      setWeatherCache(prev => ({
        ...prev,
        [cacheKey]: { data: errorData, timestamp: now }
      }));

      return errorData;
    } finally {
      setIsLoading(false);
    }
  };

  // Normalize weather data to ensure consistent structure
  const normalizeWeatherData = (data, location) => {
    // Helper function to get weather icon based on condition
    const getWeatherIcon = (condition) => {
      if (!condition) return '🌤️';

      const conditionLower = condition.toLowerCase();
      if (conditionLower.includes('sunny') || conditionLower.includes('clear')) return '☀️';
      if (conditionLower.includes('partly cloudy') || conditionLower.includes('mostly sunny')) return '⛅';
      if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) return '☁️';
      if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return '🌧️';
      if (conditionLower.includes('thunder') || conditionLower.includes('storm')) return '⛈️';
      if (conditionLower.includes('snow')) return '❄️';
      if (conditionLower.includes('fog') || conditionLower.includes('mist')) return '🌫️';
      return '🌤️'; // Default
    };

    // Helper function to validate and sanitize numeric values
    const validateNumber = (value, defaultValue = 0, min = -Infinity, max = Infinity) => {
      if (typeof value === 'number' && !isNaN(value)) {
        return Math.max(min, Math.min(max, value));
      }
      if (typeof value === 'string') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          return Math.max(min, Math.min(max, numValue));
        }
      }
      return defaultValue;
    };

    // Helper function to validate and sanitize string values
    const validateString = (value, defaultValue = '', maxLength = 100) => {
      if (typeof value === 'string') {
        return value.substring(0, maxLength).trim();
      }
      return defaultValue;
    };

    // Helper function to validate time format
    const validateTime = (timeStr, defaultTime = '00:00') => {
      if (typeof timeStr === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr)) {
        return timeStr;
      }
      return defaultTime;
    };

    return {
      temperature: validateNumber(data.temperature, 0, -100, 100),
      feelsLike: validateNumber(data.feels_like || data.feelsLike, 0, -100, 100),
      condition: validateString(data.condition, 'Unknown', 50),
      conditionEmoji: getWeatherIcon(validateString(data.condition, 'Unknown', 50)),
      icon: getWeatherIcon(validateString(data.condition, 'Unknown', 50)),
      high: validateNumber(data.high || data.max_temp, 0, -100, 100),
      low: validateNumber(data.low || data.min_temp, 0, -100, 100),
      humidity: validateNumber(data.humidity, 0, 0, 100),
      uvIndex: validateNumber(data.uv_index || data.uvIndex, 0, 0, 15),
      visibility: validateNumber(data.visibility, 10, 0, 100),
      windSpeed: validateNumber(data.wind_speed || data.windSpeed, 0, 0, 300), // Max 300 km/h
      windDirection: validateString(data.wind_direction || data.windDirection, 'N', 2),
      pressure: validateNumber(data.pressure, 1013, 800, 1200), // Typical range for atmospheric pressure
      dewPoint: validateNumber(data.dew_point || data.dewPoint, 0, -100, 100),
      sunrise: validateTime(data.sunrise, '06:00'),
      sunset: validateTime(data.sunset, '18:00'),
      location: validateString(data.location || location, location, 100),
      error: false
    };
  };

  const extractWeatherFromText = (text, location) => {
    if (!text) return null;

    // Extract temperature (prioritize Celsius)
    const tempMatch = text.match(/(-?\d+(?:\.\d+)?)\s*°?\s*C/i) ||
                      text.match(/temperature.*?(-?\d+(?:\.\d+)?)/i) ||
                      text.match(/temp.*?(-?\d+(?:\.\d+)?)/i);
    const temp = tempMatch ? parseFloat(tempMatch[1]) : null;

    // Extract condition
    const conditionMatch = text.match(/(sunny|cloudy|rainy|clear|overcast|partly cloudy|partly sunny|storm|snow|fog|mist|thunder|drizzle|shower|freezing rain|ice pellets|hail|sleet|blowing snow|blizzard|freezing fog|smoke|volcanic ash|dust|sand|haze|spray|dust whirls|squalls|funnel cloud|tornado|waterspout|diamond dust|ice crystals|ice pellets|thunderstorm|heavy rain|light rain|moderate rain|heavy snow|light snow|moderate snow)/i);
    const condition = conditionMatch ? conditionMatch[1] : 'Unknown';

    // Extract humidity
    const humidityMatch = text.match(/humidity.*?(\d+)%/i) ||
                          text.match(/humid.*?(\d+)%/i);
    const humidity = humidityMatch ? parseInt(humidityMatch[1]) : 50;

    // Extract wind speed
    const windMatch = text.match(/wind.*?(\d+(?:\.\d+)?)\s*km\/h/i) ||
                      text.match(/wind.*?(\d+(?:\.\d+)?)\s*kilometers per hour/i) ||
                      text.match(/wind.*?(\d+(?:\.\d+)?)\s*mps/i); // meters per second
    let windSpeed = 0;
    if (windMatch) {
      const rawWind = parseFloat(windMatch[1]);
      // If the value is in m/s, convert to km/h (multiply by 3.6)
      if (windMatch[0].includes('mps') || rawWind < 50) {
        windSpeed = Math.round(rawWind * 3.6);
      } else {
        windSpeed = Math.round(rawWind);
      }
    }

    // Extract wind direction
    const windDirMatch = text.match(/wind.*?(N|NE|E|SE|S|SW|W|NW|North|East|South|West|northeast|southeast|southwest|northwest)/i);
    const windDirection = windDirMatch ? windDirMatch[1].toUpperCase().substring(0, 2) : 'N';

    // Extract pressure
    const pressureMatch = text.match(/pressure.*?(\d+(?:\.\d+)?)\s*hpa/i) ||
                          text.match(/pressure.*?(\d+(?:\.\d+)?)\s*mb/i);
    const pressure = pressureMatch ? parseFloat(pressureMatch[1]) : 1013;

    // Extract UV index
    const uvMatch = text.match(/uv.*?index.*?(\d+(?:\.\d+)?)/i) ||
                    text.match(/uv.*?(\d+(?:\.\d+)?)/i);
    const uvIndex = uvMatch ? parseFloat(uvMatch[1]) : 0;

    // Extract visibility
    const visibilityMatch = text.match(/visibility.*?(\d+(?:\.\d+)?)\s*km/i);
    const visibility = visibilityMatch ? parseFloat(visibilityMatch[1]) : 10;

    // Extract dew point
    const dewMatch = text.match(/dew.*?point.*?(-?\d+(?:\.\d+)?)\s*°?C/i);
    const dewPoint = dewMatch ? parseFloat(dewMatch[1]) : temp ? temp - 5 : 0;

    // Extract sunrise and sunset
    const sunriseMatch = text.match(/sunrise.*?(\d{1,2}:\d{2})/i);
    const sunsetMatch = text.match(/sunset.*?(\d{1,2}:\d{2})/i);
    const sunrise = sunriseMatch ? sunriseMatch[1] : '06:00';
    const sunset = sunsetMatch ? sunsetMatch[1] : '18:00';

    // Extract high and low temperatures
    const highMatch = text.match(/(?:high|maximum).*?(-?\d+(?:\.\d+)?)\s*°?C/i);
    const lowMatch = text.match(/(?:low|minimum).*?(-?\d+(?:\.\d+)?)\s*°?C/i);
    const high = highMatch ? parseFloat(highMatch[1]) : temp ? temp + 3 : 0;
    const low = lowMatch ? parseFloat(lowMatch[1]) : temp ? temp - 3 : 0;

    if (temp !== null) {
      // Create a comprehensive data object and normalize it
      const basicData = {
        temperature: temp,
        condition: condition,
        humidity: humidity,
        windSpeed: windSpeed,
        windDirection: windDirection,
        pressure: pressure,
        uvIndex: uvIndex,
        visibility: visibility,
        dewPoint: dewPoint,
        sunrise: sunrise,
        sunset: sunset,
        high: high,
        low: low,
        location: location
      };
      return normalizeWeatherData(basicData, location);
    }

    return null;
  };



  const updateWeatherDisplay = (data) => {
    setWeather(prev => ({ ...prev, ...data, uvLevel: getUVLevel(data.uvIndex) }));
  };

  const getUVLevel = (uv) => {
    if (uv <= 2) return 'Low';
    if (uv <= 5) return 'Moderate';
    if (uv <= 7) return 'High';
    return 'Extreme';
  };

  if (!isVisible) return null;

  const style = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: dimensions.width ? `${dimensions.width}px` : undefined,
    height: dimensions.height ? `${dimensions.height}px` : undefined,
    // If dimensions are set (manual resize), disable transform scale from class (or let it compound? splash_screen replaces it)
    // We'll rely on class for 'size' but manual resize overrides width/height
  };

  return (
    <div
      ref={widgetRef}
      className={`weather-display widget-draggable widget-size-${size}`}
      style={style}
      id="weatherDisplay"
    >
      <div className="corner-top-right"></div>
      <div className="corner-bottom-left"></div>

      {/* Drag handle - only this area allows dragging */}
      <div
        className="drag-handle"
        title="Drag to move • Double-click to maximize/restore"
        onMouseDown={handleDragStart}
        onDoubleClick={() => {
          // Double click to maximize/restore
          if (size === 'xlarge') {
            setSize('normal');
          } else {
            setSize('xlarge');
          }
        }}
      ></div>

      {/* Controls */}
      <div className="widget-controls">
        <div className="widget-control-btn" onClick={() => cycleSize('up')} title="Make Bigger">⧨</div>
        <div className="widget-control-btn" onClick={() => cycleSize('down')} title="Make Smaller">⧩</div>
        <div className="widget-control-btn" onClick={async () => {
          setIsLoading(true);
          const data = await getWeatherForLocation(currentLocationRef.current, true);
          if (data) updateWeatherDisplay(data);
          setIsLoading(false);
        }} title="Refresh Weather">↻</div>
        <div className="widget-control-btn" onClick={() => { setIsVisible(false); if (onClose) onClose(); }} title="Close">⧬</div>
      </div>

      <div className="weather-label">WEATHER</div>

      <div className="weather-main">
        <div className="weather-temp-section">
          <div className="weather-temp" id="weatherTemp">{weather.temperature}°C</div>
          <div className="weather-feels-like" id="weatherFeelsLike">Feels like {weather.feelsLike}°C</div>
        </div>
        <div className="weather-icon-main" id="weatherIcon">{weather.icon}</div>
      </div>

      <div className="weather-condition" id="weatherCondition">
        <span className="weather-condition-emoji">{weather.conditionEmoji}</span>
        <span>{weather.condition}</span>
      </div>

      <div className="weather-details">
        <div className="weather-detail-item">
          <div className="weather-detail-label">High/Low</div>
          <div className="weather-detail-value" id="weatherHighLow">{weather.high}° / {weather.low}°</div>
        </div>
        <div className="weather-detail-item">
          <div className="weather-detail-label">Humidity</div>
          <div className="weather-detail-value" id="weatherHumidity">
            <span className="weather-detail-emoji">💧</span>
            <span>{weather.humidity}%</span>
          </div>
        </div>
        <div className="weather-detail-item">
          <div className="weather-detail-label">UV Index</div>
          <div className="weather-detail-value" id="weatherUV">{weather.uvIndex} {getUVLevel(weather.uvIndex)}</div>
        </div>
        <div className="weather-detail-item">
          <div className="weather-detail-label">Visibility</div>
          <div className="weather-detail-value" id="weatherVisibility">{weather.visibility} km</div>
        </div>
      </div>

      <div className="weather-extended">
        <div className="weather-extended-item">
          <div className="weather-extended-label">Wind</div>
          <div className="weather-extended-value" id="weatherWind">
            <span className="weather-extended-emoji">💨</span>
            <span>{weather.windSpeed} km/h {weather.windDirection}</span>
          </div>
        </div>
        <div className="weather-extended-item">
          <div className="weather-extended-label">Pressure</div>
          <div className="weather-extended-value" id="weatherPressure">{weather.pressure} hPa</div>
        </div>
        <div className="weather-extended-item">
          <div className="weather-extended-label">Dew Point</div>
          <div className="weather-extended-value" id="weatherDewPoint">{weather.dewPoint}°C</div>
        </div>
      </div>

      <div className="weather-sun-times">
        <div className="weather-sun-item">
          <div className="weather-sun-label">Sunrise</div>
          <div className="weather-sun-value" id="weatherSunrise">
            <span className="weather-sun-emoji">🌅</span>
            <span>{weather.sunrise}</span>
          </div>
        </div>
        <div className="weather-sun-item">
          <div className="weather-sun-label">Sunset</div>
          <div className="weather-sun-value" id="weatherSunset">
            <span className="weather-sun-emoji">🌇</span>
            <span>{weather.sunset}</span>
          </div>
        </div>
      </div>

      <div className="weather-location" id="weatherLocation">{weather.location}</div>

      {/* Display error message if there's an error */}
      {weather.error && weather.errorMessage && (
        <div className="weather-error">
          Error: {weather.errorMessage}
        </div>
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner-icon">↻</div>
            <div className="spinner-text">Loading...</div>
          </div>
        </div>
      )}

      <div className="resize-handle" onMouseDown={handleResizeStart}></div>
    </div>
  );
};

export default WeatherWidget;