# AI Organizer with LLM Enhancement

The AI Organizer module now includes LLM enhancement capabilities that provide more sophisticated memory entry enhancement.

## Features

- Continuous monitoring of `nova_ai_memory.json` for new entries
- Reading original source of information when memory system adds new entries
- Interpreting context and rewriting summaries in-place
- Making entries clearer, more accurate, and richer
- Improving grammar, capitalization, and phrasing
- Personalizing references to the user
- Adding relevant context or inferred details
- Merging updates with existing memories when needed
- All without creating separate "ENRICH" events

## LLM Enhancement

When LLM enhancement is enabled, the organizer uses the Groq API to enhance memory entries with more sophisticated natural language processing.

### Configuration

To enable LLM enhancement, configure the organizer with:

```python
config = {
    'organizer_enabled': True,
    'memory_file_path': 'data/nova_ai_memory.json',
    'check_interval': 1.0,
    'llm_enabled': True,
    'llm_api_key': 'your_groq_api_key',
    'llm_model': 'llama-3.3-70b-versatile'
}
```

### How it Works

1. When a new memory entry is detected, the organizer first attempts to enhance it using the LLM
2. The LLM is provided with:
   - The user's name (if available)
   - Relevant user context from existing facts
   - The original memory entry text
3. The LLM generates an enhanced version that:
   - Improves grammar, capitalization, and phrasing
   - Personalizes references to the user
   - Adds relevant context or inferred details
   - Makes the entry more structured and meaningful
4. If LLM enhancement fails, the organizer falls back to rule-based enhancement
5. The enhanced text replaces the original summary in-place
6. Provenance information is added to track the enhancement

### Example Enhancements

Original: "user said they love py programming"
Enhanced: "Alex expressed enthusiasm for Python programming, indicating a strong interest in this area of coding."

Original: "user is from italy and wants to visit france next year"
Enhanced: "Alex is from Italy and plans to visit France next year."

## Fallback to Rule-Based Enhancement

If LLM enhancement is disabled or fails, the organizer automatically falls back to rule-based enhancement that includes:
- Text normalization
- Shorthand expansion
- Technology and country name normalization
- Grammar fixes
- Personalization of user references
- Context addition for short entries

## API Key Security

The LLM API key is stored in the configuration. For production use, it's recommended to:
1. Store the API key in environment variables
2. Use the `.env` file to load the key
3. Never commit API keys to version control

Example `.env` file:
```
GROQ_API_KEY=your_actual_api_key_here
```

Then load it in your code:
```python
import os
from dotenv import load_dotenv
load_dotenv()

config = {
    'llm_api_key': os.getenv('GROQ_API_KEY'),
    # ... other config options
}
```