import React, { useState } from 'react';
import { InventoryItem } from '../types.ts';
import { 
  X, 
  Plus, 
  PackagePlus, 
  ListPlus, 
  Library, 
  Check, 
  Sparkles, 
  Layers 
} from 'lucide-react';
import { COMMON_UNITS, PRESET_LIBRARY_ITEMS, DEFAULT_CATEGORIES } from '../data/initialItems.ts';

interface BulkAddItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  existingItemNames: Set<string>;
  onAddSingleItem: (item: Omit<InventoryItem, 'id'>) => void;
  onAddMultipleItems: (items: Omit<InventoryItem, 'id'>[]) => void;
  currency: string;
}

export const BulkAddItemsModal: React.FC<BulkAddItemsModalProps> = ({
  isOpen,
  onClose,
  categories,
  existingItemNames,
  onAddSingleItem,
  onAddMultipleItems,
  currency
}) => {
  const [tab, setTab] = useState<'single' | 'bulk' | 'library'>('single');

  // Single Item form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Other Food Items');
  const [newCatName, setNewCatName] = useState('');
  const [isNewCat, setIsNewCat] = useState(false);
  const [unit, setUnit] = useState('packs');
  const [unitPrice, setUnitPrice] = useState<number>(150);
  const [prevStock, setPrevStock] = useState<number>(10);
  const [currStock, setCurrStock] = useState<number>(0);
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');

  // Bulk Add form state (Textarea)
  const [bulkText, setBulkText] = useState(
    "Caramel Sauce, Sauces / Spreads, 10, 2, bottles, 650\n" +
    "Burger Buns, Dairy & Bakery, 30, 8, packets, 220\n" +
    "Paper Cups 12oz, Packaging & Disposables, 20, 5, sleeves, 380\n" +
    "Garlic Mayo, Sauces / Spreads, 8, 3, tubs, 950"
  );

  // Library items state: track added IDs
  const [addedLibraryNames, setAddedLibraryNames] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Handle single item submit
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCat = isNewCat && newCatName.trim() ? newCatName.trim() : category;
    const prev = Math.max(0, Number(prevStock) || 0);
    const curr = Math.max(0, Number(currStock) || 0);
    const required = Math.max(0, prev - curr);

    onAddSingleItem({
      name: name.trim(),
      category: finalCat,
      unit: unit.trim() || 'units',
      unitPrice: Math.max(0, Number(unitPrice) || 0),
      previousStock: prev,
      currentStock: curr,
      requiredQty: required,
      date: dateStr,
      status: required > 0 ? 'DEMAND' : 'OK',
      notes: notes.trim(),
      supplier: supplier.trim(),
      lastUpdatedDate: dateStr,
      lastUpdatedTime: timeStr,
      lastUpdated: timeStr
    });

    setName('');
    setNotes('');
    setSupplier('');
    onClose();
  };

  // Handle bulk lines submit
  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const parsedItems: Omit<InventoryItem, 'id'>[] = [];

    lines.forEach((line) => {
      // Check if CSV formatted: Name, Category, Prev, Curr, Unit, Price, Notes
      const parts = line.split(',').map(p => p.trim());
      const itemName = parts[0];
      if (!itemName) return;

      const itemCategory = parts[1] || 'Other Food Items';
      const prev = !isNaN(Number(parts[2])) ? Number(parts[2]) : 10;
      const curr = !isNaN(Number(parts[3])) ? Number(parts[3]) : 0;
      const itemUnit = parts[4] || 'packs';
      const price = !isNaN(Number(parts[5])) ? Number(parts[5]) : 100;
      const itemNotes = parts[6] || '';
      const req = Math.max(0, prev - curr);

      parsedItems.push({
        name: itemName,
        category: itemCategory,
        previousStock: prev,
        currentStock: curr,
        unit: itemUnit,
        unitPrice: price,
        requiredQty: req,
        date: dateStr,
        status: req > 0 ? 'DEMAND' : 'OK',
        notes: itemNotes,
        lastUpdatedDate: dateStr,
        lastUpdatedTime: timeStr,
        lastUpdated: timeStr
      });
    });

    if (parsedItems.length > 0) {
      onAddMultipleItems(parsedItems);
      onClose();
    }
  };

  // Handle 1-click library item add
  const handleAddLibraryItem = (preset: typeof PRESET_LIBRARY_ITEMS[0]) => {
    const prev = 10;
    const curr = 2; // Default to having a slight demand for demo
    const req = Math.max(0, prev - curr);

    onAddSingleItem({
      name: preset.name,
      category: preset.category,
      unit: preset.unit,
      unitPrice: preset.price,
      previousStock: prev,
      currentStock: curr,
      requiredQty: req,
      date: dateStr,
      status: req > 0 ? 'DEMAND' : 'OK',
      notes: preset.notes,
      lastUpdatedDate: dateStr,
      lastUpdatedTime: timeStr,
      lastUpdated: timeStr
    });

    setAddedLibraryNames(prevSet => new Set([...prevSet, preset.name]));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-neutral-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1F4E78] text-white flex items-center justify-center shadow-xs">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-sm sm:text-base">
                Add More Items to Inventory
              </h3>
              <p className="text-xs text-neutral-500">
                Single item, multi-item bulk paste, or 1-click cafe preset library
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

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-neutral-200 bg-white flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setTab('single')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'single'
                ? 'border-[#1F4E78] text-[#1F4E78]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Single Item</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('bulk')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'bulk'
                ? 'border-[#1F4E78] text-[#1F4E78]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <ListPlus className="w-4 h-4" />
            <span>Multi-Item Bulk Add</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('library')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'library'
                ? 'border-[#1F4E78] text-[#1F4E78]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Library className="w-4 h-4" />
            <span>Cafe & Kitchen Presets</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs sm:text-sm">
          
          {/* TAB 1: Single Item */}
          {tab === 'single' && (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Caramel Drizzle, French Baguette, Heavy Cream..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-neutral-700">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNewCat(!isNewCat)}
                    className="text-xs text-[#1F4E78] hover:underline font-medium"
                  >
                    {isNewCat ? 'Choose Existing' : '+ Custom Category'}
                  </button>
                </div>

                {isNewCat ? (
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Enter new category name..."
                    className="w-full px-3 py-2 border border-blue-400 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    autoFocus
                  />
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Unit & Unit Price for Billing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Unit of Measure
                  </label>
                  <input
                    type="text"
                    list="units-list"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="packs, kg, bottles..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                  <datalist id="units-list">
                    {COMMON_UNITS.map(u => <option key={u} value={u} />)}
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Unit Price / Cost ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-right focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Stock Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Previous Stock (Benchmark)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={prevStock}
                    onChange={(e) => setPrevStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-right focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Current Stock on Hand
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currStock}
                    onChange={(e) => setCurrStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-right focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Supplier & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Supplier / Vendor (Optional)
                  </label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="e.g. Metro Wholesale, Dairy Direct"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Notes & Specifications
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Storage location, brand, size..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-[#1F4E78] hover:bg-[#163857] rounded-lg shadow-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item to Inventory</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Multi-Item Bulk Add */}
          {tab === 'bulk' && (
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-600">
                <strong>Fast Bulk Paste Format:</strong> One item per line in format:<br />
                <code className="font-mono bg-neutral-200/80 px-1 py-0.5 rounded text-neutral-800">
                  Item Name, Category, Previous Stock, Current Stock, Unit, Unit Price
                </code>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Enter or Paste Multiple Items
                </label>
                <textarea
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full p-3 font-mono text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Paste your items list here..."
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  {bulkText.split('\n').filter(l => l.trim()).length} lines detected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-white bg-[#1F4E78] hover:bg-[#163857] rounded-lg shadow-xs font-semibold flex items-center gap-1.5"
                  >
                    <ListPlus className="w-4 h-4" />
                    <span>Import All Items</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: Pre-built Cafe & Kitchen Library */}
          {tab === 'library' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-500">
                Tap <strong>+ Add</strong> on any commercial cafe & kitchen staple to add it directly to your inventory catalog:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESET_LIBRARY_ITEMS.map((preset) => {
                  const alreadyExists = existingItemNames.has(preset.name.toLowerCase()) || addedLibraryNames.has(preset.name);

                  return (
                    <div
                      key={preset.name}
                      className="p-3 bg-neutral-50 hover:bg-neutral-100/80 rounded-xl border border-neutral-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                          {preset.category}
                        </span>
                        <div className="font-bold text-neutral-900 truncate">
                          {preset.name}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {preset.unit} · {currency}{preset.price}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={alreadyExists}
                        onClick={() => handleAddLibraryItem(preset)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          alreadyExists
                            ? 'bg-emerald-100 text-emerald-800 cursor-default'
                            : 'bg-[#1F4E78] text-white hover:bg-[#163857]'
                        }`}
                      >
                        {alreadyExists ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>In Catalog</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-neutral-200 text-right">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
