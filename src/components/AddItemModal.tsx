import React, { useState } from 'react';
import { InventoryItem } from '../types.ts';
import { X, Plus, PackagePlus } from 'lucide-react';
import { COMMON_UNITS } from '../data/initialItems.ts';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddItem
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Other Food Items');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [unit, setUnit] = useState('packs');
  const [previousStock, setPreviousStock] = useState<number>(10);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = isAddingCustomCategory && newCategoryName.trim()
      ? newCategoryName.trim()
      : category;

    const prev = Math.max(0, Number(previousStock) || 0);
    const curr = Math.max(0, Number(currentStock) || 0);
    const required = Math.max(0, prev - curr);
    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    onAddItem({
      name: name.trim(),
      category: finalCategory,
      unit: unit.trim() || 'units',
      unitPrice: 100,
      previousStock: prev,
      currentStock: curr,
      requiredQty: required,
      date: today,
      status: required > 0 ? 'DEMAND' : 'OK',
      notes: notes.trim(),
      lastUpdatedDate: today,
      lastUpdatedTime: timeStr,
      lastUpdated: timeStr
    });

    // Reset form
    setName('');
    setPreviousStock(10);
    setCurrentStock(0);
    setNotes('');
    setIsAddingCustomCategory(false);
    setNewCategoryName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1F4E78] text-white flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-sm sm:text-base">
                Add Inventory Item
              </h3>
              <p className="text-xs text-neutral-500">
                Track stock and calculate demand automatically
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          
          {/* Name */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. KitKat Chocolate, Nutella, Wrap Bread..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-neutral-700">
                Category / Department *
              </label>
              <button
                type="button"
                onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
                className="text-xs text-[#1F4E78] hover:underline font-medium"
              >
                {isAddingCustomCategory ? 'Choose Existing' : '+ New Category'}
              </button>
            </div>

            {isAddingCustomCategory ? (
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
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

          {/* Unit & Benchmark Par */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                list="common-units"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="packs, kg, cans..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
              <datalist id="common-units">
                {COMMON_UNITS.map(u => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Previous / Benchmark Stock
              </label>
              <input
                type="number"
                min="0"
                value={previousStock}
                onChange={(e) => setPreviousStock(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono tabular-nums text-right focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Current Stock */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Initial Current Stock on Hand
            </label>
            <input
              type="number"
              min="0"
              value={currentStock}
              onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono tabular-nums text-right focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Required Qty will be: <strong className="text-neutral-800">{Math.max(0, previousStock - currentStock)}</strong>
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Notes & Specifications (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Storage shelf, brand, package size..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-white bg-[#1F4E78] hover:bg-[#163857] rounded-lg shadow-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Demand List</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
