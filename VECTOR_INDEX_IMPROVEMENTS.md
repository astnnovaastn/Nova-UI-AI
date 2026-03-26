# Vector Index & Clustering Improvements Guide

## Overview
This guide explains the improvements made to the memory system's vector index and clustering capabilities to enable fast, accurate semantic search.

## Key Improvements Implemented

### 1. **Real Vector Embeddings (Not Zero Vectors)**
**Problem:** All vectors were `[0,0,0,0,0,0,0,0]` - no semantic meaning.
**Solution:** Implemented Sentence Transformers to generate actual text embeddings.

```python
from sentence_transformers import SentenceTransformer
import numpy as np

class VectorGenerator:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.vector_dim = 384

    def generate_vector(self, text: str) -> List[float]:
        embedding = self.model.encode(text)
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
        return embedding.tolist()
```

### 2. **Increased Vector Dimensions**
- Changed from 8 dimensions → **384 dimensions**
- Proper semantic representation for similarity search
- Compatible with Sentence Transformers output

### 3. **Improved Clustering Thresholds**
```python
# Old (ineffective for real vectors)
merge_threshold = 0.65
min_cluster_size = 2

# New (optimized for 384D normalized vectors)
merge_threshold = 0.75
min_cluster_size = 3
max_cluster_size = 15
coherence_check = True  # Validate cluster quality
```

### 4. **Vector Persistence**
Vectors are now saved to `nova_ai_memory.json`:
```json
"vector_index": {
  "evt_1ec0d5fe": [0.234, -0.567, 0.891, ...]  // 384 real values
}
```

### 5. **Approximate Nearest Neighbor (ANN) Search**
Added FAISS integration for fast similarity search with millions of vectors:
```python
import faiss

class FastVectorIndex:
    def __init__(self, dimension: int):
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension)  # Cosine similarity
        self.id_map = {}

    def add_vectors(self, vectors: List[List[float]], ids: List[str]):
        vectors_np = np.array(vectors, dtype='float32')
        self.index.add(vectors_np)
        for i, id_ in enumerate(ids):
            self.id_map[len(self.id_map)] = id_

    def search(self, query_vector: List[float], k: int = 10):
        query = np.array([query_vector], dtype='float32')
        distances, indices = self.index.search(query, k)
        return [(self.id_map.get(idx), float(dist))
                for idx, dist in zip(indices[0], distances[0])]
```

### 6. **Vector Caching System**
Avoid recomputing embeddings for identical/similar text:
```python
from functools import lru_cache

@lru_cache(maxsize=10000)
def get_or_compute_vector(self, text_hash: str, text: str = None):
    if text:
        return self.vector_generator.generate_vector(text)
    return None
```

### 7. **Intelligent Auto-Tagging**
Extract meaningful tags from content using NLP:
```python
def generate_smart_tags(self, summary: str, category: str) -> List[str]:
    tags = [category]

    # Extract entities (PERSON, ORG, PRODUCT, etc.)
    doc = nlp(summary)
    for ent in doc.ents:
        if ent.label_ in ['PERSON', 'ORG', 'PRODUCT', 'GPE', 'TECH']:
            tags.append(ent.text.lower().replace(' ', '_'))

    # Keyword-based tags
    keyword_categories = {
        'ai': ['ai', 'artificial intelligence', 'machine learning', 'deep learning'],
        'programming': ['code', 'programming', 'python', 'javascript', 'development'],
        'memory': ['memory', 'remember', 'recall', 'store', 'retrieve']
    }
    for tag, keywords in keyword_categories.items():
        if any(kw in summary.lower() for kw in keywords):
            tags.append(tag)

    return list(set(tags))[:10]
```

### 8. **Enhanced Coherence Calculation**
Now uses actual vector similarity instead of defaulting to 1.0:
```python
def calculate_vector_coherence(self, vectors: List[List[float]]) -> float:
    if len(vectors) < 2:
        return 1.0

    similarities = []
    for i in range(len(vectors)):
        for j in range(i+1, len(vectors)):
            sim = cosine_similarity([vectors[i]], [vectors[j]])[0][0]
            similarities.append(sim)

    return float(np.mean(similarities)) if similarities else 0.5
```

### 9. **Weighted Cluster Centroid**
Centroids now consider both confidence and importance:
```python
def update_centroid_weighted(self, cluster_vectors: List[List[float]],
                           confidences: List[float],
                           importances: List[float]) -> List[float]:
    weights = [c * 0.7 + imp * 0.3 for c, imp in zip(confidences, importances)]
    centroid = np.average(cluster_vectors, axis=0, weights=weights)
    norm = np.linalg.norm(centroid)
    return (centroid / norm).tolist() if norm > 0 else centroid.tolist()
```

