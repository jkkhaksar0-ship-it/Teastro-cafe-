import * as XLSX from 'xlsx';
import { InventoryItem, DemandInvoice } from '../types.ts';

export function exportDemandListToExcel(items: InventoryItem[], filename?: string, currency = 'Rs.') {
  const wb = XLSX.utils.book_new();

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const actualFilename = filename || `Demand_List_${dateStr}_${now.getHours()}-${now.getMinutes()}.xlsx`;

  // Sheet 1: Demand List
  const headers = [
    "Category",
    "Item Name",
    "Previous Stock",
    "Current Stock",
    "Required Qty",
    "Unit",
    `Unit Price (${currency})`,
    `Estimated Total (${currency})`,
    "Date",
    "Time",
    "Status",
    "Notes"
  ];

  const rows = items.map(item => {
    const unitPrice = item.unitPrice || 0;
    const estTotal = item.requiredQty * unitPrice;
    return [
      item.category,
      item.name,
      item.previousStock,
      item.currentStock,
      item.requiredQty,
      item.unit || 'units',
      unitPrice,
      estTotal,
      item.lastUpdatedDate || item.date || dateStr,
      item.lastUpdatedTime || item.lastUpdated || timeStr,
      item.status,
      item.notes || ''
    ];
  });

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 22 }, // Category
    { wch: 28 }, // Name
    { wch: 14 }, // Prev
    { wch: 14 }, // Curr
    { wch: 14 }, // Req
    { wch: 14 }, // Unit
    { wch: 16 }, // Unit Price
    { wch: 18 }, // Est Total
    { wch: 14 }, // Date
    { wch: 14 }, // Time
    { wch: 14 }, // Status
    { wch: 28 }  // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Demand List");

  // Sheet 2: Summary & Billing Overview
  const demandCount = items.filter(i => i.status === 'DEMAND').length;
  const okCount = items.filter(i => i.status === 'OK').length;
  const totalUnits = items.reduce((sum, i) => sum + i.requiredQty, 0);
  const totalEstimatedBill = items.reduce((sum, i) => sum + (i.requiredQty * (i.unitPrice || 0)), 0);

  const summaryData = [
    ["DEMAND & BILLING SUMMARY", ""],
    ["Generated Timestamp", `${dateStr} at ${timeStr}`],
    ["", ""],
    ["Total Catalog Items", items.length],
    ["Items Requiring Demand", demandCount],
    ["Items Stock OK", okCount],
    ["Total Reorder Units", totalUnits],
    [`Total Estimated Bill (${currency})`, totalEstimatedBill],
    ["", ""],
    ["How to use", ""],
    ["1. Enter Previous Stock and Current Stock.", ""],
    ["2. Required Qty calculates automatically (MAX(0, Prev - Current)).", ""],
    ["3. Estimated Total calculates line-by-line (Required Qty * Unit Price).", ""],
    ["4. DEMAND means stock has decreased and needs replenishment.", ""]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 45 },
    { wch: 25 }
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // Trigger write and download
  XLSX.writeFile(wb, actualFilename);
}

