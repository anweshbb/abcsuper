/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ExternalLink, 
  ShoppingBag, 
  Store, 
  Tag, 
  PackageX, 
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react';

import { SupermarketItem, CartItem, SheetConfig, SyncStatus } from './types';
import { 
  fetchSheetViaJSONP, 
  parseGvizResponse, 
  compareSupermarketItems,
  DEFAULT_SHEET_URL,
  DEFAULT_SHEET_ID
} from './services/sheetService';

import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SheetSettingsModal } from './components/SheetSettingsModal';
import { LiveToast } from './components/LiveToast';

const CONFIG_STORAGE_KEY = 'livesheet_supermarket_config_v2';
const CART_STORAGE_KEY = 'livesheet_supermarket_cart_v2';

const DEFAULT_CONFIG: SheetConfig = {
  sheetUrl: DEFAULT_SHEET_URL,
  sheetId: DEFAULT_SHEET_ID,
  sheetName: '',
  gid: '0',
  pollingIntervalSeconds: 4, // Fast automatic background sync
  isAutoSyncEnabled: true,
  storeName: 'Fresh Supermarket',
  currencySymbol: '₹',
};

export default function App() {
  // 1. Sheet Configuration - default directly to the user's Google Sheet
  const [config, setConfig] = useState<SheetConfig>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sheetId) {
          return { ...DEFAULT_CONFIG, ...parsed };
        }
      }
    } catch (e) {
      console.error('Failed to load sheet config from storage', e);
    }
    return DEFAULT_CONFIG;
  });

  // 2. Supermarket Items (strictly from Google Sheet, no default items)
  const [items, setItems] = useState<SupermarketItem[]>([]);

  // 3. Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    }
    return [];
  });

  // 4. Sync Status (tracks silent live updates)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
    lastSyncedAt: null,
    errorMessage: null,
    changesSummary: null,
    totalItems: 0,
    columnHeaders: [],
  });

  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // 5. UI Filtering & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortOption, setSortOption] = useState<'featured' | 'price-asc' | 'price-desc' | 'name-asc'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);

  // 6. Modals & Drawers
  const [activeDetailItem, setActiveDetailItem] = useState<SupermarketItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [liveToastMessage, setLiveToastMessage] = useState<string | null>(null);

  // Ref to hold current items for diffing across background intervals
  const itemsRef = useRef<SupermarketItem[]>(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Persist config
  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save config', e);
    }
  }, [config]);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  }, [cart]);

  // Main silent Sheet fetcher
  const loadSheetData = useCallback(
    async (isBackgroundSync = false) => {
      const targetSheetId = config.sheetId || DEFAULT_SHEET_ID;
      if (!targetSheetId) {
        setSyncStatus((prev) => ({ ...prev, status: 'idle' }));
        setIsLoadingInitial(false);
        return false;
      }

      try {
        const rawData = await fetchSheetViaJSONP(targetSheetId, config.sheetName, config.gid);
        const { items: fetchedItems, columnHeaders } = parseGvizResponse(rawData);

        // Detect dynamic changes between previous state and newly fetched state
        const { changesSummary, itemsWithChangeFlags, hasChanges } = compareSupermarketItems(
          itemsRef.current,
          fetchedItems
        );

        setItems(itemsWithChangeFlags);
        setSyncStatus({
          status: 'synced',
          lastSyncedAt: new Date(),
          errorMessage: null,
          changesSummary,
          totalItems: fetchedItems.length,
          columnHeaders,
        });

        // If data changed dynamically in the Google Sheet, show a toast notification
        if (hasChanges && isBackgroundSync && changesSummary) {
          setLiveToastMessage(changesSummary);
        }

        setIsLoadingInitial(false);
        return true;
      } catch (err: any) {
        console.error('Google Sheet fetch error:', err);
        const message = err?.message || 'Could not load Google Sheet.';
        setSyncStatus((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: message,
        }));
        setIsLoadingInitial(false);
        return false;
      }
    },
    [config.sheetId, config.sheetName, config.gid]
  );

  // Initial load on mount
  useEffect(() => {
    loadSheetData(false);
  }, [loadSheetData]);

  // Automatic Dynamic Polling: Silently polls Google Sheet every few seconds
  useEffect(() => {
    if (!config.sheetId || !config.isAutoSyncEnabled) return;

    const intervalMs = Math.max(3000, (config.pollingIntervalSeconds || 4) * 1000);
    const interval = setInterval(() => {
      loadSheetData(true);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [config.sheetId, config.isAutoSyncEnabled, config.pollingIntervalSeconds, loadSheetData]);

  // Cart operations
  const handleAddToCart = (item: SupermarketItem) => {
    if (item.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) return prev;
        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => {
          if (ci.item.id === itemId) {
            const nextQty = ci.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > ci.item.stock) return ci;
            return { ...ci, quantity: nextQty };
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.item.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0),
    [cart]
  );

  const cartQuantityMap = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((ci) => map.set(ci.item.id, ci.quantity));
    return map;
  }, [cart]);

  // Distinct categories extracted directly from Sheet items
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [items]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchDesc) return false;
        }

        if (selectedCategory !== 'All' && item.category !== selectedCategory) {
          return false;
        }

        if (inStockOnly && item.stock <= 0) {
          return false;
        }

        if (onSaleOnly && !item.badge && (!item.originalPrice || item.originalPrice <= item.price)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'price-asc') return a.price - b.price;
        if (sortOption === 'price-desc') return b.price - a.price;
        if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
        return 0; // Sheet order
      });
  }, [items, searchQuery, selectedCategory, inStockOnly, onSaleOnly, sortOption]);

  const sheetUrl = config.sheetUrl || (config.sheetId ? `https://docs.google.com/spreadsheets/d/${config.sheetId}/edit?gid=0#gid=0` : DEFAULT_SHEET_URL);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-gray-900 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. Header Navbar (No manual refresh or get data buttons) */}
      <Navbar
        config={config}
        syncStatus={syncStatus}
        cartCount={cartItemCount}
        cartTotal={cartSubtotal}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Subtle Store Banner with Live Sheet Status */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-6 sm:p-8 shadow-sm">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>Live Inventory Synced from Google Sheet</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Fresh Daily Groceries & Supermarket
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              All items, prices, and stock update automatically when changed in your Google Sheet.
            </p>
          </div>

          <div className="mt-4 sm:mt-0 sm:absolute sm:top-6 sm:right-6 z-10">
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-950 bg-white/95 hover:bg-white transition-all shadow-sm"
            >
              <span>Edit Sheet in Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Error notification if public sheet access fails */}
        {syncStatus.status === 'error' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-3 text-amber-900 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Google Sheet Sync Notice</p>
                <p className="text-xs text-amber-700 mt-0.5">{syncStatus.errorMessage}</p>
                <p className="text-xs text-amber-800 mt-1">
                  Ensure the sheet Share setting in Google Drive is <strong>"Anyone with the link can view"</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-200 text-amber-900 text-xs font-bold shrink-0 cursor-pointer"
            >
              Settings
            </button>
          </div>
        )}

        {/* Search, Sort & Category Filter Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products in supermarket..."
                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort & Quick Filter Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex items-center">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-500 absolute left-3 pointer-events-none" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="pl-8 pr-7 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value="featured">Sheet Order</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setInStockOnly(!inStockOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  inStockOnly
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                In Stock
              </button>

              <button
                type="button"
                onClick={() => setOnSaleOnly(!onSaleOnly)}
                className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  onSaleOnly
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <Tag className="w-3 h-3" />
                <span>On Sale</span>
              </button>
            </div>

          </div>

          {/* Dynamic Category Tabs (derived directly from items) */}
          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
              {categories.map((cat) => {
                const count = cat === 'All'
                  ? items.length
                  : items.filter((i) => i.category === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected
                          ? 'bg-emerald-800 text-emerald-100'
                          : 'bg-white text-gray-600 border border-gray-200'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {/* Initial Loading Skeleton */}
        {isLoadingInitial && items.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 animate-pulse">
                <div className="aspect-4/3 bg-gray-200 rounded-xl" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded mt-4" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty / No Items matching filter */
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <PackageX className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {items.length === 0 ? 'No items found in your Google Sheet' : 'No items match your filter'}
              </h3>
              <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                {items.length === 0
                  ? 'Add rows with Name, Image, PC, RS to your Google Sheet and they will display here automatically.'
                  : 'Try changing your search query or reset category selection.'}
              </p>
            </div>
            {items.length === 0 ? (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                <span>Open Google Sheet & Add Items</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setInStockOnly(false);
                  setOnSaleOnly(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          /* Products Grid */
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3 px-1">
              <span>
                Showing <strong>{filteredItems.length}</strong> {filteredItems.length === 1 ? 'item' : 'items'}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">
                ● Live synchronized with Google Sheet
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {filteredItems.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  currencySymbol={config.currencySymbol}
                  cartQuantity={cartQuantityMap.get(item.id) || 0}
                  onAddToCart={handleAddToCart}
                  onUpdateCartQuantity={handleUpdateCartQuantity}
                  onOpenDetail={(product) => setActiveDetailItem(product)}
                />
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-gray-800">
              {config.storeName || 'Fresh Supermarket'}
            </span>
            <span>• Powered directly by your Google Sheet</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Settings
            </button>
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-700 transition-colors flex items-center gap-1 font-medium"
            >
              <span>Edit Google Sheet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        currencySymbol={config.currencySymbol}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        config={config}
        onOrderCompleted={handleClearCart}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        item={activeDetailItem}
        currencySymbol={config.currencySymbol}
        cartQuantity={activeDetailItem ? cartQuantityMap.get(activeDetailItem.id) || 0 : 0}
        onClose={() => setActiveDetailItem(null)}
        onAddToCart={handleAddToCart}
        onUpdateCartQuantity={handleUpdateCartQuantity}
      />

      {/* Sheet Settings Modal */}
      <SheetSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        syncStatus={syncStatus}
        onSaveConfig={(newConfig) => {
          setConfig(newConfig);
          setTimeout(() => loadSheetData(false), 50);
        }}
        onTriggerSync={() => loadSheetData(false)}
        onDisconnect={() => {
          setConfig({
            ...DEFAULT_CONFIG,
            sheetUrl: '',
            sheetId: '',
          });
          setItems([]);
        }}
      />

      {/* Real-time change notification toast */}
      <LiveToast
        message={liveToastMessage}
        onDismiss={() => setLiveToastMessage(null)}
      />

    </div>
  );
}
