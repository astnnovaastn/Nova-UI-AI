import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Existing frontend widgets
import CalculatorWidget from './components/Calculator/CalculatorWidget.jsx';
import NotesWidget from './components/Notes/NotesWidget.jsx';
import WeatherWidget from './components/weather/weatherWidget.jsx';
import TicTacToeWidget from './components/TicTacToe/TicTacToeWidget.jsx';
import ImageWidget from './components/IMAGE/ImageWidget.jsx';

type WidgetName =
  | 'calculator'
  | 'notes'
  | 'weather'
  | 'tictactoe'
  | 'image';

type ImageWidgetCommand = {
  command: string;
  prompt?: string;
  request_id?: string;
  source?: string;
  issuedAt: number;
};

const WidgetContainer = () => {
  const [activeWidgets, setActiveWidgets] = useState<Record<WidgetName, boolean>>({
    calculator: false,
    notes: false,
    weather: false,
    tictactoe: false,
    image: false,
  });
  const [panelOpen, setPanelOpen] = useState(false);
  const [imageCommand, setImageCommand] = useState<ImageWidgetCommand | null>(null);

  const reportActionResult = (
    widget: string,
    command: string,
    payload: Record<string, unknown>,
    status: string,
    detail: string,
  ) => {
    window.dispatchEvent(new CustomEvent('novaWidgetActionResult', {
      detail: {
        widget,
        command,
        request_id: payload.request_id,
        status,
        detail,
      },
    }));
  };

  const normalizeWidget = (widgetName: string): WidgetName | null => {
    const normalized = widgetName.trim().toLowerCase();
    const map: Record<string, WidgetName> = {
      calculator: 'calculator',
      calc: 'calculator',
      notes: 'notes',
      note: 'notes',
      weather: 'weather',
      forecast: 'weather',
      clock: 'weather',
      timer: 'weather',
      search: 'notes',
      news: 'notes',
      headlines: 'notes',
      tictactoe: 'tictactoe',
      'tic tac toe': 'tictactoe',
      game: 'tictactoe',
      image: 'image',
      gallery: 'image',
      photo: 'image',
      pictures: 'image',
      img: 'image',
    };

    return map[normalized] ?? null;
  };

  const commandWidget = (widgetName: string, action: string, payload: Record<string, unknown> = {}) => {
    const normalized = normalizeWidget(widgetName);
    if (!normalized) {
      reportActionResult(widgetName, action, payload, 'failed', 'Requested widget is not available.');
      setPanelOpen(true);
      return;
    }

    const shouldOpenImage = normalized === 'image' && ['open', 'show_gallery', 'set_prompt', 'generate'].includes(action);
    if (shouldOpenImage) {
      setImageCommand({
        command: action,
        prompt: typeof payload.prompt === 'string' ? payload.prompt : undefined,
        request_id: typeof payload.request_id === 'string' ? payload.request_id : undefined,
        source: typeof payload.source === 'string' ? payload.source : undefined,
        issuedAt: Date.now(),
      });
      setActiveWidgets((prev) => {
        const next = { ...prev, image: true };
        window.dispatchEvent(new CustomEvent('orbWidgetStateChange', { detail: { widget: 'image', isOpen: true, hasAnyWidgetOpen: Object.values(next).some(v => v) } }));
        return next;
      });
      setPanelOpen(false);
      return;
    }

    if (normalized === 'image' && (action === 'close' || action === 'hide' || action === 'dismiss')) {
      reportActionResult(normalized, action, payload, 'accepted', 'Closing image widget.');
      setImageCommand(null);
      setActiveWidgets((prev) => {
        const next = { ...prev, image: false };
        window.dispatchEvent(new CustomEvent('orbWidgetStateChange', { detail: { widget: 'image', isOpen: false, hasAnyWidgetOpen: Object.values(next).some(v => v) } }));
        return next;
      });
      reportActionResult(normalized, action, payload, 'completed', 'Image widget closed.');
      return;
    }

    if (action === 'open' || action === 'show' || action === 'activate') {
      setActiveWidgets((prev) => {
        const next = { ...prev, [normalized]: true };
        // notify orb that a widget opened
        window.dispatchEvent(new CustomEvent('orbWidgetStateChange', { detail: { widget: normalized, isOpen: true, hasAnyWidgetOpen: Object.values(next).some(v => v) } }));
        return next;
      });
      setPanelOpen(false);
    } else if (action === 'close' || action === 'hide' || action === 'dismiss') {
      setActiveWidgets((prev) => {
        const next = { ...prev, [normalized]: false };
        window.dispatchEvent(new CustomEvent('orbWidgetStateChange', { detail: { widget: normalized, isOpen: false, hasAnyWidgetOpen: Object.values(next).some(v => v) } }));
        return next;
      });
    } else if (action === 'toggle') {
      setActiveWidgets((prev) => {
        const next = { ...prev, [normalized]: !prev[normalized] };
        window.dispatchEvent(new CustomEvent('orbWidgetStateChange', { detail: { widget: normalized, isOpen: next[normalized], hasAnyWidgetOpen: Object.values(next).some(v => v) } }));
        return next;
      });
    } else {
      setActiveWidgets((prev) => {
        const next = { ...prev, [normalized]: true };
        window.dispatchEvent(new CustomEvent('orbWidgetStateChange', { detail: { widget: normalized, isOpen: true, hasAnyWidgetOpen: Object.values(next).some(v => v) } }));
        return next;
      });
      setPanelOpen(false);
    }
  };

  useEffect(() => {
    (window as any).novaWidgetControl = (action: string, widget: string, payload: Record<string, unknown> = {}) => {
      commandWidget(widget, action, payload);
    };
    return () => {
      delete (window as any).novaWidgetControl;
    };
  }, []);

  const toggleWidget = (widgetName: WidgetName, closePanel = false) => {
    if (widgetName === 'image') {
      setImageCommand(null);
    }
    setActiveWidgets((prev) => {
      const next = { ...prev, [widgetName]: !prev[widgetName] };
      // emit orb widget state change
      window.dispatchEvent(new CustomEvent('orbWidgetStateChange', { detail: { widget: widgetName, isOpen: next[widgetName], hasAnyWidgetOpen: Object.values(next).some(v => v) } }));
      return next;
    });
    if (closePanel) {
      setPanelOpen(false);
    }
  };

  const togglePanel = () => setPanelOpen((prev) => !prev);

  return (
    <div
      id="widget-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {/* Image Widget Launcher — hidden when the image widget is open */}
      {!activeWidgets.image && (
        <div
          id="image-widget-launcher"
          style={{
            position: 'fixed',
            left: '20px',
            top: '20px',
            pointerEvents: 'auto',
            zIndex: 1000,
          }}
        >
          <button
            id="image-launcher-btn"
            onClick={() => toggleWidget('image', true)}
            title="Open Gemini Image Generator"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px 9px 12px',
              borderRadius: '999px',
              border: '1px solid rgba(66, 133, 244, 0.3)',
              background: 'rgba(10, 12, 22, 0.82)',
              backdropFilter: 'blur(16px)',
              color: 'rgba(200, 210, 240, 0.9)',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(66,133,244,0.12)',
              transition: 'all 0.22s ease',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(66, 133, 244, 0.18)';
              e.currentTarget.style.borderColor = 'rgba(66, 133, 244, 0.6)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(66,133,244,0.25), 0 0 0 1px rgba(66,133,244,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(10, 12, 22, 0.82)';
              e.currentTarget.style.borderColor = 'rgba(66, 133, 244, 0.3)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(66,133,244,0.12)';
            }}
          >
            {/* Gemini spark icon */}
            <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
              <defs>
                <linearGradient id="launcherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4285F4" />
                  <stop offset="50%" stopColor="#9B5DE5" />
                  <stop offset="100%" stopColor="#F15BB5" />
                </linearGradient>
              </defs>
              <path d="M14 2 C14 9 9 14 2 14 C9 14 14 19 14 26 C14 19 19 14 26 14 C19 14 14 9 14 2Z" fill="url(#launcherGrad)" />
            </svg>
            Gemini Image
          </button>
        </div>
      )}

      {panelOpen && !activeWidgets.image && (
        <div
          id="widget-panel"
          style={{
            position: 'fixed',
            left: '48px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '240px',
            maxHeight: '80vh',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'auto',
            zIndex: 999,
            background: 'rgba(6, 10, 18, 0.94)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '0 12px 12px 0',
            boxShadow: '0 18px 48px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: '13px', fontWeight: 600 }}>
              Widget Launcher
            </div>
            <button
              onClick={togglePanel}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'grid',
                placeItems: 'center',
              }}
              aria-label="Close widget launcher"
            >
              ×
            </button>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            <button onClick={() => toggleWidget('calculator', true)} style={buttonStyle}>
              🧮 Calc
            </button>
            <button onClick={() => toggleWidget('notes', true)} style={buttonStyle}>
              📝 Notes
            </button>
            <button onClick={() => toggleWidget('weather', true)} style={buttonStyle}>
              🌤️ Weather
            </button>
            <button onClick={() => toggleWidget('tictactoe', true)} style={buttonStyle}>
              ⭕ TicTac
            </button>
            <button onClick={() => toggleWidget('image', true)} style={buttonStyle}>
              🖼️ Gallery
            </button>
          </div>
        </div>
      )}

      {activeWidgets.calculator && <CalculatorWidget onClose={() => toggleWidget('calculator')} />}
      {activeWidgets.notes && <NotesWidget onClose={() => toggleWidget('notes')} />}
      {activeWidgets.weather && <WeatherWidget onClose={() => toggleWidget('weather')} />}
      {activeWidgets.tictactoe && <TicTacToeWidget onClose={() => toggleWidget('tictactoe')} />}
      {activeWidgets.image && (
        <ImageWidget
          onClose={() => toggleWidget('image')}
          aiCommand={imageCommand}
          aiControlled={Boolean(imageCommand)}
          onCommandResult={(result: Record<string, unknown>) => {
            window.dispatchEvent(new CustomEvent('novaWidgetActionResult', { detail: result }));
          }}
        />
      )}
    </div>
  );
};

const buttonStyle = {
  padding: '8px 12px',
  background: 'rgba(5, 5, 8, 0.8)',
  border: '1px solid rgba(76, 168, 232, 0.3)',
  borderRadius: '20px',
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '12px',
  cursor: 'pointer',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

export const initWidgets = () => {
  const container = document.createElement('div');
  container.id = 'react-widgets-root';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<WidgetContainer />);
};
