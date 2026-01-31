import pickle
import sys

# Load the cached index
with open('backend/vector_cache/tfidf_index.pkl', 'rb') as f:
    cache = pickle.load(f)

# Get the vectorizer
vectorizer = cache['vectorizer']

# Find products with "earbud" in the name
product_ids = cache['product_ids']
metadata = cache['metadata']

print("Checking if semantic keywords are in the index...")
print("\nSearching for earbud products:")
for i, pid in enumerate(product_ids):
    if 'earbud' in metadata[i]['name'].lower():
        print(f"\nProduct: {metadata[i]['name']}")
        # Get the original feature names
        feature_names = vectorizer.get_feature_names_out()
        
        # Check if 'headphone' or 'headphones' is in the vocabulary
        has_headphone = 'headphone' in feature_names or 'headphones' in feature_names
        has_audio = 'audio' in feature_names
        has_wireless = 'wireless' in feature_names
        
        print(f"  - 'headphone(s)' in vocabulary: {has_headphone}")
        print(f"  - 'audio' in vocabulary: {has_audio}")
        print(f"  - 'wireless' in vocabulary: {has_wireless}")
        
        if has_headphone:
            print("✅ Semantic keywords ARE present in index!")
        else:
            print("❌ Semantic keywords NOT present - using old cache!")
        break
