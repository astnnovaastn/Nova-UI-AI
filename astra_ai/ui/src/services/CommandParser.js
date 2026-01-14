/**
 * CommandParser.js
 * Intelligent command recognition system from splash_screen.html
 * Parses user messages for widget triggers and special commands
 */

class CommandParser {
  constructor() {
    this.timeKeywords = ['time', 'what time', 'current time', 'clock'];
    this.weatherKeywords = ['weather', 'temperature', 'forecast', 'rain', 'sunny', 'cold', 'hot'];
    this.searchKeywords = ['search', 'find', 'look for', 'google', 'look up', 'what is', 'who is', 'where is', 'how to'];
    this.newsKeywords = ['news', 'headlines', 'latest', 'breaking', 'story', 'article'];
    this.calculatorKeywords = ['calculate', 'math', 'compute', 'equals', 'is', 'how much', '+', '-', '*', '/', '%', '^'];
    this.cameraKeywords = ['camera', 'photo', 'picture', 'video', 'see', 'look', 'show me', 'capture', 'vision'];
    this.gameKeywords = ['game', 'play', 'tic-tac-toe', 'tic tac toe', 'tictactoe'];
    this.clearKeywords = ['clear', 'hide', 'remove', 'close', 'dismiss'];
    this.resetKeywords = ['reset', 'restore', 'default'];
  }

  /**
   * Main parse function - detects command type
   */
  parse(message) {
    const msgLower = message.toLowerCase().trim();
    
    // Check for clear/hide commands
    if (this.isClearCommand(msgLower)) {
      return { type: 'clear', widget: this.extractWidgetName(msgLower) };
    }

    // Check for reset commands
    if (this.isResetCommand(msgLower)) {
      return { type: 'reset', target: 'widgets' };
    }

    // Check for time requests
    if (this.isTimeRequest(msgLower)) {
      return { 
        type: 'time', 
        location: this.extractLocation(msgLower) || 'Como, Italy' 
      };
    }

    // Check for weather requests
    if (this.isWeatherRequest(msgLower)) {
      return { 
        type: 'weather', 
        location: this.extractLocation(msgLower) 
      };
    }

    // Check for search requests
    if (this.isSearchRequest(msgLower)) {
      return { 
        type: 'search', 
        query: this.extractSearchQuery(msgLower) 
      };
    }

    // Check for news requests
    if (this.isNewsRequest(msgLower)) {
      return { 
        type: 'news', 
        query: this.extractNewsQuery(msgLower) 
      };
    }

    // Check for calculator requests
    if (this.isCalculatorRequest(msgLower)) {
      return { 
        type: 'calculator', 
        expression: this.extractCalculatorExpression(msgLower) 
      };
    }

    // Check for camera/vision requests
    if (this.isCameraRequest(msgLower)) {
      return { 
        type: 'camera', 
        mode: this.extractCameraMode(msgLower) 
      };
    }

    // Check for game requests
    if (this.isGameRequest(msgLower)) {
      return { 
        type: 'game', 
        game: this.extractGameType(msgLower) 
      };
    }

    // Default - regular chat message
    return { type: 'chat', message: message };
  }

  // ==================== TIME DETECTION ====================
  isTimeRequest(message) {
    return this.timeKeywords.some(keyword => message.includes(keyword));
  }

  // ==================== WEATHER DETECTION ====================
  isWeatherRequest(message) {
    return this.weatherKeywords.some(keyword => message.includes(keyword));
  }

  // ==================== SEARCH DETECTION ====================
  isSearchRequest(message) {
    // More intelligent search detection
    if (this.searchKeywords.some(keyword => message.includes(keyword))) {
      return !this.isNewsRequest(message) && !this.isCalculatorRequest(message);
    }
    return false;
  }

  extractSearchQuery(message) {
    // Remove search keywords to get the actual query
    let query = message;
    
    // Remove common search prefixes
    const searchPrefixes = ['search for', 'search', 'find', 'look for', 'look up', 'google', 'what is', 'who is', 'where is', 'how to'];
    
    for (const prefix of searchPrefixes) {
      if (query.startsWith(prefix)) {
        query = query.substring(prefix.length).trim();
        break;
      }
    }
    
    return query || message;
  }

  // ==================== NEWS DETECTION ====================
  isNewsRequest(message) {
    return this.newsKeywords.some(keyword => message.includes(keyword));
  }

