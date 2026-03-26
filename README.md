# 🚀 Nova AI Assistant

A comprehensive AI-powered voice assistant with advanced memory management, web integration, and desktop automation capabilities.

## ✨ Features

### Core AI Capabilities
- **Voice Interaction**: Full speech-to-text and text-to-speech functionality
- **Smart Memory System**: Persistent memory with context-aware responses
- **Multi-Model Support**: Integration with Google Gemini and Groq AI models
- **Web Search**: Real-time information retrieval and web browsing

### Desktop Integration
- **Application Control**: Launch and manage desktop applications
- **File Operations**: Complete file system management
- **Browser Automation**: Web browsing and form filling
- **Screen Processing**: Visual analysis and screenshot interpretation

### Advanced Features
- **Flight Finder**: Real-time flight search and booking
- **Weather Reports**: Current and forecast weather data
- **Message Sending**: Automated communication across platforms
- **Reminder System**: Task scheduling and notifications
- **Code Assistant**: Intelligent code generation and debugging
- **Development Agent**: Automated development workflows

## 🛠️ Tech Stack

### Backend
- **Python 3.12+**: Core application framework
- **FastAPI/Flask**: Web server and API endpoints
- **SQLAlchemy**: Database ORM and management
- **FAISS**: Vector similarity search for memory
- **PyTorch**: Machine learning and NLP operations

### Frontend
- **React**: Modern web interface
- **Material-UI**: Responsive component library
- **WebSockets**: Real-time communication

### AI & ML
- **Google Gemini**: Advanced language model
- **Groq**: High-performance inference
- **Sentence Transformers**: Text embeddings
- **Mem0AI**: Memory management system

## 🚀 Quick Start

### Prerequisites
- Python 3.12 or higher
- Node.js 16+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nova-ai-assistant.git
   cd nova-ai-assistant
   ```

2. **Set up Python environment**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # On Windows
   # or
   source .venv/bin/activate  # On macOS/Linux
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   npm install
   ```

4. **Configure API keys**
   - Copy `config/api_keys.example.json` to `config/api_keys.json`
   - Add your API keys for Google Gemini and Groq

5. **Start the application**
   ```bash
   # Windows
   start_nova_ai.bat
   
   # Or manually:
   python main.py
   ```

The application will start on:
- Backend: `http://localhost:5001`
- Frontend: `http://localhost:3002`

## 📁 Project Structure

```
nova-ai-assistant/
├── astra_ai/                 # Core AI engine
│   ├── actions/             # Action modules
│   ├── agent/               # Task management
│   ├── memory/              # Memory system
│   └── ui/                  # User interface
├── config/                  # Configuration files
├── docs/                    # Documentation
├── tests/                   # Test suite
├── tools/                   # Utility tools
├── main.py                  # Entry point
├── requirements.txt         # Python dependencies
└── package.json            # Node.js dependencies
```

## 🔧 Configuration

### API Keys Setup
Create `config/api_keys.json`:
```json
{
  "google_gemini": "your-gemini-api-key",
  "groq": "your-groq-api-key",
  "serpapi": "your-serpapi-key"
}
```

### Memory Configuration
Memory settings in `memory/memory_config.json`:
- Vector database settings
- Retention policies
- Context window management

## 🎯 Usage Examples

### Voice Commands
```
"Hey Nova, what's the weather like today?"
"Open Chrome and search for AI news"
"Remind me to call John at 3 PM"
"Find flights from New York to London tomorrow"
```

### Code Assistance
```
"Write a Python function to sort a list"
"Debug this React component"
"Explain how async/await works"
```

### Desktop Automation
```
"Open Spotify and play my workout playlist"
"Take a screenshot and analyze it"
"Create a new folder called 'Project Files'"
```

## 🧪 Testing

Run the test suite:
```bash
pytest tests/
```

Run with coverage:
```bash
pytest --cov=astra_ai tests/
```

## 📚 Documentation

- [Implementation Guide](docs/IMPLEMENTATION_GUIDE.md)
- [Memory System](docs/MEMORY_SYSTEM.md)
- [API Reference](docs/API_REFERENCE.md)
- [Development Setup](docs/DEVELOPMENT.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Privacy & Security

- All API keys are stored locally and encrypted
- Voice data is processed locally when possible
- Memory data is stored in encrypted format
- No data is shared with third parties without explicit consent

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Check the [FAQ](docs/FAQ.md)
- Review the [troubleshooting guide](docs/TROUBLESHOOTING.md)

---

**Built with ❤️ by the Nova AI Team**