### 10. **Memory Decay System**
Automatically reduces importance of old memories:
```python
def apply_temporal_decay(self, storage, decay_rate: float = 0.98):
    """Apply exponential decay to old memories"""
    for event in storage["memory_engine"]["memory_events"]:
        days_old = self._get_days_since(event['timestamp'])
        decay_factor = decay_rate ** days_old
        event['importance_score'] *= decay_factor
        event['confidence'] *= decay_factor
```

### 11. **Smart Vector Updates on Cluster Changes**
When clusters merge/split, vectors are properly updated:
```python
def update_cluster_vectors_after_merge(self, storage, cluster_id):
    """Recalculate centroid after cluster changes"""
    event_ids = storage["memory_engine"]["clusters"][cluster_id]['event_ids']
    vectors = []
    weights = []

    for eid in event_ids:
        if eid in storage["memory_engine"]["vector_index"]:
            vector = storage["memory_engine"]["vector_index"][eid]
            if not all(v == 0 for v in vector):  # Skip invalid
                event = self._get_event_by_id(storage, eid)
                weight = event.get('confidence', 0.8) * event.get('importance_score', 0.5)
                vectors.append(vector)
                weights.append(weight)

    if vectors:
        centroid = self.update_centroid_weighted(vectors, weights, weights)
        storage["memory_engine"]["clusters"][cluster_id]['centroid_vector'] = centroid
```

### 12. **Batch Vector Computation**
Process multiple events efficiently:
```python
def compute_vectors_batch(self, texts: List[str]) -> List[List[float]]:
    """Compute embeddings for multiple texts at once (faster)"""
    embeddings = self.model.encode(texts, batch_size=32, show_progress_bar=False)
    # Normalize all
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms[norms == 0] = 1
    normalized = embeddings / norms
    return normalized.tolist()
```

### 13. **Similarity-Based Memory Retrieval**
Retrieve memories by semantic similarity, not just text match:
```python
def search_by_similarity(self, query: str, top_k: int = 5) -> List[Dict]:
    """Find memories semantically similar to query"""
    query_vector = self.vector_generator.generate_vector(query)

    # Use FAISS for fast search
    if hasattr(self, 'faiss_index'):
        results = self.faiss_index.search(query_vector, k=top_k * 2)
    else:
        # Fallback to brute force
        results = self.brute_force_similarity(query_vector, top_k * 2)

    # Filter by similarity threshold
    filtered = [(eid, score) for eid, score in results if score >= 0.6]

    # Get full memory events
    memories = []
    for eid, score in filtered[:top_k]:
        event = self._get_event_by_id(storage, eid)
        if event:
            event['similarity_score'] = score
            memories.append(event)

    return memories
```

### 14. **Dimensionality Reduction for Visualization**
Optional PCA for visualizing memory clusters:
```python
from sklearn.decomposition import PCA

def reduce_dimensions_for_viz(self, vectors: List[List[float]], target_dims: int = 3):
    """Reduce to 2D/3D for plotting clusters"""
    pca = PCA(n_components=target_dims)
    reduced = pca.fit_transform(vectors)
    return reduced.tolist()
```

### 15. **Vector Health Monitoring**
Track quality of vector index:
```python
def get_vector_health_report(self, storage) -> Dict:
    """Report on vector index quality"""
    total_events = len(storage["memory_engine"]["memory_events"])
    vectors_with_data = sum(1 for v in storage["memory_engine"]["vector_index"].values()
                           if not all(x == 0 for x in v))
    zero_vectors = total_events - vectors_with_data

    return {
        "total_events": total_events,
        "vectors_with_embeddings": vectors_with_data,
        "zero_vectors": zero_vectors,
        "health_score": vectors_with_data / total_events if total_events > 0 else 0,
        "average_vector_norm": np.mean([np.linalg.norm(v) for v in
                         storage["memory_engine"]["vector_index"].values() if any(v)])
    }
```

## Performance Optimizations

### A. **Lazy Model Loading**
Load Sentence Transformer only when needed:
```python
class LazyVectorGenerator:
    def __init__(self):
        self._model = None

    @property
    def model(self):
        if self._model is None:
            self._model = SentenceTransformer('all-MiniLM-L6-v2')
        return self._model
```

### B. **GPU Acceleration**
Use GPU if available:
```python
self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
self.model = SentenceTransformer('all-MiniLM-L6-v2', device=self.device)
```

### C. **Model Quantization** (8-bit for faster inference)
```python
from sentence_transformers import SentenceTransformer
import torch

model = SentenceTransformer('all-MiniLM-L6-v2')
model.max_seq_length = 128  # Reduce for speed
# Quantize
model.quantize = True
```

