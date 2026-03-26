/**
 * Widget Manager System
 * Handles:
 * - Widget lifecycle (create, destroy, show, hide)
 * - Dragging and resizing
 * - Event handling and command processing
 * - Cross-widget communication
 * - Dynamic text scaling
 * - Storage and persistence
 * - AI integration orchestration
 */

class WidgetManager {
  constructor() {
    this.widgets = new Map();
    this.eventListeners = new Map();
    this.commandQueue = [];
    this.aiCache = new Map();
    this.initializeEventSystem();
  }

  /**
   * Event System - Subscribe to widget events
   */
  initializeEventSystem() {
    document.addEventListener('widget:command', (e) => this.handleCommand(e.detail));
    document.addEventListener('widget:message', (e) => this.broadcastToWidget(e.detail));
    window.addEventListener('resize', () => this.handleWindowResize());
  }

  /**
   * Register a widget
   */
  registerWidget(widgetId, widgetConfig) {
    this.widgets.set(widgetId, {
      id: widgetId,
      visible: true,
      position: { x: 0, y: 0 },
      size: { width: 400, height: 500 },
      ...widgetConfig,
    });
  }

  /**
   * Handle voice commands for widgets
   */
  handleCommand(command) {
    const result = this.parseCommand(command);
    if (result.type === 'widget') {
      this.executeWidgetCommand(result);
    } else if (result.type === 'ai') {
      this.executeAICommand(result);
    } else if (result.type === 'system') {
      this.executeSystemCommand(result);
    }
  }

  /**
   * Parse natural language commands
   */
  parseCommand(command) {
    const lower = command.toLowerCase();

    // Widget movement commands
    if (lower.includes('move') || lower.includes('position')) {
      return this.parseMovementCommand(command);
    }

    // Widget search commands
    if (lower.includes('search')) {
      return { type: 'widget', target: 'search-widget', action: 'focus', data: command };
    }

    // Widget news commands
    if (lower.includes('news') || lower.includes('trending')) {
      return { type: 'widget', target: 'news-widget', action: 'fetch', data: command };
    }

    // Widget notes commands
    if (lower.includes('note') || lower.includes('save')) {
      return { type: 'widget', target: 'notepad-widget', action: 'addNote', data: command };
    }

    // Calculator commands
    if (lower.includes('calculate') || lower.includes('math')) {
      return { type: 'widget', target: 'calculator-widget', action: 'nlMath', data: command };
    }

    // Camera commands
    if (lower.includes('camera') || lower.includes('capture') || lower.includes('photo')) {
      return { type: 'widget', target: 'camera-widget', action: 'capture', data: command };
    }

    // Task commands
    if (lower.includes('task') || lower.includes('todo')) {
      return { type: 'widget', target: 'task-widget', action: 'addTask', data: command };
    }

    // AI analysis commands
    if (lower.includes('analyze') || lower.includes('identify')) {
      return { type: 'ai', target: 'object-widget', action: 'analyze', data: command };
    }

    // System commands
    if (lower.includes('minimize') || lower.includes('maximize') || lower.includes('close')) {
      return { type: 'system', action: 'widget-state', data: command };
    }

    return { type: 'unknown' };
  }

  /**
   * Parse movement commands
   */
  parseMovementCommand(command) {
    const directions = ['up', 'down', 'left', 'right', 'center'];
    const amounts = {
      'little': 10,
      'small': 25,
      'medium': 50,
      'large': 100,
      'big': 100,
    };

    let direction = 'center';
    let amount = 50;

    for (const dir of directions) {
      if (command.toLowerCase().includes(dir)) {
        direction = dir;
        break;
      }
    }

    for (const [key, val] of Object.entries(amounts)) {
      if (command.toLowerCase().includes(key)) {
        amount = val;
        break;
      }
    }

    return {
      type: 'system',
      action: 'move-widget',
      data: { direction, amount },
    };
  }

  /**
   * Execute widget command
   */
  executeWidgetCommand(result) {
    const event = new CustomEvent('widget:execute', {
      detail: {
        widgetId: result.target,
        action: result.action,
        data: result.data,
      },
    });
    document.dispatchEvent(event);
  }

  /**
   * Execute AI command
   */
  async executeAICommand(result) {
    // Send to AI service
    console.log('AI Command:', result);
  }

  /**
   * Execute system command
   */
  executeSystemCommand(result) {
    if (result.action === 'move-widget') {
      this.moveWidget(result.data);
    } else if (result.action === 'widget-state') {
      this.toggleWidgetState(result.data);
    }
  }

  /**
   * Move widget by command
   */
  moveWidget(options) {
    const { direction, amount } = options;
    const activeWidget = document.querySelector('.widget-container:hover');

    if (activeWidget) {
      const rect = activeWidget.getBoundingClientRect();
      let x = rect.left;
      let y = rect.top;

      switch (direction) {
        case 'up':
          y -= amount;
          break;
        case 'down':
          y += amount;
          break;
        case 'left':
          x -= amount;
          break;
        case 'right':
          x += amount;
          break;
        case 'center':
          x = (window.innerWidth - rect.width) / 2;
          y = (window.innerHeight - rect.height) / 2;
          break;
      }

      // Keep within bounds
      x = Math.max(0, Math.min(x, window.innerWidth - 100));
      y = Math.max(0, Math.min(y, window.innerHeight - 100));

      activeWidget.style.left = `${x}px`;
      activeWidget.style.top = `${y}px`;
    }
  }

  /**
   * Toggle widget visibility state
   */
  toggleWidgetState(command) {
    const lower = command.toLowerCase();
    const widgets = document.querySelectorAll('.widget-container');

    widgets.forEach((widget) => {
      if (lower.includes('minimize')) {
        widget.style.transform = 'scale(0.8)';
        widget.style.opacity = '0.5';
      } else if (lower.includes('maximize')) {
        widget.style.transform = 'scale(1)';
        widget.style.opacity = '1';
      } else if (lower.includes('close')) {
        widget.style.display = 'none';
      }
    });
  }

  /**
   * Broadcast message to specific widget
   */
  broadcastToWidget(data) {
    const event = new CustomEvent(`widget:${data.widgetId}`, {
      detail: data.message,
    });
    document.dispatchEvent(event);
  }

  /**
   * Handle window resize - scale widgets responsively
   */
  handleWindowResize() {
    const widgets = document.querySelectorAll('.widget-container');
    widgets.forEach((widget) => {
      this.scaleWidgetText(widget);
    });
  }

  /**
   * Dynamic text scaling based on container size
   */
  scaleWidgetText(widget) {
    const width = widget.offsetWidth;
    const scaleFactor = Math.max(0.8, Math.min(1.2, width / 400));

    const textElements = widget.querySelectorAll('*');
    textElements.forEach((el) => {
      const computedStyle = window.getComputedStyle(el);
      const originalSize = parseFloat(computedStyle.fontSize);
      el.style.fontSize = `${originalSize * scaleFactor}px`;
    });
  }

  /**
   * Get cached AI response
   */
  getAICache(key) {
    return this.aiCache.get(key);
  }

  /**
   * Set AI cache
   */
  setAICache(key, value, ttl = 3600000) {
    // ttl in milliseconds (default 1 hour)
    this.aiCache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });

    // Auto-clear after TTL
    setTimeout(() => {
      this.aiCache.delete(key);
    }, ttl);
  }

  /**
   * Check if cache is still valid
   */
  isCacheValid(key) {
    const cached = this.aiCache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < cached.ttl;
  }
}

// Export singleton instance
export const widgetManager = new WidgetManager();

export default WidgetManager;
