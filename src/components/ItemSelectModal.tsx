import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem } from '../types.ts';
import { 
  X, 
  Search, 
  Check, 
  Plus, 
  Minus, 
  MousePointerClick, 
  ShoppingBag, 
  FileSpreadsheet, 
  Share2, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface ItemSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  categories: string[];
  currency?: string;
  onApplyNewDemandList: (selectedUpdates: Record<string, { requiredQty: number; unit?: string }>, resetUnselectedToOk: boolean) => void;
  onExportExcel: () => void;
  onOpenShareModal: () => void;
}

export const ItemSelectModal: React.FC<ItemSelectModalProps> = ({
  isOpen,
  onClose,
  items,
  categories,
  currency = 'Rs.',
  onApplyNewDemandList,
  onExportExcel,
  onOpenShareModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [resetUnselected, setResetUnselected] = useState<boolean>(true);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Map of itemId -> { requiredQty, selected }
  const [selectedItems, setSelectedItems] = useState<Record<string, { requiredQty: number; unit: string }>>(() => {
    const initial: Record<string, { requiredQty: number; unit: string }> = {};
    items.forEach(i => {
      if (i.status === 'DEMAND' || i.requiredQty > 0) {
        initial[i.id] = {
          requiredQty: i.requiredQty || Math.max(1, i.previousStock - i.currentStock) || 1,
          unit: i.unit
        };
      }
    });
    return initial;
  });

  // Re-sync selectedItems when modal opens
  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, { requiredQty: number; unit: string }> = {};
      items.forEach(i => {
        if (i.status === 'DEMAND' || i.requiredQty > 0) {
          initial[i.id] = {
            requiredQty: i.requiredQty || Math.max(1, i.previousStock - i.currentStock) || 1,
            unit: i.unit
          };
        }
      });
      setSelectedItems(initial);
      setSearchQuery('');
    }
  }, [isOpen, items]);

  // Filtered items (always called at top-level)
  const filteredCatalog = useMemo(() => {
    return items.filter(item => {
      const matchesCat = activeCategory === 'ALL' || item.category === activeCategory;
      const matchesQuery = !searchQuery.trim() || 
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [items, activeCategory, searchQuery]);

  // 1-by-1 Click toggle handler
  const handleToggleItem = (item: InventoryItem) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[item.id]) {
        // If already selected, remove it (or can decrease)
        delete next[item.id];
      } else {
        // 1 click select! Calculate recommended required or default
        const recommended = item.requiredQty > 0 
          ? item.requiredQty 
          : Math.max(1, item.previousStock - item.currentStock) || 5;
        next[item.id] = {
          requiredQty: recommended,
          unit: item.unit
        };
      }
      return next;
    });
  };

  const handleUpdateQty = (itemId: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItems(prev => {
      const current = prev[itemId];
      if (!current) return prev;
      const newQty = Math.max(1, current.requiredQty + delta);
      return {
        ...prev,
        [itemId]: { ...current, requiredQty: newQty }
      };
    });
  };

  const handleSetExactQty = (itemId: string, qty: number, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = Math.max(1, parseInt(e.target.value) || 1);
    setSelectedItems(prev => {
      const current = prev[itemId];
      if (!current) return prev;
      return {
        ...prev,
        [itemId]: { ...current, requiredQty: val }
      };
    });
  };

  const handleSelectAllInView = () => {
    setSelectedItems(prev => {
      const next = { ...prev };
      filteredCatalog.forEach(item => {
        if (!next[item.id]) {
          const rec = item.requiredQty > 0 
            ? item.requiredQty 
            : Math.max(1, item.previousStock - item.currentStock) || 5;
          next[item.id] = { requiredQty: rec, unit: item.unit };
        }
      });
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedItems({});
  };

  const selectedCount = Object.keys(selectedItems).length;
  const totalUnits = Object.values(selectedItems).reduce((sum, val) => sum + val.requiredQty, 0);

  const totalEstimatedBill = useMemo(() => {
    return Object.entries(selectedItems).reduce((sum, [id, info]) => {
      const it = items.find(i => i.id === id);
      return sum + (info.requiredQty * (it?.unitPrice || 0));
    }, 0);
  }, [selectedItems, items]);

  const handleApply = () => {
    onApplyNewDemandList(selectedItems, resetUnselected);
    onClose();
  };

  // Only return null after all hooks have been called
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[90vh] max-h-[850px] shadow-2xl border border-neutral-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1F4E78] text-white flex items-center justify-center shadow-xs">
              <MousePointerClick className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
                <span>1-by-1 Click Select for New Demand List</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-[#1F4E78]">
                  Click to Add
                </span>
              </h2>
              <p className="text-xs text-neutral-500">
                Current Time: <strong className="text-neutral-800">{dateStr} at {timeStr}</strong> · Click any item to add to today&apos;s demand order.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search, Categories, Quick Actions */}
        <div className="p-3 sm:p-4 border-b border-neutral-200 bg-white flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shrink-0">
          
          {/* Search */}
          <div className="relative min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items to select..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setActiveCategory('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeCategory === 'ALL'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All Items ({items.length})
            </button>
            {categories.map(cat => {
              const countInCat = items.filter(i => i.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                    activeCategory === cat
                      ? 'bg-[#1F4E78] text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] opacity-75">({countInCat})</span>
                </button>
              );
            })}
          </div>

          {/* Quick Select / Deselect in view */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSelectAllInView}
              className="px-2.5 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Select All in View
            </button>
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area: Split Grid + Selected Sidebar */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
          
          {/* Left 2 Cols: 1-by-1 Clickable Catalog Grid */}
          <div className="lg:col-span-2 overflow-y-auto p-4 sm:p-5 bg-neutral-50/50 border-r border-neutral-200">
            <div className="mb-3 flex items-center justify-between text-xs text-neutral-500 font-medium">
              <span>Click any card to select/deselect for demand</span>
              <span>Showing {filteredCatalog.length} items</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredCatalog.map(item => {
                const isSelected = !!selectedItems[item.id];
                const currentData = selectedItems[item.id];

                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleItem(item)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all select-none flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-[#1F4E78] ring-2 ring-[#1F4E78]/20 shadow-xs'
                        : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                          {item.category}
                        </span>
                        <h4 className="font-bold text-sm text-neutral-900 truncate mt-0.5">
                          {item.name}
                        </h4>
                        <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
                          <span>Unit: <strong>{item.unit}</strong></span>
                          <span>·</span>
                          <span>Stock: {item.currentStock} / {item.previousStock}</span>
                        </div>
                      </div>

                      {/* 1-Click Selection Status Icon */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform ${
                        isSelected 
                          ? 'bg-[#1F4E78] text-white scale-105 shadow-xs' 
                          : 'border-2 border-neutral-300 text-transparent hover:border-neutral-400'
                      }`}>
                        <Check className="w-4 h-4" />
                      </div>
                    </div>

                    {/* If selected: inline required quantity adjuster */}
                    {isSelected && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 pt-2.5 border-t border-blue-200/80 flex items-center justify-between gap-2"
                      >
                        <span className="text-xs font-semibold text-[#1F4E78]">
                          Required Demand:
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleUpdateQty(item.id, -1, e)}
                            className="w-6 h-6 rounded flex items-center justify-center bg-white border border-blue-300 text-[#1F4E78] font-bold hover:bg-blue-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <input
                            type="number"
                            min="1"
                            value={currentData.requiredQty}
                            onChange={(e) => handleSetExactQty(item.id, parseInt(e.target.value) || 1, e)}
                            className="w-14 py-0.5 px-1 text-center font-mono font-bold text-xs bg-white border border-blue-300 rounded text-neutral-900 focus:outline-hidden"
                          />

                          <button
                            type="button"
                            onClick={(e) => handleUpdateQty(item.id, 1, e)}
                            className="w-6 h-6 rounded flex items-center justify-center bg-[#1F4E78] text-white font-bold hover:bg-[#163857]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Col: Selected Items Tray & Apply Options */}
          <div className="flex flex-col bg-white overflow-hidden">
            
            {/* Tray Header */}
            <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#1F4E78]" />
                  <span>Selected for New Demand</span>
                </h3>
                <div className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
                  <span>{selectedCount} items</span>
                  <span>·</span>
                  <span>{totalUnits} units</span>
                  <span>·</span>
                  <strong className="text-emerald-700 font-mono">
                    {currency} {totalEstimatedBill.toLocaleString()}
                  </strong>
                </div>
              </div>

              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-xs text-neutral-500 hover:text-rose-600 transition-colors"
                >
                  Deselect All
                </button>
              )}
            </div>

            {/* Selected Items Scroll List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {selectedCount === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400 space-y-2">
                  <MousePointerClick className="w-8 h-8 text-neutral-300" />
                  <p className="text-sm font-semibold text-neutral-600">No items selected yet</p>
                  <p className="text-xs text-neutral-400 max-w-xs">
                    Click items 1 by 1 on the left catalog to add them to your new demand list.
                  </p>
                </div>
              ) : (
                Object.entries(selectedItems).map(([id, info]) => {
                  const item = items.find(i => i.id === id);
                  if (!item) return null;

                  return (
                    <div
                      key={id}
                      className="p-2.5 bg-neutral-50 hover:bg-neutral-100/80 rounded-lg border border-neutral-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-neutral-900 truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {item.category} · {item.unit}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono font-bold text-rose-600 text-sm">
                          +{info.requiredQty}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleItem(item)}
                          title="Remove item"
                          className="p-1 text-neutral-400 hover:text-rose-600 rounded transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Options & Apply Button */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 space-y-3">
              
              {/* Option: Reset unselected to OK */}
              <label className="flex items-start gap-2 text-xs text-neutral-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={resetUnselected}
                  onChange={(e) => setResetUnselected(e.target.checked)}
                  className="mt-0.5 rounded border-neutral-300 text-[#1F4E78] focus:ring-blue-500"
                />
                <span>
                  <strong>New Demand List Mode:</strong> Set all other unselected items as OK (Required = 0).
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={selectedCount === 0}
                  onClick={handleApply}
                  className="flex-1 py-2 px-4 text-xs sm:text-sm font-semibold text-white bg-[#1F4E78] hover:bg-[#163857] disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Generate Demand List ({selectedCount} items)</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
