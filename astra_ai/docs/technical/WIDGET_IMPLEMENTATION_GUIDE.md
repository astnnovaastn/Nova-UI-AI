# Widget Implementation Guide - Astra AI React UI

Complete guide for implementing functionality into all 11 widgets.

## Status Summary

| Widget | Status | Functionality | Effort |
|--------|--------|---------------|--------|
| NOVA Core | ✅ Complete | Voice-reactive animations | Done |
| Chat | 🟡 Partial | Messages, UI layout ready | Low (needs API) |
| Notepad | ✅ Complete | Full CRUD operations | Done |
| Search | 🔴 Planned | Search functionality | Medium |
| News | 🔴 Planned | News feed | Medium |
| TicTacToe | 🔴 Planned | Game AI logic | High |
| Camera | 🔴 Planned | Webcam feed | Medium |
| Calculator | 🔴 Planned | Math operations | Medium |
| ObjectID | 🔴 Planned | Image recognition | High |
| Task | 🔴 Planned | Todo management | Medium |
| AIEye | 🔴 Planned | Vision analysis | High |

---

## 1. Chat Widget Enhancement

### Current State
- ✅ UI fully built
- ✅ Message display working
- ✅ Input and send button
- ❌ AI responses need API

### Implementation Steps

**Step 1: Create Chat Service**
```javascript
// src/services/chatService.js
import axios from 'axios';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export const sendChatMessage = async (message) => {
  try {
    const response = await axios.post(`${API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: message
        }]
      }]
    });
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Chat API Error:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
};
```

**Step 2: Update ModernChat Component**
```jsx
// src/components/Chat/ModernChat.jsx - Key changes

import { sendChatMessage } from '../../services/chatService';

const handleSendMessage = async (e) => {
  // ... existing code ...
  
  // Get AI response
  const aiResponse = await sendChatMessage(newMessage.text);
  setMessages(prev => [...prev, {
    id: Date.now() + 1,
    text: aiResponse,
    sender: 'nova',
    timestamp: new Date().toLocaleTimeString()
  }]);
  setTyping(false);
};
```

**Step 3: Add .env Configuration**
```env
REACT_APP_GEMINI_API_KEY=your_actual_api_key_here
REACT_APP_NOVA_API_URL=http://localhost:5000
```

**Testing:**
- Send a message in chat
- Observe AI response appears after typing indicator
- Verify messages scroll automatically

---

## 2. Search Widget Implementation

### Features to Add
1. Real-time search input
2. Search history
3. Result display with icons
4. Search filters

### Implementation

**File: src/components/Search/SearchWidget.jsx**
```jsx
import React, { useState, useEffect } from 'react';
import './SearchWidget.css';
import axios from 'axios';

const SearchWidget = ({ onClose }) => {
  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      // Use DuckDuckGo or similar API
      const response = await axios.get(
        `https://api.duckduckgo.com/?q=${query}&format=json`
      );
      setResults(response.data.RelatedTopics || []);
      setSearchHistory([...new Set([query, ...searchHistory]).slice(0, 5)]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-widget">
      {/* ... widget UI ... */}
    </div>
  );
};

export default SearchWidget;
```

---

## 3. News Widget Implementation

### Features to Add
1. News feed from API
2. Category filtering
3. Article preview
4. External link support

### Implementation

**File: src/components/News/NewsWidget.jsx**
```jsx
import React, { useState, useEffect } from 'react';
import './NewsWidget.css';
import axios from 'axios';

