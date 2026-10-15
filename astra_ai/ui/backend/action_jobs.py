"""Compatibility import for the core-owned durable action queue."""
import sys
from astra_ai.core import action_jobs as implementation
sys.modules[__name__] = implementation
