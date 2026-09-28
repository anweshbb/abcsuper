import React from 'react';
import { 
  Store, 
  ExternalLink, 
  ShoppingCart, 
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { SheetConfig, SyncStatus } from '../types';

interface NavbarProps {
  config: SheetConfig;
  syncStatus: SyncStatus;
  cartCount: number;
  cartTotal: number;
  onOpenSettings: () => void;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  syncStatus,
  cartCount,
  cartTotal,
  onOpenSettings,
  onOpenCart,
}) => {
  const sheetUrl = config.sheetUrl || (config.sheetId ? `https://docs.google.com/spreadsheets/d/${config.sheetId}/edit?gid=0#gid=0` : '');

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Store Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight truncate">
                  {config.storeName || 'Fresh Supermarket'}
                </h1>
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Live Sheet</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 truncate hidden md:block">
                Dynamic catalog updated directly from Google Sheet
              </p>
            </div>
          </div>

          {/* Action Center (No manual refresh or get data buttons) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Sheet Link */}
            {sheetUrl && (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="View & Edit items in Google Sheet"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/70 transition-colors"
              >
                <span>Edit Google Sheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Settings button */}
            <button
              type="button"
              onClick={onOpenSettings}
              title="Store & Sheet Settings"
              aria-label="Store Settings"
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Shopping Cart button */}
            <button
              type="button"
              onClick={onOpenCart}
              title="View Shopping Cart"
              aria-label={`View Shopping Cart with ${cartCount} items totaling ${config.currencySymbol}${cartTotal.toFixed(2)}`}
              className="relative inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-sm cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              <span className="font-mono">
                {config.currencySymbol}{cartTotal.toFixed(2)}
              </span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
