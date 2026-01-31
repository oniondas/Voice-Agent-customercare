import React from 'react';
import { Product } from '../types';
import { Star, Check, X, ShoppingCart, ArrowLeft } from 'lucide-react';

interface Props {
  products: Product[];
  onAddToCart: (id: string) => void;
  onBack: () => void;
}

const ComparisonView: React.FC<Props> = ({ products, onAddToCart, onBack }) => {
  if (!products || products.length === 0) return <div>No products to compare</div>;

  const featuresList = Array.from(new Set(products.flatMap(p => p.features || [])));

  return (
    <div className="max-w-6xl mx-auto">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-medium"
      >
        <ArrowLeft size={18} className="mr-1" /> Back to Dashboard
      </button>

      <h2 className="text-2xl font-bold text-slate-800 mb-6">Product Comparison</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-left text-sm font-semibold text-slate-500 w-48">Feature</th>
              {products.map(p => (
                <th key={p.id} className="p-4 text-left w-64 align-top">
                   <div className="font-bold text-slate-800 text-lg">{p.name}</div>
                   <div className="text-blue-600 text-sm font-medium">{p.category}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Price */}
            <tr>
              <td className="p-4 text-sm font-medium text-slate-600 bg-slate-50/30">Price</td>
              {products.map(p => (
                <td key={p.id} className="p-4">
                  <span className="text-xl font-bold text-slate-900">${p.price.toFixed(2)}</span>
                  {p.discountPercentage && p.discountPercentage > 0 && (
                     <span className="ml-2 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                       -{p.discountPercentage}%
                     </span>
                  )}
                </td>
              ))}
            </tr>
            {/* Rating */}
            <tr>
              <td className="p-4 text-sm font-medium text-slate-600 bg-slate-50/30">Rating</td>
              {products.map(p => (
                <td key={p.id} className="p-4">
                  <div className="flex items-center text-amber-500">
                    <Star size={16} fill="currentColor" />
                    <span className="ml-1 font-bold">{p.rating}</span>
                    <span className="text-slate-400 text-sm ml-1">({p.reviews})</span>
                  </div>
                </td>
              ))}
            </tr>
            {/* Delivery */}
            <tr>
              <td className="p-4 text-sm font-medium text-slate-600 bg-slate-50/30">Delivery</td>
              {products.map(p => (
                <td key={p.id} className="p-4 text-sm text-slate-700">
                   {p.deliveryTimeDays} days
                </td>
              ))}
            </tr>
             {/* Returns */}
             <tr>
              <td className="p-4 text-sm font-medium text-slate-600 bg-slate-50/30">Return Policy</td>
              {products.map(p => (
                <td key={p.id} className="p-4 text-sm">
                   {p.returnEligible ? (
                       <span className="text-green-600 flex items-center gap-1 font-medium"><Check size={14}/> Eligible</span>
                   ) : (
                       <span className="text-amber-600 flex items-center gap-1 font-medium"><X size={14}/> Final Sale</span>
                   )}
                </td>
              ))}
            </tr>
            {/* Availability */}
             <tr>
              <td className="p-4 text-sm font-medium text-slate-600 bg-slate-50/30">Availability</td>
              {products.map(p => (
                <td key={p.id} className="p-4 text-sm">
                   {p.stock > 0 ? (
                       <span className="text-green-600 font-medium">In Stock ({p.stock})</span>
                   ) : (
                       <span className="text-red-500 font-medium">Out of Stock</span>
                   )}
                </td>
              ))}
            </tr>
            {/* Features Header */}
            <tr className="bg-slate-50">
                <td colSpan={products.length + 1} className="p-2 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                    Key Features
                </td>
            </tr>
            {/* Features Rows */}
            {featuresList.slice(0, 6).map((feature, idx) => (
               <tr key={idx}>
                 <td className="p-4 text-sm font-medium text-slate-600 bg-slate-50/30" title={feature}>
                    {feature.length > 30 ? feature.substring(0, 30) + '...' : feature}
                 </td>
                 {products.map(p => (
                   <td key={p.id} className="p-4">
                      {p.features?.some(f => f.includes(feature) || feature.includes(f)) ? (
                          <div className="flex justify-center w-8 h-8 rounded-full bg-blue-50 items-center mx-auto lg:mx-0">
                            <Check size={16} className="text-blue-600" />
                          </div>
                      ) : (
                          <div className="text-slate-200 text-center lg:text-left">-</div>
                      )}
                   </td>
                 ))}
               </tr>
            ))}
             {/* Action */}
             <tr className="bg-slate-50">
              <td className="p-4"></td>
              {products.map(p => (
                <td key={p.id} className="p-4">
                   <button 
                      onClick={() => onAddToCart(p.id)}
                      disabled={p.stock === 0}
                      className={`w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                          p.stock > 0 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                   >
                       <ShoppingCart size={16} /> Add to Cart
                   </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonView;