import sys
sys.path.insert(0, 'backend')

from data_loader import DataLoader
from search_logic import SearchLogic

# Load data
dl = DataLoader()
dl.load_all()

sl = SearchLogic(dl)

# Test smartphone search
print("\n=== TESTING SMARTPHONE SEARCH ===\n")
results = sl.search_products('smartphone')
print(f"Found {len(results)} results for 'smartphone':")
for i, r in enumerate(results, 1):
    source = r.get('source', 'keyword')
    sim = r.get('similarity_score', 'N/A')
    print(f"{i}. {r['name']} ({r.get('category', 'N/A')}) - {source}, sim={sim}")
