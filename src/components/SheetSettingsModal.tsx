import React, { useState } from 'react';
import { 
  X, 
  Save, 
  ExternalLink, 
  Clock, 
  RefreshCw, 
  Sliders, 
  Store, 
  DollarSign, 
  Layers, 
  AlertCircle,
  CheckCircle2,
  Trash2,
  HelpCircle,
  TableProperties
} from 'lucide-react';
import { SheetConfig, SyncStatus } from '../types';
import { parseSheetUrl } from '../services/sheetService';

interface SheetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SheetConfig;
  syncStatus: SyncStatus;
  onSaveConfig: (newConfig: SheetConfig) => void;
  onTriggerSync: () => void;
  onDisconnect: () => void;
}

export const SheetSettingsModal: React.FC<SheetSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  syncStatus,
  onSaveConfig,
  onTriggerSync,
  onDisconnect,
}) => {
  const [sheetUrl, setSheetUrl] = useState(config.sheetUrl || '');
  const [sheetName, setSheetName] = useState(config.sheetName || '');
  const [gid, setGid] = useState(config.gid || '');
  const [pollingInterval, setPollingInterval] = useState(config.pollingIntervalSeconds || 10);
  const [isAutoSync, setIsAutoSync] = useState(config.isAutoSyncEnabled);
  const [storeName, setStoreName] = useState(config.storeName || 'Daily Fresh Supermarket');
  const [currencySymbol, setCurrencySymbol] = useState(config.currencySymbol || '$');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const { sheetId, gid: urlGid, sheetName: urlSheetName } = parseSheetUrl(sheetUrl);

    if (!sheetId && sheetUrl.trim()) {
      setValidationError('Could not extract a valid Google Sheet ID from the provided URL.');
      return;
    }

    const updatedConfig: SheetConfig = {
      sheetUrl: sheetUrl.trim(),
      sheetId,
      sheetName: sheetName.trim() || urlSheetName || undefined,
      gid: gid.trim() || urlGid || undefined,
      pollingIntervalSeconds: Number(pollingInterval),
      isAutoSyncEnabled: isAutoSync,
      storeName: storeName.trim() || 'Supermarket Live',
      currencySymbol: currencySymbol.trim() || '$',
    };

    onSaveConfig(updatedConfig);
    onClose();
  };

  const currentSheetHref = config.sheetUrl || (config.sheetId ? `https://docs.google.com/spreadsheets/d/${config.sheetId}/edit` : '');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity"
        />

        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Google Sheet & Store Settings
                </h3>
                <p className="text-xs text-gray-500">
                  Manage spreadsheet connection and auto-sync rate
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
            
            {/* Sheet URL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Google Sheet URL or ID *
                </label>
                {currentSheetHref && (
                  <a
                    href={currentSheetHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline"
                  >
                    <span>Open Sheet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Must be set to "Anyone with the link can view" in Google Sheets.
              </p>
            </div>

            {/* Sheet Tab Name & GID */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tab Name (Optional)
                </label>
                <input
                  type="text"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="e.g. Sheet1 or Groceries"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  GID (Tab ID)
                </label>
                <input
                  type="text"
                  value={gid}
                  onChange={(e) => setGid(e.target.value)}
                  placeholder="e.g. 0"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Auto-Sync controls */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-950">
                    Auto-Sync Polling Interval
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAutoSync}
                    onChange={(e) => setIsAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {isAutoSync && (
                <div className="flex items-center gap-2">
                  <select
                    value={pollingInterval}
                    onChange={(e) => setPollingInterval(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-emerald-200 rounded-lg text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value={5}>Every 5 seconds (Ultra Fast)</option>
                    <option value={10}>Every 10 seconds (Recommended)</option>
                    <option value={15}>Every 15 seconds</option>
                    <option value={30}>Every 30 seconds</option>
                    <option value={60}>Every 1 minute</option>
                  </select>
                </div>
              )}

              <p className="text-[11px] text-emerald-800">
                When enabled, changes in the spreadsheet (price, stock, new items) are detected automatically without page refresh.
              </p>
            </div>

            {/* Store Branding & Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Supermarket Name
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Fresh Mart"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Currency
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="$"
                  maxLength={4}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden text-center font-bold"
                />
              </div>
            </div>

            {/* Connection Status and Detected Columns Info */}
            {config.sheetId && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-gray-700">
                  <span className="font-semibold">Sync Status:</span>
                  <span className="font-mono text-emerald-700 font-bold capitalize">
                    {syncStatus.status}
                  </span>
                </div>
                {syncStatus.lastSyncedAt && (
                  <div className="flex items-center justify-between text-gray-500 text-[11px]">
                    <span>Last Synced:</span>
                    <span>{syncStatus.lastSyncedAt.toLocaleTimeString()}</span>
                  </div>
                )}
                {syncStatus.columnHeaders && syncStatus.columnHeaders.length > 0 && (
                  <div className="pt-1 border-t border-gray-200">
                    <span className="text-[11px] font-semibold text-gray-600 block mb-1">
                      Detected Sheet Columns ({syncStatus.columnHeaders.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {syncStatus.columnHeaders.map((col, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-700 font-mono"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {validationError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-2">
              {config.sheetId ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Disconnect this Google Sheet from the supermarket?')) {
                      onDisconnect();
                      onClose();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </button>
              </div>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
};
