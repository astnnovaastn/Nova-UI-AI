# WIDGET SYSTEM - QUICK SETUP GUIDE

## 🚀 QUICK START

### 1. Import All Widgets in Your App Component

```javascript
// In src/App.js or your main component
import React from 'react';
import './styles/WidgetsStyle.css'; // Import global styles

// Import all widgets
import NewsWidget from './components/NewsWidget/NewsWidget';
import NotepadWidget from './components/NotepadWidget/NotepadWidget';
import SearchWidget from './components/SearchWidget/SearchWidget';
import ObjectIdentificationWidget from './components/ObjectWidget/ObjectWidget';
import CalculatorWidget from './components/CalculatorWidget/CalculatorWidget';
import CameraWidget from './components/CameraWidget/CameraWidget';
import TaskWidget from './components/TaskWidget/TaskWidget';

// Import managers
import { widgetManager } from './services/WidgetManager';
import { aiService } from './services/AIService';

function App() {
  React.useEffect(() => {
    // Initialize widget manager
    widgetManager.registerWidget('news-widget', {});
    widgetManager.registerWidget('notepad-widget', {});
    widgetManager.registerWidget('search-widget', {});
    widgetManager.registerWidget('object-widget', {});
    widgetManager.registerWidget('calculator-widget', {});
    widgetManager.registerWidget('camera-widget', {});
    widgetManager.registerWidget('task-widget', {});
  }, []);

  return (
    <div className="app">
      <NovaCore /> {/* Your existing NovaCore component */}
      
      {/* Render all widgets */}
      <NewsWidget />
      <NotepadWidget />
      <SearchWidget />
      <ObjectIdentificationWidget />
      <CalculatorWidget />
      <CameraWidget />
      <TaskWidget />
    </div>
  );
}

export default App;
```

### 2. Setup Environment Variables

Create `.env` file in `astra_ai/ui/`:

```env
# Required for AI features
REACT_APP_GEMINI_API_KEY=your_key_here

# Optional for news widget
REACT_APP_NEWS_API_KEY=your_key_here

# Optional for weather widget
REACT_APP_OPENWEATHER_API_KEY=your_key_here
```

### 3. Install Any Missing Dependencies

```bash
cd astra_ai/ui
npm install framer-motion zustand axios
```

---

## 📦 FILE STRUCTURE

```
src/
├── components/
│   ├── NewsWidget/
│   │   └── NewsWidget.jsx
│   ├── NotepadWidget/
│   │   └── NotepadWidget.jsx
│   ├── SearchWidget/
│   │   └── SearchWidget.jsx
│   ├── ObjectWidget/
│   │   └── ObjectWidget.jsx
│   ├── CalculatorWidget/
│   │   └── CalculatorWidget.jsx
│   ├── CameraWidget/
│   │   └── CameraWidget.jsx
│   └── TaskWidget/
│       └── TaskWidget.jsx
├── hooks/
│   └── useWidgetHooks.js
├── services/
│   ├── AIService.js
│   └── WidgetManager.js
├── styles/
│   └── WidgetsStyle.css
└── App.js
```

---

## 🎯 WIDGET INITIALIZATION

Each widget automatically:
- Loads saved position and size from localStorage
- Initializes draggable and resizable functionality
- Loads persisted data (notes, tasks, history, etc.)
- Sets up AI integration

No additional configuration needed!

---

## 🔌 API KEY SETUP

### Gemini API (Required for AI features)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to `.env`: `REACT_APP_GEMINI_API_KEY=your_key`

