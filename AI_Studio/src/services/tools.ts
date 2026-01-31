import { Tool, Type } from '@google/genai';
import { db } from './mockData';
import { AppState } from '../types';

export const TOOLS: Tool[] = [{
  functionDeclarations: [
    {
      name: 'search_products',
      description: 'The AUTHORITATIVE source for product information. MUST be called for any product lookup, availability check, or price check. Returns detailed metadata (stock, specs, ratings).',
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: { type: Type.STRING, description: 'Search term (product name, category, or feature)' },
          category: { type: Type.STRING, description: 'Optional category filter' }
        }
      }
    },
    {
      name: 'get_product_details',
      description: 'Get detailed information about a specific product including specs, stock, and return eligibility. REQUIRED for customer support queries (returns/refunds) to check if the item is returnable.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          productId: { type: Type.STRING, description: 'The exact product ID (e.g., P001)' }
        },
        required: ['productId']
      }
    },
    {
      name: 'compare_products',
      description: 'Compare 2-4 products side-by-side. Use this when the user wants to choose between specific items or asks for a comparison.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          productIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of product IDs to compare'
          }
        },
        required: ['productIds']
      }
    },
    {
      name: 'get_my_orders',
      description: 'List recent orders for the current user.',
      parameters: { type: Type.OBJECT, properties: {} } // No params needed for current user context
    },
    {
      name: 'track_order',
      description: 'Get status and details of a specific order.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          orderId: { type: Type.STRING, description: 'The order ID or part of it (e.g., 7782)' }
        },
        required: ['orderId']
      }
    },
    {
      name: 'cancel_order',
      description: 'Attempt to cancel an order.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          orderId: { type: Type.STRING, description: 'The order ID' }
        },
        required: ['orderId']
      }
    },
    {
      name: 'get_policy',
      description: 'Get official company policy information. REQUIRED for customer support queries about returns, refunds, cancellations, shipping, or warranty. Always call this to cite accurate policy terms.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING, description: 'The policy topic (returns, cancellation, refunds, warranty, shipping)' }
        },
        required: ['topic']
      }
    },
    {
      name: 'add_to_cart',
      description: 'Add a product to the user\'s shopping cart.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          productId: { type: Type.STRING, description: 'The product ID' },
          quantity: { type: Type.NUMBER, description: 'Quantity to add (default 1)' }
        },
        required: ['productId']
      }
    },
    {
      name: 'update_cart_quantity',
      description: 'Update the quantity of a specific item in the cart.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          productId: { type: Type.STRING, description: 'The product ID' },
          quantity: { type: Type.NUMBER, description: 'The new quantity' }
        },
        required: ['productId', 'quantity']
      }
    },
    {
      name: 'remove_from_cart',
      description: 'Remove a specific item from the cart completely.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          productId: { type: Type.STRING, description: 'The product ID' }
        },
        required: ['productId']
      }
    },
    {
      name: 'view_cart',
      description: 'View the current contents of the shopping cart.',
      parameters: { type: Type.OBJECT, properties: {} }
    },
    {
      name: 'checkout',
      description: 'Proceed to checkout with the current cart items.',
      parameters: { type: Type.OBJECT, properties: {} }
    }
  ]
}];

