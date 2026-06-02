#!/usr/bin/env python3
"""
Memory Auto-Optimizer Integration
===================================
Integrates the MemoryAutoOptimizer into the Mem0 memory system.
This module provides hooks and utilities for seamless integration.
"""

import logging
from astra_ai.memory.memory_auto_optimizer import MemoryAutoOptimizer, get_optimizer

logger = logging.getLogger(__name__)


class OptimizedMemoryManager:
    """Wrapper that adds auto-optimization to memory operations."""
    
    def __init__(self, memory_path: str, enable_auto_optimize: bool = True):
        """
        Initialize with optional auto-optimization.
        
        Args:
            memory_path: Path to nova_ai_memory.json
            enable_auto_optimize: Whether to enable background optimization
        """
        self.memory_path = memory_path
        self.enable_auto_optimize = enable_auto_optimize
        self.optimizer = None
        
        if enable_auto_optimize:
            self.optimizer = MemoryAutoOptimizer(memory_path)
            self.optimizer.start()
            logger.info("OptimizedMemoryManager initialized with auto-optimization enabled")
    
    def shutdown(self):
        """Cleanly shut down the optimizer."""
        if self.optimizer:
            self.optimizer.stop()
            logger.info("OptimizedMemoryManager shutdown complete")
    
    def get_metrics(self):
        """Get optimizer metrics."""
        return self.optimizer.get_metrics() if self.optimizer else {}
    
    def force_optimize(self):
        """Trigger immediate optimization."""
        if self.optimizer:
            self.optimizer.force_optimize()
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.shutdown()


def integrate_with_organizer(organizer_instance, memory_path: str = None):
    """
    Integrate auto-optimizer with an existing Mem0_ai_organizer instance.
    
    Usage:
        organizer = Mem0_ai_organizer()
        integrate_with_organizer(organizer)
        # Auto-optimization now runs in background
    
    Args:
        organizer_instance: The organizer to enhance
        memory_path: Optional path to memory file (auto-detected if None)
    """
    if memory_path is None:
        # Try to get path from organizer
        memory_path = getattr(organizer_instance, 'memory_path', None)
        if not memory_path:
            logger.warning("Could not auto-detect memory path; using default")
            memory_path = r'c:\Users\afian\OneDrive\Desktop\Astra_ai\astra_ai\Date\nova_ai_memory.json'
    
    optimizer = get_optimizer(memory_path, auto_start=True)
    organizer_instance._memory_optimizer = optimizer
    logger.info(f"Auto-optimizer integrated with organizer")
    
    return organizer_instance


def get_auto_optimizer_stats() -> dict:
    """Get statistics from the global optimizer instance."""
    optimizer = get_optimizer()
    return {
        'is_running': optimizer.is_running,
        'metrics': optimizer.get_metrics(),
        'memory_path': str(optimizer.memory_path)
    }


if __name__ == '__main__':
    # Demo: show how to use
    import time
    
    print("=== Memory Auto-Optimizer Integration Demo ===\n")
    
    with OptimizedMemoryManager(
        r'c:\Users\afian\OneDrive\Desktop\Astra_ai\astra_ai\Date\nova_ai_memory.json',
        enable_auto_optimize=True
    ) as mgr:
        print("Manager started. Running for 10 seconds...\n")
        for i in range(10):
            time.sleep(1)
            metrics = mgr.get_metrics()
            print(f"[{i+1}s] Metrics: Changes detected: {metrics['changes_detected']}, "
                  f"Optimizations run: {metrics['optimizations_run']}")
    
    print("\nDemo complete.")
