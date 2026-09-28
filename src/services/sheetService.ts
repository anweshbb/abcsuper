import { SupermarketItem, ColumnMapping } from '../types';

export const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1b_EbDNrgadvlOcc2kNby3nxp5Kx0WATKg2CCw21TeNU/edit?gid=0#gid=0';
export const DEFAULT_SHEET_ID = '1b_EbDNrgadvlOcc2kNby3nxp5Kx0WATKg2CCw21TeNU';

// Parse Sheet URL or ID
export function parseSheetUrl(input: string): { sheetId: string; gid?: string; sheetName?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { sheetId: '' };
  }

  // Check if it's already just an ID (alphanumeric, dashes, underscores, typically 40+ chars)
  if (!trimmed.includes('/') && !trimmed.includes('.')) {
    return { sheetId: trimmed };
  }

  try {
    const url = new URL(trimmed);

    // Standard pattern: /spreadsheets/d/{sheetId}/...
    const dMatch = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    let sheetId = dMatch ? dMatch[1] : '';

    // Extract gid from URL hash or query params
    let gid = url.searchParams.get('gid') || undefined;
    if (!gid && url.hash) {
      const hashMatch = url.hash.match(/gid=([0-9]+)/);
      if (hashMatch) {
        gid = hashMatch[1];
      }
    }

    // Extract sheet name if present
    const sheetName = url.searchParams.get('sheet') || undefined;

    return { sheetId, gid, sheetName };
  } catch {
    // If not a valid URL object, try regex
    const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      return { sheetId: match[1] };
    }
    return { sheetId: trimmed };
  }
}

// Fetch via Google Visualization API JSONP
export function fetchSheetViaJSONP(
  sheetId: string,
  sheetName?: string,
  gid?: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!sheetId) {
      reject(new Error('No Google Sheet ID provided.'));
      return;
    }

    const callbackName = `gviz_cb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement('script');

    const timeout = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          'Connection to Google Sheet timed out. Ensure the sheet Share setting is "Anyone with the link can view".'
        )
      );
    }, 12000);

    const cleanup = () => {
      clearTimeout(timeout);
      delete (window as any)[callbackName];
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      if (data.status === 'error') {
        const errorReason =
          data.errors && data.errors[0]
            ? data.errors[0].detailed_message || data.errors[0].message
            : 'Error accessing sheet';
        reject(new Error(`Google Sheet Error: ${errorReason}`));
      } else {
        resolve(data);
      }
    };

    script.onerror = () => {
      cleanup();
      reject(
        new Error(
          'Failed to load Google Sheet. Please check the URL and ensure "General Access" is set to "Anyone with the link" (Viewer).'
        )
      );
    };

    let url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${callbackName}&t=${Date.now()}`;
    if (sheetName) {
      url += `&sheet=${encodeURIComponent(sheetName)}`;
    } else if (gid) {
      url += `&gid=${encodeURIComponent(gid)}`;
    }

    script.src = url;
    document.head.appendChild(script);
  });
}

