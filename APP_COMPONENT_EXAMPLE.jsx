// ============================================
// COMPLETE WIDGET IMPORT GUIDE
// ============================================
// Copy this into your App.js or main component

import React, { useEffect } from 'react';

// ============================================
// IMPORT GLOBAL STYLES
// ============================================
import './styles/WidgetsStyle.css';

// ============================================
// IMPORT ALL WIDGETS
// ============================================
import NewsWidget from './components/NewsWidget/NewsWidget';
import NotepadWidget from './components/NotepadWidget/NotepadWidget';
import SearchWidget from './components/SearchWidget/SearchWidget';
import ObjectIdentificationWidget from './components/ObjectWidget/ObjectWidget';
import CalculatorWidget from './components/CalculatorWidget/CalculatorWidget';
import CameraWidget from './components/CameraWidget/CameraWidget';
import TaskWidget from './components/TaskWidget/TaskWidget';

// Import previously implemented widgets
import ChatWidget from './components/Chat/ModernChat';
import NovaCore from './components/NovaCore/NovaCore';

// ============================================
// IMPORT WIDGET MANAGEMENT SYSTEMS
// ============================================
import { widgetManager } from './services/WidgetManager';
import { aiService } from './services/AIService';

// ============================================
// APP COMPONENT
// ============================================
function App() {
  useEffect(() => {
    // Initialize Widget Manager on app load
    console.log('📦 Initializing Widget System...');

    // Register all widgets
    widgetManager.registerWidget('news-widget', {
      name: 'News Widget',
      description: 'Live news feed with AI summarization',
    });
    widgetManager.registerWidget('notepad-widget', {
      name: 'Notepad Widget',
      description: 'Notes with AI summarization',
    });
    widgetManager.registerWidget('search-widget', {
      name: 'Search Widget',
      description: 'AI-powered search engine',
    });
    widgetManager.registerWidget('object-widget', {
      name: 'Object Identification Widget',
      description: 'Two-stage vision analysis',
    });
    widgetManager.registerWidget('calculator-widget', {
      name: 'Calculator Widget',
      description: 'Scientific calculator with natural language',
    });
    widgetManager.registerWidget('camera-widget', {
      name: 'Camera Widget',
      description: 'Video capture with AI analysis',
    });
    widgetManager.registerWidget('task-widget', {
      name: 'Task Widget',
      description: 'Complete task management',
    });

    // Check AI service configuration
    const aiStatus = aiService.getStatus();
    console.log('🤖 AI Service Status:', aiStatus);

    if (!aiStatus.hasApiKey) {
      console.warn('⚠️  Gemini API key not found. Some AI features will be disabled.');
    }

    console.log('✅ Widget System Ready!');
  }, []);

  return (
    <div className="app" style={{ backgroundColor: '#0a0e27', color: '#00ff88', minHeight: '100vh' }}>
      {/* ========================================
          MAIN INTERFACE
          ======================================== */}
      <NovaCore />
      <ChatWidget />

      {/* ========================================
          NEW WIDGETS SYSTEM
          ======================================== */}
      <NewsWidget />
      <NotepadWidget />
      <SearchWidget />
      <ObjectIdentificationWidget />
      <CalculatorWidget />
      <CameraWidget />
      <TaskWidget />

      {/* ========================================
          OPTIONAL: Floating Widget Controls
          ======================================== */}
      <WidgetControls />
    </div>
  );
}

