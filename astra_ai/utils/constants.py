"""Constants used throughout Nova AI."""

from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
CONFIG_DIR = PROJECT_ROOT / "config"
DATA_DIR = PROJECT_ROOT / "data"
LOGS_DIR = PROJECT_ROOT / "logs"

# Memory settings
DEFAULT_MEMORY_SETTINGS = {
    "vector_memory": {
        "enabled": True,
        "max_short_term_size": 30,
        "max_mid_term_size": 100,
        "max_long_term_size": 1000,
        "similarity_threshold": 0.7
    },
    "mem0_ai": {
        "enabled": True,
        "batch_size": 10,
        "batch_timeout": 30,
        "cache_timeout": 300
    }
}

# Response settings
DEFAULT_RESPONSE_SETTINGS = {
    "timing": {
        "min_response_time": 0.1,
        "max_response_time": 0.3,
        "typing_speed_variation": 0.005
    },
    "style": {
        "repetition_threshold": 0.7,
        "max_generation_attempts": 3
    }
}

# Logging settings
DEFAULT_LOGGING_SETTINGS = {
    "level": "INFO",
    "file": "nova_ai.log",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
}

# API settings
DEFAULT_API_SETTINGS = {
    "timeout": 30,
    "max_retries": 3,
    "retry_delay": 1
}

# Search settings
DEFAULT_SEARCH_SETTINGS = {
    "max_results": 10,
    "timeout": 10,
    "cache_duration": 3600  # 1 hour
}

# Terminal settings
TERMINAL_SETTINGS = {
    "width": 80,
    "colors": {
        "primary": "\033[94m",  # Blue
        "secondary": "\033[92m",  # Green
        "warning": "\033[93m",  # Yellow
        "error": "\033[91m",  # Red
        "reset": "\033[0m"  # Reset
    }
}

# System messages
SYSTEM_MESSAGES = {
    "startup": "Nova AI initialized successfully",
    "shutdown": "Nova AI shutting down",
    "error": "An error occurred: {error}",
    "warning": "Warning: {message}",
    "info": "{message}"
}

# File extensions
SUPPORTED_EXTENSIONS = {
    "audio": [".mp3", ".wav", ".ogg", ".m4a"],
    "video": [".mp4", ".avi", ".mov", ".mkv"],
    "image": [".jpg", ".jpeg", ".png", ".gif"],
    "document": [".txt", ".pdf", ".doc", ".docx"]
}

# Memory types
MEMORY_TYPES = {
    "short_term": "short_term",
    "mid_term": "mid_term",
    "long_term": "long_term",
    "permanent": "permanent"
}

# Response types
RESPONSE_TYPES = {
    "text": "text",
    "code": "code",
    "search": "search",
    "error": "error",
    "system": "system"
}

# Environment variables
ENV_VARS = {
    "GROQ_API_KEY": "GROQ_API_KEY",
    "SERPAPI_KEY": "SERPAPI_KEY",
    "MEM0_API_KEY": "MEM0_API_KEY",
    "LOG_LEVEL": "NOVA_LOG_LEVEL",
    "CONFIG_PATH": "NOVA_CONFIG_PATH"
} 