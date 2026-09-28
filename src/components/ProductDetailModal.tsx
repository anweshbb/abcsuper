import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Check, 
  AlertTriangle, 
  TrendingDown, 
  Tag, 
  Layers 
} from 'lucide-react';
import { SupermarketItem } from '../types';
import { getCategoryFallbackImage } from '../services/sheetService';

interface ProductDetailModalProps {
  item: SupermarketItem | null;
  currencySymbol: string;
  cartQuantity: number;
  onClose: () => void;
  onAddToCart: (item: SupermarketItem) => void;
  onUpdateCartQuantity: (itemId: string, delta: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  item,
  currencySymbol,
  cartQuantity,
  onClose,
  onAddToCart,
  onUpdateCartQuantity,
}) => {
  const [imageError, setImageError] = useState(false);

  if (!item) return null;

  const isOutOfStock = item.stock <= 0;
  const isLowStock = item.stock > 0 && item.stock <= 5;
  const maxReached = cartQuantity >= item.stock;

  const displayImage = imageError || !item.imageUrl
    ? getCategoryFallbackImage(item.name, item.category)
    : item.imageUrl;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity"
        />

        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close details"
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-gray-700 shadow-sm transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Product Image */}
          <div className="relative aspect-16/10 w-full bg-gray-50 overflow-hidden">
            <img
              src={displayImage}
              alt={item.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
            {item.badge && (
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                {item.badge}
              </span>
            )}
            {item.priceChange === 'decreased' && (
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                Price Dropped!
              </span>
            )}
          </div>

          {/* Details Content */}
          <div className="p-6 space-y-4">
            
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1.5">
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100">
                  {item.category}
                </span>
                {item.sku && (
                  <span className="text-gray-400 font-mono">
                    SKU: {item.sku}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                {item.name}
              </h2>
            </div>

            {/* Pricing block */}
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight font-mono">
                {currencySymbol}{item.price.toFixed(2)}
              </span>
              {item.unit && (
                <span className="text-sm text-gray-500 font-medium">
                  / {item.unit}
                </span>
              )}
              {item.originalPrice && item.originalPrice > item.price && (
                <span className="text-sm text-gray-400 line-through">
                  {currencySymbol}{item.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock indicator */}
            <div className="py-2 px-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-600">Availability:</span>
              {isOutOfStock ? (
                <span className="font-bold text-red-600">Out of Stock</span>
              ) : isLowStock ? (
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Low Stock ({item.stock} available)
                </span>
              ) : (
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  In Stock ({item.stock} available)
                </span>
              )}
            </div>

            {/* Description */}
            {item.description && (
              <div className="text-xs sm:text-sm text-gray-600 leading-relaxed pt-1">
                <p>{item.description}</p>
              </div>
            )}

            {/* Cart Actions */}
            <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
              {isOutOfStock ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed text-center"
                >
                  Currently Out of Stock
                </button>
              ) : cartQuantity === 0 ? (
                <button
                  type="button"
                  onClick={() => onAddToCart(item)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Shopping Cart</span>
                </button>
              ) : (
                <div className="w-full flex items-center justify-between p-1 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => onUpdateCartQuantity(item.id, -1)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-emerald-800 hover:bg-emerald-200/60 transition-colors cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-bold text-sm text-emerald-900 font-mono">
                      {cartQuantity} in cart
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateCartQuantity(item.id, 1)}
                      disabled={maxReached}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-emerald-800 hover:bg-emerald-200/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="pr-3 text-sm font-bold text-emerald-900 font-mono">
                    {currencySymbol}{(item.price * cartQuantity).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
