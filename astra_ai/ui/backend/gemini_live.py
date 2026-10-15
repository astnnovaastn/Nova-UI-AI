"""Compatibility import; implementation is owned by the Aegis core."""
import sys
from astra_ai.core import gemini_session as implementation
sys.modules[__name__] = implementation
