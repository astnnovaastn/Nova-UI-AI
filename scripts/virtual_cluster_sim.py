"""
Virtual Cluster Simulator — interactive single-file version

Features:
- Persistent store: data/high_virtual_memory.json
- Encoder: SentenceTransformer (preferred) or TF-IDF fallback
- Agglomerative (Ward) clustering to group events
- Annoy index (optional) or brute-force fallback for fast search
- Automatic create vs update decision:
    * exact item match -> update
    * else if nearest-event similarity >= update_threshold -> update
    * else -> create
- Recomputes clusters after each create/update so search is up-to-date
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone, timedelta
from typing import List, Tuple, Optional

ROOT = os.path.dirname(os.path.dirname(__file__))
STORE = os.path.join(ROOT, 'data', 'high_virtual_memory.json')

# Configuration / Tunables
UPDATE_THRESHOLD_DEFAULT = 0.70
MIN_SIM_FOR_UPDATE = 0.75
RECENCY_HALF_LIFE_HOURS = 168  # 1 week half-life for recency bonus
MIN_MEMBER_COUNT_FOR_MERGE = 2
VERBOSE = False
# Dimensionality reduction settings
ENABLE_DR = True
DR_METHOD = 'pca'  # 'pca' or 'umap' (umap optional)
DR_DIM = 50
# Clustering/merge tuning
MERGE_SIM_THRESHOLD = 0.72  # cosine similarity threshold to merge singletons into existing clusters
ADAPTIVE_DIVISOR = 3  # controls how aggressively we reduce cluster count for small datasets
CLUSTER_MERGE_THRESHOLD = 0.65  # centroid cosine threshold to merge small clusters with similar ones

# deps
try:
    import numpy as np
except Exception:
    print('Missing numpy: pip install numpy')
    raise

# optional transformer
try:
    from sentence_transformers import SentenceTransformer
    _HAS_TRANSFORMER = True
except Exception:
    SentenceTransformer = None
    _HAS_TRANSFORMER = False

# clustering / tfidf
try:
    from sklearn.cluster import AgglomerativeClustering
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.preprocessing import normalize
except Exception:
    print('Missing scikit-learn: pip install scikit-learn')
    raise

# optional Annoy
try:
    from annoy import AnnoyIndex
    _HAS_ANNOY = True
except Exception:
    AnnoyIndex = None
    _HAS_ANNOY = False


# -------------------------
# Store helpers
# -------------------------
def load_store() -> dict:
    data_dir = os.path.dirname(STORE)
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    if not os.path.exists(STORE):
        store = _create_fresh_store()
        save_store(store)
        return store
    try:
        with open(STORE, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if not content:
                raise ValueError('File is empty')
            return json.loads(content)
    except (json.JSONDecodeError, ValueError) as e:
        print(f'Warning: corrupted JSON file ({e}). Creating fresh store.')
        store = _create_fresh_store()
        save_store(store)
        return store


def _create_fresh_store() -> dict:
    """Create a new store with the user-centric nested structure."""
    now = now_iso()
    return {
        'user': {
            'user_id': 'usr_astra',
            'name': 'Astra',
            'created_at': now,
            'status': 'active',
            'total_sessions': 0,
            'last_seen': now,
            'relationship_established': False
        },
        'memory_engine': {
            'metadata': {
                'version': '2.0',
                'generated_at': now,
                'description': 'Advanced memory engine with topic-based clustering, contradiction detection, and semantic vector indexing'
            },
            'memory_events': [],
            'vector_index': {},
            'clusters': {}
        },
        'conversation': [],
        'fact_history': {
            'personal_preferences': {
                'likes': [],
                'dislikes': [],
                'interests': [],
                'conditional': []
            },
            'wellness': {
                'exercises': [],
                'nutrition': []
            },
            'activity_behavior': {
                'daily_routines': [],
                'weekly_patterns': []
            },
            'personal_development': {
                'learning_goals': []
            }
        },
        'sessions': {},
        'current_session': None,
        'conversation_state': {
            'greeting_completed': False,
            'introduction_phase': True,
            'established_user': False
        },
        'memory_categories': {
            'user_identity': {},
            'personal_preferences': {},
            'activity_behavior': {},
            'wellness': {},
            'personal_development': {},
            'temporal_patterns': {}
        },
        'clustering_metrics': {
            'last_computed': now,
            'avg_coherence': 0.0,
            'num_clusters': 0,
            'num_events': 0,
            'quality': {}
        }
    }


def save_store(store: dict):
    # Atomic write to avoid corruption when saving large JSON files
    tmp = STORE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(store, f, indent=2, ensure_ascii=False)
    try:
        os.replace(tmp, STORE)
    except Exception:
        # best-effort fallback
        os.remove(tmp)
        with open(STORE, 'w', encoding='utf-8') as f:
            json.dump(store, f, indent=2, ensure_ascii=False)


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# -------------------------
# Encoder
# -------------------------
class Encoder:
    def __init__(self, model_name: str = 'sentence-transformers/all-MiniLM-L6-v2', tfidf_dim: int = 384):
        self.model = None
        if _HAS_TRANSFORMER:
            try:
                self.model = SentenceTransformer(model_name)
            except Exception:
                self.model = None
        self.tfidf = TfidfVectorizer(max_features=tfidf_dim)
        self._tfidf_fitted = False

    def encode(self, texts: List[str]):
        if self.model is not None:
            vecs = self.model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
            arr = np.array(vecs, dtype=float)
            # Ensure L2 normalization for downstream cosine calculations
            try:
                from sklearn.preprocessing import normalize as _sk_normalize
                return _sk_normalize(arr, norm='l2')
            except Exception:
                norms = np.linalg.norm(arr, axis=1, keepdims=True)
                norms[norms == 0] = 1.0
                return arr / norms
        # TF-IDF fallback
        if not self._tfidf_fitted:
            self.tfidf.fit(texts)
            self._tfidf_fitted = True
        arr = self.tfidf.transform(texts).toarray().astype(float)
        return normalize(arr, norm='l2')


# -------------------------
# Additional system helpers (upgrade checklist scaffolding)
# -------------------------
def sanitize_input(text: str) -> Optional[str]:
    """Normalize and clean incoming text. Returns None if text is too short or junk.

    - Lowercase, trim, collapse whitespace
    - Remove control characters and obvious junk
    - Reject very short or only-numeric strings
    """
    if not text or not isinstance(text, str):
        return None
    t = ' '.join(text.split())  # collapse whitespace
    t = t.strip()
    if len(t) < 3:
        return None
    lower = t.lower()
    # remove control/unprintable
    if any(ord(c) < 32 for c in lower):
        lower = ''.join(c for c in lower if ord(c) >= 32)
    # drop extremely short tokens
    tokens = [w for w in lower.split() if len(w) > 1]
    if not tokens:
        return None
    # reject strings that are mostly punctuation or numbers
    alnum = sum(c.isalnum() for c in lower)
    if alnum / max(1, len(lower)) < 0.3:
        return None
    return lower


def should_process(text: str, min_len: int = 8, max_len: int = 600) -> bool:
    """Heuristic to filter extremely short/long inputs before pipeline."""
    if not text:
        return False
    l = len(text)
    if l < min_len:
        return False
    if l > max_len:
        return False
    return True


def compute_cluster_quality_metrics(emb: np.ndarray, labels: List[int]) -> dict:
    """Compute silhouette and Davies–Bouldin if possible. Return dict of metrics."""
    metrics = {}
    try:
        from sklearn.metrics import silhouette_score, davies_bouldin_score
        if len(set(labels)) > 1 and emb.shape[0] > len(set(labels)):
            metrics['silhouette'] = float(silhouette_score(emb, labels))
            metrics['davies_bouldin'] = float(davies_bouldin_score(emb, labels))
    except Exception:
        pass
    return metrics


def auto_label_cluster(texts: List[str], top_n: int = 3) -> str:
    """Generate a short label for a cluster using TF-IDF keywords."""
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        vec = TfidfVectorizer(max_features=200, stop_words='english')
        X = vec.fit_transform(texts)
        sums = X.sum(axis=0)
        terms = vec.get_feature_names_out()
        scores = [(terms[i], float(sums[0, i])) for i in range(len(terms))]
        scores.sort(key=lambda x: x[1], reverse=True)
        top = [s[0] for s in scores[:top_n]]
        return ' '.join(top).title() if top else 'Misc'
    except Exception:
        # fallback: first meaningful word from the first text
        if texts:
            for w in texts[0].split():
                if len(w) > 3:
                    return w.title()
        return 'Misc'


def build_cluster_indexes(store: dict, enc: Encoder):
    """Placeholder: build per-cluster ANN indexes and record metadata.

    This builds in-memory FastIndex objects and records index timestamps.
    """
    store.setdefault('cluster_indexes', {})
    for cid, c in store.get('clusters', {}).items():
        member_ids = c.get('event_ids', [])
        texts = []
        for eid in member_ids:
            ev = next((e for e in store.get('memory_events', []) if e['event_id'] == eid), None)
            if ev:
                texts.append(ev.get('summary', ''))
        if not texts:
            continue
        vecs = enc.encode(texts)
        try:
            idx = FastIndex(vecs)
            store['cluster_indexes'][cid] = {'built_at': now_iso(), 'member_count': len(texts)}
        except Exception:
            store['cluster_indexes'][cid] = {'built_at': None, 'member_count': len(texts)}


def record_feedback(store: dict, event_id: str, action: str):
    """Record user feedback actions: 'accept','ignore','edit','delete'."""
    fb = {'event_id': event_id, 'action': action, 'timestamp': now_iso()}
    store.setdefault('feedback_log', []).append(fb)
    # bump usage stats for cluster (if we can find it)
    for cid, c in store.get('clusters', {}).items():
        if event_id in c.get('event_ids', []):
            meta = c.setdefault('metadata', {})
            stats = meta.setdefault('usage_stats', {'access_count': 0, 'last_access': None})
            stats['access_count'] = stats.get('access_count', 0) + 1
            stats['last_access'] = now_iso()
            break
    save_store(store)


def merge_clusters(store: dict, cid_from: str, cid_to: str):
    """Manual merge: move members from cid_from into cid_to and recompute clusters."""
    cfrom = store.get('clusters', {}).get(cid_from)
    cto = store.get('clusters', {}).get(cid_to)
    if not cfrom or not cto:
        return False
    cto['event_ids'].extend([e for e in cfrom['event_ids'] if e not in cto['event_ids']])
    # remove old cluster
    store['clusters'].pop(cid_from, None)
    save_store(store)
    return True


def split_cluster(store: dict, cid: str, keep_ids: List[str], move_ids: List[str]):
    """Manual split: create new cluster from move_ids and keep the rest."""
    if cid not in store.get('clusters', {}):
        return None
    new_cid = f"cluster_sim_{len(store['clusters'])+1:03d}"
    store['clusters'][cid]['event_ids'] = [e for e in store['clusters'][cid]['event_ids'] if e not in move_ids]
    store['clusters'][new_cid] = {
        'topic': 'Split Cluster',
        'label': 'Split',
        'centroid_vector': [],
        'event_ids': move_ids,
        'coherence_score': 0.0,
        'last_updated': now_iso(),
        'metadata': {'member_count': len(move_ids)},
        'insights': {}
    }
    save_store(store)
    return new_cid



# -------------------------
# Clustering + index helpers
# -------------------------
def build_clusters(embeddings: np.ndarray, n_clusters: int):
    n_samples = embeddings.shape[0]
    k = min(max(1, n_clusters), n_samples)
    if k == 1:
        labels = np.zeros(n_samples, dtype=int)
    else:
        clusterer = AgglomerativeClustering(n_clusters=k, linkage='ward')
        labels = clusterer.fit_predict(embeddings)
    return labels


class FastIndex:
    def __init__(self, vectors: np.ndarray, n_trees: int = 10):
        self.vectors = vectors
        self.dim = vectors.shape[1]
        self._annoy = None
        if _HAS_ANNOY:
            try:
                self._annoy = AnnoyIndex(self.dim, 'angular')
                for i, v in enumerate(vectors):
                    self._annoy.add_item(i, v.tolist())
                self._annoy.build(n_trees)
            except Exception:
                self._annoy = None

    def query(self, qvec: np.ndarray, topk: int = 5):
        q = qvec.tolist()
        if self._annoy is not None:
            ids, dists = self._annoy.get_nns_by_vector(q, topk, include_distances=True)
            return ids, dists
        # brute-force cosine similarity fallback
        dots = self.vectors @ qvec
        norms = np.linalg.norm(self.vectors, axis=1) * np.linalg.norm(qvec)
        sims = np.zeros_like(dots)
        nonzero = norms > 0
        sims[nonzero] = dots[nonzero] / norms[nonzero]
        idx = np.argsort(-sims)[:topk]
        # return ids and dissimilarity (1 - sim) to match Annoy-like distances
        return idx.tolist(), (1.0 - sims[idx]).tolist()


# -------------------------
# Higher-level store operations
# -------------------------
def recompute_store_clusters(store: dict, enc: Encoder, n_clusters: int = 10):
    """Recompute clusters with improved coherence checking and semantic validation.
    
    IMPROVEMENTS:
    - Calculates cluster coherence to validate group quality
    - Ensures semantic consistency within clusters
    - Identifies and reports fragmentation issues
    - Adaptive clustering based on data density
    """
    # Access memory_events from nested structure
    memory_events = store.get('memory_engine', {}).get('memory_events', [])
    texts = [e.get('summary', '') for e in memory_events]
    if not texts:
        store['memory_engine']['vector_index'] = {}
        store['memory_engine']['clusters'] = {}
        save_store(store)
        return store
    
    emb = enc.encode(texts)
    if emb.ndim == 1:
        emb = emb.reshape(1, -1)

    # Optionally reduce dimensionality for clustering (keeps original embeddings for index)
    emb_for_clustering = emb
    try:
        if ENABLE_DR and emb.shape[1] > DR_DIM:
            if DR_METHOD == 'umap':
                try:
                    import umap
                    reducer = umap.UMAP(n_components=DR_DIM, random_state=42)
                    emb_for_clustering = reducer.fit_transform(emb)
                except Exception:
                    # fallback to PCA
                    from sklearn.decomposition import PCA
                    reducer = PCA(n_components=min(DR_DIM, emb.shape[1]))
                    emb_for_clustering = reducer.fit_transform(emb)
            else:
                from sklearn.decomposition import PCA
                reducer = PCA(n_components=min(DR_DIM, emb.shape[1]))
                emb_for_clustering = reducer.fit_transform(emb)
    except Exception:
        emb_for_clustering = emb
    
    # update vector_index in nested structure
    for idx, e in enumerate(memory_events):
        eid = e['event_id']
        store['memory_engine']['vector_index'][eid] = emb[idx].tolist()
    
    # Adaptive clustering
    n_samples = len(texts)
    adaptive_k = min(n_clusters, max(1, n_samples // ADAPTIVE_DIVISOR))

    labels = build_clusters(emb_for_clustering, adaptive_k)
    clusters = {}
    from collections import defaultdict
    groups = defaultdict(list)
    for i, lab in enumerate(labels):
        groups[int(lab)].append(i)

    # Post-process: merge singleton clusters
    try:
        centroids = {}
        for lab, members in list(groups.items()):
            if len(members) > 0:
                vecs = emb_for_clustering[members]
                c = vecs.mean(axis=0)
                norm = np.linalg.norm(c)
                if norm > 0:
                    centroids[lab] = c / norm
                else:
                    centroids[lab] = c

        singleton_labs = [lab for lab, members in list(groups.items()) if len(members) == 1]
        for s_lab in singleton_labs:
            member_idx = groups[s_lab][0]
            v = emb_for_clustering[member_idx]
            vn = np.linalg.norm(v)
            if vn > 0:
                v_unit = v / vn
            else:
                v_unit = v

            best_lab = None
            best_sim = -1.0
            for lab, c in centroids.items():
                if lab == s_lab:
                    continue
                sim = float(np.dot(v_unit, c))
                if sim > best_sim:
                    best_sim = sim
                    best_lab = lab

            if best_lab is not None and best_sim >= MERGE_SIM_THRESHOLD:
                groups[best_lab].append(member_idx)
                del groups[s_lab]
                new_vecs = emb_for_clustering[groups[best_lab]]
                c = new_vecs.mean(axis=0)
                cn = np.linalg.norm(c)
                centroids[best_lab] = c / cn if cn > 0 else c
    except Exception:
        pass
    
    # Quality metrics
    total_coherence = 0.0
    fragmented_count = 0
    
    for lab, members in groups.items():
        cid = f'cluster_sim_{lab:03d}'
        eids = [memory_events[i]['event_id'] for i in members]
        centroid_arr = emb[members].mean(axis=0)
        norm = np.linalg.norm(centroid_arr)
        if norm > 0:
            centroid = (centroid_arr / (norm + 1e-12)).tolist()
        else:
            centroid = centroid_arr.tolist()
        
        primary_item = memory_events[members[0]].get('item', 'general')
        member_texts = [memory_events[i].get('summary', '') for i in members]
        
        # Infer cluster topic from member events
        member_topics = []
        for i in members:
            ev_text = memory_events[i].get('summary', '')
            intent_info = extract_intent(ev_text)
            member_topics.append(intent_info.get('topic', 'General'))
        topic_counts = {}
        for mtop in member_topics:
            topic_counts[mtop] = topic_counts.get(mtop, 0) + 1
        dominant_topic = max(topic_counts, key=topic_counts.get) if topic_counts else 'General'
        
        auto_label = auto_label_cluster(member_texts)
        topic = f"{dominant_topic} - {auto_label} Cluster"
        label = f"{auto_label}"
        
        # Calculate coherence
        member_embs = emb_for_clustering[members]
        coherence = 1.0
        intra_cluster_sims = []
        
        if len(members) > 1:
            try:
                norms = np.linalg.norm(member_embs, axis=1, keepdims=True)
                safe = norms.copy()
                safe[safe == 0] = 1.0
                normed = member_embs / safe
                for i in range(len(members)):
                    for j in range(i+1, len(members)):
                        sim = float(np.dot(normed[i], normed[j]))
                        intra_cluster_sims.append(sim)
                coherence = float(np.mean(intra_cluster_sims)) if intra_cluster_sims else 1.0
            except Exception:
                coherence = 0.0
            total_coherence += coherence
            
            if coherence < 0.5 and len(members) > 1:
                fragmented_count += 1
        else:
            total_coherence += 1.0
        
        # Collect metadata
        all_tags = set()
        all_sentiments = []
        all_confidences = []
        all_items = set()
        
        for i in members:
            ev = memory_events[i]
            tags = ev.get('emotional_context', {}).get('emotion_tags', [])
            all_tags.update(tags)
            all_sentiments.append(ev.get('emotional_context', {}).get('sentiment', 'neutral'))
            all_confidences.append(ev.get('confidence', 0.85))
            all_items.add(ev.get('item', ''))
        
        sentiment_counts = {}
        for s in all_sentiments:
            sentiment_counts[s] = sentiment_counts.get(s, 0) + 1
        
        dominant_sentiment = max(sentiment_counts, key=sentiment_counts.get) if sentiment_counts else 'neutral'
        consistency_level = "High" if coherence > 0.7 else "Medium" if coherence > 0.4 else "Low"
        temporal_span = f"{len(members)} events" if len(members) > 1 else "single event"
        
        metadata = {
            'dominant_tags': list(all_tags)[:5],
            'dominant_items': list(all_items),
            'cluster_type': 'personal_preferences',
            'member_count': len(eids),
            'average_confidence': float(np.mean(all_confidences)) if all_confidences else 0.85,
            'temporal_span': temporal_span,
            'creation_timestamp': memory_events[members[0]].get('timestamp', ''),
            'activity_type': 'preference',
            'quality_score': coherence
        }
        
        insights = {
            'primary_pattern': f"{primary_item}_preference",
            'consistency': consistency_level,
            'emotional_tone': f"{dominant_sentiment}_preference",
            'frequency': 'recurring' if len(members) > 1 else 'new',
            'member_sentiments': sentiment_counts,
            'dominant_sentiment': dominant_sentiment,
            'coherence_quality': "high" if coherence > 0.7 else "medium" if coherence > 0.4 else "low"
        }
        
        clusters[cid] = {
            'topic': topic,
            'label': label,
            'centroid_vector': centroid,
            'event_ids': eids,
            'coherence_score': coherence,
            'last_updated': now_iso(),
            'metadata': metadata,
            'insights': insights
        }
        clusters[cid]['metadata']['silhouette_mean'] = None
    
    store['memory_engine']['clusters'] = clusters

    # Post-cluster merge
    try:
        id_to_idx = {e['event_id']: i for i, e in enumerate(memory_events)}
        cluster_ids = list(clusters.keys())
        to_remove = set()
        for i in range(len(cluster_ids)):
            cid_i = cluster_ids[i]
            if cid_i in to_remove:
                continue
            ci = np.array(clusters[cid_i]['centroid_vector'], dtype=float)
            ni = np.linalg.norm(ci)
            if ni == 0:
                continue
            topic_i = clusters[cid_i].get('topic', 'General')
            if ' - ' in topic_i:
                topic_i = topic_i.split(' - ')[0].strip()
            
            for j in range(i + 1, len(cluster_ids)):
                cid_j = cluster_ids[j]
                if cid_j in to_remove:
                    continue
                cj = np.array(clusters[cid_j]['centroid_vector'], dtype=float)
                nj = np.linalg.norm(cj)
                if nj == 0:
                    continue
                topic_j = clusters[cid_j].get('topic', 'General')
                if ' - ' in topic_j:
                    topic_j = topic_j.split(' - ')[0].strip()
                
                if topic_i != topic_j and topic_i != 'General' and topic_j != 'General':
                    continue
                
                sim = float(np.dot(ci, cj) / (ni * nj))
                tag_overlap = False
                tags_i = set(clusters[cid_i]['metadata'].get('dominant_tags', []))
                tags_j = set(clusters[cid_j]['metadata'].get('dominant_tags', []))
                if tags_i and tags_j and tags_i.intersection(tags_j):
                    tag_overlap = True

                if sim >= CLUSTER_MERGE_THRESHOLD or tag_overlap:
                    mi = clusters[cid_i]['metadata'].get('member_count', len(clusters[cid_i]['event_ids']))
                    mj = clusters[cid_j]['metadata'].get('member_count', len(clusters[cid_j]['event_ids']))
                    if mi >= mj:
                        keep, merge = cid_i, cid_j
                    else:
                        keep, merge = cid_j, cid_i
                    for eid in clusters[merge]['event_ids']:
                        if eid not in clusters[keep]['event_ids']:
                            clusters[keep]['event_ids'].append(eid)
                    clusters[keep]['metadata']['member_count'] = len(clusters[keep]['event_ids'])
                    to_remove.add(merge)
        for rid in to_remove:
            clusters.pop(rid, None)
        for cid, c in clusters.items():
            eids = c.get('event_ids', [])
            if not eids:
                continue
            idxs = [id_to_idx[eid] for eid in eids if eid in id_to_idx]
            if not idxs:
                continue
            centroid_arr = emb[idxs].mean(axis=0)
            clusters[cid]['centroid_vector'] = centroid_arr.tolist()
            clusters[cid]['metadata']['member_count'] = len(eids)
    except Exception:
        pass
    
    # Update clustering metrics
    avg_coherence = total_coherence / len(clusters) if clusters else 0.0
    fragmentation_ratio = fragmented_count / len(clusters) if clusters else 0.0

    try:
        quality_metrics = compute_cluster_quality_metrics(emb_for_clustering, list(labels))
    except Exception:
        quality_metrics = {}
    store['clustering_metrics'].update({
        'last_computed': now_iso(),
        'avg_coherence': avg_coherence,
        'fragmentation_ratio': fragmentation_ratio,
        'num_clusters': len(clusters),
        'num_events': n_samples,
        'quality': quality_metrics,
    })

    try:
        from sklearn.metrics import silhouette_samples
        if len(set(labels)) > 1:
            sample_scores = silhouette_samples(emb_for_clustering, labels)
            for lab, members in groups.items():
                cid = f'cluster_sim_{lab:03d}'
                if members:
                    vals = [float(sample_scores[i]) for i in members]
                    store_cluster = clusters.get(cid)
                    if store_cluster:
                        store_cluster['metadata']['silhouette_mean'] = float(sum(vals) / len(vals))
    except Exception:
        pass

    # Update memory_engine metadata timestamp
    store['memory_engine']['metadata']['generated_at'] = now_iso()
    
    save_store(store)
    return store


# -------------------------
# Simple intent/item extraction
# -------------------------
def extract_intent(text: str) -> dict:
    """Extract sentiment, semantic item/concept, and topic category from text.
    
    IMPROVEMENTS:
    - Pure semantic item extraction (identifies core concept)
    - Maps all text variations to canonical semantic concepts
    - Topic/category inference for intelligent clustering
    - Negation detection for contradiction handling
    - Returns {'item', 'sentiment', 'topic', 'has_negation'}
    """
    t = text.lower()
    
    # Semantic item mapping with topic assignment (item, topic)
    semantic_map = {
        ('football', 'soccer', 'sport', 'play', 'playing', 'weekend'): ('football', 'Health'),
        ('anime', 'series', 'seres', 'show', 'watch', 'entertainment'): ('anime', 'Entertainment'),
        ('coffee', 'dark roast', 'black', 'caffeine', 'cup', 'beverage'): ('coffee', 'Food'),
        ('read', 'reading', 'book', 'novel', 'sci-fi', 'science fiction', 'fantasy', 'author', 'brandon', 'sanderson'): ('reading', 'Entertainment'),
        ('walk', 'walking', 'exercise', 'morning', 'routine', '45 minutes'): ('morning_walk', 'Health'),
        ('italian', 'pasta', 'cuisine', 'restaurant'): ('italian_food', 'Food'),
        ('movie', 'movies', 'film', 'films', 'action', 'cinema'): ('movies', 'Entertainment'),
        ('game', 'gaming', 'video', 'play game', 'rpg'): ('gaming', 'Entertainment'),
        ('cook', 'cooking', 'meal', 'prepare', 'therapeutic'): ('cooking', 'Food'),
        ('travel', 'traveling', 'visiting', 'trip', 'place', 'destination', 'beach'): ('travel', 'Wellness'),
        ('learn', 'learning', 'python', 'code', 'programming', 'development', 'web'): ('learning', 'Technology'),
        ('yoga', 'meditation', 'mindful', 'relax', 'calm', 'zen'): ('yoga', 'Wellness'),
        ('guitar', 'music', 'instrument', 'play music'): ('guitar', 'Entertainment'),
        ('friend', 'friends', 'social', 'hang', 'buddy', 'group'): ('friends', 'Social'),
        ('swim', 'swimming', 'pool', 'ocean'): ('swimming', 'Health'),
        ('hike', 'hiking', 'trail', 'mountain'): ('hiking', 'Health'),
        ('paint', 'painting', 'art', 'canvas'): ('painting', 'Entertainment'),
        ('photo', 'photography'): ('photography', 'Entertainment'),
        ('volunteer', 'volunteering', 'shelter', 'helping'): ('volunteering', 'Social'),
        ('garden', 'gardening', 'vegetable'): ('gardening', 'Food'),
    }
    
    # Extract semantic item and topic using priority-based matching
    item = None
    topic = 'General'
    for keywords, (canonical_item, canonical_topic) in semantic_map.items():
        for kw in keywords:
            if (' ' in kw and kw in t) or (f' {kw} ' in f' {t} '):
                item = canonical_item
                topic = canonical_topic
                break
        if item:
            break
    
    # Fallback if no semantic match
    if not item:
        tokens = [w for w in t.split() if len(w) > 3]
        item = tokens[0] if tokens else 'activity'
        topic = 'General'
    
    # Extract sentiment and negation
    sentiment = 'neutral'
    has_negation = any(word in t for word in ["don't", "dont", "not", "never", "doesn't", "isnt", "isn't", "wasn't", "no longer", "stopped"])
    
    if any(word in t for word in ["don't like", "dont like", "dislike", "hate", "avoid", "hated", "disliked", "not like"]):
        sentiment = 'negative'
    elif any(word in t for word in ["love", "enjoy", "prefer", "adore", "like", "amazing", "awesome", "great"]):
        sentiment = 'positive'
    
    return {'item': item, 'sentiment': sentiment, 'topic': topic, 'has_negation': has_negation}


def find_existing_event_by_item(store: dict, item: str) -> Optional[dict]:
    """Find event by exact or fuzzy item match with strict semantic matching."""
    from difflib import SequenceMatcher
    
    it = item.lower().strip()
    best_match = None
    best_score = 0.0
    
    # Access memory_events from nested structure
    memory_events = store.get('memory_engine', {}).get('memory_events', [])
    
    for ev in memory_events:
        ev_item = ev.get('item', '').lower().strip()
        ev_summary = ev.get('summary', '').lower()
        
        # Level 1: Exact match on item field (highest priority)
        if it == ev_item:
            return ev
        
        # Level 2: Check if item appears in summary (high priority)
        if it in ev_summary or ev_item in it:
            best_match = ev
            best_score = 0.95
            continue
        
        # Level 3: Fuzzy string matching for typos (medium priority)
        sim = SequenceMatcher(None, it, ev_item).ratio()
        if sim > 0.85 and sim > best_score:
            best_match = ev
            best_score = sim
    
    return best_match if best_score >= 0.85 else None


def find_best_event_by_similarity(store: dict, enc: Encoder, query: str, update_threshold: float = 0.70) -> Tuple[Optional[dict], float, str]:
    """Find best matching event by multi-level similarity analysis."""
    memory_events = store.get('memory_engine', {}).get('memory_events', [])
    if not memory_events:
        return None, 0.0, "no_events"
    
    texts = [e.get('summary', '') for e in memory_events]
    vecs = enc.encode(texts)
    if vecs.ndim == 1:
        vecs = vecs.reshape(1, -1)
    
    index = FastIndex(vecs)
    qvec = enc.encode([query])[0]
    ids, dists = index.query(qvec, topk=5)
    
    if not ids:
        return None, 0.0, "no_match"
    
    best_match = None
    best_sim = 0.0
    match_reason = "no_match"
    
    for rank, idx in enumerate(ids):
        best_idx = int(idx)
        ev = memory_events[best_idx]
        
        # cosine similarity
        text_sim = float(np.dot(vecs[best_idx], qvec))

        # Scoring with bonuses
        query_intent = extract_intent(query)
        query_sent = query_intent.get('sentiment', 'neutral')
        ev_sent = ev.get('emotional_context', {}).get('sentiment', 'neutral')
        sentiment_bonus = 0.05 if query_sent == ev_sent else -0.03

        item_bonus = 0.12 if query_intent.get('item') == ev.get('item') else 0.0

        try:
            ev_ts = ev.get('timestamp')
            ev_age_hours = 0.0
            if ev_ts:
                ev_age_hours = (datetime.now(timezone.utc) - datetime.fromisoformat(ev_ts.replace('Z','+00:00'))).total_seconds() / 3600.0
            recency_bonus = 0.05 * (1.0 / (1.0 + ev_age_hours / RECENCY_HALF_LIFE_HOURS))
        except Exception:
            recency_bonus = 0.0

        conf_bonus = float(ev.get('confidence', 0.85) - 0.85) * 0.2

        adjusted_sim = text_sim + sentiment_bonus + item_bonus + recency_bonus + conf_bonus

        reason = f"rank{rank} text_sim={text_sim:.3f} item_bonus={item_bonus:.2f} sent_bonus={sentiment_bonus:.2f} recency={recency_bonus:.3f}"

        if adjusted_sim >= update_threshold and adjusted_sim > best_sim:
            best_match = ev
            best_sim = adjusted_sim
            match_reason = reason
    
    return best_match, best_sim, match_reason


def create_event(store: dict, summary: str, item: str, sentiment: str, enc: Encoder) -> str:
    # Extract full intent including topic and negation for smarter routing
    intent = extract_intent(summary)
    topic = intent.get('topic', 'General')
    has_negation = intent.get('has_negation', False)
    eid = f"evt_sim_{int(time.time() * 1000)}"
    timestamp = now_iso()

    # Access memory_events from nested structure
    memory_events = store['memory_engine'].setdefault('memory_events', [])
    
    # Duplicate avoidance + contradiction detection
    try:
        cand, score, reason = find_best_event_by_similarity(store, enc, summary, update_threshold=MIN_SIM_FOR_UPDATE)
        if cand and score >= MIN_SIM_FOR_UPDATE:
            existing_sentiment = cand.get('emotional_context', {}).get('sentiment', 'neutral')
            if has_negation and existing_sentiment in ['positive', 'neutral']:
                if VERBOSE:
                    print(f"[CONTRADICTION-DETECT] detected contradiction in {cand['event_id']}, updating")
                return update_event(store, cand, summary, sentiment, enc, reason='contradiction_update')
            if VERBOSE:
                print(f"[AUTO-CONVERT] create -> update candidate {cand['event_id']} score={score:.3f} reason={reason}")
            return update_event(store, cand, summary, sentiment, enc)
    except Exception:
        pass
    
    # Determine emotional context
    valence_map = {'positive': 0.8, 'neutral': 0.5, 'negative': 0.2}
    arousal_map = {'positive': 0.7, 'neutral': 0.5, 'negative': 0.6}
    intensity_map = {'positive': 0.7, 'neutral': 0.3, 'negative': 0.6}
    mood_map = {'positive': 'happy', 'neutral': 'normal', 'negative': 'concerned'}
    
    valence = valence_map.get(sentiment, 0.5)
    arousal = arousal_map.get(sentiment, 0.5)
    intensity = intensity_map.get(sentiment, 0.5)
    mood = mood_map.get(sentiment, 'normal')
    
    # Extract emotion tags
    emotion_tags = [item]
    if 'morning' in summary.lower():
        emotion_tags.append('morning_routine')
    if 'walk' in summary.lower():
        emotion_tags.append('exercise')
    if 'coffee' in summary.lower():
        emotion_tags.append('beverage')
    if 'anime' in summary.lower():
        emotion_tags.append('entertainment')
    if 'read' in summary.lower():
        emotion_tags.append('reading')
    
    event = {
        'event_id': eid,
        'type': 'ADD',
        'summary': summary,
        'item': item,
        'timestamp': timestamp,
        'emotional_context': {
            'sentiment': sentiment,
            'emotion_tags': emotion_tags,
            'emotional_intensity': intensity,
            'mood_context': mood,
            'valence': valence,
            'arousal': arousal,
            'dominance': 0.6,
            'confidence': 0.85
        },
        'semantic_context': f'Inferred from input: "{summary}"',
        'importance_score': 0.65,
        'confidence': 0.85,
        'category': 'personal_preferences',
        'subcategory': 'general_preference',
        'previous_value': None,
        'current_value': summary,
        'provenance': {
            'source': 'user_input',
            'enhanced_in_place': True,
            'enhanced_at': timestamp,
            'source_conversation_timestamp': timestamp,
            'extraction_confidence': 0.85
        }
    }
    
    memory_events.append(event)
    
    # Update fact_history
    _update_fact_history(store, event, eid)
    
    # Update session
    _update_session(store, eid, summary)
    
    recompute_store_clusters(store, enc)
    
    store.setdefault('update_log', []).append({
        'op': 'create_event',
        'event_id': eid,
        'type': 'ADD',
        'timestamp': now_iso()
    })
    save_store(store)
    return eid


def update_event(store: dict, event: dict, new_summary: str, new_sentiment: str, enc: Encoder, reason: str = 'auto_merged') -> str:
    eid = event['event_id']
    prev_summary = event.get('summary')
    prev_sentiment = event.get('emotional_context', {}).get('sentiment')
    
    # Update with new values
    event['type'] = 'UPDATE'
    event['summary'] = new_summary
    event['current_value'] = new_summary
    event['previous_value'] = prev_summary
    
    # Determine new emotional context
    valence_map = {'positive': 0.8, 'neutral': 0.5, 'negative': 0.2}
    arousal_map = {'positive': 0.7, 'neutral': 0.5, 'negative': 0.6}
    intensity_map = {'positive': 0.7, 'neutral': 0.3, 'negative': 0.6}
    mood_map = {'positive': 'happy', 'neutral': 'normal', 'negative': 'concerned'}
    
    valence = valence_map.get(new_sentiment, 0.5)
    arousal = arousal_map.get(new_sentiment, 0.5)
    intensity = intensity_map.get(new_sentiment, 0.5)
    mood = mood_map.get(new_sentiment, 'normal')
    
    # Extract emotion tags
    emotion_tags = [event.get('item', 'update')]
    if 'morning' in new_summary.lower():
        emotion_tags.append('morning_routine')
    if 'walk' in new_summary.lower():
        emotion_tags.append('exercise')
    if 'coffee' in new_summary.lower():
        emotion_tags.append('beverage')
    if 'anime' in new_summary.lower():
        emotion_tags.append('entertainment')
    
    # Find related events
    memory_events = store['memory_engine'].get('memory_events', [])
    related_facts = []
    for ev in memory_events:
        if ev.get('item') == event.get('item') and ev.get('event_id') != eid:
            related_facts.append(ev['event_id'])
    
    event['emotional_context'].update({
        'sentiment': new_sentiment,
        'emotion_tags': emotion_tags,
        'emotional_intensity': intensity,
        'mood_context': mood,
        'valence': valence,
        'arousal': arousal,
        'dominance': 0.6,
        'confidence': 0.88
    })
    
    # Append to history
    event.setdefault('history', []).append({'summary': new_summary, 'timestamp': now_iso()})

    event['timestamp'] = now_iso()
    event['semantic_context'] = {
        'related_facts': related_facts,
        'confidence_score': 0.87,
        'context_type': 'preference_update',
        'semantic_tags': [event.get('item', ''), new_sentiment],
        'similarity_hash': hex(hash(new_summary) % (10 ** 8))[2:].zfill(8)
    }
    event['importance_score'] = min(0.85, event.get('importance_score', 0.65) + 0.1)
    event['confidence'] = 0.88
    
    event['provenance'].update({
        'enhanced_in_place': True,
        'enhanced_at': now_iso(),
        'original_summary': prev_summary,
        'context': f'Updated from: {prev_summary}',
        'source_conversation_timestamp': now_iso(),
        'cleanup_operation': reason,
        'update_reason': reason
    })
    
    # Update fact_history
    _update_fact_history(store, event, eid)
    
    # Update session
    _update_session(store, eid, new_summary)
    
    recompute_store_clusters(store, enc)
    
    store.setdefault('update_log', []).append({
        'op': 'update_event',
        'event_id': eid,
        'type': 'UPDATE',
        'prev': {'summary': prev_summary, 'sentiment': prev_sentiment},
        'new': {'summary': new_summary, 'sentiment': new_sentiment},
        'reason': reason,
        'timestamp': now_iso()
    })
    save_store(store)
    return eid


def _update_fact_history(store: dict, event: dict, event_id: str):
    """Update fact_history with new event information organized by category."""
    fact_history = store.get('fact_history', {})
    category = event.get('category', 'personal_preferences')
    subcategory = event.get('subcategory', 'general')
    
    if category == 'personal_preferences':
        if subcategory == 'likes':
            likes = fact_history.setdefault('personal_preferences', {}).setdefault('likes', [])
            fact_entry = {
                'fact': event.get('summary', ''),
                'sentiment': event.get('emotional_context', {}).get('sentiment', 'neutral'),
                'timestamp': event.get('timestamp'),
                'event_references': [event_id]
            }
            # Avoid duplicates
            if not any(e.get('fact') == fact_entry['fact'] for e in likes):
                likes.append(fact_entry)
    elif category == 'wellness':
        if subcategory == 'fitness':
            exercises = fact_history.setdefault('wellness', {}).setdefault('exercises', [])
            fact_entry = {
                'activity': event.get('summary', ''),
                'frequency': 'daily' if 'every' in event.get('summary', '').lower() else 'occasional',
                'timestamp': event.get('timestamp'),
                'event_references': [event_id]
            }
            if not any(e.get('activity') == fact_entry['activity'] for e in exercises):
                exercises.append(fact_entry)
    elif category == 'activity_behavior':
        routines = fact_history.setdefault('activity_behavior', {}).setdefault('daily_routines', [])
        fact_entry = {
            'routine': event.get('summary', ''),
            'time_of_day': 'morning' if 'morning' in event.get('summary', '').lower() else 'other',
            'timestamp': event.get('timestamp'),
            'event_references': [event_id]
        }
        if not any(e.get('routine') == fact_entry['routine'] for e in routines):
            routines.append(fact_entry)


def _update_session(store: dict, event_id: str, user_input: str):
    """Update session information and conversation state."""
    now = now_iso()
    
    # Initialize or get current session
    if not store.get('current_session'):
        session_id = f"session_{len(store.get('sessions', {})) + 1:03d}"
        store['current_session'] = session_id
        store['sessions'][session_id] = {
            'started_at': now,
            'ended_at': None,
            'duration_seconds': 0,
            'conversation_events': [],
            'total_events': 0,
            'topics_covered': [],
            'conversation_pairs': 0,
            'session_quality': 'excellent',
            'engagement_level': 'high'
        }
    
    session_id = store['current_session']
    session = store['sessions'].get(session_id, {})
    session['ended_at'] = now
    session['conversation_events'].append(event_id)
    session['total_events'] = len(session['conversation_events'])
    
    # Add to conversation
    conv = store.setdefault('conversation', [])
    conv.append({
        'timestamp': now,
        'role': 'user',
        'text': user_input
    })
    
    # Update conversation state
    store['conversation_state']['introduction_phase'] = len(conv) < 5
    store['conversation_state']['greeting_completed'] = len(conv) > 0
    
    # Update user metadata
    store['user']['last_seen'] = now
    store['user']['total_sessions'] = len(store.get('sessions', {}))
    if store.get('memory_engine', {}).get('memory_events'):
        store['user']['relationship_established'] = True


# -------------------------
# CLI / Interactive loop
# -------------------------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--n_clusters', type=int, default=10)
    parser.add_argument('--update_threshold', type=float, default=UPDATE_THRESHOLD_DEFAULT, help='similarity threshold to auto-update existing event')
    parser.add_argument('--n_trees', type=int, default=10)
    parser.add_argument('--query', type=str, default=None)
    parser.add_argument('--topk', type=int, default=5)
    parser.add_argument('--verbose', action='store_true', help='verbose/debug prints')
    args = parser.parse_args()

    enc = Encoder()
    store = load_store()
    # ensure initial clusters/vectors exist
    store = recompute_store_clusters(store, enc, n_clusters=args.n_clusters)

    global VERBOSE
    VERBOSE = bool(args.verbose)

    if args.query:
        q = args.query
        best_ev, sim, reason = find_best_event_by_similarity(store, enc, q, update_threshold=args.update_threshold)
        print('Query:', q)
        if best_ev:
            print(f' Best match id={best_ev["event_id"]} sim={sim:.4f} reason={reason} text="{best_ev["summary"]}"')
        else:
            print(' No match found')
        return

    print('Virtual cluster simulator — interactive. Type a phrase (empty to exit).')
    print('System will automatically organize your input into events and clusters.')
    print()
    
    while True:
        try:
            text = input('> ').strip()
        except (EOFError, KeyboardInterrupt):
            print('\nExiting.')
            break
        if not text:
            break
        
        intent = extract_intent(text)
        item = intent['item']
        sentiment = intent['sentiment']
        
        print(f'[Extracted: item={item}, sentiment={sentiment}]')
        
        # Multi-level matching strategy
        # Priority 1: Exact/fuzzy item match (most confident)
        existing = find_existing_event_by_item(store, item)
        if existing:
            eid = update_event(store, existing, text, sentiment, enc)
            prev_summary = existing.get('previous_value', existing.get('summary', ''))
            print(f'[UPDATE] event {eid} (item match: "{item}")')
            print(f'  Previous: "{prev_summary}"')
            print(f'  Current:  "{text}"\n')
            continue
        
        # Priority 2: Semantic/similarity match (medium confidence)
        best_ev, sim, reason = find_best_event_by_similarity(store, enc, text, update_threshold=args.update_threshold)
        if best_ev and sim >= args.update_threshold:
            best_item = best_ev.get('item', '')
            best_summary = best_ev.get('summary', '')
            
            if best_item in text.lower() or item in best_summary.lower() or sim > 0.80:
                eid = update_event(store, best_ev, text, sentiment, enc)
                print(f'[UPDATE] event {eid} ({reason}, sim={sim:.3f})')
                print(f'  Previous: "{best_summary}"')
                print(f'  Current:  "{text}"\n')
                continue
        
        # Priority 3: No match found -> create new event
        eid = create_event(store, text, item, sentiment, enc)
        print(f'[CREATE] event {eid} (item: {item})\n')

if __name__ == '__main__':
    main()