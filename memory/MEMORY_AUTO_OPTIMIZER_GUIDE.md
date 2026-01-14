# Memory Auto-Optimizer System

## Overview

The **Memory Auto-Optimizer** is a high-performance background system that continuously monitors `nova_ai_memory.json` for changes to critical memory sections (`vector_index`, `clusters`, `CLUSTER_UPDATE`) and automatically:

- **Reorganizes clusters** based on dominant emotion tags
- **Recomputes centroid vectors** and coherence scores
- **Deduplicates update log entries**
- **Applies compact JSON formatting** for readability and efficiency
- **Maintains atomic writes** with automatic backups

## Features

### 1. Real-Time File Monitoring
- Watches for file changes with configurable check interval (default: 2s)
- Debounced processing to prevent excessive updates
- Efficient MD5-based change detection
- Thread-safe operations with locking

### 2. Intelligent Change Detection
Only processes when relevant sections (`vector_index`, `clusters`, `update_log`) actually change. Ignores modifications to other sections.

### 3. Automatic Cluster Reorganization
- Groups events by **dominant emotion tag** (first emotion_tag or category)
- Computes **element-wise average centroid vectors**
- Calculates **pairwise cosine similarity coherence scores**
- Generates meaningful cluster labels and topics

### 4. Compact JSON Formatting
- Keeps short arrays on single lines: `"event_ids": ["evt_001", "evt_002", "evt_003"]`
- Preserves full vectors inline: `"centroid_vector": [0.12, 0.23, 0.34, ...]`
- Maintains 2-space indentation for readability
- Matches the style of `New_memory_event.json`

### 5. Comprehensive Metrics & Logging
- Tracks files checked, changes detected, optimizations run
- Logs all operations to `memory_auto_optimizer.log`
- Console output for real-time monitoring
- Periodic metric reporting

## Installation & Usage

### Basic Usage (Standalone)

```python
from astra_ai.memory.memory_auto_optimizer import MemoryAutoOptimizer

# Initialize
optimizer = MemoryAutoOptimizer(
    memory_path=r'path/to/nova_ai_memory.json',
    check_interval=2.0,        # Check every 2 seconds
    debounce_delay=1.5         # Wait 1.5s after change detected
)

# Start background monitoring
optimizer.start()

# ... your application runs ...

# Get metrics
metrics = optimizer.get_metrics()
print(f"Changes detected: {metrics['changes_detected']}")
print(f"Optimizations run: {metrics['optimizations_run']}")

# Stop when done
optimizer.stop()
```

### Integration with Mem0 Organizer

```python
from astra_ai.memory.optimizer_integration import integrate_with_organizer
from astra_ai.memory.Mem0_ai_organizer import Mem0_ai_organizer

# Create organizer
organizer = Mem0_ai_organizer()

# Integrate auto-optimizer
integrate_with_organizer(organizer)

# Auto-optimization now runs in background during all operations
organizer.process_new_event(user_input="I love pizza")
# Changes are automatically optimized as they're written
```

### Using OptimizedMemoryManager (Context Manager)

```python
from astra_ai.memory.optimizer_integration import OptimizedMemoryManager

with OptimizedMemoryManager(
    memory_path=r'path/to/nova_ai_memory.json',
    enable_auto_optimize=True
) as mgr:
    # Do your work - optimization happens automatically
    
    # Check metrics
    metrics = mgr.get_metrics()
    
    # Force immediate optimization if needed
    mgr.force_optimize()
    
# Auto-optimizer cleanly shuts down on exit
```

## Architecture

### Components

1. **MemoryAutoOptimizer** (`memory_auto_optimizer.py`)
   - Core watcher and optimization engine
   - File monitoring loop in background thread
   - Change detection and debouncing logic

2. **OptimizedMemoryManager** (`optimizer_integration.py`)
   - Wrapper for safe integration
   - Context manager support
   - Integration helper functions

3. **Test Suite** (`test_auto_optimizer.py`)
   - Demonstrates all features
   - Benchmarks performance
   - Validates formatting output

### Data Flow