export function exportInvoiceToExcel(invoice: DemandInvoice) {
  const wb = XLSX.utils.book_new();

  const headers = [
    "#",
    "Item Name",
    "Category",
    "Unit",
    "Required Qty",
    `Unit Price (${invoice.currency})`,
    `Total (${invoice.currency})`
  ];

  const rows = invoice.items.map((it, idx) => [
    idx + 1,
    it.name,
    it.category,
    it.unit,
    it.qty,
    it.unitPrice,
    it.total
  ]);

  const summaryRows = [
    ["", "", "", "", "", "Subtotal:", invoice.subtotal],
    ["", "", "", "", "", `Tax (${invoice.taxRatePercent}%):`, invoice.taxAmount],
    ["", "", "", "", "", "Discount:", -invoice.discountAmount],
    ["", "", "", "", "", "Delivery Fee:", invoice.deliveryFee],
    ["", "", "", "", "", "GRAND TOTAL:", invoice.grandTotal],
  ];

  const metaRows = [
    [`DEMAND ORDER INVOICE: ${invoice.invoiceNumber}`, ""],
    [`Store / Location: ${invoice.storeName}`, ""],
    [`Supplier: ${invoice.supplierName || 'General Supplier'}`, ""],
    [`Invoice Date: ${invoice.date} | Time: ${invoice.time}`, ""],
    [`Payment Status: ${invoice.paymentStatus} | Method: ${invoice.paymentMethod}`, ""],
    ["", ""]
  ];

  const wsData = [...metaRows, headers, ...rows, ["", "", "", "", "", "", ""], ...summaryRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 20 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Invoice Bill");
  XLSX.writeFile(wb, `Invoice_${invoice.invoiceNumber}.xlsx`);
}

export async function parseExcelOrCsvFile(file: File): Promise<Partial<InventoryItem>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames.includes("Demand List") 
          ? "Demand List" 
          : workbook.SheetNames[0];

        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

        if (!json || json.length < 2) {
          throw new Error("File is empty or missing headers");
        }

        const rawHeaders = (json[0] || []).map(h => (h || '').toString().toLowerCase().trim());
        
        const catIdx = rawHeaders.findIndex(h => h.includes('category'));
        const nameIdx = rawHeaders.findIndex(h => h.includes('item') || h.includes('name'));
        const prevIdx = rawHeaders.findIndex(h => h.includes('prev') || h.includes('previous'));
        const currIdx = rawHeaders.findIndex(h => h.includes('curr') || h.includes('current'));
        const priceIdx = rawHeaders.findIndex(h => h.includes('price') || h.includes('cost') || h.includes('rate'));
        const unitIdx = rawHeaders.findIndex(h => h.includes('unit'));
        const notesIdx = rawHeaders.findIndex(h => h.includes('note') || h.includes('remark'));

        const parsedItems: Partial<InventoryItem>[] = [];

        for (let r = 1; r < json.length; r++) {
          const row = json[r];
          if (!row || row.length === 0) continue;

          const itemName = nameIdx >= 0 && row[nameIdx] ? String(row[nameIdx]).trim() : '';
          if (!itemName) continue;

          const category = catIdx >= 0 && row[catIdx] ? String(row[catIdx]).trim() : 'General';
          const prev = prevIdx >= 0 && !isNaN(Number(row[prevIdx])) ? Number(row[prevIdx]) : 0;
          const curr = currIdx >= 0 && !isNaN(Number(row[currIdx])) ? Number(row[currIdx]) : 0;
          const price = priceIdx >= 0 && !isNaN(Number(row[priceIdx])) ? Number(row[priceIdx]) : 100;
          const unit = unitIdx >= 0 && row[unitIdx] ? String(row[unitIdx]).trim() : 'units';
          const notes = notesIdx >= 0 && row[notesIdx] ? String(row[notesIdx]).trim() : '';

          parsedItems.push({
            name: itemName,
            category,
            previousStock: prev,
            currentStock: curr,
            unitPrice: price,
            unit,
            notes
          });
        }

        resolve(parsedItems);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function formatSupplierOrderText(
  items: InventoryItem[], 
  storeName = "Central Kitchen & Cafe"
): string {
  const demandItems = items.filter(i => i.status === 'DEMAND' || i.requiredQty > 0);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (demandItems.length === 0) {
    return `📦 *${storeName.toUpperCase()} - SUPPLIER PURCHASE ORDER*\n📅 Date: ${dateStr} · ⏰ Time: ${timeStr}\n\n✅ All items are currently well-stocked. No replenishment needed.`;
  }

  const totalUnits = demandItems.reduce((sum, i) => sum + i.requiredQty, 0);

  let text = `📦 *${storeName.toUpperCase()} - SUPPLIER PURCHASE ORDER*\n`;
  text += `📅 Date: ${dateStr} · ⏰ Time: ${timeStr}\n`;
  text += `⚡ Total Items: ${demandItems.length} lines (${totalUnits} total units)\n`;
  text += `--------------------------------------\n\n`;

  // Group by category
  const categories: Record<string, InventoryItem[]> = {};
  for (const item of demandItems) {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  }

  let itemIdx = 1;
  for (const [cat, catItems] of Object.entries(categories)) {
    text += `*${cat.toUpperCase()}*\n`;
    catItems.forEach((item) => {
      text += `${itemIdx}. *${item.name}* - ${item.requiredQty} ${item.unit || 'units'}`;
      if (item.notes) {
        text += ` [${item.notes}]`;
      }
      text += `\n`;
      itemIdx++;
    });
    text += `\n`;
  }

  text += `--------------------------------------\n`;
  text += `Generated via Demand List Software (Supplier View)`;

  return text;
}

export function formatWhatsAppDemandText(
  items: InventoryItem[], 
  storeName = "Kitchen & Cafe Demand",
  _includePrices = false,
  _currency = 'Rs.'
): string {
  return formatSupplierOrderText(items, storeName);
}