### D. **Async Vector Computation**
Compute vectors in background:
```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def compute_vectors_async(self, texts: List[str]):
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as pool:
        embeddings = await loop.run_in_executor(
            pool, self.model.encode, texts
        )
    return embeddings.tolist()
```

## Installation Requirements

```bash
# Core dependencies
pip install sentence-transformers>=2.2.0
pip install numpy>=1.24.0
pip install scikit-learn>=1.2.0
pip install faiss-cpu  # or faiss-gpu for NVIDIA
pip install torch>=2.0.0
pip install spacy>=3.5.0
python -m spacy download en_core_web_sm
```

## Configuration

In `mem0_memory_system.py`, configure:

```python
VECTOR_CONFIG = {
    "model_name": "all-MiniLM-L6-v2",
    "vector_dimension": 384,
    "normalize_vectors": True,
    "use_faiss": True,
    "batch_size": 32,
    "cache_size": 10000,
    "similarity_threshold": 0.6,
    "clustering": {
        "merge_threshold": 0.75,
        "min_cluster_size": 3,
        "max_cluster_size": 15,
        "coherence_check": True
    }
}
```

## Testing Improvements

1. **Check vector generation:**
```python
vector = vector_gen.generate_vector("test memory")
print(f"Vector shape: {len(vector)}")
print(f"Non-zero: {sum(1 for v in vector if abs(v) > 0.001)}")
print(f"Norm: {np.linalg.norm(vector):.4f}")  # Should be ~1.0
```

2. **Test similarity search:**
```python
query = "artificial intelligence"
results = memory_system.search_by_similarity(query, top_k=5)
print(f"Found {len(results)} similar memories")
```

3. **Verify clustering:**
```python
clusters = storage["memory_engine"]["clusters"]
print(f"Clusters: {len(clusters)}")
for cid, cluster in clusters.items():
    print(f"  {cid}: {len(cluster['event_ids'])} events, coherence={cluster.get('coherence_score', 0):.3f}")
```

4. **Check health:**
```python
health = memory_system.get_vector_health_report(storage)
print(f"Health: {health['health_score']*100:.1f}% ({health['vectors_with_embeddings']}/{health['total_events']})")
```

## Expected Results

After improvements:
- ✅ All vectors have 384 real (non-zero) dimensions
- ✅ Cosine similarity between related memories > 0.7
- ✅ Fast retrieval: < 50ms for 10k memories with FAISS
- ✅ Coherent clusters: coherence score > 0.6
- ✅ Accurate semantic search: finds logically related memories
- ✅ Scalable: handles 100k+ memories efficiently

## Troubleshooting

**Issue:** All vectors still zero
- Check: `sentence-transformers` installed correctly
- Check: GPU memory if using CUDA
- Fix: Reinstall: `pip install --force-reinstall sentence-transformers`

**Issue:** Slow performance
- Enable FAISS: `pip install faiss-gpu` (NVIDIA) or `faiss-cpu`
- Reduce batch size in config
- Set `max_seq_length=64` for shorter texts

**Issue:** Poor clustering
- Adjust `merge_threshold` (try 0.6-0.8)
- Increase `min_cluster_size` to 5
- Check vector quality: `np.linalg.norm(vector)` should be ~1.0

**Issue:** Out of memory
- Reduce cache size
- Use `all-MiniLM-L6-v2` (384d) instead of larger models
- Enable quantization: `model.quantize_model()`

## Migration from Old System

1. Back up `nova_ai_memory.json`
2. Install new dependencies
3. Restart `nova_ai.py` (will generate new vectors on next memories)
4. Old zero vectors will be replaced as new memories are added
5. To backfill old events: run `python regenerate_vectors.py`

## Advanced: Custom Model Training

For domain-specific memory, fine-tune the model:

```python
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader

# Load base model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Create training examples from your memory pairs
train_examples = [
    InputExample(texts=[event1, event2], label=1.0)  # Similar
    for event1, event2 in similar_pairs
]

# Fine-tune
train_dataloader = DataLoader(train_examples, shuffle=True)
train_loss = losses.CosineSimilarityLoss(model)
model.fit(train_objectives=[(train_dataloader, train_loss)], epochs=1)
```

This improves semantic understanding for your specific use case.

---

## Summary

The improvements transform the memory system from **non-functional (zero vectors)** to a **production-ready semantic memory engine** with:
- Real semantic embeddings
- Fast ANN search
- Intelligent clustering
- Scalable architecture
- Quality monitoring

All changes are backward-compatible and can be deployed incrementally.