import sys
sys.path.insert(0, 'backend')

from data_loader import DataLoader
from search_logic import SearchLogic

# Load data
dl = DataLoader()
dl.load_all()

# Test search
sl = SearchLogic(dl)
print("\n=== Testing 'headphone' search ===")
results = sl.search_products('headphone')
print(f"Results: {len(results)}")
for r in results[:5]:
    print(f"- {r['name']} (source: {r.get('source', 'keyword')})")

print("\n=== Testing 'earbud' search ===")
results2 = sl.search_products('earbud')
print(f"Results: {len(results2)}")
for r in results2[:5]:
    print(f"- {r['name']} (source: {r.get('source', 'keyword')})")
