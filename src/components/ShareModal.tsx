import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types.ts';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Truck, 
  FileText, 
  ListOrdered, 
  Layers, 
  Download,
  Calendar,
  Clock
} from 'lucide-react';
import { formatSupplierOrderText } from '../utils/excel.ts';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  storeName: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  items,
  storeName
}) => {
  const [copied, setCopied] = useState(false);
  const [listStyle, setListStyle] = useState<'categorized' | 'numbered'>('categorized');

  const demandItems = useMemo(() => {
    return items.filter(i => i.status === 'DEMAND' || i.requiredQty > 0);
  }, [items]);

  const totalDemandUnits = useMemo(() => {
    return demandItems.reduce((sum, item) => sum + item.requiredQty, 0);
  }, [demandItems]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Generate clean, non-financial text block with ONLY item names and quantities
  const orderText = useMemo(() => {
    if (demandItems.length === 0) {
      return `📦 *${storeName.toUpperCase()} - SUPPLIER PURCHASE ORDER*\n📅 Date: ${dateStr} · ⏰ Time: ${timeStr}\n\n✅ All inventory levels are sufficient. No items requiring replenishment.`;
    }

    let text = `📦 *${storeName.toUpperCase()} - SUPPLIER PURCHASE ORDER*\n`;
    text += `📅 Date: ${dateStr} · ⏰ Time: ${timeStr}\n`;
    text += `⚡ Total Items: ${demandItems.length} lines (${totalDemandUnits} total units)\n`;
    text += `--------------------------------------\n\n`;

    if (listStyle === 'categorized') {
      // Group by category
      const categories: Record<string, InventoryItem[]> = {};
      demandItems.forEach(item => {
        if (!categories[item.category]) categories[item.category] = [];
        categories[item.category].push(item);
      });

      let idx = 1;
      for (const [cat, catItems] of Object.entries(categories)) {
        text += `*${cat.toUpperCase()}*\n`;
        catItems.forEach(item => {
          text += `${idx}. *${item.name}* - ${item.requiredQty} ${item.unit || 'units'}`;
          if (item.notes) {
            text += ` [${item.notes}]`;
          }
          text += `\n`;
          idx++;
        });
        text += `\n`;
      }
    } else {
      // Continuous numbered list
      demandItems.forEach((item, idx) => {
        text += `${idx + 1}. *${item.name}* - ${item.requiredQty} ${item.unit || 'units'}`;
        if (item.category) {
          text += ` (${item.category})`;
        }
        if (item.notes) {
          text += ` [${item.notes}]`;
        }
        text += `\n`;
      });
      text += `\n`;
    }

    text += `--------------------------------------\n`;
    text += `Generated via Demand List Software (Supplier View)`;

    return text;
  }, [demandItems, storeName, listStyle, dateStr, timeStr, totalDemandUnits]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(orderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(orderText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([orderText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Supplier_Order_${dateStr.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] shadow-2xl border border-neutral-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header - Professional Supplier View */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F4E78] text-white flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-neutral-900 text-base sm:text-lg leading-tight">
                  Supplier View
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                  Non-Financial Order
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Clean item list for vendor dispatch (zero prices, zero cash/status references)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="px-5 py-2.5 bg-neutral-100/70 border-b border-neutral-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-neutral-600 font-medium">Layout Style:</span>
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-neutral-200">
            <button
              type="button"
              onClick={() => setListStyle('categorized')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                listStyle === 'categorized'
                  ? 'bg-[#1F4E78] text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>By Category</span>
            </button>
            <button
              type="button"
              onClick={() => setListStyle('numbered')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                listStyle === 'numbered'
                  ? 'bg-[#1F4E78] text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Continuous 1-2-3</span>
            </button>
          </div>
        </div>

        {/* Content Body: Order Text Block */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>{demandItems.length} items to supply ({totalDemandUnits} total units)</span>
            <span className="font-mono">{dateStr} · {timeStr}</span>
          </div>

          <div className="relative">
            <textarea
              readOnly
              rows={13}
              value={orderText}
              className="w-full p-3.5 font-mono text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden text-neutral-800 resize-none leading-relaxed select-all"
            />
          </div>

          <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-[11px] text-neutral-500 flex items-center justify-between">
            <span>✅ Professional Order List: Only item names, quantities, and units.</span>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="text-[#1F4E78] hover:underline font-semibold flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Download .txt</span>
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Send via WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-5 py-2 text-xs sm:text-sm font-bold text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Supplier Order!' : 'Copy Supplier Order'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
