"""Compatibility import; implementation is owned by the Aegis core."""
import sys
from astra_ai.core import aegis_live_context as implementation
sys.modules[__name__] = implementation
