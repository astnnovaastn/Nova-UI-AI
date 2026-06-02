import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

// Existing frontend widgets
import CalculatorWidget from './components/Calculator/CalculatorWidget.jsx';
import NotesWidget from './components/Notes/NotesWidget.jsx';
import WeatherWidget from './components/weather/weatherWidget.jsx';
import TicTacToeWidget from './components/TicTacToe/TicTacToeWidget.jsx';

type WidgetName =
  | 'calculator'
  | 'notes'
  | 'weather'
  | 'tictactoe';

const WidgetContainer = () => {
  const [activeWidgets, setActiveWidgets] = useState<Record<WidgetName, boolean>>({
    calculator: false,
    notes: false,
    weather: false,
    tictactoe: false,
  });
  const [panelOpen, setPanelOpen] = useState(false);

  const toggleWidget = (widgetName: WidgetName) => {
    setActiveWidgets((prev) => ({
      ...prev,
      [widgetName]: !prev[widgetName],
    }));
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
      <div
        id="hidden-widget-access"
        style={{
          position: 'fixed',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '40px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          zIndex: 1000,
          cursor: 'pointer',
          background: 'rgba(10, 14, 20, 0.14)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRight: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '0 12px 12px 0',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.14)',
          backdropFilter: 'blur(12px)',
          transition: 'all 0.25s ease',
          opacity: 0.25,
        }}
        onClick={togglePanel}
        title="Open hidden widget launcher"
      >
        <span
          style={{
            display: 'block',
            width: '4px',
            height: '32px',
            borderRadius: '999px',
            background: 'rgba(0, 255, 136, 0.7)',
            boxShadow: '0 0 16px rgba(0, 255, 136, 0.4)',
          }}
        />
      </div>

      {panelOpen && (
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
            <button onClick={() => toggleWidget('calculator')} style={buttonStyle}>
              🧮 Calc
            </button>
            <button onClick={() => toggleWidget('notes')} style={buttonStyle}>
              📝 Notes
            </button>
            <button onClick={() => toggleWidget('weather')} style={buttonStyle}>
              🌤️ Weather
            </button>
            <button onClick={() => toggleWidget('tictactoe')} style={buttonStyle}>
              ⭕ TicTac
            </button>
          </div>
        </div>
      )}

      {activeWidgets.calculator && <CalculatorWidget onClose={() => toggleWidget('calculator')} />}
      {activeWidgets.notes && <NotesWidget onClose={() => toggleWidget('notes')} />}
      {activeWidgets.weather && <WeatherWidget onClose={() => toggleWidget('weather')} />}
      {activeWidgets.tictactoe && <TicTacToeWidget onClose={() => toggleWidget('tictactoe')} />}
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