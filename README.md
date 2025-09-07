# Nova AI Assistant

Nova is an advanced AI assistant with enhanced memory and context understanding capabilities. It provides a natural, conversational interface while maintaining context and learning from interactions.

## Features

- 🧠 Advanced Memory System
  - Multi-tiered memory (short-term, mid-term, long-term)
  - Vector-based semantic search
  - Context-aware memory retrieval
  - Persistent conversation history

- 💬 Natural Conversation
  - Human-like responses with personality
  - Context maintenance across conversations
  - Dynamic response timing
  - Smart repetition detection

- 🔍 Internet Search Integration
  - Real-time web search capabilities
  - Smart search decision making
  - Source tracking and citation

- 🛠️ Modular Architecture
  - Plugin system for extensibility
  - Configurable components
  - Easy integration with external services

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/nova-ai.git
cd nova-ai
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up configuration:
```bash
cp config/config.example.json config/config.json
```
Edit `config/config.json` with your API keys and preferences.

## Configuration

The assistant can be configured through `config/config.json`. Key configuration options include:

- API Keys (Groq, SerpAPI)
- Memory System Settings
- Response Timing
- Logging Preferences

See `config/config.json` for all available options.

## Usage

### Terminal Mode

Run the assistant in terminal mode:
```bash
python -m astra_ai.core.nova_ai
```

### Python API

```python
from astra_ai.core.nova_ai import NovaAI

# Initialize the assistant
nova = NovaAI()

# Get a response
response = nova.generate_response("Hello, how are you?")
print(response)
```

## Development

### Project Structure

```
nova-ai/
├── astra_ai/
│   ├── core/
│   │   ├── nova_ai.py       # Main AI class
│   │   ├── config_manager.py # Configuration management
│   │   └── memory/          # Memory system components
│   ├── services/            # External service integrations
│   └── utils/               # Utility functions
├── config/
│   └── config.json         # Configuration file
├── data/                   # Data storage
├── tests/                  # Test suite
├── requirements.txt        # Dependencies
└── README.md              # This file
```

### Running Tests

```bash
pytest tests/
```

### Code Style

The project uses:
- Black for code formatting
- isort for import sorting
- mypy for type checking

Run formatting:
```bash
black .
isort .
mypy .
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details 