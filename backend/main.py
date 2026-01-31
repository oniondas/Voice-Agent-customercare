from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn
from data_loader import DataLoader
from search_logic import SearchLogic

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Data & Search
data = DataLoader()
search_engine = SearchLogic(data)

@app.on_event("startup")
async def startup_event():
    data.load_all()
    print("Backend initialized and data loaded.")

@app.get("/api/products/search")
def search_products(q: Optional[str] = None, cat: Optional[str] = None):
    print(f"DEBUG: Search Request - Query='{q}', Category='{cat}'")
    results = search_engine.search_products(query=q, category=cat)
    print(f"DEBUG: Found {len(results)} results")
    return results

@app.get("/api/products/{product_id}")
def get_product(product_id: str):
    product = data.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.get("/api/products/{product_id}/related")
def get_related_products(product_id: str):
    return search_engine.get_related_products(product_id)

@app.get("/api/products/{product_id}/faq")
def get_product_faqs(product_id: str):
    return data.get_faqs(product_id)

@app.get("/api/products/recommendations")
def get_recommendations():
    # Simple recommendation: highly rated products
    return search_engine.get_recommendations()

@app.get("/api/orders")
def get_orders(userId: str):
    return data.get_orders(userId)

@app.get("/api/orders/{order_id}")
def get_order_by_id(order_id: str):
    order = data.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.post("/api/orders/{order_id}/cancel")
def cancel_order(order_id: str):
    success, message = data.cancel_order(order_id)
    if not success:
        return {"success": False, "message": message} # Return 200 OK with error message for frontend handling logic
    return {"success": True, "message": message}

@app.get("/api/policies/search")
def search_policies(topic: str):
    print(f"DEBUG: Policy Search - Topic='{topic}'")
    content = search_engine.search_policies(topic)
    return {"policyText": content}

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Voice Agent Backend is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
