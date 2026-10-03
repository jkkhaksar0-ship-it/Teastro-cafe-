import React, { useState, useMemo } from 'react';
import { InventoryItem, DemandInvoice, InvoiceLineItem } from '../types.ts';
import { 
  Receipt, 
  Printer, 
  Copy, 
  Check, 
  Clock, 
  Calendar,
  FileSpreadsheet,
  FileText,
  DollarSign,
  Plus,
  Minus,
  Trash2,
  MousePointerClick,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { exportInvoiceToExcel } from '../utils/excel.ts';

interface BillingInvoiceViewProps {
  items: InventoryItem[];
  storeName: string;
  currency: string;
  setCurrency: (c: string) => void;
  onUpdateItem: (id: string, updates: Partial<InventoryItem>) => void;
  savedInvoices: DemandInvoice[];
  onSaveInvoice: (inv: DemandInvoice) => void;
  onDeleteInvoice: (id: string) => void;
  onOpenItemSelectModal?: () => void;
}

export const BillingInvoiceView: React.FC<BillingInvoiceViewProps> = ({
  items,
  storeName,
  currency,
  setCurrency: _setCurrency,
  onUpdateItem,
  savedInvoices: _savedInvoices,
  onSaveInvoice: _onSaveInvoice,
  onDeleteInvoice: _onDeleteInvoice,
  onOpenItemSelectModal
}) => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Toggle between clean item list (NO Rs, NO Cash) and commercial invoice
  const [showPricesAndCash, setShowPricesAndCash] = useState<boolean>(false);

  // Quick 1-click item picker drawer
  const [showQuickPicker, setShowQuickPicker] = useState<boolean>(true);
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerCategory, setPickerCategory] = useState<string>('ALL');

  const [supplierName, setSupplierName] = useState('Standard Food Wholesale & Dist.');
  const [invoiceNumber, setInvoiceNumber] = useState(`PO-${dateStr.replace(/-/g, '')}-01`);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'UNPAID' | 'PAID' | 'PARTIAL'>('UNPAID');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CREDIT' | 'ONLINE'>('CASH');
  const [notes, setNotes] = useState('Delivery at kitchen dock. Please check items on arrival.');
  const [copiedClean, setCopiedClean] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  // All categories for picker
  const pickerCategories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach(i => {
      if (i.category) cats.add(i.category);
    });
    return ['ALL', ...Array.from(cats)];
  }, [items]);

  // Filtered catalog for quick 1-click item picker
  const filteredPickerItems = useMemo(() => {
    return items.filter(item => {
      const matchCat = pickerCategory === 'ALL' || item.category === pickerCategory;
      const matchSearch = !pickerSearch.trim() || 
        (item.name || '').toLowerCase().includes(pickerSearch.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(pickerSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, pickerCategory, pickerSearch]);

  // Line items from items in DEMAND
  const demandItems = useMemo(() => {
    return items.filter(i => i.status === 'DEMAND' || i.requiredQty > 0);
  }, [items]);

  const lineItems: InvoiceLineItem[] = useMemo(() => {
    return demandItems.map(item => {
      const price = item.unitPrice || 0;
      return {
        itemId: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit || 'units',
        qty: item.requiredQty,
        unitPrice: price,
        total: item.requiredQty * price
      };
    });
  }, [demandItems]);

  const totalDemandUnits = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.qty, 0);
  }, [lineItems]);

  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
  }, [lineItems]);

  const taxAmount = useMemo(() => {
    return Math.round((subtotal * taxRatePercent) / 100);
  }, [subtotal, taxRatePercent]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal + taxAmount + Number(deliveryFee || 0) - Number(discountAmount || 0));
  }, [subtotal, taxAmount, deliveryFee, discountAmount]);

  const currentInvoice: DemandInvoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber,
    date: dateStr,
    time: timeStr,
    supplierName,
    storeName,
    currency,
    items: lineItems,
    subtotal,
    taxRatePercent,
    taxAmount,
    discountAmount: Number(discountAmount) || 0,
    deliveryFee: Number(deliveryFee) || 0,
    grandTotal,
    paymentStatus,
    paymentMethod,
    notes
  };

  const handlePriceChange = (itemId: string, newPrice: number) => {
    const val = Math.max(0, Number(newPrice) || 0);
    onUpdateItem(itemId, {
      unitPrice: val,
      lastUpdatedDate: dateStr,
      lastUpdatedTime: timeStr
    });
  };

  // 1-Click item toggle or increase quantity directly in billing
  const handleItemClick = (item: InventoryItem) => {
    if (item.status === 'DEMAND' || item.requiredQty > 0) {
      // Increase quantity by 1
      handleAdjustQty(item.id, 1);
    } else {
      // Add into demand with default benchmark or +5
      const newReq = item.previousStock > 0 ? item.previousStock : 5;
      const prevStock = item.previousStock > 0 ? item.previousStock : 5;
      onUpdateItem(item.id, {
        previousStock: prevStock,
        currentStock: 0,
        requiredQty: newReq,
        status: 'DEMAND',
        lastUpdatedDate: dateStr,
        lastUpdatedTime: timeStr
      });
    }
  };

  // Adjust quantity from table row
  const handleAdjustQty = (itemId: string, delta: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const currentReq = item.requiredQty || 0;
    const newReq = Math.max(0, currentReq + delta);
    const prevStock = item.previousStock > 0 ? item.previousStock : Math.max(10, newReq);
    const newCurr = Math.max(0, prevStock - newReq);

    onUpdateItem(itemId, {
      previousStock: prevStock,
      currentStock: newCurr,
      requiredQty: newReq,
      status: newReq > 0 ? 'DEMAND' : 'OK',
      lastUpdatedDate: dateStr,
      lastUpdatedTime: timeStr
    });
  };

  // Set explicit quantity
  const handleSetExplicitQty = (itemId: string, qty: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newReq = Math.max(0, qty);
    const prevStock = item.previousStock > 0 ? item.previousStock : Math.max(10, newReq);
    const newCurr = Math.max(0, prevStock - newReq);

    onUpdateItem(itemId, {
      previousStock: prevStock,
      currentStock: newCurr,
      requiredQty: newReq,
      status: newReq > 0 ? 'DEMAND' : 'OK',
      lastUpdatedDate: dateStr,
      lastUpdatedTime: timeStr
    });
  };

  // Remove item from demand list
  const handleRemoveFromDemand = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    onUpdateItem(itemId, {
      currentStock: item.previousStock,
      requiredQty: 0,
      status: 'OK',
      lastUpdatedDate: dateStr,
      lastUpdatedTime: timeStr
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExcelExport = () => {
    exportInvoiceToExcel(currentInvoice);
  };

  // Clean Item List Copy (NO Rs, NO CASH - ONLY ITEM NAME + QTY)
  const handleCopyCleanList = () => {
    let text = `📋 *DEMAND LIST*\n`;
    text += `📄 PO #: ${invoiceNumber}\n`;
    text += `🏪 Store: ${storeName}\n`;
    if (supplierName) text += `🚚 Supplier: ${supplierName}\n`;
    text += `📅 Date: ${dateStr} · ⏰ Time: ${timeStr}\n`;
    text += `--------------------------------------\n`;
    lineItems.forEach((li, idx) => {
      text += `${idx + 1}. *${li.name}* - ${li.qty} ${li.unit}\n`;
    });
    text += `--------------------------------------\n`;
    text += `⚡ Total Items: ${lineItems.length} (${totalDemandUnits} total units)\n`;
    if (notes) text += `Notes: ${notes}\n`;

    navigator.clipboard.writeText(text);
    setCopiedClean(true);
    setTimeout(() => setCopiedClean(false), 2500);
  };

  // Detailed Bill Copy (with prices if requested)
  const handleCopyFullBill = () => {
    let text = `🧾 *OFFICIAL BILL / DEMAND INVOICE*\n`;
    text += `📄 Invoice #: ${invoiceNumber}\n`;
    text += `🏪 Store: ${storeName}\n`;
    text += `🚚 Supplier: ${supplierName}\n`;
    text += `📅 Date: ${dateStr} · ⏰ Time: ${timeStr}\n`;
    text += `--------------------------------------\n`;
    lineItems.forEach((li, idx) => {
      text += `${idx + 1}. *${li.name}* (${li.qty} ${li.unit}) @ ${currency}${li.unitPrice} = *${currency}${li.total.toLocaleString()}*\n`;
    });
    text += `--------------------------------------\n`;
    text += `Subtotal: ${currency} ${subtotal.toLocaleString()}\n`;
    if (taxAmount > 0) text += `Tax (${taxRatePercent}%): ${currency} ${taxAmount.toLocaleString()}\n`;
    if (deliveryFee > 0) text += `Delivery Fee: ${currency} ${deliveryFee.toLocaleString()}\n`;
    if (discountAmount > 0) text += `Discount: -${currency} ${discountAmount.toLocaleString()}\n`;
    text += `💰 *GRAND TOTAL: ${currency} ${grandTotal.toLocaleString()}*\n`;
    text += `Status: ${paymentStatus} (${paymentMethod})\n`;
    if (notes) text += `Notes: ${notes}\n`;

    navigator.clipboard.writeText(text);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action & Mode Switcher Bar (no-print) */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-xl border border-neutral-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#1F4E78]" />
            <span>Demand Order & Requisition Sheet</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Clean item demand requisition for suppliers with live timestamp.
          </p>
        </div>

        {/* View Mode Toggle & Primary Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          
          {/* 1-by-1 Select Button */}
          {onOpenItemSelectModal && (
            <button
              type="button"
              onClick={onOpenItemSelectModal}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              title="Open 1-by-1 item selector modal"
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              <span>1-by-1 Select Items</span>
            </button>
          )}

          {/* Mode Switcher: Clean Items Only vs Commercial Bill */}
          <div className="p-1 bg-neutral-100 rounded-lg flex items-center gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setShowPricesAndCash(false)}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                !showPricesAndCash
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#1F4E78]" />
              <span>Only Item Names & Qty</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPricesAndCash(true)}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                showPricesAndCash
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Show Prices & Billing</span>
            </button>
          </div>

          {/* Primary Clean Copy Button (NO Rs, NO Cash) */}
          <button
            type="button"
            onClick={handleCopyCleanList}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {copiedClean ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedClean ? 'Copied Item List!' : 'Copy Clean List'}</span>
          </button>

          {showPricesAndCash && (
            <button
              type="button"
              onClick={handleCopyFullBill}
              className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copiedFull ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Full Bill</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExcelExport}
            className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-neutral-600" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1F4E78] hover:bg-[#163857] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Quick 1-Click Item Picker Bar (no-print) */}
      <div className="no-print bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div 
          onClick={() => setShowQuickPicker(!showQuickPicker)}
          className="p-3.5 bg-neutral-50 hover:bg-neutral-100 cursor-pointer flex items-center justify-between border-b border-neutral-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-xs sm:text-sm font-bold text-neutral-900">
              ⚡ 1-Click Item Picker — Click any item below to add/select directly into this Demand List
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {demandItems.length} in demand
            </span>
          </div>
          <div className="flex items-center gap-2 text-neutral-500 text-xs">
            <span>{showQuickPicker ? 'Hide Picker' : 'Show Picker'}</span>
            {showQuickPicker ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {showQuickPicker && (
          <div className="p-4 space-y-3">
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search item to click & add..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Category tags */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {pickerCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPickerCategory(cat)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors ${
                      pickerCategory === cat
                        ? 'bg-[#1F4E78] text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Clickable Item Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-60 overflow-y-auto pr-1">
              {filteredPickerItems.map(item => {
                const isInDemand = item.status === 'DEMAND' || item.requiredQty > 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={`p-2 rounded-lg text-left border transition-all text-xs flex flex-col justify-between group cursor-pointer ${
                      isInDemand
                        ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-200'
                        : 'bg-neutral-50/60 border-neutral-200 hover:border-blue-400 hover:bg-blue-50/40'
                    }`}
                  >
                    <div className="font-semibold text-neutral-900 truncate w-full">
                      {item.name}
                    </div>
                    <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-neutral-200/60 text-[11px]">
                      <span className="text-neutral-500 truncate">{item.category}</span>
                      {isInDemand ? (
                        <span className="font-bold text-rose-600 tabular-nums">
                          +{item.requiredQty} {item.unit}
                        </span>
                      ) : (
                        <span className="text-neutral-400 group-hover:text-blue-600 font-bold">
                          + Add
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Paper Sheet */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl border border-neutral-200 shadow-md max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full print:m-0">
        
        {/* Top Header */}
        <div className="border-b-2 border-neutral-900 pb-6 flex flex-col sm:flex-row justify-between gap-4 print:pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#1F4E78] text-white flex items-center justify-center font-black text-sm print:bg-[#1F4E78] print:text-white print:border print:border-[#1F4E78]">
                DL
              </span>
              <span className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                {storeName}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1 font-medium">
              Food & Beverage Commercial Kitchen & Cafe
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <h1 className="text-2xl font-black uppercase text-[#1F4E78] tracking-wider print:text-xl print:text-[#1F4E78]">
              {showPricesAndCash ? 'PURCHASE INVOICE' : 'DAILY DEMAND LIST'}
            </h1>
            <div className="font-mono text-xs text-neutral-600 space-y-0.5">
              <div>
                <strong>PO #:</strong>{' '}
                <span className="hidden print:inline font-mono font-bold text-neutral-900">{invoiceNumber}</span>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="print:hidden font-mono text-xs border-b border-neutral-300 focus:border-blue-600 focus:outline-hidden text-right w-36 bg-transparent"
                />
              </div>
              <div className="flex items-center sm:justify-end gap-1 text-neutral-700">
                <Calendar className="w-3 h-3 text-neutral-400 print:hidden" />
                <span>Date: <strong className="text-neutral-900">{dateStr}</strong></span>
              </div>
              <div className="flex items-center sm:justify-end gap-1 text-neutral-700">
                <Clock className="w-3 h-3 text-neutral-400 print:hidden" />
                <span>Time: <strong className="text-neutral-900">{timeStr}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Info (Cleaned - NO CASH / PAYMENT STATUS if not in invoice mode) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs print:my-4 print:p-3 print:bg-neutral-50 print:border print:border-neutral-300 print-avoid-break">
          <div>
            <span className="font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Supplier / Destination
            </span>
            <div className="hidden print:block font-bold text-sm text-neutral-900">
              {supplierName || 'Standard Food Wholesale & Dist.'}
            </div>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Supplier or Wholesaler name..."
              className="print:hidden font-bold text-sm text-neutral-900 w-full bg-white border border-neutral-300 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="sm:text-right flex flex-col justify-center">
            <span className="font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Order Summary
            </span>
            <div className="font-mono text-xs text-neutral-700 space-y-0.5">
              <div>Total Items: <strong className="text-neutral-900">{lineItems.length} items</strong></div>
              <div>Total Units: <strong className="text-neutral-900">{totalDemandUnits} units</strong></div>
            </div>
          </div>
        </div>

        {/* Items Table (Clean: Only Name, Category, Required Quantity - NO Rs, NO Price Columns) */}
        <div className="overflow-x-auto my-6 print:my-4 print:overflow-visible">
          <table className="w-full text-left border-collapse text-xs sm:text-sm print:text-xs">
            <thead className="bg-[#1F4E78] text-white print:bg-[#1F4E78] print:text-white">
              <tr>
                <th className="py-2.5 px-3 w-8 print:py-2 print:px-2">#</th>
                <th className="py-2.5 px-3 print:py-2 print:px-2">Item Name</th>
                <th className="py-2.5 px-3 print:py-2 print:px-2">Category</th>
                <th className="py-2.5 px-3 text-right print:py-2 print:px-2">Required Quantity</th>
                {showPricesAndCash && (
                  <>
                    <th className="py-2.5 px-3 text-right print:py-2 print:px-2">Unit Price ({currency})</th>
                    <th className="py-2.5 px-3 text-right print:py-2 print:px-2">Total ({currency})</th>
                  </>
                )}
                <th className="py-2.5 px-3 w-10 text-center no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 print:divide-neutral-300">
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan={showPricesAndCash ? 7 : 5} className="py-12 text-center text-neutral-500">
                    <p className="font-semibold text-neutral-800 text-sm">No items currently in demand</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Click any item from the &quot;1-Click Item Picker&quot; above or click below to select items 1-by-1.
                    </p>
                    {onOpenItemSelectModal && (
                      <button
                        type="button"
                        onClick={onOpenItemSelectModal}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors no-print"
                      >
                        <MousePointerClick className="w-4 h-4" />
                        <span>Select Items 1-by-1 Now</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                lineItems.map((li, idx) => (
                  <tr key={li.itemId} className="hover:bg-neutral-50/80 group print:bg-white even:print:bg-neutral-50/60">
                    <td className="py-2.5 px-3 text-neutral-400 font-mono text-xs print:py-1.5 print:px-2 print:text-neutral-600">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-neutral-900 print:py-1.5 print:px-2">
                      {li.name}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-500 text-xs print:py-1.5 print:px-2 print:text-neutral-600">
                      {li.category}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900 tabular-nums print:py-1.5 print:px-2">
                      {/* Interactive Controls for Screen */}
                      <div className="no-print inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAdjustQty(li.itemId, -1)}
                          className="no-print w-6 h-6 rounded bg-neutral-100 hover:bg-rose-100 text-neutral-700 hover:text-rose-700 flex items-center justify-center transition-colors"
                          title="Decrease 1"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <input
                          type="number"
                          min="0"
                          value={li.qty}
                          onChange={(e) => handleSetExplicitQty(li.itemId, parseInt(e.target.value) || 0)}
                          className="w-14 text-right py-0.5 px-1 font-mono font-bold text-rose-600 text-sm border border-neutral-200 rounded focus:border-blue-500 focus:outline-hidden"
                        />
                        <span className="text-xs font-normal text-neutral-600 min-w-10 text-left">{li.unit}</span>

                        <button
                          type="button"
                          onClick={() => handleAdjustQty(li.itemId, 1)}
                          className="no-print w-6 h-6 rounded bg-neutral-100 hover:bg-blue-100 text-neutral-700 hover:text-blue-700 flex items-center justify-center transition-colors"
                          title="Increase 1"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Clean Print Presentation (No Buttons / Input Borders) */}
                      <div className="hidden print:block text-right">
                        <span className="text-rose-700 font-extrabold text-sm">+{li.qty}</span>{' '}
                        <span className="text-xs font-normal text-neutral-600">{li.unit}</span>
                      </div>
                    </td>
                    {showPricesAndCash && (
                      <>
                        <td className="py-2.5 px-3 text-right print:py-1.5 print:px-2">
                          <span className="hidden print:inline font-mono text-xs text-neutral-800">
                            {currency}{li.unitPrice}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={li.unitPrice}
                            onChange={(e) => handlePriceChange(li.itemId, parseFloat(e.target.value) || 0)}
                            className="print:hidden w-20 text-right py-0.5 px-1 font-mono text-xs border border-neutral-200 rounded focus:border-blue-500 focus:outline-hidden"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900 tabular-nums print:py-1.5 print:px-2">
                          {currency} {li.total.toLocaleString()}
                        </td>
                      </>
                    )}
                    <td className="py-2.5 px-3 text-center no-print">
                      <button
                        type="button"
                        onClick={() => handleRemoveFromDemand(li.itemId)}
                        className="text-neutral-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Remove from demand"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Section */}
        {showPricesAndCash ? (
          /* Detailed Pricing Section (Only when requested) */
          <div className="border-t border-neutral-300 pt-4 flex flex-col sm:flex-row justify-between gap-6 print:border-neutral-300 print-avoid-break">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider block">
                Dispatch Notes
              </label>
              <div className="hidden print:block text-xs text-neutral-800 p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 min-h-[3rem] whitespace-pre-wrap">
                {notes || 'No dispatch notes specified.'}
              </div>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="print:hidden w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden text-neutral-800"
              />
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-500">Subtotal:</span>
                <span className="font-mono font-bold text-neutral-900">
                  {currency} {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-neutral-900 text-white rounded-lg items-baseline print:bg-neutral-900 print:text-white">
                <span className="font-bold text-sm uppercase">Grand Total:</span>
                <span className="font-mono text-base font-black text-emerald-400 print:text-emerald-300">
                  {currency} {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Clean Requisition Summary (No Rs, No Cash, Pure Item Count) */
          <div className="border-t border-neutral-300 pt-4 flex flex-col sm:flex-row justify-between gap-4 print:border-neutral-300 print-avoid-break">
            <div className="flex-1">
              <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                Order Notes & Instructions
              </label>
              <div className="hidden print:block text-xs text-neutral-800 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                {notes || 'Delivery at kitchen dock. Please check temperature on arrival.'}
              </div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special instructions for supplier..."
                className="print:hidden w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden text-neutral-800"
              />
            </div>

            <div className="sm:text-right font-mono text-xs text-neutral-600 flex flex-col justify-center">
              <div>Total Items: <strong className="text-neutral-900">{lineItems.length} lines</strong></div>
              <div>Total Quantity: <strong className="text-rose-600 text-sm font-black">+{totalDemandUnits} units</strong></div>
            </div>
          </div>
        )}

        {/* Verification Signatures */}
        <div className="mt-12 pt-8 border-t border-neutral-300 grid grid-cols-2 gap-8 text-xs text-neutral-600 print:mt-8 print:pt-6 print:border-neutral-400 print-avoid-break">
          <div>
            <div className="border-b border-neutral-400 pb-8 mb-2 print:border-neutral-600" />
            <div className="font-semibold text-neutral-800">Prepared By (Kitchen Supervisor)</div>
            <div className="text-neutral-500 text-[11px]">{dateStr} at {timeStr}</div>
          </div>

          <div>
            <div className="border-b border-neutral-400 pb-8 mb-2 print:border-neutral-600" />
            <div className="font-semibold text-neutral-800">Received By (Supplier / Store)</div>
            <div className="text-neutral-500 text-[11px]">Signature & Date</div>
          </div>
        </div>

        {/* Official Document Footer in PDF/Print */}
        <div className="hidden print:flex justify-between items-center text-[10px] text-neutral-400 pt-6 mt-6 border-t border-neutral-200 print-avoid-break">
          <span>Official Store Demand & Requisition Document · Demand List Software</span>
          <span>Printed on {dateStr} at {timeStr}</span>
        </div>

      </div>

    </div>
  );
};

