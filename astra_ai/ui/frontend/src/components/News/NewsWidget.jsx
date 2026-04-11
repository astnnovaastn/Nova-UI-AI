import React, { useState, useEffect, useRef } from 'react';
import './NewsWidget.css';

const NewsWidget = ({ onClose, isVisible = true, initialNews }) => {
  const [newsArticles, setNewsArticles] = useState([]);
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'history'
  const [isLoading, setIsLoading] = useState(false);
  const [newsHistory, setNewsHistory] = useState([]);
  const [newsCount, setNewsCount] = useState(0);
  const [italyTime, setItalyTime] = useState('--:--:--');

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
    // 12vh from top, positioned on the right side
    setWidgetPos({ 
      x: window.innerWidth - 400, 
      y: window.innerHeight * 0.12 
    });

    const savedHistory = localStorage.getItem('astra_news_history');
    if (savedHistory) {
      try {
        setNewsHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading news history:', e);
      }
    }
  }, []);

  // Update Italy time every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      // Create a date object with Italy's timezone
      const italyTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Rome"}));
      const timeString = italyTime.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setItalyTime(timeString);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle incoming news from AI
  useEffect(() => {
    if (initialNews) {
      const content = typeof initialNews === 'object' ? initialNews.content : initialNews;
      handleNewNews(content);
    }
  }, [initialNews]);

  const handleNewNews = async (content) => {
    if (!content) return;
    setIsLoading(true);
    setActiveTab('current');

    try {
      // Parse the news content
      let articles = [];
      
      // Check if the text contains structured news data
      if (content.includes('HEADLINE:') || content.includes('SOURCE:')) {
        articles = parseStructuredNews(content);
      } else {
        // Handle plain text news
        const headline = extractHeadlineFromText(content);
        const source = extractSourceFromText(content) || "News Feed";

        articles = [{
          headline: headline,
          summary: content, // FULL CONTENT - NO SUMMARIZATION
          source: source
        }];
      }

      setNewsArticles(articles);
      setNewsCount(articles.length);
      
      // Add to history
      const historyItem = {
        id: Date.now(),
        query: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
        result: content,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleString()
      };

      const updatedHistory = [historyItem, ...newsHistory].slice(0, 50);
      setNewsHistory(updatedHistory);
      localStorage.setItem('astra_news_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error processing news:', error);
      // Fallback to simple text display
      setNewsArticles([{
        headline: "News Update",
        summary: content,
        source: "News Feed"
      }]);
    } finally {
      setIsLoading(false);

      // Animation trigger
      if (widgetRef.current) {
        widgetRef.current.style.animation = 'none';
        setTimeout(() => {
          if (widgetRef.current) widgetRef.current.style.animation = 'newsGlow 3s ease-in-out infinite';
        }, 10);
      }
    }
  };

  const parseStructuredNews = (newsText) => {
    const articles = [];
    const sections = newsText.split(/(?=HEADLINE:|SOURCE:)/);

    let currentArticle = {};

    for (const section of sections) {
      if (section.includes('HEADLINE:')) {
        const lines = section.split('\n');
        for (const line of lines) {
          if (line.startsWith('HEADLINE:')) {
            currentArticle.headline = line.replace('HEADLINE:', '').trim();
          } else if (line.startsWith('SOURCE:')) {
            currentArticle.source = line.replace('SOURCE:', '').trim();
          } else if (line.startsWith('TIME:')) {
            currentArticle.time = line.replace('TIME:', '').trim();
          } else if (line.trim() && !line.startsWith('HEADLINE:') && !line.startsWith('SOURCE:') && !line.startsWith('TIME:')) {
            if (!currentArticle.summary) currentArticle.summary = '';
            currentArticle.summary += line.trim() + ' ';
          }
        }

        if (currentArticle.headline) {
          articles.push({
            headline: currentArticle.headline,
            summary: currentArticle.summary?.trim() || '',
            source: currentArticle.source || 'Unknown Source',
            time: currentArticle.time || 'Recently'
          });
          currentArticle = {};
        }
      }
    }

    return articles.length > 0 ? articles : [{
      headline: "News Update",
      summary: newsText,
      source: "News Feed",
      time: "Just now"
    }];
  };

  const extractHeadlineFromText = (text) => {
    // Extract a reasonable headline from the first sentence
    const firstSentence = text.split(/[.!?]/)[0].trim();

    // If first sentence is too long, truncate it
    if (firstSentence.length > 80) {
      const words = firstSentence.split(' ');
      if (words.length > 10) {
        return words.slice(0, 10).join(' ') + '...';
      }
      return firstSentence.substring(0, 80) + '...';
    }

    // If first sentence is too short, try to get more context
    if (firstSentence.length < 20) {
      const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
      if (sentences.length > 1) {
        const combined = sentences.slice(0, 2).join('. ').trim();
        return combined.length > 80 ? combined.substring(0, 80) + '...' : combined;
      }
    }

    return firstSentence || 'News Update';
  };

  const extractSourceFromText = (text) => {
    // Try to extract source from common patterns
    const sourcePatterns = [
      /(?:according to|reported by|from|source:|via)\s+([A-Za-z\s]+)/i,
      /\b([A-Z][a-z]+\s+News|[A-Z][a-z]+\s+Times|BBC|CNN|Reuters|AP|Reuters)\b/i
    ];

    for (const pattern of sourcePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null; // Return null if no source found, will use default
  };

  // Drag handles
  useEffect(() => {
    if (!isDragging) return;

    // Add class to body to indicate dragging state
    document.body.classList.add('widget-is-dragging');

    const onMove = (e) => {
      setWidgetPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };
    const onUp = () => {
      setIsDragging(false);
      document.body.classList.remove('widget-is-dragging');
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.classList.remove('widget-is-dragging');
    };
  }, [isDragging, dragOffset]);

  // Resize handles
  useEffect(() => {
    if (!isResizing) return;

    // Add class to body to indicate resizing state
    document.body.classList.add('widget-is-resizing');

    const onMove = (e) => {
      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;
      setWidgetSize({
        width: Math.max(300, resizeStartRef.current.width + deltaX),
        height: Math.max(200, resizeStartRef.current.height + deltaY)
      });
    };
    const onUp = () => {
      setIsResizing(false);
      document.body.classList.remove('widget-is-resizing');
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.classList.remove('widget-is-resizing');
    };
  }, [isResizing]);

  const handleDragStart = (e) => {
    // Only prevent dragging if clicking directly on control elements
    if (e.target.closest('.widget-controls') ||
      e.target.closest('.resize-handle') ||
      e.target.tagName === 'BUTTON' ||
      e.target.tagName === 'A') {
      return;
    }

    // Allow dragging from anywhere else in the widget
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - widgetPos.x,
      y: e.clientY - widgetPos.y
    });
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: widgetSize.width,
      height: widgetSize.height
    };
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const viewHistoryItem = (item) => {
    handleNewNews(item.result);
    setActiveTab('current');
  };

  const handleMakeBigger = (e) => {
    e.stopPropagation();
    setWidgetSize(prev => ({
      width: prev.width * 1.1,
      height: prev.height * 1.1
    }));
  };

  const handleMakeSmaller = (e) => {
    e.stopPropagation();
    setWidgetSize(prev => ({
      width: Math.max(300, prev.width * 0.9),
      height: Math.max(200, prev.height * 0.9)
    }));
  };

  const formatNewsContent = (content) => {
    // Format the news content for display
    return content.split('\n\n').map((paragraph, index) =>
      paragraph.trim() ? `<p key="${index}">${paragraph.trim()}</p>` : ''
    ).join('');
  };

  return (
    <div
      className={`news-widget ${isDragging ? 'widget-dragging' : ''}`}
      ref={widgetRef}
      style={{
        left: `${widgetPos.x}px`,
        top: `${widgetPos.y}px`,
        width: `${widgetSize.width}px`,
        height: `${widgetSize.height}px`,
        position: 'fixed',
        display: isVisible ? 'flex' : 'none'
      }}
      onMouseDown={handleDragStart}
    >
      {/* Corner Brackets */}
      <div className="corner-top-right"></div>
      <div className="corner-bottom-left"></div>

      {/* Widget Controls - Hover controlled in CSS */}
      <div className="widget-controls">
        <button className="widget-control-btn" onClick={handleMakeBigger} title="Make Bigger">⧨</button>
        <button className="widget-control-btn" onClick={handleMakeSmaller} title="Make Smaller">⧩</button>
        <button className="widget-control-btn" onClick={(e) => { e.stopPropagation(); onClose(); }} title="Close">⧬</button>
      </div>

      <div className="resize-handle" onMouseDown={handleResizeStart}></div>

      {/* Header */}
      <div className="news-header">
        <div className="news-title">
          <div className="news-logo">N</div>
          <div className="news-brand">News Feed</div>
        </div>
        <div className="news-status">
          <div className="news-time-display">{italyTime}</div>
          <div className="status-indicator"></div>
          <span>Live</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="news-nav">
        <div
          className={`nav-tab ${activeTab === 'current' ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); setActiveTab('current'); }}
        >
          Current
        </div>
        <div
          className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); setActiveTab('history'); }}
        >
          History
        </div>
      </div>

      {/* Content Area */}
      <div className="news-content-wrapper">
        {activeTab === 'current' ? (
          <>
            {isLoading ? (
              <div className="news-loading" style={{ display: 'block', textAlign: 'center', padding: '20px' }}>
                <div className="loading-spinner"></div>
                <div>Fetching latest headlines...</div>
              </div>
            ) : (
              <div className="news-content-area">
                {newsArticles.length > 0 ? (
                  newsArticles.map((article, index) => (
                    <div key={index} className="news-item" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="news-meta">
                        <span className="news-category">{article.source}</span>
                        {article.time && <span className="news-time">{article.time}</span>}
                      </div>
                      <div className="news-headline">{article.headline}</div>
                      <div
                        className="news-summary"
                        dangerouslySetInnerHTML={{
                          __html: formatNewsContent(article.summary)
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div className="news-item">
                    <div className="news-meta">
                      <span className="news-category"> Ready News Feed</span>
                    </div>
                    <div className="news-headline">No news available</div>
                    <div className="news-summary">Stay tuned for the latest updates.</div>
                  </div>
                )}
              </div>
            )}

            {/* Copy button for current news */}
            {!isLoading && newsArticles.length > 0 && (
              <button
                className="copy-button"
                onClick={(e) => {
                  e.stopPropagation();
                  const textToCopy = newsArticles.map(a => `${a.headline}\n\nSource: ${a.source}\n\n${a.summary}`).join('\n\n---\n\n');
                  copyToClipboard(textToCopy);
                }}
                title="Copy news articles"
              >
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M16 1H4C2.9 1 2 1.9 2 3V15H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" />
                </svg>
              </button>
            )}
          </>
        ) : (
          <div className="news-history">
            {newsHistory.length === 0 ? (
              <div className="news-history-empty">No news history yet</div>
            ) : (
              newsHistory.map(item => (
                <div key={item.id} className="news-history-item" onClick={(e) => { e.stopPropagation(); viewHistoryItem(item); }}>
                  <div className="news-history-query">{item.query}</div>
                  <div className="news-history-date">{item.date}</div>
                  <div className="news-history-preview">{item.result.substring(0, 80)}...</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="news-footer">
        <div className="news-controls"></div>
        <div className="news-count">{newsCount} {newsCount === 1 ? 'story' : 'stories'}</div>
      </div>
    </div>
  );
};

export default NewsWidget;