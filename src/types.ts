export interface InventoryItem {
  id: string;
  category: string;
  name: string;
  previousStock: number;
  currentStock: number;
  unit: string;
  unitPrice: number; // Cost / Estimated Price per unit for billing
  requiredQty: number;
  date: string;
  status: 'DEMAND' | 'OK';
  notes: string;
  parLevel?: number;
  supplier?: string;
  lastUpdatedDate?: string;
  lastUpdatedTime?: string;
  lastUpdated?: string;
}

export type ViewFilter = 'ALL' | 'DEMAND' | 'OK';

export interface CategorySummary {
  category: string;
  totalItems: number;
  demandItems: number;
  okItems: number;
  totalRequired: number;
  estimatedCost: number;
}

export interface StockSnapshot {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  title: string;
  items: InventoryItem[];
  totalDemandItems: number;
  totalEstimatedBill: number;
}

export interface InvoiceLineItem {
  itemId: string;
  name: string;
  category: string;
  unit: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface DemandInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  time: string;
  supplierName: string;
  storeName: string;
  currency: string;
  items: InvoiceLineItem[];
  subtotal: number;
  taxRatePercent: number;
  taxAmount: number;
  discountAmount: number;
  deliveryFee: number;
  grandTotal: number;
  paymentStatus: 'UNPAID' | 'PAID' | 'PARTIAL';
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT' | 'ONLINE';
  notes: string;
  dueDate?: string;
}
