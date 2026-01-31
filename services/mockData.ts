import { Product, Order, Policy, FAQ, Cart } from '../types';

// --- API CONFIG ---
const API_BASE_URL = "http://localhost:8000/api";

// --- CLIENT-SIDE STATE ---
// Cart is still session-based on the client for now, or could sync with backend if backend supported session/cart persistence.
// For this "Phase 1" backend integration, we keep Cart local-only but Products/Orders come from DB.
let SESSION_CART: Cart = { items: [], total: 0 };

// --- PUBLIC ASYNC API SERVICE (The "Frontend-to-Backend" Bridge) ---

export const db = {
    // 1. PRODUCT CATALOG API
    searchProducts: async (query?: string, category?: string): Promise<Product[]> => {
        try {
            const params = new URLSearchParams();
            if (query) params.append("q", query);
            if (category) params.append("cat", category);

            const res = await fetch(`${API_BASE_URL}/products/search?${params.toString()}`);
            if (!res.ok) throw new Error("Search failed");
            return await res.json();
        } catch (e) {
            console.error("API Error:", e);
            return [];
        }
    },

    getProductById: async (id: string): Promise<Product | undefined> => {
        try {
            const res = await fetch(`${API_BASE_URL}/products/${id}`);
            if (!res.ok) return undefined;
            return await res.json();
        } catch (e) {
            console.error("API Error:", e);
            return undefined;
        }
    },

    getRelatedProducts: async (productId: string): Promise<Product[]> => {
        try {
            const res = await fetch(`${API_BASE_URL}/products/${productId}/related`);
            return await res.json();
        } catch (e) {
            return [];
        }
    },

    getRecommendedProducts: async (): Promise<Product[]> => {
        try {
            const res = await fetch(`${API_BASE_URL}/products/recommendations`);
            return await res.json();
        } catch (e) {
            return [];
        }
    },

    getProductFaqs: async (productId: string): Promise<FAQ[]> => {
        try {
            const res = await fetch(`${API_BASE_URL}/products/${productId}/faq`);
            return await res.json();
        } catch (e) {
            return [];
        }
    },

    // 2. ORDER MANAGEMENT API
    getOrders: async (customerId: string): Promise<Order[]> => {
        try {
            const res = await fetch(`${API_BASE_URL}/orders?userId=${customerId}`);
            return await res.json();
        } catch (e) {
            return [];
        }
    },

    getOrderById: async (orderId: string): Promise<Order | undefined> => {
        try {
            const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
            if (!res.ok) return undefined;
            return await res.json();
        } catch (e) {
            return undefined;
        }
    },

    trackOrder: async (orderId: string): Promise<Order | undefined> => {
        return await db.getOrderById(orderId);
    },

    cancelOrder: async (orderId: string): Promise<{ success: boolean; message: string }> => {
        try {
            const res = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, { method: 'POST' });
            return await res.json();
        } catch (e) {
            return { success: false, message: "Network error during cancellation." };
        }
    },

    createOrder: async (customerId: string): Promise<Order | null> => {
        if (SESSION_CART.items.length === 0) return null;

        try {
            const res = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: customerId,
                    items: SESSION_CART.items.map(i => ({
                        productId: i.productId,
                        quantity: i.quantity
                    }))
                })
            });

            if (!res.ok) throw new Error("Order creation failed on backend");

            const newOrder = await res.json();
            SESSION_CART = { items: [], total: 0 };
            return newOrder;
        } catch (e) {
            console.error("API Error during checkout:", e);
            return null;
        }
    },

    // 3. CART API (Client-Side, Session based)
    getCart: async (): Promise<Cart> => {
        return { ...SESSION_CART };
    },

    addToCart: async (productId: string, quantity: number): Promise<Cart> => {
        const product = await db.getProductById(productId);
        if (!product) return SESSION_CART;

        const existing = SESSION_CART.items.find(i => i.productId === productId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            SESSION_CART.items.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity
            });
        }

        SESSION_CART.total = SESSION_CART.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
        return { ...SESSION_CART };
    },

    updateCartItem: async (productId: string, quantity: number): Promise<Cart> => {
        const idx = SESSION_CART.items.findIndex(i => i.productId === productId);
        if (idx !== -1) {
            if (quantity <= 0) SESSION_CART.items.splice(idx, 1);
            else SESSION_CART.items[idx].quantity = quantity;
        }
        SESSION_CART.total = SESSION_CART.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
        return { ...SESSION_CART };
    },

    // 4. KNOWLEDGE BASE API
    getPolicy: async (topic: string): Promise<string> => {
        try {
            const res = await fetch(`${API_BASE_URL}/policies/search?topic=${encodeURIComponent(topic)}`);
            const data = await res.json();
            return data.policyText || "Policy not found.";
        } catch (e) {
            return "Unable to fetch policy.";
        }
    },

    // 5. SYSTEM CONTEXT AGGREGATION
    getSystemContext: async () => {
        // This helps Gemini know what's available.
        // potentially fetch categories from backend if dynamic
        return {
            currentUser: { id: 'C0001', name: 'Verified Customer' },
            availableCategories: ["Electronics", "Clothing", "Home & Kitchen"], // Hardcoded or fetch
            availablePolicyTopics: ["Returns", "Shipping", "Cancellations"],
            myOrdersSummary: [] // Could fetch recent orders summary here
        };
    },

    // 6. ADMIN / DYNAMIC UPDATES API
    uploadDataset: async (type: 'products' | 'orders' | 'policies' | 'faqs', data: any[]) => {
        console.log("Upload not supported in this version.");
        return true;
    }
};