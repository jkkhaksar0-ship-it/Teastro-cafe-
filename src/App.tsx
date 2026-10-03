/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, ViewFilter, StockSnapshot, DemandInvoice } from './types.ts';
import { getInitialItems, DEFAULT_CATEGORIES } from './data/initialItems.ts';
import { Header } from './components/Header.tsx';
import { SummaryCards } from './components/SummaryCards.tsx';
import { SpreadsheetView } from './components/SpreadsheetView.tsx';
import { QuickCountView } from './components/QuickCountView.tsx';
import { PurchaseOrderView } from './components/PurchaseOrderView.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { BillingInvoiceView } from './components/BillingInvoiceView.tsx';
import { BulkAddItemsModal } from './components/BulkAddItemsModal.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { RolloverModal } from './components/RolloverModal.tsx';
import { ItemSelectModal } from './components/ItemSelectModal.tsx';
import { exportDemandListToExcel } from './utils/excel.ts';
import { Check, Info, FileSpreadsheet, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'DEMAND_LIST_ITEMS_V1';
const SNAPSHOTS_KEY = 'DEMAND_LIST_SNAPSHOTS_V1';
const STORE_NAME_KEY = 'DEMAND_LIST_STORE_NAME_V1';
const INVOICES_KEY = 'DEMAND_LIST_INVOICES_V1';
const CURRENCY_KEY = 'DEMAND_LIST_CURRENCY_V1';

function sanitizeItem(raw: any, index: number): InventoryItem {
  const prevStock = typeof raw.previousStock === 'number' && !isNaN(raw.previousStock) ? Math.max(0, raw.previousStock) : 0;
  const currStock = typeof raw.currentStock === 'number' && !isNaN(raw.currentStock) ? Math.max(0, raw.currentStock) : 0;
  const calculatedRequired = Math.max(0, prevStock - currStock);
  const reqQty = typeof raw.requiredQty === 'number' && !isNaN(raw.requiredQty) ? Math.max(0, raw.requiredQty) : calculatedRequired;
  const status: 'DEMAND' | 'OK' = raw.status === 'DEMAND' || reqQty > 0 ? 'DEMAND' : 'OK';

  return {
    id: String(raw.id || `item-${index + 1}`),
    category: String(raw.category || 'Other Food Items'),
    name: String(raw.name || `Item ${index + 1}`),
    unit: String(raw.unit || 'units'),
    unitPrice: typeof raw.unitPrice === 'number' && !isNaN(raw.unitPrice) ? Math.max(0, raw.unitPrice) : 100,
    previousStock: prevStock,
    currentStock: currStock,
    requiredQty: reqQty,
    date: String(raw.date || new Date().toISOString().split('T')[0]),
    status,
    notes: String(raw.notes || ''),
    parLevel: typeof raw.parLevel === 'number' ? raw.parLevel : undefined,
    supplier: typeof raw.supplier === 'string' ? raw.supplier : undefined,
    lastUpdatedDate: typeof raw.lastUpdatedDate === 'string' ? raw.lastUpdatedDate : undefined,
    lastUpdatedTime: typeof raw.lastUpdatedTime === 'string' ? raw.lastUpdatedTime : undefined,
    lastUpdated: typeof raw.lastUpdated === 'string' ? raw.lastUpdated : undefined,
  };
}

export default function App() {
  // Load initial items from localStorage or defaults
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => sanitizeItem(item, idx));
        }
      }
    } catch (e) {
      console.error('Failed to load items from storage:', e);
    }
    return getInitialItems();
  });

  const [snapshots, setSnapshots] = useState<StockSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem(SNAPSHOTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load snapshots:', e);
    }
    return [];
  });

  const [savedInvoices, setSavedInvoices] = useState<DemandInvoice[]>(() => {
    try {
      const saved = localStorage.getItem(INVOICES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load invoices:', e);
    }
    return [];
  });

  const [currency, setCurrency] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(CURRENCY_KEY);
      if (saved) return saved;
    } catch (e) {
      // ignore
    }
    return 'Rs.';
  });

  const [storeName, setStoreName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORE_NAME_KEY);
      if (saved) return saved;
    } catch (e) {
      // ignore
    }
    return 'Central Kitchen & Cafe';
  });

  // App navigation and filter state
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'audit' | 'order' | 'billing' | 'analytics'>('spreadsheet');
  const [currentFilter, setFilter] = useState<ViewFilter>('ALL');

  // Modals state
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isRolloverOpen, setIsRolloverOpen] = useState(false);
  const [isItemSelectOpen, setIsItemSelectOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 3000);
  };

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist items', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
    } catch (e) {
      console.error('Failed to persist snapshots', e);
    }
  }, [snapshots]);

  useEffect(() => {
    try {
      localStorage.setItem(INVOICES_KEY, JSON.stringify(savedInvoices));
    } catch (e) {
      console.error('Failed to persist invoices', e);
    }
  }, [savedInvoices]);

  useEffect(() => {
    try {
      localStorage.setItem(CURRENCY_KEY, currency);
    } catch (e) {
      // ignore
    }
  }, [currency]);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_NAME_KEY, storeName);
    } catch (e) {
      // ignore
    }
  }, [storeName]);

  // Derived category list
  const categories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    items.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [items]);

  const existingItemNames = useMemo(() => {
    return new Set<string>(items.map(i => (i.name || '').toLowerCase()));
  }, [items]);

  // KPI counts
  const demandCount = useMemo(() => items.filter(i => i.status === 'DEMAND').length, [items]);
  const okCount = useMemo(() => items.filter(i => i.status === 'OK').length, [items]);
  const totalRequiredUnits = useMemo(() => items.reduce((sum, i) => sum + i.requiredQty, 0), [items]);
  const estimatedBillTotal = useMemo(() => items.reduce((sum, i) => sum + (i.requiredQty * (i.unitPrice || 0)), 0), [items]);

  // Item management handlers
  const handleUpdateItem = (id: string, updates: Partial<InventoryItem>) => {
    const now = new Date();
    const dStr = now.toISOString().split('T')[0];
    const tStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        // Recalculate if previous or current changed
        if (updates.previousStock !== undefined || updates.currentStock !== undefined) {
          const prevStock = updates.previousStock !== undefined ? updates.previousStock : item.previousStock;
          const currStock = updates.currentStock !== undefined ? updates.currentStock : item.currentStock;
          const req = Math.max(0, prevStock - currStock);
          updated.requiredQty = req;
          updated.status = req > 0 ? 'DEMAND' : 'OK';
        }
        updated.lastUpdatedDate = dStr;
        updated.lastUpdatedTime = tStr;
        updated.lastUpdated = tStr;
        return updated;
      }
      return item;
    }));
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    showToast('Item deleted from catalog');
  };

  const handleAddSingleItem = (newItemData: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...newItemData,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    };
    setItems(prev => [newItem, ...prev]);
    showToast(`Added "${newItem.name}" to inventory`);
  };

  const handleAddMultipleItems = (newItems: Omit<InventoryItem, 'id'>[]) => {
    const created: InventoryItem[] = newItems.map((n, idx) => ({
      ...n,
      id: `item-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 3)}`
    }));
    setItems(prev => [...created, ...prev]);
    showToast(`Added ${created.length} new items to catalog!`);
  };

  const handleBatchUpdate = (updater: (item: InventoryItem) => InventoryItem) => {
    setItems(prev => prev.map(updater));
    showToast('Batch stock update applied');
  };

  const handleImportItems = (newItems: Partial<InventoryItem>[]) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const created: InventoryItem[] = newItems.map((n, idx) => {
      const prev = n.previousStock || 0;
      const curr = n.currentStock || 0;
      const required = Math.max(0, prev - curr);
      return {
        id: `import-${Date.now()}-${idx}`,
        category: n.category || 'General',
        name: n.name || 'Unnamed Item',
        previousStock: prev,
        currentStock: curr,
        unit: n.unit || 'units',
        unitPrice: n.unitPrice || 100,
        requiredQty: required,
        date: today,
        status: required > 0 ? 'DEMAND' : 'OK',
        notes: n.notes || '',
        lastUpdatedDate: today,
        lastUpdatedTime: timeStr,
        lastUpdated: timeStr
      };
    });

    if (window.confirm(`Found ${created.length} valid items in your file. Replace existing list or append? Click OK to Replace, Cancel to Append.`)) {
      setItems(created);
      showToast(`Imported and replaced ${created.length} items from Excel`);
    } else {
      setItems(prev => [...prev, ...created]);
      showToast(`Appended ${created.length} items to your catalog`);
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const filename = `Demand_List_${todayStr}_${now.getHours()}-${now.getMinutes()}.xlsx`;
    exportDemandListToExcel(items, filename, currency);
    showToast(`Exported "${filename}"`);
  };

  // Invoice Handlers
  const handleSaveInvoice = (inv: DemandInvoice) => {
    setSavedInvoices(prev => [inv, ...prev]);
    showToast(`Invoice "${inv.invoiceNumber}" saved to billing history`);
  };

  const handleDeleteInvoice = (id: string) => {
    setSavedInvoices(prev => prev.filter(i => i.id !== id));
    showToast('Invoice removed from billing history');
  };

  // Snapshot Handlers
  const handleSaveSnapshot = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const snapshot: StockSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: `${dateStr} at ${timeStr}`,
      date: now.toISOString().split('T')[0],
      time: timeStr,
      title: `Stock Milestone (${dateStr} - ${timeStr})`,
      items: JSON.parse(JSON.stringify(items)),
      totalDemandItems: demandCount,
      totalEstimatedBill: estimatedBillTotal
    };

    setSnapshots(prev => [snapshot, ...prev]);
    showToast('Stock milestone snapshot saved to audit log');
  };

  const handleRestoreSnapshot = (snapshot: StockSnapshot) => {
    setItems(snapshot.items);
    showToast(`Restored snapshot: "${snapshot.title}"`);
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
    showToast('Snapshot removed from history');
  };

  // Stock Rollover Handler
  const handleExecuteRollover = (mode: 'ROLL_AND_ZERO' | 'ROLL_AND_KEEP') => {
    handleSaveSnapshot();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setItems(prev => prev.map(item => {
      const newPrev = item.currentStock;
      const newCurr = mode === 'ROLL_AND_ZERO' ? 0 : item.currentStock;
      const newReq = Math.max(0, newPrev - newCurr);

      return {
        ...item,
        previousStock: newPrev,
        currentStock: newCurr,
        requiredQty: newReq,
        date: todayStr,
        status: newReq > 0 ? 'DEMAND' : 'OK',
        lastUpdatedDate: todayStr,
        lastUpdatedTime: timeStr,
        lastUpdated: timeStr
      };
    }));

    showToast(
      mode === 'ROLL_AND_ZERO' 
        ? 'Rollover complete: Current Stock zeroed for fresh audit' 
        : 'Rollover complete: Benchmark updated to Current Stock'
    );
  };

  // 1-by-1 Click Select Handler for New Demand List
  const handleApplyNewDemandList = (
    selectedUpdates: Record<string, { requiredQty: number; unit?: string }>,
    resetUnselectedToOk: boolean
  ) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setItems(prev => prev.map(item => {
      const selected = selectedUpdates[item.id];
      if (selected) {
        const req = Math.max(1, selected.requiredQty);
        return {
          ...item,
          requiredQty: req,
          status: 'DEMAND',
          date: todayStr,
          lastUpdatedDate: todayStr,
          lastUpdatedTime: timeStr,
          lastUpdated: timeStr
        };
      } else if (resetUnselectedToOk) {
        return {
          ...item,
          currentStock: item.previousStock,
          requiredQty: 0,
          status: 'OK',
          date: todayStr,
          lastUpdatedDate: todayStr,
          lastUpdatedTime: timeStr,
          lastUpdated: timeStr
        };
      }
      return item;
    }));

    const count = Object.keys(selectedUpdates).length;
    showToast(`New demand list created with ${count} items selected!`);
  };

  const handleResetToDefaults = () => {
    if (confirm('Reset entire catalog to original 36 cafe & kitchen items? All custom changes will be overwritten.')) {
      setItems(getInitialItems());
      showToast('Catalog reset to initial 36 items');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col text-neutral-900 print:bg-white print:min-h-0 print:block">
      
      {/* Toast Notification (no-print) */}
      {toastMessage && (
        <div className="no-print fixed bottom-5 right-5 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-neutral-700 flex items-center gap-2.5 text-xs sm:text-sm animate-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* App Header with Live Current Date & Time (no-print) */}
      <div className="no-print">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onExportExcel={handleExportExcel}
          onOpenAddItem={() => setIsAddItemOpen(true)}
          onOpenShareModal={() => setIsShareOpen(true)}
          onOpenRollover={() => setIsRolloverOpen(true)}
          onOpenItemSelectModal={() => setIsItemSelectOpen(true)}
          demandCount={demandCount}
          estimatedBillTotal={estimatedBillTotal}
          currency={currency}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 print:p-0 print:m-0 print:max-w-none print:w-full print:space-y-0">
        
        {/* KPI Summary Cards (Shown on Spreadsheet & Analytics tabs) */}
        {activeTab === 'spreadsheet' && (
          <div className="no-print">
            <SummaryCards
              totalItems={items.length}
              demandCount={demandCount}
              okCount={okCount}
              totalRequiredUnits={totalRequiredUnits}
              estimatedBillTotal={estimatedBillTotal}
              currency={currency}
              currentFilter={currentFilter}
              setFilter={setFilter}
              onOpenBilling={() => setActiveTab('billing')}
            />
          </div>
        )}

        {/* View Switcher Content */}
        {activeTab === 'spreadsheet' && (
          <SpreadsheetView
            items={items}
            categories={categories}
            filter={currentFilter}
            currency={currency}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onBatchUpdate={handleBatchUpdate}
            onImportItems={handleImportItems}
            onOpenAddItem={() => setIsAddItemOpen(true)}
            onOpenItemSelectModal={() => setIsItemSelectOpen(true)}
            onOpenBilling={() => setActiveTab('billing')}
          />
        )}

        {activeTab === 'billing' && (
          <BillingInvoiceView
            items={items}
            storeName={storeName}
            currency={currency}
            setCurrency={setCurrency}
            onUpdateItem={handleUpdateItem}
            savedInvoices={savedInvoices}
            onSaveInvoice={handleSaveInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onOpenItemSelectModal={() => setIsItemSelectOpen(true)}
          />
        )}

        {activeTab === 'audit' && (
          <QuickCountView
            items={items}
            categories={categories}
            onUpdateItem={handleUpdateItem}
          />
        )}

        {activeTab === 'order' && (
          <PurchaseOrderView
            items={items}
            storeName={storeName}
            setStoreName={setStoreName}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            items={items}
            categories={categories}
            snapshots={snapshots}
            onSaveSnapshot={handleSaveSnapshot}
            onRestoreSnapshot={handleRestoreSnapshot}
            onDeleteSnapshot={handleDeleteSnapshot}
            onExportExcel={handleExportExcel}
          />
        )}

        {/* Bottom Utility Bar (no-print) */}
        <div className="no-print pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-3">
          <div className="flex items-center gap-3">
            <span>Demand List Software · Inventory & Billing System</span>
            <span aria-hidden="true">·</span>
            <span>Formula: <code className="font-mono text-neutral-700">MAX(0, Prev - Current)</code></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsItemSelectOpen(true)}
              className="text-blue-700 hover:text-blue-900 font-semibold transition-colors"
            >
              1-by-1 Select for Demand
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setIsAddItemOpen(true)}
              className="hover:text-neutral-900 font-medium transition-colors"
            >
              + Add More Items
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleSaveSnapshot}
              className="hover:text-neutral-900 transition-colors"
            >
              Save Milestone
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="text-neutral-400 hover:text-rose-600 transition-colors"
            >
              Reset to Base 36 Items
            </button>
          </div>
        </div>

      </main>

      {/* Modals */}
      {isItemSelectOpen && (
        <ItemSelectModal
          isOpen={isItemSelectOpen}
          onClose={() => setIsItemSelectOpen(false)}
          items={items}
          categories={categories}
          currency={currency}
          onApplyNewDemandList={handleApplyNewDemandList}
          onExportExcel={handleExportExcel}
          onOpenShareModal={() => setIsShareOpen(true)}
        />
      )}

      {isAddItemOpen && (
        <BulkAddItemsModal
          isOpen={isAddItemOpen}
          onClose={() => setIsAddItemOpen(false)}
          categories={categories}
          existingItemNames={existingItemNames}
          onAddSingleItem={handleAddSingleItem}
          onAddMultipleItems={handleAddMultipleItems}
          currency={currency}
        />
      )}

      {isShareOpen && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          items={items}
          storeName={storeName}
        />
      )}

      {isRolloverOpen && (
        <RolloverModal
          isOpen={isRolloverOpen}
          onClose={() => setIsRolloverOpen(false)}
          onExecuteRollover={handleExecuteRollover}
          totalItems={items.length}
        />
      )}

    </div>
  );
}
