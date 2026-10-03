import React, { useState } from 'react';
import { InventoryItem } from '../types.ts';
import { 
  Printer, 
  Share2, 
  Copy, 
  Check, 
  FileText, 
  CheckSquare, 
  Square,
  Building2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { formatSupplierOrderText } from '../utils/excel.ts';

interface PurchaseOrderViewProps {
  items: InventoryItem[];
  storeName: string;
  setStoreName: (name: string) => void;
}

export const PurchaseOrderView: React.FC<PurchaseOrderViewProps> = ({
  items,
  storeName,
  setStoreName
}) => {
  const [copied, setCopied] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const demandItems = items.filter(item => item.status === 'DEMAND' || item.requiredQty > 0);
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Group by category
  const groupedByCategory = demandItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const totalDemandQty = demandItems.reduce((sum, item) => sum + item.requiredQty, 0);

  const handleCopyWhatsApp = () => {
    const text = formatSupplierOrderText(items, storeName);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* Action Bar (Hidden during print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-[#1F4E78]" />
          <div>
            <label htmlFor="store-name-input" className="text-xs text-neutral-500 font-medium">Business / Location Name</label>
            <input
              id="store-name-input"
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="text-sm font-bold text-neutral-900 border-b border-neutral-300 hover:border-neutral-500 focus:border-blue-600 focus:outline-hidden bg-transparent"
              placeholder="e.g. Central Cafe & Kitchen"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs sm:text-sm font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Supplier Order!' : 'Copy Supplier Order (No Prices)'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#1F4E78] hover:bg-[#163857] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Requisition Slip</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="bg-white p-6 sm:p-10 rounded-xl border border-neutral-200 shadow-xs max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full print:m-0">
        
        {/* Document Header */}
        <div className="border-b-2 border-neutral-900 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 print:pb-4">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-neutral-500">
              Kitchen Restock Requisition
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-1 print:text-2xl">
              DAILY DEMAND LIST
            </h1>
            <p className="text-sm text-neutral-700 mt-1 font-bold">
              {storeName}
            </p>
          </div>

          <div className="text-left sm:text-right font-mono text-xs sm:text-sm text-neutral-600 space-y-1">
            <div className="flex items-center sm:justify-end gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400 print:hidden" />
              <span className="font-medium text-neutral-800">{todayStr}</span>
            </div>
            <div>
              Status: <span className="font-bold text-rose-600 print:text-neutral-900 uppercase">Restock Required</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 my-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200 text-center print:my-4 print:p-3 print:bg-neutral-50 print:border print:border-neutral-300 print-avoid-break">
          <div>
            <div className="text-xs text-neutral-500">Items to Reorder</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 tabular-nums">
              {demandItems.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Total Units Needed</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-rose-600 print:text-neutral-900 tabular-nums">
              +{totalDemandQty}
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Total Categories</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 tabular-nums">
              {Object.keys(groupedByCategory).length}
            </div>
          </div>
        </div>

        {/* Demand Items by Category */}
        {demandItems.length === 0 ? (
          <div className="py-12 text-center text-neutral-500">
            <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-base font-semibold text-neutral-800">
              All inventory levels are fully stocked!
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              No items currently show a deficit (Required Qty = 0).
            </p>
          </div>
        ) : (
          <div className="space-y-6 print:space-y-4">
            {Object.entries(groupedByCategory).map(([category, catItems]) => (
              <div key={category} className="space-y-2 print-avoid-break print:mb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#1F4E78] border-b border-neutral-200 pb-1 flex items-center justify-between print:border-neutral-300">
                  <span>{category}</span>
                  <span className="text-neutral-500 font-normal">
                    {catItems.length} {catItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="divide-y divide-neutral-100 print:divide-neutral-200">
                  {catItems.map((item) => {
                    const isChecked = !!checkedItems[item.id];

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleCheck(item.id)}
                        className={`py-2 px-2 flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50 rounded transition-colors print:py-1.5 print:px-1 ${
                          isChecked ? 'opacity-50 line-through print:opacity-100 print:no-underline' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Screen interactive checkbox */}
                          <button
                            type="button"
                            className="no-print text-neutral-400 hover:text-neutral-700"
                            aria-label={`Toggle check for ${item.name}`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>

                          {/* Print physical checkbox box [ ] */}
                          <span className="hidden print:inline-block w-3.5 h-3.5 rounded-sm border border-neutral-500 shrink-0" />

                          <div>
                            <span className="font-semibold text-sm text-neutral-900 print:text-xs">
                              {item.name}
                            </span>
                            {item.notes && (
                              <span className="ml-2 text-xs text-neutral-500 font-normal">
                                ({item.notes})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 text-right">
                          <div className="text-xs text-neutral-400 font-mono print:text-neutral-600">
                            Curr: {item.currentStock} / Prev: {item.previousStock}
                          </div>
                          <div className="font-mono text-base font-bold text-rose-600 print:text-neutral-900 print:text-sm min-w-[70px]">
                            +{item.requiredQty} <span className="text-xs font-normal text-neutral-600">{item.unit}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Verification and Signatures */}
        <div className="mt-12 pt-8 border-t border-neutral-300 grid grid-cols-2 gap-8 text-xs text-neutral-600 print:mt-8 print:pt-6 print:border-neutral-400 print-avoid-break">
          <div>
            <div className="border-b border-neutral-400 pb-8 mb-2 print:border-neutral-600" />
            <div className="font-semibold text-neutral-800">Prepared By (Kitchen Supervisor)</div>
            <div className="text-neutral-500 text-[11px]">Signature & Date</div>
          </div>

          <div>
            <div className="border-b border-neutral-400 pb-8 mb-2 print:border-neutral-600" />
            <div className="font-semibold text-neutral-800">Received & Approved (Store / Supplier)</div>
            <div className="text-neutral-500 text-[11px]">Signature & Date</div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-[11px] text-neutral-400 print:block print:mt-6 print:pt-4 print:border-t print:border-neutral-200 print-avoid-break">
          Demand List Software · Official Restock Requisition · Benchmark Formula: Required = MAX(0, Previous - Current)
        </div>

      </div>

    </div>
  );
};
