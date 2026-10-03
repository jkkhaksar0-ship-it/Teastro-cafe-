import React from 'react';
import { ViewFilter } from '../types.ts';
import { AlertCircle, CheckCircle2, Boxes, TrendingDown, Receipt, Clock } from 'lucide-react';

interface SummaryCardsProps {
  totalItems: number;
  demandCount: number;
  okCount: number;
  totalRequiredUnits: number;
  estimatedBillTotal: number;
  currency: string;
  currentFilter: ViewFilter;
  setFilter: (f: ViewFilter) => void;
  onOpenBilling: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalItems,
  demandCount,
  okCount,
  totalRequiredUnits,
  estimatedBillTotal,
  currency,
  currentFilter,
  setFilter,
  onOpenBilling
}) => {
  return (
    <div className="space-y-4">
      {/* Top Metric Cards (5 Cards with Billing & Live Time) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Items */}
        <div 
          onClick={() => setFilter('ALL')}
          className={`cursor-pointer p-4 bg-white rounded-xl border transition-all ${
            currentFilter === 'ALL'
              ? 'border-neutral-900 ring-2 ring-neutral-900/10 shadow-xs'
              : 'border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Total Catalog
            </span>
            <Boxes className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-neutral-900">
              {totalItems}
            </span>
            <span className="text-xs text-neutral-500 font-medium">items</span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            Monitored inventory items
          </p>
        </div>

        {/* Requiring Demand */}
        <div 
          onClick={() => setFilter('DEMAND')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            currentFilter === 'DEMAND'
              ? 'bg-rose-50/60 border-rose-400 ring-2 ring-rose-400/20 shadow-xs'
              : 'bg-white border-neutral-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
              Needs Demand
            </span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-rose-600">
              {demandCount}
            </span>
            <span className="text-xs text-rose-600/80 font-medium">items</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-600/80">
            Below previous stock par
          </p>
        </div>

        {/* Stock OK */}
        <div 
          onClick={() => setFilter('OK')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            currentFilter === 'OK'
              ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-400/20 shadow-xs'
              : 'bg-white border-neutral-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Stock Sufficient
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-700">
              {okCount}
            </span>
            <span className="text-xs text-emerald-600 font-medium">items</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600">
            Stock &ge; benchmark level
          </p>
        </div>

        {/* Total Quantity Deficit */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Deficit Qty
            </span>
            <TrendingDown className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-neutral-900">
              {totalRequiredUnits}
            </span>
            <span className="text-xs text-neutral-500 font-medium">units</span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            Total units to purchase
          </p>
        </div>

        {/* Estimated Demand Bill Total */}
        <div 
          onClick={onOpenBilling}
          className="cursor-pointer p-4 bg-emerald-50/50 hover:bg-emerald-100/60 rounded-xl border border-emerald-300 transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              Estimated Bill
            </span>
            <Receipt className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline gap-1 text-emerald-900">
            <span className="text-xs font-bold text-emerald-700">{currency}</span>
            <span className="text-xl sm:text-2xl font-black font-mono tabular-nums">
              {estimatedBillTotal.toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-700 font-medium flex items-center justify-between">
            <span>Click for Invoice</span>
            <span className="text-[10px] underline">View &rarr;</span>
          </p>
        </div>

      </div>

      {/* Segmented Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="inline-flex p-1 bg-neutral-200/80 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              currentFilter === 'ALL'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            All Items ({totalItems})
          </button>
          <button
            type="button"
            onClick={() => setFilter('DEMAND')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              currentFilter === 'DEMAND'
                ? 'bg-white text-rose-600 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Demand Only ({demandCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('OK')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              currentFilter === 'OK'
                ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Stock OK ({okCount})
          </button>
        </div>

        <div className="text-xs text-neutral-500 flex items-center gap-2">
          <span>Billing Formula: <code className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700">Line Bill = Required &times; Unit Price</code></span>
        </div>
      </div>
    </div>
  );
};
