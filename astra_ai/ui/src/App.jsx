import React, { useState, useEffect } from 'react';
import './App.css';
import NovaCore from './components/NovaCore/NovaCore';
import ModernChat from './components/Chat/ModernChat';
import SearchWidget from './components/Search/SearchWidget';
import NewsWidget from './components/News/NewsWidget';
import NotesWidget, { HiddenNotepadAccessButton } from './components/Notes/NotesWidget';
import TicTacToeWidget from './components/TicTacToe/TicTacToeWidget';
import CameraWidget from './components/Camera/CameraWidget';
import CalculatorWidget from './components/Calculator/CalculatorWidget';
import ObjectIdentificationWidget from './components/ObjectIdentification/ObjectIdentificationWidget';
import TaskWidget from './components/Task/TaskWidget';
import AIEyeWidget from './components/AIEye/AIEyeWidget';
import FloatingChatButton from './components/Chat/FloatingChatButton';
import TimeWidget from './Time/Time_Widget';
import WeatherWidget from './components/weather/weatherWidget';

function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [timeWidgetLocation, setTimeWidgetLocation] = useState('Local Time');
  const [searchData, setSearchData] = useState(null);
  const [lastSearchId, setLastSearchId] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLocation, setWeatherLocation] = useState('Current Location');
  const [widgets, setWidgets] = useState({
    search: false,
    news: false,
    notes: false,
    tictactoe: false,
    camera: false,
    calculator: false,
    objectidentification: false,
    task: false,
    aieye: false,
    time: false,
    weather: false,
  });

  const toggleWidget = (widgetName) => {
    console.log(`Toggling widget: ${widgetName}`);
    setWidgets(prev => ({
      ...prev,
      [widgetName]: !prev[widgetName]
    }));
  };

  const handleWidgetTrigger = (widgetName, data = {}) => {
    console.log(`[DEBUG] handleWidgetTrigger: ${widgetName}`, data);

    // Enable the widget
    setWidgets(prev => {
      console.log(`[DEBUG] Updating ${widgetName} visibility from ${prev[widgetName]} to true`);
      return {
        ...prev,
        [widgetName]: true
      };
    });

    // Handle specific widget data
    if (widgetName === 'time' && data.location) {
      setTimeWidgetLocation(data.location);
    }

    if (widgetName === 'search' && data.query) {
      console.log(`[DEBUG] Setting searchData with query length: ${data.query.length}`);
      // Create a new object with timestamp to ensure React detects the change
      setSearchData({
        content: data.query,
        timestamp: Date.now()
      });
    }

    if (widgetName === 'weather') {
      if (data.location) {
        setWeatherLocation(data.location);
      }
      if (data.weatherData) {
        setWeatherData(data.weatherData);
      }
    }
  };

  // Automatic search monitoring mechanism
  useEffect(() => {
    const pollSearchHistory = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const apiPort = urlParams.get('api_port') || '5001';
        const apiHost = window.location.hostname || '127.0.0.1';
        const baseUrl = `http://${apiHost}:${apiPort}`;

        const response = await fetch(`${baseUrl}/api/search/history`);
        if (response.ok) {
          const data = await response.json();
          const searches = data.searches || [];

          if (searches.length > 0) {
            const latestSearch = searches[searches.length - 1];

            // If we detect a new search ID that's different from what we last saw
            if (latestSearch.search_id !== lastSearchId) {
              console.log("[POLLING] New search ID detected:", latestSearch.search_id);

              // Only auto-trigger if we already had a lastSearchId (prevents popping up old searches on refresh)
              if (lastSearchId !== null) {
                handleWidgetTrigger('search', { query: latestSearch.results });
              }

              setLastSearchId(latestSearch.search_id);
            }
          }
        }
      } catch (error) {
        // Silently fail
      }
    };

    const interval = setInterval(pollSearchHistory, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [lastSearchId]);

  return (
    <div className="grid-container">
      {/* Background Elements */}
      <div className="dot-grid"></div>
      <div className="glow-overlay"></div>

      {/* Main Nova Interface */}
      <NovaCore />

      {/* Hidden Notepad Access Button (on left side) */}
      <HiddenNotepadAccessButton onOpen={() => toggleWidget('notes')} />

      {/* Chat Messages and Input - Integrated with Widget Trigger */}
      <FloatingChatButton onClick={() => setChatOpen(true)} />
      <ModernChat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onWidgetTrigger={handleWidgetTrigger}
      />

      {/* Widgets Container */}
      <div className="widgets-container" style={{ pointerEvents: 'none' }}>
        {/* Pointer events set to none on container so clicks pass through to background/NovaCore, 
            but re-enabled on individual widgets by the widget logic or CSS */}

        {widgets.search && (
          <div style={{ pointerEvents: 'auto' }}>
            <SearchWidget
              onClose={() => toggleWidget('search')}
              initialQuery={searchData}
            />
          </div>
        )}
        {widgets.news && <div style={{ pointerEvents: 'auto' }}><NewsWidget onClose={() => toggleWidget('news')} /></div>}
        {widgets.notes && <div style={{ pointerEvents: 'auto' }}><NotesWidget onClose={() => toggleWidget('notes')} /></div>}
        {widgets.tictactoe && <div style={{ pointerEvents: 'auto' }}><TicTacToeWidget onClose={() => toggleWidget('tictactoe')} /></div>}
        {widgets.camera && <div style={{ pointerEvents: 'auto' }}><CameraWidget onClose={() => toggleWidget('camera')} /></div>}

        {/* Calculator Widget */}
        {widgets.calculator && (
          <div style={{ pointerEvents: 'auto' }}>
            <CalculatorWidget
              isVisible={true}
              onClose={() => toggleWidget('calculator')}
            />
          </div>
        )}

        {widgets.objectidentification && <div style={{ pointerEvents: 'auto' }}><ObjectIdentificationWidget onClose={() => toggleWidget('objectidentification')} /></div>}
        {widgets.task && <div style={{ pointerEvents: 'auto' }}><TaskWidget onClose={() => toggleWidget('task')} /></div>}
        {widgets.aieye && <div style={{ pointerEvents: 'auto' }}><AIEyeWidget onClose={() => toggleWidget('aieye')} /></div>}

        {/* Time Widget */}
        {widgets.time && (
          <div style={{ pointerEvents: 'auto' }}>
            <TimeWidget
              onClose={() => toggleWidget('time')}
              location={timeWidgetLocation}
              initialPosition={{ x: window.innerWidth - 300, y: 100 }}
            />
          </div>
        )}

        {/* Weather Widget */}
        {widgets.weather && (
          <div style={{ pointerEvents: 'auto' }}>
            <WeatherWidget
              onClose={() => toggleWidget('weather')}
              initialWeatherData={weatherData}
              initialLocation={weatherLocation}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
