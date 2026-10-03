import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  ClipboardCheck, 
  ReceiptText, 
  BarChart3, 
  Download, 
  Plus, 
  RotateCcw,
  Share2,
  MousePointerClick,
  Receipt,
  Clock,
  Calendar,
  Truck
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'spreadsheet' | 'audit' | 'order' | 'billing' | 'analytics';
  setActiveTab: (tab: 'spreadsheet' | 'audit' | 'order' | 'billing' | 'analytics') => void;
  onExportExcel: () => void;
  onOpenAddItem: () => void;
  onOpenShareModal: () => void;
  onOpenRollover: () => void;
  onOpenItemSelectModal: () => void;
  demandCount: number;
  estimatedBillTotal: number;
  currency: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onExportExcel,
  onOpenAddItem,
  onOpenShareModal,
  onOpenRollover,
  onOpenItemSelectModal,
  demandCount,
  estimatedBillTotal,
  currency
}) => {
  // Live Current Time & Date state
  const [currentDateTime, setCurrentDateTime] = useState({
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentDateTime({
        date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Mini Bar: Live Current Date & Time Stamp */}
        <div className="py-1 border-b border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-neutral-700">LIVE SYSTEM TIME:</span>
            <div className="flex items-center gap-1.5 text-neutral-600">
              <Calendar className="w-3 h-3 text-neutral-400" />
              <span>{currentDateTime.date}</span>
              <span className="text-neutral-300">|</span>
              <Clock className="w-3 h-3 text-neutral-400" />
              <span className="font-bold text-neutral-900">{currentDateTime.time}</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-neutral-600">
            <span>Demand Items: <strong>{demandCount}</strong></span>
            <span>·</span>
            <span>Est. Bill: <strong>{currency} {estimatedBillTotal.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Main Nav Bar */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#1F4E78] text-white flex items-center justify-center font-bold shadow-xs">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-neutral-900 block leading-tight">
                Demand List Software
              </span>
              <span className="text-[10px] sm:text-xs text-neutral-500 hidden sm:block font-medium">
                Inventory & Billing System
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links / Modes */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('spreadsheet')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'spreadsheet'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Demand List</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'billing'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>Billing Invoice</span>
              {demandCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-emerald-600 text-white tabular-nums">
                  {currency}{estimatedBillTotal > 999 ? `${Math.round(estimatedBillTotal / 1000)}k` : estimatedBillTotal}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Audit Count</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('order')}
              className={`relative hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'order'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>Demand Slip</span>
              {demandCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white tabular-nums">
                  {demandCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`hidden xl:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 1-by-1 Click Select for New Demand Button */}
            <button
              type="button"
              onClick={onOpenItemSelectModal}
              title="Click items 1 by 1 to build a new demand list"
              className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <MousePointerClick className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">1-by-1 Select</span>
              <span className="sm:hidden">Select</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddItem}
              className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-[#1F4E78] hover:bg-[#163857] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>+ Add Items</span>
            </button>

            <button
              type="button"
              onClick={onOpenShareModal}
              title="Open Supplier View (Non-financial item list for vendors)"
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-2xs"
            >
              <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
              <span>Supplier View</span>
            </button>

            <button
              type="button"
              onClick={onExportExcel}
              title="Download Excel Spreadsheet (.xlsx)"
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs sm:text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600" />
              <span className="hidden lg:inline">Excel</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
