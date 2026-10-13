"""Compatibility entry point for the shared schema-3 memory service."""
from .shared_memory import SharedMemory
from .legacy_live_memory import MAX_PROMPT_CHARS
SCHEMA_VERSION=3
LiveMemoryManager=SharedMemory
