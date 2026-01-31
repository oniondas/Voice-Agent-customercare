import sys
sys.path.insert(0, 'backend')

from vector_search import VectorSearch
import pickle

# Load the vector search
vs = VectorSearch('backend/vector_cache')

# Load cached data manually to skip the index_products step
with open('backend/vector_cache/tfidf_index.pkl', 'rb') as f:
    cached_data = pickle.load(f)
    vs.product_vectors = cached_data['vectors']
    vs.product_ids = cached_data['product_ids']
    vs.product_metadata = cached_data['metadata']
    vs.vectorizer = cached_data['vectorizer']

# Test semantic search with debug info
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

query = "headphone"
print(f"\n=== Semantic Search Debug for '{query}' ===\n")

# Transform query
query_vector = vs.vectorizer.transform([query])

# Calculate similarities
similarities = cosine_similarity(query_vector, vs.product_vectors)[0]

# Get top 10 scores
top_indices = np.argsort(similarities)[::-1][:10]

print("Top 10 similarity scores:")
for idx in top_indices:
    score = similarities[idx]
    name = vs.product_metadata[idx]['name']
    print(f"{score:.4f} - {name}")

print(f"\nCurrent threshold: 0.02 (minimum similarity to return results)")
print(f"Products above threshold: {len([s for s in similarities if s >= 0.02])}")
