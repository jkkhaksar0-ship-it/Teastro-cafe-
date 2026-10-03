import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle, CheckCircle, Save } from 'lucide-react';

interface RolloverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteRollover: (mode: 'ROLL_AND_ZERO' | 'ROLL_AND_KEEP') => void;
  totalItems: number;
}

export const RolloverModal: React.FC<RolloverModalProps> = ({
  isOpen,
  onClose,
  onExecuteRollover,
  totalItems
}) => {
  const [mode, setMode] = useState<'ROLL_AND_ZERO' | 'ROLL_AND_KEEP'>('ROLL_AND_KEEP');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-sm sm:text-base">
                Stock Rollover / New Cycle
              </h3>
              <p className="text-xs text-neutral-500">
                Update stock benchmarks across {totalItems} items
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

        {/* Content */}
        <div className="p-5 space-y-4 text-xs sm:text-sm">
          <p className="text-neutral-600">
            Choose how you would like to roll over your inventory data for the next shift or audit cycle:
          </p>

          <div className="space-y-3">
            <label 
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                mode === 'ROLL_AND_KEEP' 
                  ? 'border-neutral-900 bg-neutral-50/70 ring-1 ring-neutral-900/10' 
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <input
                type="radio"
                name="rollover_mode"
                checked={mode === 'ROLL_AND_KEEP'}
                onChange={() => setMode('ROLL_AND_KEEP')}
                className="mt-0.5"
              />
              <div>
                <strong className="block text-neutral-900 font-semibold">
                  Update Benchmarks (Prev = Current)
                </strong>
                <span className="text-neutral-500 text-xs">
                  Sets Previous Stock to match your Current Stock counts. Required Qty becomes 0 (all OK) while keeping current values in place.
                </span>
              </div>
            </label>

            <label 
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                mode === 'ROLL_AND_ZERO' 
                  ? 'border-neutral-900 bg-neutral-50/70 ring-1 ring-neutral-900/10' 
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <input
                type="radio"
                name="rollover_mode"
                checked={mode === 'ROLL_AND_ZERO'}
                onChange={() => setMode('ROLL_AND_ZERO')}
                className="mt-0.5"
              />
              <div>
                <strong className="block text-neutral-900 font-semibold">
                  Fresh Daily Audit (Prev = Current, Current = 0)
                </strong>
                <span className="text-neutral-500 text-xs">
                  Sets Previous Stock to Current Stock, and resets Current Stock to 0. Perfect when beginning a full physical kitchen walk-through.
                </span>
              </div>
            </label>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              A safety backup snapshot will automatically be saved in your Audit History before applying this rollover.
            </span>
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
              type="button"
              onClick={() => {
                onExecuteRollover(mode);
                onClose();
              }}
              className="px-5 py-2 text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Apply Rollover</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
