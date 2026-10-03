import React, { useState, useMemo, useRef } from 'react';
import { InventoryItem, ViewFilter } from '../types.ts';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Upload, 
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  Check,
  Calendar,
  MousePointerClick,
  CheckSquare,
  Square,
  AlertCircle,
  Receipt,
  Clock,
  PackagePlus
} from 'lucide-react';
import { parseExcelOrCsvFile } from '../utils/excel.ts';
import { FloatingQuickActions } from './FloatingQuickActions.tsx';

interface SpreadsheetViewProps {
  items: InventoryItem[];
  categories: string[];
  filter: ViewFilter;
  currency: string;
  onUpdateItem: (id: string, updates: Partial<InventoryItem>) => void;
  onDeleteItem: (id: string) => void;
  onBatchUpdate: (updater: (item: InventoryItem) => InventoryItem) => void;
  onImportItems: (newItems: Partial<InventoryItem>[]) => void;
  onOpenAddItem: () => void;
  onOpenItemSelectModal: () => void;
  onOpenBilling: () => void;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  items,
  categories,
  filter,
  currency,
  onUpdateItem,
  onDeleteItem,
  onBatchUpdate,
  onImportItems,
  onOpenAddItem,
  onOpenItemSelectModal,
  onOpenBilling
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'name' | 'category' | 'required' | 'status' | 'price' | 'time'>('category');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1-by-1 row selection state
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Filtered and sorted items
  const processedItems = useMemo(() => {
    let result = [...items];

    // Status Filter
    if (filter === 'DEMAND') {
      result = result.filter(item => item.status === 'DEMAND' || item.requiredQty > 0);
    } else if (filter === 'OK') {
      result = result.filter(item => item.status === 'OK' && item.requiredQty === 0);
    }

    // Category Filter
    if (selectedCategory !== 'ALL') {
      result = result.filter(item => item.category === selectedCategory);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        item => (item.name || '').toLowerCase().includes(q) || 
                (item.category || '').toLowerCase().includes(q) || 
                (item.notes && item.notes.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else if (sortField === 'category') {
        const catCmp = (a.category || '').localeCompare(b.category || '');
        cmp = catCmp !== 0 ? catCmp : (a.name || '').localeCompare(b.name || '');
      }
      else if (sortField === 'required') cmp = a.requiredQty - b.requiredQty;
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortField === 'price') cmp = (a.unitPrice || 0) - (b.unitPrice || 0);
      else if (sortField === 'time') cmp = (a.lastUpdatedTime || '').localeCompare(b.lastUpdatedTime || '');

      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [items, filter, selectedCategory, searchQuery, sortField, sortAsc]);

  const hasActiveFilter = filter !== 'ALL' || selectedCategory !== 'ALL' || searchQuery.trim().length > 0;
  const activeFilterDescription = useMemo(() => {
    const parts: string[] = [];
    if (filter !== 'ALL') parts.push(filter === 'DEMAND' ? 'Demands Only' : 'OK Stock Only');
    if (selectedCategory !== 'ALL') parts.push(selectedCategory);
    if (searchQuery.trim()) parts.push(`"${searchQuery.trim()}"`);
    return parts.join(' · ') || 'Active Filter';
  }, [filter, selectedCategory, searchQuery]);

  const handleStockChange = (id: string, field: 'previousStock' | 'currentStock' | 'unitPrice', value: number) => {
    const val = Math.max(0, isNaN(value) ? 0 : Math.round(value));
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;

    const prev = field === 'previousStock' ? val : targetItem.previousStock;
    const curr = field === 'currentStock' ? val : targetItem.currentStock;
    const required = Math.max(0, prev - curr);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    onUpdateItem(id, {
      [field]: val,
      requiredQty: required,
      status: required > 0 ? 'DEMAND' : 'OK',
      lastUpdatedDate: dateStr,
      lastUpdatedTime: timeStr,
      lastUpdated: timeStr
    });
  };

  const handleIncrementCurrent = (id: string, delta: number) => {
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;
    handleStockChange(id, 'currentStock', targetItem.currentStock + delta);
  };

  // 1-Click Demand Toggle on a row
  const handleToggleDemand = (item: InventoryItem) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (item.status === 'DEMAND') {
      // 1-Click to Mark OK (Fulfilled)
      onUpdateItem(item.id, {
        currentStock: item.previousStock,
        requiredQty: 0,
        status: 'OK',
        lastUpdatedDate: dateStr,
        lastUpdatedTime: timeStr,
        lastUpdated: timeStr
      });
    } else {
      // 1-Click to Turn Into Demand!
      const req = Math.max(1, item.previousStock - item.currentStock) || 5;
      onUpdateItem(item.id, {
        requiredQty: req,
        status: 'DEMAND',
        lastUpdatedDate: dateStr,
        lastUpdatedTime: timeStr,
        lastUpdated: timeStr
      });
    }
  };

  // 1-by-1 Checkbox Selection
  const toggleRowSelect = (id: string) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRowIds.size === processedItems.length && processedItems.length > 0) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(processedItems.map(i => i.id)));
    }
  };

  const handleBatchSetDemandForSelected = (isDemand: boolean) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    onBatchUpdate(item => {
      if (selectedRowIds.has(item.id)) {
        if (isDemand) {
          const req = Math.max(1, item.previousStock - item.currentStock) || 5;
          return {
            ...item,
            requiredQty: req,
            status: 'DEMAND',
            lastUpdatedDate: dateStr,
            lastUpdatedTime: timeStr,
            lastUpdated: timeStr
          };
        } else {
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
      }
      return item;
    });
    setSelectedRowIds(new Set());
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const parsed = await parseExcelOrCsvFile(file);
      if (parsed.length > 0) {
        onImportItems(parsed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isAllSelected = processedItems.length > 0 && selectedRowIds.size === processedItems.length;
  const totalEstDemandBill = processedItems.reduce((sum, i) => sum + (i.requiredQty * (i.unitPrice || 0)), 0);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden relative">
      
      {/* Table Toolbar */}
      <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Left: Search & Category */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items, categories, or notes..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400 hidden sm:block" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
              className="px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-neutral-300 rounded-lg text-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: 1-by-1 Select Option + Add More Items + Billing Shortcut */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          
          {/* Prominent 1-by-1 Click Select for New Demand List Button */}
          <button
            type="button"
            onClick={onOpenItemSelectModal}
            className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <MousePointerClick className="w-4 h-4" />
            <span>1-by-1 Select</span>
          </button>

          {/* Add More Items (Single, Bulk Multi-item, Preset Library) */}
          <button
            type="button"
            onClick={onOpenAddItem}
            className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-[#1F4E78] hover:bg-[#163857] rounded-lg shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <PackagePlus className="w-4 h-4" />
            <span>+ Add More Items</span>
          </button>

          {/* View Billing Invoice shortcut */}
          <button
            type="button"
            onClick={onOpenBilling}
            className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Billing Invoice</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-2.5 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-500" />
            <span>{isImporting ? 'Importing...' : 'Import'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Start fresh stock count? This sets Current Stock = 0 for all items so you can do a fresh shelf count.')) {
                const now = new Date();
                const dStr = now.toISOString().split('T')[0];
                const tStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                onBatchUpdate(item => ({
                  ...item,
                  currentStock: 0,
                  requiredQty: item.previousStock,
                  status: item.previousStock > 0 ? 'DEMAND' : 'OK',
                  lastUpdatedDate: dStr,
                  lastUpdatedTime: tStr,
                  lastUpdated: tStr
                }));
              }
            }}
            className="px-2.5 py-1.5 text-xs font-medium text-neutral-600 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
            <span>Zero Curr</span>
          </button>
        </div>

      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          
          {/* Header Row styled after openpyxl Navy Blue #1F4E78 */}
          <thead className="sticky top-0 z-10 bg-[#1F4E78] text-white select-none shadow-sm">
            <tr>
              {/* 1-by-1 Checkbox Header */}
              <th className="py-3 px-2.5 border-r border-[#2C6294] text-center w-[40px]">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-white/80 hover:text-white transition-colors"
                  title={isAllSelected ? 'Deselect all' : 'Select all'}
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 mx-auto" />
                  ) : (
                    <Square className="w-4 h-4 mx-auto opacity-70" />
                  )}
                </button>
              </th>

              <th 
                className="py-3 px-3 sm:px-4 font-semibold text-left border-r border-[#2C6294] cursor-pointer hover:bg-[#163857] transition-colors whitespace-nowrap"
                onClick={() => {
                  if (sortField === 'category') setSortAsc(!sortAsc);
                  else { setSortField('category'); setSortAsc(true); }
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span>Category</span>
                  <ArrowUpDown className="w-3 h-3 opacity-70" />
                </div>
              </th>

              <th 
                className="py-3 px-3 sm:px-4 font-semibold text-left border-r border-[#2C6294] cursor-pointer hover:bg-[#163857] transition-colors whitespace-nowrap min-w-[180px]"
                onClick={() => {
                  if (sortField === 'name') setSortAsc(!sortAsc);
                  else { setSortField('name'); setSortAsc(true); }
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span>Item Name</span>
                  <ArrowUpDown className="w-3 h-3 opacity-70" />
                </div>
              </th>

              <th className="py-3 px-3 sm:px-4 font-semibold text-right border-r border-[#2C6294] whitespace-nowrap w-[110px]">
                Previous
              </th>

              <th className="py-3 px-3 sm:px-4 font-semibold text-right border-r border-[#2C6294] whitespace-nowrap w-[150px]">
                Current
              </th>

              <th 
                className="py-3 px-3 sm:px-4 font-semibold text-right border-r border-[#2C6294] cursor-pointer hover:bg-[#163857] transition-colors whitespace-nowrap w-[110px]"
                onClick={() => {
                  if (sortField === 'required') setSortAsc(!sortAsc);
                  else { setSortField('required'); setSortAsc(false); }
                }}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Required</span>
                  <ArrowUpDown className="w-3 h-3 opacity-70" />
                </div>
              </th>

              {/* Billing: Unit Price */}
              <th 
                className="py-3 px-3 border-r border-[#2C6294] text-right cursor-pointer hover:bg-[#163857] whitespace-nowrap w-[120px]"
                onClick={() => {
                  if (sortField === 'price') setSortAsc(!sortAsc);
                  else { setSortField('price'); setSortAsc(false); }
                }}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Price ({currency})</span>
                  <ArrowUpDown className="w-3 h-3 opacity-70" />
                </div>
              </th>

              {/* Billing: Estimated Total */}
              <th className="py-3 px-3 border-r border-[#2C6294] text-right whitespace-nowrap w-[120px]">
                Line Bill
              </th>

              {/* Live Time & Date Column */}
              <th 
                className="py-3 px-3 border-r border-[#2C6294] text-center cursor-pointer hover:bg-[#163857] whitespace-nowrap w-[130px]"
                onClick={() => {
                  if (sortField === 'time') setSortAsc(!sortAsc);
                  else { setSortField('time'); setSortAsc(false); }
                }}
              >
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Time / Date</span>
                </div>
              </th>

              {/* Status Badge + 1-Click Action */}
              <th 
                className="py-3 px-3 border-r border-[#2C6294] text-center cursor-pointer hover:bg-[#163857] transition-colors whitespace-nowrap w-[150px]"
                onClick={() => {
                  if (sortField === 'status') setSortAsc(!sortAsc);
                  else { setSortField('status'); setSortAsc(true); }
                }}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Status / 1-Click</span>
                  <ArrowUpDown className="w-3 h-3 opacity-70" />
                </div>
              </th>

              <th className="py-3 px-3 sm:px-4 font-semibold text-left border-r border-[#2C6294] min-w-[150px]">
                Notes & Specs
              </th>

              <th className="py-3 px-2 font-semibold text-center w-[40px]">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-neutral-200">
            {processedItems.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-neutral-500">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="font-semibold text-neutral-800">No items match your criteria</p>
                    <p className="text-xs text-neutral-500">
                      Try clearing search filters or add a new inventory item.
                    </p>
                    <button
                      type="button"
                      onClick={onOpenAddItem}
                      className="mt-2 px-3 py-1.5 text-xs font-medium text-white bg-[#1F4E78] rounded-lg"
                    >
                      + Add New Item
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              processedItems.map((item) => {
                const isDemand = item.status === 'DEMAND';
                const isRowSelected = selectedRowIds.has(item.id);
                const lineCost = item.requiredQty * (item.unitPrice || 0);

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors group ${
                      isRowSelected
                        ? 'bg-blue-100/70 border-l-4 border-l-[#1F4E78]'
                        : isDemand 
                          ? 'bg-rose-50/50 hover:bg-rose-100/60' 
                          : 'bg-emerald-50/20 hover:bg-neutral-50'
                    }`}
                  >
                    {/* 1-by-1 Checkbox Selection */}
                    <td className="py-2.5 px-2 border-r border-neutral-200/80 text-center">
                      <button
                        type="button"
                        onClick={() => toggleRowSelect(item.id)}
                        className="text-neutral-400 hover:text-neutral-800 transition-colors"
                        title="Select item 1-by-1"
                      >
                        {isRowSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#1F4E78]" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500" />
                        )}
                      </button>
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-3 sm:px-4 border-r border-neutral-200/80 font-medium text-neutral-700 whitespace-nowrap">
                      {item.category}
                    </td>

                    {/* Item Name */}
                    <td className="py-2.5 px-3 sm:px-4 border-r border-neutral-200/80 font-semibold text-neutral-900">
                      <div className="flex items-baseline justify-between gap-2">
                        <span>{item.name}</span>
                        {item.unit && (
                          <span className="text-[11px] text-neutral-500 font-normal">
                            ({item.unit})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Previous Stock (Benchmark) */}
                    <td className="py-2.5 px-2 sm:px-3 border-r border-neutral-200/80 text-right">
                      <input
                        type="number"
                        min="0"
                        value={item.previousStock}
                        onChange={(e) => handleStockChange(item.id, 'previousStock', parseInt(e.target.value) || 0)}
                        className="w-14 py-1 px-1.5 text-right font-mono tabular-nums text-neutral-800 bg-white/80 border border-neutral-200 rounded-md focus:bg-white focus:border-blue-500 focus:outline-hidden"
                      />
                    </td>

                    {/* Current Stock (Editable with +/- quick buttons) */}
                    <td className="py-2.5 px-2 sm:px-3 border-r border-neutral-200/80 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleIncrementCurrent(item.id, -1)}
                          title="Decrease by 1"
                          disabled={item.currentStock <= 0}
                          className="w-5 h-5 rounded flex items-center justify-center bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-600 disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <input
                          type="number"
                          min="0"
                          value={item.currentStock}
                          onChange={(e) => handleStockChange(item.id, 'currentStock', parseInt(e.target.value) || 0)}
                          className={`w-14 py-1 px-1.5 text-right font-mono tabular-nums font-semibold border rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500 ${
                            isDemand
                              ? 'bg-white border-rose-300 text-rose-700'
                              : 'bg-white border-neutral-200 text-neutral-800'
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() => handleIncrementCurrent(item.id, 1)}
                          title="Increase by 1"
                          className="w-5 h-5 rounded flex items-center justify-center bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Required Qty: MAX(0, Prev - Current) */}
                    <td className="py-2.5 px-3 border-r border-neutral-200/80 text-right font-mono tabular-nums font-bold">
                      {item.requiredQty > 0 ? (
                        <span className="text-rose-600 text-sm">
                          +{item.requiredQty}
                        </span>
                      ) : (
                        <span className="text-neutral-400 font-normal">
                          0
                        </span>
                      )}
                    </td>

                    {/* Billing: Unit Price */}
                    <td className="py-2.5 px-2.5 border-r border-neutral-200/80 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-neutral-400 text-[10px]">{currency}</span>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice || 0}
                          onChange={(e) => handleStockChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-16 py-0.5 px-1 text-right font-mono text-xs border border-neutral-200 rounded focus:border-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </td>

                    {/* Billing: Estimated Line Bill */}
                    <td className="py-2.5 px-3 border-r border-neutral-200/80 text-right font-mono font-bold tabular-nums">
                      {lineCost > 0 ? (
                        <span className="text-emerald-700">
                          {currency} {lineCost.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-neutral-300">0</span>
                      )}
                    </td>

                    {/* Live Timestamp (Date + Current Time) */}
                    <td className="py-2.5 px-2 border-r border-neutral-200/80 text-center text-[11px] font-mono text-neutral-500 whitespace-nowrap">
                      <div className="leading-tight">
                        <span className="font-semibold text-neutral-700 block">
                          {item.lastUpdatedTime || item.lastUpdated || '10:00 AM'}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {item.lastUpdatedDate || item.date}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge + 1-Click Toggle Option */}
                    <td className="py-2.5 px-2 sm:px-3 border-r border-neutral-200/80 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {isDemand ? (
                          <>
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-[#F4CCCC] text-[#900] border border-[#EAA]">
                              DEMAND
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleDemand(item)}
                              title="1-Click: Fulfill / Set as OK"
                              className="p-1 text-xs text-neutral-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-[#D9EAD3] text-[#274E13] border border-[#B6D7A8]">
                              OK
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleDemand(item)}
                              title="1-Click: Add to Demand List"
                              className="px-1.5 py-0.5 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                            >
                              + Demand
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="py-2 px-3 border-r border-neutral-200/80">
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => onUpdateItem(item.id, { notes: e.target.value })}
                        placeholder="Add note, brand or spec..."
                        className="w-full text-xs text-neutral-700 bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-blue-500 focus:bg-white focus:py-1 focus:px-1.5 focus:rounded focus:outline-hidden transition-all"
                      />
                    </td>

                    {/* Delete Item */}
                    <td className="py-2 px-1 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove "${item.name}" from catalog?`)) {
                            onDeleteItem(item.id);
                          }
                        }}
                        title="Delete item"
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 rounded transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer with billing totals */}
          <tfoot className="bg-neutral-100 border-t border-neutral-200 text-xs font-semibold text-neutral-700">
            <tr>
              <td colSpan={3} className="py-2.5 px-4">
                Showing {processedItems.length} items
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                {processedItems.reduce((acc, i) => acc + i.previousStock, 0)}
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                {processedItems.reduce((acc, i) => acc + i.currentStock, 0)}
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-600">
                +{processedItems.reduce((acc, i) => acc + i.requiredQty, 0)}
              </td>
              <td className="py-2.5 px-3 text-right text-neutral-500 font-mono">
                Total Est:
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-800 font-bold">
                {currency} {totalEstDemandBill.toLocaleString()}
              </td>
              <td colSpan={4} className="py-2.5 px-4 text-right text-neutral-500">
                Formula: <span className="font-mono">Req = MAX(0, Prev - Curr) · Bill = Req &times; Price</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Floating Selection Bar for 1-by-1 Selected Items */}
      {selectedRowIds.size > 0 && (
        <div className="p-3 bg-neutral-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-xl border-t border-neutral-700 animate-in slide-in-from-bottom-2 duration-150 sticky bottom-0 z-20">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white font-mono text-xs font-bold flex items-center justify-center">
              {selectedRowIds.size}
            </span>
            <span className="text-xs sm:text-sm font-semibold">
              items selected 1-by-1
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleBatchSetDemandForSelected(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Mark Selected as DEMAND</span>
            </button>

            <button
              type="button"
              onClick={() => handleBatchSetDemandForSelected(false)}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark Selected as OK</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRowIds(new Set())}
              className="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Floating Quick Action Menu for 1-Click Audit Preparation & Toggles */}
      <FloatingQuickActions
        items={items}
        filteredItems={processedItems}
        hasActiveFilter={hasActiveFilter}
        activeFilterDescription={activeFilterDescription}
        onBatchUpdate={onBatchUpdate}
        currency={currency}
        isShiftedUp={selectedRowIds.size > 0}
      />

    </div>
  );
};
