import React, { useState } from 'react';
import { InventoryItem } from '../types.ts';
import { 
  CheckCircle, 
  Minus, 
  Plus, 
  Search, 
  Sparkles,
  ClipboardList,
  Filter
} from 'lucide-react';

interface QuickCountViewProps {
  items: InventoryItem[];
  categories: string[];
  onUpdateItem: (id: string, updates: Partial<InventoryItem>) => void;
}

export const QuickCountView: React.FC<QuickCountViewProps> = ({
  items,
  categories,
  onUpdateItem
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter(item => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesQuery = !searchQuery.trim() || 
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleSetStock = (id: string, newStock: number) => {
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;

    const stock = Math.max(0, newStock);
    const required = Math.max(0, targetItem.previousStock - stock);

    onUpdateItem(id, {
      currentStock: stock,
      requiredQty: required,
      status: required > 0 ? 'DEMAND' : 'OK',
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  };

  const countedCount = items.filter(i => i.currentStock > 0 || i.lastUpdated).length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Audit Helper */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#1F4E78]" />
            <span>Kitchen Shelf Audit & Quick Count</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Tap +/- or quick buttons to count physical stock. Demand calculations update live.
          </p>
        </div>

        {/* Audit Progress Bar */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-xs text-neutral-500">Audit Status</div>
            <div className="text-sm font-bold font-mono text-neutral-900 tabular-nums">
              {countedCount} / {items.length} Checked
            </div>
          </div>
          <div className="w-24 sm:w-32 h-2.5 bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#1F4E78] transition-all duration-300"
              style={{ width: `${Math.round((countedCount / (items.length || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Category Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-2xl scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-neutral-900 text-white'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            All ({items.length})
          </button>
          {categories.map(cat => {
            const catCount = items.filter(i => i.category === cat).length;
            const catDemand = items.filter(i => i.category === cat && i.status === 'DEMAND').length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-[#1F4E78] text-white shadow-xs'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] font-mono px-1 py-0.2 rounded-full ${
                  selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {catCount}
                </span>
                {catDemand > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

      </div>

      {/* Touch-Friendly Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map(item => {
          const isDemand = item.status === 'DEMAND';
          const deficit = item.requiredQty;

          return (
            <div
              key={item.id}
              className={`p-4 bg-white rounded-xl border transition-all shadow-xs flex flex-col justify-between ${
                isDemand 
                  ? 'border-rose-300 ring-1 ring-rose-200' 
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div>
                {/* Header: Category & Demand Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                    {item.category}
                  </span>
                  {isDemand ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-sm bg-[#F4CCCC] text-[#900] border border-[#EAA]">
                      NEED {deficit}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-sm bg-[#D9EAD3] text-[#274E13] border border-[#B6D7A8]">
                      SUFFICIENT
                    </span>
                  )}
                </div>

                {/* Item Name */}
                <h3 className="text-base font-bold text-neutral-900 mt-1 leading-snug">
                  {item.name}
                </h3>
                
                <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                  <span>Unit: {item.unit || 'units'}</span>
                  <span>·</span>
                  <span>Benchmark: <strong className="text-neutral-700">{item.previousStock}</strong></span>
                </div>
              </div>

              {/* Counter Zone */}
              <div className="mt-4 pt-3 border-t border-neutral-100">
                <div className="flex items-center justify-between gap-3">
                  
                  {/* Minus 1 Button */}
                  <button
                    type="button"
                    onClick={() => handleSetStock(item.id, item.currentStock - 1)}
                    disabled={item.currentStock <= 0}
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-transform"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  {/* Stock Value Input */}
                  <div className="flex-1 text-center">
                    <input
                      type="number"
                      min="0"
                      value={item.currentStock}
                      onChange={(e) => handleSetStock(item.id, parseInt(e.target.value) || 0)}
                      className={`w-full text-center text-xl font-bold font-mono tabular-nums py-1 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                        isDemand ? 'text-rose-600 border-rose-300' : 'text-neutral-900 border-neutral-200'
                      }`}
                    />
                    <span className="text-[10px] text-neutral-400 block mt-0.5">
                      Current Count
                    </span>
                  </div>

                  {/* Plus 1 Button */}
                  <button
                    type="button"
                    onClick={() => handleSetStock(item.id, item.currentStock + 1)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1F4E78] hover:bg-[#163857] text-white font-bold active:scale-95 transition-transform"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                </div>

                {/* Quick Increment Buttons (+5, +10, Match Prev) */}
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => handleSetStock(item.id, item.currentStock + 5)}
                    className="py-1 px-1.5 text-[11px] font-mono font-medium bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded text-neutral-700"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetStock(item.id, item.currentStock + 10)}
                    className="py-1 px-1.5 text-[11px] font-mono font-medium bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded text-neutral-700"
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetStock(item.id, item.previousStock)}
                    title="Set current stock equal to benchmark"
                    className="py-1 px-1 text-[10px] font-medium bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-emerald-800"
                  >
                    = Prev
                  </button>
                </div>

                {item.notes && (
                  <p className="mt-2 text-[11px] text-neutral-500 italic truncate" title={item.notes}>
                    Note: {item.notes}
                  </p>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
