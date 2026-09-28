export interface SupermarketItem {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  unit: string;
  stock: number;
  imageUrl?: string;
  description?: string;
  badge?: string;
  sku?: string;
  lastUpdated?: number;
  priceChange?: 'increased' | 'decreased' | null;
}

export interface CartItem {
  item: SupermarketItem;
  quantity: number;
}

export interface SheetConfig {
  sheetUrl: string;
  sheetId: string;
  sheetName?: string;
  gid?: string;
  pollingIntervalSeconds: number;
  isAutoSyncEnabled: boolean;
  storeName: string;
  currencySymbol: string;
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: Date | null;
  errorMessage: string | null;
  changesSummary: string | null;
  totalItems: number;
  columnHeaders: string[];
}

export interface ColumnMapping {
  nameCol?: string;
  priceCol?: string;
  categoryCol?: string;
  unitCol?: string;
  stockCol?: string;
  imageCol?: string;
  descCol?: string;
  badgeCol?: string;
  origPriceCol?: string;
  skuCol?: string;
}
