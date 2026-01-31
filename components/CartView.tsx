import React from 'react';
import { Cart } from '../types';
import { Trash2, ShoppingBag, ArrowRight, Plus, Minus } from 'lucide-react';
import * as MockData from '../services/mockData';

interface Props {
  cart: Cart;
  onCheckout: () => void;
  onContinueShopping: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

const CartView: React.FC<Props> = ({ cart, onCheckout, onContinueShopping, onUpdateQuantity, onRemoveItem }) => {
  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
          <ShoppingBag size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
        <p className="text-slate-500 mb-6">Looks like you haven't added anything yet.</p>
        <button 
          onClick={onContinueShopping}
          className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <ShoppingBag size={24} />
        Shopping Cart ({cart.items.length})
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item, idx) => (
            <div key={`${item.productId}-${idx}`} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{item.name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                      <button 
                        onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                        className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                          <Minus size={14} />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                        className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                          <Plus size={14} />
                      </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                    <p className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-xs text-slate-500">${item.price.toFixed(2)} each</p>
                </div>
                <button 
                    onClick={() => onRemoveItem(item.productId)}
                    className="text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Remove Item"
                >
                    <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6">
            <h3 className="font-bold text-slate-800 mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-lg text-slate-900">
                <span>Total</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={onCheckout}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              Checkout <ArrowRight size={18} />
            </button>
            
            <button 
                onClick={onContinueShopping}
                className="w-full mt-3 text-slate-500 text-sm hover:text-slate-800"
            >
                Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartView;