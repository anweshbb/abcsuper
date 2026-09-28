import React from 'react';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Truck, 
  Sparkles 
} from 'lucide-react';
import { CartItem } from '../types';

interface CartPanelProps {
  cart: CartItem[];
  currencySymbol: string;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  cart,
  currencySymbol,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}) => {
  const subtotal = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
  const freeDeliveryThreshold = 200;
  const isFreeDelivery = subtotal >= freeDeliveryThreshold || subtotal === 0;
  const deliveryFee = isFreeDelivery ? 0 : 25;
  const estimatedTax = subtotal * 0.05;
  const grandTotal = subtotal + deliveryFee + estimatedTax;

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs flex flex-col h-[calc(100vh-5.5rem)] sticky top-20 overflow-hidden">
      
      {/* Panel Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-gray-900 tracking-tight">
                Order Cart
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100/80 text-emerald-800 rounded-full font-mono">
                {totalItemCount}
              </span>
            </div>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            title="Empty all items from cart"
            className="text-[11px] font-semibold text-gray-400 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Delivery Milestone Banner */}
      {subtotal > 0 && (
        <div className="bg-emerald-50/60 px-3.5 py-1.5 border-b border-emerald-100/60 flex items-center justify-between text-[11px] text-emerald-800 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <Truck className="w-3 h-3 text-emerald-600 shrink-0" />
            {isFreeDelivery ? (
              <span className="font-semibold text-emerald-900">Free Delivery Unlocked!</span>
            ) : (
              <span>Add <strong className="font-mono text-emerald-950">{currencySymbol}{(freeDeliveryThreshold - subtotal).toFixed(0)}</strong> for free delivery</span>
            )}
          </div>
          {isFreeDelivery && <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />}
        </div>
      )}

      {/* Cart Items List: Single-line ultra-compact items (No Images, fits 20+ items comfortably) */}
      <div className="flex-1 overflow-y-auto px-2.5 py-1 divide-y divide-gray-100/80 min-h-0 space-y-0.5">
        {cart.length === 0 ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600/70 flex items-center justify-center border border-emerald-100/60">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-800">Your cart is empty</h3>
              <p className="mt-0.5 text-[11px] text-gray-400 max-w-[180px]">
                Click "Add" on products to assemble your order.
              </p>
            </div>
          </div>
        ) : (
          cart.map(({ item, quantity }) => {
            const isMax = quantity >= item.stock;
            return (
              <div 
                key={item.id} 
                className="py-1.5 px-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-1.5 text-xs transition-colors group"
              >
                {/* 1. Item Name and rate hint */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="font-medium text-gray-900 truncate leading-tight" title={item.name}>
                    {item.name}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono truncate">
                    {currencySymbol}{item.price.toFixed(0)}{item.unit ? ` / ${item.unit}` : ''}
                  </div>
                </div>

                {/* 2. Stepper: - QTY + */}
                <div className="inline-flex items-center rounded-md bg-gray-100 border border-gray-200/90 p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    title="Decrease quantity"
                    aria-label={`Decrease ${item.name}`}
                    className="w-4.5 h-4.5 flex items-center justify-center rounded text-gray-600 hover:bg-white hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="w-5 text-center text-[11px] font-bold text-gray-900 font-mono">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    disabled={isMax}
                    title={isMax ? 'Maximum stock reached' : 'Increase quantity'}
                    aria-label={`Increase ${item.name}`}
                    className="w-4.5 h-4.5 flex items-center justify-center rounded text-gray-600 hover:bg-white hover:text-gray-900 disabled:opacity-25 transition-colors cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* 3. Total Row Price */}
                <div className="w-13 text-right shrink-0">
                  <span className="font-mono font-bold text-emerald-800 text-xs">
                    {currencySymbol}{(item.price * quantity).toFixed(0)}
                  </span>
                </div>

                {/* 4. Delete Action */}
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  title={`Delete ${item.name}`}
                  aria-label={`Delete ${item.name}`}
                  className="p-1 text-gray-300 hover:text-red-500 rounded hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Panel Footer & Summary */}
      {cart.length > 0 && (
        <div className="p-3 bg-gray-50/80 border-t border-gray-100 space-y-2 shrink-0">
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between text-[11px]">
              <span>Items Total ({totalItemCount})</span>
              <span className="font-mono font-semibold text-gray-900">
                {currencySymbol}{subtotal.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Delivery Fee</span>
              <span className="font-mono font-medium text-gray-800">
                {isFreeDelivery ? (
                  <span className="text-emerald-700 font-bold uppercase text-[10px]">Free</span>
                ) : (
                  `${currencySymbol}${deliveryFee}`
                )}
              </span>
            </div>
            <div className="pt-1.5 border-t border-gray-200/80 flex justify-between text-sm font-bold text-gray-900">
              <span>To Pay</span>
              <span className="font-mono text-emerald-700 text-base font-black">
                {currencySymbol}{grandTotal.toFixed(0)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCheckout}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-sm cursor-pointer"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
};
