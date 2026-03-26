import React, { useState, useEffect, useRef } from 'react';
import './SearchWidget.css';

const SearchWidget = ({ onClose, isVisible = true, initialQuery }) => {
  const [result, setResult] = useState('Ready to search...');
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'history'
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  // Custom Drag & Resize State
  const [widgetPos, setWidgetPos] = useState({ x: 100, y: 100 });
  const [widgetSize, setWidgetSize] = useState({ width: 550, height: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const widgetRef = useRef(null);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Initialize position and load history
  useEffect(() => {
    const startX = (window.innerWidth / 2) - 275;
    const startY = window.innerHeight * 0.12;
    setWidgetPos({ x: startX, y: startY });

    const savedHistory = localStorage.getItem('astra_search_history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading search history:', e);
      }
    }
  }, []);

  // Apply dynamic text scaling based on widget size
  const applyDynamicScaling = () => {
    if (!widgetRef.current) return;

    const baseWidth = 550;
    const baseHeight = 400;
    const scaleX = widgetSize.width / baseWidth;
    const scaleY = widgetSize.height / baseHeight;
    const avgScale = (scaleX + scaleY) / 2;

    // Different scaling strategies for different content types
    const dampedScale = Math.pow(avgScale, 0.6);
    const textScale = Math.pow(avgScale, 0.7);
    const elementScale = Math.pow(avgScale, 0.8);

    // Clamp scales to reasonable bounds
    const clampedScale = Math.max(0.5, Math.min(2.5, dampedScale));
    const clampedTextScale = Math.max(0.6, Math.min(2.0, textScale));
    const clampedElementScale = Math.max(0.7, Math.min(2.2, elementScale));

    // Apply CSS variables for dynamic scaling
    widgetRef.current.style.setProperty('--text-scale', clampedTextScale);
    widgetRef.current.style.setProperty('--element-scale', clampedElementScale);
    widgetRef.current.style.setProperty('--base-scale', clampedScale);
  };

  // Apply scaling whenever size changes
  useEffect(() => {
    applyDynamicScaling();
  }, [widgetSize]);

  // Handle incoming search results from AI
  useEffect(() => {
    if (initialQuery) {
      const content = typeof initialQuery === 'object' ? initialQuery.content : initialQuery;
      handleNewSearch(content);
    }
  }, [initialQuery]);

  const handleNewSearch = async (content) => {
    if (!content) return;
    setIsLoading(true);
    setActiveTab('current');

    let cleanContent = content;
    if (typeof content === 'string') {
      cleanContent = content.replace(/^SEARCH_RESULT:\s*/, '').replace(/^SEARCH RESULT\s*/, '').trim();
    }

    setResult(cleanContent);
    setIsLoading(false);

    const historyItem = {
      id: Date.now(),
      query: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
      result: cleanContent,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString()
    };

    const updatedHistory = [historyItem, ...searchHistory].slice(0, 50);
    setSearchHistory(updatedHistory);
    localStorage.setItem('astra_search_history', JSON.stringify(updatedHistory));

    if (widgetRef.current) {
      widgetRef.current.classList.add('new-result-glow');
      setTimeout(() => {
        if (widgetRef.current) widgetRef.current.classList.remove('new-result-glow');
      }, 3000);
    }
  };

  // Drag handles
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      setWidgetPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, dragOffset]);

  // Resize handles
  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e) => {
      setWidgetSize({
        width: Math.max(300, resizeStartRef.current.width + (e.clientX - resizeStartRef.current.x)),
        height: Math.max(200, resizeStartRef.current.height + (e.clientY - resizeStartRef.current.y))
      });
    };
    const onUp = () => setIsResizing(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isResizing]);

  const handleDragStart = (e) => {
    if (e.target.closest('.widget-controls') ||
      e.target.closest('.resize-handle') ||
      e.target.closest('.search-nav-tab') ||
      e.target.closest('.copy-button') ||
      e.target.tagName === 'BUTTON' ||
      e.target.tagName === 'A') {
      return;
    }

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - widgetPos.x,
      y: e.clientY - widgetPos.y
    });
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: widgetSize.width,
      height: widgetSize.height
    };
  };

  const increaseWidgetSize = () => {
    setWidgetSize(prev => ({
      width: prev.width + 100,
      height: prev.height + 100
    }));
  };

  const decreaseWidgetSize = () => {
    setWidgetSize(prev => ({
      width: Math.max(300, prev.width - 100),
      height: Math.max(200, prev.height - 100)
    }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
  };

  const viewHistoryItem = (item) => {
    setResult(item.result);
    setActiveTab('current');
  };

  if (!isVisible) return null;

  return (
    <div
      ref={widgetRef}
      className={`search-widget ${isDragging ? 'widget-dragging' : ''} ${isResizing ? 'widget-resizing' : ''}`}
      style={{
        left: `${widgetPos.x}px`,
        top: `${widgetPos.y}px`,
        width: `${widgetSize.width}px`,
        height: `${widgetSize.height}px`,
      }}
      onMouseDown={handleDragStart}
    >
      <div className="corner-top-right"></div>
      <div className="corner-bottom-left"></div>

      <div className="resize-handle" onMouseDown={handleResizeStart}></div>

      <div className="widget-controls" onMouseDown={(e) => e.stopPropagation()}>
        <div className="widget-control-btn expand-btn" onClick={increaseWidgetSize} title="Make Bigger">⧨</div>
        <div className="widget-control-btn compress-btn" onClick={decreaseWidgetSize} title="Make Smaller">⧩</div>
        <div className="widget-control-btn close-btn" onClick={(e) => { e.stopPropagation(); onClose(); }} title="Close">⧬</div>
      </div>

      <div className="search-wrapper">
        <div className="search-label">
          SEARCH
        </div>

        <div className="search-nav">
          <div
            className={`search-nav-tab ${activeTab === 'current' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setActiveTab('current'); }}
          >
            Current
          </div>
          <div
            className={`search-nav-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setActiveTab('history'); }}
          >
            History
          </div>
        </div>

        <div className="search-content-wrapper">
          {activeTab === 'current' ? (
            <>
              <div className={`search-current-view ${isLoading ? 'hidden' : ''}`}>
                <div className="search-content">{result}</div>
              </div>
              {isLoading && (
                <div className="search-loading">
                  <div className="loading-spinner"></div>
                  Searching AI Database...
                </div>
              )}
              {!isLoading && (
                <div className="copy-button" onClick={(e) => { e.stopPropagation(); copyToClipboard(); }} title="Copy results">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 1H4C2.9 1 2 1.9 2 3V15H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor" />
                  </svg>
                </div>
              )}
            </>
          ) : (
            <div className="search-history-view">
              {searchHistory.length === 0 ? (
                <div className="search-placeholder">No search history recorded in this session.</div>
              ) : (
                <div className="search-history-list">
                  {searchHistory.map(item => (
                    <div key={item.id} className="search-history-item" onClick={(e) => { e.stopPropagation(); viewHistoryItem(item); }}>
                      <div className="search-history-query">{item.query}</div>
                      <div className="search-history-date">{item.date}</div>
                      <div className="search-history-preview">{item.result.substring(0, 100)}...</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchWidget;