export const executeTool = async (name: string, args: any, updateState: (u: Partial<AppState>) => void): Promise<any> => {
  console.log(`[ToolExec] ${name}`, args);
  let result: any = { error: 'Unknown tool' };

  try {
    switch (name) {
      case 'search_products': {
        const products = await db.searchProducts(args.query as string, args.category as string);
        // Always switch to PRODUCT_LIST view to show user the results
        updateState({ mode: 'PRODUCT_LIST', products });

        if (products.length === 0) {
          result = { message: 'No exact products found. Ask the user what they\'re looking for or what features matter to them, then try a broader search.' };
        } else {
          // Check if results include semantic matches for internal tracking
          const hasSemanticMatch = products.some((p: any) => p.source === 'semantic_match');

          // Return products directly - agent will present them naturally
          // Don't announce search strategy to the user
          result = products.slice(0, 8);
        }
        break;
      }
      case 'get_product_details': {
        const product = await db.getProductById(args.productId as string);
        if (product) {
          const faqs = await db.getProductFaqs(product.id);
          const related = await db.getRelatedProducts(product.id);
          updateState({ mode: 'PRODUCT_DETAIL', activeProduct: product });
          result = { product, faqs, related_items_to_upsell: related };
        } else {
          result = { error: 'Product not found' };
        }
        break;
      }
      case 'compare_products': {
        const ids = args.productIds as string[];
        const products = [];
        for (const id of ids) {
          const p = await db.getProductById(id);
          if (p) products.push(p);
        }

        if (products.length < 2) {
          result = { error: 'Need at least 2 valid products to compare.' };
        } else {
          updateState({ mode: 'COMPARE', comparisonProducts: products });
          // Return simplified structure for LLM to reason about without token bloat
          result = {
            message: 'Comparison view displayed.',
            comparison_table: products.map(p => ({
              name: p.name,
              price: p.price,
              rating: p.rating,
              delivery: `${p.deliveryTimeDays} days`,
              return_eligible: p.returnEligible,
              stock: p.stock
            }))
          };
        }
        break;
      }
      case 'get_my_orders': {
        const orders = await db.getOrders('C0001'); // Hardcoded user for demo
        result = orders;
        break;
      }
      case 'track_order': {
        const order = await db.trackOrder(args.orderId as string);
        if (order) {
          updateState({ mode: 'ORDER_DETAIL', activeOrder: order });
          result = order;
        } else {
          result = { error: 'Order not found' };
        }
        break;
      }
      case 'cancel_order': {
        const res = await db.cancelOrder(args.orderId as string);
        if (res.success) {
          const updatedOrder = await db.getOrderById(args.orderId as string);
          if (updatedOrder) updateState({ mode: 'ORDER_DETAIL', activeOrder: updatedOrder });
        }
        result = res;
        break;
      }
      case 'get_policy': {
        const policy = await db.getPolicy(args.topic as string);
        updateState({ mode: 'POLICY', activePolicy: policy });
        result = { policyText: policy };
        break;
      }
      case 'add_to_cart': {
        const qty = args.quantity || 1;
        const cart = await db.addToCart(args.productId, qty);
        updateState({ cart });

        // Generate Upsell context
        const related = await db.getRelatedProducts(args.productId);
        const product = await db.getProductById(args.productId);

        result = {
          message: `Added ${qty} x ${product?.name} to cart. Total: $${cart.total.toFixed(2)}.`,
          upsell_recommendations: related.map(p => ({ id: p.id, name: p.name, price: p.price }))
        };
        break;
      }
      case 'update_cart_quantity': {
        const cart = await db.updateCartItem(args.productId, args.quantity);
        updateState({ cart });
        result = { message: 'Cart updated', cart };
        break;
      }
      case 'remove_from_cart': {
        const cart = await db.updateCartItem(args.productId, 0);
        updateState({ cart });
        result = { message: 'Item removed from cart', cart };
        break;
      }
      case 'view_cart': {
        const cart = await db.getCart();
        updateState({ mode: 'CART', cart });
        result = cart;
        break;
      }
      case 'checkout': {
        const order = await db.createOrder('C0001');
        if (order) {
          updateState({ mode: 'CHECKOUT_SUCCESS', activeOrder: order, cart: { items: [], total: 0 } });
          result = { success: true, orderId: order.id, message: 'Order placed successfully' };
        } else {
          result = { success: false, message: 'Cart is empty' };
        }
        break;
      }
    }
  } catch (e) {
    console.error(e);
    result = { error: 'Failed to execute tool (Server Error)' };
  }
  return result;
};