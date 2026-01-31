import React from 'react';
import { Order } from '../types';
import { Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Props {
  order: Order;
}

const OrderCard: React.FC<Props> = ({ order }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered': return <CheckCircle className="text-green-500" />;
      case 'Cancelled': return <XCircle className="text-red-500" />;
      case 'Shipped': return <Truck className="text-blue-500" />;
      case 'Out for Delivery': return <Truck className="text-blue-500" />;
      default: return <Clock className="text-amber-500" />;
    }
  };

  const getStatusColor = (status: string) => {
     switch (status) {
      case 'Delivered': return 'bg-green-50 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
      case 'Shipped': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Package size={20} className="text-slate-400" />
            Order #{order.id}
          </h3>
          <p className="text-sm text-slate-500 mt-1">Placed on {order.date}</p>
        </div>
        <div className={`px-3 py-1 rounded-full border flex items-center gap-2 text-sm font-medium ${getStatusColor(order.status)}`}>
          {getStatusIcon(order.status)}
          {order.status}
        </div>
      </div>

      <div className="space-y-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                 {/* Placeholder for product img */}
                 <Package size={20} />
              </div>
              <div>
                <p className="font-medium text-slate-800">{item.name}</p>
                <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
              </div>
            </div>
            <p className="font-medium text-slate-900">${item.price.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
        <span className="font-medium text-slate-600">Total Amount</span>
        <span className="text-xl font-bold text-slate-900">${order.total.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default OrderCard;