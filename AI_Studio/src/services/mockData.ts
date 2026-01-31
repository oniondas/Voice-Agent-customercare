import { Product, Order, Policy, FAQ, Cart } from '../types';

// --- LOCAL DATA IMPORTS ---
import productsData from '../data/product_catalog.json';
import ordersData from '../data/orders.json';
import faqsData from '../data/faqs.json';

// Type assertions
const PRODUCTS: Product[] = productsData as Product[];
const ORDERS: Order[] = ordersData as Order[];
const FAQS: FAQ[] = faqsData as FAQ[];

// --- CLIENT-SIDE STATE ---
let SESSION_CART: Cart = { items: [], total: 0 };
let ORDER_COUNTER = ORDERS.length > 0 ? Math.max(...ORDERS.map(o => parseInt(o.id.replace('ORD', '')))) : 1000;

// --- PUBLIC API SERVICE (Frontend-Only, No Backend) ---

export const db = {
    // 1. PRODUCT CATALOG API
    searchProducts: async (query?: string, category?: string): Promise<Product[]> => {
        let results = [...PRODUCTS];

        if (category) {
            results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
        }

        if (query) {
            const q = query.toLowerCase();
            results = results.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q)
            );
        }

        return results.filter(p => p.stock > 0); // Only in-stock items
    },

    getProductById: async (id: string): Promise<Product | undefined> => {
        return PRODUCTS.find(p => p.id === id);
    },

    getRelatedProducts: async (productId: string): Promise<Product[]> => {
        const product = await db.getProductById(productId);
        if (!product) return [];

        // Simple related products logic: same category, different product
        return PRODUCTS
            .filter(p => p.category === product.category && p.id !== productId && p.stock > 0)
            .slice(0, 3);
    },

    getRecommendedProducts: async (): Promise<Product[]> => {
        // Return top products with stock
        return PRODUCTS.filter(p => p.stock > 0).slice(0, 6);
    },

    getProductFaqs: async (productId: string): Promise<FAQ[]> => {
        return FAQS.filter(f => f.productId === productId);
    },

    // 2. ORDER MANAGEMENT API
    getOrders: async (customerId: string): Promise<Order[]> => {
        return ORDERS.filter(o => o.userId === customerId);
    },

    getOrderById: async (orderId: string): Promise<Order | undefined> => {
        return ORDERS.find(o => o.id === orderId);
    },

    trackOrder: async (orderId: string): Promise<Order | undefined> => {
        return await db.getOrderById(orderId);
    },

    cancelOrder: async (orderId: string): Promise<{ success: boolean; message: string }> => {
        const order = ORDERS.find(o => o.id === orderId);
        if (!order) {
            return { success: false, message: "Order not found." };
        }
        if (order.status === 'delivered') {
            return { success: false, message: "Cannot cancel delivered orders." };
        }
        order.status = 'cancelled';
        return { success: true, message: `Order ${orderId} has been cancelled.` };
    },

    createOrder: async (customerId: string): Promise<Order | null> => {
        if (SESSION_CART.items.length === 0) return null;

        ORDER_COUNTER++;
        const newOrder: Order = {
            id: `ORD${ORDER_COUNTER}`,
            userId: customerId,
            items: SESSION_CART.items.map(i => ({
                productId: i.productId,
                name: i.name,
                quantity: i.quantity,
                price: i.price
            })),
            total: SESSION_CART.total,
            status: 'pending',
            date: new Date().toISOString()
        };

        ORDERS.push(newOrder);

        // Deduct stock (in-memory only)
        SESSION_CART.items.forEach(item => {
            const product = PRODUCTS.find(p => p.id === item.productId);
            if (product) {
                product.stock -= item.quantity;
            }
        });

        SESSION_CART = { items: [], total: 0 };
        return newOrder;
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
        // Simple keyword matching for policies
        const policies: Record<string, string> = {
            "return": "**Return Policy**: Items can be returned within 30 days of purchase with original packaging. Refund processed within 7 business days.",
            "shipping": "**Shipping Policy**: Free shipping on orders above ₹500. Standard delivery takes 3-5 business days. Express delivery available for ₹99.",
            "cancellation": "**Cancellation Policy**: Orders can be cancelled within 24 hours of placement. No cancellation fee applies for orders not yet shipped.",
            "warranty": "**Warranty Policy**: All electronics come with 1-year manufacturer warranty. Extended warranty available at checkout."
        };

        const key = Object.keys(policies).find(k => topic.toLowerCase().includes(k));
        return key ? policies[key] : "Policy information not found. Please contact customer support.";
    },

    // 5. SYSTEM CONTEXT AGGREGATION
    getSystemContext: async () => {
        const categories = [...new Set(PRODUCTS.map(p => p.category))];
        return {
            currentUser: { id: 'C0001', name: 'Verified Customer' },
            availableCategories: categories,
            availablePolicyTopics: ["Returns", "Shipping", "Cancellations", "Warranty"],
            myOrdersSummary: ORDERS.slice(0, 3)
        };
    },

    // 6. ADMIN / DYNAMIC UPDATES API (Frontend-Only)
    uploadDataset: async (type: 'products' | 'orders' | 'policies' | 'faqs', data: any[]) => {
        console.log(`Upload not supported in frontend-only version.`);
        return true;
    }
};