  extractNewsQuery(message) {
    let query = message;
    
    const newsPrefixes = ['news about', 'news', 'headlines', 'latest', 'breaking', 'story about', 'article about'];
    
    for (const prefix of newsPrefixes) {
      if (query.startsWith(prefix)) {
        query = query.substring(prefix.length).trim();
        break;
      }
    }
    
    return {
      type: 'topic_only',
      topic: query || 'general',
      source: null
    };
  }

  // ==================== CALCULATOR DETECTION ====================
  isCalculatorRequest(message) {
    // Check for math operators or calculation keywords
    const hasMathOperator = /[\+\-\*\/\%\^]|\bequals\b|\bhow\s+much\b|\bcalculate\b|\bcompute\b|\bmath\b/.test(message);
    const hasCalculatorKeyword = this.calculatorKeywords.some(keyword => message.includes(keyword));
    
    return hasMathOperator || hasCalculatorKeyword;
  }

  extractCalculatorExpression(message) {
    // Remove calculator keywords and return the expression
    let expression = message;
    
    const calcPrefixes = ['calculate', 'compute', 'math', 'what is', 'solve'];
    
    for (const prefix of calcPrefixes) {
      if (expression.startsWith(prefix)) {
        expression = expression.substring(prefix.length).trim();
        break;
      }
    }
    
    return expression || message;
  }

  // ==================== CAMERA DETECTION ====================
  isCameraRequest(message) {
    return this.cameraKeywords.some(keyword => message.includes(keyword));
  }

  extractCameraMode(message) {
    if (message.includes('identify') || message.includes('object')) {
      return 'identify';
    }
    if (message.includes('analyze') || message.includes('analyze')) {
      return 'analyze';
    }
    return 'capture';
  }

  // ==================== GAME DETECTION ====================
  isGameRequest(message) {
    return this.gameKeywords.some(keyword => message.includes(keyword));
  }

  extractGameType(message) {
    if (message.includes('tic') || message.includes('tac') || message.includes('toe')) {
      return 'tictactoe';
    }
    return 'general';
  }

  // ==================== CLEAR DETECTION ====================
  isClearCommand(message) {
    const clearPattern = /^(clear|hide|remove)\s+(the\s+)?(time|weather|search|news|camera|notepad|task)$/i;
    return clearPattern.test(message);
  }

  extractWidgetName(message) {
    const match = message.match(/(?:clear|hide|remove)\s+(?:the\s+)?(\w+)/i);
    return match ? match[1].toLowerCase() : null;
  }

  // ==================== RESET DETECTION ====================
  isResetCommand(message) {
    const resetPattern = /^reset\s+(widgets?|positions?|all)$/i;
    return resetPattern.test(message);
  }

  // ==================== LOCATION EXTRACTION ====================
  extractLocation(message) {
    // Common locations and timezones
    const locations = [
      'como, italy', 'italy', 'new york', 'us', 'usa',
      'london', 'uk', 'japan', 'tokyo', 'paris', 'france',
      'germany', 'berlin', 'california', 'los angeles'
    ];

    for (const location of locations) {
      if (message.includes(location)) {
        return location;
      }
    }

    // Try to extract any mentioned city/location
    const locationPattern = /(?:in|at|from)\s+([A-Za-z\s,]+?)(?:\?|$)/i;
    const match = message.match(locationPattern);
    return match ? match[1].trim() : null;
  }

  // ==================== SPECIAL DETECTION ====================

  /**
   * Check if message is a "more info" request
   */
  isMoreInfoRequest(message) {
    const moreInfoPatterns = [
      /(?:more|additional)\s+(?:info|information|details?|explanation)/i,
      /tell me (?:more|details?)/i,
      /elaborate/i,
      /explain more/i
    ];
    
    return moreInfoPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if message is a follow-up question
   */
  isFollowUp(message) {
    const followUpPatterns = [
      /^(?:and|also|what about|how about|tell me|show me)/i,
      /\?$/,  // Ends with question mark
      /^(?:can you|could you|would you)/i
    ];
    
    return followUpPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Determine if response should go to chat or widget
   */
  shouldGoToWidget(command) {
    return ['search', 'news', 'calculator', 'camera', 'game'].includes(command.type);
  }

  /**
   * Get friendly widget name for display
   */
  getWidgetDisplayName(widgetType) {
    const names = {
      'search': 'Search Widget',
      'news': 'News Widget',
      'calculator': 'Calculator',
      'camera': 'Camera',
      'time': 'Time Display',
      'weather': 'Weather',
      'game': 'Game'
    };
    
    return names[widgetType] || widgetType;
  }
}

// Export as singleton
export const commandParser = new CommandParser();
export default CommandParser;
