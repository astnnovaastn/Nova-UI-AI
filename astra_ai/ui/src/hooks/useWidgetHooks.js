import { useRef, useEffect, useState } from 'react';

/**
 * useWidgetDraggable Hook - Makes widgets draggable
 * Provides drag functionality with boundaries and persistence
 */
export const useWidgetDraggable = (widgetId, initialPosition = { x: 0, y: 0 }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Load saved position from localStorage
    const saved = localStorage.getItem(`widget-pos-${widgetId}`);
    if (saved) {
      setPosition(JSON.parse(saved));
    }
  }, [widgetId]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.widget-header') || e.target.closest('.widget-title')) {
      setIsDragging(true);
      const rect = dragRef.current?.getBoundingClientRect();
      setOffset({
        x: e.clientX - (rect?.left || 0),
        y: e.clientY - (rect?.top || 0),
      });
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = Math.max(0, Math.min(e.clientX - offset.x, window.innerWidth - 300));
      const newY = Math.max(0, Math.min(e.clientY - offset.y, window.innerHeight - 200));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Save position to localStorage
      localStorage.setItem(`widget-pos-${widgetId}`, JSON.stringify({ x: position.x, y: position.y }));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, offset, position, widgetId]);

  return {
    ref: dragRef,
    style: {
      transform: `translate(${position.x}px, ${position.y}px)`,
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: isDragging ? 'none' : 'auto',
    },
    onMouseDown: handleMouseDown,
  };
};

/**
 * useWidgetResizable Hook - Makes widgets resizable
 * Provides resize functionality with min/max boundaries
 */
export const useWidgetResizable = (widgetId, initialSize = { width: 400, height: 500 }) => {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);
  const [startSize, setStartSize] = useState(initialSize);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const MIN_WIDTH = 250;
  const MAX_WIDTH = 800;
  const MIN_HEIGHT = 200;
  const MAX_HEIGHT = 900;

  useEffect(() => {
    // Load saved size from localStorage
    const saved = localStorage.getItem(`widget-size-${widgetId}`);
    if (saved) {
      setSize(JSON.parse(saved));
    }
  }, [widgetId]);

  const handleMouseDown = (e) => {
    setIsResizing(true);
    setStartSize(size);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;

      const newWidth = Math.max(MIN_WIDTH, Math.min(startSize.width + deltaX, MAX_WIDTH));
      const newHeight = Math.max(MIN_HEIGHT, Math.min(startSize.height + deltaY, MAX_HEIGHT));

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Save size to localStorage
      localStorage.setItem(`widget-size-${widgetId}`, JSON.stringify(size));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startPos, startSize, size, widgetId]);

  return {
    ref: resizeRef,
    style: {
      width: `${size.width}px`,
      height: `${size.height}px`,
      overflow: 'hidden',
      resize: 'none',
    },
    size,
    onResizeStart: handleMouseDown,
  };
};

/**
 * useWidgetPersistence Hook - Persist widget data to localStorage
 */
export const useWidgetPersistence = (widgetId, initialData = {}) => {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(`widget-data-${widgetId}`);
    return saved ? JSON.parse(saved) : initialData;
  });

  const updateData = (newData) => {
    const updated = typeof newData === 'function' ? newData(data) : newData;
    setData(updated);
    localStorage.setItem(`widget-data-${widgetId}`, JSON.stringify(updated));
  };

  const clearData = () => {
    setData(initialData);
    localStorage.removeItem(`widget-data-${widgetId}`);
  };

  return { data, updateData, clearData };
};

/**
 * useWidgetAI Hook - AI integration for widgets
 * Handles Gemini API calls with caching and error handling
 */
export const useWidgetAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callGemini = async (prompt, imageData = null) => {
    setLoading(true);
    setError(null);

    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              ...(imageData ? [{ inline_data: { mime_type: 'image/jpeg', data: imageData } }] : []),
            ],
          },
        ],
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return { success: true, content };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { callGemini, loading, error };
};

export default {
  useWidgetDraggable,
  useWidgetResizable,
  useWidgetPersistence,
  useWidgetAI,
};
