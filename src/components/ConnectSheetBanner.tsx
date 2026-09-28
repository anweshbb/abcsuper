import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  ArrowRight, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { SAMPLE_SHEET_DATA_TSV, parseSheetUrl } from '../services/sheetService';

interface ConnectSheetBannerProps {
  onConnect: (url: string) => Promise<boolean>;
  isLoading: boolean;
  errorMessage: string | null;
}

export const ConnectSheetBanner: React.FC<ConnectSheetBannerProps> = ({
  onConnect,
  isLoading,
  errorMessage,
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!inputUrl.trim()) {
      setLocalError('Please enter a Google Sheet URL or ID.');
      return;
    }

    const { sheetId } = parseSheetUrl(inputUrl);
    if (!sheetId) {
      setLocalError('Could not find a valid Google Sheet ID in the provided link.');
      return;
    }

    const success = await onConnect(inputUrl);
    if (!success) {
      // errorMessage will be handled via props
    }
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(SAMPLE_SHEET_DATA_TSV);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-xl overflow-hidden">
        
        {/* Banner Header */}
        <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 sm:px-10 py-8 text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 mb-3">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            Live Google Sheets Integration
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Connect Your Supermarket Google Sheet
          </h2>
          <p className="mt-2 text-sm sm:text-base text-emerald-100 max-w-2xl leading-relaxed">
            No default mock items are loaded. Your supermarket items, prices, and stock are synced directly from your publicly viewable Google Sheet. When you update the sheet, this website updates automatically!
          </p>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="sheet-url-input" className="block text-sm font-semibold text-gray-800">
              Paste your public Google Sheet URL or ID
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <input
                  id="sheet-url-input"
                  type="text"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    if (localError) setLocalError(null);
                  }}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit#gid=0"
                  className="w-full pl-11 pr-4 py-3 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all shadow-inner"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 transition-all shadow-md shrink-0 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span>Connect & Load Items</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {(localError || errorMessage) && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{localError || errorMessage}</p>
                  <p className="text-red-600 text-xs">
                    Make sure the spreadsheet has General Access set to <strong>"Anyone with the link"</strong> (Viewer).
                  </p>
                </div>
              </div>
            )}
          </form>

          {/* 3 Step Quick Setup Guide */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Quick 60-Second Setup Guide
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center mb-2">
                    1
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Create a Blank Sheet</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Open a new Google Spreadsheet to hold your supermarket catalog.
                  </p>
                </div>
                <div className="mt-3">
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    <span>Open sheets.new</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center mb-2">
                    2
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Paste Product Columns</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Use our template with columns: Name, Price, Category, Unit, Stock, etc.
                  </p>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleCopyTemplate}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-gray-500" />
                        <span>Copy Sample Grocery Rows</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center mb-2">
                    3
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Make Sheet Public</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Click <strong>Share</strong> in Google Sheets and choose <strong>"Anyone with the link can view"</strong>.
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] text-gray-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>No login or OAuth required</span>
                </div>
              </div>

            </div>
          </div>

          {/* Expected Columns Table reference */}
          <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-2">
              <HelpCircle className="w-4 h-4 text-emerald-700" />
              <span>Supported Column Headers (Automatic Mapping)</span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded text-emerald-800 font-mono">
                Product Name *
              </span>
              <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded text-emerald-800 font-mono">
                Price *
              </span>
              <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded text-emerald-800 font-mono">
                Category
              </span>
              <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded text-emerald-800 font-mono">
                Unit (e.g. per lb, 1 kg)
              </span>
              <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded text-emerald-800 font-mono">
                Stock (Qty)
              </span>
              <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded text-emerald-800 font-mono">
                Original Price (for sale)
              </span>
              <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded text-emerald-800 font-mono">
                Badge
              </span>
              <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded text-emerald-800 font-mono">
                Image URL
              </span>
              <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded text-emerald-800 font-mono">
                Description
              </span>
            </div>
            <p className="mt-2 text-[11px] text-emerald-700">
              * The parser is smart: it recognizes synonyms like <code>Item</code>, <code>Cost</code>, <code>Rate</code>, <code>Dept</code>, <code>Qty</code>, <code>Photo</code>, etc.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
