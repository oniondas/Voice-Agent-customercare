import sys
sys.path.insert(0, 'backend')

from data_loader import DataLoader
from search_logic import SearchLogic

# Load data
dl = DataLoader()
dl.load_all()

sl = SearchLogic(dl)

# Test vector-based related products for different items
test_products = [
    ('P001', 'First product'),
    ('P042', 'Aero Earbuds Pro (if exists)'),
]

print("\n=== TESTING VECTOR-BASED RELATED PRODUCTS ===\n")

for pid, description in test_products:
    product = dl.get_product(pid)
    if product:
        print(f"Main Product: {product['name']} ({product.get('category', 'N/A')})")
        print(f"Stock: {product.get('stock', 0)}\n")
        
        related = sl.get_related_products(pid)
        print(f"Found {len(related)} related products:")
        for i, r in enumerate(related, 1):
            similarity = r.get('similarity_score', 0)
            print(f"  {i}. {r['name']}")
            print(f"     Category: {r.get('category', 'N/A')}, Stock: {r.get('stock', 0)}, Similarity: {similarity:.3f}")
        print("\n" + "="*60 + "\n")
    else:
        print(f"Product {pid} not found\n")
