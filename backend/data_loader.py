import json
import os
import re
from vector_search import VectorSearch

class DataLoader:
    def __init__(self):
        # Resolve path relative to this file (backend/data_loader.py)
        # We assume structure is: root/backend/data_loader.py and root/Files
        base_dir = os.path.dirname(os.path.abspath(__file__)) # c:/.../backend
        self.base_path = os.path.join(base_dir, "..", "Files")
        self.products = []
        self.orders = []
        self.faqs = []
        self.policies = {} # { "Return Policy": "text...", "Shipping": "text..." }
        
        # Initialize Vector Search for semantic product search
        try:
            self.vector_db = VectorSearch(persist_directory=os.path.join(base_dir, "vector_cache"))
            print("Vector search initialized.")
        except Exception as e:
            print(f"Warning: Vector search initialization failed: {e}")
            self.vector_db = None


    def load_all(self):
        self.load_products()
        self.load_orders()
        self.load_faqs()
        self.load_policies()
        
        # Index products into vector database for semantic search
        if self.vector_db and self.products:
            try:
                self.vector_db.index_products(self.products)
            except Exception as e:
                print(f"Warning: Failed to index products in vector DB: {e}")

    def load_products(self):
        try:
            with open(f"{self.base_path}/product_catalog.json", "r") as f:
                raw_products = json.load(f)
                # Map JSON fields to our internal/frontend schema if needed
                # The frontend expects camelCase, but raw is snake_case. 
                # We will map it here to match the frontend 'Product' interface.
                self.products = []
                for p in raw_products:
                    self.products.append({
                        "id": p.get("product_id"),
                        "name": p.get("product_name"),
                        "category": p.get("category"),
                        "price": p.get("price"),
                        "stock": p.get("stock_available"),
                        "description": p.get("description"),
                        "rating": p.get("rating"),
                        "reviews": p.get("review_count"),
                        "deliveryTimeDays": p.get("delivery_time_days"),
                        "returnEligible": p.get("return_eligible"),
                        "discountPercentage": p.get("discount_percentage", 0),
                        "features": p.get("description", "").split('.')  # Simple feature extraction
                    })
            print(f"Loaded {len(self.products)} products.")
        except Exception as e:
            print(f"Error loading products: {e}")

    def load_orders(self):
        try:
            with open(f"{self.base_path}/order_database.json", "r") as f:
                raw_orders = json.load(f)
                self.orders = []
                for o in raw_orders:
                    # Frontend Order Schema Mapping
                    self.orders.append({
                        "id": o.get("order_id"),
                        "customerId": o.get("customer_id"),
                        "status": o.get("order_status"),
                        "date": o.get("order_date"),
                        "total": sum(item.get("price_at_purchase", 0) * item.get("quantity", 1) for item in o.get("items", [])), # basic calc
                        "items": [
                            {
                                "productId": i.get("product_id"),
                                "name": "Product " + i.get("product_id"), # Name might be missing in order lines, lookup needed but simplified for now
                                "quantity": i.get("quantity"),
                                "price": i.get("price_at_purchase")
                            } for i in o.get("items", [])
                        ]
                    })
            print(f"Loaded {len(self.orders)} orders.")
        except Exception as e:
            print(f"Error loading orders: {e}")

    def load_faqs(self):
        try:
            with open(f"{self.base_path}/product_faqs.json", "r") as f:
                raw_faqs = json.load(f)
                self.faqs = []
                for item in raw_faqs:
                    pid = item.get("product_id")
                    for faq in item.get("faqs", []):
                        self.faqs.append({
                            "productId": pid,
                            "question": faq.get("question"),
                            "answer": faq.get("answer")
                        })
            print(f"Loaded {len(self.faqs)} FAQs.")
        except Exception as e:
            print(f"Error loading FAQs: {e}")

    def load_policies(self):
        try:
            # Simple markdown parsing by headers
            with open(f"{self.base_path}/Company_policies.md", "r") as f:
                content = f.read()
            
            # Split by headers (e.g., **Policy Name**)
            # This is a heuristic.
            sections = re.split(r'\n\s*\*\*(.*?)\*\*\s*\n', content)
            
            if len(sections) > 1:
                # sections[0] is preamble.
                # sections[1] is Title 1, sections[2] is Content 1...
                for i in range(1, len(sections), 2):
                    title = sections[i].strip()
                    body = sections[i+1].strip()
                    self.policies[title] = body
            else:
                self.policies["General"] = content
                
            print(f"Loaded {len(self.policies)} policy sections.")
        except Exception as e:
            print(f"Error loading policies: {e}")

    # Accessors
    def get_product(self, product_id):
        return next((p for p in self.products if p["id"] == product_id), None)

    def get_orders(self, user_id):
        # Return all orders for now if user_id matches, or just all for demo
        return [o for o in self.orders if o["customerId"] == user_id]

    def get_order(self, order_id):
        return next((o for o in self.orders if o["id"] == order_id), None)
    
    def cancel_order(self, order_id):
        order = self.get_order(order_id)
        if not order:
            return False, "Order not found"
        if order["status"] == "Delivered":
             return False, "Cannot cancel delivered order."
        
        order["status"] = "Cancelled"
        return True, "Order cancelled successfully."

    def get_faqs(self, product_id):
        return [f for f in self.faqs if f["productId"] == product_id]
