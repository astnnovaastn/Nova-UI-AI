# Nova AI Assistant

Nova is an advanced AI assistant with enhanced memory and context understanding capabilities. It provides a natural, conversational interface while maintaining context and learning from interactions.

## Features

- 🧠 Advanced Memory System
  - Multi-tiered memory (short-term, mid-term, long-term)
  - Vector-based semantic search
  - Context-aware memory retrieval
  - Persistent conversation history
  - AI-powered memory enhancement

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

**Nova Memory System (mem0_memory_system.py)**

Overview
- Purpose: A dedicated persistent memory agent for Nova (the main AI). It stores, retrieves, and manages user facts, preferences, session context, and search preferences using a 27-category framework.
- Architecture: User ↔ Nova (main AI) ↔ NovaMemoryAI / AdvancedMemoryAgent ↔ JSON storage (default `nova_memory.json`).

Key Concepts
- MemoryAgent: Core classes are `NovaMemoryAI` and `AdvancedMemoryAgent`. These provide the API Nova uses to interact with persistent memory. The module exports these symbols via `__all__`.
- Categories: The memory uses a comprehensive `MemoryCategory` enum (22 categories) to organize facts (e.g., `user_identity`, `personal_preferences`, `session_themes`, `search_external_info`).
- MemoryItem: Each stored fact is modeled by a `MemoryItem` dataclass with metadata (confidence, timestamps, privacy_level, tags, relationships).
- Adaptive Learning: The `AdaptiveLearningEngine` + `ComprehensiveCategoryDetector` analyze incoming messages to detect facts, patterns, and preferences.
- Privacy & Retention: Category schemas include retention_policy and privacy_default. The memory manager applies cleanup rules and privacy controls.
- AI Memory Organizer: Continuously monitors memory entries and enhances them in-place for clarity, accuracy, and richness without creating separate events.

How it starts when `nova_ai.py` runs

1. Import and instantiate
- Typical import in `nova_ai.py`:

```
from astra_ai.memory.mem0_memory_system import NovaMemoryAI
# or for the simplified agent wrapper
from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent
```

2. Initialization at startup
- `nova_ai.py` should create an agent instance during startup (synchronously or as part of the AI bootstrap):

```
memory_agent = NovaMemoryAI(storage_file="nova_memory.json")
memory_agent.load_memory()
memory_agent._initialize_session()
# or if using AdvancedMemoryAgent wrapper
agent = AdvancedMemoryAgent(storage_file="nova_memory.json")
agent.load_memory()
agent._initialize_session()
```

- What happens inside these steps (high level):
  - The agent loads existing JSON storage from disk (or creates an empty structure).
  - Category schemas, cleanup rules, and detectors are initialized (detectors include regex patterns and adaptive learning bootstraps).
  - Session metadata is created (session id, start timestamp) so that session-scoped categories are tracked.
  - AI Memory Organizer is started to continuously monitor and enhance memory entries.

3. Conversation loop integration
- On each incoming user message and Nova response, `nova_ai.py` calls the memory agent to process and store memory operations:

```
# After Nova generates `ai_response` to `user_message`
memory_agent.process_conversation(user_message, ai_response)

# Useful calls Nova may use
memory_agent.get_user_context()          # short context facts
memory_agent.get_comprehensive_user_profile()  # when user asks "what do you know about me?"
memory_agent.query_memory("when did I say I like X")
```

- Internally `process_conversation` runs the category detector and adaptive learning engine which:
  - Detects facts and preferences using pattern matching and semantic detection.
  - Converts detections to memory operations (ADD/UPDATE/DELETE).
  - Stores `MemoryItem` entries into categorized JSON structure with timestamps, confidence, and privacy.
  - Updates session and history logs, and adjusts confidence/importance scores.

API Reference (high level)
- Exported symbols: `__all__ = ['NovaMemoryAI', 'MemoryEventType', 'AdvancedMemoryAgent']`
- Important classes & methods:
  - `NovaMemoryAI(storage_file: str = "nova_memory.json")`
    - `load_memory()` — load or initialize storage from disk
    - `save_memory()` — persist memory to disk
    - `process_conversation(user_message: str, ai_response: str)` — analyze and store memory operations
    - `get_comprehensive_user_profile()` — return summarized facts across categories
    - `query_memory(question: str)` — retrieve memories related to a query
    - `get_session_info()`, `end_session()` — session lifecycle

  - `AdvancedMemoryAgent(storage_file: str = "nova_memory.json")`
    - Wrapper around `NovaMemoryAI` with simpler compatibility API for legacy code

  - `MemoryEventType` — enum for operations: `ADD`, `UPDATE`, `DELETE`, `GET`, `CONSOLIDATE`, `CONFIRM`, `FORGET`.

Usage Examples
- Initialize agent and basic loop

```
from astra_ai.memory.mem0_memory_system import NovaMemoryAI

agent = NovaMemoryAI(storage_file="nova_memory.json")
agent.load_memory()

# Example conversation
user_msg = "My name is Alex and I prefer short answers"
ai_resp = "Nice to meet you, Alex. I'll keep replies short."
agent.process_conversation(user_msg, ai_resp)

# Later, when user asks:
print(agent.get_comprehensive_user_profile())
```

- Querying memory

```
result = agent.query_memory("what do you know about my preferences")
print(result)
```

Startup Hooks and Best Practices
- Call `load_memory()` early in your app startup so memory is available before handling messages.
- Initialize session context (`_initialize_session()` or equivalent) to track session-bound categories and greeting suppression.
- Ensure `save_memory()` is called periodically and on graceful shutdown to persist changes.
- Respect privacy: sensitive categories (e.g., `data_privacy`, `communication_boundaries`) default to stricter handling.
- The AI Memory Organizer automatically runs in the background to enhance memory entries in-place.

Troubleshooting
- Indentation/syntax errors: ensure imported files have correct Python syntax. If `nova_ai.py` doesn't start, check tracebacks for exact line numbers.
- Memory not persisting: confirm `storage_file` path is writable and `save_memory()` is called.
- Repeated greetings: ensure session initialization and `mark_greeting_completed()` are called after first greeting.
- Memory enhancement not working: ensure the AI Memory Organizer is properly initialized and running.

Developer Notes & Next Steps
- Tests: add unit tests for `process_conversation`, `detect_categories`, and `cleanup_memories`.
- CLI tooling: provide a small script to inspect `nova_memory.json` and run queries.
- Optional: add async support if Nova runs on async event loop.