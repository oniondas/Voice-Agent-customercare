from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List, Dict, Any
import pickle
import os

class VectorSearch:
    def __init__(self, persist_directory="./vector_cache"):
        """Initialize TF-IDF based semantic search"""
        self.persist_directory = persist_directory
        os.makedirs(persist_directory, exist_ok=True)
        
        # TF-IDF vectorizer for semantic matching
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 2),  # Use unigrams and bigrams
            stop_words='english',
            min_df=1,
            sublinear_tf=True  # Use sublinear scaling for better results
        )
        
        self.product_vectors = None
        self.product_ids = []
        self.product_metadata = []
        
        print("TF-IDF vector search initialized.")
    
    def index_products(self, products: List[Dict[str, Any]]):
        """Index all products using TF-IDF vectorization"""
        if not products:
            print("No products to index.")
            return
        
        # Check if we have a cached index
        cache_file = os.path.join(self.persist_directory, 'tfidf_index.pkl')
        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'rb') as f:
                    cached_data = pickle.load(f)
                    if len(cached_data['product_ids']) == len(products):
                        self.product_vectors = cached_data['vectors']
                        self.product_ids = cached_data['product_ids']
                        self.product_metadata = cached_data['metadata']
                        self.vectorizer = cached_data['vectorizer']
                        print(f"Loaded {len(products)} products from cache.")
                        return
            except Exception as e:
                print(f"Cache load failed, rebuilding index: {e}")
        
        print(f"Indexing {len(products)} products with TF-IDF...")
        
        # Prepare documents with semantic enrichment
        documents = []
        self.product_ids = []
        self.product_metadata = []
        
        # Semantic keyword mappings for better matching (include both singular & plural)
        # Bidirectional mapping: both "phone" and "smartphone" can find each other + related devices
        semantic_keywords = {
            # Audio devices
            'earbuds': 'headphone headphones earphone earphones audio listen music wireless bluetooth sound',
            'earbud': 'headphone headphones earphone earphones audio listen music wireless bluetooth sound',
            'headset': 'headphone headphones earphone earphones audio listen music gaming voice sound',
            'headphone': 'earbuds earphone audio listen music wireless bluetooth sound',
            'headphones': 'earbuds earphone audio listen music wireless bluetooth sound',
            'speaker': 'audio sound music bluetooth wireless portable speaker speakers',
            
            # Computing devices
            'laptop': 'computer computers portable notebook work coding programming device technology',
            'tablet': 'computer computers portable touchscreen mobile device technology ipad android',
            'computer': 'laptop desktop workstation device technology',
            
            # Mobile devices - bidirectional mapping
            'phone': 'mobile smartphone device portable communication tablet smartwatch technology',
            'smartphone': 'phone mobile device portable communication tablet smartwatch technology android iphone',
            'mobile': 'phone smartphone device portable communication tablet technology',
            
            # Wearables
            'watch': 'smartwatch wearable fitness tracker device technology',
            'smartwatch': 'watch wearable fitness tracker device mobile phone technology',
            
            # Media
            'camera': 'photo photography video capture image technology device',
        }
        
        for product in products:
            # Create rich document: name (2x weighted) + description + category
            doc = f"{product['name']} {product['name']} {product['description']} {product['category']}"
            
            # Add semantic keywords based on product name/category
            for keyword, synonyms in semantic_keywords.items():
                if keyword.lower() in product['name'].lower() or keyword.lower() in product['category'].lower():
                    doc += f" {synonyms}"
            
            documents.append(doc)
            
            self.product_ids.append(product['id'])
            self.product_metadata.append({
                'name': product['name'],
                'category': product['category'],
                'price': product['price'],
                'stock': product['stock']
            })
        
        # Fit and transform documents to TF-IDF vectors
        self.product_vectors = self.vectorizer.fit_transform(documents)
        
        # Cache the index for faster startup next time
        try:
            with open(cache_file, 'wb') as f:
                pickle.dump({
                    'vectors': self.product_vectors,
                    'product_ids': self.product_ids,
                    'metadata': self.product_metadata,
                    'vectorizer': self.vectorizer
                }, f)
            print(f"Successfully indexed and cached {len(products)} products.")
        except Exception as e:
            print(f"Warning: Failed to cache index: {e}")
            print(f"Successfully indexed {len(products)} products (not cached).")
    
    def semantic_search(self, query: str, limit: int = 5, min_stock: int = 0) -> List[Dict[str, Any]]:
        """
        Perform TF-IDF based semantic search for products
        
        Args:
            query: Natural language search query
            limit: Maximum number of results to return
            min_stock: Minimum stock level (0 = include out-of-stock)
        
        Returns:
            List of product dictionaries with similarity scores
        """
        if not query or not query.strip():
            return []
        
        if self.product_vectors is None or len(self.product_ids) == 0:
            print("No products indexed for search.")
            return []
        
        # Transform query to TF-IDF vector
        query_vector = self.vectorizer.transform([query])
        
        # Calculate cosine similarity between query and all products
        similarities = cosine_similarity(query_vector, self.product_vectors)[0]
        
        # Get top matches (sorted by similarity)
        top_indices = np.argsort(similarities)[::-1]
        
        # Build result list
        products = []
        for idx in top_indices:
            similarity_score = similarities[idx]
            
            # Skip if similarity is too low (lowered threshold for better matching)
            if similarity_score < 0.02:
                continue
            
            metadata = self.product_metadata[idx]
            
            # Filter by stock if required
            if metadata['stock'] < min_stock:
                continue
            
            products.append({
                'id': self.product_ids[idx],
                'name': metadata['name'],
                'category': metadata['category'],
                'price': metadata['price'],
                'stock': metadata['stock'],
                'similarity_score': round(float(similarity_score), 3),
                'source': 'semantic_match'
            })
            
            # Stop when we have enough results
            if len(products) >= limit:
                break
        
        return products
