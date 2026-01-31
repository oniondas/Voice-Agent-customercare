import chromadb
from chromadb.utils import embedding_functions
from typing import List, Dict, Any
import os

class VectorSearch:
    def __init__(self, persist_directory="./vector_cache"):
        """Initialize ChromaDB vector search"""
        self.persist_directory = persist_directory
        # Ensure directory exists
        os.makedirs(persist_directory, exist_ok=True)
        
        # Initialize Client
        # Using PersistentClient to save data to disk
        self.client = chromadb.PersistentClient(path=persist_directory)
        
        # Use default embedding function (all-MiniLM-L6-v2)
        self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()
        
        # Get or create collection
        # Using cosine distance for similarity search
        self.collection = self.client.get_or_create_collection(
            name="product_search",
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"}
        )
        
        print("ChromaDB vector search initialized.")
    
    def index_products(self, products: List[Dict[str, Any]]):
        """Index all products using ChromaDB"""
        if not products:
            print("No products to index.")
            return
        
        print(f"Indexing {len(products)} products with ChromaDB...")
        
        ids = []
        documents = []
        metadatas = []
        
        # Semantic keyword mappings for enrichment
        semantic_keywords = {
            'earbuds': 'headphone headphones earphone earphones audio listen music wireless bluetooth sound',
            'earbud': 'headphone headphones earphone earphones audio listen music wireless bluetooth sound',
            'headset': 'headphone headphones earphone earphones audio listen music gaming voice sound',
            'headphone': 'earbuds earphone audio listen music wireless bluetooth sound',
            'headphones': 'earbuds earphone audio listen music wireless bluetooth sound',
            'speaker': 'audio sound music bluetooth wireless portable speaker speakers',
            'laptop': 'computer computers portable notebook work coding programming device technology',
            'tablet': 'computer computers portable touchscreen mobile device technology ipad android',
            'computer': 'laptop desktop workstation device technology',
            'phone': 'mobile smartphone device portable communication tablet smartwatch technology',
            'smartphone': 'phone mobile device portable communication tablet smartwatch technology android iphone',
            'mobile': 'phone smartphone device portable communication tablet technology',
            'watch': 'smartwatch wearable fitness tracker device technology',
            'smartwatch': 'watch wearable fitness tracker device mobile phone technology',
            'camera': 'photo photography video capture image technology device',
        }
        
        for product in products:
            # Create rich document
            doc = f"{product['name']} {product['name']} {product['description']} {product['category']}"
            
            # Add semantic keywords
            for keyword, synonyms in semantic_keywords.items():
                if keyword.lower() in product['name'].lower() or keyword.lower() in product['category'].lower():
                    doc += f" {synonyms}"
            
            # Ensure ID is a string
            pid = str(product['id'])
            ids.append(pid)
            documents.append(doc)
            
            # Prepare metadata (ensure simple types)
            meta = {
                'name': product['name'] if product['name'] else "",
                'category': product['category'] if product['category'] else "",
                'price': float(product['price']) if product['price'] is not None else 0.0,
                'stock': int(product['stock']) if product['stock'] is not None else 0
            }
            metadatas.append(meta)

        # Upsert into ChromaDB
        try:
            self.collection.upsert(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
            print(f"Successfully indexed {len(products)} products in ChromaDB.")
        except Exception as e:
            print(f"Error indexing products in ChromaDB: {e}")

    def semantic_search(self, query: str, limit: int = 5, min_stock: int = 0) -> List[Dict[str, Any]]:
        """
        Perform semantic search using ChromaDB
        """
        if not query or not query.strip():
            return []
        
        try:
            # Prepare where clause
            where_clause = {}
            if min_stock > 0:
                where_clause["stock"] = {"$gte": min_stock}

            # Query the collection
            # If where_clause is empty, pass None to avoid warnings/errors in some versions
            results = self.collection.query(
                query_texts=[query],
                n_results=limit,
                where=where_clause if where_clause else None
            )
            
            if not results['ids'] or len(results['ids'][0]) == 0:
                return []

            hits = []
            ids = results['ids'][0]
            distances = results['distances'][0]
            metadatas = results['metadatas'][0]
            
            for i in range(len(ids)):
                dist = distances[i]
                meta = metadatas[i]
                
                # Convert cosine distance to similarity score
                # distance ranges from 0 (identical) to 2 (opposite).
                # Similarity = 1 - distance. 
                # If distance is small (< 1), similarity is positive.
                similarity = 1.0 - dist
                
                hits.append({
                    'id': ids[i],
                    'similarity_score': similarity,
                    'name': meta.get('name'),
                    'category': meta.get('category'),
                    'price': meta.get('price'),
                    'stock': meta.get('stock')
                })
            
            # Sort by similarity desc
            hits.sort(key=lambda x: x['similarity_score'], reverse=True)
            
            return hits[:limit]

        except Exception as e:
            print(f"ChromaDB search failed: {e}")
            return []
