# AI Organizer Integration

This document describes the integration of the AI Organizer into the Nova Memory AI System.

## Overview

The AI Organizer is a continuous monitoring system that enhances the Nova Memory AI by:

1. **Watching memory events** - Continuously monitors `nova_ai_memory.json` for new events
2. **Organizing information** - Structures raw data into meaningful categories
3. **Improving clarity** - Rewrites memory entries to make more sense
4. **Enhancing context** - Uses user context to better organize information
5. **Maintaining history** - Keeps track of processing operations

## Main Job

The AI Organizer's main job is to:
- **Watch** the JSON file for new messages
- **Wait** for events to be added
- **Organize** information much better when messages come in
- **Rewrite** content to make more sense based on user context
- **Structure** raw data into meaningful categories

## Implementation Details

### Files

- `Mem0_ai_organizer.py` - Event-based organizer (integrated with memory system)
- `continuous_organizer.py` - Continuous monitoring organizer
- `mem0_memory_system.py` - Integration with Nova Memory AI system
- `config/shorthand_map.json` - Configuration for shorthand expansion

### Integration Points

The AI Organizer works in two modes:

1. **Event-Based Processing** - Integrated into `NovaMemoryAI` class in `mem0_memory_system.py`
2. **Continuous Monitoring** - Standalone system in `continuous_organizer.py`

## Continuous Monitoring Mode

The continuous organizer runs as a background process:

```bash
cd astra_ai/memory
python continuous_organizer.py
```

This system will:
- Watch `data/nova_ai_memory.json` for new events
- Process each new event as it arrives
- Organize information to make more sense
- Rewrite entries for better clarity
- Structure data into meaningful categories

## Event-Based Processing Mode

When integrated with the memory system:
1. **Initialization** - The organizer is instantiated in the `NovaMemoryAI.__init__` method
2. **Processing** - The organizer is called in the `process_conversation` method after regular memory operations
3. **Configuration** - The organizer respects the `organizer_enabled` and `llm_enrich_enabled` flags

## Memory Categories

The AI Organizer supports 27+ memory categories:

1. USER_IDENTITY
2. PERSONAL_PREFERENCES
3. TASK_PROJECT_TRACKING
4. ACTIVITY_BEHAVIOR
5. USER_INSTRUCTIONS
6. CURRENT_STATE
7. PERSONAL_DEVELOPMENT
8. COMMUNICATION_BOUNDARIES
9. CONTEXTUAL_RULES
10. MULTI_IDENTITY
11. KNOWLEDGE_EXPERTISE
12. TOOL_INTEGRATION
13. RESPONSE_ADAPTATION
14. FILE_MEDIA
15. LONG_TERM_GOALS
16. COLLABORATOR_RELATIONSHIPS
17. DATA_PRIVACY
18. MULTIMODAL_PREFERENCES
19. SYSTEM_AWARENESS
20. SESSION_THEMES
21. META_MEMORY
22. TEMPORAL_PATTERNS
23. SEARCH_EXTERNAL_INFO
24. GREETING_PATTERNS
25. CONVERSATION_ANALYTICS
26. NEWS_WEATHER_HISTORY
27. TIMEZONE_PREFERENCES

## Configuration

The AI Organizer can be configured through the `ORGANIZER_CONFIG` dictionary:

```python
ORGANIZER_CONFIG = {
    'organizer_enabled': True,           # Enable/disable the organizer
    'llm_enrich_enabled': False,         # Enable/disable LLM enrichment
    'llm_backend': 'ollama',             # LLM backend to use
    'ollama_model': 'qwen2.5:3b',       # Ollama model for enrichment (updated to qwen2.5:3b)
    'dedup_threshold': 0.85,             # Similarity threshold for deduplication
    'shorthand_map_path': 'config/shorthand_map.json',  # Path to shorthand mappings
    'organizer_log_path': 'data/organizer_log.json'     # Path to organizer log
}
```

## Usage

The AI Organizer works in the background:

1. **Event-Based**: Automatically processes memory events during conversation
2. **Continuous**: Can run as a standalone monitoring system
3. **Organized Data**: Stores improved information in the memory file
4. **Works with `nova_ai_memory.json`** by default

## Features

### Continuous Monitoring
- Watches memory file for new events
- Processes events as they arrive
- Organizes information in real-time
- Maintains organized facts alongside raw events

### User Name Handling
- Uses "user" as default when no name provided
- Automatically switches to actual name when user provides it
- Updates all existing references from "user" to actual name
- Maintains relationship state tracking

### Rule-Based Processing (Phase A)
- Text normalization (casing, whitespace correction)
- Shorthand expansion (py → Python, js → JavaScript, etc.)
- Temporal pattern enrichment (ages, durations, relative times)
- Categorization into 27+ memory categories
- Canonical key generation and deduplication
- Provenance tracking

### Optional LLM Enrichment (Phase B)
When `llm_enrich_enabled` is True:
- Ambiguous entries are enriched with AI-generated summaries
- Categories are refined based on semantic understanding
- Human-readable text is improved for clarity
- Uses Qwen2.5:3b model by default

### Data Integrity
- Atomic file writes via temp file + os.replace
- Provenance metadata tracking
- Error handling with graceful degradation
- Idempotent operations (repeated runs don't create duplicates)

## Recommended Models for LLM Enrichment

For local LLM enrichment, the following models are recommended:

1. **Qwen2.5:3b** (default) - Good balance of capability and resource needs
2. **LLaMA 3.3 13B** - Strong reasoning, requires ≥24GB VRAM
3. **MPT-7B-Chat** - Lightweight, fast inference for smaller setups

## Privacy & Security
- LLM enrichment is disabled by default
- PII redaction when LLM enrichment is used
- Explicit opt-in required for LLM features
- All processing can run locally without external dependencies