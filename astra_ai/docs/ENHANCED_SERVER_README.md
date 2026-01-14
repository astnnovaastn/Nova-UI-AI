# Enhanced Nova AI Server

A comprehensive, production-ready AI service hub that significantly expands the functionality of the original `run_desktop_nova.py` server script with advanced features, multiple AI provider support, and enterprise-grade capabilities.

## 🚀 Key Features

### Core Server Enhancements
- **Modular Service Architecture**: Clean separation of concerns with dedicated service modules
- **Comprehensive Error Handling**: Robust error handling and logging throughout the system
- **Health Check & Monitoring**: Built-in health checks and performance monitoring
- **Configuration Management**: Flexible configuration with environment variable support
- **Graceful Shutdown**: Proper cleanup and shutdown procedures

### AI Integration Features
- **Multiple AI Providers**: Support for OpenAI, Anthropic, Google Gemini, and Groq
- **Load Balancing**: Intelligent load balancing across AI providers
- **Response Caching**: Efficient caching to reduce API calls and improve performance
- **Model Switching**: Dynamic model selection and provider failover
- **Token Usage Tracking**: Comprehensive usage statistics and monitoring

### Advanced Functionality
- **Real-time Communication**: WebSocket support for live interactions
- **File Upload & Processing**: Secure file handling with validation
- **Background Task Processing**: Asynchronous task processing with Celery
- **Database Integration**: Persistent storage with SQLite, PostgreSQL, or MySQL support
- **Authentication & Authorization**: Secure access control and user management
- **Rate Limiting**: Configurable rate limiting to prevent abuse

### Production Features
- **Performance Monitoring**: Real-time performance metrics and analytics
- **Automated Testing**: Comprehensive test suite with validation endpoints
- **Security Measures**: Security headers, CORS, and input validation
- **Scalability**: Designed for horizontal scaling and high availability
- **Backup & Recovery**: Automated backup and data recovery capabilities

## 📁 Project Structure

```
astra_ai/
├── scripts/
│   ├── enhanced_nova_server.py      # Main server application
│   └── run_desktop_nova.py          # Original server (preserved)
├── services/                        # Service modules
│   ├── ai_service.py                # AI provider management
│   ├── core_service.py              # Core Nova AI integration
│   ├── config_service.py            # Configuration management
│   ├── database_service.py          # Database operations
│   ├── cache_service.py             # Caching layer
│   ├── auth_service.py              # Authentication
│   ├── file_service.py              # File handling
│   ├── websocket_service.py         # WebSocket communication
│   └── monitoring_service.py        # Performance monitoring
├── api/                             # API endpoints
│   ├── chat_api.py                  # Chat interactions
│   ├── ai_api.py                    # Direct AI provider access
│   ├── file_api.py                  # File operations
│   ├── admin_api.py                 # Administrative functions
│   ├── monitoring_api.py            # Monitoring endpoints
│   ├── widget_api.py                # Widget integration
│   └── integration_api.py           # Cross-service communication
├── utils/                           # Utility modules
│   ├── logger.py                    # Enhanced logging
│   ├── security.py                  # Security utilities
│   ├── performance.py               # Performance monitoring
│   └── health_check.py              # Health check utilities
├── config_template.yaml             # Configuration template
├── requirements_enhanced.txt        # Dependencies
├── start_enhanced_server.py         # Startup script
└── ENHANCED_SERVER_README.md        # This documentation
```

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
# Install all required dependencies
pip install -r requirements_enhanced.txt

# Or use the startup script to auto-install
python start_enhanced_server.py --install-deps
```

### 2. Configuration

```bash
# Copy the configuration template
cp config_template.yaml config.yaml

# Edit the configuration file
nano config.yaml
```

### 3. Environment Variables

Set your API keys as environment variables:

```bash
export NOVA_AI_OPENAI_API_KEY="your-openai-key"
export NOVA_AI_ANTHROPIC_API_KEY="your-anthropic-key"
export NOVA_AI_GOOGLE_API_KEY="your-google-key"
export NOVA_AI_GROQ_API_KEY="your-groq-key"
```

### 4. Start the Server

```bash
# Basic startup
python start_enhanced_server.py

# Debug mode
python start_enhanced_server.py --debug

# Custom ports
python start_enhanced_server.py --api-port 9000 --ui-port 9001

# Server only (no desktop UI)
python start_enhanced_server.py --no-webview

# Check configuration only
python start_enhanced_server.py --check-only
```

## 🔧 Configuration

The server uses a YAML configuration file with the following main sections:

### Server Configuration
```yaml
server:
  host: "127.0.0.1"
  api_port: 8081
  ui_port: 8080
  debug: false
  workers: 4
```

### AI Providers
```yaml
ai:
  providers:
    openai:
      enabled: true
      api_key: ""
      model: "gpt-4"
    google:
      enabled: true
      api_key: ""
      model: "gemini-pro"
  load_balancing:
    enabled: true
    strategy: "round_robin"
```

### Database
```yaml
database:
  type: "sqlite"
  path: "data/nova_ai.db"
  # For PostgreSQL/MySQL:
  # host: "localhost"
  # port: 5432
  # name: "nova_ai"
