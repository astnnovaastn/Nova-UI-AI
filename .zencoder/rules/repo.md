# Nova AI Assistant Information

## Summary
Nova AI is an advanced AI assistant with enhanced memory and context understanding capabilities. It provides a natural, conversational interface while maintaining context and learning from interactions. The system features a multi-tiered memory system, natural conversation abilities, internet search integration, and a modular architecture.

## Structure
- **astra_ai/**: Main package containing core functionality
  - **core/**: Core AI components including the main Nova AI class
  - **memory/**: Memory system components for context retention
  - **services/**: External service integrations (news, weather, video analysis)
  - **speech/**: Voice input/output capabilities
  - **ui/**: User interface components
  - **utils/**: Utility functions and helpers
- **data/**: Data storage for memories, preferences, and conversation history
- **tests/**: Test suite for various components

## Language & Runtime
**Language**: Python
**Version**: Python 3.x
**Package Manager**: pip

## Dependencies
**Main Dependencies**:
- groq==0.3.1: API client for GROQ language models
- python-dotenv==1.0.1: Environment variable management
- requests==2.31.0: HTTP requests library
- numpy==1.24.3: Numerical computing
- faiss-cpu==1.7.4: Vector similarity search
- torch==2.1.0: Deep learning framework
- sentence-transformers==2.2.2: Text embeddings
- mem0ai>=0.1.0: Memory management system
- sqlalchemy==2.0.27: Database ORM
- pandas==2.1.0: Data analysis library

**Development Dependencies**:
- black==24.1.1: Code formatting
- isort==5.13.2: Import sorting
- mypy==1.8.0: Type checking
- pytest==8.0.0: Testing framework
- pytest-cov==4.1.0: Test coverage

## Build & Installation
```bash
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up configuration
cp config/config.example.json config/config.json
# Edit config.json with API keys and preferences
```

## Usage
**Terminal Mode**:
```bash
python -m astra_ai.core.nova_ai
```

**Python API**:
```python
from astra_ai.core.nova_ai import NovaAI

# Initialize the assistant
nova = NovaAI()

# Get a response
response = nova.generate_response("Hello, how are you?")
print(response)
```

## Testing
**Framework**: pytest
**Test Location**: tests/
**Run Command**:
```bash
pytest tests/
```

## Features
- **Advanced Memory System**: Multi-tiered memory with vector-based semantic search
- **Natural Conversation**: Human-like responses with personality and context maintenance
- **Internet Search Integration**: Real-time web search with smart decision making
- **News System**: Real-time news summaries from trusted sources
- **Voice Input Support**: Natural speech interaction with Whisper
- **Weather Service**: Current weather and forecasts for any location
- **Video Analysis**: AI-powered video content analysis