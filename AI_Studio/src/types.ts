
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  rating: number;
  reviews: number;
  features?: string[];
  deliveryTimeDays?: number;
  returnEligible?: boolean;
  discountPercentage?: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: { productId: string; quantity: number; name: string; price: number }[];
  status: 'Placed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  date: string;
  total: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface Policy {
  topic: string;
  content: string;
}

export interface FAQ {
  productId: string;
  question: string;
  answer: string;
}

export interface AppMetrics {
  lastLatencyMs: number;
  avgLatencyMs: number;
  totalRequests: number;
  totalCost: number;
}

// UI State Types
export type ViewMode = 'DASHBOARD' | 'PRODUCT_LIST' | 'PRODUCT_DETAIL' | 'ORDER_DETAIL' | 'POLICY' | 'CART' | 'CHECKOUT_SUCCESS' | 'COMPARE';

export interface AppState {
  mode: ViewMode;
  activeProduct?: Product | null;
  activeOrder?: Order | null;
  activePolicy?: string | null;
  products: Product[]; // Current filtered list
  comparisonProducts?: Product[];
  cart: Cart;
  metrics: AppMetrics;
}