```

## 📡 API Endpoints

### Chat API (`/api/chat`)
- `POST /message` - Send chat message
- `GET /history/<session_id>` - Get chat history
- `GET /sessions` - List active sessions
- `DELETE /sessions/<session_id>` - Clear session
- `POST /memory/search` - Search memories

### AI API (`/api/ai`)
- `POST /generate` - Generate AI response
- `GET /providers` - List AI providers
- `GET /health` - Provider health check
- `GET /stats` - Usage statistics
- `POST /batch` - Batch generation

### Monitoring API (`/api/monitoring`)
- `GET /health` - System health check
- `GET /metrics` - Performance metrics
- `GET /stats` - Service statistics

### Admin API (`/api/admin`)
- `POST /reload` - Reload services
- `GET /config` - Get configuration
- `POST /config` - Update configuration

## 🔍 Monitoring & Health Checks

### Health Check Endpoints
- **System Health**: `GET /api/monitoring/health`
- **AI Provider Health**: `GET /api/ai/health`
- **Service Health**: `GET /api/chat/health`

### Performance Metrics
- Response times
- Request counts
- Error rates
- Cache hit rates
- Memory usage
- CPU utilization

### Logging
- Structured logging with JSON format option
- Log rotation and retention
- Separate error logs
- Configurable log levels

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Session management
- API key validation

### Security Measures
- Rate limiting per endpoint
- CORS configuration
- Input validation and sanitization
- Security headers
- SSL/TLS support

### Data Protection
- Encrypted sensitive data storage
- Secure file upload handling
- Data retention policies
- Backup encryption

## 🚀 Production Deployment

### Using Gunicorn
```bash
gunicorn -w 4 -k eventlet --bind 0.0.0.0:8081 scripts.enhanced_nova_server:app
```

### Docker Deployment
```dockerfile
FROM python:3.11-slim
COPY . /app
WORKDIR /app
RUN pip install -r requirements_enhanced.txt
CMD ["python", "start_enhanced_server.py", "--no-webview"]
```

### Environment Variables for Production
```bash
NOVA_AI_DEBUG=false
NOVA_AI_HOST=0.0.0.0
NOVA_AI_DATABASE_URL=postgresql://user:pass@db:5432/nova_ai
NOVA_AI_REDIS_URL=redis://redis:6379/0
NOVA_AI_SECRET_KEY=your-production-secret-key
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=astra_ai

# Run specific test categories
pytest tests/test_ai_service.py
pytest tests/test_api_endpoints.py
```

### Health Check Testing
```bash
# Test all services
curl http://localhost:8081/api/monitoring/health

# Test specific AI provider
curl -X POST http://localhost:8081/api/ai/test \
  -H "Content-Type: application/json" \
  -d '{"provider": "google"}'
```

## 📊 Performance Optimization

### Caching Strategy
- AI response caching with configurable TTL
- Database query result caching
- Static content caching
- Redis or in-memory cache options

### Load Balancing
- Round-robin provider selection
- Weighted load balancing
- Fastest provider selection
- Health-based routing

### Background Processing
- Asynchronous task processing
- Queue-based job management
- Retry mechanisms
- Task prioritization

## 🔧 Troubleshooting

### Common Issues

1. **API Key Errors**
   ```bash
   # Check API key configuration
   python start_enhanced_server.py --check-only
   ```

2. **Database Connection Issues**
   ```bash
   # Check database configuration and connectivity
   # Verify database service is running
   # Check connection string format
   ```

3. **Port Conflicts**
   ```bash
   # Use different ports
   python start_enhanced_server.py --api-port 9000 --ui-port 9001
   ```

4. **Memory Issues**
   ```bash
   # Monitor memory usage
   curl http://localhost:8081/api/monitoring/metrics
   ```

### Debug Mode
```bash
# Enable debug logging
python start_enhanced_server.py --debug

# Check logs
tail -f logs/nova_ai.log
```

## 🤝 Integration with Existing Astra AI

The enhanced server maintains full compatibility with the existing Astra AI desktop application:

- **Widget Integration**: All existing widgets (Search, News, Notepad, Object ID, Camera) work seamlessly
- **Nova AI Core**: Direct integration with the existing Nova AI chatbot
- **Memory System**: Preserves and enhances the existing memory functionality
- **UI Compatibility**: Desktop interface remains unchanged for users

## 📈 Scaling & Performance

### Horizontal Scaling
- Multiple server instances with load balancer
- Shared Redis cache and database
- Session affinity for WebSocket connections

### Vertical Scaling
- Configurable worker processes
- Memory and CPU optimization
- Database connection pooling

### Performance Monitoring
- Real-time metrics collection
- Performance alerting
- Capacity planning insights

## 🔄 Migration from Original Server

To migrate from the original `run_desktop_nova.py`:

1. **Backup existing data**
2. **Install enhanced dependencies**
3. **Copy configuration template**
4. **Set API keys**
5. **Start enhanced server**

The enhanced server can run alongside the original server during transition.

## 📞 Support & Documentation

- **Configuration Reference**: See `config_template.yaml`
- **API Documentation**: Available at `/api/docs` when server is running
- **Health Checks**: Monitor system status at `/api/monitoring/health`
- **Logs**: Check `logs/nova_ai.log` for detailed information

---

**Enhanced Nova AI Server** - A production-ready, scalable AI service hub for the modern enterprise. 🚀