```
nova_ai_memory.json (monitored)
         ↓
    [File Watcher] (background thread)
         ↓
  MD5 Hash Changed? → No → continue monitoring
         ↓ Yes
  [Debounce Timer] (wait 1.5s)
         ↓
  Load JSON + Detect Changes
         ↓
  ├─ vector_index changed? → Reorganize clusters
  ├─ clusters changed?     → Recompute metrics
  └─ update_log changed?   → Deduplicate entries
         ↓
  Format JSON (compact)
         ↓
  Atomic Write: temp → backup → replace
         ↓
  Update Metrics + Log
```

## Cluster Reorganization Algorithm

### Step 1: Extract Dominant Tag
For each event:
```python
dominant_tag = event['emotional_context']['emotion_tags'][0]
# Fallback: event['category']
# Final fallback: 'general'
```

### Step 2: Group by Tag
Group all events by their dominant tag:
```python
groups = {
    'interest': [evt_001, evt_003, evt_a, evt_b, ...],
    'food': [evt_005, evt_012, ...],
    'health': [evt_004, evt_010],
    ...
}
```

### Step 3: Compute Metrics per Group
For each group:
- **Centroid**: `centroid[i] = mean(vectors[j][i] for all j)`
- **Coherence**: `avg(cosine_similarity(v_a, v_b) for all pairs)`
- **Avg Confidence**: `mean(event_confidence for all events)`

### Step 4: Build Cluster Objects
Create cluster with:
- `centroid_vector` (computed)
- `coherence_score` (0.0 to 1.0)
- `event_ids` (all members)
- `metadata` (tags, type, member count, confidence)
- `insights` (pattern, consistency, tone, frequency)

## Performance Characteristics

### Time Complexity
- File hash calculation: O(n) where n = file size
- Change detection: O(m) where m = section size
- Cluster reorganization: O(k × e) where k = clusters, e = events per cluster
- Coherence calculation: O(c²) where c = vectors per cluster

### Space Complexity
- In-memory copy of memory file during optimization
- Temporary file for atomic write
- One backup copy (configurable retention)

### Typical Performance
- File monitoring: ~1-2ms per check cycle
- Change detection: ~5-10ms for section hashing
- Cluster reorganization (25 events): ~50-100ms
- JSON formatting + save: ~100-200ms
- Total end-to-end optimization: ~200-400ms

## Configuration

### Tuning Parameters

```python
optimizer = MemoryAutoOptimizer(
    memory_path='...',
    check_interval=2.0,      # How often to check file (seconds)
    debounce_delay=1.5       # Wait before processing (seconds)
)
```

**Recommendations:**
- **High frequency updates**: `check_interval=0.5`, `debounce_delay=1.0`
- **Low frequency updates**: `check_interval=5.0`, `debounce_delay=2.0`
- **Balanced (default)**: `check_interval=2.0`, `debounce_delay=1.5`

### Thresholds

Hard-coded optimization thresholds in the code:
- **Compact array threshold**: Arrays with ≤ 10 elements formatted on one line
- **Coherence score precision**: 4 decimal places
- **Vector rounding precision**: 12 decimal places

## Monitoring & Metrics

### Available Metrics

```python
metrics = optimizer.get_metrics()
# Returns:
{
    'files_checked': int,           # How many times file was checked
    'changes_detected': int,        # How many file changes detected
    'optimizations_run': int,       # How many times optimization ran
    'clusters_reorganized': int,    # Cluster reorg count
    'events_reclustered': int,      # Total events reprocessed
    'formatting_applied': int,      # Format + save operations
    'errors': int                   # Number of errors encountered
}
```

### Logging

All operations are logged to:
- **Console**: Real-time INFO/ERROR messages
- **File**: `memory_auto_optimizer.log` in current directory

Log entries include:
- File change detection
- Optimization start/completion
- Cluster statistics
- Performance metrics
- Error traces

