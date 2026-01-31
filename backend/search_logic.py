import concurrent.futures

class SearchLogic:
    def __init__(self, data_loader):
        self.data_loader = data_loader

    def _keyword_search(self, query, category):
        """Perform keyword-based search"""
        results = self.data_loader.products
        
        # Category Filter
        if category:
            results = [p for p in results if category.lower() in p["category"].lower() or p["category"].lower() in category.lower()]
        
        # Keyword Search
        if query:
            q = query.lower()
            results = [
                p for p in results 
                if q in p["name"].lower() or q in p["description"].lower() or q in p["category"].lower()
            ]
        
        # Filter out out-of-stock products
        results = [p for p in results if p.get("stock", 0) > 0]
        
        return results[:10]
    
    def _semantic_search(self, query):
        """Perform semantic search using vector similarity"""
        if not query or not self.data_loader.vector_db:
            return []
        
        try:
            # Only return products with stock > 0
            semantic_results = self.data_loader.vector_db.semantic_search(query, limit=8, min_stock=1)
            # Enrich with full product data
            enriched = []
            for sem_result in semantic_results:
                full_product = self.data_loader.get_product(sem_result['id'])
                if full_product:
                    full_product['source'] = 'semantic_match'
                    full_product['similarity_score'] = sem_result.get('similarity_score', 0)
                    enriched.append(full_product)
            return enriched
        except Exception as e:
            print(f"Semantic search failed: {e}")
            return []

    def search_products(self, query=None, category=None):
        """
        Parallel search: runs keyword and semantic search concurrently
        Returns merged results with keyword matches prioritized
        """
        # Run both searches in parallel using ThreadPoolExecutor
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            # Submit both search tasks
            keyword_future = executor.submit(self._keyword_search, query, category)
            semantic_future = executor.submit(self._semantic_search, query) if query else None
            
            # Get keyword results (usually very fast)
            keyword_results = keyword_future.result()
            
            # If we have keyword results, return them immediately
            # But also check semantic results for additional suggestions
            if len(keyword_results) > 0:
                if semantic_future:
                    semantic_results = semantic_future.result()
                    # Merge: keyword results first, then unique semantic results
                    seen_ids = {p['id'] for p in keyword_results}
                    for sem_product in semantic_results:
                        if sem_product['id'] not in seen_ids and len(keyword_results) < 10:
                            keyword_results.append(sem_product)
                            seen_ids.add(sem_product['id'])
                return keyword_results[:10]
            
            # If no keyword results, wait for semantic results
            if semantic_future:
                semantic_results = semantic_future.result()
                if len(semantic_results) > 0:
                    print(f"No keyword matches, returning {len(semantic_results)} semantic matches")
                    return semantic_results
        
        return []  # No results from either search

    def get_related_products(self, product_id):
        """
        Use semantic vector search to find related products
        This finds complementary/similar items instead of just same-category products
        Example: Phone -> Phone case, Screen protector
                 Laptop -> Mouse, Laptop bag
        """
        main_product = self.data_loader.get_product(product_id)
        if not main_product:
            return []
        
        # Use vector search if available
        if self.data_loader.vector_db:
            try:
                # Create search query from product name and category
                query = f"{main_product['name']} {main_product.get('category', '')}"
                
                # Get semantically similar products
                semantic_results = self.data_loader.vector_db.semantic_search(
                    query, 
                    limit=10,  # Get more candidates
                    min_stock=1  # Only in-stock items
                )
                
                # Filter out the product itself and enrich with full data
                related = []
                for sem_result in semantic_results:
                    if sem_result['id'] != product_id:  # Exclude the main product
                        full_product = self.data_loader.get_product(sem_result['id'])
                        if full_product and full_product.get('stock', 0) > 0:
                            full_product['similarity_score'] = sem_result.get('similarity_score', 0)
                            related.append(full_product)
                
                # Sort by similarity score and return top 5
                related.sort(key=lambda x: x.get('similarity_score', 0), reverse=True)
                return related[:5]
                
            except Exception as e:
                print(f"Vector search for related products failed: {e}")
                # Fall through to fallback logic
        
        # Fallback: Category-based if vector search unavailable
        category = main_product.get("category", "")
        related = [
            p for p in self.data_loader.products 
            if p["category"] == category 
            and p["id"] != product_id
            and p.get("stock", 0) > 0
        ]
        related.sort(key=lambda x: x.get("rating", 0), reverse=True)
        return related[:5]

    def get_recommendations(self):
        # --- HOMEPAGE RECOMMENDATIONS ---
        # 1. Edge Case: Filter Out of Stock items (Bad user experience to recommend unreachable items)
        # 2. Logic: High Rating + High Stock (Available & Good)
        
        available_products = [p for p in self.data_loader.products if p["stock"] > 0]
        
        # Sort by Rating and ensure they have reasonable stock
        sorted_products = sorted(available_products, key=lambda p: (p["rating"], p["stock"]), reverse=True)
        
        return sorted_products[:6] # Top 6

    def search_policies(self, topic):
        # Keyword search in policy keys or content
        topic_lower = topic.lower()
        
        # 1. Check Titles
        for title, content in self.data_loader.policies.items():
            if topic_lower in title.lower():
                return f"**{title}**\n\n{content}"
        
        # 2. Check Content as fallback
        for title, content in self.data_loader.policies.items():
            if topic_lower in content.lower():
                return f"**{title}**\n\n{content}"
                
        return "I couldn't find a specific policy for that topic. Please check our General Terms."
