/**
 * AI Service Layer
 * Coordinates all AI operations across widgets:
 * - Gemini API integration
 * - Chat interface support
 * - Vision analysis (camera, object identification)
 * - NLP (search, notes summarization, natural language math)
 * - News summarization and analysis
 * - Caching and optimization
 * - Rate limiting
 * 
 * Fully integrated with splash_screen.html chat functionality
 */

class AIService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    this.cache = new Map();
    this.requestQueue = [];
    this.isProcessing = false;
    this.rateLimitDelay = 100; // milliseconds between requests
    this.cacheMaxAge = 3600000; // 1 hour
    this.conversationHistory = []; // Store chat history for context
    this.userLocation = localStorage.getItem('userLocation') || 'Como, Italy';
  }

  /**
   * Chat interface specific method
   * Processes user messages with context awareness
   */
  async chatWithNova(userMessage, options = {}) {
    try {
      // Build context-aware prompt
      const systemPrompt = this.buildSystemPrompt();
      const conversationContext = this.getConversationContext();
      
      const fullPrompt = `${systemPrompt}\n\nConversation History:\n${conversationContext}\n\nUser: ${userMessage}`;

      const response = await this.callGemini(fullPrompt, null, {
        useCache: false,
        ...options
      });

      if (response.success) {
        const aiResponse = response.content;
        
        // Store in conversation history
        this.addToHistory('user', userMessage);
        this.addToHistory('assistant', aiResponse);

        return {
          success: true,
          text: aiResponse,
          fromCache: response.fromCache
        };
      }

      return {
        success: false,
        error: 'Failed to get response from Gemini',
        text: "Sorry, I encountered an error processing your request."
      };
    } catch (error) {
      console.error('Chat error:', error);
      return {
        success: false,
        error: error.message,
        text: "Sorry, I encountered an unexpected error."
      };
    }
  }

  /**
   * Build system prompt with context
   */
  buildSystemPrompt() {
    return `You are Nova AI, an intelligent assistant integrated with a widget-based UI. You have access to:
- Search widget for web searches
- News widget for news updates
- Calculator widget for math
- Camera widget for vision analysis
- Notes and task widgets for productivity
- Time and weather displays

User Location: ${this.userLocation}

You provide helpful, concise responses. When appropriate, you can suggest using specific widgets.
Keep responses under 200 words unless asked for more detail.`;
  }

  /**
   * Get conversation context for better responses
   */
  getConversationContext() {
    return this.conversationHistory
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');
  }

  /**
   * Add message to conversation history
   */
  addToHistory(role, content) {
    this.conversationHistory.push({
      role: role === 'user' ? 'user' : 'assistant',
      content,
      timestamp: new Date()
    });

    // Keep history manageable (max 20 messages)
    if (this.conversationHistory.length > 20) {
      this.conversationHistory.shift();
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Main API call method
   */
  async callGemini(prompt, imageBase64 = null, options = {}) {
    const { useCache = true, cacheKey = null } = options;

    // Check cache
    if (useCache && cacheKey) {
      const cached = this.getCache(cacheKey);
      if (cached) {
        return { success: true, content: cached, fromCache: true };
      }
    }

    // Queue request
    return new Promise((resolve) => {
      this.requestQueue.push({
        prompt,
        imageBase64,
        options,
        cacheKey,
        resolve,
      });

      this.processQueue();
    });
  }

  /**
   * Process queued requests with rate limiting
   */
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      const result = await this.executeRequest(request);
      request.resolve(result);

      // Rate limiting
      if (this.requestQueue.length > 0) {
        await new Promise((r) => setTimeout(r, this.rateLimitDelay));
      }
    }

    this.isProcessing = false;
  }

  /**
   * Execute single API request
   */
  async executeRequest(request) {
    try {
      const { prompt, imageBase64, cacheKey } = request;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              ...(imageBase64
                ? [
                    {
                      inline_data: {
                        mime_type: 'image/jpeg',
                        data: imageBase64,
                      },
                    },
                  ]
                : []),
            ],
          },
        ],
      };

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Cache result
      if (cacheKey) {
        this.setCache(cacheKey, content);
      }

      return { success: true, content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Specialized: Camera Widget - Real-time vision analysis
   */
  async analyzeImageFromCamera(imageBase64, analysisType = 'general') {
    let prompt;

    switch (analysisType) {
      case 'object':
        prompt = `Identify the main object in this image:
- Object name/type
- Color
- Material (if obvious)
- Size estimate
Keep response under 50 words, be specific.`;
        break;

      case 'scene':
        prompt = `Describe what you see in this image:
- Main objects
- Scene/environment
- Activities/actions
- Lighting conditions
Keep response under 100 words, be descriptive.`;
        break;

      case 'safety':
        prompt = `Analyze this image for safety concerns:
- Any hazards visible
- Safety violations
- Risk assessment
Keep response concise.`;
        break;

      default:
        prompt = `General analysis of this image - describe what you see in 2-3 sentences.`;
    }

    return this.callGemini(prompt, imageBase64, {
      useCache: true,
      cacheKey: `camera-${analysisType}`,
    });
  }

  /**
   * Specialized: Object Widget - Two-stage identification
   */
  async identifyObject(imageBase64) {
    // Stage 1: Quick identification
    const quickId = await this.callGemini(
      `Identify the main object in this image briefly (1-2 sentences):
- What is it?
- Key characteristics
Be direct and specific.`,
      imageBase64,
      { useCache: true, cacheKey: `object-quick-${imageBase64.slice(0, 20)}` }
    );

    return quickId;
  }

  async getDetailedObjectInfo(objectDescription) {
    // Stage 2: Detailed analysis
    const prompt = `Based on this object: "${objectDescription}"

Provide comprehensive information:

1. **Product Details:** Full name, brand, model, specs
2. **Pricing:** Price range, where to buy
3. **Features:** Top 5 key features and benefits
4. **Reviews:** Average rating, common feedback, pros/cons
5. **Alternatives:** Similar products, competitors
6. **Additional:** Warranty, trending status, special notes

Format with clear sections and be concise.`;

    return this.callGemini(prompt, null, {
      useCache: true,
      cacheKey: `object-detail-${objectDescription.slice(0, 30)}`,
    });
  }

  /**
   * Specialized: News Widget - AI summarization and trending
   */
  async summarizeNews(headline, content) {
    const prompt = `Summarize this news item in 2-3 sentences focusing on key information:

"${headline}"
"${content}"

Make it clear and factual.`;

    return this.callGemini(prompt, null, {
      useCache: true,
      cacheKey: `news-summary-${headline.slice(0, 30)}`,
    });
  }

  async analyzeNewsTrends(headlines) {
    const headlineList = headlines.join('\n');
    const prompt = `Analyze these news headlines and identify trends:

${headlineList}

Provide:
1. Main trending topics (top 3)
2. Sentiment analysis (positive/negative/neutral)
3. Key focus areas
4. Predicted impact

Keep response concise and well-organized.`;

    return this.callGemini(prompt, null, {
      useCache: true,
      cacheKey: `news-trends`,
    });
  }

  /**
   * Specialized: Notepad Widget - Smart summarization
   */
  async summarizeNotes(notes) {
    const noteText = notes.map((n) => n.text).join('\n\n');
    const prompt = `Analyze and summarize these notes into key takeaways:

${noteText}

Provide:
1. Main themes (top 3)
2. Key points to remember
3. Suggested actions
4. Overall summary

Format clearly with sections.`;

    return this.callGemini(prompt, null, {
      useCache: true,
      cacheKey: `notes-summary`,
    });
  }

  async summarizeSingleNote(noteText) {
    const prompt = `Summarize this note concisely in 2-3 sentences:

"${noteText}"

Highlight the main points.`;

    return this.callGemini(prompt, null, {
      useCache: true,
      cacheKey: `note-single-${noteText.slice(0, 30)}`,
    });
  }

  /**
   * Specialized: Search Widget - AI-powered content extraction
   */
  async extractSearchContent(resultTitle) {
    const prompt = `Based on this search result title: "${resultTitle}"

Provide:
1. Key takeaways (top 3 points)
2. Content category
3. Relevance assessment
4. Suggested follow-up searches
5. Information quality (high/medium/low)

Be concise and actionable.`;

    return this.callGemini(prompt, null, {
      useCache: true,
      cacheKey: `search-extract-${resultTitle.slice(0, 30)}`,
    });
  }

  async analyzeSearchTrends(queries) {
    const queryList = queries.join(', ');
    const prompt = `Analyze these search queries for patterns:

${queryList}

Identify:
1. Main topics of interest
2. Search pattern analysis
3. Emerging trends
4. User interest profile
5. Recommended topics to explore

Keep it concise.`;

    return this.callGemini(prompt, null, {
      useCache: true,
      cacheKey: `search-trends`,
    });
  }

  /**
   * Specialized: Calculator Widget - Natural language math
   */
  async interpretMathQuery(query) {
    const prompt = `You are a calculator AI. The user gave this math instruction:

"${query}"

Extract and solve:
1. The mathematical expression
2. Show calculation step-by-step
3. Provide the final answer

Format as:
Expression: [the math]
Steps: [brief steps]
Answer: [result]

Be concise and accurate.`;

    return this.callGemini(prompt, null, {
      useCache: true,
      cacheKey: `math-${query.slice(0, 30)}`,
    });
  }

  /**
   * Cache Management
   */
  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.cacheMaxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  setCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * Batch process multiple requests
   */
  async batchProcess(requests) {
    const promises = requests.map((req) =>
      this.callGemini(req.prompt, req.imageBase64, req.options)
    );
    return Promise.all(promises);
  }

  /**
   * Get API status
   */
  getStatus() {
    return {
      queueSize: this.requestQueue.length,
      isProcessing: this.isProcessing,
      cacheSize: this.cache.size,
      hasApiKey: !!this.apiKey,
    };
  }
}

// Export singleton instance
export const aiService = new AIService();

export default AIService;
