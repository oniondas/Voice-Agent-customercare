import React from 'react';
import { Product } from '../types';
import { Star, Check, AlertTriangle, ShoppingCart, Truck, RotateCcw, Tag } from 'lucide-react';
import * as MockData from '../services/mockData';

interface Props {
  product: Product;
  detailed?: boolean;
  onAddToCart?: (id: string) => void;
}

const ProductCard: React.FC<Props> = ({ product, detailed = false, onAddToCart }) => {

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product.id);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col ${detailed ? 'h-full' : 'hover:shadow-md transition-shadow'}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">
          {product.category}
        </span>
        <div className="flex items-center text-amber-500 text-sm">
          <Star size={16} fill="currentColor" />
          <span className="ml-1 font-medium">{product.rating}</span>
          <span className="text-slate-400 ml-1">({product.reviews})</span>
        </div>
      </div>

      <h3 className={`${detailed ? 'text-2xl' : 'text-lg'} font-bold text-slate-800 mb-2`}>{product.name}</h3>

      <div className="mb-4 flex items-center gap-3">
        <span className="text-xl font-bold text-slate-900">₹{product.price.toFixed(2)}</span>
        {product.discountPercentage && product.discountPercentage > 0 && (
          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center gap-1">
            <Tag size={12} /> -{product.discountPercentage}%
          </span>
        )}
      </div>

      <div className="mb-4 text-slate-600 text-sm leading-relaxed flex-grow">
        {product.description}
      </div>

      <div className="mb-4 space-y-2">
        {product.stock > 0 ? (
          <div className="flex items-center text-green-600 text-sm">
            <Check size={16} className="mr-2" />
            <span>In Stock ({product.stock} available)</span>
          </div>
        ) : (
          <div className="flex items-center text-red-500 text-sm">
            <AlertTriangle size={16} className="mr-2" />
            <span>Out of Stock</span>
          </div>
        )}

        {detailed && (
          <>
            <div className="flex items-center text-slate-600 text-sm">
              <Truck size={16} className="mr-2" />
              <span>Delivers in {product.deliveryTimeDays} days</span>
            </div>
            <div className={`flex items-center text-sm ${product.returnEligible ? 'text-slate-600' : 'text-amber-600'}`}>
              <RotateCcw size={16} className="mr-2" />
              <span>{product.returnEligible ? '30-Day Returns Eligible' : 'Final Sale - No Returns'}</span>
            </div>
          </>
        )}
      </div>

      {detailed && product.features && (
        <div className="mt-6 pt-6 border-t border-slate-100 mb-6">
          <h4 className="font-semibold text-slate-800 mb-3">Key Features</h4>
          <ul className="space-y-2">
            {product.features.map((feat, idx) => (
              <li key={idx} className="flex items-center text-slate-600 text-sm">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                {feat}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Area */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${product.stock > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
        >
          <ShoppingCart size={18} />
          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;