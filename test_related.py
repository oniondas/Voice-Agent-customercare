import sys
sys.path.insert(0, 'backend')

from data_loader import DataLoader
from search_logic import SearchLogic

# Load data
dl = DataLoader()
dl.load_all()

# Search for cases
sl = SearchLogic(dl)
cases = sl.search_products('case')
print(f"\n=== CASE PRODUCTS ===")
print(f"Found {len(cases)} case products:")
for c in cases:
    print(f"- {c['name']}: stock={c.get('stock', 0)}")

# Test related products for a phone
print(f"\n=== RELATED PRODUCTS FOR P001 ===")
phone = dl.get_product('P001')
if phone:
    print(f"Main product: {phone['name']} (category: {phone.get('category', 'N/A')})")
    related = sl.get_related_products('P001')
    print(f"Found {len(related)} related products:")
    for r in related:
        print(f"- {r['name']}: stock={r.get('stock', 0)}, category={r.get('category', 'N/A')}")
