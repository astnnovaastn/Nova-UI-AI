import math
import hashlib
from typing import List

try:
    from sentence_transformers import SentenceTransformer
    import numpy as _np
    _HAS_TRANSFORMER = True
except Exception:
    _HAS_TRANSFORMER = False
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        import numpy as _np
        _HAS_TFIDF = True
    except Exception:
        _HAS_TFIDF = False
        _np = None


class VectorEngine:
    def __init__(self, model_name: str = 'sentence-transformers/all-MiniLM-L6-v2'):
        self.mode = 'hash'
        self.dim = 64
        self.model = None
        self.tfidf = None
        self._fitted = False
        if _HAS_TRANSFORMER:
            try:
                self.model = SentenceTransformer(model_name)
                self.dim = self.model.get_sentence_embedding_dimension()
                self.mode = 'transformer'
            except Exception:
                self.model = None
        if self.model is None and _HAS_TFIDF:
            try:
                from sklearn.feature_extraction.text import TfidfVectorizer
                self.tfidf = TfidfVectorizer(max_features=256)
                self.dim = 256
                self.mode = 'tfidf'
            except Exception:
                self.mode = 'hash'
                self.dim = 64

    def _normalize(self, vec: List[float]) -> List[float]:
        s = sum(x * x for x in vec)
        if s <= 0:
            return vec
        norm = math.sqrt(s)
        return [float(x / norm) for x in vec]

    def encode(self, text: str) -> List[float]:
        if self.mode == 'transformer' and self.model is not None:
            try:
                arr = self.model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
                return arr.tolist()
            except Exception:
                pass
        if self.mode == 'tfidf' and self.tfidf is not None:
            if not self._fitted:
                # fit on a tiny seeded corpus to avoid empty model
                self.tfidf.fit([text])
                self._fitted = True
            vec = self.tfidf.transform([text]).toarray()[0].tolist()
            if len(vec) < self.dim:
                vec += [0.0] * (self.dim - len(vec))
            return self._normalize(vec[:self.dim])
        # fallback hash-based deterministic vector
        h = hashlib.sha256(text.encode('utf-8')).digest()
        vec = []
        for i in range(self.dim):
            b = h[i % len(h)]
            vec.append((b / 255.0) * 2 - 1)
        return self._normalize(vec)


_engine = None


def get_vector_engine():
    global _engine
    if _engine is None:
        _engine = VectorEngine()
    return _engine
