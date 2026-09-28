import React, { useState } from 'react';
import { Plus, Minus, ShoppingCart, TrendingDown, AlertTriangle } from 'lucide-react';
import { SupermarketItem } from '../types';
import { getCategoryFallbackImage } from '../services/sheetService';

interface ProductCardProps {
  item: SupermarketItem;
  currencySymbol: string;
  cartQuantity: number;
  onAddToCart: (item: SupermarketItem) => void;
  onUpdateCartQuantity: (itemId: string, delta: number) => void;
  onOpenDetail: (item: SupermarketItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  currencySymbol,
  cartQuantity,
  onAddToCart,
  onUpdateCartQuantity,
  onOpenDetail,
}) => {
  const [imageError, setImageError] = useState(false);
  const isOutOfStock = item.stock <= 0;
  const isLowStock = item.stock > 0 && item.stock <= 5;
  const maxReached = cartQuantity >= item.stock;

  const displayImage = imageError || !item.imageUrl
    ? getCategoryFallbackImage(item.name, item.category)
    : item.imageUrl;

  return (
    <div
      onClick={() => onOpenDetail(item)}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer ${
        isOutOfStock
          ? 'border-gray-200 opacity-75 hover:border-gray-300'
          : 'border-gray-200 hover:border-emerald-300 hover:shadow-lg hover:-translate-y-0.5'
      }`}
    >
      {/* Top Media & Badges */}
      <div className="relative aspect-4/3 w-full bg-gray-50 overflow-hidden">
        <img
          src={displayImage}
          alt={item.name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Live Price Change Badge */}
        {item.priceChange === 'decreased' && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-md animate-pulse">
            <TrendingDown className="w-3 h-3" />
            <span>Price Dropped!</span>
          </div>
        )}

        {/* Regular Badge (Sale, Organic, etc.) */}
        {item.badge && item.priceChange !== 'decreased' && (
          <div className="absolute top-2 left-2 z-10 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-xs">
            {item.badge}
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold tracking-wide uppercase shadow-sm">
              Out of Stock
            </span>
          </div>
        )}

        {/* Category Pill */}
        <div className="absolute bottom-2 left-2 z-10">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 backdrop-blur-xs text-gray-700 shadow-xs border border-gray-100">
            {item.category}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
            {item.name}
          </h3>

          {item.description && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-1">
              {item.description}
            </p>
          )}

          {/* Unit / Stock note */}
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">
              {item.unit ? `Unit: ${item.unit}` : ''}
            </span>

            {isOutOfStock ? (
              <span className="text-red-600 font-semibold">Sold Out</span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                <AlertTriangle className="w-3 h-3" />
                Only {item.stock} left!
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">
                {item.stock} in stock
              </span>
            )}
          </div>
        </div>

        {/* Pricing and Cart Actions */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          
          {/* Price */}
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                {currencySymbol}{item.price.toFixed(2)}
              </span>
              {item.unit && (
                <span className="text-xs text-gray-500 font-medium">
                  /{item.unit}
                </span>
              )}
            </div>
            {item.originalPrice && item.originalPrice > item.price && (
              <span className="text-xs text-gray-400 line-through">
                {currencySymbol}{item.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Cart Stepper / Add button */}
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            {isOutOfStock ? (
              <button
                type="button"
                disabled
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
              >
                Unavailable
              </button>
            ) : cartQuantity === 0 ? (
              <button
                type="button"
                onClick={() => onAddToCart(item)}
                aria-label={`Add ${item.name} to cart`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            ) : (
              <div className="inline-flex items-center rounded-xl bg-emerald-50 border border-emerald-200 p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => onUpdateCartQuantity(item.id, -1)}
                  aria-label={`Decrease quantity of ${item.name}`}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-800 hover:bg-emerald-200/60 transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center font-bold text-xs sm:text-sm text-emerald-900 font-mono">
                  {cartQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateCartQuantity(item.id, 1)}
                  disabled={maxReached}
                  title={maxReached ? `Maximum available stock (${item.stock}) reached` : undefined}
                  aria-label={`Increase quantity of ${item.name}`}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-800 hover:bg-emerald-200/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