const NewsWidget = ({ onClose }) => {
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState('technology');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNews();
  }, [category]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      // Using NewsAPI.org (requires API key)
      const response = await axios.get(
        `https://newsapi.org/v2/top-headlines?category=${category}&apiKey=${process.env.REACT_APP_NEWS_API_KEY}`
      );
      setArticles(response.data.articles.slice(0, 5));
    } catch (error) {
      console.error('News fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="news-widget">
      {/* Category tabs */}
      <div className="news-categories">
        {['technology', 'business', 'science'].map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={category === cat ? 'active' : ''}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles list */}
      <div className="news-list">
        {articles.map(article => (
          <div key={article.url} className="news-item">
            <h4>{article.title}</h4>
            <p>{article.description}</p>
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              Read More →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsWidget;
```

---

## 4. TicTacToe Widget Implementation

### Features to Add
1. Game board (3x3 grid)
2. AI opponent with difficulty levels
3. Win/loss detection
4. Game statistics

### Implementation

**File: src/components/TicTacToe/TicTacToeWidget.jsx**
```jsx
import React, { useState, useEffect } from 'react';
import './TicTacToeWidget.css';

const TicTacToeWidget = ({ onClose }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [difficulty, setDifficulty] = useState('medium');
  const [gameStats, setGameStats] = useState({ wins: 0, losses: 0, draws: 0 });

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const getAIMove = (squares) => {
    if (difficulty === 'easy') {
      return getRandomMove(squares);
    } else if (difficulty === 'medium') {
      // 50/50 between random and smart
      return Math.random() > 0.5 ? getMinimax(squares) : getRandomMove(squares);
    } else {
      return getMinimax(squares);
    }
  };

  const getRandomMove = (squares) => {
    const empty = squares
      .map((sq, idx) => sq === null ? idx : null)
      .filter(idx => idx !== null);
    return empty[Math.floor(Math.random() * empty.length)];
  };

  const getMinimax = (squares) => {
    // Minimax algorithm for optimal AI play
    let bestScore = -Infinity;
    let bestMove = 0;
    
    for (let i = 0; i < 9; i++) {
      if (squares[i] === null) {
        squares[i] = 'O';
        let score = minimax(squares, 0, false);
        squares[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  };

  const minimax = (squares, depth, isMax) => {
    const winner = calculateWinner(squares);
    if (winner === 'X') return -10 + depth;
    if (winner === 'O') return 10 - depth;
    if (!squares.includes(null)) return 0;

    if (isMax) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = 'O';
          let score = minimax(squares, depth + 1, false);
          squares[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = 'X';
          let score = minimax(squares, depth + 1, true);
          squares[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const handleClick = (index) => {
    if (board[index] || calculateWinner(board)) return;
    
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    
    setTimeout(() => {
      const aiMove = getAIMove(newBoard);
      newBoard[aiMove] = 'O';
      setBoard(newBoard);
    }, 500);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const winner = calculateWinner(board);
  const isBoardFull = !board.includes(null);

  return (
    <div className="tictactoe-widget">
      <div className="tictactoe-header">
        <h2>Tic Tac Toe</h2>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div className="game-stats">
        <div>Wins: {gameStats.wins}</div>
        <div>Losses: {gameStats.losses}</div>
        <div>Draws: {gameStats.draws}</div>
      </div>

      <div className="game-board">
        {board.map((value, index) => (
          <button
            key={index}
            className="board-cell"
            onClick={() => handleClick(index)}
          >
            {value}
          </button>
        ))}
      </div>

      {winner && <div className="game-result">Winner: {winner}</div>}
      {isBoardFull && !winner && <div className="game-result">Draw!</div>}

      <button className="reset-btn" onClick={resetGame}>New Game</button>
    </div>
  );
};

export default TicTacToeWidget;
```

---

## 5. Camera Widget Implementation

### Features to Add
1. Real-time camera feed
2. Image capture
3. AI analysis (using Gemini)
4. Filter effects

### Implementation

**File: src/components/Camera/CameraWidget.jsx**
```jsx
import React, { useRef, useState, useEffect } from 'react';
import './CameraWidget.css';

const CameraWidget = ({ onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [filter, setFilter] = useState('none');
  const [analysis, setAnalysis] = useState('');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setIsStreaming(true);
    } catch (error) {
      console.error('Camera access denied:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    applyFilter(ctx, canvas, filter);
    
    setCapturedImage(canvas.toDataURL());
    analyzeImage(canvas.toDataURL());
  };

  const applyFilter = (ctx, canvas, filterType) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    switch (filterType) {
      case 'grayscale':
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i+1] + data[i+2]) / 3;
          data[i] = data[i+1] = data[i+2] = avg;
        }
        break;
      case 'invert':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];
          data[i+1] = 255 - data[i+1];
          data[i+2] = 255 - data[i+2];
        }
        break;
      // Add more filters...
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const analyzeImage = async (imageData) => {
    try {
      // Send to Gemini for analysis
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`,
        {
          method: 'POST',
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: 'Analyze this image and describe what you see',
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageData.split(',')[1]
                }
              }]
            }]
          })
        }
      );
      const result = await response.json();
      setAnalysis(result.candidates[0].content.parts[0].text);
    } catch (error) {
      console.error('Analysis error:', error);
    }
  };

  return (
    <div className="camera-widget">
      <div className="camera-header">
        <h2>Camera</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="none">No Filter</option>
          <option value="grayscale">Grayscale</option>
          <option value="invert">Invert</option>
        </select>
      </div>

      <video ref={videoRef} autoPlay playsInline className="camera-feed" />
      <canvas ref={canvasRef} width={320} height={240} style={{ display: 'none' }} />

      <div className="camera-controls">
        <button onClick={captureImage} className="capture-btn">
          <i className="fas fa-camera"></i> Capture
        </button>
      </div>

      {capturedImage && <img src={capturedImage} alt="Captured" className="captured-image" />}
      {analysis && <div className="analysis-result">{analysis}</div>}
    </div>
  );
};

export default CameraWidget;
```

---

## 6. Calculator Widget Implementation

### Features to Add
1. Basic operations (+, -, *, /)
2. Scientific functions (sin, cos, tan, log, sqrt, etc.)
3. History and memory
4. Expression evaluation

### Implementation

**File: src/components/Calculator/CalculatorWidget.jsx**
```jsx
import React, { useState } from 'react';
import './CalculatorWidget.css';

const CalculatorWidget = ({ onClose }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const [mode, setMode] = useState('basic'); // basic or scientific
  const [angleMode, setAngleMode] = useState('deg'); // deg or rad

  const handleNumber = (num) => {
    if (waitingForNewValue) {
      setDisplay(String(num));
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const handleOperation = (op) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const result = calculate(previousValue, inputValue, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    }

    setOperation(op);
    setWaitingForNewValue(true);
  };

  const calculate = (prev, current, op) => {
    switch (op) {
      case '+': return prev + current;
      case '-': return prev - current;
      case '*': return prev * current;
      case '/': return prev / current;
      default: return current;
    }
  };

  const handleScientific = (func) => {
    let value = parseFloat(display);

    switch (func) {
      case 'sin':
        value = angleMode === 'deg' ? Math.sin(value * Math.PI / 180) : Math.sin(value);
        break;
      case 'cos':
        value = angleMode === 'deg' ? Math.cos(value * Math.PI / 180) : Math.cos(value);
        break;
      case 'tan':
        value = angleMode === 'deg' ? Math.tan(value * Math.PI / 180) : Math.tan(value);
        break;
      case 'sqrt':
        value = Math.sqrt(value);
        break;
      case 'pow':
        value = Math.pow(value, 2);
        break;
      case 'log':
        value = Math.log10(value);
        break;
      case 'ln':
        value = Math.log(value);
        break;
      case 'reciprocal':
        value = 1 / value;
        break;
    }

    setDisplay(String(value));
    setWaitingForNewValue(true);
  };

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const result = calculate(previousValue, parseFloat(display), operation);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  return (
    <div className="calculator-widget">
      <div className="calculator-header">
        <h2>Calculator</h2>
        <button onClick={() => setMode(mode === 'basic' ? 'scientific' : 'basic')}>
          {mode === 'basic' ? 'Scientific' : 'Basic'}
        </button>
      </div>

      <div className="calculator-display">{display}</div>

      {mode === 'scientific' && (
        <div className="angle-mode">
          <button onClick={() => setAngleMode('deg')} className={angleMode === 'deg' ? 'active' : ''}>
            DEG
          </button>
          <button onClick={() => setAngleMode('rad')} className={angleMode === 'rad' ? 'active' : ''}>
            RAD
          </button>
        </div>
      )}

      <div className="calculator-buttons">
        {/* Basic buttons */}
        {['7', '8', '9'].map(num => (
          <button key={num} onClick={() => handleNumber(parseInt(num))}>{num}</button>
        ))}
        <button onClick={() => handleOperation('/')}>/</button>

        {['4', '5', '6'].map(num => (
          <button key={num} onClick={() => handleNumber(parseInt(num))}>{num}</button>
        ))}
        <button onClick={() => handleOperation('*')}>*</button>

        {['1', '2', '3'].map(num => (
          <button key={num} onClick={() => handleNumber(parseInt(num))}>{num}</button>
        ))}
        <button onClick={() => handleOperation('-')}>-</button>

        <button onClick={() => handleNumber(0)} className="wide">0</button>
        <button onClick={() => setDisplay(display + '.')}>.</button>
        <button onClick={() => handleOperation('+')}>+</button>
        <button onClick={handleEquals} className="equals">=</button>

        {/* Scientific buttons */}
        {mode === 'scientific' && (
          <>
            {['sin', 'cos', 'tan', 'sqrt', 'pow', 'log', 'ln', 'reciprocal'].map(func => (
              <button key={func} onClick={() => handleScientific(func)}>{func}</button>
            ))}
          </>
        )}
      </div>

      <button onClick={handleClear} className="clear-btn">Clear</button>
    </div>
  );
};

export default CalculatorWidget;
```

---

## 7. Object Identification Widget

### Features to Add
1. Image upload or camera input
2. Object detection using Gemini Vision
3. Confidence scores
4. Category filtering

```jsx
// Similar to Camera Widget but with image upload
// Uses Gemini Vision API
// Displays detected objects with bounding boxes
```

---

## 8. Task Widget

### Features to Add
1. Add/Edit/Delete tasks
2. Priority levels
3. Due dates
4. Categories

```jsx
// Similar to Notepad Widget
// Add filtering by priority, date, category
// Local storage persistence
```

---

## 9. AI Eye Widget

### Features to Add
1. Real-time video analysis
2. Scene understanding
3. Activity detection
4. Custom analysis prompts

```jsx
// Combines Camera + ObjectIdentification features
// Continuous analysis of video stream
// Display analysis results in real-time
```

---

## API Keys Required

Create `.env` file with:
```env
REACT_APP_GEMINI_API_KEY=your_gemini_key
REACT_APP_NEWS_API_KEY=your_newsapi_key
REACT_APP_OPENWEATHER_KEY=your_weather_key
```

---

## Testing Checklist

### For Each Widget:
- [ ] Component renders without errors
- [ ] Styling displays correctly
- [ ] Animations are smooth
- [ ] No console warnings
- [ ] Responsive on different screen sizes
- [ ] Keyboard navigation works
- [ ] Mobile touch interactions work

---

## Performance Optimization Tips

1. **Lazy Load Components**
   ```jsx
   const TicTacToe = React.lazy(() => import('./TicTacToe/TicTacToeWidget'));
   ```

2. **Memoize Components**
   ```jsx
   export default React.memo(SearchWidget);
   ```

3. **Debounce Search Input**
4. **Cache API Responses**
5. **Optimize Images**

---

## Deployment

When ready:
```bash
npm run build
# Upload build/ folder to hosting
```

---

**Updated**: November 2024
**Status**: Active Development
