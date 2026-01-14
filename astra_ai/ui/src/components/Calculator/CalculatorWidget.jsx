import React, { useState, useEffect, useRef } from 'react';
import './CalculatorWidget.css';

const CalculatorWidget = ({ onClose, isVisible = true }) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('0');
  const [angleMode, setAngleMode] = useState('deg');
  const [activeTab, setActiveTab] = useState('main');
  const [isLoading, setIsLoading] = useState(false);
  const [widgetPos, setWidgetPos] = useState({ x: 0, y: 0 });
  const [widgetSize, setWidgetSize] = useState({ width: 550, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastAnswer = useRef(0);

  const widgetRef = useRef(null);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Initialize widget position
  useEffect(() => {
    setWidgetPos({
      x: window.innerWidth / 2 - 275,
      y: window.innerHeight * 0.15
    });
  }, []);

  // Apply dynamic text scaling based on widget size
  const applyDynamicScaling = () => {
    if (!widgetRef.current) return;

    const baseWidth = 550;
    const baseHeight = 600;
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

  // Dragging functionality
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      setWidgetPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Resizing functionality with dynamic scaling
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const newWidth = Math.max(400, resizeStartRef.current.width + (e.clientX - resizeStartRef.current.x));
      const newHeight = Math.max(500, resizeStartRef.current.height + (e.clientY - resizeStartRef.current.y));

      setWidgetSize({
        width: newWidth,
        height: newHeight,
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Calculator Logic
  const appendToInput = (value) => {
    setInput(prev => prev + value);
  };

  const clearAll = () => {
    setInput('');
    setResult('0');
  };

  const backspace = () => {
    setInput(prev => prev.slice(0, -1));
  };

  const useLastAnswer = () => {
    appendToInput(lastAnswer.current.toString());
  };

  const calculate = async () => {
    if (!input.trim()) return;

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      let expression = input
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/Math\.pow\(/g, 'Math.pow(')
        .replace(/!/g, '');

      if (angleMode === 'deg') {
        expression = expression
          .replace(/Math\.sin\(/g, 'Math.sin(Math.PI/180*')
          .replace(/Math\.cos\(/g, 'Math.cos(Math.PI/180*')
          .replace(/Math\.tan\(/g, 'Math.tan(Math.PI/180*')
          .replace(/Math\.asin\(/g, '(180/Math.PI)*Math.asin(')
          .replace(/Math\.acos\(/g, '(180/Math.PI)*Math.acos(')
          .replace(/Math\.atan\(/g, '(180/Math.PI)*Math.atan(');
      }

      const evalResult = eval(expression);

      if (isNaN(evalResult) || !isFinite(evalResult)) {
        throw new Error('Invalid calculation');
      }

      const formattedResult = Number(evalResult.toPrecision(12)).toString();
      setResult(formattedResult);
      lastAnswer.current = parseFloat(formattedResult) || 0;
      setInput(formattedResult);
    } catch (error) {
      console.error('Calculation error:', error);
      setResult('Error');
      setTimeout(() => {
        setResult('0');
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const switchTab = (tabName) => {
    setActiveTab(tabName);
  };

  const setAngleModeHandler = (mode) => {
    setAngleMode(mode);
  };

  const increaseWidgetSize = () => {
    setWidgetSize(prev => ({
      width: prev.width + 100,
      height: prev.height + 100
    }));
  };

  const decreaseWidgetSize = () => {
    setWidgetSize(prev => ({
      width: Math.max(400, prev.width - 100),
      height: Math.max(500, prev.height - 100)
    }));
  };

  const handleDragStart = (e) => {
    if (e.target.closest('.widget-controls') ||
      e.target.closest('.resize-handle') ||
      e.target.closest('input') ||
      e.target.closest('button') ||
      e.target.closest('.tab-button')) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - widgetPos.x,
      y: e.clientY - widgetPos.y,
    });
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: widgetSize.width,
      height: widgetSize.height,
    };
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isVisible) return;
      const key = e.key;

      if (/[0-9]/.test(key)) appendToInput(key);
      if (['+', '-', '*', '/', '.', '(', ')'].includes(key)) appendToInput(key);
      if (key === 'Enter') calculate();
      if (key === 'Backspace') backspace();
      if (key === 'Escape') clearAll();
      if (/^[a-zA-Z]$/.test(key)) appendToInput(key.toUpperCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input, isVisible, angleMode]);

  if (!isVisible) return null;

  return (
    <div
      ref={widgetRef}
      className={`calculator-widget ${isDragging ? 'widget-dragging' : ''}`}
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

      <div className="widget-controls">
        <div className="widget-control-btn" onClick={increaseWidgetSize} title="Make Bigger">⧨</div>
        <div className="widget-control-btn" onClick={decreaseWidgetSize} title="Make Smaller">⧩</div>
        <div className="widget-control-btn" onClick={onClose} title="Close">⧬</div>
      </div>

      <div className="calculator-wrapper">
        <div className="calculator-label">
          CALCULATOR
        </div>

        <div className="calculator-screen-area">
          <div className="calculator-input">{input}</div>
          <div className={`calculator-result ${result === 'Error' ? 'error' : ''}`}>{result}</div>
        </div>

        <div className={`calculator-loading ${isLoading ? 'show' : ''}`}>Calculating...</div>

        <div className="controls-section">
          <div className="calculator-tabs">
            <button
              className={`tab-button ${activeTab === 'main' ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); switchTab('main'); }}
            >
              Main
            </button>
            <button
              className={`tab-button ${activeTab === 'abc' ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); switchTab('abc'); }}
            >
              ABC
            </button>
            <button
              className={`tab-button ${activeTab === 'func' ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); switchTab('func'); }}
            >
              Func
            </button>
          </div>

          <div className="angle-mode">
            <button
              className={`angle-button ${angleMode === 'deg' ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setAngleModeHandler('deg'); }}
            >
              Deg
            </button>
            <button
              className={`angle-button ${angleMode === 'rad' ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setAngleModeHandler('rad'); }}
            >
              Rad
            </button>
          </div>
        </div>

        <div className="button-section">
          {/* Main Tab */}
          <div className={`tab-content ${activeTab === 'main' ? 'active' : ''}`}>
            <div className="main-buttons">
              <button className="calc-btn clear no-drag" onClick={clearAll}>C</button>
              <button className="calc-btn backspace no-drag" onClick={backspace}>⌫</button>
              <button className="calc-btn operator no-drag" onClick={() => appendToInput('/')}>/</button>
              <button className="calc-btn operator no-drag" onClick={() => appendToInput('*')}>×</button>
              <button className="calc-btn operator no-drag" onClick={() => appendToInput('-')}>-</button>
              <button className="calc-btn operator no-drag" onClick={() => appendToInput('+')}>+</button>

              <button className="calc-btn no-drag" onClick={() => appendToInput('7')}>7</button>
              <button className="calc-btn no-drag" onClick={() => appendToInput('8')}>8</button>
              <button className="calc-btn no-drag" onClick={() => appendToInput('9')}>9</button>
              <button className="calc-btn no-drag" onClick={() => appendToInput('(')}>(</button>
              <button className="calc-btn no-drag" onClick={() => appendToInput(')')}>)</button>
              <button className="calc-btn ans no-drag" onClick={useLastAnswer}>ANS</button>

              <button className="calc-btn no-drag" onClick={() => appendToInput('4')}>4</button>
              <button className="calc-btn no-drag" onClick={() => appendToInput('5')}>5</button>
              <button className="calc-btn no-drag" onClick={() => appendToInput('6')}>6</button>
              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.pow(')}>x^y</button>
              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.sqrt(')}>√</button>
              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('%')}>%</button>

              <button className="calc-btn no-drag" onClick={() => appendToInput('1')}>1</button>
              <button className="calc-btn no-drag" onClick={() => appendToInput('2')}>2</button>
              <button className="calc-btn no-drag" onClick={() => appendToInput('3')}>3</button>
              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.sin(')}>sin</button>
              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.cos(')}>cos</button>
              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.tan(')}>tan</button>

              <button className="calc-btn zero no-drag" onClick={() => appendToInput('0')}>0</button>
              <button className="calc-btn no-drag" onClick={() => appendToInput('.')}>.</button>
              <button className="calc-btn equals no-drag" onClick={calculate}>=</button>
            </div>
          </div>

          {/* ABC Tab */}
          <div className={`tab-content ${activeTab === 'abc' ? 'active' : ''}`}>
            <div className="abc-buttons">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map(letter => (
                <button key={letter} className="calc-btn no-drag" onClick={() => appendToInput(letter)}>{letter}</button>
              ))}
              <button className="calc-btn clear no-drag" onClick={clearAll}>C</button>
              <button className="calc-btn backspace no-drag" onClick={backspace}>⌫</button>
              <button className="calc-btn equals no-drag" onClick={calculate}>=</button>
              <button className="calc-btn ans no-drag" onClick={useLastAnswer}>ANS</button>
            </div>
          </div>

          {/* Function Tab */}
          <div className={`tab-content ${activeTab === 'func' ? 'active' : ''}`}>
            <div className="func-buttons">
              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.log(')}>log</button>
              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.log10(')}>log10</button>
              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.exp(')}>e^x</button>
              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.PI')}>π</button>

              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.asin(')}>asin</button>
              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.acos(')}>acos</button>
              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.atan(')}>atan</button>
              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.E')}>e</button>

              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.abs(')}>abs</button>
              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.floor(')}>floor</button>
              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.ceil(')}>ceil</button>
              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.round(')}>round</button>

              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('Math.random()')}>rand</button>
              <button className="calc-btn scientific no-drag" onClick={() => appendToInput('!')}>!</button>
              <button className="calc-btn clear no-drag" onClick={clearAll}>C</button>
              <button className="calc-btn equals no-drag" onClick={calculate}>=</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorWidget;
