import React, { useState } from 'react';
import { InventoryItem } from '../types.ts';
import { 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  ClipboardCheck,
  Check,
  Undo2
} from 'lucide-react';

interface FloatingQuickActionsProps {
  items: InventoryItem[];
  filteredItems: InventoryItem[];
  hasActiveFilter: boolean;
  activeFilterDescription: string;
  onBatchUpdate: (updater: (item: InventoryItem) => InventoryItem) => void;
  currency?: string;
  isShiftedUp?: boolean;
}

export const FloatingQuickActions: React.FC<FloatingQuickActionsProps> = ({
  items,
  filteredItems,
  hasActiveFilter,
  activeFilterDescription,
  onBatchUpdate,
  isShiftedUp = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [applyToFilteredOnly, setApplyToFilteredOnly] = useState<boolean>(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);
  const [previousItemsState, setPreviousItemsState] = useState<InventoryItem[] | null>(null);

  const demandCount = items.filter(i => i.status === 'DEMAND' || i.requiredQty > 0).length;
  const okCount = items.filter(i => i.status === 'OK' && i.requiredQty === 0).length;

  const targetCount = (hasActiveFilter && applyToFilteredOnly) ? filteredItems.length : items.length;
  const targetLabel = (hasActiveFilter && applyToFilteredOnly) ? `filtered (${filteredItems.length})` : `all (${items.length})`;

  const triggerFeedback = (message: string) => {
    setLastActionMessage(message);
    setTimeout(() => {
      setLastActionMessage(null);
    }, 3500);
  };

  // 1-Click Toggle: Set All to OK
  const handleSetAllToOk = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Save previous state for 1-click Undo
    setPreviousItemsState([...items]);

    const targetIds = new Set(
      (hasActiveFilter && applyToFilteredOnly ? filteredItems : items).map(i => i.id)
    );

    onBatchUpdate(item => {
      if (targetIds.has(item.id)) {
        return {
          ...item,
          currentStock: item.previousStock,
          requiredQty: 0,
          status: 'OK',
          lastUpdatedDate: dateStr,
          lastUpdatedTime: timeStr,
          lastUpdated: timeStr
        };
      }
      return item;
    });

    triggerFeedback(`✓ Set ${targetCount} items to "OK" (Stock Fulfilled)`);
  };

  // 1-Click Toggle: Set All to DEMAND
  const handleSetAllToDemand = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setPreviousItemsState([...items]);

    const targetIds = new Set(
      (hasActiveFilter && applyToFilteredOnly ? filteredItems : items).map(i => i.id)
    );

    onBatchUpdate(item => {
      if (targetIds.has(item.id)) {
        const req = item.previousStock > 0 ? item.previousStock : 5;
        return {
          ...item,
          currentStock: 0,
          requiredQty: req,
          status: 'DEMAND',
          lastUpdatedDate: dateStr,
          lastUpdatedTime: timeStr,
          lastUpdated: timeStr
        };
      }
      return item;
    });

    triggerFeedback(`⚡ Set ${targetCount} items to "DEMAND" (Audit Requisition)`);
  };

  // Audit Reset: Zero Current Stocks to begin counting from scratch
  const handleZeroCurrentForAudit = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setPreviousItemsState([...items]);

    const targetIds = new Set(
      (hasActiveFilter && applyToFilteredOnly ? filteredItems : items).map(i => i.id)
    );

    onBatchUpdate(item => {
      if (targetIds.has(item.id)) {
        return {
          ...item,
          currentStock: 0,
          requiredQty: item.previousStock,
          status: item.previousStock > 0 ? 'DEMAND' : 'OK',
          lastUpdatedDate: dateStr,
          lastUpdatedTime: timeStr,
          lastUpdated: timeStr
        };
      }
      return item;
    });

    triggerFeedback(`📋 Zeroed current stock on ${targetCount} items for audit take`);
  };

  // 1-Click Undo last quick action
  const handleUndo = () => {
    if (!previousItemsState) return;
    const backup = [...previousItemsState];
    onBatchUpdate(item => {
      const match = backup.find(b => b.id === item.id);
      return match ? { ...match } : item;
    });
    setPreviousItemsState(null);
    triggerFeedback('↺ Reverted to previous stock status');
  };

  return (
    <div className={`fixed ${isShiftedUp ? 'bottom-20' : 'bottom-6'} right-6 z-40 select-none print:hidden flex flex-col items-end gap-2 transition-all duration-200`}>
      
      {/* Undo / Feedback Banner */}
      {lastActionMessage && (
        <div className="flex items-center gap-2 px-3.5 py-2 bg-neutral-900/95 text-white backdrop-blur-md rounded-xl shadow-2xl border border-neutral-700 text-xs animate-in slide-in-from-bottom-2 fade-in duration-200">
          <span>{lastActionMessage}</span>
          {previousItemsState && (
            <button
              type="button"
              onClick={handleUndo}
              className="ml-1.5 px-2 py-0.5 bg-neutral-700 hover:bg-neutral-600 rounded text-neutral-200 hover:text-white font-medium flex items-center gap-1 transition-colors"
            >
              <Undo2 className="w-3 h-3" />
              <span>Undo</span>
            </button>
          )}
        </div>
      )}

      {/* Main Floating Card / Pill */}
      <div className="bg-neutral-900/95 backdrop-blur-md text-white border border-neutral-800 rounded-2xl shadow-2xl transition-all duration-200 overflow-hidden max-w-sm w-auto">
        
        {/* Header / Collapsed bar */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-tight">Quick Action Menu</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                  Audit Prep
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  {okCount} OK
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 text-rose-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                  {demandCount} Demand
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors ml-2"
            aria-label={isExpanded ? 'Collapse Quick Action Menu' : 'Expand Quick Action Menu'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded Controls */}
        {isExpanded && (
          <div className="p-3.5 pt-1 space-y-3 border-t border-neutral-800/80">
            
            {/* Filter Scope Switcher (if filter is active) */}
            {hasActiveFilter && (
              <div className="p-1.5 bg-neutral-800/80 rounded-xl flex items-center justify-between text-[11px] text-neutral-300">
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <Filter className="w-3 h-3 text-neutral-400 shrink-0" />
                  <span className="truncate">Target: <strong>{applyToFilteredOnly ? activeFilterDescription : 'All Items'}</strong></span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setApplyToFilteredOnly(false)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      !applyToFilteredOnly ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    All ({items.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplyToFilteredOnly(true)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      applyToFilteredOnly ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Filtered ({filteredItems.length})
                  </button>
                </div>
              </div>
            )}

            {/* Quick 1-Click Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {/* 1-Click All to OK */}
              <button
                type="button"
                onClick={handleSetAllToOk}
                className="group relative px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-200 hover:text-white rounded-xl text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
                title="Single click: Mark all items as OK (Current = Previous, Required = 0)"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold">All to OK</span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-900/80 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                    1-Click
                  </span>
                </div>
                <div className="text-[10px] text-emerald-400/80 mt-1 leading-tight">
                  Fulfilled & verified ({targetLabel})
                </div>
              </button>

              {/* 1-Click All to DEMAND */}
              <button
                type="button"
                onClick={handleSetAllToDemand}
                className="group relative px-3 py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-700/60 text-rose-200 hover:text-white rounded-xl text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
                title="Single click: Mark all items as DEMAND (Current = 0, Required = Prev || 5)"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="text-xs font-bold">All to Demand</span>
                  </div>
                  <span className="text-[10px] font-mono bg-rose-900/80 text-rose-300 px-1.5 py-0.2 rounded font-bold">
                    1-Click
                  </span>
                </div>
                <div className="text-[10px] text-rose-400/80 mt-1 leading-tight">
                  Full reorder needed ({targetLabel})
                </div>
              </button>
            </div>

            {/* Secondary Audit Prep Option: Zero All Current Stock */}
            <div className="pt-1 border-t border-neutral-800/80 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleZeroCurrentForAudit}
                className="w-full py-1.5 px-2.5 bg-neutral-800 hover:bg-neutral-700/80 text-neutral-200 hover:text-white rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5"
                title="Sets Current Stock to 0 on target items so you can start a physical count"
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Zero Current for Fresh Count ({targetCount})</span>
              </button>
            </div>

            {/* Informational micro footer */}
            <div className="text-[10px] text-neutral-500 text-center pt-0.5">
              Instant audit preparation · 1-click apply to {items.length} catalog items
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