// ============================================
// FLOATING WIDGET CONTROLS (OPTIONAL)
// ============================================
function WidgetControls() {
  const toggleAllWidgets = (visibility) => {
    document.querySelectorAll('.widget-container').forEach((widget) => {
      if (visibility === 'hide') {
        widget.style.opacity = '0.3';
      } else if (visibility === 'show') {
        widget.style.opacity = '1';
      }
    });
  };

  const centerAllWidgets = () => {
    document.querySelectorAll('.widget-container').forEach((widget) => {
      const left = (window.innerWidth - widget.offsetWidth) / 2;
      const top = (window.innerHeight - widget.offsetHeight) / 2;
      widget.style.left = `${left}px`;
      widget.style.top = `${top}px`;
    });
  };

  const clearAllData = () => {
    if (window.confirm('Clear all widget data? This cannot be undone.')) {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('widget-')) {
          localStorage.removeItem(key);
        }
      });
      window.location.reload();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        backgroundColor: '#0a0e27',
        border: '2px solid #00ff88',
        borderRadius: '8px',
        padding: '12px',
      }}
    >
      <div style={{ color: '#00ff88', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
        🎛️ WIDGET CONTROLS
      </div>

      <button
        onClick={centerAllWidgets}
        style={{
          padding: '8px 12px',
          backgroundColor: '#00ff8833',
          border: '1px solid #00ff88',
          color: '#00ff88',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 'bold',
        }}
      >
        📍 Center All
      </button>

      <button
        onClick={() => toggleAllWidgets('hide')}
        style={{
          padding: '8px 12px',
          backgroundColor: '#00ff8833',
          border: '1px solid #00ff88',
          color: '#00ff88',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 'bold',
        }}
      >
        👁️ Hide All
      </button>

      <button
        onClick={() => toggleAllWidgets('show')}
        style={{
          padding: '8px 12px',
          backgroundColor: '#00ff8833',
          border: '1px solid #00ff88',
          color: '#00ff88',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 'bold',
        }}
      >
        👀 Show All
      </button>

      <button
        onClick={clearAllData}
        style={{
          padding: '8px 12px',
          backgroundColor: '#ff000033',
          border: '1px solid #ff0000',
          color: '#ff0000',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 'bold',
        }}
      >
        🗑️ Clear Data
      </button>

      <details
        style={{
          fontSize: '10px',
          color: '#00aa66',
          marginTop: '8px',
          borderTop: '1px solid #00ff8833',
          paddingTop: '8px',
        }}
      >
        <summary style={{ cursor: 'pointer', marginBottom: '6px' }}>Status</summary>
        <div style={{ fontSize: '10px', color: '#00ff88', marginTop: '6px' }}>
          {Object.keys(localStorage).filter((k) => k.startsWith('widget-')).length} widget data keys
        </div>
      </details>
    </div>
  );
}

export default App;

// ============================================
// ENVIRONMENT VARIABLES REQUIRED
// ============================================
/*
Create .env file in astra_ai/ui/ with:

REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
REACT_APP_NEWS_API_KEY=your_news_api_key_here
REACT_APP_OPENWEATHER_API_KEY=your_weather_api_key_here

Get keys from:
- Gemini: https://makersuite.google.com/app/apikey
- News API: https://newsapi.org/
- OpenWeather: https://openweathermap.org/api
*/

// ============================================
// QUICK START COMMANDS
// ============================================
/*
1. cd astra_ai/ui

2. npm install

3. Create .env file with API keys

4. npm start

5. Open http://localhost:3000

6. All 7 widgets should appear on screen!
*/

// ============================================
// WIDGET WIDGET INITIALIZATION EXAMPLE
// ============================================
/*
Each widget automatically:
- Loads saved position from localStorage
- Loads saved size from localStorage
- Loads persisted data (notes, tasks, etc.)
- Initializes dragging and resizing
- Connects to AI service
- Sets up event listeners

No additional setup needed!
*/

// ============================================
// ADVANCED: PROGRAMMATIC WIDGET CONTROL
// ============================================
/*
// Show specific widget
const widget = document.querySelector('.news-widget');
widget.style.display = 'block';

// Move widget
const newsWidget = document.querySelector('.news-widget');
newsWidget.style.left = '100px';
newsWidget.style.top = '100px';

// Send command to widget
document.dispatchEvent(new CustomEvent('widget:command', {
  detail: 'Search for latest news'
}));

// Check AI service status
import { aiService } from './services/AIService';
console.log(aiService.getStatus());

// Check widget manager
import { widgetManager } from './services/WidgetManager';
console.log(widgetManager.widgets);

// Clear AI cache
aiService.clearCache();
*/

// ============================================
// DEBUGGING TIPS
// ============================================
/*
1. Open browser console (F12)

2. Check for errors:
   - API key issues
   - localStorage errors
   - Network errors

3. Test localStorage:
   localStorage.setItem('test', 'value');
   console.log(localStorage.getItem('test'));

4. View all widget data:
   Object.keys(localStorage)
     .filter(k => k.startsWith('widget-'))
     .forEach(k => console.log(k, localStorage.getItem(k)));

5. Test AI service:
   import { aiService } from './services/AIService';
   console.log(aiService.getStatus());

6. Test widget manager:
   import { widgetManager } from './services/WidgetManager';
   console.log(widgetManager.widgets);
*/