Example log:
```
2025-11-15 15:30:45,123 [INFO] MemoryAutoOptimizer: Reorganizing 25 events into clusters
2025-11-15 15:30:45,234 [INFO] MemoryAutoOptimizer: Created 9 clusters
2025-11-15 15:30:45,456 [INFO] MemoryAutoOptimizer: Memory saved successfully
2025-11-15 15:30:45,457 [INFO] MemoryAutoOptimizer: Optimization complete. Metrics: {...}
```

## Testing

### Run Full Test Suite

```bash
python astra_ai/memory/test_auto_optimizer.py
```

Tests include:
1. **Monitoring Phase**: Watch system for 15 seconds
2. **Force Optimization**: Manually trigger optimization
3. **Change Detection**: Add cluster, observe auto-detection
4. **Formatting Demo**: Show before/after formatting
5. **Coherence Benchmark**: Performance measurement

### Quick Manual Test

```python
from astra_ai.memory.memory_auto_optimizer import MemoryAutoOptimizer

opt = MemoryAutoOptimizer(r'path/to/nova_ai_memory.json')
opt.start()
print("Running... metrics will update in real-time")
# Make changes to the JSON file in another process
input("Press Enter to stop...")
opt.stop()
print(opt.get_metrics())
```

## Error Handling

The system is resilient to errors:
- **File not found**: Silently skips check, retries next cycle
- **JSON parse error**: Logs error, continues monitoring, increments error count
- **Write failure**: Rolls back to backup, logs error, continues monitoring
- **Thread errors**: Caught and logged, doesn't crash main system

All errors are:
1. Logged with full traceback
2. Counted in metrics (`errors` field)
3. Non-fatal (system continues operating)

## Thread Safety

The optimizer uses:
- **Lock (`update_lock`)**: Protects file write operations
- **Thread-safe metrics**: Atomic counter updates
- **Daemon thread**: Background thread doesn't block shutdown
- **Graceful shutdown**: `stop()` waits up to 5 seconds for thread to exit

## Atomic Write Procedure

Ensures data integrity:

```
1. Write to temporary file (.tmp)
2. Validate JSON by parsing it
3. Backup current file (.backup)
4. Atomically replace with temp file
5. Log completion
```

This prevents corruption if:
- Process crashes during write
- Disk runs out of space
- Write is interrupted

## Future Enhancements

Possible improvements:
1. **Incremental clustering**: Only reprocess changed events
2. **Distributed hashing**: Use xxhash for faster file hashing
3. **Configurable clustering algorithm**: Support k-means, DBSCAN
4. **Metric persistence**: Save optimization history
5. **Auto-tuning**: Adjust thresholds based on performance
6. **Web UI**: Real-time monitoring dashboard
7. **Event hooks**: Callbacks on optimization events

## Troubleshooting

### High CPU Usage
- Increase `check_interval` (default: 2.0)
- Disable temporarily while not needed

### Missing optimizations
- Check log file for errors
- Verify file write permissions
- Ensure backup directory exists and is writable

### Slow file operations
- Check disk I/O speed
- Consider moving memory file to faster disk
- Reduce other processes' I/O

### Memory not updating
- Verify file path is correct
- Check file permissions
- Look for lock files preventing writes

## API Reference

### MemoryAutoOptimizer

```python
class MemoryAutoOptimizer:
    def __init__(memory_path, check_interval=2.0, debounce_delay=1.5)
    def start() -> None
    def stop() -> None
    def force_optimize() -> None
    def get_metrics() -> Dict
    def reset_metrics() -> None
```

### OptimizedMemoryManager

```python
class OptimizedMemoryManager:
    def __init__(memory_path, enable_auto_optimize=True)
    def shutdown() -> None
    def get_metrics() -> Dict
    def force_optimize() -> None
    # Context manager support
    def __enter__() -> OptimizedMemoryManager
    def __exit__(exc_type, exc_val, exc_tb) -> None
```

### Module Functions

```python
def get_optimizer(memory_path=None, auto_start=False) -> MemoryAutoOptimizer
def integrate_with_organizer(organizer, memory_path=None) -> organizer
def get_auto_optimizer_stats() -> Dict
```

## License

Part of the Astra AI system. See LICENSE for details.
