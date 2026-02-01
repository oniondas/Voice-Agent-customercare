import sys
sys.path.insert(0, 'backend')

from data_loader import DataLoader
from search_logic import SearchLogic

# Load data
dl = DataLoader()
dl.load_all()

# Test search
sl = SearchLogic(dl)
print("\n=== HEADPHONE SEARCH ===")
results = sl.search_products('headphone')
print(f"Found {len(results)} results:")
for i, r in enumerate(results[:8]):
    source = r.get('source', 'keyword')
    sim = r.get('similarity_score', 'N/A')
    print(f"{i+1}. {r['name']} (source: {source}, similarity: {sim})")