// Direct CSV Fetch Fallback
export async function fetchSheetViaCSV(sheetId: string, gid?: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${
    gid ? `&gid=${gid}` : ''
  }&t=${Date.now()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV: HTTP ${res.status}`);
  }
  return await res.text();
}

// Parse CSV text into 2D array
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\r') {
        // ignore CR
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== '')) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== '')) {
      lines.push(currentRow);
    }
  }

  return lines;
}

// Clean Price value
export function parsePrice(val: any): number {
  if (typeof val === 'number') return Math.max(0, val);
  if (!val) return 0;
  const str = String(val).replace(/[^0-9.-]+/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.max(0, num);
}

// Clean Stock value
export function parseStock(val: any): number {
  if (typeof val === 'number') return Math.max(0, Math.floor(val));
  if (!val) return 50; // default in-stock if unspecified
  const lower = String(val).trim().toLowerCase();
  if (lower === 'out of stock' || lower === 'sold out' || lower === '0' || lower === 'no') return 0;
  if (lower === 'low stock' || lower === 'low') return 3;
  if (lower === 'in stock' || lower === 'yes' || lower === 'available') return 50;
  const num = parseInt(lower.replace(/[^0-9]+/g, ''), 10);
  return isNaN(num) ? 50 : Math.max(0, num);
}

// Identify default image fallback based on item title or category
export function getCategoryFallbackImage(name: string, category: string): string {
  const query = `${name} ${category}`.toLowerCase();
  
  if (query.includes('dal') || query.includes('pulse') || query.includes('lentil') || query.includes('chana') || query.includes('rajma') || query.includes('bean') || query.includes('toor') || query.includes('moong')) {
    return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('noodle') || query.includes('maggi') || query.includes('ramen') || query.includes('pasta') || query.includes('chowmein')) {
    return 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('rice') || query.includes('basmati') || query.includes('biryani')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('atta') || query.includes('flour') || query.includes('wheat') || query.includes('maida') || query.includes('roti') || query.includes('bread') || query.includes('bakery')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('oil') || query.includes('ghee') || query.includes('mustard') || query.includes('sunflower')) {
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('tea') || query.includes('chai') || query.includes('coffee')) {
    return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('spice') || query.includes('masala') || query.includes('haldi') || query.includes('chilli') || query.includes('turmeric')) {
    return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('apple') || query.includes('fruit') || query.includes('banana') || query.includes('orange') || query.includes('berry') || query.includes('grape') || query.includes('produce') || query.includes('mango')) {
    return 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('tomato') || query.includes('vegetable') || query.includes('carrot') || query.includes('onion') || query.includes('potato') || query.includes('greens') || query.includes('lettuce') || query.includes('sabzi')) {
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('milk') || query.includes('cheese') || query.includes('dairy') || query.includes('egg') || query.includes('butter') || query.includes('yogurt') || query.includes('paneer') || query.includes('curd')) {
    return 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('beverage') || query.includes('juice') || query.includes('water') || query.includes('soda') || query.includes('drink')) {
    return 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('snack') || query.includes('chip') || query.includes('cookie') || query.includes('chocolate') || query.includes('candy') || query.includes('nuts') || query.includes('biscuit') || query.includes('namkeen')) {
    return 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
}

function inferCategoryFromName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('dal') || n.includes('pulse') || n.includes('lentil') || n.includes('chana') || n.includes('rajma') || n.includes('bean') || n.includes('toor') || n.includes('moong')) {
    return 'Dals & Pulses';
  }
  if (n.includes('noodle') || n.includes('maggi') || n.includes('ramen') || n.includes('pasta') || n.includes('snack') || n.includes('biscuit') || n.includes('cookie') || n.includes('chip') || n.includes('namkeen') || n.includes('kurkure')) {
    return 'Snacks & Instant Food';
  }
  if (n.includes('rice') || n.includes('atta') || n.includes('flour') || n.includes('wheat') || n.includes('oil') || n.includes('ghee') || n.includes('sugar') || n.includes('salt') || n.includes('masala') || n.includes('spice')) {
    return 'Staples & Spices';
  }
  if (n.includes('milk') || n.includes('paneer') || n.includes('curd') || n.includes('yogurt') || n.includes('butter') || n.includes('cheese') || n.includes('dairy') || n.includes('egg')) {
    return 'Dairy & Eggs';
  }
  if (n.includes('apple') || n.includes('banana') || n.includes('mango') || n.includes('potato') || n.includes('onion') || n.includes('tomato') || n.includes('fruit') || n.includes('veg')) {
    return 'Fruits & Vegetables';
  }
  if (n.includes('tea') || n.includes('coffee') || n.includes('juice') || n.includes('drink') || n.includes('water') || n.includes('soda')) {
    return 'Beverages';
  }
  return 'Groceries';
}

// Convert GVIZ table to Items
export function parseGvizResponse(data: any): {
  items: SupermarketItem[];
  columnHeaders: string[];
  mapping: ColumnMapping;
} {
  const table = data.table;
  if (!table || !table.cols || !table.rows) {
    return { items: [], columnHeaders: [], mapping: {} };
  }

  // 1. Extract raw column headers
  let rawHeaders: string[] = table.cols.map((col: any) => (col.label || '').trim());
  let startRowIndex = 0;

  // If cols have no labels, header is row 0
  const hasLabels = rawHeaders.some((h) => h.length > 0);
  if (!hasLabels && table.rows.length > 0) {
    const firstRow = table.rows[0].c;
    rawHeaders = firstRow.map((cell: any) => (cell && cell.v != null ? String(cell.v).trim() : ''));
    startRowIndex = 1;
  }

  // Match columns
  const colIndexMap: { [key: string]: number } = {};
  const mapping: ColumnMapping = {};

  rawHeaders.forEach((header, index) => {
    const h = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!h) return;

    // Name
    if (
      !colIndexMap['name'] &&
      (h === 'name' ||
        h === 'item' ||
        h === 'itemname' ||
        h === 'product' ||
        h === 'productname' ||
        h === 'title')
    ) {
      colIndexMap['name'] = index;
      mapping.nameCol = header;
    }
    // Price
    else if (
      !colIndexMap['price'] &&
      (h === 'price' ||
        h === 'rs' ||
        h === 'rupees' ||
        h === 'inr' ||
        h === 'cost' ||
        h === 'rate' ||
        h === 'mrp' ||
        h === 'amount' ||
        h === 'sellingprice' ||
        h === 'unitprice')
    ) {
      colIndexMap['price'] = index;
      mapping.priceCol = header;
    }
    // Original Price (discount)
    else if (
      !colIndexMap['originalPrice'] &&
      (h === 'originalprice' ||
        h === 'regularprice' ||
        h === 'oldprice' ||
        h === 'wasprice' ||
        h === 'retailprice' ||
        h === 'strikeprice')
    ) {
      colIndexMap['originalPrice'] = index;
      mapping.origPriceCol = header;
    }
    // Category
    else if (
      !colIndexMap['category'] &&
      (h === 'category' ||
        h === 'dept' ||
        h === 'department' ||
        h === 'section' ||
        h === 'group' ||
        h === 'type' ||
        h === 'cat')
    ) {
      colIndexMap['category'] = index;
      mapping.categoryCol = header;
    }
    // Unit or Pieces
    else if (
      !colIndexMap['unit'] &&
      (h === 'unit' ||
        h === 'pc' ||
        h === 'pcs' ||
        h === 'piece' ||
        h === 'pieces' ||
        h === 'pack' ||
        h === 'size' ||
        h === 'weight' ||
        h === 'measure' ||
        h === 'qtyperunit' ||
        h === 'packaging')
    ) {
      colIndexMap['unit'] = index;
      mapping.unitCol = header;
    }
    // Stock
    else if (
      !colIndexMap['stock'] &&
      (h === 'stock' ||
        h === 'inventory' ||
        h === 'quantity' ||
        h === 'qty' ||
        h === 'count' ||
        h === 'available' ||
        h === 'instock')
    ) {
      colIndexMap['stock'] = index;
      mapping.stockCol = header;
    }
    // Image
    else if (
      !colIndexMap['image'] &&
      (h === 'image' ||
        h === 'img' ||
        h === 'imageurl' ||
        h === 'photo' ||
        h === 'picture' ||
        h === 'thumbnail' ||
        h === 'pic')
    ) {
      colIndexMap['image'] = index;
      mapping.imageCol = header;
    }
    // Description
    else if (
      !colIndexMap['description'] &&
      (h === 'description' ||
        h === 'desc' ||
        h === 'details' ||
        h === 'info' ||
        h === 'about' ||
        h === 'notes')
    ) {
      colIndexMap['description'] = index;
      mapping.descCol = header;
    }
    // Badge
    else if (
      !colIndexMap['badge'] &&
      (h === 'badge' ||
        h === 'tag' ||
        h === 'sale' ||
        h === 'offer' ||
        h === 'deal' ||
        h === 'highlight' ||
        h === 'status')
    ) {
      colIndexMap['badge'] = index;
      mapping.badgeCol = header;
    }
    // SKU
    else if (
      !colIndexMap['sku'] &&
      (h === 'sku' || h === 'code' || h === 'barcode' || h === 'id' || h === 'itemcode')
    ) {
      colIndexMap['sku'] = index;
      mapping.skuCol = header;
    }
  });

  // Fallbacks if no exact header matched:
  // If no name column, take column 0
  if (colIndexMap['name'] === undefined && rawHeaders.length > 0) {
    colIndexMap['name'] = 0;
    mapping.nameCol = rawHeaders[0] || 'Column A';
  }
  // If no price column, look for the first column with numbers or column 1
  if (colIndexMap['price'] === undefined && rawHeaders.length > 1) {
    colIndexMap['price'] = 1;
    mapping.priceCol = rawHeaders[1] || 'Column B';
  }

  const items: SupermarketItem[] = [];

  for (let i = startRowIndex; i < table.rows.length; i++) {
    const row = table.rows[i];
    if (!row || !row.c) continue;

    const getVal = (colIndex: number | undefined) => {
      if (colIndex === undefined) return undefined;
      const cell = row.c[colIndex];
      if (!cell) return undefined;
      return cell.f !== undefined && cell.f !== null ? cell.f : cell.v;
    };

    const rawName = getVal(colIndexMap['name']);
    const nameStr = rawName != null ? String(rawName).trim() : '';

    // If row has no name, skip it
    if (!nameStr) continue;

    const rawPrice = getVal(colIndexMap['price']);
    const price = parsePrice(rawPrice);

    const rawOrigPrice = getVal(colIndexMap['originalPrice']);
    const originalPrice = rawOrigPrice ? parsePrice(rawOrigPrice) : undefined;

    const rawCat = getVal(colIndexMap['category']);
    const category = rawCat != null && String(rawCat).trim() 
      ? String(rawCat).trim() 
      : inferCategoryFromName(nameStr);

    const rawUnit = getVal(colIndexMap['unit']);
    let unit = '1 pc';
    if (rawUnit != null && String(rawUnit).trim() !== '') {
      const uStr = String(rawUnit).trim();
      if (/^\d+$/.test(uStr)) {
        unit = Number(uStr) === 1 ? '1 pc' : `${uStr} pcs`;
      } else {
        unit = uStr;
      }
    }

    const rawStock = getVal(colIndexMap['stock']);
    const stock = parseStock(rawStock);

    const rawImg = getVal(colIndexMap['image']);
    let imageUrl = rawImg != null ? String(rawImg).trim() : '';
    if (!imageUrl || !imageUrl.startsWith('http')) {
      imageUrl = getCategoryFallbackImage(nameStr, category);
    }

    const rawDesc = getVal(colIndexMap['description']);
    const description = rawDesc != null ? String(rawDesc).trim() : '';

    const rawBadge = getVal(colIndexMap['badge']);
    let badge = rawBadge != null ? String(rawBadge).trim() : undefined;
    if (!badge && originalPrice && originalPrice > price) {
      const discountPct = Math.round(((originalPrice - price) / originalPrice) * 100);
      badge = `${discountPct}% OFF`;
    }

    const rawSku = getVal(colIndexMap['sku']);
    const sku = rawSku != null ? String(rawSku).trim() : `ITEM-${i + 1}`;

    const id = sku ? `item_${sku}` : `item_row_${i}`;

    items.push({
      id,
      name: nameStr,
      category,
      price,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      unit,
      stock,
      imageUrl,
      description,
      badge,
      sku,
      lastUpdated: Date.now(),
    });
  }

  return { items, columnHeaders: rawHeaders.filter(Boolean), mapping };
}

// Compare old and new items to identify live changes
export function compareSupermarketItems(
  oldItems: SupermarketItem[],
  newItems: SupermarketItem[]
): {
  changesSummary: string | null;
  itemsWithChangeFlags: SupermarketItem[];
  hasChanges: boolean;
} {
  if (oldItems.length === 0) {
    return {
      changesSummary: `Loaded ${newItems.length} items from Google Sheet`,
      itemsWithChangeFlags: newItems,
      hasChanges: false,
    };
  }

  const oldMap = new Map<string, SupermarketItem>();
  oldItems.forEach((item) => {
    // Key by ID or normalized name
    oldMap.set(item.id, item);
    oldMap.set(item.name.toLowerCase(), item);
  });

  const changes: string[] = [];
  let priceChangesCount = 0;
  let stockChangesCount = 0;
  let addedCount = 0;

  const itemsWithChangeFlags: SupermarketItem[] = newItems.map((newItem) => {
    const old = oldMap.get(newItem.id) || oldMap.get(newItem.name.toLowerCase());
    if (!old) {
      addedCount++;
      return { ...newItem, lastUpdated: Date.now() };
    }

    let priceChange: 'increased' | 'decreased' | null = null;
    let updated = false;

    if (newItem.price !== old.price) {
      priceChange = newItem.price > old.price ? 'increased' : 'decreased';
      priceChangesCount++;
      updated = true;
    }

    if (newItem.stock !== old.stock) {
      stockChangesCount++;
      updated = true;
    }

    if (newItem.name !== old.name || newItem.category !== old.category) {
      updated = true;
    }

    return {
      ...newItem,
      priceChange: priceChange || old.priceChange,
      lastUpdated: updated ? Date.now() : old.lastUpdated,
    };
  });

  const removedCount = Math.max(0, oldItems.length - (newItems.length - addedCount));

  if (addedCount > 0) changes.push(`+${addedCount} new item${addedCount > 1 ? 's' : ''}`);
  if (priceChangesCount > 0)
    changes.push(`${priceChangesCount} price update${priceChangesCount > 1 ? 's' : ''}`);
  if (stockChangesCount > 0)
    changes.push(`${stockChangesCount} stock update${stockChangesCount > 1 ? 's' : ''}`);
  if (removedCount > 0) changes.push(`-${removedCount} removed`);

  const hasChanges = changes.length > 0;
  const changesSummary = hasChanges ? `Google Sheet updated: ${changes.join(', ')}` : null;

  return { changesSummary, itemsWithChangeFlags, hasChanges };
}

// Sample Google Sheet Template (Tab-Separated for instant paste into Google Sheets)
export const SAMPLE_SHEET_DATA_TSV = `Product Name\tCategory\tPrice\tUnit\tStock\tOriginal Price\tBadge\tDescription\tImage URL
Organic Honeycrisp Apples\tFresh Produce\t3.49\tper lb\t45\t4.29\tSale\tCrisp, sweet, and locally harvested crisp organic apples.\thttps://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80
Farm Fresh Whole Milk\tDairy & Eggs\t4.19\t1 gallon\t24\t\tFresh\tGrade A whole milk pasteurized and homogenized.\thttps://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80
Artisan Sourdough Loaf\tBakery\t5.99\teach\t12\t6.99\tFresh Daily\tNaturally fermented crusty sourdough bread baked fresh every morning.\thttps://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80
Organic Hass Avocados\tFresh Produce\t1.99\teach\t38\t2.49\tPopular\tRipe and creamy Hass avocados, perfect for salads and guacamole.\thttps://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80
Free Range Brown Eggs\tDairy & Eggs\t4.89\tdozen\t30\t\tOrganic\tLarge grade A brown eggs from pasture-raised hens.\thttps://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80
Cold Pressed Orange Juice\tBeverages\t3.99\t32 oz\t18\t4.59\t100% Pure\tFreshly squeezed orange juice without any added sugars or preservatives.\thttps://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=600&q=80
Wild Caught Salmon Fillet\tMeat & Seafood\t14.99\tper lb\t15\t17.99\tChef Choice\tFresh Pacific salmon fillet, rich in omega-3 fatty acids.\thttps://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80
Organic Baby Spinach\tFresh Produce\t2.99\t5 oz tub\t22\t\tOrganic\tTender pre-washed organic baby spinach leaves.\thttps://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80
Extra Virgin Olive Oil\tPantry\t11.99\t750 ml\t20\t13.49\tImported\tCold extracted premium extra virgin olive oil from Mediterranean olives.\thttps://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80
Dark Chocolate Almonds\tSnacks\t4.49\t8 oz pack\t40\t\tBest Seller\tRoasted California almonds drenched in 70% dark cocoa.\thttps://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80`;
