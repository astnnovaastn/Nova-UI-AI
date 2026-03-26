#!/usr/bin/env python3
"""
Memory Auto-Optimizer System
===============================
High-performance file watcher that monitors nova_ai_memory.json for changes to:
- vector_index entries
- clusters
- CLUSTER_UPDATE log entries

When changes are detected, automatically reorganizes and improves the memory structure
using optimized clustering, formatting, and semantic grouping.

Features:
- Real-time file monitoring with debouncing
- Intelligent change detection (only acts on relevant sections)
- Automatic cluster reorganization
- Compact JSON formatting
- Coherence scoring and validation
- Thread-safe operations with atomic writes
- Comprehensive logging and metrics
- Integration with mem0_memory_system for enhanced functionality
"""

import json
import os
import time
import threading
import hashlib
import logging
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from itertools import combinations
from typing import Dict, List, Tuple, Optional
import shutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.FileHandler('memory_auto_optimizer.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class MemoryAutoOptimizer:
    """High-performance memory optimization engine."""

    def __init__(self, memory_path: str, check_interval: float = 2.0, debounce_delay: float = 1.5, memory_system_instance=None):
        """
        Initialize the optimizer.

        Args:
            memory_path: Path to nova_ai_memory.json
            check_interval: How often to check for file changes (seconds)
            debounce_delay: Delay before processing changes (prevents excessive updates)
            memory_system_instance: Optional reference to the memory system instance for enhanced integration
        """
        # Validate and store memory path
        if not memory_path:
            raise ValueError("memory_path is required")
        
        self.memory_path = Path(memory_path)
        self.check_interval = float(check_interval) if check_interval else 2.0
        self.debounce_delay = float(debounce_delay) if debounce_delay else 1.5
        self.memory_system = memory_system_instance  # Reference to memory system for enhanced functionality (may be None)
        self.is_running = False
        self.watcher_thread = None

        # State tracking
        self.last_file_hash = None
        self.last_check_time = 0
        self.pending_update = False
        self.update_lock = threading.Lock()

        # Change detection
        self.last_vector_index_hash = None
        self.last_clusters_hash = None
        self.last_update_log_hash = None

        # Metrics
        self.metrics = {
            'files_checked': 0,
            'changes_detected': 0,
            'optimizations_run': 0,
            'clusters_reorganized': 0,
            'events_reclustered': 0,
            'formatting_applied': 0,
            'errors': 0
        }

        if memory_system_instance:
            logger.info(f"MemoryAutoOptimizer initialized for {self.memory_path} and connected to memory system")
        else:
            logger.info(f"MemoryAutoOptimizer initialized for {self.memory_path} (standalone mode)")
    
    def start(self):
        """Start the file watcher in a background thread."""
        if self.is_running:
            logger.warning("Optimizer is already running")
            return
        
        self.is_running = True
        self.watcher_thread = threading.Thread(target=self._watch_loop, daemon=True)
        self.watcher_thread.start()
        logger.info("MemoryAutoOptimizer started")
    
    def stop(self):
        """Stop the file watcher."""
        self.is_running = False
        if self.watcher_thread:
            self.watcher_thread.join(timeout=5)
        logger.info("MemoryAutoOptimizer stopped")
    
    def _watch_loop(self):
        """Main watch loop - runs in background thread."""
        while self.is_running:
            try:
                self._check_and_optimize()
                time.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Error in watch loop: {e}", exc_info=True)
                self.metrics['errors'] += 1

    def _check_and_optimize(self):
        """Check for file changes and optimize if needed."""
        now = time.time()

        # Skip if too soon since last check
        if now - self.last_check_time < self.check_interval:
            return

        self.metrics['files_checked'] += 1
        self.last_check_time = now

        # Check if file exists and is readable
        if not self.memory_path.exists():
            return

        try:
            # Calculate current file hash
            current_hash = self._hash_file()

            # If file changed, trigger debounced update
            if current_hash != self.last_file_hash:
                self.last_file_hash = current_hash
                self.metrics['changes_detected'] += 1

                # Debounce: wait a bit before processing (file may still be written to)
                if not self.pending_update:
                    self.pending_update = True
                    threading.Timer(
                        self.debounce_delay,
                        self._process_changes
                    ).start()

        except Exception as e:
            logger.error(f"Error checking file: {e}")
            self.metrics['errors'] += 1
    
    def _hash_file(self) -> str:
        """Calculate MD5 hash of file for change detection."""
        hash_md5 = hashlib.md5()
        with open(self.memory_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def _process_changes(self):
        """Process detected changes - called after debounce delay."""
        with self.update_lock:
            try:
                self.pending_update = False

                # Load current memory with error handling
                try:
                    with open(self.memory_path, 'r', encoding='utf-8') as f:
                        content = f.read().strip()
                        if not content:
                            logger.warning(f"Memory file is empty: {self.memory_path}")
                            return
                        memory = json.loads(content)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to decode JSON from {self.memory_path}: {e}")
                    logger.error(f"File content (first 200 chars): {content[:200] if 'content' in locals() else 'N/A'}")
                    return
                except FileNotFoundError:
                    logger.warning(f"Memory file not found: {self.memory_path}")
                    return
                except PermissionError:
                    logger.error(f"Permission denied accessing file: {self.memory_path}")
                    return
                except Exception as e:
                    logger.error(f"Error reading memory file: {e}")
                    return

                engine = memory.get('memory_engine', {})

                # Check which sections changed
                changes = self._detect_section_changes(engine)

                if not changes:
                    return

                logger.info(f"Detected changes in: {changes}")

                # Run optimizations
                optimized = False

                if 'vector_index' in changes or 'clusters' in changes:
                    self._reorganize_clusters(engine)
                    optimized = True

                if 'update_log' in changes:
                    self._process_update_log(engine)
                    optimized = True

                if optimized:
                    # Format and save
                    self._format_and_save(memory)
                    self.metrics['optimizations_run'] += 1
                    logger.info(f"Optimization complete. Metrics: {self.metrics}")

                    # If there's a memory system instance, notify it of the changes
                    if self.memory_system and hasattr(self.memory_system, '_on_memory_optimized'):
                        try:
                            self.memory_system._on_memory_optimized(self.metrics.copy())
                        except Exception as e:
                            logger.warning(f"Error notifying memory system of optimization: {e}")

            except Exception as e:
                logger.error(f"Error processing changes: {e}", exc_info=True)
                self.metrics['errors'] += 1
    
    def _detect_section_changes(self, engine: Dict) -> List[str]:
        """Detect which sections have changed."""
        changes = []

        # Hash vector_index
        vi = engine.get('vector_index', {})
        vi_hash = hashlib.md5(json.dumps(vi, sort_keys=True).encode()).hexdigest()
        if vi_hash != self.last_vector_index_hash:
            changes.append('vector_index')
            self.last_vector_index_hash = vi_hash

        # Hash clusters
        clusters = engine.get('clusters', {})
        clusters_hash = hashlib.md5(json.dumps(clusters, sort_keys=True).encode()).hexdigest()
        if clusters_hash != self.last_clusters_hash:
            changes.append('clusters')
            self.last_clusters_hash = clusters_hash

        # Hash update_log
        update_log = engine.get('update_log', [])
        log_hash = hashlib.md5(json.dumps(update_log, sort_keys=True).encode()).hexdigest()
        if log_hash != self.last_update_log_hash:
            changes.append('update_log')
            self.last_update_log_hash = log_hash

        return changes
    
    def _reorganize_clusters(self, engine: Dict):
        """Reorganize clusters based on dominant tags and coherence."""
        events = {e['event_id']: e for e in engine.get('memory_events', [])}
        vector_index = engine.get('vector_index', {})
        
        if not events or not vector_index:
            return
        
        logger.info(f"Reorganizing {len(events)} events into clusters")
        
        # Group by dominant tag
        groups = defaultdict(list)
        for eid, event in events.items():
            tag = self._get_dominant_tag(event)
            groups[tag].append(eid)
        
        # Build optimized clusters
        new_clusters = {}
        for i, (tag, eids) in enumerate(sorted(groups.items(), key=lambda x: (-len(x[1]), x[0]))):
            cluster_id = f"cluster_{i:03d}"
            
            # Get vectors
            vectors = []
            confidences = []
            timestamps = []
            
            for eid in eids:
                if eid in vector_index:
                    vectors.append(vector_index[eid])
                conf = events[eid].get('emotional_context', {}).get('confidence')
                if isinstance(conf, (int, float)):
                    confidences.append(float(conf))
                ts = events[eid].get('timestamp')
                if ts:
                    timestamps.append(ts)
            
            # Compute metrics
            centroid = self._average_vectors(vectors) if vectors else []
            coherence = round(self._compute_coherence(vectors), 4) if vectors else 0.0
            avg_conf = round(sum(confidences) / len(confidences), 4) if confidences else 0.0
            last_updated = max(timestamps) if timestamps else None
            
            # Build cluster
            new_clusters[cluster_id] = {
                'topic': f"{tag} - Cluster",
                'label': f"{tag.replace('_', ' ').title()} Focus",
                'centroid_vector': centroid,
                'event_ids': eids,
                'coherence_score': coherence,
                'last_updated': last_updated,
                'metadata': {
                    'dominant_tags': [tag],
                    'cluster_type': 'auto_group',
                    'member_count': len(eids),
                    'average_confidence': avg_conf,
                    'temporal_span': 'computed',
                    'creation_timestamp': last_updated
                },
                'insights': {
                    'primary_pattern': tag,
                    'consistency': coherence,
                    'emotional_tone': 'mixed',
                    'frequency': 'auto'
                }
            }
        
        engine['clusters'] = new_clusters
        self.metrics['clusters_reorganized'] += 1
        self.metrics['events_reclustered'] += len(events)
        logger.info(f"Created {len(new_clusters)} clusters")
    
    def _get_dominant_tag(self, event: Dict) -> str:
        """Extract dominant emotion tag from event."""
        tags = event.get('emotional_context', {}).get('emotion_tags') or []
        if tags:
            return str(tags[0]).lower().replace(' ', '_')
        cat = event.get('category') or 'general'
        return str(cat).lower().replace(' ', '_')
    
    def _average_vectors(self, vectors: List[List[float]]) -> List[float]:
        """Compute element-wise average of vectors."""
        if not vectors:
            return []
        n = len(vectors)
        length = len(vectors[0])
        centroid = [0.0] * length
        for v in vectors:
            for i, x in enumerate(v):
                centroid[i] += float(x)
        return [round(x / n, 12) for x in centroid]
    
    def _compute_coherence(self, vectors: List[List[float]]) -> float:
        """Compute average pairwise cosine similarity."""
        if not vectors or len(vectors) == 1:
            return 1.0 if vectors else 0.0
        
        sims = []
        for a, b in combinations(vectors, 2):
            sims.append(self._cosine_similarity(a, b))
        
        return sum(sims) / len(sims) if sims else 0.0
    
    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Compute cosine similarity between two vectors."""
        if not a or not b or len(a) != len(b):
            return 0.0
        
        dot = sum(float(x) * float(y) for x, y in zip(a, b))
        norm_a = sum(float(x) * float(x) for x in a) ** 0.5
        norm_b = sum(float(y) * float(y) for y in b) ** 0.5
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        return dot / (norm_a * norm_b)
    
    def _process_update_log(self, engine: Dict):
        """Process CLUSTER_UPDATE entries to consolidate and deduplicate."""
        update_log = engine.get('update_log', [])
        
        # Filter and consolidate CLUSTER_UPDATE entries
        cluster_updates = [u for u in update_log if u.get('type') == 'CLUSTER_UPDATE']
        
        # Deduplicate: keep only latest update per cluster_id + operation
        seen = {}
        consolidated = []
        
        for update in sorted(cluster_updates, key=lambda x: x.get('timestamp', ''), reverse=True):
            key = (update.get('cluster_id'), update.get('operation'))
            if key not in seen:
                seen[key] = True
                consolidated.append(update)
        
        # Update log with consolidated entries
        non_cluster = [u for u in update_log if u.get('type') != 'CLUSTER_UPDATE']
        engine['update_log'] = non_cluster + consolidated
        
        logger.info(f"Consolidated {len(cluster_updates)} cluster updates to {len(consolidated)}")
    
    def _format_and_save(self, memory: Dict):
        """Format JSON compactly and save atomically."""
        try:
            # Format with compact arrays
            json_str = self._format_json_compact(memory, 0)

            # Ensure the JSON string is not empty
            if not json_str or json_str.strip() == '':
                raise ValueError("Generated JSON string is empty")

            # Atomic write: temp file -> backup -> replace
            temp_path = self.memory_path.with_suffix('.tmp')
            backup_path = self.memory_path.parent / f'{self.memory_path.stem}.backup'

            # Write to temp
            with open(temp_path, 'w', encoding='utf-8') as f:
                f.write(json_str)

            # Verify that the file was written and has content
            if temp_path.stat().st_size == 0:
                raise ValueError("Temporary file is empty after writing")

            # Validate temp file is valid JSON
            try:
                with open(temp_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if not content.strip():
                        raise json.JSONDecodeError("File is empty", content, 0)
                    json.loads(content)  # Just validate, don't assign
            except json.JSONDecodeError as json_err:
                logger.error(f"JSON validation failed: {json_err}")
                logger.error(f"Invalid JSON content: {content[:200]}...")  # Log first 200 chars
                raise

            # Backup current
            if self.memory_path.exists():
                shutil.copy(self.memory_path, backup_path)

            # Replace with temp
            temp_path.replace(self.memory_path)

            self.metrics['formatting_applied'] += 1
            logger.info(f"Memory saved successfully (backup: {backup_path})")

        except Exception as e:
            logger.error(f"Error saving memory: {e}", exc_info=True)
            self.metrics['errors'] += 1

            # Clean up temp file if something went wrong
            try:
                temp_path = self.memory_path.with_suffix('.tmp')
                if temp_path.exists():
                    temp_path.unlink()
            except:
                pass  # Ignore cleanup errors

            raise
    
    def _format_json_compact(self, obj, indent=0):
        """Format JSON with compact arrays and proper indentation."""
        ind = '  ' * indent
        next_ind = '  ' * (indent + 1)
        
        if isinstance(obj, dict):
            if not obj:
                return '{}'
            items = []
            for k, v in obj.items():
                key_str = json.dumps(k)
                if isinstance(v, list):
                    # Keep short arrays on one line
                    if len(v) <= 10 and (
                        (all(isinstance(x, (int, float)) for x in v)) or
                        (k == 'event_ids' and all(isinstance(x, str) for x in v)) or
                        (k == 'dominant_tags' and all(isinstance(x, str) for x in v))
                    ):
                        val_str = '[' + ', '.join(json.dumps(x) for x in v) + ']'
                    else:
                        val_items = [self._format_json_compact(item, indent + 2) for item in v]
                        val_str = '[\n' + next_ind + (',\n' + next_ind).join(val_items) + '\n' + ind + ']'
                elif isinstance(v, dict):
                    val_str = self._format_json_compact(v, indent + 1)
                else:
                    val_str = json.dumps(v)
                
                items.append(f'{next_ind}{key_str}: {val_str}')
            
            return '{\n' + ',\n'.join(items) + '\n' + ind + '}'
        
        elif isinstance(obj, list):
            if not obj:
                return '[]'
            if len(obj) <= 10 and all(isinstance(x, (int, float, str)) for x in obj):
                return '[' + ', '.join(json.dumps(x) for x in obj) + ']'
            items = [self._format_json_compact(item, indent + 1) for item in obj]
            return '[\n' + (',\n' + next_ind).join(next_ind + item for item in items) + '\n' + ind + ']'
        
        else:
            return json.dumps(obj)
    
    def get_metrics(self) -> Dict:
        """Return current metrics."""
        return self.metrics.copy()

    def reset_metrics(self):
        """Reset metrics counters."""
        for key in self.metrics:
            self.metrics[key] = 0

    def force_optimize(self):
        """Force an immediate optimization (useful for testing)."""
        logger.info("Force optimization triggered")
        self._process_changes()

    def set_memory_system(self, memory_system_instance):
        """Establish connection to memory system after initialization."""
        self.memory_system = memory_system_instance
        logger.info(f"MemoryAutoOptimizer connected to memory system instance")

    def get_memory_system(self):
        """Get the memory system instance."""
        return self.memory_system


# Convenient singleton instance
_optimizer_instance = None


def get_optimizer(memory_path: str = None, memory_system_instance=None, auto_start: bool = True) -> MemoryAutoOptimizer:
    """Get or create the global optimizer instance."""
    global _optimizer_instance

    if _optimizer_instance is None:
        if not memory_path:
            memory_path = r'c:\Users\afian\OneDrive\Desktop\Astra_ai\astra_ai\Date\nova_ai_memory.json'

        # Create optimizer - if no memory system provided, we'll connect later
        _optimizer_instance = MemoryAutoOptimizer(memory_path, memory_system_instance=memory_system_instance)
        if auto_start and memory_system_instance:
            _optimizer_instance.start()

    return _optimizer_instance


def connect_to_memory_system(memory_system_instance, memory_path: str = None):
    """Convenience function to connect the optimizer to a memory system instance."""
    if memory_path is None:
        # Try to get storage file from memory system instance
        memory_path = getattr(memory_system_instance, 'storage_file', None)
        if memory_path is None:
            # Try common memory file paths
            common_paths = [
                r'c:\Users\afian\OneDrive\Desktop\Astra_ai\astra_ai\Date\nova_ai_memory.json',
                os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'),
                'nova_ai_memory.json'
            ]
            for path in common_paths:
                if os.path.exists(path):
                    memory_path = path
                    break
            else:
                # Default to the common path
                memory_path = r'c:\Users\afian\OneDrive\Desktop\Astra_ai\astra_ai\Date\nova_ai_memory.json'

    optimizer = get_optimizer(memory_path=memory_path, memory_system_instance=memory_system_instance, auto_start=True)
    return optimizer


if __name__ == '__main__':
    # Example usage and testing
    import sys

    memory_file = r'c:\Users\afian\OneDrive\Desktop\Astra_ai\astra_ai\Date\nova_ai_memory.json'

    optimizer = MemoryAutoOptimizer(memory_file, check_interval=1.0)
    optimizer.start()

    logger.info("MemoryAutoOptimizer running. Press Ctrl+C to stop...")

    try:
        while True:
            time.sleep(5)
            metrics = optimizer.get_metrics()
            logger.info(f"Current metrics: {metrics}")
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        optimizer.stop()
        logger.info(f"Final metrics: {optimizer.get_metrics()}")
