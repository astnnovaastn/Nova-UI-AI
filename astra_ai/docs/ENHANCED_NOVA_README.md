# Enhanced Nova AI Desktop Server

Your existing `run_desktop_nova.py` has been transformed into a comprehensive, production-ready AI service hub with advanced features while maintaining full compatibility with the original functionality.

## 🚀 What's New

### **Enhanced Features Added**
- ✅ **Multiple AI Providers**: OpenAI, Anthropic, Google Gemini, Groq support
- ✅ **Advanced Caching**: Redis and memory caching with intelligent cache management
- ✅ **Load Balancing**: Round-robin, weighted, and fastest provider selection
- ✅ **Configuration Management**: YAML configuration with environment variable support
- ✅ **Performance Monitoring**: Real-time system metrics and health checks
- ✅ **Enhanced Security**: Input validation, rate limiting, and security headers
- ✅ **Widget Integration**: Enhanced API endpoints for all Astra AI widgets
- ✅ **Admin Functions**: Configuration management and system administration
- ✅ **Comprehensive Logging**: Structured logging with rotation and levels
- ✅ **Graceful Shutdown**: Proper cleanup and resource management

### **Maintained Compatibility**
- ✅ **Original Nova AI**: All existing functionality preserved
- ✅ **Desktop Interface**: Same PyWebView interface
- ✅ **Widget Support**: All widgets work seamlessly
- ✅ **Memory System**: Enhanced memory functionality
- ✅ **File Watching**: Improved auto-refresh system

## 📦 Installation

### 1. Install Enhanced Dependencies
```bash
pip install -r requirements_enhanced.txt
```

### 2. Configuration Setup
```bash
# Copy the configuration template
cp config_template.yaml config.yaml

# Edit the configuration file
nano config.yaml
```

### 3. Set API Keys (Optional)
```bash
export NOVA_AI_GOOGLE_API_KEY="your-google-key"
export NOVA_AI_GROQ_API_KEY="your-groq-key"
export NOVA_AI_OPENAI_API_KEY="your-openai-key"
export NOVA_AI_ANTHROPIC_API_KEY="your-anthropic-key"
```

### 4. Run the Enhanced Server
```bash
python scripts/run_desktop_nova.py
```

## 🔧 Configuration

The enhanced server uses a YAML configuration file with the following sections:

### Server Settings
```yaml
server:
  host: "127.0.0.1"
  api_port: 8081
  ui_port: 8080
  debug: false
```

### AI Providers
```yaml
ai:
  providers:
    google:
      enabled: true
      api_key: ""  # Set via environment variable
      model: "gemini-pro"
    groq:
      enabled: true
      api_key: ""
      model: "mixtral-8x7b-32768"
```

### Caching
```yaml
cache:
  type: "memory"  # or "redis"
  ttl: 3600
  max_size: 1000
```

## 📡 Enhanced API Endpoints

### **Chat API** (`/api/chat`)
- Enhanced with AI service integration
- Multiple provider support
- Improved caching and performance

### **AI Service API** (`/api/ai/`)
- `GET /providers` - List available AI providers
- `POST /generate` - Generate AI response with specific provider
- `GET /health` - AI provider health check
- `GET /stats` - AI service statistics

### **Widget API** (`/api/widgets/`)
- `POST /notepad/save` - Save notepad notes
- `GET /notepad/load` - Load notepad notes
- `POST /ai-summaries/save` - Save AI summaries
- `POST /summarize` - AI content summarization

### **Monitoring API** (`/api/monitoring/`)
- `GET /health` - Comprehensive system health check
- `GET /stats` - System statistics
- `GET /performance` - Performance metrics

### **Admin API** (`/api/admin/`)
- `GET /config` - Get configuration (masked)
- `POST /reload` - Reload services
- `GET /system-info` - System information

## 🔍 Monitoring & Health Checks

### System Health Check
```bash
curl http://localhost:8081/api/monitoring/health
```

### Performance Metrics
```bash
curl http://localhost:8081/api/monitoring/stats
```

### AI Provider Status
```bash
curl http://localhost:8081/api/ai/providers
```

## 🎯 Key Features

### **Multi-Provider AI Support**
- Automatic load balancing across providers
- Failover support for high availability
- Provider-specific health monitoring
- Intelligent caching to reduce API costs

### **Enhanced Performance**
- Request/response time tracking
- System resource monitoring
- Cache hit rate optimization
- Background task processing

### **Production Ready**
- Comprehensive error handling
- Graceful shutdown procedures
- Security best practices
- Structured logging

### **Widget Integration**
- Enhanced notepad functionality
- AI summarization features
- Search history management
- Object identification support

## 🔒 Security Features

- **Input Validation**: XSS and injection protection
- **Rate Limiting**: Configurable per-endpoint limits
- **CORS Configuration**: Secure cross-origin requests
- **Security Headers**: Comprehensive security headers
- **API Key Management**: Secure credential handling

## 📊 Performance Monitoring

The enhanced server includes comprehensive monitoring:

- **System Metrics**: CPU, memory, disk usage
- **Request Metrics**: Response times, success rates
- **AI Metrics**: Provider performance, token usage
- **Cache Metrics**: Hit rates, storage efficiency

## 🛠️ Development Features

- **Auto-Reload**: Enhanced file watching with better performance
- **Debug Mode**: Comprehensive debugging information
- **Configuration Validation**: Startup configuration checks
- **Dependency Validation**: Optional dependency status

## 🚀 Production Deployment

### Environment Variables
```bash
NOVA_AI_DEBUG=false
NOVA_AI_HOST=0.0.0.0
NOVA_AI_API_PORT=8081
NOVA_AI_UI_PORT=8080
```

### Docker Support
The enhanced server is ready for containerization with proper configuration management and health checks.

### Load Balancing
Built-in load balancing supports multiple deployment strategies for high availability.

## 📈 Scaling

- **Horizontal Scaling**: Multiple server instances
- **Vertical Scaling**: Configurable worker processes
- **Cache Scaling**: Redis cluster support
- **Database Scaling**: Multiple database backends

## 🔧 Troubleshooting

### Common Issues

1. **Missing Dependencies**
   ```bash
   pip install -r requirements_enhanced.txt
   ```

2. **Configuration Issues**
   ```bash
   # Check configuration
   curl http://localhost:8081/api/admin/config
   ```

3. **API Key Problems**
   ```bash
   # Check provider status
   curl http://localhost:8081/api/ai/providers
   ```

### Debug Mode
```bash
export NOVA_AI_DEBUG=true
python scripts/run_desktop_nova.py
```

## 📞 Support

- **Health Checks**: `/api/monitoring/health`
- **System Stats**: `/api/monitoring/stats`
- **Configuration**: `/api/admin/config`
- **Logs**: Check `logs/nova_ai.log`

---

**Enhanced Nova AI Desktop Server** - Your original Nova AI, now production-ready! 🚀