### News API (Optional - for News Widget)
1. Go to [NewsAPI.org](https://newsapi.org/)
2. Sign up and get API key
3. Add to `.env`: `REACT_APP_NEWS_API_KEY=your_key`

### OpenWeather API (Optional - for Weather Widget)
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up and get API key
3. Add to `.env`: `REACT_APP_OPENWEATHER_API_KEY=your_key`

---

## 🎮 TESTING THE WIDGETS

### In Browser:
1. Start dev server: `npm start`
2. Open http://localhost:3000
3. Click on each widget to test:
   - ✅ Drag widget by header
   - ✅ Resize from bottom-right corner
   - ✅ Interact with widget functions
   - ✅ Refresh page - data should persist

### Test Each Widget:

**News Widget:**
- [ ] Search news
- [ ] Click "Analyze Trends"
- [ ] View search history

**Notepad Widget:**
- [ ] Add note
- [ ] Edit note
- [ ] Delete note
- [ ] Export notes
- [ ] Import notes
- [ ] Summarize notes

**Search Widget:**
- [ ] Search query
- [ ] Extract content from result
- [ ] View search history
- [ ] Analyze trends

**Calculator Widget:**
- [ ] Basic math (2+3=5)
- [ ] Scientific functions (sin, cos, sqrt)
- [ ] Natural language math ("What is 50% of 200?")
- [ ] Degree/Radian toggle

**Object Widget:**
- [ ] Upload image
- [ ] Get quick identification
- [ ] Get detailed analysis
- [ ] View identification history

**Camera Widget:**
- [ ] Start camera
- [ ] Capture photo
- [ ] Apply filters
- [ ] Analyze with AI

**Task Widget:**
- [ ] Add task
- [ ] Mark complete
- [ ] Delete task
- [ ] Filter by status

---

## 🛠️ COMMON ISSUES & SOLUTIONS

### Issue: "Gemini API key not configured"
**Solution:** Add `REACT_APP_GEMINI_API_KEY` to `.env` file

### Issue: Widgets don't persist data
**Solution:** Check localStorage is enabled in browser
```javascript
// Test in console:
localStorage.setItem('test', 'value');
localStorage.getItem('test'); // Should return 'value'
```

### Issue: Camera not working
**Solution:** Allow camera access in browser permissions
```javascript
// Check in console:
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => console.log('Camera available'))
  .catch(err => console.log('Camera error:', err));
```

### Issue: Dragging doesn't work
**Solution:** Make sure you have the `widget-header` class on draggable area

### Issue: AI responses very slow
**Solution:** Check rate limiting
```javascript
// View AI service status:
import { aiService } from './services/AIService';
console.log(aiService.getStatus());
// May show queue is backed up
```

---

## 📊 MONITORING & DEBUGGING

### Check Widget Manager Status:
```javascript
import { widgetManager } from './services/WidgetManager';
console.log(widgetManager.widgets); // All registered widgets
```

### Check AI Service Status:
```javascript
import { aiService } from './services/AIService';
console.log(aiService.getStatus());
// Output: { queueSize, isProcessing, cacheSize, hasApiKey }
```

### Monitor Storage:
```javascript
// View all widget data in localStorage:
Object.keys(localStorage)
  .filter(k => k.startsWith('widget-'))
  .forEach(k => console.log(k, localStorage.getItem(k)));
```

---

## 🎨 CUSTOMIZATION

### Change Widget Colors:
Edit `src/styles/WidgetsStyle.css` and update color variables:
```css
/* For each widget, change the primary color */
.news-widget { border-color: #your-color; }
.notepad-widget { border-color: #your-color; }
/* etc */
```

### Resize Widget Bounds:
Edit `useWidgetResizable` in `src/hooks/useWidgetHooks.js`:
```javascript
const MIN_WIDTH = 250;   // Change this
const MAX_WIDTH = 800;   // Change this
const MIN_HEIGHT = 200;  // Change this
const MAX_HEIGHT = 900;  // Change this
```

### Change Rate Limiting:
Edit `src/services/AIService.js`:
```javascript
this.rateLimitDelay = 100; // milliseconds between API calls
```

### Change Cache Duration:
Edit `src/services/AIService.js`:
```javascript
this.cacheMaxAge = 3600000; // milliseconds (default 1 hour)
```

---

## 🚀 DEPLOYMENT

### Build for Production:
```bash
cd astra_ai/ui
npm run build
```

### Deploy to Vercel:
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify:
```bash
npm run build
# Drag build/ folder to Netlify
```

---

## 📱 MOBILE SUPPORT

All widgets are responsive and work on mobile:
- Widgets scale to full screen on mobile
- Touch-friendly buttons
- Optimized for portrait orientation

---

## 🔄 UPDATING WIDGETS

To update a widget:
1. Edit component file: `src/components/[Widget]/[Widget].jsx`
2. Changes auto-reload with hot module replacement
3. No data loss - localStorage persists

---

## 🎓 EXTENDING WIDGETS

### Add New Widget Feature:
1. Add state to component
2. Add event handler
3. (Optional) Add AI integration using `useWidgetAI` hook
4. (Optional) Add to WidgetManager for voice commands

### Add Voice Command:
Edit `src/services/WidgetManager.js` - `parseCommand()` method:
```javascript
if (lower.includes('your-keyword')) {
  return { 
    type: 'widget', 
    target: 'widget-id', 
    action: 'your-action',
    data: command 
  };
}
```

---

## ✅ VERIFICATION CHECKLIST

- [ ] All widget files created in `src/components/`
- [ ] Hook file created: `src/hooks/useWidgetHooks.js`
- [ ] Services created: `src/services/AIService.js`, `WidgetManager.js`
- [ ] CSS file created: `src/styles/WidgetsStyle.css`
- [ ] `.env` file created with API keys
- [ ] `npm install` completed
- [ ] `npm start` runs without errors
- [ ] Widgets appear in browser
- [ ] Dragging works
- [ ] Resizing works
- [ ] Data persists after refresh
- [ ] AI responses work (with API key)

---

## 📞 SUPPORT

If you encounter issues:
1. Check console for errors (`F12` → Console tab)
2. Check `.env` file for API keys
3. Review the COMPLETE_WIDGET_SYSTEM.md documentation
4. Check localStorage: `Application → Local Storage`
5. Clear cache if needed: `Ctrl+Shift+Delete`

---

## 🎉 YOU'RE ALL SET!

All 11 widgets from splash_screen.html are now:
- ✅ Fully functional in React
- ✅ Draggable and resizable
- ✅ Data persisted to localStorage
- ✅ AI integrated with Gemini
- ✅ Ready to use!

Happy coding! 🚀
