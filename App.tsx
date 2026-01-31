import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, ShoppingBag, Search, FileText, HelpCircle, LayoutDashboard, Settings, Upload, Database, ShoppingCart, CheckCircle, Activity, DollarSign, Clock, Key } from 'lucide-react';
import { GeminiLiveService } from './services/geminiLiveService';
import { AppState, ViewMode, Product } from './types';
import { db } from './services/mockData';

// Components
import Visualizer from './components/Visualizer';
import ProductCard from './components/ProductCard';
import OrderCard from './components/OrderCard';
import CartView from './components/CartView';
import ComparisonView from './components/ComparisonView';

const App: React.FC = () => {
    const [isLive, setIsLive] = useState(false);
    const [showDevPanel, setShowDevPanel] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

    const serviceRef = useRef<GeminiLiveService | null>(null);

    // App State
    const [state, setState] = useState<AppState>({
        mode: 'DASHBOARD',
        products: [],
        activeProduct: null,
        activeOrder: null,
        activePolicy: null,
        comparisonProducts: [],
        cart: { items: [], total: 0 },
        metrics: {
            lastLatencyMs: 0,
            avgLatencyMs: 0,
            totalRequests: 0,
            totalCost: 0
        }
    });

    // Initial Fetch ("Frontend" calling "Backend")
    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            const [initialProducts, initialCart] = await Promise.all([
                db.searchProducts(),
                db.getCart()
            ]);
            setState(prev => ({
                ...prev,
                products: initialProducts,
                cart: initialCart
            }));
            setIsLoading(false);
        };
        initData();
    }, []);

    // --- DATA FRESHNESS: ON-DEMAND LOGIC ---
    useEffect(() => {
        const refreshData = async () => {
            // Fetch fresh data only when the view changes
            try {
                if (state.mode === 'DASHBOARD') {
                    // Refresh catalog to check for stock changes
                    const freshProducts = await db.searchProducts();
                    setState(prev => ({ ...prev, products: freshProducts }));
                } else if (state.mode === 'ORDER_DETAIL' && state.activeOrder) {
                    // Refresh status of active order
                    const freshOrder = await db.trackOrder(state.activeOrder.id);
                    if (freshOrder) {
                        // Only update if data actually changed to prevent loops
                        setState(prev => {
                            if (JSON.stringify(prev.activeOrder) !== JSON.stringify(freshOrder)) {
                                return { ...prev, activeOrder: freshOrder };
                            }
                            return prev;
                        });
                    }
                } else if (state.mode === 'CART') {
                    // Refresh cart totals and stock validation
                    const freshCart = await db.getCart();
                    setState(prev => ({ ...prev, cart: freshCart }));
                }
            } catch (e) {
                console.warn("Refresh failed", e);
            }
        };

        refreshData();
    }, [state.mode, state.activeOrder?.id]);

    const updateState = (update: Partial<AppState>) => {
        setState(prev => ({ ...prev, ...update }));
    };

    const updateMetrics = (costAdd: number, latencyMs?: number) => {
        setState(prev => {
            let newAvg = prev.metrics.avgLatencyMs;
            let newRequests = prev.metrics.totalRequests;
            let newLastLatency = prev.metrics.lastLatencyMs;

            if (latencyMs !== undefined) {
                newRequests += 1;
                newLastLatency = latencyMs;
                newAvg = prev.metrics.avgLatencyMs + (latencyMs - prev.metrics.avgLatencyMs) / newRequests;
            }

            return {
                ...prev,
                metrics: {
                    totalCost: prev.metrics.totalCost + costAdd,
                    lastLatencyMs: newLastLatency,
                    avgLatencyMs: newAvg,
                    totalRequests: newRequests
                }
            };
        });
    };

    // UI Actions calling Async DB
    const addToCart = async (productId: string) => {
        const newCart = await db.addToCart(productId, 1);
        updateState({ cart: newCart });
    };

    const updateQuantity = async (productId: string, quantity: number) => {
        const newCart = await db.updateCartItem(productId, quantity);
        updateState({ cart: newCart });
    }

    const removeItem = async (productId: string) => {
        const newCart = await db.updateCartItem(productId, 0);
        updateState({ cart: newCart });
    }

    const handleCheckout = async () => {
        const order = await db.createOrder('C0001');
        if (order) {
            updateState({ mode: 'CHECKOUT_SUCCESS', activeOrder: order, cart: { items: [], total: 0 } });
        } else {
            alert("Cart is empty!");
        }
    };

    const toggleLive = async () => {
        if (isLive) {
            serviceRef.current?.disconnect();
            setIsLive(false);
            setSessionStartTime(null);
        } else {
            serviceRef.current = new GeminiLiveService(updateState, updateMetrics);
            try {
                await serviceRef.current.connect();
                setIsLive(true);
                setSessionStartTime(Date.now());
            } catch (e) {
                console.error("Failed to connect", e);
                alert("Failed to connect to Gemini Live. Check console/API key.");
            }
        }
    };

    const handleFileUpload = async (type: 'products' | 'orders' | 'policies' | 'faqs', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (Array.isArray(json)) {
                    await db.uploadDataset(type, json);
                    alert(`Successfully uploaded ${type} to backend.`);

                    // Refresh view if applicable
                    if (type === 'products') {
                        const fresh = await db.searchProducts();
                        updateState({ products: fresh });
                    }
                } else {
                    alert("Invalid JSON: Expected an array.");
                }
            } catch (err) {
                alert("Failed to parse JSON.");
            }
        };
        reader.readAsText(file);
    };

    const handleChangeApiKey = async () => {
        const aistudio = (window as any).aistudio;
        if (aistudio && aistudio.openSelectKey) {
            await aistudio.openSelectKey();
            alert("API Key selection initiated.");
        } else {
            alert("API Key selection is not supported in this environment.");
        }
    };

    // Render Content Area based on State
    const renderContent = () => {
        if (isLoading) return <div className="flex h-full items-center justify-center text-slate-400">Loading Store Data...</div>;

        switch (state.mode) {
            case 'DASHBOARD':
                return (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-3xl font-bold mb-2">Welcome to NeurologicAI Store</h2>
                                <p className="text-blue-100 max-w-xl">
                                    I'm your intelligent shopping assistant. I can help you find products,
                                    recommend accessories, and handle your entire purchase.
                                </p>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-10">
                                <ShoppingBag size={150} />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-800">Recommended for You</h3>
                                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    Live Inventory
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {state.products.slice(0, 3).map(p => (
                                    <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'PRODUCT_LIST':
                return (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Search Results</h2>
                            <span className="text-slate-500">{state.products.length} items found</span>
                        </div>
                        {state.products.length === 0 ? (
                            <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
                                <p>No exact matches found.</p>
                                <p className="text-sm mt-2">Try searching for broader categories like "electronics" or "clothing".</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {state.products.map(p => (
                                    <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'PRODUCT_DETAIL':
                return state.activeProduct ? (
                    <div className="max-w-2xl mx-auto">
                        <button
                            onClick={() => setState(s => ({ ...s, mode: 'PRODUCT_LIST' }))}
                            className="mb-4 text-blue-600 hover:underline text-sm font-medium"
                        >
                            &larr; Back to Results
                        </button>
                        <ProductCard product={state.activeProduct} detailed onAddToCart={addToCart} />
                    </div>
                ) : null;

            case 'ORDER_DETAIL':
                return state.activeOrder ? (
                    <div className="max-w-xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Order Details</h2>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Activity size={12} />
                                Auto-refreshing
                            </span>
                        </div>
                        <OrderCard order={state.activeOrder} />
                    </div>
                ) : null;

            case 'POLICY':
                return (
                    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-6 text-blue-600">
                            <FileText size={32} />
                            <h2 className="text-2xl font-bold text-slate-800">Policy Information</h2>
                        </div>
                        <div className="prose prose-slate max-w-none">
                            <p className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
                                {state.activePolicy || "Please ask about a specific policy (returns, shipping, etc.)"}
                            </p>
                        </div>
                    </div>
                );

            case 'CART':
                return (
                    <CartView
                        cart={state.cart}
                        onCheckout={handleCheckout}
                        onContinueShopping={() => updateState({ mode: 'DASHBOARD' })}
                        onUpdateQuantity={updateQuantity}
                        onRemoveItem={removeItem}
                    />
                );

            case 'CHECKOUT_SUCCESS':
                return state.activeOrder ? (
                    <div className="max-w-xl mx-auto text-center pt-10">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                            <CheckCircle size={48} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Order Confirmed!</h2>
                        <p className="text-slate-600 mb-8">
                            Thank you for your purchase. Your order <span className="font-mono font-bold text-slate-900">#{state.activeOrder.id}</span> has been placed successfully.
                        </p>
                        <OrderCard order={state.activeOrder} />
                        <button
                            onClick={() => updateState({ mode: 'DASHBOARD' })}
                            className="mt-8 text-blue-600 hover:underline font-medium"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                ) : null;

            case 'COMPARE':
                return (
                    <ComparisonView
                        products={state.comparisonProducts || []}
                        onAddToCart={addToCart}
                        onBack={() => updateState({ mode: 'DASHBOARD' })}
                    />
                );

            default:
                return <div>Select an option</div>;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <div className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex">
                <div>
                    <div className="p-6 flex items-center gap-3 text-blue-600 font-bold text-xl">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <ShoppingBag size={20} />
                        </div>
                        <span className="hidden lg:block">NeuroShop</span>
                    </div>

                    <nav className="mt-8 px-4 space-y-2">
                        <SidebarItem
                            icon={<LayoutDashboard size={20} />}
                            label="Dashboard"
                            active={state.mode === 'DASHBOARD'}
                            onClick={() => setState(s => ({ ...s, mode: 'DASHBOARD' }))}
                        />
                        <SidebarItem
                            icon={<Search size={20} />}
                            label="Products"
                            active={state.mode === 'PRODUCT_LIST' || state.mode === 'PRODUCT_DETAIL'}
                            onClick={() => setState(s => ({ ...s, mode: 'PRODUCT_LIST' }))}
                        />
                        <SidebarItem
                            icon={<ShoppingBag size={20} />}
                            label="Orders"
                            active={state.mode === 'ORDER_DETAIL'}
                            onClick={async () => {
                                const orders = await db.getOrders('C0001');
                                setState(s => ({ ...s, mode: 'ORDER_DETAIL', activeOrder: orders[0] }))
                            }}
                        />
                        <SidebarItem
                            icon={<ShoppingCart size={20} />}
                            label="Cart"
                            active={state.mode === 'CART'}
                            badge={state.cart.items.reduce((a, b) => a + b.quantity, 0)}
                            onClick={() => setState(s => ({ ...s, mode: 'CART' }))}
                        />
                        <SidebarItem
                            icon={<HelpCircle size={20} />}
                            label="Policies"
                            active={state.mode === 'POLICY'}
                            onClick={() => setState(s => ({ ...s, mode: 'POLICY', activePolicy: null }))}
                        />
                    </nav>
                </div>

                <div className="p-6 border-t border-slate-100">
                    <button
                        onClick={() => setShowDevPanel(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                        <Settings size={20} />
                        <span className="hidden lg:block">Backend DB</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full relative">
                {/* Top Header / Voice Control */}
                <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
                    {/* Left Header Title / Metrics */}
                    <div className="flex flex-col">
                        <h1 className="text-lg font-semibold text-slate-700 hidden sm:block">
                            {state.mode === 'CART' ? 'Shopping Cart' : 'Customer Support Agent'}
                        </h1>
                        {/* Metrics Display */}
                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 font-mono">
                            <div className="flex items-center gap-1" title="Last Request Latency">
                                <Activity size={12} />
                                <span>{state.metrics.lastLatencyMs.toFixed(0)}ms</span>
                            </div>
                            <div className="flex items-center gap-1" title="Average Latency">
                                <Clock size={12} />
                                <span>Avg: {state.metrics.avgLatencyMs.toFixed(0)}ms</span>
                            </div>
                            <div className="flex items-center gap-1" title="Estimated Session Cost">
                                <DollarSign size={12} />
                                <span>${state.metrics.totalCost.toFixed(5)}</span>
                            </div>
                            {sessionStartTime && (
                                <div className="flex items-center gap-1" title="Cost Per Hour Rate">
                                    <DollarSign size={12} />
                                    <span>${(() => {
                                        const elapsedHours = (Date.now() - sessionStartTime) / (1000 * 60 * 60);
                                        const hourlyRate = elapsedHours > 0 ? state.metrics.totalCost / elapsedHours : 0;
                                        return hourlyRate.toFixed(3);
                                    })()} /hr</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleLive}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all shadow-sm ${isLive
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                        >
                            {isLive ? <MicOff size={18} /> : <Mic size={18} />}
                            <span className="hidden sm:inline">{isLive ? 'End Session' : 'Start Agent'}</span>
                        </button>

                        {isLive && <Visualizer isActive={true} />}

                        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                        <button
                            onClick={() => updateState({ mode: 'CART' })}
                            className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors"
                        >
                            <ShoppingCart size={24} />
                            {state.cart.items.length > 0 && (
                                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {state.cart.items.reduce((a, b) => a + b.quantity, 0)}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Dynamic Viewport */}
                <main className="flex-1 overflow-y-auto p-8 bg-slate-50 relative">
                    <div className="max-w-5xl mx-auto h-full pb-20">
                        {renderContent()}
                    </div>
                </main>
            </div>

            {/* Developer Panel Modal */}
            {showDevPanel && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Database size={18} />
                                Backend Database
                            </h3>
                            <button onClick={() => setShowDevPanel(false)} className="text-slate-400 hover:text-slate-600">Close</button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* API Key Selection */}
                            <div className="pb-6 border-b border-slate-100 mb-2">
                                <h4 className="font-bold text-slate-800 mb-2">API Configuration</h4>
                                <p className="text-sm text-slate-600 mb-4">
                                    To use your own Google Cloud Project for billing and quotas, select your API key below.
                                </p>
                                <button
                                    onClick={handleChangeApiKey}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                    <Key size={16} />
                                    <span>Select API Key</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-slate-600">Upload JSON datasets to dynamically update the backend database.</p>

                                <UploadItem label="Product Catalog" type="products" onChange={handleFileUpload} />
                                <UploadItem label="Order Database" type="orders" onChange={handleFileUpload} />
                                <UploadItem label="Product FAQs" type="faqs" onChange={handleFileUpload} />
                                <UploadItem label="Policies" type="policies" onChange={handleFileUpload} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const UploadItem = ({ label, type, onChange }: { label: string, type: any, onChange: any }) => (
    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
        <span className="font-medium text-slate-700">{label}</span>
        <label className="cursor-pointer flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
            <Upload size={16} />
            <span>Upload JSON</span>
            <input type="file" accept=".json" className="hidden" onChange={(e) => onChange(type, e)} />
        </label>
    </div>
);

const SidebarItem = ({ icon, label, active, onClick, badge }: { icon: any, label: string, active: boolean, onClick: () => void, badge?: number }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
    >
        <div className="relative">
            {icon}
            {badge && badge > 0 ? (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
            ) : null}
        </div>
        <span className="hidden lg:block">{label}</span>
    </button>
);

export default App;