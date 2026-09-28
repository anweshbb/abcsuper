import React from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Truck, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  currencySymbol: string;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  currencySymbol,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
  const freeDeliveryThreshold = 35;
  const isFreeDelivery = subtotal >= freeDeliveryThreshold || subtotal === 0;
  const deliveryFee = isFreeDelivery ? 0 : 3.99;
  const estimatedTax = subtotal * 0.05;
  const grandTotal = subtotal + deliveryFee + estimatedTax;

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  Shopping Cart
                </h2>
                <p className="text-xs text-gray-500">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in your cart
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close cart"
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery progress bar */}
          {subtotal > 0 && (
            <div className="bg-emerald-50 px-4 sm:px-6 py-2.5 border-b border-emerald-100 flex items-center gap-3 text-xs text-emerald-800">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              {isFreeDelivery ? (
                <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>You've unlocked FREE Supermarket Delivery!</span>
                </div>
              ) : (
                <div>
                  Add{' '}
                  <span className="font-bold text-emerald-900">
                    {currencySymbol}
                    {(freeDeliveryThreshold - subtotal).toFixed(2)}
                  </span>{' '}
                  more for <strong>FREE Delivery</strong>
                </div>
              )}
            </div>
          )}

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-gray-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Your cart is empty</h3>
                  <p className="mt-1 text-xs text-gray-500 max-w-xs">
                    Browse the supermarket aisles and add fresh groceries to your cart.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map(({ item, quantity }) => {
                const isMax = quantity >= item.stock;
                return (
                  <div key={item.id} className="py-4 flex gap-3 sm:gap-4 items-center">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200 shrink-0 bg-gray-50"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-xs font-bold text-gray-900 font-mono">
                          {currencySymbol}{item.price.toFixed(2)}
                        </span>
                        {item.unit && (
                          <span className="text-[11px] text-gray-500">
                            /{item.unit}
                          </span>
                        )}
                      </div>

                      {/* Stock Warning */}
                      {quantity > item.stock && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-red-600 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          <span>Only {item.stock} left in stock!</span>
                        </div>
                      )}

                      {/* Stepper */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-lg bg-gray-50 border border-gray-200 p-0.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-gray-900 font-mono">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            disabled={isMax}
                            className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-emerald-900 font-mono">
                            {currencySymbol}{(item.price * quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      title="Remove item"
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Totals */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-200 space-y-3">
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-gray-900">
                    {currencySymbol}{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-mono font-medium text-gray-900">
                    {isFreeDelivery ? 'FREE' : `${currencySymbol}${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Tax (5%)</span>
                  <span className="font-mono font-medium text-gray-900">
                    {currencySymbol}{estimatedTax.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between text-sm sm:text-base font-bold text-gray-900">
                  <span>Grand Total</span>
                  <span className="font-mono text-emerald-700">
                    {currencySymbol}{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClearCart}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-red-600 bg-white border border-gray-200 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCheckout();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm cursor-pointer"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
