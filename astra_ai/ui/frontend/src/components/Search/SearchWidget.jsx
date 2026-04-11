import React, { useState, useEffect, useRef } from 'react';
import './SearchWidget.css';

const SearchWidget = ({ onClose, isVisible = true, initialQuery }) => {
  const [result, setResult] = useState('Ready to search...');
  const [currentQuery, setCurrentQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Custom Drag & Resize State
  const [widgetPos, setWidgetPos] = useState({ x: 100, y: 100 });
  const [widgetSize, setWidgetSize] = useState({ width: 550, height: 650 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const widgetRef = useRef(null);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Initialize position
  useEffect(() => {
    const startX = (window.innerWidth / 2) - 275;
    const startY = window.innerHeight * 0.12;
    setWidgetPos({ x: startX, y: startY });
  }, []);

  // Handle incoming search results from AI
  useEffect(() => {
    if (initialQuery) {
      const content = typeof initialQuery === 'object' ? initialQuery.content : initialQuery;
      const queryText = typeof initialQuery === 'object' ? initialQuery.queryText : null;
      handleNewSearch(content, queryText);
    }
  }, [initialQuery]);

  const handleNewSearch = async (content, providedQuery) => {
    if (!content) return;
    setIsLoading(true);

    let cleanContent = content;
    if (typeof content === 'string') {
      cleanContent = content.replace(/^SEARCH_RESULT:\s*/i, '').replace(/^SEARCH RESULT\s*/i, '').trim();
    }

    if (providedQuery) {
       setCurrentQuery(providedQuery);
    } else {
       let displayQuery = cleanContent.substring(0, 50).replace(/\n/g, ' ') + '...';
       setCurrentQuery(displayQuery);
    }
    
    setResult(cleanContent);
    setIsLoading(false);
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
        width: Math.max(350, resizeStartRef.current.width + (e.clientX - resizeStartRef.current.x)),
        height: Math.max(300, resizeStartRef.current.height + (e.clientY - resizeStartRef.current.y))
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
    if (e.target.closest('.search-header-actions') ||
      e.target.closest('.resize-handle') ||
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

  // Helper function to heuristically parse raw AI search text into structured results
  const parseResults = (text) => {
    if (!text || text === 'Ready to search...') return [];

    const chunks = text.split(/\n\n+/).map(c => c.trim()).filter(Boolean);

    return chunks.map((chunk, idx) => {
      let title = `Search Result ${idx + 1}`;
      let snippet = chunk;
      let source = "Web Source";
      
      const mdLinkMatch = chunk.match(/\[([^\]]+)\]\(([^)]+)\)/);
      const boldMatch = chunk.match(/\*\*([^*]+)\*\*/);
      
      if (mdLinkMatch) {
         title = mdLinkMatch[1].replace(/\*\*/g, '');
         source = mdLinkMatch[2].replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
         snippet = chunk.replace(mdLinkMatch[0], '').trim();
      } else if (boldMatch) {
         title = boldMatch[1];
         snippet = chunk.replace(boldMatch[0], '').trim();
      } else {
         const lines = chunk.split('\n');
         if (lines.length > 1) {
           title = lines[0].replace(/^[0-9-.*]+\s*/, '');
           snippet = lines.slice(1).join(' ').trim();
         } else {
           snippet = chunk.replace(/^[0-9-.*]+\s*/, '');
         }
      }

      snippet = snippet.replace(/^[-\s]+/, '');

      const colors = ['#e11d48', '#dc2626', '#ea580c', '#2563eb', '#16a34a', '#8b5cf6'];
      const iconBg = colors[idx % colors.length];
      const iconLetter = title.charAt(0).toUpperCase();

      return {
        id: idx,
        title: title.substring(0, 80),
        snippet: snippet.substring(0, 200) + (snippet.length > 200 ? '...' : ''),
        source: source.substring(0, 30),
        iconBg,
        iconLetter
      };
    });
  };

  if (!isVisible) return null;

  const parsedItems = parseResults(result);
  const isDefaultState = !result || result === 'Ready to search...';

  const renderContent = () => {
    if (isLoading) {
      return <div className="search-loading">Searching web...</div>;
    }
    
    if (isDefaultState) {
      return (
        <div className="search-placeholder">
           Waiting for search results... Ask Nova AI to search!
        </div>
      );
    }

    if (parsedItems.length === 1 && parsedItems[0].snippet.length > 250 && parsedItems[0].title === 'Search Result 1') {
       return <div className="search-content">{result}</div>;
    }

    return (
      <>
        {parsedItems.map(item => (
          <div key={item.id} className="mock-result">
            <div className="mock-result-title">{item.title}</div>
            <div className="mock-result-snippet">{item.snippet}</div>
            <div className="mock-result-source">
              <div className="mock-source-icon" style={{background: item.iconBg}}>{item.iconLetter}</div>
              <span>{item.source}</span>
            </div>
          </div>
        ))}
      </>
    );
  };

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
    >
      <div className="search-header" onMouseDown={handleDragStart}>
        <div className="search-header-title">Sources</div>
        <div className="search-header-actions">
          <button className="close-btn" onClick={(e) => { e.stopPropagation(); onClose(); }} title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div className="search-content-wrapper">
        <div className="search-query-bar">
          <div className="query-top">
            <div className="query-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Searched web
            </div>
            <div className="query-count">{parsedItems.length}</div>
          </div>
          <div className="query-text">
            {currentQuery || 'Awaiting Search Query...'}
          </div>
        </div>

        <div className="search-results-list">
          {renderContent()}
        </div>
      </div>

      <div className="resize-handle" onMouseDown={handleResizeStart}></div>
    </div>
  );
};

export default SearchWidget;
