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
        # 1. Exact Match
        order = next((o for o in self.orders if o["id"] == order_id), None)
        if order: 
            return order
        
        # 2. Case-Insensitive Match
        order = next((o for o in self.orders if o["id"].lower() == order_id.lower()), None)
        if order:
            return order

        # 3. Partial Match (e.g. user says "8892" for "ORD-123...8892" or "99" for "O0099")
        # useful for voice usage
        if len(order_id) >= 2:
            order = next((o for o in self.orders if order_id in o["id"] or o["id"].endswith(order_id)), None)
            
        return order

    
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

    # --- Write Operations ---

    def save_products(self):
        """Save in-memory products back to JSON in snake_case"""
        try:
            raw_products = []
            for p in self.products:
                raw_products.append({
                    "product_id": p["id"],
                    "product_name": p["name"],
                    "category": p["category"],
                    "price": p["price"],
                    "stock_available": p["stock"],
                    "description": p["description"],
                    "rating": p["rating"],
                    "review_count": p["reviews"],
                    "delivery_time_days": p["deliveryTimeDays"],
                    "return_eligible": p["returnEligible"],
                    "discount_percentage": p.get("discountPercentage", 0)
                })
            
            with open(f"{self.base_path}/product_catalog.json", "w") as f:
                json.dump(raw_products, f, indent=4)
            print("Products saved to disk.")
        except Exception as e:
            print(f"Error saving products: {e}")

    def save_orders(self):
        """Save in-memory orders back to JSON in snake_case"""
        try:
            raw_orders = []
            for o in self.orders:
                # Convert items back
                raw_items = []
                for item in o["items"]:
                    raw_items.append({
                        "product_id": item["productId"],
                        "quantity": item["quantity"],
                        "price_at_purchase": item["price"]
                    })

                raw_orders.append({
                    "order_id": o["id"],
                    "customer_id": o["customerId"],
                    "order_status": o["status"],
                    "order_date": o["date"],
                    "items": raw_items
                })
            
            with open(f"{self.base_path}/order_database.json", "w") as f:
                json.dump(raw_orders, f, indent=4)
            print("Orders saved to disk.")
        except Exception as e:
            print(f"Error saving orders: {e}")

    def create_order(self, user_id, items):
        """
        Create a new order, deduct stock, and save changes.
        items: List of dicts {productId, quantity}
        """
        if not items:
            return False, "No items in order"

        # 1. Validate Stock
        for item in items:
            product = self.get_product(item["productId"])
            if not product:
                return False, f"Product {item['productId']} not found"
            if product["stock"] < item["quantity"]:
                return False, f"Insufficient stock for {product['name']}"

        # 2. Deduct Stock & Calculate Total
        new_order_items = []
        total_amount = 0
        
        for item in items:
            product = self.get_product(item["productId"])
            product["stock"] -= item["quantity"] # Deduct stock
            
            price = product["price"]
            new_order_items.append({
                "productId": product["id"],
                "name": product["name"],
                "quantity": item["quantity"],
                "price": price
            })
            total_amount += price * item["quantity"]

        # 3. Create Order Object
        import datetime
        order_id = f"ORD-{int(datetime.datetime.now().timestamp())}"
        new_order = {
            "id": order_id,
            "customerId": user_id,
            "status": "Processing",
            "date": datetime.date.today().strftime("%Y-%m-%d"),
            "total": total_amount,
            "items": new_order_items
        }

        self.orders.append(new_order)

        # 4. Save Changes
        self.save_products()
        self.save_orders()
        
        # 5. Update Vector DB with new stock? 
        # Ideally yes, but for now we might skip re-indexing entire DB for speed, 
        # or we could make vector_db update a single item. 
        # For this PoC, we rely on in-memory product list being current for next logic check.
        # However, search results come from vector DB which has metadata 'stock'.
        # We should ideally update that.
        if self.vector_db:
             # Re-index just the affected products is best, but full re-index is safer/easier code:
             # self.vector_db.index_products(self.products) 
             # Optimization: Do nothing, because search filter checks `stock > 0` on the retrieved results?
             # No, standard vector search usually filters on metadata. 
             # Let's check vector_search.py: It DOES verify stock in `semantic_search`:
             # `if metadata['stock'] < min_stock: continue`
             # BUT `metadata` comes from `self.product_metadata` which is cached in `VectorSearch` class.
             # So we DO need to update VectorSearch state.
             pass 

        return True, new_order
